import React, { useEffect, useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Share2, 
  Sparkles, 
  ArrowLeft, 
  ExternalLink, 
  Calendar,
  CheckCircle2, 
  QrCode,
  Download,
  Flame,
  Award
} from 'lucide-react';
import { QRCodeRecord } from '../types';
import { api } from '../services/api';
import { ReactionBar } from '../components/ReactionBar';
import { ShareModal } from '../components/ShareModal';
import { copyToClipboard } from '../utils/urlHelper';

interface PublicQRViewerProps {
  qrId: string;
  onBackToStudio?: () => void;
}

export const PublicQRViewer: React.FC<PublicQRViewerProps> = ({ qrId, onBackToStudio }) => {
  const [record, setRecord] = useState<QRCodeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'te'>('en');
  const [dynamicTranslations, setDynamicTranslations] = useState<Record<string, any>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Fetch QR Record and record initial view count
  useEffect(() => {
    let isMounted = true;

    async function loadData(retryCount = 0) {
      try {
        setLoading(true);
        let data: QRCodeRecord | null = null;
        try {
          data = await api.getQRCode(qrId);
        } catch (fetchErr) {
          // If server was cold / sleeping, retry up to 4 times with short intervals
          if (retryCount < 4) {
            await new Promise(res => setTimeout(res, 1000));
            if (isMounted) return loadData(retryCount + 1);
          }
          throw fetchErr;
        }

        if (isMounted && data) {
          // Check 1-month (30 days) expiration with 30-day strict guarantee
          if (data.stats) {
            const now = Date.now();
            const createdAtTime = data.stats.createdAt ? new Date(data.stats.createdAt).getTime() : now;
            const expiresAtTime = data.stats.expiresAt 
              ? new Date(data.stats.expiresAt).getTime() 
              : (createdAtTime + 30 * 24 * 60 * 60 * 1000);
            
            // Valid if within 30 days (expiresAtTime > now) OR created within last 30 days
            const isExpired = now > expiresAtTime && (now - createdAtTime > 30 * 24 * 60 * 60 * 1000);
            if (isExpired) {
              setError('This Custom QR code has expired after its 30-day validity period.');
              return;
            }
          }

          setRecord(data);
          // Increment view counter on page open
          api.recordView(qrId).then(res => {
            if (isMounted) {
              setRecord(prev => prev ? { ...prev, stats: { ...prev.stats, views: res.views } } : null);
            }
          }).catch(console.error);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'QR Experience Not Found');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [qrId]);

  // Dynamic on-the-fly translation for missing languages or standard QR codes
  useEffect(() => {
    let isMounted = true;
    if (selectedLang === 'en' || !record) return;

    const hasAITranslation = record.content.enhanced?.translations?.[selectedLang];
    const hasDynamicTranslation = dynamicTranslations[selectedLang];

    if (!hasAITranslation && !hasDynamicTranslation && !isTranslating) {
      const translateAsync = async () => {
        setIsTranslating(true);
        try {
          const textsToTranslate = [];
          const enhanced = record.content.enhanced;
          
          if (enhanced) {
            textsToTranslate.push(enhanced.title || '');
            textsToTranslate.push(enhanced.headline || '');
            textsToTranslate.push(enhanced.formattedContent || '');
            if (enhanced.keyTakeaways) {
              textsToTranslate.push(...enhanced.keyTakeaways);
            }
          } else {
            textsToTranslate.push(record.title || '');
            textsToTranslate.push(record.content.raw || '');
          }

          const translated = await api.translateText(textsToTranslate, selectedLang);
          
          if (isMounted) {
            if (Array.isArray(translated) && translated.length > 0) {
              if (enhanced) {
                const translatedObj: any = {
                  title: translated[0] || enhanced.title,
                  headline: translated[1] || enhanced.headline,
                  formattedContent: translated[2] || enhanced.formattedContent
                };
                if (enhanced.keyTakeaways) {
                  translatedObj.keyTakeaways = translated.slice(3);
                }
                setDynamicTranslations(prev => ({ ...prev, [selectedLang]: translatedObj }));
              } else {
                setDynamicTranslations(prev => ({ 
                  ...prev, 
                  [selectedLang]: { 
                    title: translated[0] || record.title, 
                    formattedContent: translated[1] || translated[0] || record.content.raw 
                  } 
                }));
              }
            } else if (typeof translated === 'string') {
              setDynamicTranslations(prev => ({ 
                ...prev, 
                [selectedLang]: { 
                  title: record.title, 
                  formattedContent: translated 
                } 
              }));
            }
          }
        } catch (e) {
          console.error("Dynamic translation failed:", e);
        } finally {
          if (isMounted) setIsTranslating(false);
        }
      };
      translateAsync();
    }

    return () => { isMounted = false; };
  }, [selectedLang, record]);

  // Handle reaction emoji click
  const handleReaction = async (emoji: string) => {
    try {
      const res = await api.recordReaction(qrId, emoji);
      setRecord(prev => prev ? { ...prev, stats: { ...prev.stats, reactions: res.reactions } } : null);
    } catch (err) {
      console.error('Failed to register reaction:', err);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b11] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center animate-bounce shadow-xl shadow-brand-500/30">
            <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-300 tracking-wide">Loading Smart Reveal Card...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-[#080b11] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <QrCode className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">QR Experience Not Found</h2>
          <p className="text-xs text-slate-400">
            {error || 'This QR code may have expired after 30 days or the connection is still syncing.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              Refresh Scan
            </button>
            {onBackToStudio && (
              <button
                onClick={onBackToStudio}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all"
              >
                Create New QR
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const enhanced = record.content.enhanced;
  
  // Logic to pull localized content for UI
  const getLocalizedContent = () => {
    const dynamicTranslation = dynamicTranslations[selectedLang];

    if (!enhanced) {
       return {
         title: (selectedLang !== 'en' && dynamicTranslation && typeof dynamicTranslation === 'object') ? dynamicTranslation.title : record.title,
         headline: '',
         body: (selectedLang !== 'en' && dynamicTranslation) 
                ? (typeof dynamicTranslation === 'object' ? dynamicTranslation.formattedContent : dynamicTranslation)
                : record.content.raw,
         takeaways: []
       };
    }

    if (selectedLang !== 'en') {
       if (enhanced.translations?.[selectedLang]) {
         const translation = enhanced.translations[selectedLang];
         if (typeof translation === 'object') {
             return {
               title: translation.title || enhanced.title,
               headline: translation.headline || enhanced.headline,
               body: translation.formattedContent || enhanced.formattedContent,
               takeaways: enhanced.keyTakeaways
             };
         } else {
             return {
               title: enhanced.title,
               headline: enhanced.headline,
               body: translation as string,
               takeaways: enhanced.keyTakeaways
             };
         }
       } else if (dynamicTranslation) {
         if (typeof dynamicTranslation === 'object') {
           return {
             title: dynamicTranslation.title || enhanced.title,
             headline: dynamicTranslation.headline || enhanced.headline,
             body: dynamicTranslation.formattedContent || enhanced.formattedContent,
             takeaways: dynamicTranslation.keyTakeaways || enhanced.keyTakeaways
           };
         } else {
           return {
             title: enhanced.title,
             headline: enhanced.headline,
             body: dynamicTranslation as string,
             takeaways: enhanced.keyTakeaways
           };
         }
       }
    }

    // Default to English original
    return {
       title: enhanced.title,
       headline: enhanced.headline,
       body: enhanced.formattedContent,
       takeaways: enhanced.keyTakeaways
    };
  };

  const loc = getLocalizedContent();

  const palette = enhanced?.suggestedPalette || {
    primary: '#4f46e5',
    secondary: '#7c3aed',
    accent: '#38bdf8',
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)'
  };

  const pageBgColor = record.style?.pageBgColor || '#07090e';
  const pageTextColor = record.style?.pageTextColor || '#f1f5f9';

  return (
    <div 
      className="min-h-screen font-sans selection:bg-brand-500/30 pb-20 sm:pb-12"
      style={{ backgroundColor: pageBgColor, color: pageTextColor }}
    >
      {/* Background dynamic ambient glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] opacity-25 pointer-events-none"
        style={{ background: palette.primary }}
      />

      {/* Top Header Controls */}
      <header className="relative z-10 max-w-4xl w-full mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
        {onBackToStudio ? (
          <button
            onClick={onBackToStudio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-all backdrop-blur"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shadow">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-extrabold text-white tracking-wider uppercase">Custom QR</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-all shadow backdrop-blur"
          >
            <Share2 className="w-3.5 h-3.5 text-brand-400" />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* Main Reveal Card Container */}
      <main className="relative z-10 max-w-2xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 flex flex-col justify-center">
        <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl animate-fade-in relative overflow-hidden flex flex-col">
          
          {/* Smart Generated Cover Image */}
          {record.content.generatedImage && (
            <div className="w-full h-40 sm:h-64 relative border-b border-slate-800">
              <img 
                src={record.content.generatedImage} 
                alt="AI Generated Cover" 
                className="absolute inset-0 w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-transparent opacity-90" />
            </div>
          )}

          <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
            {/* Card Top Banner Badge */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 sm:pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2 max-w-full">
              {loc.headline && (
                <span className="text-xs text-slate-400 font-medium line-clamp-1">{loc.headline}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                {isTranslating && (
                  <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                )}
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value as 'en' | 'hi' | 'te')}
                  className="bg-slate-900 text-[11px] sm:text-xs text-brand-300 rounded-lg px-2 py-1 sm:py-1.5 border border-slate-700 outline-none font-bold shadow-sm transition-opacity"
                  style={{ opacity: isTranslating ? 0.5 : 1 }}
                  disabled={isTranslating}
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="hi">🇮🇳 Hindi (हिन्दी)</option>
                  <option value="te">🇮🇳 Telugu (తెలుగు)</option>
                </select>
              </div>

              <span className="text-[10px] sm:text-[11px] font-medium flex items-center gap-1" style={{ color: pageTextColor, opacity: 0.7 }}>
                <Calendar className="w-3 h-3" />
                {new Date(record.stats.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Title & Core Summary */}
          {loc.title && (
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2 sm:mb-4 leading-[1.2]" style={{ color: pageTextColor }}>
              {loc.title}
            </h1>
          )}

          <div className="text-sm sm:text-lg leading-relaxed mb-6 sm:mb-10 whitespace-pre-wrap font-medium" style={{ color: pageTextColor, opacity: 0.9 }}>
            {loc.body}
          </div>

          {/* Custom Audio Player Bar (only if user uploaded audio) */}
          {record.content.customAudio && (
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-200">Personal Voice Message</span>
              <audio src={record.content.customAudio} controls className="w-full h-10 outline-none" />
            </div>
          )}

          {/* Key Takeaways Section */}
          {loc.takeaways && loc.takeaways.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Key Highlights
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {loc.takeaways.map((takeaway: string, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{takeaway.replace(/^[^\w\s]+\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Primary Call to Action Button */}
          {enhanced?.suggestedCTA && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                <span>{enhanced.suggestedCTA}</span>
                <ExternalLink className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          )}

          {/* Interactive Live Reaction & View Bar */}
          <ReactionBar
            views={record.stats.views}
            reactions={record.stats.reactions}
            onReact={handleReaction}
          />
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 text-center py-5 text-xs text-slate-500 border-t border-slate-900">
        <p>Created with <strong>Custom QR</strong></p>
      </footer>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        record={{
          id: record.id,
          title: enhanced?.title || record.title,
          mode: record.mode,
          rawText: record.content.raw,
          enhancedPayload: enhanced?.plainTextPayload
        }}
      />
    </div>
  );
};
