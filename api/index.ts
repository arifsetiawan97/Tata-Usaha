import {
  applyCorsHeaders,
  applyStateUpdate,
  buildAdminStateResponse,
  getStorageInfo,
  readDb
} from '../src/server/cloudDb.mjs';
import {
  handleAdminRoute,
  handleAuthAction,
  handleGetState,
  handleProtectedBackupDownload,
  handleProtectedCrud,
  handleProtectedDeleteAccessUser,
  handleStaffSelfSave,
  handleStaffSubmission,
  parseJsonBody,
  requireAdminOrReject
} from '../src/server/adminApiHandlers.mjs';
import { sanitizeAndInspectPayload } from '../src/server/dbValidator.mjs';
import {
  handleAnalyzeAnnual,
  handleAnalyzeInventory,
  handleAnalyzeMonthly,
  handleAssistant,
  handleAuditDocument,
  handleDraftTask,
  handleGenerateTaskDescription,
  handleSuggestCategories
} from '../src/server/geminiHandlers.mjs';

function safeDecode(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

export function extractApiSegments(req: any): string[] {
  const qPath = req?.query?.__path ?? req?.query?.['...path'] ?? req?.query?.path;
  if (Array.isArray(qPath) && qPath.length > 0) {
    return qPath
      .flatMap(item => String(item || '').split('/'))
      .filter(Boolean)
      .map(safeDecode);
  }
  if (typeof qPath === 'string' && qPath.trim()) {
    return qPath
      .replace(/^\/?(?:api\/)?/, '')
      .split('/')
      .filter(Boolean)
      .map(safeDecode);
  }
  if (typeof req?.url === 'string') {
    const rawPath = req.url.split('?')[0].replace(/^\/?(?:api\/)?/, '');
    const parts = rawPath.split('/').filter(Boolean).map(safeDecode);
    if (parts.length === 1 && parts[0] === 'index') return [];
    return parts;
  }
  return [];
}

export default async function handler(req: any, res: any) {
  applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const segments = extractApiSegments(req);
  const head = segments[0] || '';

  try {
    if (head === '' || head === 'health') {
      const info = getStorageInfo();
      return res.status(200).json({
        status: 'ok',
        ...info,
        timestamp: new Date().toISOString()
      });
    }

    if (head === 'state') {
      if (req.method === 'GET') {
        return await handleGetState(req, res);
      }
      if (req.method === 'POST') {
        const db = await readDb();
        const adminCtx = await requireAdminOrReject(req, res, db, 'state');
        if (!adminCtx) return;

        const safeCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
        if (!safeCheck.valid) {
          return res.status(400).json({ error: safeCheck.error });
        }

        const storageInfo = getStorageInfo();
        const result = await applyStateUpdate(safeCheck.value, 'ADMIN_UTAMA');
        if (result.ok) {
          return res.status(200).json({
            success: true,
            lastUpdated: result.updated.lastUpdated,
            data: buildAdminStateResponse(result.updated),
            ...storageInfo
          });
        }
        return res.status(500).json({ error: 'Gagal menyimpan basis data ke server' });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (head === 'auth') {
      const action = segments[1] || '';
      return await handleAuthAction(action, req, res);
    }

    if (head === 'staff') {
      const sub = segments[1] || '';
      if (sub === 'submissions') {
        return await handleStaffSubmission(req, res);
      }
      if (sub === 'self-save') {
        return await handleStaffSelfSave(req, res);
      }
      return res.status(404).json({ error: `Endpoint staff tidak ditemukan: /api/staff/${sub}` });
    }

    if (head === 'admin') {
      return await handleAdminRoute(segments.slice(1), req, res);
    }

    if (head === 'crud') {
      return await handleProtectedCrud(segments[1] || '', segments[2] || '', req, res);
    }

    if (head === 'backup') {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return await handleProtectedBackupDownload(req, res);
    }

    if (head === 'access-users') {
      if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return await handleProtectedDeleteAccessUser(segments[1] || '', req, res);
    }

    if (head === 'gemini') {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      const action = segments[1] || '';
      const body = parseJsonBody(req.body);
      if (action === 'analyze-monthly') return res.status(200).json(await handleAnalyzeMonthly(body));
      if (action === 'analyze-annual') return res.status(200).json(await handleAnalyzeAnnual(body));
      if (action === 'draft-task') return res.status(200).json(await handleDraftTask(body));
      if (action === 'suggest-categories') return res.status(200).json(await handleSuggestCategories(body));
      if (action === 'analyze-inventory') return res.status(200).json(await handleAnalyzeInventory(body));
      if (action === 'generate-task-description') {
        const result = await handleGenerateTaskDescription(body);
        return res.status(result.status).json(result.payload);
      }
      if (action === 'audit-document') return res.status(200).json(await handleAuditDocument(body));
      if (action === 'assistant') return res.status(200).json(await handleAssistant(body));
      return res.status(404).json({ error: `Endpoint AI tidak ditemukan: ${action}` });
    }

    return res.status(404).json({ error: `Endpoint API tidak ditemukan: /api/${segments.join('/')}` });
  } catch (err) {
    console.error(`API dispatcher /api/${segments.join('/')} error:`, err);
    return res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada server Database Admin.' });
  }
}
