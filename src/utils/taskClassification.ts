import { RoleType, TaskCategory, TaskLog } from '../types';

export type TaskTypeClassification = 'pokok' | 'tambahan';

export interface TaskClassificationInfo {
  type: TaskTypeClassification;
  label: string;
  badgeColor: string;
  description: string;
}

export function getTaskClassification(
  role: RoleType, 
  category: TaskCategory, 
  explicitType?: 'pokok' | 'tambahan'
): TaskTypeClassification {
  if (explicitType === 'pokok' || explicitType === 'tambahan') {
    return explicitType;
  }
  if (role === 'PENJAGA') {
    // Tugas Pokok Penjaga Sekolah:
    // - Buka & tutup pintu gerbang utama & gedung sekolah (keamanan)
    // - Patroli keamanan gedung & pengecekan kunci malam (keamanan)
    // - Pengendalian pintu gerbang jam belajar mengajar / KBM (keamanan)
    // - Inspeksi & ronda malam pukul 02.00 (inspeksi_malam)
    if (category === 'keamanan' || category === 'inspeksi_malam') {
      return 'pokok';
    }
    // Tugas Tambahan: pengawasan anak, protokoler tamu & parkir, perbaikan sarpras ringan, lingkungan, antar surat, tanggap darurat
    return 'tambahan';
  }

  if (role === 'TU') {
    // Tugas Pokok Tenaga Administrasi Sekolah (TU):
    // - Administrasi kepegawaian GTK (kepegawaian)
    // - Administrasi kesiswaan, mutasi & PIP (siswa)
    // - Pengelolaan agenda persuratan masuk & keluar (surat_masuk, surat_keluar)
    // - Pengelolaan Kearsipan Tata Naskah Dinas (kearsipan)
    // - Administrasi Keuangan BOS & BKU (keuangan_bos)
    // - Inventarisasi Barang Sarpras & KIB (sapras)
    // - Sinkronisasi & Pemutakhiran Dapodik (dapodik)
    if (category === 'layanan_umum') {
      return 'tambahan';
    }
    return 'pokok';
  }

  if (role === 'SERVICE') {
    // Tugas Pokok Layanan Kebersihan (Service):
    // - Kebersihan & sanitasi toilet/WC (kebersihan_wc)
    // - Kebersihan ruang kantor & kelas (kebersihan_kantor)
    // - Kebersihan halaman upacara & koridor (kebersihan_halaman)
    // - Pengelolaan & pengangkutan sampah ke TPS (kebersihan_sampah)
    if (
      category === 'kebersihan_wc' || 
      category === 'kebersihan_kantor' || 
      category === 'kebersihan_halaman' || 
      category === 'kebersihan_sampah'
    ) {
      return 'pokok';
    }
    // Tugas Tambahan: perawatan taman pot/bunga, penyediaan air & pompa, sanitasi disinfeksi UKS/musholla
    return 'tambahan';
  }

  return 'pokok';
}

export function getClassificationInfo(role: RoleType, category: TaskCategory): TaskClassificationInfo {
  const type = getTaskClassification(role, category);
  if (type === 'pokok') {
    return {
      type: 'pokok',
      label: 'Tugas Pokok (Tupoksi)',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Tugas utama kedinasan sesuai standar pelayanan minimal operasional satuan pendidikan'
    };
  }
  return {
    type: 'tambahan',
    label: 'Tugas Tambahan',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Tugas insidental, penunjang, perbaikan swakelola, atau penugasan khusus pimpinan'
  };
}

/**
 * Standard Tupoksi definitions for each role
 */
export const OFFICIAL_TUPOKSI_DEFINITIONS: Record<RoleType, {
  tupoksiList: string[];
  tugasTambahanList: string[];
}> = {
  TU: {
    tupoksiList: [
      'Pengelolaan Administrasi Kepegawaian GTK, SK Berkala & SKP ASN',
      'Pelayanan Administrasi Kesiswaan, Buku Induk, Mutasi & Bantuan PIP',
      'Pengelolaan Keuangan Sekolah, Rekonsiliasi Buku Kas Umum (BKU) BOS',
      'Registrasi Persuratan Dinas, Buku Agenda Surat Masuk & Surat Keluar',
      'Inventarisasi Sarana Prasarana Sekolah, Kartu Inventaris Ruangan (KIR) & KIB',
      'Pemutakhiran Data Pokok Pendidikan (Dapodikdasmen) & Sinkronisasi Berkala'
    ],
    tugasTambahanList: [
      'Kepanitiaan Pelaksanaan Asesmen Nasional Berbasis Komputer (ANBK)',
      'Kepanitiaan Penerimaan Peserta Didik Baru (PPDB) Satuan Pendidikan',
      'Pelayanan Informasi, Penerimaan Tamu Kedinasan & Penyiapan Rapat Dinas'
    ]
  },
  PENJAGA: {
    tupoksiList: [
      'SOP Pembukaan Pintu Gerbang Utama & Seluruh Akses Gedung Kelas Pagi Hari',
      'SOP Penutupan & Penguncian Gembok Rantai Gerbang serta Ruang Gedung Sore Hari',
      'Pengendalian Pintu Gerbang & Pembatasan Akses Keluar-Masuk Selama Jam KBM',
      'Patroli Keamanan Malam Hari & Pengecekan Kunci/Gembok Seluruh Ruangan Berteralis',
      'Ronda Malam Pukul 02:00 WIB di Area Rawan Belakang Gedung & Gardu Listrik/MCB',
      'Penjagaan Pos Pengamanan Gerbang Utama 24 Jam Bebas Gangguan Kamtibmas'
    ],
    tugasTambahanList: [
      'Pengawasan Kedatangan Siswa & Penyeberangan Jalan Raya Depan Sekolah Pagi Hari',
      'Perbaikan Sarana Prasarana Ringan (Kran Air, Engsel Pintu, Kunci & Lampu LED)',
      'Ekspedisi Pengantaran Surat Dinas Usulan ke Dinas Pendidikan & Instansi Luar',
      'Pembersihan Selokan & Penanganan Genangan Air Hujan di Pintu Masuk Sekolah',
      'Pemangkasan Dahan Pohon Rindang Dekat Bentangan Jaringan Listrik PLN'
    ]
  },
  SERVICE: {
    tupoksiList: [
      'Sanitasi & Desinfeksi Harian Seluruh Toilet/WC Siswa dan Guru (Pagi & Siang)',
      'Pembersihan Menyeluruh & Pengepelan Lantai Ruang Kepala Sekolah, Guru, TU & Lobi',
      'Penyapuan Halaman Upacara, Lapangan Olahraga & Selasar Koridor Depan Kelas',
      'Pengosongan Tempat Sampah Kelas, Pemilahan Sampah & Pengangkutan ke TPS Harian'
    ],
    tugasTambahanList: [
      'Perawatan Taman Depan Lobi, Pembersihan Gulma & Penyiraman Pot Tanaman Hias',
      'Pemeriksaan Pompa Air Jet Pump, Pembersihan Saringan Tandon Puncak & Bak Air',
      'Penyemprotan Disinfektan Ruang UKS & Penyedotan Debu Karpet Musholla Sekolah',
      'Penataan Kursi dan Meja untuk Keperluan Rapat Dinas & Upacara Sekolah'
    ]
  }
};

const INDO_MONTH_MAP: Record<string, number> = {
  jan: 1, januari: 1,
  feb: 2, februari: 2,
  mar: 3, maret: 3,
  apr: 4, april: 4,
  mei: 5,
  jun: 6, juni: 6,
  jul: 7, juli: 7,
  agu: 8, agustus: 8,
  sep: 9, september: 9,
  okt: 10, oktober: 10, oct: 10,
  nov: 11, november: 11,
  des: 12, desember: 12, dec: 12
};

/**
 * Universal date parser that extracts month (1-12) and year from any format:
 * - YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
 * - DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
 * - Text dates like "25 September 2026", "1 Oktober 2026"
 * - ISO string "2026-10-01T..."
 */
export function parseTaskMonthYear(taskDate: string): { month: number; year: number } | null {
  if (!taskDate) return null;
  const clean = taskDate.split('T')[0].trim().toLowerCase();

  // 1. Textual Indonesian month detection (e.g. "30 September 2026")
  for (const [key, mVal] of Object.entries(INDO_MONTH_MAP)) {
    if (clean.includes(key)) {
      const yearMatch = clean.match(/\b(20\d\d)\b/);
      const yearVal = yearMatch ? parseInt(yearMatch[1], 10) : 2026;
      return { month: mVal, year: yearVal };
    }
  }

  // 2. Delimited numeric dates
  const parts = clean.split(/[-/.]/);
  if (parts.length >= 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m)) return { month: m, year: y };
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      const y = parseInt(parts[2], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m)) return { month: m, year: y };
    }
  } else if (parts.length === 2) {
    if (parts[0].length === 4) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m)) return { month: m, year: y };
    } else {
      const m = parseInt(parts[0], 10);
      const y = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m)) return { month: m, year: y };
    }
  }

  // 3. Fallback standard Date parsing
  try {
    const d = new Date(taskDate);
    if (!isNaN(d.getTime())) {
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    }
  } catch (_) {}

  return null;
}

/**
 * Safe date parsing to avoid UTC timezone off-by-one shifts and format differences
 */
export function isTaskInMonth(taskDate: string, month: number, year: number): boolean {
  const parsed = parseTaskMonthYear(taskDate);
  if (!parsed) return false;
  return parsed.month === month && parsed.year === year;
}

export function isTaskInYear(taskDate: string, year: number): boolean {
  const parsed = parseTaskMonthYear(taskDate);
  if (!parsed) return false;
  return parsed.year === year;
}

/**
 * Returns YYYY-MM-DD string for current local date (avoids UTC midnight offset shift)
 */
export function getLocalTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
