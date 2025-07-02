import type { Database } from '@/lib/database.types'
import type { QuizGameMode, QuizQuestion, QuizResults } from '@/lib/types/quiz'

// Extract database types for quiz attempts
export type DbQuizAttempt = Database['public']['Tables']['user_quiz_attempts']['Row']
export type DbQuizAttemptInsert = Database['public']['Tables']['user_quiz_attempts']['Insert']
export type DbQuizAttemptUpdate = Database['public']['Tables']['user_quiz_attempts']['Update']

// Type-safe extraction of quiz-specific fields
export interface QuizAttemptData {
  id: string
  user_id: string
  topic_id: string
  game_mode: QuizGameMode | null
  mode_settings: QuizModeSettings | null
  game_metadata: GameMetadata | null
  response_data: QuizResponseData | null
  social_interactions: SocialInteractions | null
  participants: MultiplayerParticipants | null
  
  // Progress tracking
  total_questions: number
  correct_answers: number | null
  score: number | null
  streak_count: number | null
  max_streak: number | null
  time_spent_seconds: number | null
  
  // Session management
  session_id: string | null
  started_at: string | null
  completed_at: string | null
  is_completed: boolean | null
  
  // LMS integration
  classroom_course_id: string | null
  classroom_assignment_id: string | null
  clever_section_id: string | null
  grade_posted_to_lms: boolean | null
  grade_post_error: string | null
  grade_post_timestamp: string | null
  
  // Pod/Team features
  pod_id: string | null
  team_id: string | null
  team_role: string | null
  
  // Guest support
  guest_token: string | null
  platform: string | null
  
  // Timestamps
  created_at: string | null
  updated_at: string | null
}

// Type-safe mode settings based on DEFAULT_MODE_CONFIGS
export interface QuizModeSettings {
  timeLimit?: number
  showHints?: boolean
  showExplanations?: boolean
  allowSkip?: boolean
  requireEvidence?: boolean
  autoAdvance?: boolean
  powerUpsEnabled?: boolean
  npcDifficulty?: 'easy' | 'medium' | 'hard'
  npcPersonality?: string
  
  // Mode-specific settings
  customSettings?: Record<string, any>
}

// Game metadata for different modes
export interface GameMetadata {
  // Multiplayer
  room_code?: string | null
  room_type?: 'public' | 'private' | null
  round_count?: number | null
  player_count?: number | null
  match_duration?: number | null
  
  // Power-ups and achievements
  power_ups_used?: string[]
  achievements_earned?: string[]
  
  // Social interactions
  social_interactions?: SocialInteractionEvent[]
  
  // Custom metadata for extensibility
  custom?: Record<string, any>
}

// Response data structure for progress restoration
export interface QuizResponseData {
  sessionId: string
  currentQuestionIndex: number
  answers: UserAnswer[]
  startTime: number
  questionStartTimes: Record<string, number>
  
  // Mode-specific response data
  modeSpecificData?: Record<string, any>
}

export interface UserAnswer {
  questionId: number
  answer: string
  isCorrect: boolean
  timeSpent: number
  hintUsed?: boolean
  boostUsed?: string | null
  attempt?: number
  confidence?: number
}

// Social interactions for multiplayer modes
export interface SocialInteractions {
  chat_messages: number
  helpful_votes: number
  reactions_given: number
  reactions_received: number
  player_ratings: Record<string, number>
}

export interface SocialInteractionEvent {
  type: 'chat' | 'reaction' | 'vote' | 'rating'
  timestamp: number
  data: any
}

// Multiplayer participants
export interface MultiplayerParticipants {
  players: MultiplayerPlayer[]
  teams?: MultiplayerTeam[]
}

export interface MultiplayerPlayer {
  id: string
  name: string
  avatar?: string
  score: number
  isReady: boolean
  isHost?: boolean
  teamId?: string
}

export interface MultiplayerTeam {
  id: string
  name: string
  color: string
  playerIds: string[]
  score: number
}

// Helper functions for type-safe database operations
export function createQuizAttemptInsert(
  data: Partial<QuizAttemptData>
): DbQuizAttemptInsert {
  return {
    user_id: data.user_id!,
    topic_id: data.topic_id!,
    total_questions: data.total_questions!,
    game_mode: data.game_mode || null,
    mode_settings: data.mode_settings as any || null,
    game_metadata: data.game_metadata as any || null,
    response_data: data.response_data as any || null,
    social_interactions: data.social_interactions as any || null,
    participants: data.participants as any || null,
    session_id: data.session_id || null,
    guest_token: data.guest_token || null,
    platform: data.platform || null,
    pod_id: data.pod_id || null,
    team_id: data.team_id || null,
    team_role: data.team_role || null,
    classroom_course_id: data.classroom_course_id || null,
    classroom_assignment_id: data.classroom_assignment_id || null,
    clever_section_id: data.clever_section_id || null,
    started_at: data.started_at || new Date().toISOString(),
    is_completed: data.is_completed || false
  }
}

export function createQuizAttemptUpdate(
  data: Partial<QuizAttemptData>
): DbQuizAttemptUpdate {
  const update: DbQuizAttemptUpdate = {}
  
  // Only include defined fields
  if (data.correct_answers !== undefined) update.correct_answers = data.correct_answers
  if (data.score !== undefined) update.score = data.score
  if (data.streak_count !== undefined) update.streak_count = data.streak_count
  if (data.max_streak !== undefined) update.max_streak = data.max_streak
  if (data.time_spent_seconds !== undefined) update.time_spent_seconds = data.time_spent_seconds
  if (data.completed_at !== undefined) update.completed_at = data.completed_at
  if (data.is_completed !== undefined) update.is_completed = data.is_completed
  if (data.response_data !== undefined) update.response_data = data.response_data as any
  if (data.game_metadata !== undefined) update.game_metadata = data.game_metadata as any
  if (data.social_interactions !== undefined) update.social_interactions = data.social_interactions as any
  if (data.participants !== undefined) update.participants = data.participants as any
  if (data.grade_posted_to_lms !== undefined) update.grade_posted_to_lms = data.grade_posted_to_lms
  if (data.grade_post_error !== undefined) update.grade_post_error = data.grade_post_error
  if (data.grade_post_timestamp !== undefined) update.grade_post_timestamp = data.grade_post_timestamp
  
  update.updated_at = new Date().toISOString()
  
  return update
}

// Convert database row to typed attempt data
export function parseQuizAttempt(row: DbQuizAttempt): QuizAttemptData {
  return {
    id: row.id!,
    user_id: row.user_id!,
    topic_id: row.topic_id!,
    game_mode: row.game_mode as QuizGameMode,
    mode_settings: row.mode_settings as unknown as QuizModeSettings,
    game_metadata: row.game_metadata as unknown as GameMetadata,
    response_data: row.response_data as unknown as QuizResponseData,
    social_interactions: row.social_interactions as unknown as SocialInteractions,
    participants: row.participants as unknown as MultiplayerParticipants,
    total_questions: row.total_questions,
    correct_answers: row.correct_answers,
    score: row.score,
    streak_count: row.streak_count,
    max_streak: row.max_streak,
    time_spent_seconds: row.time_spent_seconds,
    session_id: row.session_id,
    started_at: row.started_at,
    completed_at: row.completed_at,
    is_completed: row.is_completed,
    classroom_course_id: row.classroom_course_id,
    classroom_assignment_id: row.classroom_assignment_id,
    clever_section_id: row.clever_section_id,
    grade_posted_to_lms: row.grade_posted_to_lms,
    grade_post_error: row.grade_post_error,
    grade_post_timestamp: row.grade_post_timestamp,
    pod_id: row.pod_id,
    team_id: row.team_id,
    team_role: row.team_role,
    guest_token: row.guest_token,
    platform: row.platform,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
} 