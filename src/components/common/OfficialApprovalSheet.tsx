import React, { useState, useEffect } from 'react';
import { SchoolConfig, RoleType } from '../../types';
import { initialSchoolConfig } from '../../data/initialData';
import { formatOfficialNameWithDegree, formatOfficialNipOrPppk } from '../../utils/formatters';
import { 
  Edit3, 
  Sliders,
  Users,
  Check
} from 'lucide-react';

export type SignatureStyleMode = 'manual';
export type ApprovalLayoutMode =
  | '2_col'
  | '2_col_wakasek'
  | '3_col_wakasek'
  | '3_col'
  | '4_col_hierarchy';

interface OfficialApprovalSheetProps {
  config: SchoolConfig;
  role: RoleType;
  manualDate: string;
  onDateChange?: (newDate: string) => void;
  className?: string;
  isPrintVersion?: boolean;
}

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

  useEffect(() => {
    setTempDate(manualDate);
  }, [manualDate]);

  // Gaya tanda tangan khusus Tanda Tangan Basah
  const signatureMode: SignatureStyleMode = 'manual';

  // Approval layout mode (strictly highest rank Left -> lowest rank Right / next row)
  const [layoutMode, setLayoutMode] = useState<ApprovalLayoutMode>(() => {
    try {
      const saved = localStorage.getItem('siops_signature_layout');
      if (saved && ['2_col', '2_col_wakasek', '3_col_wakasek', '3_col', '4_col_hierarchy'].includes(saved)) {
        return saved as ApprovalLayoutMode;
      }
    } catch (e) {
      console.error(e);
    }
    return '2_col';
  });

  // Toolbar open / collapse state on screen
  const [showOptionsToolbar, setShowOptionsToolbar] = useState(true);

  const operator = config.operatorProfiles?.[role] || initialSchoolConfig.operatorProfiles[role] || {
    nama: 'Petugas Layanan Operasional',
    nip: '-',
    jabatan: 'Operator'
  };
  const kepsek = config.kepalaSekolah || initialSchoolConfig.kepalaSekolah;
  const wakasek = config.wakilKepalaSekolah || {
    nama: '',
    nip: '',
    jabatan: 'Wakil Kepala Sekolah',
    signatureType: 'script' as const,
    signatureData: ''
  };
  // Kasubag TU / Koordinator Urusan data fallback
  const kasubagName = config.operatorProfiles?.['TU']?.nama || initialSchoolConfig.operatorProfiles['TU']?.nama || 'Koordinator Urusan Tata Usaha';
  const kasubagNip = config.operatorProfiles?.['TU']?.nip || initialSchoolConfig.operatorProfiles['TU']?.nip || '19820512 200801 1 008';

  const handleLayoutChange = (layout: ApprovalLayoutMode) => {
    setLayoutMode(layout);
    try {
      localStorage.setItem('siops_signature_layout', layout);
    } catch (e) {}
  };

  const handleDateSave = () => {
    if (onDateChange) {
      onDateChange(tempDate);
    }
    setIsEditingDate(false);
  };

  // Render signature box content (Tanda Tangan Basah)
  const renderSignatureBox = (
    officer: { nama: string; nip: string; signatureData?: string },
    targetKey: 'operator' | 'kepsek' | 'wakasek' | 'kasubag'
  ) => {
    const isDummy = !officer.nama || 
      /rahmat(\s*hidayat)?/i.test(officer.nama) || 
      /nurul(\s*hidayat|\s*hidayati)?/i.test(officer.nama) || 
      officer.nama.trim() === '';
    
    const displayName = isDummy 
      ? '( .................................................. )' 
      : formatOfficialNameWithDegree(officer.nama);

    const isDummyNip = !officer.nip || /19740510\s*199802\s*1\s*003/.test(officer.nip) || /19920815\s*202321\s*2\s*024/.test(officer.nip);
    const defaultNipPrefix = targetKey === 'kepsek' || targetKey === 'wakasek' ? 'NIP' : 'NIPPK';
    const formattedNip = isDummy || isDummyNip
      ? formatOfficialNipOrPppk('', { defaultPrefix: defaultNipPrefix, placeholderDots: true })
      : formatOfficialNipOrPppk(officer.nip, { defaultPrefix: defaultNipPrefix, placeholderDots: true });

    return (
      <div className="flex flex-col items-center w-full relative">
        {/* Clean physical signature space with fixed height so every column aligns symmetrically */}
        <div className="w-full h-24 sm:h-28 flex items-center justify-center relative my-1">
          <div className="w-full h-full flex flex-col items-center justify-center">
            {!isPrintVersion && (
              <div className="text-[10px] text-slate-400 font-mono italic select-none no-print">
                (Ruang Tanda Tangan Basah)
              </div>
            )}
          </div>
        </div>

        {/* Officer Name & NIP with strict equal row heights for 100% horizontal alignment */}
        <div className="text-center w-full mt-2">
          <div className="h-6 flex items-center justify-center">
            <p className={`font-bold text-xs sm:text-sm text-slate-950 tracking-wide truncate max-w-[280px] ${isDummy ? '' : 'underline decoration-1 underline-offset-2'}`}>
              {displayName}
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

  const renderDateHeaderOrSpacer = (showDate: boolean, compact = false) => {
    if (!showDate) {
      return (
        <div className="h-7 sm:h-8 flex items-center justify-center invisible select-none" aria-hidden="true">
          &nbsp;
        </div>
      );
    }

    return (
      <div className="h-7 sm:h-8 flex items-center justify-center gap-1.5">
        {isEditingDate && !isPrintVersion ? (
          <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-lg border border-amber-300 no-print">
            <input
              type="text"
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              className={`text-xs px-2 py-0.5 border border-amber-400 rounded bg-white font-medium text-slate-900 ${compact ? 'w-44' : 'w-52'}`}
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
            <span className={`${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'} font-medium text-slate-900`}>
              {manualDate}
            </span>
            {!isPrintVersion && (
              <button
                type="button"
                onClick={() => setIsEditingDate(true)}
                className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded no-print cursor-pointer"
                title="Ubah tempat & tanggal manual"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  interface ColumnDef {
    showDate?: boolean;
    actionLabel: string;
    jabatanLabel: string;
    officer: { nama: string; nip: string; signatureData?: string };
    targetKey: 'operator' | 'kepsek' | 'wakasek' | 'kasubag';
  }

  const renderSignatureColumn = (col: ColumnDef, compact = false) => {
    const maxWClass = compact ? 'max-w-[220px]' : 'max-w-[280px]';
    return (
      <div className={`flex flex-col items-center text-center relative ${compact ? 'px-1' : 'px-2'}`}>
        {renderDateHeaderOrSpacer(Boolean(col.showDate), compact)}
        <div className="h-6 flex items-center justify-center">
          <p className={`${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'} font-semibold text-slate-900 leading-tight`}>
            {col.actionLabel}
          </p>
        </div>
        <div className="h-6 flex items-center justify-center mb-1">
          <p className={`${compact ? 'text-[10px] sm:text-[11px]' : 'text-[11px] sm:text-xs'} text-slate-800 font-medium truncate ${maxWClass} leading-tight`}>
            {col.jabatanLabel}
          </p>
        </div>
        <div className={`relative w-full ${maxWClass}`}>
          {renderSignatureBox(col.officer, col.targetKey)}
        </div>
      </div>
    );
  };

  const colKepsek: ColumnDef = {
    actionLabel: 'Mengetahui / Mengesahkan,',
    jabatanLabel: config.kepalaSekolah.jabatan || 'Kepala Satuan Pendidikan',
    officer: kepsek,
    targetKey: 'kepsek'
  };
  const colWakasek: ColumnDef = {
    actionLabel: 'Wakil Kepala Sekolah,',
    jabatanLabel: wakasek.jabatan || 'Wakil Kepala Sekolah',
    officer: wakasek,
    targetKey: 'wakasek'
  };
  const colKasubag: ColumnDef = {
    actionLabel: 'Menyetujui,',
    jabatanLabel: 'Kasubag Tata Usaha',
    officer: { nama: kasubagName, nip: kasubagNip, signatureData: 'KasubagTU' },
    targetKey: 'kasubag'
  };
  const colOperator: ColumnDef = {
    actionLabel: 'Yang Membuat Laporan,',
    jabatanLabel: operator.jabatan || 'Petugas Pelaksana',
    officer: operator,
    targetKey: 'operator'
  };

  return (
    <div 
      className={`w-full mt-4 text-slate-900 break-inside-avoid ${className}`}
      style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
    >
      {/* TOOLBAR PILIHAN TAMPILAN TANDA TANGAN & URUTAN BERJENJANG (SCREEN ONLY) */}
      {!isPrintVersion && (
        <div className="bg-slate-50 border border-slate-300/80 rounded-xl p-3 mb-4 shadow-2xs no-print text-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  Pilihan Urutan Tanda Tangan Resmi (Tertinggi → Terendah)
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                    Resmi Kedinasan
                  </span>
                </h4>
                <p className="text-[10.5px] text-slate-500">
                  Pejabat tertinggi otomatis berada di posisi Kiri, lalu berurut ke Kanan hingga jabatan terendah.
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
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    1. Mode Tanda Tangan:
                  </label>
                  <div className="p-2 rounded-lg border bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs text-left flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        📝 Tanda Tangan Basah
                      </span>
                      {signatureMode === 'manual' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Ruang kosong bersih untuk penandatanganan fisik menggunakan pena
                    </p>
                  </div>
                </div>

                {/* Opsi Susunan Berjenjang */}
                <div className="md:col-span-8">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    2. Urutan Penandatangan (Tertinggi Kiri → Terendah Kanan):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleLayoutChange('2_col')}
                      className={`py-2 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        layoutMode === '2_col'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Users className="w-3 h-3 shrink-0" />
                      <span>Kepsek (Kiri) → Petugas (Kanan)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLayoutChange('2_col_wakasek')}
                      className={`py-2 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        layoutMode === '2_col_wakasek'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Users className="w-3 h-3 shrink-0" />
                      <span>Kepsek (Kiri) → Wakasek (Kanan)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLayoutChange('3_col_wakasek')}
                      className={`py-2 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        layoutMode === '3_col_wakasek'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Users className="w-3 h-3 shrink-0" />
                      <span>Kepsek → Wakasek → Petugas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLayoutChange('3_col')}
                      className={`py-2 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        layoutMode === '3_col'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Users className="w-3 h-3 shrink-0" />
                      <span>Kepsek → Kasubag TU → Petugas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLayoutChange('4_col_hierarchy')}
                      className={`py-2 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors sm:col-span-2 lg:col-span-2 ${
                        layoutMode === '4_col_hierarchy'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Users className="w-3 h-3 shrink-0" />
                      <span>Lengkap Berjenjang (Kepsek → Wakasek → Kasubag TU → Petugas)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LAYOUT LEMBAR PENGESAHAN DOKUMEN RESMI (TERTINGGI -> TERENDAH) */}
      {layoutMode === '2_col' && (
        <div
          className="grid grid-cols-2 gap-4 sm:gap-8 pt-2 relative items-start break-inside-avoid print:grid-cols-2"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          {renderSignatureColumn(colKepsek)}
          {renderSignatureColumn({ ...colOperator, showDate: true })}
        </div>
      )}

      {layoutMode === '2_col_wakasek' && (
        <div
          className="grid grid-cols-2 gap-4 sm:gap-8 pt-2 relative items-start break-inside-avoid print:grid-cols-2"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          {renderSignatureColumn(colKepsek)}
          {renderSignatureColumn({ ...colWakasek, showDate: true })}
        </div>
      )}

      {layoutMode === '3_col_wakasek' && (
        <div
          className="grid grid-cols-3 gap-3 pt-2 relative items-start break-inside-avoid print:grid-cols-3"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          {renderSignatureColumn(colKepsek, true)}
          {renderSignatureColumn(colWakasek, true)}
          {renderSignatureColumn({ ...colOperator, showDate: true }, true)}
        </div>
      )}

      {layoutMode === '3_col' && (
        <div
          className="grid grid-cols-3 gap-3 pt-2 relative items-start break-inside-avoid print:grid-cols-3"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          {renderSignatureColumn(colKepsek, true)}
          {renderSignatureColumn(colKasubag, true)}
          {renderSignatureColumn({ ...colOperator, showDate: true }, true)}
        </div>
      )}

      {layoutMode === '4_col_hierarchy' && (
        <div className="space-y-5 pt-2">
          <div
            className="grid grid-cols-2 gap-4 sm:gap-8 relative items-start break-inside-avoid print:grid-cols-2"
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            {renderSignatureColumn(colKepsek)}
            {renderSignatureColumn({ ...colWakasek, showDate: true })}
          </div>
          <div
            className="grid grid-cols-2 gap-4 sm:gap-8 relative items-start break-inside-avoid print:grid-cols-2"
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            {renderSignatureColumn(colKasubag)}
            {renderSignatureColumn(colOperator)}
          </div>
        </div>
      )}

      {/* Official Footnote */}
      <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-center">
        <p className="text-[9.5px] text-slate-500 italic">
          Dokumen ini merupakan laporan kedinasan resmi UPT Satuan Pendidikan yang diverifikasi dan disahkan sesuai dengan Pedoman Tata Naskah Dinas Satuan Pendidikan.
        </p>
      </div>
    </div>
  );
};

