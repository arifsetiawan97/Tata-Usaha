import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowRightLeft,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  HardDrive,
  Loader2,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  User,
  UserCog,
  Users,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminCapacityDatabasesTab } from '../admin/AdminCapacityDatabasesTab';
import { AdminDataGovernanceTab } from '../admin/AdminDataGovernanceTab';
import { AdminMigrationTab } from '../admin/AdminMigrationTab';
import { AdminProfileSettingsTab } from '../admin/AdminProfileSettingsTab';
import { AdminTrashBackupTab } from '../admin/AdminTrashBackupTab';
import { AdminUsersAuditTab } from '../admin/AdminUsersAuditTab';
import { formatApiErrorMessage } from '../../services/storageService';

interface AdminAccessPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ConsoleTab = 'capacity' | 'data' | 'trash_backup' | 'migration' | 'users_audit' | 'profile';

export const AdminAccessPanelModal: React.FC<AdminAccessPanelModalProps> = ({ isOpen, onClose }) => {
  const {
    accessUsers,
    isAdminAuthenticated,
    adminProfile,
    adminAuthStatus,
    adminDashboardData,
    refreshAdminAuthStatus,
    loginAdminSession,
    logoutAdminSession,
    refreshAdminDashboard,
    refreshAccessState
  } = useApp();

  const [activeTab, setActiveTab] = useState<ConsoleTab>('capacity');
  const [adminUsernameInput, setAdminUsernameInput] = useState('admin');
  const [adminInput, setAdminInput] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshRefs = useRef({ refreshAdminDashboard, refreshAccessState, refreshAdminAuthStatus });
  refreshRefs.current = { refreshAdminDashboard, refreshAccessState, refreshAdminAuthStatus };

  useEffect(() => {
    if (!isOpen) {
      setAdminInput('');
      setShowAdminPass(false);
      setAuthError(null);
      return;
    }
    let cancelled = false;
    setCheckingStatus(true);
    refreshRefs.current
      .refreshAdminAuthStatus()
      .then(status => {
        if (!cancelled && status?.isDefaultCredentials) {
          setAdminUsernameInput('admin');
        }
      })
      .finally(() => {
        if (!cancelled) setCheckingStatus(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isAdminAuthenticated) return;
    refreshRefs.current.refreshAdminDashboard();
    refreshRefs.current.refreshAccessState(true);

    const timer = setInterval(() => {
      refreshRefs.current.refreshAdminDashboard();
      refreshRefs.current.refreshAccessState(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [isOpen, isAdminAuthenticated]);

  if (!isOpen) return null;

  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authSubmitting) return;
    const cleanUser = adminUsernameInput.trim();
    if (!cleanUser) {
      setAuthError('Masukkan username atau email Admin.');
      return;
    }
    if (!adminInput.trim()) {
      setAuthError('Masukkan sandi Admin.');
      return;
    }
    setAuthSubmitting(true);
    setAuthError(null);
    const res = await loginAdminSession(cleanUser, adminInput);
    setAuthSubmitting(false);
    if (res.ok) {
      setAdminInput('');
      setNotice({
        ok: true,
        text: formatApiErrorMessage(res.message, 'Sesi Database Admin aktif.')
      });
    } else {
      setAuthError(formatApiErrorMessage(res.message, 'Username atau sandi Admin tidak sesuai.'));
    }
  };

  const handleRefreshAll = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await Promise.all([refreshAdminDashboard(), refreshAccessState(true)]);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleLogoutAdmin = () => {
    logoutAdminSession();
    setNotice(null);
    setAdminInput('');
  };

  const handleNotice = (ok: boolean, text: unknown) => {
    setNotice({
      ok,
      text: formatApiErrorMessage(text, ok ? 'Operasi berhasil.' : 'Terjadi kesalahan.')
    });
  };

  const pendingUsersCount = accessUsers.filter(u => u.status === 'PENDING').length;
  const pendingSubCount = (adminDashboardData.staffSubmissions || []).filter(
    s => s.status === 'PENDING_ADMIN_REVIEW'
  ).length;
  const trashCount = (adminDashboardData.softDeletedItems || []).length;
  const usedPct = adminDashboardData.databaseMetrics?.totalPercentUsed ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-2 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Konsol Database Satu Pintu (Khusus Admin)
              </h2>
              <p className="text-xs text-slate-400">
                Pusat kendali tunggal data operasional, kapasitas database, migrasi, soft-delete, backup, dan keamanan RBAC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={handleRefreshAll}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Segarkan</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogoutAdmin}
                  className="px-3 py-1.5 text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar Admin</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Tutup Panel Admin"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate vs Authenticated Workspace */}
        {!isAdminAuthenticated ? (
          <div className="p-6 sm:p-10 flex items-center justify-center overflow-y-auto">
            {checkingStatus ? (
              <div className="py-10 flex flex-col items-center gap-3 text-slate-300 text-xs">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                <span>Memeriksa status keamanan Database Admin...</span>
              </div>
            ) : (
              <form
                onSubmit={handleLoginAdmin}
                className="w-full max-w-md space-y-4 bg-slate-800/60 border border-slate-700 rounded-2xl p-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Masuk Konsol Database Admin</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Seluruh manajemen database, kapasitas, migrasi, backup, dan persetujuan akun dilindungi autentikasi server.
                  </p>
                </div>

                {adminAuthStatus.isDefaultCredentials && !adminAuthStatus.envOverrideActive && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-[11px] leading-relaxed">
                    <div className="font-bold text-emerald-300 mb-0.5">
                      Akun Admin Awal Tersedia Otomatis
                    </div>
                    Login pertama kali: Username <code className="font-bold text-white">admin</code> · Sandi{' '}
                    <code className="font-bold text-white">admin123</code> (Status: ACTIVE, Role: ADMIN). Setelah masuk, Anda dapat mengganti username dan sandi di tab{' '}
                    <strong>Profil Admin</strong>.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Username atau Email Admin:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      required
                      value={adminUsernameInput}
                      onChange={e => {
                        setAdminUsernameInput(e.target.value);
                        if (authError) setAuthError(null);
                      }}
                      placeholder="admin"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Sandi Admin:
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPass ? 'text' : 'password'}
                      required
                      value={adminInput}
                      onChange={e => {
                        setAdminInput(e.target.value);
                        if (authError) setAuthError(null);
                      }}
                      placeholder="Masukkan sandi Admin..."
                      className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                      aria-label={showAdminPass ? 'Sembunyikan sandi' : 'Lihat sandi'}
                    >
                      {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="flex-1 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 rounded-xl cursor-pointer"
                  >
                    {authSubmitting ? 'Memverifikasi...' : 'Masuk Database Admin'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="px-5 py-2.5 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center gap-1.5 shrink-0">
              {(
                [
                  {
                    id: 'capacity',
                    label: `Kapasitas & Database (${usedPct}%)`,
                    icon: HardDrive
                  },
                  {
                    id: 'data',
                    label: `Data & Ajuan${pendingSubCount > 0 ? ` (${pendingSubCount})` : ''}`,
                    icon: Database
                  },
                  {
                    id: 'trash_backup',
                    label: `Arsip & Backup${trashCount > 0 ? ` (${trashCount})` : ''}`,
                    icon: Archive
                  },
                  {
                    id: 'migration',
                    label: 'Migrasi & Rollback',
                    icon: ArrowRightLeft
                  },
                  {
                    id: 'users_audit',
                    label: `Akun & Audit${pendingUsersCount > 0 ? ` (${pendingUsersCount})` : ''}`,
                    icon: Users
                  },
                  {
                    id: 'profile',
                    label: 'Profil Admin',
                    icon: UserCog
                  }
                ] as const
              ).map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Tab Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {adminProfile?.isDefaultCredentials &&
                !adminAuthStatus.envOverrideActive &&
                activeTab !== 'profile' && (
                  <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-100 text-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Akun Admin masih memakai username/sandi bawaan (<code>admin</code> /{' '}
                        <code>admin123</code>). Demi keamanan, segera ganti di menu{' '}
                        <strong>Profil Admin</strong>.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer shrink-0"
                    >
                      Ubah Username &amp; Sandi
                    </button>
                  </div>
                )}

              {notice && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                    notice.ok
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {notice.ok ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{notice.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotice(null)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {activeTab === 'capacity' && (
                <AdminCapacityDatabasesTab
                  onNotice={handleNotice}
                  onRefreshDashboard={refreshAdminDashboard}
                />
              )}
              {activeTab === 'data' && (
                <AdminDataGovernanceTab
                  onNotice={handleNotice}
                  onRefreshDashboard={refreshAdminDashboard}
                />
              )}
              {activeTab === 'trash_backup' && (
                <AdminTrashBackupTab
                  onNotice={handleNotice}
                  onRefreshDashboard={refreshAdminDashboard}
                />
              )}
              {activeTab === 'migration' && (
                <AdminMigrationTab
                  onNotice={handleNotice}
                  onRefreshDashboard={refreshAdminDashboard}
                />
              )}
              {activeTab === 'users_audit' && (
                <AdminUsersAuditTab
                  onNotice={handleNotice}
                  onRefreshDashboard={refreshAdminDashboard}
                />
              )}
              {activeTab === 'profile' && (
                <AdminProfileSettingsTab
                  onNotice={handleNotice}
                  onRefreshDashboard={refreshAdminDashboard}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
