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

class MobileAudioService {
  private static instance: MobileAudioService;
  private listeners: Set<() => void> = new Set();
  
  // Audio state
  private isInitialized = false;
  private currentSpeech: any = null;
  private isPlayingTTS = false;
  private isPausedTTS = false;
  private currentText = '';
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
  };
  
  // Sound effects storage
  private soundEffects: Map<string, Audio.Sound> = new Map();
  private musicTracks: CivicMusicTrack[] = [];
  private currentMusicTrack: string | null = null;
  
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
   * Text-to-Speech functionality for civic content
   */
  async speakText(text: string, options?: {
    autoPlay?: boolean;
    onStart?: () => void;
    onDone?: () => void;
    onError?: (error: Error) => void;
  }): Promise<void> {
    try {
      if (!text || !this.isInitialized) {
        console.warn('No text provided or service not initialized');
        return;
      }

      // Check if auto-play is disabled
      if (options?.autoPlay && !this.settings.autoPlayEnabled) {
        console.log('Auto-play disabled, skipping TTS');
        return;
      }

      // Stop any current speech
      await this.stopSpeech();

      this.currentText = text;
      this.isPlayingTTS = true;
      this.isPausedTTS = false;

      // Clean text for better civic education speech
      const cleanText = this.cleanCivicTextForSpeech(text);

      const speechOptions: Speech.SpeechOptions = {
        language: this.settings.voiceLanguage,
        pitch: this.settings.speechPitch,
        rate: this.settings.speechRate,
        volume: this.settings.volume,
        onStart: () => {
          console.log('🗣️ TTS Started');
          options?.onStart?.();
          this.notifyListeners();
        },
        onDone: () => {
          console.log('🗣️ TTS Completed');
          this.isPlayingTTS = false;
          this.isPausedTTS = false;
          
          // Handle looping for civic content
          if (this.settings.loopEnabled) {
            setTimeout(() => {
              if (this.settings.loopEnabled && this.currentText) {
                this.speakText(this.currentText, options);
              }
            }, 1000);
          }
          
          options?.onDone?.();
          this.notifyListeners();
        },
                 onError: (error: any) => {
           console.error('🗣️ TTS Error:', error);
           this.isPlayingTTS = false;
           this.isPausedTTS = false;
           options?.onError?.(new Error(error?.toString() || 'Speech synthesis failed'));
           this.notifyListeners();
         },
        onStopped: () => {
          console.log('🗣️ TTS Stopped');
          this.isPlayingTTS = false;
          this.isPausedTTS = false;
          this.notifyListeners();
        },
      };

      await Speech.speak(cleanText, speechOptions);

    } catch (error) {
      console.error('Error in TTS:', error);
      this.isPlayingTTS = false;
      this.isPausedTTS = false;
      options?.onError?.(error as Error);
      this.notifyListeners();
    }
  }

  /**
   * Clean text for better civic education speech
   */
  private cleanCivicTextForSpeech(text: string): string {
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
   * Update audio settings
   */
  async updateSettings(newSettings: Partial<CivicAudioSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await this.saveSettings();
      
      // Apply volume changes to current audio
      if (newSettings.volume !== undefined) {
        // Update sound effects volume
        for (const sound of this.soundEffects.values()) {
          await sound.setVolumeAsync(newSettings.volume);
        }
      }
      
      if (newSettings.musicVolume !== undefined) {
        await TrackPlayer.setVolume(newSettings.musicVolume);
      }

      this.notifyListeners();
      console.log('🔧 Audio settings updated:', newSettings);
      
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }

  /**
   * Get current audio state
   */
  getState() {
    return {
      isPlayingTTS: this.isPlayingTTS,
      isPausedTTS: this.isPausedTTS,
      currentText: this.currentText,
      currentMusicTrack: this.currentMusicTrack,
      settings: { ...this.settings },
      isInitialized: this.isInitialized,
      availableSoundEffects: this.civicSounds,
      availableMusicTracks: this.civicMusicTracks,
    };
  }

  /**
   * Civic-specific convenience methods
   */
  async playQuizCorrectSound(): Promise<void> {
    await this.playSoundEffect('quiz_correct');
  }

  async playQuizIncorrectSound(): Promise<void> {
    await this.playSoundEffect('quiz_incorrect');
  }

  async playCivicAchievementSound(): Promise<void> {
    await this.playSoundEffect('civic_achievement');
  }

  async playButtonTapSound(): Promise<void> {
    await this.playSoundEffect('button_tap', { volume: 0.3 });
  }

  async playNotificationSound(): Promise<void> {
    await this.playSoundEffect('notification_chime');
  }

  async startQuizBackgroundMusic(): Promise<void> {
    await this.playBackgroundMusic('quiz_background');
  }

  async celebrateCompletion(): Promise<void> {
    await this.playSoundEffect('quiz_complete');
    await this.playBackgroundMusic('celebration_theme');
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

  addListener(callback: () => void): void {
    this.listeners.add(callback);
  }

  removeListener(callback: () => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
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
}

// Export singleton instance
export const mobileAudioService = MobileAudioService.getInstance(); 