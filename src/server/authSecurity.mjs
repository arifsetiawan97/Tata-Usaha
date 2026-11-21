import crypto from 'crypto';

const EPHEMERAL_FALLBACK_KEY = '__siopsEphemeralSessionSecret';
const TOKEN_TTL_SECONDS = 12 * 60 * 60; // 12 hours (refreshed automatically for 24h uptime)

export function getSessionSecret(persistentPepper = '') {
  const fromEnv = (process.env.SESSION_SECRET || '').trim();
  if (fromEnv && fromEnv.length >= 16) {
    return fromEnv;
  }
  const cleanPepper = typeof persistentPepper === 'string' ? persistentPepper.trim() : '';
  if (cleanPepper && cleanPepper.length >= 16) {
    return crypto.createHash('sha256').update(`siops-session-v1:${cleanPepper}`).digest('hex');
  }
  if (!globalThis[EPHEMERAL_FALLBACK_KEY]) {
    globalThis[EPHEMERAL_FALLBACK_KEY] = crypto.randomBytes(32).toString('hex');
  }
  return globalThis[EPHEMERAL_FALLBACK_KEY];
}

export function getAdminPasscodeEnv() {
  return (process.env.ADMIN_PASSCODE || '').trim();
}

export function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function hashSecret(plain) {
  if (typeof plain !== 'string' || !plain) {
    throw new Error('Secret tidak boleh kosong.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifySecret(plain, storedHash) {
  if (typeof plain !== 'string' || typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(plain, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function computePasswordFingerprint(plain, pepper) {
  const key = (pepper || getSessionSecret()).toString();
  return crypto.createHmac('sha256', key).update(String(plain)).digest('hex');
}

function toBase64Url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(str) {
  const padded = String(str).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(str).length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function signSessionToken(payload, ttlSeconds = TOKEN_TTL_SECONDS, persistentPepper = '') {
  const nowSec = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: nowSec,
    exp: nowSec + ttlSeconds,
    jti: crypto.randomBytes(10).toString('hex')
  };
  const encodedPayload = toBase64Url(JSON.stringify(fullPayload));
  const secret = getSessionSecret(persistentPepper);
  const sig = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest();
  return {
    token: `${encodedPayload}.${toBase64Url(sig)}`,
    expiresAt: new Date(fullPayload.exp * 1000).toISOString(),
    payload: fullPayload
  };
}

export function verifySessionToken(token, persistentPepper = '') {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSig] = parts;
  if (!encodedPayload || !encodedSig) return null;

  try {
    const secret = getSessionSecret(persistentPepper);
    const expectedSig = toBase64Url(
      crypto.createHmac('sha256', secret).update(encodedPayload).digest()
    );
    if (!timingSafeEqualStr(encodedSig, expectedSig)) {
      return null;
    }
    const parsed = JSON.parse(fromBase64Url(encodedPayload));
    if (!parsed || typeof parsed !== 'object') return null;
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof parsed.exp !== 'number' || parsed.exp <= nowSec) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function extractBearerToken(req) {
  const auth = req?.headers?.authorization || req?.headers?.Authorization;
  if (!auth || typeof auth !== 'string') return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function isAllowedCorsOrigin(origin, req) {
  if (!origin || typeof origin !== 'string') return false;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

    const reqHost = String(req?.headers?.['x-forwarded-host'] || req?.headers?.host || '').toLowerCase();
    if (reqHost && parsed.host.toLowerCase() === reqHost) {
      return true;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (hostname.endsWith('.run.app') || hostname.endsWith('.vercel.app')) return true;

    const extraAllowed = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    if (extraAllowed.includes(origin.toLowerCase()) || extraAllowed.includes(hostname)) {
      return true;
    }

    const appUrl = (process.env.APP_URL || '').trim();
    if (appUrl) {
      try {
        if (new URL(appUrl).origin.toLowerCase() === parsed.origin.toLowerCase()) {
          return true;
        }
      } catch {
        // Ignore invalid APP_URL
      }
    }
  } catch {
    return false;
  }
  return false;
}

export function applySecurityHeaders(req, res) {
  if (!res || typeof res.setHeader !== 'function') return;
  const origin = req?.headers?.origin;
  if (origin && isAllowedCorsOrigin(origin, req)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Confirm-Purge');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

// In-memory rate limiter for Admin & Staff login attempts
const loginAttemptsMap = new Map();

export function checkLoginRateLimit(key, maxAttempts = 10, windowMs = 5 * 60 * 1000) {
  const now = Date.now();
  const safeKey = String(key || 'global').slice(0, 120);
  const record = loginAttemptsMap.get(safeKey);
  if (!record || now - record.firstAttemptAt > windowMs) {
    loginAttemptsMap.set(safeKey, { count: 1, firstAttemptAt: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  if (record.count >= maxAttempts) {
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - record.firstAttemptAt)) / 1000));
    return { allowed: false, retryAfterSec };
  }
  record.count += 1;
  return { allowed: true, remaining: maxAttempts - record.count };
}

export function resetLoginRateLimit(key) {
  loginAttemptsMap.delete(String(key || 'global').slice(0, 120));
}

export function sanitizeAccessUserForClient(user, options = {}) {
  if (!user || typeof user !== 'object') return null;
  const { isAdmin = false, includeTempResetCode = false } = options;
  const cleanHistory = Array.isArray(user.passwordChangeHistory)
    ? user.passwordChangeHistory.map(entry => ({
        changedAt: entry.changedAt,
        source: entry.source,
        maskedPreview: '••••••'
      }))
    : [];

  return {
    id: user.id,
    namaLengkap: user.namaLengkap,
    username: user.username,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    approvedAt: user.approvedAt,
    rejectedAt: user.rejectedAt,
    lastLoginAt: user.lastLoginAt,
    resetRequestStatus: user.resetRequestStatus,
    resetRequestedAt: user.resetRequestedAt,
    resetRequestNote: user.resetRequestNote,
    resetIssuedAt: user.resetIssuedAt,
    mustChangePassword: Boolean(user.mustChangePassword),
    passwordUpdatedAt: user.passwordUpdatedAt,
    hasPassword: Boolean(user.passwordHash || user.password),
    ...(isAdmin || includeTempResetCode
      ? { tempResetCode: user.resetRequestStatus === 'RESET_ISSUED' ? user.tempResetCode : undefined }
      : {}),
    passwordChangeHistory: cleanHistory
  };
}
