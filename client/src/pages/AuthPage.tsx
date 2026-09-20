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

          {/* Form Content */}
          <div className="space-y-4">
            {mode === 'signin' ? (
              /* Direct One-Click Google Sign In */
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    setIsSubmitting(true);
                    try {
                      const user = await authService.continueWithGoogle();
                      onSuccess(user);
                    } catch (err: any) {
                      setError(err.message || 'Google sign in failed');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.01]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Gmail</span>
                </button>

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-slate-800 w-full" />
                  <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold absolute">
                    or email & password
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Email</label>
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">Password</label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[10px] text-brand-400 hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all mt-2"
                  >
                    Sign In with Password
                  </button>
                </form>
              </div>
            ) : mode === 'signup' ? (
              /* Sign Up: Asks for Name & Password, then Continue with Gmail */
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Your Name <span className="text-rose-400">*</span>
                    </label>
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

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Account Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Choose a password (min 6 characters)"
                        className="bg-transparent text-sm text-white outline-none w-full placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Sign Up with Google */}
                <button
                  type="button"
                  onClick={async () => {
                    if (!name.trim()) {
                      setError('Please enter your name first.');
                      return;
                    }
                    if (!password || password.length < 6) {
                      setError('Please set a password with at least 6 characters.');
                      return;
                    }
                    setError(null);
                    setIsSubmitting(true);
                    try {
                      const user = await authService.continueWithGoogle(name, password);
                      onSuccess(user);
                    } catch (err: any) {
                      setError(err.message || 'Google signup failed');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.01]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Gmail</span>
                </button>

                <p className="text-[11px] text-slate-400 text-center">
                  Enter your Name & Password above, then click <strong>Continue with Gmail</strong> to link your Google account.
                </p>
              </div>
            ) : (
              /* Forgot Password */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Registered Gmail</label>
                  <div className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@gmail.com"
                      className="bg-transparent text-sm text-white outline-none w-full placeholder-slate-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-all shadow-lg"
                >
                  Send Password Reset Link
                </button>
              </form>
            )}
          </div>

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
