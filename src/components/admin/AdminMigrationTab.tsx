import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  FileJson,
  HardDrive,
  RotateCcw,
  Upload
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storageService';
import { MigrationReport } from '../../types';
import { formatDateTimeId } from './adminFormatters';

interface AdminMigrationTabProps {
  onNotice: (ok: boolean, text: string) => void;
  onRefreshDashboard: () => Promise<boolean>;
}

const LEGACY_LOCAL_SOURCES: { key: string; label: string; suggestedTarget: string }[] = [
  { key: 'siops_tu_berita_acara_history', label: 'Riwayat Berita Acara & Surat TU (Lokal)', suggestedTarget: 'beritaAcaraHistory' },
  { key: 'siops_tasks', label: 'Jurnal Tugas Lama (Lokal)', suggestedTarget: 'tasks' },
  { key: 'siops_inventory', label: 'Inventaris Lama (Lokal)', suggestedTarget: 'inventories' },
  { key: 'siops_library_books', label: 'Koleksi Buku Lama (Lokal)', suggestedTarget: 'libraryBooks' },
  { key: 'siops_library_members', label: 'Anggota Perpus Lama (Lokal)', suggestedTarget: 'libraryMembers' },
  { key: 'siops_archives', label: 'Arsip Dokumen Lama (Lokal)', suggestedTarget: 'archives' }
];

const BUILTIN_TARGETS: { code: string; label: string }[] = [
  { code: 'beritaAcaraHistory', label: 'Riwayat Berita Acara & Surat TU (beritaAcaraHistory)' },
  { code: 'tasks', label: 'Jurnal Tugas Harian (tasks)' },
  { code: 'inventories', label: 'Inventaris Sarpras (inventories)' },
  { code: 'libraryBooks', label: 'Koleksi Buku Perpustakaan (libraryBooks)' },
  { code: 'libraryMembers', label: 'Anggota Perpustakaan (libraryMembers)' },
  { code: 'monthlyReports', label: 'Laporan Bulanan (monthlyReports)' },
  { code: 'annualReports', label: 'Laporan Tahunan (annualReports)' },
  { code: 'archives', label: 'Arsip Dokumen Resmi (archives)' },
  { code: 'customCategories', label: 'Kategori Tugas Kustom (customCategories)' }
];

const TARGET_FIELD_SUGGESTIONS: Record<string, string[]> = {
  tasks: ['id', 'role', 'date', 'category', 'taskType', 'title', 'description', 'location', 'timeStart', 'timeEnd', 'status', 'volumeUnit', 'petugas'],
  inventories: ['id', 'role', 'kodeBarang', 'namaBarang', 'merkModel', 'kategori', 'jumlah', 'satuan', 'kondisi', 'lokasiPenyimpanan', 'tahunPengadaan'],
  libraryBooks: ['id', 'kodeBuku', 'judul', 'penulis', 'penerbit', 'tahunTerbit', 'kategoriBuku', 'sumberPengadaan', 'tanggalMasuk', 'jumlah', 'kondisi', 'lokasiRak'],
  libraryMembers: ['id', 'nomorAnggota', 'nama', 'tipeAnggota', 'kelasAtauJabatan', 'jenisKelamin', 'status'],
  beritaAcaraHistory: ['id', 'templateId', 'templateTitle', 'nomorSurat', 'tanggalSurat', 'ringkasan', 'formValues', 'createdAt', 'updatedAt']
};

export const AdminMigrationTab: React.FC<AdminMigrationTabProps> = ({
  onNotice,
  onRefreshDashboard
}) => {
  const { adminDashboardData, refreshAccessState } = useApp();
  const migrationLogs = adminDashboardData.migrationLogs || [];

  const [detectedLegacy, setDetectedLegacy] = useState<{ key: string; label: string; suggestedTarget: string; records: any[] }[]>([]);
  const [sourceName, setSourceName] = useState('Migrasi Data Layanan Lama');
  const [targetCollection, setTargetCollection] = useState('beritaAcaraHistory');
  const [duplicateStrategy, setDuplicateStrategy] = useState<'SKIP' | 'OVERWRITE' | 'RENAME_ID'>('SKIP');
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [parsedRecords, setParsedRecords] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [runningMigration, setRunningMigration] = useState(false);
  const [latestReport, setLatestReport] = useState<MigrationReport | null>(null);
  const [confirmRollback, setConfirmRollback] = useState<MigrationReport | null>(null);
  const [rollingBack, setRollingBack] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scanLegacyLocalStorage = () => {
    if (typeof window === 'undefined') return;
    const found: { key: string; label: string; suggestedTarget: string; records: any[] }[] = [];
    for (const src of LEGACY_LOCAL_SOURCES) {
      try {
        const raw = window.localStorage.getItem(src.key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          found.push({ ...src, records: parsed });
        }
      } catch {
        // ignore invalid json
      }
    }
    setDetectedLegacy(found);
  };

  useEffect(() => {
    scanLegacyLocalStorage();
  }, []);

  const allTargetOptions = useMemo(() => {
    const custom = (adminDashboardData.customDatabases || []).map(db => ({
      code: db.code,
      label: `${db.name} (${db.code}) · Kustom`
    }));
    return [...BUILTIN_TARGETS, ...custom];
  }, [adminDashboardData.customDatabases]);

  const sourceColumns = useMemo(() => {
    const keys = new Set<string>();
    for (const row of parsedRecords.slice(0, 20)) {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach(k => keys.add(k));
      }
    }
    return Array.from(keys);
  }, [parsedRecords]);

  const handleLoadJsonArray = (arr: any[], suggestedName: string, suggestedTarget?: string) => {
    setParsedRecords(arr);
    setRawJsonInput(JSON.stringify(arr, null, 2));
    setSourceName(suggestedName);
    if (suggestedTarget) setTargetCollection(suggestedTarget);
    setColumnMapping({});
    onNotice(true, `${arr.length} baris data siap dimigrasikan ke Database Admin.`);
  };

  const handleParseRawInput = () => {
    try {
      const parsed = JSON.parse(rawJsonInput || '[]');
      const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.records) ? parsed.records : null;
      if (!arr) {
        onNotice(false, 'JSON harus berupa Array ([...]) atau objek { "records": [...] }.');
        return;
      }
      setParsedRecords(arr);
      onNotice(true, `Berhasil membaca ${arr.length} record dari JSON.`);
    } catch {
      onNotice(false, 'Format JSON tidak valid. Periksa sintaks JSON Anda.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '[]'));
        const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.records) ? parsed.records : null;
        if (!arr) {
          onNotice(false, 'File JSON harus berisi Array data.');
          return;
        }
        handleLoadJsonArray(arr, `Unggah File: ${file.name}`);
      } catch {
        onNotice(false, 'Gagal membaca file JSON migrasi.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRunMigration = async () => {
    if (runningMigration) return;
    if (parsedRecords.length === 0) {
      onNotice(false, 'Belum ada data sumber yang dimuat untuk dimigrasikan.');
      return;
    }
    const cleanMapping: Record<string, string> = {};
    Object.entries(columnMapping).forEach(([srcKey, dstKey]) => {
      if (dstKey && dstKey.trim() && dstKey.trim() !== srcKey) {
        cleanMapping[srcKey] = dstKey.trim();
      }
    });

    setRunningMigration(true);
    const res = await storageService.adminRunMigration({
      sourceName: sourceName.trim() || 'Migrasi Data Layanan Lama',
      targetCollection,
      records: parsedRecords,
      duplicateStrategy,
      columnMapping: cleanMapping
    });
    setRunningMigration(false);

    if (res.ok && res.data?.report) {
      setLatestReport(res.data.report);
      onNotice(true, res.data.message || 'Migrasi selesai dijalankan dengan snapshot pengaman.');
      await Promise.all([onRefreshDashboard(), refreshAccessState(true)]);
    } else {
      onNotice(false, res.error || 'Migrasi gagal dijalankan.');
    }
  };

  const handleConfirmRollback = async () => {
    if (!confirmRollback || rollingBack) return;
    setRollingBack(true);
    const res = await storageService.adminRollbackMigration(confirmRollback.id);
    setRollingBack(false);
    if (res.ok) {
      onNotice(
        true,
        res.data?.message || `Rollback migrasi "${confirmRollback.sourceName}" berhasil memulihkan data sebelum migrasi.`
      );
      setConfirmRollback(null);
      await Promise.all([onRefreshDashboard(), refreshAccessState(true)]);
    } else {
      onNotice(false, res.error || 'Gagal melakukan rollback migrasi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Detected LocalStorage Legacy Data */}
      <div className="p-4 rounded-xl bg-slate-800/45 border border-slate-700/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Deteksi Otomatis Data Layanan Lama di Browser
              </h3>
              <p className="text-[11px] text-slate-400">
                Sistem memindai penyimpanan lokal lama yang terpisah untuk dipindahkan satu pintu ke Database Admin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={scanLegacyLocalStorage}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg cursor-pointer"
          >
            Pindai Ulang
          </button>
        </div>

        {detectedLegacy.length === 0 ? (
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            Tidak ditemukan sisa database lokal lama di browser ini. Anda masih dapat mengunggah file JSON atau menempel data secara manual di bawah.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {detectedLegacy.map(src => (
              <div
                key={src.key}
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/35 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-white">{src.label}</p>
                  <p className="text-[11px] text-amber-200">
                    {src.records.length} record ditemukan · Target: <span className="font-mono">{src.suggestedTarget}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadJsonArray(src.records, src.label, src.suggestedTarget)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shrink-0 cursor-pointer"
                >
                  Muat untuk Migrasi
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Migration Workbench */}
      <div className="p-4 rounded-xl bg-slate-800/45 border border-slate-700/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Konfigurasi & Pemetaan Kolom Migrasi</h3>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah File .json</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nama Sumber Migrasi</label>
            <input
              type="text"
              value={sourceName}
              onChange={e => setSourceName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Database Admin Tujuan</label>
            <select
              value={targetCollection}
              onChange={e => setTargetCollection(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-semibold"
            >
              {allTargetOptions.map(opt => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Penanganan Data Duplikat</label>
            <select
              value={duplicateStrategy}
              onChange={e => setDuplicateStrategy(e.target.value as 'SKIP' | 'OVERWRITE' | 'RENAME_ID')}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
            >
              <option value="SKIP">Lewati Duplikat (SKIP · Paling Aman)</option>
              <option value="OVERWRITE">Timpa Record ID Sama (OVERWRITE)</option>
              <option value="RENAME_ID">Buat ID Baru Jika Sama (RENAME_ID)</option>
            </select>
          </div>
        </div>

        {/* Raw JSON Paste / Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5 text-sky-400" />
              <span>Data JSON Sumber ({parsedRecords.length} record siap diproses)</span>
            </label>
            <button
              type="button"
              onClick={handleParseRawInput}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer"
            >
              Terapkan Teks JSON
            </button>
          </div>
          <textarea
            rows={5}
            value={rawJsonInput}
            onChange={e => setRawJsonInput(e.target.value)}
            placeholder='Tempel array JSON data lama di sini, contoh: [{"id": "1", "judul": "..."}]'
            className="w-full p-3 text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl text-sky-200"
          />
        </div>

        {/* Column Mapping */}
        {sourceColumns.length > 0 && (
          <div className="space-y-2 border-t border-slate-700 pt-3">
            <p className="text-xs font-bold text-slate-200">
              Pencocokan Struktur Kolom (Opsional — ubah hanya jika nama kolom lama berbeda)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {sourceColumns.map(col => (
                <div key={col} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/70 border border-slate-800 text-xs">
                  <span className="font-mono text-slate-300 truncate max-w-[110px]" title={col}>
                    {col}
                  </span>
                  <span className="text-slate-500">→</span>
                  <input
                    type="text"
                    list={`fields_${targetCollection}`}
                    value={columnMapping[col] ?? col}
                    onChange={e =>
                      setColumnMapping(prev => ({ ...prev, [col]: e.target.value }))
                    }
                    className="flex-1 min-w-0 px-2 py-1 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-emerald-300"
                  />
                </div>
              ))}
            </div>
            <datalist id={`fields_${targetCollection}`}>
              {(TARGET_FIELD_SUGGESTIONS[targetCollection] || []).map(f => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-slate-400">
            Sistem otomatis membuat snapshot cadangan <span className="font-mono">PRE_MIGRATION</span> sebelum menyalin data.
          </p>
          <button
            type="button"
            disabled={runningMigration || parsedRecords.length === 0}
            onClick={handleRunMigration}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl cursor-pointer"
          >
            {runningMigration ? 'Menjalankan Migrasi...' : `Jalankan Migrasi Aman (${parsedRecords.length} Data)`}
          </button>
        </div>
      </div>

      {/* Latest Migration Report */}
      {latestReport && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Laporan Hasil Migrasi: {latestReport.sourceName}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 tabular-nums">
            <div className="p-2 rounded bg-slate-900/70">Total Input: <strong>{latestReport.totalInput}</strong></div>
            <div className="p-2 rounded bg-slate-900/70 text-emerald-300">Berhasil: <strong>{latestReport.migratedCount}</strong></div>
            <div className="p-2 rounded bg-slate-900/70 text-amber-300">Terlewati: <strong>{latestReport.skippedCount}</strong></div>
            <div className="p-2 rounded bg-slate-900/70 text-rose-300">Gagal: <strong>{latestReport.failedCount}</strong></div>
          </div>
          {latestReport.errors.length > 0 && (
            <div className="p-2.5 rounded bg-slate-950 border border-rose-500/30 text-[11px] text-rose-300 space-y-1 max-h-32 overflow-y-auto">
              {latestReport.errors.map((err, i) => (
                <p key={i}>• {err}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Migration History & Rollback */}
      <div className="space-y-2 border-t border-slate-800 pt-5">
        <h3 className="text-sm font-bold text-white">
          Riwayat Migrasi & Opsi Rollback ({migrationLogs.length})
        </h3>
        {migrationLogs.length === 0 ? (
          <div className="p-5 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
            Belum ada riwayat migrasi yang dijalankan.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Sumber & Target DB</th>
                  <th className="px-4 py-2.5 font-semibold">Hasil (Masuk / Lewat / Gagal)</th>
                  <th className="px-4 py-2.5 font-semibold">Waktu</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Status / Rollback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                {migrationLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2.5">
                      <p className="font-bold text-white">{log.sourceName}</p>
                      <p className="text-[11px] font-mono text-sky-300">
                        → {log.targetCollection} ({log.duplicateStrategy})
                      </p>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">
                      <span className="text-emerald-300 font-bold">{log.migratedCount} masuk</span>
                      {' · '}
                      <span className="text-amber-300">{log.skippedCount} lewat</span>
                      {' · '}
                      <span className="text-rose-300">{log.failedCount} gagal</span>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-300">
                      {formatDateTimeId(log.executedAt)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {log.rolledBack ? (
                        <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-[11px] font-semibold">
                          Sudah Di-Rollback ({formatDateTimeId(log.rolledBackAt)})
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRollback(log)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Rollback Migrasi</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Rollback Modal */}
      {confirmRollback && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Batalkan (Rollback) Migrasi Ini?</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Database akan dikembalikan ke kondisi tepat sebelum migrasi <strong>{confirmRollback.sourceName}</strong> dijalankan menggunakan snapshot pengaman{' '}
                  <span className="font-mono text-amber-300">{confirmRollback.preMigrationSnapshotId}</span>.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmRollback(null)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={rollingBack}
                onClick={handleConfirmRollback}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 rounded-lg cursor-pointer"
              >
                {rollingBack ? 'Mengembalikan...' : 'Ya, Rollback Migrasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
