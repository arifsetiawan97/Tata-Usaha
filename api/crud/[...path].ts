import { applyCorsHeaders } from '../../src/server/cloudDb.mjs';
import { handleProtectedCrud } from '../../src/server/adminApiHandlers.mjs';

function extractSegments(req: any): string[] {
  if (Array.isArray(req.query?.path)) return req.query.path;
  if (typeof req.query?.path === 'string' && req.query.path) return req.query.path.split('/').filter(Boolean);
  if (typeof req.url === 'string') {
    const cleaned = req.url.split('?')[0].replace(/^\/api\/crud\/?/, '');
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
  const collection = segments[0] || '';
  const id = segments[1] || '';

  try {
    return await handleProtectedCrud(collection, id, req, res);
  } catch (err) {
    console.error('CRUD route error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan pada operasi database.' });
  }
}
