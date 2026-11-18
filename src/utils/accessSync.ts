import {
  AccessSecurityRules,
  PasswordChangeLogEntry,
  RegisteredAccessUser,
  RoleType,
  UserAccountStatus
} from '../types';

export const DEFAULT_ACCESS_RULES: AccessSecurityRules = {
  requireAdminApproval: true,
  enforceUniquePassword: true,
  enforceSingleServicePerUser: true
};

export const DEFAULT_ADMIN_PASSWORD = 'admin123';

const VALID_ROLES: RoleType[] = ['TU', 'PENJAGA', 'SERVICE', 'PERPUS', 'LAB_IPA'];
const VALID_STATUSES: UserAccountStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

function parseTimestamp(iso?: string): number {
  if (!iso || typeof iso !== 'string') return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

export function getUserLatestActivityTimestamp(user: Partial<RegisteredAccessUser>): number {
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

export function mergePasswordHistory(
  a?: PasswordChangeLogEntry[],
  b?: PasswordChangeLogEntry[]
): PasswordChangeLogEntry[] {
  const map = new Map<string, PasswordChangeLogEntry>();
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

export function normalizeRegisteredUser(raw: any): RegisteredAccessUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const username = typeof raw.username === 'string' ? raw.username.trim() : '';
  const password = typeof raw.password === 'string' ? raw.password.trim() : '';
  if (!username || !password) return null;

  const role: RoleType = VALID_ROLES.includes(raw.role) ? raw.role : 'TU';
  const status: UserAccountStatus = VALID_STATUSES.includes(raw.status) ? raw.status : 'PENDING';
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

/**
 * Non-destructive merge of registered access users across server and client states.
 * Never drops existing users unless their exact ID is explicitly listed in deletedIds.
 */
export function mergeRegisteredUsers(
  primaryUsers: any[] = [],
  secondaryUsers: any[] = [],
  deletedIds: string[] = []
): RegisteredAccessUser[] {
  const deletedSet = new Set(Array.isArray(deletedIds) ? deletedIds.filter(Boolean) : []);
  const byId = new Map<string, RegisteredAccessUser>();

  const ingest = (rawList: any[]) => {
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
