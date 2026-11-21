import React, { useMemo, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Database,
  Edit3,
  Inbox,
  Plus,
  Search,
  X,
  XCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storageService';
import { StaffSubmissionItem } from '../../types';
import { formatDateTimeId, ROLE_LABELS_MAP } from './adminFormatters';

interface AdminDataGovernanceTabProps {
  onNotice: (ok: boolean, text: string) => void;
  onRefreshDashboard: () => Promise<boolean>;
}

const EDITABLE_COLLECTIONS: { code: string; label: string }[] = [
  { code: 'tasks', label: 'Jurnal Tugas Harian (tasks)' },
  { code: 'inventories', label: 'Inventaris Sarpras (inventories)' },
  { code: 'libraryBooks', label: 'Koleksi Buku Perpustakaan (libraryBooks)' },
  { code: 'libraryMembers', label: 'Anggota Perpustakaan (libraryMembers)' },
  { code: 'monthlyReports', label: 'Laporan Bulanan (monthlyReports)' },
  { code: 'annualReports', label: 'Laporan Tahunan (annualReports)' },
  { code: 'archives', label: 'Arsip Dokumen Resmi (archives)' },
  { code: 'beritaAcaraHistory', label: 'Riwayat Berita Acara TU (beritaAcaraHistory)' },
  { code: 'customCategories', label: 'Kategori Tugas Kustom (customCategories)' }
];

function summarizeRecord(item: any): { title: string; subtitle: string } {
  if (!item || typeof item !== 'object') {
    return { title: String(item || '-'), subtitle: '' };
  }
  const title =
    item.title ||
    item.namaBarang ||
    item.judul ||
    item.nama ||
    item.templateTitle ||
    item.name ||
    item.nomorSurat ||
    item.id ||
    'Data Tanpa Judul';
  const parts = [
    item.role ? ROLE_LABELS_MAP[item.role as keyof typeof ROLE_LABELS_MAP] || item.role : '',
    item.date || item.tanggalMasuk || item.tanggalSurat || (item.month && item.year ? `${item.month}/${item.year}` : item.year || ''),
    item.petugas || item.penulis || item.operatorName || item.kodeBarang || item.kodeBuku || item.nomorAnggota || ''
  ].filter(Boolean);
  return {
    title: String(title),
    subtitle: parts.join(' · ')
  };
}

export const AdminDataGovernanceTab: React.FC<AdminDataGovernanceTabProps> = ({
  onNotice,
  onRefreshDashboard
}) => {
  const {
    tasks,
    inventories,
    libraryBooks,
    libraryMembers,
    monthlyReports,
    annualReports,
    archives,
    beritaAcaraHistory,
    customCategories,
    adminDashboardData,
    refreshAccessState
  } = useApp();

  const [selectedCollection, setSelectedCollection] = useState<string>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingSubId, setProcessingSubId] = useState<string | null>(null);
  const [rejectModalSub, setRejectModalSub] = useState<{ item: StaffSubmissionItem; reason: string } | null>(null);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  // CRUD Modal (Create / Edit JSON)
  const [recordEditor, setRecordEditor] = useState<{
    mode: 'create' | 'edit';
    id?: string;
    jsonText: string;
  } | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);

  // Soft delete confirmation
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<{ id: string; label: string } | null>(null);
  const [softDeleting, setSoftDeleting] = useState(false);

  const customDbOptions = useMemo(
    () =>
      (adminDashboardData.customDatabases || []).map(db => ({
        code: db.code,
        label: `${db.name} (${db.code}) · Kustom`
      })),
    [adminDashboardData.customDatabases]
  );

  const allCollectionOptions = useMemo(
    () => [...EDITABLE_COLLECTIONS, ...customDbOptions],
    [customDbOptions]
  );

  const activeRecords: any[] = useMemo(() => {
    switch (selectedCollection) {
      case 'tasks':
        return tasks;
      case 'inventories':
        return inventories;
      case 'libraryBooks':
        return libraryBooks;
      case 'libraryMembers':
        return libraryMembers;
      case 'monthlyReports':
        return monthlyReports;
      case 'annualReports':
        return annualReports;
      case 'archives':
        return archives;
      case 'beritaAcaraHistory':
        return beritaAcaraHistory;
      case 'customCategories':
        return customCategories;
      default:
        return adminDashboardData.customDatabaseRecords?.[selectedCollection] || [];
    }
  }, [
    selectedCollection,
    tasks,
    inventories,
    libraryBooks,
    libraryMembers,
    monthlyReports,
    annualReports,
    archives,
    beritaAcaraHistory,
    customCategories,
    adminDashboardData.customDatabaseRecords
  ]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return activeRecords;
    const q = searchQuery.toLowerCase();
    return activeRecords.filter(r => JSON.stringify(r).toLowerCase().includes(q));
  }, [activeRecords, searchQuery]);

  const submissions = adminDashboardData.staffSubmissions || [];
  const pendingSubmissions = submissions.filter(s => s.status === 'PENDING_ADMIN_REVIEW');

  const handleApproveSubmission = async (sub: StaffSubmissionItem) => {
    if (processingSubId) return;
    setProcessingSubId(sub.id);
    const res = await storageService.adminApproveSubmission(sub.id);
    setProcessingSubId(null);
    if (res.ok) {
      onNotice(true, res.data?.message || 'Ajuan operator disetujui dan disimpan ke Database Admin.');
      await Promise.all([onRefreshDashboard(), refreshAccessState(true)]);
    } else {
      onNotice(false, res.error || 'Gagal menyetujui ajuan.');
    }
  };

  const handleRejectSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalSub || processingSubId) return;
    setProcessingSubId(rejectModalSub.item.id);
    const res = await storageService.adminRejectSubmission(rejectModalSub.item.id, rejectModalSub.reason);
    setProcessingSubId(null);
    if (res.ok) {
      onNotice(true, res.data?.message || 'Ajuan operator ditolak.');
      setRejectModalSub(null);
      await onRefreshDashboard();
    } else {
      onNotice(false, res.error || 'Gagal menolak ajuan.');
    }
  };

  const openCreateRecordModal = () => {
    const templateMap: Record<string, any> = {
      tasks: {
        role: 'TU',
        date: new Date().toISOString().split('T')[0],
        category: 'surat_masuk',
        taskType: 'pokok',
        title: 'Judul tugas baru',
        description: 'Uraian singkat pelaksanaan tugas',
        location: 'Ruang TU',
        timeStart: '08:00',
        timeEnd: '09:00',
        status: 'selesai',
        volumeUnit: '1 Dokumen',
        petugas: 'Operator TU'
      },
      inventories: {
        role: 'TU',
        kodeBarang: 'INV-BARU-01',
        namaBarang: 'Nama barang inventaris',
        merkModel: '-',
        kategori: 'Perlengkapan',
        jumlah: 1,
        satuan: 'Unit',
        kondisi: 'Baik',
        lokasiPenyimpanan: 'Gudang / Ruang Kerja',
        tahunPengadaan: new Date().getFullYear(),
        keterangan: ''
      }
    };
    const initialObj = templateMap[selectedCollection] || {
      judul: 'Data Baru',
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: ''
    };
    setRecordEditor({
      mode: 'create',
      jsonText: JSON.stringify(initialObj, null, 2)
    });
  };

  const handleSaveRecordEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordEditor || savingRecord) return;
    let parsed: any;
    try {
      parsed = JSON.parse(recordEditor.jsonText);
    } catch {
      onNotice(false, 'Format JSON tidak valid. Periksa tanda kutip atau koma sebelum menyimpan.');
      return;
    }

    setSavingRecord(true);
    const res =
      recordEditor.mode === 'create'
        ? await storageService.adminCreateRecord(selectedCollection, parsed)
        : await storageService.adminUpdateRecord(selectedCollection, recordEditor.id || parsed.id, parsed);
    setSavingRecord(false);

    if (res.ok) {
      onNotice(
        true,
        res.data?.message ||
          (recordEditor.mode === 'create'
            ? 'Data baru berhasil divalidasi dan disimpan ke Database Admin.'
            : 'Perubahan data berhasil disimpan.')
      );
      setRecordEditor(null);
      await Promise.all([onRefreshDashboard(), refreshAccessState(true)]);
    } else {
      onNotice(false, res.error || 'Gagal menyimpan data ke Database Admin.');
    }
  };

  const handleConfirmSoftDelete = async () => {
    if (!confirmSoftDelete || softDeleting) return;
    setSoftDeleting(true);
    const res = await storageService.adminSoftDeleteRecord(selectedCollection, confirmSoftDelete.id);
    setSoftDeleting(false);
    if (res.ok) {
      onNotice(true, res.data?.message || 'Data dipindahkan ke Arsip Sementara (Soft-Delete) dan dapat dipulihkan.');
      setConfirmSoftDelete(null);
      await Promise.all([onRefreshDashboard(), refreshAccessState(true)]);
    } else {
      onNotice(false, res.error || 'Gagal mengarsipkan data.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Staff Submission Approval Queue */}
      <div className="p-4 rounded-xl bg-slate-800/45 border border-slate-700/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Antrean Ajuan Data dari Operator Layanan ({pendingSubmissions.length} Menunggu)
              </h3>
              <p className="text-[11px] text-slate-400">
                Pengguna non-admin tidak dapat menulis langsung ke Database Admin. Semua ajuan masuk ke sini untuk ditinjau & disahkan Admin.
              </p>
            </div>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="p-5 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
            Belum ada ajuan perubahan data dari operator layanan.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {submissions.slice(0, 40).map(sub => {
              const isPending = sub.status === 'PENDING_ADMIN_REVIEW';
              const isExpanded = expandedSubId === sub.id;
              return (
                <div
                  key={sub.id}
                  className={`p-3 rounded-xl border text-xs space-y-2 ${
                    isPending
                      ? 'bg-amber-500/10 border-amber-500/35'
                      : sub.status === 'APPROVED_APPLIED'
                      ? 'bg-emerald-500/5 border-slate-800'
                      : 'bg-rose-500/5 border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white">{sub.submittedByName || sub.submittedBy}</span>
                        <span className="font-mono text-[11px] text-slate-400">@{sub.submittedBy}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                          {ROLE_LABELS_MAP[sub.role] || sub.role}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 text-[10px] font-mono">
                          {sub.operationType} → {sub.targetCollection}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Dikirim {formatDateTimeId(sub.submittedAt)}
                        {sub.note ? ` · Catatan: ${sub.note}` : ''}
                      </p>
                      {sub.rejectReason && (
                        <p className="text-[11px] text-rose-300">Alasan penolakan: {sub.rejectReason}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
                      >
                        {isExpanded ? 'Tutup Detail' : 'Lihat Isi'}
                      </button>
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            disabled={processingSubId === sub.id}
                            onClick={() => handleApproveSubmission(sub)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui & Simpan</span>
                          </button>
                          <button
                            type="button"
                            disabled={processingSubId === sub.id}
                            onClick={() => setRejectModalSub({ item: sub, reason: '' })}
                            className="px-3 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-500 disabled:opacity-60 text-white font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sub.status === 'APPROVED_APPLIED'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {sub.status === 'APPROVED_APPLIED' ? 'DISETUJUI' : 'DITOLAK'}
                        </span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                      {JSON.stringify(sub.payload, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Centralized Database Record Manager */}
      <div className="space-y-3 border-t border-slate-800 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">
              Kelola Data Database Admin ({filteredRecords.length} Baris)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <select
              value={selectedCollection}
              onChange={e => setSelectedCollection(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold"
            >
              {allCollectionOptions.map(opt => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari isi data..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500"
              />
            </div>
            <button
              type="button"
              onClick={openCreateRecordModal}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Record</span>
            </button>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400">
            Belum ada data pada tabel <span className="font-mono text-slate-300">{selectedCollection}</span>.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">ID Record</th>
                  <th className="px-4 py-2.5 font-semibold">Ringkasan Data</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Aksi Admin (Validasi & Soft-Delete)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                {filteredRecords.slice(0, 100).map((item, idx) => {
                  const summary = summarizeRecord(item);
                  const rowId = item?.id || `row_${idx}`;
                  return (
                    <tr key={rowId} className="hover:bg-slate-800/40 align-top">
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {rowId}
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-bold text-white">{summary.title}</p>
                        {summary.subtitle && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{summary.subtitle}</p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setRecordEditor({
                              mode: 'edit',
                              id: rowId,
                              jsonText: JSON.stringify(item, null, 2)
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Ubah</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmSoftDelete({ id: rowId, label: summary.title })}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Archive className="w-3 h-3" />
                          <span>Arsipkan</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filteredRecords.length > 100 && (
          <p className="text-[11px] text-slate-400">
            Menampilkan 100 dari {filteredRecords.length} baris. Gunakan kotak pencarian untuk menyaring data spesifik.
          </p>
        )}
      </div>

      {/* Reject Submission Reason Modal */}
      {rejectModalSub && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4">
          <form
            onSubmit={handleRejectSubmission}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            <h4 className="text-sm font-bold text-white">Tolak Ajuan Operator</h4>
            <p className="text-xs text-slate-300">
              Berikan alasan singkat mengapa ajuan dari <strong>@{rejectModalSub.item.submittedBy}</strong> ditolak:
            </p>
            <input
              type="text"
              value={rejectModalSub.reason}
              onChange={e =>
                setRejectModalSub(prev => (prev ? { ...prev, reason: e.target.value } : null))
              }
              placeholder="Contoh: Data duplikat atau nomor surat belum sesuai..."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalSub(null)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!!processingSubId}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg cursor-pointer"
              >
                Tolak Ajuan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* JSON Record Create/Edit Modal */}
      {recordEditor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-4">
          <form
            onSubmit={handleSaveRecordEditor}
            className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">
                {recordEditor.mode === 'create'
                  ? `Tambah Record ke ${selectedCollection}`
                  : `Ubah Record (${recordEditor.id})`}
              </h4>
              <button
                type="button"
                onClick={() => setRecordEditor(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Data akan divalidasi skema & tipe datanya oleh server Database Admin sebelum disimpan.
            </p>
            <textarea
              rows={14}
              value={recordEditor.jsonText}
              onChange={e =>
                setRecordEditor(prev => (prev ? { ...prev, jsonText: e.target.value } : null))
              }
              className="w-full p-3 text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl text-emerald-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRecordEditor(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingRecord}
                className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white rounded-lg cursor-pointer"
              >
                {savingRecord ? 'Memvalidasi & Menyimpan...' : 'Simpan ke Database Admin'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Soft-Delete Modal */}
      {confirmSoftDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-white">Pindahkan ke Arsip Sementara (Soft-Delete)?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Data <strong>{confirmSoftDelete.label}</strong> akan dipindahkan dari tabel aktif{' '}
                <span className="font-mono text-amber-300">{selectedCollection}</span> ke menu{' '}
                <strong>Arsip & Backup</strong>. Data tidak hilang permanen dan masih dapat dipulihkan kapan saja.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmSoftDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={softDeleting}
                onClick={handleConfirmSoftDelete}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 rounded-lg cursor-pointer"
              >
                {softDeleting ? 'Mengarsipkan...' : 'Ya, Pindahkan ke Arsip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
