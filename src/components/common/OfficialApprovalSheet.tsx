import React, { useState } from 'react';
import { SchoolConfig, RoleType } from '../../types';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { Edit3, CheckCircle2, ShieldCheck, PenTool, Upload, Stamp, X, RotateCcw } from 'lucide-react';

interface OfficialApprovalSheetProps {
  config: SchoolConfig;
  role: RoleType;
  manualDate: string;
  onDateChange?: (newDate: string) => void;
  className?: string;
  isPrintVersion?: boolean;
}

export const StempelResmiSekolah: React.FC<{ 
  config: SchoolConfig; 
  className?: string;
  size?: number;
}> = ({ config, className = "", size = 135 }) => {
  // If custom uploaded stamp exists, render custom image
  if (config.customStempelUrl) {
    return (
      <div 
        className={`relative inline-block select-none pointer-events-none ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <img 
          src={config.customStempelUrl} 
          alt="Cap Stempel Resmi" 
          className="w-full h-full object-contain -rotate-6 filter drop-shadow-xs opacity-95" 
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative inline-block select-none pointer-events-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg 
        viewBox="0 0 160 160" 
        className="w-full h-full text-blue-800 opacity-90 -rotate-12 filter drop-shadow-xs"
        style={{ color: '#1e40af' }}
      >
        {/* Outer Circular Rim */}
        <circle cx="80" cy="80" r="76" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="80" cy="80" r="71" fill="none" stroke="currentColor" strokeWidth="1" />
        
        {/* Inner Circular Rim */}
        <circle cx="80" cy="80" r="50" fill="none" stroke="currentColor" strokeWidth="1" />

        {/* Curved Path for Top Text */}
        <path
          id="textPathTop"
          d="M 20,80 A 60,60 0 0,1 140,80"
          fill="none"
        />
        {/* Curved Path for Bottom Text */}
        <path
          id="textPathBottom"
          d="M 140,80 A 60,60 0 0,1 20,80"
          fill="none"
        />

        {/* Text Along Path Top */}
        <text fontSize="9.5" fontWeight="bold" fill="currentColor" letterSpacing="0.8">
          <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
            {config.stempelTextLine1 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
          </textPath>
        </text>

        {/* Text Along Path Bottom */}
        <text fontSize="9.5" fontWeight="bold" fill="currentColor" letterSpacing="0.8">
          <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
            {config.stempelTextLine2 || config.namaSekolah}
          </textPath>
        </text>

        {/* Decorative Stars */}
        <text x="21" y="83" fontSize="11" fill="currentColor" textAnchor="middle">★</text>
        <text x="139" y="83" fontSize="11" fill="currentColor" textAnchor="middle">★</text>

        {/* Center Star & Emblems */}
        <polygon 
          points="80,58 83,67 92,67 85,73 87,82 80,77 73,82 75,73 68,67 77,67" 
          fill="currentColor" 
        />
        <text 
          x="80" 
          y="95" 
          textAnchor="middle" 
          fontSize="9" 
          fontWeight="bold" 
          fill="currentColor"
          fontFamily="sans-serif"
        >
          RESMI
        </text>
        <line x1="62" y1="100" x2="98" y2="100" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
};

export const OfficialApprovalSheet: React.FC<OfficialApprovalSheetProps> = ({
  config,
  role,
  manualDate,
  onDateChange,
  className = "",
  isPrintVersion = false
}) => {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(manualDate);
  const [showSignPad, setShowSignPad] = useState(false);
  const [activeSignTarget, setActiveSignTarget] = useState<'operator' | 'kepsek' | null>(null);

  // Dynamic signature overrides stored in state
  const [signatures, setSignatures] = useState<Record<string, string>>({
    operator: config.operatorProfiles[role]?.signatureImage || '',
    kepsek: config.kepalaSekolah?.signatureImage || ''
  });
  const [showStempel, setShowStempel] = useState(config.stempelEnabled ?? true);
  const [customStempel, setCustomStempel] = useState<string>(config.customStempelUrl || '');

  const operator = config.operatorProfiles[role];
  const kepsek = config.kepalaSekolah;

  const handleDateSave = () => {
    if (onDateChange) {
      onDateChange(tempDate);
    }
    setIsEditingDate(false);
  };

  const handleOpenPad = (target: 'operator' | 'kepsek') => {
    setActiveSignTarget(target);
    setShowSignPad(true);
  };

  const handleSaveSignature = (dataUrl: string) => {
    if (activeSignTarget) {
      setSignatures(prev => ({
        ...prev,
        [activeSignTarget]: dataUrl
      }));
    }
  };

  const handleFileUploadSignature = (target: 'operator' | 'kepsek', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSignatures(prev => ({
          ...prev,
          [target]: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadStempel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCustomStempel(result);
        config.customStempelUrl = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const renderSignatureBox = (
    officer: typeof operator,
    targetKey: 'operator' | 'kepsek',
    defaultSignName: string
  ) => {
    const customSig = signatures[targetKey];

    return (
      <div className="flex flex-col items-center justify-between min-h-[120px] w-full relative">
        <div className="w-full h-20 flex items-center justify-center relative my-0.5">
          {customSig ? (
            <img 
              src={customSig} 
              alt="Tanda Tangan" 
              className="max-h-16 max-w-[180px] object-contain drop-shadow-xs" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span className="signature-font text-2xl sm:text-3xl text-blue-900 select-none tracking-wide transform -rotate-3 py-0.5">
                {officer.signatureData || defaultSignName}
              </span>
              <div className="flex items-center gap-1 text-[8.5px] text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 no-print">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                <span>Terverifikasi Digital</span>
              </div>
            </div>
          )}

          {/* Interactive Buttons (Screen Only) */}
          {!isPrintVersion && (
            <div className="absolute right-0 bottom-0 flex items-center gap-1 no-print">
              <label 
                className="cursor-pointer text-[10px] text-slate-600 hover:text-blue-700 bg-white/95 hover:bg-blue-50 px-1.5 py-0.5 rounded border border-slate-300 transition-colors flex items-center gap-1 shadow-2xs"
                title="Unggah file foto / gambar tanda tangan"
              >
                <Upload className="w-2.5 h-2.5" />
                <span>Upload</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileUploadSignature(targetKey, e)} 
                  className="hidden" 
                />
              </label>

              <button
                type="button"
                onClick={() => handleOpenPad(targetKey)}
                className="text-[10px] text-blue-600 hover:text-blue-800 bg-white/95 hover:bg-blue-50 px-1.5 py-0.5 rounded border border-blue-300 transition-colors flex items-center gap-1 shadow-2xs"
                title="Gores tanda tangan di layar"
              >
                <PenTool className="w-2.5 h-2.5" />
                <span>Gores</span>
              </button>

              {customSig && (
                <button
                  type="button"
                  onClick={() => setSignatures(prev => ({ ...prev, [targetKey]: '' }))}
                  className="text-[10px] text-slate-400 hover:text-rose-600 p-0.5"
                  title="Hapus tanda tangan khusus"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Officer Name & NIP */}
        <div className="text-center w-full">
          <p className="font-bold text-xs sm:text-sm text-slate-950 uppercase underline decoration-1 underline-offset-2">
            {officer.nama}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-800 mt-0.5 font-medium tracking-tight">
            {officer.nip}
          </p>
          {officer.pangkatGolongan && (
            <p className="text-[9.5px] sm:text-[11px] text-slate-600">
              {officer.pangkatGolongan}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`w-full mt-4 text-slate-900 break-inside-avoid ${className}`}
      style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
    >
      {/* Control bar on screen for Cap Stempel & Upload Custom Stamp */}
      {!isPrintVersion && (
        <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-3 bg-slate-100/90 rounded-lg text-xs text-slate-700 mb-4 border border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span className="font-semibold text-slate-800">Pengesahan Resmi (Kepala Sekolah & Pembuat Laporan)</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showStempel} 
                onChange={(e) => setShowStempel(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="text-xs font-medium text-slate-700">Tampilkan Stempel</span>
            </label>

            <label className="cursor-pointer flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 text-[11px] font-medium transition-colors shadow-2xs">
              <Stamp className="w-3 h-3 text-blue-600" />
              <span>Upload Cap Stempel Sekolah</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleUploadStempel} 
                className="hidden" 
              />
            </label>

            {customStempel && (
              <button
                type="button"
                onClick={() => { setCustomStempel(''); config.customStempelUrl = ''; }}
                className="text-[10px] text-rose-600 hover:underline"
              >
                Gunakan Cap Default
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2 COLUMNS OFFICIAL SIGNATURE LAYOUT:
          KIRI  : Mengetahui, Kepala Sekolah (dengan Stempel Resmi)
          KANAN : Tempat & Tanggal Manual, Yang Membuat Laporan / Petugas Pelaksana
      */}
      <div 
        className="grid grid-cols-2 gap-6 pt-2 relative items-start break-inside-avoid print:grid-cols-2"
        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
      >
        
        {/* KOLOM KIRI: MENGETAHUI KEPALA SEKOLAH */}
        <div className="flex flex-col items-center text-center relative px-2">
          <p className="text-xs sm:text-sm font-semibold text-slate-800 mb-0.5">
            Mengetahui,
          </p>
          <p className="text-[11px] sm:text-xs text-slate-700 font-medium mb-2">
            Kepala {config.namaSekolah}
          </p>
          
          <div className="relative w-full max-w-[280px]">
            {/* Rubber Stamp Overlay on Kepala Sekolah */}
            {showStempel && (
              <div className="absolute -top-4 -left-6 sm:-left-8 z-10 pointer-events-none">
                <StempelResmiSekolah 
                  config={{ ...config, customStempelUrl: customStempel }} 
                  size={135} 
                />
              </div>
            )}
            {renderSignatureBox(kepsek, 'kepsek', 'RahmatH')}
          </div>
        </div>

        {/* KOLOM KANAN: TEMPAT, TANGGAL & YANG MEMBUAT LAPORAN */}
        <div className="flex flex-col items-center text-center px-2">
          {/* Tanggal Manual di atas Pembuat Laporan */}
          <div className="flex items-center justify-center gap-1.5 mb-1">
            {isEditingDate && !isPrintVersion ? (
              <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-lg border border-amber-300 no-print">
                <input
                  type="text"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="text-xs px-2 py-1 border border-amber-400 rounded bg-white font-medium text-slate-900 w-52"
                  placeholder="Kota Bogor, 30 September 2026"
                />
                <button
                  type="button"
                  onClick={handleDateSave}
                  className="px-2 py-1 text-xs bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => { setTempDate(manualDate); setIsEditingDate(false); }}
                  className="px-1.5 py-1 text-xs text-slate-500"
                >
                  Batal
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm font-medium text-slate-900">
                  {manualDate}
                </span>
                {!isPrintVersion && (
                  <button
                    type="button"
                    onClick={() => setIsEditingDate(true)}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded no-print"
                    title="Ubah tempat & tanggal manual"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm font-semibold text-slate-800 mb-0.5">
            Yang Membuat Laporan,
          </p>
          <p className="text-[11px] sm:text-xs text-slate-700 font-medium mb-2">
            {operator.jabatan}
          </p>

          <div className="w-full max-w-[280px]">
            {renderSignatureBox(operator, 'operator', operator.nama.split(' ')[0])}
          </div>
        </div>
      </div>

      {/* Official Footnote / E-Sign Disclaimer */}
      <div className="mt-3 pt-2 border-t border-dashed border-slate-300 text-center">
        <p className="text-[9.5px] text-slate-500 italic">
          Dokumen ini merupakan laporan kedinasan resmi UPT Satuan Pendidikan yang diverifikasi dan disahkan sesuai dengan Pedoman Tata Naskah Dinas Satuan Pendidikan.
        </p>
      </div>

      {/* Digital Signature Drawing Canvas Modal */}
      {showSignPad && activeSignTarget && (
        <DigitalSignaturePad
          isOpen={showSignPad}
          onClose={() => { setShowSignPad(false); setActiveSignTarget(null); }}
          onSave={handleSaveSignature}
          title={`Gores Tanda Tangan: ${
            activeSignTarget === 'operator' ? operator.nama : kepsek.nama
          }`}
          signerName={
            activeSignTarget === 'operator' 
              ? `${operator.nama} (${operator.nip})` 
              : `${kepsek.nama} (${kepsek.nip})`
          }
        />
      )}
    </div>
  );
};
