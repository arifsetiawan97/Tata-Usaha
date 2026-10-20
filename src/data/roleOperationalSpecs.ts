import { RoleType, OperationalKPI } from '../types';

export interface RoleOperationalSpec {
  role: RoleType;
  portalName: string;
  roleTitle: string;
  badgeLabel: string;
  themeColor: string;
  
  // Standar Target Operasional & Indikator Kinerja Kunci (KPI)
  operationalKPIs: OperationalKPI[];

  // Ringkasan Eksekutif Standar Bulanan & Tahunan
  getExecutiveSummaryMonthly: (monthName: string, year: number, stats: { total: number; completed: number; rate: number }) => string;
  getExecutiveSummaryAnnual: (year: number, stats: { total: number; completed: number; rate: number }) => string;

  // Rincian Capaian Kinerja yang Terlaksana
  monthlyAchievements: string[];
  annualMilestones: string[];

  // Kendala & Hambatan di Lapangan
  fieldObstacles: Array<{
    obstacle: string;
    impact: string;
    solution: string;
    priority: 'Tinggi' | 'Sedang' | 'Rutin';
  }>;

  // Rekomendasi Rencana Strategis
  strategicRecommendations: string[];
}

export const ROLE_OPERATIONAL_SPECS: Record<RoleType, RoleOperationalSpec> = {
  // =========================================================================
  // 1. PORTAL AKUN LAYANAN OPERASIONAL: PERPUSTAKAAN (PERPUS)
  // =========================================================================
  PERPUS: {
    role: 'PERPUS',
    portalName: 'Portal Layanan Perpustakaan Sekolah',
    roleTitle: 'Layanan Perpustakaan',
    badgeLabel: 'Literasi & Pustaka',
    themeColor: 'purple',
    operationalKPIs: [
      {
        code: 'KPI-PUS-01',
        name: 'Sirkulasi Peminjaman & Pengembalian Bahan Pustaka',
        target: '100% Layanan Tuntas Tepat Waktu',
        realization: '100% Tercapai (Layanan Tertib & Bebas Komplain)',
        unit: 'Transaksi Peminjaman',
        status: 'tercapai'
      },
      {
        code: 'KPI-PUS-02',
        name: 'Katalogisasi DDC & Pelabelan Barcode Koleksi Baru',
        target: '100% Bahan Pustaka Masuk Terregistrasi',
        realization: '100% Terinput ke Buku Induk & Barcode Aktif',
        unit: 'Eksemplar Buku',
        status: 'tercapai'
      },
      {
        code: 'KPI-PUS-03',
        name: 'Pendampingan Gerakan Literasi Sekolah (GLS 15 Menit)',
        target: 'Minimal 20 Sesi / Bulan di Rombel Kelas',
        realization: 'Terlaksana 20+ Sesi Aktif Bersama Wali Kelas',
        unit: 'Sesi Pendampingan',
        status: 'tercapai'
      },
      {
        code: 'KPI-PUS-04',
        name: 'Restorasi, Penjilidan & Preservasi Koleksi Rusak',
        target: '100% Buku Rusak Ringan Tertangani',
        realization: '100% Diperbaiki dengan Lem Jilid & Sampul Mika',
        unit: 'Buku Direstorasi',
        status: 'tercapai'
      },
      {
        code: 'KPI-PUS-05',
        name: 'Stock Opname Fisik & Layanan Bebas Pustaka',
        target: 'Verifikasi Berkala & Tertib Administrasi',
        realization: 'Terselenggara Sesuai Standar Akreditasi Perpus',
        unit: 'Laporan Opname',
        status: 'tercapai'
      }
    ],
    getExecutiveSummaryMonthly: (monthName, year, stats) => 
      `Sepanjang bulan ${monthName} ${year}, Layanan Operasional Perpustakaan Sekolah telah menyelesaikan ${stats.completed} dari ${stats.total > 0 ? stats.total : 24} agenda kerja operasional (${stats.rate}%). Seluruh pelayanan sirkulasi pemustaka (peminjaman & pengembalian buku), pengolahan klasifikasi DDC dan pelabelan barcode koleksi baru kurikulum merdeka, pendampingan Gerakan Literasi Sekolah (GLS 15 menit membaca rutin), serta preservasi fisik buku rusak terselenggara secara tertib, akuntabel, dan memenuhi standar pelayanan perpustakaan satuan pendidikan.`,
    getExecutiveSummaryAnnual: (year, stats) => 
      `Laporan Tahunan Kinerja Layanan Perpustakaan Sekolah Tahun Anggaran ${year} mendokumentasikan pencapaian keterlaksanaan program operasional sebesar ${stats.rate}%. Kinerja difokuskan pada otomasi katalogisasi digital (OPAC), percepatan sirkulasi peminjaman buku pengayaan, penataan pojok baca kelas tematik, serta pemeliharaan keutuhan fisik koleksi bahan pustaka guna mendukung iklim literasi belajar peserta didik secara berkesinambungan.`,
    monthlyAchievements: [
      'Pelayanan sirkulasi peminjaman dan pengembalian buku teks pelajaran serta buku fiksi/non-fiksi tercatat 100% tertib',
      'Penyelesaian registrasi buku induk, klasifikasi Dewey Decimal Classification (DDC), dan pelabelan barcode koleksi baru',
      'Penyelenggaraan pendampingan literasi 15 menit membaca rutin dan pemantauan pojok baca di seluruh rombel kelas',
      'Restorasi dan pengeleman jilid buku referensi (kamus dan ensiklopedia) yang mengalami kerusakan fisik',
      'Penyusunan rekapitulasi statistik pemustaka aktif dan penerbitan surat keterangan bebas perpustakaan bagi siswa'
    ],
    annualMilestones: [
      'Peningkatan indeks peminjaman dan kunjungan pemustaka peserta didik sebesar 42% dibanding tahun sebelumnya',
      'Penyelesaian 100% stock opname koleksi buku teks dan non-teks dengan akurasi data fisik mencapai 98.4%',
      'Otomasi sistem sirkulasi terintegrasi dan penerbitan kartu anggota perpustakaan digital berbasis barcode',
      'Pembentukan 12 Pojok Literasi Tematik di selasar kelas dan lobi sekolah guna menyukseskan Gerakan Literasi Sekolah'
    ],
    fieldObstacles: [
      {
        obstacle: 'Keterlambatan pengembalian buku pinjaman paket kurikulum oleh sebagian peserta didik saat mendekati pekan asesmen sumatif',
        impact: 'Menghambat penjadwalan sirkulasi ulang bahan bacaan bagi rombel lain yang memerlukan referensi mata pelajaran terkait',
        solution: 'Menerbitkan surat peringatan ramah dan menjalin koordinasi aktif dengan wali kelas untuk memonitor inventaris buku di tangan siswa',
        priority: 'Tinggi'
      },
      {
        obstacle: 'Kapasitas rak display buku baru perlu ditambah untuk menampung hibah koleksi pengayaan dan literasi fiksi',
        impact: 'Beberapa buku baru harus ditumpuk sementara di meja pengolahan sehingga aksesibilitas pemustaka terbatas',
        solution: 'Mengajukan usulan penambahan unit rak display buku akrilik dua muka dan meja baca mandiri pada usulan anggaran sekolah',
        priority: 'Sedang'
      },
      {
        obstacle: 'Penurunan keawetan fisik lem jilid buku referensi tebal (kamus & ensiklopedia) akibat frekuensi pemakaian tinggi',
        impact: 'Halaman buku referensi rentan lepas apabila tidak segera dilakukan perbaikan fisik secara teratur',
        solution: 'Melakukan restorasi pengeleman jilid ulang menggunakan lem perekat khusus buku serta pelapisan sampul plastik mika',
        priority: 'Rutin'
      },
      {
        obstacle: 'Fluktuasi kelembapan udara ruang perpustakaan pada saat musim hujan yang memerlukan sirkulasi udara ekstra',
        impact: 'Kertas buku rentan lembap dan memicu timbulnya bintik jamur pada koleksi lembaran kertas lama',
        solution: 'Pengoperasian dehumidifier / exhaust fan secara teratur dan pembersihan debu rak secara berkala menggunakan microfiber',
        priority: 'Rutin'
      }
    ],
    strategicRecommendations: [
      'Pengembangan koleksi digital e-Perpus sekolah dan integrasi sistem perpustakaan dengan katalog dinas daerah',
      'Penambahan unit rak buku dua muka dan karpet area baca lesehan untuk menampung lonjakan pemustaka pada jam istirahat',
      'Penyelenggaraan Festival Bulan Bahasa dan Pekan Literasi Tahunan untuk memotivasi minat baca seluruh warga sekolah'
    ]
  },

  // =========================================================================
  // 2. PORTAL AKUN LAYANAN OPERASIONAL: TATA USAHA (TU)
  // =========================================================================
  TU: {
    role: 'TU',
    portalName: 'Portal Layanan Ketatausahaan & Administrasi Sekolah (TU)',
    roleTitle: 'Tata Usaha (TU)',
    badgeLabel: 'Administrasi & Persuratan',
    themeColor: 'sky',
    operationalKPIs: [
      {
        code: 'KPI-TU-01',
        name: 'Pengelolaan Buku Agenda Persuratan Dinas Masuk & Keluar',
        target: '100% Tuntas & Terekspedisi Tepat Waktu',
        realization: '100% Tercatat Valid dengan Lembar Disposisi',
        unit: 'Berkas Surat',
        status: 'tercapai'
      },
      {
        code: 'KPI-TU-02',
        name: 'Pemutakhiran Data Kepegawaian GTK & Dapodik / SIASN',
        target: 'Sinkronisasi Tepat Waktu Sebelum Batas Cut-Off',
        realization: 'Data 100% Valid & Sinkron Bersama BKN/Kemdikbud',
        unit: 'Data GTK',
        status: 'tercapai'
      },
      {
        code: 'KPI-TU-03',
        name: 'Pelayanan Administrasi Kesiswaan & Legalisir Dokumen',
        target: 'Pelayanan Cepat Maksimal 1 Hari Kerja',
        realization: 'Pelayanan 100% Tuntas Bebas Keluhan Pemohon',
        unit: 'Permohonan Layanan',
        status: 'tercapai'
      },
      {
        code: 'KPI-TU-04',
        name: 'Rekonsiliasi Aset & Kartu Inventaris Barang (KIB A s.d. E)',
        target: 'Inventarisasi Fisik Tertib & Bebas Temuan',
        realization: '100% Fisik & Dokumen Aset Sesuai Sistem Pemda',
        unit: 'Audit Barang',
        status: 'tercapai'
      },
      {
        code: 'KPI-TU-05',
        name: 'Pengarsipan Digital Warkat Kedinasan (e-Arsip)',
        target: 'Pemindaian Terjadwal Arsip Aktif & Inaktif',
        realization: 'Penyimpanan Backup Cloud & Odner Fisik Rapi',
        unit: 'Folder Arsip',
        status: 'tercapai'
      }
    ],
    getExecutiveSummaryMonthly: (monthName, year, stats) => 
      `Sepanjang bulan ${monthName} ${year}, Layanan Operasional Administrasi Tata Usaha telah menyelesaikan ${stats.completed} dari ${stats.total > 0 ? stats.total : 28} agenda kedinasan (${stats.rate}%). Tata kelola persuratan dinas masuk dan keluar, pelayanan administrasi kesiswaan (buku induk, mutasi, surat keterangan aktif, dan legalisir berkas), pemutakhiran data Dapodik kepegawaian GTK, serta rekonsiliasi berkala buku inventaris barang (KIR/KIB) terselenggara secara tertib dan transparan sesuai pedoman standar pelayanan minimal (SPM).`,
    getExecutiveSummaryAnnual: (year, stats) => 
      `Laporan Tahunan Kinerja Tata Usaha Tahun Anggaran ${year} mendokumentasikan efektivitas tertib administrasi sekolah dengan rasio pencapaian target kerja mencapai ${stats.rate}%. Pelaksanaan tata naskah dinas, pemutakhiran berkas kepegawaian ASN/PPPK, digitalisasi kearsipan warkat, serta penatausahaan sarana prasarana sekolah terselenggara secara akuntabel dan memenuhi seluruh indikator akreditasi satuan pendidikan.`,
    monthlyAchievements: [
      'Penyelesaian registrasi buku agenda surat dinas masuk dan surat keluar berdisposisi 100% tepat waktu',
      'Pembaruan berkas kenaikan pangkat, KGB, dan sinkronisasi data Dapodik kepegawaian tenaga pendidik & kependidikan',
      'Pelayanan administrasi kesiswaan berupa verifikasi mutasi, buku induk, dan legalisasi berkas ijazah/surat keterangan',
      'Rekonsiliasi berkala kartu inventaris barang (KIR) ruang kantor, ruang kelas, dan laboratorium',
      'Penatausahaan dokumen SPJ operasional sekolah dan penataan berkas arsip aktif ke dalam map odner berindeks'
    ],
    annualMilestones: [
      'Pemberkasan 100% administrasi kepegawaian GTK (KGB, Kenaikan Pangkat, SKP Tahunan) tepat waktu tanpa keterlambatan',
      'Digitalisasi 1.450+ warkat persuratan dan buku induk kesiswaan ke sistem penyimpanan arsip digital e-Arsip',
      'Kelulusan dan mutasi siswa tertata rapi dalam buku register induk dan sinkron dengan basis data kependudukan Dapodik',
      'Pembaruan berkas Kartu Inventaris Barang (KIB A s.d. E) tuntas diverifikasi bersama dinas pengelola aset'
    ],
    fieldObstacles: [
      {
        obstacle: 'Tingginya lonjakan permohonan legalisasi ijazah dan surat keterangan aktif siswa pada saat masa pendaftaran beasiswa dan PPDB',
        impact: 'Antrean pemohon meningkat di loket layanan tata usaha dan menuntut pembagian waktu staf administrasi',
        solution: 'Menerapkan antrean nomor layanan terpadu serta penyediaan formulir digital surat keterangan untuk mempercepat verifikasi berkas',
        priority: 'Tinggi'
      },
      {
        obstacle: 'Lonjakan beban server pusat aplikasi Dapodik dan SIASN BKN menjelang batas akhir sinkronisasi nasional',
        impact: 'Kecepatan akses data sempat mengalami kelambatan proses pengiriman data sinkronisasi berkala',
        solution: 'Menjadwalkan sinkronisasi data pada jam non-sibuk (pukul 06.00 - 07.30 WIB atau malam hari) saat lalu lintas server lengang',
        priority: 'Tinggi'
      },
      {
        obstacle: 'Volume arsip fisik dokumen warkat tahun lampau memerlukan pemindaian digital secara bertahap',
        impact: 'Kapasitas ruang penyimpanan lemari arsip fisik mendekati batas maksimal ruang kantor',
        solution: 'Menetapkan jadwal pemindaian digital berkas arsip secara terstruktur setiap akhir pekan menggunakan scanner ADF berkecepatan tinggi',
        priority: 'Sedang'
      },
      {
        obstacle: 'Koordinasi konfirmasi surat undangan kedinasan dari instansi eksternal yang terkadang mepet dengan batas waktu acara',
        impact: 'Dibutuhkan percepatan penerbitan surat tugas pimpinan dan disposisi tindak lanjut secara mendesak',
        solution: 'Mengoptimalkan saluran komunikasi cepat kedinasan melalui kontak narahubung persuratan digital WhatsApp kedinasan',
        priority: 'Rutin'
      }
    ],
    strategicRecommendations: [
      'Pengadaan scanner berkecepatan tinggi (ADF) dan server lokal cadangan untuk proteksi keamanan data arsip sekolah',
      'Implementasi sistem antrean digital terintegrasi untuk loket pelayanan legalisir dan surat keterangan peserta didik',
      'Pelatihan berkelanjutan tata naskah dinas elektronik dan aplikasi persuratan terpadu bagi staf administrasi perkantoran'
    ]
  },

  // =========================================================================
  // 3. PORTAL AKUN LAYANAN OPERASIONAL: PENJAGA SEKOLAH (PENJAGA)
  // =========================================================================
  PENJAGA: {
    role: 'PENJAGA',
    portalName: 'Portal Layanan Keamanan & Penjaga Sekolah',
    roleTitle: 'Penjaga Sekolah',
    badgeLabel: 'Keamanan & Sarpras',
    themeColor: 'blue',
    operationalKPIs: [
      {
        code: 'KPI-PJG-01',
        name: 'Pengamanan Lingkungan Sekolah & Ronda Malam 24 Jam',
        target: 'Zero Incident (Nihil Pencurian, Kebakaran, Kamtibmas)',
        realization: '100% Kondusif (Patroli Rutin Siang & Malam)',
        unit: 'Hari Patroli',
        status: 'tercapai'
      },
      {
        code: 'KPI-PJG-02',
        name: 'SOP Buka-Tutup Pintu Gerbang Utama & Pintu Gedung',
        target: 'Tepat Waktu Sesuai Jadwal Operasional KBM',
        realization: '100% Tertib (Pintu Terkunci Aman Tiap Sore/Malam)',
        unit: 'Siklus Buka-Tutup',
        status: 'tercapai'
      },
      {
        code: 'KPI-PJG-03',
        name: 'Pengawasan Ketertiban & Penyeberangan Jalan Siswa',
        target: 'Keselamatan Penuh di Jam Masuk & Kepulangan Sekolah',
        realization: 'Aman Terkendali di Gerbang Utama Sekolah',
        unit: 'Hari Efektif',
        status: 'tercapai'
      },
      {
        code: 'KPI-PJG-04',
        name: 'Pemeliharaan Fisik Sarpras Ringan Swakelola',
        target: 'Penanganan Langsung Sarpras Rusak Ringan',
        realization: '100% Tertangani (Mebeler, Kran, Kunci, Lampu)',
        unit: 'Unit Sarpras',
        status: 'tercapai'
      },
      {
        code: 'KPI-PJG-05',
        name: 'Ekspedisi Pengantaran Surat Dinas & Dokumen SPM',
        target: 'Pengantaran Tepat Waktu dengan Buku Ekspedisi',
        realization: '100% Diterima Instansi Tujuan Lengkap Tanda Terima',
        unit: 'Berkas Dinas',
        status: 'tercapai'
      }
    ],
    getExecutiveSummaryMonthly: (monthName, year, stats) => 
      `Berdasarkan rekapitulasi data harian bulan ${monthName} ${year}, Operator Layanan Operasional Penjaga Sekolah telah menyelesaikan ${stats.completed} dari ${stats.total > 0 ? stats.total : 26} tugas pengamanan (${stats.rate}%). Seluruh pos penjagaan dan titik rawan terpantau aman dan kondusif dengan status Zero Incident (nihil pencurian, kebakaran, dan gangguan kamtibmas), pengawasan keselamatan penyeberangan jalan peserta didik terlaksana tertib, penanganan perbaikan sarpras ringan tuntas, serta kesiapsiagaan operasional sarana gedung terpelihara prima.`,
    getExecutiveSummaryAnnual: (year, stats) => 
      `Laporan Tahunan Kinerja Petugas Penjaga Sekolah Tahun Anggaran ${year} mencerminkan komitmen penuh dalam menjaga keamanan lingkungan belajar 24 jam dengan tingkat keberhasilan ${stats.rate}%. Terselenggaranya patroli malam rutin, keteraturan pengawasan gerbang utama, kesiapsiagaan tanggap cuaca ekstrem, serta perbaikan sarana fisik secara mandiri menjamin kelancaran seluruh proses belajar mengajar di satuan pendidikan.`,
    monthlyAchievements: [
      'Pelaksanaan pengamanan lingkungan 24 jam terlaksana kondusif dengan status Zero Incident (nihil gangguan kamtibmas)',
      'Pemeriksaan dan penguncian gerbang utama, pintu 24 ruang kelas, laboratorium, perpustakaan, dan kantor setiap sore & malam hari',
      'Pengawasan ketertiban dan pendampingan penyeberangan jalan peserta didik di depan gerbang utama pada jam sibuk masuk dan kepulangan',
      'Perbaikan sarana prasarana ringan: penggantian kran wastafel bocor, perbaikan mebeler meja/kursi siswa, dan peremajaan lampu penerangan',
      'Pengantaran surat dinas kedinasan dan dokumen SPM ke Dinas Pendidikan serta instansi mitra tepat waktu berbukti tanda terima'
    ],
    annualMilestones: [
      'Nihil insiden kehilangan barang aset sekolah (Zero Loss Accident) selama 12 bulan penuh patroli',
      'Tuntas melakukan 180+ tindakan perbaikan sarana prasarana ringan secara swakelola tanpa biaya pihak ketiga',
      'Telah melaksanakan 360 kali patroli malam terverifikasi buku jurnal pos pengamanan lingkungan sekolah',
      'Distribusi 140+ berkas ekspedisi surat dinas ke Dinas Pendidikan dan mitra kerja tanpa keterlambatan'
    ],
    fieldObstacles: [
      {
        obstacle: 'Curah hujan lebat disertai angin kencang yang memicu penumpukan daun pada talang atap dan saluran air gerbang utama',
        impact: 'Berpotensi menimbulkan genangan air di depan pintu gerbang masuk apabila aliran air tersumbat sedimen dedaunan',
        solution: 'Melakukan pembersihan berkala saringan saluran drainase setiap pagi bersama tim kebersihan untuk menjamin kelancaran aliran air',
        priority: 'Tinggi'
      },
      {
        obstacle: 'Fluktuasi tegangan listrik jaringan PLN saat cuaca buruk yang menyebabkan beberapa lampu sorot gerbang sempat putus',
        impact: 'Pencahayaan area sudut pos penjagaan depan sempat menurun intensitasnya pada malam hari',
        solution: 'Mengganti titik lampu dengan LED outdoor hemat energi tahan fluktuasi serta memeriksa jalur instalasi box sekring MCB',
        priority: 'Sedang'
      },
      {
        obstacle: 'Kepadatan arus kendaraan pengantar dan penjemput peserta didik di depan jalan raya gerbang utama sekolah',
        impact: 'Terjadi perlambatan arus lalu lintas saat jam kepulangan bersamaan seluruh tingkatan kelas',
        solution: 'Melakukan penataan zona drop-off kendaraan serta berkoordinasi aktif dengan juru parkir dan pihak keamanan lingkungan sekitar',
        priority: 'Tinggi'
      },
      {
        obstacle: 'Kebutuhan peremajaan baterai lithium pada senter patroli malam dan penambahan gembok master-key cadangan',
        impact: 'Efisiensi mobilitas saat menyisir area blindspot di sudut taman belakang sekolah membutuhkan penerangan maksimal',
        solution: 'Mengajukan pengadaan senter patroli LED rechargeable tahan air dan set gembok cadangan baja anti-karat ke bagian TU sarpras',
        priority: 'Rutin'
      }
    ],
    strategicRecommendations: [
      'Penambahan 4 titik kamera pemantau CCTV di area sudut buta (blindspot) gerbang timur dan pagar keliling belakang',
      'Pengadaan genset darurat cadangan untuk lampu penerangan pos jaga dan gerbang utama saat terjadi pemadaman listrik',
      'Pelatihan penyegaran teknis K3 tanggap darurat dan penanganan dini kebakaran bersama Dinas Pemadam Kebakaran'
    ]
  },

  // =========================================================================
  // 4. PORTAL AKUN LAYANAN OPERASIONAL: LAYANAN KEBERSIHAN (SERVICE)
  // =========================================================================
  SERVICE: {
    role: 'SERVICE',
    portalName: 'Portal Layanan Kebersihan Lingkungan Sekolah (Service)',
    roleTitle: 'Layanan Kebersihan (Service)',
    badgeLabel: 'Sanitasi & Lingkungan',
    themeColor: 'emerald',
    operationalKPIs: [
      {
        code: 'KPI-SRV-01',
        name: 'Sanitasi & Sterilisasi Higienitas Toilet Guru & Siswa',
        target: 'Pembersihan 2x Sehari, Bebas Bau & Bersih',
        realization: '100% Terjaga Standar Sanitasi Toilet UKS',
        unit: 'Bilik Toilet',
        status: 'tercapai'
      },
      {
        code: 'KPI-SRV-02',
        name: 'Pembersihan Ruang Pimpinan, Kantor Guru, TU & Kelas',
        target: 'Sapu & Pel Harian Sebelum dan Sesudah KBM',
        realization: '100% Bersih & Nyaman Digunakan Belajar',
        unit: 'Ruangan',
        status: 'tercapai'
      },
      {
        code: 'KPI-SRV-03',
        name: 'Pemilahan & Pengangkutan Sampah Harian ke TPS',
        target: 'Tuntas Terangkut Sebelum Pukul 15.00 WIB',
        realization: '100% Terpilah Organik & Anorganik',
        unit: 'Siklus Pengangkutan',
        status: 'tercapai'
      },
      {
        code: 'KPI-SRV-04',
        name: 'Pemeliharaan Keasrian Taman & Kebersihan Selasar',
        target: 'Penyiraman Rutin & Selasar Bebas Lumut',
        realization: 'Taman Hijau Asri & Selasar Kering Bersih',
        unit: 'Area Lingkungan',
        status: 'tercapai'
      },
      {
        code: 'KPI-SRV-05',
        name: 'Penyediaan Air Bersih & Disinfeksi Tempat Cuci Tangan',
        target: 'Ketersediaan Air Lancar & Sabun Cuci Tangan Penuh',
        realization: '100% Wastafel Berfungsi Sesuai Standar Sehat',
        unit: 'Titik Wastafel',
        status: 'tercapai'
      }
    ],
    getExecutiveSummaryMonthly: (monthName, year, stats) => 
      `Kinerja Layanan Operasional Kebersihan (Service) pada bulan ${monthName} ${year} telah menuntaskan ${stats.completed} dari ${stats.total > 0 ? stats.total : 25} kegiatan sanitasi (${stats.rate}%). Higienitas seluruh bilik toilet guru dan siswa senantiasa bersih dan bebas bau melalui pembersihan rutin 2 kali sehari, pembersihan ruang pimpinan, kantor guru, ruang kelas, dan selasar terlaksana optimal, serta pengelolaan pemilahan sampah organik dan anorganik ke TPS berjalan lancar sesuai standar sekolah sehat Adiwiyata.`,
    getExecutiveSummaryAnnual: (year, stats) => 
      `Laporan Tahunan Kinerja Layanan Kebersihan Sekolah Tahun Anggaran ${year} membuktikan keberhasilan pencapaian target sanitasi dan higienitas lingkungan sekolah dengan ketercapaian ${stats.rate}%. Konsistensi pemeliharaan kebersihan harian ruang belajar, program pengurangan sampah plastik melalui bank sampah, serta penataan area hijau sekolah mendukung terwujudnya iklim satuan pendidikan yang sehat, bersih, dan berwawasan lingkungan.`,
    monthlyAchievements: [
      'Sanitasi harian 14 bilik toilet siswa dan toilet guru terjaga higienis, wangi, bebas jentik nyamuk dan tidak berbau (pembersihan 2 kali sehari)',
      'Pembersihan, penyapuan, dan pengepelan lantai ruang kantor pimpinan, ruang guru, ruang TU, dan selasar koridor kelas terlaksana prima',
      'Pengumpulan, pemilahan sampah organik dan anorganik serta pengangkutan harian ke TPS sekolah berlangsung lancar sebelum jam 15.00 WIB',
      'Penyemprotan disinfektan dan pengisian ulang sabun cuci tangan cair di seluruh wastafel selasar kelas dan area kantin',
      'Perawatan keasrian tanaman taman sekolah, pemangkasan rumput liar, serta pembersihan saluran drainase terbuka dari sedimen debu'
    ],
    annualMilestones: [
      'Pengurangan volume sampah residu ke TPA sebesar 38% melalui pengomposan mandiri daun kering dan pemilahan bank sampah binaan',
      'Terselenggaranya sanitasi rutin harian toilet siswa dan toilet guru dengan tingkat kepatuhan standar higienis mencapai 99.4%',
      'Pemeliharaan higienitas seluruh ruang kelas harian tanpa keluhan dari tenaga pendidik maupun peserta didik',
      'Efisiensi pemakaian bahan kimia pembersih lantai dan desinfektan melalui takaran terstandar dan aman ramah lingkungan'
    ],
    fieldObstacles: [
      {
        obstacle: 'Ketersediaan stok bahan habis pakai kimia pembersih (karbol wangi, sabun cuci tangan cair, kantong sampah) mendekati batas minimal di akhir bulan',
        impact: 'Diperlukan pengaturan takaran pemakaian yang sangat ketat agar kebutuhan sanitasi toilet harian tetap terpenuhi',
        solution: 'Mengajukan amprah kebutuhan bahan pembersih secara teratur 7 hari sebelum stok persediaan di gudang penyimpanan menipis',
        priority: 'Tinggi'
      },
      {
        obstacle: 'Peningkatan volume timbulan sampah dedaunan kering saat pergantian musim berangin kencang di area lapangan terbuka',
        impact: 'Dibutuhkan frekuensi penyapuan tambahan pada siang hari setelah jam istirahat siswa',
        solution: 'Mengoptimalkan penyapuan bersama menggunakan sapu lidi lebar serta memasukkan daun kering ke bak komposter sekolah',
        priority: 'Sedang'
      },
      {
        obstacle: 'Munculnya endapan kerak lumut pada permukaan selasar luar dan bibir wastafel akibat kelembapan tinggi saat musim hujan',
        impact: 'Permukaan lantai selasar teras berpotensi licin apabila tidak dibersihkan dengan penanganan khusus',
        solution: 'Melakukan pembersihan berkala menggunakan sikat kawat dan cairan pembersih kerak anti-licin pada akhir pekan',
        priority: 'Tinggi'
      },
      {
        obstacle: 'Kondisi roda karet pada salah satu gerobak sampah dorong yang mulai aus dan berdecit',
        impact: 'Beban dorong saat mengangkut sampah dedaunan basah menuju TPS memerlukan tenaga ekstra',
        solution: 'Mengajukan perbaikan penggantian bearing roda karet gerobak dorong ke bagian sarana prasarana sekolah',
        priority: 'Sedang'
      }
    ],
    strategicRecommendations: [
      'Pengadaan mesin polisher lantai otomatis elektrik untuk mempercepat perawatan lantai aula, koridor, dan selasar utama',
      'Penambahan unit tempat sampah pilah 3 warna (organik, anorganik, B3) di setiap selasar depan ruang kelas',
      'Penyediaan instalasi kran cuci tangan dengan pedal kaki di area kantin untuk meningkatkan higienitas siswa'
    ]
  },

  // =========================================================================
  // 5. PORTAL AKUN LAYANAN OPERASIONAL: LABORATORIUM IPA (LAB_IPA)
  // =========================================================================
  LAB_IPA: {
    role: 'LAB_IPA',
    portalName: 'Portal Layanan Pengelolaan Laboratorium IPA',
    roleTitle: 'Laboratorium IPA',
    badgeLabel: 'Praktikum & Laboran',
    themeColor: 'teal',
    operationalKPIs: [
      {
        code: 'KPI-IPA-01',
        name: 'Fasilitasi Kesiapan Alat & Reagen Praktikum Kurikulum Sains',
        target: '100% Sesi Terjadwal Siap Tepat Waktu',
        realization: '100% Praktikum Terlayani Bebas Hambatan Alat',
        unit: 'Sesi Praktikum',
        status: 'tercapai'
      },
      {
        code: 'KPI-IPA-02',
        name: 'Sterilisasi & Pembersihan Alat Gelas Laboratorium',
        target: 'Pembersihan Bebas Residu Pasca Praktikum',
        realization: '100% Peralatan Gelas Bersih & Tersimpan Aman',
        unit: 'Batch Alat Gelas',
        status: 'tercapai'
      },
      {
        code: 'KPI-IPA-03',
        name: 'Kalibrasi Berkala Mikroskop & Neraca Presisi Ohaus',
        target: 'Fungsi Optik & Mekanik Terkalibrasi Akurat',
        realization: '100% Mikroskop & Neraca Siap Pakai Siswa',
        unit: 'Unit Instrumen',
        status: 'tercapai'
      },
      {
        code: 'KPI-IPA-04',
        name: 'Kesiapsiagaan K3 Laboratorium & Kotak P3K / Tabung APAR',
        target: 'Zero Incident (Nihil Kecelakaan Kerja Praktikum)',
        realization: 'APAR di Zona Hijau & P3K Terisi Lengkap',
        unit: 'Inspeksi K3',
        status: 'tercapai'
      },
      {
        code: 'KPI-IPA-05',
        name: 'Pengelolaan Limbah Netralisasi & Kartu Stok Bahan Kimia',
        target: 'Pembuangan Ramah Lingkungan & Stok Tertib',
        realization: 'Netralisasi pH Terlaksana & Buku Bahan Valid',
        unit: 'Logbook Kimia',
        status: 'tercapai'
      }
    ],
    getExecutiveSummaryMonthly: (monthName, year, stats) => 
      `Berdasarkan rekapitulasi data harian bulan ${monthName} ${year}, Operator Layanan Operasional Laboratorium IPA telah menuntaskan ${stats.completed} dari ${stats.total > 0 ? stats.total : 22} pekerjaan (${stats.rate}%). Penyiapan alat peraga dan bahan praktikum fisika, kimia, dan biologi berjalan lancar tepat waktu, sterilisasi alat gelas dan kalibrasi mikroskop tuntas, serta standar keselamatan kerja (Zero Incident K3) dan penanganan limbah praktikum ramah lingkungan terjaga optimal sesuai SOP laboratorium sains.`,
    getExecutiveSummaryAnnual: (year, stats) => 
      `Laporan Tahunan Pengelolaan Laboratorium IPA Tahun Anggaran ${year} melaporkan keterlaksanaan 100% praktikum kurikulum sains nasional jenjang satuan pendidikan secara aman, higienis, dan tanpa kecelakaan kerja (Zero Laboratory Accident). Pemeliharaan instrumen presisi mikroskop, pengelolaan reagen bahan kimia ramah lingkungan, serta pendampingan tim sains sekolah terlaksana secara prima.`,
    monthlyAchievements: [
      'Penyiapan set alat peraga dan larutan bahan praktikum fisika, biologi, dan kimia seluruh rombel kelas tepat waktu sesuai jadwal',
      'Pencucian, sterilisasi, dan penataan alat gelas laboratorium (tabung reaksi, erlenmeyer, gelas ukur) bebas residu kontaminan',
      'Pengecekan fungsi optik, pembersihan lensa, dan kalibrasi rutin mikroskop monokuler siswa serta neraca Ohaus presisi',
      'Pemeriksaan kesiapsiagaan K3 laboratorium: indikator tekanan tabung APAR 6 kg dalam zona hijau dan kelengkapan kotak P3K',
      'Pengelolaan limbah cair praktikum kimia menggunakan metode netralisasi pH ramah lingkungan sebelum dibuang ke saluran khusus'
    ],
    annualMilestones: [
      'Fasilitasi 140+ jadwal sesi praktikum sains peserta didik tanpa insiden kecelakaan kerja laboratorium (Zero Accident K3)',
      'Kalibrasi berkala seluruh mikroskop optik, neraca pegas, multimeter, dan instrumen ukur fisika sekolah',
      'Pengelolaan limbah praktikum bahan kimia dengan sistem sedimentasi dan netralisasi pH ramah lingkungan',
      'Pendampingan tim ekstrakurikuler Karya Ilmiah Remaja (KIR) sains hingga meraih prestasi pada kompetisi tingkat kota'
    ],
    fieldObstacles: [
      {
        obstacle: 'Ketersediaan stok larutan reagen indikator asam-basa (fenolftalein, bromtimol biru, lakmus) menipis pada akhir periode praktikum',
        impact: 'Perlu pembuatan larutan indikator alternatif secara mandiri agar jadwal praktikum rombel berikutnya tidak tertunda',
        solution: 'Membuat indikator alami sementara dari ekstrak tumbuhan serta mengajukan amprah reagen kimia baru ke TU lebih awal',
        priority: 'Tinggi'
      },
      {
        obstacle: 'Endapan kotoran halus pada salah satu kran wastafel ruang preparasi akibat sedimentasi pipa air',
        impact: 'Debit aliran air saat proses pencucian alat gelas kimia menjadi sedikit melambat',
        solution: 'Melakukan pembersihan saringan kran wastafel preparasi serta koordinasi pemeliharaan pipa bersama petugas penjaga sarpras',
        priority: 'Sedang'
      },
      {
        obstacle: 'Keterbatasan jumlah set lensa mikroskop cadangan untuk mengantisipasi rombongan belajar berjumlah besar',
        impact: 'Siswa harus bergantian antarkelompok kecil saat melakukan pengamatan sel jaringan mikroskopis',
        solution: 'Mengatur rotasi waktu pengamatan antarkelompok secara terstruktur sehingga seluruh siswa mendapatkan kesempatan praktikum',
        priority: 'Sedang'
      },
      {
        obstacle: 'Kebutuhan ruang penyimpanan khusus bahan kimia beruap pekat yang membutuhkan ventilasi udara langsung',
        impact: 'Bahan kimia asam pekat harus disimpan dalam lemari berventilasi khusus terpisah dari alat presisi',
        solution: 'Menata penempatan botol reagen pekat di dekat exhaust fan serta mengusulkan pengadaan lemari asam mini (fume hood) pada RKAS',
        priority: 'Tinggi'
      }
    ],
    strategicRecommendations: [
      'Pengadaan lemari asam mini (fume hood) untuk eksperimen uap kimia dan reaksi pembakaran zat secara aman',
      'Penambahan 1 set model torso anatomi tubuh manusia resolusi tinggi dan preparat awetan jaringan biologi baru',
      'Pelatihan penyegaran keselamatan laboratorium kimia dan penanganan tumpahan bahan B3 bagi guru pembimbing dan laboran'
    ]
  }
};
