import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Edit3,
  Eye,
  EyeOff,
  Globe,
  History,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  Share2,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  UserX,
  WifiOff,
  XCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storageService';
import { RegisteredAccessUser, RoleType, UserAccountStatus } from '../../types';
import { formatDateTimeId, ROLE_BADGE, ROLE_OPTIONS } from './adminFormatters';

interface AdminUsersAuditTabProps {
  onNotice: (ok: boolean, text: string) => void;
  onRefreshDashboard: () => Promise<boolean>;
}

type FilterTab = 'ALL' | UserAccountStatus | 'RESET_REQUESTED';

export const AdminUsersAuditTab: React.FC<AdminUsersAuditTabProps> = ({
  onNotice,
  onRefreshDashboard
}) => {
  const {
    accessUsers,
    accessRules,
    updateAccessRules,
    approveAccessUser,
    rejectAccessUser,
    deleteAccessUser,
    updateAccessUserPassword,
    createAccessUserByAdmin,
    updateAdminPassword,
    issueResetPasswordByAdmin,
    refreshAccessState,
    syncStatus,
    serverStorageMode,
    adminDashboardData
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleTempCodes, setVisibleTempCodes] = useState<Record<string, boolean>>({});
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [isRefreshingList, setIsRefreshingList] = useState(false);

  // Portal Link & Hub config
  const [copiedPortalType, setCopiedPortalType] = useState<'origin' | 'hub' | null>(null);
  const [showHubInput, setShowHubInput] = useState(false);
  const [hubUrlInput, setHubUrlInput] = useState(() => storageService.getCentralHubOverride() || '');

  // Change Admin Password
  const [showChangeAdminPass, setShowChangeAdminPass] = useState(false);
  const [nextAdminPass, setNextAdminPass] = useState('');
  const [savingAdminPass, setSavingAdminPass] = useState(false);

  // Add user sub-form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<RoleType>('TU');
  const [newPassword, setNewPassword] = useState('');
  const [newSekolah, setNewSekolah] = useState('');
  const [newStatus, setNewStatus] = useState<UserAccountStatus>('APPROVED');
  const [creatingUser, setCreatingUser] = useState(false);

  // Approve / Edit Password / Issue Reset Password modal
  const [editingUser, setEditingUser] = useState<{
    user: RegisteredAccessUser;
    mode: 'approve' | 'password' | 'issue_reset';
    passwordInput: string;
  } | null>(null);
  const [submittingUserEdit, setSubmittingUserEdit] = useState(false);

  // Delete confirmation modal (soft-delete)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<RegisteredAccessUser | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Audit Log filter
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'SUCCESS' | 'DENIED' | 'FAILED'>('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  const auditLogs = adminDashboardData.auditLogs || [];

  const generateTempPassword = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `RST-${num}`;
  };

  const handleManualRefresh = async () => {
    setIsRefreshingList(true);
    await Promise.all([refreshAccessState(true), onRefreshDashboard()]);
    setTimeout(() => setIsRefreshingList(false), 300);
  };

  const handleCopyPortalLink = (withHubParam: boolean) => {
    if (typeof window === 'undefined' || !navigator?.clipboard) return;
    const origin = window.location.origin;
    const activeHub = storageService.getCentralHubOverride() || origin;
    const urlToCopy = withHubParam ? `${origin}/?hub=${encodeURIComponent(activeHub)}` : origin;
    navigator.clipboard.writeText(urlToCopy).catch(() => {});
    setCopiedPortalType(withHubParam ? 'hub' : 'origin');
    onNotice(
      true,
      withHubParam
        ? `Link Hub Terpusat disalin (${urlToCopy}). Pengguna yang membuka link ini otomatis terhubung ke Database Admin Anda.`
        : `Link Portal disalin (${urlToCopy}). Bagikan link ini ke petugas untuk mendaftar satu pintu.`
    );
    setTimeout(() => setCopiedPortalType(null), 2000);
  };

  const handleSaveHubOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = hubUrlInput.trim().replace(/\/+$/, '');
    if (cleaned && !/^https?:\/\//i.test(cleaned)) {
      onNotice(false, 'URL Hub harus diawali http:// atau https://');
      return;
    }
    storageService.setCentralHubOverride(cleaned || null);
    onNotice(
      true,
      cleaned
        ? `Hub Satu Pintu diarahkan ke ${cleaned}. Memuat data terbaru...`
        : 'Koneksi hub dikembalikan ke server asal domain ini.'
    );
    setShowHubInput(false);
    await Promise.all([refreshAccessState(true), onRefreshDashboard()]);
  };

  const handleAutoRecoverConnection = async () => {
    setIsRefreshingList(true);
    storageService.setCentralHubOverride(null);
    setHubUrlInput('');
    const health = await storageService.checkHealth();
    await Promise.all([refreshAccessState(true), onRefreshDashboard()]);
    setTimeout(() => setIsRefreshingList(false), 300);
    if (health.ok) {
      onNotice(true, `Koneksi server berhasil dipulihkan (${health.label || 'Satu Pintu Aktif'}).`);
    } else {
      onNotice(false, 'Endpoint /api/state belum merespons. Pastikan server aktif atau atur URL Hub.');
    }
  };

  const handleToggleRule = async (
    key: 'requireAdminApproval' | 'enforceUniquePassword' | 'enforceSingleServicePerUser',
    label: string
  ) => {
    const nextVal = !accessRules[key];
    const res = await updateAccessRules({ [key]: nextVal });
    onNotice(res.ok, res.ok ? `Aturan "${label}" sekarang ${nextVal ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}.` : res.message);
    if (res.ok) await onRefreshDashboard();
  };

  const handleSaveAdminPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingAdminPass) return;
    setSavingAdminPass(true);
    const res = await updateAdminPassword(nextAdminPass);
    setSavingAdminPass(false);
    onNotice(res.ok, res.message);
    if (res.ok) {
      setNextAdminPass('');
      setShowChangeAdminPass(false);
      await onRefreshDashboard();
    }
  };

  const handleQuickApprove = async (user: RegisteredAccessUser) => {
    if (submittingUserEdit) return;
    setSubmittingUserEdit(true);
    const res = await approveAccessUser(user.id);
    setSubmittingUserEdit(false);
    onNotice(res.ok, res.message);
    if (res.ok) await onRefreshDashboard();
  };

  const handleConfirmUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || submittingUserEdit) return;
    setSubmittingUserEdit(true);
    const res =
      editingUser.mode === 'approve'
        ? await approveAccessUser(editingUser.user.id, editingUser.passwordInput)
        : editingUser.mode === 'issue_reset'
        ? await issueResetPasswordByAdmin(editingUser.user.id, editingUser.passwordInput)
        : await updateAccessUserPassword(editingUser.user.id, editingUser.passwordInput);
    setSubmittingUserEdit(false);
    onNotice(res.ok, res.message);
    if (res.ok) {
      setEditingUser(null);
      await onRefreshDashboard();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingUser) return;
    setCreatingUser(true);
    const res = await createAccessUserByAdmin({
      namaLengkap: newNama,
      username: newUsername,
      role: newRole,
      password: newPassword,
      status: newStatus,
      ...(newSekolah.trim()
        ? { schoolIdentity: { namaSekolah: newSekolah.trim() } }
        : {})
    });
    setCreatingUser(false);
    onNotice(res.ok, res.message);
    if (res.ok) {
      setNewNama('');
      setNewUsername('');
      setNewPassword('');
      setNewSekolah('');
      setShowAddForm(false);
      await onRefreshDashboard();
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!confirmDeleteUser || deletingUser) return;
    setDeletingUser(true);
    const res = await deleteAccessUser(confirmDeleteUser.id);
    setDeletingUser(false);
    onNotice(res.ok, res.message);
    if (res.ok) {
      setConfirmDeleteUser(null);
      await onRefreshDashboard();
    }
  };

  const handleCopyText = (userId: string, val: string) => {
    if (navigator?.clipboard && val) {
      navigator.clipboard.writeText(val).catch(() => {});
      setCopiedUserId(userId);
      setTimeout(() => setCopiedUserId(null), 1500);
    }
  };

  const pendingUsers = accessUsers.filter(u => u.status === 'PENDING');
  const pendingCount = pendingUsers.length;
  const approvedCount = accessUsers.filter(u => u.status === 'APPROVED').length;
  const rejectedCount = accessUsers.filter(u => u.status === 'REJECTED').length;
  const resetRequestedCount = accessUsers.filter(u => u.resetRequestStatus === 'REQUESTED').length;

  const filteredUsers = accessUsers.filter(u => {
    if (statusFilter === 'RESET_REQUESTED') {
      if (u.resetRequestStatus !== 'REQUESTED') return false;
    } else if (statusFilter !== 'ALL' && u.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const roleLabel = ROLE_OPTIONS.find(r => r.value === u.role)?.label.toLowerCase() || '';
      return (
        u.namaLengkap.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        roleLabel.includes(q)
      );
    }
    return true;
  });

  const filteredAudits = auditLogs.filter(log => {
    if (auditFilter !== 'ALL' && log.status !== auditFilter) return false;
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      return (
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.targetDatabase.toLowerCase().includes(q) ||
        log.detail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Portal Sync & Hub Link Sharing */}
      <div
        className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
          syncStatus === 'offline' || serverStorageMode === 'offline'
            ? 'bg-rose-500/10 border-rose-500/35 text-rose-100'
            : serverStorageMode === 'vercel-ephemeral'
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-100'
            : 'bg-sky-500/10 border-sky-500/30 text-sky-100'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {syncStatus === 'offline' || serverStorageMode === 'offline' ? (
              <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Database className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {syncStatus === 'offline' || serverStorageMode === 'offline'
                  ? 'Koneksi Server Terputus (Mode Offline)'
                  : serverStorageMode === 'upstash'
                  ? 'Satu Pintu Aktif · Upstash Redis Cloud (Permanen)'
                  : serverStorageMode === 'supabase'
                  ? 'Satu Pintu Aktif · Supabase Cloud (Permanen)'
                  : serverStorageMode === 'local-file'
                  ? 'Satu Pintu Aktif · Database Admin Server Lokal'
                  : 'Vercel Mode Sementara · Belum Terhubung Cloud Database'}
              </span>
              <p className="text-[11px] opacity-85 mt-0.5">
                Semua link portal yang dibagikan ke petugas membaca & mendaftar satu pintu ke Database Admin terpusat ini.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(syncStatus === 'offline' || serverStorageMode === 'offline') && (
              <button
                type="button"
                onClick={handleAutoRecoverConnection}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingList ? 'animate-spin' : ''}`} />
                <span>Pulihkan Koneksi</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleCopyPortalLink(false)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{copiedPortalType === 'origin' ? 'Tersalin!' : 'Salin Link Portal'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopyPortalLink(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copiedPortalType === 'hub' ? 'Tersalin!' : 'Salin Link Hub'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowHubInput(!showHubInput)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              {showHubInput ? 'Tutup Hub' : 'Atur URL Hub'}
            </button>
          </div>
        </div>

        {showHubInput && (
          <form onSubmit={handleSaveHubOverride} className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center gap-2">
            <input
              type="url"
              value={hubUrlInput}
              onChange={e => setHubUrlInput(e.target.value)}
              placeholder="Kosongkan untuk default, atau isi https://domain-vercel-anda.vercel.app"
              className="flex-1 min-w-[220px] px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg cursor-pointer"
            >
              Terapkan Hub
            </button>
          </form>
        )}
      </div>

      {/* Pending Banner */}
      {pendingCount > 0 && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-100">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Konfirmasi Pendaftar Baru:</strong> Terdapat <strong>{pendingCount} pengajuan akun baru</strong> menunggu persetujuan Admin.
            </span>
          </div>
          {statusFilter !== 'PENDING' && (
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
            >
              Tinjau Sekarang
            </button>
          )}
        </div>
      )}

      {/* Security Rules + Change Admin Password */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Aturan Keamanan & RBAC Server</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowChangeAdminPass(!showChangeAdminPass)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Ubah Sandi Admin</span>
          </button>
        </div>

        {showChangeAdminPass && (
          <form
            onSubmit={handleSaveAdminPass}
            className="p-3.5 rounded-xl bg-slate-800/80 border border-amber-500/30 flex flex-wrap items-center gap-2"
          >
            <input
              type="password"
              required
              minLength={6}
              value={nextAdminPass}
              onChange={e => setNextAdminPass(e.target.value)}
              placeholder="Sandi Admin baru (minimal 6 karakter)..."
              className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
            <button
              type="submit"
              disabled={savingAdminPass}
              className="px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 rounded-lg cursor-pointer"
            >
              {savingAdminPass ? 'Menyimpan...' : 'Simpan Sandi Admin'}
            </button>
            <button
              type="button"
              onClick={() => setShowChangeAdminPass(false)}
              className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 cursor-pointer"
            >
              Batal
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleToggleRule('requireAdminApproval', 'Wajib Persetujuan Admin')}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
              accessRules.requireAdminApproval
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-slate-800/60 border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-white">1. Wajib Persetujuan Admin</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  accessRules.requireAdminApproval ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {accessRules.requireAdminApproval ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Pendaftar baru menunggu persetujuan Admin sebelum bisa masuk portal.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleToggleRule('enforceUniquePassword', 'Sandi Unik 1 Pengguna')}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
              accessRules.enforceUniquePassword
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-slate-800/60 border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-white">2. Sandi Unik (1 Pengguna)</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  accessRules.enforceUniquePassword ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {accessRules.enforceUniquePassword ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Menolak sandi yang sama antar pengguna berbeda untuk keamanan akun.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleToggleRule('enforceSingleServicePerUser', 'Batas 1 Layanan / Pengguna')}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
              accessRules.enforceSingleServicePerUser
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-slate-800/60 border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-white">3. Batas 1 Layanan / Pengguna</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  accessRules.enforceSingleServicePerUser ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {accessRules.enforceSingleServicePerUser ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Satu username hanya terikat pada satu peran layanan operasional.
            </p>
          </button>
        </div>
      </div>

      {/* User Management Table */}
      <div className="space-y-3 border-t border-slate-800 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: 'ALL', label: `Semua (${accessUsers.length})` },
                { key: 'PENDING', label: `Menunggu (${pendingCount})` },
                { key: 'APPROVED', label: `Disetujui (${approvedCount})` },
                { key: 'RESET_REQUESTED', label: `Minta Reset (${resetRequestedCount})` },
                { key: 'REJECTED', label: `Ditolak (${rejectedCount})` }
              ] as const
            ).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-sky-600 border-sky-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari pengguna..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshingList ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleCreateUser}
            className="p-4 rounded-xl bg-slate-800/70 border border-emerald-500/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 items-end"
          >
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={newNama}
                onChange={e => setNewNama(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Username</label>
              <input
                type="text"
                required
                minLength={3}
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Sekolah (Opsional)</label>
              <input
                type="text"
                value={newSekolah}
                onChange={e => setNewSekolah(e.target.value)}
                placeholder="Nama sekolah..."
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Layanan</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as RoleType)}
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Sandi</label>
              <input
                type="text"
                required
                minLength={4}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Status Awal</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as UserAccountStatus)}
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="APPROVED">Disetujui</option>
                <option value="PENDING">Menunggu</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creatingUser}
                className="flex-1 py-1.5 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-lg cursor-pointer"
              >
                {creatingUser ? '...' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="py-1.5 px-3 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Pengguna</th>
                <th className="px-4 py-3 font-semibold">Layanan</th>
                <th className="px-4 py-3 font-semibold">Keamanan Sandi & Kode Reset</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Tidak ada akun pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const roleLabel = ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role;
                  const tempCode = user.tempResetCode;
                  const isTempVisible = !!visibleTempCodes[user.id];
                  const hasHistory = Array.isArray(user.passwordChangeHistory) && user.passwordChangeHistory.length > 0;
                  const isHistoryOpen = expandedHistoryId === user.id;

                  return (
                    <React.Fragment key={user.id}>
                      <tr className="hover:bg-slate-800/40 align-top">
                        <td className="px-4 py-3">
                          <p className="font-bold text-white">{user.namaLengkap}</p>
                          <p className="text-[11px] text-slate-400 font-mono">@{user.username}</p>
                          {user.schoolIdentity?.namaSekolah && (
                            <p className="text-[10.5px] text-sky-300 mt-1">
                              Sekolah: <strong>{user.schoolIdentity.namaSekolah}</strong>
                              {user.schoolIdentity.kabupatenKota ? ` (${user.schoolIdentity.kabupatenKota})` : ''}
                            </p>
                          )}
                          {user.resetRequestStatus === 'REQUESTED' && user.resetRequestNote && (
                            <p className="text-[10.5px] text-amber-300 mt-1 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5 inline-block">
                              Catatan: {user.resetRequestNote}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded border text-[11px] font-semibold ${ROLE_BADGE[user.role]}`}>
                            {roleLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 space-y-1">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Terenkripsi (scrypt)
                          </span>
                          {tempCode && (
                            <div className="flex items-center gap-1 font-mono text-[11px] bg-amber-500/10 border border-amber-500/30 rounded px-2 py-0.5 w-fit">
                              <span className="text-amber-200">
                                Kode Reset: {isTempVisible ? tempCode : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setVisibleTempCodes(p => ({ ...p, [user.id]: !p[user.id] }))}
                                className="p-0.5 text-amber-300 hover:text-white cursor-pointer"
                              >
                                {isTempVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyText(user.id, tempCode)}
                                className="p-0.5 text-amber-300 hover:text-emerald-300 cursor-pointer"
                              >
                                {copiedUserId === user.id ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 space-y-1">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border ${
                              user.status === 'APPROVED'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : user.status === 'PENDING'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {user.status === 'APPROVED' ? 'DISETUJUI' : user.status === 'PENDING' ? 'MENUNGGU' : 'DITOLAK'}
                          </span>
                          {user.resetRequestStatus === 'REQUESTED' && (
                            <span className="block w-fit px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Minta Reset Sandi
                            </span>
                          )}
                          {hasHistory && (
                            <button
                              type="button"
                              onClick={() => setExpandedHistoryId(isHistoryOpen ? null : user.id)}
                              className="flex items-center gap-1 text-[10.5px] text-sky-400 hover:text-sky-300 cursor-pointer"
                            >
                              <History className="w-3 h-3" />
                              <span>{user.passwordChangeHistory?.length} riwayat</span>
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                          {user.status !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleQuickApprove(user)}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Setujui</span>
                            </button>
                          )}
                          {user.resetRequestStatus === 'REQUESTED' && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingUser({
                                  user,
                                  mode: 'issue_reset',
                                  passwordInput: generateTempPassword()
                                })
                              }
                              className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <KeyRound className="w-3 h-3" />
                              <span>Reset</span>
                            </button>
                          )}
                          {user.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await rejectAccessUser(user.id);
                                onNotice(res.ok, res.message);
                                if (res.ok) await onRefreshDashboard();
                              }}
                              className="px-2 py-1 rounded bg-rose-600/80 hover:bg-rose-500 text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <UserX className="w-3 h-3" />
                              <span>Tolak</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setEditingUser({
                                user,
                                mode: 'password',
                                passwordInput: ''
                              })
                            }
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Sandi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteUser(user)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-rose-500/20 border border-slate-700 text-rose-400 cursor-pointer"
                            title="Arsipkan akun (Soft-Delete)"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                      {isHistoryOpen && hasHistory && (
                        <tr className="bg-slate-950/70">
                          <td colSpan={5} className="px-6 py-2.5 text-[11px] text-slate-300 space-y-1">
                            {user.passwordChangeHistory?.map((h, i) => (
                              <div key={i} className="flex flex-wrap gap-2">
                                <span className="text-slate-400">{formatDateTimeId(h.changedAt)}</span>
                                <span className="font-mono text-sky-300">{h.source}</span>
                                {h.maskedPreview && <span className="font-mono text-slate-400">{h.maskedPreview}</span>}
                              </div>
                            ))}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail Section */}
      <div className="space-y-3 border-t border-slate-800 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">
              Log Aktivitas & Jejak Audit Keamanan ({filteredAudits.length} Entri)
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={auditFilter}
              onChange={e => setAuditFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="SUCCESS">Berhasil (SUCCESS)</option>
              <option value="DENIED">Ditolak (DENIED)</option>
              <option value="FAILED">Gagal (FAILED)</option>
            </select>
            <input
              type="text"
              value={auditSearch}
              onChange={e => setAuditSearch(e.target.value)}
              placeholder="Cari aktor / aksi / tabel..."
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/90 text-slate-300 border-b border-slate-700 sticky top-0">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Waktu</th>
                <th className="px-4 py-2.5 font-semibold">Aktor & Peran</th>
                <th className="px-4 py-2.5 font-semibold">Aksi & Target</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/60">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Belum ada catatan audit pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredAudits.slice(0, 120).map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 align-top">
                    <td className="px-4 py-2 text-[11px] text-slate-400 whitespace-nowrap tabular-nums">
                      {formatDateTimeId(log.timestamp)}
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-semibold text-white">{log.actor}</span>
                      <span className="ml-1.5 text-[10px] font-mono text-slate-400">({log.actorRole})</span>
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px]">
                      <p className="text-sky-300">{log.action}</p>
                      <p className="text-slate-400">{log.targetDatabase}</p>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : log.status === 'DENIED'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[11px] text-slate-300">{log.detail}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Password / Issue Reset Sub-Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4">
          <form
            onSubmit={handleConfirmUserEdit}
            className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            <h4 className="text-sm font-bold text-white">
              {editingUser.mode === 'issue_reset'
                ? `Terbitkan Kode Reset: @${editingUser.user.username}`
                : `Ubah Sandi: @${editingUser.user.username}`}
            </h4>
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-300">
                {editingUser.mode === 'issue_reset' ? 'Sandi Sementara Baru (min 4 karakter)' : 'Sandi Baru (min 4 karakter)'}
              </label>
              <input
                type="text"
                required
                minLength={4}
                value={editingUser.passwordInput}
                onChange={e =>
                  setEditingUser(prev => (prev ? { ...prev, passwordInput: e.target.value } : null))
                }
                placeholder="Masukkan sandi..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submittingUserEdit}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 rounded-lg cursor-pointer"
              >
                {submittingUserEdit ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Soft-Delete User Modal */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-white">Arsipkan Akun Pengguna?</h4>
              <p className="text-xs text-slate-300">
                Akun <strong>{confirmDeleteUser.namaLengkap}</strong> (@{confirmDeleteUser.username}) akan dipindahkan ke Arsip Sementara (Soft-Delete) dan dapat dipulihkan oleh Admin.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingUser}
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white rounded-lg cursor-pointer"
              >
                {deletingUser ? 'Mengarsipkan...' : 'Ya, Arsipkan Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
