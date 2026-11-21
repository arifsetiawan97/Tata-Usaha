import { applyCorsHeaders } from '../../src/server/cloudDb.mjs';
import { handleProtectedDeleteAccessUser } from '../../src/server/adminApiHandlers.mjs';

export default async function handler(req: any, res: any) {
  applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const queryId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  const fallbackId =
    typeof req.url === 'string' ? decodeURIComponent(req.url.split('?')[0].split('/').pop() || '') : '';
  const id = (queryId || fallbackId || '').trim();

  try {
    return await handleProtectedDeleteAccessUser(id, req, res);
  } catch (err) {
    console.error('DELETE /api/access-users/:id error:', err);
    return res.status(500).json({ error: 'Gagal menghapus akun pengguna dari basis data server.' });
  }
}
