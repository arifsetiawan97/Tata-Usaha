import React, { useState, useRef, useEffect } from 'react';
import { useApp, RoleSubTab } from '../../context/AppContext';
import { SchoolConfigModal } from '../settings/SchoolConfigModal';
import { 
  Building2, 
  Shield, 
  Sparkles, 
  BookOpen,
  FlaskConical,
  Settings, 
  LogOut, 
  FileText, 
  Award, 
  Boxes, 
  CalendarDays,
  RotateCcw,
  Archive,
  CheckSquare,
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
  X
} from 'lucide-react';
import { initialSchoolConfig } from '../../data/initialData';
import { AiAssistantModal } from './AiAssistantModal';
import { SecretAiGeneratorModal } from './SecretAiGeneratorModal';
import { LogoKabupatenDefault } from './KopSurat';
import { formatApiErrorMessage } from '../../services/storageService';

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
    updateRolePin,
    currentUser,
    logoutAccessUser,
    updateAccessUserPassword,
    completePasswordResetWithNewPassword,
    accessRules,
    syncStatus,
    databaseCapacitySummary,
    isAdminAuthenticated,
    actionFeedback,
    clearActionFeedback,
    sessionExpiredNotice,
    clearSessionExpiredNotice,
    connectionError,
    retryConnection
  } = useApp();

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [pinChangeNotice, setPinChangeNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isSecretAiOpen, setIsSecretAiOpen] = useState(false);

  // Automatically open in-service "Buat Sandi Baru" modal when user enters with temporary reset password
  useEffect(() => {
    if (currentRole && currentUser?.mustChangePassword) {
      setNewPinInput('');
      setConfirmPinInput('');
      setShowPinInput(false);
      setPinChangeNotice(null);
      setIsPinModalOpen(true);
    }
  }, [currentRole, currentUser?.id, currentUser?.mustChangePassword]);

  const logoTapRef = useRef<{ count: number; lastTap: number }>({ count: 0, lastTap: 0 });
  const handleLogoTap = () => {
    const now = Date.now();
    if (now - logoTapRef.current.lastTap > 2500) {
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

  const operator = schoolConfig.operatorProfiles?.[currentRole] || initialSchoolConfig.operatorProfiles[currentRole] || {
    nama: 'Petugas Layanan Operasional',
    nip: '-',
    jabatan: 'Operator'
  };

  const roleMeta = {
    TU: {
      label: 'Tata Usaha (TU)',
      icon: Building2,
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-300',
      activeTabClass: 'border-sky-600 text-sky-800 bg-sky-50/80 ring-1 ring-sky-500/20 font-bold',
      iconBg: 'bg-sky-100 text-sky-800'
    },
    PENJAGA: {
      label: 'Penjaga Sekolah',
      icon: Shield,
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
      activeTabClass: 'border-blue-600 text-blue-800 bg-blue-50/80 ring-1 ring-blue-500/20 font-bold',
      iconBg: 'bg-blue-100 text-blue-800'
    },
    SERVICE: {
      label: 'Service (Kebersihan)',
      icon: Sparkles,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      activeTabClass: 'border-emerald-600 text-emerald-800 bg-emerald-50/80 ring-1 ring-emerald-500/20 font-bold',
      iconBg: 'bg-emerald-100 text-emerald-800'
    },
    PERPUS: {
      label: 'Perpustakaan',
      icon: BookOpen,
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
      activeTabClass: 'border-purple-600 text-purple-800 bg-purple-50/80 ring-1 ring-purple-500/20 font-bold',
      iconBg: 'bg-purple-100 text-purple-800'
    },
    LAB_IPA: {
      label: 'Laboratorium IPA',
      icon: FlaskConical,
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-300',
      activeTabClass: 'border-teal-600 text-teal-800 bg-teal-50/80 ring-1 ring-teal-500/20 font-bold',
      iconBg: 'bg-teal-100 text-teal-800'
    }
  }[currentRole];

  const CurrentRoleIcon = roleMeta.icon;

  const roleTasks = tasks.filter(t => t.role === currentRole);
  const roleInventories = inventories.filter(i => i.role === currentRole);
  const roleArchives = archives.filter(a => a.role === currentRole);

  const currentTab = activeNavTab === 'archive' ? 'archive' : (roleSubTabs[currentRole] || 'tasks');

  // Top navigation bar:
  // "kelola tugas pokok dan tambahan", "lapor bulanan", and "lapor tahunan" have been removed from the top bar as requested!
  // They are strictly accessible inside each respective operational role's workspace menu.
  const operationalMenus: Array<{
    id: RoleSubTab | 'archive';
    label: string;
    icon: React.ElementType;
    count?: number;
  }> = [
    {
      id: 'tasks',
      label: 'Jurnal Tugas Harian',
      icon: CalendarDays,
      count: roleTasks.length
    },
    {
      id: 'inventory',
      label: 'Inventaris Sarpras',
      icon: Boxes,
      count: roleInventories.length
    },
    {
      id: 'archive',
      label: 'Arsip Dokumen',
      icon: Archive,
      count: roleArchives.length
    }
  ];

  const handleSelectMenu = (menuId: RoleSubTab | 'archive') => {
    if (menuId === 'archive') {
      setActiveNavTab('archive');
    } else {
      setActiveNavTab('dashboard');
      setRoleSubTab(currentRole, menuId);
    }
  };

  const handleLogout = () => {
    logoutAccessUser();
    setIsLogoutConfirmOpen(false);
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs no-print">
        {/* Top Identity & Account Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: School Identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                onClick={handleLogoTap}
                className="w-10 h-10 shrink-0 flex items-center justify-center select-none"
              >
                {schoolConfig.logoAplikasiUrl ? (
                  <img 
                    src={schoolConfig.logoAplikasiUrl} 
                    alt="Logo Aplikasi" 
                    className="max-h-9 max-w-[40px] object-contain rounded"
                  />
                ) : schoolConfig.logoSekolahUrl ? (
                  <img 
                    src={schoolConfig.logoSekolahUrl} 
                    alt="Logo Sekolah" 
                    className="max-h-9 max-w-[40px] object-contain"
                  />
                ) : (
                  <LogoKabupatenDefault className="w-8 h-10" />
                )}
              </div>

              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {schoolConfig.namaSekolah}
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate hidden xs:block">
                  Sistem Informasi Operator Layanan Operasional Sekolah (SI-OPS)
                </p>
              </div>
            </div>

            {/* Right: Active Role Account Profile & Logout (Protected Role Isolation) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Database Server Sync & Mode Indicator (non-clickable for regular users) */}
              {isAdminAuthenticated ? (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('siops-open-owner-panel'))}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer tabular-nums bg-amber-50 text-amber-900 border-amber-300"
                  title="Buka Konsol Database Admin"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>
                    Admin DB Aktif
                    {databaseCapacitySummary ? ` · ${databaseCapacitySummary.totalPercentUsed}%` : ''}
                  </span>
                </button>
              ) : (
                <div
                  className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold tabular-nums ${
                    syncStatus === 'synced'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : syncStatus === 'saving'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title="Status koneksi server terpusat"
                >
                  <Database className={`w-3.5 h-3.5 ${syncStatus === 'saving' ? 'text-amber-600' : syncStatus === 'synced' ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span>
                    {syncStatus === 'saving'
                      ? 'Menyimpan...'
                      : syncStatus === 'synced'
                      ? 'Server Terhubung'
                      : 'Koneksi Terputus'}
                  </span>
                </div>
              )}

              {/* Operator Profile Tag */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${roleMeta.badgeClass} shadow-2xs`}>
                <div className="p-1 rounded-md bg-white/70">
                  <CurrentRoleIcon className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold leading-tight">
                    {roleMeta.label}
                  </p>
                  <p className="text-[10px] opacity-80 truncate max-w-[140px] sm:max-w-[190px]">
                    {currentUser ? `${currentUser.namaLengkap} (@${currentUser.username})` : operator.nama}
                  </p>
                </div>
              </div>

              {/* Change Password / PIN Security Button */}
              <button
                type="button"
                onClick={() => {
                  setNewPinInput('');
                  setConfirmPinInput('');
                  setShowPinInput(false);
                  setPinChangeNotice(null);
                  setIsPinModalOpen(true);
                }}
                className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                title="Ganti Sandi Akun Ini"
              >
                <KeyRound className="w-4 h-4" />
              </button>

              {/* Asisten Cerdas AI Button */}
              <button
                type="button"
                onClick={() => setIsAiAssistantOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 rounded-lg transition-all shadow-xs cursor-pointer"
                title="Buka Asisten Cerdas AI SI-OPS untuk seluruh lini operasional"
              >
                <Bot className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Asisten AI</span>
              </button>

              {/* Fitur Kecerdasan Tersembunyi (Akses Khusus: ARIF SETIAWAN) */}
              <button
                type="button"
                onClick={() => setIsSecretAiOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 border border-amber-500/40 rounded-lg transition-all shadow-xs cursor-pointer"
                title="Kecerdasan Tersembunyi: Generator Instan Lapor Bulanan & Rekap Tugas Operasional (Otorisasi: ARIF SETIAWAN)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-900 animate-pulse" />
                <span className="hidden md:inline">Kecerdasan Tersembunyi</span>
              </button>

              {/* Settings Button */}
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                title="Pengaturan Kop Surat & Identitas Sekolah"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Reset Data Button (Admin Only) */}
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isAdminAuthenticated
                    ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                    : 'text-slate-300 hover:text-slate-500'
                }`}
                title={isAdminAuthenticated ? 'Reset ke Data Bawaan (Admin)' : 'Reset Data (Hanya Admin Database)'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Logout / Switch Account Button */}
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                title="Kunci akun dan keluar ke halaman masuk"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar Akun</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar - Exclusively for Active Operational Role */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto border-t border-slate-100 py-1.5 -mb-px">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider px-1 shrink-0 hidden md:inline">
              Menu {roleMeta.label}:
            </span>

            {operationalMenus.map(menu => {
              const ItemIcon = menu.icon;
              const isActive = currentTab === menu.id;

              return (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => handleSelectMenu(menu.id)}
                  className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    isActive
                      ? `${roleMeta.activeTabClass} shadow-2xs`
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={`p-1 rounded-md transition-colors ${isActive ? roleMeta.iconBg : 'bg-slate-100 text-slate-600'}`}>
                    <ItemIcon className="w-3.5 h-3.5" />
                  </span>
                  <span>{menu.label}</span>
                  {menu.count !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-white/90 text-slate-900 shadow-2xs' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {menu.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Automatic Database Capacity Warning / Lock Banner (>=80%, >=95%, 100%) */}
        {databaseCapacitySummary &&
          databaseCapacitySummary.effectiveAlertLevel !== 'NORMAL' && (
            <div
              className={`border-t text-xs ${
                databaseCapacitySummary.effectiveAlertLevel === 'FULL'
                  ? 'bg-rose-600 text-white border-rose-700'
                  : databaseCapacitySummary.effectiveAlertLevel === 'CRITICAL'
                  ? 'bg-rose-50 text-rose-900 border-rose-200'
                  : 'bg-amber-50 text-amber-950 border-amber-200'
              }`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="tabular-nums">
                    {databaseCapacitySummary.effectiveAlertLevel === 'FULL'
                      ? `KAPASITAS DATABASE PENUH (${databaseCapacitySummary.totalPercentUsed}%) — Penulisan data baru dikunci otomatis oleh sistem. Hubungi Admin untuk perluasan kuota atau pengarsipan.`
                      : databaseCapacitySummary.effectiveAlertLevel === 'CRITICAL'
                      ? `PERINGATAN KRITIS KAPASITAS DATABASE (${databaseCapacitySummary.totalPercentUsed}%) — Sisa ruang penyimpanan hampir habis. Segera hubungi Admin.`
                      : `PERINGATAN KAPASITAS DATABASE (${databaseCapacitySummary.totalPercentUsed}%) — Penggunaan Database Admin telah mencapai 80% atau lebih.`}
                  </span>
                </div>
                {isAdminAuthenticated && (
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('siops-open-owner-panel'))}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                      databaseCapacitySummary.effectiveAlertLevel === 'FULL'
                        ? 'bg-white text-rose-700 hover:bg-rose-50'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    Kelola Kapasitas (Admin)
                  </button>
                )}
              </div>
            </div>
          )}

        {/* Network Error + Retry Banner */}
        {connectionError && (
          <div className="bg-rose-50 border-t border-rose-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-rose-900">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{connectionError}</span>
              </div>
              <button
                type="button"
                onClick={() => retryConnection()}
                className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Coba Lagi</span>
              </button>
            </div>
          </div>
        )}

        {/* Session Expiry Banner */}
        {sessionExpiredNotice && (
          <div className="bg-amber-50 border-t border-amber-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{formatApiErrorMessage(sessionExpiredNotice, '')}</span>
              </div>
              <button
                type="button"
                onClick={clearSessionExpiredNotice}
                className="p-1 text-amber-700 hover:text-amber-950 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Action Feedback Banner (Staff Proposal Queue / Admin Guard Notice) */}
        {actionFeedback && (
          <div
            className={`border-t text-xs ${
              actionFeedback.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2">
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
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* In-service Reminder Banner when logged in with Temporary Reset Password */}
        {currentUser?.mustChangePassword && (
          <div className="bg-amber-50 border-t border-amber-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Sandi Sementara Aktif:</strong> Anda saat ini masuk ke layanan menggunakan sandi reset sementara dari Admin. Segera buat sandi baru pribadi Anda agar tercatat di Admin.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewPinInput('');
                  setConfirmPinInput('');
                  setShowPinInput(false);
                  setPinChangeNotice(null);
                  setIsPinModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs cursor-pointer"
              >
                Ganti ke Sandi Baru Sekarang
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Settings Modal */}
      {isConfigModalOpen && (
        <SchoolConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
        />
      )}

      {/* In-UI Reset Data Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-fadeIn">
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

      {/* In-UI Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-fadeIn">
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
                  Sesi ruang kerja Anda akan dikunci. Untuk masuk kembali atau beralih ke peran lain, diperlukan verifikasi PIN keamanan akun.
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
      {/* In-UI Change Password Modal (Also used after entering service with Temp Reset Password) */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-fadeIn">
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
                    ? 'Anda sudah masuk ke layanan menggunakan sandi sementara. Buat sandi baru Anda agar otomatis tercatat di Admin.'
                    : accessRules.enforceUniquePassword
                    ? 'Setiap sandi bersifat unik dan hanya bisa dikaitkan dengan satu nama pengguna saja.'
                    : 'Masukkan sandi baru minimal 4 karakter.'}
                </p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newPinInput.trim() || isSubmittingPin) return;
                setIsSubmittingPin(true);
                try {
                  if (currentUser?.mustChangePassword) {
                    if (newPinInput.trim() !== confirmPinInput.trim()) {
                      setPinChangeNotice({
                        ok: false,
                        text: 'Konfirmasi sandi baru tidak cocok. Pastikan kedua kolom sandi baru sama.'
                      });
                      return;
                    }
                    const res = await completePasswordResetWithNewPassword(currentUser.id, newPinInput.trim());
                    setPinChangeNotice({
                      ok: res.ok,
                      text: formatApiErrorMessage(res.message, res.ok ? 'Sandi diperbarui.' : 'Gagal memperbarui sandi.')
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
                      text: formatApiErrorMessage(res.message, res.ok ? 'Sandi diperbarui.' : 'Gagal memperbarui sandi.')
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
                    onChange={(e) => {
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
                    onChange={(e) => {
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

      {/* AI Assistant Modal */}
      {isAiAssistantOpen && (
        <AiAssistantModal
          isOpen={isAiAssistantOpen}
          onClose={() => setIsAiAssistantOpen(false)}
          initialRole={currentRole}
        />
      )}

      {/* Secret AI Generator Modal (Otorisasi: ARIF SETIAWAN) */}
      {isSecretAiOpen && (
        <SecretAiGeneratorModal
          isOpen={isSecretAiOpen}
          onClose={() => setIsSecretAiOpen(false)}
          defaultRole={currentRole}
          onOpenReport={(m, y, r) => {
            setActiveNavTab('monthly');
          }}
        />
      )}
    </>
  );
};
