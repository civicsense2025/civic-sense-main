// Service response types
export interface StandardResponse<T> {
  data: T | null;
  error: Error | null;
}

// Data service types
export interface DataServiceConfig {
  cacheTimeout?: number;
  retryAttempts?: number;
  useCache?: boolean;
}

// Progress service types
export interface ProgressData {
  userId: string;
  topicId: string;
  progress: number;
  completed?: boolean;
  completedAt?: Date;
}

// Bookmark service types
export interface BookmarkData {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'topic' | 'quiz' | 'article';
  createdAt: Date;
}

// Premium service types
export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

// Content service types
export interface ContentFilter {
  type: 'topic' | 'quiz' | 'article';
  status: 'draft' | 'published' | 'archived';
  category?: string[];
  tags?: string[];
} 