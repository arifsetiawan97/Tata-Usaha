import { 
  SchoolConfig, 
  TaskLog, 
  InventoryItem, 
  MonthlyReport, 
  AnnualReport, 
  ArchiveDocument, 
  CustomCategory,
  LibraryBookItem,
  LibraryMemberItem,
  LibraryMemberStats
} from '../types';

export const initialSchoolConfig: SchoolConfig = {
  pemerintahDaerah: 'PEMERINTAH KABUPATEN / KOTA',
  dinasPendidikan: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  namaSekolah: 'SMP NEGERI SATU ATAP TELUK',
  npsn: '20202819',
  nss: '201020201004',
  alamat: 'Jalan Teluk Rt 15',
  desaKecamatan: '',
  kabupatenKota: 'Batang Hari',
  provinsi: '',
  kodePos: '16128',
  telepon: '(0251) 8321456',
  email: '',
  website: '',
  logoKabupatenUrl: '', // Will use inline SVG renderer if empty
  logoSekolahUrl: '',   // Will use inline SVG Tut Wuri Handayani if empty
  logoAplikasiUrl: '',  // Custom application logo (JPEG/PNG)
  stempelEnabled: true,
  stempelTextLine1: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  stempelTextLine2: 'SMP NEGERI SATU ATAP TELUK',
  kepalaSekolah: {
    nama: 'Dr. H. RAHMAT HIDAYAT, M.Pd.',
    nip: 'NIP. 19740510 199802 1 003',
    pangkatGolongan: 'Pembina Utama Muda, IV/c',
    jabatan: 'Kepala Sekolah',
    signatureType: 'script',
    signatureData: 'RahmatHidayat'
  },
  operatorProfiles: {
    TU: {
      nama: 'SITI MAISAROH, A.Md.',
      nip: 'NIPPK. 19930412 202321 2 018',
      pangkatGolongan: 'Pengatur, II/c',
      jabatan: 'Operator Administrasi Tata Usaha',
      signatureType: 'script',
      signatureData: 'SitiMaisaroh'
    },
    PENJAGA: {
      nama: 'BAMBANG KURNIAWAN',
      nip: 'NIPPK. 19880916 202421 1 032',
      pangkatGolongan: 'Juru Muda Tk. I, I/b',
      jabatan: 'Petugas Keamanan & Penjaga Sekolah',
      signatureType: 'script',
      signatureData: 'BambangK'
    },
    SERVICE: {
      nama: 'AGUS SUPRIYADI',
      nip: 'NIPPK. 19901103 202421 1 045',
      jabatan: 'Petugas Layanan Kebersihan / Service',
      signatureType: 'script',
      signatureData: 'AgusSupriyadi'
    },
    PERPUS: {
      nama: 'NURUL HIDAYATI, S.I.Pust.',
      nip: 'NIPPK. 19920815 202321 2 024',
      jabatan: 'Pengelola / Petugas Perpustakaan',
      signatureType: 'script',
      signatureData: 'NurulHidayati'
    },
    LAB_IPA: {
      nama: 'HENDRA PRASETYA, S.Pd.',
      nip: 'NIPPK. 19910320 202421 1 038',
      jabatan: 'Laboran / Pengelola Lab IPA',
      signatureType: 'script',
      signatureData: 'HendraPrasetya'
    }
  }
};

export const initialTasks: TaskLog[] = [
  // PENJAGA SEKOLAH TASKS
  {
    id: 'tsk-pjg-000',
    role: 'PENJAGA',
    date: '2026-09-25',
    category: 'keamanan',
    title: 'Buka dan Tutup Pintu Gerbang Utama serta Akses Gedung Sekolah',
    description: 'Melaksanakan SOP harian membuka pintu gerbang utama dan pintu ruangan kelas pukul 05:45 WIB, pengendalian buka-tutup gerbang selama jam KBM, serta menutup dan menggembok seluruh pintu gedung dan gerbang utama pukul 16:30 WIB.',
    location: 'Pintu Gerbang Utama & Seluruh Akses Gedung Sekolah',
    timeStart: '05:45',
    timeEnd: '16:45',
    status: 'selesai',
    volumeUnit: '2 gerbang utama & 24 pintu gedung/kelas',
    petugas: 'Bambang Kurniawan',
    notes: 'Kunci dan gembok terpasang aman pada kotak kunci pos keamanan, situasi tertib terkendali.'
  },
  {
    id: 'tsk-pjg-001',
    role: 'PENJAGA',
    date: '2026-09-25',
    category: 'keamanan',
    title: 'Patroli Keamanan Malam & Pengecekan Kunci Seluruh Gedung',
    description: 'Melaksanakan patroli mengelilingi 3 blok gedung kelas, laboratorium komputer, dan perpustakaan. Memastikan semua pintu berteralis dan jendela terkunci rapat serta lampu sorot menyala.',
    location: 'Blok Gedung A, B, C & Laboratorium',
    timeStart: '21:00',
    timeEnd: '23:30',
    status: 'selesai',
    volumeUnit: '12 titik pos & 24 ruang kelas',
    petugas: 'Bambang Kurniawan',
    notes: 'Kondisi gerbang utama digembok ganda, situasi aman kondusif.'
  },
  {
    id: 'tsk-pjg-002',
    role: 'PENJAGA',
    date: '2026-09-25',
    category: 'pengawasan_anak',
    title: 'Pengawasan Kedatangan Siswa & Penyeberangan Jalan Raya Pagi',
    description: 'Mengatur ketertiban siswa yang turun dari angkutan/kendaraan orang tua, membantu menyeberang jalan raya di depan gerbang utama dan memastikan siswa memakai seragam lengkap.',
    location: 'Pintu Gerbang Utama & Zebra Cross Depan Sekolah',
    timeStart: '06:15',
    timeEnd: '07:15',
    status: 'selesai',
    volumeUnit: '± 450 siswa dan 85 kendaraan',
    petugas: 'Bambang Kurniawan',
    notes: 'Arus lalu lintas lancar, tidak ada insiden.'
  },
  {
    id: 'tsk-pjg-003',
    role: 'PENJAGA',
    date: '2026-09-24',
    category: 'perbaikan_sapras',
    title: 'Perbaikan Engsel Pintu Kelas 7C dan Penggantian Kran Air Wastafel',
    description: 'Memperbaiki engsel pintu kelas 7C yang longgar menggunakan bor dan sekrup baru, serta mengganti 2 unit kran wastafel siswa yang bocor di lorong lantai 1.',
    location: 'Ruang Kelas 7C & Koridor Wastafel Barat',
    timeStart: '13:30',
    timeEnd: '15:15',
    status: 'selesai',
    volumeUnit: '1 pintu kelas & 2 kran air',
    petugas: 'Bambang Kurniawan',
    notes: 'Kran air baru berfungsi normal tanpa rembesan.'
  },
  {
    id: 'tsk-pjg-004',
    role: 'PENJAGA',
    date: '2026-09-23',
    category: 'lingkungan',
    title: 'Pemangkasan Dahan Pohon Rindang Dekat Kabel Listrik Lapangan',
    description: 'Memotong ranting pohon mangga dan trembesi yang mulai menyentuh kabel listrik PLN di dekat lapangan upacara demi keselamatan warga sekolah.',
    location: 'Area Pojok Lapangan Upacara Sekolah',
    timeStart: '08:30',
    timeEnd: '11:00',
    status: 'selesai',
    volumeUnit: '3 pohon & 1 mobil bak ranting',
    petugas: 'Bambang Kurniawan',
    notes: 'Dahan kayu sudah dirapikan dan dibersihkan.'
  },
  {
    id: 'tsk-pjg-005',
    role: 'PENJAGA',
    date: '2026-09-22',
    category: 'antar_surat',
    title: 'Pengantaran Surat Dinas Usulan Kebutuhan Sapras ke Disdik Kota',
    description: 'Mengantarkan berkas fisik Surat Dinas Nomor 421/189/Disdik perihal usulan sarana prasarana dan menerima tanda terima tanda tangan dari bagian Umum Disdik.',
    location: 'Kantor Dinas Pendidikan dan Kebudayaan',
    timeStart: '09:00',
    timeEnd: '11:30',
    status: 'selesai',
    volumeUnit: '1 berkas surat penting beramplop dinas',
    petugas: 'Bambang Kurniawan',
    notes: 'Tanda terima nomor agenda Disdik: 045/Disdik/IX/2026.'
  },
  {
    id: 'tsk-pjg-006',
    role: 'PENJAGA',
    date: '2026-09-21',
    category: 'pengawasan_anak',
    title: 'Pengawasan Jam Istirahat Pertama & Sterilisasi Pagar Belakang',
    description: 'Memantau aktivitas siswa saat jam istirahat di kantin dan lapangan olahraga, memastikan tidak ada siswa memanjat pagar atau jajan di luar batas sekolah.',
    location: 'Kantin Sekolah & Pagar Batas Belakang',
    timeStart: '09:40',
    timeEnd: '10:15',
    status: 'selesai',
    volumeUnit: '1 sesi istirahat (seluruh siswa)',
    petugas: 'Bambang Kurniawan',
    notes: 'Situasi tertib, nihil pelanggaran tata tertib.'
  },

  // TU (TATA USAHA) TASKS
  {
    id: 'tsk-tu-001',
    role: 'TU',
    date: '2026-09-25',
    category: 'kepegawaian',
    title: 'Pemberkasan Kenaikan Pangkat Pilihan Guru & Verifikasi Data BKN',
    description: 'Memeriksa kelengkapan berkas SK Kenaikan Pangkat, PAK (Penetapan Angka Kredit), dan SKP 2 tahun terakhir untuk 4 orang guru ASN dan upload ke SIASN BKN.',
    location: 'Ruang Tata Usaha (Meja Administrasi Kepegawaian)',
    timeStart: '08:00',
    timeEnd: '11:30',
    status: 'selesai',
    volumeUnit: '4 berkas ASN guru',
    petugas: 'Siti Maisaroh, A.Md.',
    notes: 'Semua dokumen telah diverifikasi dan berstatus approval instansi.'
  },
  {
    id: 'tsk-tu-002',
    role: 'TU',
    date: '2026-09-25',
    category: 'siswa',
    title: 'Penerbitan Surat Keterangan Siswa Aktif & Input Mutasi Masuk',
    description: 'Memproses permohonan 8 lembar surat keterangan aktif belajar untuk pengurusan PIP / beasiswa serta memasukkan data 1 siswa mutasi masuk kelas 8 ke Buku Induk.',
    location: 'Loket Pelayanan Tata Usaha',
    timeStart: '08:30',
    timeEnd: '12:00',
    status: 'selesai',
    volumeUnit: '8 lembar suket & 1 mutasi siswa',
    petugas: 'Siti Maisaroh, A.Md.',
    notes: 'Data siswa tercatat di Buku Induk Register No. 4102.'
  },
  {
    id: 'tsk-tu-003',
    role: 'TU',
    date: '2026-09-24',
    category: 'surat_masuk',
    title: 'Pencatatan Buku Agenda Surat Masuk & Pengajuan Disposisi Kepala Sekolah',
    description: 'Menerima, memberi nomor agenda, mengunggah scan PDF, dan menyerahkan lembar disposisi surat undangan Bimtek Kurikulum Merdeka dari BGP ke meja Kepala Sekolah.',
    location: 'Ruang TU & Meja Kepala Sekolah',
    timeStart: '09:00',
    timeEnd: '10:30',
    status: 'selesai',
    volumeUnit: '5 surat masuk dinas',
    petugas: 'Siti Maisaroh, A.Md.',
    notes: 'Surat telah didisposisikan kepada Wakasek Kurikulum.'
  },
  {
    id: 'tsk-tu-004',
    role: 'TU',
    date: '2026-09-24',
    category: 'surat_keluar',
    title: 'Pembuatan Surat Edaran Pertemuan Orang Tua Siswa & Legalisir Ijazah',
    description: 'Membuat konsep surat edaran dinas tentang parenting day, meminta tanda tangan Kepsek, pemberian nomor keluar 421.3/210/SMP-01/IX/2026 dan melayani 6 alumni legalisir ijazah.',
    location: 'Ruang TU',
    timeStart: '13:00',
    timeEnd: '15:30',
    status: 'selesai',
    volumeUnit: '1 nomor surat keluar (720 ekspemplar) & 6 legalisir',
    petugas: 'Siti Maisaroh, A.Md.',
    notes: 'Arsip fisik tersimpan di Odner Surat Keluar 2026.'
  },
  {
    id: 'tsk-tu-005',
    role: 'TU',
    date: '2026-09-23',
    category: 'sapras',
    title: 'Inventarisasi Barang Milik Daerah (KIB B & KIB E) Semester Ganjil',
    description: 'Pengecekan fisik laptop Chromebook bantuan dinas, proyektor LCD, dan printer kantor. Memperbarui label barcode inventaris dan mencocokkan ke buku induk aset.',
    location: 'Lab Komputer & Ruang TU',
    timeStart: '10:00',
    timeEnd: '14:00',
    status: 'selesai',
    volumeUnit: '35 unit perangkat TIK',
    petugas: 'Siti Maisaroh, A.Md.',
    notes: '33 unit Baik, 2 unit perlu update adaptor charger.'
  },

  // SERVICE (LAYANAN KEBERSIHAN) TASKS
  {
    id: 'tsk-srv-001',
    role: 'SERVICE',
    date: '2026-09-25',
    category: 'kebersihan_wc',
    title: 'Pembersihan & Disinfeksi Menyeluruh Toilet Siswa dan Toilet Guru',
    description: 'Menguras bak penampungan air, menyikat lantai berkerak dengan cairan porselen, membersihkan kloset, mengisi ulang sabun cair dan memastikan aroma pengharum ruangan wangi segar.',
    location: 'Toilet Siswa Putra (Lt. 1 & 2), Toilet Siswa Putri & Toilet Guru',
    timeStart: '06:00',
    timeEnd: '07:30',
    status: 'selesai',
    volumeUnit: '8 bilik toilet & 4 wastafel',
    petugas: 'Agus Supriyadi',
    notes: 'Semua toilet bersih, kran air mengalir lancar, sabun terisi penuh.'
  },
  {
    id: 'tsk-srv-002',
    role: 'SERVICE',
    date: '2026-09-25',
    category: 'kebersihan_kantor',
    title: 'Pembersihan Debu Kaca, Meja Kerja & Pel Lantai Ruang Pimpinan / Guru',
    description: 'Menyapu dan mengepel lantai Ruang Kepala Sekolah, Ruang Guru dan Ruang TU dengan desinfektan lantai wangi cemara, mengelap meja kerja staf dan membersihkan kaca jendela.',
    location: 'Ruang Kepala Sekolah, Ruang Guru & Ruang TU',
    timeStart: '07:00',
    timeEnd: '08:45',
    status: 'selesai',
    volumeUnit: '3 unit ruangan besar (± 250 m²)',
    petugas: 'Agus Supriyadi',
    notes: 'Ruangan steril dan siap digunakan untuk aktivitas jam kerja.'
  },
  {
    id: 'tsk-srv-003',
    role: 'SERVICE',
    date: '2026-09-25',
    category: 'kebersihan_sampah',
    title: 'Pengambilan Sampah Kelas, Pemilahan Organik & Angkut ke TPS Induk',
    description: 'Mengosongkan tempat sampah di 18 ruang kelas dan koridor, memilah sampah plastik botol/gelas daur ulang, membuang sampah organik ke komposter sekolah dan residu ke TPS.',
    location: 'Seluruh Koridor Kelas & TPS Sementara Sekolah',
    timeStart: '12:30',
    timeEnd: '14:30',
    status: 'selesai',
    volumeUnit: '6 gerobak sampah (± 45 kg)',
    petugas: 'Agus Supriyadi',
    notes: 'Kantin dan koridor bebas tumpukan sampah, bak sampah kembali bersih.'
  },
  {
    id: 'tsk-srv-004',
    role: 'SERVICE',
    date: '2026-09-24',
    category: 'kebersihan_kantor',
    title: 'Pembersihan Ruang Perpustakaan & Ruang Rapat Aula Sekolah',
    description: 'Menyedot debu karpet aula, membersihkan rak buku perpustakaan dari debu, mengepel lantai keramik dan mengelap kaca etalase piala penghargaan.',
    location: 'Perpustakaan Lt. 2 & Aula Serbaguna',
    timeStart: '13:00',
    timeEnd: '15:15',
    status: 'selesai',
    volumeUnit: '2 ruangan auditorium/buku',
    petugas: 'Agus Supriyadi',
    notes: 'Aula bersih siap digunakan untuk rapat komite sekolah besok.'
  },
  {
    id: 'tsk-srv-005',
    role: 'SERVICE',
    date: '2026-09-23',
    category: 'kebersihan_wc',
    title: 'Sanitasi Sore & Pengisian Tandon Bak Air Toilet Siswa',
    description: 'Pengecekan kebersihan toilet setelah jam kepulangan siswa, menyemprot desinfektan antibakteri, mematikan kran yang menetes dan memastikan lantai kering tidak licin.',
    location: 'Toilet Siswa Lt. 1 dan Lt. 2',
    timeStart: '15:00',
    timeEnd: '16:00',
    status: 'selesai',
    volumeUnit: '6 bilik toilet',
    petugas: 'Agus Supriyadi',
    notes: 'Lantai kering, exhaust fan berfungsi optimal.'
  },
  // PERPUSTAKAAN TASKS
  {
    id: 'tsk-prs-001',
    role: 'PERPUS',
    date: '2026-09-25',
    category: 'katalogisasi_buku',
    taskType: 'pokok',
    title: 'Katalogisasi & Perekaman Barcode 80 Eksemplar Buku Pelajaran Kurikulum Merdeka',
    description: 'Melakukan registrasi buku induk, pemberian stempel kepemilikan sekolah, penentuan nomor klasifikasi DDC, pencetakan barcode, dan penempelan label punggung buku teks IPA dan Matematika kelas 7.',
    location: 'Ruang Pengolahan Perpustakaan',
    timeStart: '08:00',
    timeEnd: '10:30',
    status: 'selesai',
    volumeUnit: '80 buku teks pelajaran',
    petugas: 'Nurul Hidayati, S.I.Pust.',
    notes: 'Data telah tersinkronisasi ke katalog digital perpustakaan (OPAC).'
  },
  {
    id: 'tsk-prs-002',
    role: 'PERPUS',
    date: '2026-09-25',
    category: 'sirkulasi_peminjaman',
    taskType: 'pokok',
    title: 'Layanan Sirkulasi Peminjaman & Pengembalian Buku Teks dan Referensi Siswa',
    description: 'Melayani transaksi peminjaman mandiri dan pengembalian buku siswa saat jam istirahat pertama dan kedua, memeriksa kondisi fisik buku, dan mengembalikan buku ke rak sesuai nomor klasifikasi.',
    location: 'Meja Sirkulasi Perpustakaan',
    timeStart: '09:30',
    timeEnd: '13:00',
    status: 'selesai',
    volumeUnit: '65 transaksi peminjaman & 42 pengembalian',
    petugas: 'Nurul Hidayati, S.I.Pust.',
    notes: 'Seluruh buku dikembalikan tepat waktu tanpa denda keterlambatan.'
  },
  {
    id: 'tsk-prs-003',
    role: 'PERPUS',
    date: '2026-09-24',
    category: 'layanan_literasi',
    taskType: 'tambahan',
    title: 'Pendampingan Jam Literasi Siswa Kelas 7 & Pengenalan Pojok Baca',
    description: 'Memandu kegiatan 15 menit membaca buku non-pelajaran bagi peserta didik rombel 7A dan 7B, pengenalan cara mencari referensi di rak buku ensiklopedia, dan bimbingan resume bacaan.',
    location: 'Ruang Baca Utama Perpustakaan',
    timeStart: '07:15',
    timeEnd: '08:15',
    status: 'selesai',
    volumeUnit: '2 rombel (64 peserta didik)',
    petugas: 'Nurul Hidayati, S.I.Pust.',
    notes: 'Antusiasme siswa tinggi, 28 siswa langsung mendaftar pinjam buku fiksi.'
  },
  {
    id: 'tsk-prs-004',
    role: 'PERPUS',
    date: '2026-09-23',
    category: 'perawatan_buku',
    taskType: 'pokok',
    title: 'Restorasi, Laminasi & Penjilidan Ulang Cover Buku Ensiklopedia yang Rusak',
    description: 'Melakukan perbaikan fisik buku ensiklopedia sains yang lepas punggungnya, pengeleman jilid benang, pelapisan cover dengan plastik mika tebal, dan penempelan ulang barcode.',
    location: 'Meja Kerja Restorasi Bahan Pustaka',
    timeStart: '13:30',
    timeEnd: '15:30',
    status: 'selesai',
    volumeUnit: '15 eksemplar buku referensi',
    petugas: 'Nurul Hidayati, S.I.Pust.',
    notes: 'Kondisi buku kembali rapi, kuat, dan siap dipinjamkan kembali.'
  },
  {
    id: 'tsk-prs-005',
    role: 'PERPUS',
    date: '2026-09-22',
    category: 'stock_opname',
    taskType: 'pokok',
    title: 'Stock Opname Fisik Koleksi Buku Fiksi dan Pencocokan Buku Induk Rak 3',
    description: 'Mencocokkan nomor induk fisik buku di rak fiksi sastra remaja dengan data buku induk perpustakaan untuk memastikan jumlah eksemplar yang ada, hilang, atau sedang dipinjam.',
    location: 'Rak Koleksi Fiksi & Sastra (Rak 3)',
    timeStart: '10:00',
    timeEnd: '12:30',
    status: 'selesai',
    volumeUnit: '280 eksemplar buku',
    petugas: 'Nurul Hidayati, S.I.Pust.',
    notes: 'Sesuai dengan data sistem, 12 eksemplar terkonfirmasi dalam peminjaman aktif.'
  },
  {
    id: 'tsk-prs-006',
    role: 'PERPUS',
    date: '2026-09-21',
    category: 'administrasi_perpus',
    taskType: 'tambahan',
    title: 'Penerbitan 120 Kartu Anggota Perpustakaan Berbarcode untuk Siswa Baru',
    description: 'Mencetak kartu anggota perpustakaan siswa kelas 7 baru yang dilengkapi barcode NISN dan nomor induk anggota, serta memasukkan foto siswa ke database anggota perpus.',
    location: 'Ruang Komputer Administrasi Perpustakaan',
    timeStart: '08:30',
    timeEnd: '11:45',
    status: 'selesai',
    volumeUnit: '120 kartu perpustakaan',
    petugas: 'Nurul Hidayati, S.I.Pust.',
    notes: 'Kartu telah dilaminasi rapi dan siap didistribusikan ke wali kelas.'
  },
  // LABORATORIUM IPA TASKS
  {
    id: 'tsk-ipa-001',
    role: 'LAB_IPA',
    date: '2026-09-25',
    category: 'persiapan_praktikum',
    taskType: 'pokok',
    title: 'Penyiapan Alat Mikroskop Cahaya & Preparat Jaringan Tumbuhan Kelas 8',
    description: 'Menyiapkan 12 unit mikroskop siswa, kaca preparat, cover glass, pipet tetes, dan reagen pewarna metilen biru untuk praktikum biologi struktur jaringan daun kelas 8B.',
    location: 'Ruang Laboratorium IPA (Meja Praktikum 1-6)',
    timeStart: '07:30',
    timeEnd: '09:30',
    status: 'selesai',
    volumeUnit: '12 unit mikroskop & 24 set preparat',
    petugas: 'Hendra Prasetya, S.Pd.',
    notes: 'Semua mikroskop berfungsi normal, cermin dan lensa okuler telah dibersihkan alkohol 70%.'
  },
  {
    id: 'tsk-ipa-002',
    role: 'LAB_IPA',
    date: '2026-09-25',
    category: 'pemeliharaan_alat',
    taskType: 'pokok',
    title: 'Pembersihan Alat Gelas Tabung Reaksi, Beaker Glass & Pengeringan Rak',
    description: 'Mencuci alat gelas sisa praktikum uji asam basa menggunakan sabun detergen laboratorium, membilas dengan akuades, mengeringkan pada rak pengering dan menyimpan ke lemari kaca.',
    location: 'Wastafel Laboratorium IPA & Rak Pengering',
    timeStart: '11:00',
    timeEnd: '12:30',
    status: 'selesai',
    volumeUnit: '48 tabung reaksi & 16 gelas beaker',
    petugas: 'Hendra Prasetya, S.Pd.',
    notes: 'Alat gelas bersih bebas residu, tidak ada alat yang pecah.'
  },
  {
    id: 'tsk-ipa-003',
    role: 'LAB_IPA',
    date: '2026-09-24',
    category: 'inventaris_bahan',
    taskType: 'pokok',
    title: 'Pengecekan Masa Kedaluwarsa Bahan Reagen Kimia & Pemutakhiran Kartu Stok',
    description: 'Memeriksa tanggal kedaluwarsa reagen larutan Benedict, Biuret, Lugol, Asam Klorida (HCl encer), dan Natrium Hidroksida (NaOH), serta mencatat sisa volume pada kartu stok lemari bahan.',
    location: 'Lemari Penyimpanan Bahan Kimia Lab IPA',
    timeStart: '13:00',
    timeEnd: '15:00',
    status: 'selesai',
    volumeUnit: '24 botol reagen & 12 kartu stok',
    petugas: 'Hendra Prasetya, S.Pd.',
    notes: 'Stok reagen Biuret tersisa 1 botol (250 ml), perlu diajukan pengadaan bulan depan.'
  },
  {
    id: 'tsk-ipa-004',
    role: 'LAB_IPA',
    date: '2026-09-23',
    category: 'k3_laboratorium',
    taskType: 'pokok',
    title: 'Sterilisasi Meja Praktikum, Pengecekan APAR dan Pembuangan Limbah Netralisasi',
    description: 'Menyeka meja praktikum tahan asam dengan cairan pembersih, memeriksa manometer tekanan tabung APAR 6 kg, serta menetralisir limbah cair asam-basa sebelum dibuang ke bak filtrasi.',
    location: 'Area Ruang Laboratorium IPA & Bak Netralisasi',
    timeStart: '14:00',
    timeEnd: '15:30',
    status: 'selesai',
    volumeUnit: '8 meja praktikum & 1 unit APAR',
    petugas: 'Hendra Prasetya, S.Pd.',
    notes: 'Indikator tekanan APAR di zona hijau, kotak P3K lengkap dengan obat luka bakar & pencuci mata.'
  },
  {
    id: 'tsk-ipa-005',
    role: 'LAB_IPA',
    date: '2026-09-22',
    category: 'jadwal_lab',
    taskType: 'tambahan',
    title: 'Penyusunan Jadwal Penggunaan Lab IPA dan Rekapitulasi Jurnal Praktikum Mingguan',
    description: 'Menyinkronkan jadwal praktikum IPA kelas 7, 8, dan 9 bersama guru mata pelajaran IPA agar tidak terjadi bentrok jam pemakaian, serta mencatat daftar peminjaman kit fisika.',
    location: 'Ruang Persiapan Laboran IPA',
    timeStart: '08:30',
    timeEnd: '10:00',
    status: 'selesai',
    volumeUnit: '18 sesi praktikum per minggu',
    petugas: 'Hendra Prasetya, S.Pd.',
    notes: 'Jadwal mingguan telah dicetak dan ditempel pada papan pengumuman depan lab.'
  },
  {
    id: 'tsk-ipa-006',
    role: 'LAB_IPA',
    date: '2026-09-21',
    category: 'perbaikan_alat',
    taskType: 'tambahan',
    title: 'Kalibrasi Neraca Ohaus 3 Lengan dan Perbaikan Konektor Kit Listrik Magnet',
    description: 'Melakukan kalibrasi titik nol neraca 3 lengan Ohaus untuk praktikum pengukuran massa, serta menyolder kembali soket jumper kabel penghubung kit praktikum listrik dinamis.',
    location: 'Meja Kalibrasi & Perbaikan Laboratorium IPA',
    timeStart: '10:15',
    timeEnd: '12:00',
    status: 'selesai',
    volumeUnit: '4 unit neraca & 6 kabel kit listrik',
    petugas: 'Hendra Prasetya, S.Pd.',
    notes: 'Pengukuran neraca presisi kembali dengan deviasi 0 gram.'
  }
];

export const initialInventories: InventoryItem[] = [
  // INVENTARIS TU
  {
    id: 'inv-tu-001',
    role: 'TU',
    kodeBarang: 'INV-TU-01/PC-01',
    namaBarang: 'Komputer PC All-in-One Administrator',
    merkModel: 'HP ProOne 440 G9 Core i5 16GB',
    kategori: 'Peralatan TIK & Kantor',
    jumlah: 2,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Meja Operator TU',
    tahunPengadaan: 2024,
    keterangan: 'Digunakan untuk Dapodik, SIASN BKN, dan persuratan'
  },
  {
    id: 'inv-tu-002',
    role: 'TU',
    kodeBarang: 'INV-TU-02/PRN-01',
    namaBarang: 'Printer Heavy-Duty Multifungsi Duplex',
    merkModel: 'Epson EcoTank L5290 Print/Scan/Copy',
    kategori: 'Peralatan Cetak',
    jumlah: 1,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Ruang TU Depan',
    tahunPengadaan: 2023,
    keterangan: 'Pencetakan surat dinas harian dan fotokopi berkas legalisir'
  },
  {
    id: 'inv-tu-003',
    role: 'TU',
    kodeBarang: 'INV-TU-03/LMR-02',
    namaBarang: 'Lemari Arsip Besi 4 Pintu Tahan Api',
    merkModel: 'Brother File Cabinet Steel',
    kategori: 'Perabot Kantor',
    jumlah: 2,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Ruang Arsip TU',
    tahunPengadaan: 2022,
    keterangan: 'Penyimpanan Buku Induk Siswa dan Berkas SK Pangkat Guru'
  },
  {
    id: 'inv-tu-004',
    role: 'TU',
    kodeBarang: 'INV-TU-04/SCN-01',
    namaBarang: 'High Speed Document Scanner ADF',
    merkModel: 'Canon imageFORMULA DR-C225 II',
    kategori: 'Peralatan TIK & Kantor',
    jumlah: 1,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Meja Arsip Digital',
    tahunPengadaan: 2023,
    keterangan: 'Digitalisasi surat masuk dan surat keluar'
  },
  {
    id: 'inv-tu-005',
    role: 'TU',
    kodeBarang: 'INV-TU-05/STP-01',
    namaBarang: 'Stempel Otomatis Sekolah & Tanggal Dinas',
    merkModel: 'Trodat Printy 4913 & Trodat Stempel Tanggal',
    kategori: 'Perlengkapan Administrasi',
    jumlah: 4,
    satuan: 'Buah',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Laci Meja Kepala Urusan TU',
    tahunPengadaan: 2025,
    keterangan: 'Cap resmi dinas sekolah dan legalisir'
  },

  // INVENTARIS PENJAGA SEKOLAH
  {
    id: 'inv-pjg-001',
    role: 'PENJAGA',
    kodeBarang: 'INV-PJG-01/SNT-01',
    namaBarang: 'Senter Patroli Taktis Jarak Jauh LED Rechargeable',
    merkModel: 'Nitecore P20iX 4000 Lumens',
    kategori: 'Alat Keamanan & Patroli',
    jumlah: 2,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Pos Jaga Gerbang Depan',
    tahunPengadaan: 2024,
    keterangan: 'Digunakan patroli malam keliling gedung sekolah'
  },
  {
    id: 'inv-pjg-002',
    role: 'PENJAGA',
    kodeBarang: 'INV-PJG-02/GMB-04',
    namaBarang: 'Gembok Baja Hardened Anti Gergaji & Rantai Pengaman',
    merkModel: 'Yale Heavy Duty Steel Padlock 70mm',
    kategori: 'Alat Pengamanan Fisik',
    jumlah: 14,
    satuan: 'Buah',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Pos Jaga & Gerbang Utama',
    tahunPengadaan: 2023,
    keterangan: 'Pengunci gerbang utama, lab komputer, dan ruang kepsek'
  },
  {
    id: 'inv-pjg-003',
    role: 'PENJAGA',
    kodeBarang: 'INV-PJG-03/APR-01',
    namaBarang: 'Alat Pemadam Api Ringan (APAR) Dry Chemical Powder 6kg',
    merkModel: 'Yamato Fire Extinguisher 6 Kg',
    kategori: 'Keselamatan & K3',
    jumlah: 6,
    satuan: 'Tabung',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Koridor Kelas & Lab IPA',
    tahunPengadaan: 2024,
    keterangan: 'Masa uji berkala berlaku sampai November 2026'
  },
  {
    id: 'inv-pjg-004',
    role: 'PENJAGA',
    kodeBarang: 'INV-PJG-04/TOL-01',
    namaBarang: 'Kotak Perkakas Mekik / Tool Box Lengkap',
    merkModel: 'Kenmaster Pro Toolbox 48 Pcs + Mesin Bor Cordless',
    kategori: 'Alat Perbaikan Sarpras',
    jumlah: 1,
    satuan: 'Set',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Gudang Sarpras Belakang',
    tahunPengadaan: 2024,
    keterangan: 'Perbaikan meja kursi, engsel pintu, kran air, dan kelistrikan'
  },
  {
    id: 'inv-pjg-005',
    role: 'PENJAGA',
    kodeBarang: 'INV-PJG-05/RMP-01',
    namaBarang: 'Mesin Potong Rumput Gendong 2 Tak',
    merkModel: 'Tanaka SUM 328SE',
    kategori: 'Perawatan Lingkungan Sekolah',
    jumlah: 1,
    satuan: 'Unit',
    kondisi: 'Rusak Ringan',
    lokasiPenyimpanan: 'Gudang Sarpras Belakang',
    tahunPengadaan: 2022,
    keterangan: 'Tali tarikan starter agak seret, masih bisa digunakan normal'
  },
  {
    id: 'inv-pjg-006',
    role: 'PENJAGA',
    kodeBarang: 'INV-PJG-06/TNG-01',
    namaBarang: 'Tangga Aluminium Teleskopik Lipat 4.4 Meter',
    merkModel: 'Krisbow Multi Purpose Ladder',
    kategori: 'Alat Perbaikan Sarpras',
    jumlah: 1,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Gudang Sarpras Belakang',
    tahunPengadaan: 2023,
    keterangan: 'Penggantian lampu koridor dan pengecekan talang atap'
  },

  // INVENTARIS SERVICE (LAYANAN KEBERSIHAN)
  {
    id: 'inv-srv-001',
    role: 'SERVICE',
    kodeBarang: 'INV-SRV-01/GRB-01',
    namaBarang: 'Gerobak Dorong Sampah Roda Karet',
    merkModel: 'Artco Standar Dinas Lingkungan Hidup',
    kategori: 'Pengelolaan Sampah',
    jumlah: 2,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Area TPS Belakang Sekolah',
    tahunPengadaan: 2023,
    keterangan: 'Pengangkutan sampah harian dari kelas ke TPS'
  },
  {
    id: 'inv-srv-002',
    role: 'SERVICE',
    kodeBarang: 'INV-SRV-02/PLK-01',
    namaBarang: 'Set Ember Pemeras Pel Lantai Double Bucket & Mop Press',
    merkModel: 'Cleanmatic Double Bucket Trolley 46L',
    kategori: 'Alat Kebersihan Lantai',
    jumlah: 3,
    satuan: 'Set',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Ruang Service & Toilet Guru',
    tahunPengadaan: 2024,
    keterangan: 'Pengepelan koridor, ruang kelas dan ruang rapat'
  },
  {
    id: 'inv-srv-003',
    role: 'SERVICE',
    kodeBarang: 'INV-SRV-03/SMP-03',
    namaBarang: 'Tempat Sampah Pilah 3 Warna (Organik, Anorganik, B3)',
    merkModel: 'Krisbow Dustbin Outdoor 50L x 3',
    kategori: 'Pengelolaan Sampah',
    jumlah: 12,
    satuan: 'Set',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Sepanjang Selasar Kelas',
    tahunPengadaan: 2024,
    keterangan: 'Edukasi dan pemilahan sampah siswa'
  },
  {
    id: 'inv-srv-004',
    role: 'SERVICE',
    kodeBarang: 'INV-SRV-04/WPR-01',
    namaBarang: 'Telescopic Window Wiper Kaca Pembersih Gedung 3M',
    merkModel: 'Unger Pro Window Squeegee Set',
    kategori: 'Alat Kebersihan Kaca & Dinding',
    jumlah: 2,
    satuan: 'Set',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Gudang Service',
    tahunPengadaan: 2024,
    keterangan: 'Pembersihan kaca jendela lantai 1 dan lantai 2'
  },
  {
    id: 'inv-srv-005',
    role: 'SERVICE',
    kodeBarang: 'INV-SRV-05/WSH-01',
    namaBarang: 'High Pressure Cleaner Semprotan Air Cuci Lumut / Lantai',
    merkModel: 'Karcher K2 Compact 110 Bar',
    kategori: 'Sanitasi & Perawatan Luar',
    jumlah: 1,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Gudang Service',
    tahunPengadaan: 2023,
    keterangan: 'Pembersihan lumut paving block dan selokan sekolah'
  },
  // INVENTARIS PERPUSTAKAAN
  {
    id: 'inv-prs-001',
    role: 'PERPUS',
    kodeBarang: 'INV-PRS-01/RAK-01',
    namaBarang: 'Rak Buku Dua Muka (Double Sided) Kayu Mahoni Tebal 5 Tingkat',
    merkModel: 'Indachi Library Double Rack 120x45x180 cm',
    kategori: 'Mebeler & Penyimpanan Buku',
    jumlah: 8,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Ruang Koleksi Perpustakaan',
    tahunPengadaan: 2024,
    keterangan: 'Penyimpanan buku teks kurikulum merdeka dan fiksi'
  },
  {
    id: 'inv-prs-002',
    role: 'PERPUS',
    kodeBarang: 'INV-PRS-02/SCN-01',
    namaBarang: 'Barcode Scanner Optik USB & Standar Dudukan Sirkulasi',
    merkModel: 'Honeywell Voyager 1250g Handheld Laser',
    kategori: 'Peralatan TIK & Sirkulasi',
    jumlah: 2,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Meja Layanan Sirkulasi',
    tahunPengadaan: 2024,
    keterangan: 'Pemindaian barcode peminjaman buku dan kartu anggota'
  },
  {
    id: 'inv-prs-003',
    role: 'PERPUS',
    kodeBarang: 'INV-PRS-03/OPAC-01',
    namaBarang: 'Komputer Anjungan Penelusuran Katalog (OPAC) Siswa',
    merkModel: 'Lenovo IdeaCentre AIO 3 24ITL6 Core i3',
    kategori: 'Peralatan TIK & Sirkulasi',
    jumlah: 2,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Lobi Masuk Perpustakaan',
    tahunPengadaan: 2023,
    keterangan: 'Pencarian katalog judul buku dan cek status ketersediaan'
  },
  {
    id: 'inv-prs-004',
    role: 'PERPUS',
    kodeBarang: 'INV-PRS-04/MEJ-01',
    namaBarang: 'Set Meja Baca Bundar Kayu Jati Belanda & 4 Kursi Spon',
    merkModel: 'Chitose Round Study Table Set Dia. 120 cm',
    kategori: 'Mebeler & Sarana Baca',
    jumlah: 6,
    satuan: 'Set',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Ruang Baca Utama Siswa',
    tahunPengadaan: 2024,
    keterangan: 'Area baca kelompok dan bimbingan literasi siswa'
  },
  {
    id: 'inv-prs-005',
    role: 'PERPUS',
    kodeBarang: 'INV-PRS-05/LMR-01',
    namaBarang: 'Lemari Display Buku Baru Akrilik Transparan Putar 4 Sisi',
    merkModel: 'Koleksi Akrilik Revolving Display 160 cm',
    kategori: 'Sarana Promosi & Pameran Buku',
    jumlah: 2,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Depan Pintu Masuk Perpustakaan',
    tahunPengadaan: 2024,
    keterangan: 'Display promosi buku baru edisi bulan berjalan'
  },
  // INVENTARIS LABORATORIUM IPA
  {
    id: 'inv-ipa-001',
    role: 'LAB_IPA',
    kodeBarang: 'INV-IPA-01/MKS-01',
    namaBarang: 'Mikroskop Siswa Monokuler LED Pembesaran 40x - 1000x',
    merkModel: 'Yazumi XSP-12 LED Illuminated Monocular',
    kategori: 'Alat Optik & Mikroskopi',
    jumlah: 16,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Lemari Kaca Optik Lab IPA',
    tahunPengadaan: 2024,
    keterangan: 'Praktikum biologi sel dan struktur jaringan tumbuhan/hewan'
  },
  {
    id: 'inv-ipa-002',
    role: 'LAB_IPA',
    kodeBarang: 'INV-IPA-02/KIT-01',
    namaBarang: 'Kit Praktikum Fisika Mekanika, Hidrostatika & Optik SMP',
    merkModel: 'Pudak Scientific Kit Mekanika SMP Lengkap',
    kategori: 'Kit Sains & Alat Peraga Fisika',
    jumlah: 8,
    satuan: 'Box',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Lemari Instrumen Fisika',
    tahunPengadaan: 2024,
    keterangan: 'Praktikum gaya gesek, tuas, hukum archimedes dan lensa'
  },
  {
    id: 'inv-ipa-003',
    role: 'LAB_IPA',
    kodeBarang: 'INV-IPA-03/GLS-01',
    namaBarang: 'Set Alat Gelas Tabung Reaksi, Erlenmeyer, Beaker & Buret Borosilikat',
    merkModel: 'Pyrex Iwaki Glassware Science Set',
    kategori: 'Peralatan Gelas Laboratorium',
    jumlah: 4,
    satuan: 'Set',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Rak Gelas Tertutup',
    tahunPengadaan: 2024,
    keterangan: 'Uji asam-basa, titrasi sederhana, dan larutan uji nutrisi makanan'
  },
  {
    id: 'inv-ipa-004',
    role: 'LAB_IPA',
    kodeBarang: 'INV-IPA-04/TRS-01',
    namaBarang: 'Model Torso Anatomi Tubuh Manusia Unisex 85 cm Lepas Pasang',
    merkModel: 'Pudak Torso Anatomical Human Model 24 Parts',
    kategori: 'Model Peraga Anatomi Biologi',
    jumlah: 2,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Meja Demonstrasi Guru Lab IPA',
    tahunPengadaan: 2023,
    keterangan: 'Pembelajaran sistem pencernaan, peredaran darah dan organ dalam'
  },
  {
    id: 'inv-ipa-005',
    role: 'LAB_IPA',
    kodeBarang: 'INV-IPA-05/NRC-01',
    namaBarang: 'Neraca Ohaus Tiga Lengan (Triple Beam Balance) 311g / 0.01g',
    merkModel: 'Ohaus 750-S0 Triple Beam 311 Gram',
    kategori: 'Alat Ukur Presisi Laboratorium',
    jumlah: 6,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Lemari Instrumen Pengukuran',
    tahunPengadaan: 2023,
    keterangan: 'Praktikum pengukuran massa presisi'
  },
  {
    id: 'inv-ipa-006',
    role: 'LAB_IPA',
    kodeBarang: 'INV-IPA-06/K3-01',
    namaBarang: 'Lemari Khusus Bahan Kimia B3 Tahan Asam & Exhaust Blower',
    merkModel: 'Krisbow Chemical Safety Cabinet 45 Gallon',
    kategori: 'Keselamatan & K3 Laboratorium',
    jumlah: 1,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasiPenyimpanan: 'Ruang Preparasi Laboran IPA',
    tahunPengadaan: 2024,
    keterangan: 'Penyimpanan aman asam klorida, basa pekat, dan indikator kimia'
  }
];

export const initialMonthlyReports: MonthlyReport[] = [
  {
    id: 'm-rep-pjg-09-2026',
    role: 'PENJAGA',
    month: 9,
    year: 2026,
    manualDocDate: 'Teluk, 30 September 2026',
    summary: 'Selama bulan September 2026, seluruh pelaksanaan tugas penjagaan keamanan sekolah, pengawasan kedatangan & kepulangan peserta didik, penanganan perbaikan sarana prasarana ringan, serta pengantaran surat dinas terlaksana dengan tingkat kepatuhan 98.5% tanpa adanya insiden pencurian ataupun kecelakaan lingkungan.',
    achievements: [
      'Patroli keamanan malam dan pengecekan kunci 30 hari penuh (100% terjadwal)',
      'Perbaikan mandiri 14 unit mebeler (meja/kursi siswa) dan 8 kran wastafel tanpa biaya vendor luar',
      'Pengawasan arus lalu lintas gerbang depan setiap hari efektif (06.15 - 07.15 WIB) aman terkendali',
      'Pengantaran 12 surat dinas resmi ke Dinas Pendidikan dan Instansi Terkait tepat waktu dengan bukti ekspedisi lengkap'
    ],
    obstacles: [
      'Mesin pemotong rumput mengalami kendala pada starter tarikan',
      'Penerangan lorong barat belakang sempat putus karena lonjakan arus listrik saat hujan lebat'
    ],
    solutions: [
      'Telah diajukan peremajaan busi dan tali starter mesin potong rumput ke pengelola sarpras TU',
      'Penggantian 3 titik lampu LED outdoor 30 Watt tahan air dengan stok suku cadang inventaris'
    ],
    approvalStatus: 'disahkan_kepsek'
  },
  {
    id: 'm-rep-tu-09-2026',
    role: 'TU',
    month: 9,
    year: 2026,
    manualDocDate: 'Teluk, 30 September 2026',
    summary: 'Pelayanan administrasi perkantoran bulan September 2026 mencakup pengelolaan berkas kepegawaian 45 orang GTK, pelayanan surat keterangan aktif belajar dan mutasi siswa 100% tuntas sebelum batas waktu, serta penataan KIB inventaris barang milik daerah semester berjalan.',
    achievements: [
      'Penyelesaian 4 berkas usulan kenaikan pangkat guru periode Oktober 2026 ke BKN',
      'Pencatatan 42 surat dinas masuk dan pengiriman 28 surat dinas keluar beragenda tertib',
      'Pelayanan 36 lembar surat keterangan siswa aktif untuk keperluan KIP dan beasiswa',
      'Rekonsiliasi aset sarpras KIB B dan E bekerja sama dengan dinas pengelola aset'
    ],
    obstacles: [
      'Beban server pusat Dapodik dan SIASN yang padat menjelang penutupan cut-off',
      'Sebagian arsip dokumen tahun 2022 memerlukan digitalisasi ulang karena keterbatasan map odner'
    ],
    solutions: [
      'Melakukan sinkronisasi data pada jam non-sibuk (pukul 06.30 - 08.00 WIB)',
      'Melakukan scanning dokumen menggunakan scanner ADF dan menyimpan pada cloud backup sekolah'
    ],
    approvalStatus: 'disahkan_kepsek'
  },
  {
    id: 'm-rep-srv-09-2026',
    role: 'SERVICE',
    month: 9,
    year: 2026,
    manualDocDate: 'Teluk, 30 September 2026',
    summary: 'Pelayanan kebersihan lingkungan satuan pendidikan terlaksana optimal meliputi 24 ruang kelas, 12 ruang kantor pimpinan dan guru, 14 bilik toilet, serta penanganan 1.250 kg timbulan sampah dengan pemilahan daur ulang terarah.',
    achievements: [
      'Indeks kebersihan toilet sekolah mencapai rata-rata 96/100 sesuai standar sanitasi UKS',
      'Pengurasan dan desinfeksi berkala toilet 2 kali sehari (pagi dan sore)',
      'Pengangkutan sampah harian ke TPS dilakukan sebelum pukul 15.00 WIB setiap hari',
      'Pemilahan sampah botol plastik menghasilkan 45 kg untuk disetorkan ke bank sampah binaan'
    ],
    obstacles: [
      'Ketersediaan karbol wangi dan sabun cuci tangan cair menipis pada minggu ke-4',
      'Saluran drainase depan kantin sempat tersumbat daun gugur saat hujan deras'
    ],
    solutions: [
      'Membuat usulan pengadaan bahan kimia pembersih lebih awal di awal bulan ke bendahara operasional',
      'Melakukan pembersihan berkala saringan got kantin setiap 2 hari sekali'
    ],
    approvalStatus: 'disahkan_kepsek'
  },
  {
    id: 'm-rep-prs-09-2026',
    role: 'PERPUS',
    month: 9,
    year: 2026,
    manualDocDate: 'Teluk, 30 September 2026',
    summary: 'Layanan perpustakaan sekolah pada bulan September 2026 mencatatkan lonjakan pemustaka sebesar 25% pasca peluncuran program jam literasi terjadwal. Sebanyak 420 eksemplar buku berhasil disirkulasikan, 120 buku baru selesai dikatalogisasi DDC dan dilabeli barcode, serta 15 buku koleksi referensi rusak telah direstorasi.',
    achievements: [
      'Penyelesaian katalogisasi dan input data buku induk 120 judul buku bantuan BOS K-Merdeka',
      'Peningkatan angka kunjungan perpustakaan hingga rata-rata 85 siswa/hari',
      'Penyelenggaraan pendampingan literasi 15 menit membaca untuk seluruh rombel kelas 7',
      'Penerbitan 120 kartu anggota perpustakaan digital berbarcode untuk siswa baru',
      'Perawatan fisik dan restorasi pengeleman 15 eksemplar buku ensiklopedia & kamus'
    ],
    obstacles: [
      'Beberapa siswa terlambat mengembalikan buku teks pinjaman semester',
      'Ruang pojok baca lesehan memerlukan tambahan karpet spon anti-debu'
    ],
    solutions: [
      'Memberikan notifikasi pengingat ramah melalui wali kelas dan papan pengumuman perpus',
      'Mengajukan pengadaan 2 gulung karpet vinil lembut pada RKAS perubahan'
    ],
    approvalStatus: 'disahkan_kepsek'
  },
  {
    id: 'm-rep-ipa-09-2026',
    role: 'LAB_IPA',
    month: 9,
    year: 2026,
    manualDocDate: 'Teluk, 30 September 2026',
    summary: 'Pelayanan praktikum laboratorium IPA sepanjang bulan September 2026 berjalan tertib, aman, dan tanpa kecelakaan kerja (Zero Laboratory Accident). Terlaksana 36 sesi praktikum fisika dan biologi, seluruh mikroskop dan neraca terkalibrasi baik, serta pengelolaan limbah netralisasi dan K3 terlaksana sesuai standar.',
    achievements: [
      'Fasilitasi penyiapan alat & bahan 36 sesi praktikum IPA kelas 7, 8, dan 9 tepat waktu',
      'Sterilisasi dan pencucian 240+ unit peralatan gelas laboratorium pasca praktikum tanpa kerusakan',
      'Pengecekan fungsi dan kalibrasi rutin 16 unit mikroskop monokuler dan 6 neraca Ohaus',
      'Pemeriksaan kesiapan kotak P3K dan indikator tekanan APAR 6 kg dalam kondisi siaga',
      'Pemutakhiran buku inventaris alat laboratorium dan kartu kendali peminjaman alat guru'
    ],
    obstacles: [
      'Stok reagen Biuret dan larutan Lugol menipis menjelang akhir praktikum sistem pencernaan',
      'Satu unit kran air wastafel ruang preparasi mengalami kebocoran seal karet'
    ],
    solutions: [
      'Membuat reagen mandiri dari bahan murni stok gudang dan mengajukan amprah reagen baru ke TU',
      'Mengganti seal karet kran bersama petugas penjaga sekolah sarpras'
    ],
    approvalStatus: 'disahkan_kepsek'
  }
];

export const initialAnnualReports: AnnualReport[] = [
  {
    id: 'ann-rep-pjg-2026',
    role: 'PENJAGA',
    year: 2026,
    manualDocDate: 'Teluk, 31 Desember 2026',
    summary: 'Laporan Tahunan Kinerja Petugas Penjaga Sekolah Tahun 2026 mencerminkan komitmen penuh dalam menjaga keamanan lingkungan belajar 24 jam, pemeliharaan sarana prasarana sekolah agar senantiasa laik pakai, serta perlindungan ketertiban siswa selama kegiatan belajar mengajar berlangsung.',
    annualMilestones: [
      'Nihil insiden kehilangan barang sekolah (Zero Loss Accident) selama 12 bulan',
      'Tuntas melakukan 184 tindakan perbaikan sarana prasarana ringan secara mandiri',
      'Telah melaksanakan 360 kali patroli malam terverifikasi buku jurnal pos pengamanan',
      'Distribusi 148 ekspedisi surat dinas dinas pendidikan tanpa keterlambatan'
    ],
    obstacles: [
      'Titik buta (blindspot) pada pagar belakang sebelah barat yang belum tercover lampu sorot',
      'Peningkatan volume kendaraan penjemput siswa saat cuaca hujan lebat membutuhkan jalur buka-tutup darurat'
    ],
    solutions: [
      'Pemasangan lampu sorot LED 50W tenaga surya dan peningkatan frekuensi ronda jam 01.00-03.00 WIB',
      'Penerapan rekayasa lalu lintas buka-tutup satu arah bersama pihak kepolisian dan dishub setempat'
    ],
    strategicRecommendations: [
      'Perlu penambahan 4 titik kamera CCTV di area sudut buta (blindspot) gerbang timur',
      'Pengadaan genset darurat cadangan untuk lampu penerangan pos jaga saat padam listrik',
      'Pelatihan teknis K3 pemadam kebakaran berkala bersama Damkar Kota'
    ],
    approvalStatus: 'disahkan_kepsek'
  },
  {
    id: 'ann-rep-tu-2026',
    role: 'TU',
    year: 2026,
    manualDocDate: 'Teluk, 31 Desember 2026',
    summary: 'Laporan Tahunan Tata Usaha Tahun 2026 mendokumentasikan efektivitas tertib administrasi sekolah yang mencakup kepegawaian, kesiswaan, persuratan, dan penatausahaan sarana prasarana sesuai pedoman SPM Pendidikan Nasional.',
    annualMilestones: [
      'Pemberkasan 100% ASN tepat waktu (KGB, Kenaikan Pangkat, SKP Tahunan)',
      'Digitalisasi 1.450 arsip persuratan dan buku induk siswa ke sistem e-Arsip',
      'Kelulusan dan mutasi siswa tertata rapi dalam buku register induk dan sinkron Dapodik',
      'Pembaruan berkala Kartu Inventaris Barang (KIB A s.d. E) bebas temuan BPK/Inspektorat'
    ],
    obstacles: [
      'Fluktuasi aksesibilitas server pusat pada periode cut-off semesteran Dapodik dan e-Kinerja',
      'Ruang simpan arsip fisik menghadapi kelembaban udara yang berpotensi merusak kertas berkas lama'
    ],
    solutions: [
      'Penyusunan jadwal entri data terjadwal pada jam non-beban puncak (dini hari dan pagi hari)',
      'Pengadaan alat dehumidifier pengatur kelembaban udara serta alih media arsip digital (cloud scan)'
    ],
    strategicRecommendations: [
      'Pengadaan server lokal cadangan untuk proteksi basis data offline sekolah',
      'Peningkatan kapasitas rak arsip tahan air di ruang arsip pusat',
      'Implementasi sistem antrean digital untuk loket legalisir dan surat keterangan siswa'
    ],
    approvalStatus: 'disahkan_kepsek'
  },
  {
    id: 'ann-rep-srv-2026',
    role: 'SERVICE',
    year: 2026,
    manualDocDate: 'Teluk, 31 Desember 2026',
    summary: 'Laporan Tahunan Layanan Kebersihan Tahun 2026 menunjukkan keberhasilan pencapaian predikat Sekolah Adiwiyata Tingkat Mandiri dengan standar higienitas toilet dan pemilahan sampah organik/anorganik yang konsisten.',
    annualMilestones: [
      'Pengurangan volume sampah residu ke TPA sebesar 38% melalui komposting dan bank sampah',
      'Terselenggaranya sanitasi rutin toilet siswa dan guru dengan kepatuhan 99.2%',
      'Pemeliharaan higienitas ruang kelas harian tanpa keluhan dari warga sekolah',
      'Efisiensi pemakaian cairan pembersih melalui takaran terstandar dan aman ramah lingkungan'
    ],
    obstacles: [
      'Musim gugur daun lebat saat pergantian cuaca menyebabkan akumulasi timbulan sampah serasah',
      'Kebutuhan peremajaan peralatan kebersihan mekanis (alat pel peras otomatis dan gerobak dorong)'
    ],
    solutions: [
      'Pembuatan 8 lubang biopori komposter tambahan untuk mempercepat konversi daun gugur menjadi pupuk',
      'Pengajuan pengadaan bertahap alat kebersihan berstandar ergonomis pada anggaran operasional sekolah'
    ],
    strategicRecommendations: [
      'Penggantian 2 unit gerobak dorong roda karet yang mulai aus',
      'Pengadaan mesin polisher lantai elektrik untuk mempercepat perawatan lantai aula dan koridor',
      'Penambahan wadah cuci tangan dengan pedal kaki di area kantin'
    ],
    approvalStatus: 'disahkan_kepsek'
  },
  {
    id: 'ann-rep-prs-2026',
    role: 'PERPUS',
    year: 2026,
    manualDocDate: 'Teluk, 31 Desember 2026',
    summary: 'Laporan Tahunan Perpustakaan Sekolah Tahun Anggaran 2026 menegaskan tercapainya standar akreditasi perpustakaan sekolah dengan koleksi terkelola 4.800+ judul buku, penerapan otomasi katalog digital (OPAC), serta partisipasi aktif 95% peserta didik dalam gerakan literasi sekolah.',
    annualMilestones: [
      'Otomasi sirkulasi dan digitalisasi 100% koleksi buku teks dan non-teks dengan barcode scanner',
      'Pencatatan 6.400+ transaksi peminjaman buku sepanjang tahun pelajaran',
      'Penyelesaian stock opname koleksi tahunan dengan tingkat akurasi fisik buku 98.2%',
      'Pembentukan 12 Pojok Baca Tematik di selasar kelas dan lobi utama sekolah'
    ],
    obstacles: [
      'Keterlambatan sirkulasi pengembalian buku pinjaman oleh siswa saat masa libur kenaikan kelas',
      'Kebutuhan rak buku tambahan akibat peningkatan volume hibah bahan pustaka dari mitra literasi'
    ],
    solutions: [
      'Penerapan kartu sirkulasi digital dengan sistem notifikasi pesan WhatsApp ke orang tua/wali kelas',
      'Pengalokasian rak display dua muka baru dan penataan ulang tata letak ruang baca berkonsep modern'
    ],
    strategicRecommendations: [
      'Pengembangan koleksi e-Book dan aplikasi perpustakaan digital sekolah berbasis Android',
      'Penambahan unit rak buku dua muka untuk menampung hibah buku pengayaan baru',
      'Penyelenggaraan Festival Bulan Bahasa dan Pekan Literasi Tahunan Satuan Pendidikan'
    ],
    approvalStatus: 'disahkan_kepsek'
  },
  {
    id: 'ann-rep-ipa-2026',
    role: 'LAB_IPA',
    year: 2026,
    manualDocDate: 'Teluk, 31 Desember 2026',
    summary: 'Laporan Tahunan Pengelolaan Laboratorium IPA Tahun 2026 melaporkan keterlaksanaan 100% praktikum kurikulum sains untuk jenjang SMP secara aman dan higienis. Pengelolaan sarana laboratorium, keselamatan kerja K3, serta perawatan instrumen presisi terlaksana secara prima.',
    annualMilestones: [
      'Fasilitasi 144 jadwal sesi praktikum sains tanpa kecelakaan kerja (Zero Accident K3)',
      'Kalibrasi berkala seluruh mikroskop optik, neraca pegas, dan alat ukur listrik sekolah',
      'Pengelolaan limbah bahan kimia praktikum ramah lingkungan dengan sistem sedimentasi & netralisasi',
      'Pendampingan tim ekstrakurikuler Karya Ilmiah Remaja (KIR) hingga meraih medali tingkat kota'
    ],
    obstacles: [
      'Keterbatasan cadangan lensa okuler & lensa objektif mikroskop saat praktikum paralel bersamaan',
      'Penyimpanan zat kimia asam pekat membutuhkan sirkulasi ventilasi uap yang lebih terisolasi'
    ],
    solutions: [
      'Penjadwalan silang penggunaan mikroskop antar rombel dan pembersihan lensa pasca praktikum',
      'Penyimpanan asam pekat pada lemari kimia berventilasi khusus dan pengajuan mini fume hood'
    ],
    strategicRecommendations: [
      'Pengadaan lemari asam mini (fume hood) untuk eksperimen uap kimia dan reaksi pembakaran',
      'Penambahan 1 set model torso organ pernapasan dan sistem saraf manusia resolusi tinggi',
      'Pelatihan penyegaran keselamatan laboratorium kimia bagi guru dan laboran secara berkala'
    ],
    approvalStatus: 'disahkan_kepsek'
  }
];

export const initialArchives: ArchiveDocument[] = [
  {
    id: 'arch-tu-2026-09',
    regNumber: 'ARS/2026/09/TU/001',
    title: 'Laporan Bulanan Kinerja Tata Usaha - September 2026',
    nomorSurat: '800/LAP-BLN/9/20202819/2026',
    documentType: 'monthly',
    role: 'TU',
    period: 'Bulan September 2026',
    year: 2026,
    month: 9,
    operatorName: 'SITI MAISAROH, A.Md.',
    operatorNip: 'NIPPK. 19930412 202321 2 018',
    dateArchived: '2026-09-25T18:00:00.000Z',
    approvalStatus: 'disahkan_kepsek',
    inspectionNotes: 'Dokumen lengkap. Rekapitulasi SKP, Dapodik, dan persuratan dinas telah diverifikasi.',
    isAuditVerified: true,
    checklist: {
      hasKop: true,
      hasApprovalSheet: true,
      hasSignatures: true,
      hasStamp: true,
      hasPhotos: true,
      photoCount: 4
    },
    reportData: {
      id: 'rep-tu-2026-09',
      role: 'TU',
      month: 9,
      year: 2026,
      manualDocDate: 'Teluk, 30 September 2026',
      summary: 'Pelaksanaan layanan administrasi operasional Tata Usaha pada bulan September 2026 berjalan tertib dan tepat waktu. Seluruh berkas mutasi siswa, pengusulan KGB, administrasi persuratan, serta sinkronisasi Dapodik semester ganjil terselesaikan 100% tanpa tunggakan.',
      achievements: [
        '100% surat masuk (42 surat) dan surat keluar (28 surat) diagendakan serta didistribusikan pada hari yang sama',
        'Pemberkasan Kenaikan Gaji Berkala (KGB) 3 orang guru dan 1 tendik selesai diverifikasi Disdik',
        'Validasi dan sinkronisasi berkala data peserta didik baru pada sistem Dapodikdasmen 100% valid',
        'Penyusunan LPJ Operasional Sekolah dan penataan kearsipan digital tersusun sistematis'
      ],
      obstacles: [
        'Koneksi server pusat saat sinkronisasi Dapodik pada jam sibuk mengalami kelambatan'
      ],
      solutions: [
        'Melakukan proses sinkronisasi database pada jam luar operasional (malam hari) dan berkoordinasi dengan Helpdesk Disdik'
      ],
      approvalStatus: 'disahkan_kepsek'
    }
  },
  {
    id: 'arch-penjaga-2026-09',
    regNumber: 'ARS/2026/09/PJG/002',
    title: 'Laporan Bulanan Kinerja Penjaga Sekolah - September 2026',
    nomorSurat: '800/LAP-BLN/9/20202819/2026',
    documentType: 'monthly',
    role: 'PENJAGA',
    period: 'Bulan September 2026',
    year: 2026,
    month: 9,
    operatorName: 'BAMBANG KURNIAWAN',
    operatorNip: 'NIPPK. 19880916 202421 1 032',
    dateArchived: '2026-09-25T18:15:00.000Z',
    approvalStatus: 'disahkan_kepsek',
    inspectionNotes: 'Buku jurnal jaga malam dan rekap patroli lingkungan terlampir lengkap.',
    isAuditVerified: true,
    checklist: {
      hasKop: true,
      hasApprovalSheet: true,
      hasSignatures: true,
      hasStamp: true,
      hasPhotos: true,
      photoCount: 4
    },
    reportData: {
      id: 'rep-pjg-2026-09',
      role: 'PENJAGA',
      month: 9,
      year: 2026,
      manualDocDate: 'Teluk, 30 September 2026',
      summary: 'Kondisi ketertiban dan keamanan lingkungan satuan pendidikan selama bulan September 2026 terpantau aman, tertib, dan kondusif. Patroli gerbang, ronda malam 3 putaran per shift, dan pemantauan penjemputan siswa berlangsung tertib.',
      achievements: [
        'Zero incident kejahatan, vandalisme, dan kehilangan sarana prasarana sekolah',
        'Patroli malam terlaksana rutin 30 hari penuh dengan verifikasi kartu kontrol pos jaga',
        'Pencegahan 100% siswa keluar pagar sekolah tanpa izin surat keterangan dari piket guru',
        'Perbaikan ringan mandiri pada 6 engsel pintu ruang kelas dan saklar lampu taman'
      ],
      obstacles: [
        'Senter sorot patroli mengalami baterai drop saat pemantauan cuaca hujan lebat'
      ],
      solutions: [
        'Telah diajukan dan diadakan senter LED isi ulang berkekuatan tinggi serta jas hujan dinas baru'
      ],
      approvalStatus: 'disahkan_kepsek'
    }
  },
  {
    id: 'arch-service-2026-09',
    regNumber: 'ARS/2026/09/SRV/003',
    title: 'Laporan Bulanan Layanan Kebersihan (Service) - September 2026',
    nomorSurat: '800/LAP-BLN/9/20202819/2026',
    documentType: 'monthly',
    role: 'SERVICE',
    period: 'Bulan September 2026',
    year: 2026,
    month: 9,
    operatorName: 'AGUS SUPRIYADI',
    operatorNip: 'NIPPK. 19901103 202421 1 045',
    dateArchived: '2026-09-25T18:30:00.000Z',
    approvalStatus: 'disahkan_kepsek',
    inspectionNotes: 'Standar kebersihan ruang belajar dan sanitasi toilet memenuhi kriteria UKS.',
    isAuditVerified: true,
    checklist: {
      hasKop: true,
      hasApprovalSheet: true,
      hasSignatures: true,
      hasStamp: true,
      hasPhotos: true,
      photoCount: 4
    },
    reportData: {
      id: 'rep-srv-2026-09',
      role: 'SERVICE',
      month: 9,
      year: 2026,
      manualDocDate: 'Teluk, 30 September 2026',
      summary: 'Kinerja layanan kebersihan dan tata graha sekolah selama bulan September 2026 mencapai tingkat kepatuhan 98.5%. Seluruh 24 ruang kelas, 12 unit toilet, laboratorium, dan lapangan upacara terjaga higienis dan harum.',
      achievements: [
        'Sanitasi harian toilet guru dan siswa tuntas dibersihkan 3x sehari (pagi, istirahat, sore)',
        'Pemilahan sampah organik dan anorganik terlaksana dari sumbernya di setiap lorong kelas',
        'Penyemprotan disinfektan berkala di ruang UKS dan perpustakaan terlaksana 2x seminggu',
        'Perawatan taman sekolah, pemangkasan rumput lapangan, dan pembersihan drainase lancar'
      ],
      obstacles: [
        'Kran air wastafel lorong kelas 8 mengalami kebocoran seal dan tersumbat pasir'
      ],
      solutions: [
        'Penggantian kran bola kuningan baru dan pembersihan filter toren air atas'
      ],
      approvalStatus: 'disahkan_kepsek'
    }
  },
  {
    id: 'arch-tu-2026-ann',
    regNumber: 'ARS/2026/THN/TU/004',
    title: 'Laporan Tahunan Kinerja Tata Usaha - Tahun Anggaran 2026',
    nomorSurat: '800/LAP-THN/20202819/2026',
    documentType: 'annual',
    role: 'TU',
    period: 'Tahun Anggaran 2026',
    year: 2026,
    operatorName: 'SITI MAISAROH, A.Md.',
    operatorNip: 'NIPPK. 19930412 202321 2 018',
    dateArchived: '2026-09-25T18:45:00.000Z',
    approvalStatus: 'disahkan_kepsek',
    inspectionNotes: 'Laporan Tahunan Resmi siap audit BPK / Inspektorat Daerah. Berkas KIB lengkap.',
    isAuditVerified: true,
    checklist: {
      hasKop: true,
      hasApprovalSheet: true,
      hasSignatures: true,
      hasStamp: true,
      hasPhotos: true,
      photoCount: 4
    },
    reportData: {
      id: 'ann-rep-tu-2026',
      role: 'TU',
      year: 2026,
      manualDocDate: 'Teluk, 31 Desember 2026',
      summary: 'Laporan Tahunan Tata Usaha Tahun 2026 mendokumentasikan efektivitas tertib administrasi sekolah yang mencakup kepegawaian, kesiswaan, persuratan, dan penatausahaan sarana prasarana sesuai pedoman SPM Pendidikan Nasional.',
      annualMilestones: [
        'Pemberkasan 100% ASN tepat waktu (KGB, Kenaikan Pangkat, SKP Tahunan)',
        'Digitalisasi 1.450 arsip persuratan dan buku induk siswa ke sistem e-Arsip',
        'Kelulusan dan mutasi siswa tertata rapi dalam buku register induk dan sinkron Dapodik',
        'Pembaruan berkala Kartu Inventaris Barang (KIB A s.d. E) bebas temuan BPK/Inspektorat'
      ],
      strategicRecommendations: [
        'Pengadaan server lokal cadangan untuk proteksi basis data offline sekolah',
        'Peningkatan kapasitas rak arsip tahan air di ruang arsip pusat',
        'Implementasi sistem antrean digital untuk loket legalisir dan surat keterangan siswa'
      ],
      approvalStatus: 'disahkan_kepsek'
    }
  },
  {
    id: 'arch-penjaga-2026-ann',
    regNumber: 'ARS/2026/THN/PJG/005',
    title: 'Laporan Tahunan Kinerja Penjaga Sekolah - Tahun Anggaran 2026',
    nomorSurat: '800/LAP-THN/20202819/2026',
    documentType: 'annual',
    role: 'PENJAGA',
    period: 'Tahun Anggaran 2026',
    year: 2026,
    operatorName: 'BAMBANG KURNIAWAN',
    operatorNip: 'NIPPK. 19880916 202421 1 032',
    dateArchived: '2026-09-25T19:00:00.000Z',
    approvalStatus: 'disahkan_kepsek',
    inspectionNotes: 'Buku ekspedisi surat dan daftar aset keamanan lengkap.',
    isAuditVerified: true,
    checklist: {
      hasKop: true,
      hasApprovalSheet: true,
      hasSignatures: true,
      hasStamp: true,
      hasPhotos: true,
      photoCount: 3
    },
    reportData: {
      id: 'ann-rep-pjg-2026',
      role: 'PENJAGA',
      year: 2026,
      manualDocDate: 'Teluk, 31 Desember 2026',
      summary: 'Kinerja layanan pengamanan dan pemeliharaan fasilitas sekolah sepanjang tahun 2026 terlaksana secara optimal. Tidak terjadi kasus pembobolan, kehilangan inventaris, maupun gangguan ketertiban masyarakat di lingkungan sekolah.',
      annualMilestones: [
        'Keberhasilan mempertahankan status Zero Crime dan Zero Accident di lingkungan sekolah',
        'Penyelesaian 100% perbaikan sarana fisik ringan (kunci pintu, engsel, saklar lampu, sanitasi air)',
        'Telah melaksanakan 360 kali patroli malam terverifikasi buku jurnal pos pengamanan',
        'Distribusi 148 ekspedisi surat dinas dinas pendidikan tanpa keterlambatan'
      ],
      strategicRecommendations: [
        'Perlu penambahan 4 titik kamera CCTV di area sudut buta (blindspot) gerbang timur',
        'Pengadaan genset darurat cadangan untuk lampu penerangan pos jaga saat padam listrik',
        'Pelatihan teknis K3 pemadam kebakaran berkala bersama Damkar Kota'
      ],
      approvalStatus: 'disahkan_kepsek'
    }
  },
  {
    id: 'arch-service-2026-ann',
    regNumber: 'ARS/2026/THN/SRV/006',
    title: 'Laporan Tahunan Layanan Kebersihan - Tahun Anggaran 2026',
    nomorSurat: '800/LAP-THN/20202819/2026',
    documentType: 'annual',
    role: 'SERVICE',
    period: 'Tahun Anggaran 2026',
    year: 2026,
    operatorName: 'AGUS SUPRIYADI',
    operatorNip: 'NIPPK. 19901103 202421 1 045',
    dateArchived: '2026-09-25T19:15:00.000Z',
    approvalStatus: 'disahkan_kepsek',
    inspectionNotes: 'Dokumen pendukung akreditasi UKS dan Sekolah Adiwiyata lengkap.',
    isAuditVerified: true,
    checklist: {
      hasKop: true,
      hasApprovalSheet: true,
      hasSignatures: true,
      hasStamp: true,
      hasPhotos: true,
      photoCount: 4
    },
    reportData: {
      id: 'ann-rep-srv-2026',
      role: 'SERVICE',
      year: 2026,
      manualDocDate: 'Teluk, 31 Desember 2026',
      summary: 'Laporan Tahunan Layanan Kebersihan Tahun 2026 menunjukkan keberhasilan pencapaian predikat Sekolah Adiwiyata Tingkat Mandiri dengan standar higienitas toilet dan pemilahan sampah organik/anorganik yang konsisten.',
      annualMilestones: [
        'Pengurangan volume sampah residu ke TPA sebesar 38% melalui komposting dan bank sampah',
        'Terselenggaranya sanitasi rutin toilet siswa dan guru dengan kepatuhan 99.2%',
        'Pemeliharaan higienitas ruang kelas harian tanpa keluhan dari warga sekolah',
        'Efisiensi pemakaian cairan pembersih melalui takaran terstandar dan aman ramah lingkungan'
      ],
      strategicRecommendations: [
        'Penggantian 2 unit gerobak dorong roda karet yang mulai aus',
        'Pengadaan mesin polisher lantai elektrik untuk mempercepat perawatan lantai aula dan koridor',
        'Penambahan wadah cuci tangan dengan pedal kaki di area kantin'
      ],
      approvalStatus: 'disahkan_kepsek'
    }
  },
  {
    id: 'arch-perpus-09-2026',
    regNumber: 'ARS/2026/09/PRS/007',
    title: 'Laporan Bulanan Layanan Perpustakaan - September 2026',
    nomorSurat: '800/LAP-BLN/09/PRS/20202819/2026',
    documentType: 'monthly',
    role: 'PERPUS',
    period: 'Bulan September 2026',
    year: 2026,
    month: 9,
    operatorName: 'NURUL HIDAYATI, S.I.Pust.',
    operatorNip: 'NIPPK. 19920815 202321 2 024',
    dateArchived: '2026-09-30T14:30:00.000Z',
    approvalStatus: 'disahkan_kepsek',
    inspectionNotes: 'Dokumen pelaporan sirkulasi, pengolahan buku DDC, dan jam literasi terverifikasi lengkap.',
    isAuditVerified: true,
    checklist: {
      hasKop: true,
      hasApprovalSheet: true,
      hasSignatures: true,
      hasStamp: true,
      hasPhotos: true,
      photoCount: 4
    },
    reportData: {
      id: 'm-rep-prs-09-2026',
      role: 'PERPUS',
      month: 9,
      year: 2026,
      manualDocDate: 'Teluk, 30 September 2026',
      summary: 'Layanan perpustakaan sekolah pada bulan September 2026 mencatatkan lonjakan pemustaka sebesar 25% pasca peluncuran program jam literasi terjadwal. Sebanyak 420 eksemplar buku berhasil disirkulasikan, 120 buku baru selesai dikatalogisasi DDC dan dilabeli barcode, serta 15 buku koleksi referensi rusak telah direstorasi.',
      achievements: [
        'Penyelesaian katalogisasi dan input data buku induk 120 judul buku bantuan BOS K-Merdeka',
        'Peningkatan angka kunjungan perpustakaan hingga rata-rata 85 siswa/hari',
        'Penyelenggaraan pendampingan literasi 15 menit membaca untuk seluruh rombel kelas 7',
        'Penerbitan 120 kartu anggota perpustakaan digital berbarcode untuk siswa baru',
        'Perawatan fisik dan restorasi pengeleman 15 eksemplar buku ensiklopedia & kamus'
      ],
      obstacles: [
        'Beberapa siswa terlambat mengembalikan buku teks pinjaman semester',
        'Ruang pojok baca lesehan memerlukan tambahan karpet spon anti-debu'
      ],
      solutions: [
        'Memberikan notifikasi pengingat ramah melalui wali kelas dan papan pengumuman perpus',
        'Mengajukan pengadaan 2 gulung karpet vinil lembut pada RKAS perubahan'
      ],
      approvalStatus: 'disahkan_kepsek'
    }
  },
  {
    id: 'arch-labipa-09-2026',
    regNumber: 'ARS/2026/09/IPA/008',
    title: 'Laporan Bulanan Laboratorium IPA - September 2026',
    nomorSurat: '800/LAP-BLN/09/IPA/20202819/2026',
    documentType: 'monthly',
    role: 'LAB_IPA',
    period: 'Bulan September 2026',
    year: 2026,
    month: 9,
    operatorName: 'HENDRA PRASETYA, S.Pd.',
    operatorNip: 'NIPPK. 19910320 202421 1 038',
    dateArchived: '2026-09-30T15:10:00.000Z',
    approvalStatus: 'disahkan_kepsek',
    inspectionNotes: 'Dokumen kelengkapan SOP K3 laboratorium, jurnal praktikum, dan kartu kalibrasi alat tuntas.',
    isAuditVerified: true,
    checklist: {
      hasKop: true,
      hasApprovalSheet: true,
      hasSignatures: true,
      hasStamp: true,
      hasPhotos: true,
      photoCount: 4
    },
    reportData: {
      id: 'm-rep-ipa-09-2026',
      role: 'LAB_IPA',
      month: 9,
      year: 2026,
      manualDocDate: 'Teluk, 30 September 2026',
      summary: 'Pelayanan praktikum laboratorium IPA sepanjang bulan September 2026 berjalan tertib, aman, dan tanpa kecelakaan kerja (Zero Laboratory Accident). Terlaksana 36 sesi praktikum fisika dan biologi, seluruh mikroskop dan neraca terkalibrasi baik, serta pengelolaan limbah netralisasi dan K3 terlaksana sesuai standar.',
      achievements: [
        'Fasilitasi penyiapan alat & bahan 36 sesi praktikum IPA kelas 7, 8, dan 9 tepat waktu',
        'Sterilisasi dan pencucian 240+ unit peralatan gelas laboratorium pasca praktikum tanpa kerusakan',
        'Pengecekan fungsi dan kalibrasi rutin 16 unit mikroskop monokuler dan 6 neraca Ohaus',
        'Pemeriksaan kesiapan kotak P3K dan indikator tekanan APAR 6 kg dalam kondisi siaga',
        'Pemutakhiran buku inventaris alat laboratorium dan kartu kendali peminjaman alat guru'
      ],
      obstacles: [
        'Stok reagen Biuret dan larutan Lugol menipis menjelang akhir praktikum sistem pencernaan',
        'Satu unit kran air wastafel ruang preparasi mengalami kebocoran seal karet'
      ],
      solutions: [
        'Membuat reagen mandiri dari bahan murni stok gudang dan mengajukan amprah reagen baru ke TU',
        'Mengganti seal karet kran bersama petugas penjaga sekolah sarpras'
      ],
      approvalStatus: 'disahkan_kepsek'
    }
  }
];

export const initialCustomCategories: CustomCategory[] = [
  {
    id: 'cat-tu-01',
    role: 'TU',
    name: 'Layanan Legalisir Ijazah & Rapor',
    slug: 'legalisir_ijazah',
    classification: 'pokok',
    description: 'Pemeriksaan keaslian, penatausahaan arsip dan pembubuhan cap legalisir ijazah/rapor alumni',
    createdAt: '2026-09-01'
  },
  {
    id: 'cat-penjaga-01',
    role: 'PENJAGA',
    name: 'Pengaturan Lalu Lintas Gerbang Sekolah',
    slug: 'lalu_lintas_gerbang',
    classification: 'pokok',
    description: 'Bantu penyeberangan peserta didik dan penertiban kendaraan antar-jemput depan gerbang utama',
    createdAt: '2026-09-01'
  },
  {
    id: 'cat-service-01',
    role: 'SERVICE',
    name: 'Sterilisasi Khusus Ruang UKS & Ibadah',
    slug: 'sterilisasi_uks_musholla',
    classification: 'pokok',
    description: 'Pembersihan antiseptik karpet musholla sekolah dan sterilisasi ranjang ruang UKS',
    createdAt: '2026-09-01'
  },
  {
    id: 'cat-perpus-01',
    role: 'PERPUS',
    name: 'Pengelolaan Pojok Baca Digital (E-Library)',
    slug: 'pojok_baca_digital',
    classification: 'tambahan',
    description: 'Penyediaan tablet baca digital dan asistensi peminjaman buku elektronik peserta didik',
    createdAt: '2026-09-01'
  },
  {
    id: 'cat-lab-01',
    role: 'LAB_IPA',
    name: 'Pemeliharaan Kebun Botani & Hidroponik Lab',
    slug: 'kebun_botani_lab',
    classification: 'tambahan',
    description: 'Pengecekan nutrisi hidroponik dan tanaman peraga biologi lingkungan laboratorium',
    createdAt: '2026-09-01'
  }
];

export const initialLibraryMemberStats: LibraryMemberStats = {
  siswaLaki: 142,
  siswaPerempuan: 158,
  guruPendidik: 24,
  staffTendik: 8,
  lastUpdated: '2026-10-25'
};

export const initialLibraryMembers: LibraryMemberItem[] = [
  {
    id: 'mem-g-01',
    nomorAnggota: 'ANG-G-001',
    nama: 'Dra. Hj. Nurjanah, M.Pd.',
    tipeAnggota: 'GURU',
    kelasAtauJabatan: 'Guru Bahasa Indonesia',
    nomorIdentitas: '19750812 200212 2 003',
    jenisKelamin: 'P',
    tanggalBergabung: '2026-07-15',
    status: 'aktif',
    keterangan: 'Peminjam aktif buku referensi pengajaran'
  },
  {
    id: 'mem-g-02',
    nomorAnggota: 'ANG-G-002',
    nama: 'Ahmad Fauzi, S.Pd., M.Si.',
    tipeAnggota: 'GURU',
    kelasAtauJabatan: 'Guru IPA Terpadu',
    nomorIdentitas: '19820315 200801 1 011',
    jenisKelamin: 'L',
    tanggalBergabung: '2026-07-15',
    status: 'aktif',
    keterangan: 'Koordinator literasi sains'
  },
  {
    id: 'mem-s-01',
    nomorAnggota: 'ANG-ST-001',
    nama: 'Slamet Riyadi, S.Kom.',
    tipeAnggota: 'STAFF',
    kelasAtauJabatan: 'Staf Administrasi & Tata Usaha',
    nomorIdentitas: '19890620 201402 1 002',
    jenisKelamin: 'L',
    tanggalBergabung: '2026-07-20',
    status: 'aktif',
    keterangan: 'Pustaka digital & arsip'
  },
  {
    id: 'mem-s-02',
    nomorAnggota: 'ANG-ST-002',
    nama: 'Rina Maryani, A.Md.',
    tipeAnggota: 'STAFF',
    kelasAtauJabatan: 'Staf Keuangan & BOS',
    nomorIdentitas: '19920410 201903 2 005',
    jenisKelamin: 'P',
    tanggalBergabung: '2026-08-01',
    status: 'aktif',
    keterangan: 'Peminjaman majalah & referensi'
  },
  {
    id: 'mem-sw-01',
    nomorAnggota: 'ANG-SW-001',
    nama: 'Muhammad Arya Pratama',
    tipeAnggota: 'SISWA',
    kelasAtauJabatan: 'Kelas VII-A',
    nomorIdentitas: 'NISN 0102938471',
    jenisKelamin: 'L',
    tanggalBergabung: '2026-07-22',
    status: 'aktif',
    keterangan: 'Duta Baca Kelas VII'
  },
  {
    id: 'mem-sw-02',
    nomorAnggota: 'ANG-SW-002',
    nama: 'Aisyah Putri Maharani',
    tipeAnggota: 'SISWA',
    kelasAtauJabatan: 'Kelas VII-B',
    nomorIdentitas: 'NISN 0108372619',
    jenisKelamin: 'P',
    tanggalBergabung: '2026-07-22',
    status: 'aktif',
    keterangan: 'Peminjam terajin novel fiksi'
  },
  {
    id: 'mem-sw-03',
    nomorAnggota: 'ANG-SW-003',
    nama: 'Rizky Ramadhan',
    tipeAnggota: 'SISWA',
    kelasAtauJabatan: 'Kelas VIII-A',
    nomorIdentitas: 'NISN 0098472615',
    jenisKelamin: 'L',
    tanggalBergabung: '2026-08-05',
    status: 'aktif',
    keterangan: 'Peminjaman buku sains'
  },
  {
    id: 'mem-sw-04',
    nomorAnggota: 'ANG-SW-004',
    nama: 'Dewi Lestari Safitri',
    tipeAnggota: 'SISWA',
    kelasAtauJabatan: 'Kelas IX-C',
    nomorIdentitas: 'NISN 0089283741',
    jenisKelamin: 'P',
    tanggalBergabung: '2026-08-10',
    status: 'aktif',
    keterangan: 'Persiapan literasi kelulusan'
  }
];

export const initialLibraryBooks: LibraryBookItem[] = [
  {
    id: 'bk-2026-07-01',
    kodeBuku: 'BK-2026-001',
    isbn: '978-602-244-301-8',
    judul: 'Bahasa Indonesia: Tingkap Jendela Ilmu Kelas VII (Kurikulum Merdeka)',
    penulis: 'Subarna, Rakhma & Dewayani',
    penerbit: 'Pusat Perbukuan Kemendikbudristek',
    tahunTerbit: 2024,
    ddc: '410',
    kategori: 'BUKU_TEKS',
    sumberPengadaan: 'BOS_REGULER',
    tanggalMasuk: '2026-07-10',
    bulanPengadaan: '2026-07',
    jumlah: 60,
    jumlahTersedia: 58,
    hargaSatuan: 28500,
    lokasiRak: 'Rak Teks A-01',
    kondisi: 'baik',
    keterangan: 'Pengadaan Buku Teks Utama Ajaran Baru 2026/2027'
  },
  {
    id: 'bk-2026-07-02',
    kodeBuku: 'BK-2026-002',
    isbn: '978-602-244-302-5',
    judul: 'Matematika untuk SMP/MTs Kelas VII (Kurikulum Merdeka)',
    penulis: 'Tosho, Gakko & Tim Pusat Kurikulum',
    penerbit: 'Pusat Perbukuan Kemendikbudristek',
    tahunTerbit: 2024,
    ddc: '510',
    kategori: 'BUKU_TEKS',
    sumberPengadaan: 'BOS_REGULER',
    tanggalMasuk: '2026-07-10',
    bulanPengadaan: '2026-07',
    jumlah: 60,
    jumlahTersedia: 60,
    hargaSatuan: 31000,
    lokasiRak: 'Rak Teks A-02',
    kondisi: 'baik',
    keterangan: 'Pengadaan Paket Semester 1 BOS Reguler'
  },
  {
    id: 'bk-2026-08-01',
    kodeBuku: 'BK-2026-003',
    isbn: '978-602-03-8591-2',
    judul: 'Laskar Pelangi (Edisi Khusus Literasi Pelajar)',
    penulis: 'Andrea Hirata',
    penerbit: 'Bentang Pustaka',
    tahunTerbit: 2023,
    ddc: '899',
    kategori: 'FIKSI_NOVEL',
    sumberPengadaan: 'BOS_KINERJA',
    tanggalMasuk: '2026-08-14',
    bulanPengadaan: '2026-08',
    jumlah: 15,
    jumlahTersedia: 12,
    hargaSatuan: 65000,
    lokasiRak: 'Rak Fiksi B-01',
    kondisi: 'baik',
    keterangan: 'Koleksi Gerakan Literasi Sekolah (GLS)'
  },
  {
    id: 'bk-2026-08-02',
    kodeBuku: 'BK-2026-004',
    isbn: '978-602-06-2341-9',
    judul: 'Negeri 5 Menara',
    penulis: 'A. Fuadi',
    penerbit: 'Gramedia Pustaka Utama',
    tahunTerbit: 2022,
    ddc: '899',
    kategori: 'FIKSI_NOVEL',
    sumberPengadaan: 'BOS_KINERJA',
    tanggalMasuk: '2026-08-14',
    bulanPengadaan: '2026-08',
    jumlah: 10,
    jumlahTersedia: 9,
    hargaSatuan: 72000,
    lokasiRak: 'Rak Fiksi B-01',
    kondisi: 'baik',
    keterangan: 'Koleksi novel penguatan karakter siswa'
  },
  {
    id: 'bk-2026-09-01',
    kodeBuku: 'BK-2026-005',
    isbn: '978-979-083-124-7',
    judul: 'Kamus Besar Bahasa Indonesia (KBBI) Edisi V Hardcover',
    penulis: 'Badan Pengembangan dan Pembinaan Bahasa',
    penerbit: 'Balai Pustaka',
    tahunTerbit: 2021,
    ddc: '413',
    kategori: 'REFERENSI',
    sumberPengadaan: 'BOS_REGULER',
    tanggalMasuk: '2026-09-05',
    bulanPengadaan: '2026-09',
    jumlah: 4,
    jumlahTersedia: 4,
    hargaSatuan: 420000,
    lokasiRak: 'Rak Referensi C-01 (Koleksi Khusus)',
    kondisi: 'baik',
    keterangan: 'Rujukan tata bahasa utama ruang baca guru & siswa'
  },
  {
    id: 'bk-2026-09-02',
    kodeBuku: 'BK-2026-006',
    isbn: '978-602-142-880-1',
    judul: 'Atlas Indonesia dan Dunia Edisi 38 Provinsi Lengkap',
    penulis: 'Tim Kartografi Geospasial',
    penerbit: 'Bhuana Ilmu Populer',
    tahunTerbit: 2024,
    ddc: '912',
    kategori: 'REFERENSI',
    sumberPengadaan: 'BOS_REGULER',
    tanggalMasuk: '2026-09-05',
    bulanPengadaan: '2026-09',
    jumlah: 6,
    jumlahTersedia: 6,
    hargaSatuan: 95000,
    lokasiRak: 'Rak Referensi C-02',
    kondisi: 'baik',
    keterangan: 'Pembaruan data geografi pemekaran provinsi Indonesia'
  },
  {
    id: 'bk-2026-10-01',
    kodeBuku: 'BK-2026-007',
    isbn: '978-623-180-210-4',
    judul: 'Ilmu Pengetahuan Alam (IPA) Berbasis Inkuiri Kelas VII',
    penulis: 'Victoriani Inabuy, dkk.',
    penerbit: 'Kemendikbudristek RI',
    tahunTerbit: 2024,
    ddc: '500',
    kategori: 'BUKU_TEKS',
    sumberPengadaan: 'BOS_REGULER',
    tanggalMasuk: '2026-10-08',
    bulanPengadaan: '2026-10',
    jumlah: 45,
    jumlahTersedia: 45,
    hargaSatuan: 32500,
    lokasiRak: 'Rak Teks A-03',
    kondisi: 'baik',
    keterangan: 'Pengadaan Buku Baru Tambahan Bulan Oktober 2026'
  },
  {
    id: 'bk-2026-10-02',
    kodeBuku: 'BK-2026-008',
    isbn: '978-602-424-694-5',
    judul: 'Ensiklopedia Cilik: Tata Surya dan Alam Semesta',
    penulis: 'Sylvie Baussier',
    penerbit: 'Kepustakaan Populer Gramedia',
    tahunTerbit: 2023,
    ddc: '520',
    kategori: 'ENSIKLOPEDIA',
    sumberPengadaan: 'HIBAH_SUMBANGAN',
    tanggalMasuk: '2026-10-18',
    bulanPengadaan: '2026-10',
    jumlah: 5,
    jumlahTersedia: 5,
    hargaSatuan: 110000,
    lokasiRak: 'Rak Ensiklopedia D-01',
    kondisi: 'baik',
    keterangan: 'Hibah Alumni dan Komite Sekolah Bulan Oktober 2026'
  }
];


