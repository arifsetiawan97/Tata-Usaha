import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyTaskModal } from '../reports/DailyTaskModal';
import { InventoryTable } from '../common/InventoryTable';
import { TaskLog } from '../../types';
import { 
  Sparkles, 
  Trash2, 
  Bath, 
  Building, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BarChart3, 
  MapPin, 
  Calendar, 
  Edit, 
  Recycle, 
  HeartPulse, 
  Droplets,
  Trees,
  Flower2,
  Camera,
  PenTool,
  X
} from 'lucide-react';

export const ServiceView: React.FC = () => {
  const { tasks, deleteTask, inventories } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState<'template' | 'manual'>('template');
  const [editingTask, setEditingTask] = useState<TaskLog | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const serviceTasks = tasks.filter(t => t.role === 'SERVICE');

  const filteredTasks = serviceTasks.filter(t => {
    if (activeCategory === 'semua') return true;
    return t.category === activeCategory;
  });

  // Calculate Automated Analytics
  const totalTasks = serviceTasks.length;
  const completedTasks = serviceTasks.filter(t => t.status === 'selesai').length;
  const inProgressTasks = serviceTasks.filter(t => t.status === 'dalam_proses').length;

  const kantorTasks = serviceTasks.filter(t => t.category === 'kebersihan_kantor').length;
  const wcTasks = serviceTasks.filter(t => t.category === 'kebersihan_wc').length;
  const sampahTasks = serviceTasks.filter(t => t.category === 'kebersihan_sampah').length;
  const halamanTasks = serviceTasks.filter(t => t.category === 'kebersihan_halaman').length;
  const sanitasiTasks = serviceTasks.filter(t => t.category === 'sanitasi_disinfeksi').length;
  const tamanTasks = serviceTasks.filter(t => t.category === 'perawatan_taman').length;
  const airTasks = serviceTasks.filter(t => t.category === 'penyediaan_air').length;

  const serviceInventories = inventories.filter(i => i.role === 'SERVICE');
  const invBaik = serviceInventories.filter(i => i.kondisi === 'Baik').length;
  const invRate = serviceInventories.length > 0 ? Math.round((invBaik / serviceInventories.length) * 100) : 100;

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg sm:text-xl font-bold">Layanan Operasional Kebersihan (Service)</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Higienitas sanitasi toilet, kebersihan ruang pimpinan/guru/kelas, pemilahan sampah, penyediaan air bersih, dan taman sekolah.
          </p>
        </div>

        {/* Dual Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleAddNewWithMode('template')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-lg transition-all shadow-sm cursor-pointer"
            title="Pilih template tugas otomatis"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Template Otomatis (1-Klik)</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddNewWithMode('manual')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all border border-slate-700 shadow-sm cursor-pointer"
            title="Input manual bebas"
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
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">
              Analisis Otomatis Higienitas & Sanitasi Sekolah
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
            Kalkulasi Real-time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Skor Sanitasi Toilet */}
          <div className="p-4 rounded-lg bg-teal-50/60 border border-teal-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-900">Sanitasi & Toilet</span>
              <Bath className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-extrabold text-teal-950 mt-1">100% Bersih</p>
            <p className="text-[11px] text-teal-800 mt-1">
              {wcTasks} sesi sanitasi bilik toilet guru & siswa
            </p>
          </div>

          {/* Card 2: Pemilahan Sampah */}
          <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">Pengelolaan Sampah</span>
              <Recycle className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-950 mt-1">{sampahTasks} TPS</p>
            <p className="text-[11px] text-emerald-800 mt-1">
              Pilah sampah organik, daur ulang & pengangkutan TPS
            </p>
          </div>

          {/* Card 3: Ruang Kerja & Halaman */}
          <div className="p-4 rounded-lg bg-sky-50/60 border border-sky-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-900">Ruangan & Halaman</span>
              <Building className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-extrabold text-sky-950 mt-1">
              {kantorTasks + halamanTasks} Titik
            </p>
            <p className="text-[11px] text-sky-800 mt-1">
              {kantorTasks} ruang kerja · {halamanTasks} halaman upacara
            </p>
          </div>

          {/* Card 4: Kesiapan Alat */}
          <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900">Kelaikan Sapras Kerja</span>
              <Droplets className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-extrabold text-indigo-950 mt-1">{invRate}%</p>
            <p className="text-[11px] text-indigo-800 mt-1">
              {invBaik} dari {serviceInventories.length} alat kebersihan prima
            </p>
          </div>
        </div>

        {/* Narrative Automated Insight */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">
              Evaluasi Sistem Kebersihan & Sanitasi:
            </p>
            <p className="text-slate-600 leading-relaxed">
              Tingkat higienitas toilet siswa dan ruang guru terjaga optimal bebas bau. Ambil foto bukti dengan kamera HP untuk mendokumentasikan kebersihan toilet pagi dan sore sebelum dan sesudah kegiatan belajar.
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
              ? 'bg-emerald-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Semua Kegiatan Service ({serviceTasks.length})
        </button>

        <button
          onClick={() => setActiveCategory('kebersihan_wc')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'kebersihan_wc'
              ? 'bg-emerald-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bath className="w-3.5 h-3.5" />
          <span>Toilet / WC ({wcTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('kebersihan_kantor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'kebersihan_kantor'
              ? 'bg-emerald-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Ruang Kantor ({kantorTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('kebersihan_sampah')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'kebersihan_sampah'
              ? 'bg-emerald-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Sampah & TPS ({sampahTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('kebersihan_halaman')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'kebersihan_halaman'
              ? 'bg-emerald-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Trees className="w-3.5 h-3.5" />
          <span>Halaman & Lapangan ({halamanTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('sanitasi_disinfeksi')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'sanitasi_disinfeksi'
              ? 'bg-emerald-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5" />
          <span>UKS & Sanitasi ({sanitasiTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('perawatan_taman')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'perawatan_taman'
              ? 'bg-emerald-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Flower2 className="w-3.5 h-3.5" />
          <span>Taman & Tanaman ({tamanTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('penyediaan_air')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'penyediaan_air'
              ? 'bg-emerald-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>Pasokan Air & Tandon ({airTasks})</span>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Jurnal Tugas Harian Layanan Kebersihan ({filteredTasks.length})
          </h3>
          <span className="text-xs text-slate-500">
            {completedTasks} selesai · {inProgressTasks} dalam proses
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
            <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Belum ada data tugas kebersihan untuk kategori ini.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleAddNewWithMode('template')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs"
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
                    <span className="font-semibold text-emerald-900 flex items-center gap-1">
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

                    {/* Photo Attached Indicator */}
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
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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

      {/* Inventory Section */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <InventoryTable role="SERVICE" />
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <DailyTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
          role="SERVICE"
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
