/**
 * Storage & Database Persistence Service (CRUD Layer)
 *
 * Memisahkan antara logika antarmuka (UI) dan logika penyimpanan data.
 * Terintegrasi dengan database cloud/server satu pintu (RESTful /api/state & /api/crud)
 * dengan dukungan Vite/Vercel Serverless & fallback local storage offline-first.
 */

import {
  TaskLog,
  InventoryItem,
  MonthlyReport,
  AnnualReport,
  ArchiveDocument,
  SchoolConfig,
  CustomCategory,
  TupoksiDefinitionsMap,
  LibraryBookItem,
  LibraryMemberItem,
  LibraryMemberStats,
  RegisteredAccessUser,
  AccessSecurityRules
} from '../types';

export type ServerStorageMode = 'upstash' | 'supabase' | 'local-file' | 'vercel-ephemeral' | 'offline';

export interface AppStateData {
  tasks: TaskLog[];
  inventories: InventoryItem[];
  monthlyReports: MonthlyReport[];
  annualReports: AnnualReport[];
  schoolConfig: SchoolConfig;
  archives: ArchiveDocument[];
  tupoksiDefinitions: TupoksiDefinitionsMap;
  customCategories: CustomCategory[];
  libraryBooks?: LibraryBookItem[];
  libraryMembers?: LibraryMemberItem[];
  libraryMemberStats?: LibraryMemberStats;
  accessUsers?: RegisteredAccessUser[];
  deletedAccessUserIds?: string[];
  accessRules?: AccessSecurityRules;
  adminPassword?: string;
  clientHydratedFromServer?: boolean;
  lastUpdated?: string;
}

export interface StateSyncResponse {
  ok: boolean;
  data?: AppStateData;
  storageMode?: ServerStorageMode;
  cloudPersistent?: boolean;
  label?: string;
}

export type CrudCollection =
  | 'tasks'
  | 'inventories'
  | 'monthlyReports'
  | 'annualReports'
  | 'archives'
  | 'customCategories'
  | 'libraryBooks'
  | 'libraryMembers';

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

async function parseJsonResponse(response: Response): Promise<any | null> {
  const ct = (response.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json')) {
    return null;
  }
  return response.json();
}

class StorageService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
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

  private async fetchJsonWithFallback(path: string, init?: RequestInit): Promise<any | null> {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const primaryUrl = this.getApiUrl(cleanPath);

    const attemptOnce = async (targetUrl: string): Promise<any | null> => {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 8000) : null;
      try {
        const response = await fetch(targetUrl, {
          ...init,
          ...(controller ? { signal: controller.signal } : {})
        });
        if (!response.ok) return null;
        return await parseJsonResponse(response);
      } catch {
        return null;
      } finally {
        if (timer) clearTimeout(timer);
      }
    };

    const attemptWithRetry = async (targetUrl: string): Promise<any | null> => {
      const first = await attemptOnce(targetUrl);
      if (first) return first;
      await new Promise(resolve => setTimeout(resolve, 350));
      return await attemptOnce(targetUrl);
    };

    const primaryResult = await attemptWithRetry(primaryUrl);
    if (primaryResult) return primaryResult;

    // If a custom hub URL failed or returned HTML/404, automatically self-heal to same-origin /api/*
    if (primaryUrl !== cleanPath) {
      const fallbackResult = await attemptWithRetry(cleanPath);
      if (fallbackResult) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('siops_central_api_base');
          } catch {
            // Ignore storage removal errors
          }
        }
        return fallbackResult;
      }
    }

    return null;
  }

  async checkHealth(): Promise<{
    ok: boolean;
    storageMode?: ServerStorageMode;
    cloudPersistent?: boolean;
    label?: string;
  }> {
    const json = await this.fetchJsonWithFallback('/api/health', {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!json || json.status !== 'ok') return { ok: false };
    return {
      ok: true,
      storageMode: json.storageMode,
      cloudPersistent: json.cloudPersistent,
      label: json.label
    };
  }

  // =========================================================================
  // FULL STATE SYNC & HYDRATION (Server / Cloud Database <-> Client)
  // =========================================================================

  async fetchServerState(): Promise<{
    initialized: boolean;
    data?: AppStateData;
    storageMode?: ServerStorageMode;
    cloudPersistent?: boolean;
    label?: string;
  } | null> {
    try {
      return await this.fetchJsonWithFallback('/api/state', {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
    } catch (error) {
      console.warn('[StorageService] Gagal memuat state dari database server:', error);
      return null;
    }
  }

  async syncServerStateDetailed(data: Partial<AppStateData>): Promise<StateSyncResponse> {
    try {
      const json = await this.fetchJsonWithFallback('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });
      if (!json) return { ok: false };
      return {
        ok: true,
        data: json.data,
        storageMode: json.storageMode,
        cloudPersistent: json.cloudPersistent,
        label: json.label
      };
    } catch (error) {
      console.error('[StorageService] Gagal sinkronisasi data ke server database:', error);
      return { ok: false };
    }
  }

  async syncServerState(data: Partial<AppStateData>): Promise<boolean> {
    const res = await this.syncServerStateDetailed(data);
    return res.ok;
  }

  async deleteAccessUser(id: string): Promise<boolean> {
    try {
      const json = await this.fetchJsonWithFallback(`/api/access-users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      });
      return Boolean(json?.success);
    } catch (error) {
      console.warn('[StorageService] Gagal hapus akun pengguna di server:', error);
      return false;
    }
  }

  // =========================================================================
  // GRANULAR CRUD
  // =========================================================================
  async createItem<T extends { id?: string }>(collection: CrudCollection, item: T): Promise<T | null> {
    try {
      const result = await this.fetchJsonWithFallback(`/api/crud/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(item)
      });
      return (result?.created as T) || null;
    } catch (error) {
      console.warn(`[StorageService] Offline create fallback for ${collection}:`, error);
    }
    return null;
  }

  async readCollection<T>(collection: CrudCollection): Promise<T[]> {
    try {
      const result = await this.fetchJsonWithFallback(`/api/crud/${collection}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      return (result?.data as T[]) || [];
    } catch (error) {
      console.warn(`[StorageService] Offline read fallback for ${collection}:`, error);
    }
    return [];
  }

  async readItem<T>(collection: CrudCollection, id: string): Promise<T | null> {
    try {
      const result = await this.fetchJsonWithFallback(`/api/crud/${collection}/${encodeURIComponent(id)}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      return (result?.data as T) || null;
    } catch (error) {
      console.warn(`[StorageService] Failed to read item ${id} from ${collection}:`, error);
    }
    return null;
  }

  async updateItem<T>(collection: CrudCollection, id: string, updates: Partial<T>): Promise<T | null> {
    try {
      const result = await this.fetchJsonWithFallback(`/api/crud/${collection}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(updates)
      });
      return (result?.updated as T) || null;
    } catch (error) {
      console.warn(`[StorageService] Offline update fallback for ${collection}/${id}:`, error);
    }
    return null;
  }

  async deleteItem(collection: CrudCollection, id: string): Promise<boolean> {
    try {
      const result = await this.fetchJsonWithFallback(`/api/crud/${collection}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      });
      return Boolean(result?.success);
    } catch (error) {
      console.warn(`[StorageService] Offline delete fallback for ${collection}/${id}:`, error);
      return false;
    }
  }

  async downloadServerBackup(): Promise<void> {
    if (typeof window === 'undefined') return;
    const a = document.createElement('a');
    a.href = this.getApiUrl('/api/backup');
    a.download = `backup-siops-database-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export const storageService = new StorageService();
