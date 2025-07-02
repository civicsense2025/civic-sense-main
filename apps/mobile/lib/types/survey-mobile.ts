// Re-export all survey types from the main survey types file
export * from './survey';

// Import base types for extending
import type { SurveyQuestion, Survey, SurveyIncentive } from './survey';

// Additional mobile-specific survey types
export interface SurveyQuestionMobileProps {
  question: SurveyQuestion;
  value: any;
  onChange: (value: any) => void;
  isRequired?: boolean;
  error?: string;
}

export interface SurveyNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  isSubmitting?: boolean;
}

export interface SurveyProgressProps {
  current: number;
  total: number;
  showPercentage?: boolean;
}

export interface SurveyRewardDisplayProps {
  incentive: SurveyIncentive;
  isCompact?: boolean;
  onPress?: () => void;
}

// Mobile-specific survey state management
export interface SurveyState {
  surveyId: string;
  responses: Record<string, any>;
  currentQuestionIndex: number;
  startedAt: string;
  lastSavedAt?: string;
  isComplete: boolean;
  errors: Record<string, string>;
}

export interface SurveyContextValue {
  survey: Survey | null;
  state: SurveyState;
  updateResponse: (questionId: string, value: any) => void;
  navigateToQuestion: (index: number) => void;
  submitSurvey: () => Promise<void>;
  saveDraft: () => Promise<void>;
  resetSurvey: () => void;
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
}

// Survey component prop types
export interface MultipleChoiceQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'multiple_choice' };
}

export interface MultipleSelectQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'multiple_select' };
}

export interface ScaleQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'scale' };
}

export interface TextQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'text' | 'textarea' };
}

export interface RankingQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'ranking' };
}

export interface LikertQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'likert' };
}

export interface MatrixQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'matrix' };
}

export interface SliderQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'slider' };
}

export interface DateQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'date' };
}

export interface EmailQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'email' };
}

export interface PhoneQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'phone' };
}

export interface NumberQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'number' };
}

export interface DropdownQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'dropdown' };
}

export interface ImageChoiceQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'image_choice' };
}

export interface FileUploadQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'file_upload' };
}

export interface RatingStarsQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'rating_stars' };
}

export interface YesNoQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'yes_no' };
}

export interface StatementQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'statement' };
}

export interface ContactInfoQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'contact_info' };
}

export interface DynamicContentQuestionProps extends SurveyQuestionMobileProps {
  question: SurveyQuestion & { type: 'dynamic_content' };
}

// Survey validation types
export interface SurveyValidationError {
  questionId: string;
  message: string;
  type: 'required' | 'format' | 'range' | 'custom';
}

export interface SurveyValidationResult {
  isValid: boolean;
  errors: SurveyValidationError[];
}

// Survey analytics types
export interface SurveyAnalytics {
  surveyId: string;
  userId?: string;
  guestToken?: string;
  startTime: string;
  endTime?: string;
  completionTime?: number;
  questionsAnswered: number;
  totalQuestions: number;
  deviceInfo: {
    platform: string;
    osVersion: string;
    appVersion: string;
  };
}

// Import statement helpers for components
export const SURVEY_QUESTION_COMPONENTS = {
  MultipleChoiceQuestion: '@/components/survey/MultipleChoiceQuestion',
  MultipleSelectQuestion: '@/components/survey/MultipleSelectQuestion',
  ScaleQuestion: '@/components/survey/ScaleQuestion',
  TextQuestion: '@/components/survey/TextQuestion',
  RankingQuestion: '@/components/survey/RankingQuestion',
  LikertQuestion: '@/components/survey/LikertQuestion',
  MatrixQuestion: '@/components/survey/MatrixQuestion',
  SliderQuestion: '@/components/survey/SliderQuestion',
  DateQuestion: '@/components/survey/DateQuestion',
  EmailQuestion: '@/components/survey/EmailQuestion',
  PhoneQuestion: '@/components/survey/PhoneQuestion',
  NumberQuestion: '@/components/survey/NumberQuestion',
  DropdownQuestion: '@/components/survey/DropdownQuestion',
  ImageChoiceQuestion: '@/components/survey/ImageChoiceQuestion',
  FileUploadQuestion: '@/components/survey/FileUploadQuestion',
  RatingStarsQuestion: '@/components/survey/RatingStarsQuestion',
  YesNoQuestion: '@/components/survey/YesNoQuestion',
  StatementQuestion: '@/components/survey/StatementQuestion',
  ContactInfoQuestion: '@/components/survey/ContactInfoQuestion',
  DynamicContentQuestion: '@/components/survey/DynamicContentQuestion',
} as const; 