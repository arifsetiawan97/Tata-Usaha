import fs from 'fs';
import path from 'path';

export const VALID_COLLECTIONS = [
  'tasks',
  'inventories',
  'monthlyReports',
  'annualReports',
  'archives',
  'customCategories',
  'libraryBooks',
  'libraryMembers'
];

export const DEFAULT_ACCESS_RULES = {
  requireAdminApproval: true,
  enforceUniquePassword: true,
  enforceSingleServicePerUser: true
};

export const DEFAULT_ADMIN_PASSWORD = 'admin123';

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
    if (!entry.changedAt || !entry.newPassword) continue;
    const key = `${entry.changedAt}::${entry.source || 'USER_CHANGE'}::${entry.newPassword}`;
    if (!map.has(key)) {
      map.set(key, {
        changedAt: entry.changedAt,
        source: entry.source || 'USER_CHANGE',
        newPassword: String(entry.newPassword)
      });
    }
  }
  return Array.from(map.values()).sort(
    (x, y) => parseTimestamp(y.changedAt) - parseTimestamp(x.changedAt)
  );
}

function normalizeRegisteredUser(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const username = typeof raw.username === 'string' ? raw.username.trim() : '';
  const password = typeof raw.password === 'string' ? raw.password.trim() : '';
  if (!username || !password) return null;

  const role = VALID_ROLES.includes(raw.role) ? raw.role : 'TU';
  const status = VALID_STATUSES.includes(raw.status) ? raw.status : 'PENDING';
  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim()
      : `usr-${username.toLowerCase()}-${role.toLowerCase()}`;

  return {
    id,
    namaLengkap:
      typeof raw.namaLengkap === 'string' && raw.namaLengkap.trim()
        ? raw.namaLengkap.trim()
        : username,
    username,
    role,
    password,
    status,
    createdAt:
      typeof raw.createdAt === 'string' && raw.createdAt
        ? raw.createdAt
        : new Date(0).toISOString(),
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
  deletedIds = []
) {
  const deletedSet = new Set(Array.isArray(deletedIds) ? deletedIds.filter(Boolean) : []);
  const byId = new Map();

  const ingest = (rawList) => {
    if (!Array.isArray(rawList)) return;
    for (const raw of rawList) {
      const norm = normalizeRegisteredUser(raw);
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
      label: 'Cloud Upstash Redis / Vercel KV (Satu Pintu)'
    };
  }
  if (getSupabaseConfig()) {
    return {
      storageMode: 'supabase',
      cloudPersistent: true,
      label: 'Cloud Supabase Database (Satu Pintu)'
    };
  }
  if (isVercelRuntime()) {
    return {
      storageMode: 'vercel-ephemeral',
      cloudPersistent: false,
      label: 'Vercel Sementara (Perlu Hubungkan Storage Upstash Redis)'
    };
  }
  return {
    storageMode: 'local-file',
    cloudPersistent: true,
    label: 'Server Database Aktif (Satu Pintu)'
  };
}

export function applyCorsHeaders(res) {
  if (!res || typeof res.setHeader !== 'function') return;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
}

function buildFallbackSeedData() {
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
    accessUsers: [],
    deletedAccessUserIds: [],
    accessRules: { ...DEFAULT_ACCESS_RULES },
    adminPassword: DEFAULT_ADMIN_PASSWORD,
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

  if (!Array.isArray(parsed.deletedAccessUserIds)) {
    parsed.deletedAccessUserIds = [];
    patched = true;
  }

  const rawUsers = Array.isArray(parsed.accessUsers) ? parsed.accessUsers : [];
  const normalizedUsers = mergeRegisteredUsers(rawUsers, [], parsed.deletedAccessUserIds);
  if (!Array.isArray(parsed.accessUsers) || normalizedUsers.length !== rawUsers.length) {
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

  if (typeof parsed.adminPassword !== 'string' || !parsed.adminPassword.trim()) {
    parsed.adminPassword = DEFAULT_ADMIN_PASSWORD;
    patched = true;
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

export async function applyStateUpdate(body) {
  const {
    tasks,
    inventories,
    monthlyReports,
    annualReports,
    schoolConfig,
    archives,
    tupoksiDefinitions,
    customCategories,
    libraryBooks,
    libraryMembers,
    libraryMemberStats,
    accessUsers,
    deletedAccessUserIds,
    accessRules,
    adminPassword,
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

  const mergedDeletedIds = Array.from(
    new Set([
      ...(Array.isArray(current.deletedAccessUserIds) ? current.deletedAccessUserIds : []),
      ...(Array.isArray(deletedAccessUserIds) ? deletedAccessUserIds : [])
    ])
  ).slice(-1000);

  const mergedAccessUsers = mergeRegisteredUsers(
    Array.isArray(current.accessUsers) ? current.accessUsers : [],
    Array.isArray(accessUsers) ? accessUsers : [],
    mergedDeletedIds
  );

  const mergedAccessRules =
    accessRules && typeof accessRules === 'object' && (canReplaceOperational || !current.accessRules)
      ? { ...DEFAULT_ACCESS_RULES, ...current.accessRules, ...accessRules }
      : { ...DEFAULT_ACCESS_RULES, ...(current.accessRules || {}) };

  const nextAdminPassword =
    typeof adminPassword === 'string' &&
    adminPassword.trim() &&
    (canReplaceOperational || !current.adminPassword)
      ? adminPassword.trim()
      : current.adminPassword || DEFAULT_ADMIN_PASSWORD;

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

    // Even when client has not hydrated base schoolConfig, preserve per-user isolated letterheads/signatures
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
    customCategories: pickCollection(customCategories, current.customCategories),
    libraryBooks: pickCollection(libraryBooks, current.libraryBooks),
    libraryMembers: pickCollection(libraryMembers, current.libraryMembers),
    libraryMemberStats:
      libraryMemberStats !== undefined && (canReplaceOperational || !current.libraryMemberStats)
        ? libraryMemberStats
        : current.libraryMemberStats,
    accessUsers: mergedAccessUsers,
    deletedAccessUserIds: mergedDeletedIds,
    accessRules: mergedAccessRules,
    adminPassword: nextAdminPassword,
    lastUpdated: new Date().toISOString()
  };

  const ok = await writeDb(updated);
  return ok ? { ok: true, updated } : { ok: false };
}

export async function deleteAccessUserFromDb(id) {
  const current = (await readDb()) || {};
  const deletedSet = new Set(
    Array.isArray(current.deletedAccessUserIds) ? current.deletedAccessUserIds : []
  );
  deletedSet.add(id);

  const mergedDeletedIds = Array.from(deletedSet).slice(-1000);
  const existingUsers = Array.isArray(current.accessUsers) ? current.accessUsers : [];
  const nextUsers = existingUsers.filter((u) => u && u.id !== id);

  const updated = {
    ...current,
    accessUsers: nextUsers,
    deletedAccessUserIds: mergedDeletedIds,
    lastUpdated: new Date().toISOString()
  };

  const ok = await writeDb(updated);
  return ok ? { ok: true, lastUpdated: updated.lastUpdated } : { ok: false };
}
