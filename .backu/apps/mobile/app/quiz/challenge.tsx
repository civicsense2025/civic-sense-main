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

export default function ChallengeQuizScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [challengeTopic, setChallengeTopic] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChallengeQuiz();
  }, []);

  const loadChallengeQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load quiz data to get all available topics
      const data = await QuizDataService.loadQuizData();
      
      if (!data.topics || data.topics.length === 0) {
        setError('No quiz topics available right now');
        return;
      }

      // Filter for challenging topics (difficulty level 3 or higher)
      const challengingTopics = data.topics.filter(topic => 
        topic.difficulty_level && topic.difficulty_level >= 3
      );
      
      // If no challenging topics, fall back to all topics
      const availableTopics = challengingTopics.length > 0 ? challengingTopics : data.topics;
      
      // Select a random challenging topic
      const randomIndex = Math.floor(Math.random() * availableTopics.length);
      const selectedTopic = availableTopics[randomIndex];
      
      if (!selectedTopic) {
        setError('Unable to create challenge quiz');
        return;
      }
      
      setChallengeTopic(selectedTopic);
      
      // Automatically navigate to quiz session after a brief delay
      setTimeout(() => {
      router.replace(`/quiz-session/${selectedTopic.id}?mode=challenge` as any);
      }, 1500);
      
    } catch (error) {
      console.error('Error loading challenge quiz:', error);
      setError('Failed to load challenge quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startQuizNow = () => {
    if (challengeTopic) {
      router.replace(`/quiz-session/${challengeTopic.id}?mode=challenge` as any);
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
            title: 'Challenge Quiz',
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="title2" color="inherit" style={styles.loadingTitle}>
            Preparing Challenge
          </Text>
          <Text variant="body" color="secondary" style={styles.loadingSubtitle}>
            Finding the most challenging questions...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !challengeTopic) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen 
          options={{
            title: 'Challenge Quiz',
            headerShown: true,
          }}
        />
        <View style={styles.errorContainer}>
          <Text variant="title2" color="inherit" style={styles.errorTitle}>
            {error || 'Challenge Unavailable'}
          </Text>
          <Text variant="body" color="secondary" style={styles.errorMessage}>
            {error || 'Unable to prepare challenge quiz. Please check your connection and try again.'}
          </Text>
          <View style={styles.buttonContainer}>
            <Button
              title="Try Again"
              onPress={loadChallengeQuiz}
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

  const getDifficultyLevel = (level: number) => {
    if (level <= 2) return { label: 'Easy', color: '#10B981' };
    if (level <= 4) return { label: 'Medium', color: '#F59E0B' };
    return { label: 'Hard', color: '#EF4444' };
  };

  const difficulty = getDifficultyLevel(challengeTopic.difficulty_level || 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: 'Challenge Quiz',
          headerShown: true,
        }}
      />
      <View style={styles.content}>
        <Card style={styles.quizCard} variant="elevated">
          <View style={styles.quizHeader}>
            <Text style={styles.challengeEmoji}>🎯</Text>
            <Text variant="title2" color="inherit" style={styles.title}>
              Challenge Quiz
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Test your advanced knowledge
            </Text>
          </View>
          
          <View style={styles.topicInfo}>
            <Text variant="title3" color="inherit" style={styles.topicTitle}>
              {challengeTopic.topic_title || challengeTopic.title}
            </Text>
            {challengeTopic.description && (
              <Text variant="body" color="secondary" style={styles.topicDescription}>
                {challengeTopic.description}
              </Text>
            )}
          </View>
          
          <View style={styles.difficultyBadge}>
            <View style={[styles.difficultyIndicator, { backgroundColor: difficulty.color }]} />
            <Text variant="callout" color="inherit" style={styles.difficultyText}>
              {difficulty.label} Level
            </Text>
          </View>
          
          <View style={styles.quizMeta}>
            <View style={styles.metaItem}>
              <Text variant="footnote" color="secondary">Format</Text>
              <Text variant="callout" color="inherit" style={styles.metaValue}>
                Advanced Questions
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text variant="footnote" color="secondary">Time</Text>
              <Text variant="callout" color="inherit" style={styles.metaValue}>
                45s per question
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text variant="footnote" color="secondary">Questions</Text>
              <Text variant="callout" color="inherit" style={styles.metaValue}>
                ~10 questions
              </Text>
            </View>
          </View>
          
          <View style={styles.warningBox}>
            <Text variant="footnote" color="secondary" style={styles.warningText}>
              ⚠️ This challenge contains advanced civic concepts and may require deeper knowledge of government and politics.
        </Text>
          </View>
          
          <Button
            title="Accept Challenge"
            onPress={startQuizNow}
            variant="primary"
            style={styles.startButton}
          />
        </Card>
        
        <Text variant="footnote" color="secondary" style={styles.autoStartNote}>
          Challenge will start automatically in a moment...
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
  challengeEmoji: {
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
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  difficultyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  difficultyText: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
  quizMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
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
  warningBox: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  warningText: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
    lineHeight: 18,
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