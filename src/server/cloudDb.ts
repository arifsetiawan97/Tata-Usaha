import fs from 'fs';
import path from 'path';
import {
  initialTasks,
  initialInventories,
  initialMonthlyReports,
  initialAnnualReports,
  initialArchives,
  initialSchoolConfig,
  initialCustomCategories,
  initialLibraryBooks,
  initialLibraryMembers,
  initialLibraryMemberStats
} from '../data/initialData';
import { OFFICIAL_TUPOKSI_DEFINITIONS } from '../utils/taskClassification';
import {
  DEFAULT_ACCESS_RULES,
  DEFAULT_ADMIN_PASSWORD,
  mergeRegisteredUsers
} from '../utils/accessSync';

export type StorageMode = 'upstash' | 'supabase' | 'local-file' | 'vercel-ephemeral';

export const VALID_COLLECTIONS = [
  'tasks',
  'inventories',
  'monthlyReports',
  'annualReports',
  'archives',
  'customCategories',
  'libraryBooks',
  'libraryMembers'
] as const;

const UPSTASH_KEY = 'siops:app_state:v1';
const SUPABASE_TABLE = 'siops_kv';
const SUPABASE_ROW_ID = 'main';

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

function isVercelRuntime(): boolean {
  return process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
}

export function getStorageInfo(): {
  storageMode: StorageMode;
  cloudPersistent: boolean;
  label: string;
} {
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

export function applyCorsHeaders(res: any) {
  if (!res || typeof res.setHeader !== 'function') return;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
}

export function createInitialDbData(): any {
  // Check if a bundled seed file exists in data/db.json
  const bundledDbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(bundledDbPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(bundledDbPath, 'utf-8'));
      if (raw && typeof raw === 'object') {
        return migrateAndNormalizeDb(raw).data;
      }
    } catch {
      // Fall through to code defaults
    }
  }

  return {
    tasks: initialTasks,
    inventories: initialInventories,
    monthlyReports: initialMonthlyReports,
    annualReports: initialAnnualReports,
    schoolConfig: initialSchoolConfig,
    archives: initialArchives,
    tupoksiDefinitions: OFFICIAL_TUPOKSI_DEFINITIONS,
    customCategories: initialCustomCategories,
    libraryBooks: initialLibraryBooks,
    libraryMembers: initialLibraryMembers,
    libraryMemberStats: initialLibraryMemberStats,
    accessUsers: [],
    deletedAccessUserIds: [],
    accessRules: { ...DEFAULT_ACCESS_RULES },
    adminPassword: DEFAULT_ADMIN_PASSWORD,
    lastUpdated: new Date().toISOString()
  };
}

function migrateAndNormalizeDb(parsed: any): { data: any; patched: boolean } {
  let patched = false;

  if (!parsed.libraryBooks || !parsed.libraryMembers || !parsed.libraryMemberStats) {
    parsed.libraryBooks = parsed.libraryBooks || initialLibraryBooks;
    parsed.libraryMembers = parsed.libraryMembers || initialLibraryMembers;
    parsed.libraryMemberStats = parsed.libraryMemberStats || initialLibraryMemberStats;
    patched = true;
  }

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

// =========================================================================
// BACKEND ADAPTERS (Upstash Redis -> Supabase REST -> Local FS / Vercel Tmp)
// =========================================================================

async function readFromUpstash(cfg: { url: string; token: string }): Promise<any | null> {
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
  const json: any = await res.json();
  if (!json || json.result === null || json.result === undefined) {
    return null;
  }
  if (typeof json.result === 'string') {
    return JSON.parse(json.result);
  }
  return json.result;
}

async function writeToUpstash(cfg: { url: string; token: string }, data: any): Promise<boolean> {
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

async function readFromSupabase(cfg: { url: string; key: string }): Promise<any | null> {
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
  const rows: any = await res.json();
  if (Array.isArray(rows) && rows.length > 0 && rows[0]?.payload) {
    return rows[0].payload;
  }
  return null;
}

async function writeToSupabase(cfg: { url: string; key: string }, data: any): Promise<boolean> {
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

function readFromLocalDisk(): { parsed: any | null; recoveredFromBackup: boolean } {
  const { dbFile, backupFile } = getLocalPaths();
  let parsed: any = null;
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

  if (!parsed && (globalThis as any).__siopsMemDb) {
    parsed = (globalThis as any).__siopsMemDb;
  }

  return { parsed, recoveredFromBackup };
}

function writeToLocalDisk(data: any): boolean {
  (globalThis as any).__siopsMemDb = data;
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

export async function readDb(): Promise<any> {
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

export async function writeDb(data: any): Promise<boolean> {
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

export async function applyStateUpdate(body: any): Promise<{ ok: boolean; updated?: any }> {
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

  const pickCollection = (incoming: any, existing: any) => {
    if (incoming === undefined) return existing;
    if (canReplaceOperational) return incoming;
    if (Array.isArray(existing) && existing.length > 0) return existing;
    return incoming;
  };

  const mergedDeletedIds: string[] = Array.from(
    new Set([
      ...(Array.isArray(current.deletedAccessUserIds) ? current.deletedAccessUserIds : []),
      ...(Array.isArray(deletedAccessUserIds) ? deletedAccessUserIds : [])
    ])
  ).slice(-1000);

  // Non-destructive merge: existing users are ALWAYS preserved unless explicitly deleted by Admin
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

  const updated = {
    ...current,
    tasks: pickCollection(tasks, current.tasks),
    inventories: pickCollection(inventories, current.inventories),
    monthlyReports: pickCollection(monthlyReports, current.monthlyReports),
    annualReports: pickCollection(annualReports, current.annualReports),
    schoolConfig:
      schoolConfig !== undefined && (canReplaceOperational || !current.schoolConfig)
        ? schoolConfig
        : current.schoolConfig,
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

export async function deleteAccessUserFromDb(id: string): Promise<{ ok: boolean; lastUpdated?: string }> {
  const current = (await readDb()) || {};
  const deletedSet = new Set<string>(
    Array.isArray(current.deletedAccessUserIds) ? current.deletedAccessUserIds : []
  );
  deletedSet.add(id);

  const mergedDeletedIds = Array.from(deletedSet).slice(-1000);
  const existingUsers = Array.isArray(current.accessUsers) ? current.accessUsers : [];
  const nextUsers = existingUsers.filter((u: any) => u && u.id !== id);

  const updated = {
    ...current,
    accessUsers: nextUsers,
    deletedAccessUserIds: mergedDeletedIds,
    lastUpdated: new Date().toISOString()
  };

  const ok = await writeDb(updated);
  return ok ? { ok: true, lastUpdated: updated.lastUpdated } : { ok: false };
}
