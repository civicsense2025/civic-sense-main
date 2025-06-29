import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAudio } from '../../components/audio/AudioProvider';

export default function AudioDemoScreen() {
  const { 
    speakText, 
    playQuizCorrectSound, 
    playQuizIncorrectSound,
    startQuizBackgroundMusic,
    stopBackgroundMusic,
    settings 
  } = useAudio();

  const handleTestTTS = () => {
    speakText("Welcome to CivicSense! This is a test of the mobile text-to-speech system.");
  };

  const handleQuizSuccess = () => {
    playQuizCorrectSound();
    speakText("Correct! Great job learning about democracy.");
  };

  const handleQuizFailure = () => {
    playQuizIncorrectSound();
    speakText("That's not quite right. Let's review this civic concept together.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎧 CivicSense Audio Demo</Text>
      <Text style={styles.subtitle}>Test the mobile audio system</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Text-to-Speech</Text>
        <TouchableOpacity style={styles.button} onPress={handleTestTTS}>
          <Text style={styles.buttonText}>Test TTS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sound Effects</Text>
        <TouchableOpacity style={styles.button} onPress={handleQuizSuccess}>
          <Text style={styles.buttonText}>✅ Quiz Correct</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleQuizFailure}>
          <Text style={styles.buttonText}>❌ Quiz Incorrect</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background Music</Text>
        <TouchableOpacity style={styles.button} onPress={() => startQuizBackgroundMusic()}>
          <Text style={styles.buttonText}>🎵 Start Quiz Music</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => stopBackgroundMusic()}>
          <Text style={styles.buttonText}>⏹️ Stop Music</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusSection}>
        <Text style={styles.statusTitle}>Audio Settings</Text>
        <Text style={styles.statusText}>Auto-play: {settings.autoPlayEnabled ? 'ON' : 'OFF'}</Text>
        <Text style={styles.statusText}>Volume: {Math.round(settings.volume * 100)}%</Text>
        <Text style={styles.statusText}>Sound Effects: {settings.soundEffectsEnabled ? 'ON' : 'OFF'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FDFCF9',
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
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#E0A63E',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusSection: {
    backgroundColor: '#FFF5D9',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E0A63E',
  },
  statusTitle: {
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
}); 