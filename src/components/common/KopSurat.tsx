import React from 'react';
import { SchoolConfig } from '../../types';

interface KopSuratProps {
  config: SchoolConfig;
  className?: string;
  isPrintVersion?: boolean;
}

export const LogoKabupatenDefault: React.FC<{ className?: string }> = ({ className = "w-20 h-24" }) => (
  <svg viewBox="0 0 120 140" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Indonesian Regional Emblem Silhouette / Coat of Arms */}
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>
    </defs>
    {/* Shield Outer */}
    <path 
      d="M60 4 C95 4, 114 15, 114 42 C114 85, 78 122, 60 136 C42 122, 6 85, 6 42 C6 15, 25 4, 60 4 Z" 
      fill="url(#shieldGrad)" 
      stroke="#d97706" 
      strokeWidth="3.5"
    />
    <path 
      d="M60 10 C90 10, 107 19, 107 43 C107 81, 75 115, 60 128 C45 115, 13 81, 13 43 C13 19, 30 10, 60 10 Z" 
      fill="none" 
      stroke="#fef08a" 
      strokeWidth="1.2"
    />
    {/* Star on Top */}
    <polygon 
      points="60,18 63,27 72,27 65,33 67,42 60,37 53,42 55,33 48,27 57,27" 
      fill="#fde047" 
      stroke="#b45309" 
      strokeWidth="0.8"
    />
    {/* Paddy and Cotton Wreath */}
    <path 
      d="M32 50 C26 70, 36 96, 60 108" 
      fill="none" 
      stroke="#fbbf24" 
      strokeWidth="3" 
      strokeDasharray="4 2"
    />
    <path 
      d="M88 50 C94 70, 84 96, 60 108" 
      fill="none" 
      stroke="#fbbf24" 
      strokeWidth="3" 
      strokeDasharray="4 2"
    />
    {/* Mountain & Water Waves (Traditional Pemda Iconography) */}
    <polygon points="60,52 40,82 80,82" fill="#22c55e" opacity="0.9" />
    <polygon points="60,60 48,82 72,82" fill="#ffffff" opacity="0.7" />
    <path d="M35 88 Q47 84 60 88 T85 88" stroke="#38bdf8" strokeWidth="2.5" fill="none" />
    <path d="M35 94 Q47 90 60 94 T85 94" stroke="#38bdf8" strokeWidth="2.5" fill="none" />
    {/* Ribbon Banner */}
    <path d="M28 112 Q60 106 92 112 L88 122 Q60 116 32 122 Z" fill="#b91c1c" stroke="#fef08a" strokeWidth="1" />
    <text x="60" y="119" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#ffffff" fontFamily="sans-serif">
      KABUPATEN
    </text>
  </svg>
);

export const LogoTutWuriDefault: React.FC<{ className?: string }> = ({ className = "w-20 h-24" }) => (
  <svg viewBox="0 0 120 140" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Official Tut Wuri Handayani Symbol */}
    <defs>
      <linearGradient id="blazonBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
    </defs>
    {/* Pentagonal Outer Shield (Segi Lima) */}
    <polygon 
      points="60,6 112,44 92,126 28,126 8,44" 
      fill="url(#blazonBlue)" 
      stroke="#fbbf24" 
      strokeWidth="3.5"
    />
    <polygon 
      points="60,13 105,47 87,120 33,120 15,47" 
      fill="none" 
      stroke="#ffffff" 
      strokeWidth="1.2"
    />
    {/* Golden Wings / Sayap Tut Wuri */}
    <path 
      d="M60 46 C42 46, 26 62, 28 88 C38 82, 48 80, 60 84 C72 80, 82 82, 92 88 C94 62, 78 46, 60 46 Z" 
      fill="#f59e0b" 
      stroke="#fef08a" 
      strokeWidth="1.2"
    />
    {/* Flame / Blazon Beladiri Beladiri & Torch */}
    <path 
      d="M60 28 C64 36, 68 40, 68 46 C68 50, 64 54, 60 54 C56 54, 52 50, 52 46 C52 40, 56 36, 60 28 Z" 
      fill="#ef4444" 
      stroke="#fde047" 
      strokeWidth="1"
    />
    {/* Open Book of Education / Buku Terbuka */}
    <path 
      d="M60 88 C48 82, 34 84, 26 94 L26 98 C34 88, 48 86, 60 92 C72 86, 86 88, 94 98 L94 94 C86 84, 72 82, 60 88 Z" 
      fill="#ffffff" 
      stroke="#0f172a" 
      strokeWidth="0.8"
    />
    <line x1="60" y1="88" x2="60" y2="108" stroke="#ffffff" strokeWidth="2" />
    <path 
      d="M26 98 L60 106 L94 98 L94 102 L60 110 L26 102 Z" 
      fill="#f1f5f9" 
      stroke="#64748b" 
      strokeWidth="0.6"
    />
    {/* Text TUT WURI HANDAYANI */}
    <text x="60" y="122" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#ffffff" fontFamily="sans-serif">
      TUT WURI
    </text>
  </svg>
);

export const KopSurat: React.FC<KopSuratProps> = ({ config, className = "", isPrintVersion = false }) => {
  return (
    <div className={`w-full ${className}`}>
      {/* 3 Columns Layout: Kolom 1 (Kiri), Kolom 2 (Tengah), Kolom 3 (Kanan) */}
      <div className="grid grid-cols-[100px_1fr_100px] items-center gap-3 sm:gap-6 py-2 px-1 text-center">
        {/* Kolom 1: Logo Pemda / Kabupaten */}
        <div className="flex justify-center items-center">
          {config.logoKabupatenUrl ? (
            <img 
              src={config.logoKabupatenUrl} 
              alt="Logo Kabupaten" 
              className="max-h-24 max-w-[90px] object-contain drop-shadow-sm" 
            />
          ) : (
            <LogoKabupatenDefault className="w-20 h-24" />
          )}
        </div>

        {/* Kolom 2: Identitas Resmi Sekolah */}
        <div className="flex flex-col items-center justify-center leading-tight">
          <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-slate-800 uppercase">
            {config.pemerintahDaerah}
          </h3>
          <h2 className="text-xs sm:text-base font-bold tracking-wide text-slate-900 uppercase">
            {config.dinasPendidikan}
          </h2>
          <h1 className="text-base sm:text-xl font-extrabold text-slate-950 uppercase tracking-tight my-0.5">
            {config.namaSekolah}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-700 font-normal leading-snug">
            {config.alamat}, {config.desaKecamatan}, {config.kabupatenKota}, {config.provinsi} {config.kodePos ? `Kode Pos ${config.kodePos}` : ''}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 text-[9.5px] sm:text-[11px] text-slate-600 mt-0.5">
            {config.telepon && <span>Telp: {config.telepon}</span>}
            {config.email && <span>Pos-el: {config.email}</span>}
            {config.website && <span>Laman: {config.website}</span>}
          </div>
          <div className="flex items-center justify-center gap-3 text-[9px] sm:text-[10.5px] font-semibold text-slate-800 mt-0.5">
            <span>NPSN: {config.npsn}</span>
            <span>·</span>
            <span>NSS: {config.nss}</span>
          </div>
        </div>

        {/* Kolom 3: Logo Tut Wuri Handayani / Sekolah */}
        <div className="flex justify-center items-center">
          {config.logoSekolahUrl ? (
            <img 
              src={config.logoSekolahUrl} 
              alt="Logo Sekolah" 
              className="max-h-24 max-w-[90px] object-contain drop-shadow-sm" 
            />
          ) : (
            <LogoTutWuriDefault className="w-20 h-24" />
          )}
        </div>
      </div>

      {/* Garis Ganda Pemisah Khas Surat Dinas (Garis Tebal 3px & Garis Tipis 1px) */}
      <div className="w-full mt-2 mb-4">
        <div className="h-[3px] bg-slate-950 w-full" />
        <div className="h-[1px] bg-slate-900 w-full mt-[2px]" />
      </div>
    </div>
  );
};
