import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../atoms/Text';
import { spacing } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { 
  QuizSettingsPanel, 
  SettingsChip, 
  SettingsStrip,
  type QuizSettings 
} from './QuizSettingsPanel';

// Example usage in a quiz preparation screen
export function QuizPreparationScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [settingsVisible, setSettingsVisible] = useState(false);
  
  // Default quiz settings
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({
    questionCount: 10,
    timeLimit: 30,
    showExplanations: true,
    difficulty: 'normal',
    hints: true,
    autoAdvance: false,
  });

  const handleStartQuiz = () => {
    // Pass settings as URL params to the quiz session
    const params = new URLSearchParams({
      questionCount: quizSettings.questionCount.toString(),
      timeLimit: quizSettings.timeLimit.toString(),
      showExplanations: quizSettings.showExplanations.toString(),
      difficulty: quizSettings.difficulty,
      hints: quizSettings.hints.toString(),
      autoAdvance: quizSettings.autoAdvance.toString(),
    });

    router.push(`/quiz-session/topic-123?${params.toString()}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </TouchableOpacity>
          <Text variant="title1" color="inherit" style={styles.title}>
            Civic Quiz
          </Text>
        </View>

        {/* Topic Card */}
        <View style={[styles.topicCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text variant="title3" color="inherit" style={styles.topicTitle}>
            Constitutional Foundations
          </Text>
          <Text variant="body" color="secondary" style={styles.topicDescription}>
            Test your knowledge about the fundamental principles and structure of the U.S. Constitution.
          </Text>
        </View>

        {/* Compact Settings - Option 1: Settings Chip */}
        <View style={styles.settingsSection}>
          <Text variant="callout" color="inherit" style={styles.sectionTitle}>
            Quiz Setup
          </Text>
          
          <SettingsChip
            settings={quizSettings}
            onPress={() => setSettingsVisible(true)}
            style={styles.settingsChip}
          />
        </View>

        {/* Alternative - Option 2: Inline Settings Strip */}
        <View style={styles.settingsSection}>
          <Text variant="callout" color="inherit" style={styles.sectionTitle}>
            Quick Customize
          </Text>
          
          <SettingsStrip
            settings={quizSettings}
            onSettingsChange={setQuizSettings}
            compact={true}
          />
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            { backgroundColor: theme.primary, borderColor: theme.primary }
          ]}
          onPress={handleStartQuiz}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={24} color="white" />
          <Text variant="title3" style={styles.startButtonText}>
            Start Quiz
          </Text>
          <View style={styles.estimateChip}>
            <Text variant="caption1" style={styles.estimateText}>
              ~{Math.ceil((quizSettings.questionCount * quizSettings.timeLimit) / 60)}min
            </Text>
          </View>
        </TouchableOpacity>

        {/* Additional Info */}
        <View style={styles.infoCards}>
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Ionicons name="trophy-outline" size={20} color={theme.primary} />
            <Text variant="footnote" color="secondary">
              Earn XP and improve your civic knowledge score
            </Text>
          </View>
          
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Ionicons name="people-outline" size={20} color={theme.primary} />
            <Text variant="footnote" color="secondary">
              Compare with other learners in real-time
            </Text>
          </View>
        </View>
      </View>

      {/* Full Settings Modal */}
      <QuizSettingsPanel
        visible={settingsVisible}
        settings={quizSettings}
        onSettingsChange={setQuizSettings}
        onClose={() => setSettingsVisible(false)}
        mode="practice"
      />
    </SafeAreaView>
  );
}

// Example usage in an active quiz header
export function QuizHeaderWithSettings({ 
  settings, 
  onSettingsChange,
  currentQuestion,
  totalQuestions,
  score,
  timeRemaining,
}: {
  settings: QuizSettings;
  onSettingsChange: (settings: QuizSettings) => void;
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  timeRemaining: number;
}) {
  const { theme } = useTheme();
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <View style={styles.quizHeader}>
      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: theme.border }]}>
        <View 
          style={[
            styles.progressBar, 
            { 
              backgroundColor: theme.primary,
              width: `${(currentQuestion / totalQuestions) * 100}%`
            }
          ]} 
        />
      </View>

      {/* Header Info Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text variant="callout" color="inherit" style={styles.questionCounter}>
            {currentQuestion} of {totalQuestions}
          </Text>
          <Text variant="footnote" color="secondary">
            Score: {score}
          </Text>
        </View>

        <View style={styles.headerCenter}>
          <Text variant="title2" color="primary" style={styles.timer}>
            {timeRemaining}s
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setSettingsVisible(true)}
          >
            <Ionicons name="settings-outline" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Compact Settings Strip - Only show if not in assessment mode */}
      {settings.hints && (
        <SettingsStrip
          settings={settings}
          onSettingsChange={onSettingsChange}
          compact={true}
        />
      )}

      <QuizSettingsPanel
        visible={settingsVisible}
        settings={settings}
        onSettingsChange={onSettingsChange}
        onClose={() => setSettingsVisible(false)}
        mode="practice"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontWeight: '700',
    flex: 1,
  },

  // Topic Card
  topicCard: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
  },
  topicTitle: {
    fontWeight: '600',
  },
  topicDescription: {
    lineHeight: 20,
  },

  // Settings Section
  settingsSection: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  settingsChip: {
    alignSelf: 'flex-start',
  },

  // Start Button
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    borderWidth: 2,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  startButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  estimateChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    position: 'absolute',
    right: spacing.md,
  },
  estimateText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },

  // Info Cards
  infoCards: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
  },

  // Quiz Header
  quizHeader: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressContainer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  questionCounter: {
    fontWeight: '600',
  },
  timer: {
    fontWeight: '700',
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 