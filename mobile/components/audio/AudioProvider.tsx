import React, { createContext, useContext, useState, useEffect } from 'react';
import { CivicAudioSettings } from '../../lib/audio/use-mobile-audio';

interface AudioContextType {
  // Audio state
  isPlayingTTS: boolean;
  isPausedTTS: boolean;
  currentText: string;
  currentMusicTrack: string | null;
  settings: CivicAudioSettings;
  isInitialized: boolean;
  
  // Control functions
  speakText: (text: string, options?: { autoPlay?: boolean; onStart?: () => void; onDone?: () => void; onError?: (error: Error) => void; }) => Promise<void>;
  stopSpeech: () => Promise<void>;
  pauseResumeSpeech: () => Promise<void>;
  readCurrentPageContent: () => Promise<void>;
  
  // Sound effects
  playSoundEffect: (soundId: string, options?: { volume?: number }) => Promise<void>;
  playQuizCorrectSound: () => Promise<void>;
  playQuizIncorrectSound: () => Promise<void>;
  playCivicAchievementSound: () => Promise<void>;
  playButtonTapSound: () => Promise<void>;
  playNotificationSound: () => Promise<void>;
  
  // Background music
  playBackgroundMusic: (trackId: string) => Promise<void>;
  stopBackgroundMusic: () => Promise<void>;
  startQuizBackgroundMusic: () => Promise<void>;
  celebrateCompletion: () => Promise<void>;
  
  // Settings
  updateSettings: (settings: Partial<CivicAudioSettings>) => void;
  setAutoPlay: (enabled: boolean) => void;
  setLoop: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSoundEffectsEnabled: (enabled: boolean) => void;
  setBackgroundMusicEnabled: (enabled: boolean) => void;
  setSpeechRate: (rate: number) => void;
  setSpeechPitch: (pitch: number) => void;
  
  // UI controls
  showAudioControls: boolean;
  setShowAudioControls: (show: boolean) => void;
  isAudioMinimized: boolean;
  setIsAudioMinimized: (minimized: boolean) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};

interface AudioProviderProps {
  children: React.ReactNode;
}

const defaultSettings: CivicAudioSettings = {
  autoPlayEnabled: false,
  loopEnabled: false,
  highlightingEnabled: true,
  volume: 0.8,
  speechRate: 1.0,
  speechPitch: 1.0,
  voiceLanguage: 'en-US',
  musicVolume: 0.6,
  soundEffectsEnabled: true,
  backgroundMusicEnabled: true,
};

export function AudioProvider({ children }: AudioProviderProps) {
  // Audio state
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isPausedTTS, setIsPausedTTS] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentMusicTrack, setCurrentMusicTrack] = useState<string | null>(null);
  const [settings, setSettings] = useState<CivicAudioSettings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // UI state
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [isAudioMinimized, setIsAudioMinimized] = useState(true);

  // Initialize audio service
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        console.log('🎵 Initializing CivicSense Mobile Audio...');
        // Here we would initialize the actual audio service when libraries are installed
        setIsInitialized(true);
        setShowAudioControls(true); // Show controls by default
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };

    initializeAudio();
  }, []);

  // Text-to-Speech implementation (placeholder)
  const speakText = async (text: string, options?: {
    autoPlay?: boolean;
    onStart?: () => void;
    onDone?: () => void;
    onError?: (error: Error) => void;
  }) => {
    try {
      console.log('🗣️ TTS: Would speak text:', text.slice(0, 50) + '...');
      
      if (options?.autoPlay && !settings.autoPlayEnabled) {
        console.log('Auto-play disabled, skipping TTS');
        return;
      }

      setIsPlayingTTS(true);
      setIsPausedTTS(false);
      setCurrentText(text);

      options?.onStart?.();

      // Simulate speech duration
      setTimeout(() => {
        setIsPlayingTTS(false);
        setIsPausedTTS(false);
        options?.onDone?.();
      }, Math.min(text.length * 50, 10000));

    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlayingTTS(false);
      setIsPausedTTS(false);
      options?.onError?.(error as Error);
    }
  };

  const stopSpeech = async () => {
    console.log('🗣️ Stopping TTS');
    setIsPlayingTTS(false);
    setIsPausedTTS(false);
    setCurrentText('');
  };

  const pauseResumeSpeech = async () => {
    if (isPlayingTTS && !isPausedTTS) {
      console.log('🗣️ Pausing TTS');
      setIsPausedTTS(true);
    } else if (isPausedTTS && currentText) {
      console.log('🗣️ Resuming TTS');
      setIsPausedTTS(false);
      await speakText(currentText);
    }
  };

  const readCurrentPageContent = async () => {
    const pageContent = "Welcome to CivicSense. This is your civic education platform.";
    await speakText(pageContent, { autoPlay: false });
  };

  // Sound effect placeholders
  const playSoundEffect = async (soundId: string, options?: { volume?: number }) => {
    if (!settings.soundEffectsEnabled) return;
    console.log(`🔊 Playing sound effect: ${soundId}`);
  };

  const playQuizCorrectSound = async () => playSoundEffect('quiz_correct');
  const playQuizIncorrectSound = async () => playSoundEffect('quiz_incorrect');
  const playCivicAchievementSound = async () => playSoundEffect('civic_achievement');
  const playButtonTapSound = async () => playSoundEffect('button_tap', { volume: 0.3 });
  const playNotificationSound = async () => playSoundEffect('notification_chime');

  // Background music placeholders
  const playBackgroundMusic = async (trackId: string) => {
    if (!settings.backgroundMusicEnabled) return;
    console.log(`🎵 Playing background music: ${trackId}`);
    setCurrentMusicTrack(trackId);
  };

  const stopBackgroundMusic = async () => {
    console.log('🎵 Stopping background music');
    setCurrentMusicTrack(null);
  };

  const startQuizBackgroundMusic = async () => playBackgroundMusic('quiz_background');
  
  const celebrateCompletion = async () => {
    await playSoundEffect('quiz_complete');
    await playBackgroundMusic('celebration_theme');
  };

  // Settings functions
  const updateSettings = (newSettings: Partial<CivicAudioSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const setAutoPlay = (enabled: boolean) => updateSettings({ autoPlayEnabled: enabled });
  const setLoop = (enabled: boolean) => updateSettings({ loopEnabled: enabled });
  const setVolume = (volume: number) => updateSettings({ volume: Math.max(0, Math.min(1, volume)) });
  const setMusicVolume = (volume: number) => updateSettings({ musicVolume: Math.max(0, Math.min(1, volume)) });
  const setSoundEffectsEnabled = (enabled: boolean) => updateSettings({ soundEffectsEnabled: enabled });
  const setBackgroundMusicEnabled = (enabled: boolean) => updateSettings({ backgroundMusicEnabled: enabled });
  const setSpeechRate = (rate: number) => updateSettings({ speechRate: Math.max(0.5, Math.min(2.0, rate)) });
  const setSpeechPitch = (pitch: number) => updateSettings({ speechPitch: Math.max(0.5, Math.min(2.0, pitch)) });

  const contextValue: AudioContextType = {
    // State
    isPlayingTTS,
    isPausedTTS,
    currentText,
    currentMusicTrack,
    settings,
    isInitialized,
    
    // TTS Controls
    speakText,
    stopSpeech,
    pauseResumeSpeech,
    readCurrentPageContent,
    
    // Sound Effects
    playSoundEffect,
    playQuizCorrectSound,
    playQuizIncorrectSound,
    playCivicAchievementSound,
    playButtonTapSound,
    playNotificationSound,
    
    // Background Music
    playBackgroundMusic,
    stopBackgroundMusic,
    startQuizBackgroundMusic,
    celebrateCompletion,
    
    // Settings
    updateSettings,
    setAutoPlay,
    setLoop,
    setVolume,
    setMusicVolume,
    setSoundEffectsEnabled,
    setBackgroundMusicEnabled,
    setSpeechRate,
    setSpeechPitch,
    
    // UI Controls
    showAudioControls,
    setShowAudioControls,
    isAudioMinimized,
    setIsAudioMinimized,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
} 