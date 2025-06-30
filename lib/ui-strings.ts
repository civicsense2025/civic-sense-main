/**
 * Centralized UI Strings for CivicSense
 * This file contains all user-facing text strings used throughout the application.
 * It serves as the single source of truth for UI text and facilitates translation.
 */

export const uiStrings = {
  // Brand & App Info
  brand: {
    name: 'CivicSense',
    tagline: 'The civic education politicians don\'t want you to have',
    alphaLabel: 'alpha',
    description: 'Transform from passive observer to confident participant in democracy'
  },

  // Common Actions
  actions: {
    continue: 'Continue',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    confirm: 'Confirm',
    retry: 'Retry',
    reload: 'Reload',
    refresh: 'Refresh',
    share: 'Share',
    copy: 'Copy',
    download: 'Download',
    upload: 'Upload',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    view: 'View',
    viewAll: 'View All',
    viewMore: 'View More',
    viewLess: 'View Less',
    loadMore: 'Load More',
    loading: 'Loading...',
    processing: 'Processing...',
    saving: 'Saving...',
    deleting: 'Deleting...',
    sending: 'Sending...',
    updating: 'Updating...'
  },

  // Navigation
  navigation: {
    home: 'Home',
    dashboard: 'Dashboard',
    categories: 'Categories',
    quizzes: 'Quizzes',
    skills: 'Skills',
    multiplayer: 'Multiplayer',
    learningPods: 'Learning Pods',
    civicsTest: 'Civics Test',
    about: 'About',
    support: 'Support',
    donate: 'Donate',
    settings: 'Settings',
    privacy: 'Privacy',
    terms: 'Terms',
    profile: 'Profile',
    logout: 'Sign Out',
    login: 'Sign In',
    signUp: 'Sign Up',
    publicFigures: 'Public Figures',
    glossary: 'Glossary',
    news: 'News',
    topicsSearch: 'Search Topics'
  },

  // Authentication
  auth: {
    signIn: {
      title: 'Sign In',
      subtitle: 'Welcome back to CivicSense',
      emailLabel: 'Email',
      emailPlaceholder: 'you@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      noAccount: 'Don\'t have an account?',
      signUpLink: 'Sign up',
      continueWithGoogle: 'Continue with Google',
      or: 'or',
      signingIn: 'Signing in...',
      invalidCredentials: 'Invalid email or password',
      networkError: 'Network error. Please try again.',
      tooManyAttempts: 'Too many attempts. Please try again later.'
    },
    signUp: {
      title: 'Create Account',
      subtitle: 'Join CivicSense and start learning',
      emailLabel: 'Email',
      emailPlaceholder: 'you@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Create a password',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: 'Confirm your password',
      passwordRequirements: 'Password must be at least 8 characters',
      termsAgreement: 'By signing up, you agree to our',
      termsLink: 'Terms of Service',
      and: 'and',
      privacyLink: 'Privacy Policy',
      haveAccount: 'Already have an account?',
      signInLink: 'Sign in',
      creatingAccount: 'Creating account...',
      emailInUse: 'This email is already registered',
      weakPassword: 'Password is too weak',
      passwordMismatch: 'Passwords do not match'
    },
    resetPassword: {
      title: 'Reset Password',
      subtitle: 'Enter your email to receive reset instructions',
      emailLabel: 'Email',
      emailPlaceholder: 'you@example.com',
      sendInstructions: 'Send Reset Instructions',
      backToSignIn: 'Back to sign in',
      sending: 'Sending...',
      success: 'Check your email for reset instructions',
      error: 'Failed to send reset email. Please try again.',
      invalidEmail: 'Please enter a valid email address'
    },
    signOut: {
      confirmTitle: 'Sign Out',
      confirmMessage: 'Are you sure you want to sign out?',
      signingOut: 'Signing out...'
    }
  },

  // Quiz & Questions
  quiz: {
    startQuiz: 'Start Quiz',
    continueQuiz: 'Continue Quiz',
    retakeQuiz: 'Retake Quiz',
    nextQuestion: 'Next Question',
    previousQuestion: 'Previous Question',
    submitAnswer: 'Submit Answer',
    skipQuestion: 'Skip Question',
    showHint: 'Show Hint',
    hideHint: 'Hide Hint',
    explanation: 'Explanation',
    correctAnswer: 'Correct Answer',
    yourAnswer: 'Your Answer',
    question: 'Question',
    of: 'of',
    timeRemaining: 'Time Remaining',
    score: 'Score',
    accuracy: 'Accuracy',
    streak: 'Streak',
    complete: 'Quiz Complete!',
    loading: 'Loading quiz...',
    error: 'Failed to load quiz',
    noQuestions: 'No questions available',
    noQuestionsAvailable: 'No questions available for this topic',
    questionTypes: {
      multipleChoice: 'Multiple Choice',
      trueFalse: 'True or False',
      shortAnswer: 'Short Answer',
      matching: 'Matching',
      fillInBlank: 'Fill in the Blank',
      ordering: 'Ordering'
    },
    difficulty: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      expert: 'Expert'
    }
  },

  // Results & Achievements
  results: {
    title: 'Your Results',
    score: 'Score',
    accuracy: 'Accuracy',
    timeSpent: 'Time Spent',
    questionsAnswered: 'Questions Answered',
    correctAnswers: 'Correct Answers',
    incorrectAnswers: 'Incorrect Answers',
    skippedQuestions: 'Skipped Questions',
    averageTime: 'Average Time per Question',
    bestStreak: 'Best Streak',
    xpEarned: 'XP Earned',
    levelUp: 'Level Up!',
    newLevel: 'New Level',
    achievements: 'Achievements',
    viewDetails: 'View Details',
    share: 'Share Results',
    tryAgain: 'Try Again',
    nextQuiz: 'Next Quiz',
    backToHome: 'Back to Home'
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome back',
    yourProgress: 'Your Progress',
    recentActivity: 'Recent Activity',
    stats: 'Statistics',
    level: 'Level',
    xp: 'XP',
    totalQuizzes: 'Total Quizzes',
    completedQuizzes: 'Completed Quizzes',
    averageScore: 'Average Score',
    currentStreak: 'Current Streak',
    longestStreak: 'Longest Streak',
    achievements: 'Achievements',
    skills: 'Skills',
    categories: 'Categories',
    weeklyGoal: 'Weekly Goal',
    dailyChallenge: 'Daily Challenge',
    continuelearning: 'Continue Learning',
    suggestedTopics: 'Suggested Topics',
    upcomingQuizzes: 'Upcoming Quizzes'
  },

  // Categories
  categories: {
    title: 'Categories',
    subtitle: 'Explore topics by category',
    all: 'All Categories',
    trending: 'Trending',
    new: 'New',
    popular: 'Popular',
    skills: 'skills',
    topics: 'topics',
    viewCategory: 'View Category',
    noCategories: 'No categories available'
  },

  // Skills
  skills: {
    title: 'Skills',
    subtitle: 'Build your civic knowledge',
    yourSkills: 'Your Skills',
    allSkills: 'All Skills',
    coreSkills: 'Core Skills',
    advancedSkills: 'Advanced Skills',
    mastery: 'Mastery',
    progress: 'Progress',
    notStarted: 'Not Started',
    inProgress: 'In Progress',
    completed: 'Completed',
    mastered: 'Mastered',
    practiceSkill: 'Practice Skill',
    learnMore: 'Learn More',
    relatedSkills: 'Related Skills',
    prerequisites: 'Prerequisites',
    difficulty: 'Difficulty',
    estimatedTime: 'Estimated Time',
    questionsToMaster: 'Questions to Master'
  },

  // Multiplayer
  multiplayer: {
    title: 'Multiplayer',
    subtitle: 'Compete with friends and learn together',
    createRoom: 'Create Room',
    joinRoom: 'Join Room',
    roomCode: 'Room Code',
    enterRoomCode: 'Enter room code',
    players: 'Players',
    waitingForPlayers: 'Waiting for players...',
    startGame: 'Start Game',
    ready: 'Ready',
    notReady: 'Not Ready',
    host: 'Host',
    you: 'You',
    spectate: 'Spectate',
    inviteFriends: 'Invite Friends',
    gameMode: 'Game Mode',
    gameModes: {
      classic: 'Classic',
      speedRound: 'Speed Round',
      elimination: 'Elimination',
      collaborative: 'Collaborative',
      learningLab: 'Learning Lab'
    },
    settings: 'Game Settings',
    chat: 'Chat',
    leaderboard: 'Leaderboard',
    results: 'Game Results',
    playAgain: 'Play Again',
    exitGame: 'Exit Game'
  },

  // Civics Test
  civicsTest: {
    title: 'Civics Test',
    subtitle: 'Test your civic knowledge',
    description: 'Take the same test given to new citizens',
    startTest: 'Start Test',
    quickTest: 'Quick Test (10 questions)',
    fullTest: 'Full Test (100 questions)',
    practiceMode: 'Practice Mode',
    timedMode: 'Timed Mode',
    yourScore: 'Your Score',
    passingScore: 'Passing Score',
    timeLimit: 'Time Limit',
    questionsCorrect: 'Questions Correct',
    certificate: 'Certificate',
    downloadCertificate: 'Download Certificate',
    shareResults: 'Share Results',
    tryAgain: 'Try Again',
    learnMore: 'Learn More About Each Question'
  },

  // Settings
  settings: {
    title: 'Settings',
    account: 'Account',
    preferences: 'Preferences',
    notifications: 'Notifications',
    privacy: 'Privacy',
    accessibility: 'Accessibility',
    language: 'Language',
    theme: 'Theme',
    themes: {
      light: 'Light',
      dark: 'Dark',
      system: 'System'
    },
    email: 'Email',
    password: 'Password',
    changePassword: 'Change Password',
    deleteAccount: 'Delete Account',
    exportData: 'Export Data',
    saveChanges: 'Save Changes',
    saved: 'Settings saved',
    emailNotifications: 'Email Notifications',
    pushNotifications: 'Push Notifications',
    weeklyDigest: 'Weekly Digest',
    achievementAlerts: 'Achievement Alerts',
    soundEffects: 'Sound Effects',
    animations: 'Animations',
    highContrast: 'High Contrast',
    largeText: 'Large Text',
    reducedMotion: 'Reduced Motion',
    keyboardShortcuts: 'Keyboard Shortcuts',
    timezone: 'Timezone',
    dateFormat: 'Date Format'
  },

  // Premium & Donations
  premium: {
    title: 'Premium Access',
    subtitle: 'Unlock all features and support our mission',
    monthly: 'Monthly',
    yearly: 'Yearly',
    lifetime: 'Lifetime',
    features: 'Premium Features',
    unlimitedQuizzes: 'Unlimited Quizzes',
    advancedAnalytics: 'Advanced Analytics',
    customDecks: 'Custom Decks',
    prioritySupport: 'Priority Support',
    aiFeatures: 'AI-Powered Features',
    offlineAccess: 'Offline Access',
    exportProgress: 'Export Progress',
    currentPlan: 'Current Plan',
    upgrade: 'Upgrade',
    manage: 'Manage Subscription',
    cancel: 'Cancel Subscription',
    donate: 'Make a Donation',
    donationMessage: 'Your support helps us keep civic education accessible to everyone',
    giftAccess: 'Gift Access',
    educationalAccess: 'Educational Access'
  },

  // Errors & Messages
  errors: {
    generic: 'Something went wrong',
    network: 'Network error. Please check your connection.',
    notFound: 'Page not found',
    unauthorized: 'You need to sign in to access this',
    forbidden: 'You don\'t have permission to access this',
    serverError: 'Server error. Please try again later.',
    timeout: 'Request timed out. Please try again.',
    invalidInput: 'Invalid input',
    required: 'This field is required',
    emailInvalid: 'Please enter a valid email',
    passwordWeak: 'Password is too weak',
    tryAgain: 'Please try again',
    contactSupport: 'If the problem persists, contact support'
  },

  messages: {
    success: 'Success!',
    saved: 'Saved successfully',
    deleted: 'Deleted successfully',
    updated: 'Updated successfully',
    sent: 'Sent successfully',
    copied: 'Copied to clipboard',
    welcome: 'Welcome to CivicSense!',
    goodJob: 'Good job!',
    wellDone: 'Well done!',
    keepGoing: 'Keep going!',
    almostThere: 'Almost there!',
    congratulations: 'Congratulations!',
    thankYou: 'Thank you!',
    comingSoon: 'Coming soon',
    maintenanceMode: 'We\'re currently under maintenance',
    newFeature: 'New feature available!',
    updateAvailable: 'Update available'
  },

  // Time & Dates
  time: {
    seconds: 'seconds',
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    weeks: 'weeks',
    months: 'months',
    years: 'years',
    ago: 'ago',
    remaining: 'remaining',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    thisWeek: 'This Week',
    lastWeek: 'Last Week',
    nextWeek: 'Next Week',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    nextMonth: 'Next Month'
  },

  // Learning Pods
  learningPods: {
    title: 'Pods',
    subtitle: 'Learn together in small groups',
    createPod: 'Create Pod',
    joinPod: 'Join Pod',
    myPods: 'My Pods',
    discoverPods: 'Discover Pods',
    podTypes: {
      family: 'Family',
      friends: 'Friends',
      classroom: 'Classroom',
      studyGroup: 'Study Group',
      bookClub: 'Book Club',
      organization: 'Organization'
    },
    members: 'Members',
    activities: 'Activities',
    progress: 'Pod Progress',
    invite: 'Invite Members',
    settings: 'Pod Settings',
    leave: 'Leave Pod',
    disband: 'Disband Pod'
  },

  // Accessibility
  accessibility: {
    skipToContent: 'Skip to content',
    mainNavigation: 'Main navigation',
    userMenu: 'User menu',
    darkModeToggle: 'Toggle dark mode',
    languageSelector: 'Select language',
    closeDialog: 'Close dialog',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    loadingContent: 'Loading content',
    expandSection: 'Expand section',
    collapseSection: 'Collapse section',
    playAudio: 'Play audio',
    pauseAudio: 'Pause audio',
    stopAudio: 'Stop audio',
    increaseSpeed: 'Increase speed',
    decreaseSpeed: 'Decrease speed'
  },

  // Footer
  footer: {
    copyright: '© 2025 CivicSense. All rights reserved.',
    about: 'About',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    support: 'Support',
    donate: 'Donate',
    socialMedia: 'Follow us'
  }
} as const

// Type for the UI strings structure
export type UIStrings = typeof uiStrings

// Helper to get nested string values
export type UIStringPath = {
  [K in keyof UIStrings]: UIStrings[K] extends string
    ? K
    : UIStrings[K] extends Record<string, any>
    ? {
        [P in keyof UIStrings[K]]: UIStrings[K][P] extends string
          ? `${K}.${P & string}`
          : UIStrings[K][P] extends Record<string, any>
          ? `${K}.${P & string}.${keyof UIStrings[K][P] & string}`
          : never
      }[keyof UIStrings[K]]
    : never
}[keyof UIStrings]

// Helper function to get string by path
export function getString(path: UIStringPath): string {
  const keys = path.split('.')
  let result: any = uiStrings
  
  for (const key of keys) {
    result = result[key]
    if (result === undefined) {
      console.warn(`UI string not found: ${path}`)
      return path
    }
  }
  
  return result as string
}

// Export individual sections for convenience
export const { 
  brand, 
  actions, 
  navigation, 
  auth, 
  quiz, 
  results, 
  dashboard,
  categories,
  skills,
  multiplayer,
  civicsTest,
  settings,
  premium,
  errors,
  messages,
  time,
  learningPods,
  accessibility,
  footer
} = uiStrings 