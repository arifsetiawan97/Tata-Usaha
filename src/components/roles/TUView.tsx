import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyTaskModal } from '../reports/DailyTaskModal';
import { InventoryTable } from '../common/InventoryTable';
import { TaskLog } from '../../types';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  Boxes, 
  Inbox, 
  SendHorizontal, 
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
  DollarSign,
  Archive,
  Database,
  Briefcase,
  Camera,
  PenTool,
  Image as ImageIcon,
  ZoomIn,
  X
} from 'lucide-react';

export const TUView: React.FC = () => {
  const { tasks, deleteTask, inventories } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState<'template' | 'manual'>('template');
  const [editingTask, setEditingTask] = useState<TaskLog | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const tuTasks = tasks.filter(t => t.role === 'TU');

  const filteredTasks = tuTasks.filter(t => {
    if (activeCategory === 'semua') return true;
    return t.category === activeCategory;
  });

  // Calculate Automated Analytics
  const totalTasks = tuTasks.length;
  const completedTasks = tuTasks.filter(t => t.status === 'selesai').length;
  const inProgressTasks = tuTasks.filter(t => t.status === 'dalam_proses').length;

  const kepegawaianTasks = tuTasks.filter(t => t.category === 'kepegawaian').length;
  const siswaTasks = tuTasks.filter(t => t.category === 'siswa').length;
  const saprasTasks = tuTasks.filter(t => t.category === 'sapras').length;
  const suratMasukTasks = tuTasks.filter(t => t.category === 'surat_masuk').length;
  const suratKeluarTasks = tuTasks.filter(t => t.category === 'surat_keluar').length;
  const keuanganTasks = tuTasks.filter(t => t.category === 'keuangan_bos').length;
  const kearsipanTasks = tuTasks.filter(t => t.category === 'kearsipan').length;
  const dapodikTasks = tuTasks.filter(t => t.category === 'dapodik').length;
  const layananUmumTasks = tuTasks.filter(t => t.category === 'layanan_umum').length;

  const tuInventories = inventories.filter(i => i.role === 'TU');
  const invBaik = tuInventories.filter(i => i.kondisi === 'Baik').length;
  const invRate = tuInventories.length > 0 ? Math.round((invBaik / tuInventories.length) * 100) : 100;

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-sky-950 to-blue-950 text-white rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-sky-400" />
            <h1 className="text-lg sm:text-xl font-bold">Layanan Operasional Tata Usaha (TU)</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Administrasi perkantoran (kepegawaian, kesiswaan, keuangan BOS), kearsipan, Dapodik, inventarisasi sapras, serta persuratan dinas.
          </p>
        </div>

        {/* Dual Action Buttons: Template vs Manual */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleAddNewWithMode('template')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-lg transition-all shadow-sm cursor-pointer"
            title="Pilih pekerjaan standar dan otomatis isi form"
          >
            <Sparkles className="w-4 h-4 text-sky-200" />
            <span>Template Otomatis (1-Klik)</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddNewWithMode('manual')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all border border-slate-700 shadow-sm cursor-pointer"
            title="Ketik formulir secara manual dan bebas"
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
            <BarChart3 className="w-5 h-5 text-sky-700" />
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">
              Analisis Otomatis Kinerja Tata Usaha
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
            Kalkulasi Real-time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Persuratan & Disposisi */}
          <div className="p-4 rounded-lg bg-sky-50/60 border border-sky-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-900">Tata Kelola Persuratan</span>
              <FileCheck2 className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-extrabold text-sky-950 mt-1">
              {suratMasukTasks + suratKeluarTasks} Dokumen
            </p>
            <p className="text-[11px] text-sky-800 mt-1">
              {suratMasukTasks} Surat Masuk · {suratKeluarTasks} Surat Keluar
            </p>
          </div>

          {/* Card 2: Layanan Siswa & Keuangan BOS */}
          <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">Kesiswaan & Keuangan</span>
              <GraduationCap className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-950 mt-1">
              {siswaTasks + keuanganTasks} Agenda
            </p>
            <p className="text-[11px] text-emerald-800 mt-1">
              {siswaTasks} Layanan Siswa · {keuanganTasks} SPJ/BKU BOS
            </p>
          </div>

          {/* Card 3: Kepegawaian & Dapodik */}
          <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900">Kepegawaian & Dapodik</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-extrabold text-indigo-950 mt-1">
              {kepegawaianTasks + dapodikTasks} Berkas
            </p>
            <p className="text-[11px] text-indigo-800 mt-1">
              {kepegawaianTasks} ASN/GTK · {dapodikTasks} Validasi Dapodik
            </p>
          </div>

          {/* Card 4: Kelaikan Aset & Kearsipan */}
          <div className="p-4 rounded-lg bg-violet-50/60 border border-violet-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-violet-900">Aset Sapras & Arsip</span>
              <PieChart className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-2xl font-extrabold text-violet-950 mt-1">{invRate}%</p>
            <p className="text-[11px] text-violet-800 mt-1">
              {invBaik} dari {tuInventories.length} TIK baik · {kearsipanTasks} arsip odner
            </p>
          </div>
        </div>

        {/* Narrative Automated Insight */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">
              Evaluasi Sistem Administrasi Otomatis:
            </p>
            <p className="text-slate-600 leading-relaxed">
              Arsip surat dinas dan penerbitan nomor surat keluar berjalan dengan tertib sesuai tata naskah dinas. Rekonsiliasi BKU BOS dan pemutakhiran data Dapodik telah terintegrasi. Tersedia tombol cepat template tugas otomatis dan input manual bebas untuk memudahkan pencatatan tugas harian.
            </p>
          </div>
        </div>
      </div>

      {/* Submenu Tabs Filter (Expanded categories) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveCategory('semua')}
          className={`px-3.5 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'semua'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Semua Agenda TU ({tuTasks.length})
        </button>

        <button
          onClick={() => setActiveCategory('kepegawaian')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'kepegawaian'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Kepegawaian ({kepegawaianTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('siswa')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'siswa'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Kesiswaan ({siswaTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('keuangan_bos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'keuangan_bos'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Keuangan BOS ({keuanganTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('sapras')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'sapras'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Sapras & Aset ({saprasTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('surat_masuk')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'surat_masuk'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Surat Masuk ({suratMasukTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('surat_keluar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'surat_keluar'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <SendHorizontal className="w-3.5 h-3.5" />
          <span>Surat Keluar ({suratKeluarTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('dapodik')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'dapodik'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Dapodik ({dapodikTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('kearsipan')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'kearsipan'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Kearsipan ({kearsipanTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('layanan_umum')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'layanan_umum'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Layanan Umum ({layananUmumTasks})</span>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Jurnal Tugas Harian Tata Usaha ({filteredTasks.length})
          </h3>
          <span className="text-xs text-slate-500">
            {completedTasks} tuntas · {inProgressTasks} proses
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Belum ada data tugas untuk kategori administrasi ini.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleAddNewWithMode('template')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs"
              >
                + Pilih Template Tugas
              </button>
              <button
                type="button"
                onClick={() => handleAddNewWithMode('manual')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200"
              >
                + Input Manual Bebas
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredTasks.map(task => (
              <div
                key={task.id}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span className="font-semibold text-sky-900 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {task.date}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.timeStart} - {task.timeEnd} WIB
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {task.location}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700 uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                      {task.category.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">
                    {task.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {task.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      Volume: {task.volumeUnit}
                    </span>
                    <span className="text-slate-500">
                      Petugas: {task.petugas}
                    </span>
                    {task.notes && (
                      <span className="italic text-slate-500">
                        ({task.notes})
                      </span>
                    )}

                    {/* Photo Attached Indicator / Thumbnail */}
                    {task.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(task.photoUrl || null)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold text-[10.5px] hover:bg-emerald-100 cursor-pointer transition-colors"
                      >
                        <Camera className="w-3 h-3 text-emerald-600" />
                        <span>Foto Dokumentasi HP ✓</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                    task.status === 'selesai'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : task.status === 'dalam_proses'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {task.status === 'selesai' && <CheckCircle2 className="w-3 h-3" />}
                    {task.status === 'dalam_proses' && <Clock className="w-3 h-3" />}
                    {task.status === 'perlu_tindak_lanjut' && <AlertCircle className="w-3 h-3" />}
                    {task.status === 'selesai' ? 'Selesai' : task.status === 'dalam_proses' ? 'Proses' : 'Tindak Lanjut'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(task)}
                      className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Tugas"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Tugas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inventory Section for TU */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <InventoryTable role="TU" />
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <DailyTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
          role="TU"
          editingTask={editingTask}
          initialMode={modalInitialMode}
        />
      )}

      {/* Photo Preview Modal */}
      {previewPhotoUrl && (
        <div 
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-pointer"
        >
          <div className="relative max-w-xl max-h-[85vh] bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewPhotoUrl} 
              alt="Foto Bukti Dokumentasi" 
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
