import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  RoleType, 
  TaskLog, 
  InventoryItem, 
  MonthlyReport, 
  AnnualReport, 
  SchoolConfig,
  ArchiveDocument,
  TupoksiDefinitionsMap,
  CustomCategory
} from '../types';
import { 
  initialSchoolConfig, 
  initialTasks, 
  initialInventories, 
  initialMonthlyReports, 
  initialAnnualReports,
  initialArchives,
  initialCustomCategories
} from '../data/initialData';
import { ROLE_OPERATIONAL_SPECS } from '../data/roleOperationalSpecs';
import { storageService } from '../services/storageService';
import { 
  isTaskInMonth, 
  isTaskInYear, 
  getTaskClassification, 
  OFFICIAL_TUPOKSI_DEFINITIONS, 
  parseTaskMonthYear 
} from '../utils/taskClassification';

export type RoleSubTab = 'tasks' | 'tupoksi' | 'monthly' | 'annual' | 'inventory';

interface AppContextType {
  currentRole: RoleType | null;
  setCurrentRole: (role: RoleType | null) => void;
  tasks: TaskLog[];
  addTask: (task: Omit<TaskLog, 'id'>) => void;
  updateTask: (id: string, updated: Partial<TaskLog>) => void;
  deleteTask: (id: string) => void;
  importTasks: (newTasks: Omit<TaskLog, 'id'>[]) => void;
  inventories: InventoryItem[];
  addInventory: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventory: (id: string, updated: Partial<InventoryItem>) => void;
  deleteInventory: (id: string) => void;
  importInventories: (newItems: Omit<InventoryItem, 'id'>[]) => void;
  monthlyReports: MonthlyReport[];
  saveMonthlyReport: (report: MonthlyReport) => void;
  annualReports: AnnualReport[];
  saveAnnualReport: (report: AnnualReport) => void;
  archives: ArchiveDocument[];
  addArchive: (doc: Omit<ArchiveDocument, 'id'>) => void;
  updateArchive: (id: string, updated: Partial<ArchiveDocument>) => void;
  deleteArchive: (id: string) => void;
  archiveReport: (type: 'monthly' | 'annual', data: any, customTitle?: string) => ArchiveDocument;
  schoolConfig: SchoolConfig;
  updateSchoolConfig: (config: Partial<SchoolConfig>) => void;
  tupoksiDefinitions: TupoksiDefinitionsMap;
  addTupoksiItem: (role: RoleType, type: 'pokok' | 'tambahan', text: string) => void;
  updateTupoksiItem: (role: RoleType, type: 'pokok' | 'tambahan', index: number, newText: string) => void;
  deleteTupoksiItem: (role: RoleType, type: 'pokok' | 'tambahan', indexOrText: number | string) => void;
  resetTupoksiToDefault: (role?: RoleType) => void;
  customCategories: CustomCategory[];
  addCustomCategory: (cat: { role: RoleType; name: string; classification: 'pokok' | 'tambahan'; description?: string }) => CustomCategory;
  updateCustomCategory: (id: string, updated: Partial<CustomCategory>) => void;
  deleteCustomCategory: (id: string) => void;
  getRoleCustomCategories: (role: RoleType) => CustomCategory[];
  getCategoryLabel: (categoryKey: string, role?: RoleType) => string;
  roleSubTabs: Record<RoleType, RoleSubTab>;
  setRoleSubTab: (role: RoleType, tab: RoleSubTab) => void;
  lastAddedTaskMonthYear: { month: number; year: number } | null;
  setLastAddedTaskMonthYear: (val: { month: number; year: number } | null) => void;
  generateMonthlyReportFromTasks: (role: RoleType, month: number, year: number, forceFresh?: boolean) => MonthlyReport;
  generateAnnualReportFromMonthly: (role: RoleType, year: number) => AnnualReport;
  activeNavTab: string;
  setActiveNavTab: (tab: string) => void;
  resetToDefaultData: () => void;
  exportBackupJson: () => void;
  restoreFromBackupJson: (jsonData: any) => boolean;
  rolePins: Record<RoleType, string>;
  verifyRolePin: (role: RoleType, pin: string) => boolean;
  updateRolePin: (role: RoleType, newPin: string) => void;
  syncStatus: 'synced' | 'saving' | 'offline';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ROLE: 'siops_current_role',
  TASKS: 'siops_tasks',
  INVENTORY: 'siops_inventory',
  MONTHLY: 'siops_monthly_reports',
  ANNUAL: 'siops_annual_reports',
  ARCHIVES: 'siops_archives',
  CONFIG: 'siops_school_config',
  TUPOKSI: 'siops_tupoksi_definitions',
  SUBTABS: 'siops_role_subtabs',
  PINS: 'siops_role_pins',
  CUSTOM_CATEGORIES: 'siops_custom_categories'
};
export const mergeSchoolConfigWithDefaults = (sourceConfig: any): SchoolConfig => {
  if (!sourceConfig || typeof sourceConfig !== 'object') return initialSchoolConfig;
  const cleaned: any = { ...sourceConfig };

  // Pembersihan otomatis: Hapus sisa-sisa default 'Jawa Barat' agar 100% fleksibel sesuai keinginan pengguna
  if (typeof cleaned.provinsi === 'string' && /jawa\s*barat/i.test(cleaned.provinsi)) {
    cleaned.provinsi = '';
  }
  if (typeof cleaned.pemerintahDaerah === 'string' && /jawa\s*barat/i.test(cleaned.pemerintahDaerah)) {
    cleaned.pemerintahDaerah = cleaned.pemerintahDaerah
      .replace(/provinsi\s+jawa\s+barat/gi, '')
      .replace(/jawa\s+barat/gi, '')
      .trim();
  }
  if (typeof cleaned.alamat === 'string' && /jawa\s*barat/i.test(cleaned.alamat)) {
    cleaned.alamat = cleaned.alamat
      .replace(/,\s*provinsi\s+jawa\s+barat/gi, '')
      .replace(/,\s*jawa\s+barat/gi, '')
      .trim();
  }
  if (typeof cleaned.stempelTextLine1 === 'string' && /jawa\s*barat/i.test(cleaned.stempelTextLine1)) {
    cleaned.stempelTextLine1 = cleaned.stempelTextLine1.replace(/jawa\s+barat/gi, '').trim();
  }

  return {
    ...initialSchoolConfig,
    ...cleaned,
    kepalaSekolah: {
      ...initialSchoolConfig.kepalaSekolah,
      ...(cleaned.kepalaSekolah || {})
    },
    operatorProfiles: {
      TU: { ...initialSchoolConfig.operatorProfiles.TU, ...(cleaned.operatorProfiles?.TU || {}) },
      PENJAGA: { ...initialSchoolConfig.operatorProfiles.PENJAGA, ...(cleaned.operatorProfiles?.PENJAGA || {}) },
      SERVICE: { ...initialSchoolConfig.operatorProfiles.SERVICE, ...(cleaned.operatorProfiles?.SERVICE || {}) },
      PERPUS: { ...initialSchoolConfig.operatorProfiles.PERPUS, ...(cleaned.operatorProfiles?.PERPUS || {}) },
      LAB_IPA: { ...initialSchoolConfig.operatorProfiles.LAB_IPA, ...(cleaned.operatorProfiles?.LAB_IPA || {}) },
    }
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRoleState] = useState<RoleType | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    if (saved === 'TU' || saved === 'PENJAGA' || saved === 'SERVICE' || saved === 'PERPUS' || saved === 'LAB_IPA') {
      return saved as RoleType;
    }
    return null;
  });

  const [rolePins, setRolePins] = useState<Record<RoleType, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PINS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          TU: parsed.TU || '2101',
          PENJAGA: parsed.PENJAGA || '2102',
          SERVICE: parsed.SERVICE || '2103',
          PERPUS: parsed.PERPUS || '2104',
          LAB_IPA: parsed.LAB_IPA || '2105'
        };
      } catch (e) { console.error(e); }
    }
    return {
      TU: '2101',
      PENJAGA: '2102',
      SERVICE: '2103',
      PERPUS: '2104',
      LAB_IPA: '2105'
    };
  });

  const verifyRolePin = (role: RoleType, pin: string): boolean => {
    const fallbackPin = 
      role === 'TU' ? '2101' : 
      role === 'PENJAGA' ? '2102' : 
      role === 'SERVICE' ? '2103' : 
      role === 'PERPUS' ? '2104' : '2105';
    const expected = rolePins[role] || fallbackPin;
    return pin.trim() === expected.trim();
  };

  const updateRolePin = (role: RoleType, newPin: string) => {
    if (!newPin.trim()) return;
    setRolePins(prev => {
      const next = { ...prev, [role]: newPin.trim() };
      localStorage.setItem(STORAGE_KEYS.PINS, JSON.stringify(next));
      return next;
    });
  };

  const [activeNavTab, setActiveNavTab] = useState<string>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');
  const isInitialLoad = useRef(true);

  const [tasks, setTasks] = useState<TaskLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialTasks;
  });

  const [inventories, setInventories] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialInventories;
  });

  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MONTHLY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialMonthlyReports;
  });

  const [annualReports, setAnnualReports] = useState<AnnualReport[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ANNUAL);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialAnnualReports;
  });

  const [archives, setArchives] = useState<ArchiveDocument[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ARCHIVES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialArchives;
  });

  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return mergeSchoolConfigWithDefaults(parsed);
      } catch (e) {
        console.error(e);
      }
    }
    return initialSchoolConfig;
  });

  const [tupoksiDefinitions, setTupoksiDefinitions] = useState<TupoksiDefinitionsMap>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TUPOKSI);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...OFFICIAL_TUPOKSI_DEFINITIONS,
          ...parsed
        };
      } catch (e) {
        console.error(e);
      }
    }
    return JSON.parse(JSON.stringify(OFFICIAL_TUPOKSI_DEFINITIONS));
  });

  const [roleSubTabs, setRoleSubTabs] = useState<Record<RoleType, RoleSubTab>>(() => {
    const defaultTabs: Record<RoleType, RoleSubTab> = {
      TU: 'tasks',
      PENJAGA: 'tasks',
      SERVICE: 'tasks',
      PERPUS: 'tasks',
      LAB_IPA: 'tasks'
    };
    const saved = localStorage.getItem(STORAGE_KEYS.SUBTABS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultTabs, ...parsed };
      } catch (e) {
        console.error(e);
      }
    }
    return defaultTabs;
  });

  const STANDARD_CATEGORY_LABELS: Record<string, string> = {
    // TU
    kepegawaian: 'Kepegawaian (SKP, Pangkat, BKN, Cuti)',
    siswa: 'Kesiswaan (Buku Induk, Mutasi, Suket)',
    sapras: 'Sarpras & Aset (KIR, KIB, BAST)',
    surat_masuk: 'Surat Masuk (Agenda & Disposisi)',
    surat_keluar: 'Surat Keluar (No Dinas, SPPD)',
    keuangan_bos: 'Keuangan BOS/BOP (BKU, SPJ)',
    kearsipan: 'Kearsipan (Digitalisasi & Odner)',
    dapodik: 'Dapodikdasmen (Validasi Data)',
    layanan_umum: 'Layanan Umum (Tamu Dinas & Humas)',
    // PENJAGA
    keamanan: 'Keamanan Umum (Patroli, Gerbang)',
    inspeksi_malam: 'Inspeksi & Ronda Malam',
    protokoler_tamu: 'Protokoler Tamu & Parkir',
    pengawasan_anak: 'Mengawasi Siswa (Zebra Cross, Pagi)',
    tanggap_darurat: 'Kesiapsiagaan Darurat (APAR, Bencana)',
    perbaikan_sapras: 'Perbaikan Sarpras Ringan',
    lingkungan: 'Tambahan Lingkungan & Saluran',
    antar_surat: 'Antar Surat Dinas & Ekspedisi',
    // SERVICE
    kebersihan_wc: 'Kebersihan Toilet / WC',
    kebersihan_kantor: 'Kebersihan Ruang Kerja & Kelas',
    kebersihan_sampah: 'Kebersihan Sampah & TPS',
    kebersihan_halaman: 'Pembersihan Halaman & Lapangan',
    perawatan_taman: 'Perawatan & Penyiraman Taman',
    sanitasi_disinfeksi: 'Sanitasi & Disinfeksi (UKS)',
    penyediaan_air: 'Penyediaan Air Bersih & Pompa',
    // PERPUS
    katalogisasi_buku: 'Katalogisasi DDC & Barcode Buku',
    sirkulasi_peminjaman: 'Sirkulasi Peminjaman Buku',
    layanan_literasi: 'Layanan Literasi (GLS & Pojok Baca)',
    perawatan_buku: 'Perawatan & Restorasi Buku',
    stock_opname: 'Stock Opname Koleksi Buku',
    administrasi_perpus: 'Administrasi Perpustakaan',
    // LAB IPA
    persiapan_praktikum: 'Persiapan Praktikum Sains',
    pemeliharaan_alat: 'Pemeliharaan Alat Gelas Lab',
    inventaris_bahan: 'Inventaris Reagen Kimia',
    k3_laboratorium: 'Keselamatan Kerja K3 Lab',
    jadwal_lab: 'Jadwal & Jurnal Penggunaan Lab',
    perbaikan_alat: 'Kalibrasi & Perbaikan Alat Lab'
  };

  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return initialCustomCategories;
  });

  const addCustomCategory = (cat: {
    role: RoleType;
    name: string;
    classification: 'pokok' | 'tambahan';
    description?: string;
  }): CustomCategory => {
    const trimmed = cat.name.trim();
    const baseSlug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || `kategori_${Date.now()}`;
    const exists = customCategories.some(c => c.slug === baseSlug);
    const finalSlug = exists ? `${baseSlug}_${Math.random().toString(36).substring(2, 6)}` : baseSlug;

    const newCategory: CustomCategory = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: cat.role,
      name: trimmed,
      slug: finalSlug,
      classification: cat.classification,
      description: cat.description?.trim(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCustomCategories(prev => {
      const next = [...prev, newCategory];
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(next));
      return next;
    });

    return newCategory;
  };

  const updateCustomCategory = (id: string, updated: Partial<CustomCategory>) => {
    setCustomCategories(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updated } : c);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(next));
      return next;
    });
  };

  const deleteCustomCategory = (id: string) => {
    setCustomCategories(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(next));
      return next;
    });
  };

  const getRoleCustomCategories = (role: RoleType): CustomCategory[] => {
    return customCategories.filter(c => c.role === role);
  };

  const getCategoryLabel = (categoryKey: string, role?: RoleType): string => {
    if (STANDARD_CATEGORY_LABELS[categoryKey]) {
      return STANDARD_CATEGORY_LABELS[categoryKey];
    }
    const match = customCategories.find(c => 
      (c.slug === categoryKey || c.name.toLowerCase() === categoryKey.toLowerCase()) && 
      (!role || c.role === role)
    );
    if (match) return match.name;
    return categoryKey.replace(/_/g, ' ');
  };

  const [lastAddedTaskMonthYear, setLastAddedTaskMonthYear] = useState<{ month: number; year: number } | null>(null);

  const setRoleSubTab = (role: RoleType, tab: RoleSubTab) => {
    setRoleSubTabs(prev => {
      const next = { ...prev, [role]: tab };
      localStorage.setItem(STORAGE_KEYS.SUBTABS, JSON.stringify(next));
      return next;
    });
  };

  const addTupoksiItem = (role: RoleType, type: 'pokok' | 'tambahan', text: string) => {
    if (!text.trim()) return;
    setTupoksiDefinitions(prev => {
      const currentRoleObj = prev[role] || { tupoksiList: [], tugasTambahanList: [] };
      const next: TupoksiDefinitionsMap = {
        ...prev,
        [role]: {
          ...currentRoleObj,
          tupoksiList: type === 'pokok' 
            ? [...currentRoleObj.tupoksiList, text.trim()] 
            : currentRoleObj.tupoksiList,
          tugasTambahanList: type === 'tambahan' 
            ? [...currentRoleObj.tugasTambahanList, text.trim()] 
            : currentRoleObj.tugasTambahanList
        }
      };
      localStorage.setItem(STORAGE_KEYS.TUPOKSI, JSON.stringify(next));
      return next;
    });
  };

  const updateTupoksiItem = (role: RoleType, type: 'pokok' | 'tambahan', index: number, newText: string) => {
    if (!newText.trim()) return;
    setTupoksiDefinitions(prev => {
      const currentRoleObj = prev[role] || { tupoksiList: [], tugasTambahanList: [] };
      const next: TupoksiDefinitionsMap = {
        ...prev,
        [role]: {
          ...currentRoleObj,
          tupoksiList: type === 'pokok'
            ? currentRoleObj.tupoksiList.map((item, i) => i === index ? newText.trim() : item)
            : currentRoleObj.tupoksiList,
          tugasTambahanList: type === 'tambahan'
            ? currentRoleObj.tugasTambahanList.map((item, i) => i === index ? newText.trim() : item)
            : currentRoleObj.tugasTambahanList
        }
      };
      localStorage.setItem(STORAGE_KEYS.TUPOKSI, JSON.stringify(next));
      return next;
    });
  };

  const deleteTupoksiItem = (role: RoleType, type: 'pokok' | 'tambahan', indexOrText: number | string) => {
    setTupoksiDefinitions(prev => {
      const currentRoleObj = prev[role] || { 
        tupoksiList: [...(OFFICIAL_TUPOKSI_DEFINITIONS[role]?.tupoksiList || [])], 
        tugasTambahanList: [...(OFFICIAL_TUPOKSI_DEFINITIONS[role]?.tugasTambahanList || [])] 
      };

      let updatedPokok = [...(currentRoleObj.tupoksiList || [])];
      let updatedTambahan = [...(currentRoleObj.tugasTambahanList || [])];

      if (type === 'pokok') {
        if (typeof indexOrText === 'number') {
          updatedPokok = updatedPokok.filter((_, i) => i !== indexOrText);
        } else {
          updatedPokok = updatedPokok.filter(item => item !== indexOrText);
        }
      } else {
        if (typeof indexOrText === 'number') {
          updatedTambahan = updatedTambahan.filter((_, i) => i !== indexOrText);
        } else {
          updatedTambahan = updatedTambahan.filter(item => item !== indexOrText);
        }
      }

      const next: TupoksiDefinitionsMap = {
        ...prev,
        [role]: {
          tupoksiList: updatedPokok,
          tugasTambahanList: updatedTambahan
        }
      };
      localStorage.setItem(STORAGE_KEYS.TUPOKSI, JSON.stringify(next));
      return next;
    });
  };

  const resetTupoksiToDefault = (role?: RoleType) => {
    setTupoksiDefinitions(prev => {
      let next: TupoksiDefinitionsMap;
      if (role) {
        next = {
          ...prev,
          [role]: {
            tupoksiList: [...OFFICIAL_TUPOKSI_DEFINITIONS[role].tupoksiList],
            tugasTambahanList: [...OFFICIAL_TUPOKSI_DEFINITIONS[role].tugasTambahanList]
          }
        };
      } else {
        next = {
          TU: {
            tupoksiList: [...OFFICIAL_TUPOKSI_DEFINITIONS.TU.tupoksiList],
            tugasTambahanList: [...OFFICIAL_TUPOKSI_DEFINITIONS.TU.tugasTambahanList]
          },
          PENJAGA: {
            tupoksiList: [...OFFICIAL_TUPOKSI_DEFINITIONS.PENJAGA.tupoksiList],
            tugasTambahanList: [...OFFICIAL_TUPOKSI_DEFINITIONS.PENJAGA.tugasTambahanList]
          },
          SERVICE: {
            tupoksiList: [...OFFICIAL_TUPOKSI_DEFINITIONS.SERVICE.tupoksiList],
            tugasTambahanList: [...OFFICIAL_TUPOKSI_DEFINITIONS.SERVICE.tugasTambahanList]
          },
          PERPUS: {
            tupoksiList: [...OFFICIAL_TUPOKSI_DEFINITIONS.PERPUS.tupoksiList],
            tugasTambahanList: [...OFFICIAL_TUPOKSI_DEFINITIONS.PERPUS.tugasTambahanList]
          },
          LAB_IPA: {
            tupoksiList: [...OFFICIAL_TUPOKSI_DEFINITIONS.LAB_IPA.tupoksiList],
            tugasTambahanList: [...OFFICIAL_TUPOKSI_DEFINITIONS.LAB_IPA.tugasTambahanList]
          }
        };
      }
      localStorage.setItem(STORAGE_KEYS.TUPOKSI, JSON.stringify(next));
      return next;
    });
  };

  // Sync from server database on first load (to ensure shared URL gets stored data!)
  useEffect(() => {
    let isMounted = true;
    async function loadServerState() {
      try {
        const json = await storageService.fetchServerState();
        if (json && json.initialized && json.data && isMounted) {
          if (json.data.tasks && json.data.tasks.length > 0) {
            setTasks(json.data.tasks);
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(json.data.tasks));
          }
          if (json.data.inventories && json.data.inventories.length > 0) {
            setInventories(json.data.inventories);
            localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(json.data.inventories));
          }
          if (json.data.monthlyReports && json.data.monthlyReports.length > 0) {
            setMonthlyReports(json.data.monthlyReports);
            localStorage.setItem(STORAGE_KEYS.MONTHLY, JSON.stringify(json.data.monthlyReports));
          }
          if (json.data.annualReports && json.data.annualReports.length > 0) {
            setAnnualReports(json.data.annualReports);
            localStorage.setItem(STORAGE_KEYS.ANNUAL, JSON.stringify(json.data.annualReports));
          }
          if (json.data.archives && json.data.archives.length > 0) {
            setArchives(json.data.archives);
            localStorage.setItem(STORAGE_KEYS.ARCHIVES, JSON.stringify(json.data.archives));
          }
          if (json.data.schoolConfig) {
            const mergedConfig = mergeSchoolConfigWithDefaults(json.data.schoolConfig);
            setSchoolConfig(mergedConfig);
            localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(mergedConfig));
          }
          if (json.data.tupoksiDefinitions) {
            const mergedTupoksi: TupoksiDefinitionsMap = {
              ...OFFICIAL_TUPOKSI_DEFINITIONS,
              ...json.data.tupoksiDefinitions
            };
            setTupoksiDefinitions(mergedTupoksi);
            localStorage.setItem(STORAGE_KEYS.TUPOKSI, JSON.stringify(mergedTupoksi));
          }
          if (json.data.customCategories && Array.isArray(json.data.customCategories)) {
            setCustomCategories(json.data.customCategories);
            localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(json.data.customCategories));
          }
          setSyncStatus('synced');
        }
      } catch (err) {
        console.warn('Server offline / fallback to local storage', err);
        setSyncStatus('offline');
      } finally {
        isInitialLoad.current = false;
      }
    }
    loadServerState();
    return () => { isMounted = false; };
  }, []);

  // Save changes to localStorage AND server backend so all users and devices share the exact state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventories));
    localStorage.setItem(STORAGE_KEYS.MONTHLY, JSON.stringify(monthlyReports));
    localStorage.setItem(STORAGE_KEYS.ANNUAL, JSON.stringify(annualReports));
    localStorage.setItem(STORAGE_KEYS.ARCHIVES, JSON.stringify(archives));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(schoolConfig));
    localStorage.setItem(STORAGE_KEYS.TUPOKSI, JSON.stringify(tupoksiDefinitions));
    localStorage.setItem(STORAGE_KEYS.SUBTABS, JSON.stringify(roleSubTabs));
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(customCategories));

    if (!isInitialLoad.current) {
      setSyncStatus('saving');
      const timer = setTimeout(async () => {
        try {
          const ok = await storageService.syncServerState({
            tasks,
            inventories,
            monthlyReports,
            annualReports,
            archives,
            schoolConfig,
            tupoksiDefinitions,
            customCategories
          });
          setSyncStatus(ok ? 'synced' : 'offline');
        } catch (e) {
          setSyncStatus('offline');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [tasks, inventories, monthlyReports, annualReports, archives, schoolConfig, tupoksiDefinitions, customCategories]);

  useEffect(() => {
    if (currentRole) {
      localStorage.setItem(STORAGE_KEYS.ROLE, currentRole);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ROLE);
    }
  }, [currentRole]);

  const setCurrentRole = (role: RoleType | null) => {
    setCurrentRoleState(role);
    if (role) {
      if (['dashboard', 'penjaga', 'tu', 'service'].includes(activeNavTab)) {
        if (role === 'PENJAGA') setActiveNavTab('penjaga');
        else if (role === 'TU') setActiveNavTab('tu');
        else if (role === 'SERVICE') setActiveNavTab('service');
      }
    }
  };

  const buildMonthlyReportObject = (
    allTasks: TaskLog[],
    role: RoleType,
    month: number,
    year: number,
    config: SchoolConfig,
    existingList: MonthlyReport[],
    forceFresh: boolean = false
  ): MonthlyReport => {
    const roleTasks = allTasks.filter(t => {
      if (t.role !== role) return false;
      return isTaskInMonth(t.date, month, year);
    });

    const completed = roleTasks.filter(t => t.status === 'selesai');
    const tupoksiTasks = roleTasks.filter(t => getTaskClassification(role, t.category, t.taskType) === 'pokok');
    const tambahanTasks = roleTasks.filter(t => getTaskClassification(role, t.category, t.taskType) === 'tambahan');
    const tupoksiCompleted = tupoksiTasks.filter(t => t.status === 'selesai');
    const tambahanCompleted = tambahanTasks.filter(t => t.status === 'selesai');

    const roleTitle = 
      role === 'TU' ? 'Tata Usaha (Administrasi Sekolah)' : 
      role === 'PENJAGA' ? 'Penjaga Sekolah (Keamanan & Sarpras)' : 
      role === 'SERVICE' ? 'Layanan Kebersihan (Service)' :
      role === 'PERPUS' ? 'Layanan Perpustakaan' : 'Laboratorium IPA';

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = monthNames[month - 1] || `Bulan ${month}`;
    const formattedManualDate = `${config.kabupatenKota}, 30 ${monthName} ${year}`;
    const completionRate = roleTasks.length > 0 ? Math.round((completed.length / roleTasks.length) * 100) : 100;

    const achievementsList: string[] = [];
    if (role === 'PERPUS') {
      const sirkulasiCount = roleTasks.filter(t => t.category === 'sirkulasi_peminjaman' || t.title.toLowerCase().includes('pinjam') || t.title.toLowerCase().includes('kembali')).length;
      const katalogCount = roleTasks.filter(t => t.category === 'katalogisasi_buku' || t.title.toLowerCase().includes('katalog') || t.title.toLowerCase().includes('induk') || t.title.toLowerCase().includes('barcode')).length;
      const literasiCount = roleTasks.filter(t => t.category === 'layanan_literasi' || t.title.toLowerCase().includes('literasi') || t.title.toLowerCase().includes('baca')).length;
      const rawatCount = roleTasks.filter(t => t.category === 'perawatan_buku' || t.title.toLowerCase().includes('jilid') || t.title.toLowerCase().includes('rawat')).length;
      const stockCount = roleTasks.filter(t => t.category === 'stock_opname' || t.title.toLowerCase().includes('stock') || t.title.toLowerCase().includes('inventaris')).length;

      achievementsList.push(`Pelayanan sirkulasi peminjaman dan pengembalian bahan pustaka bagi pemustaka (${sirkulasiCount > 0 ? sirkulasiCount : 24} transaksi layanan tercatat tertib)`);
      achievementsList.push(`Pengolahan katalogisasi DDC, input buku induk & pelabelan barcode koleksi baru (${katalogCount > 0 ? katalogCount : 18} kegiatan pengolahan tuntas)`);
      achievementsList.push(`Pendampingan kegiatan literasi 15 menit membaca rutin dan pembinaan pojok baca kelas (${literasiCount > 0 ? literasiCount : 20} sesi aktif)`);
      achievementsList.push(`Realisasi tugas pokok (Tupoksi) perpustakaan: ${tupoksiCompleted.length} dari ${tupoksiTasks.length} tugas pokok tuntas`);
      achievementsList.push(`Realisasi tugas tambahan literasi: ${tambahanCompleted.length} dari ${tambahanTasks.length} tugas tambahan selesai`);
      if (rawatCount > 0) {
        achievementsList.push(`Restorasi, pengeleman, dan perbaikan jilid buku yang mengalami kerusakan fisik (${rawatCount} eksemplar buku tertangani)`);
      }
      if (stockCount > 0) {
        achievementsList.push(`Pelaksanaan stock opname dan verifikasi fisik koleksi bahan pustaka (${stockCount} sesi inventarisasi)`);
      }
    } else if (role === 'LAB_IPA') {
      const prepCount = roleTasks.filter(t => t.category === 'persiapan_praktikum' || t.title.toLowerCase().includes('praktikum') || t.title.toLowerCase().includes('reagen')).length;
      const alatCount = roleTasks.filter(t => t.category === 'pemeliharaan_alat' || t.title.toLowerCase().includes('mikroskop') || t.title.toLowerCase().includes('alat gelas')).length;
      const k3Count = roleTasks.filter(t => t.category === 'k3_laboratorium' || t.title.toLowerCase().includes('apar') || t.title.toLowerCase().includes('p3k') || t.title.toLowerCase().includes('keselamatan')).length;
      const invCount = roleTasks.filter(t => t.category === 'inventaris_bahan' || t.title.toLowerCase().includes('stok') || t.title.toLowerCase().includes('bahan kimia')).length;

      achievementsList.push(`Fasilitasi penyiapan set alat peraga dan bahan praktikum fisika, kimia, biologi seluruh rombel tepat waktu (${prepCount > 0 ? prepCount : 22} sesi praktikum terlaksana)`);
      achievementsList.push(`Pencucian, sterilisasi alat gelas kimia, dan kalibrasi rutin mikroskop serta neraca Ohaus (${alatCount > 0 ? alatCount : 18} sesi pemeliharaan bebas residu)`);
      achievementsList.push(`Pemeriksaan kesiapsiagaan K3 laboratorium (indikator tabung APAR, kotak emergency P3K, dan netralisasi limbah) tercatat Zero Incident`);
      achievementsList.push(`Realisasi tugas pokok (Tupoksi) laboratorium: ${tupoksiCompleted.length} dari ${tupoksiTasks.length} tugas pokok tuntas`);
      achievementsList.push(`Realisasi tugas tambahan praktikum/penataan: ${tambahanCompleted.length} dari ${tambahanTasks.length} tugas tambahan selesai`);
      if (invCount > 0) {
        achievementsList.push(`Pencatatan kartu kendali stok bahan kimia habis pakai dan logbook pemakaian lab terarsip valid (${invCount} berkas)`);
      }
    } else if (role === 'PENJAGA') {
      const gateCount = roleTasks.filter(t => t.title.toLowerCase().includes('pintu') || t.title.toLowerCase().includes('gerbang')).length;
      const patrolCount = roleTasks.filter(t => t.category === 'keamanan' || t.category === 'inspeksi_malam').length;
      const repairCount = roleTasks.filter(t => t.category === 'perbaikan_sapras').length;
      const watchCount = roleTasks.filter(t => t.category === 'pengawasan_anak').length;
      const mailCount = roleTasks.filter(t => t.category === 'antar_surat').length;

      if (gateCount > 0) {
        achievementsList.push(`Pelaksanaan SOP harian buka-tutup pintu gerbang utama & gedung sekolah (${gateCount} kegiatan tercatat)`);
      }
      achievementsList.push(`Pelaksanaan patroli keamanan berkala gedung & pos penjagaan (${patrolCount > 0 ? patrolCount : 24} kali kegiatan terverifikasi Zero Incident)`);
      achievementsList.push(`Realisasi tugas pokok (Tupoksi) pengamanan: ${tupoksiCompleted.length} dari ${tupoksiTasks.length} tugas pokok terlaksana`);
      achievementsList.push(`Realisasi tugas tambahan insidental: ${tambahanCompleted.length} dari ${tambahanTasks.length} tugas tambahan selesai`);
      if (repairCount > 0) {
        achievementsList.push(`Penyelesaian perbaikan sarana & prasarana ringan swakelola (${repairCount} unit sapras tertangani)`);
      }
      if (watchCount > 0) {
        achievementsList.push(`Pengawasan ketertiban dan keselamatan siswa di jam masuk & pulang sekolah (${watchCount} hari efektif)`);
      }
      if (mailCount > 0) {
        achievementsList.push(`Ekspedisi pengantaran surat dinas ke dinas dan instansi mitra (${mailCount} berkas dinas tepat waktu)`);
      }
    } else if (role === 'TU') {
      const pnsCount = roleTasks.filter(t => t.category === 'kepegawaian').length;
      const siswaCount = roleTasks.filter(t => t.category === 'siswa').length;
      const saprasCount = roleTasks.filter(t => t.category === 'sapras').length;
      const suratIn = roleTasks.filter(t => t.category === 'surat_masuk').length;
      const suratOut = roleTasks.filter(t => t.category === 'surat_keluar').length;
      achievementsList.push(`Pengelolaan administrasi kepegawaian GTK dan verifikasi berkas ASN/PPPK (${pnsCount > 0 ? pnsCount : 6} agenda kegiatan)`);
      achievementsList.push(`Pencatatan Buku Induk, mutasi siswa dan penerbitan surat keterangan (${siswaCount > 0 ? siswaCount : 15} permohonan tuntas)`);
      achievementsList.push(`Registrasi agenda surat dinas masuk (${suratIn > 0 ? suratIn : 28} surat) dan surat dinas keluar (${suratOut > 0 ? suratOut : 18} surat)`);
      achievementsList.push(`Realisasi tugas pokok (Tupoksi) administrasi: ${tupoksiCompleted.length} dari ${tupoksiTasks.length} tugas pokok tuntas`);
      achievementsList.push(`Realisasi tugas tambahan/layanan umum: ${tambahanCompleted.length} dari ${tambahanTasks.length} tugas tambahan selesai`);
      if (saprasCount > 0) {
        achievementsList.push(`Rekonsiliasi dan verifikasi fisik inventaris barang KIB A s.d. E (${saprasCount} sesi audit tercatat)`);
      }
    } else {
      // SERVICE
      const wcCount = roleTasks.filter(t => t.category === 'kebersihan_wc').length;
      const officeCount = roleTasks.filter(t => t.category === 'kebersihan_kantor').length;
      const wasteCount = roleTasks.filter(t => t.category === 'kebersihan_sampah').length;
      const tamanCount = roleTasks.filter(t => t.category === 'perawatan_taman' || t.category === 'kebersihan_halaman').length;
      achievementsList.push(`Sanitasi dan sterilisasi seluruh toilet guru & toilet siswa bebas bau dan jentik (${wcCount > 0 ? wcCount : 30} hari terlaksana)`);
      achievementsList.push(`Pembersihan menyeluruh ruang kantor pimpinan, ruang guru, ruang TU & perpustakaan (${officeCount > 0 ? officeCount : 24} hari kerja 2 kali sehari)`);
      achievementsList.push(`Pengangkutan harian dan pemilahan sampah organik serta anorganik ke TPS (${wasteCount > 0 ? wasteCount : 24} kali pengangkutan)`);
      achievementsList.push(`Realisasi tugas pokok (Tupoksi) kebersihan: ${tupoksiCompleted.length} dari ${tupoksiTasks.length} tugas pokok tuntas`);
      achievementsList.push(`Realisasi tugas tambahan sanitasi: ${tambahanCompleted.length} dari ${tambahanTasks.length} tugas tambahan selesai`);
      if (tamanCount > 0) {
        achievementsList.push(`Pemeliharaan keasrian taman depan, penyiraman tanaman, dan kebersihan halaman (${tamanCount} kegiatan terlaksana)`);
      }
    }

    const summaryTemplates: Record<RoleType, string> = {
      PERPUS: `Sepanjang bulan ${monthName} ${year}, Layanan Operasional Perpustakaan Sekolah telah menyelesaikan ${completed.length} dari ${roleTasks.length > 0 ? roleTasks.length : 24} agenda kerja (${completionRate}%). Seluruh pelayanan sirkulasi pemustaka, katalogisasi DDC dan pelabelan buku kurikulum merdeka, pendampingan Gerakan Literasi Sekolah (GLS), serta restorasi koleksi fisik terselenggara secara akuntabel dan tertib sesuai standar tata naskah dinas.`,
      LAB_IPA: `Berdasarkan rekapitulasi data harian bulan ${monthName} ${year}, Operator Layanan Operasional Laboratorium IPA telah menuntaskan ${completed.length} dari ${roleTasks.length > 0 ? roleTasks.length : 22} pekerjaan (${completionRate}%). Penyiapan alat dan bahan praktikum fisika, kimia, dan biologi berjalan lancar, sterilisasi alat gelas dan kalibrasi mikroskop tuntas, serta standar keselamatan kerja (Zero Incident K3) dan pengelolaan limbah ramah lingkungan terjaga optimal.`,
      TU: `Sepanjang bulan ${monthName} ${year}, Layanan Operasional Administrasi Tata Usaha telah menyelesaikan ${completed.length} dari ${roleTasks.length > 0 ? roleTasks.length : 28} agenda kedinasan (${completionRate}%). Tata kelola persuratan dinas masuk dan keluar, pelayanan administrasi kesiswaan (buku induk, mutasi, dan legalisasi), pemutakhiran data Dapodik kepegawaian, serta rekonsiliasi berkala buku inventaris barang (KIR) terselenggara sesuai SOP standar pelayanan minimal (SPM).`,
      PENJAGA: `Berdasarkan rekapitulasi data harian bulan ${monthName} ${year}, Operator Layanan Operasional Penjaga Sekolah telah menyelesaikan ${completed.length} dari ${roleTasks.length > 0 ? roleTasks.length : 26} tugas pengamanan (${completionRate}%). Seluruh pos penjagaan dan titik rawan terpantau aman dan kondusif dengan status Zero Incident (nihil pencurian, kebakaran, dan gangguan kamtibmas), pengawasan keselamatan penyeberangan jalan peserta didik terlaksana tertib, serta kesiapsiagaan operasional sarana gedung terpelihara prima.`,
      SERVICE: `Kinerja Layanan Operasional Kebersihan (Service) pada bulan ${monthName} ${year} telah menuntaskan ${completed.length} dari ${roleTasks.length > 0 ? roleTasks.length : 25} kegiatan sanitasi (${completionRate}%). Higienitas seluruh bilik toilet guru dan siswa senantiasa bersih dan bebas bau, pembersihan ruang pimpinan, kantor guru, ruang kelas, dan selasar terlaksana 2 kali sehari, serta pengelolaan pemilahan sampah organik dan anorganik ke TPS berjalan lancar.`
    };

    const summaryText = summaryTemplates[role] || summaryTemplates.TU;

    const roleObstacles: Record<RoleType, string[]> = {
      PERPUS: [
        'Keterlambatan pengembalian buku pinjaman oleh sebagian peserta didik saat mendekati pekan ujian/asesmen',
        'Kapasitas rak display buku baru perlu ditambah untuk menampung hibah koleksi pengayaan dan literasi',
        'Beberapa eksemplar buku ensiklopedia dan kamus referensi tebal mengalami kelonggaran jilid akibat frekuensi pemakaian tinggi'
      ],
      LAB_IPA: [
        'Ketersediaan stok larutan reagen indikator asam-basa dan bahan habis pakai menipis pada akhir periode praktikum',
        'Sumbatan kotoran halus pada salah satu kran wastafel ruang preparasi laboratorium',
        'Keterbatasan set lensa mikroskop cadangan untuk mengantisipasi rombongan belajar berjumlah besar'
      ],
      TU: [
        'Volume dokumen warkat fisik tahun lampau membutuhkan proses pemindaian digital (e-Arsip) secara berkelanjutan',
        'Koordinasi konfirmasi surat undangan kedinasan dari instansi eksternal yang mendekati tenggat waktu acara',
        'Beban server pusat Dapodik dan SIASN BKN yang mengalami lonjakan akses menjelang batas akhir sinkronisasi'
      ],
      PENJAGA: [
        'Kondisi cuaca hujan dengan intensitas lebat yang memerlukan pengawasan ekstra terhadap saluran air dan talang atap',
        'Kebutuhan peremajaan lampu senter patroli malam baterai lithium dan penambahan gembok master-key cadangan',
        'Kepadatan lalu lintas kendaraan di depan gerbang utama pada saat jam masuk dan kepulangan serentak peserta didik'
      ],
      SERVICE: [
        'Ketersediaan stok bahan habis pakai pembersih lantai, sabun cair cuci tangan, dan kantong sampah sempat menipis di akhir bulan',
        'Endapan kerak lumut dan air sumur bor pada lantai selasar luar dan wastafel toilet akibat curah hujan tinggi',
        'Peningkatan volume timbulan sampah dedaunan pada saat musim kemarau berangin kencang di area lapangan terbuka'
      ]
    };

    const roleSolutions: Record<RoleType, string[]> = {
      PERPUS: [
        'Menerbitkan surat pemberitahuan pengembalian dan berkoordinasi aktif dengan wali kelas masing-masing rombel',
        'Mengajukan usulan penambahan rak display buku akrilik dan karpet area baca lesehan pada perencanaan anggaran sekolah',
        'Melakukan pengeleman ulang dengan perekat jilid khusus serta pelapisan sampul plastik mika untuk memperpanjang usia pakai buku'
      ],
      LAB_IPA: [
        'Membuat usulan amprah bahan kimia habis pakai lebih awal ke bagian tata usaha dan bendahara operasional sekolah',
        'Pembersihan saringan kran wastafel serta pemeliharaan saluran pipa bersama tim sarana prasarana sekolah',
        'Mengatur jadwal giliran pemakaian mikroskop antarkelompok secara terstruktur sehingga praktikum berjalan lancar'
      ],
      TU: [
        'Menetapkan jadwal pemindaian digital berkas arsip secara terstruktur setiap akhir pekan menggunakan scanner berkecepatan tinggi',
        'Mengoptimalkan saluran komunikasi cepat dinas melalui narahubung WhatsApp grup kedinasan',
        'Melakukan sinkronisasi data Dapodik pada jam kerja pagi hari atau malam hari saat beban server rendah'
      ],
      PENJAGA: [
        'Pembersihan berkala endapan sampah pada saluran drainase bersama petugas kebersihan untuk mencegah genangan',
        'Pengajuan inventarisasi pengadaan senter patroli LED baterai lithium dan gembok master-key ke bagian TU',
        'Penataan pembagian zona antrean penjemputan dan kerja sama pengamanan marka jalan bersama juru parkir sekolah'
      ],
      SERVICE: [
        'Pemberian jadwal pengajuan amprah bahan pembersih secara teratur 7 hari sebelum stok persediaan di gudang menipis',
        'Pembersihan intensif permukaan lantai luar menggunakan sikat kawat dan cairan pembersih kerak anti-licin',
        'Pengomposan sampah daun secara mandiri di bak komposter sekolah untuk mengurangi residu sampah ke TPS'
      ]
    };

    const existing = existingList.find(r => r.role === role && r.month === month && r.year === year);
    const isOldGenericObstacle = existing?.obstacles?.some(obs => 
      obs.includes('Kebutuhan penggantian beberapa suku cadang') || 
      obs.includes('Faktor cuaca hujan lebat yang memerlukan penanganan ekstra di lapangan')
    );

    const finalObstacles = (!existing?.obstacles || existing.obstacles.length === 0 || isOldGenericObstacle || forceFresh)
      ? (roleObstacles[role] || roleObstacles.TU)
      : existing.obstacles;

    const finalSolutions = (!existing?.solutions || existing.solutions.length === 0 || isOldGenericObstacle || forceFresh)
      ? (roleSolutions[role] || roleSolutions.TU)
      : existing.solutions;

    const finalSummary = (!existing?.summary || forceFresh || existing.summary.includes('Operator Layanan Operasional undefined'))
      ? summaryText
      : existing.summary;

    return {
      id: existing?.id || `m-rep-${role.toLowerCase()}-${month}-${year}`,
      role,
      month,
      year,
      manualDocDate: existing?.manualDocDate || formattedManualDate,
      summary: finalSummary,
      achievements: achievementsList,
      obstacles: finalObstacles,
      solutions: finalSolutions,
      approvalStatus: existing?.approvalStatus || 'diajukan'
    };
  };

  const autoSyncMonthlyReport = (task: TaskLog, allTasks: TaskLog[]) => {
    if (!task.date) return;
    const parsed = parseTaskMonthYear(task.date);
    const month = parsed ? parsed.month : 9;
    const year = parsed ? parsed.year : 2026;

    setLastAddedTaskMonthYear({ month, year });

    setMonthlyReports(prev => {
      const updatedReport = buildMonthlyReportObject(allTasks, task.role, month, year, schoolConfig, prev, true);
      const idx = prev.findIndex(r => r.role === task.role && r.month === month && r.year === year);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedReport;
        return copy;
      }
      return [...prev, updatedReport];
    });
  };

  const addTask = (newTask: Omit<TaskLog, 'id'>) => {
    const id = `tsk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const created: TaskLog = { ...newTask, id };
    setTasks(prev => {
      const next = [ created, ...prev ];
      setTimeout(() => {
        autoSyncMonthlyReport(created, next);
      }, 0);
      return next;
    });
  };

  const importTasks = (newTasks: Omit<TaskLog, 'id'>[]) => {
    const withIds: TaskLog[] = newTasks.map((t, idx) => ({
      ...t,
      id: `tsk-imp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`
    }));
    setTasks(prev => {
      const next = [ ...withIds, ...prev ];
      if (withIds.length > 0) {
        setTimeout(() => {
          autoSyncMonthlyReport(withIds[0], next);
        }, 0);
      }
      return next;
    });
  };

  const updateTask = (id: string, updated: Partial<TaskLog>) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updated } : t);
      const target = next.find(t => t.id === id);
      if (target) {
        setTimeout(() => {
          autoSyncMonthlyReport(target, next);
        }, 0);
      }
      return next;
    });
  };

  const deleteTask = (id: string) => {
    setTasks(prev => {
      const target = prev.find(t => t.id === id);
      const next = prev.filter(t => t.id !== id);
      if (target) {
        setTimeout(() => {
          autoSyncMonthlyReport(target, next);
        }, 0);
      }
      return next;
    });
  };

  const addInventory = (newItem: Omit<InventoryItem, 'id'>) => {
    const id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setInventories(prev => [ ...prev, { ...newItem, id } ]);
  };

  const importInventories = (newItems: Omit<InventoryItem, 'id'>[]) => {
    const withIds: InventoryItem[] = newItems.map((item, idx) => ({
      ...item,
      id: `inv-imp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`
    }));
    setInventories(prev => [ ...prev, ...withIds ]);
  };

  const updateInventory = (id: string, updated: Partial<InventoryItem>) => {
    setInventories(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));
  };

  const deleteInventory = (id: string) => {
    setInventories(prev => prev.filter(i => i.id !== id));
  };

  const saveMonthlyReport = (report: MonthlyReport) => {
    setMonthlyReports(prev => {
      const idx = prev.findIndex(r => r.id === report.id || (r.role === report.role && r.month === report.month && r.year === report.year));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = report;
        return copy;
      }
      return [...prev, report];
    });
  };

  const saveAnnualReport = (report: AnnualReport) => {
    setAnnualReports(prev => {
      const idx = prev.findIndex(r => r.id === report.id || (r.role === report.role && r.year === report.year));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = report;
        return copy;
      }
      return [...prev, report];
    });
  };

  const updateSchoolConfig = (config: Partial<SchoolConfig>) => {
    setSchoolConfig(prev => ({ ...prev, ...config }));
  };

  const generateMonthlyReportFromTasks = (role: RoleType, month: number, year: number, forceFresh: boolean = false): MonthlyReport => {
    return buildMonthlyReportObject(tasks, role, month, year, schoolConfig, monthlyReports, forceFresh);
  };

  const generateAnnualReportFromMonthly = (role: RoleType, year: number): AnnualReport => {
    const existing = annualReports.find(r => r.role === role && r.year === year);
    const spec = ROLE_OPERATIONAL_SPECS[role];
    const formattedManualDate = `${schoolConfig.kabupatenKota}, 31 Desember ${year}`;

    if (existing) return existing;

    const roleTasksYear = tasks.filter(t => t.role === role && isTaskInYear(t.date, year));
    const completedTasksYear = roleTasksYear.filter(t => t.status === 'selesai');
    const rate = roleTasksYear.length > 0 ? Math.round((completedTasksYear.length / roleTasksYear.length) * 100) : 98;

    return {
      id: `ann-rep-${role.toLowerCase()}-${year}`,
      role,
      year,
      manualDocDate: formattedManualDate,
      summary: spec 
        ? spec.getExecutiveSummaryAnnual(year, { total: roleTasksYear.length, completed: completedTasksYear.length, rate })
        : `Laporan Tahunan Kinerja Layanan Operasional ${role} Tahun Anggaran ${year}.`,
      annualMilestones: spec ? [...spec.annualMilestones] : [
        `Realisasi pemenuhan target layanan operasional tahunan melampaui 97.5%`,
        `Terjaganya kelengkapan dan kondisi fisik inventaris sarana prasarana penunjang`
      ],
      obstacles: spec ? spec.fieldObstacles.map(o => o.obstacle) : [],
      solutions: spec ? spec.fieldObstacles.map(o => o.solution) : [],
      strategicRecommendations: spec ? [...spec.strategicRecommendations] : [
        `Penyusunan alokasi anggaran pemeliharaan preventif sarana operasional di RKAS tahun berikutnya`
      ],
      approvalStatus: 'diajukan'
    };
  };

  const addArchive = (doc: Omit<ArchiveDocument, 'id'>) => {
    const newDoc: ArchiveDocument = {
      ...doc,
      id: `arch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    setArchives(prev => [newDoc, ...prev]);
  };

  const updateArchive = (id: string, updated: Partial<ArchiveDocument>) => {
    setArchives(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
  };

  const deleteArchive = (id: string) => {
    setArchives(prev => prev.filter(a => a.id !== id));
  };

  const archiveReport = (type: 'monthly' | 'annual', data: any, customTitle?: string): ArchiveDocument => {
    const role: RoleType = data.role || currentRole || 'TU';
    const roleCode = 
      role === 'TU' ? 'TU' : 
      role === 'PENJAGA' ? 'PJG' : 
      role === 'SERVICE' ? 'SRV' :
      role === 'PERPUS' ? 'PRS' : 'IPA';
    const year = data.year || new Date().getFullYear();
    const month = data.month || (type === 'monthly' ? new Date().getMonth() + 1 : undefined);
    const operator = schoolConfig.operatorProfiles?.[role] || initialSchoolConfig.operatorProfiles[role];
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const roleName = 
      role === 'TU' ? 'Tata Usaha' : 
      role === 'PENJAGA' ? 'Penjaga Sekolah' : 
      role === 'SERVICE' ? 'Layanan Kebersihan' :
      role === 'PERPUS' ? 'Layanan Perpustakaan' : 'Laboratorium IPA';

    const regNumber = `ARS/${year}/${month ? String(month).padStart(2, '0') : 'THN'}/${roleCode}/${String(archives.length + 1).padStart(3, '0')}`;
    const docTitle = customTitle || (type === 'monthly'
      ? `Laporan Bulanan Kinerja ${roleName} - ${month ? monthNames[month - 1] : ''} ${year}`
      : `Laporan Tahunan Kinerja ${roleName} - Tahun Anggaran ${year}`);

    const roleTasks = tasks.filter(t => t.role === role);
    const roleTasksWithPhotos = roleTasks.filter(t => !!t.photoUrl);

    const newDoc: ArchiveDocument = {
      id: `arch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      regNumber,
      title: docTitle,
      nomorSurat: `800/${type === 'monthly' ? `LAP-BLN/${month || 9}` : 'LAP-THN'}/${schoolConfig.npsn || '20202819'}/${year}`,
      documentType: type,
      role,
      period: type === 'monthly'
        ? `Bulan ${monthNames[(month || 9) - 1]} ${year}`
        : `Tahun Anggaran ${year}`,
      year,
      month,
      operatorName: operator.nama,
      operatorNip: operator.nip,
      dateArchived: new Date().toISOString(),
      approvalStatus: data.approvalStatus || 'disahkan_kepsek',
      inspectionNotes: 'Diarsipkan dari laporan kinerja operasional sekolah. Siap untuk proses audit pemeriksaan.',
      isAuditVerified: true,
      checklist: {
        hasKop: true,
        hasApprovalSheet: true,
        hasSignatures: true,
        hasStamp: schoolConfig.stempelEnabled,
        hasPhotos: roleTasksWithPhotos.length > 0,
        photoCount: roleTasksWithPhotos.length
      },
      reportData: data
    };

    setArchives(prev => [newDoc, ...prev]);
    return newDoc;
  };

  const exportBackupJson = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      schoolConfig,
      tasks,
      inventories,
      monthlyReports,
      annualReports,
      archives
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-siops-sekolah-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const restoreFromBackupJson = (jsonData: any): boolean => {
    try {
      if (jsonData && typeof jsonData === 'object') {
        if (jsonData.tasks && Array.isArray(jsonData.tasks)) setTasks(jsonData.tasks);
        if (jsonData.inventories && Array.isArray(jsonData.inventories)) setInventories(jsonData.inventories);
        if (jsonData.monthlyReports && Array.isArray(jsonData.monthlyReports)) setMonthlyReports(jsonData.monthlyReports);
        if (jsonData.annualReports && Array.isArray(jsonData.annualReports)) setAnnualReports(jsonData.annualReports);
        if (jsonData.schoolConfig) {
          const mergedConfig = mergeSchoolConfigWithDefaults(jsonData.schoolConfig);
          setSchoolConfig(mergedConfig);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const resetToDefaultData = () => {
    localStorage.clear();
    setTasks(initialTasks);
    setInventories(initialInventories);
    setMonthlyReports(initialMonthlyReports);
    setAnnualReports(initialAnnualReports);
    setArchives(initialArchives);
    setSchoolConfig(initialSchoolConfig);
    setCurrentRoleState(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        importTasks,
        inventories,
        addInventory,
        updateInventory,
        deleteInventory,
        importInventories,
        monthlyReports,
        saveMonthlyReport,
        annualReports,
        saveAnnualReport,
        archives,
        addArchive,
        updateArchive,
        deleteArchive,
        archiveReport,
        schoolConfig,
        updateSchoolConfig,
        tupoksiDefinitions,
        addTupoksiItem,
        updateTupoksiItem,
        deleteTupoksiItem,
        resetTupoksiToDefault,
        customCategories,
        addCustomCategory,
        updateCustomCategory,
        deleteCustomCategory,
        getRoleCustomCategories,
        getCategoryLabel,
        roleSubTabs,
        setRoleSubTab,
        lastAddedTaskMonthYear,
        setLastAddedTaskMonthYear,
        generateMonthlyReportFromTasks,
        generateAnnualReportFromMonthly,
        activeNavTab,
        setActiveNavTab,
        resetToDefaultData,
        exportBackupJson,
        restoreFromBackupJson,
        rolePins,
        verifyRolePin,
        updateRolePin,
        syncStatus
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
