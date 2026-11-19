import {
  AnnualReport,
  LibraryBookItem,
  LibraryMemberItem,
  LibraryMemberStats,
  MonthlyReport,
  RoleType,
  SchoolConfig,
  TaskLog
} from '../types';
import { getTaskClassification, isTaskInMonth } from './taskClassification';
import {
  computeLibraryMemberRecap,
  computeMonthlyBookAdditions,
  computeMonthlyMemberAdditions
} from './libraryStatsHelper';
import { ROLE_OPERATIONAL_SPECS } from '../data/roleOperationalSpecs';

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export interface MonthlyPerformanceRecapItem {
  monthIndex: number; // 1 - 12
  monthName: string;
  monthKey: string; // e.g. "2026-09"
  tupoksiSummary: string;
  tambahanSummary: string;
  tupoksiCount: number;
  tambahanCount: number;
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  isRealData: boolean;
  hasMonthlyReport: boolean;
  monthlyReportSummary?: string;
  approvalStatus: MonthlyReport['approvalStatus'] | 'belum_berjalan';
  booksJudulAdded: number;
  booksCopiesAdded: number;
  membersAddedTotal: number;
  membersAddedGuruL: number;
  membersAddedGuruP: number;
  membersAddedStaffL: number;
  membersAddedStaffP: number;
  membersAddedSiswaL: number;
  membersAddedSiswaP: number;
}

export interface AnnualPerformanceSummary {
  year: number;
  role: RoleType;
  items: MonthlyPerformanceRecapItem[];
  totalTupoksi: number;
  totalTambahan: number;
  totalTasks: number;
  totalCompleted: number;
  averagePercentage: number;
  activeMonthsCount: number;
  totalBooksJudulAdded: number;
  totalBooksCopiesAdded: number;
  totalMembersAdded: number;
  totalMembersAddedL: number;
  totalMembersAddedP: number;
}

export interface AnnualSyncOptions {
  monthlyReports?: MonthlyReport[];
  libraryBooks?: LibraryBookItem[];
  libraryMembers?: LibraryMemberItem[];
}

/**
 * Calculates a comprehensive 12-month annual recapitulation directly synchronized
 * from the year's saved `monthlyReports`, actual `tasks`, `libraryBooks`, and `libraryMembers`
 * (including L/P member additions and book additions per month).
 */
export function calculateAnnualPerformanceSummary(
  tasks: TaskLog[],
  role: RoleType,
  year: number,
  options?: AnnualSyncOptions
): AnnualPerformanceSummary {
  const monthlyReports = options?.monthlyReports || [];
  const libraryBooks = options?.libraryBooks || [];
  const libraryMembers = options?.libraryMembers || [];
  const isPerpus = role === 'PERPUS';

  const items: MonthlyPerformanceRecapItem[] = [];

  for (let m = 1; m <= 12; m++) {
    const monthName = MONTH_NAMES[m - 1];
    const monthKey = `${year}-${String(m).padStart(2, '0')}`;

    const realMonthTasks = (tasks || []).filter(
      (t) => t.role && t.role.toUpperCase() === role.toUpperCase() && isTaskInMonth(t.date, m, year)
    );

    const mReport = monthlyReports.find(
      (r) => r.role === role && r.month === m && r.year === year
    );

    const bookAdd = isPerpus
      ? computeMonthlyBookAdditions(libraryBooks, year, m)
      : { judulCount: 0, eksemplarCount: 0, totalNilai: 0, books: [], year, month: m };

    const memAdd = isPerpus
      ? computeMonthlyMemberAdditions(libraryMembers, year, m)
      : {
          year,
          month: m,
          members: [],
          total: 0,
          guruLaki: 0,
          guruPerempuan: 0,
          guruTotal: 0,
          staffLaki: 0,
          staffPerempuan: 0,
          staffTotal: 0,
          siswaLaki: 0,
          siswaPerempuan: 0,
          siswaTotal: 0
        };

    const realPokok = realMonthTasks.filter((t) => getTaskClassification(role, t.category, t.taskType) === 'pokok');
    const realTambahan = realMonthTasks.filter((t) => getTaskClassification(role, t.category, t.taskType) === 'tambahan');
    const completed = realMonthTasks.filter((t) => t.status === 'selesai').length;
    const hasPerpusGrowth = isPerpus && (bookAdd.eksemplarCount > 0 || memAdd.total > 0);
    const hasActivity = realMonthTasks.length > 0 || Boolean(mReport) || hasPerpusGrowth;

    const pct =
      realMonthTasks.length > 0
        ? Math.round((completed / realMonthTasks.length) * 100)
        : mReport
          ? 100
          : hasPerpusGrowth
            ? 100
            : 0;

    let pokokText = 'Belum ada catatan tugas/lapor bulanan pada bulan ini';
    if (realPokok.length > 0) {
      pokokText = realPokok.map((t) => `${t.title} (${t.volumeUnit || '1 kegiatan'})`).join('; ');
    } else if (mReport?.achievements && mReport.achievements.length > 0) {
      pokokText = mReport.achievements.slice(0, 2).join('; ');
    } else if (mReport?.summary) {
      pokokText = mReport.summary;
    }

    if (isPerpus && bookAdd.eksemplarCount > 0) {
      const bookNote = `Pengadaan buku: +${bookAdd.judulCount} judul (${bookAdd.eksemplarCount} eksemplar)`;
      pokokText = realPokok.length > 0 || mReport ? `${pokokText}; ${bookNote}` : bookNote;
    }

    let tambahanText = hasActivity ? 'Sesuai catatan operasional bulanan' : '-';
    if (realTambahan.length > 0) {
      tambahanText = realTambahan.map((t) => `${t.title} (${t.volumeUnit || '1 kegiatan'})`).join('; ');
    } else if (mReport?.solutions && mReport.solutions.length > 0 && hasActivity) {
      tambahanText = mReport.solutions[0];
    }

    if (isPerpus && memAdd.total > 0) {
      const memberNote = `Anggota baru: +${memAdd.total} org (Guru L:${memAdd.guruLaki}/P:${memAdd.guruPerempuan}, Staff L:${memAdd.staffLaki}/P:${memAdd.staffPerempuan}, Siswa L:${memAdd.siswaLaki}/P:${memAdd.siswaPerempuan})`;
      tambahanText = realTambahan.length > 0 ? `${tambahanText}; ${memberNote}` : memberNote;
    }

    items.push({
      monthIndex: m,
      monthName,
      monthKey,
      tupoksiSummary: pokokText,
      tambahanSummary: tambahanText,
      tupoksiCount: realPokok.length,
      tambahanCount: realTambahan.length,
      totalTasks: realMonthTasks.length,
      completedTasks: completed,
      percentage: pct,
      isRealData: realMonthTasks.length > 0 || Boolean(mReport) || hasPerpusGrowth,
      hasMonthlyReport: Boolean(mReport),
      monthlyReportSummary: mReport?.summary,
      approvalStatus: mReport ? mReport.approvalStatus : hasActivity ? 'draft' : 'belum_berjalan',
      booksJudulAdded: bookAdd.judulCount,
      booksCopiesAdded: bookAdd.eksemplarCount,
      membersAddedTotal: memAdd.total,
      membersAddedGuruL: memAdd.guruLaki,
      membersAddedGuruP: memAdd.guruPerempuan,
      membersAddedStaffL: memAdd.staffLaki,
      membersAddedStaffP: memAdd.staffPerempuan,
      membersAddedSiswaL: memAdd.siswaLaki,
      membersAddedSiswaP: memAdd.siswaPerempuan
    });
  }

  const totalTupoksi = items.reduce((sum, item) => sum + item.tupoksiCount, 0);
  const totalTambahan = items.reduce((sum, item) => sum + item.tambahanCount, 0);
  const totalTasks = items.reduce((sum, item) => sum + item.totalTasks, 0);
  const totalCompleted = items.reduce((sum, item) => sum + item.completedTasks, 0);

  const activeItems = items.filter((i) => i.isRealData);
  const averagePercentage =
    totalTasks > 0
      ? Math.round((totalCompleted / totalTasks) * 1000) / 10
      : activeItems.length > 0
        ? Math.round((activeItems.reduce((s, i) => s + i.percentage, 0) / activeItems.length) * 10) / 10
        : 0;

  const totalBooksJudulAdded = items.reduce((s, i) => s + i.booksJudulAdded, 0);
  const totalBooksCopiesAdded = items.reduce((s, i) => s + i.booksCopiesAdded, 0);
  const totalMembersAdded = items.reduce((s, i) => s + i.membersAddedTotal, 0);
  const totalMembersAddedL = items.reduce(
    (s, i) => s + i.membersAddedGuruL + i.membersAddedStaffL + i.membersAddedSiswaL,
    0
  );
  const totalMembersAddedP = items.reduce(
    (s, i) => s + i.membersAddedGuruP + i.membersAddedStaffP + i.membersAddedSiswaP,
    0
  );

  return {
    year,
    role,
    items,
    totalTupoksi,
    totalTambahan,
    totalTasks,
    totalCompleted,
    averagePercentage,
    activeMonthsCount: activeItems.length,
    totalBooksJudulAdded,
    totalBooksCopiesAdded,
    totalMembersAdded,
    totalMembersAddedL,
    totalMembersAddedP
  };
}

function getRoleDisplayLabel(role: RoleType): string {
  switch (role) {
    case 'TU':
      return 'Ketatausahaan Sekolah (TU)';
    case 'PENJAGA':
      return 'Penjaga & Keamanan Sekolah';
    case 'SERVICE':
      return 'Layanan Kebersihan & Sanitasi (Service)';
    case 'PERPUS':
      return 'Layanan Perpustakaan Sekolah';
    case 'LAB_IPA':
      return 'Laboratorium IPA';
    default:
      return role;
  }
}

export interface GeneratedAnnualBundle {
  summary: string;
  annualMilestones: string[];
  obstacles: string[];
  solutions: string[];
  strategicRecommendations: string[];
  performance: AnnualPerformanceSummary;
}

/**
 * Automatically builds the Annual Executive Narrative, milestones, obstacles, solutions,
 * and recommendations strictly by reading all saved `monthlyReports` + real task/book/member data
 * for the selected role & year.
 */
export function generateAnnualNarrativeBundle(params: {
  role: RoleType;
  year: number;
  tasks: TaskLog[];
  monthlyReports: MonthlyReport[];
  libraryBooks?: LibraryBookItem[];
  libraryMembers?: LibraryMemberItem[];
  libraryMemberStats?: Partial<LibraryMemberStats>;
  schoolConfig?: SchoolConfig;
}): GeneratedAnnualBundle {
  const {
    role,
    year,
    tasks = [],
    monthlyReports = [],
    libraryBooks = [],
    libraryMembers = [],
    libraryMemberStats,
    schoolConfig
  } = params;

  const performance = calculateAnnualPerformanceSummary(tasks, role, year, {
    monthlyReports,
    libraryBooks,
    libraryMembers
  });

  const yearReports = monthlyReports
    .filter((r) => r.role === role && r.year === year)
    .sort((a, b) => a.month - b.month);

  const roleLabel = getRoleDisplayLabel(role);
  const schoolName = schoolConfig?.namaSekolah || 'Satuan Pendidikan';

  const activeMonthNames = performance.items
    .filter((i) => i.hasMonthlyReport || i.totalTasks > 0 || i.booksCopiesAdded > 0 || i.membersAddedTotal > 0)
    .map((i) => i.monthName);

  const monthRangeText =
    activeMonthNames.length === 0
      ? 'belum memiliki catatan Lapor Bulanan yang terisi'
      : activeMonthNames.length === 1
        ? `bulan ${activeMonthNames[0]}`
        : `bulan ${activeMonthNames.join(', ')}`;

  const totalTasks = performance.totalTasks;
  const totalCompleted = performance.totalCompleted;
  const rateText =
    totalTasks > 0
      ? `${performance.averagePercentage.toFixed(1)}%`
      : yearReports.length > 0
        ? '100%'
        : '0%';

  let summary = '';
  if (yearReports.length === 0 && totalTasks === 0 && performance.totalBooksCopiesAdded === 0 && performance.totalMembersAdded === 0) {
    summary =
      `Rekapitulasi Laporan Kinerja Tahunan ${roleLabel} ${schoolName} Tahun Anggaran ${year} disusun secara otomatis berdasarkan data Lapor Bulanan. ` +
      `Saat ini belum terdapat Lapor Bulanan, jurnal harian, maupun pencatatan realisasi pada tahun ${year}; narasi dan matriks bulan akan terisi otomatis segera setelah Lapor Bulanan diisi atau disimpan.`;
  } else {
    const monthlyHighlights = yearReports
      .map((r) => {
        const mItem = performance.items.find((i) => i.monthIndex === r.month);
        const taskNote = mItem && mItem.totalTasks > 0 ? `${mItem.completedTasks}/${mItem.totalTasks} kegiatan tuntas` : 'laporan bulanan terdokumentasi';
        const snippet = r.summary ? r.summary.split(/[.!?]\s+/)[0].trim() : '';
        return `${MONTH_NAMES[r.month - 1]} (${taskNote}${snippet ? `: ${snippet}` : ''})`;
      })
      .slice(0, 6)
      .join('; ');

    let perpusSentence = '';
    if (role === 'PERPUS') {
      const recap = computeLibraryMemberRecap(libraryMembers, libraryMemberStats);
      const totalAllBookCopies = libraryBooks.reduce((s, b) => s + (Number(b.jumlah) || 1), 0);
      perpusSentence =
        ` Pada aspek pengelolaan perpustakaan, tercatat penambahan bulanan sepanjang tahun ${year} sebanyak ` +
        `${performance.totalBooksJudulAdded} judul (${performance.totalBooksCopiesAdded} eksemplar) sehingga total koleksi terdata mencapai ${libraryBooks.length} judul (${totalAllBookCopies} eksemplar), ` +
        `serta penambahan anggota baru terdata ${performance.totalMembersAdded} orang (L: ${performance.totalMembersAddedL}, P: ${performance.totalMembersAddedP}) dengan komposisi keseluruhan pemustaka aktif berjumlah ${recap.grandTotal} orang ` +
        `(Pendidik/Guru: ${recap.totalGuru} [L:${recap.guruLaki}, P:${recap.guruPerempuan}]; Tendik/Staff: ${recap.totalStaff} [L:${recap.staffLaki}, P:${recap.staffPerempuan}]; Siswa: ${recap.totalSiswa} [L:${recap.siswaLaki}, P:${recap.siswaPerempuan}]).`;
    }

    summary =
      `Berdasarkan kompilasi otomatis Lapor Bulanan ${roleLabel} ${schoolName} sepanjang Tahun Anggaran ${year} (mencakup ${monthRangeText} dari ${yearReports.length} dokumen Lapor Bulanan resmi), ` +
      `tercatat realisasi sebanyak ${totalTasks} agenda kegiatan operasional (${performance.totalTupoksi} tugas pokok dan ${performance.totalTambahan} tugas tambahan) dengan tingkat ketuntasan ${totalCompleted} kegiatan (${rateText}).` +
      perpusSentence +
      (monthlyHighlights
        ? ` Ikhtisar capaian dari Lapor Bulanan meliputi: ${monthlyHighlights}.`
        : '');
  }

  // Gather unique milestones/achievements from monthlyReports + monthly additions
  const collectedMilestones: string[] = [];
  yearReports.forEach((r) => {
    const mName = MONTH_NAMES[r.month - 1];
    (r.achievements || []).forEach((ach) => {
      const clean = ach.trim();
      if (clean && !collectedMilestones.some((x) => x.includes(clean))) {
        collectedMilestones.push(`[${mName}] ${clean}`);
      }
    });
  });

  if (role === 'PERPUS') {
    if (performance.totalBooksCopiesAdded > 0) {
      collectedMilestones.push(
        `Penambahan koleksi buku hasil pengadaan sepanjang tahun ${year}: +${performance.totalBooksJudulAdded} judul (${performance.totalBooksCopiesAdded} eksemplar) tercatat pada Lapor Bulanan.`
      );
    }
    if (performance.totalMembersAdded > 0) {
      collectedMilestones.push(
        `Registrasi pemustaka baru tahun ${year}: +${performance.totalMembersAdded} anggota (Laki-laki: ${performance.totalMembersAddedL}, Perempuan: ${performance.totalMembersAddedP}).`
      );
    }
  }

  if (collectedMilestones.length === 0) {
    collectedMilestones.push(...(ROLE_OPERATIONAL_SPECS[role]?.annualMilestones || []));
  }

  // Gather obstacles & solutions directly from monthlyReports
  const collectedObstacles: string[] = [];
  const collectedSolutions: string[] = [];
  yearReports.forEach((r) => {
    const mName = MONTH_NAMES[r.month - 1];
    (r.obstacles || []).forEach((obs) => {
      const clean = obs.trim();
      if (clean && !/tidak ada kendala/i.test(clean) && !collectedObstacles.some((x) => x.includes(clean))) {
        collectedObstacles.push(`[${mName}] ${clean}`);
      }
    });
    (r.solutions || []).forEach((sol) => {
      const clean = sol.trim();
      if (clean && !collectedSolutions.some((x) => x.includes(clean))) {
        collectedSolutions.push(`[${mName}] ${clean}`);
      }
    });
  });

  if (collectedObstacles.length === 0) {
    collectedObstacles.push(
      yearReports.length > 0
        ? 'Seluruh operasional bulanan berjalan lancar tanpa kendala mayor yang menghambat pelayanan.'
        : ...(ROLE_OPERATIONAL_SPECS[role]?.fieldObstacles.map((o) => o.obstacle) || [])
    );
  }
  if (collectedSolutions.length === 0) {
    collectedSolutions.push(
      ...(ROLE_OPERATIONAL_SPECS[role]?.fieldObstacles.map((o) => o.solution) || [
        'Melanjutkan koordinasi berkala antara operator layanan dan pimpinan satuan pendidikan.'
      ])
    );
  }

  const strategicRecommendations = [
    ...(ROLE_OPERATIONAL_SPECS[role]?.strategicRecommendations || []),
    `Menjaga konsistensi pengisian Lapor Bulanan tiap bulan agar kompilasi Lapor Tahunan ${year + 1} terus terverifikasi real-time.`
  ].slice(0, 5);

  return {
    summary,
    annualMilestones: collectedMilestones.slice(0, 12),
    obstacles: collectedObstacles.slice(0, 8),
    solutions: collectedSolutions.slice(0, 8),
    strategicRecommendations,
    performance
  };
}
