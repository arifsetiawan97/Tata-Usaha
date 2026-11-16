import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  ImageRun
} from 'docx';
import {
  SchoolConfig,
  MonthlyReport,
  AnnualReport,
  RoleType,
  TaskLog,
  InventoryItem,
  TupoksiDefinitionsMap,
  LibraryBookItem,
  LibraryMemberItem,
  LibraryMemberStats
} from '../types';
import {
  isTaskInMonth,
  isTaskInYear,
  getTaskClassification,
  OFFICIAL_TUPOKSI_DEFINITIONS
} from './taskClassification';
import { calculateAnnualPerformanceSummary } from './annualPerformanceHelper';
import { ROLE_OPERATIONAL_SPECS } from '../data/roleOperationalSpecs';
import {
  formatOfficialNameWithDegree,
  formatOfficialNipOrPppk,
  isMemberJoinedInMonth
} from './formatters';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// A4 Standard (11906 x 16838 twips / DXA)
// Margin Resmi Dinas: Top 3 cm (1701), Left 4 cm (2268), Bottom 3 cm (1701), Right 3 cm (1701)
export const PAGE_WIDTH_DXA = 11906;
export const PAGE_HEIGHT_DXA = 16838;
export const MARGIN_TOP_DXA = 1701;    // 3.0 cm
export const MARGIN_LEFT_DXA = 2268;   // 4.0 cm
export const MARGIN_BOTTOM_DXA = 1701; // 3.0 cm
export const MARGIN_RIGHT_DXA = 1701;  // 3.0 cm

// Printable content width = 11906 - (2268 + 1701) = 7937 DXA
export const CONTENT_WIDTH_DXA = PAGE_WIDTH_DXA - (MARGIN_LEFT_DXA + MARGIN_RIGHT_DXA); // 7937

export const FONT_FAMILY = 'Times New Roman';

// Line spacing 1.15 (line: 276) and after 6 pt (after: 120)
const STANDARD_PARAGRAPH_SPACING = {
  line: 276,
  after: 120
};

const COMPACT_PARAGRAPH_SPACING = {
  line: 260,
  after: 60
};

const thinBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '334155'
};

const tableBordersAll = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
  insideHorizontal: thinBorder,
  insideVertical: thinBorder
};

const noBorder = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'auto'
};

const tableBordersNone = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder,
  insideHorizontal: noBorder,
  insideVertical: noBorder
};

export interface OfficialDocxParams {
  reportType: 'monthly' | 'annual';
  reportData: MonthlyReport | AnnualReport;
  schoolConfig: SchoolConfig;
  tasks: TaskLog[];
  inventories: InventoryItem[];
  tupoksiDefinitions?: TupoksiDefinitionsMap;
  manualDate?: string;
  nomorSurat?: string;
  libraryBooks?: LibraryBookItem[];
  libraryMembers?: LibraryMemberItem[];
  libraryMemberStats?: LibraryMemberStats;
}

export interface LibraryMemberDocxParams {
  schoolConfig: SchoolConfig;
  libraryMembers: LibraryMemberItem[];
  memberStats?: LibraryMemberStats;
  nomorDokumen?: string;
  manualDate?: string;
  includeFullList?: boolean;
  additionMonth?: number | 'all';
  additionYear?: number;
}

export interface LibraryBooksDocxParams {
  schoolConfig: SchoolConfig;
  books: LibraryBookItem[];
  docTitle?: string;
  docSubtitle?: string;
  nomorSurat?: string;
  manualDate?: string;
}

export interface InventoryKirDocxParams {
  schoolConfig: SchoolConfig;
  role: RoleType;
  roleTitle: string;
  inventories: InventoryItem[];
  manualDate?: string;
}

type DocxAlignment = (typeof AlignmentType)[keyof typeof AlignmentType];

/**
 * Default SVG logos matching KopSurat.tsx for crisp fallback in .docx
 */
const DEFAULT_LEFT_LOGO_SVG = `<svg viewBox="0 0 120 140" width="120" height="140" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 4 C95 4, 114 15, 114 42 C114 85, 78 122, 60 136 C42 122, 6 85, 6 42 C6 15, 25 4, 60 4 Z" fill="#1e3a8a" stroke="#d97706" stroke-width="4"/>
  <path d="M60 10 C90 10, 107 19, 107 43 C107 81, 75 115, 60 128 C45 115, 13 81, 13 43 C13 19, 30 10, 60 10 Z" fill="none" stroke="#fef08a" stroke-width="1.5"/>
  <polygon points="60,18 63,27 72,27 65,33 67,42 60,37 53,42 55,33 48,27 57,27" fill="#fde047"/>
  <polygon points="60,50 38,84 82,84" fill="#22c55e"/>
  <path d="M28 112 Q60 106 92 112 L88 122 Q60 116 32 122 Z" fill="#b91c1c"/>
  <text x="60" y="119" text-anchor="middle" font-size="8" font-weight="bold" fill="#ffffff" font-family="Arial, sans-serif">PEMDA</text>
</svg>`;

const DEFAULT_RIGHT_LOGO_SVG = `<svg viewBox="0 0 120 140" width="120" height="140" xmlns="http://www.w3.org/2000/svg">
  <polygon points="60,6 112,44 92,126 28,126 8,44" fill="#0284c7" stroke="#fbbf24" stroke-width="4"/>
  <polygon points="60,13 105,47 87,120 33,120 15,47" fill="none" stroke="#ffffff" stroke-width="1.5"/>
  <path d="M60 46 C42 46, 26 62, 28 88 C38 82, 48 80, 60 84 C72 80, 82 82, 92 88 C94 62, 78 46, 60 46 Z" fill="#f59e0b"/>
  <path d="M60 28 C64 36, 68 40, 68 46 C68 50, 64 54, 60 54 C56 54, 52 50, 52 46 C52 40, 56 36, 60 28 Z" fill="#ef4444"/>
  <path d="M60 88 C48 82, 34 84, 26 94 L26 98 C34 88, 48 86, 60 92 C72 86, 86 88, 94 98 L94 94 C86 84, 72 82, 60 88 Z" fill="#ffffff"/>
  <text x="60" y="122" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#ffffff" font-family="Arial, sans-serif">TUT WURI</text>
</svg>`;

/**
 * Convert any browser image source (data URL, blob URL, http URL, or SVG string) to PNG Uint8Array
 * so docx ImageRun embeds crisp logos & signature images reliably.
 */
export async function imageSourceToPngBytes(
  src?: string,
  fallbackKind?: 'left' | 'right',
  targetSize: { maxW: number; maxH: number } = { maxW: 150, maxH: 150 }
): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return null;
  }

  let effectiveSrc = (src || '').trim();
  if (!effectiveSrc && fallbackKind) {
    const svgText = fallbackKind === 'left' ? DEFAULT_LEFT_LOGO_SVG : DEFAULT_RIGHT_LOGO_SVG;
    effectiveSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
  }

  if (!effectiveSrc) return null;

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const imageEl = new Image();
      if (!effectiveSrc.startsWith('data:') && !effectiveSrc.startsWith('blob:')) {
        imageEl.crossOrigin = 'anonymous';
      }
      imageEl.onload = () => resolve(imageEl);
      imageEl.onerror = (err) => reject(err);
      imageEl.src = effectiveSrc;
    });

    const natW = img.naturalWidth || img.width || 120;
    const natH = img.naturalHeight || img.height || 120;
    const scale = Math.min(targetSize.maxW / natW, targetSize.maxH / natH, 2);
    const renderW = Math.max(24, Math.round(natW * scale));
    const renderH = Math.max(24, Math.round(natH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = renderW * 2;
    canvas.height = renderH * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    );
    if (!pngBlob) return null;

    const buffer = await pngBlob.arrayBuffer();
    const displayScale = Math.min(62 / natW, 68 / natH);
    return {
      data: new Uint8Array(buffer),
      width: Math.max(32, Math.round(natW * displayScale)),
      height: Math.max(32, Math.round(natH * displayScale))
    };
  } catch {
    // Jika gagal memuat logo custom URL karena CORS, fallback ke logo default jika diminta
    if (src && fallbackKind) {
      return imageSourceToPngBytes(undefined, fallbackKind, targetSize);
    }
    return null;
  }
}

/**
 * Download a generated docx document as a native .docx file in the browser
 */
export async function downloadDocxFile(doc: Document, filename: string): Promise<void> {
  const blob = await Packer.toBlob(doc);
  const cleanFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Creates 3-Column Official Kop Surat Table matching KopSurat.tsx 1:1
 * [Logo Kiri | Teks Instansi Sekolah | Logo Kanan] + Double Bottom Border
 */
export async function createKopSuratTable(config: SchoolConfig): Promise<Table> {
  const leftSrc = config.logoKopKiri || config.logoKabupatenUrl;
  const rightSrc = config.logoKopKanan || config.logoSekolahUrl;

  const [leftPng, rightPng] = await Promise.all([
    imageSourceToPngBytes(leftSrc, 'left', { maxW: 160, maxH: 180 }),
    imageSourceToPngBytes(rightSrc, 'right', { maxW: 160, maxH: 180 })
  ]);

  const pemda = (config.pemerintahDaerah || '').trim().toUpperCase();
  const dinas = (config.dinasPendidikan || '').trim().toUpperCase();
  const sekolah = (config.namaSekolah || 'SATUAN PENDIDIKAN').trim().toUpperCase();

  const alamatLine = [
    config.alamat,
    config.desaKecamatan,
    config.kabupatenKota,
    config.provinsi
  ]
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .join(', ') + (config.kodePos?.trim() ? ` Kode Pos ${config.kodePos.trim()}` : '');

  const kontakLine = [
    config.telepon?.trim() ? `Telp: ${config.telepon.trim()}` : '',
    config.email?.trim() ? `Email: ${config.email.trim()}` : '',
    config.website?.trim() ? `Website: ${config.website.trim()}` : ''
  ]
    .filter(Boolean)
    .join(' | ');

  const identitasLine = [
    config.npsn?.trim() ? `NPSN: ${config.npsn.trim()}` : '',
    config.nss?.trim() ? `NSS: ${config.nss.trim()}` : ''
  ]
    .filter(Boolean)
    .join(' · ');

  const centerParagraphs: Paragraph[] = [];
  if (pemda) {
    centerParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 240, after: 20 },
        children: [new TextRun({ text: pemda, font: FONT_FAMILY, size: 24, bold: true })] // 12pt bold
      })
    );
  }
  if (dinas) {
    centerParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 240, after: 20 },
        children: [new TextRun({ text: dinas, font: FONT_FAMILY, size: 24, bold: true })] // 12pt bold
      })
    );
  }
  centerParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 250, after: 30 },
      children: [new TextRun({ text: sekolah, font: FONT_FAMILY, size: 32, bold: true })] // 16pt bold
    })
  );
  if (alamatLine) {
    centerParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 220, after: 15 },
        children: [new TextRun({ text: alamatLine, font: FONT_FAMILY, size: 19, italics: true })]
      })
    );
  }
  if (kontakLine) {
    centerParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 220, after: 15 },
        children: [new TextRun({ text: kontakLine, font: FONT_FAMILY, size: 18 })]
      })
    );
  }
  if (identitasLine) {
    centerParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 220, after: 40 },
        children: [new TextRun({ text: identitasLine, font: FONT_FAMILY, size: 18, bold: true })]
      })
    );
  }

  // 3 columns: 1050 + 5837 + 1050 = 7937 DXA
  const kopWidths = [1050, 5837, 1050];
  const kopRowBottomBorder = {
    style: BorderStyle.DOUBLE,
    size: 18,
    color: '000000'
  };

  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    borders: {
      top: noBorder,
      left: noBorder,
      right: noBorder,
      insideHorizontal: noBorder,
      insideVertical: noBorder,
      bottom: kopRowBottomBorder
    },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: kopWidths[0], type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            borders: { top: noBorder, left: noBorder, right: noBorder, bottom: kopRowBottomBorder },
            margins: { top: 40, bottom: 100, left: 20, right: 40 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 240, after: 0 },
                children: leftPng
                  ? [
                      new ImageRun({
                        data: leftPng.data,
                        transformation: { width: leftPng.width, height: leftPng.height },
                        type: 'png'
                      })
                    ]
                  : [new TextRun({ text: 'PEMDA', font: FONT_FAMILY, size: 18, bold: true })]
              })
            ]
          }),
          new TableCell({
            width: { size: kopWidths[1], type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            borders: { top: noBorder, left: noBorder, right: noBorder, bottom: kopRowBottomBorder },
            margins: { top: 20, bottom: 100, left: 60, right: 60 },
            children: centerParagraphs
          }),
          new TableCell({
            width: { size: kopWidths[2], type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            borders: { top: noBorder, left: noBorder, right: noBorder, bottom: kopRowBottomBorder },
            margins: { top: 40, bottom: 100, left: 40, right: 20 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 240, after: 0 },
                children: rightPng
                  ? [
                      new ImageRun({
                        data: rightPng.data,
                        transformation: { width: rightPng.width, height: rightPng.height },
                        type: 'png'
                      })
                    ]
                  : [new TextRun({ text: 'TUT WURI', font: FONT_FAMILY, size: 18, bold: true })]
              })
            ]
          })
        ]
      })
    ]
  });
}

/**
 * Helper: Sub-judul / Section Heading (14 pt Bold, underline border bottom)
 */
function createSectionHeader(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 120, line: 276 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 6,
        color: '000000',
        space: 3
      }
    },
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 28, // 14 pt bold
        bold: true
      })
    ]
  });
}

function createBodyParagraph(
  text: string,
  options: {
    align?: DocxAlignment;
    bold?: boolean;
    italics?: boolean;
    size?: number;
    indentFirstLine?: number;
  } = {}
): Paragraph {
  const { align = AlignmentType.LEFT, bold = false, italics = false, size = 24, indentFirstLine } = options;
  return new Paragraph({
    alignment: align,
    spacing: STANDARD_PARAGRAPH_SPACING,
    ...(indentFirstLine ? { indent: { firstLine: indentFirstLine } } : {}),
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size,
        bold,
        italics
      })
    ]
  });
}

function createHeaderCell(text: string, widthDxa: number, align: DocxAlignment = AlignmentType.CENTER): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
    margins: { top: 90, bottom: 90, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: align,
        spacing: COMPACT_PARAGRAPH_SPACING,
        children: [
          new TextRun({
            text,
            font: FONT_FAMILY,
            size: 20, // 10 pt bold agar muat rapi pada tabel banyak kolom A4
            bold: true
          })
        ]
      })
    ]
  });
}

function createBodyCell(
  text: string,
  widthDxa: number,
  options: {
    align?: DocxAlignment;
    bold?: boolean;
    size?: number;
    italics?: boolean;
    fill?: string;
    color?: string;
    columnSpan?: number;
    subtext?: string;
  } = {}
): TableCell {
  const {
    align = AlignmentType.LEFT,
    bold = false,
    size = 20,
    italics = false,
    fill,
    color,
    columnSpan,
    subtext
  } = options;

  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment: align,
      spacing: subtext ? { line: 240, after: 20 } : COMPACT_PARAGRAPH_SPACING,
      children: [
        new TextRun({
          text,
          font: FONT_FAMILY,
          size,
          bold,
          italics,
          ...(color ? { color } : {})
        })
      ]
    })
  ];

  if (subtext) {
    paragraphs.push(
      new Paragraph({
        alignment: align,
        spacing: { line: 230, after: 20 },
        children: [
          new TextRun({
            text: subtext,
            font: FONT_FAMILY,
            size: Math.max(17, size - 2),
            color: '475569'
          })
        ]
      })
    );
  }

  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    ...(columnSpan ? { columnSpan } : {}),
    ...(fill ? { shading: { fill, type: ShadingType.CLEAR } } : {}),
    margins: { top: 75, bottom: 75, left: 80, right: 80 },
    children: paragraphs
  });
}

/**
 * Helper Lembar Pengesahan Resmi untuk `.docx`
 * Mendukung 2 kolom (Kepala Sekolah & Petugas) atau 3 kolom (Kepala Sekolah, Kasubag TU, Petugas)
 * serta penyisipan tanda tangan gambar/scan bila tersedia, serta pembersihan NIP/PPPK otomatis.
 */
async function createOfficialSignatureBlockDocx(params: {
  schoolConfig: SchoolConfig;
  role: RoleType;
  operatorTitle: string;
  docDate: string;
  forceTwoCol?: boolean;
}): Promise<Table> {
  const { schoolConfig, role, operatorTitle, docDate, forceTwoCol = false } = params;

  let layoutMode: '2_col' | '3_col' = '2_col';
  let signatureMode = 'digital';
  try {
    if (!forceTwoCol) {
      const savedLayout = localStorage.getItem('siops_signature_layout');
      if (savedLayout === '3_col') layoutMode = '3_col';
    }
    const savedMode = localStorage.getItem('siops_signature_mode');
    if (savedMode) signatureMode = savedMode;
  } catch {
    // ignore storage errors
  }

  const rawKepsekNama = schoolConfig.kepalaSekolah?.nama || '';
  const isDummyKepsek = !rawKepsekNama || /rahmat(\s*hidayat)?/i.test(rawKepsekNama) || !rawKepsekNama.trim();
  const kepsekName = isDummyKepsek ? '( .................................................. )' : formatOfficialNameWithDegree(rawKepsekNama);
  const isDummyKepsekNip = !schoolConfig.kepalaSekolah?.nip || /19740510\s*199802\s*1\s*003/.test(schoolConfig.kepalaSekolah.nip);
  const kepsekNip = isDummyKepsek || isDummyKepsekNip
    ? formatOfficialNipOrPppk('', { defaultPrefix: 'NIP', placeholderDots: true })
    : formatOfficialNipOrPppk(schoolConfig.kepalaSekolah.nip, { defaultPrefix: 'NIP', placeholderDots: true });

  const operator = schoolConfig.operatorProfiles?.[role] || { nama: '', nip: '', jabatan: operatorTitle };
  const rawOperatorNama = operator?.nama || '';
  const isDummyOperator = !rawOperatorNama || /nurul(\s*hidayat|\s*hidayati)?/i.test(rawOperatorNama) || /rahmat(\s*hidayat)?/i.test(rawOperatorNama) || !rawOperatorNama.trim();
  const operatorName = isDummyOperator ? '( .................................................. )' : formatOfficialNameWithDegree(rawOperatorNama);
  const isDummyOperatorNip = !operator?.nip || /19920815\s*202321\s*2\s*024/.test(operator.nip);
  const operatorNip = isDummyOperator || isDummyOperatorNip
    ? formatOfficialNipOrPppk('', { defaultPrefix: 'NIPPK', placeholderDots: true })
    : formatOfficialNipOrPppk(operator.nip, { defaultPrefix: 'NIPPK', placeholderDots: true });

  // Kasubag TU for 3-col layout
  const tuProfile = schoolConfig.operatorProfiles?.TU;
  const rawTuNama = tuProfile?.nama || '';
  const isDummyTu = !rawTuNama || /nurul|rahmat/i.test(rawTuNama);
  const kasubagName = isDummyTu ? '( .................................................. )' : formatOfficialNameWithDegree(rawTuNama);
  const kasubagNip = isDummyTu
    ? formatOfficialNipOrPppk('', { defaultPrefix: 'NIP', placeholderDots: true })
    : formatOfficialNipOrPppk(tuProfile?.nip, { defaultPrefix: 'NIP', placeholderDots: true });

  const shouldEmbedSig = signatureMode === 'image';
  const [kepsekSigImg, opSigImg] = shouldEmbedSig
    ? await Promise.all([
        !isDummyKepsek && schoolConfig.kepalaSekolah?.signatureImage
          ? imageSourceToPngBytes(schoolConfig.kepalaSekolah.signatureImage, undefined, { maxW: 160, maxH: 70 })
          : Promise.resolve(null),
        !isDummyOperator && operator?.signatureImage
          ? imageSourceToPngBytes(operator.signatureImage, undefined, { maxW: 160, maxH: 70 })
          : Promise.resolve(null)
      ])
    : [null, null];

  const makeSignatureCell = (cellConfig: {
    widthDxa: number;
    topLine: string;
    roleLine: string;
    nameText: string;
    nipText: string;
    sigImg?: { data: Uint8Array; width: number; height: number } | null;
    isDummy: boolean;
  }): TableCell => {
    const sigParagraph = cellConfig.sigImg
      ? new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 80, line: 240 },
          children: [
            new ImageRun({
              data: cellConfig.sigImg.data,
              transformation: { width: Math.min(110, cellConfig.sigImg.width * 1.4), height: Math.min(48, cellConfig.sigImg.height * 0.9) },
              type: 'png'
            })
          ]
        })
      : new Paragraph({ spacing: { before: 820, after: 40 }, children: [] });

    return new TableCell({
      width: { size: cellConfig.widthDxa, type: WidthType.DXA },
      verticalAlign: VerticalAlign.TOP,
      margins: { top: 80, bottom: 80, left: 60, right: 60 },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 240, after: 20 },
          children: [new TextRun({ text: cellConfig.topLine, font: FONT_FAMILY, size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 240, after: 40 },
          children: [new TextRun({ text: cellConfig.roleLine, font: FONT_FAMILY, size: 22, bold: true })]
        }),
        sigParagraph,
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 240, after: 20 },
          children: [
            new TextRun({
              text: cellConfig.nameText,
              font: FONT_FAMILY,
              size: 22,
              bold: true,
              ...(cellConfig.isDummy ? {} : { underline: {} })
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 240, after: 0 },
          children: [new TextRun({ text: cellConfig.nipText, font: FONT_FAMILY, size: 20 })]
        })
      ]
    });
  };

  if (layoutMode === '3_col') {
    const signW3 = [2645, 2646, 2646]; // sum = 7937
    return new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      borders: tableBordersNone,
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            makeSignatureCell({
              widthDxa: signW3[0],
              topLine: 'Mengetahui / Mengesahkan,',
              roleLine: schoolConfig.kepalaSekolah?.jabatan || 'Kepala Satuan Pendidikan',
              nameText: kepsekName,
              nipText: kepsekNip,
              sigImg: kepsekSigImg,
              isDummy: isDummyKepsek
            }),
            makeSignatureCell({
              widthDxa: signW3[1],
              topLine: 'Diperiksa / Diverifikasi,',
              roleLine: 'Koordinator Urusan TU',
              nameText: kasubagName,
              nipText: kasubagNip,
              isDummy: isDummyTu
            }),
            makeSignatureCell({
              widthDxa: signW3[2],
              topLine: docDate,
              roleLine: operator?.jabatan || operatorTitle,
              nameText: operatorName,
              nipText: operatorNip,
              sigImg: opSigImg,
              isDummy: isDummyOperator
            })
          ]
        })
      ]
    });
  }

  const signW2 = [3968, 3969]; // sum = 7937
  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    borders: tableBordersNone,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          makeSignatureCell({
            widthDxa: signW2[0],
            topLine: 'Mengetahui / Mengesahkan,',
            roleLine: schoolConfig.kepalaSekolah?.jabatan || 'Kepala Satuan Pendidikan',
            nameText: kepsekName,
            nipText: kepsekNip,
            sigImg: kepsekSigImg,
            isDummy: isDummyKepsek
          }),
          makeSignatureCell({
            widthDxa: signW2[1],
            topLine: docDate,
            roleLine: operator?.jabatan || operatorTitle,
            nameText: operatorName,
            nipText: operatorNip,
            sigImg: opSigImg,
            isDummy: isDummyOperator
          })
        ]
      })
    ]
  });
}

function buildStandardDocxDocument(docChildren: (Paragraph | Table)[]): Document {
  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: PAGE_WIDTH_DXA,
              height: PAGE_HEIGHT_DXA
            },
            margin: {
              top: MARGIN_TOP_DXA,       // 3 cm
              left: MARGIN_LEFT_DXA,     // 4 cm
              bottom: MARGIN_BOTTOM_DXA, // 3 cm
              right: MARGIN_RIGHT_DXA    // 3 cm
            }
          }
        },
        children: docChildren
      }
    ]
  });
}

/**
 * 1. GENERATOR RESMI DOCX UNTUK LAPOR BULANAN & LAPOR TAHUNAN (RENDER 1:1 AKURAT DENGAN ANTAMUKA WEB)
 */
export async function createOfficialDocumentDocx(params: OfficialDocxParams): Promise<Document> {
  const {
    reportType,
    reportData,
    schoolConfig,
    tasks,
    inventories,
    tupoksiDefinitions,
    manualDate,
    nomorSurat,
    libraryBooks = [],
    libraryMembers = [],
    libraryMemberStats
  } = params;

  const isMonthly = reportType === 'monthly';
  const monthlyData = isMonthly ? (reportData as MonthlyReport) : null;
  const annualData = !isMonthly ? (reportData as AnnualReport) : null;

  const role: RoleType = reportData.role || 'TU';
  const roleTitle =
    role === 'TU' ? 'Tata Usaha (TU)' :
    role === 'PENJAGA' ? 'Penjaga Sekolah' :
    role === 'SERVICE' ? 'Layanan Kebersihan (Service)' :
    role === 'PERPUS' ? 'Layanan Perpustakaan' : 'Laboratorium IPA';

  const operator = schoolConfig.operatorProfiles?.[role] || {
    nama: '',
    nip: '',
    jabatan: `Operator Layanan Operasional ${roleTitle}`
  };

  const isPerpus = role === 'PERPUS';

  // Strict role isolation
  const relevantTasks = tasks.filter(t => {
    if (!t.role || t.role.trim().toUpperCase() !== role.trim().toUpperCase()) return false;
    return isMonthly
      ? isTaskInMonth(t.date, monthlyData?.month || 9, monthlyData?.year || 2026)
      : isTaskInYear(t.date, annualData?.year || 2026);
  });

  const roleInventories = inventories.filter(
    inv => inv.role && inv.role.trim().toUpperCase() === role.trim().toUpperCase()
  );

  const tupoksiTasks = relevantTasks.filter(t => getTaskClassification(role, t.category, t.taskType) === 'pokok');
  const tambahanTasks = relevantTasks.filter(t => getTaskClassification(role, t.category, t.taskType) === 'tambahan');
  const tupoksiCompleted = tupoksiTasks.filter(t => t.status === 'selesai');
  const tambahanCompleted = tambahanTasks.filter(t => t.status === 'selesai');
  const completedCount = relevantTasks.filter(t => t.status === 'selesai').length;
  const completionRate = relevantTasks.length > 0 ? Math.round((completedCount / relevantTasks.length) * 100) : 100;

  const roleTupoksiList = tupoksiDefinitions?.[role]?.tupoksiList || OFFICIAL_TUPOKSI_DEFINITIONS[role]?.tupoksiList || [];
  const roleTambahanList = tupoksiDefinitions?.[role]?.tugasTambahanList || OFFICIAL_TUPOKSI_DEFINITIONS[role]?.tugasTambahanList || [];

  // Identitas Pelaksana
  const rawOperatorNama = operator?.nama || '';
  const isDummyOperator = !rawOperatorNama || /nurul(\s*hidayat|\s*hidayati)?/i.test(rawOperatorNama) || /rahmat(\s*hidayat)?/i.test(rawOperatorNama) || !rawOperatorNama.trim();
  const displayOperatorNama = isDummyOperator ? '( .................................................. )' : formatOfficialNameWithDegree(rawOperatorNama);
  const isDummyOperatorNip = !operator?.nip || /19920815\s*202321\s*2\s*024/.test(operator.nip);
  const displayOperatorNip = isDummyOperator || isDummyOperatorNip
    ? formatOfficialNipOrPppk('', { defaultPrefix: 'NIPPK', placeholderDots: true })
    : formatOfficialNipOrPppk(operator.nip, { defaultPrefix: 'NIPPK', placeholderDots: true });

  const targetMonth = monthlyData?.month || 9;
  const targetYear = isMonthly ? (monthlyData?.year || 2026) : (annualData?.year || 2026);

  const periodLabel = isMonthly
    ? `Bulan ${MONTH_NAMES[targetMonth - 1]} Tahun ${targetYear}`
    : `Tahun Anggaran ${targetYear}`;

  const noSurat = (nomorSurat || reportData.nomorSurat || '').trim() || (
    isMonthly
      ? `800/LAP-BLN/${targetMonth}/${schoolConfig.npsn || '20202819'}/${targetYear}`
      : `800/LAP-THN/${schoolConfig.npsn || '20202819'}/${targetYear}`
  );

  const placeName = [schoolConfig.kabupatenKota, schoolConfig.desaKecamatan].filter(Boolean)[0] || '';
  const defaultDateText = isMonthly
    ? `${MONTH_NAMES[targetMonth - 1]} ${targetYear}`
    : `31 Desember ${targetYear}`;
  const docDate = (manualDate || reportData.manualDocDate || '').trim() ||
    (placeName ? `${placeName}, ${defaultDateText}` : defaultDateText);

  const docChildren: (Paragraph | Table)[] = [];

  // 1. KOP SURAT RESMI 3 KOLOM DENGAN LOGO KIRI & KANAN
  docChildren.push(await createKopSuratTable(schoolConfig));

  // 2. JUDUL UTAMA (16 pt Bold) & SUB-JUDUL (14 pt Bold)
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 276, before: 140, after: 40 },
      children: [
        new TextRun({
          text: isMonthly
            ? 'LAPORAN BULANAN KINERJA OPERATOR LAYANAN OPERASIONAL'
            : 'LAPORAN TAHUNAN KINERJA OPERATOR LAYANAN OPERASIONAL',
          font: FONT_FAMILY,
          size: 32, // 16 pt Bold
          bold: true
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 276, after: 40 },
      children: [
        new TextRun({
          text: `BIDANG: ${roleTitle.toUpperCase()}`,
          font: FONT_FAMILY,
          size: 28, // 14 pt Bold
          bold: true
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 276, after: 40 },
      children: [
        new TextRun({
          text: `Periode: ${periodLabel}`,
          font: FONT_FAMILY,
          size: 24, // 12 pt
          bold: true
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: STANDARD_PARAGRAPH_SPACING,
      children: [
        new TextRun({
          text: `Nomor: ${noSurat}`,
          font: FONT_FAMILY,
          size: 24, // 12 pt
          italics: true
        })
      ]
    })
  );

  // 3. IDENTITAS PELAKSANA TUGAS (Exact 4-row box matching PrintDocumentView UI)
  const idWidths = [2400, 250, 5287]; // sum = 7937 DXA
  docChildren.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      borders: tableBordersAll,
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell('Nama Petugas Pelaksana', idWidths[0], { bold: true, size: 24, fill: 'F8FAFC' }),
            createBodyCell(':', idWidths[1], { align: AlignmentType.CENTER, size: 24, fill: 'F8FAFC' }),
            createBodyCell(displayOperatorNama, idWidths[2], { bold: true, size: 24, fill: 'F8FAFC' })
          ]
        }),
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell('NIP / NIPPK', idWidths[0], { bold: true, size: 24, fill: 'F8FAFC' }),
            createBodyCell(':', idWidths[1], { align: AlignmentType.CENTER, size: 24, fill: 'F8FAFC' }),
            createBodyCell(displayOperatorNip, idWidths[2], { size: 24, fill: 'F8FAFC' })
          ]
        }),
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell('Jabatan / Satuan Tugas', idWidths[0], { bold: true, size: 24, fill: 'F8FAFC' }),
            createBodyCell(':', idWidths[1], { align: AlignmentType.CENTER, size: 24, fill: 'F8FAFC' }),
            createBodyCell(operator.jabatan || roleTitle, idWidths[2], { size: 24, fill: 'F8FAFC' })
          ]
        }),
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell('Unit Kerja / Sekolah', idWidths[0], { bold: true, size: 24, fill: 'F8FAFC' }),
            createBodyCell(':', idWidths[1], { align: AlignmentType.CENTER, size: 24, fill: 'F8FAFC' }),
            createBodyCell(schoolConfig.namaSekolah || '-', idWidths[2], { size: 24, fill: 'F8FAFC' })
          ]
        })
      ]
    })
  );

  // 4. SECTION I: RINGKASAN EKSEKUTIF KINERJA & CAPAIAN TARGET OPERASIONAL (1:1 dengan UI)
  docChildren.push(
    createSectionHeader(`I. RINGKASAN EKSEKUTIF KINERJA & CAPAIAN TARGET OPERASIONAL (${roleTitle.toUpperCase()})`)
  );

  if (reportData.summary) {
    docChildren.push(
      createBodyParagraph(reportData.summary, {
        align: AlignmentType.JUSTIFIED,
        size: 24,
        indentFirstLine: 420
      })
    );
  }

  const achievements = isMonthly ? (monthlyData?.achievements || []) : (annualData?.annualMilestones || []);
  docChildren.push(
    createBodyParagraph(`Rincian Capaian Indikator Kinerja yang Terlaksana (${roleTitle}):`, {
      bold: true,
      size: 24
    })
  );
  achievements.forEach((item, idx) => {
    docChildren.push(
      new Paragraph({
        spacing: { line: 276, after: 80 },
        indent: { left: 360, hanging: 240 },
        children: [new TextRun({ text: `${idx + 1}. ${item}`, font: FONT_FAMILY, size: 24 })]
      })
    );
  });

  // Kendala & Solusi (2 Columns matching UI)
  const obstacles = (isMonthly ? monthlyData?.obstacles : annualData?.obstacles) || [];
  const solutions = (isMonthly ? monthlyData?.solutions : annualData?.solutions) || [];
  if (obstacles.length > 0 || solutions.length > 0) {
    const twoColW = [3968, 3969]; // sum = 7937 DXA
    docChildren.push(
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        borders: tableBordersAll,
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: twoColW[0], type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    spacing: { line: 260, after: 60 },
                    children: [new TextRun({ text: 'Kendala / Hambatan di Lapangan:', font: FONT_FAMILY, size: 22, bold: true })]
                  }),
                  ...(obstacles.length > 0
                    ? obstacles.map(
                        (obs) =>
                          new Paragraph({
                            spacing: { line: 260, after: 40 },
                            indent: { left: 220, hanging: 160 },
                            children: [new TextRun({ text: `• ${obs}`, font: FONT_FAMILY, size: 21 })]
                          })
                      )
                    : [
                        new Paragraph({
                          spacing: { line: 260, after: 40 },
                          children: [new TextRun({ text: '• Tidak ada kendala berarti.', font: FONT_FAMILY, size: 21 })]
                        })
                      ])
                ]
              }),
              new TableCell({
                width: { size: twoColW[1], type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    spacing: { line: 260, after: 60 },
                    children: [new TextRun({ text: 'Solusi & Upaya Pemecahan Masalah:', font: FONT_FAMILY, size: 22, bold: true })]
                  }),
                  ...(solutions.length > 0
                    ? solutions.map(
                        (sol) =>
                          new Paragraph({
                            spacing: { line: 260, after: 40 },
                            indent: { left: 220, hanging: 160 },
                            children: [new TextRun({ text: `• ${sol}`, font: FONT_FAMILY, size: 21 })]
                          })
                      )
                    : [
                        new Paragraph({
                          spacing: { line: 260, after: 40 },
                          children: [new TextRun({ text: '• Koordinasi rutin berjalan optimal.', font: FONT_FAMILY, size: 21 })]
                        })
                      ])
                ]
              })
            ]
          })
        ]
      })
    );
  }

  if (!isMonthly && annualData?.strategicRecommendations && annualData.strategicRecommendations.length > 0) {
    docChildren.push(
      new Paragraph({
        spacing: { before: 100, after: 60, line: 276 },
        children: [
          new TextRun({
            text: 'Rekomendasi Rencana Strategis & Kebutuhan Operasional:',
            font: FONT_FAMILY,
            size: 24,
            bold: true
          })
        ]
      })
    );
    annualData.strategicRecommendations.forEach((rec) => {
      docChildren.push(
        new Paragraph({
          spacing: { line: 276, after: 60 },
          indent: { left: 320, hanging: 180 },
          children: [new TextRun({ text: `• ${rec}`, font: FONT_FAMILY, size: 24 })]
        })
      );
    });
  }

  // 5. SECTION II: STANDAR TUGAS POKOK (TUPOKSI) & TUGAS TAMBAHAN (2-Column Grid Box matching UI)
  docChildren.push(
    createSectionHeader('II. STANDAR TUGAS POKOK (TUPOKSI) DAN TUGAS TAMBAHAN LAYANAN OPERASIONAL')
  );
  const tupColW = [3968, 3969]; // sum = 7937 DXA
  docChildren.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      borders: tableBordersAll,
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: tupColW[0], type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
              shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  spacing: { line: 260, after: 60 },
                  children: [
                    new TextRun({
                      text: `A. Tugas Pokok (Tupoksi Standar) (${tupoksiCompleted.length}/${tupoksiTasks.length} Tuntas):`,
                      font: FONT_FAMILY,
                      size: 21,
                      bold: true
                    })
                  ]
                }),
                ...roleTupoksiList.map(
                  (item) =>
                    new Paragraph({
                      spacing: { line: 250, after: 40 },
                      indent: { left: 220, hanging: 150 },
                      children: [new TextRun({ text: `• ${item}`, font: FONT_FAMILY, size: 20 })]
                    })
                )
              ]
            }),
            new TableCell({
              width: { size: tupColW[1], type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
              shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  spacing: { line: 260, after: 60 },
                  children: [
                    new TextRun({
                      text: `B. Tugas Tambahan & Insidental (${tambahanCompleted.length}/${tambahanTasks.length} Tuntas):`,
                      font: FONT_FAMILY,
                      size: 21,
                      bold: true
                    })
                  ]
                }),
                ...roleTambahanList.map(
                  (item) =>
                    new Paragraph({
                      spacing: { line: 250, after: 40 },
                      indent: { left: 220, hanging: 150 },
                      children: [new TextRun({ text: `• ${item}`, font: FONT_FAMILY, size: 20 })]
                    })
                )
              ]
            })
          ]
        })
      ]
    })
  );

  // 6. MATRIKS TARGET OPERASIONAL & INDIKATOR KINERJA KUNCI (KPI) - Persis 6 Kolom Web UI
  docChildren.push(
    createSectionHeader(`MATRIKS TARGET OPERASIONAL & INDIKATOR KINERJA KUNCI (KPI) - ${roleTitle.toUpperCase()}`)
  );

  const kpiItems =
    isMonthly && monthlyData?.customKPIs && monthlyData.customKPIs.length > 0
      ? monthlyData.customKPIs
      : ROLE_OPERATIONAL_SPECS[role]?.operationalKPIs || [];

  // Widths: Kode: 880, Indikator: 2357, Target: 1400, Realisasi: 1650, Satuan: 850, Status: 800 = 7937
  const kpiWidths = [880, 2357, 1400, 1650, 850, 800];
  const kpiRows: TableRow[] = [
    new TableRow({
      cantSplit: true,
      tableHeader: true,
      children: [
        createHeaderCell('Kode', kpiWidths[0]),
        createHeaderCell('Indikator Kinerja Kunci (KPI)', kpiWidths[1], AlignmentType.LEFT),
        createHeaderCell('Target Kerja', kpiWidths[2], AlignmentType.LEFT),
        createHeaderCell('Realisasi Lapangan', kpiWidths[3], AlignmentType.LEFT),
        createHeaderCell('Satuan', kpiWidths[4]),
        createHeaderCell('Status', kpiWidths[5])
      ]
    })
  ];

  kpiItems.forEach((kpi, idx) => {
    kpiRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell(kpi.code || `KPI-0${idx + 1}`, kpiWidths[0], { align: AlignmentType.CENTER, bold: true, size: 19 }),
          createBodyCell(kpi.name, kpiWidths[1], { bold: true, size: 20 }),
          createBodyCell(kpi.target, kpiWidths[2], { size: 19 }),
          createBodyCell(kpi.realization, kpiWidths[3], { bold: true, size: 19 }),
          createBodyCell(kpi.unit || '-', kpiWidths[4], { align: AlignmentType.CENTER, size: 19 }),
          createBodyCell(kpi.status === 'tercapai' ? 'Tercapai' : 'Proses', kpiWidths[5], {
            align: AlignmentType.CENTER,
            bold: true,
            size: 19,
            color: kpi.status === 'tercapai' ? '15803D' : 'B45309'
          })
        ]
      })
    );
  });

  docChildren.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      borders: tableBordersAll,
      rows: kpiRows
    })
  );

  // 7. KHUSUS PERPUSTAKAAN: DATA REKAPITULASI ANGGOTA & PENAMBAHAN ANGGOTA BARU BULAN INI
  if (isPerpus) {
    const regGuruL = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'GURU' && m.jenisKelamin === 'L').length;
    const regGuruP = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'GURU' && m.jenisKelamin === 'P').length;
    const regStaffL = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'STAFF' && m.jenisKelamin === 'L').length;
    const regStaffP = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'STAFF' && m.jenisKelamin === 'P').length;
    const regSiswaL = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'SISWA' && m.jenisKelamin === 'L' && m.status !== 'tamat' && m.status !== 'alumni').length;
    const regSiswaP = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'SISWA' && m.jenisKelamin === 'P' && m.status !== 'tamat' && m.status !== 'alumni').length;

    const guruL = Math.max(regGuruL, libraryMemberStats?.guruLaki || 0);
    const guruP = Math.max(regGuruP, libraryMemberStats?.guruPerempuan || 0);
    const totalGuru = Math.max(libraryMemberStats?.guruPendidik || 0, guruL + guruP);

    const staffL = Math.max(regStaffL, libraryMemberStats?.staffLaki || 0);
    const staffP = Math.max(regStaffP, libraryMemberStats?.staffPerempuan || 0);
    const totalStaff = Math.max(libraryMemberStats?.staffTendik || 0, staffL + staffP);

    const siswaL = Math.max(regSiswaL, libraryMemberStats?.siswaLaki || 0);
    const siswaP = Math.max(regSiswaP, libraryMemberStats?.siswaPerempuan || 0);
    const totalAnggotaPerpus = totalGuru + totalStaff + siswaL + siswaP;

    docChildren.push(createSectionHeader('III. DATA REKAPITULASI ANGGOTA PERPUSTAKAAN (PEMUSTAKA SEKOLAH)'));

    const memW = [1600, 1737, 1500, 1500, 1600]; // sum = 7937 DXA
    docChildren.push(
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        borders: tableBordersAll,
        rows: [
          new TableRow({
            cantSplit: true,
            tableHeader: true,
            children: [
              createHeaderCell('Guru (Pendidik)', memW[0]),
              createHeaderCell('Tenaga Kependidikan (Staff/TU)', memW[1]),
              createHeaderCell('Siswa Laki-laki', memW[2]),
              createHeaderCell('Siswa Perempuan', memW[3]),
              createHeaderCell('Total Seluruh Anggota', memW[4])
            ]
          }),
          new TableRow({
            cantSplit: true,
            children: [
              createBodyCell(`${totalGuru} orang`, memW[0], { align: AlignmentType.CENTER, bold: true, subtext: `(L: ${guruL}, P: ${guruP})` }),
              createBodyCell(`${totalStaff} orang`, memW[1], { align: AlignmentType.CENTER, bold: true, subtext: `(L: ${staffL}, P: ${staffP})` }),
              createBodyCell(`${siswaL} orang`, memW[2], { align: AlignmentType.CENTER, bold: true }),
              createBodyCell(`${siswaP} orang`, memW[3], { align: AlignmentType.CENTER, bold: true }),
              createBodyCell(`${totalAnggotaPerpus} orang`, memW[4], { align: AlignmentType.CENTER, bold: true, fill: 'EFF6FF', color: '1E3A8A' })
            ]
          })
        ]
      })
    );

    // Tambahan Anggota Baru pada Bulan Berjalan (untuk auditor/admin cek penambahan bulanan)
    const addedThisMonth = isMonthly
      ? libraryMembers.filter(m => isMemberJoinedInMonth(m, targetYear, targetMonth))
      : libraryMembers.filter(m => {
          const raw = (m.tanggalBergabung || m.tanggalTerdaftar || '').trim();
          return raw.startsWith(String(targetYear));
        });

    if (addedThisMonth.length > 0 || isMonthly) {
      docChildren.push(
        createBodyParagraph(
          isMonthly
            ? `Rekapitulasi Penambahan Anggota Baru Bulan ${MONTH_NAMES[targetMonth - 1]} ${targetYear} (${addedThisMonth.length} Orang Terdaftar Baru):`
            : `Rekapitulasi Penambahan Anggota Baru Tahun ${targetYear} (${addedThisMonth.length} Orang Terdaftar Baru):`,
          { bold: true, size: 22 }
        )
      );

      // Widths: No: 420, NoAng: 1200, Nama: 2217, Kategori: 1200, Kelas/Jab: 1300, L/P: 500, Tgl: 1100 = 7937
      const newMemW = [420, 1200, 2217, 1200, 1300, 500, 1100];
      const newMemRows: TableRow[] = [
        new TableRow({
          cantSplit: true,
          tableHeader: true,
          children: [
            createHeaderCell('No', newMemW[0]),
            createHeaderCell('No. Anggota', newMemW[1]),
            createHeaderCell('Nama Lengkap', newMemW[2], AlignmentType.LEFT),
            createHeaderCell('Kategori', newMemW[3]),
            createHeaderCell('Kelas / Jabatan', newMemW[4]),
            createHeaderCell('L/P', newMemW[5]),
            createHeaderCell('Tgl Terdaftar', newMemW[6])
          ]
        })
      ];

      if (addedThisMonth.length > 0) {
        addedThisMonth.forEach((m, idx) => {
          const typeLabel = m.tipeAnggota === 'GURU' ? 'Pendidik' : m.tipeAnggota === 'STAFF' ? 'Tendik' : 'Siswa';
          newMemRows.push(
            new TableRow({
              cantSplit: true,
              children: [
                createBodyCell(String(idx + 1), newMemW[0], { align: AlignmentType.CENTER, size: 19 }),
                createBodyCell(m.nomorAnggota || '-', newMemW[1], { align: AlignmentType.CENTER, size: 18 }),
                createBodyCell(m.nama, newMemW[2], { bold: true, size: 20 }),
                createBodyCell(typeLabel, newMemW[3], { align: AlignmentType.CENTER, size: 19 }),
                createBodyCell(m.kelasAtauJabatan || '-', newMemW[4], { size: 19 }),
                createBodyCell(m.jenisKelamin || 'L', newMemW[5], { align: AlignmentType.CENTER, bold: true, size: 19 }),
                createBodyCell(m.tanggalBergabung || m.tanggalTerdaftar || '-', newMemW[6], { align: AlignmentType.CENTER, size: 19 })
              ]
            })
          );
        });
      } else {
        newMemRows.push(
          new TableRow({
            cantSplit: true,
            children: [
              createBodyCell(
                `Tidak terdapat penambahan anggota baru pada bulan ${MONTH_NAMES[targetMonth - 1]} ${targetYear}.`,
                CONTENT_WIDTH_DXA,
                { align: AlignmentType.CENTER, italics: true, columnSpan: 7, size: 20 }
              )
            ]
          })
        );
      }

      docChildren.push(
        new Table({
          width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
          borders: tableBordersAll,
          rows: newMemRows
        })
      );
    }
  }

  // 8. REKAPITULASI KINERJA: TAHUNAN (MATRIKS 12 BULAN) vs BULANAN (RINCIAN TUGAS HARIAN 8 KOLOM)
  const taskSectionPrefix = isPerpus ? 'IV.' : 'III.';
  if (!isMonthly) {
    // ANNUAL REPORT -> 12-MONTH RECAP TABLE (EXACT 1:1 WITH UI!)
    const annualPerf = calculateAnnualPerformanceSummary(tasks, role, targetYear);
    docChildren.push(
      createSectionHeader(
        `${taskSectionPrefix} REKAPITULASI & PERSENTASE KINERJA OPERASIONAL PER BULAN (TUGAS POKOK & TUGAS TAMBAHAN)`
      )
    );
    docChildren.push(
      createBodyParagraph(
        `Rekapitulasi volume realisasi tugas kedinasan per bulan Tahun Anggaran ${targetYear} menurut bagian Tugas Pokok dan Tugas Tambahan beserta persentase capaian operasional:`,
        { italics: true, size: 22 }
      )
    );

    // 7 cols: No(380) + Bulan(950) + Pokok(2357) + Tambahan(2150) + Kegiatan(700) + Tuntas(650) + Capaian(750) = 7937
    const annW = [380, 950, 2357, 2150, 700, 650, 750];
    const annRows: TableRow[] = [
      new TableRow({
        cantSplit: true,
        tableHeader: true,
        children: [
          createHeaderCell('No', annW[0]),
          createHeaderCell('Bulan', annW[1], AlignmentType.LEFT),
          createHeaderCell('Realisasi Tugas Pokok & Volume Hasil', annW[2], AlignmentType.LEFT),
          createHeaderCell('Realisasi Tugas Tambahan & Volume Hasil', annW[3], AlignmentType.LEFT),
          createHeaderCell('Kegiatan', annW[4]),
          createHeaderCell('Tuntas', annW[5]),
          createHeaderCell('Capaian', annW[6])
        ]
      })
    ];

    annualPerf.items.forEach((item, idx) => {
      annRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell(String(idx + 1), annW[0], { align: AlignmentType.CENTER, size: 19 }),
            createBodyCell(item.monthName, annW[1], { bold: true, size: 19 }),
            createBodyCell(item.tupoksiSummary, annW[2], { size: 18 }),
            createBodyCell(item.tambahanSummary, annW[3], { size: 18 }),
            createBodyCell(String(item.totalTasks), annW[4], { align: AlignmentType.CENTER, size: 19 }),
            createBodyCell(String(item.completedTasks), annW[5], { align: AlignmentType.CENTER, bold: true, size: 19, color: '15803D' }),
            createBodyCell(`${item.percentage}%`, annW[6], { align: AlignmentType.CENTER, bold: true, size: 19, color: '15803D' })
          ]
        })
      );
    });

    // TOTAL TAHUNAN ROW (proper columnSpan: 2)
    annRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell('TOTAL TAHUNAN', annW[0] + annW[1], {
            align: AlignmentType.CENTER,
            bold: true,
            fill: 'E2E8F0',
            columnSpan: 2,
            size: 19
          }),
          createBodyCell(`Total ${annualPerf.totalTupoksi} Kegiatan Tugas Pokok Terlaksana`, annW[2], {
            bold: true,
            fill: 'E2E8F0',
            size: 18
          }),
          createBodyCell(`Total ${annualPerf.totalTambahan} Kegiatan Tugas Tambahan Terlaksana`, annW[3], {
            bold: true,
            fill: 'E2E8F0',
            size: 18
          }),
          createBodyCell(String(annualPerf.totalTasks), annW[4], {
            align: AlignmentType.CENTER,
            bold: true,
            fill: 'E2E8F0',
            size: 19
          }),
          createBodyCell(String(annualPerf.totalCompleted), annW[5], {
            align: AlignmentType.CENTER,
            bold: true,
            fill: 'E2E8F0',
            size: 19,
            color: '15803D'
          }),
          createBodyCell(`${annualPerf.averagePercentage.toFixed(1)}%`, annW[6], {
            align: AlignmentType.CENTER,
            bold: true,
            fill: 'E2E8F0',
            size: 19,
            color: '15803D'
          })
        ]
      })
    );

    docChildren.push(
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        borders: tableBordersAll,
        rows: annRows
      })
    );
  } else {
    // MONTHLY REPORT -> 8-COLUMN DAILY TASK TABLE MATCHING UI EXACTLY
    docChildren.push(
      createSectionHeader(
        `${taskSectionPrefix} REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL YANG DILAKSANAKAN (${relevantTasks.length} TUGAS)`
      )
    );

    // 8 cols: No(380) + Tanggal(920) + Klasifikasi(850) + Uraian(2437) + Lokasi(950) + Waktu(900) + Volume(750) + Status(750) = 7937 DXA
    const taskWidths = [380, 920, 850, 2437, 950, 900, 750, 750];
    const taskRows: TableRow[] = [
      new TableRow({
        cantSplit: true,
        tableHeader: true,
        children: [
          createHeaderCell('No', taskWidths[0]),
          createHeaderCell('Tanggal', taskWidths[1]),
          createHeaderCell('Klasifikasi', taskWidths[2]),
          createHeaderCell('Uraian Tugas Kedinasan', taskWidths[3], AlignmentType.LEFT),
          createHeaderCell('Lokasi', taskWidths[4]),
          createHeaderCell('Waktu', taskWidths[5]),
          createHeaderCell('Volume', taskWidths[6]),
          createHeaderCell('Status', taskWidths[7])
        ]
      })
    ];

    if (relevantTasks.length > 0) {
      relevantTasks.forEach((t, idx) => {
        const isPokok = getTaskClassification(role, t.category, t.taskType) === 'pokok';
        taskRows.push(
          new TableRow({
            cantSplit: true,
            children: [
              createBodyCell(String(idx + 1), taskWidths[0], { align: AlignmentType.CENTER, size: 19 }),
              createBodyCell(t.date || '-', taskWidths[1], { align: AlignmentType.CENTER, size: 18 }),
              createBodyCell(isPokok ? 'Tugas Pokok' : 'Tugas Tambahan', taskWidths[2], {
                align: AlignmentType.CENTER,
                bold: true,
                size: 18,
                color: isPokok ? '1E40AF' : 'B45309'
              }),
              createBodyCell(t.title, taskWidths[3], {
                bold: true,
                size: 19,
                subtext: t.description || undefined
              }),
              createBodyCell(t.location || 'Lingkungan Sekolah', taskWidths[4], { size: 18 }),
              createBodyCell(`${t.timeStart || '07.00'} - ${t.timeEnd || '08.00'}`, taskWidths[5], { align: AlignmentType.CENTER, size: 18 }),
              createBodyCell(t.volumeUnit || '1 keg.', taskWidths[6], { align: AlignmentType.CENTER, size: 18 }),
              createBodyCell(t.status === 'selesai' ? 'Tuntas 100%' : 'Terlaksana', taskWidths[7], {
                align: AlignmentType.CENTER,
                bold: true,
                size: 18,
                color: t.status === 'selesai' ? '15803D' : 'B45309'
              })
            ]
          })
        );
      });

      // Summary Row using clean columnSpan (no dummy cells!)
      taskRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell('TOTAL REKAPITULASI', taskWidths[0] + taskWidths[1] + taskWidths[2], {
              align: AlignmentType.CENTER,
              bold: true,
              fill: 'E2E8F0',
              columnSpan: 3,
              size: 19
            }),
            createBodyCell(
              `${relevantTasks.length} Tugas Operasional (${tupoksiTasks.length} Tugas Pokok / ${tambahanTasks.length} Tugas Tambahan)`,
              taskWidths[3] + taskWidths[4] + taskWidths[5] + taskWidths[6],
              {
                bold: true,
                fill: 'E2E8F0',
                columnSpan: 4,
                size: 19
              }
            ),
            createBodyCell(`${completedCount}/${relevantTasks.length} Tuntas (${completionRate}%)`, taskWidths[7], {
              align: AlignmentType.CENTER,
              bold: true,
              fill: 'E2E8F0',
              color: '15803D',
              size: 18
            })
          ]
        })
      );
    } else {
      taskRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell('Belum ada data rincian tugas operasional untuk periode ini.', CONTENT_WIDTH_DXA, {
              align: AlignmentType.CENTER,
              italics: true,
              columnSpan: 8,
              size: 20
            })
          ]
        })
      );
    }

    docChildren.push(
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        borders: tableBordersAll,
        rows: taskRows
      })
    );
  }

  // 9. KHUSUS PERPUSTAKAAN: KOLEKSI BUKU BARU (BULANAN) ATAU KATALOG KOLEKSI (TAHUNAN)
  if (isPerpus) {
    const perpusBooks = isMonthly && monthlyData
      ? libraryBooks.filter(b => {
          const targetKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
          const rawBulan = String(b.bulanPengadaan || (b.tanggalMasuk ? b.tanggalMasuk.substring(0, 7) : ''));
          return rawBulan.startsWith(targetKey) || (Boolean(b.tanggalMasuk) && b.tanggalMasuk.startsWith(targetKey));
        })
      : libraryBooks;

    docChildren.push(
      createSectionHeader(
        isMonthly
          ? `LAMPIRAN PENAMBAHAN BUKU BARU BULAN ${MONTH_NAMES[targetMonth - 1].toUpperCase()} ${targetYear}`
          : `LAMPIRAN KATALOG KOLEKSI BUKU PERPUSTAKAAN TERDATA (${libraryBooks.length} JUDUL)`
      )
    );

    // 7 cols: No(400) + Judul(2387) + Pengarang(1650) + Kelas(800) + DDC(800) + Tgl/Tahun(900) + Eks(1000) = 7937
    const bookW = [400, 2387, 1650, 800, 800, 900, 1000];
    const bookRows: TableRow[] = [
      new TableRow({
        cantSplit: true,
        tableHeader: true,
        children: [
          createHeaderCell('No', bookW[0]),
          createHeaderCell('Judul Bahan Pustaka', bookW[1], AlignmentType.LEFT),
          createHeaderCell('Pengarang / Penerbit', bookW[2]),
          createHeaderCell('Kelas', bookW[3]),
          createHeaderCell('DDC / Kategori', bookW[4]),
          createHeaderCell(isMonthly ? 'Tgl Masuk' : 'Tahun Beli', bookW[5]),
          createHeaderCell('Jml (Eks)', bookW[6])
        ]
      })
    ];

    if (perpusBooks.length > 0) {
      perpusBooks.forEach((b, idx) => {
        bookRows.push(
          new TableRow({
            cantSplit: true,
            children: [
              createBodyCell(String(idx + 1), bookW[0], { align: AlignmentType.CENTER, size: 19 }),
              createBodyCell(b.judul, bookW[1], { bold: true, size: 19 }),
              createBodyCell(`${b.pengarang || b.penulis || '-'} ${b.penerbit ? `(${b.penerbit})` : ''}`, bookW[2], { size: 18 }),
              createBodyCell(b.kelas || '-', bookW[3], { align: AlignmentType.CENTER, size: 18 }),
              createBodyCell(`${b.ddcKlasifikasi || b.ddc || '-'} / ${b.statusBuku || b.kategori || 'Umum'}`, bookW[4], { align: AlignmentType.CENTER, size: 18 }),
              createBodyCell(isMonthly ? (b.tanggalMasuk || '-') : String(b.tahunBeli || b.tahunPengadaan || '-'), bookW[5], { align: AlignmentType.CENTER, size: 18 }),
              createBodyCell(`${b.jumlah || 1} eks`, bookW[6], { align: AlignmentType.CENTER, bold: true, size: 19 })
            ]
          })
        );
      });
    } else {
      bookRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell(
              isMonthly
                ? 'Pada bulan berjalan tidak terdapat penambahan buku baru yang masuk / dibeli.'
                : 'Belum ada data buku yang terdaftar.',
              CONTENT_WIDTH_DXA,
              { align: AlignmentType.CENTER, italics: true, columnSpan: 7, size: 19 }
            )
          ]
        })
      );
    }

    docChildren.push(
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        borders: tableBordersAll,
        rows: bookRows
      })
    );
  }

  // 10. DAFTAR SARANA & PRASARANA OPERASIONAL (6 Kolom Persis UI)
  const sarprasSecNumber = isPerpus ? 'V.' : 'IV.';
  docChildren.push(
    createSectionHeader(`${sarprasSecNumber} DAFTAR SARANA & PRASARANA OPERASIONAL (${roleTitle.toUpperCase()})`)
  );

  // Widths: No(400) + Kode(1200) + Nama(2637) + Lokasi(1700) + Jumlah(950) + Kondisi(1050) = 7937
  const sarW = [400, 1200, 2637, 1700, 950, 1050];
  const sarRows: TableRow[] = [
    new TableRow({
      cantSplit: true,
      tableHeader: true,
      children: [
        createHeaderCell('No', sarW[0]),
        createHeaderCell('Kode Barang', sarW[1]),
        createHeaderCell('Nama Sarana / Prasarana', sarW[2], AlignmentType.LEFT),
        createHeaderCell('Lokasi / Ruang', sarW[3]),
        createHeaderCell('Jumlah', sarW[4]),
        createHeaderCell('Kondisi', sarW[5])
      ]
    })
  ];

  if (roleInventories.length > 0) {
    roleInventories.forEach((inv, idx) => {
      sarRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell(String(idx + 1), sarW[0], { align: AlignmentType.CENTER, size: 19 }),
            createBodyCell(inv.kodeBarang || '-', sarW[1], { align: AlignmentType.CENTER, size: 18 }),
            createBodyCell(inv.namaBarang, sarW[2], { bold: true, size: 19, subtext: inv.merkModel || undefined }),
            createBodyCell(inv.lokasiPenyimpanan || '-', sarW[3], { size: 18 }),
            createBodyCell(`${inv.jumlah} ${inv.satuan || 'Unit'}`, sarW[4], { align: AlignmentType.CENTER, bold: true, size: 19 }),
            createBodyCell(inv.kondisi || 'Baik', sarW[5], { align: AlignmentType.CENTER, bold: true, size: 19 })
          ]
        })
      );
    });
  } else {
    sarRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell(
            `Data sarana prasarana operasional unit ${roleTitle} terdata dalam kondisi baik dan terpelihara.`,
            CONTENT_WIDTH_DXA,
            { align: AlignmentType.CENTER, italics: true, columnSpan: 6, size: 19 }
          )
        ]
      })
    );
  }

  docChildren.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      borders: tableBordersAll,
      rows: sarRows
    })
  );

  // 11. LEMBAR PENGESAHAN KEDINASAN RESMI (Heading + Pernyataan + Tanda Tangan & NIP/PPPK Bersih)
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 60, line: 276 },
      children: [
        new TextRun({
          text: 'LEMBAR PENGESAHAN KEDINASAN RESMI',
          font: FONT_FAMILY,
          size: 28, // 14 pt bold
          bold: true,
          underline: {}
        })
      ]
    }),
    createBodyParagraph(
      `Laporan kinerja ${isMonthly ? `Bulan ${MONTH_NAMES[targetMonth - 1]} Tahun ${targetYear}` : `Tahun Anggaran ${targetYear}`} ini telah diperiksa, diverifikasi, dan disahkan secara berjenjang oleh Kepala Sekolah dan Pengelola Layanan sesuai ketentuan Tata Naskah Dinas di lingkungan ${schoolConfig.namaSekolah}.`,
      { align: AlignmentType.JUSTIFIED, size: 22 }
    )
  );

  const operatorRoleLabel = role === 'PERPUS' ? 'Pengelola Perpustakaan' : `Operator ${roleTitle}`;
  docChildren.push(
    await createOfficialSignatureBlockDocx({
      schoolConfig,
      role,
      operatorTitle: operatorRoleLabel,
      docDate
    })
  );

  return buildStandardDocxDocument(docChildren);
}

/**
 * 2. GENERATOR RESMI DOCX UNTUK REKAPITULASI ANGGOTA PERPUSTAKAAN (1:1 DENGAN MODAL CETAK WEB UI)
 */
export async function createLibraryMemberReportDocx(params: LibraryMemberDocxParams): Promise<Document> {
  const {
    schoolConfig,
    libraryMembers,
    memberStats,
    nomorDokumen,
    manualDate,
    includeFullList = true,
    additionMonth = 'all',
    additionYear = new Date().getFullYear()
  } = params;

  const currentYear = new Date().getFullYear();
  const defaultNoDokumen = nomorDokumen || `421.2/028/REKAP-ANGGOTA/${schoolConfig.npsn || '20202819'}/${currentYear}`;
  const defaultDate = manualDate && manualDate.trim()
    ? manualDate.trim()
    : `${schoolConfig.kabupatenKota || 'Batang Hari'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const regGuruL = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'GURU' && m.jenisKelamin === 'L').length;
  const regGuruP = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'GURU' && m.jenisKelamin === 'P').length;
  const regStaffL = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'STAFF' && m.jenisKelamin === 'L').length;
  const regStaffP = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'STAFF' && m.jenisKelamin === 'P').length;
  const regSiswaL = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'SISWA' && m.jenisKelamin === 'L').length;
  const regSiswaP = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'SISWA' && m.jenisKelamin === 'P').length;

  const guruL = memberStats?.guruLaki ?? regGuruL;
  const guruP = memberStats?.guruPerempuan ?? regGuruP;
  const totalGuru = (memberStats?.guruPendidik && memberStats.guruPendidik > 0) ? memberStats.guruPendidik : (guruL + guruP);

  const staffL = memberStats?.staffLaki ?? regStaffL;
  const staffP = memberStats?.staffPerempuan ?? regStaffP;
  const totalStaff = (memberStats?.staffTendik && memberStats.staffTendik > 0) ? memberStats.staffTendik : (staffL + staffP);

  const siswaL = Math.max(memberStats?.siswaLaki || 0, regSiswaL);
  const siswaP = Math.max(memberStats?.siswaPerempuan || 0, regSiswaP);
  const totalSiswa = siswaL + siswaP;
  const grandTotal = totalGuru + totalStaff + totalSiswa;

  const docChildren: (Paragraph | Table)[] = [];

  // 1. Kop Surat 3 Kolom dengan Logo Kiri & Kanan
  docChildren.push(await createKopSuratTable(schoolConfig));

  // 2. Judul Utama (16pt Bold) & Nomor Dokumen
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 276, before: 140, after: 40 },
      children: [
        new TextRun({
          text: 'LAPORAN REKAPITULASI JUMLAH & DATA ANGGOTA PERPUSTAKAAN SEKOLAH',
          font: FONT_FAMILY,
          size: 32, // 16 pt Bold
          bold: true,
          underline: {}
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 276, after: 40 },
      children: [
        new TextRun({
          text: `Nomor: ${defaultNoDokumen}`,
          font: FONT_FAMILY,
          size: 24,
          bold: true
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: STANDARD_PARAGRAPH_SPACING,
      children: [
        new TextRun({
          text: `Tahun Ajaran ${currentYear} / ${currentYear + 1}`,
          font: FONT_FAMILY,
          size: 24,
          italics: true
        })
      ]
    })
  );

  // 3. BAGIAN I: MATRIKS PEMUSTAKA PERPUSTAKAAN (6 Kolom Persis Web UI Modal)
  docChildren.push(createSectionHeader('I. REKAPITULASI JUMLAH ANGGOTA PEMUSTAKA SEKOLAH'));

  // Widths: No(450) + Klasifikasi(2787) + L(1150) + P(1150) + Total(1400) + Rasio(1000) = 7937 DXA
  const matW = [450, 2787, 1150, 1150, 1400, 1000];
  docChildren.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      borders: tableBordersAll,
      rows: [
        new TableRow({
          cantSplit: true,
          tableHeader: true,
          children: [
            createHeaderCell('No', matW[0]),
            createHeaderCell('Klasifikasi Pemustaka', matW[1], AlignmentType.LEFT),
            createHeaderCell('Laki-laki (L)', matW[2]),
            createHeaderCell('Perempuan (P)', matW[3]),
            createHeaderCell('Total Anggota', matW[4]),
            createHeaderCell('Rasio', matW[5])
          ]
        }),
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell('1', matW[0], { align: AlignmentType.CENTER, bold: true }),
            createBodyCell('Pendidik (Guru Sekolah)', matW[1], { bold: true }),
            createBodyCell(`${guruL} orang`, matW[2], { align: AlignmentType.CENTER }),
            createBodyCell(`${guruP} orang`, matW[3], { align: AlignmentType.CENTER }),
            createBodyCell(`${totalGuru} orang`, matW[4], { align: AlignmentType.CENTER, bold: true }),
            createBodyCell(`${grandTotal > 0 ? ((totalGuru / grandTotal) * 100).toFixed(1) : '0.0'}%`, matW[5], { align: AlignmentType.CENTER })
          ]
        }),
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell('2', matW[0], { align: AlignmentType.CENTER, bold: true }),
            createBodyCell('Tenaga Kependidikan (Staff / TU)', matW[1], { bold: true }),
            createBodyCell(`${staffL} orang`, matW[2], { align: AlignmentType.CENTER }),
            createBodyCell(`${staffP} orang`, matW[3], { align: AlignmentType.CENTER }),
            createBodyCell(`${totalStaff} orang`, matW[4], { align: AlignmentType.CENTER, bold: true }),
            createBodyCell(`${grandTotal > 0 ? ((totalStaff / grandTotal) * 100).toFixed(1) : '0.0'}%`, matW[5], { align: AlignmentType.CENTER })
          ]
        }),
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell('3', matW[0], { align: AlignmentType.CENTER, bold: true }),
            createBodyCell('Peserta Didik (Siswa / Siswi)', matW[1], { bold: true }),
            createBodyCell(`${siswaL} orang`, matW[2], { align: AlignmentType.CENTER }),
            createBodyCell(`${siswaP} orang`, matW[3], { align: AlignmentType.CENTER }),
            createBodyCell(`${totalSiswa} orang`, matW[4], { align: AlignmentType.CENTER, bold: true }),
            createBodyCell(`${grandTotal > 0 ? ((totalSiswa / grandTotal) * 100).toFixed(1) : '0.0'}%`, matW[5], { align: AlignmentType.CENTER })
          ]
        }),
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell('TOTAL KESELURUHAN PEMUSTAKA TERDAFTAR:', matW[0] + matW[1] + matW[2] + matW[3], {
              align: AlignmentType.RIGHT,
              bold: true,
              fill: 'F1F5F9',
              columnSpan: 4
            }),
            createBodyCell(`${grandTotal} Orang`, matW[4], {
              align: AlignmentType.CENTER,
              bold: true,
              fill: 'EFF6FF',
              color: '1E3A8A'
            }),
            createBodyCell('100%', matW[5], {
              align: AlignmentType.CENTER,
              bold: true,
              fill: 'EFF6FF',
              color: '1E3A8A'
            })
          ]
        })
      ]
    })
  );

  // 4. BAGIAN II: REKAPITULASI PENAMBAHAN ANGGOTA BARU BULAN TERPILIH (Jika Filter Bulan Dipilih)
  const hasMonthFilter = additionMonth !== 'all' && typeof additionMonth === 'number';
  if (hasMonthFilter) {
    const addedInMonth = libraryMembers.filter(m => isMemberJoinedInMonth(m, additionYear, additionMonth));
    const addedGuru = addedInMonth.filter(m => String(m.tipeAnggota).toUpperCase() === 'GURU').length;
    const addedStaff = addedInMonth.filter(m => String(m.tipeAnggota).toUpperCase() === 'STAFF').length;
    const addedSiswa = addedInMonth.filter(m => String(m.tipeAnggota).toUpperCase() === 'SISWA').length;
    const monthLabel = `${MONTH_NAMES[additionMonth - 1]} ${additionYear}`;

    docChildren.push(
      createSectionHeader(`II. REKAPITULASI PENAMBAHAN ANGGOTA BARU BULAN ${monthLabel.toUpperCase()}`)
    );
    docChildren.push(
      createBodyParagraph(
        `Ringkasan Penambahan Bulan ${monthLabel}: ${addedInMonth.length} Anggota Baru (Pendidik/Guru: ${addedGuru} org · Tendik/Staff: ${addedStaff} org · Siswa: ${addedSiswa} org).`,
        { bold: true, size: 22 }
      )
    );

    // 7 cols: No(380) + NoAnggota(1100) + Nama(2057) + Kategori(1100) + Kelas/Jabatan(1200) + L/P(500) + TglDaftar(1600) = 7937
    const addW = [380, 1100, 2057, 1100, 1200, 500, 1600];
    const addRows: TableRow[] = [
      new TableRow({
        cantSplit: true,
        tableHeader: true,
        children: [
          createHeaderCell('No', addW[0]),
          createHeaderCell('No. Anggota', addW[1]),
          createHeaderCell('Nama Lengkap Pemustaka Baru', addW[2], AlignmentType.LEFT),
          createHeaderCell('Kategori', addW[3]),
          createHeaderCell('Kelas / Jabatan', addW[4]),
          createHeaderCell('L/P', addW[5]),
          createHeaderCell('Tgl Terdaftar & Identitas', addW[6])
        ]
      })
    ];

    if (addedInMonth.length > 0) {
      addedInMonth.forEach((m, idx) => {
        const typeLabel = m.tipeAnggota === 'GURU' ? 'Pendidik' : m.tipeAnggota === 'STAFF' ? 'Tendik' : 'Siswa';
        addRows.push(
          new TableRow({
            cantSplit: true,
            children: [
              createBodyCell(String(idx + 1), addW[0], { align: AlignmentType.CENTER, size: 19 }),
              createBodyCell(m.nomorAnggota || '-', addW[1], { align: AlignmentType.CENTER, size: 18 }),
              createBodyCell(m.nama, addW[2], { bold: true, size: 20 }),
              createBodyCell(typeLabel, addW[3], { align: AlignmentType.CENTER, size: 19 }),
              createBodyCell(m.kelasAtauJabatan || '-', addW[4], { size: 19 }),
              createBodyCell(m.jenisKelamin || 'L', addW[5], { align: AlignmentType.CENTER, bold: true, size: 19 }),
              createBodyCell(
                m.tanggalBergabung || m.tanggalTerdaftar || '-',
                addW[6],
                { align: AlignmentType.CENTER, size: 18, subtext: m.nomorIdentitas || undefined }
              )
            ]
          })
        );
      });
    } else {
      addRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell(
              `Pada bulan ${monthLabel} tidak terdapat pendaftaran / penambahan anggota perpustakaan baru.`,
              CONTENT_WIDTH_DXA,
              { align: AlignmentType.CENTER, italics: true, columnSpan: 7, size: 20 }
            )
          ]
        })
      );
    }

    docChildren.push(
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        borders: tableBordersAll,
        rows: addRows
      })
    );
  }

  // 5. DAFTAR KESELURUHAN ANGGOTA PERPUSTAKAAN (8 Kolom Persis Web UI)
  if (includeFullList && libraryMembers.length > 0) {
    const secRoman = hasMonthFilter ? 'III.' : 'II.';
    docChildren.push(
      createSectionHeader(`${secRoman} DAFTAR KESELURUHAN ANGGOTA PERPUSTAKAAN SEKOLAH (${libraryMembers.length} PEMUSTAKA)`)
    );

    // 8 cols: No(360) + NoAng(950) + Nama(1827) + Kat(1100) + Kelas(1050) + L/P(450) + Identitas(1300) + Status(900) = 7937 DXA
    const listW = [360, 950, 1827, 1100, 1050, 450, 1300, 900];
    const listRows: TableRow[] = [
      new TableRow({
        cantSplit: true,
        tableHeader: true,
        children: [
          createHeaderCell('No', listW[0]),
          createHeaderCell('No. Anggota', listW[1]),
          createHeaderCell('Nama Pemustaka', listW[2], AlignmentType.LEFT),
          createHeaderCell('Kategori', listW[3]),
          createHeaderCell('Kelas / Jabatan', listW[4]),
          createHeaderCell('L/P', listW[5]),
          createHeaderCell('No. Identitas', listW[6]),
          createHeaderCell('Status', listW[7])
        ]
      })
    ];

    libraryMembers.forEach((m, idx) => {
      const typeLabel = m.tipeAnggota === 'GURU' ? 'Pendidik' : m.tipeAnggota === 'STAFF' ? 'Tendik' : 'Siswa';
      const statusLower = (m.status || 'aktif').toLowerCase();
      const statusLabel = statusLower === 'aktif' ? 'Aktif' : statusLower === 'tamat' || statusLower === 'alumni' ? 'Alumni' : 'Nonaktif';
      listRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell(String(idx + 1), listW[0], { align: AlignmentType.CENTER, size: 18 }),
            createBodyCell(m.nomorAnggota || '-', listW[1], { align: AlignmentType.CENTER, size: 17 }),
            createBodyCell(m.nama, listW[2], { bold: true, size: 19 }),
            createBodyCell(typeLabel, listW[3], { align: AlignmentType.CENTER, size: 18 }),
            createBodyCell(m.kelasAtauJabatan || '-', listW[4], { size: 18 }),
            createBodyCell(m.jenisKelamin || 'L', listW[5], { align: AlignmentType.CENTER, bold: true, size: 18 }),
            createBodyCell(m.nomorIdentitas || '-', listW[6], { size: 17 }),
            createBodyCell(statusLabel, listW[7], {
              align: AlignmentType.CENTER,
              bold: true,
              size: 18,
              color: statusLower === 'aktif' ? '15803D' : '64748B'
            })
          ]
        })
      );
    });

    docChildren.push(
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        borders: tableBordersAll,
        rows: listRows
      })
    );
  }

  docChildren.push(
    createBodyParagraph(
      'Demikian laporan rekapitulasi data keanggotaan perpustakaan sekolah ini disusun dan disahkan dengan sebenar-benarnya sebagai wujud tertib administrasi dan keterbukaan layanan pemustaka di lingkungan satuan pendidikan.',
      { align: AlignmentType.JUSTIFIED, size: 24, indentFirstLine: 420 }
    )
  );

  // 6. TANDA TANGAN PENGESAHAN (Kepala Sekolah Kiri, Pengelola Kanan, NIP/PPPK bersih)
  docChildren.push(
    await createOfficialSignatureBlockDocx({
      schoolConfig,
      role: 'PERPUS',
      operatorTitle: 'Pengelola Perpustakaan',
      docDate: defaultDate,
      forceTwoCol: true
    })
  );

  return buildStandardDocxDocument(docChildren);
}

/**
 * 3. GENERATOR RESMI DOCX UNTUK DOKUMEN PENDATAAN & PENGADAAN BUKU PERPUSTAKAAN
 */
export async function createLibraryBooksDocx(params: LibraryBooksDocxParams): Promise<Document> {
  const {
    schoolConfig,
    books,
    docTitle = 'KATALOG LENGKAP BUKU INVENTARIS PERPUSTAKAAN SEKOLAH',
    docSubtitle,
    nomorSurat,
    manualDate
  } = params;

  const currentYear = new Date().getFullYear();
  const defaultNoSurat = nomorSurat || `421.2/BA-BUKU/${schoolConfig.npsn || '20202819'}/${currentYear}`;
  const defaultDate = manualDate && manualDate.trim()
    ? manualDate.trim()
    : `${schoolConfig.kabupatenKota || 'Batang Hari'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const totalCopies = books.reduce((sum, b) => sum + (Number(b.jumlah) || 1), 0);
  const totalValue = books.reduce((sum, b) => sum + ((Number(b.hargaSatuan) || 0) * (Number(b.jumlah) || 1)), 0);

  const docChildren: (Paragraph | Table)[] = [];

  // Kop Surat 3 Kolom dengan Logo Kiri & Kanan
  docChildren.push(await createKopSuratTable(schoolConfig));

  // Judul Dokumen (16 pt Bold) & Sub-judul (14 pt Bold)
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 276, before: 140, after: 40 },
      children: [
        new TextRun({
          text: docTitle.toUpperCase(),
          font: FONT_FAMILY,
          size: 32, // 16 pt Bold
          bold: true
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 276, after: 40 },
      children: [
        new TextRun({
          text: docSubtitle || `Total: ${books.length} Judul Bahan Pustaka (${totalCopies} Eksemplar)`,
          font: FONT_FAMILY,
          size: 28, // 14 pt
          bold: true
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: STANDARD_PARAGRAPH_SPACING,
      children: [
        new TextRun({
          text: `Nomor: ${defaultNoSurat}`,
          font: FONT_FAMILY,
          size: 24,
          italics: true
        })
      ]
    })
  );

  // Widths sum = 7937 DXA: No(380) + Kode(900) + Judul(2257) + Kelas(750) + DDC(700) + Tahun/Sumber(1150) + Jml(650) + Nilai(1150)
  const bookW = [380, 900, 2257, 750, 700, 1150, 650, 1150];
  const bookRows: TableRow[] = [
    new TableRow({
      cantSplit: true,
      tableHeader: true,
      children: [
        createHeaderCell('No', bookW[0]),
        createHeaderCell('Kode Buku', bookW[1]),
        createHeaderCell('Judul & Penulis', bookW[2], AlignmentType.LEFT),
        createHeaderCell('Kelas', bookW[3]),
        createHeaderCell('DDC', bookW[4]),
        createHeaderCell('Thn / Sumber', bookW[5]),
        createHeaderCell('Jml', bookW[6]),
        createHeaderCell('Total Nilai', bookW[7], AlignmentType.RIGHT)
      ]
    })
  ];

  if (books.length > 0) {
    books.forEach((b, idx) => {
      const subtotal = (Number(b.hargaSatuan) || 0) * (Number(b.jumlah) || 1);
      bookRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell(String(idx + 1), bookW[0], { align: AlignmentType.CENTER, size: 18 }),
            createBodyCell(b.kodeBuku || '-', bookW[1], { align: AlignmentType.CENTER, size: 18, bold: true }),
            createBodyCell(b.judul, bookW[2], { bold: true, size: 19, subtext: `Penulis: ${b.penulis || b.pengarang || '-'}` }),
            createBodyCell(b.kelas || '-', bookW[3], { align: AlignmentType.CENTER, size: 18 }),
            createBodyCell(b.ddcKlasifikasi || b.ddc || '-', bookW[4], { align: AlignmentType.CENTER, size: 18 }),
            createBodyCell(`${b.tahunPengadaan || b.tahunBeli || b.tahunTerbit || '-'}`, bookW[5], {
              align: AlignmentType.CENTER,
              size: 18,
              subtext: b.sumberPengadaan || 'BOS Reguler'
            }),
            createBodyCell(`${b.jumlah || 1}`, bookW[6], { align: AlignmentType.CENTER, bold: true, size: 19 }),
            createBodyCell(subtotal > 0 ? `Rp ${subtotal.toLocaleString('id-ID')}` : '-', bookW[7], {
              align: AlignmentType.RIGHT,
              size: 18
            })
          ]
        })
      );
    });

    // Summary row using proper columnSpan (no dummy 0-width cells)
    bookRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell('TOTAL KESELURUHAN:', bookW[0] + bookW[1] + bookW[2] + bookW[3] + bookW[4] + bookW[5], {
            align: AlignmentType.RIGHT,
            bold: true,
            fill: 'F1F5F9',
            columnSpan: 6,
            size: 19
          }),
          createBodyCell(`${totalCopies} eks`, bookW[6], {
            align: AlignmentType.CENTER,
            bold: true,
            fill: 'F1F5F9',
            size: 19
          }),
          createBodyCell(`Rp ${totalValue.toLocaleString('id-ID')}`, bookW[7], {
            align: AlignmentType.RIGHT,
            bold: true,
            fill: 'F1F5F9',
            size: 19
          })
        ]
      })
    );
  } else {
    bookRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell('Belum ada data buku yang terdaftar.', CONTENT_WIDTH_DXA, {
            align: AlignmentType.CENTER,
            italics: true,
            columnSpan: 8,
            size: 20
          })
        ]
      })
    );
  }

  docChildren.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      borders: tableBordersAll,
      rows: bookRows
    })
  );

  docChildren.push(
    createBodyParagraph(
      'Seluruh koleksi buku sebagaimana tercantum di atas telah diperiksa dalam kondisi Baik, telah dicatat dalam Buku Induk Inventaris Perpustakaan, distempel resmi kepemilikan sekolah, serta siap dipergunakan untuk menunjang kegiatan pembelajaran siswa dan pendidik.',
      { align: AlignmentType.JUSTIFIED, size: 24, indentFirstLine: 420 }
    )
  );

  docChildren.push(
    await createOfficialSignatureBlockDocx({
      schoolConfig,
      role: 'PERPUS',
      operatorTitle: 'Pengelola Perpustakaan',
      docDate: defaultDate,
      forceTwoCol: true
    })
  );

  return buildStandardDocxDocument(docChildren);
}

/**
 * 4. GENERATOR RESMI DOCX UNTUK BUKU INDUK INVENTARIS SARPRAS KERJA (KIR) — SERAGAM UNTUK SEMUA 5 LAYANAN
 */
export async function createInventoryKirDocx(params: InventoryKirDocxParams): Promise<Document> {
  const { schoolConfig, role, roleTitle, inventories, manualDate } = params;
  const roleInventories = inventories.filter(i => i.role && i.role.trim().toUpperCase() === role.trim().toUpperCase());

  const defaultDate = manualDate && manualDate.trim()
    ? manualDate.trim()
    : `${[schoolConfig.kabupatenKota, schoolConfig.desaKecamatan].filter(Boolean)[0] || 'Sekolah'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const totalUnits = roleInventories.reduce((s, i) => s + (Number(i.jumlah) || 1), 0);
  const countBaik = roleInventories.filter(i => i.kondisi === 'Baik').length;
  const countRusakRingan = roleInventories.filter(i => i.kondisi === 'Rusak Ringan').length;
  const countRusakBerat = roleInventories.filter(i => i.kondisi === 'Rusak Berat').length;

  const docChildren: (Paragraph | Table)[] = [];

  docChildren.push(await createKopSuratTable(schoolConfig));

  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 276, before: 140, after: 40 },
      children: [
        new TextRun({
          text: 'BUKU INDUK INVENTARIS SARANA PRASARANA KERJA (KIR)',
          font: FONT_FAMILY,
          size: 32, // 16 pt bold
          bold: true,
          underline: {}
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 276, after: 40 },
      children: [
        new TextRun({
          text: `UNIT KERJA: ${roleTitle.toUpperCase()}`,
          font: FONT_FAMILY,
          size: 28, // 14 pt bold
          bold: true
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: STANDARD_PARAGRAPH_SPACING,
      children: [
        new TextRun({
          text: `Satuan Pendidikan: ${schoolConfig.namaSekolah} · Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          font: FONT_FAMILY,
          size: 22,
          italics: true
        })
      ]
    })
  );

  // 8 cols summing to 7937 DXA: No(380) + Kode(1050) + Nama(2157) + Kategori(1000) + Jumlah(800) + Kondisi(850) + Lokasi(1100) + Tahun(600)
  const kirW = [380, 1050, 2157, 1000, 800, 850, 1100, 600];
  const kirRows: TableRow[] = [
    new TableRow({
      cantSplit: true,
      tableHeader: true,
      children: [
        createHeaderCell('No', kirW[0]),
        createHeaderCell('Kode Barang', kirW[1]),
        createHeaderCell('Nama Barang & Merk / Tipe', kirW[2], AlignmentType.LEFT),
        createHeaderCell('Kategori', kirW[3]),
        createHeaderCell('Jumlah', kirW[4]),
        createHeaderCell('Kondisi', kirW[5]),
        createHeaderCell('Lokasi Simpan', kirW[6]),
        createHeaderCell('Tahun', kirW[7])
      ]
    })
  ];

  if (roleInventories.length > 0) {
    roleInventories.forEach((it, idx) => {
      kirRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell(String(idx + 1), kirW[0], { align: AlignmentType.CENTER, size: 18 }),
            createBodyCell(it.kodeBarang || '-', kirW[1], { align: AlignmentType.CENTER, size: 18 }),
            createBodyCell(it.namaBarang, kirW[2], { bold: true, size: 19, subtext: it.merkModel || undefined }),
            createBodyCell(it.kategori || '-', kirW[3], { size: 18 }),
            createBodyCell(`${it.jumlah} ${it.satuan || 'Unit'}`, kirW[4], { align: AlignmentType.CENTER, bold: true, size: 19 }),
            createBodyCell(it.kondisi || 'Baik', kirW[5], { align: AlignmentType.CENTER, bold: true, size: 18 }),
            createBodyCell(it.lokasiPenyimpanan || '-', kirW[6], { size: 18 }),
            createBodyCell(String(it.tahunPengadaan || '-'), kirW[7], { align: AlignmentType.CENTER, size: 18 })
          ]
        })
      );
    });

    kirRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell(
            `TOTAL ASET TERDATA: ${roleInventories.length} Jenis Barang`,
            kirW[0] + kirW[1] + kirW[2] + kirW[3],
            { align: AlignmentType.CENTER, bold: true, fill: 'F1F5F9', columnSpan: 4, size: 19 }
          ),
          createBodyCell(`${totalUnits} Unit`, kirW[4], {
            align: AlignmentType.CENTER,
            bold: true,
            fill: 'F1F5F9',
            size: 19,
            color: '1E3A8A'
          }),
          createBodyCell(
            `Baik: ${countBaik} · Rusak Ringan: ${countRusakRingan} · Rusak Berat: ${countRusakBerat}`,
            kirW[5] + kirW[6] + kirW[7],
            { align: AlignmentType.CENTER, fill: 'F1F5F9', columnSpan: 3, size: 18 }
          )
        ]
      })
    );
  } else {
    kirRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell('Belum ada data barang inventaris yang tercatat untuk unit kerja ini.', CONTENT_WIDTH_DXA, {
            align: AlignmentType.CENTER,
            italics: true,
            columnSpan: 8,
            size: 20
          })
        ]
      })
    );
  }

  docChildren.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      borders: tableBordersAll,
      rows: kirRows
    })
  );

  docChildren.push(
    createBodyParagraph(
      'Demikian Buku Induk Inventaris Sarana Prasarana Kerja (KIR) ini disusun dan diverifikasi sesuai kondisi fisik barang di unit layanan untuk dapat dipergunakan sebagaimana mestinya.',
      { align: AlignmentType.JUSTIFIED, size: 22, indentFirstLine: 360 }
    )
  );

  docChildren.push(
    await createOfficialSignatureBlockDocx({
      schoolConfig,
      role,
      operatorTitle: 'Petugas / Penanggung Jawab Sarpras',
      docDate: defaultDate,
      forceTwoCol: true
    })
  );

  return buildStandardDocxDocument(docChildren);
}
