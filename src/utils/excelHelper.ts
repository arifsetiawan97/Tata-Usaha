import * as XLSX from 'xlsx';
import { 
  LibraryBookItem, 
  LibraryMemberItem, 
  InventoryItem, 
  TaskLog, 
  RoleType,
  LibraryBookCategory,
  LibraryProcurementSource
} from '../types';

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

/**
 * Excel Helper Utility for SIOPS
 * Handles native Microsoft Excel (.xlsx) template generation, 
 * stylized column configurations, and robust parsing of uploaded .xlsx, .xls, and .csv files.
 */

// Helper to save workbook as .xlsx file in browser
const saveWorkbook = (workbook: XLSX.WorkBook, filename: string) => {
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const INDO_MONTHS_MAP: Record<string, string> = {
  januari: '01', jan: '01', january: '01',
  februari: '02', feb: '02', february: '02',
  maret: '03', mar: '03', march: '03',
  april: '04', apr: '04',
  mei: '05', may: '05',
  juni: '06', jun: '06', june: '06',
  juli: '07', jul: '07', july: '07',
  agustus: '08', ags: '08', agu: '08', aug: '08', august: '08',
  september: '09', sep: '09', sept: '09',
  oktober: '10', okt: '10', oct: '10', october: '10',
  november: '11', nov: '11',
  desember: '12', des: '12', dec: '12', december: '12'
};

/**
 * Format date values extracted from Excel (serial numbers, DD/MM/YYYY, Indonesian text, YYYY-MM-DD, etc.)
 */
export const formatExcelDate = (val: any, fallback: string): string => {
  if (val === undefined || val === null || val === '') return fallback;

  // Handle native Date instance from XLSX
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // Handle Excel serial date number
  if (typeof val === 'number') {
    const totalDays = Math.floor(val - 25569);
    const date = new Date((totalDays * 86400 + 43200) * 1000);
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const s = String(val).trim();
  if (!s) return fallback;

  // 1. Standard ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // 2. YYYY/MM/DD or YYYY.MM.DD
  const ymd = s.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/);
  if (ymd) {
    const year = ymd[1];
    const month = ymd[2].padStart(2, '0');
    const day = ymd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 3. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (e.g. 01/09/2025, 1-9-2025)
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }

  // 4. Indonesian Text Date: "1 September 2025", "01-September-2025", "1 Sep 2025"
  const indoDate = s.match(/^(\d{1,2})[\s/.-]+([a-zA-Z]+)[\s/.-]+(\d{4})$/);
  if (indoDate) {
    const day = indoDate[1].padStart(2, '0');
    const mStr = indoDate[2].toLowerCase();
    const year = indoDate[3];
    const month = INDO_MONTHS_MAP[mStr] || '01';
    return `${year}-${month}-${day}`;
  }

  // 5. Month & Year text: "September 2025", "Sep 2025"
  const monthYearText = s.match(/^([a-zA-Z]+)[\s/.-]+(\d{4})$/);
  if (monthYearText) {
    const mStr = monthYearText[1].toLowerCase();
    const year = monthYearText[2];
    const month = INDO_MONTHS_MAP[mStr] || '01';
    return `${year}-${month}-01`;
  }

  // 6. YYYY-MM or YYYY/MM
  const ym = s.match(/^(\d{4})[/.-](\d{1,2})$/);
  if (ym) {
    const year = ym[1];
    const month = ym[2].padStart(2, '0');
    return `${year}-${month}-01`;
  }

  // 7. MM/YYYY
  const my = s.match(/^(\d{1,2})[/.-](\d{4})$/);
  if (my) {
    const month = my[1].padStart(2, '0');
    const year = my[2];
    return `${year}-${month}-01`;
  }

  // 8. Pure 4-digit year e.g. "2025"
  if (/^\d{4}$/.test(s)) {
    return `${s}-01-01`;
  }

  return fallback;
};

// ==========================================
// 1. BUKU PERPUSTAKAAN (LIBRARY BOOKS)
// ==========================================

export const downloadBookExcelTemplate = () => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Data Buku
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
    'Kondisi (Baik/Rusak Ringan/Rusak Berat)'
  ];

  const sampleRows = [
    [
      'BK-2026-001',
      'Informatika untuk SMP/MTs Kelas VII',
      'Kelas VII',
      'Maresha Caroline Wijanto, dkk.',
      'Pusat Perbukuan Kemdikbudristek',
      2024,
      2026,
      '2026-08-10',
      '000 - Karya Umum, Komputer & Informasi',
      'Buku Teks Utama',
      'siswa',
      'BOS Reguler',
      60,
      32000,
      'Baik'
    ],
    [
      'BK-2026-002',
      'Bahasa Indonesia: Bergerak Bersama Kelas VII',
      'Kelas VII',
      'Rakhma Subarna, dkk.',
      'Pusat Perbukuan Kemdikbudristek',
      2024,
      2026,
      '2026-08-10',
      '400 - Bahasa (Indonesia, Inggris, Arab, Daerah)',
      'Buku Teks Utama',
      'siswa',
      'BOS Reguler',
      60,
      28500,
      'Baik'
    ],
    [
      'BK-2026-003',
      'Matematika untuk SMP/MTs Kelas VII',
      'Kelas VII',
      'Tim Gakko Tosho',
      'Pusat Perbukuan Kemdikbudristek',
      2024,
      2026,
      '2026-09-05',
      '500 - Sains Murni, IPA, Matematika & Biologi',
      'Buku Teks Utama',
      'siswa',
      'BOS Reguler',
      60,
      33000,
      'Baik'
    ],
    [
      'BK-2026-004',
      'Buku Panduan Guru: Pendidikan Pancasila SMP Kelas VII',
      'Kelas VII',
      'Zaim Uchrowi, dkk.',
      'Pusat Perbukuan Kemdikbudristek',
      2024,
      2026,
      '2026-09-12',
      '300 - Ilmu Sosial, Kebijakan, Hukum & Pendidikan',
      'Buku Guru',
      'guru',
      'BOS Kinerja',
      5,
      45000,
      'Baik'
    ],
    [
      'BK-2026-005',
      'Si Putih: Kisah Kucing Pemberani',
      'Kelas VII-IX (Umum)',
      'Tere Liye',
      'Gramedia Pustaka Utama',
      2023,
      2026,
      '2026-10-02',
      '800 - Sastra, Puisi, Prosa, Fiksi & Cerita',
      'Fiksi / Cerita',
      'umum',
      'BOS Kinerja',
      15,
      65000,
      'Baik'
    ],
    [
      'BK-2026-006',
      'Ensiklopedia Sains: Mengenal Alam Semesta',
      'Umum / Referensi',
      'Tim Peneliti LIPI',
      'Balai Pustaka',
      2023,
      2026,
      '2026-10-18',
      '500 - Sains Murni, IPA, Matematika & Biologi',
      'Kamus & Ensiklopedia',
      'referensi',
      'Hibah / Bantuan',
      8,
      125000,
      'Baik'
    ]
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set explicit column widths for Excel
  ws['!cols'] = [
    { wch: 14 }, // Kode Buku
    { wch: 44 }, // Judul Buku
    { wch: 16 }, // Kelas
    { wch: 30 }, // Penulis
    { wch: 30 }, // Penerbit
    { wch: 14 }, // Tahun Terbit
    { wch: 16 }, // Tahun Pembelian
    { wch: 22 }, // Tanggal Masuk
    { wch: 36 }, // DDC
    { wch: 24 }, // Kategori
    { wch: 20 }, // Status
    { wch: 18 }, // Sumber
    { wch: 18 }, // Jumlah
    { wch: 18 }, // Harga
    { wch: 16 }  // Kondisi
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Buku');

  // Sheet 2: Petunjuk Pengisian
  const instructions = [
    ['PETUNJUK PENGISIAN TEMPLATE EXCEL BUKU PERPUSTAKAAN SIOPS'],
    [''],
    ['1. Kolom Bertanda Bintang (*)', 'Wajib diisi (Judul Buku dan Jumlah Eksemplar).'],
    ['2. Tahun Pembelian', 'Tahun saat buku dibeli/diadakan oleh sekolah (contoh: 2026). Jika dikosongkan, otomatis mengambil tahun dari Tanggal Masuk.'],
    ['3. Tanggal Masuk', 'Format tanggal buku masuk ke perpustakaan (YYYY-MM-DD, contoh: 2026-10-15 atau DD/MM/YYYY). Menjadi dasar pemisah penambahan buku bulanan & laporan resmi.'],
    ['4. Kode Buku', 'Bisa dikosongkan. Jika kosong, sistem otomatis membuat kode berurutan (misal: BK-2026-001).'],
    ['5. Status Buku', 'Pilihan: siswa | guru | referensi | umum'],
    ['6. Kategori Buku', 'Pilihan: Buku Teks Utama | Buku Pendamping | Buku Guru | Non-Teks / Fiksi | Non-Teks / Non-Fiksi | Kamus & Ensiklopedia | Fiksi / Cerita | Majalah / Terbitan Berkala | Buku Referensi'],
    ['7. Sumber Pengadaan', 'Pilihan: BOS Reguler | BOS Kinerja | BOS Afirmasi | Hibah / Bantuan | APBD / Pemda | Komite / Paguyuban | Sumbangan Alumni / Siswa | Swadaya Sekolah | DAK'],
    ['8. Klasifikasi DDC', 'Bisa dikosongkan. Sistem SIOPS dilengkapi Auto-DDC cerdas yang otomatis mendeteksi nomor DDC berdasarkan kata kunci judul buku.'],
    ['9. Kondisi', 'Pilihan: Baik | Rusak Ringan | Rusak Berat'],
    [''],
    ['DAFTAR KLASIFIKASI DDC 10 KELAS UTAMA:'],
    ['000', 'Karya Umum, Komputer, Informasi & Bibliografi'],
    ['100', 'Filsafat & Psikologi'],
    ['200', 'Agama & Kepercayaan'],
    ['300', 'Ilmu Sosial, Sosiologi, Hukum, Politik & Pendidikan'],
    ['400', 'Bahasa (Indonesia, Inggris, Daerah, Asing)'],
    ['500', 'Sains Murni, Matematika, Fisika, Kimia, Biologi'],
    ['600', 'Teknologi & Terapan, Kedokteran, Pertanian, Rekayasa'],
    ['700', 'Kesenian, Hiburan, Olahraga & Rekreasi'],
    ['800', 'Kesusastraan, Puisi, Prosa, Fiksi & Cerita'],
    ['900', 'Sejarah, Geografi, Biografi & Peta']
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(instructions);
  wsGuide['!cols'] = [{ wch: 28 }, { wch: 75 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk & Referensi');

  saveWorkbook(wb, `Template_Impor_Buku_Perpustakaan_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportBooksToExcel = (books: LibraryBookItem[], filename: string = 'Daftar_Buku_Perpustakaan') => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'No',
    'Kode Buku',
    'Judul Buku',
    'Kelas',
    'Penulis / Pengarang',
    'Penerbit',
    'Tahun Terbit',
    'Tahun Pembelian',
    'Tanggal Masuk',
    'DDC Klasifikasi',
    'Kategori Buku',
    'Status Buku',
    'Sumber Pengadaan',
    'Jumlah Total',
    'Tersedia',
    'Dipinjam',
    'Harga Satuan (Rp)',
    'Total Nilai (Rp)',
    'Kondisi'
  ];

  const rows = books.map((b, idx) => [
    idx + 1,
    b.kodeBuku,
    b.judul,
    b.kelas || '-',
    b.penulis || '-',
    b.penerbit || '-',
    b.tahunTerbit || '-',
    b.tahunPengadaan || b.tahunBeli || (b.tanggalMasuk ? b.tanggalMasuk.substring(0, 4) : '-'),
    b.tanggalMasuk || '-',
    b.ddcKlasifikasi || '-',
    b.kategoriBuku || b.kategori || '-',
    b.statusBuku || '-',
    b.sumberPengadaan || '-',
    Number(b.jumlah) || 0,
    Number(b.jumlahTersedia ?? b.jumlah) || 0,
    Math.max(0, (Number(b.jumlah) || 0) - (Number(b.jumlahTersedia ?? b.jumlah) || 0)),
    Number(b.hargaSatuan || 0),
    (Number(b.hargaSatuan || 0) * Number(b.jumlah || 0)),
    b.kondisi || 'Baik'
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 38 },
    { wch: 14 },
    { wch: 26 },
    { wch: 26 },
    { wch: 12 },
    { wch: 18 },
    { wch: 30 },
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 14 },
    { wch: 30 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Katalog Buku');
  saveWorkbook(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const parseBookExcelFile = async (
  file: File, 
  targetDate: string,
  existingCount: number = 0
): Promise<Omit<LibraryBookItem, 'id'>[]> => {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  if (!ws) return [];

  // Parse to array of rows (aoa)
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rows.length < 2) return [];

  // Find header row (usually row 0, but check for "judul" or "title")
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const rowStr = rows[i].map((c: any) => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('judul') || rowStr.includes('title') || rowStr.includes('nama buku')) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders = rows[headerRowIndex].map((h: any) => String(h).trim().toLowerCase());
  const dataRows = rows.slice(headerRowIndex + 1);

  // Helper column index finder
  const findCol = (...names: string[]) => {
    return rawHeaders.findIndex(h => names.some(n => h.includes(n)));
  };

  const colKode = findCol('kode');
  const colJudul = findCol('judul', 'title', 'nama buku');
  const colKelas = findCol('kelas', 'tingkat');
  const colPenulis = findCol('penulis', 'pengarang', 'author');
  const colPenerbit = findCol('penerbit', 'publisher');
  const colTahunBeli = findCol('tahun pembelian', 'tahun beli', 'tahun pengadaan', 'thn beli', 'thn pengadaan', 'tahun masuk', 'thn masuk', 'tahun', 'thn');
  const colTanggalMasuk = findCol('tanggal masuk', 'tgl masuk', 'tanggal pengadaan', 'tgl pengadaan', 'tanggal beli', 'tgl beli', 'tanggal terima', 'tgl terima', 'waktu masuk', 'tgl_masuk', 'tanggal', 'tgl', 'hari');
  const colBulan = findCol('bulan masuk', 'bulan pengadaan', 'bln masuk', 'bln pengadaan', 'bulan', 'bln');
  const colTahunTerbit = findCol('tahun terbit', 'thn terbit');
  const colTahunGeneral = findCol('tahun', 'thn');
  const colIsbn = findCol('isbn');
  const colDdc = findCol('ddc', 'klasifikasi');
  const colKategori = findCol('kategori');
  const colStatus = findCol('status');
  const colSumber = findCol('sumber', 'dana', 'pengadaan');
  const colJumlah = findCol('jumlah', 'qty', 'eksemplar', 'volume');
  const colHarga = findCol('harga', 'biaya', 'satuan');
  const colRak = findCol('rak', 'lokasi');
  const colKondisi = findCol('kondisi');
  const colKet = findCol('keterangan', 'catatan', 'ket');

  const defaultMonthKey = targetDate.substring(0, 7);
  const defaultYearNum = parseInt(targetDate.substring(0, 4), 10) || new Date().getFullYear();

  const results: Omit<LibraryBookItem, 'id'>[] = [];

  dataRows.forEach((r, idx) => {
    // If no explicit title column was matched, assume col 1 or 0
    const titleVal = String(colJudul !== -1 ? r[colJudul] : (r[1] || r[0] || '')).trim();
    if (!titleVal || titleVal.toLowerCase().startsWith('contoh') || titleVal.toLowerCase().startsWith('judul')) {
      return;
    }

    // 1. Parse Tanggal Masuk (support string, Excel serial date, Indonesian text, etc.)
    let rowTanggalMasuk = '';
    if (colTanggalMasuk !== -1 && r[colTanggalMasuk] !== undefined && String(r[colTanggalMasuk]).trim() !== '') {
      const parsedDate = formatExcelDate(r[colTanggalMasuk], '');
      if (parsedDate) {
        rowTanggalMasuk = parsedDate;
      }
    }

    // 2. Parse Bulan Masuk / Pengadaan if separate column exists
    let rowBulan = '';
    if (colBulan !== -1 && r[colBulan] !== undefined && String(r[colBulan]).trim() !== '') {
      const rawB = String(r[colBulan]).trim().toLowerCase();
      rowBulan = INDO_MONTHS_MAP[rawB] || (rawB.length === 1 ? `0${rawB}` : rawB.padStart(2, '0'));
    }

    // 3. Parse Tahun Pembelian
    let rowTahunBeli = 0;
    if (colTahunBeli !== -1 && r[colTahunBeli]) {
      const pYear = parseInt(String(r[colTahunBeli]).replace(/\D/g, ''), 10);
      if (pYear && pYear >= 1990 && pYear <= 2100) {
        rowTahunBeli = pYear;
      }
    }
    if (!rowTahunBeli && rowTanggalMasuk && rowTanggalMasuk.length >= 4) {
      const pYear = parseInt(rowTanggalMasuk.substring(0, 4), 10);
      if (pYear && pYear >= 1990 && pYear <= 2100) {
        rowTahunBeli = pYear;
      }
    }
    if (!rowTahunBeli) {
      rowTahunBeli = defaultYearNum;
    }

    // Assembling precise Tanggal Masuk (YYYY-MM-DD)
    if (!rowTanggalMasuk) {
      const m = rowBulan || targetDate.substring(5, 7) || '01';
      rowTanggalMasuk = `${rowTahunBeli}-${m.padStart(2, '0')}-01`;
    } else if (rowBulan && rowTanggalMasuk.includes('-')) {
      const parts = rowTanggalMasuk.split('-');
      if (parts.length === 3) {
        rowTanggalMasuk = `${rowTahunBeli}-${rowBulan.padStart(2, '0')}-${parts[2]}`;
      }
    }

    // Ensure year portion aligns with rowTahunBeli
    if (rowTahunBeli && rowTanggalMasuk.includes('-')) {
      const parts = rowTanggalMasuk.split('-');
      if (parts[0] !== String(rowTahunBeli)) {
        rowTanggalMasuk = `${rowTahunBeli}-${parts[1] || '01'}-${parts[2] || '01'}`;
      }
    }

    // Determine rowMonthKey from rowTanggalMasuk (YYYY-MM)
    const rowMonthKey = rowTanggalMasuk.length >= 7 ? rowTanggalMasuk.substring(0, 7) : `${rowTahunBeli}-01`;

    // Parse Tahun Terbit
    let tahunTerbit = rowTahunBeli;
    if (colTahunTerbit !== -1 && r[colTahunTerbit]) {
      const pYear = parseInt(String(r[colTahunTerbit]).replace(/\D/g, ''), 10);
      if (pYear && pYear >= 1900 && pYear <= 2100) {
        tahunTerbit = pYear;
      }
    } else if (colTahunGeneral !== -1 && colTahunGeneral !== colTahunBeli && r[colTahunGeneral]) {
      const pYear = parseInt(String(r[colTahunGeneral]).replace(/\D/g, ''), 10);
      if (pYear && pYear >= 1900 && pYear <= 2100) {
        tahunTerbit = pYear;
      }
    }

    const customKode = colKode !== -1 && String(r[colKode]).trim();
    const codeSuffix = String(existingCount + results.length + 1).padStart(3, '0');
    const kodeBuku = customKode ? customKode : `BK-${rowTahunBeli}-${codeSuffix}`;

    const kelas = colKelas !== -1 && r[colKelas] ? String(r[colKelas]).trim() : 'Kelas VII';
    const penulis = colPenulis !== -1 && r[colPenulis] ? String(r[colPenulis]).trim() : 'Tim Penyusun';
    const penerbit = colPenerbit !== -1 && r[colPenerbit] ? String(r[colPenerbit]).trim() : 'Kemdikbudristek';
    const isbn = colIsbn !== -1 && r[colIsbn] ? String(r[colIsbn]).trim() : '';
    
    // Auto detect DDC if not provided
    let ddcKlasifikasi = colDdc !== -1 && r[colDdc] ? String(r[colDdc]).trim() : '';
    if (!ddcKlasifikasi || ddcKlasifikasi === '-') {
      ddcKlasifikasi = detectDdcFromTitle(titleVal);
    }

    const rawKategori = colKategori !== -1 && r[colKategori] ? String(r[colKategori]).trim() : 'Buku Teks Utama';
    const kategoriBuku = (rawKategori as LibraryBookCategory) || 'Buku Teks Utama';

    const rawStatus = colStatus !== -1 && r[colStatus] ? String(r[colStatus]).toLowerCase().trim() : 'siswa';
    const statusBuku = rawStatus.includes('guru') ? 'guru' : rawStatus.includes('referensi') ? 'referensi' : rawStatus.includes('umum') ? 'umum' : 'siswa';

    const rawSumber = colSumber !== -1 && r[colSumber] ? String(r[colSumber]).trim() : 'BOS Reguler';
    const sumberPengadaan = (rawSumber as LibraryProcurementSource) || 'BOS Reguler';

    const rawQty = colJumlah !== -1 && r[colJumlah] ? parseInt(String(r[colJumlah]).replace(/\D/g, ''), 10) : 1;
    const jumlah = isNaN(rawQty) || rawQty <= 0 ? 1 : rawQty;

    const rawHarga = colHarga !== -1 && r[colHarga] ? parseInt(String(r[colHarga]).replace(/\D/g, ''), 10) : 0;
    const hargaSatuan = isNaN(rawHarga) ? 0 : rawHarga;

    const lokasiRak = colRak !== -1 && r[colRak] ? String(r[colRak]).trim() : 'Ruang Perpustakaan';
    const kondisi = colKondisi !== -1 && r[colKondisi] ? (String(r[colKondisi]).trim() as any) : 'Baik';
    const keterangan = colKet !== -1 && r[colKet] ? String(r[colKet]).trim() : `Pengadaan Buku ${rowMonthKey}`;

    results.push({
      kodeBuku,
      judul: titleVal,
      penulis,
      penerbit,
      tahunTerbit,
      tahunBeli: rowTahunBeli,
      isbn,
      kelas,
      statusBuku,
      ddcKlasifikasi,
      kategoriBuku,
      sumberPengadaan,
      tanggalMasuk: rowTanggalMasuk,
      bulanPengadaan: rowMonthKey,
      tahunPengadaan: rowTahunBeli,
      jumlah,
      jumlahTersedia: jumlah,
      hargaSatuan,
      totalHarga: hargaSatuan * jumlah,
      lokasiRak,
      kondisi,
      keterangan
    });
  });

  return results;
};

// ==========================================
// 2. INVENTARIS SARPRAS (INVENTORY ITEMS)
// ==========================================

export const downloadInventoryExcelTemplate = (role: RoleType = 'TU') => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Kode Barang',
    'Nama Barang & Merk / Tipe *',
    'Kategori Barang *',
    'Jumlah *',
    'Satuan (Unit/Pcs/Set/Buah)',
    'Kondisi (Baik/Rusak Ringan/Rusak Berat)',
    'Lokasi Penyimpanan / Ruangan',
    'Tahun Pengadaan',
    'Sumber Dana (BOS/DAK/Komite/Hibah)',
    'Keterangan & Spesifikasi Tambahan'
  ];

  const sampleRows = [
    [
      'INV-001',
      'Laptop Asus ExpertBook Core i5 (RAM 16GB)',
      'Elektronik',
      2,
      'Unit',
      'Baik',
      'Ruang Tata Usaha',
      2024,
      'BOS Reguler',
      'Perangkat operasional administrasi sekolah'
    ],
    [
      'INV-002',
      'Printer Epson L3210 All-in-One InkTank',
      'Elektronik',
      1,
      'Unit',
      'Baik',
      'Ruang Tata Usaha',
      2023,
      'BOS Reguler',
      'Pencetakan surat dinas dan laporan bulanan'
    ],
    [
      'INV-003',
      'Lemari Arsip Besi 4 Pintu Lion',
      'Meubeler',
      2,
      'Unit',
      'Baik',
      'Ruang Tata Usaha',
      2022,
      'DAK Fisik',
      'Penyimpanan buku induk dan dokumen penting'
    ],
    [
      'INV-004',
      'Meja Kerja Pegawai Kayu Jati 1/2 Biro',
      'Meubeler',
      4,
      'Unit',
      'Baik',
      'Ruang Kerja Administrasi',
      2022,
      'BOS Reguler',
      'Kondisi terawat lengkap laci kunci'
    ],
    [
      'INV-005',
      'Proyektor InFocus IN112AA DLP',
      'Elektronik',
      1,
      'Unit',
      'Rusak Ringan',
      'Gudang Sarpras',
      2021,
      'BOS Reguler',
      'Lampu redup butuh servis penggantian berkala'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 16 },
    { wch: 42 },
    { wch: 20 },
    { wch: 12 },
    { wch: 16 },
    { wch: 18 },
    { wch: 28 },
    { wch: 16 },
    { wch: 22 },
    { wch: 40 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Inventaris Sarpras');

  // Sheet 2: Petunjuk
  const guide = [
    ['PETUNJUK PENGISIAN TEMPLATE EXCEL SARANA PRASARANA (SARPRAS)'],
    [''],
    ['1. Kolom Bertanda Bintang (*)', 'Wajib diisi (Nama Barang, Kategori, Jumlah).'],
    ['2. Kode Barang', 'Bisa dikosongkan. Jika kosong, sistem otomatis membuat kode unik sistematis.'],
    ['3. Pilihan Kondisi', 'Baik | Rusak Ringan | Rusak Berat'],
    ['4. Satuan Umum', 'Unit, Pcs, Set, Buah, Rim, Paket, Lembar, Kotak, Dus, Roll'],
    ['5. Kategori Umum', 'Elektronik, Meubeler, Alat Praktik, Buku/Pustaka, Mesin/Kendaraan, Sanitasi/Kebersihan, Sarana Olahraga, Keamanan, Perlengkapan, Lainnya']
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guide);
  wsGuide['!cols'] = [{ wch: 28 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk');

  saveWorkbook(wb, `Template_Impor_Inventaris_${role}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportInventoriesToExcel = (items: InventoryItem[], roleTitle: string = 'Sarpras') => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'No',
    'Kode Barang',
    'Nama Barang & Merk / Tipe',
    'Kategori',
    'Jumlah',
    'Satuan',
    'Kondisi',
    'Lokasi Penyimpanan',
    'Tahun Pengadaan',
    'Sumber Dana',
    'Keterangan'
  ];

  const rows = items.map((it, idx) => [
    idx + 1,
    it.kodeBarang,
    it.namaBarang,
    it.kategori || '-',
    Number(it.jumlah) || 1,
    it.satuan || 'Unit',
    it.kondisi || 'Baik',
    it.lokasiPenyimpanan || '-',
    it.tahunPengadaan || '-',
    (it as any).sumberDana || '-',
    it.keterangan || '-'
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 40 },
    { wch: 20 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 26 },
    { wch: 16 },
    { wch: 18 },
    { wch: 35 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Buku Inventaris');
  saveWorkbook(wb, `Buku_Inventaris_${roleTitle}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const parseInventoryExcelFile = async (
  file: File, 
  role: RoleType
): Promise<Omit<InventoryItem, 'id'>[]> => {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  if (!ws) return [];

  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rows.length < 2) return [];

  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const rowStr = rows[i].map((c: any) => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('nama') || rowStr.includes('barang') || rowStr.includes('kode')) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders = rows[headerRowIndex].map((h: any) => String(h).trim().toLowerCase());
  const dataRows = rows.slice(headerRowIndex + 1);

  const findCol = (...names: string[]) => {
    return rawHeaders.findIndex(h => names.some(n => h.includes(n)));
  };

  const colKode = findCol('kode');
  const colNama = findCol('nama', 'barang', 'item');
  const colMerk = findCol('merk', 'tipe', 'brand', 'model');
  const colKat = findCol('kategori', 'jenis');
  const colJml = findCol('jumlah', 'qty', 'banyak');
  const colSatuan = findCol('satuan', 'unit');
  const colKondisi = findCol('kondisi', 'keadaan');
  const colLokasi = findCol('lokasi', 'ruang', 'simpan');
  const colTahun = findCol('tahun', 'pengadaan');
  const colKet = findCol('keterangan', 'spesifikasi', 'catatan');

  const results: Omit<InventoryItem, 'id'>[] = [];
  const currentYear = new Date().getFullYear();

  dataRows.forEach((r) => {
    const nama = String(colNama !== -1 ? r[colNama] : (r[1] || r[0] || '')).trim();
    if (!nama || nama.toLowerCase().startsWith('contoh') || nama.toLowerCase().startsWith('nama barang')) {
      return;
    }

    const customKode = colKode !== -1 && String(r[colKode]).trim();
    const kodeBarang = customKode ? customKode : `INV-${role.substring(0, 3)}-${String(results.length + 1).padStart(3, '0')}`;

    const merkModel = colMerk !== -1 && r[colMerk] ? String(r[colMerk]).trim() : '-';
    const kategori = colKat !== -1 && r[colKat] ? String(r[colKat]).trim() : 'Perlengkapan';
    const rawJml = colJml !== -1 && r[colJml] ? parseInt(String(r[colJml]).replace(/\D/g, ''), 10) : 1;
    const jumlah = isNaN(rawJml) || rawJml <= 0 ? 1 : rawJml;
    const satuan = colSatuan !== -1 && r[colSatuan] ? String(r[colSatuan]).trim() : 'Unit';

    const rawKondisi = colKondisi !== -1 && r[colKondisi] ? String(r[colKondisi]).trim().toLowerCase() : 'baik';
    const kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' = 
      rawKondisi.includes('berat') ? 'Rusak Berat' :
      rawKondisi.includes('ringan') ? 'Rusak Ringan' : 'Baik';

    const lokasiPenyimpanan = colLokasi !== -1 && r[colLokasi] ? String(r[colLokasi]).trim() : 'Ruang Operasional';
    const tahunPengadaan = colTahun !== -1 && r[colTahun] ? (parseInt(String(r[colTahun]).replace(/\D/g, ''), 10) || currentYear) : currentYear;
    const keterangan = colKet !== -1 && r[colKet] ? String(r[colKet]).trim() : 'Diimpor otomatis dari berkas Excel';

    results.push({
      role,
      kodeBarang,
      namaBarang: nama,
      merkModel,
      kategori,
      jumlah,
      satuan,
      kondisi,
      lokasiPenyimpanan,
      tahunPengadaan,
      keterangan
    });
  });

  return results;
};

// ==========================================
// 3. ANGGOTA PERPUSTAKAAN (LIBRARY MEMBERS)
// ==========================================

export const downloadMemberExcelTemplate = () => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Nomor Anggota *',
    'Nama Lengkap & Gelar *',
    'Kategori (GURU / STAFF / SISWA) *',
    'Kelas / Jabatan Unit Kerja',
    'NIP / NISN / Identitas',
    'Jenis Kelamin (L / P)',
    'Tanggal Terdaftar (YYYY-MM-DD)',
    'Nomor Telepon / WhatsApp',
    'Status (Aktif / Nonaktif)',
    'Keterangan'
  ];

  const sampleRows = [
    [
      'ANG-G-001',
      'Dra. Hj. Siti Rahmawati M.Pd',
      'GURU',
      'Guru Bahasa Indonesia',
      '19750512 200003 2 001',
      'P',
      '2026-01-10',
      '081234567890',
      'Aktif',
      'Anggota Aktif Pendidik'
    ],
    [
      'ANG-G-002',
      'Drs. Budi Santoso M.Si',
      'GURU',
      'Guru IPA Terpadu',
      '19780214 200501 1 004',
      'L',
      '2026-01-10',
      '081298765432',
      'Aktif',
      'Anggota Aktif Pendidik'
    ],
    [
      'ANG-ST-001',
      'Ahmad Fauzi S.Kom',
      'STAFF',
      'Pengelola IT & Tata Usaha',
      '19890918 201402 1 002',
      'L',
      '2026-01-15',
      '085712345678',
      'Aktif',
      'Anggota Tenaga Administrasi'
    ],
    [
      'ANG-ST-002',
      'Dewi Sartika S.AP',
      'STAFF',
      'Administrasi Kepegawaian',
      '19920325 201601 2 003',
      'P',
      '2026-01-15',
      '085698765432',
      'Aktif',
      'Anggota Tenaga Administrasi'
    ],
    [
      'ANG-SW-001',
      'Muhammad Rizky Pratama',
      'SISWA',
      'Kelas VII-A',
      '0087654321',
      'L',
      '2026-07-20',
      '081311223344',
      'Aktif',
      'Anggota Siswa Baru'
    ],
    [
      'ANG-SW-002',
      'Aisyah Nur Salsabila',
      'SISWA',
      'Kelas VII-B',
      '0087654322',
      'P',
      '2026-07-20',
      '081322334455',
      'Aktif',
      'Anggota Siswa Baru'
    ],
    [
      'ANG-SW-003',
      'Farhan Maulana',
      'SISWA',
      'Kelas VIII-C',
      '0076543210',
      'L',
      '2026-07-20',
      '081333445566',
      'Aktif',
      'Anggota Siswa Aktif'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 16 },
    { wch: 32 },
    { wch: 16 },
    { wch: 28 },
    { wch: 24 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 14 },
    { wch: 30 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Anggota');

  // Sheet 2: Petunjuk
  const guide = [
    ['PETUNJUK PENGISIAN TEMPLATE EXCEL ANGGOTA PERPUSTAKAAN SIOPS'],
    [''],
    ['1. Kolom Bertanda Bintang (*)', 'Wajib diisi (Nomor Anggota, Nama Lengkap, Kategori).'],
    ['2. Kategori Anggota', 'Pilihan Wajib: GURU | STAFF | SISWA'],
    ['3. Jenis Kelamin', 'Pilihan: L (Laki-laki) atau P (Perempuan)'],
    ['4. Format Tanggal', 'Gunakan format standar YYYY-MM-DD (Contoh: 2026-01-15)'],
    ['5. Status', 'Pilihan: Aktif atau Nonaktif']
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guide);
  wsGuide['!cols'] = [{ wch: 28 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk');

  saveWorkbook(wb, `Template_Impor_Anggota_Perpustakaan_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportMembersToExcel = (members: LibraryMemberItem[]) => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'No',
    'Nomor Anggota',
    'Nama Lengkap',
    'Kategori',
    'Kelas / Jabatan Unit Kerja',
    'NIP / NISN',
    'L/P',
    'Tanggal Terdaftar',
    'Telepon / WhatsApp',
    'Status',
    'Keterangan'
  ];

  const rows = members.map((m, idx) => [
    idx + 1,
    m.nomorAnggota,
    m.nama,
    m.tipeAnggota || 'SISWA',
    m.kelasAtauJabatan || '-',
    m.nomorIdentitas || '-',
    m.jenisKelamin || 'L',
    m.tanggalBergabung || m.tanggalTerdaftar || '-',
    m.telepon || '-',
    m.status || 'aktif',
    m.keterangan || '-'
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 32 },
    { wch: 14 },
    { wch: 28 },
    { wch: 24 },
    { wch: 8 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 30 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Daftar Anggota');
  saveWorkbook(wb, `Daftar_Anggota_Perpustakaan_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const parseMemberExcelFile = async (
  file: File,
  existingCount: number = 0
): Promise<Omit<LibraryMemberItem, 'id'>[]> => {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  if (!ws) return [];

  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rows.length < 2) return [];

  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const rowStr = rows[i].map((c: any) => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('nama') || rowStr.includes('anggota') || rowStr.includes('nip') || rowStr.includes('nisn')) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders = rows[headerRowIndex].map((h: any) => String(h).trim().toLowerCase());
  const dataRows = rows.slice(headerRowIndex + 1);

  const findCol = (...names: string[]) => {
    return rawHeaders.findIndex(h => names.some(n => h.includes(n)));
  };

  const colNo = findCol('nomor', 'no anggota', 'id');
  const colNama = findCol('nama', 'nama lengkap');
  const colKat = findCol('kategori', 'jenis anggota', 'tipe');
  const colJabatan = findCol('kelas', 'jabatan', 'unit');
  const colId = findCol('nip', 'nisn', 'identitas');
  const colJk = findCol('kelamin', 'l/p', 'gender', 'jk');
  const colTgl = findCol('tanggal', 'terdaftar', 'bergabung');
  const colTelp = findCol('telepon', 'hp', 'wa', 'whatsapp');
  const colStatus = findCol('status');
  const colKet = findCol('keterangan', 'catatan');

  const results: Omit<LibraryMemberItem, 'id'>[] = [];
  const today = new Date().toISOString().split('T')[0];

  dataRows.forEach((r, idx) => {
    const nama = String(colNama !== -1 ? r[colNama] : (r[1] || r[0] || '')).trim();
    if (!nama || nama.toLowerCase().startsWith('contoh') || nama.toLowerCase().startsWith('nama')) {
      return;
    }

    const rawKat = colKat !== -1 && r[colKat] ? String(r[colKat]).toUpperCase().trim() : 'SISWA';
    const tipeAnggota: 'GURU' | 'STAFF' | 'SISWA' = 
      rawKat.includes('GURU') ? 'GURU' :
      rawKat.includes('STAF') ? 'STAFF' : 'SISWA';

    const customNo = colNo !== -1 && String(r[colNo]).trim();
    const prefix = tipeAnggota === 'GURU' ? 'ANG-G' : tipeAnggota === 'STAFF' ? 'ANG-ST' : 'ANG-SW';
    const nomorAnggota = customNo ? customNo : `${prefix}-${String(existingCount + results.length + 1).padStart(3, '0')}`;

    const kelasAtauJabatan = colJabatan !== -1 && r[colJabatan] ? String(r[colJabatan]).trim() : (tipeAnggota === 'SISWA' ? 'Kelas VII-A' : tipeAnggota === 'GURU' ? 'Guru' : 'Staff');
    const nomorIdentitas = colId !== -1 && r[colId] ? String(r[colId]).trim() : '';

    const rawJk = colJk !== -1 && r[colJk] ? String(r[colJk]).toUpperCase().trim() : 'L';
    const jenisKelamin: 'L' | 'P' = rawJk.startsWith('P') ? 'P' : 'L';

    const tanggalBergabung = colTgl !== -1 && r[colTgl] ? String(r[colTgl]).trim() : today;
    const telepon = colTelp !== -1 && r[colTelp] ? String(r[colTelp]).trim() : '';
    const status = colStatus !== -1 && r[colStatus] ? (String(r[colStatus]).toLowerCase().includes('non') ? 'nonaktif' : 'aktif') : 'aktif';
    const keterangan = colKet !== -1 && r[colKet] ? String(r[colKet]).trim() : 'Diimpor otomatis dari berkas Excel';

    results.push({
      nomorAnggota,
      nama,
      tipeAnggota,
      kelasAtauJabatan,
      nomorIdentitas,
      jenisKelamin,
      tanggalBergabung,
      tanggalTerdaftar: tanggalBergabung,
      status: status as any,
      telepon,
      keterangan
    });
  });

  return results;
};

// ==========================================
// 4. JURNAL TUGAS HARIAN (DAILY TASKS)
// ==========================================

export const downloadDailyTaskExcelTemplate = (role: RoleType = 'TU') => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Tanggal (YYYY-MM-DD) *',
    'Waktu Mulai (JJ:MM) *',
    'Waktu Selesai (JJ:MM) *',
    'Judul Kegiatan Pekerjaan *',
    'Uraian Rincian Pekerjaan *',
    'Lokasi / Titik Pelaksanaan',
    'Volume / Satuan Hasil',
    'Kategori Pekerjaan',
    'Jenis Tugas (pokok / tambahan)',
    'Status (selesai / dalam_proses / perlu_tindak_lanjut)',
    'Catatan / Kendala'
  ];

  const today = new Date().toISOString().split('T')[0];

  const sampleRows = [
    [
      today,
      '07:30',
      '09:00',
      'Pengelolaan Surat Masuk dan Disposisi Kepala Sekolah',
      'Menerima, mencatat nomor agenda surat dinas, mengunggah arsip digital, dan meneruskan lembar disposisi kepada Kepala Sekolah.',
      'Ruang Tata Usaha',
      '3 Berkas Surat',
      'administrasi_persuratan',
      'pokok',
      'selesai',
      'Seluruh disposisi telah diserahkan tepat waktu.'
    ],
    [
      today,
      '09:15',
      '11:30',
      'Sinkronisasi dan Validasi Data Dapodik Semester Berjalan',
      'Memeriksa kelengkapan data rombel, registrasi peserta didik baru, dan memperbarui riwayat kepangkatan pendidik.',
      'Ruang Tata Usaha & Server',
      '1 Laporan Sinkronisasi',
      'layanan_dapodik',
      'pokok',
      'selesai',
      'Status sinkronisasi server pusat 100% valid.'
    ],
    [
      today,
      '13:00',
      '15:00',
      'Pendampingan Administrasi Tim Akreditasi Sekolah',
      'Membantu penyiapan bukti fisik dokumen standar sarana prasarana dan standar pengelolaan.',
      'Ruang Rapat / Akreditasi',
      '1 Paket Dokumen',
      'kepanitiaan_sekolah',
      'tambahan',
      'selesai',
      'Tugas kedinasan tambahan siap pakai.'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 38 },
    { wch: 55 },
    { wch: 25 },
    { wch: 20 },
    { wch: 25 },
    { wch: 18 },
    { wch: 22 },
    { wch: 35 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Jurnal Tugas Harian');

  const guide = [
    ['PETUNJUK PENGISIAN TEMPLATE EXCEL TUGAS HARIAN SIOPS'],
    [''],
    ['1. Kolom Bertanda Bintang (*)', 'Wajib diisi (Tanggal, Jam Mulai, Jam Selesai, Judul Kegiatan, Uraian Rincian).'],
    ['2. Format Tanggal & Jam', 'Gunakan format YYYY-MM-DD (contoh: 2026-05-18) dan JJ:MM (contoh: 07:30).'],
    ['3. Jenis Tugas', 'Pilihan: pokok (Tugas Pokok) atau tambahan (Tugas Tambahan Dinas).'],
    ['4. Status Pekerjaan', 'Pilihan: selesai | dalam_proses | butuh_tindak_lanjut'],
    ['5. Fitur Cerdas SIOPS', 'Uraian rincian pekerjaan dapat dibuat otomatis dengan AI di aplikasi SIOPS menggunakan tombol ✨ Tulis Rincian Otomatis (AI).']
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guide);
  wsGuide['!cols'] = [{ wch: 28 }, { wch: 75 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk');

  saveWorkbook(wb, `Template_Impor_Tugas_Harian_${role}_${today}.xlsx`);
};

export const parseDailyTaskExcelFile = async (
  file: File,
  role: RoleType
): Promise<Omit<TaskLog, 'id'>[]> => {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  if (!ws) return [];

  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rows.length < 2) return [];

  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const rowStr = rows[i].map((c: any) => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('judul') || rowStr.includes('kegiatan') || rowStr.includes('tanggal')) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders = rows[headerRowIndex].map((h: any) => String(h).trim().toLowerCase());
  const dataRows = rows.slice(headerRowIndex + 1);

  const findCol = (...names: string[]) => {
    return rawHeaders.findIndex(h => names.some(n => h.includes(n)));
  };

  const colTgl = findCol('tanggal', 'date', 'hari');
  const colStart = findCol('mulai', 'start', 'jam');
  const colEnd = findCol('selesai', 'end', 'akhir');
  const colJudul = findCol('judul', 'kegiatan', 'nama tugas');
  const colDesc = findCol('uraian', 'rincian', 'deskripsi', 'keterangan');
  const colLoc = findCol('lokasi', 'tempat', 'titik');
  const colVol = findCol('volume', 'satuan', 'hasil');
  const colKat = findCol('kategori');
  const colType = findCol('jenis', 'tupoksi');
  const colStatus = findCol('status', 'keadaan');
  const colPetugas = findCol('petugas', 'nama petugas', 'pegawai');
  const colNotes = findCol('catatan', 'kendala', 'notes');

  const today = new Date().toISOString().split('T')[0];
  const results: Omit<TaskLog, 'id'>[] = [];

  dataRows.forEach((r) => {
    const title = String(colJudul !== -1 ? r[colJudul] : (r[3] || r[0] || '')).trim();
    if (!title || title.toLowerCase().startsWith('contoh') || title.toLowerCase().startsWith('judul')) {
      return;
    }

    const dateVal = colTgl !== -1 && r[colTgl] ? String(r[colTgl]).trim() : today;
    const timeStart = colStart !== -1 && r[colStart] ? String(r[colStart]).trim() : '08:00';
    const timeEnd = colEnd !== -1 && r[colEnd] ? String(r[colEnd]).trim() : '10:00';
    const description = colDesc !== -1 && r[colDesc] ? String(r[colDesc]).trim() : title;
    const location = colLoc !== -1 && r[colLoc] ? String(r[colLoc]).trim() : 'Lingkungan Sekolah';
    const volumeUnit = colVol !== -1 && r[colVol] ? String(r[colVol]).trim() : '1 Kegiatan';
    const category = colKat !== -1 && r[colKat] ? String(r[colKat]).trim() : 'administrasi_umum';

    const rawType = colType !== -1 && r[colType] ? String(r[colType]).toLowerCase().trim() : 'pokok';
    const taskType: 'pokok' | 'tambahan' = rawType.includes('tambah') ? 'tambahan' : 'pokok';

    const rawStatus = colStatus !== -1 && r[colStatus] ? String(r[colStatus]).toLowerCase().trim() : 'selesai';
    const status: 'selesai' | 'dalam_proses' | 'perlu_tindak_lanjut' = 
      rawStatus.includes('proses') ? 'dalam_proses' :
      (rawStatus.includes('tindak') || rawStatus.includes('lanjut')) ? 'perlu_tindak_lanjut' : 'selesai';

    const petugas = colPetugas !== -1 && r[colPetugas] ? String(r[colPetugas]).trim() : `Petugas ${role}`;
    const notes = colNotes !== -1 && r[colNotes] ? String(r[colNotes]).trim() : '';

    results.push({
      role,
      date: dateVal,
      timeStart,
      timeEnd,
      title,
      description,
      location,
      volumeUnit,
      category,
      taskType,
      status,
      petugas,
      notes,
      photoUrl: ''
    });
  });

  return results;
};
