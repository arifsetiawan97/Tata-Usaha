import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyTaskModal } from '../reports/DailyTaskModal';
import { InventoryTable } from '../common/InventoryTable';
import { TaskLog } from '../../types';
import { TASK_PRESETS, TaskPresetItem } from '../../data/taskPresets';
import { 
  Shield, 
  Wrench, 
  Trees, 
  Eye, 
  Send, 
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
  TrendingUp,
  Moon,
  AlertTriangle,
  UserCheck,
  Camera,
  PenTool,
  DoorClosed,
  X
} from 'lucide-react';

export const PenjagaView: React.FC = () => {
  const { tasks, deleteTask, inventories } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState<'template' | 'manual'>('template');
  const [selectedPreset, setSelectedPreset] = useState<TaskPresetItem | null>(null);
  const [editingTask, setEditingTask] = useState<TaskLog | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const penjagaTasks = tasks.filter(t => t.role === 'PENJAGA');

  const filteredTasks = penjagaTasks.filter(t => {
    if (activeCategory === 'semua') return true;
    return t.category === activeCategory;
  });

  const handleApplyPresetDirectly = (presetKeyword: string) => {
    const penjagaPresets = TASK_PRESETS['PENJAGA'] || [];
    const found = penjagaPresets.find(p => p.title.toLowerCase().includes(presetKeyword.toLowerCase()));
    if (found) {
      setEditingTask(null);
      setSelectedPreset(found);
      setModalInitialMode('template');
      setIsTaskModalOpen(true);
    }
  };

  // Calculate Automated Analytics
  const totalTasks = penjagaTasks.length;
  const completedTasks = penjagaTasks.filter(t => t.status === 'selesai').length;
  const inProgressTasks = penjagaTasks.filter(t => t.status === 'dalam_proses').length;

  const patrolTasks = penjagaTasks.filter(t => t.category === 'keamanan').length;
  const nightRondaTasks = penjagaTasks.filter(t => t.category === 'inspeksi_malam').length;
  const guestTasks = penjagaTasks.filter(t => t.category === 'protokoler_tamu').length;
  const emergencyTasks = penjagaTasks.filter(t => t.category === 'tanggap_darurat').length;
  const saprasTasks = penjagaTasks.filter(t => t.category === 'perbaikan_sapras');
  const saprasCompleted = saprasTasks.filter(t => t.status === 'selesai').length;
  const saprasRate = saprasTasks.length > 0 ? Math.round((saprasCompleted / saprasTasks.length) * 100) : 100;

  const childSafetyTasks = penjagaTasks.filter(t => t.category === 'pengawasan_anak').length;
  const envTasks = penjagaTasks.filter(t => t.category === 'lingkungan').length;
  const mailTasks = penjagaTasks.filter(t => t.category === 'antar_surat').length;

  const penjagaInventories = inventories.filter(i => i.role === 'PENJAGA');
  const invBaik = penjagaInventories.filter(i => i.kondisi === 'Baik').length;
  const invRate = penjagaInventories.length > 0 ? Math.round((invBaik / penjagaInventories.length) * 100) : 100;

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
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg sm:text-xl font-bold">Layanan Operasional Penjaga Sekolah</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Penjagaan keamanan 24 jam, pengawasan keselamatan siswa, perbaikan sarpras ringan, dan ekspedisi kedinasan.
          </p>
        </div>

        {/* Dual Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleAddNewWithMode('template')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-lg transition-all shadow-sm cursor-pointer"
            title="Pilih template tugas otomatis"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
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

      {/* Quick 1-Click Standard Job Templates Toolbar for Penjaga */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/70 to-slate-50 border border-blue-200/90 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-700 text-white rounded-lg shrink-0 shadow-xs">
            <DoorClosed className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
              <span>Template Pekerjaan Standar Penjaga Sekolah</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.2 rounded-full border border-blue-200">Siap Pakai</span>
            </p>
            <p className="text-[11px] text-slate-600">
              Pilih template tugas rutin harian untuk mengisi form kegiatan dinas otomatis dengan 1 klik:
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleApplyPresetDirectly('buka dan tutup')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-blue-100 active:scale-95 text-blue-900 border border-blue-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="SOP Buka dan Tutup Pintu Gerbang Utama serta Gedung Sekolah"
          >
            <span>🚪 Buka & Tutup Pintu (SOP Harian)</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplyPresetDirectly('membuka pintu gerbang')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-blue-100 active:scale-95 text-slate-700 hover:text-blue-950 border border-slate-200 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            title="Membuka Pintu Gerbang dan Gedung Pagi Hari"
          >
            <span>🌅 Buka Pintu Pagi</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplyPresetDirectly('menutup dan mengunci')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-blue-100 active:scale-95 text-slate-700 hover:text-blue-950 border border-slate-200 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            title="Menutup dan Mengunci Pintu Gedung dan Gerbang Sore Hari"
          >
            <span>🔒 Tutup Pintu Sore</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplyPresetDirectly('patroli keamanan')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-blue-100 active:scale-95 text-slate-700 hover:text-blue-950 border border-slate-200 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            title="Patroli Keamanan Malam & Pengecekan Kunci"
          >
            <span>🛡️ Patroli Malam</span>
          </button>
        </div>
      </div>

      {/* AUTOMATIC ANALYTICS SECTION */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-700" />
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">
              Analisis Otomatis Kinerja Penjaga Sekolah
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
            Kalkulasi Real-time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Patroli Keamanan */}
          <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900">Patroli Keamanan & Ronda</span>
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-blue-950 mt-1">
              {patrolTasks + nightRondaTasks} Titik
            </p>
            <p className="text-[11px] text-blue-800 mt-1">
              {patrolTasks} Patroli · {nightRondaTasks} Ronda Malam
            </p>
          </div>

          {/* Card 2: Perbaikan Sarpras */}
          <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">Penyelesaian Sapras</span>
              <Wrench className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-950 mt-1">{saprasRate}%</p>
            <p className="text-[11px] text-emerald-800 mt-1">
              {saprasCompleted} dari {saprasTasks.length} perbaikan tuntas
            </p>
          </div>

          {/* Card 3: Pengawasan Anak & Gerbang */}
          <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">Pengawasan & Tamu</span>
              <Eye className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-amber-950 mt-1">
              {childSafetyTasks + guestTasks} Sesi
            </p>
            <p className="text-[11px] text-amber-800 mt-1">
              {childSafetyTasks} Siswa · {guestTasks} Protokol Tamu
            </p>
          </div>

          {/* Card 4: Kesiapan Alat Kerja */}
          <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900">Kelaikan Inventaris</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-extrabold text-indigo-950 mt-1">{invRate}%</p>
            <p className="text-[11px] text-indigo-800 mt-1">
              {invBaik} dari {penjagaInventories.length} peralatan kondisi prima
            </p>
          </div>
        </div>

        {/* Narrative Automated Insight */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">
              Rekomendasi Otomatis & SOP Standar Penjaga Sekolah:
            </p>
            <p className="text-slate-600 leading-relaxed">
              Tersedia template pekerjaan standar <strong>Buka dan Tutup Pintu Gerbang serta Seluruh Akses Gedung Sekolah</strong>. Pastikan pembukaan gerbang pagi, pengendalian akses masuk jam KBM, penutupan gerbang sore hari, serta patroli pengecekan gembok malam hari dicatat secara rutin dengan bukti foto ber-watermark resmi.
            </p>
          </div>
        </div>
      </div>

      {/* Role Navigation Categories / Submenu Filter (Expanded) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveCategory('semua')}
          className={`px-3.5 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'semua'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Semua Kegiatan ({penjagaTasks.length})
        </button>

        <button
          onClick={() => setActiveCategory('keamanan')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'keamanan'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Keamanan ({patrolTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('inspeksi_malam')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'inspeksi_malam'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Ronda Malam ({nightRondaTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('protokoler_tamu')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'protokoler_tamu'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Tamu & Parkir ({guestTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('pengawasan_anak')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'pengawasan_anak'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Mengawasi Anak ({childSafetyTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('tanggap_darurat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'tanggap_darurat'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Tanggap Darurat ({emergencyTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('perbaikan_sapras')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'perbaikan_sapras'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Perbaikan Sapras ({saprasTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveCategory('lingkungan')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'lingkungan'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Trees className="w-3.5 h-3.5" />
          <span>Tambahan Lingkungan ({envTasks})</span>
        </button>

        <button
          onClick={() => setActiveCategory('antar_surat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'antar_surat'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Antar Surat ({mailTasks})</span>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Jurnal Tugas Harian Penjaga Sekolah ({filteredTasks.length})
          </h3>
          <span className="text-xs text-slate-500">
            {completedTasks} selesai · {inProgressTasks} dalam proses
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
            <Shield className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Belum ada catatan tugas harian untuk kategori ini.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleAddNewWithMode('template')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs"
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
                    <span className="font-semibold text-blue-900 flex items-center gap-1">
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
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
        <InventoryTable role="PENJAGA" />
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <DailyTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => { 
            setIsTaskModalOpen(false); 
            setEditingTask(null); 
            setSelectedPreset(null);
          }}
          role="PENJAGA"
          editingTask={editingTask}
          initialMode={modalInitialMode}
          initialPreset={selectedPreset}
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
