import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDrive,
  Lock,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import { DEFAULT_WELCOME_HEADLINE, DEFAULT_WELCOME_SUBHEADLINE, useApp } from '../../context/AppContext';
import { storageService } from '../../services/storageService';
import { BackgroundConfig, DatabaseFieldDef, DatabaseModuleMetrics, DatabaseStatus } from '../../types';
import { ALERT_META, formatBytes } from './adminFormatters';
import { BackgroundCustomizerPanel } from '../common/BackgroundCustomizer';

interface AdminCapacityDatabasesTabProps {
  onNotice: (ok: boolean, text: string) => void;
  onRefreshDashboard: () => Promise<boolean>;
}

export const AdminCapacityDatabasesTab: React.FC<AdminCapacityDatabasesTabProps> = ({
  onNotice,
  onRefreshDashboard
}) => {
  const { siteSettings, adminDashboardData, refreshAccessState } = useApp();
  const metrics = adminDashboardData.databaseMetrics;
  const databases = metrics?.databases || adminDashboardData.databaseRegistry || [];

  // Welcome headline & main background editor state
  const [headline, setHeadline] = useState(siteSettings.welcomeHeadline || DEFAULT_WELCOME_HEADLINE);
  const [subheadline, setSubheadline] = useState(siteSettings.welcomeSubheadline || DEFAULT_WELCOME_SUBHEADLINE);
  const [savingHeadline, setSavingHeadline] = useState(false);
  const [savingMainBg, setSavingMainBg] = useState(false);

  // Global quota editor state
  const [quotaMbInput, setQuotaMbInput] = useState(() =>
    String(Math.max(1, Math.round((adminDashboardData.databaseQuotaBytes || 5 * 1024 * 1024) / (1024 * 1024))))
  );
  const [savingQuota, setSavingQuota] = useState(false);

  // Create New Database state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDbCode, setNewDbCode] = useState('');
  const [newDbName, setNewDbName] = useState('');
  const [newDbModule, setNewDbModule] = useState('Tata Usaha (TU)');
  const [newDbDesc, setNewDbDesc] = useState('');
  const [newDbMaxRecords, setNewDbMaxRecords] = useState('1000');
  const [newDbLimitKb, setNewDbLimitKb] = useState('512');
  const [newDbStatus, setNewDbStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [newDbFields, setNewDbFields] = useState<DatabaseFieldDef[]>([
    { key: 'judul', label: 'Judul / Nama Data', type: 'text', required: true },
    { key: 'tanggal', label: 'Tanggal', type: 'date', required: false }
  ]);
  const [creatingDb, setCreatingDb] = useState(false);

  // Inline edit DB capacity state
  const [editingDb, setEditingDb] = useState<{
    db: DatabaseModuleMetrics;
    maxRecords: string;
    limitKb: string;
    status: DatabaseStatus;
  } | null>(null);
  const [savingDbEdit, setSavingDbEdit] = useState(false);

  // Confirm delete custom DB
  const [confirmDeleteDb, setConfirmDeleteDb] = useState<DatabaseModuleMetrics | null>(null);
  const [deletingDb, setDeletingDb] = useState(false);

  useEffect(() => {
    setHeadline(siteSettings.welcomeHeadline || DEFAULT_WELCOME_HEADLINE);
    setSubheadline(siteSettings.welcomeSubheadline || DEFAULT_WELCOME_SUBHEADLINE);
  }, [siteSettings.welcomeHeadline, siteSettings.welcomeSubheadline]);

  useEffect(() => {
    if (adminDashboardData.databaseQuotaBytes) {
      setQuotaMbInput(
        String(Math.max(1, Math.round((adminDashboardData.databaseQuotaBytes / (1024 * 1024)) * 10) / 10))
      );
    }
  }, [adminDashboardData.databaseQuotaBytes]);

  const handleSaveWelcomeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingHeadline) return;
    if (!headline.trim()) {
      onNotice(false, 'Kalimat sambutan pembuka tidak boleh kosong.');
      return;
    }
    setSavingHeadline(true);
    const res = await storageService.adminUpdateSiteSettings({
      welcomeHeadline: headline.trim(),
      welcomeSubheadline: subheadline.trim()
    });
    setSavingHeadline(false);
    if (res.ok) {
      onNotice(true, res.data?.message || 'Kalimat halaman pembuka berhasil diperbarui.');
      await Promise.all([onRefreshDashboard(), refreshAccessState(true)]);
    } else {
      onNotice(false, res.error || 'Gagal menyimpan kalimat halaman pembuka.');
    }
  };

  const handleResetDefaultHeadline = () => {
    setHeadline(DEFAULT_WELCOME_HEADLINE);
    setSubheadline(DEFAULT_WELCOME_SUBHEADLINE);
  };

  const handleSaveMainBackground = async (bgConfig: BackgroundConfig) => {
    if (savingMainBg) return;
    setSavingMainBg(true);
    const res = await storageService.adminUpdateSiteSettings({
      mainBackground: bgConfig
    });
    setSavingMainBg(false);
    if (res.ok) {
      onNotice(true, res.data?.message || 'Background menu utama berhasil diperbarui.');
      await Promise.all([onRefreshDashboard(), refreshAccessState(true)]);
    } else {
      onNotice(false, res.error || 'Gagal menyimpan background menu utama.');
    }
  };

  const handleResetMainBackground = async () => {
    if (savingMainBg) return;
    setSavingMainBg(true);
    const res = await storageService.adminUpdateSiteSettings({
      mainBackground: null
    });
    setSavingMainBg(false);
    if (res.ok) {
      onNotice(true, 'Background menu utama dikembalikan ke tampilan standar.');
      await Promise.all([onRefreshDashboard(), refreshAccessState(true)]);
    } else {
      onNotice(false, res.error || 'Gagal mengatur ulang background menu utama.');
    }
  };

  const handleSaveGlobalQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingQuota) return;
    const mb = Number(quotaMbInput);
    if (!Number.isFinite(mb) || mb < 0.25 || mb > 500) {
      onNotice(false, 'Kuota global harus antara 0.25 MB sampai 500 MB.');
      return;
    }
    setSavingQuota(true);
    const bytes = Math.round(mb * 1024 * 1024);
    const res = await storageService.adminUpdateQuota(bytes);
    setSavingQuota(false);
    if (res.ok) {
      onNotice(true, res.data?.message || `Kuota global berhasil diatur menjadi ${mb} MB.`);
      await Promise.all([onRefreshDashboard(), refreshAccessState(true)]);
    } else {
      onNotice(false, res.error || 'Gagal memperbarui kuota database.');
    }
  };

  const handleAddFieldRow = () => {
    setNewDbFields(prev => [
      ...prev,
      { key: `kolom_${prev.length + 1}`, label: `Kolom ${prev.length + 1}`, type: 'text', required: false }
    ]);
  };

  const handleRemoveFieldRow = (idx: number) => {
    setNewDbFields(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingDb) return;
    const cleanCode = newDbCode
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_-]/g, '');

    if (!cleanCode || cleanCode.length < 3) {
      onNotice(false, 'Kode database minimal 3 karakter (huruf kecil, angka, garis bawah, atau tanda hubung).');
      return;
    }
    if (!newDbName.trim()) {
      onNotice(false, 'Nama database wajib diisi.');
      return;
    }
    const maxRec = Math.max(10, Math.round(Number(newDbMaxRecords) || 1000));
    const limitKb = Math.max(16, Math.round(Number(newDbLimitKb) || 512));

    setCreatingDb(true);
    const res = await storageService.adminCreateDatabase({
      code: cleanCode,
      name: newDbName.trim(),
      module: newDbModule.trim() || 'Umum',
      description: newDbDesc.trim(),
      maxRecords: maxRec,
      capacityLimitBytes: limitKb * 1024,
      status: newDbStatus,
      fields: newDbFields.filter(f => f.key.trim() && f.label.trim())
    });
    setCreatingDb(false);

    if (res.ok) {
      onNotice(true, res.data?.message || `Database baru "${newDbName.trim()}" berhasil ditambahkan ke Database Admin.`);
      setShowCreateForm(false);
      setNewDbCode('');
      setNewDbName('');
      setNewDbDesc('');
      await Promise.all([onRefreshDashboard(), refreshAccessState(true)]);
    } else {
      onNotice(false, res.error || 'Gagal membuat database baru.');
    }
  };

  const handleSaveDbEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDb || savingDbEdit) return;
    const maxRec = Math.max(10, Math.round(Number(editingDb.maxRecords) || 500));
    const limitKb = Math.max(16, Math.round(Number(editingDb.limitKb) || 256));

    setSavingDbEdit(true);
    const res = await storageService.adminUpdateDatabase(editingDb.db.code, {
      maxRecords: maxRec,
      capacityLimitBytes: limitKb * 1024,
      status: editingDb.status
    });
    setSavingDbEdit(false);

    if (res.ok) {
      onNotice(true, res.data?.message || `Konfigurasi database "${editingDb.db.name}" berhasil diperbarui.`);
      setEditingDb(null);
      await Promise.all([onRefreshDashboard(), refreshAccessState(true)]);
    } else {
      onNotice(false, res.error || 'Gagal memperbarui kapasitas database.');
    }
  };

  const handleConfirmDeleteDb = async () => {
    if (!confirmDeleteDb || deletingDb) return;
    setDeletingDb(true);
    const res = await storageService.adminDeleteDatabase(confirmDeleteDb.code);
    setDeletingDb(false);
    if (res.ok) {
      onNotice(true, res.data?.message || `Database "${confirmDeleteDb.name}" dipindahkan ke arsip/dihapus.`);
      setConfirmDeleteDb(null);
      await Promise.all([onRefreshDashboard(), refreshAccessState(true)]);
    } else {
      onNotice(false, res.error || 'Gagal menghapus database.');
    }
  };

  const effectiveAlert = metrics?.effectiveAlertLevel || 'NORMAL';
  const alertMeta = ALERT_META[effectiveAlert];
  const criticalOrWarnDbs = databases.filter(d => d.alertLevel !== 'NORMAL');

  return (
    <div className="space-y-6">
      {/* Automatic System Alert Banner */}
      <div className={`p-4 rounded-xl border ${alertMeta.bannerClass} flex flex-wrap items-start justify-between gap-3`}>
        <div className="flex items-start gap-3">
          {effectiveAlert === 'FULL' ? (
            <Lock className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
          ) : effectiveAlert === 'NORMAL' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold">
                Status Kapasitas Database Satu Pintu: {alertMeta.label}
              </h4>
            </div>
            <p className="text-xs opacity-90 leading-relaxed">{alertMeta.description}</p>
            {criticalOrWarnDbs.length > 0 && (
              <p className="text-xs font-medium mt-1">
                Modul perlu perhatian:{' '}
                {criticalOrWarnDbs.map(d => `${d.name} (${d.percentUsed}%)`).join(', ')}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm(prev => !prev)}
          className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showCreateForm ? 'Tutup Form DB' : 'Tambah Database Baru'}</span>
        </button>
      </div>

      {/* Global Capacity Summary + Quota Adjust */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Kapasitas Penyimpanan Database Admin</h3>
            </div>
            <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold tabular-nums ${alertMeta.badgeClass}`}>
              {metrics?.totalPercentUsed ?? 0}% Terpakai
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${alertMeta.barClass}`}
              style={{ width: `${Math.min(100, metrics?.totalPercentUsed ?? 0)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <p className="text-[11px] text-slate-400">Terpakai</p>
              <p className="text-sm font-bold text-white tabular-nums mt-0.5">
                {formatBytes(metrics?.totalUsedBytes ?? 0)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <p className="text-[11px] text-slate-400">Kuota Maksimal</p>
              <p className="text-sm font-bold text-slate-200 tabular-nums mt-0.5">
                {formatBytes(metrics?.totalQuotaBytes ?? adminDashboardData.databaseQuotaBytes ?? 0)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <p className="text-[11px] text-slate-400">Sisa Kapasitas</p>
              <p className="text-sm font-bold text-emerald-300 tabular-nums mt-0.5">
                {formatBytes(metrics?.totalRemainingBytes ?? 0)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <p className="text-[11px] text-slate-400">Total Baris / Record</p>
              <p className="text-sm font-bold text-sky-300 tabular-nums mt-0.5">
                {(metrics?.totalRecords ?? 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSaveGlobalQuota}
          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 flex flex-col justify-between gap-3"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Atur Batas Kuota Global</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Peringatan kuning muncul otomatis pada 80%, kritis merah pada 95%, dan tulis data terkunci pada 100%.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-300">Kuota Total (MB)</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.5"
                min="0.25"
                max="500"
                required
                value={quotaMbInput}
                onChange={e => setQuotaMbInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white tabular-nums"
              />
              <button
                type="submit"
                disabled={savingQuota}
                className="px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 rounded-lg cursor-pointer"
              >
                {savingQuota ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Kalimat Pembuka Editor */}
      <form
        onSubmit={handleSaveWelcomeSettings}
        className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Pengaturan Kalimat Halaman Pembuka</h3>
              <p className="text-[11px] text-slate-400">
                Kalimat utama yang tampil di halaman pembuka portal bagi seluruh operator (khusus edit Admin).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetDefaultHeadline}
            className="px-2.5 py-1.5 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Isi Standar</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Kalimat Utama Halaman Pembuka
            </label>
            <input
              type="text"
              required
              maxLength={180}
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder={DEFAULT_WELCOME_HEADLINE}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-semibold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Sub-judul / Keterangan Portal
            </label>
            <input
              type="text"
              maxLength={280}
              value={subheadline}
              onChange={e => setSubheadline(e.target.value)}
              placeholder={DEFAULT_WELCOME_SUBHEADLINE}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingHeadline}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingHeadline ? 'Menyimpan...' : 'Simpan Kalimat Pembuka'}</span>
          </button>
        </div>
      </form>

      {/* Background Menu Utama Editor (Admin Only) */}
      <BackgroundCustomizerPanel
        variant="main"
        theme="dark"
        initialConfig={siteSettings.mainBackground || null}
        title="Pengaturan Background Menu Utama (Halaman Pembuka)"
        subtitle="Atur tampilan latar belakang halaman pembuka portal dengan tema pilihan, upload foto sekolah, warna, atau tautan gambar."
        previewHeadline={headline || DEFAULT_WELCOME_HEADLINE}
        previewSubline={subheadline || DEFAULT_WELCOME_SUBHEADLINE}
        isSaving={savingMainBg}
        onSave={handleSaveMainBackground}
        onReset={handleResetMainBackground}
      />

      {/* Tambah Database Baru Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateDatabase}
          className="p-5 rounded-xl bg-slate-800/70 border border-sky-500/40 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Tambah Database Baru (Terpusat di Admin)</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Kode Database (unik, tanpa spasi)
              </label>
              <input
                type="text"
                required
                value={newDbCode}
                onChange={e => setNewDbCode(e.target.value)}
                placeholder="misal: data_tamu_sekolah"
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nama Database</label>
              <input
                type="text"
                required
                value={newDbName}
                onChange={e => setNewDbName(e.target.value)}
                placeholder="misal: Buku Tamu & Ekspedisi"
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Peruntukan / Modul</label>
              <input
                type="text"
                required
                value={newDbModule}
                onChange={e => setNewDbModule(e.target.value)}
                placeholder="misal: Tata Usaha (TU)"
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Batas Maksimal Baris</label>
              <input
                type="number"
                min={10}
                max={100000}
                required
                value={newDbMaxRecords}
                onChange={e => setNewDbMaxRecords(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Batas Kapasitas (KB)</label>
              <input
                type="number"
                min={16}
                max={51200}
                required
                value={newDbLimitKb}
                onChange={e => setNewDbLimitKb(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Status Awal</label>
              <select
                value={newDbStatus}
                onChange={e => setNewDbStatus(e.target.value as 'ACTIVE' | 'ARCHIVED')}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="ACTIVE">Aktif (ACTIVE)</option>
                <option value="ARCHIVED">Arsip (ARCHIVED)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Deskripsi & Aturan Penyimpanan</label>
            <input
              type="text"
              value={newDbDesc}
              onChange={e => setNewDbDesc(e.target.value)}
              placeholder="Jelaskan kegunaan dan isi tabel ini..."
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>

          {/* Schema Fields Builder */}
          <div className="space-y-2 border-t border-slate-700 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Validasi Skema & Tipe Kolom</span>
              <button
                type="button"
                onClick={handleAddFieldRow}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer"
              >
                + Tambah Kolom
              </button>
            </div>
            <div className="space-y-2">
              {newDbFields.map((field, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={field.key}
                    onChange={e => {
                      const val = e.target.value;
                      setNewDbFields(prev => prev.map((f, i) => (i === idx ? { ...f, key: val } : f)));
                    }}
                    placeholder="key_kolom"
                    className="col-span-3 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                  <input
                    type="text"
                    value={field.label}
                    onChange={e => {
                      const val = e.target.value;
                      setNewDbFields(prev => prev.map((f, i) => (i === idx ? { ...f, label: val } : f)));
                    }}
                    placeholder="Label Tampilan"
                    className="col-span-4 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <select
                    value={field.type}
                    onChange={e => {
                      const val = e.target.value as DatabaseFieldDef['type'];
                      setNewDbFields(prev => prev.map((f, i) => (i === idx ? { ...f, type: val } : f)));
                    }}
                    className="col-span-2 px-2 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="text">Teks</option>
                    <option value="number">Angka</option>
                    <option value="date">Tanggal</option>
                    <option value="boolean">Ya/Tidak</option>
                    <option value="select">Pilihan</option>
                  </select>
                  <label className="col-span-2 flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={e => {
                        const checked = e.target.checked;
                        setNewDbFields(prev => prev.map((f, i) => (i === idx ? { ...f, required: checked } : f)));
                      }}
                    />
                    <span>Wajib</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveFieldRow(idx)}
                    className="col-span-1 p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                    title="Hapus kolom"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creatingDb}
              className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white rounded-lg cursor-pointer"
            >
              {creatingDb ? 'Membuat Database...' : 'Buat & Integrasikan Database'}
            </button>
          </div>
        </form>
      )}

      {/* Database List Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            Daftar Database & Modul Terpusat ({databases.length} Database)
          </h3>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Database & Modul</th>
                <th className="px-4 py-3 font-semibold">Baris / Record</th>
                <th className="px-4 py-3 font-semibold">Ukuran & Sisa</th>
                <th className="px-4 py-3 font-semibold">Kapasitas</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/60">
              {databases.map(db => {
                const meta = ALERT_META[db.alertLevel || 'NORMAL'];
                return (
                  <tr key={db.code} className="hover:bg-slate-800/40 align-top">
                    <td className="px-4 py-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{db.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {db.code}
                        </span>
                        {!db.isBuiltin && (
                          <span className="text-[10px] font-semibold text-sky-300 bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 rounded">
                            Kustom Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{db.module}</p>
                      {db.description && (
                        <p className="text-[11px] text-slate-500 max-w-md">{db.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <p className="font-bold text-white">
                        {db.recordCount.toLocaleString('id-ID')} / {db.maxRecords.toLocaleString('id-ID')}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Sisa: {db.remainingRecords.toLocaleString('id-ID')} baris
                      </p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <p className="font-semibold text-slate-200">
                        {formatBytes(db.usedBytes)} / {formatBytes(db.limitBytes)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Sisa: {formatBytes(db.remainingBytes)}
                      </p>
                    </td>
                    <td className="px-4 py-3 min-w-[160px]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold tabular-nums ${meta.badgeClass}`}>
                          {db.percentUsed}% · {meta.label.split(' ')[0]}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${meta.barClass}`}
                          style={{ width: `${Math.min(100, db.percentUsed)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          db.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : db.status === 'LOCKED'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-slate-700/60 text-slate-300 border-slate-600'
                        }`}
                      >
                        {db.status === 'ACTIVE' ? 'AKTIF' : db.status === 'LOCKED' ? 'TERKUNCI' : 'ARSIP'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingDb({
                            db,
                            maxRecords: String(db.maxRecords),
                            limitKb: String(Math.max(16, Math.round(db.limitBytes / 1024))),
                            status: db.status
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold cursor-pointer"
                      >
                        Atur Batas
                      </button>
                      {!db.isBuiltin && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteDb(db)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Database Limits Modal */}
      {editingDb && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4">
          <form
            onSubmit={handleSaveDbEdit}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            <h4 className="text-sm font-bold text-white">
              Atur Kapasitas & Status: {editingDb.db.name}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Batas Maksimal Baris</label>
                <input
                  type="number"
                  min={10}
                  max={100000}
                  required
                  value={editingDb.maxRecords}
                  onChange={e => setEditingDb(prev => (prev ? { ...prev, maxRecords: e.target.value } : null))}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Batas Kapasitas (KB)</label>
                <input
                  type="number"
                  min={16}
                  max={51200}
                  required
                  value={editingDb.limitKb}
                  onChange={e => setEditingDb(prev => (prev ? { ...prev, limitKb: e.target.value } : null))}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Status Database</label>
                <select
                  value={editingDb.status}
                  onChange={e =>
                    setEditingDb(prev => (prev ? { ...prev, status: e.target.value as DatabaseStatus } : null))
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="ACTIVE">AKTIF (Baca & Tulis Admin)</option>
                  <option value="LOCKED">TERKUNCI (Hanya Baca)</option>
                  <option value="ARCHIVED">ARSIP</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingDb(null)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingDbEdit}
                className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white rounded-lg cursor-pointer"
              >
                {savingDbEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Delete Custom DB Modal */}
      {confirmDeleteDb && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Hapus Database Kustom?</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Database <strong>{confirmDeleteDb.name}</strong> ({confirmDeleteDb.code}) berisi{' '}
                  <strong>{confirmDeleteDb.recordCount} data</strong> akan dihapus dari daftar aktif. Pastikan Anda sudah mencadangkan data jika masih diperlukan.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteDb(null)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingDb}
                onClick={handleConfirmDeleteDb}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white rounded-lg cursor-pointer"
              >
                {deletingDb ? 'Menghapus...' : 'Ya, Hapus Database'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
