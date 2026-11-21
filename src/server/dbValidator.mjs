export const DEFAULT_DATABASE_QUOTA_BYTES = 5 * 1024 * 1024; // 5 MB default centralized Admin DB quota

export const BUILTIN_DATABASE_DEFS = [
  {
    code: 'tasks',
    name: 'Jurnal Tugas Harian',
    module: 'Semua Layanan Operasional',
    description: 'Log tugas pokok & tambahan seluruh operator (TU, Penjaga, Service, Perpus, Lab IPA).',
    capacityLimitBytes: 1024 * 1024,
    maxRecords: 5000,
    isBuiltin: true
  },
  {
    code: 'inventories',
    name: 'Inventaris Sarpras',
    module: 'Sarana & Prasarana',
    description: 'Daftar inventaris barang, kondisi, lokasi penyimpanan, dan tahun pengadaan.',
    capacityLimitBytes: 512 * 1024,
    maxRecords: 3000,
    isBuiltin: true
  },
  {
    code: 'monthlyReports',
    name: 'Laporan Bulanan',
    module: 'Pelaporan Bulanan',
    description: 'Rekapitulasi kinerja bulanan, capaian, kendala, dan solusi tiap layanan.',
    capacityLimitBytes: 512 * 1024,
    maxRecords: 1000,
    isBuiltin: true
  },
  {
    code: 'annualReports',
    name: 'Laporan Tahunan',
    module: 'Pelaporan Tahunan',
    description: 'Ringkasan eksekutif tahunan, milestone, dan rekomendasi strategis.',
    capacityLimitBytes: 256 * 1024,
    maxRecords: 300,
    isBuiltin: true
  },
  {
    code: 'archives',
    name: 'Arsip Dokumen Resmi',
    module: 'Kearsipan & Pengesahan',
    description: 'Snapshot dokumen resmi yang telah disahkan beserta nomor registrasi.',
    capacityLimitBytes: 1024 * 1024,
    maxRecords: 1500,
    isBuiltin: true
  },
  {
    code: 'libraryBooks',
    name: 'Koleksi Buku Perpustakaan',
    module: 'Layanan Perpustakaan',
    description: 'Katalog buku induk, klasifikasi DDC, stok eksemplar, dan kondisi.',
    capacityLimitBytes: 512 * 1024,
    maxRecords: 5000,
    isBuiltin: true
  },
  {
    code: 'libraryMembers',
    name: 'Anggota Perpustakaan',
    module: 'Layanan Perpustakaan',
    description: 'Daftar anggota aktif (siswa, pendidik, tendik) beserta jenis kelamin.',
    capacityLimitBytes: 256 * 1024,
    maxRecords: 3000,
    isBuiltin: true
  },
  {
    code: 'beritaAcaraHistory',
    name: 'Riwayat Berita Acara & Surat TU',
    module: 'Tata Usaha (Migrasi Terpusat)',
    description: 'Arsip terpusat seluruh Berita Acara & Surat Pengantar Resmi (sebelumnya tersimpan lokal).',
    capacityLimitBytes: 512 * 1024,
    maxRecords: 1500,
    isBuiltin: true
  },
  {
    code: 'customCategories',
    name: 'Kategori Tugas Kustom',
    module: 'Pengaturan Tupoksi',
    description: 'Kategori tugas pokok & tambahan khusus per satuan pendidikan.',
    capacityLimitBytes: 128 * 1024,
    maxRecords: 500,
    isBuiltin: true
  },
  {
    code: 'accessUsers',
    name: 'Akun & Hak Akses Pengguna',
    module: 'Keamanan & RBAC Admin',
    description: 'Data akun terdaftar, status persetujuan, peran layanan, dan riwayat sandi terenkripsi.',
    capacityLimitBytes: 256 * 1024,
    maxRecords: 1000,
    isBuiltin: true
  }
];

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const OPERATOR_KEY_REGEX = /^\$(where|gt|gte|lt|lte|ne|eq|in|nin|regex|expr|function|or|and|not|nor|exists|type)$/i;
const SAFE_IDENTIFIER_REGEX = /^[a-zA-Z0-9_-]{2,64}$/;
const VALID_ROLES = ['TU', 'PENJAGA', 'SERVICE', 'PERPUS', 'LAB_IPA'];

export function sanitizeAndInspectPayload(value, depth = 0) {
  if (depth > 18) {
    return { valid: false, error: 'Struktur data terlalu dalam (melebihi batas kedalaman aman).' };
  }
  if (value === null || value === undefined) {
    return { valid: true, value };
  }
  if (typeof value === 'string') {
    if (value.length > 2_000_000) {
      return { valid: false, error: 'Ukuran teks terlalu besar (maksimal 2MB per kolom).' };
    }
    return { valid: true, value };
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      return { valid: false, error: 'Nilai angka tidak valid.' };
    }
    return { valid: true, value };
  }
  if (Array.isArray(value)) {
    const cleanArr = [];
    for (let i = 0; i < value.length; i++) {
      const check = sanitizeAndInspectPayload(value[i], depth + 1);
      if (!check.valid) return check;
      cleanArr.push(check.value);
    }
    return { valid: true, value: cleanArr };
  }
  if (typeof value === 'object') {
    const cleanObj = {};
    for (const key of Object.keys(value)) {
      if (DANGEROUS_KEYS.has(key) || OPERATOR_KEY_REGEX.test(key)) {
        return {
          valid: false,
          error: `Parameter tidak diizinkan terdeteksi ("${key}"). Permintaan ditolak demi keamanan.`
        };
      }
      const check = sanitizeAndInspectPayload(value[key], depth + 1);
      if (!check.valid) return check;
      cleanObj[key] = check.value;
    }
    return { valid: true, value: cleanObj };
  }
  return { valid: false, error: 'Tipe data tidak didukung.' };
}

export function isValidIdentifier(value) {
  return typeof value === 'string' && SAFE_IDENTIFIER_REGEX.test(value.trim());
}

function asTrimmedString(val, maxLen = 5000) {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

export function validateRecordForCollection(collection, rawRecord, customDbDef = null) {
  const safeCheck = sanitizeAndInspectPayload(rawRecord);
  if (!safeCheck.valid) {
    return { valid: false, error: safeCheck.error };
  }
  const record = safeCheck.value;
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return { valid: false, error: 'Data record wajib berupa objek JSON yang valid.' };
  }

  // Validate custom database record based on Admin-defined fields
  if (customDbDef) {
    const cleanCustom = { ...record };
    const fields = Array.isArray(customDbDef.fields) ? customDbDef.fields : [];
    for (const field of fields) {
      const val = cleanCustom[field.key];
      if (field.required && (val === undefined || val === null || String(val).trim() === '')) {
        return { valid: false, error: `Kolom "${field.label || field.key}" wajib diisi.` };
      }
      if (val !== undefined && val !== null && val !== '') {
        if (field.type === 'number') {
          const num = Number(val);
          if (!Number.isFinite(num)) {
            return { valid: false, error: `Kolom "${field.label || field.key}" harus berupa angka valid.` };
          }
          cleanCustom[field.key] = num;
        } else if (field.type === 'boolean') {
          cleanCustom[field.key] = Boolean(val);
        } else if (field.type === 'date') {
          const str = String(val).trim();
          if (Number.isNaN(Date.parse(str))) {
            return { valid: false, error: `Kolom "${field.label || field.key}" harus berupa tanggal valid.` };
          }
          cleanCustom[field.key] = str;
        } else {
          cleanCustom[field.key] = String(val).trim().slice(0, 10000);
        }
      }
    }
    if (!cleanCustom.id || !isValidIdentifier(String(cleanCustom.id))) {
      cleanCustom.id = `${customDbDef.code.slice(0, 6)}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }
    cleanCustom.updatedAt = new Date().toISOString();
    return { valid: true, record: cleanCustom };
  }

  switch (collection) {
    case 'tasks': {
      const role = asTrimmedString(record.role, 20);
      if (!VALID_ROLES.includes(role)) {
        return { valid: false, error: 'Peran layanan tugas (role) tidak valid.' };
      }
      const title = asTrimmedString(record.title, 300);
      if (!title) {
        return { valid: false, error: 'Judul tugas harian wajib diisi.' };
      }
      const date = asTrimmedString(record.date, 30);
      if (!/^\d{4}-\d{2}-\d{2}/.test(date)) {
        return { valid: false, error: 'Format tanggal tugas harus YYYY-MM-DD.' };
      }
      const status = ['selesai', 'dalam_proses', 'perlu_tindak_lanjut'].includes(record.status)
        ? record.status
        : 'selesai';
      return {
        valid: true,
        record: {
          ...record,
          id: isValidIdentifier(record.id) ? record.id : `tsk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role,
          title,
          date: date.slice(0, 10),
          category: asTrimmedString(record.category, 80) || 'layanan_umum',
          description: asTrimmedString(record.description, 5000),
          location: asTrimmedString(record.location, 300),
          timeStart: asTrimmedString(record.timeStart, 16) || '07:00',
          timeEnd: asTrimmedString(record.timeEnd, 16) || '08:00',
          status,
          volumeUnit: asTrimmedString(record.volumeUnit, 200) || '1 kegiatan',
          petugas: asTrimmedString(record.petugas, 200) || 'Petugas Layanan'
        }
      };
    }

    case 'inventories': {
      const role = VALID_ROLES.includes(record.role) ? record.role : 'TU';
      const namaBarang = asTrimmedString(record.namaBarang, 300);
      if (!namaBarang) {
        return { valid: false, error: 'Nama barang inventaris wajib diisi.' };
      }
      const jumlah = Number(record.jumlah ?? 1);
      if (!Number.isFinite(jumlah) || jumlah < 0) {
        return { valid: false, error: 'Jumlah inventaris harus angka >= 0.' };
      }
      const kondisi = ['Baik', 'Rusak Ringan', 'Rusak Berat'].includes(record.kondisi)
        ? record.kondisi
        : 'Baik';
      return {
        valid: true,
        record: {
          ...record,
          id: isValidIdentifier(record.id) ? record.id : `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role,
          kodeBarang: asTrimmedString(record.kodeBarang, 80) || `INV-${Date.now().toString().slice(-5)}`,
          namaBarang,
          merkModel: asTrimmedString(record.merkModel, 200) || '-',
          kategori: asTrimmedString(record.kategori, 120) || 'Sarpras',
          jumlah: Math.round(jumlah),
          satuan: asTrimmedString(record.satuan, 60) || 'Unit',
          kondisi,
          lokasiPenyimpanan: asTrimmedString(record.lokasiPenyimpanan, 200) || 'Sekolah',
          tahunPengadaan: Number.isFinite(Number(record.tahunPengadaan))
            ? Number(record.tahunPengadaan)
            : new Date().getFullYear(),
          keterangan: asTrimmedString(record.keterangan, 1000)
        }
      };
    }

    case 'libraryBooks': {
      const judul = asTrimmedString(record.judul, 400);
      if (!judul) {
        return { valid: false, error: 'Judul buku perpustakaan wajib diisi.' };
      }
      const jumlah = Number(record.jumlah ?? 1);
      if (!Number.isFinite(jumlah) || jumlah < 0) {
        return { valid: false, error: 'Jumlah eksemplar buku harus angka >= 0.' };
      }
      return {
        valid: true,
        record: {
          ...record,
          id: isValidIdentifier(record.id) ? record.id : `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          kodeBuku: asTrimmedString(record.kodeBuku, 80) || `BK-${Date.now().toString().slice(-5)}`,
          judul,
          penulis: asTrimmedString(record.penulis, 200) || '-',
          penerbit: asTrimmedString(record.penerbit, 200) || '-',
          tahunTerbit: Number.isFinite(Number(record.tahunTerbit))
            ? Number(record.tahunTerbit)
            : new Date().getFullYear(),
          sumberPengadaan: asTrimmedString(record.sumberPengadaan, 120) || 'BOS Reguler',
          tanggalMasuk: asTrimmedString(record.tanggalMasuk, 20) || new Date().toISOString().slice(0, 10),
          bulanPengadaan: record.bulanPengadaan ?? new Date().getMonth() + 1,
          jumlah: Math.round(jumlah),
          kondisi: asTrimmedString(record.kondisi, 40) || 'Baik',
          lokasiRak: asTrimmedString(record.lokasiRak, 100) || 'Rak Umum'
        }
      };
    }

    case 'libraryMembers': {
      const nama = asTrimmedString(record.nama, 250);
      if (!nama) {
        return { valid: false, error: 'Nama anggota perpustakaan wajib diisi.' };
      }
      const jenisKelamin = record.jenisKelamin === 'P' ? 'P' : 'L';
      return {
        valid: true,
        record: {
          ...record,
          id: isValidIdentifier(record.id) ? record.id : `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          nomorAnggota: asTrimmedString(record.nomorAnggota, 80) || `ANG-${Date.now().toString().slice(-5)}`,
          nama,
          tipeAnggota: asTrimmedString(record.tipeAnggota, 30) || 'siswa',
          kelasAtauJabatan: asTrimmedString(record.kelasAtauJabatan, 120) || '-',
          jenisKelamin,
          status: asTrimmedString(record.status, 30) || 'aktif'
        }
      };
    }

    case 'monthlyReports': {
      const role = VALID_ROLES.includes(record.role) ? record.role : 'TU';
      const month = Number(record.month);
      const year = Number(record.year);
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return { valid: false, error: 'Bulan laporan harus di antara 1 sampai 12.' };
      }
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return { valid: false, error: 'Tahun laporan tidak valid (2000-2100).' };
      }
      return {
        valid: true,
        record: {
          ...record,
          id: isValidIdentifier(record.id) ? record.id : `mon-${role.toLowerCase()}-${year}-${month}`,
          role,
          month,
          year,
          manualDocDate: asTrimmedString(record.manualDocDate, 120) || '-',
          summary: asTrimmedString(record.summary, 10000),
          achievements: Array.isArray(record.achievements) ? record.achievements.map(String) : [],
          obstacles: Array.isArray(record.obstacles) ? record.obstacles.map(String) : [],
          solutions: Array.isArray(record.solutions) ? record.solutions.map(String) : [],
          approvalStatus: ['draft', 'diajukan', 'disetujui_kasubag', 'disahkan_kepsek'].includes(record.approvalStatus)
            ? record.approvalStatus
            : 'draft'
        }
      };
    }

    case 'annualReports': {
      const role = VALID_ROLES.includes(record.role) ? record.role : 'TU';
      const year = Number(record.year);
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return { valid: false, error: 'Tahun laporan tahunan tidak valid (2000-2100).' };
      }
      return {
        valid: true,
        record: {
          ...record,
          id: isValidIdentifier(record.id) ? record.id : `ann-${role.toLowerCase()}-${year}`,
          role,
          year,
          manualDocDate: asTrimmedString(record.manualDocDate, 120) || '-',
          summary: asTrimmedString(record.summary, 15000),
          annualMilestones: Array.isArray(record.annualMilestones) ? record.annualMilestones.map(String) : [],
          strategicRecommendations: Array.isArray(record.strategicRecommendations)
            ? record.strategicRecommendations.map(String)
            : [],
          approvalStatus: ['draft', 'diajukan', 'disetujui_kasubag', 'disahkan_kepsek'].includes(record.approvalStatus)
            ? record.approvalStatus
            : 'draft'
        }
      };
    }

    case 'archives': {
      const title = asTrimmedString(record.title, 300);
      if (!title) {
        return { valid: false, error: 'Judul arsip dokumen wajib diisi.' };
      }
      return {
        valid: true,
        record: {
          ...record,
          id: isValidIdentifier(record.id) ? record.id : `ars-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role: VALID_ROLES.includes(record.role) ? record.role : 'TU',
          title,
          regNumber: asTrimmedString(record.regNumber, 120) || `ARS/${new Date().getFullYear()}`,
          nomorSurat: asTrimmedString(record.nomorSurat, 120) || '-',
          dateArchived: asTrimmedString(record.dateArchived, 40) || new Date().toISOString()
        }
      };
    }

    case 'beritaAcaraHistory': {
      const templateTitle = asTrimmedString(record.templateTitle || record.ringkasan, 300);
      if (!templateTitle) {
        return { valid: false, error: 'Judul / template Berita Acara wajib diisi.' };
      }
      return {
        valid: true,
        record: {
          ...record,
          id: isValidIdentifier(record.id) ? record.id : `ba-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          templateId: asTrimmedString(record.templateId, 80) || 'rapat_dinas',
          templateTitle,
          nomorSurat: asTrimmedString(record.nomorSurat, 120) || '-',
          tanggalSurat: asTrimmedString(record.tanggalSurat, 80) || '-',
          ringkasan: asTrimmedString(record.ringkasan, 500) || templateTitle,
          formValues: record.formValues && typeof record.formValues === 'object' ? record.formValues : {},
          createdAt: asTrimmedString(record.createdAt, 40) || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    }

    case 'customCategories': {
      const name = asTrimmedString(record.name, 160);
      if (!name) {
        return { valid: false, error: 'Nama kategori kustom wajib diisi.' };
      }
      const role = VALID_ROLES.includes(record.role) ? record.role : 'TU';
      return {
        valid: true,
        record: {
          ...record,
          id: isValidIdentifier(record.id) ? record.id : `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role,
          name,
          slug:
            asTrimmedString(record.slug, 100) ||
            name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
          classification: record.classification === 'tambahan' ? 'tambahan' : 'pokok',
          createdAt: asTrimmedString(record.createdAt, 30) || new Date().toISOString().slice(0, 10)
        }
      };
    }

    default:
      return { valid: false, error: `Koleksi database "${collection}" tidak terdaftar.` };
  }
}

export function getByteSize(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value ?? null), 'utf8');
  } catch {
    return 0;
  }
}

export function getAlertLevel(percentUsed, status = 'ACTIVE') {
  if (status === 'LOCKED' || percentUsed >= 100) return 'FULL';
  if (percentUsed >= 95) return 'CRITICAL';
  if (percentUsed >= 80) return 'WARNING';
  return 'NORMAL';
}

export function computeDatabaseMetrics(db) {
  const registry = Array.isArray(db?.databaseRegistry) ? db.databaseRegistry : [];
  const customRecordsMap =
    db?.customDatabaseRecords && typeof db.customDatabaseRecords === 'object'
      ? db.customDatabaseRecords
      : {};

  const databases = registry.map(def => {
    const rows = def.isBuiltin
      ? Array.isArray(db?.[def.code])
        ? db[def.code]
        : []
      : Array.isArray(customRecordsMap[def.code])
      ? customRecordsMap[def.code]
      : [];

    const usedBytes = getByteSize(rows);
    const limitBytes = Math.max(1024, Number(def.capacityLimitBytes) || 512 * 1024);
    const maxRecords = Math.max(1, Number(def.maxRecords) || 1000);
    const bytePercent = (usedBytes / limitBytes) * 100;
    const recordPercent = (rows.length / maxRecords) * 100;
    const percentUsed = Math.min(100, Number(Math.max(bytePercent, recordPercent).toFixed(1)));
    const status = def.status || 'ACTIVE';
    const alertLevel = getAlertLevel(percentUsed, status);

    return {
      code: def.code,
      name: def.name,
      module: def.module,
      description: def.description || '',
      isBuiltin: Boolean(def.isBuiltin),
      status,
      recordCount: rows.length,
      maxRecords,
      remainingRecords: Math.max(0, maxRecords - rows.length),
      usedBytes,
      limitBytes,
      remainingBytes: Math.max(0, limitBytes - usedBytes),
      percentUsed,
      alertLevel,
      fields: Array.isArray(def.fields) ? def.fields : [],
      createdAt: def.createdAt,
      updatedAt: def.updatedAt
    };
  });

  // Calculate total operational payload size (excluding historical backups array to measure live DB footprint cleanly)
  const dbCopyWithoutBackups = { ...db, backups: undefined };
  const totalUsedBytes = getByteSize(dbCopyWithoutBackups);
  const totalQuotaBytes = Math.max(
    100 * 1024,
    Number(db?.databaseQuotaBytes) || DEFAULT_DATABASE_QUOTA_BYTES
  );
  const totalPercentUsed = Math.min(100, Number(((totalUsedBytes / totalQuotaBytes) * 100).toFixed(1)));
  const totalRecords = databases.reduce((sum, item) => sum + item.recordCount, 0);
  const highestModuleAlert = databases.some(d => d.alertLevel === 'FULL')
    ? 'FULL'
    : databases.some(d => d.alertLevel === 'CRITICAL')
    ? 'CRITICAL'
    : databases.some(d => d.alertLevel === 'WARNING')
    ? 'WARNING'
    : 'NORMAL';

  const globalAlertLevel = getAlertLevel(totalPercentUsed);
  const effectiveAlertLevel =
    globalAlertLevel === 'FULL' || highestModuleAlert === 'FULL'
      ? 'FULL'
      : globalAlertLevel === 'CRITICAL' || highestModuleAlert === 'CRITICAL'
      ? 'CRITICAL'
      : globalAlertLevel === 'WARNING' || highestModuleAlert === 'WARNING'
      ? 'WARNING'
      : 'NORMAL';

  return {
    totalUsedBytes,
    totalQuotaBytes,
    totalRemainingBytes: Math.max(0, totalQuotaBytes - totalUsedBytes),
    totalPercentUsed,
    totalRecords,
    globalAlertLevel,
    effectiveAlertLevel,
    databases
  };
}

export function checkWriteCapacity(db, targetCode, additionalBytes = 0) {
  const metrics = computeDatabaseMetrics(db);
  if (metrics.totalUsedBytes + additionalBytes > metrics.totalQuotaBytes || metrics.totalPercentUsed >= 100) {
    return {
      allowed: false,
      status: 507,
      error:
        'Kapasitas total Database Admin sudah mencapai 100% (PENUH). Penulisan data baru dikunci. Silakan cadangkan & arsipkan data lama atau naikkan batas kapasitas di Panel Admin.'
    };
  }
  const targetDb = metrics.databases.find(d => d.code === targetCode);
  if (targetDb) {
    if (targetDb.status === 'ARCHIVED') {
      return {
        allowed: false,
        status: 403,
        error: `Database "${targetDb.name}" berstatus ARSIP (read-only). Aktifkan kembali oleh Admin untuk menulis data baru.`
      };
    }
    if (
      targetDb.status === 'LOCKED' ||
      targetDb.percentUsed >= 100 ||
      targetDb.recordCount + 1 > targetDb.maxRecords ||
      targetDb.usedBytes + additionalBytes > targetDb.limitBytes
    ) {
      return {
        allowed: false,
        status: 507,
        error: `Kapasitas database "${targetDb.name}" telah mencapai batas 100% (Terkunci untuk tulis data baru). Kelola kapasitas atau hapus data lama di Panel Admin.`
      };
    }
  }
  return { allowed: true, metrics };
}

export function findDuplicateRecordIndex(existingList, candidate, collection) {
  if (!Array.isArray(existingList) || !candidate) return -1;
  return existingList.findIndex(item => {
    if (!item || typeof item !== 'object') return false;
    if (candidate.id && item.id === candidate.id) return true;
    switch (collection) {
      case 'inventories':
        return (
          candidate.kodeBarang &&
          item.kodeBarang &&
          String(item.kodeBarang).toLowerCase() === String(candidate.kodeBarang).toLowerCase() &&
          item.role === candidate.role
        );
      case 'libraryBooks':
        return (
          candidate.kodeBuku &&
          item.kodeBuku &&
          String(item.kodeBuku).toLowerCase() === String(candidate.kodeBuku).toLowerCase()
        );
      case 'libraryMembers':
        return (
          candidate.nomorAnggota &&
          item.nomorAnggota &&
          String(item.nomorAnggota).toLowerCase() === String(candidate.nomorAnggota).toLowerCase()
        );
      case 'monthlyReports':
        return item.role === candidate.role && item.month === candidate.month && item.year === candidate.year;
      case 'annualReports':
        return item.role === candidate.role && item.year === candidate.year;
      case 'tasks':
        return (
          item.role === candidate.role &&
          item.date === candidate.date &&
          String(item.title || '').toLowerCase() === String(candidate.title || '').toLowerCase()
        );
      case 'beritaAcaraHistory':
        return (
          candidate.nomorSurat &&
          item.nomorSurat &&
          String(item.nomorSurat).toLowerCase() === String(candidate.nomorSurat).toLowerCase() &&
          item.templateId === candidate.templateId
        );
      default:
        return false;
    }
  });
}
