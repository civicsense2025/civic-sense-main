import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme-context';
import { QuizDataService } from '../../lib/quiz-data-service';
import { Text } from '../../components/atoms/Text';
import { Button } from '../../components/Button';
import { Card } from '../../components/ui/Card';
import { spacing, fontFamily } from '../../lib/theme';

export default function DailyQuizScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [todaysTopic, setTodaysTopic] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDailyQuiz();
  }, []);

  const loadDailyQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load daily topics and get today's topic
      const dailyTopics = await QuizDataService.loadDailyTopics(1);
      
      if (dailyTopics.length === 0) {
        setError('No daily quiz available right now');
        return;
      }
      
      const todayTopic = dailyTopics[0];
      if (!todayTopic) {
        setError('No daily quiz topic available');
        return;
      }
      
      setTodaysTopic(todayTopic);
      
      // Automatically navigate to quiz session after a brief delay
      setTimeout(() => {
        router.replace(`/quiz-session/${todayTopic.id}?mode=daily` as any);
      }, 1500);
      
    } catch (error) {
      console.error('Error loading daily quiz:', error);
      setError('Failed to load today\'s quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startQuizNow = () => {
    if (todaysTopic) {
      router.replace(`/quiz-session/${todaysTopic.id}?mode=daily` as any);
    }
  };

  const goBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen 
          options={{
            title: 'Daily Quiz',
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="title2" color="inherit" style={styles.loadingTitle}>
            Loading Today's Quiz
          </Text>
          <Text variant="body" color="secondary" style={styles.loadingSubtitle}>
            Preparing your daily challenge...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !todaysTopic) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen 
          options={{
            title: 'Daily Quiz',
            headerShown: true,
          }}
        />
        <View style={styles.errorContainer}>
          <Text variant="title2" color="inherit" style={styles.errorTitle}>
            {error || 'Quiz Unavailable'}
          </Text>
          <Text variant="body" color="secondary" style={styles.errorMessage}>
            {error || 'Unable to load today\'s quiz. Please check your connection and try again.'}
          </Text>
          <View style={styles.buttonContainer}>
            <Button
              title="Try Again"
              onPress={loadDailyQuiz}
              variant="primary"
              style={styles.retryButton}
            />
            <Button
              title="Go Back"
              onPress={goBack}
              variant="secondary"
              style={styles.backButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: 'Daily Quiz',
          headerShown: true,
        }}
      />
      <View style={styles.content}>
        <Card style={styles.quizCard} variant="elevated">
          <View style={styles.quizHeader}>
            <Text style={styles.dateEmoji}>📅</Text>
        <Text variant="title2" color="inherit" style={styles.title}>
              Today's Quiz
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
          
          <View style={styles.topicInfo}>
            <Text variant="title3" color="inherit" style={styles.topicTitle}>
              {todaysTopic.topic_title || todaysTopic.title}
            </Text>
            {todaysTopic.description && (
              <Text variant="body" color="secondary" style={styles.topicDescription}>
                {todaysTopic.description}
              </Text>
            )}
          </View>
          
          <View style={styles.quizMeta}>
            <View style={styles.metaItem}>
              <Text variant="footnote" color="secondary">Difficulty</Text>
              <Text variant="callout" color="inherit" style={styles.metaValue}>
                {todaysTopic.difficulty_level <= 2 ? 'Easy' : 
                 todaysTopic.difficulty_level <= 4 ? 'Medium' : 'Hard'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text variant="footnote" color="secondary">Questions</Text>
              <Text variant="callout" color="inherit" style={styles.metaValue}>
                ~10 questions
        </Text>
            </View>
          </View>
          
          <Button
            title="Start Quiz Now"
            onPress={startQuizNow}
            variant="primary"
            style={styles.startButton}
          />
        </Card>
        
        <Text variant="footnote" color="secondary" style={styles.autoStartNote}>
          Quiz will start automatically in a moment...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingTitle: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontFamily: fontFamily.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  retryButton: {
    width: '100%',
  },
  backButton: {
    width: '100%',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  quizCard: {
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  quizHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dateEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
  },
  topicInfo: {
    marginBottom: spacing.lg,
  },
  topicTitle: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  topicDescription: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  quizMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaValue: {
    fontFamily: fontFamily.text,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  startButton: {
    width: '100%',
  },
  autoStartNote: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 