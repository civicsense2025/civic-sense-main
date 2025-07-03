/**
 * CivicSense UI Strings Types
 * Types for managing UI text and localization
 */

export interface UIStrings {
  // Common
  loading: string
  error: string
  success: string
  cancel: string
  save: string
  delete: string
  edit: string
  submit: string
  
  // Auth
  signIn: string
  signOut: string
  signUp: string
  email: string
  password: string
  forgotPassword: string
  resetPassword: string
  
  // Navigation
  home: string
  profile: string
  settings: string
  help: string
  
  // Quiz
  startQuiz: string
  nextQuestion: string
  previousQuestion: string
  submitAnswer: string
  correctAnswer: string
  incorrectAnswer: string
  quizComplete: string
  
  // Errors
  genericError: string
  networkError: string
  authError: string
  validationError: string
  
  // Success Messages
  saveSuccess: string
  updateSuccess: string
  deleteSuccess: string
  
  // Settings
  language: string
  theme: string
  notifications: string
  sound: string
  
  // Accessibility
  skipToContent: string
  mainContent: string
  navigation: string
  closeMenu: string
  openMenu: string
  
  // Feedback
  provideFeedback: string
  feedbackSuccess: string
  feedbackError: string
  
  // Time
  today: string
  yesterday: string
  tomorrow: string
  
  // Status
  active: string
  inactive: string
  pending: string
  completed: string
  
  // Social
  share: string
  follow: string
  unfollow: string
  like: string
  unlike: string
  
  // Progress
  progress: string
  level: string
  score: string
  achievements: string
  
  // Multiplayer
  joinGame: string
  createGame: string
  leaveGame: string
  waitingForPlayers: string
  gameStarting: string
  gameEnded: string
  
  // Premium
  upgrade: string
  subscribe: string
  unsubscribe: string
  premium: string
  
  // Misc
  moreInfo: string
  learnMore: string
  getStarted: string
  continue: string
  finish: string
}

export type UIStringPath = string

export interface UIStringService {
  getString(path: UIStringPath, params?: Record<string, string>): string
  formatString(template: string, params: Record<string, string>): string
  setStrings(strings: UIStrings): void
  getStrings(): UIStrings
}

export interface UIStringContext {
  strings: UIStrings
  getString: (path: UIStringPath, params?: Record<string, string>) => string
  formatString: (template: string, params: Record<string, string>) => string
}

export interface UIStringProviderProps {
  children: React.ReactNode
  initialStrings?: UIStrings
} 