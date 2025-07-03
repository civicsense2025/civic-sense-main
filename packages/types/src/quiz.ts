// CivicSense Quiz Types
// Core quiz-related type definitions

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  type?: 'multiple-choice' | 'true-false' | 'matching';
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

export interface QuizAttempt {
  id: string;
  userId: string;
  topicId: string;
  score: number;
  completedAt: Date;
  answers: QuizAnswer[];
  timeSpent: number;
}

export interface QuizAnswer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  timeSpent: number;
}

export interface TopicMetadata {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  questionCount: number;
  tags: string[];
  prerequisites?: string[];
  category: string;
}

export interface QuizProgress {
  userId: string;
  topicId: string;
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  startedAt: Date;
  lastUpdated: Date;
  isComplete: boolean;
}

export interface QuizStats {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  totalTimeSpent: number;
  completionRate: number;
  strengthAreas: string[];
  improvementAreas: string[];
}

// Helper function to get question options in a type-safe way
export function getQuestionOptions(question: QuizQuestion): string[] {
  return question.options || [];
}

// Helper function to calculate quiz score
export function calculateQuizScore(answers: QuizAnswer[]): number {
  return answers.reduce((score, answer) => answer.isCorrect ? score + 1 : score, 0);
} 