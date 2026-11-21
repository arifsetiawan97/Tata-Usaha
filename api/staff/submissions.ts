import { applyCorsHeaders } from '../../src/server/cloudDb.mjs';
import { handleStaffSubmission } from '../../src/server/adminApiHandlers.mjs';

export default async function handler(req: any, res: any) {
  applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    return await handleStaffSubmission(req, res);
  } catch (err) {
    console.error('STAFF /api/staff/submissions error:', err);
    return res.status(500).json({ ok: false, error: 'Gagal mengirim ajuan ke server Database Admin.' });
  }
}
