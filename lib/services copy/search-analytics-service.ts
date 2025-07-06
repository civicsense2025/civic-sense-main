/**
 * Search Analytics Service for CivicSense Mobile
 * Handles user search behavior tracking, content views, and personalized recommendations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { Platform } from 'react-native';

// Types for search analytics
export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultSelected?: {
    type: 'collection' | 'topic';
    id: string;
    title: string;
    position?: number;
  };
  timeToSelectionMs?: number;
  resultsCount?: number;
  searchAbandoned?: boolean;
}

export interface ViewedItem {
  type: 'collection' | 'topic';
  id: string;
  title: string;
  slug?: string;
  lastViewed: number;
  viewCount: number;
  timeSpent?: number; // seconds
  completed?: boolean;
  score?: number;
  progressPercentage?: number;
  referrerType?: 'search' | 'recommendation' | 'direct' | 'featured';
  referrerId?: string;
}

export interface SearchAnalytics {
  totalSearches: number;
  topQueries: string[];
  topCategories: string[];
  avgSessionTime: number;
  preferredDifficulty?: string;
  learningStreak: number;
  searchSuccessRate: number;
}

export interface UserLearningPattern {
  preferredContentTypes: string[];
  preferredCategories: string[];
  preferredSessionLengthMinutes: number;
  peakActivityHours: number[];
  learningStreakDays: number;
  completionRate: number;
  avgQuizScore?: number;
}

export interface ContentRecommendation {
  contentType: 'collection' | 'topic';
  contentId: string;
  contentTitle: string;
  recommendationScore: number;
  recommendationType: 'similar_content' | 'popular_in_category' | 'trending' | 'incomplete_content';
  reasoningFactors: Record<string, any>;
  isRecentlyViewed?: boolean;
  lastViewed?: number;
}

// Storage keys for local fallback
const SEARCH_HISTORY_KEY = 'civicsense_search_history';
const VIEWED_ITEMS_KEY = 'civicsense_viewed_items';
const SEARCH_ANALYTICS_KEY = 'civicsense_search_analytics';
const USER_PATTERNS_KEY = 'civicsense_user_patterns';

export class SearchAnalyticsService {
  private sessionId: string;
  private userId?: string;
  private guestToken?: string;

  constructor(userId?: string, guestToken?: string) {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.userId = userId;
    this.guestToken = guestToken;
  }

  // ============================================================================
  // SEARCH HISTORY TRACKING
  // ============================================================================

  async recordSearch(
    query: string,
    resultsCount: number,
    searchType: 'general' | 'collection' | 'topic' = 'general',
    filters: Record<string, any> = {}
  ): Promise<void> {
    try {
      const searchData = {
        user_id: this.userId || null,
        guest_token: this.guestToken || null,
        session_id: this.sessionId,
        search_query: query.trim(),
        search_type: searchType,
        search_filters: filters,
        results_count: resultsCount,
        device_type: Platform.OS === 'ios' ? 'mobile' : Platform.OS === 'android' ? 'mobile' : 'unknown',
        platform: Platform.OS,
        searched_at: new Date().toISOString(),
      };

      // Try to save to database first
      const { error } = await supabase
        .from('user_search_history')
        .insert(searchData);

      if (error) {
        console.warn('Failed to save search to database:', error);
        // Fallback to local storage
        await this.saveSearchToLocal(query, resultsCount);
      }

      // Update local analytics
      await this.updateLocalSearchAnalytics(query);

    } catch (error) {
      console.error('Error recording search:', error);
      // Always try local fallback
      await this.saveSearchToLocal(query, resultsCount);
    }
  }

  async recordSearchSelection(
    query: string,
    selectedResult: SearchHistoryItem['resultSelected'],
    timeToSelectionMs: number
  ): Promise<void> {
    try {
      // Update the most recent search record with selection info
      const { error } = await supabase
        .from('user_search_history')
        .update({
          result_selected: selectedResult,
          time_to_selection_ms: timeToSelectionMs,
          search_abandoned: false,
        })
        .eq('search_query', query.trim())
        .eq('session_id', this.sessionId)
        .order('searched_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Failed to update search selection:', error);
      }

      // Update local storage
      await this.updateLocalSearchHistory(query, selectedResult, timeToSelectionMs);

    } catch (error) {
      console.error('Error recording search selection:', error);
    }
  }

  async getSearchHistory(limit: number = 50): Promise<SearchHistoryItem[]> {
    try {
      // Try database first
      if (this.userId) {
        const { data, error } = await supabase
          .from('user_search_history')
          .select('*')
          .eq('user_id', this.userId)
          .order('searched_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data.map(this.mapDatabaseSearchToLocal);
        }
      }

      // Fallback to local storage
      return await this.getLocalSearchHistory(limit);

    } catch (error) {
      console.error('Error getting search history:', error);
      return await this.getLocalSearchHistory(limit);
    }
  }

  // ============================================================================
  // CONTENT VIEW TRACKING
  // ============================================================================

  async recordContentView(viewData: {
    contentType: 'collection' | 'topic';
    contentId: string;
    contentTitle: string;
    contentSlug?: string;
    referrerType?: 'search' | 'recommendation' | 'direct' | 'featured';
    referrerId?: string;
  }): Promise<void> {
    try {
      const contentViewData = {
        user_id: this.userId || null,
        guest_token: this.guestToken || null,
        session_id: this.sessionId,
        content_type: viewData.contentType,
        content_id: viewData.contentId,
        content_title: viewData.contentTitle,
        content_slug: viewData.contentSlug || null,
        referrer_type: viewData.referrerType || 'direct',
        referrer_id: viewData.referrerId || null,
        device_type: Platform.OS === 'ios' ? 'mobile' : Platform.OS === 'android' ? 'mobile' : 'unknown',
        platform: Platform.OS,
        started_at: new Date().toISOString(),
      };

      // Try database first
      const { error } = await supabase
        .from('user_content_views')
        .insert(contentViewData);

      if (error) {
        console.warn('Failed to save content view to database:', error);
      }

      // Always update local storage for immediate use
      await this.saveViewedItemToLocal({
        type: viewData.contentType,
        id: viewData.contentId,
        title: viewData.contentTitle,
        slug: viewData.contentSlug,
        lastViewed: Date.now(),
        viewCount: 1,
        referrerType: viewData.referrerType,
        referrerId: viewData.referrerId,
      });

    } catch (error) {
      console.error('Error recording content view:', error);
      // Fallback to local only
      await this.saveViewedItemToLocal({
        type: viewData.contentType,
        id: viewData.contentId,
        title: viewData.contentTitle,
        slug: viewData.contentSlug,
        lastViewed: Date.now(),
        viewCount: 1,
      });
    }
  }

  async updateContentProgress(
    contentType: 'collection' | 'topic',
    contentId: string,
    progressData: {
      viewDurationSeconds?: number;
      progressPercentage?: number;
      completed?: boolean;
      quizScore?: number;
      interactionsCount?: number;
    }
  ): Promise<void> {
    try {
      const updateData: any = {
        view_duration_seconds: progressData.viewDurationSeconds,
        progress_percentage: progressData.progressPercentage,
        interactions_count: progressData.interactionsCount,
        updated_at: new Date().toISOString(),
      };

      if (progressData.completed) {
        updateData.completed_at = new Date().toISOString();
      }

      if (progressData.quizScore !== undefined) {
        updateData.quiz_score = progressData.quizScore;
      }

      // Update database
      const { error } = await supabase
        .from('user_content_views')
        .update(updateData)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('session_id', this.sessionId);

      if (error) {
        console.warn('Failed to update content progress:', error);
      }

      // Update local storage
      await this.updateLocalViewedItem(contentType, contentId, {
        timeSpent: progressData.viewDurationSeconds,
        progressPercentage: progressData.progressPercentage,
        completed: progressData.completed,
        score: progressData.quizScore,
      });

    } catch (error) {
      console.error('Error updating content progress:', error);
    }
  }

  async getViewedItems(limit: number = 100): Promise<ViewedItem[]> {
    try {
      // Try database first
      if (this.userId) {
        const { data, error } = await supabase
          .from('user_content_views')
          .select('*')
          .eq('user_id', this.userId)
          .order('last_viewed_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data.map(this.mapDatabaseViewToLocal);
        }
      }

      // Fallback to local storage
      return await this.getLocalViewedItems(limit);

    } catch (error) {
      console.error('Error getting viewed items:', error);
      return await this.getLocalViewedItems(limit);
    }
  }

  // ============================================================================
  // PERSONALIZED RECOMMENDATIONS
  // ============================================================================

  async getPersonalizedRecommendations(limit: number = 10): Promise<ContentRecommendation[]> {
    try {
      if (!this.userId) {
        // For guest users, use local patterns
        return await this.getLocalRecommendations(limit);
      }

      // Get recommendations from database
      const { data, error } = await supabase
        .from('content_recommendations')
        .select('*')
        .eq('user_id', this.userId)
        .gt('expires_at', new Date().toISOString())
        .order('recommendation_score', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data.map(this.mapDatabaseRecommendationToLocal);
      }

      // Generate recommendations based on user patterns
      return await this.generateRecommendations(limit);

    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return await this.getLocalRecommendations(limit);
    }
  }

  async recordRecommendationInteraction(
    recommendationId: string,
    interactionType: 'shown' | 'clicked' | 'completed',
    feedback?: number
  ): Promise<void> {
    try {
      const updateData: any = {};
      
      switch (interactionType) {
        case 'shown':
          updateData.shown_to_user = true;
          updateData.shown_at = new Date().toISOString();
          break;
        case 'clicked':
          updateData.clicked_by_user = true;
          updateData.clicked_at = new Date().toISOString();
          break;
        case 'completed':
          updateData.completed_by_user = true;
          updateData.completed_at = new Date().toISOString();
          break;
      }

      if (feedback !== undefined) {
        updateData.user_feedback = feedback;
        updateData.feedback_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('content_recommendations')
        .update(updateData)
        .eq('id', recommendationId);

      if (error) {
        console.warn('Failed to record recommendation interaction:', error);
      }

    } catch (error) {
      console.error('Error recording recommendation interaction:', error);
    }
  }

  // ============================================================================
  // USER LEARNING PATTERNS
  // ============================================================================

  async getUserLearningPatterns(): Promise<UserLearningPattern | null> {
    try {
      if (!this.userId) {
        return await this.getLocalLearningPatterns();
      }

      const { data, error } = await supabase
        .from('user_learning_patterns')
        .select('*')
        .eq('user_id', this.userId)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        return this.mapDatabasePatternToLocal(data);
      }

      return await this.getLocalLearningPatterns();

    } catch (error) {
      console.error('Error getting user learning patterns:', error);
      return await this.getLocalLearningPatterns();
    }
  }

  // ============================================================================
  // ANALYTICS & INSIGHTS
  // ============================================================================

  async getSearchAnalytics(): Promise<SearchAnalytics> {
    try {
      const searchHistory = await this.getSearchHistory(100);
      const viewedItems = await this.getViewedItems(100);

      const totalSearches = searchHistory.length;
      const searchesWithSelection = searchHistory.filter(s => s.resultSelected).length;
      const searchSuccessRate = totalSearches > 0 ? (searchesWithSelection / totalSearches) * 100 : 0;

      // Calculate top queries
      const queryFrequency: Record<string, number> = {};
      searchHistory.forEach(search => {
        const query = search.query.toLowerCase();
        queryFrequency[query] = (queryFrequency[query] || 0) + 1;
      });

      const topQueries = Object.entries(queryFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([query]) => query);

      // Calculate learning streak
      const learningStreak = this.calculateLearningStreak(viewedItems);

      // Calculate average session time
      const avgSessionTime = viewedItems.reduce((sum, item) => 
        sum + (item.timeSpent || 0), 0
      ) / Math.max(viewedItems.length, 1);

      return {
        totalSearches,
        topQueries,
        topCategories: [], // TODO: Calculate from content categories
        avgSessionTime: Math.round(avgSessionTime),
        learningStreak,
        searchSuccessRate: Math.round(searchSuccessRate * 100) / 100,
      };

    } catch (error) {
      console.error('Error getting search analytics:', error);
      return {
        totalSearches: 0,
        topQueries: [],
        topCategories: [],
        avgSessionTime: 0,
        learningStreak: 0,
        searchSuccessRate: 0,
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async saveSearchToLocal(query: string, resultsCount: number): Promise<void> {
    try {
      const history = await this.getLocalSearchHistory();
      const newItem: SearchHistoryItem = {
        query: query.trim(),
        timestamp: Date.now(),
        resultsCount,
      };

      const updatedHistory = [newItem, ...history.filter(h => h.query !== newItem.query)].slice(0, 50);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving search to local storage:', error);
    }
  }

  private async updateLocalSearchHistory(
    query: string,
    resultSelected: SearchHistoryItem['resultSelected'],
    timeToSelectionMs: number
  ): Promise<void> {
    try {
      const history = await this.getLocalSearchHistory();
      const updatedHistory = history.map(item => {
        if (item.query === query.trim()) {
          return {
            ...item,
            resultSelected,
            timeToSelectionMs,
          };
        }
        return item;
      });

      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error updating local search history:', error);
    }
  }

  private async getLocalSearchHistory(limit: number = 50): Promise<SearchHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (data) {
        const history = JSON.parse(data);
        return history.slice(0, limit);
      }
      return [];
    } catch (error) {
      console.error('Error getting local search history:', error);
      return [];
    }
  }

  private async saveViewedItemToLocal(item: ViewedItem): Promise<void> {
    try {
      const viewedItems = await this.getLocalViewedItems();
      const existingIndex = viewedItems.findIndex(
        v => v.type === item.type && v.id === item.id
      );

      if (existingIndex >= 0) {
        // Update existing item - exclude viewCount from item to avoid conflict
        const { viewCount: itemViewCount, ...itemWithoutViewCount } = item;
        viewedItems[existingIndex] = {
          ...viewedItems[existingIndex],
          ...itemWithoutViewCount,
          viewCount: viewedItems[existingIndex].viewCount + 1,
        };
      } else {
        // Add new item
        viewedItems.unshift(item);
      }

      const trimmedItems = viewedItems.slice(0, 100);
      await AsyncStorage.setItem(VIEWED_ITEMS_KEY, JSON.stringify(trimmedItems));
    } catch (error) {
      console.error('Error saving viewed item to local storage:', error);
    }
  }

  private async updateLocalViewedItem(
    contentType: string,
    contentId: string,
    updates: Partial<ViewedItem>
  ): Promise<void> {
    try {
      const viewedItems = await this.getLocalViewedItems();
      const updatedItems = viewedItems.map(item => {
        if (item.type === contentType && item.id === contentId) {
          return { ...item, ...updates, lastViewed: Date.now() };
        }
        return item;
      });

      await AsyncStorage.setItem(VIEWED_ITEMS_KEY, JSON.stringify(updatedItems));
    } catch (error) {
      console.error('Error updating local viewed item:', error);
    }
  }

  private async getLocalViewedItems(limit: number = 100): Promise<ViewedItem[]> {
    try {
      const data = await AsyncStorage.getItem(VIEWED_ITEMS_KEY);
      if (data) {
        const items = JSON.parse(data);
        return items.slice(0, limit);
      }
      return [];
    } catch (error) {
      console.error('Error getting local viewed items:', error);
      return [];
    }
  }

  private async updateLocalSearchAnalytics(query: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(SEARCH_ANALYTICS_KEY);
      const analytics = data ? JSON.parse(data) : {
        totalSearches: 0,
        topQueries: [],
        searchSuccessRate: 0,
        learningStreak: 0,
      };

      analytics.totalSearches += 1;
      
      // Update top queries
      const queryLower = query.toLowerCase().trim();
      if (queryLower.length > 1 && !analytics.topQueries.includes(queryLower)) {
        analytics.topQueries.unshift(queryLower);
        analytics.topQueries = analytics.topQueries.slice(0, 10);
      }

      await AsyncStorage.setItem(SEARCH_ANALYTICS_KEY, JSON.stringify(analytics));
    } catch (error) {
      console.error('Error updating local search analytics:', error);
    }
  }

  private async getLocalRecommendations(limit: number): Promise<ContentRecommendation[]> {
    // Generate basic recommendations based on local data
    const viewedItems = await this.getLocalViewedItems();
    const incompleteItems = viewedItems.filter(item => !item.completed).slice(0, limit);

    return incompleteItems.map(item => ({
      contentType: item.type,
      contentId: item.id,
      contentTitle: item.title,
      recommendationScore: 75,
      recommendationType: 'incomplete_content' as const,
      reasoningFactors: { reason: 'Continue where you left off' },
      isRecentlyViewed: true,
      lastViewed: item.lastViewed,
    }));
  }

  private async generateRecommendations(limit: number): Promise<ContentRecommendation[]> {
    // TODO: Implement more sophisticated recommendation logic
    return await this.getLocalRecommendations(limit);
  }

  private async getLocalLearningPatterns(): Promise<UserLearningPattern | null> {
    try {
      const data = await AsyncStorage.getItem(USER_PATTERNS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting local learning patterns:', error);
      return null;
    }
  }

  private calculateLearningStreak(viewedItems: ViewedItem[]): number {
    // Calculate consecutive days with learning activity
    const today = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    let streak = 0;

    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(today.getTime() - (i * oneDayMs));
      const dayStart = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate()).getTime();
      const dayEnd = dayStart + oneDayMs;

      const hasActivity = viewedItems.some(item => 
        item.lastViewed >= dayStart && item.lastViewed < dayEnd
      );

      if (hasActivity) {
        streak++;
      } else if (i > 0) { // Don't break on first day (today)
        break;
      }
    }

    return streak;
  }

  // Database to local mapping functions
  private mapDatabaseSearchToLocal(dbSearch: any): SearchHistoryItem {
    return {
      query: dbSearch.search_query,
      timestamp: new Date(dbSearch.searched_at).getTime(),
      resultSelected: dbSearch.result_selected,
      timeToSelectionMs: dbSearch.time_to_selection_ms,
      resultsCount: dbSearch.results_count,
      searchAbandoned: dbSearch.search_abandoned,
    };
  }

  private mapDatabaseViewToLocal(dbView: any): ViewedItem {
    return {
      type: dbView.content_type,
      id: dbView.content_id,
      title: dbView.content_title,
      slug: dbView.content_slug,
      lastViewed: new Date(dbView.last_viewed_at).getTime(),
      viewCount: dbView.return_visits || 1,
      timeSpent: dbView.view_duration_seconds,
      completed: !!dbView.completed_at,
      score: dbView.quiz_score,
      progressPercentage: dbView.progress_percentage,
      referrerType: dbView.referrer_type,
      referrerId: dbView.referrer_id,
    };
  }

  private mapDatabaseRecommendationToLocal(dbRec: any): ContentRecommendation {
    return {
      contentType: dbRec.content_type,
      contentId: dbRec.content_id,
      contentTitle: dbRec.content_title,
      recommendationScore: dbRec.recommendation_score,
      recommendationType: dbRec.recommendation_type,
      reasoningFactors: dbRec.reasoning_factors || {},
    };
  }

  private mapDatabasePatternToLocal(dbPattern: any): UserLearningPattern {
    return {
      preferredContentTypes: dbPattern.preferred_content_types || [],
      preferredCategories: dbPattern.preferred_categories || [],
      preferredSessionLengthMinutes: dbPattern.preferred_session_length_minutes || 0,
      peakActivityHours: dbPattern.peak_activity_hours || [],
      learningStreakDays: dbPattern.learning_streak_days || 0,
      completionRate: dbPattern.completion_rate || 0,
      avgQuizScore: dbPattern.avg_quiz_score,
    };
  }

  // ============================================================================
  // DATA MIGRATION & SYNC
  // ============================================================================

  async syncLocalDataToDatabase(): Promise<void> {
    if (!this.userId) return;

    try {
      // Sync search history
      const localSearches = await this.getLocalSearchHistory();
      for (const search of localSearches.slice(0, 20)) { // Sync last 20 searches
        await this.recordSearch(search.query, search.resultsCount || 0);
        if (search.resultSelected) {
          await this.recordSearchSelection(
            search.query,
            search.resultSelected,
            search.timeToSelectionMs || 0
          );
        }
      }

      // Sync viewed items
      const localViews = await this.getLocalViewedItems();
      for (const view of localViews.slice(0, 50)) { // Sync last 50 views
        await this.recordContentView({
          contentType: view.type,
          contentId: view.id,
          contentTitle: view.title,
          contentSlug: view.slug,
          referrerType: view.referrerType,
          referrerId: view.referrerId,
        });

        if (view.timeSpent || view.progressPercentage || view.completed || view.score) {
          await this.updateContentProgress(view.type, view.id, {
            viewDurationSeconds: view.timeSpent,
            progressPercentage: view.progressPercentage,
            completed: view.completed,
            quizScore: view.score,
          });
        }
      }

      console.log('Successfully synced local data to database');
    } catch (error) {
      console.error('Error syncing local data to database:', error);
    }
  }

  async clearLocalData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(SEARCH_HISTORY_KEY),
        AsyncStorage.removeItem(VIEWED_ITEMS_KEY),
        AsyncStorage.removeItem(SEARCH_ANALYTICS_KEY),
        AsyncStorage.removeItem(USER_PATTERNS_KEY),
      ]);
      console.log('Local search analytics data cleared');
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  }
}

// Export singleton instance factory
export const createSearchAnalyticsService = (userId?: string, guestToken?: string) => {
  return new SearchAnalyticsService(userId, guestToken);
}; 