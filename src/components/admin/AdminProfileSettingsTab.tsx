import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Save,
  ShieldCheck,
  User,
  UserCog
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AdminProfileSettingsTabProps {
  onNotice: (ok: boolean, text: string) => void;
  onRefreshDashboard: () => Promise<boolean>;
}

export const AdminProfileSettingsTab: React.FC<AdminProfileSettingsTabProps> = ({
  onNotice,
  onRefreshDashboard
}) => {
  const { adminProfile, adminAuthStatus, updateAdminProfile } = useApp();

  const [newUsername, setNewUsername] = useState(adminProfile?.username || 'admin');
  const [newEmail, setNewEmail] = useState(adminProfile?.email || '');
  const [newNamaLengkap, setNewNamaLengkap] = useState(
    adminProfile?.namaLengkap || 'Administrator Utama'
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (adminProfile) {
      setNewUsername(adminProfile.username || 'admin');
      setNewEmail(adminProfile.email || '');
      setNewNamaLengkap(adminProfile.namaLengkap || 'Administrator Utama');
    }
  }, [adminProfile?.username, adminProfile?.email, adminProfile?.namaLengkap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const cleanUser = newUsername.trim();
    if (cleanUser.length < 3) {
      onNotice(false, 'Username Admin minimal 3 karakter.');
      return;
    }
    if (!newNamaLengkap.trim()) {
      onNotice(false, 'Nama lengkap Admin tidak boleh kosong.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      onNotice(false, 'Sandi Admin baru minimal 6 karakter.');
      return;
    }
    if (newPassword && newPassword !== confirmNewPassword) {
      onNotice(false, 'Konfirmasi sandi baru tidak cocok.');
      return;
    }

    const usernameChanged =
      cleanUser.toLowerCase() !== String(adminProfile?.username || 'admin').toLowerCase();
    const passwordChanged = Boolean(newPassword.trim());

    if ((usernameChanged || passwordChanged) && !currentPassword.trim()) {
      onNotice(
        false,
        'Masukkan sandi Admin saat ini untuk mengonfirmasi penggantian username atau sandi.'
      );
      return;
    }

    setSaving(true);
    const res = await updateAdminProfile({
      currentPassword: currentPassword.trim(),
      newUsername: cleanUser,
      newEmail: newEmail.trim(),
      newNamaLengkap: newNamaLengkap.trim(),
      newPassword: newPassword.trim() || undefined
    });
    setSaving(false);

    onNotice(res.ok, res.message);
    if (res.ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      await onRefreshDashboard();
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Default credentials reminder */}
      {adminProfile?.isDefaultCredentials && !adminAuthStatus.envOverrideActive && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-100 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-200">
              Akun Admin Masih Menggunakan Kredensial Bawaan (Default)
            </div>
            <p className="text-amber-100/90 leading-relaxed">
              Demi keamanan Database Satu Pintu, segera ganti <strong>Username</strong> dan{' '}
              <strong>Sandi</strong> dari bawaan (<code>admin</code> / <code>admin123</code>)
              menggunakan formulir di bawah ini.
            </p>
          </div>
        </div>
      )}

      {/* Active Admin Profile Summary Card */}
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                {adminProfile?.namaLengkap || 'Administrator Utama'}
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
                STATUS: {adminProfile?.status || 'ACTIVE'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 border border-amber-500/35 text-amber-300">
                ROLE: {adminProfile?.role || 'ADMIN'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Username login aktif:{' '}
              <span className="text-sky-300 font-semibold">
                @{adminProfile?.username || 'admin'}
              </span>
              {adminProfile?.email ? ` · Email: ${adminProfile.email}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Tersimpan Permanen di Server</span>
        </div>
      </div>

      {/* Form Pengaturan Profil, Username & Sandi Admin */}
      <form
        onSubmit={handleSubmit}
        className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-4 text-xs"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/70 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Pengaturan Profil, Username &amp; Sandi Admin</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ubah username, email, nama tampilan, atau kata sandi Admin Utama kapan saja.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showPasswords ? 'Sembunyikan Sandi' : 'Tampilkan Sandi'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Username Admin Baru
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                minLength={3}
                maxLength={50}
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="Contoh: admin_sekolah"
                className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Email Admin (Opsional / Bisa Dipakai Login)
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="admin@sekolah.sch.id"
                className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-300 mb-1.5">
              Nama Lengkap Administrator
            </label>
            <input
              type="text"
              required
              value={newNamaLengkap}
              onChange={e => setNewNamaLengkap(e.target.value)}
              placeholder="Contoh: Administrator Utama Sekolah"
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-700/70 space-y-3">
          <div className="text-[11px] font-semibold text-slate-300">
            Penggantian Kata Sandi Admin (Kosongkan Sandi Baru jika hanya ingin mengganti Username/Profil)
          </div>

          {adminAuthStatus.envOverrideActive ? (
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-300 text-[11px]">
              Catatan: Kata sandi utama saat ini dikunci oleh konfigurasi environment server
              (<code className="text-amber-300">ADMIN_PASSCODE</code>). Penggantian username dan nama tetap dapat disimpan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Sandi Admin Baru (Opsional)
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Konfirmasi Sandi Baru
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  placeholder="Ketik ulang sandi baru..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-amber-300 mb-1.5">
              Konfirmasi Sandi Saat Ini (Wajib diisi bila mengubah Username atau Sandi)
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder={
                adminProfile?.isDefaultCredentials
                  ? 'Masukkan sandi saat ini (bawaan: admin123)...'
                  : 'Masukkan sandi Admin saat ini...'
              }
              className="w-full px-3.5 py-2 bg-slate-900 border border-amber-500/40 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Sesi Admin otomatis diperbarui tanpa perlu keluar setelah menyimpan.</span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Profil & Kredensial'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
