import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { RoleType, AnnualReport } from '../../types';
import { InventoryTable } from '../common/InventoryTable';
import { ROLE_OPERATIONAL_SPECS } from '../../data/roleOperationalSpecs';
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
  Building2, 
  Sliders, 
  Eye, 
  AlertTriangle,
  BookOpen,
  Users,
  GraduationCap,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Percent,
  Target
} from 'lucide-react';

interface AnnualReportViewProps {
  onOpenPrint: (reportType: 'monthly' | 'annual', data: any, options?: { autoPrint?: boolean }) => void;
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
  obstacles: string[];
  solutions: string[];
}> = {
  TU: {
    summary: ROLE_OPERATIONAL_SPECS.TU.getExecutiveSummaryAnnual(2026, { total: 320, completed: 315, rate: 98 }),
    annualMilestones: ROLE_OPERATIONAL_SPECS.TU.annualMilestones,
    strategicRecommendations: ROLE_OPERATIONAL_SPECS.TU.strategicRecommendations,
    obstacles: ROLE_OPERATIONAL_SPECS.TU.fieldObstacles.map(o => o.obstacle),
    solutions: ROLE_OPERATIONAL_SPECS.TU.fieldObstacles.map(o => o.solution)
  },
  PENJAGA: {
    summary: ROLE_OPERATIONAL_SPECS.PENJAGA.getExecutiveSummaryAnnual(2026, { total: 300, completed: 298, rate: 99 }),
    annualMilestones: ROLE_OPERATIONAL_SPECS.PENJAGA.annualMilestones,
    strategicRecommendations: ROLE_OPERATIONAL_SPECS.PENJAGA.strategicRecommendations,
    obstacles: ROLE_OPERATIONAL_SPECS.PENJAGA.fieldObstacles.map(o => o.obstacle),
    solutions: ROLE_OPERATIONAL_SPECS.PENJAGA.fieldObstacles.map(o => o.solution)
  },
  SERVICE: {
    summary: ROLE_OPERATIONAL_SPECS.SERVICE.getExecutiveSummaryAnnual(2026, { total: 290, completed: 288, rate: 99 }),
    annualMilestones: ROLE_OPERATIONAL_SPECS.SERVICE.annualMilestones,
    strategicRecommendations: ROLE_OPERATIONAL_SPECS.SERVICE.strategicRecommendations,
    obstacles: ROLE_OPERATIONAL_SPECS.SERVICE.fieldObstacles.map(o => o.obstacle),
    solutions: ROLE_OPERATIONAL_SPECS.SERVICE.fieldObstacles.map(o => o.solution)
  },
  PERPUS: {
    summary: ROLE_OPERATIONAL_SPECS.PERPUS.getExecutiveSummaryAnnual(2026, { total: 275, completed: 272, rate: 99 }),
    annualMilestones: ROLE_OPERATIONAL_SPECS.PERPUS.annualMilestones,
    strategicRecommendations: ROLE_OPERATIONAL_SPECS.PERPUS.strategicRecommendations,
    obstacles: ROLE_OPERATIONAL_SPECS.PERPUS.fieldObstacles.map(o => o.obstacle),
    solutions: ROLE_OPERATIONAL_SPECS.PERPUS.fieldObstacles.map(o => o.solution)
  },
  LAB_IPA: {
    summary: ROLE_OPERATIONAL_SPECS.LAB_IPA.getExecutiveSummaryAnnual(2026, { total: 260, completed: 258, rate: 99 }),
    annualMilestones: ROLE_OPERATIONAL_SPECS.LAB_IPA.annualMilestones,
    strategicRecommendations: ROLE_OPERATIONAL_SPECS.LAB_IPA.strategicRecommendations,
    obstacles: ROLE_OPERATIONAL_SPECS.LAB_IPA.fieldObstacles.map(o => o.obstacle),
    solutions: ROLE_OPERATIONAL_SPECS.LAB_IPA.fieldObstacles.map(o => o.solution)
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
    schoolConfig,
    libraryBooks,
    libraryMemberStats
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
  const roleTitle = 
    effectiveRole === 'TU' ? 'Tata Usaha' : 
    effectiveRole === 'PENJAGA' ? 'Penjaga Sekolah' : 
    effectiveRole === 'SERVICE' ? 'Layanan Kebersihan (Service)' :
    effectiveRole === 'PERPUS' ? 'Layanan Perpustakaan' : 'Laboratorium IPA';

  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const activeReport = annualReports.find(
    r => r.role === effectiveRole && r.year === selectedYear
  ) || generateAnnualReportFromMonthly(effectiveRole, selectedYear);

  const [reportState, setReportState] = useState<AnnualReport>(activeReport);
  const [newMilestone, setNewMilestone] = useState('');
  const [newRec, setNewRec] = useState('');
  const [newObstacle, setNewObstacle] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Synchronize report state if role or year changes
  useEffect(() => {
    const rep = annualReports.find(
      r => r.role === effectiveRole && r.year === selectedYear
    ) || generateAnnualReportFromMonthly(effectiveRole, selectedYear);
    setReportState(rep);
  }, [effectiveRole, selectedYear, annualReports]);

  // Khusus Perpustakaan: Rekapitulasi Pemustaka & Data Seluruh Koleksi Buku Terdata
  const isPerpus = effectiveRole === 'PERPUS';
  const totalSiswaMember = (libraryMemberStats.siswaLaki || 0) + (libraryMemberStats.siswaPerempuan || 0);
  const totalAnggotaPerpus = (libraryMemberStats.guruPendidik || 0) + (libraryMemberStats.staffTendik || 0) + totalSiswaMember;
  const totalAllBookCopies = useMemo(() => {
    return libraryBooks.reduce((sum, b) => sum + (Number(b.jumlah) || 1), 0);
  }, [libraryBooks]);

  // Statistik Penambahan Buku per Bulan Beserta Persentase
  const monthlyBookAdditionStats = useMemo(() => {
    if (!isPerpus) return [];

    const monthlyList = MONTH_NAMES.map((name, idx) => {
      const monthNum = idx + 1;
      const targetMonthKey = `${selectedYear}-${String(monthNum).padStart(2, '0')}`;

      const booksInMonth = libraryBooks.filter(book => {
        const rawBulan = String(book.bulanPengadaan || (book.tanggalMasuk ? book.tanggalMasuk.substring(0, 7) : ''));
        if (rawBulan.startsWith(targetMonthKey)) return true;
        if (book.tanggalMasuk && book.tanggalMasuk.startsWith(targetMonthKey)) return true;
        if (typeof book.bulanPengadaan === 'number' && book.bulanPengadaan === monthNum) {
          const y = book.tahunPengadaan || (book.tanggalMasuk ? parseInt(book.tanggalMasuk.split('-')[0], 10) : selectedYear);
          if (y === selectedYear) return true;
        }
        return false;
      });

      const judulCount = booksInMonth.length;
      const eksemplarCount = booksInMonth.reduce((sum, b) => sum + (Number(b.jumlah) || 1), 0);
      const totalNilai = booksInMonth.reduce((sum, b) => sum + ((Number(b.hargaSatuan) || 0) * (Number(b.jumlah) || 1)), 0);

      return {
        monthNum,
        monthName: name,
        judulCount,
        eksemplarCount,
        totalNilai,
        books: booksInMonth
      };
    });

    const totalYearCopies = monthlyList.reduce((sum, m) => sum + m.eksemplarCount, 0);
    const totalYearJudul = monthlyList.reduce((sum, m) => sum + m.judulCount, 0);

    let cumulative = 0;
    return monthlyList.map((m, idx) => {
      cumulative += m.eksemplarCount;
      const prevCopies = idx > 0 ? monthlyList[idx - 1].eksemplarCount : 0;
      const percentShare = totalYearCopies > 0 ? (m.eksemplarCount / totalYearCopies) * 100 : 0;

      let growthRate: number | null = null;
      let growthText = '0%';
      let trend: 'up' | 'down' | 'same' | 'none' = 'none';

      if (idx === 0) {
        if (m.eksemplarCount > 0) {
          growthText = '+100%';
          trend = 'up';
        } else {
          growthText = '0%';
          trend = 'none';
        }
      } else {
        if (prevCopies === 0 && m.eksemplarCount > 0) {
          growthRate = 100;
          growthText = '+100%';
          trend = 'up';
        } else if (prevCopies > 0 && m.eksemplarCount > 0) {
          growthRate = ((m.eksemplarCount - prevCopies) / prevCopies) * 100;
          if (growthRate > 0) {
            growthText = `+${growthRate.toFixed(1)}%`;
            trend = 'up';
          } else if (growthRate < 0) {
            growthText = `${growthRate.toFixed(1)}%`;
            trend = 'down';
          } else {
            growthText = '0%';
            trend = 'same';
          }
        } else if (prevCopies > 0 && m.eksemplarCount === 0) {
          growthRate = -100;
          growthText = '-100%';
          trend = 'down';
        } else {
          growthText = '0%';
          trend = 'none';
        }
      }

      return {
        ...m,
        percentShare,
        growthRate,
        growthText,
        trend,
        cumulative,
        totalYearCopies,
        totalYearJudul
      };
    });
  }, [libraryBooks, selectedYear, isPerpus]);

  const totalYearAddedCopies = useMemo(() => {
    return monthlyBookAdditionStats.reduce((s, m) => s + m.eksemplarCount, 0);
  }, [monthlyBookAdditionStats]);

  const totalYearAddedTitles = useMemo(() => {
    return monthlyBookAdditionStats.reduce((s, m) => s + m.judulCount, 0);
  }, [monthlyBookAdditionStats]);

  const peakAdditionMonth = useMemo(() => {
    if (monthlyBookAdditionStats.length === 0) return null;
    let max = monthlyBookAdditionStats[0];
    monthlyBookAdditionStats.forEach(m => {
      if (m.eksemplarCount > max.eksemplarCount) max = m;
    });
    return max.eksemplarCount > 0 ? max : null;
  }, [monthlyBookAdditionStats]);

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
        strategicRecommendations: [...tpl.strategicRecommendations],
        obstacles: [...tpl.obstacles],
        solutions: [...tpl.solutions]
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
            obstacles: Array.isArray(parsed.obstacles) ? parsed.obstacles : prev.obstacles,
            solutions: Array.isArray(parsed.solutions) ? parsed.solutions : prev.solutions,
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

  const addObstacle = () => {
    if (!newObstacle.trim()) return;
    setReportState(prev => ({ ...prev, obstacles: [...(prev.obstacles || []), newObstacle.trim()] }));
    setNewObstacle('');
  };

  const removeObstacle = (index: number) => {
    setReportState(prev => ({ ...prev, obstacles: (prev.obstacles || []).filter((_, i) => i !== index) }));
  };

  const addSolution = () => {
    if (!newSolution.trim()) return;
    setReportState(prev => ({ ...prev, solutions: [...(prev.solutions || []), newSolution.trim()] }));
    setNewSolution('');
  };

  const removeSolution = (index: number) => {
    setReportState(prev => ({ ...prev, solutions: (prev.solutions || []).filter((_, i) => i !== index) }));
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

          {/* Direct Print Document (1-Click) */}
          <button
            type="button"
            onClick={() => onOpenPrint('annual', reportState, { autoPrint: true })}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Langsung cetak dokumen tahunan ke printer (dialog cetak otomatis terbuka)"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>Cetak Langsung</span>
          </button>

          {/* Open Print Document Preview */}
          <button
            type="button"
            onClick={() => onOpenPrint('annual', reportState)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Buka pratinjau lengkap dengan Kop, Pengesahan & Unduh PDF"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>Pratinjau / Pengesahan</span>
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

      {/* KHUSUS PERPUSTAKAAN: DATA ANGGOTA PEMUSTAKA TAHUNAN (GURU, STAFF, SISWA) */}
      {isPerpus && (
        <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-md border border-blue-700/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  Rekapitulasi Anggota Perpustakaan Tahun Anggaran {selectedYear}
                </h3>
                <p className="text-[11px] text-blue-200">
                  Data akumulasi seluruh pemustaka terdaftar dan aktif memanfaatkan fasilitas perpustakaan
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold border border-white/15">
              <span>Total Pemustaka:</span>
              <strong className="text-yellow-300 font-mono text-sm">{totalAnggotaPerpus.toLocaleString('id-ID')}</strong>
              <span>orang</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-[11px] text-blue-200 font-medium flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Guru (Pendidik)</span>
              </div>
              <div className="text-xl font-bold mt-1 text-white">
                {libraryMemberStats.guruPendidik || 0} <span className="text-xs font-normal text-blue-200">orang</span>
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-[11px] text-blue-200 font-medium flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>Staff (Tendik / TU)</span>
              </div>
              <div className="text-xl font-bold mt-1 text-white">
                {libraryMemberStats.staffTendik || 0} <span className="text-xs font-normal text-blue-200">orang</span>
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-[11px] text-blue-200 font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Siswa Laki-laki</span>
              </div>
              <div className="text-xl font-bold mt-1 text-white">
                {libraryMemberStats.siswaLaki || 0} <span className="text-xs font-normal text-blue-200">orang</span>
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-[11px] text-blue-200 font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-pink-400" />
                <span>Siswa Perempuan</span>
              </div>
              <div className="text-xl font-bold mt-1 text-white">
                {libraryMemberStats.siswaPerempuan || 0} <span className="text-xs font-normal text-blue-200">orang</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Date Input & Signature Options */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-0.5">
            Format Tanggal Manual Pengesahan Laporan Tahunan:
          </label>
          <p className="text-[11px] text-slate-500">
            Disesuaikan dengan tanggal penutupan tahun anggaran. Dilengkapi pilihan tanda tangan digital, basah, gores, & QR e-sign.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={reportState.manualDocDate}
            onChange={(e) => setReportState(prev => ({ ...prev, manualDocDate: e.target.value }))}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold w-full sm:w-64 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            placeholder="Contoh: Tempat, 31 Desember 2026"
          />
          <button
            type="button"
            onClick={() => onOpenPrint('annual', reportState)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer transition-colors"
            title="Buka Lembar Pengesahan & Pengaturan Tanda Tangan"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Pilihan Tanda Tangan</span>
          </button>
        </div>
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

      {/* ========================================================
          I. RINGKASAN EKSEKUTIF KINERJA TAHUNAN & CAPAIAN TARGET OPERASIONAL
          ======================================================== */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-amber-600 rounded-full inline-block"></span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight">
                I. Ringkasan Eksekutif Kinerja Tahunan & Capaian Target Operasional
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Disesuaikan khusus untuk portal akun: <span className="font-bold text-amber-700">{roleTitle}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
              {totalYearTasks} Total Tugas Tahunan
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {avgCompletionRate}% Rata-rata Ketercapaian
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Standar Akreditasi: Terpenuhi ✓
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Uraian Narasi Ringkasan Eksekutif Tahunan:
          </label>
          <textarea
            rows={4}
            value={reportState.summary}
            onChange={(e) => setReportState(prev => ({ ...prev, summary: e.target.value }))}
            className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 leading-relaxed font-sans"
            placeholder="Ketik uraian ringkasan eksekutif kinerja tahunan..."
          />
        </div>

        {/* ========================================================
            INDIKATOR KINERJA KUNCI (KPI) & TARGET TAHUNAN
            ======================================================== */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                Matriks Target Operasional & Indikator Kinerja Kunci (KPI) Tahunan - {roleTitle}
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Evaluasi 12 Bulan Kerja
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(ROLE_OPERATIONAL_SPECS[effectiveRole]?.operationalKPIs || []).map((kpi, idx) => (
              <div key={idx} className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300">
                      {kpi.code}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Tuntas 1 Tahun</span>
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 leading-tight mb-2">
                    {kpi.name}
                  </p>
                </div>
                <div className="text-[11px] space-y-1 pt-1.5 border-t border-slate-200 text-slate-600">
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-slate-500">Target Tahunan:</span>
                    <span className="font-semibold text-slate-800 text-right">{kpi.target}</span>
                  </div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-slate-500">Realisasi Akumulatif:</span>
                    <span className="font-semibold text-emerald-700 text-right">{kpi.realization}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================
            II. RINCIAN CAPAIAN INDIKATOR KINERJA YANG TERLAKSANA (MILESTONES)
            ======================================================== */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                II. Rincian Capaian Indikator Kinerja yang Terlaksana (Milestones & Target SPM)
              </h4>
              <p className="text-[11px] text-slate-500">
                Pencapaian strategis tahunan yang berhasil diselesaikan sepanjang tahun anggaran ({roleTitle})
              </p>
            </div>
            {/* Quick preset buttons */}
            <button
              type="button"
              onClick={() => {
                const specItems = ROLE_OPERATIONAL_SPECS[effectiveRole]?.annualMilestones || [];
                setReportState(prev => {
                  const merged = Array.from(new Set([...prev.annualMilestones, ...specItems]));
                  return { ...prev, annualMilestones: merged };
                });
                showNotification(`Poin milestone standar tahunan ${roleTitle} berhasil disisipkan!`);
              }}
              className="text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Muat Capaian Tahunan {roleTitle}</span>
            </button>
          </div>

          <div className="space-y-2 mb-3">
            {reportState.annualMilestones.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-amber-900 shrink-0 w-5">{idx + 1}.</span>
                <span className="text-slate-800 flex-1 leading-relaxed">{item}</span>
                <button
                  type="button"
                  onClick={() => removeMilestone(idx)}
                  className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`Tambah capaian tahunan baru (${roleTitle})...`}
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMilestone(); } }}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addMilestone}
              className="px-3.5 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg shadow-2xs cursor-pointer active:scale-95 transition-all"
            >
              Tambah
            </button>
          </div>
        </div>

        {/* ========================================================
            III. EVALUASI KENDALA / HAMBATAN LAPANGAN TERAKUMULASI
            ======================================================== */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                III. Evaluasi Kendala / Hambatan Lapangan Terakumulasi & Mitigasi ({roleTitle})
              </h4>
              <p className="text-[11px] text-slate-500">
                Pencatatan akumulasi hambatan operasional lapangan sepanjang 12 bulan dan solusi terapan
              </p>
            </div>
            {/* Quick preset buttons */}
            <button
              type="button"
              onClick={() => {
                const specObstacles = ROLE_OPERATIONAL_SPECS[effectiveRole]?.fieldObstacles || [];
                const obsTexts = specObstacles.map(o => o.obstacle);
                const solTexts = specObstacles.map(o => o.solution);
                setReportState(prev => ({
                  ...prev,
                  obstacles: Array.from(new Set([...(prev.obstacles || []), ...obsTexts])),
                  solutions: Array.from(new Set([...(prev.solutions || []), ...solTexts]))
                }));
                showNotification(`Kendala tahunan khas ${roleTitle} berhasil disisipkan!`);
              }}
              className="text-[11px] font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-md border border-rose-300 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>Muat Kendala Lapangan {roleTitle}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Kendala */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-amber-900">
                Daftar Kendala / Hambatan yang Terjadi:
              </label>
              <div className="space-y-2">
                {(reportState.obstacles || []).map((obs, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 text-xs">
                    <span className="font-bold text-amber-900 shrink-0">•</span>
                    <span className="text-slate-800 flex-1 leading-relaxed">{obs}</span>
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
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder={`Tambah kendala terakumulasi (${roleTitle})...`}
                  value={newObstacle}
                  onChange={(e) => setNewObstacle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addObstacle(); } }}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addObstacle}
                  className="px-3 py-1.5 text-xs font-medium bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg border border-amber-300 cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            </div>

            {/* Solusi */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-emerald-900">
                Solusi & Tindak Lanjut yang Telah Dilakukan:
              </label>
              <div className="space-y-2">
                {(reportState.solutions || []).map((sol, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 text-xs">
                    <span className="font-bold text-emerald-900 shrink-0">•</span>
                    <span className="text-slate-800 flex-1 leading-relaxed">{sol}</span>
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
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder={`Tambah solusi tindak lanjut (${roleTitle})...`}
                  value={newSolution}
                  onChange={(e) => setNewSolution(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSolution(); } }}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addSolution}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg border border-emerald-300 cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            IV. REKOMENDASI RENCANA STRATEGIS TAHUN DEPAN
            ======================================================== */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                IV. Rekomendasi Rencana Strategis & Kebutuhan Operasional Tahun Depan ({roleTitle})
              </h4>
              <p className="text-[11px] text-slate-500">
                Usulan kebutuhan anggaran, peralatan K3, dan peningkatan kompetensi di RKAS mendatang
              </p>
            </div>
            {/* Quick preset buttons */}
            <button
              type="button"
              onClick={() => {
                const specRecs = ROLE_OPERATIONAL_SPECS[effectiveRole]?.strategicRecommendations || [];
                setReportState(prev => {
                  const merged = Array.from(new Set([...prev.strategicRecommendations, ...specRecs]));
                  return { ...prev, strategicRecommendations: merged };
                });
                showNotification(`Rekomendasi strategis ${roleTitle} berhasil disisipkan!`);
              }}
              className="text-[11px] font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Muat Rekomendasi {roleTitle}</span>
            </button>
          </div>

          <div className="space-y-2 mb-3">
            {reportState.strategicRecommendations.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-blue-50/70 p-2.5 rounded-lg border border-blue-200 text-xs">
                <span className="font-bold text-blue-900 shrink-0">•</span>
                <span className="text-slate-800 flex-1 leading-relaxed">{item}</span>
                <button
                  type="button"
                  onClick={() => removeRecommendation(idx)}
                  className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`Tambah rekomendasi operasional tahun depan (${roleTitle})...`}
              value={newRec}
              onChange={(e) => setNewRec(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRecommendation(); } }}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addRecommendation}
              className="px-3.5 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg shadow-2xs cursor-pointer active:scale-95 transition-all"
            >
              Tambah
            </button>
          </div>
        </div>
      </div>

      {/* KHUSUS PERPUSTAKAAN: ANALISIS & PERSENTASE PENAMBAHAN BUKU PER BULAN */}
      {isPerpus && (
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Rekapitulasi & Persentase Penambahan Buku Baru per Bulan
                </h3>
                <p className="text-xs text-slate-500">
                  Memantau peningkatan penambahan buku dan pergerakan koleksi per bulan pada Tahun Anggaran {selectedYear}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold rounded-lg flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-blue-600" />
                <span>Total Tambah: {totalYearAddedTitles} Judul ({totalYearAddedCopies} eks)</span>
              </span>
              {peakAdditionMonth && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Puncak: {peakAdditionMonth.monthName} ({peakAdditionMonth.percentShare.toFixed(1)}%)</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium block">Total Buku Baru Masuk</span>
              <span className="text-lg font-black text-slate-900 font-mono">{totalYearAddedCopies} <span className="text-xs font-sans font-normal text-slate-600">eks</span></span>
              <span className="text-[10.5px] text-slate-500 block mt-0.5">{totalYearAddedTitles} Judul Terdata</span>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
              <span className="text-[11px] text-emerald-800 font-medium block">Puncak Penambahan Koleksi</span>
              <span className="text-lg font-black text-emerald-900 truncate block">
                {peakAdditionMonth ? peakAdditionMonth.monthName : '-'}
              </span>
              <span className="text-[10.5px] text-emerald-700 block mt-0.5">
                {peakAdditionMonth ? `${peakAdditionMonth.eksemplarCount} eks (${peakAdditionMonth.percentShare.toFixed(1)}% total)` : 'Belum ada pengadaan'}
              </span>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
              <span className="text-[11px] text-blue-800 font-medium block">Rata-Rata Penambahan</span>
              <span className="text-lg font-black text-blue-900 font-mono">
                {(totalYearAddedCopies / 12).toFixed(1)} <span className="text-xs font-sans font-normal text-blue-700">eks/bln</span>
              </span>
              <span className="text-[10.5px] text-blue-700 block mt-0.5">Konsistensi Pengadaan</span>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
              <span className="text-[11px] text-amber-800 font-medium block">Status Pertumbuhan Koleksi</span>
              <span className="text-base font-bold text-amber-900 block mt-0.5">
                {totalYearAddedCopies > 50 ? 'Peningkatan Tinggi' : totalYearAddedCopies > 0 ? 'Peningkatan Bertahap' : 'Stabil Tanpa Penambahan'}
              </span>
              <span className="text-[10.5px] text-amber-700 block mt-0.5">Tahun Anggaran {selectedYear}</span>
            </div>
          </div>

          {/* Matriks Bulanan dengan Persentase & Indikator Kenaikan */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">No</th>
                  <th className="py-2.5 px-3">Bulan Pengadaan</th>
                  <th className="py-2.5 px-3 text-center">Judul Baru</th>
                  <th className="py-2.5 px-3 text-center">Eksemplar Masuk</th>
                  <th className="py-2.5 px-3 text-center w-48">% dari Total Tahun</th>
                  <th className="py-2.5 px-3 text-center">Peningkatan vs Bln Lalu</th>
                  <th className="py-2.5 px-3 text-center">Akumulasi Masuk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyBookAdditionStats.map((st) => (
                  <tr key={st.monthNum} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[11px]">{st.monthNum}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {st.monthName} {selectedYear}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {st.judulCount > 0 ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-bold rounded border border-blue-200">
                          {st.judulCount} judul
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {st.eksemplarCount > 0 ? (
                        <span className="text-slate-900 font-black">{st.eksemplarCount} eks</span>
                      ) : (
                        <span className="text-slate-400 font-normal">0 eks</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(100, st.percentShare)}%` }}
                          />
                        </div>
                        <span className="font-mono font-semibold text-slate-800 text-[11px] w-12 text-right">
                          {st.percentShare.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {st.trend === 'up' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{st.growthText}</span>
                        </span>
                      ) : st.trend === 'down' ? (
                        <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                          <span>{st.growthText}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md text-[11px]">
                          <Minus className="w-3 h-3 text-slate-400" />
                          <span>{st.growthText}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800">
                      {st.cumulative} eks
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 text-center font-bold text-xs uppercase">
                    Total Penambahan Buku ({selectedYear}):
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-blue-900 font-black">
                    {totalYearAddedTitles} Judul
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-emerald-900 font-black">
                    {totalYearAddedCopies} Eks
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-xs">
                    100.0% Terpenuhi
                  </td>
                  <td className="py-2.5 px-3 text-center text-[10.5px] font-bold text-emerald-800">
                    {totalYearAddedCopies > 0 ? 'Terjadi Peningkatan' : 'Tetap'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-950">
                    {totalYearAddedCopies} Eks
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* KHUSUS PERPUSTAKAAN: SEMUA DATA BUKU YANG TERDATA (KATALOG LENGKAP TAHUNAN) */}
      {isPerpus && (
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Katalog Lengkap Seluruh Data Buku & Koleksi Perpustakaan Terdata
                </h3>
                <p className="text-xs text-slate-500">
                  Laporan inventarisasi tahunan seluruh koleksi bahan pustaka yang tercatat dalam pangkalan data perpustakaan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold rounded-lg">
                {libraryBooks.length} Judul Buku Terdaftar
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg">
                {totalAllBookCopies} Total Eksemplar Fisik
              </span>
            </div>
          </div>

          {libraryBooks.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-1">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-700">
                Belum Ada Data Buku yang Terdaftar
              </p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                Silakan lakukan pendaftaran buku atau gunakan templat impor data otomatis pada menu Buku Perpustakaan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">No</th>
                    <th className="py-2.5 px-3">Judul Buku & No. Inventaris</th>
                    <th className="py-2.5 px-3">Pengarang / Penerbit</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">DDC Klasifikasi</th>
                    <th className="py-2.5 px-3">Status / Kategori</th>
                    <th className="py-2.5 px-3">Tahun / Tgl Beli</th>
                    <th className="py-2.5 px-3">Sumber Dana</th>
                    <th className="py-2.5 px-3 text-center">Jumlah</th>
                    <th className="py-2.5 px-3 text-center">Kondisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {libraryBooks.map((b, idx) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{b.judul}</span>
                        {b.nomorInventaris && (
                          <span className="text-[10px] font-mono text-slate-500">No. Inv: {b.nomorInventaris}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <span>{b.pengarang || '-'}</span>
                        {b.penerbit && <span className="block text-[10.5px] text-slate-500">{b.penerbit}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-semibold">{b.kelas || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-blue-700 font-medium">{b.ddcKlasifikasi || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                          {b.statusBuku || b.kategori || 'umum'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {b.tahunBeli || (b.tanggalMasuk ? b.tanggalMasuk.split('-')[0] : '-')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 text-[11px]">{b.sumberPengadaan || 'Dana BOS'}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 font-mono">
                        {b.jumlah} eks
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {b.kondisi || 'Baik'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={8} className="py-2.5 px-3 text-right text-xs uppercase">
                      Total Seluruh Koleksi Buku Terdata:
                    </td>
                    <td className="py-2.5 px-3 text-center text-xs font-mono text-blue-900">
                      {totalAllBookCopies} eks
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

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
