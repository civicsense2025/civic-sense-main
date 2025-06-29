import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Placeholder interfaces until the audio service is fully implemented
export interface CivicAudioSettings {
  autoPlayEnabled: boolean;
  loopEnabled: boolean;
  highlightingEnabled: boolean;
  volume: number;
  speechRate: number;
  speechPitch: number;
  voiceLanguage: string;
  musicVolume: number;
  soundEffectsEnabled: boolean;
  backgroundMusicEnabled: boolean;
}

export interface AudioState {
  isPlayingTTS: boolean;
  isPausedTTS: boolean;
  currentText: string;
  currentMusicTrack: string | null;
  settings: CivicAudioSettings;
  isInitialized: boolean;
}

// Default settings
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

/**
 * Hook for managing mobile audio functionality in CivicSense
 * Provides TTS, sound effects, and background music controls
 */
export function useMobileAudio() {
  const [audioState, setAudioState] = useState<AudioState>({
    isPlayingTTS: false,
    isPausedTTS: false,
    currentText: '',
    currentMusicTrack: null,
    settings: defaultSettings,
    isInitialized: false,
  });

  // Initialize audio settings from storage
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Load saved settings
        const savedSettings = await AsyncStorage.getItem('civic_audio_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setAudioState(prev => ({
            ...prev,
            settings: { ...defaultSettings, ...parsed },
            isInitialized: true,
          }));
        } else {
          setAudioState(prev => ({ ...prev, isInitialized: true }));
        }
      } catch (error) {
        console.warn('Failed to load audio settings:', error);
        setAudioState(prev => ({ ...prev, isInitialized: true }));
      }
    };

    initializeAudio();
  }, []);

  // Save settings when they change
  const saveSettings = useCallback(async (newSettings: Partial<CivicAudioSettings>) => {
    try {
      const updatedSettings = { ...audioState.settings, ...newSettings };
      await AsyncStorage.setItem('civic_audio_settings', JSON.stringify(updatedSettings));
      setAudioState(prev => ({
        ...prev,
        settings: updatedSettings,
      }));
    } catch (error) {
      console.error('Failed to save audio settings:', error);
    }
  }, [audioState.settings]);

  // Text-to-Speech functions (will be implemented when expo-speech is installed)
  const speakText = useCallback(async (text: string, options?: {
    autoPlay?: boolean;
    onStart?: () => void;
    onDone?: () => void;
    onError?: (error: Error) => void;
  }) => {
    try {
      console.log('🗣️ TTS: Would speak text:', text.slice(0, 50) + '...');
      
      // Check if auto-play is disabled
      if (options?.autoPlay && !audioState.settings.autoPlayEnabled) {
        console.log('Auto-play disabled, skipping TTS');
        return;
      }

      setAudioState(prev => ({
        ...prev,
        isPlayingTTS: true,
        isPausedTTS: false,
        currentText: text,
      }));

      options?.onStart?.();

      // Simulate speech duration
      setTimeout(() => {
        setAudioState(prev => ({
          ...prev,
          isPlayingTTS: false,
          isPausedTTS: false,
        }));
        options?.onDone?.();
      }, Math.min(text.length * 50, 10000)); // Estimate duration

    } catch (error) {
      console.error('TTS Error:', error);
      setAudioState(prev => ({
        ...prev,
        isPlayingTTS: false,
        isPausedTTS: false,
      }));
      options?.onError?.(error as Error);
    }
  }, [audioState.settings.autoPlayEnabled]);

  const stopSpeech = useCallback(async () => {
    console.log('🗣️ Stopping TTS');
    setAudioState(prev => ({
      ...prev,
      isPlayingTTS: false,
      isPausedTTS: false,
      currentText: '',
    }));
  }, []);

  const pauseResumeSpeech = useCallback(async () => {
    if (audioState.isPlayingTTS && !audioState.isPausedTTS) {
      console.log('🗣️ Pausing TTS');
      setAudioState(prev => ({ ...prev, isPausedTTS: true }));
    } else if (audioState.isPausedTTS && audioState.currentText) {
      console.log('🗣️ Resuming TTS');
      setAudioState(prev => ({ ...prev, isPausedTTS: false }));
      await speakText(audioState.currentText);
    }
  }, [audioState.isPlayingTTS, audioState.isPausedTTS, audioState.currentText, speakText]);

  // Sound effect functions (placeholders until react-native-sound is installed)
  const playSoundEffect = useCallback(async (soundId: string, options?: { volume?: number }) => {
    if (!audioState.settings.soundEffectsEnabled) {
      return;
    }
    console.log(`🔊 Playing sound effect: ${soundId}`);
    // TODO: Implement with expo-av when installed
  }, [audioState.settings.soundEffectsEnabled]);

  // Background music functions (placeholders until react-native-track-player is installed)
  const playBackgroundMusic = useCallback(async (trackId: string) => {
    if (!audioState.settings.backgroundMusicEnabled) {
      return;
    }
    console.log(`🎵 Playing background music: ${trackId}`);
    setAudioState(prev => ({ ...prev, currentMusicTrack: trackId }));
    // TODO: Implement with react-native-track-player when installed
  }, [audioState.settings.backgroundMusicEnabled]);

  const stopBackgroundMusic = useCallback(async () => {
    console.log('🎵 Stopping background music');
    setAudioState(prev => ({ ...prev, currentMusicTrack: null }));
    // TODO: Implement with react-native-track-player when installed
  }, []);

  // Civic-specific convenience methods
  const playQuizCorrectSound = useCallback(() => playSoundEffect('quiz_correct'), [playSoundEffect]);
  const playQuizIncorrectSound = useCallback(() => playSoundEffect('quiz_incorrect'), [playSoundEffect]);
  const playCivicAchievementSound = useCallback(() => playSoundEffect('civic_achievement'), [playSoundEffect]);
  const playButtonTapSound = useCallback(() => playSoundEffect('button_tap', { volume: 0.3 }), [playSoundEffect]);
  const playNotificationSound = useCallback(() => playSoundEffect('notification_chime'), [playSoundEffect]);

  const startQuizBackgroundMusic = useCallback(() => playBackgroundMusic('quiz_background'), [playBackgroundMusic]);
  
  const celebrateCompletion = useCallback(async () => {
    await playSoundEffect('quiz_complete');
    await playBackgroundMusic('celebration_theme');
  }, [playSoundEffect, playBackgroundMusic]);

  // Settings update functions
  const updateSettings = useCallback((newSettings: Partial<CivicAudioSettings>) => {
    saveSettings(newSettings);
  }, [saveSettings]);

  const setAutoPlay = useCallback((enabled: boolean) => {
    updateSettings({ autoPlayEnabled: enabled });
  }, [updateSettings]);

  const setLoop = useCallback((enabled: boolean) => {
    updateSettings({ loopEnabled: enabled });
  }, [updateSettings]);

  const setVolume = useCallback((volume: number) => {
    updateSettings({ volume: Math.max(0, Math.min(1, volume)) });
  }, [updateSettings]);

  const setMusicVolume = useCallback((volume: number) => {
    updateSettings({ musicVolume: Math.max(0, Math.min(1, volume)) });
  }, [updateSettings]);

  const setSoundEffectsEnabled = useCallback((enabled: boolean) => {
    updateSettings({ soundEffectsEnabled: enabled });
  }, [updateSettings]);

  const setBackgroundMusicEnabled = useCallback((enabled: boolean) => {
    updateSettings({ backgroundMusicEnabled: enabled });
  }, [updateSettings]);

  const setSpeechRate = useCallback((rate: number) => {
    updateSettings({ speechRate: Math.max(0.5, Math.min(2.0, rate)) });
  }, [updateSettings]);

  const setSpeechPitch = useCallback((pitch: number) => {
    updateSettings({ speechPitch: Math.max(0.5, Math.min(2.0, pitch)) });
  }, [updateSettings]);

  // Read current page content (adapted from web version)
  const readCurrentPageContent = useCallback(async () => {
    // This would extract content from the current screen
    // For now, just a placeholder
    const pageContent = "Welcome to CivicSense. This is your civic education platform.";
    await speakText(pageContent, { autoPlay: false });
  }, [speakText]);

  return {
    // State
    ...audioState,
    
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
  };
} 