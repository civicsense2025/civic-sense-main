import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme-context';
import { QuizDataService } from '../../lib/quiz-data-service';
import { Text } from '../../components/atoms/Text';
import { Button } from '../../components/Button';
import { Card } from '../../components/ui/Card';
import { spacing, fontFamily } from '../../lib/theme';

export default function RapidFireQuizScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRapidFireQuiz();
  }, []);

  const loadRapidFireQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load quiz data to get all available topics
      const data = await QuizDataService.loadQuizData();
      
      if (!data.topics || data.topics.length === 0) {
        setError('No quiz topics available right now');
        return;
      }
      
      // Select 3-5 random topics for rapid fire
      const shuffledTopics = [...data.topics].sort(() => Math.random() - 0.5);
      const rapidFireTopics = shuffledTopics.slice(0, Math.min(4, shuffledTopics.length));
      
      if (rapidFireTopics.length === 0) {
        setError('Unable to create rapid fire quiz');
        return;
      }
      
      setSelectedTopics(rapidFireTopics);
      
      // Automatically navigate to first topic after a brief delay
      setTimeout(() => {
        startRapidFireQuiz(rapidFireTopics);
      }, 1500);
      
    } catch (error) {
      console.error('Error loading rapid fire quiz:', error);
      setError('Failed to load rapid fire quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startRapidFireQuiz = (topics: any[]) => {
    if (topics.length > 0) {
      // For rapid fire, we'll start with the first topic
      // The quiz session can handle multiple topics if we enhance it later
      const firstTopic = topics[0];
      router.replace(`/quiz-session/${firstTopic.id}?mode=rapid` as any);
    }
  };

  const startQuizNow = () => {
    if (selectedTopics.length > 0) {
      startRapidFireQuiz(selectedTopics);
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
            title: 'Rapid Fire Quiz',
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="title2" color="inherit" style={styles.loadingTitle}>
            Preparing Rapid Fire
          </Text>
          <Text variant="body" color="secondary" style={styles.loadingSubtitle}>
            Selecting random topics for quick questions...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || selectedTopics.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen 
          options={{
            title: 'Rapid Fire Quiz',
            headerShown: true,
          }}
        />
        <View style={styles.errorContainer}>
          <Text variant="title2" color="inherit" style={styles.errorTitle}>
            {error || 'Quiz Unavailable'}
          </Text>
          <Text variant="body" color="secondary" style={styles.errorMessage}>
            {error || 'Unable to prepare rapid fire quiz. Please check your connection and try again.'}
          </Text>
          <View style={styles.buttonContainer}>
            <Button
              title="Try Again"
              onPress={loadRapidFireQuiz}
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
          title: 'Rapid Fire Quiz',
          headerShown: true,
        }}
      />
      <View style={styles.content}>
        <Card style={styles.quizCard} variant="elevated">
          <View style={styles.quizHeader}>
            <Text style={styles.fireEmoji}>⚡</Text>
        <Text variant="title2" color="inherit" style={styles.title}>
          Rapid Fire Quiz
        </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Quick questions from multiple topics
            </Text>
          </View>
          
          <View style={styles.topicsPreview}>
            <Text variant="title3" color="inherit" style={styles.previewTitle}>
              Topics Selected:
            </Text>
            {selectedTopics.slice(0, 3).map((topic, index) => (
              <View key={topic.id} style={styles.topicItem}>
                <Text variant="callout" color="inherit" style={styles.topicName}>
                  • {topic.topic_title || topic.title}
                </Text>
              </View>
            ))}
            {selectedTopics.length > 3 && (
              <Text variant="footnote" color="secondary" style={styles.moreTopics}>
                +{selectedTopics.length - 3} more topics
              </Text>
            )}
          </View>
          
          <View style={styles.quizMeta}>
            <View style={styles.metaItem}>
              <Text variant="footnote" color="secondary">Format</Text>
              <Text variant="callout" color="inherit" style={styles.metaValue}>
                Mixed Topics
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text variant="footnote" color="secondary">Time</Text>
              <Text variant="callout" color="inherit" style={styles.metaValue}>
                30s per question
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
            title="Start Rapid Fire"
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
  fireEmoji: {
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
  topicsPreview: {
    marginBottom: spacing.lg,
  },
  previewTitle: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  topicItem: {
    marginBottom: spacing.xs,
  },
  topicName: {
    fontFamily: fontFamily.text,
  },
  moreTopics: {
    fontFamily: fontFamily.text,
    fontStyle: 'italic',
    marginTop: spacing.xs,
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