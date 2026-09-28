import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoleType, MonthlyReport } from '../../types';
import { InventoryTable } from '../common/InventoryTable';
import { 
  FileText, 
  Printer, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Save, 
  Download,
  Share2,
  Sparkles,
  FileCheck2,
  Upload,
  Layers,
  Archive,
  Loader2,
  Brain,
  Wand2
} from 'lucide-react';

interface MonthlyReportViewProps {
  onOpenPrint: (reportType: 'monthly' | 'annual', data: any) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const OFFICIAL_MONTHLY_TEMPLATES: Record<RoleType, {
  summary: string;
  achievements: string[];
  obstacles: string[];
  solutions: string[];
}> = {
  TU: {
    summary: 'Pelaksanaan administrasi ketatausahaan sekolah pada periode bulan ini berjalan efektif dengan tingkat ketercapaian penyelesaian agenda surat dan berkas kepegawaian mencapai target. Pelayanan administrasi siswa dan inventarisasi sarana prasarana sekolah terkelola secara tertib dan transparan.',
    achievements: [
      'Penyelesaian registrasi buku agenda surat masuk dan surat keluar kedinasan 100% tepat waktu',
      'Pembaruan berkas kenaikan pangkat dan data Dapodik kepegawaian tenaga pendidik & kependidikan',
      'Rekonsiliasi berkala kartu inventaris barang (KIR) ruang kantor, lab, dan kelas',
      'Pelayanan legalisasi berkas administrasi dan surat keterangan siswa aktif tanpa kendala'
    ],
    obstacles: [
      'Arsip fisik dokumen tahun-tahun lampau memerlukan pemindaian digital secara bertahap',
      'Keterlambatan konfirmasi surat undangan kedinasan dari instansi eksternal'
    ],
    solutions: [
      'Mengagendakan pemindaian digital arsip secara terjadwal setiap akhir pekan',
      'Berkoordinasi aktif melalui kontak narahubung WhatsApp dinas terkait'
    ]
  },
  PENJAGA: {
    summary: 'Layanan pengamanan lingkungan dan pemeliharaan sarana prasarana sekolah pada periode bulan ini berlangsung kondusif. Seluruh pos penjagaan dan titik rawan terpatroli secara intensif siang dan malam hari. Kegiatan penyeberangan anak dan pengantaran surat kedinasan terlaksana sesuai protap.',
    achievements: [
      'Pengamanan lingkungan 24 jam terlaksana kondusif tanpa insiden gangguan kamtibmas',
      'Pemeriksaan dan penguncian gerbang, ruang kelas, laboratorium serta kantor setiap sore & malam hari',
      'Pengawasan ketertiban dan penyeberangan siswa di gerbang utama sekolah pada jam masuk dan pulang',
      'Perbaikan sarana prasarana ringan: instalasi kran air, kunci gembok, dan penggantian lampu kelas',
      'Pengantaran surat dinas dan dokumen SPM ke Dinas Pendidikan serta instansi mitra tepat waktu'
    ],
    obstacles: [
      'Curah hujan tinggi menyebabkan penumpukan daun dan genangan di saluran pintu gerbang',
      'Lampu penerangan selasar belakang sempat putus akibat fluktuasi voltase'
    ],
    solutions: [
      'Pembersihan rutin sedimen saluran drainase setiap pagi bersama tim kebersihan',
      'Pemasangan lampu cadangan LED hemat daya dan pengetesan instalasi box MCB'
    ]
  },
  SERVICE: {
    summary: 'Pelaksanaan layanan operasional kebersihan sekolah pada bulan ini berhasil mempertahankan standar higienitas dan kenyamanan seluruh warga sekolah. Pembersihan rutin ruang kantor, ruang kelas, toilet (WC) guru dan siswa, serta pengelolaan pemilahan sampah terlaksana optimal.',
    achievements: [
      'Sanitasi harian 12 unit bilik WC siswa dan toilet guru terjaga bersih, wangi dan tidak berbau',
      'Pembersihan dan pengepelan lantai ruang kantor kepala sekolah, ruang guru dan lobi utama dua kali sehari',
      'Pengumpulan, pemilahan sampah organik dan anorganik serta pengangkutan ke TPS terjadwal lancar',
      'Penyemprotan disinfektan dan pengharum ruangan berkala di ruang UKS dan perpustakaan'
    ],
    obstacles: [
      'Ketersediaan stok cairan pembersih lantai dan sabun cuci tangan mendekati batas minimal di pertengahan bulan',
      'Kran air di toilet blok barat sempat macet karena kerak endapan sumur bor'
    ],
    solutions: [
      'Mengajukan amprah kebutuhan bahan habis pakai ke bagian TU seminggu sebelum stok habis',
      'Membersihkan saringan kran dan koordinasi dengan penjaga sekolah untuk pemeliharaan pipa'
    ]
  }
};

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({ onOpenPrint }) => {
  const { 
    currentRole, 
    tasks, 
    monthlyReports, 
    saveMonthlyReport, 
    generateMonthlyReportFromTasks,
    schoolConfig,
    archiveReport,
    inventories
  } = useApp();

  const effectiveRole = currentRole || 'TU';
  const roleTitle = effectiveRole === 'TU' ? 'Tata Usaha' : effectiveRole === 'PENJAGA' ? 'Penjaga Sekolah' : 'Layanan Kebersihan (Service)';

  const [selectedMonth, setSelectedMonth] = useState<number>(9); // September default
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Fetch or dynamically generate monthly report
  const activeReport = monthlyReports.find(
    r => r.role === effectiveRole && r.month === selectedMonth && r.year === selectedYear
  ) || generateMonthlyReportFromTasks(effectiveRole, selectedMonth, selectedYear);

  const [reportState, setReportState] = useState<MonthlyReport>(activeReport);
  const [newAchievement, setNewAchievement] = useState('');
  const [newObstacle, setNewObstacle] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Tasks in this month for this role
  const monthTasks = tasks.filter(t => {
    if (t.role !== effectiveRole) return false;
    const d = new Date(t.date);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });

  const completedCount = monthTasks.filter(t => t.status === 'selesai').length;

  const showNotification = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // ANALISIS CERDAS OTOMATIS (AI / DATA SYNTHESIS)
  const handleSmartAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/gemini/analyze-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: effectiveRole,
          month: selectedMonth,
          year: selectedYear,
          tasks: monthTasks,
          schoolConfig,
          inventories: inventories.filter(i => i.role === effectiveRole)
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const { summary, achievements, obstacles, solutions } = json.data;
          setReportState(prev => {
            const updated: MonthlyReport = {
              ...prev,
              summary: summary || prev.summary,
              achievements: Array.isArray(achievements) && achievements.length > 0 ? achievements : prev.achievements,
              obstacles: Array.isArray(obstacles) && obstacles.length > 0 ? obstacles : prev.obstacles,
              solutions: Array.isArray(solutions) && solutions.length > 0 ? solutions : prev.solutions
            };
            saveMonthlyReport(updated);
            return updated;
          });
          showNotification(json.isAi 
            ? '✨ Analisis cerdas AI berhasil disintesis ke ringkasan, capaian, kendala, dan solusi bulanan!' 
            : '✨ Analisis cerdas otomatis berhasil disinkronkan ke seluruh bagian laporan bulanan!');
        }
      } else {
        showNotification('Gagal menghubungi layanan analisis cerdas.');
      }
    } catch (err) {
      console.error(err);
      showNotification('Terjadi kesalahan saat memproses analisis cerdas.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMonthYearChange = (m: number, y: number) => {
    setSelectedMonth(m);
    setSelectedYear(y);
    const rep = monthlyReports.find(
      r => r.role === effectiveRole && r.month === m && r.year === y
    ) || generateMonthlyReportFromTasks(effectiveRole, m, y);
    setReportState(rep);
  };

  const handleSyncFromTasks = () => {
    const fresh = generateMonthlyReportFromTasks(effectiveRole, selectedMonth, selectedYear);
    setReportState(fresh);
    saveMonthlyReport(fresh);
    showNotification('Data disinkronkan kembali dari catatan tugas harian operasional!');
  };

  const handleLoadOfficialTemplate = () => {
    const tpl = OFFICIAL_MONTHLY_TEMPLATES[effectiveRole];
    if (tpl) {
      setReportState(prev => ({
        ...prev,
        summary: tpl.summary,
        achievements: [...tpl.achievements],
        obstacles: [...tpl.obstacles],
        solutions: [...tpl.solutions]
      }));
      showNotification(`Template resmi standar ${roleTitle} berhasil diterapkan!`);
    }
  };

  const handleSave = () => {
    saveMonthlyReport(reportState);
    showNotification('Laporan bulanan berhasil disimpan dan disinkronkan ke sistem pengesahan!');
  };

  const handleExportTemplateJson = () => {
    const blob = new Blob([JSON.stringify(reportState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Template_Laporan_Bulanan_${effectiveRole}_Bulan_${selectedMonth}_${selectedYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Template laporan berhasil diekspor!');
  };

  const handleImportTemplateJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          setReportState(prev => ({
            ...prev,
            summary: parsed.summary || prev.summary,
            achievements: Array.isArray(parsed.achievements) ? parsed.achievements : prev.achievements,
            obstacles: Array.isArray(parsed.obstacles) ? parsed.obstacles : prev.obstacles,
            solutions: Array.isArray(parsed.solutions) ? parsed.solutions : prev.solutions,
            manualDocDate: parsed.manualDocDate || prev.manualDocDate
          }));
          showNotification('Template laporan berhasil diimpor!');
        } catch (err) {
          alert('Gagal membaca file JSON template!');
        }
      };
      reader.readAsText(file);
    }
  };

  const addAchievement = () => {
    if (!newAchievement.trim()) return;
    setReportState(prev => ({ ...prev, achievements: [...prev.achievements, newAchievement.trim()] }));
    setNewAchievement('');
  };

  const removeAchievement = (index: number) => {
    setReportState(prev => ({ ...prev, achievements: prev.achievements.filter((_, i) => i !== index) }));
  };

  const addObstacle = () => {
    if (!newObstacle.trim()) return;
    setReportState(prev => ({ ...prev, obstacles: [...prev.obstacles, newObstacle.trim()] }));
    setNewObstacle('');
  };

  const removeObstacle = (index: number) => {
    setReportState(prev => ({ ...prev, obstacles: prev.obstacles.filter((_, i) => i !== index) }));
  };

  const addSolution = () => {
    if (!newSolution.trim()) return;
    setReportState(prev => ({ ...prev, solutions: [...prev.solutions, newSolution.trim()] }));
    setNewSolution('');
  };

  const removeSolution = (index: number) => {
    setReportState(prev => ({ ...prev, solutions: prev.solutions.filter((_, i) => i !== index) }));
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-700" />
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              Laporan Bulanan Kinerja: {roleTitle}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dihasilkan secara otomatis dari kompilasi tugas harian dan dilengkapi inventaris kerja dinas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthYearChange(parseInt(e.target.value), selectedYear)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx} value={idx + 1}>{name}</option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => handleMonthYearChange(selectedMonth, parseInt(e.target.value))}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>

          {/* Smart Analysis AI Button */}
          <button
            type="button"
            onClick={handleSmartAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 active:scale-95 rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50"
            title="Buatkan analisis cerdas otomatis pada ringkasan, capaian, kendala, dan solusi"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-200" />
                <span>Menganalisis Kinerja...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>Analisis Cerdas Otomatis</span>
              </>
            )}
          </button>

          {/* Template Button */}
          <button
            type="button"
            onClick={handleLoadOfficialTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200 cursor-pointer"
            title="Muat templat uraian resmi standar kedinasan"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Template Standar</span>
          </button>

          {/* Sync Button */}
          <button
            type="button"
            onClick={handleSyncFromTasks}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            title="Kalkulasi ulang dari data tugas harian"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkron Tugas</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan</span>
          </button>

          {/* Open Print Document */}
          <button
            type="button"
            onClick={() => onOpenPrint('monthly', reportState)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Cetak / Unduh PDF</span>
          </button>

          {/* Archive Report */}
          <button
            type="button"
            onClick={() => {
              const doc = archiveReport('monthly', reportState);
              showNotification(`Laporan ${doc.title} berhasil diarsipkan ke Lemari Arsip Pemeriksaan (No. Reg: ${doc.regNumber})`);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors border border-amber-300 shadow-2xs cursor-pointer"
            title="Arsipkan laporan ini untuk keperluan pemeriksaan / audit"
          >
            <Archive className="w-3.5 h-3.5 text-amber-700" />
            <span>Arsipkan</span>
          </button>
        </div>
      </div>

      {noticeMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* Quick Import / Export Template Helper */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-700" />
          <span className="font-semibold">Templat & Impor Otomatis Laporan Bulanan:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-300 rounded text-blue-800 text-[11px] font-medium transition-colors shadow-2xs">
            <Upload className="w-3 h-3 text-blue-600" />
            <span>Impor Template JSON</span>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportTemplateJson} 
              className="hidden" 
            />
          </label>

          <button
            type="button"
            onClick={handleExportTemplateJson}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-300 rounded text-blue-800 text-[11px] font-medium transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3 h-3 text-blue-600" />
            <span>Ekspor Template JSON</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <p className="text-xs font-medium text-slate-500">Tugas Terlaksana di Bulan Ini</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {completedCount} <span className="text-sm font-normal text-slate-500">/ {monthTasks.length} tugas</span>
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              style={{ width: `${monthTasks.length > 0 ? (completedCount / monthTasks.length) * 100 : 100}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <p className="text-xs font-medium text-slate-500">Tingkat Capaian Standar Operasional</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">
            {monthTasks.length > 0 ? Math.round((completedCount / monthTasks.length) * 100) : 100}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Sesuai Standar Pelayanan Minimal (SPM) Sekolah
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <p className="text-xs font-medium text-slate-500">Status Validasi Dokumen</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200">
              {reportState.approvalStatus.replace('_', ' ')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Lembar Pengesahan: NIP & Cap Stempel Resmi Siap
          </p>
        </div>
      </div>

      {/* Manual Date Setting */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-0.5">
            Format Tanggal Manual Dokumen Pengesahan:
          </label>
          <p className="text-[11px] text-slate-500">
            Dapat diubah secara bebas sesuai kebutuhan tanggal pelaporan resmi satuan pendidikan.
          </p>
        </div>
        <input
          type="text"
          value={reportState.manualDocDate}
          onChange={(e) => setReportState(prev => ({ ...prev, manualDocDate: e.target.value }))}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold w-full sm:w-72 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          placeholder="Contoh: Kota Bogor, 30 September 2026"
        />
      </div>

      {/* BANNER ANALISIS CERDAS OTOMATIS */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-indigo-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0 text-purple-300">
            <Brain className="w-5 h-5 text-yellow-300 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-yellow-300 uppercase">
                Fitur Analisis Cerdas Otomatis
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 font-semibold">
                AI & Logika Kinerja Satdik
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed max-w-2xl">
              Sistem akan membedah seluruh catatan tugas harian bulan ini ({monthTasks.length} tugas), menghitung capaian SPM, merumuskan <strong>ringkasan eksekutif</strong>, memetakan <strong>daftar capaian prestasi</strong>, mendeteksi <strong>kendala lapangan</strong>, serta merumuskan <strong>solusi dan mitigasi masalah</strong> secara otomatis.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSmartAnalysis}
          disabled={isAnalyzing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Memproses Analisis Otomatis...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Jalankan Analisis Cerdas Otomatis</span>
            </>
          )}
        </button>
      </div>

      {/* Uraian Ringkasan & Capaian Kinerja */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-900">
              Ringkasan Eksekutif Kinerja Bulanan:
            </label>
            <span className="text-[11px] text-slate-400">Dapat diedit bebas</span>
          </div>
          <textarea
            rows={3}
            value={reportState.summary}
            onChange={(e) => setReportState(prev => ({ ...prev, summary: e.target.value }))}
            className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 leading-relaxed"
          />
        </div>

        {/* Capaian Utama */}
        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1.5">
            Daftar Capaian & Prestasi Kinerja yang Terlaksana:
          </label>
          <div className="space-y-2 mb-2">
            {reportState.achievements.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                <span className="font-semibold text-blue-900 shrink-0">{idx + 1}.</span>
                <span className="text-slate-800 flex-1">{item}</span>
                <button
                  type="button"
                  onClick={() => removeAchievement(idx)}
                  className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tambahkan poin capaian kinerja..."
              value={newAchievement}
              onChange={(e) => setNewAchievement(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAchievement(); } }}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addAchievement}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 cursor-pointer"
            >
              Tambah
            </button>
          </div>
        </div>

        {/* Kendala & Solusi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Kendala */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Kendala / Hambatan di Lapangan:
            </label>
            <div className="space-y-1.5 mb-2">
              {reportState.obstacles.map((obs, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-amber-50/70 p-2 rounded-lg border border-amber-200 text-xs">
                  <span className="font-semibold text-amber-900 shrink-0">•</span>
                  <span className="text-slate-800 flex-1">{obs}</span>
                  <button
                    type="button"
                    onClick={() => removeObstacle(idx)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tambah kendala..."
                value={newObstacle}
                onChange={(e) => setNewObstacle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addObstacle(); } }}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addObstacle}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 cursor-pointer"
              >
                Tambah
              </button>
            </div>
          </div>

          {/* Solusi */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Solusi & Upaya Pemecahan Masalah:
            </label>
            <div className="space-y-1.5 mb-2">
              {reportState.solutions.map((sol, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200 text-xs">
                  <span className="font-semibold text-emerald-900 shrink-0">•</span>
                  <span className="text-slate-800 flex-1">{sol}</span>
                  <button
                    type="button"
                    onClick={() => removeSolution(idx)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tambah solusi..."
                value={newSolution}
                onChange={(e) => setNewSolution(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSolution(); } }}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addSolution}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 cursor-pointer"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rincian Tugas yang Masuk Laporan */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Daftar Tugas Harian yang Terkompilasi ({monthTasks.length} tugas)
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Sumber Data: Upload Harian Operator
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-2 px-3">Tanggal</th>
                <th className="py-2 px-3">Judul Pekerjaan</th>
                <th className="py-2 px-3">Lokasi</th>
                <th className="py-2 px-3 text-center">Waktu</th>
                <th className="py-2 px-3">Volume</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                    Belum ada tugas tercatat pada bulan ini. Gunakan tombol 'Catat Tugas' di dashboard untuk menambah.
                  </td>
                </tr>
              ) : (
                monthTasks.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">{t.date}</td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-slate-800 block">{t.title}</span>
                      <span className="text-[11px] text-slate-500 block">{t.description}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-700">{t.location}</td>
                    <td className="py-2 px-3 text-center text-slate-600 whitespace-nowrap">{t.timeStart} - {t.timeEnd}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">{t.volumeUnit}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        t.status === 'selesai' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lampiran Inventaris Terkait */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Daftar Inventaris Sarana Pendukung ({roleTitle})
          </h3>
          <span className="text-xs text-slate-500">
            Otomatis terlampir dalam berkas cetak dan PDF
          </span>
        </div>
        <InventoryTable role={effectiveRole} />
      </div>
    </div>
  );
};
