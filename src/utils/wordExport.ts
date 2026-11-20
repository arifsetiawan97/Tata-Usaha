/**
 * Word (.doc) Document Generator & Downloader
 * Menghasilkan file dokumen Microsoft Word berformat resmi (.doc via XML/HTML Word format)
 * dengan UTF-8 BOM, standar tata naskah dinas, 3 kolom Kop Surat (logo kiri & kanan),
 * 1:1 akurat dengan tampilan Web UI: Ringkasan Eksekutif, Tupoksi, Matriks KPI, Rekap Pemustaka
 * & Penambahan Bulanan, Rekap 12 Bulan / Rincian Tugas Harian, Sarpras, serta Lembar Pengesahan.
 */

import {
  SchoolConfig,
  MonthlyReport,
  AnnualReport,
  RoleType,
  TaskLog,
  InventoryItem,
  TupoksiDefinitionsMap,
  LibraryBookItem,
  LibraryMemberStats,
  LibraryMemberItem
} from '../types';
import {
  isTaskInMonth,
  isTaskInYear,
  getTaskClassification,
  OFFICIAL_TUPOKSI_DEFINITIONS
} from './taskClassification';
import { calculateAnnualPerformanceSummary } from './annualPerformanceHelper';
import {
  computeLibraryMemberRecap,
  computeMonthlyBookAdditions,
  computeMonthlyMemberAdditions
} from './libraryStatsHelper';
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

export interface WordExportParams {
  reportType: 'monthly' | 'annual';
  reportData: MonthlyReport | AnnualReport;
  schoolConfig: SchoolConfig;
  tasks: TaskLog[];
  inventories: InventoryItem[];
  tupoksiDefinitions?: TupoksiDefinitionsMap;
  manualDate?: string;
  nomorSurat?: string;
  monthlyReports?: MonthlyReport[];
  libraryBooks?: LibraryBookItem[];
  libraryMembers?: LibraryMemberItem[];
  libraryMemberStats?: LibraryMemberStats;
}

export interface LibraryMemberWordParams {
  schoolConfig: SchoolConfig;
  libraryMembers: LibraryMemberItem[];
  memberStats: {
    total: number;
    siswaCount: number;
    guruCount: number;
    guruLaki?: number;
    guruPerempuan?: number;
    staffCount: number;
    staffLaki?: number;
    staffPerempuan?: number;
    lakiCount: number;
    perempuanCount: number;
    aktifCount: number;
    nonaktifCount: number;
    tamatCount: number;
  };
  nomorDokumen: string;
  manualDate: string;
  includeFullList?: boolean;
  additionMonth?: number | 'all';
  additionYear?: number;
}

export interface InventoryKirWordParams {
  schoolConfig: SchoolConfig;
  role: RoleType;
  roleTitle: string;
  inventories: InventoryItem[];
  manualDate?: string;
}

/**
 * Download helper: membuat Blob application/msword dan memicu unduhan file .doc
 */
export function downloadWordBlob(docHtml: string, filename: string): void {
  const cleanFilename = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword;charset=utf-8;' });
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
 * Generate Word Kop Surat HTML (3 Kolom: Logo Kiri, Teks Instansi, Logo Kanan)
 */
function generateWordKopSurat(config: SchoolConfig): string {
  const leftLogo = config.logoKopKiri || config.logoKabupatenUrl;
  const rightLogo = config.logoKopKanan || config.logoSekolahUrl;

  const pemdaText = (config.pemerintahDaerah || 'PEMERINTAH KABUPATEN BATANG HARI').toUpperCase();
  const dinasText = (config.dinasPendidikan || 'DINAS PENDIDIKAN DAN KEBUDAYAAN').toUpperCase();
  const sekolahText = (config.namaSekolah || 'SMP NEGERI SATU ATAP TELUK').toUpperCase();

  const alamatParts = [
    config.alamat,
    config.desaKecamatan,
    config.kabupatenKota,
    config.provinsi
  ].filter(Boolean).join(', ') + (config.kodePos ? ` Kode Pos ${config.kodePos}` : '');

  const kontakParts = [
    config.telepon ? `Telp: ${config.telepon}` : '',
    config.email ? `Pos-el: ${config.email}` : '',
    config.website ? `Laman: ${config.website}` : ''
  ].filter(Boolean).join(' | ');

  const npsnNss = [
    config.npsn ? `NPSN: ${config.npsn}` : '',
    config.nss ? `NSS: ${config.nss}` : ''
  ].filter(Boolean).join(' · ');

  const borderCss = (() => {
    switch (config.kopBorderStyle) {
      case 'double':
        return '3.5px double #000000';
      case 'solid_thick':
        return '3px solid #000000';
      case 'solid_thin':
        return '1.5px solid #000000';
      case 'dashed':
        return '2px dashed #000000';
      case 'double_thick':
      default:
        return '4.5px double #000000';
    }
  })();

  return `
    <table class="kop-table" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-bottom: ${borderCss}; padding-bottom: 8px; margin-bottom: 14px;">
      <tr>
        <td style="width: 85px; text-align: center; vertical-align: middle;">
          ${leftLogo ? `
            <img src="${leftLogo}" width="72" height="84" style="object-fit: contain;" alt="Logo Pemda" />
          ` : `
            <div style="width: 68px; height: 80px; border: 2px solid #1e3a8a; background-color: #f8fafc; text-align: center; font-size: 8pt; font-weight: bold; color: #1e3a8a; padding-top: 24px; box-sizing: border-box;">
              PEMDA
            </div>
          `}
        </td>
        <td style="text-align: center; vertical-align: middle; padding: 0 10px;">
          <div style="font-size: 11pt; font-weight: bold; font-family: 'Times New Roman', serif; text-transform: uppercase; line-height: 1.2;">
            ${pemdaText}
          </div>
          <div style="font-size: 12pt; font-weight: bold; font-family: 'Times New Roman', serif; text-transform: uppercase; line-height: 1.2;">
            ${dinasText}
          </div>
          <div style="font-size: 15pt; font-weight: 800; font-family: 'Times New Roman', serif; text-transform: uppercase; margin: 3px 0; line-height: 1.2;">
            ${sekolahText}
          </div>
          ${alamatParts ? `
            <div style="font-size: 9pt; font-style: italic; font-family: Arial, sans-serif; line-height: 1.2;">
              ${alamatParts}
            </div>
          ` : ''}
          ${kontakParts ? `
            <div style="font-size: 8.5pt; font-family: Arial, sans-serif; line-height: 1.2;">
              ${kontakParts}
            </div>
          ` : ''}
          ${npsnNss ? `
            <div style="font-size: 8.5pt; font-weight: bold; font-family: Arial, sans-serif; margin-top: 2px;">
              ${npsnNss}
            </div>
          ` : ''}
        </td>
        <td style="width: 85px; text-align: center; vertical-align: middle;">
          ${rightLogo ? `
            <img src="${rightLogo}" width="72" height="84" style="object-fit: contain;" alt="Logo Tut Wuri" />
          ` : `
            <div style="width: 68px; height: 80px; border: 2px solid #0284c7; background-color: #f8fafc; text-align: center; font-size: 8pt; font-weight: bold; color: #0284c7; padding-top: 24px; box-sizing: border-box;">
              TUT WURI
            </div>
          `}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Helper blok tanda tangan Word (.doc) dengan NIP/PPPK bersih dan dukungan gambar tanda tangan
 */
function renderWordSignatureBlock(params: {
  schoolConfig: SchoolConfig;
  role: RoleType;
  operatorTitle: string;
  docDate: string;
}): string {
  const { schoolConfig, role, operatorTitle, docDate } = params;
  let layoutMode = '2_col';
  try {
    const saved = localStorage.getItem('siops_signature_layout');
    if (saved && ['2_col', '2_col_wakasek', '3_col_wakasek', '3_col', '4_col_hierarchy'].includes(saved)) {
      layoutMode = saved;
    }
  } catch {
    // ignore
  }

  const kepsek = schoolConfig.kepalaSekolah;
  const wakasek = schoolConfig.wakilKepalaSekolah;
  const operator = schoolConfig.operatorProfiles?.[role];
  const tuProfile = schoolConfig.operatorProfiles?.TU;

  const isDummyKepsek = !kepsek?.nama || /rahmat(\s*hidayat)?/i.test(kepsek.nama) || kepsek.nama.trim() === '';
  const kepsekName = isDummyKepsek ? '( .................................................. )' : formatOfficialNameWithDegree(kepsek.nama);
  const kepsekNip = isDummyKepsek || !kepsek?.nip || /19740510\s*199802\s*1\s*003/.test(kepsek.nip)
    ? (kepsek?.nip && !/19740510\s*199802\s*1\s*003/.test(kepsek.nip)
        ? formatOfficialNipOrPppk(kepsek.nip, { defaultPrefix: 'NIP.' })
        : 'NIP. .................................................')
    : formatOfficialNipOrPppk(kepsek.nip, { defaultPrefix: 'NIP.' });

  const isDummyWakasek = !wakasek?.nama || !wakasek.nama.trim();
  const wakasekName = isDummyWakasek ? '( .................................................. )' : formatOfficialNameWithDegree(wakasek!.nama);
  const wakasekNip = isDummyWakasek || !wakasek?.nip?.trim()
    ? 'NIP. .................................................'
    : formatOfficialNipOrPppk(wakasek!.nip, { defaultPrefix: 'NIP.' });

  const isDummyTu = !tuProfile?.nama || /nurul|rahmat/i.test(tuProfile.nama) || tuProfile.nama.trim() === '';
  const kasubagName = isDummyTu ? '( .................................................. )' : formatOfficialNameWithDegree(tuProfile!.nama);
  const kasubagNip = isDummyTu || !tuProfile?.nip?.trim()
    ? 'NIP. .................................................'
    : formatOfficialNipOrPppk(tuProfile!.nip, { defaultPrefix: 'NIP.' });

  const isDummyOperator = !operator?.nama || /nurul(\s*hidayat|\s*hidayati)?/i.test(operator.nama) || /rahmat(\s*hidayat)?/i.test(operator.nama) || operator.nama.trim() === '';
  const operatorName = isDummyOperator ? '( .................................................. )' : formatOfficialNameWithDegree(operator.nama);
  const operatorNip = isDummyOperator || !operator?.nip || /19920815\s*202321\s*2\s*024/.test(operator.nip)
    ? (operator?.nip && !/19920815\s*202321\s*2\s*024/.test(operator.nip)
        ? formatOfficialNipOrPppk(operator.nip, { defaultPrefix: 'NIP.' })
        : 'NIP / NIPPK. .................................................')
    : formatOfficialNipOrPppk(operator.nip, { defaultPrefix: 'NIP.' });

  const makeCell = (topLabel: string, roleText: string, nameText: string, nipText: string, isDummy: boolean, widthPct?: string) => `
    <td${widthPct ? ` style="width: ${widthPct};"` : ''}>
      <div>${topLabel}</div>
      <div style="font-weight: bold; margin-top: 2px;">${roleText}</div>
      <div style="height: 70px; text-align: center; vertical-align: middle;"></div>
      <div style="font-weight: bold; ${isDummy ? '' : 'text-decoration: underline;'} font-size: 11pt;">${nameText}</div>
      <div style="font-size: 9.5pt; font-family: Arial, sans-serif; margin-top: 2px;">
        ${nipText}
      </div>
    </td>
  `;

  if (layoutMode === '2_col_wakasek') {
    return `
      <table class="signatures">
        <tr>
          ${makeCell('Mengetahui / Mengesahkan,', kepsek?.jabatan || 'Kepala Sekolah', kepsekName, kepsekNip, isDummyKepsek)}
          ${makeCell(`${docDate}<br/>Wakil Kepala Sekolah,`, wakasek?.jabatan || 'Wakil Kepala Sekolah', wakasekName, wakasekNip, isDummyWakasek)}
        </tr>
      </table>
    `;
  }

  if (layoutMode === '3_col_wakasek') {
    return `
      <table class="signatures">
        <tr>
          ${makeCell('Mengetahui / Mengesahkan,', kepsek?.jabatan || 'Kepala Sekolah', kepsekName, kepsekNip, isDummyKepsek, '33.33%')}
          ${makeCell('Wakil Kepala Sekolah,', wakasek?.jabatan || 'Wakil Kepala Sekolah', wakasekName, wakasekNip, isDummyWakasek, '33.33%')}
          ${makeCell(docDate, operatorTitle, operatorName, operatorNip, isDummyOperator, '33.33%')}
        </tr>
      </table>
    `;
  }

  if (layoutMode === '3_col') {
    return `
      <table class="signatures">
        <tr>
          ${makeCell('Mengetahui / Mengesahkan,', kepsek?.jabatan || 'Kepala Sekolah', kepsekName, kepsekNip, isDummyKepsek, '33.33%')}
          ${makeCell('Menyetujui,', 'Kasubag Tata Usaha', kasubagName, kasubagNip, isDummyTu, '33.33%')}
          ${makeCell(docDate, operatorTitle, operatorName, operatorNip, isDummyOperator, '33.33%')}
        </tr>
      </table>
    `;
  }

  if (layoutMode === '4_col_hierarchy') {
    return `
      <table class="signatures">
        <tr>
          ${makeCell('Mengetahui / Mengesahkan,', kepsek?.jabatan || 'Kepala Sekolah', kepsekName, kepsekNip, isDummyKepsek, '50%')}
          ${makeCell(`${docDate}<br/>Wakil Kepala Sekolah,`, wakasek?.jabatan || 'Wakil Kepala Sekolah', wakasekName, wakasekNip, isDummyWakasek, '50%')}
        </tr>
        <tr>
          ${makeCell('Menyetujui,', 'Kasubag Tata Usaha', kasubagName, kasubagNip, isDummyTu, '50%')}
          ${makeCell('Yang Membuat Laporan,', operatorTitle, operatorName, operatorNip, isDummyOperator, '50%')}
        </tr>
      </table>
    `;
  }

  return `
    <table class="signatures">
      <tr>
        ${makeCell('Mengetahui / Mengesahkan,', kepsek?.jabatan || 'Kepala Sekolah', kepsekName, kepsekNip, isDummyKepsek)}
        ${makeCell(docDate, operatorTitle, operatorName, operatorNip, isDummyOperator)}
      </tr>
    </table>
  `;
}

/**
 * 1. GENERATOR DOKUMEN WORD (.DOC) UNTUK LAPOR BULANAN & LAPOR TAHUNAN (1:1 WEB UI)
 */
export function generateOfficialDocumentWord(params: WordExportParams): string {
  const {
    reportType,
    reportData,
    schoolConfig,
    tasks,
    inventories,
    tupoksiDefinitions,
    manualDate,
    nomorSurat,
    monthlyReports = [],
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

  const operator = schoolConfig.operatorProfiles[role] || {
    nama: '',
    nip: '',
    jabatan: `Operator Layanan Operasional ${roleTitle}`
  };

  const targetMonth = monthlyData?.month || 9;
  const targetYear = isMonthly ? (monthlyData?.year || 2026) : (annualData?.year || 2026);

  const periodLabel = isMonthly
    ? `Bulan ${MONTH_NAMES[targetMonth - 1]} Tahun ${targetYear}`
    : `Tahun Anggaran ${targetYear}`;

  const defaultNoSurat = isMonthly
    ? `800 / LAP-BLN / ${targetMonth} / ${schoolConfig.npsn || '20202819'} / ${targetYear}`
    : `800 / LAP-THN / ${targetYear} / ${schoolConfig.npsn || '20202819'}`;
  const noSurat = nomorSurat && nomorSurat.trim() ? nomorSurat.trim() : defaultNoSurat;

  const placeName = [schoolConfig.kabupatenKota, schoolConfig.desaKecamatan].filter(Boolean)[0] || 'Sekolah';
  const defaultSignDate = manualDate && manualDate.trim()
    ? manualDate.trim()
    : isMonthly
    ? `${placeName}, ${new Date(targetYear, targetMonth, 0).getDate()} ${MONTH_NAMES[targetMonth - 1]} ${targetYear}`
    : `${placeName}, 31 Desember ${targetYear}`;

  // Filter Tasks Strictly for this Role
  const relevantTasks = tasks.filter(t => {
    if (!t.role || t.role.trim().toUpperCase() !== role.trim().toUpperCase()) return false;
    return isMonthly ? isTaskInMonth(t.date, targetMonth, targetYear) : isTaskInYear(t.date, targetYear);
  });

  // Filter Inventories Strictly for this Role
  const roleInventories = inventories.filter(inv => inv.role && inv.role.trim().toUpperCase() === role.trim().toUpperCase());

  const tupoksiTasks = relevantTasks.filter(t => getTaskClassification(role, t.category, t.taskType) === 'pokok');
  const tambahanTasks = relevantTasks.filter(t => getTaskClassification(role, t.category, t.taskType) === 'tambahan');
  const tupoksiCompleted = tupoksiTasks.filter(t => t.status === 'selesai').length;
  const tambahanCompleted = tambahanTasks.filter(t => t.status === 'selesai').length;
  const completedCount = relevantTasks.filter(t => t.status === 'selesai').length;
  const completionRate = relevantTasks.length > 0 ? Math.round((completedCount / relevantTasks.length) * 100) : 100;

  const roleTupoksiList = tupoksiDefinitions?.[role]?.tupoksiList || OFFICIAL_TUPOKSI_DEFINITIONS[role]?.tupoksiList || [];
  const roleTambahanList = tupoksiDefinitions?.[role]?.tugasTambahanList || OFFICIAL_TUPOKSI_DEFINITIONS[role]?.tugasTambahanList || [];

  const isDummyOperator = !operator?.nama || /nurul(\s*hidayat|\s*hidayati)?/i.test(operator.nama) || /rahmat(\s*hidayat)?/i.test(operator.nama) || operator.nama.trim() === '';
  const operatorName = isDummyOperator ? '( .................................................. )' : formatOfficialNameWithDegree(operator.nama);
  const operatorNipFormatted = isDummyOperator || !operator?.nip || /19920815\s*202321\s*2\s*024/.test(operator.nip)
    ? (operator?.nip && !/19920815\s*202321\s*2\s*024/.test(operator.nip)
        ? formatOfficialNipOrPppk(operator.nip, { defaultPrefix: 'NIP.' })
        : 'NIP / NIPPK. .................................................')
    : formatOfficialNipOrPppk(operator.nip, { defaultPrefix: 'NIP.' });

  // Khusus Layanan Perpustakaan Data Isolasi + Gender Breakdown + Monthly Additions
  const isPerpus = role === 'PERPUS';
  const memberRecap = computeLibraryMemberRecap(libraryMembers, libraryMemberStats);
  const guruL = memberRecap.guruLaki;
  const guruP = memberRecap.guruPerempuan;
  const guruCount = memberRecap.totalGuru;

  const staffL = memberRecap.staffLaki;
  const staffP = memberRecap.staffPerempuan;
  const staffCount = memberRecap.totalStaff;

  const siswaLCount = memberRecap.siswaLaki;
  const siswaPCount = memberRecap.siswaPerempuan;
  const totalAnggotaPerpus = memberRecap.grandTotal;

  const monthlyAddBreakdown = isPerpus && isMonthly
    ? computeMonthlyMemberAdditions(libraryMembers, targetYear, targetMonth)
    : null;

  const monthlyNewMembers = isPerpus
    ? (isMonthly
        ? (monthlyAddBreakdown?.members || [])
        : libraryMembers.filter(m => (m.tanggalBergabung || m.tanggalTerdaftar || '').trim().startsWith(String(targetYear))))
    : [];

  const perpusBooks = isMonthly && monthlyData
    ? computeMonthlyBookAdditions(libraryBooks, targetYear, targetMonth).books
    : libraryBooks;

  const kpiItems = (isMonthly && monthlyData?.customKPIs && monthlyData.customKPIs.length > 0)
    ? monthlyData.customKPIs
    : (ROLE_OPERATIONAL_SPECS[role]?.operationalKPIs || []);

  const annualPerf = !isMonthly
    ? calculateAnnualPerformanceSummary(tasks, role, targetYear, {
        monthlyReports,
        libraryBooks,
        libraryMembers
      })
    : null;

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${isMonthly ? 'Laporan Bulanan' : 'Laporan Tahunan'} - ${roleTitle} - ${schoolConfig.namaSekolah}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 210mm 297mm;
          margin: 3.0cm 3.0cm 3.0cm 4.0cm;
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.15;
          color: #000000;
        }
        p { margin-top: 0; margin-bottom: 6pt; line-height: 1.15; }
        .title {
          font-size: 16pt;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          margin-top: 4pt;
          margin-bottom: 2pt;
          line-height: 1.15;
        }
        .subtitle {
          font-size: 14pt;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          margin-bottom: 2pt;
        }
        .nomor-surat {
          font-size: 10.5pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 10pt;
        }
        .section-header {
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 10pt;
          margin-bottom: 6pt;
          border-bottom: 1px solid #000000;
          padding-bottom: 2pt;
        }
        table.meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10pt;
          font-size: 11pt;
          border: 1px solid #94a3b8;
          background-color: #f8fafc;
        }
        table.meta-table td {
          padding: 3px 6px;
          vertical-align: top;
        }
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 4pt;
          margin-bottom: 10pt;
          font-size: 9.5pt;
        }
        table.data-table th, table.data-table td {
          border: 1px solid #000000;
          padding: 4px 5px;
          vertical-align: middle;
        }
        table.data-table th {
          background-color: #f1f5f9;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
        }
        table.signatures {
          width: 100%;
          border-collapse: collapse;
          margin-top: 18pt;
          page-break-inside: avoid;
        }
        table.signatures td {
          width: 50%;
          text-align: center;
          vertical-align: top;
          padding: 0 10px;
          font-size: 11pt;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        <!-- KOP SURAT 3 KOLOM -->
        ${generateWordKopSurat(schoolConfig)}

        <!-- JUDUL LAPORAN RESMI -->
        <div class="title">
          ${isMonthly ? 'LAPORAN BULANAN KINERJA OPERATOR LAYANAN OPERASIONAL' : 'LAPORAN TAHUNAN KINERJA OPERATOR LAYANAN OPERASIONAL'}
        </div>
        <div class="subtitle">
          BIDANG: ${roleTitle.toUpperCase()}
        </div>
        <div class="nomor-surat">
          Nomor: ${noSurat} &middot; Periode: ${periodLabel}
        </div>

        <!-- IDENTITAS PETUGAS PELAKSANA -->
        <table class="meta-table">
          <tr>
            <td style="width: 170px; font-weight: bold;">Nama Petugas Pelaksana</td>
            <td style="width: 10px;">:</td>
            <td><b>${operatorName}</b></td>
          </tr>
          <tr>
            <td style="font-weight: bold;">NIP / NIPPK</td>
            <td>:</td>
            <td>${operatorNipFormatted}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Jabatan Kedinasan</td>
            <td>:</td>
            <td>${operator.jabatan || roleTitle}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Satuan Pendidikan</td>
            <td>:</td>
            <td>${schoolConfig.namaSekolah}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Capaian Kinerja</td>
            <td>:</td>
            <td><b>${completedCount} / ${relevantTasks.length} Tugas Tuntas (${completionRate}%)</b> (${tupoksiTasks.length} Pokok, ${tambahanTasks.length} Tambahan)</td>
          </tr>
        </table>

        <!-- BAGIAN I: RINGKASAN EKSEKUTIF, CAPAIAN, KENDALA & SOLUSI -->
        <div class="section-header">
          I. RINGKASAN EKSEKUTIF KINERJA & CAPAIAN TARGET OPERASIONAL (${roleTitle.toUpperCase()})
        </div>
        <p style="text-align: justify; text-indent: 24pt;">${reportData.summary || '-'}</p>

        <div style="font-weight: bold; margin-bottom: 3pt; font-size: 10.5pt;">
          Rincian Capaian Indikator Kinerja yang Terlaksana (${roleTitle}):
        </div>
        <ol style="margin-top: 2pt; margin-bottom: 6pt; padding-left: 18pt; font-size: 10.5pt;">
          ${((isMonthly ? monthlyData?.achievements : annualData?.annualMilestones) || ['Tugas operasional terlaksana sesuai sasaran kerja.']).map(item => `<li>${item}</li>`).join('')}
        </ol>

        ${((isMonthly && monthlyData?.obstacles?.length) || (!isMonthly && annualData?.obstacles?.length)) ? `
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 50%; text-align: left;">${isMonthly ? 'Kendala / Hambatan di Lapangan' : 'Evaluasi Kendala Lapangan Terakumulasi'}</th>
              <th style="width: 50%; text-align: left;">Solusi &amp; Upaya Pemecahan Masalah</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="vertical-align: top;">
                <ul style="margin: 0; padding-left: 14pt;">
                  ${((isMonthly ? monthlyData?.obstacles : annualData?.obstacles) || []).map(o => `<li>${o}</li>`).join('')}
                </ul>
              </td>
              <td style="vertical-align: top;">
                <ul style="margin: 0; padding-left: 14pt;">
                  ${((isMonthly ? monthlyData?.solutions : annualData?.solutions) || ['Koordinasi berkala bersama pimpinan sekolah berjalan optimal.']).map(s => `<li>${s}</li>`).join('')}
                </ul>
              </td>
            </tr>
          </tbody>
        </table>` : ''}

        ${!isMonthly && annualData?.strategicRecommendations?.length ? `
        <div style="font-weight: bold; margin-bottom: 3pt; font-size: 10.5pt;">Rekomendasi Rencana Strategis &amp; Kebutuhan Operasional:</div>
        <ul style="margin-top: 2pt; margin-bottom: 6pt; padding-left: 18pt; font-size: 10.5pt;">
          ${annualData.strategicRecommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>` : ''}

        <!-- BAGIAN II: STANDAR TUPOKSI & MATRIKS KPI -->
        <div class="section-header">
          II. STANDAR TUGAS POKOK (TUPOKSI), TUGAS TAMBAHAN &amp; MATRIKS KPI
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 50%; text-align: left;">A. Tugas Pokok (Tupoksi Standar) — (${tupoksiCompleted}/${tupoksiTasks.length} Tuntas)</th>
              <th style="width: 50%; text-align: left;">B. Tugas Tambahan &amp; Insidental — (${tambahanCompleted}/${tambahanTasks.length} Tuntas)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="vertical-align: top;">
                <ul style="margin: 0; padding-left: 14pt;">
                  ${roleTupoksiList.map(i => `<li>${i}</li>`).join('')}
                </ul>
              </td>
              <td style="vertical-align: top;">
                <ul style="margin: 0; padding-left: 14pt;">
                  ${roleTambahanList.map(i => `<li>${i}</li>`).join('')}
                </ul>
              </td>
            </tr>
          </tbody>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 65px;">Kode</th>
              <th>Indikator Kinerja Kunci (KPI)</th>
              <th style="width: 110px;">Target Kerja</th>
              <th style="width: 130px;">Realisasi Lapangan</th>
              <th style="width: 65px;">Satuan</th>
              <th style="width: 70px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${kpiItems.length > 0 ? kpiItems.map((kpi: any, idx: number) => `
              <tr>
                <td style="text-align: center; font-family: monospace; font-weight: bold;">${kpi.code || `KPI-0${idx + 1}`}</td>
                <td><b>${kpi.name}</b></td>
                <td>${kpi.target}</td>
                <td style="font-weight: bold;">${kpi.realization}</td>
                <td style="text-align: center;">${kpi.unit || '-'}</td>
                <td style="text-align: center; font-weight: bold; color: ${kpi.status === 'tercapai' ? '#15803d' : '#b45309'};">
                  ${kpi.status === 'tercapai' ? 'Tercapai' : 'Proses'}
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td style="text-align: center; font-family: monospace;">KPI-01</td>
                <td>Pelaksanaan Tugas Pokok Operasional ${roleTitle}</td>
                <td>100%</td>
                <td style="font-weight: bold;">${completionRate}%</td>
                <td style="text-align: center;">Persen</td>
                <td style="text-align: center; font-weight: bold; color: #15803d;">Tercapai</td>
              </tr>
            `}
          </tbody>
        </table>

        ${isPerpus ? `
        <!-- BAGIAN III (KHUSUS PERPUS): REKAPITULASI ANGGOTA PERPUSTAKAAN -->
        <div class="section-header">
          III. DATA REKAPITULASI ANGGOTA PERPUSTAKAAN (PEMUSTAKA SEKOLAH)
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Guru (Pendidik)</th>
              <th>Tenaga Kependidikan (Staff/TU)</th>
              <th>Siswa Laki-laki</th>
              <th>Siswa Perempuan</th>
              <th>Total Seluruh Anggota</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center; font-weight: bold;">${guruCount} orang<br><small style="font-weight: normal;">(L: ${guruL}, P: ${guruP})</small></td>
              <td style="text-align: center; font-weight: bold;">${staffCount} orang<br><small style="font-weight: normal;">(L: ${staffL}, P: ${staffP})</small></td>
              <td style="text-align: center; font-weight: bold;">${siswaLCount} orang</td>
              <td style="text-align: center; font-weight: bold;">${siswaPCount} orang</td>
              <td style="text-align: center; font-weight: bold; color: #1e3a8a;">${totalAnggotaPerpus} orang</td>
            </tr>
          </tbody>
        </table>

        ${(monthlyNewMembers.length > 0 || isMonthly) ? `
          <div style="font-weight: bold; font-size: 10pt; margin: 6pt 0 3pt 0;">
            ${isMonthly
              ? `Rekapitulasi Penambahan Anggota Baru Bulan ${MONTH_NAMES[targetMonth - 1]} ${targetYear} (${monthlyNewMembers.length} Orang — Pendidik L:${monthlyAddBreakdown?.guruLaki || 0}/P:${monthlyAddBreakdown?.guruPerempuan || 0}, Tendik L:${monthlyAddBreakdown?.staffLaki || 0}/P:${monthlyAddBreakdown?.staffPerempuan || 0}, Siswa L:${monthlyAddBreakdown?.siswaLaki || 0}/P:${monthlyAddBreakdown?.siswaPerempuan || 0}):`
              : `Rekapitulasi Penambahan Anggota Baru Tahun ${targetYear} (${monthlyNewMembers.length} Orang — L:${annualPerf?.totalMembersAddedL || 0}, P:${annualPerf?.totalMembersAddedP || 0}):`
            }
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px;">No</th>
                <th style="width: 85px;">No. Anggota</th>
                <th>Nama Lengkap</th>
                <th style="width: 85px;">Kategori</th>
                <th style="width: 90px;">Kelas / Jabatan</th>
                <th style="width: 35px;">L/P</th>
                <th style="width: 85px;">Tgl Terdaftar</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyNewMembers.length > 0 ? monthlyNewMembers.map((m, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td style="text-align: center; font-family: monospace;">${m.nomorAnggota || '-'}</td>
                  <td><b>${m.nama}</b></td>
                  <td style="text-align: center;">${m.tipeAnggota === 'GURU' ? 'Pendidik' : m.tipeAnggota === 'STAFF' ? 'Tendik' : 'Siswa'}</td>
                  <td>${m.kelasAtauJabatan || '-'}</td>
                  <td style="text-align: center; font-weight: bold;">${m.jenisKelamin || 'L'}</td>
                  <td style="text-align: center;">${m.tanggalBergabung || m.tanggalTerdaftar || '-'}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="7" style="text-align: center; color: #64748b; padding: 6px;">
                    Tidak terdapat penambahan anggota baru pada bulan ${MONTH_NAMES[targetMonth - 1]} ${targetYear}.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        ` : ''}
        ` : ''}

        <!-- REKAPITULASI TUGAS: TAHUNAN (MATRIKS 12 BULAN) vs BULANAN (8-KOLOM HARIAN) -->
        ${!isMonthly && annualPerf ? `
          <div class="section-header">
            ${isPerpus ? 'IV.' : 'III.'} REKAPITULASI &amp; PERSENTASE KINERJA OPERASIONAL PER BULAN (TUGAS POKOK &amp; TUGAS TAMBAHAN)
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px;">No</th>
                <th style="width: 80px;">Bulan</th>
                <th>Realisasi Tugas Pokok &amp; Volume Hasil</th>
                <th>Realisasi Tugas Tambahan &amp; Volume Hasil</th>
                <th style="width: 55px;">Kegiatan</th>
                <th style="width: 50px;">Tuntas</th>
                <th style="width: 60px;">Capaian</th>
              </tr>
            </thead>
            <tbody>
              ${annualPerf.items.map((item, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><b>${item.monthName}</b></td>
                  <td>${item.tupoksiSummary}</td>
                  <td>${item.tambahanSummary}</td>
                  <td style="text-align: center;">${item.totalTasks}</td>
                  <td style="text-align: center; font-weight: bold; color: #15803d;">${item.completedTasks}</td>
                  <td style="text-align: center; font-weight: bold; color: #15803d;">${item.percentage}%</td>
                </tr>
              `).join('')}
              <tr style="background-color: #e2e8f0; font-weight: bold;">
                <td colspan="2" style="text-align: center;">TOTAL TAHUNAN</td>
                <td>Total ${annualPerf.totalTupoksi} Kegiatan Tugas Pokok Terlaksana</td>
                <td>Total ${annualPerf.totalTambahan} Kegiatan Tugas Tambahan Terlaksana</td>
                <td style="text-align: center;">${annualPerf.totalTasks}</td>
                <td style="text-align: center; color: #15803d;">${annualPerf.totalCompleted}</td>
                <td style="text-align: center; color: #15803d;">${annualPerf.averagePercentage.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        ` : `
          <div class="section-header">
            ${isPerpus ? 'IV.' : 'III.'} REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL YANG DILAKSANAKAN
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px;">No</th>
                <th style="width: 75px;">Tanggal</th>
                <th style="width: 75px;">Klasifikasi</th>
                <th>Uraian Tugas Kedinasan</th>
                <th style="width: 85px;">Lokasi</th>
                <th style="width: 75px;">Waktu</th>
                <th style="width: 70px;">Volume</th>
                <th style="width: 65px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${relevantTasks.length > 0 ? relevantTasks.map((t, idx) => {
                const isPokok = getTaskClassification(role, t.category, t.taskType) === 'pokok';
                return `
                  <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td style="text-align: center;">${t.date}</td>
                    <td style="text-align: center; font-weight: bold; color: ${isPokok ? '#1e40af' : '#b45309'};">
                      ${isPokok ? 'Tugas Pokok' : 'Tambahan'}
                    </td>
                    <td>
                      <b>${t.title}</b>
                      ${t.description ? `<br><small style="color: #475569;">${t.description}</small>` : ''}
                    </td>
                    <td>${t.location || 'Lingkungan Sekolah'}</td>
                    <td style="text-align: center; font-family: monospace;">${t.timeStart || '07.00'} - ${t.timeEnd || '08.00'}</td>
                    <td style="text-align: center;">${t.volumeUnit || '1 keg.'}</td>
                    <td style="text-align: center; font-weight: bold; color: ${t.status === 'selesai' ? '#15803d' : '#b45309'};">
                      ${t.status === 'selesai' ? 'Tuntas 100%' : 'Terlaksana'}
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="8" style="text-align: center; padding: 10px; color: #64748b;">
                    Belum ada log tugas operasional tercatat pada periode ini.
                  </td>
                </tr>
              `}
              ${relevantTasks.length > 0 ? `
                <tr style="background-color: #f1f5f9; font-weight: bold;">
                  <td colspan="3" style="text-align: center;">TOTAL REKAPITULASI</td>
                  <td colspan="4">${relevantTasks.length} Tugas Operasional (${tupoksiTasks.length} Tugas Pokok / ${tambahanTasks.length} Tugas Tambahan)</td>
                  <td style="text-align: center; color: #15803d;">${completedCount}/${relevantTasks.length} Tuntas (${completionRate}%)</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        `}

        ${isPerpus ? `
          <div class="section-header">
            ${isMonthly
              ? `LAMPIRAN PENAMBAHAN BUKU BARU BULAN ${MONTH_NAMES[targetMonth - 1].toUpperCase()} ${targetYear}`
              : `LAMPIRAN KATALOG SELURUH DATA BUKU PERPUSTAKAAN TERDATA`
            }
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px;">No</th>
                <th>Judul Bahan Pustaka</th>
                <th>Pengarang / Penerbit</th>
                <th style="width: 75px;">Kelas</th>
                <th style="width: 75px;">DDC / Kategori</th>
                <th style="width: 85px;">${isMonthly ? 'Tgl Masuk' : 'Tahun Beli'}</th>
                <th style="width: 60px;">Jml</th>
              </tr>
            </thead>
            <tbody>
              ${perpusBooks.length > 0 ? perpusBooks.map((b, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><b>${b.judul}</b></td>
                  <td>${b.pengarang || b.penulis || '-'} ${b.penerbit ? `(${b.penerbit})` : ''}</td>
                  <td style="text-align: center;">${b.kelas || '-'}</td>
                  <td style="text-align: center;">${b.ddcKlasifikasi || b.ddc || '-'} / ${b.statusBuku || b.kategori || 'Umum'}</td>
                  <td style="text-align: center;">${isMonthly ? (b.tanggalMasuk || '-') : (b.tahunBeli || b.tahunPengadaan || '-')}</td>
                  <td style="text-align: center; font-weight: bold;">${b.jumlah || 1} eks</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 8px; color: #64748b;">
                    ${isMonthly ? 'Pada bulan berjalan tidak terdapat penambahan buku baru yang masuk / dibeli.' : 'Belum ada data buku yang terdaftar.'}
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        ` : ''}

        <!-- DAFTAR SARANA & PRASARANA OPERASIONAL -->
        <div class="section-header">
          ${isPerpus ? 'V.' : 'IV.'} DAFTAR SARANA &amp; PRASARANA OPERASIONAL (${roleTitle.toUpperCase()})
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th style="width: 85px;">Kode Barang</th>
              <th>Nama Sarana / Prasarana</th>
              <th>Lokasi / Ruang</th>
              <th style="width: 70px;">Jumlah</th>
              <th style="width: 80px;">Kondisi</th>
            </tr>
          </thead>
          <tbody>
            ${roleInventories.length > 0 ? roleInventories.map((inv, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center; font-family: monospace;">${inv.kodeBarang || '-'}</td>
                <td><b>${inv.namaBarang}</b>${inv.merkModel ? `<br><small style="color:#475569;">${inv.merkModel}</small>` : ''}</td>
                <td>${inv.lokasiPenyimpanan || '-'}</td>
                <td style="text-align: center; font-weight: bold;">${inv.jumlah} ${inv.satuan || 'Unit'}</td>
                <td style="text-align: center;">${inv.kondisi || 'Baik'}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="6" style="text-align: center; padding: 8px; color: #64748b;">
                  Data sarana prasarana operasional unit ${roleTitle} terdata dalam kondisi baik dan terpelihara.
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- LEMBAR PENGESAHAN RESMI DINAS -->
        ${renderWordSignatureBlock({
          schoolConfig,
          role,
          operatorTitle: role === 'PERPUS' ? 'Pengelola Perpustakaan' : `Operator ${roleTitle}`,
          docDate: defaultSignDate
        })}
      </div>
    </body>
    </html>
  `;
}

/**
 * 2. GENERATOR DOKUMEN WORD (.DOC) UNTUK REKAP ANGGOTA PERPUSTAKAAN (TERMASUK PENAMBAHAN BULANAN)
 */
export function generateLibraryMemberReportWord(params: LibraryMemberWordParams): string {
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

  const regGuruL = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'GURU' && m.jenisKelamin === 'L').length;
  const regGuruP = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'GURU' && m.jenisKelamin === 'P').length;
  const regStaffL = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'STAFF' && m.jenisKelamin === 'L').length;
  const regStaffP = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'STAFF' && m.jenisKelamin === 'P').length;

  const guruL = memberStats.guruLaki ?? regGuruL;
  const guruP = memberStats.guruPerempuan ?? regGuruP;
  const staffL = memberStats.staffLaki ?? regStaffL;
  const staffP = memberStats.staffPerempuan ?? regStaffP;
  const siswaL = memberStats.lakiCount - guruL - staffL >= 0 ? Math.max(0, memberStats.lakiCount - guruL - staffL) : memberStats.lakiCount;
  const siswaP = memberStats.perempuanCount - guruP - staffP >= 0 ? Math.max(0, memberStats.perempuanCount - guruP - staffP) : memberStats.perempuanCount;

  const currentYear = new Date().getFullYear();
  const tahunAjaran = `${currentYear} / ${currentYear + 1}`;
  const defaultDate = manualDate && manualDate.trim()
    ? manualDate.trim()
    : `${schoolConfig.kabupatenKota || 'Sekolah'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const hasMonthFilter = additionMonth !== 'all' && typeof additionMonth === 'number';
  const addedInMonth = hasMonthFilter
    ? libraryMembers.filter(m => isMemberJoinedInMonth(m, additionYear, additionMonth))
    : [];
  const monthLabel = hasMonthFilter ? `${MONTH_NAMES[additionMonth - 1]} ${additionYear}` : '';

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Laporan Rekapitulasi Anggota Perpustakaan - ${schoolConfig.namaSekolah}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 210mm 297mm;
          margin: 3.0cm 3.0cm 3.0cm 4.0cm;
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.15;
          color: #000000;
        }
        .title {
          font-size: 16pt;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          text-decoration: underline;
          margin-top: 6pt;
        }
        .nomor {
          font-size: 11pt;
          font-weight: bold;
          text-align: center;
          margin-top: 3pt;
        }
        .subtitle {
          font-size: 10.5pt;
          text-align: center;
          margin-bottom: 12pt;
        }
        .section-header {
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 12pt;
          margin-bottom: 6pt;
          border-bottom: 1px solid #000000;
          padding-bottom: 2pt;
        }
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12pt;
          font-size: 9.5pt;
        }
        table.data-table th, table.data-table td {
          border: 1px solid #000000;
          padding: 4px 6px;
          vertical-align: middle;
        }
        table.data-table th {
          background-color: #f1f5f9;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
        }
        table.signatures {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20pt;
          page-break-inside: avoid;
        }
        table.signatures td {
          width: 50%;
          text-align: center;
          vertical-align: top;
          padding: 0 10px;
          font-size: 11pt;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        ${generateWordKopSurat(schoolConfig)}

        <div class="title">
          LAPORAN REKAPITULASI JUMLAH &amp; DATA ANGGOTA PERPUSTAKAAN SEKOLAH
        </div>
        <div class="nomor">Nomor: ${nomorDokumen}</div>
        <div class="subtitle">Tahun Ajaran ${tahunAjaran}</div>

        <div class="section-header">I. REKAPITULASI JUMLAH ANGGOTA PEMUSTAKA SEKOLAH</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 35px;">No</th>
              <th>Klasifikasi Pemustaka</th>
              <th style="width: 90px;">Laki-laki (L)</th>
              <th style="width: 90px;">Perempuan (P)</th>
              <th style="width: 100px;">Total Anggota</th>
              <th style="width: 80px;">Rasio</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center; font-weight: bold;">1</td>
              <td><b>Pendidik (Guru Sekolah)</b></td>
              <td style="text-align: center;">${guruL} orang</td>
              <td style="text-align: center;">${guruP} orang</td>
              <td style="text-align: center; font-weight: bold;">${memberStats.guruCount} orang</td>
              <td style="text-align: center;">${memberStats.total > 0 ? ((memberStats.guruCount / memberStats.total) * 100).toFixed(1) : '0.0'}%</td>
            </tr>
            <tr>
              <td style="text-align: center; font-weight: bold;">2</td>
              <td><b>Tenaga Kependidikan (Staff / TU)</b></td>
              <td style="text-align: center;">${staffL} orang</td>
              <td style="text-align: center;">${staffP} orang</td>
              <td style="text-align: center; font-weight: bold;">${memberStats.staffCount} orang</td>
              <td style="text-align: center;">${memberStats.total > 0 ? ((memberStats.staffCount / memberStats.total) * 100).toFixed(1) : '0.0'}%</td>
            </tr>
            <tr>
              <td style="text-align: center; font-weight: bold;">3</td>
              <td><b>Peserta Didik (Siswa / Siswi)</b></td>
              <td style="text-align: center;">${siswaL} orang</td>
              <td style="text-align: center;">${siswaP} orang</td>
              <td style="text-align: center; font-weight: bold;">${memberStats.siswaCount} orang</td>
              <td style="text-align: center;">${memberStats.total > 0 ? ((memberStats.siswaCount / memberStats.total) * 100).toFixed(1) : '0.0'}%</td>
            </tr>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td colspan="4" style="text-align: right; padding-right: 10px;">TOTAL KESELURUHAN PEMUSTAKA TERDAFTAR:</td>
              <td style="text-align: center; color: #1e3a8a;">${memberStats.total} Orang</td>
              <td style="text-align: center; color: #1e3a8a;">100%</td>
            </tr>
          </tbody>
        </table>

        ${hasMonthFilter ? `
          <div class="section-header">II. REKAPITULASI PENAMBAHAN ANGGOTA BARU BULAN ${monthLabel.toUpperCase()}</div>
          ${(() => {
            const mAdd = computeMonthlyMemberAdditions(libraryMembers, additionYear, additionMonth as number);
            return `
              <p style="font-size: 10pt; font-weight: bold; margin-bottom: 4pt;">
                Penambahan Bulan ${monthLabel}: ${mAdd.total} Anggota Baru
                (Pendidik/Guru: ${mAdd.guruTotal} [L:${mAdd.guruLaki}, P:${mAdd.guruPerempuan}] &middot;
                Tendik/Staff: ${mAdd.staffTotal} [L:${mAdd.staffLaki}, P:${mAdd.staffPerempuan}] &middot;
                Siswa: ${mAdd.siswaTotal} [L:${mAdd.siswaLaki}, P:${mAdd.siswaPerempuan}])
              </p>
            `;
          })()}
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 28px;">No</th>
                <th style="width: 85px;">No. Anggota</th>
                <th>Nama Lengkap Pemustaka Baru</th>
                <th style="width: 90px;">Kategori</th>
                <th style="width: 95px;">Kelas / Jabatan</th>
                <th style="width: 35px;">L/P</th>
                <th style="width: 95px;">Tgl Terdaftar</th>
              </tr>
            </thead>
            <tbody>
              ${addedInMonth.length > 0 ? addedInMonth.map((m, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td style="text-align: center; font-family: monospace;">${m.nomorAnggota || '-'}</td>
                  <td><b>${m.nama}</b></td>
                  <td style="text-align: center;">${m.tipeAnggota === 'GURU' ? 'Pendidik' : m.tipeAnggota === 'STAFF' ? 'Tendik' : 'Siswa'}</td>
                  <td>${m.kelasAtauJabatan || '-'}</td>
                  <td style="text-align: center; font-weight: bold;">${m.jenisKelamin || 'L'}</td>
                  <td style="text-align: center;">${m.tanggalBergabung || m.tanggalTerdaftar || '-'}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="7" style="text-align: center; color: #64748b; padding: 8px;">
                    Pada bulan ${monthLabel} tidak terdapat penambahan anggota perpustakaan baru.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        ` : ''}

        ${includeFullList && libraryMembers.length > 0 ? `
          <div class="section-header">
            ${hasMonthFilter ? 'III.' : 'II.'} DAFTAR KESELURUHAN ANGGOTA PERPUSTAKAAN SEKOLAH (${libraryMembers.length} PEMUSTAKA)
          </div>
          <table class="data-table" style="font-size: 8.5pt;">
            <thead>
              <tr>
                <th style="width: 25px;">No</th>
                <th style="width: 80px;">No. Anggota</th>
                <th>Nama Lengkap</th>
                <th style="width: 95px;">Kategori</th>
                <th style="width: 85px;">Kelas / Jabatan</th>
                <th style="width: 35px;">L/P</th>
                <th style="width: 105px;">No. Identitas</th>
                <th style="width: 65px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${libraryMembers.map((m, idx) => {
                const typeLabel = m.tipeAnggota === 'GURU' ? 'Pendidik' : m.tipeAnggota === 'STAFF' ? 'Tenaga Kependidikan' : 'Siswa';
                const statusLower = (m.status || 'aktif').toLowerCase();
                const statusLabel = statusLower === 'aktif' ? 'Aktif' : (statusLower === 'tamat' || statusLower === 'alumni') ? 'Alumni' : 'Nonaktif';
                return `
                  <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td style="text-align: center; font-family: monospace;">${m.nomorAnggota || '-'}</td>
                    <td><b>${m.nama}</b></td>
                    <td>${typeLabel}</td>
                    <td>${m.kelasAtauJabatan || '-'}</td>
                    <td style="text-align: center; font-weight: bold;">${m.jenisKelamin || 'L'}</td>
                    <td style="font-family: monospace;">${m.nomorIdentitas || '-'}</td>
                    <td style="text-align: center; font-weight: bold; color: ${statusLabel === 'Aktif' ? '#15803d' : '#64748b'};">
                      ${statusLabel}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : ''}

        <p style="text-align: justify; text-indent: 24pt; margin-top: 8pt;">
          Demikian laporan rekapitulasi data keanggotaan perpustakaan sekolah ini disusun dan disahkan dengan sebenar-benarnya sebagai wujud tertib administrasi dan keterbukaan layanan pemustaka di lingkungan satuan pendidikan.
        </p>

        ${renderWordSignatureBlock({
          schoolConfig,
          role: 'PERPUS',
          operatorTitle: 'Pengelola Perpustakaan',
          docDate: defaultDate
        })}
      </div>
    </body>
    </html>
  `;
}

/**
 * 3. GENERATOR DOKUMEN WORD (.DOC) UNTUK BUKU INDUK INVENTARIS SARPRAS (KIR) — SERAGAM 5 LAYANAN
 */
export function generateInventoryKirWord(params: InventoryKirWordParams): string {
  const { schoolConfig, role, roleTitle, inventories, manualDate } = params;
  const roleInventories = inventories.filter(inv => inv.role && inv.role.trim().toUpperCase() === role.trim().toUpperCase());

  const placeName = [schoolConfig.kabupatenKota, schoolConfig.desaKecamatan].filter(Boolean)[0] || 'Sekolah';
  const defaultDate = manualDate && manualDate.trim()
    ? manualDate.trim()
    : `${placeName}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const totalUnits = roleInventories.reduce((s, i) => s + (Number(i.jumlah) || 1), 0);
  const countBaik = roleInventories.filter(i => i.kondisi === 'Baik').length;
  const countRusakRingan = roleInventories.filter(i => i.kondisi === 'Rusak Ringan').length;
  const countRusakBerat = roleInventories.filter(i => i.kondisi === 'Rusak Berat').length;

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Buku Induk Inventaris (KIR) - ${roleTitle} - ${schoolConfig.namaSekolah}</title>
      <style>
        @page Section1 {
          size: 210mm 297mm;
          margin: 3.0cm 3.0cm 3.0cm 4.0cm;
        }
        div.Section1 { page: Section1; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.15; color: #000000; }
        .title { font-size: 16pt; font-weight: bold; text-align: center; text-transform: uppercase; text-decoration: underline; margin-top: 6pt; }
        .subtitle { font-size: 13pt; font-weight: bold; text-align: center; margin-top: 3pt; margin-bottom: 12pt; }
        table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; font-size: 9.5pt; }
        table.data-table th, table.data-table td { border: 1px solid #000000; padding: 4px 6px; vertical-align: middle; }
        table.data-table th { background-color: #f1f5f9; font-weight: bold; text-align: center; text-transform: uppercase; }
        table.signatures { width: 100%; border-collapse: collapse; margin-top: 20pt; page-break-inside: avoid; }
        table.signatures td { width: 50%; text-align: center; vertical-align: top; padding: 0 10px; font-size: 11pt; }
      </style>
    </head>
    <body>
      <div class="Section1">
        ${generateWordKopSurat(schoolConfig)}
        <div class="title">BUKU INDUK INVENTARIS SARANA PRASARANA KERJA (KIR)</div>
        <div class="subtitle">Unit Kerja: ${roleTitle} &middot; ${schoolConfig.namaSekolah}</div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th style="width: 85px;">Kode Barang</th>
              <th>Nama Barang &amp; Merk / Tipe</th>
              <th style="width: 85px;">Kategori</th>
              <th style="width: 70px;">Jumlah</th>
              <th style="width: 75px;">Kondisi</th>
              <th style="width: 95px;">Lokasi Simpan</th>
              <th style="width: 55px;">Tahun</th>
            </tr>
          </thead>
          <tbody>
            ${roleInventories.length > 0 ? roleInventories.map((it, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center; font-family: monospace;">${it.kodeBarang || '-'}</td>
                <td><b>${it.namaBarang}</b><br><small style="color:#475569;">${it.merkModel || '-'}</small></td>
                <td>${it.kategori || '-'}</td>
                <td style="text-align: center; font-weight: bold;">${it.jumlah} ${it.satuan || 'Unit'}</td>
                <td style="text-align: center;">${it.kondisi || 'Baik'}</td>
                <td>${it.lokasiPenyimpanan || '-'}</td>
                <td style="text-align: center;">${it.tahunPengadaan || '-'}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="8" style="text-align: center; padding: 10px; color: #64748b;">
                  Belum ada data barang inventaris yang tercatat untuk unit kerja ini.
                </td>
              </tr>
            `}
            ${roleInventories.length > 0 ? `
              <tr style="background-color: #f1f5f9; font-weight: bold;">
                <td colspan="4" style="text-align: center;">TOTAL ASET TERDATA: ${roleInventories.length} Jenis Barang</td>
                <td style="text-align: center; color: #1e3a8a;">${totalUnits} Unit</td>
                <td colspan="3" style="text-align: center;">Baik: ${countBaik} &middot; Rusak Ringan: ${countRusakRingan} &middot; Rusak Berat: ${countRusakBerat}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        ${renderWordSignatureBlock({
          schoolConfig,
          role,
          operatorTitle: 'Petugas / Penanggung Jawab Sarpras',
          docDate: defaultDate
        })}
      </div>
    </body>
    </html>
  `;
}
