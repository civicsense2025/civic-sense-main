import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CivicAudioSettings } from '../../lib/audio/audio-service';
import type { SupportedLanguage } from '../../lib/translation/deepl-service';
import { useMobileAudio } from '../../lib/audio/use-mobile-audio';

interface AudioContextType {
  // Audio state
  isPlayingTTS: boolean;
  isPausedTTS: boolean;
  currentText: string;
  isPlayingMusic: boolean;
  currentTrack?: string;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  settings: CivicAudioSettings;
  
  // Translation state
  availableLanguages: SupportedLanguage[];
  translationStatus: {
    isAvailable: boolean;
    isEnabled: boolean;
    currentLanguage: string;
    cacheSize: number;
  };
  
  // Audio controls
  speakText: (text: string, options?: {
    rate?: number;
    pitch?: number;
    language?: string;
    skipTranslation?: boolean;
  }) => Promise<void>;
  stopSpeech: () => Promise<void>;
  pauseResumeSpeech: () => Promise<void>;
  readCurrentPageContent: () => Promise<void>;
  
  // Translation controls
  setTranslationLanguage: (languageCode: string) => Promise<void>;
  toggleTranslation: (enabled?: boolean) => Promise<void>;
  setTranslationFormality: (formality: 'default' | 'more' | 'less') => Promise<void>;
  clearTranslationCache: () => Promise<void>;
  
  // Civic-specific functions
  speakQuizCorrect: (customMessage?: string) => Promise<void>;
  speakQuizIncorrect: (customMessage?: string) => Promise<void>;
  speakCivicAchievement: (achievement: string) => Promise<void>;
  speakConstitutionalConcept: (concept: string) => Promise<void>;
  speakVotingInformation: (info: string) => Promise<void>;
  
  // Sound effects and music (placeholders)
  playQuizCorrectSound: () => Promise<void>;
  playQuizIncorrectSound: () => Promise<void>;
  playNotificationSound: () => Promise<void>;
  startBackgroundMusic: (trackName?: string) => Promise<void>;
  stopBackgroundMusic: () => Promise<void>;
  
  // Settings
  updateSettings: (newSettings: Partial<CivicAudioSettings>) => Promise<void>;
  
  // UI state
  isControlsVisible: boolean;
  isControlsMinimized: boolean;
  showControls: () => void;
  hideControls: () => void;
  toggleControlsMinimized: () => void;
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

export function AudioProvider({ children }: AudioProviderProps) {
  // Safely import the mobile audio hook with error handling
  let audioHook;
  try {
    audioHook = useMobileAudio();
  } catch (error) {
    console.warn('⚠️ AudioProvider: Mobile audio service not available, using fallbacks:', error);
    // Provide fallback values
    audioHook = {
      isPlayingTTS: false,
      isPausedTTS: false,
      currentText: '',
      isPlayingMusic: false,
      currentTrack: undefined,
      isInitialized: false,
      isLoading: false,
      error: 'Audio service not available',
      settings: { 
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
        speechLanguage: 'en-US',
        translationEnabled: false,
        targetLanguage: 'en-US',
        preserveCivicTerms: true,
        translationFormality: 'default' as const,
      },
      availableLanguages: [],
      translationStatus: { 
        isAvailable: false, 
        isEnabled: false, 
        currentLanguage: 'en', 
        cacheSize: 0 
      },
      speakText: async () => {},
      stopSpeech: async () => {},
      pauseResumeSpeech: async () => {},
      readCurrentPageContent: async () => {},
      setTranslationLanguage: async () => {},
      toggleTranslation: async () => {},
      setTranslationFormality: async () => {},
      clearTranslationCache: async () => {},
      speakQuizCorrect: async () => {},
      speakQuizIncorrect: async () => {},
      speakCivicAchievement: async () => {},
      speakConstitutionalConcept: async () => {},
      speakVotingInformation: async () => {},
      playQuizCorrectSound: async () => {},
      playQuizIncorrectSound: async () => {},
      playNotificationSound: async () => {},
      startBackgroundMusic: async () => {},
      stopBackgroundMusic: async () => {},
      updateSettings: async () => {},
    };
  }
  
  // Extract values from the hook (either real or fallback)
  const {
    isPlayingTTS,
    isPausedTTS,
    currentText,
    isPlayingMusic,
    currentTrack,
    isInitialized,
    isLoading,
    error,
    settings,
    availableLanguages,
    translationStatus,
    
    // Functions
    speakText,
    stopSpeech,
    pauseResumeSpeech,
    readCurrentPageContent,
    setTranslationLanguage,
    toggleTranslation,
    setTranslationFormality,
    clearTranslationCache,
    speakQuizCorrect,
    speakQuizIncorrect,
    speakCivicAchievement,
    speakConstitutionalConcept,
    speakVotingInformation,
    playQuizCorrectSound,
    playQuizIncorrectSound,
    playNotificationSound,
    startBackgroundMusic,
    stopBackgroundMusic,
    updateSettings,
  } = audioHook;
  
  // UI state for audio controls
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [isControlsMinimized, setIsControlsMinimized] = useState(true);
  
  const showControls = () => {
    setIsControlsVisible(true);
    setIsControlsMinimized(false);
  };
  
  const hideControls = () => {
    setIsControlsVisible(false);
  };
  
  const toggleControlsMinimized = () => {
    if (isControlsVisible) {
      setIsControlsMinimized(!isControlsMinimized);
    } else {
      showControls();
    }
  };

  const contextValue: AudioContextType = {
    // Audio state
    isPlayingTTS,
    isPausedTTS,
    currentText,
    isPlayingMusic,
    currentTrack,
    isInitialized,
    isLoading,
    error,
    settings,
    
    // Translation state
    availableLanguages,
    translationStatus,
    
    // Audio controls
    speakText,
    stopSpeech,
    pauseResumeSpeech,
    readCurrentPageContent,
    
    // Translation controls
    setTranslationLanguage,
    toggleTranslation,
    setTranslationFormality,
    clearTranslationCache,
    
    // Civic-specific functions
    speakQuizCorrect,
    speakQuizIncorrect,
    speakCivicAchievement,
    speakConstitutionalConcept,
    speakVotingInformation,
    
    // Sound effects and music
    playQuizCorrectSound,
    playQuizIncorrectSound,
    playNotificationSound,
    startBackgroundMusic,
    stopBackgroundMusic,
    
    // Settings
    updateSettings,
    
    // UI state
    isControlsVisible,
    isControlsMinimized,
    showControls,
    hideControls,
    toggleControlsMinimized,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
} 