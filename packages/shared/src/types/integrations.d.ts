declare module 'integrations' {
  export interface Integration {
    id: string;
    type: string;
    config: Record<string, any>;
    enabled: boolean;
  }

  export interface IntegrationConfig {
    apiKey?: string;
    endpoint?: string;
    options?: Record<string, any>;
  }
} 