import React, { useState } from 'react';
import { useApp, RoleSubTab } from '../../context/AppContext';
import { SchoolConfigModal } from '../settings/SchoolConfigModal';
import { 
  Building2, 
  Shield, 
  Sparkles, 
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
  Lock
} from 'lucide-react';
import { LogoKabupatenDefault } from './KopSurat';

export const Header: React.FC = () => {
  const { 
    currentRole, 
    setCurrentRole, 
    activeNavTab, 
    setActiveNavTab, 
    roleSubTabs,
    setRoleSubTab,
    schoolConfig,
    resetToDefaultData,
    tasks,
    tupoksiDefinitions,
    inventories,
    archives,
    rolePins,
    updateRolePin
  } = useApp();

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeNotice, setPinChangeNotice] = useState<string | null>(null);

  if (!currentRole) return null;

  const operator = schoolConfig.operatorProfiles[currentRole];

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
    setCurrentRole(null);
    setActiveNavTab('dashboard');
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
              <div className="w-10 h-10 shrink-0 flex items-center justify-center">
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
              {/* Operator Profile Tag */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${roleMeta.badgeClass} shadow-2xs`}>
                <div className="p-1 rounded-md bg-white/70">
                  <CurrentRoleIcon className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold leading-tight">
                    {roleMeta.label}
                  </p>
                  <p className="text-[10px] opacity-80 truncate max-w-[120px] sm:max-w-[170px]">
                    {operator.nama}
                  </p>
                </div>
              </div>

              {/* Change PIN Security Button */}
              <button
                type="button"
                onClick={() => {
                  setNewPinInput('');
                  setPinChangeNotice(null);
                  setIsPinModalOpen(true);
                }}
                className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                title="Ganti PIN Keamanan Akun Ini"
              >
                <KeyRound className="w-4 h-4" />
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

              {/* Reset Data Button */}
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Reset ke Data Bawaan"
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
      {/* In-UI Change PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Ganti PIN Keamanan Akun {roleMeta.label}
                </h3>
                <p className="text-xs text-slate-500">
                  Pastikan PIN bersifat rahasia agar petugas operasional lain tidak dapat masuk ke akun Anda.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPinInput.trim()) return;
                updateRolePin(currentRole, newPinInput.trim());
                setPinChangeNotice('PIN Keamanan Akun berhasil diperbarui!');
                setTimeout(() => {
                  setIsPinModalOpen(false);
                  setPinChangeNotice(null);
                }, 1500);
              }}
              className="space-y-3 pt-2"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIN Baru (4–8 Karakter / Angka):
                </label>
                <input
                  type="password"
                  required
                  maxLength={8}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Ketik PIN baru Anda..."
                  className="w-full px-3 py-2 text-sm text-center font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {pinChangeNotice && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{pinChangeNotice}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={!newPinInput.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs cursor-pointer"
                >
                  Simpan PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
