export type RoleType = 'TU' | 'PENJAGA' | 'SERVICE' | 'PERPUS' | 'LAB_IPA';

export type RoleSubTab = 'tasks' | 'tupoksi' | 'monthly' | 'annual' | 'inventory' | 'buku' | 'anggota' | 'berita_acara';

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
  ownerUserId?: string;
  ownerUsername?: string;
  forkedFromId?: string;
  updatedAt?: string;
}

export interface LibraryMemberStats {
  siswaLaki: number;
  siswaPerempuan: number;
  guruPendidik: number;
  guruLaki?: number;
  guruPerempuan?: number;
  staffTendik: number;
  staffLaki?: number;
  staffPerempuan?: number;
  lastUpdated: string;
  isManualOverride?: boolean;
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
  status: 'aktif' | 'nonaktif' | 'tamat' | 'alumni' | string;
  telepon?: string;
  keterangan?: string;
  ownerUserId?: string;
  ownerUsername?: string;
  forkedFromId?: string;
  updatedAt?: string;
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
  ownerUserId?: string;
  ownerUsername?: string;
  forkedFromId?: string;
  updatedAt?: string;
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
  ownerUserId?: string;
  ownerUsername?: string;
  forkedFromId?: string;
  updatedAt?: string;
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
  ownerUserId?: string;
  ownerUsername?: string;
  forkedFromId?: string;
  updatedAt?: string;
}

export interface MonthlyReport {
  id: string;
  role: RoleType;
  month: number; // 1-12
  year: number;
  manualDocDate: string; // e.g. "Bogor, 30 September 2026"
  nomorSurat?: string;
  summary: string;
  achievements: string[];
  obstacles: string[];
  solutions: string[];
  customKPIs?: OperationalKPI[];
  approvalStatus: 'draft' | 'diajukan' | 'disetujui_kasubag' | 'disahkan_kepsek';
  ownerUserId?: string;
  ownerUsername?: string;
  forkedFromId?: string;
  updatedAt?: string;
}

export interface AnnualReport {
  id: string;
  role: RoleType;
  year: number;
  manualDocDate: string; // e.g. "Bogor, 31 Desember 2026"
  nomorSurat?: string;
  summary: string;
  annualMilestones: string[];
  strategicRecommendations: string[];
  obstacles?: string[];
  solutions?: string[];
  approvalStatus: 'draft' | 'diajukan' | 'disetujui_kasubag' | 'disahkan_kepsek';
  approvedByKepsekDate?: string;
  ownerUserId?: string;
  ownerUsername?: string;
  forkedFromId?: string;
  updatedAt?: string;
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

export type KopBorderStyle = 'double_thick' | 'double' | 'solid_thick' | 'solid_thin' | 'dashed';

export interface UserLetterheadConfig {
  userId?: string;
  username?: string;
  pemerintahDaerah?: string;
  dinasPendidikan?: string;
  namaSekolah?: string;
  npsn?: string;
  nss?: string;
  alamat?: string;
  desaKecamatan?: string;
  kabupatenKota?: string;
  provinsi?: string;
  kodePos?: string;
  telepon?: string;
  email?: string;
  website?: string;
  logoKabupatenUrl?: string;
  logoSekolahUrl?: string;
  logoKopKiri?: string;
  logoKopKanan?: string;
  logoAplikasiUrl?: string;
  kopBorderStyle?: KopBorderStyle;
  updatedAt: string;
  deleted?: boolean;
}

export interface UserSignatureConfig {
  userId?: string;
  username?: string;
  role?: RoleType;
  kepalaSekolah?: Partial<SchoolOfficer>;
  wakilKepalaSekolah?: Partial<SchoolOfficer>;
  operatorProfile?: Partial<SchoolOfficer>;
  stempelEnabled?: boolean;
  stempelTextLine1?: string;
  stempelTextLine2?: string;
  customStempelUrl?: string;
  updatedAt: string;
  deleted?: boolean;
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
  kopBorderStyle?: KopBorderStyle;
  stempelEnabled: boolean;
  stempelTextLine1: string;
  stempelTextLine2: string;
  customStempelUrl?: string; // uploaded stamp image data URL
  kepalaSekolah: SchoolOfficer;
  wakilKepalaSekolah?: SchoolOfficer;
  operatorProfiles: Record<RoleType, SchoolOfficer>;
  userLetterheads?: Record<string, UserLetterheadConfig>;
  userSignatures?: Record<string, UserSignatureConfig>;
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
  ownerUserId?: string;
  ownerUsername?: string;
  forkedFromId?: string;
  updatedAt?: string;
}

export type BeritaAcaraTemplateId =
  | 'kelulusan'
  | 'kenaikan_kelas'
  | 'bast_barang'
  | 'serah_terima_jabatan'
  | 'rapat_dinas'
  | 'rapat_sekolah_orang_tua'
  | 'pemeriksaan_kas'
  | 'pelaksanaan_ujian'
  | 'pemusnahan_arsip_barang'
  | 'ppdb_spmb'
  | 'kehilangan_kerusakan'
  | 'surat_pengantar_berobat';

export interface BeritaAcaraSignatory {
  roleLabel: string;
  jabatan: string;
  nama: string;
  nip: string;
  signatureImage?: string;
  dateLine?: string;
  rankOrder?: number; // Semakin besar nilai semakin tinggi jabatan (100 = Kepala Sekolah -> 20 = Pelaksana/Staf)
}

export interface BeritaAcaraDetailPair {
  label: string;
  value: string;
}

export interface BeritaAcaraTableData {
  title: string;
  columns: { header: string; align?: 'left' | 'center' | 'right'; widthPercent?: number }[];
  rows: string[][];
  footerRow?: string[];
}

export interface GeneratedBeritaAcaraContent {
  templateId: BeritaAcaraTemplateId;
  templateTitle: string;
  documentHeading: string; // e.g. "BERITA ACARA" or "SURAT PENGANTAR BEROBAT"
  documentSubHeading: string; // e.g. "RAPAT DEWAN GURU PENETAPAN KELULUSAN PESERTA DIDIK"
  nomorSurat: string;
  docDateLocation: string; // e.g. "Teluk, 16 November 2026"
  recipientLines?: string[]; // Optional "Kepada Yth." block for official letters
  openingParagraph: string;
  basisParagraphs: string[];
  detailSectionTitle?: string;
  detailPairs?: BeritaAcaraDetailPair[];
  partyBoxes?: {
    partyTitle: string;
    nama: string;
    nip: string;
    jabatan: string;
    unit?: string;
  }[];
  bodyParagraphs: string[];
  tables: BeritaAcaraTableData[];
  closingParagraph: string;
  signatoryLayout: 'two_col' | 'two_col_plus_kepsek' | 'ordered_hierarchy';
  leftSignatory: BeritaAcaraSignatory;
  rightSignatory: BeritaAcaraSignatory;
  centerBottomSignatory?: BeritaAcaraSignatory;
  orderedSignatories?: BeritaAcaraSignatory[];
  signatoriesPerRow?: 2 | 3;
  witnesses?: { nama: string; jabatan: string; nip?: string }[];
}

export interface SavedBeritaAcaraRecord {
  id: string;
  templateId: BeritaAcaraTemplateId;
  templateTitle: string;
  nomorSurat: string;
  tanggalSurat: string;
  ringkasan: string;
  formValues: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  ownerUserId?: string;
  ownerUsername?: string;
  forkedFromId?: string;
}

export type UserAccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PasswordResetStatus = 'NONE' | 'REQUESTED' | 'RESET_ISSUED' | 'COMPLETED';

export interface AccessSecurityRules {
  requireAdminApproval: boolean;
  enforceUniquePassword: boolean;
  enforceSingleServicePerUser: boolean;
}

export interface PasswordChangeLogEntry {
  changedAt: string;
  source: 'USER_CHANGE' | 'RESET_BY_ADMIN' | 'USER_AFTER_RESET' | 'ADMIN_CREATE' | 'LEGACY_MIGRATION';
  newPassword?: string;
  maskedPreview?: string;
}

export interface UserSchoolIdentity {
  namaSekolah: string;
  pemerintahDaerah?: string;
  dinasPendidikan?: string;
  kabupatenKota?: string;
  npsn?: string;
}

export interface ApprovedSchoolHeader {
  pemerintahDaerah?: string;
  dinasPendidikan?: string;
  namaSekolah: string;
  npsn?: string;
  kabupatenKota?: string;
  provinsi?: string;
  logoKabupatenUrl?: string;
  logoSekolahUrl?: string;
  logoAplikasiUrl?: string;
}

export interface RegisteredAccessUser {
  id: string;
  namaLengkap: string;
  username: string;
  role: RoleType;
  schoolIdentity?: UserSchoolIdentity;
  password?: string;
  tempResetCode?: string;
  hasPassword?: boolean;
  status: UserAccountStatus;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  lastLoginAt?: string;
  resetRequestStatus?: PasswordResetStatus;
  resetRequestedAt?: string;
  resetRequestNote?: string;
  resetIssuedAt?: string;
  mustChangePassword?: boolean;
  passwordUpdatedAt?: string;
  passwordChangeHistory?: PasswordChangeLogEntry[];
}

export interface AuthActionResult {
  ok: boolean;
  message: string;
  user?: RegisteredAccessUser;
  approvedSchoolHeader?: ApprovedSchoolHeader | null;
  requiresPasswordChange?: boolean;
  isAdmin?: boolean;
  adminProfile?: AdminProfile | null;
}

export type BackgroundMode = 'default' | 'preset' | 'image' | 'color';

export interface BackgroundConfig {
  mode: BackgroundMode;
  presetId?: string;
  imageUrl?: string;
  customColor?: string;
  customColorSecondary?: string;
  overlayOpacity?: number;
  blurPx?: number;
  updatedAt?: string;
  updatedBy?: string;
  userId?: string;
  username?: string;
  role?: RoleType;
  deleted?: boolean;
}

export interface SiteSettings {
  welcomeHeadline: string;
  welcomeSubheadline?: string;
  mainBackground?: BackgroundConfig | null;
  updatedAt?: string;
  updatedBy?: string;
}

export type DatabaseStatus = 'ACTIVE' | 'ARCHIVED' | 'LOCKED';
export type DatabaseAlertLevel = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'FULL';

export interface DatabaseFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
}

export interface DatabaseModuleMetrics {
  code: string;
  name: string;
  module: string;
  description: string;
  isBuiltin: boolean;
  status: DatabaseStatus;
  recordCount: number;
  maxRecords: number;
  remainingRecords: number;
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  percentUsed: number;
  alertLevel: DatabaseAlertLevel;
  fields?: DatabaseFieldDef[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DatabaseMetricsSummary {
  totalUsedBytes: number;
  totalQuotaBytes: number;
  totalRemainingBytes: number;
  totalPercentUsed: number;
  totalRecords: number;
  globalAlertLevel: DatabaseAlertLevel;
  effectiveAlertLevel: DatabaseAlertLevel;
  databases: DatabaseModuleMetrics[];
}

export interface DatabaseCapacityQuickSummary {
  totalUsedBytes: number;
  totalQuotaBytes: number;
  totalPercentUsed: number;
  effectiveAlertLevel: DatabaseAlertLevel;
}

export interface SoftDeletedItem {
  trashId: string;
  sourceCollection: string;
  isCustomDb?: boolean;
  originalId: string;
  itemTitle: string;
  itemSnapshot: any;
  deletedAt: string;
  deletedBy: string;
  reason?: string;
}

export interface DatabaseBackupMeta {
  id: string;
  label: string;
  type: 'MANUAL' | 'SCHEDULED' | 'PRE_MIGRATION' | 'PRE_RESTORE';
  createdAt: string;
  createdBy: string;
  sizeBytes: number;
  totalRecords: number;
  checksum: string;
}

export interface BackupScheduleConfig {
  enabled: boolean;
  intervalHours: number;
  lastBackupAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  targetDatabase: string;
  targetId?: string;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
  detail: string;
}

export interface StaffSubmissionItem {
  id: string;
  submittedBy: string;
  submittedByName?: string;
  role: RoleType;
  targetCollection: string;
  operationType: 'CREATE' | 'UPDATE';
  payload: any;
  note?: string;
  status: 'PENDING_ADMIN_REVIEW' | 'APPROVED_APPLIED' | 'REJECTED';
  rejectReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface MigrationReport {
  id: string;
  sourceName: string;
  targetCollection: string;
  duplicateStrategy: 'SKIP' | 'OVERWRITE' | 'RENAME_ID';
  totalInput: number;
  migratedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: string[];
  migratedIds: string[];
  preMigrationSnapshotId: string;
  rolledBack: boolean;
  rolledBackAt?: string;
  executedAt: string;
  executedBy: string;
}

export interface AdminProfile {
  id: string;
  username: string;
  email?: string;
  namaLengkap: string;
  role: 'ADMIN';
  status: 'ACTIVE';
  isDefaultCredentials?: boolean;
  updatedAt?: string;
}
