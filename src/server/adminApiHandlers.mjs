import crypto from 'crypto';
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
  normalizeUserSchoolIdentity,
  purgeSoftDeletedRecord,
  readDb,
  resolveApprovedSchoolHeader,
  restoreSoftDeletedRecord,
  rollbackMigration,
  runDataMigration,
  sanitizeAdminProfile,
  softDeleteRecord,
  validateBackgroundConfigInput,
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
  const session = verifySessionToken(token, db?.serverSecurityPepper);
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
      adminSetupRequired: false,
      data: buildAdminStateResponse(db),
      ...info
    });
  }

  if (ctx.isStaff) {
    return res.status(200).json({
      initialized: true,
      accessLevel: 'STAFF',
      adminSetupRequired: false,
      data: buildStaffStateResponse(db, ctx.session),
      ...info
    });
  }

  return res.status(200).json({
    initialized: true,
    accessLevel: 'PUBLIC',
    adminSetupRequired: false,
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
    const activeAdminUsername = String(db.adminAccount?.username || 'admin').trim().toLowerCase();
    if (['admin', 'administrator', 'superadmin', 'root', activeAdminUsername].includes(usernameKey)) {
      return res.status(400).json({
        ok: false,
        message: 'Nama pengguna tersebut khusus untuk Administrator sistem.'
      });
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
    const schoolIdentity = normalizeUserSchoolIdentity(
      body.schoolIdentity ||
        (body.namaSekolah
          ? {
              namaSekolah: body.namaSekolah,
              pemerintahDaerah: body.pemerintahDaerah,
              dinasPendidikan: body.dinasPendidikan,
              kabupatenKota: body.kabupatenKota,
              npsn: body.npsn
            }
          : null)
    );
    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      namaLengkap,
      username,
      role,
      ...(schoolIdentity ? { schoolIdentity } : {}),
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

    // Check if logging in with Admin username/email from the unified portal (when no specific operator card was forced)
    const adminAcc = db.adminAccount;
    if (adminAcc && !expectedRole) {
      const idLower = cleanUsername.toLowerCase();
      const matchesAdminId =
        idLower === String(adminAcc.username || 'admin').toLowerCase() ||
        (adminAcc.email && idLower === String(adminAcc.email).toLowerCase());
      if (matchesAdminId) {
        if (adminAcc.status !== 'ACTIVE') {
          return res.status(403).json({ ok: false, message: 'Akun Admin sedang nonaktif.' });
        }
        const envPass = getAdminPasscodeEnv();
        const adminPassOk = envPass
          ? timingSafeEqualStr(cleanPassword, envPass)
          : verifySecret(cleanPassword, adminAcc.passwordHash || db.adminCredentialHash);
        if (!adminPassOk) {
          appendAuditLog(db, {
            actor: cleanUsername,
            actorRole: 'ADMIN',
            action: 'ADMIN_LOGIN_FAILED',
            targetDatabase: 'system',
            status: 'DENIED',
            detail: `Sandi tidak sesuai saat login Admin @${adminAcc.username}.`
          });
          await writeDb(db);
          return res.status(401).json({ ok: false, message: 'Username atau sandi Admin tidak sesuai.' });
        }
        resetLoginRateLimit(`staff:${getClientIpKey(req)}`);
        maybeRunScheduledBackup(db);
        appendAuditLog(db, {
          actor: adminAcc.username,
          actorRole: 'ADMIN',
          action: 'ADMIN_LOGIN_SUCCESS',
          targetDatabase: 'system',
          status: 'SUCCESS',
          detail: `Admin @${adminAcc.username} masuk melalui portal akun.`
        });
        await writeDb(db);
        const issuedAdmin = signSessionToken(
          {
            sub: adminAcc.id || 'admin-root',
            username: adminAcc.username || 'admin',
            namaLengkap: adminAcc.namaLengkap || 'Administrator Utama',
            role: 'ADMIN',
            sessionType: 'admin'
          },
          undefined,
          db.serverSecurityPepper
        );
        return res.status(200).json({
          ok: true,
          isAdmin: true,
          token: issuedAdmin.token,
          expiresAt: issuedAdmin.expiresAt,
          adminProfile: sanitizeAdminProfile(adminAcc),
          message: `Selamat datang kembali, ${adminAcc.namaLengkap || 'Administrator'}!`
        });
      }
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

    const issued = signSessionToken(
      {
        sub: updatedUser.id,
        username: updatedUser.username,
        namaLengkap: updatedUser.namaLengkap,
        role: updatedUser.role,
        sessionType: 'staff'
      },
      undefined,
      db.serverSecurityPepper
    );

    return res.status(200).json({
      ok: true,
      token: issued.token,
      expiresAt: issued.expiresAt,
      requiresPasswordChange: Boolean(updatedUser.mustChangePassword),
      user: sanitizeAccessUserForClient(updatedUser, { includeTempResetCode: true }),
      approvedSchoolHeader: resolveApprovedSchoolHeader(db, updatedUser),
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
    const issued = signSessionToken(
      {
        sub: ctx.userRecord.id,
        username: ctx.userRecord.username,
        namaLengkap: ctx.userRecord.namaLengkap,
        role: ctx.userRecord.role,
        sessionType: 'staff'
      },
      undefined,
      db.serverSecurityPepper
    );
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
      user: sanitizeAccessUserForClient(found, { includeTempResetCode: true }),
      approvedSchoolHeader: found.status === 'APPROVED' ? resolveApprovedSchoolHeader(db, found) : null
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
// 3B. AUTHENTICATED USER SELF-SAVE (PERMANENT + MULTI-USER ISOLATED)
// =====================================================================

const ALLOWED_KOP_FIELDS = [
  'pemerintahDaerah',
  'dinasPendidikan',
  'namaSekolah',
  'npsn',
  'nss',
  'alamat',
  'desaKecamatan',
  'kabupatenKota',
  'provinsi',
  'kodePos',
  'telepon',
  'email',
  'website',
  'logoKabupatenUrl',
  'logoSekolahUrl',
  'logoKopKiri',
  'logoKopKanan',
  'logoAplikasiUrl',
  'kopBorderStyle'
];

const ALLOWED_KOP_BORDERS = ['double_thick', 'double', 'solid_thick', 'solid_thin', 'dashed'];

function cleanOfficerForStorage(rawOfficer, defaultJabatan = '') {
  if (!rawOfficer || typeof rawOfficer !== 'object') return undefined;
  return {
    nama: String(rawOfficer.nama ?? '').trim().slice(0, 200),
    nip: String(rawOfficer.nip ?? '').trim().slice(0, 100),
    ...(rawOfficer.pangkatGolongan !== undefined
      ? { pangkatGolongan: String(rawOfficer.pangkatGolongan || '').trim().slice(0, 120) }
      : {}),
    jabatan: String(rawOfficer.jabatan ?? defaultJabatan).trim().slice(0, 200) || defaultJabatan,
    signatureType: ['draw', 'bsre_qr', 'script', 'upload'].includes(rawOfficer.signatureType)
      ? rawOfficer.signatureType
      : 'script',
    ...(rawOfficer.signatureData !== undefined ? { signatureData: String(rawOfficer.signatureData || '') } : {}),
    ...(rawOfficer.signatureImage !== undefined ? { signatureImage: String(rawOfficer.signatureImage || '') } : {})
  };
}

function buildUserForkId(baseId, userShortHash) {
  const cleanBase = String(baseId || 'rec')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 48);
  return `${cleanBase}__u_${userShortHash}`.slice(0, 64);
}

function upsertUserIsolatedRecord(db, collection, rawRecord, { isolationKey, actorName, userShortHash, isAdminRoot, now }) {
  const validation = validateRecordForCollection(collection, rawRecord);
  if (!validation.valid) {
    return { ok: false, status: 400, error: validation.error };
  }

  if (!Array.isArray(db[collection])) db[collection] = [];
  const list = db[collection];
  const candidate = { ...validation.record };

  const belongsToCaller = (item) => {
    if (!item || typeof item !== 'object') return false;
    if (item.ownerUserId) return item.ownerUserId === isolationKey;
    if (item.ownerUsername) return String(item.ownerUsername).trim().toLowerCase() === String(actorName).toLowerCase();
    return false;
  };

  let targetIdx = list.findIndex(item => item && item.id === candidate.id);

  // For monthlyReports / annualReports also match same caller's period slot to avoid duplicates
  if (targetIdx === -1 && (collection === 'monthlyReports' || collection === 'annualReports')) {
    targetIdx = list.findIndex(item => {
      if (!item || !belongsToCaller(item)) return false;
      if (collection === 'monthlyReports') {
        return item.role === candidate.role && item.month === candidate.month && item.year === candidate.year;
      }
      return item.role === candidate.role && item.year === candidate.year;
    });
    if (targetIdx !== -1) {
      candidate.id = list[targetIdx].id;
    }
  }

  let savedRecord;
  let replacedId = null;

  if (targetIdx !== -1) {
    const existing = list[targetIdx];
    const hasOwner = Boolean(existing.ownerUserId || existing.ownerUsername);
    const sameOwner = belongsToCaller(existing);

    if (sameOwner || (isAdminRoot && !hasOwner)) {
      savedRecord = {
        ...existing,
        ...candidate,
        id: existing.id,
        ...(isAdminRoot && !hasOwner ? {} : { ownerUserId: isolationKey, ownerUsername: actorName }),
        updatedAt: now
      };
      list[targetIdx] = savedRecord;
    } else if (!hasOwner) {
      // Base / shared record: create a per-user fork so other users & defaults are untouched
      const forkId = buildUserForkId(existing.id, userShortHash);
      const forkIdx = list.findIndex(item => item && item.id === forkId);
      savedRecord = {
        ...candidate,
        id: forkId,
        forkedFromId: existing.id,
        ownerUserId: isolationKey,
        ownerUsername: actorName,
        updatedAt: now
      };
      if (forkIdx === -1) {
        const cap = checkWriteCapacity(db, collection, getByteSize(savedRecord));
        if (!cap.allowed) return { ok: false, status: cap.status, error: cap.error };
        list.unshift(savedRecord);
      } else {
        list[forkIdx] = savedRecord;
      }
      replacedId = existing.id;
    } else {
      // Owned by a DIFFERENT user — NEVER overwrite! Clone cleanly for caller
      const clonedId = `${candidate.id.slice(0, 36)}-${Date.now().toString(36)}-${userShortHash}`.slice(0, 64);
      savedRecord = {
        ...candidate,
        id: clonedId,
        ownerUserId: isolationKey,
        ownerUsername: actorName,
        updatedAt: now
      };
      const cap = checkWriteCapacity(db, collection, getByteSize(savedRecord));
      if (!cap.allowed) return { ok: false, status: cap.status, error: cap.error };
      list.unshift(savedRecord);
      replacedId = candidate.id;
    }
  } else {
    // Brand new record
    const cap = checkWriteCapacity(db, collection, getByteSize(candidate));
    if (!cap.allowed) return { ok: false, status: cap.status, error: cap.error };
    savedRecord = {
      ...candidate,
      ...(isAdminRoot ? {} : { ownerUserId: isolationKey, ownerUsername: actorName }),
      updatedAt: now
    };
    list.unshift(savedRecord);
  }

  return { ok: true, savedRecord, replacedId };
}

function deleteUserIsolatedRecord(db, collection, rawId, { isolationKey, actorName, actorRole, isAdminRoot }) {
  const cleanId = String(rawId || '').trim();
  if (!cleanId) {
    return { ok: false, status: 400, error: 'ID data yang akan dihapus tidak valid.' };
  }

  if (!Array.isArray(db[collection])) db[collection] = [];
  const list = db[collection];

  const belongsToCaller = (item) => {
    if (!item || typeof item !== 'object') return false;
    if (item.ownerUserId) return item.ownerUserId === isolationKey;
    if (item.ownerUsername) return String(item.ownerUsername).trim().toLowerCase() === String(actorName).toLowerCase();
    return false;
  };

  const markHiddenForCaller = (targetId) => {
    if (!targetId) return;
    if (!db.userHiddenRecords || typeof db.userHiddenRecords !== 'object') {
      db.userHiddenRecords = {};
    }
    if (!db.userHiddenRecords[isolationKey] || typeof db.userHiddenRecords[isolationKey] !== 'object') {
      db.userHiddenRecords[isolationKey] = {};
    }
    const existingArr = Array.isArray(db.userHiddenRecords[isolationKey][collection])
      ? db.userHiddenRecords[isolationKey][collection]
      : [];
    const nextSet = new Set(existingArr);
    nextSet.add(targetId);
    db.userHiddenRecords[isolationKey][collection] = Array.from(nextSet).slice(-2000);
  };

  // Case 1: Direct ID match owned by caller OR Admin Root
  const directItem = list.find(item => item && item.id === cleanId);
  if (directItem && (belongsToCaller(directItem) || isAdminRoot)) {
    const delRes = softDeleteRecord(db, {
      collection,
      id: directItem.id,
      actor: actorName,
      actorRole,
      reason: isAdminRoot ? 'Dihapus Admin' : `Dihapus oleh pengguna @${actorName}`
    });
    if (!delRes.ok) return delRes;
    if (directItem.forkedFromId && !isAdminRoot) {
      markHiddenForCaller(directItem.forkedFromId);
    }
    return { ok: true, mode: 'soft-delete', deletedId: cleanId };
  }

  // Case 2: Caller owns forked copy(s) of this base ID
  const callerForks = list.filter(item => item && item.forkedFromId === cleanId && belongsToCaller(item));
  if (callerForks.length > 0) {
    for (const forkItem of callerForks) {
      softDeleteRecord(db, {
        collection,
        id: forkItem.id,
        actor: actorName,
        actorRole,
        reason: `Dihapus oleh pengguna @${actorName}`
      });
    }
    if (!isAdminRoot) {
      markHiddenForCaller(cleanId);
    }
    return { ok: true, mode: 'soft-delete', deletedId: cleanId };
  }

  // Case 3 & 4: Shared unowned base record (hide only for this caller), foreign record, or already deleted
  if (!isAdminRoot) {
    markHiddenForCaller(cleanId);
  }
  return {
    ok: true,
    mode: directItem ? 'hide-shared' : 'not-found-idempotent',
    deletedId: cleanId
  };
}

export async function handleStaffSelfSave(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  const db = await readDb();
  const ctx = await requireStaffOrAdminOrReject(req, res, db, 'staff/self-save');
  if (!ctx) return;

  const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
  if (!bodyCheck.valid) {
    return res.status(400).json({ ok: false, error: bodyCheck.error });
  }

  const body = bodyCheck.value || {};
  const actionType = String(body.actionType || '').trim();
  const now = new Date().toISOString();

  // Derive caller identity strictly from verified server token
  const isAdminRoot = Boolean(ctx.isAdmin && !ctx.userRecord);
  const actorName = ctx.userRecord?.username || ctx.session?.username || 'ADMIN_UTAMA';
  const actorRole = ctx.userRecord?.role || ctx.session?.role || 'ADMIN';
  const isolationKey =
    ctx.userRecord?.id ||
    (isAdminRoot ? 'admin-root' : `user:${String(actorName).trim().toLowerCase()}`);
  const userShortHash = crypto.createHash('sha1').update(isolationKey).digest('hex').slice(0, 8);

  if (actionType === 'SAVE_LETTERHEAD') {
    const incoming = body.payload && typeof body.payload === 'object' ? body.payload : {};
    const metrics = computeDatabaseMetrics(db);
    if (metrics.totalPercentUsed >= 100) {
      return res.status(507).json({
        ok: false,
        error: 'Kapasitas total Database Admin mencapai 100% (Penuh). Hubungi Admin untuk pembersihan/perluasan kapasitas.'
      });
    }

    db.schoolConfig = db.schoolConfig || {};
    db.schoolConfig.userLetterheads = db.schoolConfig.userLetterheads || {};
    const prevEntry = db.schoolConfig.userLetterheads[isolationKey];
    const cleanFields = {};
    for (const key of ALLOWED_KOP_FIELDS) {
      if (incoming[key] !== undefined) {
        if (key === 'kopBorderStyle') {
          cleanFields[key] = ALLOWED_KOP_BORDERS.includes(incoming[key]) ? incoming[key] : 'double_thick';
        } else {
          cleanFields[key] = typeof incoming[key] === 'string' ? incoming[key] : String(incoming[key] ?? '');
        }
      }
    }

    const nextEntry = {
      ...(prevEntry && !prevEntry.deleted ? prevEntry : {}),
      ...cleanFields,
      userId: isolationKey,
      username: actorName,
      deleted: false,
      updatedAt: now
    };
    db.schoolConfig.userLetterheads[isolationKey] = nextEntry;

    appendAuditLog(db, {
      actor: actorName,
      actorRole,
      action: 'SAVE_USER_LETTERHEAD',
      targetDatabase: 'schoolConfig.userLetterheads',
      targetId: isolationKey,
      status: 'SUCCESS',
      detail: `Menyimpan Kop Surat pribadi secara permanen & terisolasi untuk @${actorName}.`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      isolationKey,
      entry: nextEntry,
      lastUpdated: db.lastUpdated,
      message: `Kop surat akun @${actorName} tersimpan permanen tanpa memengaruhi pengguna lain.`
    });
  }

  if (actionType === 'RESET_LETTERHEAD') {
    db.schoolConfig = db.schoolConfig || {};
    db.schoolConfig.userLetterheads = db.schoolConfig.userLetterheads || {};
    const entry = {
      userId: isolationKey,
      username: actorName,
      deleted: true,
      updatedAt: now
    };
    db.schoolConfig.userLetterheads[isolationKey] = entry;
    appendAuditLog(db, {
      actor: actorName,
      actorRole,
      action: 'RESET_USER_LETTERHEAD',
      targetDatabase: 'schoolConfig.userLetterheads',
      targetId: isolationKey,
      status: 'SUCCESS',
      detail: `Mengembalikan Kop Surat pribadi @${actorName} ke Template Bawaan Sistem.`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      isolationKey,
      entry,
      lastUpdated: db.lastUpdated,
      message: 'Kop surat Anda dikembalikan ke Template Bawaan Sistem.'
    });
  }

  if (actionType === 'SAVE_SIGNATURE') {
    const incoming = body.payload && typeof body.payload === 'object' ? body.payload : {};
    const metrics = computeDatabaseMetrics(db);
    if (metrics.totalPercentUsed >= 100) {
      return res.status(507).json({
        ok: false,
        error: 'Kapasitas total Database Admin mencapai 100% (Penuh).'
      });
    }

    db.schoolConfig = db.schoolConfig || {};
    db.schoolConfig.userSignatures = db.schoolConfig.userSignatures || {};
    const prevEntry = db.schoolConfig.userSignatures[isolationKey];
    const sigRole = VALID_ROLES.includes(incoming.role) ? incoming.role : (VALID_ROLES.includes(actorRole) ? actorRole : 'TU');

    const cleanSig = {
      ...(prevEntry && !prevEntry.deleted ? prevEntry : {}),
      role: sigRole,
      ...(incoming.kepalaSekolah ? { kepalaSekolah: cleanOfficerForStorage(incoming.kepalaSekolah, 'Kepala Sekolah') } : {}),
      ...(incoming.wakilKepalaSekolah
        ? { wakilKepalaSekolah: cleanOfficerForStorage(incoming.wakilKepalaSekolah, 'Wakil Kepala Sekolah') }
        : {}),
      ...(incoming.operatorProfile
        ? { operatorProfile: cleanOfficerForStorage(incoming.operatorProfile, 'Petugas Layanan Operasional') }
        : {}),
      ...(incoming.stempelEnabled !== undefined ? { stempelEnabled: Boolean(incoming.stempelEnabled) } : {}),
      ...(incoming.stempelTextLine1 !== undefined
        ? { stempelTextLine1: String(incoming.stempelTextLine1 || '').slice(0, 120) }
        : {}),
      ...(incoming.stempelTextLine2 !== undefined
        ? { stempelTextLine2: String(incoming.stempelTextLine2 || '').slice(0, 120) }
        : {}),
      ...(incoming.customStempelUrl !== undefined ? { customStempelUrl: String(incoming.customStempelUrl || '') } : {}),
      userId: isolationKey,
      username: actorName,
      deleted: false,
      updatedAt: now
    };
    db.schoolConfig.userSignatures[isolationKey] = cleanSig;

    appendAuditLog(db, {
      actor: actorName,
      actorRole,
      action: 'SAVE_USER_SIGNATURE',
      targetDatabase: 'schoolConfig.userSignatures',
      targetId: isolationKey,
      status: 'SUCCESS',
      detail: `Menyimpan Lembar Pengesahan pribadi secara permanen & terisolasi untuk @${actorName}.`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      isolationKey,
      entry: cleanSig,
      lastUpdated: db.lastUpdated,
      message: `Lembar pengesahan akun @${actorName} tersimpan permanen tanpa memengaruhi pengguna lain.`
    });
  }

  if (actionType === 'RESET_SIGNATURE') {
    db.schoolConfig = db.schoolConfig || {};
    db.schoolConfig.userSignatures = db.schoolConfig.userSignatures || {};
    const sigRole = VALID_ROLES.includes(actorRole) ? actorRole : 'TU';
    const entry = {
      role: sigRole,
      userId: isolationKey,
      username: actorName,
      deleted: true,
      updatedAt: now
    };
    db.schoolConfig.userSignatures[isolationKey] = entry;
    appendAuditLog(db, {
      actor: actorName,
      actorRole,
      action: 'RESET_USER_SIGNATURE',
      targetDatabase: 'schoolConfig.userSignatures',
      targetId: isolationKey,
      status: 'SUCCESS',
      detail: `Mengembalikan Lembar Pengesahan pribadi @${actorName} ke Template Bawaan Sistem.`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      isolationKey,
      entry,
      lastUpdated: db.lastUpdated,
      message: 'Lembar pengesahan Anda dikembalikan ke Template Bawaan Sistem.'
    });
  }

  if (actionType === 'SAVE_TUPOKSI') {
    const incoming = body.payload && typeof body.payload === 'object' ? body.payload : {};
    const role = VALID_ROLES.includes(incoming.role) ? incoming.role : (VALID_ROLES.includes(actorRole) ? actorRole : 'TU');
    const tupoksiList = Array.isArray(incoming.tupoksiList)
      ? incoming.tupoksiList.map(x => String(x || '').trim()).filter(Boolean).slice(0, 100)
      : [];
    const tugasTambahanList = Array.isArray(incoming.tugasTambahanList)
      ? incoming.tugasTambahanList.map(x => String(x || '').trim()).filter(Boolean).slice(0, 100)
      : [];

    if (!db.userTupoksiDefinitions || typeof db.userTupoksiDefinitions !== 'object') {
      db.userTupoksiDefinitions = {};
    }
    const prevUserMap = db.userTupoksiDefinitions[isolationKey] || {};
    db.userTupoksiDefinitions[isolationKey] = {
      ...prevUserMap,
      [role]: { tupoksiList, tugasTambahanList },
      updatedAt: now
    };

    appendAuditLog(db, {
      actor: actorName,
      actorRole,
      action: 'SAVE_USER_TUPOKSI',
      targetDatabase: 'userTupoksiDefinitions',
      targetId: `${isolationKey}:${role}`,
      status: 'SUCCESS',
      detail: `Menyimpan daftar Tupoksi (${role}) terisolasi untuk @${actorName}.`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      isolationKey,
      role,
      entry: { tupoksiList, tugasTambahanList },
      lastUpdated: db.lastUpdated,
      message: 'Pembaruan daftar Tupoksi Anda tersimpan permanen tanpa memengaruhi pengguna lain.'
    });
  }

  if (actionType === 'SAVE_LIBRARY_MEMBER_STATS') {
    const incoming = body.payload && typeof body.payload === 'object' ? body.payload : {};
    const guruLaki = Math.max(0, Number(incoming.guruLaki) || 0);
    const guruPerempuan = Math.max(0, Number(incoming.guruPerempuan) || 0);
    const staffLaki = Math.max(0, Number(incoming.staffLaki) || 0);
    const staffPerempuan = Math.max(0, Number(incoming.staffPerempuan) || 0);
    const siswaLaki = Math.max(0, Number(incoming.siswaLaki) || 0);
    const siswaPerempuan = Math.max(0, Number(incoming.siswaPerempuan) || 0);

    const statsEntry = {
      siswaLaki,
      siswaPerempuan,
      guruLaki,
      guruPerempuan,
      guruPendidik: guruLaki + guruPerempuan > 0 ? guruLaki + guruPerempuan : Math.max(0, Number(incoming.guruPendidik) || 0),
      staffLaki,
      staffPerempuan,
      staffTendik: staffLaki + staffPerempuan > 0 ? staffLaki + staffPerempuan : Math.max(0, Number(incoming.staffTendik) || 0),
      isManualOverride: incoming.isManualOverride !== undefined ? Boolean(incoming.isManualOverride) : true,
      lastUpdated: now.slice(0, 10),
      userId: isolationKey,
      username: actorName,
      updatedAt: now
    };

    if (!db.userLibraryMemberStats || typeof db.userLibraryMemberStats !== 'object') {
      db.userLibraryMemberStats = {};
    }
    db.userLibraryMemberStats[isolationKey] = statsEntry;

    appendAuditLog(db, {
      actor: actorName,
      actorRole,
      action: 'SAVE_USER_MEMBER_STATS',
      targetDatabase: 'userLibraryMemberStats',
      targetId: isolationKey,
      status: 'SUCCESS',
      detail: `Menyimpan rekapitulasi jumlah anggota perpustakaan untuk @${actorName}.`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      isolationKey,
      stats: statsEntry,
      lastUpdated: db.lastUpdated,
      message: 'Rekap jumlah anggota perpustakaan tersimpan permanen untuk akun Anda.'
    });
  }

  if (actionType === 'SAVE_RECORD') {
    const collection = String(body.collection || '').trim();
    if (!VALID_COLLECTIONS.includes(collection)) {
      return res.status(400).json({ ok: false, error: `Koleksi "${collection}" tidak valid.` });
    }
    const result = upsertUserIsolatedRecord(db, collection, body.payload, {
      isolationKey,
      actorName,
      userShortHash,
      isAdminRoot,
      now
    });
    if (!result.ok) {
      return res.status(result.status || 400).json({ ok: false, error: result.error });
    }

    appendAuditLog(db, {
      actor: actorName,
      actorRole,
      action: result.replacedId ? 'USER_FORK_OR_SAVE_RECORD' : 'USER_SAVE_RECORD',
      targetDatabase: collection,
      targetId: result.savedRecord.id,
      status: 'SUCCESS',
      detail: `Menyimpan permanen data pada ${collection} untuk @${actorName} (terisolasi).`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      collection,
      savedRecord: result.savedRecord,
      replacedId: result.replacedId,
      databaseMetrics: computeDatabaseMetrics(db),
      lastUpdated: db.lastUpdated,
      message: 'Perubahan tersimpan permanen secara otomatis dan terisolasi untuk akun Anda.'
    });
  }

  if (actionType === 'SAVE_RECORDS_BATCH') {
    const collection = String(body.collection || '').trim();
    const records = Array.isArray(body.records) ? body.records.slice(0, 500) : [];
    if (!VALID_COLLECTIONS.includes(collection) || records.length === 0) {
      return res.status(400).json({ ok: false, error: 'Koleksi atau daftar data impor tidak valid.' });
    }
    const savedRecords = [];
    for (const rec of records) {
      const result = upsertUserIsolatedRecord(db, collection, rec, {
        isolationKey,
        actorName,
        userShortHash,
        isAdminRoot,
        now
      });
      if (!result.ok) {
        return res.status(result.status || 400).json({ ok: false, error: result.error });
      }
      savedRecords.push(result.savedRecord);
    }

    appendAuditLog(db, {
      actor: actorName,
      actorRole,
      action: 'USER_BATCH_SAVE_RECORDS',
      targetDatabase: collection,
      targetId: `${savedRecords.length} items`,
      status: 'SUCCESS',
      detail: `Menyimpan permanen ${savedRecords.length} data ke ${collection} untuk @${actorName}.`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      collection,
      savedRecords,
      databaseMetrics: computeDatabaseMetrics(db),
      lastUpdated: db.lastUpdated,
      message: `${savedRecords.length} data berhasil disimpan permanen ke akun Anda.`
    });
  }

  if (actionType === 'SAVE_SERVICE_BACKGROUND') {
    const metrics = computeDatabaseMetrics(db);
    if (metrics.totalPercentUsed >= 100) {
      return res.status(507).json({
        ok: false,
        error: 'Kapasitas total Database Admin mencapai 100% (Penuh). Hubungi Admin untuk perluasan kapasitas.'
      });
    }

    const incoming = body.payload && typeof body.payload === 'object' ? body.payload : {};
    const requestedRole = String(incoming.role || body.role || '').trim();
    const targetRole =
      ctx.userRecord?.role && VALID_ROLES.includes(ctx.userRecord.role)
        ? ctx.userRecord.role
        : VALID_ROLES.includes(requestedRole)
        ? requestedRole
        : 'TU';

    const bgCheck = validateBackgroundConfigInput(incoming, {
      actorName,
      defaultOpacity: 0.72
    });
    if (!bgCheck.valid || !bgCheck.config) {
      return res.status(400).json({
        ok: false,
        error: bgCheck.error || 'Konfigurasi background layanan tidak valid.'
      });
    }

    const storageKey = `${isolationKey}:${targetRole}`;
    if (!db.userServiceBackgrounds || typeof db.userServiceBackgrounds !== 'object') {
      db.userServiceBackgrounds = {};
    }

    const savedEntry = {
      ...bgCheck.config,
      role: targetRole,
      userId: isolationKey,
      username: actorName,
      deleted: false,
      updatedAt: now
    };
    db.userServiceBackgrounds[storageKey] = savedEntry;

    appendAuditLog(db, {
      actor: actorName,
      actorRole,
      action: 'SAVE_USER_SERVICE_BACKGROUND',
      targetDatabase: 'userServiceBackgrounds',
      targetId: storageKey,
      status: 'SUCCESS',
      detail: `Menyimpan background menu layanan ${targetRole} secara permanen untuk @${actorName}.`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      isolationKey,
      storageKey,
      role: targetRole,
      entry: savedEntry,
      lastUpdated: db.lastUpdated,
      message: `Background layanan ${ROLE_LABELS_MAP[targetRole] || targetRole} tersimpan permanen untuk akun Anda.`
    });
  }

  if (actionType === 'RESET_SERVICE_BACKGROUND') {
    const requestedRole = String(body.payload?.role || body.role || '').trim();
    const targetRole =
      ctx.userRecord?.role && VALID_ROLES.includes(ctx.userRecord.role)
        ? ctx.userRecord.role
        : VALID_ROLES.includes(requestedRole)
        ? requestedRole
        : 'TU';
    const storageKey = `${isolationKey}:${targetRole}`;

    if (!db.userServiceBackgrounds || typeof db.userServiceBackgrounds !== 'object') {
      db.userServiceBackgrounds = {};
    }
    const deletedEntry = {
      mode: 'default',
      presetId: 'default',
      role: targetRole,
      userId: isolationKey,
      username: actorName,
      deleted: true,
      updatedAt: now
    };
    db.userServiceBackgrounds[storageKey] = deletedEntry;

    appendAuditLog(db, {
      actor: actorName,
      actorRole,
      action: 'RESET_USER_SERVICE_BACKGROUND',
      targetDatabase: 'userServiceBackgrounds',
      targetId: storageKey,
      status: 'SUCCESS',
      detail: `Mengembalikan background menu layanan ${targetRole} milik @${actorName} ke tampilan standar.`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      isolationKey,
      storageKey,
      role: targetRole,
      entry: deletedEntry,
      lastUpdated: db.lastUpdated,
      message: `Background layanan ${ROLE_LABELS_MAP[targetRole] || targetRole} dikembalikan ke tampilan standar.`
    });
  }

  if (actionType === 'DELETE_RECORD') {
    const collection = String(body.collection || '').trim();
    if (!VALID_COLLECTIONS.includes(collection)) {
      return res.status(400).json({ ok: false, error: `Koleksi "${collection}" tidak valid.` });
    }
    const targetId = body.id !== undefined ? body.id : body.payload?.id;
    const result = deleteUserIsolatedRecord(db, collection, targetId, {
      isolationKey,
      actorName,
      actorRole,
      isAdminRoot
    });
    if (!result.ok) {
      return res.status(result.status || 400).json({ ok: false, error: result.error });
    }
    if (result.mode !== 'soft-delete') {
      appendAuditLog(db, {
        actor: actorName,
        actorRole,
        action: 'USER_HIDE_OR_DELETE_RECORD',
        targetDatabase: collection,
        targetId: result.deletedId,
        status: 'SUCCESS',
        detail: `Menghapus/menyembunyikan data (${result.mode}) pada ${collection} untuk @${actorName}.`
      });
    }
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      collection,
      deletedIds: [result.deletedId],
      mode: result.mode,
      databaseMetrics: computeDatabaseMetrics(db),
      lastUpdated: db.lastUpdated,
      message: 'Data berhasil dihapus secara permanen.'
    });
  }

  if (actionType === 'DELETE_RECORDS_BATCH') {
    const collection = String(body.collection || '').trim();
    if (!VALID_COLLECTIONS.includes(collection)) {
      return res.status(400).json({ ok: false, error: `Koleksi "${collection}" tidak valid.` });
    }
    const rawIds = Array.isArray(body.ids)
      ? body.ids
      : Array.isArray(body.payload?.ids)
      ? body.payload.ids
      : [];
    const uniqueIds = Array.from(
      new Set(rawIds.map(x => String(x || '').trim()).filter(Boolean))
    ).slice(0, 1000);

    if (uniqueIds.length === 0) {
      return res.status(400).json({ ok: false, error: 'Daftar ID data yang akan dihapus kosong.' });
    }

    for (const targetId of uniqueIds) {
      const result = deleteUserIsolatedRecord(db, collection, targetId, {
        isolationKey,
        actorName,
        actorRole,
        isAdminRoot
      });
      if (!result.ok) {
        return res.status(result.status || 400).json({ ok: false, error: result.error });
      }
    }

    appendAuditLog(db, {
      actor: actorName,
      actorRole,
      action: 'USER_BATCH_DELETE_RECORDS',
      targetDatabase: collection,
      targetId: `${uniqueIds.length} items`,
      status: 'SUCCESS',
      detail: `Menghapus permanen ${uniqueIds.length} data terpilih dari ${collection} untuk @${actorName}.`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      collection,
      deletedIds: uniqueIds,
      databaseMetrics: computeDatabaseMetrics(db),
      lastUpdated: db.lastUpdated,
      message: `${uniqueIds.length} data terpilih berhasil dihapus secara permanen.`
    });
  }

  return res.status(400).json({ ok: false, error: `Jenis aksi penyimpanan "${actionType}" tidak dikenali.` });
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
      isClaimed: Boolean(db.adminAccount?.passwordHash || db.adminCredentialHash),
      setupRequired: false,
      isDefaultCredentials: Boolean(db.adminAccount?.isDefaultCredentials && !envPass)
    });
  }

  if (pathJoined === 'auth/claim' && req.method === 'POST') {
    return res.status(409).json({
      ok: false,
      error: 'Akun Admin default sudah tersedia otomatis. Silakan masuk menggunakan username & sandi Admin.'
    });
  }

  if (pathJoined === 'auth/login' && req.method === 'POST') {
    const ipKey = `admin:${getClientIpKey(req)}`;
    const rate = checkLoginRateLimit(ipKey, 12, 5 * 60 * 1000);
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
    const rawUsername = String(bodyCheck.value?.username || '').trim();
    const password = String(bodyCheck.value?.password || '').trim();
    if (!password) {
      return res.status(400).json({ ok: false, error: 'Masukkan username dan sandi Admin.' });
    }

    const adminAcc = db.adminAccount;
    if (adminAcc && adminAcc.status !== 'ACTIVE') {
      return res.status(403).json({ ok: false, error: 'Akun Admin sedang berstatus nonaktif.' });
    }

    if (rawUsername && adminAcc) {
      const idLower = rawUsername.toLowerCase();
      const validIds = [
        String(adminAcc.username || 'admin').toLowerCase(),
        ...(adminAcc.email ? [String(adminAcc.email).toLowerCase()] : [])
      ];
      if (!validIds.includes(idLower)) {
        appendAuditLog(db, {
          actor: rawUsername,
          actorRole: 'PUBLIC',
          action: 'ADMIN_LOGIN_FAILED',
          targetDatabase: 'system',
          status: 'DENIED',
          detail: `Username Admin tidak cocok saat login (@${rawUsername}).`
        });
        await writeDb(db);
        return res.status(401).json({ ok: false, error: 'Username atau sandi Admin tidak sesuai!' });
      }
    }

    const envPass = getAdminPasscodeEnv();
    let verified = false;
    if (envPass) {
      verified = timingSafeEqualStr(password, envPass);
    } else if (adminAcc?.passwordHash) {
      verified = verifySecret(password, adminAcc.passwordHash);
    } else if (db.adminCredentialHash) {
      verified = verifySecret(password, db.adminCredentialHash);
    }

    if (!verified) {
      appendAuditLog(db, {
        actor: rawUsername || getClientIpKey(req),
        actorRole: 'PUBLIC',
        action: 'ADMIN_LOGIN_FAILED',
        targetDatabase: 'system',
        status: 'DENIED',
        detail: 'Sandi Admin salah saat mencoba membuka Panel Database Admin.'
      });
      await writeDb(db);
      return res.status(401).json({ ok: false, error: 'Username atau sandi Admin tidak sesuai!' });
    }

    resetLoginRateLimit(ipKey);
    maybeRunScheduledBackup(db);
    const activeAdminUsername = adminAcc?.username || 'admin';
    const activeAdminName = adminAcc?.namaLengkap || 'Administrator Utama';
    appendAuditLog(db, {
      actor: activeAdminUsername,
      actorRole: 'ADMIN',
      action: 'ADMIN_LOGIN_SUCCESS',
      targetDatabase: 'system',
      status: 'SUCCESS',
      detail: `Admin @${activeAdminUsername} berhasil terautentikasi membuka Database Satu Pintu.`
    });
    await writeDb(db);

    const issued = signSessionToken(
      {
        sub: adminAcc?.id || 'admin-root',
        username: activeAdminUsername,
        namaLengkap: activeAdminName,
        role: 'ADMIN',
        sessionType: 'admin'
      },
      undefined,
      db.serverSecurityPepper
    );

    return res.status(200).json({
      ok: true,
      token: issued.token,
      expiresAt: issued.expiresAt,
      adminProfile: sanitizeAdminProfile(adminAcc),
      message: `Autentikasi Admin (@${activeAdminUsername}) berhasil.`
    });
  }

  // All routes below strictly require verified Admin Bearer Token!
  const adminCtx = await requireAdminOrReject(req, res, db, `admin/${pathJoined}`);
  if (!adminCtx) return;

  if (pathJoined === 'auth/refresh' && req.method === 'POST') {
    const adminAcc = db.adminAccount;
    const issued = signSessionToken(
      {
        sub: adminAcc?.id || 'admin-root',
        username: adminAcc?.username || 'admin',
        namaLengkap: adminAcc?.namaLengkap || 'Administrator Utama',
        role: 'ADMIN',
        sessionType: 'admin'
      },
      undefined,
      db.serverSecurityPepper
    );
    return res.status(200).json({ ok: true, token: issued.token, expiresAt: issued.expiresAt });
  }

  if (pathJoined === 'auth/profile' && req.method === 'PUT') {
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });

    const payload = bodyCheck.value || {};
    const adminAcc = db.adminAccount;
    const currentPassword = String(payload.currentPassword || '').trim();
    const newUsername = String(payload.newUsername ?? adminAcc?.username ?? 'admin').trim();
    const newEmail = String(payload.newEmail ?? adminAcc?.email ?? '').trim();
    const newNamaLengkap = String(payload.newNamaLengkap ?? adminAcc?.namaLengkap ?? 'Administrator Utama').trim();
    const newPassword = String(payload.newPassword || '').trim();

    if (!newUsername || newUsername.length < 3 || newUsername.length > 50) {
      return res.status(400).json({ ok: false, error: 'Username Admin wajib 3 sampai 50 karakter.' });
    }
    if (!/^[a-zA-Z0-9._@-]+$/.test(newUsername)) {
      return res.status(400).json({
        ok: false,
        error: 'Username Admin hanya boleh berisi huruf, angka, titik (.), garis bawah (_), hubung (-), atau @.'
      });
    }
    if (!newNamaLengkap) {
      return res.status(400).json({ ok: false, error: 'Nama lengkap Admin tidak boleh kosong.' });
    }
    if (
      (db.accessUsers || []).some(
        u => u && u.username.toLowerCase() === newUsername.toLowerCase() && u.status !== 'REJECTED'
      )
    ) {
      return res.status(409).json({
        ok: false,
        error: `Username "@${newUsername}" sudah digunakan oleh akun operator layanan.`
      });
    }

    const envPass = getAdminPasscodeEnv();
    const usernameChanged = newUsername.toLowerCase() !== String(adminAcc?.username || 'admin').toLowerCase();
    const passwordChanged = Boolean(newPassword);

    if (passwordChanged && envPass) {
      return res.status(409).json({
        ok: false,
        error: 'Sandi Admin saat ini dikelola melalui environment variable ADMIN_PASSCODE di server.'
      });
    }
    if (passwordChanged && (newPassword.length < 6 || newPassword.length > 100)) {
      return res.status(400).json({ ok: false, error: 'Sandi Admin baru minimal 6 karakter.' });
    }

    if (usernameChanged || passwordChanged) {
      if (!currentPassword) {
        return res.status(400).json({
          ok: false,
          error: 'Masukkan sandi Admin saat ini untuk mengonfirmasi perubahan username/sandi.'
        });
      }
      const currentValid = envPass
        ? timingSafeEqualStr(currentPassword, envPass)
        : verifySecret(currentPassword, adminAcc?.passwordHash || db.adminCredentialHash);
      if (!currentValid) {
        return res.status(401).json({ ok: false, error: 'Sandi Admin saat ini tidak sesuai.' });
      }
    }

    const now = new Date().toISOString();
    const updatedHash = passwordChanged
      ? hashSecret(newPassword)
      : adminAcc?.passwordHash || db.adminCredentialHash;

    db.adminAccount = {
      ...(adminAcc || { id: 'admin-root', role: 'ADMIN', status: 'ACTIVE', createdAt: now }),
      username: newUsername,
      email: newEmail,
      namaLengkap: newNamaLengkap,
      role: 'ADMIN',
      status: 'ACTIVE',
      passwordHash: updatedHash,
      isDefaultCredentials:
        usernameChanged || passwordChanged ? false : Boolean(adminAcc?.isDefaultCredentials),
      updatedAt: now
    };
    db.adminCredentialHash = updatedHash;

    appendAuditLog(db, {
      actor: newUsername,
      actorRole: 'ADMIN',
      action: 'ADMIN_UPDATE_PROFILE',
      targetDatabase: 'system',
      status: 'SUCCESS',
      detail: `Profil/kredensial Admin diperbarui (@${newUsername}${passwordChanged ? ', sandi diubah' : ''}).`
    });
    await writeDb(db);

    const issued = signSessionToken(
      {
        sub: db.adminAccount.id,
        username: db.adminAccount.username,
        namaLengkap: db.adminAccount.namaLengkap,
        role: 'ADMIN',
        sessionType: 'admin'
      },
      undefined,
      db.serverSecurityPepper
    );

    return res.status(200).json({
      ok: true,
      token: issued.token,
      expiresAt: issued.expiresAt,
      adminProfile: sanitizeAdminProfile(db.adminAccount),
      message: 'Profil dan kredensial Admin berhasil diperbarui dan disimpan permanen!'
    });
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
    const nextHash = hashSecret(newPassword);
    db.adminCredentialHash = nextHash;
    if (db.adminAccount) {
      db.adminAccount = {
        ...db.adminAccount,
        passwordHash: nextHash,
        isDefaultCredentials: false,
        updatedAt: new Date().toISOString()
      };
    }
    appendAuditLog(db, {
      actor: db.adminAccount?.username || 'ADMIN_UTAMA',
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

  // Site Settings (Welcome Headline & Main Menu Background Customization)
  if (pathJoined === 'site-settings' && req.method === 'PUT') {
    const bodyCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!bodyCheck.valid) return res.status(400).json({ ok: false, error: bodyCheck.error });

    const hasHeadline = bodyCheck.value?.welcomeHeadline !== undefined;
    const headline = hasHeadline
      ? String(bodyCheck.value?.welcomeHeadline || '').trim().slice(0, 200)
      : db.siteSettings?.welcomeHeadline || DEFAULT_WELCOME_HEADLINE;
    const subheadline =
      bodyCheck.value?.welcomeSubheadline !== undefined
        ? String(bodyCheck.value.welcomeSubheadline || '').trim().slice(0, 400)
        : db.siteSettings?.welcomeSubheadline || DEFAULT_WELCOME_SUBHEADLINE;

    if (!headline) {
      return res.status(400).json({ ok: false, error: 'Kalimat pembuka tidak boleh kosong.' });
    }

    let nextMainBackground = db.siteSettings?.mainBackground ?? null;
    const hasMainBackground = Object.prototype.hasOwnProperty.call(bodyCheck.value || {}, 'mainBackground');
    if (hasMainBackground) {
      const bgCheck = validateBackgroundConfigInput(bodyCheck.value.mainBackground, {
        actorName: 'ADMIN_UTAMA',
        defaultOpacity: 0.55
      });
      if (!bgCheck.valid) {
        return res.status(400).json({ ok: false, error: bgCheck.error });
      }
      nextMainBackground = bgCheck.config;
    }

    db.siteSettings = {
      welcomeHeadline: headline,
      welcomeSubheadline: subheadline,
      mainBackground: nextMainBackground,
      updatedAt: new Date().toISOString(),
      updatedBy: 'ADMIN_UTAMA'
    };
    appendAuditLog(db, {
      actor: 'ADMIN_UTAMA',
      actorRole: 'ADMIN',
      action: hasMainBackground && !hasHeadline ? 'UPDATE_MAIN_BACKGROUND' : 'UPDATE_WELCOME_TEXT',
      targetDatabase: 'siteSettings',
      status: 'SUCCESS',
      detail: hasMainBackground
        ? `Pengaturan tampilan & background halaman pembuka diperbarui (mode: ${nextMainBackground?.mode || 'default'}).`
        : `Kalimat pembuka diperbarui menjadi "${headline}".`
    });
    await writeDb(db);
    return res.status(200).json({
      ok: true,
      siteSettings: db.siteSettings,
      message: hasMainBackground && !hasHeadline
        ? 'Background menu utama berhasil diperbarui untuk semua pengunjung.'
        : 'Pengaturan halaman pembuka berhasil diperbarui.'
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
    const preservedAdminAccount = db.adminAccount;
    const preservedAdminHash = db.adminCredentialHash;
    const preservedPepper = db.serverSecurityPepper;

    Object.assign(db, targetSnapData, {
      backups: preservedBackups,
      adminAccount: preservedAdminAccount,
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
    const schoolIdentity = normalizeUserSchoolIdentity(bodyCheck.value?.schoolIdentity);
    const created = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      namaLengkap: cleanName,
      username: cleanUsername,
      role,
      ...(schoolIdentity ? { schoolIdentity } : {}),
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

  const { serverSecurityPepper: _p, adminCredentialHash: _h, adminAccount: _acc, ...safeExport } = db;
  safeExport.adminAccount = sanitizeAdminProfile(_acc);
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
