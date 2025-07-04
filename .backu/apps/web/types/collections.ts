// Collection types
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
  objectives: string[];
  steps: CollectionStep[];
}

export interface CollectionStep {
  id: string;
  type: 'quiz' | 'lesson' | 'video' | 'interactive' | 'assessment';
  title: string;
  description: string;
  content: any;
  duration: number;
  order: number;
  isRequired: boolean;
} 