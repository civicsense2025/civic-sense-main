/**
 * ============================================================================
 * COMPREHENSIVE REFRESH SERVICE
 * ============================================================================
 * 
 * Unified pull-to-refresh system for CivicSense mobile app that integrates with:
 * - React Query for data fetching and caching
 * - ContentCacheService for offline content
 * - User-specific data (progress, bookmarks, etc.)
 * 
 * This service ensures that manual refreshes triggered anywhere below the
 * app header will properly clear and refresh all relevant cached data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { contentCacheService } from '../content-cache-service';
import { StandardizedDataService } from '../standardized-data-service';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RefreshOptions {
  /** Force refresh even if data is recent */
  force?: boolean;
  /** Include user-specific data refresh */
  includeUserData?: boolean;
  /** Include content cache refresh */
  includeContentCache?: boolean;
  /** Include React Query cache invalidation */
  includeQueryCache?: boolean;
  /** Specific sections to refresh */
  sections?: RefreshSection[];
  /** Progress callback for UI feedback */
  onProgress?: (progress: number, stage: string) => void;
}

export type RefreshSection = 
  | 'categories'
  | 'topics' 
  | 'questions'
  | 'userProgress'
  | 'bookmarks'
  | 'stats'
  | 'dailyContent'
  | 'achievements';

export interface RefreshResult {
  success: boolean;
  refreshedSections: RefreshSection[];
  errors: Record<string, string>;
  timestamp: number;
  duration: number;
}

interface RefreshState {
  isRefreshing: boolean;
  lastRefresh: number;
  currentStage: string;
  progress: number;
}

// ============================================================================
// REFRESH SERVICE CLASS
// ============================================================================

export class RefreshService {
  private static instance: RefreshService;
  private queryClient: QueryClient | null = null;
  private dataService: StandardizedDataService;
  private refreshState: RefreshState = {
    isRefreshing: false,
    lastRefresh: 0,
    currentStage: '',
    progress: 0,
  };

  private readonly REFRESH_COOLDOWN = 30 * 1000; // 30 seconds between refreshes
  private readonly REFRESH_STATE_KEY = 'refresh_service_state';

  constructor() {
    this.dataService = StandardizedDataService.getInstance();
    this.loadRefreshState();
  }

  static getInstance(): RefreshService {
    if (!this.instance) {
      this.instance = new RefreshService();
    }
    return this.instance;
  }

  /**
   * Initialize with React Query client for cache invalidation
   */
  initialize(queryClient: QueryClient): void {
    this.queryClient = queryClient;
    console.log('🔄 RefreshService initialized with QueryClient');
  }

  // ============================================================================
  // MAIN REFRESH METHODS
  // ============================================================================

  /**
   * Perform a comprehensive app refresh
   */
  async refreshApp(options: RefreshOptions = {}): Promise<RefreshResult> {
    const startTime = Date.now();
    
    console.log('🔄 Starting comprehensive app refresh...');
    
    // Prevent rapid successive refreshes
    if (this.isRefreshingOrCoolingDown() && !options.force) {
      console.log('⏳ Refresh in progress or cooling down, skipping...');
      return this.createSkippedResult();
    }

    const {
      force = false,
      includeUserData = true,
      includeContentCache = true,
      includeQueryCache = true,
      sections,
      onProgress
    } = options;

    this.updateRefreshState({
      isRefreshing: true,
      currentStage: 'Starting refresh...',
      progress: 0,
    });

    const refreshedSections: RefreshSection[] = [];
    const errors: Record<string, string> = {};
    
    try {
      // Determine which sections to refresh
      const sectionsToRefresh = sections || this.getAllRefreshSections();
      const totalSteps = sectionsToRefresh.length;
      let currentStep = 0;

      // Step 1: Clear React Query cache if requested
      if (includeQueryCache && this.queryClient) {
        this.updateStage('Clearing query cache...', onProgress);
        await this.clearQueryCache();
        currentStep++;
        this.updateProgress(currentStep / totalSteps, onProgress);
      }

      // Step 2: Clear and refresh content cache
      if (includeContentCache) {
        this.updateStage('Refreshing content cache...', onProgress);
        
        try {
          await this.refreshContentCache(force);
          refreshedSections.push('categories', 'topics', 'questions');
        } catch (error) {
          console.error('❌ Content cache refresh failed:', error);
          const errorMessage = error instanceof Error ? error.message : 'Content cache refresh failed';
          errors.categories = errorMessage;
          errors.topics = errorMessage;
          errors.questions = errorMessage;
        }
        
        currentStep++;
        this.updateProgress(currentStep / totalSteps, onProgress);
      }

      // Step 3: Refresh user-specific data
      if (includeUserData) {
        await this.refreshUserData(sectionsToRefresh, refreshedSections, errors, onProgress);
        currentStep += sectionsToRefresh.filter(s => 
          ['userProgress', 'bookmarks', 'stats', 'achievements'].includes(s)
        ).length;
      }

      // Step 4: Refresh daily content if requested
      if (sectionsToRefresh.includes('dailyContent')) {
        this.updateStage('Refreshing daily content...', onProgress);
        
        try {
          await this.refreshDailyContent(force);
          refreshedSections.push('dailyContent');
        } catch (error) {
          console.error('❌ Daily content refresh failed:', error);
          errors.dailyContent = error instanceof Error ? error.message : 'Daily content refresh failed';
        }
        
        currentStep++;
        this.updateProgress(currentStep / totalSteps, onProgress);
      }

      // Final step: Update refresh timestamp
      this.updateStage('Finalizing...', onProgress);
      this.updateProgress(1, onProgress);
      
      const result: RefreshResult = {
        success: Object.keys(errors).length === 0,
        refreshedSections,
        errors,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };

      console.log('✅ App refresh completed:', {
        duration: result.duration,
        sections: refreshedSections.length,
        errors: Object.keys(errors).length,
      });

      return result;

    } catch (error) {
      console.error('❌ Critical error during app refresh:', error);
      
      return {
        success: false,
        refreshedSections,
        errors: { ...errors, general: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };

    } finally {
      this.updateRefreshState({
        isRefreshing: false,
        lastRefresh: Date.now(),
        currentStage: '',
        progress: 0,
      });
    }
  }

  /**
   * Quick refresh for specific sections (optimized for pull-to-refresh)
   */
  async quickRefresh(sections: RefreshSection[] = ['categories', 'dailyContent']): Promise<RefreshResult> {
    console.log('⚡ Quick refresh for sections:', sections);
    
    return this.refreshApp({
      sections,
      includeUserData: sections.some(s => ['userProgress', 'bookmarks', 'stats'].includes(s)),
      includeContentCache: sections.some(s => ['categories', 'topics', 'questions'].includes(s)),
      includeQueryCache: true,
    });
  }

  // ============================================================================
  // SPECIFIC REFRESH METHODS
  // ============================================================================

  private async refreshContentCache(force: boolean): Promise<void> {
    console.log('📦 Refreshing content cache...');
    
    if (force) {
      await contentCacheService.clearContentCache();
    }
    
    // Force fresh data load
    await contentCacheService.initializeContentCache();
  }

  private async refreshUserData(
    sectionsToRefresh: RefreshSection[], 
    refreshedSections: RefreshSection[], 
    errors: Record<string, string>,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<void> {
    
    // Refresh user progress
    if (sectionsToRefresh.includes('userProgress')) {
      this.updateStage('Refreshing user progress...', onProgress);
      
      try {
        // Clear progress-related queries
        if (this.queryClient) {
          await this.queryClient.invalidateQueries({ queryKey: ['userProgress'] });
          await this.queryClient.invalidateQueries({ queryKey: ['userStats'] });
        }
        refreshedSections.push('userProgress');
      } catch (error) {
        console.error('❌ User progress refresh failed:', error);
        errors.userProgress = error instanceof Error ? error.message : 'Progress refresh failed';
      }
    }

    // Refresh bookmarks
    if (sectionsToRefresh.includes('bookmarks')) {
      this.updateStage('Refreshing bookmarks...', onProgress);
      
      try {
        // Invalidate bookmark queries to force refresh
        if (this.queryClient) {
          await this.queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        }
        refreshedSections.push('bookmarks');
      } catch (error) {
        console.error('❌ Bookmarks refresh failed:', error);
        errors.bookmarks = error instanceof Error ? error.message : 'Bookmarks refresh failed';
      }
    }

    // Refresh user stats
    if (sectionsToRefresh.includes('stats')) {
      this.updateStage('Refreshing user statistics...', onProgress);
      
      try {
        // Invalidate stats queries to force refresh
        if (this.queryClient) {
          await this.queryClient.invalidateQueries({ queryKey: ['userStats'] });
        }
        refreshedSections.push('stats');
      } catch (error) {
        console.error('❌ User stats refresh failed:', error);
        errors.stats = error instanceof Error ? error.message : 'Stats refresh failed';
      }
    }
  }

  private async refreshDailyContent(force: boolean): Promise<void> {
    console.log('📅 Refreshing daily content...');
    
    if (this.queryClient) {
      // Invalidate daily content queries
      await this.queryClient.invalidateQueries({ queryKey: ['dailyTopics'] });
      await this.queryClient.invalidateQueries({ queryKey: ['featuredContent'] });
      await this.queryClient.invalidateQueries({ queryKey: ['dailyQuiz'] });
    }

    // Clear daily content cache
    const dailyCacheKeys = [
      'daily_topics_cache',
      'featured_content_cache',
      'daily_quiz_cache',
    ];

    await Promise.all(
      dailyCacheKeys.map(key => AsyncStorage.removeItem(key))
    );
  }

  private async clearQueryCache(): Promise<void> {
    if (!this.queryClient) {
      console.warn('⚠️ QueryClient not initialized, skipping query cache clear');
      return;
    }

    console.log('🗑️ Clearing React Query cache...');
    
    // Clear all queries
    await this.queryClient.clear();
    
    // Optionally invalidate specific query keys that should be refetched
    const criticalQueries = [
      ['categories'],
      ['topics'],
      ['dailyTopics'],
      ['userProgress'],
      ['bookmarks'],
    ];

    await Promise.all(
      criticalQueries.map(queryKey => 
        this.queryClient!.invalidateQueries({ queryKey })
      )
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getAllRefreshSections(): RefreshSection[] {
    return [
      'categories',
      'topics',
      'questions',
      'userProgress',
      'bookmarks',
      'stats',
      'dailyContent',
      'achievements',
    ];
  }

  private updateStage(stage: string, onProgress?: (progress: number, stage: string) => void): void {
    this.refreshState.currentStage = stage;
    if (__DEV__) console.log(`[REFRESH] ${stage}`);
    onProgress?.(this.refreshState.progress, stage);
  }

  private updateProgress(progress: number, onProgress?: (progress: number, stage: string) => void): void {
    this.refreshState.progress = Math.min(1, Math.max(0, progress));
    onProgress?.(this.refreshState.progress, this.refreshState.currentStage);
  }

  private updateRefreshState(updates: Partial<RefreshState>): void {
    this.refreshState = { ...this.refreshState, ...updates };
    this.saveRefreshState();
  }

  private isRefreshingOrCoolingDown(): boolean {
    const now = Date.now();
    const timeSinceRefresh = now - this.refreshState.lastRefresh;
    
    return this.refreshState.isRefreshing || timeSinceRefresh < this.REFRESH_COOLDOWN;
  }

  private createSkippedResult(): RefreshResult {
    return {
      success: true,
      refreshedSections: [],
      errors: {},
      timestamp: Date.now(),
      duration: 0,
    };
  }

  private async loadRefreshState(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(this.REFRESH_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.refreshState = { 
          ...this.refreshState, 
          ...parsed,
          isRefreshing: false, // Never start as refreshing
        };
      }
    } catch (error) {
      console.warn('⚠️ Failed to load refresh state:', error);
    }
  }

  private async saveRefreshState(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.REFRESH_STATE_KEY, JSON.stringify(this.refreshState));
    } catch (error) {
      console.warn('⚠️ Failed to save refresh state:', error);
    }
  }

  // ============================================================================
  // PUBLIC STATE GETTERS
  // ============================================================================

  get isRefreshing(): boolean {
    return this.refreshState.isRefreshing;
  }

  get lastRefreshTime(): number {
    return this.refreshState.lastRefresh;
  }

  get currentStage(): string {
    return this.refreshState.currentStage;
  }

  get progress(): number {
    return this.refreshState.progress;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const refreshService = RefreshService.getInstance(); 