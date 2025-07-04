// CivicSense Environment Types
// Environment configuration and feature flag types

export interface Environment {
  name: string;
  type: 'development' | 'staging' | 'production';
  region: string;
  features: FeatureFlags;
  config: EnvironmentConfig;
  secrets: EnvironmentSecrets;
}

export interface FeatureFlags {
  // Authentication & Access
  enableGuestAccess: boolean;
  enableSocialAuth: boolean;
  enableEmailAuth: boolean;
  enableAppleAuth: boolean;

  // Premium Features
  enablePremiumFeatures: boolean;
  enableSubscriptions: boolean;
  enableIAP: boolean;

  // Content & Learning
  enableAIFeatures: boolean;
  enableMultiplayer: boolean;
  enableLiveQuizzes: boolean;
  enableCommunityContent: boolean;
  enableTranslations: boolean;

  // Analytics & Tracking
  enableAnalytics: boolean;
  enableErrorTracking: boolean;
  enablePerformanceMonitoring: boolean;

  // Experimental Features
  experimentalFeatures: Record<string, boolean>;
  betaFeatures: Record<string, boolean>;
}

export interface EnvironmentConfig {
  // API Configuration
  apiUrl: string;
  apiVersion: string;
  wsUrl: string;

  // Database Configuration
  databaseUrl: string;
  databasePool: {
    min: number;
    max: number;
  };

  // Cache Configuration
  redis: {
    url: string;
    ttl: number;
  };

  // Storage Configuration
  storage: {
    provider: 'local' | 's3' | 'gcs';
    bucket: string;
    region: string;
  };

  // Email Configuration
  email: {
    provider: string;
    fromAddress: string;
    replyTo: string;
  };

  // Monitoring Configuration
  monitoring: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    sampleRate: number;
    errorThreshold: number;
  };
}

export interface EnvironmentSecrets {
  // API Keys
  supabaseKey: string;
  stripeKey: string;
  openaiKey?: string;

  // Authentication
  jwtSecret: string;
  cookieSecret: string;

  // External Services
  sendgridKey?: string;
  twilioKey?: string;
  statsigKey?: string;

  // Monitoring
  sentryDsn?: string;
  newrelicKey?: string;
}

export interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  environments: string[];
  conditions?: FlagCondition[];
  rolloutPercentage?: number;
  metadata?: Record<string, any>;
}

export interface FlagCondition {
  type: 'user' | 'group' | 'date' | 'custom';
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin';
  value: any;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  isSecret: boolean;
  description?: string;
  environments: string[];
} 