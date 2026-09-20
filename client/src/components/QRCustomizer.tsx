import React, { useRef } from 'react';
import { Palette, Sparkles, Image as ImageIcon, Sliders, ShieldCheck, X } from 'lucide-react';
import { QRStyleConfig } from '../types';

interface QRCustomizerProps {
  styleConfig: QRStyleConfig;
  setStyleConfig: React.Dispatch<React.SetStateAction<QRStyleConfig>>;
}

const DOT_TYPES: { id: QRStyleConfig['dotType']; label: string }[] = [
  { id: 'rounded', label: 'Rounded' },
  { id: 'dots', label: 'Dots' },
  { id: 'classy', label: 'Classy' },
  { id: 'classy-rounded', label: 'Classy Round' },
  { id: 'square', label: 'Square' },
  { id: 'extra-rounded', label: 'Smooth Extra' },
];

const CORNER_SQUARE_TYPES: { id: QRStyleConfig['cornerSquareType']; label: string }[] = [
  { id: 'extra-rounded', label: 'Rounded' },
  { id: 'dot', label: 'Dot' },
  { id: 'square', label: 'Square' },
];

const CORNER_DOT_TYPES: { id: QRStyleConfig['cornerDotType']; label: string }[] = [
  { id: 'dot', label: 'Dot Circle' },
  { id: 'square', label: 'Square' },
];

const PRESET_LOGOS: { id: string; label: string; url: string }[] = [
  { id: 'Smart', label: 'Smart Engine', url: 'https://www.gstatic.com/lamda/images/Smart_sparkle_v002_d4735304ff6292a690345.svg' },
  { id: 'star', label: 'Star', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
  { id: 'bolt', label: 'Bolt', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
  { id: 'heart', label: 'Heart', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ec4899"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' },
  { id: 'gift', label: 'Gift', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310b981"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>' }
];

export const QRCustomizer: React.FC<QRCustomizerProps> = ({
  styleConfig,
  setStyleConfig,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof QRStyleConfig, value: any) => {
    setStyleConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          update('logoUrl', event.target.result as string);
          update('logoPreset', 'custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
          <Palette className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">QR Styling Studio</h2>
          <p className="text-xs text-slate-400">Customize gradients, shapes, eyes & branding</p>
        </div>
      </div>

      {/* Color Mode & Gradients */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-brand-400" />
            Coloring & Gradient Mode
          </label>
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            {(['single', 'linear', 'radial'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => update('colorType', mode)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                  styleConfig.colorType === mode
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {styleConfig.colorType === 'single' ? (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-slate-400 block mb-1">QR Foreground Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={styleConfig.singleColor}
                  onChange={(e) => update('singleColor', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={styleConfig.singleColor}
                  onChange={(e) => update('singleColor', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono-code text-slate-200"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Gradient Start Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={styleConfig.gradientColor1}
                  onChange={(e) => update('gradientColor1', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={styleConfig.gradientColor1}
                  onChange={(e) => update('gradientColor1', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono-code text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Gradient End Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={styleConfig.gradientColor2}
                  onChange={(e) => update('gradientColor2', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={styleConfig.gradientColor2}
                  onChange={(e) => update('gradientColor2', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono-code text-slate-200"
                />
              </div>
            </div>

            {styleConfig.colorType === 'linear' && (
              <div className="col-span-full">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Gradient Angle</span>
                  <span>{styleConfig.gradientRotation}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={styleConfig.gradientRotation}
                  onChange={(e) => update('gradientRotation', Number(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Background Color */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-medium">QR Canvas Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styleConfig.bgColor}
                onChange={(e) => update('bgColor', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono-code text-slate-400">{styleConfig.bgColor}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-medium">Reveal Page Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styleConfig.pageBgColor || '#07090e'}
                onChange={(e) => update('pageBgColor', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono-code text-slate-400">{styleConfig.pageBgColor || '#07090e'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-medium">Reveal Page Text</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styleConfig.pageTextColor || '#f1f5f9'}
                onChange={(e) => update('pageTextColor', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono-code text-slate-400">{styleConfig.pageTextColor || '#f1f5f9'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern & Dot Styles */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <label className="text-xs font-bold text-slate-300 block">
          QR Dot & Body Pattern
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {DOT_TYPES.map((dot) => (
            <button
              key={dot.id}
              type="button"
              onClick={() => update('dotType', dot.id)}
              className={`py-2 px-1 text-center rounded-lg border text-xs font-medium transition-all ${
                styleConfig.dotType === dot.id
                  ? 'bg-brand-600/30 border-brand-500 text-brand-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {dot.label}
            </button>
          ))}
        </div>
      </div>

      {/* Corner Eyes Markers */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <label className="text-xs font-bold text-slate-300 block">
          Corner Eye Markers
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Corner Square */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">Outer Corner Box Shape</span>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {CORNER_SQUARE_TYPES.map((sq) => (
                <button
                  key={sq.id}
                  type="button"
                  onClick={() => update('cornerSquareType', sq.id)}
                  className={`py-1 px-1.5 text-center rounded-md border text-xs transition-all ${
                    styleConfig.cornerSquareType === sq.id
                      ? 'bg-brand-600/30 border-brand-500 text-brand-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sq.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styleConfig.cornerSquareColor}
                onChange={(e) => update('cornerSquareColor', e.target.value)}
                className="w-7 h-7 rounded cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono-code text-slate-400">Color: {styleConfig.cornerSquareColor}</span>
            </div>
          </div>

          {/* Corner Dot */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">Inner Eye Dot Shape</span>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {CORNER_DOT_TYPES.map((dt) => (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => update('cornerDotType', dt.id)}
                  className={`py-1 px-1.5 text-center rounded-md border text-xs transition-all ${
                    styleConfig.cornerDotType === dt.id
                      ? 'bg-brand-600/30 border-brand-500 text-brand-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {dt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styleConfig.cornerDotColor}
                onChange={(e) => update('cornerDotColor', e.target.value)}
                className="w-7 h-7 rounded cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono-code text-slate-400">Color: {styleConfig.cornerDotColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Logo Embedding */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-brand-400" />
            Center Logo / Icon Embedding
          </label>
          {styleConfig.logoUrl && (
            <button
              onClick={() => {
                update('logoUrl', '');
                update('logoPreset', '');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Remove Logo
            </button>
          )}
        </div>

        {/* Preset Icons */}
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_LOGOS.map((logo) => (
            <button
              key={logo.id}
              type="button"
              onClick={() => {
                update('logoUrl', logo.url);
                update('logoPreset', logo.id);
                update('errorCorrectionLevel', 'H'); // Ensure high error correction for logos
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 transition-all ${
                styleConfig.logoPreset === logo.id
                  ? 'bg-brand-600/30 border-brand-500 text-white font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <img src={logo.url} alt={logo.label} className="w-4 h-4 object-contain" />
              <span>{logo.label}</span>
            </button>
          ))}

          {/* Upload Custom */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg border border-dashed border-slate-700 bg-slate-950/40 hover:bg-slate-800/60 text-xs text-brand-300 flex items-center gap-1.5 transition-all"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Upload Image...</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCustomLogoUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {styleConfig.logoUrl && (
          <div className="pt-2 flex items-center gap-2 text-xs text-amber-300/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>Error correction automatically elevated to <strong>High (H)</strong> to preserve scan reliability.</span>
          </div>
        )}
      </div>
    </div>
  );
};
