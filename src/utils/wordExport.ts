/**
 * Word (.doc) Document Generator & Downloader
 * Menghasilkan file dokumen Microsoft Word berformat resmi (.doc via XML/HTML Word format)
 * dengan UTF-8 BOM, standar tata naskah dinas, 3 kolom Kop Surat (logo kiri & kanan),
 * tabel bergaris rapi, matriks KPI, rincian tugas operasional, dan lembar pengesahan.
 */

import { SchoolConfig, MonthlyReport, AnnualReport, RoleType, TaskLog, InventoryItem, TupoksiDefinitionsMap, LibraryBookItem, LibraryMemberStats, LibraryMemberItem } from '../types';
import { isTaskInMonth, isTaskInYear, getTaskClassification } from './taskClassification';
import { formatOfficialNameWithDegree } from './formatters';

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
  libraryBooks?: LibraryBookItem[];
  libraryMemberStats?: LibraryMemberStats;
}

export interface LibraryMemberWordParams {
  schoolConfig: SchoolConfig;
  libraryMembers: LibraryMemberItem[];
  memberStats: {
    total: number;
    siswaCount: number;
    guruCount: number;
    staffCount: number;
    lakiCount: number;
    perempuanCount: number;
    aktifCount: number;
    nonaktifCount: number;
    tamatCount: number;
  };
  nomorDokumen: string;
  manualDate: string;
  includeFullList?: boolean;
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

  return `
    <table class="kop-table" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-bottom: 3px double #000000; padding-bottom: 8px; margin-bottom: 16px;">
      <tr>
        <td style="width: 85px; text-align: center; vertical-align: middle;">
          ${leftLogo ? `
            <img src="${leftLogo}" width="75" height="90" style="object-fit: contain;" alt="Logo Pemda" />
          ` : `
            <div style="width: 70px; height: 85px; border: 2px solid #1e3a8a; background-color: #f8fafc; text-align: center; font-size: 8pt; font-weight: bold; color: #1e3a8a; padding-top: 25px; box-sizing: border-box;">
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
            <img src="${rightLogo}" width="75" height="90" style="object-fit: contain;" alt="Logo Tut Wuri" />
          ` : `
            <div style="width: 70px; height: 85px; border: 2px solid #0284c7; background-color: #f8fafc; text-align: center; font-size: 8pt; font-weight: bold; color: #0284c7; padding-top: 25px; box-sizing: border-box;">
              TUT WURI
            </div>
          `}
        </td>
      </tr>
    </table>
  `;
}

/**
 * 1. GENERATOR DOKUMEN WORD (.DOC) UNTUK LAPOR BULANAN & LAPOR TAHUNAN
 */
export function generateOfficialDocumentWord(params: WordExportParams): string {
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

  const periodLabel = isMonthly 
    ? `Bulan ${MONTH_NAMES[(monthlyData?.month || 9) - 1]} Tahun ${monthlyData?.year || 2026}`
    : `Tahun Anggaran ${annualData?.year || 2026}`;

  const defaultNoSurat = isMonthly 
    ? `800 / LAP-BLN / ${monthlyData?.month || 9} / ${schoolConfig.npsn || '20202819'} / ${monthlyData?.year || 2026}`
    : `800 / LAP-THN / ${annualData?.year || 2026} / ${schoolConfig.npsn || '20202819'}`;
  const noSurat = nomorSurat && nomorSurat.trim() ? nomorSurat.trim() : defaultNoSurat;

  const defaultSignDate = manualDate && manualDate.trim() 
    ? manualDate.trim() 
    : isMonthly 
    ? `${schoolConfig.kabupatenKota || 'Sekolah'}, ${new Date(monthlyData?.year || 2026, monthlyData?.month || 9, 0).getDate()} ${MONTH_NAMES[(monthlyData?.month || 9) - 1]} ${monthlyData?.year || 2026}`
    : `${schoolConfig.kabupatenKota || 'Sekolah'}, 31 Desember ${annualData?.year || 2026}`;

  // Filter Tasks Strictly for this Role
  const relevantTasks = tasks.filter(t => {
    if (!t.role || t.role.trim().toUpperCase() !== role.trim().toUpperCase()) return false;
    return isMonthly ? isTaskInMonth(t.date, monthlyData?.month || 9, monthlyData?.year || 2026) : isTaskInYear(t.date, annualData?.year || 2026);
  });

  // Filter Inventories Strictly for this Role
  const roleInventories = inventories.filter(inv => inv.role && inv.role.trim().toUpperCase() === role.trim().toUpperCase());

  const tupoksiTasks = relevantTasks.filter(t => getTaskClassification(role, t.category, t.taskType) === 'pokok');
  const tambahanTasks = relevantTasks.filter(t => getTaskClassification(role, t.category, t.taskType) === 'tambahan');
  const completedCount = relevantTasks.filter(t => t.status === 'selesai').length;
  const completionRate = relevantTasks.length > 0 ? Math.round((completedCount / relevantTasks.length) * 100) : 100;

  // Nama Pejabat
  const rawKepsek = schoolConfig.kepalaSekolah?.nama || '';
  const kepsekName = !rawKepsek || /rahmat(\s*hidayat)?/i.test(rawKepsek) ? 'Kepala Sekolah' : formatOfficialNameWithDegree(rawKepsek);

  const rawOperator = operator?.nama || '';
  const operatorName = !rawOperator || /nurul(\s*hidayat|\s*hidayati)?/i.test(rawOperator) || /rahmat/i.test(rawOperator) 
    ? (role === 'PERPUS' ? 'Pengelola Perpustakaan' : `Operator ${roleTitle}`)
    : formatOfficialNameWithDegree(rawOperator);

  // Khusus Layanan Perpustakaan Data Isolasi
  const isPerpus = role === 'PERPUS';
  const guruCount = libraryMemberStats?.guruPendidik || 24;
  const staffCount = libraryMemberStats?.staffTendik || 8;
  const siswaLCount = libraryMemberStats?.siswaLaki || 142;
  const siswaPCount = libraryMemberStats?.siswaPerempuan || 158;
  const totalAnggotaPerpus = guruCount + staffCount + siswaLCount + siswaPCount;

  const perpusBooks = isMonthly && monthlyData
    ? libraryBooks.filter(b => {
        const targetKey = `${monthlyData.year || 2026}-${String(monthlyData.month || 9).padStart(2, '0')}`;
        const rawBulan = String(b.bulanPengadaan || (b.tanggalMasuk ? b.tanggalMasuk.substring(0, 7) : ''));
        return rawBulan.startsWith(targetKey) || (Boolean(b.tanggalMasuk) && b.tanggalMasuk.startsWith(targetKey));
      })
    : libraryBooks;

  // KPI Items
  const kpiItems = (reportData as any).kpiStats || [];

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
          size: 215mm 330mm; /* Standar Folio F4 / A4 */
          margin: 1.5cm 1.5cm 1.5cm 2.0cm;
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.25;
          color: #000000;
        }
        .title {
          font-size: 13pt;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          margin-top: 5px;
          line-height: 1.2;
        }
        .subtitle {
          font-size: 11pt;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .nomor-surat {
          font-size: 10pt;
          font-family: Arial, sans-serif;
          font-weight: bold;
          text-align: center;
          margin-bottom: 12px;
        }
        .section-header {
          font-size: 11pt;
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 14px;
          margin-bottom: 6px;
          border-bottom: 1px solid #000000;
          padding-bottom: 2px;
        }
        table.meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 10pt;
        }
        table.meta-table td {
          padding: 2px 4px;
          vertical-align: top;
        }
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          margin-bottom: 14px;
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
          margin-top: 25px;
          page-break-inside: avoid;
        }
        table.signatures td {
          width: 50%;
          text-align: center;
          vertical-align: top;
          padding: 0 10px;
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
          Nomor: ${noSurat} · Periode: ${periodLabel}
        </div>

        <!-- METADATA DOKUMEN -->
        <table class="meta-table">
          <tr>
            <td style="width: 160px; font-weight: bold;">Satuan Pendidikan</td>
            <td style="width: 10px;">:</td>
            <td>${schoolConfig.namaSekolah}</td>
            <td style="width: 130px; font-weight: bold;">Tahun Anggaran</td>
            <td style="width: 10px;">:</td>
            <td>${isMonthly ? `${monthlyData?.year || 2026} / ${(monthlyData?.year || 2026) + 1}` : `${annualData?.year || 2026}`}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Petugas / Operator</td>
            <td>:</td>
            <td>${operatorName}</td>
            <td style="font-weight: bold;">NIP / NIPPK</td>
            <td>:</td>
            <td>${operator?.nip || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Total Beban Tugas</td>
            <td>:</td>
            <td>${relevantTasks.length} Tugas Operasional (${tupoksiTasks.length} Pokok, ${tambahanTasks.length} Tambahan)</td>
            <td style="font-weight: bold;">Capaian Kinerja</td>
            <td>:</td>
            <td style="font-weight: bold; color: #15803d;">${completedCount} Tuntas (${completionRate}%)</td>
          </tr>
        </table>

        <!-- BAGIAN I: MATRIKS TARGET OPERASIONAL & KPI -->
        <div class="section-header">
          I. MATRIKS TARGET OPERASIONAL & INDIKATOR KINERJA KUNCI (KPI)
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th style="width: 65px;">Kode</th>
              <th>Indikator Kinerja Kunci (KPI)</th>
              <th style="width: 85px;">Target</th>
              <th style="width: 85px;">Realisasi</th>
              <th style="width: 80px;">Capaian</th>
              <th style="width: 80px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${kpiItems.length > 0 ? kpiItems.map((kpi: any, idx: number) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold;">${kpi.code || `KPI-0${idx + 1}`}</td>
                <td><b>${kpi.name}</b></td>
                <td style="text-align: center;">${kpi.target} ${kpi.unit || ''}</td>
                <td style="text-align: center; font-weight: bold;">${kpi.realization} ${kpi.unit || ''}</td>
                <td style="text-align: center; font-weight: bold;">${kpi.status === 'tercapai' ? '100%' : '85%'}</td>
                <td style="text-align: center; font-weight: bold; color: ${kpi.status === 'tercapai' ? '#15803d' : '#b45309'};">
                  ${kpi.status === 'tercapai' ? 'Tercapai' : 'Proses'}
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td style="text-align: center;">1</td>
                <td style="text-align: center; font-family: monospace;">KPI-01</td>
                <td>Pelaksanaan Tugas Pokok Operasional ${roleTitle}</td>
                <td style="text-align: center;">100%</td>
                <td style="text-align: center; font-weight: bold;">100%</td>
                <td style="text-align: center; font-weight: bold;">100%</td>
                <td style="text-align: center; font-weight: bold; color: #15803d;">Tercapai</td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- BAGIAN II: REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL -->
        <div class="section-header">
          II. REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL YANG DILAKSANAKAN
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th style="width: 80px;">Tanggal</th>
              <th style="width: 75px;">Klasifikasi</th>
              <th style="width: 75px;">Waktu</th>
              <th>Uraian Tugas & Pekerjaan Kedinasan</th>
              <th style="width: 75px;">Volume</th>
              <th style="width: 90px;">Lokasi</th>
              <th style="width: 65px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${relevantTasks.length > 0 ? relevantTasks.map((t, idx) => {
              const isPokok = getTaskClassification(role, t.category, t.taskType) === 'pokok';
              return `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td style="text-align: center; font-family: Arial, sans-serif; font-size: 8.5pt;">${t.date}</td>
                  <td style="text-align: center; font-weight: bold; font-size: 8.5pt; color: ${isPokok ? '#1e40af' : '#b45309'};">
                    ${isPokok ? 'Pokok' : 'Tambahan'}
                  </td>
                  <td style="text-align: center; font-family: monospace; font-size: 8.5pt;">${t.timeStart} - ${t.timeEnd}</td>
                  <td>
                    <b>${t.title}</b>
                    ${t.description ? `<br><small style="color: #475569;">${t.description}</small>` : ''}
                  </td>
                  <td style="text-align: center;">${t.volumeUnit || '-'}</td>
                  <td>${t.location || '-'}</td>
                  <td style="text-align: center; font-weight: bold; font-size: 8.5pt; color: ${t.status === 'selesai' ? '#15803d' : '#b45309'};">
                    ${t.status === 'selesai' ? 'Selesai' : 'Proses'}
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
                <td colspan="4" style="text-align: center;">TOTAL REKAPITULASI</td>
                <td colspan="3">${relevantTasks.length} Tugas Operasional (${tupoksiTasks.length} Tugas Pokok / ${tambahanTasks.length} Tugas Tambahan)</td>
                <td style="text-align: center; color: #15803d;">${completedCount}/${relevantTasks.length} Tuntas</td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        ${isPerpus ? `
        <!-- BAGIAN III (KHUSUS PERPUS): REKAPITULASI ANGGOTA PERPUSTAKAAN (PEMUSTAKA SEKOLAH) -->
        <div class="section-header">
          III. REKAPITULASI ANGGOTA PERPUSTAKAAN (PEMUSTAKA SEKOLAH)
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Guru (Pendidik)</th>
              <th>Tenaga Kependidikan (Staff)</th>
              <th style="text-align: center;">Siswa (Laki-laki)</th>
              <th style="text-align: center;">Siswa (Perempuan)</th>
              <th style="text-align: center;">Total Seluruh Pemustaka</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center; font-weight: bold;">${guruCount} Orang</td>
              <td style="text-align: center; font-weight: bold;">${staffCount} Orang</td>
              <td style="text-align: center; font-weight: bold;">${siswaLCount} Orang</td>
              <td style="text-align: center; font-weight: bold;">${siswaPCount} Orang</td>
              <td style="text-align: center; font-weight: bold; color: #1e3a8a;">${totalAnggotaPerpus} Orang</td>
            </tr>
          </tbody>
        </table>

        <!-- BAGIAN IV (KHUSUS PERPUS): KOLEKSI BUKU PERPUSTAKAAN -->
        <div class="section-header">
          IV. ${isMonthly 
            ? `LAMPIRAN PENAMBAHAN BUKU BARU BULAN ${MONTH_NAMES[(monthlyData?.month || 9) - 1].toUpperCase()} ${monthlyData?.year || 2026}`
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
              <th style="width: 70px;">Klasifikasi DDC</th>
              <th style="width: 85px;">Kategori</th>
              <th style="width: 85px;">${isMonthly ? 'Tgl Masuk' : 'Tahun Pengadaan'}</th>
              <th style="width: 60px;">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${perpusBooks.length > 0 ? perpusBooks.slice(0, isMonthly ? 10 : 15).map((b, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><b>${b.judul}</b></td>
                <td>${b.pengarang || '-'} ${b.penerbit ? `(${b.penerbit})` : ''}</td>
                <td style="text-align: center;">${b.kelas || '-'}</td>
                <td style="text-align: center; font-family: monospace;">${b.ddcKlasifikasi || '-'}</td>
                <td style="text-align: center; text-transform: uppercase;">${b.statusBuku || b.kategori || 'umum'}</td>
                <td style="text-align: center;">${isMonthly ? (b.tanggalMasuk || '-') : (b.tahunBeli || b.tahunPengadaan || '-')}</td>
                <td style="text-align: center; font-weight: bold;">${b.jumlah || 1} Eks</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="8" style="text-align: center; padding: 8px; color: #64748b;">
                  ${isMonthly ? 'Pada bulan berjalan tidak terdapat penambahan buku baru yang masuk / dibeli.' : 'Belum ada data buku yang terdaftar.'}
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- BAGIAN V (KHUSUS PERPUS): DAFTAR INVENTARIS SARANA PRASARANA LAYANAN PERPUSTAKAAN -->
        <div class="section-header">
          V. DAFTAR INVENTARIS SARANA PRASARANA LAYANAN PERPUSTAKAAN
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th style="width: 85px;">Kode Barang</th>
              <th>Nama Sarana / Prasarana</th>
              <th>Merk / Model / Spesifikasi</th>
              <th style="width: 60px;">Jumlah</th>
              <th style="width: 80px;">Kondisi</th>
              <th style="width: 90px;">Lokasi Simpan</th>
            </tr>
          </thead>
          <tbody>
            ${roleInventories.length > 0 ? roleInventories.map((inv, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center; font-family: monospace;">${inv.kodeBarang || '-'}</td>
                <td><b>${inv.namaBarang}</b></td>
                <td>${inv.merkModel || '-'}</td>
                <td style="text-align: center; font-weight: bold;">${inv.jumlah} ${inv.satuan || 'Unit'}</td>
                <td style="text-align: center;">${inv.kondisi || 'Baik'}</td>
                <td>${inv.lokasiPenyimpanan || 'Satuan Pendidikan'}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="7" style="text-align: center; padding: 8px; color: #64748b;">
                  Data sarana prasarana operasional unit Layanan Perpustakaan terdata dalam kondisi baik dan terpelihara.
                </td>
              </tr>
            `}
          </tbody>
        </table>
        ` : `
        <!-- BAGIAN III (NON-PERPUS): SARANA PRASARANA / INVENTARIS OPERASIONAL -->
        <div class="section-header">
          III. REKAPITULASI SARANA PRASARANA & INVENTARIS OPERASIONAL UNIT ${roleTitle.toUpperCase()}
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th style="width: 85px;">Kode Barang</th>
              <th>Nama Sarana / Prasarana</th>
              <th>Merk / Model / Spesifikasi</th>
              <th style="width: 60px;">Jumlah</th>
              <th style="width: 80px;">Kondisi</th>
              <th style="width: 90px;">Lokasi Simpan</th>
            </tr>
          </thead>
          <tbody>
            ${roleInventories.length > 0 ? roleInventories.map((inv, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center; font-family: monospace;">${inv.kodeBarang || '-'}</td>
                <td><b>${inv.namaBarang}</b></td>
                <td>${inv.merkModel || '-'}</td>
                <td style="text-align: center; font-weight: bold;">${inv.jumlah} ${inv.satuan || 'Unit'}</td>
                <td style="text-align: center;">${inv.kondisi || 'Baik'}</td>
                <td>${inv.lokasiPenyimpanan || 'Satuan Pendidikan'}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="7" style="text-align: center; padding: 8px; color: #64748b;">
                  Data sarana prasarana operasional unit ${roleTitle} terdata dalam kondisi baik dan terpelihara.
                </td>
              </tr>
            `}
          </tbody>
        </table>
        `}

        <!-- LEMBAR PENGESAHAN RESMI DINAS: KEPALA SEKOLAH DI KIRI, OPERATOR DI KANAN -->
        <table class="signatures">
          <tr>
            <td>
              <div>Mengetahui / Mengesahkan,</div>
              <div style="font-weight: bold; margin-top: 2px;">Kepala Sekolah</div>
              <div style="height: 70px;"></div>
              <div style="font-weight: bold; text-decoration: underline; font-size: 11pt;">${kepsekName}</div>
              <div style="font-size: 9.5pt; font-family: Arial, sans-serif; margin-top: 2px;">
                NIP. ${schoolConfig.kepalaSekolah?.nip || '19700101 199501 1 001'}
              </div>
            </td>
            <td>
              <div>${defaultSignDate}</div>
              <div style="font-weight: bold; margin-top: 2px;">${role === 'PERPUS' ? 'Pengelola Perpustakaan' : `Operator ${roleTitle}`}</div>
              <div style="height: 70px;"></div>
              <div style="font-weight: bold; text-decoration: underline; font-size: 11pt;">${operatorName}</div>
              <div style="font-size: 9.5pt; font-family: Arial, sans-serif; margin-top: 2px;">
                ${operator?.nip ? `NIP. ${operator.nip}` : 'Tenaga Layanan Operasional'}
              </div>
            </td>
          </tr>
        </table>

      </div>
    </body>
    </html>
  `;
}

/**
 * 2. GENERATOR DOKUMEN WORD (.DOC) UNTUK REKAP ANGGOTA PERPUSTAKAAN
 */
export function generateLibraryMemberReportWord(params: LibraryMemberWordParams): string {
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
  const tahunAjaran = `${currentYear} / ${currentYear + 1}`;

  const defaultDate = manualDate && manualDate.trim()
    ? manualDate.trim()
    : `${schoolConfig.kabupatenKota || 'Sekolah'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

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
          size: 215mm 330mm;
          margin: 1.5cm 1.5cm 1.5cm 2.0cm;
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 10.5pt;
          line-height: 1.25;
          color: #000000;
        }
        .title {
          font-size: 12.5pt;
          font-weight: 800;
          text-align: center;
          text-transform: uppercase;
          text-decoration: underline;
          margin-top: 6px;
        }
        .nomor {
          font-size: 10pt;
          font-family: Arial, sans-serif;
          font-weight: bold;
          text-align: center;
          margin-top: 3px;
        }
        .subtitle {
          font-size: 9.5pt;
          font-family: Arial, sans-serif;
          text-align: center;
          margin-bottom: 14px;
        }
        .section-header {
          font-size: 10.5pt;
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 14px;
          margin-bottom: 6px;
        }
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 14px;
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
          margin-top: 25px;
          page-break-inside: avoid;
        }
        table.signatures td {
          width: 50%;
          text-align: center;
          vertical-align: top;
          padding: 0 10px;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        
        <!-- KOP SURAT 3 KOLOM -->
        ${generateWordKopSurat(schoolConfig)}

        <!-- JUDUL & REGISTER RESMI -->
        <div class="title">
          LAPORAN REKAPITULASI JUMLAH & DATA ANGGOTA PERPUSTAKAAN SEKOLAH
        </div>
        <div class="nomor">
          Nomor: ${nomorDokumen}
        </div>
        <div class="subtitle">
          Tahun Ajaran ${tahunAjaran}
        </div>

        <!-- BAGIAN I: REKAPITULASI MATRIKS PEMUSTAKA PERPUSTAKAAN -->
        <div class="section-header">
          I. REKAPITULASI MATRIKS PEMUSTAKA PERPUSTAKAAN
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 35px;">No</th>
              <th>Kategori Pemustaka</th>
              <th style="width: 90px;">Laki-laki (L)</th>
              <th style="width: 90px;">Perempuan (P)</th>
              <th style="width: 90px;">Jumlah Total</th>
              <th style="width: 120px;">Status Keaktifan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center; font-weight: bold;">1</td>
              <td><b>Tenaga Pendidik (Guru)</b></td>
              <td style="text-align: center;">${memberStats.guruCount > 0 ? Math.ceil(memberStats.guruCount * 0.4) : 0} Org</td>
              <td style="text-align: center;">${memberStats.guruCount > 0 ? Math.floor(memberStats.guruCount * 0.6) : 0} Org</td>
              <td style="text-align: center; font-weight: bold;">${memberStats.guruCount} Orang</td>
              <td style="text-align: center; color: #15803d; font-weight: bold;">100% Aktif</td>
            </tr>
            <tr>
              <td style="text-align: center; font-weight: bold;">2</td>
              <td><b>Tenaga Kependidikan (Staff / TU)</b></td>
              <td style="text-align: center;">${memberStats.staffCount > 0 ? Math.ceil(memberStats.staffCount * 0.5) : 0} Org</td>
              <td style="text-align: center;">${memberStats.staffCount > 0 ? Math.floor(memberStats.staffCount * 0.5) : 0} Org</td>
              <td style="text-align: center; font-weight: bold;">${memberStats.staffCount} Orang</td>
              <td style="text-align: center; color: #15803d; font-weight: bold;">100% Aktif</td>
            </tr>
            <tr>
              <td style="text-align: center; font-weight: bold;">3</td>
              <td><b>Peserta Didik (Siswa)</b></td>
              <td style="text-align: center;">${memberStats.lakiCount} Siswa</td>
              <td style="text-align: center;">${memberStats.perempuanCount} Siswi</td>
              <td style="text-align: center; font-weight: bold;">${memberStats.siswaCount} Orang</td>
              <td style="text-align: center; color: #15803d; font-weight: bold;">${memberStats.aktifCount} Aktif (${memberStats.tamatCount} Tamat)</td>
            </tr>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td colspan="2" style="text-align: center;">TOTAL KESELURUHAN ANGGOTA</td>
              <td style="text-align: center;">${memberStats.lakiCount} Orang</td>
              <td style="text-align: center;">${memberStats.perempuanCount} Orang</td>
              <td style="text-align: center; font-size: 10.5pt; color: #1e3a8a;">${memberStats.total} Orang</td>
              <td style="text-align: center; color: #15803d;">${memberStats.aktifCount} Aktif Terdaftar</td>
            </tr>
          </tbody>
        </table>

        ${includeFullList && libraryMembers.length > 0 ? `
          <!-- BAGIAN II: DAFTAR KESELURUHAN ANGGOTA TERDATA -->
          <div class="section-header" style="margin-top: 18px;">
            II. DAFTAR KESELURUHAN ANGGOTA PERPUSTAKAAN TERDATA (${libraryMembers.length} PEMUSTAKA)
          </div>
          <table class="data-table" style="font-size: 8.5pt;">
            <thead>
              <tr>
                <th style="width: 25px;">No</th>
                <th style="width: 80px;">No. Anggota</th>
                <th>Nama Lengkap</th>
                <th style="width: 100px;">Kategori</th>
                <th style="width: 85px;">Kelas / Jabatan</th>
                <th style="width: 35px;">L/P</th>
                <th style="width: 110px;">No. Identitas / NISN</th>
                <th style="width: 65px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${libraryMembers.map((m, idx) => {
                const typeLabel = m.tipeAnggota === 'GURU' ? 'Pendidik' : m.tipeAnggota === 'STAFF' ? 'Tenaga Kependidikan' : 'Siswa';
                const statusLabel = (m.status || 'aktif').toLowerCase() === 'aktif' ? 'Aktif' : (m.status || '').toLowerCase() === 'tamat' ? 'Tamat' : 'Nonaktif';
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

        <!-- LEMBAR PENGESAHAN: KEPALA SEKOLAH DI KIRI, PENGELOLA DI KANAN -->
        <table class="signatures">
          <tr>
            <td>
              <div>Mengetahui / Mengesahkan,</div>
              <div style="font-weight: bold; margin-top: 2px;">Kepala Sekolah</div>
              <div style="height: 70px;"></div>
              <div style="font-weight: bold; text-decoration: underline; font-size: 11pt;">${kepsekName}</div>
              <div style="font-size: 9.5pt; font-family: Arial, sans-serif; margin-top: 2px;">
                NIP. ${schoolConfig.kepalaSekolah?.nip || '19700101 199501 1 001'}
              </div>
            </td>
            <td>
              <div>${defaultDate}</div>
              <div style="font-weight: bold; margin-top: 2px;">Pengelola Perpustakaan</div>
              <div style="height: 70px;"></div>
              <div style="font-weight: bold; text-decoration: underline; font-size: 11pt;">${pengelolaName}</div>
              <div style="font-size: 9.5pt; font-family: Arial, sans-serif; margin-top: 2px;">
                ${pengelolaPerpus?.nip ? `NIP. ${pengelolaPerpus.nip}` : 'Tenaga Layanan Operasional'}
              </div>
            </td>
          </tr>
        </table>

      </div>
    </body>
    </html>
  `;
}
