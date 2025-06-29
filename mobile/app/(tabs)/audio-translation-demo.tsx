import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudio } from '../../components/audio/AudioProvider';
import { MobileAudioControls } from '../../components/audio/MobileAudioControls';

export default function AudioTranslationDemoScreen() {
  const {
    // Audio state
    isPlayingTTS,
    isPausedTTS,
    currentText,
    settings,
    availableLanguages,
    translationStatus,
    isControlsVisible,
    isControlsMinimized,
    
    // Audio functions
    speakText,
    stopSpeech,
    pauseResumeSpeech,
    setTranslationLanguage,
    toggleTranslation,
    clearTranslationCache,
    updateSettings,
    
    // Civic-specific functions
    speakQuizCorrect,
    speakQuizIncorrect,
    speakCivicAchievement,
    speakConstitutionalConcept,
    speakVotingInformation,
    
    // UI functions
    showControls,
    hideControls,
    toggleControlsMinimized,
  } = useAudio();

  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Sample civic education content for testing
  const sampleContent = {
    constitution: "The First Amendment protects freedom of speech, religion, press, assembly, and petition. It's the foundation of American democracy and prevents Congress from making laws that restrict these fundamental rights.",
    voting: "Voting rights are protected by several constitutional amendments. The 15th Amendment prohibits denying voting rights based on race, the 19th gives women the right to vote, and the 26th extends voting rights to 18-year-olds.",
    congress: "Congress has the power to declare war, regulate interstate commerce, and control federal spending. Understanding these powers helps citizens hold their representatives accountable for policy decisions.",
    supremeCourt: "The Supreme Court interprets the Constitution and can overturn laws that violate constitutional principles. Their decisions shape American law and society for generations.",
  };

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      setSelectedLanguage(languageCode);
      await setTranslationLanguage(languageCode);
      
      Alert.alert(
        'Language Changed',
        `Translation language set to ${availableLanguages.find(l => l.code === languageCode)?.name || languageCode}. Audio will now be translated when playing.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to change language');
    }
  };

  const handleTestTranslation = async (content: string, topic: string) => {
    try {
      await speakText(content);
    } catch (error) {
      Alert.alert('Error', `Failed to speak ${topic} content`);
    }
  };

  const handleCivicAudioTest = () => {
    Alert.alert(
      'Test Civic Audio Features',
      'Choose a civic audio feature to test:',
      [
        {
          text: 'Quiz Correct',
          onPress: () => speakQuizCorrect('Excellent! You understand how democracy works.'),
        },
        {
          text: 'Quiz Incorrect',
          onPress: () => speakQuizIncorrect('Not quite right. Let\'s explore this civic concept together.'),
        },
        {
          text: 'Achievement',
          onPress: () => speakCivicAchievement('Constitutional Scholar'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🌍 CivicSense Translation Demo</Text>
          <Text style={styles.subtitle}>
            Experience civic education in multiple languages with DeepL translation
          </Text>
        </View>

        {/* Translation Status */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Translation Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Service Available:</Text>
            <Text style={[styles.statusValue, { color: translationStatus.isAvailable ? '#059669' : '#DC2626' }]}>
              {translationStatus.isAvailable ? '✅ Yes' : '❌ No'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Translation Enabled:</Text>
            <Text style={[styles.statusValue, { color: translationStatus.isEnabled ? '#059669' : '#6B7280' }]}>
              {translationStatus.isEnabled ? '✅ Yes' : '⚪ No'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Current Language:</Text>
            <Text style={styles.statusValue}>{translationStatus.currentLanguage}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Cache Size:</Text>
            <Text style={styles.statusValue}>{translationStatus.cacheSize} items</Text>
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.languageCard}>
          <Text style={styles.cardTitle}>Select Translation Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.languageScroll}>
            {availableLanguages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageButton,
                  selectedLanguage === language.code && styles.languageButtonSelected,
                ]}
                onPress={() => handleLanguageSelect(language.code)}
              >
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <Text style={[
                  styles.languageName,
                  selectedLanguage === language.code && styles.languageNameSelected,
                ]}>
                  {language.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sample Content */}
        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>🏛️ Test Civic Education Content</Text>
          <Text style={styles.contentDescription}>
            Tap any topic below to hear it spoken in your selected language:
          </Text>

          <TouchableOpacity
            style={styles.contentButton}
            onPress={() => handleTestTranslation(sampleContent.constitution, 'Constitution')}
          >
            <Text style={styles.contentEmoji}>📜</Text>
            <View style={styles.contentTextContainer}>
              <Text style={styles.contentTitle}>First Amendment Rights</Text>
              <Text style={styles.contentPreview} numberOfLines={2}>
                {sampleContent.constitution.slice(0, 80)}...
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contentButton}
            onPress={() => handleTestTranslation(sampleContent.voting, 'Voting Rights')}
          >
            <Text style={styles.contentEmoji}>🗳️</Text>
            <View style={styles.contentTextContainer}>
              <Text style={styles.contentTitle}>Voting Rights</Text>
              <Text style={styles.contentPreview} numberOfLines={2}>
                {sampleContent.voting.slice(0, 80)}...
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contentButton}
            onPress={() => handleTestTranslation(sampleContent.congress, 'Congressional Powers')}
          >
            <Text style={styles.contentEmoji}>🏛️</Text>
            <View style={styles.contentTextContainer}>
              <Text style={styles.contentTitle}>Congressional Powers</Text>
              <Text style={styles.contentPreview} numberOfLines={2}>
                {sampleContent.congress.slice(0, 80)}...
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contentButton}
            onPress={() => handleTestTranslation(sampleContent.supremeCourt, 'Supreme Court')}
          >
            <Text style={styles.contentEmoji}>⚖️</Text>
            <View style={styles.contentTextContainer}>
              <Text style={styles.contentTitle}>Supreme Court Role</Text>
              <Text style={styles.contentPreview} numberOfLines={2}>
                {sampleContent.supremeCourt.slice(0, 80)}...
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Audio Controls */}
        <View style={styles.controlsCard}>
          <Text style={styles.cardTitle}>🎧 Audio Controls</Text>
          
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={showControls}
            >
              <Text style={styles.controlButtonText}>Show Audio Controls</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, styles.secondaryButton]}
              onPress={handleCivicAudioTest}
            >
              <Text style={[styles.controlButtonText, styles.secondaryButtonText]}>Test Civic Audio</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.controlButton, { opacity: translationStatus.isEnabled ? 1 : 0.5 }]}
              onPress={() => toggleTranslation()}
            >
              <Text style={styles.controlButtonText}>
                {translationStatus.isEnabled ? 'Disable Translation' : 'Enable Translation'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, styles.warningButton]}
              onPress={() => {
                Alert.alert(
                  'Clear Translation Cache',
                  'This will remove all cached translations. Continue?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', onPress: clearTranslationCache },
                  ]
                );
              }}
            >
              <Text style={[styles.controlButtonText, styles.warningButtonText]}>Clear Cache</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Audio Status */}
        {(isPlayingTTS || currentText) && (
          <View style={styles.audioStatusCard}>
            <Text style={styles.cardTitle}>🎵 Currently Playing</Text>
            <Text style={styles.audioStatusText}>
              Status: {isPlayingTTS ? (isPausedTTS ? 'Paused' : 'Playing') : 'Stopped'}
            </Text>
            {currentText && (
              <Text style={styles.currentTextPreview} numberOfLines={3}>
                "{currentText.slice(0, 100)}..."
              </Text>
            )}
            
            <View style={styles.audioControls}>
              <TouchableOpacity
                style={styles.audioControlButton}
                onPress={pauseResumeSpeech}
              >
                <Text style={styles.audioControlText}>
                  {isPausedTTS ? '▶️' : '⏸️'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.audioControlButton}
                onPress={stopSpeech}
              >
                <Text style={styles.audioControlText}>⏹️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Help Information */}
        <View style={styles.helpCard}>
          <Text style={styles.cardTitle}>ℹ️ How to Use</Text>
          <Text style={styles.helpText}>
            1. Select a language from the language picker{'\n'}
            2. Enable translation in the audio controls{'\n'}
            3. Tap any civic education topic to hear it in your language{'\n'}
            4. Use the audio controls to pause, resume, or stop playback{'\n'}
            5. Test civic-specific audio features with the "Test Civic Audio" button
          </Text>
        </View>
      </ScrollView>

      {/* Audio Controls Modal */}
      {isControlsVisible && (
        <MobileAudioControls
          isPlayingTTS={isPlayingTTS}
          isPausedTTS={isPausedTTS}
          currentText={currentText}
          autoPlayEnabled={settings.autoPlay}
          loopEnabled={settings.loop}
          soundEffectsEnabled={settings.soundEffectsEnabled}
          backgroundMusicEnabled={settings.backgroundMusicEnabled}
          translationEnabled={translationStatus.isEnabled}
          availableLanguages={availableLanguages}
          currentLanguage={translationStatus.currentLanguage}
          translationStatus={translationStatus}
          
          onPlay={(text) => text && speakText(text)}
          onPause={pauseResumeSpeech}
          onStop={stopSpeech}
          onAutoPlayToggle={(enabled) => updateSettings({ autoPlay: enabled })}
          onLoopToggle={(enabled) => updateSettings({ loop: enabled })}
          onSoundEffectsToggle={(enabled) => updateSettings({ soundEffectsEnabled: enabled })}
          onBackgroundMusicToggle={(enabled) => updateSettings({ backgroundMusicEnabled: enabled })}
          onReadCurrentPage={() => speakText('This is the audio translation demo screen. Here you can test CivicSense\'s multilingual audio capabilities.')}
          
          onTranslationToggle={toggleTranslation}
          onLanguageChange={setTranslationLanguage}
          onClearTranslationCache={clearTranslationCache}
          
          isMinimized={isControlsMinimized}
          onToggleMinimized={toggleControlsMinimized}
          onClose={hideControls}
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
  content: {
    padding: 16,
    paddingBottom: 100, // Extra space for floating audio controls
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B1B1B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  languageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  languageScroll: {
    marginTop: 8,
  },
  languageButton: {
    alignItems: 'center',
    marginRight: 12,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#F9FAFB',
    minWidth: 80,
  },
  languageButtonSelected: {
    borderColor: '#E0A63E',
    backgroundColor: '#FFF5D9',
  },
  languageFlag: {
    fontSize: 24,
    marginBottom: 4,
  },
  languageName: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  languageNameSelected: {
    color: '#E0A63E',
    fontWeight: '600',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  contentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  contentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 8,
  },
  contentEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  contentTextContainer: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  contentPreview: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  controlsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#E0A63E',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#2E4057',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
  },
  warningButton: {
    backgroundColor: '#DC2626',
  },
  warningButtonText: {
    color: '#FFFFFF',
  },
  audioStatusCard: {
    backgroundColor: '#FFF5D9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0A63E',
  },
  audioStatusText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  currentTextPreview: {
    fontSize: 14,
    color: '#1B1B1B',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 18,
  },
  audioControls: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  audioControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0A63E',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  audioControlText: {
    fontSize: 20,
  },
  helpCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
}); 