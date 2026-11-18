import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  applyCorsHeaders,
  applyStateUpdate,
  deleteAccessUserFromDb,
  getStorageInfo,
  readDb,
  VALID_COLLECTIONS,
  writeDb
} from './src/server/cloudDb.mjs';
import {
  handleAnalyzeAnnual,
  handleAnalyzeInventory,
  handleAnalyzeMonthly,
  handleAssistant,
  handleAuditDocument,
  handleDraftTask,
  handleGenerateTaskDescription,
  handleSuggestCategories
} from './src/server/geminiHandlers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use('/api', (req, res, next) => {
  applyCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Ensure database is initialized on boot
readDb().catch(err => console.error('[Server DB] Inisialisasi awal gagal:', err));

// Health Route
app.get('/api/health', (req, res) => {
  const info = getStorageInfo();
  res.json({
    status: 'ok',
    ...info,
    timestamp: new Date().toISOString()
  });
});

// GET all stored application state
app.get('/api/state', async (req, res) => {
  try {
    const data = await readDb();
    const info = getStorageInfo();
    if (!data) {
      return res.json({ initialized: false, ...info });
    }
    res.json({ initialized: true, data, ...info });
  } catch (err) {
    console.error('GET /api/state error:', err);
    res.status(500).json({ error: 'Gagal membaca basis data dari server' });
  }
});

// POST update application state (non-destructive merge for users & protected against unhydrated overwrites)
app.post('/api/state', async (req, res) => {
  try {
    const info = getStorageInfo();
    const result = await applyStateUpdate(req.body);
    if (result.ok) {
      res.json({
        success: true,
        lastUpdated: result.updated.lastUpdated,
        data: result.updated,
        ...info
      });
    } else {
      res.status(500).json({ error: 'Gagal menyimpan basis data ke server' });
    }
  } catch (err) {
    console.error('POST /api/state error:', err);
    res.status(500).json({ error: 'Gagal menyimpan basis data ke server' });
  }
});

// Explicit Admin Deletion for Registered Access User
app.delete('/api/access-users/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'ID pengguna wajib disertakan.' });
  }
  try {
    const result = await deleteAccessUserFromDb(id);
    if (result.ok) {
      res.json({ success: true, deletedId: id, lastUpdated: result.lastUpdated });
    } else {
      res.status(500).json({ error: 'Gagal menghapus akun pengguna dari basis data server.' });
    }
  } catch (err) {
    console.error('DELETE /api/access-users/:id error:', err);
    res.status(500).json({ error: 'Gagal menghapus akun pengguna dari basis data server.' });
  }
});

// ========================================================
// RESTful CRUD API ENDPOINTS (Database Server Logic)
// ========================================================
app.get('/api/crud/:collection', async (req, res) => {
  const { collection } = req.params;
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: `Koleksi tidak valid: ${collection}` });
  }
  const db = (await readDb()) || {};
  const items = Array.isArray(db[collection]) ? db[collection] : [];
  res.json({ success: true, collection, count: items.length, data: items });
});

app.get('/api/crud/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: `Koleksi tidak valid: ${collection}` });
  }
  const db = (await readDb()) || {};
  const items = Array.isArray(db[collection]) ? db[collection] : [];
  const found = items.find((item) => item.id === id);
  if (!found) {
    return res.status(404).json({ error: `Item id ${id} tidak ditemukan pada ${collection}` });
  }
  res.json({ success: true, data: found });
});

app.post('/api/crud/:collection', async (req, res) => {
  const { collection } = req.params;
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: `Koleksi tidak valid: ${collection}` });
  }
  const newItem = req.body;
  if (!newItem || typeof newItem !== 'object') {
    return res.status(400).json({ error: 'Data item harus berupa objek valid' });
  }

  const db = (await readDb()) || {};
  const items = Array.isArray(db[collection]) ? [...db[collection]] : [];
  if (!newItem.id) {
    newItem.id = `${collection.substring(0, 4)}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }
  items.unshift(newItem);
  db[collection] = items;
  db.lastUpdated = new Date().toISOString();

  const success = await writeDb(db);
  if (success) {
    res.status(201).json({ success: true, created: newItem, lastUpdated: db.lastUpdated });
  } else {
    res.status(500).json({ error: 'Gagal menambahkan data ke basis data server' });
  }
});

app.put('/api/crud/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: `Koleksi tidak valid: ${collection}` });
  }
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Data pembaruan tidak valid' });
  }

  const db = (await readDb()) || {};
  const items = Array.isArray(db[collection]) ? [...db[collection]] : [];
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    items.unshift({ ...updates, id });
  } else {
    items[index] = { ...items[index], ...updates, id };
  }

  db[collection] = items;
  db.lastUpdated = new Date().toISOString();

  const success = await writeDb(db);
  if (success) {
    res.json({ success: true, updated: items[index === -1 ? 0 : index], lastUpdated: db.lastUpdated });
  } else {
    res.status(500).json({ error: 'Gagal memperbarui data di basis data server' });
  }
});

app.delete('/api/crud/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: `Koleksi tidak valid: ${collection}` });
  }

  const db = (await readDb()) || {};
  const items = Array.isArray(db[collection]) ? [...db[collection]] : [];
  const filtered = items.filter((item) => item.id !== id);

  db[collection] = filtered;
  db.lastUpdated = new Date().toISOString();

  const success = await writeDb(db);
  if (success) {
    res.json({ success: true, deletedId: id, remainingCount: filtered.length, lastUpdated: db.lastUpdated });
  } else {
    res.status(500).json({ error: 'Gagal menghapus data dari basis data server' });
  }
});

// Export Backup JSON
app.get('/api/backup', async (req, res) => {
  const data = await readDb();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="backup-siops-sekolah.json"');
  res.send(JSON.stringify(data || {}, null, 2));
});

// ========================================================
// GEMINI AI ROUTES
// ========================================================
app.post('/api/gemini/analyze-monthly', async (req, res) => {
  res.json(await handleAnalyzeMonthly(req.body));
});

app.post('/api/gemini/analyze-annual', async (req, res) => {
  res.json(await handleAnalyzeAnnual(req.body));
});

app.post('/api/gemini/draft-task', async (req, res) => {
  res.json(await handleDraftTask(req.body));
});

app.post('/api/gemini/suggest-categories', async (req, res) => {
  res.json(await handleSuggestCategories(req.body));
});

app.post('/api/gemini/analyze-inventory', async (req, res) => {
  res.json(await handleAnalyzeInventory(req.body));
});

app.post('/api/gemini/generate-task-description', async (req, res) => {
  const result = await handleGenerateTaskDescription(req.body);
  res.status(result.status).json(result.payload);
});

app.post('/api/gemini/audit-document', async (req, res) => {
  res.json(await handleAuditDocument(req.body));
});

app.post('/api/gemini/assistant', async (req, res) => {
  res.json(await handleAssistant(req.body));
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  app.use('/api', (req, res) => {
    res.status(404).json({ error: `Endpoint API tidak ditemukan: ${req.originalUrl}` });
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server SI-OPS berjalan pada http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Gagal menjalankan server:', err);
});
