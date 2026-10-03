import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoleType } from '../../types';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  RotateCcw, 
  Shield, 
  Building2, 
  Sparkles, 
  BookmarkCheck, 
  Target, 
  CheckCircle2, 
  AlertCircle,
  FileCheck2,
  Info
} from 'lucide-react';

interface TupoksiManagerViewProps {
  initialRole?: RoleType;
  standalone?: boolean;
}

export const TupoksiManagerView: React.FC<TupoksiManagerViewProps> = ({ 
  initialRole,
  standalone = false 
}) => {
  const { 
    currentRole, 
    tupoksiDefinitions, 
    addTupoksiItem, 
    updateTupoksiItem, 
    deleteTupoksiItem, 
    resetTupoksiToDefault 
  } = useApp();

  const activeRole: RoleType = currentRole || initialRole || 'TU';
  const selectedRole = activeRole;

  // Input states for adding
  const [newPokokText, setNewPokokText] = useState('');
  const [newTambahanText, setNewTambahanText] = useState('');

  // Editing states
  const [editingPokokIndex, setEditingPokokIndex] = useState<number | null>(null);
  const [editingPokokText, setEditingPokokText] = useState('');

  const [editingTambahanIndex, setEditingTambahanIndex] = useState<number | null>(null);
  const [editingTambahanText, setEditingTambahanText] = useState('');

  // Inline delete confirmation states per item (anti-failing, directly visible on the row)
  const [deleteConfirmPokokIdx, setDeleteConfirmPokokIdx] = useState<number | null>(null);
  const [deleteConfirmTambahanIdx, setDeleteConfirmTambahanIdx] = useState<number | null>(null);

  // Delete confirmation state (solves browser confirm block)
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'pokok' | 'tambahan';
    index: number;
    text: string;
  } | null>(null);

  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  const currentDefinitions = tupoksiDefinitions[selectedRole] || { tupoksiList: [], tugasTambahanList: [] };

  const roleTitle = selectedRole === 'TU' 
    ? 'Tata Usaha (Administrasi Sekolah)' 
    : selectedRole === 'PENJAGA' 
    ? 'Penjaga Sekolah (Keamanan & Sapras)' 
    : 'Layanan Kebersihan (Service)';

  const roleTheme = selectedRole === 'TU'
    ? { border: 'border-sky-500', bg: 'bg-sky-50', text: 'text-sky-900', badge: 'bg-sky-100 text-sky-800' }
    : selectedRole === 'PENJAGA'
    ? { border: 'border-blue-600', bg: 'bg-blue-50', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-800' }
    : { border: 'border-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-800' };

  // Handle Add Pokok
  const handleAddPokok = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPokokText.trim()) return;
    addTupoksiItem(selectedRole, 'pokok', newPokokText.trim());
    setNewPokokText('');
    showNotice(`Tugas Pokok baru berhasil ditambahkan ke ${roleTitle}!`);
  };

  // Handle Save Edit Pokok
  const handleSaveEditPokok = (index: number) => {
    if (!editingPokokText.trim()) return;
    updateTupoksiItem(selectedRole, 'pokok', index, editingPokokText.trim());
    setEditingPokokIndex(null);
    setEditingPokokText('');
    showNotice('Perubahan Tugas Pokok berhasil disimpan!');
  };

  // Confirm and Execute Delete (Pokok or Tambahan)
  const confirmDeleteItem = () => {
    if (!itemToDelete) return;
    deleteTupoksiItem(selectedRole, itemToDelete.type, itemToDelete.index);
    showNotice(`Butir ${itemToDelete.type === 'pokok' ? 'Tugas Pokok' : 'Tugas Tambahan'} berhasil dihapus.`);
    setItemToDelete(null);
  };

  // Handle Add Tambahan
  const handleAddTambahan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTambahanText.trim()) return;
    addTupoksiItem(selectedRole, 'tambahan', newTambahanText.trim());
    setNewTambahanText('');
    showNotice(`Tugas Tambahan baru berhasil ditambahkan ke ${roleTitle}!`);
  };

  // Handle Save Edit Tambahan
  const handleSaveEditTambahan = (index: number) => {
    if (!editingTambahanText.trim()) return;
    updateTupoksiItem(selectedRole, 'tambahan', index, editingTambahanText.trim());
    setEditingTambahanIndex(null);
    setEditingTambahanText('');
    showNotice('Perubahan Tugas Tambahan berhasil disimpan!');
  };

  // Handle Reset to Default
  const handleReset = () => {
    resetTupoksiToDefault(selectedRole);
    setConfirmReset(false);
    showNotice(`Daftar tugas ${roleTitle} berhasil dikembalikan ke standar resmi Permendikbud / BKN!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                Kelola Daftar Tugas Pokok (Tupoksi) & Tugas Tambahan
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Tambah, edit, dan hapus rincian tugas pokok kedinasan serta tugas tambahan insidental. 
              Perubahan langsung tersinkronisasi ke <strong>Laporan Bulanan</strong>, <strong>Laporan Tahunan</strong>, dan <strong>Formulir Jurnal Harian</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-lg transition-all cursor-pointer"
                title="Kembalikan daftar tugas ke standar awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standar Permendikbud</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                <span className="text-xs text-rose-800 font-medium">Yakin reset?</span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded cursor-pointer"
                >
                  Ya, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold rounded cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Role Identity Info Bar (Locked to Active Operator) */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Ruang Kerja Khusus:</span>
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${roleTheme.badge} border ${roleTheme.border}`}>
              <span>{roleTitle}</span>
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            <span>{currentDefinitions.tupoksiList.length} Tugas Pokok</span>
            <span className="mx-1.5">·</span>
            <span>{currentDefinitions.tugasTambahanList.length} Tugas Tambahan</span>
          </div>
        </div>
      </div>

      {noticeMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* Main Grid: Kolom 1 (Tugas Pokok) & Kolom 2 (Tugas Tambahan) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================
            KOLOM 1: DAFTAR TUGAS POKOK (TUPOKSI)
            ======================================================== */}
        <div className="bg-white border border-blue-200 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header Kolom */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/70 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-600 text-white">
                  <Target className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-blue-950">
                    Daftar Tugas Pokok (Tupoksi)
                  </h2>
                  <p className="text-[10.5px] text-blue-800">
                    Tugas kedinasan utama {roleTitle}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                {currentDefinitions.tupoksiList.length} Butir
              </span>
            </div>

            {/* Form Tambah Tugas Pokok */}
            <form onSubmit={handleAddPokok} className="p-4 border-b border-slate-100 bg-slate-50/50">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                + Tambah Butir Tugas Pokok Baru:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPokokText}
                  onChange={(e) => setNewPokokText(e.target.value)}
                  placeholder="Contoh: Pengawasan dan pemeliharaan instalasi listrik berkala..."
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newPokokText.trim()}
                  className="flex items-center gap-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            </form>

            {/* List Tugas Pokok */}
            <div className="p-4 space-y-2.5 max-h-[500px] overflow-y-auto">
              {currentDefinitions.tupoksiList.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs italic">
                  Belum ada daftar tugas pokok yang tersimpan. Silakan tambahkan melalui form di atas.
                </div>
              ) : (
                currentDefinitions.tupoksiList.map((item, idx) => {
                  const isEditing = editingPokokIndex === idx;

                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg border transition-all ${
                        isEditing 
                          ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-xs' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-blue-900">
                              Edit Butir Tugas Pokok #{idx + 1}:
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            value={editingPokokText}
                            onChange={(e) => setEditingPokokText(e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-blue-300 rounded text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPokokIndex(null);
                                setEditingPokokText('');
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              <span>Batal</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditPokok(idx)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer"
                            >
                              <Save className="w-3 h-3" />
                              <span>Simpan</span>
                            </button>
                          </div>
                        </div>
                      ) : deleteConfirmPokokIdx === idx ? (
                        <div className="flex items-center justify-between gap-2 p-2 bg-rose-50 border border-rose-300 rounded-lg text-xs animate-fadeIn">
                          <div className="flex items-center gap-1.5 text-rose-900 font-bold min-w-0">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                            <span className="truncate">Hapus Butir #{idx + 1}?</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                deleteTupoksiItem(selectedRole, 'pokok', idx);
                                setDeleteConfirmPokokIdx(null);
                                showNotice(`Butir Tugas Pokok #${idx + 1} berhasil dihapus.`);
                              }}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded cursor-pointer text-xs shadow-2xs"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmPokokIdx(null)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded cursor-pointer text-xs"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-xs text-slate-800 leading-snug break-words">
                              {item}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPokokIndex(idx);
                                setEditingPokokText(item);
                                setDeleteConfirmPokokIdx(null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Edit Tugas Pokok ini"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmPokokIdx(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Hapus Tugas Pokok ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-3 bg-blue-50/40 border-t border-blue-100 text-[11px] text-blue-900 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Tugas pokok ini dijadikan acuan penilaian SPM capaian kinerja utama.</span>
          </div>
        </div>

        {/* ========================================================
            KOLOM 2: DAFTAR TUGAS TAMBAHAN
            ======================================================== */}
        <div className="bg-white border border-amber-200 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header Kolom */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50/70 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-600 text-white">
                  <BookmarkCheck className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-amber-950">
                    Daftar Tugas Tambahan & Insidental
                  </h2>
                  <p className="text-[10.5px] text-amber-800">
                    Tugas penunjang atau perintah pimpinan
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-600 text-white shadow-2xs">
                {currentDefinitions.tugasTambahanList.length} Butir
              </span>
            </div>

            {/* Form Tambah Tugas Tambahan */}
            <form onSubmit={handleAddTambahan} className="p-4 border-b border-slate-100 bg-slate-50/50">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                + Tambah Butir Tugas Tambahan Baru:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTambahanText}
                  onChange={(e) => setNewTambahanText(e.target.value)}
                  placeholder="Contoh: Bantuan logistik rapat dinas dan upacara hari besar..."
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={!newTambahanText.trim()}
                  className="flex items-center gap-1 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            </form>

            {/* List Tugas Tambahan */}
            <div className="p-4 space-y-2.5 max-h-[500px] overflow-y-auto">
              {currentDefinitions.tugasTambahanList.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs italic">
                  Belum ada daftar tugas tambahan yang tersimpan. Silakan tambahkan melalui form di atas.
                </div>
              ) : (
                currentDefinitions.tugasTambahanList.map((item, idx) => {
                  const isEditing = editingTambahanIndex === idx;

                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg border transition-all ${
                        isEditing 
                          ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20 shadow-xs' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-900">
                              Edit Butir Tugas Tambahan #{idx + 1}:
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            value={editingTambahanText}
                            onChange={(e) => setEditingTambahanText(e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-amber-300 rounded text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTambahanIndex(null);
                                setEditingTambahanText('');
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              <span>Batal</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditTambahan(idx)}
                              className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded cursor-pointer"
                            >
                              <Save className="w-3 h-3" />
                              <span>Simpan</span>
                            </button>
                          </div>
                        </div>
                      ) : deleteConfirmTambahanIdx === idx ? (
                        <div className="flex items-center justify-between gap-2 p-2 bg-rose-50 border border-rose-300 rounded-lg text-xs animate-fadeIn">
                          <div className="flex items-center gap-1.5 text-rose-900 font-bold min-w-0">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                            <span className="truncate">Hapus Butir #{idx + 1}?</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                deleteTupoksiItem(selectedRole, 'tambahan', idx);
                                setDeleteConfirmTambahanIdx(null);
                                showNotice(`Butir Tugas Tambahan #${idx + 1} berhasil dihapus.`);
                              }}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded cursor-pointer text-xs shadow-2xs"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmTambahanIdx(null)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded cursor-pointer text-xs"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-xs text-slate-800 leading-snug break-words">
                              {item}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTambahanIndex(idx);
                                setEditingTambahanText(item);
                                setDeleteConfirmTambahanIdx(null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                              title="Edit Tugas Tambahan ini"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmTambahanIdx(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Hapus Tugas Tambahan ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-3 bg-amber-50/40 border-t border-amber-100 text-[11px] text-amber-900 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Tugas tambahan mencatat penugasan swakelola, insidental, atau penugasan khusus kepala sekolah.</span>
          </div>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 uppercase tracking-wider">
          <FileCheck2 className="w-4 h-4" />
          <span>Integrasi Otomatis ke Naskah Dinas & Dokumen Cetak</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Seluruh {currentDefinitions.tupoksiList.length} butir Tugas Pokok dan {currentDefinitions.tugasTambahanList.length} butir Tugas Tambahan untuk {roleTitle} di atas secara otomatis tercantum pada <strong>Bagian II: Standar Tugas Pokok (Tupoksi) & Tugas Tambahan</strong> di Lembar 1 Laporan Bulanan serta berkas cetak PDF kedinasan.
        </p>
      </div>

      {/* In-UI Confirmation Modal for Deleting Tupoksi Item */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Hapus Butir {itemToDelete.type === 'pokok' ? 'Tugas Pokok (Tupoksi)' : 'Tugas Tambahan'}?
                </h3>
                <p className="text-xs text-slate-600">
                  Apakah Anda yakin ingin menghapus butir penugasan berikut dari daftar {roleTitle}?
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 italic mt-2">
                  "{itemToDelete.text}"
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
