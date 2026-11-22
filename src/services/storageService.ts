/**
 * Centralized Single-Door Database & Auth API Client
 *
 * - Bearer session tokens (Admin & Staff) kept strictly in JS memory (never localStorage/sessionStorage).
 * - All Admin database operations carry verified Admin Bearer Authorization headers.
 * - Includes automatic timeouts, transient retry, and friendly error formatting.
 */

import {
  AccessSecurityRules,
  AdminProfile,
  AnnualReport,
  ArchiveDocument,
  AuditLogEntry,
  BackupScheduleConfig,
  CustomCategory,
  DatabaseBackupMeta,
  DatabaseCapacityQuickSummary,
  DatabaseFieldDef,
  DatabaseMetricsSummary,
  DatabaseModuleMetrics,
  InventoryItem,
  LibraryBookItem,
  LibraryMemberItem,
  LibraryMemberStats,
  MigrationReport,
  MonthlyReport,
  RegisteredAccessUser,
  RoleType,
  SavedBeritaAcaraRecord,
  SchoolConfig,
  SiteSettings,
  SoftDeletedItem,
  StaffSubmissionItem,
  TaskLog,
  TupoksiDefinitionsMap,
  UserAccountStatus
} from '../types';

export type ServerStorageMode = 'upstash' | 'supabase' | 'local-file' | 'vercel-ephemeral' | 'offline';

export interface AppStateData {
  publicOnly?: boolean;
  isAdminView?: boolean;
  tasks?: TaskLog[];
  inventories?: InventoryItem[];
  monthlyReports?: MonthlyReport[];
  annualReports?: AnnualReport[];
  schoolConfig?: SchoolConfig;
  archives?: ArchiveDocument[];
  tupoksiDefinitions?: TupoksiDefinitionsMap;
  userTupoksiDefinitions?: Record<string, any>;
  customCategories?: CustomCategory[];
  libraryBooks?: LibraryBookItem[];
  libraryMembers?: LibraryMemberItem[];
  libraryMemberStats?: LibraryMemberStats;
  userLibraryMemberStats?: Record<string, LibraryMemberStats>;
  beritaAcaraHistory?: SavedBeritaAcaraRecord[];
  customDatabases?: DatabaseModuleMetrics[];
  customDatabaseRecords?: Record<string, any[]>;
  databaseRegistry?: DatabaseModuleMetrics[];
  databaseQuotaBytes?: number;
  databaseMetrics?: DatabaseMetricsSummary;
  databaseCapacitySummary?: DatabaseCapacityQuickSummary;
  siteSettings?: SiteSettings;
  softDeletedItems?: SoftDeletedItem[];
  backups?: DatabaseBackupMeta[];
  backupSchedule?: BackupScheduleConfig;
  auditLogs?: AuditLogEntry[];
  staffSubmissions?: StaffSubmissionItem[];
  migrationLogs?: MigrationReport[];
  accessUsers?: RegisteredAccessUser[];
  deletedAccessUserIds?: string[];
  accessRules?: AccessSecurityRules;
  adminProfile?: AdminProfile | null;
  approvedRoleCounts?: Record<RoleType, number>;
  clientHydratedFromServer?: boolean;
  lastUpdated?: string;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface StateSyncResponse {
  ok: boolean;
  data?: AppStateData;
  storageMode?: ServerStorageMode;
  cloudPersistent?: boolean;
  label?: string;
  error?: string;
}

export type CrudCollection =
  | 'tasks'
  | 'inventories'
  | 'monthlyReports'
  | 'annualReports'
  | 'archives'
  | 'customCategories'
  | 'libraryBooks'
  | 'libraryMembers'
  | 'beritaAcaraHistory';

function resolveApiBaseUrl(): string {
  const envBase = (import.meta.env?.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (typeof window === 'undefined') return envBase;
  try {
    const params = new URLSearchParams(window.location.search);
    const hubParam = params.get('hub');
    if (hubParam && /^https?:\/\//i.test(hubParam)) {
      const cleanHub = hubParam.trim().replace(/\/+$/, '');
      localStorage.setItem('siops_central_api_base', cleanHub);
      return cleanHub;
    }
    const savedHub = localStorage.getItem('siops_central_api_base');
    if (savedHub && /^https?:\/\//i.test(savedHub)) {
      return savedHub.trim().replace(/\/+$/, '');
    }
  } catch {
    // Ignore storage/URL errors
  }
  return envBase;
}

export function formatApiErrorMessage(
  raw: unknown,
  fallback = 'Terjadi kesalahan pada server.'
): string {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed || fallback;
  }
  if (typeof raw === 'number' || typeof raw === 'boolean') {
    return String(raw);
  }
  if (raw instanceof Error) {
    return formatApiErrorMessage(raw.message, fallback);
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (obj.error !== undefined && obj.error !== raw) {
      const nested = formatApiErrorMessage(obj.error, '');
      if (nested) return nested;
    }
    const msgCandidate = obj.message ?? obj.detail ?? obj.reason ?? obj.errorMessage;
    const msgText =
      typeof msgCandidate === 'string'
        ? msgCandidate.trim()
        : msgCandidate !== undefined && msgCandidate !== null
        ? formatApiErrorMessage(msgCandidate, '')
        : '';
    const codeText =
      typeof obj.code === 'string' || typeof obj.code === 'number' ? String(obj.code).trim() : '';

    if (msgText && codeText && !msgText.includes(codeText)) {
      return `[${codeText}] ${msgText}`;
    }
    if (msgText) return msgText;
    if (codeText) return `Kesalahan server (${codeText}).`;
    try {
      const serialized = JSON.stringify(obj);
      return serialized && serialized !== '{}' ? serialized : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

async function parseJsonSafe(response: Response): Promise<any | null> {
  const ct = (response.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json')) {
    return null;
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
}

class StorageService {
  // Strictly in-memory session tokens (never persisted in localStorage or sessionStorage)
  private staffToken: string | null = null;
  private adminToken: string | null = null;
  private onAuthExpiredCallback: ((type: 'staff' | 'admin') => void) | null = null;

  setStaffToken(token: string | null) {
    this.staffToken = token && token.trim() ? token.trim() : null;
  }

  getStaffToken(): string | null {
    return this.staffToken;
  }

  setAdminToken(token: string | null) {
    this.adminToken = token && token.trim() ? token.trim() : null;
  }

  getAdminToken(): string | null {
    return this.adminToken;
  }

  setOnAuthExpired(cb: ((type: 'staff' | 'admin') => void) | null) {
    this.onAuthExpiredCallback = cb;
  }

  getApiUrl(path: string): string {
    const base = resolveApiBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base}${cleanPath}` : cleanPath;
  }

  getCentralHubOverride(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('siops_central_api_base');
  }

  setCentralHubOverride(url: string | null) {
    if (typeof window === 'undefined') return;
    const clean = (url || '').trim().replace(/\/+$/, '');
    if (clean && /^https?:\/\//i.test(clean)) {
      localStorage.setItem('siops_central_api_base', clean);
    } else {
      localStorage.removeItem('siops_central_api_base');
    }
  }

  private getAuthHeader(tokenPreference: 'admin' | 'staff' | 'auto' | 'none'): Record<string, string> {
    if (tokenPreference === 'none') return {};
    if (tokenPreference === 'admin') {
      return this.adminToken ? { Authorization: `Bearer ${this.adminToken}` } : {};
    }
    if (tokenPreference === 'staff') {
      return this.staffToken ? { Authorization: `Bearer ${this.staffToken}` } : {};
    }
    const chosen = this.adminToken || this.staffToken;
    return chosen ? { Authorization: `Bearer ${chosen}` } : {};
  }

  private async requestJson<T = any>(
    path: string,
    options: RequestInit & { tokenType?: 'admin' | 'staff' | 'auto' | 'none'; retries?: number } = {}
  ): Promise<ApiResponse<T>> {
    const { tokenType = 'auto', retries = 1, ...init } = options;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const primaryUrl = this.getApiUrl(cleanPath);

    const runAttempt = async (targetUrl: string): Promise<ApiResponse<T> & { networkFailure?: boolean }> => {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 10000) : null;
      try {
        const headers: Record<string, string> = {
          Accept: 'application/json',
          ...(init.headers as Record<string, string> | undefined),
          ...this.getAuthHeader(tokenType)
        };
        const res = await fetch(targetUrl, {
          ...init,
          headers,
          cache: 'no-store',
          ...(controller ? { signal: controller.signal } : {})
        });
        const json = await parseJsonSafe(res);
        if (!res.ok) {
          const rawCode = json?.code ?? json?.error?.code;
          const safeCode =
            typeof rawCode === 'string' || typeof rawCode === 'number' ? String(rawCode) : undefined;
          if (res.status === 401 && safeCode === 'ADMIN_AUTH_REQUIRED' && this.adminToken) {
            this.adminToken = null;
            this.onAuthExpiredCallback?.('admin');
          } else if (res.status === 401 && safeCode === 'AUTH_REQUIRED' && this.staffToken) {
            this.staffToken = null;
            this.onAuthExpiredCallback?.('staff');
          }
          const safeError = formatApiErrorMessage(
            json?.error !== undefined ? json.error : json?.message,
            `Permintaan gagal (Kode ${res.status}).`
          );
          const safeMessage = formatApiErrorMessage(
            json?.message !== undefined ? json.message : json?.error,
            safeError
          );
          return {
            ok: false,
            status: res.status,
            data: json,
            error: safeError,
            message: safeMessage,
            code: safeCode
          };
        }
        if (!json) {
          return {
            ok: false,
            status: res.status,
            networkFailure: true,
            error: 'Respons server tidak berbentuk JSON yang valid.'
          };
        }
        const safeOkMessage =
          json?.message !== undefined && json?.message !== null
            ? formatApiErrorMessage(json.message, '')
            : undefined;
        return {
          ok: true,
          status: res.status,
          data: json as T,
          message: safeOkMessage || undefined
        };
      } catch (err: any) {
        return {
          ok: false,
          status: 0,
          networkFailure: true,
          error:
            err?.name === 'AbortError'
              ? 'Waktu koneksi ke server habis. Silakan tekan Coba Lagi.'
              : 'Tidak dapat terhubung ke server Database Admin. Periksa koneksi jaringan Anda.'
        };
      } finally {
        if (timer) clearTimeout(timer);
      }
    };

    let result = await runAttempt(primaryUrl);
    if (result.networkFailure && retries > 0) {
      await new Promise(r => setTimeout(r, 350));
      result = await runAttempt(primaryUrl);
    }

    const shouldTrySameOriginFallback =
      primaryUrl !== cleanPath &&
      !result.ok &&
      (result.networkFailure ||
        result.status === 404 ||
        result.status >= 500 ||
        (result.data as any)?.error?.code !== undefined);

    if (shouldTrySameOriginFallback) {
      const fallback = await runAttempt(cleanPath);
      if (fallback.ok || (fallback.status > 0 && fallback.status !== 404 && fallback.status < 500)) {
        try {
          localStorage.removeItem('siops_central_api_base');
        } catch {
          // ignore
        }
        return fallback;
      }
    }

    return result;
  }

  async checkHealth(): Promise<{
    ok: boolean;
    storageMode?: ServerStorageMode;
    cloudPersistent?: boolean;
    label?: string;
  }> {
    const res = await this.requestJson<any>('/api/health', { tokenType: 'none', retries: 1 });
    if (!res.ok || res.data?.status !== 'ok') return { ok: false };
    return {
      ok: true,
      storageMode: res.data.storageMode,
      cloudPersistent: res.data.cloudPersistent,
      label: res.data.label
    };
  }

  // =========================================================================
  // STATE READ & ADMIN STATE WRITE
  // =========================================================================

  async fetchServerState(): Promise<{
    initialized: boolean;
    accessLevel?: 'PUBLIC' | 'STAFF' | 'ADMIN';
    adminSetupRequired?: boolean;
    data?: AppStateData;
    storageMode?: ServerStorageMode;
    cloudPersistent?: boolean;
    label?: string;
  } | null> {
    const res = await this.requestJson<any>('/api/state', { tokenType: 'auto', retries: 1 });
    if (!res.ok || !res.data) return null;
    return res.data;
  }

  async syncServerStateDetailed(data: Partial<AppStateData>): Promise<StateSyncResponse> {
    if (!this.adminToken) {
      return {
        ok: false,
        error: 'Hanya Admin terautentikasi yang dapat menulis langsung ke Database Admin.'
      };
    }
    const res = await this.requestJson<any>('/api/state', {
      method: 'POST',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok || !res.data) {
      return { ok: false, error: res.error };
    }
    return {
      ok: true,
      data: res.data.data,
      storageMode: res.data.storageMode,
      cloudPersistent: res.data.cloudPersistent,
      label: res.data.label
    };
  }

  async syncServerState(data: Partial<AppStateData>): Promise<boolean> {
    const res = await this.syncServerStateDetailed(data);
    return res.ok;
  }

  // =========================================================================
  // PUBLIC & STAFF AUTH ENDPOINTS
  // =========================================================================

  async authRegister(payload: {
    namaLengkap: string;
    username: string;
    role: RoleType;
    password: string;
  }): Promise<ApiResponse<{ ok: boolean; user?: RegisteredAccessUser; message: string }>> {
    return this.requestJson('/api/auth/register', {
      method: 'POST',
      tokenType: 'none',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async authLogin(payload: {
    username: string;
    password: string;
    expectedRole?: RoleType;
  }): Promise<
    ApiResponse<{
      ok: boolean;
      isAdmin?: boolean;
      token: string;
      expiresAt: string;
      requiresPasswordChange?: boolean;
      user?: RegisteredAccessUser;
      adminProfile?: AdminProfile | null;
      message: string;
    }>
  > {
    const res = await this.requestJson<any>('/api/auth/login', {
      method: 'POST',
      tokenType: 'none',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data?.token) {
      if (res.data.isAdmin) {
        this.setAdminToken(res.data.token);
      } else {
        this.setStaffToken(res.data.token);
      }
    }
    return res;
  }

  async authRefresh(): Promise<boolean> {
    if (!this.staffToken) return false;
    const res = await this.requestJson<any>('/api/auth/refresh', {
      method: 'POST',
      tokenType: 'staff',
      retries: 1
    });
    if (res.ok && res.data?.token) {
      this.setStaffToken(res.data.token);
      return true;
    }
    return false;
  }

  async authRequestReset(payload: { username: string; note?: string }) {
    return this.requestJson('/api/auth/request-reset', {
      method: 'POST',
      tokenType: 'none',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async authStatusLookup(username: string): Promise<ApiResponse<{ ok: boolean; user: RegisteredAccessUser }>> {
    return this.requestJson('/api/auth/status-lookup', {
      method: 'POST',
      tokenType: 'none',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
  }

  async authChangePassword(newPassword: string) {
    return this.requestJson('/api/auth/change-password', {
      method: 'POST',
      tokenType: 'staff',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
  }

  // =========================================================================
  // STAFF SAFE PROPOSAL SUBMISSION QUEUE (NO DIRECT DB WRITE/DELETE)
  // =========================================================================

  async submitStaffProposal(payload: {
    targetCollection: string;
    operationType: 'CREATE' | 'UPDATE';
    payload: any;
    note?: string;
  }) {
    return this.requestJson<{ ok: boolean; submission: StaffSubmissionItem; message: string }>(
      '/api/staff/submissions',
      {
        method: 'POST',
        tokenType: 'staff',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
  }

  async staffSelfSave(payload: {
    actionType:
      | 'SAVE_LETTERHEAD'
      | 'RESET_LETTERHEAD'
      | 'SAVE_SIGNATURE'
      | 'RESET_SIGNATURE'
      | 'SAVE_TUPOKSI'
      | 'SAVE_LIBRARY_MEMBER_STATS'
      | 'SAVE_RECORD'
      | 'SAVE_RECORDS_BATCH';
    collection?: string;
    payload?: any;
    records?: any[];
  }) {
    const tokenType: 'staff' | 'admin' = this.staffToken ? 'staff' : 'admin';
    return this.requestJson<{
      ok: boolean;
      isolationKey?: string;
      entry?: any;
      stats?: LibraryMemberStats;
      collection?: string;
      savedRecord?: any;
      savedRecords?: any[];
      replacedId?: string | null;
      databaseMetrics?: DatabaseMetricsSummary;
      lastUpdated?: string;
      message?: string;
    }>('/api/staff/self-save', {
      method: 'POST',
      tokenType,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  // =========================================================================
  // ADMIN AUTH & GOVERNANCE ENDPOINTS
  // =========================================================================

  async adminAuthStatus() {
    return this.requestJson<{
      envOverrideActive: boolean;
      isClaimed: boolean;
      setupRequired: boolean;
      isDefaultCredentials?: boolean;
    }>('/api/admin/auth/status', { method: 'GET', tokenType: 'none' });
  }

  async adminAuthClaim(password: string) {
    const res = await this.requestJson<{ ok: boolean; token: string; expiresAt: string; message: string }>(
      '/api/admin/auth/claim',
      {
        method: 'POST',
        tokenType: 'none',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      }
    );
    if (res.ok && res.data?.token) {
      this.setAdminToken(res.data.token);
    }
    return res;
  }

  async adminAuthLogin(username: string, password: string) {
    const res = await this.requestJson<{
      ok: boolean;
      token: string;
      expiresAt: string;
      setupRequired?: boolean;
      adminProfile?: AdminProfile | null;
      message: string;
    }>('/api/admin/auth/login', {
      method: 'POST',
      tokenType: 'none',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok && res.data?.token) {
      this.setAdminToken(res.data.token);
    }
    return res;
  }

  async adminAuthRefresh(): Promise<boolean> {
    if (!this.adminToken) return false;
    const res = await this.requestJson<{ ok: boolean; token: string }>('/api/admin/auth/refresh', {
      method: 'POST',
      tokenType: 'admin'
    });
    if (res.ok && res.data?.token) {
      this.setAdminToken(res.data.token);
      return true;
    }
    return false;
  }

  async adminAuthUpdateProfile(payload: {
    currentPassword: string;
    newUsername: string;
    newEmail?: string;
    newNamaLengkap?: string;
    newPassword?: string;
  }) {
    const res = await this.requestJson<{
      ok: boolean;
      token?: string;
      expiresAt?: string;
      adminProfile?: AdminProfile | null;
      message?: string;
    }>('/api/admin/auth/profile', {
      method: 'PUT',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data?.token) {
      this.setAdminToken(res.data.token);
    }
    return res;
  }

  async adminAuthChangePassword(newPassword: string) {
    return this.requestJson('/api/admin/auth/change-password', {
      method: 'POST',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
  }

  async adminGetDashboard() {
    return this.requestJson<{ ok: boolean; data: AppStateData; storageMode?: ServerStorageMode; label?: string }>(
      '/api/admin/dashboard',
      { method: 'GET', tokenType: 'admin' }
    );
  }

  async adminUpdateSiteSettings(payload: { welcomeHeadline: string; welcomeSubheadline?: string }) {
    return this.requestJson('/api/admin/site-settings', {
      method: 'PUT',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async adminUpdateQuota(databaseQuotaBytes: number) {
    return this.requestJson('/api/admin/quota', {
      method: 'PUT',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ databaseQuotaBytes })
    });
  }

  async adminCreateDatabase(payload: {
    code: string;
    name: string;
    module: string;
    description?: string;
    capacityLimitBytes: number;
    maxRecords: number;
    status: 'ACTIVE' | 'ARCHIVED';
    fields?: DatabaseFieldDef[];
  }) {
    return this.requestJson('/api/admin/databases', {
      method: 'POST',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async adminUpdateDatabase(
    code: string,
    updates: Partial<{
      name: string;
      module: string;
      description: string;
      capacityLimitBytes: number;
      maxRecords: number;
      status: 'ACTIVE' | 'ARCHIVED' | 'LOCKED';
    }>
  ) {
    return this.requestJson(`/api/admin/databases/${encodeURIComponent(code)}`, {
      method: 'PUT',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  }

  async adminDeleteDatabase(code: string) {
    return this.requestJson(`/api/admin/databases/${encodeURIComponent(code)}`, {
      method: 'DELETE',
      tokenType: 'admin'
    });
  }

  async adminCreateRecord(collection: string, record: any) {
    return this.requestJson(`/api/admin/records/${encodeURIComponent(collection)}`, {
      method: 'POST',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  }

  async adminUpdateRecord(collection: string, id: string, updates: any) {
    return this.requestJson(
      `/api/admin/records/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        tokenType: 'admin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }
    );
  }

  async adminSoftDeleteRecord(collection: string, id: string) {
    return this.requestJson(
      `/api/admin/records/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        tokenType: 'admin'
      }
    );
  }

  async adminRestoreTrash(trashId: string) {
    return this.requestJson(`/api/admin/trash/${encodeURIComponent(trashId)}/restore`, {
      method: 'POST',
      tokenType: 'admin'
    });
  }

  async adminPurgeTrash(trashId: string) {
    return this.requestJson(`/api/admin/trash/${encodeURIComponent(trashId)}/purge`, {
      method: 'DELETE',
      tokenType: 'admin',
      headers: { 'X-Confirm-Purge': 'CONFIRM_PERMANENT_DELETE' }
    });
  }

  async adminCreateBackup(label?: string) {
    return this.requestJson('/api/admin/backups', {
      method: 'POST',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label })
    });
  }

  async adminUpdateBackupSchedule(enabled: boolean, intervalHours: number) {
    return this.requestJson('/api/admin/backups/schedule', {
      method: 'PUT',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, intervalHours })
    });
  }

  async adminRestoreBackup(payload: { backupId?: string; uploadedSnapshot?: any }) {
    return this.requestJson('/api/admin/backups/restore', {
      method: 'POST',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async adminRunMigration(payload: {
    sourceName: string;
    targetCollection: string;
    records: any[];
    duplicateStrategy: 'SKIP' | 'OVERWRITE' | 'RENAME_ID';
    columnMapping?: Record<string, string>;
  }) {
    return this.requestJson<{ ok: boolean; report: MigrationReport; message: string }>('/api/admin/migrate', {
      method: 'POST',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async adminRollbackMigration(migrationId: string) {
    return this.requestJson('/api/admin/migrate/rollback', {
      method: 'POST',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ migrationId })
    });
  }

  async adminApproveSubmission(submissionId: string) {
    return this.requestJson(`/api/admin/submissions/${encodeURIComponent(submissionId)}/approve`, {
      method: 'POST',
      tokenType: 'admin'
    });
  }

  async adminRejectSubmission(submissionId: string, reason?: string) {
    return this.requestJson(`/api/admin/submissions/${encodeURIComponent(submissionId)}/reject`, {
      method: 'POST',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
  }

  async adminUpdateSecurityRules(updates: Partial<AccessSecurityRules>) {
    return this.requestJson('/api/admin/users/rules', {
      method: 'PUT',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  }

  async adminCreateUser(payload: {
    namaLengkap: string;
    username: string;
    role: RoleType;
    password: string;
    status?: UserAccountStatus;
  }) {
    return this.requestJson('/api/admin/users', {
      method: 'POST',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async adminUserAction(
    userId: string,
    action: 'approve' | 'reject' | 'reset-password' | 'set-password',
    password?: string
  ) {
    return this.requestJson(`/api/admin/users/${encodeURIComponent(userId)}/${action}`, {
      method: 'POST',
      tokenType: 'admin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(password !== undefined ? { password } : {})
    });
  }

  async deleteAccessUser(id: string): Promise<boolean> {
    const res = await this.requestJson(`/api/access-users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      tokenType: 'admin'
    });
    return res.ok;
  }

  async downloadServerBackup(): Promise<{ ok: boolean; error?: string }> {
    if (typeof window === 'undefined') return { ok: false };
    try {
      const res = await fetch(this.getApiUrl('/api/backup'), {
        headers: {
          Accept: 'application/json',
          ...this.getAuthHeader('admin')
        }
      });
      if (!res.ok) {
        return { ok: false, error: 'Hanya Admin terautentikasi yang dapat mengunduh cadangan database.' };
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-database-admin-siops-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Gagal mengunduh cadangan dari server.' };
    }
  }
}

export const storageService = new StorageService();
