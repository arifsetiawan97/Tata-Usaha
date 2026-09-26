import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskLog, RoleType, TaskCategory } from '../../types';
import { TASK_PRESETS, parseTasksCsv, exportTasksToCsv, TaskPresetItem } from '../../data/taskPresets';
import { 
  X, 
  Upload, 
  Check, 
  Download, 
  FileSpreadsheet, 
  Sparkles,
  Camera,
  Smartphone,
  Image as ImageIcon,
  PenTool,
  RotateCcw,
  ZoomIn,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  Info
} from 'lucide-react';

interface DailyTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleType;
  editingTask?: TaskLog | null;
  initialMode?: 'template' | 'manual' | 'import';
}

export const DailyTaskModal: React.FC<DailyTaskModalProps> = ({
  isOpen,
  onClose,
  role,
  editingTask,
  initialMode = 'template'
}) => {
  const { addTask, updateTask, importTasks, schoolConfig } = useApp();
  const operator = schoolConfig.operatorProfiles[role];
  const rolePresets = TASK_PRESETS[role] || [];

  const todayStr = new Date().toISOString().split('T')[0];

  // Primary tab: form vs import
  const [activeTab, setActiveTab] = useState<'form' | 'import'>(
    initialMode === 'import' ? 'import' : 'form'
  );

  // Sub-mode for Form: 'template' vs 'manual'
  const [inputMode, setInputMode] = useState<'template' | 'manual'>(
    initialMode === 'manual' || editingTask ? 'manual' : 'template'
  );

  // Filter templates by category
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('semua');
  const [templateSearch, setTemplateSearch] = useState<string>('');

  const getInitialCategory = (): TaskCategory => {
    if (editingTask) return editingTask.category;
    if (role === 'PENJAGA') return 'keamanan';
    if (role === 'TU') return 'kepegawaian';
    return 'kebersihan_wc';
  };

  const [formData, setFormData] = useState({
    date: editingTask ? editingTask.date : todayStr,
    category: getInitialCategory(),
    title: editingTask ? editingTask.title : '',
    description: editingTask ? editingTask.description : '',
    location: editingTask ? editingTask.location : '',
    timeStart: editingTask ? editingTask.timeStart : '07:30',
    timeEnd: editingTask ? editingTask.timeEnd : '09:00',
    status: editingTask ? editingTask.status : ('selesai' as 'selesai' | 'dalam_proses' | 'perlu_tindak_lanjut'),
    volumeUnit: editingTask ? editingTask.volumeUnit : '',
    photoUrl: editingTask?.photoUrl || '',
    petugas: editingTask ? editingTask.petugas : operator.nama,
    notes: editingTask?.notes || ''
  });

  const [applyWatermark, setApplyWatermark] = useState<boolean>(true);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string>('');

  // Live Camera state
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Filtered Presets
  const filteredPresets = rolePresets.filter(p => {
    if (templateCategoryFilter !== 'semua' && p.category !== templateCategoryFilter) {
      return false;
    }
    if (templateSearch.trim()) {
      const q = templateSearch.toLowerCase();
      return p.title.toLowerCase().includes(q) || 
             p.description.toLowerCase().includes(q) || 
             p.category.toLowerCase().includes(q);
    }
    return true;
  });

  // Watermark Stamper Function
  const applyOfficialWatermark = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0);

          // Add official watermark bar at bottom
          const barHeight = Math.max(52, Math.round(img.height * 0.13));
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(0, img.height - barHeight, img.width, barHeight);

          // Gold accent line
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(0, img.height - barHeight, img.width, Math.max(3, Math.round(barHeight * 0.05)));

          // Text styling
          const fontSize1 = Math.max(14, Math.round(barHeight * 0.28));
          const fontSize2 = Math.max(11, Math.round(barHeight * 0.22));
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${fontSize1}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.textBaseline = 'top';

          const padX = Math.max(14, Math.round(img.width * 0.03));
          const padY = img.height - barHeight + Math.round(barHeight * 0.16);

          const locText = formData.location ? `📍 ${formData.location} · ` : '📍 Lingkungan Kerja · ';
          ctx.fillText(`${locText}${schoolConfig.namaSekolah}`, padX, padY);

          ctx.fillStyle = '#cbd5e1';
          ctx.font = `${fontSize2}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          ctx.fillText(`📅 ${formData.date} | ⏰ ${timeNow} WIB | 👤 Petugas: ${formData.petugas}`, padX, padY + fontSize1 + 4);

          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } catch (err) {
          console.error('Watermark stamping failed:', err);
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const processUploadedImage = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawUrl = event.target?.result as string;
      if (applyWatermark) {
        const stampedUrl = await applyOfficialWatermark(rawUrl);
        setFormData(prev => ({ ...prev, photoUrl: stampedUrl }));
      } else {
        setFormData(prev => ({ ...prev, photoUrl: rawUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedImage(file);
    }
  };

  // Live Camera Handlers
  const startLiveCamera = async () => {
    setCameraError(null);
    setIsLiveCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Live Camera not available, fallback to native camera input:', err);
      setCameraError('Kamera langsung di peramban tidak dapat diakses. Mengalihkan ke Kamera HP bawaan...');
      stopLiveCamera();
      // Fallback: trigger phone's native camera input
      setTimeout(() => {
        cameraInputRef.current?.click();
      }, 500);
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsLiveCameraOpen(false);
  };

  const captureLivePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopLiveCamera();

    if (applyWatermark) {
      const stampedUrl = await applyOfficialWatermark(rawUrl);
      setFormData(prev => ({ ...prev, photoUrl: stampedUrl }));
    } else {
      setFormData(prev => ({ ...prev, photoUrl: rawUrl }));
    }
  };

  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  if (!isOpen) return null;

  // Apply a selected preset
  const handleApplyPreset = (p: TaskPresetItem) => {
    setFormData(prev => ({
      ...prev,
      category: p.category,
      title: p.title,
      description: p.description,
      location: p.location,
      volumeUnit: p.volumeUnit,
      timeStart: p.timeStart,
      timeEnd: p.timeEnd,
      notes: p.notes || prev.notes
    }));
  };

  // Reset form to blank manual state
  const handleResetToManual = () => {
    setFormData({
      date: todayStr,
      category: getInitialCategory(),
      title: '',
      description: '',
      location: '',
      timeStart: '07:30',
      timeEnd: '09:00',
      status: 'selesai',
      volumeUnit: '',
      photoUrl: '',
      petugas: operator.nama,
      notes: ''
    });
    setInputMode('manual');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTask) {
      updateTask(editingTask.id, formData);
    } else {
      addTask({
        role,
        ...formData
      });
    }
    onClose();
  };

  // CSV Import
  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = parseTasksCsv(content, role);
          if (parsed.length > 0) {
            importTasks(parsed);
            setImportStatus(`Berhasil mengimpor ${parsed.length} tugas ke daftar harian!`);
            setTimeout(() => {
              onClose();
            }, 1200);
          } else {
            setImportStatus('Tidak ada data valid yang ditemukan pada berkas CSV.');
          }
        } catch (err) {
          setImportStatus('Format berkas CSV tidak sesuai.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Download Sample Template CSV
  const handleDownloadSampleCsv = () => {
    const sampleTasks: any[] = rolePresets.map((p, idx) => ({
      id: `sample-${idx + 1}`,
      role,
      date: todayStr,
      category: p.category,
      title: p.title,
      description: p.description,
      location: p.location,
      timeStart: p.timeStart,
      timeEnd: p.timeEnd,
      status: 'selesai',
      volumeUnit: p.volumeUnit,
      petugas: operator.nama,
      notes: p.notes || ''
    }));

    const csvContent = exportTasksToCsv(sampleTasks);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template_tugas_harian_${role.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Render Category Select Options (All expanded categories)
  const renderCategoryOptions = () => {
    if (role === 'TU') {
      return (
        <>
          <optgroup label="Administrasi Kepegawaian & GTK">
            <option value="kepegawaian">Kepegawaian (SKP, Pangkat, BKN, Cuti, KGB, Roster)</option>
          </optgroup>
          <optgroup label="Administrasi Kesiswaan">
            <option value="siswa">Kesiswaan (Buku Induk, Mutasi, Suket, Legalisir, NISN)</option>
          </optgroup>
          <optgroup label="Tata Kelola Persuratan & Disposisi">
            <option value="surat_masuk">Surat Masuk (Buku Agenda & Disposisi Kepsek)</option>
            <option value="surat_keluar">Surat Keluar (Nomor Dinas, SPPD, Edaran & Legalisir)</option>
          </optgroup>
          <optgroup label="Keuangan & Anggaran Sekolah">
            <option value="keuangan_bos">Keuangan BOS/BOP (BKU, SPJ, Pajak & ARKAS)</option>
          </optgroup>
          <optgroup label="Aset & Sarana Prasarana">
            <option value="sapras">Sarpras & Aset (KIR, KIB, BAST & Verifikasi Aset)</option>
          </optgroup>
          <optgroup label="Sistem Informasi & Kearsipan">
            <option value="dapodik">Dapodikdasmen (Validasi Rombel, GTK & Siswa)</option>
            <option value="kearsipan">Kearsipan (Digitalisasi PDF & Penataan Odner)</option>
            <option value="layanan_umum">Layanan Umum (Notulen Rapat, Tamu Dinas & Humas)</option>
          </optgroup>
        </>
      );
    }
    if (role === 'PENJAGA') {
      return (
        <>
          <optgroup label="Pengamanan & Ronda">
            <option value="keamanan">Keamanan Umum (Patroli, Pos Jaga, Pengecekan Kunci)</option>
            <option value="inspeksi_malam">Inspeksi & Ronda Malam (Gardu, MCB, Pagar Belakang)</option>
            <option value="protokoler_tamu">Protokoler Tamu (Penerimaan Tamu Dinas & Parkir)</option>
          </optgroup>
          <optgroup label="Ketertiban & Kesiapsiagaan">
            <option value="pengawasan_anak">Mengawasi Siswa (Penyeberangan, Pagi, Istirahat)</option>
            <option value="tanggap_darurat">Kesiapsiagaan Darurat (APAR, Drainase, Listrik)</option>
          </optgroup>
          <optgroup label="Pemeliharaan & Ekspedisi">
            <option value="perbaikan_sapras">Perbaikan Sarana/Prasarana Ringan Sekolah</option>
            <option value="lingkungan">Tambahan Lingkungan (Pohon, Rumput, Saluran)</option>
            <option value="antar_surat">Antar Surat Dinas & Ekspedisi Disdik</option>
          </optgroup>
        </>
      );
    }
    return (
      <>
        <optgroup label="Sanitasi Ruang & Toilet">
          <option value="kebersihan_wc">Kebersihan Toilet / WC (Siswa, Guru, Sanitasi)</option>
          <option value="kebersihan_kantor">Kebersihan Ruang Kerja (Kepsek, Guru, TU, Debu, Pel)</option>
        </optgroup>
        <optgroup label="Pengelolaan Lingkungan & Sampah">
          <option value="kebersihan_sampah">Kebersihan Sampah (Pilah Organik/Anorganik & TPS)</option>
          <option value="kebersihan_halaman">Pembersihan Halaman, Lapangan & Selasar</option>
          <option value="perawatan_taman">Perawatan & Penyiraman Tanaman / Taman</option>
        </optgroup>
        <optgroup label="Fasilitas Khusus & Sanitasi">
          <option value="sanitasi_disinfeksi">Sanitasi & Disinfeksi (UKS, Musholla, Koridor)</option>
          <option value="penyediaan_air">Penyediaan Air Bersih (Tandon, Radar Pompa, Kran)</option>
        </optgroup>
      </>
    );
  };

  // Helper chip presets for Manual Mode
  const tuLocationChips = ['Ruang TU', 'Meja Kepegawaian', 'Meja Kesiswaan', 'Meja BOS/SPJ', 'Ruang Kepsek', 'Lab Komputer', 'Dinas Pendidikan', 'Ruang Arsip'];
  const tuVolumeChips = ['4 berkas ASN', '12 lembar suket', '1 draf SK dinas', '1 bundel SPJ', '18 kuitansi', '1 kegiatan', '24 siswa'];

  const penjagaLocationChips = ['Pintu Gerbang Utama', 'Zebra Cross Depan', 'Blok Gedung A-B-C', 'Pos Keamanan', 'Kantin & Lapangan', 'Gudang Sapras', 'Dinas Pendidikan'];
  const penjagaVolumeChips = ['24 ruang kelas', '± 450 siswa', '1 sesi ronda malam', '2 kran wastafel', '4 unit lampu LED', '1 berkas dinas'];

  const serviceLocationChips = ['Toilet Siswa Putra', 'Toilet Siswa Putri', 'Toilet Guru', 'Ruang Kepala Sekolah', 'Ruang Guru & TU', 'Lapangan Upacara', 'Ruang UKS & Musholla'];
  const serviceVolumeChips = ['8 bilik toilet', '3 ruangan besar', '6 gerobak sampah', '± 800 m² halaman', '45 pot tanaman', '2 unit tandon air'];

  const currentLocationChips = role === 'TU' ? tuLocationChips : role === 'PENJAGA' ? penjagaLocationChips : serviceLocationChips;
  const currentVolumeChips = role === 'TU' ? tuVolumeChips : role === 'PENJAGA' ? penjagaVolumeChips : serviceVolumeChips;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl my-3 sm:my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span>{editingTask ? 'Edit Tugas Operasional' : 'Catat & Upload Tugas Operasional'}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {role === 'TU' ? 'Tata Usaha' : role === 'PENJAGA' ? 'Penjaga Sekolah' : 'Layanan Kebersihan'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Petugas: {formData.petugas} · {schoolConfig.namaSekolah}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Form Input vs CSV Import */}
        {!editingTask && (
          <div className="flex border-b border-slate-200 px-4 sm:px-6 pt-2 gap-3 text-xs bg-slate-50/70 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`pb-2 px-2 font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'form' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Input Tugas (Template & Manual)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`pb-2 px-2 font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'import' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Impor Berkas CSV / Excel</span>
            </button>
          </div>
        )}

        {/* CONTENT CONTAINER */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* CSV Import Tab */}
          {activeTab === 'import' && !editingTask ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs sm:text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>Format Template Impor Tugas Harian (CSV)</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Anda dapat mengunduh format template CSV standar yang telah terisi contoh kegiatan sesuai peran operasional ({role}), lalu mengunggahnya untuk mengimpor seluruh tugas sekaligus.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Format Template CSV ({role})</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-800">Unggah Berkas CSV Tugas Harian</p>
                <p className="text-[11px] text-slate-500 mt-1 mb-4">Pilih file .csv hasil export atau template yang telah diisi</p>
                
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs">
                  <span>Pilih Berkas CSV</span>
                  <input type="file" accept=".csv,text/csv" onChange={handleCsvImport} className="hidden" />
                </label>
              </div>

              {importStatus && (
                <p className="text-xs font-semibold text-center text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                  {importStatus}
                </p>
              )}
            </div>
          ) : (
            /* FORM INPUT TAB: WITH PROMINENT TEMPLATE VS MANUAL TOGGLE */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* MODE SELECTOR BANNER */}
              <div className="p-3 bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mode Pengisian Tugas:</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {inputMode === 'template' 
                      ? 'Pilih dari daftar pekerjaan standar dinas (1-klik langsung terisi)' 
                      : 'Ketik bebas formulir secara manual sesuai kebutuhan lapangan'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-blue-200 shadow-2xs self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setInputMode('template')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      inputMode === 'template'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Template Otomatis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputMode('manual')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      inputMode === 'manual'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Input Manual Bebas</span>
                  </button>
                </div>
              </div>

              {/* TEMPLATE PICKER SECTION (Visible in Template Mode) */}
              {inputMode === 'template' && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-blue-900 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      <span>Daftar Template Pekerjaan Standar {role === 'TU' ? 'Tata Usaha' : role === 'PENJAGA' ? 'Penjaga' : 'Kebersihan'}:</span>
                    </label>
                    <span className="text-[10px] text-blue-700 font-medium">
                      Tersedia {rolePresets.length} template pekerjaan
                    </span>
                  </div>

                  {/* Template Dropdown */}
                  <select
                    onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      if (!isNaN(idx) && rolePresets[idx]) {
                        handleApplyPreset(rolePresets[idx]);
                      }
                    }}
                    defaultValue=""
                    className="w-full px-3 py-2 text-xs bg-white border border-blue-300 rounded-lg text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  >
                    <option value="" disabled>-- Klik di sini untuk memilih pekerjaan dinas siap pakai --</option>
                    {rolePresets.map((p, idx) => (
                      <option key={idx} value={idx}>
                        [{p.category.toUpperCase().replace('_', ' ')}] {p.title}
                      </option>
                    ))}
                  </select>

                  {/* Quick-Pill Category Filters */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] pt-1">
                    <span className="text-[10.5px] font-semibold text-slate-500 shrink-0">Filter:</span>
                    <button
                      type="button"
                      onClick={() => setTemplateCategoryFilter('semua')}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                        templateCategoryFilter === 'semua'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Semua ({rolePresets.length})
                    </button>
                    {role === 'TU' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('kepegawaian')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap ${
                            templateCategoryFilter === 'kepegawaian' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Kepegawaian
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('siswa')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap ${
                            templateCategoryFilter === 'siswa' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Kesiswaan
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('keuangan_bos')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap ${
                            templateCategoryFilter === 'keuangan_bos' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Keuangan BOS
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('sapras')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap ${
                            templateCategoryFilter === 'sapras' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Sapras
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('dapodik')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap ${
                            templateCategoryFilter === 'dapodik' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Dapodik
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('surat_masuk')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap ${
                            templateCategoryFilter === 'surat_masuk' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Persuratan
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* MANUAL MODE HELPER BAR (Visible in Manual Mode) */}
              {inputMode === 'manual' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    <span>Mode Input Manual Aktif. Anda dapat mengetik judul dan rincian tugas secara bebas.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToManual}
                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-md border border-rose-200 transition-colors shrink-0"
                    title="Kosongkan formulir untuk mulai baru"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Kosongkan Form</span>
                  </button>
                </div>
              )}

              {/* CORE INPUT FIELDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Pelaksanaan:
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Kategori Layanan:
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as TaskCategory }))}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900"
                  >
                    {renderCategoryOptions()}
                  </select>
                </div>
              </div>

              {/* Judul Kegiatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Kegiatan Tugas Harian:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ketik judul kegiatan atau pilih dari template..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                />
              </div>

              {/* Uraian Rincian Pekerjaan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uraian Rincian Pekerjaan / Langkah Pelaksanaan:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan langkah kerja, alat/sistem yang digunakan, dan hasil kerja yang dicapai..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed text-slate-800"
                />
              </div>

              {/* Lokasi & Volume Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi / Titik Pelaksanaan:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ruang TU, Meja Kesiswaan, Lab, dsb"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  {/* Quick location chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {currentLocationChips.slice(0, 4).map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, location: chip }))}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Capaian Volume / Satuan Hasil:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: 4 berkas ASN, 12 lembar suket"
                    value={formData.volumeUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, volumeUnit: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  {/* Quick volume chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {currentVolumeChips.slice(0, 4).map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, volumeUnit: chip }))}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Waktu & Status */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={formData.timeStart}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeStart: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={formData.timeEnd}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeEnd: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Pekerjaan</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-1.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900"
                  >
                    <option value="selesai">Selesai 100%</option>
                    <option value="dalam_proses">Dalam Proses</option>
                    <option value="perlu_tindak_lanjut">Tindak Lanjut</option>
                  </select>
                </div>
              </div>

              {/* FOTO BUKTI DOKUMENTASI & PENGAMBILAN DENGAN HP */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>Foto Bukti Dokumentasi Kegiatan (Kamera HP / Berkas):</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyWatermark}
                      onChange={(e) => setApplyWatermark(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Sertakan Cap Watermark Kedinasan</span>
                  </label>
                </div>

                <p className="text-[11px] text-slate-500">
                  Ambil foto langsung dengan kamera HP di lapangan, atau pilih foto dari galeri/berkas. Cap geotag & waktu resmi akan otomatis disematkan.
                </p>

                {/* Photo Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* 1. Direct Native Smartphone Camera Capture */}
                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Ambil Foto Kamera HP</span>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {/* 2. Live WebCam / Viewfinder Modal */}
                  <button
                    type="button"
                    onClick={startLiveCamera}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
                    title="Buka kamera di layar langsung"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Buka Kamera Layar</span>
                  </button>

                  {/* 3. Pick from Gallery / Files */}
                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors shadow-2xs">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Pilih dari Galeri</span>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                      className="flex items-center gap-1 px-2.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>

                {/* Photo Preview Card */}
                {formData.photoUrl && (
                  <div className="mt-2 p-2 bg-white border border-slate-300 rounded-lg flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div 
                        onClick={() => setIsPhotoZoomed(true)}
                        className="relative cursor-pointer group rounded overflow-hidden border border-slate-200 shrink-0"
                      >
                        <img 
                          src={formData.photoUrl} 
                          alt="Bukti Dokumentasi" 
                          className="h-16 w-24 object-cover group-hover:opacity-90 transition-opacity" 
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <ZoomIn className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Foto Bukti Dokumentasi Terlampir</span>
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          Tersimpan dan siap dicetak dalam lampiran laporan kinerja kedinasan.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsPhotoZoomed(true)}
                          className="text-[11px] font-semibold text-blue-600 hover:underline mt-0.5 inline-block"
                        >
                          Klik untuk memperbesar foto
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Catatan Lapangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Lapangan / Situasi Khusus (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Catatan kondisi, nomor ekspedisi surat, atau arahan pimpinan"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTask ? 'Simpan Perubahan Tugas' : 'Simpan Tugas Harian'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* LIVE CAMERA VIEWFINDER MODAL */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden max-w-lg w-full text-white shadow-2xl">
            <div className="p-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Kamera Langsung Pengambilan Bukti</span>
              </div>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Camera Guide Target Frame */}
              <div className="absolute inset-8 border border-white/30 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded self-start">
                  Arahkan ke objek pekerjaan
                </span>
                <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded self-end">
                  {formData.location || 'Sekolah'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-between">
              <button
                type="button"
                onClick={stopLiveCamera}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={captureLivePhoto}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-full shadow-lg transition-transform"
              >
                <Camera className="w-4 h-4" />
                <span>Jepret Foto Sekarang</span>
              </button>

              <div className="w-12" />
            </div>
          </div>
        </div>
      )}

      {/* PHOTO ZOOM POPUP MODAL */}
      {isPhotoZoomed && formData.photoUrl && (
        <div 
          onClick={() => setIsPhotoZoomed(false)}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
            <button
              type="button"
              onClick={() => setIsPhotoZoomed(false)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={formData.photoUrl} 
              alt="Bukti Dokumentasi Full" 
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <div className="p-3 bg-slate-950 text-white text-xs flex items-center justify-between">
              <span className="font-semibold">{formData.title}</span>
              <span className="text-slate-400 font-mono text-[11px]">{formData.date}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
