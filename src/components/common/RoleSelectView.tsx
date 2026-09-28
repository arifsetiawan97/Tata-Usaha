import React from 'react';
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
  School
} from 'lucide-react';
import { LogoKabupatenDefault, LogoTutWuriDefault } from './KopSurat';

export const RoleSelectView: React.FC = () => {
  const { setCurrentRole, schoolConfig } = useApp();

  const handleSelectRole = (role: RoleType) => {
    setCurrentRole(role);
  };

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
            <Stamp className="w-3.5 h-3.5 text-blue-400" />
            Laporan Kinerja Resmi · NIP/NIPPK · Cap Stempel & Kop 3 Kolom
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Pilih Masuk Sesuai Kebutuhan Layanan Operasional
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2.5">
            Silakan pilih portal masuk berdasarkan tugas operasional Anda untuk mencatat tugas harian, memantau analisis otomatis, mengelola inventaris, dan menerbitkan laporan bulanan serta tahunan berstandar dinas.
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* CARD 1: TATA USAHA (TU) */}
          <div className="group relative bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-sky-500/60 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                  Administrasi Kantor
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Tata Usaha (TU)
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Pengelolaan administrasi kepegawaian ASN/GTK, kesiswaan, tata naskah surat masuk & surat keluar, serta buku inventaris sapras.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Administrasi Kepegawaian & Kesiswaan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Sarana Prasarana (KIB Sapras)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Agenda Surat Masuk & Surat Keluar</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Analisis Otomatis Tata Persuratan & Aset</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectRole('TU')}
              className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md group-hover:shadow-sky-500/25"
            >
              <span>Masuk Sebagai TU</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* CARD 2: PENJAGA SEKOLAH */}
          <div className="group relative bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-blue-500/60 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Keamanan & Fasilitas
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Penjaga Sekolah
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Pengamanan gedung & lingkungan, perbaikan sarana/prasarana ringan, pengawasan ketertiban siswa, serta ekspedisi antar surat dinas.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Keamanan (Patroli Malam, Kunci, Pos)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Perbaikan Sarana / Prasarana Sekolah</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Pengawasan Kegiatan & Keselamatan Anak</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Antar Surat Dinas & Ekspedisi Luar</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectRole('PENJAGA')}
              className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md group-hover:shadow-blue-500/25"
            >
              <span>Masuk Sebagai Penjaga</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* CARD 3: SERVICE (LAYANAN KEBERSIHAN) */}
          <div className="group relative bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-emerald-500/60 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Sanitasi & Kebersihan
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Service (Kebersihan)
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Higienitas sanitasi toilet siswa & guru, kebersihan ruang pimpinan/guru/kelas, serta pemilahan dan pengangkutan sampah ke TPS.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Kebersihan Ruang Kantor & Kelas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sanitasi Menyeluruh WC / Toilet Siswa</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Pengangkutan & Pemilahan Sampah</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Analisis Higienitas & Penggunaan Bahan</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectRole('SERVICE')}
              className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md group-hover:shadow-emerald-500/25"
            >
              <span>Masuk Sebagai Service</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div className="mt-12 p-4 rounded-xl bg-slate-800/40 border border-slate-800 max-w-4xl mx-auto flex flex-wrap items-center justify-around gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-400" />
            <span>Lapor Bulanan & Tahunan Teragregasi Otomatis</span>
          </div>
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-sky-400" />
            <span>Inventaris Lengkap TU, Penjaga, & Service</span>
          </div>
          <div className="flex items-center gap-2">
            <Stamp className="w-4 h-4 text-emerald-400" />
            <span>Cetak PDF/HTML, Kop 3 Kolom & Cap Stempel Resmi</span>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-500 py-2">
        UPT Satuan Pendidikan © 2026 · Tata Naskah Dinas Kementerian Pendidikan & Kebudayaan RI
      </div>
    </div>
  );
};
