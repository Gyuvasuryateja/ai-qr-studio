import React from 'react';
import { Sparkles, QrCode, LayoutDashboard, ScanLine, User as UserIcon, LogOut, LogIn, UserPlus } from 'lucide-react';
import { User } from '../services/auth';

interface NavbarProps {
  activeTab: 'studio' | 'dashboard' | 'scanner' | 'auth';
  setActiveTab: (tab: 'studio' | 'dashboard' | 'scanner' | 'auth') => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
  currentUser: User | null;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  hasApiKey,
  currentUser,
  onOpenAuth,
  onSignOut
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0a0e17]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Logo */}
        <div 
          onClick={() => setActiveTab('studio')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group flex-shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyber-pink flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform flex-shrink-0">
            <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">Custom QR</span>
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30">STUDIO</span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 font-medium">Custom Voice & Photo Messages</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-0.5 sm:gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'studio'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            <span className="hidden xs:inline sm:inline">Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">My QRs</span>
          </button>

          {currentUser && (
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyber-neon" />
              <span className="hidden xs:inline sm:inline">Scanner</span>
            </button>
          )}
        </nav>

        {/* Auth / Account Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 border border-slate-800 py-1 px-2 sm:px-3 rounded-xl">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-xs border border-brand-500/30">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight max-w-[100px] truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 leading-tight max-w-[100px] truncate">{currentUser.email}</p>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                title="Sign Out"
                className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => onOpenAuth('signin')}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all hover:scale-105"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
