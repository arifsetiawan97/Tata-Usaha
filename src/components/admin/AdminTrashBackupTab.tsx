import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Clock,
  Download,
  HardDriveDownload,
  History,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Upload
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storageService';
import { DatabaseBackupMeta, SoftDeletedItem } from '../../types';
import { formatBytes, formatDateTimeId } from './adminFormatters';

interface AdminTrashBackupTabProps {
  onNotice: (ok: boolean, text: string) => void;
  onRefreshDashboard: () => Promise<boolean>;
}

export const AdminTrashBackupTab: React.FC<AdminTrashBackupTabProps> = ({
  onNotice,
  onRefreshDashboard
}) => {
  const { adminDashboardData, refreshAccessState } = useApp();
  const softDeletedItems = adminDashboardData.softDeletedItems || [];
  const backups = adminDashboardData.backups || [];
  const schedule = adminDashboardData.backupSchedule || { enabled: true, intervalHours: 24 };

  const [scheduleEnabled, setScheduleEnabled] = useState(schedule.enabled);
  const [intervalHours, setIntervalHours] = useState(String(schedule.intervalHours || 24));
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [backupLabel, setBackupLabel] = useState('');
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);

  // Restore trash / purge trash states
  const [restoringTrashId, setRestoringTrashId] = useState<string | null>(null);
  const [purgeConfirmItem, setPurgeConfirmItem] = useState<SoftDeletedItem | null>(null);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [purgingTrash, setPurgingTrash] = useState(false);

  // Layered confirmation for Restore Backup (snapshot or file upload)
  const [confirmRestore, setConfirmRestore] = useState<{
    mode: 'snapshot' | 'upload';
    backupMeta?: DatabaseBackupMeta;
    uploadedSnapshot?: any;
    fileName?: string;
    confirmText: string;
  } | null>(null);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setScheduleEnabled(schedule.enabled);
    setIntervalHours(String(schedule.intervalHours || 24));
  }, [schedule.enabled, schedule.intervalHours]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingSchedule) return;
    const hrs = Math.max(1, Math.min(720, Math.round(Number(intervalHours) || 24)));
    setSavingSchedule(true);
    const res = await storageService.adminUpdateBackupSchedule(scheduleEnabled, hrs);
    setSavingSchedule(false);
    if (res.ok) {
      onNotice(true, res.data?.message || 'Jadwal pencadangan otomatis diperbarui.');
      await onRefreshDashboard();
    } else {
      onNotice(false, res.error || 'Gagal memperbarui jadwal cadangan.');
    }
  };

  const handleCreateManualBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingBackup) return;
    setCreatingBackup(true);
    const res = await storageService.adminCreateBackup(backupLabel.trim() || undefined);
    setCreatingBackup(false);
    if (res.ok) {
      onNotice(true, res.data?.message || 'Snapshot cadangan berhasil dibuat.');
      setBackupLabel('');
      await onRefreshDashboard();
    } else {
      onNotice(false, res.error || 'Gagal membuat snapshot cadangan.');
    }
  };

  const handleDownloadJson = async () => {
    if (downloadingBackup) return;
    setDownloadingBackup(true);
    const res = await storageService.downloadServerBackup();
    setDownloadingBackup(false);
    if (res.ok) {
      onNotice(true, 'File cadangan JSON lengkap berhasil diunduh ke perangkat Anda.');
    } else {
      onNotice(false, res.error || 'Gagal mengunduh file cadangan.');
    }
  };

  const handleRestoreTrashItem = async (item: SoftDeletedItem) => {
    if (restoringTrashId) return;
    setRestoringTrashId(item.trashId);
    const res = await storageService.adminRestoreTrash(item.trashId);
    setRestoringTrashId(null);
    if (res.ok) {
      onNotice(true, res.data?.message || `Data "${item.itemTitle}" berhasil dipulihkan.`);
      await Promise.all([onRefreshDashboard(), refreshAccessState(true)]);
    } else {
      onNotice(false, res.error || 'Gagal memulihkan data dari arsip.');
    }
  };

  const handlePurgeTrashConfirmed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purgeConfirmItem || purgingTrash) return;
    if (purgeConfirmText.trim().toUpperCase() !== 'HAPUS') {
      onNotice(false, 'Ketik kata HAPUS dengan benar untuk konfirmasi penghapusan permanen.');
      return;
    }
    setPurgingTrash(true);
    const res = await storageService.adminPurgeTrash(purgeConfirmItem.trashId);
    setPurgingTrash(false);
    if (res.ok) {
      onNotice(true, res.data?.message || 'Data telah dihapus permanen dari arsip sementara.');
      setPurgeConfirmItem(null);
      setPurgeConfirmText('');
      await onRefreshDashboard();
    } else {
      onNotice(false, res.error || 'Gagal menghapus permanen.');
    }
  };

  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        const snapshot = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
        if (!snapshot || typeof snapshot !== 'object') {
          onNotice(false, 'Format file cadangan JSON tidak valid.');
          return;
        }
        setConfirmRestore({
          mode: 'upload',
          uploadedSnapshot: snapshot,
          fileName: file.name,
          confirmText: ''
        });
      } catch {
        onNotice(false, 'File bukan JSON yang valid atau rusak.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmRestore || restoringBackup) return;
    if (confirmRestore.confirmText.trim().toUpperCase() !== 'PULIHKAN') {
      onNotice(false, 'Ketik PULIHKAN untuk mengonfirmasi pemulihan database.');
      return;
    }
    setRestoringBackup(true);
    const res =
      confirmRestore.mode === 'snapshot' && confirmRestore.backupMeta
        ? await storageService.adminRestoreBackup({ backupId: confirmRestore.backupMeta.id })
        : await storageService.adminRestoreBackup({ uploadedSnapshot: confirmRestore.uploadedSnapshot });
    setRestoringBackup(false);
    if (res.ok) {
      onNotice(
        true,
        res.data?.message ||
          'Database berhasil dipulihkan. Snapshot sebelum pemulihan otomatis disimpan sebagai pengaman.'
      );
      setConfirmRestore(null);
      await Promise.all([onRefreshDashboard(), refreshAccessState(true)]);
    } else {
      onNotice(false, res.error || 'Gagal memulihkan cadangan database.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Soft-Delete Archive Bin */}
      <div className="p-4 rounded-xl bg-slate-800/45 border border-slate-700/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Arsip Sementara · Soft-Delete ({softDeletedItems.length} Data)
              </h3>
              <p className="text-[11px] text-slate-400">
                Data yang dihapus masuk ke arsip sementara terlebih dahulu agar terhindar dari penghapusan tidak sengaja.
              </p>
            </div>
          </div>
        </div>

        {softDeletedItems.length === 0 ? (
          <div className="p-5 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
            Arsip sementara kosong. Tidak ada data terhapus saat ini.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Judul / Nama Data</th>
                  <th className="px-4 py-2.5 font-semibold">Asal Tabel</th>
                  <th className="px-4 py-2.5 font-semibold">Dihapus Oleh & Waktu</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Aksi Pemulihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                {softDeletedItems.map(item => (
                  <tr key={item.trashId} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2.5">
                      <p className="font-bold text-white">{item.itemTitle}</p>
                      <p className="text-[11px] font-mono text-slate-400">ID Asal: {item.originalId}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-mono text-[11px]">
                        {item.sourceCollection}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-300">
                      <p>{item.deletedBy}</p>
                      <p className="text-slate-400">{formatDateTimeId(item.deletedAt)}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        disabled={restoringTrashId === item.trashId}
                        onClick={() => handleRestoreTrashItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Pulihkan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPurgeConfirmItem(item);
                          setPurgeConfirmText('');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus Permanen</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Scheduled & Manual Backup + Restore */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-t border-slate-800 pt-5">
        {/* Backup Actions */}
        <form
          onSubmit={handleCreateManualBackup}
          className="p-4 rounded-xl bg-slate-800/45 border border-slate-700/80 space-y-3"
        >
          <div className="flex items-center gap-2">
            <HardDriveDownload className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Cadangan Manual & Ekspor JSON</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Simpan titik pemulihan langsung di server Database Admin atau unduh file cadangan lengkap ke komputer Anda.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={backupLabel}
              onChange={e => setBackupLabel(e.target.value)}
              placeholder="Label snapshot (opsional, misal: Sebelum Tutup Bulan)"
              className="flex-1 min-w-[200px] px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
            <button
              type="submit"
              disabled={creatingBackup}
              className="px-3.5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white rounded-lg cursor-pointer"
            >
              {creatingBackup ? 'Menyimpan...' : 'Buat Snapshot'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={downloadingBackup}
              onClick={handleDownloadJson}
              className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{downloadingBackup ? 'Mengunduh...' : 'Unduh File Backup (.json)'}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleUploadFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Pulihkan dari File (.json)</span>
            </button>
          </div>
        </form>

        {/* Backup Schedule */}
        <form
          onSubmit={handleSaveSchedule}
          className="p-4 rounded-xl bg-slate-800/45 border border-slate-700/80 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Jadwal Pencadangan Berkala</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Sistem membuat cadangan internal secara berkala agar data aman selama operasional 24 jam.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={e => setScheduleEnabled(e.target.checked)}
              />
              <span>Aktifkan Backup Berkala</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Setiap</span>
              <input
                type="number"
                min={1}
                max={720}
                value={intervalHours}
                onChange={e => setIntervalHours(e.target.value)}
                className="w-20 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white tabular-nums"
              />
              <span className="text-xs text-slate-400">Jam</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-slate-400">
              Cadangan otomatis terakhir: {formatDateTimeId(schedule.lastBackupAt)}
            </span>
            <button
              type="submit"
              disabled={savingSchedule}
              className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-lg cursor-pointer"
            >
              {savingSchedule ? 'Menyimpan...' : 'Simpan Jadwal'}
            </button>
          </div>
        </form>
      </div>

      {/* Snapshots Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-300" />
          <h3 className="text-sm font-bold text-white">
            Riwayat Snapshot Server ({backups.length} Titik Pemulihan)
          </h3>
        </div>
        {backups.length === 0 ? (
          <div className="p-5 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
            Belum ada snapshot cadangan tersimpan.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Label & Jenis</th>
                  <th className="px-4 py-2.5 font-semibold">Waktu & Pembuat</th>
                  <th className="px-4 py-2.5 font-semibold">Ukuran & Record</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Pemulihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                {backups.map(b => (
                  <tr key={b.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2.5">
                      <p className="font-bold text-white">{b.label}</p>
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-sky-300">
                        {b.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-300">
                      <p>{formatDateTimeId(b.createdAt)}</p>
                      <p className="text-slate-400">Oleh {b.createdBy} · #{b.checksum?.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-[11px] text-slate-200">
                      <p className="font-semibold">{formatBytes(b.sizeBytes)}</p>
                      <p className="text-slate-400">{b.totalRecords.toLocaleString('id-ID')} baris</p>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmRestore({
                            mode: 'snapshot',
                            backupMeta: b,
                            confirmText: ''
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Pulihkan</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Layered 2-Step Confirm Purge Modal */}
      {purgeConfirmItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-4">
          <form
            onSubmit={handlePurgeTrashConfirmed}
            className="w-full max-w-md bg-slate-900 border border-rose-500/50 rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Konfirmasi Hapus Permanen</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Anda akan menghapus permanen <strong>{purgeConfirmItem.itemTitle}</strong>. Aksi ini tidak bisa dibatalkan.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-rose-200 mb-1">
                Ketik <span className="font-mono font-bold">HAPUS</span> untuk melanjutkan:
              </label>
              <input
                type="text"
                autoFocus
                required
                value={purgeConfirmText}
                onChange={e => setPurgeConfirmText(e.target.value)}
                placeholder="HAPUS"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-rose-500/40 rounded-lg text-white font-mono"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPurgeConfirmItem(null)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={purgingTrash || purgeConfirmText.trim().toUpperCase() !== 'HAPUS'}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg cursor-pointer"
              >
                {purgingTrash ? 'Menghapus...' : 'Hapus Permanen'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Layered Confirm Restore Backup Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-4">
          <form
            onSubmit={handleExecuteRestoreBackup}
            className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Konfirmasi Pemulihan Database</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Seluruh data aktif akan dikembalikan sesuai{' '}
                  <strong>
                    {confirmRestore.mode === 'snapshot'
                      ? confirmRestore.backupMeta?.label
                      : confirmRestore.fileName}
                  </strong>
                  . Sistem otomatis menyimpan snapshot kondisi saat ini sebelum memulihkan.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-amber-200 mb-1">
                Ketik <span className="font-mono font-bold">PULIHKAN</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                autoFocus
                required
                value={confirmRestore.confirmText}
                onChange={e =>
                  setConfirmRestore(prev => (prev ? { ...prev, confirmText: e.target.value } : null))
                }
                placeholder="PULIHKAN"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-amber-500/40 rounded-lg text-white font-mono"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmRestore(null)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={restoringBackup || confirmRestore.confirmText.trim().toUpperCase() !== 'PULIHKAN'}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-lg cursor-pointer"
              >
                {restoringBackup ? 'Memulihkan...' : 'Pulihkan Database Sekarang'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
