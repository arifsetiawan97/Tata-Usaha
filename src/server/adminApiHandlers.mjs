import {
  checkLoginRateLimit,
  computePasswordFingerprint,
  extractBearerToken,
  getAdminPasscodeEnv,
  hashSecret,
  resetLoginRateLimit,
  sanitizeAccessUserForClient,
  signSessionToken,
  timingSafeEqualStr,
  verifySecret,
  verifySessionToken
} from './authSecurity.mjs';
import {
  DEFAULT_ACCESS_RULES,
  DEFAULT_WELCOME_HEADLINE,
  DEFAULT_WELCOME_SUBHEADLINE,
  VALID_COLLECTIONS,
  appendAuditLog,
  buildAdminStateResponse,
  buildPublicStateResponse,
  buildStaffStateResponse,
  createBackupSnapshot,
  deleteAccessUserFromDb,
  getStorageInfo,
  maybeRunScheduledBackup,
  purgeSoftDeletedRecord,
  readDb,
  restoreSoftDeletedRecord,
  rollbackMigration,
  runDataMigration,
  softDeleteRecord,
  verifyUserCredentials,
  writeDb
} from './cloudDb.mjs';
import {
  DEFAULT_DATABASE_QUOTA_BYTES,
  checkWriteCapacity,
  computeDatabaseMetrics,
  getByteSize,
  isValidIdentifier,
  sanitizeAndInspectPayload,
  validateRecordForCollection
} from './dbValidator.mjs';

const VALID_ROLES = ['TU', 'PENJAGA', 'SERVICE', 'PERPUS', 'LAB_IPA'];

const ROLE_LABELS_MAP = {
  TU: 'Tata Usaha (TU)',
  PENJAGA: 'Penjaga Sekolah',
  SERVICE: 'Service (Kebersihan)',
  PERPUS: 'Layanan Perpustakaan',
  LAB_IPA: 'Laboratorium IPA'
};

export function parseJsonBody(raw) {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

function getClientIpKey(req) {
  return String(
    req?.headers?.['x-forwarded-for'] ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      'client'
  )
    .split(',')[0]
    .trim();
}

export async function resolveAuthContext(req, db) {
  const token = extractBearerToken(req);
  if (!token) {
    return { authenticated: false, isAdmin: false, isStaff: false, session: null, userRecord: null };
  }
  const session = verifySessionToken(token);
  if (!session) {
    return { authenticated: false, isAdmin: false, isStaff: false, session: null, userRecord: null, expired: true };
  }
  if (session.sessionType === 'admin' && session.role === 'ADMIN') {
    return { authenticated: true, isAdmin: true, isStaff: false, session, userRecord: null };
  }
  if (session.sessionType === 'staff' && session.sub) {
    const userRecord = (db.accessUsers || []).find(u => u && u.id === session.sub);
    if (!userRecord || userRecord.status !== 'APPROVED') {
      return { authenticated: false, isAdmin: false, isStaff: false, session: null, userRecord: null };
    }
    return { authenticated: true, isAdmin: false, isStaff: true, session, userRecord };
  }
  return { authenticated: false, isAdmin: false, isStaff: false, session: null, userRecord: null };
}

export async function requireAdminOrReject(req, res, db, attemptedTarget = 'admin-endpoint') {
  const ctx = await resolveAuthContext(req, db);
  if (ctx.isAdmin) {
    return ctx;
  }
  appendAuditLog(db, {
    actor: ctx.session?.username || getClientIpKey(req),
    actorRole: ctx.isStaff ? ctx.session.role : 'PUBLIC',
    action: 'UNAUTHORIZED_ADMIN_ATTEMPT',
    targetDatabase: attemptedTarget,
    status: 'DENIED',
    detail: `Percobaan akses endpoint Admin ditolak (${req.method} ${req.url || attemptedTarget}).`
  });
  await writeDb(db);

  res.status(ctx.authenticated ? 403 : 401).json({
    error: ctx.authenticated
      ? 'Akses ditolak: Operasi baca/tulis/hapus langsung dan pengelolaan database hanya diizinkan untuk Admin.'
      : 'Otorisasi Admin diperlukan. Silakan masuk sebagai Admin terlebih dahulu.',
    code: ctx.authenticated ? 'ADMIN_FORBIDDEN' : 'ADMIN_AUTH_REQUIRED'
  });
  return null;
}

export async function requireStaffOrAdminOrReject(req, res, db, attemptedTarget = 'staff-endpoint') {
  const ctx = await resolveAuthContext(req, db);
  if (ctx.isAdmin || ctx.isStaff) {
    return ctx;
  }
  res.status(401).json({
    error: 'Sesi pengguna tidak valid atau telah berakhir. Silakan masuk kembali.',
    code: 'AUTH_REQUIRED'
  });
  return null;
}

// =====================================================================
// 1. STATE & BOOTSTRAP HANDLERS
// =====================================================================

export async function handleGetState(req, res) {
  const db = await readDb();
  const info = getStorageInfo();
  const ctx = await resolveAuthContext(req, db);
  const envPass = getAdminPasscodeEnv();

  if (ctx.isAdmin) {
    maybeRunScheduledBackup(db);
    return res.status(200).json({
      initialized: true,
      accessLevel: 'ADMIN',
      adminSetupRequired: !envPass && !db.adminCredentialHash,
      data: buildAdminStateResponse(db),
      ...info
    });
  }

  if (ctx.isStaff) {
    return res.status(200).json({
      initialized: true,
      accessLevel: 'STAFF',
      adminSetupRequired: !envPass && !db.adminCredentialHash,
      data: buildStaffStateResponse(db, ctx.session),
      ...info
    });
  }

  return res.status(200).json({
    initialized: true,
    accessLevel: 'PUBLIC',
    adminSetupRequired: !envPass && !db.adminCredentialHash,
    data: buildPublicStateResponse(db),
    ...info
  });
}

// =====================================================================
// 2. PUBLIC & STAFF AUTHENTICATION HANDLERS (/api/auth/*)
// =====================================================================

export async function handleAuthAction(action, req, res) {
  const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
  if (!bodyCheck.valid) {
    return res.status(400).json({ ok: false, message: bodyCheck.error, error: bodyCheck.error });
  }
  const body = bodyCheck.value || {};
  const db = await readDb();

  if (action === 'register' && req.method === 'POST') {
    const namaLengkap = String(body.namaLengkap || '').trim();
    const username = String(body.username || '').trim();
    const role = String(body.role || 'TU').trim();
    const password = String(body.password || '').trim();
    const usernameKey = username.toLowerCase();

    if (!namaLengkap || !username || !password) {
      return res.status(400).json({ ok: false, message: 'Nama lengkap, nama pengguna, dan sandi wajib diisi.' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ ok: false, message: 'Layanan operasional yang dipilih tidak valid.' });
    }
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ ok: false, message: 'Nama pengguna harus 3 sampai 50 karakter.' });
    }
    if (password.length < 4 || password.length > 64) {
      return res.status(400).json({ ok: false, message: 'Sandi minimal 4 karakter.' });
    }

    const cap = checkWriteCapacity(db, 'accessUsers', 1024);
    if (!cap.allowed) {
      return res.status(cap.status).json({ ok: false, message: cap.error });
    }

    const rules = { ...DEFAULT_ACCESS_RULES, ...(db.accessRules || {}) };
    const existingUsers = Array.isArray(db.accessUsers) ? db.accessUsers : [];

    if (rules.enforceSingleServicePerUser) {
      const existingByUsername = existingUsers.find(
        u => u.username.toLowerCase() === usernameKey && u.status !== 'REJECTED'
      );
      if (existingByUsername) {
        return res.status(409).json({
          ok: false,
          message: `Pendaftaran ditolak! Nama pengguna "@${existingByUsername.username}" sudah terdaftar untuk layanan ${ROLE_LABELS_MAP[existingByUsername.role]}. Satu pengguna hanya diperbolehkan mendaftar pada satu layanan.`
        });
      }
    } else {
      const sameRoleDup = existingUsers.find(
        u => u.username.toLowerCase() === usernameKey && u.role === role && u.status !== 'REJECTED'
      );
      if (sameRoleDup) {
        return res.status(409).json({
          ok: false,
          message: `Nama pengguna "@${sameRoleDup.username}" sudah terdaftar untuk layanan ${ROLE_LABELS_MAP[role]}.`
        });
      }
    }

    const fp = computePasswordFingerprint(password, db.serverSecurityPepper);
    if (rules.enforceUniquePassword) {
      const dupPass = existingUsers.find(
        u =>
          u.username.toLowerCase() !== usernameKey &&
          (u.passwordFingerprint ? u.passwordFingerprint === fp : verifyUserCredentials(u, password))
      );
      if (dupPass) {
        return res.status(409).json({
          ok: false,
          message: `Sandi ditolak! Kombinasi sandi tersebut sudah dipakai oleh pengguna lain. Buat sandi unik Anda sendiri.`
        });
      }
    }

    const now = new Date().toISOString();
    const initialStatus = rules.requireAdminApproval ? 'PENDING' : 'APPROVED';
    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      namaLengkap,
      username,
      role,
      passwordHash: hashSecret(password),
      passwordFingerprint: fp,
      status: initialStatus,
      createdAt: now,
      approvedAt: initialStatus === 'APPROVED' ? now : undefined,
      mustChangePassword: false,
      passwordChangeHistory: [
        {
          changedAt: now,
          source: 'USER_CHANGE',
          maskedPreview: '••••••'
        }
      ]
    };

    db.accessUsers = [newUser, ...existingUsers];
    db.deletedAccessUserIds = (db.deletedAccessUserIds || []).filter(id => id !== newUser.id);
    appendAuditLog(db, {
      actor: username,
      actorRole: role,
      action: 'USER_REGISTER',
      targetDatabase: 'accessUsers',
      targetId: newUser.id,
      status: 'SUCCESS',
      detail: `Pendaftaran akun baru @${username} (${ROLE_LABELS_MAP[role]}) dengan status ${initialStatus}.`
    });

    await writeDb(db);
    return res.status(201).json({
      ok: true,
      user: sanitizeAccessUserForClient(newUser),
      message:
        initialStatus === 'PENDING'
          ? `Pengajuan akun @${username} untuk layanan ${ROLE_LABELS_MAP[role]} berhasil dikirim ke Database Admin! Status saat ini: MENUNGGU PERSETUJUAN ADMIN.`
          : `Akun @${username} untuk layanan ${ROLE_LABELS_MAP[role]} berhasil dibuat dan aktif.`
    });
  }

  if (action === 'login' && req.method === 'POST') {
    const rate = checkLoginRateLimit(`staff:${getClientIpKey(req)}`, 15, 5 * 60 * 1000);
    if (!rate.allowed) {
      return res.status(429).json({
        ok: false,
        message: `Terlalu banyak percobaan masuk. Coba lagi dalam ${rate.retryAfterSec} detik.`
      });
    }

    const cleanUsername = String(body.username || '').trim();
    const cleanPassword = String(body.password || '').trim();
    const expectedRole = body.expectedRole ? String(body.expectedRole).trim() : undefined;

    if (!cleanUsername || !cleanPassword) {
      return res.status(400).json({ ok: false, message: 'Nama pengguna dan sandi wajib diisi.' });
    }

    const rules = { ...DEFAULT_ACCESS_RULES, ...(db.accessRules || {}) };
    const matchingUsers = (db.accessUsers || []).filter(
      u => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    if (matchingUsers.length === 0) {
      appendAuditLog(db, {
        actor: cleanUsername,
        actorRole: expectedRole || 'PUBLIC',
        action: 'LOGIN_FAILED',
        targetDatabase: 'accessUsers',
        status: 'FAILED',
        detail: `Percobaan login username tidak dikenal: @${cleanUsername}`
      });
      await writeDb(db);
      return res.status(401).json({
        ok: false,
        message: `Nama pengguna "@${cleanUsername}" belum terdaftar di Database Admin. Silakan ajukan pendaftaran akun terlebih dahulu.`
      });
    }

    let targetUser;
    if (expectedRole) {
      if (rules.enforceSingleServicePerUser && matchingUsers[0].role !== expectedRole) {
        return res.status(403).json({
          ok: false,
          message: `Akses layanan ditolak! Pengguna "@${matchingUsers[0].username}" hanya terdaftar untuk layanan ${ROLE_LABELS_MAP[matchingUsers[0].role]}.`
        });
      }
      targetUser = matchingUsers.find(u => u.role === expectedRole);
      if (!targetUser) {
        return res.status(403).json({
          ok: false,
          message: `Pengguna "@${cleanUsername}" tidak memiliki akses untuk layanan ${ROLE_LABELS_MAP[expectedRole]}.`
        });
      }
    } else {
      targetUser = matchingUsers.find(u => verifyUserCredentials(u, cleanPassword)) || matchingUsers[0];
    }

    if (targetUser.status === 'REJECTED') {
      return res.status(403).json({
        ok: false,
        message: `Akun "@${targetUser.username}" telah ditolak oleh Admin dan tidak dapat masuk.`
      });
    }

    if (rules.requireAdminApproval && targetUser.status !== 'APPROVED') {
      return res.status(403).json({
        ok: false,
        message: `Akun "@${targetUser.username}" masih berstatus MENUNGGU PERSETUJUAN Admin.`
      });
    }

    if (!verifyUserCredentials(targetUser, cleanPassword)) {
      appendAuditLog(db, {
        actor: targetUser.username,
        actorRole: targetUser.role,
        action: 'LOGIN_FAILED',
        targetDatabase: 'accessUsers',
        targetId: targetUser.id,
        status: 'FAILED',
        detail: `Sandi tidak sesuai untuk @${targetUser.username}.`
      });
      await writeDb(db);
      return res.status(401).json({
        ok: false,
        message: `Sandi salah untuk nama pengguna "@${targetUser.username}".`
      });
    }

    resetLoginRateLimit(`staff:${getClientIpKey(req)}`);

    const now = new Date().toISOString();
    // Upgrade legacy plaintext user to scrypt hash if still needed
    const upgradedHash = targetUser.passwordHash || hashSecret(cleanPassword);
    const upgradedFp =
      targetUser.passwordFingerprint || computePasswordFingerprint(cleanPassword, db.serverSecurityPepper);

    const updatedUser = {
      ...targetUser,
      passwordHash: upgradedHash,
      passwordFingerprint: upgradedFp,
      lastLoginAt: now
    };
    delete updatedUser.password;

    db.accessUsers = (db.accessUsers || []).map(u => (u.id === targetUser.id ? updatedUser : u));
    appendAuditLog(db, {
      actor: updatedUser.username,
      actorRole: updatedUser.role,
      action: 'LOGIN_SUCCESS',
      targetDatabase: 'accessUsers',
      targetId: updatedUser.id,
      status: 'SUCCESS',
      detail: `Berhasil masuk ke layanan ${ROLE_LABELS_MAP[updatedUser.role]}.`
    });
    await writeDb(db);

    const issued = signSessionToken({
      sub: updatedUser.id,
      username: updatedUser.username,
      namaLengkap: updatedUser.namaLengkap,
      role: updatedUser.role,
      sessionType: 'staff'
    });

    return res.status(200).json({
      ok: true,
      token: issued.token,
      expiresAt: issued.expiresAt,
      requiresPasswordChange: Boolean(updatedUser.mustChangePassword),
      user: sanitizeAccessUserForClient(updatedUser, { includeTempResetCode: true }),
      message: updatedUser.mustChangePassword
        ? `Selamat datang, ${updatedUser.namaLengkap}! Anda masuk menggunakan sandi sementara. Segera buat sandi baru.`
        : `Selamat datang, ${updatedUser.namaLengkap}! Berhasil masuk ke layanan ${ROLE_LABELS_MAP[updatedUser.role]}.`
    });
  }

  if (action === 'refresh' && req.method === 'POST') {
    const ctx = await resolveAuthContext(req, db);
    if (!ctx.isStaff || !ctx.userRecord) {
      return res.status(401).json({ ok: false, message: 'Sesi pengguna berakhir. Silakan masuk ulang.' });
    }
    const issued = signSessionToken({
      sub: ctx.userRecord.id,
      username: ctx.userRecord.username,
      namaLengkap: ctx.userRecord.namaLengkap,
      role: ctx.userRecord.role,
      sessionType: 'staff'
    });
    return res.status(200).json({
      ok: true,
      token: issued.token,
      expiresAt: issued.expiresAt,
      user: sanitizeAccessUserForClient(ctx.userRecord, { includeTempResetCode: true })
    });
  }

  if (action === 'request-reset' && req.method === 'POST') {
    const cleanUsername = String(body.username || '').trim();
    const note = String(body.note || '').trim();
    if (!cleanUsername) {
      return res.status(400).json({ ok: false, message: 'Masukkan nama pengguna Anda.' });
    }

    const matches = (db.accessUsers || []).filter(
      u => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (matches.length === 0) {
      return res.status(404).json({ ok: false, message: `Nama pengguna "@${cleanUsername}" tidak ditemukan.` });
    }
    const activeMatch = matches.find(u => u.status !== 'REJECTED');
    if (!activeMatch) {
      return res.status(403).json({ ok: false, message: `Akun "@${cleanUsername}" berstatus DITOLAK.` });
    }

    const now = new Date().toISOString();
    db.accessUsers = (db.accessUsers || []).map(u =>
      u.id === activeMatch.id
        ? {
            ...u,
            resetRequestStatus: 'REQUESTED',
            resetRequestedAt: now,
            resetRequestNote: note || 'Lupa sandi, mohon reset sandi.'
          }
        : u
    );
    appendAuditLog(db, {
      actor: activeMatch.username,
      actorRole: activeMatch.role,
      action: 'REQUEST_PASSWORD_RESET',
      targetDatabase: 'accessUsers',
      targetId: activeMatch.id,
      status: 'SUCCESS',
      detail: `Pengajuan lupa sandi oleh @${activeMatch.username}.`
    });
    await writeDb(db);

    return res.status(200).json({
      ok: true,
      message: `Permintaan reset sandi untuk "@${activeMatch.username}" telah terkirim ke Database Admin.`
    });
  }

  if (action === 'status-lookup' && req.method === 'POST') {
    const cleanUsername = String(body.username || '').trim();
    if (!cleanUsername) {
      return res.status(400).json({ ok: false, message: 'Masukkan nama pengguna yang ingin dicek.' });
    }
    const found = (db.accessUsers || []).find(
      u => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (!found) {
      return res.status(404).json({ ok: false, message: `Nama pengguna "@${cleanUsername}" belum terdaftar di sistem.` });
    }
    return res.status(200).json({
      ok: true,
      user: sanitizeAccessUserForClient(found, { includeTempResetCode: true })
    });
  }

  if (action === 'change-password' && req.method === 'POST') {
    const ctx = await requireStaffOrAdminOrReject(req, res, db, 'auth/change-password');
    if (!ctx) return;
    if (!ctx.userRecord) {
      return res.status(400).json({ ok: false, message: 'Gunakan endpoint perubahan sandi Admin.' });
    }
    const newPassword = String(body.newPassword || '').trim();
    if (newPassword.length < 4 || newPassword.length > 64) {
      return res.status(400).json({ ok: false, message: 'Sandi baru minimal 4 karakter.' });
    }
    if (verifyUserCredentials(ctx.userRecord, newPassword)) {
      return res.status(400).json({
        ok: false,
        message: 'Sandi baru tidak boleh sama dengan sandi saat ini / sandi sementara.'
      });
    }

    const rules = { ...DEFAULT_ACCESS_RULES, ...(db.accessRules || {}) };
    const fp = computePasswordFingerprint(newPassword, db.serverSecurityPepper);
    if (rules.enforceUniquePassword) {
      const conflict = (db.accessUsers || []).find(
        u =>
          u.id !== ctx.userRecord.id &&
          u.username.toLowerCase() !== ctx.userRecord.username.toLowerCase() &&
          (u.passwordFingerprint ? u.passwordFingerprint === fp : verifyUserCredentials(u, newPassword))
      );
      if (conflict) {
        return res.status(409).json({
          ok: false,
          message: 'Sandi baru ditolak karena kombinasi sandi tersebut sudah dipakai pengguna lain.'
        });
      }
    }

    const now = new Date().toISOString();
    const updatedUser = {
      ...ctx.userRecord,
      passwordHash: hashSecret(newPassword),
      passwordFingerprint: fp,
      mustChangePassword: false,
      resetRequestStatus: ctx.userRecord.resetRequestStatus === 'RESET_ISSUED' ? 'COMPLETED' : ctx.userRecord.resetRequestStatus,
      passwordUpdatedAt: now,
      passwordChangeHistory: [
        {
          changedAt: now,
          source: ctx.userRecord.resetRequestStatus === 'RESET_ISSUED' ? 'USER_AFTER_RESET' : 'USER_CHANGE',
          maskedPreview: '••••••'
        },
        ...(Array.isArray(ctx.userRecord.passwordChangeHistory) ? ctx.userRecord.passwordChangeHistory : [])
      ].slice(0, 20)
    };
    delete updatedUser.tempResetCode;
    delete updatedUser.password;

    db.accessUsers = (db.accessUsers || []).map(u => (u.id === updatedUser.id ? updatedUser : u));
    appendAuditLog(db, {
      actor: updatedUser.username,
      actorRole: updatedUser.role,
      action: 'USER_CHANGE_PASSWORD',
      targetDatabase: 'accessUsers',
      targetId: updatedUser.id,
      status: 'SUCCESS',
      detail: `Pengguna @${updatedUser.username} memperbarui sandi akunnya.`
    });
    await writeDb(db);

    return res.status(200).json({
      ok: true,
      user: sanitizeAccessUserForClient(updatedUser),
      message: `Sandi baru untuk "@${updatedUser.username}" berhasil disimpan dan tercatat di Admin.`
    });
  }

  return res.status(404).json({ error: `Endpoint auth tidak ditemukan: ${action}` });
}

// =====================================================================
// 3. STAFF SAFE SUBMISSION QUEUE (NO DIRECT WRITE/DELETE TO CORE DB)
// =====================================================================

export async function handleStaffSubmission(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const db = await readDb();
  const ctx = await requireStaffOrAdminOrReject(req, res, db, 'staff/submissions');
  if (!ctx) return;

  const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
  if (!bodyCheck.valid) {
    return res.status(400).json({ ok: false, error: bodyCheck.error });
  }
  const { targetCollection, operationType, payload, note } = bodyCheck.value || {};

  // Strictly block direct DELETE from non-admin staff
  if (String(operationType || '').toUpperCase().includes('DELETE')) {
    appendAuditLog(db, {
      actor: ctx.session.username,
      actorRole: ctx.session.role,
      action: 'BLOCKED_NON_ADMIN_DELETE',
      targetDatabase: String(targetCollection || '-'),
      status: 'DENIED',
      detail: 'Akses penghapusan langsung dari sisi non-admin ditolak server.'
    });
    await writeDb(db);
    return res.status(403).json({
      ok: false,
      error: 'Akses penghapusan langsung oleh pengguna non-admin diputus demi keamanan data. Hanya Admin yang dapat menghapus/mengarsipkan data.'
    });
  }

  const allowedTargets = [...VALID_COLLECTIONS, 'schoolConfigLetterhead', 'schoolConfigSignature', 'tupoksiDefinitions'];
  if (!allowedTargets.includes(targetCollection)) {
    return res.status(400).json({ ok: false, error: `Target pengajuan "${targetCollection}" tidak valid.` });
  }

  if (VALID_COLLECTIONS.includes(targetCollection)) {
    const val = validateRecordForCollection(targetCollection, payload);
    if (!val.valid) {
      return res.status(400).json({ ok: false, error: val.error });
    }
    const cap = checkWriteCapacity(db, targetCollection, getByteSize(val.record));
    if (!cap.allowed) {
      return res.status(cap.status).json({ ok: false, error: cap.error });
    }
  }

  const submission = {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    submittedBy: ctx.session.username,
    submittedByName: ctx.session.namaLengkap || ctx.session.username,
    role: ctx.session.role,
    targetCollection,
    operationType: operationType === 'UPDATE' ? 'UPDATE' : 'CREATE',
    payload,
    note: String(note || '').slice(0, 300),
    status: 'PENDING_ADMIN_REVIEW',
    submittedAt: new Date().toISOString()
  };

  if (!Array.isArray(db.staffSubmissions)) db.staffSubmissions = [];
  db.staffSubmissions.unshift(submission);
  db.staffSubmissions = db.staffSubmissions.slice(0, 200);

  appendAuditLog(db, {
    actor: ctx.session.username,
    actorRole: ctx.session.role,
    action: 'STAFF_SUBMISSION_QUEUED',
    targetDatabase: targetCollection,
    targetId: submission.id,
    status: 'SUCCESS',
    detail: `Ajuan data (${submission.operationType}) dikirim ke antrean validasi Database Admin.`
  });
  await writeDb(db);

  return res.status(201).json({
    ok: true,
    submission,
    message:
      'Ajuan data berhasil dikirim ke antrean Database Admin. Penyimpanan permanen ke database inti dilakukan setelah validasi Admin.'
  });
}

// =====================================================================
// 4. ADMIN AUTH, DATABASE MANAGEMENT, CAPACITY, BACKUP, MIGRATION
// =====================================================================

export async function handleAdminRoute(segments, req, res) {
  const pathJoined = segments.join('/');
  const db = await readDb();

  // Public-accessible Admin Auth bootstrap & login endpoints
  if (pathJoined === 'auth/status' && req.method === 'GET') {
    const envPass = getAdminPasscodeEnv();
    return res.status(200).json({
      envOverrideActive: Boolean(envPass),
      isClaimed: Boolean(db.adminCredentialHash),
      setupRequired: !envPass && !db.adminCredentialHash
    });
  }

  if (pathJoined === 'auth/claim' && req.method === 'POST') {
    const envPass = getAdminPasscodeEnv();
    if (envPass || db.adminCredentialHash) {
      return res.status(409).json({
        ok: false,
        error: 'Sandi Admin Utama sudah ditetapkan dan dikunci. Silakan masuk menggunakan sandi Admin.'
      });
    }
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) {
      return res.status(400).json({ ok: false, error: bodyCheck.error });
    }
    const password = String(bodyCheck.value?.password || '').trim();
    if (password.length < 6 || password.length > 100) {
      return res.status(400).json({
        ok: false,
        error: 'Sandi Admin Utama pertama kali wajib minimal 6 karakter.'
      });
    }

    db.adminCredentialHash = hashSecret(password);
    delete db.adminPassword;
    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'ADMIN_BOOTSTRAP_CLAIM',
      targetDatabase: 'system',
      status: 'SUCCESS',
      detail: 'Sandi Admin Utama berhasil diinisialisasi dan dikunci pada server.'
    });
    await writeDb(db);

    const issued = signSessionToken({
      sub: 'admin-root',
      username: 'admin',
      namaLengkap: 'Administrator Utama',
      role: 'ADMIN',
      sessionType: 'admin'
    });

    return res.status(201).json({
      ok: true,
      token: issued.token,
      expiresAt: issued.expiresAt,
      message: 'Sandi Admin Utama berhasil ditetapkan dan sesi Admin aktif!'
    });
  }

  if (pathJoined === 'auth/login' && req.method === 'POST') {
    const ipKey = `admin:${getClientIpKey(req)}`;
    const rate = checkLoginRateLimit(ipKey, 8, 5 * 60 * 1000);
    if (!rate.allowed) {
      return res.status(429).json({
        ok: false,
        error: `Terlalu banyak percobaan login Admin. Silakan coba lagi dalam ${rate.retryAfterSec} detik.`
      });
    }

    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) {
      return res.status(400).json({ ok: false, error: bodyCheck.error });
    }
    const password = String(bodyCheck.value?.password || '').trim();
    if (!password) {
      return res.status(400).json({ ok: false, error: 'Masukkan sandi Admin.' });
    }

    const envPass = getAdminPasscodeEnv();
    let verified = false;
    if (envPass) {
      verified = timingSafeEqualStr(password, envPass);
    } else if (db.adminCredentialHash) {
      verified = verifySecret(password, db.adminCredentialHash);
    } else {
      return res.status(428).json({
        ok: false,
        setupRequired: true,
        error: 'Sandi Admin belum ditetapkan. Silakan lengkapi formulir penetapan sandi Admin pertama kali.'
      });
    }

    if (!verified) {
      appendAuditLog(db, {
        actor: getClientIpKey(req),
        actorRole: 'PUBLIC',
        action: 'ADMIN_LOGIN_FAILED',
        targetDatabase: 'system',
        status: 'DENIED',
        detail: 'Sandi Admin salah saat mencoba membuka Panel Database Admin.'
      });
      await writeDb(db);
      return res.status(401).json({ ok: false, error: 'Sandi Admin tidak sesuai!' });
    }

    resetLoginRateLimit(ipKey);
    maybeRunScheduledBackup(db);
    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'ADMIN_LOGIN_SUCCESS',
      targetDatabase: 'system',
      status: 'SUCCESS',
      detail: 'Admin berhasil terautentikasi membuka Database Satu Pintu.'
    });
    await writeDb(db);

    const issued = signSessionToken({
      sub: 'admin-root',
      username: 'admin',
      namaLengkap: 'Administrator Utama',
      role: 'ADMIN',
      sessionType: 'admin'
    });

    return res.status(200).json({
      ok: true,
      token: issued.token,
      expiresAt: issued.expiresAt,
      message: 'Autentikasi Admin berhasil.'
    });
  }

  // All routes below strictly require verified Admin Bearer Token!
  const adminCtx = await requireAdminOrReject(req, res, db, `admin/${pathJoined}`);
  if (!adminCtx) return;

  if (pathJoined === 'auth/refresh' && req.method === 'POST') {
    const issued = signSessionToken({
      sub: 'admin-root',
      username: 'admin',
      namaLengkap: 'Administrator Utama',
      role: 'ADMIN',
      sessionType: 'admin'
    });
    return res.status(200).json({ ok: true, token: issued.token, expiresAt: issued.expiresAt });
  }

  if (pathJoined === 'auth/change-password' && req.method === 'POST') {
    const envPass = getAdminPasscodeEnv();
    if (envPass) {
      return res.status(409).json({
        ok: false,
        error: 'Sandi Admin saat ini dikelola melalui environment variable ADMIN_PASSCODE di server.'
      });
    }
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });
    const newPassword = String(bodyCheck.value?.newPassword || '').trim();
    if (newPassword.length < 6) {
      return res.status(400).json({ ok: false, error: 'Sandi Admin baru minimal 6 karakter.' });
    }
    db.adminCredentialHash = hashSecret(newPassword);
    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'ADMIN_CHANGE_PASSWORD',
      targetDatabase: 'system',
      status: 'SUCCESS',
      detail: 'Sandi Admin Utama diperbarui (scrypt hash).'
    });
    await writeDb(db);
    return res.status(200).json({ ok: true, message: 'Sandi Admin berhasil diperbarui dan dienkripsi di server.' });
  }

  if (pathJoined === 'dashboard' && req.method === 'GET') {
    const didScheduled = maybeRunScheduledBackup(db);
    if (didScheduled) await writeDb(db);
    return res.status(200).json({
      ok: true,
      data: buildAdminStateResponse(db),
      ...getStorageInfo()
    });
  }

  // Site Settings (Welcome Headline Customization)
  if (pathJoined === 'site-settings' && req.method === 'PUT') {
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });
    const headline = String(bodyCheck.value?.welcomeHeadline || '').trim().slice(0, 200);
    const subheadline =
      bodyCheck.value?.welcomeSubheadline !== undefined
        ? String(bodyCheck.value.welcomeSubheadline || '').trim().slice(0, 400)
        : db.siteSettings?.welcomeSubheadline || DEFAULT_WELCOME_SUBHEADLINE;

    if (!headline) {
      return res.status(400).json({ ok: false, error: 'Kalimat pembuka tidak boleh kosong.' });
    }

    db.siteSettings = {
      welcomeHeadline: headline,
      welcomeSubheadline: subheadline,
      updatedAt: new Date().toISOString(),
      updatedBy: 'ADMIN_UTAMA'
    };
    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'UPDATE_WELCOME_TEXT',
      targetDatabase: 'siteSettings',
      status: 'SUCCESS',
      detail: `Kalimat pembuka diperbarui menjadi "${headline}".`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      siteSettings: db.siteSettings,
      message: 'Kalimat halaman pembuka berhasil diperbarui untuk semua pengguna.'
    });
  }

  // Global Database Quota Setting
  if (pathJoined === 'quota' && req.method === 'PUT') {
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });
    const quotaBytes = Number(bodyCheck.value?.databaseQuotaBytes);
    if (!Number.isFinite(quotaBytes) || quotaBytes < 100 * 1024 || quotaBytes > 100 * 1024 * 1024) {
      return res.status(400).json({
        ok: false,
        error: 'Batas kapasitas total harus antara 100 KB sampai 100 MB.'
      });
    }
    db.databaseQuotaBytes = Math.round(quotaBytes);
    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'UPDATE_DB_QUOTA',
      targetDatabase: 'system',
      status: 'SUCCESS',
      detail: `Kuota total database diatur ke ${Math.round(quotaBytes / 1024)} KB.`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      databaseMetrics: computeDatabaseMetrics(db),
      message: 'Batas kapasitas total Database Admin berhasil diperbarui.'
    });
  }

  // Tambah Database Baru & Kelola Database
  if (pathJoined === 'databases' && req.method === 'POST') {
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });
    const input = bodyCheck.value || {};

    const rawCode = String(input.code || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    const name = String(input.name || '').trim().slice(0, 120);
    const moduleName = String(input.module || 'Umum / Lintas Layanan').trim().slice(0, 120);
    const description = String(input.description || '').trim().slice(0, 500);
    const maxRecords = Math.max(10, Math.min(100000, Number(input.maxRecords) || 500));
    const capacityLimitBytes = Math.max(
      4096,
      Math.min(50 * 1024 * 1024, Number(input.capacityLimitBytes) || 256 * 1024)
    );
    const status = ['ACTIVE', 'ARCHIVED'].includes(input.status) ? input.status : 'ACTIVE';

    if (!rawCode || !isValidIdentifier(rawCode)) {
      return res.status(400).json({
        ok: false,
        error: 'Kode database wajib 2-64 karakter (huruf, angka, garis bawah, atau tanda hubung).'
      });
    }
    if (!name) {
      return res.status(400).json({ ok: false, error: 'Nama database wajib diisi.' });
    }
    if ((db.databaseRegistry || []).some(d => d.code.toLowerCase() === rawCode)) {
      return res.status(409).json({
        ok: false,
        error: `Kode database "${rawCode}" sudah terdaftar di Database Admin.`
      });
    }

    const fields = Array.isArray(input.fields)
      ? input.fields
          .filter(f => f && typeof f === 'object' && isValidIdentifier(String(f.key || '')))
          .slice(0, 20)
          .map(f => ({
            key: String(f.key).trim(),
            label: String(f.label || f.key).trim().slice(0, 80),
            type: ['text', 'number', 'date', 'boolean', 'select'].includes(f.type) ? f.type : 'text',
            required: Boolean(f.required)
          }))
      : [
          { key: 'judul', label: 'Judul / Nama Data', type: 'text', required: true },
          { key: 'keterangan', label: 'Keterangan', type: 'text', required: false }
        ];

    const now = new Date().toISOString();
    const newDbDef = {
      code: rawCode,
      name,
      module: moduleName,
      description,
      capacityLimitBytes,
      maxRecords,
      status,
      isBuiltin: false,
      fields,
      createdAt: now,
      updatedAt: now
    };

    db.databaseRegistry.push(newDbDef);
    if (!db.customDatabaseRecords || typeof db.customDatabaseRecords !== 'object') {
      db.customDatabaseRecords = {};
    }
    db.customDatabaseRecords[rawCode] = [];

    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'CREATE_DATABASE',
      targetDatabase: rawCode,
      status: 'SUCCESS',
      detail: `Database baru "${name}" (${rawCode}) ditambahkan dengan batas ${maxRecords} baris / ${Math.round(capacityLimitBytes / 1024)} KB.`
    });
    await writeDb(db);

    return res.status(201).json({
      ok: true,
      database: newDbDef,
      databaseMetrics: computeDatabaseMetrics(db),
      message: `Database baru "${name}" berhasil dibuat dan terintegrasi di Database Admin.`
    });
  }

  if (segments[0] === 'databases' && segments[1]) {
    const dbCode = segments[1];
    const targetIdx = (db.databaseRegistry || []).findIndex(d => d.code === dbCode);
    if (targetIdx === -1) {
      return res.status(404).json({ ok: false, error: `Database "${dbCode}" tidak ditemukan.` });
    }

    if (req.method === 'PUT') {
      const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
      if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });
      const updates = bodyCheck.value || {};
      const existing = db.databaseRegistry[targetIdx];

      const nextDef = {
        ...existing,
        ...(updates.name ? { name: String(updates.name).trim().slice(0, 120) } : {}),
        ...(updates.module ? { module: String(updates.module).trim().slice(0, 120) } : {}),
        ...(updates.description !== undefined ? { description: String(updates.description).trim().slice(0, 500) } : {}),
        ...(updates.maxRecords !== undefined
          ? { maxRecords: Math.max(5, Math.min(100000, Number(updates.maxRecords) || existing.maxRecords)) }
          : {}),
        ...(updates.capacityLimitBytes !== undefined
          ? {
              capacityLimitBytes: Math.max(
                2048,
                Math.min(50 * 1024 * 1024, Number(updates.capacityLimitBytes) || existing.capacityLimitBytes)
              )
            }
          : {}),
        ...(updates.status && ['ACTIVE', 'ARCHIVED', 'LOCKED'].includes(updates.status)
          ? { status: updates.status }
          : {}),
        updatedAt: new Date().toISOString()
      };

      db.databaseRegistry[targetIdx] = nextDef;
      appendAuditLog(db, {
        actor: 'ADMIN_UTAMA',
        actorRole: 'ADMIN',
        action: 'UPDATE_DATABASE_CONFIG',
        targetDatabase: dbCode,
        status: 'SUCCESS',
        detail: `Pengaturan database "${nextDef.name}" diperbarui (status: ${nextDef.status}, batas: ${nextDef.maxRecords} baris).`
      });
      await writeDb(db);
      return res.status(200).json({
        ok: true,
        database: nextDef,
        databaseMetrics: computeDatabaseMetrics(db),
        message: `Konfigurasi database "${nextDef.name}" berhasil diperbarui.`
      });
    }

    if (req.method === 'DELETE') {
      const existing = db.databaseRegistry[targetIdx];
      if (existing.isBuiltin) {
        return res.status(403).json({
          ok: false,
          error: 'Database inti bawaan sistem tidak dapat dihapus, hanya dapat diubah statusnya menjadi Arsip atau Terkunci.'
        });
      }
      const rows = Array.isArray(db.customDatabaseRecords?.[dbCode]) ? db.customDatabaseRecords[dbCode] : [];
      db.databaseRegistry = db.databaseRegistry.filter(d => d.code !== dbCode);
      delete db.customDatabaseRecords[dbCode];

      const trashEntry = {
        trashId: `trsh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sourceCollection: '__CUSTOM_DATABASE__',
        isCustomDb: true,
        originalId: dbCode,
        itemTitle: `Database: ${existing.name} (${rows.length} data)`,
        itemSnapshot: { definition: existing, records: rows },
        deletedAt: new Date().toISOString(),
        deletedBy: 'ADMIN_UTAMA',
        reason: 'Soft-delete database kustom oleh Admin'
      };
      if (!Array.isArray(db.softDeletedItems)) db.softDeletedItems = [];
      db.softDeletedItems.unshift(trashEntry);

      appendAuditLog(db, {
        actor: 'ADMIN_UTAMA',
        actorRole: 'ADMIN',
        action: 'SOFT_DELETE_DATABASE',
        targetDatabase: dbCode,
        status: 'SUCCESS',
        detail: `Database kustom "${existing.name}" dipindahkan ke Arsip Sementara.`
      });
      await writeDb(db);
      return res.status(200).json({
        ok: true,
        trashEntry,
        databaseMetrics: computeDatabaseMetrics(db),
        message: `Database "${existing.name}" dipindahkan ke Arsip Sementara (bisa dipulihkan kapan saja).`
      });
    }
  }

  // Admin Records CRUD (Built-in + Custom Databases, with Schema Validation, Capacity Enforcement & Soft-Delete)
  if (segments[0] === 'records' && segments[1]) {
    const collection = segments[1];
    const recordId = segments[2] || '';
    const customDb = (db.databaseRegistry || []).find(d => d.code === collection && !d.isBuiltin);
    if (!VALID_COLLECTIONS.includes(collection) && !customDb) {
      return res.status(400).json({ ok: false, error: `Database/koleksi "${collection}" tidak terdaftar.` });
    }

    if (req.method === 'POST') {
      const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
      if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });

      const validation = validateRecordForCollection(collection, bodyCheck.value, customDb || null);
      if (!validation.valid) {
        appendAuditLog(db, {
          actor: 'ADMIN_UTAMA',
          actorRole: 'ADMIN',
          action: 'SCHEMA_VALIDATION_REJECTED',
          targetDatabase: collection,
          status: 'FAILED',
          detail: validation.error
        });
        await writeDb(db);
        return res.status(400).json({ ok: false, error: validation.error });
      }

      const capCheck = checkWriteCapacity(db, collection, getByteSize(validation.record));
      if (!capCheck.allowed) {
        appendAuditLog(db, {
          actor: 'ADMIN_UTAMA',
          actorRole: 'ADMIN',
          action: 'CAPACITY_LOCK_BLOCKED',
          targetDatabase: collection,
          status: 'FAILED',
          detail: capCheck.error
        });
        await writeDb(db);
        return res.status(capCheck.status).json({ ok: false, error: capCheck.error });
      }

      if (customDb) {
        if (!Array.isArray(db.customDatabaseRecords[collection])) db.customDatabaseRecords[collection] = [];
        db.customDatabaseRecords[collection].unshift(validation.record);
      } else {
        if (!Array.isArray(db[collection])) db[collection] = [];
        db[collection].unshift(validation.record);
      }

      appendAuditLog(db, {
        actor: 'ADMIN_UTAMA',
        actorRole: 'ADMIN',
        action: 'CREATE_RECORD',
        targetDatabase: collection,
        targetId: validation.record.id,
        status: 'SUCCESS',
        detail: `Menambahkan data baru ke ${collection}.`
      });
      await writeDb(db);
      return res.status(201).json({
        ok: true,
        created: validation.record,
        databaseMetrics: computeDatabaseMetrics(db)
      });
    }

    if (req.method === 'PUT' && recordId) {
      const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
      if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });

      const list = customDb
        ? db.customDatabaseRecords?.[collection] || []
        : db[collection] || [];
      const idx = list.findIndex(r => r && r.id === recordId);
      const mergedCandidate = idx === -1 ? { ...bodyCheck.value, id: recordId } : { ...list[idx], ...bodyCheck.value, id: recordId };

      const validation = validateRecordForCollection(collection, mergedCandidate, customDb || null);
      if (!validation.valid) {
        return res.status(400).json({ ok: false, error: validation.error });
      }

      const nextList = [...list];
      if (idx === -1) nextList.unshift(validation.record);
      else nextList[idx] = validation.record;

      if (customDb) db.customDatabaseRecords[collection] = nextList;
      else db[collection] = nextList;

      appendAuditLog(db, {
        actor: 'ADMIN_UTAMA',
        actorRole: 'ADMIN',
        action: 'UPDATE_RECORD',
        targetDatabase: collection,
        targetId: recordId,
        status: 'SUCCESS',
        detail: `Memperbarui data ID ${recordId} di ${collection}.`
      });
      await writeDb(db);
      return res.status(200).json({
        ok: true,
        updated: validation.record,
        databaseMetrics: computeDatabaseMetrics(db)
      });
    }

    if (req.method === 'DELETE' && recordId) {
      const result = softDeleteRecord(db, {
        collection,
        id: recordId,
        actor: 'ADMIN_UTAMA',
        reason: 'Soft-delete melalui Database Admin'
      });
      if (!result.ok) {
        return res.status(result.status || 404).json({ ok: false, error: result.error });
      }
      await writeDb(db);
      return res.status(200).json({
        ok: true,
        softDeleted: result.trashEntry,
        databaseMetrics: computeDatabaseMetrics(db),
        message: 'Data dipindahkan ke Arsip Sementara (Soft-Delete) dan dapat dipulihkan.'
      });
    }
  }

  // Soft-Delete Trash Restore & Permanent Purge
  if (segments[0] === 'trash' && segments[1] && segments[2] === 'restore' && req.method === 'POST') {
    const result = restoreSoftDeletedRecord(db, { trashId: segments[1], actor: 'ADMIN_UTAMA' });
    if (!result.ok) return res.status(result.status || 400).json({ ok: false, error: result.error });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      restored: result.restored,
      message: 'Data berhasil dipulihkan dari Arsip Sementara ke database aktif.'
    });
  }

  if (segments[0] === 'trash' && segments[1] && segments[2] === 'purge' && req.method === 'DELETE') {
    const confirmHeader = req.headers['x-confirm-purge'];
    if (confirmHeader !== 'CONFIRM_PERMANENT_DELETE') {
      return res.status(400).json({
        ok: false,
        error: 'Konfirmasi berlapis diperlukan untuk penghapusan permanen.'
      });
    }
    const result = purgeSoftDeletedRecord(db, { trashId: segments[1], actor: 'ADMIN_UTAMA' });
    if (!result.ok) return res.status(result.status || 404).json({ ok: false, error: result.error });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      purgedId: result.purgedId,
      message: 'Data dihapus permanen dari Arsip Sementara.'
    });
  }

  // Backups & Restore
  if (pathJoined === 'backups' && req.method === 'POST') {
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    const label = bodyCheck.valid ? String(bodyCheck.value?.label || '').trim() : '';
    const snap = createBackupSnapshot(db, {
      type: 'MANUAL',
      label: label || undefined,
      actor: 'ADMIN_UTAMA'
    });
    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'CREATE_BACKUP',
      targetDatabase: 'all',
      targetId: snap.id,
      status: 'SUCCESS',
      detail: `Membuat cadangan penuh "${snap.label}" (${snap.totalRecords} baris).`
    });
    await writeDb(db);
    const { snapshot: _s, ...meta } = snap;
    return res.status(201).json({
      ok: true,
      backup: meta,
      message: 'Snapshot cadangan penuh berhasil disimpan di server.'
    });
  }

  if (pathJoined === 'backups/schedule' && req.method === 'PUT') {
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });
    const enabled = Boolean(bodyCheck.value?.enabled);
    const intervalHours = Math.max(1, Math.min(720, Number(bodyCheck.value?.intervalHours) || 24));
    db.backupSchedule = {
      ...(db.backupSchedule || {}),
      enabled,
      intervalHours
    };
    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'UPDATE_BACKUP_SCHEDULE',
      targetDatabase: 'system',
      status: 'SUCCESS',
      detail: `Jadwal pencadangan otomatis: ${enabled ? `Aktif tiap ${intervalHours} jam` : 'Nonaktif'}.`
    });
    await writeDb(db);
    return res.status(200).json({ ok: true, backupSchedule: db.backupSchedule });
  }

  if (pathJoined === 'backups/restore' && req.method === 'POST') {
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });
    const { backupId, uploadedSnapshot } = bodyCheck.value || {};

    let targetSnapData = null;
    if (backupId) {
      const found = (db.backups || []).find(b => b.id === backupId);
      if (!found || !found.snapshot) {
        return res.status(404).json({ ok: false, error: 'Snapshot cadangan tidak ditemukan.' });
      }
      targetSnapData = found.snapshot;
    } else if (uploadedSnapshot && typeof uploadedSnapshot === 'object') {
      if (!Array.isArray(uploadedSnapshot.tasks) && !Array.isArray(uploadedSnapshot.accessUsers)) {
        return res.status(400).json({ ok: false, error: 'File JSON cadangan tidak memiliki struktur SI-OPS yang valid.' });
      }
      targetSnapData = uploadedSnapshot;
    } else {
      return res.status(400).json({ ok: false, error: 'Pilih snapshot cadangan atau unggah file JSON cadangan.' });
    }

    // Create a safety snapshot BEFORE restoring
    createBackupSnapshot(db, {
      type: 'PRE_RESTORE',
      label: 'Cadangan Keamanan Pra-Pemulihan',
      actor: 'ADMIN_UTAMA'
    });

    const preservedBackups = db.backups;
    const preservedAdminHash = db.adminCredentialHash;
    const preservedPepper = db.serverSecurityPepper;

    Object.assign(db, targetSnapData, {
      backups: preservedBackups,
      adminCredentialHash: preservedAdminHash,
      serverSecurityPepper: preservedPepper
    });
    delete db.adminPassword;

    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'RESTORE_BACKUP',
      targetDatabase: 'all',
      targetId: backupId || 'uploaded-json',
      status: 'SUCCESS',
      detail: 'Pemulihan database penuh berhasil dijalankan.'
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      message: 'Pemulihan Database Admin dari cadangan berhasil!'
    });
  }

  // Migration & Rollback
  if (pathJoined === 'migrate' && req.method === 'POST') {
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });
    const result = runDataMigration(db, {
      ...bodyCheck.value,
      actor: 'ADMIN_UTAMA'
    });
    if (!result.ok) {
      return res.status(result.status || 400).json({ ok: false, error: result.error });
    }
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      report: result.report,
      databaseMetrics: computeDatabaseMetrics(db),
      message: `Migrasi selesai: ${result.report.migratedCount} berhasil, ${result.report.skippedCount} duplikat dilewati, ${result.report.failedCount} gagal.`
    });
  }

  if (pathJoined === 'migrate/rollback' && req.method === 'POST') {
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });
    const migrationId = String(bodyCheck.value?.migrationId || '').trim();
    if (!migrationId) return res.status(400).json({ ok: false, error: 'ID migrasi wajib diisi.' });
    const result = rollbackMigration(db, { migrationId, actor: 'ADMIN_UTAMA' });
    if (!result.ok) return res.status(result.status || 400).json({ ok: false, error: result.error });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      migrationId: result.migrationId,
      message: 'Rollback migrasi berhasil! Data telah dikembalikan ke kondisi sebelum migrasi.'
    });
  }

  // Staff Submissions Review (Approve/Apply or Reject)
  if (segments[0] === 'submissions' && segments[1] && segments[2] === 'approve' && req.method === 'POST') {
    const subId = segments[1];
    const subIdx = (db.staffSubmissions || []).findIndex(s => s.id === subId);
    if (subIdx === -1) return res.status(404).json({ ok: false, error: 'Ajuan operator tidak ditemukan.' });
    const sub = db.staffSubmissions[subIdx];
    if (sub.status !== 'PENDING_ADMIN_REVIEW') {
      return res.status(409).json({ ok: false, error: 'Ajuan ini sudah diproses sebelumnya.' });
    }

    if (VALID_COLLECTIONS.includes(sub.targetCollection)) {
      const validation = validateRecordForCollection(sub.targetCollection, sub.payload);
      if (!validation.valid) return res.status(400).json({ ok: false, error: validation.error });
      const capCheck = checkWriteCapacity(db, sub.targetCollection, getByteSize(validation.record));
      if (!capCheck.allowed) return res.status(capCheck.status).json({ ok: false, error: capCheck.error });

      const arr = Array.isArray(db[sub.targetCollection]) ? db[sub.targetCollection] : [];
      const existIdx = arr.findIndex(x => x && x.id === validation.record.id);
      if (existIdx !== -1) arr[existIdx] = validation.record;
      else arr.unshift(validation.record);
      db[sub.targetCollection] = arr;
    } else if (sub.targetCollection === 'schoolConfigLetterhead' && sub.payload?.isolationKey) {
      db.schoolConfig = db.schoolConfig || {};
      db.schoolConfig.userLetterheads = {
        ...(db.schoolConfig.userLetterheads || {}),
        [sub.payload.isolationKey]: sub.payload.data
      };
    } else if (sub.targetCollection === 'schoolConfigSignature' && sub.payload?.isolationKey) {
      db.schoolConfig = db.schoolConfig || {};
      db.schoolConfig.userSignatures = {
        ...(db.schoolConfig.userSignatures || {}),
        [sub.payload.isolationKey]: sub.payload.data
      };
    } else if (sub.targetCollection === 'tupoksiDefinitions' && sub.payload) {
      db.tupoksiDefinitions = sub.payload;
    }

    db.staffSubmissions[subIdx] = {
      ...sub,
      status: 'APPROVED_APPLIED',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'ADMIN_UTAMA'
    };
    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'APPROVE_STAFF_SUBMISSION',
      targetDatabase: sub.targetCollection,
      targetId: sub.id,
      status: 'SUCCESS',
      detail: `Menyetujui ajuan @${sub.submittedBy} (${sub.operationType}) ke ${sub.targetCollection}.`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      submission: db.staffSubmissions[subIdx],
      message: `Ajuan dari @${sub.submittedBy} disetujui dan masuk ke Database Admin.`
    });
  }

  if (segments[0] === 'submissions' && segments[1] && segments[2] === 'reject' && req.method === 'POST') {
    const subId = segments[1];
    const subIdx = (db.staffSubmissions || []).findIndex(s => s.id === subId);
    if (subIdx === -1) return res.status(404).json({ ok: false, error: 'Ajuan operator tidak ditemukan.' });
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    const reason = bodyCheck.valid ? String(bodyCheck.value?.reason || 'Ditolak Admin').slice(0, 300) : 'Ditolak Admin';
    db.staffSubmissions[subIdx] = {
      ...db.staffSubmissions[subIdx],
      status: 'REJECTED',
      rejectReason: reason,
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'ADMIN_UTAMA'
    };
    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'REJECT_STAFF_SUBMISSION',
      targetDatabase: db.staffSubmissions[subIdx].targetCollection,
      targetId: subId,
      status: 'SUCCESS',
      detail: `Menolak ajuan @${db.staffSubmissions[subIdx].submittedBy}: ${reason}`
    });
    await writeDb(db);
    return res.status(200).json({ ok: true, submission: db.staffSubmissions[subIdx] });
  }

  // Admin User Management Actions
  if (pathJoined === 'users/rules' && req.method === 'PUT') {
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });
    const nextRules = {
      requireAdminApproval:
        bodyCheck.value?.requireAdminApproval !== undefined
          ? Boolean(bodyCheck.value.requireAdminApproval)
          : db.accessRules?.requireAdminApproval ?? true,
      enforceUniquePassword:
        bodyCheck.value?.enforceUniquePassword !== undefined
          ? Boolean(bodyCheck.value.enforceUniquePassword)
          : db.accessRules?.enforceUniquePassword ?? true,
      enforceSingleServicePerUser:
        bodyCheck.value?.enforceSingleServicePerUser !== undefined
          ? Boolean(bodyCheck.value.enforceSingleServicePerUser)
          : db.accessRules?.enforceSingleServicePerUser ?? true
    };
    db.accessRules = nextRules;
    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'UPDATE_SECURITY_RULES',
      targetDatabase: 'accessRules',
      status: 'SUCCESS',
      detail: `Aturan keamanan diperbarui: approval=${nextRules.requireAdminApproval}, uniquePass=${nextRules.enforceUniquePassword}, singleService=${nextRules.enforceSingleServicePerUser}.`
    });
    await writeDb(db);
    return res.status(200).json({ ok: true, accessRules: nextRules });
  }

  if (pathJoined === 'users' && req.method === 'POST') {
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });
    const { namaLengkap, username, role, password, status = 'APPROVED' } = bodyCheck.value || {};
    const cleanName = String(namaLengkap || '').trim();
    const cleanUsername = String(username || '').trim();
    const cleanPass = String(password || '').trim();
    if (!cleanName || !cleanUsername || cleanPass.length < 4 || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ ok: false, error: 'Lengkapi nama, username, layanan valid, dan sandi minimal 4 karakter.' });
    }
    const rules = { ...DEFAULT_ACCESS_RULES, ...(db.accessRules || {}) };
    const existingUsers = db.accessUsers || [];
    if (rules.enforceSingleServicePerUser && existingUsers.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      return res.status(409).json({ ok: false, error: `Username "@${cleanUsername}" sudah terdaftar.` });
    }
    const fp = computePasswordFingerprint(cleanPass, db.serverSecurityPepper);
    if (
      rules.enforceUniquePassword &&
      existingUsers.some(
        u => u.username.toLowerCase() !== cleanUsername.toLowerCase() && u.passwordFingerprint === fp
      )
    ) {
      return res.status(409).json({ ok: false, error: 'Sandi sudah digunakan oleh pengguna lain.' });
    }

    const now = new Date().toISOString();
    const created = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      namaLengkap: cleanName,
      username: cleanUsername,
      role,
      passwordHash: hashSecret(cleanPass),
      passwordFingerprint: fp,
      status: ['APPROVED', 'PENDING', 'REJECTED'].includes(status) ? status : 'APPROVED',
      createdAt: now,
      approvedAt: status === 'APPROVED' ? now : undefined,
      passwordChangeHistory: [{ changedAt: now, source: 'ADMIN_CREATE', maskedPreview: '••••••' }]
    };
    db.accessUsers = [created, ...existingUsers];
    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'ADMIN_CREATE_USER',
      targetDatabase: 'accessUsers',
      targetId: created.id,
      status: 'SUCCESS',
      detail: `Menambahkan akun @${cleanUsername} (${ROLE_LABELS_MAP[role]}).`
    });
    await writeDb(db);
    return res.status(201).json({
      ok: true,
      user: sanitizeAccessUserForClient(created, { isAdmin: true }),
      message: `Pengguna "@${cleanUsername}" berhasil ditambahkan.`
    });
  }

  if (segments[0] === 'users' && segments[1] && segments[2] && req.method === 'POST') {
    const userId = segments[1];
    const subAction = segments[2];
    const target = (db.accessUsers || []).find(u => u.id === userId);
    if (!target) return res.status(404).json({ ok: false, error: 'Data pengguna tidak ditemukan.' });

    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });
    const body = bodyCheck.value || {};
    const rules = { ...DEFAULT_ACCESS_RULES, ...(db.accessRules || {}) };
    const now = new Date().toISOString();

    if (subAction === 'approve') {
      const assignedPass = body.password !== undefined ? String(body.password).trim() : '';
      let updatedUser = { ...target, status: 'APPROVED', approvedAt: now };
      if (assignedPass) {
        if (assignedPass.length < 4) return res.status(400).json({ ok: false, error: 'Sandi minimal 4 karakter.' });
        const fp = computePasswordFingerprint(assignedPass, db.serverSecurityPepper);
        if (
          rules.enforceUniquePassword &&
          (db.accessUsers || []).some(
            u => u.id !== target.id && u.username.toLowerCase() !== target.username.toLowerCase() && u.passwordFingerprint === fp
          )
        ) {
          return res.status(409).json({ ok: false, error: 'Sandi konflik dengan pengguna lain.' });
        }
        updatedUser.passwordHash = hashSecret(assignedPass);
        updatedUser.passwordFingerprint = fp;
        delete updatedUser.password;
      }
      db.accessUsers = db.accessUsers.map(u => (u.id === userId ? updatedUser : u));
      appendAuditLog(db, {
        actor: 'ADMIN_UTAMA',
        actorRole: 'ADMIN',
        action: 'APPROVE_USER',
        targetDatabase: 'accessUsers',
        targetId: userId,
        status: 'SUCCESS',
        detail: `Menyetujui akun @${target.username} (${ROLE_LABELS_MAP[target.role]}).`
      });
      await writeDb(db);
      return res.status(200).json({
        ok: true,
        user: sanitizeAccessUserForClient(updatedUser, { isAdmin: true }),
        message: `Akun "@${target.username}" resmi disetujui.`
      });
    }

    if (subAction === 'reject') {
      const updatedUser = { ...target, status: 'REJECTED', rejectedAt: now };
      db.accessUsers = db.accessUsers.map(u => (u.id === userId ? updatedUser : u));
      appendAuditLog(db, {
        actor: 'ADMIN_UTAMA',
        actorRole: 'ADMIN',
        action: 'REJECT_USER',
        targetDatabase: 'accessUsers',
        targetId: userId,
        status: 'SUCCESS',
        detail: `Menolak akun @${target.username}.`
      });
      await writeDb(db);
      return res.status(200).json({
        ok: true,
        user: sanitizeAccessUserForClient(updatedUser, { isAdmin: true }),
        message: `Akun "@${target.username}" ditandai DITOLAK.`
      });
    }

    if (subAction === 'reset-password' || subAction === 'set-password') {
      const newPass = String(body.password || '').trim();
      if (newPass.length < 4) return res.status(400).json({ ok: false, error: 'Sandi minimal 4 karakter.' });
      const fp = computePasswordFingerprint(newPass, db.serverSecurityPepper);
      if (
        rules.enforceUniquePassword &&
        (db.accessUsers || []).some(
          u => u.id !== target.id && u.username.toLowerCase() !== target.username.toLowerCase() && u.passwordFingerprint === fp
        )
      ) {
        return res.status(409).json({ ok: false, error: 'Sandi konflik dengan pengguna lain.' });
      }
      const isReset = subAction === 'reset-password';
      const updatedUser = {
        ...target,
        passwordHash: hashSecret(newPass),
        passwordFingerprint: fp,
        mustChangePassword: isReset,
        resetRequestStatus: isReset ? 'RESET_ISSUED' : target.resetRequestStatus,
        resetIssuedAt: isReset ? now : target.resetIssuedAt,
        ...(isReset ? { tempResetCode: newPass } : {}),
        passwordUpdatedAt: now,
        passwordChangeHistory: [
          { changedAt: now, source: isReset ? 'RESET_BY_ADMIN' : 'USER_CHANGE', maskedPreview: '••••••' },
          ...(Array.isArray(target.passwordChangeHistory) ? target.passwordChangeHistory : [])
        ].slice(0, 20)
      };
      delete updatedUser.password;

      db.accessUsers = db.accessUsers.map(u => (u.id === userId ? updatedUser : u));
      appendAuditLog(db, {
        actor: 'ADMIN_UTAMA',
        actorRole: 'ADMIN',
        action: isReset ? 'ISSUE_RESET_PASSWORD' : 'ADMIN_SET_PASSWORD',
        targetDatabase: 'accessUsers',
        targetId: userId,
        status: 'SUCCESS',
        detail: `${isReset ? 'Menerbitkan sandi reset sementara' : 'Mengubah sandi'} untuk @${target.username}.`
      });
      await writeDb(db);
      return res.status(200).json({
        ok: true,
        user: sanitizeAccessUserForClient(updatedUser, { isAdmin: true }),
        message: isReset
          ? `Sandi reset sementara "${newPass}" dikirim ke notifikasi akun "@${target.username}".`
          : `Sandi akun "@${target.username}" berhasil diperbarui.`
      });
    }
  }

  return res.status(404).json({ error: `Endpoint Admin tidak ditemukan: /api/admin/${pathJoined}` });
}

// =====================================================================
// 5. PROTECTED /api/crud/:collection HANDLER (ADMIN-ONLY WRITE/DELETE)
// =====================================================================

export async function handleProtectedCrud(collection, id, req, res) {
  const db = await readDb();
  const customDb = (db.databaseRegistry || []).find(d => d.code === collection && !d.isBuiltin);
  if (!VALID_COLLECTIONS.includes(collection) && !customDb) {
    return res.status(400).json({ error: `Koleksi tidak valid: ${collection}` });
  }

  if (req.method === 'GET') {
    const authCtx = await requireStaffOrAdminOrReject(req, res, db, `crud/${collection}`);
    if (!authCtx) return;
    const items = customDb
      ? Array.isArray(db.customDatabaseRecords?.[collection])
        ? db.customDatabaseRecords[collection]
        : []
      : Array.isArray(db[collection])
      ? db[collection]
      : [];

    const safeItems =
      collection === 'accessUsers'
        ? items.map(u => sanitizeAccessUserForClient(u, { isAdmin: authCtx.isAdmin }))
        : items;

    if (!id) {
      return res.status(200).json({ success: true, collection, count: safeItems.length, data: safeItems });
    }
    const found = safeItems.find(item => item && item.id === id);
    if (!found) {
      return res.status(404).json({ error: `Item id ${id} tidak ditemukan pada ${collection}` });
    }
    return res.status(200).json({ success: true, data: found });
  }

  // Strictly enforce Admin authorization on POST, PUT, DELETE
  const adminCtx = await requireAdminOrReject(req, res, db, `crud/${collection}`);
  if (!adminCtx) return;

  if (req.method === 'POST') {
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ error: bodyCheck.error });

    const validation = validateRecordForCollection(collection, bodyCheck.value, customDb || null);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const capCheck = checkWriteCapacity(db, collection, getByteSize(validation.record));
    if (!capCheck.allowed) {
      return res.status(capCheck.status).json({ error: capCheck.error });
    }

    if (customDb) {
      if (!Array.isArray(db.customDatabaseRecords[collection])) db.customDatabaseRecords[collection] = [];
      db.customDatabaseRecords[collection].unshift(validation.record);
    } else {
      if (!Array.isArray(db[collection])) db[collection] = [];
      db[collection].unshift(validation.record);
    }

    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'CRUD_CREATE',
      targetDatabase: collection,
      targetId: validation.record.id,
      status: 'SUCCESS',
      detail: `Tambah data pada koleksi ${collection}.`
    });
    const ok = await writeDb(db);
    return ok
      ? res.status(201).json({ success: true, created: validation.record, lastUpdated: db.lastUpdated })
      : res.status(500).json({ error: 'Gagal menambahkan data ke Database Admin.' });
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'ID item wajib disertakan untuk pembaruan.' });
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ error: bodyCheck.error });

    const items = customDb
      ? [...(db.customDatabaseRecords?.[collection] || [])]
      : [...(db[collection] || [])];
    const index = items.findIndex(item => item && item.id === id);
    const candidate = index === -1 ? { ...bodyCheck.value, id } : { ...items[index], ...bodyCheck.value, id };

    const validation = validateRecordForCollection(collection, candidate, customDb || null);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    if (index === -1) items.unshift(validation.record);
    else items[index] = validation.record;

    if (customDb) db.customDatabaseRecords[collection] = items;
    else db[collection] = items;

    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: 'CRUD_UPDATE',
      targetDatabase: collection,
      targetId: id,
      status: 'SUCCESS',
      detail: `Ubah data ID ${id} pada koleksi ${collection}.`
    });
    const ok = await writeDb(db);
    return ok
      ? res.status(200).json({ success: true, updated: validation.record, lastUpdated: db.lastUpdated })
      : res.status(500).json({ error: 'Gagal memperbarui data di Database Admin.' });
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'ID item wajib disertakan untuk penghapusan.' });
    const softRes = softDeleteRecord(db, {
      collection,
      id,
      actor: 'ADMIN_UTAMA',
      reason: 'Soft-delete melalui endpoint CRUD Admin'
    });
    if (!softRes.ok) {
      return res.status(softRes.status || 404).json({ error: softRes.error });
    }
    const ok = await writeDb(db);
    return ok
      ? res.status(200).json({
          success: true,
          deletedId: id,
          softDeleted: true,
          trashId: softRes.trashEntry.trashId,
          lastUpdated: db.lastUpdated
        })
      : res.status(500).json({ error: 'Gagal menghapus sementara data di Database Admin.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export async function handleProtectedBackupDownload(req, res) {
  const db = await readDb();
  const adminCtx = await requireAdminOrReject(req, res, db, 'backup');
  if (!adminCtx) return;

  const { serverSecurityPepper: _p, adminCredentialHash: _h, ...safeExport } = db;
  appendAuditLog(db, {
    actor: 'ADMIN_UTAMA',
    actorRole: 'ADMIN',
    action: 'EXPORT_BACKUP_FILE',
    targetDatabase: 'all',
    status: 'SUCCESS',
    detail: 'Admin mengunduh file backup JSON lengkap.'
  });
  await writeDb(db);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="backup-database-admin-siops.json"');
  return res.status(200).send(JSON.stringify(safeExport, null, 2));
}

export async function handleProtectedDeleteAccessUser(id, req, res) {
  const db = await readDb();
  const adminCtx = await requireAdminOrReject(req, res, db, 'access-users');
  if (!adminCtx) return;

  if (!id) return res.status(400).json({ error: 'ID pengguna wajib disertakan.' });
  const result = await deleteAccessUserFromDb(id, 'ADMIN_UTAMA');
  if (result.ok) {
    return res.status(200).json({
      success: true,
      deletedId: id,
      softDeleted: true,
      lastUpdated: result.lastUpdated
    });
  }
  return res.status(result.status || 500).json({ error: result.error || 'Gagal menghapus pengguna.' });
}
