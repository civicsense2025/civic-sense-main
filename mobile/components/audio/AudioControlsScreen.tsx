import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MobileAudioControls } from './MobileAudioControls';
import { useAudio } from './AudioProvider';

/**
 * Example screen demonstrating CivicSense mobile audio integration
 * This shows how to use audio controls in any screen of your app
 */
export function AudioControlsScreen() {
  const {
    // Audio state
    isPlayingTTS,
    isPausedTTS,
    currentText,
    settings,
    
    // Audio functions
    speakText,
    stopSpeech,
    pauseResumeSpeech,
    readCurrentPageContent,
    
    // Sound effects
    playQuizCorrectSound,
    playQuizIncorrectSound,
    playCivicAchievementSound,
    playButtonTapSound,
    
    // Background music
    startQuizBackgroundMusic,
    stopBackgroundMusic,
    celebrateCompletion,
    
    // Settings
    setAutoPlay,
    setLoop,
    setVolume,
    setSoundEffectsEnabled,
    setBackgroundMusicEnabled,
    
    // UI controls
    showAudioControls,
    setShowAudioControls,
    isAudioMinimized,
    setIsAudioMinimized,
  } = useAudio();

  const [demoText] = useState("Welcome to CivicSense! This is your mobile civic education platform. Learn about democracy, voting rights, and how power really works in America.");

  const handleTestTTS = () => {
    speakText(demoText, {
      onStart: () => console.log('🗣️ TTS Started'),
      onDone: () => Alert.alert('TTS Complete', 'Speech finished successfully!'),
      onError: (error) => Alert.alert('TTS Error', error.message),
    });
  };

  const handleTestQuizAudio = async () => {
    // Simulate a quiz interaction
    await playButtonTapSound(); // Button press sound
    
    setTimeout(async () => {
      await speakText("Which amendment guarantees freedom of speech?");
    }, 300);
    
    // Simulate correct answer after 3 seconds
    setTimeout(async () => {
      await playQuizCorrectSound();
      await speakText("Correct! The First Amendment protects freedom of speech, religion, press, assembly, and petition.");
    }, 3000);
  };

  const handleCelebration = async () => {
    await celebrateCompletion();
    Alert.alert('🎉 Celebration!', 'Quiz completed with audio celebration!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎧 CivicSense Audio System</Text>
          <Text style={styles.subtitle}>Comprehensive mobile audio for civic education</Text>
        </View>

        {/* Audio Status */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>📊 Audio Status</Text>
          <Text style={styles.statusText}>
            TTS: {isPlayingTTS ? (isPausedTTS ? 'Paused' : 'Playing') : 'Stopped'}
          </Text>
          <Text style={styles.statusText}>
            Auto-play: {settings.autoPlayEnabled ? 'Enabled' : 'Disabled'}
          </Text>
          <Text style={styles.statusText}>
            Sound Effects: {settings.soundEffectsEnabled ? 'Enabled' : 'Disabled'}
          </Text>
          <Text style={styles.statusText}>
            Background Music: {settings.backgroundMusicEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>

        {/* TTS Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗣️ Text-to-Speech</Text>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleTestTTS}>
            <Text style={styles.primaryButtonText}>Test TTS with Demo Text</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={readCurrentPageContent}>
            <Text style={styles.buttonText}>Read Current Page</Text>
          </TouchableOpacity>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.halfButton]} 
              onPress={pauseResumeSpeech}
              disabled={!currentText}
            >
              <Text style={styles.buttonText}>
                {isPausedTTS ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.halfButton]} 
              onPress={stopSpeech}
            >
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sound Effects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 Sound Effects</Text>
          
          <View style={styles.buttonGrid}>
            <TouchableOpacity style={styles.soundButton} onPress={playQuizCorrectSound}>
              <Text style={styles.soundEmoji}>✅</Text>
              <Text style={styles.soundButtonText}>Correct</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.soundButton} onPress={playQuizIncorrectSound}>
              <Text style={styles.soundEmoji}>❌</Text>
              <Text style={styles.soundButtonText}>Incorrect</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.soundButton} onPress={playCivicAchievementSound}>
              <Text style={styles.soundEmoji}>🏆</Text>
              <Text style={styles.soundButtonText}>Achievement</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.soundButton} onPress={playButtonTapSound}>
              <Text style={styles.soundEmoji}>👆</Text>
              <Text style={styles.soundButtonText}>Button Tap</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Background Music */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎵 Background Music</Text>
          
          <TouchableOpacity style={styles.button} onPress={startQuizBackgroundMusic}>
            <Text style={styles.buttonText}>Start Quiz Music</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={stopBackgroundMusic}>
            <Text style={styles.buttonText}>Stop Music</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Scenarios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Demo Scenarios</Text>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleTestQuizAudio}>
            <Text style={styles.primaryButtonText}>Simulate Quiz Interaction</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={handleCelebration}>
            <Text style={styles.buttonText}>Celebrate Completion</Text>
          </TouchableOpacity>
        </View>

        {/* Audio Controls Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎛️ Audio Controls</Text>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => setShowAudioControls(!showAudioControls)}
          >
            <Text style={styles.buttonText}>
              {showAudioControls ? 'Hide' : 'Show'} Audio Controls
            </Text>
          </TouchableOpacity>
          
          {showAudioControls && (
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => setIsAudioMinimized(!isAudioMinimized)}
            >
              <Text style={styles.buttonText}>
                {isAudioMinimized ? 'Expand' : 'Minimize'} Controls
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings Quick Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Quick Settings</Text>
          
          <TouchableOpacity 
            style={[styles.button, settings.autoPlayEnabled && styles.activeButton]} 
            onPress={() => setAutoPlay(!settings.autoPlayEnabled)}
          >
            <Text style={[styles.buttonText, settings.autoPlayEnabled && styles.activeButtonText]}>
              Auto-play: {settings.autoPlayEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, settings.loopEnabled && styles.activeButton]} 
            onPress={() => setLoop(!settings.loopEnabled)}
          >
            <Text style={[styles.buttonText, settings.loopEnabled && styles.activeButtonText]}>
              Loop: {settings.loopEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, settings.soundEffectsEnabled && styles.activeButton]} 
            onPress={() => setSoundEffectsEnabled(!settings.soundEffectsEnabled)}
          >
            <Text style={[styles.buttonText, settings.soundEffectsEnabled && styles.activeButtonText]}>
              Sound Effects: {settings.soundEffectsEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, settings.backgroundMusicEnabled && styles.activeButton]} 
            onPress={() => setBackgroundMusicEnabled(!settings.backgroundMusicEnabled)}
          >
            <Text style={[styles.buttonText, settings.backgroundMusicEnabled && styles.activeButtonText]}>
              Background Music: {settings.backgroundMusicEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ About CivicSense Audio</Text>
          <Text style={styles.infoText}>
            This comprehensive audio system enhances civic education with:
            {'\n'}• Text-to-speech for accessibility
            {'\n'}• Interactive sound effects for engagement
            {'\n'}• Background music for focused learning
            {'\n'}• Customizable settings for all users
            {'\n'}• Integration with quiz and learning systems
          </Text>
        </View>
      </ScrollView>

      {/* Audio Controls Component */}
      {showAudioControls && (
        <MobileAudioControls
          isPlayingTTS={isPlayingTTS}
          isPausedTTS={isPausedTTS}
          currentText={currentText}
          volume={settings.volume}
          autoPlayEnabled={settings.autoPlayEnabled}
          loopEnabled={settings.loopEnabled}
          soundEffectsEnabled={settings.soundEffectsEnabled}
          backgroundMusicEnabled={settings.backgroundMusicEnabled}
          
          onPlay={(text) => speakText(text || demoText)}
          onPause={pauseResumeSpeech}
          onStop={stopSpeech}
          onVolumeChange={setVolume}
          onAutoPlayToggle={setAutoPlay}
          onLoopToggle={setLoop}
          onSoundEffectsToggle={setSoundEffectsEnabled}
          onBackgroundMusicToggle={setBackgroundMusicEnabled}
          onReadCurrentPage={readCurrentPageContent}
          
          isMinimized={isAudioMinimized}
          onToggleMinimized={() => setIsAudioMinimized(!isAudioMinimized)}
          onClose={() => setShowAudioControls(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCF9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B1B1B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#FFF5D9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0A63E',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E0A63E',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#E0A63E',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  buttonText: {
    color: '#1B1B1B',
    fontSize: 14,
    fontWeight: '500',
  },
  activeButton: {
    backgroundColor: '#2E4057',
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfButton: {
    flex: 0.48,
    marginBottom: 0,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  soundButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  soundEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  soundButtonText: {
    color: '#1B1B1B',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
}); 