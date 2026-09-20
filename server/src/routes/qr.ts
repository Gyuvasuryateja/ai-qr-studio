import { Router } from 'express';
import { nanoid } from 'nanoid';
import { storage } from '../services/storage.js';
import { QRCodeRecord } from '../types.js';

export const qrRouter = Router();

// GET all QR codes for authenticated user
qrRouter.get('/', (req, res) => {
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    res.json([]);
    return;
  }
  const records = storage.getAll(userId);
  res.json(records);
});

// GET single QR code
qrRouter.get('/:id', (req, res) => {
  const record = storage.getById(req.params.id);
  if (!record) {
    res.status(404).json({ error: 'QR Code not found' });
    return;
  }
  res.json(record);
});

// CREATE or UPDATE QR code
qrRouter.post('/', (req, res) => {
  try {
    const { id, userId, userEmail, title, mode, content, style } = req.body;
    
    if (!userId) {
      res.status(401).json({ error: 'Authentication required. Please sign up or sign in to publish QR codes.' });
      return;
    }

    const existing = id ? storage.getById(id) : null;
    const recordId = id || nanoid(10);

    const record: QRCodeRecord = {
      id: recordId,
      userId: userId || existing?.userId,
      userEmail: userEmail || existing?.userEmail,
      title: title || '',
      mode: mode || 'url',
      content: content || { raw: '' },
      style: style || {
        dotType: 'rounded',
        colorType: 'linear',
        singleColor: '#4f46e5',
        gradientColor1: '#6366f1',
        gradientColor2: '#a855f7',
        gradientRotation: 45,
        bgColor: '#ffffff',
        cornerSquareType: 'extra-rounded',
        cornerSquareColor: '#4338ca',
        cornerDotType: 'dot',
        cornerDotColor: '#3b82f6',
        margin: 10,
        errorCorrectionLevel: 'Q'
      },
      stats: existing?.stats || {
        views: 0,
        scans: 0,
        reactions: {},
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString()
      }
    };

    const saved = storage.save(record);
    res.status(existing ? 200 : 201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save QR Code' });
  }
});

// Record a view (analytics)
qrRouter.post('/:id/view', (req, res) => {
  const record = storage.incrementView(req.params.id);
  if (!record) {
    res.status(404).json({ error: 'QR Code not found' });
    return;
  }
  res.json(record.stats);
});

// Record an interactive reaction
qrRouter.post('/:id/react', (req, res) => {
  const { emoji } = req.body;
  if (!emoji) {
    res.status(400).json({ error: 'Emoji is required' });
    return;
  }
  const record = storage.addReaction(req.params.id, emoji);
  if (!record) {
    res.status(404).json({ error: 'QR Code not found' });
    return;
  }
  res.json(record.stats);
});

// DELETE QR code
qrRouter.delete('/:id', (req, res) => {
  const success = storage.delete(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'QR Code not found' });
    return;
  }
  res.json({ success: true, message: 'QR Code deleted' });
});
