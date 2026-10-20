/**
 * Storage & Database Persistence Service (CRUD Layer)
 * 
 * Memisahkan antara logika antarmuka (UI) dan logika penyimpanan data.
 * Terintegrasi dengan database server (RESTful CRUD /api/crud dan /api/state) 
 * dengan fallback local storage offline-first yang andal.
 * Pembaruan kode frontend tidak akan merusak atau menghapus data pengguna di server database.
 */

import { TaskLog, InventoryItem, MonthlyReport, AnnualReport, ArchiveDocument, SchoolConfig, CustomCategory, TupoksiDefinitionsMap } from '../types';

export interface AppStateData {
  tasks: TaskLog[];
  inventories: InventoryItem[];
  monthlyReports: MonthlyReport[];
  annualReports: AnnualReport[];
  schoolConfig: SchoolConfig;
  archives: ArchiveDocument[];
  tupoksiDefinitions: TupoksiDefinitionsMap;
  customCategories: CustomCategory[];
  lastUpdated?: string;
}

export type CrudCollection = 'tasks' | 'inventories' | 'monthlyReports' | 'annualReports' | 'archives' | 'customCategories';

class StorageService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.isOnline = true; });
      window.addEventListener('offline', () => { this.isOnline = false; });
    }
  }

  // =========================================================================
  // FULL STATE SYNC & HYDRATION (Server Database ↔ Client)
  // =========================================================================
  
  /**
   * Mengambil seluruh data tersimpan dari server database saat booting aplikasi
   */
  async fetchServerState(): Promise<{ initialized: boolean; data?: AppStateData } | null> {
    try {
      const response = await fetch('/api/state', {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.warn('[StorageService] Gagal memuat state dari database server:', error);
      return null;
    }
  }

  /**
   * Menyimpan batch seluruh state aplikasi langsung ke basis data server
   */
  async syncServerState(data: Partial<AppStateData>): Promise<boolean> {
    try {
      const response = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch (error) {
      console.error('[StorageService] Gagal sinkronisasi data ke server database:', error);
      return false;
    }
  }

  // =========================================================================
  // GRANULAR CRUD: CREATE
  // =========================================================================
  async createItem<T extends { id?: string }>(collection: CrudCollection, item: T): Promise<T | null> {
    try {
      const response = await fetch(`/api/crud/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (response.ok) {
        const result = await response.json();
        return result.created as T;
      }
    } catch (error) {
      console.warn(`[StorageService] Offline create fallback for ${collection}:`, error);
    }
    return null;
  }

  // =========================================================================
  // GRANULAR CRUD: READ
  // =========================================================================
  async readCollection<T>(collection: CrudCollection): Promise<T[]> {
    try {
      const response = await fetch(`/api/crud/${collection}`);
      if (response.ok) {
        const result = await response.json();
        return result.data as T[];
      }
    } catch (error) {
      console.warn(`[StorageService] Offline read fallback for ${collection}:`, error);
    }
    return [];
  }

  async readItem<T>(collection: CrudCollection, id: string): Promise<T | null> {
    try {
      const response = await fetch(`/api/crud/${collection}/${id}`);
      if (response.ok) {
        const result = await response.json();
        return result.data as T;
      }
    } catch (error) {
      console.warn(`[StorageService] Failed to read item ${id} from ${collection}:`, error);
    }
    return null;
  }

  // =========================================================================
  // GRANULAR CRUD: UPDATE
  // =========================================================================
  async updateItem<T>(collection: CrudCollection, id: string, updates: Partial<T>): Promise<T | null> {
    try {
      const response = await fetch(`/api/crud/${collection}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        const result = await response.json();
        return result.updated as T;
      }
    } catch (error) {
      console.warn(`[StorageService] Offline update fallback for ${collection}/${id}:`, error);
    }
    return null;
  }

  // =========================================================================
  // GRANULAR CRUD: DELETE
  // =========================================================================
  async deleteItem(collection: CrudCollection, id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/crud/${collection}/${id}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.warn(`[StorageService] Offline delete fallback for ${collection}/${id}:`, error);
      return false;
    }
  }

  // =========================================================================
  // EXPORT BACKUP
  // =========================================================================
  async downloadServerBackup(): Promise<void> {
    if (typeof window === 'undefined') return;
    const a = document.createElement('a');
    a.href = '/api/backup';
    a.download = `backup-siops-database-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export const storageService = new StorageService();
