// CivicSense Assessment Types
// Assessment and evaluation system types

export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: AssessmentType;
  format: AssessmentFormat;
  duration: number;
  totalPoints: number;
  passingScore: number;
  sections: AssessmentSection[];
  rubric?: AssessmentRubric;
  settings: AssessmentSettings;
}

export type AssessmentType =
  | 'placement'
  | 'diagnostic'
  | 'formative'
  | 'summative'
  | 'certification';

export type AssessmentFormat =
  | 'quiz'
  | 'project'
  | 'presentation'
  | 'essay'
  | 'portfolio'
  | 'practical';

export interface AssessmentSection {
  id: string;
  title: string;
  description: string;
  weight: number;
  questions: AssessmentQuestion[];
  timeLimit?: number;
  order: number;
}

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  content: string;
  points: number;
  options?: string[];
  correctAnswer?: any;
  rubricCriteria?: RubricCriterion[];
  tags: string[];
}

export type QuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'short-answer'
  | 'essay'
  | 'matching'
  | 'ranking'
  | 'file-upload';

export interface AssessmentRubric {
  criteria: RubricCriterion[];
  levels: RubricLevel[];
  totalPoints: number;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  description: string;
  examples?: string[];
}

export interface AssessmentSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showFeedback: boolean;
  allowReview: boolean;
  timeLimit?: number;
  maxAttempts?: number;
  gradingType: 'automatic' | 'manual' | 'hybrid';
}

export interface AssessmentAttempt {
  id: string;
  userId: string;
  assessmentId: string;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  answers: AssessmentAnswer[];
  feedback?: AssessmentFeedback;
  status: AttemptStatus;
}

export interface AssessmentAnswer {
  questionId: string;
  response: any;
  score?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: Date;
}

export interface AssessmentFeedback {
  overallComment: string;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  gradedBy: string;
  gradedAt: Date;
}

export type AttemptStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'graded'
  | 'failed'
  | 'passed'; 