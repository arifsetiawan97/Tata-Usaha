export type RoleType = 'TU' | 'PENJAGA' | 'SERVICE' | 'PERPUS' | 'LAB_IPA';

export type RoleSubTab = 'tasks' | 'tupoksi' | 'monthly' | 'annual' | 'inventory' | 'buku' | 'anggota';

export type LibraryBookCategory = 
  | 'Buku Teks Utama' 
  | 'Buku Pengayaan' 
  | 'Buku Referensi' 
  | 'Fiksi / Cerita' 
  | 'Non-Fiksi' 
  | 'Buku Guru' 
  | 'Kamus & Ensiklopedia'
  | 'Agama & Budi Pekerti';

export type LibraryProcurementSource = 
  | 'BOS Reguler' 
  | 'BOS Kinerja' 
  | 'Hibah / Bantuan' 
  | 'APBD / DAK' 
  | 'Swadaya / Komite';

export interface LibraryBookItem {
  id: string;
  kodeBuku: string;
  nomorInventaris?: string;
  judul: string;
  penulis: string;
  pengarang?: string;
  penerbit: string;
  tahunTerbit: number;
  tahunBeli?: number | string;
  isbn?: string;
  ddcKlasifikasi?: string;
  ddc?: string;
  kategoriBuku?: LibraryBookCategory | string;
  kategori?: string;
  kelas?: string; // e.g. "Kelas VII", "Kelas VIII", "Kelas IX", "Umum", "Referensi"
  statusBuku?: 'guru' | 'siswa' | 'referensi' | 'umum' | string;
  sumberPengadaan: LibraryProcurementSource | string;
  tanggalMasuk: string; // YYYY-MM-DD
  bulanPengadaan: number | string; // e.g. 10 or "2026-10"
  tahunPengadaan?: number;
  jumlah: number; // Jumlah eksemplar
  jumlahTersedia?: number;
  hargaSatuan?: number;
  totalHarga?: number;
  kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'baik' | 'rusak_ringan' | 'rusak_berat';
  lokasiRak: string;
  keterangan?: string;
}

export interface LibraryMemberStats {
  siswaLaki: number;
  siswaPerempuan: number;
  guruPendidik: number;
  staffTendik: number;
  lastUpdated: string;
}

export interface LibraryMemberItem {
  id: string;
  nomorAnggota: string;
  nama: string;
  tipeAnggota: 'siswa' | 'guru' | 'staff' | 'SISWA' | 'GURU' | 'STAFF';
  kelasAtauJabatan: string;
  nomorIdentitas?: string;
  jenisKelamin: 'L' | 'P';
  tanggalTerdaftar?: string;
  tanggalBergabung?: string;
  status: 'aktif' | 'nonaktif';
  telepon?: string;
  keterangan?: string;
}

export type TaskCategoryPenjaga = 
  | 'keamanan' 
  | 'perbaikan_sapras' 
  | 'lingkungan' 
  | 'pengawasan_anak' 
  | 'antar_surat'
  | 'inspeksi_malam'
  | 'tanggap_darurat'
  | 'protokoler_tamu'
  | 'pendampingan_kegiatan'
  | 'pengamanan_ujian'
  | 'koordinasi_keamanan'
  | 'penataan_parkir'
  | 'evakuasi_sarpras';

export type TaskCategoryTU = 
  | 'kepegawaian' 
  | 'siswa' 
  | 'sapras' 
  | 'surat_masuk' 
  | 'surat_keluar'
  | 'keuangan_bos'
  | 'kearsipan'
  | 'dapodik'
  | 'layanan_umum'
  | 'pelaporan_bos'
  | 'pengarsipan_digital'
  | 'pelayanan_mutasi'
  | 'fasilitasi_rapat'
  | 'legalisir_dokumen';

export type TaskCategoryService = 
  | 'kebersihan_kantor' 
  | 'kebersihan_wc' 
  | 'kebersihan_sampah'
  | 'sanitasi_disinfeksi'
  | 'kebersihan_halaman'
  | 'perawatan_taman'
  | 'penyediaan_air'
  | 'pemeliharaan_taman'
  | 'drainase_saluran'
  | 'persiapan_aula'
  | 'sterilisasi_ruang'
  | 'pengecatan_ringan';

export type TaskCategoryPerpus = 
  | 'katalogisasi_buku'
  | 'sirkulasi_peminjaman'
  | 'layanan_literasi'
  | 'perawatan_buku'
  | 'stock_opname'
  | 'administrasi_perpus'
  | 'pengolahan_label'
  | 'promosi_literasi'
  | 'layanan_referensi'
  | 'penyiangan_weeding'
  | 'kerjasama_perpustakaan';

export type TaskCategoryLabIPA = 
  | 'persiapan_praktikum'
  | 'pemeliharaan_alat'
  | 'inventaris_bahan'
  | 'k3_laboratorium'
  | 'jadwal_lab'
  | 'perbaikan_alat'
  | 'pengelolaan_limbah'
  | 'kalibrasi_presisi'
  | 'pembuatan_reagen'
  | 'peragaan_sains'
  | 'penataan_spesimen';

export type TaskCategory = 
  | TaskCategoryPenjaga 
  | TaskCategoryTU 
  | TaskCategoryService 
  | TaskCategoryPerpus 
  | TaskCategoryLabIPA
  | (string & {});

export interface CustomCategory {
  id: string;
  role: RoleType;
  name: string;
  slug: string;
  classification: 'pokok' | 'tambahan';
  description?: string;
  createdAt: string;
}

export interface TaskLog {
  id: string;
  role: RoleType;
  date: string; // YYYY-MM-DD
  category: TaskCategory;
  taskType?: 'pokok' | 'tambahan';
  title: string;
  description: string;
  location: string;
  timeStart: string;
  timeEnd: string;
  status: 'selesai' | 'dalam_proses' | 'perlu_tindak_lanjut';
  volumeUnit: string;
  photoUrl?: string;
  petugas: string;
  notes?: string;
}

export interface TupoksiDefinitionItem {
  tupoksiList: string[];
  tugasTambahanList: string[];
}

export type TupoksiDefinitionsMap = Record<RoleType, TupoksiDefinitionItem>;

export interface InventoryItem {
  id: string;
  role: RoleType;
  kodeBarang: string;
  namaBarang: string;
  merkModel: string;
  kategori: string;
  jumlah: number;
  satuan: string;
  kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  lokasiPenyimpanan: string;
  tahunPengadaan: number;
  keterangan: string;
}

export interface MonthlyReport {
  id: string;
  role: RoleType;
  month: number; // 1-12
  year: number;
  manualDocDate: string; // e.g. "Bogor, 30 September 2026"
  summary: string;
  achievements: string[];
  obstacles: string[];
  solutions: string[];
  approvalStatus: 'draft' | 'diajukan' | 'disetujui_kasubag' | 'disahkan_kepsek';
}

export interface AnnualReport {
  id: string;
  role: RoleType;
  year: number;
  manualDocDate: string; // e.g. "Bogor, 31 Desember 2026"
  summary: string;
  annualMilestones: string[];
  strategicRecommendations: string[];
  obstacles?: string[];
  solutions?: string[];
  approvalStatus: 'draft' | 'diajukan' | 'disetujui_kasubag' | 'disahkan_kepsek';
}

export interface OperationalKPI {
  code: string;
  name: string;
  target: string;
  realization: string;
  unit: string;
  status: 'tercapai' | 'dalam_proses';
}

export interface SchoolOfficer {
  nama: string;
  nip: string; // NIP atau NIPPK
  pangkatGolongan?: string;
  jabatan: string;
  signatureType: 'draw' | 'bsre_qr' | 'script' | 'upload';
  signatureData?: string; // canvas base64 or script text
  signatureImage?: string; // uploaded signature image data URL
}

export interface SchoolConfig {
  pemerintahDaerah: string;
  dinasPendidikan: string;
  namaSekolah: string;
  npsn: string;
  nss: string;
  alamat: string;
  desaKecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  logoKabupatenUrl: string;
  logoSekolahUrl: string;
  logoKopKiri?: string; // Uploaded custom left logo for Kop Surat
  logoKopKanan?: string; // Uploaded custom right logo for Kop Surat
  logoAplikasiUrl?: string;
  stempelEnabled: boolean;
  stempelTextLine1: string;
  stempelTextLine2: string;
  customStempelUrl?: string; // uploaded stamp image data URL
  kepalaSekolah: SchoolOfficer;
  operatorProfiles: Record<RoleType, SchoolOfficer>;
}

export interface ArchiveDocument {
  id: string;
  regNumber: string; // e.g. "ARS/2026/09/TU/001"
  title: string; // e.g. "Laporan Bulanan Kinerja TU - September 2026"
  nomorSurat: string; // e.g. "800/LAP-BLN/9/20200001/2026"
  documentType: 'monthly' | 'annual' | 'inventory' | 'custom';
  role: RoleType;
  period: string; // e.g. "Bulan September 2026" or "Tahun Anggaran 2026"
  year: number;
  month?: number;
  operatorName: string;
  operatorNip: string;
  dateArchived: string; // ISO string
  approvalStatus: 'draft' | 'diajukan' | 'disetujui_kasubag' | 'disahkan_kepsek';
  inspectionNotes?: string;
  isAuditVerified?: boolean;
  checklist: {
    hasKop: boolean;
    hasApprovalSheet: boolean;
    hasSignatures: boolean;
    hasStamp: boolean;
    hasPhotos: boolean;
    photoCount: number;
  };
  reportData: any; // Complete snapshot for inspection preview/print
}
