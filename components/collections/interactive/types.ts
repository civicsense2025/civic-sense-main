// Shared types for interactive components

export interface CompletionCallback {
  (completed: boolean, data?: any): void
}

export interface InteractiveComponentProps {
  title?: string
  content?: string
  onComplete?: CompletionCallback
  className?: string
}

// Question type configurations
export interface MultipleChoiceConfig {
  type: 'multiple_choice'
  options: string[]
  correct: number
  explanation: string
  hint?: string
}

export interface TrueFalseConfig {
  type: 'true_false'
  correct: boolean
  explanation: string
  hint?: string
}

export interface TextInputConfig {
  type: 'text_input'
  placeholder?: string
  validation?: 'email' | 'url' | 'phone' | 'none'
  required?: boolean
  min_length?: number
  max_length?: number
}

export interface RankingConfig {
  type: 'ranking'
  items: Array<{ id: string; text: string }>
  correct_order: string[]
  explanation: string
}

// Media interaction configurations
export interface TimelineConfig {
  type: 'timeline'
  events: Array<{
    date: string
    actor: string
    action: string
    result: string
  }>
}

export interface ImageHotspotsConfig {
  type: 'image_hotspots'
  image_url: string
  hotspots: Array<{
    x: number
    y: number
    title: string
    description: string
  }>
}

export interface DragDropConfig {
  type: 'drag_drop'
  items: Array<{ id: string; text: string }>
  targets: Array<{ id: string; label: string; accepts: string[] }>
  feedback: { correct: string; incorrect: string }
}

export interface MapInteractionConfig {
  type: 'map_interaction'
  map_data: any
  interactions: Array<{
    region: string
    popup_content: string
  }>
}

// Card and layout configurations
export interface IntroCardConfig {
  type: 'intro_card'
  emoji: string
  subtitle: string
  background_color: string
  fact?: string
}

export interface SwipeCardsConfig {
  type: 'swipe_cards'
  cards: Array<{
    title: string
    content: string
  }>
}

export interface InfoCardsConfig {
  type: 'info_cards'
  cards: Array<{
    title: string
    content: string
    icon?: string
    color?: string
  }>
}

export interface ProgressCardsConfig {
  type: 'progress_cards'
  steps: Array<{
    title: string
    description: string
    completed?: boolean
  }>
}

// Reflection and action configurations
export interface ReflectionConfig {
  type: 'reflection'
  prompts: string[]
  guidance?: string
}

export interface ActionChecklistConfig {
  type: 'action_checklist'
  primary_action: {
    task: string
    time_needed: string
    difficulty: string
    verification: 'text_input' | 'checkbox'
    placeholder?: string
  }
  bonus_actions?: string[]
  resources?: Array<{ name: string; url: string }>
}

export interface ContactFormConfig {
  type: 'contact_form'
  contacts: Array<{
    name: string
    role: string
    email?: string
    phone?: string
    website?: string
    social?: { platform: string; handle: string }
  }>
  templates: Array<{
    name: string
    subject: string
    body: string
  }>
}

// Poll and survey configurations
export interface QuickPollConfig {
  type: 'quick_poll'
  question: string
  options: string[]
  show_results?: boolean
}

export interface SurveyEmbedConfig {
  type: 'survey_embed'
  survey_url: string
  questions?: Array<{
    question: string
    type: 'text' | 'multiple_choice' | 'rating'
    options?: string[]
  }>
}

export interface OpinionSliderConfig {
  type: 'opinion_slider'
  statement: string
  left_label: string
  right_label: string
  default_value?: number
}

// Simulation configurations
export interface SimulationConfig {
  type: 'simulation'
  scenario: string
  variables: Array<{
    name: string
    min: number
    max: number
    default: number
    step: number
  }>
  outcome_function: string
}

export interface RolePlayConfig {
  type: 'role_play'
  roles: Array<{
    name: string
    description: string
    objectives: string[]
  }>
  scenario: string
  rounds: number
}

export interface DecisionTreeConfig {
  type: 'decision_tree'
  root_question: string
  options: Array<{
    text: string
    consequence: string
    next_question?: string
    final_outcome?: string
  }>
}

// Union type for all configurations
export type InteractionConfig = 
  | MultipleChoiceConfig
  | TrueFalseConfig
  | TextInputConfig
  | RankingConfig
  | TimelineConfig
  | ImageHotspotsConfig
  | DragDropConfig
  | MapInteractionConfig
  | IntroCardConfig
  | SwipeCardsConfig
  | InfoCardsConfig
  | ProgressCardsConfig
  | ReflectionConfig
  | ActionChecklistConfig
  | ContactFormConfig
  | QuickPollConfig
  | SurveyEmbedConfig
  | OpinionSliderConfig
  | SimulationConfig
  | RolePlayConfig
  | DecisionTreeConfig

// Component step interface
export interface InteractiveStep {
  step_type: string
  title: string
  content: string
  interaction_config?: InteractionConfig
} 