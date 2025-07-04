/**
 * Skills System Types for CivicSense Mobile App
 * 
 * The skills system tracks civic competencies developed through learning activities.
 * Skills are categorized and provide measurable learning outcomes for educational collections.
 */

export interface CollectionSkill {
  id: string;
  skill_id: string;
  name: string;
  description: string;
  category: SkillCategory;
  
  // Skill development metadata
  difficulty_level: 1 | 2 | 3 | 4 | 5; // Beginner to Expert
  prerequisites?: string[]; // Other skill IDs required first
  
  // Progress and assessment
  current_level?: number; // User's current proficiency (0-100)
  target_level?: number; // Expected level after collection (0-100)
  assessment_criteria?: string[];
  
  // Collection-specific context
  collection_context?: string; // How this skill applies in this specific collection
  practice_opportunities?: number; // Number of times practiced in collection
  
  created_at: string;
  updated_at: string;
}

export interface CollectionSkillSummary {
  total_skills: number;
  skills_by_category: Record<SkillCategory, number>;
  primary_skills: CollectionSkill[]; // Top 3-5 most important skills
  difficulty_distribution: Record<string, number>; // difficulty level -> count
  estimated_skill_hours: number; // Total time to develop these skills
}

export type SkillCategory = 
  | 'civic_knowledge'      // Understanding government structure, rights, etc.
  | 'critical_thinking'    // Analysis, evaluation, reasoning
  | 'media_literacy'       // Information evaluation, source analysis
  | 'civic_engagement'     // Participation, advocacy, organizing
  | 'communication'        // Public speaking, writing, debate
  | 'research'            // Information gathering, fact-checking
  | 'legal_literacy'      // Understanding laws, rights, procedures
  | 'economic_literacy'   // Understanding economic policy, budgets
  | 'political_process'   // Elections, lobbying, policy-making
  | 'social_awareness'    // Understanding demographics, social issues
  | 'digital_citizenship' // Online civic participation, digital rights
  | 'leadership'          // Organizing, coalition-building, management

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  
  // Skill metadata
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  prerequisites: string[]; // skill_ids
  related_skills: string[]; // skill_ids
  
  // Learning pathways
  typical_development_hours: number;
  practice_activities: string[];
  assessment_methods: string[];
  
  // Civic context
  real_world_applications: string[];
  civic_scenarios: string[];
  
  // Tags and organization
  tags: string[];
  is_foundational: boolean; // Core civic skill everyone should have
  is_advanced: boolean; // Requires significant prior knowledge
  
  created_at: string;
  updated_at: string;
}

export interface UserSkillProgress {
  id: string;
  user_id: string;
  skill_id: string;
  
  // Progress tracking
  current_level: number; // 0-100 proficiency score
  target_level?: number; // Goal proficiency
  hours_practiced: number;
  activities_completed: number;
  
  // Performance metrics
  assessment_scores: number[]; // Historical assessment results
  practice_streak: number; // Days of consecutive practice
  last_practiced_at?: string;
  
  // Learning sources
  collections_completed: string[]; // collection_ids where skill was practiced
  practice_sessions: SkillPracticeSession[];
  
  // Milestones
  milestones_achieved: string[];
  certificates_earned: string[];
  
  created_at: string;
  updated_at: string;
}

export interface SkillPracticeSession {
  id: string;
  skill_id: string;
  collection_id?: string; // If practiced in a collection
  
  // Session details
  started_at: string;
  completed_at?: string;
  duration_minutes: number;
  
  // Performance
  pre_assessment_score?: number;
  post_assessment_score?: number;
  improvement_score: number;
  
  // Context
  practice_type: 'collection' | 'standalone' | 'assessment' | 'peer_learning';
  activity_types: string[]; // Types of activities completed
  
  // Feedback
  self_assessment?: number; // 1-5 user rating of session
  notes?: string;
  
  created_at: string;
}

// Skill categories metadata
export const SKILL_CATEGORIES = {
  civic_knowledge: {
    label: 'Civic Knowledge', 
    icon: '🏛️', 
    color: 'bg-blue-100 text-blue-700',
    description: 'Understanding government structure, rights, and civic processes'
  },
  critical_thinking: {
    label: 'Critical Thinking', 
    icon: '🧠', 
    color: 'bg-purple-100 text-purple-700',
    description: 'Analysis, evaluation, and logical reasoning skills'
  },
  media_literacy: {
    label: 'Media Literacy', 
    icon: '📺', 
    color: 'bg-orange-100 text-orange-700',
    description: 'Information evaluation and source analysis skills'
  },
  civic_engagement: {
    label: 'Civic Engagement', 
    icon: '🤝', 
    color: 'bg-green-100 text-green-700',
    description: 'Participation, advocacy, and community organizing'
  },
  communication: {
    label: 'Communication', 
    icon: '💬', 
    color: 'bg-indigo-100 text-indigo-700',
    description: 'Public speaking, writing, and debate skills'
  },
  research: {
    label: 'Research', 
    icon: '🔍', 
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Information gathering and fact-checking abilities'
  },
  legal_literacy: {
    label: 'Legal Literacy', 
    icon: '⚖️', 
    color: 'bg-red-100 text-red-700',
    description: 'Understanding laws, rights, and legal procedures'
  },
  economic_literacy: {
    label: 'Economic Literacy', 
    icon: '💰', 
    color: 'bg-emerald-100 text-emerald-700',
    description: 'Understanding economic policy and budgets'
  },
  political_process: {
    label: 'Political Process', 
    icon: '🗳️', 
    color: 'bg-pink-100 text-pink-700',
    description: 'Elections, lobbying, and policy-making processes'
  },
  social_awareness: {
    label: 'Social Awareness', 
    icon: '🌍', 
    color: 'bg-teal-100 text-teal-700',
    description: 'Understanding demographics and social issues'
  },
  digital_citizenship: {
    label: 'Digital Citizenship', 
    icon: '💻', 
    color: 'bg-cyan-100 text-cyan-700',
    description: 'Online civic participation and digital rights'
  },
  leadership: {
    label: 'Leadership', 
    icon: '👥', 
    color: 'bg-amber-100 text-amber-700',
    description: 'Organizing, coalition-building, and management'
  }
} as const;

// Helper functions
export const getSkillCategoryInfo = (category: SkillCategory) => {
  return SKILL_CATEGORIES[category] || SKILL_CATEGORIES.civic_knowledge;
};

export const calculateSkillLevel = (score: number): string => {
  if (score >= 90) return 'Expert';
  if (score >= 75) return 'Advanced';
  if (score >= 60) return 'Intermediate';
  if (score >= 40) return 'Developing';
  if (score >= 20) return 'Beginner';
  return 'Novice';
};

export const getSkillLevelColor = (score: number): string => {
  if (score >= 90) return 'bg-emerald-100 text-emerald-700';
  if (score >= 75) return 'bg-blue-100 text-blue-700';
  if (score >= 60) return 'bg-orange-100 text-orange-700';
  if (score >= 40) return 'bg-yellow-100 text-yellow-700';
  if (score >= 20) return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
};

// Mobile-specific interfaces
export interface MobileSkillCard {
  skill: CollectionSkill;
  progress?: UserSkillProgress;
  showProgress: boolean;
  onPress?: () => void;
}

export interface SkillsProgressSummary {
  total_skills: number;
  skills_in_progress: number;
  skills_completed: number;
  overall_progress: number; // 0-100
  strongest_category: SkillCategory;
  focus_areas: SkillCategory[]; // Categories needing attention
  recent_improvements: CollectionSkill[];
}

export interface ContentItemSkill {
  id: string
  skill_id: string
  content_type: 'topic' | 'glossary_term' | 'scenario' | 'news_item' | 'survey'
  content_id: string
  proficiency_level: number // 1-5, how much this item develops the skill
  is_primary: boolean // Is this a primary skill for this content?
  created_at: string
}

export interface SkillBadge {
  skill: Skill
  earned_at: string
  collection_earned_from?: string
  level_achieved: number
}

export interface CollectionSkillProgress {
  id: string
  user_id: string
  collection_id: string
  skill_id: string
  progress_percentage: number // 0-100
  items_completed: number
  total_items_in_collection: number
  earned_at: string | null // When skill was fully earned through this collection
  created_at: string
}

// For the skills dashboard/profile
export interface UserSkillProfile {
  user_id: string
  total_skills_started: number
  total_skills_mastered: number
  overall_civic_level: number // 1-5 calculated from all skills
  strongest_category: string
  recent_achievements: SkillBadge[]
  skills_by_category: Record<string, UserSkillProgress[]>
  recommended_collections: string[] // Collection IDs that would help develop weak skills
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to add skill to content item
 */
export interface AddContentItemSkillRequest {
  skill_id: string
  content_type: ContentItemSkill['content_type']
  content_id: string
  proficiency_level: number
  is_primary: boolean
}

/**
 * Skills filter for collections
 */
export interface SkillsFilter {
  skill_ids?: string[]
  categories?: string[]
  difficulty_levels?: number[]
  min_proficiency?: number
  primary_only?: boolean
}

/**
 * Collection with skills information
 */
export interface CollectionWithSkills {
  // ... existing collection fields
  skills_summary: CollectionSkillSummary
  primary_skills: CollectionSkill[]
  user_skill_progress?: CollectionSkillProgress[] // If user is authenticated
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Unified skill source for collections
 */
export type SkillSource = {
  skill_id: string
  content_type: 'question' | 'topic' | 'glossary_term' | 'scenario'
  content_id: string
  proficiency_level: number
  is_primary: boolean
  source_table: 'question_skills' | 'content_item_skills'
}

/**
 * Skills learning path recommendation
 */
export interface SkillLearningPath {
  skill_id: string
  skill_name: string
  current_level: number
  target_level: number
  recommended_collections: Array<{
    collection_id: string
    collection_title: string
    skill_contribution: number // How much this collection develops the skill
    estimated_time: number
  }>
  prerequisite_skills: string[]
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Skills analytics for admin dashboard
 */
export interface SkillsAnalytics {
  total_skills: number
  skills_by_category: Record<string, number>
  avg_completion_rate: number
  most_practiced_skills: Array<{
    skill_id: string
    skill_name: string
    total_practices: number
    avg_proficiency_gained: number
  }>
  collections_by_skill_count: Record<number, number> // skill_count -> collection_count
}

/**
 * User skills dashboard data
 */
export interface UserSkillsDashboard {
  user_id: string
  total_skills_earned: number
  skills_in_progress: number
  mastery_level: number // 1-5 based on overall progress
  recent_achievements: Array<{
    skill_name: string
    earned_at: string
    collection_title: string
  }>
  recommended_next_skills: SkillLearningPath[]
  progress_by_category: Record<string, {
    total_skills: number
    earned_skills: number
    avg_proficiency: number
  }>
} 