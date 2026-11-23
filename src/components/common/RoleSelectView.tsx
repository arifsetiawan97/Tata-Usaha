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
  Home,
  LayoutGrid,
  HelpCircle,
  Database,
  ShieldCheck
} from 'lucide-react';
import { LogoKabupatenDefault } from './KopSurat';
import { formatApiErrorMessage } from '../../services/storageService';
import { MAIN_BACKGROUND_PRESETS, resolveBackgroundPresentation } from '../../utils/backgroundHelper';
import { SkeletonLoader } from './SkeletonLoader';

type PortalTab = 'beranda' | 'layanan' | 'status' | 'panduan';

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

interface ServiceCardSpec {
  role: RoleType;
  category: string;
  title: string;
  description: string;
  bullets: string[];
  buttonLabel: string;
  icon: React.ElementType;
  borderHoverClass: string;
  iconBoxClass: string;
  categoryClass: string;
  checkIconClass: string;
  buttonClass: string;
}

const SERVICE_CARDS: ServiceCardSpec[] = [
  {
    role: 'TU',
    category: 'Administrasi Kantor',
    title: 'Tata Usaha (TU)',
    description:
      'Pengelolaan administrasi kepegawaian ASN/GTK, kesiswaan, persuratan dinas, dan buku inventaris sapras.',
    bullets: [
      'Administrasi Kepegawaian & Kesiswaan',
      'Jurnal Harian, Tupoksi, & Lapor Bulanan/Tahunan TU',
      'Buku Inventaris & Berita Acara Otomatis'
    ],
    buttonLabel: 'Masuk Layanan TU',
    icon: Building2,
    borderHoverClass: 'hover:border-sky-500/60',
    iconBoxClass: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    categoryClass: 'text-sky-400',
    checkIconClass: 'text-sky-400',
    buttonClass: 'bg-sky-600 hover:bg-sky-500 group-hover:shadow-sky-500/25'
  },
  {
    role: 'PENJAGA',
    category: 'Keamanan & Fasilitas',
    title: 'Penjaga Sekolah',
    description:
      'Pengamanan gedung & lingkungan, perbaikan sarpras ringan, ronda malam, dan keselamatan warga sekolah.',
    bullets: [
      'Keamanan (Patroli Malam, Kunci, Gerbang)',
      'Jurnal Harian, Tupoksi, & Lapor Bulanan/Tahunan Penjaga',
      'Buku Inventaris & Ekspedisi Surat'
    ],
    buttonLabel: 'Masuk Layanan Penjaga',
    icon: Shield,
    borderHoverClass: 'hover:border-blue-500/60',
    iconBoxClass: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    categoryClass: 'text-blue-400',
    checkIconClass: 'text-blue-400',
    buttonClass: 'bg-blue-600 hover:bg-blue-500 group-hover:shadow-blue-500/25'
  },
  {
    role: 'SERVICE',
    category: 'Sanitasi & Kebersihan',
    title: 'Service (Kebersihan)',
    description:
      'Sanitasi toilet siswa & guru, kebersihan ruang pimpinan/kantor, serta pemilahan dan pengangkutan sampah.',
    bullets: [
      'Sanitasi Harian Toilet Siswa & Guru',
      'Jurnal Harian, Tupoksi, & Lapor Bulanan/Tahunan Service',
      'Alat Kebersihan, Mesin Rumput & Sapras'
    ],
    buttonLabel: 'Masuk Layanan Service',
    icon: Sparkles,
    borderHoverClass: 'hover:border-emerald-500/60',
    iconBoxClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    categoryClass: 'text-emerald-400',
    checkIconClass: 'text-emerald-400',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-500 group-hover:shadow-emerald-500/25'
  },
  {
    role: 'PERPUS',
    category: 'Literasi & Bahan Pustaka',
    title: 'Perpustakaan',
    description:
      'Sirkulasi peminjaman buku, katalogisasi DDC/barcode, inventarisasi koleksi, perawatan buku, dan gerakan literasi.',
    bullets: [
      'Katalogisasi DDC & Barcode Sirkulasi',
      'Jurnal Harian, Tupoksi, & Lapor Bulanan/Tahunan Perpus',
      'Inventaris Koleksi, Rak & Data Anggota'
    ],
    buttonLabel: 'Masuk Layanan Perpustakaan',
    icon: BookOpen,
    borderHoverClass: 'hover:border-purple-500/60',
    iconBoxClass: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    categoryClass: 'text-purple-400',
    checkIconClass: 'text-purple-400',
    buttonClass: 'bg-purple-600 hover:bg-purple-500 group-hover:shadow-purple-500/25'
  },
  {
    role: 'LAB_IPA',
    category: 'Praktikum & Laboratorium Sains',
    title: 'Laboratorium IPA',
    description:
      'Penyiapan reagen & alat praktikum, sterilisasi alat gelas, kalibrasi mikroskop/neraca, dan standar keselamatan K3 lab.',
    bullets: [
      'Penyiapan Praktikum & Kalibrasi Alat Sains',
      'Jurnal Harian, Tupoksi, & Lapor Bulanan/Tahunan Laboran',
      'Inventaris Mikroskop, Kit Fisika & Reagen K3'
    ],
    buttonLabel: 'Masuk Layanan Laboratorium IPA',
    icon: FlaskConical,
    borderHoverClass: 'hover:border-teal-500/60',
    iconBoxClass: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
    categoryClass: 'text-teal-400',
    checkIconClass: 'text-teal-400',
    buttonClass: 'bg-teal-600 hover:bg-teal-500 group-hover:shadow-teal-500/25'
  }
];

const PORTAL_TAB_HEADER_META: Record<
  PortalTab,
  { title: string; subtitle: string; icon: React.ElementType }
> = {
  beranda: {
    title: 'Beranda Portal SI-OPS',
    subtitle: 'Ringkasan akses layanan operasional sekolah dan status akun aktif.',
    icon: Home
  },
  layanan: {
    title: 'Direktori Layanan Operasional',
    subtitle: 'Pilih ruang kerja layanan sesuai tugas operasional atau ajukan pendaftaran baru.',
    icon: LayoutGrid
  },
  status: {
    title: 'Status Akun & Notifikasi',
    subtitle: 'Pantau persetujuan Admin atau terbitnya sandi reset sementara secara real-time.',
    icon: Bell
  },
  panduan: {
    title: 'Panduan & Keamanan Sistem',
    subtitle: 'Prosedur pendaftaran, isolasi data tiap pengguna, serta pencetakan dokumen resmi.',
    icon: HelpCircle
  }
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
    approvedSchoolHeader,
    refreshAccessState,
    siteSettings,
    isInitialLoading,
    connectionError,
    retryConnection,
    isAdminAuthenticated,
    loginAdminSession
  } = useApp();

  // Primary navigation tab state (switches content cleanly without reloading)
  const [portalTab, setPortalTab] = useState<PortalTab>('beranda');

  // Modal state: 'login' | 'register' | 'forgot' | 'check_status' | null
  const [authModalMode, setAuthModalMode] = useState<
    'login' | 'register' | 'forgot' | 'check_status' | null
  >(null);
  const [selectedCardRole, setSelectedCardRole] = useState<RoleType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Silent owner tap detector (5 quick clicks on school logo/title or copyright footer)
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
  const [regNamaSekolah, setRegNamaSekolah] = useState('');
  const [regPemda, setRegPemda] = useState('');
  const [regDinas, setRegDinas] = useState('');
  const [regKabKota, setRegKabKota] = useState('');
  const [regNpsn, setRegNpsn] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  // Forgot password form state
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotNote, setForgotNote] = useState('');

  // Check notification / switch tracked account state
  const [lookupUsername, setLookupUsername] = useState('');
  const [showTempResetPass, setShowTempResetPass] = useState(true);
  const [copiedTempPass, setCopiedTempPass] = useState(false);
  const [isRefreshingNotif, setIsRefreshingNotif] = useState(false);

  const handleSelectPortalTab = (nextTab: PortalTab) => {
    setPortalTab(nextTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const totalApprovedUsers = Object.values(approvedRoleCounts || {}).reduce(
    (sum, val) => sum + (typeof val === 'number' ? val : 0),
    0
  );

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
    setRegNamaSekolah('');
    setRegPemda('');
    setRegDinas('');
    setRegKabKota('');
    setRegNpsn('');
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
        setAuthFeedback({
          ok: false,
          text: formatApiErrorMessage(res.message, 'Gagal masuk dengan sandi sementara.')
        });
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
      const normalizedUser = loginUsername.trim().toLowerCase();
      if (!selectedCardRole && (normalizedUser === 'admin' || normalizedUser === 'administrator')) {
        const adminRes = await loginAdminSession(loginUsername.trim(), loginPassword);
        if (adminRes.ok) {
          setAuthModalMode(null);
          setAuthFeedback(null);
          window.dispatchEvent(new CustomEvent('siops-open-owner-panel'));
        } else {
          setAuthFeedback({
            ok: false,
            text: formatApiErrorMessage(adminRes.message, 'Username atau sandi Admin tidak sesuai.')
          });
        }
        return;
      }

      const res = await loginAccessUser({
        username: loginUsername,
        password: loginPassword,
        expectedRole: selectedCardRole || undefined
      });
      if (res.ok) {
        setAuthModalMode(null);
        setAuthFeedback(null);
        if (res.isAdmin) {
          window.dispatchEvent(new CustomEvent('siops-open-owner-panel'));
        }
      } else {
        setAuthFeedback({
          ok: false,
          text: formatApiErrorMessage(res.message, 'Gagal masuk ke sistem.')
        });
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
      const cleanSchoolName = regNamaSekolah.trim();
      const res = await registerAccessUser({
        namaLengkap: regNama,
        username: regUsername,
        role: regRole,
        password: regPassword,
        ...(cleanSchoolName
          ? {
              schoolIdentity: {
                namaSekolah: cleanSchoolName,
                ...(regPemda.trim() ? { pemerintahDaerah: regPemda.trim() } : {}),
                ...(regDinas.trim() ? { dinasPendidikan: regDinas.trim() } : {}),
                ...(regKabKota.trim() ? { kabupatenKota: regKabKota.trim() } : {}),
                ...(regNpsn.trim() ? { npsn: regNpsn.trim() } : {})
              }
            }
          : {})
      });
      setAuthFeedback({
        ok: res.ok,
        text: formatApiErrorMessage(res.message, res.ok ? 'Pendaftaran berhasil.' : 'Pendaftaran gagal.')
      });
      if (res.ok) {
        setRegNama('');
        setRegUsername('');
        setRegPassword('');
        setRegNamaSekolah('');
        setRegPemda('');
        setRegDinas('');
        setRegKabKota('');
        setRegNpsn('');
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
      setAuthFeedback({
        ok: res.ok,
        text: formatApiErrorMessage(
          res.message,
          res.ok ? 'Permintaan reset sandi terkirim.' : 'Gagal mengirim permintaan reset sandi.'
        )
      });
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
          text: formatApiErrorMessage(res.message, 'Akun tidak ditemukan.')
        });
        return;
      }
      setAuthModalMode(null);
      setAuthFeedback(null);
      setPortalTab('status');
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

  const visibleServiceCards = SERVICE_CARDS.filter(card => isRoleVisible(card.role));

  // STRICT GATING: Only display school / government header after user is registered AND approved by Admin (or Admin authenticated)
  const isApprovedTrackedUser = primaryTrackedAccount?.status === 'APPROVED';
  const canShowSchoolIdentity = isApprovedTrackedUser || isAdminAuthenticated;
  const resolvedDisplaySchool = isApprovedTrackedUser
    ? {
        pemerintahDaerah:
          approvedSchoolHeader?.pemerintahDaerah ?? primaryTrackedAccount?.schoolIdentity?.pemerintahDaerah ?? '',
        dinasPendidikan:
          approvedSchoolHeader?.dinasPendidikan ?? primaryTrackedAccount?.schoolIdentity?.dinasPendidikan ?? '',
        namaSekolah:
          approvedSchoolHeader?.namaSekolah ||
          primaryTrackedAccount?.schoolIdentity?.namaSekolah ||
          schoolConfig.namaSekolah ||
          '',
        kabupatenKota:
          approvedSchoolHeader?.kabupatenKota ?? primaryTrackedAccount?.schoolIdentity?.kabupatenKota ?? '',
        npsn: approvedSchoolHeader?.npsn ?? primaryTrackedAccount?.schoolIdentity?.npsn ?? '',
        logoAplikasiUrl: approvedSchoolHeader?.logoAplikasiUrl || '',
        logoKabupatenUrl: approvedSchoolHeader?.logoKabupatenUrl || ''
      }
    : isAdminAuthenticated
    ? {
        pemerintahDaerah: schoolConfig.pemerintahDaerah || '',
        dinasPendidikan: schoolConfig.dinasPendidikan || '',
        namaSekolah: schoolConfig.namaSekolah || '',
        kabupatenKota: schoolConfig.kabupatenKota || '',
        npsn: schoolConfig.npsn || '',
        logoAplikasiUrl: schoolConfig.logoAplikasiUrl || '',
        logoKabupatenUrl: schoolConfig.logoKabupatenUrl || ''
      }
    : null;

  const agencyLine = resolvedDisplaySchool
    ? [resolvedDisplaySchool.pemerintahDaerah, resolvedDisplaySchool.dinasPendidikan]
        .map(s => (s || '').trim())
        .filter(Boolean)
        .join(' · ')
    : '';

  const mainBgPresentation = resolveBackgroundPresentation(
    siteSettings.mainBackground,
    MAIN_BACKGROUND_PRESETS,
    'main'
  );

  const portalNavItems: Array<{
    id: PortalTab;
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    badge?: string | number;
  }> = [
    {
      id: 'beranda',
      label: 'Beranda Utama',
      shortLabel: 'Beranda',
      icon: Home
    },
    {
      id: 'layanan',
      label: 'Daftar Layanan',
      shortLabel: 'Layanan',
      icon: LayoutGrid,
      badge: visibleServiceCards.length
    },
    {
      id: 'status',
      label: 'Status & Notifikasi',
      shortLabel: 'Status',
      icon: Bell,
      badge: primaryTrackedAccount ? '1' : undefined
    },
    {
      id: 'panduan',
      label: 'Panduan & Keamanan',
      shortLabel: 'Panduan',
      icon: HelpCircle
    }
  ];

  const activeTabMeta = PORTAL_TAB_HEADER_META[portalTab];
  const ActiveTabIcon = activeTabMeta.icon;

  const renderTrackedAccountNotificationBox = () => {
    if (!primaryTrackedAccount) return null;
    return (
      <div className="rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/90 p-4 sm:p-5 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
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
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-300 cursor-pointer"
              title="Muat ulang notifikasi terbaru dari server"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingNotif ? 'animate-spin text-sky-400' : ''}`} />
              <span>Perbarui</span>
            </button>
            <button
              type="button"
              onClick={() => setTrackedUsername(null)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Ganti / Akun Lain
            </button>
          </div>
        </div>

        {/* Password Reset Notification (RESET_ISSUED by Admin) */}
        {primaryTrackedAccount.resetRequestStatus === 'RESET_ISSUED' &&
          (primaryTrackedAccount.tempResetCode || primaryTrackedAccount.password) && (
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
                    {showTempResetPass ? primaryTrackedAccount.tempResetCode || primaryTrackedAccount.password : '••••••••'}
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
                <strong>{ROLE_LABELS_MAP[primaryTrackedAccount.role]}</strong> telah aktif. Silakan klik tombol masuk pada kartu layanan.
              </span>
            </div>
          )
        )}
      </div>
    );
  };

  const renderServiceCardsGrid = () => (
    <div
      className={
        isIsolatedSingleService
          ? 'max-w-md mx-auto'
          : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'
      }
    >
      {visibleServiceCards.map(card => {
        const CardIcon = card.icon;
        return (
          <div
            key={card.role}
            className={`group relative bg-slate-900/90 backdrop-blur-md hover:bg-slate-800/95 border border-slate-700/80 ${card.borderHoverClass} rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-xl flex flex-col justify-between`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform ${card.iconBoxClass}`}
                >
                  <CardIcon className="w-5 h-5" />
                </div>
                <span className="text-[10.5px] px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium tabular-nums">
                  {getApprovedCountByRole(card.role)} Akun Aktif
                </span>
              </div>

              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${card.categoryClass}`}>
                  {card.category}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{card.title}</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{card.description}</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800 text-xs text-slate-300">
                {card.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${card.checkIconClass}`} />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => openLoginModal(card.role)}
              className={`mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer ${card.buttonClass}`}
            >
              <KeyRound className="w-4 h-4" />
              <span>{card.buttonLabel}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Dynamic Admin-Configured Main Background Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-300"
        style={mainBgPresentation.layerStyle}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-300"
        style={mainBgPresentation.overlayStyle}
      />

      {/* =================================================================== */}
      {/* 1. DESKTOP FIXED SIDEBAR (lg:flex, w-72)                            */}
      {/* =================================================================== */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 z-30 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 shadow-2xl">
        {/* School Brand Header (Strictly gated until approved) */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div
            onClick={handleLogoTap}
            className="flex items-center gap-3 min-w-0 select-none touch-manipulation cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center p-1.5">
              {canShowSchoolIdentity && resolvedDisplaySchool ? (
                resolvedDisplaySchool.logoAplikasiUrl ? (
                  <img
                    src={resolvedDisplaySchool.logoAplikasiUrl}
                    alt="Logo Aplikasi"
                    className="max-h-8 max-w-full object-contain rounded"
                  />
                ) : resolvedDisplaySchool.logoKabupatenUrl ? (
                  <img
                    src={resolvedDisplaySchool.logoKabupatenUrl}
                    alt="Logo Kabupaten"
                    className="max-h-8 max-w-full object-contain"
                  />
                ) : (
                  <LogoKabupatenDefault className="w-7 h-9" />
                )
              ) : (
                <School className="w-6 h-6 text-sky-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {canShowSchoolIdentity && resolvedDisplaySchool ? (
                <>
                  {agencyLine && (
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold truncate">
                      {agencyLine}
                    </p>
                  )}
                  <p className="text-xs font-extrabold text-white truncate">
                    {resolvedDisplaySchool.namaSekolah || 'Satuan Pendidikan Terdaftar'}
                  </p>
                  <p className="text-[11px] text-sky-400 truncate">Portal SI-OPS</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold truncate">
                    Portal Operasional
                  </p>
                  <p className="text-xs font-extrabold text-white truncate">SI-OPS SEKOLAH</p>
                  <p className="text-[10px] text-sky-400 truncate">Aktif Setelah Disetujui Admin</p>
                </>
              )}
            </div>
          </div>

          {canShowSchoolIdentity &&
            resolvedDisplaySchool &&
            (resolvedDisplaySchool.npsn || resolvedDisplaySchool.kabupatenKota) && (
              <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[10px] text-slate-300 flex items-center gap-2 truncate">
                <School className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">
                  {resolvedDisplaySchool.npsn ? `NPSN ${resolvedDisplaySchool.npsn}` : ''}
                  {resolvedDisplaySchool.npsn && resolvedDisplaySchool.kabupatenKota ? ' · ' : ''}
                  {resolvedDisplaySchool.kabupatenKota || ''}
                </span>
              </div>
            )}

          <div className="px-2.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Database
                className={`w-3.5 h-3.5 ${
                  connectionError
                    ? 'text-rose-400'
                    : isInitialLoading
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              />
              <span>
                {connectionError
                  ? 'Koneksi Terputus'
                  : isInitialLoading
                  ? 'Menghubungkan...'
                  : 'Server Aktif 24 Jam'}
              </span>
            </span>
          </div>
        </div>

        {/* Fixed Sidebar Vertical Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Navigasi Utama Portal">
          <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Menu Navigasi Utama
          </p>
          {portalNavItems.map(item => {
            const ItemIcon = item.icon;
            const isActive = portalTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPortalTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all border cursor-pointer group ${
                  isActive
                    ? 'bg-sky-500/15 border-sky-500/40 text-white font-bold shadow-xs'
                    : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/80 font-medium'
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-sky-400"
                  />
                )}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'
                    }`}
                  >
                    <ItemIcon className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-mono tabular-nums shrink-0 px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-sky-500/30 text-sky-200 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Auth Shortcuts in Sidebar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
          <button
            type="button"
            onClick={() => openLoginModal(isolatedRole)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>{isolatedRole ? `Masuk ${ROLE_LABELS_MAP[isolatedRole]}` : 'Masuk Akun'}</span>
          </button>

          <div className="grid grid-cols-2 gap-1.5">
            {!isolatedRole && (
              <button
                type="button"
                onClick={() => openRegisterModal('TU')}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Daftar</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => openForgotModal('')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer ${
                isolatedRole ? 'col-span-2' : ''
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Lupa Sandi</span>
            </button>
          </div>

          {isAdminAuthenticated && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('siops-open-owner-panel'))}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Buka Konsol Admin</span>
            </button>
          )}
        </div>
      </aside>

      {/* =================================================================== */}
      {/* 2. MOBILE STICKY TOP BAR (lg:hidden, height 56px)                  */}
      {/* =================================================================== */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 flex items-center justify-between gap-2">
        <div
          onClick={handleLogoTap}
          className="flex items-center gap-2.5 min-w-0 select-none touch-manipulation"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 p-1">
            {canShowSchoolIdentity && resolvedDisplaySchool ? (
              resolvedDisplaySchool.logoAplikasiUrl ? (
                <img
                  src={resolvedDisplaySchool.logoAplikasiUrl}
                  alt="Logo Aplikasi"
                  className="max-h-7 max-w-full object-contain rounded"
                />
              ) : resolvedDisplaySchool.logoKabupatenUrl ? (
                <img
                  src={resolvedDisplaySchool.logoKabupatenUrl}
                  alt="Logo Sekolah"
                  className="max-h-7 max-w-full object-contain"
                />
              ) : (
                <LogoKabupatenDefault className="w-5 h-7" />
              )
            ) : (
              <School className="w-5 h-5 text-sky-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-white truncate">{activeTabMeta.title}</p>
            <p className="text-[10px] text-sky-400 truncate">
              {canShowSchoolIdentity && resolvedDisplaySchool?.namaSekolah
                ? resolvedDisplaySchool.namaSekolah
                : 'SI-OPS Sekolah'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isAdminAuthenticated && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('siops-open-owner-panel'))}
              className="min-h-[38px] px-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => openLoginModal(isolatedRole)}
            className="min-h-[38px] px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 3. MOBILE FIXED BOTTOM NAVIGATION BAR (lg:hidden, height 64px)      */}
      {/* =================================================================== */}
      <nav
        aria-label="Navigasi Bawah Portal"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-4 items-center px-1 shadow-2xl"
      >
        {portalNavItems.map(item => {
          const ItemIcon = item.icon;
          const isActive = portalTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectPortalTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
                isActive ? 'text-sky-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 w-8 h-1 rounded-full bg-sky-400"
                />
              )}
              <span
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-sky-500/15 text-sky-300' : ''
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
      </nav>

      {/* =================================================================== */}
      {/* 4. MAIN DYNAMIC PORTAL CONTENT SHELL (Offset for Sidebar/BottomNav) */}
      {/* =================================================================== */}
      <div className="relative z-10 lg:pl-72 min-h-screen flex flex-col justify-between pb-20 lg:pb-0">
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex-1 space-y-6">
          {/* Active Page Header Card */}
          <section className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                  <ActiveTabIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-bold text-sky-300">
                      <Lock className="w-3 h-3" />
                      <span>
                        {isolatedRole
                          ? `Terisolasi · ${ROLE_LABELS_MAP[isolatedRole]}`
                          : 'Database Admin Satu Pintu'}
                      </span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-semibold ${
                        connectionError
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                          : isInitialLoading
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      <Database className="w-3 h-3" />
                      <span>
                        {connectionError
                          ? 'Terputus'
                          : isInitialLoading
                          ? 'Memuat...'
                          : 'Terhubung'}
                      </span>
                    </span>
                  </div>

                  <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    {activeTabMeta.title}
                  </h1>
                  <p className="text-xs text-slate-400">{activeTabMeta.subtitle}</p>
                </div>
              </div>

              {/* Quick Page Header Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openLoginModal(isolatedRole)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isolatedRole ? `Masuk ${ROLE_LABELS_MAP[isolatedRole]}` : 'Masuk Akun'}</span>
                </button>
                {!isolatedRole && (
                  <button
                    type="button"
                    onClick={() => openRegisterModal('TU')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Daftar Akun</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={openCheckStatusModal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Bell className="w-3.5 h-3.5 text-sky-400" />
                  <span>Cek Notifikasi</span>
                </button>
              </div>
            </div>
          </section>

          {/* Network Error Retry Banner */}
          {connectionError && !isInitialLoading && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex flex-wrap items-center justify-between gap-3">
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

          {/* Skeleton Loading State vs Dynamic Page View */}
          {isInitialLoading ? (
            <SkeletonLoader variant="portal" theme="dark" />
          ) : (
            <>
              {/* TAB 1: BERANDA UTAMA */}
              {portalTab === 'beranda' && (
                <div className="space-y-6">
                  {/* Hero Welcome Card (Customizable Headline by Admin) */}
                  <section className="rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 p-6 sm:p-8 text-center space-y-5 shadow-xl">
                    {canShowSchoolIdentity && resolvedDisplaySchool && (
                      <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-200">
                        <School className="w-4 h-4 text-sky-400" />
                        <span className="font-bold">{resolvedDisplaySchool.namaSekolah}</span>
                        {agencyLine && <span className="text-slate-400">· {agencyLine}</span>}
                      </div>
                    )}

                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                      {siteSettings.welcomeHeadline || 'SELAMAT DATANG OPERATOR LAYANAN OPERASIONAL'}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                      {isolatedRole
                        ? `Akun @${primaryTrackedAccount?.username} terdaftar untuk layanan ${ROLE_LABELS_MAP[isolatedRole]}. Layanan lain tidak ditampilkan sesuai hak akses akun Anda.`
                        : siteSettings.welcomeSubheadline ||
                          'Masuk dengan akun dan sandi Anda, atau ajukan pendaftaran satu layanan operasional sekolah.'}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
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
                    </div>
                  </section>

                  {/* Real-time Account Notification Card (if tracked) */}
                  {renderTrackedAccountNotificationBox()}

                  {/* Quick Summary Cards */}
                  <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400">Layanan Operasional</p>
                        <p className="text-2xl font-extrabold text-white mt-1 tabular-nums">
                          {visibleServiceCards.length}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {isolatedRole ? 'Terisolasi sesuai akun' : 'Bidang tugas terintegrasi'}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                        <LayoutGrid className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400">Operator Disetujui</p>
                        <p className="text-2xl font-extrabold text-emerald-400 mt-1 tabular-nums">
                          {totalApprovedUsers}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Akun aktif terverifikasi</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <UserCheck className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400">Keamanan & Penyimpanan</p>
                        <p className="text-sm font-extrabold text-amber-300 mt-1.5">Permanen Terpisah</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Data tiap akun tidak bercampur</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    </div>
                  </section>

                  {/* Service Cards Section */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Pilih Layanan Operasional
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleSelectPortalTab('layanan')}
                        className="text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
                      >
                        Lihat Direktori Lengkap →
                      </button>
                    </div>
                    {renderServiceCardsGrid()}
                  </section>

                  {/* Feature Highlights Footer Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-around gap-4 text-xs text-slate-300">
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
              )}

              {/* TAB 2: DIREKTORI LAYANAN */}
              {portalTab === 'layanan' && (
                <div className="space-y-5">
                  {renderServiceCardsGrid()}
                  {!isolatedRole && (
                    <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Belum memiliki akun operator sekolah?
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Ajukan akun untuk 1 bidang layanan beserta identitas sekolah tujuan Anda.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openRegisterModal('TU')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Ajukan Pendaftaran Akun</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: STATUS & NOTIFIKASI AKUN */}
              {portalTab === 'status' && (
                <div className="space-y-5">
                  {primaryTrackedAccount ? (
                    renderTrackedAccountNotificationBox()
                  ) : (
                    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 max-w-xl mx-auto space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">
                            Periksa Status Persetujuan & Reset Sandi
                          </h3>
                          <p className="text-xs text-slate-400">
                            Masukkan username yang Anda daftarkan untuk menampilkan status secara real-time.
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleLookupAccountSubmit} className="space-y-3">
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={lookupUsername}
                            onChange={e => {
                              setLookupUsername(e.target.value);
                              if (authFeedback) setAuthFeedback(null);
                            }}
                            placeholder="Masukkan username (contoh: andi_tu)..."
                            className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                          />
                          <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        </div>

                        {authFeedback && !authModalMode && (
                          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{authFeedback.text}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                          >
                            {isSubmitting ? 'Memeriksa...' : 'Cek Status Akun'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openForgotModal('')}
                            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold cursor-pointer"
                          >
                            Minta Reset Sandi
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PANDUAN & KEAMANAN */}
              {portalTab === 'panduan' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">1. Pendaftaran & Identitas Sekolah</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Setiap operator mendaftarkan 1 akun layanan beserta nama sekolah dan instansi masing-masing. Identitas sekolah tampil otomatis setelah disetujui Admin.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">2. Data & Kop Surat Tersimpan Permanen</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Setiap perubahan kop surat, lembar pengesahan, tupoksi, jurnal harian, hingga background layanan disimpan permanen terpisah per akun pengguna.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">3. Pemulihan Sandi & Stabilitas 24 Jam</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Jika lupa sandi, ajukan permintaan reset melalui menu Lupa Sandi. Sandi sementara dari Admin akan langsung tampil di tab Status & Notifikasi.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Copyright Footer (Preserves hidden 5x tap owner trigger) */}
        <footer
          onClick={handleLogoTap}
          className="relative z-10 text-center text-[11px] text-slate-300/80 py-4 px-4 border-t border-slate-800/60 select-none touch-manipulation"
        >
          UPT Satuan Pendidikan © 2026 · Tata Naskah Dinas Kementerian Pendidikan & Kebudayaan RI
        </footer>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-750 text-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl relative space-y-4">
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
                  Pilih layanan, isi identitas sekolah Anda, dan buat sandi pribadi
                </p>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    placeholder="Contoh: andi_tu"
                    className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pilih Layanan {accessRules.enforceSingleServicePerUser ? '(Maks. 1)' : ''}:
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
                    Buat Sandi {accessRules.enforceUniquePassword ? '(Unik)' : ''}:
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
              </div>

              {/* Per-user School Identity Section */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                  <School className="w-4 h-4" />
                  <span>Identitas Sekolah / Instansi Tujuan</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Nama sekolah dan instansi baru akan tampil di halaman pembuka sesuai isian Anda setelah akun disetujui Admin.
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nama Sekolah / Instansi <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regNamaSekolah}
                    onChange={e => {
                      setRegNamaSekolah(e.target.value);
                      if (authFeedback) setAuthFeedback(null);
                    }}
                    placeholder="Contoh: SMP Negeri 1 Harapan Bangsa"
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Pemerintah Daerah / Yayasan
                    </label>
                    <input
                      type="text"
                      value={regPemda}
                      onChange={e => setRegPemda(e.target.value)}
                      placeholder="Contoh: Pemerintah Kabupaten..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Dinas Pendidikan / Naungan
                    </label>
                    <input
                      type="text"
                      value={regDinas}
                      onChange={e => setRegDinas(e.target.value)}
                      placeholder="Contoh: Dinas Pendidikan dan Kebudayaan"
                      className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Kabupaten / Kota (Opsional)
                    </label>
                    <input
                      type="text"
                      value={regKabKota}
                      onChange={e => setRegKabKota(e.target.value)}
                      placeholder="Contoh: Batang Hari"
                      className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      NPSN (Opsional)
                    </label>
                    <input
                      type="text"
                      value={regNpsn}
                      onChange={e => setRegNpsn(e.target.value)}
                      placeholder="Contoh: 1050xxxx"
                      className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
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
                        setPortalTab('status');
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
    </div>
  );
};
