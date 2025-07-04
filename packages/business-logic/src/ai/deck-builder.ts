import type { QuizQuestion } from '@civicsense/types';
import { questionOperations } from '../quiz/quiz-operations';

interface DeckBuilderConfig {
  topic: string;
  category: string;
  questionCount: number;
  difficulty?: number;
  type?: 'multiple_choice' | 'true_false' | 'short_answer';
}

export class DeckBuilder {
  // Build a deck of questions
  async buildDeck(config: DeckBuilderConfig): Promise<QuizQuestion[]> {
    try {
      // Get questions from the database
      const dbQuestions = await questionOperations.getByTopic(config.topic);
      const questions = dbQuestions.map(q => questionOperations.toQuestionAppFormat(q));

      // Filter questions based on config
      let filteredQuestions = questions;

      // Filter by category
      if (config.category) {
        filteredQuestions = filteredQuestions.filter(q => q.category === config.category);
      }

      // Filter by type
      if (config.type) {
        filteredQuestions = filteredQuestions.filter(q => q.type === config.type);
      }

      // Filter by difficulty (if available)
      if (config.difficulty) {
        // TODO: Implement difficulty filtering once available
      }

      // Randomize and limit to requested count
      const shuffled = this.shuffleArray(filteredQuestions);
      return shuffled.slice(0, config.questionCount);
    } catch (error) {
      console.error('Error building deck:', error);
      return [];
    }
  }

  // Fisher-Yates shuffle algorithm
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = result[i]!;
      result[i] = result[j]!;
      result[j] = temp;
    }
    return result;
  }
} 