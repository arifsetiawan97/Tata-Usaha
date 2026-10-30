import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyTaskModal } from '../reports/DailyTaskModal';
import { InventoryTable } from '../common/InventoryTable';
import { TaskLog } from '../../types';
import { 
  BookOpen, 
  Library, 
  BookMarked, 
  Boxes, 
  QrCode, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BarChart3, 
  Sparkles,
  MapPin,
  Calendar,
  Trash2,
  Edit,
  FileCheck2,
  PieChart,
  Tag,
  PenTool,
  RotateCcw,
  BookCopy,
  Users,
  Search,
  ZoomIn,
  X
} from 'lucide-react';

export const PerpusView: React.FC = () => {
  const { 
    tasks, 
    deleteTask, 
    deleteMultipleTasks,
    inventories, 
    setRoleSubTab, 
    libraryBooks, 
    libraryMemberStats 
  } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState<'template' | 'manual'>('template');
  const [editingTask, setEditingTask] = useState<TaskLog | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const perpusTasks = tasks.filter(t => t.role === 'PERPUS');

  const filteredTasks = perpusTasks.filter(t => {
    if (activeCategory === 'semua') return true;
    return t.category === activeCategory;
  });

  const handleToggleSelectAllTasks = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map(t => t.id));
    }
  };

  const handleToggleSelectTask = (id: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDelete = () => {
    if (selectedTaskIds.length === 0) return;
    deleteMultipleTasks(selectedTaskIds);
    setSelectedTaskIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  // Calculate Automated Analytics
  const totalTasks = perpusTasks.length;
  const completedTasks = perpusTasks.filter(t => t.status === 'selesai').length;
  const inProgressTasks = perpusTasks.filter(t => t.status === 'dalam_proses').length;

  const sirkulasiTasks = perpusTasks.filter(t => t.category === 'sirkulasi_peminjaman').length;
  const katalogTasks = perpusTasks.filter(t => t.category === 'katalogisasi_buku').length;
  const literasiTasks = perpusTasks.filter(t => t.category === 'layanan_literasi').length;
  const perawatanTasks = perpusTasks.filter(t => t.category === 'perawatan_buku').length;
  const stockOpnameTasks = perpusTasks.filter(t => t.category === 'stock_opname').length;
  const adminPerpusTasks = perpusTasks.filter(t => t.category === 'administrasi_perpus').length;

  const perpusInventories = inventories.filter(i => i.role === 'PERPUS');
  const invBaik = perpusInventories.filter(i => i.kondisi === 'Baik').length;
  const invRate = perpusInventories.length > 0 ? Math.round((invBaik / perpusInventories.length) * 100) : 100;

  const handleEdit = (task: TaskLog) => {
    setEditingTask(task);
    setModalInitialMode('manual');
    setIsTaskModalOpen(true);
  };

  const handleAddNewWithMode = (mode: 'template' | 'manual') => {
    setEditingTask(null);
    setModalInitialMode(mode);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h1 className="text-lg sm:text-xl font-bold">Layanan Operasional Perpustakaan Sekolah</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Sirkulasi peminjaman & pengembalian buku, pengolahan klasifikasi DDC/barcode, pelestarian fisik buku, pendampingan gerakan literasi siswa, dan stock opname koleksi.
          </p>
        </div>

        {/* Dual Action Buttons: Template vs Manual */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleAddNewWithMode('template')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-lg transition-all shadow-sm cursor-pointer"
            title="Pilih pekerjaan dinas standar perpustakaan dan otomatis isi form"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>Template Otomatis (1-Klik)</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddNewWithMode('manual')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all border border-slate-700 shadow-sm cursor-pointer"
            title="Ketik formulir pekerjaan secara manual dan bebas"
          >
            <PenTool className="w-4 h-4 text-amber-300" />
            <span>Input Manual Bebas</span>
          </button>
        </div>
      </div>

      {/* QUICK ACCESS TO BOOK INVENTORY & LIBRARY MEMBERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Inventaris Buku & Pengadaan Bulanan */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-5 rounded-2xl shadow-sm border border-emerald-800/40 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Inventarisasi Koleksi
              </span>
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-bold text-base text-white">
              Pendataan Buku & Pengadaan Bulanan
            </h3>
            <p className="text-xs text-emerald-100/70 leading-relaxed">
              Pemisah buku masuk tiap bulan, tracking buku baru yang dibeli sekolah, template 1-klik, dan cetak Berita Acara resmi.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-800/60 flex items-center justify-between">
            <span className="text-xs text-emerald-200 font-semibold">
              {libraryBooks?.length || 0} judul terdaftar
            </span>
            <button
              type="button"
              onClick={() => setRoleSubTab('PERPUS', 'buku')}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              Buka Inventaris Buku &rarr;
            </button>
          </div>
        </div>

        {/* Card 2: Jumlah Anggota Perpustakaan */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-5 rounded-2xl shadow-sm border border-blue-800/40 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Data Pemustaka
              </span>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-bold text-base text-white">
              Jumlah Anggota Perpustakaan
            </h3>
            <p className="text-xs text-blue-100/70 leading-relaxed">
              Pendataan terpisah pemustaka: Guru ({libraryMemberStats?.guruPendidik || 0}), Staff ({libraryMemberStats?.staffTendik || 0}), dan Siswa ({(libraryMemberStats?.siswaLaki || 0) + (libraryMemberStats?.siswaPerempuan || 0)}), dilengkapi cetak kartu anggota.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-800/60 flex items-center justify-between">
            <span className="text-xs text-blue-200 font-semibold">
              Total {(libraryMemberStats?.guruPendidik || 0) + (libraryMemberStats?.staffTendik || 0) + (libraryMemberStats?.siswaLaki || 0) + (libraryMemberStats?.siswaPerempuan || 0)} anggota
            </span>
            <button
              type="button"
              onClick={() => setRoleSubTab('PERPUS', 'anggota')}
              className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              Kelola Anggota &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* AUTOMATIC ANALYTICS SECTION */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-700" />
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">
              Analisis Otomatis Kinerja Layanan Perpustakaan
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
            Kalkulasi Real-time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Sirkulasi & Peminjaman */}
          <div className="p-4 rounded-lg bg-purple-50/70 border border-purple-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-900">Sirkulasi & Peminjaman</span>
              <BookCopy className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-950">{sirkulasiTasks}</span>
              <span className="text-xs text-purple-700 font-medium">layanan aktif</span>
            </div>
            <p className="text-[11px] text-purple-600/90 mt-1">
              Peminjaman buku teks, pengembalian & denda
            </p>
          </div>

          {/* Card 2: Katalogisasi & DDC */}
          <div className="p-4 rounded-lg bg-indigo-50/70 border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900">Pengolahan & DDC</span>
              <QrCode className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-950">{katalogTasks}</span>
              <span className="text-xs text-indigo-700 font-medium">batch buku</span>
            </div>
            <p className="text-[11px] text-indigo-600/90 mt-1">
              Klasifikasi DDC, label barcode & kartu buku
            </p>
          </div>

          {/* Card 3: Literasi & Preservasi */}
          <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">Literasi & Perawatan</span>
              <BookMarked className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-950">{literasiTasks + perawatanTasks}</span>
              <span className="text-xs text-amber-700 font-medium">kegiatan</span>
            </div>
            <p className="text-[11px] text-amber-600/90 mt-1">
              15 mnt GLS & restorasi buku rusak
            </p>
          </div>

          {/* Card 4: Kesiapan Sarpras Perpus */}
          <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">Sarpras Perpustakaan</span>
              <Boxes className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-950">{invRate}%</span>
              <span className="text-xs text-emerald-700 font-medium">kondisi baik</span>
            </div>
            <p className="text-[11px] text-emerald-600/90 mt-1">
              {invBaik} dari {perpusInventories.length} item inventaris laik pakai
            </p>
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER BUTTONS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveCategory('semua')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'semua'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Semua Layanan ({totalTasks})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('sirkulasi_peminjaman')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'sirkulasi_peminjaman'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Sirkulasi Peminjaman ({sirkulasiTasks})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('katalogisasi_buku')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'katalogisasi_buku'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Pengolahan DDC ({katalogTasks})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('layanan_literasi')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'layanan_literasi'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Gerakan Literasi ({literasiTasks})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('perawatan_buku')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'perawatan_buku'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Perawatan Koleksi ({perawatanTasks})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('stock_opname')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'stock_opname'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Stock Opname ({stockOpnameTasks})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('administrasi_perpus')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'administrasi_perpus'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Administrasi & Kartu ({adminPerpusTasks})
        </button>
      </div>

      {/* TASKS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {filteredTasks.length > 0 && (
              <input
                type="checkbox"
                checked={selectedTaskIds.length > 0 && selectedTaskIds.length === filteredTasks.length}
                onChange={handleToggleSelectAllTasks}
                className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer"
                title="Pilih semua tugas pada filter ini"
              />
            )}
            <h3 className="text-sm font-bold text-slate-900">
              Jurnal Tugas Harian Perpustakaan ({filteredTasks.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {completedTasks} selesai · {inProgressTasks} dalam proses
          </span>
        </div>

        {/* Bulk Selection Action Bar */}
        {selectedTaskIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
              <span>{selectedTaskIds.length} tugas perpustakaan dipilih</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Pilihan ({selectedTaskIds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTaskIds([])}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal Pilihan
              </button>
            </div>
          </div>
        )}

        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Belum ada tugas perpustakaan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Gunakan tombol Template Otomatis (1-Klik) untuk memilih pekerjaan perpustakaan siap pakai.
            </p>
            <button
              type="button"
              onClick={() => handleAddNewWithMode('template')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white font-semibold text-xs rounded-lg hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gunakan Template Pekerjaan</span>
            </button>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isSelected = selectedTaskIds.includes(task.id);
            return (
              <div
                key={task.id}
                className={`rounded-xl p-4 sm:p-5 border transition-all shadow-2xs hover:shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                  isSelected ? 'bg-purple-50/60 border-purple-400 ring-1 ring-purple-400' : 'bg-white border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelectTask(task.id)}
                    className="mt-1 w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer shrink-0"
                    title="Pilih tugas ini"
                  />
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                        task.taskType === 'pokok'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {task.taskType === 'pokok' ? '⭐ Tugas Pokok' : '📌 Tugas Tambahan'}
                      </span>

                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {task.category.replace('_', ' ').toUpperCase()}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                        task.status === 'selesai'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'dalam_proses'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {task.status === 'selesai' ? '✓ Selesai 100%' : task.status === 'dalam_proses' ? '⏳ Dalam Proses' : '⚠️ Tindak Lanjut'}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {task.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {task.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11.5px] text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{task.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{task.timeStart} - {task.timeEnd} WIB</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[200px]">{task.location}</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-purple-700">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Vol: {task.volumeUnit}</span>
                      </div>
                    </div>

                    {task.notes && (
                      <div className="p-2 bg-purple-50/50 rounded-lg text-purple-900 text-[11px] border border-purple-100/80">
                        <span className="font-semibold">Catatan Pelaksanaan:</span> {task.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo & Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {task.photoUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewPhotoUrl(task.photoUrl || null)}
                      className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-purple-500 cursor-pointer"
                    >
                      <img 
                        src={task.photoUrl} 
                        alt="Bukti Dokumentasi" 
                        className="w-20 h-16 sm:w-24 sm:h-20 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                        <ZoomIn className="w-4 h-4 mr-1" /> Lihat
                      </div>
                    </button>
                  ) : (
                    <span className="text-[10.5px] text-slate-400 italic bg-slate-50 px-2 py-1 rounded">
                      Tanpa foto
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEdit(task)}
                      className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                      title="Ubah Rincian Tugas"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Tugas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Hapus {selectedTaskIds.length} Tugas Perpustakaan Terpilih?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              Data tugas harian perpustakaan yang dihapus akan dikeluarkan dari rekapitulasi laporan bulanan dan tahunan secara permanen.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus {selectedTaskIds.length} Tugas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhotoUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden p-2" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 right-4 z-10 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewPhotoUrl} 
              alt="Dokumentasi Pekerjaan Perpustakaan" 
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Daily Task Add/Edit Modal */}
      <DailyTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        role="PERPUS"
        editingTask={editingTask}
        initialMode={modalInitialMode}
      />
    </div>
  );
};
