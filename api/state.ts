import {
  applyCorsHeaders,
  applyStateUpdate,
  buildAdminStateResponse,
  getStorageInfo,
  readDb
} from '../src/server/cloudDb.mjs';
import { handleGetState, parseJsonBody, requireAdminOrReject } from '../src/server/adminApiHandlers.mjs';
import { sanitizeAndInspectPayload } from '../src/server/dbValidator.mjs';

export default async function handler(req: any, res: any) {
  applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      return await handleGetState(req, res);
    } catch (err) {
      console.error('GET /api/state error:', err);
      return res.status(500).json({ error: 'Gagal membaca basis data cloud' });
    }
  }

  if (req.method === 'POST') {
    try {
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
    } catch (err) {
      console.error('POST /api/state error:', err);
      return res.status(500).json({ error: 'Gagal menyimpan basis data ke server' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
