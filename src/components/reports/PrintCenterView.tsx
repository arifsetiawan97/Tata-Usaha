import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoleType } from '../../types';
import { KopSurat } from '../common/KopSurat';
import { OfficialApprovalSheet } from '../common/OfficialApprovalSheet';
import {
  getTaskClassification,
  isTaskInMonth,
  isTaskInYear
} from '../../utils/taskClassification';
import {
  Printer,
  Calendar,
  Award,
  Boxes,
  FileSpreadsheet,
  SlidersHorizontal,
  RotateCcw,
  FileText,
  ExternalLink,
  Search
} from 'lucide-react';

type ReportKind = 'monthly' | 'annual' | 'inventory' | 'other';
type OtherDocKind = 'daily_journal' | 'tupoksi_list' | 'berita_acara' | 'library_books';

interface PrintCenterViewProps {
  onOpenFullDocument?: (
    reportType: 'monthly' | 'annual',
    reportData: any,
    options?: { autoPrint?: boolean }
  ) => void;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const ROLE_LABELS: Record<RoleType, string> = {
  TU: 'Tata Usaha (TU)',
  PENJAGA: 'Penjaga Sekolah',
  SERVICE: 'Layanan Kebersihan (Service)',
  PERPUS: 'Layanan Perpustakaan',
  LAB_IPA: 'Laboratorium IPA'
};

const formatDateShort = (raw?: string) => {
  if (!raw) return '-';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatStatusLabel = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'selesai') return 'Selesai';
  if (s === 'dalam_proses' || s === 'proses') return 'Dalam Proses';
  if (s === 'perlu_tindak_lanjut' || s === 'pending') return 'Perlu Tindak Lanjut';
  if (s === 'baik') return 'Baik';
  if (s === 'rusak_ringan' || s === 'rusak ringan') return 'Rusak Ringan';
  if (s === 'rusak_berat' || s === 'rusak berat') return 'Rusak Berat';
  return status || '-';
};

export const PrintCenterView: React.FC<PrintCenterViewProps> = ({ onOpenFullDocument }) => {
  const {
    currentRole,
    effectiveSchoolConfig: schoolConfig,
    tasks,
    inventories,
    tupoksiDefinitions,
    monthlyReports,
    annualReports,
    generateMonthlyReportFromTasks,
    generateAnnualReportFromMonthly,
    beritaAcaraHistory,
    libraryBooks,
    getCategoryLabel,
    customCategories,
    syncStatus
  } = useApp();

  const effectiveRole: RoleType = currentRole || 'TU';
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Active Report Selection
  const [selectedKind, setSelectedKind] = useState<ReportKind>('monthly');
  const [otherDocKind, setOtherDocKind] = useState<OtherDocKind>('daily_journal');

  // Parameter / Filter State
  const [filterMonth, setFilterMonth] = useState<number>(currentMonth);
  const [filterYear, setFilterYear] = useState<number>(currentYear);
  const [filterClassification, setFilterClassification] = useState<'all' | 'pokok' | 'tambahan'>('all');
  const [filterTaskStatus, setFilterTaskStatus] = useState<
    'all' | 'selesai' | 'dalam_proses' | 'perlu_tindak_lanjut'
  >('all');
  const [filterInventoryCondition, setFilterInventoryCondition] = useState<
    'all' | 'baik' | 'rusak_ringan' | 'rusak_berat'
  >('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Print Presentation Options
  const placeName = [schoolConfig.kabupatenKota, schoolConfig.desaKecamatan].filter(Boolean)[0] || '';
  const defaultDocDate = `${placeName ? `${placeName}, ` : ''}${now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })}`;
  const [docDate, setDocDate] = useState<string>(defaultDocDate);
  const [customDocNumber, setCustomDocNumber] = useState<string>('');
  const [showLetterhead, setShowLetterhead] = useState<boolean>(true);
  const [showApprovalSheet, setShowApprovalSheet] = useState<boolean>(true);

  const roleTasks = useMemo(
    () => tasks.filter(t => (t.role || '').toUpperCase() === effectiveRole),
    [tasks, effectiveRole]
  );

  const roleInventories = useMemo(
    () => inventories.filter(i => (i.role || '').toUpperCase() === effectiveRole),
    [inventories, effectiveRole]
  );

  const roleTupoksi = tupoksiDefinitions[effectiveRole] || {
    tupoksiList: [],
    tugasTambahanList: []
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear, currentYear - 1, currentYear + 1]);
    roleTasks.forEach(t => {
      const m = String(t.date || '').match(/(20\d{2})/);
      if (m) years.add(Number(m[1]));
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [roleTasks, currentYear]);

  // Filtered Datasets per Report Kind
  const filteredMonthlyTasks = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    return roleTasks.filter(t => {
      if (!isTaskInMonth(t.date, filterMonth, filterYear)) return false;
      const cls = getTaskClassification(effectiveRole, t.category, t.taskType, customCategories);
      if (filterClassification !== 'all' && cls !== filterClassification) return false;
      if (filterTaskStatus !== 'all' && (t.status || '').toLowerCase() !== filterTaskStatus) return false;
      if (q) {
        const hay = `${t.title} ${t.description || ''} ${t.location || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    roleTasks,
    filterMonth,
    filterYear,
    effectiveRole,
    customCategories,
    filterClassification,
    filterTaskStatus,
    searchKeyword
  ]);

  const filteredAnnualTasks = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    return roleTasks.filter(t => {
      if (!isTaskInYear(t.date, filterYear)) return false;
      const cls = getTaskClassification(effectiveRole, t.category, t.taskType, customCategories);
      if (filterClassification !== 'all' && cls !== filterClassification) return false;
      if (filterTaskStatus !== 'all' && (t.status || '').toLowerCase() !== filterTaskStatus) return false;
      if (q) {
        const hay = `${t.title} ${t.description || ''} ${t.location || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    roleTasks,
    filterYear,
    effectiveRole,
    customCategories,
    filterClassification,
    filterTaskStatus,
    searchKeyword
  ]);

  const annualMonthlyRecap = useMemo(() => {
    return MONTH_NAMES.map((monthName, idx) => {
      const mNum = idx + 1;
      const mTasks = filteredAnnualTasks.filter(t => isTaskInMonth(t.date, mNum, filterYear));
      const completed = mTasks.filter(t => t.status === 'selesai').length;
      const pokok = mTasks.filter(
        t => getTaskClassification(effectiveRole, t.category, t.taskType, customCategories) === 'pokok'
      ).length;
      const tambahan = mTasks.length - pokok;
      const pct = mTasks.length > 0 ? Math.round((completed / mTasks.length) * 100) : 0;
      return { monthName, total: mTasks.length, completed, pokok, tambahan, pct };
    });
  }, [filteredAnnualTasks, filterYear, effectiveRole, customCategories]);

  const filteredInventories = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    return roleInventories.filter(item => {
      const condNorm = (item.kondisi || '').toLowerCase().replace(/\s+/g, '_');
      if (filterInventoryCondition !== 'all' && condNorm !== filterInventoryCondition) return false;
      if (q) {
        const hay = `${item.namaBarang} ${item.kodeBarang} ${item.lokasiPenyimpanan || ''} ${item.keterangan || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [roleInventories, filterInventoryCondition, searchKeyword]);

  const filteredOtherRows = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    if (otherDocKind === 'daily_journal') {
      return roleTasks.filter(t => {
        if (filterMonth === 0) {
          if (!isTaskInYear(t.date, filterYear)) return false;
        } else if (!isTaskInMonth(t.date, filterMonth, filterYear)) {
          return false;
        }
        if (filterTaskStatus !== 'all' && (t.status || '').toLowerCase() !== filterTaskStatus) return false;
        if (q) {
          const hay = `${t.title} ${t.description || ''} ${t.location || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    }
    if (otherDocKind === 'berita_acara') {
      return (beritaAcaraHistory || []).filter(item => {
        if (!q) return true;
        return `${item.templateTitle || ''} ${item.nomorSurat || ''} ${item.ringkasan || ''} ${item.formValues?.pihakPertamaNama || ''} ${item.formValues?.pihakKeduaNama || ''}`
          .toLowerCase()
          .includes(q);
      });
    }
    if (otherDocKind === 'library_books') {
      return (libraryBooks || []).filter(book => {
        const condNorm = (book.kondisi || '').toLowerCase().replace(/\s+/g, '_');
        if (filterInventoryCondition !== 'all' && condNorm !== filterInventoryCondition) return false;
        if (q) {
          return `${book.judul} ${book.penulis} ${book.kodeBuku} ${book.lokasiRak}`
            .toLowerCase()
            .includes(q);
        }
        return true;
      });
    }
    // tupoksi_list
    const combined = [
      ...(roleTupoksi.tupoksiList || []).map((text, idx) => ({
        id: `pokok-${idx}`,
        type: 'Tugas Pokok',
        text
      })),
      ...(roleTupoksi.tugasTambahanList || []).map((text, idx) => ({
        id: `tambahan-${idx}`,
        type: 'Tugas Tambahan',
        text
      }))
    ];
    return combined.filter(item => {
      if (filterClassification === 'pokok' && item.type !== 'Tugas Pokok') return false;
      if (filterClassification === 'tambahan' && item.type !== 'Tugas Tambahan') return false;
      if (q && !item.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [
    otherDocKind,
    roleTasks,
    filterMonth,
    filterYear,
    filterTaskStatus,
    searchKeyword,
    beritaAcaraHistory,
    libraryBooks,
    filterInventoryCondition,
    roleTupoksi,
    filterClassification
  ]);

  const handleResetFilters = () => {
    setFilterMonth(currentMonth);
    setFilterYear(currentYear);
    setFilterClassification('all');
    setFilterTaskStatus('all');
    setFilterInventoryCondition('all');
    setSearchKeyword('');
    setCustomDocNumber('');
    setDocDate(defaultDocDate);
    setShowLetterhead(true);
    setShowApprovalSheet(true);
  };

  const handlePrintNow = () => {
    window.print();
  };

  const handleOpenA4Document = () => {
    if (!onOpenFullDocument) return;
    if (selectedKind === 'monthly') {
      const existing = monthlyReports.find(
        r => r.role === effectiveRole && r.month === filterMonth && r.year === filterYear
      );
      const data = existing || generateMonthlyReportFromTasks(effectiveRole, filterMonth, filterYear);
      onOpenFullDocument('monthly', data);
      return;
    }
    if (selectedKind === 'annual') {
      const existing = annualReports.find(
        r => r.role === effectiveRole && r.year === filterYear
      );
      const data = existing || generateAnnualReportFromMonthly(effectiveRole, filterYear);
      onOpenFullDocument('annual', data);
    }
  };

  const reportCards: Array<{
    id: ReportKind;
    title: string;
    subtitle: string;
    meta: string;
    icon: React.ElementType;
  }> = [
    {
      id: 'monthly',
      title: 'Laporan Bulanan',
      subtitle: 'Realisasi tugas pokok & tambahan per bulan',
      meta: `${MONTH_NAMES[filterMonth - 1]} ${filterYear} · ${filteredMonthlyTasks.length} tugas`,
      icon: Calendar
    },
    {
      id: 'annual',
      title: 'Laporan Tahunan',
      subtitle: 'Rekapitulasi kinerja 12 bulan & ketercapaian',
      meta: `Tahun ${filterYear} · ${filteredAnnualTasks.length} tugas`,
      icon: Award
    },
    {
      id: 'inventory',
      title: 'Laporan Inventaris',
      subtitle: 'Daftar sarpras, jumlah & kondisi barang',
      meta: `${ROLE_LABELS[effectiveRole]} · ${filteredInventories.length} item`,
      icon: Boxes
    },
    {
      id: 'other',
      title: 'Laporan Lainnya',
      subtitle: 'Jurnal harian, uraian tupoksi & arsip khusus',
      meta:
        effectiveRole === 'TU'
          ? 'Jurnal · Tupoksi · Berita Acara'
          : effectiveRole === 'PERPUS'
          ? 'Jurnal · Tupoksi · Koleksi Buku'
          : 'Jurnal Harian · Daftar Tupoksi',
      icon: FileSpreadsheet
    }
  ];

  // Resolved Document Title, Number & Row Count for the Preview
  const activeDocumentTitle =
    selectedKind === 'monthly'
      ? `LAPORAN PELAKSANAAN TUGAS BULANAN ${ROLE_LABELS[effectiveRole].toUpperCase()}`
      : selectedKind === 'annual'
      ? `LAPORAN REKAPITULASI KINERJA TAHUNAN ${ROLE_LABELS[effectiveRole].toUpperCase()}`
      : selectedKind === 'inventory'
      ? `DAFTAR INVENTARIS SARANA PRASARANA (${ROLE_LABELS[effectiveRole].toUpperCase()})`
      : otherDocKind === 'daily_journal'
      ? `JURNAL KEGIATAN HARIAN ${ROLE_LABELS[effectiveRole].toUpperCase()}`
      : otherDocKind === 'berita_acara'
      ? 'REKAPITULASI BERITA ACARA & PERSURATAN TATA USAHA'
      : otherDocKind === 'library_books'
      ? 'DAFTAR INVENTARIS KOLEKSI BUKU PERPUSTAKAAN'
      : `DAFTAR URAIAN TUGAS POKOK & TUGAS TAMBAHAN (${ROLE_LABELS[effectiveRole].toUpperCase()})`;

  const defaultAutoNumber = `800/${
    selectedKind === 'monthly'
      ? `LAP-BLN/${String(filterMonth).padStart(2, '0')}`
      : selectedKind === 'annual'
      ? 'LAP-THN'
      : selectedKind === 'inventory'
      ? 'KIR-SARPRAS'
      : 'LAP-OPS'
  }/${schoolConfig.npsn || 'SEKOLAH'}/${filterYear}`;

  const resolvedDocNumber = customDocNumber.trim() || defaultAutoNumber;

  const activePreviewRowCount =
    selectedKind === 'monthly'
      ? filteredMonthlyTasks.length
      : selectedKind === 'annual'
      ? annualMonthlyRecap.length
      : selectedKind === 'inventory'
      ? filteredInventories.length
      : filteredOtherRows.length;

  const isEmptyDataset =
    selectedKind === 'annual' ? filteredAnnualTasks.length === 0 : activePreviewRowCount === 0;

  return (
    <div className="space-y-5 print:space-y-0">
      {/* ================================================================= */}
      {/* 1. PAGE HEADER BAR (Hidden on Print)                              */}
      {/* ================================================================= */}
      <section className="no-print bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Pusat Cetak</span>
            <span aria-hidden="true">·</span>
            <span>{ROLE_LABELS[effectiveRole]}</span>
            <span aria-hidden="true">·</span>
            <span className={syncStatus === 'offline' ? 'text-rose-700 font-medium' : 'text-emerald-700 font-medium'}>
              {syncStatus === 'saving'
                ? 'Menyimpan...'
                : syncStatus === 'offline'
                ? 'Koneksi Terputus'
                : 'Data Tersinkronisasi'}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Pusat Cetak Laporan & Dokumen Resmi
          </h1>
          <p className="text-xs text-slate-600">
            Pilih jenis laporan, sesuaikan filter periode atau status, tinjau pratinjau dokumen, lalu cetak langsung dalam format A4 rapi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {(selectedKind === 'monthly' || selectedKind === 'annual') && onOpenFullDocument && (
            <button
              type="button"
              onClick={handleOpenA4Document}
              className="whitespace-nowrap shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Ekspor PDF / Word A4</span>
            </button>
          )}
          <button
            type="button"
            onClick={handlePrintNow}
            className="whitespace-nowrap shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Cetak / Print</span>
          </button>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. REPORT TYPE SELECTION CARDS (Hidden on Print)                  */}
      {/* ================================================================= */}
      <section aria-label="Pilihan Jenis Laporan" className="no-print grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {reportCards.map(card => {
          const Icon = card.icon;
          const isSelected = selectedKind === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedKind(card.id)}
              aria-pressed={isSelected}
              className={`text-left rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-white border-sky-600 ring-2 ring-sky-600/15'
                  : 'bg-white/95 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span
                    className={`text-[11px] font-semibold whitespace-nowrap ${
                      isSelected ? 'text-sky-700' : 'text-slate-400'
                    }`}
                  >
                    {isSelected ? 'Dipilih' : 'Pilih'}
                  </span>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900">{card.title}</h2>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{card.subtitle}</p>
                </div>
              </div>

              <p className="text-[11px] font-mono tabular-nums text-slate-500 pt-2 border-t border-slate-100 truncate">
                {card.meta}
              </p>
            </button>
          );
        })}
      </section>

      {/* ================================================================= */}
      {/* 3. PARAMETER/FILTER PANEL + LIVE PRINT PREVIEW SPLIT              */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start print:block print:m-0 print:p-0">
        {/* LEFT COLUMN: Filter & Parameter Settings (Hidden on Print) */}
        <aside className="no-print lg:col-span-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900">Pengaturan & Filter</h2>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Sub-type selector for Laporan Lainnya */}
          {selectedKind === 'other' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Jenis Dokumen Tambahan
              </label>
              <select
                value={otherDocKind}
                onChange={e => setOtherDocKind(e.target.value as OtherDocKind)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="daily_journal">Jurnal Tugas Harian (Periode)</option>
                <option value="tupoksi_list">Daftar Uraian Tupoksi Resmi</option>
                {effectiveRole === 'TU' && (
                  <option value="berita_acara">Rekap Berita Acara & Persuratan TU</option>
                )}
                {effectiveRole === 'PERPUS' && (
                  <option value="library_books">Inventaris Koleksi Buku Perpustakaan</option>
                )}
              </select>
            </div>
          )}

          {/* Month & Year Period Selectors */}
          {(selectedKind === 'monthly' ||
            (selectedKind === 'other' && otherDocKind === 'daily_journal')) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Periode Bulan</label>
                <select
                  value={filterMonth}
                  onChange={e => setFilterMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  {selectedKind === 'other' && <option value={0}>Semua Bulan</option>}
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Tahun</label>
                <select
                  value={filterYear}
                  onChange={e => setFilterYear(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {selectedKind === 'annual' && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Tahun Laporan</label>
              <select
                value={filterYear}
                onChange={e => setFilterYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>
                    Tahun {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Classification & Status Filters for Monthly / Annual / Tupoksi / Journal */}
          {(selectedKind === 'monthly' ||
            selectedKind === 'annual' ||
            (selectedKind === 'other' && otherDocKind === 'tupoksi_list')) && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Kategori Klasifikasi Tugas
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
                {(
                  [
                    { id: 'all', label: 'Semua' },
                    { id: 'pokok', label: 'Pokok' },
                    { id: 'tambahan', label: 'Tambahan' }
                  ] as const
                ).map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFilterClassification(opt.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      filterClassification === opt.id
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(selectedKind === 'monthly' ||
            selectedKind === 'annual' ||
            (selectedKind === 'other' && otherDocKind === 'daily_journal')) && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Status Pelaksanaan
              </label>
              <select
                value={filterTaskStatus}
                onChange={e =>
                  setFilterTaskStatus(
                    e.target.value as 'all' | 'selesai' | 'dalam_proses' | 'perlu_tindak_lanjut'
                  )
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">Semua Status</option>
                <option value="selesai">Selesai</option>
                <option value="dalam_proses">Dalam Proses</option>
                <option value="perlu_tindak_lanjut">Perlu Tindak Lanjut</option>
              </select>
            </div>
          )}

          {/* Inventory / Library Condition Filter */}
          {(selectedKind === 'inventory' ||
            (selectedKind === 'other' && otherDocKind === 'library_books')) && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Filter Kondisi Barang
              </label>
              <select
                value={filterInventoryCondition}
                onChange={e =>
                  setFilterInventoryCondition(
                    e.target.value as 'all' | 'baik' | 'rusak_ringan' | 'rusak_berat'
                  )
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">Semua Kondisi</option>
                <option value="baik">Baik</option>
                <option value="rusak_ringan">Rusak Ringan</option>
                <option value="rusak_berat">Rusak Berat</option>
              </select>
            </div>
          )}

          {/* Quick Keyword Filter */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Filter Kata Kunci
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="Cari uraian, nama barang, lokasi..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Document Number & Date */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Nomor Dokumen / Surat
              </label>
              <input
                type="text"
                value={customDocNumber}
                onChange={e => setCustomDocNumber(e.target.value)}
                placeholder={defaultAutoNumber}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Tempat & Tanggal Pengesahan
              </label>
              <input
                type="text"
                value={docDate}
                onChange={e => setDocDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLetterhead}
                  onChange={e => setShowLetterhead(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>Sertakan Kop Surat Resmi Sekolah</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showApprovalSheet}
                  onChange={e => setShowApprovalSheet(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>Sertakan Lembar Pengesahan TTD</span>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handlePrintNow}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan Sekarang</span>
            </button>
          </div>
        </aside>

        {/* RIGHT COLUMN: Live Compact Preview & Clean Printable Area */}
        <section
          aria-label="Pratinjau Dokumen Cetak"
          className="lg:col-span-8 print-page-container print:w-full print:m-0 print:p-0"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-7 shadow-xs print:border-0 print:shadow-none print:rounded-none print:p-0">
            {/* Preview Toolbar Bar (Hidden on Print) */}
            <div className="no-print flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FileText className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-slate-900">Pratinjau Cetak</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-mono">{activePreviewRowCount} baris</span>
                <span aria-hidden="true">·</span>
                <span>Kertas A4</span>
              </div>
              <button
                type="button"
                onClick={handlePrintNow}
                className="whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Cetak</span>
              </button>
            </div>

            {/* PRINTABLE REPORT DOCUMENT SHEET */}
            <div className="print-page text-slate-900 space-y-5 print:space-y-3">
              {showLetterhead && <KopSurat config={schoolConfig} isPrintVersion={true} />}

              {/* Document Title & Metadata */}
              <div className="text-center space-y-1 border-b border-slate-300 print:border-black pb-3">
                <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-slate-950 uppercase">
                  {activeDocumentTitle}
                </h2>
                <p className="text-xs font-mono text-slate-700 print:text-black">
                  Nomor: {resolvedDocNumber}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-600 print:text-black pt-0.5">
                  <span>Bidang: {ROLE_LABELS[effectiveRole]}</span>
                  <span>·</span>
                  <span>
                    Periode:{' '}
                    {selectedKind === 'monthly'
                      ? `${MONTH_NAMES[filterMonth - 1]} ${filterYear}`
                      : selectedKind === 'annual'
                      ? `Tahun ${filterYear}`
                      : selectedKind === 'other' && otherDocKind === 'daily_journal'
                      ? filterMonth === 0
                        ? `Tahun ${filterYear}`
                        : `${MONTH_NAMES[filterMonth - 1]} ${filterYear}`
                      : `Per ${docDate}`}
                  </span>
                </div>
              </div>

              {/* Compact Tabular Summary */}
              {selectedKind === 'monthly' && (
                <div className="grid grid-cols-3 border border-slate-300 print:border-black divide-x divide-slate-300 print:divide-black text-center text-xs">
                  <div className="p-2.5">
                    <p className="text-[11px] text-slate-500 print:text-black">Total Tugas</p>
                    <p className="text-base font-bold font-mono tabular-nums text-slate-950">
                      {filteredMonthlyTasks.length}
                    </p>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] text-slate-500 print:text-black">Tugas Selesai</p>
                    <p className="text-base font-bold font-mono tabular-nums text-slate-950">
                      {filteredMonthlyTasks.filter(t => t.status === 'selesai').length}
                    </p>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] text-slate-500 print:text-black">Capaian</p>
                    <p className="text-base font-bold font-mono tabular-nums text-slate-950">
                      {filteredMonthlyTasks.length > 0
                        ? `${Math.round(
                            (filteredMonthlyTasks.filter(t => t.status === 'selesai').length /
                              filteredMonthlyTasks.length) *
                              100
                          )}%`
                        : '0%'}
                    </p>
                  </div>
                </div>
              )}

              {selectedKind === 'annual' && (
                <div className="grid grid-cols-3 border border-slate-300 print:border-black divide-x divide-slate-300 print:divide-black text-center text-xs">
                  <div className="p-2.5">
                    <p className="text-[11px] text-slate-500 print:text-black">
                      Total Kegiatan ({filterYear})
                    </p>
                    <p className="text-base font-bold font-mono tabular-nums text-slate-950">
                      {filteredAnnualTasks.length}
                    </p>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] text-slate-500 print:text-black">Terealisasi Selesai</p>
                    <p className="text-base font-bold font-mono tabular-nums text-slate-950">
                      {filteredAnnualTasks.filter(t => t.status === 'selesai').length}
                    </p>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] text-slate-500 print:text-black">Rata-rata Capaian</p>
                    <p className="text-base font-bold font-mono tabular-nums text-slate-950">
                      {filteredAnnualTasks.length > 0
                        ? `${Math.round(
                            (filteredAnnualTasks.filter(t => t.status === 'selesai').length /
                              filteredAnnualTasks.length) *
                              100
                          )}%`
                        : '0%'}
                    </p>
                  </div>
                </div>
              )}

              {selectedKind === 'inventory' && (
                <div className="grid grid-cols-3 border border-slate-300 print:border-black divide-x divide-slate-300 print:divide-black text-center text-xs">
                  <div className="p-2.5">
                    <p className="text-[11px] text-slate-500 print:text-black">Jenis Barang</p>
                    <p className="text-base font-bold font-mono tabular-nums text-slate-950">
                      {filteredInventories.length}
                    </p>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] text-slate-500 print:text-black">Total Unit</p>
                    <p className="text-base font-bold font-mono tabular-nums text-slate-950">
                      {filteredInventories.reduce((acc, i) => acc + (Number(i.jumlah) || 0), 0)}
                    </p>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] text-slate-500 print:text-black">Kondisi Baik</p>
                    <p className="text-base font-bold font-mono tabular-nums text-slate-950">
                      {
                        filteredInventories.filter(
                          i => (i.kondisi || '').toLowerCase() === 'baik'
                        ).length
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Empty State (Visible on Screen when 0 matching records) */}
              {isEmptyDataset ? (
                <div className="py-10 px-4 text-center border border-dashed border-slate-300 rounded-xl space-y-2.5">
                  <p className="text-sm font-bold text-slate-800">
                    Tidak ada data yang sesuai dengan filter saat ini
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Coba ubah periode bulan/tahun, status pelaksanaan, atau hapus kata kunci pencarian pada panel pengaturan.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="no-print inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filter</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto print:overflow-visible">
                  {/* TABLE 1: MONTHLY REPORT */}
                  {selectedKind === 'monthly' && (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 print:bg-slate-200 text-slate-900">
                          <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-10">
                            No
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left whitespace-nowrap">
                            Tanggal
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Uraian Tugas / Kegiatan
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Klasifikasi
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Lokasi
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-center">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMonthlyTasks.map((task, idx) => {
                          const cls = getTaskClassification(
                            effectiveRole,
                            task.category,
                            task.taskType,
                            customCategories
                          );
                          return (
                            <tr key={task.id} className="hover:bg-slate-50/70">
                              <td className="border border-slate-300 print:border-black px-2 py-1.5 text-center font-mono tabular-nums">
                                {idx + 1}
                              </td>
                              <td className="border border-slate-300 print:border-black px-2.5 py-1.5 font-mono tabular-nums whitespace-nowrap">
                                {formatDateShort(task.date)}
                              </td>
                              <td className="border border-slate-300 print:border-black px-2.5 py-1.5">
                                <p className="font-semibold text-slate-900 print:text-black">
                                  {task.title}
                                </p>
                                {task.description && (
                                  <p className="text-[11px] text-slate-600 print:text-black mt-0.5">
                                    {task.description}
                                  </p>
                                )}
                              </td>
                              <td className="border border-slate-300 print:border-black px-2.5 py-1.5 whitespace-nowrap">
                                {cls === 'pokok' ? 'Tugas Pokok' : 'Tugas Tambahan'} (
                                {getCategoryLabel(task.category, effectiveRole)})
                              </td>
                              <td className="border border-slate-300 print:border-black px-2.5 py-1.5">
                                {task.location || '-'}
                              </td>
                              <td className="border border-slate-300 print:border-black px-2.5 py-1.5 text-center font-semibold whitespace-nowrap">
                                {formatStatusLabel(task.status)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* TABLE 2: ANNUAL REPORT (12-Month Breakdown) */}
                  {selectedKind === 'annual' && (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 print:bg-slate-200 text-slate-900">
                          <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-10">
                            No
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Bulan
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-right">
                            Tugas Pokok
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-right">
                            Tugas Tambahan
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-right">
                            Total Kegiatan
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-right">
                            Selesai
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-right">
                            Capaian (%)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {annualMonthlyRecap.map((row, idx) => (
                          <tr key={row.monthName} className="hover:bg-slate-50/70">
                            <td className="border border-slate-300 print:border-black px-2 py-1.5 text-center font-mono tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 font-semibold">
                              {row.monthName} {filterYear}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 text-right font-mono tabular-nums">
                              {row.pokok}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 text-right font-mono tabular-nums">
                              {row.tambahan}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 text-right font-mono tabular-nums font-semibold">
                              {row.total}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 text-right font-mono tabular-nums">
                              {row.completed}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 text-right font-mono tabular-nums font-bold">
                              {row.pct}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* TABLE 3: INVENTORY REPORT */}
                  {selectedKind === 'inventory' && (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 print:bg-slate-200 text-slate-900">
                          <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-10">
                            No
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left whitespace-nowrap">
                            Kode Barang
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Nama Sarpras / Alat
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-right">
                            Jumlah
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-center">
                            Kondisi
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Lokasi / Ruang
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Keterangan
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInventories.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/70">
                            <td className="border border-slate-300 print:border-black px-2 py-1.5 text-center font-mono tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 font-mono tabular-nums whitespace-nowrap">
                              {item.kodeBarang || '-'}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 font-semibold">
                              {item.namaBarang}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 text-right font-mono tabular-nums whitespace-nowrap">
                              {item.jumlah} {item.satuan || 'unit'}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 text-center whitespace-nowrap">
                              {formatStatusLabel(item.kondisi)}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5">
                              {item.lokasiPenyimpanan || '-'}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5">
                              {item.keterangan || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* TABLE 4: OTHER REPORTS */}
                  {selectedKind === 'other' && otherDocKind === 'daily_journal' && (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 print:bg-slate-200 text-slate-900">
                          <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-10">
                            No
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Tanggal
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Waktu
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Uraian Kegiatan
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Lokasi
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-center">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(filteredOtherRows as any[]).map((task, idx) => (
                          <tr key={task.id}>
                            <td className="border border-slate-300 print:border-black px-2 py-1.5 text-center font-mono tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 font-mono tabular-nums whitespace-nowrap">
                              {formatDateShort(task.date)}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 font-mono tabular-nums whitespace-nowrap">
                              {task.timeStart ? `${task.timeStart}${task.timeEnd ? ` - ${task.timeEnd}` : ''}` : '-'}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5">
                              <p className="font-semibold">{task.title}</p>
                              {task.description && (
                                <p className="text-[11px] text-slate-600 print:text-black mt-0.5">
                                  {task.description}
                                </p>
                              )}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5">
                              {task.location || '-'}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 text-center whitespace-nowrap">
                              {formatStatusLabel(task.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {selectedKind === 'other' && otherDocKind === 'tupoksi_list' && (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 print:bg-slate-200 text-slate-900">
                          <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-10">
                            No
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left w-36">
                            Jenis Tugas
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Uraian Tugas Pokok & Tugas Tambahan
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(filteredOtherRows as Array<{ id: string; type: string; text: string }>).map(
                          (item, idx) => (
                            <tr key={item.id}>
                              <td className="border border-slate-300 print:border-black px-2 py-1.5 text-center font-mono tabular-nums">
                                {idx + 1}
                              </td>
                              <td className="border border-slate-300 print:border-black px-2.5 py-1.5 font-semibold whitespace-nowrap">
                                {item.type}
                              </td>
                              <td className="border border-slate-300 print:border-black px-2.5 py-1.5">
                                {item.text}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  )}

                  {selectedKind === 'other' && otherDocKind === 'berita_acara' && (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 print:bg-slate-200 text-slate-900">
                          <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-10">
                            No
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Nomor Surat
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Judul Naskah / Berita Acara
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Tanggal
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Para Pihak
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(filteredOtherRows as any[]).map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="border border-slate-300 print:border-black px-2 py-1.5 text-center font-mono tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 font-mono">
                              {item.nomorSurat || '-'}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 font-semibold">
                              {item.templateTitle || 'Berita Acara TU'}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 font-mono tabular-nums whitespace-nowrap">
                              {formatDateShort(item.tanggalSurat || item.createdAt)}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5">
                              {[item.formValues?.pihakPertamaNama, item.formValues?.pihakKeduaNama]
                                .filter(Boolean)
                                .join(' / ') ||
                                item.ringkasan ||
                                '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {selectedKind === 'other' && otherDocKind === 'library_books' && (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 print:bg-slate-200 text-slate-900">
                          <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-10">
                            No
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left whitespace-nowrap">
                            Kode Buku
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Judul & Penulis
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-right">
                            Eks.
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-center">
                            Kondisi
                          </th>
                          <th className="border border-slate-300 print:border-black px-2.5 py-2 text-left">
                            Rak
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(filteredOtherRows as any[]).map((book, idx) => (
                          <tr key={book.id || idx}>
                            <td className="border border-slate-300 print:border-black px-2 py-1.5 text-center font-mono tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 font-mono tabular-nums">
                              {book.kodeBuku || '-'}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5">
                              <p className="font-semibold">{book.judul}</p>
                              <p className="text-[11px] text-slate-600 print:text-black">
                                {book.penulis} ({book.tahunTerbit})
                              </p>
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 text-right font-mono tabular-nums">
                              {book.jumlah}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5 text-center">
                              {formatStatusLabel(book.kondisi)}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2.5 py-1.5">
                              {book.lokasiRak || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Official Approval Sheet */}
              {showApprovalSheet && (
                <div className="print-keep-together pt-3">
                  <OfficialApprovalSheet
                    config={schoolConfig}
                    role={effectiveRole}
                    manualDate={docDate}
                    onDateChange={val => setDocDate(val)}
                    isPrintVersion={true}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
