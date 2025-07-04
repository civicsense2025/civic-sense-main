// CivicSense Skills Types
// Skill tracking and progression system types

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  level: number;
  maxLevel: number;
  prerequisites: string[];
  unlocks: string[];
  xpRequired: number;
  icon?: string;
}

export type SkillCategory = 
  | 'critical_thinking'
  | 'research'
  | 'communication'
  | 'leadership'
  | 'problem_solving'
  | 'civic_knowledge'
  | 'digital_literacy'
  | 'collaboration';

export interface UserSkill {
  userId: string;
  skillId: string;
  currentLevel: number;
  currentXP: number;
  progress: number;
  unlockedAt: Date;
  lastUpdated: Date;
  achievements: SkillAchievement[];
}

export interface SkillAchievement {
  id: string;
  name: string;
  description: string;
  earnedAt: Date;
  xpBonus: number;
  icon?: string;
}

export interface SkillProgress {
  userId: string;
  skillId: string;
  activityType: SkillActivityType;
  xpGained: number;
  timestamp: Date;
  context: string;
}

export type SkillActivityType =
  | 'quiz_completion'
  | 'lesson_completion'
  | 'discussion_participation'
  | 'challenge_completion'
  | 'peer_review'
  | 'content_creation'
  | 'achievement_unlock';

export interface SkillTree {
  categories: SkillCategory[];
  skills: Skill[];
  connections: SkillConnection[];
}

export interface SkillConnection {
  fromSkillId: string;
  toSkillId: string;
  type: 'prerequisite' | 'enhancement' | 'parallel';
}

export interface SkillRecommendation {
  skillId: string;
  relevance: number;
  reason: string;
  suggestedActivities: SkillActivity[];
}

export interface SkillActivity {
  id: string;
  type: SkillActivityType;
  title: string;
  description: string;
  xpReward: number;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
} 