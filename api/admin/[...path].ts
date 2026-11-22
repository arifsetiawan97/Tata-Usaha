import { applyCorsHeaders } from '../../src/server/cloudDb.mjs';
import { handleAdminRoute } from '../../src/server/adminApiHandlers.mjs';

function extractSegments(req: any): string[] {
  const q = req?.query?.__path ?? req?.query?.['...path'] ?? req?.query?.path;
  if (Array.isArray(q) && q.length > 0) {
    return q.flatMap(item => String(item || '').split('/')).filter(Boolean);
  }
  if (typeof q === 'string' && q.trim()) {
    return q.replace(/^\/?(?:api\/admin\/?)?/, '').split('/').filter(Boolean);
  }
  if (typeof req.url === 'string') {
    const cleaned = req.url.split('?')[0].replace(/^\/api\/admin\/?/, '');
    return cleaned.split('/').filter(Boolean).map((s: string) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
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
