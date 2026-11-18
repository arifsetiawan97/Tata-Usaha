import { applyCorsHeaders, readDb, VALID_COLLECTIONS, writeDb } from '../../src/server/cloudDb.mjs';

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
  applyCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const segments = extractSegments(req);
  const collection = segments[0] || '';
  const id = segments[1] || '';

  if (!VALID_COLLECTIONS.includes(collection as any)) {
    return res.status(400).json({ error: `Koleksi tidak valid: ${collection}` });
  }

  const db = (await readDb()) || {};
  const items = Array.isArray(db[collection]) ? [...db[collection]] : [];

  if (req.method === 'GET') {
    if (!id) {
      return res.status(200).json({ success: true, collection, count: items.length, data: items });
    }
    const found = items.find((item: any) => item.id === id);
    if (!found) {
      return res.status(404).json({ error: `Item id ${id} tidak ditemukan pada ${collection}` });
    }
    return res.status(200).json({ success: true, data: found });
  }

  if (req.method === 'POST') {
    const newItem = parseBody(req.body);
    if (!newItem || typeof newItem !== 'object' || Array.isArray(newItem)) {
      return res.status(400).json({ error: 'Data item harus berupa objek valid' });
    }
    if (!newItem.id) {
      newItem.id = `${collection.substring(0, 4)}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }
    items.unshift(newItem);
    db[collection] = items;
    db.lastUpdated = new Date().toISOString();
    const ok = await writeDb(db);
    return ok
      ? res.status(201).json({ success: true, created: newItem, lastUpdated: db.lastUpdated })
      : res.status(500).json({ error: 'Gagal menambahkan data ke basis data server' });
  }

  if (req.method === 'PUT') {
    if (!id) {
      return res.status(400).json({ error: 'ID item wajib disertakan untuk update' });
    }
    const updates = parseBody(req.body);
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({ error: 'Data pembaruan tidak valid' });
    }
    const index = items.findIndex((item: any) => item.id === id);
    if (index === -1) {
      items.unshift({ ...updates, id });
    } else {
      items[index] = { ...items[index], ...updates, id };
    }
    db[collection] = items;
    db.lastUpdated = new Date().toISOString();
    const ok = await writeDb(db);
    return ok
      ? res.status(200).json({
          success: true,
          updated: items[index === -1 ? 0 : index],
          lastUpdated: db.lastUpdated
        })
      : res.status(500).json({ error: 'Gagal memperbarui data di basis data server' });
  }

  if (req.method === 'DELETE') {
    if (!id) {
      return res.status(400).json({ error: 'ID item wajib disertakan untuk hapus' });
    }
    const filtered = items.filter((item: any) => item.id !== id);
    db[collection] = filtered;
    db.lastUpdated = new Date().toISOString();
    const ok = await writeDb(db);
    return ok
      ? res.status(200).json({
          success: true,
          deletedId: id,
          remainingCount: filtered.length,
          lastUpdated: db.lastUpdated
        })
      : res.status(500).json({ error: 'Gagal menghapus data dari basis data server' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
