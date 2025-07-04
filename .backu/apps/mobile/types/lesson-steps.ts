/**
 * Lesson Steps Types for CivicSense Mobile App
 * 
 * These types represent individual learning steps within educational collections.
 * Each lesson step is a discrete piece of learning content with specific interaction patterns.
 */

export interface LessonStep {
  id: string;
  collection_item_id: string;
  step_number: number;
  step_type: 'intro' | 'concept' | 'interaction' | 'example' | 'quiz' | 'summary' | 'reflection';
  title: string;
  content: string;
  
  // Timing and pacing
  estimated_seconds: number;
  estimated_duration_minutes?: number;
  auto_advance_seconds?: number;
  
  // Interaction requirements
  requires_interaction: boolean;
  can_skip: boolean;
  interaction_config?: Record<string, any>; // Configuration for interactive elements
  skip_conditions?: Record<string, any>; // Conditions under which step can be skipped
  
  // Media content
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio' | 'document' | 'interactive';
  alt_text?: string; // Accessibility
  transcript?: string; // For audio/video content
  
  // Learning metadata
  key_concepts: string[]; // Main concepts taught in this step
  sources: LessonSource[]; // Supporting sources and references
  completion_criteria?: Record<string, any>; // What constitutes completion
  
  // Navigation
  next_step_id?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface LessonSource {
  url: string;
  title: string;
  author: string;
  publication: string;
  date: string;
  credibility_score: number; // 1-100
  verified_working: boolean; // Link validation status
  summary: string;
}

// Mobile-specific lesson navigation and progress
export interface MobileLessonNavigation {
  canGoBack: boolean;
  canGoNext: boolean;
  canSkip: boolean;
  showMenu: boolean;
  currentStepIndex: number;
  totalSteps: number;
  progress: MobileLessonProgress;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onMenu: () => void;
  onExit: () => void;
}

export interface MobileLessonProgress {
  currentStep: number;
  totalSteps: number;
  timeSpent: number; // in seconds
  canContinue: boolean;
  nextStepType: LessonStep['step_type'];
  progressPercentage: number;
  completedSteps: string[]; // Array of completed step IDs
}

export interface MobileLessonSession {
  collection_id: string;
  current_step_id?: string;
  started_at: string;
  last_accessed_at: string;
  steps_completed: string[];
  time_spent_minutes: number;
  is_paused: boolean;
  pause_reason?: 'user_choice' | 'interruption' | 'background' | 'network_issue';
}

// Step-level progress tracking
export interface StepProgress {
  step_id: string;
  collection_item_id: string;
  completed: boolean;
  score?: number; // For quiz steps
  time_spent: number; // in seconds
  completed_at?: string;
  attempts?: number; // Number of attempts for interactive steps
  
  // For quiz/interaction steps
  answers?: Record<string, any>;
  interaction_data?: Record<string, any>; // Data from interactive elements
}

// Lesson step UI component props
export interface LessonStepProps {
  step: LessonStep;
  isActive: boolean;
  isCompleted: boolean;
  progress?: StepProgress;
  onComplete?: (stepId: string, data?: any) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
}

// Step type configurations and metadata
export const LESSON_STEP_TYPES = {
  intro: { 
    label: 'Introduction', 
    icon: '👋', 
    color: 'bg-blue-100 text-blue-700', 
    description: 'Welcome and overview',
    typical_duration: 60 // seconds
  },
  concept: { 
    label: 'Concept', 
    icon: '💡', 
    color: 'bg-green-100 text-green-700', 
    description: 'Core learning content',
    typical_duration: 180
  },
  interaction: { 
    label: 'Activity', 
    icon: '🎯', 
    color: 'bg-purple-100 text-purple-700', 
    description: 'Interactive exercise',
    typical_duration: 300
  },
  example: { 
    label: 'Example', 
    icon: '📋', 
    color: 'bg-orange-100 text-orange-700', 
    description: 'Real-world case study',
    typical_duration: 120
  },
  quiz: { 
    label: 'Quiz', 
    icon: '❓', 
    color: 'bg-red-100 text-red-700', 
    description: 'Knowledge check',
    typical_duration: 90
  },
  summary: { 
    label: 'Summary', 
    icon: '📝', 
    color: 'bg-indigo-100 text-indigo-700', 
    description: 'Recap and review',
    typical_duration: 120
  },
  reflection: { 
    label: 'Reflection', 
    icon: '🤔', 
    color: 'bg-yellow-100 text-yellow-700', 
    description: 'Personal reflection and application',
    typical_duration: 180
  }
} as const;

// Helper functions
export const getLessonStepTypeInfo = (type: keyof typeof LESSON_STEP_TYPES) => {
  return LESSON_STEP_TYPES[type] || LESSON_STEP_TYPES.concept;
};

export const formatStepDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
};

export const calculateLessonProgress = (
  completedSteps: string[], 
  totalSteps: number
): number => {
  return totalSteps > 0 ? (completedSteps.length / totalSteps) * 100 : 0;
};

// Mobile-specific interfaces for lesson steps
export interface MobileLessonStepCard {
  step: LessonStep;
  isActive: boolean;
  isCompleted: boolean;
  canAccess: boolean; // Based on prerequisites
  estimatedTime: string;
  progressPercentage?: number;
}

export interface LessonStepInteraction {
  type: 'multiple_choice' | 'true_false' | 'text_input' | 'drag_drop' | 'matching' | 'slider' | 'custom';
  config: Record<string, any>;
  validation?: Record<string, any>;
  feedback?: {
    correct: string;
    incorrect: string;
    hint?: string;
  };
}

export type LessonStepType = keyof typeof LESSON_STEP_TYPES; 