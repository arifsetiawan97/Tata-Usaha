import {
  Document,
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
  BeritaAcaraSignatory,
  GeneratedBeritaAcaraContent,
  SchoolConfig
} from '../types';
import {
  CONTENT_WIDTH_DXA,
  FONT_FAMILY,
  MARGIN_BOTTOM_DXA,
  MARGIN_LEFT_DXA,
  MARGIN_RIGHT_DXA,
  MARGIN_TOP_DXA,
  PAGE_HEIGHT_DXA,
  PAGE_WIDTH_DXA,
  createKopSuratTable,
  downloadDocxFile,
  imageSourceToPngBytes
} from './docxExport';
import { downloadWordBlob } from './wordExport';

type DocxAlignment = (typeof AlignmentType)[keyof typeof AlignmentType];

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

function mapAlign(align?: 'left' | 'center' | 'right'): DocxAlignment {
  if (align === 'center') return AlignmentType.CENTER;
  if (align === 'right') return AlignmentType.RIGHT;
  return AlignmentType.LEFT;
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Hitung lebar kolom DXA tetap dengan jumlah persis = CONTENT_WIDTH_DXA (7937)
 */
function distributeDxaWidths(columns: { widthPercent?: number }[]): number[] {
  const count = columns.length || 1;
  const rawWeights = columns.map(c => c.widthPercent || Math.floor(100 / count));
  const totalWeight = rawWeights.reduce((a, b) => a + b, 0) || 100;
  const widths = rawWeights.map(w => Math.floor((w / totalWeight) * CONTENT_WIDTH_DXA));
  const sum = widths.reduce((a, b) => a + b, 0);
  if (widths.length > 0) {
    widths[widths.length - 1] += CONTENT_WIDTH_DXA - sum;
  }
  return widths;
}

async function renderDocxSignatoryColumnCells(
  signatory: BeritaAcaraSignatory,
  colWidth: number,
  includeSignatureImg: boolean
): Promise<TableCell> {
  const imgData =
    includeSignatureImg && signatory.signatureImage
      ? await imageSourceToPngBytes(signatory.signatureImage, undefined, { maxW: 150, maxH: 65 })
      : null;

  const isPlaceholder = !signatory.nama || signatory.nama.includes('...');
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 250, after: 20 },
      children: [
        new TextRun({
          text: signatory.dateLine || ' ',
          font: FONT_FAMILY,
          size: 22 // 11pt
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 250, after: 20 },
      children: [
        new TextRun({
          text: signatory.roleLabel,
          font: FONT_FAMILY,
          size: 24 // 12pt
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 250, after: 40 },
      children: [
        new TextRun({
          text: signatory.jabatan,
          font: FONT_FAMILY,
          size: 24,
          bold: true
        })
      ]
    })
  ];

  if (imgData) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 },
        children: [
          new ImageRun({
            data: imgData.data,
            transformation: { width: Math.min(imgData.width * 1.4, 120), height: Math.min(imgData.height * 1.4, 52) },
            type: 'png'
          })
        ]
      })
    );
  } else {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 420, after: 60 },
        children: [new TextRun({ text: ' ', font: FONT_FAMILY, size: 24 })]
      })
    );
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 250, after: 20 },
      children: [
        new TextRun({
          text: signatory.nama,
          font: FONT_FAMILY,
          size: 24,
          bold: true,
          ...(isPlaceholder ? {} : { underline: {} })
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 240, after: 40 },
      children: [
        new TextRun({
          text: signatory.nip,
          font: FONT_FAMILY,
          size: 21 // 10.5pt
        })
      ]
    })
  );

  return new TableCell({
    width: { size: colWidth, type: WidthType.DXA },
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children
  });
}

/**
 * Generator Microsoft Word (.docx) 1:1 sesuai tata letak resmi A4:
 * Margin Top 3cm, Left 4cm, Bottom 3cm, Right 3cm | Times New Roman 16/14/12 pt | Line Spacing 1.15, After 6pt
 */
export async function createBeritaAcaraDocx(
  content: GeneratedBeritaAcaraContent,
  schoolConfig: SchoolConfig,
  options: { includeSignatureImages?: boolean } = {}
): Promise<Document> {
  const { includeSignatureImages = false } = options;
  const children: (Paragraph | Table)[] = [];

  // 1. Kop Surat 3 Kolom (Logo Kiri & Kanan)
  children.push(await createKopSuratTable(schoolConfig));

  // 2. Judul Berita Acara (16 pt Bold) + Sub-judul (14 pt Bold) + Nomor (12 pt)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 60, line: 276 },
      children: [
        new TextRun({
          text: content.documentHeading,
          font: FONT_FAMILY,
          size: 32, // 16 pt bold
          bold: true,
          underline: {}
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60, line: 276 },
      children: [
        new TextRun({
          text: content.documentSubHeading,
          font: FONT_FAMILY,
          size: 28, // 14 pt bold
          bold: true
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 160, line: 276 },
      children: [
        new TextRun({
          text: `Nomor: ${content.nomorSurat}`,
          font: FONT_FAMILY,
          size: 24 // 12 pt
        })
      ]
    })
  );

  // 3. Kalimat Pembuka Baku
  children.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: 276, after: 120 }, // 1.15 spacing, 6pt after
      indent: { firstLine: 420 },
      children: [
        new TextRun({
          text: content.openingParagraph,
          font: FONT_FAMILY,
          size: 24 // 12 pt
        })
      ]
    })
  );

  // 4. Dasar / Konsiderans (jika ada)
  content.basisParagraphs.forEach(p => {
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 276, after: 120 },
        indent: { firstLine: 420 },
        children: [
          new TextRun({
            text: p,
            font: FONT_FAMILY,
            size: 24
          })
        ]
      })
    );
  });

  // 5. Kotak Identitas Para Pihak (khusus BAST / Sertijab)
  if (content.partyBoxes && content.partyBoxes.length > 0) {
    const labelW = 2200;
    const sepW = 240;
    const valW = CONTENT_WIDTH_DXA - labelW - sepW; // 5497

    content.partyBoxes.forEach((party, pIdx) => {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40, line: 276 },
          children: [
            new TextRun({
              text: `${pIdx + 1}. ${party.partyTitle}`,
              font: FONT_FAMILY,
              size: 24,
              bold: true
            })
          ]
        })
      );

      const partyRows: [string, string][] = [
        ['Nama Lengkap', party.nama],
        ['NIP / PPPK', party.nip],
        ['Jabatan', party.jabatan]
      ];
      if (party.unit) partyRows.push(['Unit Kerja', party.unit]);

      children.push(
        new Table({
          width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
          borders: tableBordersNone,
          rows: partyRows.map(([k, val]) =>
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: labelW, type: WidthType.DXA },
                  margins: { top: 20, bottom: 20, left: 260, right: 40 },
                  children: [
                    new Paragraph({
                      spacing: { line: 260, after: 20 },
                      children: [new TextRun({ text: k, font: FONT_FAMILY, size: 24 })]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: sepW, type: WidthType.DXA },
                  margins: { top: 20, bottom: 20, left: 20, right: 20 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { line: 260, after: 20 },
                      children: [new TextRun({ text: ':', font: FONT_FAMILY, size: 24 })]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: valW, type: WidthType.DXA },
                  margins: { top: 20, bottom: 20, left: 40, right: 40 },
                  children: [
                    new Paragraph({
                      spacing: { line: 260, after: 20 },
                      children: [
                        new TextRun({
                          text: val,
                          font: FONT_FAMILY,
                          size: 24,
                          bold: k === 'Nama Lengkap'
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          )
        })
      );
    });
  }

  // 6. Paragraf Isi Utama
  content.bodyParagraphs.forEach(p => {
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 60, line: 276, after: 120 },
        indent: { firstLine: 420 },
        children: [
          new TextRun({
            text: p,
            font: FONT_FAMILY,
            size: 24
          })
        ]
      })
    );
  });

  // 7. Tabel Rekapitulasi / Daftar Resmi (Fixed Width DXA)
  content.tables.forEach(tbl => {
    children.push(
      new Paragraph({
        spacing: { before: 100, after: 60, line: 276 },
        children: [
          new TextRun({
            text: tbl.title,
            font: FONT_FAMILY,
            size: 24, // 12 pt bold
            bold: true
          })
        ]
      })
    );

    const colWidths = distributeDxaWidths(tbl.columns);
    const tableRows: TableRow[] = [];

    // Header Row
    tableRows.push(
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: tbl.columns.map((col, idx) =>
          new TableCell({
            width: { size: colWidths[idx], type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: mapAlign(col.align || 'center'),
                spacing: { line: 240, after: 20 },
                children: [
                  new TextRun({
                    text: col.header,
                    font: FONT_FAMILY,
                    size: 21, // 10.5 pt bold agar fit rapi
                    bold: true
                  })
                ]
              })
            ]
          })
        )
      })
    );

    // Data Rows
    tbl.rows.forEach(rowVals => {
      tableRows.push(
        new TableRow({
          cantSplit: true,
          children: tbl.columns.map((col, idx) =>
            new TableCell({
              width: { size: colWidths[idx], type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 65, bottom: 65, left: 80, right: 80 },
              children: [
                new Paragraph({
                  alignment: mapAlign(col.align || 'left'),
                  spacing: { line: 240, after: 20 },
                  children: [
                    new TextRun({
                      text: rowVals[idx] ?? '-',
                      font: FONT_FAMILY,
                      size: 21 // 10.5 pt tabel padat
                    })
                  ]
                })
              ]
            })
          )
        })
      );
    });

    // Footer Row
    if (tbl.footerRow && tbl.footerRow.length === tbl.columns.length) {
      tableRows.push(
        new TableRow({
          cantSplit: true,
          children: tbl.columns.map((col, idx) =>
            new TableCell({
              width: { size: colWidths[idx], type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
              margins: { top: 75, bottom: 75, left: 80, right: 80 },
              children: [
                new Paragraph({
                  alignment: mapAlign(col.align || 'left'),
                  spacing: { line: 240, after: 20 },
                  children: [
                    new TextRun({
                      text: tbl.footerRow![idx] ?? '',
                      font: FONT_FAMILY,
                      size: 21,
                      bold: true
                    })
                  ]
                })
              ]
            })
          )
        })
      );
    }

    children.push(
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        borders: tableBordersAll,
        rows: tableRows
      })
    );
  });

  // 8. Detail Pairs / Catatan Tambahan
  if (content.detailPairs && content.detailPairs.length > 0) {
    if (content.detailSectionTitle) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 60, line: 276 },
          children: [
            new TextRun({
              text: content.detailSectionTitle,
              font: FONT_FAMILY,
              size: 24,
              bold: true
            })
          ]
        })
      );
    }

    const lblW = 2400;
    const sepW = 240;
    const valW = CONTENT_WIDTH_DXA - lblW - sepW;
    children.push(
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        borders: tableBordersNone,
        rows: content.detailPairs.map(pair =>
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: lblW, type: WidthType.DXA },
                margins: { top: 25, bottom: 25, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    spacing: { line: 260, after: 20 },
                    children: [new TextRun({ text: pair.label, font: FONT_FAMILY, size: 22, bold: true })]
                  })
                ]
              }),
              new TableCell({
                width: { size: sepW, type: WidthType.DXA },
                margins: { top: 25, bottom: 25, left: 20, right: 20 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { line: 260, after: 20 },
                    children: [new TextRun({ text: ':', font: FONT_FAMILY, size: 22 })]
                  })
                ]
              }),
              new TableCell({
                width: { size: valW, type: WidthType.DXA },
                margins: { top: 25, bottom: 25, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { line: 260, after: 20 },
                    children: [new TextRun({ text: pair.value, font: FONT_FAMILY, size: 22 })]
                  })
                ]
              })
            ]
          })
        )
      })
    );
  }

  // 9. Kalimat Penutup Baku
  children.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 140, after: 180, line: 276 },
      indent: { firstLine: 420 },
      children: [
        new TextRun({
          text: content.closingParagraph,
          font: FONT_FAMILY,
          size: 24
        })
      ]
    })
  );

  // 10. Lembar Penandatangan Resmi
  const halfW = Math.floor(CONTENT_WIDTH_DXA / 2);
  const rightHalfW = CONTENT_WIDTH_DXA - halfW;

  const [leftCell, rightCell] = await Promise.all([
    renderDocxSignatoryColumnCells(content.leftSignatory, halfW, includeSignatureImages),
    renderDocxSignatoryColumnCells(content.rightSignatory, rightHalfW, includeSignatureImages)
  ]);

  children.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      borders: tableBordersNone,
      rows: [
        new TableRow({
          cantSplit: true,
          children: [leftCell, rightCell]
        })
      ]
    })
  );

  // Center Bottom Signatory (e.g. Mengetahui Kepala Sekolah on BAST / Sertijab / Ujian)
  if (content.signatoryLayout === 'two_col_plus_kepsek' && content.centerBottomSignatory) {
    const centerCell = await renderDocxSignatoryColumnCells(
      content.centerBottomSignatory,
      CONTENT_WIDTH_DXA,
      includeSignatureImages
    );
    children.push(
      new Paragraph({ spacing: { before: 120, after: 0 }, children: [] }),
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        borders: tableBordersNone,
        rows: [
          new TableRow({
            cantSplit: true,
            children: [centerCell]
          })
        ]
      })
    );
  }

  // Saksi-Saksi (jika diisi)
  if (content.witnesses && content.witnesses.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 140, after: 60, line: 276 },
        children: [
          new TextRun({
            text: 'Saksi-Saksi:',
            font: FONT_FAMILY,
            size: 22,
            bold: true
          })
        ]
      })
    );
    const wCol1 = 3800;
    const wCol2 = 2200;
    const wCol3 = CONTENT_WIDTH_DXA - wCol1 - wCol2;
    children.push(
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        borders: tableBordersAll,
        rows: content.witnesses.map((w, idx) =>
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: wCol1, type: WidthType.DXA },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    spacing: { line: 240, after: 20 },
                    children: [new TextRun({ text: `${idx + 1}. ${w.nama}`, font: FONT_FAMILY, size: 22 })]
                  })
                ]
              }),
              new TableCell({
                width: { size: wCol2, type: WidthType.DXA },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    spacing: { line: 240, after: 20 },
                    children: [new TextRun({ text: w.jabatan, font: FONT_FAMILY, size: 22 })]
                  })
                ]
              }),
              new TableCell({
                width: { size: wCol3, type: WidthType.DXA },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { line: 240, after: 20 },
                    children: [new TextRun({ text: '( .......................... )', font: FONT_FAMILY, size: 20 })]
                  })
                ]
              })
            ]
          })
        )
      })
    );
  }

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
        children
      }
    ]
  });
}

function renderHtmlKopSurat(config: SchoolConfig): string {
  const leftLogo = config.logoKopKiri || config.logoKabupatenUrl;
  const rightLogo = config.logoKopKanan || config.logoSekolahUrl;
  const pemda = (config.pemerintahDaerah || '').trim().toUpperCase();
  const dinas = (config.dinasPendidikan || '').trim().toUpperCase();
  const sekolah = (config.namaSekolah || 'SATUAN PENDIDIKAN').trim().toUpperCase();
  const alamatLine = [config.alamat, config.desaKecamatan, config.kabupatenKota, config.provinsi]
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .join(', ') + (config.kodePos?.trim() ? ` Kode Pos ${config.kodePos.trim()}` : '');
  const kontak = [
    config.telepon?.trim() ? `Telp: ${config.telepon.trim()}` : '',
    config.email?.trim() ? `Pos-el: ${config.email.trim()}` : '',
    config.website?.trim() ? `Laman: ${config.website.trim()}` : ''
  ].filter(Boolean).join(' | ');
  const codes = [
    config.npsn?.trim() ? `NPSN: ${config.npsn.trim()}` : '',
    config.nss?.trim() ? `NSS: ${config.nss.trim()}` : ''
  ].filter(Boolean).join(' · ');

  return `
    <table style="width:100%; border-collapse:collapse; border-bottom: 3px double #000; margin-bottom: 14px;">
      <tr>
        <td style="width:88px; text-align:center; vertical-align:middle; padding-bottom:8px;">
          ${leftLogo ? `<img src="${leftLogo}" style="max-height:76px; max-width:76px; object-fit:contain;" alt="Logo Kiri" />` : `<div style="width:66px;height:76px;border:1.5px solid #1e3a8a;display:flex;align-items:center;justify-content:center;font-size:8pt;font-weight:bold;color:#1e3a8a;margin:auto;">PEMDA</div>`}
        </td>
        <td style="text-align:center; vertical-align:middle; padding:0 8px 8px 8px;">
          ${pemda ? `<div style="font-size:11pt; font-weight:bold; line-height:1.2;">${escapeHtml(pemda)}</div>` : ''}
          ${dinas ? `<div style="font-size:12pt; font-weight:bold; line-height:1.2;">${escapeHtml(dinas)}</div>` : ''}
          <div style="font-size:15pt; font-weight:800; line-height:1.2; margin:2px 0;">${escapeHtml(sekolah)}</div>
          ${alamatLine ? `<div style="font-size:9pt; font-style:italic; line-height:1.25;">${escapeHtml(alamatLine)}</div>` : ''}
          ${kontak ? `<div style="font-size:8.5pt; line-height:1.25;">${escapeHtml(kontak)}</div>` : ''}
          ${codes ? `<div style="font-size:8.5pt; font-weight:bold; line-height:1.25;">${escapeHtml(codes)}</div>` : ''}
        </td>
        <td style="width:88px; text-align:center; vertical-align:middle; padding-bottom:8px;">
          ${rightLogo ? `<img src="${rightLogo}" style="max-height:76px; max-width:76px; object-fit:contain;" alt="Logo Kanan" />` : `<div style="width:66px;height:76px;border:1.5px solid #0284c7;display:flex;align-items:center;justify-content:center;font-size:8pt;font-weight:bold;color:#0284c7;margin:auto;">TUT WURI</div>`}
        </td>
      </tr>
    </table>
  `;
}

function renderHtmlInnerContent(
  content: GeneratedBeritaAcaraContent,
  schoolConfig: SchoolConfig,
  includeSignatureImages: boolean
): string {
  const renderSignatoryBox = (sig: BeritaAcaraSignatory) => {
    const isPlaceholder = !sig.nama || sig.nama.includes('...');
    return `
      <div style="text-align:center;">
        <div style="min-height:18px; font-size:11pt;">${sig.dateLine ? escapeHtml(sig.dateLine) : '&nbsp;'}</div>
        <div style="font-size:11.5pt;">${escapeHtml(sig.roleLabel)}</div>
        <div style="font-size:11.5pt; font-weight:bold; margin-bottom:4px;">${escapeHtml(sig.jabatan)}</div>
        <div style="height:64px; display:flex; align-items:center; justify-content:center;">
          ${includeSignatureImages && sig.signatureImage ? `<img src="${sig.signatureImage}" style="max-height:58px; object-fit:contain;" alt="TTD" />` : ''}
        </div>
        <div style="font-size:11.5pt; font-weight:bold; ${isPlaceholder ? '' : 'text-decoration:underline;'}">${escapeHtml(sig.nama)}</div>
        <div style="font-size:10.5pt; margin-top:2px;">${escapeHtml(sig.nip)}</div>
      </div>
    `;
  };

  return `
    ${renderHtmlKopSurat(schoolConfig)}

    <div style="text-align:center; margin: 12px 0 16px 0;">
      <div style="font-size:16pt; font-weight:bold; text-decoration:underline; letter-spacing:0.5px;">${escapeHtml(content.documentHeading)}</div>
      <div style="font-size:13pt; font-weight:bold; margin-top:4px;">${escapeHtml(content.documentSubHeading)}</div>
      <div style="font-size:11.5pt; margin-top:3px;">Nomor: ${escapeHtml(content.nomorSurat)}</div>
    </div>

    <p style="text-align:justify; text-indent: 32px; line-height:1.45; margin-bottom:10px; font-size:11.5pt;">
      ${escapeHtml(content.openingParagraph)}
    </p>

    ${content.basisParagraphs
      .map(p => `<p style="text-align:justify; text-indent:32px; line-height:1.45; margin-bottom:10px; font-size:11.5pt;">${escapeHtml(p)}</p>`)
      .join('')}

    ${
      content.partyBoxes && content.partyBoxes.length > 0
        ? content.partyBoxes
            .map(
              (party, idx) => `
          <div style="margin: 8px 0 10px 0;">
            <div style="font-weight:bold; font-size:11.5pt; margin-bottom:4px;">${idx + 1}. ${escapeHtml(party.partyTitle)}</div>
            <table style="width:100%; border-collapse:collapse; margin-left:18px; font-size:11pt;">
              <tr><td style="width:150px; padding:2px 0;">Nama Lengkap</td><td style="width:14px;">:</td><td style="font-weight:bold;">${escapeHtml(party.nama)}</td></tr>
              <tr><td style="padding:2px 0;">NIP / PPPK</td><td>:</td><td>${escapeHtml(party.nip)}</td></tr>
              <tr><td style="padding:2px 0;">Jabatan</td><td>:</td><td>${escapeHtml(party.jabatan)}</td></tr>
              ${party.unit ? `<tr><td style="padding:2px 0;">Unit Kerja</td><td>:</td><td>${escapeHtml(party.unit)}</td></tr>` : ''}
            </table>
          </div>`
            )
            .join('')
        : ''
    }

    ${content.bodyParagraphs
      .map(p => `<p style="text-align:justify; text-indent:32px; line-height:1.45; margin:8px 0 10px 0; font-size:11.5pt;">${escapeHtml(p)}</p>`)
      .join('')}

    ${content.tables
      .map(
        tbl => `
      <div style="margin: 12px 0;">
        <div style="font-weight:bold; font-size:11pt; margin-bottom:6px;">${escapeHtml(tbl.title)}</div>
        <table style="width:100%; border-collapse:collapse; font-size:10.5pt;">
          <thead>
            <tr style="background:#f1f5f9;">
              ${tbl.columns
                .map(
                  c =>
                    `<th style="border:1px solid #334155; padding:6px 8px; text-align:${c.align || 'center'}; ${c.widthPercent ? `width:${c.widthPercent}%;` : ''}">${escapeHtml(c.header)}</th>`
                )
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${tbl.rows
              .map(
                r => `
              <tr>
                ${tbl.columns
                  .map((c, idx) => `<td style="border:1px solid #334155; padding:5px 8px; text-align:${c.align || 'left'};">${escapeHtml(r[idx] ?? '-')}</td>`)
                  .join('')}
              </tr>`
              )
              .join('')}
          </tbody>
          ${
            tbl.footerRow
              ? `<tfoot>
                  <tr style="background:#e2e8f0; font-weight:bold;">
                    ${tbl.columns
                      .map((c, idx) => `<td style="border:1px solid #334155; padding:6px 8px; text-align:${c.align || 'left'};">${escapeHtml(tbl.footerRow![idx] ?? '')}</td>`)
                      .join('')}
                  </tr>
                </tfoot>`
              : ''
          }
        </table>
      </div>`
      )
      .join('')}

    ${
      content.detailPairs && content.detailPairs.length > 0
        ? `
      <div style="margin: 10px 0;">
        ${content.detailSectionTitle ? `<div style="font-weight:bold; font-size:11.5pt; margin-bottom:4px;">${escapeHtml(content.detailSectionTitle)}</div>` : ''}
        <table style="width:100%; border-collapse:collapse; font-size:11pt;">
          ${content.detailPairs
            .map(
              p =>
                `<tr><td style="width:180px; vertical-align:top; padding:3px 6px 3px 0; font-weight:bold;">${escapeHtml(p.label)}</td><td style="width:14px; vertical-align:top; padding:3px 0;">:</td><td style="vertical-align:top; padding:3px 0; text-align:justify;">${escapeHtml(p.value)}</td></tr>`
            )
            .join('')}
        </table>
      </div>`
        : ''
    }

    <p style="text-align:justify; text-indent:32px; line-height:1.45; margin: 12px 0 18px 0; font-size:11.5pt;">
      ${escapeHtml(content.closingParagraph)}
    </p>

    <table style="width:100%; border-collapse:collapse; margin-top: 12px; page-break-inside: avoid;">
      <tr>
        <td style="width:50%; vertical-align:top; padding:0 8px;">${renderSignatoryBox(content.leftSignatory)}</td>
        <td style="width:50%; vertical-align:top; padding:0 8px;">${renderSignatoryBox(content.rightSignatory)}</td>
      </tr>
    </table>

    ${
      content.signatoryLayout === 'two_col_plus_kepsek' && content.centerBottomSignatory
        ? `<div style="margin-top: 16px; page-break-inside: avoid;">${renderSignatoryBox(content.centerBottomSignatory)}</div>`
        : ''
    }

    ${
      content.witnesses && content.witnesses.length > 0
        ? `
      <div style="margin-top: 16px; page-break-inside: avoid;">
        <div style="font-weight:bold; font-size:11pt; margin-bottom:6px;">Saksi-Saksi:</div>
        <table style="width:100%; border-collapse:collapse; font-size:10.5pt;">
          ${content.witnesses
            .map(
              (w, idx) => `
            <tr>
              <td style="border:1px solid #334155; padding:6px 8px; width:45%;">${idx + 1}. ${escapeHtml(w.nama)}</td>
              <td style="border:1px solid #334155; padding:6px 8px; width:25%;">${escapeHtml(w.jabatan)}</td>
              <td style="border:1px solid #334155; padding:6px 8px; text-align:center;">( .......................... )</td>
            </tr>`
            )
            .join('')}
        </table>
      </div>`
        : ''
    }
  `;
}

export function generateBeritaAcaraWord(
  content: GeneratedBeritaAcaraContent,
  schoolConfig: SchoolConfig,
  includeSignatureImages = false
): string {
  const inner = renderHtmlInnerContent(content, schoolConfig, includeSignatureImages);
  return `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${escapeHtml(content.templateTitle)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 3cm 3cm 3cm 4cm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      color: #000000;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  ${inner}
</body>
</html>`;
}

export function generateBeritaAcaraHtml(
  content: GeneratedBeritaAcaraContent,
  schoolConfig: SchoolConfig,
  includeSignatureImages = false
): string {
  const inner = renderHtmlInnerContent(content, schoolConfig, includeSignatureImages);
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(content.templateTitle)} - ${escapeHtml(schoolConfig.namaSekolah)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 2cm 2cm 2cm 2.5cm;
    }
    body {
      margin: 0;
      padding: 24px;
      background: #f1f5f9;
      font-family: 'Times New Roman', Times, serif;
      color: #000000;
    }
    .sheet {
      max-width: 794px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px 48px;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.12);
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .sheet { max-width: 100%; box-shadow: none; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width:794px; margin:0 auto 12px auto; text-align:right;">
    <button onclick="window.print()" style="padding:8px 16px; background:#0f172a; color:#fff; border:none; border-radius:6px; cursor:pointer; font-family:sans-serif; font-weight:bold;">
      Cetak Dokumen
    </button>
  </div>
  <div class="sheet">
    ${inner}
  </div>
</body>
</html>`;
}

export async function downloadBeritaAcaraDocx(
  content: GeneratedBeritaAcaraContent,
  schoolConfig: SchoolConfig,
  filename: string,
  includeSignatureImages = false
): Promise<void> {
  const doc = await createBeritaAcaraDocx(content, schoolConfig, { includeSignatureImages });
  await downloadDocxFile(doc, filename);
}

export function downloadBeritaAcaraWord(
  content: GeneratedBeritaAcaraContent,
  schoolConfig: SchoolConfig,
  filename: string,
  includeSignatureImages = false
): void {
  const html = generateBeritaAcaraWord(content, schoolConfig, includeSignatureImages);
  downloadWordBlob(html, filename);
}

export function downloadBeritaAcaraHtml(
  content: GeneratedBeritaAcaraContent,
  schoolConfig: SchoolConfig,
  filename: string,
  includeSignatureImages = false
): void {
  const html = generateBeritaAcaraHtml(content, schoolConfig, includeSignatureImages);
  const cleanName = filename.endsWith('.html') ? filename : `${filename}.html`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
