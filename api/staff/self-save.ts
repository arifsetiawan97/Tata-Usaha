import { applyCorsHeaders } from '../../src/server/cloudDb.mjs';
import { handleStaffSelfSave } from '../../src/server/adminApiHandlers.mjs';

export default async function handler(req: any, res: any) {
  applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    return await handleStaffSelfSave(req, res);
  } catch (err) {
    console.error('STAFF /api/staff/self-save error:', err);
    return res.status(500).json({ ok: false, error: 'Gagal menyimpan data secara permanen ke server.' });
  }
}
