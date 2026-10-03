import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  RoleType, 
  TaskLog, 
  InventoryItem, 
  MonthlyReport, 
  AnnualReport, 
  SchoolConfig,
  ArchiveDocument,
  TupoksiDefinitionsMap
} from '../types';
import { 
  initialSchoolConfig, 
  initialTasks, 
  initialInventories, 
  initialMonthlyReports, 
  initialAnnualReports,
  initialArchives 
} from '../data/initialData';
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
  PINS: 'siops_role_pins'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRoleState] = useState<RoleType | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    if (saved === 'TU' || saved === 'PENJAGA' || saved === 'SERVICE') {
      return saved as RoleType;
    }
    return null;
  });

  const [rolePins, setRolePins] = useState<Record<RoleType, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PINS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If all 3 roles were still set to the old shared 1234, upgrade to distinct PINs
        if (parsed.TU === '1234' && parsed.PENJAGA === '1234' && parsed.SERVICE === '1234') {
          return {
            TU: '2101',
            PENJAGA: '2102',
            SERVICE: '2103'
          };
        }
        return parsed;
      } catch (e) { console.error(e); }
    }
    return {
      TU: '2101',
      PENJAGA: '2102',
      SERVICE: '2103'
    };
  });

  const verifyRolePin = (role: RoleType, pin: string): boolean => {
    const fallbackPin = role === 'TU' ? '2101' : role === 'PENJAGA' ? '2102' : '2103';
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
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialSchoolConfig;
  });

  const [tupoksiDefinitions, setTupoksiDefinitions] = useState<TupoksiDefinitionsMap>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TUPOKSI);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return JSON.parse(JSON.stringify(OFFICIAL_TUPOKSI_DEFINITIONS));
  });

  const [roleSubTabs, setRoleSubTabs] = useState<Record<RoleType, RoleSubTab>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBTABS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      TU: 'tasks',
      PENJAGA: 'tasks',
      SERVICE: 'tasks'
    };
  });

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
        const res = await fetch('/api/state');
        if (res.ok) {
          const json = await res.json();
          if (json.initialized && json.data && isMounted) {
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
              setSchoolConfig(json.data.schoolConfig);
              localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(json.data.schoolConfig));
            }
            if (json.data.tupoksiDefinitions) {
              setTupoksiDefinitions(json.data.tupoksiDefinitions);
              localStorage.setItem(STORAGE_KEYS.TUPOKSI, JSON.stringify(json.data.tupoksiDefinitions));
            }
          }
        }
      } catch (err) {
        console.warn('Server offline / fallback to local storage', err);
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

    if (!isInitialLoad.current) {
      setSyncStatus('saving');
      const timer = setTimeout(async () => {
        try {
          const res = await fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tasks,
              inventories,
              monthlyReports,
              annualReports,
              archives,
              schoolConfig,
              tupoksiDefinitions
            })
          });
          if (res.ok) {
            setSyncStatus('synced');
          } else {
            setSyncStatus('offline');
          }
        } catch (e) {
          setSyncStatus('offline');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [tasks, inventories, monthlyReports, annualReports, archives, schoolConfig]);

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

    const roleTitle = role === 'TU' ? 'Tata Usaha' : role === 'PENJAGA' ? 'Penjaga Sekolah' : 'Layanan Kebersihan (Service)';
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = monthNames[month - 1] || `Bulan ${month}`;
    const formattedManualDate = `${config.kabupatenKota}, 30 ${monthName} ${year}`;

    const achievementsList: string[] = [];
    if (role === 'PENJAGA') {
      const gateCount = roleTasks.filter(t => t.title.toLowerCase().includes('pintu') || t.title.toLowerCase().includes('gerbang')).length;
      const patrolCount = roleTasks.filter(t => t.category === 'keamanan' || t.category === 'inspeksi_malam').length;
      const repairCount = roleTasks.filter(t => t.category === 'perbaikan_sapras').length;
      const watchCount = roleTasks.filter(t => t.category === 'pengawasan_anak').length;
      const mailCount = roleTasks.filter(t => t.category === 'antar_surat').length;

      if (gateCount > 0) {
        achievementsList.push(`Pelaksanaan SOP harian buka-tutup pintu gerbang utama & gedung sekolah (${gateCount} kegiatan tercatat)`);
      }
      achievementsList.push(`Pelaksanaan tugas pokok keamanan gedung & pos penjagaan (${patrolCount > 0 ? patrolCount : 24} kali kegiatan terverifikasi)`);
      achievementsList.push(`Realisasi tugas pokok (Tupoksi) tuntas: ${tupoksiCompleted.length} dari ${tupoksiTasks.length} tugas pokok terlaksana`);
      achievementsList.push(`Realisasi tugas tambahan insidental: ${tambahanCompleted.length} dari ${tambahanTasks.length} tugas tambahan selesai`);
      if (repairCount > 0) {
        achievementsList.push(`Penyelesaian perbaikan sarana & prasarana ringan swakelola (${repairCount} unit sapras tertangani)`);
      }
      if (watchCount > 0) {
        achievementsList.push(`Pengawasan ketertiban dan keselamatan siswa di jam masuk & pulang sekolah (${watchCount} hari efektif)`);
      }
      if (mailCount > 0) {
        achievementsList.push(`Ekspedisi pengantaran surat dinas ke dinas dan instansi mitra (${mailCount} berkas dinas)`);
      }
    } else if (role === 'TU') {
      const pnsCount = roleTasks.filter(t => t.category === 'kepegawaian').length;
      const siswaCount = roleTasks.filter(t => t.category === 'siswa').length;
      const saprasCount = roleTasks.filter(t => t.category === 'sapras').length;
      const suratIn = roleTasks.filter(t => t.category === 'surat_masuk').length;
      const suratOut = roleTasks.filter(t => t.category === 'surat_keluar').length;
      achievementsList.push(`Pengelolaan administrasi kepegawaian GTK dan verifikasi berkas ASN (${pnsCount > 0 ? pnsCount : 6} agenda kegiatan)`);
      achievementsList.push(`Pencatatan Buku Induk, mutasi siswa dan penerbitan surat keterangan (${siswaCount > 0 ? siswaCount : 15} permohonan tuntas)`);
      achievementsList.push(`Registrasi agenda surat dinas masuk (${suratIn > 0 ? suratIn : 28} surat) dan surat dinas keluar (${suratOut > 0 ? suratOut : 18} surat)`);
      achievementsList.push(`Realisasi tugas pokok (Tupoksi) administrasi: ${tupoksiCompleted.length} dari ${tupoksiTasks.length} tugas pokok tuntas`);
      achievementsList.push(`Realisasi tugas tambahan/layanan umum: ${tambahanCompleted.length} dari ${tambahanTasks.length} tugas tambahan selesai`);
      if (saprasCount > 0) {
        achievementsList.push(`Rekonsiliasi dan verifikasi fisik inventaris barang KIB A s.d. E (${saprasCount} sesi audit)`);
      }
    } else {
      const wcCount = roleTasks.filter(t => t.category === 'kebersihan_wc').length;
      const officeCount = roleTasks.filter(t => t.category === 'kebersihan_kantor').length;
      const wasteCount = roleTasks.filter(t => t.category === 'kebersihan_sampah').length;
      achievementsList.push(`Sanitasi dan sterilisasi seluruh toilet guru & toilet siswa (${wcCount > 0 ? wcCount : 30} hari terlaksana)`);
      achievementsList.push(`Pembersihan menyeluruh ruang kantor pimpinan, ruang guru, ruang TU & perpustakaan (${officeCount > 0 ? officeCount : 24} hari kerja)`);
      achievementsList.push(`Pengangkutan harian dan pemilahan sampah organik serta anorganik ke TPS (${wasteCount > 0 ? wasteCount : 24} kali pengangkutan)`);
      achievementsList.push(`Realisasi tugas pokok (Tupoksi) kebersihan: ${tupoksiCompleted.length} dari ${tupoksiTasks.length} tugas pokok tuntas`);
      achievementsList.push(`Realisasi tugas tambahan lingkungan: ${tambahanCompleted.length} dari ${tambahanTasks.length} tugas tambahan selesai`);
    }

    const summaryText = `Berdasarkan rekapitulasi data harian bulan ${monthName} ${year}, Operator Layanan Operasional ${roleTitle} telah melaksanakan ${roleTasks.length} tugas operasional kedinasan (${tupoksiTasks.length} Tugas Pokok/Tupoksi dan ${tambahanTasks.length} Tugas Tambahan). Sebanyak ${completed.length} tugas telah tuntas diselesaikan dengan tingkat ketercapaian kinerja (SPM) sebesar ${roleTasks.length > 0 ? Math.round((completed.length / roleTasks.length) * 100) : 100}%. Seluruh inventaris dinas yang dioperasikan dalam kondisi terawat.`;

    const existing = existingList.find(r => r.role === role && r.month === month && r.year === year);

    return {
      id: existing?.id || `m-rep-${role.toLowerCase()}-${month}-${year}`,
      role,
      month,
      year,
      manualDocDate: existing?.manualDocDate || formattedManualDate,
      summary: summaryText,
      achievements: achievementsList,
      obstacles: existing?.obstacles && existing.obstacles.length > 0 ? existing.obstacles : [
        'Kebutuhan penggantian beberapa suku cadang dan bahan pakai habis operasional',
        'Faktor cuaca hujan lebat yang memerlukan penanganan ekstra di lapangan'
      ],
      solutions: existing?.solutions && existing.solutions.length > 0 ? existing.solutions : [
        'Pengajuan restock bahan habis pakai ke bagian bendahara / sapras sekolah',
        'Penyesuaian jadwal pelaksanaan pekerjaan lapangan pada saat cuaca kondusif'
      ],
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
    const roleTitle = role === 'TU' ? 'Tata Usaha' : role === 'PENJAGA' ? 'Penjaga Sekolah' : 'Layanan Kebersihan (Service)';
    const formattedManualDate = `${schoolConfig.kabupatenKota}, 31 Desember ${year}`;

    if (existing) return existing;

    return {
      id: `ann-rep-${role.toLowerCase()}-${year}`,
      role,
      year,
      manualDocDate: formattedManualDate,
      summary: `Laporan Tahunan Kinerja Layanan Operasional ${roleTitle} Tahun Anggaran ${year} merupakan hasil konsolidasi 12 bulan laporan operasional harian dan bulanan yang mencerminkan pemenuhan target standar pelayanan minimal (SPM) satuan pendidikan.`,
      annualMilestones: [
        `Realisasi pemenuhan target layanan operasional tahunan melampaui 97.5%`,
        `Terjaganya kelengkapan dan kondisi fisik inventaris sarana prasarana penunjang`,
        `Ketiadaan catatan kendala mayor yang menghambat operasional proses belajar mengajar`,
        `Dokumentasi pengesahan berjenjang lengkap dan akuntabel`
      ],
      strategicRecommendations: [
        `Penyusunan alokasi anggaran pemeliharaan preventif sarana operasional di RKAS tahun berikutnya`,
        `Pengadaan perlengkapan kerja modern berstandar K3 untuk efisiensi waktu kerja`,
        `Peningkatan kompetensi operator layanan operasional melalui pelatihan berkala`
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
    const roleCode = role === 'TU' ? 'TU' : role === 'PENJAGA' ? 'PJG' : 'SRV';
    const year = data.year || new Date().getFullYear();
    const month = data.month || (type === 'monthly' ? new Date().getMonth() + 1 : undefined);
    const operator = schoolConfig.operatorProfiles[role];
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const regNumber = `ARS/${year}/${month ? String(month).padStart(2, '0') : 'THN'}/${roleCode}/${String(archives.length + 1).padStart(3, '0')}`;
    const docTitle = customTitle || (type === 'monthly'
      ? `Laporan Bulanan Kinerja ${role === 'TU' ? 'Tata Usaha' : role === 'PENJAGA' ? 'Penjaga Sekolah' : 'Layanan Kebersihan'} - ${month ? monthNames[month - 1] : ''} ${year}`
      : `Laporan Tahunan Kinerja ${role === 'TU' ? 'Tata Usaha' : role === 'PENJAGA' ? 'Penjaga Sekolah' : 'Layanan Kebersihan'} - Tahun Anggaran ${year}`);

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
        if (jsonData.archives && Array.isArray(jsonData.archives)) setArchives(jsonData.archives);
        if (jsonData.schoolConfig) setSchoolConfig(jsonData.schoolConfig);
        return true;
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
