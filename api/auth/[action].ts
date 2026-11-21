import { applyCorsHeaders } from '../../src/server/cloudDb.mjs';
import { handleAuthAction } from '../../src/server/adminApiHandlers.mjs';

export default async function handler(req: any, res: any) {
  applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const rawAction = Array.isArray(req.query?.action) ? req.query.action[0] : req.query?.action;
  const fallbackAction =
    typeof req.url === 'string' ? decodeURIComponent(req.url.split('?')[0].replace(/^\/api\/auth\/?/, '').split('/')[0] || '') : '';
  const action = (rawAction || fallbackAction || '').trim();

  try {
    return await handleAuthAction(action, req, res);
  } catch (err) {
    console.error(`AUTH /api/auth/${action} error:`, err);
    return res.status(500).json({ ok: false, message: 'Terjadi kesalahan pada server autentikasi.' });
  }
}
