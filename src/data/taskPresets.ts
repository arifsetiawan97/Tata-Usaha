import { TaskCategory, RoleType, TaskLog, InventoryItem } from '../types';

export interface TaskPresetItem {
  category: TaskCategory;
  title: string;
  description: string;
  location: string;
  volumeUnit: string;
  timeStart: string;
  timeEnd: string;
  notes?: string;
}

export const TASK_PRESETS: Record<RoleType, TaskPresetItem[]> = {
  PENJAGA: [
    {
      category: 'keamanan',
      title: 'Buka dan Tutup Pintu Gerbang Utama serta Akses Gedung Sekolah',
      description: 'Melaksanakan SOP harian membuka pintu gerbang utama dan pintu ruangan sekolah pada pagi hari, pengaturan buka-tutup gerbang saat jam KBM berlangsung, serta menutup dan menggembok seluruh pintu ruangan dan gerbang utama setelah jam operasional sekolah berakhir.',
      location: 'Pintu Gerbang Utama, Pos Penjagaan & Seluruh Akses Gedung Sekolah',
      volumeUnit: '2 gerbang utama & 24 ruang kelas/gedung',
      timeStart: '05:45',
      timeEnd: '17:00',
      notes: 'Gembok rantai dan anak kunci tersimpan aman pada kotak kunci pos keamanan.'
    },
    {
      category: 'keamanan',
      title: 'Membuka Pintu Gerbang Utama & Akses Seluruh Ruangan Pagi Hari',
      description: 'Membuka gembok rantai gerbang utama dan pagar samping, membuka pintu lobi utama, ruang guru, ruang TU, dan seluruh ruang kelas sebelum kedatangan guru serta siswa, dan menyalakan lampu selasar yang diperlukan.',
      location: 'Pintu Gerbang Utama, Pagar Samping & Akses Gedung Kelas A-C',
      volumeUnit: '2 unit gerbang & 24 pintu gedung/kelas',
      timeStart: '05:45',
      timeEnd: '06:30',
      notes: 'Seluruh akses pintu telah terbuka rapi, area koridor steril dan siap untuk aktivitas belajar.'
    },
    {
      category: 'keamanan',
      title: 'Menutup dan Mengunci Pintu Gerbang serta Seluruh Ruangan Gedung Sore Hari',
      description: 'Memeriksa sterilisasi seluruh ruang kelas dan kantor pasca KBM dan ekstrakurikuler, mematikan saklar listrik/AC/kipas angin yang tertinggal, mengunci seluruh pintu berteralis, serta menutup dan menggembok rantai gerbang utama.',
      location: 'Gedung Kelas A, B, C, Ruang Kantor & Pintu Gerbang Utama',
      volumeUnit: '2 unit gerbang & 24 pintu gedung/kelas',
      timeStart: '16:00',
      timeEnd: '17:15',
      notes: 'Seluruh ruangan telah dikunci rapat dan gerbang utama digembok rantai pengaman ganda.'
    },
    {
      category: 'keamanan',
      title: 'Buka dan Tutup Pintu Gerbang Pengendalian Akses Keluar-Masuk Jam KBM',
      description: 'Menutup gerbang utama tepat saat bel masuk jam 07:00, membuka secara selektif untuk penanganan tamu kedinasan atau siswa berkepentingan khusus dengan surat izin guru piket, serta mencegah pihak luar tanpa identitas memasuki lingkungan sekolah.',
      location: 'Pos Penjagaan & Pintu Gerbang Utama',
      volumeUnit: '1 shift KBM (pengendalian pintu gerbang)',
      timeStart: '07:00',
      timeEnd: '14:30',
      notes: 'Tamu kedinasan dicatat di buku tamu dan diberikan ID Card Tamu resmi.'
    },
    {
      category: 'keamanan',
      title: 'Patroli Keamanan Malam & Pengecekan Kunci Seluruh Gedung',
      description: 'Melaksanakan patroli mengelilingi seluruh blok gedung kelas, ruang guru, lab komputer, dan perpustakaan. Memastikan semua pintu berteralis dan jendela terkunci rapat serta lampu penerangan menyala.',
      location: 'Blok Gedung A, B, C & Laboratorium',
      volumeUnit: '12 titik pos & 24 ruang kelas',
      timeStart: '21:00',
      timeEnd: '23:30',
      notes: 'Gerbang utama digembok ganda, situasi aman terkendali.'
    },
    {
      category: 'inspeksi_malam',
      title: 'Inspeksi & Ronda Malam Pukul 02:00 di Area Rawan Belakang Gedung',
      description: 'Melakukan ronda pengecekan pagar pembatas belakang, instalasi genset, panel MCB listrik induk, dan gudang sapras untuk mencegah penyusup dan korsleting listrik.',
      location: 'Pagar Belakang, Gardu MCB & Gudang Sapras',
      volumeUnit: '1 sesi ronda malam (8 titik pantau)',
      timeStart: '01:45',
      timeEnd: '03:00',
      notes: 'Situasi hening dan aman, tidak ada tanda-tanda mencurigakan.'
    },
    {
      category: 'protokoler_tamu',
      title: 'Penerimaan Tamu Dinas, Pemeriksaan Identitas & Pengaturan Parkir',
      description: 'Menerima tamu dinas dari Pengawas Sekolah dan instansi mitra di pos gerbang, mencatat identitas di buku tamu keamanan, memberikan tanda pengenal (ID Card Tamu), dan mengarahkan parkir.',
      location: 'Pos Penjagaan Gerbang Utama & Area Parkir',
      volumeUnit: '8 kendaraan & 12 tamu kedinasan',
      timeStart: '08:00',
      timeEnd: '10:30',
      notes: 'Tamu terlayani dengan ramah dan tertib sesuai SOP keamanan.'
    },
    {
      category: 'tanggap_darurat',
      title: 'Pengecekan Kesiapan Tabung APAR & Sterilisasi Saluran Pasca Hujan Lebat',
      description: 'Memeriksa tekanan jarum manometer 6 tabung APAR di laboratorium dan kantor, serta membersihkan sampah daun yang menyumbat grill saluran drainase saat hujan deras.',
      location: 'Laboratorium IPA/TIK & Selokan Utama Depan',
      volumeUnit: '6 unit APAR & 50 m saluran drainase',
      timeStart: '13:00',
      timeEnd: '14:30',
      notes: 'Semua APAR dalam tekanan hijau siap pakai, air surut normal.'
    },
    {
      category: 'pengawasan_anak',
      title: 'Pengawasan Kedatangan Siswa & Penyeberangan Jalan Raya Pagi',
      description: 'Mengatur ketertiban siswa yang turun dari angkutan/kendaraan orang tua, membantu menyeberang jalan raya di depan gerbang utama dan memastikan siswa memakai seragam lengkap serta helm.',
      location: 'Pintu Gerbang Utama & Zebra Cross Depan Sekolah',
      volumeUnit: '± 450 siswa & 80 kendaraan',
      timeStart: '06:15',
      timeEnd: '07:15',
      notes: 'Lalu lintas lancar tertib, tidak ada insiden.'
    },
    {
      category: 'pengawasan_anak',
      title: 'Pengawasan Jam Istirahat & Sterilisasi Batas Pagar Belakang',
      description: 'Memantau aktivitas siswa saat jam istirahat di kantin dan lapangan olahraga, memastikan tidak ada siswa memanjat pagar atau jajan di luar batas gerbang sekolah.',
      location: 'Kantin Sekolah & Pagar Batas Belakang',
      volumeUnit: '1 sesi istirahat (seluruh siswa)',
      timeStart: '09:45',
      timeEnd: '10:15',
      notes: 'Situasi tertib kondusif.'
    },
    {
      category: 'perbaikan_sapras',
      title: 'Perbaikan Engsel Pintu Kelas & Penggantian Kran Air Wastafel',
      description: 'Memperbaiki engsel pintu kelas yang longgar dengan sekrup baja baru serta mengganti kran air wastafel siswa yang bocor agar tidak membuang air bersih.',
      location: 'Ruang Kelas & Selasar Wastafel',
      volumeUnit: '1 pintu kelas & 2 kran air',
      timeStart: '13:30',
      timeEnd: '15:15',
      notes: 'Kran baru berfungsi lancar tanpa rembesan.'
    },
    {
      category: 'perbaikan_sapras',
      title: 'Penggantian Lampu LED Koridor & Pengecekan Saklar Listrik',
      description: 'Mengganti bohlam lampu LED yang mati di koridor kelas lantai 2 dan memeriksa kerapian penutup saklar listrik untuk keselamatan siswa.',
      location: 'Koridor Kelas Lantai 2',
      volumeUnit: '4 unit lampu LED 18W',
      timeStart: '14:00',
      timeEnd: '15:00',
      notes: 'Penerangan koridor kembali terang maksimal.'
    },
    {
      category: 'lingkungan',
      title: 'Pemangkasan Dahan Pohon Rindang Dekat Kabel Listrik Lapangan',
      description: 'Memotong ranting dan dahan pohon trembesi yang mulai mendekati bentangan kabel listrik PLN di tepi lapangan upacara demi keselamatan warga sekolah.',
      location: 'Area Pojok Lapangan Upacara Sekolah',
      volumeUnit: '3 pohon & 1 mobil bak ranting',
      timeStart: '08:30',
      timeEnd: '11:00',
      notes: 'Dahan kayu dirapikan dan sampah daun dibersihkan.'
    },
    {
      category: 'lingkungan',
      title: 'Pembersihan Rumput Liar Lapangan Upacara & Selokan Saluran Air',
      description: 'Memotong rumput liar menggunakan mesin pemotong rumput di pinggiran lapangan upacara dan mengeruk endapan lumpur got saluran pembuangan air hujan.',
      location: 'Lapangan Upacara & Drainase Timur',
      volumeUnit: '± 200 meter saluran drainase',
      timeStart: '08:00',
      timeEnd: '10:30',
      notes: 'Saluran air bersih mengalir lancar bebas genangan.'
    },
    {
      category: 'antar_surat',
      title: 'Pengantaran Surat Dinas Usulan Kebutuhan Sapras ke Disdik',
      description: 'Mengantarkan berkas fisik Surat Dinas perihal usulan sarana prasarana sekolah dan mengambil tanda terima berkas dari bagian Umum Dinas Pendidikan.',
      location: 'Kantor Dinas Pendidikan Kota/Kabupaten',
      volumeUnit: '1 berkas surat penting beramplop dinas',
      timeStart: '09:00',
      timeEnd: '11:30',
      notes: 'Tanda terima ekspedisi surat dinas terlampir lengkap.'
    }
  ],
  TU: [
    {
      category: 'kepegawaian',
      title: 'Pemberkasan Kenaikan Pangkat Pilihan Guru & Verifikasi Data BKN',
      description: 'Memeriksa kelengkapan berkas SK Kenaikan Pangkat, PAK, dan SKP 2 tahun terakhir untuk guru ASN dan mengunggah dokumen digital ke aplikasi SIASN BKN.',
      location: 'Ruang Tata Usaha (Meja Kepegawaian)',
      volumeUnit: '4 berkas ASN guru',
      timeStart: '08:00',
      timeEnd: '11:30',
      notes: 'Semua berkas tervalidasi dan berstatus disetujui instansi.'
    },
    {
      category: 'kepegawaian',
      title: 'Rekapitulasi Absensi Fingerprint Bulanan GTK & Pengajuan Gaji/Tukin',
      description: 'Mengunduh data rekap kehadiran elektronik fingerprint guru dan tenaga kependidikan, memverifikasi surat izin/sakit, dan menyusun laporan disiplin kehadiran bulanan.',
      location: 'Ruang Tata Usaha',
      volumeUnit: '48 orang Guru & Tenaga Kependidikan',
      timeStart: '08:30',
      timeEnd: '11:00',
      notes: 'Laporan kehadiran diserahkan ke bendahara gaji.'
    },
    {
      category: 'kepegawaian',
      title: 'Pengurusan Berkas Kenaikan Gaji Berkala (KGB) Guru dan Staf ASN',
      description: 'Memeriksa masa kerja golongan pada SK terakhir, menghitung jadwal TMT berkala, dan mencetak konsep Surat Keterangan Kenaikan Gaji Berkala (KGB) untuk disahkan Dinas Pendidikan.',
      location: 'Ruang Tata Usaha (Meja Kepegawaian)',
      volumeUnit: '3 berkas KGB pegawai',
      timeStart: '09:00',
      timeEnd: '11:30',
      notes: 'Berkas KGB siap diajukan ke dinas pendidikan.'
    },
    {
      category: 'kepegawaian',
      title: 'Penyusunan SK Pembagian Tugas Mengajar & Roster Jadwal Pelajaran',
      description: 'Menyusun draf Surat Keputusan (SK) Kepala Sekolah perihal Pembagian Tugas Mengajar dan Bimbingan Konseling Semester baru lengkap dengan lampiran jam ekuivalen guru.',
      location: 'Ruang Tata Usaha',
      volumeUnit: '1 bundel SK & lampiran roster (36 guru)',
      timeStart: '10:00',
      timeEnd: '14:00',
      notes: 'Draf SK telah dikoreksi dan ditandatangani Kepala Sekolah.'
    },
    {
      category: 'kepegawaian',
      title: 'Pelayanan Administrasi Pengajuan Cuti (Tahunan / Sakit / Melahirkan) GTK',
      description: 'Menerima formulir permohonan cuti dari tenaga pendidik, memeriksa sisa hak cuti tahun berjalan, dan memproses persetujuan cuti melalui lembar rekomendasi.',
      location: 'Ruang Tata Usaha',
      volumeUnit: '2 pengajuan permohonan cuti',
      timeStart: '08:30',
      timeEnd: '10:00',
      notes: 'Surat izin cuti telah diterbitkan dan diarsipkan.'
    },
    {
      category: 'siswa',
      title: 'Penerbitan Surat Keterangan Siswa Aktif & Pengurusan PIP/KIP/KJP',
      description: 'Memproses permohonan penerbitan surat keterangan aktif belajar untuk siswa penerima bantuan Program Indonesia Pintar (PIP) dan keperluan beasiswa perguruan tinggi.',
      location: 'Loket Pelayanan Tata Usaha',
      volumeUnit: '12 lembar surat keterangan',
      timeStart: '08:30',
      timeEnd: '12:00',
      notes: 'Telah ditandatangani dan dicap stempel dinas.'
    },
    {
      category: 'siswa',
      title: 'Pencatatan Mutasi Masuk Siswa & Pembaruan Buku Induk Kesiswaan',
      description: 'Menerima berkas mutasi siswa pindahan dari luar kota, memeriksa legalitas surat pindah dari dinas asal, dan meregister data identitas ke Buku Induk Sekolah serta Dapodik.',
      location: 'Meja Kesiswaan Ruang TU',
      volumeUnit: '2 siswa mutasi masuk',
      timeStart: '10:00',
      timeEnd: '12:30',
      notes: 'Nomor Register Induk Siswa telah diterbitkan.'
    },
    {
      category: 'siswa',
      title: 'Pemrosesan Surat Keterangan Mutasi Keluar Siswa ke Sekolah Tujuan',
      description: 'Memeriksa berkas permohonan pindah sekolah dari orang tua siswa, menerbitkan Surat Keterangan Mutasi Keluar dinas, dan melepas data siswa pada sistem Dapodikdasmen.',
      location: 'Loket Pelayanan Kesiswaan TU',
      volumeUnit: '1 berkas mutasi keluar',
      timeStart: '09:00',
      timeEnd: '11:00',
      notes: 'Buku rapor dan surat mutasi telah diserahkan ke wali murid.'
    },
    {
      category: 'siswa',
      title: 'Penatausahaan & Legalisir Buku Rapor, SKL, dan Ijazah Alumni',
      description: 'Melayani alumni yang memerlukan legalisir fotokopi ijazah kelulusan dan rapor, mencocokkan fisik dokumen dengan arsip buku register kelulusan sekolah.',
      location: 'Loket Pelayanan Tata Usaha',
      volumeUnit: '15 berkas legalisir ijazah',
      timeStart: '08:30',
      timeEnd: '11:30',
      notes: 'Stempel legalisir dan nomor register dinas tertera jelas.'
    },
    {
      category: 'siswa',
      title: 'Verifikasi Biodata Siswa dan Penertiban Nomor Induk Siswa Nasional (NISN)',
      description: 'Memeriksa kesesuaian akta kelahiran dan kartu keluarga dengan data peserta didik baru pada sistem Verval PD Kemendikbudristek untuk penerbitan NISN resmi.',
      location: 'Meja Kesiswaan & Komputer TU',
      volumeUnit: '24 data peserta didik',
      timeStart: '13:00',
      timeEnd: '15:30',
      notes: 'Data NISN valid dan sinkron dengan Dukcapil.'
    },
    {
      category: 'surat_masuk',
      title: 'Pencatatan Buku Agenda Surat Masuk & Pengajuan Disposisi Kepala Sekolah',
      description: 'Menerima surat dinas dari instansi luar, memberi nomor agenda masuk, mengunggah salinan digital scan, dan menyusun lembar disposisi untuk arahan Kepala Sekolah.',
      location: 'Ruang TU & Meja Kepala Sekolah',
      volumeUnit: '6 surat dinas masuk',
      timeStart: '09:00',
      timeEnd: '10:30',
      notes: 'Surat telah didisposisikan kepada masing-masing penanggung jawab.'
    },
    {
      category: 'surat_masuk',
      title: 'Pengarsipan Digital Dokumen Masuk dari Dinas Pendidikan & Kemenag',
      description: 'Memindai surat keputusan, edaran dinas, dan juknis lomba ke format PDF, menamai file secara sistematis dan mengarsipkan ke Google Drive kedinasan sekolah.',
      location: 'Meja Kearsipan Ruang TU',
      volumeUnit: '10 dokumen digital (PDF)',
      timeStart: '13:30',
      timeEnd: '15:00',
      notes: 'Tersimpan rapi di folder e-Arsip Dokumen 2026.'
    },
    {
      category: 'surat_keluar',
      title: 'Pembuatan Surat Edaran Pertemuan Wali Murid & Undangan Komite',
      description: 'Mengetik konsep surat dinas undangan pertemuan wali murid, memproses nomor surat keluar dinas, serta melayani penggandaan dan pendistribusian.',
      location: 'Ruang Tata Usaha',
      volumeUnit: '1 nomor surat (800 exp eksemplar)',
      timeStart: '13:00',
      timeEnd: '15:30',
      notes: 'Arsip fisik tersimpan di odner persuratan dinas.'
    },
    {
      category: 'surat_keluar',
      title: 'Penerbitan Surat Perintah Tugas Kedinasan (SPPD) Pelatihan Guru & Kepsek',
      description: 'Mengetik Surat Tugas dan lembar SPPD bagi guru yang mengikuti diklat/workshop di tingkat kabupaten/kota, mencatat nomor registrasi surat keluar dinas.',
      location: 'Ruang Tata Usaha',
      volumeUnit: '4 lembar Surat Tugas & SPPD',
      timeStart: '09:30',
      timeEnd: '11:00',
      notes: 'Surat telah ditandatangani Kepala Sekolah dan dicap resmi.'
    },
    {
      category: 'sapras',
      title: 'Inventarisasi Barang Milik Daerah (KIB B & KIB E) Semester Berjalan',
      description: 'Pengecekan fisik aset sarana prasarana sekolah (laptop, proyektor LCD, printer kantor), pencocokan nomor barcode register, dan pembaruan Buku Induk Barang Milik Daerah.',
      location: 'Lab Komputer & Ruang TU',
      volumeUnit: '35 unit aset TIK & kantor',
      timeStart: '10:00',
      timeEnd: '14:00',
      notes: '33 unit Baik, 2 unit perlu perbaikan ringan.'
    },
    {
      category: 'sapras',
      title: 'Pembaruan Kartu Inventaris Ruangan (KIR) Kelas dan Laboratorium',
      description: 'Mencetak dan menempelkan lembar Kartu Inventaris Ruangan (KIR) baru yang telah dimutakhirkan di balik pintu ruang kelas 7A-7D dan ruang laboratorium IPA.',
      location: 'Ruang Kelas 7A-7D & Lab IPA',
      volumeUnit: '5 lembar KIR Ruangan',
      timeStart: '11:00',
      timeEnd: '13:30',
      notes: 'KIR ditandatangani penanggung jawab ruangan dan disahkan.'
    },
    {
      category: 'keuangan_bos',
      title: 'Rekonsiliasi Buku Kas Umum (BKU) BOS Reguler & Verifikasi Kuitansi SPJ',
      description: 'Mencocokkan transaksi penerimaan dan pengeluaran dana BOS reguler dengan bukti kuitansi toko/rekanan belanja modal dan barang habis pakai bulan berjalan.',
      location: 'Meja Keuangan / BOS Ruang TU',
      volumeUnit: '18 lembar bukti kuitansi & faktur',
      timeStart: '09:00',
      timeEnd: '12:30',
      notes: 'Saldo BKU sinkron dengan rekening giro penampungan BOS.'
    },
    {
      category: 'keuangan_bos',
      title: 'Input dan Sinkronisasi Transaksi Belanja Dana BOS pada Aplikasi ARKAS',
      description: 'Menginput realisasi belanja kertas, toner printer, dan pemeliharaan komputer sekolah ke dalam sistem Aplikasi Rencana Kegiatan dan Anggaran Sekolah (ARKAS).',
      location: 'Komputer Server ARKAS Ruang TU',
      volumeUnit: '1 periode pelaporan belanja triwulan',
      timeStart: '13:00',
      timeEnd: '15:30',
      notes: 'Sinkronisasi ARKAS berstatus sukses terhubung ke dinas.'
    },
    {
      category: 'dapodik',
      title: 'Pemutakhiran Data Pokok Pendidikan (Dapodik) & Validasi Data Rombel',
      description: 'Melakukan pemutakhiran data sarana prasarana, nomor HP peserta didik, dan pemetaan rombongan belajar semester berjalan pada aplikasi Dapodikdasmen.',
      location: 'Server Dapodik Ruang TU',
      volumeUnit: '18 rombel & 48 GTK',
      timeStart: '08:00',
      timeEnd: '11:30',
      notes: 'Validasi lokal tanpa invalid error, siap disinkronisasikan.'
    },
    {
      category: 'kearsipan',
      title: 'Penataan Odner Arsip Dokumen Sekolah & Pemilahan Berkas Inaktif',
      description: 'Menata ordner surat dinas, berkas kepegawaian, dan dokumen akreditasi sekolah berdasarkan kode klasifikasi kearsipan nasional di lemari arsip TU.',
      location: 'Ruang Arsip & Tata Usaha',
      volumeUnit: '8 ordner arsip dokumen dinas',
      timeStart: '13:00',
      timeEnd: '15:00',
      notes: 'Arsip tersusun rapi sesuai label indeks abjad dan tahun.'
    },
    {
      category: 'layanan_umum',
      title: 'Notulensi Rapat Dinas Dewan Guru & Pengelolaan Buku Tamu Kedinasan',
      description: 'Mencatat notulen hasil keputusan rapat koordinasi bulanan dewan guru, menyiapkan daftar hadir peserta rapat, dan melayani tamu dinas di lobi TU.',
      location: 'Ruang Rapat Guru & Lobi TU',
      volumeUnit: '1 dokumen notulen rapat dinas',
      timeStart: '10:00',
      timeEnd: '12:30',
      notes: 'Notulen telah diketik rapi dan dibagikan ke seluruh peserta rapat.'
    }
  ],
  SERVICE: [
    {
      category: 'kebersihan_wc',
      title: 'Pembersihan & Disinfeksi Menyeluruh Toilet Siswa dan Guru Pagi Hari',
      description: 'Menguras bak penampungan air, menyikat lantai dan dinding keramik dengan cairan pembersih kerak, menyemprotkan disinfektan antibakteri, dan mengisi sabun cair cuci tangan.',
      location: 'Toilet Siswa Putra, Toilet Siswa Putri & Toilet Guru',
      volumeUnit: '8 bilik toilet & 4 wastafel',
      timeStart: '06:00',
      timeEnd: '07:30',
      notes: 'Air mengalir lancar, lantai kering, wangi cemara segar.'
    },
    {
      category: 'kebersihan_wc',
      title: 'Sanitasi Sore & Pengisian Tandon Bak Air Toilet Siswa',
      description: 'Pengecekan sanitasi toilet setelah kegiatan belajar mengajar selesai, pengepelan lantai basah, pengisian tandon air penampungan, dan mematikan kran air yang menetes.',
      location: 'Toilet Siswa Lantai 1 & Lantai 2',
      volumeUnit: '8 bilik toilet',
      timeStart: '15:00',
      timeEnd: '16:00',
      notes: 'Toilet bersih steril dan siap pakai esok hari.'
    },
    {
      category: 'kebersihan_kantor',
      title: 'Pembersihan Debu, Meja Kerja & Pel Lantai Ruang Pimpinan / Guru',
      description: 'Menyapu dan mengepel lantai Ruang Kepala Sekolah, Ruang Guru dan Ruang TU dengan cairan pembersih wangi karbol, mengelap debu meja kerja staf dan kaca jendela.',
      location: 'Ruang Kepala Sekolah, Ruang Guru & Ruang TU',
      volumeUnit: '3 ruangan besar (± 250 m²)',
      timeStart: '06:45',
      timeEnd: '08:30',
      notes: 'Ruangan bersih steril siap digunakan jam kerja.'
    },
    {
      category: 'kebersihan_kantor',
      title: 'Pembersihan Ruang Perpustakaan & Ruang Rapat Aula Sekolah',
      description: 'Menyedot debu karpet aula, membersihkan rak buku dari debu, mengepel lantai keramik selasar, dan membersihkan kaca lemari etalase piala penghargaan.',
      location: 'Perpustakaan Lt. 2 & Aula Serbaguna',
      volumeUnit: '2 ruangan auditorium/buku',
      timeStart: '13:00',
      timeEnd: '15:15',
      notes: 'Aula bersih rapi siap digunakan rapat.'
    },
    {
      category: 'kebersihan_sampah',
      title: 'Pengambilan Sampah Ruang Kelas, Pemilahan Organik & Angkut ke TPS',
      description: 'Mengosongkan tempat sampah di seluruh ruang kelas dan lorong selasar, memilah sampah plastik botol/cup daur ulang, membuang sampah organik ke komposter, dan residu ke TPS.',
      location: 'Seluruh Koridor Kelas & TPS Sementara Sekolah',
      volumeUnit: '6 gerobak sampah (± 45 kg)',
      timeStart: '12:30',
      timeEnd: '14:30',
      notes: 'Kantin dan selasar bersih bebas tumpukan sampah.'
    },
    {
      category: 'kebersihan_halaman',
      title: 'Penyapuan Halaman Utama, Lapangan Upacara & Selasar Depan Kelas',
      description: 'Menyapu guguran daun kering di halaman upacara dan selasar depan kelas, membersihkan abu rokok dan debu di koridor utama sebelum apel pagi dimulai.',
      location: 'Halaman Lapangan Upacara & Selasar Gedung A-B',
      volumeUnit: '± 800 m² area terbuka',
      timeStart: '06:15',
      timeEnd: '07:00',
      notes: 'Halaman bersih dan rapi sebelum kegiatan belajar dimulai.'
    },
    {
      category: 'sanitasi_disinfeksi',
      title: 'Penyemprotan Disinfektan & Pembersihan Ruang UKS serta Musholla',
      description: 'Mensterilkan tempat tidur ruang UKS, mengganti sprei kasur periksa, menyedot debu karpet musholla sekolah, dan membersihkan tempat wudhu dari lumut keramik.',
      location: 'Ruang UKS & Musholla Baitul Ilmi Sekolah',
      volumeUnit: '2 unit ruangan fasilitas ibadah & kesehatan',
      timeStart: '10:00',
      timeEnd: '11:45',
      notes: 'Musholla wangi bersih, karpet bebas debu, tempat wudhu tidak licin.'
    },
    {
      category: 'perawatan_taman',
      title: 'Penyiraman Tanaman Hias Pot & Pembersihan Gulma di Taman Depan',
      description: 'Menyiram tanaman hias puring, aglaonema dan pucuk merah di sepanjang selasar serta mencabuti rumput teki/gulma liar di taman depan lobi sekolah.',
      location: 'Taman Lobi Depan & Pot Tanaman Selasar',
      volumeUnit: '45 pot tanaman & 1 petak taman lobi',
      timeStart: '07:15',
      timeEnd: '08:15',
      notes: 'Tanaman segar terawat, tanah gembur.'
    },
    {
      category: 'penyediaan_air',
      title: 'Pengecekan Mesin Pompa Air, Tandon Puncak & Kebersihan Bak Penampung',
      description: 'Memeriksa otomatis radar pompa air sumur bor, memastikan tandon air utama terisi penuh dan memeriksa kran-kran air agar tidak ada rembesan kebocoran.',
      location: 'Menara Tandon Air & Ruang Pompa',
      volumeUnit: '2 tandon 1000L & 1 unit pompa jet pump',
      timeStart: '14:00',
      timeEnd: '14:45',
      notes: 'Pasokan air bersih untuk wudhu dan toilet terjamin aman lancar.'
    }
  ],
  PERPUS: [
    {
      category: 'katalogisasi_buku',
      title: 'Katalogisasi & Perekaman Barcode Buku Pelajaran Kurikulum Merdeka',
      description: 'Melakukan registrasi buku induk, penentuan klasifikasi DDC, pencetakan barcode, dan penempelan label punggung buku teks pelajaran kelas 7, 8, dan 9.',
      location: 'Ruang Pengolahan Perpustakaan',
      volumeUnit: '80 eksemplar buku teks',
      timeStart: '08:00',
      timeEnd: '10:30',
      notes: 'Buku telah terdata pada sistem katalog digital OPAC dan siap diedarkan.'
    },
    {
      category: 'katalogisasi_buku',
      title: 'Pengolahan dan Klasifikasi DDC Buku Pengayaan & Referensi Umum',
      description: 'Menetapkan nomor klasifikasi Dewey Decimal Classification (DDC) untuk koleksi buku fiksi remaja, ensiklopedia sains, dan kamus referensi baru.',
      location: 'Meja Kerja Pengolahan Bahan Pustaka',
      volumeUnit: '50 judul buku pengayaan',
      timeStart: '10:30',
      timeEnd: '12:00',
      notes: 'Label punggung dan lembar tanggal kembali terpasang rapi.'
    },
    {
      category: 'sirkulasi_peminjaman',
      title: 'Pelayanan Sirkulasi Peminjaman Mandiri Buku Peserta Didik',
      description: 'Melayani transaksi peminjaman buku oleh siswa pada jam istirahat sekolah menggunakan barcode scanner, serta validasi masa pinjam 7 hari.',
      location: 'Meja Layanan Sirkulasi Perpustakaan',
      volumeUnit: '65 transaksi peminjaman',
      timeStart: '09:30',
      timeEnd: '10:30',
      notes: 'Seluruh transaksi tercatat otomatis di sistem sirkulasi digital.'
    },
    {
      category: 'sirkulasi_peminjaman',
      title: 'Pelayanan Pengembalian Buku, Pemeriksaan Kerusakan & Shelving ke Rak',
      description: 'Menerima pengembalian buku pinjaman siswa, memeriksa kelengkapan halaman dan keutuhan cover, serta menyusun kembali (shelving) buku ke rak koleksi sesuai nomor panggil.',
      location: 'Meja Sirkulasi & Rak Buku Koleksi',
      volumeUnit: '45 eksemplar buku dikembalikan',
      timeStart: '12:30',
      timeEnd: '14:00',
      notes: 'Buku telah dikembalikan ke rak masing-masing tanpa ada yang salah letak.'
    },
    {
      category: 'layanan_literasi',
      title: 'Pendampingan Gerakan Literasi Sekolah (GLS) 15 Menit Membaca Siswa',
      description: 'Memandu dan mendampingi kegiatan literasi pagi siswa di ruang perpustakaan dan pojok baca, memberikan rekomendasi buku fiksi/sains yang edukatif.',
      location: 'Ruang Baca Utama Perpustakaan',
      volumeUnit: '2 rombel kelas (64 siswa)',
      timeStart: '07:15',
      timeEnd: '08:00',
      notes: 'Siswa aktif membuat rangkuman jurnal membaca mingguan.'
    },
    {
      category: 'layanan_literasi',
      title: 'Penataan Pojok Baca Tematik & Display Rekomendasi Buku Minggu Ini',
      description: 'Menata lemari display akrilik putar di lobi perpustakaan dengan tema buku sains populer dan fiksi sastra inspiratif untuk menarik minat baca peserta didik.',
      location: 'Lobi Masuk & Sudut Baca Lesehan',
      volumeUnit: '1 display tema sains & 25 buku pilihan',
      timeStart: '13:30',
      timeEnd: '14:30',
      notes: 'Buku display langsung diminati siswa saat jam istirahat.'
    },
    {
      category: 'perawatan_buku',
      title: 'Restorasi Fisik, Penjilidan Ulang & Laminasi Cover Buku Rusak',
      description: 'Melakukan perbaikan fisik buku ensiklopedia dan kamus tebal yang lepas jahitan covernya menggunakan lem jilid khusus, lakban kain, dan plastik mika tebal.',
      location: 'Ruang Restorasi & Preservasi Koleksi',
      volumeUnit: '15 eksemplar buku referensi',
      timeStart: '13:00',
      timeEnd: '15:15',
      notes: 'Kondisi buku kembali kokoh dan layak dibaca kembali oleh pemustaka.'
    },
    {
      category: 'perawatan_buku',
      title: 'Pembersihan Debu Rak Buku dan Penataan Kerapihan Koleksi Sesuai DDC',
      description: 'Menyedot debu di sela-sela buku dan papan rak koleksi menggunakan lap mikrofiber dan vacuum mini, serta merapikan penjepit buku (bookend).',
      location: 'Lorong Rak Koleksi 000 - 900',
      volumeUnit: '8 rak buku dua muka',
      timeStart: '08:30',
      timeEnd: '10:00',
      notes: 'Area rak bersih, bebas debu dan teratur rapi.'
    },
    {
      category: 'stock_opname',
      title: 'Stock Opname Fisik Koleksi Rak Buku Fiksi & Pencocokan Buku Induk',
      description: 'Melakukan inventarisasi fisik buku secara berkala mencocokkan nomor barcode buku pada rak dengan database buku induk perpustakaan untuk mendeteksi buku hilang atau rusak.',
      location: 'Rak Koleksi Sastra & Fiksi (Rak 2-4)',
      volumeUnit: '320 eksemplar buku fiksi',
      timeStart: '10:00',
      timeEnd: '12:30',
      notes: 'Tercatat 312 eksemplar tersedia di rak, 8 eksemplar dalam peminjaman aktif.'
    },
    {
      category: 'administrasi_perpus',
      title: 'Pencetakan & Distribusi Kartu Anggota Perpustakaan Berbarcode Siswa Baru',
      description: 'Mencetak kartu anggota perpustakaan digital dengan nomor barcode NISN, melaminasi kartu, dan mendistribusikan kepada peserta didik kelas 7.',
      location: 'Ruang Komputer Administrasi Perpustakaan',
      volumeUnit: '120 kartu perpustakaan terbit',
      timeStart: '08:30',
      timeEnd: '11:30',
      notes: 'Siswa baru kini dapat meminjam buku secara mandiri di loket perpustakaan.'
    },
    {
      category: 'administrasi_perpus',
      title: 'Penerbitan Surat Keterangan Bebas Pustaka & Rekapitulasi Statistik Bulanan',
      description: 'Memeriksa tanggungan buku pinjaman siswa yang mutasi/lulus, menerbitkan surat bebas pinjam perpus, serta menyusun rekapitulasi data peminjam bulanan.',
      location: 'Loket Administrasi Perpustakaan',
      volumeUnit: '1 dokumen statistik & 14 surat bebas pinjam',
      timeStart: '14:00',
      timeEnd: '15:30',
      notes: 'Laporan statistik telah diserahkan kepada Kepala Sekolah dan Koordinator Kurikulum.'
    }
  ],
  LAB_IPA: [
    {
      category: 'persiapan_praktikum',
      title: 'Penyiapan Mikroskop Siswa & Kaca Preparat Jaringan Tumbuhan Kelas 8',
      description: 'Menyiapkan 12 unit mikroskop siswa monokuler LED, kaca objek, kaca penutup, silet preparat, pipet tetes, dan larutan pewarna metilen biru untuk praktikum stomata daun.',
      location: 'Ruang Laboratorium IPA (Meja 1-6)',
      volumeUnit: '12 set mikroskop & 24 preparat kaca',
      timeStart: '07:30',
      timeEnd: '09:00',
      notes: 'Lensa mikroskop bersih terpasang, preparat siap digunakan oleh 32 siswa.'
    },
    {
      category: 'persiapan_praktikum',
      title: 'Penyiapan Kit Praktikum Fisika Mekanika, Bidang Miring & Gaya Gesek',
      description: 'Menyiapkan balok gesek, neraca pegas 5N, papan luncur bidang miring, stopwatch digital dan beban gantung untuk kegiatan eksperimen hukum Newton kelas 7.',
      location: 'Meja Praktikum Fisika Lab IPA',
      volumeUnit: '8 set kit mekanika lengkap',
      timeStart: '09:30',
      timeEnd: '11:00',
      notes: 'Semua neraca pegas telah dicek titik nolnya sebelum digunakan.'
    },
    {
      category: 'persiapan_praktikum',
      title: 'Penyiapan Larutan Reagen Uji Nutrisi Makanan (Benedict, Biuret, Lugol)',
      description: 'Membuat dan menuangkan larutan reagen uji amilum (Lugol), glukosa (Benedict), dan protein (Biuret) ke botol pipet tetes, serta menyiapkan rak tabung reaksi dan pembakar spiritus.',
      location: 'Ruang Preparasi Laboratorium IPA',
      volumeUnit: '18 set tabung reaksi & 3 botol reagen',
      timeStart: '11:00',
      timeEnd: '12:30',
      notes: 'Bahan makanan sampel uji telah disiapkan higienis di wadah porselen.'
    },
    {
      category: 'pemeliharaan_alat',
      title: 'Pencucian, Sterilisasi & Pengeringan Alat Gelas Kimia Tabung Reaksi',
      description: 'Mencuci seluruh tabung reaksi, gelas kimia beaker, labu erlenmeyer, dan kaca arloji pasca praktikum menggunakan deterjen khusus lab, dibilas akuades dan dikeringkan pada rak.',
      location: 'Wastafel Laboratorium & Rak Pengering Kaca',
      volumeUnit: '48 tabung reaksi & 16 gelas beaker',
      timeStart: '13:00',
      timeEnd: '14:30',
      notes: 'Alat gelas bersih berkilau tanpa sisa noda bahan kimia.'
    },
    {
      category: 'pemeliharaan_alat',
      title: 'Pembersihan Lensa Mikroskop dengan Alkohol 70% & Kertas Lensa',
      description: 'Membersihkan minyak imersi dan debu pada lensa objektif serta lensa okuler mikroskop menggunakan kertas lensa khusus dan alkohol 70%, lalu disimpan kembali dalam lemari kaca berkering.',
      location: 'Lemari Instrumen Optik Lab IPA',
      volumeUnit: '16 unit mikroskop monokuler',
      timeStart: '14:30',
      timeEnd: '15:30',
      notes: 'Lensa optik jernih, kabel daya digulung rapi dan diberi kantong pelindung debu.'
    },
    {
      category: 'inventaris_bahan',
      title: 'Pemeriksaan Sisa Volume & Kedaluwarsa Bahan Kimia Lemari Khusus B3',
      description: 'Mengecek ketersediaan asam klorida (HCl), asam cuka (CH3COOH), larutan iodin, spirtus bakar, dan indikator lakmus merah/biru, serta memperbarui kartu stok lemari B3.',
      location: 'Lemari Khusus Bahan Kimia B3 Tahan Asam',
      volumeUnit: '24 botol bahan kimia & reagen',
      timeStart: '08:30',
      timeEnd: '10:00',
      notes: 'Penyimpanan terpisah antara bahan asam pekat dan zat mudah terbakar.'
    },
    {
      category: 'inventaris_bahan',
      title: 'Pemutakhiran Buku Inventaris Sarana Lab & Kartu Kendali Peminjaman Guru',
      description: 'Mencatat pengembalian alat peraga kit optik dan torso manusia oleh guru IPA, mengecek kelengkapan bagian, dan menginput ke log inventaris lab.',
      location: 'Meja Kerja Laboran IPA',
      volumeUnit: '4 kit peraga & 1 set torso anatomi',
      timeStart: '12:00',
      timeEnd: '13:15',
      notes: 'Semua alat peraga kembali lengkap dalam kondisi baik.'
    },
    {
      category: 'k3_laboratorium',
      title: 'Pemeriksaan Kesiapan Tabung Pemadam APAR & Kotak P3K Laboratorium',
      description: 'Memeriksa jarum tekanan gas pada tabung APAR 6 kg dry chemical, ketersediaan cairan pembersih mata (eye wash), obat luka bakar, perban kasa, dan plester di kotak P3K.',
      location: 'Dinding Lab IPA & Pos Kotak P3K',
      volumeUnit: '1 unit APAR & 1 kotak P3K lengkap',
      timeStart: '08:00',
      timeEnd: '09:00',
      notes: 'Indikator APAR berada di batas hijau, obat P3K belum ada yang kedaluwarsa.'
    },
    {
      category: 'k3_laboratorium',
      title: 'Pengelolaan Limbah Praktikum Asam-Basa dan Pengendapan Sedimen Netral',
      description: 'Mengumpulkan limbah sisa larutan uji praktikum ke dalam jerigen penampung limbah sementara, menetralkan pH dengan kapur tohor sebelum pembuangan ke bak filtrasi.',
      location: 'Area Pengolahan Limbah Cair Lab IPA',
      volumeUnit: '5 liter limbah cair praktikum',
      timeStart: '14:00',
      timeEnd: '15:15',
      notes: 'pH limbah akhir netral (pH 7), aman dan sesuai pedoman ramah lingkungan.'
    },
    {
      category: 'jadwal_lab',
      title: 'Penyusunan Jadwal Penggunaan Ruang Laboratorium IPA Semester Berjalan',
      description: 'Menyusun matriks jadwal praktikum mingguan bersama 4 orang guru mata pelajaran IPA agar penggunaan ruang dan pembagian kit alat peraga tidak terjadi tumpang tindih.',
      location: 'Ruang Persiapan Laboran IPA',
      volumeUnit: '18 jadwal kelas per minggu',
      timeStart: '10:00',
      timeEnd: '11:45',
      notes: 'Jadwal telah dicetak dan ditempel di pintu masuk lab dan ruang guru.'
    },
    {
      category: 'perbaikan_alat',
      title: 'Kalibrasi Titik Nol Neraca Ohaus 3 Lengan dan Neraca Pegas',
      description: 'Mengatur sekrup pengatur titik nol neraca 3 lengan Ohaus 311g serta membersihkan piringan timbangan dari karat atau serbuk debu agar hasil penimbangan praktikum presisi.',
      location: 'Meja Kalibrasi Alat Lab IPA',
      volumeUnit: '6 unit neraca Ohaus presisi',
      timeStart: '13:30',
      timeEnd: '15:00',
      notes: 'Semua neraca seimbang tepat pada garis nol skala utama.'
    }
  ]
};

// CSV Export and Import Utilities
export function exportTasksToCsv(tasks: TaskLog[]): string {
  const headers = ['id', 'role', 'date', 'category', 'title', 'description', 'location', 'timeStart', 'timeEnd', 'status', 'volumeUnit', 'petugas', 'notes'];
  const rows = tasks.map(t => [
    t.id,
    t.role,
    t.date,
    t.category,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.location || '').replace(/"/g, '""')}"`,
    t.timeStart,
    t.timeEnd,
    t.status,
    `"${(t.volumeUnit || '').replace(/"/g, '""')}"`,
    `"${(t.petugas || '').replace(/"/g, '""')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function parseTasksCsv(csvText: string, defaultRole: RoleType): Omit<TaskLog, 'id'>[] {
  const lines = csvText.split('\n').filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const results: Omit<TaskLog, 'id'>[] = [];
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Split by comma ignoring commas inside quotes
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null && matches.length < 13) {
      let val = match[1] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1).replace(/""/g, '"');
      }
      matches.push(val.trim());
      if (regex.lastIndex >= line.length) break;
    }

    if (matches.length >= 5) {
      results.push({
        role: (matches[1] as RoleType) || defaultRole,
        date: matches[2] || new Date().toISOString().split('T')[0],
        category: (matches[3] as any) || 'keamanan',
        title: matches[4] || 'Kegiatan Operasional',
        description: matches[5] || '',
        location: matches[6] || 'Sekolah',
        timeStart: matches[7] || '08:00',
        timeEnd: matches[8] || '10:00',
        status: (matches[9] as any) || 'selesai',
        volumeUnit: matches[10] || '1 kegiatan',
        petugas: matches[11] || 'Petugas Operasional',
        notes: matches[12] || ''
      });
    }
  }
  return results;
}

export function exportInventoryToCsv(items: InventoryItem[]): string {
  const headers = ['kodeBarang', 'namaBarang', 'merkModel', 'kategori', 'jumlah', 'satuan', 'kondisi', 'lokasiPenyimpanan', 'tahunPengadaan', 'keterangan'];
  const rows = items.map(i => [
    `"${(i.kodeBarang || '').replace(/"/g, '""')}"`,
    `"${(i.namaBarang || '').replace(/"/g, '""')}"`,
    `"${(i.merkModel || '').replace(/"/g, '""')}"`,
    `"${(i.kategori || '').replace(/"/g, '""')}"`,
    i.jumlah,
    `"${(i.satuan || 'Unit').replace(/"/g, '""')}"`,
    `"${(i.kondisi || 'Baik').replace(/"/g, '""')}"`,
    `"${(i.lokasiPenyimpanan || '').replace(/"/g, '""')}"`,
    i.tahunPengadaan || 2026,
    `"${(i.keterangan || '').replace(/"/g, '""')}"`
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function parseInventoryCsv(csvText: string, role: RoleType): Omit<InventoryItem, 'id'>[] {
  const lines = csvText.split('\n').filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const results: Omit<InventoryItem, 'id'>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null && matches.length < 10) {
      let val = match[1] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1).replace(/""/g, '"');
      }
      matches.push(val.trim());
      if (regex.lastIndex >= line.length) break;
    }

    if (matches.length >= 3) {
      results.push({
        role,
        kodeBarang: matches[0] || `INV-${role}-${Date.now()}`,
        namaBarang: matches[1] || 'Nama Barang',
        merkModel: matches[2] || '',
        kategori: matches[3] || 'Peralatan Dinas',
        jumlah: parseInt(matches[4]) || 1,
        satuan: matches[5] || 'Unit',
        kondisi: (matches[6] as any) || 'Baik',
        lokasiPenyimpanan: matches[7] || 'Gudang Sekolah',
        tahunPengadaan: parseInt(matches[8]) || new Date().getFullYear(),
        keterangan: matches[9] || ''
      });
    }
  }
  return results;
}
