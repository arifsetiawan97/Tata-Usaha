let geminiClient = null;

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

async function generateWithTimeout(ai, params, timeoutMs = 12000) {
  return Promise.race([
    ai.models.generateContent(params),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), timeoutMs)
    )
  ]);
}

export async function handleAnalyzeMonthly(body) {
  const { role, month, year, tasks = [], schoolConfig = {} } = body || {};
  const roleTitle =
    role === 'TU'
      ? 'Tata Usaha (TU)'
      : role === 'PENJAGA'
      ? 'Penjaga Sekolah'
      : role === 'SERVICE'
      ? 'Layanan Kebersihan (Service)'
      : role === 'PERPUS'
      ? 'Layanan Perpustakaan'
      : 'Laboratorium IPA';

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthNames[(month || 9) - 1] || 'September';

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'selesai').length;
  const inProgressTasks = tasks.filter((t) => t.status !== 'selesai').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
  const sampleTasks = tasks
    .slice(0, 15)
    .map((t) => `- [${t.date}] ${t.title} (${t.volumeUnit || '1 kegiatan'}) - Status: ${t.status}`)
    .join('\n');

  try {
    const ai = await getGeminiClient();
    if (ai) {
      const prompt = `Anda adalah Evaluator Kinerja Operasional Satuan Pendidikan Senior.
Buat analisis JSON untuk Laporan Bulanan ${roleTitle} (${schoolConfig.namaSekolah || 'Sekolah'}), Bulan ${monthName} ${year}.
Total: ${totalTasks}, Selesai: ${completedTasks} (${completionRate}%), Berjalan: ${inProgressTasks}.
Sampel:\n${sampleTasks || '(Tugas rutin standar operasional)'}
Kembalikan HANYA JSON valid:
{"summary":"...","achievements":["..."],"obstacles":["..."],"solutions":["..."]}`;

      const response = await generateWithTimeout(ai, {
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const text = response.text?.trim() || '';
      if (text) {
        return { success: true, isAi: true, data: JSON.parse(text) };
      }
    }
  } catch (err) {
    console.warn('Gemini monthly analysis fallback triggered:', err);
  }

  let achievements = [];
  let obstacles = [];
  let solutions = [];
  let summary = '';

  if (role === 'PENJAGA') {
    achievements = [
      `Pelaksanaan patroli keamanan berkala gedung dan area lingkungan sekolah terlaksana ${Math.max(totalTasks, 26)} kali dengan tingkat zero incident`,
      `Pengawasan ketertiban dan pendampingan penyeberangan jalan peserta didik di gerbang utama (${completedTasks > 0 ? completedTasks : 22} hari efektif)`,
      `Pemeriksaan fisik sarana prasarana serta penanganan perbaikan ringan kunci pintu, instalasi kran air, dan lampu selasar tuntas 100%`,
      `Pelaksanaan ekspedisi pengantaran surat dinas ke instansi mitra terlaksana tepat waktu`
    ];
    obstacles = [
      'Kondisi cuaca hujan lebat yang memerlukan pengawasan ekstra pada saluran air dan talang atap',
      'Kebutuhan peremajaan senter patroli malam dan gembok cadangan'
    ];
    solutions = [
      'Pembersihan berkala saluran drainase bersama petugas kebersihan',
      'Pengajuan inventarisasi pengadaan senter patroli dan gembok ke bagian TU'
    ];
    summary = `Berdasarkan rekapitulasi harian bulan ${monthName} ${year}, Penjaga Sekolah telah menyelesaikan ${completedTasks} dari ${totalTasks > 0 ? totalTasks : 24} agenda kerja (${completionRate}%).`;
  } else if (role === 'TU') {
    achievements = [
      `Pengelolaan dan registrasi buku agenda surat kedinasan (${totalTasks > 0 ? totalTasks : 28} berkas) teradministrasi tertib`,
      `Pelayanan administrasi kesiswaan berupa verifikasi mutasi, pencatatan buku induk, dan legalisasi tuntas`,
      `Pembaruan berkas kepegawaian dan data Dapodik GTK terlaksana tepat waktu`,
      `Verifikasi fisik dan rekonsiliasi berkala buku inventaris barang (KIR) tercatat valid`
    ];
    obstacles = [
      'Volume dokumen fisik membutuhkan pemindaian arsip digital berkelanjutan',
      'Koordinasi konfirmasi surat undangan kedinasan yang mendekati tenggat waktu'
    ];
    solutions = [
      'Jadwal pemindaian digital arsip secara terstruktur setiap akhir pekan',
      'Optimalisasi saluran komunikasi persuratan digital'
    ];
    summary = `Sepanjang bulan ${monthName} ${year}, Tata Usaha telah menuntaskan ${completedTasks} pekerjaan administratif (${completionRate}%) sesuai SOP satuan pendidikan.`;
  } else if (role === 'PERPUS') {
    achievements = [
      `Pelayanan sirkulasi peminjaman dan pengembalian bahan pustaka terlaksana tertib (${completedTasks > 0 ? completedTasks : 24} transaksi)`,
      `Pengolahan klasifikasi DDC, pelabelan barcode, dan pencatatan buku induk untuk koleksi baru tuntas`,
      `Pendampingan 15 menit membaca rutin dalam program Gerakan Literasi Sekolah (GLS) berjalan aktif`,
      `Restorasi dan penjilidan ulang buku yang mengalami kerusakan ringan`
    ];
    obstacles = [
      'Keterlambatan pengembalian buku pinjaman menjelang pekan asesmen',
      'Kapasitas rak display buku baru perlu ditambah'
    ];
    solutions = [
      'Pemberitahuan pengembalian berkala melalui wali kelas',
      'Usulan penambahan rak buku display pada anggaran sekolah'
    ];
    summary = `Kinerja Perpustakaan pada bulan ${monthName} ${year} menyelesaikan ${completedTasks} dari ${totalTasks > 0 ? totalTasks : 22} kegiatan (${completionRate}%).`;
  } else if (role === 'LAB_IPA') {
    achievements = [
      `Penyiapan set alat peraga dan bahan reagen praktikum fisika & biologi (${completedTasks > 0 ? completedTasks : 20} sesi)`,
      `Sterilisasi, pencucian alat gelas kimia, dan pemeliharaan mikroskop bebas kontaminan`,
      `Pengecekan kesiapsiagaan K3 laboratorium tercatat Zero Incident`,
      `Pencatatan kartu stok inventaris bahan kimia dan logbook penggunaan ruang lab terarsip rapi`
    ];
    obstacles = [
      'Stok larutan reagen indikator asam-basa menipis di akhir periode praktikum',
      'Sumbatan halus pada kran wastafel ruang preparasi lab'
    ];
    solutions = [
      'Pengajuan amprah bahan kimia lebih awal ke bagian TU',
      'Pembersihan saringan kran bersama tim sarpras'
    ];
    summary = `Kinerja Laboratorium IPA bulan ${monthName} ${year} mencatat ${completedTasks} dari ${totalTasks > 0 ? totalTasks : 20} pekerjaan tuntas (${completionRate}%).`;
  } else {
    achievements = [
      `Sanitasi dan sterilisasi harian toilet guru & siswa terjaga higienis (${completedTasks > 0 ? completedTasks : 24} hari kerja)`,
      `Pembersihan menyeluruh ruang pimpinan, dewan guru, tata usaha, dan lobi 2 kali sehari`,
      `Pengangkutan dan pemilahan sampah organik serta anorganik ke TPS terlaksana optimal`,
      `Perawatan dan penyiraman berkala tanaman taman sekolah`
    ];
    obstacles = [
      'Stok bahan pembersih lantai dan sabun cair menipis di minggu ke-3',
      'Endapan lumut pada lantai selasar luar saat curah hujan tinggi'
    ];
    solutions = [
      'Jadwal pengajuan amprah bahan pembersih 7 hari sebelum stok habis',
      'Pembersihan intensif lantai luar dengan cairan pembersih anti-licin'
    ];
    summary = `Kinerja Layanan Kebersihan (Service) bulan ${monthName} ${year} menyelesaikan ${completedTasks} dari ${totalTasks > 0 ? totalTasks : 25} kegiatan sanitasi (${completionRate}%).`;
  }

  return { success: true, isAi: false, data: { summary, achievements, obstacles, solutions } };
}

export async function handleAnalyzeAnnual(body) {
  const { role, year, tasks = [], schoolConfig = {} } = body || {};
  const roleTitle =
    role === 'TU'
      ? 'Tata Usaha (TU)'
      : role === 'PENJAGA'
      ? 'Penjaga Sekolah'
      : role === 'SERVICE'
      ? 'Layanan Kebersihan (Service)'
      : role === 'PERPUS'
      ? 'Layanan Perpustakaan'
      : 'Laboratorium IPA';

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'selesai').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 98;

  try {
    const ai = await getGeminiClient();
    if (ai) {
      const prompt = `Susun evaluasi tahunan JSON untuk Laporan Tahunan ${roleTitle} (${schoolConfig.namaSekolah || 'Sekolah'}), Tahun ${year}, total tugas ${totalTasks || 280}, capaian ${completionRate}%.
Kembalikan HANYA JSON valid:
{"summary":"...","annualMilestones":["..."],"obstacles":["..."],"solutions":["..."],"strategicRecommendations":["..."]}`;

      const response = await generateWithTimeout(ai, {
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const text = response.text?.trim() || '';
      if (text) {
        return { success: true, isAi: true, data: JSON.parse(text) };
      }
    }
  } catch (err) {
    console.warn('Gemini annual analysis fallback triggered:', err);
  }

  return {
    success: true,
    isAi: false,
    data: {
      summary: `Laporan Tahunan Kinerja ${roleTitle} Tahun Anggaran ${year} mencatat capaian ${completionRate}% dengan seluruh agenda pelayanan dan administrasi terlaksana tertib sesuai Standar Pelayanan Minimal (SPM) satuan pendidikan.`,
      annualMilestones: [
        `Realisasi layanan operasional rutin dan tupoksi ${roleTitle} sepanjang 12 bulan dengan tingkat ketuntasan ${completionRate}%`,
        `Pemeliharaan tertib administrasi, dokumentasi bukti kerja, dan pelaporan berkala kepada pimpinan sekolah`,
        `Kesiapsiagaan sarana prasarana pendukung operasional dan keselamatan kerja lingkungan satuan pendidikan`,
        `Dukungan penuh penyelenggaraan kegiatan pembelajaran dan ketatausahaan sepanjang tahun anggaran ${year}`
      ],
      strategicRecommendations: [
        `Optimalisasi digitalisasi pencatatan operasional dan pengarsipan dokumen layanan ${roleTitle}`,
        `Penganggaran pemeliharaan preventif dan peremajaan perlengkapan kerja melalui RKAS tahun berikutnya`,
        `Peningkatan koordinasi berkala lintas layanan guna memperkuat tata kelola satuan pendidikan`
      ]
    }
  };
}

export async function handleDraftTask(body) {
  const { role, roughPrompt = '', date = '', category = '' } = body || {};
  const roleTitle =
    role === 'TU'
      ? 'Tata Usaha (Administrasi Sekolah)'
      : role === 'PENJAGA'
      ? 'Penjaga Sekolah (Keamanan & Sapras)'
      : role === 'SERVICE'
      ? 'Layanan Kebersihan (Sanitasi & Lingkungan)'
      : role === 'PERPUS'
      ? 'Layanan Perpustakaan'
      : 'Laboratorium IPA';

  try {
    const ai = await getGeminiClient();
    if (ai) {
      const prompt = `Rumuskan tugas dinas ${roleTitle} dari kata kunci "${roughPrompt || 'tugas rutin'}", kategori "${category || 'otomatis'}", tanggal "${date || 'hari ini'}".
Kembalikan HANYA JSON valid:
{"title":"...","description":"...","location":"...","volumeUnit":"...","timeStart":"07:30","timeEnd":"09:00","status":"selesai","taskType":"pokok","categoryRecommendation":"..."}`;
      const response = await generateWithTimeout(ai, {
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const text = response.text?.trim() || '';
      if (text) {
        return { success: true, isAi: true, data: JSON.parse(text) };
      }
    }
  } catch (err) {
    console.warn('Gemini draft-task fallback:', err);
  }

  const defaultCategory =
    role === 'TU'
      ? 'kepegawaian'
      : role === 'PENJAGA'
      ? 'keamanan'
      : role === 'SERVICE'
      ? 'kebersihan_wc'
      : role === 'PERPUS'
      ? 'sirkulasi_peminjaman'
      : 'persiapan_praktikum';

  const titleFallback = roughPrompt
    ? `Pelaksanaan ${roughPrompt.trim().charAt(0).toUpperCase() + roughPrompt.trim().slice(1)}`
    : `Pelaksanaan Tugas Rutin Kedinasan ${roleTitle}`;

  return {
    success: true,
    isAi: false,
    data: {
      title: titleFallback,
      description: `Melaksanakan kegiatan ${roughPrompt || 'operasional sekolah'} sesuai SOP kedinasan satuan pendidikan dengan hasil terlaksana tertib, aman, dan akuntabel.`,
      location:
        role === 'TU'
          ? 'Ruang Tata Usaha'
          : role === 'PENJAGA'
          ? 'Pintu Gerbang & Lingkungan Sekolah'
          : role === 'SERVICE'
          ? 'Area Gedung & Toilet Sekolah'
          : role === 'PERPUS'
          ? 'Ruang Perpustakaan'
          : 'Laboratorium IPA',
      volumeUnit: '1 kegiatan dinas',
      timeStart: '07:30',
      timeEnd: '09:00',
      status: 'selesai',
      taskType: 'pokok',
      categoryRecommendation: category || defaultCategory
    }
  };
}

export async function handleSuggestCategories(body) {
  const { role, existingCategories = [] } = body || {};
  const roleTitle =
    role === 'TU'
      ? 'Tata Usaha'
      : role === 'PENJAGA'
      ? 'Penjaga Sekolah'
      : role === 'SERVICE'
      ? 'Layanan Kebersihan'
      : role === 'PERPUS'
      ? 'Layanan Perpustakaan'
      : 'Laboratorium IPA';

  try {
    const ai = await getGeminiClient();
    if (ai) {
      const prompt = `Berikan 4 rekomendasi kategori layanan baru untuk ${roleTitle}. Sudah ada: ${existingCategories.map((c) => c.name || c).join(', ') || 'standar'}.
Kembalikan HANYA array JSON valid:
[{"name":"...","classification":"pokok","description":"...","reason":"..."}]`;
      const response = await generateWithTimeout(ai, {
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const text = response.text?.trim() || '';
      if (text) {
        return { success: true, isAi: true, data: JSON.parse(text) };
      }
    }
  } catch (err) {
    console.warn('Gemini suggest-categories fallback:', err);
  }

  const suggestionsMap = {
    TU: [
      { name: 'Pengarsipan Dokumen Digital (e-Arsip)', classification: 'pokok', description: 'Digitalisasi warkat dinas, scan ijazah, dan pencadangan dokumen.', reason: 'Mempercepat pencarian arsip.' },
      { name: 'Layanan Mutasi & Legalisir Cepat', classification: 'pokok', description: 'Pelayanan berkas pindah sekolah dan legalisasi.', reason: 'Meningkatkan kepuasan wali murid.' }
    ],
    PENJAGA: [
      { name: 'Pemeliharaan Kelistrikan & Genset Darurat', classification: 'pokok', description: 'Pemeriksaan rutin MCB dan instalasi listrik kelas.', reason: 'Mencegah bahaya korsleting.' },
      { name: 'Pengawasan CCTV & Alarm Keamanan', classification: 'pokok', description: 'Pengecekan fungsi rekaman kamera pengawas.', reason: 'Meningkatkan daya pantau area rawan.' }
    ],
    SERVICE: [
      { name: 'Sanitasi & Sterilisasi Ruang UKS', classification: 'pokok', description: 'Disinfeksi berkala ruang UKS.', reason: 'Mencegah penularan penyakit.' },
      { name: 'Pemeliharaan Tandon Air Bersih', classification: 'pokok', description: 'Pengurasan berkala toren air dan kontrol kran.', reason: 'Menjamin air bersih higienis.' }
    ],
    PERPUS: [
      { name: 'Layanan Peminjaman Multimedia & Chromebook', classification: 'pokok', description: 'Sirkulasi perangkat digital siswa.', reason: 'Mendukung pembelajaran berbasis TIK.' },
      { name: 'Pengelolaan Pojok Baca Kreatif', classification: 'tambahan', description: 'Penyegaran koleksi buku di kelas.', reason: 'Meningkatkan minat baca harian.' }
    ],
    LAB_IPA: [
      { name: 'Pemeriksaan Kesiapsiagaan APAR & P3K', classification: 'pokok', description: 'Pengecekan jarum tekanan APAR dan kotak P3K.', reason: 'Syarat wajib keselamatan kerja.' },
      { name: 'Kalibrasi Mikroskop & Neraca', classification: 'tambahan', description: 'Pembersihan lensa optik dan tera.', reason: 'Menjamin akurasi pengamatan siswa.' }
    ]
  };

  return { success: true, isAi: false, data: suggestionsMap[role] || suggestionsMap.TU };
}

export async function handleAnalyzeInventory(body) {
  const { role, inventories = [], schoolConfig = {} } = body || {};
  const roleTitle =
    role === 'TU'
      ? 'Tata Usaha'
      : role === 'PENJAGA'
      ? 'Penjaga Sekolah'
      : role === 'SERVICE'
      ? 'Layanan Kebersihan'
      : role === 'PERPUS'
      ? 'Perpustakaan'
      : 'Laboratorium IPA';

  const total = inventories.length;
  const baik = inventories.filter((i) => i.kondisi === 'Baik').length;
  const rusakRingan = inventories.filter((i) => i.kondisi === 'Rusak Ringan').length;
  const rusakBerat = inventories.filter((i) => i.kondisi === 'Rusak Berat').length;
  const healthRate = total > 0 ? Math.round((baik / total) * 100) : 100;

  try {
    const ai = await getGeminiClient();
    if (ai) {
      const prompt = `Analisis inventaris ${roleTitle} (${schoolConfig.namaSekolah || 'Sekolah'}): Total ${total}, Baik ${baik}, Rusak Ringan ${rusakRingan}, Rusak Berat ${rusakBerat}.
Kembalikan HANYA JSON valid:
{"conditionSummary":"...","readinessScore":${healthRate},"priorityAction":"...","recommendations":["..."]}`;
      const response = await generateWithTimeout(ai, {
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const text = response.text?.trim() || '';
      if (text) {
        return { success: true, isAi: true, data: JSON.parse(text) };
      }
    }
  } catch (err) {
    console.warn('Gemini analyze-inventory fallback:', err);
  }

  return {
    success: true,
    isAi: false,
    data: {
      conditionSummary: `Dari total ${total} item sarana prasarana ${roleTitle}, ${baik} unit laik pakai (${healthRate}%), ${rusakRingan} unit memerlukan pemeliharaan berkala, dan ${rusakBerat} unit diusulkan penghapusan aset.`,
      readinessScore: healthRate,
      priorityAction: rusakBerat > 0 ? 'Penyusunan BAST Rekomendasi Penghapusan Aset' : 'Pemeliharaan Berkala Preventif',
      recommendations: [
        'Melakukan servis berkala pada barang dengan kategori Rusak Ringan',
        'Memperbarui label kode inventaris pada setiap sarana baru',
        'Mengalokasikan anggaran suku cadang pada RKAS berikutnya'
      ]
    }
  };
}

export async function handleGenerateTaskDescription(body) {
  const { title = '', category = '', role = 'TU', location = '', volumeUnit = '' } = body || {};
  if (!title.trim()) {
    return { status: 400, payload: { error: 'Judul kegiatan tugas harian wajib diisi.' } };
  }

  const roleTitle =
    role === 'TU'
      ? 'Tata Usaha'
      : role === 'PENJAGA'
      ? 'Penjaga Sekolah'
      : role === 'SERVICE'
      ? 'Layanan Kebersihan'
      : role === 'PERPUS'
      ? 'Layanan Perpustakaan'
      : 'Laboratorium IPA';

  try {
    const ai = await getGeminiClient();
    if (ai) {
      const prompt = `Buat uraian rincian pekerjaan dinas ${roleTitle}: Judul "${title}", Kategori "${category}", Lokasi "${location}", Volume "${volumeUnit}".
Kembalikan HANYA JSON valid:
{"description":"...","suggestedLocation":"...","suggestedVolume":"...","notes":"..."}`;
      const response = await generateWithTimeout(ai, {
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const text = response.text?.trim() || '';
      if (text) {
        return { status: 200, payload: { success: true, isAi: true, data: JSON.parse(text) } };
      }
    }
  } catch (err) {
    console.warn('Gemini generate-task-description fallback:', err);
  }

  return {
    status: 200,
    payload: {
      success: true,
      isAi: false,
      data: {
        description: `Melaksanakan kegiatan "${title.trim()}" pada bidang ${roleTitle} sesuai prosedur operasional standar satuan pendidikan dengan hasil tertib, terukur, dan terarsip.`,
        suggestedLocation:
          location ||
          (role === 'TU'
            ? 'Ruang Tata Usaha'
            : role === 'PENJAGA'
            ? 'Lingkungan Sekolah'
            : role === 'SERVICE'
            ? 'Area Gedung Sekolah'
            : role === 'PERPUS'
            ? 'Ruang Perpustakaan'
            : 'Laboratorium IPA'),
        suggestedVolume: volumeUnit || '1 kegiatan kedinasan',
        notes: 'Pelaksanaan pekerjaan telah tuntas 100% sesuai SOP kedinasan satuan pendidikan.'
      }
    }
  };
}

export async function handleAuditDocument(body) {
  const { documentTitle = '', role = 'TU', checklist = {}, period = '', approvalStatus = 'disahkan_kepsek' } = body || {};

  try {
    const ai = await getGeminiClient();
    if (ai) {
      const prompt = `Nilai kesiapan audit dokumen "${documentTitle}", bidang ${role}, periode ${period}, status ${approvalStatus}.
Kembalikan HANYA JSON valid:
{"auditRating":"Sangat Baik (A)","complianceSummary":"...","complianceNotes":["..."],"riskAssessment":"Rendah","actionItems":["..."]}`;
      const response = await generateWithTimeout(ai, {
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const text = response.text?.trim() || '';
      if (text) {
        return { success: true, isAi: true, data: JSON.parse(text) };
      }
    }
  } catch (err) {
    console.warn('Gemini audit-document fallback:', err);
  }

  const score =
    (checklist.hasKop ? 20 : 0) +
    (checklist.hasApprovalSheet ? 25 : 0) +
    (checklist.hasSignatures ? 25 : 0) +
    (checklist.hasStamp ? 15 : 0) +
    (checklist.hasPhotos ? 15 : 0);
  const rating = score >= 80 ? 'Sangat Baik (A)' : score >= 60 ? 'Baik (B)' : 'Perlu Perbaikan (C)';
  const risk = score >= 80 ? 'Rendah (Aman Pemeriksaan)' : score >= 60 ? 'Sedang (Perlu Dilengkapi)' : 'Tinggi';

  return {
    success: true,
    isAi: false,
    data: {
      auditRating: rating,
      complianceSummary: `Dokumen "${documentTitle}" memiliki indeks kelengkapan tata naskah dinas sebesar ${score}%.`,
      complianceNotes: [
        checklist.hasApprovalSheet && checklist.hasSignatures
          ? 'Lembar pengesahan dan tanda tangan pejabat valid'
          : 'Pastikan tanda tangan pejabat telah dibubuhkan',
        checklist.hasPhotos
          ? 'Terdapat dokumentasi visual bukti kegiatan'
          : 'Disarankan melampirkan foto dokumentasi kegiatan'
      ],
      riskAssessment: risk,
      actionItems: ['Simpan salinan fisik bertandatangan di lemari arsip dinas sekolah']
    }
  };
}

export async function handleAssistant(body) {
  const { message = '', mode = 'chat', role = 'TU', schoolConfig = {} } = body || {};
  const roleTitle =
    role === 'TU'
      ? 'Tata Usaha'
      : role === 'PENJAGA'
      ? 'Penjaga Sekolah'
      : role === 'SERVICE'
      ? 'Layanan Kebersihan'
      : role === 'PERPUS'
      ? 'Layanan Perpustakaan'
      : 'Laboratorium IPA';

  try {
    const ai = await getGeminiClient();
    if (ai) {
      const prompt = `Anda adalah Asisten AI SI-OPS untuk ${roleTitle} di ${schoolConfig.namaSekolah || 'Satuan Pendidikan'}. Mode: ${mode}. Permintaan: ${message}`;
      const response = await generateWithTimeout(ai, {
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { temperature: 0.3 }
      });
      const reply = response.text?.trim() || '';
      if (reply) {
        return { success: true, isAi: true, reply };
      }
    }
  } catch (err) {
    console.warn('Gemini assistant fallback:', err);
  }

  return {
    success: true,
    isAi: false,
    reply: `Halo Bapak/Ibu Operator ${roleTitle}! Terkait "${message || 'tugas kedinasan'}", pastikan seluruh rincian kegiatan, lokasi, dan volume terukur tercatat di Jurnal Harian agar otomatis terkompilasi ke Laporan Bulanan dan Tahunan.`
  };
}
