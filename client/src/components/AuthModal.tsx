import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { authService, User } from '../services/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot';
  onSuccess: (user: User) => void;
  actionReason?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  onSuccess,
  actionReason
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode when initialMode changes upon opening
  React.useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMessage(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const user = authService.signUp(name, email, password);
        onSuccess(user);
        onClose();
      } else if (mode === 'signin') {
        const user = authService.signIn(email, password);
        onSuccess(user);
        onClose();
      } else if (mode === 'forgot') {
        if (password !== confirmPassword) {
          throw new Error('New passwords do not match. Please recheck.');
        }
        authService.resetPassword(email, password);
        setSuccessMessage('Password reset successfully! You can now sign in.');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setMode('signin');
          setSuccessMessage(null);
        }, 1600);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-5 sm:p-7 relative space-y-5 sm:space-y-6 max-h-[92vh] overflow-y-auto my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              {mode === 'forgot' ? (
                <KeyRound className="w-4 h-4 text-brand-300" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-brand-300" />
              )}
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-brand-400 font-bold">
              {mode === 'signup' ? 'Create Account' : mode === 'signin' ? 'Account Access' : 'Password Reset'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {mode === 'signup' ? 'Sign Up for Custom QR' : mode === 'signin' ? 'Welcome Back' : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400">
            {actionReason || (mode === 'signup'
              ? 'Save your QR codes, unlock analytics and enjoy all features.'
              : mode === 'signin'
                ? 'Sign in to access your personal dashboard and saved QRs.'
                : 'Enter your registered email and choose a new password.')}
          </p>
        </div>

        {/* Mode Selector Tabs (hidden on forgot) */}
        {mode !== 'forgot' ? (
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'signin'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
              className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">Password Recovery</span>
          </div>
        )}

        {/* Action Reason Callout */}
        {actionReason && mode !== 'forgot' && (
          <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-brand-200 leading-relaxed">
              Your draft QR design and settings are safely preserved! Complete {mode === 'signup' ? 'sign up' : 'sign in'} to publish it now.
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Full Name</label>
              <div className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="bg-transparent text-sm text-white outline-none w-full placeholder-slate-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              {mode === 'forgot' ? 'Registered Account Email' : 'Email Address'}
            </label>
            <div className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all">
              <Mail className="w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="bg-transparent text-sm text-white outline-none w-full placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {mode === 'forgot' ? 'New Password' : 'Password'}
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all">
              <Lock className="w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'forgot' ? 'Enter new password' : '••••••••'}
                className="bg-transparent text-sm text-white outline-none w-full placeholder-slate-500"
              />
            </div>
          </div>

          {mode === 'forgot' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Confirm New Password</label>
              <div className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all">
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={4}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="bg-transparent text-sm text-white outline-none w-full placeholder-slate-500"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-all group"
          >
            <span>
              {mode === 'signup' 
                ? 'Create Account & Continue' 
                : mode === 'signin' 
                  ? 'Sign In & Continue' 
                  : 'Update Password & Return to Sign In'}
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Switch Between Modes */}
        {mode !== 'forgot' && (
          <div className="text-center pt-2 border-t border-slate-800/80">
            {mode === 'signup' ? (
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="font-bold text-brand-400 hover:text-brand-300 hover:underline transition-colors"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="font-bold text-brand-400 hover:text-brand-300 hover:underline transition-colors"
                >
                  Create Account
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
