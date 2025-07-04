import type { Database } from '@civicsense/types/database'

// Re-export database types for convenience
export type { Database }

// Table type helpers
export type Tables = Database['public']['Tables']
export type TableRow<T extends keyof Tables> = Tables[T]['Row']
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert']
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update']

// Specific table types
export type DbQuestionTopic = TableRow<'question_topics'>
export type DbQuestion = TableRow<'questions'>
export type DbUserQuizAttempt = TableRow<'user_quiz_attempts'>
export type DbUserProgress = TableRow<'user_progress'>
export type DbQuestionFeedback = TableRow<'question_feedback'>

export type DbQuestionTopicInsert = TableInsert<'question_topics'>
export type DbQuestionInsert = TableInsert<'questions'>
export type DbUserQuizAttemptInsert = TableInsert<'user_quiz_attempts'>
export type DbUserProgressInsert = TableInsert<'user_progress'>
export type DbQuestionFeedbackInsert = TableInsert<'question_feedback'>

export type DbQuestionTopicUpdate = TableUpdate<'question_topics'>
export type DbQuestionUpdate = TableUpdate<'questions'>
export type DbUserQuizAttemptUpdate = TableUpdate<'user_quiz_attempts'>
export type DbUserProgressUpdate = TableUpdate<'user_progress'>
export type DbQuestionFeedbackUpdate = TableUpdate<'question_feedback'>

// Additional types for enhanced gamification
export type DbUserCategorySkill = TableRow<'user_category_skills'>
export type DbUserCategorySkillInsert = TableInsert<'user_category_skills'>
export type DbUserCategorySkillUpdate = TableUpdate<'user_category_skills'>

export type DbUserAchievement = TableRow<'user_achievements'>
export type DbUserAchievementInsert = TableInsert<'user_achievements'>

export type DbUserCustomDeck = TableRow<'user_custom_decks'>
export type DbUserCustomDeckInsert = TableInsert<'user_custom_decks'>
export type DbUserCustomDeckUpdate = TableUpdate<'user_custom_decks'>

export type DbUserDeckContent = TableRow<'user_deck_content'>
export type DbUserDeckContentInsert = TableInsert<'user_deck_content'>

export type DbUserQuestionMemory = TableRow<'user_question_memory'>
export type DbUserQuestionMemoryInsert = TableInsert<'user_question_memory'>
export type DbUserQuestionMemoryUpdate = TableUpdate<'user_question_memory'>

export type DbUserStreakHistory = TableRow<'user_streak_history'>
export type DbUserStreakHistoryInsert = TableInsert<'user_streak_history'>

export type DbUserLearningGoal = TableRow<'user_learning_goals'>
export type DbUserLearningGoalInsert = TableInsert<'user_learning_goals'>
export type DbUserLearningGoalUpdate = TableUpdate<'user_learning_goals'> 