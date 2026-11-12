import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KopSurat } from '../common/KopSurat';
import { OfficialApprovalSheet } from '../common/OfficialApprovalSheet';
import { InventoryTable } from '../common/InventoryTable';
import { MonthlyReport, AnnualReport, RoleType } from '../../types';
import { exportElementToPdf } from '../../utils/pdfExport';
import { generateOfficialDocumentHtml } from '../../utils/htmlExport';
import { generateOfficialDocumentWord, downloadWordBlob } from '../../utils/wordExport';
import { createOfficialDocumentDocx, downloadDocxFile } from '../../utils/docxExport';
import { 
  isTaskInMonth, 
  isTaskInYear, 
  getTaskClassification, 
  OFFICIAL_TUPOKSI_DEFINITIONS 
} from '../../utils/taskClassification';
import { calculateAnnualPerformanceSummary } from '../../utils/annualPerformanceHelper';
import { formatOfficialNameWithDegree } from '../../utils/formatters';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Check, 
  Settings2,
  FileCheck2,
  Loader2,
  Eye,
  Smartphone,
  Monitor,
  Archive,
  Target,
  BookmarkCheck,
  BookOpen,
  Users,
  Edit3,
  Hash,
  X,
  Sparkles
} from 'lucide-react';
import { initialSchoolConfig } from '../../data/initialData';
import { ROLE_OPERATIONAL_SPECS } from '../../data/roleOperationalSpecs';

interface PrintDocumentViewProps {
  reportType: 'monthly' | 'annual';
  reportData: MonthlyReport | AnnualReport;
  onBack: () => void;
  autoPrint?: boolean;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const PrintDocumentView: React.FC<PrintDocumentViewProps> = ({
  reportType,
  reportData,
  onBack,
  autoPrint = false
}) => {
  const { 
    schoolConfig, 
    currentRole, 
    tasks, 
    inventories, 
    archiveReport, 
    tupoksiDefinitions,
    libraryBooks,
    libraryMembers,
    libraryMemberStats
  } = useApp();
  const printableRef = useRef<HTMLDivElement>(null);

  const role: RoleType = reportData.role || currentRole || 'TU';
  const roleTitle = 
    role === 'TU' ? 'Tata Usaha' : 
    role === 'PENJAGA' ? 'Penjaga Sekolah' : 
    role === 'SERVICE' ? 'Layanan Kebersihan (Service)' :
    role === 'PERPUS' ? 'Layanan Perpustakaan' : 'Laboratorium IPA';
  const operator = schoolConfig.operatorProfiles?.[role] || initialSchoolConfig.operatorProfiles[role] || {
    nama: '',
    nip: '',
    jabatan: roleTitle,
    signatureType: 'script' as const
  };

  const isDefaultOrDummyKepsek = !schoolConfig.kepalaSekolah?.nama || 
    /rahmat(\s*hidayat)?/i.test(schoolConfig.kepalaSekolah.nama) || 
    schoolConfig.kepalaSekolah.nama.trim() === '';
  
  const displayKepsekNama = isDefaultOrDummyKepsek 
    ? '( .................................................. )' 
    : formatOfficialNameWithDegree(schoolConfig.kepalaSekolah.nama);

  const displayKepsekNip = isDefaultOrDummyKepsek || !schoolConfig.kepalaSekolah?.nip || /19740510\s*199802\s*1\s*003/.test(schoolConfig.kepalaSekolah.nip)
    ? (schoolConfig.kepalaSekolah?.nip && !/19740510\s*199802\s*1\s*003/.test(schoolConfig.kepalaSekolah.nip) ? schoolConfig.kepalaSekolah.nip : 'NIP. .................................................')
    : (schoolConfig.kepalaSekolah.nip.startsWith('NIP') ? schoolConfig.kepalaSekolah.nip : `NIP. ${schoolConfig.kepalaSekolah.nip}`);

  const isDefaultOrDummyOperator = !operator?.nama || 
    /nurul(\s*hidayat|\s*hidayati)?/i.test(operator.nama) || 
    /rahmat(\s*hidayat)?/i.test(operator.nama) ||
    operator.nama.trim() === '';

  const displayOperatorNama = isDefaultOrDummyOperator 
    ? '( .................................................. )' 
    : formatOfficialNameWithDegree(operator.nama);

  const displayOperatorNip = isDefaultOrDummyOperator || !operator?.nip || /19920815\s*202321\s*2\s*024/.test(operator.nip)
    ? (operator?.nip && !/19920815\s*202321\s*2\s*024/.test(operator.nip) ? operator.nip : 'NIP / NIPPK. .................................................')
    : (operator.nip.startsWith('NIP') ? operator.nip : `NIP / NIPPK. ${operator.nip}`);

  const isMonthly = reportType === 'monthly';
  const monthlyData = isMonthly ? (reportData as MonthlyReport) : null;
  const annualData = !isMonthly ? (reportData as AnnualReport) : null;

  const placeName = [schoolConfig.kabupatenKota, schoolConfig.desaKecamatan].filter(Boolean)[0] || '';
  const defaultDateStr = isMonthly && monthlyData 
    ? `${MONTH_NAMES[monthlyData.month - 1]} ${monthlyData.year}`
    : `31 Desember ${annualData?.year || 2026}`;
  const [manualDate, setManualDate] = useState<string>(
    reportData.manualDocDate || `${placeName ? `${placeName}, ` : ''}${defaultDateStr}`
  );

  const [nomorSurat, setNomorSurat] = useState<string>(
    reportData.nomorSurat || `800/${isMonthly ? `LAP-BLN/${monthlyData?.month || 9}` : 'LAP-THN'}/${schoolConfig.npsn || '20202819'}/${new Date().getFullYear()}`
  );
  const [isEditNomorModalOpen, setIsEditNomorModalOpen] = useState(false);
  const [tempNomorSurat, setTempNomorSurat] = useState<string>(nomorSurat);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [archivedSuccess, setArchivedSuccess] = useState<string | null>(null);
  const [mobileFitScale, setMobileFitScale] = useState(false);
  const [printLayoutMode, setPrintLayoutMode] = useState<'compact' | 'segmented'>('compact');
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);

  // Relevant tasks for this report using robust string date parsing
  const relevantTasks = tasks.filter(t => {
    if (!t.role || t.role.trim().toUpperCase() !== role.trim().toUpperCase()) return false;
    if (isMonthly && monthlyData) {
      return isTaskInMonth(t.date, monthlyData.month, monthlyData.year);
    }
    if (!isMonthly && annualData) {
      return isTaskInYear(t.date, annualData.year);
    }
    return true;
  });

  const tupoksiTasks = relevantTasks.filter(t => getTaskClassification(role, t.category, t.taskType) === 'pokok');
  const tambahanTasks = relevantTasks.filter(t => getTaskClassification(role, t.category, t.taskType) === 'tambahan');
  const tupoksiCompleted = tupoksiTasks.filter(t => t.status === 'selesai');
  const tambahanCompleted = tambahanTasks.filter(t => t.status === 'selesai');
  const completedCount = relevantTasks.filter(t => t.status === 'selesai').length;

  const roleTupoksiList = tupoksiDefinitions[role]?.tupoksiList || OFFICIAL_TUPOKSI_DEFINITIONS[role].tupoksiList;
  const roleTambahanList = tupoksiDefinitions[role]?.tugasTambahanList || OFFICIAL_TUPOKSI_DEFINITIONS[role].tugasTambahanList;

  // Annual 12-Month Performance Recap (Tugas Pokok & Tugas Tambahan)
  const annualPerformance = useMemo(() => {
    const yr = annualData?.year || 2026;
    return calculateAnnualPerformanceSummary(tasks, role, yr);
  }, [tasks, role, annualData?.year]);

  // Khusus Perpustakaan
  const isPerpus = role === 'PERPUS';
  const registeredGuruLaki = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'GURU' && m.jenisKelamin === 'L').length;
  const registeredGuruPerempuan = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'GURU' && m.jenisKelamin === 'P').length;
  const registeredStaffLaki = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'STAFF' && m.jenisKelamin === 'L').length;
  const registeredStaffPerempuan = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'STAFF' && m.jenisKelamin === 'P').length;
  const registeredSiswaLaki = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'SISWA' && m.jenisKelamin === 'L' && m.status !== 'tamat' && m.status !== 'alumni').length;
  const registeredSiswaPerempuan = libraryMembers.filter(m => String(m.tipeAnggota).toUpperCase() === 'SISWA' && m.jenisKelamin === 'P' && m.status !== 'tamat' && m.status !== 'alumni').length;

  const guruLaki = (registeredGuruLaki + registeredGuruPerempuan > 0) ? registeredGuruLaki : (libraryMemberStats?.guruLaki ?? 10);
  const guruPerempuan = (registeredGuruLaki + registeredGuruPerempuan > 0) ? registeredGuruPerempuan : (libraryMemberStats?.guruPerempuan ?? 14);
  const totalGuru = (libraryMemberStats?.guruPendidik && libraryMemberStats.guruPendidik > 0 && registeredGuruLaki + registeredGuruPerempuan === 0)
    ? libraryMemberStats.guruPendidik
    : (guruLaki + guruPerempuan);

  const staffLaki = (registeredStaffLaki + registeredStaffPerempuan > 0) ? registeredStaffLaki : (libraryMemberStats?.staffLaki ?? 5);
  const staffPerempuan = (registeredStaffLaki + registeredStaffPerempuan > 0) ? registeredStaffPerempuan : (libraryMemberStats?.staffPerempuan ?? 3);
  const totalStaff = (libraryMemberStats?.staffTendik && libraryMemberStats.staffTendik > 0 && registeredStaffLaki + registeredStaffPerempuan === 0)
    ? libraryMemberStats.staffTendik
    : (staffLaki + staffPerempuan);

  const siswaLaki = (libraryMemberStats?.siswaLaki && libraryMemberStats.siswaLaki > 0) ? libraryMemberStats.siswaLaki : (registeredSiswaLaki > 0 ? registeredSiswaLaki : 142);
  const siswaPerempuan = (libraryMemberStats?.siswaPerempuan && libraryMemberStats.siswaPerempuan > 0) ? libraryMemberStats.siswaPerempuan : (registeredSiswaPerempuan > 0 ? registeredSiswaPerempuan : 158);
  const totalSiswa = siswaLaki + siswaPerempuan;
  const totalAnggotaPerpus = totalGuru + totalStaff + totalSiswa;

  const printKpis = (isMonthly && monthlyData?.customKPIs && monthlyData.customKPIs.length > 0)
    ? monthlyData.customKPIs
    : (ROLE_OPERATIONAL_SPECS[role]?.operationalKPIs || []);

  // Helper to extract year and month from book date fields
  const parseBookDateParts = (book: any, defaultYear: number) => {
    if (book.tanggalMasuk) {
      const raw = String(book.tanggalMasuk).trim();
      const isoMatch = raw.match(/^(\d{4})[-/.](\d{1,2})/);
      if (isoMatch) {
        return { year: parseInt(isoMatch[1], 10), month: parseInt(isoMatch[2], 10) };
      }
      const dmyMatch = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (dmyMatch) {
        return { year: parseInt(dmyMatch[3], 10), month: parseInt(dmyMatch[2], 10) };
      }
    }
    if (book.bulanPengadaan) {
      const rawBp = String(book.bulanPengadaan).trim();
      const bpMatch = rawBp.match(/^(\d{4})[-/.](\d{1,2})/);
      if (bpMatch) {
        return { year: parseInt(bpMatch[1], 10), month: parseInt(bpMatch[2], 10) };
      }
      const num = parseInt(rawBp, 10);
      if (!isNaN(num) && num >= 1 && num <= 12) {
        const yr = parseInt(String(book.tahunPengadaan || book.tahunBeli || book.tahunTerbit), 10) || defaultYear;
        return { year: yr, month: num };
      }
    }
    const y = parseInt(String(book.tahunPengadaan || book.tahunBeli || book.tahunTerbit), 10);
    if (!isNaN(y)) {
      return { year: y, month: 1 };
    }
    return null;
  };

  const monthlyNewBooks = useMemo(() => {
    if (!isPerpus || !isMonthly || !monthlyData) return [];
    const targetYear = monthlyData.year;
    const targetMonth = monthlyData.month;
    return libraryBooks.filter(book => {
      const parts = parseBookDateParts(book, targetYear);
      if (!parts) return false;
      return parts.year === targetYear && parts.month === targetMonth;
    });
  }, [libraryBooks, isPerpus, isMonthly, monthlyData]);

  const totalNewCopies = useMemo(() => {
    return monthlyNewBooks.reduce((sum, b) => sum + (Number(b.jumlah) || 1), 0);
  }, [monthlyNewBooks]);

  const totalAllBookCopies = useMemo(() => {
    return libraryBooks.reduce((sum, b) => sum + (Number(b.jumlah) || 1), 0);
  }, [libraryBooks]);

  const annualYear = annualData?.year || (monthlyData?.year ?? new Date().getFullYear());

  const annualMonthlyBookStats = useMemo(() => {
    if (!isPerpus) return [];
    
    const monthlyList = MONTH_NAMES.map((name, idx) => {
      const monthNum = idx + 1;
      
      const booksInMonth = libraryBooks.filter(book => {
        const parts = parseBookDateParts(book, annualYear);
        if (!parts) return false;
        return parts.year === annualYear && parts.month === monthNum;
      });

      const judulCount = booksInMonth.length;
      const eksemplarCount = booksInMonth.reduce((sum, b) => sum + (Number(b.jumlah) || 1), 0);

      return {
        monthNum,
        monthName: name,
        judulCount,
        eksemplarCount,
        books: booksInMonth
      };
    });

    const totalYearCopies = monthlyList.reduce((sum, m) => sum + m.eksemplarCount, 0);

    let cumulative = 0;
    return monthlyList.map((m, idx) => {
      cumulative += m.eksemplarCount;
      const prevCopies = idx > 0 ? monthlyList[idx - 1].eksemplarCount : 0;
      const percentShare = totalYearCopies > 0 ? (m.eksemplarCount / totalYearCopies) * 100 : 0;
      
      let growthText = '-';
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
          growthText = '+100%';
          trend = 'up';
        } else if (prevCopies > 0 && m.eksemplarCount > 0) {
          const diff = ((m.eksemplarCount - prevCopies) / prevCopies) * 100;
          growthText = diff > 0 ? `+${diff.toFixed(1)}%` : diff < 0 ? `${diff.toFixed(1)}%` : '0%';
          trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same';
        } else if (prevCopies > 0 && m.eksemplarCount === 0) {
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
        growthText,
        trend,
        cumulative,
        totalYearCopies
      };
    });
  }, [libraryBooks, annualYear, isPerpus]);

  // Group books by Class and aggregate copies per subject for the Annual Report
  const annualClassGroupedBooks = useMemo(() => {
    if (!isPerpus) return [];

    const classBuckets = [
      { id: 'Kelas VII', label: 'Kelas VII' },
      { id: 'Kelas VIII', label: 'Kelas VIII' },
      { id: 'Kelas IX', label: 'Kelas IX' },
      { id: 'Kelas VII-IX (Umum)', label: 'Kelas VII - IX (Umum / Bersama)' },
      { id: 'Guru / Pendidik', label: 'Pegangan Guru / Pendidik' },
      { id: 'Umum / Referensi', label: 'Referensi, Kamus & Fiksi / Umum' },
    ];

    const results = classBuckets.map(bucket => {
      const booksInClass = libraryBooks.filter(book => {
        const rawKelas = (book.kelas || '').trim().toLowerCase();
        const rawJudul = (book.judul || '').trim().toLowerCase();

        if (bucket.id === 'Kelas VII') {
          return rawKelas === 'kelas vii' || rawKelas === 'vii' || rawKelas === '7' ||
            (/\b(kelas\s*vii|kelas\s*7)\b/i.test(rawJudul) && !/viii|8|ix|9/i.test(rawJudul));
        }
        if (bucket.id === 'Kelas VIII') {
          return rawKelas === 'kelas viii' || rawKelas === 'viii' || rawKelas === '8' ||
            (/\b(kelas\s*viii|kelas\s*8)\b/i.test(rawJudul) && !/vii\b|7\b|ix|9/i.test(rawJudul));
        }
        if (bucket.id === 'Kelas IX') {
          return rawKelas === 'kelas ix' || rawKelas === 'ix' || rawKelas === '9' ||
            (/\b(kelas\s*ix|kelas\s*9)\b/i.test(rawJudul) && !/vii\b|7\b|viii|8/i.test(rawJudul));
        }
        if (bucket.id === 'Kelas VII-IX (Umum)') {
          return rawKelas.includes('vii-ix') || rawKelas.includes('7-9') || rawKelas.includes('semua kelas') ||
            rawJudul.includes('vii-ix') || rawJudul.includes('kelas vii, viii, ix');
        }
        if (bucket.id === 'Guru / Pendidik') {
          return rawKelas.includes('guru') || rawKelas.includes('pendidik') || rawJudul.includes('guru');
        }
        // Umum / Referensi
        const is7 = rawKelas === 'kelas vii' || rawKelas === 'vii' || rawKelas === '7' || /\b(kelas\s*vii|kelas\s*7)\b/i.test(rawJudul);
        const is8 = rawKelas === 'kelas viii' || rawKelas === 'viii' || rawKelas === '8' || /\b(kelas\s*viii|kelas\s*8)\b/i.test(rawJudul);
        const is9 = rawKelas === 'kelas ix' || rawKelas === 'ix' || rawKelas === '9' || /\b(kelas\s*ix|kelas\s*9)\b/i.test(rawJudul);
        const is79 = rawKelas.includes('vii-ix') || rawKelas.includes('7-9');
        const isGuru = rawKelas.includes('guru') || rawKelas.includes('pendidik');
        return !is7 && !is8 && !is9 && !is79 && !isGuru;
      });

      // Group by subject/title within this class
      const subjectMap = new Map<string, {
        judul: string;
        pengarang: string;
        kategori: string;
        ddc: string;
        totalEksemplar: number;
      }>();

      booksInClass.forEach(b => {
        const key = b.judul.trim().toLowerCase();
        const existing = subjectMap.get(key);
        const qty = Number(b.jumlah) || 1;
        if (existing) {
          existing.totalEksemplar += qty;
        } else {
          subjectMap.set(key, {
            judul: b.judul,
            pengarang: b.pengarang || b.penulis || '-',
            kategori: b.statusBuku || b.kategoriBuku || b.kategori || 'Buku Teks',
            ddc: b.ddcKlasifikasi || b.ddc || '-',
            totalEksemplar: qty
          });
        }
      });

      const subjects = Array.from(subjectMap.values());
      const classCopies = subjects.reduce((sum, s) => sum + s.totalEksemplar, 0);

      return {
        ...bucket,
        subjects,
        totalJudul: subjects.length,
        totalCopies: classCopies
      };
    }).filter(bucket => bucket.subjects.length > 0);

    return results;
  }, [libraryBooks, isPerpus]);

  // 1. Direct PDF Generation & Download (Supporting OKLCH & Tailwind CSS v4)
  const handleSavePdf = async () => {
    if (!printableRef.current) return;
    setIsGeneratingPdf(true);
    setDownloadSuccess(null);
    setPdfProgress('Menyiapkan tata letak...');

    try {
      const fileName = `${isMonthly ? 'Laporan_Bulanan' : 'Laporan_Tahunan'}_${role}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      await exportElementToPdf(printableRef.current, {
        fileName,
        margin: [10, 10, 10, 10], // 10mm margins for A4
        scale: 2,
        quality: 0.98,
        onProgress: (msg) => setPdfProgress(msg)
      });

      setDownloadSuccess('File PDF berhasil disimpan dan diunduh!');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error('PDF export error:', err);
      // Fallback: trigger standard print dialog
      window.print();
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress('');
    }
  };

  // 2. Standard Browser Print
  const handlePrint = () => {
    window.print();
  };

  // 3. Download Self-Contained Standard HTML Document with Embedded CSS
  const handleDownloadHtml = () => {
    try {
      const fullHtml = generateOfficialDocumentHtml({
        reportType,
        reportData,
        schoolConfig,
        tasks: tasks.filter(t => t.role && t.role.trim().toUpperCase() === role.trim().toUpperCase()),
        inventories: inventories.filter(i => i.role && i.role.trim().toUpperCase() === role.trim().toUpperCase()),
        tupoksiDefinitions,
        manualDate,
        nomorSurat,
        libraryBooks: role === 'PERPUS' ? libraryBooks : [],
        libraryMemberStats: role === 'PERPUS' ? libraryMemberStats : undefined
      });

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${isMonthly ? 'Laporan_Bulanan' : 'Laporan_Tahunan'}_${role}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess('Dokumen HTML resmi (Standar A4) berhasil diunduh!');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Download HTML error:', err);
    }
  };

  // 3b. Download Official Microsoft Word (.doc) Document
  const handleDownloadWord = () => {
    try {
      const docHtml = generateOfficialDocumentWord({
        reportType,
        reportData,
        schoolConfig,
        tasks: tasks.filter(t => t.role && t.role.trim().toUpperCase() === role.trim().toUpperCase()),
        inventories: inventories.filter(i => i.role && i.role.trim().toUpperCase() === role.trim().toUpperCase()),
        tupoksiDefinitions,
        manualDate,
        nomorSurat,
        libraryBooks: role === 'PERPUS' ? libraryBooks : [],
        libraryMemberStats: role === 'PERPUS' ? libraryMemberStats : undefined
      });

      const filename = `${isMonthly ? 'Laporan_Bulanan' : 'Laporan_Tahunan'}_${role}_${new Date().toISOString().split('T')[0]}.doc`;
      downloadWordBlob(docHtml, filename);

      setDownloadSuccess('Dokumen resmi Microsoft Word (.doc) berhasil diunduh!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error('Download Word error:', err);
    }
  };

  // 3c. Download Native Microsoft Word (.docx) Document
  const handleDownloadDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      const doc = createOfficialDocumentDocx({
        reportType,
        reportData,
        schoolConfig,
        tasks: tasks.filter(t => t.role && t.role.trim().toUpperCase() === role.trim().toUpperCase()),
        inventories: inventories.filter(i => i.role && i.role.trim().toUpperCase() === role.trim().toUpperCase()),
        tupoksiDefinitions,
        manualDate,
        nomorSurat,
        libraryBooks: role === 'PERPUS' ? libraryBooks : [],
        libraryMemberStats: role === 'PERPUS' ? libraryMemberStats : undefined
      });

      const filename = `${isMonthly ? 'Laporan_Bulanan' : 'Laporan_Tahunan'}_${role}_${new Date().toISOString().split('T')[0]}.docx`;
      await downloadDocxFile(doc, filename);

      setDownloadSuccess('Dokumen asli Microsoft Word (.docx) berstandar resmi (A4, 3-4-3-3 cm) berhasil diunduh!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error('Download DOCX error:', err);
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  // 4. Archive Document into Audit Repository
  const handleArchive = () => {
    const doc = archiveReport(reportType, reportData);
    setArchivedSuccess(`Dokumen berhasil diarsipkan ke Halaman Arsip Pemeriksaan (No. Reg: ${doc.regNumber})`);
    setTimeout(() => setArchivedSuccess(null), 5000);
  };

  // Auto trigger direct print if requested from caller
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  // Keyboard shortcut Ctrl+P / Cmd+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-4 pb-12">
      {/* Floating Control Toolbar (Hidden in Print & Export) */}
      <div className="no-print bg-slate-900 text-white p-3.5 sm:p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sticky top-2 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-semibold rounded-lg transition-colors border border-slate-700 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Cetak & Unduh Dokumen Kedinasan Resmi</span>
            </h2>
            <p className="text-[10.5px] text-slate-400 truncate hidden xs:block">
              Format A4 Standard dengan Kop Surat 3 Kolom & Lembar Pengesahan
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nomor Surat Editor Box */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 w-full xs:w-auto">
            <Hash className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] text-slate-400 shrink-0">No:</span>
            <input
              type="text"
              value={nomorSurat}
              onChange={(e) => {
                setNomorSurat(e.target.value);
                if (reportData) reportData.nomorSurat = e.target.value;
              }}
              className="bg-transparent text-xs text-white font-mono font-medium focus:outline-hidden w-full xs:w-44 sm:w-52"
              placeholder="Nomor Surat Kedinasan..."
            />
            <button
              type="button"
              onClick={() => {
                setTempNomorSurat(nomorSurat);
                setIsEditNomorModalOpen(true);
              }}
              className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-1.5 py-0.5 rounded cursor-pointer shrink-0 transition-colors"
              title="Buka pilihan format & edit nomor surat lengkap"
            >
              Format
            </button>
          </div>

          {/* Tanggal Manual Input */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 w-full xs:w-auto">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[10px] text-slate-400 shrink-0">Tgl:</span>
            <input
              type="text"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-hidden w-full xs:w-40 sm:w-48"
              placeholder="Tempat, Tanggal Dokumen..."
            />
          </div>

          {/* CETAK LANGSUNG (PRINT) */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg transition-all shadow-md cursor-pointer ring-2 ring-emerald-400/40"
            title="Cetak langsung dokumen resmi sekarang (Ctrl + P)"
          >
            <Printer className="w-4 h-4 text-emerald-100 animate-pulse" />
            <span>Cetak Langsung (Ctrl + P)</span>
          </button>

          {/* SIMPAN PDF (Direct PDF Export) */}
          <button
            type="button"
            onClick={handleSavePdf}
            disabled={isGeneratingPdf}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50"
            title="Download langsung berkas PDF A4 sempurna"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{pdfProgress || 'Memproses PDF...'}</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-3.5 h-3.5 text-rose-200" />
                <span>Simpan PDF</span>
              </>
            )}
          </button>

          {/* UNDUH WORD NATIVE (.DOCX) - RESMI */}
          <button
            type="button"
            onClick={handleDownloadDocx}
            disabled={isGeneratingDocx}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg transition-all shadow-md border border-blue-400 cursor-pointer disabled:opacity-50"
            title="Download berkas asli Microsoft Word (.docx) dengan margin 3-4-3-3 cm, Times New Roman, dan spasi 1.15"
          >
            {isGeneratingDocx ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Membuat...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Unduh (.docx)</span>
              </>
            )}
          </button>

          {/* UNDUH WORD (.DOC) */}
          <button
            type="button"
            onClick={handleDownloadWord}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg transition-all border border-slate-600 cursor-pointer"
            title="Download berkas Microsoft Word (.doc) alternatif"
          >
            <FileText className="w-3.5 h-3.5 text-blue-300" />
            <span>Unduh (.doc)</span>
          </button>

          {/* UNDUH HTML */}
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg transition-colors border border-slate-700 cursor-pointer"
            title="Download berkas HTML mandiri berstandar resmi"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh HTML</span>
          </button>

          {/* ARSIPKAN DOKUMEN (AUDIT READY) */}
          <button
            type="button"
            onClick={handleArchive}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-lg transition-all shadow-md cursor-pointer"
            title="Simpan dokumen ke Lemari Arsip Pemeriksaan / Audit"
          >
            <Archive className="w-3.5 h-3.5 text-amber-200" />
            <span>Arsipkan</span>
          </button>
        </div>
      </div>

      {/* Notice Message if any */}
      {downloadSuccess && (
        <div className="no-print bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {archivedSuccess && (
        <div className="no-print bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Archive className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{archivedSuccess}</span>
        </div>
      )}

      {/* Helper Bar: Pilihan Mode Cetak (Padat & Terisi Penuh vs Per Lembar Terpisah) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2.5 p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-800 flex items-center gap-1">
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Format Cetak Langsung:</span>
          </span>
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setPrintLayoutMode('compact')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-black transition-all cursor-pointer ${
                printLayoutMode === 'compact'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Mode Cetak Padat: Seluruh halaman kertas terisi penuh tanpa terpotong atau menyisakan ruang kosong yang lebar"
            >
              <Check className={`w-3.5 h-3.5 ${printLayoutMode === 'compact' ? 'inline' : 'hidden'}`} />
              <span>Padat & Terisi Penuh (Hemat Kertas)</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintLayoutMode('segmented')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                printLayoutMode === 'segmented'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Mode Per Lembar Terpisah: Menampilkan halaman terpisah dengan lembar lampiran mandiri"
            >
              <Check className={`w-3.5 h-3.5 ${printLayoutMode === 'segmented' ? 'inline' : 'hidden'}`} />
              <span>Per Lembar Terpisah</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-500 hidden md:inline">
            {printLayoutMode === 'compact'
              ? '✨ Seluruh tugas & sarpras mengalir rapi mengisi halaman pertama & kedua secara penuh tanpa kekosongan kertas.'
              : 'Format lembar terpisah per bab.'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileFitScale(!mobileFitScale)}
          className="flex items-center gap-1 font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300/80 px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors"
        >
          {mobileFitScale ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          <span>{mobileFitScale ? 'Ukuran A4 Asli' : 'Paskan Layar'}</span>
        </button>
      </div>

      {/* PRINTABLE OFFICIAL DOCUMENT CONTAINER (A4 CALIBRATED PAGES) */}
      <div className="overflow-x-auto pb-10 print:overflow-visible print:pb-0 print:m-0 print:p-0">
        <div ref={printableRef} className="space-y-8 max-w-[850px] mx-auto print:space-y-0 print:max-w-none print:w-full print:m-0 print:p-0 print-page-container">
          {(() => {
            // Lembar 1 task capacity:
            // For monthly report: 5-6 tasks on page 1, remaining chunked to subsequent pages
            // For annual report: only display the monthly performance recap table on Lembar 1 (NO subsequent daily task sheets)
            const isAnnual = !isMonthly;
            const page1Limit = isPerpus ? 5 : 6;
            const tasksPage1 = relevantTasks.slice(0, page1Limit);
            const remainingTasks = isAnnual ? [] : relevantTasks.slice(page1Limit);
            const tasksPerPageSubsequent = 12;
            const subsequentTaskChunks: typeof relevantTasks[] = [];
            if (!isAnnual) {
              for (let i = 0; i < remainingTasks.length; i += tasksPerPageSubsequent) {
                subsequentTaskChunks.push(remainingTasks.slice(i, i + tasksPerPageSubsequent));
              }
            }
            const roleInventories = inventories.filter(inv => inv.role && inv.role.trim().toUpperCase() === role.trim().toUpperCase());
            const tasksWithPhotos = relevantTasks.filter(t => !!t.photoUrl);
            const totalPages = 1 + subsequentTaskChunks.length + 1 + 1; // Lembar 1 + N Task Sheets + Lampiran Sarpras & Foto + Lembar Pengesahan

            // ========================================================
            // MODE 1: FORMAT CETAK LANGSUNG: PADAT & TERISI PENUH (SEAMLESS CONTINUOUS)
            // Mengisi halaman 1, 2, dst secara penuh tanpa kekosongan dan tanpa split paksa
            // ========================================================
            if (printLayoutMode === 'compact') {
              return (
                <>
                  <div className="no-print flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-1">
                    <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Format Cetak Langsung: Padat & Terisi Penuh (Tanpa Halaman Kosong / Hemat Kertas)</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Standar Resmi Dinas Pendidikan</span>
                  </div>

                  <div 
                    className={`print-page print-continuous bg-white border border-slate-300 shadow-xl rounded-xl p-5 sm:p-8 text-slate-900 leading-normal print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none w-full ${
                      mobileFitScale ? 'w-full text-[11px]' : 'min-w-[720px] sm:min-w-0'
                    }`}
                    style={{ boxSizing: 'border-box' }}
                  >
                    {/* KOP SURAT RESMI 3 KOLOM */}
                    <KopSurat config={schoolConfig} isPrintVersion={true} />

                    {/* DOKUMEN HEADING */}
                    <div className="text-center my-2.5 break-inside-avoid">
                      <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-950">
                        {isMonthly 
                          ? `LAPORAN BULANAN KINERJA OPERATOR LAYANAN OPERASIONAL`
                          : `LAPORAN TAHUNAN KINERJA OPERATOR LAYANAN OPERASIONAL`
                        }
                      </h2>
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 mt-0.5">
                        BIDANG: {roleTitle.toUpperCase()}
                      </h3>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        {isMonthly 
                          ? `Periode: Bulan ${MONTH_NAMES[(monthlyData?.month || 9) - 1]} Tahun ${monthlyData?.year || 2026}`
                          : `Tahun Anggaran: ${annualData?.year || 2026}`
                        }
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <p className="text-[11px] font-mono text-slate-700">
                          Nomor: <span className="font-bold text-slate-950">{nomorSurat}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setTempNomorSurat(nomorSurat);
                            setIsEditNomorModalOpen(true);
                          }}
                          className="no-print inline-flex items-center gap-1 text-[10px] text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-xs"
                          title="Klik untuk mengubah nomor surat resmi"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>Ubah No. Surat</span>
                        </button>
                      </div>
                    </div>

                    {/* IDENTITAS PELAKSANA TUGAS */}
                    <div className="my-2 p-2.5 bg-slate-50 border border-slate-300 rounded text-xs break-inside-avoid print:bg-transparent print:border-black">
                      <table className="w-full border-none">
                        <tbody>
                          <tr>
                            <td className="w-40 sm:w-48 font-semibold border-none py-0.5">Nama Petugas Pelaksana</td>
                            <td className="w-4 border-none py-0.5">:</td>
                            <td className="font-bold border-none py-0.5">{displayOperatorNama}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold border-none py-0.5">NIP / NIPPK</td>
                            <td className="border-none py-0.5">:</td>
                            <td className="border-none py-0.5">{displayOperatorNip}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold border-none py-0.5">Jabatan / Satuan Tugas</td>
                            <td className="border-none py-0.5">:</td>
                            <td className="border-none py-0.5">{operator.jabatan}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold border-none py-0.5">Unit Kerja / Sekolah</td>
                            <td className="border-none py-0.5">:</td>
                            <td className="border-none py-0.5">{schoolConfig.namaSekolah}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* RINGKASAN EKSEKUTIF KINERJA */}
                    <div className="my-2 text-xs break-inside-avoid">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase border-b border-slate-300 pb-0.5 mb-1.5 print:border-black">
                        I. RINGKASAN EKSEKUTIF KINERJA & CAPAIAN TARGET OPERASIONAL ({roleTitle.toUpperCase()})
                      </h4>
                      <p className="text-justify leading-relaxed text-slate-800 indent-6">
                        {reportData.summary}
                      </p>

                      {/* CAPAIAN / MILESTONES */}
                      <div className="mt-2.5">
                        <p className="font-semibold text-slate-900 mb-1">
                          Rincian Capaian Indikator Kinerja yang Terlaksana ({roleTitle}):
                        </p>
                        <ol className="list-decimal pl-5 space-y-1 text-slate-800">
                          {isMonthly ? (
                            monthlyData?.achievements.map((item, idx) => (
                              <li key={idx} className="leading-snug">{item}</li>
                            ))
                          ) : (
                            annualData?.annualMilestones.map((item, idx) => (
                              <li key={idx} className="leading-snug">{item}</li>
                            ))
                          )}
                        </ol>
                      </div>

                      {/* KENDALA & SOLUSI */}
                      {isMonthly && monthlyData && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2.5 pt-1.5 border-t border-slate-200">
                          <div>
                            <p className="font-semibold text-slate-900 mb-1">Kendala / Hambatan di Lapangan:</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                              {monthlyData.obstacles.map((obs, idx) => (
                                <li key={idx}>{obs}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 mb-1">Solusi & Upaya Pemecahan Masalah:</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                              {monthlyData.solutions.map((sol, idx) => (
                                <li key={idx}>{sol}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {!isMonthly && annualData && (
                        <div className="mt-2.5 pt-1.5 border-t border-slate-200 space-y-2">
                          {annualData.obstacles && annualData.obstacles.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              <div>
                                <p className="font-semibold text-slate-900 mb-1">Evaluasi Kendala / Hambatan Lapangan Terakumulasi:</p>
                                <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                                  {annualData.obstacles.map((obs, idx) => (
                                    <li key={idx}>{obs}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 mb-1">Solusi & Mitigasi Kendala:</p>
                                <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                                  {(annualData.solutions || []).map((sol, idx) => (
                                    <li key={idx}>{sol}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900 mb-1">Rekomendasi Rencana Strategis & Kebutuhan Operasional:</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                              {annualData.strategicRecommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* STANDAR TUPOKSI DAN TUGAS TAMBAHAN */}
                    <div className="mt-2 pt-1.5 border-t border-slate-300 text-xs break-inside-avoid print:border-black">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase border-b border-slate-300 pb-0.5 mb-1.5 print:border-black">
                        II. STANDAR TUGAS POKOK (TUPOKSI) DAN TUGAS TAMBAHAN LAYANAN OPERASIONAL
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-2 bg-slate-50 border border-slate-300 rounded print:border-black print:bg-transparent">
                          <p className="font-bold text-slate-900 mb-1 flex items-center justify-between text-[10.5px]">
                            <span>A. Tugas Pokok (Tupoksi Standar):</span>
                            <span className="font-mono text-[9.5px] text-blue-800 font-bold">({tupoksiCompleted.length}/{tupoksiTasks.length} Tuntas)</span>
                          </p>
                          <ul className="list-disc pl-3.5 space-y-0.5 text-slate-800 text-[9.5px]">
                            {roleTupoksiList.map((item, idx) => (
                              <li key={idx} className="leading-tight">{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-2 bg-slate-50 border border-slate-300 rounded print:border-black print:bg-transparent">
                          <p className="font-bold text-slate-900 mb-1 flex items-center justify-between text-[10.5px]">
                            <span>B. Tugas Tambahan & Insidental:</span>
                            <span className="font-mono text-[9.5px] text-amber-800 font-bold">({tambahanCompleted.length}/{tambahanTasks.length} Tuntas)</span>
                          </p>
                          <ul className="list-disc pl-3.5 space-y-0.5 text-slate-800 text-[9.5px]">
                            {roleTambahanList.map((item, idx) => (
                              <li key={idx} className="leading-tight">{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* MATRIKS TARGET OPERASIONAL & INDIKATOR KINERJA KUNCI (KPI) */}
                    <div className="mt-2 pt-1.5 border-t border-slate-300 text-xs break-inside-avoid print:border-black">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-xs text-slate-900 uppercase">
                          MATRIKS TARGET OPERASIONAL & INDIKATOR KINERJA KUNCI (KPI) - {roleTitle.toUpperCase()}
                        </h4>
                        <span className="font-mono text-[9.5px] text-slate-600">
                          Standar Tata Kelola Satdik
                        </span>
                      </div>
                      <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 font-bold border-b border-slate-400 print:bg-slate-200">
                            <th className="py-1 px-1.5 border border-slate-400 w-16 text-center">Kode</th>
                            <th className="py-1 px-1.5 border border-slate-400">Indikator Kinerja Kunci (KPI)</th>
                            <th className="py-1 px-1.5 border border-slate-400 w-36">Target Kerja</th>
                            <th className="py-1 px-1.5 border border-slate-400 w-44">Realisasi Lapangan</th>
                            <th className="py-1 px-1.5 border border-slate-400 w-16 text-center">Satuan</th>
                            <th className="py-1 px-1.5 border border-slate-400 w-16 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printKpis.map((kpi, idx) => (
                            <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60 print:bg-transparent' : ''}>
                              <td className="py-1 px-1.5 border border-slate-300 font-mono text-center font-bold text-slate-700">{kpi.code}</td>
                              <td className="py-1 px-1.5 border border-slate-300 font-semibold text-slate-900">{kpi.name}</td>
                              <td className="py-1 px-1.5 border border-slate-300 text-slate-700">{kpi.target}</td>
                              <td className="py-1 px-1.5 border border-slate-300 font-semibold text-slate-800">{kpi.realization}</td>
                              <td className="py-1 px-1.5 border border-slate-300 text-center text-slate-600">{kpi.unit}</td>
                              <td className="py-1 px-1.5 border border-slate-300 text-center font-bold text-emerald-800">
                                {kpi.status === 'tercapai' ? 'Tercapai' : 'Proses'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* DATA REKAPITULASI ANGGOTA PERPUSTAKAAN (IF PERPUS) */}
                    {isPerpus && (
                      <div className="mt-2 pt-1.5 border-t border-slate-300 text-xs break-inside-avoid print:border-black">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-xs text-slate-900 uppercase">
                            III. DATA REKAPITULASI ANGGOTA PERPUSTAKAAN (PEMUSTAKA SEKOLAH)
                          </h4>
                          <span className="font-mono text-[10px] font-bold text-slate-800">
                            Total: {totalAnggotaPerpus} Orang
                          </span>
                        </div>
                        <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[10.5px]">
                          <thead>
                            <tr className="bg-slate-100 font-bold border-b border-slate-400 print:bg-slate-200">
                              <th className="py-1 px-2 border border-slate-400">Guru (Pendidik)</th>
                              <th className="py-1 px-2 border border-slate-400">Tenaga Kependidikan (Staff/TU)</th>
                              <th className="py-1 px-2 border border-slate-400 text-center">Siswa Laki-laki</th>
                              <th className="py-1 px-2 border border-slate-400 text-center">Siswa Perempuan</th>
                              <th className="py-1 px-2 border border-slate-400 text-center font-bold">Total Seluruh Anggota</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="py-1 px-2 border border-slate-300">
                                <span className="font-bold block text-slate-900">{totalGuru} orang</span>
                                <span className="text-[9.5px] text-slate-600 font-mono">
                                  (L: {guruLaki}, P: {guruPerempuan})
                                </span>
                              </td>
                              <td className="py-1 px-2 border border-slate-300">
                                <span className="font-bold block text-slate-900">{totalStaff} orang</span>
                                <span className="text-[9.5px] text-slate-600 font-mono">
                                  (L: {staffLaki}, P: {staffPerempuan})
                                </span>
                              </td>
                              <td className="py-1 px-2 text-center border border-slate-300 font-semibold">{siswaLaki} orang</td>
                              <td className="py-1 px-2 text-center border border-slate-300 font-semibold">{siswaPerempuan} orang</td>
                              <td className="py-1 px-2 text-center font-bold border border-slate-300 text-blue-900 font-mono">{totalAnggotaPerpus} orang</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* REKAPITULASI TUGAS: TAMPILAN TAHUNAN (PERSENTASE & VOLUME PER BULAN) ATAU BULANAN (RINCIAN LENGKAP HARIAN) */}
                    {isAnnual ? (
                      /* LAPOR TAHUNAN: REKAPITULASI & PERSENTASE KINERJA OPERASIONAL PER BULAN */
                      <div className="mt-2.5 pt-2 border-t border-slate-300 text-xs break-inside-avoid print:border-black">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-xs text-slate-900 uppercase">
                            {isPerpus ? 'IV.' : 'III.'} REKAPITULASI & PERSENTASE KINERJA OPERASIONAL PER BULAN (TUGAS POKOK & TUGAS TAMBAHAN)
                          </h4>
                          <span className="font-mono text-[9.5px] text-slate-600">
                            Tahun Anggaran {annualData?.year || 2026} (12 Bulan Pelaksanaan)
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-500 mb-1 leading-tight">
                          Rekapitulasi volume realisasi tugas kedinasan per bulan yang disesuaikan menurut bagian Tugas Pokok dan Tugas Tambahan beserta persentase capaian operasional:
                        </p>

                        <div className="w-full overflow-hidden">
                          <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[9.5px]">
                            <thead>
                              <tr className="bg-slate-100 text-slate-900 border-b border-slate-400 font-bold print:bg-slate-200 print:border-black">
                                <th className="py-1 px-1 text-center w-6 border border-slate-400 print:border-black">No</th>
                                <th className="py-1 px-1.5 w-20 border border-slate-400 print:border-black font-bold">Bulan</th>
                                <th className="py-1 px-2 border border-slate-400 print:border-black min-w-[200px]">Realisasi Tugas Pokok & Volume Hasil</th>
                                <th className="py-1 px-2 border border-slate-400 print:border-black min-w-[180px]">Realisasi Tugas Tambahan & Volume Hasil</th>
                                <th className="py-1 px-1 text-center border border-slate-400 print:border-black w-12 whitespace-nowrap">Kegiatan</th>
                                <th className="py-1 px-1 text-center border border-slate-400 print:border-black w-12 whitespace-nowrap">Tuntas</th>
                                <th className="py-1 px-1.5 text-center border border-slate-400 print:border-black w-14 whitespace-nowrap font-bold">Capaian</th>
                              </tr>
                            </thead>
                            <tbody>
                              {annualPerformance.items.map((item, idx) => (
                                <tr key={item.monthIndex} className="border-b border-slate-300 print:border-black">
                                  <td className="py-0.5 px-1 text-center font-mono border border-slate-300 print:border-black">{idx + 1}</td>
                                  <td className="py-0.5 px-1.5 font-semibold text-slate-900 border border-slate-300 print:border-black whitespace-nowrap">{item.monthName}</td>
                                  <td className="py-0.5 px-2 text-[9px] leading-tight text-slate-800 border border-slate-300 print:border-black">
                                    {item.tupoksiSummary}
                                  </td>
                                  <td className="py-0.5 px-2 text-[9px] leading-tight text-slate-700 border border-slate-300 print:border-black">
                                    {item.tambahanSummary}
                                  </td>
                                  <td className="py-0.5 px-1 text-center font-mono border border-slate-300 print:border-black">{item.totalTasks}</td>
                                  <td className="py-0.5 px-1 text-center font-mono border border-slate-300 print:border-black text-emerald-800 font-semibold">{item.completedTasks}</td>
                                  <td className="py-0.5 px-1.5 text-center font-mono font-bold text-emerald-700 border border-slate-300 print:border-black">
                                    {item.percentage}%
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400 print:bg-slate-200 print:border-black text-[9.5px]">
                                <td colSpan={2} className="py-1 px-1.5 text-center font-bold">TOTAL TAHUNAN</td>
                                <td className="py-1 px-2 text-[9px]">
                                  Total {annualPerformance.totalTupoksi} Kegiatan Tugas Pokok Terlaksana
                                </td>
                                <td className="py-1 px-2 text-[9px]">
                                  Total {annualPerformance.totalTambahan} Kegiatan Tugas Tambahan Terlaksana
                                </td>
                                <td className="py-1 px-1 text-center font-mono">{annualPerformance.totalTasks}</td>
                                <td className="py-1 px-1 text-center font-mono text-emerald-800">{annualPerformance.totalCompleted}</td>
                                <td className="py-1 px-1.5 text-center font-mono text-emerald-900 font-black">
                                  {annualPerformance.averagePercentage.toFixed(1)}%
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* LAPOR BULANAN: REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL LENGKAP SECARA KONTINU (TANPA TERPOTONG) */
                      <div className="mt-2.5 pt-2 border-t border-slate-300 text-xs print:border-black">
                        <div className="flex justify-between items-center mb-1 break-inside-avoid">
                          <h4 className="font-bold text-xs text-slate-900 uppercase">
                            {isPerpus ? 'IV.' : 'III.'} REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL YANG DILAKSANAKAN
                          </h4>
                          <span className="font-mono text-[9.5px] text-slate-600">
                            {relevantTasks.length} Tugas Tercatat Lengkap
                          </span>
                        </div>

                        <div className="w-full overflow-hidden">
                          <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[10px]">
                            <thead>
                              <tr className="bg-slate-100 text-slate-900 border-b border-slate-400 font-bold print:bg-slate-200 print:border-black">
                                <th className="py-1 px-1.5 text-center w-7 border border-slate-400 print:border-black">No</th>
                                <th className="py-1 px-1.5 w-20 border border-slate-400 print:border-black">Tanggal</th>
                                <th className="py-1 px-1.5 w-22 border border-slate-400 print:border-black">Klasifikasi</th>
                                <th className="py-1 px-2 border border-slate-400 print:border-black">Uraian Tugas Kedinasan</th>
                                <th className="py-1 px-1.5 border border-slate-400 print:border-black">Lokasi</th>
                                <th className="py-1 px-1.5 text-center border border-slate-400 print:border-black whitespace-nowrap">Waktu</th>
                                <th className="py-1 px-1 text-center w-12 border border-slate-400 print:border-black">Volume</th>
                                <th className="py-1 px-1.5 text-center w-14 border border-slate-400 print:border-black">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {relevantTasks.length > 0 ? (
                                relevantTasks.map((task, idx) => {
                                  const isTupoksi = task.taskType !== 'tambahan';
                                  return (
                                    <tr 
                                      key={task.id || idx} 
                                      className={`border-b border-slate-300 print:border-black break-inside-avoid ${
                                        idx % 2 === 1 ? 'bg-slate-50/50 print:bg-transparent' : ''
                                      }`}
                                    >
                                      <td className="py-1 px-1.5 text-center font-mono border border-slate-300 print:border-black">{idx + 1}</td>
                                      <td className="py-1 px-1.5 border border-slate-300 print:border-black whitespace-nowrap font-mono text-[9.5px]">
                                        {task.date}
                                      </td>
                                      <td className="py-1 px-1.5 border border-slate-300 print:border-black">
                                        <span className={`inline-block px-1 py-0.5 rounded text-[8.5px] font-bold ${
                                          isTupoksi 
                                            ? 'bg-blue-100 text-blue-900 print:bg-transparent print:text-black' 
                                            : 'bg-amber-100 text-amber-900 print:bg-transparent print:text-black'
                                        }`}>
                                          {isTupoksi ? 'Tugas Pokok' : 'Tugas Tambahan'}
                                        </span>
                                      </td>
                                      <td className="py-1 px-2 border border-slate-300 print:border-black">
                                        <span className="font-semibold text-slate-900 block leading-tight">{task.title}</span>
                                        {task.description && (
                                          <span className="text-[9px] text-slate-600 block mt-0.5 leading-snug">{task.description}</span>
                                        )}
                                      </td>
                                      <td className="py-1 px-1.5 border border-slate-300 print:border-black text-[9.5px] text-slate-700">
                                        {task.location || 'Lingkungan Sekolah'}
                                      </td>
                                      <td className="py-1 px-1.5 text-center border border-slate-300 print:border-black whitespace-nowrap font-mono text-[9px]">
                                        {task.timeStart || '07.00'} - {task.timeEnd || '08.00'}
                                      </td>
                                      <td className="py-1 px-1 text-center font-mono border border-slate-300 print:border-black text-[9px]">
                                        {task.volumeUnit || '1 keg.'}
                                      </td>
                                      <td className="py-1 px-1.5 text-center border border-slate-300 print:border-black">
                                        <span className="text-[8.5px] font-bold text-emerald-800 print:text-black">
                                          {task.status === 'selesai' ? 'Tuntas 100%' : 'Terlaksana'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={8} className="py-3 text-center text-slate-500 italic border border-slate-300">
                                    Belum ada data rincian tugas operasional untuk periode ini.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* LAMPIRAN SARANA & PRASARANA OPERASIONAL (ISOLASI DATA PER LAYANAN) */}
                    {roleInventories.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-300 text-xs print:border-black">
                        <div className="flex justify-between items-center mb-1 break-inside-avoid">
                          <h4 className="font-bold text-xs text-slate-900 uppercase">
                            {isAnnual ? (isPerpus ? 'V.' : 'IV.') : (isPerpus ? 'V.' : 'IV.')} DAFTAR SARANA & PRASARANA OPERASIONAL ({roleTitle.toUpperCase()})
                          </h4>
                          <span className="font-mono text-[9.5px] text-slate-600">
                            {roleInventories.length} Barang Terdata
                          </span>
                        </div>
                        <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[9.5px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-900 border-b border-slate-400 font-bold print:bg-slate-200">
                              <th className="py-1 px-1 text-center w-6 border border-slate-400">No</th>
                              <th className="py-1 px-1.5 border border-slate-400 w-24">Kode Barang</th>
                              <th className="py-1 px-2 border border-slate-400">Nama Sarana / Prasarana</th>
                              <th className="py-1 px-1.5 border border-slate-400">Lokasi / Ruang</th>
                              <th className="py-1 px-1 text-center border border-slate-400 w-12">Jumlah</th>
                              <th className="py-1 px-1.5 text-center border border-slate-400 w-16">Kondisi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roleInventories.map((inv, idx) => (
                              <tr key={inv.id || idx} className="border-b border-slate-300 print:border-black break-inside-avoid">
                                <td className="py-0.5 px-1 text-center font-mono border border-slate-300">{idx + 1}</td>
                                <td className="py-0.5 px-1.5 font-mono border border-slate-300">{inv.kodeBarang || '-'}</td>
                                <td className="py-0.5 px-2 font-semibold text-slate-900 border border-slate-300">{inv.namaBarang}</td>
                                <td className="py-0.5 px-1.5 border border-slate-300">{inv.lokasiPenyimpanan || '-'}</td>
                                <td className="py-0.5 px-1 text-center font-mono border border-slate-300">{inv.jumlah} {inv.satuan}</td>
                                <td className="py-0.5 px-1.5 text-center font-semibold border border-slate-300">
                                  <span className={inv.kondisi === 'Baik' ? 'text-emerald-800' : 'text-amber-800'}>
                                    {inv.kondisi}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* LEMBAR PENGESAHAN RESMI (TANDA TANGAN & STEMPEL - DIJAMIN UTUH TANPA TERPOTONG) */}
                    <div className="mt-3 pt-2 border-t-2 border-slate-400 print:border-black break-inside-avoid">
                      <div className="text-center mb-2">
                        <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 underline decoration-1 underline-offset-2">
                          LEMBAR PENGESAHAN KEDINASAN RESMI
                        </h4>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          Laporan kinerja ini telah diperiksa, diverifikasi, dan disahkan secara berjenjang oleh Kepala Sekolah dan Pengelola Layanan.
                        </p>
                      </div>
                      <OfficialApprovalSheet
                        config={schoolConfig}
                        role={role}
                        manualDate={manualDate}
                        onDateChange={(d) => setManualDate(d)}
                        isPrintVersion={false}
                      />
                    </div>

                    {/* FOOTER RESMI */}
                    <div className="pt-3 mt-2 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono break-inside-avoid">
                      <span>{schoolConfig.namaSekolah} · Laporan Kinerja Resmi {roleTitle} · {isMonthly ? `Bulan ${MONTH_NAMES[(monthlyData?.month || 9) - 1]} ${monthlyData?.year || 2026}` : `Tahun ${annualData?.year || 2026}`} · Dokumen Akuntabilitas Kedinasan</span>
                    </div>
                  </div>
                </>
              );
            }

            // ========================================================
            // MODE 2: FORMAT LEMBAR TERPISAH (PAGINATED SEGMENTED)
            // ========================================================
            return (
              <>
                {/* ========================================================
                    LEMBAR 1: KOP SURAT, IDENTITAS, RINGKASAN KINERJA
                    ======================================================== */}
                <div className="no-print flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-1">
                  <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Lembar 1 dari {totalPages} (Dokumen Induk Laporan Kinerja)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Standar A4 Kedinasan</span>
                </div>

                <div 
                  className={`print-page bg-white border border-slate-300 shadow-xl rounded-xl p-5 sm:p-7 text-slate-900 leading-normal flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none min-h-[960px] sm:min-h-[1020px] print:min-h-0 print:h-auto ${
                    mobileFitScale ? 'w-full text-[11px]' : 'min-w-[720px] sm:min-w-0'
                  }`}
                  style={{ 
                    boxSizing: 'border-box'
                  }}
                >
                  <div>
                    {/* KOP SURAT 3 KOLOM */}
                    <KopSurat config={schoolConfig} isPrintVersion={true} />

                    {/* DOKUMEN HEADING */}
                    <div className="text-center my-2.5 break-inside-avoid">
                      <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-950">
                        {isMonthly 
                          ? `LAPORAN BULANAN KINERJA OPERATOR LAYANAN OPERASIONAL`
                          : `LAPORAN TAHUNAN KINERJA OPERATOR LAYANAN OPERASIONAL`
                        }
                      </h2>
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 mt-0.5">
                        BIDANG: {roleTitle.toUpperCase()}
                      </h3>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        {isMonthly 
                          ? `Periode: Bulan ${MONTH_NAMES[(monthlyData?.month || 9) - 1]} Tahun ${monthlyData?.year || 2026}`
                          : `Tahun Anggaran: ${annualData?.year || 2026}`
                        }
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <p className="text-[11px] font-mono text-slate-700">
                          Nomor: <span className="font-bold text-slate-950">{nomorSurat}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setTempNomorSurat(nomorSurat);
                            setIsEditNomorModalOpen(true);
                          }}
                          className="no-print inline-flex items-center gap-1 text-[10px] text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-xs"
                          title="Klik untuk mengubah nomor surat resmi"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>Ubah No. Surat</span>
                        </button>
                      </div>
                    </div>

                    {/* IDENTITAS PELAKSANA TUGAS */}
                    <div className="my-2 p-2.5 bg-slate-50 border border-slate-300 rounded text-xs break-inside-avoid print:bg-transparent print:border-black">
                      <table className="w-full border-none">
                        <tbody>
                          <tr>
                            <td className="w-40 sm:w-48 font-semibold border-none py-0.5">Nama Petugas Pelaksana</td>
                            <td className="w-4 border-none py-0.5">:</td>
                            <td className="font-bold border-none py-0.5">{displayOperatorNama}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold border-none py-0.5">NIP / NIPPK</td>
                            <td className="border-none py-0.5">:</td>
                            <td className="border-none py-0.5">{displayOperatorNip}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold border-none py-0.5">Jabatan / Satuan Tugas</td>
                            <td className="border-none py-0.5">:</td>
                            <td className="border-none py-0.5">{operator.jabatan}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold border-none py-0.5">Unit Kerja / Sekolah</td>
                            <td className="border-none py-0.5">:</td>
                            <td className="border-none py-0.5">{schoolConfig.namaSekolah}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* RINGKASAN KINERJA */}
                    <div className="my-2 text-xs break-inside-avoid">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase border-b border-slate-300 pb-0.5 mb-1.5 print:border-black">
                        I. RINGKASAN EKSEKUTIF KINERJA & CAPAIAN TARGET OPERASIONAL ({roleTitle.toUpperCase()})
                      </h4>
                      <p className="text-justify leading-relaxed text-slate-800 indent-6">
                        {reportData.summary}
                      </p>

                      {/* CAPAIAN / MILESTONES */}
                      <div className="mt-2.5">
                        <p className="font-semibold text-slate-900 mb-1">
                          Rincian Capaian Indikator Kinerja yang Terlaksana ({roleTitle}):
                        </p>
                        <ol className="list-decimal pl-5 space-y-1 text-slate-800">
                          {isMonthly ? (
                            monthlyData?.achievements.map((item, idx) => (
                              <li key={idx} className="leading-snug">{item}</li>
                            ))
                          ) : (
                            annualData?.annualMilestones.map((item, idx) => (
                              <li key={idx} className="leading-snug">{item}</li>
                            ))
                          )}
                        </ol>
                      </div>

                      {/* KENDALA & SOLUSI / REKOMENDASI */}
                      {isMonthly && monthlyData && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2.5 pt-1.5 border-t border-slate-200">
                          <div>
                            <p className="font-semibold text-slate-900 mb-1">Kendala / Hambatan di Lapangan:</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                              {monthlyData.obstacles.map((obs, idx) => (
                                <li key={idx}>{obs}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 mb-1">Solusi & Upaya Pemecahan Masalah:</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                              {monthlyData.solutions.map((sol, idx) => (
                                <li key={idx}>{sol}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {!isMonthly && annualData && (
                        <div className="mt-2.5 pt-1.5 border-t border-slate-200 space-y-2">
                          {annualData.obstacles && annualData.obstacles.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              <div>
                                <p className="font-semibold text-slate-900 mb-1">Evaluasi Kendala / Hambatan Lapangan Terakumulasi:</p>
                                <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                                  {annualData.obstacles.map((obs, idx) => (
                                    <li key={idx}>{obs}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 mb-1">Solusi & Mitigasi Kendala:</p>
                                <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                                  {(annualData.solutions || []).map((sol, idx) => (
                                    <li key={idx}>{sol}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900 mb-1">Rekomendasi Rencana Strategis & Kebutuhan Operasional:</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                              {annualData.strategicRecommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* ========================================================
                          II. STANDAR TUGAS POKOK (TUPOKSI) DAN TUGAS TAMBAHAN
                          ======================================================== */}
                      <div className="mt-2 pt-1.5 border-t border-slate-300 text-xs break-inside-avoid print:border-black">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase border-b border-slate-300 pb-0.5 mb-1.5 print:border-black">
                          II. STANDAR TUGAS POKOK (TUPOKSI) DAN TUGAS TAMBAHAN LAYANAN OPERASIONAL
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="p-2 bg-slate-50 border border-slate-300 rounded print:border-black print:bg-transparent">
                            <p className="font-bold text-slate-900 mb-1 flex items-center justify-between text-[10.5px]">
                              <span>A. Tugas Pokok (Tupoksi Standar):</span>
                              <span className="font-mono text-[9.5px] text-blue-800 font-bold">({tupoksiCompleted.length}/{tupoksiTasks.length} Tuntas)</span>
                            </p>
                            <ul className="list-disc pl-3.5 space-y-0.5 text-slate-800 text-[9.5px]">
                              {roleTupoksiList.map((item, idx) => (
                                <li key={idx} className="leading-tight">{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-2 bg-slate-50 border border-slate-300 rounded print:border-black print:bg-transparent">
                            <p className="font-bold text-slate-900 mb-1 flex items-center justify-between text-[10.5px]">
                              <span>B. Tugas Tambahan & Insidental:</span>
                              <span className="font-mono text-[9.5px] text-amber-800 font-bold">({tambahanCompleted.length}/{tambahanTasks.length} Tuntas)</span>
                            </p>
                            <ul className="list-disc pl-3.5 space-y-0.5 text-slate-800 text-[9.5px]">
                              {roleTambahanList.map((item, idx) => (
                                <li key={idx} className="leading-tight">{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* MATRIKS TARGET OPERASIONAL & INDIKATOR KINERJA KUNCI (KPI) */}
                      <div className="mt-2 pt-1.5 border-t border-slate-300 text-xs break-inside-avoid print:border-black">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-xs text-slate-900 uppercase">
                            MATRIKS TARGET OPERASIONAL & INDIKATOR KINERJA KUNCI (KPI) - {roleTitle.toUpperCase()}
                          </h4>
                          <span className="font-mono text-[9.5px] text-slate-600">
                            Standar Tata Kelola Satdik
                          </span>
                        </div>
                        <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[10px]">
                          <thead>
                            <tr className="bg-slate-100 font-bold border-b border-slate-400 print:bg-slate-200">
                              <th className="py-1 px-1.5 border border-slate-400 w-16 text-center">Kode</th>
                              <th className="py-1 px-1.5 border border-slate-400">Indikator Kinerja Kunci (KPI)</th>
                              <th className="py-1 px-1.5 border border-slate-400 w-36">Target Kerja</th>
                              <th className="py-1 px-1.5 border border-slate-400 w-44">Realisasi Lapangan</th>
                              <th className="py-1 px-1.5 border border-slate-400 w-16 text-center">Satuan</th>
                              <th className="py-1 px-1.5 border border-slate-400 w-16 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {printKpis.map((kpi, idx) => (
                              <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60 print:bg-transparent' : ''}>
                                <td className="py-1 px-1.5 border border-slate-300 font-mono text-center font-bold text-slate-700">{kpi.code}</td>
                                <td className="py-1 px-1.5 border border-slate-300 font-semibold text-slate-900">{kpi.name}</td>
                                <td className="py-1 px-1.5 border border-slate-300 text-slate-700">{kpi.target}</td>
                                <td className="py-1 px-1.5 border border-slate-300 font-semibold text-slate-800">{kpi.realization}</td>
                                <td className="py-1 px-1.5 border border-slate-300 text-center text-slate-600">{kpi.unit}</td>
                                <td className="py-1 px-1.5 border border-slate-300 text-center font-bold text-emerald-800">
                                  {kpi.status === 'tercapai' ? 'Tercapai' : 'Proses'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* DATA REKAPITULASI ANGGOTA PERPUSTAKAAN (GURU, STAFF, SISWA) */}
                      {isPerpus && (
                        <div className="mt-2 pt-1.5 border-t border-slate-300 text-xs break-inside-avoid print:border-black">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-xs text-slate-900 uppercase">
                              III. DATA REKAPITULASI ANGGOTA PERPUSTAKAAN (PEMUSTAKA SEKOLAH)
                            </h4>
                            <span className="font-mono text-[10px] font-bold text-slate-800">
                              Total: {totalAnggotaPerpus} Orang
                            </span>
                          </div>
                          <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[10.5px]">
                            <thead>
                              <tr className="bg-slate-100 font-bold border-b border-slate-400 print:bg-slate-200">
                                <th className="py-1 px-2 border border-slate-400">Guru (Pendidik)</th>
                                <th className="py-1 px-2 border border-slate-400">Tenaga Kependidikan (Staff/TU)</th>
                                <th className="py-1 px-2 border border-slate-400 text-center">Siswa Laki-laki</th>
                                <th className="py-1 px-2 border border-slate-400 text-center">Siswa Perempuan</th>
                                <th className="py-1 px-2 border border-slate-400 text-center font-bold">Total Seluruh Anggota</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="py-1 px-2 border border-slate-300">
                                  <span className="font-bold block text-slate-900">{totalGuru} orang</span>
                                  <span className="text-[9.5px] text-slate-600 font-mono">
                                    (L: {guruLaki}, P: {guruPerempuan})
                                  </span>
                                </td>
                                <td className="py-1 px-2 border border-slate-300">
                                  <span className="font-bold block text-slate-900">{totalStaff} orang</span>
                                  <span className="text-[9.5px] text-slate-600 font-mono">
                                    (L: {staffLaki}, P: {staffPerempuan})
                                  </span>
                                </td>
                                <td className="py-1 px-2 text-center border border-slate-300 font-semibold">{siswaLaki} orang</td>
                                <td className="py-1 px-2 text-center border border-slate-300 font-semibold">{siswaPerempuan} orang</td>
                                <td className="py-1 px-2 text-center font-bold border border-slate-300 text-blue-900 font-mono">{totalAnggotaPerpus} orang</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* REKAPITULASI TUGAS: TAMPILAN TAHUNAN (PERSENTASE & VOLUME PER BULAN) ATAU BULANAN (RINCIAN HARIAN) */}
                      {isAnnual ? (
                        /* ========================================================
                           LAPOR TAHUNAN: REKAPITULASI & PERSENTASE KINERJA OPERASIONAL PER BULAN
                           (TUGAS POKOK & TUGAS TAMBAHAN DENGAN VOLUME HASIL DAN PERSENTASE %)
                           ======================================================== */
                        <div className="mt-2.5 pt-2 border-t border-slate-300 text-xs break-inside-avoid print:border-black">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-xs text-slate-900 uppercase">
                              {isPerpus ? 'IV.' : 'III.'} REKAPITULASI & PERSENTASE KINERJA OPERASIONAL PER BULAN (TUGAS POKOK & TUGAS TAMBAHAN)
                            </h4>
                            <span className="font-mono text-[9.5px] text-slate-600">
                              Tahun Anggaran {annualData?.year || 2026} (12 Bulan Pelaksanaan)
                            </span>
                          </div>
                          <p className="text-[9.5px] text-slate-500 mb-1 leading-tight">
                            Rekapitulasi volume realisasi tugas kedinasan per bulan yang disesuaikan menurut bagian Tugas Pokok dan Tugas Tambahan beserta persentase capaian operasional:
                          </p>

                          <div className="w-full overflow-hidden">
                            <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[9.5px]">
                              <thead>
                                <tr className="bg-slate-100 text-slate-900 border-b border-slate-400 font-bold print:bg-slate-200 print:border-black">
                                  <th className="py-1 px-1 text-center w-6 border border-slate-400 print:border-black">No</th>
                                  <th className="py-1 px-1.5 w-20 border border-slate-400 print:border-black font-bold">Bulan</th>
                                  <th className="py-1 px-2 border border-slate-400 print:border-black min-w-[200px]">Realisasi Tugas Pokok & Volume Hasil</th>
                                  <th className="py-1 px-2 border border-slate-400 print:border-black min-w-[180px]">Realisasi Tugas Tambahan & Volume Hasil</th>
                                  <th className="py-1 px-1 text-center border border-slate-400 print:border-black w-12 whitespace-nowrap">Kegiatan</th>
                                  <th className="py-1 px-1 text-center border border-slate-400 print:border-black w-12 whitespace-nowrap">Tuntas</th>
                                  <th className="py-1 px-1.5 text-center border border-slate-400 print:border-black w-14 whitespace-nowrap font-bold">Capaian</th>
                                </tr>
                              </thead>
                              <tbody>
                                {annualPerformance.items.map((item, idx) => (
                                  <tr key={item.monthIndex} className="border-b border-slate-300 print:border-black">
                                    <td className="py-0.5 px-1 text-center font-mono border border-slate-300 print:border-black">{idx + 1}</td>
                                    <td className="py-0.5 px-1.5 font-semibold text-slate-900 border border-slate-300 print:border-black whitespace-nowrap">{item.monthName}</td>
                                    <td className="py-0.5 px-2 text-[9px] leading-tight text-slate-800 border border-slate-300 print:border-black">
                                      {item.tupoksiSummary}
                                    </td>
                                    <td className="py-0.5 px-2 text-[9px] leading-tight text-slate-700 border border-slate-300 print:border-black">
                                      {item.tambahanSummary}
                                    </td>
                                    <td className="py-0.5 px-1 text-center font-mono border border-slate-300 print:border-black">{item.totalTasks}</td>
                                    <td className="py-0.5 px-1 text-center font-mono border border-slate-300 print:border-black text-emerald-800 font-semibold">{item.completedTasks}</td>
                                    <td className="py-0.5 px-1.5 text-center font-mono font-bold text-emerald-700 border border-slate-300 print:border-black">
                                      {item.percentage}%
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400 print:bg-slate-200 print:border-black text-[9.5px]">
                                  <td colSpan={2} className="py-1 px-1.5 text-center font-bold">TOTAL TAHUNAN</td>
                                  <td className="py-1 px-2 text-[9px]">
                                    Total {annualPerformance.totalTupoksi} Kegiatan Tugas Pokok Terlaksana
                                  </td>
                                  <td className="py-1 px-2 text-[9px]">
                                    Total {annualPerformance.totalTambahan} Kegiatan Tugas Tambahan Terlaksana
                                  </td>
                                  <td className="py-1 px-1 text-center font-mono">{annualPerformance.totalTasks}</td>
                                  <td className="py-1 px-1 text-center font-mono text-emerald-800">{annualPerformance.totalCompleted}</td>
                                  <td className="py-1 px-1.5 text-center font-mono text-emerald-900 font-black">
                                    {annualPerformance.averagePercentage.toFixed(1)}%
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        /* ========================================================
                           LAPOR BULANAN: REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL
                           ======================================================== */
                        <div className="mt-2.5 pt-2 border-t border-slate-300 text-xs break-inside-avoid print:border-black">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-xs text-slate-900 uppercase">
                              {isPerpus ? 'IV.' : 'III.'} REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL YANG DILAKSANAKAN {remainingTasks.length > 0 ? '(BAGIAN 1)' : ''}
                            </h4>
                            <span className="font-mono text-[9.5px] text-slate-600">
                              {tasksPage1.length} dari {relevantTasks.length} Tugas Tercatat
                            </span>
                          </div>

                          <div className="w-full overflow-hidden">
                            <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[10px]">
                              <thead>
                                <tr className="bg-slate-100 text-slate-900 border-b border-slate-400 font-bold print:bg-slate-200 print:border-black">
                                  <th className="py-1 px-1.5 text-center w-7 border border-slate-400 print:border-black">No</th>
                                  <th className="py-1 px-1.5 w-20 border border-slate-400 print:border-black">Tanggal</th>
                                  <th className="py-1 px-1.5 w-22 border border-slate-400 print:border-black">Klasifikasi</th>
                                  <th className="py-1 px-2 border border-slate-400 print:border-black">Uraian Tugas Kedinasan</th>
                                  <th className="py-1 px-1.5 border border-slate-400 print:border-black">Lokasi</th>
                                  <th className="py-1 px-1.5 text-center border border-slate-400 print:border-black whitespace-nowrap">Waktu</th>
                                  <th className="py-1 px-1.5 border border-slate-400 print:border-black">Volume</th>
                                  <th className="py-1 px-1.5 text-center border border-slate-400 print:border-black">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tasksPage1.length === 0 ? (
                                  <tr>
                                    <td colSpan={8} className="py-4 text-center text-slate-500 italic border border-slate-400 print:border-black">
                                      Tidak ada catatan tugas operasional pada periode ini.
                                    </td>
                                  </tr>
                                ) : (
                                  tasksPage1.map((t, idx) => {
                                    const isPokok = getTaskClassification(role, t.category, t.taskType) === 'pokok';
                                    return (
                                      <tr key={t.id} className="border-b border-slate-300 print:border-black">
                                        <td className="py-1 px-1.5 text-center font-mono border border-slate-300 print:border-black">
                                          {idx + 1}
                                        </td>
                                        <td className="py-1 px-1.5 font-mono whitespace-nowrap border border-slate-300 print:border-black">{t.date}</td>
                                        <td className="py-1 px-1.5 text-[9px] border border-slate-300 print:border-black whitespace-nowrap">
                                          <span className={`font-bold ${isPokok ? 'text-blue-900' : 'text-amber-900'}`}>
                                            {isPokok ? 'Tugas Pokok' : 'Tambahan'}
                                          </span>
                                        </td>
                                        <td className="py-1 px-2 border border-slate-300 print:border-black">
                                          <span className="font-semibold text-slate-900 block leading-tight">{t.title}</span>
                                          <span className="text-[9px] text-slate-600 block mt-0.5 leading-tight">{t.description}</span>
                                          {t.photoUrl && (
                                            <span className="text-[8.5px] text-blue-600 font-medium inline-block mt-0.5 no-print">📷 Ada bukti foto</span>
                                          )}
                                        </td>
                                        <td className="py-1 px-1.5 border border-slate-300 print:border-black text-[9.5px]">{t.location}</td>
                                        <td className="py-1 px-1.5 text-center border border-slate-300 print:border-black whitespace-nowrap font-mono text-[9px]">{t.timeStart} - {t.timeEnd}</td>
                                        <td className="py-1 px-1.5 border border-slate-300 print:border-black text-[9.5px]">{t.volumeUnit}</td>
                                        <td className="py-1 px-1.5 text-center border border-slate-300 print:border-black font-semibold text-[9px]">
                                          {t.status === 'selesai' ? (
                                            <span className="text-emerald-700 font-bold">Selesai 100%</span>
                                          ) : (
                                            <span className="text-amber-700 font-bold">Proses</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                                {remainingTasks.length === 0 && relevantTasks.length > 0 && (
                                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400 print:bg-slate-200 print:border-black text-[9.5px]">
                                    <td colSpan={3} className="py-1 px-1.5 text-center font-bold">TOTAL REKAPITULASI</td>
                                    <td colSpan={4} className="py-1 px-2">
                                      {relevantTasks.length} Tugas Operasional Terlaksana ({tupoksiTasks.length} Pokok / {tambahanTasks.length} Tambahan)
                                    </td>
                                    <td className="py-1 px-1.5 text-center text-emerald-800 font-bold">
                                      {completedCount}/{relevantTasks.length} Tuntas
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          {remainingTasks.length > 0 && (
                            <div className="text-[9px] text-slate-500 italic mt-1 text-right">
                              *(Catatan: Rincian tugas ke-{page1Limit + 1} s.d. {relevantTasks.length} tercantum secara lengkap pada lembar lampiran berikutnya)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lembar 1 Page Footer */}
                  <div className="pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                    <span>{schoolConfig.namaSekolah} · Laporan Kinerja Operator Layanan Operasional · Halaman 1 dari {totalPages}</span>
                  </div>
                </div>

                {/* ========================================================
                    LEMBAR LAMPIRAN I: REKAPITULASI RINCIAN TUGAS HARIAN
                    (DYNAMIC CHUNKED PAGINATION - HANYA DIBUAT JIKA ADA SISA TUGAS)
                    ======================================================== */}
                {subsequentTaskChunks.map((chunk, chunkIdx) => {
                  const pageNum = 2 + chunkIdx;
                  const isLastTaskChunk = chunkIdx === subsequentTaskChunks.length - 1;

                  return (
                    <React.Fragment key={chunkIdx}>
                      <div className="no-print flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-1">
                        <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Lembar {pageNum} dari {totalPages} (Lampiran I: Rekapitulasi Rincian Catatan Tugas Harian - Bagian {chunkIdx + 2})</span>
                        </span>
                        <span className="text-[11px] text-slate-400">Standar A4 Kedinasan</span>
                      </div>

                      <div 
                        className={`print-page bg-white border border-slate-300 shadow-xl rounded-xl p-5 sm:p-7 text-slate-900 leading-normal flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none min-h-[960px] sm:min-h-[1020px] print:min-h-0 print:h-auto ${
                          mobileFitScale ? 'w-full text-[11px]' : 'min-w-[720px] sm:min-w-0'
                        }`}
                        style={{ 
                          boxSizing: 'border-box'
                        }}
                      >
                        <div>
                          {/* KOP SURAT RESMI DI SETIAP LEMBAR LAMPIRAN */}
                          <KopSurat config={schoolConfig} isPrintVersion={true} className="mb-2" />

                          {/* SUB-HEADER IDENTITAS DOKUMEN */}
                          <div className="border-b border-slate-400 pb-1.5 mb-2.5 text-xs flex justify-between items-center font-semibold text-slate-700">
                            <span>{schoolConfig.namaSekolah} — Lampiran I: Rekapitulasi Rincian Tugas Operasional (Bagian {chunkIdx + 2})</span>
                            <span className="font-mono text-[10.5px]">No: {nomorSurat}</span>
                          </div>

                          <div className="my-2 text-xs">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase border-b border-slate-300 pb-1 mb-2 print:border-black break-inside-avoid">
                              {isPerpus ? 'IV.' : 'III.'} REKAPITULASI RINCIAN TUGAS HARIAN OPERASIONAL YANG DILAKSANAKAN (LANJUTAN BAGIAN ${chunkIdx + 2})
                            </h4>

                            <div className="w-full overflow-hidden">
                              <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[10.5px]">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-400 font-bold print:bg-slate-200 print:border-black">
                                    <th className="py-1 px-1.5 text-center w-8 border border-slate-400 print:border-black">No</th>
                                    <th className="py-1 px-1.5 w-20 border border-slate-400 print:border-black">Tanggal</th>
                                    <th className="py-1 px-1.5 w-22 border border-slate-400 print:border-black">Klasifikasi</th>
                                    <th className="py-1 px-2 border border-slate-400 print:border-black">Uraian Tugas / Pekerjaan Kedinasan</th>
                                    <th className="py-1 px-1.5 border border-slate-400 print:border-black">Lokasi</th>
                                    <th className="py-1 px-1.5 text-center border border-slate-400 print:border-black whitespace-nowrap">Waktu</th>
                                    <th className="py-1 px-1.5 border border-slate-400 print:border-black">Volume</th>
                                    <th className="py-1 px-1.5 text-center border border-slate-400 print:border-black">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {chunk.map((t, idx) => {
                                    const isPokok = getTaskClassification(role, t.category, t.taskType) === 'pokok';
                                    return (
                                      <tr key={t.id} className="border-b border-slate-300 print:border-black">
                                        <td className="py-1 px-1.5 text-center font-mono border border-slate-300 print:border-black">
                                          {page1Limit + chunkIdx * tasksPerPageSubsequent + idx + 1}
                                        </td>
                                        <td className="py-1 px-1.5 font-mono whitespace-nowrap border border-slate-300 print:border-black">{t.date}</td>
                                        <td className="py-1 px-1.5 text-[9px] border border-slate-300 print:border-black whitespace-nowrap">
                                          <span className={`font-semibold ${isPokok ? 'text-blue-900' : 'text-amber-900'}`}>
                                            {isPokok ? 'Tugas Pokok' : 'Tambahan'}
                                          </span>
                                        </td>
                                        <td className="py-1 px-2 border border-slate-300 print:border-black">
                                          <span className="font-semibold text-slate-900 block leading-tight">{t.title}</span>
                                          <span className="text-[9.5px] text-slate-600 block mt-0.5 leading-tight">{t.description}</span>
                                          {t.photoUrl && (
                                            <span className="text-[8.5px] text-blue-600 font-medium inline-block mt-0.5 no-print">📷 Ada bukti foto</span>
                                          )}
                                        </td>
                                        <td className="py-1 px-1.5 border border-slate-300 print:border-black">{t.location}</td>
                                        <td className="py-1 px-1.5 text-center border border-slate-300 print:border-black whitespace-nowrap font-mono text-[9px]">{t.timeStart} - {t.timeEnd}</td>
                                        <td className="py-1 px-1.5 border border-slate-300 print:border-black font-medium">{t.volumeUnit}</td>
                                        <td className="py-1 px-1.5 text-center border border-slate-300 print:border-black font-semibold uppercase text-[9px]">
                                          {t.status === 'selesai' ? (
                                            <span className="text-emerald-700">Selesai 100%</span>
                                          ) : (
                                            <span className="text-amber-700">Dalam Proses</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {isLastTaskChunk && relevantTasks.length > 0 && (
                                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400 print:bg-slate-200 print:border-black text-[9.5px]">
                                      <td colSpan={3} className="py-1 px-1.5 text-center font-bold">TOTAL REKAPITULASI</td>
                                      <td colSpan={4} className="py-1 px-2">
                                        {relevantTasks.length} Tugas Operasional Terlaksana ({tupoksiTasks.length} Tugas Pokok / {tambahanTasks.length} Tugas Tambahan)
                                      </td>
                                      <td className="py-1 px-1.5 text-center text-emerald-800 font-bold">
                                        {completedCount}/{relevantTasks.length} Tuntas
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Page Footer */}
                        <div className="pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                          <span>{schoolConfig.namaSekolah} · Laporan Kinerja Operator Layanan Operasional · Halaman {pageNum} dari {totalPages}</span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* ========================================================
                    LEMBAR LAMPIRAN II: SARANA PRASARANA (INVENTARIS) & FOTO
                    (TERPISAH BERSIH & RAPI AGAR TIDAK MENEKAN PENGESAHAN)
                    ======================================================== */}
                {(() => {
                  const invPageNum = 1 + subsequentTaskChunks.length + 1;
                  return (
                    <>
                      <div className="no-print flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-1">
                        <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Lembar {invPageNum} dari {totalPages} (Lampiran II: Sarana Prasarana & Dokumentasi Foto Bukti)</span>
                        </span>
                        <span className="text-[11px] text-slate-400">Standar A4 Kedinasan</span>
                      </div>

                      <div 
                        className={`print-page bg-white border border-slate-300 shadow-xl rounded-xl p-6 sm:p-8 text-slate-900 leading-normal flex flex-col justify-between print:border-none print:shadow-none print:p-0 min-h-[960px] sm:min-h-[1020px] print:min-h-0 ${
                          mobileFitScale ? 'w-full text-[11px]' : 'min-w-[720px] sm:min-w-0'
                        }`}
                        style={{ 
                          boxSizing: 'border-box'
                        }}
                      >
                        <div>
                          {/* KOP SURAT RESMI DI SETIAP LEMBAR LAMPIRAN */}
                          <KopSurat config={schoolConfig} isPrintVersion={true} className="mb-2" />

                          {/* SUB-HEADER IDENTITAS DOKUMEN */}
                          <div className="border-b border-slate-400 pb-1.5 mb-3 text-xs flex justify-between items-center font-semibold text-slate-700">
                            <span>{schoolConfig.namaSekolah} — Lampiran II: Sarana Prasarana & Dokumentasi</span>
                            <span className="font-mono text-[10.5px]">No: {nomorSurat}</span>
                          </div>

                          {/* KHUSUS PERPUSTAKAAN: REKAPITULASI & PERSENTASE PENAMBAHAN BUKU PER BULAN */}
                          {isPerpus && !isMonthly && (
                            <div className="my-2.5 text-xs break-inside-avoid">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase border-b border-slate-300 pb-1 mb-1.5 print:border-black">
                                III.A. REKAPITULASI & PERSENTASE PENAMBAHAN BUKU BARU PER BULAN (TAHUN ANGGARAN {annualYear})
                              </h4>
                              <p className="text-[10px] text-slate-600 mb-1.5">
                                Matriks pemantauan pertumbuhan dan persentase penambahan koleksi buku baru per bulan guna mengukur peningkatan secara berkala:
                              </p>

                              <div className="overflow-x-auto mb-3">
                                <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[10px]">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 print:bg-slate-200">
                                      <th className="py-1 px-1.5 text-center w-7 border border-slate-400">No</th>
                                      <th className="py-1 px-2 border border-slate-400">Bulan Pengadaan</th>
                                      <th className="py-1 px-2 text-center border border-slate-400">Judul Baru</th>
                                      <th className="py-1 px-2 text-center border border-slate-400">Eksemplar Masuk</th>
                                      <th className="py-1 px-2 text-center border border-slate-400">% Porsi dari Total Tahun</th>
                                      <th className="py-1 px-2 text-center border border-slate-400">Peningkatan vs Bln Lalu</th>
                                      <th className="py-1 px-2 text-center border border-slate-400">Akumulasi Koleksi</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {annualMonthlyBookStats.map((st) => (
                                      <tr key={st.monthNum} className="border-b border-slate-300">
                                        <td className="py-1 px-1.5 text-center font-mono border border-slate-300">{st.monthNum}</td>
                                        <td className="py-1 px-2 font-medium border border-slate-300">{st.monthName}</td>
                                        <td className="py-1 px-2 text-center font-mono border border-slate-300">{st.judulCount > 0 ? `${st.judulCount} judul` : '-'}</td>
                                        <td className="py-1 px-2 text-center font-bold font-mono border border-slate-300">{st.eksemplarCount > 0 ? `${st.eksemplarCount} eks` : '-'}</td>
                                        <td className="py-1 px-2 text-center font-mono font-semibold border border-slate-300">
                                          {st.percentShare > 0 ? `${st.percentShare.toFixed(1)}%` : '-'}
                                        </td>
                                        <td className="py-1 px-2 text-center font-mono text-[9.5px] border border-slate-300">
                                          <span className={st.trend === 'up' ? 'font-bold text-emerald-800' : st.trend === 'down' ? 'text-rose-700' : 'text-slate-500'}>
                                            {st.growthText}
                                          </span>
                                        </td>
                                        <td className="py-1 px-2 text-center font-mono border border-slate-300">{st.cumulative} eks</td>
                                      </tr>
                                    ))}
                                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400 print:bg-slate-200">
                                      <td colSpan={2} className="py-1 px-2 text-center font-bold">TOTAL PENAMBAHAN TAHUNAN</td>
                                      <td className="py-1 px-2 text-center font-mono">{annualMonthlyBookStats.reduce((s, m) => s + m.judulCount, 0)} judul</td>
                                      <td className="py-1 px-2 text-center font-mono text-blue-900 font-black">{annualMonthlyBookStats.reduce((s, m) => s + m.eksemplarCount, 0)} eks</td>
                                      <td className="py-1 px-2 text-center font-mono">100.0%</td>
                                      <td className="py-1 px-2 text-center text-[9px] font-semibold text-emerald-800">Pertumbuhan Tercatat</td>
                                      <td className="py-1 px-2 text-center font-mono">{annualMonthlyBookStats.reduce((s, m) => s + m.eksemplarCount, 0)} eks</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* KHUSUS PERPUSTAKAAN: LAMPIRAN KOLEKSI BUKU */}
                          {isPerpus && (
                            <div className="my-2 text-xs break-inside-avoid">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase border-b border-slate-300 pb-1 mb-1.5 print:border-black">
                                {isMonthly 
                                  ? `III. LAMPIRAN PENAMBAHAN BUKU BARU & PENGADAAN BULAN ${MONTH_NAMES[(monthlyData?.month || 9) - 1].toUpperCase()} ${monthlyData?.year || 2026}`
                                  : `III.B. LAMPIRAN KATALOG KOLEKSI BUKU PERPUSTAKAAN PER KELAS & MATA PELAJARAN`
                                }
                              </h4>
                              <p className="text-[10px] text-slate-600 mb-1.5 flex justify-between items-center">
                                <span>
                                  {isMonthly 
                                    ? `Daftar buku baru yang masuk / dibeli sekolah pada bulan berjalan (${monthlyNewBooks.length} judul / ${totalNewCopies} eks):`
                                    : `Rekapitulasi jumlah buku keseluruhan per kelas sesuai judul mata pelajaran (${libraryBooks.length} judul / ${totalAllBookCopies} eks):`
                                  }
                                </span>
                              </p>

                              {isMonthly ? (
                                /* TABEL BULANAN: BUKU BARU YANG MASUK */
                                <div className="overflow-x-auto mb-3">
                                  <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[10px]">
                                    <thead>
                                      <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 print:bg-slate-200">
                                        <th className="py-1 px-1.5 text-center w-7 border border-slate-400">No</th>
                                        <th className="py-1 px-2 border border-slate-400">Judul Buku</th>
                                        <th className="py-1 px-1.5 border border-slate-400">Pengarang / Penerbit</th>
                                        <th className="py-1 px-1.5 border border-slate-400 text-center">Kelas</th>
                                        <th className="py-1 px-1.5 border border-slate-400">DDC & Kategori</th>
                                        <th className="py-1 px-1.5 border border-slate-400 text-center">Tgl Masuk</th>
                                        <th className="py-1 px-1.5 border border-slate-400">Sumber Dana</th>
                                        <th className="py-1 px-1.5 text-center border border-slate-400 font-bold">Jml (Eks)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {monthlyNewBooks.length === 0 ? (
                                        <tr>
                                          <td colSpan={8} className="py-3 text-center text-slate-500 italic border border-slate-300">
                                            Pada bulan berjalan tidak ada penambahan buku baru yang masuk / dibeli. Seluruh koleksi terpelihara baik.
                                          </td>
                                        </tr>
                                      ) : (
                                        monthlyNewBooks.map((b, idx) => (
                                          <tr key={b.id} className="border-b border-slate-300">
                                            <td className="py-1 px-1.5 text-center font-mono border border-slate-300">{idx + 1}</td>
                                            <td className="py-1 px-2 border border-slate-300 font-semibold">{b.judul}</td>
                                            <td className="py-1 px-1.5 border border-slate-300 text-[9.5px]">{b.pengarang || b.penulis || '-'}</td>
                                            <td className="py-1 px-1.5 text-center border border-slate-300 font-medium">{b.kelas || '-'}</td>
                                            <td className="py-1 px-1.5 border border-slate-300">
                                              <span className="font-mono text-[9px] block text-blue-900">{b.ddcKlasifikasi || b.ddc || '-'}</span>
                                              <span className="text-[8.5px] text-slate-600 uppercase font-semibold">{b.statusBuku || b.kategori || 'Buku Teks'}</span>
                                            </td>
                                            <td className="py-1 px-1.5 text-center border border-slate-300 font-mono text-[9px]">{b.tanggalMasuk || '-'}</td>
                                            <td className="py-1 px-1.5 border border-slate-300 text-[9px]">{b.sumberPengadaan || 'Dana BOS'}</td>
                                            <td className="py-1 px-1.5 text-center font-bold border border-slate-300 text-emerald-900">{b.jumlah} eks</td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                    {monthlyNewBooks.length > 0 && (
                                      <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900">
                                        <tr>
                                          <td colSpan={7} className="py-1 px-2 text-right border border-slate-400 uppercase text-[9.5px]">
                                            Total Penambahan Buku Bulan Ini:
                                          </td>
                                          <td className="py-1 px-1.5 text-center font-mono text-emerald-900 font-black border border-slate-400">
                                            {totalNewCopies} eks
                                          </td>
                                        </tr>
                                      </tfoot>
                                    )}
                                  </table>
                                </div>
                              ) : (
                                /* TABEL TAHUNAN: KOMPILASI JUMLAH BUKU PER KELAS SESUAI JUDUL MATA PELAJARAN */
                                <div className="space-y-2 mb-3">
                                  {annualClassGroupedBooks.length === 0 ? (
                                    <div className="py-3 text-center text-slate-500 italic border border-slate-300 rounded">
                                      Belum ada data buku yang terdaftar.
                                    </div>
                                  ) : (
                                    <div className="border border-slate-400 rounded overflow-hidden">
                                      <table className="w-full text-left border-collapse text-[10px]">
                                        <thead>
                                          <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-400">
                                            <th className="py-1 px-2 text-center w-8 border-r border-slate-400">No</th>
                                            <th className="py-1 px-2 border-r border-slate-400">Mata Pelajaran / Judul Buku</th>
                                            <th className="py-1 px-2 border-r border-slate-400">Klasifikasi DDC & Kategori</th>
                                            <th className="py-1 px-2 text-center font-bold">Jumlah Eksemplar</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {annualClassGroupedBooks.map((clsGroup, grpIdx) => (
                                            <React.Fragment key={clsGroup.id}>
                                              {/* Header Per Kelas */}
                                              <tr className="bg-slate-100 border-t-2 border-b border-slate-300 font-bold">
                                                <td colSpan={3} className="py-1 px-2 text-slate-900 text-[10.5px] border-r border-slate-300">
                                                  📚 <span className="uppercase tracking-wide">{clsGroup.label}</span>
                                                  <span className="text-[9.5px] font-normal text-slate-600 ml-2">({clsGroup.totalJudul} Judul Mata Pelajaran)</span>
                                                </td>
                                                <td className="py-1 px-2 text-center font-mono text-blue-900 font-bold bg-blue-50/50">
                                                  Subtotal: {clsGroup.totalCopies} eks
                                                </td>
                                              </tr>

                                              {/* List Judul Buku Dalam Kelas Ini */}
                                              {clsGroup.subjects.map((sub, sIdx) => (
                                                <tr key={sIdx} className="border-b border-slate-200 hover:bg-slate-50/60">
                                                  <td className="py-0.5 px-2 text-center font-mono text-slate-500 border-r border-slate-200">
                                                    {sIdx + 1}
                                                  </td>
                                                  <td className="py-0.5 px-2 font-medium text-slate-900 border-r border-slate-200">
                                                    {sub.judul}
                                                  </td>
                                                  <td className="py-0.5 px-2 text-slate-600 border-r border-slate-200">
                                                    <span className="font-mono text-[9px] text-blue-800">{sub.ddc}</span> · <span className="text-[9px]">{sub.kategori}</span>
                                                  </td>
                                                  <td className="py-0.5 px-2 text-center font-bold font-mono text-slate-900">
                                                    {sub.totalEksemplar} eks
                                                  </td>
                                                </tr>
                                              ))}
                                            </React.Fragment>
                                          ))}
                                        </tbody>
                                        <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900">
                                          <tr>
                                            <td colSpan={3} className="py-1.5 px-3 text-right uppercase text-[10px] border-r border-slate-400">
                                              TOTAL SELURUH KOLEKSI BUKU PERPUSTAKAAN:
                                            </td>
                                            <td className="py-1.5 px-2 text-center font-mono text-emerald-900 font-black text-xs">
                                              {totalAllBookCopies} eks
                                            </td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* LAMPIRAN INVENTARIS SARANA PRASARANA KERJA */}
                          <div className="my-2 text-xs">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase border-b border-slate-300 pb-1 mb-1.5 print:border-black break-inside-avoid">
                              {isPerpus ? 'IV.' : 'III.'} LAMPIRAN DAFTAR INVENTARIS SARANA PRASARANA OPERASIONAL KERJA
                            </h4>
                            <p className="text-[10.5px] text-slate-600 mb-2">
                              Peralatan dinas pendukung operasional yang dipertanggungjawabkan kepada Operator Layanan Operasional ({roleTitle}):
                            </p>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[11px]">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 print:bg-slate-200">
                                    <th className="py-1 px-2 text-center w-8 border border-slate-400">No</th>
                                    <th className="py-1 px-2 border border-slate-400">Kode Barang</th>
                                    <th className="py-1 px-2.5 border border-slate-400">Nama Barang / Spesifikasi</th>
                                    <th className="py-1 px-2 text-center border border-slate-400">Jml</th>
                                    <th className="py-1 px-2 border border-slate-400">Kondisi</th>
                                    <th className="py-1 px-2 border border-slate-400">Lokasi Penempatan</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {roleInventories.length === 0 ? (
                                    <tr>
                                      <td colSpan={6} className="py-4 text-center text-slate-500 italic border border-slate-300">
                                        Belum ada catatan inventaris sarana prasarana.
                                      </td>
                                    </tr>
                                  ) : (
                                    roleInventories.slice(0, 8).map((item, idx) => (
                                      <tr key={item.id} className="border-b border-slate-300">
                                        <td className="py-1 px-2 text-center font-mono border border-slate-300">{idx + 1}</td>
                                        <td className="py-1 px-2 font-mono text-[10px] border border-slate-300">{item.kodeBarang}</td>
                                        <td className="py-1 px-2.5 border border-slate-300">
                                          <span className="font-semibold text-slate-900 block">{item.namaBarang}</span>
                                          <span className="text-[9.5px] text-slate-500 block">{item.merkModel}</span>
                                        </td>
                                        <td className="py-1 px-2 text-center font-semibold border border-slate-300">{item.jumlah} {item.satuan}</td>
                                        <td className="py-1 px-2 border border-slate-300">
                                          <span className={`text-[10px] font-bold ${
                                            item.kondisi === 'Baik' ? 'text-emerald-700' : 'text-amber-700'
                                          }`}>
                                            {item.kondisi}
                                          </span>
                                        </td>
                                        <td className="py-1 px-2 border border-slate-300 text-[10px]">{item.lokasiPenyimpanan}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* LAMPIRAN DOKUMENTASI FOTO (JIKA ADA BUKTI FOTO) */}
                          <div className="mt-4 pt-2 border-t border-slate-200 text-xs break-inside-avoid">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase border-b border-slate-300 pb-1 mb-2 print:border-black">
                              {isPerpus ? 'V.' : 'IV.'} LAMPIRAN DOKUMENTASI FOTO BUKTI PEKERJAAN LAPANGAN
                            </h4>
                            {tasksWithPhotos.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-2">
                                {tasksWithPhotos.slice(0, 4).map((t) => (
                                  <div key={t.id} className="border border-slate-300 p-2 rounded-lg bg-slate-50 print:bg-transparent print:border-black">
                                    <img 
                                      src={t.photoUrl} 
                                      alt={t.title} 
                                      className="w-full h-24 object-cover rounded border border-slate-200" 
                                    />
                                    <p className="font-bold text-[10px] text-slate-900 mt-1 truncate">{t.title}</p>
                                    <p className="text-[9px] text-slate-600 truncate">{t.date} · {t.location}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-500 text-[11px] italic">
                                Dokumentasi foto pendukung pekerjaan operasional tersimpan dalam sistem arsip digital satuan pendidikan.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Lembar Footer */}
                        <div className="pt-2.5 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                          <span>{schoolConfig.namaSekolah} · Laporan Kinerja Operator Layanan Operasional · Halaman {invPageNum} dari {totalPages}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* ========================================================
                    LEMBAR FINAL: LEMBAR PENGESAHAN RESMI (MANDIRI & 100% ANTI-TERPOTONG)
                    ======================================================== */}
                <div className="no-print flex items-center justify-between text-xs text-slate-500 font-semibold px-2 mb-1">
                  <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-300">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lembar {totalPages} dari {totalPages} (LEMBAR PENGESAHAN RESMI KEDINASAN - DIJAMIN UTUH)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Standar Naskah Dinas Permendikbud</span>
                </div>

                <div 
                  className={`print-page bg-white border-2 border-slate-300 shadow-xl rounded-xl p-5 sm:p-7 text-slate-900 leading-normal flex flex-col justify-between print:border-none print:shadow-none print:p-0 min-h-[960px] sm:min-h-[1020px] print:min-h-0 ${
                    mobileFitScale ? 'w-full text-[11px]' : 'min-w-[720px] sm:min-w-0'
                  }`}
                  style={{ 
                    boxSizing: 'border-box'
                  }}
                >
                  <div>
                    {/* KOP PENGESAHAN RESMI KEDINASAN */}
                    <KopSurat config={schoolConfig} isPrintVersion={true} />

                    {/* JUDUL LEMBAR PENGESAHAN */}
                    <div className="text-center my-2.5 break-inside-avoid">
                      <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 underline decoration-2 underline-offset-4">
                        LEMBAR PENGESAHAN RESMI
                      </h2>
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 mt-0.5">
                        LAPORAN {isMonthly ? 'BULANAN' : 'TAHUNAN'} KINERJA OPERATOR LAYANAN OPERASIONAL
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                        Bidang: {roleTitle.toUpperCase()} · Satuan Pendidikan: {schoolConfig.namaSekolah}
                      </p>
                      <p className="text-[10.5px] font-mono text-slate-600 mt-0.5">
                        Nomor Dokumen Pengesahan: {nomorSurat}
                      </p>
                    </div>

                    {/* PERNYATAAN PENGESAHAN KEDINASAN */}
                    <div className="my-2 p-2.5 bg-slate-50 border border-slate-300 rounded text-[11px] leading-relaxed text-slate-800 print:bg-transparent print:border-black break-inside-avoid">
                      <p className="text-justify indent-5">
                        Berdasarkan hasil pemeriksaan administratif, verifikasi faktual lapangan, serta evaluasi atas seluruh bukti rekapitulasi pelaksanaan tugas harian dan pemeliharaan sarana prasarana operasional di lingkungan {schoolConfig.namaSekolah}, maka laporan kinerja {isMonthly ? `Bulan ${MONTH_NAMES[(monthlyData?.month || 9) - 1]} Tahun ${monthlyData?.year || 2026}` : `Tahun Anggaran ${annualData?.year || 2026}`} ini dinyatakan <strong>TELAH MEMENUHI KETENTUAN STANDAR PELAYANAN MINIMAL (SPM)</strong>, disetujui, dan disahkan secara berjenjang sebagai dokumen akuntabilitas kedinasan yang sah dan dapat dipertanggungjawabkan.
                      </p>
                    </div>

                    {/* MATRIKS VERIFIKASI DATA LAPORAN */}
                    <div className="my-2 break-inside-avoid text-xs">
                      <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-[10.5px]">
                        <tbody>
                          <tr className="border-b border-slate-300">
                            <td className="w-44 py-0.5 px-2 font-semibold bg-slate-100 border-r border-slate-300 print:bg-slate-200">Nama Petugas Pelaksana</td>
                            <td className="py-0.5 px-2 font-bold text-slate-900">{displayOperatorNama}</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="py-0.5 px-2 font-semibold bg-slate-100 border-r border-slate-300 print:bg-slate-200">NIP / NIPPK</td>
                            <td className="py-0.5 px-2 font-mono text-slate-800">{displayOperatorNip}</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="py-0.5 px-2 font-semibold bg-slate-100 border-r border-slate-300 print:bg-slate-200">Jabatan Kedinasan</td>
                            <td className="py-0.5 px-2 text-slate-800">{operator.jabatan}</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="py-0.5 px-2 font-semibold bg-slate-100 border-r border-slate-300 print:bg-slate-200">Periode Evaluasi Kinerja</td>
                            <td className="py-0.5 px-2 font-semibold text-slate-800">
                              {isMonthly 
                                ? `Bulan ${MONTH_NAMES[(monthlyData?.month || 9) - 1]} Tahun ${monthlyData?.year || 2026}`
                                : `Tahun Anggaran ${annualData?.year || 2026}`}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-0.5 px-2 font-semibold bg-slate-100 border-r border-slate-300 print:bg-slate-200">Pejabat Pengesah (Penilai)</td>
                            <td className="py-0.5 px-2 font-bold text-slate-900">
                              {displayKepsekNama} ({displayKepsekNip})
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* LEMBAR PENGESAHAN RESMI (TANDA TANGAN & CAP STEMPEL BERSIH UTUH) */}
                    <div className="mt-1 pt-0.5 break-inside-avoid">
                      <OfficialApprovalSheet
                        config={schoolConfig}
                        role={role}
                        manualDate={manualDate}
                        onDateChange={(d) => setManualDate(d)}
                        isPrintVersion={false}
                      />
                    </div>
                  </div>

                  {/* Lembar Terakhir Page Footer */}
                  <div className="pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                    <span>{schoolConfig.namaSekolah} · Lembar Pengesahan Resmi Kedinasan · Halaman {totalPages} dari {totalPages} (Selesai)</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* ========================================================
          MODAL DIALOG: EDIT NOMOR SURAT KEDINASAN RESMI
          ======================================================== */}
      {isEditNomorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Sesuaikan Nomor Surat Kedinasan</h3>
                  <p className="text-[11px] text-slate-400">Atur nomor surat resmi sesuai buku agenda dinas satuan pendidikan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditNomorModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Nomor Surat Dokumen Resmi:
                </label>
                <input
                  type="text"
                  value={tempNomorSurat}
                  onChange={(e) => setTempNomorSurat(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                  placeholder="Contoh: 800/LAP-BLN/09/20202819/2026"
                />
                <p className="text-[10.5px] text-slate-500 mt-1">
                  Nomor ini akan otomatis tercantum pada kepala surat, lembar lampiran, dan lembar pengesahan resmi.
                </p>
              </div>

              {/* Quick Format Presets */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pilihan Rekomendasi Format Naskah Dinas:</span>
                </label>
                <div className="space-y-1.5">
                  {[
                    {
                      label: 'Standar Kepegawaian & Kinerja (Kode 800)',
                      val: `800/${isMonthly ? `LAP-BLN/${monthlyData?.month || 9}` : 'LAP-THN'}/${schoolConfig.npsn || '20202819'}/${new Date().getFullYear()}`
                    },
                    {
                      label: 'Format Urusan Satdik / Sekolah (Kode 421.2)',
                      val: `421.2/028/${(schoolConfig.npsn || 'SMP').replace(/\s+/g, '')}/${new Date().getFullYear()}`
                    },
                    {
                      label: `Format Tata Usaha & Layanan (${role})`,
                      val: `005/TU-${role}/${schoolConfig.npsn || '20202819'}/${new Date().getFullYear()}`
                    },
                    {
                      label: 'Format Perlengkapan & Sarpras (Kode 028)',
                      val: `028/SARPRAS-${role}/${schoolConfig.npsn || '20202819'}/${new Date().getFullYear()}`
                    }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTempNomorSurat(preset.val)}
                      className="w-full text-left p-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block text-[11px]">{preset.label}</span>
                        <span className="font-mono text-[10px] text-slate-500 group-hover:text-blue-700">{preset.val}</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Gunakan
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditNomorModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setNomorSurat(tempNomorSurat);
                  if (reportData) reportData.nomorSurat = tempNomorSurat;
                  setIsEditNomorModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Simpan & Terapkan Nomor Surat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
