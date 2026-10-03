import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoleType } from '../../types';
import { 
  Building2, 
  Shield, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  FileCheck, 
  Boxes, 
  Stamp, 
  School,
  Lock,
  KeyRound,
  AlertCircle,
  X
} from 'lucide-react';
import { LogoKabupatenDefault } from './KopSurat';

export const RoleSelectView: React.FC = () => {
  const { setCurrentRole, schoolConfig, verifyRolePin, setRoleSubTab, setActiveNavTab } = useApp();

  const [pendingRole, setPendingRole] = useState<RoleType | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const handleOpenLogin = (role: RoleType) => {
    setPendingRole(role);
    setPinInput('');
    setPinError(null);
  };

  const handleVerifyAndLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingRole) return;

    if (verifyRolePin(pendingRole, pinInput)) {
      setCurrentRole(pendingRole);
      setRoleSubTab(pendingRole, 'tasks');
      setActiveNavTab('dashboard');
      setPendingRole(null);
    } else {
      setPinError(`PIN keamanan salah! Anda tidak memiliki izin mengakses akun ${pendingRole === 'TU' ? 'Tata Usaha (TU)' : pendingRole === 'PENJAGA' ? 'Penjaga Sekolah' : 'Service Kebersihan'}.`);
    }
  };

  const roleMeta = pendingRole ? {
    TU: {
      label: 'Tata Usaha (TU)',
      icon: Building2,
      operator: schoolConfig.operatorProfiles.TU,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      btnColor: 'bg-sky-600 hover:bg-sky-500'
    },
    PENJAGA: {
      label: 'Penjaga Sekolah',
      icon: Shield,
      operator: schoolConfig.operatorProfiles.PENJAGA,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      btnColor: 'bg-blue-600 hover:bg-blue-500'
    },
    SERVICE: {
      label: 'Service (Kebersihan)',
      icon: Sparkles,
      operator: schoolConfig.operatorProfiles.SERVICE,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500'
    }
  }[pendingRole] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Header Info */}
      <div className="max-w-6xl mx-auto w-full pt-4 pb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-16 shrink-0 flex items-center justify-center bg-slate-800/80 rounded-xl p-1.5 border border-slate-700">
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

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto my-8 sm:my-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            Akses Terproteksi · Hak Akses Masing-Masing Petugas Operasional
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Pilih Portal Akun Layanan Operasional
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2.5">
            Setiap peran operasional memiliki akun dan ruang kerja mandiri yang terproteksi. Data tugas harian, tupoksi, dan laporan bulanan/tahunan hanya dapat diakses oleh petugas yang bersangkutan.
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* CARD 1: TATA USAHA (TU) */}
          <div className="group relative bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-sky-500/60 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  PIN Terproteksi
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                  Administrasi Kantor
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Tata Usaha (TU)
                </h3>
                <p className="text-xs text-sky-200/90 font-medium mt-1">
                  Petugas: {schoolConfig.operatorProfiles.TU.nama} ({schoolConfig.operatorProfiles.TU.nip})
                </p>
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
                  <span>Buku Inventaris & Arsip Terdedikasi</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenLogin('TU')}
              className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md group-hover:shadow-sky-500/25 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Masuk Akun TU</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* CARD 2: PENJAGA SEKOLAH */}
          <div className="group relative bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-blue-500/60 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  PIN Terproteksi
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Keamanan & Fasilitas
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Penjaga Sekolah
                </h3>
                <p className="text-xs text-blue-200/90 font-medium mt-1">
                  Petugas: {schoolConfig.operatorProfiles.PENJAGA.nama} ({schoolConfig.operatorProfiles.PENJAGA.nip})
                </p>
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
              onClick={() => handleOpenLogin('PENJAGA')}
              className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md group-hover:shadow-blue-500/25 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Masuk Akun Penjaga</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* CARD 3: SERVICE (LAYANAN KEBERSIHAN) */}
          <div className="group relative bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-emerald-500/60 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  PIN Terproteksi
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Sanitasi & Kebersihan
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Service (Kebersihan)
                </h3>
                <p className="text-xs text-emerald-200/90 font-medium mt-1">
                  Petugas: {schoolConfig.operatorProfiles.SERVICE.nama} ({schoolConfig.operatorProfiles.SERVICE.nip})
                </p>
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
              onClick={() => handleOpenLogin('SERVICE')}
              className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md group-hover:shadow-emerald-500/25 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Masuk Akun Service</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
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
            <span>Aman & Terisolasi Antar Operator</span>
          </div>
        </div>
      </div>

      {/* PIN Verification Modal */}
      {pendingRole && roleMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-750 text-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setPendingRole(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${roleMeta.color}`}>
                <roleMeta.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  {roleMeta.label}
                </h3>
                <p className="text-xs text-slate-400">
                  {roleMeta.operator.nama}
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyAndLogin} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Masukkan PIN Keamanan Akun:</span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    PIN Dinas: {pendingRole === 'TU' ? '2101' : pendingRole === 'PENJAGA' ? '2102' : '2103'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={8}
                    autoFocus
                    required
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (pinError) setPinError(null);
                    }}
                    placeholder="Ketik 4-digit PIN..."
                    className="w-full px-3.5 py-2.5 text-center font-mono text-base tracking-widest bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Akses dibatasi khusus untuk petugas {roleMeta.label}.
                </p>
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingRole(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer ${roleMeta.btnColor}`}
                >
                  Buka Ruang Kerja
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
