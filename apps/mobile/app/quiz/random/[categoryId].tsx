import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/theme-context';
import { getQuestionTopics } from '../../../lib/database';
import { Text } from '../../../components/atoms/Text';
import { QuestionResponseService } from '../../../lib/services/question-response-service';

export default function RandomQuizScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();

  useEffect(() => {
    startRandomQuiz();
  }, [categoryId]);

  const startRandomQuiz = async () => {
    try {
      if (!categoryId) {
        router.back();
        return;
      }

      // Get all topics for this category
      const topics = await getQuestionTopics(categoryId);
      
      if (topics.length === 0) {
        router.back();
        return;
      }

      // Select a random topic
      const randomIndex = Math.floor(Math.random() * topics.length);
      const randomTopic = topics[randomIndex];
      
      if (!randomTopic) {
        router.back();
        return;
      }
      
      // Navigate to quiz session for the random topic
      router.replace(`/quiz-session/${randomTopic.id}` as any);
    } catch (error) {
      console.error('Error starting random quiz:', error);
      router.back();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text variant="body" color="secondary" style={{ marginTop: 16 }}>
          Starting quiz...
        </Text>
      </View>
    </SafeAreaView>
  );
} 