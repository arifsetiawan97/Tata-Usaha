import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  RoleType,
  TaskLog,
  InventoryItem,
  MonthlyReport,
  AnnualReport,
  SchoolConfig,
  SchoolOfficer,
  UserLetterheadConfig,
  UserSignatureConfig,
  ArchiveDocument,
  TupoksiDefinitionsMap,
  CustomCategory,
  LibraryBookItem,
  LibraryMemberItem,
  LibraryMemberStats,
  RoleSubTab,
  RegisteredAccessUser,
  ApprovedSchoolHeader,
  AccessSecurityRules,
  AdminProfile,
  UserAccountStatus,
  UserSchoolIdentity,
  AuthActionResult,
  SiteSettings,
  DatabaseCapacityQuickSummary,
  SavedBeritaAcaraRecord,
  DatabaseModuleMetrics,
  DatabaseMetricsSummary,
  SoftDeletedItem,
  DatabaseBackupMeta,
  BackupScheduleConfig,
  AuditLogEntry,
  StaffSubmissionItem,
  MigrationReport
} from '../types';
import {
  initialSchoolConfig,
  initialTasks,
  initialInventories,
  initialMonthlyReports,
  initialAnnualReports,
  initialArchives,
  initialCustomCategories,
  initialLibraryBooks,
  initialLibraryMembers,
  initialLibraryMemberStats
} from '../data/initialData';
import { ROLE_OPERATIONAL_SPECS } from '../data/roleOperationalSpecs';
import { AppStateData, ServerStorageMode, storageService, formatApiErrorMessage } from '../services/storageService';
import {
  isTaskInMonth,
  getTaskClassification,
  OFFICIAL_TUPOKSI_DEFINITIONS,
  parseTaskMonthYear
} from '../utils/taskClassification';
import {
  DEFAULT_ACCESS_RULES,
  mergeRegisteredUsers
} from '../utils/accessSync';
import {
  getEffectiveSchoolConfigForUser,
  getUserIsolationKey,
  hasActiveCustomLetterhead,
  hasActiveCustomSignature,
  mergeUserIsolatedRecords
} from '../utils/letterheadHelper';
import { generateAnnualNarrativeBundle } from '../utils/annualPerformanceHelper';

export type { RoleSubTab };

export const DEFAULT_WELCOME_HEADLINE = 'SELAMAT DATANG OPERATOR LAYANAN OPERASIONAL';
export const DEFAULT_WELCOME_SUBHEADLINE =
  'Portal Satu Pintu Layanan Tata Usaha, Penjaga Sekolah, Kebersihan, Perpustakaan & Laboratorium IPA';

export interface AdminAuthStatusState {
  envOverrideActive: boolean;
  isClaimed: boolean;
  setupRequired: boolean;
  isDefaultCredentials?: boolean;
}

export interface AdminDashboardState {
  databaseMetrics: DatabaseMetricsSummary | null;
  databaseRegistry: DatabaseModuleMetrics[];
  customDatabases: DatabaseModuleMetrics[];
  customDatabaseRecords: Record<string, any[]>;
  databaseQuotaBytes: number;
  softDeletedItems: SoftDeletedItem[];
  backups: DatabaseBackupMeta[];
  backupSchedule: BackupScheduleConfig;
  auditLogs: AuditLogEntry[];
  staffSubmissions: StaffSubmissionItem[];
  migrationLogs: MigrationReport[];
}

interface AppContextType {
  currentRole: RoleType | null;
  setCurrentRole: (role: RoleType | null) => void;
  tasks: TaskLog[];
  addTask: (task: Omit<TaskLog, 'id'>) => void;
  updateTask: (id: string, updated: Partial<TaskLog>) => void;
  deleteTask: (id: string) => void;
  deleteMultipleTasks: (ids: string[]) => void;
  importTasks: (newTasks: Omit<TaskLog, 'id'>[]) => void;
  inventories: InventoryItem[];
  addInventory: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventory: (id: string, updated: Partial<InventoryItem>) => void;
  deleteInventory: (id: string) => void;
  deleteMultipleInventories: (ids: string[]) => void;
  importInventories: (newItems: Omit<InventoryItem, 'id'>[]) => void;
  libraryBooks: LibraryBookItem[];
  addLibraryBook: (book: Omit<LibraryBookItem, 'id'>) => void;
  updateLibraryBook: (id: string, updated: Partial<LibraryBookItem>) => void;
  deleteLibraryBook: (id: string) => void;
  deleteMultipleLibraryBooks: (ids: string[]) => void;
  importLibraryBooks: (books: Omit<LibraryBookItem, 'id'>[]) => void;
  libraryMembers: LibraryMemberItem[];
  addLibraryMember: (member: Omit<LibraryMemberItem, 'id'>) => void;
  updateLibraryMember: (id: string, updated: Partial<LibraryMemberItem>) => void;
  deleteLibraryMember: (id: string) => void;
  deleteMultipleLibraryMembers: (ids: string[]) => void;
  importLibraryMembers: (newMembers: Omit<LibraryMemberItem, 'id'>[]) => void;
  libraryMemberStats: LibraryMemberStats;
  updateLibraryMemberStats: (stats: Partial<LibraryMemberStats>) => void;
  monthlyReports: MonthlyReport[];
  saveMonthlyReport: (report: MonthlyReport) => void;
  annualReports: AnnualReport[];
  saveAnnualReport: (report: AnnualReport) => void;
  archives: ArchiveDocument[];
  addArchive: (doc: Omit<ArchiveDocument, 'id'>) => void;
  updateArchive: (id: string, updated: Partial<ArchiveDocument>) => void;
  deleteArchive: (id: string) => void;
  archiveReport: (type: 'monthly' | 'annual', data: any, customTitle?: string) => ArchiveDocument;
  beritaAcaraHistory: SavedBeritaAcaraRecord[];
  saveBeritaAcaraRecord: (record: SavedBeritaAcaraRecord) => Promise<{ ok: boolean; message?: string }>;
  deleteBeritaAcaraRecord: (id: string) => Promise<{ ok: boolean; message?: string }>;
  schoolConfig: SchoolConfig;
  effectiveSchoolConfig: SchoolConfig;
  hasCustomLetterhead: boolean;
  hasCustomSignature: boolean;
  updateSchoolConfig: (config: Partial<SchoolConfig>) => void;
  saveUserLetterhead: (kop: Partial<UserLetterheadConfig> & { logoAplikasiUrl?: string }) => void;
  resetUserLetterhead: () => void;
  saveUserSignature: (payload: {
    kepalaSekolah?: SchoolOfficer;
    wakilKepalaSekolah?: SchoolOfficer;
    operatorProfile?: SchoolOfficer;
    role?: RoleType;
    stempelEnabled?: boolean;
    stempelTextLine1?: string;
    stempelTextLine2?: string;
    customStempelUrl?: string;
  }) => void;
  resetUserSignature: () => void;
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
  generateAnnualReportFromMonthly: (role: RoleType, year: number, forceFresh?: boolean) => AnnualReport;
  activeNavTab: string;
  setActiveNavTab: (tab: string) => void;
  resetToDefaultData: () => void;
  exportBackupJson: () => void;
  restoreFromBackupJson: (jsonData: any) => boolean;
  rolePins: Record<RoleType, string>;
  verifyRolePin: (role: RoleType, pin: string) => boolean;
  updateRolePin: (role: RoleType, newPin: string) => void;
  accessUsers: RegisteredAccessUser[];
  approvedRoleCounts: Record<RoleType, number>;
  accessRules: AccessSecurityRules;
  currentUser: RegisteredAccessUser | null;
  setCurrentUser: (user: RegisteredAccessUser | null) => void;
  registerAccessUser: (payload: {
    namaLengkap: string;
    username: string;
    role: RoleType;
    password: string;
    schoolIdentity?: UserSchoolIdentity;
  }) => Promise<AuthActionResult>;
  loginAccessUser: (payload: {
    username: string;
    password: string;
    expectedRole?: RoleType;
  }) => Promise<AuthActionResult>;
  logoutAccessUser: () => void;
  approveAccessUser: (userId: string, assignedPassword?: string) => Promise<AuthActionResult>;
  rejectAccessUser: (userId: string) => Promise<AuthActionResult>;
  deleteAccessUser: (userId: string) => Promise<AuthActionResult>;
  updateAccessUserPassword: (userId: string, newPassword: string) => Promise<AuthActionResult>;
  createAccessUserByAdmin: (payload: {
    namaLengkap: string;
    username: string;
    role: RoleType;
    password: string;
    status?: UserAccountStatus;
    schoolIdentity?: UserSchoolIdentity;
  }) => Promise<AuthActionResult>;
  updateAccessRules: (updates: Partial<AccessSecurityRules>) => Promise<AuthActionResult>;
  updateAdminPassword: (newPassword: string) => Promise<AuthActionResult>;
  updateAdminProfile: (payload: {
    currentPassword: string;
    newUsername: string;
    newEmail?: string;
    newNamaLengkap?: string;
    newPassword?: string;
  }) => Promise<AuthActionResult>;
  requestPasswordReset: (payload: { username: string; note?: string }) => Promise<AuthActionResult>;
  issueResetPasswordByAdmin: (userId: string, tempResetPassword: string) => Promise<AuthActionResult>;
  completePasswordResetWithNewPassword: (userId: string, newPassword: string) => Promise<AuthActionResult>;
  lookupTrackedAccount: (username: string) => Promise<AuthActionResult>;
  trackedUsername: string | null;
  setTrackedUsername: (username: string | null) => void;
  trackedUserAccount: RegisteredAccessUser | null;
  approvedSchoolHeader: ApprovedSchoolHeader | null;
  refreshAccessState: (force?: boolean) => Promise<RegisteredAccessUser[]>;
  syncStatus: 'synced' | 'saving' | 'offline';
  serverStorageMode: ServerStorageMode;
  cloudPersistent: boolean;
  isInitialLoading: boolean;
  connectionError: string | null;
  retryConnection: () => Promise<void>;
  siteSettings: SiteSettings;
  databaseCapacitySummary: DatabaseCapacityQuickSummary | null;
  customDatabases: DatabaseModuleMetrics[];
  customDatabaseRecords: Record<string, any[]>;
  staffSubmissions: StaffSubmissionItem[];
  isAdminAuthenticated: boolean;
  adminProfile: AdminProfile | null;
  adminAuthStatus: AdminAuthStatusState;
  adminDashboardData: AdminDashboardState;
  refreshAdminAuthStatus: () => Promise<AdminAuthStatusState>;
  claimAdminPassword: (password: string) => Promise<AuthActionResult>;
  loginAdminSession: (username: string, password: string) => Promise<AuthActionResult>;
  logoutAdminSession: () => void;
  refreshAdminDashboard: () => Promise<boolean>;
  actionFeedback: { ok: boolean; text: string } | null;
  clearActionFeedback: () => void;
  sessionExpiredNotice: string | null;
  clearSessionExpiredNotice: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ROLE_LABELS_MAP: Record<RoleType, string> = {
  TU: 'Tata Usaha (TU)',
  PENJAGA: 'Penjaga Sekolah',
  SERVICE: 'Service (Kebersihan)',
  PERPUS: 'Layanan Perpustakaan',
  LAB_IPA: 'Laboratorium IPA'
};

const STORAGE_KEYS = {
  TRACKED_USERNAME: 'siops_tracked_username',
  SUBTABS: 'siops_role_subtabs',
  PINS: 'siops_role_pins'
};

const EMPTY_ROLE_COUNTS: Record<RoleType, number> = {
  TU: 0,
  PENJAGA: 0,
  SERVICE: 0,
  PERPUS: 0,
  LAB_IPA: 0
};

export const mergeSchoolConfigWithDefaults = (
  sourceConfig: any,
  existingConfig?: SchoolConfig
): SchoolConfig => {
  if (!sourceConfig || typeof sourceConfig !== 'object') {
    return existingConfig || initialSchoolConfig;
  }
  const mergedLetterheads = mergeUserIsolatedRecords(
    existingConfig?.userLetterheads,
    sourceConfig.userLetterheads
  );
  const mergedSignatures = mergeUserIsolatedRecords(
    existingConfig?.userSignatures,
    sourceConfig.userSignatures
  );
  return {
    ...initialSchoolConfig,
    ...sourceConfig,
    kepalaSekolah: {
      ...initialSchoolConfig.kepalaSekolah,
      ...(sourceConfig.kepalaSekolah || {})
    },
    operatorProfiles: {
      TU: { ...initialSchoolConfig.operatorProfiles.TU, ...(sourceConfig.operatorProfiles?.TU || {}) },
      PENJAGA: { ...initialSchoolConfig.operatorProfiles.PENJAGA, ...(sourceConfig.operatorProfiles?.PENJAGA || {}) },
      SERVICE: { ...initialSchoolConfig.operatorProfiles.SERVICE, ...(sourceConfig.operatorProfiles?.SERVICE || {}) },
      PERPUS: { ...initialSchoolConfig.operatorProfiles.PERPUS, ...(sourceConfig.operatorProfiles?.PERPUS || {}) },
      LAB_IPA: { ...initialSchoolConfig.operatorProfiles.LAB_IPA, ...(sourceConfig.operatorProfiles?.LAB_IPA || {}) }
    },
    ...(mergedLetterheads ? { userLetterheads: mergedLetterheads } : {}),
    ...(mergedSignatures ? { userSignatures: mergedSignatures } : {})
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Active workspace role & user — only populated after server-verified authentication
  const [currentRole, setCurrentRoleState] = useState<RoleType | null>(null);
  const [currentUser, setCurrentUserState] = useState<RegisteredAccessUser | null>(null);

  const setCurrentUser = useCallback((user: RegisteredAccessUser | null) => {
    setCurrentUserState(user);
  }, []);

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
      } catch {
        // Ignore parse error
      }
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
      role === 'TU' ? '2101' : role === 'PENJAGA' ? '2102' : role === 'SERVICE' ? '2103' : role === 'PERPUS' ? '2104' : '2105';
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

  const [accessUsers, setAccessUsers] = useState<RegisteredAccessUser[]>([]);
  const [approvedRoleCounts, setApprovedRoleCounts] = useState<Record<RoleType, number>>(EMPTY_ROLE_COUNTS);
  const [accessRules, setAccessRules] = useState<AccessSecurityRules>(DEFAULT_ACCESS_RULES);

  const [trackedUsername, setTrackedUsernameState] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRACKED_USERNAME);
    return saved && saved.trim() ? saved.trim() : null;
  });
  const [trackedUserAccount, setTrackedUserAccount] = useState<RegisteredAccessUser | null>(null);
  const [approvedSchoolHeader, setApprovedSchoolHeader] = useState<ApprovedSchoolHeader | null>(null);

  const setTrackedUsername = useCallback((username: string | null) => {
    const clean = username && username.trim() ? username.trim() : null;
    setTrackedUsernameState(clean);
    if (clean) {
      localStorage.setItem(STORAGE_KEYS.TRACKED_USERNAME, clean);
    } else {
      localStorage.removeItem(STORAGE_KEYS.TRACKED_USERNAME);
      setTrackedUserAccount(null);
      setApprovedSchoolHeader(null);
    }
  }, []);

  const [activeNavTab, setActiveNavTab] = useState<string>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');
  const [serverStorageMode, setServerStorageMode] = useState<ServerStorageMode>('local-file');
  const [cloudPersistent, setCloudPersistent] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);

  const [actionFeedback, setActionFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const feedbackTimerRef = useRef<any>(null);
  const showActionFeedback = useCallback((ok: boolean, text: unknown) => {
    const safeText = formatApiErrorMessage(text, ok ? 'Aksi berhasil.' : 'Terjadi kesalahan.');
    setActionFeedback({ ok, text: safeText });
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setActionFeedback(null);
    }, 5500);
  }, []);
  const clearActionFeedback = useCallback(() => setActionFeedback(null), []);
  const clearSessionExpiredNotice = useCallback(() => setSessionExpiredNotice(null), []);

  // Core Operational State
  const [tasks, setTasks] = useState<TaskLog[]>(initialTasks);
  const [inventories, setInventories] = useState<InventoryItem[]>(initialInventories);
  const [libraryBooks, setLibraryBooks] = useState<LibraryBookItem[]>(initialLibraryBooks);
  const [libraryMembers, setLibraryMembers] = useState<LibraryMemberItem[]>(initialLibraryMembers);
  const [libraryMemberStats, setLibraryMemberStats] = useState<LibraryMemberStats>(initialLibraryMemberStats);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>(initialMonthlyReports);
  const [annualReports, setAnnualReports] = useState<AnnualReport[]>(initialAnnualReports);
  const [archives, setArchives] = useState<ArchiveDocument[]>(initialArchives);
  const [beritaAcaraHistory, setBeritaAcaraHistory] = useState<SavedBeritaAcaraRecord[]>([]);
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig>(initialSchoolConfig);
  const [tupoksiDefinitions, setTupoksiDefinitions] = useState<TupoksiDefinitionsMap>(() =>
    JSON.parse(JSON.stringify(OFFICIAL_TUPOKSI_DEFINITIONS))
  );
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(initialCustomCategories);

  // Governance, Site Settings & Admin Database State
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    welcomeHeadline: DEFAULT_WELCOME_HEADLINE,
    welcomeSubheadline: DEFAULT_WELCOME_SUBHEADLINE
  });
  const [databaseCapacitySummary, setDatabaseCapacitySummary] = useState<DatabaseCapacityQuickSummary | null>(null);
  const [customDatabases, setCustomDatabases] = useState<DatabaseModuleMetrics[]>([]);
  const [customDatabaseRecords, setCustomDatabaseRecords] = useState<Record<string, any[]>>({});
  const [staffSubmissions, setStaffSubmissions] = useState<StaffSubmissionItem[]>([]);

  // Admin Authentication & Console Dashboard State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [adminAuthStatus, setAdminAuthStatus] = useState<AdminAuthStatusState>({
    envOverrideActive: false,
    isClaimed: true,
    setupRequired: false,
    isDefaultCredentials: false
  });
  const [adminDashboardData, setAdminDashboardData] = useState<AdminDashboardState>({
    databaseMetrics: null,
    databaseRegistry: [],
    customDatabases: [],
    customDatabaseRecords: {},
    databaseQuotaBytes: 5 * 1024 * 1024,
    softDeletedItems: [],
    backups: [],
    backupSchedule: { enabled: true, intervalHours: 24, lastBackupAt: '' },
    auditLogs: [],
    staffSubmissions: [],
    migrationLogs: []
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
        return { ...defaultTabs, ...JSON.parse(saved) };
      } catch {
        // ignore
      }
    }
    return defaultTabs;
  });

  const [lastAddedTaskMonthYear, setLastAddedTaskMonthYear] = useState<{ month: number; year: number } | null>(null);

  const schoolConfigRef = useRef<SchoolConfig>(schoolConfig);
  schoolConfigRef.current = schoolConfig;
  const currentUserRef = useRef<RegisteredAccessUser | null>(currentUser);
  currentUserRef.current = currentUser;
  const accessUsersRef = useRef<RegisteredAccessUser[]>(accessUsers);
  accessUsersRef.current = accessUsers;
  const adminAuthStatusRef = useRef<AdminAuthStatusState>(adminAuthStatus);
  adminAuthStatusRef.current = adminAuthStatus;
  const hasHydratedFromServerRef = useRef(false);
  const isFetchingRef = useRef(false);

  const effectiveSchoolConfig = useMemo<SchoolConfig>(
    () => getEffectiveSchoolConfigForUser(schoolConfig, currentUser, currentRole),
    [schoolConfig, currentUser, currentRole]
  );

  const hasCustomLetterhead = useMemo<boolean>(
    () => hasActiveCustomLetterhead(schoolConfig, currentUser),
    [schoolConfig, currentUser]
  );

  const hasCustomSignature = useMemo<boolean>(
    () => hasActiveCustomSignature(schoolConfig, currentUser),
    [schoolConfig, currentUser]
  );

  const applyServerStatePayload = useCallback((serverData: AppStateData) => {
    if (!serverData) return;

    if (serverData.siteSettings && typeof serverData.siteSettings === 'object') {
      setSiteSettings({
        welcomeHeadline: serverData.siteSettings.welcomeHeadline?.trim() || DEFAULT_WELCOME_HEADLINE,
        welcomeSubheadline: serverData.siteSettings.welcomeSubheadline?.trim() || DEFAULT_WELCOME_SUBHEADLINE,
        updatedAt: serverData.siteSettings.updatedAt,
        updatedBy: serverData.siteSettings.updatedBy
      });
    }

    if (serverData.accessRules && typeof serverData.accessRules === 'object') {
      setAccessRules({ ...DEFAULT_ACCESS_RULES, ...serverData.accessRules });
    }

    if (serverData.approvedRoleCounts && typeof serverData.approvedRoleCounts === 'object') {
      setApprovedRoleCounts({ ...EMPTY_ROLE_COUNTS, ...serverData.approvedRoleCounts });
    }

    if (serverData.databaseCapacitySummary) {
      setDatabaseCapacitySummary(serverData.databaseCapacitySummary);
    } else if (serverData.databaseMetrics) {
      setDatabaseCapacitySummary({
        totalUsedBytes: serverData.databaseMetrics.totalUsedBytes,
        totalQuotaBytes: serverData.databaseMetrics.totalQuotaBytes,
        totalPercentUsed: serverData.databaseMetrics.totalPercentUsed,
        effectiveAlertLevel: serverData.databaseMetrics.effectiveAlertLevel
      });
    }

    if (serverData.schoolConfig) {
      setSchoolConfig(prev => mergeSchoolConfigWithDefaults(serverData.schoolConfig, prev));
    }

    // Operational collections hydrated on STAFF / ADMIN view
    if (!serverData.publicOnly) {
      if (Array.isArray(serverData.tasks)) setTasks(serverData.tasks);
      if (Array.isArray(serverData.inventories)) setInventories(serverData.inventories);
      if (Array.isArray(serverData.monthlyReports)) setMonthlyReports(serverData.monthlyReports);
      if (Array.isArray(serverData.annualReports)) setAnnualReports(serverData.annualReports);
      if (Array.isArray(serverData.archives)) setArchives(serverData.archives);
      if (Array.isArray(serverData.beritaAcaraHistory)) setBeritaAcaraHistory(serverData.beritaAcaraHistory);
    if (serverData.tupoksiDefinitions) {
      const baseTupoksi: any = {
        ...OFFICIAL_TUPOKSI_DEFINITIONS,
        ...serverData.tupoksiDefinitions
      };
      const userTupoksiMap = serverData.userTupoksiDefinitions;
      const activeUserKey = getUserIsolationKey(currentUserRef.current);
      const userOverlay = activeUserKey && userTupoksiMap ? userTupoksiMap[activeUserKey] : null;
      if (userOverlay && typeof userOverlay === 'object') {
        for (const rKey of ['TU', 'PENJAGA', 'SERVICE', 'PERPUS', 'LAB_IPA'] as RoleType[]) {
          if (userOverlay[rKey]) baseTupoksi[rKey] = userOverlay[rKey];
        }
      }
      setTupoksiDefinitions(baseTupoksi);
    }
    if (Array.isArray(serverData.customCategories)) setCustomCategories(serverData.customCategories);
    if (Array.isArray(serverData.libraryBooks)) setLibraryBooks(serverData.libraryBooks);
    if (Array.isArray(serverData.libraryMembers)) setLibraryMembers(serverData.libraryMembers);
    {
      const activeUserKey = getUserIsolationKey(currentUserRef.current);
      const userStats =
        activeUserKey && serverData.userLibraryMemberStats
          ? serverData.userLibraryMemberStats[activeUserKey]
          : null;
      if (userStats && typeof userStats === 'object') {
        setLibraryMemberStats(userStats);
      } else if (serverData.libraryMemberStats && typeof serverData.libraryMemberStats === 'object') {
        setLibraryMemberStats(serverData.libraryMemberStats);
      }
    }
    if (Array.isArray(serverData.customDatabases)) {
      setCustomDatabases(serverData.customDatabases);
    }
    if (serverData.customDatabaseRecords && typeof serverData.customDatabaseRecords === 'object') {
      setCustomDatabaseRecords(serverData.customDatabaseRecords);
    }
    if (Array.isArray(serverData.staffSubmissions)) {
      setStaffSubmissions(serverData.staffSubmissions);
    }
    if (Array.isArray(serverData.accessUsers)) {
      const merged = mergeRegisteredUsers(
        serverData.accessUsers,
        [],
        Array.isArray(serverData.deletedAccessUserIds) ? serverData.deletedAccessUserIds : []
      );
      setAccessUsers(merged);

      // Compute approved counts if not provided
      if (!serverData.approvedRoleCounts) {
        const counts = { ...EMPTY_ROLE_COUNTS };
        merged.forEach(u => {
          if (u.status === 'APPROVED' && counts[u.role] !== undefined) {
            counts[u.role] += 1;
          }
        });
        setApprovedRoleCounts(counts);
      }

      setCurrentUserState(prevUser => {
        if (!prevUser) return prevUser;
        const freshMatch = merged.find(u => u.id === prevUser.id);
        return freshMatch || prevUser;
      });
    }
  }

  if (serverData.isAdminView) {
    if (serverData.adminProfile !== undefined) {
      setAdminProfile(serverData.adminProfile || null);
    }
    setAdminDashboardData({
      databaseMetrics: serverData.databaseMetrics || null,
      databaseRegistry: serverData.databaseRegistry || [],
      customDatabases: serverData.customDatabases || [],
      customDatabaseRecords: serverData.customDatabaseRecords || {},
      databaseQuotaBytes: serverData.databaseQuotaBytes || 5 * 1024 * 1024,
      softDeletedItems: serverData.softDeletedItems || [],
      backups: serverData.backups || [],
      backupSchedule: serverData.backupSchedule || { enabled: true, intervalHours: 24, lastBackupAt: '' },
      auditLogs: serverData.auditLogs || [],
      staffSubmissions: serverData.staffSubmissions || [],
      migrationLogs: serverData.migrationLogs || []
    });
  }

  hasHydratedFromServerRef.current = true;
  }, []);

  const refreshAdminAuthStatus = useCallback(async (): Promise<AdminAuthStatusState> => {
    const res = await storageService.adminAuthStatus();
    if (res.ok && res.data) {
      const next = res.data;
      setAdminAuthStatus(prev => {
        if (
          prev.envOverrideActive === next.envOverrideActive &&
          prev.isClaimed === next.isClaimed &&
          prev.setupRequired === next.setupRequired &&
          prev.isDefaultCredentials === next.isDefaultCredentials
        ) {
          return prev;
        }
        return next;
      });
      return next;
    }
    return adminAuthStatusRef.current;
  }, []);

  const refreshAdminDashboard = useCallback(async (): Promise<boolean> => {
    if (!storageService.getAdminToken()) {
      setIsAdminAuthenticated(false);
      return false;
    }
    const res = await storageService.adminGetDashboard();
    if (!res.ok || !res.data?.data) {
      if (res.status === 401 || res.status === 403) {
        storageService.setAdminToken(null);
        setIsAdminAuthenticated(false);
      }
      return false;
    }
    setIsAdminAuthenticated(true);
    if (res.data.storageMode) setServerStorageMode(res.data.storageMode);
    applyServerStatePayload(res.data.data);
    return true;
  }, [applyServerStatePayload]);

  const fetchLatestState = useCallback(async (): Promise<RegisteredAccessUser[]> => {
    if (isFetchingRef.current) return accessUsersRef.current;
    isFetchingRef.current = true;
    try {
      const json = await storageService.fetchServerState();
      if (!json) {
        setServerStorageMode('offline');
        setCloudPersistent(false);
        setSyncStatus('offline');
        setConnectionError('Tidak dapat terhubung ke server Database Admin. Periksa koneksi jaringan Anda.');
        return accessUsersRef.current;
      }

      setConnectionError(null);
      if (json.storageMode) setServerStorageMode(json.storageMode);
      if (typeof json.cloudPersistent === 'boolean') setCloudPersistent(json.cloudPersistent);
      if (typeof json.adminSetupRequired === 'boolean') {
        setAdminAuthStatus(prev => ({
          ...prev,
          setupRequired: Boolean(json.adminSetupRequired),
          isClaimed: !json.adminSetupRequired
        }));
      }

      if (json.initialized && json.data) {
        applyServerStatePayload(json.data);
      }

      // Also refresh tracked user status silently if set
      if (trackedUsername) {
        const lookup = await storageService.authStatusLookup(trackedUsername);
        if (lookup.ok && lookup.data?.user) {
          setTrackedUserAccount(lookup.data.user);
          setApprovedSchoolHeader(
            lookup.data.user.status === 'APPROVED' ? lookup.data.approvedSchoolHeader || null : null
          );
        } else if (lookup.status === 404) {
          setTrackedUserAccount(null);
          setApprovedSchoolHeader(null);
        }
      }

      setSyncStatus('synced');
      return accessUsersRef.current;
    } catch {
      setServerStorageMode('offline');
      setCloudPersistent(false);
      setSyncStatus('offline');
      setConnectionError('Gagal menghubungi server Database Admin. Klik Coba Lagi untuk menghubungkan ulang.');
      return accessUsersRef.current;
    } finally {
      isFetchingRef.current = false;
      setIsInitialLoading(false);
    }
  }, [applyServerStatePayload, trackedUsername]);

  const refreshAccessState = useCallback(async (_force: boolean = false): Promise<RegisteredAccessUser[]> => {
    return fetchLatestState();
  }, [fetchLatestState]);

  const retryConnection = useCallback(async () => {
    setIsInitialLoading(true);
    setConnectionError(null);
    await fetchLatestState();
    await refreshAdminAuthStatus();
  }, [fetchLatestState, refreshAdminAuthStatus]);

  // Register auth-expired handler so 24h stability handles expired tokens gracefully
  useEffect(() => {
    storageService.setOnAuthExpired(type => {
      if (type === 'admin') {
        setIsAdminAuthenticated(false);
        setSessionExpiredNotice(
          'Sesi Admin Database telah berakhir demi keamanan. Silakan masuk kembali pada Panel Admin (perubahan Anda yang belum dikirim aman).'
        );
      } else {
        setSessionExpiredNotice(
          'Sesi operator Anda perlu diperbarui. Silakan masuk kembali untuk melanjutkan pengiriman ajuan ke Database Admin.'
        );
      }
    });
    return () => storageService.setOnAuthExpired(null);
  }, []);

  // Initial Hydration + Admin Auth Status Check
  useEffect(() => {
    fetchLatestState();
    refreshAdminAuthStatus();
  }, [fetchLatestState, refreshAdminAuthStatus]);

  // Sync tracked user notification immediately when trackedUsername changes
  useEffect(() => {
    if (!trackedUsername) {
      setTrackedUserAccount(null);
      setApprovedSchoolHeader(null);
      return;
    }
    storageService.authStatusLookup(trackedUsername).then(res => {
      if (res.ok && res.data?.user) {
        setTrackedUserAccount(res.data.user);
        setApprovedSchoolHeader(
          res.data.user.status === 'APPROVED' ? res.data.approvedSchoolHeader || null : null
        );
      }
    });
  }, [trackedUsername]);

  // 24-Hour Uptime Background Polling & Token Refresh (30 min token refresh + focus/online sync)
  useEffect(() => {
    const pollMs = currentRole ? 25000 : 12000;
    const stateInterval = setInterval(() => {
      fetchLatestState();
    }, pollMs);

    const tokenRefreshInterval = setInterval(() => {
      if (storageService.getStaffToken()) {
        storageService.authRefresh();
      }
      if (storageService.getAdminToken()) {
        storageService.adminAuthRefresh();
      }
    }, 30 * 60 * 1000); // Every 30 minutes

    const handleFocusOrOnline = () => {
      fetchLatestState();
    };

    window.addEventListener('focus', handleFocusOrOnline);
    window.addEventListener('online', handleFocusOrOnline);
    return () => {
      clearInterval(stateInterval);
      clearInterval(tokenRefreshInterval);
      window.removeEventListener('focus', handleFocusOrOnline);
      window.removeEventListener('online', handleFocusOrOnline);
    };
  }, [currentRole, fetchLatestState]);

  // Helper: Persist Admin mutation directly to server OR submit Staff Proposal queue
  const persistDirectAdminState = useCallback(
    async (partialState: Partial<AppStateData>, fallbackActionName?: string): Promise<boolean> => {
      if (storageService.getAdminToken()) {
        setSyncStatus('saving');
        const res = await storageService.syncServerStateDetailed({
          ...partialState,
          clientHydratedFromServer: true
        });
        if (res.ok) {
          setSyncStatus('synced');
          if (res.data) applyServerStatePayload(res.data);
          return true;
        }
        setSyncStatus(storageService.getAdminToken() ? 'synced' : 'offline');
        showActionFeedback(
          false,
          formatApiErrorMessage(res.error, `Gagal menyimpan ${fallbackActionName || 'perubahan'} ke Database Admin.`)
        );
        return false;
      }
      return false;
    },
    [applyServerStatePayload, showActionFeedback]
  );

  const persistRecordPermanent = useCallback(
    async (
      collection: string,
      operationType: 'CREATE' | 'UPDATE',
      record: any,
      fallbackLabel: string,
      options?: { silent?: boolean }
    ): Promise<{ ok: boolean; savedRecord?: any; replacedId?: string | null; message?: string }> => {
      const hasStaffSession = Boolean(storageService.getStaffToken());
      const hasAdminSession = Boolean(storageService.getAdminToken());

      if (hasStaffSession || (hasAdminSession && currentUserRef.current)) {
        setSyncStatus('saving');
        const res = await storageService.staffSelfSave({
          actionType: 'SAVE_RECORD',
          collection,
          payload: record
        });
        setSyncStatus('synced');
        if (res.ok && res.data?.savedRecord) {
          if (res.data.databaseMetrics) {
            setDatabaseCapacitySummary({
              totalUsedBytes: res.data.databaseMetrics.totalUsedBytes,
              totalQuotaBytes: res.data.databaseMetrics.totalQuotaBytes,
              totalPercentUsed: res.data.databaseMetrics.totalPercentUsed,
              effectiveAlertLevel: res.data.databaseMetrics.effectiveAlertLevel
            });
          }
          const msg = formatApiErrorMessage(
            res.data.message,
            `${fallbackLabel} tersimpan permanen untuk akun Anda.`
          );
          if (!options?.silent) showActionFeedback(true, msg);
          return {
            ok: true,
            savedRecord: res.data.savedRecord,
            replacedId: res.data.replacedId || null,
            message: msg
          };
        }
        const errMsg = formatApiErrorMessage(res.error, `Gagal menyimpan ${fallbackLabel}.`);
        if (!options?.silent) showActionFeedback(false, errMsg);
        return { ok: false, message: errMsg };
      }

      if (hasAdminSession) {
        setSyncStatus('saving');
        const res =
          operationType === 'CREATE'
            ? await storageService.adminCreateRecord(collection, record)
            : await storageService.adminUpdateRecord(collection, record.id, record);
        setSyncStatus('synced');
        if (res.ok) {
          if (res.data?.databaseMetrics) {
            setDatabaseCapacitySummary({
              totalUsedBytes: res.data.databaseMetrics.totalUsedBytes,
              totalQuotaBytes: res.data.databaseMetrics.totalQuotaBytes,
              totalPercentUsed: res.data.databaseMetrics.totalPercentUsed,
              effectiveAlertLevel: res.data.databaseMetrics.effectiveAlertLevel
            });
          }
          const savedRecord = (res.data as any)?.created || (res.data as any)?.updated || record;
          if (!options?.silent) showActionFeedback(true, `${fallbackLabel} tersimpan permanen di Database Admin.`);
          return { ok: true, savedRecord };
        }
        const errMsg = formatApiErrorMessage(res.error, `Gagal menyimpan ${fallbackLabel}.`);
        if (!options?.silent) showActionFeedback(false, errMsg);
        return { ok: false, message: errMsg };
      }

      const authMsg = 'Silakan masuk terlebih dahulu agar perubahan tersimpan permanen.';
      if (!options?.silent) showActionFeedback(false, authMsg);
      return { ok: false, message: authMsg };
    },
    [showActionFeedback]
  );

  const upsertIntoStateList = <T extends { id: string }>(
    prev: T[],
    saved: T,
    replacedId?: string | null,
    prependIfNew = true
  ): T[] => {
    const filtered = prev.filter(item => item.id !== saved.id && (!replacedId || item.id !== replacedId));
    const existed = prev.some(item => item.id === saved.id || (replacedId && item.id === replacedId));
    if (existed) {
      return prev.map(item => (item.id === saved.id || (replacedId && item.id === replacedId) ? saved : item));
    }
    return prependIfNew ? [saved, ...filtered] : [...filtered, saved];
  };

  const performAdminOnlySoftDelete = useCallback(
    async (collection: string, id: string, label: string): Promise<boolean> => {
      if (!storageService.getAdminToken()) {
        showActionFeedback(
          false,
          `Penghapusan ${label} dinonaktifkan untuk non-admin! Semua penghapusan wajib melalui otorisasi Admin Database Satu Pintu (Soft-Delete).`
        );
        return false;
      }
      setSyncStatus('saving');
      const res = await storageService.adminSoftDeleteRecord(collection, id);
      setSyncStatus('synced');
      if (res.ok) {
        showActionFeedback(true, `${label} dipindahkan ke Arsip Sementara (Soft-Delete) Database Admin.`);
        return true;
      }
      showActionFeedback(false, formatApiErrorMessage(res.error, `Gagal menghapus ${label}.`));
      return false;
    },
    [showActionFeedback]
  );

  // =========================================================================
  // ROLE & NAVIGATION
  // =========================================================================

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

  const setRoleSubTab = (role: RoleType, tab: RoleSubTab) => {
    setRoleSubTabs(prev => {
      const next = { ...prev, [role]: tab };
      localStorage.setItem(STORAGE_KEYS.SUBTABS, JSON.stringify(next));
      return next;
    });
  };

  // =========================================================================
  // REPORT BUILDERS & AUTO-SYNC
  // =========================================================================

  const STANDARD_CATEGORY_LABELS: Record<string, string> = {
    kepegawaian: 'Kepegawaian (SKP, Pangkat, BKN, Cuti)',
    siswa: 'Kesiswaan (Buku Induk, Mutasi, Suket)',
    sapras: 'Sarpras & Aset (KIR, KIB, BAST)',
    surat_masuk: 'Surat Masuk (Agenda & Disposisi)',
    surat_keluar: 'Surat Keluar (No Dinas, SPPD)',
    keuangan_bos: 'Keuangan BOS/BOP (BKU, SPJ)',
    kearsipan: 'Kearsipan (Digitalisasi & Odner)',
    dapodik: 'Dapodikdasmen (Validasi Data)',
    layanan_umum: 'Layanan Umum (Tamu Dinas & Humas)',
    pelaporan_bos: 'Pelaporan BOS & Rekonsiliasi Kas',
    pengarsipan_digital: 'Digitalisasi Dokumen & e-Arsip',
    pelayanan_mutasi: 'Pelayanan Mutasi & Surat Rekomendasi',
    fasilitasi_rapat: 'Fasilitasi Rapat & Notula Dinas',
    legalisir_dokumen: 'Pelayanan Legalisir Ijazah & Berkas',
    keamanan: 'Keamanan Umum (Patroli, Gerbang)',
    inspeksi_malam: 'Inspeksi & Ronda Malam',
    protokoler_tamu: 'Protokoler Tamu & Parkir',
    pengawasan_anak: 'Mengawasi Siswa (Zebra Cross, Pagi)',
    tanggap_darurat: 'Kesiapsiagaan Darurat (APAR, Bencana)',
    perbaikan_sapras: 'Perbaikan Sarpras Ringan',
    lingkungan: 'Tambahan Lingkungan & Saluran',
    antar_surat: 'Antar Surat Dinas & Ekspedisi',
    pendampingan_kegiatan: 'Pendampingan Kegiatan Upacara & Ekskul',
    pengamanan_ujian: 'Pengamanan Ujian & Asesmen (ANBK/PAS)',
    koordinasi_keamanan: 'Koordinasi Kamtibmas Polsek/Babinsa',
    penataan_parkir: 'Penataan Area Parkir Guru & Tamu',
    evakuasi_sarpras: 'Kesiapsiagaan Evakuasi Bencana/Cuaca',
    kebersihan_wc: 'Kebersihan Toilet / WC',
    kebersihan_kantor: 'Kebersihan Ruang Kerja & Kelas',
    kebersihan_sampah: 'Kebersihan Sampah & TPS',
    kebersihan_halaman: 'Pembersihan Halaman & Lapangan',
    perawatan_taman: 'Perawatan & Penyiraman Taman',
    sanitasi_disinfeksi: 'Sanitasi & Disinfeksi (UKS)',
    penyediaan_air: 'Penyediaan Air Bersih & Pompa',
    pemeliharaan_taman: 'Pemeliharaan Tanaman Pot & Lobi',
    drainase_saluran: 'Pembersihan Saluran Air & Drainase',
    persiapan_aula: 'Penataan Meja/Kursi Aula & Rapat',
    sterilisasi_ruang: 'Sterilisasi Ruang Isolasi/UKS & Musholla',
    pengecatan_ringan: 'Pengecatan Ringan & Restorasi Dinding',
    katalogisasi_buku: 'Katalogisasi DDC & Barcode Buku',
    sirkulasi_peminjaman: 'Sirkulasi Peminjaman Buku',
    layanan_literasi: 'Layanan Literasi (GLS & Pojok Baca)',
    perawatan_buku: 'Perawatan & Restorasi Buku',
    stock_opname: 'Stock Opname Koleksi Buku',
    administrasi_perpus: 'Administrasi Perpustakaan',
    pengolahan_label: 'Pengolahan Label Punggung & Barcode',
    promosi_literasi: 'Promosi Minat Baca & Display Buku',
    layanan_referensi: 'Layanan Referensi & Penelusuran Informasi',
    penyiangan_weeding: 'Penyiangan Buku Rusak (Weeding)',
    kerjasama_perpustakaan: 'Kerjasama Perpustakaan & Hibah Buku',
    persiapan_praktikum: 'Persiapan Praktikum Sains',
    pemeliharaan_alat: 'Pemeliharaan Alat Gelas Lab',
    inventaris_bahan: 'Inventaris Reagen Kimia',
    k3_laboratorium: 'Keselamatan Kerja K3 Lab',
    jadwal_lab: 'Jadwal & Jurnal Penggunaan Lab',
    perbaikan_alat: 'Kalibrasi & Perbaikan Alat Lab',
    pengelolaan_limbah: 'Pengelolaan & Netralisasi Limbah Lab',
    kalibrasi_presisi: 'Kalibrasi Presisi Neraca & Mikroskop',
    pembuatan_reagen: 'Pembuatan Larutan Reagen Biologi',
    peragaan_sains: 'Pendampingan Kit Peraga Sains / KIR',
    penataan_spesimen: 'Penataan Preparat & Spesimen Awetan'
  };

  const getRoleCustomCategories = (role: RoleType): CustomCategory[] =>
    customCategories.filter(c => c.role === role);

  const getCategoryLabel = (categoryKey: string, role?: RoleType): string => {
    if (STANDARD_CATEGORY_LABELS[categoryKey]) return STANDARD_CATEGORY_LABELS[categoryKey];
    const match = customCategories.find(
      c =>
        (c.slug === categoryKey || c.name.toLowerCase() === categoryKey.toLowerCase()) &&
        (!role || c.role === role)
    );
    if (match) return match.name;
    return categoryKey.replace(/_/g, ' ');
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
    const roleTasks = allTasks.filter(t => t.role === role && isTaskInMonth(t.date, month, year));
    const completed = roleTasks.filter(t => t.status === 'selesai');
    const tupoksiTasks = roleTasks.filter(t => getTaskClassification(role, t.category, t.taskType) === 'pokok');
    const tambahanTasks = roleTasks.filter(t => getTaskClassification(role, t.category, t.taskType) === 'tambahan');
    const tupoksiCompleted = tupoksiTasks.filter(t => t.status === 'selesai');
    const tambahanCompleted = tambahanTasks.filter(t => t.status === 'selesai');

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = monthNames[month - 1] || `Bulan ${month}`;
    const formattedManualDate = `${config.kabupatenKota}, 30 ${monthName} ${year}`;
    const completionRate = roleTasks.length > 0 ? Math.round((completed.length / roleTasks.length) * 100) : 100;

    const achievementsList: string[] = [];
    if (role === 'PERPUS') {
      const sirkulasiCount = roleTasks.filter(t => t.category === 'sirkulasi_peminjaman' || t.title.toLowerCase().includes('pinjam')).length;
      const katalogCount = roleTasks.filter(t => t.category === 'katalogisasi_buku' || t.title.toLowerCase().includes('katalog')).length;
      const literasiCount = roleTasks.filter(t => t.category === 'layanan_literasi' || t.title.toLowerCase().includes('literasi')).length;
      const pokokDoneTitles = tupoksiCompleted.map(t => t.title);
      const tambahanDoneTitles = tambahanCompleted.map(t => t.title);

      achievementsList.push(
        tupoksiCompleted.length > 0
          ? `Pelaksanaan Tugas Pokok (Tupoksi) Perpustakaan: Menyelesaikan ${tupoksiCompleted.length} dari ${tupoksiTasks.length} kegiatan pokok tuntas (${pokokDoneTitles.slice(0, 3).join(', ')})`
          : `Pelayanan sirkulasi peminjaman dan pengembalian bahan pustaka bagi pemustaka (${sirkulasiCount > 0 ? sirkulasiCount : 24} transaksi layanan tercatat tertib)`
      );
      achievementsList.push(
        tambahanCompleted.length > 0
          ? `Pelaksanaan Tugas Tambahan Kedinasan: Menuntaskan ${tambahanCompleted.length} dari ${tambahanTasks.length} kegiatan tugas tambahan (${tambahanDoneTitles.slice(0, 3).join(', ')})`
          : `Pendampingan kegiatan literasi 15 menit membaca rutin dan pembinaan pojok baca kelas (${literasiCount > 0 ? literasiCount : 20} sesi aktif)`
      );
      if (katalogCount > 0) {
        achievementsList.push(`Pengolahan katalogisasi DDC, input buku induk & pelabelan barcode koleksi baru (${katalogCount} kegiatan pengolahan tuntas)`);
      }
    } else if (role === 'LAB_IPA') {
      achievementsList.push(`Fasilitasi penyiapan set alat peraga dan bahan praktikum IPA tepat waktu (${roleTasks.length || 22} sesi)`);
      achievementsList.push(`Realisasi tugas pokok laboratorium: ${tupoksiCompleted.length} dari ${tupoksiTasks.length} tuntas`);
      achievementsList.push(`Realisasi tugas tambahan praktikum: ${tambahanCompleted.length} dari ${tambahanTasks.length} selesai`);
    } else if (role === 'PENJAGA') {
      achievementsList.push(`Pelaksanaan patroli keamanan berkala gedung & pos penjagaan (${roleTasks.length || 24} kegiatan Zero Incident)`);
      achievementsList.push(`Realisasi tugas pokok pengamanan: ${tupoksiCompleted.length} dari ${tupoksiTasks.length} tugas pokok terlaksana`);
      achievementsList.push(`Realisasi tugas tambahan insidental: ${tambahanCompleted.length} dari ${tambahanTasks.length} selesai`);
    } else if (role === 'TU') {
      achievementsList.push(`Pengelolaan administrasi kepegawaian, kesiswaan & persuratan dinas TU`);
      achievementsList.push(`Realisasi tugas pokok administrasi: ${tupoksiCompleted.length} dari ${tupoksiTasks.length} tugas pokok tuntas`);
      achievementsList.push(`Realisasi tugas tambahan/layanan umum: ${tambahanCompleted.length} dari ${tambahanTasks.length} selesai`);
    } else {
      achievementsList.push(`Sanitasi harian ruang pimpinan, kantor guru, kelas & toilet sekolah (${roleTasks.length || 25} kegiatan)`);
      achievementsList.push(`Realisasi tugas pokok kebersihan: ${tupoksiCompleted.length} dari ${tupoksiTasks.length} tuntas`);
      achievementsList.push(`Realisasi tugas tambahan sanitasi: ${tambahanCompleted.length} dari ${tambahanTasks.length} selesai`);
    }

    const summaryTemplates: Record<RoleType, string> = {
      PERPUS:
        roleTasks.length > 0
          ? `Sepanjang bulan ${monthName} ${year}, Pengelola Layanan Perpustakaan Sekolah telah menyelesaikan ${completed.length} dari ${roleTasks.length} agenda kegiatan kedinasan yang terlaksana (${completionRate}% tuntas), terdiri dari ${tupoksiCompleted.length} tugas pokok (Tupoksi) dan ${tambahanCompleted.length} tugas tambahan operasional.`
          : `Sepanjang bulan ${monthName} ${year}, Layanan Operasional Perpustakaan Sekolah telah menyelesaikan agenda kegiatan kedinasan sesuai standar tata naskah dinas.`,
      LAB_IPA: `Berdasarkan rekapitulasi data harian bulan ${monthName} ${year}, Operator Layanan Operasional Laboratorium IPA telah menuntaskan ${completed.length} dari ${roleTasks.length > 0 ? roleTasks.length : 22} pekerjaan (${completionRate}%).`,
      TU: `Sepanjang bulan ${monthName} ${year}, Layanan Operasional Administrasi Tata Usaha telah menyelesaikan ${completed.length} dari ${roleTasks.length > 0 ? roleTasks.length : 28} agenda kedinasan (${completionRate}%).`,
      PENJAGA: `Berdasarkan rekapitulasi data harian bulan ${monthName} ${year}, Operator Layanan Operasional Penjaga Sekolah telah menyelesaikan ${completed.length} dari ${roleTasks.length > 0 ? roleTasks.length : 26} tugas pengamanan (${completionRate}%).`,
      SERVICE: `Kinerja Layanan Operasional Kebersihan (Service) pada bulan ${monthName} ${year} telah menuntaskan ${completed.length} dari ${roleTasks.length > 0 ? roleTasks.length : 25} kegiatan sanitasi (${completionRate}%).`
    };

    const activeUserKey = getUserIsolationKey(currentUserRef.current);
    const existing =
      (activeUserKey
        ? existingList.find(
            r => r.role === role && r.month === month && r.year === year && r.ownerUserId === activeUserKey
          )
        : undefined) ||
      existingList.find(r => r.role === role && r.month === month && r.year === year);
    const defaultKPIs = (ROLE_OPERATIONAL_SPECS[role]?.operationalKPIs || []).map(k => ({ ...k }));
    const userSuffix = activeUserKey ? `-${activeUserKey.replace(/[^a-zA-Z0-9_-]/g, '').slice(-8)}` : '';

    return {
      id: existing?.id || `m-rep-${role.toLowerCase()}-${month}-${year}${userSuffix}`,
      role,
      month,
      year,
      manualDocDate: existing?.manualDocDate || formattedManualDate,
      summary: !existing?.summary || forceFresh ? summaryTemplates[role] : existing.summary,
      achievements: achievementsList,
      obstacles:
        existing?.obstacles && !forceFresh
          ? existing.obstacles
          : ['Penyesuaian jadwal layanan dengan agenda kegiatan sekolah berjalan tertib.'],
      solutions:
        existing?.solutions && !forceFresh
          ? existing.solutions
          : ['Koordinasi berkala bersama pimpinan sekolah dan wali kelas/guru terkait.'],
      customKPIs: existing?.customKPIs && existing.customKPIs.length > 0 ? existing.customKPIs : defaultKPIs,
      approvalStatus: existing?.approvalStatus || 'diajukan',
      ...(currentUserRef.current?.id
        ? { ownerUserId: currentUserRef.current.id, ownerUsername: currentUserRef.current.username }
        : {})
    };
  };

  const autoSyncMonthlyReport = (task: TaskLog, allTasks: TaskLog[]) => {
    if (!task.date) return;
    const parsed = parseTaskMonthYear(task.date);
    const month = parsed ? parsed.month : 9;
    const year = parsed ? parsed.year : 2026;
    setLastAddedTaskMonthYear({ month, year });

    setMonthlyReports(prev => {
      const updatedReport = buildMonthlyReportObject(allTasks, task.role, month, year, effectiveSchoolConfig, prev, true);
      const exists = prev.some(r => r.id === updatedReport.id || (r.role === task.role && r.month === month && r.year === year));
      persistRecordPermanent('monthlyReports', exists ? 'UPDATE' : 'CREATE', updatedReport, 'Laporan Bulanan', {
        silent: true
      }).then(res => {
        if (res.ok && res.savedRecord) {
          setMonthlyReports(latest => upsertIntoStateList(latest, res.savedRecord, res.replacedId, false));
        }
      });
      const idx = prev.findIndex(r => r.id === updatedReport.id || (r.role === task.role && r.month === month && r.year === year));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedReport;
        return copy;
      }
      return [...prev, updatedReport];
    });
  };

  // =========================================================================
  // CRUD OPERATIONS (PERMANENT AUTO-SAVE + PER-USER ISOLATION)
  // =========================================================================

  const addTask = (newTask: Omit<TaskLog, 'id'>) => {
    const created: TaskLog = {
      ...newTask,
      id: `tsk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...(currentUser?.id ? { ownerUserId: currentUser.id, ownerUsername: currentUser.username } : {})
    };
    persistRecordPermanent('tasks', 'CREATE', created, 'Jurnal Tugas').then(res => {
      if (res.ok) {
        const finalRec = (res.savedRecord as TaskLog) || created;
        setTasks(prev => {
          const next = upsertIntoStateList(prev, finalRec, res.replacedId, true);
          setTimeout(() => autoSyncMonthlyReport(finalRec, next), 0);
          return next;
        });
      }
    });
  };

  const importTasks = (newTasks: Omit<TaskLog, 'id'>[]) => {
    const withIds: TaskLog[] = newTasks.map((t, idx) => ({
      ...t,
      id: `tsk-imp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      ...(currentUser?.id ? { ownerUserId: currentUser.id, ownerUsername: currentUser.username } : {})
    }));
    if (storageService.getStaffToken() || (storageService.getAdminToken() && currentUser)) {
      setSyncStatus('saving');
      storageService.staffSelfSave({ actionType: 'SAVE_RECORDS_BATCH', collection: 'tasks', records: withIds }).then(res => {
        setSyncStatus('synced');
        if (res.ok && Array.isArray(res.data?.savedRecords)) {
          setTasks(prev => [...res.data!.savedRecords!, ...prev]);
          showActionFeedback(true, `${res.data.savedRecords.length} tugas berhasil diimpor & disimpan permanen.`);
        } else {
          showActionFeedback(false, formatApiErrorMessage(res.error, 'Gagal mengimpor data tugas.'));
        }
      });
    } else if (storageService.getAdminToken()) {
      const next = [...withIds, ...tasks];
      persistDirectAdminState({ tasks: next }, 'Impor Tugas').then(ok => {
        if (ok) setTasks(next);
      });
    }
  };

  const updateTask = (id: string, updated: Partial<TaskLog>) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;
    const merged: TaskLog = { ...target, ...updated };
    persistRecordPermanent('tasks', 'UPDATE', merged, 'Pembaruan Tugas').then(res => {
      if (res.ok) {
        const finalRec = (res.savedRecord as TaskLog) || merged;
        setTasks(prev => {
          const next = upsertIntoStateList(prev, finalRec, res.replacedId, true);
          setTimeout(() => autoSyncMonthlyReport(finalRec, next), 0);
          return next;
        });
      }
    });
  };

  const deleteTask = (id: string) => {
    performAdminOnlySoftDelete('tasks', id, 'Jurnal Tugas').then(ok => {
      if (ok) {
        setTasks(prev => prev.filter(t => t.id !== id));
      }
    });
  };

  const deleteMultipleTasks = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    if (!storageService.getAdminToken()) {
      showActionFeedback(
        false,
        'Hapus massal dinonaktifkan untuk non-admin! Penghapusan hanya bisa dilakukan melalui Database Admin Satu Pintu.'
      );
      return;
    }
    Promise.all(ids.map(id => storageService.adminSoftDeleteRecord('tasks', id))).then(() => {
      const idSet = new Set(ids);
      setTasks(prev => prev.filter(t => !idSet.has(t.id)));
      showActionFeedback(true, `${ids.length} tugas dipindahkan ke Arsip Sementara (Soft-Delete).`);
    });
  };

  const addInventory = (newItem: Omit<InventoryItem, 'id'>) => {
    const created: InventoryItem = {
      ...newItem,
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...(currentUser?.id ? { ownerUserId: currentUser.id, ownerUsername: currentUser.username } : {})
    };
    persistRecordPermanent('inventories', 'CREATE', created, 'Inventaris').then(res => {
      if (res.ok) setInventories(prev => upsertIntoStateList(prev, (res.savedRecord as InventoryItem) || created, res.replacedId, true));
    });
  };

  const importInventories = (newItems: Omit<InventoryItem, 'id'>[]) => {
    const withIds: InventoryItem[] = newItems.map((item, idx) => ({
      ...item,
      id: `inv-imp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      ...(currentUser?.id ? { ownerUserId: currentUser.id, ownerUsername: currentUser.username } : {})
    }));
    if (storageService.getStaffToken() || (storageService.getAdminToken() && currentUser)) {
      setSyncStatus('saving');
      storageService.staffSelfSave({ actionType: 'SAVE_RECORDS_BATCH', collection: 'inventories', records: withIds }).then(res => {
        setSyncStatus('synced');
        if (res.ok && Array.isArray(res.data?.savedRecords)) {
          setInventories(prev => [...res.data!.savedRecords!, ...prev]);
          showActionFeedback(true, `${res.data.savedRecords.length} inventaris diimpor & tersimpan permanen.`);
        } else {
          showActionFeedback(false, formatApiErrorMessage(res.error, 'Gagal mengimpor inventaris.'));
        }
      });
    } else if (storageService.getAdminToken()) {
      const next = [...withIds, ...inventories];
      persistDirectAdminState({ inventories: next }, 'Impor Inventaris').then(ok => {
        if (ok) setInventories(next);
      });
    }
  };

  const updateInventory = (id: string, updated: Partial<InventoryItem>) => {
    const target = inventories.find(i => i.id === id);
    if (!target) return;
    const merged: InventoryItem = { ...target, ...updated };
    persistRecordPermanent('inventories', 'UPDATE', merged, 'Pembaruan Inventaris').then(res => {
      if (res.ok) setInventories(prev => upsertIntoStateList(prev, (res.savedRecord as InventoryItem) || merged, res.replacedId, true));
    });
  };

  const deleteInventory = (id: string) => {
    performAdminOnlySoftDelete('inventories', id, 'Data Inventaris').then(ok => {
      if (ok) setInventories(prev => prev.filter(i => i.id !== id));
    });
  };

  const deleteMultipleInventories = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    if (!storageService.getAdminToken()) {
      showActionFeedback(false, 'Penghapusan inventaris massal hanya diizinkan oleh Admin Database.');
      return;
    }
    Promise.all(ids.map(id => storageService.adminSoftDeleteRecord('inventories', id))).then(() => {
      const idSet = new Set(ids);
      setInventories(prev => prev.filter(i => !idSet.has(i.id)));
      showActionFeedback(true, `${ids.length} inventaris dipindahkan ke Arsip Sementara.`);
    });
  };

  const addLibraryBook = (book: Omit<LibraryBookItem, 'id'>) => {
    const newBook: LibraryBookItem = {
      ...book,
      id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      bulanPengadaan:
        book.bulanPengadaan || (book.tanggalMasuk ? book.tanggalMasuk.substring(0, 7) : new Date().toISOString().substring(0, 7)),
      ...(currentUser?.id ? { ownerUserId: currentUser.id, ownerUsername: currentUser.username } : {})
    };
    persistRecordPermanent('libraryBooks', 'CREATE', newBook, 'Koleksi Buku').then(res => {
      if (res.ok) setLibraryBooks(prev => upsertIntoStateList(prev, (res.savedRecord as LibraryBookItem) || newBook, res.replacedId, true));
    });
  };

  const updateLibraryBook = (id: string, updated: Partial<LibraryBookItem>) => {
    const target = libraryBooks.find(b => b.id === id);
    if (!target) return;
    const combined: LibraryBookItem = { ...target, ...updated };
    if (updated.tanggalMasuk && !updated.bulanPengadaan) {
      combined.bulanPengadaan = updated.tanggalMasuk.substring(0, 7);
    }
    persistRecordPermanent('libraryBooks', 'UPDATE', combined, 'Pembaruan Buku').then(res => {
      if (res.ok) setLibraryBooks(prev => upsertIntoStateList(prev, (res.savedRecord as LibraryBookItem) || combined, res.replacedId, true));
    });
  };

  const deleteLibraryBook = (id: string) => {
    performAdminOnlySoftDelete('libraryBooks', id, 'Koleksi Buku').then(ok => {
      if (ok) setLibraryBooks(prev => prev.filter(b => b.id !== id));
    });
  };

  const deleteMultipleLibraryBooks = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    if (!storageService.getAdminToken()) {
      showActionFeedback(false, 'Penghapusan koleksi buku massal hanya diizinkan oleh Admin Database.');
      return;
    }
    Promise.all(ids.map(id => storageService.adminSoftDeleteRecord('libraryBooks', id))).then(() => {
      const idSet = new Set(ids);
      setLibraryBooks(prev => prev.filter(b => !idSet.has(b.id)));
      showActionFeedback(true, `${ids.length} buku dipindahkan ke Arsip Sementara.`);
    });
  };

  const importLibraryBooks = (books: Omit<LibraryBookItem, 'id'>[]) => {
    const withIds: LibraryBookItem[] = books.map((b, idx) => ({
      ...b,
      id: `bk-imp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      bulanPengadaan:
        b.bulanPengadaan || (b.tanggalMasuk ? b.tanggalMasuk.substring(0, 7) : new Date().toISOString().substring(0, 7)),
      ...(currentUser?.id ? { ownerUserId: currentUser.id, ownerUsername: currentUser.username } : {})
    }));
    if (storageService.getStaffToken() || (storageService.getAdminToken() && currentUser)) {
      setSyncStatus('saving');
      storageService.staffSelfSave({ actionType: 'SAVE_RECORDS_BATCH', collection: 'libraryBooks', records: withIds }).then(res => {
        setSyncStatus('synced');
        if (res.ok && Array.isArray(res.data?.savedRecords)) {
          setLibraryBooks(prev => [...res.data!.savedRecords!, ...prev]);
          showActionFeedback(true, `${res.data.savedRecords.length} buku perpustakaan diimpor & tersimpan permanen.`);
        } else {
          showActionFeedback(false, formatApiErrorMessage(res.error, 'Gagal mengimpor koleksi buku.'));
        }
      });
    } else if (storageService.getAdminToken()) {
      const next = [...withIds, ...libraryBooks];
      persistDirectAdminState({ libraryBooks: next }, 'Impor Buku').then(ok => {
        if (ok) setLibraryBooks(next);
      });
    }
  };

  const addLibraryMember = (member: Omit<LibraryMemberItem, 'id'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newMember: LibraryMemberItem = {
      ...member,
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tanggalBergabung: member.tanggalBergabung || today,
      tanggalTerdaftar: member.tanggalTerdaftar || member.tanggalBergabung || today,
      ...(currentUser?.id ? { ownerUserId: currentUser.id, ownerUsername: currentUser.username } : {})
    };
    persistRecordPermanent('libraryMembers', 'CREATE', newMember, 'Anggota Perpustakaan').then(res => {
      if (!res.ok) return;
      const savedMember = (res.savedRecord as LibraryMemberItem) || newMember;
      setLibraryMembers(prev => upsertIntoStateList(prev, savedMember, res.replacedId, true));
      const t = String(member.tipeAnggota || 'SISWA').toUpperCase();
      const isP = member.jenisKelamin === 'P';
      setLibraryMemberStats(prev => {
        const next: LibraryMemberStats = {
          siswaLaki: Number(prev.siswaLaki) || 0,
          siswaPerempuan: Number(prev.siswaPerempuan) || 0,
          guruPendidik: Number(prev.guruPendidik) || 0,
          guruLaki: Number(prev.guruLaki) || 0,
          guruPerempuan: Number(prev.guruPerempuan) || 0,
          staffTendik: Number(prev.staffTendik) || 0,
          staffLaki: Number(prev.staffLaki) || 0,
          staffPerempuan: Number(prev.staffPerempuan) || 0,
          lastUpdated: today
        };
        if (t === 'GURU') {
          next.guruPendidik += 1;
          if (isP) next.guruPerempuan = (next.guruPerempuan || 0) + 1;
          else next.guruLaki = (next.guruLaki || 0) + 1;
        } else if (t === 'STAFF') {
          next.staffTendik += 1;
          if (isP) next.staffPerempuan = (next.staffPerempuan || 0) + 1;
          else next.staffLaki = (next.staffLaki || 0) + 1;
        } else {
          if (isP) next.siswaPerempuan += 1;
          else next.siswaLaki += 1;
        }
        if (storageService.getStaffToken() || (storageService.getAdminToken() && currentUser)) {
          storageService.staffSelfSave({ actionType: 'SAVE_LIBRARY_MEMBER_STATS', payload: next });
        } else if (storageService.getAdminToken()) {
          persistDirectAdminState({ libraryMemberStats: next }, 'Statistik Anggota');
        }
        return next;
      });
    });
  };

  const updateLibraryMember = (id: string, updated: Partial<LibraryMemberItem>) => {
    const target = libraryMembers.find(m => m.id === id);
    if (!target) return;
    const merged: LibraryMemberItem = { ...target, ...updated };
    persistRecordPermanent('libraryMembers', 'UPDATE', merged, 'Pembaruan Anggota').then(res => {
      if (res.ok) setLibraryMembers(prev => upsertIntoStateList(prev, (res.savedRecord as LibraryMemberItem) || merged, res.replacedId, true));
    });
  };

  const deleteLibraryMember = (id: string) => {
    performAdminOnlySoftDelete('libraryMembers', id, 'Anggota Perpustakaan').then(ok => {
      if (ok) setLibraryMembers(prev => prev.filter(m => m.id !== id));
    });
  };

  const deleteMultipleLibraryMembers = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    if (!storageService.getAdminToken()) {
      showActionFeedback(false, 'Penghapusan anggota massal hanya diizinkan oleh Admin Database.');
      return;
    }
    Promise.all(ids.map(id => storageService.adminSoftDeleteRecord('libraryMembers', id))).then(() => {
      const idSet = new Set(ids);
      setLibraryMembers(prev => prev.filter(m => !idSet.has(m.id)));
      showActionFeedback(true, `${ids.length} anggota dipindahkan ke Arsip Sementara.`);
    });
  };

  const importLibraryMembers = (members: Omit<LibraryMemberItem, 'id'>[]) => {
    const today = new Date().toISOString().split('T')[0];
    const withIds: LibraryMemberItem[] = members.map((m, idx) => ({
      ...m,
      id: `mem-imp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      tanggalBergabung: m.tanggalBergabung || m.tanggalTerdaftar || today,
      tanggalTerdaftar: m.tanggalTerdaftar || m.tanggalBergabung || today,
      ...(currentUser?.id ? { ownerUserId: currentUser.id, ownerUsername: currentUser.username } : {})
    }));
    if (storageService.getStaffToken() || (storageService.getAdminToken() && currentUser)) {
      setSyncStatus('saving');
      storageService.staffSelfSave({ actionType: 'SAVE_RECORDS_BATCH', collection: 'libraryMembers', records: withIds }).then(res => {
        setSyncStatus('synced');
        if (res.ok && Array.isArray(res.data?.savedRecords)) {
          setLibraryMembers(prev => [...res.data!.savedRecords!, ...prev]);
          showActionFeedback(true, `${res.data.savedRecords.length} anggota diimpor & tersimpan permanen.`);
        } else {
          showActionFeedback(false, formatApiErrorMessage(res.error, 'Gagal mengimpor data anggota.'));
        }
      });
    } else if (storageService.getAdminToken()) {
      const next = [...withIds, ...libraryMembers];
      persistDirectAdminState({ libraryMembers: next }, 'Impor Anggota').then(ok => {
        if (ok) setLibraryMembers(next);
      });
    }
  };

  const updateLibraryMemberStats = (stats: Partial<LibraryMemberStats>) => {
    setLibraryMemberStats(prev => {
      const nextGuruL = stats.guruLaki !== undefined ? Math.max(0, Number(stats.guruLaki) || 0) : Number(prev.guruLaki) || 0;
      const nextGuruP = stats.guruPerempuan !== undefined ? Math.max(0, Number(stats.guruPerempuan) || 0) : Number(prev.guruPerempuan) || 0;
      const nextStaffL = stats.staffLaki !== undefined ? Math.max(0, Number(stats.staffLaki) || 0) : Number(prev.staffLaki) || 0;
      const nextStaffP = stats.staffPerempuan !== undefined ? Math.max(0, Number(stats.staffPerempuan) || 0) : Number(prev.staffPerempuan) || 0;
      const hasGuruLP = stats.guruLaki !== undefined || stats.guruPerempuan !== undefined;
      const hasStaffLP = stats.staffLaki !== undefined || stats.staffPerempuan !== undefined;

      const next: LibraryMemberStats = {
        ...prev,
        ...stats,
        guruLaki: nextGuruL,
        guruPerempuan: nextGuruP,
        guruPendidik: hasGuruLP ? nextGuruL + nextGuruP : stats.guruPendidik !== undefined ? Math.max(0, Number(stats.guruPendidik) || 0) : prev.guruPendidik || 0,
        staffLaki: nextStaffL,
        staffPerempuan: nextStaffP,
        staffTendik: hasStaffLP ? nextStaffL + nextStaffP : stats.staffTendik !== undefined ? Math.max(0, Number(stats.staffTendik) || 0) : prev.staffTendik || 0,
        siswaLaki: stats.siswaLaki !== undefined ? Math.max(0, Number(stats.siswaLaki) || 0) : Number(prev.siswaLaki) || 0,
        siswaPerempuan: stats.siswaPerempuan !== undefined ? Math.max(0, Number(stats.siswaPerempuan) || 0) : Number(prev.siswaPerempuan) || 0,
        isManualOverride: stats.isManualOverride !== undefined ? stats.isManualOverride : true,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      if (storageService.getStaffToken() || (storageService.getAdminToken() && currentUser)) {
        setSyncStatus('saving');
        storageService.staffSelfSave({ actionType: 'SAVE_LIBRARY_MEMBER_STATS', payload: next }).then(res => {
          setSyncStatus('synced');
          if (res.ok && res.data?.stats) {
            setLibraryMemberStats(res.data.stats);
            showActionFeedback(true, formatApiErrorMessage(res.data.message, 'Rekap jumlah anggota tersimpan permanen.'));
          } else if (!res.ok) {
            showActionFeedback(false, formatApiErrorMessage(res.error, 'Gagal menyimpan rekap jumlah anggota.'));
          }
        });
      } else if (storageService.getAdminToken()) {
        persistDirectAdminState({ libraryMemberStats: next }, 'Rekap Jumlah Anggota');
      }
      return next;
    });
  };

  const saveMonthlyReport = (report: MonthlyReport) => {
    const payload: MonthlyReport = {
      ...report,
      ...(currentUser?.id ? { ownerUserId: currentUser.id, ownerUsername: currentUser.username } : {})
    };
    const exists = monthlyReports.some(r => r.id === payload.id || (r.role === payload.role && r.month === payload.month && r.year === payload.year));
    persistRecordPermanent('monthlyReports', exists ? 'UPDATE' : 'CREATE', payload, 'Laporan Bulanan').then(res => {
      if (!res.ok) return;
      const saved = (res.savedRecord as MonthlyReport) || payload;
      setMonthlyReports(prev => upsertIntoStateList(prev, saved, res.replacedId, false));
    });
  };

  const saveAnnualReport = (report: AnnualReport) => {
    const payload: AnnualReport = {
      ...report,
      ...(currentUser?.id ? { ownerUserId: currentUser.id, ownerUsername: currentUser.username } : {})
    };
    const exists = annualReports.some(r => r.id === payload.id || (r.role === payload.role && r.year === payload.year));
    persistRecordPermanent('annualReports', exists ? 'UPDATE' : 'CREATE', payload, 'Laporan Tahunan').then(res => {
      if (!res.ok) return;
      const saved = (res.savedRecord as AnnualReport) || payload;
      setAnnualReports(prev => upsertIntoStateList(prev, saved, res.replacedId, false));
    });
  };

  const addArchive = (doc: Omit<ArchiveDocument, 'id'>) => {
    const newDoc: ArchiveDocument = {
      ...doc,
      id: `arch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...(currentUser?.id ? { ownerUserId: currentUser.id, ownerUsername: currentUser.username } : {})
    };
    persistRecordPermanent('archives', 'CREATE', newDoc, 'Arsip Dokumen').then(res => {
      if (res.ok) setArchives(prev => upsertIntoStateList(prev, (res.savedRecord as ArchiveDocument) || newDoc, res.replacedId, true));
    });
  };

  const updateArchive = (id: string, updated: Partial<ArchiveDocument>) => {
    const target = archives.find(a => a.id === id);
    if (!target) return;
    const merged: ArchiveDocument = { ...target, ...updated };
    persistRecordPermanent('archives', 'UPDATE', merged, 'Pembaruan Arsip').then(res => {
      if (res.ok) setArchives(prev => upsertIntoStateList(prev, (res.savedRecord as ArchiveDocument) || merged, res.replacedId, true));
    });
  };

  const deleteArchive = (id: string) => {
    performAdminOnlySoftDelete('archives', id, 'Arsip Dokumen').then(ok => {
      if (ok) setArchives(prev => prev.filter(a => a.id !== id));
    });
  };

  const archiveReport = (type: 'monthly' | 'annual', data: any, customTitle?: string): ArchiveDocument => {
    const role: RoleType = data.role || currentRole || 'TU';
    const roleCode =
      role === 'TU' ? 'TU' : role === 'PENJAGA' ? 'PJG' : role === 'SERVICE' ? 'SRV' : role === 'PERPUS' ? 'PRS' : 'IPA';
    const year = data.year || new Date().getFullYear();
    const month = data.month || (type === 'monthly' ? new Date().getMonth() + 1 : undefined);
    const operator = effectiveSchoolConfig.operatorProfiles?.[role] || initialSchoolConfig.operatorProfiles[role];
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const roleName = ROLE_LABELS_MAP[role] || 'Tata Usaha';
    const regNumber = `ARS/${year}/${month ? String(month).padStart(2, '0') : 'THN'}/${roleCode}/${String(archives.length + 1).padStart(3, '0')}`;
    const docTitle =
      customTitle ||
      (type === 'monthly'
        ? `Laporan Bulanan Kinerja ${roleName} - ${month ? monthNames[month - 1] : ''} ${year}`
        : `Laporan Tahunan Kinerja ${roleName} - Tahun Anggaran ${year}`);

    const roleTasksWithPhotos = tasks.filter(t => t.role === role && !!t.photoUrl);

    const newDoc: ArchiveDocument = {
      id: `arch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      regNumber,
      title: docTitle,
      nomorSurat: `800/${type === 'monthly' ? `LAP-BLN/${month || 9}` : 'LAP-THN'}/${effectiveSchoolConfig.npsn || '20202819'}/${year}`,
      documentType: type,
      role,
      period: type === 'monthly' ? `Bulan ${monthNames[(month || 9) - 1]} ${year}` : `Tahun Anggaran ${year}`,
      year,
      month,
      operatorName: operator.nama,
      operatorNip: operator.nip,
      dateArchived: new Date().toISOString(),
      approvalStatus: data.approvalStatus || 'disahkan_kepsek',
      inspectionNotes: 'Diarsipkan dari laporan kinerja operasional sekolah.',
      isAuditVerified: true,
      checklist: {
        hasKop: true,
        hasApprovalSheet: true,
        hasSignatures: true,
        hasStamp: false,
        hasPhotos: roleTasksWithPhotos.length > 0,
        photoCount: roleTasksWithPhotos.length
      },
      reportData: data,
      ...(currentUser?.id ? { ownerUserId: currentUser.id, ownerUsername: currentUser.username } : {})
    };

    persistRecordPermanent('archives', 'CREATE', newDoc, 'Arsip Laporan').then(res => {
      if (res.ok) setArchives(prev => upsertIntoStateList(prev, (res.savedRecord as ArchiveDocument) || newDoc, res.replacedId, true));
    });
    return newDoc;
  };

  // Berita Acara Central Database CRUD (migrated from standalone localStorage)
  const saveBeritaAcaraRecord = async (
    record: SavedBeritaAcaraRecord
  ): Promise<{ ok: boolean; message?: string }> => {
    const payload: SavedBeritaAcaraRecord = {
      ...record,
      ...(currentUser?.id ? { ownerUserId: currentUser.id, ownerUsername: currentUser.username } : {})
    };
    const exists = beritaAcaraHistory.some(r => r.id === payload.id);
    const res = await persistRecordPermanent('beritaAcaraHistory', exists ? 'UPDATE' : 'CREATE', payload, 'Berita Acara');
    if (res.ok) {
      const saved = (res.savedRecord as SavedBeritaAcaraRecord) || payload;
      setBeritaAcaraHistory(prev => upsertIntoStateList(prev, saved, res.replacedId, true));
      return {
        ok: true,
        message: res.message || `"${saved.templateTitle}" tersimpan permanen di Database untuk akun Anda.`
      };
    }
    return { ok: false, message: res.message || 'Gagal memproses penyimpanan Berita Acara.' };
  };

  const deleteBeritaAcaraRecord = async (id: string): Promise<{ ok: boolean; message?: string }> => {
    const ok = await performAdminOnlySoftDelete('beritaAcaraHistory', id, 'Riwayat Berita Acara');
    if (ok) {
      setBeritaAcaraHistory(prev => prev.filter(r => r.id !== id));
      return { ok: true };
    }
    return { ok: false, message: 'Penghapusan hanya dapat dilakukan melalui otorisasi Admin Database.' };
  };

  // Multi-Tenant Letterhead & Signature (Permanent Auto-Save & Isolated Per User)
  const saveUserLetterhead = (kop: Partial<UserLetterheadConfig> & { logoAplikasiUrl?: string }) => {
    const userKey = getUserIsolationKey(currentUser);
    if (!userKey) {
      if (storageService.getAdminToken()) {
        const next = { ...schoolConfig, ...kop };
        setSchoolConfig(next);
        persistDirectAdminState({ schoolConfig: next }, 'Template Kop Surat');
      } else {
        showActionFeedback(false, 'Masuk terlebih dahulu untuk menyimpan pengaturan kop surat.');
      }
      return;
    }

    const now = new Date().toISOString();
    const prevMap = schoolConfig.userLetterheads || {};
    const existingEntry = prevMap[userKey];
    const nextEntry: UserLetterheadConfig = {
      ...(existingEntry && !existingEntry.deleted ? existingEntry : {}),
      ...kop,
      userId: currentUser?.id || existingEntry?.userId,
      username: currentUser?.username || existingEntry?.username,
      deleted: false,
      updatedAt: now
    };

    const nextConfig: SchoolConfig = {
      ...schoolConfig,
      userLetterheads: { ...prevMap, [userKey]: nextEntry }
    };
    setSchoolConfig(nextConfig);

    if (storageService.getStaffToken() || (storageService.getAdminToken() && currentUser)) {
      setSyncStatus('saving');
      storageService
        .staffSelfSave({
          actionType: 'SAVE_LETTERHEAD',
          payload: nextEntry
        })
        .then(res => {
          setSyncStatus('synced');
          if (res.ok && res.data?.entry) {
            const keyFromServer = res.data.isolationKey || userKey;
            setSchoolConfig(prev => ({
              ...prev,
              userLetterheads: { ...(prev.userLetterheads || {}), [keyFromServer]: res.data!.entry }
            }));
            showActionFeedback(
              true,
              formatApiErrorMessage(res.data.message, `Kop surat akun @${currentUser?.username} tersimpan permanen.`)
            );
          } else {
            showActionFeedback(
              false,
              formatApiErrorMessage(res.error, 'Gagal menyimpan kop surat secara permanen ke server.')
            );
          }
        });
    } else if (storageService.getAdminToken()) {
      persistDirectAdminState({ schoolConfig: nextConfig }, 'Kop Surat Pengguna');
    } else {
      showActionFeedback(false, 'Sesi masuk tidak ditemukan. Silakan masuk ulang agar perubahan tersimpan permanen.');
    }
  };

  const resetUserLetterhead = () => {
    const userKey = getUserIsolationKey(currentUser);
    if (!userKey) return;
    if (!storageService.getStaffToken() && !storageService.getAdminToken()) {
      showActionFeedback(false, 'Masuk terlebih dahulu untuk mengatur ulang kop surat pribadi Anda.');
      return;
    }
    const now = new Date().toISOString();
    const fallbackEntry: UserLetterheadConfig = {
      userId: currentUser?.id,
      username: currentUser?.username,
      deleted: true,
      updatedAt: now
    };
    const nextConfig: SchoolConfig = {
      ...schoolConfig,
      userLetterheads: {
        ...(schoolConfig.userLetterheads || {}),
        [userKey]: fallbackEntry
      }
    };
    setSchoolConfig(nextConfig);

    if (storageService.getStaffToken() || currentUser) {
      setSyncStatus('saving');
      storageService.staffSelfSave({ actionType: 'RESET_LETTERHEAD' }).then(res => {
        setSyncStatus('synced');
        if (res.ok) {
          showActionFeedback(true, formatApiErrorMessage(res.data?.message, 'Kop surat dikembalikan ke Template Bawaan Sistem.'));
        } else {
          showActionFeedback(false, formatApiErrorMessage(res.error, 'Gagal mengatur ulang kop surat pribadi.'));
        }
      });
    } else if (storageService.getAdminToken()) {
      persistDirectAdminState({ schoolConfig: nextConfig }, 'Reset Kop Surat Pengguna');
    }
  };

  const saveUserSignature = (payload: {
    kepalaSekolah?: SchoolOfficer;
    wakilKepalaSekolah?: SchoolOfficer;
    operatorProfile?: SchoolOfficer;
    role?: RoleType;
    stempelEnabled?: boolean;
    stempelTextLine1?: string;
    stempelTextLine2?: string;
    customStempelUrl?: string;
  }) => {
    const userKey = getUserIsolationKey(currentUser);
    const activeRole = payload.role || currentUser?.role || currentRole || 'TU';
    if (!userKey) {
      if (storageService.getAdminToken()) {
        const next: SchoolConfig = {
          ...schoolConfig,
          ...(payload.kepalaSekolah ? { kepalaSekolah: payload.kepalaSekolah } : {}),
          ...(payload.wakilKepalaSekolah ? { wakilKepalaSekolah: payload.wakilKepalaSekolah } : {}),
          ...(payload.operatorProfile
            ? { operatorProfiles: { ...schoolConfig.operatorProfiles, [activeRole]: payload.operatorProfile } }
            : {}),
          ...(payload.stempelEnabled !== undefined ? { stempelEnabled: payload.stempelEnabled } : {}),
          ...(payload.stempelTextLine1 !== undefined ? { stempelTextLine1: payload.stempelTextLine1 } : {}),
          ...(payload.stempelTextLine2 !== undefined ? { stempelTextLine2: payload.stempelTextLine2 } : {}),
          ...(payload.customStempelUrl !== undefined ? { customStempelUrl: payload.customStempelUrl } : {})
        };
        setSchoolConfig(next);
        persistDirectAdminState({ schoolConfig: next }, 'Pengesahan Dasar');
      }
      return;
    }

    const now = new Date().toISOString();
    const prevMap = schoolConfig.userSignatures || {};
    const existingEntry = prevMap[userKey];
    const nextEntry: UserSignatureConfig = {
      ...(existingEntry && !existingEntry.deleted ? existingEntry : {}),
      ...payload,
      role: activeRole,
      userId: currentUser?.id || existingEntry?.userId,
      username: currentUser?.username || existingEntry?.username,
      deleted: false,
      updatedAt: now
    };

    const nextConfig: SchoolConfig = {
      ...schoolConfig,
      userSignatures: { ...prevMap, [userKey]: nextEntry }
    };
    setSchoolConfig(nextConfig);

    if (storageService.getStaffToken() || (storageService.getAdminToken() && currentUser)) {
      setSyncStatus('saving');
      storageService
        .staffSelfSave({
          actionType: 'SAVE_SIGNATURE',
          payload: nextEntry
        })
        .then(res => {
          setSyncStatus('synced');
          if (res.ok && res.data?.entry) {
            const keyFromServer = res.data.isolationKey || userKey;
            setSchoolConfig(prev => ({
              ...prev,
              userSignatures: { ...(prev.userSignatures || {}), [keyFromServer]: res.data!.entry }
            }));
            showActionFeedback(
              true,
              formatApiErrorMessage(res.data.message, `Lembar pengesahan akun @${currentUser?.username} tersimpan permanen.`)
            );
          } else {
            showActionFeedback(
              false,
              formatApiErrorMessage(res.error, 'Gagal menyimpan lembar pengesahan secara permanen.')
            );
          }
        });
    } else if (storageService.getAdminToken()) {
      persistDirectAdminState({ schoolConfig: nextConfig }, 'Lembar Pengesahan Pengguna');
    } else {
      showActionFeedback(false, 'Sesi masuk tidak ditemukan. Silakan masuk ulang agar perubahan tersimpan permanen.');
    }
  };

  const resetUserSignature = () => {
    const userKey = getUserIsolationKey(currentUser);
    if (!userKey) return;
    if (!storageService.getStaffToken() && !storageService.getAdminToken()) {
      showActionFeedback(false, 'Masuk terlebih dahulu untuk mengatur ulang lembar pengesahan Anda.');
      return;
    }
    const now = new Date().toISOString();
    const fallbackEntry: UserSignatureConfig = {
      role: currentUser?.role || currentRole || 'TU',
      userId: currentUser?.id,
      username: currentUser?.username,
      deleted: true,
      updatedAt: now
    };
    const nextConfig: SchoolConfig = {
      ...schoolConfig,
      userSignatures: {
        ...(schoolConfig.userSignatures || {}),
        [userKey]: fallbackEntry
      }
    };
    setSchoolConfig(nextConfig);

    if (storageService.getStaffToken() || currentUser) {
      setSyncStatus('saving');
      storageService.staffSelfSave({ actionType: 'RESET_SIGNATURE' }).then(res => {
        setSyncStatus('synced');
        if (res.ok) {
          showActionFeedback(true, formatApiErrorMessage(res.data?.message, 'Lembar pengesahan dikembalikan ke Template Bawaan Sistem.'));
        } else {
          showActionFeedback(false, formatApiErrorMessage(res.error, 'Gagal mengatur ulang lembar pengesahan.'));
        }
      });
    } else if (storageService.getAdminToken()) {
      persistDirectAdminState({ schoolConfig: nextConfig }, 'Reset Pengesahan Pengguna');
    }
  };

  const updateSchoolConfig = (config: Partial<SchoolConfig>) => {
    if (currentUser) {
      // Route non-global edits through the logged-in user's isolated stores so other users are unaffected
      const hasSigFields =
        config.stempelEnabled !== undefined ||
        config.stempelTextLine1 !== undefined ||
        config.stempelTextLine2 !== undefined ||
        config.customStempelUrl !== undefined ||
        config.kepalaSekolah !== undefined ||
        config.wakilKepalaSekolah !== undefined;
      if (hasSigFields) {
        saveUserSignature({
          ...(config.kepalaSekolah ? { kepalaSekolah: config.kepalaSekolah } : {}),
          ...(config.wakilKepalaSekolah ? { wakilKepalaSekolah: config.wakilKepalaSekolah } : {}),
          ...(config.stempelEnabled !== undefined ? { stempelEnabled: config.stempelEnabled } : {}),
          ...(config.stempelTextLine1 !== undefined ? { stempelTextLine1: config.stempelTextLine1 } : {}),
          ...(config.stempelTextLine2 !== undefined ? { stempelTextLine2: config.stempelTextLine2 } : {}),
          ...(config.customStempelUrl !== undefined ? { customStempelUrl: config.customStempelUrl } : {})
        });
      }
      if (config.logoAplikasiUrl !== undefined) {
        saveUserLetterhead({ logoAplikasiUrl: config.logoAplikasiUrl });
      }
      return;
    }

    setSchoolConfig(prev => {
      const next = { ...prev, ...config };
      if (storageService.getAdminToken()) {
        persistDirectAdminState({ schoolConfig: next }, 'Konfigurasi Sekolah');
      }
      return next;
    });
  };

  // Custom Categories & Tupoksi
  const addCustomCategory = (cat: {
    role: RoleType;
    name: string;
    classification: 'pokok' | 'tambahan';
    description?: string;
  }): CustomCategory => {
    const trimmed = cat.name.trim();
    const baseSlug =
      trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `kategori_${Date.now()}`;
    const exists = customCategories.some(c => c.slug === baseSlug);
    const finalSlug = exists ? `${baseSlug}_${Math.random().toString(36).slice(2, 6)}` : baseSlug;
    const newCategory: CustomCategory = {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: cat.role,
      name: trimmed,
      slug: finalSlug,
      classification: cat.classification,
      description: cat.description?.trim(),
      createdAt: new Date().toISOString().split('T')[0],
      ...(currentUser?.id ? { ownerUserId: currentUser.id, ownerUsername: currentUser.username } : {})
    };
    persistRecordPermanent('customCategories', 'CREATE', newCategory, 'Kategori Tugas').then(res => {
      if (res.ok) setCustomCategories(prev => upsertIntoStateList(prev, (res.savedRecord as CustomCategory) || newCategory, res.replacedId, false));
    });
    return newCategory;
  };

  const updateCustomCategory = (id: string, updated: Partial<CustomCategory>) => {
    const target = customCategories.find(c => c.id === id);
    if (!target) return;
    const merged: CustomCategory = { ...target, ...updated };
    persistRecordPermanent('customCategories', 'UPDATE', merged, 'Pembaruan Kategori').then(res => {
      if (res.ok) setCustomCategories(prev => upsertIntoStateList(prev, (res.savedRecord as CustomCategory) || merged, res.replacedId, false));
    });
  };

  const deleteCustomCategory = (id: string) => {
    performAdminOnlySoftDelete('customCategories', id, 'Kategori Tugas').then(ok => {
      if (ok) setCustomCategories(prev => prev.filter(c => c.id !== id));
    });
  };

  const addTupoksiItem = (role: RoleType, type: 'pokok' | 'tambahan', text: string) => {
    if (!text.trim()) return;
    const currentRoleObj = tupoksiDefinitions[role] || { tupoksiList: [], tugasTambahanList: [] };
    const updatedRoleObj = {
      ...currentRoleObj,
      tupoksiList: type === 'pokok' ? [...currentRoleObj.tupoksiList, text.trim()] : currentRoleObj.tupoksiList,
      tugasTambahanList:
        type === 'tambahan' ? [...currentRoleObj.tugasTambahanList, text.trim()] : currentRoleObj.tugasTambahanList
    };
    const next: TupoksiDefinitionsMap = {
      ...tupoksiDefinitions,
      [role]: updatedRoleObj
    };
    setTupoksiDefinitions(next);
    if (storageService.getStaffToken() || (storageService.getAdminToken() && currentUser)) {
      setSyncStatus('saving');
      storageService
        .staffSelfSave({
          actionType: 'SAVE_TUPOKSI',
          payload: { role, ...updatedRoleObj }
        })
        .then(res => {
          setSyncStatus('synced');
          if (res.ok) showActionFeedback(true, 'Butir Tupoksi baru tersimpan permanen untuk akun Anda.');
          else showActionFeedback(false, formatApiErrorMessage(res.error, 'Gagal menyimpan Tupoksi.'));
        });
    } else if (storageService.getAdminToken()) {
      persistDirectAdminState({ tupoksiDefinitions: next }, 'Daftar Tupoksi');
    }
  };

  const updateTupoksiItem = (role: RoleType, type: 'pokok' | 'tambahan', index: number, newText: string) => {
    if (!newText.trim()) return;
    const currentRoleObj = tupoksiDefinitions[role] || { tupoksiList: [], tugasTambahanList: [] };
    const updatedRoleObj = {
      ...currentRoleObj,
      tupoksiList:
        type === 'pokok'
          ? currentRoleObj.tupoksiList.map((item, i) => (i === index ? newText.trim() : item))
          : currentRoleObj.tupoksiList,
      tugasTambahanList:
        type === 'tambahan'
          ? currentRoleObj.tugasTambahanList.map((item, i) => (i === index ? newText.trim() : item))
          : currentRoleObj.tugasTambahanList
    };
    const next: TupoksiDefinitionsMap = {
      ...tupoksiDefinitions,
      [role]: updatedRoleObj
    };
    setTupoksiDefinitions(next);
    if (storageService.getStaffToken() || (storageService.getAdminToken() && currentUser)) {
      setSyncStatus('saving');
      storageService
        .staffSelfSave({
          actionType: 'SAVE_TUPOKSI',
          payload: { role, ...updatedRoleObj }
        })
        .then(res => {
          setSyncStatus('synced');
          if (res.ok) showActionFeedback(true, 'Pembaruan butir Tupoksi tersimpan permanen untuk akun Anda.');
          else showActionFeedback(false, formatApiErrorMessage(res.error, 'Gagal memperbarui Tupoksi.'));
        });
    } else if (storageService.getAdminToken()) {
      persistDirectAdminState({ tupoksiDefinitions: next }, 'Pembaruan Tupoksi');
    }
  };

  const deleteTupoksiItem = (role: RoleType, type: 'pokok' | 'tambahan', indexOrText: number | string) => {
    if (!storageService.getAdminToken()) {
      showActionFeedback(false, 'Penghapusan butir Tupoksi hanya diizinkan melalui otorisasi Admin Database.');
      return;
    }
    const currentRoleObj = tupoksiDefinitions[role] || OFFICIAL_TUPOKSI_DEFINITIONS[role];
    let updatedPokok = [...(currentRoleObj.tupoksiList || [])];
    let updatedTambahan = [...(currentRoleObj.tugasTambahanList || [])];
    if (type === 'pokok') {
      updatedPokok =
        typeof indexOrText === 'number'
          ? updatedPokok.filter((_, i) => i !== indexOrText)
          : updatedPokok.filter(item => item !== indexOrText);
    } else {
      updatedTambahan =
        typeof indexOrText === 'number'
          ? updatedTambahan.filter((_, i) => i !== indexOrText)
          : updatedTambahan.filter(item => item !== indexOrText);
    }
    const next: TupoksiDefinitionsMap = {
      ...tupoksiDefinitions,
      [role]: { tupoksiList: updatedPokok, tugasTambahanList: updatedTambahan }
    };
    setTupoksiDefinitions(next);
    persistDirectAdminState({ tupoksiDefinitions: next }, 'Hapus Butir Tupoksi');
  };

  const resetTupoksiToDefault = (role?: RoleType) => {
    if (!storageService.getAdminToken()) {
      showActionFeedback(false, 'Reset Tupoksi ke default hanya dapat dijalankan oleh Admin Database.');
      return;
    }
    const next = role
      ? {
          ...tupoksiDefinitions,
          [role]: {
            tupoksiList: [...OFFICIAL_TUPOKSI_DEFINITIONS[role].tupoksiList],
            tugasTambahanList: [...OFFICIAL_TUPOKSI_DEFINITIONS[role].tugasTambahanList]
          }
        }
      : JSON.parse(JSON.stringify(OFFICIAL_TUPOKSI_DEFINITIONS));
    setTupoksiDefinitions(next);
    persistDirectAdminState({ tupoksiDefinitions: next }, 'Reset Tupoksi');
  };

  const generateMonthlyReportFromTasks = (
    role: RoleType,
    month: number,
    year: number,
    forceFresh: boolean = false
  ): MonthlyReport => {
    return buildMonthlyReportObject(tasks, role, month, year, effectiveSchoolConfig, monthlyReports, forceFresh);
  };

  const generateAnnualReportFromMonthly = (
    role: RoleType,
    year: number,
    forceFresh: boolean = false
  ): AnnualReport => {
    const activeUserKey = getUserIsolationKey(currentUserRef.current);
    const existing =
      (activeUserKey
        ? annualReports.find(r => r.role === role && r.year === year && r.ownerUserId === activeUserKey)
        : undefined) || annualReports.find(r => r.role === role && r.year === year);
    if (existing && !forceFresh) return existing;

    const formattedManualDate = `${effectiveSchoolConfig.kabupatenKota || 'Teluk'}, 31 Desember ${year}`;
    const bundle = generateAnnualNarrativeBundle({
      role,
      year,
      tasks,
      monthlyReports,
      libraryBooks,
      libraryMembers,
      libraryMemberStats,
      schoolConfig: effectiveSchoolConfig
    });
    const userSuffix = activeUserKey ? `-${activeUserKey.replace(/[^a-zA-Z0-9_-]/g, '').slice(-8)}` : '';

    return {
      id: existing?.id || `ann-rep-${role.toLowerCase()}-${year}${userSuffix}`,
      role,
      year,
      manualDocDate: existing?.manualDocDate || formattedManualDate,
      summary: bundle.summary,
      annualMilestones: bundle.annualMilestones,
      obstacles: bundle.obstacles,
      solutions: bundle.solutions,
      strategicRecommendations: bundle.strategicRecommendations,
      approvalStatus: existing?.approvalStatus || 'diajukan',
      ...(existing?.approvedByKepsekDate ? { approvedByKepsekDate: existing.approvedByKepsekDate } : {}),
      ...(currentUserRef.current?.id
        ? { ownerUserId: currentUserRef.current.id, ownerUsername: currentUserRef.current.username }
        : {})
    };
  };

  const exportBackupJson = () => {
    if (storageService.getAdminToken()) {
      storageService.downloadServerBackup();
      return;
    }
    const backupData = {
      version: '2.0',
      note: 'Ekspor tampilan data operator (bukan cadangan database inti Admin).',
      exportedAt: new Date().toISOString(),
      schoolConfig: effectiveSchoolConfig,
      tasks,
      inventories,
      libraryBooks,
      libraryMembers,
      libraryMemberStats,
      monthlyReports,
      annualReports,
      archives,
      beritaAcaraHistory
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ekspor-siops-operator-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const restoreFromBackupJson = (jsonData: any): boolean => {
    if (!storageService.getAdminToken()) {
      showActionFeedback(
        false,
        'Pemulihan (Restore) database penuh hanya dapat dilakukan melalui Panel Admin Database Satu Pintu.'
      );
      return false;
    }
    storageService.adminRestoreBackup({ uploadedSnapshot: jsonData }).then(res => {
      if (res.ok) {
        showActionFeedback(true, 'Cadangan database berhasil dipulihkan!');
        refreshAdminDashboard();
      } else {
        showActionFeedback(false, formatApiErrorMessage(res.error, 'Gagal memulihkan file JSON cadangan.'));
      }
    });
    return true;
  };

  const resetToDefaultData = () => {
    if (!storageService.getAdminToken()) {
      showActionFeedback(
        false,
        'Reset data penuh dinonaktifkan untuk non-admin! Gunakan Panel Admin jika perlu memulihkan atau mengembalikan cadangan.'
      );
      return;
    }
    const defaultPayload = {
      tasks: initialTasks,
      inventories: initialInventories,
      libraryBooks: initialLibraryBooks,
      libraryMembers: initialLibraryMembers,
      libraryMemberStats: initialLibraryMemberStats,
      monthlyReports: initialMonthlyReports,
      annualReports: initialAnnualReports,
      archives: initialArchives,
      schoolConfig: initialSchoolConfig
    };
    persistDirectAdminState(defaultPayload, 'Reset Data Operasional');
  };

  // =========================================================================
  // SERVER-BACKED AUTHENTICATION & ADMIN GOVERNANCE
  // =========================================================================

  const registerAccessUser = async (payload: {
    namaLengkap: string;
    username: string;
    role: RoleType;
    password: string;
    schoolIdentity?: UserSchoolIdentity;
  }): Promise<AuthActionResult> => {
    const res = await storageService.authRegister(payload);
    if (!res.ok) {
      return {
        ok: false,
        message: formatApiErrorMessage(res.error ?? res.data?.message, 'Pendaftaran gagal.')
      };
    }
    const registered = res.data?.user;
    if (registered) {
      setTrackedUsername(registered.username);
      setTrackedUserAccount(registered);
      if (registered.status !== 'APPROVED') {
        setApprovedSchoolHeader(null);
      }
    }
    await fetchLatestState();
    return {
      ok: true,
      user: registered,
      message: formatApiErrorMessage(res.data?.message, 'Pendaftaran berhasil dikirim ke Database Admin.')
    };
  };

  const loginAccessUser = async (payload: {
    username: string;
    password: string;
    expectedRole?: RoleType;
  }): Promise<AuthActionResult> => {
    const res = await storageService.authLogin(payload);
    if (!res.ok) {
      return {
        ok: false,
        message: formatApiErrorMessage(res.error ?? res.data?.message, 'Gagal masuk ke sistem.')
      };
    }
    if (res.data?.isAdmin) {
      setIsAdminAuthenticated(true);
      if (res.data.adminProfile) {
        setAdminProfile(res.data.adminProfile);
      }
      setSessionExpiredNotice(null);
      await refreshAdminDashboard();
      return {
        ok: true,
        isAdmin: true,
        adminProfile: res.data.adminProfile || null,
        message: formatApiErrorMessage(res.data.message, 'Autentikasi Admin berhasil.')
      };
    }
    if (!res.data?.user) {
      return {
        ok: false,
        message: formatApiErrorMessage(res.error ?? res.data?.message, 'Gagal masuk ke sistem.')
      };
    }
    const loggedInUser = res.data.user;
    setTrackedUsername(loggedInUser.username);
    setTrackedUserAccount(loggedInUser);
    setApprovedSchoolHeader((res.data as any).approvedSchoolHeader || null);
    setCurrentUser(loggedInUser);
    setCurrentRole(loggedInUser.role);
    setRoleSubTab(loggedInUser.role, 'tasks');
    setActiveNavTab('dashboard');
    setSessionExpiredNotice(null);

    await fetchLatestState();
    return {
      ok: true,
      user: loggedInUser,
      approvedSchoolHeader: (res.data as any).approvedSchoolHeader || null,
      requiresPasswordChange: Boolean(res.data.requiresPasswordChange),
      message: formatApiErrorMessage(res.data.message, `Selamat datang, ${loggedInUser.namaLengkap}!`)
    };
  };

  const logoutAccessUser = () => {
    storageService.setStaffToken(null);
    setCurrentUser(null);
    setCurrentRole(null);
    setActiveNavTab('dashboard');
    setSessionExpiredNotice(null);
    // Clear previous user's scoped workspace data cleanly before re-hydrating
    setTasks(initialTasks);
    setInventories(initialInventories);
    setMonthlyReports(initialMonthlyReports);
    setAnnualReports(initialAnnualReports);
    setArchives(initialArchives);
    setBeritaAcaraHistory([]);
    setSchoolConfig(initialSchoolConfig);
    setTupoksiDefinitions(JSON.parse(JSON.stringify(OFFICIAL_TUPOKSI_DEFINITIONS)));
    setCustomCategories(initialCustomCategories);
    setLibraryBooks(initialLibraryBooks);
    setLibraryMembers(initialLibraryMembers);
    setLibraryMemberStats(initialLibraryMemberStats);
    fetchLatestState();
  };

  const requestPasswordReset = async (payload: { username: string; note?: string }): Promise<AuthActionResult> => {
    const res = await storageService.authRequestReset(payload);
    if (!res.ok) {
      return {
        ok: false,
        message: formatApiErrorMessage(res.error ?? res.data?.message, 'Gagal mengirim permintaan reset sandi.')
      };
    }
    setTrackedUsername(payload.username.trim());
    return {
      ok: true,
      message: formatApiErrorMessage(res.data?.message, 'Permintaan reset sandi berhasil dikirim ke Admin Database.')
    };
  };

  const lookupTrackedAccount = async (username: string): Promise<AuthActionResult> => {
    const clean = username.trim();
    const res = await storageService.authStatusLookup(clean);
    if (!res.ok || !res.data?.user) {
      return {
        ok: false,
        message: formatApiErrorMessage(res.error, `Nama pengguna "@${clean}" belum terdaftar di sistem.`)
      };
    }
    const header =
      res.data.user.status === 'APPROVED' ? res.data.approvedSchoolHeader || null : null;
    setTrackedUsername(res.data.user.username);
    setTrackedUserAccount(res.data.user);
    setApprovedSchoolHeader(header);
    return {
      ok: true,
      user: res.data.user,
      approvedSchoolHeader: header,
      message: `Status akun "@${res.data.user.username}" ditemukan.`
    };
  };

  const updateAccessUserPassword = async (userId: string, newPassword: string): Promise<AuthActionResult> => {
    if (storageService.getAdminToken()) {
      const res = await storageService.adminUserAction(userId, 'set-password', newPassword);
      if (res.ok) {
        await refreshAdminDashboard();
        return {
          ok: true,
          user: res.data?.user,
          message: formatApiErrorMessage(res.data?.message, 'Sandi akun diperbarui.')
        };
      }
      return { ok: false, message: formatApiErrorMessage(res.error, 'Gagal memperbarui sandi akun.') };
    }

    const res = await storageService.authChangePassword(newPassword);
    if (res.ok && res.data?.user) {
      setCurrentUser(res.data.user);
      setTrackedUserAccount(res.data.user);
      return {
        ok: true,
        user: res.data.user,
        message: formatApiErrorMessage(res.data?.message, 'Sandi baru berhasil disimpan.')
      };
    }
    return { ok: false, message: formatApiErrorMessage(res.error, 'Gagal memperbarui sandi.') };
  };

  const completePasswordResetWithNewPassword = async (
    _userId: string,
    newPassword: string
  ): Promise<AuthActionResult> => {
    const res = await storageService.authChangePassword(newPassword);
    if (res.ok && res.data?.user) {
      setCurrentUser(res.data.user);
      setTrackedUserAccount(res.data.user);
      return {
        ok: true,
        user: res.data.user,
        message: formatApiErrorMessage(res.data?.message, 'Sandi baru berhasil disimpan!')
      };
    }
    return { ok: false, message: formatApiErrorMessage(res.error, 'Gagal menyimpan sandi baru.') };
  };

  // Admin Console Auth & Governance Actions
  const claimAdminPassword = async (password: string): Promise<AuthActionResult> => {
    const res = await storageService.adminAuthClaim(password);
    if (!res.ok) {
      return { ok: false, message: formatApiErrorMessage(res.error, 'Gagal menetapkan sandi Admin Utama.') };
    }
    setIsAdminAuthenticated(true);
    setAdminAuthStatus(prev => ({ ...prev, isClaimed: true, setupRequired: false }));
    setSessionExpiredNotice(null);
    await refreshAdminDashboard();
    return { ok: true, message: formatApiErrorMessage(res.data?.message, 'Sandi Admin Utama aktif!') };
  };

  const loginAdminSession = async (username: string, password: string): Promise<AuthActionResult> => {
    const res = await storageService.adminAuthLogin(username, password);
    if (!res.ok) {
      if (res.data?.setupRequired) {
        setAdminAuthStatus(prev => ({ ...prev, setupRequired: true, isClaimed: false }));
      }
      return { ok: false, message: formatApiErrorMessage(res.error, 'Username atau sandi Admin tidak sesuai!') };
    }
    setIsAdminAuthenticated(true);
    if (res.data?.adminProfile) {
      setAdminProfile(res.data.adminProfile);
    }
    setSessionExpiredNotice(null);
    await refreshAdminDashboard();
    return {
      ok: true,
      adminProfile: res.data?.adminProfile || null,
      message: formatApiErrorMessage(res.data?.message, 'Berhasil masuk ke Database Admin Satu Pintu.')
    };
  };

  const logoutAdminSession = () => {
    storageService.setAdminToken(null);
    setIsAdminAuthenticated(false);
    setAdminProfile(null);
    fetchLatestState();
  };

  const approveAccessUser = async (userId: string, assignedPassword?: string): Promise<AuthActionResult> => {
    const res = await storageService.adminUserAction(userId, 'approve', assignedPassword);
    if (res.ok) {
      await refreshAdminDashboard();
      return {
        ok: true,
        user: res.data?.user,
        message: formatApiErrorMessage(res.data?.message, 'Akun disetujui.')
      };
    }
    return { ok: false, message: formatApiErrorMessage(res.error, 'Gagal menyetujui akun.') };
  };

  const rejectAccessUser = async (userId: string): Promise<AuthActionResult> => {
    const res = await storageService.adminUserAction(userId, 'reject');
    if (res.ok) {
      await refreshAdminDashboard();
      return {
        ok: true,
        user: res.data?.user,
        message: formatApiErrorMessage(res.data?.message, 'Akun ditolak.')
      };
    }
    return { ok: false, message: formatApiErrorMessage(res.error, 'Gagal menolak akun.') };
  };

  const deleteAccessUser = async (userId: string): Promise<AuthActionResult> => {
    const ok = await storageService.deleteAccessUser(userId);
    if (ok) {
      await refreshAdminDashboard();
      return { ok: true, message: 'Akun dipindahkan ke Arsip Sementara (Soft-Delete).' };
    }
    return { ok: false, message: 'Gagal menghapus akun.' };
  };

  const createAccessUserByAdmin = async (payload: {
    namaLengkap: string;
    username: string;
    role: RoleType;
    password: string;
    status?: UserAccountStatus;
    schoolIdentity?: UserSchoolIdentity;
  }): Promise<AuthActionResult> => {
    const res = await storageService.adminCreateUser(payload);
    if (res.ok) {
      await refreshAdminDashboard();
      return {
        ok: true,
        user: res.data?.user,
        message: formatApiErrorMessage(res.data?.message, 'Pengguna berhasil ditambahkan.')
      };
    }
    return { ok: false, message: formatApiErrorMessage(res.error, 'Gagal menambahkan pengguna.') };
  };

  const updateAccessRules = async (updates: Partial<AccessSecurityRules>): Promise<AuthActionResult> => {
    const res = await storageService.adminUpdateSecurityRules(updates);
    if (res.ok) {
      if (res.data?.accessRules) setAccessRules(res.data.accessRules);
      await refreshAdminDashboard();
      return { ok: true, message: 'Aturan keamanan akses diperbarui.' };
    }
    return { ok: false, message: formatApiErrorMessage(res.error, 'Gagal memperbarui aturan keamanan.') };
  };

  const updateAdminPassword = async (newPassword: string): Promise<AuthActionResult> => {
    const res = await storageService.adminAuthChangePassword(newPassword);
    if (res.ok) {
      await refreshAdminDashboard();
      await refreshAdminAuthStatus();
      return {
        ok: true,
        message: formatApiErrorMessage(res.data?.message, 'Sandi Admin berhasil diperbarui.')
      };
    }
    return { ok: false, message: formatApiErrorMessage(res.error, 'Gagal memperbarui sandi Admin.') };
  };

  const updateAdminProfile = async (payload: {
    currentPassword: string;
    newUsername: string;
    newEmail?: string;
    newNamaLengkap?: string;
    newPassword?: string;
  }): Promise<AuthActionResult> => {
    const res = await storageService.adminAuthUpdateProfile(payload);
    if (res.ok) {
      if (res.data?.adminProfile) {
        setAdminProfile(res.data.adminProfile);
      }
      await refreshAdminDashboard();
      await refreshAdminAuthStatus();
      return {
        ok: true,
        adminProfile: res.data?.adminProfile || null,
        message: formatApiErrorMessage(
          res.data?.message,
          'Profil dan kredensial Admin berhasil diperbarui.'
        )
      };
    }
    return {
      ok: false,
      message: formatApiErrorMessage(res.error, 'Gagal memperbarui profil dan kredensial Admin.')
    };
  };

  const issueResetPasswordByAdmin = async (
    userId: string,
    tempResetPassword: string
  ): Promise<AuthActionResult> => {
    const res = await storageService.adminUserAction(userId, 'reset-password', tempResetPassword);
    if (res.ok) {
      await refreshAdminDashboard();
      return {
        ok: true,
        user: res.data?.user,
        message: formatApiErrorMessage(res.data?.message, 'Sandi reset diterbitkan.')
      };
    }
    return { ok: false, message: formatApiErrorMessage(res.error, 'Gagal menerbitkan sandi reset.') };
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
        deleteMultipleTasks,
        importTasks,
        inventories,
        addInventory,
        updateInventory,
        deleteInventory,
        deleteMultipleInventories,
        importInventories,
        libraryBooks,
        addLibraryBook,
        updateLibraryBook,
        deleteLibraryBook,
        deleteMultipleLibraryBooks,
        importLibraryBooks,
        libraryMembers,
        addLibraryMember,
        updateLibraryMember,
        deleteLibraryMember,
        deleteMultipleLibraryMembers,
        importLibraryMembers,
        libraryMemberStats,
        updateLibraryMemberStats,
        monthlyReports,
        saveMonthlyReport,
        annualReports,
        saveAnnualReport,
        archives,
        addArchive,
        updateArchive,
        deleteArchive,
        archiveReport,
        beritaAcaraHistory,
        saveBeritaAcaraRecord,
        deleteBeritaAcaraRecord,
        schoolConfig,
        effectiveSchoolConfig,
        hasCustomLetterhead,
        hasCustomSignature,
        updateSchoolConfig,
        saveUserLetterhead,
        resetUserLetterhead,
        saveUserSignature,
        resetUserSignature,
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
        accessUsers,
        approvedRoleCounts,
        accessRules,
        currentUser,
        setCurrentUser,
        registerAccessUser,
        loginAccessUser,
        logoutAccessUser,
        approveAccessUser,
        rejectAccessUser,
        deleteAccessUser,
        updateAccessUserPassword,
        createAccessUserByAdmin,
        updateAccessRules,
        updateAdminPassword,
        updateAdminProfile,
        requestPasswordReset,
        issueResetPasswordByAdmin,
        completePasswordResetWithNewPassword,
        lookupTrackedAccount,
        trackedUsername,
        setTrackedUsername,
        trackedUserAccount,
        approvedSchoolHeader,
        refreshAccessState,
        syncStatus,
        serverStorageMode,
        cloudPersistent,
        isInitialLoading,
        connectionError,
        retryConnection,
        siteSettings,
        databaseCapacitySummary,
        customDatabases,
        customDatabaseRecords,
        staffSubmissions,
        isAdminAuthenticated,
        adminProfile,
        adminAuthStatus,
        adminDashboardData,
        refreshAdminAuthStatus,
        claimAdminPassword,
        loginAdminSession,
        logoutAdminSession,
        refreshAdminDashboard,
        actionFeedback,
        clearActionFeedback,
        sessionExpiredNotice,
        clearSessionExpiredNotice
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp harus digunakan di dalam AppProvider');
  return ctx;
};
