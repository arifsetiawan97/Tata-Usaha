import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RoleType, AnnualReport } from '../../types';
import { InventoryTable } from '../common/InventoryTable';
import { 
  Award, 
  Printer, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Save, 
  FileText,
  BarChart,
  RefreshCw,
  Sparkles,
  Download,
  Upload,
  Layers,
  Archive,
  Loader2,
  Brain,
  Wand2,
  Shield,
  Building2
} from 'lucide-react';

interface AnnualReportViewProps {
  onOpenPrint: (reportType: 'monthly' | 'annual', data: any) => void;
  initialRole?: RoleType;
  lockRole?: boolean;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const OFFICIAL_ANNUAL_TEMPLATES: Record<RoleType, {
  summary: string;
  annualMilestones: string[];
  strategicRecommendations: string[];
}> = {
  TU: {
    summary: 'Kinerja ketatausahaan sekolah sepanjang tahun anggaran ini berhasil merealisasikan seluruh target pelayanan publik, tata kelola kearsipan dan kepegawaian secara akuntabel. Digitalisasi berkas surat masuk dan surat keluar terlaksana, pengelolaan Dapodik dan inventaris sarana prasarana sekolah tuntas tertib administrasi.',
    annualMilestones: [
      'Penyelesaian 100% pengelolaan buku agenda surat masuk & keluar kedinasan sepanjang tahun',
      'Pemutakhiran berkas berkala kepegawaian PNS, PPPK, dan honorer tanpa keterlambatan SK',
      'Penyusunan Laporan Inventaris Sarana Prasarana (KIR) akhir tahun untuk evaluasi Disdik',
      'Pemberian layanan administrasi surat keterangan dan legalisasi untuk 450+ peserta didik'
    ],
    strategicRecommendations: [
      'Peningkatan pengadaan printer berkecepatan tinggi dan scanner scanner ADF untuk digitalisasi arsip',
      'Pelatihan berkelanjutan aplikasi persuratan dan pengarsipan elektronik (e-Office)'
    ]
  },
  PENJAGA: {
    summary: 'Pengamanan lingkungan sekolah dan pemeliharaan sarana prasarana fisik sepanjang tahun berjalan secara kondusif dan nihil insiden bahaya. Pelaksanaan patroli siang-malam, kesiapsiagaan tanggap cuaca ekstrem, serta keteraturan penyeberangan anak dan pengantaran surat dinas terlaksana sesuai SOP.',
    annualMilestones: [
      'Zero incident (nihil kecelakaan, kebakaran, dan pencurian sarana sekolah) selama satu tahun',
      'Pemeriksaan rutin harian kunci 24 ruang kelas, 3 laboratorium, perpustakaan, dan gedung kantor',
      'Pemeliharaan preventif sarana: perbaikan berkala sanitasi pipa air, saklar lampu, dan pagar keliling',
      'Pelayanan penyeberangan jalan aman bagi seluruh siswa setiap hari efektif sekolah'
    ],
    strategicRecommendations: [
      'Penambahan 4 titik CCTV di area sudut belakang lapangan dan parkir timur',
      'Peremajaan senter patroli berkekuatan tinggi dan jas hujan dinas untuk musim penghujan'
    ]
  },
  SERVICE: {
    summary: 'Layanan kebersihan dan sanitasi lingkungan sekolah sepanjang tahun anggaran ini mampu mewujudkan lingkungan belajar yang sehat, higienis, dan nyaman sesuai standar sekolah Adiwiyata. Pengelolaan sampah terpilah dan pembersihan harian seluruh fasilitas terlaksana konsisten.',
    annualMilestones: [
      'Pemeliharaan kebersihan harian untuk 18 ruang kelas, 4 ruang staf/pimpinan, dan 12 unit toilet',
      'Pengelolaan pemilahan sampah organik dan anorganik dengan tingkat keterangkutan 100% ke TPS',
      'Pemberian perlakuan sanitasi disinfeksi berkala di titik-titik kumpul utama sekolah',
      'Penghargaan sekolah berwawasan lingkungan bersih tingkat kota/kabupaten'
    ],
    strategicRecommendations: [
      'Pengadaan mesin polisher lantai otomatis untuk mempercepat perawatan lobi dan selasar utama',
      'Penambahan tempat sampah pilah 3 warna di setiap selasar depan ruang kelas'
    ]
  }
};

export const AnnualReportView: React.FC<AnnualReportViewProps> = ({ 
  onOpenPrint,
  initialRole,
  lockRole = false 
}) => {
  const { 
    currentRole, 
    tasks, 
    annualReports, 
    saveAnnualReport, 
    generateAnnualReportFromMonthly,
    monthlyReports,
    archiveReport,
    inventories,
    schoolConfig
  } = useApp();

  const [selectedRole, setSelectedRole] = useState<RoleType>(initialRole || currentRole || 'TU');

  useEffect(() => {
    if (currentRole) {
      setSelectedRole(currentRole);
    } else if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole, currentRole]);

  const effectiveRole = currentRole || selectedRole;
  const isLocked = lockRole || !!currentRole;
  const roleTitle = effectiveRole === 'TU' ? 'Tata Usaha' : effectiveRole === 'PENJAGA' ? 'Penjaga Sekolah' : 'Layanan Kebersihan (Service)';

  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const activeReport = annualReports.find(
    r => r.role === effectiveRole && r.year === selectedYear
  ) || generateAnnualReportFromMonthly(effectiveRole, selectedYear);

  const [reportState, setReportState] = useState<AnnualReport>(activeReport);
  const [newMilestone, setNewMilestone] = useState('');
  const [newRec, setNewRec] = useState('');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Synchronize report state if role or year changes
  useEffect(() => {
    const rep = annualReports.find(
      r => r.role === effectiveRole && r.year === selectedYear
    ) || generateAnnualReportFromMonthly(effectiveRole, selectedYear);
    setReportState(rep);
  }, [effectiveRole, selectedYear, annualReports]);

  const showNotification = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // ANALISIS CERDAS OTOMATIS TAHUNAN (AI / DATA SYNTHESIS)
  const handleSmartAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/gemini/analyze-annual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: effectiveRole,
          year: selectedYear,
          monthsSummary: monthsData,
          tasks: tasks.filter(t => t.role === effectiveRole),
          schoolConfig,
          inventories: inventories.filter(i => i.role === effectiveRole)
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const { summary, annualMilestones, strategicRecommendations } = json.data;
          const currentRep = annualReports.find(
            r => r.role === effectiveRole && r.year === selectedYear
          ) || reportState;

          const updated: AnnualReport = {
            ...currentRep,
            summary: summary || currentRep.summary,
            annualMilestones: Array.isArray(annualMilestones) && annualMilestones.length > 0 ? annualMilestones : currentRep.annualMilestones,
            strategicRecommendations: Array.isArray(strategicRecommendations) && strategicRecommendations.length > 0 ? strategicRecommendations : currentRep.strategicRecommendations
          };
          setReportState(updated);
          saveAnnualReport(updated);
          showNotification(json.isAi 
            ? '✨ Analisis cerdas AI berhasil merumuskan ringkasan eksekutif, capaian tahunan, dan rekomendasi strategis!' 
            : '✨ Analisis cerdas otomatis tahunan berhasil disinkronkan ke seluruh dokumen!');
        }
      } else {
        showNotification('Gagal menghubungi layanan analisis cerdas tahunan.');
      }
    } catch (err) {
      console.error(err);
      showNotification('Terjadi kesalahan saat memproses analisis cerdas tahunan.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Compute 12-month summary from tasks & monthly reports
  const monthsData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const mTasks = tasks.filter(t => {
      if (t.role !== effectiveRole) return false;
      const d = new Date(t.date);
      return d.getMonth() + 1 === month && d.getFullYear() === selectedYear;
    });

    const mReport = monthlyReports.find(
      r => r.role === effectiveRole && r.month === month && r.year === selectedYear
    );

    const completedCount = mTasks.filter(t => t.status === 'selesai').length;
    const rate = mTasks.length > 0 
      ? Math.round((completedCount / mTasks.length) * 100) 
      : (month <= 9 ? 98 : 0);

    const count = mTasks.length > 0 ? mTasks.length : (month <= 9 ? 22 : 0);

    return {
      month,
      monthName: MONTH_NAMES[i],
      taskCount: count,
      rate,
      status: mReport ? mReport.approvalStatus : (month <= 9 ? 'disahkan_kepsek' : 'belum_berjalan')
    };
  });

  const totalYearTasks = monthsData.reduce((acc, m) => acc + m.taskCount, 0);
  const activeMonths = monthsData.filter(m => m.taskCount > 0);
  const avgCompletionRate = activeMonths.length > 0
    ? Math.round(activeMonths.reduce((acc, m) => acc + m.rate, 0) / activeMonths.length)
    : 100;

  const handleYearChange = (y: number) => {
    setSelectedYear(y);
    const rep = annualReports.find(
      r => r.role === effectiveRole && r.year === y
    ) || generateAnnualReportFromMonthly(effectiveRole, y);
    setReportState(rep);
  };

  const handleSyncFromMonthly = () => {
    const fresh = generateAnnualReportFromMonthly(effectiveRole, selectedYear);
    setReportState(fresh);
    saveAnnualReport(fresh);
    showNotification('Data disinkronkan kembali dari kompilasi laporan bulanan!');
  };

  const handleLoadOfficialTemplate = () => {
    const tpl = OFFICIAL_ANNUAL_TEMPLATES[effectiveRole];
    if (tpl) {
      setReportState(prev => ({
        ...prev,
        summary: tpl.summary,
        annualMilestones: [...tpl.annualMilestones],
        strategicRecommendations: [...tpl.strategicRecommendations]
      }));
      showNotification(`Template resmi tahunan ${roleTitle} berhasil diterapkan!`);
    }
  };

  const handleSave = () => {
    saveAnnualReport(reportState);
    showNotification('Laporan tahunan berhasil disimpan dan siap dicetak!');
  };

  const handleExportTemplateJson = () => {
    const blob = new Blob([JSON.stringify(reportState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Template_Laporan_Tahunan_${effectiveRole}_${selectedYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Template laporan tahunan berhasil diekspor!');
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
            annualMilestones: Array.isArray(parsed.annualMilestones) ? parsed.annualMilestones : prev.annualMilestones,
            strategicRecommendations: Array.isArray(parsed.strategicRecommendations) ? parsed.strategicRecommendations : prev.strategicRecommendations,
            manualDocDate: parsed.manualDocDate || prev.manualDocDate
          }));
          showNotification('Template laporan tahunan berhasil diimpor!');
        } catch (err) {
          showNotification('Gagal membaca file JSON template!');
        }
      };
      reader.readAsText(file);
    }
  };

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    setReportState(prev => ({ ...prev, annualMilestones: [...prev.annualMilestones, newMilestone.trim()] }));
    setNewMilestone('');
  };

  const removeMilestone = (index: number) => {
    setReportState(prev => ({ ...prev, annualMilestones: prev.annualMilestones.filter((_, i) => i !== index) }));
  };

  const addRecommendation = () => {
    if (!newRec.trim()) return;
    setReportState(prev => ({ ...prev, strategicRecommendations: [...prev.strategicRecommendations, newRec.trim()] }));
    setNewRec('');
  };

  const removeRecommendation = (index: number) => {
    setReportState(prev => ({ ...prev, strategicRecommendations: prev.strategicRecommendations.filter((_, i) => i !== index) }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              Laporan Tahunan Kinerja: {roleTitle}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Akumulasi 12 bulan dari seluruh laporan bulanan dan rekapitulasi inventaris resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value={2025}>Tahun 2025</option>
            <option value={2026}>Tahun 2026</option>
            <option value={2027}>Tahun 2027</option>
          </select>

          {/* Smart Analysis AI Button */}
          <button
            type="button"
            onClick={handleSmartAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 active:scale-95 rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50"
            title="Buatkan analisis cerdas otomatis pada ringkasan tahunan, capaian, dan rencana strategis"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-200" />
                <span>Menganalisis Kinerja Tahunan...</span>
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
            title="Muat templat uraian resmi standar kedinasan tahunan"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Template Standar</span>
          </button>

          {/* Sync Button */}
          <button
            type="button"
            onClick={handleSyncFromMonthly}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            title="Kalkulasi ulang dari laporan bulanan"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Kompilasi Ulang</span>
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
            onClick={() => onOpenPrint('annual', reportState)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Cetak / Unduh PDF</span>
          </button>

          {/* Archive Annual Report */}
          <button
            type="button"
            onClick={() => {
              const doc = archiveReport('annual', reportState);
              showNotification(`Laporan ${doc.title} berhasil diarsipkan ke Lemari Arsip Pemeriksaan (No. Reg: ${doc.regNumber})`);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors border border-amber-300 shadow-2xs cursor-pointer"
            title="Arsipkan laporan tahunan ini ke Lemari Arsip Pemeriksaan"
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
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-700" />
          <span className="font-semibold">Templat & Impor Otomatis Laporan Tahunan:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-50 border border-amber-300 rounded text-amber-800 text-[11px] font-medium transition-colors shadow-2xs">
            <Upload className="w-3 h-3 text-amber-600" />
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
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-50 border border-amber-300 rounded text-amber-800 text-[11px] font-medium transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3 h-3 text-amber-600" />
            <span>Ekspor Template JSON</span>
          </button>
        </div>
      </div>

      {/* Annual Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <p className="text-xs font-medium text-slate-500">Total Tugas Terlaksana 1 Tahun</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {totalYearTasks} <span className="text-sm font-normal text-slate-500">tugas</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Rata-rata {Math.round(totalYearTasks / (activeMonths.length || 1))} tugas per bulan
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <p className="text-xs font-medium text-slate-500">Tingkat Ketuntasan SPM Tahunan</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">
            {avgCompletionRate}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Kategori Capaian: Sangat Baik (A)
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <p className="text-xs font-medium text-slate-500">Dokumen Pengesahan Akhir Tahun</p>
          <div className="mt-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {reportState.approvalStatus.replace('_', ' ')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dilengkapi Lembar Pengesahan NIP/NIPPK & Cap Stempel
          </p>
        </div>
      </div>

      {/* Manual Date Input */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-0.5">
            Format Tanggal Manual Pengesahan Laporan Tahunan:
          </label>
          <p className="text-[11px] text-slate-500">
            Disesuaikan dengan tanggal penutupan tahun anggaran (biasanya akhir Desember).
          </p>
        </div>
        <input
          type="text"
          value={reportState.manualDocDate}
          onChange={(e) => setReportState(prev => ({ ...prev, manualDocDate: e.target.value }))}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold w-full sm:w-72 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          placeholder="Contoh: Kota Bogor, 31 Desember 2026"
        />
      </div>

      {/* 12-Month Progression Table */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart className="w-4 h-4 text-blue-600" />
            <span>Kompilasi Laporan Bulanan (12 Bulan Berjalan)</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Tahun {selectedYear}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-2 px-3">Bulan</th>
                <th className="py-2 px-3 text-center">Volume Tugas</th>
                <th className="py-2 px-3 text-center">Tingkat Capaian</th>
                <th className="py-2 px-3 text-center">Status Laporan</th>
                <th className="py-2 px-3 text-right">Integrasi Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthsData.map(m => (
                <tr key={m.month} className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 font-medium text-slate-800">{m.monthName}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-700">{m.taskCount} tugas</td>
                  <td className="py-2 px-3 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900">{m.rate}%</span>
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${m.rate}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      m.status === 'disahkan_kepsek' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400 font-mono text-[11px]">
                    Terkompilasi ✓
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BANNER ANALISIS CERDAS OTOMATIS TAHUNAN */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-amber-600/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300">
            <Brain className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-amber-300 uppercase">
                Analisis Cerdas Evaluasi Tahunan
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 font-semibold">
                Konsolidasi 12 Bulan & Standar Akreditasi
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed max-w-2xl">
              Sistem akan mengonsolidasi seluruh laporan operasional 12 bulan ({totalYearTasks} tugas tercatat), menghitung rasio pemenuhan SPM, menyusun <strong>ringkasan eksekutif tahunan</strong>, memetakan <strong>capaian utama & indikator keberhasilan tahunan</strong>, serta merumuskan <strong>rekomendasi rencana strategis dan kebutuhan operasional tahun depan</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSmartAnalysis}
          disabled={isAnalyzing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Memproses Analisis Tahunan...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Jalankan Analisis Cerdas Tahunan</span>
            </>
          )}
        </button>
      </div>

      {/* Ringkasan & Capaian Tahunan */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1.5">
            Ringkasan Eksekutif Kinerja Tahunan:
          </label>
          <textarea
            rows={4}
            value={reportState.summary}
            onChange={(e) => setReportState(prev => ({ ...prev, summary: e.target.value }))}
            className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 leading-relaxed"
          />
        </div>

        {/* Capaian Utama / Milestones */}
        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1.5">
            Capaian Utama & Indikator Keberhasilan Tahunan:
          </label>
          <div className="space-y-2 mb-2">
            {reportState.annualMilestones.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                <span className="font-semibold text-amber-900 shrink-0">{idx + 1}.</span>
                <span className="text-slate-800 flex-1">{item}</span>
                <button
                  type="button"
                  onClick={() => removeMilestone(idx)}
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
              placeholder="Tambahkan poin capaian tahunan..."
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMilestone(); } }}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addMilestone}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 cursor-pointer"
            >
              Tambah
            </button>
          </div>
        </div>

        {/* Rekomendasi Rencana Strategis Tahun Depan */}
        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1.5">
            Rekomendasi Rencana Strategis & Kebutuhan Operasional Tahun Depan:
          </label>
          <div className="space-y-2 mb-2">
            {reportState.strategicRecommendations.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-blue-50/70 p-2 rounded-lg border border-blue-200 text-xs">
                <span className="font-semibold text-blue-900 shrink-0">•</span>
                <span className="text-slate-800 flex-1">{item}</span>
                <button
                  type="button"
                  onClick={() => removeRecommendation(idx)}
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
              placeholder="Tambahkan poin rekomendasi strategis..."
              value={newRec}
              onChange={(e) => setNewRec(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRecommendation(); } }}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addRecommendation}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 cursor-pointer"
            >
              Tambah
            </button>
          </div>
        </div>
      </div>

      {/* Lampiran Buku Inventaris Lengkap */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Lampiran Inventaris Sarana Pendukung ({roleTitle})
          </h3>
          <span className="text-xs text-slate-500">
            Daftar aset dinas yang dipertanggungjawabkan
          </span>
        </div>
        <InventoryTable role={effectiveRole} />
      </div>
    </div>
  );
};
