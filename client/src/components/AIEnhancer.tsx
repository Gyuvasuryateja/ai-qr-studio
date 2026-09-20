import React, { useState } from 'react';
import { api } from '../services/api';
import { Sparkles, Wand2, RefreshCw, Layers, Check, Copy, Mic, Square, UploadCloud, X, Play } from 'lucide-react';
import { TonePreset, AIEnhanceResponse } from '../types';
import { copyToClipboard } from '../utils/urlHelper';

interface AIEnhancerProps {
  rawText: string;
  setRawText: (text: string) => void;
  tone: TonePreset;
  setTone: (tone: TonePreset) => void;
  contentType: 'announcement' | 'promo' | 'event' | 'message' | 'general';
  setContentType: (type: 'announcement' | 'promo' | 'event' | 'message' | 'general') => void;
  onEnhance: () => Promise<void>;
  isLoading: boolean;
  enhancedResult: AIEnhanceResponse | null;
  onApplyPalette: (palette: AIEnhanceResponse['suggestedPalette']) => void;
  customAudio?: string;
  setCustomAudio: (audio: string | undefined) => void;
  generatedImage?: string;
  setGeneratedImage: (img: string | undefined) => void;
}

const TONES: { id: TonePreset; label: string; icon: string; desc: string }[] = [
  { id: 'Refined', label: 'Filtering & Refining', icon: '✨', desc: 'Clean, legible, and grammatically perfect' },
  { id: 'Interactive', label: 'Interactive Text', icon: '👋', desc: 'Engaging, prompting user action' },
  { id: 'Creative', label: 'Creative Text', icon: '🎨', desc: 'Vibrant, imaginative storytelling' },
];

const PRESETS: { title: string; type: 'announcement' | 'promo' | 'event' | 'message'; text: string }[] = [
  {
    title: '🏷️ Summer Flash Sale',
    type: 'promo',
    text: 'Summer Mega Flash Sale is now live! Get 50% discount on all pro courses and templates for the next 48 hours only. Use code SUMMER50 at checkout. Free shipping on orders over $50. Visit our store or scan now.'
  },
  {
    title: '🚀 Product Launch RSVP',
    type: 'event',
    text: 'Join us for the Next-Gen Smart SDK v2.0 Global Launch Event on September 15th at 6:00 PM PST. Live demo by founder, exclusive early developer API access tokens, and a $5,000 hackathon kickoff.'
  },
  {
    title: '📢 Team Office Relocation',
    type: 'announcement',
    text: 'We are moving to our brand new headquarters on 450 Innovation Blvd, Suite 800 starting October 1st. State-of-the-art labs, visitor parking passes, and hybrid check-in protocols.'
  },
  {
    title: '🎁 VIP Loyalty Gift Card',
    type: 'promo',
    text: 'Thank you for being a valued gold-tier partner! Enjoy a complimentary $50 dining voucher valid at all partner bistro locations until year end. Show this card at reception.'
  }
];

export const AIEnhancer: React.FC<AIEnhancerProps> = ({
  rawText,
  setRawText,
  tone,
  setTone,
  contentType,
  setContentType,
  onEnhance,
  isLoading,
  enhancedResult,
  onApplyPalette,
  customAudio,
  setCustomAudio,
  generatedImage,
  setGeneratedImage
}) => {
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  const handleCopyPayload = () => {
    if (!enhancedResult) return;
    copyToClipboard(enhancedResult.plainTextPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setCustomAudio(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone', err);
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAudio(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGeneratedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Smart Content Customizer</h2>
            <p className="text-xs text-slate-400">Transform raw messages with Smart Processing</p>
          </div>
        </div>
      </div>

      {/* Quick Preset Prompts */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
          Quick Templates
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setRawText(p.text);
                setContentType(p.type);
              }}
              className="text-left px-2.5 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-xs text-slate-300 font-medium truncate"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Raw Input Textarea */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Your Announcement or Raw Message:
          </label>
          <span className="text-[11px] text-slate-500">{rawText.length} characters</span>
        </div>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste your event details, promo discount, office notice, or personal message here..."
          rows={4}
          className="w-full px-3.5 py-3 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm text-slate-200 placeholder-slate-500 outline-none resize-none transition-all"
        />
      </div>

      {/* Tone Presets */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
          Select Tone Preset
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {TONES.map((t) => {
            const isSelected = tone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-brand-600/20 border-brand-500 shadow-sm shadow-brand-500/20'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-base">{t.icon}</span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-200">{t.label}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Audio Upload/Record */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
          Custom Voice Message (Optional)
        </label>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          {customAudio ? (
            <div className="flex items-center gap-3 w-full">
              <audio src={customAudio} controls className="h-8 flex-1" />
              <button 
                onClick={() => setCustomAudio(undefined)}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                title="Remove audio"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isRecording ? 'Stop Recording' : 'Record Voice'}
              </button>
              
              <div className="relative flex-1">
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                <div className="py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all pointer-events-none">
                  <UploadCloud className="w-4 h-4" />
                  Upload Audio
                </div>
              </div>
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-500 mt-1">If provided, this voice plays instead of Text-To-Speech.</p>
      </div>

      {/* Enhance Button */}
      <button
        type="button"
        onClick={onEnhance}
        disabled={isLoading || !rawText.trim()}
        className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
          isLoading || !rawText.trim()
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-[1.01]'
        }`}
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
            <span>Smart Engine is crafting your experience...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 text-amber-300" />
            <span>Generate Smart Content & Theme</span>
          </>
        )}
      </button>

      {/* Smart Enhanced Output Preview Card */}
      {enhancedResult && (
        <div className="mt-2 p-4 rounded-xl bg-slate-900/90 border border-brand-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Smart Enhanced
              </span>
              <span className="text-xs text-slate-400 font-medium">{enhancedResult.headline}</span>
            </div>
            <button
              onClick={() => onApplyPalette(enhancedResult.suggestedPalette)}
              className="flex items-center gap-1 text-xs text-brand-300 hover:text-brand-200 font-semibold px-2 py-1 rounded-md bg-brand-500/10 hover:bg-brand-500/20 transition-colors"
              title="Apply Smart Suggested Colors to QR Code"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Apply Smart Colors</span>
            </button>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white">{enhancedResult.title}</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{enhancedResult.summary}</p>
          </div>

          {/* Key Takeaways */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Key Takeaways:
            </span>
            <ul className="space-y-1.5">
              {enhancedResult.keyTakeaways.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-200 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-start gap-1.5">
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Offline Plain-Text Snippet Copy */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Offline Plain-Text Payload:</span>
            <button
              onClick={handleCopyPayload}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedPayload ? 'Copied' : 'Copy Text Payload'}</span>
            </button>
          </div>
          
          {/* Translation Previews */}
          {enhancedResult.translations && (
            <div className="pt-2 border-t border-slate-800/80">
               <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider block mb-1.5">
                Translations Generated:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50 text-xs">
                  <span className="text-slate-400 font-bold">Hindi:</span>
                  <span className="text-brand-300 ml-2 line-clamp-1">
                    {typeof enhancedResult.translations.hi === 'object' ? enhancedResult.translations.hi.title : enhancedResult.translations.hi}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50 text-xs">
                  <span className="text-slate-400 font-bold">Telugu:</span>
                  <span className="text-brand-300 ml-2 line-clamp-1">
                    {typeof enhancedResult.translations.te === 'object' ? enhancedResult.translations.te.title : enhancedResult.translations.te}
                  </span>
                </div>
              </div>
            </div>
          )}
          
            {/* Generated Image Preview & Gen Button */}
          <div className="pt-2 border-t border-slate-800/80">
            {generatedImage ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Cover Image</span>
                  <button onClick={() => setGeneratedImage(undefined)} className="text-[10px] text-red-400 hover:text-red-300 font-bold">Remove Image</button>
                </div>
                <img src={generatedImage} alt="Cover" className="w-full h-32 object-cover rounded-lg border border-brand-500/30" />
              </div>
            ) : (
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                <div className="w-full py-2.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2 bg-brand-600/20 border-brand-500/50 text-brand-300 hover:bg-brand-600/30 hover:border-brand-500 pointer-events-none">
                  <UploadCloud className="w-3 h-3" />
                  Upload Cover Image
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
