import {
  KopBorderStyle,
  RegisteredAccessUser,
  RoleType,
  SchoolConfig,
  SchoolOfficer,
  UserLetterheadConfig,
  UserSignatureConfig
} from '../types';

export interface KopBorderOption {
  id: KopBorderStyle;
  label: string;
  description: string;
}

export const KOP_BORDER_OPTIONS: KopBorderOption[] = [
  {
    id: 'double_thick',
    label: 'Garis Ganda Resmi (Tebal + Tipis)',
    description: 'Standar surat dinas pemerintah (3px atas + 1px bawah)'
  },
  {
    id: 'double',
    label: 'Garis Ganda Seimbang',
    description: 'Dua garis paralel berukuran seimbang (border double 4px)'
  },
  {
    id: 'solid_thick',
    label: 'Garis Tunggal Tebal',
    description: 'Satu garis lurus tegas (3px solid)'
  },
  {
    id: 'solid_thin',
    label: 'Garis Tunggal Tipis',
    description: 'Satu garis minimalis modern (1.5px solid)'
  },
  {
    id: 'dashed',
    label: 'Garis Putus-Putus',
    description: 'Garis pembatas putus-putus dekoratif (2px dashed)'
  }
];

/**
 * Generates an exclusive per-user isolation key bound to the user's ID (preferred)
 * or normalized username/email. Guarantees Arif, Ardi, or any two users on the same
 * deployment URL NEVER collide or overwrite each other's Kop Surat or Lembar Pengesahan.
 */
export function getUserIsolationKey(
  user?: Pick<RegisteredAccessUser, 'id' | 'username'> | null
): string | null {
  if (!user) return null;
  if (user.id && user.id.trim()) {
    return user.id.trim();
  }
  if (user.username && user.username.trim()) {
    return `user:${user.username.trim().toLowerCase()}`;
  }
  return null;
}

export function extractBaseLetterhead(
  config: Partial<SchoolConfig>
): Omit<UserLetterheadConfig, 'updatedAt' | 'userId' | 'username' | 'deleted'> {
  return {
    pemerintahDaerah: config.pemerintahDaerah ?? '',
    dinasPendidikan: config.dinasPendidikan ?? '',
    namaSekolah: config.namaSekolah ?? '',
    npsn: config.npsn ?? '',
    nss: config.nss ?? '',
    alamat: config.alamat ?? '',
    desaKecamatan: config.desaKecamatan ?? '',
    kabupatenKota: config.kabupatenKota ?? '',
    provinsi: config.provinsi ?? '',
    kodePos: config.kodePos ?? '',
    telepon: config.telepon ?? '',
    email: config.email ?? '',
    website: config.website ?? '',
    logoKabupatenUrl: config.logoKopKiri || config.logoKabupatenUrl || '',
    logoSekolahUrl: config.logoKopKanan || config.logoSekolahUrl || '',
    logoKopKiri: config.logoKopKiri || config.logoKabupatenUrl || '',
    logoKopKanan: config.logoKopKanan || config.logoSekolahUrl || '',
    kopBorderStyle: config.kopBorderStyle || 'double_thick'
  };
}

export function hasActiveCustomLetterhead(
  config: SchoolConfig,
  user?: Pick<RegisteredAccessUser, 'id' | 'username'> | null
): boolean {
  const key = getUserIsolationKey(user);
  if (!key) return false;
  const entry = config.userLetterheads?.[key];
  return Boolean(entry && !entry.deleted);
}

export function hasActiveCustomSignature(
  config: SchoolConfig,
  user?: Pick<RegisteredAccessUser, 'id' | 'username'> | null
): boolean {
  const key = getUserIsolationKey(user);
  if (!key) return false;
  const entry = config.userSignatures?.[key];
  return Boolean(entry && !entry.deleted);
}

/**
 * Resolves the effective SchoolConfig for the currently logged-in user.
 * - Base template (`schoolConfig`) remains completely intact as system default.
 * - If the logged-in user has their own isolated Kop Surat (`userLetterheads[key]`)
 *   and/or their own isolated Lembar Pengesahan (`userSignatures[key]`), those
 *   fields seamlessly overlay for that user alone.
 * - Other users' letterheads & signatures remain untouched.
 */
export function getEffectiveSchoolConfigForUser(
  baseConfig: SchoolConfig,
  currentUser?: RegisteredAccessUser | null,
  activeRole?: RoleType | null
): SchoolConfig {
  const key = getUserIsolationKey(currentUser);
  const customKop = key ? baseConfig.userLetterheads?.[key] : undefined;
  const customSig = key ? baseConfig.userSignatures?.[key] : undefined;

  let resolved: SchoolConfig = { ...baseConfig };

  if (customKop && !customKop.deleted) {
    resolved = {
      ...resolved,
      pemerintahDaerah: customKop.pemerintahDaerah ?? resolved.pemerintahDaerah,
      dinasPendidikan: customKop.dinasPendidikan ?? resolved.dinasPendidikan,
      namaSekolah: customKop.namaSekolah ?? resolved.namaSekolah,
      npsn: customKop.npsn ?? resolved.npsn,
      nss: customKop.nss ?? resolved.nss,
      alamat: customKop.alamat ?? resolved.alamat,
      desaKecamatan: customKop.desaKecamatan ?? resolved.desaKecamatan,
      kabupatenKota: customKop.kabupatenKota ?? resolved.kabupatenKota,
      provinsi: customKop.provinsi ?? resolved.provinsi,
      kodePos: customKop.kodePos ?? resolved.kodePos,
      telepon: customKop.telepon ?? resolved.telepon,
      email: customKop.email ?? resolved.email,
      website: customKop.website ?? resolved.website,
      logoKabupatenUrl: customKop.logoKopKiri ?? customKop.logoKabupatenUrl ?? resolved.logoKabupatenUrl,
      logoSekolahUrl: customKop.logoKopKanan ?? customKop.logoSekolahUrl ?? resolved.logoSekolahUrl,
      logoKopKiri: customKop.logoKopKiri ?? customKop.logoKabupatenUrl ?? resolved.logoKopKiri,
      logoKopKanan: customKop.logoKopKanan ?? customKop.logoSekolahUrl ?? resolved.logoKopKanan,
      kopBorderStyle: customKop.kopBorderStyle || resolved.kopBorderStyle || 'double_thick'
    };
  }

  const targetRole = currentUser?.role || activeRole;
  const nextOperatorProfiles = { ...(resolved.operatorProfiles || {}) } as Record<RoleType, SchoolOfficer>;

  if (customSig && !customSig.deleted) {
    if (customSig.kepalaSekolah) {
      resolved.kepalaSekolah = {
        ...resolved.kepalaSekolah,
        ...customSig.kepalaSekolah
      };
    }

    if (customSig.wakilKepalaSekolah) {
      resolved.wakilKepalaSekolah = {
        ...(resolved.wakilKepalaSekolah || {
          nama: '',
          nip: '',
          jabatan: 'Wakil Kepala Sekolah',
          signatureType: 'script' as const,
          signatureData: ''
        }),
        ...customSig.wakilKepalaSekolah
      };
    }

    const sigRole = customSig.role || targetRole;
    if (sigRole && customSig.operatorProfile) {
      const existingOp = nextOperatorProfiles[sigRole] || {
        nama: currentUser?.namaLengkap || '',
        nip: '',
        jabatan: 'Petugas Layanan Operasional',
        signatureType: 'script' as const,
        signatureData: ''
      };
      nextOperatorProfiles[sigRole] = {
        ...existingOp,
        ...customSig.operatorProfile
      };
    }

    if (typeof customSig.stempelEnabled === 'boolean') {
      resolved.stempelEnabled = customSig.stempelEnabled;
    }
    if (customSig.stempelTextLine1 !== undefined) {
      resolved.stempelTextLine1 = customSig.stempelTextLine1;
    }
    if (customSig.stempelTextLine2 !== undefined) {
      resolved.stempelTextLine2 = customSig.stempelTextLine2;
    }
    if (customSig.customStempelUrl !== undefined) {
      resolved.customStempelUrl = customSig.customStempelUrl;
    }
  } else if (currentUser && targetRole && nextOperatorProfiles[targetRole]) {
    // Keep base template clean; if base operator profile still contains legacy dummy name or is blank,
    // allow logged-in user's name as friendly fallback display only without mutating DB
    const baseOp = nextOperatorProfiles[targetRole];
    const isDummyName =
      !baseOp.nama ||
      /nurul(\s*hidayat|\s*hidayati)?/i.test(baseOp.nama) ||
      /rahmat(\s*hidayat)?/i.test(baseOp.nama);
    if (isDummyName && currentUser.namaLengkap) {
      nextOperatorProfiles[targetRole] = {
        ...baseOp,
        nama: currentUser.namaLengkap
      };
    }
  }

  resolved.operatorProfiles = nextOperatorProfiles;
  return resolved;
}

/**
 * Non-destructive per-user timestamp merge for `userLetterheads` or `userSignatures`.
 * Ensures saving or deleting one user's record NEVER overwrites another user's record
 * during multi-user / concurrent portal synchronization.
 */
export function mergeUserIsolatedRecords<T extends { updatedAt?: string; deleted?: boolean }>(
  existingMap?: Record<string, T> | null,
  incomingMap?: Record<string, T> | null
): Record<string, T> {
  const result: Record<string, T> = { ...(existingMap || {}) };
  if (!incomingMap || typeof incomingMap !== 'object') {
    return result;
  }

  for (const [key, inc] of Object.entries(incomingMap)) {
    if (!inc || typeof inc !== 'object') continue;
    const prev = result[key];
    if (!prev) {
      result[key] = inc;
      continue;
    }
    const prevTime = Date.parse(prev.updatedAt || '') || 0;
    const incTime = Date.parse(inc.updatedAt || '') || 0;
    if (incTime >= prevTime) {
      result[key] = inc;
    }
  }

  return result;
}
