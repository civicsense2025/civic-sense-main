export interface Skill {
  id: string
  skill_name: string
  skill_slug: string
  description: string
  category: 'civic_knowledge' | 'critical_thinking' | 'action_skills' | 'media_literacy' | 'community_organizing'
  difficulty_level: number // 1-5
  icon: string
  color: string // Hex color
  prerequisite_skills: string[] // Array of skill IDs
  created_at: string
  updated_at: string
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

export interface UserSkillProgress {
  id: string
  user_id: string
  skill_id: string
  current_level: number // 0-5
  progress_percentage: number // 0-100
  items_completed: number
  total_items_available: number
  last_practiced_at?: string
  mastery_achieved_at?: string
  created_at: string
  updated_at: string
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

export interface CollectionSkill {
  skill_id: string
  skill_name: string
  skill_slug: string
  description: string
  category: string
  difficulty_level: number
  total_items: number // How many items in collection contribute to this skill
  primary_items: number // How many items have this as primary skill
  avg_proficiency: number // Average proficiency level across items
  source_table: string // 'question_skills' | 'content_item_skills' | 'question_skills,content_item_skills'
}

export interface SkillCategory {
  category: string
  display_name: string
  description: string
  icon: string
  color: string
  skills_count: number
}

export interface SkillBadge {
  skill: Skill
  earned_at: string
  collection_earned_from?: string
  level_achieved: number
}

// For displaying skills in collections
export interface CollectionSkillSummary {
  total_skills: number
  primary_skills: number
  avg_difficulty: number
  skills: Array<{
    skill_id: string
    skill_name: string
    skill_slug: string
    difficulty_level: number
    total_items: number
    is_primary: boolean
    avg_proficiency: number
  }>
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