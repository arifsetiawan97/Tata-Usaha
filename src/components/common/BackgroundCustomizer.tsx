import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  Image as ImageIcon,
  Link2,
  Loader2,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { BackgroundConfig, BackgroundMode } from '../../types';
import {
  BackgroundPresetOption,
  compressImageFileToDataUrl,
  isSafeBackgroundImageUrl,
  MAIN_BACKGROUND_PRESETS,
  resolveBackgroundPresentation,
  SERVICE_BACKGROUND_PRESETS
} from '../../utils/backgroundHelper';

interface BackgroundCustomizerPanelProps {
  variant: 'main' | 'service';
  theme?: 'dark' | 'light';
  initialConfig?: BackgroundConfig | null;
  title?: string;
  subtitle?: string;
  previewHeadline?: string;
  previewSubline?: string;
  isSaving?: boolean;
  onSave: (config: BackgroundConfig) => Promise<void> | void;
  onReset: () => Promise<void> | void;
  onCancel?: () => void;
}

export const BackgroundCustomizerPanel: React.FC<BackgroundCustomizerPanelProps> = ({
  variant,
  theme = 'dark',
  initialConfig,
  title,
  subtitle,
  previewHeadline = 'SI-OPS Layanan Operasional',
  previewSubline = 'Pratinjau tampilan latar belakang & kontras teks',
  isSaving = false,
  onSave,
  onReset,
  onCancel
}) => {
  const presets: BackgroundPresetOption[] =
    variant === 'main' ? MAIN_BACKGROUND_PRESETS : SERVICE_BACKGROUND_PRESETS;
  const defaultOpacity = variant === 'main' ? 0.55 : 0.72;

  const normalizeInitialMode = (cfg?: BackgroundConfig | null): BackgroundMode => {
    if (!cfg || cfg.deleted || cfg.mode === 'default') return 'preset';
    return cfg.mode;
  };

  const [activeTab, setActiveTab] = useState<'preset' | 'image' | 'color' | 'url'>(() => {
    const mode = normalizeInitialMode(initialConfig);
    if (mode === 'image') {
      return initialConfig?.imageUrl?.startsWith('http') ? 'url' : 'image';
    }
    if (mode === 'color') return 'color';
    return 'preset';
  });

  const [presetId, setPresetId] = useState<string>(initialConfig?.presetId || 'default');
  const [imageUrl, setImageUrl] = useState<string>(initialConfig?.imageUrl || '');
  const [urlInput, setUrlInput] = useState<string>(
    initialConfig?.imageUrl?.startsWith('http') ? initialConfig.imageUrl : ''
  );
  const [customColor, setCustomColor] = useState<string>(
    initialConfig?.customColor || (variant === 'main' ? '#0f172a' : '#e0f2fe')
  );
  const [customColorSecondary, setCustomColorSecondary] = useState<string>(
    initialConfig?.customColorSecondary || (variant === 'main' ? '#1e3a8a' : '#f8fafc')
  );
  const [useGradientColor, setUseGradientColor] = useState<boolean>(
    Boolean(initialConfig?.customColorSecondary)
  );
  const [overlayOpacity, setOverlayOpacity] = useState<number>(
    typeof initialConfig?.overlayOpacity === 'number' ? initialConfig.overlayOpacity : defaultOpacity
  );
  const [blurPx, setBlurPx] = useState<number>(
    typeof initialConfig?.blurPx === 'number' ? initialConfig.blurPx : 0
  );
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mode = normalizeInitialMode(initialConfig);
    if (mode === 'image') {
      setActiveTab(initialConfig?.imageUrl?.startsWith('http') ? 'url' : 'image');
    } else if (mode === 'color') {
      setActiveTab('color');
    } else {
      setActiveTab('preset');
    }
    setPresetId(initialConfig?.presetId || 'default');
    setImageUrl(initialConfig?.imageUrl || '');
    setUrlInput(initialConfig?.imageUrl?.startsWith('http') ? initialConfig.imageUrl : '');
    setCustomColor(initialConfig?.customColor || (variant === 'main' ? '#0f172a' : '#e0f2fe'));
    setCustomColorSecondary(
      initialConfig?.customColorSecondary || (variant === 'main' ? '#1e3a8a' : '#f8fafc')
    );
    setUseGradientColor(Boolean(initialConfig?.customColorSecondary));
    setOverlayOpacity(
      typeof initialConfig?.overlayOpacity === 'number' ? initialConfig.overlayOpacity : defaultOpacity
    );
    setBlurPx(typeof initialConfig?.blurPx === 'number' ? initialConfig.blurPx : 0);
    setLocalError(null);
  }, [initialConfig, variant, defaultOpacity]);

  const draftConfig: BackgroundConfig = React.useMemo(() => {
    if (activeTab === 'image' || activeTab === 'url') {
      const targetUrl = activeTab === 'url' ? urlInput.trim() : imageUrl.trim();
      return {
        mode: 'image',
        presetId,
        imageUrl: targetUrl,
        customColor,
        customColorSecondary: useGradientColor ? customColorSecondary : '',
        overlayOpacity,
        blurPx
      };
    }
    if (activeTab === 'color') {
      return {
        mode: 'color',
        presetId,
        customColor,
        customColorSecondary: useGradientColor ? customColorSecondary : '',
        overlayOpacity,
        blurPx: 0
      };
    }
    return {
      mode: presetId === 'default' ? 'default' : 'preset',
      presetId,
      customColor,
      overlayOpacity,
      blurPx: 0
    };
  }, [activeTab, presetId, imageUrl, urlInput, customColor, customColorSecondary, useGradientColor, overlayOpacity, blurPx]);

  const previewPresentation = resolveBackgroundPresentation(draftConfig, presets, variant);

  const isDarkUi = theme === 'dark';
  const cardSurface = isDarkUi
    ? 'bg-slate-800/40 border-slate-700/80 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';
  const mutedText = isDarkUi ? 'text-slate-400' : 'text-slate-500';
  const tabBarClass = isDarkUi ? 'bg-slate-900/80 border-slate-700/80' : 'bg-slate-100 border-slate-200';
  const activeTabClass = isDarkUi
    ? 'bg-sky-600 text-white shadow-xs'
    : 'bg-white text-slate-900 shadow-xs border border-slate-200';
  const inactiveTabClass = isDarkUi
    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60';
  const inputClass = isDarkUi
    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400';

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLocalError(null);
    setIsProcessingImage(true);
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setImageUrl(compressed);
      setActiveTab('image');
    } catch (err: any) {
      setLocalError(err?.message || 'Gagal memproses berkas foto.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleApplySave = async () => {
    if (isSaving || isProcessingImage) return;
    setLocalError(null);
    if (draftConfig.mode === 'image') {
      if (!draftConfig.imageUrl || !isSafeBackgroundImageUrl(draftConfig.imageUrl)) {
        setLocalError(
          activeTab === 'url'
            ? 'Masukkan tautan URL gambar https:// yang valid terlebih dahulu.'
            : 'Unggah foto PNG, JPG, WEBP, atau GIF terlebih dahulu sebelum menyimpan.'
        );
        return;
      }
    }
    await onSave(draftConfig);
  };

  return (
    <div className={`p-4 rounded-xl border space-y-4 ${cardSurface}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ImageIcon className={`w-4 h-4 ${isDarkUi ? 'text-sky-400' : 'text-sky-600'}`} />
          <div>
            <h3 className={`text-sm font-bold ${isDarkUi ? 'text-white' : 'text-slate-900'}`}>
              {title || (variant === 'main' ? 'Pengaturan Background Menu Utama' : 'Pengaturan Background Layanan')}
            </h3>
            <p className={`text-[11px] ${mutedText}`}>
              {subtitle ||
                (variant === 'main'
                  ? 'Pilih tema bawaan, unggah foto sekolah, atau atur warna latar halaman pembuka.'
                  : 'Sesuaikan tampilan latar belakang ruang kerja layanan Anda secara pribadi.')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => !isSaving && onReset()}
          disabled={isSaving || isProcessingImage}
          className={`px-2.5 py-1.5 text-[11px] font-semibold border rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
            isDarkUi
              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Standar</span>
        </button>
      </div>

      {/* Live Preview Window */}
      <div className="relative rounded-xl overflow-hidden border border-slate-700/40 h-32 sm:h-36">
        <div
          className="absolute inset-0 transition-all duration-200"
          style={previewPresentation.layerStyle}
        />
        <div
          className="absolute inset-0 transition-all duration-200"
          style={previewPresentation.overlayStyle}
        />
        <div className="relative z-10 h-full p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                variant === 'main'
                  ? 'bg-slate-900/70 text-sky-300 border border-sky-400/30'
                  : 'bg-white/85 text-slate-800 border border-slate-200'
              }`}
            >
              Pratinjau Langsung
            </span>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                variant === 'main'
                  ? 'bg-slate-900/60 text-slate-300'
                  : 'bg-white/80 text-slate-600'
              }`}
            >
              {draftConfig.mode === 'image'
                ? 'Foto / Gambar Kustom'
                : draftConfig.mode === 'color'
                ? 'Warna Kustom'
                : presets.find(p => p.id === presetId)?.label || 'Standar'}
            </span>
          </div>

          <div
            className={`p-2.5 rounded-lg border max-w-md ${
              variant === 'main'
                ? 'bg-slate-900/65 border-white/15 text-white backdrop-blur-xs'
                : 'bg-white/90 border-slate-200 text-slate-900 backdrop-blur-xs shadow-xs'
            }`}
          >
            <p className="text-xs font-extrabold truncate">{previewHeadline}</p>
            <p
              className={`text-[10px] truncate mt-0.5 ${
                variant === 'main' ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {previewSubline}
            </p>
          </div>
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl border ${tabBarClass}`}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('preset');
            setLocalError(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'preset' ? activeTabClass : inactiveTabClass
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tema Pilihan</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('image');
            setLocalError(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'image' ? activeTabClass : inactiveTabClass
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Foto</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('color');
            setLocalError(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'color' ? activeTabClass : inactiveTabClass
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Warna / Gradien</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('url');
            setLocalError(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'url' ? activeTabClass : inactiveTabClass
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Tautan URL</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'preset' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {presets.map(preset => {
            const isSelected = presetId === preset.id;
            const isGrid = preset.id === 'architectural_grid' || preset.id === 'subtle_blueprint';
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setPresetId(preset.id)}
                className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? isDarkUi
                      ? 'border-sky-400 bg-sky-500/15 ring-1 ring-sky-400/50'
                      : 'border-sky-600 bg-sky-50 ring-1 ring-sky-500/30'
                    : isDarkUi
                    ? 'border-slate-700/80 bg-slate-900/50 hover:border-slate-500'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div
                  className="w-11 h-11 rounded-lg border border-slate-500/30 shrink-0 flex items-center justify-center"
                  style={{
                    backgroundImage: preset.backgroundCss,
                    ...(isGrid ? { backgroundSize: '16px 16px, 16px 16px, 100% 100%' } : {})
                  }}
                >
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${isDarkUi ? 'text-white' : 'text-slate-900'}`}>
                    {preset.label}
                  </p>
                  <p className={`text-[10px] leading-snug line-clamp-2 ${mutedText}`}>
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'image' && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileSelected}
            className="hidden"
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingImage || isSaving}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {isProcessingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{isProcessingImage ? 'Memproses Foto...' : 'Pilih & Upload Foto (PNG/JPG/WEBP)'}</span>
            </button>

            {imageUrl && (
              <button
                type="button"
                onClick={() => {
                  setImageUrl('');
                  setUrlInput('');
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  isDarkUi
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                    : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Foto</span>
              </button>
            )}
          </div>
          <p className={`text-[11px] ${mutedText}`}>
            Foto akan otomatis disesuaikan ukurannya agar cepat dimuat dan nyaman di layar (maksimal 15 MB sebelum kompresi).
          </p>
        </div>
      )}

      {activeTab === 'color' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>Warna Utama</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={e => setCustomColor(e.target.value)}
                className="w-10 h-9 rounded-lg border border-slate-500/40 cursor-pointer bg-transparent p-0.5"
              />
              <input
                type="text"
                value={customColor}
                onChange={e => setCustomColor(e.target.value)}
                maxLength={7}
                className={`flex-1 px-2.5 py-2 text-xs font-mono rounded-lg border ${inputClass}`}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[11px] font-semibold mb-1 cursor-pointer">
              <input
                type="checkbox"
                checked={useGradientColor}
                onChange={e => setUseGradientColor(e.target.checked)}
                className="rounded"
              />
              <span className={mutedText}>Aktifkan Gradien 2 Warna</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                disabled={!useGradientColor}
                value={customColorSecondary}
                onChange={e => setCustomColorSecondary(e.target.value)}
                className="w-10 h-9 rounded-lg border border-slate-500/40 cursor-pointer disabled:opacity-40 bg-transparent p-0.5"
              />
              <input
                type="text"
                disabled={!useGradientColor}
                value={customColorSecondary}
                onChange={e => setCustomColorSecondary(e.target.value)}
                maxLength={7}
                className={`flex-1 px-2.5 py-2 text-xs font-mono rounded-lg border disabled:opacity-40 ${inputClass}`}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Navy', c1: '#0f172a', c2: '#1e3a8a' },
              { label: 'Hijau', c1: '#064e3b', c2: '#0f766e' },
              { label: 'Langit', c1: '#e0f2fe', c2: '#f0f9ff' },
              { label: 'Hangat', c1: '#fef3c7', c2: '#fffbeb' }
            ].map(swatch => (
              <button
                key={swatch.label}
                type="button"
                onClick={() => {
                  setCustomColor(swatch.c1);
                  setCustomColorSecondary(swatch.c2);
                  setUseGradientColor(true);
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                  isDarkUi
                    ? 'border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {swatch.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'url' && (
        <div className="space-y-2">
          <label className={`block text-[11px] font-semibold ${mutedText}`}>
            Alamat URL Gambar (https://...)
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://contoh-domain.sch.id/foto-sekolah.jpg"
            className={`w-full px-3 py-2 text-xs rounded-lg border ${inputClass}`}
          />
          <p className={`text-[10px] ${mutedText}`}>
            Pastikan tautan gambar dapat diakses publik (berawalan https:// atau http://).
          </p>
        </div>
      )}

      {/* Readability Sliders for Image / Color */}
      {(activeTab === 'image' || activeTab === 'url' || activeTab === 'color') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className={mutedText}>
                {variant === 'main' ? 'Kegelapan Lapisan Pelindung Teks' : 'Transparansi Lapisan Pelindung Kartu'}
              </span>
              <span className="font-mono font-bold tabular-nums">
                {Math.round(overlayOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={0.9}
              step={0.05}
              value={overlayOpacity}
              onChange={e => setOverlayOpacity(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {(activeTab === 'image' || activeTab === 'url') && (
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className={mutedText}>Efek Blur Foto Latar</span>
                <span className="font-mono font-bold tabular-nums">{blurPx} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={14}
                step={1}
                value={blurPx}
                onChange={e => setBlurPx(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          )}
        </div>
      )}

      {localError && (
        <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 font-medium">
          <span className={isDarkUi ? 'text-rose-200' : 'text-rose-700'}>{localError}</span>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
              isDarkUi
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tutup
          </button>
        )}
        <button
          type="button"
          onClick={handleApplySave}
          disabled={isSaving || isProcessingImage}
          className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>
            {isSaving
              ? 'Menyimpan...'
              : variant === 'main'
              ? 'Simpan Background Menu Utama'
              : 'Simpan Background Layanan'}
          </span>
        </button>
      </div>
    </div>
  );
};

interface ServiceBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceLabel: string;
  usernameLabel?: string;
  initialConfig?: BackgroundConfig | null;
  onSave: (config: BackgroundConfig) => Promise<{ ok: boolean; message: string }>;
  onReset: () => Promise<{ ok: boolean; message: string }>;
}

export const ServiceBackgroundModal: React.FC<ServiceBackgroundModalProps> = ({
  isOpen,
  onClose,
  serviceLabel,
  usernameLabel,
  initialConfig,
  onSave,
  onReset
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Kustomisasi Background · {serviceLabel}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {usernameLabel
                ? `Tersimpan permanen khusus akun @${usernameLabel} dan tidak memengaruhi pengguna lain.`
                : 'Tersimpan permanen khusus untuk akun layanan Anda.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold ${
              feedback.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <BackgroundCustomizerPanel
          variant="service"
          theme="light"
          initialConfig={initialConfig}
          title={`Background Menu Utama ${serviceLabel}`}
          subtitle="Pilih tema, unggah foto pribadi/ruang kerja, atau pilih warna sesuai selera Anda."
          previewHeadline={`Ruang Kerja ${serviceLabel}`}
          previewSubline="Setiap kartu dan tabel tetap jelas terbaca di atas latar pilihan Anda"
          isSaving={isSaving}
          onCancel={onClose}
          onSave={async cfg => {
            setIsSaving(true);
            setFeedback(null);
            const res = await onSave(cfg);
            setIsSaving(false);
            setFeedback({ ok: res.ok, text: res.message });
          }}
          onReset={async () => {
            setIsSaving(true);
            setFeedback(null);
            const res = await onReset();
            setIsSaving(false);
            setFeedback({ ok: res.ok, text: res.message });
          }}
        />
      </div>
    </div>
  );
};
