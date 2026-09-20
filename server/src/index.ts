import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { aiRouter } from './routes/ai.js';
import { qrRouter } from './routes/qr.js';
import { storage } from './services/storage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Custom QR Backend',
    SmartKeyConfigured: !!(process.env.GEMINI_API_KEY || process.env.Smart_API_KEY || process.env.GOOGLE_API_KEY)
  });
});

// API Routes
app.use('/api/ai', aiRouter);
app.use('/api/qr', qrRouter);

// Serve client in production if built
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath, { index: false }));

// Dynamic OpenGraph previews for /reveal/:id (WhatsApp, Telegram, iMessage, Twitter)
app.get('/reveal/:id', (req, res) => {
  const recordId = req.params.id;
  const indexPath = path.join(clientDistPath, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    res.status(200).send('Custom QR Backend running.');
    return;
  }

  let html = fs.readFileSync(indexPath, 'utf-8');
  const record = storage.getById(recordId);

  if (record) {
    const title = record.title || 'Custom QR Message';
    const description = record.content.raw 
      ? (record.content.raw.length > 120 ? record.content.raw.substring(0, 117) + '...' : record.content.raw)
      : 'Open to view photo, voice message, and details.';
    
    // Replace default og tags with user's specific custom QR metadata
    html = html.replace(
      /<title>.*?<\/title>/,
      `<title>${title} - Custom QR</title>`
    );
    html = html.replace(
      /<meta property="og:title" content=".*?" \/>/,
      `<meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />`
    );
    html = html.replace(
      /<meta property="og:description" content=".*?" \/>/,
      `<meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />`
    );
    html = html.replace(
      /<meta name="description" content=".*?" \/>/,
      `<meta name="description" content="${description.replace(/"/g, '&quot;')}" />`
    );
  }

  res.send(html);
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API endpoint not found' });
    return;
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Custom QR Backend running. Client build not found or running in dev mode.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Custom QR Server listening on http://localhost:${PORT}`);
});
