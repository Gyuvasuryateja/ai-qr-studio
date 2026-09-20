import React, { useState } from 'react';
import { Lock, Mail, User as UserIcon, ArrowRight, Sparkles, AlertCircle, QrCode, CheckCircle2, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import { authService, User } from '../services/auth';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup' | 'forgot';
  actionReason?: string;
  onSuccess: (user: User) => void;
  onCancel?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'signup',
  actionReason,
  onSuccess,
  onCancel
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode if initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMessage(null);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const user = await authService.signUp(name, email, password);
        onSuccess(user);
      } else if (mode === 'signin') {
        const user = await authService.signIn(email, password);
        onSuccess(user);
      } else if (mode === 'forgot') {
        await authService.resetPassword(email);
        setSuccessMessage('Password reset email sent! Please check your inbox for instructions to reset your password.');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setMode('signin');
          setSuccessMessage(null);
        }, 2200);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyber-pink flex items-center justify-center mx-auto shadow-xl shadow-brand-500/25">
            {mode === 'forgot' ? (
              <KeyRound className="w-8 h-8 text-white" />
            ) : (
              <QrCode className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {mode === 'signup' 
              ? 'Create Your Account' 
              : mode === 'signin' 
                ? 'Welcome Back' 
                : 'Reset Your Password'}
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {actionReason 
              ? actionReason 
              : (mode === 'signup' 
                  ? 'Sign up to publish, save, and access your custom interactive QR codes.'
                  : mode === 'signin'
                    ? 'Sign in to access your dashboard and publish your custom QR codes.'
                    : 'Enter your registered email and choose a new password.')}
          </p>
        </div>

        {/* Action Callout if user came from Save & Publish */}
        {actionReason && mode !== 'forgot' && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-200 leading-relaxed">
              <p className="font-bold text-white">Your Custom QR Draft is Ready!</p>
              <p className="mt-0.5 text-emerald-300/90">
                Complete {mode === 'signup' ? 'sign up' : 'sign in'} to immediately publish your QR code and activate its live scan link.
              </p>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-5">
          {/* Mode Switcher Tabs */}
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
                    placeholder="Enter your name"
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
                  placeholder="name@example.com"
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
                  ? 'Sign Up & Continue to App' 
                  : mode === 'signin' 
                    ? 'Sign In & Continue to App' 
                    : 'Set New Password & Return to Sign In'}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Cancel / Return option */}
          {onCancel && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Back to Studio (keep working on draft)
              </button>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-3 pt-2 text-center text-[11px] text-slate-400">
          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span>Personal Dashboard</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <Sparkles className="w-4 h-4 text-amber-300 mx-auto mb-1" />
            <span>Live Scan & Reveal</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-brand-400 mx-auto mb-1" />
            <span>Smart Camera Scanner</span>
          </div>
        </div>

      </div>
    </div>
  );
};
