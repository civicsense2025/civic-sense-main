// CivicSense User Types
// User-related type definitions

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: UserPreferences;
  settings: UserSettings;
}

export type UserRole = 'guest' | 'user' | 'premium' | 'educator' | 'admin' | 'moderator';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationPreferences;
  accessibility: AccessibilityPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  digest: 'daily' | 'weekly' | 'never';
}

export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'x-large';
  screenReader: boolean;
}

export interface UserSettings {
  privacyLevel: 'public' | 'private' | 'friends';
  showProgress: boolean;
  showStats: boolean;
  allowMultiplayer: boolean;
  allowChallenges: boolean;
}

export interface UserProfile {
  userId: string;
  bio?: string;
  location?: string;
  interests: string[];
  expertise: string[];
  achievements: Achievement[];
  stats: UserStats;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  earnedAt: Date;
  category: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface UserStats {
  quizzesTaken: number;
  questionsAnswered: number;
  correctAnswers: number;
  averageScore: number;
  timeSpent: number;
  streakDays: number;
  lastActive: Date;
} 