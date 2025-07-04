// Analytics event types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

// User analytics
export interface UserAnalytics {
  userId: string;
  sessionId: string;
  deviceInfo: DeviceInfo;
  events: AnalyticsEvent[];
}

// Device info
export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  osVersion: string;
  appVersion: string;
  deviceId: string;
}

// Screen tracking
export interface ScreenView {
  screenName: string;
  timestamp: Date;
  duration?: number;
  previousScreen?: string;
}

// Performance metrics
export interface PerformanceMetrics {
  timeToInteractive: number;
  firstContentfulPaint: number;
  totalBlockingTime: number;
} 