import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

import { 
  initialTasks, 
  initialInventories, 
  initialMonthlyReports, 
  initialAnnualReports, 
  initialArchives, 
  initialSchoolConfig, 
  initialCustomCategories 
} from './src/data/initialData';
import { OFFICIAL_TUPOKSI_DEFINITIONS } from './src/utils/taskClassification';

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory and initial persistent database exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DB_FILE)) {
  try {
    const initialDbData = {
      tasks: initialTasks,
      inventories: initialInventories,
      monthlyReports: initialMonthlyReports,
      annualReports: initialAnnualReports,
      schoolConfig: initialSchoolConfig,
      archives: initialArchives,
      tupoksiDefinitions: OFFICIAL_TUPOKSI_DEFINITIONS,
      customCategories: initialCustomCategories,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDbData, null, 2), 'utf-8');
    console.log('[Server DB] Basis data awal berhasil di-seed ke data/db.json');
  } catch (err) {
    console.error('[Server DB] Gagal inisialisasi basis data awal:', err);
  }
}

// Helper to read DB
function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  return null;
}

// Helper to write DB
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET all stored application state
app.get('/api/state', (req, res) => {
  const data = readDb();
  if (!data) {
    return res.json({ initialized: false });
  }
  res.json({ initialized: true, data });
});

// POST update entire application state
app.post('/api/state', (req, res) => {
  const { tasks, inventories, monthlyReports, annualReports, schoolConfig, archives, tupoksiDefinitions, customCategories } = req.body;
  const current = readDb() || {};
  const updated = {
    ...current,
    tasks: tasks !== undefined ? tasks : current.tasks,
    inventories: inventories !== undefined ? inventories : current.inventories,
    monthlyReports: monthlyReports !== undefined ? monthlyReports : current.monthlyReports,
    annualReports: annualReports !== undefined ? annualReports : current.annualReports,
    schoolConfig: schoolConfig !== undefined ? schoolConfig : current.schoolConfig,
    archives: archives !== undefined ? archives : current.archives,
    tupoksiDefinitions: tupoksiDefinitions !== undefined ? tupoksiDefinitions : current.tupoksiDefinitions,
    customCategories: customCategories !== undefined ? customCategories : current.customCategories,
    lastUpdated: new Date().toISOString()
  };
  const success = writeDb(updated);
  if (success) {
    res.json({ success: true, lastUpdated: updated.lastUpdated });
  } else {
    res.status(500).json({ error: 'Gagal menyimpan basis data ke server' });
  }
});

// ========================================================
// RESTful CRUD API ENDPOINTS (Database Server Logic)
// Separated storage logic from UI interface
// ========================================================
const VALID_COLLECTIONS = ['tasks', 'inventories', 'monthlyReports', 'annualReports', 'archives', 'customCategories'];

// READ Collection
app.get('/api/crud/:collection', (req, res) => {
  const { collection } = req.params;
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: `Koleksi tidak valid: ${collection}` });
  }
  const db = readDb() || {};
  const items = Array.isArray(db[collection]) ? db[collection] : [];
  res.json({ success: true, collection, count: items.length, data: items });
});

// READ Single Item
app.get('/api/crud/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: `Koleksi tidak valid: ${collection}` });
  }
  const db = readDb() || {};
  const items = Array.isArray(db[collection]) ? db[collection] : [];
  const found = items.find((item: any) => item.id === id);
  if (!found) {
    return res.status(404).json({ error: `Item id ${id} tidak ditemukan pada ${collection}` });
  }
  res.json({ success: true, data: found });
});

// CREATE Item
app.post('/api/crud/:collection', (req, res) => {
  const { collection } = req.params;
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: `Koleksi tidak valid: ${collection}` });
  }
  const newItem = req.body;
  if (!newItem || typeof newItem !== 'object') {
    return res.status(400).json({ error: 'Data item harus berupa objek valid' });
  }

  const db = readDb() || {};
  const items = Array.isArray(db[collection]) ? [...db[collection]] : [];
  
  if (!newItem.id) {
    newItem.id = `${collection.substring(0, 4)}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }
  
  items.unshift(newItem);
  db[collection] = items;
  db.lastUpdated = new Date().toISOString();

  const success = writeDb(db);
  if (success) {
    res.status(201).json({ success: true, created: newItem, lastUpdated: db.lastUpdated });
  } else {
    res.status(500).json({ error: 'Gagal menambahkan data ke basis data server' });
  }
});

// UPDATE Item
app.put('/api/crud/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: `Koleksi tidak valid: ${collection}` });
  }
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Data pembaruan tidak valid' });
  }

  const db = readDb() || {};
  const items = Array.isArray(db[collection]) ? [...db[collection]] : [];
  const index = items.findIndex((item: any) => item.id === id);

  if (index === -1) {
    // If not found, create or return 404
    items.unshift({ ...updates, id });
  } else {
    items[index] = { ...items[index], ...updates, id };
  }

  db[collection] = items;
  db.lastUpdated = new Date().toISOString();

  const success = writeDb(db);
  if (success) {
    res.json({ success: true, updated: items[index === -1 ? 0 : index], lastUpdated: db.lastUpdated });
  } else {
    res.status(500).json({ error: 'Gagal memperbarui data di basis data server' });
  }
});

// DELETE Item
app.delete('/api/crud/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: `Koleksi tidak valid: ${collection}` });
  }

  const db = readDb() || {};
  const items = Array.isArray(db[collection]) ? [...db[collection]] : [];
  const filtered = items.filter((item: any) => item.id !== id);

  db[collection] = filtered;
  db.lastUpdated = new Date().toISOString();

  const success = writeDb(db);
  if (success) {
    res.json({ success: true, deletedId: id, remainingCount: filtered.length, lastUpdated: db.lastUpdated });
  } else {
    res.status(500).json({ error: 'Gagal menghapus data dari basis data server' });
  }
});

// Export Backup JSON
app.get('/api/backup', (req, res) => {
  const data = readDb();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="backup-siops-sekolah.json"');
  res.send(JSON.stringify(data || {}, null, 2));
});

// Gemini AI Client Setup
let geminiClient: any = null;
async function getGeminiClient() {
  if (geminiClient) return geminiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const { GoogleGenAI } = await import('@google/genai');
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    return geminiClient;
  } catch (err) {
    console.error('Failed to init @google/genai:', err);
    return null;
  }
}

// POST /api/gemini/analyze-monthly
app.post('/api/gemini/analyze-monthly', async (req, res) => {
  const { role, month, year, tasks = [], schoolConfig = {}, inventories = [] } = req.body;
  const roleTitle = 
    role === 'TU' ? 'Tata Usaha (TU)' : 
    role === 'PENJAGA' ? 'Penjaga Sekolah' : 
    role === 'SERVICE' ? 'Layanan Kebersihan (Service)' :
    role === 'PERPUS' ? 'Layanan Perpustakaan' : 'Laboratorium IPA';

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthNames[(month || 9) - 1];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.status === 'selesai').length;
  const inProgressTasks = tasks.filter((t: any) => t.status !== 'selesai').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  // Task titles sample
  const sampleTasks = tasks.slice(0, 15).map((t: any) => `- [${t.date}] ${t.title} (${t.volumeUnit || '1 kegiatan'}) - Status: ${t.status}`).join('\n');

  try {
    const ai = await getGeminiClient();
    if (ai) {
      const roleDomainGuide = 
        role === 'PERPUS' ? 'FOKUS BIDANG PERPUSTAKAAN: Sirkulasi buku teks & non-teks, pengolahan klasifikasi DDC & pelabelan barcode koleksi baru, pendampingan Gerakan Literasi Sekolah (GLS 15 menit), restorasi jilid buku rusak, stock opname fisik. Kendala lapangan mencakup keterlambatan pengembalian buku pinjaman siswa saat asesmen, kapasitas rak display akrilik, preservasi buku tebal, kelembapan ruang.' :
        role === 'TU' ? 'FOKUS BIDANG TATA USAHA: Pengagendaan surat masuk/keluar, buku induk & mutasi kesiswaan, legalisasi ijazah/surat keterangan, pemutakhiran berkas kepegawaian GTK, sinkronisasi Dapodik & SIASN BKN, rekonsiliasi KIB A-E sarpras. Kendala lapangan mencakup lonjakan pemohon legalisir, beban server pusat Dapodik/BKN, pemindaian digital e-Arsip.' :
        role === 'PENJAGA' ? 'FOKUS BIDANG PENJAGA SEKOLAH: Pengamanan 24 jam zero incident, SOP buka-tutup gerbang, pengawasan penyeberangan anak, perbaikan sarpras ringan (mebeler, kran, kunci, lampu), ekspedisi surat dinas. Kendala lapangan mencakup cuaca hujan genangan saluran, fluktuasi lampu sorot, senter patroli.' :
        role === 'SERVICE' ? 'FOKUS BIDANG LAYANAN KEBERSIHAN: Sanitasi & higienitas toilet guru & siswa 2x sehari bebas bau, kebersihan ruang pimpinan/guru/kelas/selasar, pemilahan sampah organik/anorganik ke TPS, taman & saluran drainase. Kendala lapangan mencakup stok karbol menipis di akhir bulan, kerak lumut lantai basah, daun gugur.' :
        'FOKUS BIDANG LABORATORIUM IPA: Fasilitasi praktikum kurikulum sains rombel fisika/biologi, sterilisasi alat gelas, kalibrasi mikroskop & neraca Ohaus, K3 & APAR zero incident, limbah netralisasi. Kendala lapangan mencakup stok reagen indikator asam-basa menipis, saringan wastafel preparasi, keterbatasan lensa mikroskop cadangan.';

      const prompt = `Anda adalah Evaluator Kinerja Operasional Satuan Pendidikan Senior dan Auditor Tata Naskah Dinas Pendidikan (Permendikbud).
Buat analisis cerdas otomatis yang sangat profesional, terukur, dan berbasis data untuk Laporan Bulanan Kinerja Operator Layanan Operasional Sekolah:
Bidang: ${roleTitle}
Pedoman Spesifik: ${roleDomainGuide}
Satuan Pendidikan: ${schoolConfig.namaSekolah || 'Sekolah'}
Periode: Bulan ${monthName} Tahun ${year}
Statistik Tugas Bulan Ini:
- Total Pekerjaan: ${totalTasks} tugas
- Selesai: ${completedTasks} (${completionRate}%)
- Sedang Berjalan: ${inProgressTasks}
Sampel Rincian Pekerjaan Terlaksana:
${sampleTasks || '(Mengacu pada tugas rutin harian standar operasional)'}

Tugas Anda:
Kembalikan respon HANYA dalam format JSON valid (tanpa markdown blok pembungkus seperti \`\`\`json) dengan struktur objek berikut:
{
  "summary": "Ringkasan eksekutif kinerja bulanan yang komprehensif, menguraikan pencapaian target kerja, kepatuhan SPM, ketertiban administrasi dinas, serta kondisi operasional sekolah.",
  "achievements": [
    "Daftar capaian dan prestasi kinerja 1 (sebutkan kuantitas / persentase terukur)",
    "Daftar capaian dan prestasi kinerja 2",
    "Daftar capaian dan prestasi kinerja 3",
    "Daftar capaian dan prestasi kinerja 4"
  ],
  "obstacles": [
    "Kendala / hambatan teknis atau operasional di lapangan 1",
    "Kendala / hambatan di lapangan 2"
  ],
  "solutions": [
    "Solusi konkret dan upaya pemecahan masalah / mitigasi 1",
    "Solusi konkret dan upaya pemecahan masalah / mitigasi 2"
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text?.trim() || '';
      if (text) {
        const parsed = JSON.parse(text);
        return res.json({ success: true, isAi: true, data: parsed });
      }
    }
  } catch (err) {
    console.warn('Gemini monthly analysis fallback triggered:', err);
  }

  // High-fidelity fallback for all 5 roles
  let achievements: string[] = [];
  let obstacles: string[] = [];
  let solutions: string[] = [];
  let summary = '';

  if (role === 'PENJAGA') {
    achievements = [
      `Pelaksanaan patroli keamanan berkala gedung dan area lingkungan sekolah terlaksana ${Math.max(totalTasks, 26)} kali dengan tingkat zero incident (nihil pencurian dan kebakaran)`,
      `Pengawasan ketertiban dan pendampingan penyeberangan jalan bagi peserta didik di gerbang utama pada jam masuk dan pulang (${completedTasks > 0 ? completedTasks : 22} hari efektif)`,
      `Pemeriksaan fisik sarana prasarana serta penanganan perbaikan ringan kunci pintu, instalasi kran air, dan lampu selasar tuntas 100%`,
      `Pelaksanaan ekspedisi pengantaran surat dinas ke Dinas Pendidikan dan mitra instansi terlaksana tepat waktu`
    ];
    obstacles = [
      'Kondisi cuaca hujan dengan intensitas lebat yang memerlukan pengawasan ekstra terhadap saluran air dan talang atap',
      'Kebutuhan peremajaan lampu senter patroli malam dan penambahan gembok cadangan'
    ];
    solutions = [
      'Pembersihan berkala endapan sampah pada saluran drainase bersama petugas kebersihan',
      'Pengajuan inventarisasi pengadaan senter patroli baterai lithium dan gembok master-key ke bagian TU'
    ];
    summary = `Berdasarkan rekapitulasi data harian bulan ${monthName} ${year}, Operator Layanan Operasional Penjaga Sekolah telah menyelesaikan ${completedTasks} dari ${totalTasks > 0 ? totalTasks : 24} agenda kerja dengan tingkat capaian ${completionRate}%. Seluruh area pengawasan dalam status aman dan kondusif, serta kesiapsiagaan operasional sarana gedung terpelihara dengan baik.`;
  } else if (role === 'TU') {
    achievements = [
      `Pengelolaan dan registrasi buku agenda surat kedinasan (${totalTasks > 0 ? totalTasks : 28} berkas surat masuk dan surat keluar) teradministrasi tertib`,
      `Pelayanan administrasi kesiswaan berupa verifikasi mutasi, pencatatan buku induk, dan legalisasi surat keterangan tuntas tanpa komplain`,
      `Pembaruan berkas kenaikan pangkat dan data pokok pendidikan (Dapodik) GTK terlaksana tepat waktu`,
      `Verifikasi fisik dan rekonsiliasi berkala buku inventaris barang (KIR) ruang kantor dan kelas dengan kondisi tercatat valid`
    ];
    obstacles = [
      'Volume dokumen fisik yang menumpuk membutuhkan proses pemindaian digital arsip secara berkelanjutan',
      'Koordinasi konfirmasi surat undangan kedinasan dari instansi eksternal yang mendekati tenggat waktu'
    ];
    solutions = [
      'Menetapkan jadwal pemindaian digital berkas arsip secara terstruktur setiap akhir pekan',
      'Mengoptimalkan saluran komunikasi cepat dinas melalui narahubung persuratan digital'
    ];
    summary = `Sepanjang bulan ${monthName} ${year}, Layanan Operasional Administrasi Tata Usaha telah menuntaskan ${completedTasks} pekerjaan administratif dengan persentase keberhasilan ${completionRate}%. Seluruh agenda tata kelola persuratan dinas, kepegawaian, dan pelayanan publik kesiswaan terselenggara sesuai standar operasional prosedur (SOP) satuan pendidikan.`;
  } else if (role === 'PERPUS') {
    achievements = [
      `Pelayanan sirkulasi peminjaman dan pengembalian bahan pustaka terlaksana tertib (${completedTasks > 0 ? completedTasks : 24} transaksi layanan)`,
      `Pengolahan klasifikasi DDC, pelabelan barcode, dan pencatatan buku induk untuk 100% koleksi baru tuntas`,
      `Pendampingan 15 menit membaca rutin dalam program Gerakan Literasi Sekolah (GLS) berjalan aktif`,
      `Restorasi dan penjilidan ulang buku pelajaran dan referensi yang mengalami kerusakan ringan`
    ];
    obstacles = [
      'Keterlambatan pengembalian buku pinjaman oleh sebagian peserta didik saat mendekati pekan ujian',
      'Kapasitas rak display buku baru perlu ditambah untuk menampung hibah buku'
    ];
    solutions = [
      'Mengirimkan surat pemberitahuan pengembalian berkala melalui wali kelas',
      'Mengajukan usulan penambahan rak buku display akrilik pada perencanaan anggaran sekolah'
    ];
    summary = `Kinerja Layanan Operasional Perpustakaan pada bulan ${monthName} ${year} berhasil menyelesaikan ${completedTasks} dari ${totalTasks > 0 ? totalTasks : 22} kegiatan dengan tingkat keberhasilan ${completionRate}%. Sirkulasi literasi dan pelestarian koleksi bahan pustaka terpelihara secara akuntabel.`;
  } else if (role === 'LAB_IPA') {
    achievements = [
      `Penyiapan set alat peraga dan bahan reagen praktikum fisika & biologi seluruh rombel tepat waktu (${completedTasks > 0 ? completedTasks : 20} sesi praktikum)`,
      `Sterilisasi, pencucian alat gelas kimia, dan pemeliharaan mikroskop serta neraca Ohaus bebas residu kontaminan`,
      `Pengecekan kesiapsiagaan K3 laboratorium (indikator APAR, kotak P3K, dan netralisasi limbah) tercatat Zero Incident`,
      `Pencatatan kartu stok inventaris bahan kimia dan logbook penggunaan ruang lab terarsip rapi`
    ];
    obstacles = [
      'Ketersediaan stok larutan reagen indikator asam-basa menipis pada akhir periode praktikum',
      'Sumbatan kotoran halus pada salah satu kran wastafel ruang preparasi lab'
    ];
    solutions = [
      'Membuat usulan amprah bahan kimia habis pakai lebih awal ke bagian TU',
      'Pembersihan saringan kran dan pemeliharaan pipa bersama tim sarpras sekolah'
    ];
    summary = `Kinerja Layanan Operasional Laboratorium IPA pada bulan ${monthName} ${year} mencatat ${completedTasks} dari ${totalTasks > 0 ? totalTasks : 20} pekerjaan tuntas (${completionRate}%). Seluruh praktikum siswa berlangsung aman, tertib, dan sesuai SOP keselamatan kerja laboratorium.`;
  } else {
    achievements = [
      `Sanitasi dan sterilisasi harian seluruh bilik toilet (WC) guru dan peserta didik terjaga higienis, bersih, dan bebas bau (${completedTasks > 0 ? completedTasks : 24} hari kerja)`,
      `Pembersihan menyeluruh ruang pimpinan, ruang dewan guru, tata usaha, perpustakaan, dan lobi sekolah dilaksanakan konsisten 2 kali sehari`,
      `Pengangkutan dan pemilahan sampah organik serta anorganik ke TPS terlaksana dengan indeks kebersihan rata-rata 96/100`,
      `Perawatan dan penyiraman berkala tanaman taman depan serta area selasar sekolah berlangsung optimal`
    ];
    obstacles = [
      'Ketersediaan bahan habis pakai pembersih lantai, sabun cair, dan kantong sampah sempat menipis di minggu ke-3',
      'Endapan lumut pada lantai selasar luar akibat curah hujan tinggi yang licin'
    ];
    solutions = [
      'Pemberian jadwal pengajuan amprah bahan pembersih secara teratur 7 hari sebelum stok menipis',
      'Pembersihan intensif permukaan lantai luar menggunakan sikat kawat dan cairan pembersih kerak anti-licin'
    ];
    summary = `Kinerja Layanan Operasional Kebersihan (Service) pada bulan ${monthName} ${year} berhasil menyelesaikan ${completedTasks} dari ${totalTasks > 0 ? totalTasks : 25} kegiatan sanitasi dengan capaian keberhasilan ${completionRate}%. Lingkungan satuan pendidikan senantiasa terpelihara bersih, sehat, dan nyaman untuk menunjang kegiatan belajar mengajar.`;
  }

  res.json({
    success: true,
    isAi: false,
    data: { summary, achievements, obstacles, solutions }
  });
});

// POST /api/gemini/analyze-annual
app.post('/api/gemini/analyze-annual', async (req, res) => {
  const { role, year, monthsSummary = [], tasks = [], schoolConfig = {}, inventories = [] } = req.body;
  const roleTitle = 
    role === 'TU' ? 'Tata Usaha (TU)' : 
    role === 'PENJAGA' ? 'Penjaga Sekolah' : 
    role === 'SERVICE' ? 'Layanan Kebersihan (Service)' :
    role === 'PERPUS' ? 'Layanan Perpustakaan' : 'Laboratorium IPA';

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.status === 'selesai').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 98;

  try {
    const ai = await getGeminiClient();
    if (ai) {
      const roleDomainGuide = 
        role === 'PERPUS' ? 'FOKUS BIDANG PERPUSTAKAAN: Akumulasi sirkulasi pemustaka, katalogisasi DDC, Gerakan Literasi Sekolah (GLS), preservasi koleksi, dan stock opname fisik. Kendala lapangan meliputi keterlambatan pengembalian buku, kapasitas rak display akrilik, dan pelapukan jilid buku.' :
        role === 'TU' ? 'FOKUS BIDANG TATA USAHA: Akumulasi penatausahaan persuratan dinas masuk/keluar, berkas kepegawaian GTK, sinkronisasi Dapodik & SIASN BKN, legalisasi kesiswaan, dan KIB A-E sarpras. Kendala lapangan meliputi lonjakan pemohon legalisir, beban server pusat Dapodik/BKN, dan digitalisasi warkat arsip fisik.' :
        role === 'PENJAGA' ? 'FOKUS BIDANG PENJAGA SEKOLAH: Pengamanan 24 jam status zero incident, keteraturan SOP buka-tutup gerbang, pengawasan penyeberangan anak, perbaikan sarpras ringan swakelola, ekspedisi dinas. Kendala lapangan meliputi cuaca hujan genangan saluran, fluktuasi lampu sorot, senter patroli.' :
        role === 'SERVICE' ? 'FOKUS BIDANG LAYANAN KEBERSIHAN: Sanitasi & higienitas toilet siswa/guru 2x sehari bebas bau, kebersihan ruang kelas & perkantoran, pemilahan sampah organik/anorganik ke TPS, taman & saluran drainase. Kendala lapangan meliputi persediaan bahan pembersih kimia menipis, kerak lumut, timbulan sampah dedaunan.' :
        'FOKUS BIDANG LABORATORIUM IPA: Fasilitasi praktikum sains kurikulum merdeka rombel fisika/biologi, sterilisasi alat gelas, kalibrasi mikroskop & neraca Ohaus, K3 & APAR zero accident, netralisasi limbah. Kendala lapangan meliputi stok reagen kimia menipis, saringan wastafel preparasi, keterbatasan lensa mikroskop cadangan.';

      const prompt = `Anda adalah Tim Penilai Kinerja Satuan Pendidikan dan Konsultan Tata Kelola Naskah Dinas Pendidikan Nasional (Permendikbud).
Susun analisis cerdas otomatis evaluasi tahunan komprehensif untuk Laporan Tahunan Kinerja Operator Layanan Operasional:
Bidang: ${roleTitle}
Pedoman Spesifik: ${roleDomainGuide}
Satuan Pendidikan: ${schoolConfig.namaSekolah || 'Sekolah'}
Tahun Anggaran: ${year}
Ringkasan Data 12 Bulan: Total tugas ${totalTasks > 0 ? totalTasks : '280+'}, tingkat pemenuhan kinerja rata-rata ${completionRate}%.

Tugas Anda:
Kembalikan respon HANYA dalam format JSON valid (tanpa markdown blok pembungkus seperti \`\`\`json) dengan struktur objek:
{
  "summary": "Ringkasan eksekutif kinerja tahunan yang mendalam, mencakup evaluasi realisasi program kerja tahun berjalan, akuntabilitas layanan, ketersediaan sarpras, dan kepatuhan standar pelayanan minimal (SPM).",
  "annualMilestones": [
    "Capaian utama dan indikator keberhasilan tahunan 1 (dengan data terukur/prestasi)",
    "Capaian utama dan indikator keberhasilan tahunan 2",
    "Capaian utama dan indikator keberhasilan tahunan 3",
    "Capaian utama dan indikator keberhasilan tahunan 4"
  ],
  "obstacles": [
    "Evaluasi kendala atau hambatan lapangan terakumulasi sepanjang tahun 1",
    "Evaluasi kendala atau hambatan lapangan 2"
  ],
  "solutions": [
    "Solusi konkret dan mitigasi yang telah dilakukan 1",
    "Solusi konkret dan mitigasi yang telah dilakukan 2"
  ],
  "strategicRecommendations": [
    "Rekomendasi rencana strategis dan kebutuhan operasional tahun depan 1",
    "Rekomendasi rencana strategis dan kebutuhan operasional tahun depan 2",
    "Rekomendasi rencana strategis dan kebutuhan operasional tahun depan 3"
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text?.trim() || '';
      if (text) {
        const parsed = JSON.parse(text);
        return res.json({ success: true, isAi: true, data: parsed });
      }
    }
  } catch (err) {
    console.warn('Gemini annual analysis fallback triggered:', err);
  }

  // High-fidelity fallback for all 5 roles
  let annualMilestones: string[] = [];
  let strategicRecommendations: string[] = [];
  let summary = '';

  if (role === 'PENJAGA') {
    summary = `Laporan Tahunan Kinerja Layanan Operasional Penjaga Sekolah Tahun Anggaran ${year} merupakan konsolidasi menyeluruh pengamanan dan pemeliharaan sarana gedung sepanjang 12 bulan. Tingkat pencapaian target operasional keamanan mencapai ${completionRate}% dengan kondisi zero incident tanpa gangguan kamtibmas, kebakaran, maupun kehilangan aset dinas sekolah.`;
    annualMilestones = [
      `Mempertahankan standar keamanan lingkungan sekolah 24 jam dengan predikat Zero Accident dan Zero Theft selama 365 hari kalender`,
      `Pemeriksaan fisik harian dan pengamanan kunci 24 ruang kelas, laboratorium komputer/IPA, ruang perpustakaan, dan gedung kantor`,
      `Penanganan 100% perbaikan sarana prasarana darurat skala ringan (instalasi air bersih, saklar kelistrikan, dan pengelasan engsel pintu)`,
      `Pelayanan prima keselamatan penyeberangan jalan bagi seluruh peserta didik di jam sibuk masuk dan pulang sekolah`
    ];
    strategicRecommendations = [
      `Penambahan 4 unit kamera pengawas CCTV beresolusi tinggi dengan teknologi infra-merah di titik sudut buta (blind spot) belakang lapangan`,
      `Pengadaan perangkat perlengkapan kerja modern berstandar K3 (sepatu safety, jas hujan dinas berkualitas tinggi, dan senter sorot LED)`,
      `Penyusunan anggaran pemeliharaan preventif gembok master-key dan engsel pintu gerbang pada RKAS tahun berikutnya`
    ];
  } else if (role === 'TU') {
    summary = `Laporan Tahunan Kinerja Layanan Operasional Administrasi Tata Usaha Tahun Anggaran ${year} merefleksikan pencapaian standar pelayanan prima ketatausahaan dengan capaian kinerja rata-rata ${completionRate}%. Seluruh siklus tata kelola persuratan dinas, kearsipan fisik dan digital, kepegawaian GTK, serta pelayanan administrasi kesiswaan terselenggara secara akuntabel dan transparan.`;
    annualMilestones = [
      `Realisasi registrasi dan penatausahaan 100% agenda surat masuk dan surat keluar kedinasan tanpa keterlambatan disposisi`,
      `Pemutakhiran berkas kepegawaian ASN/PPPK/Honorer dan sinkronisasi berkala data Dapodik semester genap dan ganjil dengan validitas 100%`,
      `Penyusunan dan rekonsiliasi akhir tahun Buku Inventaris Sarana Prasarana (KIR) seluruh ruangan sekolah untuk laporan audit Disdik`,
      `Pelayanan administrasi kesiswaan (buku induk, surat mutasi, surat keterangan kelulusan, dan legalisir) untuk 450+ peserta didik`
    ];
    strategicRecommendations = [
      `Pengadaan mesin pemindai dokumen berkecepatan tinggi (ADF Scanner) untuk percepatan digitalisasi 100% arsip warkat fisik lama`,
      `Pelatihan peningkatan kompetensi operator dalam implementasi sistem kearsipan dinamis dan persuratan elektronik (e-Office Satdik)`,
      `Alokasi anggaran ATK dan pengadaan lemari arsip tahan api (fireproof cabinet) untuk pengamanan dokumen ijazah dan buku induk`
    ];
  } else if (role === 'PERPUS') {
    summary = `Laporan Tahunan Kinerja Layanan Operasional Perpustakaan Sekolah Tahun Anggaran ${year} merangkum capaian optimalisasi gerakan literasi, penambahan koleksi buku, dan tertib sirkulasi pemustaka dengan capaian ${completionRate}%. Perpustakaan menjadi pusat sumber belajar yang representatif dan mendukung kurikulum merdeka.`;
    annualMilestones = [
      `Tercapainya 100% katalogisasi digital dan barcode scanner untuk seluruh bahan pustaka (4.200+ eksemplar)`,
      `Peningkatan frekuensi kunjungan pemustaka dan sirkulasi peminjaman buku sebesar 28% dibandingkan tahun sebelumnya`,
      `Penyelenggaraan festival literasi sekolah dan pojok baca kreatif di seluruh rombongan belajar`,
      `Pelaksanaan stock opname tahunan dengan persentase keutuhan dan keberadaan koleksi mencapai 98.4%`
    ];
    strategicRecommendations = [
      `Pengembangan sistem otomasi perpustakaan berbasis e-Library / OPAC untuk pencarian katalog mandiri oleh siswa`,
      `Pengadaan perangkat pendingin udara (AC) dan karpet baca lesehan guna meningkatkan kenyamanan ruang baca pemustaka`,
      `Pengajuan alokasi anggaran belanja buku pengayaan dan buku referensi tematik terkini pada BOS reguler`
    ];
  } else if (role === 'LAB_IPA') {
    summary = `Laporan Tahunan Kinerja Layanan Operasional Laboratorium IPA Tahun Anggaran ${year} membuktikan komitmen tinggi dalam menjaga keselamatan, keteraturan, dan kelayakan sarana praktikum sains siswa dengan capaian ${completionRate}%. Standar Zero Incident K3 sukses dipertahankan sepanjang tahun.`;
    annualMilestones = [
      `Dukungan penuh penyiapan alat dan bahan praktikum untuk 140+ sesi kegiatan praktikum fisika, kimia, dan biologi`,
      `Pencapaian rekor Zero Accident K3 Laboratorium sepanjang tahun dengan kepatuhan pemakaian APD 100%`,
      `Kalibrasi berkala dan pemeliharaan preventif 18 unit mikroskop siswa dan 8 neraca presisi tanpa kerusakan fatal`,
      `Penyusunan berita acara inventarisasi bahan kimia kedaluwarsa dan netralisasi limbah ramah lingkungan`
    ];
    strategicRecommendations = [
      `Pengadaan lemari asam (fume hood) dan perbaikan sistem ventilasi udara pembuangan bahan kimia gas`,
      `Penggantian tabung APAR dry-chemical powder dan pembaruan kelengkapan kotak emergency P3K laboratorium`,
      `Pengadaan kit praktikum elektronika & optik modern untuk menunjang materi praktikum kurikulum sains terkini`
    ];
  } else {
    summary = `Laporan Tahunan Kinerja Layanan Operasional Kebersihan (Service) Tahun Anggaran ${year} mencerminkan dedikasi konsisten dalam mewujudkan lingkungan belajar yang sehat, higienis, dan berwawasan lingkungan hidup (Adiwiyata). Tingkat realisasi sanitasi mencapai ${completionRate}% dengan kebersihan fasilitas sekolah yang senantiasa terjaga optimal.`;
    annualMilestones = [
      `Pemeliharaan higienitas dan sanitasi harian 12 unit bilik toilet siswa dan toilet guru dengan standar bebas bau dan bebas jentik nyamuk`,
      `Pembersihan rutin dua kali sehari untuk 18 ruang kelas, ruang pimpinan, ruang guru, ruang laboratorium, dan selasar lobi utama`,
      `Pengelolaan pemilahan sampah organik dan anorganik dengan tingkat pengangkutan 100% ke TPS tanpa penumpukan limbah`,
      `Dukungan operasional penuh dalam pencapaian penghargaan sekolah Adiwiyata berwawasan sanitasi sehat tingkat kota/kabupaten`
    ];
    strategicRecommendations = [
      `Pengadaan 1 unit mesin polisher lantai otomatis untuk efisiensi dan peningkatan kilap lantai keramik lobi dan selasar utama`,
      `Pengadaan set tempat sampah pilah 3 warna (organik, anorganik, B3) baru untuk ditempatkan di setiap depan ruang kelas`,
      `Penyusunan jadwal kontrak pasokan bahan pembersih kimia ramah lingkungan secara berkala dengan pihak rekanan melalui RKAS`
    ];
  }

  res.json({
    success: true,
    isAi: false,
    data: { summary, annualMilestones, strategicRecommendations }
  });
});

// POST /api/gemini/draft-task (Perumusan Tugas Harian Otomatis AI)
app.post('/api/gemini/draft-task', async (req, res) => {
  const { role, roughPrompt = '', date = '', category = '' } = req.body;
  const roleTitle = 
    role === 'TU' ? 'Tata Usaha (Administrasi Sekolah)' : 
    role === 'PENJAGA' ? 'Penjaga Sekolah (Keamanan & Sapras)' : 
    role === 'SERVICE' ? 'Layanan Kebersihan (Sanitasi & Lingkungan)' :
    role === 'PERPUS' ? 'Layanan Perpustakaan (Literasi & Bahan Pustaka)' : 'Laboratorium IPA (Praktikum & K3 Lab)';

  try {
    const ai = await getGeminiClient();
    if (ai) {
      const prompt = `Anda adalah Asisten Cerdas Tata Kelola Naskah Dinas Pendidikan. 
Pengguna adalah Operator Layanan Operasional Sekolah (${roleTitle}).
Pengguna mengetikkan ide/kata kunci tugas kasar: "${roughPrompt || 'pelaksanaan tugas rutin hari ini'}".
Kategori yang dipilih pengguna (jika ada): "${category || 'otomatis tentukan'}".
Tanggal pelaksanaan: "${date || 'hari ini'}".

Tugas Anda:
Rumuskan uraian pekerjaan dinas tersebut menjadi format resmi, baku, formal, dan terukur yang sesuai standar evaluasi kinerja pemerintah.
Kembalikan HANYA format JSON valid tanpa blok markdown:
{
  "title": "Judul tugas kedinasan yang baku, ringkas, dan jelas (contoh: Pelaksanaan Pemeliharaan Sanitasi dan Pengecekan Kran Air Toilet Siswa)",
  "description": "Deskripsi terperinci langkah-langkah pelaksanaan pekerjaan, metode yang digunakan, serta hasil yang dicapai secara akuntabel (2-3 kalimat)",
  "location": "Lokasi spesifik di lingkungan sekolah (contoh: Ruang Toilet Siswa Blok Barat)",
  "volumeUnit": "Kuantitas dan satuan hasil kerja yang terukur (contoh: 6 bilik toilet, 12 berkas arsip, 45 eksemplar buku, 1 paket alat)",
  "timeStart": "07:30",
  "timeEnd": "09:00",
  "status": "selesai",
  "taskType": "pokok" atau "tambahan" (pokok jika tupoksi utama, tambahan jika insidental/penugasan khusus),
  "categoryRecommendation": "slug kategori yang paling cocok"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text?.trim() || '';
      if (text) {
        const parsed = JSON.parse(text);
        return res.json({ success: true, isAi: true, data: parsed });
      }
    }
  } catch (err) {
    console.warn('Gemini draft-task fallback:', err);
  }

  // Fallback intelligent formulation
  const defaultCategory = 
    role === 'TU' ? 'kepegawaian' : 
    role === 'PENJAGA' ? 'keamanan' : 
    role === 'SERVICE' ? 'kebersihan_wc' :
    role === 'PERPUS' ? 'sirkulasi_peminjaman' : 'persiapan_praktikum';

  const titleFallback = roughPrompt 
    ? `Pelaksanaan ${roughPrompt.trim().charAt(0).toUpperCase() + roughPrompt.trim().slice(1)}`
    : `Pelaksanaan Tugas Rutin Kedinasan ${roleTitle}`;

  res.json({
    success: true,
    isAi: false,
    data: {
      title: titleFallback,
      description: `Melaksanakan kegiatan ${roughPrompt || 'operasional sekolah'} sesuai SOP kedinasan satuan pendidikan dengan hasil terlaksana tertib, aman, dan akuntabel.`,
      location: role === 'TU' ? 'Ruang Tata Usaha' : role === 'PENJAGA' ? 'Pintu Gerbang & Lingkungan Sekolah' : role === 'SERVICE' ? 'Area Gedung & Toilet Sekolah' : role === 'PERPUS' ? 'Ruang Perpustakaan' : 'Laboratorium IPA',
      volumeUnit: '1 kegiatan dinas',
      timeStart: '07:30',
      timeEnd: '09:00',
      status: 'selesai',
      taskType: 'pokok',
      categoryRecommendation: category || defaultCategory
    }
  });
});

// POST /api/gemini/suggest-categories (Rekomendasi Kategori Layanan Cerdas AI)
app.post('/api/gemini/suggest-categories', async (req, res) => {
  const { role, existingCategories = [] } = req.body;
  const roleTitle = 
    role === 'TU' ? 'Tata Usaha (Administrasi Sekolah)' : 
    role === 'PENJAGA' ? 'Penjaga Sekolah (Keamanan & Sapras)' : 
    role === 'SERVICE' ? 'Layanan Kebersihan (Service)' :
    role === 'PERPUS' ? 'Layanan Perpustakaan' : 'Laboratorium IPA';

  try {
    const ai = await getGeminiClient();
    if (ai) {
      const prompt = `Anda adalah Konsultan Manajemen Tata Kelola Satuan Pendidikan Kementerian Pendidikan.
Berdasarkan peran operasional: ${roleTitle}, berikan 4 rekomendasi jenis kategori layanan baru yang inovatif, praktis, dan sesuai kebutuhan riil sekolah masa kini.
Kategori yang sudah ada: ${existingCategories.map((c: any) => c.name || c).join(', ') || 'standar'}.

Kembalikan HANYA format JSON valid tanpa blok markdown:
[
  {
    "name": "Nama Kategori Layanan (ringkas & formal, contoh: Pemeliharaan AC & Genset Sekolah)",
    "classification": "pokok" atau "tambahan",
    "description": "Uraian ruang lingkup layanan yang jelas dan aplikatif",
    "reason": "Alasan mengapa kategori ini penting untuk sekolah"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text?.trim() || '';
      if (text) {
        const parsed = JSON.parse(text);
        return res.json({ success: true, isAi: true, data: parsed });
      }
    }
  } catch (err) {
    console.warn('Gemini suggest-categories fallback:', err);
  }

  // Pre-configured rich suggestions per role
  const suggestionsMap: Record<string, any[]> = {
    TU: [
      { name: 'Pengarsipan Dokumen Digital (e-Arsip)', classification: 'pokok', description: 'Digitalisasi warkat dinas, scan ijazah, dan pencadangan dokumen awet di cloud drive.', reason: 'Mempercepat pencarian arsip dan mengamankan fisik dokumen sekolah.' },
      { name: 'Layanan Mutasi & Legalisir Cepat', classification: 'pokok', description: 'Pelayanan verifikasi berkas pindah sekolah siswa dan legalisasi rapor/ijazah 1-hari.', reason: 'Meningkatkan kepuasan wali murid dan akuntabilitas layanan publik.' },
      { name: 'Pengelolaan Publikasi & Humas Sekolah', classification: 'tambahan', description: 'Penyusunan brosur PPDB, pembaruan mading informasi, dan dokumentasi rapat kedinasan.', reason: 'Memperkuat citra positif dan transparansi komunikasi sekolah.' },
      { name: 'Rekonsiliasi Pajak & Belanja BOS', classification: 'pokok', description: 'Pengecekan e-Bupot pajak, faktur belanja ARKAS, dan pemberkasan kuitansi sah.', reason: 'Kepatuhan mutlak regulasi keuangan negara dan bebas temuan audit.' }
    ],
    PENJAGA: [
      { name: 'Pemeliharaan Kelistrikan & Genset Darurat', classification: 'pokok', description: 'Pemeriksaan rutin MCB, pemanasan genset cadangan, dan instalasi stop kontak kelas.', reason: 'Mencegah bahaya korsleting dan menjaga suplai listrik ruang ujian.' },
      { name: 'Pengawasan CCTV & Alarm Keamanan', classification: 'pokok', description: 'Pengecekan fungsi rekaman DVR/NVR kamera pengawas sudut gerbang dan pagar.', reason: 'Meningkatkan daya pantau area rawan dan bukti rekaman jika terjadi insiden.' },
      { name: 'Penataan Parkir & Zona Aman Sekolah (ZOSS)', classification: 'tambahan', description: 'Ketertiban kendaraan roda 2/4 guru & tamu serta penjagaan marka penyeberangan jalan.', reason: 'Menjamin keselamatan peserta didik saat jam sibuk tiba dan pulang.' },
      { name: 'Tanggap Cuaca Ekstrem & Banjir', classification: 'tambahan', description: 'Pembersihan talang seng, inspeksi dahan pohon rindang, dan penyedotan genangan.', reason: 'Mitigasi preventif bencana musiman di lingkungan gedung.' }
    ],
    SERVICE: [
      { name: 'Sanitasi & Sterilisasi Ruang UKS / Isolasi', classification: 'pokok', description: 'Disinfeksi berkala tempat tidur UKS, sterilisasi lantai, dan penggantian sprei.', reason: 'Mencegah penularan penyakit menular di antara warga sekolah.' },
      { name: 'Pemeliharaan Filter Air & Tandon Bersih', classification: 'pokok', description: 'Pengurasan berkala toren air, pembersihan radar otomatis pompa, dan kontrol kran.', reason: 'Menjamin ketersediaan air bersih higienis untuk wudhu dan toilet.' },
      { name: 'Pengomposan Sampah Organik (Green School)', classification: 'tambahan', description: 'Pencacahan dedaunan gugur, pengisian bak komposter, dan pemupukan taman.', reason: 'Mendukung program sekolah Adiwiyata dan pengurangan volume sampah ke TPA.' },
      { name: 'Kristalisasi & Polishing Lantai Keramik Lobi', classification: 'tambahan', description: 'Penyikatan kerak membandel dan pemolesan kilap keramik koridor ruang utama.', reason: 'Memberikan kesan bersih dan estetika prima bagi tamu dinas.' }
    ],
    PERPUS: [
      { name: 'Layanan Peminjaman Multimedia & Chromebook', classification: 'pokok', description: 'Sirkulasi perangkat digital siswa, pemeriksaan baterai, dan logbook pemakaian.', reason: 'Mendukung pembelajaran berbasis TIK dan asesmen nasional (ANBK).' },
      { name: 'Pengelolaan Pojok Baca Kreatif & Mading', classification: 'tambahan', description: 'Penyegaran koleksi buku di kelas, mading resensi karya siswa, dan pojok santai.', reason: 'Mendekatkan buku ke siswa dan meningkatkan minat baca harian.' },
      { name: 'Katalogisasi E-Book & Repositori Sekolah', classification: 'pokok', description: 'Pengarsipan karya ilmiah guru, modul ajar digital, dan e-book kurikulum merdeka.', reason: 'Transformasi perpustakaan digital tanpa batas ruang.' },
      { name: 'Restorasi & Konservasi Koleksi Bersejarah', classification: 'tambahan', description: 'Perawatan laminasi peta dinding kuno, perbaikan jilid kamus tebal, dan kapur barus.', reason: 'Memperpanjang usia pakai buku-buku referensi bernilai tinggi.' }
    ],
    LAB_IPA: [
      { name: 'Pemeriksaan Kesiapsiagaan APAR & Kotak P3K', classification: 'pokok', description: 'Pengecekan jarum tekanan tabung APAR, tanggal kedaluwarsa obat, dan selimut api.', reason: 'Syarat wajib keselamatan kerja dan kepatuhan akreditasi laboratorium.' },
      { name: 'Pengelolaan Limbah Kimia B3 Ramah Lingkungan', classification: 'pokok', description: 'Pemisahan botol limbah asam/basa pekat, netralisasi pH, dan pelabelan limbah B3.', reason: 'Mencegah korosi pipa dan pencemaran tanah sekitar sekolah.' },
      { name: 'Kalibrasi Mikroskop & Neraca Analitik', classification: 'tambahan', description: 'Pembersihan lensa optik dengan xylol, pelumasan mikrometer, dan penyesuaian tera.', reason: 'Menjamin akurasi hasil pengamatan praktikum sains siswa.' },
      { name: 'Inventarisasi Spesimen Biologi & Awetan Basah', classification: 'tambahan', description: 'Pengecekan volume cairan formalin, kerapatan toples awetan, dan preparat awetan.', reason: 'Memelihara sarana visual praktikum biologi jangka panjang.' }
    ]
  };

  res.json({
    success: true,
    isAi: false,
    data: suggestionsMap[role] || suggestionsMap.TU
  });
});

// POST /api/gemini/analyze-inventory (Analisis Kelayakan Sarpras Cerdas AI)
app.post('/api/gemini/analyze-inventory', async (req, res) => {
  const { role, inventories = [], schoolConfig = {} } = req.body;
  const roleTitle = 
    role === 'TU' ? 'Tata Usaha' : 
    role === 'PENJAGA' ? 'Penjaga Sekolah' : 
    role === 'SERVICE' ? 'Layanan Kebersihan' :
    role === 'PERPUS' ? 'Perpustakaan' : 'Laboratorium IPA';

  const total = inventories.length;
  const baik = inventories.filter((i: any) => i.kondisi === 'Baik').length;
  const rusakRingan = inventories.filter((i: any) => i.kondisi === 'Rusak Ringan').length;
  const rusakBerat = inventories.filter((i: any) => i.kondisi === 'Rusak Berat').length;
  const healthRate = total > 0 ? Math.round((baik / total) * 100) : 100;

  try {
    const ai = await getGeminiClient();
    if (ai) {
      const prompt = `Anda adalah Ahli Audit Sarana Prasarana (Sapras) dan Manajemen Aset Sekolah Dinas Pendidikan.
Analisis data inventaris berikut untuk bidang: ${roleTitle} (${schoolConfig.namaSekolah || 'Sekolah'}):
Total Aset: ${total} unit barang
- Kondisi Baik: ${baik} unit
- Kondisi Rusak Ringan: ${rusakRingan} unit
- Kondisi Rusak Berat: ${rusakBerat} unit
- Persentase Kelayakan: ${healthRate}%
Daftar Barang:
${inventories.slice(0, 15).map((i: any) => `- [${i.kodeBarang || '-'}] ${i.namaBarang} (${i.jumlah} ${i.satuan || 'unit'}) - Kondisi: ${i.kondisi} - Lokasi: ${i.lokasiPenyimpanan}`).join('\n')}

Kembalikan HANYA format JSON valid tanpa blok markdown:
{
  "conditionSummary": "Ringkasan analisis kelayakan aset sarana prasarana yang profesional dan berbasis data (2-3 kalimat)",
  "readinessScore": ${healthRate},
  "priorityAction": "Tindakan mendesak prioritas utama (misal: Penghapusan aset rusak berat melalui BAST atau perbaikan ringan)",
  "recommendations": [
    "Rekomendasi teknis 1 (pemeliharaan preventif)",
    "Rekomendasi teknis 2 (penganggaran RKAS)",
    "Rekomendasi teknis 3 (penataan ruang/K3)"
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text?.trim() || '';
      if (text) {
        const parsed = JSON.parse(text);
        return res.json({ success: true, isAi: true, data: parsed });
      }
    }
  } catch (err) {
    console.warn('Gemini analyze-inventory fallback:', err);
  }

  // Fallback synthesis
  res.json({
    success: true,
    isAi: false,
    data: {
      conditionSummary: `Dari total ${total} item sarana prasarana ${roleTitle}, ${baik} unit dalam kondisi laik pakai (${healthRate}%), ${rusakRingan} unit memerlukan pemeliharaan berkala, dan ${rusakBerat} unit diusulkan untuk penghapusan aset dinas.`,
      readinessScore: healthRate,
      priorityAction: rusakBerat > 0 ? 'Penyusunan Berita Acara Rekomendasi Penghapusan Aset (BAST)' : 'Pelaksanaan Pemeliharaan Berkala Preventif',
      recommendations: [
        'Melakukan servis berkala pada barang dengan kategori Rusak Ringan sebelum kerusakan meluas',
        'Memperbarui penomoran label barcode/KIR pada setiap sarana yang baru diadakan',
        'Mengalokasikan anggaran suku cadang pengganti pada pengajuan RKAS semester berikutnya'
      ]
    }
  });
});

// POST /api/gemini/audit-document (Asisten Kesiapan Audit Dokumen Arsip)
app.post('/api/gemini/audit-document', async (req, res) => {
  const { documentTitle = '', role = 'TU', checklist = {}, period = '', approvalStatus = 'disahkan_kepsek' } = req.body;

  try {
    const ai = await getGeminiClient();
    if (ai) {
      const prompt = `Anda adalah Auditor Naskah Dinas dan Kepatuhan Akreditasi Sekolah Dinas Pendidikan.
Lakukan penilaian kesiapan audit (Audit Readiness Assessment) terhadap dokumen berikut:
Judul Dokumen: "${documentTitle}"
Bidang: ${role}
Periode: ${period}
Status Pengesahan: ${approvalStatus}
Kelengkapan Berkas Fisik/Digital:
- Memiliki Kop Surat Resmi: ${checklist.hasKop ? 'Ya' : 'Belum'}
- Memiliki Lembar Pengesahan: ${checklist.hasApprovalSheet ? 'Ya' : 'Belum'}
- Tanda Tangan Lengkap: ${checklist.hasSignatures ? 'Ya' : 'Belum'}
- Cap Stempel Sekolah: ${checklist.hasStamp ? 'Ya' : 'Belum'}
- Foto Dokumentasi Bukti: ${checklist.hasPhotos ? `Ada (${checklist.photoCount || 1} foto)` : 'Tidak Ada'}

Kembalikan HANYA format JSON valid tanpa blok markdown:
{
  "auditRating": "Sangat Baik (A)" atau "Baik (B)" atau "Perlu Perbaikan (C)",
  "complianceSummary": "Ringkasan penilaian kepatuhan naskah dinas terhadap standar audit (2 kalimat)",
  "complianceNotes": [
    "Catatan evaluasi positif 1",
    "Catatan evaluasi 2"
  ],
  "riskAssessment": "Tingkat risiko temuan audit (Rendah / Sedang / Tinggi)",
  "actionItems": [
    "Langkah penyempurnaan dokumen 1",
    "Langkah penyempurnaan dokumen 2"
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text?.trim() || '';
      if (text) {
        const parsed = JSON.parse(text);
        return res.json({ success: true, isAi: true, data: parsed });
      }
    }
  } catch (err) {
    console.warn('Gemini audit-document fallback:', err);
  }

  // Fallback audit
  const score = (checklist.hasKop ? 20 : 0) + (checklist.hasApprovalSheet ? 25 : 0) + (checklist.hasSignatures ? 25 : 0) + (checklist.hasStamp ? 15 : 0) + (checklist.hasPhotos ? 15 : 0);
  const rating = score >= 80 ? 'Sangat Baik (A)' : score >= 60 ? 'Baik (B)' : 'Perlu Perbaikan (C)';
  const risk = score >= 80 ? 'Rendah (Aman Pemeriksaan)' : score >= 60 ? 'Sedang (Perlu Dilengkapi)' : 'Tinggi (Rentan Temuan Audit)';

  res.json({
    success: true,
    isAi: false,
    data: {
      auditRating: rating,
      complianceSummary: `Dokumen "${documentTitle}" memiliki indeks kelengkapan tata naskah dinas sebesar ${score}%. Dokumen telah memenuhi struktur pokok kedinasan sekolah.`,
      complianceNotes: [
        checklist.hasApprovalSheet && checklist.hasSignatures ? 'Lembar pengesahan dan tanda tangan pejabat pengesah valid' : 'Perlu memastikan tanda tangan pejabat telah dibubuhkan',
        checklist.hasPhotos ? 'Terdapat dokumentasi visual otentik sebagai bukti riil kegiatan lapangan' : 'Disarankan melampirkan foto dokumentasi kegiatan'
      ],
      riskAssessment: risk,
      actionItems: [
        'Pastikan cap stempel dinas basah atau sertifikat elektronik terverifikasi jelas',
        'Simpan salinan fisik bertandatangan di lemari arsip dinas sekolah'
      ]
    }
  });
});

// POST /api/gemini/assistant (Asisten Cerdas Operasional AI Lintas Bidang)
app.post('/api/gemini/assistant', async (req, res) => {
  const { 
    message = '', 
    mode = 'chat', 
    role = 'TU', 
    schoolConfig = {}, 
    additionalData = {} 
  } = req.body;

  const roleTitle = 
    role === 'TU' ? 'Tata Usaha (Administrasi Sekolah & Kearsipan)' : 
    role === 'PENJAGA' ? 'Penjaga Sekolah (Keamanan & Sarpras)' : 
    role === 'SERVICE' ? 'Layanan Kebersihan (Sanitasi & Lingkungan)' :
    role === 'PERPUS' ? 'Layanan Perpustakaan (Literasi & Sirkulasi)' : 'Laboratorium IPA (Praktikum Sains & K3)';

  try {
    const ai = await getGeminiClient();
    if (ai) {
      let systemPrompt = `Anda adalah "Asisten AI SI-OPS", asisten kecerdasan buatan resmi untuk Sistem Informasi Pelayanan Operasional Satuan Pendidikan (Permendikbud).
Anda bertugas membantu Operator Layanan Operasional Sekolah: ${roleTitle}.
Satuan Pendidikan: ${schoolConfig.namaSekolah || 'Satuan Pendidikan'}.
Kepala Sekolah: ${schoolConfig.kepalaSekolah?.nama || 'Kepala Satuan Pendidikan'}.
Operator Bertugas: ${schoolConfig.operatorProfiles?.[role]?.nama || 'Petugas Layanan Operasional'}.

Prinsip Anda:
1. Bahasa Indonesia resmi, baku, formal kedinasan (EYD V & Tata Naskah Dinas Kemendikbud).
2. Praktis, terukur, solutif, dan langsung dapat dicetak atau digunakan di lapangan sekolah.
3. Selalu sertakan format dokumen yang rapi jika pengguna meminta penyusunan surat/nota/laporan/BAST.`;

      let userPrompt = message;
      if (mode === 'draft-letter') {
        userPrompt = `Buatkan draft naskah dinas resmi / surat permohonan / nota dinas terkait: "${message}". 
Sertakan Kop Surat, Nomor Surat, Lampiran, Perihal, Salam Pembuka, Uraian Isi Permohonan/Pekerjaan, Tempat & Tanggal penetapan (${schoolConfig.kotaKabupaten || 'Bogor'}), serta Blok Tanda Tangan resmi (Petugas ${roleTitle} dan Mengetahui Kepala Sekolah).`;
      } else if (mode === 'incident-report') {
        userPrompt = `Buatkan Laporan Kronologis Kejadian / Insiden / Kerusakan Sarpras resmi terkait: "${message}". 
Sertakan waktu kejadian, lokasi spesifik, uraian kronologis faktual, estimasi dampak, tindakan darurat yang telah diambil, dan usulan tindak lanjut ke pimpinan sekolah.`;
      } else if (mode === 'bast-document') {
        userPrompt = `Buatkan Berita Acara Serah Terima (BAST) / Berita Acara Pemeriksaan Barang/Pekerjaan resmi untuk: "${message}". 
Sertakan identitas Pihak Pertama dan Pihak Kedua, dasar pelaksanaan, rincian barang/pekerjaan, klausul serah terima, dan kolom tanda tangan bermaterai/stempel.`;
      } else if (mode === 'sop-advice') {
        userPrompt = `Berikan panduan SOP standar operasional dan kepatuhan SPM Kemendikbud terkait pertanyaan: "${message}". 
Jelaskan langkah demi langkah yang aman, terstandar, dan akuntabel bagi operator ${roleTitle}.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `${systemPrompt}\n\nPermintaan Pengguna:\n${userPrompt}`,
        config: {
          temperature: 0.3
        }
      });

      const reply = response.text?.trim() || '';
      if (reply) {
        return res.json({ success: true, isAi: true, reply });
      }
    }
  } catch (err) {
    console.warn('Gemini assistant fallback:', err);
  }

  // High-fidelity fallback based on mode & role
  let fallbackReply = '';
  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const kota = schoolConfig.kotaKabupaten || 'Bogor';
  const sekolah = schoolConfig.namaSekolah || 'Satuan Pendidikan';
  const kepsek = schoolConfig.kepalaSekolah?.nama || 'Kepala Sekolah';
  const kepsekNip = schoolConfig.kepalaSekolah?.nip || '-';
  const operatorName = schoolConfig.operatorProfiles?.[role]?.nama || 'Petugas Layanan Operasional';
  const operatorNip = schoolConfig.operatorProfiles?.[role]?.nip || '-';

  if (mode === 'draft-letter') {
    fallbackReply = `PEMERINTAH DAERAH PROVINSI / KABUPATEN
DINAS PENDIDIKAN DAN KEBUDAYAAN
${sekolah.toUpperCase()}
Jl. Pendidikan No. 1, ${kota}

NOTA DINAS / SURAT USULAN OPERASIONAL
Nomor: 027 / ${role} / OPS / ${new Date().getFullYear()}

Kepada Yth. : Kepala ${sekolah}
Dari        : Petugas ${roleTitle}
Tanggal     : ${dateStr}
Perihal     : Permohonan Pemenuhan & Dukungan Operasional (${message || 'Sarana dan Prasarana'})

Dengan hormat,
Sehubungan dengan kelancaran penyelenggaraan layanan operasional satuan pendidikan dan pemenuhan Standar Pelayanan Minimal (SPM), bersama ini kami sampaikan permohonan dukungan operasional sebagai berikut:

1. Rincian Kebutuhan/Uraian Masalah:
   - Terkait dengan: ${message || 'Dukungan perlengkapan dan operasional rutin kedinasan'}
   - Kondisi saat ini memerlukan penanganan/pengadaan guna menjamin keamanan, kebersihan, dan kenyamanan lingkungan belajar.

2. Usulan Tindak Lanjut:
   - Pengalokasian perlengkapan melalui pengadaan belanja operasional (BOS/ARKAS).
   - Penjadwalan pemeliharaan preventif bersama tim sarana prasarana sekolah.

Demikian permohonan ini kami sampaikan, atas arahan dan perkenan Bapak/Ibu Kepala Sekolah kami haturkan terima kasih.

Mengetahui,                                  ${kota}, ${dateStr}
Kepala ${sekolah}                            Petugas ${roleTitle}

( ${kepsek} )                               ( ${operatorName} )
NIP. ${kepsekNip}                            NIP. ${operatorNip}`;
  } else if (mode === 'incident-report') {
    fallbackReply = `LAPORAN KRONOLOGIS KEJADIAN / KERUSAKAN OPERASIONAL
SATUAN PENDIDIKAN: ${sekolah.toUpperCase()}
Nomor Registrasi: LAP-INS/${new Date().getFullYear()}/${Math.floor(100 + Math.random()*900)}

I. IDENTITAS LAPORAN
- Waktu Kejadian : ${dateStr}, Pukul 08:30 WIB
- Lokasi Kejadian: Lingkungan ${sekolah}
- Pelapor        : ${operatorName} (${roleTitle})

II. KRONOLOGIS KEJADIAN
Terkait peristiwa: "${message || 'Kendala operasional di lingkungan sekolah'}"
1. Pada saat pelaksanaan tugas rutin, petugas menemukan kondisi yang memerlukan penanganan segera.
2. Petugas langsung melakukan tindakan mitigasi awal untuk mencegah meluasnya gangguan.
3. Situasi telah diamankan dan didokumentasikan untuk keperluan pelaporan resmi kepada pimpinan sekolah.

III. TINDAKAN SEMENTARA & REKOMENDASI
- Tindakan darurat: Melakukan isolasi area / penanganan pertama secara terukur.
- Rekomendasi: Diperlukan perbaikan teknis / penggantian suku cadang sesegera mungkin.

${kota}, ${dateStr}
Petugas Pembuat Laporan,

( ${operatorName} )
NIP. ${operatorNip}`;
  } else if (mode === 'bast-document') {
    fallbackReply = `BERITA ACARA SERAH TERIMA PEKERJAAN / BARANG OPERASIONAL
Nomor: 028/BAST/${role}/${new Date().getFullYear()}

Pada hari ini, ${dateStr}, bertempat di ${sekolah}, kami yang bertandatangan di bawah ini:

1. Nama  : ${operatorName}
   NIP   : ${operatorNip}
   Jabatan: Operator ${roleTitle}
   (selanjutnya disebut PIHAK PERTAMA)

2. Nama  : ${kepsek}
   NIP   : ${kepsekNip}
   Jabatan: Kepala ${sekolah}
   (selanjutnya disebut PIHAK KEDUA)

Dengan ini menyatakan bahwa PIHAK PERTAMA telah menyerahkan hasil pekerjaan/barang berupa:
"${message || 'Hasil pelaksanaan pekerjaan pemeliharaan sarana operasional sekolah'}" kepada PIHAK KEDUA dalam kondisi baik, lengkap, dan memenuhi standar operasional.

Demikian Berita Acara ini dibuat dengan sebenarnya dalam rangkap 2 (dua) untuk dipergunakan sebagaimana mestinya.

PIHAK KEDUA (Penerima)                       PIHAK PERTAMA (Penyerah)
Kepala ${sekolah}                            Operator ${roleTitle}

( ${kepsek} )                               ( ${operatorName} )
NIP. ${kepsekNip}                            NIP. ${operatorNip}`;
  } else {
    fallbackReply = `Halo Bapak/Ibu ${operatorName}! Sebagai Asisten Cerdas Operasional Satuan Pendidikan untuk bidang ${roleTitle}, berikut panduan dan rekomendasi terkait "${message || 'tugas kedinasan'}":

1. Standar Operasional Kedinasan (SOP):
   Pastikan setiap aktivitas dicatat dalam Jurnal Tugas Harian dengan rincian kuantitas/volume yang terukur (contoh: unit, berkas, ruangan). Hal ini penting untuk pembuktian kinerja pada Laporan Bulanan dan Laporan Tahunan.

2. Kepatuhan Tata Naskah & Bukti Otentik:
   Selalu lengkapi dengan foto dokumentasi sebelum (before) dan sesudah (after) pelaksanaan pekerjaan guna memperkuat keabsahan berkas saat pemeriksaan audit dinas.

3. Kesiapsiagaan Sarana & K3:
   Laporkan segera sarana atau alat kerja yang mengalami kondisi "Rusak Ringan" agar dapat dijadwalkan pemeliharaan preventif sebelum terjadi kerusakan fatal.

Apakah Anda ingin saya buatkan draf surat permohonan resmi, berita acara (BAST), atau analisis laporan kinerja terkait hal ini? Anda dapat memilih menu cepat di atas.`;
  }

  res.json({
    success: true,
    isAi: false,
    reply: fallbackReply
  });
});
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server SI-OPS berjalan pada http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Gagal menjalankan server:', err);
});
