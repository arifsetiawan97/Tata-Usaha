import { applyCorsHeaders } from '../src/server/cloudDb.mjs';
import { handleProtectedBackupDownload } from '../src/server/adminApiHandlers.mjs';

export default async function handler(req: any, res: any) {
  applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return await handleProtectedBackupDownload(req, res);
  } catch (err) {
    console.error('GET /api/backup error:', err);
    return res.status(500).json({ error: 'Gagal membuat file backup' });
  }
}
