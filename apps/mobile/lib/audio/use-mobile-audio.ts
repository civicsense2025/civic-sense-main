import { useState, useEffect, useCallback } from 'react';
import { mobileAudioService } from './audio-service';
import type { CivicAudioSettings } from './audio-service';
import type { SupportedLanguage } from '../translation/deepl-service';

export interface CivicAudioState {
  // Audio playback state
  isPlayingTTS: boolean;
  isPausedTTS: boolean;
  currentText: string;
  
  // Background music state
  isPlayingMusic: boolean;
  currentTrack?: string;
  
  // Service state
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Settings
  settings: CivicAudioSettings;
  
  // Translation state
  availableLanguages: SupportedLanguage[];
  translationStatus: {
    isAvailable: boolean;
    isEnabled: boolean;
    currentLanguage: string;
    cacheSize: number;
  };
}

export function useMobileAudio() {
  // Initialize with safe defaults in case service fails
  const getDefaultSettings = () => {
    try {
      return mobileAudioService.getSettings();
    } catch (error) {
      console.warn('⚠️ Failed to get audio service settings, using defaults:', error);
      return {
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
      };
    }
  };

  const [audioState, setAudioState] = useState<CivicAudioState>({
    isPlayingTTS: false,
    isPausedTTS: false,
    currentText: '',
    isPlayingMusic: false,
    isInitialized: false,
    isLoading: true,
    error: null,
    settings: getDefaultSettings(),
    availableLanguages: [],
    translationStatus: {
      isAvailable: false,
      isEnabled: false,
      currentLanguage: 'en',
      cacheSize: 0,
    },
  });

  // Initialize audio service
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        setAudioState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Try to initialize the audio service
        await mobileAudioService.initialize();
        
        // Get initial state with error handling
        const settings = mobileAudioService.getSettings();
        const availableLanguages = mobileAudioService.getAvailableLanguages();
        const translationStatus = mobileAudioService.getTranslationStatus();
        
        setAudioState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          settings,
          availableLanguages,
          translationStatus,
        }));
        
      } catch (error) {
        console.warn('⚠️ Audio service initialization failed, continuing without audio features:', error);
        setAudioState(prev => ({
          ...prev,
          isLoading: false,
          isInitialized: false, // Mark as not initialized but don't show error
          error: null, // Don't show error to user, just disable audio features
          availableLanguages: [],
          translationStatus: {
            isAvailable: false,
            isEnabled: false,
            currentLanguage: 'en',
            cacheSize: 0,
          },
        }));
      }
    };

    initializeAudio();
  }, []);

  // Listen for audio state changes
  useEffect(() => {
    let unsubscribeFunction: (() => void) | null = null;
    
    try {
      mobileAudioService.addListener((serviceState) => {
        setAudioState(prev => ({
          ...prev,
          isPlayingTTS: serviceState.isPlayingTTS,
          isPausedTTS: serviceState.isPausedTTS,
          currentText: serviceState.currentText,
          isPlayingMusic: serviceState.isPlayingMusic,
          currentTrack: serviceState.currentTrack,
          settings: serviceState.settings,
          translationStatus: mobileAudioService.getTranslationStatus(),
        }));
      });
      
      // Create cleanup function
      unsubscribeFunction = () => {
        try {
          mobileAudioService.removeListener((serviceState) => {
            // This is a placeholder - the actual implementation would need a reference to the specific listener
          });
        } catch (error) {
          console.warn('⚠️ Failed to remove audio service listener:', error);
        }
      };
    } catch (error) {
      console.warn('⚠️ Failed to setup audio service listener:', error);
    }

    return () => {
      if (unsubscribeFunction) {
        unsubscribeFunction();
      }
    };
  }, []);

  // Core TTS functions with translation support
  const speakText = useCallback(async (text: string, options?: {
    rate?: number;
    pitch?: number;
    language?: string;
    skipTranslation?: boolean;
  }) => {
    if (!audioState.isInitialized) {
      console.warn('⚠️ Audio service not initialized, skipping speech');
      return;
    }
    
    try {
      await mobileAudioService.speakText(text, options);
    } catch (error) {
      console.warn('⚠️ Error speaking text:', error);
      setAudioState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Speech failed',
      }));
    }
  }, [audioState.isInitialized]);

  const stopSpeech = useCallback(async () => {
    if (!audioState.isInitialized) {
      console.warn('⚠️ Audio service not initialized, skipping stop speech');
      return;
    }
    
    try {
      await mobileAudioService.stopSpeech();
    } catch (error) {
      console.warn('⚠️ Error stopping speech:', error);
    }
  }, [audioState.isInitialized]);

  const pauseResumeSpeech = useCallback(async () => {
    if (!audioState.isInitialized) {
      console.warn('⚠️ Audio service not initialized, skipping pause/resume speech');
      return;
    }
    
    try {
      if (audioState.isPausedTTS) {
        await mobileAudioService.resumeSpeech();
      } else {
        await mobileAudioService.pauseSpeech();
      }
    } catch (error) {
      console.warn('⚠️ Error pausing/resuming speech:', error);
    }
  }, [audioState.isPausedTTS, audioState.isInitialized]);

  // Translation functions
  const setTranslationLanguage = useCallback(async (languageCode: string) => {
    try {
      await mobileAudioService.setTranslationLanguage(languageCode);
      setAudioState(prev => ({
        ...prev,
        translationStatus: mobileAudioService.getTranslationStatus(),
      }));
    } catch (error) {
      console.error('Error setting translation language:', error);
      setAudioState(prev => ({
        ...prev,
        error: 'Failed to set translation language',
      }));
    }
  }, []);

  const toggleTranslation = useCallback(async (enabled?: boolean) => {
    try {
      await mobileAudioService.toggleTranslation(enabled);
      setAudioState(prev => ({
        ...prev,
        translationStatus: mobileAudioService.getTranslationStatus(),
      }));
    } catch (error) {
      console.error('Error toggling translation:', error);
      setAudioState(prev => ({
        ...prev,
        error: 'Failed to toggle translation',
      }));
    }
  }, []);

  const setTranslationFormality = useCallback(async (formality: 'default' | 'more' | 'less') => {
    try {
      await mobileAudioService.setTranslationFormality(formality);
    } catch (error) {
      console.error('Error setting translation formality:', error);
    }
  }, []);

  const clearTranslationCache = useCallback(async () => {
    try {
      await mobileAudioService.clearTranslationCache();
      setAudioState(prev => ({
        ...prev,
        translationStatus: mobileAudioService.getTranslationStatus(),
      }));
    } catch (error) {
      console.error('Error clearing translation cache:', error);
    }
  }, []);

  // Civic-specific functions with translation
  const speakQuizCorrect = useCallback(async (customMessage?: string) => {
    await mobileAudioService.speakQuizCorrect(customMessage);
  }, []);

  const speakQuizIncorrect = useCallback(async (customMessage?: string) => {
    await mobileAudioService.speakQuizIncorrect(customMessage);
  }, []);

  const speakCivicAchievement = useCallback(async (achievement: string) => {
    await mobileAudioService.speakCivicAchievement(achievement);
  }, []);

  const speakConstitutionalConcept = useCallback(async (concept: string) => {
    await mobileAudioService.speakConstitutionalConcept(concept);
  }, []);

  const speakVotingInformation = useCallback(async (info: string) => {
    await mobileAudioService.speakVotingInformation(info);
  }, []);

  // Settings management
  const updateSettings = useCallback(async (newSettings: Partial<CivicAudioSettings>) => {
    try {
      await mobileAudioService.updateSettings(newSettings);
      setAudioState(prev => ({
        ...prev,
        settings: mobileAudioService.getSettings(),
        translationStatus: mobileAudioService.getTranslationStatus(),
      }));
    } catch (error) {
      console.error('Error updating settings:', error);
      setAudioState(prev => ({
        ...prev,
        error: 'Failed to update settings',
      }));
    }
  }, []);

  // Sound effects and background music (placeholders for now)
  const playQuizCorrectSound = useCallback(async () => {
    // Placeholder - will play sound effect when assets are added
    console.log('🎵 Quiz Correct Sound');
  }, []);

  const playQuizIncorrectSound = useCallback(async () => {
    // Placeholder - will play sound effect when assets are added
    console.log('🎵 Quiz Incorrect Sound');
  }, []);

  const playNotificationSound = useCallback(async () => {
    // Placeholder - will play notification sound when assets are added
    console.log('🔔 Notification Sound');
  }, []);

  const startBackgroundMusic = useCallback(async (trackName?: string) => {
    // Placeholder - will start background music when assets are added
    console.log('🎵 Starting Background Music:', trackName);
  }, []);

  const stopBackgroundMusic = useCallback(async () => {
    // Placeholder - will stop background music when assets are added
    console.log('🎵 Stopping Background Music');
  }, []);

  const readCurrentPageContent = useCallback(async () => {
    // This would extract and read current page content
    await speakText('Reading current page content. This is a placeholder for page content extraction.');
  }, [speakText]);

  return {
    // State
    ...audioState,
    
    // Core TTS functions
    speakText,
    stopSpeech,
    pauseResumeSpeech,
    readCurrentPageContent,
    
    // Translation functions
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
  };
} 