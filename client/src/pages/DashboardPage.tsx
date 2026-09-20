import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  Eye, 
  Sparkles, 
  QrCode, 
  Download, 
  Globe, 
  FileText, 
  PlusCircle,
  TrendingUp,
  Flame,
  Filter
} from 'lucide-react';
import { QRCodeRecord } from '../types';
import { api } from '../services/api';
import { getRevealUrl, copyToClipboard } from '../utils/urlHelper';

interface DashboardPageProps {
  onSelectQR: (qr: QRCodeRecord) => void;
  onNewQR: () => void;
  currentUser: import('../services/auth').User | null;
  onRequireAuth: (reason: string, callback?: () => void) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectQR, onNewQR, currentUser, onRequireAuth }) => {
  const [qrs, setQrs] = useState<QRCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'url' | 'text'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchQRs = async () => {
    try {
      setLoading(true);
      // Fetch user's QR codes if logged in
      const data = await api.getQRCodes(currentUser?.id);
      setQrs(data);
    } catch (err) {
      console.error('Failed to load QR list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRs();
  }, [currentUser]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this QR code?')) {
      const success = await api.deleteQRCode(id);
      if (success) {
        setQrs(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  const handleCopyLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(getRevealUrl(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredQRs = qrs.filter(qr => {
    const matchesSearch = qr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qr.content.raw.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || qr.mode === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const totalViews = qrs.reduce((acc, curr) => acc + (curr.stats?.views || 0), 0);
  const totalReactions = qrs.reduce((acc, curr) => {
    const reactions = curr.stats?.reactions || {};
    return acc + Object.values(reactions).reduce((a, b) => a + b, 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentUser ? `${currentUser.name}'s Dashboard` : 'QR Management Dashboard'}
            </h1>
            {currentUser && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                Personal Workspace
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            {currentUser 
              ? `Managing ${qrs.length} QR code${qrs.length === 1 ? '' : 's'} linked to ${currentUser.email}`
              : 'Monitor engagement, views, scans, and export QR codes'}
          </p>
        </div>

        <button
          onClick={onNewQR}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Custom QR</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">Total Active QRs</span>
            <span className="text-2xl font-black text-white">{qrs.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
            <QrCode className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">Total Scans & Views</span>
            <span className="text-2xl font-black text-emerald-400">{totalViews}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">Audience Reactions</span>
            <span className="text-2xl font-black text-amber-400">{totalReactions}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, keywords or content..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-brand-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          {(['all', 'url', 'text'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setSelectedFilter(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                selectedFilter === mode
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode === 'all' ? 'All Types' : mode === 'url' ? 'Reveal Cards' : 'Plain Text'}
            </button>
          ))}
        </div>
      </div>

      {/* QR Code Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-medium">
          Loading your QR collection...
        </div>
      ) : filteredQRs.length === 0 ? (
        <div className="py-16 text-center p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No QR codes found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {!currentUser 
              ? 'Sign in or create an account to view and synchronize all your published QR codes across devices.'
              : (searchQuery ? 'Try adjusting your search query.' : 'Create your first interactive QR code in the Studio to begin.')}
          </p>
          {!currentUser ? (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => onRequireAuth('Sign in to view your saved QR codes.')}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/25"
              >
                Sign In / Sign Up
              </button>
            </div>
          ) : (
            <button
              onClick={onNewQR}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all"
            >
              Open Studio
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQRs.map((qr) => {
            const reactionCount = Object.values(qr.stats.reactions || {}).reduce((a, b) => a + b, 0);

            return (
              <div
                key={qr.id}
                onClick={() => onSelectQR(qr)}
                className="group p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-brand-500/50 shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4 relative"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      qr.mode === 'url'
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {qr.mode === 'url' ? <Globe className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                      <span>{qr.mode === 'url' ? 'Reveal Page' : 'Offline Text'}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const createdAt = new Date(qr.stats.createdAt).getTime();
                        const expiresAt = qr.stats.expiresAt ? new Date(qr.stats.expiresAt).getTime() : createdAt + 30 * 24 * 60 * 60 * 1000;
                        const daysLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)));
                        const isExpired = Date.now() > expiresAt;
                        return (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isExpired
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : daysLeft <= 5
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {isExpired ? 'Expired' : `${daysLeft}d validity`}
                          </span>
                        );
                      })()}
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono-code">
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>{qr.stats.views}</span>
                      </div>
                    </div>
                  </div>

                  {qr.title && (
                    <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                      {qr.title}
                    </h3>
                  )}
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {qr.content.enhanced?.summary || qr.content.raw}
                  </p>
                </div>

                {/* Bottom Row Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400">
                    <Flame className="w-3.5 h-3.5" />
                    <span className="font-semibold">{reactionCount} reactions</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(qr.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Copy Public Link"
                    >
                      {copiedId === qr.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <a
                      href={`/reveal/${qr.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-slate-800 transition-colors"
                      title="Open Reveal Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(qr.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete QR"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
