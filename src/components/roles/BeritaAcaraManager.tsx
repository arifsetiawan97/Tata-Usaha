import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { KopSurat } from '../common/KopSurat';
import { StempelResmiSekolah } from '../common/OfficialApprovalSheet';
import {
  BERITA_ACARA_TEMPLATES,
  BeritaAcaraTemplateDef
} from '../../data/beritaAcaraTemplates';
import {
  BeritaAcaraSignatory,
  BeritaAcaraTemplateId,
  SavedBeritaAcaraRecord
} from '../../types';
import {
  downloadBeritaAcaraDocx,
  downloadBeritaAcaraHtml,
  downloadBeritaAcaraWord
} from '../../utils/beritaAcaraExport';
import {
  Printer,
  Download,
  FileText,
  Save,
  RotateCcw,
  Trash2,
  FolderClock,
  CheckCircle2,
  ScrollText,
  Boxes,
  Stamp,
  PenTool,
  ChevronRight,
  Calendar,
  Edit3
} from 'lucide-react';

const STORAGE_KEY_BA_HISTORY = 'siops_tu_berita_acara_history';

type CategoryFilter =
  | 'Semua'
  | 'Kesiswaan & Akademik'
  | 'Aset & Sapras'
  | 'Kepegawaian & Rapat'
  | 'Keuangan & Kearsipan';

const CATEGORY_FILTERS: CategoryFilter[] = [
  'Semua',
  'Kesiswaan & Akademik',
  'Aset & Sapras',
  'Kepegawaian & Rapat',
  'Keuangan & Kearsipan'
];

export const BeritaAcaraManager: React.FC = () => {
  const { schoolConfig, inventories } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('Semua');
  const [activeTemplateId, setActiveTemplateId] = useState<BeritaAcaraTemplateId>('kelulusan');
  const [viewMode, setViewMode] = useState<'editor' | 'history'>('editor');

  const activeTemplate: BeritaAcaraTemplateDef = useMemo(
    () => BERITA_ACARA_TEMPLATES.find(t => t.id === activeTemplateId) || BERITA_ACARA_TEMPLATES[0],
    [activeTemplateId]
  );

  // Store form values keyed by templateId so switching tabs never loses user inputs
  const [formValuesByTemplate, setFormValuesByTemplate] = useState<Record<string, Record<string, any>>>(() => {
    const initial: Record<string, Record<string, any>> = {};
    BERITA_ACARA_TEMPLATES.forEach(tpl => {
      initial[tpl.id] = tpl.defaultValues(schoolConfig);
    });
    return initial;
  });

  const [showStamp, setShowStamp] = useState<boolean>(schoolConfig.stempelEnabled ?? true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(false);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEditingApprovalDateInline, setIsEditingApprovalDateInline] = useState<boolean>(false);
  const [tempApprovalDate, setTempApprovalDate] = useState<string>('');

  const [savedHistory, setSavedHistory] = useState<SavedBeritaAcaraRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BA_HISTORY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error('Failed loading Berita Acara history:', err);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BA_HISTORY, JSON.stringify(savedHistory));
    } catch (err) {
      console.error('Failed saving Berita Acara history:', err);
    }
  }, [savedHistory]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const currentValues = useMemo(
    () => formValuesByTemplate[activeTemplate.id] || activeTemplate.defaultValues(schoolConfig),
    [formValuesByTemplate, activeTemplate, schoolConfig]
  );

  const generatedDoc = useMemo(
    () => activeTemplate.buildContent(currentValues, schoolConfig),
    [activeTemplate, currentValues, schoolConfig]
  );

  const effectiveGeneratedDoc = useMemo(() => {
    const customDate = String(currentValues._customApprovalDate || '').trim();
    if (!customDate) return generatedDoc;
    return {
      ...generatedDoc,
      docDateLocation: customDate,
      rightSignatory: {
        ...generatedDoc.rightSignatory,
        dateLine: customDate
      }
    };
  }, [generatedDoc, currentValues._customApprovalDate]);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'Semua') return BERITA_ACARA_TEMPLATES;
    return BERITA_ACARA_TEMPLATES.filter(t => t.category === selectedCategory);
  }, [selectedCategory]);

  const handleFieldChange = (key: string, value: any) => {
    setFormValuesByTemplate(prev => ({
      ...prev,
      [activeTemplate.id]: {
        ...(prev[activeTemplate.id] || activeTemplate.defaultValues(schoolConfig)),
        [key]: value
      }
    }));
  };

  const handleResetTemplateValues = () => {
    setFormValuesByTemplate(prev => ({
      ...prev,
      [activeTemplate.id]: activeTemplate.defaultValues(schoolConfig)
    }));
    showToast(`Formulir "${activeTemplate.shortTitle}" dikembalikan ke nilai standar.`);
  };

  const handlePullTuInventories = () => {
    const tuItems = inventories.filter(item => item.role === 'TU');
    if (tuItems.length === 0) {
      showToast('Belum ada data inventaris pada layanan Tata Usaha.');
      return;
    }
    const formattedLines = tuItems
      .map(
        it =>
          `${it.namaBarang} | ${it.merkModel || it.kodeBarang || '-'} | ${it.jumlah} ${it.satuan} | ${it.kondisi} | ${it.lokasiPenyimpanan || '-'}`
      )
      .join('\n');
    handleFieldChange('daftarBarang', formattedLines);
    showToast(`${tuItems.length} barang inventaris Tata Usaha berhasil dimuat ke daftar BAST.`);
  };

  const buildSafeFilename = (ext: string) => {
    const slug = activeTemplate.id.replace(/[^a-z0-9_]+/gi, '_');
    const datePart = String(currentValues.tanggal || new Date().toISOString().split('T')[0]);
    return `Berita_Acara_${slug}_${datePart}.${ext}`;
  };

  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    try {
      await downloadBeritaAcaraDocx(
        effectiveGeneratedDoc,
        schoolConfig,
        buildSafeFilename('docx'),
        includeSignatures
      );
      showToast('Dokumen .docx berhasil diunduh sesuai format resmi A4.');
    } catch (err) {
      console.error('Error exporting Berita Acara DOCX:', err);
      showToast('Gagal membuat berkas .docx.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadWord = () => {
    downloadBeritaAcaraWord(
      effectiveGeneratedDoc,
      schoolConfig,
      buildSafeFilename('doc'),
      includeSignatures
    );
    showToast('Dokumen .doc berhasil diunduh.');
  };

  const handleDownloadHtml = () => {
    downloadBeritaAcaraHtml(
      effectiveGeneratedDoc,
      schoolConfig,
      buildSafeFilename('html'),
      includeSignatures
    );
    showToast('Dokumen HTML siap cetak berhasil diunduh.');
  };

  const handleSaveToHistory = () => {
    const nowIso = new Date().toISOString();
    const record: SavedBeritaAcaraRecord = {
      id: `ba-${Date.now()}`,
      templateId: activeTemplate.id,
      templateTitle: activeTemplate.shortTitle,
      nomorSurat: effectiveGeneratedDoc.nomorSurat,
      tanggalSurat: String(currentValues.tanggal || nowIso.split('T')[0]),
      ringkasan: effectiveGeneratedDoc.documentSubHeading,
      formValues: { ...currentValues },
      createdAt: nowIso,
      updatedAt: nowIso
    };
    setSavedHistory(prev => [record, ...prev]);
    showToast(`"${activeTemplate.shortTitle}" tersimpan di Riwayat Berita Acara.`);
  };

  const handleLoadFromHistory = (record: SavedBeritaAcaraRecord) => {
    setActiveTemplateId(record.templateId);
    setFormValuesByTemplate(prev => ({
      ...prev,
      [record.templateId]: { ...record.formValues }
    }));
    setViewMode('editor');
    showToast(`Memuat ulang "${record.templateTitle}" (${record.nomorSurat}).`);
  };

  const handleDeleteHistory = (id: string) => {
    setSavedHistory(prev => prev.filter(r => r.id !== id));
    showToast('Riwayat Berita Acara dihapus.');
  };

  const renderPreviewSignatory = (
    sig: BeritaAcaraSignatory,
    withStampOverlay = false,
    allowEditDate = false
  ) => {
    const isPlaceholder = !sig.nama || sig.nama.includes('...');
    return (
      <div className="flex flex-col items-center text-center relative">
        <div className="min-h-[18px] text-[11px] leading-tight text-slate-900">
          {allowEditDate && isEditingApprovalDateInline ? (
            <div className="inline-flex items-center gap-1 bg-amber-50 p-1 rounded-lg border border-amber-300 font-sans no-print">
              <input
                type="text"
                value={tempApprovalDate}
                onChange={(e) => setTempApprovalDate(e.target.value)}
                className="text-[11px] px-2 py-0.5 border border-amber-400 rounded bg-white font-medium text-slate-900 w-48"
                placeholder="Tempat, Tanggal Pengesahan"
              />
              <button
                type="button"
                onClick={() => {
                  handleFieldChange('_customApprovalDate', tempApprovalDate.trim());
                  setIsEditingApprovalDateInline(false);
                }}
                className="px-2 py-0.5 text-[11px] bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700 cursor-pointer"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setIsEditingApprovalDateInline(false)}
                className="px-1.5 py-0.5 text-[11px] text-slate-500 cursor-pointer"
              >
                Batal
              </button>
            </div>
          ) : allowEditDate ? (
            <div className="inline-flex items-center justify-center gap-1">
              <span>{sig.dateLine || '\u00A0'}</span>
              <button
                type="button"
                onClick={() => {
                  setTempApprovalDate(sig.dateLine || effectiveGeneratedDoc.docDateLocation);
                  setIsEditingApprovalDateInline(true);
                }}
                className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded no-print cursor-pointer"
                title="Ubah tempat & tanggal pada lembar pengesahan"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            sig.dateLine || '\u00A0'
          )}
        </div>
        <div className="text-[11.5px] leading-tight text-slate-900 mt-0.5">
          {sig.roleLabel}
        </div>
        <div className="text-[11.5px] font-bold leading-tight text-slate-950">
          {sig.jabatan}
        </div>

        <div className="relative w-full h-20 flex items-center justify-center my-1">
          {withStampOverlay && showStamp && (
            <div className="absolute -top-2 left-2 sm:left-4 z-10 pointer-events-none">
              <StempelResmiSekolah config={schoolConfig} size={105} />
            </div>
          )}
          {includeSignatures && sig.signatureImage && (
            <img
              src={sig.signatureImage}
              alt="Tanda Tangan"
              className="max-h-16 max-w-[160px] object-contain"
            />
          )}
        </div>

        <div className={`text-[11.5px] font-bold text-slate-950 ${isPlaceholder ? '' : 'underline underline-offset-2'}`}>
          {sig.nama}
        </div>
        <div className="text-[10.5px] text-slate-800 mt-0.5 tabular-nums">
          {sig.nip}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Inline Notification */}
      {toastMessage && (
        <div className="no-print flex items-center justify-between gap-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Workspace Header Toolbar (Hidden on Print) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-sky-700 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Pembuat Berita Acara Otomatis Tata Usaha
            </h2>
          </div>
          <p className="text-xs text-slate-600">
            Pilih jenis berita acara dan isi data pokok saja. Kop surat 2 logo, tanggal terbilang baku, tabel, dan pengesahan NIP/PPPK dibuat otomatis sesuai Tata Naskah Dinas.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'editor'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Buat Berita Acara ({BERITA_ACARA_TEMPLATES.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderClock className="w-3.5 h-3.5" />
            <span>Riwayat Tersimpan ({savedHistory.length})</span>
          </button>
        </div>
      </div>

      {viewMode === 'history' ? (
        /* SAVED HISTORY VIEW */
        <div className="no-print bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Arsip Draf Berita Acara Tersimpan
            </h3>
            <span className="text-xs text-slate-500 tabular-nums">
              {savedHistory.length} dokumen
            </span>
          </div>

          {savedHistory.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-300 rounded-lg">
              <ScrollText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Belum ada riwayat Berita Acara yang disimpan
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Buat berita acara pada tab editor lalu tekan tombol Simpan Riwayat agar dapat dicetak ulang kapan saja.
              </p>
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Buka Editor Berita Acara
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                    <th className="py-2.5 px-3 font-semibold">Jenis Berita Acara</th>
                    <th className="py-2.5 px-3 font-semibold">Nomor Surat</th>
                    <th className="py-2.5 px-3 font-semibold">Tanggal</th>
                    <th className="py-2.5 px-3 font-semibold">Perihal / Ringkasan</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {savedHistory.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {rec.templateTitle}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 tabular-nums">
                        {rec.nomorSurat}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 tabular-nums whitespace-nowrap">
                        {rec.tanggalSurat}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                        {rec.ringkasan}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleLoadFromHistory(rec)}
                            className="px-3 py-1 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-md cursor-pointer"
                          >
                            Buka & Cetak
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistory(rec.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-md cursor-pointer"
                            title="Hapus Riwayat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* EDITOR + LIVE 1:1 PREVIEW SPLIT */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: TEMPLATE PICKER & MINIMAL FORM (HIDDEN ON PRINT) */}
          <div className="no-print xl:col-span-5 space-y-4">
            {/* Template Selector Panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">
                  1. Pilih Template Resmi Berita Acara
                </h3>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  {filteredTemplates.length} template
                </span>
              </div>

              {/* Category Filter Bar */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORY_FILTERS.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Template List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredTemplates.map(tpl => {
                  const isActive = tpl.id === activeTemplate.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setActiveTemplateId(tpl.id);
                        setIsEditingApprovalDateInline(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-sky-50 border-sky-600 text-sky-950'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">
                          {tpl.shortTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {tpl.category}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-700' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minimal Input Form Panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    2. Isi Data Pokok: {activeTemplate.shortTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {activeTemplate.description}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {activeTemplate.id === 'bast_barang' && (
                    <button
                      type="button"
                      onClick={handlePullTuInventories}
                      className="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white text-[11px] font-semibold rounded-md flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Boxes className="w-3 h-3" />
                      <span>Ambil Inventaris TU</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetTemplateValues}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-md flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Standar</span>
                  </button>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTemplate.fields.map(field => {
                  const val = currentValues[field.key] ?? '';
                  const colSpanClass = field.halfWidth ? 'sm:col-span-1' : 'sm:col-span-2';
                  return (
                    <div key={field.key} className={`${colSpanClass} space-y-1`}>
                      <label className="block text-[11px] font-semibold text-slate-700">
                        {field.label}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          value={val}
                          onChange={e => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600/30 focus:border-sky-600 text-slate-900 bg-white"
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={val}
                          onChange={e => handleFieldChange(field.key, e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600/30 focus:border-sky-600 text-slate-900 bg-white"
                        >
                          {(field.options || []).map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          value={val}
                          onChange={e =>
                            handleFieldChange(
                              field.key,
                              field.type === 'number' ? (e.target.value === '' ? 0 : Number(e.target.value)) : e.target.value
                            )
                          }
                          placeholder={field.placeholder}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600/30 focus:border-sky-600 text-slate-900 bg-white tabular-nums"
                        />
                      )}
                      {field.helperText && (
                        <p className="text-[10.5px] text-slate-500 leading-snug">
                          {field.helperText}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tempat & Tanggal Lembar Pengesahan Override */}
              <div className="pt-3 border-t border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tempat &amp; Tanggal Lembar Pengesahan (TTD)</span>
                  </label>
                  {String(currentValues._customApprovalDate || '').trim() && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('_customApprovalDate', '')}
                      className="text-[10.5px] font-semibold text-sky-700 hover:underline cursor-pointer"
                    >
                      Gunakan Otomatis
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={currentValues._customApprovalDate ?? ''}
                  onChange={e => handleFieldChange('_customApprovalDate', e.target.value)}
                  placeholder={`Otomatis: ${generatedDoc.rightSignatory.dateLine || generatedDoc.docDateLocation}`}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600/30 focus:border-sky-600 text-slate-900 bg-white"
                />
                <p className="text-[10.5px] text-slate-500 leading-snug">
                  Kosongkan untuk mengikuti tempat sekolah &amp; tanggal berita acara secara otomatis, atau ketik manual khusus baris tempat &amp; tanggal pengesahan.
                </p>
              </div>

              {/* Signature & Stamp Toggles */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-700">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showStamp}
                    onChange={e => setShowStamp(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-sky-700 border-slate-300"
                  />
                  <Stamp className="w-3.5 h-3.5 text-slate-500" />
                  <span>Stempel Sekolah (Cetak)</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSignatures}
                    onChange={e => setIncludeSignatures(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-sky-700 border-slate-300"
                  />
                  <PenTool className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sertakan Scan TTD Tersimpan</span>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTION BAR & LIVE 1:1 PRINTABLE SHEET */}
          <div className="xl:col-span-7 space-y-4">
            {/* Export & Print Toolbar (Hidden on Print) */}
            <div className="no-print bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Pratinjau Dokumen Sah Siap Cetak & Unduh (A4)
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveToHistory}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Riwayat</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadWord}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Unduh (.doc)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  disabled={isExportingDocx}
                  className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isExportingDocx ? 'Menyiapkan...' : 'Unduh (.docx)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh HTML</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Langsung</span>
                </button>
              </div>
            </div>

            {/* LIVE 1:1 OFFICIAL A4 PAPER SHEET */}
            <div className="print-page-container">
              <div
                id="berita-acara-print-sheet"
                className="print-page print-continuous bg-white border border-slate-300 rounded-xl p-6 sm:p-10 text-slate-950 font-serif shadow-xs print:border-none print:rounded-none print:shadow-none print:p-0"
              >
                {/* 1. Kop Surat Resmi Sekolah dengan Logo Kiri & Kanan */}
                <KopSurat config={schoolConfig} isPrintVersion={true} className="mb-3" />

                {/* 2. Judul Dokumen */}
                <div className="text-center my-4 space-y-1">
                  <h3 className="text-base sm:text-lg font-bold underline underline-offset-4 tracking-wide">
                    {effectiveGeneratedDoc.documentHeading}
                  </h3>
                  <h4 className="text-xs sm:text-sm font-bold tracking-wide">
                    {effectiveGeneratedDoc.documentSubHeading}
                  </h4>
                  <p className="text-xs font-medium tabular-nums">
                    Nomor: {effectiveGeneratedDoc.nomorSurat}
                  </p>
                </div>

                {/* 3. Paragraf Pembuka Baku */}
                <p className="text-xs sm:text-[13px] leading-relaxed text-justify indent-8 mb-3">
                  {effectiveGeneratedDoc.openingParagraph}
                </p>

                {/* 4. Dasar / Konsiderans */}
                {effectiveGeneratedDoc.basisParagraphs.map((p, idx) => (
                  <p key={idx} className="text-xs sm:text-[13px] leading-relaxed text-justify indent-8 mb-3">
                    {p}
                  </p>
                ))}

                {/* 5. Identitas Para Pihak (khusus BAST & Sertijab) */}
                {effectiveGeneratedDoc.partyBoxes && effectiveGeneratedDoc.partyBoxes.length > 0 && (
                  <div className="space-y-3 my-3">
                    {effectiveGeneratedDoc.partyBoxes.map((party, pIdx) => (
                      <div key={pIdx} className="text-xs sm:text-[13px]">
                        <div className="font-bold mb-1">
                          {pIdx + 1}. {party.partyTitle}
                        </div>
                        <table className="w-full ml-4 text-xs">
                          <tbody>
                            <tr>
                              <td className="w-36 py-0.5">Nama Lengkap</td>
                              <td className="w-3 py-0.5">:</td>
                              <td className="font-bold py-0.5">{party.nama}</td>
                            </tr>
                            <tr>
                              <td className="py-0.5">NIP / PPPK</td>
                              <td className="py-0.5">:</td>
                              <td className="py-0.5 tabular-nums">{party.nip}</td>
                            </tr>
                            <tr>
                              <td className="py-0.5">Jabatan</td>
                              <td className="py-0.5">:</td>
                              <td className="py-0.5">{party.jabatan}</td>
                            </tr>
                            {party.unit && (
                              <tr>
                                <td className="py-0.5">Unit Kerja</td>
                                <td className="py-0.5">:</td>
                                <td className="py-0.5">{party.unit}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. Paragraf Isi */}
                {effectiveGeneratedDoc.bodyParagraphs.map((p, idx) => (
                  <p key={idx} className="text-xs sm:text-[13px] leading-relaxed text-justify indent-8 my-3">
                    {p}
                  </p>
                ))}

                {/* 7. Tabel Rekapitulasi / Daftar Item */}
                {effectiveGeneratedDoc.tables.map((tbl, tIdx) => (
                  <div key={tIdx} className="my-4">
                    <div className="text-xs font-bold mb-1.5 text-slate-950">
                      {tbl.title}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-700 text-[11px] font-sans">
                        <thead>
                          <tr className="bg-slate-100 text-slate-950">
                            {tbl.columns.map((col, cIdx) => (
                              <th
                                key={cIdx}
                                style={col.widthPercent ? { width: `${col.widthPercent}%` } : undefined}
                                className={`border border-slate-700 py-1.5 px-2 font-bold ${
                                  col.align === 'right'
                                    ? 'text-right'
                                    : col.align === 'left'
                                    ? 'text-left'
                                    : 'text-center'
                                }`}
                              >
                                {col.header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tbl.rows.map((rowVals, rIdx) => (
                            <tr key={rIdx}>
                              {tbl.columns.map((col, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`border border-slate-700 py-1.5 px-2 tabular-nums ${
                                    col.align === 'right'
                                      ? 'text-right'
                                      : col.align === 'center'
                                      ? 'text-center'
                                      : 'text-left'
                                  }`}
                                >
                                  {rowVals[cIdx] ?? '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                        {tbl.footerRow && (
                          <tfoot>
                            <tr className="bg-slate-200 font-bold text-slate-950">
                              {tbl.columns.map((col, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`border border-slate-700 py-1.5 px-2 tabular-nums ${
                                    col.align === 'right'
                                      ? 'text-right'
                                      : col.align === 'center'
                                      ? 'text-center'
                                      : 'text-left'
                                  }`}
                                >
                                  {tbl.footerRow![cIdx] ?? ''}
                                </td>
                              ))}
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                ))}

                {/* 8. Detail Pairs / Catatan Tambahan */}
                {effectiveGeneratedDoc.detailPairs && effectiveGeneratedDoc.detailPairs.length > 0 && (
                  <div className="my-3 text-xs sm:text-[13px]">
                    {effectiveGeneratedDoc.detailSectionTitle && (
                      <div className="font-bold mb-1">
                        {effectiveGeneratedDoc.detailSectionTitle}
                      </div>
                    )}
                    <table className="w-full text-xs">
                      <tbody>
                        {effectiveGeneratedDoc.detailPairs.map((pair, idx) => (
                          <tr key={idx}>
                            <td className="w-40 py-0.5 font-semibold align-top">{pair.label}</td>
                            <td className="w-3 py-0.5 align-top">:</td>
                            <td className="py-0.5 text-justify align-top">{pair.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 9. Paragraf Penutup Baku */}
                <p className="text-xs sm:text-[13px] leading-relaxed text-justify indent-8 mt-4 mb-6">
                  {effectiveGeneratedDoc.closingParagraph}
                </p>

                {/* 10. Blok Tanda Tangan Pengesahan */}
                <div className="grid grid-cols-2 gap-6 pt-2 break-inside-avoid">
                  {renderPreviewSignatory(
                    effectiveGeneratedDoc.leftSignatory,
                    effectiveGeneratedDoc.signatoryLayout === 'two_col',
                    false
                  )}
                  {renderPreviewSignatory(effectiveGeneratedDoc.rightSignatory, false, true)}
                </div>

                {effectiveGeneratedDoc.signatoryLayout === 'two_col_plus_kepsek' &&
                  effectiveGeneratedDoc.centerBottomSignatory && (
                    <div className="mt-5 flex justify-center break-inside-avoid">
                      <div className="w-72">
                        {renderPreviewSignatory(effectiveGeneratedDoc.centerBottomSignatory, true, false)}
                      </div>
                    </div>
                  )}

                {/* Saksi-Saksi */}
                {effectiveGeneratedDoc.witnesses && effectiveGeneratedDoc.witnesses.length > 0 && (
                  <div className="mt-5 break-inside-avoid">
                    <div className="text-xs font-bold mb-1.5">Saksi-Saksi:</div>
                    <table className="w-full border-collapse border border-slate-700 text-[11px] font-sans">
                      <tbody>
                        {effectiveGeneratedDoc.witnesses.map((w, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-700 py-1.5 px-2.5 w-[45%]">
                              {idx + 1}. {w.nama}
                            </td>
                            <td className="border border-slate-700 py-1.5 px-2.5 w-[25%]">
                              {w.jabatan}
                            </td>
                            <td className="border border-slate-700 py-1.5 px-2.5 text-center">
                              ( .......................... )
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
