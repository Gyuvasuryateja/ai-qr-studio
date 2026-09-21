import { GoogleGenAI } from '@google/genai';
import translate from 'translate';
translate.engine = 'google';
import { AIEnhanceRequest, AIEnhanceResponse } from '../types.js';

const TONE_PROMPTS: Record<string, string> = {
  Refined: 'FILTERING AND REFINING: Strip out all fluff, unnecessary emojis, and excitement. Make it extremely clean, formal, highly legible, and grammatically perfect. The text should read like an official, polished executive document.',
  Interactive: 'INTERACTIVE: Make the text highly engaging and conversational! You MUST speak directly to the reader, ask multiple rhetorical questions, and prompt them to take action or think about the content (e.g. "What do you think?", "Are you ready?").',
  Creative: 'CREATIVE: Go completely wild with vibrant, imaginative storytelling! Use metaphors, dramatic phrasing, lots of relevant emojis, and a highly creative and magnetic layout.'
};

export async function enhanceContentWithAI(req: AIEnhanceRequest): Promise<AIEnhanceResponse> {
  const apiKey = req.apiKey || process.env.GEMINI_API_KEY || process.env.Smart_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return await generateFallbackEnhancement(req);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const toneInstruction = TONE_PROMPTS[req.tone] || TONE_PROMPTS.Refined;

    const systemPrompt = `You are an elite copywriter and digital content transformation AI.
Transform the following raw user announcement/message/event into a stunning, high-converting interactive digital card payload.

CRITICAL INSTRUCTION FOR TONE AND STYLE:
You MUST completely change the formatting, style, and structure of the text based on this mode:
Mode: ${req.tone}
Instruction: ${toneInstruction}

Content category hint: ${req.contentType || 'general'}

Raw input:
"""
${req.rawContent}
"""

Return ONLY a valid JSON object matching this schema exactly without any markdown backticks or commentary:
{
  "title": "Short catchy title (max 7 words)",
  "headline": "Punchy 1-line subtitle or hook",
  "formattedContent": "Full formatted rich text or markdown story/announcement with emojis and paragraphs",
  "summary": "Crisp 2-sentence executive summary",
  "keyTakeaways": ["Bullet 1 with emoji prefix", "Bullet 2 with emoji prefix", "Bullet 3 with emoji prefix", "Bullet 4 with emoji prefix"],
  "suggestedCTA": "Call to action text (e.g. 'RSVP Now', 'Claim 40% Off', 'Read Full Brief')",
  "suggestedPalette": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX",
    "bgGradient": "linear-gradient(135deg, #HEX 0%, #HEX 100%)"
  },
  "plainTextPayload": "A beautifully formatted offline-ready plain-text version with ASCII dividers and bullets suitable for instant display on Google Lens / Apple Camera",
  "tags": ["Tag1", "Tag2", "Tag3"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
    });
    const responseText = response.text?.trim() || '';
    
    // Clean code fences if present
    const cleanedJson = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedJson) as AIEnhanceResponse;
    return parsed;
  } catch (error) {
    console.warn('Smart API call failed or encountered an error. Falling back to local smart engine:', error);
    return await generateFallbackEnhancement(req);
  }
}

export async function generateFallbackEnhancement(req: AIEnhanceRequest): Promise<AIEnhanceResponse> {
  const text = req.rawContent.trim();
  const firstLine = text.split('\n')[0].replace(/^[#\s*-]+/, '').slice(0, 60);
  const title = firstLine.length > 5 ? firstLine : 'Exclusive Digital Announcement';
  
  const toneMap: Record<string, { badge: string; cta: string; p: string; s: string; a: string; grad: string }> = {
    Refined: {
      badge: '✨ Refined Extract',
      cta: 'View Official Notice',
      p: '#3b82f6',
      s: '#1d4ed8',
      a: '#60a5fa',
      grad: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
    },
    Interactive: {
      badge: '👋 Interactive Session',
      cta: 'Join the Conversation',
      p: '#10b981',
      s: '#047857',
      a: '#34d399',
      grad: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)'
    },
    Creative: {
      badge: '🎨 Creative Showcase',
      cta: 'Explore Details',
      p: '#ec4899',
      s: '#8b5cf6',
      a: '#f43f5e',
      grad: 'linear-gradient(135deg, #831843 0%, #3b0764 100%)'
    }
  };

  const currentTheme = toneMap[req.tone] || toneMap.Refined;

  // Generate bullet takeaways
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const keyTakeaways = lines.slice(0, 4).map((line, idx) => {
    const emojis = ['📌', '✨', '⚡', '🎯'];
    return `${emojis[idx % emojis.length]} ${line.replace(/^[-*•0-9.]+\s*/, '').trim()}`;
  });

  if (keyTakeaways.length === 0) {
    keyTakeaways.push('✨ Important announcement details enclosed');
    keyTakeaways.push('📌 Scan and share with your network');
  }

  const plainText = `═══════════════════════════════\n✦ ${title.toUpperCase()} ✦\n${currentTheme.badge}\n═══════════════════════════════\n\n${text}\n\n📌 KEY HIGHLIGHTS:\n${keyTakeaways.join('\n')}\n\n═══════════════════════════════\nGenerated with Custom QR`;

  let hiTitle = `${title} (अनुवादित)`;
  let hiHeadline = `${currentTheme.badge} — Hindi`;
  let hiContent = `[Hindi Translation Simulation]\n\n${text}`;
  
  let teTitle = `${title} (అనువదించబడింది)`;
  let teHeadline = `${currentTheme.badge} — Telugu`;
  let teContent = `[Telugu Translation Simulation]\n\n${text}`;

  try {
    hiTitle = await translate(title, "hi");
    hiHeadline = await translate(`${currentTheme.badge} — Hindi`, "hi");
    hiContent = await translate(text, "hi");

    teTitle = await translate(title, "te");
    teHeadline = await translate(`${currentTheme.badge} — Telugu`, "te");
    teContent = await translate(text, "te");
  } catch (err) {
    console.error("Translate API fallback failed:", err);
  }

  return {
    title: title,
    headline: `${currentTheme.badge} — ${req.tone} Edition`,
    formattedContent: text,
    summary: text.length > 140 ? text.slice(0, 137) + '...' : text,
    keyTakeaways: keyTakeaways,
    suggestedCTA: currentTheme.cta,
    suggestedPalette: {
      primary: currentTheme.p,
      secondary: currentTheme.s,
      accent: currentTheme.a,
      bgGradient: currentTheme.grad
    },
    plainTextPayload: plainText,
    tags: [req.tone, req.contentType || 'Card', 'AI-QR'],
    translations: {
      hi: {
        title: hiTitle,
        headline: hiHeadline,
        formattedContent: hiContent
      },
      te: {
        title: teTitle,
        headline: teHeadline,
        formattedContent: teContent
      }
    }
  };
}
