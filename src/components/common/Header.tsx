import React, { Suspense, lazy, useState, useRef, useEffect } from 'react';
import { useApp, RoleSubTab } from '../../context/AppContext';
import {
  Building2,
  Shield,
  Sparkles,
  BookOpen,
  FlaskConical,
  Settings,
  LogOut,
  Boxes,
  CalendarDays,
  RotateCcw,
  Archive,
  AlertTriangle,
  KeyRound,
  Check,
  Lock,
  Bot,
  Database,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  WifiOff,
  ShieldCheck,
  X,
  CheckSquare,
  FileText,
  Award,
  Users,
  ScrollText,
  Image as ImageIcon,
  LayoutGrid,
  ChevronRight,
  Printer
} from 'lucide-react';
import { initialSchoolConfig } from '../../data/initialData';
import { BERITA_ACARA_TEMPLATES } from '../../data/beritaAcaraTemplates';
import { LogoKabupatenDefault } from './KopSurat';
import { formatApiErrorMessage } from '../../services/storageService';
import { ServiceBackgroundModal } from './BackgroundCustomizer';

const SchoolConfigModal = lazy(() =>
  import('../settings/SchoolConfigModal').then(m => ({ default: m.SchoolConfigModal }))
);
const AiAssistantModal = lazy(() =>
  import('./AiAssistantModal').then(m => ({ default: m.AiAssistantModal }))
);
const SecretAiGeneratorModal = lazy(() =>
  import('./SecretAiGeneratorModal').then(m => ({ default: m.SecretAiGeneratorModal }))
);

interface NavDestination {
  id: RoleSubTab | 'archive' | 'print_center';
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  count?: string | number;
}

const ROLE_META_MAP = {
  TU: {
    label: 'Tata Usaha (TU)',
    shortLabel: 'Tata Usaha',
    icon: Building2,
    accentBg: 'bg-sky-600',
    activeItemClass: 'bg-sky-50 text-sky-900 border-sky-200 font-bold',
    activeIndicator: 'bg-sky-600',
    activeIconClass: 'bg-sky-600 text-white',
    badgeClass: 'bg-sky-50 text-sky-900 border-sky-200'
  },
  PENJAGA: {
    label: 'Penjaga Sekolah',
    shortLabel: 'Penjaga',
    icon: Shield,
    accentBg: 'bg-blue-600',
    activeItemClass: 'bg-blue-50 text-blue-900 border-blue-200 font-bold',
    activeIndicator: 'bg-blue-600',
    activeIconClass: 'bg-blue-600 text-white',
    badgeClass: 'bg-blue-50 text-blue-900 border-blue-200'
  },
  SERVICE: {
    label: 'Service (Kebersihan)',
    shortLabel: 'Kebersihan',
    icon: Sparkles,
    accentBg: 'bg-emerald-600',
    activeItemClass: 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold',
    activeIndicator: 'bg-emerald-600',
    activeIconClass: 'bg-emerald-600 text-white',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200'
  },
  PERPUS: {
    label: 'Perpustakaan',
    shortLabel: 'Perpustakaan',
    icon: BookOpen,
    accentBg: 'bg-purple-600',
    activeItemClass: 'bg-purple-50 text-purple-900 border-purple-200 font-bold',
    activeIndicator: 'bg-purple-600',
    activeIconClass: 'bg-purple-600 text-white',
    badgeClass: 'bg-purple-50 text-purple-900 border-purple-200'
  },
  LAB_IPA: {
    label: 'Laboratorium IPA',
    shortLabel: 'Lab IPA',
    icon: FlaskConical,
    accentBg: 'bg-teal-600',
    activeItemClass: 'bg-teal-50 text-teal-900 border-teal-200 font-bold',
    activeIndicator: 'bg-teal-600',
    activeIconClass: 'bg-teal-600 text-white',
    badgeClass: 'bg-teal-50 text-teal-900 border-teal-200'
  }
};

export const SystemStatusBanners: React.FC = () => {
  const {
    currentUser,
    databaseCapacitySummary,
    isAdminAuthenticated,
    connectionError,
    retryConnection,
    sessionExpiredNotice,
    clearSessionExpiredNotice,
    actionFeedback,
    clearActionFeedback
  } = useApp();

  const hasAnyBanner =
    (databaseCapacitySummary && databaseCapacitySummary.effectiveAlertLevel !== 'NORMAL') ||
    Boolean(connectionError) ||
    Boolean(sessionExpiredNotice) ||
    Boolean(actionFeedback) ||
    Boolean(currentUser?.mustChangePassword);

  if (!hasAnyBanner) return null;

  return (
    <div className="space-y-2.5 mb-5 no-print">
      {/* Database Capacity Warning / Lock Banner */}
      {databaseCapacitySummary && databaseCapacitySummary.effectiveAlertLevel !== 'NORMAL' && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs ${
            databaseCapacitySummary.effectiveAlertLevel === 'FULL'
              ? 'bg-rose-600 text-white border-rose-700'
              : databaseCapacitySummary.effectiveAlertLevel === 'CRITICAL'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-amber-50 text-amber-950 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="tabular-nums">
              {databaseCapacitySummary.effectiveAlertLevel === 'FULL'
                ? `KAPASITAS DATABASE PENUH (${databaseCapacitySummary.totalPercentUsed}%) — Penulisan data baru dikunci otomatis. Hubungi Admin untuk perluasan kuota.`
                : databaseCapacitySummary.effectiveAlertLevel === 'CRITICAL'
                ? `PERINGATAN KRITIS KAPASITAS DATABASE (${databaseCapacitySummary.totalPercentUsed}%) — Sisa ruang penyimpanan hampir habis.`
                : `PERINGATAN KAPASITAS DATABASE (${databaseCapacitySummary.totalPercentUsed}%) — Penggunaan Database Admin mencapai 80% atau lebih.`}
            </span>
          </div>
          {isAdminAuthenticated && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('siops-open-owner-panel'))}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                databaseCapacitySummary.effectiveAlertLevel === 'FULL'
                  ? 'bg-white text-rose-700 hover:bg-rose-50'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              Kelola Kapasitas
            </button>
          )}
        </div>
      )}

      {/* Network Error + Retry Banner */}
      {connectionError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-rose-900 shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{connectionError}</span>
          </div>
          <button
            type="button"
            onClick={() => retryConnection()}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Session Expiry Banner */}
      {sessionExpiredNotice && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{formatApiErrorMessage(sessionExpiredNotice, '')}</span>
          </div>
          <button
            type="button"
            onClick={clearSessionExpiredNotice}
            className="p-1 text-amber-700 hover:text-amber-950 cursor-pointer"
            aria-label="Tutup peringatan sesi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-xs flex items-center justify-between gap-2 shadow-2xs ${
            actionFeedback.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {actionFeedback.ok ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{formatApiErrorMessage(actionFeedback.text, '')}</span>
          </div>
          <button
            type="button"
            onClick={clearActionFeedback}
            className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Temporary Password Reminder Banner */}
      {currentUser?.mustChangePassword && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-amber-900">
            <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Sandi Sementara Aktif:</strong> Anda masuk menggunakan sandi reset sementara. Segera buat sandi baru pribadi Anda.
            </span>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('siops-open-pin-modal'))}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs cursor-pointer"
          >
            Ganti Sandi Sekarang
          </button>
        </div>
      )}
    </div>
  );
};

export const Header: React.FC = () => {
  const {
    currentRole,
    activeNavTab,
    setActiveNavTab,
    roleSubTabs,
    setRoleSubTab,
    effectiveSchoolConfig: schoolConfig,
    resetToDefaultData,
    tasks,
    inventories,
    archives,
    tupoksiDefinitions,
    libraryBooks,
    libraryMemberStats,
    updateRolePin,
    currentUser,
    logoutAccessUser,
    updateAccessUserPassword,
    completePasswordResetWithNewPassword,
    accessRules,
    syncStatus,
    databaseCapacitySummary,
    isAdminAuthenticated,
    getServiceBackground,
    saveServiceBackground,
    resetServiceBackground
  } = useApp();

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [pinChangeNotice, setPinChangeNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isSecretAiOpen, setIsSecretAiOpen] = useState(false);

  // Automatically open in-service password modal when entering with temp reset password
  useEffect(() => {
    if (currentRole && currentUser?.mustChangePassword) {
      setNewPinInput('');
      setConfirmPinInput('');
      setShowPinInput(false);
      setPinChangeNotice(null);
      setIsPinModalOpen(true);
    }
  }, [currentRole, currentUser?.id, currentUser?.mustChangePassword]);

  // Listen to modal trigger events from Page Header action buttons
  useEffect(() => {
    const openBg = () => setIsBgModalOpen(true);
    const openCfg = () => setIsConfigModalOpen(true);
    const openAi = () => setIsAiAssistantOpen(true);
    const openSecretAi = () => setIsSecretAiOpen(true);
    const openPin = () => {
      setNewPinInput('');
      setConfirmPinInput('');
      setShowPinInput(false);
      setPinChangeNotice(null);
      setIsPinModalOpen(true);
    };

    window.addEventListener('siops-open-bg-modal', openBg);
    window.addEventListener('siops-open-config-modal', openCfg);
    window.addEventListener('siops-open-ai-modal', openAi);
    window.addEventListener('siops-open-secret-ai-modal', openSecretAi);
    window.addEventListener('siops-open-pin-modal', openPin);
    return () => {
      window.removeEventListener('siops-open-bg-modal', openBg);
      window.removeEventListener('siops-open-config-modal', openCfg);
      window.removeEventListener('siops-open-ai-modal', openAi);
      window.removeEventListener('siops-open-secret-ai-modal', openSecretAi);
      window.removeEventListener('siops-open-pin-modal', openPin);
    };
  }, []);

  const logoTapRef = useRef<{ count: number; lastTap: number }>({ count: 0, lastTap: 0 });
  const handleLogoTap = () => {
    const now = Date.now();
    if (now - logoTapRef.current.lastTap > 4000) {
      logoTapRef.current.count = 1;
    } else {
      logoTapRef.current.count += 1;
    }
    logoTapRef.current.lastTap = now;
    if (logoTapRef.current.count >= 5) {
      logoTapRef.current.count = 0;
      window.dispatchEvent(new CustomEvent('siops-open-owner-panel'));
    }
  };

  if (!currentRole) return null;

  const operator =
    schoolConfig.operatorProfiles?.[currentRole] ||
    initialSchoolConfig.operatorProfiles[currentRole] || {
      nama: 'Petugas Layanan Operasional',
      nip: '-',
      jabatan: 'Operator'
    };

  const roleMeta = ROLE_META_MAP[currentRole];
  const CurrentRoleIcon = roleMeta.icon;

  const roleTasks = tasks.filter(t => t.role === currentRole);
  const roleInventories = inventories.filter(i => i.role === currentRole);
  const roleArchives = archives.filter(a => a.role === currentRole);
  const roleTupoksiItems =
    (tupoksiDefinitions[currentRole]?.tupoksiList?.length || 0) +
    (tupoksiDefinitions[currentRole]?.tugasTambahanList?.length || 0);
  const totalPerpusMembers =
    (libraryMemberStats?.siswaLaki || 0) +
    (libraryMemberStats?.siswaPerempuan || 0) +
    (libraryMemberStats?.guruPendidik || 0) +
    (libraryMemberStats?.staffTendik || 0);

  const currentTab: RoleSubTab | 'archive' | 'print_center' =
    activeNavTab === 'archive'
      ? 'archive'
      : activeNavTab === 'print_center'
      ? 'print_center'
      : roleSubTabs[currentRole] || 'tasks';

  const navItems: NavDestination[] = [
    {
      id: 'tasks',
      label: 'Jurnal Tugas Harian',
      shortLabel: 'Tugas',
      icon: CalendarDays,
      count: roleTasks.length
    },
    {
      id: 'tupoksi',
      label: 'Tugas Pokok & Tambahan',
      shortLabel: 'Tupoksi',
      icon: CheckSquare,
      count: roleTupoksiItems
    },
    {
      id: 'monthly',
      label: 'Laporan Bulanan',
      shortLabel: 'Bulanan',
      icon: FileText
    },
    {
      id: 'annual',
      label: 'Laporan Tahunan',
      shortLabel: 'Tahunan',
      icon: Award
    },
    {
      id: 'inventory',
      label: 'Inventaris Sarpras',
      shortLabel: 'Inventaris',
      icon: Boxes,
      count: roleInventories.length
    },
    ...(currentRole === 'TU'
      ? [
          {
            id: 'berita_acara' as RoleSubTab,
            label: 'Berita Acara & Surat',
            shortLabel: 'Berita Acara',
            icon: ScrollText,
            count: BERITA_ACARA_TEMPLATES.length
          }
        ]
      : []),
    ...(currentRole === 'PERPUS'
      ? [
          {
            id: 'buku' as RoleSubTab,
            label: 'Inventaris Buku',
            shortLabel: 'Buku',
            icon: BookOpen,
            count: libraryBooks?.length || 0
          },
          {
            id: 'anggota' as RoleSubTab,
            label: 'Anggota Perpus',
            shortLabel: 'Anggota',
            icon: Users,
            count: totalPerpusMembers
          }
        ]
      : []),
    {
      id: 'print_center',
      label: 'Pusat Cetak Laporan',
      shortLabel: 'Cetak',
      icon: Printer
    },
    {
      id: 'archive',
      label: 'Arsip Dokumen Resmi',
      shortLabel: 'Arsip',
      icon: Archive,
      count: roleArchives.length
    }
  ];

  // 4 primary tabs for fixed mobile bottom navigation bar + 5th "Menu" drawer tab
  const mobilePrimaryIds: Array<RoleSubTab | 'archive' | 'print_center'> = [
    'tasks',
    'monthly',
    'print_center',
    'archive'
  ];
  const mobilePrimaryTabs = navItems.filter(item => mobilePrimaryIds.includes(item.id));
  const mobileSecondaryTabs = navItems.filter(item => !mobilePrimaryIds.includes(item.id));
  const isSecondaryTabActive = mobileSecondaryTabs.some(item => item.id === currentTab);
  const activeNavItem = navItems.find(item => item.id === currentTab) || navItems[0];

  const handleSelectMenu = (menuId: RoleSubTab | 'archive' | 'print_center') => {
    if (menuId === 'archive' || menuId === 'print_center') {
      setActiveNavTab(menuId);
    } else {
      setActiveNavTab('dashboard');
      setRoleSubTab(currentRole, menuId);
    }
    setIsMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logoutAccessUser();
    setIsLogoutConfirmOpen(false);
  };

  const activeServiceBg = getServiceBackground(currentRole);

  return (
    <>
      {/* =================================================================== */}
      {/* 1. DESKTOP FIXED SIDEBAR (lg:flex)                                  */}
      {/* =================================================================== */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 z-30 bg-white/95 backdrop-blur-md border-r border-slate-200/90 shadow-xs no-print">
        {/* School Brand Header */}
        <div className="p-4 border-b border-slate-200/80 space-y-3">
          <div
            onClick={handleLogoTap}
            className="flex items-center gap-3 min-w-0 select-none touch-manipulation cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 shrink-0 flex items-center justify-center p-1">
              {schoolConfig.logoAplikasiUrl ? (
                <img
                  src={schoolConfig.logoAplikasiUrl}
                  alt="Logo Aplikasi"
                  className="max-h-8 max-w-full object-contain rounded"
                />
              ) : schoolConfig.logoSekolahUrl ? (
                <img
                  src={schoolConfig.logoSekolahUrl}
                  alt="Logo Sekolah"
                  className="max-h-8 max-w-full object-contain"
                />
              ) : (
                <LogoKabupatenDefault className="w-7 h-9" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-slate-900 truncate">
                {schoolConfig.namaSekolah}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                SI-OPS · {roleMeta.shortLabel}
              </p>
            </div>
          </div>

          {/* Logged-in Operator & Server Status */}
          <div className={`p-2.5 rounded-xl border ${roleMeta.badgeClass} space-y-1.5`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center shrink-0">
                  <CurrentRoleIcon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">
                    {currentUser ? currentUser.namaLengkap : operator.nama}
                  </p>
                  <p className="text-[10px] opacity-80 truncate font-mono">
                    {currentUser ? `@${currentUser.username}` : operator.nip}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-slate-700">
                <Database
                  className={`w-3 h-3 ${
                    syncStatus === 'saving'
                      ? 'text-amber-600'
                      : syncStatus === 'synced'
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}
                />
                <span>
                  {syncStatus === 'saving'
                    ? 'Menyimpan ke server...'
                    : syncStatus === 'synced'
                    ? 'Server Terhubung'
                    : 'Koneksi Terputus'}
                </span>
              </span>
              {isAdminAuthenticated && (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('siops-open-owner-panel'))}
                  className="text-amber-800 hover:underline font-bold cursor-pointer tabular-nums"
                >
                  Admin{databaseCapacitySummary ? ` · ${databaseCapacitySummary.totalPercentUsed}%` : ''}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Vertical Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Navigasi Utama Layanan">
          <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama {roleMeta.shortLabel}
          </p>
          {navItems.map(item => {
            const ItemIcon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectMenu(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all border cursor-pointer group ${
                  isActive
                    ? `${roleMeta.activeItemClass} shadow-2xs`
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${roleMeta.activeIndicator}`}
                  />
                )}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? roleMeta.activeIconClass
                        : 'bg-slate-100 text-slate-600 group-hover:bg-white'
                    }`}
                  >
                    <ItemIcon className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-[11px] font-mono tabular-nums shrink-0 ${
                      isActive ? 'text-slate-900 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Utility Controls */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/70 space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setIsBgModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer transition-colors"
              title="Ubah background layanan Anda"
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="truncate">Background</span>
            </button>
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer transition-colors"
              title="Pengaturan Kop Surat & Identitas Sekolah"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="truncate">Kop & Sekolah</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setIsAiAssistantOpen(true)}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer transition-colors"
            >
              <Bot className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">Asisten AI</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSecretAiOpen(true)}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-bold cursor-pointer transition-colors"
              title="Generator Instan Lapor Bulanan (ARIF SETIAWAN)"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Cepat AI</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setNewPinInput('');
                setConfirmPinInput('');
                setShowPinInput(false);
                setPinChangeNotice(null);
                setIsPinModalOpen(true);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Sandi</span>
            </button>
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className={`p-2 rounded-xl border bg-white cursor-pointer ${
                isAdminAuthenticated
                  ? 'border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                  : 'border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
              title={isAdminAuthenticated ? 'Reset ke Data Bawaan (Admin)' : 'Reset Data (Hanya Admin Database)'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[11px] font-bold text-rose-700 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* =================================================================== */}
      {/* 2. MOBILE COMPACT TOP BAR (lg:hidden, height 56px)                  */}
      {/* =================================================================== */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 flex items-center justify-between gap-2 shadow-2xs no-print">
        <div
          onClick={handleLogoTap}
          className="flex items-center gap-2.5 min-w-0 select-none touch-manipulation"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 p-1">
            {schoolConfig.logoAplikasiUrl ? (
              <img
                src={schoolConfig.logoAplikasiUrl}
                alt="Logo"
                className="max-h-6 max-w-full object-contain rounded"
              />
            ) : schoolConfig.logoSekolahUrl ? (
              <img
                src={schoolConfig.logoSekolahUrl}
                alt="Logo Sekolah"
                className="max-h-6 max-w-full object-contain"
              />
            ) : (
              <LogoKabupatenDefault className="w-5 h-7" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-slate-900 truncate">
              {activeNavItem.label}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {roleMeta.shortLabel} · {currentUser ? `@${currentUser.username}` : schoolConfig.namaSekolah}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${
              syncStatus === 'saving'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : syncStatus === 'synced'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <Database className="w-3 h-3" />
            <span>{syncStatus === 'saving' ? 'Simpan' : syncStatus === 'synced' ? 'Aktif' : 'Putus'}</span>
          </span>

          <button
            type="button"
            onClick={() => setIsBgModalOpen(true)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer"
            title="Atur Background Layanan"
            aria-label="Atur Background Layanan"
          >
            <ImageIcon className="w-4 h-4 text-sky-600" />
          </button>

          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
            title="Keluar Akun"
            aria-label="Keluar Akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 3. MOBILE FIXED BOTTOM NAVIGATION BAR (lg:hidden, height 64px)      */}
      {/* =================================================================== */}
      <nav
        aria-label="Navigasi Bawah Layanan"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center px-1 shadow-lg no-print"
      >
        {mobilePrimaryTabs.map(item => {
          const ItemIcon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectMenu(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
                isActive ? 'text-sky-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className={`absolute top-0.5 w-7 h-1 rounded-full ${roleMeta.activeIndicator}`}
                />
              )}
              <span
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-sky-50 text-sky-700' : ''
                }`}
              >
                <ItemIcon className="w-5 h-5" />
              </span>
              <span className={`text-[10px] leading-none truncate max-w-full px-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.shortLabel}
              </span>
            </button>
          );
        })}

        {/* 5th Tab: More / Menu Sheet Trigger */}
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
            isSecondaryTabActive || isMobileDrawerOpen ? 'text-sky-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isSecondaryTabActive && (
            <span
              aria-hidden="true"
              className={`absolute top-0.5 w-7 h-1 rounded-full ${roleMeta.activeIndicator}`}
            />
          )}
          <span
            className={`p-1 rounded-lg transition-colors ${
              isSecondaryTabActive || isMobileDrawerOpen ? 'bg-sky-50 text-sky-700' : ''
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </span>
          <span className={`text-[10px] leading-none ${isSecondaryTabActive ? 'font-bold' : 'font-medium'}`}>
            Menu
          </span>
        </button>
      </nav>

      {/* =================================================================== */}
      {/* 4. MOBILE ACTION SHEET / MORE DRAWER                                */}
      {/* =================================================================== */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end bg-slate-950/60 backdrop-blur-xs no-print">
          <div className="bg-white w-full rounded-t-3xl border-t border-slate-200 max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto -mt-1 mb-1" />
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Menu Layanan · {roleMeta.label}
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih modul layanan atau pengaturan akun
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Seluruh Modul Layanan
              </p>
              {navItems.map(item => {
                const ItemIcon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectMenu(item.id)}
                    className={`w-full min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      isActive
                        ? roleMeta.activeItemClass
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isActive ? roleMeta.activeIconClass : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        <ItemIcon className="w-4 h-4" />
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.count !== undefined && (
                        <span className="text-xs font-mono tabular-nums text-slate-500">
                          {item.count}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsBgModalOpen(true);
                }}
                className="min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-sky-600" />
                <span>Atur Background</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsConfigModalOpen(true);
                }}
                className="min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-600" />
                <span>Kop & Sekolah</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsAiAssistantOpen(true);
                }}
                className="min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                <Bot className="w-4 h-4 text-amber-300" />
                <span>Asisten AI</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsSecretAiOpen(true);
                }}
                className="min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Cepat AI</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setNewPinInput('');
                  setConfirmPinInput('');
                  setShowPinInput(false);
                  setPinChangeNotice(null);
                  setIsPinModalOpen(true);
                }}
                className="min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Ganti Sandi</span>
              </button>
              {isAdminAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    window.dispatchEvent(new CustomEvent('siops-open-owner-panel'));
                  }}
                  className="min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-xs font-bold text-amber-900 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Konsol Admin</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setIsLogoutConfirmOpen(true);
                  }}
                  className="min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Akun</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. WORKSPACE MODALS (Shared by Sidebar, Top Bar & Page Header)      */}
      {/* =================================================================== */}
      {isConfigModalOpen && (
        <Suspense fallback={null}>
          <SchoolConfigModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
          />
        </Suspense>
      )}

      {isBgModalOpen && (
        <ServiceBackgroundModal
          isOpen={isBgModalOpen}
          onClose={() => setIsBgModalOpen(false)}
          serviceLabel={roleMeta.label}
          usernameLabel={currentUser?.username}
          initialConfig={activeServiceBg}
          onSave={cfg => saveServiceBackground(currentRole, cfg)}
          onReset={() => resetServiceBackground(currentRole)}
        />
      )}

      {/* Reset Data Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Kembalikan ke Data Bawaan Resmi?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tindakan ini akan memulihkan data tugas, tupoksi, laporan, dan inventaris ke contoh resmi Satuan Pendidikan.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDefaultData();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
              >
                Ya, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Keluar dari Akun {roleMeta.label}?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sesi ruang kerja Anda akan dikunci. Untuk masuk kembali, diperlukan verifikasi sandi keamanan akun.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
              >
                Ya, Keluar Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  {currentUser?.mustChangePassword
                    ? `Buat Sandi Baru (@${currentUser.username})`
                    : currentUser
                    ? `Ubah Sandi Akun (@${currentUser.username})`
                    : `Ganti Sandi Akun ${roleMeta.label}`}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {currentUser?.mustChangePassword
                    ? 'Anda sudah masuk menggunakan sandi sementara. Buat sandi baru Anda agar tercatat di Admin.'
                    : accessRules.enforceUniquePassword
                    ? 'Setiap sandi bersifat unik dan hanya dikaitkan dengan satu akun.'
                    : 'Masukkan sandi baru minimal 4 karakter.'}
                </p>
              </div>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                if (!newPinInput.trim() || isSubmittingPin) return;
                setIsSubmittingPin(true);
                try {
                  if (currentUser?.mustChangePassword) {
                    if (newPinInput.trim() !== confirmPinInput.trim()) {
                      setPinChangeNotice({
                        ok: false,
                        text: 'Konfirmasi sandi baru tidak cocok. Pastikan kedua kolom sandi sama.'
                      });
                      return;
                    }
                    const res = await completePasswordResetWithNewPassword(
                      currentUser.id,
                      newPinInput.trim()
                    );
                    setPinChangeNotice({
                      ok: res.ok,
                      text: formatApiErrorMessage(
                        res.message,
                        res.ok ? 'Sandi diperbarui.' : 'Gagal memperbarui sandi.'
                      )
                    });
                    if (res.ok) {
                      setTimeout(() => {
                        setIsPinModalOpen(false);
                        setPinChangeNotice(null);
                      }, 1400);
                    }
                  } else if (currentUser) {
                    const res = await updateAccessUserPassword(currentUser.id, newPinInput.trim());
                    setPinChangeNotice({
                      ok: res.ok,
                      text: formatApiErrorMessage(
                        res.message,
                        res.ok ? 'Sandi diperbarui.' : 'Gagal memperbarui sandi.'
                      )
                    });
                    if (res.ok) {
                      setTimeout(() => {
                        setIsPinModalOpen(false);
                        setPinChangeNotice(null);
                      }, 1500);
                    }
                  } else {
                    updateRolePin(currentRole, newPinInput.trim());
                    setPinChangeNotice({ ok: true, text: 'Sandi akun berhasil diperbarui!' });
                    setTimeout(() => {
                      setIsPinModalOpen(false);
                      setPinChangeNotice(null);
                    }, 1500);
                  }
                } finally {
                  setIsSubmittingPin(false);
                }
              }}
              className="space-y-3 pt-2"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sandi Baru (Min. 4 Karakter):
                </label>
                <div className="relative">
                  <input
                    type={showPinInput ? 'text' : 'password'}
                    required
                    autoFocus
                    minLength={4}
                    maxLength={24}
                    value={newPinInput}
                    onChange={e => {
                      setNewPinInput(e.target.value);
                      if (pinChangeNotice) setPinChangeNotice(null);
                    }}
                    placeholder="Ketik sandi baru Anda..."
                    className="w-full pl-3 pr-9 py-2 text-sm text-center font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinInput(!showPinInput)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPinInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {currentUser?.mustChangePassword && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Konfirmasi Sandi Baru:
                  </label>
                  <input
                    type={showPinInput ? 'text' : 'password'}
                    required
                    minLength={4}
                    maxLength={24}
                    value={confirmPinInput}
                    onChange={e => {
                      setConfirmPinInput(e.target.value);
                      if (pinChangeNotice) setPinChangeNotice(null);
                    }}
                    placeholder="Ketik ulang sandi baru..."
                    className="w-full px-3 py-2 text-sm text-center font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {pinChangeNotice && (
                <div
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-start gap-2 ${
                    pinChangeNotice.ok
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {pinChangeNotice.ok ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{pinChangeNotice.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  {currentUser?.mustChangePassword ? 'Nanti' : 'Tutup'}
                </button>
                <button
                  type="submit"
                  disabled={!newPinInput.trim() || isSubmittingPin}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs cursor-pointer"
                >
                  {isSubmittingPin ? 'Menyimpan...' : 'Simpan Sandi Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAiAssistantOpen && (
        <Suspense fallback={null}>
          <AiAssistantModal
            isOpen={isAiAssistantOpen}
            onClose={() => setIsAiAssistantOpen(false)}
            initialRole={currentRole}
          />
        </Suspense>
      )}

      {isSecretAiOpen && (
        <Suspense fallback={null}>
          <SecretAiGeneratorModal
            isOpen={isSecretAiOpen}
            onClose={() => setIsSecretAiOpen(false)}
            defaultRole={currentRole}
            onOpenReport={() => {
              setActiveNavTab('monthly');
            }}
          />
        </Suspense>
      )}
    </>
  );
};
