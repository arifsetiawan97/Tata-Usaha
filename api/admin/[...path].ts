import { applyCorsHeaders } from '../../src/server/cloudDb.mjs';
import { handleAdminRoute } from '../../src/server/adminApiHandlers.mjs';

function extractSegments(req: any): string[] {
  if (Array.isArray(req.query?.path)) return req.query.path;
  if (typeof req.query?.path === 'string' && req.query.path) return req.query.path.split('/').filter(Boolean);
  if (typeof req.url === 'string') {
    const cleaned = req.url.split('?')[0].replace(/^\/api\/admin\/?/, '');
    return cleaned.split('/').filter(Boolean).map(decodeURIComponent);
  }
  return [];
}

export default async function handler(req: any, res: any) {
  applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const segments = extractSegments(req);
  try {
    return await handleAdminRoute(segments, req, res);
  } catch (err) {
    console.error('ADMIN route error:', err);
    return res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada server Database Admin.' });
  }
}
