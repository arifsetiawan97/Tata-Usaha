import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { RoleType, TaskCategory } from '../../types';
import { 
  Lock, 
  Unlock, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Play, 
  RefreshCw, 
  FileText, 
  Check, 
  Plus, 
  Trash2, 
  Settings2, 
  AlertCircle, 
  X, 
  Shuffle, 
  Building2, 
  Shield, 
  BookOpen, 
  FlaskConical,
  Info,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Ban,
  CalendarDays,
  SlidersHorizontal
} from 'lucide-react';
import { 
  buildMonthCalendarDays, 
  checkIndonesianHoliday, 
  DayCalendarInfo 
} from '../../utils/holidayHelper';

interface SecretAiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: RoleType;
  onOpenReport?: (month: number, year: number, role: RoleType) => void;
}

export type ScheduleMode = 'every_workday' | 'specific_days' | 'weekly_rotation';

export interface EditableTaskTemplate {
  id: string;
  enabled: boolean;
  title: string;
  taskType: 'pokok' | 'tambahan';
  category: TaskCategory;
  location: string;
  volumeUnit: string;
  // Waktu dasar & Pengacakan
  baseTimeStart: string; // HH:MM
  baseTimeEnd: string;   // HH:MM
  isTimeRandomized: boolean; // acak otomatis
  jitterMinutes: number; // toleransi acak (+/- menit)
  // Pengaturan Jadwal Hari Kerja Mingguan
  scheduleMode: ScheduleMode;
  specificDays?: number[]; // 1: Sen, 2: Sel, 3: Rab, 4: Kam, 5: Jum, 6: Sab
  weeklyRotation?: Record<number, number[]>; // weekNumber (1..5) -> array of dayOfWeek (1..6)
  notes?: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_LABELS = [
  { day: 1, name: 'Senin', short: 'Sen' },
  { day: 2, name: 'Selasa', short: 'Sel' },
  { day: 3, name: 'Rabu', short: 'Rab' },
  { day: 4, name: 'Kamis', short: 'Kam' },
  { day: 5, name: 'Jumat', short: 'Jum' },
  { day: 6, name: 'Sabtu', short: 'Sab' }
];

// Presets bawaan per role dengan dukungan penjadwalan mingguan berjenjang
const DEFAULT_TEMPLATES_BY_ROLE: Record<RoleType, EditableTaskTemplate[]> = {
  PENJAGA: [
    {
      id: 'pj-1',
      enabled: true,
      title: 'Membuka pintu gerbang utama dan seluruh akses sekolah',
      taskType: 'pokok',
      category: 'keamanan',
      location: 'Gerbang Utama & Gedung Satdik',
      volumeUnit: '4 pintu gedung/kelas',
      baseTimeStart: '07:00',
      baseTimeEnd: '07:15',
      isTimeRandomized: true,
      jitterMinutes: 8,
      scheduleMode: 'every_workday',
      notes: 'Pintu gerbang dan seluruh akses ruang belajar dibuka tepat waktu sebelum jam masuk siswa.'
    },
    {
      id: 'pj-2',
      enabled: true,
      title: 'Patroli keamanan lingkungan sekolah, penataan parkir, dan pemeriksaan tamu dinas',
      taskType: 'pokok',
      category: 'keamanan',
      location: 'Lingkungan Sekolah & Pos Jaga',
      volumeUnit: '1 kawasan sekolah & buku tamu',
      baseTimeStart: '09:30',
      baseTimeEnd: '10:45',
      isTimeRandomized: true,
      jitterMinutes: 10,
      scheduleMode: 'every_workday',
      notes: 'Situasi aman terkendali, tamu dinas tercatat rapi di buku ekspedisi tamu.'
    },
    {
      id: 'pj-3',
      enabled: true,
      title: 'Pemeriksaan rutin instalasi kran air tandon, saklar listrik, dan pemeliharaan sarpras',
      taskType: 'tambahan',
      category: 'perbaikan_sapras',
      location: 'Selasar Gedung & Area Tandon Air',
      volumeUnit: '8 titik sarpras sekolah',
      baseTimeStart: '13:00',
      baseTimeEnd: '14:00',
      isTimeRandomized: true,
      jitterMinutes: 10,
      scheduleMode: 'specific_days',
      specificDays: [2, 4, 6], // Selasa, Kamis, Sabtu
      notes: 'Instalasi listrik dan kran air berfungsi normal tanpa kebocoran.'
    },
    {
      id: 'pj-4',
      enabled: true,
      title: 'Menutup, mengunci pintu gerbang utama, dan mematikan seluruh saklar listrik gedung',
      taskType: 'pokok',
      category: 'keamanan',
      location: 'Gerbang Utama & Seluruh Gedung',
      volumeUnit: '4 pintu gedung & 1 gerbang utama',
      baseTimeStart: '16:00',
      baseTimeEnd: '16:30',
      isTimeRandomized: true,
      jitterMinutes: 12,
      scheduleMode: 'every_workday',
      notes: 'Seluruh akses ruangan terkunci rapat, lampu teras dinyalakan, dan gerbang digembok aman.'
    }
  ],
  TU: [
    {
      id: 'tu-1',
      enabled: true,
      title: 'Pencatatan buku agenda surat masuk dinas dan pengajuan lembar disposisi kepala sekolah',
      taskType: 'pokok',
      category: 'surat_masuk',
      location: 'Ruang Tata Usaha (Meja Agenda)',
      volumeUnit: '5 berkas surat dinas',
      baseTimeStart: '08:00',
      baseTimeEnd: '09:15',
      isTimeRandomized: true,
      jitterMinutes: 10,
      scheduleMode: 'every_workday',
      notes: 'Surat masuk dinas telah diagendakan dan didisposisikan kepada pimpinan/wakil.'
    },
    {
      id: 'tu-2',
      enabled: true,
      title: 'Pelayanan administrasi kesiswaan, legalisir dokumen, dan penerbitan surat keterangan aktif',
      taskType: 'pokok',
      category: 'siswa',
      location: 'Loket Pelayanan Tata Usaha',
      volumeUnit: '8 lembar layanan kesiswaan',
      baseTimeStart: '09:30',
      baseTimeEnd: '11:30',
      isTimeRandomized: true,
      jitterMinutes: 10,
      scheduleMode: 'every_workday',
      notes: 'Pelayanan administrasi siswa dan orang tua berlangsung tertib dan tuntas.'
    },
    {
      id: 'tu-3',
      enabled: true,
      title: 'Verifikasi berkas kepegawaian PTK, pembaruan absensi digital SIASN, dan arsip berkas',
      taskType: 'pokok',
      category: 'kepegawaian',
      location: 'Ruang TU (Subbag Kepegawaian)',
      volumeUnit: '4 berkas PTK / ASN',
      baseTimeStart: '13:00',
      baseTimeEnd: '14:30',
      isTimeRandomized: true,
      jitterMinutes: 10,
      scheduleMode: 'weekly_rotation',
      weeklyRotation: {
        1: [1, 3], // Minggu 1: Senin, Rabu
        2: [2, 4], // Minggu 2: Selasa, Kamis
        3: [1, 3], // Minggu 3: Senin, Rabu
        4: [2, 4], // Minggu 4: Selasa, Kamis
        5: [1, 3]  // Minggu 5: Senin, Rabu
      },
      notes: 'Data berkas telah diverifikasi dan diunggah ke arsip digital kepegawaian.'
    },
    {
      id: 'tu-4',
      enabled: true,
      title: 'Pengarsipan surat keluar, penomoran kode klasifikasi dinas, dan pengiriman ekspedisi',
      taskType: 'tambahan',
      category: 'surat_keluar',
      location: 'Ruang Arsip Tata Usaha',
      volumeUnit: '2 nomor surat dinas keluar',
      baseTimeStart: '14:45',
      baseTimeEnd: '15:45',
      isTimeRandomized: true,
      jitterMinutes: 8,
      scheduleMode: 'every_workday',
      notes: 'Surat keluar tercatat di Buku Ekspedisi dan tembusan tersimpan rapi.'
    }
  ],
  SERVICE: [
    {
      id: 'srv-1',
      enabled: true,
      title: 'Pembersihan dan sanitasi ruang kelas, ruang guru, lorong selasar, dan meja kerja',
      taskType: 'pokok',
      category: 'kebersihan_kantor',
      location: 'Ruang Kelas & Kantor Guru',
      volumeUnit: '6 ruang belajar & selasar',
      baseTimeStart: '06:30',
      baseTimeEnd: '07:45',
      isTimeRandomized: true,
      jitterMinutes: 10,
      scheduleMode: 'every_workday',
      notes: 'Ruang kelas dan kantor bersih, wangi, serta siap digunakan untuk kegiatan pembelajaran.'
    },
    {
      id: 'srv-2',
      enabled: true,
      title: 'Pembersihan total, penyikatan lantai, disinfeksi, dan pengisian air toilet siswa & guru',
      taskType: 'pokok',
      category: 'kebersihan_wc',
      location: 'Kamar Mandi & Toilet Satdik',
      volumeUnit: '4 bilik toilet guru & siswa',
      baseTimeStart: '09:30',
      baseTimeEnd: '10:45',
      isTimeRandomized: true,
      jitterMinutes: 8,
      scheduleMode: 'every_workday',
      notes: 'Toilet disikat bersih dengan karbol wangi, saluran air lancar tanpa sumbatan.'
    },
    {
      id: 'srv-3',
      enabled: true,
      title: 'Pengumpulan sampah terpilah dari ruang kelas, pemilahan organik, dan pembuangan ke TPS',
      taskType: 'pokok',
      category: 'kebersihan_sampah',
      location: 'Tempat Pembuangan Sementara (TPS)',
      volumeUnit: '8 kantong sampah terpilah',
      baseTimeStart: '11:45',
      baseTimeEnd: '12:45',
      isTimeRandomized: true,
      jitterMinutes: 10,
      scheduleMode: 'every_workday',
      notes: 'Sampah dipilah antara organik dan anorganik serta dipindahkan ke TPS luar sekolah.'
    },
    {
      id: 'srv-4',
      enabled: true,
      title: 'Penyiraman tanaman hias, pembersihan halaman upacara, dan penataan taman sekolah',
      taskType: 'tambahan',
      category: 'perawatan_taman',
      location: 'Halaman Utama & Taman Sekolah',
      volumeUnit: '1 area taman & lapangan',
      baseTimeStart: '14:30',
      baseTimeEnd: '15:45',
      isTimeRandomized: true,
      jitterMinutes: 12,
      scheduleMode: 'specific_days',
      specificDays: [1, 3, 5], // Senin, Rabu, Jumat
      notes: 'Tanaman disiram merata, dedaunan kering dibersihkan dari area lapangan.'
    }
  ],
  PERPUS: [
    {
      id: 'prs-1',
      enabled: true,
      title: 'Pelayanan sirkulasi peminjaman, pengembalian buku teks, dan pemeriksaan fisik koleksi',
      taskType: 'pokok',
      category: 'sirkulasi_peminjaman',
      location: 'Meja Sirkulasi Perpustakaan',
      volumeUnit: '35 transaksi pemustaka',
      baseTimeStart: '08:30',
      baseTimeEnd: '11:30',
      isTimeRandomized: true,
      jitterMinutes: 12,
      scheduleMode: 'every_workday',
      notes: 'Transaksi sirkulasi tercatat di buku peminjaman dan database barcode perpustakaan.'
    },
    {
      id: 'prs-2',
      enabled: true,
      title: 'Pengolahan bahan pustaka baru, penentuan klasifikasi DDC, pencetakan barcode, dan label',
      taskType: 'pokok',
      category: 'katalogisasi_buku',
      location: 'Ruang Pengolahan Bahan Pustaka',
      volumeUnit: '25 eksemplar buku baru',
      baseTimeStart: '10:00',
      baseTimeEnd: '11:45',
      isTimeRandomized: true,
      jitterMinutes: 10,
      // Sesuai contoh pengguna: Minggu 1: Sen & Kam; Minggu 2: Rab & Sab, dst.
      scheduleMode: 'weekly_rotation',
      weeklyRotation: {
        1: [1, 4], // Minggu I: Senin & Kamis
        2: [3, 6], // Minggu II: Rabu & Sabtu
        3: [1, 4], // Minggu III: Senin & Kamis
        4: [3, 6], // Minggu IV: Rabu & Sabtu
        5: [1, 4]  // Minggu V: Senin & Kamis
      },
      notes: 'Buku telah diregistrasi ke Buku Induk Inventaris dan berstempel kepemilikan sekolah.'
    },
    {
      id: 'prs-3',
      enabled: true,
      title: 'Pendampingan jam literasi siswa, bimbingan resume bacaan, dan penataan kembali rak buku',
      taskType: 'tambahan',
      category: 'layanan_literasi',
      location: 'Ruang Baca Utama Perpustakaan',
      volumeUnit: '2 rombel (64 peserta didik)',
      baseTimeStart: '13:00',
      baseTimeEnd: '14:15',
      isTimeRandomized: true,
      jitterMinutes: 10,
      scheduleMode: 'specific_days',
      specificDays: [2, 5], // Selasa & Jumat
      notes: 'Siswa aktif membaca buku non-pelajaran dan resume bacaan terkumpul rapi.'
    },
    {
      id: 'prs-4',
      enabled: true,
      title: 'Restorasi, perbaikan cover buku ensiklopedia, dan kebersihan lingkungan ruang baca',
      taskType: 'pokok',
      category: 'perawatan_buku',
      location: 'Meja Restorasi & Rak Koleksi',
      volumeUnit: '12 buku referensi diperbaiki',
      baseTimeStart: '14:30',
      baseTimeEnd: '15:30',
      isTimeRandomized: true,
      jitterMinutes: 8,
      scheduleMode: 'weekly_rotation',
      weeklyRotation: {
        1: [3, 5], // Minggu 1: Rabu, Jumat
        2: [1, 4], // Minggu 2: Senin, Kamis
        3: [3, 5], // Minggu 3: Rabu, Jumat
        4: [1, 4], // Minggu 4: Senin, Kamis
        5: [3, 5]  // Minggu 5: Rabu, Jumat
      },
      notes: 'Koleksi buku rusak ringan telah dilaminasi ulang dan siap dipinjamkan kembali.'
    }
  ],
  LAB_IPA: [
    {
      id: 'ipa-1',
      enabled: true,
      title: 'Penyiapan alat mikroskop cahaya, preparat basah jaringan tumbuhan, dan lembar kerja',
      taskType: 'pokok',
      category: 'persiapan_praktikum',
      location: 'Ruang Laboratorium IPA',
      volumeUnit: '12 unit mikroskop & preparat',
      baseTimeStart: '07:30',
      baseTimeEnd: '08:45',
      isTimeRandomized: true,
      jitterMinutes: 10,
      scheduleMode: 'every_workday',
      notes: 'Seluruh mikroskop berfungsi dengan fokus pencahayaan jernih.'
    },
    {
      id: 'ipa-2',
      enabled: true,
      title: 'Pendampingan praktikum siswa, pemantauan K3 laboratorium, dan keselamatan kerja',
      taskType: 'pokok',
      category: 'k3_laboratorium',
      location: 'Meja Praktikum Siswa Lab IPA',
      volumeUnit: '1 sesi kelas (32 siswa)',
      baseTimeStart: '09:00',
      baseTimeEnd: '11:00',
      isTimeRandomized: true,
      jitterMinutes: 10,
      scheduleMode: 'specific_days',
      specificDays: [1, 2, 4], // Senin, Selasa, Kamis
      notes: 'Kegiatan praktikum berjalan lancar tanpa insiden kecelakaan kerja atau kerusakan alat.'
    },
    {
      id: 'ipa-3',
      enabled: true,
      title: 'Pembersihan alat gelas (glassware), sterilisasi neraca, dan pengembalian ke rak simpan',
      taskType: 'pokok',
      category: 'pemeliharaan_alat',
      location: 'Ruang Preparasi Laboratorium',
      volumeUnit: '30 alat gelas praktikum',
      baseTimeStart: '11:30',
      baseTimeEnd: '12:45',
      isTimeRandomized: true,
      jitterMinutes: 8,
      scheduleMode: 'every_workday',
      notes: 'Alat gelas dicuci bersih dengan aquades dan disimpan di lemari kaca tertutup.'
    },
    {
      id: 'ipa-4',
      enabled: true,
      title: 'Pemeriksaan stok reagen bahan kimia, kalibrasi alat ukur, dan pencatatan buku inventaris',
      taskType: 'tambahan',
      category: 'inventaris_bahan',
      location: 'Lemari Bahan Kimia Khusus B3',
      volumeUnit: '10 botol reagen bahan kimia',
      baseTimeStart: '13:30',
      baseTimeEnd: '14:45',
      isTimeRandomized: true,
      jitterMinutes: 10,
      scheduleMode: 'weekly_rotation',
      weeklyRotation: {
        1: [5], // Jumat
        2: [5], // Jumat
        3: [5], // Jumat
        4: [5], // Jumat
        5: [5]  // Jumat
      },
      notes: 'Bahan kimia tersimpan sesuai standar MSDS dengan label peringatan jelas.'
    }
  ]
};

export const SecretAiGeneratorModal: React.FC<SecretAiGeneratorModalProps> = ({
  isOpen,
  onClose,
  defaultRole,
  onOpenReport
}) => {
  const { 
    currentRole, 
    schoolConfig, 
    tasks, 
    importTasks, 
    deleteMultipleTasks, 
    saveMonthlyReport, 
    generateMonthlyReportFromTasks,
    setActiveNavTab
  } = useApp();

  // Authentication State
  const [passcodeInput, setPasscodeInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Configuration State
  const [targetRole, setTargetRole] = useState<RoleType>(defaultRole || currentRole || 'PENJAGA');
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [workdayMode, setWorkdayMode] = useState<'senin-sabtu' | 'senin-jumat'>('senin-sabtu');
  const [overwriteMode, setOverwriteMode] = useState<'overwrite' | 'append'>('overwrite');
  const [syncToReport, setSyncToReport] = useState<boolean>(true);

  // Locked dates state (Set of date strings 'YYYY-MM-DD' locked by user or holidays)
  const [lockedDates, setLockedDates] = useState<Set<string>>(new Set());
  const [showCalendarView, setShowCalendarView] = useState<boolean>(true);
  const [expandedScheduleTaskId, setExpandedScheduleTaskId] = useState<string | null>(null);

  // Task templates being edited by user
  const [taskTemplates, setTaskTemplates] = useState<EditableTaskTemplate[]>(() => {
    const roleKey = defaultRole || currentRole || 'PENJAGA';
    return JSON.parse(JSON.stringify(DEFAULT_TEMPLATES_BY_ROLE[roleKey] || DEFAULT_TEMPLATES_BY_ROLE.PENJAGA));
  });

  // Switch role template helper
  const handleSwitchRole = (newRole: RoleType) => {
    setTargetRole(newRole);
    setTaskTemplates(JSON.parse(JSON.stringify(DEFAULT_TEMPLATES_BY_ROLE[newRole] || [])));
  };

  // Execution & Result state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSummary, setGenerationSummary] = useState<{
    totalDays: number;
    totalTasks: number;
    monthName: string;
    year: number;
    roleName: string;
    holidayCount: number;
    lockedCount: number;
  } | null>(null);

  // Verifikasi Kode Rahasia (Wajib: "ARIF SETIAWAN")
  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = passcodeInput.trim().toUpperCase();
    
    if (cleanCode === 'ARIF SETIAWAN') {
      setIsUnlocked(true);
      setAuthError(null);
    } else {
      setAuthError('Akses Ditolak: Kode tersembunyi tidak sesuai! Pastikan memasukkan nama otorisasi yang valid.');
    }
  };

  // Toggle template enabled
  const toggleTemplate = (id: string) => {
    setTaskTemplates(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  // Update specific field in template
  const updateTemplateField = (id: string, field: keyof EditableTaskTemplate, val: any) => {
    setTaskTemplates(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t));
  };

  // Toggle day in specificDays
  const handleToggleSpecificDay = (templateId: string, dayNum: number) => {
    setTaskTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      const current = t.specificDays || [1, 2, 3, 4, 5, 6];
      const next = current.includes(dayNum) 
        ? current.filter(d => d !== dayNum) 
        : [...current, dayNum].sort((a, b) => a - b);
      return { ...t, specificDays: next.length > 0 ? next : [dayNum] };
    }));
  };

  // Toggle day in weeklyRotation for a specific week
  const handleToggleWeeklyRotationDay = (templateId: string, weekNum: number, dayNum: number) => {
    setTaskTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      const currentRotation = t.weeklyRotation || { 1: [1, 4], 2: [3, 6], 3: [1, 4], 4: [3, 6], 5: [1, 4] };
      const currentDays = currentRotation[weekNum] || [];
      const nextDays = currentDays.includes(dayNum)
        ? currentDays.filter(d => d !== dayNum)
        : [...currentDays, dayNum].sort((a, b) => a - b);
      return {
        ...t,
        weeklyRotation: {
          ...currentRotation,
          [weekNum]: nextDays.length > 0 ? nextDays : [dayNum]
        }
      };
    }));
  };

  // Apply quick preset to weekly rotation
  const handleApplyRotationPreset = (templateId: string, presetType: 'sen_kam_rab_sab' | 'sen_jum' | 'sel_kam') => {
    setTaskTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      let newRotation: Record<number, number[]>;
      if (presetType === 'sen_kam_rab_sab') {
        newRotation = {
          1: [1, 4], // Minggu 1: Senin, Kamis
          2: [3, 6], // Minggu 2: Rabu, Sabtu
          3: [1, 4], // Minggu 3: Senin, Kamis
          4: [3, 6], // Minggu 4: Rabu, Sabtu
          5: [1, 4]  // Minggu 5: Senin, Kamis
        };
      } else if (presetType === 'sen_jum') {
        newRotation = {
          1: [1, 5],
          2: [1, 5],
          3: [1, 5],
          4: [1, 5],
          5: [1, 5]
        };
      } else {
        newRotation = {
          1: [2, 4],
          2: [2, 4],
          3: [2, 4],
          4: [2, 4],
          5: [2, 4]
        };
      }
      return {
        ...t,
        scheduleMode: 'weekly_rotation',
        weeklyRotation: newRotation
      };
    }));
  };

  // Add new custom task
  const handleAddCustomTask = () => {
    const newT: EditableTaskTemplate = {
      id: `custom-${Date.now()}`,
      enabled: true,
      title: 'Kegiatan operasional harian baru',
      taskType: 'pokok',
      category: 'keamanan',
      location: 'Lingkungan Sekolah',
      volumeUnit: '1 kegiatan operasional',
      baseTimeStart: '08:00',
      baseTimeEnd: '09:00',
      isTimeRandomized: true,
      jitterMinutes: 8,
      scheduleMode: 'every_workday',
      notes: 'Terlaksana dengan baik sesuai instruksi kepala sekolah.'
    };
    setTaskTemplates(prev => [...prev, newT]);
  };

  // Delete template
  const handleDeleteTemplate = (id: string) => {
    setTaskTemplates(prev => prev.filter(t => t.id !== id));
  };

  // Reset to default templates
  const handleResetToDefault = () => {
    setTaskTemplates(JSON.parse(JSON.stringify(DEFAULT_TEMPLATES_BY_ROLE[targetRole] || [])));
  };

  // Build calendar days using the holidayHelper
  const monthCalendarDays = useMemo(() => {
    return buildMonthCalendarDays(selectedYear, selectedMonth, workdayMode, lockedDates);
  }, [selectedYear, selectedMonth, workdayMode, lockedDates]);

  // Active workdays (ready to generate tasks)
  const activeWorkdays = useMemo(() => {
    return monthCalendarDays.filter(d => d.isActiveWorkday);
  }, [monthCalendarDays]);

  // Statistics of the month
  const calendarStats = useMemo(() => {
    let active = 0;
    let sundays = 0;
    let holidays = 0;
    let locked = 0;

    monthCalendarDays.forEach(d => {
      if (d.isActiveWorkday) active++;
      else if (d.isSunday) sundays++;
      else if (d.isNationalHoliday) holidays++;
      else if (d.isUserLocked) locked++;
    });

    return { active, sundays, holidays, locked };
  }, [monthCalendarDays]);

  // Toggle lock on a specific date
  const handleToggleLockDate = (dateStr: string) => {
    setLockedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  // Quick Action: Kunci Tanggal Libur Awal Puasa / Idul Fitri yang ada di bulan ini
  const handleLockRamadanHolidays = () => {
    const toLock: string[] = [];
    monthCalendarDays.forEach(d => {
      const holiday = checkIndonesianHoliday(d.dateStr);
      if (holiday && (holiday.type === 'puasa_ramadhan' || holiday.name.toLowerCase().includes('puasa') || holiday.name.toLowerCase().includes('idul fitri'))) {
        toLock.push(d.dateStr);
      }
    });

    if (toLock.length === 0) {
      // Jika tidak ada data spesifik, tawarkan penguncian 3 hari pertama puasa
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      // Kunci 3 hari tanggal awal (contoh: tgl 1, 2, 3) jika dipilih pengguna
      const sampleLock = [`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`, `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-02`];
      setLockedDates(prev => {
        const next = new Set(prev);
        sampleLock.forEach(s => next.add(s));
        return next;
      });
      alert(`Berhasil mengunci tanggal libur khusus awal Ramadhan/puasa pada awal bulan.`);
    } else {
      setLockedDates(prev => {
        const next = new Set(prev);
        toLock.forEach(d => next.add(d));
        return next;
      });
      alert(`Berhasil mengunci ${toLock.length} tanggal libur puasa/Idul Fitri di bulan ${MONTH_NAMES[selectedMonth - 1]}.`);
    }
  };

  // Quick Action: Buka semua kunci tanggal
  const handleUnlockAll = () => {
    setLockedDates(new Set());
  };

  // Smart Randomizer for time with realistic human fluctuation
  const randomizeTimes = (baseStart: string, baseEnd: string, jitterMinutes: number) => {
    try {
      const [sh, sm] = baseStart.split(':').map(Number);
      const [eh, em] = baseEnd.split(':').map(Number);
      
      const startMinTotal = sh * 60 + sm;
      const endMinTotal = eh * 60 + em;
      const originalDuration = Math.max(10, endMinTotal - startMinTotal);

      // Jitter range between -jitterMinutes and +jitterMinutes
      const jitter = Math.floor(Math.random() * (jitterMinutes * 2 + 1)) - jitterMinutes;
      const durationJitter = Math.floor(Math.random() * 7) - 3; // -3 to +3 min variation

      let newStartMin = Math.max(360, startMinTotal + jitter); // not earlier than 06:00
      let newEndMin = newStartMin + Math.max(10, originalDuration + durationJitter);

      const pad = (n: number) => String(n).padStart(2, '0');
      const startStr = `${pad(Math.floor(newStartMin / 60))}:${pad(newStartMin % 60)}`;
      const endStr = `${pad(Math.floor(newEndMin / 60))}:${pad(newEndMin % 60)}`;

      return { startStr, endStr };
    } catch {
      return { startStr: baseStart, endStr: baseEnd };
    }
  };

  // EXECUTE GENERATION DENGAN JADWAL HARI & PENGECUALIAN LIBUR RESMI
  const handleExecuteGeneration = async () => {
    const enabledTemplates = taskTemplates.filter(t => t.enabled);
    if (enabledTemplates.length === 0) {
      alert('Pilih minimal satu tugas operasional untuk digenerate.');
      return;
    }

    if (activeWorkdays.length === 0) {
      alert('Tidak ada hari kerja aktif yang tersedia di bulan ini karena seluruh tanggal merupakan hari libur/terkunci.');
      return;
    }

    setIsGenerating(true);

    try {
      // 1. If overwrite mode: find and remove existing tasks for targetRole in selectedMonth & year
      if (overwriteMode === 'overwrite') {
        const existingTaskIds = tasks.filter(t => {
          if (t.role.toUpperCase() !== targetRole.toUpperCase()) return false;
          const [yStr, mStr] = t.date.split('-');
          return Number(yStr) === selectedYear && Number(mStr) === selectedMonth;
        }).map(t => t.id);

        if (existingTaskIds.length > 0) {
          deleteMultipleTasks(existingTaskIds);
        }
      }

      // 2. Build synthesized task logs
      const operatorProfile = schoolConfig.operatorProfiles?.[targetRole];
      const petugasName = operatorProfile?.nama || 'Petugas Layanan Operasional';

      const generatedTasks: Omit<any, 'id'>[] = [];

      // Iterasi HANYA pada hari kerja aktif (Libur nasional, hari Minggu, dan tanggal terkunci otomatis dilewati)
      activeWorkdays.forEach((dayInfo) => {
        enabledTemplates.forEach((tpl) => {
          // Evaluasi aturan hari pelaksanaan tugas:
          let shouldExecute = true;

          if (tpl.scheduleMode === 'specific_days') {
            const allowedDays = tpl.specificDays || [1, 2, 3, 4, 5, 6];
            shouldExecute = allowedDays.includes(dayInfo.dayOfWeek);
          } else if (tpl.scheduleMode === 'weekly_rotation') {
            const rotation = tpl.weeklyRotation || { 
              1: [1, 4], 
              2: [3, 6], 
              3: [1, 4], 
              4: [3, 6], 
              5: [1, 4] 
            };
            const allowedDays = rotation[dayInfo.weekOfMonth] || rotation[1] || [1, 4];
            shouldExecute = allowedDays.includes(dayInfo.dayOfWeek);
          }

          if (!shouldExecute) return; // Lewati hari ini untuk tugas ini!

          let timeStart = tpl.baseTimeStart;
          let timeEnd = tpl.baseTimeEnd;

          if (tpl.isTimeRandomized) {
            const randomized = randomizeTimes(tpl.baseTimeStart, tpl.baseTimeEnd, tpl.jitterMinutes || 8);
            timeStart = randomized.startStr;
            timeEnd = randomized.endStr;
          }

          generatedTasks.push({
            role: targetRole,
            date: dayInfo.dateStr,
            category: tpl.category,
            taskType: tpl.taskType,
            title: tpl.title,
            description: `Melaksanakan kegiatan ${tpl.title.toLowerCase()} pada area ${tpl.location} dengan target output ${tpl.volumeUnit}. Kondisi terlaksana aman, tertib, dan terdokumentasi resmi.`,
            location: tpl.location,
            timeStart,
            timeEnd,
            status: 'selesai',
            volumeUnit: tpl.volumeUnit,
            petugas: petugasName,
            notes: tpl.notes || 'Pekerjaan tuntas tepat waktu sesuai target naskah dinas.'
          });
        });
      });

      // 3. Batch import tasks into AppContext
      importTasks(generatedTasks);

      // 4. If sync to monthly report: auto generate & save monthly report
      if (syncToReport) {
        setTimeout(() => {
          try {
            const freshReport = generateMonthlyReportFromTasks(targetRole, selectedMonth, selectedYear, true);
            freshReport.approvalStatus = 'disahkan_kepsek';
            saveMonthlyReport(freshReport);
          } catch (e) {
            console.error('Error auto-syncing monthly report:', e);
          }
        }, 100);
      }

      const roleLabels: Record<RoleType, string> = {
        TU: 'Tata Usaha (TU)',
        PENJAGA: 'Penjaga Sekolah',
        SERVICE: 'Layanan Kebersihan (Service)',
        PERPUS: 'Perpustakaan',
        LAB_IPA: 'Laboratorium IPA'
      };

      setGenerationSummary({
        totalDays: activeWorkdays.length,
        totalTasks: generatedTasks.length,
        monthName: MONTH_NAMES[selectedMonth - 1],
        year: selectedYear,
        roleName: roleLabels[targetRole],
        holidayCount: calendarStats.holidays,
        lockedCount: calendarStats.locked
      });

    } catch (err: any) {
      alert('Gagal membuat laporan: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden relative">
        
        {/* ===================================================================
            FASE 1: VERIFIKASI KODE TERSEMBUNYI (ARIF SETIAWAN)
            =================================================================== */}
        {!isUnlocked ? (
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-auto">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-6">
              <Lock className="w-10 h-10 animate-pulse" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Otorisasi Fitur Tersembunyi</span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Kecerdasan Tersembunyi
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Fitur cerdas ini digunakan sewaktu-waktu untuk membuat laporan bulanan dadakan atau secara instan pada semua layanan dengan penyesuaian kalender libur nasional dan rotasi hari kerja realistis. Masukkan kode otorisasi resmi untuk melanjutkan.
            </p>

            <form onSubmit={handleVerifyPasscode} className="w-full mt-6 space-y-4">
              <div>
                <input
                  type="text"
                  autoFocus
                  value={passcodeInput}
                  onChange={(e) => {
                    setPasscodeInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="Ketik kode tersembunyi di sini..."
                  className="w-full text-center tracking-widest uppercase font-bold text-base sm:text-lg px-4 py-3.5 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
                />
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 text-left animate-shake">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{authError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Buka Akses Cerdas</span>
                </button>
              </div>
            </form>
          </div>
        ) : generationSummary ? (
          /* ===================================================================
             FASE 3: RINGKASAN HASIL GENERASI SUKSES
             =================================================================== */
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-auto space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border-4 border-emerald-200 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                Berhasil Dibuat Secara Instan!
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                Lapor Bulanan Siap Dicetak
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Kecerdasan tersembunyi telah berhasil menyusun seluruh rincian tugas operasional dan menyinkronkan Laporan Bulanan resmi.
              </p>
            </div>

            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Layanan Operasional:</span>
                <span className="font-bold text-slate-900">{generationSummary.roleName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Periode Pelaksanaan:</span>
                <span className="font-bold text-indigo-700">
                  {generationSummary.monthName} {generationSummary.year}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Hari Kerja Aktif:</span>
                <span className="font-bold text-emerald-700">{generationSummary.totalDays} Hari Kerja</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Libur Nasional / Terkunci Dikecualikan:</span>
                <span className="font-bold text-rose-700">
                  {generationSummary.holidayCount + generationSummary.lockedCount} Hari Libur (Tidak Ada Log)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Total Tugas Terjadwal:</span>
                <span className="font-bold text-blue-700">{generationSummary.totalTasks} Tugas Operasional</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
              <button
                type="button"
                onClick={() => {
                  setGenerationSummary(null);
                  onClose();
                  if (onOpenReport) {
                    onOpenReport(selectedMonth, selectedYear, targetRole);
                  } else {
                    setActiveNavTab('monthly');
                  }
                }}
                className="w-full sm:flex-1 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Buka Lapor Bulanan ({generationSummary.monthName})</span>
              </button>
              <button
                type="button"
                onClick={() => setGenerationSummary(null)}
                className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm transition cursor-pointer"
              >
                Kembali ke Konfigurasi
              </button>
            </div>
          </div>
        ) : (
          /* ===================================================================
             FASE 2: PANEL KECERDASAN TERSEMBUNYI (KONFIGURASI LENGKAP)
             =================================================================== */
          <>
            {/* Modal Header */}
            <div className="shrink-0 px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center shadow">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-white">Generator Cerdas Laporan Bulanan Instan</h3>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                      Kecerdasan Aktif
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Otorisasi Terverifikasi: <strong>ARIF SETIAWAN</strong> · Otomatisasi Logbook Harian & Rekap Lapor Bulanan Realistis
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-800">
              
              {/* 1. Pilih Akun / Layanan Operasional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Pilih Akun / Layanan Operasional:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { role: 'PENJAGA' as RoleType, label: 'Penjaga Sekolah', icon: Shield },
                    { role: 'TU' as RoleType, label: 'Tata Usaha', icon: Building2 },
                    { role: 'SERVICE' as RoleType, label: 'Kebersihan', icon: Sparkles },
                    { role: 'PERPUS' as RoleType, label: 'Perpustakaan', icon: BookOpen },
                    { role: 'LAB_IPA' as RoleType, label: 'Lab IPA', icon: FlaskConical }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = targetRole === item.role;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => handleSwitchRole(item.role)}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70 text-slate-600'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <div>
                          <span className={`block text-xs font-bold ${isSelected ? 'text-blue-950' : 'text-slate-700'}`}>
                            {item.label}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {item.role}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Pengaturan Periode & Kalender Hari Libur Nasional & Tanggal Terkunci */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Bulan Laporan</span>
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    >
                      {MONTH_NAMES.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          Bulan {idx + 1} - {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tahun Anggaran</span>
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    >
                      {[2024, 2025, 2026, 2027, 2028].map((y) => (
                        <option key={y} value={y}>
                          Tahun {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Sistem Hari Kerja</span>
                    </label>
                    <select
                      value={workdayMode}
                      onChange={(e) => setWorkdayMode(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="senin-sabtu">Senin s/d Sabtu (6 Hari Kerja)</option>
                      <option value="senin-jumat">Senin s/d Jumat (5 Hari Kerja)</option>
                    </select>
                  </div>
                </div>

                {/* Sub-panel Kalender Nasional & Tanggal Terkunci (Libur Puasa / Hari Kerja) */}
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Kalender Nasional & Tanggal Libur/Terkunci ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={handleLockRamadanHolidays}
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 rounded-lg flex items-center gap-1 transition cursor-pointer"
                        title="Kunci hari libur khusus puasa ramadhan / idul fitri"
                      >
                        <Lock className="w-3 h-3 text-amber-700" />
                        <span>Kunci Libur Puasa / Hari Raya</span>
                      </button>

                      {lockedDates.size > 0 && (
                        <button
                          type="button"
                          onClick={handleUnlockAll}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-white text-slate-600 border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition cursor-pointer"
                        >
                          <Unlock className="w-3 h-3 text-slate-500" />
                          <span>Buka Semua ({lockedDates.size})</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowCalendarView(!showCalendarView)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <span>{showCalendarView ? 'Sembunyikan Kalender' : 'Tampilkan Kalender'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCalendarView ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Summary badges */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold mb-3">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>Hari Kerja Aktif: <strong>{calendarStats.active} hari</strong> (Dibuatkan Log Tugas)</span>
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      <span>Hari Minggu: <strong>{calendarStats.sundays} hari</strong></span>
                    </span>
                    {calendarStats.holidays > 0 && (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-300 rounded-lg flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                        <span>Libur Nasional: <strong>{calendarStats.holidays} hari</strong></span>
                      </span>
                    )}
                    {calendarStats.locked > 0 && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>Terkunci Pengguna: <strong>{calendarStats.locked} hari</strong></span>
                      </span>
                    )}
                  </div>

                  {/* Interactive Date Grid */}
                  {showCalendarView && (
                    <div className="bg-white border border-slate-200 rounded-xl p-3">
                      <p className="text-[10.5px] text-slate-500 mb-2">
                        💡 <strong>Petunjuk:</strong> Klik pada kartu tanggal untuk <strong>MENGUNCI (LOCK)</strong> atau <strong>MEMBUKA (UNLOCK)</strong>. Sistem otomatis tidak akan membuat tugas harian pada tanggal merah, hari Minggu, dan tanggal yang dikunci.
                      </p>

                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-7 gap-1.5 max-h-56 overflow-y-auto p-1">
                        {monthCalendarDays.map((d) => {
                          const isClickable = !d.isSunday && !d.isNationalHoliday;
                          return (
                            <button
                              key={d.dateStr}
                              type="button"
                              onClick={() => isClickable && handleToggleLockDate(d.dateStr)}
                              disabled={!isClickable}
                              className={`p-2 rounded-xl text-left border transition relative flex flex-col justify-between ${
                                d.isSunday
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                                  : d.isNationalHoliday
                                  ? 'bg-rose-50 border-rose-200 text-rose-800 cursor-not-allowed'
                                  : d.isUserLocked
                                  ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold ring-2 ring-amber-400/40 cursor-pointer'
                                  : 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400 text-emerald-950 cursor-pointer'
                              }`}
                              title={
                                d.isNationalHoliday 
                                  ? `Libur Nasional: ${d.holidayName}` 
                                  : d.isSunday 
                                  ? 'Hari Minggu (Libur)' 
                                  : d.isUserLocked 
                                  ? 'Dikunci (Klik untuk membuka)' 
                                  : 'Hari Kerja Aktif (Klik untuk mengunci)'
                              }
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs">{d.dayNumber}</span>
                                <span className="text-[9.5px] font-semibold uppercase">{d.dayName.substring(0, 3)}</span>
                              </div>

                              <div className="mt-1">
                                {d.isSunday ? (
                                  <span className="text-[9px] text-slate-500 font-mono">Minggu</span>
                                ) : d.isNationalHoliday ? (
                                  <span className="text-[9px] font-bold text-rose-700 truncate block">
                                    {d.holidayName || 'Libur'}
                                  </span>
                                ) : d.isUserLocked ? (
                                  <span className="text-[9px] text-amber-800 font-bold flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" />
                                    <span>Terkunci</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-emerald-700 font-semibold flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>Kerja</span>
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Pengaturan Rincian Tugas Operasional & Penjadwalan Waktu Hari */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Shuffle className="w-3.5 h-3.5 text-blue-600" />
                      <span>2. Rincian Tugas Operasional & Pengaturan Waktu Hari:</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Sesuaikan tugas, jam buka/tutup, pengacakan otomatis, dan rotasi hari kerja (misal: Senin & Kamis pada Minggu I, Rabu & Sabtu pada Minggu II).
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Muat Preset Standar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustomTask}
                      className="px-3 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Tugas</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {taskTemplates.map((tpl, index) => {
                    const isScheduleExpanded = expandedScheduleTaskId === tpl.id;
                    const rotation = tpl.weeklyRotation || { 
                      1: [1, 4], 
                      2: [3, 6], 
                      3: [1, 4], 
                      4: [3, 6], 
                      5: [1, 4] 
                    };
                    const specific = tpl.specificDays || [1, 2, 3, 4, 5, 6];

                    return (
                      <div 
                        key={tpl.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          tpl.enabled 
                            ? 'bg-white border-slate-300 shadow-xs' 
                            : 'bg-slate-50/70 border-slate-200 opacity-60'
                        }`}
                      >
                        {/* Header bar tugas */}
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2.5 flex-1">
                            <input
                              type="checkbox"
                              checked={tpl.enabled}
                              onChange={() => toggleTemplate(tpl.id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="w-6 h-6 rounded-full bg-slate-100 font-bold text-slate-700 text-xs flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <input
                              type="text"
                              value={tpl.title}
                              onChange={(e) => updateTemplateField(tpl.id, 'title', e.target.value)}
                              placeholder="Judul rincian tugas..."
                              className="flex-1 px-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <select
                              value={tpl.taskType}
                              onChange={(e) => updateTemplateField(tpl.id, 'taskType', e.target.value)}
                              className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-[10px] font-bold text-slate-700"
                            >
                              <option value="pokok">Tupoksi Pokok</option>
                              <option value="tambahan">Tugas Tambahan</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Hapus tugas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Detail Lokasi, Volume, dan Jam Dasar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100">
                          {/* Lokasi & Area */}
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Lokasi Pelaksanaan</label>
                            <input
                              type="text"
                              value={tpl.location}
                              onChange={(e) => updateTemplateField(tpl.id, 'location', e.target.value)}
                              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                            />
                          </div>

                          {/* Volume Target */}
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Target & Satuan Volume</label>
                            <input
                              type="text"
                              value={tpl.volumeUnit}
                              onChange={(e) => updateTemplateField(tpl.id, 'volumeUnit', e.target.value)}
                              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium"
                            />
                          </div>

                          {/* Pengaturan Jam & Pengacakan Otomatis */}
                          <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-200/60">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-blue-900 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-600" />
                                <span>Jam Dasar Pelaksanaan</span>
                              </span>
                              <label className="flex items-center gap-1 text-[9.5px] font-bold text-indigo-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tpl.isTimeRandomized}
                                  onChange={(e) => updateTemplateField(tpl.id, 'isTimeRandomized', e.target.checked)}
                                  className="w-3 h-3 rounded text-indigo-600"
                                />
                                <span>Acak Jam Otomatis</span>
                              </label>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <input
                                type="time"
                                value={tpl.baseTimeStart}
                                onChange={(e) => updateTemplateField(tpl.id, 'baseTimeStart', e.target.value)}
                                className="w-20 px-1.5 py-0.5 bg-white border border-blue-300 rounded font-mono text-[11px] font-bold"
                              />
                              <span className="text-slate-400 text-xs">-</span>
                              <input
                                type="time"
                                value={tpl.baseTimeEnd}
                                onChange={(e) => updateTemplateField(tpl.id, 'baseTimeEnd', e.target.value)}
                                className="w-20 px-1.5 py-0.5 bg-white border border-blue-300 rounded font-mono text-[11px] font-bold"
                              />
                              {tpl.isTimeRandomized && (
                                <span className="text-[9.5px] text-indigo-600 font-semibold italic ml-auto">
                                  ± {tpl.jitterMinutes || 8} mnt
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Pengaturan Jadwal Waktu Hari (Setiap Hari / Hari Tertentu / Rotasi Mingguan) */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                                <SlidersHorizontal className="w-3 h-3 text-indigo-600" />
                                <span>Jadwal Hari Kerja:</span>
                              </span>
                              <div className="flex items-center gap-1 text-[10px]">
                                {[
                                  { mode: 'every_workday' as ScheduleMode, label: 'Setiap Hari Kerja' },
                                  { mode: 'specific_days' as ScheduleMode, label: 'Hari Tertentu' },
                                  { mode: 'weekly_rotation' as ScheduleMode, label: 'Rotasi Mingguan (Realistis)' }
                                ].map((sm) => (
                                  <button
                                    key={sm.mode}
                                    type="button"
                                    onClick={() => updateTemplateField(tpl.id, 'scheduleMode', sm.mode)}
                                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                                      tpl.scheduleMode === sm.mode
                                        ? 'bg-indigo-600 text-white shadow-2xs'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {sm.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setExpandedScheduleTaskId(isScheduleExpanded ? null : tpl.id)}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>{isScheduleExpanded ? 'Tutup Detail Hari' : 'Atur Hari'}</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${isScheduleExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>

                          {/* Tampilan Ringkas Hari Aktif */}
                          {!isScheduleExpanded && (
                            <div className="mt-1 text-[10px] text-slate-500 font-medium">
                              {tpl.scheduleMode === 'every_workday' && (
                                <span className="text-emerald-700">✓ Dilaksanakan pada seluruh hari kerja aktif ({workdayMode === 'senin-sabtu' ? 'Senin - Sabtu' : 'Senin - Jumat'}).</span>
                              )}
                              {tpl.scheduleMode === 'specific_days' && (
                                <span>
                                  Hari tetap: <strong>{DAY_LABELS.filter(d => specific.includes(d.day)).map(d => d.name).join(', ')}</strong>
                                </span>
                              )}
                              {tpl.scheduleMode === 'weekly_rotation' && (
                                <span className="text-indigo-800">
                                  Rotasi Mingguan: M1 ({DAY_LABELS.filter(d => (rotation[1] || []).includes(d.day)).map(d => d.short).join(',')}), M2 ({DAY_LABELS.filter(d => (rotation[2] || []).includes(d.day)).map(d => d.short).join(',')}), M3 ({DAY_LABELS.filter(d => (rotation[3] || []).includes(d.day)).map(d => d.short).join(',')}), M4 ({DAY_LABELS.filter(d => (rotation[4] || []).includes(d.day)).map(d => d.short).join(',')})
                                </span>
                              )}
                            </div>
                          )}

                          {/* Detail Penjadwalan Expanded */}
                          {isScheduleExpanded && (
                            <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                              {tpl.scheduleMode === 'every_workday' && (
                                <p className="text-[11px] text-slate-600">
                                  Tugas ini akan dijalankan pada <strong>seluruh hari kerja aktif</strong> dalam bulan berjalan ({workdayMode === 'senin-sabtu' ? 'Senin s/d Sabtu' : 'Senin s/d Jumat'}), kecuali hari Minggu, libur nasional, dan tanggal yang dikunci.
                                </p>
                              )}

                              {tpl.scheduleMode === 'specific_days' && (
                                <div>
                                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                                    Pilih Hari Pelaksanaan Tetap (Berlaku Setiap Minggu):
                                  </label>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {DAY_LABELS.map((d) => {
                                      const isChecked = specific.includes(d.day);
                                      return (
                                        <button
                                          key={d.day}
                                          type="button"
                                          onClick={() => handleToggleSpecificDay(tpl.id, d.day)}
                                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                            isChecked
                                              ? 'bg-indigo-600 text-white border-indigo-700'
                                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                          }`}
                                        >
                                          {d.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {tpl.scheduleMode === 'weekly_rotation' && (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center justify-between gap-1">
                                    <span className="text-[10.5px] font-bold text-slate-800">
                                      Atur Hari Pelaksanaan per Minggu (Realita Kerja Dinas):
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleApplyRotationPreset(tpl.id, 'sen_kam_rab_sab')}
                                        className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-900 rounded"
                                        title="Minggu 1 & 3: Sen, Kam. Minggu 2 & 4: Rab, Sab"
                                      >
                                        Preset Sen-Kam & Rab-Sab
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleApplyRotationPreset(tpl.id, 'sen_jum')}
                                        className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded"
                                      >
                                        Senin & Jumat
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5 bg-white p-2.5 border border-slate-200 rounded-lg">
                                    {[
                                      { week: 1, label: 'Minggu I (Tgl 1 - 7)' },
                                      { week: 2, label: 'Minggu II (Tgl 8 - 14)' },
                                      { week: 3, label: 'Minggu III (Tgl 15 - 21)' },
                                      { week: 4, label: 'Minggu IV (Tgl 22 - 28)' },
                                      { week: 5, label: 'Minggu V (Tgl 29 - Akhir)' }
                                    ].map((w) => {
                                      const activeWeekDays = rotation[w.week] || [];
                                      return (
                                        <div key={w.week} className="flex flex-wrap items-center justify-between gap-2 py-1 border-b last:border-0 border-slate-100 text-[11px]">
                                          <span className="font-bold text-slate-700 w-44">{w.label}:</span>
                                          <div className="flex items-center gap-1 flex-wrap">
                                            {DAY_LABELS.map((d) => {
                                              const isChecked = activeWeekDays.includes(d.day);
                                              return (
                                                <button
                                                  key={d.day}
                                                  type="button"
                                                  onClick={() => handleToggleWeeklyRotationDay(tpl.id, w.week, d.day)}
                                                  className={`px-2 py-0.5 rounded text-[10.5px] font-semibold border transition cursor-pointer ${
                                                    isChecked
                                                      ? 'bg-indigo-600 text-white border-indigo-700'
                                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                  }`}
                                                >
                                                  {d.short}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Opsi Eksekusi & Integrasi Laporan Bulanan */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
                  3. Opsi Penyusunan Laporan & Sinkronisasi Dokumen:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-indigo-100 cursor-pointer shadow-2xs">
                    <input
                      type="radio"
                      name="overwriteMode"
                      checked={overwriteMode === 'overwrite'}
                      onChange={() => setOverwriteMode('overwrite')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Timpa Jurnal Bulan Ini (Direkomendasikan)</span>
                      <span className="text-[11px] text-slate-500">
                        Menghapus data lama bulan {MONTH_NAMES[selectedMonth - 1]} {selectedYear} untuk peran ini dan menggantinya dengan jurnal bersih terstruktur.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-indigo-100 cursor-pointer shadow-2xs">
                    <input
                      type="radio"
                      name="overwriteMode"
                      checked={overwriteMode === 'append'}
                      onChange={() => setOverwriteMode('append')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Tambahkan ke Jurnal yang Ada</span>
                      <span className="text-[11px] text-slate-500">
                        Mempertahankan jurnal lama dan menambahkan tugas operasional baru.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-2 border-t border-indigo-100 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-950">
                    <input
                      type="checkbox"
                      checked={syncToReport}
                      onChange={(e) => setSyncToReport(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Otomatis Sinkronkan & Sahkan Laporan Bulanan (Approval Status: Disahkan Kepala Sekolah)</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="shrink-0 px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                Total akan digenerate: <strong>{activeWorkdays.length} hari kerja</strong> · Peran: <strong>{targetRole}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleExecuteGeneration}
                  disabled={isGenerating}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang Menyusun Laporan...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Generate Laporan Bulanan Instan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
