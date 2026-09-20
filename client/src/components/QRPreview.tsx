import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { Download, Share2, Globe, FileText, ExternalLink, Sparkles, Check, Link2, Lock } from 'lucide-react';
import { QRMode, QRStyleConfig, AIEnhanceResponse } from '../types';
import { getRevealUrl, copyToClipboard } from '../utils/urlHelper';

interface QRPreviewProps {
  qrId: string;
  mode: QRMode;
  setMode: (mode: QRMode) => void;
  rawText: string;
  customUrl: string;
  setCustomUrl: (url: string) => void;
  enhancedResult: AIEnhanceResponse | null;
  styleConfig: QRStyleConfig;
  isPublished: boolean;
  onOpenShareModal: () => void;
  onSaveToDashboard: () => void;
  isSaving: boolean;
  currentUser?: import('../services/auth').User | null;
  onRequireAuth?: () => void;
}

export const QRPreview: React.FC<QRPreviewProps> = ({
  qrId,
  mode,
  setMode,
  rawText,
  customUrl,
  setCustomUrl,
  enhancedResult,
  styleConfig,
  isPublished,
  onOpenShareModal,
  onSaveToDashboard,
  isSaving,
  currentUser,
  onRequireAuth
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<QRCodeStyling | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'svg'>('png');
  const [copiedLink, setCopiedLink] = useState(false);

  // Compute what payload gets encoded in the QR
  const computePayload = (): string => {
    if (mode === 'text') {
      return enhancedResult ? enhancedResult.plainTextPayload : rawText || 'Custom QR';
    }
    if (mode === 'custom_url') {
      return customUrl || 'https://google.com';
    }
    // Default: Web destination URL mode
    return getRevealUrl(qrId);
  };

  const payload = computePayload();

  // Instantiate & update QRCodeStyling with responsive dimensions
  useEffect(() => {
    const isGradient = styleConfig.colorType !== 'single';
    // Dynamically size the QR based on viewport (smaller on mobile to prevent overflow)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const qrSize = isMobile ? Math.min(230, window.innerWidth - 80) : 280;

    const qrOptions: any = {
      width: qrSize,
      height: qrSize,
      type: 'svg',
      data: payload,
      margin: Math.min(styleConfig.margin, isMobile ? 8 : 15),
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: styleConfig.errorCorrectionLevel
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: styleConfig.logoSize || 0.4,
        margin: styleConfig.logoMargin || 4,
        crossOrigin: 'anonymous',
      },
      dotsOptions: {
        type: styleConfig.dotType,
        color: isGradient ? undefined : styleConfig.singleColor,
        gradient: isGradient ? {
          type: styleConfig.colorType,
          rotation: (styleConfig.gradientRotation * Math.PI) / 180,
          colorStops: [
            { offset: 0, color: styleConfig.gradientColor1 },
            { offset: 1, color: styleConfig.gradientColor2 }
          ]
        } : undefined
      },
      backgroundOptions: {
        color: styleConfig.bgColor,
      },
      cornersSquareOptions: {
        type: styleConfig.cornerSquareType,
        color: styleConfig.cornerSquareColor
      },
      cornersDotOptions: {
        type: styleConfig.cornerDotType,
        color: styleConfig.cornerDotColor
      }
    };

    if (styleConfig.logoUrl) {
      qrOptions.image = styleConfig.logoUrl;
    }

    if (!qrCodeInstance.current) {
      qrCodeInstance.current = new QRCodeStyling(qrOptions);
      if (qrRef.current) {
        qrRef.current.innerHTML = '';
        qrCodeInstance.current.append(qrRef.current);
      }
    } else {
      qrCodeInstance.current.update(qrOptions);
    }
  }, [payload, styleConfig]);

  const handleDownload = async (ext: 'png' | 'svg') => {
    if (qrCodeInstance.current) {
      await qrCodeInstance.current.download({
        name: `AI-QR-${qrId}`,
        extension: ext
      });
    }
  };

  const handleCopyLink = async () => {
    if (!isPublished) {
      if (!currentUser && onRequireAuth) {
        onRequireAuth();
        return;
      }
      await onSaveToDashboard();
      return;
    }
    const link = mode === 'url' ? getRevealUrl(qrId) : payload;
    copyToClipboard(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-5 w-full lg:sticky lg:top-24">

      {/* QR Canvas Display Wrapper */}
      <div className="w-full max-w-[340px] sm:max-w-none relative p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-slate-800/80 to-slate-950/90 border border-slate-700/60 shadow-2xl flex flex-col items-center justify-center group mx-auto">
        <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] sm:text-[11px] font-semibold flex items-center gap-1.5 shadow-md">
          {isPublished ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400">Ready to Scan • Published</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-300">Draft Preview • Not Published</span>
            </>
          )}
        </div>

        {/* QR Code Container with Draft Lock Overlay */}
        <div className="relative mt-1 flex items-center justify-center">
          <div
            ref={qrRef}
            className={`rounded-2xl overflow-hidden shadow-inner p-1.5 sm:p-2 bg-white transition-all duration-300 max-w-full flex items-center justify-center ${
              isPublished 
                ? 'group-hover:scale-[1.02] ring-2 ring-emerald-500/40' 
                : 'opacity-25 blur-[2.5px] scale-[0.98] select-none pointer-events-none'
            }`}
          />
          {!isPublished && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-4 text-center rounded-2xl bg-slate-950/75 backdrop-blur-[2px] border border-amber-500/20">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-1.5 shadow-lg shadow-amber-500/20 border border-amber-500/30">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className="text-xs font-bold text-white tracking-wide">Publish Required</p>
              <p className="text-[10px] text-slate-300 mt-0.5 max-w-[170px] leading-tight">
                Scan & link activate once published to your workspace.
              </p>
            </div>
          )}
        </div>

        {!isPublished && (
          <div className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
            <p className="text-[11px] text-amber-300 font-medium">
              Click <span className="font-bold underline">"Save & Publish to Dashboard"</span> below to unlock scanning & active link.
            </p>
          </div>
        )}

        {/* Encoded Payload Description */}
        <div className="mt-3 text-center max-w-[260px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block">
            🔗 Custom QR Destination Link
          </span>
          <p className="text-[11px] text-slate-400 font-mono-code truncate mt-0.5" title={isPublished ? payload : 'Requires publishing'}>
            {isPublished ? payload : '•••••••••••••••• (Publish to activate)'}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-[10px] font-bold text-indigo-300">
            <span>⏱️ Active & Valid for 30 Days (1 Month)</span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="w-full space-y-2.5 max-w-[340px] sm:max-w-none">
        {/* Save to Dashboard Button - Primary call to action */}
        <button
          type="button"
          onClick={() => {
            if (!currentUser && onRequireAuth) {
              onRequireAuth();
              return;
            }
            onSaveToDashboard();
          }}
          disabled={isSaving}
          className={`w-full py-3 sm:py-3.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
            isPublished
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/50 hover:scale-[1.01]'
          }`}
        >
          {isSaving ? (
            <span>Saving & Publishing QR...</span>
          ) : isPublished ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="truncate">Published (Click to Re-save)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse flex-shrink-0" />
              <span>Save & Publish to Dashboard</span>
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={!isPublished}
            title={isPublished ? 'Copy public scan link' : 'Publish first to copy link'}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all border ${
              isPublished
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
                : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
            }`}
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-brand-400" />}
            <span className="truncate">{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenShareModal}
            disabled={!isPublished}
            title={isPublished ? 'Open share options' : 'Publish first to share'}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all border ${
              isPublished
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
                : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
            }`}
          >
            <Share2 className={`w-4 h-4 ${isPublished ? 'text-cyber-neon' : 'text-slate-600'}`} />
            <span>Share</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDownload(downloadFormat)}
            disabled={!isPublished}
            title={isPublished ? 'Download QR code image' : 'Publish first to download active QR'}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all shadow-md ${
              isPublished
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
            }`}
          >
            <Download className={`w-4 h-4 ${isPublished ? 'text-emerald-400' : 'text-slate-600'}`} />
            <span>Download {downloadFormat.toUpperCase()}</span>
          </button>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setDownloadFormat('png')}
              className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                downloadFormat === 'png' ? 'bg-brand-600 text-white' : 'text-slate-400'
              }`}
            >
              PNG
            </button>
            <button
              onClick={() => setDownloadFormat('svg')}
              className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                downloadFormat === 'svg' ? 'bg-brand-600 text-white' : 'text-slate-400'
              }`}
            >
              SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
