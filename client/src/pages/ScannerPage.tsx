import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import jsQR from 'jsqr';
import { Camera, Upload, ExternalLink, Copy, Check, QrCode, AlertCircle } from 'lucide-react';
import { copyToClipboard } from '../utils/urlHelper';

interface ScannerPageProps {
  onOpenQRId?: (id: string) => void;
}

export const ScannerPage: React.FC<ScannerPageProps> = ({ onOpenQRId }) => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('upload');
  const [copied, setCopied] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Initialize camera scanner when in camera mode
  useEffect(() => {
    if (scanMode === 'camera') {
      const scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true
        },
        false
      );

      scanner.render(
        (decodedText) => {
          setScanResult(decodedText);
          scanner.clear();
        },
        (error) => {
          // ignore scan frame errors
        }
      );

      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
      };
    }
  }, [scanMode]);

  // Decode QR from uploaded image file using jsQR canvas decoder
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setFileError('Canvas context unavailable');
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setScanResult(code.data);
        } else {
          setFileError('Could not decode a QR code in this image. Please ensure good lighting and contrast.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = () => {
    if (!scanResult) return;
    copyToClipboard(scanResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if result contains reveal id link
  const isRevealUrl = scanResult?.includes('/reveal/');
  const extractedId = isRevealUrl ? scanResult?.split('/reveal/')[1]?.split(/[?#]/)[0] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
          <QrCode className="w-3.5 h-3.5" />
          <span>Universal In-App Decoder</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">QR Code Scanner & Inspector</h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Scan QR codes with your webcam or upload image files to decode interactive destinations and plain-text payloads.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-sm mx-auto">
        <button
          onClick={() => {
            setScanResult(null);
            setScanMode('upload');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            scanMode === 'upload' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Image</span>
        </button>

        <button
          onClick={() => {
            setScanResult(null);
            setScanMode('camera');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            scanMode === 'camera' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Live Webcam</span>
        </button>
      </div>

      {/* Main Scanner Box */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl backdrop-blur-xl">
        {scanMode === 'camera' ? (
          <div className="space-y-4">
            <div id="reader" className="w-full max-w-md mx-auto overflow-hidden rounded-2xl bg-black" />
            <p className="text-center text-xs text-slate-400">Point your camera at a QR code to decode automatically</p>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-brand-500/80 rounded-2xl p-8 sm:p-12 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Click to browse or drop QR image here</h3>
            <p className="text-xs text-slate-400">Supports PNG, JPG, WEBP, SVG</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        )}

        {fileError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{fileError}</span>
          </div>
        )}
      </div>

      {/* Scan Results Card */}
      {scanResult && (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-brand-500/40 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Decoded QR Result</h3>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-h-48 overflow-y-auto">
            <pre className="text-xs text-slate-200 font-mono-code whitespace-pre-wrap break-all leading-relaxed">
              {scanResult}
            </pre>
          </div>

          {/* Action Trigger */}
          <div className="pt-2 flex gap-3">
            {extractedId ? (
              <a
                href={`/reveal/${extractedId}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Interactive Reveal Card</span>
              </a>
            ) : scanResult.startsWith('http') ? (
              <a
                href={scanResult}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Visit Link</span>
              </a>
            ) : null}

            <button
              onClick={() => {
                setScanResult(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Scan Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
