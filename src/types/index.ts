export type RoleType = 'TU' | 'PENJAGA' | 'SERVICE';

export type TaskCategoryPenjaga = 
  | 'keamanan' 
  | 'perbaikan_sapras' 
  | 'lingkungan' 
  | 'pengawasan_anak' 
  | 'antar_surat'
  | 'inspeksi_malam'
  | 'tanggap_darurat'
  | 'protokoler_tamu';

export type TaskCategoryTU = 
  | 'kepegawaian' 
  | 'siswa' 
  | 'sapras' 
  | 'surat_masuk' 
  | 'surat_keluar'
  | 'keuangan_bos'
  | 'kearsipan'
  | 'dapodik'
  | 'layanan_umum';

export type TaskCategoryService = 
  | 'kebersihan_kantor' 
  | 'kebersihan_wc' 
  | 'kebersihan_sampah'
  | 'sanitasi_disinfeksi'
  | 'kebersihan_halaman'
  | 'perawatan_taman'
  | 'penyediaan_air';

export type TaskCategory = TaskCategoryPenjaga | TaskCategoryTU | TaskCategoryService;

export interface TaskLog {
  id: string;
  role: RoleType;
  date: string; // YYYY-MM-DD
  category: TaskCategory;
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
  approvalStatus: 'draft' | 'diajukan' | 'disetujui_kasubag' | 'disahkan_kepsek';
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
