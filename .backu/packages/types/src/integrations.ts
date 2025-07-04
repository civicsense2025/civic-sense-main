// Integration types for external services

// Pod Quiz integration
export interface PodQuizConfig {
  apiKey: string;
  endpoint: string;
  options?: {
    timeout?: number;
    retries?: number;
  };
}

export interface PodQuizResponse {
  id: string;
  questions: PodQuizQuestion[];
  metadata: PodQuizMetadata;
}

export interface PodQuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface PodQuizMetadata {
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  tags: string[];
  source: string;
}

// Server integration types
export interface ServerConfig {
  host: string;
  port: number;
  secure: boolean;
  timeout?: number;
}

export interface ServerResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
} 