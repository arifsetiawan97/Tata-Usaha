import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  applySecurityHeaders,
  computePasswordFingerprint,
  hashSecret,
  sanitizeAccessUserForClient,
  verifySecret
} from './authSecurity.mjs';
import {
  BUILTIN_DATABASE_DEFS,
  DEFAULT_DATABASE_QUOTA_BYTES,
  checkWriteCapacity,
  computeDatabaseMetrics,
  findDuplicateRecordIndex,
  getByteSize,
  isValidIdentifier,
  validateRecordForCollection
} from './dbValidator.mjs';

export const VALID_COLLECTIONS = [
  'tasks',
  'inventories',
  'monthlyReports',
  'annualReports',
  'archives',
  'customCategories',
  'libraryBooks',
  'libraryMembers',
  'beritaAcaraHistory'
];

export const DEFAULT_ACCESS_RULES = {
  requireAdminApproval: true,
  enforceUniquePassword: true,
  enforceSingleServicePerUser: true
};

export const DEFAULT_WELCOME_HEADLINE = 'SELAMAT DATANG OPERATOR LAYANAN OPERASIONAL';
export const DEFAULT_WELCOME_SUBHEADLINE =
  'Masuk ke layanan sesuai bidang tugas Anda, pantau status akun, dan kirim laporan operasional terpusat satu pintu.';

const VALID_ROLES = ['TU', 'PENJAGA', 'SERVICE', 'PERPUS', 'LAB_IPA'];
const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

const UPSTASH_KEY = 'siops:app_state:v1';
const SUPABASE_TABLE = 'siops_kv';
const SUPABASE_ROW_ID = 'main';

function parseTimestamp(iso) {
  if (!iso || typeof iso !== 'string') return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

function getUserLatestActivityTimestamp(user) {
  return Math.max(
    parseTimestamp(user.passwordUpdatedAt),
    parseTimestamp(user.resetIssuedAt),
    parseTimestamp(user.resetRequestedAt),
    parseTimestamp(user.rejectedAt),
    parseTimestamp(user.approvedAt),
    parseTimestamp(user.lastLoginAt),
    parseTimestamp(user.createdAt)
  );
}

function mergePasswordHistory(a, b) {
  const map = new Map();
  const combined = [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])];
  for (const entry of combined) {
    if (!entry || typeof entry !== 'object') continue;
    if (!entry.changedAt) continue;
    const key = `${entry.changedAt}::${entry.source || 'USER_CHANGE'}`;
    if (!map.has(key)) {
      map.set(key, {
        changedAt: entry.changedAt,
        source: entry.source || 'USER_CHANGE',
        maskedPreview: '••••••'
      });
    }
  }
  return Array.from(map.values())
    .sort((x, y) => parseTimestamp(y.changedAt) - parseTimestamp(x.changedAt))
    .slice(0, 20);
}

export function normalizeUserSchoolIdentity(raw) {
  if (!raw || typeof raw !== 'object') return undefined;
  const namaSekolah = typeof raw.namaSekolah === 'string' ? raw.namaSekolah.trim().slice(0, 140) : '';
  const pemerintahDaerah =
    typeof raw.pemerintahDaerah === 'string' ? raw.pemerintahDaerah.trim().slice(0, 140) : '';
  const dinasPendidikan =
    typeof raw.dinasPendidikan === 'string' ? raw.dinasPendidikan.trim().slice(0, 140) : '';
  const kabupatenKota =
    typeof raw.kabupatenKota === 'string' ? raw.kabupatenKota.trim().slice(0, 100) : '';
  const npsn = typeof raw.npsn === 'string' ? raw.npsn.trim().slice(0, 30) : '';

  if (!namaSekolah && !pemerintahDaerah && !dinasPendidikan && !kabupatenKota && !npsn) {
    return undefined;
  }

  return {
    namaSekolah,
    ...(pemerintahDaerah ? { pemerintahDaerah } : {}),
    ...(dinasPendidikan ? { dinasPendidikan } : {}),
    ...(kabupatenKota ? { kabupatenKota } : {}),
    ...(npsn ? { npsn } : {})
  };
}

function normalizeRegisteredUser(raw, securityPepper) {
  if (!raw || typeof raw !== 'object') return null;
  const username = typeof raw.username === 'string' ? raw.username.trim() : '';
  const rawPlainPassword = typeof raw.password === 'string' ? raw.password.trim() : '';
  const existingHash = typeof raw.passwordHash === 'string' ? raw.passwordHash.trim() : '';
  if (!username || (!rawPlainPassword && !existingHash)) return null;

  const role = VALID_ROLES.includes(raw.role) ? raw.role : 'TU';
  const status = VALID_STATUSES.includes(raw.status) ? raw.status : 'PENDING';
  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim()
      : `usr-${username.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}-${role.toLowerCase()}`;

  // Upgrade any legacy plaintext user password to salted scrypt hash cleanly
  let passwordHash = existingHash;
  let passwordFingerprint =
    typeof raw.passwordFingerprint === 'string' ? raw.passwordFingerprint : '';
  if (!passwordHash && rawPlainPassword) {
    passwordHash = hashSecret(rawPlainPassword);
    passwordFingerprint = computePasswordFingerprint(rawPlainPassword, securityPepper);
  } else if (!passwordFingerprint && rawPlainPassword) {
    passwordFingerprint = computePasswordFingerprint(rawPlainPassword, securityPepper);
  }

  const schoolIdentity = normalizeUserSchoolIdentity(raw.schoolIdentity);

  return {
    id,
    namaLengkap:
      typeof raw.namaLengkap === 'string' && raw.namaLengkap.trim()
        ? raw.namaLengkap.trim()
        : username,
    username,
    role,
    ...(schoolIdentity ? { schoolIdentity } : {}),
    passwordHash,
    passwordFingerprint,
    // Keep tempResetCode ONLY while awaiting user change after admin reset
    ...(raw.resetRequestStatus === 'RESET_ISSUED' && raw.tempResetCode
      ? { tempResetCode: String(raw.tempResetCode) }
      : {}),
    status,
    createdAt:
      typeof raw.createdAt === 'string' && raw.createdAt
        ? raw.createdAt
        : new Date().toISOString(),
    approvedAt: typeof raw.approvedAt === 'string' ? raw.approvedAt : undefined,
    rejectedAt: typeof raw.rejectedAt === 'string' ? raw.rejectedAt : undefined,
    lastLoginAt: typeof raw.lastLoginAt === 'string' ? raw.lastLoginAt : undefined,
    resetRequestStatus: raw.resetRequestStatus,
    resetRequestedAt: typeof raw.resetRequestedAt === 'string' ? raw.resetRequestedAt : undefined,
    resetRequestNote: typeof raw.resetRequestNote === 'string' ? raw.resetRequestNote : undefined,
    resetIssuedAt: typeof raw.resetIssuedAt === 'string' ? raw.resetIssuedAt : undefined,
    mustChangePassword: typeof raw.mustChangePassword === 'boolean' ? raw.mustChangePassword : false,
    passwordUpdatedAt: typeof raw.passwordUpdatedAt === 'string' ? raw.passwordUpdatedAt : undefined,
    passwordChangeHistory: mergePasswordHistory(raw.passwordChangeHistory, [])
  };
}

export function mergeRegisteredUsers(
  primaryUsers = [],
  secondaryUsers = [],
  deletedIds = [],
  securityPepper = ''
) {
  const deletedSet = new Set(Array.isArray(deletedIds) ? deletedIds.filter(Boolean) : []);
  const byId = new Map();

  const ingest = (rawList) => {
    if (!Array.isArray(rawList)) return;
    for (const raw of rawList) {
      const norm = normalizeRegisteredUser(raw, securityPepper);
      if (!norm) continue;
      if (deletedSet.has(norm.id)) continue;

      const existing = byId.get(norm.id);
      if (!existing) {
        byId.set(norm.id, norm);
      } else {
        const existingTs = getUserLatestActivityTimestamp(existing);
        const incomingTs = getUserLatestActivityTimestamp(norm);
        const newer = incomingTs >= existingTs ? norm : existing;
        const older = incomingTs >= existingTs ? existing : norm;

        byId.set(norm.id, {
          ...older,
          ...newer,
          approvedAt: newer.approvedAt || older.approvedAt,
          rejectedAt: newer.rejectedAt || older.rejectedAt,
          createdAt: older.createdAt || newer.createdAt,
          lastLoginAt:
            parseTimestamp(newer.lastLoginAt) >= parseTimestamp(older.lastLoginAt)
              ? newer.lastLoginAt
              : older.lastLoginAt,
          passwordChangeHistory: mergePasswordHistory(
            newer.passwordChangeHistory,
            older.passwordChangeHistory
          )
        });
      }
    }
  };

  ingest(primaryUsers);
  ingest(secondaryUsers);

  return Array.from(byId.values()).sort(
    (a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt)
  );
}

function getUpstashConfig() {
  const url = (
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    ''
  )
    .trim()
    .replace(/\/+$/, '');
  const token = (
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    ''
  ).trim();
  return url && token ? { url, token } : null;
}

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();
  return url && key ? { url, key } : null;
}

function isVercelRuntime() {
  return process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
}

export function getStorageInfo() {
  if (getUpstashConfig()) {
    return {
      storageMode: 'upstash',
      cloudPersistent: true,
      label: 'Cloud Upstash Redis / Vercel KV (Database Admin Satu Pintu)'
    };
  }
  if (getSupabaseConfig()) {
    return {
      storageMode: 'supabase',
      cloudPersistent: true,
      label: 'Cloud Supabase Database (Database Admin Satu Pintu)'
    };
  }
  if (isVercelRuntime()) {
    return {
      storageMode: 'vercel-ephemeral',
      cloudPersistent: false,
      label: 'Vercel Sementara (Hubungkan Storage Upstash Redis untuk Persistensi)'
    };
  }
  return {
    storageMode: 'local-file',
    cloudPersistent: true,
    label: 'Server Database Admin Aktif (Satu Pintu)'
  };
}

export function applyCorsHeaders(resOrReq, maybeRes) {
  if (maybeRes) {
    return applySecurityHeaders(resOrReq, maybeRes);
  }
  return applySecurityHeaders(null, resOrReq);
}

function buildDefaultDatabaseRegistry() {
  const now = new Date().toISOString();
  return BUILTIN_DATABASE_DEFS.map(def => ({
    ...def,
    status: 'ACTIVE',
    fields: [],
    createdAt: now,
    updatedAt: now
  }));
}

export function createDefaultAdminAccount() {
  const now = new Date().toISOString();
  const seededHash = hashSecret('admin123');
  return {
    id: 'admin-root',
    username: 'admin',
    email: 'admin@sekolah.local',
    namaLengkap: 'Administrator Utama',
    role: 'ADMIN',
    status: 'ACTIVE',
    passwordHash: seededHash,
    isDefaultCredentials: true,
    createdAt: now,
    updatedAt: now
  };
}

export function sanitizeAdminProfile(adminAccount) {
  if (!adminAccount || typeof adminAccount !== 'object') return null;
  return {
    id: adminAccount.id || 'admin-root',
    username: adminAccount.username || 'admin',
    email: adminAccount.email || '',
    namaLengkap: adminAccount.namaLengkap || 'Administrator Utama',
    role: 'ADMIN',
    status: adminAccount.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    isDefaultCredentials: Boolean(adminAccount.isDefaultCredentials),
    updatedAt: adminAccount.updatedAt || adminAccount.createdAt || ''
  };
}

function buildFallbackSeedData() {
  const defaultAdmin = createDefaultAdminAccount();
  return {
    tasks: [],
    inventories: [],
    monthlyReports: [],
    annualReports: [],
    schoolConfig: null,
    archives: [],
    tupoksiDefinitions: null,
    customCategories: [],
    libraryBooks: [],
    libraryMembers: [],
    libraryMemberStats: {
      siswaLaki: 0,
      siswaPerempuan: 0,
      guruPendidik: 0,
      guruLaki: 0,
      guruPerempuan: 0,
      staffTendik: 0,
      staffLaki: 0,
      staffPerempuan: 0,
      lastUpdated: ''
    },
    beritaAcaraHistory: [],
    userTupoksiDefinitions: {},
    userLibraryMemberStats: {},
    userServiceBackgrounds: {},
    userHiddenRecords: {},
    customDatabaseRecords: {},
    databaseRegistry: buildDefaultDatabaseRegistry(),
    databaseQuotaBytes: DEFAULT_DATABASE_QUOTA_BYTES,
    siteSettings: {
      welcomeHeadline: DEFAULT_WELCOME_HEADLINE,
      welcomeSubheadline: DEFAULT_WELCOME_SUBHEADLINE,
      mainBackground: null,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Sistem'
    },
    softDeletedItems: [],
    backups: [],
    backupSchedule: {
      enabled: true,
      intervalHours: 24,
      lastBackupAt: ''
    },
    auditLogs: [],
    staffSubmissions: [],
    migrationLogs: [],
    accessUsers: [],
    deletedAccessUserIds: [],
    accessRules: { ...DEFAULT_ACCESS_RULES },
    adminAccount: defaultAdmin,
    adminCredentialHash: defaultAdmin.passwordHash,
    serverSecurityPepper: crypto.randomBytes(32).toString('hex'),
    lastUpdated: new Date().toISOString()
  };
}

export function createInitialDbData() {
  const candidatePaths = [
    path.join(process.cwd(), 'data', 'db.json'),
    path.join(process.cwd(), 'data', 'db.backup.json')
  ];
  for (const bundledDbPath of candidatePaths) {
    if (fs.existsSync(bundledDbPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(bundledDbPath, 'utf-8'));
        if (raw && typeof raw === 'object') {
          return migrateAndNormalizeDb(raw).data;
        }
      } catch {
        // Try next candidate
      }
    }
  }
  return buildFallbackSeedData();
}

function migrateAndNormalizeDb(parsed) {
  let patched = false;

  if (typeof parsed.serverSecurityPepper !== 'string' || !parsed.serverSecurityPepper.trim()) {
    parsed.serverSecurityPepper = crypto.randomBytes(32).toString('hex');
    patched = true;
  }

  // Strip insecure legacy plaintext adminPassword field
  if (Object.prototype.hasOwnProperty.call(parsed, 'adminPassword')) {
    delete parsed.adminPassword;
    patched = true;
  }

  if (typeof parsed.adminCredentialHash !== 'string') {
    parsed.adminCredentialHash = '';
    patched = true;
  }

  // Bootstrap default admin account when database/storage has no admin account yet
  if (
    !parsed.adminAccount ||
    typeof parsed.adminAccount !== 'object' ||
    !String(parsed.adminAccount.username || '').trim() ||
    !String(parsed.adminAccount.passwordHash || '').trim()
  ) {
    const defaultAdmin = createDefaultAdminAccount();
    parsed.adminAccount = defaultAdmin;
    parsed.adminCredentialHash = defaultAdmin.passwordHash;
    patched = true;
  } else {
    if (!parsed.adminAccount.status) {
      parsed.adminAccount.status = 'ACTIVE';
      patched = true;
    }
    if (parsed.adminAccount.role !== 'ADMIN') {
      parsed.adminAccount.role = 'ADMIN';
      patched = true;
    }
    if (parsed.adminCredentialHash !== parsed.adminAccount.passwordHash) {
      parsed.adminCredentialHash = parsed.adminAccount.passwordHash;
      patched = true;
    }
  }

  if (!Array.isArray(parsed.deletedAccessUserIds)) {
    parsed.deletedAccessUserIds = [];
    patched = true;
  }

  if (!Array.isArray(parsed.beritaAcaraHistory)) {
    parsed.beritaAcaraHistory = [];
    patched = true;
  }

  if (!parsed.userTupoksiDefinitions || typeof parsed.userTupoksiDefinitions !== 'object') {
    parsed.userTupoksiDefinitions = {};
    patched = true;
  }

  if (!parsed.userLibraryMemberStats || typeof parsed.userLibraryMemberStats !== 'object') {
    parsed.userLibraryMemberStats = {};
    patched = true;
  }

  if (!parsed.userServiceBackgrounds || typeof parsed.userServiceBackgrounds !== 'object') {
    parsed.userServiceBackgrounds = {};
    patched = true;
  }

  if (!parsed.userHiddenRecords || typeof parsed.userHiddenRecords !== 'object') {
    parsed.userHiddenRecords = {};
    patched = true;
  }

  if (!parsed.customDatabaseRecords || typeof parsed.customDatabaseRecords !== 'object') {
    parsed.customDatabaseRecords = {};
    patched = true;
  }

  if (!Array.isArray(parsed.databaseRegistry) || parsed.databaseRegistry.length === 0) {
    parsed.databaseRegistry = buildDefaultDatabaseRegistry();
    patched = true;
  } else {
    // Ensure all built-in modules exist in registry while preserving Admin's custom limits & status
    const existingByCode = new Map(parsed.databaseRegistry.map(item => [item.code, item]));
    let registryChanged = false;
    for (const def of BUILTIN_DATABASE_DEFS) {
      if (!existingByCode.has(def.code)) {
        existingByCode.set(def.code, {
          ...def,
          status: 'ACTIVE',
          fields: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        registryChanged = true;
      }
    }
    if (registryChanged) {
      parsed.databaseRegistry = Array.from(existingByCode.values());
      patched = true;
    }
  }

  if (!Number.isFinite(Number(parsed.databaseQuotaBytes)) || Number(parsed.databaseQuotaBytes) < 100 * 1024) {
    parsed.databaseQuotaBytes = DEFAULT_DATABASE_QUOTA_BYTES;
    patched = true;
  }

  if (!parsed.siteSettings || typeof parsed.siteSettings !== 'object') {
    parsed.siteSettings = {
      welcomeHeadline: DEFAULT_WELCOME_HEADLINE,
      welcomeSubheadline: DEFAULT_WELCOME_SUBHEADLINE,
      mainBackground: null,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Sistem'
    };
    patched = true;
  } else {
    if (
      typeof parsed.siteSettings.welcomeHeadline !== 'string' ||
      !parsed.siteSettings.welcomeHeadline.trim()
    ) {
      parsed.siteSettings.welcomeHeadline = DEFAULT_WELCOME_HEADLINE;
      patched = true;
    }
    if (parsed.siteSettings.mainBackground) {
      const bgCheck = validateBackgroundConfigInput(parsed.siteSettings.mainBackground, {
        actorName: parsed.siteSettings.updatedBy || 'ADMIN_UTAMA',
        defaultOpacity: 0.55
      });
      if (!bgCheck.valid) {
        parsed.siteSettings.mainBackground = null;
        patched = true;
      }
    }
  }

  if (!Array.isArray(parsed.softDeletedItems)) {
    parsed.softDeletedItems = [];
    patched = true;
  }
  if (!Array.isArray(parsed.backups)) {
    parsed.backups = [];
    patched = true;
  }
  if (!parsed.backupSchedule || typeof parsed.backupSchedule !== 'object') {
    parsed.backupSchedule = { enabled: true, intervalHours: 24, lastBackupAt: '' };
    patched = true;
  }
  if (!Array.isArray(parsed.auditLogs)) {
    parsed.auditLogs = [];
    patched = true;
  }
  if (!Array.isArray(parsed.staffSubmissions)) {
    parsed.staffSubmissions = [];
    patched = true;
  }
  if (!Array.isArray(parsed.migrationLogs)) {
    parsed.migrationLogs = [];
    patched = true;
  }

  const rawUsers = Array.isArray(parsed.accessUsers) ? parsed.accessUsers : [];
  const hadPlainUserPass = rawUsers.some(u => u && typeof u.password === 'string' && !u.passwordHash);
  const normalizedUsers = mergeRegisteredUsers(
    rawUsers,
    [],
    parsed.deletedAccessUserIds,
    parsed.serverSecurityPepper
  );
  if (!Array.isArray(parsed.accessUsers) || normalizedUsers.length !== rawUsers.length || hadPlainUserPass) {
    parsed.accessUsers = normalizedUsers;
    patched = true;
  } else {
    parsed.accessUsers = normalizedUsers;
  }

  if (!parsed.accessRules || typeof parsed.accessRules !== 'object') {
    parsed.accessRules = { ...DEFAULT_ACCESS_RULES };
    patched = true;
  } else {
    const mergedRules = { ...DEFAULT_ACCESS_RULES, ...parsed.accessRules };
    if (JSON.stringify(mergedRules) !== JSON.stringify(parsed.accessRules)) {
      parsed.accessRules = mergedRules;
      patched = true;
    }
  }

  return { data: parsed, patched };
}

async function readFromUpstash(cfg) {
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(['GET', UPSTASH_KEY])
  });
  if (!res.ok) {
    throw new Error(`Upstash GET failed with status ${res.status}`);
  }
  const json = await res.json();
  if (!json || json.result === null || json.result === undefined) {
    return null;
  }
  if (typeof json.result === 'string') {
    return JSON.parse(json.result);
  }
  return json.result;
}

async function writeToUpstash(cfg, data) {
  const serialized = JSON.stringify(data);
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(['SET', UPSTASH_KEY, serialized])
  });
  return res.ok;
}

async function readFromSupabase(cfg) {
  const res = await fetch(
    `${cfg.url}/rest/v1/${SUPABASE_TABLE}?id=eq.${encodeURIComponent(SUPABASE_ROW_ID)}&select=payload`,
    {
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        Accept: 'application/json'
      }
    }
  );
  if (!res.ok) {
    throw new Error(`Supabase GET failed with status ${res.status}`);
  }
  const rows = await res.json();
  if (Array.isArray(rows) && rows.length > 0 && rows[0]?.payload) {
    return rows[0].payload;
  }
  return null;
}

async function writeToSupabase(cfg, data) {
  const res = await fetch(`${cfg.url}/rest/v1/${SUPABASE_TABLE}`, {
    method: 'POST',
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      id: SUPABASE_ROW_ID,
      payload: data,
      updated_at: new Date().toISOString()
    })
  });
  return res.ok;
}

function getLocalPaths() {
  const baseDir = isVercelRuntime() ? '/tmp/siops-data' : path.join(process.cwd(), 'data');
  return {
    dataDir: baseDir,
    dbFile: path.join(baseDir, 'db.json'),
    backupFile: path.join(baseDir, 'db.backup.json'),
    tmpFile: path.join(baseDir, 'db.json.tmp')
  };
}

function readFromLocalDisk() {
  const { dbFile, backupFile } = getLocalPaths();
  let parsed = null;
  let recoveredFromBackup = false;

  if (fs.existsSync(dbFile)) {
    try {
      parsed = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
    } catch (err) {
      console.error('[Server DB] db.json gagal dibaca, mencoba backup:', err);
    }
  }

  if (!parsed && fs.existsSync(backupFile)) {
    try {
      parsed = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
      recoveredFromBackup = true;
    } catch (err) {
      console.error('[Server DB] db.backup.json gagal dibaca:', err);
    }
  }

  if (!parsed && globalThis.__siopsMemDb) {
    parsed = globalThis.__siopsMemDb;
  }

  return { parsed, recoveredFromBackup };
}

function writeToLocalDisk(data) {
  globalThis.__siopsMemDb = data;
  try {
    const { dataDir, dbFile, backupFile, tmpFile } = getLocalPaths();
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const serialized = JSON.stringify(data, null, 2);
    JSON.parse(serialized);

    if (fs.existsSync(dbFile)) {
      try {
        const existingRaw = fs.readFileSync(dbFile, 'utf-8');
        JSON.parse(existingRaw);
        fs.writeFileSync(backupFile, existingRaw, 'utf-8');
      } catch {
        // Ignore corrupt primary
      }
    }

    fs.writeFileSync(tmpFile, serialized, 'utf-8');
    fs.renameSync(tmpFile, dbFile);
    return true;
  } catch (err) {
    console.error('[Server DB] Error writing local db.json:', err);
    return false;
  }
}

export async function readDb() {
  const upstash = getUpstashConfig();
  if (upstash) {
    try {
      let parsed = await readFromUpstash(upstash);
      if (!parsed || typeof parsed !== 'object') {
        parsed = createInitialDbData();
        await writeToUpstash(upstash, parsed);
        return parsed;
      }
      const { data, patched } = migrateAndNormalizeDb(parsed);
      if (patched) {
        await writeToUpstash(upstash, data);
      }
      return data;
    } catch (err) {
      console.error('[Upstash DB] Error reading, using fallback:', err);
    }
  }

  const supabase = getSupabaseConfig();
  if (supabase) {
    try {
      let parsed = await readFromSupabase(supabase);
      if (!parsed || typeof parsed !== 'object') {
        parsed = createInitialDbData();
        await writeToSupabase(supabase, parsed);
        return parsed;
      }
      const { data, patched } = migrateAndNormalizeDb(parsed);
      if (patched) {
        await writeToSupabase(supabase, data);
      }
      return data;
    } catch (err) {
      console.error('[Supabase DB] Error reading, using fallback:', err);
    }
  }

  const { parsed: diskParsed, recoveredFromBackup } = readFromLocalDisk();
  if (!diskParsed || typeof diskParsed !== 'object') {
    const seeded = createInitialDbData();
    writeToLocalDisk(seeded);
    return seeded;
  }

  const { data, patched } = migrateAndNormalizeDb(diskParsed);
  if (patched || recoveredFromBackup) {
    writeToLocalDisk(data);
  }
  return data;
}

export async function writeDb(data) {
  data.lastUpdated = new Date().toISOString();
  const upstash = getUpstashConfig();
  if (upstash) {
    try {
      const ok = await writeToUpstash(upstash, data);
      if (ok) return true;
    } catch (err) {
      console.error('[Upstash DB] Error writing:', err);
    }
  }

  const supabase = getSupabaseConfig();
  if (supabase) {
    try {
      const ok = await writeToSupabase(supabase, data);
      if (ok) return true;
    } catch (err) {
      console.error('[Supabase DB] Error writing:', err);
    }
  }

  return writeToLocalDisk(data);
}

// =====================================================================
// GOVERNANCE HELPERS: AUDIT TRAIL, BACKUPS, SOFT DELETE, MIGRATION
// =====================================================================

export function appendAuditLog(db, { actor, actorRole, action, targetDatabase, targetId = '-', status = 'SUCCESS', detail = '' }) {
  if (!Array.isArray(db.auditLogs)) {
    db.auditLogs = [];
  }
  db.auditLogs.unshift({
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    actor: String(actor || 'anonim').slice(0, 80),
    actorRole: String(actorRole || 'PUBLIC').slice(0, 30),
    action: String(action || 'UNKNOWN').slice(0, 60),
    targetDatabase: String(targetDatabase || '-').slice(0, 60),
    targetId: String(targetId || '-').slice(0, 80),
    status,
    detail: String(detail || '').slice(0, 500)
  });
  db.auditLogs = db.auditLogs.slice(0, 400);
}

export function createBackupSnapshot(db, { type = 'MANUAL', label = '', actor = 'ADMIN' }) {
  const { backups: _ignoredBackups, serverSecurityPepper: _ignoredPepper, ...exportableState } = db;
  const serialized = JSON.stringify(exportableState);
  const checksum = crypto.createHash('sha256').update(serialized).digest('hex').slice(0, 16);
  const metrics = computeDatabaseMetrics(db);

  const snapshotRecord = {
    id: `bkp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: label || `Cadangan ${type === 'SCHEDULED' ? 'Berkala Otomatis' : 'Manual'} (${new Date().toLocaleDateString('id-ID')})`,
    type,
    createdAt: new Date().toISOString(),
    createdBy: actor,
    sizeBytes: Buffer.byteLength(serialized, 'utf8'),
    totalRecords: metrics.totalRecords,
    checksum,
    snapshot: JSON.parse(serialized)
  };

  if (!Array.isArray(db.backups)) db.backups = [];
  db.backups.unshift(snapshotRecord);
  db.backups = db.backups.slice(0, 8);
  db.backupSchedule = {
    ...(db.backupSchedule || { enabled: true, intervalHours: 24 }),
    lastBackupAt: snapshotRecord.createdAt
  };
  return snapshotRecord;
}

export function maybeRunScheduledBackup(db) {
  const schedule = db.backupSchedule || { enabled: true, intervalHours: 24, lastBackupAt: '' };
  if (!schedule.enabled) return false;
  const intervalMs = Math.max(1, Number(schedule.intervalHours) || 24) * 60 * 60 * 1000;
  const lastMs = parseTimestamp(schedule.lastBackupAt);
  if (!lastMs || Date.now() - lastMs >= intervalMs) {
    createBackupSnapshot(db, {
      type: 'SCHEDULED',
      label: `Pencadangan Terjadwal Otomatis (Setiap ${schedule.intervalHours || 24} Jam)`,
      actor: 'SISTEM_TERJADWAL'
    });
    appendAuditLog(db, {
      actor: 'SISTEM_TERJADWAL',
      actorRole: 'SYSTEM',
      action: 'SCHEDULED_BACKUP',
      targetDatabase: 'all',
      status: 'SUCCESS',
      detail: 'Pencadangan berkala otomatis berhasil dibuat.'
    });
    return true;
  }
  return false;
}

export function softDeleteRecord(db, { collection, id, actor = 'ADMIN', actorRole = 'ADMIN', reason = 'Dihapus Admin' }) {
  const customDb = (db.databaseRegistry || []).find(d => d.code === collection && !d.isBuiltin);
  const list = customDb
    ? db.customDatabaseRecords?.[collection]
    : db[collection];

  if (!Array.isArray(list)) {
    return { ok: false, status: 404, error: `Koleksi "${collection}" tidak ditemukan.` };
  }
  const idx = list.findIndex(item => item && item.id === id);
  if (idx === -1) {
    return { ok: false, status: 404, error: `Data dengan ID "${id}" tidak ditemukan di ${collection}.` };
  }

  const removedItem = list[idx];
  const filtered = list.filter((_, i) => i !== idx);
  if (customDb) {
    db.customDatabaseRecords[collection] = filtered;
  } else {
    db[collection] = filtered;
  }

  if (collection === 'accessUsers') {
    const delSet = new Set(Array.isArray(db.deletedAccessUserIds) ? db.deletedAccessUserIds : []);
    delSet.add(id);
    db.deletedAccessUserIds = Array.from(delSet).slice(-1000);
  }

  if (!Array.isArray(db.softDeletedItems)) db.softDeletedItems = [];
  const trashEntry = {
    trashId: `trsh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sourceCollection: collection,
    isCustomDb: Boolean(customDb),
    originalId: id,
    itemTitle:
      removedItem.title ||
      removedItem.namaBarang ||
      removedItem.judul ||
      removedItem.namaLengkap ||
      removedItem.nama ||
      removedItem.templateTitle ||
      removedItem.name ||
      id,
    itemSnapshot: removedItem,
    deletedAt: new Date().toISOString(),
    deletedBy: actor,
    reason
  };
  db.softDeletedItems.unshift(trashEntry);
  db.softDeletedItems = db.softDeletedItems.slice(0, 300);

  appendAuditLog(db, {
    actor,
    actorRole: actorRole || 'ADMIN',
    action: 'SOFT_DELETE',
    targetDatabase: collection,
    targetId: id,
    status: 'SUCCESS',
    detail: `Memindahkan "${trashEntry.itemTitle}" ke Arsip Sementara (Soft Delete).`
  });

  return { ok: true, trashEntry };
}

export function restoreSoftDeletedRecord(db, { trashId, actor = 'ADMIN' }) {
  const trashList = Array.isArray(db.softDeletedItems) ? db.softDeletedItems : [];
  const idx = trashList.findIndex(t => t.trashId === trashId);
  if (idx === -1) {
    return { ok: false, status: 404, error: 'Item arsip sementara tidak ditemukan.' };
  }

  const entry = trashList[idx];

  // Restoring a soft-deleted custom database definition
  if (entry.sourceCollection === '__CUSTOM_DATABASE__') {
    const dbDef = entry.itemSnapshot?.definition;
    const dbRows = Array.isArray(entry.itemSnapshot?.records) ? entry.itemSnapshot.records : [];
    if (!dbDef || !dbDef.code) {
      return { ok: false, status: 400, error: 'Struktur database arsip tidak valid.' };
    }
    if ((db.databaseRegistry || []).some(d => d.code === dbDef.code)) {
      return { ok: false, status: 409, error: `Kode database "${dbDef.code}" sudah aktif kembali.` };
    }
    db.databaseRegistry.push({ ...dbDef, status: 'ACTIVE', updatedAt: new Date().toISOString() });
    db.customDatabaseRecords[dbDef.code] = dbRows;
    db.softDeletedItems = trashList.filter(t => t.trashId !== trashId);
    appendAuditLog(db, {
      actor,
      actorRole: 'ADMIN',
      action: 'RESTORE_DATABASE',
      targetDatabase: dbDef.code,
      targetId: trashId,
      status: 'SUCCESS',
      detail: `Database "${dbDef.name}" dipulihkan beserta ${dbRows.length} baris data.`
    });
    return { ok: true, restored: dbDef };
  }

  const targetCol = entry.sourceCollection;
  const capCheck = checkWriteCapacity(db, targetCol, getByteSize(entry.itemSnapshot));
  if (!capCheck.allowed) {
    return { ok: false, status: capCheck.status, error: capCheck.error };
  }

  const customDb = (db.databaseRegistry || []).find(d => d.code === targetCol && !d.isBuiltin);
  const targetArr = customDb
    ? (db.customDatabaseRecords[targetCol] = Array.isArray(db.customDatabaseRecords[targetCol])
        ? db.customDatabaseRecords[targetCol]
        : [])
    : (db[targetCol] = Array.isArray(db[targetCol]) ? db[targetCol] : []);

  if (!targetArr.some(r => r && r.id === entry.originalId)) {
    targetArr.unshift(entry.itemSnapshot);
  }
  if (targetCol === 'accessUsers') {
    db.deletedAccessUserIds = (db.deletedAccessUserIds || []).filter(d => d !== entry.originalId);
  }
  if (
    entry.itemSnapshot?.ownerUserId &&
    db.userHiddenRecords?.[entry.itemSnapshot.ownerUserId]?.[targetCol]
  ) {
    db.userHiddenRecords[entry.itemSnapshot.ownerUserId][targetCol] =
      db.userHiddenRecords[entry.itemSnapshot.ownerUserId][targetCol].filter(
        hid => hid !== entry.originalId && hid !== entry.itemSnapshot.forkedFromId
      );
  }
  db.softDeletedItems = trashList.filter(t => t.trashId !== trashId);

  appendAuditLog(db, {
    actor,
    actorRole: 'ADMIN',
    action: 'RESTORE_SOFT_DELETE',
    targetDatabase: targetCol,
    targetId: entry.originalId,
    status: 'SUCCESS',
    detail: `Memulihkan "${entry.itemTitle}" ke ${targetCol}.`
  });

  return { ok: true, restored: entry.itemSnapshot };
}

export function purgeSoftDeletedRecord(db, { trashId, actor = 'ADMIN' }) {
  const trashList = Array.isArray(db.softDeletedItems) ? db.softDeletedItems : [];
  const entry = trashList.find(t => t.trashId === trashId);
  if (!entry) {
    return { ok: false, status: 404, error: 'Item tidak ditemukan di Arsip Sementara.' };
  }
  db.softDeletedItems = trashList.filter(t => t.trashId !== trashId);
  appendAuditLog(db, {
    actor,
    actorRole: 'ADMIN',
    action: 'PURGE_PERMANENT',
    targetDatabase: entry.sourceCollection,
    targetId: entry.originalId,
    status: 'SUCCESS',
    detail: `Penghapusan permanen "${entry.itemTitle}" dari Arsip Sementara.`
  });
  return { ok: true, purgedId: trashId };
}

export function runDataMigration(
  db,
  { sourceName, targetCollection, records, duplicateStrategy = 'SKIP', columnMapping = {}, actor = 'ADMIN' }
) {
  if (!Array.isArray(records) || records.length === 0) {
    return { ok: false, status: 400, error: 'Data sumber migrasi kosong atau bukan array valid.' };
  }
  const customDb = (db.databaseRegistry || []).find(d => d.code === targetCollection && !d.isBuiltin);
  if (!VALID_COLLECTIONS.includes(targetCollection) && !customDb) {
    return { ok: false, status: 400, error: `Target database "${targetCollection}" tidak terdaftar.` };
  }

  // Automatic pre-migration safety snapshot for instant rollback
  const preSnap = createBackupSnapshot(db, {
    type: 'PRE_MIGRATION',
    label: `Pra-Migrasi "${sourceName || targetCollection}"`,
    actor
  });

  const targetArr = customDb
    ? [...(Array.isArray(db.customDatabaseRecords[targetCollection]) ? db.customDatabaseRecords[targetCollection] : [])]
    : [...(Array.isArray(db[targetCollection]) ? db[targetCollection] : [])];

  let migratedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const errors = [];
  const migratedIds = [];

  for (let i = 0; i < records.length; i++) {
    const raw = records[i];
    if (!raw || typeof raw !== 'object') {
      failedCount++;
      errors.push(`Baris ${i + 1}: Format bukan objek.`);
      continue;
    }

    // Apply column mapping from old source schema -> target Admin schema
    const mapped = { ...raw };
    if (columnMapping && typeof columnMapping === 'object') {
      for (const [oldCol, newCol] of Object.entries(columnMapping)) {
        if (oldCol && newCol && raw[oldCol] !== undefined && mapped[newCol] === undefined) {
          mapped[newCol] = raw[oldCol];
        }
      }
    }

    const validation = validateRecordForCollection(targetCollection, mapped, customDb || null);
    if (!validation.valid) {
      failedCount++;
      errors.push(`Baris ${i + 1}: ${validation.error}`);
      continue;
    }

    const cleanRecord = validation.record;
    const dupIdx = findDuplicateRecordIndex(targetArr, cleanRecord, targetCollection);
    if (dupIdx !== -1) {
      if (duplicateStrategy === 'SKIP') {
        skippedCount++;
        continue;
      } else if (duplicateStrategy === 'OVERWRITE') {
        targetArr[dupIdx] = { ...targetArr[dupIdx], ...cleanRecord };
        migratedCount++;
        migratedIds.push(targetArr[dupIdx].id);
        continue;
      } else if (duplicateStrategy === 'RENAME_ID') {
        cleanRecord.id = `${cleanRecord.id}-mig-${Date.now().toString().slice(-4)}-${i}`;
      }
    }

    const capCheck = checkWriteCapacity(
      {
        ...db,
        ...(customDb
          ? { customDatabaseRecords: { ...db.customDatabaseRecords, [targetCollection]: targetArr } }
          : { [targetCollection]: targetArr })
      },
      targetCollection,
      getByteSize(cleanRecord)
    );
    if (!capCheck.allowed) {
      failedCount++;
      errors.push(`Baris ${i + 1}: ${capCheck.error}`);
      break;
    }

    targetArr.unshift(cleanRecord);
    migratedCount++;
    migratedIds.push(cleanRecord.id);
  }

  if (customDb) {
    db.customDatabaseRecords[targetCollection] = targetArr;
  } else {
    db[targetCollection] = targetArr;
  }

  const report = {
    id: `mig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sourceName: String(sourceName || 'Sumber Data Layanan Lama').slice(0, 120),
    targetCollection,
    duplicateStrategy,
    totalInput: records.length,
    migratedCount,
    skippedCount,
    failedCount,
    errors: errors.slice(0, 25),
    migratedIds: migratedIds.slice(0, 200),
    preMigrationSnapshotId: preSnap.id,
    rolledBack: false,
    executedAt: new Date().toISOString(),
    executedBy: actor
  };

  if (!Array.isArray(db.migrationLogs)) db.migrationLogs = [];
  db.migrationLogs.unshift(report);
  db.migrationLogs = db.migrationLogs.slice(0, 50);

  appendAuditLog(db, {
    actor,
    actorRole: 'ADMIN',
    action: 'DATA_MIGRATION',
    targetDatabase: targetCollection,
    targetId: report.id,
    status: failedCount > 0 && migratedCount === 0 ? 'FAILED' : 'SUCCESS',
    detail: `Migrasi "${report.sourceName}": ${migratedCount} berhasil, ${skippedCount} duplikat dilewati, ${failedCount} gagal.`
  });

  return { ok: true, report };
}

export function rollbackMigration(db, { migrationId, actor = 'ADMIN' }) {
  const logs = Array.isArray(db.migrationLogs) ? db.migrationLogs : [];
  const log = logs.find(m => m.id === migrationId);
  if (!log) {
    return { ok: false, status: 404, error: 'Riwayat migrasi tidak ditemukan.' };
  }
  if (log.rolledBack) {
    return { ok: false, status: 409, error: 'Migrasi ini sudah pernah di-rollback sebelumnya.' };
  }
  const snap = (db.backups || []).find(b => b.id === log.preMigrationSnapshotId);
  if (!snap || !snap.snapshot) {
    return {
      ok: false,
      status: 404,
      error: 'Snapshot pra-migrasi sudah tidak tersedia di riwayat cadangan.'
    };
  }

  // Restore target collection & custom database state cleanly from pre-migration snapshot
  const preservedBackups = db.backups;
  const preservedAdminAccount = db.adminAccount;
  const preservedAdminHash = db.adminCredentialHash;
  const preservedPepper = db.serverSecurityPepper;
  const restoredBody = snap.snapshot;

  Object.assign(db, restoredBody, {
    backups: preservedBackups,
    adminAccount: preservedAdminAccount,
    adminCredentialHash: preservedAdminHash,
    serverSecurityPepper: preservedPepper,
    migrationLogs: logs.map(m =>
      m.id === migrationId ? { ...m, rolledBack: true, rolledBackAt: new Date().toISOString() } : m
    )
  });

  appendAuditLog(db, {
    actor,
    actorRole: 'ADMIN',
    action: 'MIGRATION_ROLLBACK',
    targetDatabase: log.targetCollection,
    targetId: migrationId,
    status: 'SUCCESS',
    detail: `Rollback migrasi "${log.sourceName}" berhasil memulihkan state pra-migrasi.`
  });

  return { ok: true, migrationId };
}

// =====================================================================
// CLIENT RESPONSE SANITIZATION (STRICT ZERO-LEAK RBAC PROJECTION)
// =====================================================================

export function sanitizeSchoolConfigForPublic(cfg) {
  if (!cfg || typeof cfg !== 'object') return null;
  return {
    pemerintahDaerah: cfg.pemerintahDaerah,
    dinasPendidikan: cfg.dinasPendidikan,
    namaSekolah: cfg.namaSekolah,
    npsn: cfg.npsn,
    kabupatenKota: cfg.kabupatenKota,
    provinsi: cfg.provinsi,
    logoKabupatenUrl: cfg.logoKabupatenUrl,
    logoSekolahUrl: cfg.logoSekolahUrl,
    logoAplikasiUrl: cfg.logoAplikasiUrl
  };
}

export function resolveApprovedSchoolHeader(db, user) {
  if (!user || user.status !== 'APPROVED') return null;
  const baseCfg = db?.schoolConfig && typeof db.schoolConfig === 'object' ? db.schoolConfig : {};
  const userIdKey = typeof user.id === 'string' ? user.id.trim() : '';
  const altKey = user.username ? `user:${String(user.username).trim().toLowerCase()}` : '';
  const customKop =
    (userIdKey && baseCfg.userLetterheads?.[userIdKey]) ||
    (altKey && baseCfg.userLetterheads?.[altKey]) ||
    null;

  if (customKop && !customKop.deleted) {
    return {
      pemerintahDaerah: customKop.pemerintahDaerah ?? '',
      dinasPendidikan: customKop.dinasPendidikan ?? '',
      namaSekolah: customKop.namaSekolah || user.schoolIdentity?.namaSekolah || '',
      npsn: customKop.npsn ?? user.schoolIdentity?.npsn ?? '',
      kabupatenKota: customKop.kabupatenKota ?? user.schoolIdentity?.kabupatenKota ?? '',
      provinsi: customKop.provinsi || '',
      logoKabupatenUrl: customKop.logoKopKiri || customKop.logoKabupatenUrl || '',
      logoSekolahUrl: customKop.logoKopKanan || customKop.logoSekolahUrl || '',
      logoAplikasiUrl: customKop.logoAplikasiUrl || ''
    };
  }

  if (user.schoolIdentity && user.schoolIdentity.namaSekolah) {
    return {
      pemerintahDaerah: user.schoolIdentity.pemerintahDaerah || '',
      dinasPendidikan: user.schoolIdentity.dinasPendidikan || '',
      namaSekolah: user.schoolIdentity.namaSekolah,
      npsn: user.schoolIdentity.npsn || '',
      kabupatenKota: user.schoolIdentity.kabupatenKota || '',
      provinsi: '',
      logoKabupatenUrl: '',
      logoSekolahUrl: '',
      logoAplikasiUrl: ''
    };
  }

  return sanitizeSchoolConfigForPublic(baseCfg);
}

const VALID_BG_MODES = new Set(['default', 'preset', 'image', 'color']);
const SAFE_DATA_IMAGE_REGEX = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i;
const SAFE_HTTP_IMAGE_REGEX = /^https?:\/\/[^\s<>'"]{4,1200}$/i;
const SAFE_HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export function isValidBackgroundImageUrl(url) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 1_650_000) return false;
  return SAFE_DATA_IMAGE_REGEX.test(trimmed) || SAFE_HTTP_IMAGE_REGEX.test(trimmed);
}

export function validateBackgroundConfigInput(raw, { actorName = 'USER', defaultOpacity = 0.55 } = {}) {
  if (raw === null || raw === undefined) {
    return { valid: true, config: null };
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, error: 'Format konfigurasi background tidak valid.' };
  }
  const mode = VALID_BG_MODES.has(raw.mode) ? raw.mode : 'default';
  const presetId = typeof raw.presetId === 'string'
    ? raw.presetId.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60)
    : 'default';

  let imageUrl = '';
  if (typeof raw.imageUrl === 'string' && raw.imageUrl.trim()) {
    const candidate = raw.imageUrl.trim();
    if (candidate.length > 1_650_000) {
      return { valid: false, error: 'Ukuran gambar terlalu besar (maksimal 1.5 MB setelah kompresi).' };
    }
    if (!isValidBackgroundImageUrl(candidate)) {
      return {
        valid: false,
        error: 'Format gambar harus PNG, JPG, WEBP, GIF, atau tautan https:// yang valid.'
      };
    }
    imageUrl = candidate;
  }

  if (mode === 'image' && !imageUrl) {
    return { valid: false, error: 'Silakan unggah foto atau masukkan URL gambar yang valid terlebih dahulu.' };
  }

  const customColor =
    typeof raw.customColor === 'string' && SAFE_HEX_COLOR_REGEX.test(raw.customColor.trim())
      ? raw.customColor.trim().toLowerCase()
      : '#0f172a';
  const customColorSecondary =
    typeof raw.customColorSecondary === 'string' && SAFE_HEX_COLOR_REGEX.test(raw.customColorSecondary.trim())
      ? raw.customColorSecondary.trim().toLowerCase()
      : '';

  const rawOpacity = Number(raw.overlayOpacity);
  const overlayOpacity = Number.isFinite(rawOpacity)
    ? Math.max(0, Math.min(0.92, Math.round(rawOpacity * 100) / 100))
    : defaultOpacity;

  const rawBlur = Number(raw.blurPx);
  const blurPx = Number.isFinite(rawBlur)
    ? Math.max(0, Math.min(16, Math.round(rawBlur)))
    : 0;

  return {
    valid: true,
    config: {
      mode,
      presetId: presetId || 'default',
      ...(imageUrl ? { imageUrl } : {}),
      customColor,
      ...(customColorSecondary ? { customColorSecondary } : {}),
      overlayOpacity,
      blurPx,
      updatedAt: new Date().toISOString(),
      updatedBy: String(actorName || 'USER').slice(0, 80)
    }
  };
}

export function buildPublicStateResponse(db) {
  const metrics = computeDatabaseMetrics(db);
  const approvedRoleCounts = { TU: 0, PENJAGA: 0, SERVICE: 0, PERPUS: 0, LAB_IPA: 0 };
  for (const u of db.accessUsers || []) {
    if (u && u.status === 'APPROVED' && approvedRoleCounts[u.role] !== undefined) {
      approvedRoleCounts[u.role] += 1;
    }
  }
  return {
    publicOnly: true,
    siteSettings: db.siteSettings,
    // Do NOT expose Batang Hari / specific school identity on public unauthenticated opening screen
    schoolConfig: null,
    accessRules: db.accessRules,
    approvedRoleCounts,
    databaseCapacitySummary: {
      totalUsedBytes: metrics.totalUsedBytes,
      totalQuotaBytes: metrics.totalQuotaBytes,
      totalPercentUsed: metrics.totalPercentUsed,
      effectiveAlertLevel: metrics.effectiveAlertLevel
    },
    lastUpdated: db.lastUpdated
  };
}

export function buildStaffStateResponse(db, staffSession) {
  const metrics = computeDatabaseMetrics(db);
  const approvedRoleCounts = { TU: 0, PENJAGA: 0, SERVICE: 0, PERPUS: 0, LAB_IPA: 0 };
  for (const u of db.accessUsers || []) {
    if (u && u.status === 'APPROVED' && approvedRoleCounts[u.role] !== undefined) {
      approvedRoleCounts[u.role] += 1;
    }
  }

  const staffSub = typeof staffSession?.sub === 'string' ? staffSession.sub.trim() : '';
  const staffUsername = typeof staffSession?.username === 'string' ? staffSession.username.trim().toLowerCase() : '';
  const altStaffKey = staffUsername ? `user:${staffUsername}` : '';
  const primaryStaffKey = staffSub || altStaffKey;

  const isOwnedByCaller = (item) => {
    if (!item || typeof item !== 'object') return false;
    if (item.ownerUserId) {
      return (Boolean(staffSub) && item.ownerUserId === staffSub) || (Boolean(altStaffKey) && item.ownerUserId === altStaffKey);
    }
    if (item.ownerUsername) {
      return Boolean(staffUsername) && String(item.ownerUsername).trim().toLowerCase() === staffUsername;
    }
    return false;
  };

  const getHiddenIdsForCollection = (collectionName) => {
    const hiddenSet = new Set();
    const rawMap = db.userHiddenRecords && typeof db.userHiddenRecords === 'object' ? db.userHiddenRecords : {};
    const keysToCheck = [staffSub, altStaffKey].filter(Boolean);
    for (const k of keysToCheck) {
      const colArr = rawMap?.[k]?.[collectionName];
      if (Array.isArray(colArr)) {
        for (const hiddenId of colArr) {
          if (typeof hiddenId === 'string' && hiddenId) {
            hiddenSet.add(hiddenId);
          }
        }
      }
    }
    return hiddenSet;
  };

  const scopeCollectionForUser = (list, collectionName) => {
    if (!Array.isArray(list)) return [];
    const callerForkedBaseIds = new Set();
    for (const item of list) {
      if (item && item.forkedFromId && isOwnedByCaller(item)) {
        callerForkedBaseIds.add(item.forkedFromId);
      }
    }
    const hiddenIds = getHiddenIdsForCollection(collectionName);
    return list.filter(item => {
      if (!item || typeof item !== 'object' || item.deleted === true) return false;
      if (item.ownerUserId || item.ownerUsername) {
        return isOwnedByCaller(item) && !hiddenIds.has(item.id);
      }
      // Shared/base seed record: hide if caller forked it or explicitly hid/deleted it
      return !callerForkedBaseIds.has(item.id) && !hiddenIds.has(item.id);
    });
  };

  // Scope SchoolConfig userLetterheads & userSignatures strictly to this caller
  let scopedSchoolConfig = db.schoolConfig || null;
  if (scopedSchoolConfig && typeof scopedSchoolConfig === 'object') {
    const rawKopMap = scopedSchoolConfig.userLetterheads || {};
    const rawSigMap = scopedSchoolConfig.userSignatures || {};
    const ownKop = (staffSub && rawKopMap[staffSub]) || (altStaffKey && rawKopMap[altStaffKey]) || null;
    const ownSig = (staffSub && rawSigMap[staffSub]) || (altStaffKey && rawSigMap[altStaffKey]) || null;
    scopedSchoolConfig = {
      ...scopedSchoolConfig,
      userLetterheads: ownKop && primaryStaffKey ? { [primaryStaffKey]: ownKop } : {},
      userSignatures: ownSig && primaryStaffKey ? { [primaryStaffKey]: ownSig } : {}
    };
  }

  // Merge user's personal Tupoksi customizations over base Tupoksi
  const userTupoksiOverlay =
    (staffSub && db.userTupoksiDefinitions?.[staffSub]) ||
    (altStaffKey && db.userTupoksiDefinitions?.[altStaffKey]) ||
    null;
  let effectiveTupoksi = db.tupoksiDefinitions || null;
  if (userTupoksiOverlay && typeof userTupoksiOverlay === 'object') {
    const base = db.tupoksiDefinitions && typeof db.tupoksiDefinitions === 'object' ? db.tupoksiDefinitions : {};
    const mergedTupoksi = { ...base };
    for (const roleKey of VALID_ROLES) {
      if (userTupoksiOverlay[roleKey] && typeof userTupoksiOverlay[roleKey] === 'object') {
        mergedTupoksi[roleKey] = userTupoksiOverlay[roleKey];
      }
    }
    effectiveTupoksi = mergedTupoksi;
  }

  // Resolve user's personal LibraryMemberStats if saved, else base
  const userMemberStats =
    (staffSub && db.userLibraryMemberStats?.[staffSub]) ||
    (altStaffKey && db.userLibraryMemberStats?.[altStaffKey]) ||
    db.libraryMemberStats ||
    null;

  // Scope userServiceBackgrounds strictly to this caller
  const rawBgMap = db.userServiceBackgrounds && typeof db.userServiceBackgrounds === 'object'
    ? db.userServiceBackgrounds
    : {};
  const scopedUserBackgrounds = {};
  for (const [k, v] of Object.entries(rawBgMap)) {
    if (!v || typeof v !== 'object') continue;
    const matchesSub = Boolean(staffSub) && (k === staffSub || k.startsWith(`${staffSub}:`));
    const matchesAlt = Boolean(altStaffKey) && (k === altStaffKey || k.startsWith(`${altStaffKey}:`));
    if (matchesSub || matchesAlt) {
      scopedUserBackgrounds[k] = v;
    }
  }

  return {
    publicOnly: false,
    tasks: scopeCollectionForUser(db.tasks, 'tasks'),
    inventories: scopeCollectionForUser(db.inventories, 'inventories'),
    monthlyReports: scopeCollectionForUser(db.monthlyReports, 'monthlyReports'),
    annualReports: scopeCollectionForUser(db.annualReports, 'annualReports'),
    schoolConfig: scopedSchoolConfig,
    archives: scopeCollectionForUser(db.archives, 'archives'),
    tupoksiDefinitions: effectiveTupoksi,
    customCategories: scopeCollectionForUser(db.customCategories, 'customCategories'),
    libraryBooks: scopeCollectionForUser(db.libraryBooks, 'libraryBooks'),
    libraryMembers: scopeCollectionForUser(db.libraryMembers, 'libraryMembers'),
    libraryMemberStats: userMemberStats,
    userServiceBackgrounds: scopedUserBackgrounds,
    beritaAcaraHistory: scopeCollectionForUser(db.beritaAcaraHistory, 'beritaAcaraHistory'),
    customDatabases: (db.databaseRegistry || []).filter(d => !d.isBuiltin),
    customDatabaseRecords: db.customDatabaseRecords || {},
    staffSubmissions: (db.staffSubmissions || []).filter(
      s => s.submittedBy === staffSession.username || s.role === staffSession.role
    ),
    accessUsers: (db.accessUsers || []).map(u =>
      sanitizeAccessUserForClient(u, {
        isAdmin: false,
        includeTempResetCode: u.id === staffSession.sub
      })
    ),
    accessRules: db.accessRules,
    siteSettings: db.siteSettings,
    approvedRoleCounts,
    databaseCapacitySummary: {
      totalUsedBytes: metrics.totalUsedBytes,
      totalQuotaBytes: metrics.totalQuotaBytes,
      totalPercentUsed: metrics.totalPercentUsed,
      effectiveAlertLevel: metrics.effectiveAlertLevel
    },
    lastUpdated: db.lastUpdated
  };
}

export function buildAdminStateResponse(db) {
  const metrics = computeDatabaseMetrics(db);
  const backupsMeta = (db.backups || []).map(({ snapshot: _s, ...meta }) => meta);

  return {
    publicOnly: false,
    isAdminView: true,
    tasks: db.tasks || [],
    inventories: db.inventories || [],
    monthlyReports: db.monthlyReports || [],
    annualReports: db.annualReports || [],
    schoolConfig: db.schoolConfig || null,
    archives: db.archives || [],
    tupoksiDefinitions: db.tupoksiDefinitions || null,
    userTupoksiDefinitions: db.userTupoksiDefinitions || {},
    customCategories: db.customCategories || [],
    libraryBooks: db.libraryBooks || [],
    libraryMembers: db.libraryMembers || [],
    libraryMemberStats: db.libraryMemberStats || null,
    userLibraryMemberStats: db.userLibraryMemberStats || {},
    userServiceBackgrounds: db.userServiceBackgrounds || {},
    beritaAcaraHistory: db.beritaAcaraHistory || [],
    customDatabases: (db.databaseRegistry || []).filter(d => !d.isBuiltin),
    customDatabaseRecords: db.customDatabaseRecords || {},
    databaseRegistry: db.databaseRegistry || [],
    databaseQuotaBytes: db.databaseQuotaBytes || DEFAULT_DATABASE_QUOTA_BYTES,
    databaseMetrics: metrics,
    siteSettings: db.siteSettings,
    softDeletedItems: db.softDeletedItems || [],
    backups: backupsMeta,
    backupSchedule: db.backupSchedule || { enabled: true, intervalHours: 24, lastBackupAt: '' },
    auditLogs: db.auditLogs || [],
    staffSubmissions: db.staffSubmissions || [],
    migrationLogs: db.migrationLogs || [],
    accessUsers: (db.accessUsers || []).map(u =>
      sanitizeAccessUserForClient(u, { isAdmin: true })
    ),
    deletedAccessUserIds: db.deletedAccessUserIds || [],
    accessRules: db.accessRules,
    adminProfile: sanitizeAdminProfile(db.adminAccount),
    lastUpdated: db.lastUpdated
  };
}

export async function applyStateUpdate(body, actor = 'ADMIN') {
  const {
    tasks,
    inventories,
    monthlyReports,
    annualReports,
    schoolConfig,
    archives,
    tupoksiDefinitions,
    userTupoksiDefinitions,
    customCategories,
    libraryBooks,
    libraryMembers,
    libraryMemberStats,
    userLibraryMemberStats,
    beritaAcaraHistory,
    accessRules,
    siteSettings,
    clientHydratedFromServer
  } = body || {};

  const current = (await readDb()) || {};
  const canReplaceOperational = clientHydratedFromServer === true || !current.lastUpdated;

  const pickCollection = (incoming, existing) => {
    if (incoming === undefined) return existing;
    if (canReplaceOperational) return incoming;
    if (Array.isArray(existing) && existing.length > 0) return existing;
    return incoming;
  };

  const mergedAccessRules =
    accessRules && typeof accessRules === 'object' && (canReplaceOperational || !current.accessRules)
      ? { ...DEFAULT_ACCESS_RULES, ...current.accessRules, ...accessRules }
      : { ...DEFAULT_ACCESS_RULES, ...(current.accessRules || {}) };

  const mergePerUserIsolationMap = (existingMap, incomingMap) => {
    const merged = { ...(existingMap && typeof existingMap === 'object' ? existingMap : {}) };
    if (!incomingMap || typeof incomingMap !== 'object') return merged;
    for (const [key, inc] of Object.entries(incomingMap)) {
      if (!inc || typeof inc !== 'object') continue;
      const prev = merged[key];
      if (!prev) {
        merged[key] = inc;
        continue;
      }
      const prevTs = parseTimestamp(prev.updatedAt);
      const incTs = parseTimestamp(inc.updatedAt);
      if (incTs >= prevTs) {
        merged[key] = inc;
      }
    }
    return merged;
  };

  const mergeSchoolConfig = (existingCfg, incomingCfg) => {
    if (incomingCfg === undefined) return existingCfg;
    if (!existingCfg) return incomingCfg;

    const mergedLetterheads = mergePerUserIsolationMap(
      existingCfg.userLetterheads,
      incomingCfg.userLetterheads
    );
    const mergedSignatures = mergePerUserIsolationMap(
      existingCfg.userSignatures,
      incomingCfg.userSignatures
    );

    if (canReplaceOperational) {
      return {
        ...existingCfg,
        ...incomingCfg,
        userLetterheads: mergedLetterheads,
        userSignatures: mergedSignatures
      };
    }

    return {
      ...existingCfg,
      userLetterheads: mergedLetterheads,
      userSignatures: mergedSignatures
    };
  };

  const updated = {
    ...current,
    tasks: pickCollection(tasks, current.tasks),
    inventories: pickCollection(inventories, current.inventories),
    monthlyReports: pickCollection(monthlyReports, current.monthlyReports),
    annualReports: pickCollection(annualReports, current.annualReports),
    schoolConfig: mergeSchoolConfig(current.schoolConfig, schoolConfig),
    archives: pickCollection(archives, current.archives),
    tupoksiDefinitions:
      tupoksiDefinitions !== undefined && (canReplaceOperational || !current.tupoksiDefinitions)
        ? tupoksiDefinitions
        : current.tupoksiDefinitions,
    userTupoksiDefinitions: mergePerUserIsolationMap(current.userTupoksiDefinitions, userTupoksiDefinitions),
    customCategories: pickCollection(customCategories, current.customCategories),
    libraryBooks: pickCollection(libraryBooks, current.libraryBooks),
    libraryMembers: pickCollection(libraryMembers, current.libraryMembers),
    libraryMemberStats:
      libraryMemberStats !== undefined && (canReplaceOperational || !current.libraryMemberStats)
        ? libraryMemberStats
        : current.libraryMemberStats,
    userLibraryMemberStats: mergePerUserIsolationMap(current.userLibraryMemberStats, userLibraryMemberStats),
    userServiceBackgrounds: mergePerUserIsolationMap(
      current.userServiceBackgrounds,
      body?.userServiceBackgrounds
    ),
    beritaAcaraHistory: pickCollection(beritaAcaraHistory, current.beritaAcaraHistory),
    siteSettings:
      siteSettings && typeof siteSettings === 'object'
        ? { ...current.siteSettings, ...siteSettings, updatedAt: new Date().toISOString() }
        : current.siteSettings,
    accessRules: mergedAccessRules,
    lastUpdated: new Date().toISOString()
  };

  appendAuditLog(updated, {
    actor,
    actorRole: 'ADMIN',
    action: 'ADMIN_STATE_SYNC',
    targetDatabase: 'all',
    status: 'SUCCESS',
    detail: 'Sinkronisasi state Database Admin oleh Admin.'
  });

  const ok = await writeDb(updated);
  return ok ? { ok: true, updated } : { ok: false };
}

export async function deleteAccessUserFromDb(id, actor = 'ADMIN') {
  const current = (await readDb()) || {};
  const result = softDeleteRecord(current, {
    collection: 'accessUsers',
    id,
    actor,
    reason: 'Penghapusan akun melalui Panel Admin'
  });
  if (!result.ok) return result;
  const ok = await writeDb(current);
  return ok
    ? { ok: true, lastUpdated: current.lastUpdated, trashEntry: result.trashEntry }
    : { ok: false, status: 500, error: 'Gagal menyimpan penghapusan sementara pengguna.' };
}

export function verifyUserCredentials(user, plainPassword) {
  if (!user || !plainPassword) return false;
  if (user.passwordHash) {
    return verifySecret(plainPassword, user.passwordHash);
  }
  if (typeof user.password === 'string') {
    return user.password === plainPassword;
  }
  return false;
}
