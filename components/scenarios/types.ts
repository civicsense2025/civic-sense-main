// =============================================================================
// SCENARIO SYSTEM TYPE DEFINITIONS
// =============================================================================
// TypeScript interfaces that align with the database schema for type safety

// =============================================================================
// CORE SCENARIO TYPES
// =============================================================================

export interface Scenario {
  id: string
  scenario_title: string
  description: string
  scenario_type: 'government_simulation' | 'policy_debate' | 'budget_allocation' | 'election_campaign' | 'citizen_advocacy' | 'crisis_response'
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_duration_minutes: number
  learning_objectives: string[]
  prerequisite_concepts?: string[]
  tags?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export interface ScenarioSituation {
  id: string
  scenario_id: string
  situation_order: number
  situation_title: string
  situation_description: string
  context_information?: Record<string, any>
  media_attachments?: string[]
  time_pressure_seconds?: number
  required_resources?: Record<string, number>
  learning_notes?: string
  is_branching_point: boolean
  created_at: string
}

export interface ScenarioDecision {
  id: string
  situation_id: string
  decision_text: string
  decision_description?: string
  resource_costs?: Record<string, number>
  immediate_effects?: Record<string, number>
  long_term_consequences?: Record<string, any>
  leads_to_situation_id?: string
  teaches_concepts?: string[]
  difficulty_modifier?: number
  hint_text?: string
  is_optimal?: boolean
  created_at: string
}

export interface ScenarioCharacter {
  id: string
  character_name: string
  character_title: string
  character_description?: string
  character_emoji?: string
  character_type: 'citizen' | 'official' | 'advocate' | 'journalist' | 'business_leader' | 'community_organizer' | 'elected_official' | 'judicial_official' | 'law_enforcement' | 'legal_advocate' | 'vulnerable_individual' | 'government_official' | 'activist'
  starting_resources: Record<string, number>
  special_abilities?: Record<string, any>
  background_story?: string
  usable_in_scenario_types?: string[]
  avatar_url?: string
  created_at: string
}

// =============================================================================
// USER PROGRESS TYPES
// =============================================================================

export interface UserScenarioAttempt {
  id: string
  user_id?: string
  guest_token?: string
  scenario_id: string
  selected_character_id?: string
  attempt_number: number
  started_at: string
  completed_at?: string
  final_outcome?: string
  total_time_spent_seconds?: number
  final_resources?: Record<string, number>
  learning_objectives_met?: string[]
  concepts_demonstrated?: string[]
  difficulty_rating?: number
  created_at: string
}

export interface UserScenarioDecision {
  id: string
  attempt_id: string
  situation_id: string
  decision_id: string
  decision_order: number
  resource_state_before: Record<string, number>
  resource_state_after: Record<string, number>
  time_taken_seconds: number
  created_at: string
}

// =============================================================================
// GAME STATE TYPES
// =============================================================================

export type GamePhase = 
  | 'loading'
  | 'character_selection'
  | 'playing'
  | 'decision_outcome'
  | 'completed'
  | 'paused'

export interface ScenarioGameState {
  phase: GamePhase
  currentSituationIndex: number
  selectedCharacter: ScenarioCharacter | null
  resources: Record<string, number>
  decisionsHistory: DecisionRecord[]
  timeSpent: number
  startTime: number | null
}

export interface DecisionRecord {
  situationId: string
  decisionId: string
  timestamp: number
  resourceStateBefore: Record<string, number>
  resourceStateAfter: Record<string, number>
}

export interface ScenarioProgress {
  scenarioId: string
  selectedCharacter: ScenarioCharacter
  currentSituationIndex: number
  currentResources: Record<string, number>
  decisionsHistory: DecisionRecord[]
  startedAt?: string
  completedAt?: string
  finalOutcome?: string
  totalTimeSpent?: number
  learningObjectivesMet?: string[]
  conceptsDemonstrated?: string[]
}

// =============================================================================
// MULTIPLAYER TYPES
// =============================================================================

export interface MultiplayerScenarioRoom {
  id: string
  room_code: string
  host_user_id: string
  room_name: string
  room_status: 'waiting' | 'starting' | 'in_progress' | 'completed'
  current_players: number
  max_players: number
  game_type: 'scenario'
  scenario_id: string
  scenario_settings: Record<string, any>
  created_at: string
}

export interface ScenarioRoomPlayer {
  id: string
  room_id: string
  user_id?: string
  player_name: string
  player_emoji?: string
  selected_character_id?: string
  character_resources?: Record<string, number>
  is_host: boolean
  is_ready: boolean
  join_order: number
  created_at: string
}

// =============================================================================
// UI COMPONENT TYPES
// =============================================================================

export interface SituationDisplayProps {
  situation: ScenarioSituation
  scenario: Scenario | null
  gameState: ScenarioGameState
  className?: string
}

export interface DecisionPanelProps {
  decisions: ScenarioDecision[]
  onDecisionSelect: (decision: ScenarioDecision) => void
  character: ScenarioCharacter | null
  resources: Record<string, number>
  showHint: boolean
  onShowHint: () => void
  enableHints: boolean
  className?: string
}

export interface CharacterSelectorProps {
  characters: ScenarioCharacter[]
  onCharacterSelect: (character: ScenarioCharacter) => void
  scenario: Scenario | null
  className?: string
}

export interface ResourceTrackerProps {
  resources: Record<string, number>
  character: ScenarioCharacter | null
  className?: string
}

export interface OutcomeDisplayProps {
  scenario: Scenario | null
  gameState: ScenarioGameState
  onRestart: () => void
  onContinue: () => void
  className?: string
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ScenarioApiResponse {
  scenario: Scenario
  situations: ScenarioSituation[]
  characters: ScenarioCharacter[]
  decisions: Record<string, ScenarioDecision[]> // Keyed by situation ID
}

export interface ScenarioListResponse {
  scenarios: Array<Scenario & {
    situation_count: number
    character_count: number
    average_completion_time: number
    difficulty_rating: number
  }>
  total: number
  page: number
  pageSize: number
}

export interface ScenarioStatsResponse {
  totalAttempts: number
  completionRate: number
  averageTimeSpent: number
  mostChosenCharacter: ScenarioCharacter
  conceptsMastered: string[]
  difficultyRating: number
}

// =============================================================================
// CONTENT CREATION TYPES
// =============================================================================

export interface CreateScenarioRequest {
  scenario_title: string
  description: string
  scenario_type: Scenario['scenario_type']
  difficulty_level: Scenario['difficulty_level']
  estimated_duration_minutes: number
  learning_objectives: string[]
  prerequisite_concepts?: string[]
  tags?: string[]
}

export interface CreateSituationRequest {
  scenario_id: string
  situation_order: number
  situation_title: string
  situation_description: string
  context_information?: Record<string, any>
  time_pressure_seconds?: number
  required_resources?: Record<string, number>
  learning_notes?: string
  is_branching_point?: boolean
}

export interface CreateDecisionRequest {
  situation_id: string
  decision_text: string
  decision_description?: string
  resource_costs?: Record<string, number>
  immediate_effects?: Record<string, number>
  long_term_consequences?: Record<string, any>
  leads_to_situation_id?: string
  teaches_concepts?: string[]
  hint_text?: string
  is_optimal?: boolean
}

export interface CreateCharacterRequest {
  character_name: string
  character_title: string
  character_description: string
  character_type: ScenarioCharacter['character_type']
  starting_resources: Record<string, number>
  special_abilities?: Record<string, any>
  background_story?: string
  usable_in_scenario_types?: string[]
  avatar_url?: string
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

export interface ScenarioAnalytics {
  scenarioId: string
  totalAttempts: number
  completionRate: number
  averageCompletionTime: number
  popularDecisions: Array<{
    decisionId: string
    decisionText: string
    selectionCount: number
    successRate: number
  }>
  characterUsage: Array<{
    characterId: string
    characterName: string
    usageCount: number
    averagePerformance: number
  }>
  learningObjectivesMastery: Array<{
    objective: string
    masteryRate: number
    averageAttempts: number
  }>
  difficultyProgression: Array<{
    situationIndex: number
    averageTimeSpent: number
    dropoffRate: number
  }>
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface ScenarioError {
  code: string
  message: string
  details?: Record<string, any>
}

export type ScenarioResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ScenarioError }

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type ResourceType = 
  | 'political_capital'
  | 'public_support'
  | 'budget'
  | 'time'
  | 'information'
  | 'relationships'
  | 'credibility'
  | 'media_attention'

export type ConceptType =
  | 'separation_of_powers'
  | 'checks_and_balances'
  | 'federalism'
  | 'civil_rights'
  | 'due_process'
  | 'voting_rights'
  | 'campaign_finance'
  | 'lobbying'
  | 'policy_making'
  | 'budget_process'
  | 'judicial_review'
  | 'executive_power'
  | 'legislative_process'
  | 'public_opinion'
  | 'media_influence'
  | 'grassroots_organizing'
  | 'coalition_building'

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export type ScenarioType = 
  | 'government_simulation'
  | 'policy_debate'
  | 'budget_allocation'
  | 'election_campaign'
  | 'citizen_advocacy'
  | 'crisis_response'

export type CharacterType = 
  | 'citizen'
  | 'official'
  | 'advocate'
  | 'journalist'
  | 'business_leader'
  | 'community_organizer' 