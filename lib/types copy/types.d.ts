declare module 'types' {
  export interface User {
    id: string;
    email: string;
    name?: string;
    role?: string;
    subscription?: {
      plan: string;
      status: string;
    };
  }

  export interface FeatureFlag {
    name: string;
    enabled: boolean;
    config?: Record<string, any>;
  }

  export type AllFeatureFlags = Record<string, boolean>;
  export type PremiumFeatureFlags = Record<string, boolean>;
} 