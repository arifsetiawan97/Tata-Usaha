import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { RegisteredAccessUser, RoleType } from '../../types';
import {
  Building2,
  Shield,
  Sparkles,
  BookOpen,
  FlaskConical,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Boxes,
  Stamp,
  School,
  Lock,
  KeyRound,
  AlertCircle,
  X,
  UserPlus,
  LogIn,
  User,
  Eye,
  EyeOff,
  RefreshCw,
  Bell,
  Clock,
  Copy,
  UserCheck,
  WifiOff,
  Loader2
} from 'lucide-react';
import { LogoKabupatenDefault } from './KopSurat';

const SERVICE_OPTIONS: { value: RoleType; label: string }[] = [
  { value: 'TU', label: 'Tata Usaha (TU)' },
  { value: 'PENJAGA', label: 'Penjaga Sekolah' },
  { value: 'SERVICE', label: 'Service (Kebersihan)' },
  { value: 'PERPUS', label: 'Layanan Perpustakaan' },
  { value: 'LAB_IPA', label: 'Laboratorium IPA' }
];

const ROLE_LABELS_MAP: Record<RoleType, string> = {
  TU: 'Tata Usaha (TU)',
  PENJAGA: 'Penjaga Sekolah',
  SERVICE: 'Service (Kebersihan)',
  PERPUS: 'Layanan Perpustakaan',
  LAB_IPA: 'Laboratorium IPA'
};

export const RoleSelectView: React.FC = () => {
  const {
    schoolConfig,
    accessUsers,
    approvedRoleCounts,
    accessRules,
    loginAccessUser,
    registerAccessUser,
    requestPasswordReset,
    lookupTrackedAccount,
    trackedUsername,
    setTrackedUsername,
    trackedUserAccount,
    refreshAccessState,
    siteSettings,
    isInitialLoading,
    connectionError,
    retryConnection
  } = useApp();

  // Modal state: 'login' | 'register' | 'forgot' | 'check_status' | null
  const [authModalMode, setAuthModalMode] = useState<
    'login' | 'register' | 'forgot' | 'check_status' | null
  >(null);
  const [selectedCardRole, setSelectedCardRole] = useState<RoleType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Silent owner tap detector (5 quick clicks on school logo)
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

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Register form state
  const [regNama, setRegNama] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRole, setRegRole] = useState<RoleType>('TU');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  // Forgot password form state
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotNote, setForgotNote] = useState('');

  // Check notification / switch tracked account state
  const [lookupUsername, setLookupUsername] = useState('');
  const [showTempResetPass, setShowTempResetPass] = useState(true);
  const [copiedTempPass, setCopiedTempPass] = useState(false);
  const [isRefreshingNotif, setIsRefreshingNotif] = useState(false);

  // Resolve tracked user account safely via server status lookup
  const primaryTrackedAccount: RegisteredAccessUser | null =
    trackedUserAccount ||
    (trackedUsername
      ? accessUsers.find(u => u.username.toLowerCase() === trackedUsername.toLowerCase()) || null
      : null);

  // Determine which service cards are visible to this user
  const allowedRolesForView: RoleType[] | null = primaryTrackedAccount
    ? [primaryTrackedAccount.role]
    : null;

  const isIsolatedSingleService = allowedRolesForView !== null && allowedRolesForView.length === 1;
  const isolatedRole = isIsolatedSingleService ? allowedRolesForView[0] : null;

  const getApprovedCountByRole = (role: RoleType) => {
    if (approvedRoleCounts && typeof approvedRoleCounts[role] === 'number') {
      return approvedRoleCounts[role];
    }
    return accessUsers.filter(u => u.role === role && u.status === 'APPROVED').length;
  };

  const openLoginModal = (role: RoleType | null) => {
    const targetRole = role || isolatedRole || null;
    setSelectedCardRole(targetRole);
    setLoginUsername(primaryTrackedAccount ? primaryTrackedAccount.username : '');
    setLoginPassword('');
    setShowLoginPass(false);
    setAuthFeedback(null);
    setAuthModalMode('login');
    refreshAccessState(true);
  };

  const openRegisterModal = (defaultRole: RoleType = 'TU') => {
    setSelectedCardRole(null);
    setRegNama('');
    setRegUsername('');
    setRegRole(defaultRole);
    setRegPassword('');
    setShowRegPass(false);
    setAuthFeedback(null);
    setAuthModalMode('register');
    refreshAccessState(true);
  };

  const openForgotModal = (prefillUsername = '') => {
    setForgotUsername(prefillUsername || primaryTrackedAccount?.username || '');
    setForgotNote('');
    setAuthFeedback(null);
    setAuthModalMode('forgot');
    refreshAccessState(true);
  };

  const openCheckStatusModal = () => {
    setLookupUsername(trackedUsername || '');
    setAuthFeedback(null);
    setAuthModalMode('check_status');
    refreshAccessState(true);
  };

  const handleManualRefreshNotif = async () => {
    setIsRefreshingNotif(true);
    if (trackedUsername) {
      await lookupTrackedAccount(trackedUsername);
    }
    await refreshAccessState(true);
    setTimeout(() => setIsRefreshingNotif(false), 350);
  };

  const handleUseIssuedResetPassword = async (account: RegisteredAccessUser) => {
    const tempCode = account.tempResetCode || account.password || '';
    if (!tempCode || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await loginAccessUser({
        username: account.username,
        password: tempCode,
        expectedRole: account.role
      });
      if (res.ok) {
        setAuthModalMode(null);
        setAuthFeedback(null);
      } else {
        setSelectedCardRole(account.role);
        setLoginUsername(account.username);
        setLoginPassword(tempCode);
        setAuthFeedback({ ok: false, text: res.message });
        setAuthModalMode('login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await loginAccessUser({
        username: loginUsername,
        password: loginPassword,
        expectedRole: selectedCardRole || undefined
      });
      if (res.ok) {
        setAuthModalMode(null);
        setAuthFeedback(null);
      } else {
        setAuthFeedback({ ok: false, text: res.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await registerAccessUser({
        namaLengkap: regNama,
        username: regUsername,
        role: regRole,
        password: regPassword
      });
      setAuthFeedback({ ok: res.ok, text: res.message });
      if (res.ok) {
        setRegNama('');
        setRegUsername('');
        setRegPassword('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await requestPasswordReset({
        username: forgotUsername,
        note: forgotNote
      });
      setAuthFeedback({ ok: res.ok, text: res.message });
      if (res.ok) {
        setForgotNote('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookupAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const clean = lookupUsername.trim();
    if (!clean) return;
    setIsSubmitting(true);
    try {
      const res = await lookupTrackedAccount(clean);
      if (!res.ok) {
        setAuthFeedback({
          ok: false,
          text: res.message
        });
        return;
      }
      setAuthModalMode(null);
      setAuthFeedback(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleMeta = selectedCardRole
    ? {
        TU: {
          label: 'Tata Usaha (TU)',
          icon: Building2,
          color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
          btnColor: 'bg-sky-600 hover:bg-sky-500'
        },
        PENJAGA: {
          label: 'Penjaga Sekolah',
          icon: Shield,
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
          btnColor: 'bg-blue-600 hover:bg-blue-500'
        },
        SERVICE: {
          label: 'Service (Kebersihan)',
          icon: Sparkles,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          btnColor: 'bg-emerald-600 hover:bg-emerald-500'
        },
        PERPUS: {
          label: 'Layanan Perpustakaan',
          icon: BookOpen,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
          btnColor: 'bg-purple-600 hover:bg-purple-500'
        },
        LAB_IPA: {
          label: 'Laboratorium IPA',
          icon: FlaskConical,
          color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
          btnColor: 'bg-teal-600 hover:bg-teal-500'
        }
      }[selectedCardRole]
    : null;

  const isRoleVisible = (role: RoleType) =>
    !allowedRolesForView || allowedRolesForView.includes(role);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Header Info */}
      <div className="max-w-6xl mx-auto w-full pt-4 pb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div
              onClick={handleLogoTap}
              className="w-14 h-16 shrink-0 flex items-center justify-center bg-slate-800/80 rounded-xl p-1.5 border border-slate-700 select-none"
            >
              {schoolConfig.logoAplikasiUrl ? (
                <img
                  src={schoolConfig.logoAplikasiUrl}
                  alt="Logo Aplikasi"
                  className="max-h-13 max-w-full object-contain rounded"
                />
              ) : schoolConfig.logoKabupatenUrl ? (
                <img
                  src={schoolConfig.logoKabupatenUrl}
                  alt="Logo Kabupaten"
                  className="max-h-13 max-w-full object-contain"
                />
              ) : (
                <LogoKabupatenDefault className="w-11 h-14" />
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                {schoolConfig.pemerintahDaerah} · {schoolConfig.dinasPendidikan}
              </p>
              <h1 className="text-lg sm:text-xl font-extrabold text-white">
                {schoolConfig.namaSekolah}
              </h1>
              <p className="text-xs text-blue-400 font-medium">
                Sistem Informasi Operator Layanan Operasional Sekolah (SI-OPS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs text-slate-300">
            <School className="w-4 h-4 text-amber-400" />
            <span>NPSN: {schoolConfig.npsn}</span>
            <span>·</span>
            <span>Kota: {schoolConfig.kabupatenKota}</span>
          </div>
        </div>

        {/* Loading / Connection Retry Banner */}
        {isInitialLoading && (
          <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
            <span>Menghubungkan ke Database Admin Satu Pintu...</span>
          </div>
        )}

        {connectionError && !isInitialLoading && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{connectionError}</span>
            </div>
            <button
              type="button"
              onClick={() => retryConnection()}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        {/* Hero Section + Customizable Admin Welcome Headline */}
        <div className="text-center max-w-4xl mx-auto my-8 sm:my-10 space-y-5">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-400">
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {isolatedRole
                ? `Akses Layanan Terisolasi · ${ROLE_LABELS_MAP[isolatedRole]}`
                : 'Database Admin Satu Pintu · Akses Layanan Operasional Terproteksi'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {siteSettings.welcomeHeadline || 'SELAMAT DATANG OPERATOR LAYANAN OPERASIONAL'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {isolatedRole
              ? `Akun @${primaryTrackedAccount?.username} terdaftar untuk layanan ${ROLE_LABELS_MAP[isolatedRole]}. Layanan lain tidak ditampilkan sesuai hak akses akun Anda.`
              : siteSettings.welcomeSubheadline ||
                'Masuk dengan akun dan sandi Anda, atau ajukan pendaftaran satu layanan operasional sekolah.'}
          </p>

          {/* Main User Auth Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-1">
            <button
              type="button"
              onClick={() => openLoginModal(isolatedRole)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{isolatedRole ? `Masuk ${ROLE_LABELS_MAP[isolatedRole]}` : 'Masuk Akun'}</span>
            </button>

            {!isolatedRole && (
              <button
                type="button"
                onClick={() => openRegisterModal('TU')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Daftar / Ajukan Akun</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => openForgotModal('')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-amber-300 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Lupa Sandi</span>
            </button>

            <button
              type="button"
              onClick={openCheckStatusModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-sky-300 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4 text-sky-400" />
              <span>Cek Notifikasi Akun</span>
            </button>
          </div>
        </div>

        {/* Real-Time User Notification Box (For Tracked / Registered / Reset-Requesting User) */}
        {primaryTrackedAccount && (
          <div className="max-w-3xl mx-auto mb-8 space-y-3">
            <div className="rounded-2xl bg-slate-800/70 border border-slate-700 p-4 sm:p-5 space-y-3 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      Notifikasi & Status Akun: {primaryTrackedAccount.namaLengkap} (
                      <span className="font-mono text-sky-300">@{primaryTrackedAccount.username}</span>)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Layanan Terdaftar: <strong className="text-slate-200">{ROLE_LABELS_MAP[primaryTrackedAccount.role]}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualRefreshNotif}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-750 border border-slate-700 text-[11px] font-semibold text-slate-300 cursor-pointer"
                    title="Muat ulang notifikasi terbaru dari server"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingNotif ? 'animate-spin text-sky-400' : ''}`} />
                    <span>Perbarui</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackedUsername(null)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-750 border border-slate-700 text-[11px] font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Ganti / Akun Lain
                  </button>
                </div>
              </div>

              {/* Password Reset Notification (RESET_ISSUED by Admin) */}
              {primaryTrackedAccount.resetRequestStatus === 'RESET_ISSUED' && (primaryTrackedAccount.tempResetCode || primaryTrackedAccount.password) && (
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-emerald-200">
                        Notifikasi Reset Sandi Disetujui Admin!
                      </p>
                      <p className="text-xs text-emerald-100/90 leading-relaxed">
                        Permintaan reset sandi Anda telah disetujui oleh Admin. Sandi sementara Anda adalah{' '}
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-950 border border-emerald-400/40 font-mono font-extrabold text-amber-300 tracking-wider">
                          {primaryTrackedAccount.tempResetCode || primaryTrackedAccount.password}
                        </span>
                        . Silakan masuk ke layanan menggunakan sandi sementara ini, lalu ganti dengan sandi baru Anda setelah berada di dalam layanan.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 border border-emerald-500/30 rounded-xl px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Sandi Sementara:</span>
                      <span className="font-mono text-sm font-extrabold text-amber-300 tracking-wider">
                        {showTempResetPass ? (primaryTrackedAccount.tempResetCode || primaryTrackedAccount.password) : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowTempResetPass(!showTempResetPass)}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                        title={showTempResetPass ? 'Sembunyikan' : 'Tampilkan sandi sementara'}
                      >
                        {showTempResetPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const code = primaryTrackedAccount.tempResetCode || primaryTrackedAccount.password || '';
                          if (navigator?.clipboard && code) {
                            navigator.clipboard.writeText(code).catch(() => {});
                            setCopiedTempPass(true);
                            setTimeout(() => setCopiedTempPass(false), 1500);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-300 cursor-pointer"
                        title="Salin sandi sementara"
                      >
                        {copiedTempPass ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleUseIssuedResetPassword(primaryTrackedAccount)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Memproses...' : 'Masuk ke Layanan dengan Sandi Sementara →'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Reset Requested Pending */}
              {primaryTrackedAccount.resetRequestStatus === 'REQUESTED' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Menunggu Reset Sandi dari Admin:</strong> Permintaan reset sandi untuk akun{' '}
                    <span className="font-mono">@{primaryTrackedAccount.username}</span> telah terkirim. Notifikasi sandi reset sementara akan muncul otomatis di kotak ini segera setelah diterbitkan Admin.
                  </span>
                </div>
              )}

              {/* Account Approval Status Notification */}
              {primaryTrackedAccount.status === 'PENDING' && accessRules.requireAdminApproval ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Menunggu Persetujuan Admin:</strong> Pengajuan layanan{' '}
                    <strong>{ROLE_LABELS_MAP[primaryTrackedAccount.role]}</strong> Anda sedang menunggu persetujuan Admin sebelum dapat masuk.
                  </span>
                </div>
              ) : primaryTrackedAccount.status === 'REJECTED' ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Pengajuan Ditolak:</strong> Akun <span className="font-mono">@{primaryTrackedAccount.username}</span> telah ditolak oleh Admin.
                  </span>
                </div>
              ) : (
                primaryTrackedAccount.resetRequestStatus !== 'RESET_ISSUED' && (
                  <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-200 text-xs flex items-start gap-2.5">
                    <UserCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Akun Siap Digunakan:</strong> Layanan{' '}
                      <strong>{ROLE_LABELS_MAP[primaryTrackedAccount.role]}</strong> telah aktif. Silakan klik tombol masuk pada kartu layanan di bawah ini.
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Operational Role Selection Cards (Filtered Strictly to User's Requested/Approved Service when Registered) */}
        <div
          className={
            isIsolatedSingleService
              ? 'max-w-md mx-auto'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto'
          }
        >
          {/* CARD 1: TATA USAHA (TU) */}
          {isRoleVisible('TU') && (
            <div className="group relative bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-sky-500/60 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="text-[10.5px] px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                    {getApprovedCountByRole('TU')} Akun Aktif
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                    Administrasi Kantor
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Tata Usaha (TU)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Pengelolaan administrasi kepegawaian ASN/GTK, kesiswaan, persuratan dinas, dan buku inventaris sapras.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Administrasi Kepegawaian & Kesiswaan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Jurnal Harian, Tupoksi, & Lapor Bulanan/Tahunan TU</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Buku Inventaris & Berita Acara Otomatis</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openLoginModal('TU')}
                className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md group-hover:shadow-sky-500/25 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Masuk Layanan TU</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* CARD 2: PENJAGA SEKOLAH */}
          {isRoleVisible('PENJAGA') && (
            <div className="group relative bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-blue-500/60 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="text-[10.5px] px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                    {getApprovedCountByRole('PENJAGA')} Akun Aktif
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                    Keamanan & Fasilitas
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Penjaga Sekolah
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Pengamanan gedung & lingkungan, perbaikan sarpras ringan, ronda malam, dan keselamatan warga sekolah.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Keamanan (Patroli Malam, Kunci, Gerbang)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Jurnal Harian, Tupoksi, & Lapor Bulanan/Tahunan Penjaga</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Buku Inventaris & Ekspedisi Surat</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openLoginModal('PENJAGA')}
                className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md group-hover:shadow-blue-500/25 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Masuk Layanan Penjaga</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* CARD 3: SERVICE (LAYANAN KEBERSIHAN) */}
          {isRoleVisible('SERVICE') && (
            <div className="group relative bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-emerald-500/60 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-[10.5px] px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                    {getApprovedCountByRole('SERVICE')} Akun Aktif
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    Sanitasi & Kebersihan
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Service (Kebersihan)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Sanitasi toilet siswa & guru, kebersihan ruang pimpinan/kantor, serta pemilahan dan pengangkutan sampah.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Sanitasi Harian Toilet Siswa & Guru</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Jurnal Harian, Tupoksi, & Lapor Bulanan/Tahunan Service</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Alat Kebersihan, Mesin Rumput & Sapras</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openLoginModal('SERVICE')}
                className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md group-hover:shadow-emerald-500/25 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Masuk Layanan Service</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* CARD 4: PERPUSTAKAAN */}
          {isRoleVisible('PERPUS') && (
            <div className="group relative bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-purple-500/60 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="text-[10.5px] px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                    {getApprovedCountByRole('PERPUS')} Akun Aktif
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                    Literasi & Bahan Pustaka
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Perpustakaan
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Sirkulasi peminjaman buku, katalogisasi DDC/barcode, inventarisasi koleksi, perawatan buku, dan gerakan literasi.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Katalogisasi DDC & Barcode Sirkulasi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Jurnal Harian, Tupoksi, & Lapor Bulanan/Tahunan Perpus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Inventaris Koleksi, Rak & Data Anggota</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openLoginModal('PERPUS')}
                className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md group-hover:shadow-purple-500/25 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Masuk Layanan Perpustakaan</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* CARD 5: LABORATORIUM IPA */}
          {isRoleVisible('LAB_IPA') && (
            <div className="group relative bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-teal-500/60 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                    <FlaskConical className="w-6 h-6" />
                  </div>
                  <span className="text-[10.5px] px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                    {getApprovedCountByRole('LAB_IPA')} Akun Aktif
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                    Praktikum & Laboratorium Sains
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Laboratorium IPA
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Penyiapan reagen & alat praktikum, sterilisasi alat gelas, kalibrasi mikroskop/neraca, dan standar keselamatan K3 lab.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Penyiapan Praktikum & Kalibrasi Alat Sains</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Jurnal Harian, Tupoksi, & Lapor Bulanan/Tahunan Laboran</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Inventaris Mikroskop, Kit Fisika & Reagen K3</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openLoginModal('LAB_IPA')}
                className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md group-hover:shadow-teal-500/25 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Masuk Layanan Laboratorium IPA</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Feature Highlights Footer */}
        <div className="mt-12 p-4 rounded-xl bg-slate-800/40 border border-slate-800 max-w-4xl mx-auto flex flex-wrap items-center justify-around gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-400" />
            <span>Lapor Bulanan & Tahunan Terpisah Tiap Operator</span>
          </div>
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-sky-400" />
            <span>Inventaris Khusus Sesuai Bidang Tugas</span>
          </div>
          <div className="flex items-center gap-2">
            <Stamp className="w-4 h-4 text-emerald-400" />
            <span>Hak Akses Terisolasi Per Pengguna</span>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {authModalMode === 'login' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-750 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setAuthModalMode(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                  roleMeta ? roleMeta.color : 'text-sky-400 bg-sky-500/10 border-sky-500/30'
                }`}
              >
                {roleMeta ? <roleMeta.icon className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  {roleMeta ? `Masuk: ${roleMeta.label}` : 'Masuk Akun Pengguna'}
                </h3>
                <p className="text-xs text-slate-400">
                  {roleMeta
                    ? 'Akses khusus akun terdaftar untuk layanan ini'
                    : 'Masukkan nama pengguna dan sandi akun Anda'}
                </p>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Pengguna (Username):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus={!primaryTrackedAccount}
                    required
                    value={loginUsername}
                    onChange={e => {
                      setLoginUsername(e.target.value);
                      if (authFeedback) setAuthFeedback(null);
                    }}
                    placeholder="Contoh: andi_tu"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Sandi Pengguna:</label>
                  <button
                    type="button"
                    onClick={() => openForgotModal(loginUsername)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    autoFocus={!!primaryTrackedAccount}
                    required
                    value={loginPassword}
                    onChange={e => {
                      setLoginPassword(e.target.value);
                      if (authFeedback) setAuthFeedback(null);
                    }}
                    placeholder="Masukkan sandi Anda (atau sandi reset)..."
                    className="w-full pl-9 pr-10 py-2.5 text-sm font-mono bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 text-[11px] text-slate-300 leading-relaxed">
                <strong className="text-sky-300">Pengguna lama yang sudah mengisi data?</strong> Tidak perlu daftar ulang — cukup masukkan username Anda dan sandi layanan lama untuk langsung masuk (otomatis tercatat di Admin).
              </div>

              {authFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    authFeedback.ok
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authFeedback.text}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAuthModalMode(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    roleMeta ? roleMeta.btnColor : 'bg-sky-600 hover:bg-sky-500'
                  }`}
                >
                  {isSubmitting ? 'Memverifikasi...' : 'Masuk Sekarang'}
                </button>
              </div>

              {!isolatedRole && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Belum punya akun?</span>
                  <button
                    type="button"
                    onClick={() => openRegisterModal(selectedCardRole || 'TU')}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    Ajukan Pendaftaran Akun →
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {authModalMode === 'register' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-750 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setAuthModalMode(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Daftar / Ajukan Akun Pengguna</h3>
                <p className="text-xs text-slate-400">
                  Pilih satu layanan yang sesuai dan buat sandi pribadi Anda
                </p>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={regNama}
                  onChange={e => {
                    setRegNama(e.target.value);
                    if (authFeedback) setAuthFeedback(null);
                  }}
                  placeholder="Nama lengkap petugas..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Pengguna (Username Unik):
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={regUsername}
                  onChange={e => {
                    setRegUsername(e.target.value);
                    if (authFeedback) setAuthFeedback(null);
                  }}
                  placeholder="Contoh: andi_tu (tanpa spasi)"
                  className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Layanan Operasional {accessRules.enforceSingleServicePerUser ? '(Maks. 1 Layanan)' : ''}:
                </label>
                <select
                  value={regRole}
                  onChange={e => {
                    setRegRole(e.target.value as RoleType);
                    if (authFeedback) setAuthFeedback(null);
                  }}
                  className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {SERVICE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Buat Sandi {accessRules.enforceUniquePassword ? '(Harus Unik / Belum Dipakai Pengguna Lain)' : ''}:
                </label>
                <div className="relative">
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={regPassword}
                    onChange={e => {
                      setRegPassword(e.target.value);
                      if (authFeedback) setAuthFeedback(null);
                    }}
                    placeholder="Minimal 4 karakter..."
                    className="w-full pl-3.5 pr-10 py-2 text-sm font-mono bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-2 ${
                    authFeedback.ok
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {authFeedback.ok ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{authFeedback.text}</span>
                  </div>
                  {authFeedback.ok && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode(null);
                        setAuthFeedback(null);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer transition-colors"
                    >
                      Lihat Status Konfirmasi Admin Secara Real-Time →
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAuthModalMode(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Pendaftaran'}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Sudah disetujui Admin?</span>
                <button
                  type="button"
                  onClick={() => openLoginModal(null)}
                  className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                >
                  Masuk Akun →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check Notification / Status Modal */}
      {authModalMode === 'check_status' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-750 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setAuthModalMode(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border text-sky-400 bg-sky-500/10 border-sky-500/30">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Cek Notifikasi & Status Akun</h3>
                <p className="text-xs text-slate-400">
                  Masukkan username Anda untuk melihat persetujuan atau notifikasi sandi reset dari Admin
                </p>
              </div>
            </div>

            <form onSubmit={handleLookupAccountSubmit} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Pengguna (Username):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={lookupUsername}
                    onChange={e => {
                      setLookupUsername(e.target.value);
                      if (authFeedback) setAuthFeedback(null);
                    }}
                    placeholder="Contoh: andi_tu"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {authFeedback && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authFeedback.text}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAuthModalMode(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Memeriksa...' : 'Tampilkan Notifikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password / Request Reset Modal */}
      {authModalMode === 'forgot' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-750 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setAuthModalMode(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border text-amber-400 bg-amber-500/10 border-amber-500/30">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Lupa Sandi · Minta Reset ke Admin</h3>
                <p className="text-xs text-slate-400">
                  Kirim permintaan reset. Notifikasi sandi reset dari Admin akan muncul otomatis di kotak notifikasi akun Anda.
                </p>
              </div>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Pengguna (Username):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={forgotUsername}
                    onChange={e => {
                      setForgotUsername(e.target.value);
                      if (authFeedback) setAuthFeedback(null);
                    }}
                    placeholder="Masukkan username akun Anda..."
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Keterangan / Catatan (Opsional):
                </label>
                <input
                  type="text"
                  value={forgotNote}
                  onChange={e => setForgotNote(e.target.value)}
                  placeholder="Contoh: Lupa sandi akun TU, mohon bantu reset..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {authFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    authFeedback.ok
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {authFeedback.ok ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{authFeedback.text}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openLoginModal(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Kembali ke Login
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="text-center text-[11px] text-slate-500 py-2">
        UPT Satuan Pendidikan © 2026 · Tata Naskah Dinas Kementerian Pendidikan & Kebudayaan RI
      </div>
    </div>
  );
};
