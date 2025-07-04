// CivicSense AI Types
// AI service and model interaction types

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'cohere' | 'internal';
  capabilities: AICapability[];
  contextWindow: number;
  maxTokens: number;
  temperature: number;
  costPerToken: number;
}

export type AICapability =
  | 'text_generation'
  | 'question_generation'
  | 'content_analysis'
  | 'bias_detection'
  | 'fact_checking'
  | 'summarization'
  | 'translation'
  | 'image_generation';

export interface AIPrompt {
  id: string;
  type: PromptType;
  template: string;
  variables: string[];
  examples: PromptExample[];
  model: string;
  settings: AISettings;
}

export type PromptType =
  | 'quiz_generation'
  | 'content_analysis'
  | 'bias_detection'
  | 'fact_checking'
  | 'explanation'
  | 'feedback'
  | 'summary';

export interface PromptExample {
  input: Record<string, any>;
  output: string;
  explanation?: string;
}

export interface AISettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stop?: string[];
}

export interface AIRequest {
  id: string;
  type: AIRequestType;
  prompt: string;
  model: string;
  settings: AISettings;
  context?: any;
  createdAt: Date;
  completedAt?: Date;
  status: RequestStatus;
  result?: AIResponse;
  error?: AIError;
}

export type AIRequestType =
  | 'quiz_generation'
  | 'content_analysis'
  | 'bias_detection'
  | 'fact_checking'
  | 'translation'
  | 'image_generation';

export type RequestStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AIResponse {
  id: string;
  requestId: string;
  content: any;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  metadata: Record<string, any>;
}

export interface AIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface AIUsage {
  userId: string;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
  byModel: Record<string, ModelUsage>;
  byType: Record<string, TypeUsage>;
}

export interface ModelUsage {
  requests: number;
  tokens: number;
  cost: number;
}

export interface TypeUsage {
  requests: number;
  averageTokens: number;
  totalCost: number;
} 