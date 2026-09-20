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

  // Get all QR codes
  async getQRCodes(userId?: string): Promise<QRCodeRecord[]> {
    const url = userId ? `${API_BASE}/qr?userId=${encodeURIComponent(userId)}` : `${API_BASE}/qr`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch QR codes');
    return await res.json();
  },

  // Get single QR code by ID
  async getQRCode(id: string): Promise<QRCodeRecord> {
    const res = await fetch(`${API_BASE}/qr/${id}`);
    if (!res.ok) throw new Error('QR Code not found');
    return await res.json();
  },

  // Save (create or update) QR code
  async saveQRCode(record: Partial<QRCodeRecord>): Promise<QRCodeRecord> {
    const res = await fetch(`${API_BASE}/qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (!res.ok) {
      let msg = 'Failed to save QR code';
      try {
        const errorData = await res.json();
        if (errorData?.error) msg = errorData.error;
      } catch {}
      throw new Error(msg);
    }
    return await res.json();
  },

  // Increment view counter
  async recordView(id: string): Promise<{ views: number }> {
    const res = await fetch(`${API_BASE}/qr/${id}/view`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to record view');
    return await res.json();
  },

  // Record emoji reaction
  async recordReaction(id: string, emoji: string): Promise<{ reactions: Record<string, number> }> {
    const res = await fetch(`${API_BASE}/qr/${id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji })
    });
    if (!res.ok) throw new Error('Failed to record reaction');
    return await res.json();
  },

  // Delete QR Code
  async deleteQRCode(id: string): Promise<boolean> {
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
