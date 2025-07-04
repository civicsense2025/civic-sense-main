# 🎧 CivicSense Mobile Audio System

Comprehensive audio integration for civic education on React Native / Expo.

## 📋 Overview

The CivicSense mobile audio system provides:

- **Text-to-Speech (TTS)** for accessibility and content narration
- **Sound Effects** for interactive feedback and engagement
- **Background Music** for focused learning environments
- **Persistent Settings** for user preferences
- **Civic-Specific Features** optimized for democratic education

## 🚀 Quick Start

### 1. Installation

The required libraries are already installed:
```bash
# Core audio libraries
expo-av                           # Audio playback
expo-speech                       # Text-to-speech
react-native-track-player         # Background music
@react-native-async-storage/async-storage  # Settings persistence
```

### 2. Basic Integration

The audio system is already integrated in your app layout. To use it in any screen:

```tsx
import { useAudio } from '@/components/audio/AudioProvider';

export function MyScreen() {
  const { 
    speakText, 
    playQuizCorrectSound, 
    startQuizBackgroundMusic,
    settings 
  } = useAudio();

  const handleReadContent = () => {
    speakText("Welcome to CivicSense civic education!");
  };

  const handleQuizSuccess = () => {
    playQuizCorrectSound();
    speakText("Correct! Great job learning about democracy.");
  };

  return (
    <View>
      <Button title="Read Content" onPress={handleReadContent} />
      <Button title="Quiz Success" onPress={handleQuizSuccess} />
    </View>
  );
}
```

### 3. Audio Controls UI

Show the floating audio controls:

```tsx
import { MobileAudioControls } from '@/components/audio/MobileAudioControls';
import { useAudio } from '@/components/audio/AudioProvider';

export function MyScreenWithControls() {
  const {
    isPlayingTTS,
    isPausedTTS,
    currentText,
    settings,
    // ... other audio functions
    showAudioControls,
    isAudioMinimized,
    setIsAudioMinimized
  } = useAudio();

  return (
    <View style={{ flex: 1 }}>
      {/* Your content */}
      
      {/* Audio controls overlay */}
      {showAudioControls && (
        <MobileAudioControls
          isPlayingTTS={isPlayingTTS}
          isPausedTTS={isPausedTTS}
          currentText={currentText}
          isMinimized={isAudioMinimized}
          onToggleMinimized={() => setIsAudioMinimized(!isAudioMinimized)}
          // ... other props
        />
      )}
    </View>
  );
}
```

## 🎵 Core Features

### Text-to-Speech (TTS)

```tsx
const { speakText, stopSpeech, pauseResumeSpeech } = useAudio();

// Basic TTS
await speakText("Learn about the Constitution");

// TTS with callbacks
await speakText("Quiz question text", {
  onStart: () => console.log('Speech started'),
  onDone: () => console.log('Speech completed'),
  onError: (error) => console.error('Speech failed:', error)
});

// Auto-play (respects user settings)
await speakText("Auto-play content", { autoPlay: true });

// Control playback
await pauseResumeSpeech();
await stopSpeech();
```

### Sound Effects

```tsx
const { 
  playQuizCorrectSound,
  playQuizIncorrectSound,
  playCivicAchievementSound,
  playButtonTapSound,
  playNotificationSound 
} = useAudio();

// Quiz interactions
await playQuizCorrectSound();     // ✅ Correct answer
await playQuizIncorrectSound();   // ❌ Incorrect answer

// Achievements and progress
await playCivicAchievementSound(); // 🏆 Major milestone

// UI feedback
await playButtonTapSound();       // 👆 Button presses
await playNotificationSound();    // 🔔 Alerts
```

### Background Music

```tsx
const { 
  startQuizBackgroundMusic,
  stopBackgroundMusic,
  playBackgroundMusic 
} = useAudio();

// Start quiz music
await startQuizBackgroundMusic();

// Custom background music
await playBackgroundMusic('quiz_background');
await playBackgroundMusic('celebration_theme');

// Stop all music
await stopBackgroundMusic();
```

### Civic-Specific Scenarios

```tsx
const { celebrateCompletion } = useAudio();

// Complete quiz celebration
await celebrateCompletion(); // Plays completion sound + celebration music

// Civic learning sequence
const handleCivicLearning = async () => {
  await speakText("Let's learn about voting rights");
  await startQuizBackgroundMusic();
  
  // ... quiz interaction ...
  
  if (quizCompleted) {
    await celebrateCompletion();
    await speakText("Congratulations! You've completed this civic education module.");
  }
};
```

## ⚙️ Settings Management

### Reading Settings

```tsx
const { settings } = useAudio();

console.log('Auto-play enabled:', settings.autoPlayEnabled);
console.log('Volume level:', settings.volume);
console.log('Speech rate:', settings.speechRate);
console.log('Sound effects enabled:', settings.soundEffectsEnabled);
```

### Updating Settings

```tsx
const { 
  setAutoPlay,
  setLoop,
  setVolume,
  setSoundEffectsEnabled,
  setBackgroundMusicEnabled,
  setSpeechRate,
  setSpeechPitch 
} = useAudio();

// Basic toggles
setAutoPlay(true);
setSoundEffectsEnabled(false);
setBackgroundMusicEnabled(true);

// Volume and speech controls
setVolume(0.8);        // 0.0 to 1.0
setSpeechRate(1.2);    // 0.5 to 2.0
setSpeechPitch(1.0);   // 0.5 to 2.0

// Bulk update
updateSettings({
  autoPlayEnabled: true,
  volume: 0.9,
  speechRate: 1.1
});
```

## 🎛️ Audio Controls UI

The `MobileAudioControls` component provides a complete audio interface:

### Features

- **Floating Button**: Minimized controls that stay accessible
- **Full Modal**: Comprehensive settings and controls
- **Live Status**: Real-time playback information
- **Settings Panel**: Quick toggles for all audio preferences
- **CivicSense Branding**: Consistent with app design

### Usage

```tsx
<MobileAudioControls
  // State props
  isPlayingTTS={isPlayingTTS}
  isPausedTTS={isPausedTTS}
  currentText={currentText}
  volume={settings.volume}
  autoPlayEnabled={settings.autoPlayEnabled}
  loopEnabled={settings.loopEnabled}
  soundEffectsEnabled={settings.soundEffectsEnabled}
  backgroundMusicEnabled={settings.backgroundMusicEnabled}
  
  // Control callbacks
  onPlay={(text) => speakText(text)}
  onPause={pauseResumeSpeech}
  onStop={stopSpeech}
  onVolumeChange={setVolume}
  onAutoPlayToggle={setAutoPlay}
  onLoopToggle={setLoop}
  onSoundEffectsToggle={setSoundEffectsEnabled}
  onBackgroundMusicToggle={setBackgroundMusicEnabled}
  onReadCurrentPage={readCurrentPageContent}
  
  // UI state
  isMinimized={isAudioMinimized}
  onToggleMinimized={() => setIsAudioMinimized(!isAudioMinimized)}
  onClose={() => setShowAudioControls(false)}
/>
```

## 🔧 Technical Implementation

### Architecture

```
AudioProvider (React Context)
├── Audio State Management
├── Settings Persistence (AsyncStorage)
├── TTS Integration (expo-speech)
├── Sound Effects (expo-av)
├── Background Music (react-native-track-player)
└── UI State Management

MobileAudioService (Singleton)
├── expo-speech for TTS
├── expo-av for sound effects
├── react-native-track-player for music
├── AsyncStorage for settings
└── Event listeners for state changes
```

### Service Layer

```tsx
import { mobileAudioService } from '@/lib/audio/audio-service';

// Direct service usage (advanced)
await mobileAudioService.initialize();
await mobileAudioService.speakText("Direct service call");
await mobileAudioService.playQuizCorrectSound();
```

## 🎨 Customization

### Adding Sound Effects

1. Add sound files to `assets/sounds/`
2. Update the `civicSounds` array in `audio-service.ts`:

```tsx
{
  id: 'custom_sound',
  name: 'Custom Sound',
  file: require('@/assets/sounds/custom-sound.mp3'),
  category: 'ui'
}
```

3. Add a convenience method:

```tsx
async playCustomSound(): Promise<void> {
  await this.playSoundEffect('custom_sound');
}
```

### Adding Music Tracks

Update the `civicMusicTracks` array:

```tsx
{
  id: 'custom_background',
  title: 'Custom Background Music',
  artist: 'CivicSense',
  url: 'https://civicsense.com/audio/custom-background.mp3',
  category: 'background'
}
```

### Styling Audio Controls

Modify `MobileAudioControls.tsx` styles:

```tsx
const styles = StyleSheet.create({
  minimizedButton: {
    backgroundColor: '#E0A63E', // CivicSense primary
    // ... other styles
  },
  primaryButton: {
    backgroundColor: '#E0A63E', // CivicSense primary
    // ... other styles
  },
  // ... other customizations
});
```

## 📱 Platform Considerations

### iOS Specific

- Audio plays in silent mode
- Background audio support
- iOS audio session configuration
- Control center integration

### Android Specific

- Audio focus management
- Background processing
- Notification controls
- Battery optimization

## 🐛 Troubleshooting

### Common Issues

1. **No Sound Playing**
   ```tsx
   // Check if sound effects are enabled
   console.log('Sound effects enabled:', settings.soundEffectsEnabled);
   
   // Check volume
   console.log('Volume level:', settings.volume);
   ```

2. **TTS Not Working**
   ```tsx
   // Check if auto-play is preventing speech
   await speakText("Test", { autoPlay: false });
   
   // Check for errors
   await speakText("Test", {
     onError: (error) => console.error('TTS Error:', error)
   });
   ```

3. **Background Music Issues**
   ```tsx
   // Check if background music is enabled
   console.log('Background music enabled:', settings.backgroundMusicEnabled);
   
   // Try stopping and restarting
   await stopBackgroundMusic();
   await startQuizBackgroundMusic();
   ```

### Debug Mode

Enable verbose logging:

```tsx
// In development, enable detailed logs
if (__DEV__) {
  console.log('Audio state:', audioState);
  console.log('Audio settings:', settings);
}
```

## 🚀 Next Steps

1. **Add Audio Assets**: Place sound files in `assets/sounds/`
2. **Configure Music**: Set up streaming URLs or local music files
3. **Test on Devices**: Test audio functionality on real iOS/Android devices
4. **Accessibility Testing**: Verify screen reader compatibility
5. **Performance Optimization**: Monitor memory usage and battery impact

## 📚 API Reference

### useAudio Hook

```tsx
interface AudioContextType {
  // State
  isPlayingTTS: boolean;
  isPausedTTS: boolean;
  currentText: string;
  currentMusicTrack: string | null;
  settings: CivicAudioSettings;
  isInitialized: boolean;
  
  // TTS Functions
  speakText: (text: string, options?: TTSOptions) => Promise<void>;
  stopSpeech: () => Promise<void>;
  pauseResumeSpeech: () => Promise<void>;
  readCurrentPageContent: () => Promise<void>;
  
  // Sound Effects
  playSoundEffect: (soundId: string, options?: SoundOptions) => Promise<void>;
  playQuizCorrectSound: () => Promise<void>;
  playQuizIncorrectSound: () => Promise<void>;
  playCivicAchievementSound: () => Promise<void>;
  playButtonTapSound: () => Promise<void>;
  playNotificationSound: () => Promise<void>;
  
  // Background Music
  playBackgroundMusic: (trackId: string) => Promise<void>;
  stopBackgroundMusic: () => Promise<void>;
  startQuizBackgroundMusic: () => Promise<void>;
  celebrateCompletion: () => Promise<void>;
  
  // Settings
  updateSettings: (settings: Partial<CivicAudioSettings>) => void;
  setAutoPlay: (enabled: boolean) => void;
  setLoop: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  // ... other setters
  
  // UI Controls
  showAudioControls: boolean;
  setShowAudioControls: (show: boolean) => void;
  isAudioMinimized: boolean;
  setIsAudioMinimized: (minimized: boolean) => void;
}
```

### Settings Interface

```tsx
interface CivicAudioSettings {
  autoPlayEnabled: boolean;        // Auto-play content
  loopEnabled: boolean;           // Loop audio content
  highlightingEnabled: boolean;   // Visual highlighting during speech
  volume: number;                 // 0.0 to 1.0
  speechRate: number;             // 0.5 to 2.0
  speechPitch: number;            // 0.5 to 2.0
  voiceLanguage: string;          // 'en-US', etc.
  musicVolume: number;            // 0.0 to 1.0
  soundEffectsEnabled: boolean;   // Enable sound effects
  backgroundMusicEnabled: boolean; // Enable background music
}
```

---

**Built for CivicSense** - Making civic education accessible through comprehensive audio features. 🏛️🎧 