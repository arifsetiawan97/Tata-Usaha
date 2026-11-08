import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { RoleType, TaskCategory, TaskLog, MonthlyReport } from '../../types';
import { 
  Sparkles, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  FileText, 
  Printer, 
  ArrowRight, 
  X, 
  Sliders, 
  RefreshCw,
  Building2,
  Shield,
  BookOpen,
  FlaskConical,
  Eye,
  EyeOff
} from 'lucide-react';
import { isTaskInMonth } from '../../utils/taskClassification';

interface SecretTaskTemplate {
  id: string;
  title: string;
  category: string;
  taskType: 'pokok' | 'tambahan';
  location: string;
  volumeUnit: string;
  description: string;
  // Pengacak Jam: rentang jam mulai & rentang durasi / jam selesai
  startHourMin: string; // e.g. "06:45"
  startHourMax: string; // e.g. "07:05"
  durationMinutesMin: number; // e.g. 10
  durationMinutesMax: number; // e.g. 18
  frequency: 'daily' | 'monday_thursday' | 'weekly_friday';
  isActive: boolean;
}

interface SecretAiReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: RoleType;
  onOpenReport?: (role: RoleType, month: number, year: number) => void;
  onOpenPrint?: (reportType: 'monthly', reportData: MonthlyReport) => void;
}

const SECRET_ACCESS_KEY = 'ARIF SETIAWAN';

// Preset Tupoksi Rekomendasi Resmi per Akun Layanan
const DEFAULT_PRESET_TEMPLATES: Record<RoleType, SecretTaskTemplate[]> = {
  PENJAGA: [
    {
      id: 'pj-01',
      title: 'Membuka pintu gerbang utama dan seluruh akses sekolah',
      category: 'keamanan',
      taskType: 'pokok',
      location: 'Pintu Gerbang Utama & Selasar Gedung Sekolah',
      volumeUnit: '4 pintu gedung/kelas & 1 gerbang utama',
      description: 'Membuka kunci gembok gerbang utama sekolah, memeriksa selasar, dan membuka akses pintu ruang kelas serta kantor guru untuk persiapan pembelajaran.',
      startHourMin: '06:45',
      startHourMax: '07:05',
      durationMinutesMin: 10,
      durationMinutesMax: 18,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'pj-02',
      title: 'Pengawasan ketertiban dan keamanan jam kedatangan peserta didik',
      category: 'pengawasan_anak',
      taskType: 'pokok',
      location: 'Area Pos Keamanan & Gerbang Depan',
      volumeUnit: '1 kompleks sekolah',
      description: 'Menjaga dan mengawasi kelancaran lalu lintas depan sekolah, menyambut kedatangan siswa, dan mencegah orang asing masuk tanpa izin.',
      startHourMin: '07:10',
      startHourMax: '07:25',
      durationMinutesMin: 35,
      durationMinutesMax: 45,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'pj-03',
      title: 'Patroli keliling keamanan lingkungan dan pemeriksaan instalasi sarpras',
      category: 'lingkungan',
      taskType: 'pokok',
      location: 'Lingkungan Belakang, Lapangan & Pagar Batas',
      volumeUnit: '1 area kompleks satuan pendidikan',
      description: 'Memeriksa keutuhan pagar batas sekolah, memeriksa kondisi kran air, lampu penerangan, dan memastikan tidak ada potensi kerawanan keamanan.',
      startHourMin: '10:00',
      startHourMax: '10:30',
      durationMinutesMin: 45,
      durationMinutesMax: 60,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'pj-04',
      title: 'Pencatatan buku mutasi tamu dinas dan pengawasan jam kepulangan',
      category: 'keamanan',
      taskType: 'tambahan',
      location: 'Pos Jaga & Meja Registrasi Tamu',
      volumeUnit: '3-6 tamu dinas/wali',
      description: 'Melayani registrasi identitas tamu dinas luar, mengarahkan ke ruang pimpinan, serta mengawasi keamanan saat jam kepulangan peserta didik.',
      startHourMin: '12:45',
      startHourMax: '13:15',
      durationMinutesMin: 60,
      durationMinutesMax: 75,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'pj-05',
      title: 'Menutup dan mengunci pintu gerbang utama serta seluruh akses gedung sekolah',
      category: 'keamanan',
      taskType: 'pokok',
      location: 'Seluruh Pintu Ruang Kelas & Gerbang Utama',
      volumeUnit: '4 gedung, ruang kelas & 1 gerbang utama',
      description: 'Memeriksa seluruh ruangan kelas yang telah kosong, mematikan kipas/lampu yang masih menyala, mengunci pintu kelas, dan mengunci gembok gerbang utama sekolah.',
      startHourMin: '15:30',
      startHourMax: '15:55',
      durationMinutesMin: 20,
      durationMinutesMax: 30,
      frequency: 'daily',
      isActive: true
    }
  ],
  TU: [
    {
      id: 'tu-01',
      title: 'Pengagendaan dokumen surat dinas masuk dan pengajuan lembar disposisi',
      category: 'surat_masuk',
      taskType: 'pokok',
      location: 'Ruang Tata Usaha & Meja Kepala Sekolah',
      volumeUnit: '4-8 surat dinas',
      description: 'Menerima surat dinas dari instansi terkait, membukukan dalam buku agenda surat masuk, memberi nomor register, dan meneruskan ke kepala sekolah.',
      startHourMin: '08:00',
      startHourMax: '08:30',
      durationMinutesMin: 60,
      durationMinutesMax: 90,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'tu-02',
      title: 'Pelayanan administrasi kesiswaan, legalisir ijazah, dan penerbitan surat aktif',
      category: 'siswa',
      taskType: 'pokok',
      location: 'Loket Pelayanan Administrasi TU',
      volumeUnit: '5-10 berkas pemohon',
      description: 'Memproses permohonan surat keterangan aktif belajar untuk syarat beasiswa/PIP, melayani legalisir dokumen alumni, dan update mutasi siswa.',
      startHourMin: '10:00',
      startHourMax: '10:30',
      durationMinutesMin: 90,
      durationMinutesMax: 120,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'tu-03',
      title: 'Pembuatan konsep surat dinas keluar dan penomoran buku agenda naskah dinas',
      category: 'surat_keluar',
      taskType: 'pokok',
      location: 'Meja Komputer Administrasi TU',
      volumeUnit: '2-4 nomor surat keluar',
      description: 'Mengetik naskah dinas surat undangan dan edaran kepala sekolah, mengurus tanda tangan pengesahan pimpinan, serta pengarsipan fisik ke map odner.',
      startHourMin: '13:00',
      startHourMax: '13:30',
      durationMinutesMin: 60,
      durationMinutesMax: 80,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'tu-04',
      title: 'Verifikasi kelengkapan berkas kepegawaian ASN dan pemutakhiran data SIASN',
      category: 'kepegawaian',
      taskType: 'tambahan',
      location: 'Ruang Arsip Kepegawaian TU',
      volumeUnit: '2-5 berkas PTK',
      description: 'Memeriksa berkas SK kenaikan pangkat, PAK, SKP 2 tahun terakhir guru dan tenaga kependidikan, serta sinkronisasi data ke sistem kepegawaian.',
      startHourMin: '14:30',
      startHourMax: '14:50',
      durationMinutesMin: 45,
      durationMinutesMax: 60,
      frequency: 'daily',
      isActive: true
    }
  ],
  SERVICE: [
    {
      id: 'sv-01',
      title: 'Pembersihan sanitasi toilet guru dan toilet peserta didik secara menyeluruh',
      category: 'kebersihan_toilet',
      taskType: 'pokok',
      location: 'Blok Toilet Guru & Siswa',
      volumeUnit: '6 unit kamar mandi/toilet',
      description: 'Menyikat lantai keramik toilet, membersihkan kloset dengan cairan desinfektan, menguras bak penampungan air, dan mengisi ulang sabun cuci tangan.',
      startHourMin: '06:30',
      startHourMax: '06:50',
      durationMinutesMin: 60,
      durationMinutesMax: 75,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'sv-02',
      title: 'Penyapuan dan pengepelan lantai ruang kantor guru, TU, dan selasar gedung',
      category: 'pembersihan_ruang',
      taskType: 'pokok',
      location: 'Ruang Kantor, Ruang TU & Selasar Gedung',
      volumeUnit: '8 ruangan & koridor',
      description: 'Menyapu debu, mengepel lantai dengan cairan pembersih beraroma segar, mengelap kaca jendela, serta merapikan posisi meja dan kursi tamu.',
      startHourMin: '08:00',
      startHourMax: '08:30',
      durationMinutesMin: 75,
      durationMinutesMax: 90,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'sv-03',
      title: 'Pengurasan bak kontrol air, pengecekan kran wastafel, dan drainase lingkungan',
      category: 'sanitasi_air',
      taskType: 'pokok',
      location: 'Area Wastafel Cuci Tangan & Drainase Selasar',
      volumeUnit: '4 unit wastafel & drainase',
      description: 'Membersihkan lumut pada bak kontrol air wudhu/sanitasi, melancarkan saluran pembuangan air agar tidak tersumbat sampah daun, dan cek instalasi pipa.',
      startHourMin: '10:30',
      startHourMax: '11:00',
      durationMinutesMin: 45,
      durationMinutesMax: 60,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'sv-04',
      title: 'Pengumpulan, pemilahan sampah organik/anorganik, dan pembuangan ke TPS akhir',
      category: 'pengelolaan_sampah',
      taskType: 'tambahan',
      location: 'Seluruh Titik Tong Sampah Kelas & TPS Sekolah',
      volumeUnit: '12 tong sampah kelas',
      description: 'Mengosongkan tempat sampah di tiap depan ruang kelas dan kantor, memindahkan ke gerobak sampah, dan mengangkut ke Tempat Pembuangan Sampah akhir sekolah.',
      startHourMin: '13:30',
      startHourMax: '14:00',
      durationMinutesMin: 60,
      durationMinutesMax: 80,
      frequency: 'daily',
      isActive: true
    }
  ],
  PERPUS: [
    {
      id: 'pr-01',
      title: 'Pelayanan sirkulasi peminjaman dan pengembalian buku teks pelajaran siswa',
      category: 'sirkulasi_peminjaman',
      taskType: 'pokok',
      location: 'Meja Layanan Sirkulasi Perpustakaan',
      volumeUnit: '25-45 transaksi pemustaka',
      description: 'Melayani peserta didik yang meminjam dan mengembalikan buku teks kurikulum merdeka serta buku fiksi, mencatat di buku sirkulasi dan sistem digital perpustakaan.',
      startHourMin: '08:30',
      startHourMax: '09:00',
      durationMinutesMin: 90,
      durationMinutesMax: 120,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'pr-02',
      title: 'Registrasi buku induk inventaris, pelabelan nomor DDC, dan penempelan barcode',
      category: 'pengolahan_label',
      taskType: 'pokok',
      location: 'Meja Pengolahan Bahan Pustaka',
      volumeUnit: '15-25 eksemplar buku',
      description: 'Mencatat nomor inventaris baru pada buku induk, pemberian stempel kepemilikan sekolah, penentuan klasifikasi DDC, dan laminasi punggung buku.',
      startHourMin: '10:30',
      startHourMax: '11:00',
      durationMinutesMin: 60,
      durationMinutesMax: 80,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'pr-03',
      title: 'Pendampingan jam literasi baca siswa dan bimbingan referensi belajar',
      category: 'layanan_literasi',
      taskType: 'tambahan',
      location: 'Ruang Baca Utama Perpustakaan',
      volumeUnit: '2 rombel belajar',
      description: 'Memandu jam literasi 15 menit sebelum pembelajaran atau saat jam istirahat, membimbing siswa menemukan ensiklopedia dan referensi materi tugas sekolah.',
      startHourMin: '12:30',
      startHourMax: '13:00',
      durationMinutesMin: 50,
      durationMinutesMax: 65,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'pr-04',
      title: 'Shelving, inventarisasi kerapian rak buku, dan pengecekan fisik buku rusak',
      category: 'perawatan_buku',
      taskType: 'pokok',
      location: 'Rak Buku Koleksi Fiksi & Referensi',
      volumeUnit: '4 rak buku perpustakaan',
      description: 'Mengembalikan buku yang telah dibaca ke rak sesuai urutan nomor klasifikasi DDC, merapikan jajaran buku, dan memisahkan buku yang robek untuk direstorasi.',
      startHourMin: '14:00',
      startHourMax: '14:20',
      durationMinutesMin: 45,
      durationMinutesMax: 60,
      frequency: 'daily',
      isActive: true
    }
  ],
  LAB_IPA: [
    {
      id: 'lb-01',
      title: 'Penyiapan peralatan praktikum mikroskop cahaya dan preparat jaringan biologi',
      category: 'persiapan_praktikum',
      taskType: 'pokok',
      location: 'Meja Praktikum Laboratorium IPA',
      volumeUnit: '8 set mikroskop & preparat',
      description: 'Menyiapkan mikroskop cahaya, kaca objek, kaca penutup, larutan pewarna, serta memeriksa kelayakan fungsi lampu/cermin mikroskop untuk kelas 8.',
      startHourMin: '07:30',
      startHourMax: '08:00',
      durationMinutesMin: 60,
      durationMinutesMax: 75,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'lb-02',
      title: 'Pendampingan teknis praktikum sains peserta didik dan pengawasan K3 laboratorium',
      category: 'k3_laboratorium',
      taskType: 'pokok',
      location: 'Ruang Laboratorium IPA',
      volumeUnit: '1 rombel (32 siswa)',
      description: 'Mendampingi guru mata pelajaran IPA saat praktikum berlangsung, mengawasi penggunaan alat keselamatan kerja, dan menangani peralatan sensitif.',
      startHourMin: '09:30',
      startHourMax: '10:00',
      durationMinutesMin: 80,
      durationMinutesMax: 100,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'lb-03',
      title: 'Pembersihan, pencucian peralatan gelas laboratorium, dan penyimpanan rapi',
      category: 'pemeliharaan_alat',
      taskType: 'pokok',
      location: 'Area Wastafel Khusus Laboratorium IPA',
      volumeUnit: '24 tabung reaksi & beker gelas',
      description: 'Mencuci tabung reaksi, erlenmeyer, dan gelas ukur dengan sabun netral, membilas hingga bersih, mengeringkan di rak pengering, dan menyusun ke lemari alat.',
      startHourMin: '13:00',
      startHourMax: '13:30',
      durationMinutesMin: 60,
      durationMinutesMax: 75,
      frequency: 'daily',
      isActive: true
    },
    {
      id: 'lb-04',
      title: 'Pemeriksaan kartu stok bahan kimia, pengecekan tanggal kedaluwarsa, dan kalibrasi timbangan',
      category: 'inventaris_bahan',
      taskType: 'tambahan',
      location: 'Ruang Penyimpanan Bahan Laboratorium',
      volumeUnit: '1 lemari zat & 2 timbangan neraca',
      description: 'Mencatat sisa bahan kimia dalam kartu inventaris, memastikan penataan zat sesuai sifat reaktifnya, serta kalibrasi titik nol neraca ohaus 4 lengan.',
      startHourMin: '14:30',
      startHourMax: '14:50',
      durationMinutesMin: 40,
      durationMinutesMax: 55,
      frequency: 'daily',
      isActive: true
    }
  ]
};

export const SecretAiReportGeneratorModal: React.FC<SecretAiReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialRole,
  onOpenReport,
  onOpenPrint
}) => {
  const { 
    currentRole, 
    tasks, 
    importTasks, 
    generateMonthlyReportFromTasks, 
    saveMonthlyReport, 
    schoolConfig, 
    monthlyReports 
  } = useApp();

  // Authentication State
  const [passcodeInput, setPasscodeInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('siops_secret_unlocked') === 'true';
  });

  // Generator Configuration State
  const [targetRole, setTargetRole] = useState<RoleType>(initialRole || currentRole || 'PENJAGA');
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const now = new Date();
    // Default ke September atau bulan aktif saat ini
    return now.getMonth() + 1;
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return new Date().getFullYear();
  });
  const [workDayPattern, setWorkDayPattern] = useState<'5_days' | '6_days'>('5_days');

  // Task Templates
  const [taskTemplates, setTaskTemplates] = useState<SecretTaskTemplate[]>(() => {
    return DEFAULT_PRESET_TEMPLATES[initialRole || currentRole || 'PENJAGA'] || DEFAULT_PRESET_TEMPLATES.PENJAGA;
  });

  // Generation Results / Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccessInfo, setGenerationSuccessInfo] = useState<{
    totalTasksCreated: number;
    month: number;
    year: number;
    role: RoleType;
    report: MonthlyReport;
  } | null>(null);

  // Switch role templates automatically when targetRole changes
  const handleRoleChange = (newRole: RoleType) => {
    setTargetRole(newRole);
    setTaskTemplates(DEFAULT_PRESET_TEMPLATES[newRole] || DEFAULT_PRESET_TEMPLATES.PENJAGA);
    setGenerationSuccessInfo(null);
  };

  // Reset to default templates for the current role
  const handleResetTemplates = () => {
    setTaskTemplates(DEFAULT_PRESET_TEMPLATES[targetRole] || DEFAULT_PRESET_TEMPLATES.PENJAGA);
  };

  // Auth Submit
  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = passcodeInput.trim().toUpperCase();
    if (cleanInput === SECRET_ACCESS_KEY) {
      setIsUnlocked(true);
      sessionStorage.setItem('siops_secret_unlocked', 'true');
      setAuthError(null);
      setPasscodeInput('');
    } else {
      setAuthError('Akses Ditolak: Kode Akses Tidak Sesuai. Anda tidak memiliki otoritas untuk membuka fitur kecerdasan tersembunyi ini.');
    }
  };

  const handleLockAgain = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('siops_secret_unlocked');
    setPasscodeInput('');
    setAuthError(null);
  };

  // Add custom new task
  const handleAddNewTask = () => {
    const newTask: SecretTaskTemplate = {
      id: `custom-${Date.now()}`,
      title: 'Kegiatan operasional harian terencana',
      category: targetRole === 'PENJAGA' ? 'keamanan' : targetRole === 'TU' ? 'administrasi' : targetRole === 'SERVICE' ? 'kebersihan' : targetRole === 'PERPUS' ? 'sirkulasi_peminjaman' : 'laboratorium',
      taskType: 'pokok',
      location: 'Lingkungan Sekolah',
      volumeUnit: '1 kegiatan operasional',
      description: 'Melaksanakan tugas operasional pendukung kelancaran layanan satuan pendidikan secara akuntabel.',
      startHourMin: '08:00',
      startHourMax: '08:30',
      durationMinutesMin: 45,
      durationMinutesMax: 60,
      frequency: 'daily',
      isActive: true
    };
    setTaskTemplates(prev => [...prev, newTask]);
  };

  const handleUpdateTemplate = (id: string, updates: Partial<SecretTaskTemplate>) => {
    setTaskTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleDeleteTemplate = (id: string) => {
    setTaskTemplates(prev => prev.filter(t => t.id !== id));
  };

  // Helper untuk menghasilkan jam acak yang rapi dan realistis dalam rentang yang ditentukan
  const generateRandomTimeWithinWindow = (startMinStr: string, startMaxStr: string, durMin: number, durMax: number) => {
    const [minH, minM] = startMinStr.split(':').map(Number);
    const [maxH, maxM] = startMaxStr.split(':').map(Number);

    const minTotalMinutes = minH * 60 + minM;
    const maxTotalMinutes = maxH * 60 + maxM;

    // Acak jam mulai dalam rentang
    const randomStartTotalMinutes = Math.floor(Math.random() * (maxTotalMinutes - minTotalMinutes + 1)) + minTotalMinutes;
    // Acak durasi dalam rentang menit
    const randomDuration = Math.floor(Math.random() * (durMax - durMin + 1)) + durMin;
    const randomEndTotalMinutes = randomStartTotalMinutes + randomDuration;

    const startHour = Math.floor(randomStartTotalMinutes / 60);
    const startMinute = randomStartTotalMinutes % 60;
    const endHour = Math.floor(randomEndTotalMinutes / 60);
    const endMinute = randomEndTotalMinutes % 60;

    const formatTime = (h: number, m: number) => 
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    return {
      timeStart: formatTime(startHour, startMinute),
      timeEnd: formatTime(endHour, endMinute)
    };
  };

  // Eksekusi Pembuatan Laporan Bulanan Dadakan & Rekapitulasi Rincian Tugas Harian
  const handleExecuteGeneration = async () => {
    setIsGenerating(true);
    setGenerationSuccessInfo(null);

    try {
      // 1. Tentukan seluruh hari kerja dalam bulan & tahun yang dipilih
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const workDates: string[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(selectedYear, selectedMonth - 1, day);
        const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu

        // Cek hari kerja: Minggu (0) selalu libur
        if (dayOfWeek === 0) continue;
        // Jika pola 5 hari kerja, Sabtu (6) libur
        if (workDayPattern === '5_days' && dayOfWeek === 6) continue;

        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        workDates.push(dateStr);
      }

      // Petugas aktif sesuai profil operator sekolah
      const officer = schoolConfig.operatorProfiles?.[targetRole] || {
        nama: 'Petugas Operasional',
        nip: '-'
      };
      const petugasName = officer.nama || 'Petugas Operasional';

      // 2. Filter tugas aktif
      const activeTemplates = taskTemplates.filter(t => t.isActive);
      if (activeTemplates.length === 0) {
        alert('Harap aktifkan minimal 1 template tugas operasional.');
        setIsGenerating(false);
        return;
      }

      // 3. Bangun seluruh entri tugas harian dengan pengacak jam otomatis
      const newGeneratedTasks: Omit<TaskLog, 'id'>[] = [];

      workDates.forEach((dateStr, dateIdx) => {
        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.getDay(); // 1 = Senin, 2 = Selasa, 3 = Rabu, 4 = Kamis, 5 = Jumat, 6 = Sabtu

        activeTemplates.forEach((template, tIdx) => {
          // Cek frekuensi tugas
          if (template.frequency === 'monday_thursday' && dayOfWeek !== 1 && dayOfWeek !== 4) {
            return;
          }
          if (template.frequency === 'weekly_friday' && dayOfWeek !== 5) {
            return;
          }

          // Sistem mengacak secara otomatis jam pelaksanaan sesuai rentang yang ditentukan pengguna!
          const { timeStart, timeEnd } = generateRandomTimeWithinWindow(
            template.startHourMin,
            template.startHourMax,
            template.durationMinutesMin,
            template.durationMinutesMax
          );

          newGeneratedTasks.push({
            role: targetRole,
            date: dateStr,
            category: template.category as TaskCategory,
            taskType: template.taskType,
            title: template.title,
            description: template.description,
            location: template.location,
            timeStart,
            timeEnd,
            status: 'selesai',
            volumeUnit: template.volumeUnit,
            petugas: petugasName,
            notes: 'Tercatat otomatis melalui sistem kecerdasan operasional berkala dengan status 100% terlaksana.'
          });
        });
      });

      // 4. Masukkan seluruh tugas harian baru ke dalam database sistem
      importTasks(newGeneratedTasks);

      // Beri sedikit jeda mikro agar state tasks ter-sync
      await new Promise(r => setTimeout(r, 200));

      // 5. Bangun Laporan Bulanan Instan secara otomatis dengan rekapitulasi lengkap
      const generatedReport = generateMonthlyReportFromTasks(
        targetRole, 
        selectedMonth, 
        selectedYear, 
        true // forceFresh: susun baru dari tugas yang baru di-generate
      );

      // Simpan ke monthlyReports
      saveMonthlyReport(generatedReport);

      setGenerationSuccessInfo({
        totalTasksCreated: newGeneratedTasks.length,
        month: selectedMonth,
        year: selectedYear,
        role: targetRole,
        report: generatedReport
      });

    } catch (err: any) {
      console.error(err);
      alert('Terjadi kendala saat generate laporan: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 animate-scaleIn">
        
        {/* ===================================================================
            MODAL HEADER: KECERDASAN TERSEMBUNYI
            =================================================================== */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base tracking-wide text-white">
                  Kecerdasan Tersembunyi Sistem
                </h3>
                {isUnlocked ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Terotentikasi</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-300" />
                    <span>Akses Terkunci</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-indigo-200/80">
                Generator Laporan Bulanan Dadakan & Rekapitulasi Rincian Tugas Operasional Instan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked && (
              <button
                type="button"
                onClick={handleLockAgain}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                title="Kunci kembali fitur kecerdasan ini"
              >
                <Lock className="w-3 h-3" />
                <span className="hidden sm:inline">Kunci Akses</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-400 hover:text-white transition cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===================================================================
            SCREEN 1: JIKA BELUM TEROTENTIKASI (MEMASUKKAN KODE ARIF SETIAWAN)
            =================================================================== */}
        {!isUnlocked ? (
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center mb-4 text-indigo-600 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <h4 className="text-lg font-bold text-slate-900 mb-1">
              Otorisasi Akses Khusus Diperlukan
            </h4>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Fitur kecerdasan tersembunyi ini hanya dapat dibuka menggunakan kode otorisasi resmi. Masukkan kode sandi untuk membuka generator laporan bulanan instan.
            </p>

            <form onSubmit={handleVerifyPasscode} className="w-full space-y-4">
              <div className="relative text-left">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kode Akses Tersembunyi:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passcodeInput}
                    onChange={(e) => {
                      setPasscodeInput(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Masukkan kode rahasia..."
                    className="w-full px-4 py-2.5 pr-10 text-sm font-mono tracking-wider bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left flex items-start gap-2.5 text-xs text-rose-700 animate-shake">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="font-medium">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Buka Akses Kecerdasan Tersembunyi</span>
              </button>
            </form>
          </div>
        ) : (
          /* ===================================================================
              SCREEN 2: SETELAH TEROTENTIKASI (DASHBOARD GENERATOR INSTAN)
              =================================================================== */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* Success Notification Banner after generating */}
            {generationSuccessInfo && (
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-scaleIn">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-emerald-950">
                      Laporan Bulanan Dadakan Berhasil Dibuat!
                    </h5>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Sebanyak <strong>{generationSuccessInfo.totalTasksCreated} tugas harian</strong> untuk periode <strong>{monthNames[generationSuccessInfo.month - 1]} {generationSuccessInfo.year}</strong> berhasil di-generate secara otomatis lengkap dengan jam acak yang natural, dan telah direkapitulasi secara otomatis ke dalam dokumen Laporan Bulanan.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {onOpenReport && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenReport(generationSuccessInfo.role, generationSuccessInfo.month, generationSuccessInfo.year);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Buka Laporan</span>
                    </button>
                  )}
                  {onOpenPrint && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPrint('monthly', generationSuccessInfo.report);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Resmi</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 1. Pengaturan Akun Layanan & Periode Bulan */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    1. Target Akun Layanan & Periode Laporan Bulanan
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  Aktif untuk Seluruh Akun Layanan
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Pilihan Akun Layanan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Akun Layanan Operasional:
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => handleRoleChange(e.target.value as RoleType)}
                    className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="PENJAGA">Penjaga Sekolah (Keamanan & Sarpras)</option>
                    <option value="TU">Tata Usaha (Administrasi & Persuratan)</option>
                    <option value="SERVICE">Service (Kebersihan & Sanitasi)</option>
                    <option value="PERPUS">Perpustakaan (Pengelola Pemustaka)</option>
                    <option value="LAB_IPA">Laboratorium IPA (Laboran & Praktikum)</option>
                  </select>
                </div>

                {/* Pilihan Bulan & Tahun */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Bulan & Tahun Pelaporan:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full px-2 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl cursor-pointer"
                    >
                      {monthNames.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>{name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      min={2020}
                      max={2035}
                      className="w-full px-2 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                {/* Pola Hari Kerja */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Hari Kerja Aktif Sekolah:
                  </label>
                  <select
                    value={workDayPattern}
                    onChange={(e) => setWorkDayPattern(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl cursor-pointer"
                  >
                    <option value="5_days">Senin s.d. Jumat (5 Hari Kerja)</option>
                    <option value="6_days">Senin s.d. Sabtu (6 Hari Kerja)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Daftar Tugas Operasional & Pengacak Jam Otomatis */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>2. Konfigurasi Rincian Tugas & Sistem Pengacak Jam Otomatis</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sistem akan mengacak jam pelaksanaan setiap hari secara natural sesuai rentang jam buka & tutup yang Anda tentukan.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetTemplates}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    title="Kembalikan ke template tupoksi resmi bawaan"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Preset Tupoksi</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewTask}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Tugas</span>
                  </button>
                </div>
              </div>

              {/* Task Items List */}
              <div className="space-y-3">
                {taskTemplates.map((template, index) => (
                  <div 
                    key={template.id}
                    className={`p-3.5 bg-white border rounded-xl transition-all ${
                      template.isActive ? 'border-slate-300 shadow-2xs' : 'border-slate-200 opacity-60 bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={template.isActive}
                          onChange={(e) => handleUpdateTemplate(template.id, { isActive: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 cursor-pointer"
                          id={`chk-${template.id}`}
                        />
                        <span className="font-mono text-[10px] font-bold text-slate-400">#{index + 1}</span>
                        <input
                          type="text"
                          value={template.title}
                          onChange={(e) => handleUpdateTemplate(template.id, { title: e.target.value })}
                          className="font-bold text-xs text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-hidden w-full px-1"
                          placeholder="Nama / Judul Tugas..."
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={template.taskType}
                          onChange={(e) => handleUpdateTemplate(template.id, { taskType: e.target.value as any })}
                          className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
                        >
                          <option value="pokok">Tugas Pokok</option>
                          <option value="tambahan">Tugas Tambahan</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Hapus Tugas Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Task Attributes & Random Time Window Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="block text-[10px] font-semibold text-slate-500">Volume Output:</span>
                        <input
                          type="text"
                          value={template.volumeUnit}
                          onChange={(e) => handleUpdateTemplate(template.id, { volumeUnit: e.target.value })}
                          className="w-full text-[11px] p-1.5 bg-slate-50 border border-slate-200 rounded-md"
                          placeholder="misal: 4 pintu gedung"
                        />
                      </div>

                      <div>
                        <span className="block text-[10px] font-semibold text-slate-500">Lokasi:</span>
                        <input
                          type="text"
                          value={template.location}
                          onChange={(e) => handleUpdateTemplate(template.id, { location: e.target.value })}
                          className="w-full text-[11px] p-1.5 bg-slate-50 border border-slate-200 rounded-md"
                          placeholder="misal: Pintu Gerbang"
                        />
                      </div>

                      {/* Pengacak Jam: Rentang Jam Mulai (e.g. 06:45 s.d 07:05) */}
                      <div>
                        <span className="block text-[10px] font-semibold text-indigo-700">Rentang Jam Mulai (Diacak):</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="time"
                            value={template.startHourMin}
                            onChange={(e) => handleUpdateTemplate(template.id, { startHourMin: e.target.value })}
                            className="w-full text-[11px] p-1 bg-indigo-50/50 border border-indigo-200 rounded-md text-center font-mono"
                          />
                          <span className="text-[10px] text-slate-400">-</span>
                          <input
                            type="time"
                            value={template.startHourMax}
                            onChange={(e) => handleUpdateTemplate(template.id, { startHourMax: e.target.value })}
                            className="w-full text-[11px] p-1 bg-indigo-50/50 border border-indigo-200 rounded-md text-center font-mono"
                          />
                        </div>
                      </div>

                      {/* Durasi Acak (Menit) */}
                      <div>
                        <span className="block text-[10px] font-semibold text-slate-500">Rentang Durasi (Menit):</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={template.durationMinutesMin}
                            onChange={(e) => handleUpdateTemplate(template.id, { durationMinutesMin: Number(e.target.value) })}
                            min={5}
                            max={240}
                            className="w-full text-[11px] p-1 bg-slate-50 border border-slate-200 rounded-md text-center font-mono"
                          />
                          <span className="text-[10px] text-slate-400">s.d</span>
                          <input
                            type="number"
                            value={template.durationMinutesMax}
                            onChange={(e) => handleUpdateTemplate(template.id, { durationMinutesMax: Number(e.target.value) })}
                            min={5}
                            max={240}
                            className="w-full text-[11px] p-1 bg-slate-50 border border-slate-200 rounded-md text-center font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Catatan Fitur & Keunggulan */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Otomasi Cerdas Laporan Bulanan:</strong> Begitu tombol di bawah diklik, sistem langsung menyusun riwayat tugas harian dengan jam yang diacak secara natural untuk setiap hari kerja dalam bulan tersebut, menghitung persentase ketercapaian tupoksi (100%), dan menyusun rekapitulasi lengkap Laporan Bulanan siap cetak kedinasan.
              </div>
            </div>

          </div>
        )}

        {/* ===================================================================
            MODAL FOOTER (ACTION BUTTONS)
            =================================================================== */}
        {isUnlocked && (
          <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-600">
              Target: <strong className="text-indigo-900">{targetRole}</strong> · Periode: <strong>{monthNames[selectedMonth - 1]} {selectedYear}</strong>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-200 border border-slate-300 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={handleExecuteGeneration}
                disabled={isGenerating}
                className="flex-1 sm:flex-none px-5 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 active:bg-indigo-800 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Menyusun Laporan & Mengacak Jam...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>⚡ Generate Lapor Bulanan Dadakan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
