/**
 * Educational Content Collections Types for CivicSense Mobile App
 * 
 * ⚠️  IMPORTANT: These are EDUCATIONAL CONTENT collections (courses/lessons)
 * NOT user bookmark collections or user content collections.
 * 
 * Different Collection Types in CivicSense:
 * 1. EducationalCollection (this file) - Course-like content created by admins
 *    - Database: custom_content_collections
 *    - API: /api/educational-collections
 *    - Purpose: Educational courses, lessons, learning paths
 * 
 * 2. BookmarkCollection - User-created collections for organizing bookmarks  
 *    - Database: bookmark_collections
 *    - API: /api/bookmarks/collections
 *    - Purpose: Personal content organization
 * 
 * 3. UserContentCollection - User annotations and personal organization
 *    - Database: user_content_collections
 *    - API: /api/user-content/collections
 *    - Purpose: User-generated content organization
 * 
 * This file specifically handles Educational Collections used for courses and lessons.
 */

import { CollectionSkill, CollectionSkillSummary } from './skills'

/**
 * Educational Collection Interface
 * Represents structured learning content like courses or lesson sequences
 */
export interface EducationalCollection {
  id: string
  title: string
  description: string
  emoji: string
  slug: string
  cover_image_url?: string
  short_description?: string
  category?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  image_url?: string
  estimated_time?: number // in minutes
  content_items_count: number
  is_featured?: boolean
  is_published?: boolean
  
  // Learning objectives
  action_items?: string[]
  
  // Progress tracking
  user_progress?: UserCollectionProgress
  
  // Metadata
  metadata?: {
    tags?: string[]
    prerequisites?: string[]
    level?: string
    source?: string
  }
  
  // Learning metadata
  difficulty_level: 1 | 2 | 3 | 4 | 5
  estimated_minutes: number
  prerequisites: string[]
  learning_objectives: string[]
  
  // Skills integration
  skills_summary?: CollectionSkillSummary
  primary_skills?: CollectionSkill[] // Top 3-5 skills this collection develops
  
  // CivicSense specific
  current_events_relevance: 1 | 2 | 3 | 4 | 5
  political_balance_score?: 1 | 2 | 3 | 4 | 5
  source_diversity_score?: 1 | 2 | 3 | 4 | 5
  
  // Discovery & organization
  tags: string[]
  categories: string[]
  
  // Status & visibility
  status: 'draft' | 'published' | 'archived'
  featured_order?: number
  visibility: 'public' | 'unlisted' | 'private'
  
  // Analytics
  view_count: number
  completion_count: number
  avg_rating: number
  total_ratings: number
  
  // Metadata
  created_by: string
  created_at: string
  updated_at: string
  published_at?: string
  
  // Computed fields (not in database)
  progress?: UserCollectionProgress
  items_count?: number
  estimated_read_time?: string
  
  // Mobile-specific fields
  mobile_thumbnail_url?: string
  mobile_hero_image_url?: string
  mobile_preview_text?: string
}

// Type alias for backward compatibility
export type Collection = EducationalCollection;

export interface CollectionItem {
  id: string
  collection_id: string
  
  // Content reference
  content_type: 'topic' | 'question' | 'glossary_term' | 'survey' | 'event' | 'article'
  content_id: string
  
  // Organization within collection
  sort_order: number
  category?: string
  is_featured: boolean
  
  // Context
  title_override?: string
  description_override?: string
  notes?: string
  
  // Learning metadata for items
  estimated_duration_minutes?: number
  learning_objectives?: string[] // JSON array
  key_concepts?: string[] // JSON array
  
  created_at: string
  
  // Populated content (not in database)
  content?: any // The actual content object
  
  // Skills this specific item contributes
  skills?: CollectionSkill[]
  
  // Populated item data
  title?: string
  description?: string
  difficulty_level?: number
  estimated_minutes?: number
  
  // Skills progress from this collection
  skills_earned?: CollectionSkill[]
  skills_progress?: Record<string, number> // skill_id -> progress percentage
  
  // Lesson steps for detailed content
  lesson_steps?: LessonStep[]
}

// New types for lesson steps based on the SQL template
export interface LessonStep {
  id: string
  collection_item_id: string
  step_number: number
  step_type: 'intro' | 'concept' | 'interaction' | 'example' | 'quiz' | 'summary'
  title: string
  content: string
  
  // Timing
  estimated_seconds: number
  estimated_duration_minutes?: number
  auto_advance_seconds?: number
  
  // Interaction
  requires_interaction: boolean
  can_skip: boolean
  interaction_config?: Record<string, any> // JSONB
  skip_conditions?: Record<string, any> // JSONB
  
  // Media
  image_url?: string
  video_url?: string
  audio_url?: string
  media_url?: string
  media_type?: string
  alt_text?: string
  transcript?: string
  
  // Learning metadata
  key_concepts: string[] // JSONB array
  sources: LessonSource[] // JSONB array
  completion_criteria?: Record<string, any> // JSONB
  
  // Navigation
  next_step_id?: string
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface LessonSource {
  url: string
  title: string
  author: string
  publication: string
  date: string
  credibility_score: number
  verified_working: boolean
  summary: string
}

// Mobile-specific types
export interface MobileLessonCard {
  collection: Collection
  progress?: UserCollectionProgress
  isNew?: boolean
  isFeatured?: boolean
  estimatedReadTime: string
  completionRate: number
  thumbnailUrl?: string
}

export interface MobileLessonProgress {
  currentStep: number
  totalSteps: number
  timeSpent: number
  canContinue: boolean
  nextStepType: LessonStep['step_type']
  progressPercentage: number
}

export interface MobileLessonSession {
  collection_id: string
  current_step_id?: string
  started_at: string
  last_accessed_at: string
  steps_completed: string[]
  time_spent_minutes: number
  is_paused: boolean
  pause_reason?: 'user_choice' | 'interruption' | 'background'
}

export interface UserCollectionProgress {
  id: string
  user_id: string
  collection_id: string
  
  // Progress tracking
  completed_items: string[] // collection_item.id[]
  current_item_id?: string
  progress_percentage: number
  
  // Time tracking
  total_time_spent_minutes: number
  started_at: string
  last_accessed_at: string
  completed_at?: string
  
  // User feedback
  user_rating?: 1 | 2 | 3 | 4 | 5
  user_feedback?: string
  
  // Skills progress from this collection
  skills_earned?: CollectionSkill[]
  skills_progress?: Record<string, number> // skill_id -> progress percentage
  
  // Mobile session tracking
  mobile_session?: MobileLessonSession
  
  // Step-level progress
  step_progress?: StepProgress[]
  
  created_at: string
  updated_at: string
}

export interface UserCollectionItemProgress {
  id: string
  user_collection_progress_id: string
  item_id: string
  item_type: string
  completed_at?: string
  score?: number
  attempts: number
  time_spent_minutes: number
  is_skipped: boolean
  
  // Step-level progress for lessons
  completed_steps?: string[] // lesson_step.id[]
  current_step_id?: string
  
  // Skills gained from completing this item
  skills_gained?: string[] // Array of skill IDs
  
  created_at: string
  updated_at: string
}

export interface CollectionReview {
  id: string
  collection_id: string
  user_id: string
  
  rating: 1 | 2 | 3 | 4 | 5
  review_text?: string
  helpful_votes: number
  
  created_at: string
  updated_at: string
  
  // Populated user data (not in database)
  user?: {
    email: string
    display_name?: string
  }
  
  // Skills-related feedback
  skills_accuracy_rating?: number // How accurate were the skill predictions?
  most_valuable_skill?: string // skill_id
}

export interface CollectionAnalytics {
  id: string
  collection_id: string
  
  // Daily metrics
  date: string
  views: number
  starts: number
  completions: number
  avg_completion_time_minutes: number
  avg_session_time_minutes: number
  
  // Content engagement
  most_popular_item_id?: string
  biggest_drop_off_item_id?: string
  
  created_at: string
}

// API request/response types
export interface CreateCollectionRequest {
  title: string
  description: string
  emoji: string
  difficulty_level: 1 | 2 | 3 | 4 | 5
  estimated_minutes: number
  prerequisites: string[]
  learning_objectives: string[]
  action_items: string[]
  current_events_relevance: 1 | 2 | 3 | 4 | 5
  tags: string[]
  categories: string[]
  cover_image_url?: string
  status: 'draft' | 'published'
  is_featured: boolean
}

export interface UpdateCollectionRequest extends Partial<CreateCollectionRequest> {
  id: string
}

export interface AddCollectionItemRequest {
  collection_id: string
  content_type: 'topic' | 'question' | 'glossary_term' | 'survey' | 'event' | 'article'
  content_id: string
  category?: string
  title_override?: string
  description_override?: string
  is_featured?: boolean
}

export interface UpdateProgressRequest {
  collection_id: string
  completed_item_id?: string
  current_item_id?: string
  time_spent_minutes?: number
  completed_step_id?: string
  current_step_id?: string
}

export interface CreateReviewRequest {
  collection_id: string
  rating: 1 | 2 | 3 | 4 | 5
  review_text?: string
}

// Query filters
export interface CollectionFilters {
  status?: 'draft' | 'published' | 'archived'
  is_featured?: boolean
  difficulty_level?: number[]
  categories?: string[]
  tags?: string[]
  search?: string
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'difficulty_level' | 'estimated_minutes' | 'avg_rating' | 'completion_count'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
  skills?: string[] // Filter by required skills
  skill_categories?: string[] // Filter by skill categories (civic_knowledge, critical_thinking, etc.)
  include_skills?: boolean // Include skills summary in response
  completion_status?: 'not_started' | 'in_progress' | 'completed'
  estimated_time_min?: number
  estimated_time_max?: number
  user_id?: string
  content_type?: 'course' | 'lesson' | 'module' // For mobile filtering
  mobile_optimized?: boolean // Filter for mobile-optimized content
}

export interface CollectionStats {
  total_collections: number
  published_collections: number
  featured_collections: number
  total_completions: number
  avg_completion_rate: number
  popular_categories: Array<{
    category: string
    count: number
  }>
  recent_completions: Array<{
    collection_id: string
    collection_title: string
    user_id: string
    completed_at: string
  }>
}

// Mobile UI component props
export interface CollectionCardProps {
  collection: Collection
  showProgress?: boolean
  onClick?: () => void
  className?: string
  variant?: 'default' | 'compact' | 'featured' | 'mobile-card'
}

export interface MobileLessonCardProps {
  lesson: MobileLessonCard
  onPress: () => void
  showProgress?: boolean
  variant?: 'default' | 'compact' | 'featured'
}

export interface CollectionProgressProps {
  progress: UserCollectionProgress
  collection: Collection
  onItemComplete?: (itemId: string) => void
  onStepComplete?: (stepId: string) => void
}

export interface CollectionItemProps {
  item: CollectionItem
  isCompleted: boolean
  isCurrent: boolean
  onClick?: () => void
}

export interface LessonStepProps {
  step: LessonStep
  isActive: boolean
  isCompleted: boolean
  onComplete?: () => void
  onNext?: () => void
  onPrevious?: () => void
}

// Mobile-specific lesson navigation
export interface MobileLessonNavigation {
  canGoBack: boolean
  canGoNext: boolean
  canSkip: boolean
  showMenu: boolean
  progress: MobileLessonProgress
  onBack: () => void
  onNext: () => void
  onSkip: () => void
  onMenu: () => void
  onExit: () => void
}

// Difficulty level helpers
export const DIFFICULTY_LEVELS = {
  1: { label: 'Beginner', color: 'bg-green-100 text-green-700', description: 'Basic civic concepts', icon: '🌱' },
  2: { label: 'Easy', color: 'bg-blue-100 text-blue-700', description: 'Some background helpful', icon: '📘' },
  3: { label: 'Moderate', color: 'bg-yellow-100 text-yellow-700', description: 'Requires civic knowledge', icon: '⚖️' },
  4: { label: 'Advanced', color: 'bg-orange-100 text-orange-700', description: 'Deep understanding needed', icon: '🎓' },
  5: { label: 'Expert', color: 'bg-red-100 text-red-700', description: 'Graduate-level analysis', icon: '🔬' }
} as const

// Content type helpers
export const CONTENT_TYPES = {
  topic: { label: 'Topic', icon: '📖', color: 'bg-blue-100 text-blue-700' },
  question: { label: 'Quiz', icon: '❓', color: 'bg-purple-100 text-purple-700' },
  glossary_term: { label: 'Term', icon: '📚', color: 'bg-green-100 text-green-700' },
  survey: { label: 'Survey', icon: '📊', color: 'bg-orange-100 text-orange-700' },
  event: { label: 'Event', icon: '📅', color: 'bg-red-100 text-red-700' },
  article: { label: 'Article', icon: '📰', color: 'bg-indigo-100 text-indigo-700' }
} as const

// Lesson step types
export const LESSON_STEP_TYPES = {
  intro: { label: 'Introduction', icon: '👋', color: 'bg-blue-100 text-blue-700', description: 'Welcome and overview' },
  concept: { label: 'Concept', icon: '💡', color: 'bg-green-100 text-green-700', description: 'Core learning content' },
  interaction: { label: 'Activity', icon: '🎯', color: 'bg-purple-100 text-purple-700', description: 'Interactive exercise' },
  example: { label: 'Example', icon: '📋', color: 'bg-orange-100 text-orange-700', description: 'Real-world case study' },
  quiz: { label: 'Quiz', icon: '❓', color: 'bg-red-100 text-red-700', description: 'Knowledge check' },
  summary: { label: 'Summary', icon: '📝', color: 'bg-indigo-100 text-indigo-700', description: 'Recap and review' }
} as const

// Collection categories (predefined options)
export const COLLECTION_CATEGORIES = [
  'Constitutional Law',
  'Civil Rights',
  'Foreign Policy',
  'Domestic Policy',
  'Electoral Systems',
  'Government Structure',
  'Economic Policy',
  'Environmental Policy',
  'Healthcare Policy',
  'Education Policy',
  'Immigration',
  'Criminal Justice',
  'Media & Information',
  'Historical Context',
  'Current Events',
  'Local Government',
  'Federal Government',
  'State Government',
  'International Relations',
  'Social Movements'
] as const

export type CollectionCategory = typeof COLLECTION_CATEGORIES[number]

// Utility functions
export const formatEstimatedTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}m`
}

export const formatProgress = (progress: number): string => {
  return `${Math.round(progress)}%`
}

export const getDifficultyInfo = (level: 1 | 2 | 3 | 4 | 5) => {
  return DIFFICULTY_LEVELS[level]
}

export const getContentTypeInfo = (type: keyof typeof CONTENT_TYPES) => {
  return CONTENT_TYPES[type]
}

export const getLessonStepTypeInfo = (type: keyof typeof LESSON_STEP_TYPES) => {
  return LESSON_STEP_TYPES[type]
}



export interface FeaturedCollection {
  id: string
  collection_id: string
  featured_order: number
  featured_reason: string
  start_date: string
  end_date?: string
  is_active: boolean
  click_count: number
  conversion_rate: number
  created_at: string
  
  // Populated collection data
  collection?: Collection
}

// For API responses
export interface CollectionsResponse {
  collections: Collection[]
  total_count: number
  has_more: boolean
  featured_collections?: FeaturedCollection[]
}

// Mobile-specific types
export interface StepProgress {
  step_id: string
  collection_item_id: string
  completed: boolean
  score?: number
  time_spent: number // in seconds
  completed_at?: string
  attempts?: number
  
  // For quiz steps
  answers?: Record<string, any>
}

export function getMobileDifficultyColor(difficulty?: string): string {
  switch (difficulty) {
    case 'beginner':
      return '#10B981' // green
    case 'intermediate':
      return '#F59E0B' // amber
    case 'advanced':
      return '#EF4444' // red
    default:
      return '#6B7280' // gray
  }
}

export function getMobileDifficultyLabel(difficulty?: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'Beginner'
    case 'intermediate':
      return 'Intermediate'
    case 'advanced':
      return 'Advanced'
    default:
      return 'All Levels'
  }
}

// Mobile-specific utilities
export function formatMobileEstimatedTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export function getMobileProgressColor(percentage: number): string {
  if (percentage === 0) return '#9CA3AF' // gray-400
  if (percentage < 25) return '#EF4444' // red-500
  if (percentage < 50) return '#F59E0B' // amber-500
  if (percentage < 75) return '#3B82F6' // blue-500
  return '#10B981' // emerald-500
}

// Mobile-optimized collection card data
export interface MobileCollectionCard {
  id: string
  slug: string
  title: string
  description: string
  category?: string
  difficulty?: string
  image_url?: string
  estimated_time?: number
  progress_percentage?: number
  is_featured?: boolean
  completion_status: 'not_started' | 'in_progress' | 'completed'
}

// Mobile-specific filters
export interface CollectionFilters {
  category?: string
  difficulty?: string
  search?: string
  featured?: boolean
  completed?: boolean
  inProgress?: boolean
} 