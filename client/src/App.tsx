import React, { useEffect, useState } from 'react';
import { ScanLine } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { StudioPage } from './pages/StudioPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScannerPage } from './pages/ScannerPage';
import { PublicQRViewer } from './pages/PublicQRViewer';
import { SettingsModal } from './components/SettingsModal';
import { ShareModal } from './components/ShareModal';
import { TonePreset, QRMode, QRStyleConfig, AIEnhanceResponse, QRCodeRecord } from './types';
import { api } from './services/api';
import { authService, User } from './services/auth';
import { AuthModal } from './components/AuthModal';
import { AuthPage } from './pages/AuthPage';

export const App: React.FC = () => {
  // Navigation & Routing state
  const [activeTab, setActiveTab] = useState<'studio' | 'dashboard' | 'scanner' | 'auth'>('studio');
  const [revealId, setRevealId] = useState<string | null>(null);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signup');
  const [authReason, setAuthReason] = useState<string | undefined>();
  const [postAuthAction, setPostAuthAction] = useState<((user: User) => void) | null>(null);

  // Settings & Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Studio Creation state
  const [qrId, setQrId] = useState<string>(() => Math.random().toString(36).substring(2, 10));
  const [customTitle, setCustomTitle] = useState<string>('');
  const [rawText, setRawText] = useState<string>(
    '🚀 Next-Gen Smart SDK v2.0 Global Launch! Experience 10x faster inference, multi-modal reasoning and seamless edge deployment. RSVP now for early developer preview access and a $5,000 hackathon ticket.'
  );
  const [tone, setTone] = useState<TonePreset>('Creative');
  const [contentType, setContentType] = useState<'announcement' | 'promo' | 'event' | 'message' | 'general'>('announcement');
  const [mode, setMode] = useState<QRMode>('url');
  const [customUrl, setCustomUrl] = useState<string>('https://google.com');
  const [customAudio, setCustomAudio] = useState<string | undefined>();
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();
  const [enhancedResult, setEnhancedResult] = useState<AIEnhanceResponse | null>(null);
  const [isPublished, setIsPublished] = useState<boolean>(false);

  const [styleConfig, setStyleConfig] = useState<QRStyleConfig>({
    dotType: 'rounded',
    colorType: 'linear',
    singleColor: '#6366f1',
    gradientColor1: '#6366f1',
    gradientColor2: '#a855f7',
    gradientRotation: 45,
    bgColor: '#ffffff',
    cornerSquareType: 'extra-rounded',
    cornerSquareColor: '#4f46e5',
    cornerDotType: 'dot',
    cornerDotColor: '#ec4899',
    margin: 10,
    errorCorrectionLevel: 'Q'
  });

  // URL Path router check for direct `/reveal/:id` navigation
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/reveal/')) {
      const id = path.replace('/reveal/', '').split('/')[0];
      if (id) {
        setRevealId(id);
      }
    }

    // Load saved API key
    const savedKey = localStorage.getItem('Smart_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSavedNotification = (record: QRCodeRecord) => {
    showToast(`Saved to Dashboard: ${record.title || 'Custom QR'}`);
  };

  const handleSelectFromDashboard = (record: QRCodeRecord) => {
    setQrId(record.id);
    setCustomTitle(record.title);
    setMode(record.mode);
    setRawText(record.content.raw);
    if (record.content.customUrl) setCustomUrl(record.content.customUrl);
    if (record.content.customAudio) setCustomAudio(record.content.customAudio); else setCustomAudio(undefined);
    if (record.content.generatedImage) setGeneratedImage(record.content.generatedImage); else setGeneratedImage(undefined);
    if (record.content.enhanced) setEnhancedResult(record.content.enhanced);
    if (record.style) setStyleConfig(record.style);
    setIsPublished(true);
    setActiveTab('studio');
    showToast(`Loaded QR: ${record.title}`);
  };

  const handleNewQR = () => {
    setQrId(Math.random().toString(36).substring(2, 10));
    setCustomTitle('');
    setRawText('');
    setCustomAudio(undefined);
    setGeneratedImage(undefined);
    setEnhancedResult(null);
    setIsPublished(false);
    setActiveTab('studio');
  };

  // If user opens a direct reveal destination link
  if (revealId) {
    return (
      <PublicQRViewer
        qrId={revealId}
        onBackToStudio={() => {
          window.history.pushState({}, '', '/');
          setRevealId(null);
        }}
      />
    );
  }

  const handleOpenAuth = (mode: 'signin' | 'signup' | 'forgot', reason?: string, callback?: (user: User) => void) => {
    setAuthMode(mode);
    setAuthReason(reason);
    if (callback) {
      setPostAuthAction(() => callback);
    } else {
      setPostAuthAction(null);
    }
    setActiveTab('auth');
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`Welcome, ${user.name}!`);
    setActiveTab('studio');
    if (postAuthAction) {
      postAuthAction(user);
      setPostAuthAction(null);
    }
  };

  const handleSignOut = () => {
    authService.signOut();
    setCurrentUser(null);
    showToast('Signed out successfully');
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col justify-between">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-500/90 text-white font-bold text-xs shadow-2xl backdrop-blur flex items-center gap-2 border border-emerald-400/50 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasApiKey={!!apiKey}
        currentUser={currentUser}
        onOpenAuth={(mode) => handleOpenAuth(mode)}
        onSignOut={handleSignOut}
      />

      {/* Main Pages Content */}
      <main className="flex-1">
        {activeTab === 'studio' && (
          <StudioPage
            qrId={qrId}
            setQrId={setQrId}
            customTitle={customTitle}
            setCustomTitle={setCustomTitle}
            rawText={rawText}
            setRawText={setRawText}
            tone={tone}
            setTone={setTone}
            contentType={contentType}
            setContentType={setContentType}
            mode={mode}
            setMode={setMode}
            customUrl={customUrl}
            setCustomUrl={setCustomUrl}
            customAudio={customAudio}
            setCustomAudio={setCustomAudio}
            generatedImage={generatedImage}
            setGeneratedImage={setGeneratedImage}
            enhancedResult={enhancedResult}
            setEnhancedResult={setEnhancedResult}
            styleConfig={styleConfig}
            setStyleConfig={setStyleConfig}
            apiKey={apiKey}
            isPublished={isPublished}
            setIsPublished={setIsPublished}
            currentUser={currentUser}
            onRequireAuth={(reason, callback) => handleOpenAuth('signup', reason, callback)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onSavedNotification={handleSavedNotification}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            onSelectQR={handleSelectFromDashboard}
            onNewQR={handleNewQR}
            currentUser={currentUser}
            onRequireAuth={(reason, callback) => handleOpenAuth('signin', reason, callback)}
          />
        )}

        {activeTab === 'scanner' && (
          currentUser ? (
            <ScannerPage />
          ) : (
            <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto border border-brand-500/20">
                <ScanLine className="w-7 h-7 text-cyber-neon" />
              </div>
              <h2 className="text-xl font-bold text-white">Sign Up to Access Scanner</h2>
              <p className="text-xs text-slate-400">
                The smart camera and image QR scanner is available exclusively for registered members. Create an account or sign in to start scanning.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => handleOpenAuth('signup', 'Sign up to unlock the QR scanner.')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-all"
                >
                  Create Account
                </button>
                <button
                  onClick={() => handleOpenAuth('signin', 'Sign in to access your scanner.')}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-all"
                >
                  Sign In
                </button>
              </div>
            </div>
          )
        )}

        {activeTab === 'auth' && (
          <AuthPage
            initialMode={authMode}
            actionReason={authReason}
            onSuccess={handleAuthSuccess}
            onCancel={() => setActiveTab('studio')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Custom QR & Interactive Reveal Experience • Built with React, Tailwind CSS, Express & Smart Processing</p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        actionReason={authReason}
        onSuccess={handleAuthSuccess}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        record={{
          id: qrId,
          title: enhancedResult?.title || (rawText.length > 20 ? rawText.slice(0, 20) + '...' : 'Custom QR Code'),
          mode: mode,
          rawText: rawText,
          enhancedPayload: enhancedResult?.plainTextPayload
        }}
      />
    </div>
  );
};
