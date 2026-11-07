import React, { useState, useMemo, useRef } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  Sparkles, 
  Search, 
  Calendar, 
  DollarSign, 
  Layers, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  X,
  Bookmark,
  Hash,
  Download,
  Filter,
  Upload,
  Image as ImageIcon,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LibraryBookItem, LibraryBookCategory, LibraryProcurementSource } from '../../types';
import { DDC_CATEGORIES } from '../../data/bookPresets';
import { formatOfficialNameWithDegree } from '../../utils/formatters';
import { KopSurat } from '../common/KopSurat';
import { 
  downloadBookExcelTemplate, 
  exportBooksToExcel, 
  parseBookExcelFile 
} from '../../utils/excelHelper';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const detectDdcFromTitle = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes('indonesia') || t.includes('tata bahasa') || t.includes('kamus') || t.includes('sastra')) {
    return '400 - Bahasa (Indonesia, Inggris, Arab, Daerah)';
  }
  if (t.includes('inggris') || t.includes('english')) {
    return '400 - Bahasa (Indonesia, Inggris, Arab, Daerah)';
  }
  if (t.includes('matematika') || t.includes('hitung') || t.includes('aljabar') || t.includes('geometri')) {
    return '500 - Sains Murni, IPA, Matematika & Biologi';
  }
  if (t.includes('ipa') || t.includes('biologi') || t.includes('fisika') || t.includes('kimia') || t.includes('sains') || t.includes('alam')) {
    return '500 - Sains Murni, IPA, Matematika & Biologi';
  }
  if (t.includes('agama') || t.includes('islam') || t.includes('budi pekerti') || t.includes('quran') || t.includes('akhlak') || t.includes('fiqih') || t.includes('kristen') || t.includes('katolik')) {
    return '200 - Agama (Islam, Kristen, Katolik, Hindu, Buddha, Konghucu)';
  }
  if (t.includes('ips') || t.includes('sosial') || t.includes('pancasila') || t.includes('ppkn') || t.includes('kewarganegaraan') || t.includes('ekonomi') || t.includes('hukum')) {
    return '300 - Ilmu Sosial, Kebijakan, Hukum & Pendidikan';
  }
  if (t.includes('komputer') || t.includes('informatika') || t.includes('digital') || t.includes('coding') || t.includes('teknologi')) {
    return '000 - Karya Umum, Komputer & Informasi';
  }
  if (t.includes('seni') || t.includes('budaya') || t.includes('musik') || t.includes('olahraga') || t.includes('pjok') || t.includes('penjas') || t.includes('lukis')) {
    return '700 - Kesenian, Olahraga, Hiburan & Musik';
  }
  if (t.includes('novel') || t.includes('cerita') || t.includes('dongeng') || t.includes('fiksi') || t.includes('pelangi') || t.includes('menara') || t.includes('cerpen') || t.includes('puisi')) {
    return '800 - Sastra, Puisi, Prosa, Fiksi & Cerita';
  }
  if (t.includes('sejarah') || t.includes('geografi') || t.includes('atlas') || t.includes('pahlawan') || t.includes('biografi') || t.includes('dunia')) {
    return '900 - Sejarah, Geografi & Biografi Tokoh';
  }
  if (t.includes('filsafat') || t.includes('psikologi') || t.includes('logika') || t.includes('etika')) {
    return '100 - Filsafat & Psikologi';
  }
  if (t.includes('terapan') || t.includes('mesin') || t.includes('listrik') || t.includes('pertanian') || t.includes('kesehatan') || t.includes('prakarya')) {
    return '600 - Teknologi, Terapan & Keterampilan Praktis';
  }
  return '000 - Karya Umum, Komputer & Informasi';
};

// Helper to reliably match book classes across variations (Kelas VII, Kelas VIII, Kelas IX, etc.)
export const matchBookClass = (book: LibraryBookItem, selectedClass: string): boolean => {
  if (!selectedClass || selectedClass === 'all') return true;

  const rawKelas = (book.kelas || '').trim();
  const rawJudul = (book.judul || '').trim();
  const rawStatus = (book.statusBuku || '').trim();
  const rawKategori = (book.kategoriBuku || book.kategori || '').trim();
  const combined = `${rawKelas} ${rawJudul} ${rawStatus} ${rawKategori}`.toLowerCase();

  if (selectedClass === 'Kelas VII') {
    if (combined.includes('vii-ix') || combined.includes('7-9') || combined.includes('7 - 9')) {
      return false;
    }
    return /\b(kelas\s*vii|kelas\s*7|\bvii\b|\b7\b)\b/i.test(rawKelas) ||
           /\b(kelas\s*vii|kelas\s*7)\b/i.test(rawJudul);
  }

  if (selectedClass === 'Kelas VIII') {
    return /\b(kelas\s*viii|kelas\s*8|\bviii\b|\b8\b)\b/i.test(rawKelas) ||
           /\b(kelas\s*viii|kelas\s*8)\b/i.test(rawJudul);
  }

  if (selectedClass === 'Kelas IX') {
    if (combined.includes('vii-ix') || combined.includes('7-9') || combined.includes('7 - 9')) {
      return false;
    }
    return /\b(kelas\s*ix|kelas\s*9|\bix\b|\b9\b)\b/i.test(rawKelas) ||
           /\b(kelas\s*ix|kelas\s*9)\b/i.test(rawJudul);
  }

  if (selectedClass === 'Kelas VII-IX (Umum)') {
    return combined.includes('vii-ix') || combined.includes('7-9') || combined.includes('7 - 9') || combined.includes('semua kelas');
  }

  if (selectedClass === 'Guru / Pendidik') {
    return combined.includes('guru') || combined.includes('pendidik') || combined.includes('panduan guru') || rawStatus === 'guru';
  }

  if (selectedClass === 'Umum / Referensi') {
    return combined.includes('referensi') || combined.includes('kamus') || combined.includes('ensiklopedia') || combined.includes('umum') || rawStatus === 'referensi' || rawStatus === 'umum';
  }

  return rawKelas.toLowerCase() === selectedClass.toLowerCase();
};

// Helper to robustly match book category across all variants (Buku Guru, Buku Referensi, Non-Fiksi, etc.)
export const matchBookCategory = (book: LibraryBookItem, selectedCategory: string): boolean => {
  if (!selectedCategory || selectedCategory === 'all') return true;

  const rawKategori = (book.kategoriBuku || book.kategori || '').toLowerCase().trim();
  const rawStatus = (book.statusBuku || '').toLowerCase().trim();
  const rawJudul = (book.judul || '').toLowerCase().trim();
  const rawDdc = (book.ddcKlasifikasi || book.ddc || '').toLowerCase().trim();
  const combined = `${rawKategori} ${rawStatus} ${rawJudul} ${rawDdc}`.toLowerCase();

  if (selectedCategory === 'Buku Guru') {
    return rawStatus === 'guru' ||
           combined.includes('guru') ||
           combined.includes('pendidik') ||
           combined.includes('panduan guru') ||
           combined.includes('pegangan guru') ||
           combined.includes('pedoman guru') ||
           rawKategori.includes('guru');
  }

  if (selectedCategory === 'Buku Referensi') {
    return rawStatus === 'referensi' ||
           combined.includes('referensi') ||
           combined.includes('rujukan') ||
           combined.includes('ensiklopedia') ||
           combined.includes('kamus') ||
           combined.includes('atlas') ||
           rawKategori.includes('referensi');
  }

  if (selectedCategory === 'Non-Fiksi') {
    return combined.includes('non-fiksi') ||
           combined.includes('non fiksi') ||
           combined.includes('nonfiksi') ||
           combined.includes('biografi') ||
           combined.includes('sejarah') ||
           combined.includes('sains') ||
           rawKategori.includes('non-fiksi') ||
           rawKategori.includes('non fiksi');
  }

  if (selectedCategory === 'Fiksi / Cerita') {
    if (combined.includes('non-fiksi') || combined.includes('non fiksi') || combined.includes('nonfiksi')) {
      return false;
    }
    return combined.includes('fiksi') ||
           combined.includes('cerita') ||
           combined.includes('novel') ||
           combined.includes('sastra') ||
           combined.includes('dongeng') ||
           combined.includes('cerpen') ||
           combined.includes('prosa') ||
           rawKategori.includes('fiksi');
  }

  if (selectedCategory === 'Buku Teks Utama') {
    return rawStatus === 'siswa' ||
           combined.includes('teks utama') ||
           combined.includes('buku teks') ||
           combined.includes('buku pelajaran') ||
           rawKategori.includes('teks');
  }

  if (selectedCategory === 'Buku Pengayaan') {
    return combined.includes('pengayaan') ||
           combined.includes('suplemen') ||
           rawKategori.includes('pengayaan');
  }

  if (selectedCategory === 'Kamus & Ensiklopedia') {
    return combined.includes('kamus') ||
           combined.includes('ensiklopedia') ||
           combined.includes('leksikon') ||
           rawKategori.includes('kamus') ||
           rawKategori.includes('ensiklopedia');
  }

  return rawKategori === selectedCategory.toLowerCase().trim();
};

export const LibraryBookManager: React.FC = () => {
  const { 
    libraryBooks, 
    addLibraryBook, 
    updateLibraryBook, 
    deleteLibraryBook, 
    deleteMultipleLibraryBooks,
    importLibraryBooks,
    schoolConfig,
    updateSchoolConfig
  } = useApp();

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'
  const [purchaseYearFilter, setPurchaseYearFilter] = useState<string>('all'); // 'all' or 'YYYY'
  const [tanggalMasukFilter, setTanggalMasukFilter] = useState<string>('all'); // 'all' or 'YYYY-MM-DD'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  // Print Document Options States (Tahun Beli, Tanggal Masuk, Berita Acara, Katalog Lengkap)
  const [printDocType, setPrintDocType] = useState<'berita_acara' | 'tahun_beli' | 'tanggal_masuk' | 'katalog_lengkap'>('berita_acara');
  const [printYearFilter, setPrintYearFilter] = useState<string>('all');
  const [printDateFilter, setPrintDateFilter] = useState<string>('');

  // Bulk Selection States
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Active book being edited or deleted
  const [activeBook, setActiveBook] = useState<LibraryBookItem | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<LibraryBookItem>>({
    kodeBuku: '',
    judul: '',
    penulis: '',
    penerbit: '',
    tahunTerbit: new Date().getFullYear(),
    isbn: '',
    kelas: 'Kelas VII',
    statusBuku: 'siswa',
    ddcKlasifikasi: '400 - Bahasa (Indonesia, Inggris, Arab, Daerah)',
    kategoriBuku: 'Buku Teks Utama',
    sumberPengadaan: 'BOS Reguler',
    tanggalMasuk: new Date().toISOString().split('T')[0],
    jumlah: 1,
    jumlahTersedia: 1,
    hargaSatuan: 0,
    lokasiRak: 'Rak Koleksi A-01',
    kondisi: 'Baik',
    keterangan: ''
  });

  // Keyboard shortcut: Escape to close Berita Acara
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isReportModalOpen) setIsReportModalOpen(false);
        if (isImportModalOpen) setIsImportModalOpen(false);
        if (isAddModalOpen) setIsAddModalOpen(false);
        if (isEditModalOpen) setIsEditModalOpen(false);
        if (isDeleteModalOpen) setIsDeleteModalOpen(false);
        if (isBulkDeleteModalOpen) setIsBulkDeleteModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReportModalOpen, isImportModalOpen, isAddModalOpen, isEditModalOpen, isDeleteModalOpen, isBulkDeleteModalOpen]);

  // State for CSV / Excel Data Import Modal
  const [importText, setImportText] = useState('');
  const [importDate, setImportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [importStatusNotice, setImportStatusNotice] = useState<string | null>(null);
  const [parsedExcelBooks, setParsedExcelBooks] = useState<Omit<LibraryBookItem, 'id'>[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [excelFileName, setExcelFileName] = useState<string>('');

  // Logo upload state for Berita Acara Kop Surat
  const fileInputKiriRef = useRef<HTMLInputElement>(null);
  const fileInputKananRef = useRef<HTMLInputElement>(null);

  // Helper to normalize month key "YYYY-MM"
  const getBookMonthKey = (book: LibraryBookItem): string => {
    if (typeof book.bulanPengadaan === 'string' && book.bulanPengadaan.includes('-')) {
      return book.bulanPengadaan;
    }
    if (book.tanggalMasuk && book.tanggalMasuk.length >= 7) {
      return book.tanggalMasuk.substring(0, 7);
    }
    const year = book.tahunPengadaan || new Date().getFullYear();
    const month = typeof book.bulanPengadaan === 'number' ? book.bulanPengadaan : (new Date().getMonth() + 1);
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  // Helper to format Month Key "2026-10" -> "Oktober 2026"
  const formatMonthLabel = (monthKey: string): string => {
    if (!monthKey || monthKey === 'all') return 'Semua Periode';
    const parts = monthKey.split('-');
    if (parts.length === 2) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${MONTH_NAMES[monthIdx]} ${year}`;
      }
    }
    return monthKey;
  };

  // Get all unique acquisition months present in the books data (dynamically adjusted when a year is selected)
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, number>();
    libraryBooks.forEach(book => {
      if (purchaseYearFilter !== 'all') {
        const bookYear = String(book.tahunBeli || book.tahunPengadaan || (book.tanggalMasuk ? book.tanggalMasuk.split('-')[0] : book.tahunTerbit));
        if (bookYear !== purchaseYearFilter) return;
      }
      const key = getBookMonthKey(book);
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    });
    // Sort descending (latest month first)
    const sorted = Array.from(monthMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    return sorted;
  }, [libraryBooks, purchaseYearFilter]);

  // Available Unique Tanggal Masuk (dynamically adjusted based on selected year/month)
  const availableTanggalMasuk = useMemo(() => {
    const dateSet = new Set<string>();
    libraryBooks.forEach(book => {
      if (purchaseYearFilter !== 'all') {
        const bookYear = String(book.tahunBeli || book.tahunPengadaan || (book.tanggalMasuk ? book.tanggalMasuk.split('-')[0] : book.tahunTerbit));
        if (bookYear !== purchaseYearFilter) return;
      }
      if (selectedMonth !== 'all') {
        const bookMonth = getBookMonthKey(book);
        if (bookMonth !== selectedMonth) return;
      }
      if (book.tanggalMasuk && book.tanggalMasuk.trim()) {
        dateSet.add(book.tanggalMasuk.trim());
      }
    });
    return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  }, [libraryBooks, purchaseYearFilter, selectedMonth]);

  // Filtered Books List
  const filteredBooks = useMemo(() => {
    return libraryBooks.filter(book => {
      // 1. Purchase Year Filter (e.g. 2025, 2026, 2024)
      if (purchaseYearFilter !== 'all') {
        const bookYear = String(book.tahunBeli || book.tahunPengadaan || (book.tanggalMasuk ? book.tanggalMasuk.split('-')[0] : book.tahunTerbit));
        if (bookYear !== purchaseYearFilter) return false;
      }

      // 2. Month filter (e.g. 2025-09)
      if (selectedMonth !== 'all') {
        const bookMonth = getBookMonthKey(book);
        if (bookMonth !== selectedMonth) return false;
      }

      // 3. Tanggal Masuk Filter (e.g. 2025-09-01)
      if (tanggalMasukFilter !== 'all') {
        const tm = (book.tanggalMasuk || '').trim();
        if (tm !== tanggalMasukFilter) return false;
      }

      // 4. Search Query (Intelligent multi-field: title, author, code, date text, month text, year, ddc)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (book.judul || '').toLowerCase().includes(q);
        const matchAuthor = (book.penulis || '').toLowerCase().includes(q);
        const matchPublisher = (book.penerbit || '').toLowerCase().includes(q);
        const matchCode = (book.kodeBuku || '').toLowerCase().includes(q);
        const matchIsbn = (book.isbn || '').toLowerCase().includes(q);
        const matchClass = (book.kelas || '').toLowerCase().includes(q);
        const matchCategory = (book.kategoriBuku || (book as any).kategori || '').toLowerCase().includes(q);
        const matchDdc = (book.ddcKlasifikasi || (book as any).ddc || '').toLowerCase().includes(q);
        const matchSource = (book.sumberPengadaan || '').toLowerCase().includes(q);
        const matchTanggal = (book.tanggalMasuk || '').toLowerCase().includes(q);
        const matchBulan = String(book.bulanPengadaan || '').toLowerCase().includes(q);
        const matchYear = String(book.tahunBeli || book.tahunPengadaan || (book.tanggalMasuk ? book.tanggalMasuk.split('-')[0] : '')).includes(q);

        // Also match formatted Indonesian textual date (e.g. "1 September 2025", "September 2025")
        let matchTextDate = false;
        if (book.tanggalMasuk && book.tanggalMasuk.includes('-')) {
          const parts = book.tanggalMasuk.split('-');
          if (parts.length === 3) {
            const mIdx = parseInt(parts[1], 10) - 1;
            if (mIdx >= 0 && mIdx < 12) {
              const mName = MONTH_NAMES[mIdx].toLowerCase();
              const fullFormatted = `${parseInt(parts[2], 10)} ${mName} ${parts[0]}`.toLowerCase();
              if (fullFormatted.includes(q) || mName.includes(q)) {
                matchTextDate = true;
              }
            }
          }
        }

        if (
          !matchTitle && 
          !matchAuthor && 
          !matchPublisher && 
          !matchCode && 
          !matchIsbn && 
          !matchClass && 
          !matchCategory && 
          !matchDdc && 
          !matchSource && 
          !matchTanggal && 
          !matchBulan && 
          !matchYear && 
          !matchTextDate
        ) {
          return false;
        }
      }

      // 5. Category filter with intelligent multi-match
      if (categoryFilter !== 'all') {
        if (!matchBookCategory(book, categoryFilter)) return false;
      }

      // 6. Source filter
      if (sourceFilter !== 'all') {
        if (book.sumberPengadaan !== sourceFilter) return false;
      }

      // 7. Class filter with robust intelligent matching (Kelas VII, VIII, IX, VII-IX, Guru, Umum)
      if (classFilter !== 'all') {
        if (!matchBookClass(book, classFilter)) return false;
      }

      return true;
    });
  }, [libraryBooks, purchaseYearFilter, selectedMonth, tanggalMasukFilter, searchQuery, categoryFilter, sourceFilter, classFilter]);

  // Available Purchase Years in Books
  const availablePurchaseYears = useMemo(() => {
    const years = new Set<string>();
    libraryBooks.forEach(b => {
      const y = b.tahunPengadaan || b.tahunBeli || (b.tanggalMasuk ? b.tanggalMasuk.split('-')[0] : b.tahunTerbit);
      if (y) years.add(String(y));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [libraryBooks]);

  // Filtered Books specifically for the Print Document Options Modal
  const printBooks = useMemo(() => {
    return libraryBooks.filter(book => {
      // 1. Tahun Beli Filter
      if (printDocType === 'tahun_beli' && printYearFilter !== 'all') {
        const y = String(book.tahunPengadaan || book.tahunBeli || (book.tanggalMasuk ? book.tanggalMasuk.split('-')[0] : book.tahunTerbit));
        if (y !== printYearFilter) return false;
      }

      // 2. Tanggal Masuk Filter
      if (printDocType === 'tanggal_masuk' && printDateFilter.trim()) {
        const tm = book.tanggalMasuk || '';
        if (!tm.startsWith(printDateFilter.trim())) return false;
      }

      // 3. Berita Acara (Month Filter)
      if (printDocType === 'berita_acara' && selectedMonth !== 'all') {
        const bookMonth = getBookMonthKey(book);
        if (bookMonth !== selectedMonth) return false;
      }

      return true;
    });
  }, [libraryBooks, printDocType, printYearFilter, printDateFilter, selectedMonth]);

  const printViewStats = useMemo(() => {
    const totalTitles = printBooks.length;
    const totalCopies = printBooks.reduce((sum, b) => sum + (Number(b.jumlah) || 0), 0);
    const totalValue = printBooks.reduce((sum, b) => {
      const price = Number(b.hargaSatuan) || 0;
      const qty = Number(b.jumlah) || 0;
      return sum + (price * qty);
    }, 0);
    return { totalTitles, totalCopies, totalValue };
  }, [printBooks]);

  // Statistics for Current View
  const currentViewStats = useMemo(() => {
    const totalTitles = filteredBooks.length;
    const totalCopies = filteredBooks.reduce((sum, b) => sum + (Number(b.jumlah) || 0), 0);
    const totalValue = filteredBooks.reduce((sum, b) => {
      const price = Number(b.hargaSatuan) || 0;
      const qty = Number(b.jumlah) || 0;
      return sum + (price * qty);
    }, 0);

    const sourceBreakdown: Record<string, { count: number; value: number }> = {};
    filteredBooks.forEach(b => {
      const src = String(b.sumberPengadaan || 'Lainnya');
      if (!sourceBreakdown[src]) {
        sourceBreakdown[src] = { count: 0, value: 0 };
      }
      sourceBreakdown[src].count += Number(b.jumlah) || 0;
      sourceBreakdown[src].value += (Number(b.hargaSatuan) || 0) * (Number(b.jumlah) || 0);
    });

    return { totalTitles, totalCopies, totalValue, sourceBreakdown };
  }, [filteredBooks]);

  // Open Add Modal
  const handleOpenAdd = () => {
    const nextCodeNum = libraryBooks.length + 1;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toISOString().split('T')[0];
    setFormData({
      kodeBuku: `BK-${currentYear}-${String(nextCodeNum).padStart(3, '0')}`,
      judul: '',
      penulis: '',
      penerbit: '',
      tahunTerbit: currentYear,
      tahunBeli: currentYear,
      isbn: '',
      kelas: 'Kelas VII',
      statusBuku: 'siswa',
      ddcKlasifikasi: '400 - Bahasa (Indonesia, Inggris, Arab, Daerah)',
      kategoriBuku: 'Buku Teks Utama',
      sumberPengadaan: 'BOS Reguler',
      tanggalMasuk: currentMonth,
      jumlah: 30,
      jumlahTersedia: 30,
      hargaSatuan: 0,
      lokasiRak: 'Ruang Perpustakaan',
      kondisi: 'Baik',
      keterangan: ''
    });
    setIsAddModalOpen(true);
  };

  // Submit Add Book
  const handleSaveNewBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul?.trim()) return;

    const tahunBeliNum = Number(formData.tahunBeli) || (formData.tanggalMasuk ? parseInt(formData.tanggalMasuk.split('-')[0], 10) : Number(formData.tahunTerbit) || new Date().getFullYear());
    let tgl = formData.tanggalMasuk || `${tahunBeliNum}-01-01`;
    if (tgl.includes('-')) {
      const parts = tgl.split('-');
      if (parts[0] !== String(tahunBeliNum)) {
        tgl = `${tahunBeliNum}-${parts[1] || '01'}-${parts[2] || '01'}`;
      }
    }
    const monthKey = tgl.substring(0, 7);
    const yearNum = tahunBeliNum;

    addLibraryBook({
      kodeBuku: formData.kodeBuku || `BK-${yearNum}-${Date.now().toString().slice(-4)}`,
      judul: formData.judul.trim(),
      penulis: formData.penulis?.trim() || 'Tim Penyusun',
      penerbit: formData.penerbit?.trim() || 'Kemendikbudristek',
      tahunTerbit: Number(formData.tahunTerbit) || yearNum,
      tahunBeli: yearNum,
      isbn: '',
      kelas: formData.kelas || 'Umum',
      statusBuku: formData.statusBuku || 'siswa',
      ddcKlasifikasi: formData.ddcKlasifikasi || '000 - Karya Umum, Komputer & Informasi',
      kategoriBuku: formData.kategoriBuku || 'Buku Teks Utama',
      sumberPengadaan: formData.sumberPengadaan || 'BOS Reguler',
      tanggalMasuk: tgl,
      bulanPengadaan: monthKey,
      tahunPengadaan: yearNum,
      jumlah: Number(formData.jumlah) || 1,
      jumlahTersedia: Number(formData.jumlahTersedia) || Number(formData.jumlah) || 1,
      hargaSatuan: Number(formData.hargaSatuan) || 0,
      totalHarga: (Number(formData.hargaSatuan) || 0) * (Number(formData.jumlah) || 1),
      lokasiRak: 'Ruang Perpustakaan',
      kondisi: formData.kondisi || 'Baik',
      keterangan: ''
    });

    setIsAddModalOpen(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (book: LibraryBookItem) => {
    setActiveBook(book);
    const yr = Number(book.tahunBeli || book.tahunPengadaan || (book.tanggalMasuk ? parseInt(book.tanggalMasuk.split('-')[0], 10) : book.tahunTerbit)) || 2026;
    setFormData({
      ...book,
      tahunBeli: yr,
      tahunPengadaan: yr,
      tanggalMasuk: book.tanggalMasuk || `${yr}-01-01`,
      kelas: book.kelas || 'Kelas VII',
      statusBuku: book.statusBuku || 'siswa',
      kategoriBuku: (book.kategoriBuku || book.kategori || 'Buku Teks Utama') as LibraryBookCategory,
      ddcKlasifikasi: book.ddcKlasifikasi || book.ddc || '000 - Karya Umum, Komputer & Informasi'
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Book
  const handleSaveEditBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBook || !formData.judul?.trim()) return;

    const tahunBeliNum = Number(formData.tahunBeli) || (formData.tanggalMasuk ? parseInt(formData.tanggalMasuk.split('-')[0], 10) : Number(formData.tahunTerbit) || new Date().getFullYear());
    let tgl = formData.tanggalMasuk || activeBook.tanggalMasuk || `${tahunBeliNum}-01-01`;
    if (tgl.includes('-')) {
      const parts = tgl.split('-');
      if (parts[0] !== String(tahunBeliNum)) {
        tgl = `${tahunBeliNum}-${parts[1] || '01'}-${parts[2] || '01'}`;
      }
    }
    const monthKey = tgl.substring(0, 7);
    const yearNum = tahunBeliNum;

    updateLibraryBook(activeBook.id, {
      ...formData,
      tanggalMasuk: tgl,
      bulanPengadaan: monthKey,
      tahunPengadaan: yearNum,
      tahunBeli: yearNum,
      jumlah: Number(formData.jumlah) || 1,
      jumlahTersedia: Number(formData.jumlahTersedia) || Number(formData.jumlah) || 1,
      hargaSatuan: Number(formData.hargaSatuan) || 0,
      totalHarga: (Number(formData.hargaSatuan) || 0) * (Number(formData.jumlah) || 1)
    });

    setIsEditModalOpen(false);
    setActiveBook(null);
  };

  // Open Delete Confirmation
  const handleOpenDelete = (book: LibraryBookItem) => {
    setActiveBook(book);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Book
  const handleConfirmDelete = () => {
    if (activeBook) {
      deleteLibraryBook(activeBook.id);
      setIsDeleteModalOpen(false);
      setActiveBook(null);
    }
  };

  // Auto DDC button trigger for active form
  const handleTriggerAutoDdc = () => {
    if (formData.judul) {
      const detected = detectDdcFromTitle(formData.judul);
      setFormData(prev => ({ ...prev, ddcKlasifikasi: detected }));
    }
  };

  // Handle Logo Upload Kiri
  const handleLogoKiriChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        updateSchoolConfig({
          logoKopKiri: base64,
          logoKabupatenUrl: base64
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Logo Upload Kanan
  const handleLogoKananChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        updateSchoolConfig({
          logoKopKanan: base64,
          logoSekolahUrl: base64
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate & Download Template CSV (Excel Compatible with UTF-8 BOM)
  const handleDownloadCsvTemplate = () => {
    const headers = [
      'Kode Buku',
      'Judul Buku *',
      'Kelas',
      'Penulis / Pengarang',
      'Penerbit',
      'Tahun Terbit',
      'Tahun Pembelian',
      'Tanggal Masuk (YYYY-MM-DD)',
      'DDC Klasifikasi',
      'Kategori Buku',
      'Status Buku (siswa/guru/referensi/umum)',
      'Sumber Pengadaan',
      'Jumlah Eksemplar *',
      'Harga Satuan (Rp)',
      'Kondisi'
    ];
    const sampleRows = [
      [
        'BK-2026-001',
        'Informatika untuk SMP/MTs Kelas VII',
        'Kelas VII',
        'Maresha Caroline Wijanto, dkk.',
        'Pusat Perbukuan Kemdikbudristek',
        '2024',
        '2026',
        '2026-08-10',
        '000 - Karya Umum, Komputer & Informasi',
        'Buku Teks Utama',
        'siswa',
        'BOS Reguler',
        '60',
        '32000',
        'Baik'
      ],
      [
        'BK-2026-002',
        'Bahasa Indonesia: Bergerak Bersama Kelas VII',
        'Kelas VII',
        'Rakhma Subarna, dkk.',
        'Pusat Perbukuan Kemdikbudristek',
        '2024',
        '2026',
        '2026-08-10',
        '400 - Bahasa (Indonesia, Inggris, Arab, Daerah)',
        'Buku Teks Utama',
        'siswa',
        'BOS Reguler',
        '60',
        '28500',
        'Baik'
      ],
      [
        'BK-2026-003',
        'Matematika untuk SMP/MTs Kelas VII',
        'Kelas VII',
        'Tim Gakko Tosho',
        'Pusat Perbukuan Kemdikbudristek',
        '2024',
        '2026',
        '2026-09-05',
        '500 - Sains Murni, IPA, Matematika & Biologi',
        'Buku Teks Utama',
        'siswa',
        'BOS Reguler',
        '60',
        '33000',
        'Baik'
      ],
      [
        'BK-2026-004',
        'Buku Panduan Guru: Pendidikan Pancasila SMP Kelas VII',
        'Kelas VII',
        'Zaim Uchrowi, dkk.',
        'Pusat Perbukuan Kemdikbudristek',
        '2024',
        '2026',
        '2026-09-12',
        '300 - Ilmu Sosial, Kebijakan, Hukum & Pendidikan',
        'Buku Guru',
        'guru',
        'BOS Kinerja',
        '5',
        '45000',
        'Baik'
      ],
      [
        'BK-2026-005',
        'Si Putih: Kisah Kucing Pemberani',
        'Kelas VII-IX (Umum)',
        'Tere Liye',
        'Gramedia Pustaka Utama',
        '2023',
        '2026',
        '2026-10-02',
        '800 - Sastra, Puisi, Prosa, Fiksi & Cerita',
        'Fiksi / Cerita',
        'umum',
        'BOS Kinerja',
        '15',
        '65000',
        'Baik'
      ],
      [
        'BK-2026-006',
        'Ensiklopedia Sains: Mengenal Alam Semesta',
        'Umum / Referensi',
        'Tim Peneliti LIPI',
        'Balai Pustaka',
        '2023',
        '2026',
        '2026-10-18',
        '500 - Sains Murni, IPA, Matematika & Biologi',
        'Kamus & Ensiklopedia',
        'referensi',
        'Hibah / Bantuan',
        '8',
        '125000',
        'Baik'
      ]
    ];

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...sampleRows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Template_Impor_Buku_Perpustakaan_Excel_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Native Microsoft Excel (.xlsx) Template with Formatted Columns & Guide
  const handleDownloadExcelTemplate = () => {
    downloadBookExcelTemplate();
  };

  // Export Current Books Catalog to Native Excel (.xlsx)
  const handleExportAllBooksExcel = () => {
    exportBooksToExcel(filteredBooks, `Katalog_Buku_Perpustakaan_${selectedMonth !== 'all' ? selectedMonth : 'Semua'}`);
  };

  // Handle Excel (.xlsx, .xls, .csv) File Upload & Auto-Parsing
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsingExcel(true);
      setExcelFileName(file.name);
      setImportStatusNotice(`Membaca dan memetakan kolom dari ${file.name}...`);
      
      const parsed = await parseBookExcelFile(file, importDate, libraryBooks.length);
      if (parsed.length > 0) {
        setParsedExcelBooks(parsed);
        setImportStatusNotice(`Berhasil membaca ${parsed.length} judul buku dari berkas "${file.name}". Periksa pratinjau di bawah dan klik "Simpan & Masukkan ke Katalog" untuk konfirmasi.`);
      } else {
        setParsedExcelBooks([]);
        setImportStatusNotice('Tidak ditemukan baris data buku yang valid. Pastikan judul buku terisi pada kolom template.');
      }
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      setImportStatusNotice('Gagal membaca berkas Excel. Pastikan format file adalah .xlsx, .xls, atau .csv yang valid.');
    } finally {
      setIsParsingExcel(false);
      // Reset input value so same file can be re-uploaded if modified
      e.target.value = '';
    }
  };

  // Commit Parsed Excel Books
  const handleCommitParsedExcelImport = () => {
    if (parsedExcelBooks.length === 0) return;

    // Detect unique years and months from the parsed books
    const importedYears = Array.from(new Set(
      parsedExcelBooks.map(b => String(b.tahunBeli || b.tahunPengadaan || (b.tanggalMasuk ? b.tanggalMasuk.split('-')[0] : ''))).filter(Boolean)
    ));
    const importedMonths = Array.from(new Set(
      parsedExcelBooks.map(b => b.bulanPengadaan || (b.tanggalMasuk ? b.tanggalMasuk.substring(0, 7) : '')).filter(Boolean)
    ));
    const importedDates = Array.from(new Set(
      parsedExcelBooks.map(b => b.tanggalMasuk).filter(Boolean)
    ));

    importLibraryBooks(parsedExcelBooks);

    // Automatically set filter so newly imported books are immediately visible
    if (importedYears.length === 1) {
      setPurchaseYearFilter(String(importedYears[0]));
    } else {
      setPurchaseYearFilter('all');
    }

    if (importedMonths.length === 1) {
      setSelectedMonth(String(importedMonths[0]));
    } else {
      setSelectedMonth('all');
    }

    if (importedDates.length === 1) {
      setTanggalMasukFilter(String(importedDates[0]));
    } else {
      setTanggalMasukFilter('all');
    }

    setIsImportModalOpen(false);
    setParsedExcelBooks([]);
    setExcelFileName('');
    setImportStatusNotice(null);
  };

  // Bulk Selection Handlers
  const handleToggleSelectAllBooks = () => {
    if (selectedBookIds.length === filteredBooks.length && filteredBooks.length > 0) {
      setSelectedBookIds([]);
    } else {
      setSelectedBookIds(filteredBooks.map(b => b.id));
    }
  };

  const handleToggleSelectBook = (id: string) => {
    setSelectedBookIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDeleteBooks = () => {
    if (selectedBookIds.length > 0) {
      deleteMultipleLibraryBooks(selectedBookIds);
      setSelectedBookIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  // Load Sample Data for Import
  const handleLoadSampleImportData = () => {
    const sample = `Informatika SMP Kelas VII,Kelas VII,Maresha Caroline,Kemdikbud,2024,978-602-244-428-2,Buku Teks Utama,siswa,BOS Reguler,60,32000,Rak A-01
Pendidikan Agama Islam dan Budi Pekerti Kelas VII,Kelas VII,Muhammad Ahsan,Kemdikbud,2024,978-602-244-315-5,Buku Teks Utama,siswa,BOS Reguler,60,29000,Rak A-02
Si Putih: Kisah Kucing Pemberani,Kelas VII-IX (Umum),Tere Liye,Gramedia,2023,978-602-065-214-3,Fiksi / Cerita,umum,BOS Kinerja,15,65000,Rak Fiksi B-01
Ensiklopedia Sains: Mengenal Alam Semesta,Umum / Referensi,Tim Peneliti LIPI,Balai Pustaka,2023,978-979-083-441-2,Kamus & Ensiklopedia,referensi,Hibah / Bantuan,8,125000,Rak Referensi C-01`;
    setImportText(sample);
    setImportStatusNotice('Contoh data impor berhasil dimuat ke teks formulir!');
  };

  // Commit Import
  const handleCommitImport = () => {
    if (!importText.trim()) return;

    // Remove BOM and split lines
    const cleanText = importText.replace(/^\uFEFF/, '').trim();
    const rawLines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const monthKey = importDate.substring(0, 7);
    const yearNum = parseInt(importDate.substring(0, 4), 10) || new Date().getFullYear();

    const newBooks: Omit<LibraryBookItem, 'id'>[] = [];

    // Delimiter parser helper
    const parseImportLine = (line: string): string[] => {
      const delimiter = line.includes('\t') ? '\t' : (line.includes(';') ? ';' : ',');
      const tokens: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === delimiter && !inQuotes) {
          tokens.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      tokens.push(cur.trim());
      return tokens;
    };

    rawLines.forEach((line) => {
      const parts = parseImportLine(line);
      if (parts.length >= 2) {
        let judul = parts[0]?.replace(/^"|"$/g, '').trim();
        // If first token is header, skip
        if (!judul || judul.toLowerCase().startsWith('judul') || judul.toLowerCase().startsWith('kode buku')) return;

        // If first column happens to be 'Kode Buku' (e.g. BK-2026-001) and second is title:
        let kelas = 'Kelas VII';
        let penulis = 'Tim Penyusun';
        let penerbit = 'Kemendikbudristek';
        let tahunTerbit = yearNum;
        let isbn = '';
        let kategoriBuku: LibraryBookCategory = 'Buku Teks Utama';
        let statusBuku: any = 'siswa';
        let sumberPengadaan: LibraryProcurementSource = 'BOS Reguler';
        let jumlah = 30;
        let hargaSatuan = 0;
        let lokasiRak = 'Rak Koleksi';

        if (parts[0].startsWith('BK-') && parts.length > 2) {
          // Columns: [0: Kode, 1: Judul, 2: Kelas, 3: Penulis, 4: Penerbit, 5: Tahun, 6: ISBN, 7: DDC, 8: Kategori, 9: Status, 10: Sumber, 11: Jumlah, 12: Harga, 13: Rak, 14: Keterangan]
          judul = parts[1] || 'Buku Perpustakaan';
          kelas = parts[2] || 'Kelas VII';
          penulis = parts[3] || 'Tim Penyusun';
          penerbit = parts[4] || 'Kemendikbudristek';
          tahunTerbit = parseInt(parts[5], 10) || yearNum;
          isbn = parts[6] || '';
          kategoriBuku = (parts[8] as LibraryBookCategory) || 'Buku Teks Utama';
          statusBuku = parts[9] || 'siswa';
          sumberPengadaan = (parts[10] as LibraryProcurementSource) || 'BOS Reguler';
          jumlah = parseInt(parts[11], 10) || 30;
          hargaSatuan = parseInt(parts[12]?.replace(/\D/g, ''), 10) || 0;
          lokasiRak = parts[13] || 'Rak Koleksi';
        } else {
          kelas = parts[1] || 'Kelas VII';
          penulis = parts[2] || 'Tim Penyusun';
          penerbit = parts[3] || 'Kemendikbudristek';
          tahunTerbit = parseInt(parts[4], 10) || yearNum;
          isbn = parts[5] || '';
          kategoriBuku = (parts[6] as LibraryBookCategory) || 'Buku Teks Utama';
          statusBuku = parts[7] || 'siswa';
          sumberPengadaan = (parts[8] as LibraryProcurementSource) || 'BOS Reguler';
          jumlah = parseInt(parts[9], 10) || 30;
          hargaSatuan = parseInt(parts[10]?.replace(/\D/g, ''), 10) || 0;
          lokasiRak = parts[11] || 'Rak Koleksi';
        }

        const codeSuffix = String(libraryBooks.length + newBooks.length + 1).padStart(3, '0');
        const detectedDdc = detectDdcFromTitle(judul);

        newBooks.push({
          kodeBuku: `BK-${yearNum}-${codeSuffix}`,
          judul,
          penulis,
          penerbit,
          tahunTerbit,
          isbn,
          kelas,
          statusBuku,
          ddcKlasifikasi: detectedDdc,
          kategoriBuku,
          sumberPengadaan,
          tanggalMasuk: importDate,
          bulanPengadaan: monthKey,
          tahunPengadaan: yearNum,
          jumlah,
          jumlahTersedia: jumlah,
          hargaSatuan,
          totalHarga: hargaSatuan * jumlah,
          lokasiRak,
          kondisi: 'Baik',
          keterangan: 'Diimpor otomatis dari templat data buku'
        });
      }
    });

    if (newBooks.length > 0) {
      importLibraryBooks(newBooks);
      setSelectedMonth(monthKey);
      setIsImportModalOpen(false);
      setImportText('');
      setImportStatusNotice(null);
    } else {
      setImportStatusNotice('Format data tidak terbaca. Pastikan baris dipisahkan dengan koma, titik koma (;), atau tab.');
    }
  };

  // Download Standalone Document File (.doc / HTML document)
  const handleDownloadBeritaAcaraDoc = () => {
    const monthLabel = formatMonthLabel(selectedMonth);
    const docTitle = 
      printDocType === 'berita_acara'
        ? `BERITA ACARA PENERIMAAN & PENGADAAN BUKU PERPUSTAKAAN`
        : printDocType === 'tahun_beli'
        ? `LAPORAN INVENTARIS BUKU BERDASARKAN TAHUN PEMBELIAN ${printYearFilter !== 'all' ? printYearFilter : 'KESELURUHAN'}`
        : printDocType === 'tanggal_masuk'
        ? `LAPORAN PENERIMAAN BUKU PERPUSTAKAAN TANGGAL ${printDateFilter || 'SEMUA TANGGAL'}`
        : `KATALOG LENGKAP BUKU INVENTARIS PERPUSTAKAAN SEKOLAH`;

    const docSubTitle = 
      printDocType === 'berita_acara'
        ? `Nomor: 421.2/BA-BUKU/${selectedMonth !== 'all' ? selectedMonth.replace('-', '/') : new Date().getFullYear()}/PERPUS<br>Periode Pengadaan: <b>${monthLabel}</b>`
        : printDocType === 'tahun_beli'
        ? `Tahun Anggaran / Pembelian: <b>${printYearFilter !== 'all' ? printYearFilter : 'Semua Tahun'}</b> · Total: <b>${printBooks.length} Judul (${printViewStats.totalCopies} Eks)</b>`
        : printDocType === 'tanggal_masuk'
        ? `Tanggal Masuk Tercatat: <b>${printDateFilter || 'Semua Tanggal'}</b> · Total: <b>${printBooks.length} Judul (${printViewStats.totalCopies} Eks)</b>`
        : `Koleksi Terdata Keseluruhan · Total: <b>${printBooks.length} Judul (${printViewStats.totalCopies} Eks)</b>`;

    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${docTitle}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.4; color: #000; margin: 20mm; }
          .header-table { width: 100%; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; text-align: center; }
          .title { font-size: 13pt; font-weight: bold; text-decoration: underline; text-align: center; margin-top: 10px; text-transform: uppercase; }
          .subtitle { font-size: 10pt; text-align: center; margin-bottom: 15px; }
          table.data { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; }
          table.data th, table.data td { border: 1px solid #000; padding: 6px; }
          table.data th { background-color: #f2f2f2; text-align: center; font-weight: bold; }
          .signatures { width: 100%; margin-top: 30px; }
          .signatures td { vertical-align: top; text-align: center; width: 50%; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 80px; text-align: center;">
              ${schoolConfig.logoKopKiri || schoolConfig.logoKabupatenUrl ? `<img src="${schoolConfig.logoKopKiri || schoolConfig.logoKabupatenUrl}" width="70" height="85" />` : ''}
            </td>
            <td style="text-align: center;">
              <div style="font-size: 11pt; font-weight: bold;">${(schoolConfig.pemerintahDaerah || 'PEMERINTAH DAERAH').toUpperCase()}</div>
              <div style="font-size: 11pt; font-weight: bold;">${(schoolConfig.dinasPendidikan || 'DINAS PENDIDIKAN').toUpperCase()}</div>
              <div style="font-size: 14pt; font-weight: bold; margin: 3px 0;">${(schoolConfig.namaSekolah || 'SATUAN PENDIDIKAN').toUpperCase()}</div>
              <div style="font-size: 9pt;">Alamat: ${schoolConfig.alamat || ''} ${schoolConfig.desaKecamatan || ''} ${schoolConfig.kabupatenKota || ''} | Telp: ${schoolConfig.telepon || '-'}</div>
              <div style="font-size: 9pt;">NPSN: ${schoolConfig.npsn || '-'} | NSS: ${schoolConfig.nss || '-'}</div>
            </td>
            <td style="width: 80px; text-align: center;">
              ${schoolConfig.logoKopKanan || schoolConfig.logoSekolahUrl ? `<img src="${schoolConfig.logoKopKanan || schoolConfig.logoSekolahUrl}" width="70" height="85" />` : ''}
            </td>
          </tr>
        </table>

        <div class="title">${docTitle}</div>
        <div class="subtitle">${docSubTitle}</div>

        <p style="text-align: justify;">
          Pada hari ini, bertempat di Ruang Perpustakaan <b>${schoolConfig.namaSekolah}</b>, 
          telah dilaksanakan verifikasi fisik, penatausahaan nomor inventaris, klasifikasi DDC, dan pemeriksaan koleksi buku 
          hasil pengadaan sekolah dengan rincian sebagai berikut:
        </p>

        <table class="data">
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th>Kode Buku</th>
              <th>Judul Buku</th>
              <th>Kelas</th>
              <th>DDC</th>
              <th>Kategori</th>
              <th>Tahun/Tgl Beli</th>
              <th>Sumber Dana</th>
              <th style="width: 60px;">Eksemplar</th>
              <th>Total Nilai</th>
            </tr>
          </thead>
          <tbody>
            ${printBooks.map((b, i) => `
              <tr>
                <td style="text-align: center;">${i + 1}</td>
                <td><b>${b.kodeBuku}</b></td>
                <td><b>${b.judul}</b><br><small>Penulis: ${b.penulis}</small></td>
                <td>${b.kelas || '-'}</td>
                <td>${b.ddcKlasifikasi || b.ddc || '-'}</td>
                <td>${b.kategoriBuku || b.kategori || 'Buku Teks'}</td>
                <td>${b.tahunPengadaan || (b.tanggalMasuk ? b.tanggalMasuk.substring(0, 4) : b.tahunTerbit)}</td>
                <td>${b.sumberPengadaan || 'BOS Reguler'}</td>
                <td style="text-align: center; font-weight: bold;">${b.jumlah}</td>
                <td style="text-align: right;">${(Number(b.hargaSatuan) || 0) * (Number(b.jumlah) || 1) > 0 ? `Rp ${((Number(b.hargaSatuan) || 0) * (Number(b.jumlah) || 1)).toLocaleString('id-ID')}` : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="font-weight: bold; background-color: #f2f2f2;">
              <td colspan="8" style="text-align: right;">TOTAL KESELURUHAN:</td>
              <td style="text-align: center;">${printViewStats.totalCopies} eks</td>
              <td style="text-align: right;">Rp ${printViewStats.totalValue.toLocaleString('id-ID')}</td>
            </tr>
          </tfoot>
        </table>

        <p style="text-align: justify;">
          Seluruh koleksi buku sebagaimana tercantum di atas telah diperiksa dalam kondisi <b>Baik</b>, 
          telah dicatat dalam Buku Induk Inventaris Perpustakaan, distempel resmi kepemilikan sekolah, serta siap dipergunakan untuk menunjang kegiatan pembelajaran siswa dan pendidik.
        </p>

        <!-- Lembar Pengesahan: Kepala Sekolah di Kiri, Pengelola di Kanan Sesuai Permintaan User -->
        <table class="signatures">
          <tr>
            <td>
              <div>Mengetahui / Mengesahkan,</div>
              <div style="font-weight: bold; margin-top: 2px;">Kepala Sekolah</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold; text-decoration: underline;">${kepalaSekolahName}</div>
              <div style="font-size: 9pt;">NIP: ${schoolConfig.kepalaSekolah?.nip || '19700101 199501 1 001'}</div>
            </td>
            <td>
              <div>${schoolConfig.kabupatenKota || 'Sekolah'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div style="font-weight: bold; margin-top: 2px;">Pengelola Perpustakaan</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold; text-decoration: underline;">${pengelolaName}</div>
              <div style="font-size: 9pt;">NIP: ${pengelolaPerpus?.nip || '19880415 201502 2 001'}</div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dokumen_Perpustakaan_${printDocType}_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const rawKepsekNama = schoolConfig.kepalaSekolah?.nama || '';
  const isDummyKepsek = !rawKepsekNama || /rahmat(\s*hidayat)?/i.test(rawKepsekNama);
  const kepalaSekolahName = isDummyKepsek ? 'Kepala Sekolah' : formatOfficialNameWithDegree(rawKepsekNama);

  const pengelolaPerpus = schoolConfig.operatorProfiles?.PERPUS;
  const rawPengelolaNama = pengelolaPerpus?.nama || '';
  const isDummyPengelola = !rawPengelolaNama || /nurul(\s*hidayat|\s*hidayati)?/i.test(rawPengelolaNama) || /rahmat/i.test(rawPengelolaNama);
  const pengelolaName = isDummyPengelola ? 'Pengelola Perpustakaan' : formatOfficialNameWithDegree(rawPengelolaNama);

  return (
    <div className="space-y-6">
      {/* Hidden file inputs for Logo Kop Kiri and Logo Kop Kanan */}
      <input 
        type="file" 
        ref={fileInputKiriRef} 
        onChange={handleLogoKiriChange} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={fileInputKananRef} 
        onChange={handleLogoKananChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Top Banner & Quick Controls */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <BookOpen className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-medium">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Inventarisasi Koleksi & Pengadaan Buku Perpustakaan</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Pendataan Buku & Pengadaan Bulanan
            </h2>
            <p className="text-emerald-100/80 text-sm max-w-2xl">
              Pemisah buku masuk per bulan untuk memonitor buku baru yang dibeli sekolah, 
              dilengkapi template impor otomatis, klasifikasi DDC cerdas, revisi edit/hapus, 
              serta pilihan cetak berdasarkan tahun beli, tanggal masuk, dan Berita Acara resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Template Impor Otomatis CSV/Excel */}
            <button
              onClick={() => {
                setParsedExcelBooks([]);
                setExcelFileName('');
                setImportStatusNotice(null);
                setIsImportModalOpen(true);
              }}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition cursor-pointer"
              title="Impor data buku menggunakan templat Excel (.xlsx) atau CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
              <span>Impor Excel / CSV</span>
            </button>

            {/* Ekspor Excel */}
            <button
              onClick={handleExportAllBooksExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition cursor-pointer"
              title="Unduh seluruh daftar buku aktif ke dalam berkas Microsoft Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            {/* Tambah Buku Manual */}
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Buku</span>
            </button>

            {/* Pilihan Cetak Dokumen & Berita Acara */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-medium rounded-xl text-xs sm:text-sm flex items-center gap-2 backdrop-blur-sm border border-white/20 transition cursor-pointer"
              title="Pilihan cetak dokumen perpustakaan: Berdasarkan Tahun Beli, Tanggal Masuk, Dokumen Berita Acara, & Katalog Lengkap"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>Pilihan Cetak Dokumen</span>
            </button>
          </div>
        </div>
      </div>

      {/* MONTH SEPARATOR / PEMISAH BUKU MASUK PER BULAN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Pemisah Pengadaan Buku Masuk per Bulan
              </h3>
              <p className="text-xs text-slate-500">
                Pilih tab bulan untuk meninjau penambahan buku baru yang dibeli sekolah pada periode bersangkutan
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 flex-wrap">
            <span>Filter Aktif:</span>
            {purchaseYearFilter !== 'all' && (
              <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Tahun Beli {purchaseYearFilter}
              </span>
            )}
            {tanggalMasukFilter !== 'all' && (
              <span className="font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Tgl Masuk: {tanggalMasukFilter}
              </span>
            )}
            <span className="font-bold text-emerald-700">
              {formatMonthLabel(selectedMonth)}
            </span>
          </div>
        </div>

        {/* Scrollable Month Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedMonth('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
              selectedMonth === 'all'
                ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-700/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>{purchaseYearFilter !== 'all' ? `Semua Bulan ${purchaseYearFilter}` : 'Semua Periode'}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
              selectedMonth === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {purchaseYearFilter !== 'all' 
                ? libraryBooks.filter(b => String(b.tahunBeli || b.tahunPengadaan || (b.tanggalMasuk ? b.tanggalMasuk.split('-')[0] : b.tahunTerbit)) === purchaseYearFilter).length 
                : libraryBooks.length}
            </span>
          </button>

          {availableMonths.map(([monthKey, count]) => {
            const isSelected = selectedMonth === monthKey;
            return (
              <button
                key={monthKey}
                onClick={() => setSelectedMonth(monthKey)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-700/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 opacity-70" />
                <span>{formatMonthLabel(monthKey)}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count} judul
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Month Analytics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
              Total Judul Buku
            </span>
            <div className="text-xl font-bold text-emerald-950 mt-1 flex items-baseline gap-1">
              {currentViewStats.totalTitles}
              <span className="text-xs font-normal text-emerald-700">judul</span>
            </div>
          </div>

          <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider block">
              Total Eksemplar
            </span>
            <div className="text-xl font-bold text-teal-950 mt-1 flex items-baseline gap-1">
              {currentViewStats.totalCopies}
              <span className="text-xs font-normal text-teal-700">buku fisik</span>
            </div>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider block">
              Total Anggaran Pembelian
            </span>
            <div className="text-xl font-bold text-blue-950 mt-1">
              Rp {currentViewStats.totalValue.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
              Sumber Pengadaan
            </span>
            <div className="text-xs font-medium text-amber-950 mt-1 space-y-0.5">
              {Object.keys(currentViewStats.sourceBreakdown).length === 0 ? (
                <span className="text-slate-400">-</span>
              ) : (
                Object.entries(currentViewStats.sourceBreakdown).slice(0, 2).map(([src, info]) => (
                  <div key={src} className="flex justify-between items-center text-[11px]">
                    <span className="truncate max-w-[100px]">{src}:</span>
                    <span className="font-bold">{info.count} eks</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul buku, kelas, penulis, penerbit, nomor ISBN, atau kode buku..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Class Filter */}
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            >
              <option value="all">Semua Kelas</option>
              <option value="Kelas VII">Kelas VII</option>
              <option value="Kelas VIII">Kelas VIII</option>
              <option value="Kelas IX">Kelas IX</option>
              <option value="Kelas VII-IX (Umum)">Kelas VII-IX (Umum)</option>
              <option value="Guru / Pendidik">Guru / Pendidik</option>
              <option value="Umum / Referensi">Umum / Referensi</option>
            </select>

            {/* Purchase Year Filter */}
            <select
              value={purchaseYearFilter}
              onChange={e => {
                const yr = e.target.value;
                setPurchaseYearFilter(yr);
                if (yr !== 'all' && selectedMonth !== 'all' && !selectedMonth.startsWith(yr)) {
                  setSelectedMonth('all');
                }
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
              title="Filter daftar buku berdasarkan tahun pembelian"
            >
              <option value="all">Semua Tahun Beli</option>
              {availablePurchaseYears.map(yr => (
                <option key={yr} value={yr}>Tahun Beli {yr}</option>
              ))}
            </select>

            {/* Tanggal Masuk Filter */}
            <select
              value={tanggalMasukFilter}
              onChange={e => setTanggalMasukFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
              title="Filter buku berdasarkan tanggal masuk persis"
            >
              <option value="all">Semua Tgl Masuk</option>
              {availableTanggalMasuk.map(tgl => {
                let label = tgl;
                if (tgl.includes('-')) {
                  const p = tgl.split('-');
                  if (p.length === 3) {
                    const mIdx = parseInt(p[1], 10) - 1;
                    if (mIdx >= 0 && mIdx < 12) {
                      label = `${parseInt(p[2], 10)} ${MONTH_NAMES[mIdx]} ${p[0]}`;
                    }
                  }
                }
                return (
                  <option key={tgl} value={tgl}>Tgl: {label}</option>
                );
              })}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            >
              <option value="all">Semua Kategori</option>
              <option value="Buku Guru">Buku Guru / Modul Pendidik</option>
              <option value="Buku Referensi">Buku Referensi & Rujukan</option>
              <option value="Non-Fiksi">Buku Non Fiksi / Sains & Biografi</option>
              <option value="Fiksi / Cerita">Buku Fiksi / Sastra & Cerita</option>
              <option value="Buku Teks Utama">Buku Teks Utama (Siswa)</option>
              <option value="Buku Pengayaan">Buku Pengayaan</option>
              <option value="Kamus & Ensiklopedia">Kamus & Ensiklopedia</option>
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            >
              <option value="all">Semua Sumber Dana</option>
              <option value="BOS Reguler">BOS Reguler</option>
              <option value="BOS Kinerja">BOS Kinerja</option>
              <option value="Hibah / Bantuan">Hibah / Bantuan</option>
              <option value="APBD / DAK">APBD / DAK</option>
              <option value="Swadaya / Komite">Swadaya / Komite</option>
            </select>
          </div>
        </div>
      </div>

      {/* BULK ACTION BAR (HAPUS PILIHAN) */}
      {selectedBookIds.length > 0 && (
        <div className="p-3 sm:px-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
              {selectedBookIds.length}
            </span>
            <span className="text-xs font-bold text-rose-900">
              buku koleksi dipilih
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedBookIds([])}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer"
            >
              Batal Pilihan
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Pilihan ({selectedBookIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* BOOKS DIRECTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Daftar Inventaris Koleksi Buku ({filteredBooks.length} judul ditemukan)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Total {currentViewStats.totalCopies} eksemplar fisik
          </span>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-slate-600 font-semibold text-sm">Belum ada buku untuk kriteria filter ini</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Gunakan tombol "Impor Data Otomatis" atau "Tambah Buku" untuk mencatat koleksi baru perpustakaan.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2 bg-sky-500 text-slate-900 rounded-xl text-xs font-bold hover:bg-sky-600"
              >
                Impor Data Otomatis
              </button>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
              >
                Tambah Manual
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-3 w-9 text-center">
                    <input
                      type="checkbox"
                      checked={filteredBooks.length > 0 && selectedBookIds.length === filteredBooks.length}
                      onChange={handleToggleSelectAllBooks}
                      title="Pilih semua buku yang tampil"
                      className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 w-8 text-center">No</th>
                  <th className="py-3 px-3">Kode Buku</th>
                  <th className="py-3 px-4 min-w-[220px]">Judul Buku & Penulis</th>
                  <th className="py-3 px-3 text-center">Kelas</th>
                  <th className="py-3 px-3">Kategori & DDC</th>
                  <th className="py-3 px-3 text-center">Tahun Beli / Tgl</th>
                  <th className="py-3 px-3">Sumber Dana</th>
                  <th className="py-3 px-3 text-center">Eksemplar</th>
                  <th className="py-3 px-3 text-right">Harga Satuan</th>
                  <th className="py-3 px-3 text-center">Peruntukan</th>
                  <th className="py-3 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((book, idx) => (
                  <tr key={book.id} className={`hover:bg-slate-50/80 transition group ${selectedBookIds.includes(book.id) ? 'bg-emerald-50/50' : ''}`}>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedBookIds.includes(book.id)}
                        onChange={() => handleToggleSelectBook(book.id)}
                        title={`Pilih ${book.judul}`}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-semibold text-emerald-800 block text-[11px]">
                        {book.kodeBuku}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block text-xs leading-snug">
                        {book.judul}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Penulis: {book.penulis} {book.penerbit ? `· ${book.penerbit}` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {book.kelas || 'Umum'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-0.5">
                        {book.kategoriBuku || book.kategori || 'Buku Teks'}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono truncate max-w-[150px]" title={book.ddcKlasifikasi || book.ddc}>
                        {book.ddcKlasifikasi || book.ddc || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 mb-0.5 shadow-2xs">
                        Thn {book.tahunBeli || book.tahunPengadaan || (book.tanggalMasuk ? book.tanggalMasuk.substring(0, 4) : book.tahunTerbit)}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        {book.tanggalMasuk || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {book.sumberPengadaan || 'BOS Reguler'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-slate-800 text-sm">
                        {book.jumlah}
                      </span>
                      <span className="text-[10px] text-slate-400 block">eks</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {book.hargaSatuan ? (
                        <>
                          <span className="font-medium text-slate-800 block">
                            Rp {Number(book.hargaSatuan).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Tot: Rp {((Number(book.hargaSatuan) || 0) * (Number(book.jumlah) || 1)).toLocaleString('id-ID')}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {book.statusBuku || 'siswa'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(book)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Edit buku ini"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(book)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus buku ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: TEMPLAT & IMPOR DATA OTOMATIS BUKU */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-scaleIn">
            <div className="p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Templat & Impor Data Buku Excel</h3>
                  <p className="text-[11px] text-emerald-100">
                    Mendukung berkas Microsoft Excel (.xlsx, .xls) & CSV dengan pemetaan kolom otomatis
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Download Template Section */}
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>Unduh Templat Format Excel Resmi:</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Templat telah dilengkapi kolom-kolom Excel siap pakai (Judul, DDC otomatis, Kelas, Sumber Dana, Kategori) dan lembar petunjuk pengisian.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition whitespace-nowrap cursor-pointer"
                    title="Unduh templat format Microsoft Excel (.xlsx)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Templat Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-lg text-xs flex items-center gap-1 transition whitespace-nowrap cursor-pointer"
                    title="Unduh format CSV alternatif"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Upload Excel File Zone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-5 text-center bg-slate-50/70 transition-colors">
                <FileSpreadsheet className="w-9 h-9 text-emerald-600 mx-auto mb-2 opacity-90" />
                <h4 className="font-bold text-slate-800 text-sm">
                  Unggah Berkas Excel (.xlsx / .xls / .csv)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                  Pilih berkas Excel yang sudah diisi data buku sekolah. Kolom akan otomatis dibaca dan dipetakan.
                </p>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs transition shadow-xs">
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
                    Berkas terpilih: <strong>{excelFileName}</strong>
                  </p>
                )}
              </div>

              {/* Status Notice */}
              {importStatusNotice && (
                <div className={`p-3 rounded-lg text-xs font-medium border flex items-start gap-2 ${
                  importStatusNotice.includes('Berhasil') 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : importStatusNotice.includes('Gagal') || importStatusNotice.includes('Tidak')
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{importStatusNotice}</span>
                </div>
              )}

              {/* Parsed Excel Records Preview Table */}
              {parsedExcelBooks.length > 0 && (
                <div className="space-y-2 border border-emerald-200 rounded-xl p-3 bg-emerald-50/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span>Pratinjau Data Excel ({parsedExcelBooks.length} judul buku terdeteksi):</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Total Eksemplar: {parsedExcelBooks.reduce((acc, b) => acc + (b.jumlah || 1), 0)} buku
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-2xs">
                    <table className="w-full text-left text-[11px] divide-y divide-slate-100">
                      <thead className="bg-slate-50 sticky top-0 text-slate-700 font-bold">
                        <tr>
                          <th className="py-2 px-2.5 text-center w-8">No</th>
                          <th className="py-2 px-2.5">Judul Buku</th>
                          <th className="py-2 px-2.5">Kelas</th>
                          <th className="py-2 px-2.5">DDC</th>
                          <th className="py-2 px-2.5 text-center">Tahun Beli / Masuk</th>
                          <th className="py-2 px-2.5">Sumber Dana</th>
                          <th className="py-2 px-2.5 text-center">Eks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedExcelBooks.map((b, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-1.5 px-2.5 text-center text-slate-400">{idx + 1}</td>
                            <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                              {b.judul}
                              <div className="text-[10px] text-slate-500 font-normal">{b.penulis} · {b.penerbit}</div>
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-600">{b.kelas}</td>
                            <td className="py-1.5 px-2.5 text-teal-800 font-mono text-[10px]">{b.ddcKlasifikasi}</td>
                            <td className="py-1.5 px-2.5 text-center text-slate-700 font-mono text-[11px]">
                              <span className="font-bold">{b.tahunPengadaan || b.tahunBeli || '-'}</span>
                              <span className="block text-[10px] text-slate-400">{b.tanggalMasuk || '-'}</span>
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-600">{b.sumberPengadaan}</td>
                            <td className="py-1.5 px-2.5 text-center font-bold text-slate-800">{b.jumlah}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleCommitParsedExcelImport}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan & Masukkan ke Katalog ({parsedExcelBooks.length} Judul Buku)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Date Setting for Import Batch */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block font-bold text-slate-800 text-xs">
                    Tanggal Pembelian / Masuk Buku untuk Baris Terimpor:
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Akan menjadi pemisah bulan pengadaan buku baru
                  </p>
                </div>
                <input
                  type="date"
                  value={importDate}
                  onChange={e => setImportDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Secondary Option: Manual Text Paste */}
              <details className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <summary className="font-semibold text-slate-700 text-xs cursor-pointer select-none">
                  Atau Tempel Baris Teks CSV Secara Manual
                </summary>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-slate-600">
                      Tempel data teks dipisahkan koma atau titik koma:
                    </label>
                    <button
                      type="button"
                      onClick={handleLoadSampleImportData}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-800 underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Muat Contoh Teks</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                    placeholder="Judul Buku,Kelas,Penulis,Penerbit,Tahun,ISBN,Kategori,Status,SumberDana,Jumlah,Harga,Rak..."
                    className="w-full p-2.5 font-mono text-[11px] bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCommitImport}
                      disabled={!importText.trim()}
                      className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                    >
                      Impor dari Teks
                    </button>
                  </div>
                </div>
              </details>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedExcelBooks([]);
                  setExcelFileName('');
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}



      {/* MODAL: TAMBAH DATA BUKU INVENTARIS BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col">
            <div className="p-5 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">Tambah Data Buku Inventaris Baru</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewBook} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kode Buku / Inventaris *</label>
                <input
                  type="text"
                  required
                  value={formData.kodeBuku || ''}
                  onChange={e => setFormData({ ...formData, kodeBuku: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="Contoh: BK-2026-009"
                />
              </div>

              {/* Judul Buku + Auto DDC */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Judul Buku *</label>
                  <button
                    type="button"
                    onClick={handleTriggerAutoDdc}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1"
                    title="Deteksi nomor klasifikasi DDC secara otomatis dari judul buku"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>DDC Otomatis ⚡</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.judul || ''}
                  onChange={e => {
                    const newJudul = e.target.value;
                    const autoDdc = detectDdcFromTitle(newJudul);
                    setFormData({ 
                      ...formData, 
                      judul: newJudul,
                      ddcKlasifikasi: autoDdc
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  placeholder="Contoh: Bahasa Indonesia: Tingkap Jendela Ilmu Kelas VII"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Kelas */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tingkat / Kelas *</label>
                  <select
                    value={formData.kelas || 'Kelas VII'}
                    onChange={e => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Kelas VII">Kelas VII</option>
                    <option value="Kelas VIII">Kelas VIII</option>
                    <option value="Kelas IX">Kelas IX</option>
                    <option value="Kelas VII-IX (Umum)">Kelas VII-IX (Umum)</option>
                    <option value="Guru / Pendidik">Guru / Pendidik</option>
                    <option value="Umum / Referensi">Umum / Referensi</option>
                  </select>
                </div>

                {/* Status Buku */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Buku (Peruntukan) *</label>
                  <select
                    value={formData.statusBuku || 'siswa'}
                    onChange={e => setFormData({ ...formData, statusBuku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="siswa">Buku Siswa / Pelajaran</option>
                    <option value="guru">Buku Guru / Modul Ajar</option>
                    <option value="referensi">Buku Referensi / Rujukan Khusus</option>
                    <option value="umum">Buku Umum / Fiksi / GLS</option>
                  </select>
                </div>
              </div>

              {/* DDC Klasifikasi Otomatis */}
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-emerald-900">
                    DDC Klasifikasi (Otomatis & Terstandar) *
                  </label>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded">
                    Sistem Otomatis
                  </span>
                </div>
                <select
                  value={formData.ddcKlasifikasi || '400 - Bahasa (Indonesia, Inggris, Arab, Daerah)'}
                  onChange={e => setFormData({ ...formData, ddcKlasifikasi: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-xs font-semibold"
                >
                  {DDC_CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penulis / Pengarang</label>
                  <input
                    type="text"
                    value={formData.penulis || ''}
                    onChange={e => setFormData({ ...formData, penulis: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: Rakhma Subarna"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penerbit</label>
                  <input
                    type="text"
                    value={formData.penerbit || ''}
                    onChange={e => setFormData({ ...formData, penerbit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: Kemendikbudristek"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Buku *</label>
                  <select
                    value={formData.kategoriBuku || 'Buku Teks Utama'}
                    onChange={e => setFormData({ ...formData, kategoriBuku: e.target.value as LibraryBookCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Buku Teks Utama">Buku Teks Utama</option>
                    <option value="Buku Pengayaan">Buku Pengayaan</option>
                    <option value="Buku Referensi">Buku Referensi</option>
                    <option value="Fiksi / Cerita">Fiksi / Cerita</option>
                    <option value="Non-Fiksi">Non-Fiksi</option>
                    <option value="Buku Guru">Buku Guru</option>
                    <option value="Kamus & Ensiklopedia">Kamus & Ensiklopedia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Terbit</label>
                  <input
                    type="number"
                    value={formData.tahunTerbit || 2024}
                    onChange={e => setFormData({ ...formData, tahunTerbit: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tahun Pembelian / Pengadaan *
                    </label>
                    <input
                      type="number"
                      min="1990"
                      max="2099"
                      required
                      value={formData.tahunBeli || (formData.tanggalMasuk ? parseInt(formData.tanggalMasuk.split('-')[0], 10) : new Date().getFullYear())}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          let newDate = formData.tanggalMasuk || `${val}-01-01`;
                          if (newDate.includes('-')) {
                            const parts = newDate.split('-');
                            newDate = `${val}-${parts[1] || '01'}-${parts[2] || '01'}`;
                          }
                          setFormData(prev => ({
                            ...prev,
                            tahunBeli: val,
                            tahunPengadaan: val,
                            tanggalMasuk: newDate,
                            bulanPengadaan: newDate.substring(0, 7)
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-800"
                      placeholder="Contoh: 2025"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Tercatat sebagai tahun pembelian buku di sistem</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tanggal & Bulan Masuk *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.tanggalMasuk || ''}
                      onChange={e => {
                        const d = e.target.value;
                        const y = d ? parseInt(d.split('-')[0], 10) : undefined;
                        setFormData(prev => ({
                          ...prev,
                          tanggalMasuk: d,
                          bulanPengadaan: d ? d.substring(0, 7) : prev.bulanPengadaan,
                          tahunBeli: y || prev.tahunBeli,
                          tahunPengadaan: y || prev.tahunPengadaan
                        }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Menentukan bulan pencatatan pengadaan buku</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Sumber Pengadaan *</label>
                    <select
                      value={formData.sumberPengadaan || 'BOS Reguler'}
                      onChange={e => setFormData({ ...formData, sumberPengadaan: e.target.value as LibraryProcurementSource })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="BOS Reguler">BOS Reguler</option>
                      <option value="BOS Kinerja">BOS Kinerja</option>
                      <option value="Hibah / Bantuan">Hibah / Bantuan</option>
                      <option value="APBD / DAK">APBD / DAK</option>
                      <option value="Swadaya / Komite">Swadaya / Komite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jumlah Eksemplar *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.jumlah || 1}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setFormData({ ...formData, jumlah: val, jumlahTersedia: val });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>
                </div>

                {/* Live Indicator */}
                <div className="text-[11px] text-emerald-900 bg-emerald-100/70 p-2.5 rounded-lg border border-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Pencatatan Sistem:</span>
                  </div>
                  <span className="font-bold">
                    Tahun Beli: {formData.tahunBeli || (formData.tanggalMasuk ? formData.tanggalMasuk.split('-')[0] : new Date().getFullYear())}
                    {' · '}
                    Bulan: {formData.tanggalMasuk ? formatMonthLabel(formData.tanggalMasuk.substring(0, 7)) : '-'}
                    {' ('}{formData.tanggalMasuk || '-'}{')'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Harga Satuan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.hargaSatuan || 0}
                  onChange={e => setFormData({ ...formData, hargaSatuan: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: 35000"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition"
                >
                  Simpan Buku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BUKU (LENGKAP REVISI) */}
      {isEditModalOpen && activeBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col">
            <div className="p-5 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-base">Revisi & Edit Data Buku</h3>
                  <span className="text-xs text-emerald-200 font-mono">{activeBook.kodeBuku}</span>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBook} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kode Buku / Inventaris *</label>
                <input
                  type="text"
                  required
                  value={formData.kodeBuku || ''}
                  onChange={e => setFormData({ ...formData, kodeBuku: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Judul Buku *</label>
                  <button
                    type="button"
                    onClick={handleTriggerAutoDdc}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>DDC Otomatis ⚡</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.judul || ''}
                  onChange={e => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas *</label>
                  <select
                    value={formData.kelas || 'Kelas VII'}
                    onChange={e => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Kelas VII">Kelas VII</option>
                    <option value="Kelas VIII">Kelas VIII</option>
                    <option value="Kelas IX">Kelas IX</option>
                    <option value="Kelas VII-IX (Umum)">Kelas VII-IX (Umum)</option>
                    <option value="Guru / Pendidik">Guru / Pendidik</option>
                    <option value="Umum / Referensi">Umum / Referensi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Buku *</label>
                  <select
                    value={formData.statusBuku || 'siswa'}
                    onChange={e => setFormData({ ...formData, statusBuku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="siswa">Buku Siswa / Pelajaran</option>
                    <option value="guru">Buku Guru / Modul Ajar</option>
                    <option value="referensi">Buku Referensi / Rujukan Khusus</option>
                    <option value="umum">Buku Umum / Fiksi / GLS</option>
                  </select>
                </div>
              </div>

              {/* DDC Klasifikasi */}
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                <label className="block font-bold text-emerald-900 mb-1">
                  DDC Klasifikasi *
                </label>
                <select
                  value={formData.ddcKlasifikasi || '400 - Bahasa (Indonesia, Inggris, Arab, Daerah)'}
                  onChange={e => setFormData({ ...formData, ddcKlasifikasi: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-xs font-semibold"
                >
                  {DDC_CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penulis / Pengarang</label>
                  <input
                    type="text"
                    value={formData.penulis || ''}
                    onChange={e => setFormData({ ...formData, penulis: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penerbit</label>
                  <input
                    type="text"
                    value={formData.penerbit || ''}
                    onChange={e => setFormData({ ...formData, penerbit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Buku</label>
                  <select
                    value={formData.kategoriBuku || 'Buku Teks Utama'}
                    onChange={e => setFormData({ ...formData, kategoriBuku: e.target.value as LibraryBookCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Buku Teks Utama">Buku Teks Utama</option>
                    <option value="Buku Pengayaan">Buku Pengayaan</option>
                    <option value="Buku Referensi">Buku Referensi</option>
                    <option value="Fiksi / Cerita">Fiksi / Cerita</option>
                    <option value="Non-Fiksi">Non-Fiksi</option>
                    <option value="Buku Guru">Buku Guru</option>
                    <option value="Kamus & Ensiklopedia">Kamus & Ensiklopedia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Terbit</label>
                  <input
                    type="number"
                    value={formData.tahunTerbit || 2024}
                    onChange={e => setFormData({ ...formData, tahunTerbit: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tahun Pembelian / Pengadaan *
                    </label>
                    <input
                      type="number"
                      min="1990"
                      max="2099"
                      required
                      value={formData.tahunBeli || (formData.tanggalMasuk ? parseInt(formData.tanggalMasuk.split('-')[0], 10) : new Date().getFullYear())}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          let newDate = formData.tanggalMasuk || `${val}-01-01`;
                          if (newDate.includes('-')) {
                            const parts = newDate.split('-');
                            newDate = `${val}-${parts[1] || '01'}-${parts[2] || '01'}`;
                          }
                          setFormData(prev => ({
                            ...prev,
                            tahunBeli: val,
                            tahunPengadaan: val,
                            tanggalMasuk: newDate,
                            bulanPengadaan: newDate.substring(0, 7)
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-800"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Tercatat sebagai tahun pembelian buku di sistem</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tanggal & Bulan Masuk *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.tanggalMasuk || ''}
                      onChange={e => {
                        const d = e.target.value;
                        const y = d ? parseInt(d.split('-')[0], 10) : undefined;
                        setFormData(prev => ({
                          ...prev,
                          tanggalMasuk: d,
                          bulanPengadaan: d ? d.substring(0, 7) : prev.bulanPengadaan,
                          tahunBeli: y || prev.tahunBeli,
                          tahunPengadaan: y || prev.tahunPengadaan
                        }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Menentukan bulan pencatatan pengadaan buku</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Sumber Pengadaan *</label>
                    <select
                      value={formData.sumberPengadaan || 'BOS Reguler'}
                      onChange={e => setFormData({ ...formData, sumberPengadaan: e.target.value as LibraryProcurementSource })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="BOS Reguler">BOS Reguler</option>
                      <option value="BOS Kinerja">BOS Kinerja</option>
                      <option value="Hibah / Bantuan">Hibah / Bantuan</option>
                      <option value="APBD / DAK">APBD / DAK</option>
                      <option value="Swadaya / Komite">Swadaya / Komite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jumlah Eksemplar *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.jumlah || 1}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setFormData({ ...formData, jumlah: val, jumlahTersedia: val });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>
                </div>

                {/* Live Indicator */}
                <div className="text-[11px] text-emerald-900 bg-emerald-100/70 p-2.5 rounded-lg border border-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Pencatatan Sistem:</span>
                  </div>
                  <span className="font-bold">
                    Tahun Beli: {formData.tahunBeli || (formData.tanggalMasuk ? formData.tanggalMasuk.split('-')[0] : new Date().getFullYear())}
                    {' · '}
                    Bulan: {formData.tanggalMasuk ? formatMonthLabel(formData.tanggalMasuk.substring(0, 7)) : '-'}
                    {' ('}{formData.tanggalMasuk || '-'}{')'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Harga Satuan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.hargaSatuan || 0}
                  onChange={e => setFormData({ ...formData, hargaSatuan: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HAPUS BUKU */}
      {isDeleteModalOpen && activeBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Hapus Data Buku Ini?</h3>
              <p className="text-xs text-slate-500">
                Tindakan ini akan menghapus buku berikut dari katalog inventaris perpustakaan:
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1">
              <div className="font-mono text-emerald-800 font-bold text-[11px]">{activeBook.kodeBuku}</div>
              <div className="font-semibold text-slate-800">{activeBook.judul}</div>
              <div className="text-slate-500">
                Kelas: {activeBook.kelas || 'Umum'} · Penulis: {activeBook.penulis} ({activeBook.jumlah} eksemplar)
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow transition"
              >
                Ya, Hapus Buku
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PILIHAN CETAK DOKUMEN BUKU PERPUSTAKAAN (BERITA ACARA, TAHUN BELI, TANGGAL MASUK, KATALOG LENGKAP) */}
      {isReportModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsReportModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden relative animate-scaleIn">
            {/* Floating Top-Right Close Button (Always visible on any scroll) */}
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-3 right-3 z-40 p-2 bg-slate-800 hover:bg-rose-600 text-white rounded-full transition-colors shadow-lg no-print cursor-pointer"
              title="Tutup (Esc)"
              aria-label="Tutup Pratinjau Dokumen"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header & Controls Bar (Sticky No-Print) */}
            <div className="shrink-0 p-3 sm:p-4 bg-slate-900 text-white border-b border-slate-800 no-print pr-14 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-bold text-sm">Pilihan Cetak Dokumen Buku Perpustakaan</h3>
                    <p className="text-[11px] text-slate-400">
                      Pilih format dokumen resmi, sesuaikan filter tanggal/tahun, cetak langsung atau unduh berkas (.doc)
                    </p>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Upload Logo Kiri */}
                  <button
                    type="button"
                    onClick={() => fileInputKiriRef.current?.click()}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                    title="Upload logo instansi / Pemda di sebelah kiri kop surat"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-300" />
                    <span>Logo Kiri</span>
                  </button>

                  {/* Upload Logo Kanan */}
                  <button
                    type="button"
                    onClick={() => fileInputKananRef.current?.click()}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                    title="Upload logo sekolah / Tut Wuri di sebelah kanan kop surat"
                  >
                    <Upload className="w-3.5 h-3.5 text-sky-300" />
                    <span>Logo Kanan</span>
                  </button>

                  {/* Download Doc */}
                  <button
                    type="button"
                    onClick={handleDownloadBeritaAcaraDoc}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                    title="Download berkas sebagai dokumen (.doc)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.doc)</span>
                  </button>

                  {/* Cetak Langsung */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                    title="Cetak langsung dokumen ke printer atau PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Langsung</span>
                  </button>

                  {/* Tutup */}
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Tutup</span>
                  </button>
                </div>
              </div>

              {/* Document Selection Tabs & Filter Controls */}
              <div className="bg-slate-800/80 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3 border border-slate-700">
                {/* 4 Pilihan Cetak Dokumen */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrintDocType('berita_acara')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      printDocType === 'berita_acara'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Berita Acara Pengadaan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintDocType('tahun_beli')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      printDocType === 'tahun_beli'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Berdasarkan Tahun Beli</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintDocType('tanggal_masuk')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      printDocType === 'tanggal_masuk'
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Berdasarkan Tanggal Masuk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintDocType('katalog_lengkap')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      printDocType === 'katalog_lengkap'
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Katalog Lengkap Seluruh Koleksi</span>
                  </button>
                </div>

                {/* Sub-filter based on selected document type */}
                <div className="flex items-center gap-2 text-xs">
                  {printDocType === 'berita_acara' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-300 font-medium">Bulan:</span>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 font-medium"
                      >
                        <option value="all">Semua Periode Pengadaan</option>
                        {availableMonths.map(([mKey, count]) => (
                          <option key={mKey} value={mKey}>
                            {formatMonthLabel(mKey)} ({count} judul)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {printDocType === 'tahun_beli' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-300 font-medium">Tahun Beli:</span>
                      <select
                        value={printYearFilter}
                        onChange={(e) => setPrintYearFilter(e.target.value)}
                        className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-medium"
                      >
                        <option value="all">Semua Tahun Pembelian</option>
                        {availablePurchaseYears.map(year => (
                          <option key={year} value={year}>
                            Tahun {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {printDocType === 'tanggal_masuk' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-300 font-medium">Tanggal / Bulan:</span>
                      <input
                        type="text"
                        placeholder="Contoh: 2026-03 atau 2026-03-15"
                        value={printDateFilter}
                        onChange={(e) => setPrintDateFilter(e.target.value)}
                        className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-purple-500 font-mono w-44"
                      />
                      {printDateFilter && (
                        <button
                          type="button"
                          onClick={() => setPrintDateFilter('')}
                          className="text-slate-400 hover:text-white text-xs px-1"
                          title="Reset filter tanggal"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}

                  <div className="px-2.5 py-1 bg-slate-900/90 rounded-lg text-emerald-400 font-bold border border-slate-700">
                    {printBooks.length} Judul ({printViewStats.totalCopies} Eks)
                  </div>
                </div>
              </div>
            </div>

            {/* Printable Document Sheet (Scrollable content) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-12 text-slate-900 bg-white font-serif leading-relaxed text-xs sm:text-sm print:p-0 print:overflow-visible">
              {/* Kop Surat Sekolah Resmi dengan Logo Kiri & Kanan */}
              <KopSurat config={schoolConfig} isPrintVersion={true} className="mb-4" />

              {/* Document Title & Number based on chosen document type */}
              <div className="text-center mb-6 space-y-1">
                {printDocType === 'berita_acara' && (
                  <>
                    <h4 className="font-bold text-sm sm:text-base uppercase tracking-wider underline">
                      BERITA ACARA PENERIMAAN & PENGADAAN BUKU PERPUSTAKAAN
                    </h4>
                    <div className="text-xs font-mono">
                      Nomor: 421.2/BA-BUKU/{selectedMonth !== 'all' ? selectedMonth.replace('-', '/') : new Date().getFullYear()}/PERPUS
                    </div>
                    <div className="text-xs font-medium text-slate-600">
                      Periode Pengadaan: <strong>{formatMonthLabel(selectedMonth)}</strong>
                    </div>
                  </>
                )}

                {printDocType === 'tahun_beli' && (
                  <>
                    <h4 className="font-bold text-sm sm:text-base uppercase tracking-wider underline">
                      DAFTAR INVENTARIS BUKU BERDASARKAN TAHUN PEMBELIAN {printYearFilter === 'all' ? 'SEMUA TAHUN' : printYearFilter}
                    </h4>
                    <div className="text-xs font-mono">
                      Nomor: 421.2/DAF-BUKU/TH-{printYearFilter}/PERPUS
                    </div>
                    <div className="text-xs font-medium text-slate-600">
                      Filter Tahun Pembelian: <strong>{printYearFilter === 'all' ? 'Semua Tahun Pembelian' : `Tahun ${printYearFilter}`}</strong>
                    </div>
                  </>
                )}

                {printDocType === 'tanggal_masuk' && (
                  <>
                    <h4 className="font-bold text-sm sm:text-base uppercase tracking-wider underline">
                      DAFTAR PENERIMAAN BUKU PERPUSTAKAAN BERDASARKAN TANGGAL MASUK
                    </h4>
                    <div className="text-xs font-mono">
                      Nomor: 421.2/TGL-MASUK/{new Date().getFullYear()}/PERPUS
                    </div>
                    <div className="text-xs font-medium text-slate-600">
                      Tanggal / Bulan Masuk: <strong>{printDateFilter || 'Semua Tanggal Masuk'}</strong>
                    </div>
                  </>
                )}

                {printDocType === 'katalog_lengkap' && (
                  <>
                    <h4 className="font-bold text-sm sm:text-base uppercase tracking-wider underline">
                      KATALOG LENGKAP KOLEKSI BUKU INVENTARIS PERPUSTAKAAN
                    </h4>
                    <div className="text-xs font-mono">
                      Nomor: 421.2/KATALOG-LENGKAP/{new Date().getFullYear()}/PERPUS
                    </div>
                    <div className="text-xs font-medium text-slate-600">
                      Klasifikasi Seluruh Koleksi Buku Bahan Ajar, Pengayaan, Referensi & Fiksi
                    </div>
                  </>
                )}
              </div>

              {/* Narrative Statement */}
              <div className="space-y-2 mb-4 text-justify font-sans text-xs">
                <p>
                  Pada hari ini, bertempat di Ruang Perpustakaan <strong>{schoolConfig.namaSekolah}</strong>, 
                  telah dilakukan pendataan fisik, verifikasi jumlah, klasifikasi DDC, dan pencatatan buku inventaris perpustakaan 
                  {printDocType === 'berita_acara' && ' yang diperoleh dari pengadaan berkala '}
                  {printDocType === 'tahun_beli' && ` dengan filter tahun pembelian ${printYearFilter === 'all' ? 'seluruh periode' : printYearFilter} `}
                  {printDocType === 'tanggal_masuk' && ` dengan filter tanggal masuk ${printDateFilter || 'seluruh tanggal'} `}
                  {printDocType === 'katalog_lengkap' && ' yang mencakup seluruh koleksi aktif perpustakaan '}
                  dengan rincian sebagai berikut:
                </p>
              </div>

              {/* Books Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden mb-5">
                <table className="w-full text-left text-[11px] font-sans">
                  <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <tr>
                      <th className="p-2 w-8 text-center border-r border-slate-300">No</th>
                      <th className="p-2 border-r border-slate-300">Kode Buku</th>
                      <th className="p-2 border-r border-slate-300">Judul Buku & Penulis</th>
                      <th className="p-2 border-r border-slate-300 text-center">Kelas</th>
                      <th className="p-2 border-r border-slate-300">DDC & Kategori</th>
                      <th className="p-2 border-r border-slate-300 text-center">Tahun / Tgl Beli</th>
                      <th className="p-2 border-r border-slate-300">Sumber Dana</th>
                      <th className="p-2 border-r border-slate-300 text-center">Jml (Eks)</th>
                      <th className="p-2 text-right">Nilai Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {printBooks.map((b, i) => {
                      const totalItemPrice = (Number(b.hargaSatuan) || 0) * (Number(b.jumlah) || 1);
                      return (
                        <tr key={b.id}>
                          <td className="p-2 text-center border-r border-slate-200">{i + 1}</td>
                          <td className="p-2 font-mono font-bold text-slate-800 border-r border-slate-200">{b.kodeBuku}</td>
                          <td className="p-2 border-r border-slate-200">
                            <span className="font-semibold block">{b.judul}</span>
                            <span className="text-[10px] text-slate-500">Penulis: {b.penulis} {b.penerbit ? `· ${b.penerbit}` : ''}</span>
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 font-medium">
                            {b.kelas || 'Umum'}
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            <span className="font-semibold block">{b.kategoriBuku || b.kategori || 'Buku Teks'}</span>
                            <span className="text-[10px] text-slate-500 font-mono truncate block max-w-[140px]">{b.ddcKlasifikasi || b.ddc || '-'}</span>
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 whitespace-nowrap">
                            <span className="block font-bold">{b.tahunPengadaan || (b.tanggalMasuk ? b.tanggalMasuk.substring(0, 4) : b.tahunTerbit)}</span>
                            <span className="text-[10px] text-slate-500">{b.tanggalMasuk}</span>
                          </td>
                          <td className="p-2 border-r border-slate-200">{b.sumberPengadaan || 'BOS Reguler'}</td>
                          <td className="p-2 text-center font-bold border-r border-slate-200">{b.jumlah}</td>
                          <td className="p-2 text-right font-medium">
                            {totalItemPrice > 0 ? `Rp ${totalItemPrice.toLocaleString('id-ID')}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                    {printBooks.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-500 italic">
                          Tidak ada data buku yang sesuai dengan filter dokumen yang dipilih.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-900">
                    <tr>
                      <td colSpan={7} className="p-2 text-right border-r border-slate-300 uppercase">
                        Total Keseluruhan:
                      </td>
                      <td className="p-2 text-center border-r border-slate-300 text-emerald-800">
                        {printViewStats.totalCopies} eks
                      </td>
                      <td className="p-2 text-right text-emerald-800">
                        Rp {printViewStats.totalValue.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Statement of Acceptance */}
              <div className="space-y-2 mb-8 text-justify font-sans text-xs">
                <p>
                  Seluruh koleksi buku sebagaimana tercantum di atas telah diperiksa dalam kondisi <strong>Baik</strong>, 
                  telah diberi nomor registrasi/kode inventaris perpustakaan, distempel kepemilikan sekolah, dan siap dilayankan 
                  kepada seluruh pemustaka warga sekolah.
                </p>
                <p>
                  Demikian dokumen daftar penerimaan dan inventaris buku perpustakaan ini dibuat dengan sebenarnya dalam rangkap secukupnya 
                  untuk dapat dipergunakan sebagaimana mestinya.
                </p>
              </div>

              {/* Lembar Pengesahan: KEPALA SEKOLAH DI KIRI, PENGELOLA PERPUSTAKAAN DI KANAN */}
              <div className="pt-4 grid grid-cols-2 gap-8 text-center font-sans text-xs">
                {/* Sisi KIRI: Kepala Sekolah */}
                <div className="flex flex-col items-center">
                  <div className="text-slate-600">Mengetahui / Mengesahkan,</div>
                  <div className="font-semibold text-slate-800 mt-0.5">Kepala Sekolah</div>
                  <div className="h-20 flex items-center justify-center">
                    {/* Ruang tanda tangan rapi */}
                  </div>
                  <div className="font-bold text-slate-900 underline text-xs">
                    {kepalaSekolahName}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    NIP: {schoolConfig.kepalaSekolah?.nip || '19700101 199501 1 001'}
                  </div>
                </div>

                {/* Sisi KANAN: Pengelola Perpustakaan */}
                <div className="flex flex-col items-center">
                  <div className="text-slate-600">
                    {schoolConfig.kabupatenKota || 'Sekolah'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="font-semibold text-slate-800 mt-0.5">Pengelola Perpustakaan</div>
                  <div className="h-20 flex items-center justify-center">
                    {/* Ruang tanda tangan rapi */}
                  </div>
                  <div className="font-bold text-slate-900 underline text-xs">
                    {pengelolaName}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    NIP: {pengelolaPerpus?.nip || '19880415 201502 2 001'}
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Bottom Action Footer (no-print) */}
            <div className="shrink-0 p-3 bg-slate-100 border-t border-slate-300 flex flex-wrap items-center justify-between gap-2 no-print">
              <div className="text-xs text-slate-700 font-medium">
                Koleksi Terpilih: <strong className="text-slate-900">{printBooks.length} Judul / {printViewStats.totalCopies} Eksemplar</strong>
                {printDocType === 'berita_acara' && ` (Bulan: ${formatMonthLabel(selectedMonth)})`}
                {printDocType === 'tahun_beli' && ` (Tahun Beli: ${printYearFilter})`}
                {printDocType === 'tanggal_masuk' && ` (Tanggal Masuk: ${printDateFilter || 'Semua'})`}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadBeritaAcaraDoc}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh (.doc)</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Tutup</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-full shrink-0">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Hapus {selectedBookIds.length} Buku Pilihan?</h3>
                <p className="text-xs text-slate-500">Tindakan ini akan menghapus data buku secara permanen.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700">
              Apakah Anda yakin ingin menghapus <strong className="text-rose-700">{selectedBookIds.length} buku terpilih</strong> berikut dari inventaris perpustakaan?
            </p>

            <div className="max-h-36 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5 text-xs">
              {libraryBooks.filter(b => selectedBookIds.includes(b.id)).slice(0, 6).map(b => (
                <div key={b.id} className="text-slate-700 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="font-semibold text-slate-900">{b.judul}</span>
                  <span className="text-slate-400 font-mono text-[11px]">({b.kodeBuku})</span>
                </div>
              ))}
              {selectedBookIds.length > 6 && (
                <p className="text-[11px] text-slate-500 italic pl-3">
                  ... dan {selectedBookIds.length - 6} buku lainnya.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDeleteBooks}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus {selectedBookIds.length} Buku</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
