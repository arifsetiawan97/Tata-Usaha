import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read DB
function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  return null;
}

// Helper to write DB
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET all stored application state
app.get('/api/state', (req, res) => {
  const data = readDb();
  if (!data) {
    return res.json({ initialized: false });
  }
  res.json({ initialized: true, data });
});

// POST update entire application state
app.post('/api/state', (req, res) => {
  const { tasks, inventories, monthlyReports, annualReports, schoolConfig, archives } = req.body;
  const current = readDb() || {};
  const updated = {
    ...current,
    tasks: tasks !== undefined ? tasks : current.tasks,
    inventories: inventories !== undefined ? inventories : current.inventories,
    monthlyReports: monthlyReports !== undefined ? monthlyReports : current.monthlyReports,
    annualReports: annualReports !== undefined ? annualReports : current.annualReports,
    schoolConfig: schoolConfig !== undefined ? schoolConfig : current.schoolConfig,
    archives: archives !== undefined ? archives : current.archives,
    lastUpdated: new Date().toISOString()
  };
  const success = writeDb(updated);
  if (success) {
    res.json({ success: true, lastUpdated: updated.lastUpdated });
  } else {
    res.status(500).json({ error: 'Gagal menyimpan basis data ke server' });
  }
});

// Export Backup JSON
app.get('/api/backup', (req, res) => {
  const data = readDb();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="backup-siops-sekolah.json"');
  res.send(JSON.stringify(data || {}, null, 2));
});

// Dev vs Prod handling with Vite
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

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
