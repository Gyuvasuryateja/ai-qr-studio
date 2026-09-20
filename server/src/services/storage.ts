import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { QRCodeRecord } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'qrcodes.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDB(): Record<string, QRCodeRecord> {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB file:', err);
    return {};
  }
}

function saveDB(data: Record<string, QRCodeRecord>): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

export const storage = {
  getAll(userId?: string): QRCodeRecord[] {
    const db = loadDB();
    const records = Object.values(db);
    const filtered = userId ? records.filter(r => r.userId === userId) : records;
    return filtered.sort((a, b) => 
      new Date(b.stats.createdAt).getTime() - new Date(a.stats.createdAt).getTime()
    );
  },

  getById(id: string): QRCodeRecord | null {
    const db = loadDB();
    return db[id] || null;
  },

  save(record: QRCodeRecord): QRCodeRecord {
    const db = loadDB();
    db[record.id] = record;
    saveDB(db);
    return record;
  },

  incrementView(id: string): QRCodeRecord | null {
    const db = loadDB();
    if (!db[id]) return null;
    db[id].stats.views += 1;
    db[id].stats.lastAccessedAt = new Date().toISOString();
    saveDB(db);
    return db[id];
  },

  addReaction(id: string, emoji: string): QRCodeRecord | null {
    const db = loadDB();
    if (!db[id]) return null;
    if (!db[id].stats.reactions) {
      db[id].stats.reactions = {};
    }
    db[id].stats.reactions[emoji] = (db[id].stats.reactions[emoji] || 0) + 1;
    saveDB(db);
    return db[id];
  },

  delete(id: string): boolean {
    const db = loadDB();
    if (!db[id]) return false;
    delete db[id];
    saveDB(db);
    return true;
  }
};
