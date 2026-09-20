import React, { useState, useRef } from 'react';
import { Mic, Square, UploadCloud, X } from 'lucide-react';

import { QRCustomizer } from '../components/QRCustomizer';
import { QRPreview } from '../components/QRPreview';
import { TonePreset, QRMode, QRStyleConfig, AIEnhanceResponse, QRCodeRecord } from '../types';
import { api } from '../services/api';

interface StudioPageProps {
  qrId: string;
  setQrId: (id: string) => void;
  customTitle: string;
  setCustomTitle: (title: string) => void;
  rawText: string;
  setRawText: (text: string) => void;
  tone: TonePreset;
  setTone: (tone: TonePreset) => void;
  contentType: 'announcement' | 'promo' | 'event' | 'message' | 'general';
  setContentType: (type: 'announcement' | 'promo' | 'event' | 'message' | 'general') => void;
  mode: QRMode;
  setMode: (mode: QRMode) => void;
  customUrl: string;
  setCustomUrl: (url: string) => void;
  customAudio?: string;
  setCustomAudio: (audio: string | undefined) => void;
  generatedImage?: string;
  setGeneratedImage: (img: string | undefined) => void;
  enhancedResult: AIEnhanceResponse | null;
  setEnhancedResult: (res: AIEnhanceResponse | null) => void;
  styleConfig: QRStyleConfig;
  setStyleConfig: React.Dispatch<React.SetStateAction<QRStyleConfig>>;
  apiKey: string;
  isPublished: boolean;
  setIsPublished: (published: boolean) => void;
  currentUser: import('../services/auth').User | null;
  onRequireAuth: (reason: string, callback?: (user: import('../services/auth').User) => void) => void;
  onOpenShareModal: () => void;
  onSavedNotification: (savedRecord: QRCodeRecord) => void;
}

export const StudioPage: React.FC<StudioPageProps> = ({
  qrId,
  customTitle,
  setCustomTitle,
  rawText,
  setRawText,
  tone,
  setTone,
  contentType,
  setContentType,
  mode,
  setMode,
  customUrl,
  setCustomUrl,
  customAudio,
  setCustomAudio,
  generatedImage,
  setGeneratedImage,
  enhancedResult,
  setEnhancedResult,
  styleConfig,
  setStyleConfig,
  apiKey,
  isPublished,
  setIsPublished,
  currentUser,
  onRequireAuth,
  onOpenShareModal,
  onSavedNotification
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [studioTab, setStudioTab] = useState<'content' | 'styling'>('content');

  // Custom audio and recording states
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setCustomAudio(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone', err);
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAudio(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGeneratedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Smart Engine enhancement
  const handleEnhance = async () => {
    if (!rawText.trim()) return;
    try {
      setIsEnhancing(true);
      const res = await api.enhanceContent({
        rawContent: rawText,
        tone,
        contentType,
        apiKey: apiKey || undefined
      });
      setEnhancedResult(res);
    } catch (err: any) {
      console.error('Enhancement error:', err);
      alert('Could not enhance with Smart Engine: ' + err.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Apply suggested Smart palette
  const handleApplyPalette = (palette: AIEnhanceResponse['suggestedPalette']) => {
    setStyleConfig(prev => ({
      ...prev,
      colorType: 'linear',
      gradientColor1: palette.primary,
      gradientColor2: palette.secondary,
      cornerSquareColor: palette.primary,
      cornerDotColor: palette.accent
    }));
  };

  // Save QR to persistent storage
  const handleSaveToDashboard = async (overrideUser?: import('../services/auth').User) => {
    const activeUser = overrideUser || currentUser;

    // If user is not signed in / signed up, navigate to Auth page directly without error alert
    if (!activeUser) {
      onRequireAuth('Please sign up or sign in to save and publish your QR code.', (loggedInUser) => {
        handleSaveToDashboard(loggedInUser);
      });
      return;
    }

    try {
      setIsSaving(true);
      const title = customTitle || enhancedResult?.title || '';
      
      const record = await api.saveQRCode({
        id: qrId,
        userId: activeUser.id,
        userEmail: activeUser.email,
        title: title,
        mode: mode,
        content: {
          raw: rawText,
          enhanced: enhancedResult || undefined,
          customUrl: customUrl || undefined,
          customAudio: customAudio,
          generatedImage: generatedImage
        },
        style: styleConfig
      });

      setIsPublished(true);
      onSavedNotification(record);
    } catch (err: any) {
      console.error('Save QR error:', err);
      // If unauthorized, redirect to sign in/up instead of harsh alert
      if (err.message && (err.message.includes('Authentication required') || err.message.includes('401'))) {
        onRequireAuth('Please sign up or sign in to save and publish your QR code.', (loggedInUser) => {
          handleSaveToDashboard(loggedInUser);
        });
      } else {
        alert('Failed to save QR code: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Smart Content Generator & QR Customizer */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sub-tab navigation */}
          <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setStudioTab('content')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                studioTab === 'content'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              QR Content
            </button>
            <button
              onClick={() => setStudioTab('styling')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                studioTab === 'styling'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. QR Visual Styling
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl backdrop-blur-xl">
            {studioTab === 'content' ? (
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/80 shadow-2xl backdrop-blur-sm">
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-300 block mb-2">QR Title (Optional):</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => {
                      setCustomTitle(e.target.value);
                      setIsPublished(false);
                    }}
                    placeholder="Enter a title for your QR code..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm text-slate-200 placeholder-slate-500 outline-none"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Description / QR Data (URL or Text):</label>
                  <textarea
                    value={rawText}
                    onChange={(e) => {
                      setRawText(e.target.value);
                      setIsPublished(false);
                    }}
                    placeholder="Enter URL, event details, or any text for your QR Code..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm text-slate-200 placeholder-slate-500 outline-none resize-none"
                  />
                </div>

                {/* Custom Audio Upload/Record */}
                <div className="mt-6">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    Custom Voice Message (Optional)
                  </label>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    {customAudio ? (
                      <div className="flex items-center gap-3 w-full">
                        <audio src={customAudio} controls className="h-8 flex-1" />
                        <button 
                          onClick={() => setCustomAudio(undefined)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          title="Remove audio"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          {isRecording ? 'Stop Recording' : 'Record Voice'}
                        </button>
                        
                        <div className="relative flex-1">
                          <input 
                            type="file" 
                            accept="audio/*" 
                            onChange={handleFileUpload} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          />
                          <div className="py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all pointer-events-none">
                            <UploadCloud className="w-4 h-4" />
                            Upload Audio
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">If provided, this voice plays instead of Text-To-Speech.</p>
                </div>

                {/* Generated Image Preview & Gen Button */}
                <div className="mt-6">
                  {generatedImage ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Cover Image</span>
                        <button onClick={() => setGeneratedImage(undefined)} className="text-[10px] text-red-400 hover:text-red-300 font-bold">Remove Image</button>
                      </div>
                      <img src={generatedImage} alt="Cover" className="w-full h-32 object-cover rounded-lg border border-brand-500/30" />
                    </div>
                  ) : (
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                      <div className="w-full py-2.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2 bg-slate-800 border-slate-700/50 text-slate-300 hover:bg-slate-700 hover:border-slate-600 pointer-events-none">
                        <UploadCloud className="w-3 h-3" />
                        Upload Cover Image
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <QRCustomizer
                styleConfig={styleConfig}
                setStyleConfig={setStyleConfig}
              />
            )}
          </div>
        </div>

        {/* Right Column: Live QR Preview & Mode Controller */}
        <div className="lg:col-span-5">
          <QRPreview
            qrId={qrId}
            mode={mode}
            setMode={setMode}
            rawText={rawText}
            customUrl={customUrl}
            setCustomUrl={setCustomUrl}
            enhancedResult={enhancedResult}
            styleConfig={styleConfig}
            isPublished={isPublished}
            onOpenShareModal={onOpenShareModal}
            onSaveToDashboard={handleSaveToDashboard}
            isSaving={isSaving}
            currentUser={currentUser}
            onRequireAuth={() => {
              onRequireAuth('Please sign up or sign in to save and publish your QR code.', (loggedInUser) => {
                handleSaveToDashboard(loggedInUser);
              });
            }}
          />
        </div>

      </div>
    </div>
  );
};
