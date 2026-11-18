import { applyCorsHeaders, deleteAccessUserFromDb } from '../../src/server/cloudDb.mjs';

export default async function handler(req: any, res: any) {
  applyCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const queryId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  const fallbackId = typeof req.url === 'string' ? decodeURIComponent(req.url.split('?')[0].split('/').pop() || '') : '';
  const id = (queryId || fallbackId || '').trim();

  if (!id) {
    return res.status(400).json({ error: 'ID pengguna wajib disertakan.' });
  }

  try {
    const result = await deleteAccessUserFromDb(id);
    if (result.ok) {
      return res.status(200).json({
        success: true,
        deletedId: id,
        lastUpdated: result.lastUpdated
      });
    }
    return res.status(500).json({ error: 'Gagal menghapus akun pengguna dari basis data server.' });
  } catch (err) {
    console.error('DELETE /api/access-users/:id error:', err);
    return res.status(500).json({ error: 'Gagal menghapus akun pengguna dari basis data server.' });
  }
}
