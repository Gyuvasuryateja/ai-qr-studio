import React, { useState } from 'react';
import { Eye, Flame, Heart, Rocket, PartyPopper, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReactionBarProps {
  views: number;
  reactions: Record<string, number>;
  onReact: (emoji: string) => void;
  interactive?: boolean;
}

const EMOJI_BUTTONS = [
  { emoji: '🔥', label: 'Fire', color: 'hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-400' },
  { emoji: '❤️', label: 'Love', color: 'hover:border-rose-500/50 hover:bg-rose-500/10 text-rose-400' },
  { emoji: '🚀', label: 'Rocket', color: 'hover:border-indigo-500/50 hover:bg-indigo-500/10 text-indigo-400' },
  { emoji: '🎉', label: 'Party', color: 'hover:border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-400' },
  { emoji: '💡', label: 'Insight', color: 'hover:border-teal-500/50 hover:bg-teal-500/10 text-teal-400' },
];

export const ReactionBar: React.FC<ReactionBarProps> = ({
  views,
  reactions = {},
  onReact,
  interactive = true
}) => {
  const [clickedEmojis, setClickedEmojis] = useState<Set<string>>(new Set());

  const handleEmojiClick = (emoji: string, e: React.MouseEvent) => {
    if (!interactive) return;

    // Trigger celebratory confetti burst around mouse position
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 30,
      spread: 60,
      origin: { x, y },
      colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
    });

    setClickedEmojis(prev => new Set(prev).add(emoji));
    onReact(emoji);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
      {/* Live View Counter */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs font-semibold text-slate-300">
        <Eye className="w-4 h-4 text-brand-400 animate-pulse" />
        <span>{views} {views === 1 ? 'Scan / View' : 'Scans / Views'}</span>
      </div>

      {/* Emoji Reactions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {EMOJI_BUTTONS.map((item) => {
          const count = reactions[item.emoji] || 0;
          const hasClicked = clickedEmojis.has(item.emoji);

          return (
            <button
              key={item.emoji}
              type="button"
              onClick={(e) => handleEmojiClick(item.emoji, e)}
              disabled={!interactive}
              className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all transform active:scale-95 ${
                hasClicked
                  ? 'bg-brand-500/20 border-brand-500/60 shadow-md shadow-brand-500/20'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              } ${item.color}`}
            >
              <span className="text-base group-hover:scale-125 transition-transform">{item.emoji}</span>
              <span className="text-[11px] font-mono-code">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
