import { Router } from 'express';
import { enhanceContentWithAI } from '../services/gemini.js';
import * as googleTTS from 'google-tts-api';
import translate from 'translate';
translate.engine = 'google';
import { AIEnhanceRequest } from '../types.js';

export const aiRouter = Router();

// Rate limiter for image generation
const imageRateLimits = new Map<string, { count: number; date: string }>();

aiRouter.post('/image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const today = new Date().toISOString().split('T')[0];

    let userLimit = imageRateLimits.get(ip);
    if (!userLimit || userLimit.date !== today) {
      userLimit = { count: 0, date: today };
    }

    if (userLimit.count >= 3) {
      res.status(429).json({ error: 'You have reached your limit of 3 image generations for today.' });
      return;
    }

    // Call Pollinations API
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=400&nologo=true`;
    
    // Fetch image as ArrayBuffer to convert to Base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to generate image');
    }
    
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:${imageResponse.headers.get('content-type') || 'image/jpeg'};base64,${buffer.toString('base64')}`;

    // Update limit only on success
    userLimit.count += 1;
    imageRateLimits.set(ip, userLimit);

    res.json({ base64Image });
  } catch (error: any) {
    console.error('Image Generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

aiRouter.post('/enhance', async (req, res) => {
  try {
    const { rawContent, tone, contentType, apiKey } = req.body as AIEnhanceRequest;
    
    if (!rawContent || rawContent.trim() === '') {
      res.status(400).json({ error: 'rawContent is required' });
      return;
    }

    const result = await enhanceContentWithAI({
      rawContent,
      tone: tone || 'Creative',
      contentType: contentType || 'general',
      apiKey
    });

    res.json(result);
  } catch (error: any) {
    console.error('AI Enhancement route error:', error);
    res.status(500).json({ error: error.message || 'Failed to enhance content' });
  }
});

aiRouter.post('/tts', async (req, res) => {
  try {
    const { text, lang } = req.body;
    if (!text || !lang) {
      res.status(400).json({ error: 'text and lang are required' });
      return;
    }
    const chunks = await googleTTS.getAllAudioBase64(text, {
      lang: lang,
      slow: false,
      host: 'https://translate.google.com',
      splitPunct: ',.?!'
    });
    // chunks is an array of { shortText, base64 }
    res.json({ chunks: chunks.map(c => `data:audio/mp3;base64,${c.base64}`) });
  } catch (error: any) {
    console.error('TTS Generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate TTS' });
  }
});

aiRouter.post('/translate', async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) {
      res.status(400).json({ error: 'text and targetLang are required' });
      return;
    }
    
    if (Array.isArray(text)) {
      const translations = await Promise.all(text.map(t => translate(t, targetLang)));
      res.json({ translation: translations });
      return;
    }

    const translatedText = await translate(text, targetLang);
    res.json({ translation: translatedText });
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message || 'Failed to translate text' });
  }
});
