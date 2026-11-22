import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  applyCorsHeaders,
  applyStateUpdate,
  buildAdminStateResponse,
  getStorageInfo,
  readDb
} from './src/server/cloudDb.mjs';
import {
  handleAdminRoute,
  handleAuthAction,
  handleGetState,
  handleProtectedBackupDownload,
  handleProtectedCrud,
  handleProtectedDeleteAccessUser,
  handleStaffSelfSave,
  handleStaffSubmission,
  parseJsonBody,
  requireAdminOrReject
} from './src/server/adminApiHandlers.mjs';
import { sanitizeAndInspectPayload } from './src/server/dbValidator.mjs';
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
  applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Ensure unified Admin Database is initialized on boot
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

// Public / Staff / Admin State Read (Strictly filtered by RBAC Bearer Token)
app.get('/api/state', async (req, res) => {
  try {
    await handleGetState(req, res);
  } catch (err) {
    console.error('GET /api/state error:', err);
    res.status(500).json({ error: 'Gagal membaca basis data dari server' });
  }
});

// Full State Write: STRICTLY ADMIN ONLY
app.post('/api/state', async (req, res) => {
  try {
    const db = await readDb();
    const adminCtx = await requireAdminOrReject(req, res, db, 'state');
    if (!adminCtx) return;

    const safeCheck = sanitizeAndInspectPayload(parseJsonBody(req.body));
    if (!safeCheck.valid) {
      return res.status(400).json({ error: safeCheck.error });
    }

    const info = getStorageInfo();
    const result = await applyStateUpdate(safeCheck.value, 'ADMIN_UTAMA');
    if (result.ok) {
      res.json({
        success: true,
        lastUpdated: result.updated.lastUpdated,
        data: buildAdminStateResponse(result.updated),
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

// Public & Staff Auth Routes
app.post('/api/auth/:action', async (req, res) => {
  try {
    await handleAuthAction(req.params.action, req, res);
  } catch (err) {
    console.error(`POST /api/auth/${req.params.action} error:`, err);
    res.status(500).json({ ok: false, message: 'Terjadi kesalahan pada server autentikasi.' });
  }
});

// Non-Admin Staff Safe Operational Submission Queue (No Direct DB Write/Delete)
app.post('/api/staff/submissions', async (req, res) => {
  try {
    await handleStaffSubmission(req, res);
  } catch (err) {
    console.error('POST /api/staff/submissions error:', err);
    res.status(500).json({ ok: false, error: 'Gagal mengirim ajuan operasional ke server.' });
  }
});

// Authenticated User Permanent Self-Save (Multi-User Isolated Kop, Pengesahan & Records)
app.post('/api/staff/self-save', async (req, res) => {
  try {
    await handleStaffSelfSave(req, res);
  } catch (err) {
    console.error('POST /api/staff/self-save error:', err);
    res.status(500).json({ ok: false, error: 'Gagal menyimpan perubahan secara permanen ke server.' });
  }
});

// Admin Database Management, Auth, Capacity, Backups, Migration, Soft-Delete & Audit Trail
app.all('/api/admin/*', async (req, res) => {
  try {
    const rawSub = req.path.replace(/^\/api\/admin\/?/, '');
    const subPath = rawSub.split('/').filter(Boolean);
    await handleAdminRoute(subPath, req, res);
  } catch (err) {
    console.error(`ALL /api/admin error:`, err);
    res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada server Database Admin.' });
  }
});

// Explicit Admin Deletion for Registered Access User (Soft-Delete)
app.delete('/api/access-users/:id', async (req, res) => {
  try {
    await handleProtectedDeleteAccessUser(req.params.id, req, res);
  } catch (err) {
    console.error('DELETE /api/access-users/:id error:', err);
    res.status(500).json({ error: 'Gagal menghapus akun pengguna dari basis data server.' });
  }
});

// Protected RESTful CRUD API (Read = Staff/Admin; Write/Delete = STRICTLY ADMIN ONLY)
app.all('/api/crud/:collection/:id?', async (req, res) => {
  try {
    await handleProtectedCrud(req.params.collection, req.params.id || '', req, res);
  } catch (err) {
    console.error('CRUD route error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada operasi database.' });
  }
});

// Export Backup JSON (ADMIN ONLY)
app.get('/api/backup', async (req, res) => {
  try {
    await handleProtectedBackupDownload(req, res);
  } catch (err) {
    console.error('GET /api/backup error:', err);
    res.status(500).json({ error: 'Gagal mengunduh file backup.' });
  }
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
    console.log(`Server SI-OPS Database Admin Satu Pintu berjalan pada http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Gagal menjalankan server:', err);
});
