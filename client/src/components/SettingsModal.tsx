import React, { useState } from 'react';
import { X, KeyRound, Sparkles, Check, ExternalLink, ShieldCheck, Globe } from 'lucide-react';
import { setCustomPublicHost } from '../utils/urlHelper';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  setApiKey
}) => {
  const [localKey, setLocalKey] = useState(apiKey);
  const [publicHost, setPublicHost] = useState(() => localStorage.getItem('custom_qr_public_host') || '');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(localKey);
    localStorage.setItem('Smart_api_key', localKey);
    setCustomPublicHost(publicHost);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 relative space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">System & Network Settings</h3>
            <p className="text-xs text-slate-400">Configure deployment host & generative features</p>
          </div>
        </div>

        {/* Public Host / Mobile Access URL */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <label className="text-xs font-bold text-slate-200">
              Mobile Scan & Public Domain Origin:
            </label>
          </div>
          <input
            type="text"
            value={publicHost}
            onChange={(e) => setPublicHost(e.target.value)}
            placeholder="http://10.52.7.203:3000 or https://yourdomain.com"
            className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-brand-500 text-xs font-mono text-white outline-none"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Current Origin: <code className="text-brand-300 font-mono">{typeof window !== 'undefined' ? window.location.origin : ''}</code></span>
            <button
              type="button"
              onClick={() => setPublicHost('http://10.52.7.203:3000')}
              className="text-cyan-400 hover:underline font-semibold text-[10px]"
            >
              Use Wi-Fi IP
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            When scanning with an external smartphone on the same network or after deploying to cloud/Vercel/Render, set the live URL here so QR codes encode your reachable address instead of localhost.
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">
            Google Smart API Key (Optional):
          </label>
          <input
            type="password"
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-xs font-mono-code text-white outline-none"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Keys are stored locally in your browser.</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Get Free Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              If left blank, the app uses an integrated smart local formatting engine to deliver instantaneous rich summaries & offline payloads.
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-brand-500/25"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            <span>{isSaved ? 'Saved!' : 'Save Key'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
