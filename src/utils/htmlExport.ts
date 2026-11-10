import { SchoolConfig, MonthlyReport, AnnualReport, RoleType, TaskLog, InventoryItem, TupoksiDefinitionsMap, LibraryBookItem, LibraryMemberStats } from '../types';
import { 
  isTaskInMonth, 
  isTaskInYear, 
  getTaskClassification, 
  OFFICIAL_TUPOKSI_DEFINITIONS 
} from './taskClassification';
import { calculateAnnualPerformanceSummary } from './annualPerformanceHelper';
import { formatOfficialNameWithDegree } from './formatters';

interface DocumentExportParams {
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
    tupoksiDefinitions,
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
    jabatan: 'Operator'
  };

  // Deteksi nama dummy/default Rahmat Hidayat & Nurul Hidayat agar tidak tercetak pada berkas kedinasan
  const isDefaultOrDummyKepsek = !schoolConfig.kepalaSekolah?.nama || 
    /rahmat(\s*hidayat)?/i.test(schoolConfig.kepalaSekolah.nama) || 
    schoolConfig.kepalaSekolah.nama.trim() === '';
  
  const displayKepsekNama = isDefaultOrDummyKepsek 
    ? '( .................................................. )' 
    : formatOfficialNameWithDegree(schoolConfig.kepalaSekolah.nama);

  const displayKepsekNip = isDefaultOrDummyKepsek || !schoolConfig.kepalaSekolah?.nip || /19740510\s*199802\s*1\s*003/.test(schoolConfig.kepalaSekolah.nip)
    ? (schoolConfig.kepalaSekolah?.nip && !/19740510\s*199802\s*1\s*003/.test(schoolConfig.kepalaSekolah.nip) ? schoolConfig.kepalaSekolah.nip : 'NIP. .................................................')
    : (schoolConfig.kepalaSekolah.nip.startsWith('NIP') ? schoolConfig.kepalaSekolah.nip : `NIP. ${schoolConfig.kepalaSekolah.nip}`);

  const isDefaultOrDummyOperator = !operator?.nama || 
    /nurul(\s*hidayat|\s*hidayati)?/i.test(operator.nama) || 
    /rahmat(\s*hidayat)?/i.test(operator.nama) ||
    operator.nama.trim() === '';

  const displayOperatorNama = isDefaultOrDummyOperator 
    ? '( .................................................. )' 
    : formatOfficialNameWithDegree(operator.nama);

  const displayOperatorNip = isDefaultOrDummyOperator || !operator?.nip || /19920815\s*202321\s*2\s*024/.test(operator.nip)
    ? (operator?.nip && !/19920815\s*202321\s*2\s*024/.test(operator.nip) ? operator.nip : 'NIP / NIPPK. .................................................')
    : (operator.nip.startsWith('NIP') ? operator.nip : `NIP / NIPPK. ${operator.nip}`);

  const periodString = isMonthly 
    ? `Bulan ${MONTH_NAMES[(monthlyData?.month || 9) - 1]} Tahun ${monthlyData?.year || 2026}`
    : `Tahun Anggaran ${annualData?.year || 2026}`;

  const exportPlace = [schoolConfig.kabupatenKota, schoolConfig.desaKecamatan].filter(Boolean)[0] || '';
  const defaultDateText = isMonthly && monthlyData 
    ? `${MONTH_NAMES[(monthlyData.month || 9) - 1]} ${monthlyData.year || 2026}` 
    : `31 Desember ${annualData?.year || 2026}`;
  const docDate = manualDate || (exportPlace ? `${exportPlace}, ${defaultDateText}` : defaultDateText);
  const noSurat = nomorSurat || `800/${isMonthly ? `LAP-BLN/${monthlyData?.month || 9}` : 'LAP-THN'}/${schoolConfig.npsn || '20202819'}/${new Date().getFullYear()}`;

  // Relevant tasks for this report using robust string date parsing
  const relevantTasks = tasks.filter(t => {
    if (!t.role || t.role.trim().toUpperCase() !== role.trim().toUpperCase()) return false;
    if (isMonthly && monthlyData) {
      return isTaskInMonth(t.date, monthlyData.month, monthlyData.year);
    }
    if (!isMonthly && annualData) {
      return isTaskInYear(t.date, annualData.year);
    }
    return true;
  });

  const tupoksiTasks = relevantTasks.filter(t => getTaskClassification(role, t.category, t.taskType) === 'pokok');
  const tambahanTasks = relevantTasks.filter(t => getTaskClassification(role, t.category, t.taskType) === 'tambahan');
  const tupoksiCompleted = tupoksiTasks.filter(t => t.status === 'selesai');
  const tambahanCompleted = tambahanTasks.filter(t => t.status === 'selesai');
  const completedCount = relevantTasks.filter(t => t.status === 'selesai').length;

  const roleTupoksiList = tupoksiDefinitions?.[role]?.tupoksiList || OFFICIAL_TUPOKSI_DEFINITIONS[role]?.tupoksiList || [];
  const roleTambahanList = tupoksiDefinitions?.[role]?.tugasTambahanList || OFFICIAL_TUPOKSI_DEFINITIONS[role]?.tugasTambahanList || [];

  const roleInventories = inventories.filter(inv => inv.role && inv.role.trim().toUpperCase() === role.trim().toUpperCase());
  const tasksWithPhotos = relevantTasks.filter(t => !!t.photoUrl);

  const isAnnual = !isMonthly;
  const page1TaskLimit = role === 'PERPUS' ? 5 : 6;
  const tasksPage1 = relevantTasks.slice(0, page1TaskLimit);
  const remainingTasks = isAnnual ? [] : relevantTasks.slice(page1TaskLimit);
  const tasksPerPageSubsequent = 12;
  const subsequentChunks: typeof relevantTasks[] = [];
  if (!isAnnual) {
    for (let i = 0; i < remainingTasks.length; i += tasksPerPageSubsequent) {
      subsequentChunks.push(remainingTasks.slice(i, i + tasksPerPageSubsequent));
    }
  }
  const hasSubsequentTasks = subsequentChunks.length > 0;
  const totalPages = 1 + subsequentChunks.length + 1 + 1; // Lembar 1 + N Task Sheets + Lampiran Sarpras + Lembar Pengesahan

  const annualPerformance = calculateAnnualPerformanceSummary(
    tasks, 
    role, 
    !isMonthly ? (reportData as AnnualReport).year : 2026
  );

  // Reusable Kop Surat Generator with user-uploaded logos and official double dividing line
  const generateKopSuratHtml = (config: typeof schoolConfig) => {
    const leftLogo = config.logoKopKiri || config.logoKabupatenUrl;
    const rightLogo = config.logoKopKanan || config.logoSekolahUrl;
    return `
      <div class="kop-surat">
        <div class="kop-logo">
          ${leftLogo ? `
            <img src="${leftLogo}" alt="Logo Pemda" style="max-height: 80px; max-width: 80px; object-fit: contain;">
          ` : `
            <svg viewBox="0 0 120 140" width="70" height="82" xmlns="http://www.w3.org/2000/svg">
              <path d="M60 4 C95 4, 114 15, 114 42 C114 85, 78 122, 60 136 C42 122, 6 85, 6 42 C6 15, 25 4, 60 4 Z" fill="#1e3a8a" stroke="#d97706" stroke-width="3.5"/>
              <path d="M60 10 C90 10, 107 19, 107 43 C107 81, 75 115, 60 128 C45 115, 13 81, 13 43 C13 19, 30 10, 60 10 Z" fill="none" stroke="#fef08a" stroke-width="1.2"/>
              <polygon points="60,18 63,27 72,27 65,33 67,42 60,37 53,42 55,33 48,27 57,27" fill="#fde047" stroke="#b45309" stroke-width="0.8"/>
              <path d="M32 50 C26 70, 36 96, 60 108" fill="none" stroke="#fbbf24" stroke-width="3" stroke-dasharray="4 2"/>
              <path d="M88 50 C94 70, 84 96, 60 108" fill="none" stroke="#fbbf24" stroke-width="3" stroke-dasharray="4 2"/>
              <polygon points="60,52 40,82 80,82" fill="#22c55e" opacity="0.9"/>
              <polygon points="60,60 48,82 72,82" fill="#ffffff" opacity="0.7"/>
              <path d="M28 112 Q60 106 92 112 L88 122 Q60 116 32 122 Z" fill="#b91c1c" stroke="#fef08a" stroke-width="1"/>
              <text x="60" y="119" text-anchor="middle" font-size="6.5" font-weight="bold" fill="#ffffff" font-family="sans-serif">PEMDA</text>
            </svg>
          `}
        </div>

        <div class="kop-center">
          ${config.pemerintahDaerah && config.pemerintahDaerah.trim() ? `<div class="kop-pemda">${config.pemerintahDaerah}</div>` : ''}
          ${config.dinasPendidikan && config.dinasPendidikan.trim() ? `<div class="kop-dinas">${config.dinasPendidikan}</div>` : ''}
          ${config.namaSekolah && config.namaSekolah.trim() ? `<div class="kop-sekolah">${config.namaSekolah}</div>` : ''}
          <div class="kop-alamat">
            ${[
              config.npsn && config.npsn.trim() ? `NPSN: ${config.npsn.trim()}` : '',
              config.nss && config.nss.trim() ? `NSS: ${config.nss.trim()}` : ''
            ].filter(Boolean).join(' · ')}${(config.npsn || config.nss) ? '<br>' : ''}
            ${[
              config.alamat,
              config.desaKecamatan,
              config.kabupatenKota,
              config.provinsi
            ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0).join(', ')}${config.kodePos && config.kodePos.trim() ? ` Kode Pos ${config.kodePos.trim()}` : ''}<br>
            ${[
              config.telepon && config.telepon.trim() ? `Telp: ${config.telepon.trim()}` : '',
              config.email && config.email.trim() ? `Email: ${config.email.trim()}` : ''
            ].filter(Boolean).join(' | ')}
          </div>
        </div>

        <div class="kop-logo">
          ${rightLogo ? `
            <img src="${rightLogo}" alt="Logo Sekolah" style="max-height: 80px; max-width: 80px; object-fit: contain;">
          ` : `
            <svg viewBox="0 0 120 140" width="70" height="82" xmlns="http://www.w3.org/2000/svg">
              <polygon points="60,6 112,44 92,126 28,126 8,44" fill="#0284c7" stroke="#fbbf24" stroke-width="3.5"/>
              <polygon points="60,13 105,47 87,120 33,120 15,47" fill="none" stroke="#ffffff" stroke-width="1.2"/>
              <path d="M60 46 C42 46, 26 62, 28 88 C38 82, 48 80, 60 84 C72 80, 82 82, 92 88 C94 62, 78 46, 60 46 Z" fill="#f59e0b" stroke="#fef08a" stroke-width="1.2"/>
              <path d="M60 28 C64 36, 68 40, 68 46 C68 50, 64 54, 60 54 C56 54, 52 50, 52 46 C52 40, 56 36, 60 28 Z" fill="#ef4444" stroke="#fde047" stroke-width="1"/>
              <path d="M60 88 C48 82, 34 84, 26 94 L26 98 C34 88, 48 86, 60 92 C72 86, 86 88, 94 98 L94 94 C86 84, 72 82, 60 88 Z" fill="#ffffff" stroke="#0f172a" stroke-width="0.8"/>
              <text x="60" y="122" text-anchor="middle" font-size="6.5" font-weight="bold" fill="#ffffff" font-family="sans-serif">TUT WURI</text>
            </svg>
          `}
        </div>
      </div>
    `;
  };

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
      <p>Format Naskah Dinas Pendidikan Resmi · Dilengkapi Garis Ganda Kop & Lembar Pengesahan Kedinasan</p>
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
       LEMBAR 1: DOKUMEN INDUK LAPORAN KINERJA (PADAT & LENGKAP)
       ======================================================== -->
  <div class="page-sheet">
    <div>
      <!-- KOP SURAT 3 KOLOM RESMI DENGAN LOGO PENGGUNA -->
      ${generateKopSuratHtml(schoolConfig)}

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
            <td class="value">${displayOperatorNama}</td>
          </tr>
          <tr>
            <td class="label">NIP / NIPPK</td>
            <td class="separator">:</td>
            <td class="value">${displayOperatorNip}</td>
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
      <div class="section-title">I. RINGKASAN EKSEKUTIF KINERJA & CAPAIAN TARGET OPERASIONAL (${roleTitle.toUpperCase()})</div>
      <p class="justified-text">${reportData.summary}</p>

      <div style="font-weight: bold; margin-bottom: 4px; font-size: 9pt;">Rincian Capaian Indikator Kinerja yang Terlaksana (${roleTitle}):</div>
      <ol style="margin-bottom: 6px;">
        ${(isMonthly ? monthlyData?.achievements : annualData?.annualMilestones)?.map(item => `<li>${item}</li>`).join('') || '<li>Tugas operasional terlaksana sesuai sasaran kerja.</li>'}
      </ol>

      ${isMonthly && monthlyData ? `
      <div style="display: flex; gap: 14px; margin-top: 6px; margin-bottom: 6px;">
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 9pt; color: #b91c1c; margin-bottom: 2px;">Kendala / Hambatan di Lapangan:</div>
          <ul style="font-size: 8.5pt;">
            ${monthlyData.obstacles?.map(obs => `<li>${obs}</li>`).join('') || '<li>Tidak ada kendala yang berarti.</li>'}
          </ul>
        </div>
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 9pt; color: #15803d; margin-bottom: 2px;">Solusi / Upaya Pemecahan Masalah:</div>
          <ul style="font-size: 8.5pt;">
            ${monthlyData.solutions?.map(sol => `<li>${sol}</li>`).join('') || '<li>Koordinasi berkala bersama satuan pendidikan berjalan optimal.</li>'}
          </ul>
        </div>
      </div>` : ''}

      ${!isMonthly && annualData && annualData.obstacles && annualData.obstacles.length > 0 ? `
      <div style="display: flex; gap: 14px; margin-top: 6px; margin-bottom: 6px;">
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 9pt; color: #b91c1c; margin-bottom: 2px;">Evaluasi Kendala Lapangan Terakumulasi:</div>
          <ul style="font-size: 8.5pt;">
            ${annualData.obstacles.map(obs => `<li>${obs}</li>`).join('')}
          </ul>
        </div>
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 9pt; color: #15803d; margin-bottom: 2px;">Solusi / Mitigasi Kendala:</div>
          <ul style="font-size: 8.5pt;">
            ${(annualData.solutions || []).map(sol => `<li>${sol}</li>`).join('')}
          </ul>
        </div>
      </div>` : ''}

      <!-- II. STANDAR TUGAS POKOK (TUPOKSI) DAN TUGAS TAMBAHAN -->
      <div class="section-title">II. STANDAR TUGAS POKOK (TUPOKSI) DAN TUGAS TAMBAHAN LAYANAN OPERASIONAL</div>
      <div style="display: flex; gap: 12px; margin-top: 4px; margin-bottom: 6px;">
        <div style="flex: 1; background: #f8fafc; border: 1px solid #000; padding: 6px 8px; border-radius: 3px;">
          <div style="font-weight: bold; font-size: 8.5pt; color: #1e3a8a; margin-bottom: 2px; display: flex; justify-content: space-between;">
            <span>A. Tugas Pokok (Tupoksi Standar):</span>
            <span style="font-family: monospace;">(${tupoksiCompleted.length}/${tupoksiTasks.length} Tuntas)</span>
          </div>
          <ul style="padding-left: 16px; margin: 0; font-size: 8pt; line-height: 1.25;">
            ${roleTupoksiList.map(item => `<li style="margin-bottom: 1px;">${item}</li>`).join('') || ''}
          </ul>
        </div>
        <div style="flex: 1; background: #f8fafc; border: 1px solid #000; padding: 6px 8px; border-radius: 3px;">
          <div style="font-weight: bold; font-size: 8.5pt; color: #92400e; margin-bottom: 2px; display: flex; justify-content: space-between;">
            <span>B. Tugas Tambahan & Insidental:</span>
            <span style="font-family: monospace;">(${tambahanCompleted.length}/${tambahanTasks.length} Tuntas)</span>
          </div>
          <ul style="padding-left: 16px; margin: 0; font-size: 8pt; line-height: 1.25;">
            ${roleTambahanList.map(item => `<li style="margin-bottom: 1px;">${item}</li>`).join('') || ''}
          </ul>
        </div>
      </div>

      ${role === 'PERPUS' ? `
      <!-- III. REKAPITULASI ANGGOTA PERPUSTAKAAN -->
      <div class="section-title">III. REKAPITULASI ANGGOTA PERPUSTAKAAN (PEMUSTAKA SEKOLAH)</div>
      <table class="data-table" style="margin-top: 3px; margin-bottom: 6px; font-size: 8.5pt;">
        <thead>
          <tr>
            <th>Guru (Pendidik)</th>
            <th>Tenaga Kependidikan (Staff)</th>
            <th style="text-align: center;">Siswa (L)</th>
            <th style="text-align: center;">Siswa (P)</th>
            <th style="text-align: center;">Total Seluruh Pemustaka</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${libraryMemberStats?.guruPendidik || 0} orang</td>
            <td>${libraryMemberStats?.staffTendik || 0} orang</td>
            <td style="text-align: center;">${libraryMemberStats?.siswaLaki || 0} orang</td>
            <td style="text-align: center;">${libraryMemberStats?.siswaPerempuan || 0} orang</td>
            <td style="text-align: center; font-weight: bold; color: #1e3a8a;">
              ${(libraryMemberStats?.guruPendidik || 0) + (libraryMemberStats?.staffTendik || 0) + (libraryMemberStats?.siswaLaki || 0) + (libraryMemberStats?.siswaPerempuan || 0)} orang
            </td>
          </tr>
        </tbody>
      </table>` : ''}

      <!-- REKAPITULASI TUGAS: TAHUNAN ATAU BULANAN -->
      ${isAnnual ? `
        <div class="section-title">
          ${role === 'PERPUS' ? 'IV.' : 'III.'} REKAPITULASI & PERSENTASE KINERJA OPERASIONAL PER BULAN (TUGAS POKOK & TUGAS TAMBAHAN)
        </div>
        <div style="font-size: 7.5pt; color: #475569; margin-bottom: 4px;">
          Rekapitulasi volume realisasi tugas kedinasan per bulan menurut bagian Tugas Pokok dan Tugas Tambahan beserta persentase ketercapaian operasional:
        </div>
        <table class="data-table" style="margin-top: 3px; font-size: 8pt;">
          <thead>
            <tr>
              <th style="width: 26px; text-align: center;">No</th>
              <th style="width: 75px;">Bulan</th>
              <th>Realisasi Tugas Pokok & Volume Hasil</th>
              <th>Realisasi Tugas Tambahan & Volume Hasil</th>
              <th style="width: 50px; text-align: center;">Kegiatan</th>
              <th style="width: 45px; text-align: center;">Tuntas</th>
              <th style="width: 55px; text-align: center;">Capaian</th>
            </tr>
          </thead>
          <tbody>
            ${annualPerformance.items.map((item, idx) => `
              <tr>
                <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
                <td style="font-weight: bold; color: #0f172a; white-space: nowrap;">${item.monthName}</td>
                <td style="font-size: 7.5pt; line-height: 1.3; color: #1e293b;">
                  ${item.tupoksiSummary}
                </td>
                <td style="font-size: 7.5pt; line-height: 1.3; color: #334155;">
                  ${item.tambahanSummary}
                </td>
                <td style="text-align: center; font-family: monospace;">${item.totalTasks}</td>
                <td style="text-align: center; font-family: monospace; color: #15803d; font-weight: bold;">${item.completedTasks}</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold; color: #15803d;">${item.percentage}%</td>
              </tr>
            `).join('')}
            <tr style="background: #e2e8f0; font-weight: bold; font-size: 8pt;">
              <td colspan="2" style="text-align: center;">TOTAL TAHUNAN</td>
              <td style="font-size: 7.5pt;">Total ${annualPerformance.totalTupoksi} Kegiatan Tugas Pokok Terlaksana</td>
              <td style="font-size: 7.5pt;">Total ${annualPerformance.totalTambahan} Kegiatan Tugas Tambahan Terlaksana</td>
              <td style="text-align: center; font-family: monospace;">${annualPerformance.totalTasks}</td>
              <td style="text-align: center; font-family: monospace; color: #15803d;">${annualPerformance.totalCompleted}</td>
              <td style="text-align: center; font-family: monospace; color: #15803d; font-weight: bold;">${annualPerformance.averagePercentage.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      ` : `
        <div class="section-title">
          ${role === 'PERPUS' ? 'IV.' : 'III.'} REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL YANG DILAKSANAKAN ${hasSubsequentTasks ? '(BAGIAN 1)' : ''}
        </div>
        <table class="data-table" style="margin-top: 3px;">
          <thead>
            <tr>
              <th class="col-no">No</th>
              <th class="col-date">Tanggal</th>
              <th style="width: 75px; font-size: 8pt;">Klasifikasi</th>
              <th class="col-time">Waktu</th>
              <th>Uraian Tugas & Pekerjaan Kedinasan</th>
              <th class="col-vol">Volume</th>
              <th class="col-loc">Lokasi</th>
              <th style="width: 70px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tasksPage1.length === 0 ? `
              <tr>
                <td colspan="8" style="text-align: center; padding: 10px; color: #64748b;">
                  Tidak ada catatan tugas operasional pada periode ini.
                </td>
              </tr>
            ` : tasksPage1.map((t, idx) => {
              const isPokok = getTaskClassification(role, t.category, t.taskType) === 'pokok';
              return `
              <tr>
                <td class="col-no">${idx + 1}</td>
                <td class="col-date">${t.date}</td>
                <td style="font-size: 7.5pt; font-weight: bold; white-space: nowrap; color: ${isPokok ? '#1e40af' : '#b45309'};">
                  ${isPokok ? 'Tugas Pokok' : 'Tambahan'}
                </td>
                <td class="col-time">${t.timeStart} - ${t.timeEnd}</td>
                <td>
                  <div style="font-weight: bold; color: #0f172a;">${t.title}</div>
                  <div style="color: #475569; font-size: 8pt; margin-top: 1px;">${t.description}</div>
                </td>
                <td class="col-vol">${t.volumeUnit}</td>
                <td class="col-loc">${t.location}</td>
                <td style="text-align: center; font-weight: bold; font-size: 7.5pt; color: ${t.status === 'selesai' ? '#15803d' : '#b45309'};">
                  ${t.status === 'selesai' ? 'Selesai 100%' : 'Proses'}
                </td>
              </tr>
            `;
            }).join('')}
            ${!hasSubsequentTasks && relevantTasks.length > 0 ? `
              <tr style="background: #e2e8f0; font-weight: bold; font-size: 8pt;">
                <td colspan="3" style="text-align: center;">TOTAL REKAPITULASI</td>
                <td colspan="4">
                  ${relevantTasks.length} Tugas Operasional (${tupoksiTasks.length} Tugas Pokok / ${tambahanTasks.length} Tugas Tambahan)
                </td>
                <td style="text-align: center; color: #15803d;">
                  ${completedCount}/${relevantTasks.length} Tuntas
                </td>
              </tr>
            ` : ''}
          </tbody>
        </table>
        ${hasSubsequentTasks ? `
          <div style="font-size: 7.5pt; font-style: italic; color: #475569; margin-top: 4px; text-align: right;">
            *(Rincian tugas ke-${page1TaskLimit + 1} s.d. ${relevantTasks.length} tercantum secara lengkap pada lembar lampiran berikutnya)
          </div>
        ` : ''}
      `}
    </div>

    <!-- Lembar 1 Page Footer -->
    <div class="sheet-footer">
      ${schoolConfig.namaSekolah} · Laporan Kinerja Operator Layanan Operasional · Halaman 1 dari ${totalPages}
    </div>
  </div>

  ${subsequentChunks.map((chunk, chunkIdx) => {
    const pageNum = 2 + chunkIdx;
    const isLastTaskChunk = chunkIdx === subsequentChunks.length - 1;
    return `
    <!-- ========================================================
         LEMBAR TUGAS LANJUTAN BAGIAN ${chunkIdx + 2}
         ======================================================== -->
    <div class="page-sheet">
      <div>
        ${generateKopSuratHtml(schoolConfig)}

        <div class="sheet-subheader">
          <span>${schoolConfig.namaSekolah} — Lampiran I: Lanjutan Rekapitulasi Tugas ${roleTitle} (Bagian ${chunkIdx + 2})</span>
          <span>No: ${noSurat}</span>
        </div>

        <div class="section-title">
          ${role === 'PERPUS' ? 'IV.' : 'III.'} REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL (LANJUTAN BAGIAN ${chunkIdx + 2})
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-no">No</th>
              <th class="col-date">Tanggal</th>
              <th style="width: 80px; font-size: 8.5pt;">Klasifikasi</th>
              <th class="col-time">Waktu</th>
              <th>Uraian Tugas & Pekerjaan Kedinasan</th>
              <th class="col-vol">Volume</th>
              <th class="col-loc">Lokasi</th>
              <th style="width: 75px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${chunk.map((t, idx) => {
              const isPokok = getTaskClassification(role, t.category, t.taskType) === 'pokok';
              return `
              <tr>
                <td class="col-no">${page1TaskLimit + chunkIdx * tasksPerPageSubsequent + idx + 1}</td>
                <td class="col-date">${t.date}</td>
                <td style="font-size: 8pt; font-weight: bold; white-space: nowrap; color: ${isPokok ? '#1e40af' : '#b45309'};">
                  ${isPokok ? 'Tugas Pokok' : 'Tambahan'}
                </td>
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
            `;
            }).join('')}
            ${isLastTaskChunk ? `
              <tr style="background: #e2e8f0; font-weight: bold; font-size: 8.5pt;">
                <td colspan="3" style="text-align: center;">TOTAL REKAPITULASI</td>
                <td colspan="4">
                  ${relevantTasks.length} Tugas Operasional (${tupoksiTasks.length} Tugas Pokok / ${tambahanTasks.length} Tugas Tambahan)
                </td>
                <td style="text-align: center; color: #15803d;">
                  ${completedCount}/${relevantTasks.length} Tuntas
                </td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>

      <div class="sheet-footer">
        ${schoolConfig.namaSekolah} · Laporan Kinerja Operator Layanan Operasional · Halaman ${pageNum} dari ${totalPages}
      </div>
    </div>
    `;
  }).join('')}

  <!-- ========================================================
       LEMBAR LAMPIRAN II: SARPRAS & LEMBAR PENGESAHAN RESMI (ANTI-TERPOTONG)
       ======================================================== -->
  <div class="page-sheet">
    <div>
      ${generateKopSuratHtml(schoolConfig)}

      <div class="sheet-subheader">
        <span>${schoolConfig.namaSekolah} — Lampiran II: Sarana Prasarana & Rekapitulasi</span>
        <span>No: ${noSurat}</span>
      </div>

      ${role === 'PERPUS' ? `
      <!-- KOLEKSI BUKU PERPUSTAKAAN -->
      <div class="section-title">
        ${isMonthly 
          ? `IV. LAMPIRAN PENAMBAHAN BUKU BARU BULAN ${MONTH_NAMES[(monthlyData?.month || 9) - 1].toUpperCase()} ${monthlyData?.year || 2026}`
          : `IV. LAMPIRAN KATALOG SELURUH DATA BUKU PERPUSTAKAAN TERDATA`
        }
      </div>
      <table class="data-table" style="margin-bottom: 12px;">
        <thead>
          <tr>
            <th class="col-no">No</th>
            <th>Judul Buku</th>
            <th>Pengarang / Penerbit</th>
            <th>Kelas</th>
            <th>DDC</th>
            <th>Kategori</th>
            <th>${isMonthly ? 'Tgl Masuk' : 'Tahun'}</th>
            <th style="text-align: center;">Jml</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            const perpusBooks = isMonthly && monthlyData
              ? libraryBooks.filter(b => {
                  const targetKey = `${monthlyData.year}-${String(monthlyData.month).padStart(2, '0')}`;
                  const rawBulan = String(b.bulanPengadaan || (b.tanggalMasuk ? b.tanggalMasuk.substring(0, 7) : ''));
                  return rawBulan.startsWith(targetKey) || (Boolean(b.tanggalMasuk) && b.tanggalMasuk.startsWith(targetKey));
                })
              : libraryBooks;
            if (perpusBooks.length === 0) {
              return `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 10px;">${isMonthly ? 'Pada bulan berjalan tidak terdapat penambahan buku baru yang masuk / dibeli.' : 'Belum ada data buku yang terdaftar.'}</td></tr>`;
            }
            return perpusBooks.slice(0, isMonthly ? 10 : 15).map((b, idx) => `
              <tr>
                <td class="col-no">${idx + 1}</td>
                <td style="font-weight: 600;">${b.judul}</td>
                <td>${b.pengarang || '-'} ${b.penerbit ? `(${b.penerbit})` : ''}</td>
                <td>${b.kelas || '-'}</td>
                <td style="font-family: monospace;">${b.ddcKlasifikasi || '-'}</td>
                <td style="text-transform: uppercase;">${b.statusBuku || b.kategori || 'umum'}</td>
                <td>${isMonthly ? (b.tanggalMasuk || '-') : (b.tahunBeli || '-')}</td>
                <td style="text-align: center; font-weight: bold;">${b.jumlah} eks</td>
              </tr>
            `).join('');
          })()}
        </tbody>
      </table>` : ''}

      <!-- IV. INVENTARIS SARANA PRASARANA KERJA -->
      <div class="section-title">${role === 'PERPUS' ? 'V.' : 'IV.'} DAFTAR INVENTARIS SARANA PRASARANA OPERASIONAL KERJA</div>
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
        <table class="approval-table" style="width: 100%; table-layout: fixed; border-collapse: collapse;">
          <tr>
            <!-- Kolom Kiri: Kepala Satuan Pendidikan (Mengetahui / Mengesahkan) -->
            <td style="width: 50%; vertical-align: top; text-align: center; padding: 0 16px;">
              <div class="sign-date" style="visibility: hidden; height: 22px; line-height: 22px;" aria-hidden="true">&nbsp;</div>
              <div class="sign-title" style="height: 22px; line-height: 22px; font-weight: 600;">Mengetahui / Mengesahkan,</div>
              <div class="sign-title" style="height: 22px; line-height: 22px; font-size: 9pt; margin-bottom: 2px;">${schoolConfig.kepalaSekolah.jabatan || 'Kepala Satuan Pendidikan'}</div>
              
              <div class="sign-box" style="height: 85px; position: relative; margin: 4px 0; display: flex; align-items: center; justify-content: center;">
                ${!isDefaultOrDummyKepsek && schoolConfig.kepalaSekolah.signatureImage ? `
                  <img src="${schoolConfig.kepalaSekolah.signatureImage}" alt="Tanda Tangan Kepsek" class="sign-image" style="max-height: 75px; max-width: 180px; object-fit: contain;">
                ` : `
                  <div style="height: 75px; width: 100%;"></div>
                `}
              </div>

              <div class="sign-name" style="height: 24px; line-height: 24px; font-weight: bold; ${isDefaultOrDummyKepsek ? '' : 'text-decoration: underline;'}">${displayKepsekNama}</div>
              <div class="sign-nip" style="height: 20px; line-height: 20px; font-family: monospace;">${displayKepsekNip}</div>
            </td>

            <!-- Kolom Kanan: Petugas Pelaksana / Pengelola (Yang Membuat Laporan) -->
            <td style="width: 50%; vertical-align: top; text-align: center; padding: 0 16px;">
              <div class="sign-date" style="height: 22px; line-height: 22px;">${docDate}</div>
              <div class="sign-title" style="height: 22px; line-height: 22px; font-weight: 600;">Yang Membuat Laporan,</div>
              <div class="sign-title" style="height: 22px; line-height: 22px; font-size: 9pt; margin-bottom: 2px;">${operator.jabatan || (role === 'PERPUS' ? 'Pengelola Perpustakaan' : 'Petugas Pelaksana')}</div>

              <div class="sign-box" style="height: 85px; position: relative; margin: 4px 0; display: flex; align-items: center; justify-content: center;">
                ${!isDefaultOrDummyOperator && operator.signatureImage ? `
                  <img src="${operator.signatureImage}" alt="Tanda Tangan Operator" class="sign-image" style="max-height: 75px; max-width: 180px; object-fit: contain;">
                ` : `
                  <div style="height: 75px; width: 100%;"></div>
                `}
              </div>

              <div class="sign-name" style="height: 24px; line-height: 24px; font-weight: bold; ${isDefaultOrDummyOperator ? '' : 'text-decoration: underline;'}">${displayOperatorNama}</div>
              <div class="sign-nip" style="height: 20px; line-height: 20px; font-family: monospace;">${displayOperatorNip}</div>
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
