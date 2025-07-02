export interface CivicsTestQuestion {
  id: string;
  question: string;
  topic: string;
  correctAnswer: string;
  possibleAnswers: string[];
  allowPartialCredit: boolean;
  acceptableVariations?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
}

export interface CivicsTestAnswer {
  questionIndex: number;
  answer: string;
  isCorrect: boolean;
  isPartiallyCorrect?: boolean;
  time: number;
}

export interface CivicsTestResults {
  score: number;
  totalQuestions: number;
  passingScore: number;
  passed: boolean;
  answers: CivicsTestAnswer[];
  completedAt: string;
  duration: number;
  topics: {
    topic: string;
    correct: number;
    total: number;
    percentage: number;
  }[];
}

export interface CivicsTestState {
  questions: CivicsTestQuestion[];
  currentQuestionIndex: number;
  answers: CivicsTestAnswer[];
  isComplete: boolean;
  startTime: number;
  streak: number;
  maxStreak: number;
  responseTimes: number[];
  assessmentId?: string;
  testType: 'practice' | 'official' | 'diagnostic';
}

export interface CivicsTestProgress {
  currentQuestionIndex: number;
  answers: CivicsTestAnswer[];
  streak: number;
  maxStreak: number;
  startTime: number;
  responseTimes: number[];
}

export interface CivicsTestAnalytics {
  totalAttempts: number;
  bestScore: number;
  averageScore: number;
  passRate: number;
  averageDuration: number;
  topicPerformance: {
    topic: string;
    accuracy: number;
    attempts: number;
  }[];
  improvement: {
    firstScore: number;
    latestScore: number;
    percentageImprovement: number;
  };
} 