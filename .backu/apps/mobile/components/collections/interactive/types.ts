export type CompletionCallback = (completed: boolean, data?: any) => void

export interface BaseInteractiveConfig {
  type: string
}

export interface InteractiveComponentProps {
  config: BaseInteractiveConfig
  title: string
  content: string
  onComplete: CompletionCallback
}

// Question type configurations
export interface MultipleChoiceConfig extends BaseInteractiveConfig {
  type: 'multiple_choice'
  question: string
  options: string[]
  correct_answer: number
  explanation?: string
}

export interface TrueFalseConfig extends BaseInteractiveConfig {
  type: 'true_false'
  statement: string
  correct_answer: boolean
  explanation?: string
}

export interface TextInputConfig extends BaseInteractiveConfig {
  type: 'text_input'
  question: string
  placeholder?: string
  validation?: 'none' | 'email' | 'phone' | 'number'
}

export interface RankingConfig extends BaseInteractiveConfig {
  type: 'ranking'
  items: string[]
  correct_order?: number[]
  instruction: string
}

// Learning content configurations
export interface ConceptConfig extends BaseInteractiveConfig {
  type: 'concept'
  key_points: string[]
  definition?: string
  importance?: string
  related_concepts?: string[]
}

export interface ExampleConfig extends BaseInteractiveConfig {
  type: 'example'
  examples: Array<{
    title: string
    description: string
    source?: string
    highlight?: string
  }>
  takeaway?: string
}

export interface SummaryConfig extends BaseInteractiveConfig {
  type: 'summary'
  key_points: string[]
  next_steps?: string[]
  resources?: Array<{ title: string; url: string }>
}

export interface CaseStudyConfig extends BaseInteractiveConfig {
  type: 'case_study'
  background: string
  challenge: string
  solution?: string
  outcome?: string
  lessons_learned: string[]
  discussion_questions?: string[]
}

export interface ComparisonConfig extends BaseInteractiveConfig {
  type: 'comparison'
  items: Array<{
    name: string
    attributes: Record<string, string | number>
  }>
  focus_attributes?: string[]
}

export interface ResearchConfig extends BaseInteractiveConfig {
  type: 'research'
  research_questions: string[]
  guided_questions?: string[]
  resources?: Array<{ title: string; url: string; type: string }>
}

export interface DebateConfig extends BaseInteractiveConfig {
  type: 'debate'
  topic: string
  positions: Array<{
    stance: string
    arguments: string[]
    evidence?: string[]
  }>
  reflection_questions?: string[]
}

// All interactive configs union type
export type InteractiveConfig = 
  | MultipleChoiceConfig
  | TrueFalseConfig
  | TextInputConfig
  | RankingConfig
  | ConceptConfig
  | ExampleConfig
  | SummaryConfig
  | CaseStudyConfig
  | ComparisonConfig
  | ResearchConfig
  | DebateConfig 