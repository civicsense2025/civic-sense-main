// CivicSense Incentives Types
// Gamification and reward system types

export interface Incentive {
  id: string;
  type: IncentiveType;
  title: string;
  description: string;
  icon: string;
  value: number;
  category: IncentiveCategory;
  conditions: IncentiveCondition[];
  rewards: IncentiveReward[];
  expiresAt?: Date;
  maxClaims?: number;
}

export type IncentiveType = 
  | 'achievement'
  | 'badge'
  | 'reward'
  | 'milestone'
  | 'challenge'
  | 'streak'
  | 'bonus';

export type IncentiveCategory =
  | 'learning'
  | 'participation'
  | 'contribution'
  | 'social'
  | 'skill'
  | 'special';

export interface IncentiveCondition {
  type: ConditionType;
  metric: string;
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
  value: number | string | boolean;
  timeframe?: string;
}

export type ConditionType =
  | 'quiz_score'
  | 'completion_count'
  | 'time_spent'
  | 'streak_days'
  | 'contribution_count'
  | 'skill_level'
  | 'custom';

export interface IncentiveReward {
  type: RewardType;
  value: number;
  description: string;
  icon?: string;
}

export type RewardType =
  | 'xp'
  | 'points'
  | 'badge'
  | 'unlock'
  | 'boost'
  | 'currency';

export interface UserIncentive {
  userId: string;
  incentiveId: string;
  progress: number;
  isCompleted: boolean;
  completedAt?: Date;
  claimedAt?: Date;
  rewards: ClaimedReward[];
}

export interface ClaimedReward {
  type: RewardType;
  value: number;
  claimedAt: Date;
  expiresAt?: Date;
}

export interface IncentiveProgress {
  userId: string;
  incentiveId: string;
  currentValue: number;
  targetValue: number;
  progress: number;
  updatedAt: Date;
}

export interface IncentiveStats {
  totalClaims: number;
  activeUsers: number;
  completionRate: number;
  popularRewards: PopularReward[];
}

export interface PopularReward {
  type: RewardType;
  claimCount: number;
  userCount: number;
  averageCompletion: number;
} 