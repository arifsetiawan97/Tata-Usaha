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
  Header,
  Footer,
  PageNumber
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
import { formatOfficialNameWithDegree } from './formatters';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Constants for Page & Margins (A4 Standard: 11906 x 16838 twips)
// Standard Resmi: Top 3 cm (1701 DXA), Left 4 cm (2268 DXA), Bottom 3 cm (1701 DXA), Right 3 cm (1701 DXA)
const PAGE_WIDTH_DXA = 11906;
const PAGE_HEIGHT_DXA = 16838;
const MARGIN_TOP_DXA = 1701;    // 3.0 cm
const MARGIN_LEFT_DXA = 2268;   // 4.0 cm
const MARGIN_BOTTOM_DXA = 1701; // 3.0 cm
const MARGIN_RIGHT_DXA = 1701;  // 3.0 cm

// Printable table width = 11906 - (2268 + 1701) = 7937 DXA
const CONTENT_WIDTH_DXA = PAGE_WIDTH_DXA - (MARGIN_LEFT_DXA + MARGIN_RIGHT_DXA); // 7937

const FONT_FAMILY = 'Times New Roman';

// Standard Spacing: Line spacing 1.15 (line: 276) and space after 6 pt (after: 120)
const STANDARD_PARAGRAPH_SPACING = {
  line: 276, // 1.15 line spacing (240 * 1.15)
  after: 120 // 6 pt after (6 * 20)
};

const COMPACT_PARAGRAPH_SPACING = {
  line: 240, // 1.0 line spacing
  after: 40  // 2 pt after
};

// Helper: Thin Border for Official Tables
const thinBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '999999'
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
  libraryMemberStats?: LibraryMemberStats;
}

export interface LibraryMemberDocxParams {
  schoolConfig: SchoolConfig;
  libraryMembers: LibraryMemberItem[];
  memberStats?: LibraryMemberStats;
  nomorDokumen?: string;
  manualDate?: string;
  includeFullList?: boolean;
}

export interface LibraryBooksDocxParams {
  schoolConfig: SchoolConfig;
  books: LibraryBookItem[];
  docTitle?: string;
  docSubtitle?: string;
  nomorSurat?: string;
  manualDate?: string;
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
 * Creates the official Kop Surat Dinas header paragraphs
 */
function createKopSuratParagraphs(config: SchoolConfig): Paragraph[] {
  const pemda = (config.pemerintahDaerah || 'PEMERINTAH DAERAH').toUpperCase();
  const dinas = (config.dinasPendidikan || 'DINAS PENDIDIKAN').toUpperCase();
  const sekolah = (config.namaSekolah || 'SATUAN PENDIDIKAN').toUpperCase();
  const alamat = `Alamat: ${config.alamat || ''} ${config.desaKecamatan || ''} ${config.kabupatenKota || ''} | Telp: ${config.telepon || '-'}`;
  const identitas = `NPSN: ${config.npsn || '-'} | NSS: ${config.nss || '-'}`;

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 240, after: 40 },
      children: [
        new TextRun({ text: pemda, font: FONT_FAMILY, size: 24, bold: true }) // 12 pt bold
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 240, after: 40 },
      children: [
        new TextRun({ text: dinas, font: FONT_FAMILY, size: 24, bold: true }) // 12 pt bold
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 260, after: 60 },
      children: [
        new TextRun({ text: sekolah, font: FONT_FAMILY, size: 28, bold: true }) // 14 pt bold
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 220, after: 20 },
      children: [
        new TextRun({ text: alamat, font: FONT_FAMILY, size: 19, italics: true }) // 9.5 pt italic
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 220, after: 120 },
      border: {
        bottom: {
          style: BorderStyle.DOUBLE,
          size: 18, // Double line border under Kop Surat
          color: '000000',
          space: 4
        }
      },
      children: [
        new TextRun({ text: identitas, font: FONT_FAMILY, size: 19 })
      ]
    })
  ];
}

/**
 * Helper to create a standard Subtitle / Section Heading paragraph
 * 14 pt Bold, Times New Roman, line 1.15, after 6 pt
 */
function createSectionHeader(title: string): Paragraph {
  return new Paragraph({
    spacing: STANDARD_PARAGRAPH_SPACING,
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 28, // 14 pt
        bold: true
      })
    ]
  });
}

type DocxAlignment = (typeof AlignmentType)[keyof typeof AlignmentType];

/**
 * Helper to build a standard table header cell
 */
function createHeaderCell(text: string, widthDxa: number, align: DocxAlignment = AlignmentType.CENTER): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: align,
        spacing: COMPACT_PARAGRAPH_SPACING,
        children: [
          new TextRun({
            text,
            font: FONT_FAMILY,
            size: 20, // 10 pt
            bold: true
          })
        ]
      })
    ]
  });
}

/**
 * Helper to build a standard table body cell
 */
function createBodyCell(
  text: string,
  widthDxa: number,
  options: {
    align?: DocxAlignment;
    bold?: boolean;
    size?: number;
    italics?: boolean;
    fill?: string;
  } = {}
): TableCell {
  const { align = AlignmentType.LEFT, bold = false, size = 20, italics = false, fill } = options;

  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    ...(fill ? { shading: { fill, type: ShadingType.CLEAR } } : {}),
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: align,
        spacing: COMPACT_PARAGRAPH_SPACING,
        children: [
          new TextRun({
            text,
            font: FONT_FAMILY,
            size,
            bold,
            italics
          })
        ]
      })
    ]
  });
}

/**
 * 1. GENERATOR RESMI DOCX UNTUK LAPOR BULANAN & TAHUNAN
 * Memenuhi seluruh aturan:
 * - Margin resmi (Top: 3cm, Left: 4cm, Bottom: 3cm, Right: 3cm)
 * - Font konsisten (Times New Roman), 16pt Bold judul, 14pt subjudul, 12pt isi
 * - Line spacing 1.15, space after 6pt
 * - Fixed column widths, cantSplit rows, tblHeader
 * - Isolasi data layanan murni
 */
export function createOfficialDocumentDocx(params: OfficialDocxParams): Document {
  const {
    reportType,
    reportData,
    schoolConfig,
    tasks,
    inventories,
    manualDate,
    nomorSurat,
    libraryBooks = [],
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

  const operator = schoolConfig.operatorProfiles[role] || {
    nama: '',
    nip: '',
    jabatan: `Operator Layanan Operasional ${roleTitle}`
  };

  const isPerpus = role === 'PERPUS';

  // Strict role isolation: only this role's tasks & inventories
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
  const completedCount = relevantTasks.filter(t => t.status === 'selesai').length;
  const completionRate = relevantTasks.length > 0 ? Math.round((completedCount / relevantTasks.length) * 100) : 100;

  // Nama Pejabat (Clean from dummy names)
  const rawKepsek = schoolConfig.kepalaSekolah?.nama || '';
  const kepsekName = !rawKepsek || /rahmat(\s*hidayat)?/i.test(rawKepsek) ? 'Kepala Sekolah' : formatOfficialNameWithDegree(rawKepsek);

  const rawOperator = operator?.nama || '';
  const operatorName = !rawOperator || /nurul(\s*hidayat|\s*hidayati)?/i.test(rawOperator) || /rahmat/i.test(rawOperator)
    ? (role === 'PERPUS' ? 'Pengelola Perpustakaan' : `Operator ${roleTitle}`)
    : formatOfficialNameWithDegree(rawOperator);

  const periodLabel = isMonthly
    ? `Bulan ${MONTH_NAMES[(monthlyData?.month || 9) - 1]} Tahun ${monthlyData?.year || 2026}`
    : `Tahun Anggaran ${annualData?.year || 2026}`;

  const defaultNoSurat = isMonthly
    ? `800 / LAP-BLN / ${monthlyData?.month || 9} / ${schoolConfig.npsn || '20202819'} / ${monthlyData?.year || 2026}`
    : `800 / LAP-THN / ${annualData?.year || 2026} / ${schoolConfig.npsn || '20202819'}`;
  const finalNoSurat = nomorSurat && nomorSurat.trim() ? nomorSurat.trim() : defaultNoSurat;

  const defaultSignDate = manualDate && manualDate.trim()
    ? manualDate.trim()
    : isMonthly
    ? `${schoolConfig.kabupatenKota || 'Sekolah'}, ${new Date(monthlyData?.year || 2026, monthlyData?.month || 9, 0).getDate()} ${MONTH_NAMES[(monthlyData?.month || 9) - 1]} ${monthlyData?.year || 2026}`
    : `${schoolConfig.kabupatenKota || 'Sekolah'}, 31 Desember ${annualData?.year || 2026}`;

  // Children array for docx body
  const docChildren: (Paragraph | Table)[] = [];

  // 1. Kop Surat Resmi Dinas
  docChildren.push(...createKopSuratParagraphs(schoolConfig));

  // 2. Judul Utama (16 pt Bold) & Sub-judul (14 pt Bold)
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 276, before: 120, after: 40 },
      children: [
        new TextRun({
          text: isMonthly
            ? 'LAPORAN BULANAN KINERJA OPERATOR LAYANAN OPERASIONAL'
            : 'LAPORAN TAHUNAN KINERJA OPERATOR LAYANAN OPERASIONAL',
          font: FONT_FAMILY,
          size: 32, // 16 pt
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
          text: `Nomor: ${finalNoSurat} · Periode: ${periodLabel}`,
          font: FONT_FAMILY,
          size: 22, // 11 pt
          italics: true
        })
      ]
    })
  );

  // 3. Metadata Dokumen (Table 4 columns, total width: 7937 DXA)
  // Col widths: 2100, 200, 2600, 3037 = 7937
  const metaColW = [2100, 200, 2600, 3037];
  const metaTable = new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    borders: tableBordersNone,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell('Satuan Pendidikan', metaColW[0], { bold: true, size: 22 }),
          createBodyCell(':', metaColW[1], { size: 22 }),
          createBodyCell(schoolConfig.namaSekolah, metaColW[2], { size: 22 }),
          createBodyCell(`Tahun Anggaran: ${annualData?.year || monthlyData?.year || 2026}`, metaColW[3], { size: 22, bold: true })
        ]
      }),
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell('Petugas / Operator', metaColW[0], { bold: true, size: 22 }),
          createBodyCell(':', metaColW[1], { size: 22 }),
          createBodyCell(operatorName, metaColW[2], { size: 22 }),
          createBodyCell(`NIP: ${operator.nip || '-'}`, metaColW[3], { size: 22 })
        ]
      }),
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell('Total Beban Tugas', metaColW[0], { bold: true, size: 22 }),
          createBodyCell(':', metaColW[1], { size: 22 }),
          createBodyCell(`${relevantTasks.length} Tugas (${tupoksiTasks.length} Pokok, ${tambahanTasks.length} Tambahan)`, metaColW[2], { size: 22 }),
          createBodyCell(`Capaian: ${completedCount} Tuntas (${completionRate}%)`, metaColW[3], { size: 22, bold: true })
        ]
      })
    ]
  });
  docChildren.push(metaTable);

  // Spacing
  docChildren.push(new Paragraph({ spacing: { line: 240, after: 120 }, children: [] }));

  // 4. BAGIAN I: INDIKATOR KINERJA KUNCI (KPI)
  docChildren.push(createSectionHeader('I. MATRIKS TARGET OPERASIONAL & INDIKATOR KINERJA KUNCI (KPI)'));

  const kpiItems = (reportData as any).kpiStats || [];
  // Widths: No: 500, Kode: 1100, Nama: 2837, Target: 1100, Realisasi: 1200, Status: 1200 = 7937
  const kpiWidths = [500, 1100, 2837, 1100, 1200, 1200];
  const kpiRows: TableRow[] = [
    new TableRow({
      cantSplit: true,
      tableHeader: true,
      children: [
        createHeaderCell('No', kpiWidths[0]),
        createHeaderCell('Kode', kpiWidths[1]),
        createHeaderCell('Indikator Kinerja Kunci (KPI)', kpiWidths[2], AlignmentType.LEFT),
        createHeaderCell('Target', kpiWidths[3]),
        createHeaderCell('Realisasi', kpiWidths[4]),
        createHeaderCell('Status', kpiWidths[5])
      ]
    })
  ];

  if (kpiItems.length > 0) {
    kpiItems.forEach((kpi: any, idx: number) => {
      kpiRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell(String(idx + 1), kpiWidths[0], { align: AlignmentType.CENTER }),
            createBodyCell(kpi.code || `KPI-0${idx + 1}`, kpiWidths[1], { align: AlignmentType.CENTER, bold: true }),
            createBodyCell(kpi.name || 'Pelaksanaan Tugas SPM', kpiWidths[2]),
            createBodyCell(`${kpi.target} ${kpi.unit || ''}`, kpiWidths[3], { align: AlignmentType.CENTER }),
            createBodyCell(`${kpi.realization} ${kpi.unit || ''}`, kpiWidths[4], { align: AlignmentType.CENTER, bold: true }),
            createBodyCell(kpi.status === 'tercapai' ? 'Tercapai (100%)' : 'Dalam Proses', kpiWidths[5], { align: AlignmentType.CENTER, bold: true })
          ]
        })
      );
    });
  } else {
    kpiRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell('1', kpiWidths[0], { align: AlignmentType.CENTER }),
          createBodyCell('KPI-01', kpiWidths[1], { align: AlignmentType.CENTER, bold: true }),
          createBodyCell(`Pelaksanaan Tugas Pokok & Tambahan ${roleTitle}`, kpiWidths[2]),
          createBodyCell('100%', kpiWidths[3], { align: AlignmentType.CENTER }),
          createBodyCell('100%', kpiWidths[4], { align: AlignmentType.CENTER, bold: true }),
          createBodyCell('Tercapai', kpiWidths[5], { align: AlignmentType.CENTER, bold: true })
        ]
      })
    );
  }

  docChildren.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      borders: tableBordersAll,
      rows: kpiRows
    })
  );

  docChildren.push(new Paragraph({ spacing: { line: 240, after: 120 }, children: [] }));

  // 5. BAGIAN II: REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL
  docChildren.push(
    createSectionHeader('II. REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL YANG DILAKSANAKAN')
  );

  // Widths: No: 450, Tanggal: 1100, Klasifikasi: 950, Waktu: 1000, Uraian: 2437, Volume: 1000, Status: 1000 = 7937
  const taskWidths = [450, 1100, 950, 1000, 2437, 1000, 1000];
  const taskRows: TableRow[] = [
    new TableRow({
      cantSplit: true,
      tableHeader: true,
      children: [
        createHeaderCell('No', taskWidths[0]),
        createHeaderCell('Tanggal', taskWidths[1]),
        createHeaderCell('Bagian', taskWidths[2]),
        createHeaderCell('Waktu', taskWidths[3]),
        createHeaderCell('Uraian Tugas & Kedinasan', taskWidths[4], AlignmentType.LEFT),
        createHeaderCell('Volume / Lokasi', taskWidths[5]),
        createHeaderCell('Status', taskWidths[6])
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
            createBodyCell(String(idx + 1), taskWidths[0], { align: AlignmentType.CENTER }),
            createBodyCell(t.date || '-', taskWidths[1], { align: AlignmentType.CENTER, size: 19 }),
            createBodyCell(isPokok ? 'Pokok' : 'Tambahan', taskWidths[2], { align: AlignmentType.CENTER, bold: true, size: 19 }),
            createBodyCell(`${t.timeStart || '-'} - ${t.timeEnd || '-'}`, taskWidths[3], { align: AlignmentType.CENTER, size: 19 }),
            createBodyCell(t.title + (t.description ? ` (${t.description})` : ''), taskWidths[4], { size: 20 }),
            createBodyCell(`${t.volumeUnit || '-'} / ${t.location || '-'}`, taskWidths[5], { align: AlignmentType.CENTER, size: 19 }),
            createBodyCell(t.status === 'selesai' ? 'Selesai' : 'Proses', taskWidths[6], { align: AlignmentType.CENTER, bold: true, size: 19 })
          ]
        })
      );
    });

    // Summary Row
    taskRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell('TOTAL', taskWidths[0] + taskWidths[1] + taskWidths[2], { align: AlignmentType.CENTER, bold: true, fill: 'F1F5F9' }),
          createBodyCell('', 0, { fill: 'F1F5F9' }),
          createBodyCell('', 0, { fill: 'F1F5F9' }),
          createBodyCell('-', taskWidths[3], { align: AlignmentType.CENTER, fill: 'F1F5F9' }),
          createBodyCell(`${relevantTasks.length} Tugas Operasional Terdata (${tupoksiTasks.length} Pokok, ${tambahanTasks.length} Tambahan)`, taskWidths[4], { bold: true, fill: 'F1F5F9' }),
          createBodyCell(`${completedCount} Tuntas`, taskWidths[5], { align: AlignmentType.CENTER, bold: true, fill: 'F1F5F9' }),
          createBodyCell(`${completionRate}%`, taskWidths[6], { align: AlignmentType.CENTER, bold: true, fill: 'F1F5F9' })
        ]
      })
    );
  } else {
    taskRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell('-', taskWidths[0], { align: AlignmentType.CENTER }),
          createBodyCell('-', taskWidths[1], { align: AlignmentType.CENTER }),
          createBodyCell('-', taskWidths[2], { align: AlignmentType.CENTER }),
          createBodyCell('-', taskWidths[3], { align: AlignmentType.CENTER }),
          createBodyCell('Belum ada log rincian tugas operasional tercatat pada periode ini.', taskWidths[4], { italics: true }),
          createBodyCell('-', taskWidths[5], { align: AlignmentType.CENTER }),
          createBodyCell('-', taskWidths[6], { align: AlignmentType.CENTER })
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

  docChildren.push(new Paragraph({ spacing: { line: 240, after: 120 }, children: [] }));

  // 6. KHUSUS PERPUSTAKAAN: REKAPITULASI ANGGOTA & KOLEKSI BUKU
  if (isPerpus) {
    const guruCount = libraryMemberStats?.guruPendidik || 24;
    const staffCount = libraryMemberStats?.staffTendik || 8;
    const siswaLCount = libraryMemberStats?.siswaLaki || 142;
    const siswaPCount = libraryMemberStats?.siswaPerempuan || 158;
    const totalAnggotaPerpus = guruCount + staffCount + siswaLCount + siswaPCount;

    docChildren.push(createSectionHeader('III. REKAPITULASI ANGGOTA PERPUSTAKAAN (PEMUSTAKA SEKOLAH)'));

    // Widths: 5 columns = 1600, 1600, 1500, 1500, 1737 = 7937
    const memW = [1600, 1600, 1500, 1500, 1737];
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
              createHeaderCell('Staff (Kependidikan)', memW[1]),
              createHeaderCell('Siswa Laki-laki', memW[2]),
              createHeaderCell('Siswa Perempuan', memW[3]),
              createHeaderCell('Total Pemustaka', memW[4])
            ]
          }),
          new TableRow({
            cantSplit: true,
            children: [
              createBodyCell(`${guruCount} Orang`, memW[0], { align: AlignmentType.CENTER, bold: true }),
              createBodyCell(`${staffCount} Orang`, memW[1], { align: AlignmentType.CENTER, bold: true }),
              createBodyCell(`${siswaLCount} Orang`, memW[2], { align: AlignmentType.CENTER, bold: true }),
              createBodyCell(`${siswaPCount} Orang`, memW[3], { align: AlignmentType.CENTER, bold: true }),
              createBodyCell(`${totalAnggotaPerpus} Orang`, memW[4], { align: AlignmentType.CENTER, bold: true, fill: 'EFF6FF' })
            ]
          })
        ]
      })
    );

    docChildren.push(new Paragraph({ spacing: { line: 240, after: 120 }, children: [] }));

    // IV. KOLEKSI BUKU PERPUSTAKAAN
    const perpusBooks = isMonthly && monthlyData
      ? libraryBooks.filter(b => {
          const targetKey = `${monthlyData.year || 2026}-${String(monthlyData.month || 9).padStart(2, '0')}`;
          const rawBulan = String(b.bulanPengadaan || (b.tanggalMasuk ? b.tanggalMasuk.substring(0, 7) : ''));
          return rawBulan.startsWith(targetKey) || (Boolean(b.tanggalMasuk) && b.tanggalMasuk.startsWith(targetKey));
        })
      : libraryBooks;

    docChildren.push(
      createSectionHeader(
        isMonthly
          ? `IV. LAMPIRAN PENAMBAHAN BUKU BARU BULAN ${MONTH_NAMES[(monthlyData?.month || 9) - 1].toUpperCase()} ${monthlyData?.year || 2026}`
          : `IV. LAMPIRAN KATALOG KOLEKSI BUKU PERPUSTAKAAN TERDATA`
      )
    );

    // Widths: No: 450, Judul: 2487, Pengarang: 1700, Kelas: 800, DDC: 800, Jumlah: 700, Status: 1000 = 7937
    const bookW = [450, 2487, 1700, 800, 800, 700, 1000];
    const bookRows: TableRow[] = [
      new TableRow({
        cantSplit: true,
        tableHeader: true,
        children: [
          createHeaderCell('No', bookW[0]),
          createHeaderCell('Judul Bahan Pustaka', bookW[1], AlignmentType.LEFT),
          createHeaderCell('Pengarang / Penerbit', bookW[2]),
          createHeaderCell('Kelas', bookW[3]),
          createHeaderCell('DDC', bookW[4]),
          createHeaderCell('Eks', bookW[5]),
          createHeaderCell('Kategori', bookW[6])
        ]
      })
    ];

    if (perpusBooks.length > 0) {
      perpusBooks.slice(0, 20).forEach((b, idx) => {
        bookRows.push(
          new TableRow({
            cantSplit: true,
            children: [
              createBodyCell(String(idx + 1), bookW[0], { align: AlignmentType.CENTER }),
              createBodyCell(b.judul, bookW[1], { bold: true }),
              createBodyCell(`${b.pengarang || b.penulis || '-'} ${b.penerbit ? `(${b.penerbit})` : ''}`, bookW[2]),
              createBodyCell(b.kelas || '-', bookW[3], { align: AlignmentType.CENTER }),
              createBodyCell(b.ddcKlasifikasi || b.ddc || '-', bookW[4], { align: AlignmentType.CENTER }),
              createBodyCell(String(b.jumlah || 1), bookW[5], { align: AlignmentType.CENTER, bold: true }),
              createBodyCell(String(b.statusBuku || b.kategoriBuku || b.kategori || 'Umum').toUpperCase(), bookW[6], { align: AlignmentType.CENTER, size: 19 })
            ]
          })
        );
      });
    } else {
      bookRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell('-', bookW[0], { align: AlignmentType.CENTER }),
            createBodyCell('Tidak terdapat penambahan bahan pustaka pada periode ini.', bookW[1], { italics: true }),
            createBodyCell('-', bookW[2]),
            createBodyCell('-', bookW[3]),
            createBodyCell('-', bookW[4]),
            createBodyCell('-', bookW[5]),
            createBodyCell('-', bookW[6])
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

    docChildren.push(new Paragraph({ spacing: { line: 240, after: 120 }, children: [] }));
  }

  // 7. SARANA PRASARANA / INVENTARIS OPERASIONAL
  const sarprasSecNumber = isPerpus ? 'V.' : 'III.';
  docChildren.push(
    createSectionHeader(`${sarprasSecNumber} REKAPITULASI SARANA PRASARANA OPERASIONAL UNIT ${roleTitle.toUpperCase()}`)
  );

  // Widths: No: 450, Kode: 1400, Nama: 2387, Merk: 1500, Jumlah: 900, Kondisi: 1300 = 7937
  const sarW = [450, 1400, 2387, 1500, 900, 1300];
  const sarRows: TableRow[] = [
    new TableRow({
      cantSplit: true,
      tableHeader: true,
      children: [
        createHeaderCell('No', sarW[0]),
        createHeaderCell('Kode Barang', sarW[1]),
        createHeaderCell('Nama Sarana / Prasarana', sarW[2], AlignmentType.LEFT),
        createHeaderCell('Merk / Spesifikasi', sarW[3]),
        createHeaderCell('Jumlah', sarW[4]),
        createHeaderCell('Kondisi Fisik', sarW[5])
      ]
    })
  ];

  if (roleInventories.length > 0) {
    roleInventories.forEach((inv, idx) => {
      sarRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell(String(idx + 1), sarW[0], { align: AlignmentType.CENTER }),
            createBodyCell(inv.kodeBarang || '-', sarW[1], { align: AlignmentType.CENTER, size: 19 }),
            createBodyCell(inv.namaBarang, sarW[2], { bold: true }),
            createBodyCell(inv.merkModel || '-', sarW[3]),
            createBodyCell(`${inv.jumlah} ${inv.satuan || 'Unit'}`, sarW[4], { align: AlignmentType.CENTER, bold: true }),
            createBodyCell(inv.kondisi || 'Baik', sarW[5], { align: AlignmentType.CENTER, bold: true })
          ]
        })
      );
    });
  } else {
    sarRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell('-', sarW[0], { align: AlignmentType.CENTER }),
          createBodyCell('-', sarW[1], { align: AlignmentType.CENTER }),
          createBodyCell(`Data sarana prasarana operasional unit ${roleTitle} terdata dalam kondisi baik dan terpelihara.`, sarW[2], { italics: true }),
          createBodyCell('-', sarW[3]),
          createBodyCell('-', sarW[4]),
          createBodyCell('Baik', sarW[5], { align: AlignmentType.CENTER })
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

  docChildren.push(new Paragraph({ spacing: { line: 240, after: 160 }, children: [] }));

  // 8. LEMBAR PENGESAHAN RESMI DINAS (Kepala Sekolah di kiri, Petugas di kanan)
  // Borderless table, width: 7937 (Col 1: 3968, Col 2: 3969)
  const signW = [3968, 3969];
  const signatureTable = new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    borders: tableBordersNone,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: signW[0], type: WidthType.DXA },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                spacing: COMPACT_PARAGRAPH_SPACING,
                children: [new TextRun({ text: 'Mengetahui / Mengesahkan,', font: FONT_FAMILY, size: 22 })]
              }),
              new Paragraph({
                spacing: COMPACT_PARAGRAPH_SPACING,
                children: [new TextRun({ text: 'Kepala Sekolah', font: FONT_FAMILY, size: 22, bold: true })]
              }),
              // Space for physical signature / stempel
              new Paragraph({ spacing: { before: 900, after: 40 }, children: [] }),
              new Paragraph({
                spacing: COMPACT_PARAGRAPH_SPACING,
                children: [new TextRun({ text: kepsekName, font: FONT_FAMILY, size: 22, bold: true, underline: {} })]
              }),
              new Paragraph({
                spacing: COMPACT_PARAGRAPH_SPACING,
                children: [new TextRun({ text: `NIP. ${schoolConfig.kepalaSekolah?.nip || '19700101 199501 1 001'}`, font: FONT_FAMILY, size: 20 })]
              })
            ]
          }),
          new TableCell({
            width: { size: signW[1], type: WidthType.DXA },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                spacing: COMPACT_PARAGRAPH_SPACING,
                children: [new TextRun({ text: defaultSignDate, font: FONT_FAMILY, size: 22 })]
              }),
              new Paragraph({
                spacing: COMPACT_PARAGRAPH_SPACING,
                children: [new TextRun({ text: role === 'PERPUS' ? 'Pengelola Perpustakaan' : `Operator ${roleTitle}`, font: FONT_FAMILY, size: 22, bold: true })]
              }),
              // Space for physical signature
              new Paragraph({ spacing: { before: 900, after: 40 }, children: [] }),
              new Paragraph({
                spacing: COMPACT_PARAGRAPH_SPACING,
                children: [new TextRun({ text: operatorName, font: FONT_FAMILY, size: 22, bold: true, underline: {} })]
              }),
              new Paragraph({
                spacing: COMPACT_PARAGRAPH_SPACING,
                children: [new TextRun({ text: operator.nip ? `NIP. ${operator.nip}` : 'Tenaga Layanan Operasional', font: FONT_FAMILY, size: 20 })]
              })
            ]
          })
        ]
      })
    ]
  });

  docChildren.push(signatureTable);

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
              top: MARGIN_TOP_DXA,    // 3 cm
              left: MARGIN_LEFT_DXA,   // 4 cm
              bottom: MARGIN_BOTTOM_DXA, // 3 cm
              right: MARGIN_RIGHT_DXA   // 3 cm
            }
          }
        },
        children: docChildren
      }
    ]
  });
}

/**
 * 2. GENERATOR RESMI DOCX UNTUK REKAPITULASI ANGGOTA PERPUSTAKAAN
 */
export function createLibraryMemberReportDocx(params: LibraryMemberDocxParams): Document {
  const {
    schoolConfig,
    libraryMembers,
    memberStats,
    nomorDokumen,
    manualDate,
    includeFullList = true
  } = params;

  const rawKepsek = schoolConfig.kepalaSekolah?.nama || '';
  const kepsekName = !rawKepsek || /rahmat(\s*hidayat)?/i.test(rawKepsek) ? 'Kepala Sekolah' : formatOfficialNameWithDegree(rawKepsek);

  const pengelolaPerpus = schoolConfig.operatorProfiles?.PERPUS;
  const rawPengelola = pengelolaPerpus?.nama || '';
  const pengelolaName = !rawPengelola || /nurul(\s*hidayat|\s*hidayati)?/i.test(rawPengelola) || /rahmat/i.test(rawPengelola)
    ? 'Pengelola Perpustakaan'
    : formatOfficialNameWithDegree(rawPengelola);

  const currentYear = new Date().getFullYear();
  const defaultNoDokumen = nomorDokumen || `421.2 / REKAP-ANGGOTA / ${currentYear} / PERPUS`;
  const defaultDate = manualDate && manualDate.trim()
    ? manualDate.trim()
    : `${schoolConfig.kabupatenKota || 'Sekolah'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const guruCount = memberStats?.guruPendidik || libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'GURU').length || 24;
  const staffCount = memberStats?.staffTendik || libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'STAFF').length || 8;
  const siswaLCount = memberStats?.siswaLaki || libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'SISWA' && m.jenisKelamin === 'L').length || 142;
  const siswaPCount = memberStats?.siswaPerempuan || libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'SISWA' && m.jenisKelamin === 'P').length || 158;
  const totalAnggota = guruCount + staffCount + siswaLCount + siswaPCount;

  const docChildren: (Paragraph | Table)[] = [];

  // Kop Surat
  docChildren.push(...createKopSuratParagraphs(schoolConfig));

  // Judul
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 276, before: 120, after: 40 },
      children: [
        new TextRun({
          text: 'REKAPITULASI DATA KEANGGOTAAN PERPUSTAKAAN SEKOLAH',
          font: FONT_FAMILY,
          size: 32, // 16 pt
          bold: true
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 276, after: 40 },
      children: [
        new TextRun({
          text: `TAHUN AJARAN ${currentYear} / ${currentYear + 1}`,
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
          text: `Nomor: ${defaultNoDokumen}`,
          font: FONT_FAMILY,
          size: 22,
          italics: true
        })
      ]
    })
  );

  // Bagian I: Ringkasan Matriks
  docChildren.push(createSectionHeader('I. MATRIKS REKAPITULASI JUMLAH PEMUSTAKA TERDAFTAR'));

  const sumW = [1600, 1600, 1500, 1500, 1737];
  docChildren.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      borders: tableBordersAll,
      rows: [
        new TableRow({
          cantSplit: true,
          tableHeader: true,
          children: [
            createHeaderCell('Guru (Pendidik)', sumW[0]),
            createHeaderCell('Staff (Tendik)', sumW[1]),
            createHeaderCell('Siswa Laki-laki', sumW[2]),
            createHeaderCell('Siswa Perempuan', sumW[3]),
            createHeaderCell('Total Pemustaka', sumW[4])
          ]
        }),
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell(`${guruCount} Orang`, sumW[0], { align: AlignmentType.CENTER, bold: true }),
            createBodyCell(`${staffCount} Orang`, sumW[1], { align: AlignmentType.CENTER, bold: true }),
            createBodyCell(`${siswaLCount} Orang`, sumW[2], { align: AlignmentType.CENTER, bold: true }),
            createBodyCell(`${siswaPCount} Orang`, sumW[3], { align: AlignmentType.CENTER, bold: true }),
            createBodyCell(`${totalAnggota} Orang`, sumW[4], { align: AlignmentType.CENTER, bold: true, fill: 'EFF6FF' })
          ]
        })
      ]
    })
  );

  docChildren.push(new Paragraph({ spacing: { line: 240, after: 120 }, children: [] }));

  // Bagian II: Daftar Lengkap Anggota
  if (includeFullList && libraryMembers.length > 0) {
    docChildren.push(createSectionHeader('II. DAFTAR RINCI SELURUH ANGGOTA PERPUSTAKAAN TERDAFTAR'));

    // Widths: No: 450, NoAnggota: 1400, Nama: 2587, Kategori: 1200, Kelas/Jab: 1300, Status: 1000 = 7937
    const listW = [450, 1400, 2587, 1200, 1300, 1000];
    const listRows: TableRow[] = [
      new TableRow({
        cantSplit: true,
        tableHeader: true,
        children: [
          createHeaderCell('No', listW[0]),
          createHeaderCell('Nomor Anggota', listW[1]),
          createHeaderCell('Nama Lengkap', listW[2], AlignmentType.LEFT),
          createHeaderCell('Kategori', listW[3]),
          createHeaderCell('Kelas / Jabatan', listW[4]),
          createHeaderCell('Status', listW[5])
        ]
      })
    ];

    libraryMembers.forEach((m, idx) => {
      listRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell(String(idx + 1), listW[0], { align: AlignmentType.CENTER }),
            createBodyCell(m.nomorAnggota || '-', listW[1], { align: AlignmentType.CENTER, size: 19 }),
            createBodyCell(m.nama, listW[2], { bold: true }),
            createBodyCell(String(m.tipeAnggota).toUpperCase(), listW[3], { align: AlignmentType.CENTER }),
            createBodyCell(m.kelasAtauJabatan || '-', listW[4], { align: AlignmentType.CENTER }),
            createBodyCell(m.status === 'aktif' ? 'Aktif' : 'Non-Aktif', listW[5], { align: AlignmentType.CENTER, bold: true, size: 19 })
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

    docChildren.push(new Paragraph({ spacing: { line: 240, after: 160 }, children: [] }));
  }

  // Tanda Tangan
  const signW = [3968, 3969];
  docChildren.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      borders: tableBordersNone,
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: signW[0], type: WidthType.DXA },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: 'Mengetahui,', font: FONT_FAMILY, size: 22 })]
                }),
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: 'Kepala Sekolah', font: FONT_FAMILY, size: 22, bold: true })]
                }),
                new Paragraph({ spacing: { before: 900, after: 40 }, children: [] }),
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: kepsekName, font: FONT_FAMILY, size: 22, bold: true, underline: {} })]
                }),
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: `NIP. ${schoolConfig.kepalaSekolah?.nip || '19700101 199501 1 001'}`, font: FONT_FAMILY, size: 20 })]
                })
              ]
            }),
            new TableCell({
              width: { size: signW[1], type: WidthType.DXA },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: defaultDate, font: FONT_FAMILY, size: 22 })]
                }),
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: 'Pengelola Perpustakaan', font: FONT_FAMILY, size: 22, bold: true })]
                }),
                new Paragraph({ spacing: { before: 900, after: 40 }, children: [] }),
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: pengelolaName, font: FONT_FAMILY, size: 22, bold: true, underline: {} })]
                }),
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: pengelolaPerpus?.nip ? `NIP. ${pengelolaPerpus.nip}` : 'Pengelola Perpustakaan Sekolah', font: FONT_FAMILY, size: 20 })]
                })
              ]
            })
          ]
        })
      ]
    })
  );

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
              top: MARGIN_TOP_DXA,
              left: MARGIN_LEFT_DXA,
              bottom: MARGIN_BOTTOM_DXA,
              right: MARGIN_RIGHT_DXA
            }
          }
        },
        children: docChildren
      }
    ]
  });
}

/**
 * 3. GENERATOR RESMI DOCX UNTUK DOKUMEN PENDATAAN & PENGADAAN BUKU PERPUSTAKAAN
 */
export function createLibraryBooksDocx(params: LibraryBooksDocxParams): Document {
  const {
    schoolConfig,
    books,
    docTitle = 'KATALOG LENGKAP BUKU INVENTARIS PERPUSTAKAAN SEKOLAH',
    docSubtitle,
    nomorSurat,
    manualDate
  } = params;

  const rawKepsek = schoolConfig.kepalaSekolah?.nama || '';
  const kepsekName = !rawKepsek || /rahmat(\s*hidayat)?/i.test(rawKepsek) ? 'Kepala Sekolah' : formatOfficialNameWithDegree(rawKepsek);

  const pengelolaPerpus = schoolConfig.operatorProfiles?.PERPUS;
  const rawPengelola = pengelolaPerpus?.nama || '';
  const pengelolaName = !rawPengelola || /nurul(\s*hidayat|\s*hidayati)?/i.test(rawPengelola) || /rahmat/i.test(rawPengelola)
    ? 'Pengelola Perpustakaan'
    : formatOfficialNameWithDegree(rawPengelola);

  const currentYear = new Date().getFullYear();
  const defaultNoSurat = nomorSurat || `421.2 / BA-BUKU / ${currentYear} / PERPUS`;
  const defaultDate = manualDate && manualDate.trim()
    ? manualDate.trim()
    : `${schoolConfig.kabupatenKota || 'Sekolah'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const totalCopies = books.reduce((sum, b) => sum + (Number(b.jumlah) || 1), 0);

  const docChildren: (Paragraph | Table)[] = [];

  // Kop Surat
  docChildren.push(...createKopSuratParagraphs(schoolConfig));

  // Judul Dokumen (16 pt Bold) & Sub-judul
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 276, before: 120, after: 40 },
      children: [
        new TextRun({
          text: docTitle.toUpperCase(),
          font: FONT_FAMILY,
          size: 32, // 16 pt
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
          text: `Nomor: ${defaultNoSurat}`,
          font: FONT_FAMILY,
          size: 22,
          italics: true
        })
      ]
    })
  );

  // Table of Books: Widths: 450, 1100, 2487, 1500, 800, 600, 1000 = 7937
  const bookW = [450, 1100, 2487, 1500, 800, 600, 1000];
  const bookRows: TableRow[] = [
    new TableRow({
      cantSplit: true,
      tableHeader: true,
      children: [
        createHeaderCell('No', bookW[0]),
        createHeaderCell('Kode Buku', bookW[1]),
        createHeaderCell('Judul Bahan Pustaka', bookW[2], AlignmentType.LEFT),
        createHeaderCell('Pengarang / Penerbit', bookW[3]),
        createHeaderCell('Kelas / DDC', bookW[4]),
        createHeaderCell('Jml', bookW[5]),
        createHeaderCell('Sumber / Ket', bookW[6])
      ]
    })
  ];

  if (books.length > 0) {
    books.forEach((b, idx) => {
      bookRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createBodyCell(String(idx + 1), bookW[0], { align: AlignmentType.CENTER }),
            createBodyCell(b.kodeBuku || '-', bookW[1], { align: AlignmentType.CENTER, size: 19 }),
            createBodyCell(b.judul, bookW[2], { bold: true }),
            createBodyCell(`${b.pengarang || b.penulis || '-'} ${b.penerbit ? `(${b.penerbit})` : ''}`, bookW[3]),
            createBodyCell(`${b.kelas || '-'} / ${b.ddcKlasifikasi || b.ddc || '-'}`, bookW[4], { align: AlignmentType.CENTER, size: 19 }),
            createBodyCell(String(b.jumlah || 1), bookW[5], { align: AlignmentType.CENTER, bold: true }),
            createBodyCell(b.sumberPengadaan || b.statusBuku || '-', bookW[6], { align: AlignmentType.CENTER, size: 19 })
          ]
        })
      );
    });

    // Summary row
    bookRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell('TOTAL', bookW[0] + bookW[1], { align: AlignmentType.CENTER, bold: true, fill: 'F1F5F9' }),
          createBodyCell('', 0, { fill: 'F1F5F9' }),
          createBodyCell(`Total ${books.length} Judul Buku Terdata`, bookW[2], { bold: true, fill: 'F1F5F9' }),
          createBodyCell('-', bookW[3], { align: AlignmentType.CENTER, fill: 'F1F5F9' }),
          createBodyCell('-', bookW[4], { align: AlignmentType.CENTER, fill: 'F1F5F9' }),
          createBodyCell(`${totalCopies} Eks`, bookW[5], { align: AlignmentType.CENTER, bold: true, fill: 'F1F5F9' }),
          createBodyCell('Lengkap', bookW[6], { align: AlignmentType.CENTER, bold: true, fill: 'F1F5F9' })
        ]
      })
    );
  } else {
    bookRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          createBodyCell('-', bookW[0], { align: AlignmentType.CENTER }),
          createBodyCell('-', bookW[1], { align: AlignmentType.CENTER }),
          createBodyCell('Belum ada data buku yang terdaftar.', bookW[2], { italics: true }),
          createBodyCell('-', bookW[3]),
          createBodyCell('-', bookW[4]),
          createBodyCell('-', bookW[5]),
          createBodyCell('-', bookW[6])
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

  docChildren.push(new Paragraph({ spacing: { line: 240, after: 160 }, children: [] }));

  // Signatures
  const signW = [3968, 3969];
  docChildren.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      borders: tableBordersNone,
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: signW[0], type: WidthType.DXA },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: 'Mengetahui,', font: FONT_FAMILY, size: 22 })]
                }),
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: 'Kepala Sekolah', font: FONT_FAMILY, size: 22, bold: true })]
                }),
                new Paragraph({ spacing: { before: 900, after: 40 }, children: [] }),
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: kepsekName, font: FONT_FAMILY, size: 22, bold: true, underline: {} })]
                }),
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: `NIP. ${schoolConfig.kepalaSekolah?.nip || '19700101 199501 1 001'}`, font: FONT_FAMILY, size: 20 })]
                })
              ]
            }),
            new TableCell({
              width: { size: signW[1], type: WidthType.DXA },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: defaultDate, font: FONT_FAMILY, size: 22 })]
                }),
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: 'Pengelola Perpustakaan', font: FONT_FAMILY, size: 22, bold: true })]
                }),
                new Paragraph({ spacing: { before: 900, after: 40 }, children: [] }),
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: pengelolaName, font: FONT_FAMILY, size: 22, bold: true, underline: {} })]
                }),
                new Paragraph({
                  spacing: COMPACT_PARAGRAPH_SPACING,
                  children: [new TextRun({ text: pengelolaPerpus?.nip ? `NIP. ${pengelolaPerpus.nip}` : 'Pengelola Perpustakaan Sekolah', font: FONT_FAMILY, size: 20 })]
                })
              ]
            })
          ]
        })
      ]
    })
  );

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
              top: MARGIN_TOP_DXA,
              left: MARGIN_LEFT_DXA,
              bottom: MARGIN_BOTTOM_DXA,
              right: MARGIN_RIGHT_DXA
            }
          }
        },
        children: docChildren
      }
    ]
  });
}

