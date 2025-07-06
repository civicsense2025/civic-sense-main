import { supabase } from '../supabase';
import { CIVICS_TEST_QUESTIONS } from '../constants/civics-questions';
import type { 
  CivicsTestQuestion, 
  CivicsTestResults, 
  CivicsTestAnalytics,
  CivicsTestAnswer 
} from '../types/civics-test';

export class CivicsTestService {
  /**
   * Get randomized civics test questions
   */
  static getTestQuestions(count: number = 10, testType: 'practice' | 'official' | 'diagnostic' = 'practice'): CivicsTestQuestion[] {
    // Shuffle questions
    const shuffled = [...CIVICS_TEST_QUESTIONS].sort(() => Math.random() - 0.5);
    
    // Take the requested number
    return shuffled.slice(0, count);
  }

  /**
   * Calculate test results
   */
  static calculateResults(
    questions: CivicsTestQuestion[],
    answers: CivicsTestAnswer[],
    duration: number
  ): CivicsTestResults {
    const correctAnswers = answers.filter(a => a.isCorrect || a.isPartiallyCorrect);
    const score = Math.round((correctAnswers.length / questions.length) * 100);
    const passingScore = 60; // Standard civics test passing score

    // Calculate topic performance
    const topicMap = new Map<string, { correct: number; total: number }>();
    
    questions.forEach((q, index) => {
      const answer = answers.find(a => a.questionIndex === index);
      const topic = q.topic;
      
      if (!topicMap.has(topic)) {
        topicMap.set(topic, { correct: 0, total: 0 });
      }
      
      const topicData = topicMap.get(topic)!;
      topicData.total++;
      
      if (answer && (answer.isCorrect || answer.isPartiallyCorrect)) {
        topicData.correct++;
      }
    });

    const topics = Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      correct: data.correct,
      total: data.total,
      percentage: Math.round((data.correct / data.total) * 100)
    }));

    return {
      score,
      totalQuestions: questions.length,
      passingScore,
      passed: score >= passingScore,
      answers,
      completedAt: new Date().toISOString(),
      duration,
      topics
    };
  }

  /**
   * Save test results
   */
  static async saveTestResults(
    results: CivicsTestResults,
    testType: 'practice' | 'official' | 'diagnostic',
    userId?: string,
    guestToken?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('civics_test_attempts')
        .insert({
          user_id: userId,
          guest_token: guestToken,
          test_type: testType,
          score: results.score,
          total_questions: results.totalQuestions,
          passed: results.passed,
          duration: results.duration,
          topic_performance: results.topics,
          answers: results.answers,
          completed_at: results.completedAt
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving test results:', error);
      return null;
    }
  }

  /**
   * Get user's test history
   */
  static async getUserTestHistory(
    userId?: string,
    guestToken?: string
  ): Promise<CivicsTestResults[]> {
    try {
      const query = userId
        ? supabase.from('civics_test_attempts').select('*').eq('user_id', userId)
        : supabase.from('civics_test_attempts').select('*').eq('guest_token', guestToken);

      const { data, error } = await query
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data?.map(attempt => ({
        score: attempt.score,
        totalQuestions: attempt.total_questions,
        passingScore: 60,
        passed: attempt.passed,
        answers: attempt.answers || [],
        completedAt: attempt.completed_at,
        duration: attempt.duration,
        topics: attempt.topic_performance || []
      })) || [];
    } catch (error) {
      console.error('Error fetching test history:', error);
      return [];
    }
  }

  /**
   * Get analytics for user's civics test performance
   */
  static async getUserAnalytics(
    userId?: string,
    guestToken?: string
  ): Promise<CivicsTestAnalytics | null> {
    try {
      const history = await this.getUserTestHistory(userId, guestToken);
      
      if (history.length === 0) {
        return null;
      }

      // Calculate analytics
      const scores = history.map(h => h.score);
      const totalAttempts = history.length;
      const bestScore = Math.max(...scores);
      const averageScore = scores.reduce((a, b) => a + b, 0) / totalAttempts;
      const passRate = history.filter(h => h.passed).length / totalAttempts;
      const averageDuration = history.reduce((a, h) => a + h.duration, 0) / totalAttempts;

      // Topic performance aggregation
      const topicMap = new Map<string, { totalCorrect: number; totalQuestions: number }>();
      
      history.forEach(attempt => {
        attempt.topics.forEach(topic => {
          if (!topicMap.has(topic.topic)) {
            topicMap.set(topic.topic, { totalCorrect: 0, totalQuestions: 0 });
          }
          
          const data = topicMap.get(topic.topic)!;
          data.totalCorrect += topic.correct;
          data.totalQuestions += topic.total;
        });
      });

      const topicPerformance = Array.from(topicMap.entries()).map(([topic, data]) => ({
        topic,
        accuracy: Math.round((data.totalCorrect / data.totalQuestions) * 100),
        attempts: totalAttempts
      }));

      // Improvement tracking
      const firstScore = history[history.length - 1].score;
      const latestScore = history[0].score;
      const percentageImprovement = firstScore > 0 
        ? Math.round(((latestScore - firstScore) / firstScore) * 100)
        : 0;

      return {
        totalAttempts,
        bestScore,
        averageScore: Math.round(averageScore),
        passRate: Math.round(passRate * 100) / 100,
        averageDuration: Math.round(averageDuration),
        topicPerformance,
        improvement: {
          firstScore,
          latestScore,
          percentageImprovement
        }
      };
    } catch (error) {
      console.error('Error calculating analytics:', error);
      return null;
    }
  }

  /**
   * Check answer correctness
   */
  static checkAnswer(
    question: CivicsTestQuestion,
    userAnswer: string
  ): { isCorrect: boolean; isPartiallyCorrect: boolean } {
    // Normalize answers for comparison
    const normalize = (text: string) => 
      text.toLowerCase().trim().replace(/[.,!?]/g, '');

    const normalizedUserAnswer = normalize(userAnswer);
    const normalizedCorrectAnswer = normalize(question.correctAnswer);

    // Check for exact match
    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      return { isCorrect: true, isPartiallyCorrect: false };
    }

    // Check acceptable variations
    if (question.acceptableVariations) {
      const isAcceptable = question.acceptableVariations.some(
        variation => normalize(variation) === normalizedUserAnswer
      );
      
      if (isAcceptable) {
        return { isCorrect: true, isPartiallyCorrect: false };
      }
    }

    // Check for partial credit
    if (question.allowPartialCredit) {
      // Check if answer contains key parts of the correct answer
      const correctParts = normalizedCorrectAnswer.split(' ');
      const userParts = normalizedUserAnswer.split(' ');
      
      const matchingParts = correctParts.filter(part => 
        userParts.includes(part) && part.length > 3 // Ignore small words
      );
      
      if (matchingParts.length >= correctParts.length * 0.7) {
        return { isCorrect: false, isPartiallyCorrect: true };
      }
    }

    return { isCorrect: false, isPartiallyCorrect: false };
  }
} 