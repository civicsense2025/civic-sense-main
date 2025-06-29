import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import TrackPlayer, { 
  Capability, 
  Event, 
  RepeatMode, 
  State,
  Track,
  AppKilledPlaybackBehavior,
} from 'react-native-track-player';
import { deepLTranslationService, SupportedLanguage } from '../translation/deepl-service';

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
  
  // TTS Settings
  speechLanguage: string;
  
  // Translation Settings
  translationEnabled: boolean;
  targetLanguage: string;
  preserveCivicTerms: boolean;
  translationFormality: 'default' | 'more' | 'less';
}

export interface CivicSoundEffect {
  id: string;
  name: string;
  file: any; // require() import
  category: 'ui' | 'quiz' | 'success' | 'error' | 'notification';
}

export interface CivicMusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  artwork?: string;
  duration?: number;
  category: 'background' | 'quiz' | 'menu' | 'celebration';
}

export interface AudioServiceState {
  isPlayingTTS: boolean;
  isPausedTTS: boolean;
  currentText: string;
  isPlayingMusic: boolean;
  currentTrack?: string;
  settings: CivicAudioSettings;
}

export type AudioServiceListener = (state: AudioServiceState) => void;

class MobileAudioService {
  private static instance: MobileAudioService;
  private listeners: Set<AudioServiceListener> = new Set();
  
  // Audio state
  private isInitialized = false;
  private currentSpeech: any = null;
  private isPlayingTTS = false;
  private isPausedTTS = false;
  private currentText = '';
  private isPlayingMusic = false;
  private currentMusicTrack: string | null = null;
  private settings: CivicAudioSettings = {
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
    translationFormality: 'default',
  };
  
  // Sound effects storage
  private soundEffects: Map<string, Audio.Sound> = new Map();
  private musicTracks: CivicMusicTrack[] = [];
  
  // Civic-specific sound library - Using placeholders until assets are added
  private readonly civicSounds: CivicSoundEffect[] = [
    {
      id: 'quiz_correct',
      name: 'Quiz Correct Answer',
      file: null, // Will be loaded when asset is available
      category: 'quiz'
    },
    {
      id: 'quiz_incorrect',
      name: 'Quiz Incorrect Answer', 
      file: null, // Will be loaded when asset is available
      category: 'quiz'
    },
    {
      id: 'civic_achievement',
      name: 'Civic Achievement',
      file: null, // Will be loaded when asset is available
      category: 'success'
    },
    {
      id: 'notification_chime',
      name: 'Notification Chime',
      file: null, // Will be loaded when asset is available
      category: 'notification'
    },
    {
      id: 'button_tap',
      name: 'Button Tap',
      file: null, // Will be loaded when asset is available
      category: 'ui'
    },
    {
      id: 'quiz_complete',
      name: 'Quiz Complete',
      file: null, // Will be loaded when asset is available
      category: 'success'
    },
    {
      id: 'error_alert',
      name: 'Error Alert',
      file: null, // Will be loaded when asset is available
      category: 'error'
    },
  ];

  private readonly civicMusicTracks: CivicMusicTrack[] = [
    {
      id: 'civic_background_1',
      title: 'Democracy in Motion',
      artist: 'CivicSense',
      url: 'https://civicsense.com/audio/background-1.mp3',
      category: 'background'
    },
    {
      id: 'quiz_background',
      title: 'Learning Journey',
      artist: 'CivicSense',
      url: 'https://civicsense.com/audio/quiz-background.mp3',
      category: 'quiz'
    },
    {
      id: 'celebration_theme',
      title: 'Civic Victory',
      artist: 'CivicSense',
      url: 'https://civicsense.com/audio/celebration.mp3',
      category: 'celebration'
    },
  ];

  static getInstance(): MobileAudioService {
    if (!MobileAudioService.instance) {
      MobileAudioService.instance = new MobileAudioService();
    }
    return MobileAudioService.instance;
  }

  /**
   * Initialize the mobile audio service
   */
  async initialize(): Promise<void> {
    try {
      console.log('🎵 Initializing CivicSense Mobile Audio Service...');
      
      // Configure audio session for iOS
      if (Platform.OS === 'ios') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }

      // Initialize TrackPlayer for music
      await this.initializeTrackPlayer();
      
      // Load sound effects
      await this.loadSoundEffects();
      
      // Load settings from storage
      await this.loadSettings();
      
      this.isInitialized = true;
      console.log('✅ Mobile Audio Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize audio service:', error);
      throw error;
    }
  }

  /**
   * Initialize TrackPlayer for background music
   */
  private async initializeTrackPlayer(): Promise<void> {
    try {
      await TrackPlayer.setupPlayer({
        maxCacheSize: 1024 * 5, // 5MB cache
      });

      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
        },
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.Stop,
          Capability.SeekTo,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
        ],
        progressUpdateEventInterval: 2,
      });

      // Set up event listeners
      TrackPlayer.addEventListener(Event.PlaybackState, this.handlePlaybackStateChange.bind(this));
      TrackPlayer.addEventListener(Event.PlaybackTrackChanged, this.handleTrackChange.bind(this));

    } catch (error) {
      console.warn('TrackPlayer initialization failed:', error);
    }
  }

  /**
   * Load and cache sound effects
   */
  private async loadSoundEffects(): Promise<void> {
    try {
      for (const soundDef of this.civicSounds) {
        try {
          const { sound } = await Audio.Sound.createAsync(soundDef.file, {
            shouldPlay: false,
            isLooping: false,
            volume: this.settings.volume,
          });
          
          this.soundEffects.set(soundDef.id, sound);
          console.log(`✅ Loaded sound effect: ${soundDef.name}`);
        } catch (error) {
          console.warn(`Failed to load sound ${soundDef.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading sound effects:', error);
    }
  }

  /**
   * Speak text with optional translation
   */
  async speakText(text: string, options?: { 
    rate?: number; 
    pitch?: number; 
    language?: string;
    skipTranslation?: boolean;
  }): Promise<void> {
    try {
      let textToSpeak = text;
      
      // Apply translation if enabled and not skipping
      if (this.settings.translationEnabled && !options?.skipTranslation) {
        textToSpeak = await this.translateTextForSpeech(text);
      }
      
      // Clean text for civic education context
      textToSpeak = this.cleanTextForTTS(textToSpeak);
      
      // Stop any current speech
      await this.stopSpeech();
      
      const speechOptions: Speech.SpeechOptions = {
        language: options?.language || this.settings.speechLanguage,
        pitch: options?.pitch || this.settings.speechPitch,
        rate: options?.rate || this.settings.speechRate,
        onStart: () => {
          this.isPlayingTTS = true;
          this.isPausedTTS = false;
          this.currentText = textToSpeak;
          this.notifyListeners();
        },
        onDone: () => {
          this.isPlayingTTS = false;
          this.isPausedTTS = false;
          this.currentText = '';
          this.notifyListeners();
        },
        onError: (error) => {
          console.error('TTS Error:', error);
          this.isPlayingTTS = false;
          this.isPausedTTS = false;
          this.notifyListeners();
        }
      };
      
      await Speech.speak(textToSpeak, speechOptions);
      
    } catch (error) {
      console.error('Error speaking text:', error);
      this.isPlayingTTS = false;
      this.isPausedTTS = false;
      this.notifyListeners();
    }
  }

  /**
   * Clean text for better civic education speech
   */
  private cleanTextForTTS(text: string): string {
    return text
      // Handle common civic abbreviations
      .replace(/\bU\.S\.A?\./g, 'United States')
      .replace(/\bU\.K\./g, 'United Kingdom')
      .replace(/\bG\.O\.P\./g, 'Republican Party')
      .replace(/\bDems\b/g, 'Democrats')
      .replace(/\bReps\b/g, 'Republicans')
      .replace(/\bSen\./g, 'Senator')
      .replace(/\bRep\./g, 'Representative')
      .replace(/\bGov\./g, 'Governor')
      .replace(/\bPres\./g, 'President')
      
      // Handle percentages and numbers for better speech
      .replace(/(\d+)%/g, '$1 percent')
      .replace(/\$(\d+)/g, '$1 dollars')
      
      // Add natural pauses for better civic content comprehension
      .replace(/\.\s+/g, '. ')
      .replace(/:\s+/g, ': ')
      .replace(/;\s+/g, '; ')
      
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Translate text for speech using DeepL
   */
  private async translateTextForSpeech(text: string): Promise<string> {
    try {
      if (!this.settings.translationEnabled || this.settings.targetLanguage === 'en') {
        return text;
      }
      
      const translatedText = await deepLTranslationService.translateText(
        text,
        this.settings.targetLanguage,
        {
          preserveCivicTerms: this.settings.preserveCivicTerms,
          formality: this.settings.translationFormality,
          context: 'civic education content for text-to-speech'
        }
      );
      
      console.log(`🌍 Translated text from English to ${this.settings.targetLanguage}`);
      return translatedText;
      
    } catch (error) {
      console.error('Translation failed for TTS:', error);
      return text; // Fallback to original text
    }
  }

  /**
   * Get available languages for translation
   */
  getAvailableLanguages(): SupportedLanguage[] {
    return deepLTranslationService.getAvailableLanguages();
  }

  /**
   * Set translation language
   */
  async setTranslationLanguage(languageCode: string): Promise<void> {
    this.settings = {
      ...this.settings,
      targetLanguage: languageCode,
      translationEnabled: languageCode !== 'en'
    };
    
    await this.saveSettings();
    this.notifyListeners();
  }

  /**
   * Toggle translation on/off
   */
  async toggleTranslation(enabled?: boolean): Promise<void> {
    this.settings = {
      ...this.settings,
      translationEnabled: enabled !== undefined ? enabled : !this.settings.translationEnabled
    };
    
    await this.saveSettings();
    this.notifyListeners();
  }

  /**
   * Set translation formality
   */
  async setTranslationFormality(formality: 'default' | 'more' | 'less'): Promise<void> {
    this.settings = {
      ...this.settings,
      translationFormality: formality
    };
    
    await this.saveSettings();
    this.notifyListeners();
  }

  /**
   * Get translation service status
   */
  getTranslationStatus(): {
    isAvailable: boolean;
    isEnabled: boolean;
    currentLanguage: string;
    cacheSize: number;
  } {
    const status = deepLTranslationService.getStatus();
    return {
      isAvailable: status.isInitialized,
      isEnabled: this.settings.translationEnabled,
      currentLanguage: this.settings.targetLanguage,
      cacheSize: status.cacheSize
    };
  }

  /**
   * Clear translation cache
   */
  async clearTranslationCache(): Promise<void> {
    await deepLTranslationService.clearCache();
  }

  /**
   * Civic-specific convenience methods with translation support
   */

  // Quiz feedback with translation
  async speakQuizCorrect(customMessage?: string): Promise<void> {
    const message = customMessage || 'Correct! You\'re building your civic knowledge and becoming a more informed citizen.';
    await this.speakText(message);
  }

  async speakQuizIncorrect(customMessage?: string): Promise<void> {
    const message = customMessage || 'That\'s not quite right. Let\'s learn about this together - understanding how power works is crucial for democracy.';
    await this.speakText(message);
  }

  async speakCivicAchievement(achievement: string): Promise<void> {
    const message = `Congratulations! You've achieved: ${achievement}. You're becoming harder to manipulate and more difficult to ignore.`;
    await this.speakText(message);
  }

  // Multilingual civic education content
  async speakConstitutionalConcept(concept: string): Promise<void> {
    const message = `Let's explore this constitutional concept: ${concept}. Understanding your rights is the foundation of democratic participation.`;
    await this.speakText(message);
  }

  async speakVotingInformation(info: string): Promise<void> {
    const message = `Important voting information: ${info}. Your vote is your voice in democracy.`;
    await this.speakText(message);
  }

  /**
   * Stop current speech
   */
  async stopSpeech(): Promise<void> {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }
      this.isPlayingTTS = false;
      this.isPausedTTS = false;
      this.currentText = '';
      this.notifyListeners();
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  /**
   * Pause/Resume TTS (Note: expo-speech doesn't support pause/resume, so we stop and restart)
   */
  async pauseResumeSpeech(): Promise<void> {
    try {
      if (this.isPlayingTTS && !this.isPausedTTS) {
        // Pause (by stopping)
        await this.stopSpeech();
        this.isPausedTTS = true;
        this.notifyListeners();
      } else if (this.isPausedTTS && this.currentText) {
        // Resume (by restarting)
        this.isPausedTTS = false;
        await this.speakText(this.currentText);
      }
    } catch (error) {
      console.error('Error pausing/resuming speech:', error);
    }
  }

  /**
   * Play sound effect for civic interactions
   */
  async playSoundEffect(soundId: string, options?: { volume?: number }): Promise<void> {
    try {
      if (!this.settings.soundEffectsEnabled) {
        return;
      }

      const sound = this.soundEffects.get(soundId);
      if (!sound) {
        console.warn(`Sound effect not found: ${soundId}`);
        return;
      }

      // Set volume if specified
      if (options?.volume !== undefined) {
        await sound.setVolumeAsync(options.volume);
      } else {
        await sound.setVolumeAsync(this.settings.volume);
      }

      // Reset position and play
      await sound.setPositionAsync(0);
      await sound.playAsync();
      
      console.log(`🔊 Played sound effect: ${soundId}`);

    } catch (error) {
      console.error(`Error playing sound effect ${soundId}:`, error);
    }
  }

  /**
   * Play background music for civic engagement
   */
  async playBackgroundMusic(trackId: string): Promise<void> {
    try {
      if (!this.settings.backgroundMusicEnabled) {
        return;
      }

      const track = this.civicMusicTracks.find(t => t.id === trackId);
      if (!track) {
        console.warn(`Music track not found: ${trackId}`);
        return;
      }

      // Add track to TrackPlayer
      await TrackPlayer.add({
        id: track.id,
        url: track.url,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
      });

      // Set volume and play
      await TrackPlayer.setVolume(this.settings.musicVolume);
      await TrackPlayer.play();
      
      this.currentMusicTrack = trackId;
      console.log(`🎵 Playing background music: ${track.title}`);

    } catch (error) {
      console.error(`Error playing background music ${trackId}:`, error);
    }
  }

  /**
   * Stop background music
   */
  async stopBackgroundMusic(): Promise<void> {
    try {
      await TrackPlayer.stop();
      await TrackPlayer.reset();
      this.currentMusicTrack = null;
      console.log('🎵 Background music stopped');
    } catch (error) {
      console.error('Error stopping background music:', error);
    }
  }

  /**
   * Get current state for listeners
   */
  private getState(): AudioServiceState {
    return {
      isPlayingTTS: this.isPlayingTTS,
      isPausedTTS: this.isPausedTTS,
      currentText: this.currentText,
      isPlayingMusic: this.isPlayingMusic,
      currentTrack: this.currentMusicTrack || undefined,
      settings: this.settings,
    };
  }

  /**
   * Update settings
   */
  async updateSettings(newSettings: Partial<CivicAudioSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    this.notifyListeners();
  }

  // Event handling and persistence methods
  private handlePlaybackStateChange = (event: any) => {
    console.log('🎵 Playback state changed:', event);
    this.notifyListeners();
  };

  private handleTrackChange = (event: any) => {
    console.log('🎵 Track changed:', event);
    this.notifyListeners();
  };

  addListener(callback: AudioServiceListener): void {
    this.listeners.add(callback);
  }

  removeListener(callback: AudioServiceListener): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.getState());
      } catch (error) {
        console.warn('Error in audio listener:', error);
      }
    });
  }

  private async loadSettings(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('civic_audio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch (error) {
      console.warn('Error loading audio settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('civic_audio_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Error saving audio settings:', error);
    }
  }

  /**
   * Cleanup method
   */
  async cleanup(): Promise<void> {
    try {
      await this.stopSpeech();
      await this.stopBackgroundMusic();
      
      // Unload sound effects
      for (const sound of this.soundEffects.values()) {
        await sound.unloadAsync();
      }
      this.soundEffects.clear();
      
      this.listeners.clear();
      console.log('🧹 Audio service cleaned up');
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Get current settings
   */
  getSettings(): CivicAudioSettings {
    return { ...this.settings };
  }

  /**
   * Pause speech
   */
  async pauseSpeech(): Promise<void> {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
        this.isPausedTTS = true;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error pausing speech:', error);
    }
  }

  /**
   * Resume speech
   */
  async resumeSpeech(): Promise<void> {
    try {
      if (this.isPausedTTS && this.currentText) {
        this.isPausedTTS = false;
        await this.speakText(this.currentText, { skipTranslation: true });
      }
    } catch (error) {
      console.error('Error resuming speech:', error);
    }
  }
}

// Export singleton instance
export const mobileAudioService = MobileAudioService.getInstance(); 