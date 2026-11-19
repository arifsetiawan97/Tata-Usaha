import { LibraryBookItem, LibraryMemberItem, LibraryMemberStats } from '../types';
import { isMemberJoinedInMonth } from './formatters';

export interface LibraryMemberRecap {
  guruLaki: number;
  guruPerempuan: number;
  totalGuru: number;
  staffLaki: number;
  staffPerempuan: number;
  totalStaff: number;
  siswaLaki: number;
  siswaPerempuan: number;
  totalSiswa: number;
  totalLaki: number;
  totalPerempuan: number;
  grandTotal: number;
  registeredGuruCount: number;
  registeredStaffCount: number;
  registeredSiswaCount: number;
  registeredTotal: number;
  tamatCount: number;
  nonaktifCount: number;
  isEmpty: boolean;
  isManualMode: boolean;
  lastUpdated: string;
}

export interface MonthlyMemberAdditionsBreakdown {
  year: number;
  month: number;
  members: LibraryMemberItem[];
  total: number;
  guruLaki: number;
  guruPerempuan: number;
  guruTotal: number;
  staffLaki: number;
  staffPerempuan: number;
  staffTotal: number;
  siswaLaki: number;
  siswaPerempuan: number;
  siswaTotal: number;
}

export interface MonthlyBookAdditionsBreakdown {
  year: number;
  month: number;
  books: LibraryBookItem[];
  judulCount: number;
  eksemplarCount: number;
  totalNilai: number;
}

function normalizeMemberCategory(raw?: string): 'GURU' | 'STAFF' | 'SISWA' {
  const val = (raw || '').trim().toUpperCase();
  if (val.includes('GURU') || val.includes('PENDIDIK')) return 'GURU';
  if (val.includes('STAF') || val.includes('TENDIK') || val.includes('TU')) return 'STAFF';
  return 'SISWA';
}

function normalizeGender(raw?: string): 'L' | 'P' {
  const val = (raw || '').trim().toUpperCase();
  return val.startsWith('P') || val.includes('PEREMPUAN') || val.includes('WANITA') ? 'P' : 'L';
}

/**
 * Single source of truth for Library Member counts (Guru L/P, Staff L/P, Siswa L/P).
 *
 * Rules:
 * 1. If the directory (`libraryMembers`) is empty AND `isManualOverride` is not explicitly enabled
 *    (or all aggregate stats are 0), ALL totals strictly return 0 (`isEmpty: true`) — never mock numbers.
 * 2. If `libraryMemberStats.isManualOverride === true`, the exact numbers saved via
 *    "Perbarui Rekap Jumlah" are respected (including reductions or resets to 0).
 * 3. Otherwise, directory-registered active members are counted accurately by category & L/P,
 *    while preserving legacy manual aggregate counts only if non-zero manual stats already exist
 *    without a manual flag (unless cleared to 0 or reset to directory).
 */
export function computeLibraryMemberRecap(
  libraryMembers: LibraryMemberItem[] = [],
  libraryMemberStats?: Partial<LibraryMemberStats> | null
): LibraryMemberRecap {
  const members = Array.isArray(libraryMembers) ? libraryMembers : [];
  const stats = libraryMemberStats || {};

  let regGuruL = 0;
  let regGuruP = 0;
  let regStaffL = 0;
  let regStaffP = 0;
  let regSiswaL = 0;
  let regSiswaP = 0;
  let tamatCount = 0;
  let nonaktifCount = 0;

  members.forEach((m) => {
    const status = (m.status || 'aktif').trim().toLowerCase();
    if (status === 'tamat' || status === 'alumni') {
      tamatCount += 1;
      return;
    }
    if (status === 'nonaktif') {
      nonaktifCount += 1;
      return;
    }

    const cat = normalizeMemberCategory(m.tipeAnggota);
    const jk = normalizeGender(m.jenisKelamin);

    if (cat === 'GURU') {
      if (jk === 'P') regGuruP += 1;
      else regGuruL += 1;
    } else if (cat === 'STAFF') {
      if (jk === 'P') regStaffP += 1;
      else regStaffL += 1;
    } else {
      if (jk === 'P') regSiswaP += 1;
      else regSiswaL += 1;
    }
  });

  const registeredGuruCount = regGuruL + regGuruP;
  const registeredStaffCount = regStaffL + regStaffP;
  const registeredSiswaCount = regSiswaL + regSiswaP;
  const registeredTotal = registeredGuruCount + registeredStaffCount + registeredSiswaCount;

  const statGuruL = Number(stats.guruLaki) || 0;
  const statGuruP = Number(stats.guruPerempuan) || 0;
  const statGuruTotal = Number(stats.guruPendidik) || 0;
  const statStaffL = Number(stats.staffLaki) || 0;
  const statStaffP = Number(stats.staffPerempuan) || 0;
  const statStaffTotal = Number(stats.staffTendik) || 0;
  const statSiswaL = Number(stats.siswaLaki) || 0;
  const statSiswaP = Number(stats.siswaPerempuan) || 0;

  const hasExplicitManual = stats.isManualOverride === true;
  const hasExplicitDirectoryMode = stats.isManualOverride === false;

  let guruLaki = 0;
  let guruPerempuan = 0;
  let totalGuru = 0;
  let staffLaki = 0;
  let staffPerempuan = 0;
  let totalStaff = 0;
  let siswaLaki = 0;
  let siswaPerempuan = 0;
  let totalSiswa = 0;
  let isManualMode = false;

  if (hasExplicitManual) {
    isManualMode = true;
    guruLaki = Math.max(0, statGuruL);
    guruPerempuan = Math.max(0, statGuruP);
    totalGuru = guruLaki + guruPerempuan > 0 ? guruLaki + guruPerempuan : Math.max(0, statGuruTotal);

    staffLaki = Math.max(0, statStaffL);
    staffPerempuan = Math.max(0, statStaffP);
    totalStaff = staffLaki + staffPerempuan > 0 ? staffLaki + staffPerempuan : Math.max(0, statStaffTotal);

    siswaLaki = Math.max(0, statSiswaL);
    siswaPerempuan = Math.max(0, statSiswaP);
    totalSiswa = siswaLaki + siswaPerempuan;
  } else if (hasExplicitDirectoryMode || members.length === 0) {
    // Strictly directory-driven: if no directory members exist, every metric is 0 (kosong)
    guruLaki = regGuruL;
    guruPerempuan = regGuruP;
    totalGuru = registeredGuruCount;

    staffLaki = regStaffL;
    staffPerempuan = regStaffP;
    totalStaff = registeredStaffCount;

    siswaLaki = regSiswaL;
    siswaPerempuan = regSiswaP;
    totalSiswa = registeredSiswaCount;
  } else {
    // Legacy state with directory members + saved non-zero stats (before explicit flag existed)
    const legacyHasStats =
      statGuruTotal > 0 ||
      statGuruL > 0 ||
      statGuruP > 0 ||
      statStaffTotal > 0 ||
      statStaffL > 0 ||
      statStaffP > 0 ||
      statSiswaL > 0 ||
      statSiswaP > 0;

    if (legacyHasStats) {
      isManualMode = true;
      guruLaki = Math.max(regGuruL, statGuruL);
      guruPerempuan = Math.max(regGuruP, statGuruP);
      // If guruPendidik exists without L/P split, preserve total while deriving proportional/remainder if needed
      const sumGuruLP = guruLaki + guruPerempuan;
      if (statGuruTotal > sumGuruLP && statGuruL === 0 && statGuruP === 0 && registeredGuruCount === 0) {
        totalGuru = statGuruTotal;
      } else {
        totalGuru = Math.max(sumGuruLP, statGuruTotal);
        if (totalGuru > sumGuruLP) {
          guruPerempuan += totalGuru - sumGuruLP;
        }
      }

      staffLaki = Math.max(regStaffL, statStaffL);
      staffPerempuan = Math.max(regStaffP, statStaffP);
      const sumStaffLP = staffLaki + staffPerempuan;
      if (statStaffTotal > sumStaffLP && statStaffL === 0 && statStaffP === 0 && registeredStaffCount === 0) {
        totalStaff = statStaffTotal;
      } else {
        totalStaff = Math.max(sumStaffLP, statStaffTotal);
        if (totalStaff > sumStaffLP) {
          staffPerempuan += totalStaff - sumStaffLP;
        }
      }

      siswaLaki = Math.max(regSiswaL, statSiswaL);
      siswaPerempuan = Math.max(regSiswaP, statSiswaP);
      totalSiswa = siswaLaki + siswaPerempuan;
    } else {
      guruLaki = regGuruL;
      guruPerempuan = regGuruP;
      totalGuru = registeredGuruCount;

      staffLaki = regStaffL;
      staffPerempuan = regStaffP;
      totalStaff = registeredStaffCount;

      siswaLaki = regSiswaL;
      siswaPerempuan = regSiswaP;
      totalSiswa = registeredSiswaCount;
    }
  }

  const totalLaki = guruLaki + staffLaki + siswaLaki;
  const totalPerempuan = guruPerempuan + staffPerempuan + siswaPerempuan;
  const grandTotal = totalGuru + totalStaff + totalSiswa;
  const isEmpty = grandTotal === 0 && registeredTotal === 0;

  return {
    guruLaki,
    guruPerempuan,
    totalGuru,
    staffLaki,
    staffPerempuan,
    totalStaff,
    siswaLaki,
    siswaPerempuan,
    totalSiswa,
    totalLaki,
    totalPerempuan,
    grandTotal,
    registeredGuruCount,
    registeredStaffCount,
    registeredSiswaCount,
    registeredTotal,
    tamatCount,
    nonaktifCount,
    isEmpty,
    isManualMode,
    lastUpdated: stats.lastUpdated || ''
  };
}

/**
 * Counts library member additions for a given month and year, split by category & L/P.
 */
export function computeMonthlyMemberAdditions(
  libraryMembers: LibraryMemberItem[] = [],
  year: number,
  month: number
): MonthlyMemberAdditionsBreakdown {
  const matched = (libraryMembers || []).filter((m) => isMemberJoinedInMonth(m, year, month));

  let guruLaki = 0;
  let guruPerempuan = 0;
  let staffLaki = 0;
  let staffPerempuan = 0;
  let siswaLaki = 0;
  let siswaPerempuan = 0;

  matched.forEach((m) => {
    const cat = normalizeMemberCategory(m.tipeAnggota);
    const jk = normalizeGender(m.jenisKelamin);
    if (cat === 'GURU') {
      if (jk === 'P') guruPerempuan += 1;
      else guruLaki += 1;
    } else if (cat === 'STAFF') {
      if (jk === 'P') staffPerempuan += 1;
      else staffLaki += 1;
    } else {
      if (jk === 'P') siswaPerempuan += 1;
      else siswaLaki += 1;
    }
  });

  return {
    year,
    month,
    members: matched,
    total: matched.length,
    guruLaki,
    guruPerempuan,
    guruTotal: guruLaki + guruPerempuan,
    staffLaki,
    staffPerempuan,
    staffTotal: staffLaki + staffPerempuan,
    siswaLaki,
    siswaPerempuan,
    siswaTotal: siswaLaki + siswaPerempuan
  };
}

/**
 * Extracts year & month from a LibraryBookItem procurement / entry date cleanly.
 */
export function parseBookDateParts(
  book: Partial<LibraryBookItem>,
  defaultYear = new Date().getFullYear()
): { year: number; month: number } | null {
  if (!book) return null;

  if (book.tanggalMasuk) {
    const raw = String(book.tanggalMasuk).trim();
    const isoMatch = raw.match(/^(\d{4})[-/.](\d{1,2})/);
    if (isoMatch) {
      return { year: parseInt(isoMatch[1], 10), month: parseInt(isoMatch[2], 10) };
    }
    const dmyMatch = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmyMatch) {
      return { year: parseInt(dmyMatch[3], 10), month: parseInt(dmyMatch[2], 10) };
    }
  }

  if (book.bulanPengadaan !== undefined && book.bulanPengadaan !== null && String(book.bulanPengadaan).trim() !== '') {
    const rawBp = String(book.bulanPengadaan).trim();
    const bpMatch = rawBp.match(/^(\d{4})[-/.](\d{1,2})/);
    if (bpMatch) {
      return { year: parseInt(bpMatch[1], 10), month: parseInt(bpMatch[2], 10) };
    }
    const num = parseInt(rawBp, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      const yr = parseInt(String(book.tahunPengadaan || book.tahunBeli || book.tahunTerbit), 10) || defaultYear;
      return { year: yr, month: num };
    }
  }

  const fallbackYear = parseInt(String(book.tahunPengadaan || book.tahunBeli || book.tahunTerbit), 10);
  if (!isNaN(fallbackYear) && fallbackYear >= 1900) {
    return { year: fallbackYear, month: 1 };
  }

  return null;
}

/**
 * Counts library book additions for a given month and year.
 */
export function computeMonthlyBookAdditions(
  libraryBooks: LibraryBookItem[] = [],
  year: number,
  month: number
): MonthlyBookAdditionsBreakdown {
  const matched = (libraryBooks || []).filter((book) => {
    const parts = parseBookDateParts(book, year);
    if (!parts) return false;
    return parts.year === year && parts.month === month;
  });

  const judulCount = matched.length;
  const eksemplarCount = matched.reduce((sum, b) => sum + (Number(b.jumlah) || 1), 0);
  const totalNilai = matched.reduce(
    (sum, b) => sum + (Number(b.hargaSatuan) || 0) * (Number(b.jumlah) || 1),
    0
  );

  return {
    year,
    month,
    books: matched,
    judulCount,
    eksemplarCount,
    totalNilai
  };
}
