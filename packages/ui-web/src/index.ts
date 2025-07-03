// Web-specific UI Components for CivicSense
// These components use Radix UI, React Hook Form, and other web-specific libraries

// Export utilities
export * from './utils'

// Export all UI components (these have proper exports)
export * from './components/ui'

// Export major feature components
export { Header } from './header'
export { AuthDialog } from './auth/auth-dialog'
export { AuthProvider, useAuth } from './auth/auth-provider'
export { DailyCardStack } from './daily-card-stack'
export { Calendar } from './calendar'
export { ContinueQuizCard } from './continue-quiz-card'
export { CivicsTestAssessment } from './civics-test-assessment'
export { AutoReadPage } from './auto-read-page'
export { ServerHeader } from './server-header'

// Export analytics
export { useAnalytics } from './lib/analytics/analytics'
export { AnalyticsErrorBoundary, QuizErrorBoundary, AuthErrorBoundary, DashboardErrorBoundary } from './components/analytics-error-boundary'

// Export auth components
export * from './auth/password-reset-form'
export * from './auth/sign-in-form'
export * from './auth/sign-up-form'
export * from './auth/user-menu'

// Export bookmark components
export * from './bookmarks/simple-bookmark-button'
export * from './bookmarks/snippet-card'

// Export multiplayer components
export * from './multiplayer/battle-player-panel'
export * from './multiplayer/pvp-game-engine'

// Export quiz components and types
export * from './quiz/quiz-engine'
export * from './quiz/quiz-results'
export * from './quiz/topic-info'
export type { MultiplayerPlayer } from './quiz/v2/types/database'

// Export multiplayer types
export * from './multiplayer/types/game-types'

// Export global audio controls
export { GlobalAudioControls, useGlobalAudio } from './global-audio-controls'

// Export features showcase
export * from './features-showcase'

// Export specific UI components
export * from './components/ui/alert'
export * from './components/ui/button'
export * from './components/ui/dialog'
export * from './components/ui/dropdown-menu'
export * from './components/ui/input'
export * from './components/ui/label'
export * from './components/ui/popover'
export * from './components/ui/select'
export * from './components/ui/separator'
export * from './components/ui/tabs'
export * from './components/ui/toast'
export * from './components/ui/use-toast'
export * from './components/ui/toaster'
export * from './components/ui/toast-utils'

// TEMPORARILY DISABLED: Hooks with web dependencies that cause build issues
// export * from './hooks/usePremium'
// export * from './hooks/useEducationalAccess'
// export * from './hooks/useGamification'
// export * from './hooks/use-translated-content'
// export * from './hooks/useJSONBTranslation' 