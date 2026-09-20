// SpeechSynthesis Text-To-Speech helper

import { api } from '../services/api';

class TextToSpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  
  // Cloud TTS State
  private cloudAudioElement: HTMLAudioElement | null = null;
  private cloudPlaylist: string[] = [];
  private isUsingCloud: boolean = false;

  private isSpeakingState: boolean = false;
  private isPausedState: boolean = false;
  private listeners: Set<(speaking: boolean, paused: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  subscribe(listener: (speaking: boolean, paused: boolean) => void) {
    this.listeners.add(listener);
    listener(this.isSpeakingState, this.isPausedState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.isSpeakingState, this.isPausedState));
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.synth ? this.synth.getVoices() : [];
  }

  speak(text: string, rate: number = 1.0, voiceURI?: string, lang?: string) {
    if (!this.synth) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    
    if (lang) {
      utterance.lang = lang;
    }

    const voices = this.synth.getVoices();
    let selectedVoice;
    
    if (voiceURI) {
      selectedVoice = voices.find(v => v.voiceURI === voiceURI);
    }
    
    if (!selectedVoice) {
      // If no voice was explicitly found by URI, try to find one matching the requested language
      if (lang) {
        selectedVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
      }
      
      // If still no voice, and language is English (or not specified), pick the best English voice
      if (!selectedVoice && (!lang || lang.startsWith('en'))) {
        selectedVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')) && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en'));
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      if (!lang || selectedVoice.lang.startsWith(lang.split('-')[0])) {
        utterance.lang = selectedVoice.lang;
      }
    } else if (lang && !lang.startsWith('en')) {
      // CLOUD TTS FALLBACK for devices missing the native voice (mobile phones)
      this.isUsingCloud = true;
      this.playCloudTTS(text, lang.split('-')[0]);
      return;
    }

    this.isUsingCloud = false;
    utterance.onstart = () => {
      this.isSpeakingState = true;
      this.isPausedState = false;
      this.notify();
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      this.isPausedState = false;
      this.notify();
    };

    utterance.onerror = () => {
      this.isSpeakingState = false;
      this.isPausedState = false;
      this.notify();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  pause() {
    if (this.isSpeakingState && !this.isPausedState) {
      if (this.isUsingCloud && this.cloudAudioElement) {
        this.cloudAudioElement.pause();
      } else if (this.synth) {
        this.synth.pause();
      }
      this.isPausedState = true;
      this.notify();
    }
  }

  resume() {
    if (this.isPausedState) {
      if (this.isUsingCloud && this.cloudAudioElement) {
        this.cloudAudioElement.play().catch(console.error);
      } else if (this.synth) {
        this.synth.resume();
      }
      this.isPausedState = false;
      this.notify();
    }
  }

  stop() {
    if (this.isUsingCloud) {
      this.cloudPlaylist = [];
      if (this.cloudAudioElement) {
        this.cloudAudioElement.pause();
        this.cloudAudioElement.src = '';
        this.cloudAudioElement = null;
      }
      this.isSpeakingState = false;
      this.isPausedState = false;
      this.isUsingCloud = false;
      this.notify();
    } else if (this.synth) {
      this.synth.cancel();
      this.isSpeakingState = false;
      this.isPausedState = false;
      this.notify();
    }
  }

  // --- Server Proxy TTS Helper Methods ---
  private async playCloudTTS(text: string, langPrefix: string) {
    this.cloudPlaylist = [];
    
    this.isSpeakingState = true;
    this.isPausedState = false;
    this.notify();

    try {
      const chunks = await api.generateTTS(text, langPrefix);
      if (chunks && chunks.length > 0) {
        this.cloudPlaylist = chunks;
        this.playNextCloudChunk(langPrefix);
      } else {
        this.stop();
      }
    } catch (err) {
      console.error("Server TTS error:", err);
      this.stop();
    }
  }

  private playNextCloudChunk(langPrefix: string) {
    if (this.cloudPlaylist.length === 0) {
      this.isSpeakingState = false;
      this.isPausedState = false;
      this.notify();
      return;
    }

    const chunkDataUri = this.cloudPlaylist.shift();
    if (!chunkDataUri) {
      this.playNextCloudChunk(langPrefix);
      return;
    }

    this.cloudAudioElement = new Audio(chunkDataUri);
    
    this.cloudAudioElement.onended = () => {
      this.playNextCloudChunk(langPrefix);
    };
    
    this.cloudAudioElement.onerror = () => {
      console.error("Server TTS failed to play audio chunk");
      this.playNextCloudChunk(langPrefix);
    };

    this.cloudAudioElement.play().catch(err => {
      console.error("Server TTS play error:", err);
      // Auto-continue to next chunk on auto-play policy blocks, or stop
      this.playNextCloudChunk(langPrefix);
    });
  }

  isSupported(): boolean {
    return !!this.synth;
  }
}

export const ttsService = new TextToSpeechService();
