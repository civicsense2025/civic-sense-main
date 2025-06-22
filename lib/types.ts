export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Question {
  id: string
  text: string
  options: string[]
  correct_answer: number
  explanation?: string
  hint?: string
  difficulty: Difficulty
  category?: string
  tags?: string[]
  topic_id: string
  created_at: string
  updated_at: string
}

export interface QuestionTopic {
  topic_id: string
  topic_title: string
  description: string
  emoji?: string
  categories?: string[]
  difficulty: Difficulty
  is_published: boolean
  created_at: string
  updated_at: string
}

// Quiz Types
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number;
  timeTaken: number;
  questions: {
    question: QuizQuestion;
    userAnswer: string;
    isCorrect: boolean;
  }[];
}

// Admin Types
export interface AdminEditPanelProps {
  question: QuizQuestion;
  topic: string;
  onQuestionUpdate: (updatedQuestion: QuizQuestion) => void;
}

// User Types
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
} 