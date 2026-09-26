import { SchoolConfig, MonthlyReport, AnnualReport, RoleType, TaskLog, InventoryItem } from '../types';

interface DocumentExportParams {
  reportType: 'monthly' | 'annual';
  reportData: MonthlyReport | AnnualReport;
  schoolConfig: SchoolConfig;
  tasks: TaskLog[];
  inventories: InventoryItem[];
  manualDate?: string;
  nomorSurat?: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Generates an official, standalone, beautifully styled HTML document adhering to
 * standard Indonesian school & government administrative regulations (A4 Portrait).
 * Includes independent sheets, official 3-column Kop Surat, anti-cutoff Lembar Pengesahan,
 * full self-contained styling, and print/PDF ready rules.
 */
export function generateOfficialDocumentHtml(params: DocumentExportParams): string {
  const {
    reportType,
    reportData,
    schoolConfig,
    tasks,
    inventories,
    manualDate,
    nomorSurat
  } = params;

  const isMonthly = reportType === 'monthly';
  const monthlyData = isMonthly ? (reportData as MonthlyReport) : null;
  const annualData = !isMonthly ? (reportData as AnnualReport) : null;

  const role: RoleType = reportData.role || 'TU';
  const roleTitle = role === 'TU' ? 'Tata Usaha (TU)' : role === 'PENJAGA' ? 'Penjaga Sekolah' : 'Layanan Kebersihan (Service)';
  const operator = schoolConfig.operatorProfiles[role] || {
    nama: 'Petugas Layanan Operasional',
    nip: '-',
    pangkatGolongan: '-',
    jabatan: 'Operator'
  };

  const periodString = isMonthly 
    ? `Bulan ${MONTH_NAMES[(monthlyData?.month || 9) - 1]} Tahun ${monthlyData?.year || 2026}`
    : `Tahun Anggaran ${annualData?.year || 2026}`;

  const docDate = manualDate || `${schoolConfig.kabupatenKota}, 30 September 2026`;
  const noSurat = nomorSurat || `800/${isMonthly ? `LAP-BLN/${monthlyData?.month || 9}` : 'LAP-THN'}/${schoolConfig.npsn || '20202819'}/${new Date().getFullYear()}`;

  // Relevant tasks for this report
  const relevantTasks = tasks.filter(t => {
    if (t.role !== role) return false;
    const d = new Date(t.date);
    if (isMonthly && monthlyData) {
      return d.getMonth() + 1 === monthlyData.month && d.getFullYear() === monthlyData.year;
    }
    if (!isMonthly && annualData) {
      return d.getFullYear() === annualData.year;
    }
    return true;
  });

  const roleInventories = inventories.filter(inv => inv.role === role);
  const tasksWithPhotos = relevantTasks.filter(t => !!t.photoUrl);

  const tasksPerPage = 12;
  const hasTaskPage2 = relevantTasks.length > tasksPerPage;
  const totalPages = hasTaskPage2 ? 4 : 3;

  const tasksPage1 = relevantTasks.slice(0, tasksPerPage);
  const tasksPage2 = hasTaskPage2 ? relevantTasks.slice(tasksPerPage) : [];

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isMonthly ? 'Laporan Bulanan' : 'Laporan Tahunan'} - ${roleTitle} - ${schoolConfig.namaSekolah}</title>
  <style>
    /* ============================================================
       STANDAR NASKAH DINAS PENDIDIKAN - FORMAT CETAK RESMI A4
       ============================================================ */
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Times New Roman', Times, 'Liberation Serif', serif;
      font-size: 11pt;
      line-height: 1.38;
      color: #0f172a;
      background-color: #f1f5f9;
      padding: 24px 12px;
      -webkit-font-smoothing: antialiased;
    }

    /* Screen Action Toolbar */
    .screen-toolbar {
      max-width: 820px;
      margin: 0 auto 24px auto;
      background: #0f172a;
      color: #ffffff;
      padding: 14px 20px;
      border-radius: 12px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .toolbar-info h3 {
      font-size: 13px;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: 0.2px;
    }
    .toolbar-info p {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .toolbar-actions {
      display: flex;
      gap: 10px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #2563eb;
      color: #fff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-secondary {
      background: #334155;
      color: #f1f5f9;
    }
    .btn-secondary:hover {
      background: #475569;
    }

    /* Individual A4 Page Sheets */
    .page-sheet {
      width: 100%;
      max-width: 820px;
      min-height: 1050px;
      margin: 0 auto 32px auto;
      background: #ffffff;
      padding: 40px 48px 32px 48px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border-radius: 4px;
      display: flex;
      flex-col;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    /* KOP SURAT 3 KOLOM RESMI KEDINASAN */
    .kop-surat {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3.5px double #000000;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .kop-logo {
      width: 72px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kop-logo svg, .kop-logo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .kop-center {
      flex: 1;
      text-align: center;
      padding: 0 14px;
    }
    .kop-pemda {
      font-size: 10.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000;
    }
    .kop-dinas {
      font-size: 11.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000;
    }
    .kop-sekolah {
      font-size: 14pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #000;
      margin: 2px 0;
    }
    .kop-alamat {
      font-size: 8.5pt;
      font-family: Arial, sans-serif;
      color: #222;
      line-height: 1.3;
    }

    /* Subheader for Continuation Sheets */
    .sheet-subheader {
      border-bottom: 2px solid #000000;
      padding-bottom: 6px;
      margin-bottom: 14px;
      font-size: 9.5pt;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      color: #1e293b;
    }

    /* Document Title & Number */
    .doc-header {
      text-align: center;
      margin-bottom: 14px;
    }
    .doc-title {
      font-size: 12pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000;
    }
    .doc-subtitle {
      font-size: 10.5pt;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 2px;
      color: #111;
    }
    .doc-period {
      font-size: 9.5pt;
      font-weight: 600;
      color: #333;
      margin-top: 2px;
    }
    .doc-number {
      font-size: 9.5pt;
      font-family: 'Courier New', Courier, monospace;
      color: #444;
      margin-top: 3px;
    }

    /* Identity Box */
    .identity-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 14px;
      font-size: 9.5pt;
    }
    .identity-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
    }
    .identity-table td {
      border: none !important;
      padding: 2.5px 0;
      vertical-align: top;
    }
    .identity-table .label {
      width: 190px;
      font-weight: 600;
      color: #334155;
    }
    .identity-table .separator {
      width: 15px;
      text-align: center;
    }
    .identity-table .value {
      font-weight: bold;
      color: #0f172a;
    }

    /* Section Headings */
    .section-title {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #000000;
      padding-bottom: 3px;
      margin-bottom: 8px;
      margin-top: 10px;
      color: #000;
      break-inside: avoid;
    }

    .justified-text {
      text-align: justify;
      text-indent: 28px;
      margin-bottom: 8px;
      font-size: 10pt;
      line-height: 1.45;
    }

    ol, ul {
      padding-left: 24px;
      margin-bottom: 8px;
      font-size: 9.5pt;
    }
    li {
      margin-bottom: 3px;
    }

    /* Official Grid Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000000;
      font-size: 9pt;
      margin: 8px 0;
      break-inside: auto;
    }
    .data-table th {
      background: #f1f5f9;
      border: 1px solid #000000;
      padding: 5px 6px;
      font-weight: bold;
      text-align: left;
      color: #000;
    }
    .data-table td {
      border: 1px solid #000000;
      padding: 4px 6px;
      vertical-align: top;
    }
    .data-table tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .col-no {
      width: 32px;
      text-align: center;
      font-family: monospace;
    }
    .col-date {
      width: 82px;
      font-family: monospace;
      white-space: nowrap;
    }
    .col-time {
      width: 82px;
      text-align: center;
      font-family: monospace;
      white-space: nowrap;
    }
    .col-vol {
      width: 90px;
      font-weight: 500;
    }
    .col-loc {
      width: 90px;
    }

    /* Photos Grid */
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 10px 0 14px 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .photo-card {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      overflow: hidden;
      background: #fff;
    }
    .photo-img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      display: block;
      background: #e2e8f0;
    }
    .photo-info {
      padding: 6px 8px;
      background: #f8fafc;
      font-size: 8pt;
      border-top: 1px solid #e2e8f0;
    }
    .photo-title {
      font-weight: bold;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .photo-meta {
      color: #64748b;
      font-size: 7.5pt;
    }

    /* LEMBAR PENGESAHAN RESMI (ANTI-TERPOTONG / UTUH 100%) */
    .approval-wrapper {
      margin-top: 24px;
      padding-top: 10px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .approval-table {
      width: 100%;
      border-collapse: collapse;
      border: none !important;
    }
    .approval-table td {
      width: 50%;
      border: none !important;
      vertical-align: top;
      padding: 0 12px;
      text-align: center;
    }
    .sign-title {
      font-size: 10pt;
      font-weight: 600;
      color: #111;
      margin-bottom: 2px;
    }
    .sign-date {
      font-size: 10pt;
      font-weight: normal;
      color: #111;
      margin-bottom: 2px;
    }
    .sign-box {
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      margin: 6px 0;
    }
    .stamp-overlay {
      position: absolute;
      left: 12%;
      top: -2px;
      width: 80px;
      height: 80px;
      opacity: 0.9;
      pointer-events: none;
    }
    .stamp-badge {
      width: 76px;
      height: 76px;
      border: 2px dashed #1e40af;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #1e40af;
      font-size: 7pt;
      font-weight: bold;
      text-align: center;
      line-height: 1.1;
      background: rgba(239, 246, 255, 0.7);
    }
    .sign-image {
      max-height: 70px;
      max-width: 150px;
      object-fit: contain;
      z-index: 2;
    }
    .signature-font {
      font-family: 'Great Vibes', cursive, 'Brush Script MT', cursive, serif;
      font-size: 26pt;
      color: #1e3a8a;
      z-index: 2;
    }
    .sign-name {
      font-size: 10.5pt;
      font-weight: bold;
      text-transform: uppercase;
      text-decoration: underline;
      color: #000;
      margin-bottom: 1px;
    }
    .sign-nip {
      font-size: 9pt;
      color: #222;
    }
    .sign-rank {
      font-size: 8.5pt;
      color: #444;
    }

    .footnote-disclaimer {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px dashed #cbd5e1;
      text-align: center;
      font-size: 8pt;
      color: #64748b;
      font-style: italic;
    }

    /* Page Sheet Footers */
    .sheet-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 16px;
      text-align: center;
      font-size: 8pt;
      color: #94a3b8;
      font-family: monospace;
    }

    /* PRINT RULES */
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .screen-toolbar, .no-print {
        display: none !important;
      }
      .page-sheet {
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .page-sheet:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      .identity-box {
        background: transparent !important;
        border: 1px solid #000 !important;
      }
      .data-table th {
        background: #e2e8f0 !important;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Screen Action Toolbar (Hidden in Print & PDF) -->
  <div class="screen-toolbar no-print">
    <div class="toolbar-info">
      <h3>Dokumen Kedinasan Standar A4 - ${schoolConfig.namaSekolah}</h3>
      <p>Format Naskah Dinas Pendidikan Resmi · Dilengkapi Garis Ganda Kop, Lembar Pengesahan NIP & Stempel</p>
    </div>
    <div class="toolbar-actions">
      <button onclick="window.print()" class="btn btn-primary">
        🖨️ Cetak / Simpan PDF Resmi
      </button>
      <button onclick="window.close()" class="btn btn-secondary">
        ✕ Tutup
      </button>
    </div>
  </div>

  <!-- ========================================================
       LEMBAR 1: DOKUMEN INDUK LAPORAN KINERJA
       ======================================================== -->
  <div class="page-sheet">
    <div>
      <!-- KOP SURAT 3 KOLOM RESMI -->
      <div class="kop-surat">
        <div class="kop-logo">
          <svg viewBox="0 0 100 120" width="68" height="82" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5 L90 25 L90 75 L50 115 L10 75 L10 25 Z" fill="#1e3a8a" stroke="#fbbf24" stroke-width="4"/>
            <circle cx="50" cy="50" r="24" fill="#fbbf24"/>
            <path d="M50 32 L54 44 L66 44 L56 52 L60 64 L50 56 L40 64 L44 52 L34 44 L46 44 Z" fill="#1e3a8a"/>
            <path d="M25 82 Q50 95 75 82" stroke="#ffffff" stroke-width="3" fill="none"/>
          </svg>
        </div>

        <div class="kop-center">
          <div class="kop-pemda">${schoolConfig.pemerintahDaerah}</div>
          <div class="kop-dinas">${schoolConfig.dinasPendidikan}</div>
          <div class="kop-sekolah">${schoolConfig.namaSekolah}</div>
          <div class="kop-alamat">
            NPSN: ${schoolConfig.npsn || '20202819'} · NSS: ${schoolConfig.nss || '201020201004'}<br>
            ${schoolConfig.alamat}, ${schoolConfig.desaKecamatan}, ${schoolConfig.kabupatenKota}, ${schoolConfig.provinsi} ${schoolConfig.kodePos}<br>
            Telp: ${schoolConfig.telepon || '-'} | Email: ${schoolConfig.email || '-'}
          </div>
        </div>

        <div class="kop-logo">
          <svg viewBox="0 0 100 100" width="66" height="66" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" fill="#0284c7" stroke="#fbbf24" stroke-width="3"/>
            <path d="M50 16 L22 36 L22 42 L50 62 L78 42 L78 36 Z" fill="#fbbf24"/>
            <path d="M50 62 L32 76 L32 82 L50 72 L68 82 L68 76 Z" fill="#ffffff"/>
            <circle cx="50" cy="40" r="7" fill="#dc2626"/>
          </svg>
        </div>
      </div>

      <!-- DOKUMEN HEADING -->
      <div class="doc-header">
        <div class="doc-title">
          ${isMonthly ? 'LAPORAN BULANAN KINERJA OPERATOR LAYANAN OPERASIONAL' : 'LAPORAN TAHUNAN KINERJA OPERATOR LAYANAN OPERASIONAL'}
        </div>
        <div class="doc-subtitle">BIDANG: ${roleTitle.toUpperCase()}</div>
        <div class="doc-period">Periode: ${periodString}</div>
        <div class="doc-number">Nomor Surat: ${noSurat}</div>
      </div>

      <!-- IDENTITAS PETUGAS PELAKSANA -->
      <div class="identity-box">
        <table class="identity-table">
          <tr>
            <td class="label">Nama Petugas Pelaksana</td>
            <td class="separator">:</td>
            <td class="value">${operator.nama}</td>
          </tr>
          <tr>
            <td class="label">NIP / NIPPK</td>
            <td class="separator">:</td>
            <td class="value">${operator.nip}</td>
          </tr>
          <tr>
            <td class="label">Pangkat / Golongan Ruang</td>
            <td class="separator">:</td>
            <td class="value">${operator.pangkatGolongan || '-'}</td>
          </tr>
          <tr>
            <td class="label">Jabatan Kedinasan</td>
            <td class="separator">:</td>
            <td class="value">${operator.jabatan}</td>
          </tr>
          <tr>
            <td class="label">Unit Kerja / Satuan Pendidikan</td>
            <td class="separator">:</td>
            <td class="value">${schoolConfig.namaSekolah}</td>
          </tr>
        </table>
      </div>

      <!-- I. RINGKASAN KINERJA -->
      <div class="section-title">I. RINGKASAN KINERJA & CAPAIAN TARGET OPERASIONAL</div>
      <p class="justified-text">${reportData.summary}</p>

      <div style="font-weight: bold; margin-bottom: 5px; font-size: 9.5pt;">Indikator Capaian Kinerja:</div>
      <ol>
        ${(isMonthly ? monthlyData?.achievements : annualData?.annualMilestones)?.map(item => `<li>${item}</li>`).join('') || '<li>Tugas operasional terlaksana sesuai sasaran kerja.</li>'}
      </ol>

      ${isMonthly && monthlyData ? `
      <div style="display: flex; gap: 16px; margin-top: 8px;">
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 9.5pt; color: #b91c1c; margin-bottom: 3px;">Kendala / Hambatan:</div>
          <ul>
            ${monthlyData.obstacles?.map(obs => `<li>${obs}</li>`).join('') || '<li>Tidak ada kendala yang berarti.</li>'}
          </ul>
        </div>
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 9.5pt; color: #15803d; margin-bottom: 3px;">Solusi / Tindak Lanjut:</div>
          <ul>
            ${monthlyData.solutions?.map(sol => `<li>${sol}</li>`).join('') || '<li>Koordinasi berkala bersama satuan pendidikan berjalan optimal.</li>'}
          </ul>
        </div>
      </div>` : ''}

      ${!isMonthly && annualData ? `
      <div style="margin-top: 8px;">
        <div style="font-weight: bold; font-size: 9.5pt; margin-bottom: 3px;">Rekomendasi Rencana Strategis Tahun Berikutnya:</div>
        <ul>
          ${annualData.strategicRecommendations?.map(rec => `<li>${rec}</li>`).join('') || '<li>Pemeliharaan berkesinambungan.</li>'}
        </ul>
      </div>` : ''}
    </div>

    <!-- Lembar 1 Page Footer -->
    <div class="sheet-footer">
      ${schoolConfig.namaSekolah} · Laporan Kinerja Operator Layanan Operasional · Halaman 1 dari ${totalPages}
    </div>
  </div>

  <!-- ========================================================
       LEMBAR 2: LAMPIRAN I - REKAPITULASI CATATAN TUGAS HARIAN
       ======================================================== -->
  <div class="page-sheet">
    <div>
      <div class="sheet-subheader">
        <span>${schoolConfig.namaSekolah} — Lampiran I: Rekapitulasi Tugas ${roleTitle}</span>
        <span>No: ${noSurat}</span>
      </div>

      <div class="section-title">II. REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL YANG DILAKSANAKAN</div>
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-no">No</th>
            <th class="col-date">Tanggal</th>
            <th class="col-time">Waktu</th>
            <th>Uraian Tugas & Pekerjaan Kedinasan</th>
            <th class="col-vol">Volume</th>
            <th class="col-loc">Lokasi</th>
            <th style="width: 75px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tasksPage1.length === 0 ? `
            <tr>
              <td colspan="7" style="text-align: center; padding: 14px; color: #64748b;">
                Tidak ada catatan tugas operasional pada periode ini.
              </td>
            </tr>
          ` : tasksPage1.map((t, idx) => `
            <tr>
              <td class="col-no">${idx + 1}</td>
              <td class="col-date">${t.date}</td>
              <td class="col-time">${t.timeStart} - ${t.timeEnd}</td>
              <td>
                <div style="font-weight: bold; color: #0f172a;">${t.title}</div>
                <div style="color: #475569; font-size: 8.5pt; margin-top: 2px;">${t.description}</div>
              </td>
              <td class="col-vol">${t.volumeUnit}</td>
              <td class="col-loc">${t.location}</td>
              <td style="text-align: center; font-weight: bold; font-size: 8pt; color: ${t.status === 'selesai' ? '#15803d' : '#b45309'};">
                ${t.status === 'selesai' ? 'Selesai 100%' : 'Proses'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="sheet-footer">
      ${schoolConfig.namaSekolah} · Laporan Kinerja Operator Layanan Operasional · Halaman 2 dari ${totalPages}
    </div>
  </div>

  ${hasTaskPage2 ? `
  <!-- ========================================================
       LEMBAR 2B: LANJUTAN REKAPITULASI CATATAN TUGAS HARIAN
       ======================================================== -->
  <div class="page-sheet">
    <div>
      <div class="sheet-subheader">
        <span>${schoolConfig.namaSekolah} — Lanjutan Rekapitulasi Tugas ${roleTitle}</span>
        <span>No: ${noSurat}</span>
      </div>

      <div class="section-title">II. REKAPITULASI RINCIAN TUGAS HARIAN (LANJUTAN)</div>
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-no">No</th>
            <th class="col-date">Tanggal</th>
            <th class="col-time">Waktu</th>
            <th>Uraian Tugas & Pekerjaan Kedinasan</th>
            <th class="col-vol">Volume</th>
            <th class="col-loc">Lokasi</th>
            <th style="width: 75px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tasksPage2.map((t, idx) => `
            <tr>
              <td class="col-no">${tasksPerPage + idx + 1}</td>
              <td class="col-date">${t.date}</td>
              <td class="col-time">${t.timeStart} - ${t.timeEnd}</td>
              <td>
                <div style="font-weight: bold; color: #0f172a;">${t.title}</div>
                <div style="color: #475569; font-size: 8.5pt; margin-top: 2px;">${t.description}</div>
              </td>
              <td class="col-vol">${t.volumeUnit}</td>
              <td class="col-loc">${t.location}</td>
              <td style="text-align: center; font-weight: bold; font-size: 8pt; color: ${t.status === 'selesai' ? '#15803d' : '#b45309'};">
                ${t.status === 'selesai' ? 'Selesai 100%' : 'Proses'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="sheet-footer">
      ${schoolConfig.namaSekolah} · Laporan Kinerja Operator Layanan Operasional · Halaman 3 dari ${totalPages}
    </div>
  </div>
  ` : ''}

  <!-- ========================================================
       LEMBAR PENUTUP: LAMPIRAN II & LEMBAR PENGESAHAN RESMI (ANTI-TERPOTONG)
       ======================================================== -->
  <div class="page-sheet">
    <div>
      <div class="sheet-subheader">
        <span>${schoolConfig.namaSekolah} — Lampiran II & Pengesahan ${roleTitle}</span>
        <span>No: ${noSurat}</span>
      </div>

      <!-- III. INVENTARIS SARANA PRASARANA KERJA -->
      <div class="section-title">III. DAFTAR INVENTARIS SARANA PRASARANA OPERASIONAL KERJA</div>
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-no">No</th>
            <th style="width: 95px;">Kode Barang</th>
            <th>Nama Peralatan / Sarana Kerja</th>
            <th style="width: 65px; text-align: center;">Jumlah</th>
            <th style="width: 80px; text-align: center;">Kondisi</th>
            <th style="width: 130px;">Lokasi Penyimpanan</th>
          </tr>
        </thead>
        <tbody>
          ${roleInventories.length === 0 ? `
            <tr>
              <td colspan="6" style="text-align: center; padding: 10px; color: #64748b;">
                Data inventaris sarana prasarana telah tercatat pada buku induk sarpras sekolah.
              </td>
            </tr>
          ` : roleInventories.map((inv, idx) => `
            <tr>
              <td class="col-no">${idx + 1}</td>
              <td style="font-family: monospace; font-size: 8pt;">${inv.kodeBarang}</td>
              <td style="font-weight: 600;">${inv.namaBarang}</td>
              <td style="text-align: center;">${inv.jumlah} ${inv.satuan}</td>
              <td style="text-align: center; font-weight: bold; font-size: 8pt;">
                ${inv.kondisi}
              </td>
              <td>${inv.lokasiPenyimpanan}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- IV. LAMPIRAN DOKUMENTASI FOTO (JIKA ADA) -->
      ${tasksWithPhotos.length > 0 ? `
      <div class="section-title">IV. LAMPIRAN DOKUMENTASI FOTO BUKTI PEKERJAAN</div>
      <div class="photo-grid">
        ${tasksWithPhotos.slice(0, 4).map((item, idx) => `
          <div class="photo-card">
            <img src="${item.photoUrl}" alt="${item.title}" class="photo-img">
            <div class="photo-info">
              <div class="photo-title">${idx + 1}. ${item.title}</div>
              <div class="photo-meta">📍 ${item.location} · 📅 ${item.date}</div>
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- V. LEMBAR PENGESAHAN RESMI (ANTI-TERPOTONG) -->
      <div class="approval-wrapper">
        <table class="approval-table">
          <tr>
            <!-- Kolom Kiri: Kepala Satuan Pendidikan -->
            <td>
              <div class="sign-title">Mengetahui / Mengesahkan,</div>
              <div class="sign-title">Kepala ${schoolConfig.namaSekolah}</div>
              
              <div class="sign-box">
                ${schoolConfig.stempelEnabled ? `
                  <div class="stamp-overlay">
                    ${schoolConfig.customStempelUrl ? `
                      <img src="${schoolConfig.customStempelUrl}" alt="Cap Stempel" style="width: 100%; height: 100%; object-fit: contain;">
                    ` : `
                      <div class="stamp-badge">
                        <span>★ DISDIK ★</span>
                        <span>${schoolConfig.kabupatenKota.toUpperCase()}</span>
                        <span>RESMI</span>
                      </div>
                    `}
                  </div>
                ` : ''}

                ${schoolConfig.kepalaSekolah.signatureImage ? `
                  <img src="${schoolConfig.kepalaSekolah.signatureImage}" alt="Tanda Tangan Kepsek" class="sign-image">
                ` : `
                  <div class="signature-font">Rahmat Hidayat</div>
                `}
              </div>

              <div class="sign-name">${schoolConfig.kepalaSekolah.nama}</div>
              <div class="sign-nip">${schoolConfig.kepalaSekolah.nip}</div>
              <div class="sign-rank">Pangkat/Gol: ${schoolConfig.kepalaSekolah.pangkatGolongan || 'Pembina, IV/a'}</div>
            </td>

            <!-- Kolom Kanan: Petugas Pelaksana -->
            <td>
              <div class="sign-date">${docDate}</div>
              <div class="sign-title">Petugas Pelaksana Layanan Operasional,</div>

              <div class="sign-box">
                ${operator.signatureImage ? `
                  <img src="${operator.signatureImage}" alt="Tanda Tangan Operator" class="sign-image">
                ` : `
                  <div class="signature-font">
                    ${operator.signatureData || operator.nama.split(' ')[0]}
                  </div>
                `}
              </div>

              <div class="sign-name">${operator.nama}</div>
              <div class="sign-nip">${operator.nip}</div>
              <div class="sign-rank">Jabatan: ${operator.jabatan}</div>
            </td>
          </tr>
        </table>

        <div class="footnote-disclaimer">
          Dokumen ini merupakan laporan kedinasan resmi UPT Satuan Pendidikan yang diverifikasi dan disahkan sesuai dengan Pedoman Tata Naskah Dinas Satuan Pendidikan.
        </div>
      </div>
    </div>

    <!-- Lembar Terakhir Page Footer -->
    <div class="sheet-footer">
      ${schoolConfig.namaSekolah} · Laporan Kinerja Operator Layanan Operasional · Halaman ${totalPages} dari ${totalPages} (Selesai)
    </div>
  </div>

</body>
</html>`;
}
