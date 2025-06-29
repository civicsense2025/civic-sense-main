import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SupportedLanguage } from '../../lib/translation/deepl-service';

// Simple icon components using emoji for now
const PlayIcon = () => <Text style={styles.iconText}>▶️</Text>;
const PauseIcon = () => <Text style={styles.iconText}>⏸️</Text>;
const StopIcon = () => <Text style={styles.iconText}>⏹️</Text>;
const VolumeIcon = () => <Text style={styles.iconText}>🔊</Text>;
const MuteIcon = () => <Text style={styles.iconText}>🔇</Text>;
const SettingsIcon = () => <Text style={styles.iconText}>⚙️</Text>;
const CloseIcon = () => <Text style={styles.iconText}>✕</Text>;
const HeadphonesIcon = () => <Text style={styles.iconText}>🎧</Text>;
const MusicIcon = () => <Text style={styles.iconText}>🎵</Text>;
const TranslateIcon = () => <Text style={styles.iconText}>🌍</Text>;

interface MobileAudioControlsProps {
  isPlayingTTS?: boolean;
  isPausedTTS?: boolean;
  currentText?: string;
  volume?: number;
  autoPlayEnabled?: boolean;
  loopEnabled?: boolean;
  soundEffectsEnabled?: boolean;
  backgroundMusicEnabled?: boolean;
  
  // Translation props
  translationEnabled?: boolean;
  availableLanguages?: SupportedLanguage[];
  currentLanguage?: string;
  translationStatus?: {
    isAvailable: boolean;
    isEnabled: boolean;
    currentLanguage: string;
    cacheSize: number;
  };
  
  onPlay?: (text?: string) => void;
  onPause?: () => void;
  onStop?: () => void;
  onVolumeChange?: (volume: number) => void;
  onAutoPlayToggle?: (enabled: boolean) => void;
  onLoopToggle?: (enabled: boolean) => void;
  onSoundEffectsToggle?: (enabled: boolean) => void;
  onBackgroundMusicToggle?: (enabled: boolean) => void;
  onReadCurrentPage?: () => void;
  
  // Translation callbacks
  onTranslationToggle?: (enabled: boolean) => void;
  onLanguageChange?: (languageCode: string) => void;
  onClearTranslationCache?: () => void;
  
  isMinimized?: boolean;
  onToggleMinimized?: () => void;
  onClose?: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export function MobileAudioControls({
  isPlayingTTS = false,
  isPausedTTS = false,
  currentText = '',
  volume = 0.8,
  autoPlayEnabled = false,
  loopEnabled = false,
  soundEffectsEnabled = true,
  backgroundMusicEnabled = true,
  
  // Translation props
  translationEnabled = false,
  availableLanguages = [],
  currentLanguage = '',
  translationStatus = {
    isAvailable: false,
    isEnabled: false,
    currentLanguage: '',
    cacheSize: 0,
  },
  
  onPlay,
  onPause,
  onStop,
  onVolumeChange,
  onAutoPlayToggle,
  onLoopToggle,
  onSoundEffectsToggle,
  onBackgroundMusicToggle,
  onReadCurrentPage,
  
  // Translation callbacks
  onTranslationToggle,
  onLanguageChange,
  onClearTranslationCache,
  
  isMinimized = true,
  onToggleMinimized,
  onClose,
}: MobileAudioControlsProps) {
  const [showSettings, setShowSettings] = useState(false);

  const handlePlayPause = () => {
    if (isPlayingTTS) {
      if (isPausedTTS) {
        onPlay?.(currentText);
      } else {
        onPause?.();
      }
    } else {
      if (currentText) {
        onPlay?.(currentText);
      } else {
        onReadCurrentPage?.();
      }
    }
  };

  // Minimized floating button
  if (isMinimized) {
    return (
      <View style={styles.minimizedContainer}>
        <TouchableOpacity
          style={[styles.minimizedButton, { backgroundColor: isPlayingTTS ? '#E0A63E' : '#2E4057' }]}
          onPress={onToggleMinimized}
          activeOpacity={0.8}
        >
          <HeadphonesIcon />
        </TouchableOpacity>
        
        {isPlayingTTS && (
          <View style={styles.miniControls}>
            <TouchableOpacity 
              style={styles.miniControlButton}
              onPress={handlePlayPause}
            >
              {isPausedTTS ? <PlayIcon /> : <PauseIcon />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.miniControlButton}
              onPress={onStop}
            >
              <StopIcon />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Full controls modal
  return (
    <Modal
      visible={!isMinimized}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.controlsContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <HeadphonesIcon />
              <Text style={styles.headerTitle}>Audio Controls</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => setShowSettings(!showSettings)}
              >
                <SettingsIcon />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={onToggleMinimized}
              >
                <Text style={styles.iconText}>📐</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={onClose}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Status */}
            {(currentText || isPlayingTTS) && (
              <View style={styles.statusCard}>
                <Text style={styles.statusLabel}>
                  {isPlayingTTS ? (isPausedTTS ? 'Paused' : 'Playing') : 'Ready'}
                </Text>
                {currentText && (
                  <Text style={styles.currentText} numberOfLines={2}>
                    {currentText.slice(0, 80)}...
                  </Text>
                )}
              </View>
            )}

            {/* Main Controls */}
            <View style={styles.mainControls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={onStop}
              >
                <StopIcon />
                <Text style={styles.controlButtonText}>Stop</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handlePlayPause}
              >
                {isPlayingTTS ? (
                  isPausedTTS ? <PlayIcon /> : <PauseIcon />
                ) : (
                  currentText ? <PlayIcon /> : <HeadphonesIcon />
                )}
                <Text style={styles.primaryButtonText}>
                  {isPlayingTTS ? (isPausedTTS ? 'Resume' : 'Pause') : 
                   currentText ? 'Play' : 'Read Page'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => onPlay?.('Test audio with CivicSense')}
              >
                <Text style={styles.iconText}>🧪</Text>
                <Text style={styles.controlButtonText}>Test</Text>
              </TouchableOpacity>
            </View>

            {/* Settings */}
            <View style={styles.quickSettings}>
              <Text style={styles.sectionTitle}>Audio Settings</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.iconText}>⚡</Text>
                  <Text style={styles.settingLabel}>Auto-play Content</Text>
                </View>
                <Switch
                  value={autoPlayEnabled}
                  onValueChange={onAutoPlayToggle}
                  trackColor={{ false: '#CCCCCC', true: '#E0A63E' }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.iconText}>🔁</Text>
                  <Text style={styles.settingLabel}>Loop Content</Text>
                </View>
                <Switch
                  value={loopEnabled}
                  onValueChange={onLoopToggle}
                  trackColor={{ false: '#CCCCCC', true: '#E0A63E' }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <VolumeIcon />
                  <Text style={styles.settingLabel}>Sound Effects</Text>
                </View>
                <Switch
                  value={soundEffectsEnabled}
                  onValueChange={onSoundEffectsToggle}
                  trackColor={{ false: '#CCCCCC', true: '#E0A63E' }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MusicIcon />
                  <Text style={styles.settingLabel}>Background Music</Text>
                </View>
                <Switch
                  value={backgroundMusicEnabled}
                  onValueChange={onBackgroundMusicToggle}
                  trackColor={{ false: '#CCCCCC', true: '#E0A63E' }}
                />
              </View>
            </View>

            {/* Translation Settings */}
            <View style={styles.translationSettings}>
              <Text style={styles.sectionTitle}>Translation Settings</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.iconText}>🌍</Text>
                  <Text style={styles.settingLabel}>Translation Enabled</Text>
                </View>
                <Switch
                  value={translationEnabled}
                  onValueChange={onTranslationToggle}
                  trackColor={{ false: '#CCCCCC', true: '#E0A63E' }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.iconText}>🌐</Text>
                  <Text style={styles.settingLabel}>Current Language</Text>
                </View>
                <Text style={styles.settingText}>{currentLanguage}</Text>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.iconText}>🔄</Text>
                  <Text style={styles.settingLabel}>Translation Cache Size</Text>
                </View>
                <Text style={styles.settingText}>{translationStatus.cacheSize} items</Text>
              </View>
            </View>

            {/* Info */}
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>🏛️ Civic Audio Features</Text>
              <Text style={styles.infoText}>
                • Text-to-speech for civic content{'\n'}
                • Quiz audio feedback{'\n'}
                • Background music for focus{'\n'}
                • Accessible design for all learners
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  minimizedContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    zIndex: 1000,
    alignItems: 'flex-end',
  },
  minimizedButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  miniControls: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  miniControlButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  controlsContainer: {
    backgroundColor: '#FDFCF9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.85,
    minHeight: screenHeight * 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1B1B',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: '#FFF5D9',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E0A63E',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E0A63E',
    marginBottom: 4,
  },
  currentText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  controlButton: {
    alignItems: 'center',
    padding: 12,
    minWidth: 80,
  },
  controlButtonText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#E0A63E',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 120,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  quickSettings: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1B1B1B',
    marginLeft: 8,
  },
  settingText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
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
  iconText: {
    fontSize: 20,
  },
  translationSettings: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
}); 