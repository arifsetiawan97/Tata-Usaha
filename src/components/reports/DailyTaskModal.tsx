import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskLog, RoleType, TaskCategory } from '../../types';
import { TASK_PRESETS, parseTasksCsv, exportTasksToCsv, TaskPresetItem } from '../../data/taskPresets';
import { getLocalTodayStr, getTaskClassification } from '../../utils/taskClassification';
import { initialSchoolConfig } from '../../data/initialData';
import { 
  downloadDailyTaskExcelTemplate, 
  parseDailyTaskExcelFile 
} from '../../utils/excelHelper';
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
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  Info,
  Target,
  BookmarkCheck,
  Plus,
  FolderPlus,
  Brain,
  Wand2,
  Loader2
} from 'lucide-react';

interface DailyTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleType;
  editingTask?: TaskLog | null;
  initialMode?: 'template' | 'manual' | 'import';
  initialPreset?: TaskPresetItem | null;
}

export const DailyTaskModal: React.FC<DailyTaskModalProps> = ({
  isOpen,
  onClose,
  role,
  editingTask,
  initialMode = 'template',
  initialPreset
}) => {
  const { 
    addTask, 
    updateTask, 
    importTasks, 
    schoolConfig, 
    tupoksiDefinitions,
    customCategories,
    addCustomCategory,
    getCategoryLabel
  } = useApp();
  const operator = schoolConfig.operatorProfiles?.[role] || initialSchoolConfig.operatorProfiles[role] || {
    nama: 'Petugas Layanan Operasional',
    nip: '-',
    jabatan: 'Operator'
  };
  const rolePresets = TASK_PRESETS[role] || [];
  const currentRoleTupoksi = tupoksiDefinitions[role] || { tupoksiList: [], tugasTambahanList: [] };

  const todayStr = getLocalTodayStr();

  // Custom Category Creation Modal state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatClassification, setNewCatClassification] = useState<'pokok' | 'tambahan'>('pokok');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [categoryNotice, setCategoryNotice] = useState<string | null>(null);

  // AI Assistant Drafting state
  const [showAiDraftBox, setShowAiDraftBox] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isDraftingAi, setIsDraftingAi] = useState(false);
  const [isGeneratingAiDescription, setIsGeneratingAiDescription] = useState(false);

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
    if (initialPreset) return initialPreset.category;
    if (role === 'PENJAGA') return 'keamanan';
    if (role === 'TU') return 'kepegawaian';
    if (role === 'PERPUS') return 'katalogisasi_buku';
    if (role === 'LAB_IPA') return 'persiapan_praktikum';
    return 'kebersihan_wc';
  };

  const getInitialClassification = (): 'pokok' | 'tambahan' => {
    if (editingTask?.taskType) return editingTask.taskType;
    return getTaskClassification(role, getInitialCategory());
  };

  const [formData, setFormData] = useState({
    date: editingTask ? editingTask.date : todayStr,
    category: getInitialCategory(),
    taskType: getInitialClassification(),
    title: editingTask ? editingTask.title : initialPreset ? initialPreset.title : '',
    description: editingTask ? editingTask.description : initialPreset ? initialPreset.description : '',
    location: editingTask ? editingTask.location : initialPreset ? initialPreset.location : '',
    timeStart: editingTask ? editingTask.timeStart : initialPreset ? initialPreset.timeStart : '07:30',
    timeEnd: editingTask ? editingTask.timeEnd : initialPreset ? initialPreset.timeEnd : '09:00',
    status: editingTask ? editingTask.status : ('selesai' as 'selesai' | 'dalam_proses' | 'perlu_tindak_lanjut'),
    volumeUnit: editingTask ? editingTask.volumeUnit : initialPreset ? initialPreset.volumeUnit : '',
    photoUrl: editingTask?.photoUrl || '',
    petugas: editingTask ? editingTask.petugas : operator.nama,
    notes: editingTask?.notes || initialPreset?.notes || ''
  });

  const [appliedPresetNotice, setAppliedPresetNotice] = useState<string | null>(null);

  // Synchronize formData when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        setFormData({
          date: editingTask.date,
          category: editingTask.category,
          taskType: editingTask.taskType || getTaskClassification(role, editingTask.category),
          title: editingTask.title,
          description: editingTask.description,
          location: editingTask.location,
          timeStart: editingTask.timeStart,
          timeEnd: editingTask.timeEnd,
          status: editingTask.status,
          volumeUnit: editingTask.volumeUnit,
          photoUrl: editingTask.photoUrl || '',
          petugas: editingTask.petugas,
          notes: editingTask.notes || ''
        });
        setInputMode('manual');
      } else if (initialPreset) {
        setFormData({
          date: todayStr,
          category: initialPreset.category,
          taskType: getTaskClassification(role, initialPreset.category),
          title: initialPreset.title,
          description: initialPreset.description,
          location: initialPreset.location,
          timeStart: initialPreset.timeStart,
          timeEnd: initialPreset.timeEnd,
          status: 'selesai',
          volumeUnit: initialPreset.volumeUnit,
          photoUrl: '',
          petugas: operator.nama,
          notes: initialPreset.notes || ''
        });
        setInputMode('template');
        setAppliedPresetNotice(initialPreset.title);
      } else {
        const cat = getInitialCategory();
        setFormData({
          date: todayStr,
          category: cat,
          taskType: getTaskClassification(role, cat),
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
        setInputMode(initialMode === 'manual' ? 'manual' : 'template');
      }
    }
  }, [isOpen, editingTask, initialPreset]);

  const [applyWatermark, setApplyWatermark] = useState<boolean>(true);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [parsedExcelTasks, setParsedExcelTasks] = useState<Omit<TaskLog, 'id'>[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [excelFileName, setExcelFileName] = useState('');

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
      taskType: getTaskClassification(role, p.category),
      title: p.title,
      description: p.description,
      location: p.location,
      volumeUnit: p.volumeUnit,
      timeStart: p.timeStart,
      timeEnd: p.timeEnd,
      notes: p.notes || prev.notes
    }));
    setAppliedPresetNotice(p.title);
  };

  // Quick pick from official Tupoksi or Tugas Tambahan list
  const handlePickFromTupoksi = (text: string, type: 'pokok' | 'tambahan') => {
    setFormData(prev => ({
      ...prev,
      taskType: type,
      title: text,
      description: prev.description ? prev.description : `Pelaksanaan tugas ${type === 'pokok' ? 'pokok kedinasan' : 'tambahan'}: ${text}`
    }));
    setAppliedPresetNotice(`${type === 'pokok' ? 'Tugas Pokok' : 'Tugas Tambahan'}: ${text.substring(0, 45)}...`);
  };

  // Reset form to blank manual state
  const handleResetToManual = () => {
    const cat = getInitialCategory();
    setFormData({
      date: todayStr,
      category: cat,
      taskType: getTaskClassification(role, cat),
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

  // Handler to add custom service category on the fly
  const handleSaveNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const created = addCustomCategory({
      role,
      name: newCatName.trim(),
      classification: newCatClassification,
      description: newCatDescription.trim() || undefined
    });

    setFormData(prev => ({
      ...prev,
      category: created.slug as TaskCategory,
      taskType: created.classification
    }));

    setCategoryNotice(`Kategori layanan "${created.name}" berhasil ditambahkan & langsung dipilih!`);
    setTimeout(() => setCategoryNotice(null), 3500);

    setNewCatName('');
    setNewCatDescription('');
    setShowAddCategoryModal(false);
  };

  // AI Formulator Handler
  const handleDraftWithAi = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPromptInput.trim()) return;
    setIsDraftingAi(true);
    try {
      const res = await fetch('/api/gemini/draft-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          roughPrompt: aiPromptInput.trim(),
          date: formData.date,
          category: formData.category
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setFormData(prev => ({
          ...prev,
          title: d.title || prev.title,
          description: d.description || prev.description,
          location: d.location || prev.location,
          volumeUnit: d.volumeUnit || prev.volumeUnit,
          timeStart: d.timeStart || prev.timeStart,
          timeEnd: d.timeEnd || prev.timeEnd,
          category: d.categoryRecommendation || prev.category,
          taskType: d.taskType || prev.taskType,
          status: d.status || prev.status
        }));
        setAppliedPresetNotice(`✨ Tugas dinas berhasil dirumuskan secara baku oleh AI!`);
        setInputMode('manual');
        setShowAiDraftBox(false);
        setAiPromptInput('');
      }
    } catch (err) {
      console.error('Draft with AI error:', err);
    } finally {
      setIsDraftingAi(false);
    }
  };

  // AI Auto-generator for Task Description based on Title
  const handleAiGenerateDescription = async () => {
    if (!formData.title.trim()) {
      setCategoryNotice('Silakan ketik atau pilih Judul Kegiatan terlebih dahulu agar AI dapat merumuskan uraian rincian.');
      setTimeout(() => setCategoryNotice(null), 3500);
      return;
    }
    setIsGeneratingAiDescription(true);
    try {
      const res = await fetch('/api/gemini/generate-task-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          category: formData.category,
          role,
          location: formData.location,
          volumeUnit: formData.volumeUnit
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setFormData(prev => ({
          ...prev,
          description: d.description || prev.description,
          location: prev.location || d.suggestedLocation || prev.location,
          volumeUnit: prev.volumeUnit || d.suggestedVolume || prev.volumeUnit,
          notes: prev.notes || d.notes || prev.notes
        }));
        setAppliedPresetNotice('✨ Uraian rincian pekerjaan dan saran lapangan berhasil diisi otomatis oleh AI!');
      }
    } catch (err) {
      console.error('Failed to generate task description via AI:', err);
    } finally {
      setIsGeneratingAiDescription(false);
    }
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

  // Download Native Microsoft Excel (.xlsx) Template with Columns & Guide
  const handleDownloadExcelTemplate = () => {
    downloadDailyTaskExcelTemplate(role);
  };

  // Handle Excel (.xlsx, .xls, .csv) File Upload & Auto-Parsing for Tasks
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsingExcel(true);
      setExcelFileName(file.name);
      setImportStatus(`Membaca dan memetakan kolom dari ${file.name}...`);

      const parsed = await parseDailyTaskExcelFile(file, role);
      if (parsed.length > 0) {
        setParsedExcelTasks(parsed);
        setImportStatus(`Berhasil membaca ${parsed.length} tugas harian dari berkas "${file.name}". Periksa pratinjau di bawah dan klik "Simpan & Masukkan ke Jurnal Tugas".`);
      } else {
        setParsedExcelTasks([]);
        setImportStatus('Tidak ada data tugas valid yang ditemukan pada berkas Excel.');
      }
    } catch (err) {
      console.error('Error parsing task excel:', err);
      setImportStatus('Format berkas tidak valid. Pastikan format .xlsx, .xls, atau .csv');
    } finally {
      setIsParsingExcel(false);
      e.target.value = '';
    }
  };

  // Commit Parsed Excel Tasks
  const handleCommitParsedExcelTasks = () => {
    if (parsedExcelTasks.length === 0) return;
    importTasks(parsedExcelTasks);
    setImportStatus(`Sukses mengimpor ${parsedExcelTasks.length} tugas ke jurnal harian!`);
    setTimeout(() => {
      onClose();
      setParsedExcelTasks([]);
      setExcelFileName('');
      setImportStatus('');
    }, 1000);
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

  // Download Sample Template CSV (Full Excel Indonesian Compatibility)
  const handleDownloadSampleCsv = () => {
    const sampleTasks: any[] = rolePresets.map((p, idx) => ({
      id: `sample-${idx + 1}`,
      role,
      date: todayStr,
      category: p.category,
      taskType: getTaskClassification(role, p.category),
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
    link.download = `Template_Impor_Tugas_Harian_Excel_${role.toLowerCase()}_${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Render Category Select Options (All expanded categories + ready-to-use additional tasks)
  const renderCategoryOptions = () => {
    const roleCustomCats = customCategories.filter(c => c.role === role);

    const standardOptions = (() => {
      if (role === 'TU') {
        return (
          <>
            <optgroup label="⭐ Tugas Pokok (Tupoksi) Administrasi GTK & Siswa">
              <option value="kepegawaian">Kepegawaian (SKP, Pangkat, BKN, Cuti, KGB, Roster)</option>
              <option value="siswa">Kesiswaan (Buku Induk, Mutasi, Suket, Legalisir, NISN)</option>
              <option value="surat_masuk">Surat Masuk (Buku Agenda & Disposisi Kepsek)</option>
              <option value="surat_keluar">Surat Keluar (Nomor Dinas, SPPD, Edaran & Legalisir)</option>
              <option value="keuangan_bos">Keuangan BOS/BOP (BKU, SPJ, Pajak & ARKAS)</option>
              <option value="sapras">Sarpras & Aset (KIR, KIB, BAST & Verifikasi Aset)</option>
              <option value="dapodik">Dapodikdasmen (Validasi Rombel, GTK & Siswa)</option>
              <option value="kearsipan">Kearsipan (Digitalisasi PDF & Penataan Odner)</option>
            </optgroup>
            <optgroup label="📌 Tugas Tambahan Kedinasan Siap Pakai">
              <option value="pelaporan_bos">Pelaporan SPJ & Rekonsiliasi Kas BOS Dinas</option>
              <option value="pengarsipan_digital">Digitalisasi Dokumen & e-Arsip Dokumen Sekolah</option>
              <option value="pelayanan_mutasi">Pelayanan Mutasi & Surat Rekomendasi Siswa</option>
              <option value="fasilitasi_rapat">Fasilitasi Rapat Dinas & Notula Pertemuan</option>
              <option value="legalisir_dokumen">Pelayanan Legalisir Ijazah & Berkas Kedinasan</option>
              <option value="layanan_umum">Layanan Umum (Penerimaan Tamu Dinas, Humas & Acara)</option>
            </optgroup>
          </>
        );
      }
      if (role === 'PENJAGA') {
        return (
          <>
            <optgroup label="⭐ Tugas Pokok (Tupoksi) Keamanan & Ronda">
              <option value="keamanan">Keamanan Umum (Patroli, Pos Jaga, Pengecekan Kunci)</option>
              <option value="inspeksi_malam">Inspeksi & Ronda Malam (Gardu, MCB, Pagar Belakang)</option>
            </optgroup>
            <optgroup label="📌 Tugas Tambahan Kedinasan Siap Pakai">
              <option value="pengawasan_anak">Mengawasi Siswa (Zebra Cross, Kedatangan Pagi, Istirahat)</option>
              <option value="protokoler_tamu">Protokoler Tamu (Penerimaan Tamu Dinas & Penataan Parkir)</option>
              <option value="perbaikan_sapras">Perbaikan Sarana/Prasarana Ringan (Kran, Pintu, Lampu)</option>
              <option value="lingkungan">Pembersihan Lingkungan, Selokan & Drainase Sekolah</option>
              <option value="antar_surat">Antar Surat Dinas & Ekspedisi Dinas Pendidikan</option>
              <option value="tanggap_darurat">Kesiapsiagaan Tanggap Darurat (APAR, Banjir, Listrik MCB)</option>
              <option value="pendampingan_kegiatan">Pengamanan Upacara Bendera & Acara Pentas/Ekskul</option>
              <option value="pengamanan_ujian">Pengamanan & Sterilisasi Ruangan Ujian / ANBK</option>
              <option value="penataan_parkir">Penataan Area Parkir Kendaraan Guru & Tamu</option>
              <option value="koordinasi_keamanan">Koordinasi Kamtibmas Polsek / Babinsa / Lingkungan</option>
              <option value="evakuasi_sarpras">Kesiapsiagaan Evakuasi Aset Saat Cuaca Ekstrem</option>
            </optgroup>
          </>
        );
      }
      if (role === 'PERPUS') {
        return (
          <>
            <optgroup label="⭐ Tugas Pokok (Tupoksi) Pengolahan & Sirkulasi">
              <option value="katalogisasi_buku">Katalogisasi & DDC (Buku Induk, Barcode, Label Punggung)</option>
              <option value="sirkulasi_peminjaman">Sirkulasi Peminjaman & Pengembalian Buku</option>
              <option value="stock_opname">Stock Opname Koleksi (Inventarisasi & Pencocokan Rak)</option>
              <option value="perawatan_buku">Perawatan & Restorasi (Penjilidan, Lem, Laminasi Cover)</option>
            </optgroup>
            <optgroup label="📌 Tugas Tambahan Kedinasan Siap Pakai">
              <option value="layanan_literasi">Layanan Literasi (15 Mnt GLS, Pojok Baca & Bimbingan)</option>
              <option value="administrasi_perpus">Administrasi Perpustakaan (Kartu Anggota & Bebas Pustaka)</option>
              <option value="pengolahan_label">Pengolahan Label Barcode & Label Punggung Buku</option>
              <option value="promosi_literasi">Display Rekomendasi Buku Mingguan di Lobi Sekolah</option>
              <option value="layanan_referensi">Layanan Referensi & Penelusuran Informasi Ilmiah</option>
              <option value="penyiangan_weeding">Penyiangan Koleksi Rusak Berat (Weeding)</option>
              <option value="kerjasama_perpustakaan">Penerimaan & Registrasi Sumbangan/Hibah Buku</option>
            </optgroup>
          </>
        );
      }
      if (role === 'LAB_IPA') {
        return (
          <>
            <optgroup label="⭐ Tugas Pokok (Tupoksi) Praktikum & K3 Lab">
              <option value="persiapan_praktikum">Persiapan Praktikum (Mikroskop, Preparat & Kit Fisika)</option>
              <option value="pemeliharaan_alat">Pemeliharaan Alat Gelas (Pencucian, Sterilisasi & Oven)</option>
              <option value="inventaris_bahan">Inventaris Reagen Kimia (Kartu Stok & Lemari B3)</option>
              <option value="k3_laboratorium">Keselamatan Kerja K3 (APAR, P3K, Netralisasi Limbah)</option>
            </optgroup>
            <optgroup label="📌 Tugas Tambahan Kedinasan Siap Pakai">
              <option value="jadwal_lab">Jadwal & Jurnal Penggunaan Ruang Laboratorium IPA</option>
              <option value="perbaikan_alat">Kalibrasi Titik Nol Neraca Ohaus & Pegas</option>
              <option value="pengelolaan_limbah">Pengelolaan & Netralisasi Limbah Praktikum Asam-Basa</option>
              <option value="kalibrasi_presisi">Kalibrasi Presisi Neraca & Pengecekan Lensa Mikroskop</option>
              <option value="pembuatan_reagen">Pembuatan Larutan Reagen Biologi (Benedict, Biuret, Lugol)</option>
              <option value="peragaan_sains">Pendampingan Kit Peraga Sains / Ekstrakurikuler KIR</option>
              <option value="penataan_spesimen">Penataan Preparat Sel & Awetan Spesimen Biologi</option>
            </optgroup>
          </>
        );
      }
      return (
        <>
          <optgroup label="⭐ Tugas Pokok (Tupoksi) Kebersihan & Sanitasi">
            <option value="kebersihan_wc">Kebersihan Toilet / WC (Siswa, Guru, Sanitasi Harian)</option>
            <option value="kebersihan_kantor">Kebersihan Ruang Kerja & Kelas (Kepsek, Guru, TU, Pel)</option>
            <option value="kebersihan_sampah">Kebersihan Sampah (Pilah Organik/Anorganik & TPS)</option>
            <option value="kebersihan_halaman">Pembersihan Halaman Upacara, Lapangan & Selasar</option>
          </optgroup>
          <optgroup label="📌 Tugas Tambahan Kedinasan Siap Pakai">
            <option value="perawatan_taman">Perawatan Taman Pot, Bunga & Penyiraman Lobi</option>
            <option value="pemeliharaan_taman">Pemangkasan Rumput & Perapian Area Hijau Sekolah</option>
            <option value="penyediaan_air">Pemeriksaan Radar Pompa Air, Tandon & Kran Air</option>
            <option value="sanitasi_disinfeksi">Sanitasi & Disinfeksi (Ruang UKS, Musholla & Isolasi)</option>
            <option value="drainase_saluran">Pembersihan Saluran Air & Drainase Sekolah</option>
            <option value="persiapan_aula">Penataan Meja/Kursi Ruang Aula & Fasilitasi Acara</option>
            <option value="sterilisasi_ruang">Sterilisasi Ruang Isolasi/UKS & Penyedotan Karpet</option>
            <option value="pengecatan_ringan">Pengecatan Ringan & Restorasi Noda Dinding Ruang</option>
          </optgroup>
        </>
      );
    })();

    return (
      <>
        {standardOptions}
        {roleCustomCats.length > 0 && (
          <optgroup label="✨ Kategori Layanan Kustom (Sesuai Keinginan Pengguna)">
            {roleCustomCats.map(c => (
              <option key={c.id} value={c.slug}>
                ✨ {c.name} ({c.classification === 'pokok' ? '⭐ Tugas Pokok' : '📌 Tugas Tambahan'})
              </option>
            ))}
          </optgroup>
        )}
      </>
    );
  };

  // Helper chip presets for Manual Mode (Comprehensive Field Locations)
  const tuLocationChips = [
    'Ruang TU (Meja Kepegawaian)',
    'Ruang TU (Meja Kesiswaan)',
    'Ruang TU (Meja BOS/SPJ)',
    'Ruang Kepala Sekolah',
    'Ruang Arsip Surat',
    'Lab Komputer (ANBK)',
    'Lobi Pelayanan Utama',
    'Dinas Pendidikan Kota/Kab',
    'Kantor BKN / BKPSDM',
    'Gudang Berkas Ijazah'
  ];
  const tuVolumeChips = [
    '1 berkas dinas',
    '4 berkas ASN',
    '12 lembar suket',
    '1 draf SK dinas',
    '1 bundel SPJ BOS',
    '18 lembar kuitansi',
    '1 kegiatan dinas',
    '32 siswa mutasi/PIP',
    '1 buku agenda surat',
    '24 arsip digital PDF'
  ];

  const penjagaLocationChips = [
    'Pintu Gerbang Utama Depan',
    'Zebra Cross Penyeberangan Jalan',
    'Pos Keamanan Gerbang',
    'Selasar Gedung Kelas A-B-C',
    'Halaman & Lapangan Upacara',
    'Gardu MCB & Panel Listrik',
    'Area Parkir Kendaraan Guru/Tamu',
    'Pagar Keliling Belakang',
    'Gudang Sarpras Sekolah',
    'Kantin & Selasar Barat'
  ];
  const penjagaVolumeChips = [
    '1 sesi buka/tutup gerbang',
    '24 ruang kelas aman terkunci',
    '± 450 siswa terawasi',
    '1 putaran ronda malam',
    '4 unit lampu penerangan',
    '2 kran wastafel diperbaiki',
    '1 berkas dinas ekspedisi',
    '50 meter saluran air lancar',
    '1 unit gembok rantai terpasang',
    '2 sesi penataan parkir rapi'
  ];

  const serviceLocationChips = [
    'Toilet Siswa Putra Blok A',
    'Toilet Siswa Putri Blok B',
    'Toilet Guru & Tenaga Kependidikan',
    'Ruang Kepala Sekolah & Tamu',
    'Ruang Guru & Tata Usaha',
    'Selasar Koridor Kelas',
    'Lapangan Upacara & Olahraga',
    'Ruang UKS & Musholla',
    'Tempat Pembuangan Sampah (TPS)',
    'Area Tandon Puncak & Pompa Air'
  ];
  const serviceVolumeChips = [
    '8 bilik toilet higienis',
    '4 ruang kerja pimpinan & staf',
    '6 gerobak sampah terangkut ke TPS',
    '± 800 m² lantai bersih dipel',
    '45 pot tanaman tersiram rapi',
    '2 unit tandon air terkontrol',
    '1 paket disinfeksi ruangan UKS',
    '1 paket penataan kursi aula',
    '12 tempat sampah kelas dikosongkan',
    '40 meter saluran selokan dibersihkan'
  ];

  const perpusLocationChips = [
    'Meja Layanan Sirkulasi',
    'Ruang Pengolahan Koleksi Baru',
    'Lorong Rak Buku Teks Pelajaran',
    'Lorong Rak Koleksi Fiksi & Sastra',
    'Area Baca Lesehan & Pojok GLS',
    'Display Rekomendasi Buku Lobi',
    'Ruang Restorasi & Preservasi',
    'Meja Komputer Katalog OPAC',
    'Lemari Buku Referensi & Ensiklopedia',
    'Pojok Literasi Tematik'
  ];
  const perpusVolumeChips = [
    '80 eksemplar buku teks pelajaran',
    '45 transaksi peminjaman & kembali',
    '2 rombel kelas (64 siswa GLS)',
    '15 buku referensi direstorasi',
    '120 kartu anggota perpustakaan',
    '1 laporan statistik sirkulasi',
    '50 buku diberi label barcode',
    '1 paket display tema literasi',
    '25 buku pengayaan diklasifikasi',
    '6 lembar suket bebas pustaka'
  ];

  const labIpaLocationChips = [
    'Meja Praktikum Siswa 1-6',
    'Meja Demonstrasi Guru',
    'Ruang Preparasi Laboran',
    'Lemari Alat Optik & Mikroskop',
    'Lemari Khusus Bahan Kimia B3',
    'Wastafel & Rak Pengering Alat Gelas',
    'Dinding APAR & Kotak P3K',
    'Area Bak Filtrasi Netralisasi Limbah',
    'Lemari Kit Mekanika & Listrik',
    'Meja Kalibrasi Neraca Ohaus'
  ];
  const labIpaVolumeChips = [
    '16 unit mikroskop disterilkan',
    '8 set kit mekanika/optik siap pakai',
    '48 tabung reaksi & gelas beaker bersih',
    '24 botol reagen terinventarisasi',
    '6 unit neraca Ohaus terkalibrasi',
    '1 unit APAR & kotak P3K siap siaga',
    '5 liter limbah ternetralisasi aman',
    '18 jadwal praktikum tersusun',
    '3 botol larutan reagen segar',
    '12 preparat biologi tersimpan rapi'
  ];

  const currentLocationChips = 
    role === 'TU' ? tuLocationChips : 
    role === 'PENJAGA' ? penjagaLocationChips : 
    role === 'SERVICE' ? serviceLocationChips :
    role === 'PERPUS' ? perpusLocationChips : labIpaLocationChips;

  const currentVolumeChips = 
    role === 'TU' ? tuVolumeChips : 
    role === 'PENJAGA' ? penjagaVolumeChips : 
    role === 'SERVICE' ? serviceVolumeChips :
    role === 'PERPUS' ? perpusVolumeChips : labIpaVolumeChips;

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
          {/* Excel / CSV Import Tab */}
          {activeTab === 'import' && !editingTask ? (
            <div className="space-y-4 text-xs">
              {/* Template Download Box */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs sm:text-sm">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>Format Templat Excel Resmi Tugas Harian ({role})</span>
                  </div>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    Unduh format Microsoft Excel resmi yang sudah dilengkapi kolom-kolom: Tanggal, Waktu, Judul Kegiatan, Uraian Rincian Pekerjaan, Lokasi, Volume Satuan, Kategori, dan Petunjuk.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Templat Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center bg-slate-50/60 transition-colors">
                <FileSpreadsheet className="w-9 h-9 text-blue-600 mx-auto mb-2 opacity-90" />
                <p className="text-sm font-bold text-slate-800">Unggah Berkas Excel Tugas Harian (.xlsx / .xls / .csv)</p>
                <p className="text-[11px] text-slate-500 mt-0.5 mb-3">Kolom otomatis dipetakan ke formulir jurnal tugas operasional</p>
                
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>{isParsingExcel ? 'Membaca Berkas Excel...' : 'Pilih Berkas Excel / CSV'}</span>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                    onChange={handleExcelFileUpload} 
                    className="hidden" 
                  />
                </label>
                {excelFileName && (
                  <p className="text-[11px] text-slate-600 mt-2 font-mono">
                    Berkas aktif: <strong>{excelFileName}</strong>
                  </p>
                )}
              </div>

              {/* Status Message */}
              {importStatus && (
                <div className={`p-3 rounded-lg text-xs font-semibold border flex items-center gap-2 ${
                  importStatus.includes('Sukses') || importStatus.includes('Berhasil')
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              {/* Parsed Excel Tasks Preview */}
              {parsedExcelTasks.length > 0 && (
                <div className="space-y-2 border border-blue-200 rounded-xl p-3 bg-blue-50/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-blue-700" />
                      Pratinjau Data ({parsedExcelTasks.length} tugas terbaca dari Excel):
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Tugas Pokok: {parsedExcelTasks.filter(t => t.taskType === 'pokok').length} · 
                      Tugas Tambahan: {parsedExcelTasks.filter(t => t.taskType === 'tambahan').length}
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-2xs">
                    <table className="w-full text-left text-[11px] divide-y divide-slate-100">
                      <thead className="bg-slate-50 sticky top-0 text-slate-700 font-bold">
                        <tr>
                          <th className="py-2 px-2.5 text-center w-8">No</th>
                          <th className="py-2 px-2.5">Tanggal & Waktu</th>
                          <th className="py-2 px-2.5">Judul Kegiatan</th>
                          <th className="py-2 px-2.5">Lokasi</th>
                          <th className="py-2 px-2.5">Volume</th>
                          <th className="py-2 px-2.5 text-center">Jenis</th>
                          <th className="py-2 px-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedExcelTasks.map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-1.5 px-2.5 text-center text-slate-400">{idx + 1}</td>
                            <td className="py-1.5 px-2.5 whitespace-nowrap text-slate-600 font-mono text-[10px]">
                              {t.date}<br/>{t.timeStart} - {t.timeEnd}
                            </td>
                            <td className="py-1.5 px-2.5 font-bold text-slate-900">
                              {t.title}
                              <div className="text-[10px] text-slate-500 font-normal line-clamp-1">{t.description}</div>
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-600">{t.location}</td>
                            <td className="py-1.5 px-2.5 text-slate-700 font-semibold">{t.volumeUnit}</td>
                            <td className="py-1.5 px-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.taskType === 'pokok' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {t.taskType === 'pokok' ? 'Pokok' : 'Tambahan'}
                              </span>
                            </td>
                            <td className="py-1.5 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleCommitParsedExcelTasks}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan & Masukkan ke Jurnal Tugas ({parsedExcelTasks.length} Kegiatan)</span>
                    </button>
                  </div>
                </div>
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
                      Tersedia {filteredPresets.length} dari {rolePresets.length} template
                    </span>
                  </div>

                  {/* Search box for templates */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari template (contoh: buka pintu, gerbang, patroli, sapras)..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                    {templateSearch && (
                      <button
                        type="button"
                        onClick={() => setTemplateSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Template Dropdown */}
                  <select
                    onChange={(e) => {
                      const selected = filteredPresets.find(p => p.title === e.target.value);
                      if (selected) {
                        handleApplyPreset(selected);
                      }
                    }}
                    value=""
                    className="w-full px-3 py-2 text-xs bg-white border border-blue-300 rounded-lg text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  >
                    <option value="" disabled>-- Klik di sini untuk memilih pekerjaan dinas siap pakai --</option>
                    {filteredPresets.map((p, idx) => (
                      <option key={idx} value={p.title}>
                        [{p.category.toUpperCase().replace('_', ' ')}] {p.title}
                      </option>
                    ))}
                    {filteredPresets.length === 0 && (
                      <option disabled value="">Tidak ada template yang cocok dengan pencarian/filter</option>
                    )}
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

                    {role === 'PENJAGA' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('keamanan')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'keamanan' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Keamanan & Pintu
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('pengawasan_anak')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'pengawasan_anak' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Pengawasan Siswa
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('inspeksi_malam')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'inspeksi_malam' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Ronda Malam
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('protokoler_tamu')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'protokoler_tamu' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Tamu & Parkir
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('perbaikan_sapras')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'perbaikan_sapras' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Sapras Ringan
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('lingkungan')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'lingkungan' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Lingkungan
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('antar_surat')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'antar_surat' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Antar Surat
                        </button>
                      </>
                    )}

                    {role === 'TU' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('kepegawaian')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'kepegawaian' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Kepegawaian
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('siswa')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'siswa' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Kesiswaan
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('keuangan_bos')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'keuangan_bos' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Keuangan BOS
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('sapras')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'sapras' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Sapras
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('dapodik')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'dapodik' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Dapodik
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('surat_masuk')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'surat_masuk' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Persuratan
                        </button>
                      </>
                    )}

                    {role === 'SERVICE' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('kebersihan_wc')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'kebersihan_wc' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Toilet & WC
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('kebersihan_kantor')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'kebersihan_kantor' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Ruang Kantor
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('kebersihan_halaman')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'kebersihan_halaman' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Halaman
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('kebersihan_sampah')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'kebersihan_sampah' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Kelola Sampah
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateCategoryFilter('sanitasi_disinfeksi')}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                            templateCategoryFilter === 'sanitasi_disinfeksi' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Sanitasi & UKS
                        </button>
                      </>
                    )}
                  </div>

                  {/* 1-Click Popular Template Quick Picks */}
                  <div className="pt-1.5 border-t border-blue-200/60">
                    <p className="text-[10px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Rekomendasi Pekerjaan Cepat (Klik 1x untuk Terapkan):</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {role === 'PENJAGA' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const p = rolePresets.find(x => x.title.toLowerCase().includes('buka dan tutup'));
                              if (p) handleApplyPreset(p);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-blue-100 active:scale-95 text-blue-900 text-[11px] font-semibold rounded-md border border-blue-300 transition-all flex items-center gap-1 shadow-2xs"
                          >
                            <span>🚪 Buka & Tutup Pintu Gerbang (SOP Harian)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const p = rolePresets.find(x => x.title.toLowerCase().includes('membuka pintu gerbang'));
                              if (p) handleApplyPreset(p);
                            }}
                            className="px-2 py-1 bg-white hover:bg-blue-100 active:scale-95 text-slate-800 text-[11px] font-medium rounded-md border border-slate-200 transition-all flex items-center gap-1"
                          >
                            <span>🌅 Buka Pintu Pagi Hari</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const p = rolePresets.find(x => x.title.toLowerCase().includes('menutup dan mengunci'));
                              if (p) handleApplyPreset(p);
                            }}
                            className="px-2 py-1 bg-white hover:bg-blue-100 active:scale-95 text-slate-800 text-[11px] font-medium rounded-md border border-slate-200 transition-all flex items-center gap-1"
                          >
                            <span>🔒 Tutup Pintu Sore Hari</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const p = rolePresets.find(x => x.title.toLowerCase().includes('patroli keamanan'));
                              if (p) handleApplyPreset(p);
                            }}
                            className="px-2 py-1 bg-white hover:bg-blue-100 active:scale-95 text-slate-800 text-[11px] font-medium rounded-md border border-slate-200 transition-all flex items-center gap-1"
                          >
                            <span>🛡️ Patroli Malam</span>
                          </button>
                        </>
                      )}

                      {role === 'TU' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const p = rolePresets.find(x => x.category === 'kepegawaian');
                              if (p) handleApplyPreset(p);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-blue-100 active:scale-95 text-blue-900 text-[11px] font-semibold rounded-md border border-blue-300 transition-all"
                          >
                            📋 Kepegawaian GTK
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const p = rolePresets.find(x => x.category === 'siswa');
                              if (p) handleApplyPreset(p);
                            }}
                            className="px-2 py-1 bg-white hover:bg-blue-100 active:scale-95 text-slate-800 text-[11px] font-medium rounded-md border border-slate-200 transition-all"
                          >
                            🎓 Kesiswaan & PIP
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const p = rolePresets.find(x => x.category === 'surat_masuk');
                              if (p) handleApplyPreset(p);
                            }}
                            className="px-2 py-1 bg-white hover:bg-blue-100 active:scale-95 text-slate-800 text-[11px] font-medium rounded-md border border-slate-200 transition-all"
                          >
                            ✉️ Agenda Surat Masuk
                          </button>
                        </>
                      )}

                      {role === 'SERVICE' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const p = rolePresets.find(x => x.category === 'kebersihan_wc');
                              if (p) handleApplyPreset(p);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-blue-100 active:scale-95 text-blue-900 text-[11px] font-semibold rounded-md border border-blue-300 transition-all"
                          >
                            🚽 Pembersihan Toilet & WC
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const p = rolePresets.find(x => x.category === 'kebersihan_kantor');
                              if (p) handleApplyPreset(p);
                            }}
                            className="px-2 py-1 bg-white hover:bg-blue-100 active:scale-95 text-slate-800 text-[11px] font-medium rounded-md border border-slate-200 transition-all"
                          >
                            🧹 Pel Lantai & Ruang Kantor
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const p = rolePresets.find(x => x.category === 'kebersihan_sampah');
                              if (p) handleApplyPreset(p);
                            }}
                            className="px-2 py-1 bg-white hover:bg-blue-100 active:scale-95 text-slate-800 text-[11px] font-medium rounded-md border border-slate-200 transition-all"
                          >
                            🗑️ Angkut Sampah ke TPS
                          </button>
                        </>
                      )}
                    </div>
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

              {/* APPLIED PRESET NOTIFICATION BANNER */}
              {appliedPresetNotice && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Template pekerjaan aktif: <strong>{appliedPresetNotice}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAppliedPresetNotice(null)}
                    className="text-emerald-700 hover:text-emerald-950 font-bold px-1.5 py-0.5 rounded text-xs"
                    title="Tutup pemberitahuan"
                  >
                    ×
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Jenis Kategori Layanan:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryModal(true)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
                      title="Tambah jenis kategori layanan baru sesuai keinginan penguna"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Tambah Kategori Baru</span>
                    </button>
                  </div>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const newCat = e.target.value as TaskCategory;
                      const customCat = customCategories.find(c => c.slug === newCat && c.role === role);
                      setFormData(prev => ({ 
                        ...prev, 
                        category: newCat,
                        taskType: customCat ? customCat.classification : getTaskClassification(role, newCat, undefined, customCategories)
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900"
                  >
                    {renderCategoryOptions()}
                  </select>
                  {categoryNotice && (
                    <div className="mt-1.5 p-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold rounded-md flex items-center gap-1.5 animate-fadeIn">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{categoryNotice}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* KLASIFIKASI KEDINASAN: TUGAS POKOK (TUPOKSI) VS TUGAS TAMBAHAN */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Klasifikasi Tugas Kedinasan:</span>
                    <span className="text-[10.5px] text-slate-500 font-normal hidden sm:inline">(Sinkron otomatis ke Rekapitulasi Laporan Bulanan Bagian III)</span>
                  </label>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    formData.taskType === 'pokok' ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {formData.taskType === 'pokok' ? '⭐ Tugas Pokok (Tupoksi)' : '📌 Tugas Tambahan'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, taskType: 'pokok' }))}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      formData.taskType === 'pokok'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Target className="w-4 h-4 text-blue-600" />
                    <span>Tugas Pokok (Tupoksi)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, taskType: 'tambahan' }))}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      formData.taskType === 'tambahan'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BookmarkCheck className="w-4 h-4 text-amber-600" />
                    <span>Tugas Tambahan / Insidental</span>
                  </button>
                </div>

                {/* Quick picker from registered Tupoksi list */}
                {(currentRoleTupoksi.tupoksiList.length > 0 || currentRoleTupoksi.tugasTambahanList.length > 0) && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[10.5px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <span>📋 Atau pilih cepat dari daftar butir resmi:</span>
                    </p>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const [type, ...rest] = val.split(':::');
                        const text = rest.join(':::');
                        handlePickFromTupoksi(text, type as 'pokok' | 'tambahan');
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="" disabled>-- Klik untuk memilih butir tugas pokok / tambahan --</option>
                      <optgroup label="⭐ Daftar Tugas Pokok (Tupoksi)">
                        {currentRoleTupoksi.tupoksiList.map((item, idx) => (
                          <option key={`tp-${idx}`} value={`pokok:::${item}`}>
                            {idx + 1}. {item}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="📌 Daftar Tugas Tambahan & Insidental">
                        {currentRoleTupoksi.tugasTambahanList.map((item, idx) => (
                          <option key={`tt-${idx}`} value={`tambahan:::${item}`}>
                            {idx + 1}. {item}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                )}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Uraian Rincian Pekerjaan / Langkah Pelaksanaan:
                  </label>
                  <button
                    type="button"
                    onClick={handleAiGenerateDescription}
                    disabled={isGeneratingAiDescription}
                    className="text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Uraian rincian pekerjaan diisi otomatis oleh kecerdasan AI menyesuaikan judul kegiatan tugas harian"
                  >
                    {isGeneratingAiDescription ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        <span>Menuliskan rincian...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>✨ Tulis Rincian Otomatis (AI)</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan langkah kerja, alat/sistem yang digunakan, dan hasil kerja yang dicapai (atau klik '✨ Tulis Rincian Otomatis (AI)' untuk dirumuskan langsung)..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed text-slate-800"
                />
              </div>

              {/* Lokasi & Volume Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Lokasi / Titik Pelaksanaan:
                    </label>
                    <span className="text-[10px] text-slate-400">Pilihan / Ketik</span>
                  </div>
                  <input
                    type="text"
                    list="location-preset-options"
                    required
                    placeholder="Ketik atau pilih lokasi di lapangan..."
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <datalist id="location-preset-options">
                    {currentLocationChips.map((chip, idx) => (
                      <option key={idx} value={chip} />
                    ))}
                  </datalist>

                  {/* Dropdown selector for 1-click option */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData(prev => ({ ...prev, location: e.target.value }));
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="w-full mt-1.5 px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-md text-slate-600 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="" disabled>-- Pilihan Cepat Titik Lokasi Lapangan --</option>
                    {currentLocationChips.map((chip, idx) => (
                      <option key={idx} value={chip}>📍 {chip}</option>
                    ))}
                  </select>

                  {/* Quick location chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {currentLocationChips.slice(0, 6).map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, location: chip }))}
                        className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          formData.location === chip 
                            ? 'bg-blue-600 text-white font-semibold' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Capaian Volume / Satuan Hasil:
                    </label>
                    <span className="text-[10px] text-slate-400">Pilihan / Ketik</span>
                  </div>
                  <input
                    type="text"
                    list="volume-preset-options"
                    required
                    placeholder="Misal: 1 berkas dinas, 4 berkas ASN, 8 bilik toilet"
                    value={formData.volumeUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, volumeUnit: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <datalist id="volume-preset-options">
                    {currentVolumeChips.map((chip, idx) => (
                      <option key={idx} value={chip} />
                    ))}
                  </datalist>

                  {/* Dropdown selector for 1-click option */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData(prev => ({ ...prev, volumeUnit: e.target.value }));
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="w-full mt-1.5 px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-md text-slate-600 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="" disabled>-- Pilihan Cepat Volume / Satuan Hasil --</option>
                    {currentVolumeChips.map((chip, idx) => (
                      <option key={idx} value={chip}>📦 {chip}</option>
                    ))}
                  </select>

                  {/* Quick volume chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {currentVolumeChips.slice(0, 6).map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, volumeUnit: chip }))}
                        className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          formData.volumeUnit === chip 
                            ? 'bg-blue-600 text-white font-semibold' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
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

      {/* MODAL TAMBAH KATEGORI LAYANAN BARU (SESUAI KEINGINAN PENGGUNA) */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-2xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tambah Jenis Kategori Layanan</h3>
                  <p className="text-[11px] text-slate-500">Sesuai kebutuhan & keinginan penguna ({role})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nama Kategori Layanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Contoh: Pemeliharaan AC & Genset, Pengarsipan Digital, dll."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Klasifikasi Tugas Kedinasan:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCatClassification('pokok')}
                    className={`p-2 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer ${
                      newCatClassification === 'pokok'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-blue-600" />
                      <span>⭐ Tugas Pokok</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">Tupoksi utama dinas</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCatClassification('tambahan')}
                    className={`p-2 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer ${
                      newCatClassification === 'tambahan'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>📌 Tugas Tambahan</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">Tugas penunjang/khusus</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Keterangan / Ruang Lingkup Layanan <span className="text-slate-400 font-normal">(Opsional)</span>:
                </label>
                <input
                  type="text"
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  placeholder="Contoh: Pembersihan filter udara, penggantian oli, pengecekan berkala"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan & Pilih Kategori</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
