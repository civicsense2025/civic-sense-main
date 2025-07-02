// Web-specific UI Components for CivicSense
// These components use Radix UI, React Hook Form, and other web-specific libraries

// Export utilities
export { cn } from './utils'

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

// Export auth components
export { UserMenu } from './auth/user-menu'
export { SignInForm } from './auth/sign-in-form'
export { SignUpForm } from './auth/sign-up-form'
export { ConsolidatedAuthForm } from './auth/consolidated-auth-form'
export { GoogleOAuthButton } from './auth/google-oauth-button'
export { PasswordResetForm } from './auth/password-reset-form'

// Export bookmark components
export { SnippetCard } from './bookmarks/snippet-card'
export { SimpleBookmarkButton } from './bookmarks/simple-bookmark-button'

// Export multiplayer components
export { BattlePlayerPanel } from './multiplayer/battle-player-panel'

// Export quiz components and types
// export type { QuizQuestion } from './quiz/accessible-quiz-question' // TEMPORARILY DISABLED
export type { MultiplayerPlayer } from './quiz/v2/types/database'

// Export multiplayer types
export * from './multiplayer/types/game-types'

// Export toast hook and function
export { useToast, toast } from './hooks/use-toast'

// Export specific component categories that have index files
// export * from './survey'
// export * from './feedback'

// TEMPORARILY DISABLED: Hooks with web dependencies that cause build issues
// export * from './hooks/usePremium'
// export * from './hooks/useEducationalAccess'
// export * from './hooks/useGamification'
// export * from './hooks/use-translated-content'
// export * from './hooks/useJSONBTranslation' 