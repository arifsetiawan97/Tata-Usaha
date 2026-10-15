import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyTaskModal } from '../reports/DailyTaskModal';
import { InventoryTable } from '../common/InventoryTable';
import { TaskLog } from '../../types';
import { 
  FlaskConical, 
  Microscope, 
  ShieldAlert, 
  Boxes, 
  CalendarClock, 
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
  Wrench,
  Flame,
  ZoomIn,
  X
} from 'lucide-react';

export const LabIpaView: React.FC = () => {
  const { tasks, deleteTask, inventories } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState<'template' | 'manual'>('template');
  const [editingTask, setEditingTask] = useState<TaskLog | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const labTasks = tasks.filter(t => t.role === 'LAB_IPA');

  const filteredTasks = labTasks.filter(t => {
    if (activeCategory === 'semua') return true;
    return t.category === activeCategory;
  });

  // Calculate Automated Analytics
  const totalTasks = labTasks.length;
  const completedTasks = labTasks.filter(t => t.status === 'selesai').length;
  const inProgressTasks = labTasks.filter(t => t.status === 'dalam_proses').length;

  const praktikumTasks = labTasks.filter(t => t.category === 'persiapan_praktikum').length;
  const pemeliharaanTasks = labTasks.filter(t => t.category === 'pemeliharaan_alat').length;
  const inventarisBahanTasks = labTasks.filter(t => t.category === 'inventaris_bahan').length;
  const k3Tasks = labTasks.filter(t => t.category === 'k3_laboratorium').length;
  const jadwalLabTasks = labTasks.filter(t => t.category === 'jadwal_lab').length;
  const perbaikanTasks = labTasks.filter(t => t.category === 'perbaikan_alat').length;

  const labInventories = inventories.filter(i => i.role === 'LAB_IPA');
  const invBaik = labInventories.filter(i => i.kondisi === 'Baik').length;
  const invRate = labInventories.length > 0 ? Math.round((invBaik / labInventories.length) * 100) : 100;

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-teal-950 to-cyan-950 text-white rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-5 h-5 text-teal-400" />
            <h1 className="text-lg sm:text-xl font-bold">Layanan Operasional Laboratorium IPA</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Penyiapan alat & bahan praktikum fisika/biologi, pencucian alat gelas kimia, kalibrasi mikroskop & neraca, pengelolaan kartu stok reagen B3, serta penerapan standar keselamatan kerja (K3).
          </p>
        </div>

        {/* Dual Action Buttons: Template vs Manual */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleAddNewWithMode('template')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-lg transition-all shadow-sm cursor-pointer"
            title="Pilih pekerjaan praktikum lab standar dan otomatis isi form"
          >
            <Sparkles className="w-4 h-4 text-teal-200" />
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

      {/* AUTOMATIC ANALYTICS SECTION */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-700" />
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">
              Analisis Otomatis Operasional Laboratorium IPA
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
            Kalkulasi Real-time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Sesi Praktikum & Preparasi */}
          <div className="p-4 rounded-lg bg-teal-50/70 border border-teal-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-900">Sesi Praktikum Siswa</span>
              <FlaskConical className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-teal-950">{praktikumTasks}</span>
              <span className="text-xs text-teal-700 font-medium">sesi terlaksana</span>
            </div>
            <p className="text-[11px] text-teal-600/90 mt-1">
              Fisika, Biologi sel, & uji nutrisi makanan
            </p>
          </div>

          {/* Card 2: Alat Optik & Kalibrasi */}
          <div className="p-4 rounded-lg bg-cyan-50/70 border border-cyan-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-900">Alat Optik & Kalibrasi</span>
              <Microscope className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-950">{pemeliharaanTasks + perbaikanTasks}</span>
              <span className="text-xs text-cyan-700 font-medium">tindakan</span>
            </div>
            <p className="text-[11px] text-cyan-600/90 mt-1">
              Mikroskop, alat gelas & neraca Ohaus
            </p>
          </div>

          {/* Card 3: Standar K3 & Netralisasi Limbah */}
          <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">K3 & Penanganan Limbah</span>
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-950">{k3Tasks}</span>
              <span className="text-xs text-amber-700 font-medium">kegiatan K3</span>
            </div>
            <p className="text-[11px] text-amber-600/90 mt-1">
              Inspeksi APAR, P3K & netralisasi pH limbah
            </p>
          </div>

          {/* Card 4: Kesiapan Sarpras & Reagen */}
          <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">Sarpras Laboratorium</span>
              <Boxes className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-950">{invRate}%</span>
              <span className="text-xs text-emerald-700 font-medium">laik praktikum</span>
            </div>
            <p className="text-[11px] text-emerald-600/90 mt-1">
              {invBaik} dari {labInventories.length} item instrumen siap guna
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
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Semua Kegiatan ({totalTasks})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('persiapan_praktikum')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'persiapan_praktikum'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Persiapan Praktikum ({praktikumTasks})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('pemeliharaan_alat')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'pemeliharaan_alat'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Pemeliharaan Alat Gelas ({pemeliharaanTasks})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('inventaris_bahan')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'inventaris_bahan'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Bahan Kimia & Reagen ({inventarisBahanTasks})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('k3_laboratorium')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'k3_laboratorium'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          K3 & Limbah Lab ({k3Tasks})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('jadwal_lab')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'jadwal_lab'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Jadwal & Jurnal ({jadwalLabTasks})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('perbaikan_alat')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'perbaikan_alat'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Kalibrasi & Perbaikan ({perbaikanTasks})
        </button>
      </div>

      {/* TASKS LIST */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Belum ada tugas operasional lab IPA</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Gunakan tombol Template Otomatis (1-Klik) untuk memilih pekerjaan persiapan praktikum dan perawatan laboratorium siap pakai.
            </p>
            <button
              type="button"
              onClick={() => handleAddNewWithMode('template')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white font-semibold text-xs rounded-lg hover:bg-teal-700"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gunakan Template Pekerjaan</span>
            </button>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 hover:border-teal-300 transition-all shadow-2xs hover:shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
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

                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
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
                  <div className="flex items-center gap-1 font-semibold text-teal-700">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Vol: {task.volumeUnit}</span>
                  </div>
                </div>

                {task.notes && (
                  <div className="p-2 bg-teal-50/50 rounded-lg text-teal-900 text-[11px] border border-teal-100/80">
                    <span className="font-semibold">Catatan Praktikum & K3:</span> {task.notes}
                  </div>
                )}
              </div>

              {/* Photo & Actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {task.photoUrl ? (
                  <button
                    type="button"
                    onClick={() => setPreviewPhotoUrl(task.photoUrl || null)}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-teal-500 cursor-pointer"
                  >
                    <img 
                      src={task.photoUrl} 
                      alt="Dokumentasi Praktikum Lab" 
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
                    className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                    title="Ubah Rincian Tugas"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Hapus tugas pekerjaan laboratorium ini?')) {
                        deleteTask(task.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Tugas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
              alt="Dokumentasi Pekerjaan Laboratorium IPA" 
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
        role="LAB_IPA"
        editingTask={editingTask}
        initialMode={modalInitialMode}
      />
    </div>
  );
};
