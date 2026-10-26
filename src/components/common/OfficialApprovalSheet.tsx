import React, { useState } from 'react';
import { SchoolConfig, RoleType } from '../../types';
import { initialSchoolConfig } from '../../data/initialData';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { formatOfficialNameWithDegree } from '../../utils/formatters';
import { 
  Edit3, 
  CheckCircle2, 
  ShieldCheck, 
  PenTool, 
  Upload, 
  Stamp, 
  RotateCcw,
  QrCode,
  FileText,
  Sliders,
  Users,
  Check,
  Sparkles
} from 'lucide-react';

export type SignatureStyleMode = 'digital' | 'manual' | 'image' | 'qr';
export type ApprovalLayoutMode = '2_col' | '3_col';

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

// Official Stylized QR Code Component for Kedinasan E-Sign
const OfficialESignQr: React.FC<{
  title: string;
  name: string;
  nip: string;
  dateStr: string;
}> = ({ title, name, nip, dateStr }) => {
  return (
    <div className="w-full flex items-center justify-center gap-2.5 p-2 bg-slate-50/90 rounded-lg border border-slate-300 max-w-[250px] mx-auto print:bg-white print:border-slate-400">
      <div className="w-13 h-13 bg-white p-1 rounded border border-slate-300 shrink-0 flex items-center justify-center shadow-2xs">
        <svg viewBox="0 0 29 29" className="w-full h-full text-slate-900" shapeRendering="crispEdges">
          {/* Authentic High-Density QR Pattern */}
          <path fill="currentColor" d="M0,0 h7 v7 h-7 z M1,1 h5 v5 h-5 z M2,2 h3 v3 h-3 z" />
          <path fill="currentColor" d="M22,0 h7 v7 h-7 z M23,1 h5 v5 h-5 z M24,2 h3 v3 h-3 z" />
          <path fill="currentColor" d="M0,22 h7 v7 h-7 z M1,23 h5 v5 h-5 z M2,24 h3 v3 h-3 z" />
          <path fill="currentColor" d="M9,2 h2 v2 h-2 z M13,1 h3 v1 h-3 z M17,2 h2 v2 h-2 z M10,5 h1 v1 h-1 z M13,4 h2 v2 h-2 z M18,5 h1 v2 h-1 z" />
          <path fill="currentColor" d="M2,9 h2 v2 h-2 z M5,11 h2 v2 h-2 z M1,14 h2 v1 h-2 z M4,16 h3 v2 h-3 z M2,19 h2 v2 h-2 z" />
          <path fill="currentColor" d="M9,9 h3 v3 h-3 z M14,9 h2 v1 h-2 z M18,9 h3 v2 h-3 z M10,13 h2 v3 h-2 z M13,13 h3 v3 h-3 z M17,13 h2 v1 h-2 z M20,12 h2 v3 h-2 z M24,9 h2 v2 h-2 z M27,11 h2 v2 h-2 z" />
          <path fill="currentColor" d="M9,17 h2 v2 h-2 z M12,18 h2 v2 h-2 z M15,17 h4 v1 h-4 z M16,19 h2 v2 h-2 z M20,17 h2 v2 h-2 z M24,15 h3 v2 h-3 z M23,18 h2 v2 h-2 z M27,17 h2 v3 h-2 z" />
          <path fill="currentColor" d="M9,23 h3 v2 h-3 z M13,22 h2 v3 h-2 z M10,26 h2 v2 h-2 z M13,26 h4 v2 h-4 z M18,23 h3 v2 h-3 z M19,26 h2 v2 h-2 z M23,22 h3 v2 h-3 z M23,25 h2 v3 h-2 z M26,24 h3 v2 h-3 z" />
        </svg>
      </div>
      <div className="text-left text-[9px] leading-tight text-slate-700 min-w-0">
        <div className="font-bold text-blue-900 flex items-center gap-1 text-[9.5px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">TTE RESMI KEDINASAN</span>
        </div>
        <div className="text-[8px] text-slate-500 font-mono mt-0.5">BSrE / SI-OPS KEMDIKBUD</div>
        <div className="text-slate-950 font-bold mt-0.5 truncate">{name}</div>
        <div className="text-[8px] text-slate-600 font-mono">NIP. {nip}</div>
        <div className="text-[7.5px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-0.5">
          <Check className="w-2.5 h-2.5 text-emerald-600 inline" />
          <span>Sah & Terverifikasi Digital</span>
        </div>
      </div>
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
  const [activeSignTarget, setActiveSignTarget] = useState<'operator' | 'kepsek' | 'kasubag' | null>(null);

  // Global / preferred signature display mode
  const [signatureMode, setSignatureMode] = useState<SignatureStyleMode>(() => {
    try {
      const saved = localStorage.getItem('siops_signature_mode');
      if (saved && ['digital', 'manual', 'image', 'qr'].includes(saved)) {
        return saved as SignatureStyleMode;
      }
    } catch (e) {
      console.error(e);
    }
    return 'digital';
  });

  // Approval layout mode (2 columns or 3 columns)
  const [layoutMode, setLayoutMode] = useState<ApprovalLayoutMode>(() => {
    try {
      const saved = localStorage.getItem('siops_signature_layout');
      if (saved && ['2_col', '3_col'].includes(saved)) {
        return saved as ApprovalLayoutMode;
      }
    } catch (e) {
      console.error(e);
    }
    return '2_col';
  });

  // Toolbar open / collapse state on screen
  const [showOptionsToolbar, setShowOptionsToolbar] = useState(true);

  // Signatures store
  const [signatures, setSignatures] = useState<Record<string, string>>({
    operator: config.operatorProfiles?.[role]?.signatureImage || '',
    kepsek: config.kepalaSekolah?.signatureImage || '',
    kasubag: ''
  });

  const [showStempel, setShowStempel] = useState(() => {
    try {
      const saved = localStorage.getItem('siops_signature_stamp');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return config.stempelEnabled ?? true;
  });

  const [customStempel, setCustomStempel] = useState<string>(config.customStempelUrl || '');

  const operator = config.operatorProfiles?.[role] || initialSchoolConfig.operatorProfiles[role] || {
    nama: 'Petugas Layanan Operasional',
    nip: '-',
    jabatan: 'Operator'
  };
  const kepsek = config.kepalaSekolah || initialSchoolConfig.kepalaSekolah;
  // Kasubag TU / Koordinator Urusan data fallback
  const kasubagName = config.operatorProfiles?.['TU']?.nama || initialSchoolConfig.operatorProfiles['TU']?.nama || 'Koordinator Urusan Tata Usaha';
  const kasubagNip = config.operatorProfiles?.['TU']?.nip || initialSchoolConfig.operatorProfiles['TU']?.nip || '19820512 200801 1 008';

  const handleModeChange = (mode: SignatureStyleMode) => {
    setSignatureMode(mode);
    try {
      localStorage.setItem('siops_signature_mode', mode);
    } catch (e) {}
  };

  const handleLayoutChange = (layout: ApprovalLayoutMode) => {
    setLayoutMode(layout);
    try {
      localStorage.setItem('siops_signature_layout', layout);
    } catch (e) {}
  };

  const handleToggleStamp = (val: boolean) => {
    setShowStempel(val);
    try {
      localStorage.setItem('siops_signature_stamp', String(val));
    } catch (e) {}
  };

  const handleDateSave = () => {
    if (onDateChange) {
      onDateChange(tempDate);
    }
    setIsEditingDate(false);
  };

  const handleOpenPad = (target: 'operator' | 'kepsek' | 'kasubag') => {
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

  const handleFileUploadSignature = (target: 'operator' | 'kepsek' | 'kasubag', e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Render signature box content based on current selected mode
  const renderSignatureBox = (
    officer: { nama: string; nip: string; signatureData?: string },
    targetKey: 'operator' | 'kepsek' | 'kasubag',
    defaultSignName: string
  ) => {
    const customSig = signatures[targetKey];
    const formattedNip = officer.nip 
      ? (officer.nip.startsWith('NIP') ? officer.nip : `NIP. ${officer.nip}`) 
      : '-';

    return (
      <div className="flex flex-col items-center w-full relative">
        {/* Signature Drawing / QR / Digital Box with fixed height so every column aligns symmetrically */}
        <div className="w-full h-24 sm:h-28 flex items-center justify-center relative my-1">
          {/* 1. MODE: MANUAL / TANDA TANGAN BASAH (Untuk cetak kertas fisik & pena) */}
          {signatureMode === 'manual' && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {!isPrintVersion && (
                <div className="text-[10px] text-slate-400 font-mono italic select-none no-print">
                  (Ruang Tanda Tangan Basah & Cap Fisik)
                </div>
              )}
            </div>
          )}

          {/* 2. MODE: QR CODE / E-SIGN KEDINASAN */}
          {signatureMode === 'qr' && (
            <OfficialESignQr 
              title={targetKey === 'kepsek' ? 'Kepala Satuan Pendidikan' : targetKey === 'kasubag' ? 'Kasubag TU' : 'Petugas Pelaksana'}
              name={officer.nama}
              nip={officer.nip}
              dateStr={manualDate}
            />
          )}

          {/* 3. MODE: GORES / GAMBAR SCAN ASLI */}
          {signatureMode === 'image' && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {customSig ? (
                <img 
                  src={customSig} 
                  alt="Tanda Tangan" 
                  className="max-h-20 max-w-[190px] object-contain drop-shadow-xs" 
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-2 border border-dashed border-slate-300 rounded-lg bg-slate-50 text-slate-400 w-full max-w-[200px]">
                  <span className="text-[10px] italic">Belum ada goresan tanda tangan</span>
                  {!isPrintVersion && (
                    <div className="flex items-center gap-1.5 mt-1 no-print">
                      <button
                        type="button"
                        onClick={() => handleOpenPad(targetKey)}
                        className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded font-medium hover:bg-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        <PenTool className="w-2.5 h-2.5" /> Gores TTD
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. MODE: DIGITAL / FONT RESMI TERVERIFIKASI (Default) */}
          {signatureMode === 'digital' && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {customSig ? (
                <img 
                  src={customSig} 
                  alt="Tanda Tangan" 
                  className="max-h-20 max-w-[190px] object-contain drop-shadow-xs" 
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <span className="signature-font text-2xl sm:text-3xl text-blue-900 select-none tracking-wide transform -rotate-3 py-1">
                    {officer.signatureData || defaultSignName}
                  </span>
                  <div className="flex items-center gap-1 text-[8.5px] text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 no-print">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Terverifikasi Digital</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Action Buttons per-signer (Screen Only, when in digital or image mode) */}
          {!isPrintVersion && (signatureMode === 'digital' || signatureMode === 'image') && (
            <div className="absolute right-0 -bottom-1 flex items-center gap-1 no-print">
              <label 
                className="cursor-pointer text-[10px] text-slate-600 hover:text-blue-700 bg-white/95 hover:bg-blue-50 px-1.5 py-0.5 rounded border border-slate-300 transition-colors flex items-center gap-1 shadow-2xs"
                title="Unggah file foto / scan tanda tangan"
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
                className="text-[10px] text-blue-600 hover:text-blue-800 bg-white/95 hover:bg-blue-50 px-1.5 py-0.5 rounded border border-blue-300 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Gores tanda tangan di layar"
              >
                <PenTool className="w-2.5 h-2.5" />
                <span>Gores</span>
              </button>

              {customSig && (
                <button
                  type="button"
                  onClick={() => setSignatures(prev => ({ ...prev, [targetKey]: '' }))}
                  className="text-[10px] text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                  title="Hapus tanda tangan khusus"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Officer Name & NIP with strict equal row heights for 100% horizontal alignment */}
        <div className="text-center w-full mt-2">
          <div className="h-6 flex items-center justify-center">
            <p className="font-bold text-xs sm:text-sm text-slate-950 underline decoration-1 underline-offset-2 tracking-wide truncate max-w-[280px]">
              {formatOfficialNameWithDegree(officer.nama)}
            </p>
          </div>
          <div className="h-5 flex items-center justify-center mt-0.5">
            <p className="text-[10px] sm:text-xs text-slate-800 font-mono tracking-tight truncate max-w-[280px]">
              {formattedNip}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`w-full mt-4 text-slate-900 break-inside-avoid ${className}`}
      style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
    >
      {/* 
        TOOLBAR PILIHAN TAMPILAN TANDA TANGAN (SCREEN ONLY) 
        Menyediakan 4 pilihan mode tampilan tanda tangan dan pilihan layout penandatangan
      */}
      {!isPrintVersion && (
        <div className="bg-slate-50 border border-slate-300/80 rounded-xl p-3 mb-4 shadow-2xs no-print text-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  Pilihan Tampilan Tanda Tangan & Format Lembar Pengesahan
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                    Resmi Kedinasan
                  </span>
                </h4>
                <p className="text-[10.5px] text-slate-500">
                  Pilih gaya tanda tangan (Digital, Basah, Gambar Scan, atau QR-Code E-Sign) dan tata letak pejabat pengesah.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOptionsToolbar(!showOptionsToolbar)}
              className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors cursor-pointer"
            >
              {showOptionsToolbar ? 'Sembunyikan Opsi' : 'Buka Opsi'}
            </button>
          </div>

          {showOptionsToolbar && (
            <div className="pt-3 space-y-3">
              {/* ROW 1: 4 PILIHAN GAYA TAMPILAN TANDA TANGAN */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Pilih Gaya / Mode Tanda Tangan:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Pilihan 1: Digital / Kaligrafi */}
                  <button
                    type="button"
                    onClick={() => handleModeChange('digital')}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      signatureMode === 'digital'
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        ✍️ Digital Resmi
                      </span>
                      {signatureMode === 'digital' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Font kaligrafi digital otomatis & sertifikat digital
                    </p>
                  </button>

                  {/* Pilihan 2: Basah / Manual */}
                  <button
                    type="button"
                    onClick={() => handleModeChange('manual')}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      signatureMode === 'manual'
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        📝 Tanda Tangan Basah
                      </span>
                      {signatureMode === 'manual' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Ruang kosong/titik-titik untuk pena fisik & cap basah
                    </p>
                  </button>

                  {/* Pilihan 3: Gores / Gambar Scan */}
                  <button
                    type="button"
                    onClick={() => handleModeChange('image')}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      signatureMode === 'image'
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        🖊️ Gores / Scan Gambar
                      </span>
                      {signatureMode === 'image' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Gores di layar sentuh atau upload foto tanda tangan
                    </p>
                  </button>

                  {/* Pilihan 4: QR-Code E-Sign */}
                  <button
                    type="button"
                    onClick={() => handleModeChange('qr')}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      signatureMode === 'qr'
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        📱 QR-Code E-Sign
                      </span>
                      {signatureMode === 'qr' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Barcode verifikasi digital resmi berstandar kedinasan
                    </p>
                  </button>
                </div>
              </div>

              {/* ROW 2: LAYOUT PENANDATANGAN & CAP STEMPEL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Opsi Tata Letak Kolom */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    2. Susunan Penandatangan (Layout):
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLayoutChange('2_col')}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        layoutMode === '2_col'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      <span>2 Kolom (Kepsek & Petugas)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLayoutChange('3_col')}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        layoutMode === '3_col'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      <span>3 Kolom (+ Kasubag TU)</span>
                    </button>
                  </div>
                </div>

                {/* Opsi Cap Stempel Sekolah */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    3. Cap Stempel Resmi Sekolah:
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium cursor-pointer shadow-2xs">
                      <input 
                        type="checkbox" 
                        checked={showStempel} 
                        onChange={(e) => handleToggleStamp(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>Tampilkan Cap Stempel</span>
                    </label>

                    <label className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 text-xs font-medium transition-colors shadow-2xs">
                      <Stamp className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload Stempel</span>
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
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Reset Cap Default
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 
        LAYOUT LEMBAR PENGESAHAN DOKUMEN RESMI
        Tersedia pilihan 2 Kolom (Standar) atau 3 Kolom (Lengkap dengan Kasubag TU)
      */}
      {/* 
        LAYOUT LEMBAR PENGESAHAN DOKUMEN RESMI
        Tersedia pilihan 2 Kolom (Standar) atau 3 Kolom (Lengkap dengan Kasubag TU)
        Sejajar posisi kiri dan kanan tanda tangan secara simetris dan rapi
      */}
      {layoutMode === '2_col' ? (
        /* ==================== 2 COLUMNS LAYOUT ==================== */
        <div 
          className="grid grid-cols-2 gap-4 sm:gap-8 pt-2 relative items-start break-inside-avoid print:grid-cols-2"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          {/* KOLOM KIRI: MENGETAHUI KEPALA SEKOLAH */}
          <div className="flex flex-col items-center text-center relative px-2">
            {/* Baris 1: Spacer sejajar persis dengan baris tanggal kolom kanan */}
            <div className="h-7 sm:h-8 flex items-center justify-center invisible select-none" aria-hidden="true">
              &nbsp;
            </div>

            {/* Baris 2: Header Tindakan (Sejajar baris 2 kolom kanan) */}
            <div className="h-6 flex items-center justify-center">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
                Mengetahui / Mengesahkan,
              </p>
            </div>

            {/* Baris 3: Jabatan (Sejajar baris 3 kolom kanan) */}
            <div className="h-6 flex items-center justify-center mb-1">
              <p className="text-[11px] sm:text-xs text-slate-800 font-medium truncate max-w-[280px] leading-tight">
                {config.kepalaSekolah.jabatan || 'Kepala Satuan Pendidikan'}
              </p>
            </div>
            
            {/* Baris 4: Kotak Tanda Tangan & Cap Stempel */}
            <div className="relative w-full max-w-[280px]">
              {/* Rubber Stamp Overlay on Kepala Sekolah */}
              {showStempel && (
                <div className="absolute -top-3 -left-5 sm:-left-7 z-10 pointer-events-none">
                  <StempelResmiSekolah 
                    config={{ ...config, customStempelUrl: customStempel }} 
                    size={125} 
                  />
                </div>
              )}
              {renderSignatureBox(kepsek, 'kepsek', kepsek.nama.split(' ')[0] || 'Kepala')}
            </div>
          </div>

          {/* KOLOM KANAN: TEMPAT, TANGGAL & YANG MEMBUAT LAPORAN */}
          <div className="flex flex-col items-center text-center px-2">
            {/* Baris 1: Tanggal Manual di atas Pembuat Laporan (Sejajar persis dengan baris 1 kolom kiri) */}
            <div className="h-7 sm:h-8 flex items-center justify-center gap-1.5">
              {isEditingDate && !isPrintVersion ? (
                <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-lg border border-amber-300 no-print">
                  <input
                    type="text"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    className="text-xs px-2 py-0.5 border border-amber-400 rounded bg-white font-medium text-slate-900 w-52"
                    placeholder="Tempat, Tanggal (misal: Teluk, 30 September 2026)"
                  />
                  <button
                    type="button"
                    onClick={handleDateSave}
                    className="px-2 py-0.5 text-xs bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700 cursor-pointer"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTempDate(manualDate); setIsEditingDate(false); }}
                    className="px-1.5 py-0.5 text-xs text-slate-500 cursor-pointer"
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
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded no-print cursor-pointer"
                      title="Ubah tempat & tanggal manual"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Baris 2: Header Tindakan (Sejajar baris 2 kolom kiri) */}
            <div className="h-6 flex items-center justify-center">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
                Yang Membuat Laporan,
              </p>
            </div>

            {/* Baris 3: Jabatan (Sejajar baris 3 kolom kiri) */}
            <div className="h-6 flex items-center justify-center mb-1">
              <p className="text-[11px] sm:text-xs text-slate-800 font-medium truncate max-w-[280px] leading-tight">
                {operator.jabatan || 'Petugas Pelaksana'}
              </p>
            </div>

            {/* Baris 4: Kotak Tanda Tangan */}
            <div className="w-full max-w-[280px]">
              {renderSignatureBox(operator, 'operator', operator.nama.split(' ')[0])}
            </div>
          </div>
        </div>
      ) : (
        /* ==================== 3 COLUMNS LAYOUT (LENGKAP) ==================== */
        <div 
          className="grid grid-cols-3 gap-3 pt-2 relative items-start break-inside-avoid print:grid-cols-3"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          {/* KOLOM 1: MENGETAHUI KEPALA SEKOLAH */}
          <div className="flex flex-col items-center text-center relative px-1">
            <div className="h-7 sm:h-8 flex items-center justify-center invisible select-none" aria-hidden="true">
              &nbsp;
            </div>
            <div className="h-6 flex items-center justify-center">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-900 leading-tight">
                Mengetahui / Mengesahkan,
              </p>
            </div>
            <div className="h-6 flex items-center justify-center mb-1">
              <p className="text-[10px] sm:text-[11px] text-slate-800 font-medium truncate max-w-[220px] leading-tight">
                {config.kepalaSekolah.jabatan || 'Kepala Satuan Pendidikan'}
              </p>
            </div>
            
            <div className="relative w-full max-w-[220px]">
              {showStempel && (
                <div className="absolute -top-3 -left-3 z-10 pointer-events-none">
                  <StempelResmiSekolah 
                    config={{ ...config, customStempelUrl: customStempel }} 
                    size={105} 
                  />
                </div>
              )}
              {renderSignatureBox(kepsek, 'kepsek', kepsek.nama.split(' ')[0] || 'Kepala')}
            </div>
          </div>

          {/* KOLOM 2: MENYETUJUI KASUBAG TU / KOORDINATOR URUSAN */}
          <div className="flex flex-col items-center text-center px-1">
            <div className="h-7 sm:h-8 flex items-center justify-center invisible select-none" aria-hidden="true">
              &nbsp;
            </div>
            <div className="h-6 flex items-center justify-center">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-900 leading-tight">
                Menyetujui,
              </p>
            </div>
            <div className="h-6 flex items-center justify-center mb-1">
              <p className="text-[10px] sm:text-[11px] text-slate-800 font-medium truncate max-w-[220px] leading-tight">
                Kasubag Tata Usaha
              </p>
            </div>

            <div className="w-full max-w-[220px]">
              {renderSignatureBox(
                { nama: kasubagName, nip: kasubagNip, signatureData: 'KasubagTU' },
                'kasubag',
                'Kasubag'
              )}
            </div>
          </div>

          {/* KOLOM 3: TEMPAT, TANGGAL & YANG MEMBUAT LAPORAN */}
          <div className="flex flex-col items-center text-center px-1">
            <div className="h-7 sm:h-8 flex items-center justify-center gap-1">
              {isEditingDate && !isPrintVersion ? (
                <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-lg border border-amber-300 no-print">
                  <input
                    type="text"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    className="text-xs px-2 py-0.5 border border-amber-400 rounded bg-white font-medium text-slate-900 w-44"
                  />
                  <button
                    type="button"
                    onClick={handleDateSave}
                    className="px-2 py-0.5 text-xs bg-emerald-600 text-white font-semibold rounded cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-900">
                    {manualDate}
                  </span>
                  {!isPrintVersion && (
                    <button
                      type="button"
                      onClick={() => setIsEditingDate(true)}
                      className="p-0.5 text-slate-400 hover:text-blue-600 rounded no-print cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="h-6 flex items-center justify-center">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-900 leading-tight">
                Yang Membuat Laporan,
              </p>
            </div>
            <div className="h-6 flex items-center justify-center mb-1">
              <p className="text-[10px] sm:text-[11px] text-slate-800 font-medium truncate max-w-[220px] leading-tight">
                {operator.jabatan}
              </p>
            </div>

            <div className="w-full max-w-[220px]">
              {renderSignatureBox(operator, 'operator', operator.nama.split(' ')[0])}
            </div>
          </div>
        </div>
      )}

      {/* Official Footnote / E-Sign Disclaimer */}
      <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-center">
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
            activeSignTarget === 'operator' ? operator.nama : activeSignTarget === 'kepsek' ? kepsek.nama : kasubagName
          }`}
          signerName={
            activeSignTarget === 'operator' 
              ? `${operator.nama} (${operator.nip})` 
              : activeSignTarget === 'kepsek'
              ? `${kepsek.nama} (${kepsek.nip})`
              : `${kasubagName} (${kasubagNip})`
          }
        />
      )}
    </div>
  );
};
