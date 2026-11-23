import React, { Suspense, lazy } from 'react';
import { useApp, RoleSubTab } from '../../context/AppContext';
import { RoleType } from '../../types';
import {
  Shield,
  Building2,
  Sparkles,
  BookOpen,
  FlaskConical,
  CalendarDays,
  CheckSquare,
  FileText,
  Award,
  Boxes,
  Users,
  ScrollText,
  Database,
  CheckCircle2
} from 'lucide-react';
import { SkeletonLoader } from '../common/SkeletonLoader';

const PenjagaView = lazy(() => import('./PenjagaView').then(m => ({ default: m.PenjagaView })));
const TUView = lazy(() => import('./TUView').then(m => ({ default: m.TUView })));
const ServiceView = lazy(() => import('./ServiceView').then(m => ({ default: m.ServiceView })));
const PerpusView = lazy(() => import('./PerpusView').then(m => ({ default: m.PerpusView })));
const LabIpaView = lazy(() => import('./LabIpaView').then(m => ({ default: m.LabIpaView })));
const TupoksiManagerView = lazy(() =>
  import('./TupoksiManagerView').then(m => ({ default: m.TupoksiManagerView }))
);
const MonthlyReportView = lazy(() =>
  import('../reports/MonthlyReportView').then(m => ({ default: m.MonthlyReportView }))
);
const AnnualReportView = lazy(() =>
  import('../reports/AnnualReportView').then(m => ({ default: m.AnnualReportView }))
);
const InventoryTable = lazy(() =>
  import('../common/InventoryTable').then(m => ({ default: m.InventoryTable }))
);
const LibraryBookManager = lazy(() =>
  import('../perpus/LibraryBookManager').then(m => ({ default: m.LibraryBookManager }))
);
const LibraryMemberManager = lazy(() =>
  import('../perpus/LibraryMemberManager').then(m => ({ default: m.LibraryMemberManager }))
);
const BeritaAcaraManager = lazy(() =>
  import('./BeritaAcaraManager').then(m => ({ default: m.BeritaAcaraManager }))
);

interface RoleWorkspaceViewProps {
  role: RoleType;
  onOpenPrint: (
    reportType: 'monthly' | 'annual',
    data: any,
    options?: { autoPrint?: boolean }
  ) => void;
}

const ACTIVE_TAB_META: Record<
  RoleSubTab,
  { title: string; description: string; icon: React.ElementType }
> = {
  tasks: {
    title: 'Jurnal Tugas Harian',
    description: 'Catat pelaksanaan tugas operasional harian dan pantau progres penyelesaian pekerjaan.',
    icon: CalendarDays
  },
  tupoksi: {
    title: 'Tugas Pokok & Tambahan',
    description: 'Kelola butir uraian tugas pokok serta tugas tambahan resmi operator sekolah.',
    icon: CheckSquare
  },
  monthly: {
    title: 'Laporan Bulanan Resmi',
    description:
      'Susun, tinjau, dan cetak dokumen laporan bulanan lengkap dengan kop surat dan lembar pengesahan.',
    icon: FileText
  },
  annual: {
    title: 'Laporan Tahunan Resmi',
    description: 'Rekapitulasi kinerja tahunan operator beserta dokumen pengesahan akhir tahun.',
    icon: Award
  },
  inventory: {
    title: 'Inventaris Sarpras & Peralatan',
    description: 'Pencatatan kondisi, jumlah, dan kelayakan sarana prasarana operasional.',
    icon: Boxes
  },
  berita_acara: {
    title: 'Berita Acara & Persuratan TU',
    description:
      'Buat dan kelola naskah dinas serta berita acara serah terima standar satuan pendidikan.',
    icon: ScrollText
  },
  buku: {
    title: 'Inventaris Buku Perpustakaan',
    description: 'Pendataan koleksi buku, kategori DDC, dan rekap pengadaan bulanan perpustakaan.',
    icon: BookOpen
  },
  anggota: {
    title: 'Data Anggota Perpustakaan',
    description: 'Kelola statistik keanggotaan siswa, pendidik, dan tenaga kependidikan.',
    icon: Users
  }
};

export const RoleWorkspaceView: React.FC<RoleWorkspaceViewProps> = ({ role, onOpenPrint }) => {
  const {
    tasks,
    roleSubTabs,
    setRoleSubTab,
    tupoksiDefinitions,
    inventories,
    syncStatus,
    isAdminAuthenticated
  } = useApp();

  const currentSubTab = roleSubTabs[role] || 'tasks';

  const roleTasks = tasks.filter(t => t.role === role);
  const roleCompletedTasks = roleTasks.filter(t => t.status === 'selesai').length;
  const completionPct =
    roleTasks.length > 0 ? Math.round((roleCompletedTasks / roleTasks.length) * 100) : 0;
  const roleTupoksiItems =
    (tupoksiDefinitions[role]?.tupoksiList?.length || 0) +
    (tupoksiDefinitions[role]?.tugasTambahanList?.length || 0);
  const roleInventories = inventories.filter(i => i.role === role);

  const roleMeta = {
    PENJAGA: {
      title: 'Penjaga Sekolah',
      icon: Shield,
      accentBadge: 'bg-blue-50 text-blue-800 border-blue-200',
      iconWrap: 'bg-blue-600 text-white'
    },
    TU: {
      title: 'Tata Usaha (TU)',
      icon: Building2,
      accentBadge: 'bg-sky-50 text-sky-800 border-sky-200',
      iconWrap: 'bg-sky-600 text-white'
    },
    SERVICE: {
      title: 'Layanan Kebersihan (Service)',
      icon: Sparkles,
      accentBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      iconWrap: 'bg-emerald-600 text-white'
    },
    PERPUS: {
      title: 'Layanan Perpustakaan',
      icon: BookOpen,
      accentBadge: 'bg-purple-50 text-purple-800 border-purple-200',
      iconWrap: 'bg-purple-600 text-white'
    },
    LAB_IPA: {
      title: 'Laboratorium IPA',
      icon: FlaskConical,
      accentBadge: 'bg-teal-50 text-teal-800 border-teal-200',
      iconWrap: 'bg-teal-600 text-white'
    }
  }[role];

  const activeSection = ACTIVE_TAB_META[currentSubTab] || ACTIVE_TAB_META.tasks;
  const ActiveSectionIcon = activeSection.icon;
  const RoleIcon = roleMeta.icon;

  return (
    <div className="space-y-5">
      {/* =================================================================== */}
      {/* ACTIVE PAGE HEADER CARD (Clean & Non-Duplicative with Sidebar)      */}
      {/* =================================================================== */}
      <section className="no-print bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 rounded-xl ${roleMeta.iconWrap} flex items-center justify-center shrink-0 shadow-xs`}
          >
            <ActiveSectionIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${roleMeta.accentBadge}`}
              >
                <RoleIcon className="w-3 h-3" />
                <span>{roleMeta.title}</span>
              </span>
              {isAdminAuthenticated && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-semibold ${
                    syncStatus === 'saving'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : syncStatus === 'synced'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <Database className="w-3 h-3" />
                  <span>
                    {syncStatus === 'saving'
                      ? 'Menyimpan...'
                      : syncStatus === 'synced'
                      ? 'Data Tersinkronisasi'
                      : 'Koneksi Terputus'}
                  </span>
                </span>
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {activeSection.title}
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              {activeSection.description}
            </p>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* KPI SUMMARY CARDS (Clickable Shortcuts)                             */}
      {/* =================================================================== */}
      <section
        aria-label="Ringkasan Operasional"
        className="no-print grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <button
          type="button"
          onClick={() => setRoleSubTab(role, 'tasks')}
          className={`text-left rounded-2xl border p-3.5 sm:p-4 bg-white/95 backdrop-blur-md transition-all cursor-pointer hover:border-sky-300 ${
            currentSubTab === 'tasks' ? 'border-sky-400 ring-2 ring-sky-500/15' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Total Tugas Harian</span>
            <CalendarDays className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1.5 tabular-nums">
            {roleTasks.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Tercatat pada ruang kerja Anda</p>
        </button>

        <button
          type="button"
          onClick={() => setRoleSubTab(role, 'tasks')}
          className="text-left rounded-2xl border border-slate-200 p-3.5 sm:p-4 bg-white/95 backdrop-blur-md transition-all cursor-pointer hover:border-emerald-300"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Tugas Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 tabular-nums">
              {roleCompletedTasks}
            </p>
            <span className="text-xs font-bold text-slate-500 tabular-nums">({completionPct}%)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Realisasi pekerjaan tuntas</p>
        </button>

        <button
          type="button"
          onClick={() => setRoleSubTab(role, 'tupoksi')}
          className={`text-left rounded-2xl border p-3.5 sm:p-4 bg-white/95 backdrop-blur-md transition-all cursor-pointer hover:border-indigo-300 ${
            currentSubTab === 'tupoksi' ? 'border-indigo-400 ring-2 ring-indigo-500/15' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Butir Tupoksi</span>
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1.5 tabular-nums">
            {roleTupoksiItems}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Tugas pokok & tambahan</p>
        </button>

        <button
          type="button"
          onClick={() => setRoleSubTab(role, 'inventory')}
          className={`text-left rounded-2xl border p-3.5 sm:p-4 bg-white/95 backdrop-blur-md transition-all cursor-pointer hover:border-amber-300 ${
            currentSubTab === 'inventory' ? 'border-amber-400 ring-2 ring-amber-500/15' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Inventaris Sarpras</span>
            <Boxes className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1.5 tabular-nums">
            {roleInventories.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Item terdaftar pada bidang</p>
        </button>
      </section>

      {/* =================================================================== */}
      {/* DYNAMIC MAIN SECTION CONTENT (Cards & Lists)                        */}
      {/* =================================================================== */}
      <div className="transition-all">
        <Suspense fallback={<SkeletonLoader variant="workspace" theme="light" />}>
          {currentSubTab === 'tasks' && (
            <div>
              {role === 'PENJAGA' && <PenjagaView />}
              {role === 'TU' && <TUView />}
              {role === 'SERVICE' && <ServiceView />}
              {role === 'PERPUS' && <PerpusView />}
              {role === 'LAB_IPA' && <LabIpaView />}
            </div>
          )}

          {currentSubTab === 'tupoksi' && <TupoksiManagerView initialRole={role} />}

          {currentSubTab === 'monthly' && (
            <MonthlyReportView initialRole={role} lockRole={true} onOpenPrint={onOpenPrint} />
          )}

          {currentSubTab === 'annual' && (
            <AnnualReportView initialRole={role} lockRole={true} onOpenPrint={onOpenPrint} />
          )}

          {currentSubTab === 'inventory' && (
            <div className="bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Daftar Sarana Prasarana &amp; Alat Operasional ({roleMeta.title})
                  </h2>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {roleInventories.length} item terdaftar
                </span>
              </div>
              <InventoryTable role={role} />
            </div>
          )}

          {currentSubTab === 'buku' && <LibraryBookManager />}

          {currentSubTab === 'anggota' && <LibraryMemberManager />}

          {currentSubTab === 'berita_acara' && role === 'TU' && <BeritaAcaraManager />}
        </Suspense>
      </div>
    </div>
  );
};
