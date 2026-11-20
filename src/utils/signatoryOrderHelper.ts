import {
  BeritaAcaraSignatory,
  GeneratedBeritaAcaraContent,
  SchoolConfig
} from '../types';
import { formatOfficialNameWithDegree, formatOfficialNipOrPppk } from './formatters';

export interface JabatanHierarchyPreset {
  id: string;
  label: string;
  rankOrder: number;
  defaultRoleLabel: string;
  defaultJabatan: string;
}

/**
 * Urutan hierarki resmi jabatan di Satuan Pendidikan dari TERTINGGI ke TERENDAH.
 * Semakin besar rankOrder, semakin awal posisinya (Kiri Atas -> Kanan Atas -> Baris Berikutnya Kiri -> Kanan).
 */
export const JABATAN_HIERARCHY_PRESETS: JabatanHierarchyPreset[] = [
  {
    id: 'kepsek',
    label: '1. Kepala Sekolah / Kepala Satuan Pendidikan (Tertinggi)',
    rankOrder: 100,
    defaultRoleLabel: 'Mengetahui / Mengesahkan,',
    defaultJabatan: 'Kepala Sekolah'
  },
  {
    id: 'wakasek',
    label: '2. Wakil Kepala Sekolah (Wakasek)',
    rankOrder: 85,
    defaultRoleLabel: 'Wakil Kepala Sekolah,',
    defaultJabatan: 'Wakil Kepala Sekolah'
  },
  {
    id: 'komite',
    label: '3. Ketua Komite Sekolah / Pengawas',
    rankOrder: 75,
    defaultRoleLabel: 'Mengetahui / Perwakilan,',
    defaultJabatan: 'Ketua Komite Sekolah'
  },
  {
    id: 'kasubag_tu',
    label: '4. Kepala / Kasubag / Koordinator Tata Usaha',
    rankOrder: 70,
    defaultRoleLabel: 'Menyetujui,',
    defaultJabatan: 'Kepala Tata Usaha'
  },
  {
    id: 'ketua_panitia',
    label: '5. Ketua Panitia / Koordinator Unit / Wali Kelas',
    rankOrder: 60,
    defaultRoleLabel: 'Ketua Panitia / Koordinator,',
    defaultJabatan: 'Ketua Panitia'
  },
  {
    id: 'pengawas_ruang',
    label: '6. Pengawas Ruang / Guru / Pembina',
    rankOrder: 50,
    defaultRoleLabel: 'Pengawas / Guru,',
    defaultJabatan: 'Pengawas Ruang'
  },
  {
    id: 'sekretaris_bendahara',
    label: '7. Sekretaris / Bendahara / Pengurus Barang / Proktor',
    rankOrder: 40,
    defaultRoleLabel: 'Sekretaris / Bendahara,',
    defaultJabatan: 'Sekretaris / Bendahara'
  },
  {
    id: 'pelaksana_staf',
    label: '8. Pelaksana TU / Notulis / Petugas UKS / Operator (Terendah)',
    rankOrder: 25,
    defaultRoleLabel: 'Pelaksana / Petugas,',
    defaultJabatan: 'Pelaksana Tata Usaha'
  }
];

/**
 * Menentukan skor peringkat jabatan secara otomatis dari teks jabatan/roleLabel
 * (jika rankOrder eksplisit belum ditentukan).
 */
export function getRoleRankPriority(
  jabatan?: string,
  roleLabel?: string,
  explicitRank?: number
): number {
  if (typeof explicitRank === 'number' && Number.isFinite(explicitRank) && explicitRank > 0) {
    return explicitRank;
  }

  const text = `${jabatan || ''} ${roleLabel || ''}`.toLowerCase().trim();
  if (!text) return 20;

  // Wakil Kepala Sekolah HARUS dicek sebelum Kepala Sekolah agar tidak tertukar kata "kepala sekolah"
  if (/(wakil\s+kepala|wakasek|waka\s+)/i.test(text)) {
    return 85;
  }

  if (/(plt\.?\s*kepala\s*sekolah)/i.test(text)) {
    return 95;
  }

  if (/(kepala\s+sekolah|kepala\s+satuan\s+pendidikan|kepala\s+madrasah|kepsek)/i.test(text)) {
    return 100;
  }

  if (/(komite|orang\s+tua|wali\s+siswa|wali\s+murid|dinas|pengawas\s+sekolah)/i.test(text)) {
    return 75;
  }

  if (/(kasubag|kepala\s+tata\s+usaha|kepala\s+tu|koordinator\s+urusan\s+tu|koordinator\s+tata\s+usaha|kaur\s+tu)/i.test(text)) {
    return 70;
  }

  if (/(pihak\s+kedua|pejabat\s+lama|ketua\s+panitia|ketua\s+tim|ketua\s+pelaksana|kepala\s+perpustakaan|kepala\s+lab)/i.test(text)) {
    return 60;
  }

  if (/(pihak\s+pertama|pejabat\s+baru|pengawas\s+ruang|pengawas\s+ujian|wali\s+kelas|pembina|guru)/i.test(text)) {
    return 50;
  }

  if (/(bendahara|pengurus\s+barang|sekretaris|proktor|arsiparis)/i.test(text)) {
    return 40;
  }

  if (/(notulis|pelaksana|staf|petugas|uks|operator|anggota|pengelola)/i.test(text)) {
    return 25;
  }

  return 30;
}

/**
 * Mengurutkan daftar penandatangan dari jabatan TERTINGGI ke TERENDAH secara stabil.
 * Contoh: [Wakil Kepala Sekolah, Kepala Sekolah] -> [Kepala Sekolah (Kiri), Wakil Kepala Sekolah (Kanan)]
 */
export function sortSignatoriesByHierarchy<
  T extends { jabatan?: string; roleLabel?: string; rankOrder?: number }
>(items: T[]): T[] {
  return items
    .map((item, idx) => ({
      item,
      idx,
      priority: getRoleRankPriority(item.jabatan, item.roleLabel, item.rankOrder)
    }))
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.idx - b.idx;
    })
    .map(entry => ({
      ...entry.item,
      rankOrder: entry.priority
    }));
}

/**
 * Membagi penandatangan yang sudah terurut ke dalam baris-baris grid (2 atau 3 kolom per baris)
 * dan menempatkan baris Tempat & Tanggal pada kolom kanan atas secara rapi.
 */
export function prepareOrderedSignatoriesWithDate(
  signatories: BeritaAcaraSignatory[],
  docDateLocation: string,
  columnsPerRow: 2 | 3 = 2
): BeritaAcaraSignatory[] {
  const sorted = sortSignatoriesByHierarchy(signatories);
  if (sorted.length === 0) return [];

  const cols = sorted.length === 3 && columnsPerRow === 3 ? 3 : 2;
  const dateTargetIndex = sorted.length === 1 ? 0 : Math.min(cols - 1, sorted.length - 1);

  return sorted.map((sig, idx) => ({
    ...sig,
    dateLine: idx === dateTargetIndex ? (sig.dateLine || docDateLocation) : undefined
  }));
}

/**
 * Memecah array penandatangan menjadi baris-baris (row chunks) untuk rendering grid/tabel
 * dari kiri ke kanan, baris demi baris.
 */
export function chunkSignatoriesIntoRows(
  signatories: BeritaAcaraSignatory[],
  columnsPerRow: 2 | 3 = 2
): BeritaAcaraSignatory[][] {
  const cols = signatories.length === 3 && columnsPerRow === 3 ? 3 : 2;
  const rows: BeritaAcaraSignatory[][] = [];
  for (let i = 0; i < signatories.length; i += cols) {
    rows.push(signatories.slice(i, i + cols));
  }
  return rows;
}

/**
 * Mengambil seluruh daftar penandatangan bawaan dari GeneratedBeritaAcaraContent
 * lalu mengurutkannya dari tertinggi ke terendah (Left -> Right).
 */
export function extractOrderedSignatoriesFromContent(
  content: GeneratedBeritaAcaraContent
): BeritaAcaraSignatory[] {
  if (content.orderedSignatories && content.orderedSignatories.length > 0) {
    return sortSignatoriesByHierarchy(content.orderedSignatories);
  }
  const pool: BeritaAcaraSignatory[] = [];
  if (content.centerBottomSignatory) pool.push(content.centerBottomSignatory);
  if (content.leftSignatory) pool.push(content.leftSignatory);
  if (content.rightSignatory) pool.push(content.rightSignatory);
  return sortSignatoriesByHierarchy(pool);
}

/**
 * Helper mengambil profil Wakil Kepala Sekolah dari SchoolConfig secara aman.
 */
export function getWakasekInfo(config: SchoolConfig): BeritaAcaraSignatory {
  const wakasek = config.wakilKepalaSekolah;
  const rawName = (wakasek?.nama || '').trim();
  const isEmpty = !rawName;
  const nama = isEmpty ? '( .................................................. )' : formatOfficialNameWithDegree(rawName);
  const rawNip = (wakasek?.nip || '').trim();
  const nip = isEmpty || !rawNip
    ? formatOfficialNipOrPppk('', { defaultPrefix: 'NIP', placeholderDots: true })
    : formatOfficialNipOrPppk(rawNip, { defaultPrefix: 'NIP', placeholderDots: true });
  return {
    roleLabel: 'Wakil Kepala Sekolah,',
    jabatan: wakasek?.jabatan?.trim() || 'Wakil Kepala Sekolah',
    nama,
    nip,
    rankOrder: 85,
    signatureImage: !isEmpty ? wakasek?.signatureImage : undefined
  };
}
