// CivicSense Lesson Steps Types
// Lesson content and progression types

export interface LessonStep {
  id: string;
  type: LessonStepType;
  title: string;
  description: string;
  content: LessonContent;
  duration: number;
  order: number;
  isRequired: boolean;
  skills: string[];
  completionCriteria: CompletionCriteria;
}

export type LessonStepType = 
  | 'reading'
  | 'video'
  | 'quiz'
  | 'interactive'
  | 'discussion'
  | 'reflection'
  | 'assignment'
  | 'assessment';

export interface LessonContent {
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  interactiveType?: string;
  questions?: QuizQuestion[];
  resources?: Resource[];
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'matching' | 'open-ended';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  points: number;
}

export interface Resource {
  title: string;
  description: string;
  url: string;
  type: 'article' | 'video' | 'document' | 'website';
  isRequired: boolean;
}

export interface CompletionCriteria {
  type: 'view' | 'score' | 'time' | 'interaction' | 'submission';
  threshold?: number;
  customRule?: string;
}

export interface LessonStepsResponse {
  steps: LessonStep[];
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
  nextStep?: string;
  previousStep?: string;
}

export interface StepProgress {
  userId: string;
  stepId: string;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  score?: number;
  answers?: any[];
  feedback?: string;
}

// Helper functions
export function getStepTypeInfo(type: LessonStepType): { icon: string; color: string } {
  const typeInfo: Record<LessonStepType, { icon: string; color: string }> = {
    reading: { icon: '📚', color: '#4B5563' },
    video: { icon: '🎥', color: '#EF4444' },
    quiz: { icon: '✍️', color: '#3B82F6' },
    interactive: { icon: '🎮', color: '#8B5CF6' },
    discussion: { icon: '💭', color: '#10B981' },
    reflection: { icon: '🤔', color: '#F59E0B' },
    assignment: { icon: '📝', color: '#6366F1' },
    assessment: { icon: '📊', color: '#EC4899' },
  };
  return typeInfo[type];
}

export function formatStepDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function calculateStepProgress(progress: StepProgress): number {
  if (progress.status === 'completed') return 100;
  if (progress.status === 'not_started') return 0;
  if (!progress.timeSpent) return 0;
  
  // Calculate based on time spent vs expected duration
  const expectedDuration = 30; // Default to 30 minutes if not specified
  return Math.min(Math.round((progress.timeSpent / (expectedDuration * 60)) * 100), 99);
} 