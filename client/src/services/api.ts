import { AIEnhanceRequest, AIEnhanceResponse, QRCodeRecord } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || '/api';

export const api = {
  // Check API health
  async checkHealth(): Promise<{ status: string; SmartKeyConfigured: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch {
      return { status: 'offline', SmartKeyConfigured: false };
    }
  },

  // Smart Content Customizer
  async enhanceContent(req: AIEnhanceRequest): Promise<AIEnhanceResponse> {
    const res = await fetch(`${API_BASE}/ai/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to enhance content' }));
      throw new Error(err.error || 'Failed to enhance content');
    }

    return await res.json();
  },

  // Smart Image generation
  async generateImage(prompt: string): Promise<{ base64Image: string }> {
    const res = await fetch(`${API_BASE}/ai/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to generate image' }));
      throw new Error(err.error || 'Failed to generate image');
    }

    return await res.json();
  },

  // Get all QR codes (loads from Cloud Firestore with server fallback)
  async getQRCodes(userId?: string, userEmail?: string): Promise<QRCodeRecord[]> {
    try {
      const { cloudStorageService } = await import('./auth');
      const records = await cloudStorageService.getQRCodes(userId, userEmail);
      if (records && records.length > 0) return records;
    } catch (e) {
      console.warn('Firestore getQRCodes fallback to server:', e);
    }
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    const queryString = params.toString();
    const url = queryString ? `${API_BASE}/qr?${queryString}` : `${API_BASE}/qr`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  },

  // Get single QR code by ID (fast parallel fetch from Firestore & Server)
  async getQRCode(id: string): Promise<QRCodeRecord> {
    const fetchFromServer = async (): Promise<QRCodeRecord> => {
      const res = await fetch(`${API_BASE}/qr/${id}`);
      if (!res.ok) throw new Error('Not found on server');
      return await res.json();
    };

    const fetchFromFirestore = async (): Promise<QRCodeRecord> => {
      const { cloudStorageService } = await import('./auth');
      const record = await cloudStorageService.getQRCode(id);
      if (!record) throw new Error('Not found in Firestore');
      return record;
    };

    // Parallel race: check both and return the fastest successful result
    try {
      return await new Promise<QRCodeRecord>((resolve, reject) => {
        let errors = 0;
        const total = 2;
        const onError = (e: any) => {
          errors++;
          if (errors === total) reject(new Error('QR not found'));
        };
        fetchFromServer().then(resolve).catch(onError);
        fetchFromFirestore().then(resolve).catch(onError);
      });
    } catch {
      const res = await fetch(`${API_BASE}/qr/${id}`);
      if (!res.ok) throw new Error('QR Code destination not found or expired.');
      return await res.json();
    }
  },

  // Save (create or update) QR code permanently into Cloud Firestore & Storage with zero UI latency
  async saveQRCode(record: Partial<QRCodeRecord>): Promise<QRCodeRecord> {
    // 1. Immediately cache locally in browser storage so it is never lost
    if (record.id) {
      try {
        const now = new Date();
        const fullRec = {
          ...record,
          stats: {
            views: record.stats?.views || 0,
            scans: record.stats?.scans || 0,
            reactions: record.stats?.reactions || {},
            createdAt: record.stats?.createdAt || now.toISOString(),
            lastAccessedAt: now.toISOString(),
            expiresAt: record.stats?.expiresAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        } as QRCodeRecord;

        const keysToUpdate = new Set<string>();
        if (record.userId) keysToUpdate.add(`cached_qrs_${record.userId}`);
        if (record.userEmail) keysToUpdate.add(`cached_qrs_${record.userEmail.toLowerCase()}`);
        keysToUpdate.add('cached_qrs_anon');

        for (const key of keysToUpdate) {
          const existing = localStorage.getItem(key);
          const list: QRCodeRecord[] = existing ? JSON.parse(existing) : [];
          const filtered = list.filter(r => r.id !== record.id);
          filtered.unshift(fullRec);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch {}
    }

    // 2. Fire save to both Firestore and Server simultaneously in background/parallel
    const firestoreSave = (async () => {
      try {
        const { cloudStorageService } = await import('./auth');
        return await cloudStorageService.saveQRCode(record);
      } catch (err) {
        console.warn('Firestore parallel save notice:', err);
        return null;
      }
    })();

    const serverSave = (async () => {
      try {
        const res = await fetch(`${API_BASE}/qr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Server API parallel save notice:', err);
      }
      return null;
    })();

    // 3. Fast race: return as soon as either completes (or timeout after 1.5s max)
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));

    const fastest = await Promise.race([firestoreSave, serverSave, timeoutPromise]);
    if (fastest) return fastest;

    // Guaranteed fallback return without blocking the user interface
    const now = new Date();
    return {
      id: record.id || 'qr_' + Date.now(),
      userId: record.userId || 'anonymous',
      userEmail: record.userEmail,
      title: record.title || 'Custom QR',
      mode: record.mode || 'url',
      content: record.content || { raw: '' },
      style: record.style || ({} as any),
      stats: {
        views: record.stats?.views || 0,
        scans: record.stats?.scans || 0,
        reactions: record.stats?.reactions || {},
        createdAt: record.stats?.createdAt || now.toISOString(),
        lastAccessedAt: now.toISOString(),
        expiresAt: record.stats?.expiresAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  },

  // Increment view counter permanently
  async recordView(id: string): Promise<{ views: number }> {
    try {
      const { cloudStorageService } = await import('./auth');
      return await cloudStorageService.recordView(id);
    } catch (e) {
      const res = await fetch(`${API_BASE}/qr/${id}/view`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to record view');
      return await res.json();
    }
  },

  // Record emoji reaction permanently
  async recordReaction(id: string, emoji: string): Promise<{ reactions: Record<string, number> }> {
    try {
      const { cloudStorageService } = await import('./auth');
      return await cloudStorageService.recordReaction(id, emoji);
    } catch (e) {
      const res = await fetch(`${API_BASE}/qr/${id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
      if (!res.ok) throw new Error('Failed to record reaction');
      return await res.json();
    }
  },

  // Delete QR Code permanently from Cloud Firestore
  async deleteQRCode(id: string): Promise<boolean> {
    try {
      const { cloudStorageService } = await import('./auth');
      await cloudStorageService.deleteQRCode(id);
    } catch (e) {
      console.warn('Firestore delete fallback:', e);
    }
    const res = await fetch(`${API_BASE}/qr/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // Generate TTS Audio Chunks
  async generateTTS(text: string, lang: string): Promise<string[]> {
    const res = await fetch(`${API_BASE}/ai/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang })
    });
    if (!res.ok) {
      throw new Error('Failed to generate TTS audio');
    }
    const data = await res.json();
    return data.chunks || [];
  },

  // Translate text
  async translateText(text: string | string[], targetLang: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/ai/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang }),
      });
      if (!response.ok) {
        throw new Error('Translation failed');
      }
      const data = await response.json();
      return data.translation;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original text on error
    }
  }
};
