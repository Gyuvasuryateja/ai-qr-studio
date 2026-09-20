export type TonePreset = 'Refined' | 'Interactive' | 'Creative';

export type QRMode = 'url' | 'text' | 'custom_url';

export interface AIEnhanceRequest {
  rawContent: string;
  tone: TonePreset;
  contentType?: 'announcement' | 'promo' | 'event' | 'message' | 'general';
  apiKey?: string;
}

export interface AIEnhanceResponse {
  title: string;
  headline: string;
  formattedContent: string;
  summary: string;
  keyTakeaways: string[];
  suggestedCTA: string;
  suggestedPalette: {
    primary: string;
    secondary: string;
    accent: string;
    bgGradient: string;
  };
  plainTextPayload: string;
  tags: string[];
  translations?: {
    hi: string | { title: string; headline: string; formattedContent: string; };
    te: string | { title: string; headline: string; formattedContent: string; };
  };
}

export interface QRStyleConfig {
  dotType: 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
  colorType: 'single' | 'linear' | 'radial';
  singleColor: string;
  gradientColor1: string;
  gradientColor2: string;
  gradientRotation: number;
  bgColor: string;
  cornerSquareType: 'dot' | 'square' | 'extra-rounded';
  cornerSquareColor: string;
  cornerDotType: 'dot' | 'square';
  cornerDotColor: string;
  logoUrl?: string;
  logoPreset?: string;
  logoSize?: number;
  logoMargin?: number;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  pageBgColor?: string;
  pageTextColor?: string;
}

export interface QRCodeRecord {
  id: string;
  userId?: string;
  userEmail?: string;
  title: string;
  mode: QRMode;
  content: {
    raw: string;
    enhanced?: AIEnhanceResponse;
    customUrl?: string;
    customAudio?: string;
    generatedImage?: string;
  };
  style: QRStyleConfig;
  stats: {
    views: number;
    scans: number;
    reactions: Record<string, number>;
    createdAt: string;
    lastAccessedAt: string;
    expiresAt?: string;
  };
}
