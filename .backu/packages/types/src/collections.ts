// CivicSense Collections Types
// Learning collections and lesson-related type definitions

export interface Collection {
  id: string;
  title: string;
  description: string;
  topics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  category: string;
  isPublic: boolean;
  prerequisites?: string[];
  objectives: string[];
  steps: CollectionStep[];
}

export interface CollectionStep {
  id: string;
  type: 'quiz' | 'lesson' | 'video' | 'interactive' | 'assessment';
  title: string;
  description: string;
  content: any; // Specific content type based on step type
  duration: number;
  order: number;
  isRequired: boolean;
  completionCriteria?: CompletionCriteria;
}

export interface CompletionCriteria {
  type: 'score' | 'time' | 'interaction' | 'custom';
  threshold: number;
  customRule?: string;
}

export interface CollectionProgress {
  userId: string;
  collectionId: string;
  startedAt: Date;
  lastUpdated: Date;
  completedSteps: string[];
  currentStep: string;
  overallProgress: number;
  timeSpent: number;
  isComplete: boolean;
}

export interface CollectionStats {
  totalEnrollments: number;
  completionRate: number;
  averageTimeSpent: number;
  ratings: CollectionRating[];
  reviews: CollectionReview[];
}

export interface CollectionRating {
  userId: string;
  rating: number;
  createdAt: Date;
}

export interface CollectionReview {
  userId: string;
  rating: number;
  review: string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  isVerified: boolean;
} 