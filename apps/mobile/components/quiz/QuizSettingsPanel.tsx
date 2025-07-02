import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Switch,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme-context';
import useUIStrings from '../../lib/hooks/useUIStrings';
import { Text } from '../atoms/Text';
import { spacing, borderRadius } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface QuizSettings {
  questionCount: number;
  timeLimit: number;
  showExplanations: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  hints: boolean;
  autoAdvance: boolean;
}

interface QuizSettingsPanelProps {
  settings: QuizSettings;
  onSettingsChange: (settings: QuizSettings) => void;
  visible: boolean;
  onClose: () => void;
  mode?: 'practice' | 'daily' | 'challenge' | 'rapid';
}

export function QuizSettingsPanel({
  settings,
  onSettingsChange,
  visible,
  onClose,
  mode = 'practice'
}: QuizSettingsPanelProps) {
  const { theme } = useTheme();
  const { uiStrings } = useUIStrings() || { uiStrings: { gameRoom: {}, quiz: {}, common: {} } };
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scaleValue = useRef(new Animated.Value(0.9)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  const DIFFICULTY_OPTIONS = [
    { key: 'easy' as const, label: uiStrings.quiz?.difficulty?.easy || 'Easy', icon: '🟢', color: '#10B981', description: uiStrings.topic?.easy || 'Basic concepts' },
    { key: 'normal' as const, label: uiStrings.topic?.medium || 'Normal', icon: '🟡', color: '#F59E0B', description: uiStrings.topic?.intermediate || 'Standard level' },
    { key: 'hard' as const, label: uiStrings.quiz?.difficulty?.hard || 'Hard', icon: '🔴', color: '#EF4444', description: uiStrings.topic?.advanced || 'Advanced topics' },
  ];

  const PRESET_OPTIONS = [
    { questionCount: 5, timeLimit: 30, label: 'Quick', icon: 'flash', description: '~3 min' },
    { questionCount: 10, timeLimit: 45, label: 'Standard', icon: 'layers', description: '~8 min' },
    { questionCount: 20, timeLimit: 60, label: 'Deep Dive', icon: 'library', description: '~20 min' },
  ];

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const updateSetting = <K extends keyof QuizSettings>(
    key: K,
    value: QuizSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const applyPreset = (preset: typeof PRESET_OPTIONS[0]) => {
    onSettingsChange({
      ...settings,
      questionCount: preset.questionCount,
      timeLimit: preset.timeLimit,
    });
  };

  const isReadOnly = mode !== 'practice';
  const estimatedTime = Math.ceil((settings.questionCount * settings.timeLimit) / 60);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityValue }]}>
        <TouchableOpacity 
          style={styles.backdropTouch} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: theme.background,
              paddingBottom: insets.bottom + spacing.md,
              transform: [{ translateY }, { scale: scaleValue }],
            },
          ]}
        >
          {/* Compact Header */}
          <View style={styles.compactHeader}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
            
            <View style={styles.headerRow}>
              <View style={styles.headerInfo}>
                <View style={styles.headerTitle}>
                  <Ionicons name="settings-outline" size={20} color={theme.primary} />
                  <Text variant="title3" color="inherit" style={styles.titleText}>
                    {uiStrings.gameRoom?.settings || 'Settings'}
                  </Text>
                </View>
                
                <View style={styles.estimateChip}>
                  <Ionicons name="time-outline" size={12} color={theme.primary} />
                  <Text variant="caption1" color="primary" style={styles.estimateText}>
                    ~{estimatedTime} min
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.closeButton, { backgroundColor: theme.card }]}
                onPress={onClose}
              >
                <Ionicons name="close" size={18} color={theme.foregroundSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Compact Content */}
          <View style={styles.compactContent}>
            {/* Preset Selection */}
            <View style={styles.section}>
              <Text variant="callout" color="inherit" style={styles.sectionTitle}>
                Quick Setup
              </Text>
              <View style={styles.presetGrid}>
                {PRESET_OPTIONS.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={[
                      styles.presetCard,
                      {
                        backgroundColor: settings.questionCount === preset.questionCount && 
                                       settings.timeLimit === preset.timeLimit
                          ? theme.primary + '15' 
                          : theme.card,
                        borderColor: settings.questionCount === preset.questionCount && 
                                   settings.timeLimit === preset.timeLimit
                          ? theme.primary 
                          : theme.border,
                      },
                    ]}
                    onPress={() => applyPreset(preset)}
                    disabled={isReadOnly}
                  >
                    <Ionicons 
                      name={preset.icon as any} 
                      size={16} 
                      color={theme.primary} 
                    />
                    <Text variant="footnote" color="inherit" style={styles.presetLabel}>
                      {preset.label}
                    </Text>
                    <Text variant="caption1" color="secondary" style={styles.presetDesc}>
                      {preset.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Compact Settings Grid */}
            <View style={styles.section}>
              <Text variant="callout" color="inherit" style={styles.sectionTitle}>
                Customize
              </Text>
              
              <View style={styles.settingsGrid}>
                {/* Questions & Time Row */}
                <View style={styles.settingRow}>
                  <View style={styles.compactSetting}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="help-circle-outline" size={14} color={theme.primary} />
                      <Text variant="footnote" color="inherit" style={styles.compactLabel}>
                        {uiStrings.quiz?.questions || 'Questions'}
                      </Text>
                    </View>
                    <View style={styles.compactCounter}>
                      <TouchableOpacity
                        style={[styles.miniButton, { borderColor: theme.border }]}
                        onPress={() => updateSetting('questionCount', Math.max(5, settings.questionCount - 5))}
                        disabled={isReadOnly || settings.questionCount <= 5}
                      >
                        <Ionicons name="remove" size={12} color={theme.foreground} />
                      </TouchableOpacity>
                      <Text variant="callout" color="inherit" style={styles.counterValue}>
                        {settings.questionCount}
                      </Text>
                      <TouchableOpacity
                        style={[styles.miniButton, { borderColor: theme.border }]}
                        onPress={() => updateSetting('questionCount', Math.min(30, settings.questionCount + 5))}
                        disabled={isReadOnly || settings.questionCount >= 30}
                      >
                        <Ionicons name="add" size={12} color={theme.foreground} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.compactSetting}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="timer-outline" size={14} color={theme.primary} />
                      <Text variant="footnote" color="inherit" style={styles.compactLabel}>
                        {uiStrings.gameRoom?.timeLimit || 'Time/Q'}
                      </Text>
                    </View>
                    <View style={styles.compactCounter}>
                      <TouchableOpacity
                        style={[styles.miniButton, { borderColor: theme.border }]}
                        onPress={() => updateSetting('timeLimit', Math.max(15, settings.timeLimit - 15))}
                        disabled={isReadOnly || settings.timeLimit <= 15}
                      >
                        <Ionicons name="remove" size={12} color={theme.foreground} />
                      </TouchableOpacity>
                      <Text variant="callout" color="inherit" style={styles.counterValue}>
                        {settings.timeLimit}s
                      </Text>
                      <TouchableOpacity
                        style={[styles.miniButton, { borderColor: theme.border }]}
                        onPress={() => updateSetting('timeLimit', Math.min(90, settings.timeLimit + 15))}
                        disabled={isReadOnly || settings.timeLimit >= 90}
                      >
                        <Ionicons name="add" size={12} color={theme.foreground} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Difficulty Pills */}
                <View style={styles.difficultySection}>
                  <Text variant="footnote" color="inherit" style={styles.compactLabel}>
                    {uiStrings.topic?.difficulty || 'Difficulty'}
                  </Text>
                  <View style={styles.difficultyPills}>
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.difficultyPill,
                          {
                            backgroundColor: settings.difficulty === option.key 
                              ? option.color 
                              : theme.card,
                            borderColor: settings.difficulty === option.key 
                              ? option.color 
                              : theme.border,
                          },
                        ]}
                        onPress={() => updateSetting('difficulty', option.key)}
                        disabled={isReadOnly}
                      >
                        <Text style={styles.difficultyEmoji}>{option.icon}</Text>
                        <Text
                          variant="caption1"
                          style={[
                            styles.difficultyText,
                            {
                              color: settings.difficulty === option.key 
                                ? 'white' 
                                : theme.foreground,
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Compact Toggles */}
                <View style={styles.toggleGrid}>
                  <View style={styles.compactToggle}>
                    <View style={styles.toggleHeader}>
                      <Ionicons name="bulb-outline" size={14} color={theme.primary} />
                      <Text variant="caption1" color="inherit" style={styles.toggleText}>
                        {uiStrings.gameRoom?.showExplanations || 'Explanations'}
                      </Text>
                    </View>
                    <Switch
                      value={settings.showExplanations}
                      onValueChange={(value) => updateSetting('showExplanations', value)}
                      disabled={isReadOnly}
                      trackColor={{ false: theme.border, true: theme.primary + '40' }}
                      thumbColor={settings.showExplanations ? theme.primary : theme.foregroundSecondary}
                      style={styles.compactSwitch}
                    />
                  </View>

                  <View style={styles.compactToggle}>
                    <View style={styles.toggleHeader}>
                      <Ionicons name="help-circle-outline" size={14} color={theme.primary} />
                      <Text variant="caption1" color="inherit" style={styles.toggleText}>
                        {uiStrings.multiplayer?.hints || 'Hints'}
                      </Text>
                    </View>
                    <Switch
                      value={settings.hints}
                      onValueChange={(value) => updateSetting('hints', value)}
                      disabled={isReadOnly}
                      trackColor={{ false: theme.border, true: theme.primary + '40' }}
                      thumbColor={settings.hints ? theme.primary : theme.foregroundSecondary}
                      style={styles.compactSwitch}
                    />
                  </View>

                  <View style={styles.compactToggle}>
                    <View style={styles.toggleHeader}>
                      <Ionicons name="play-forward-outline" size={14} color={theme.primary} />
                      <Text variant="caption1" color="inherit" style={styles.toggleText}>
                        Auto Next
                      </Text>
                    </View>
                    <Switch
                      value={settings.autoAdvance}
                      onValueChange={(value) => updateSetting('autoAdvance', value)}
                      disabled={isReadOnly}
                      trackColor={{ false: theme.border, true: theme.primary + '40' }}
                      thumbColor={settings.autoAdvance ? theme.primary : theme.foregroundSecondary}
                      style={styles.compactSwitch}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// Ultra-compact settings chip
export function SettingsChip({
  settings,
  onPress,
  style,
}: {
  settings: QuizSettings;
  onPress: () => void;
  style?: any;
}) {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.settingsChip,
        { backgroundColor: theme.card, borderColor: theme.border },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.chipContent}>
                 <Ionicons name="settings-outline" size={14} color={theme.primary} />
        <Text variant="caption1" color="secondary" style={styles.chipText}>
          {settings.questionCount}Q • {settings.timeLimit}s • {settings.difficulty}
        </Text>
        <Ionicons name="chevron-down" size={12} color={theme.foregroundSecondary} />
      </View>
    </TouchableOpacity>
  );
}

// Inline settings strip for minimal space usage
export function SettingsStrip({
  settings,
  onSettingsChange,
  compact = false,
}: {
  settings: QuizSettings;
  onSettingsChange: (settings: QuizSettings) => void;
  compact?: boolean;
}) {
  const { theme } = useTheme();
  const { uiStrings } = useUIStrings() || { uiStrings: { gameRoom: {}, quiz: {}, common: {} } };

  const DIFFICULTY_OPTIONS = [
    { key: 'easy' as const, label: uiStrings.quiz?.difficulty?.easy || 'Easy', icon: '🟢', color: '#10B981', description: uiStrings.topic?.easy || 'Basic concepts' },
    { key: 'normal' as const, label: uiStrings.topic?.medium || 'Normal', icon: '🟡', color: '#F59E0B', description: uiStrings.topic?.intermediate || 'Standard level' },
    { key: 'hard' as const, label: uiStrings.quiz?.difficulty?.hard || 'Hard', icon: '🔴', color: '#EF4444', description: uiStrings.topic?.advanced || 'Advanced topics' },
  ];

  return (
    <View style={[
      styles.settingsStrip,
      { backgroundColor: theme.card },
      compact && styles.settingsStripCompact,
    ]}>
      <View style={styles.stripRow}>
        <View style={styles.stripItem}>
          <Text variant="caption1" color="secondary">Q</Text>
          <View style={styles.miniCounter}>
            <TouchableOpacity
              style={styles.tinyButton}
              onPress={() => onSettingsChange({ ...settings, questionCount: Math.max(5, settings.questionCount - 5) })}
            >
              <Ionicons name="remove" size={10} color={theme.foreground} />
            </TouchableOpacity>
            <Text variant="caption1" color="inherit" style={styles.tinyValue}>
              {settings.questionCount}
            </Text>
            <TouchableOpacity
              style={styles.tinyButton}
              onPress={() => onSettingsChange({ ...settings, questionCount: Math.min(30, settings.questionCount + 5) })}
            >
              <Ionicons name="add" size={10} color={theme.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stripDivider} />

        <View style={styles.stripItem}>
          <Text variant="caption1" color="secondary">T</Text>
          <View style={styles.miniCounter}>
            <TouchableOpacity
              style={styles.tinyButton}
              onPress={() => onSettingsChange({ ...settings, timeLimit: Math.max(15, settings.timeLimit - 15) })}
            >
              <Ionicons name="remove" size={10} color={theme.foreground} />
            </TouchableOpacity>
            <Text variant="caption1" color="inherit" style={styles.tinyValue}>
              {settings.timeLimit}
            </Text>
            <TouchableOpacity
              style={styles.tinyButton}
              onPress={() => onSettingsChange({ ...settings, timeLimit: Math.min(90, settings.timeLimit + 15) })}
            >
              <Ionicons name="add" size={10} color={theme.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stripDivider} />

        <View style={styles.stripItem}>
          <Text variant="caption1" color="secondary">D</Text>
          <TouchableOpacity
            style={[styles.difficultyTiny, { borderColor: theme.border }]}
            onPress={() => {
              const options = ['easy', 'normal', 'hard'] as const;
              const currentIndex = options.indexOf(settings.difficulty);
              const nextIndex = (currentIndex + 1) % options.length;
              const nextDifficulty = options[nextIndex];
              if (nextDifficulty) {
                onSettingsChange({ ...settings, difficulty: nextDifficulty });
              }
            }}
          >
            <Text style={styles.difficultyTinyIcon}>
              {DIFFICULTY_OPTIONS.find((d: any) => d.key === settings.difficulty)?.icon || '🟡'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  panel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },

  // Compact Header
  compactHeader: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  titleText: {
    fontWeight: '600',
  },
  estimateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  estimateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Compact Content
  compactContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },

  // Sections
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },

  // Preset Grid
  presetGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  presetLabel: {
    fontWeight: '600',
  },
  presetDesc: {
    fontSize: 10,
  },

  // Settings Grid
  settingsGrid: {
    gap: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  compactSetting: {
    flex: 1,
    gap: spacing.xs,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactLabel: {
    fontWeight: '500',
    fontSize: 12,
  },
  compactCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  miniButton: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    minWidth: 40,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Difficulty Section
  difficultySection: {
    gap: spacing.xs,
  },
  difficultyPills: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  difficultyPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  difficultyEmoji: {
    fontSize: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Toggle Grid
  toggleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  compactToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    minWidth: '45%',
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  compactSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },

  // Settings Chip
  settingsChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Settings Strip
  settingsStrip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginVertical: 4,
  },
  settingsStripCompact: {
    paddingVertical: 6,
  },
  stripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stripItem: {
    alignItems: 'center',
    gap: 4,
  },
  stripDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  miniCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tinyButton: {
    width: 18,
    height: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  tinyValue: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },
  difficultyTiny: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyTinyIcon: {
    fontSize: 10,
  },
}); 