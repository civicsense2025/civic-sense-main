declare module 'ai' {
  // Add any AI-related type definitions here
  export type AIConfig = {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
} 