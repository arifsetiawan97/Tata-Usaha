import { applyCorsHeaders, getStorageInfo } from '../src/server/cloudDb.mjs';

export default async function handler(req: any, res: any) {
  applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const info = getStorageInfo();
  return res.status(200).json({
    status: 'ok',
    ...info,
    timestamp: new Date().toISOString()
  });
}
