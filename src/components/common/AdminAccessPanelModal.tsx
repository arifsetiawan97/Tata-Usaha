import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RegisteredAccessUser, RoleType, UserAccountStatus } from '../../types';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  UserCheck,
  UserX,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  SlidersHorizontal,
  Edit3,
  RefreshCw,
  History,
  Copy
} from 'lucide-react';

interface AdminAccessPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS: { value: RoleType; label: string }[] = [
  { value: 'TU', label: 'Tata Usaha (TU)' },
  { value: 'PENJAGA', label: 'Penjaga Sekolah' },
  { value: 'SERVICE', label: 'Service (Kebersihan)' },
  { value: 'PERPUS', label: 'Layanan Perpustakaan' },
  { value: 'LAB_IPA', label: 'Laboratorium IPA' }
];

const ROLE_BADGE: Record<RoleType, string> = {
  TU: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  PENJAGA: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  SERVICE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  PERPUS: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  LAB_IPA: 'bg-teal-500/15 text-teal-300 border-teal-500/30'
};

type FilterTab = 'ALL' | UserAccountStatus | 'RESET_REQUESTED';

export const AdminAccessPanelModal: React.FC<AdminAccessPanelModalProps> = ({ isOpen, onClose }) => {
  const {
    accessUsers,
    accessRules,
    updateAccessRules,
    approveAccessUser,
    rejectAccessUser,
    deleteAccessUser,
    updateAccessUserPassword,
    createAccessUserByAdmin,
    verifyAdminPassword,
    updateAdminPassword,
    issueResetPasswordByAdmin
  } = useApp();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminInput, setAdminInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Approve / Edit Password / Issue Reset Password sub-dialog
  const [editingUser, setEditingUser] = useState<{
    user: RegisteredAccessUser;
    mode: 'approve' | 'password' | 'issue_reset';
    passwordInput: string;
  } | null>(null);

  // Add user sub-form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<RoleType>('TU');
  const [newPassword, setNewPassword] = useState('');
  const [newStatus, setNewStatus] = useState<UserAccountStatus>('APPROVED');

  // Change Admin Password sub-form
  const [showChangeAdminPass, setShowChangeAdminPass] = useState(false);
  const [nextAdminPass, setNextAdminPass] = useState('');

  // In-UI Delete confirmation
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<RegisteredAccessUser | null>(null);

  // Reset unlock state whenever modal closes for strict owner-only privacy
  useEffect(() => {
    if (!isOpen) {
      setIsUnlocked(false);
      setAdminInput('');
      setAdminLoginError(null);
      setEditingUser(null);
      setConfirmDeleteUser(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const generateTempPassword = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `RST-${num}`;
  };

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(adminInput)) {
      setIsUnlocked(true);
      setAdminLoginError(null);
      setAdminInput('');
    } else {
      setAdminLoginError('Sandi pemilik tidak sesuai!');
    }
  };

  const pendingCount = accessUsers.filter(u => u.status === 'PENDING').length;
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

  const handleConfirmUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const res =
      editingUser.mode === 'approve'
        ? approveAccessUser(editingUser.user.id, editingUser.passwordInput)
        : editingUser.mode === 'issue_reset'
        ? issueResetPasswordByAdmin(editingUser.user.id, editingUser.passwordInput)
        : updateAccessUserPassword(editingUser.user.id, editingUser.passwordInput);

    setNotice({ ok: res.ok, text: res.message });
    if (res.ok) {
      setEditingUser(null);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createAccessUserByAdmin({
      namaLengkap: newNama,
      username: newUsername,
      role: newRole,
      password: newPassword,
      status: newStatus
    });
    setNotice({ ok: res.ok, text: res.message });
    if (res.ok) {
      setNewNama('');
      setNewUsername('');
      setNewPassword('');
      setShowAddForm(false);
    }
  };

  const handleSaveAdminPass = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateAdminPassword(nextAdminPass);
    setNotice({ ok: res.ok, text: res.message });
    if (res.ok) {
      setNextAdminPass('');
      setShowChangeAdminPass(false);
    }
  };

  const handleCopyPassword = (userId: string, password: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(password).catch(() => {});
      setCopiedUserId(userId);
      setTimeout(() => setCopiedUserId(null), 1500);
    }
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Panel Admin Privat · Kontrol Akses & Reset Sandi
              </h2>
              <p className="text-xs text-slate-400">
                Akses khusus pemilik sistem: kelola persetujuan, sandi unik, permintaan reset sandi, dan aturan keamanan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {!isUnlocked ? (
          <div className="p-6 sm:p-10 flex items-center justify-center">
            <form onSubmit={handleUnlockAdmin} className="w-full max-w-sm space-y-4 bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Verifikasi Pemilik / Admin</h3>
                <p className="text-xs text-slate-400">
                  Area ini bersifat rahasia dan hanya diperuntukkan bagi pemilik aplikasi.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sandi Pemilik / Admin:
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={adminInput}
                  onChange={e => {
                    setAdminInput(e.target.value);
                    if (adminLoginError) setAdminLoginError(null);
                  }}
                  placeholder="Masukkan sandi pemilik..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {adminLoginError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adminLoginError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl cursor-pointer"
                >
                  Masuk Panel Admin
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Notice Banner */}
            {notice && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  notice.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {notice.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{notice.text}</span>
                </div>
                <button type="button" onClick={() => setNotice(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Reset Request Alert Banner */}
            {resetRequestedCount > 0 && statusFilter !== 'RESET_REQUESTED' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Ada <strong>{resetRequestedCount} pengguna</strong> yang meminta reset sandi karena lupa sandi.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusFilter('RESET_REQUESTED')}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  Lihat Permintaan Reset
                </button>
              </div>
            )}

            {/* Section 1: 3 Toggleable Security Rules */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Pengaturan Aturan Keamanan Login (Saklar ON / OFF)</h3>
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
                    minLength={4}
                    value={nextAdminPass}
                    onChange={e => setNextAdminPass(e.target.value)}
                    placeholder="Sandi Admin baru (min 4 karakter)..."
                    className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg cursor-pointer"
                  >
                    Simpan Sandi Admin
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
                {/* Rule 1: Admin Approval */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !accessRules.requireAdminApproval;
                    updateAccessRules({ requireAdminApproval: nextVal });
                    setNotice({
                      ok: true,
                      text: `Aturan "Persetujuan Admin Wajib" sekarang ${nextVal ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}.`
                    });
                  }}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    accessRules.requireAdminApproval
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white">1. Wajib Persetujuan Admin</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        accessRules.requireAdminApproval
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {accessRules.requireAdminApproval ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Jika aktif, pengguna baru berstatus Menunggu dan ditolak masuk sebelum disetujui Admin.
                  </p>
                </button>

                {/* Rule 2: Unique Password Binding */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !accessRules.enforceUniquePassword;
                    updateAccessRules({ enforceUniquePassword: nextVal });
                    setNotice({
                      ok: true,
                      text: `Aturan "Sandi Unik Terikat 1 Pengguna" sekarang ${nextVal ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}.`
                    });
                  }}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    accessRules.enforceUniquePassword
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white">2. Sandi Unik (1 Pengguna)</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        accessRules.enforceUniquePassword
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {accessRules.enforceUniquePassword ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Jika aktif, sandi milik Pengguna A ditolak mutlak jika didaftarkan atau dipakai login oleh Pengguna B.
                  </p>
                </button>

                {/* Rule 3: Single Service Per User */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !accessRules.enforceSingleServicePerUser;
                    updateAccessRules({ enforceSingleServicePerUser: nextVal });
                    setNotice({
                      ok: true,
                      text: `Aturan "1 Pengguna Hanya 1 Layanan" sekarang ${nextVal ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}.`
                    });
                  }}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    accessRules.enforceSingleServicePerUser
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white">3. Batas 1 Layanan / Pengguna</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        accessRules.enforceSingleServicePerUser
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {accessRules.enforceSingleServicePerUser ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Jika aktif, satu username hanya dapat didaftarkan dan masuk ke satu layanan operasional saja.
                  </p>
                </button>
              </div>
            </div>

            {/* Section 2: User Management & Password Tracking */}
            <div className="space-y-3 border-t border-slate-800 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        statusFilter === tab.key
                          ? tab.key === 'RESET_REQUESTED'
                            ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                            : 'bg-sky-600 border-sky-500 text-white'
                          : tab.key === 'RESET_REQUESTED' && resetRequestedCount > 0
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Cari nama / username..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Pengguna</span>
                  </button>
                </div>
              </div>

              {/* Add User Inline Form */}
              {showAddForm && (
                <form
                  onSubmit={handleCreateUser}
                  className="p-4 rounded-xl bg-slate-800/70 border border-emerald-500/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={newNama}
                      onChange={e => setNewNama(e.target.value)}
                      placeholder="Nama petugas..."
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
                      placeholder="misal: budi_tu"
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
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Sandi Unik</label>
                    <input
                      type="text"
                      required
                      minLength={4}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min 4 karakter..."
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
                      <option value="APPROVED">Disetujui (APPROVED)</option>
                      <option value="PENDING">Menunggu (PENDING)</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                    >
                      Simpan
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

              {/* Users List */}
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400">
                  Belum ada data pengguna pada filter ini.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Pengguna</th>
                        <th className="px-4 py-3 font-semibold">Layanan</th>
                        <th className="px-4 py-3 font-semibold">Sandi Tercatat</th>
                        <th className="px-4 py-3 font-semibold">Status & Reset</th>
                        <th className="px-4 py-3 font-semibold text-right">Aksi Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      {filteredUsers.map(user => {
                        const roleLabel = ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role;
                        const isVisible = !!visiblePasswords[user.id];
                        const hasHistory = Array.isArray(user.passwordChangeHistory) && user.passwordChangeHistory.length > 0;
                        const isHistoryOpen = expandedHistoryId === user.id;

                        return (
                          <React.Fragment key={user.id}>
                            <tr className="hover:bg-slate-800/40 align-top">
                              <td className="px-4 py-3">
                                <p className="font-bold text-white">{user.namaLengkap}</p>
                                <p className="text-[11px] text-slate-400 font-mono">@{user.username}</p>
                                {user.resetRequestStatus === 'REQUESTED' && user.resetRequestNote && (
                                  <p className="text-[10.5px] text-amber-300 mt-1 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5 inline-block">
                                    Catatan reset: {user.resetRequestNote}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold ${ROLE_BADGE[user.role]}`}>
                                  {roleLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5 font-mono">
                                  <span className="text-slate-200 font-semibold">
                                    {isVisible ? user.password : '•'.repeat(Math.max(4, user.password.length))}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setVisiblePasswords(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                                    title={isVisible ? 'Sembunyikan sandi' : 'Lihat sandi'}
                                  >
                                    {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPassword(user.id, user.password)}
                                    className="p-1 text-slate-400 hover:text-emerald-300 cursor-pointer"
                                    title="Salin sandi"
                                  >
                                    {copiedUserId === user.id ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingUser({ user, mode: 'password', passwordInput: user.password })
                                    }
                                    className="p-1 text-sky-400 hover:text-sky-300 cursor-pointer"
                                    title="Ubah sandi pengguna"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {hasHistory && (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedHistoryId(isHistoryOpen ? null : user.id)}
                                      className="p-1 text-amber-400 hover:text-amber-300 cursor-pointer"
                                      title="Lihat riwayat perubahan sandi"
                                    >
                                      <History className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                {user.passwordUpdatedAt && (
                                  <p className="text-[10px] text-emerald-400 mt-1">
                                    Sandi baru tercatat: {formatDateTime(user.passwordUpdatedAt)}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3 space-y-1">
                                <div>
                                  {user.status === 'APPROVED' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Disetujui
                                    </span>
                                  ) : user.status === 'PENDING' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                                      <Clock className="w-3 h-3" />
                                      Menunggu
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-semibold">
                                      <XCircle className="w-3 h-3" />
                                      Ditolak
                                    </span>
                                  )}
                                </div>

                                {user.resetRequestStatus === 'REQUESTED' && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                    <RefreshCw className="w-3 h-3" />
                                    Minta Reset Sandi
                                  </div>
                                )}
                                {user.resetRequestStatus === 'RESET_ISSUED' && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-semibold">
                                    <KeyRound className="w-3 h-3" />
                                    Menunggu User Ganti Sandi
                                  </div>
                                )}
                                {user.resetRequestStatus === 'COMPLETED' && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Reset Selesai · Sandi Baru Tercatat
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center justify-end gap-1.5">
                                  {user.status !== 'APPROVED' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingUser({ user, mode: 'approve', passwordInput: user.password })
                                      }
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>Setujui</span>
                                    </button>
                                  )}
                                  {user.status !== 'REJECTED' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingUser({
                                          user,
                                          mode: 'issue_reset',
                                          passwordInput: generateTempPassword()
                                        })
                                      }
                                      className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer ${
                                        user.resetRequestStatus === 'REQUESTED'
                                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                                          : 'bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30'
                                      }`}
                                      title="Terbitkan sandi reset sementara untuk pengguna ini"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                      <span>Beri Sandi Reset</span>
                                    </button>
                                  )}
                                  {user.status !== 'REJECTED' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        rejectAccessUser(user.id);
                                        setNotice({
                                          ok: true,
                                          text: `Akun "@${user.username}" ditandai DITOLAK.`
                                        });
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>Tolak</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteUser(user)}
                                    className="p-1.5 rounded-lg bg-rose-600/15 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 cursor-pointer"
                                    title="Hapus pengguna"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isHistoryOpen && hasHistory && (
                              <tr className="bg-slate-950/60">
                                <td colSpan={5} className="px-4 py-3">
                                  <div className="text-[11px] space-y-1.5">
                                    <p className="font-bold text-slate-300 flex items-center gap-1.5">
                                      <History className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Riwayat Perubahan Sandi (@{user.username}):</span>
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {user.passwordChangeHistory!.map((entry, idx) => (
                                        <div
                                          key={idx}
                                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
                                        >
                                          <div>
                                            <span className="font-semibold text-slate-200 block">
                                              {entry.source === 'RESET_BY_ADMIN'
                                                ? 'Sandi Reset dari Admin'
                                                : entry.source === 'USER_AFTER_RESET'
                                                ? 'Sandi Baru (Setelah Reset)'
                                                : entry.source === 'USER_CHANGE'
                                                ? 'Diubah oleh Pengguna'
                                                : entry.source === 'LEGACY_MIGRATION'
                                                ? 'Akun Lama Tersinkron Otomatis'
                                                : 'Dibuat Admin'}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                              {formatDateTime(entry.changedAt)}
                                            </span>
                                          </div>
                                          <span className="font-mono text-emerald-300 font-bold">
                                            {isVisible ? entry.newPassword : '••••••'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sub-dialog: Approve / Issue Temp Reset / Edit Password */}
        {editingUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4">
            <form
              onSubmit={handleConfirmUserEdit}
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl"
            >
              <h4 className="text-sm font-bold text-white">
                {editingUser.mode === 'approve'
                  ? `Setujui & Tetapkan Sandi (@${editingUser.user.username})`
                  : editingUser.mode === 'issue_reset'
                  ? `Terbitkan Sandi Reset (@${editingUser.user.username})`
                  : `Ubah Sandi (@${editingUser.user.username})`}
              </h4>
              <p className="text-xs text-slate-400">
                {editingUser.mode === 'issue_reset'
                  ? 'Berikan sandi reset sementara ini kepada pengguna. Saat pengguna login menggunakan sandi reset, sistem otomatis memintanya membuat sandi baru dan mencatatnya di Admin.'
                  : accessRules.enforceUniquePassword
                  ? 'Aturan sandi unik aktif: sandi tidak boleh sama dengan milik pengguna lain.'
                  : 'Aturan sandi unik sedang nonaktif.'}
              </p>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    {editingUser.mode === 'issue_reset' ? 'Sandi Reset Sementara:' : 'Sandi Pengguna:'}
                  </label>
                  {editingUser.mode === 'issue_reset' && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingUser(prev =>
                          prev ? { ...prev, passwordInput: generateTempPassword() } : null
                        )
                      }
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Acak Sandi</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  minLength={4}
                  autoFocus
                  value={editingUser.passwordInput}
                  onChange={e =>
                    setEditingUser(prev => (prev ? { ...prev, passwordInput: e.target.value } : null))
                  }
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                >
                  {editingUser.mode === 'approve'
                    ? 'Setujui Pengguna'
                    : editingUser.mode === 'issue_reset'
                    ? 'Terbitkan Sandi Reset'
                    : 'Simpan Sandi'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sub-dialog: Confirm Delete */}
        {confirmDeleteUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
              <h4 className="text-sm font-bold text-white">Hapus Akun Pengguna?</h4>
              <p className="text-xs text-slate-300">
                Akun <strong>{confirmDeleteUser.namaLengkap}</strong> (<span className="font-mono">@{confirmDeleteUser.username}</span>) akan dihapus permanen.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteUser(null)}
                  className="px-3.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteAccessUser(confirmDeleteUser.id);
                    setNotice({ ok: true, text: `Akun "@${confirmDeleteUser.username}" berhasil dihapus.` });
                    setConfirmDeleteUser(null);
                  }}
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
