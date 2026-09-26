import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoleType } from '../../types';
import { SchoolConfigModal } from '../settings/SchoolConfigModal';
import { 
  Building2, 
  Shield, 
  Sparkles, 
  ChevronDown, 
  Settings, 
  LogOut, 
  FileText, 
  Award, 
  Boxes, 
  LayoutDashboard,
  RotateCcw,
  Archive
} from 'lucide-react';
import { LogoKabupatenDefault } from './KopSurat';

export const Header: React.FC = () => {
  const { 
    currentRole, 
    setCurrentRole, 
    activeNavTab, 
    setActiveNavTab, 
    schoolConfig,
    resetToDefaultData,
    archives
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  if (!currentRole) return null;

  const roleConfig = {
    TU: {
      label: 'Tata Usaha (TU)',
      icon: Building2,
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
      activeTabClass: 'border-sky-600 text-sky-700'
    },
    PENJAGA: {
      label: 'Penjaga Sekolah',
      icon: Shield,
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      activeTabClass: 'border-blue-600 text-blue-700'
    },
    SERVICE: {
      label: 'Service (Kebersihan)',
      icon: Sparkles,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      activeTabClass: 'border-emerald-600 text-emerald-700'
    }
  }[currentRole];

  const CurrentRoleIcon = roleConfig.icon;

  const navItems = [
    { id: 'dashboard', label: 'Tugas Operasional', icon: LayoutDashboard },
    { id: 'monthly', label: 'Laporan Bulanan', icon: FileText },
    { id: 'annual', label: 'Laporan Tahunan', icon: Award },
    { id: 'inventory', label: 'Buku Inventaris', icon: Boxes },
    { id: 'archive', label: 'Arsip Dokumen (Pemeriksaan)', icon: Archive, count: archives.length }
  ];

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs no-print">
        {/* Top Info Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: School Identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-11 shrink-0 flex items-center justify-center">
                <LogoKabupatenDefault className="w-8 h-10" />
              </div>

              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {schoolConfig.namaSekolah}
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate hidden xs:block">
                  Operator Layanan Operasional Sekolah · {schoolConfig.kabupatenKota}
                </p>
              </div>
            </div>

            {/* Right: Role Switcher & Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Role Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${roleConfig.badgeClass} hover:shadow-xs`}
                >
                  <CurrentRoleIcon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{roleConfig.label}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {isRoleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Ganti Peran Operasional
                    </div>

                    <button
                      type="button"
                      onClick={() => { setCurrentRole('TU'); setIsRoleDropdownOpen(false); }}
                      className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                        currentRole === 'TU' ? 'font-bold text-sky-700 bg-sky-50/50' : 'text-slate-700'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-sky-600" />
                      <span>Tata Usaha (TU)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setCurrentRole('PENJAGA'); setIsRoleDropdownOpen(false); }}
                      className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                        currentRole === 'PENJAGA' ? 'font-bold text-blue-700 bg-blue-50/50' : 'text-slate-700'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span>Penjaga Sekolah</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setCurrentRole('SERVICE'); setIsRoleDropdownOpen(false); }}
                      className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                        currentRole === 'SERVICE' ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-slate-700'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Service (Kebersihan)</span>
                    </button>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => { setCurrentRole(null); setIsRoleDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      >
                        <LogOut className="w-4 h-4 text-slate-400" />
                        <span>Ke Halaman Masuk Utama</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Config / School Settings */}
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                title="Pengaturan Kop Surat & Identitas Sekolah"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Reset Data Button */}
              <button
                type="button"
                onClick={() => {
                  if (confirm('Kembalikan data ke contoh awal resmi?')) {
                    resetToDefaultData();
                  }
                }}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Reset ke Data Bawaan"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 overflow-x-auto border-t border-slate-100 -mb-px">
            {navItems.map(item => {
              const ItemIcon = item.icon;
              const isActive = activeNavTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNavTab(item.id)}
                  className={`flex items-center gap-1.5 py-2.5 px-1 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? `${roleConfig.activeTabClass} border-current`
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ItemIcon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-current text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.count}
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
    </>
  );
};
