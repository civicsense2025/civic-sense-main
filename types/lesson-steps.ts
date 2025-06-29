// Lesson Steps and Multi-Step Learning Types for CivicSense

export type LessonStepType = 
  | 'introduction' 
  | 'concept' 
  | 'example' 
  | 'practice' 
  | 'reflection' 
  | 'action' 
  | 'assessment' 
  | 'summary' 
  | 'resources'

export type LessonStepStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'completed' 
  | 'skipped'

export type MediaType = 'image' | 'video' | 'audio' | 'interactive'

export interface LessonStep {
  id: string
  collection_id: string
  
  // Step organization
  step_number: number
  step_type: LessonStepType
  
  // Content
  title: string
  content: string
  summary?: string
  
  // Media and resources
  media_url?: string
  media_type?: MediaType
  resources: Array<{
    title: string
    url: string
    type: 'article' | 'video' | 'document' | 'website' | 'tool'
    description?: string
  }>
  
  // Learning structure
  estimated_minutes: number
  difficulty_level: number // 1-5 scale
  learning_objectives: string[]
  key_concepts: string[]
  
  // Interactive elements
  has_quiz: boolean
  quiz_questions?: QuizQuestion[]
  has_reflection: boolean
  reflection_prompts: string[]
  
  // Action orientation
  action_items: string[]
  civic_engagement_opportunities: string[]
  
  // Flow control
  is_optional: boolean
  prerequisites: number[] // Array of step numbers that must be completed first
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // User progress (populated when user is authenticated)
  progress?: UserLessonStepProgress
}

export interface UserLessonStepProgress {
  id: string
  user_id: string
  lesson_step_id: string
  collection_id: string
  
  // Progress tracking
  status: LessonStepStatus
  time_spent_seconds: number
  started_at?: string
  completed_at?: string
  interactions_count: number
  
  // Learning assessment
  quiz_score?: number
  reflection_response?: string
  understanding_rating?: number // 1-5 scale
  difficulty_rating?: number // 1-5 scale
  
  // Action tracking
  actions_planned?: string[]
  actions_completed?: string[]
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface QuizQuestion {
  id: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'reflection'
  question: string
  options?: string[] // For multiple choice
  correct_answer?: number | boolean | string
  explanation?: string
  points?: number
}

export interface LessonStepsResponse {
  steps: LessonStep[]
  total_steps: number
  completed_steps: number
  progress_percentage: number
  estimated_total_minutes: number
  current_step?: LessonStep
  next_available_step?: LessonStep
}

export interface UpdateLessonStepProgressRequest {
  lesson_step_id: string
  status?: LessonStepStatus
  time_spent_seconds?: number
  quiz_score?: number
  reflection_response?: string
  understanding_rating?: number
  difficulty_rating?: number
  actions_planned?: string[]
  actions_completed?: string[]
}

// Helper functions
export function getStepTypeInfo(stepType: LessonStepType) {
  const typeMap = {
    introduction: {
      label: 'Introduction',
      icon: '👋',
      color: 'text-blue-600 border-blue-200'
    },
    concept: {
      label: 'Concept',
      icon: '💡',
      color: 'text-yellow-600 border-yellow-200'
    },
    example: {
      label: 'Example',
      icon: '📝',
      color: 'text-green-600 border-green-200'
    },
    practice: {
      label: 'Practice',
      icon: '🎯',
      color: 'text-purple-600 border-purple-200'
    },
    reflection: {
      label: 'Reflection',
      icon: '🤔',
      color: 'text-indigo-600 border-indigo-200'
    },
    action: {
      label: 'Action',
      icon: '🚀',
      color: 'text-red-600 border-red-200'
    },
    assessment: {
      label: 'Assessment',
      icon: '📊',
      color: 'text-orange-600 border-orange-200'
    },
    summary: {
      label: 'Summary',
      icon: '📋',
      color: 'text-gray-600 border-gray-200'
    },
    resources: {
      label: 'Resources',
      icon: '📚',
      color: 'text-teal-600 border-teal-200'
    }
  }
  
  return typeMap[stepType] || typeMap.concept
}

export function formatStepDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}m`
}

export function calculateStepProgress(steps: LessonStep[]) {
  const requiredSteps = steps.filter(step => !step.is_optional)
  const completedSteps = requiredSteps.filter(step => 
    step.progress?.status === 'completed'
  )
  
  const total = requiredSteps.length
  const completed = completedSteps.length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  
  return {
    total,
    completed,
    percentage,
    remaining: total - completed
  }
}

export interface LessonStepTemplate {
  id: string
  
  // Template metadata
  name: string
  description?: string
  step_type: LessonStepType
  category: string // 'constitutional_law', 'current_events', etc.
  
  // Template structure
  content_template: string
  default_objectives: string[]
  default_concepts: string[]
  suggested_duration_minutes: number
  
  // Template variables
  template_variables: Record<string, any>
  
  // Usage tracking
  usage_count: number
  
  created_at: string
  updated_at: string
}

// API request/response types
export interface CreateLessonStepRequest {
  collection_id: string
  step_number: number
  step_type: LessonStepType
  title: string
  content: string
  summary?: string
  media_url?: string
  media_type?: MediaType
  resources?: Array<{
    title: string
    url: string
    type: 'article' | 'video' | 'document' | 'website' | 'tool'
    description?: string
  }>
  estimated_minutes?: number
  difficulty_level?: number
  learning_objectives?: string[]
  key_concepts?: string[]
  has_quiz?: boolean
  quiz_questions?: QuizQuestion[]
  has_reflection?: boolean
  reflection_prompts?: string[]
  action_items?: string[]
  civic_engagement_opportunities?: string[]
  is_optional?: boolean
  prerequisites?: number[]
}

export interface UpdateLessonStepRequest extends Partial<CreateLessonStepRequest> {
  id: string
}

// UI component props
export interface LessonStepCardProps {
  step: LessonStep
  isActive?: boolean
  isCompleted?: boolean
  isLocked?: boolean
  onClick?: () => void
  className?: string
}

export interface LessonStepViewerProps {
  step: LessonStep
  onComplete?: (stepId: string) => void
  onNext?: () => void
  onPrevious?: () => void
  onUpdateProgress?: (progress: Partial<UserLessonStepProgress>) => void
}

export interface LessonProgressSidebarProps {
  steps: LessonStep[]
  currentStepId?: string
  onStepSelect?: (stepId: string) => void
  className?: string
}

export interface QuizComponentProps {
  questions: QuizQuestion[]
  onComplete?: (score: number, answers: Record<string, any>) => void
  allowReview?: boolean
}

export interface ReflectionComponentProps {
  prompts: string[]
  onSubmit?: (response: string) => void
  initialResponse?: string
}

export interface ActionPlannerProps {
  actionItems: string[]
  civicOpportunities: string[]
  onPlan?: (planned: string[]) => void
  onComplete?: (completed: string[]) => void
  initialPlanned?: string[]
  initialCompleted?: string[]
}

// Step type helpers
export const STEP_TYPE_INFO = {
  introduction: {
    label: 'Introduction',
    icon: '👋',
    color: 'bg-blue-100 text-blue-700',
    description: 'Overview and context'
  },
  concept: {
    label: 'Concept',
    icon: '💡',
    color: 'bg-green-100 text-green-700',
    description: 'Core ideas and principles'
  },
  example: {
    label: 'Example',
    icon: '📋',
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Real-world applications'
  },
  practice: {
    label: 'Practice',
    icon: '✏️',
    color: 'bg-purple-100 text-purple-700',
    description: 'Interactive exercises'
  },
  reflection: {
    label: 'Reflection',
    icon: '🤔',
    color: 'bg-indigo-100 text-indigo-700',
    description: 'Think and analyze'
  },
  action: {
    label: 'Action',
    icon: '🎯',
    color: 'bg-red-100 text-red-700',
    description: 'Take civic action'
  },
  assessment: {
    label: 'Assessment',
    icon: '📊',
    color: 'bg-orange-100 text-orange-700',
    description: 'Test understanding'
  },
  summary: {
    label: 'Summary',
    icon: '📝',
    color: 'bg-gray-100 text-gray-700',
    description: 'Key takeaways'
  },
  resources: {
    label: 'Resources',
    icon: '📚',
    color: 'bg-teal-100 text-teal-700',
    description: 'Additional materials'
  }
} as const

export const DIFFICULTY_LABELS = {
  1: 'Beginner',
  2: 'Easy', 
  3: 'Moderate',
  4: 'Advanced',
  5: 'Expert'
} as const

// Utility functions
export const getNextAvailableStep = (steps: LessonStep[]): LessonStep | null => {
  // Find the first step that's not completed and has all prerequisites met
  const sortedSteps = [...steps].sort((a, b) => a.step_number - b.step_number)
  
  for (const step of sortedSteps) {
    if (step.progress?.status === 'completed') continue
    
    // Check if all prerequisites are met
    const prerequisitesMet = step.prerequisites.every(prereqNumber => {
      const prereqStep = steps.find(s => s.step_number === prereqNumber)
      return prereqStep?.progress?.status === 'completed'
    })
    
    if (prerequisitesMet) {
      return step
    }
  }
  
  return null
}

export const isStepLocked = (step: LessonStep, allSteps: LessonStep[]): boolean => {
  return step.prerequisites.some(prereqNumber => {
    const prereqStep = allSteps.find(s => s.step_number === prereqNumber)
    return prereqStep?.progress?.status !== 'completed'
  })
}

export const estimateTotalTime = (steps: LessonStep[]): number => {
  return steps.reduce((total, step) => total + step.estimated_minutes, 0)
} 