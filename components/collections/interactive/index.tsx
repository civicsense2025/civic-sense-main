'use client'

// Main exports for all interactive components
export { MultipleChoice, TrueFalse, TextInput, Ranking } from './question-types'
export { Timeline, ImageHotspots, DragDrop, MapInteraction } from './media-interactions'
export { IntroCard, SwipeCards, InfoCards, ProgressCards } from './cards-and-layouts'
export { Reflection, ActionChecklist, ContactForm } from './reflection-and-actions'
export { QuickPoll, SurveyEmbed, OpinionSlider } from './polls-and-surveys'
export { Simulation, RolePlay, DecisionTree } from './simulations'

// All components can be used individually
// No main wrapper needed - use specific components as needed

// Types
export type {
  InteractiveComponentProps,
  InteractionConfig,
  CompletionCallback
} from './types' 