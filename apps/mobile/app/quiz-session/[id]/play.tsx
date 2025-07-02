import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../lib/theme-context';
import { Text } from '../../../components/atoms/Text';
import { spacing, fontFamily } from '../../../lib/theme';

export default function QuizPlayScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    id: string;
    mode?: string;
    timeLimit?: string;
    showExplanations?: string;
    questionCount?: string;
    hints?: string;
    topicTitle?: string;
  }>();

  useEffect(() => {
    // Validate parameters before redirecting
    if (!params.id) {
      console.error('❌ Quiz Play: Missing quiz ID');
      router.back();
      return;
    }

    // Immediately navigate to quiz session (no delay to prevent double loading)
    try {
      const queryParams = new URLSearchParams({
        mode: params.mode || 'practice',
        timeLimit: params.timeLimit || '30',
        showExplanations: params.showExplanations || 'true',
        questionCount: params.questionCount || '10',
        hints: params.hints || 'true',
        topicTitle: params.topicTitle || 'Quiz',
      }).toString();

      console.log('🎮 Quiz Play: Redirecting to quiz session with params:', queryParams);
      router.replace(`/quiz-session/${params.id}?${queryParams}` as any);
    } catch (error) {
      console.error('❌ Quiz Play: Error during redirect:', error);
      router.back();
    }
  }, []); // Empty dependency array - only run once on mount

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.foreground }]}>
          Starting Quiz...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fontFamily.text,
  },
}); 