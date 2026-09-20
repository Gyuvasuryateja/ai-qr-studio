import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Twitter, Mail, ExternalLink, QrCode } from 'lucide-react';
import { copyToClipboard, getRevealUrl } from '../utils/urlHelper';
import { QRCodeRecord } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: {
    id: string;
    title: string;
    mode: string;
    rawText: string;
    enhancedPayload?: string;
  };
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  record
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const publicUrl = getRevealUrl(record.id);
  const textPayload = record.enhancedPayload || record.rawText || 'Check out this AI-generated announcement!';

  const handleCopyLink = () => {
    copyToClipboard(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyText = () => {
    copyToClipboard(textPayload);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Social share urls
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${record.title}\n\n${textPayload}\n\n👉 Open Custom QR Link: ${publicUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`✨ ${record.title} — created with Custom QR`)}&url=${encodeURIComponent(publicUrl)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(record.title)}&body=${encodeURIComponent(`${textPayload}\n\nView Custom QR here:\n${publicUrl}`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 relative space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Share & Export QR Experience</h3>
            <p className="text-xs text-slate-400">Share direct links, plain-text, or social blasts</p>
          </div>
        </div>

        {/* Public Reveal Link */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Public Interactive Destination Link:
          </label>
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-xs font-mono-code text-slate-300 truncate flex-1 pl-1">
              {publicUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-all shadow"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Raw Text Content */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Offline Text Content / Payload:
          </label>
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 max-h-28 overflow-y-auto text-xs text-slate-300 font-mono-code leading-relaxed mb-2">
            {textPayload}
          </div>
          <button
            onClick={handleCopyText}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedText ? 'Text Payload Copied!' : 'Copy Formatted Text Message'}</span>
          </button>
        </div>

        {/* 1-Click Social Sharing */}
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Direct 1-Click Social Share
          </span>
          <div className="grid grid-cols-3 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all hover:scale-105"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </a>

            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-sky-600/10 hover:bg-sky-600/20 border border-sky-500/30 text-sky-300 text-xs font-semibold transition-all hover:scale-105"
            >
              <Twitter className="w-4 h-4 text-sky-400" />
              <span>Twitter/X</span>
            </a>

            <a
              href={emailUrl}
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all hover:scale-105"
            >
              <Mail className="w-4 h-4 text-purple-400" />
              <span>Email</span>
            </a>
          </div>
        </div>

        {/* View Page button */}
        <div className="pt-2">
          <a
            href={`/reveal/${record.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Interactive Reveal Card in New Tab</span>
          </a>
        </div>
      </div>
    </div>
  );
};
