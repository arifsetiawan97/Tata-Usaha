import { applyCorsHeaders, readDb } from '../src/server/cloudDb.mjs';

export default async function handler(req: any, res: any) {
  applyCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const data = await readDb();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="backup-siops-sekolah.json"');
    return res.status(200).send(JSON.stringify(data || {}, null, 2));
  } catch (err) {
    console.error('GET /api/backup error:', err);
    return res.status(500).json({ error: 'Gagal membuat file backup' });
  }
}
