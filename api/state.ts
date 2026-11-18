import { applyCorsHeaders, applyStateUpdate, getStorageInfo, readDb } from '../src/server/cloudDb';

function parseBody(raw: any): any {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

export default async function handler(req: any, res: any) {
  applyCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const storageInfo = getStorageInfo();

  if (req.method === 'GET') {
    try {
      const data = await readDb();
      if (!data) {
        return res.status(200).json({ initialized: false, ...storageInfo });
      }
      return res.status(200).json({
        initialized: true,
        data,
        ...storageInfo
      });
    } catch (err) {
      console.error('GET /api/state error:', err);
      return res.status(500).json({ error: 'Gagal membaca basis data cloud' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = parseBody(req.body);
      const result = await applyStateUpdate(body);
      if (result.ok) {
        return res.status(200).json({
          success: true,
          lastUpdated: result.updated.lastUpdated,
          data: result.updated,
          ...storageInfo
        });
      }
      return res.status(500).json({ error: 'Gagal menyimpan basis data ke server' });
    } catch (err) {
      console.error('POST /api/state error:', err);
      return res.status(500).json({ error: 'Gagal menyimpan basis data ke server' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
