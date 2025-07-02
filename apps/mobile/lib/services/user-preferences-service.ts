import { supabase } from '../supabase';
import { DB_TABLES } from '../database-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// INTERFACES
// ============================================================================

// Visual/UI preferences - stored in LOCAL STORAGE for immediate effect
export interface VisualPreferences {
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
}

// Learning/sync preferences - stored in DATABASE for cross-device sync
export interface LearningPreferences {
  learningPace: 'self_paced' | 'structured' | 'intensive';
  preferredDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  preferredQuizLength: number;
  studyTimePreference: 'morning' | 'afternoon' | 'evening' | 'any_time';
  showExplanations: boolean;
  showDifficultyIndicators: boolean;
  showSources: boolean;
  showAchievements: boolean;
  showStreaks: boolean;
  showLeaderboards: boolean;
  competitiveMode: boolean;
  dailyReminder: boolean;
  weeklySummary: boolean;
  pushNotifications: boolean;
  achievementNotifications: boolean;
  emailNotifications: boolean;
}

// Combined interface for convenience
export interface UserPreferences extends VisualPreferences, LearningPreferences {}

export interface QuizCustomizationOptions {
  difficulty: string;
  questionCount: number;
  timeLimit?: number;
  showExplanations: boolean;
  showDifficultyIndicators: boolean;
  showHints: boolean;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const VISUAL_PREFERENCES_KEY = '@CivicSense:VisualPreferences';

// ============================================================================
// USER PREFERENCES SERVICE
// ============================================================================

export class UserPreferencesService {
  private static defaultVisualPreferences: VisualPreferences = {
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
    screenReaderMode: false,
  };

  private static defaultLearningPreferences: LearningPreferences = {
    learningPace: 'structured',
    preferredDifficulty: 'medium',
    preferredQuizLength: 10,
    studyTimePreference: 'any_time',
    showExplanations: true,
    showDifficultyIndicators: true,
    showSources: true,
    showAchievements: true,
    showStreaks: true,
    showLeaderboards: true,
    competitiveMode: false,
    dailyReminder: true,
    weeklySummary: true,
    pushNotifications: true,
    achievementNotifications: true,
    emailNotifications: true,
  };

  // ============================================================================
  // VISUAL PREFERENCES (LOCAL STORAGE)
  // ============================================================================

  /**
   * Get visual preferences from local storage
   */
  static async getVisualPreferences(): Promise<VisualPreferences> {
    try {
      const stored = await AsyncStorage.getItem(VISUAL_PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.defaultVisualPreferences, ...parsed };
      }
      return this.defaultVisualPreferences;
    } catch (error) {
      console.error('Error loading visual preferences:', error);
      return this.defaultVisualPreferences;
    }
  }

  /**
   * Save visual preferences to local storage
   */
  static async saveVisualPreferences(preferences: Partial<VisualPreferences>): Promise<boolean> {
    try {
      const current = await this.getVisualPreferences();
      const updated = { ...current, ...preferences };
      await AsyncStorage.setItem(VISUAL_PREFERENCES_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Error saving visual preferences:', error);
      return false;
    }
  }

  /**
   * Update a single visual preference
   */
  static async updateVisualPreference<K extends keyof VisualPreferences>(
    key: K,
    value: VisualPreferences[K]
  ): Promise<boolean> {
    return this.saveVisualPreferences({ [key]: value });
  }

  // ============================================================================
  // LEARNING PREFERENCES (DATABASE)
  // ============================================================================

  /**
   * Get learning preferences from database
   */
  static async getLearningPreferences(userId: string): Promise<LearningPreferences> {
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.USER_PLATFORM_PREFERENCES)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching learning preferences:', error);
        return this.defaultLearningPreferences;
      }

      if (!data) {
        // Initialize with defaults if no preferences exist
        await this.initializeLearningPreferences(userId);
        return this.defaultLearningPreferences;
      }

      // Map database fields to our interface
      return {
        learningPace: data.learning_pace || this.defaultLearningPreferences.learningPace,
        preferredDifficulty: data.preferred_difficulty || this.defaultLearningPreferences.preferredDifficulty,
        preferredQuizLength: data.preferred_quiz_length || this.defaultLearningPreferences.preferredQuizLength,
        studyTimePreference: data.study_time_preference || this.defaultLearningPreferences.studyTimePreference,
        showExplanations: data.show_explanations ?? this.defaultLearningPreferences.showExplanations,
        showDifficultyIndicators: data.show_difficulty_indicators ?? this.defaultLearningPreferences.showDifficultyIndicators,
        showSources: data.show_sources ?? this.defaultLearningPreferences.showSources,
        showAchievements: data.show_achievements ?? this.defaultLearningPreferences.showAchievements,
        showStreaks: data.show_streaks ?? this.defaultLearningPreferences.showStreaks,
        showLeaderboards: data.show_leaderboards ?? this.defaultLearningPreferences.showLeaderboards,
        competitiveMode: data.competitive_mode ?? this.defaultLearningPreferences.competitiveMode,
        dailyReminder: data.daily_reminder ?? this.defaultLearningPreferences.dailyReminder,
        weeklySummary: data.weekly_summary ?? this.defaultLearningPreferences.weeklySummary,
        pushNotifications: data.push_notifications ?? this.defaultLearningPreferences.pushNotifications,
        achievementNotifications: data.achievement_notifications ?? this.defaultLearningPreferences.achievementNotifications,
        emailNotifications: data.email_notifications ?? this.defaultLearningPreferences.emailNotifications,
      };
    } catch (error) {
      console.error('Error in getLearningPreferences:', error);
      return this.defaultLearningPreferences;
    }
  }

  /**
   * Save learning preferences to database
   */
  static async saveLearningPreferences(
    userId: string, 
    preferences: Partial<LearningPreferences>
  ): Promise<boolean> {
    try {
      // Map interface keys to database column names
      const updateData: any = {
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      if (preferences.learningPace !== undefined) {
        updateData.learning_pace = preferences.learningPace;
      }
      if (preferences.preferredDifficulty !== undefined) {
        updateData.preferred_difficulty = preferences.preferredDifficulty;
      }
      if (preferences.preferredQuizLength !== undefined) {
        updateData.preferred_quiz_length = preferences.preferredQuizLength;
      }
      if (preferences.studyTimePreference !== undefined) {
        updateData.study_time_preference = preferences.studyTimePreference;
      }
      if (preferences.showExplanations !== undefined) {
        updateData.show_explanations = preferences.showExplanations;
      }
      if (preferences.showDifficultyIndicators !== undefined) {
        updateData.show_difficulty_indicators = preferences.showDifficultyIndicators;
      }
      if (preferences.showSources !== undefined) {
        updateData.show_sources = preferences.showSources;
      }
      if (preferences.showAchievements !== undefined) {
        updateData.show_achievements = preferences.showAchievements;
      }
      if (preferences.showStreaks !== undefined) {
        updateData.show_streaks = preferences.showStreaks;
      }
      if (preferences.showLeaderboards !== undefined) {
        updateData.show_leaderboards = preferences.showLeaderboards;
      }
      if (preferences.competitiveMode !== undefined) {
        updateData.competitive_mode = preferences.competitiveMode;
      }
      if (preferences.dailyReminder !== undefined) {
        updateData.daily_reminder = preferences.dailyReminder;
      }
      if (preferences.weeklySummary !== undefined) {
        updateData.weekly_summary = preferences.weeklySummary;
      }
      if (preferences.pushNotifications !== undefined) {
        updateData.push_notifications = preferences.pushNotifications;
      }
      if (preferences.achievementNotifications !== undefined) {
        updateData.achievement_notifications = preferences.achievementNotifications;
      }
      if (preferences.emailNotifications !== undefined) {
        updateData.email_notifications = preferences.emailNotifications;
      }

      const { error } = await supabase
        .from(DB_TABLES.USER_PLATFORM_PREFERENCES)
        .upsert(updateData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error updating learning preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveLearningPreferences:', error);
      return false;
    }
  }

  // ============================================================================
  // COMBINED PREFERENCES (CONVENIENCE METHODS)
  // ============================================================================

  /**
   * Get all user preferences (visual + learning)
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    const [visualPrefs, learningPrefs] = await Promise.all([
      this.getVisualPreferences(),
      this.getLearningPreferences(userId),
    ]);

    return { ...visualPrefs, ...learningPrefs };
  }

  /**
   * Save all user preferences (splits between local storage and database)
   */
  static async saveUserPreferences(
    userId: string, 
    preferences: Partial<UserPreferences>
  ): Promise<boolean> {
    try {
      // Split preferences into visual and learning
      const visualKeys: (keyof VisualPreferences)[] = ['fontSize', 'highContrast', 'reducedMotion', 'screenReaderMode'];
      const visualPrefs: Partial<VisualPreferences> = {};
      const learningPrefs: Partial<LearningPreferences> = {};

      Object.entries(preferences).forEach(([key, value]) => {
        if (visualKeys.includes(key as keyof VisualPreferences)) {
          (visualPrefs as any)[key] = value;
        } else {
          (learningPrefs as any)[key] = value;
        }
      });

      // Save to both storages
      const [visualSuccess, learningSuccess] = await Promise.all([
        Object.keys(visualPrefs).length > 0 ? this.saveVisualPreferences(visualPrefs) : true,
        Object.keys(learningPrefs).length > 0 ? this.saveLearningPreferences(userId, learningPrefs) : true,
      ]);

      return visualSuccess && learningSuccess;
    } catch (error) {
      console.error('Error in saveUserPreferences:', error);
      return false;
    }
  }

  // ============================================================================
  // LEGACY METHODS (for backward compatibility)
  // ============================================================================

  /**
   * Get quiz customization options based on user preferences
   */
  static async getQuizCustomization(userId: string): Promise<QuizCustomizationOptions> {
    const preferences = await this.getLearningPreferences(userId);

    // Calculate time limit based on learning pace and quiz length
    const timePerQuestion = {
      self_paced: 90,      // 1.5 minutes per question
      structured: 60,      // 1 minute per question
      intensive: 45,        // 45 seconds per question
    };

    const timeLimit = preferences.preferredQuizLength * timePerQuestion[preferences.learningPace];

    return {
      difficulty: preferences.preferredDifficulty,
      questionCount: preferences.preferredQuizLength,
      timeLimit,
      showExplanations: preferences.showExplanations,
      showDifficultyIndicators: preferences.showDifficultyIndicators,
      showHints: preferences.learningPace === 'self_paced', // Show hints for self-paced learners
    };
  }

  /**
   * Get display preferences for UI customization
   */
  static async getDisplayPreferences(userId: string) {
    const [visualPrefs, learningPrefs] = await Promise.all([
      this.getVisualPreferences(),
      this.getLearningPreferences(userId),
    ]);

    return {
      ...visualPrefs,
      showAchievements: learningPrefs.showAchievements,
      showStreaks: learningPrefs.showStreaks,
      showLeaderboards: learningPrefs.showLeaderboards,
      competitiveMode: learningPrefs.competitiveMode,
    };
  }

  /**
   * Get notification preferences
   */
  static async getNotificationPreferences(userId: string) {
    const preferences = await this.getLearningPreferences(userId);

    return {
      dailyReminder: preferences.dailyReminder,
      weeklySummary: preferences.weeklySummary,
      pushNotifications: preferences.pushNotifications,
      achievementNotifications: preferences.achievementNotifications,
      emailNotifications: preferences.emailNotifications,
      preferredStudyTime: preferences.studyTimePreference,
    };
  }

  /**
   * Get recommended study schedule based on preferences
   */
  static async getStudyScheduleRecommendations(userId: string) {
    const preferences = await this.getLearningPreferences(userId);

    const scheduleByPace = {
      self_paced: {
        sessionsPerWeek: 3,
        minutesPerSession: 20,
        questionsPerSession: 5,
      },
      structured: {
        sessionsPerWeek: 4,
        minutesPerSession: 15,
        questionsPerSession: 10,
      },
      intensive: {
        sessionsPerWeek: 5,
        minutesPerSession: 10,
        questionsPerSession: 15,
      },
    };

    const baseSchedule = scheduleByPace[preferences.learningPace];

    // Adjust based on study time preference
    const preferredTimes = {
      morning: ['09:00', '10:00', '11:00'],
      afternoon: ['13:00', '14:00', '15:00'],
      evening: ['18:00', '19:00', '20:00'],
      any_time: ['09:00', '13:00', '18:00'],
    };

    return {
      ...baseSchedule,
      preferredTimes: preferredTimes[preferences.studyTimePreference],
      dailyReminder: preferences.dailyReminder,
    };
  }

  /**
   * Check if user should see competitive features
   */
  static async shouldShowCompetitiveFeatures(userId: string): Promise<boolean> {
    const preferences = await this.getLearningPreferences(userId);
    return preferences.competitiveMode && preferences.showLeaderboards;
  }

  /**
   * Check if user should see social features
   */
  static async shouldShowSocialFeatures(userId: string): Promise<boolean> {
    const preferences = await this.getLearningPreferences(userId);
    return preferences.showAchievements || preferences.showStreaks || preferences.showLeaderboards;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Initialize learning preferences with defaults (database only)
   */
  private static async initializeLearningPreferences(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(DB_TABLES.USER_PLATFORM_PREFERENCES)
        .upsert({
          user_id: userId,
          learning_pace: this.defaultLearningPreferences.learningPace,
          preferred_difficulty: this.defaultLearningPreferences.preferredDifficulty,
          preferred_quiz_length: this.defaultLearningPreferences.preferredQuizLength,
          study_time_preference: this.defaultLearningPreferences.studyTimePreference,
          show_explanations: this.defaultLearningPreferences.showExplanations,
          show_difficulty_indicators: this.defaultLearningPreferences.showDifficultyIndicators,
          show_sources: this.defaultLearningPreferences.showSources,
          show_achievements: this.defaultLearningPreferences.showAchievements,
          show_streaks: this.defaultLearningPreferences.showStreaks,
          show_leaderboards: this.defaultLearningPreferences.showLeaderboards,
          competitive_mode: this.defaultLearningPreferences.competitiveMode,
          daily_reminder: this.defaultLearningPreferences.dailyReminder,
          weekly_summary: this.defaultLearningPreferences.weeklySummary,
          push_notifications: this.defaultLearningPreferences.pushNotifications,
          achievement_notifications: this.defaultLearningPreferences.achievementNotifications,
          email_notifications: this.defaultLearningPreferences.emailNotifications,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error('Error initializing learning preferences:', error);
      }
    } catch (error) {
      console.error('Error in initializeLearningPreferences:', error);
    }
  }

  /**
   * Update specific preference (legacy method)
   */
  static async updatePreference(
    userId: string, 
    key: keyof UserPreferences, 
    value: any
  ): Promise<boolean> {
    // Determine if this is a visual or learning preference
    const visualKeys: (keyof VisualPreferences)[] = ['fontSize', 'highContrast', 'reducedMotion', 'screenReaderMode'];
    
    if (visualKeys.includes(key as keyof VisualPreferences)) {
      return this.updateVisualPreference(key as keyof VisualPreferences, value);
    } else {
      return this.saveLearningPreferences(userId, { [key]: value } as Partial<LearningPreferences>);
    }
  }
} 