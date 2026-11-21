import { DatabaseAlertLevel, RoleType } from '../../types';

export const ROLE_OPTIONS: { value: RoleType; label: string }[] = [
  { value: 'TU', label: 'Tata Usaha (TU)' },
  { value: 'PENJAGA', label: 'Penjaga Sekolah' },
  { value: 'SERVICE', label: 'Service (Kebersihan)' },
  { value: 'PERPUS', label: 'Layanan Perpustakaan' },
  { value: 'LAB_IPA', label: 'Laboratorium IPA' }
];

export const ROLE_LABELS_MAP: Record<RoleType, string> = {
  TU: 'Tata Usaha (TU)',
  PENJAGA: 'Penjaga Sekolah',
  SERVICE: 'Service (Kebersihan)',
  PERPUS: 'Layanan Perpustakaan',
  LAB_IPA: 'Laboratorium IPA'
};

export const ROLE_BADGE: Record<RoleType, string> = {
  TU: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  PENJAGA: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  SERVICE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  PERPUS: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  LAB_IPA: 'bg-teal-500/15 text-teal-300 border-teal-500/30'
};

export function formatBytes(bytes: number): string {
  const safe = Number.isFinite(bytes) && bytes >= 0 ? bytes : 0;
  if (safe < 1024) return `${safe} B`;
  if (safe < 1024 * 1024) return `${(safe / 1024).toFixed(1)} KB`;
  return `${(safe / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDateTimeId(iso?: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

export const ALERT_META: Record<
  DatabaseAlertLevel,
  {
    label: string;
    badgeClass: string;
    barClass: string;
    bannerClass: string;
    description: string;
  }
> = {
  NORMAL: {
    label: 'Normal (<80%)',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    barClass: 'bg-emerald-500',
    bannerClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100',
    description: 'Kapasitas database dalam kondisi aman dan siap menampung transaksi baru.'
  },
  WARNING: {
    label: 'Peringatan (>=80%)',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    barClass: 'bg-amber-400',
    bannerClass: 'bg-amber-500/15 border-amber-500/40 text-amber-100',
    description: 'Kapasitas mendekati batas (>=80%). Disarankan membuat cadangan dan memperbesar kuota atau mengarsipkan data lama.'
  },
  CRITICAL: {
    label: 'Kritis (>=95%)',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    barClass: 'bg-rose-500',
    bannerClass: 'bg-rose-500/15 border-rose-500/45 text-rose-100',
    description: 'Kapasitas kritis (>=95%)! Segera arsipkan data tidak terpakai atau naikkan batas kuota sebelum penulisan terkunci.'
  },
  FULL: {
    label: 'Penuh · Terkunci (100%)',
    badgeClass: 'bg-red-600/30 text-red-200 border-red-500/70',
    barClass: 'bg-red-500',
    bannerClass: 'bg-red-600/20 border-red-500/60 text-red-100',
    description: 'Kapasitas mencapai 100%! Penulisan data baru dikunci otomatis oleh sistem untuk mencegah kehilangan data.'
  }
};
