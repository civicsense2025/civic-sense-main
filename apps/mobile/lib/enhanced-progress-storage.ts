import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { AssessmentEngine, type AssessmentQuestion, type AssessmentSession } from './services/assessment-engine';

// Enhanced progress storage for assessments
export interface AssessmentProgress {
  sessionId: string;
  assessmentType: 'civics_test' | 'skill_assessment' | 'placement_test';
  userId?: string;
  guestToken?: string;
  currentQuestionIndex: number;
  answers: Record<string, string>; // questionId -> answer
  timeSpent: number; // in seconds
  startedAt: Date;
  lastSavedAt: Date;
  questionsData: AssessmentQuestion[]; // Store questions to avoid re-fetching
  metadata: {
    totalQuestions: number;
    questionsAnswered: number;
    estimatedTimeRemaining?: number;
    categoryProgress?: Record<string, { answered: number; total: number }>;
    wrongAnswers?: Record<string, { question: AssessmentQuestion; userAnswer: string; correctAnswer: string }>;
  };
}

export interface ProgressValidation {
  isValid: boolean;
  error?: string;
  canRestore: boolean;
}

export class EnhancedAssessmentProgressStorage {
  private static readonly STORAGE_KEY_PREFIX = '@assessment_progress_';
  private static readonly MAX_AGE_HOURS = 48; // 48 hours for assessments (longer than regular quizzes)
  private static readonly SAVE_INTERVAL_MS = 10000; // Save every 10 seconds
  private static readonly BACKUP_INTERVAL_MS = 30000; // Backup to database every 30 seconds

  private saveTimer?: ReturnType<typeof setTimeout> | undefined;
  private backupTimer?: ReturnType<typeof setInterval> | undefined;

  /**
   * Start automatic progress saving for an assessment session
   */
  static startProgressTracking(
    sessionId: string,
    assessmentProgress: AssessmentProgress,
    onProgressSaved?: (success: boolean) => void
  ): EnhancedAssessmentProgressStorage {
    const instance = new EnhancedAssessmentProgressStorage();
    
    // Initial save
    instance.saveProgress(assessmentProgress, onProgressSaved);
    
    // Set up automatic saving
    instance.saveTimer = setInterval(() => {
      instance.saveProgress(assessmentProgress, onProgressSaved);
    }, this.SAVE_INTERVAL_MS);

    // Set up database backup (less frequent)
    instance.backupTimer = setInterval(() => {
      instance.backupToDatabase(assessmentProgress);
    }, this.BACKUP_INTERVAL_MS);

    console.log(`📊 Started progress tracking for assessment: ${sessionId}`);
    return instance;
  }

  /**
   * Stop automatic progress tracking
   */
  stopProgressTracking(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = undefined;
    }
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = undefined;
    }
    console.log('📊 Stopped progress tracking');
  }

  /**
   * Save progress to local storage
   */
  private async saveProgress(
    progress: AssessmentProgress,
    onComplete?: (success: boolean) => void
  ): Promise<void> {
    try {
      const storageKey = `${EnhancedAssessmentProgressStorage.STORAGE_KEY_PREFIX}${progress.sessionId}`;
      const progressWithTimestamp = {
        ...progress,
        lastSavedAt: new Date(),
      };

      await AsyncStorage.setItem(storageKey, JSON.stringify(progressWithTimestamp));
      console.log(`💾 Assessment progress saved locally: ${progress.sessionId}`);
      onComplete?.(true);
    } catch (error) {
      console.error('❌ Failed to save assessment progress locally:', error);
      onComplete?.(false);
    }
  }

  /**
   * Backup progress to database
   */
  private async backupToDatabase(progress: AssessmentProgress): Promise<void> {
    try {
      // Only backup if user is logged in
      if (!progress.userId) {
        return;
      }

      const { error } = await supabase
        .from('progress_sessions')
        .upsert({
          session_id: progress.sessionId,
          user_id: progress.userId,
          session_type: 'assessment', // Proper session type for comprehensive assessments
          assessment_type: progress.assessmentType,
          current_question_index: progress.currentQuestionIndex,
          answers: progress.answers,
          questions: Array.isArray(progress.questionsData) ? progress.questionsData : [],
          last_updated_at: new Date().toISOString(),
          started_at: progress.startedAt.toISOString(),
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
          metadata: {
            timeSpent: progress.timeSpent,
            ...progress.metadata,
          }
        }, {
          onConflict: 'session_id'
        });

      if (error) {
        console.warn('⚠️ Failed to backup assessment progress to database:', error);
      } else {
        console.log(`☁️ Assessment progress backed up to database: ${progress.sessionId}`);
      }
    } catch (error) {
      console.warn('⚠️ Database backup failed:', error);
      // Don't throw - local storage is primary
    }
  }

  /**
   * Load progress from storage
   */
  static async loadProgress(sessionId: string): Promise<AssessmentProgress | null> {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${sessionId}`;
      
      // Try local storage first
      const localProgress = await this.loadFromLocalStorage(storageKey);
      if (localProgress) {
        const validation = this.validateProgress(localProgress);
        if (validation.isValid && validation.canRestore) {
          console.log(`📖 Loaded assessment progress from local storage: ${sessionId}`);
          return localProgress;
        } else {
          console.warn(`⚠️ Local progress validation failed: ${validation.error}`);
          // Clean up invalid progress
          await AsyncStorage.removeItem(storageKey);
        }
      }

      // Try database backup
      const dbProgress = await this.loadFromDatabase(sessionId);
      if (dbProgress) {
        const validation = this.validateProgress(dbProgress);
        if (validation.isValid && validation.canRestore) {
          console.log(`☁️ Loaded assessment progress from database: ${sessionId}`);
          // Save to local storage for faster access
          await AsyncStorage.setItem(storageKey, JSON.stringify(dbProgress));
          return dbProgress;
        }
      }

      console.log(`📝 No valid progress found for assessment: ${sessionId}`);
      return null;
    } catch (error) {
      console.error('❌ Error loading assessment progress:', error);
      return null;
    }
  }

  /**
   * Load progress from local storage
   */
  private static async loadFromLocalStorage(storageKey: string): Promise<AssessmentProgress | null> {
    try {
      const progressStr = await AsyncStorage.getItem(storageKey);
      if (!progressStr) return null;

      const progress = JSON.parse(progressStr);
      // Convert date strings back to Date objects
      progress.startedAt = new Date(progress.startedAt);
      progress.lastSavedAt = new Date(progress.lastSavedAt);
      
      return progress;
    } catch (error) {
      console.error('❌ Error parsing local assessment progress:', error);
      return null;
    }
  }

  /**
   * Load progress from database
   */
  private static async loadFromDatabase(sessionId: string): Promise<AssessmentProgress | null> {
    try {
      const { data, error } = await supabase
        .from('progress_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('session_type', 'assessment') // Proper session type for comprehensive assessments
        .single();

      if (error || !data) {
        return null;
      }

      // Convert database format to AssessmentProgress
      const progress: AssessmentProgress = {
        sessionId: data.session_id,
        assessmentType: data.assessment_type as 'civics_test' | 'skill_assessment' | 'placement_test',
        userId: data.user_id || undefined,
        guestToken: data.guest_token || undefined,
        currentQuestionIndex: data.current_question_index,
        answers: data.answers as Record<string, string>,
        timeSpent: data.metadata?.timeSpent || 0,
        startedAt: new Date(data.started_at),
        lastSavedAt: new Date(data.last_updated_at),
        questionsData: data.questions as AssessmentQuestion[],
        metadata: {
          totalQuestions: data.questions?.length || 0,
          questionsAnswered: Object.keys(data.answers || {}).length,
          ...data.metadata,
        },
      };

      return progress;
    } catch (error) {
      console.error('❌ Error loading assessment progress from database:', error);
      return null;
    }
  }

  /**
   * Validate progress data
   */
  private static validateProgress(progress: AssessmentProgress): ProgressValidation {
    try {
      // Check required fields
      if (!progress.sessionId || !progress.assessmentType || !progress.startedAt) {
        return {
          isValid: false,
          error: 'Missing required fields',
          canRestore: false,
        };
      }

      // Check age
      const now = new Date();
      const maxAge = this.MAX_AGE_HOURS * 60 * 60 * 1000;
      const age = now.getTime() - progress.startedAt.getTime();
      
      if (age > maxAge) {
        return {
          isValid: false,
          error: `Progress too old: ${Math.round(age / (60 * 60 * 1000))} hours`,
          canRestore: false,
        };
      }

      // Check data integrity
      if (!progress.questionsData || progress.questionsData.length === 0) {
        return {
          isValid: false,
          error: 'No questions data found',
          canRestore: false,
        };
      }

      // Check if current question index is valid
      if (progress.currentQuestionIndex < 0 || progress.currentQuestionIndex >= progress.questionsData.length) {
        return {
          isValid: true,
          error: 'Invalid question index, will reset to last valid position',
          canRestore: true,
        };
      }

      // Check if answers are reasonable
      const answeredCount = Object.keys(progress.answers).length;
      if (answeredCount > progress.questionsData.length) {
        return {
          isValid: false,
          error: 'More answers than questions',
          canRestore: false,
        };
      }

      return {
        isValid: true,
        canRestore: true,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${error}`,
        canRestore: false,
      };
    }
  }

  /**
   * Update progress with new answer
   */
  static async updateProgress(
    sessionId: string,
    questionId: string,
    answer: string,
    currentQuestionIndex: number,
    timeSpent: number
  ): Promise<boolean> {
    try {
      const progress = await this.loadProgress(sessionId);
      if (!progress) {
        console.error('❌ Cannot update progress - session not found');
        return false;
      }

      // Update progress
      progress.answers[questionId] = answer;
      progress.currentQuestionIndex = currentQuestionIndex;
      progress.timeSpent = timeSpent;
      progress.lastSavedAt = new Date();
      progress.metadata.questionsAnswered = Object.keys(progress.answers).length;

      // Calculate category progress if questions have categories
      const categoryProgress: Record<string, { answered: number; total: number }> = {};
      progress.questionsData.forEach((question, index) => {
        const category = question.category;
        if (!categoryProgress[category]) {
          categoryProgress[category] = { answered: 0, total: 0 };
        }
        categoryProgress[category].total++;
        if (progress.answers[question.id]) {
          categoryProgress[category].answered++;
        }
      });
      progress.metadata.categoryProgress = categoryProgress;

      // Save updated progress
      const storageKey = `${this.STORAGE_KEY_PREFIX}${sessionId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(progress));

      console.log(`📊 Updated assessment progress: ${sessionId} (${progress.metadata.questionsAnswered}/${progress.metadata.totalQuestions})`);
      return true;
    } catch (error) {
      console.error('❌ Error updating assessment progress:', error);
      return false;
    }
  }

  /**
   * Clear progress (when assessment is completed or abandoned)
   */
  static async clearProgress(sessionId: string, reason: 'completed' | 'abandoned' = 'completed'): Promise<void> {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${sessionId}`;
      await AsyncStorage.removeItem(storageKey);

      // Mark as completed in database if it exists
      await supabase
        .from('progress_sessions')
        .update({
          metadata: {
            completed: true,
            completedAt: new Date().toISOString(),
            reason,
          }
        })
        .eq('session_id', sessionId);

      console.log(`🗑️ Cleared assessment progress: ${sessionId} (${reason})`);
    } catch (error) {
      console.error('❌ Error clearing assessment progress:', error);
    }
  }

  /**
   * Get all incomplete assessment sessions for a user
   */
  static async getIncompleteAssessments(userId?: string): Promise<AssessmentProgress[]> {
    try {
      const incomplete: AssessmentProgress[] = [];

      // Get all assessment progress from local storage
      const keys = await AsyncStorage.getAllKeys();
      const assessmentKeys = keys.filter(key => key.startsWith(this.STORAGE_KEY_PREFIX));

      for (const key of assessmentKeys) {
        const progress = await this.loadFromLocalStorage(key);
        if (progress && (!userId || progress.userId === userId)) {
          const validation = this.validateProgress(progress);
          if (validation.isValid && validation.canRestore) {
            // Check if not completed
            const isCompleted = progress.currentQuestionIndex >= progress.questionsData.length - 1;
            if (!isCompleted) {
              incomplete.push(progress);
            }
          }
        }
      }

      console.log(`📋 Found ${incomplete.length} incomplete assessments`);
      return incomplete.sort((a, b) => b.lastSavedAt.getTime() - a.lastSavedAt.getTime());
    } catch (error) {
      console.error('❌ Error getting incomplete assessments:', error);
      return [];
    }
  }

  /**
   * Create initial progress for a new assessment
   */
  static async createInitialProgress(
    session: AssessmentSession,
    questions: AssessmentQuestion[]
  ): Promise<AssessmentProgress> {
    const progress: AssessmentProgress = {
      sessionId: session.id,
      assessmentType: session.assessment_type,
      userId: session.user_id,
      currentQuestionIndex: 0,
      answers: {},
      timeSpent: 0,
      startedAt: session.started_at,
      lastSavedAt: new Date(),
      questionsData: questions,
      metadata: {
        totalQuestions: questions.length,
        questionsAnswered: 0,
        categoryProgress: {},
      },
    };

    // Save initial progress
    const storageKey = `${this.STORAGE_KEY_PREFIX}${session.id}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify(progress));

    console.log(`📝 Created initial assessment progress: ${session.id}`);
    return progress;
  }
} 