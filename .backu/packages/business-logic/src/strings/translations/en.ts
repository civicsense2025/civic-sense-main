// UI Strings for CivicSense Mobile App
// This file contains all user-facing text that can be translated

export interface UIStrings {
  // Navigation & Header
  navigation: {
    back: string;
    close: string;
    menu: string;
    home: string;
    topics: string;
    learn: string;
    profile: string;
    settings: string;
    bookmarks: string;
    history: string;
    signInToPlay: string;
    signInToSaveProgress: string;
  };

  // Topic Page
  topic: {
    loading: string;
    loadingDetails: string;
    backToTopics: string;
    share: string;
    bookmark: string;
    removeBookmark: string;
    bookmarkThis: string;
    translateThisPage: string;
    showOriginal: string;
    whyThisMatters: string;
    sourcesAndReferences: string;
    takingTheQuiz: string;
    startQuiz: string;
    
    // Topic Stats - Enhanced
    questionsLabel: string;
    estimatedMinutesLabel: string;
    ratingLabel: string;
    publishedLabel: string;
    levelLabel: string;
    difficultyLabel: string;
    questionsCount: string;
    estimatedTime: string;
    level: string;
    difficulty: string;
    
    // Difficulty levels
    easy: string;
    medium: string;
    hard: string;
    beginner: string;
    intermediate: string;
    advanced: string;
    
    thinkYouGotIt: string;
    testYourUnderstanding: string;
    noSourcesAvailable: string;
    noSourcesDescription: string;
    understandingSourceAnalysis: string;
    biasRatingsMeaning: string;
    credibilityPercentageMeaning: string;
    howRatingsDetermined: string;
    areRatingsPermanent: string;
    sourceAnalysisImportance: string;
    
    // Reviews and Ratings - Comprehensive
    ratingsAndReviews: string;
    communityFeedback: string;
    communityReviews: string;
    rateThisTopic: string;
    howHelpfulWasThis: string;
    noRatingsYet: string;
    recentReviews: string;
    noReviewsYet: string;
    noReviewsDescription: string;
    writeFirstReview: string;
    viewAllReviews: string;
    editRating: string;
    ratingBreakdown: string;
    shareYourThoughts: string;
    completeQuizToReview: string;
    takeQuizToShare: string;
    wasThisHelpful: string;
    writeAReview: string;
    rateAndReview: string;
    selectRating: string;
    submitReview: string;
    shareYourThoughtsDesc: string;
    yourReview: string;
    recently: string;
    
    // Rating options
    excellent: string;
    veryGood: string;
    good: string;
    fair: string;
    poor: string;
    
    // Review states
    checkingProgress: string;
    loadingReviews: string;
    submittingReview: string;
    reviewSubmitted: string;
    thankYouForReview: string;
    
    // Helpfulness voting
    helpful: string;
    notHelpful: string;
    markAsHelpful: string;
    markAsNotHelpful: string;
    
    // Review completion requirements
    completeToReview: string;
    takeQuizFirst: string;
    finishTopicToReview: string;
  };

  // Translation
  translation: {
    selectLanguage: string;
    languagePreferenceSaved: string;
    translating: string;
    translationComplete: string;
    translationError: string;
    helpTranslate: string;
    noTranslationAvailable: string;
    loadingTranslations: string;
    checkingTranslations: string;
    savingTranslations: string;
    autoTranslating: string;
    translatingQuestion: string;
    originalText: string;
    loadingExistingTranslations: string;
    translateContent: string;
    allQuestionsTranslated: string;
    translationNeeded: string;
    helpTranslateContent: string;
    translationTest: string;
    translationTestResult: string;
    translationTestFailed: string;
    initializingTranslationService: string;
    translated: string;
    // Language Selection Modal
    original: string;
    availableTranslations: string;
    fullyTranslated: string;
    helpTranslateDescription: string;
    contributeTranslation: string;
    contributeTitle: string;
    contributeMessage: string;
    getStarted: string;
    thankYou: string;
    contactInstructions: string;
    dontSeeLanguage: string;
    requestLanguage: string;
    // Scanner animation strings
    analyzingContent: string;
    translatingToLanguage: string;
    optimizingLayout: string;
    elementsTranslated: string;
  };

  // Source Analysis
  sources: {
    analysisOverview: string;
    politicalBias: string;
    factualRating: string;
    transparency: string;
    analysisSummary: string;
    topicRelevanceCheck: string;
    validationDetails: string;
    strengths: string;
    areasForImprovement: string;
    redFlags: string;
    recommendations: string;
    readFullArticle: string;
    loadingAnalysis: string;
    analyzed: string;
    credibility: string;
  };

  // Language Names (for interface)
  languages: {
    english: string;
    spanish: string;
    chinese: string;
    vietnamese: string;
    arabic: string;
    hindi: string;
    french: string;
    german: string;
    portuguese: string;
    russian: string;
    japanese: string;
    korean: string;
    italian: string;
  };

  // Common Actions
  actions: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    share: string;
    copy: string;
    download: string;
    upload: string;
    refresh: string;
    retry: string;
    tryAgain: string;
    continue: string;
    next: string;
    previous: string;
    finish: string;
    submit: string;
    confirm: string;
    yes: string;
    no: string;
    ok: string;
    dismiss: string;
  };

  // Status Messages
  status: {
    loading: string;
    saving: string;
    saved: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    completed: string;
    failed: string;
    connecting: string;
    connected: string;
    disconnected: string;
    offline: string;
    online: string;
    syncing: string;
    synced: string;
  };

  // Errors
  errors: {
    networkError: string;
    serverError: string;
    unknownError: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    timeout: string;
    connectionLost: string;
    invalidInput: string;
    requiredField: string;
    loadingFailed: string;
    savingFailed: string;
    uploadFailed: string;
    downloadFailed: string;
  };

  // Time & Dates
  time: {
    now: string;
    today: string;
    yesterday: string;
    tomorrow: string;
    thisWeek: string;
    lastWeek: string;
    thisMonth: string;
    lastMonth: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    weeksAgo: string;
    monthsAgo: string;
  };

  // Quiz & Questions
  quiz: {
    question: string;
    questions: string;
    answer: string;
    answers: string;
    correct: string;
    incorrect: string;
    explanation: string;
    hint: string;
    score: string;
    results: string;
    startQuiz: string;
    nextQuestion: string;
    previousQuestion: string;
    finishQuiz: string;
    retakeQuiz: string;
    reviewAnswers: string;
    timeRemaining: string;
    questionNumber: string;
    totalQuestions: string;
    correctAnswers: string;
    incorrectAnswers: string;
    finalScore: string;
    // Missing properties that game room needs
    complete: string;
    of: string;
    title: string;
    // Quiz Engine Specific
    loadingQuestion: string;
    unsupportedQuestionType: string;
    questionsComplete: string;
    timeUp: string;
    pauseQuiz: string;
    resumeQuiz: string;
    exitQuiz: string;
    saveProgress: string;
    restoreProgress: string;
    quizMode: string;
    practiceMode: string;
    testMode: string;
    selectAnswer: string;
    submitAnswer: string;
    showExplanation: string;
    hideExplanation: string;
    yourAnswer: string;
    correctAnswer: string;
    continueToNext: string;
    // Question Types
    questionTypes: {
      multipleChoice: string;
      trueFalse: string;
      shortAnswer: string;
      fillInBlank: string;
      matching: string;
      ordering: string;
      crossword: string;
    };
    multipleChoice: string;
    trueFalse: string;
    shortAnswer: string;
    fillInBlank: string;
    matching: string;
    ordering: string;
    crossword: string;
    // Quiz Results
    accuracy: string;
    timeSpent: string;
    averageTime: string;
    breakdown: string;
    recommendations: string;
    questionsAnswered: string;
    questionsSkipped: string;
    percentageScore: string;
    passingScore: string;
    passed: string;
    failed: string;
    tryAgain: string;
    viewReview: string;
    backToTopics: string;
    // Additional quiz properties
    difficulty: {
      easy: string;
      medium: string;
      hard: string;
    };
  };

  // Onboarding
  onboarding: {
    welcome: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    getStarted: string;
    skip: string;
    exploreOnOwn: string;
    timeToComplete: string;
    personalizedLearning: string;
    personalizedLearningDesc: string;
    communityLearning: string;
    communityLearningDesc: string;
    trackProgress: string;
    trackProgressDesc: string;
    learnTogether: string;
    learnTogetherDesc: string;
    earnAchievements: string;
    earnAchievementsDesc: string;
    personalizeExperience: string;
    personalizeExperienceDesc: string;
    learningStyle: string;
    learningStyleDesc: string;
    visual: string;
    visualDesc: string;
    reading: string;
    readingDesc: string;
    mixed: string;
    mixedDesc: string;
    difficultyLevel: string;
    difficultyLevelDesc: string;
    beginner: string;
    beginnerDesc: string;
    intermediate: string;
    intermediateDesc: string;
    adaptive: string;
    adaptiveDesc: string;
    location: string;
    locationOptional: string;
    city: string;
    state: string;
    zipCode: string;
    dailyReminders: string;
    dailyRemindersDesc: string;
    whatsNext: string;
    whatsNextDesc: string;
    completeSetup: string;
    invalidZipCode: string;
    invalidZipCodeDesc: string;
    invalidState: string;
    invalidStateDesc: string;
    invalidCity: string;
    invalidCityDesc: string;
    zipCodePlaceholder: string;
    cityPlaceholder: string;
    statePlaceholder: string;
    stateLocationDesc: string;
    cityLocationDesc: string;
    zipCodeLocationDesc: string;
    // Category Selection
    categorySelectionTitle: string;
    categorySelectionDesc: string;
    chooseTopics: string;
    selectInterests: string;
    categoryLoading: string;
    categoryLoadingError: string;
    questionsAvailable: string;
    atLeastOneCategory: string;
    fallbackCategoryDesc: string;
    // Additional onboarding properties
    step: string;
    choosePlayStyle: string;
    setChallenge: string;
    customize: string;
    soloChallenge: string;
    soloChallengeDescription: string;
    orUseCustomSettings: string;
  };

  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    done: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    skip: string;
    retry: string;
  };

  // Game Room
  gameRoom: {
    questionsPreview: string;
    settings: string;
    sources: string;
    quizSettings: string;
    showHints: string;
    getHelpfulClues: string;
    showExplanations: string;
    learnWhyAnswersCorrect: string;
    hardMode: string;
    hardModeDescription: string;
    timeLimit: string;
    noTimeLimit: string;
    estimatedTime: string;
    questionsAvailable: string;
    getReady: string;
    trustedSources: string;
    credibilityStandards: string;
  };

  // Multiplayer
  multiplayer: {
    title: string;
    connectionError: string;
    failedToJoin: string;
    failedToStart: string;
    leaveRoomConfirm: string;
    inviteMessage: string;
    inviteTitle: string;
    aiPlayer: string;
    humanPlayer: string;
    sharingFailed: string;
    // Game Phase States
    getReadyToPlay: string;
    startReview: string;
    waitingForPlayers: string;
    waitingForHost: string;
    gameMode: string;
    questions: string;
    features: string;
    // Game Features
    hints: string;
    explanations: string;
    teamMode: string;
    powerUps: string;
    // NPC Battle
    npcBattle: string;
    testYourKnowledge: string;
    skillLevel: string;
    // Room Management
    roomCode: string;
    maxPlayers: string;
    currentPlayers: string;
    // Navigation and UI
    leaderboard: string;
    chat: string;
    settings: string;
    // Countdown Phase
    gameStartingSoon: string;
    getReadyFirstQuestion: string;
    battleStarting: string;
    firstQuestionLoading: string;
    // Question Phase
    question: string;
    questionNumber: string;
    hint: string;
    showHint: string;
    submitAnswer: string;
    explanation: string;
    shield: string;
    attack: string;
    focus: string;
    // Quiz Results
    correct: string;
    incorrect: string;
    timeUp: string;
    finalScore: string;
    // Game Completion
    gameComplete: string;
    greatJobLearning: string;
    shareResults: string;
    continue: string;
    victory: string;
    goodTry: string;
    correctAnswers: string;
    accuracy: string;
    playAgain: string;
    exit: string;
    // Player Status
    ready: string;
    notReady: string;
    thinking: string;
    answered: string;
    // Chat Messages
    roomChat: string;
    players: string;
    typeMessage: string;
    enterToSend: string;
    beRespectful: string;
    playerJoined: string;
    playerLeft: string;
    gameStarting: string;
    welcomeToQuiz: string;
    // Host Settings
    allowNewPlayers: string;
    allowNewPlayersDesc: string;
    enableBoosts: string;
    enableBoostsDesc: string;
    showHints: string;
    showHintsDesc: string;
    autoAdvance: string;
    autoAdvanceDesc: string;
    realTimeScores: string;
    realTimeScoresDesc: string;
    enableChat: string;
    enableChatDesc: string;
    // Error Messages
    connectionLost: string;
    failedToSubmitAnswer: string;
    networkError: string;
    // Status Labels
    ai: string;
    host: string;
    titleDescription: string;
    liveGameScreen: string;
  };

  // Analytics
  analytics: {
    loadingInsights: string;
    couldNotLoadInsights: string;
    couldNotRefreshInsights: string;
    excellentPerformance: string;
    goodProgress: string;
    keepLearning: string;
    needHelp: string;
  };

  // News
  news: {
    dailyNews: string;
    latestNews: string;
    articles: string;
    fetchingFrom: string;
    noValidArticles: string;
    failedToLoad: string;
    newsAPI: string;
    unknownError: string;
    refreshNews: string;
    updating: string;
    today: string;
    yesterday: string;
    // Enhanced news strings
    breakingNews: string;
    newsUpdates: string;
    readMore: string;
    readFull: string;
    source: string;
    publishedBy: string;
    lastUpdated: string;
    originalSource: string;
    previousArticle: string;
    nextArticle: string;
    backToNews: string;
    filterByCategory: string;
    sortBy: string;
    newest: string;
    oldest: string;
    mostRelevant: string;
    noArticlesFound: string;
    loadingFailed: string;
    tryAgainLater: string;
    shareArticle: string;
    copyLink: string;
    linkCopied: string;
    savedToDb: string;
    ago: string;
  };

  // Collections and Interactive Components
  collections: {
    // Action Planner
    takeAction: string;
    planned: string;
    completed: string;
    immediateActions: string;
    immediateActionsDesc: string;
    civicEngagementOpportunities: string;
    civicEngagementDesc: string;
    markAsCompleted: string;
    yourActionPlan: string;
    youvePlannedActions: string;
    andCompleted: string;
    greatJobTakingAction: string;
    keepGoing: string;
    readyToTakeAction: string;
    checkOffActions: string;
    outstanding: string;
    completedAllActions: string;

    // Interactive Components - General
    quickCheck: string;
    complete: string;
    submitAnswer: string;
    correct: string;
    notQuiteRight: string;
    showHint: string;
    hideHint: string;
    selectAnAnswer: string;
    answerSelected: string;
    
    // True/False
    trueOrFalse: string;
    selectTrueFalse: string;
    
    // Text Input
    yourResponse: string;
    enterYourAnswer: string;
    submitResponse: string;
    responseRecorded: string;
    thankYouForInput: string;
    enterYourResponse: string;
    charactersCount: string;
    
    // Ranking
    rankingExercise: string;
    dragToReorder: string;
    rankingComplete: string;
    dragToReorderItems: string;
    rankingExplanation: string;
    
    // Timeline
    interactiveTimeline: string;
    clickEachEvent: string;
    exploreAllEvents: string;
    
    // Reflection
    reflection: string;
    reflectionPrompts: string;
    shareYourThoughts: string;
    saveReflection: string;
    
    // Action Checklist
    actionChecklist: string;
    actionsCompleted: string;
    primaryAction: string;
    bonusActions: string;
    helpfulResources: string;
    markAsComplete: string;
    actionComplete: string;
    takeActionStatus: string;
    pending: string;
    
    // Contact Form
    contactRepresentatives: string;
    contactsReached: string;
    whoToContact: string;
    messageTemplates: string;
    sendWithTemplate: string;
    visitWebsite: string;
    alreadyContacted: string;
    markAsContacted: string;
    
    // Quick Poll
    quickPoll: string;
    castVote: string;
    thanksForVoting: string;
    results: string;
    votes: string;
    
    // Survey
    surveyTitle: string;
    questionProgress: string;
    simulationResults: string;
    yourAnswer: string;
    previous: string;
    next: string;
    completeSurvey: string;
    externalSurveyDesc: string;
    openSurvey: string;
    
    // Opinion Slider
    opinionScale: string;
    moveSlider: string;
    submitOpinion: string;
    thanksForOpinion: string;
    stronglyDisagree: string;
    disagree: string;
    neutral: string;
    agree: string;
    stronglyAgree: string;
    
    // Simulation
    policySimulation: string;
    scenario: string;
    adjustVariables: string;
    runSimulation: string;
    
    // Role Play
    rolePlayingExercise: string;
    chooseYourRole: string;
    objectives: string;
    whatActionTake: string;
    negotiateStakeholders: string;
    gatherMoreInfo: string;
    rolePlayComplete: string;
    yourDecisions: string;
    
    // Decision Tree
    decisionPath: string;
    decisionPoint: string;
    chooseResponse: string;
    finalOutcome: string;
    reflectionNote: string;
    tryDifferentPath: string;
    yourPath: string;
    
    // Cards and Layouts
    compareAndContrast: string;
    continueLearning: string;
    viewAllCards: string;
    nextCard: string;
    previousCard: string;
    
    // Media Interactions
    exploreImage: string;
    dragAndDrop: string;
    availableItems: string;
    interactiveMap: string;
    checkAnswers: string;
    allItemsAssigned: string;
    assigned: string;
    
    // Enhanced interaction types
    adjustParameters: string;
    viewResults: string;
    resetSimulation: string;
    
    // Form and input types
    fillInTheBlanks: string;
    matchingPairs: string;
    categorizeItems: string;
    
    // Progress and feedback
    progressUpdate: string;
    wellDone: string;
    goodEffort: string;
    keepTrying: string;
    perfect: string;
    almostThere: string;
  };

  // Accessibility
  accessibility: {
    skipToContent: string;
    mainNavigation: string;
    userMenu: string;
    darkModeToggle: string;
    languageSelector: string;
    closeDialog: string;
    openMenu: string;
    closeMenu: string;
    loadingContent: string;
    expandSection: string;
    collapseSection: string;
    playAudio: string;
    pauseAudio: string;
    stopAudio: string;
    increaseSpeed: string;
    decreaseSpeed: string;
    goBack: string;
    openLink: string;
    bookmark: string;
    removeBookmark: string;
  };

  // Settings
  settings: {
    title: string;
    account: string;
    preferences: string;
    notifications: string;
    privacy: string;
    accessibility: string;
    language: string;
    theme: string;
    themes: {
      light: string;
      dark: string;
      system: string;
    };
    email: string;
    password: string;
    changePassword: string;
    deleteAccount: string;
    exportData: string;
    saveChanges: string;
    saved: string;
    emailNotifications: string;
    pushNotifications: string;
    weeklyDigest: string;
    achievementAlerts: string;
    soundEffects: string;
    animations: string;
    highContrast: string;
    largeText: string;
    reducedMotion: string;
    keyboardShortcuts: string;
    timezone: string;
    dateFormat: string;
    giftCredits: string;
    premium: string;
    subscription: string;
    features: string;
    upgrade: string;
    manage: string;
    cancel: string;
    signOut: string;
    accountData: string;
    displayName: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    updateAccount: string;
    pleaseSignIn: string;
    signInToAccess: string;
    // Edit Profile specific
    editProfile: string;
    fullName: string;
    fullNameRequired: string;
    bio: string;
    location: string;
    website: string;
    country: string;
    stateProvince: string;
    city: string;
    profileUpdated: string;
    profileUpdatedMessage: string;
    great: string;
    discardChanges: string;
    discardChangesMessage: string;
    keepEditing: string;
    discard: string;
    permissionRequired: string;
    photoLibraryPermission: string;
    uploadFailed: string;
    // Translation settings
    autoTranslateContent: string;
    autoTranslateContentDesc: string;
    preserveCivicTerms: string;
    preserveCivicTermsDesc: string;
    clearTranslationCache: string;
    clearTranslationCacheDesc: string;
    translationCacheCleared: string;
    translationCacheClearError: string;
  };

  // Survey
  survey: {
    question: string;
    questions: string;
    required: string;
    optional: string;
    progress: string;
    complete: string;
    submit: string;
    next: string;
    previous: string;
    skip: string;
    save: string;
    saveProgress: string;
    loading: string;
    error: string;
    success: string;
    pleaseSelectOption: string;
    pleaseProvideAnswer: string;
    invalidEmail: string;
    invalidPhone: string;
    tooManySelections: string;
    maxSelections: string;
    selectAtLeast: string;
    selectAtMost: string;
    charactersRemaining: string;
    wordLimit: string;
    fileUpload: string;
    chooseFile: string;
    removeFile: string;
    uploadError: string;
    stronglyDisagree: string;
    disagree: string;
    neutral: string;
    agree: string;
    stronglyAgree: string;
    pleaseSpecify: string;
    other: string;
    none: string;
    all: string;
    completed: string;
    thankYou: string;
    submissionComplete: string;
    viewResults: string;
    retake: string;
    share: string;
  };

  // Audio Controls
  audio: {
    play: string;
    pause: string;
    stop: string;
    resume: string;
    restart: string;
    mute: string;
    unmute: string;
    volume: string;
    speed: string;
    voice: string;
    settings: string;
    audioControls: string;
    voiceSettings: string;
    quality: string;
    high: string;
    medium: string;
    low: string;
    autoPlay: string;
    loop: string;
    highlighting: string;
    cloudTTS: string;
    browserTTS: string;
    language: string;
    male: string;
    female: string;
    neutral: string;
    loading: string;
    error: string;
    notSupported: string;
    recovery: string;
    testAudio: string;
    readPage: string;
    readSelection: string;
    keyboardShortcuts: string;
    diagnostics: string;
    usage: string;
    charactersUsed: string;
    estimatedCost: string;
    voiceCount: string;
    speaking: string;
    pending: string;
    paused: string;
    lastUpdate: string;
  };

  // Profile strings
  profileScreenTitle: string;
  loadingProfile: string;
  redirectingToLogin: string;

  // Leaderboard
  leaderboard: {
    title: string;
    loadingLeaderboard: string;
    yourRanking: string;
    currentRank: string;
    topPercentile: string;
    totalUsers: string;
    today: string;
    thisWeek: string;
    thisMonth: string;
    allTime: string;
    score: string;
    xp: string;
    streak: string;
    quizzes: string;
    achievements: string;
    you: string;
    takeQuizToClimb: string;
    new: string;
  };

  // Search
  search: {
    title: string;
    placeholder: string;
    clearHistory: string;
    analytics: string;
    streak: string;
    loadingData: string;
    searching: string;
    keepTyping: string;
    minCharacters: string;
    filterAll: string;
    filterCollections: string;
    filterTopics: string;
    noResults: string;
    noResultsHint: string;
    continueLearning: string;
    pickUpWhereLeft: string;
    recommended: string;
    recentSearches: string;
    clearAll: string;
    popularTopics: string;
    tapToSearch: string;
    searchTips: string;
    tip1: string;
    tip2: string;
    tip3: string;
    collection: string;
    topic: string;
    questionCount: string;
    recent: string;
  };

  // Profile Screen
  profile: {
    title: string;
    loadingProfile: string;
    redirectingToLogin: string;
    yourProgress: string;
    calendarIntegration: string;
    googleCalendarSync: string;
    googleCalendarSyncDesc: string;
    dailyQuizReminders: string;
    dailyQuizRemindersDesc: string;
    smartScheduling: string;
    smartSchedulingDesc: string;
    learningPodSessions: string;
    learningPodSessionsDesc: string;
    lastSynced: string;
    smartStudyRecommendations: string;
    scheduleThisTime: string;
    learningPods: string;
    constitutionalLawStudyGroup: string;
    membersOnline: string;
    billOfRightsReviewSession: string;
    managePods: string;
    editProfile: string;
    updateYourInformation: string;
    preferences: string;
    learningAndNotifications: string;
    exportLearningProgress: string;
    howWouldYouLikeToShare: string;
    exportAsPDF: string;
    shareWithPod: string;
    generateReport: string;
    shareReport: string;
    exportFailed: string;
    exportError: string;
    updateProfilePhoto: string;
    choosePhotoMethod: string;
    camera: string;
    photoLibrary: string;
    profilePhotoUpdated: string;
    uploadPhotoFailed: string;
    profileCompletion: string;
    profileCompletePercent: string;
    quizzes: string;
    avgScore: string;
    dayStreak: string;
    studyTime: string;
    achievements: string;
    viewDetailedStats: string;
    connectedViaGoogle: string;
    appVersion: string;
    madeWithLoveForDemocracy: string;
  };

  // Saved Screen
  saved: {
    title: string;
    subtitle: string;
    loadingSavedContent: string;
    collections: string;
    createCollection: string;
    organizeYourLearning: string;
    organizeYourLearningDesc: string;
    lessons: string;
    lessonsDesc: string;
    myCollections: string;
    myCollectionsDesc: string;
    createYourFirstCollection: string;
    filterContent: string;
    allContent: string;
    topics: string;
    quizResults: string;
    customQuizzes: string;
    bookmarks: string;
    noSavedLessons: string;
    noSavedTopics: string;
    noQuizResults: string;
    noBookmarks: string;
    noSavedItems: string;
    exploreContent: string;
    selectItems: string;
    itemsSelected: string;
    selectItemsToOrganize: string;
    organizeSelectedItems: string;
    moveToCollection: string;
    removeItem: string;
    removeItemConfirm: string;
    highlightedText: string;
    textSnippet: string;
    customQuiz: string;
    continueYourCivicsAssessment: string;
    questionsCompleted: string;
    started: string;
    scoreLabel: string;
    xpEarned: string;
    questions: string;
    draft: string;
    published: string;
    savedRecently: string;
    savedTime: string;
    keepGoing: string;
    nothingNewToday: string;
    nothingNewTodayDesc: string;
    currentEvents: string;
    currentEventsDesc: string;
    findingCurrentEvents: string;
    continueWhereLeftOff: string;
    orExploreMore: string;
    continueLearning: string;
    exploreQuizTopics: string;
    exploreQuizTopicsDesc: string;
    takeCivicsAssessment: string;
    takeCivicsAssessmentDesc: string;
    reviewSavedContent: string;
    reviewSavedContentDesc: string;
    createCustomContent: string;
    createCustomContentDesc: string;
    pro: string;
  };

  // Quiz/Learn Screen
  learn: {
    title: string;
    loadingQuizCollections: string;
    usingOfflineData: string;
    featuredLessons: string;
    featuredLessonsDesc: string;
    allCollections: string;
    allCollectionsDesc: string;
    collections: string;
    topics: string;
    topicsDesc: string;
    noQuizCollections: string;
    noQuizCollectionsOffline: string;
    noQuizCollectionsOnline: string;
    quizDataSource: string;
    liveAPI: string;
    offlineCache: string;
    showingRealTimeData: string;
    usingCachedData: string;
    new: string;
    featured: string;
    estimatedTime: string;
    completionRate: string;
    completion: string;
    continue: string;
    start: string;
    available: string;
    difficulty: string;
    searchTopics: string;
  };

  // Home Screen
  home: {
    welcomeBack: string;
    welcome: string;
    citizen: string;
    loadingYourCivicJourney: string;
    loadingContent: string;
    today: string;
    dailyChallenge: string;
    questionsOf: string;
    dayStreak: string;
    days: string;
    day: string;
    loadingDate: string;
    noFeaturedToday: string;
    noFeaturedTodayDesc: string;
    checkBackLater: string;
    keepGoingTarget: string;
    navigateToOtherDates: string;
    exploreMoreOptions: string;
    todaysCurrentEvents: string;
    currentEventsForDate: string;
    tapAnyStoryToCreate: string;
    findingCurrentEventsFor: string;
    exploreQuizTopics: string;
    exploreQuizTopicsDesc: string;
    takeCivicsAssessment: string;
    takeCivicsAssessmentDesc: string;
    reviewSavedContent: string;
    reviewSavedContentDesc: string;
    createCustomContent: string;
    createCustomContentDesc: string;
    designYourOwnTopics: string;
    proFeature: string;
    startReview: string;
    readMore: string;
    signUpToSaveProgress: string;
    yourProgressMatters: string;
    preserveYourLearning: string;
    getStarted: string;
    nothingNewToday: string;
    keepGoing: string;
  };
}

// Type for language-specific UI strings
export type UIStringTranslations = Record<string, UIStrings>;

// Named export for consistency with hook
export const strings = {
  // Navigation & Header
  navigation: {
    back: 'Back',
    close: 'Close',
    menu: 'Menu',
    home: 'Home',
    topics: 'Topics',
    learn: 'Explore',
    profile: 'Profile',
    settings: 'Settings',
    bookmarks: 'Bookmarks',
    history: 'History',
    signInToPlay: 'Sign In to Play',
    signInToSaveProgress: 'Sign In to Save Progress',
  },

  topic: {
    loading: 'Loading topic details...',
    loadingDetails: 'Loading details...',
    backToTopics: 'Back to Topics',
    share: 'Share Topic',
    bookmark: 'Bookmark This',
    removeBookmark: 'Remove Bookmark',
    bookmarkThis: 'Bookmark This',
    translateThisPage: 'Translate This Page',
    showOriginal: 'Show Original',
    whyThisMatters: 'Why This Matters',
    sourcesAndReferences: 'Sources and References',
    takingTheQuiz: 'Taking the Quiz',
    startQuiz: 'Take the Quiz',
    
    // Topic Stats - Enhanced
    questionsLabel: 'Questions',
    estimatedMinutesLabel: 'Est. Min.',
    ratingLabel: 'Rating',
    publishedLabel: 'Published',
    levelLabel: 'Level',
    difficultyLabel: 'Difficulty',
    questionsCount: 'Total Questions',
    estimatedTime: 'Estimated Time',
    level: 'Level',
    difficulty: 'Difficulty',
    
    // Difficulty levels
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    
    thinkYouGotIt: 'Think you got it?',
    testYourUnderstanding: 'Test your understanding of this topic and see how well you grasp the key concepts we\'ve covered.',
    noSourcesAvailable: 'No sources available yet',
    noSourcesDescription: 'Sources and references will be added as content is reviewed and verified.',
    understandingSourceAnalysis: 'Understanding Source Analysis',
    biasRatingsMeaning: 'What do the bias ratings mean?',
    credibilityPercentageMeaning: 'What does the credibility percentage mean?',
    howRatingsDetermined: 'How are these ratings determined?',
    areRatingsPermanent: 'Are these ratings permanent?',
    sourceAnalysisImportance: 'Why does this matter?',
    
    // Reviews and Ratings - Comprehensive
    ratingsAndReviews: 'Ratings and Reviews',
    communityFeedback: 'Community Feedback',
    communityReviews: 'Community Reviews',
    rateThisTopic: 'Rate This Topic',
    howHelpfulWasThis: 'How helpful was this?',
    noRatingsYet: 'No ratings yet',
    recentReviews: 'Recent Reviews',
    noReviewsYet: 'No reviews yet',
    noReviewsDescription: 'Be the first to share your thoughts about this topic.',
    writeFirstReview: 'Write the first review',
    viewAllReviews: 'View All Reviews',
    editRating: 'Edit Rating',
    ratingBreakdown: 'Rating Breakdown',
    shareYourThoughts: 'Share your thoughts...',
    completeQuizToReview: 'Complete the quiz to review',
    takeQuizToShare: 'Take a quiz to share',
    wasThisHelpful: 'Was this helpful?',
    writeAReview: 'Write a review',
    rateAndReview: 'Rate and Review',
    selectRating: 'Select Rating',
    submitReview: 'Submit Review',
    shareYourThoughtsDesc: 'Share your thoughts about this topic',
    yourReview: 'Your Review',
    recently: 'Recently',
    
    // Rating options
    excellent: 'Excellent',
    veryGood: 'Very Good',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    
    // Review states
    checkingProgress: 'Checking Progress',
    loadingReviews: 'Loading Reviews',
    submittingReview: 'Submitting Review',
    reviewSubmitted: 'Review Submitted',
    thankYouForReview: 'Thank you for your review!',
    
    // Helpfulness voting
    helpful: 'Helpful',
    notHelpful: 'Not Helpful',
    markAsHelpful: 'Mark as Helpful',
    markAsNotHelpful: 'Mark as Not Helpful',
    
    // Review completion requirements
    completeToReview: 'Complete the quiz to review',
    takeQuizFirst: 'Take a quiz first',
    finishTopicToReview: 'Finish the topic to review',
  },

  translation: {
    selectLanguage: 'Select Language',
    languagePreferenceSaved: 'Your language preference will be saved for future visits',
    translating: 'Translating...',
    translationComplete: 'Translation complete',
    translationError: 'Translation error',
    helpTranslate: 'Help translate this',
    noTranslationAvailable: 'No translation available',
    loadingTranslations: 'Loading translations...',
    checkingTranslations: 'Checking existing translations...',
    savingTranslations: 'Saving translations...',
    autoTranslating: 'Auto-translating...',
    translatingQuestion: 'Translating question',
    originalText: 'Original',
    loadingExistingTranslations: 'Loading existing translations...',
    translateContent: 'Translate content',
    allQuestionsTranslated: 'All questions already translated',
    translationNeeded: 'Translation needed',
    helpTranslateContent: 'Would you like to help translate it?',
    translationTest: 'Translation Test',
    translationTestResult: 'Translation test result',
    translationTestFailed: 'Translation test failed',
    initializingTranslationService: 'Initializing translation service...',
    translated: 'Translated',
    // Language Selection Modal
    original: 'Original',
    availableTranslations: 'Available Translations',
    fullyTranslated: 'Fully Translated',
    helpTranslateDescription: 'Help make CivicSense accessible in more languages',
    contributeTranslation: 'Help translate this',
    contributeTitle: 'Help Translate CivicSense',
    contributeMessage: 'Would you like to help make CivicSense accessible to more people by contributing translations?',
    getStarted: 'Get Started',
    thankYou: 'Thank You!',
    contactInstructions: 'Please contact us at translate@civicsense.com to get started with translation contributions.',
    dontSeeLanguage: 'Don\'t see your language?',
    requestLanguage: 'Request a new language or volunteer to help translate',
    // Scanner animation strings
    analyzingContent: 'Analyzing content...',
    translatingToLanguage: 'Translating to {{language}}...',
    optimizingLayout: 'Optimizing layout...',
    elementsTranslated: '{{count}} elements translated',
  },

  sources: {
    analysisOverview: 'Analysis Overview',
    politicalBias: 'Political Bias',
    factualRating: 'Factual Rating',
    transparency: 'Transparency',
    analysisSummary: 'Analysis Summary',
    topicRelevanceCheck: 'Topic Relevance Check',
    validationDetails: 'Validation Details',
    strengths: 'Strengths',
    areasForImprovement: 'Areas for Improvement',
    redFlags: 'Red Flags',
    recommendations: 'Recommendations',
    readFullArticle: 'Read Full Article',
    loadingAnalysis: 'Loading analysis...',
    analyzed: 'ANALYZED',
    credibility: 'Credibility',
  },

  languages: {
    english: 'English',
    spanish: 'Español',
    chinese: '中文',
    vietnamese: 'Tiếng Việt',
    arabic: 'العربية',
    hindi: 'हिन्दी',
    french: 'Français',
    german: 'Deutsch',
    portuguese: 'Português',
    russian: 'Русский',
    japanese: '日本語',
    korean: '한국어',
    italian: 'Italiano',
  },

  actions: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    share: 'Share',
    copy: 'Copy',
    download: 'Download',
    upload: 'Upload',
    refresh: 'Refresh',
    retry: 'Retry',
    tryAgain: 'Try Again',
    continue: 'Continue',
    next: 'Next',
    previous: 'Previous',
    finish: 'Finish',
    submit: 'Submit',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    dismiss: 'Dismiss',
  },

  status: {
    loading: 'Loading...',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    completed: 'Completed',
    failed: 'Failed',
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    offline: 'Offline',
    online: 'Online',
    syncing: 'Syncing...',
    synced: 'Synced',
  },

  errors: {
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    unknownError: 'An unknown error occurred.',
    notFound: 'Content not found.',
    unauthorized: 'You are not authorized to access this content.',
    forbidden: 'Access to this content is forbidden.',
    timeout: 'Request timed out. Please try again.',
    connectionLost: 'Connection lost. Please check your internet.',
    invalidInput: 'Invalid input. Please check your entry.',
    requiredField: 'This field is required.',
    loadingFailed: 'Failed to load content.',
    savingFailed: 'Failed to save changes.',
    uploadFailed: 'Upload failed.',
    downloadFailed: 'Download failed.',
  },

  time: {
    now: 'now',
    today: 'today',
    yesterday: 'yesterday',
    tomorrow: 'tomorrow',
    thisWeek: 'this week',
    lastWeek: 'last week',
    thisMonth: 'this month',
    lastMonth: 'last month',
    minutesAgo: 'minutes ago',
    hoursAgo: 'hours ago',
    daysAgo: 'days ago',
    weeksAgo: 'weeks ago',
    monthsAgo: 'months ago',
  },

  quiz: {
    question: 'Question',
    questions: 'Questions',
    answer: 'Answer',
    answers: 'Answers',
    correct: 'Correct',
    incorrect: 'Incorrect',
    explanation: 'Explanation',
    hint: 'Hint',
    score: 'Score',
    results: 'Results',
    startQuiz: 'Start Quiz',
    nextQuestion: 'Next Question',
    previousQuestion: 'Previous Question',
    finishQuiz: 'Finish Quiz',
    retakeQuiz: 'Retake Quiz',
    reviewAnswers: 'Review Answers',
    timeRemaining: 'Time Remaining',
    questionNumber: 'Question',
    totalQuestions: 'Total Questions',
    correctAnswers: 'Correct Answers',
    incorrectAnswers: 'Incorrect Answers',
    finalScore: 'Final Score',
    // Missing properties that game room needs
    complete: 'Quiz Complete!',
    of: 'of',
    title: 'Quiz',
    // Quiz Engine Specific
    loadingQuestion: 'Loading question...',
    unsupportedQuestionType: 'Unsupported question type',
    questionsComplete: 'Questions complete',
    timeUp: 'Time\'s up!',
    pauseQuiz: 'Pause Quiz',
    resumeQuiz: 'Resume Quiz',
    exitQuiz: 'Exit Quiz',
    saveProgress: 'Save Progress',
    restoreProgress: 'Restore Progress',
    quizMode: 'Quiz Mode',
    practiceMode: 'Practice Mode',
    testMode: 'Test Mode',
    selectAnswer: 'Select Answer',
    submitAnswer: 'Submit Answer',
    showExplanation: 'Show Explanation',
    hideExplanation: 'Hide Explanation',
    yourAnswer: 'Your Answer',
    correctAnswer: 'Correct Answer',
    continueToNext: 'Continue to Next',
    // Question Types
    questionTypes: {
      multipleChoice: 'Multiple Choice',
      trueFalse: 'True/False',
      shortAnswer: 'Short Answer',
      fillInBlank: 'Fill in the Blank',
      matching: 'Matching',
      ordering: 'Ordering',
      crossword: 'Crossword',
    },
    multipleChoice: 'Multiple Choice',
    trueFalse: 'True/False',
    shortAnswer: 'Short Answer',
    fillInBlank: 'Fill in the Blank',
    matching: 'Matching',
    ordering: 'Ordering',
    crossword: 'Crossword',
    // Quiz Results
    accuracy: 'Accuracy',
    timeSpent: 'Time Spent',
    averageTime: 'Average Time',
    breakdown: 'Breakdown',
    recommendations: 'Recommendations',
    questionsAnswered: 'Questions Answered',
    questionsSkipped: 'Questions Skipped',
    percentageScore: 'Percentage Score',
    passingScore: 'Passing Score',
    passed: 'Passed',
    failed: 'Failed',
    tryAgain: 'Try Again',
    viewReview: 'View Review',
    backToTopics: 'Back to Topics',
    // Additional quiz properties
    difficulty: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
    },
  },

  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    skip: 'Skip',
    retry: 'Retry',
  },

  gameRoom: {
    questionsPreview: 'Questions',
    settings: 'Settings',
    sources: 'Sources',
    quizSettings: 'Quiz Settings',
    showHints: 'Show Hints',
    getHelpfulClues: 'Get helpful clues when you\'re stuck',
    showExplanations: 'Show Explanations',
    learnWhyAnswersCorrect: 'Learn why answers are correct or incorrect',
    hardMode: 'Hard Mode',
    hardModeDescription: 'No hints/explanations, 15s/question',
    timeLimit: 'Time Limit',
    noTimeLimit: 'No time limit',
    estimatedTime: 'Estimated Time',
    questionsAvailable: 'questions available',
    getReady: 'Get ready to test your knowledge',
    trustedSources: 'Trusted sources behind this content',
    credibilityStandards: 'All sources meet our credibility standards',
  },

  onboarding: {
    welcome: 'Welcome to CivicSense!',
    welcomeTitle: 'Welcome to CivicSense',
    welcomeSubtitle: 'Let\'s get you set up with personalized civic learning experiences',
    getStarted: 'Get Started',
    skip: 'Skip',
    exploreOnOwn: 'I\'ll explore on my own',
    timeToComplete: '5-10 minutes to complete',
    personalizedLearning: 'Personalized Learning',
    personalizedLearningDesc: 'Tailored quizzes based on your interests',
    communityLearning: 'Community Learning',
    communityLearningDesc: 'Learn with others in your community',
    trackProgress: 'Track Progress',
    trackProgressDesc: 'See your civic knowledge grow over time',
    learnTogether: 'Learn Together',
    learnTogetherDesc: 'Challenge friends in multiplayer quizzes',
    earnAchievements: 'Earn Achievements',
    earnAchievementsDesc: 'Unlock badges as you master topics',
    personalizeExperience: 'Personalize Experience',
    personalizeExperienceDesc: 'Customize your learning journey',
    learningStyle: 'Learning Style',
    learningStyleDesc: 'How do you prefer to learn?',
    visual: 'Visual',
    visualDesc: 'Learn through images and diagrams',
    reading: 'Reading',
    readingDesc: 'Learn through text and articles',
    mixed: 'Mixed',
    mixedDesc: 'Combine visual and text learning',
    difficultyLevel: 'Difficulty Level',
    difficultyLevelDesc: 'Choose your starting difficulty',
    beginner: 'Beginner',
    beginnerDesc: 'New to civic topics',
    intermediate: 'Intermediate',
    intermediateDesc: 'Some civic knowledge',
    adaptive: 'Adaptive',
    adaptiveDesc: 'Adjust difficulty as you learn',
    location: 'Location',
    locationOptional: 'Location (Optional)',
    city: 'City',
    state: 'State',
    zipCode: 'ZIP Code',
    dailyReminders: 'Daily Reminders',
    dailyRemindersDesc: 'Get notified about new content',
    whatsNext: 'What\'s Next?',
    whatsNextDesc: 'Let\'s start your civic learning journey',
    completeSetup: 'Complete Setup',
    invalidZipCode: 'Invalid ZIP Code',
    invalidZipCodeDesc: 'Please enter a valid 5-digit ZIP code',
    invalidState: 'Invalid State',
    invalidStateDesc: 'Please enter a valid state',
    invalidCity: 'Invalid City',
    invalidCityDesc: 'Please enter a valid city name',
    zipCodePlaceholder: 'Enter ZIP code',
    cityPlaceholder: 'Enter city',
    statePlaceholder: 'Enter state',
    stateLocationDesc: 'Your state helps us show relevant local content',
    cityLocationDesc: 'Your city helps us personalize civic information',
    zipCodeLocationDesc: 'Your ZIP code helps us find local representatives',
    categorySelectionTitle: 'Choose Your Interests',
    categorySelectionDesc: 'Select topics you\'d like to learn about',
    chooseTopics: 'Choose Topics',
    selectInterests: 'Select your interests',
    categoryLoading: 'Loading categories...',
    categoryLoadingError: 'Failed to load categories',
    questionsAvailable: 'questions available',
    atLeastOneCategory: 'Please select at least one category',
    fallbackCategoryDesc: 'Explore a variety of civic topics',
    step: 'Step',
    choosePlayStyle: 'Choose Play Style',
    setChallenge: 'Set Challenge',
    customize: 'Customize',
    soloChallenge: 'Solo Challenge',
    soloChallengeDescription: 'Test your knowledge individually',
    orUseCustomSettings: 'Or use custom settings',
  },

  multiplayer: {
    title: 'Multiplayer',
    connectionError: 'Connection Error',
    failedToJoin: 'Failed to join the room. Please try again.',
    failedToStart: 'Failed to start the game. Please try again.',
    leaveRoomConfirm: 'Are you sure you want to leave this room?',
    inviteMessage: 'Join my CivicSense quiz room! Code: {{roomCode}}\n\nDownload the app and enter this code to play together.',
    inviteTitle: 'Join my CivicSense Quiz Room!',
    aiPlayer: 'AI Player',
    humanPlayer: 'Human Player',
    sharingFailed: 'Failed to share. Please try again.',
    // Game Phase States
    getReadyToPlay: 'Get Ready to Play',
    startReview: 'Start Review',
    waitingForPlayers: 'Waiting for Players',
    waitingForHost: 'Waiting for Host',
    gameMode: 'Game Mode',
    questions: 'Questions',
    features: 'Features',
    // Game Features
    hints: 'Hints',
    explanations: 'Explanations',
    teamMode: 'Team Mode',
    powerUps: 'Power Ups',
    // NPC Battle
    npcBattle: 'NPC Battle',
    testYourKnowledge: 'Test Your Knowledge',
    skillLevel: 'Skill Level',
    // Room Management
    roomCode: 'Room Code',
    maxPlayers: 'Max Players',
    currentPlayers: 'Current Players',
    // Navigation and UI
    leaderboard: 'Leaderboard',
    chat: 'Chat',
    settings: 'Settings',
    // Countdown Phase
    gameStartingSoon: 'Game Starting Soon',
    getReadyFirstQuestion: 'Get Ready for the First Question',
    battleStarting: 'Battle Starting',
    firstQuestionLoading: 'First Question Loading',
    // Question Phase
    question: 'Question',
    questionNumber: 'Question',
    hint: 'Hint',
    showHint: 'Show Hint',
    submitAnswer: 'Submit Answer',
    explanation: 'Explanation',
    shield: 'Shield',
    attack: 'Attack',
    focus: 'Focus',
    // Quiz Results
    correct: 'Correct',
    incorrect: 'Incorrect',
    timeUp: 'Time\'s Up!',
    finalScore: 'Final Score',
    // Game Completion
    gameComplete: 'Game Complete',
    greatJobLearning: 'Great Job Learning!',
    shareResults: 'Share Results',
    continue: 'Continue',
    victory: 'Victory!',
    goodTry: 'Good Try!',
    correctAnswers: 'Correct Answers',
    accuracy: 'Accuracy',
    playAgain: 'Play Again',
    exit: 'Exit',
    // Player Status
    ready: 'Ready',
    notReady: 'Not Ready',
    thinking: 'Thinking',
    answered: 'Answered',
    // Chat Messages
    roomChat: 'Room Chat',
    players: 'Players',
    typeMessage: 'Type Message',
    enterToSend: 'Enter to Send',
    beRespectful: 'Be Respectful',
    playerJoined: 'Player Joined',
    playerLeft: 'Player Left',
    gameStarting: 'Game Starting',
    welcomeToQuiz: 'Welcome to the Quiz',
    // Host Settings
    allowNewPlayers: 'Allow New Players',
    allowNewPlayersDesc: 'Allow new players to join the game',
    enableBoosts: 'Enable Boosts',
    enableBoostsDesc: 'Enable power-ups for players',
    showHints: 'Show Hints',
    showHintsDesc: 'Show hints to players',
    autoAdvance: 'Auto Advance',
    autoAdvanceDesc: 'Automatically advance questions',
    realTimeScores: 'Real Time Scores',
    realTimeScoresDesc: 'Show real-time scores',
    enableChat: 'Enable Chat',
    enableChatDesc: 'Enable chat for players',
    // Error Messages
    connectionLost: 'Connection Lost',
    failedToSubmitAnswer: 'Failed to Submit Answer',
    networkError: 'Network Error',
    // Status Labels
    ai: 'AI',
    host: 'Host',
    titleDescription: 'Description',
    liveGameScreen: 'Live Game',
  },

  analytics: {
    loadingInsights: 'Loading insights...',
    couldNotLoadInsights: 'Could not load learning insights. Please try again.',
    couldNotRefreshInsights: 'Could not refresh insights. Please try again.',
    excellentPerformance: 'Excellent performance! See personalized next steps.',
    goodProgress: 'Good progress! Discover areas to improve.',
    keepLearning: 'Keep learning! Get customized study tips.',
    needHelp: 'Having trouble? Get personalized help.',
  },

  news: {
    dailyNews: 'Daily News',
    latestNews: 'Latest News',
    articles: 'articles',
    fetchingFrom: 'Fetching from AP, Reuters, NPR, BBC, Politico...',
    noValidArticles: 'No valid articles found after filtering',
    failedToLoad: 'Failed to load news',
    newsAPI: 'News API failed',
    unknownError: 'Unknown error',
    refreshNews: 'Refresh news',
    updating: 'Updating...',
    today: 'Today',
    yesterday: 'Yesterday',
    // Enhanced news strings
    breakingNews: 'Breaking News',
    newsUpdates: 'News Updates',
    readMore: 'Read More',
    readFull: 'Read Full Article',
    source: 'Source',
    publishedBy: 'Published by',
    lastUpdated: 'Last updated',
    originalSource: 'Original source',
    previousArticle: 'Previous Article',
    nextArticle: 'Next Article',
    backToNews: 'Back to News',
    filterByCategory: 'Filter by Category',
    sortBy: 'Sort by',
    newest: 'Newest',
    oldest: 'Oldest',
    mostRelevant: 'Most Relevant',
    noArticlesFound: 'No articles found',
    loadingFailed: 'Failed to load news articles',
    tryAgainLater: 'Please try again later',
    shareArticle: 'Share Article',
    copyLink: 'Copy Link',
    linkCopied: 'Link copied to clipboard',
    savedToDb: 'saved to DB',
    ago: 'ago',
  },

  collections: {
    // Action Planner
    takeAction: 'Take Action',
    planned: 'planned',
    completed: 'completed',
    immediateActions: 'Immediate Actions',
    immediateActionsDesc: 'These are specific steps you can take right now to apply what you\'ve learned.',
    civicEngagementOpportunities: 'Civic Engagement Opportunities',
    civicEngagementDesc: 'Connect with your community and make a broader impact through these opportunities.',
    markAsCompleted: 'Mark as completed',
    yourActionPlan: 'Your Action Plan',
    youvePlannedActions: 'You\'ve planned {{count}} action{{plural}}',
    andCompleted: ' and completed {{count}}',
    greatJobTakingAction: 'Great job taking action on your civic learning! 🎉',
    keepGoing: 'Keep going! Taking action is how we strengthen democracy.',
    readyToTakeAction: 'Ready to Take Action?',
    checkOffActions: 'Check off the actions you plan to take. Every small step makes democracy stronger.',
    outstanding: 'Outstanding!',
    completedAllActions: 'You\'ve completed all the suggested actions. You\'re making a real difference in your community!',

    // Interactive Components - General
    quickCheck: 'Quick Check',
    complete: 'Complete',
    submitAnswer: 'Submit Answer',
    correct: 'Correct!',
    notQuiteRight: 'Not quite right',
    showHint: 'Show Hint',
    hideHint: 'Hide Hint',
    selectAnAnswer: 'Select an answer',
    answerSelected: 'Answer selected',
    
    // True/False
    trueOrFalse: 'True or False?',
    selectTrueFalse: 'Select True or False',
    
    // Text Input
    yourResponse: 'Your Response',
    enterYourAnswer: 'Enter your answer...',
    submitResponse: 'Submit Response',
    responseRecorded: 'Response Recorded',
    thankYouForInput: 'Thank you for your input. Your response has been saved.',
    enterYourResponse: 'Enter your response',
    charactersCount: '{{count}} characters',
    
    // Ranking
    rankingExercise: 'Ranking Exercise',
    dragToReorder: 'Drag items to reorder them from most to least important:',
    rankingComplete: 'Ranking complete',
    dragToReorderItems: 'Drag to reorder items',
    rankingExplanation: 'Ranking Explanation',
    
    // Timeline
    interactiveTimeline: 'Interactive Timeline',
    clickEachEvent: 'Click each event to explore ({current}/{total})',
    exploreAllEvents: 'Explore All Events',
    
    // Reflection
    reflection: 'Reflection',
    reflectionPrompts: 'Reflection Prompts',
    shareYourThoughts: 'Share your thoughts...',
    saveReflection: 'Save Reflection',
    
    // Action Checklist
    actionChecklist: 'Action Checklist',
    actionsCompleted: '{completed} of {total} actions completed',
    primaryAction: 'Primary Action',
    bonusActions: 'Bonus Actions (Optional)',
    helpfulResources: 'Helpful Resources',
    markAsComplete: 'Mark as complete',
    actionComplete: 'Action Complete',
    takeActionStatus: 'Take Action',
    pending: 'Pending',
    
    // Contact Form
    contactRepresentatives: 'Contact Your Representatives',
    contactsReached: '{contacted} of {total} contacts reached',
    whoToContact: 'Who to Contact',
    messageTemplates: 'Message Templates',
    sendWithTemplate: 'Send with template',
    visitWebsite: 'Visit website →',
    alreadyContacted: 'Already Contacted',
    markAsContacted: 'Mark as Contacted',
    
    // Quick Poll
    quickPoll: 'Quick Poll',
    castVote: 'Cast Vote',
    thanksForVoting: 'Thanks for voting!',
    results: 'Results:',
    votes: 'votes',
    
    // Survey
    surveyTitle: 'Survey',
    questionProgress: 'Question {current} of {total}',
    simulationResults: 'Simulation Results',
    yourAnswer: 'Your answer...',
    previous: 'Previous',
    next: 'Next',
    completeSurvey: 'Complete Survey',
    externalSurveyDesc: 'This survey is hosted externally. Click the link below to participate.',
    openSurvey: 'Open Survey',
    
    // Opinion Slider
    opinionScale: 'Opinion Scale',
    moveSlider: 'Move the slider to indicate your level of agreement',
    submitOpinion: 'Submit Opinion',
    thanksForOpinion: 'Thanks for sharing your opinion!',
    stronglyDisagree: 'Strongly disagree',
    disagree: 'Disagree',
    neutral: 'Neutral',
    agree: 'Agree',
    stronglyAgree: 'Strongly agree',
    
    // Simulation
    policySimulation: 'Policy Simulation',
    scenario: 'Scenario',
    adjustVariables: 'Adjust Variables',
    runSimulation: 'Run Simulation',
    
    // Role Play
    rolePlayingExercise: 'Role Playing Exercise',
    chooseYourRole: 'Choose Your Role',
    objectives: 'Objectives:',
    whatActionTake: 'What action do you take this round?',
    negotiateStakeholders: 'Negotiate with other stakeholders',
    gatherMoreInfo: 'Gather more information',
    rolePlayComplete: 'Role Play Complete!',
    yourDecisions: 'Your Decisions',
    
    // Decision Tree
    decisionPath: 'Decision Path',
    decisionPoint: 'Decision Point',
    chooseResponse: 'Choose your response:',
    finalOutcome: 'Final Outcome',
    reflectionNote: 'Consider how different choices might have led to different outcomes. Real policy decisions often have complex consequences that aren\'t immediately apparent.',
    tryDifferentPath: 'Try Different Path',
    yourPath: 'Your path:',
    
    // Cards and Layouts
    compareAndContrast: 'Compare and Contrast',
    continueLearning: 'Continue Learning',
    viewAllCards: 'View All Cards',
    nextCard: 'Next Card',
    previousCard: 'Previous',
    
    // Media Interactions
    exploreImage: 'Explore the Image',
    dragAndDrop: 'Drag and Drop',
    availableItems: 'Available Items',
    interactiveMap: 'Interactive Map',
    checkAnswers: 'Check Answers',
    allItemsAssigned: 'All items assigned',
    assigned: 'assigned',
    
    // Enhanced interaction types
    adjustParameters: 'Adjust Parameters',
    viewResults: 'View Results',
    resetSimulation: 'Reset Simulation',
    
    // Form and input types
    fillInTheBlanks: 'Fill in the Blanks',
    matchingPairs: 'Matching Pairs',
    categorizeItems: 'Categorize Items',
    
    // Progress and feedback
    progressUpdate: 'Progress Update',
    wellDone: 'Well Done!',
    goodEffort: 'Good Effort!',
    keepTrying: 'Keep Trying!',
    perfect: 'Perfect!',
    almostThere: 'Almost There!',
  },

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
    decreaseSpeed: 'Decrease speed',
    goBack: 'Go back',
    openLink: 'Open link',
    bookmark: 'Bookmark this topic',
    removeBookmark: 'Remove bookmark',
  },

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
      system: 'System',
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
    dateFormat: 'Date Format',
    giftCredits: 'Gift Credits',
    premium: 'Premium',
    subscription: 'Subscription',
    features: 'Features',
    upgrade: 'Upgrade',
    manage: 'Manage',
    cancel: 'Cancel',
    signOut: 'Sign Out',
    accountData: 'Account Data',
    displayName: 'Display Name',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    updateAccount: 'Update Account',
    pleaseSignIn: 'Please sign in to access settings',
    signInToAccess: 'Please sign in to access settings',
    // Edit Profile specific
    editProfile: 'Edit Profile',
    fullName: 'Full Name',
    fullNameRequired: 'Full name is required',
    bio: 'Bio',
    location: 'Location',
    website: 'Website',
    country: 'Country',
    stateProvince: 'State/Province',
    city: 'City',
    profileUpdated: 'Profile Updated! ✅',
    profileUpdatedMessage: 'Your changes have been saved successfully.',
    great: 'Great!',
    discardChanges: 'Discard Changes?',
    discardChangesMessage: 'You have unsaved changes. Are you sure you want to discard them?',
    keepEditing: 'Keep Editing',
    discard: 'Discard',
    permissionRequired: 'Permission Required',
    photoLibraryPermission: 'Please allow access to your photo library to change your avatar.',
    uploadFailed: 'Failed to upload avatar. Please try again.',
    // Translation settings
    autoTranslateContent: 'Auto-translate content',
    autoTranslateContentDesc: 'Automatically translate quiz questions and lessons',
    preserveCivicTerms: 'Preserve civic terms',
    preserveCivicTermsDesc: 'Keep important civic terms accurate in translations',
    clearTranslationCache: 'Clear translation cache',
    clearTranslationCacheDesc: 'Reset saved translations to get fresh content',
    translationCacheCleared: 'Translation cache cleared successfully',
    translationCacheClearError: 'Failed to clear translation cache',
  },

  survey: {
    question: 'Question',
    questions: 'Questions',
    required: 'Required',
    optional: 'Optional',
    progress: 'Progress',
    complete: 'Complete',
    submit: 'Submit',
    next: 'Next',
    previous: 'Previous',
    skip: 'Skip',
    save: 'Save',
    saveProgress: 'Save Progress',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    pleaseSelectOption: 'Please select an option',
    pleaseProvideAnswer: 'Please provide an answer',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    tooManySelections: 'Too many selections',
    maxSelections: 'Maximum selections reached',
    selectAtLeast: 'Please select at least',
    selectAtMost: 'Please select at most',
    charactersRemaining: 'characters remaining',
    wordLimit: 'Word limit exceeded',
    fileUpload: 'File Upload',
    chooseFile: 'Choose File',
    removeFile: 'Remove File',
    uploadError: 'Upload failed',
    stronglyDisagree: 'Strongly Disagree',
    disagree: 'Disagree',
    neutral: 'Neutral',
    agree: 'Agree',
    stronglyAgree: 'Strongly Agree',
    pleaseSpecify: 'Please specify...',
    other: 'Other',
    none: 'None',
    all: 'All',
    completed: 'Completed',
    thankYou: 'Thank You!',
    submissionComplete: 'Your submission has been completed',
    viewResults: 'View Results',
    retake: 'Retake',
    share: 'Share',
  },

  audio: {
    play: 'Play',
    pause: 'Pause',
    stop: 'Stop',
    resume: 'Resume',
    restart: 'Restart',
    mute: 'Mute',
    unmute: 'Unmute',
    volume: 'Volume',
    speed: 'Speed',
    voice: 'Voice',
    settings: 'Settings',
    audioControls: 'Audio Controls',
    voiceSettings: 'Voice Settings',
    quality: 'Quality',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    autoPlay: 'Auto Play',
    loop: 'Loop',
    highlighting: 'Word Highlighting',
    cloudTTS: 'Cloud TTS',
    browserTTS: 'Browser TTS',
    language: 'Language',
    male: 'Male',
    female: 'Female',
    neutral: 'Neutral',
    loading: 'Loading...',
    error: 'Audio Error',
    notSupported: 'Audio not supported',
    recovery: 'Recover Audio',
    testAudio: 'Test Audio',
    readPage: 'Read Page',
    readSelection: 'Read Selection',
    keyboardShortcuts: 'Keyboard Shortcuts',
    diagnostics: 'Diagnostics',
    usage: 'Usage',
    charactersUsed: 'Characters Used',
    estimatedCost: 'Estimated Cost',
    voiceCount: 'Voice Count',
    speaking: 'Speaking',
    pending: 'Pending',
    paused: 'Paused',
    lastUpdate: 'Last Update',
  },

  // Profile strings
  profileScreenTitle: 'My Profile',
  loadingProfile: 'Loading your profile...',
  redirectingToLogin: 'Redirecting to login...',

  // Leaderboard
  leaderboard: {
    title: 'Leaderboard',
    loadingLeaderboard: 'Loading leaderboard...',
    yourRanking: 'Your Ranking',
    currentRank: 'Current Rank',
    topPercentile: 'Top Percentile',
    totalUsers: 'Total Users',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    allTime: 'All Time',
    score: 'Score',
    xp: 'XP',
    streak: 'Streak',
    quizzes: 'quizzes',
    achievements: 'achievements',
    you: '(You)',
    takeQuizToClimb: 'Take a Quiz to Climb!',
    new: 'NEW',
  },

  // Search
  search: {
    title: 'Search',
    placeholder: 'Search collections and topics...',
    clearHistory: 'Clear search history',
    analytics: '{{count}} searches • {{viewed}} items viewed',
    streak: '{{count}} day streak',
    loadingData: 'Loading search data...',
    searching: 'Searching collections and topics...',
    keepTyping: 'Keep typing...',
    minCharacters: 'Enter at least 2 characters to start searching',
    filterAll: 'All',
    filterCollections: 'Collections',
    filterTopics: 'Topics',
    noResults: 'No results found',
    noResultsHint: 'Try searching for different keywords like "Constitution", "Elections", or "Supreme Court"',
    continueLearning: 'Continue Learning',
    pickUpWhereLeft: 'Pick up where you left off',
    recommended: 'Recommended',
    recentSearches: 'Recent Searches',
    clearAll: 'Clear All',
    popularTopics: 'Popular Topics',
    tapToSearch: 'Tap to search quickly',
    searchTips: 'Search Tips',
    tip1: 'Try specific topics like "First Amendment" or "Electoral College"',
    tip2: 'Items you\'ve viewed recently appear first in results',
    tip3: 'Your search history helps us show better recommendations',
    collection: 'Collection',
    topic: 'Topic',
    questionCount: '{{count}} questions',
    recent: 'Recent',
  },

  // Profile Screen
  profile: {
    title: 'My Profile',
    loadingProfile: 'Loading your profile...',
    redirectingToLogin: 'Redirecting to login...',
    yourProgress: 'Your Progress',
    calendarIntegration: 'Calendar Integration',
    googleCalendarSync: 'Google Calendar Sync',
    googleCalendarSyncDesc: 'Sync your study schedule with Google Calendar',
    dailyQuizReminders: 'Daily Quiz Reminders',
    dailyQuizRemindersDesc: 'Get reminded about daily quizzes',
    smartScheduling: 'Smart Scheduling',
    smartSchedulingDesc: 'AI-powered optimal study times',
    learningPodSessions: 'Learning Pod Sessions',
    learningPodSessionsDesc: 'Group study session reminders',
    lastSynced: 'Last synced',
    smartStudyRecommendations: 'Smart Study Recommendations',
    scheduleThisTime: 'Schedule This Time',
    learningPods: 'Learning Pods',
    constitutionalLawStudyGroup: 'Constitutional Law Study Group',
    membersOnline: 'members • {{online}} online now',
    billOfRightsReviewSession: 'Bill of Rights Review Session',
    managePods: 'Manage Pods',
    editProfile: 'Edit Profile',
    updateYourInformation: 'Update your information',
    preferences: 'Preferences',
    learningAndNotifications: 'Learning & notifications',
    exportLearningProgress: 'Export Learning Progress',
    howWouldYouLikeToShare: 'How would you like to share your progress?',
    exportAsPDF: 'Export as PDF',
    shareWithPod: 'Share with Pod',
    generateReport: 'Generating Your CivicSense Analytics Report',
    shareReport: 'Share Report',
    exportFailed: 'Export Failed',
    exportError: 'Failed to generate your learning analytics report. Please try again.',
    updateProfilePhoto: 'Update Profile Photo',
    choosePhotoMethod: 'Choose how you\'d like to add your photo',
    camera: 'Camera',
    photoLibrary: 'Photo Library',
    profilePhotoUpdated: 'Profile photo updated successfully!',
    uploadPhotoFailed: 'Failed to upload profile photo',
    profileCompletion: 'Profile {{percent}}% complete',
    profileCompletePercent: 'Profile {{percent}}% complete',
    quizzes: 'Quizzes',
    avgScore: 'Avg Score',
    dayStreak: 'Day Streak',
    studyTime: 'Study Time',
    achievements: 'Achievements',
    viewDetailedStats: 'View Detailed Stats',
    connectedViaGoogle: 'Connected via Google',
    appVersion: 'CivicSense v1.0.0 • Made with ❤️ for democracy',
    madeWithLoveForDemocracy: 'Made with ❤️ for democracy',
  },

  // Saved Screen
  saved: {
    title: 'Saved',
    subtitle: 'Your bookmarks and progress',
    loadingSavedContent: 'Loading your saved content...',
    collections: 'Collections',
    createCollection: 'Create',
    organizeYourLearning: 'Organize Your Learning',
    organizeYourLearningDesc: 'Create collections to organize your saved content into themed folders for easier studying.',
    lessons: 'Lessons',
    lessonsDesc: 'Multi-step courses from CivicSense',
    myCollections: 'My Collections',
    myCollectionsDesc: 'Your organized content folders',
    createYourFirstCollection: 'Create your first collection to organize your saved content',
    filterContent: 'Filter Content',
    allContent: 'All',
    topics: 'Topics',
    quizResults: 'Quiz Results',
    customQuizzes: 'Custom Quizzes',
    bookmarks: 'Bookmarks',
    noSavedLessons: 'No Saved Lessons',
    noSavedTopics: 'No Saved Topics',
    noQuizResults: 'No Quiz Results',
    noBookmarks: 'No Bookmarks',
    noSavedItems: 'No Saved Items',
    exploreContent: 'Explore Content',
    selectItems: 'Select items',
    itemsSelected: '{{count}} item{{plural}} selected',
    selectItemsToOrganize: 'Select items to organize',
    organizeSelectedItems: 'Organize selected items',
    moveToCollection: 'Move to Collection',
    removeItem: 'Remove Item',
    removeItemConfirm: 'Are you sure you want to remove this saved item?',
    highlightedText: 'Highlighted Text',
    textSnippet: 'Text Snippet',
    customQuiz: 'Custom Quiz',
    continueYourCivicsAssessment: 'Continue Your Civics Assessment',
    questionsCompleted: '{{completed}} of {{total}} questions completed',
    started: 'Started {{date}}',
    scoreLabel: 'Score',
    xpEarned: '+{{xp}} XP',
    questions: 'Questions',
    draft: 'DRAFT',
    published: 'PUBLISHED',
    savedRecently: 'Saved {{time}}',
    savedTime: 'Saved {{time}} ago',
    keepGoing: 'Keep going! 🎯',
    nothingNewToday: 'Nothing new today? Perfect time to explore! 📚',
    nothingNewTodayDesc: 'Try navigating to other dates using the arrows above, or explore these learning options below.',
    currentEvents: 'Current Events',
    currentEventsDesc: 'Tap any story to create a quiz about that topic',
    findingCurrentEvents: 'Finding current events for {{date}}...',
    continueWhereLeftOff: 'Continue where you left off',
    orExploreMore: 'Or explore more',
    continueLearning: 'Continue learning',
    exploreQuizTopics: 'Explore Quiz Topics',
    exploreQuizTopicsDesc: 'Discover quizzes on government, rights, and civic participation',
    takeCivicsAssessment: 'Take Civics Assessment',
    takeCivicsAssessmentDesc: 'Test your knowledge of American government and democracy',
    reviewSavedContent: 'Review Saved Content',
    reviewSavedContentDesc: 'Continue learning from your bookmarked topics',
    createCustomContent: 'Create Custom Content',
    createCustomContentDesc: 'Design your own topics & questions',
    pro: 'PRO',
  },

  // Quiz/Learn Screen
  learn: {
    title: 'Learn',
    loadingQuizCollections: 'Loading quiz collections...',
    usingOfflineData: 'Using offline quiz data - network unavailable',
    featuredLessons: 'Featured Lessons',
    featuredLessonsDesc: 'Curated lesson collections for current topics',
    allCollections: 'All Collections',
    allCollectionsDesc: 'Comprehensive civic knowledge testing',
    collections: '{{count}} collections',
    topics: 'Topics',
    topicsDesc: 'Explore individual civic topics with targeted questions',
    noQuizCollections: 'No quiz collections available',
    noQuizCollectionsOffline: 'Check your internet connection and try again',
    noQuizCollectionsOnline: 'New quiz collections will appear here when available',
    quizDataSource: 'Quiz data source: {{source}}',
    liveAPI: 'Live API',
    offlineCache: 'Offline cache',
    showingRealTimeData: 'Showing real-time quiz collections from server',
    usingCachedData: 'Using cached quiz data - some content may be outdated',
    new: 'New',
    featured: 'Featured',
    estimatedTime: '{{time}} min',
    completionRate: '{{rate}}% completion',
    completion: 'completion',
    continue: 'Continue',
    start: 'Start',
    available: 'Available',
    difficulty: 'Difficulty',
    searchTopics: 'Search topics',
  },

  // Home Screen
  home: {
    welcomeBack: 'Welcome back, {{name}}',
    welcome: 'CivicSense',
    citizen: 'Citizen',
    loadingYourCivicJourney: 'Loading your civic journey...',
    loadingContent: 'Loading content...',
    today: 'Today',
    dailyChallenge: 'Daily Challenge ({{completed}} of {{total}})',
    questionsOf: '{{completed}} of {{total}}',
    dayStreak: '{{count}} day{{plural}}',
    days: 'days',
    day: 'day',
    loadingDate: 'Loading {{date}}',
    noFeaturedToday: 'No featured topics today',
    noFeaturedTodayDesc: 'Check back later for breaking news and featured content',
    checkBackLater: 'Check back later for breaking news and featured content',
    keepGoingTarget: 'Keep going! 🎯',
    navigateToOtherDates: 'Try navigating to other dates using the arrows above, or explore these learning options below.',
    exploreMoreOptions: 'explore these learning options below',
    todaysCurrentEvents: 'Today\'s Current Events',
    currentEventsForDate: '{{date}} Current Events',
    tapAnyStoryToCreate: 'Tap any story to create a quiz about that topic',
    findingCurrentEventsFor: 'Finding current events for {{date}}...',
    exploreQuizTopics: 'Explore Quiz Topics',
    exploreQuizTopicsDesc: 'Discover quizzes on government, rights, and civic participation',
    takeCivicsAssessment: 'Take Civics Assessment',
    takeCivicsAssessmentDesc: 'Test your knowledge of American government and democracy',
    reviewSavedContent: 'Review Saved Content',
    reviewSavedContentDesc: 'Continue learning from your bookmarked topics',
    createCustomContent: 'Create Custom Content',
    createCustomContentDesc: 'Design your own topics & questions',
    designYourOwnTopics: 'Design your own topics & questions',
    proFeature: 'PRO',
    startReview: 'Start Review',
    readMore: 'Read More',
    signUpToSaveProgress: 'Sign up to save your progress and unlock achievements',
    yourProgressMatters: 'Your progress matters',
    preserveYourLearning: 'Preserve your learning journey and continue building your civic knowledge',
    getStarted: 'Get Started',
    nothingNewToday: 'Nothing new today? Perfect time to explore! 📚',
    keepGoing: 'Keep going! 🎯',
  },
};

// Default export for convenience
export default strings; 