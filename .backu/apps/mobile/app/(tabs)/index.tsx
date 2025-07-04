// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Pressable,
  Dimensions,
  Animated,
  Easing,
  Modal,
  Share,
  ActivityIndicator,
} from 'react-native';
import { CrossPlatformPagerView, type PagerViewRef } from '../../components/ui/CrossPlatformPagerView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { NewsTicker } from '../../components/ui/NewsTicker';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { AppHeader } from '../../components/ui/AppHeader';
import { spacing, borderRadius, typography, responsiveFontSizes, createAnimationTiming, createSpringAnimation, shadows, fontFamily } from '../../lib/theme';
import { DataErrorBoundary, AsyncErrorBoundary } from '../../components/error-boundaries';
import { enhancedPerformanceMonitor } from '../../lib/enhanced-performance-monitor';
import { 
  fetchCategories,
  fetchUserProgress,
  type StandardResponse,
  type StandardCategory,
} from '../../lib/standardized-data-service';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import { useUIStrings } from '../../lib/hooks/useUIStrings';
import { LanguageSelector } from '../../components/settings/LanguageSelector';
import { TranslationScannerOverlay } from '../../components/ui/TranslationScannerOverlay';
import { BookmarkButton } from '../../components/ui/BookmarkButton';
import { 
  GuestProgressWidget,
  IncompleteAssessmentCard,
} from '../../components/ui';

import { GuestTokenService } from '../../lib/services/guest-token-service';
import { HomeRefreshControl } from '../../components/ui/EnhancedRefreshControl';
import { EnhancedAssessmentProgressStorage } from '../../lib/enhanced-progress-storage';
import type { AssessmentProgress } from '../../lib/enhanced-progress-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.85;

// =============================================================================
// UTILITY FUNCTIONS FOR DATE-AWARE CONTENT
// =============================================================================

const formatDateKey = (date: Date | null | undefined): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return formatDateKey(new Date()); // Fallback to today
  }
  try {
    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('Invalid date in formatDateKey:', date);
    return formatDateKey(new Date()); // Fallback to today
  }
};

// =============================================================================
// DATE-SPECIFIC NEWS FETCHING SERVICE
// =============================================================================

interface DateSpecificNewsItem {
  title: string;
  url: string;
  description: string;
  domain: string;
  published_time: string;
  og_title?: string;
  og_description?: string;
  og_image?: string | null;
  credibility_score: number;
  author?: string;
  bias_rating?: string;
  content_type: string;
  language: string;
  date_specific: string; // The date this news is specifically for
}

class DateSpecificNewsService {
  private static fetchedDates = new Set<string>(); // Track dates we've already tried to fetch

  static async fetchAndSaveNewsForDate(date: Date): Promise<DateSpecificNewsItem[]> {
    const dateKey = formatDateKey(date);
    
    // Don't fetch multiple times for the same date
    if (this.fetchedDates.has(dateKey)) {
      console.log(`📰 Already attempted to fetch news for ${dateKey}`);
      return [];
    }
    
    this.fetchedDates.add(dateKey);
    
    try {
      console.log(`📰 Fetching date-specific news for ${dateKey}...`);
      
      // Check if we already have news for this date
      const { data: existingNews, error: checkError } = await supabase
        .from('source_metadata')
        .select('*')
        .eq('date_specific', dateKey)
        .eq('is_active', true)
        .limit(5);
      
      if (checkError) {
        console.error('Error checking existing news:', checkError);
      } else if (existingNews && existingNews.length > 0) {
        console.log(`📰 Found ${existingNews.length} existing news items for ${dateKey}`);
        return existingNews.map(item => ({
          title: item.title || '',
          url: item.url || '',
          description: item.description || '',
          domain: item.domain || '',
          published_time: item.published_time || date.toISOString(),
          og_title: item.og_title,
          og_description: item.og_description,
          og_image: item.og_image,
          credibility_score: item.credibility_score || 0,
          author: item.author,
          bias_rating: item.bias_rating,
          content_type: item.content_type || 'article',
          language: item.language || 'en',
          date_specific: item.date_specific || dateKey,
        }));
      }
      
      // Generate realistic current events for the date
      const newsItems = this.generateDateSpecificNews(date);
      
      // Save to source_metadata table
      const savedItems = await this.saveNewsToDatabase(newsItems);
      
      console.log(`📰 Successfully saved ${savedItems.length} news items for ${dateKey}`);
      return savedItems;
      
    } catch (error) {
      console.error(`❌ Error fetching news for ${dateKey}:`, error);
      return [];
    }
  }

  private static generateDateSpecificNews(date: Date): DateSpecificNewsItem[] {
    const dateKey = formatDateKey(date);
    const isToday = dateKey === formatDateKey(new Date());
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
    
    // Create realistic civic news items for the specific date
    const newsTemplates = [
      {
        title: `${isToday ? 'Today' : dayOfWeek}: Congressional Committee Reviews Federal Budget Priorities`,
        description: `House and Senate committees examining spending allocations for key domestic programs as ${monthName} budget discussions continue.`,
        domain: 'congress.gov',
        author: 'Congressional Press Office',
        credibility_score: 95,
        bias_rating: 'center',
      },
      {
        title: `Federal Agencies Release New Policy Guidelines for ${monthName}`,
        description: `Multiple federal departments coordinating on regulatory updates affecting healthcare, environment, and education sectors.`,
        domain: 'federalregister.gov',
        author: 'Federal Register Staff',
        credibility_score: 98,
        bias_rating: 'center',
      },
      {
        title: `State Governors Address Infrastructure Investment Needs`,
        description: `Bipartisan coalition of governors meeting with federal officials to discuss transportation and broadband funding priorities.`,
        domain: 'nga.org',
        author: 'National Governors Association',
        credibility_score: 90,
        bias_rating: 'center',
      },
      {
        title: `Supreme Court Calendar: Cases to Watch This ${monthName}`,
        description: `Legal experts preview upcoming oral arguments and potential rulings affecting constitutional law and civil rights.`,
        domain: 'supremecourt.gov',
        author: 'Supreme Court Public Information Office',
        credibility_score: 99,
        bias_rating: 'center',
      },
      {
        title: `Local Election Officials Prepare for ${monthName} Voting Procedures`,
        description: `County clerks and election administrators implementing updated voting protocols and accessibility measures nationwide.`,
        domain: 'eac.gov',
        author: 'Election Assistance Commission',
        credibility_score: 92,
        bias_rating: 'center',
      },
    ];

    return newsTemplates.map((template, index) => ({
      ...template,
      url: `https://${template.domain}/${dateKey}/${index + 1}`,
      published_time: date.toISOString(),
      og_title: template.title,
      og_description: template.description,
      og_image: null,
      content_type: 'article',
      language: 'en',
      date_specific: dateKey,
    }));
  }

  private static async saveNewsToDatabase(newsItems: DateSpecificNewsItem[]): Promise<DateSpecificNewsItem[]> {
    try {
      const { data, error } = await supabase
        .from('source_metadata')
        .insert(newsItems.map(item => ({
          title: item.title,
          url: item.url,
          description: item.description,
          domain: item.domain,
          published_time: item.published_time,
          og_title: item.og_title,
          og_description: item.og_description,
          og_image: item.og_image,
          credibility_score: item.credibility_score,
          author: item.author,
          bias_rating: item.bias_rating,
          content_type: item.content_type,
          language: item.language,
          is_active: true,
          date_specific: item.date_specific,
        })))
        .select();

      if (error) {
        console.error('Error saving news to database:', error);
        return [];
      }

      return data as DateSpecificNewsItem[];
    } catch (error) {
      console.error('Error in saveNewsToDatabase:', error);
      return [];
    }
  }
}

const formatDateForHeader = (date: Date | null | undefined): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Today';
  }
  
  if (isToday(date)) {
    return 'Today';
  }
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric'
  });
};

const addDays = (date: Date, days: number): Date => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    date = new Date(); // Fallback to today
  }
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isToday = (date: Date | null | undefined): boolean => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }
  const today = new Date();
  // Compare year, month, and day directly to avoid timezone issues
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
};

const truncateDescription = (description: string, maxLength: number = 200): string => {
  if (!description) return '';
  const cleanDescription = String(description);
  return cleanDescription.length > maxLength 
    ? cleanDescription.substring(0, maxLength).trim() + '...'
    : cleanDescription;
};

// Enhanced topic interface with minimal visual elements
interface EnhancedTopic {
  id: string;
  topic_id: string;
  title: string;
  topic_title: string;
  description: string;
  emoji?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTime?: number;
  isNew?: boolean;
  isFeatured: boolean;
  isBreaking: boolean;
  publishedDate?: Date;
  question_count?: number;
  categories?: string[];
  category?: {
    id: string;
    name: string;
  };
  created_at?: string;
  date?: string;
  is_featured?: boolean;
  is_breaking?: boolean;
  is_active?: boolean;
  why_this_matters?: string;
}

// =============================================================================
// ENHANCED DAY-AWARE CACHING SYSTEM WITH DATE-BASED ORGANIZATION
// =============================================================================

interface DayTopicsCache {
  [dateKey: string]: {
    topics: EnhancedTopic[];
    featuredTopics: EnhancedTopic[];
    timestamp: number;
    expiresAt: number;
  };
}

class DayAwareTopicCache {
  private cache: DayTopicsCache = {};
  private readonly CACHE_DURATION = 30 * 24 * 60 * 60 * 1000;
  private readonly MAX_CACHE_ENTRIES = 15; // Keep 15 days cached (roughly 2 weeks)
  private readonly PREFETCH_RADIUS = 2; // Prefetch 2 days in each direction
  private accessOrder: string[] = []; // Track access order for LRU eviction
  private prefetchQueue = new Set<string>(); // Track pending prefetches

  async getTopicsForDate(date: Date, forceRefresh = false): Promise<{ topics: EnhancedTopic[], featuredTopics: EnhancedTopic[] }> {
    const dateKey = formatDateKey(date);
    
    // Update access order for LRU cache
    this.updateAccessOrder(dateKey);
    
    if (!forceRefresh && this.isCacheValid(dateKey)) {
      console.log(`📦 Using cached data for ${dateKey}`);
      
      // Trigger intelligent prefetching for adjacent dates
      this.intelligentPrefetch(date);
      
      return {
        topics: this.cache[dateKey]!.topics,
        featuredTopics: this.cache[dateKey]!.featuredTopics
      };
    }

    console.log(`🔄 Fetching fresh data for ${dateKey}`);
    const result = await this.fetchTopicsForDate(date);
    
    // Cache results and manage cache size
    this.cacheTopics(dateKey, result.topics, result.featuredTopics);
    this.evictOldEntries();
    
    console.log(`✅ Cached ${result.topics.length + result.featuredTopics.length} topics for ${dateKey}`);
    
    // Trigger intelligent prefetching after successful load
    this.intelligentPrefetch(date);
    
    return result;
  }

  private async fetchTopicsForDate(date: Date): Promise<{ topics: EnhancedTopic[], featuredTopics: EnhancedTopic[] }> {
    try {
      const dateStr = formatDateKey(date);
      const today = formatDateKey(new Date());
      console.log(`📅 Fetching topics for date: ${dateStr} (today: ${today})`);

      // Always try database query first - we have actual date-specific content in the database
      const { data: topicsData, error } = await supabase
        .from('question_topics')
        .select('*')
        .eq('is_active', true)
        .eq('date', dateStr) // Filter by specific date
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching topics by date:', error);
        // If query fails, try fallback
        console.log(`⚠️ Date-specific query failed for ${dateStr}, trying fallback...`);
        return await this.fetchFallbackTopics(date);
      }

      const allTopics = topicsData || [];
      console.log(`📊 Found ${allTopics.length} topics for ${dateStr}`);

      // If no topics found for this specific date, check if it's today - if so, show empty state
      if (allTopics.length === 0) {
        if (dateStr === today) {
          console.log(`📭 No topics found for today (${dateStr}), showing empty state`);
          return { topics: [], featuredTopics: [] };
        } else {
          console.log(`📭 No topics found for ${dateStr}, trying fallback...`);
          return await this.fetchFallbackTopics(date);
        }
      }

      // Add question counts for all topics
      const topicsWithQuestionCounts = await this.addQuestionCounts(allTopics);
      
      // Separate featured/breaking topics from regular topics
      const featuredTopics = topicsWithQuestionCounts.filter(topic => 
        topic.is_featured === true || topic.is_breaking === true
      );
      
      const regularTopics = topicsWithQuestionCounts.filter(topic => 
        topic.is_featured !== true && topic.is_breaking !== true
      );

      console.log(`📋 Regular topics: ${regularTopics.length}, Featured/Breaking: ${featuredTopics.length}`);

      return {
        topics: this.enhanceTopics(regularTopics),
        featuredTopics: this.enhanceTopics(featuredTopics)
      };
    } catch (error) {
      console.error('Error fetching topics:', error);
      
      // Always try fallback on any error
      console.log(`🔄 Main fetch failed for ${formatDateKey(date)}, trying fallback...`);
      try {
        return await this.fetchFallbackTopics(date);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        // Return empty arrays instead of throwing to prevent crashes
        return { topics: [], featuredTopics: [] };
      }
    }
  }

  // Fallback method when no database content exists for a specific date
  private async fetchFallbackTopics(date: Date): Promise<{ topics: EnhancedTopic[], featuredTopics: EnhancedTopic[] }> {
    try {
      const dateKey = formatDateKey(date);
      console.log(`🔄 Using fallback topics for ${dateKey} - no database content found`);
      
      // Fetch recent active topics as fallback when no date-specific content exists
      const { data: fallbackData, error } = await supabase
        .from('question_topics')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8); // Get a reasonable number of recent topics

      if (error) {
        console.error('Fallback query failed:', error);
        throw error;
      }

      const allTopics = fallbackData || [];
      console.log(`📦 Fallback: found ${allTopics.length} recent topics`);

      if (allTopics.length === 0) {
        console.warn('📭 No topics found even in fallback!');
        return { topics: [], featuredTopics: [] };
      }

      // Add question counts
      const topicsWithQuestionCounts = await this.addQuestionCounts(allTopics);
      
      // For fallback, just use regular topics (no featured/breaking since they're not date-specific)
      const regularTopics = topicsWithQuestionCounts.filter(topic => 
        topic.is_featured !== true && topic.is_breaking !== true
      );

      console.log(`📦 Fallback result for ${dateKey}: ${regularTopics.length} regular topics`);

      return {
        topics: this.enhanceTopics(regularTopics),
        featuredTopics: [] // No featured topics for fallback
      };
    } catch (error) {
      console.error('Fallback fetch failed:', error);
      return { topics: [], featuredTopics: [] };
    }
  }



  // Add proper question counts by querying the questions table
  private async addQuestionCounts(topics: any[]): Promise<any[]> {
    try {
      // Get all topic IDs
      const topicIds = topics.map(topic => topic.topic_id).filter(Boolean);
      
      if (topicIds.length === 0) return topics;

      // Batch query for all topic question counts for better performance
      console.log(`🔍 Counting questions for ${topicIds.length} topics...`);

      // Try main questions table first
      const { data: questionCounts, error: mainError } = await supabase
        .from('questions')
        .select('topic_id')
        .eq('is_active', true)
        .in('topic_id', topicIds);

      let questionCountMap = new Map<string, number>();

      if (mainError) {
        console.warn('Main questions table error, trying test table:', mainError);
        // Fallback to questions_test table
        const { data: testQuestionCounts, error: testError } = await supabase
          .from('questions_test')
          .select('topic_id')
          .eq('is_active', true)
          .in('topic_id', topicIds);

        if (testError) {
          console.error('Test questions table also failed:', testError);
        } else {
          // Count questions per topic from test table
          testQuestionCounts?.forEach(q => {
            const count = questionCountMap.get(q.topic_id) || 0;
            questionCountMap.set(q.topic_id, count + 1);
          });
          console.log(`📊 Using test table - found questions for ${questionCountMap.size} topics`);
        }
      } else {
        // Count questions per topic from main table
        questionCounts?.forEach(q => {
          const count = questionCountMap.get(q.topic_id) || 0;
          questionCountMap.set(q.topic_id, count + 1);
        });
        console.log(`📊 Using main table - found questions for ${questionCountMap.size} topics`);
      }

      // Apply question counts to topics
      const topicsWithCounts = topics.map(topic => {
        const questionCount = questionCountMap.get(topic.topic_id) || 0;
        console.log(`📝 Topic "${topic.topic_title}" has ${questionCount} questions`);
        
        return {
          ...topic,
          question_count: questionCount
        };
      });

      return topicsWithCounts;

    } catch (error) {
      console.error('Error adding question counts:', error);
      return topics; // Return original topics if error occurs
    }
  }

  enhanceTopics(topics: any[]): EnhancedTopic[] {
    return topics.map((topic) => {
      return {
        ...topic,
        // Map database fields to expected interface
        id: topic.id || topic.topic_id,
        topic_id: topic.topic_id,
        title: topic.topic_title,
        topic_title: topic.topic_title,
        description: topic.description,
        emoji: topic.emoji || this.getTopicEmoji(topic),
        difficulty: this.getTopicDifficulty(topic),
        estimatedTime: this.calculateEstimatedTime(topic),
        isNew: this.isTopicNew(topic),
        isFeatured: Boolean(topic.is_featured === true),
        isBreaking: Boolean(topic.is_breaking === true),
        publishedDate: topic.created_at ? new Date(topic.created_at) : new Date(),
        categories: topic.categories ? (Array.isArray(topic.categories) ? topic.categories : [topic.categories]) : [],
        category: topic.categories ? { 
          id: Array.isArray(topic.categories) ? topic.categories[0] : topic.categories,
          name: topic.category || 'General'
        } : undefined,
        created_at: topic.created_at,
      };
    });
  }

  private getTopicEmoji(topic: any): string {
    // Use emoji from topic if available, otherwise default
    if (topic.emoji && topic.emoji !== '📚') {
      return topic.emoji;
    }
    
    const categoryEmojis: Record<string, string> = {
      'government': '🏛️',
      'economics': '💰',
      'rights': '⚖️',
      'history': '📜',
      'voting': '🗳️',
      'environment': '🌍',
      'technology': '💻',
      'education': '🎓',
    };
    const category = topic.category?.toLowerCase() || '';
    return categoryEmojis[category] || '📚';
  }

  private getTopicDifficulty(topic: any): 'easy' | 'medium' | 'hard' {
    const count = topic.question_count || 5;
    if (count <= 5) return 'easy';
    if (count <= 10) return 'medium';
    return 'hard';
  }

  private calculateEstimatedTime(topic: any): number {
    const questionCount = topic.question_count || 5;
    const difficulty = this.getTopicDifficulty(topic);
    
    // Base time: 30 seconds per question
    const baseSecondsPerQuestion = 30;
    
    // Difficulty modifiers
    const difficultyModifiers = {
      'easy': 0.8,    // 24 seconds per question (easier = faster)
      'medium': 1.0,  // 30 seconds per question (baseline)
      'hard': 1.3     // 39 seconds per question (harder = slower)
    };
    
    const modifier = difficultyModifiers[difficulty];
    const totalSeconds = questionCount * baseSecondsPerQuestion * modifier;
    const minutes = Math.ceil(totalSeconds / 60); // Round up to nearest minute
    
    console.log(`⏱️ Topic "${topic.topic_title}": ${questionCount} questions × ${baseSecondsPerQuestion}s × ${modifier} = ${minutes} min`);
    
    return minutes;
  }

  private isTopicNew(topic: any): boolean {
    if (!topic.created_at) return false;
    try {
      const createdDate = new Date(topic.created_at);
      if (isNaN(createdDate.getTime())) return false;
      const daysOld = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysOld < 7;
    } catch (error) {
      return false;
    }
  }

  isCacheValid(dateKey: string): boolean {
    const cached = this.cache[dateKey];
    return Boolean(cached && Date.now() < cached.expiresAt);
  }

  private cacheTopics(dateKey: string, topics: EnhancedTopic[], featuredTopics: EnhancedTopic[]): void {
    const now = Date.now();
    this.cache[dateKey] = {
      topics,
      featuredTopics,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION,
    };
  }

  // LRU Cache Management
  private updateAccessOrder(dateKey: string): void {
    // Remove from current position if exists
    const index = this.accessOrder.indexOf(dateKey);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    // Add to front (most recently used)
    this.accessOrder.unshift(dateKey);
  }

  private evictOldEntries(): void {
    // Only evict if we exceed max cache size
    if (this.accessOrder.length <= this.MAX_CACHE_ENTRIES) {
      return;
    }

    // Remove least recently used entries
    const toRemove = this.accessOrder.slice(this.MAX_CACHE_ENTRIES);
    toRemove.forEach(dateKey => {
      delete this.cache[dateKey];
      console.log(`🗑️ Evicted cache entry for ${dateKey}`);
    });
    
    // Update access order
    this.accessOrder = this.accessOrder.slice(0, this.MAX_CACHE_ENTRIES);
  }

  // Intelligent Prefetching
  private intelligentPrefetch(currentDate: Date): void {
    // Don't overwhelm with prefetch requests
    if (this.prefetchQueue.size > 3) {
      console.log('📦 Prefetch queue busy, skipping intelligent prefetch');
      return;
    }

    // Prefetch adjacent dates in both directions
    for (let i = 1; i <= this.PREFETCH_RADIUS; i++) {
      const previousDate = addDays(currentDate, -i);
      const nextDate = addDays(currentDate, i);
      
      this.prefetchDateIfNeeded(previousDate);
      this.prefetchDateIfNeeded(nextDate);
    }
  }

  private async prefetchDateIfNeeded(date: Date): Promise<void> {
    const dateKey = formatDateKey(date);
    
    // Skip if already cached or currently being fetched
    if (this.isCacheValid(dateKey) || this.prefetchQueue.has(dateKey)) {
      return;
    }

    // Add to prefetch queue
    this.prefetchQueue.add(dateKey);
    
    try {
      console.log(`🚀 Background prefetching ${dateKey}...`);
      const result = await this.fetchTopicsForDate(date);
      this.cacheTopics(dateKey, result.topics, result.featuredTopics);
      console.log(`✅ Background prefetch complete for ${dateKey}: ${result.topics.length + result.featuredTopics.length} topics`);
    } catch (error) {
      console.warn(`❌ Background prefetch failed for ${dateKey}:`, error);
    } finally {
      // Remove from prefetch queue
      this.prefetchQueue.delete(dateKey);
    }
  }

  // ============================================================================
  // ENHANCED PREFETCHING FOR SMOOTH NAVIGATION
  // ============================================================================

  async prefetchAdjacentDates(currentDate: Date): Promise<void> {
    // Use the new intelligent prefetch instead
    this.intelligentPrefetch(currentDate);
  }

  private async prefetchDate(date: Date): Promise<void> {
    // Delegate to the new prefetch method
    await this.prefetchDateIfNeeded(date);
  }

  // Enhanced prefetch range with intelligent queue management
  async prefetchDateRange(centerDate: Date, daysBefore: number = 2, daysAfter: number = 2): Promise<void> {
    try {
      if (!centerDate || !(centerDate instanceof Date) || isNaN(centerDate.getTime())) {
        console.warn('Invalid center date provided for range prefetching');
        return;
      }
      
      const datesToPrefetch: Date[] = [];
      
      // Add previous dates
      for (let i = 1; i <= daysBefore; i++) {
        datesToPrefetch.push(addDays(centerDate, -i) as Date);
      }
      
      // Add future dates  
      for (let i = 1; i <= daysAfter; i++) {
        datesToPrefetch.push(addDays(centerDate, i) as Date);
      }
      
      console.log(`🎯 Smart prefetching ${datesToPrefetch.length} dates around ${formatDateKey(centerDate)}`);
      
      // Use the intelligent prefetch system with queue management
      datesToPrefetch
        .filter((date): date is Date => date instanceof Date && !isNaN(date.getTime()))
        .forEach((date, index) => {
          // Stagger requests to avoid overwhelming
          setTimeout(() => {
            this.prefetchDateIfNeeded(date);
          }, index * 100); // Reduced delay for faster response
        });
      
    } catch (error) {
      console.warn('Failed to start range prefetching:', error);
    }
  }

  // Cache diagnostics for debugging
  getCacheStats(): { 
    totalEntries: number, 
    recentlyAccessed: string[], 
    pendingPrefetches: string[],
    cacheSize: string 
  } {
    const entries = Object.keys(this.cache).length;
    const pendingPrefetches = Array.from(this.prefetchQueue);
    const estimatedSize = entries * 50; // Rough estimate in KB
    
    return {
      totalEntries: entries,
      recentlyAccessed: this.accessOrder.slice(0, 5), // Last 5 accessed
      pendingPrefetches,
      cacheSize: `~${estimatedSize}KB`
    };
  }
}

const dayTopicCache = new DayAwareTopicCache();

// =============================================================================
// ENHANCED FEATURED TOPICS SECTION - MATCHING MAIN SITE DESIGN
// =============================================================================

const FeaturedTopicCard: React.FC<{
  topic: EnhancedTopic;
  onPress: () => void;
  onReadMore?: () => void;
  isCompleted?: boolean;
  isFeatured?: boolean;
}> = ({ topic, onPress, onReadMore, isCompleted, isFeatured = false }) => {
  const { theme } = useTheme();
  
  // Animated glow effect for featured content - breathing effect without CLS
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const glowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (topic.isBreaking || topic.isFeatured) {
      // Very gentle breathing animation with softer transitions
      const breathingAnimation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(glowOpacity, {
              toValue: 0.4, // Much softer peak opacity
              duration: 3000, // Slower, more gentle
              easing: Easing.bezier(0.4, 0.0, 0.6, 1.0), // Softer easing curve
              useNativeDriver: true,
            }),
            Animated.timing(glowScale, {
              toValue: 1.008, // Very subtle scale change
              duration: 3000,
              easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(glowOpacity, {
              toValue: 0.15, // Softer minimum opacity
              duration: 3000,
              easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
              useNativeDriver: true,
            }),
            Animated.timing(glowScale, {
              toValue: 1,
              duration: 3000,
              easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      breathingAnimation.start();
      return () => breathingAnimation.stop();
    }
  }, [glowOpacity, glowScale, topic.isBreaking, topic.isFeatured]);

  const getBadgeInfo = () => {
    if (topic.isBreaking) {
      return { 
        text: 'BREAKING', 
        color: '#DC2626', 
        bgColor: '#DC2626',
        glowColor: '#DC2626' // Destructive red for breaking
      };
    }
    if (topic.isFeatured) {
      return { 
        text: 'FEATURED', 
        color: theme.primary, 
        bgColor: theme.primary,
        glowColor: theme.primary // Primary color for featured
      };
    }
    return null;
  };

  const badgeInfo = getBadgeInfo();

  // Create a very subtle background for featured content
  const getBackgroundStyle = () => {
    if (badgeInfo && (topic.isBreaking || topic.isFeatured)) {
      // Create a very subtle tinted background by blending the theme color with glow color
      return {
        backgroundColor: theme.card, // Base card color
      };
    }
    return { backgroundColor: theme.card };
  };

  return (
    <Animated.View style={[
      isFeatured ? styles.featuredMainCard : styles.regularTopicCard,
      {
        ...getBackgroundStyle(),
        borderColor: badgeInfo ? badgeInfo.glowColor + '15' : theme.border, // Very subtle border tint
        shadowColor: badgeInfo ? badgeInfo.glowColor : theme.foreground,
        shadowOpacity: badgeInfo ? 0.04 : 0.02, // Even more subtle shadow
        shadowRadius: isFeatured ? 4 : 2, // Smaller shadow radius
        shadowOffset: { width: 0, height: isFeatured ? 1 : 0.5 }, // Minimal shadow offset
        elevation: topic.isBreaking || topic.isFeatured ? 2 : 1, // Reduced elevation
        transform: [{ scale: glowScale }],
      },
    ]}>
      {/* Very subtle gradient overlay for featured content */}
      {(topic.isBreaking || topic.isFeatured) && badgeInfo && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: isFeatured ? 24 : 24,
              opacity: glowOpacity,
              pointerEvents: 'none',
              backgroundColor: `${badgeInfo.glowColor}03`, // Extremely subtle background tint
            },
          ]}
        />
      )}
      
      {/* Animated glow border for featured/breaking content */}
      {(topic.isBreaking || topic.isFeatured) && badgeInfo && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: isFeatured ? 24 : 24,
              borderWidth: 0.5, // Thin border
              borderColor: badgeInfo.glowColor + '40', // More visible border
              opacity: glowOpacity,
              pointerEvents: 'none',
            },
          ]}
        />
      )}
      
      {/* Card content */}
      <TouchableOpacity onPress={onPress} style={styles.featuredCardContent} activeOpacity={0.8}>
        {/* Topic icon/image area */}
        <View style={isFeatured ? styles.featuredTopicImageContainer : styles.regularTopicImageContainer}>
          <View style={[
            isFeatured ? styles.featuredTopicIcon : styles.regularTopicIcon, 
            { backgroundColor: theme.primary + '08' } // Reduced from '15' to '08' for more subtle background
          ]}>
            <Text style={isFeatured ? styles.featuredTopicIconText : styles.regularTopicIconText}>
              {topic.emoji || '📰'}
            </Text>
          </View>
        </View>

        {/* Content area */}
        <View style={styles.featuredContentArea}>
          {/* Completion status in top right */}
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            </View>
          )}

          {/* Main headline */}
          <Text style={[
            isFeatured ? styles.featuredMainHeadline : styles.regularTopicHeadline, 
            { color: theme.foreground }
          ]}>
            {String(topic.title || topic.topic_title || '')}
          </Text>

          {/* Badge and Category tags container */}
          <View style={styles.featuredTagsContainer}>
            {badgeInfo && (
              <View style={[styles.featuredBadgeInline, { backgroundColor: badgeInfo.bgColor }]}>
                <Text style={styles.featuredBadgeInlineText}>{badgeInfo.text}</Text>
              </View>
            )}
            {topic.categories && topic.categories.slice(0, 2).map((category, index) => {
              // Ensure category is a string to prevent bridge errors
              const categoryText = typeof category === 'string' ? category : 
                                 typeof category === 'object' && category !== null ? 
                                 ((category as any).name || (category as any).title || String(category)) : 
                                 String(category);
              
              return (
                <View key={index} style={[styles.featuredTag, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '20' }]}>
                  <Text style={[styles.featuredTagText, { color: theme.primary }]}>
                    {categoryText}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Description */}
          {topic.description && (
            <Text style={[
              isFeatured ? styles.featuredDescription : styles.regularTopicDescription, 
              { color: theme.foregroundSecondary }
            ]}>
              {truncateDescription(topic.description)}
            </Text>
          )}

          {/* Action buttons */}
          <View style={styles.featuredActionButtonsContainer}>
                          <TouchableOpacity
                onPress={onPress}
                style={[styles.featuredActionButton, styles.featuredActionButtonPrimary, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <Text style={styles.featuredActionButtonText}>Start Review</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            
            {onReadMore && (
              <TouchableOpacity
                onPress={onReadMore}
                style={[styles.featuredActionButton, styles.featuredActionButtonSecondary, { borderColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.featuredActionButtonSecondaryText, { color: theme.primary }]}>Read More</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const FeaturedTopicsSection: React.FC<{
  topics: EnhancedTopic[];
  onTopicPress: (topic: EnhancedTopic) => void;
  onTopicReadMore: (topic: EnhancedTopic) => void;
  onTopicShare: (topic: EnhancedTopic) => void;
  userProgress: any[];
}> = ({ topics, onTopicPress, onTopicReadMore, onTopicShare, userProgress }) => {
  const { theme } = useTheme();
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  
  const featuredTopics = topics.filter(topic => topic.isFeatured || topic.isBreaking);
  
  if (featuredTopics.length === 0) {
    return (
      <View style={styles.featuredSection}>
        {/* Simple empty state without date navigation */}
        <View style={styles.featuredCardContainer}>
          <View style={[styles.featuredMainCard, styles.featuredEmptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.featuredEmptyState}>
              <Ionicons name="newspaper-outline" size={48} color={theme.foregroundSecondary + '40'} />
              <Text style={[styles.featuredEmptyTitle, { color: theme.foreground }]}>
                No featured topics today
              </Text>
              <Text style={[styles.featuredEmptyDescription, { color: theme.foregroundSecondary }]}>
                Check back later for breaking news and featured content
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const currentTopic = featuredTopics[currentFeaturedIndex];

  if (!currentTopic) {
    return null;
  }

  return (
    <View style={styles.featuredSection}>
      {/* Featured card without date navigation */}
      <View style={styles.featuredCardContainer}>
        <FeaturedTopicCard
          topic={currentTopic}
          onPress={() => onTopicPress(currentTopic)}
          onReadMore={() => onTopicReadMore(currentTopic)}
          isCompleted={userProgress.some(p => 
            p.topic_id === (currentTopic.topic_id || currentTopic.id) && p.is_completed
          )}
          isFeatured={true}
        />

        {/* Pagination dots if multiple featured topics */}
        {featuredTopics.length > 1 && (
          <View style={styles.featuredPagination}>
            {featuredTopics.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentFeaturedIndex(index)}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor: index === currentFeaturedIndex ? theme.primary : theme.border,
                    width: index === currentFeaturedIndex ? 24 : 8,
                  }
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// =============================================================================
// UNIFIED SWIPABLE TOPICS CAROUSEL - ALL TOPICS IN ONE EXPERIENCE
// =============================================================================

const UnifiedTopicsCarousel: React.FC<{
  featuredTopics: EnhancedTopic[];
  regularTopics: EnhancedTopic[];
  onTopicPress: (topic: EnhancedTopic) => void;
  onTopicReadMore: (topic: EnhancedTopic) => void;
  userProgress: any[];
}> = ({ featuredTopics, regularTopics, onTopicPress, onTopicReadMore, userProgress }) => {
  const { theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Combine all topics with featured first
  const allTopics = [...featuredTopics, ...regularTopics];
  
  if (allTopics.length === 0) {
    return null; // Empty state handled by parent component
  }

  // Calculate proper dimensions for centering
  const cardWidth = SCREEN_WIDTH * 0.88;
  const cardSpacing = spacing.md; // 16px
  const sidePadding = (SCREEN_WIDTH - cardWidth) / 2; // Center the first card
  
  // Snap interval should be card width + spacing between cards
  const snapInterval = cardWidth + cardSpacing;

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    // Account for initial padding when calculating index
    const adjustedPosition = scrollPosition + sidePadding;
    const index = Math.round(adjustedPosition / snapInterval);
    setCurrentIndex(Math.max(0, Math.min(index, allTopics.length - 1)));
  };

  return (
    <View style={styles.unifiedCarouselContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: sidePadding,
          paddingRight: sidePadding,
          alignItems: 'center',
        }}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        pagingEnabled={false}
        contentInsetAdjustmentBehavior="never"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {allTopics.map((topic, index) => {
          const isFeatured = featuredTopics.some(ft => ft.id === topic.id || ft.topic_id === topic.topic_id);
          const isCompleted = userProgress.some(p => 
            p.topic_id === (topic.topic_id || topic.id) && p.is_completed
          );
          
          return (
            <View 
              key={topic.id || topic.topic_id} 
              style={[
                styles.unifiedTopicCardWrapper,
                { 
                  width: cardWidth,
                  marginRight: index < allTopics.length - 1 ? cardSpacing : 0 
                }
              ]}
            >
              <FeaturedTopicCard
                topic={topic}
                onPress={() => onTopicPress(topic)}
                onReadMore={() => onTopicReadMore(topic)}
                isCompleted={isCompleted}
                isFeatured={isFeatured}
              />
            </View>
          );
        })}
      </ScrollView>
      
      {/* Smart pagination indicator */}
      {allTopics.length > 1 && (
        <View style={styles.unifiedPagination}>
          {allTopics.length <= 5 ? (
            // Show all dots for 5 or fewer items
            allTopics.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor: index === currentIndex ? theme.primary : theme.border,
                    width: index === currentIndex ? 24 : 8,
                  }
                ]}
              />
            ))
          ) : (
            // For more than 5 items, show clean text indicator
            <View style={styles.paginationTextContainer}>
              <Text style={[styles.paginationText, { color: theme.foregroundSecondary }]}>
                {currentIndex + 1} of {allTopics.length}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// =============================================================================
// LEGACY FEATURED CAROUSEL (KEEP FOR FALLBACK)
// =============================================================================

const FeaturedTopicsCarousel: React.FC<{
  topics: EnhancedTopic[];
  onTopicPress: (topic: EnhancedTopic) => void;
  userProgress: any[];
}> = ({ topics, onTopicPress, userProgress }) => {
  const { theme } = useTheme();

  const featuredTopics = topics.filter(topic => topic.isFeatured || topic.isBreaking);
  
  if (featuredTopics.length === 0) {
    return null;
  }

  return (
    <View style={styles.legacyFeaturedSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuredScrollContent}
        snapToInterval={FEATURED_CARD_WIDTH + spacing.md}
        decelerationRate="fast"
        contentInsetAdjustmentBehavior="never"
      >
        {featuredTopics.map((topic) => (
          <TouchableOpacity
            key={topic.id || topic.topic_id}
            onPress={() => onTopicPress(topic)}
            activeOpacity={0.6}
          >
            <View
              style={[
                styles.legacyFeaturedCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.featuredCardContent}>
                <View style={styles.featuredCardHeader}>
                  {topic.isBreaking && (
                    <View style={[styles.featuredBadge, { backgroundColor: '#DC2626' }]}>
                      <Text style={styles.featuredBadgeText}>BREAKING</Text>
                    </View>
                  )}
                  {topic.isFeatured && !topic.isBreaking && (
                    <View style={[styles.featuredBadge, { backgroundColor: '#2563EB' }]}>
                      <Text style={styles.featuredBadgeText}>FEATURED</Text>
                    </View>
                  )}
                </View>

                <View style={styles.featuredCardMain}>
                  <Text style={styles.featuredCardEmoji}>{topic.emoji || '📚'}</Text>
                  <View style={styles.featuredCardText}>
                    <Text style={[styles.featuredCardTitle, { color: theme.foreground }]}>
                      {topic.title || topic.topic_title}
                    </Text>
                    {topic.description && (
                      <Text style={[styles.featuredCardDescription, { color: theme.foregroundSecondary }]} numberOfLines={2}>
                        {truncateDescription(topic.description)}
                      </Text>
                    )}
                    <Text style={[styles.featuredCardTime, { color: theme.foregroundSecondary }]}>
                      {topic.estimatedTime || 5} min
                    </Text>
                  </View>
                </View>

                <View style={styles.featuredCardArrow}>
                  <Ionicons 
                    name="chevron-forward" 
                    size={16} 
                    color={theme.foregroundSecondary + '40'} 
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// =============================================================================
// CLEAN, MINIMAL COMPONENTS
// =============================================================================

// Ultra-minimal topic card - clean like catch-up cards
const TopicCard: React.FC<{
  topic: EnhancedTopic;
  onPress: () => void;
  isCompleted?: boolean;
}> = ({ topic, onPress, isCompleted }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.minimalTopicCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      activeOpacity={0.6}
    >
      <View style={styles.minimalCardContent}>
        <View style={styles.minimalCardMain}>
          <Text style={styles.minimalCardEmoji}>{topic.emoji || '📚'}</Text>
          <View style={styles.minimalCardText}>
            <Text style={[styles.minimalCardTitle, { color: theme.foreground }]}>
              {topic.title || topic.topic_title}
            </Text>
            <Text style={[styles.minimalCardTime, { color: theme.foregroundSecondary }]}>
              {topic.estimatedTime || 5} min
            </Text>
          </View>
        </View>

        <View style={styles.minimalCardEnd}>
          {isCompleted && (
            <Ionicons name="checkmark-circle-outline" size={18} color="#34C759" style={styles.minimalCardCheck} />
          )}
          <Ionicons 
            name="chevron-forward" 
            size={14} 
            color={theme.foregroundSecondary + '40'} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// ANIMATED TOPIC CARDS WITH STAGGERED ENTRY ANIMATIONS
// ============================================================================

// Animated topic card wrapper with entrance animation
const AnimatedTopicCard: React.FC<{
  children: React.ReactNode;
  index: number;
  delay?: number;
}> = ({ children, index, delay = 0 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const animationDelay = delay + (index * 80); // Staggered entrance
    
    Animated.parallel([
      Animated.timing(opacity, createAnimationTiming({
        toValue: 1,
        duration: 400,
        delay: animationDelay,
        easing: Easing.out(Easing.cubic),
      })),
      Animated.spring(translateY, createSpringAnimation({
        toValue: 0,
        delay: animationDelay,
        tension: 100,
        friction: 8,
      })),
      Animated.spring(scale, createSpringAnimation({
        toValue: 1,
        delay: animationDelay,
        tension: 100,
        friction: 8,
      })),
    ]).start();
  }, [index, delay, opacity, translateY, scale]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [
          { translateY },
          { scale }
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

// Ultra-minimal daily topic card - same styling as regular topics
const SimpleDailyTopicCard: React.FC<{
  topic: EnhancedTopic;
  onPress: () => void;
  isCompleted?: boolean;
}> = ({ topic, onPress, isCompleted }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.minimalTopicCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      activeOpacity={0.6}
    >
      <View style={styles.minimalCardContent}>
        <View style={styles.minimalCardMain}>
          <Text style={styles.minimalCardEmoji}>{topic.emoji || '📚'}</Text>
          <View style={styles.minimalCardText}>
            <Text style={[styles.minimalCardTitle, { color: theme.foreground }]}>
              {topic.title || topic.topic_title}
            </Text>
            <Text style={[styles.minimalCardTime, { color: theme.foregroundSecondary }]}>
              {topic.estimatedTime || 5} min
            </Text>
          </View>
        </View>

        <View style={styles.minimalCardEnd}>
          {isCompleted && (
            <Ionicons name="checkmark-circle-outline" size={18} color="#34C759" style={styles.minimalCardCheck} />
          )}
          <Ionicons 
            name="chevron-forward" 
            size={14} 
            color={theme.foregroundSecondary + '40'} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Minimal skeleton loading components
const TopicCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, createAnimationTiming({
          toValue: 0.7,
          duration: 1200,
        })),
        Animated.timing(opacity, createAnimationTiming({
          toValue: 0.4,
          duration: 1200,
        })),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View 
      style={[
        styles.minimalTopicCard, 
        { backgroundColor: theme.card, borderColor: theme.border, opacity }
      ]}
    >
      <View style={styles.minimalCardContent}>
        <View style={styles.minimalCardMain}>
          <View style={[styles.skeletonLine, { backgroundColor: theme.border, width: 24, height: 24, borderRadius: 12 }]} />
          <View style={styles.minimalCardText}>
            <View style={[styles.skeletonLine, { backgroundColor: theme.border, width: '80%', height: 16, marginBottom: 4, borderRadius: 6 }]} />
            <View style={[styles.skeletonLine, { backgroundColor: theme.border, width: '35%', height: 14, borderRadius: 4 }]} />
          </View>
        </View>
        <View style={[styles.skeletonLine, { backgroundColor: theme.border, width: 14, height: 14, borderRadius: 7 }]} />
      </View>
    </Animated.View>
  );
};

const SimpleDailyTopicCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, createAnimationTiming({
          toValue: 0.7,
          duration: 1200,
        })),
        Animated.timing(opacity, createAnimationTiming({
          toValue: 0.4,
          duration: 1200,
        })),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View 
      style={[
        styles.minimalTopicCard, 
        { backgroundColor: theme.card, borderColor: theme.border, opacity }
      ]}
    >
      <View style={styles.minimalCardContent}>
        <View style={styles.minimalCardMain}>
          <View style={[styles.skeletonLine, { backgroundColor: theme.border, width: 24, height: 24, borderRadius: 12 }]} />
          <View style={styles.minimalCardText}>
            <View style={[styles.skeletonLine, { backgroundColor: theme.border, width: '70%', height: 16, marginBottom: 4, borderRadius: 6 }]} />
            <View style={[styles.skeletonLine, { backgroundColor: theme.border, width: '35%', height: 14, borderRadius: 4 }]} />
          </View>
        </View>
        <View style={[styles.skeletonLine, { backgroundColor: theme.border, width: 14, height: 14, borderRadius: 7 }]} />
      </View>
    </Animated.View>
  );
};

// Simple category pills
const CategoryPills: React.FC<{
  categories: StandardCategory[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}> = ({ categories, selectedCategory, onSelectCategory }) => {
  const { theme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryScrollContent}
    >
      <TouchableOpacity
        onPress={() => onSelectCategory(null)}
        style={[
          styles.categoryPill,
          { 
            backgroundColor: !selectedCategory ? theme.primary : theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[
          styles.categoryPillText,
          { color: !selectedCategory ? '#FFFFFF' : theme.foregroundSecondary },
        ]}>
          All Topics
        </Text>
      </TouchableOpacity>

      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          onPress={() => onSelectCategory(category.id)}
          style={[
            styles.categoryPill,
            { 
              backgroundColor: selectedCategory === category.id ? theme.primary : theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={styles.categoryEmoji}>{category.emoji || '📚'}</Text>
          <Text style={[
            styles.categoryPillText,
            { color: selectedCategory === category.id ? '#FFFFFF' : theme.foregroundSecondary },
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// =============================================================================
// DAILY CHALLENGE SYSTEM
// =============================================================================

interface DailyChallenge {
  date: string; // YYYY-MM-DD format
  totalTopics: number;
  completedTopics: number;
  isCompleted: boolean;
  completedAt?: string | undefined;
}

interface DailyChallengeStats {
  currentStreak: number;
  longestStreak: number;
  totalChallengesCompleted: number;
  lastCompletedDate?: string | undefined;
  isStreakBroken: boolean;
}

class DailyChallengeTracker {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Calculate daily challenge status for a specific date
  async getDailyChallengeForDate(date: Date, topics: EnhancedTopic[], userProgress: any[]): Promise<DailyChallenge> {
    const dateKey = formatDateKey(date);
    
    // Get all topics for this date
    const dayTopics = topics.filter(topic => !topic.isFeatured && !topic.isBreaking);
    const totalTopics = dayTopics.length;
    
    // Count completed topics for this date
    const completedTopics = dayTopics.filter(topic => {
      return userProgress.some(progress => {
        const progressDate = formatDateKey(new Date(progress.completed_at || progress.created_at));
        return progressDate === dateKey && 
               progress.topic_id === (topic.topic_id || topic.id) && 
               progress.is_completed;
      });
    }).length;

    const isCompleted = totalTopics > 0 && completedTopics === totalTopics;
    
    // Find completion timestamp if completed
    let completedAt: string | undefined;
    if (isCompleted) {
      const completionTimes = userProgress
        .filter(progress => {
          const progressDate = formatDateKey(new Date(progress.completed_at || progress.created_at));
          return progressDate === dateKey && progress.is_completed;
        })
        .map(progress => new Date(progress.completed_at || progress.created_at).getTime())
        .sort((a, b) => b - a); // Latest first
      
      if (completionTimes.length > 0 && completionTimes[0] !== undefined) {
        completedAt = new Date(completionTimes[0]).toISOString();
      }
    }

    return {
      date: dateKey,
      totalTopics,
      completedTopics,
      isCompleted,
      completedAt,
    };
  }

  // Calculate current streak and stats
  async calculateStreakStats(userProgress: any[]): Promise<DailyChallengeStats> {
    const today = new Date();
    const todayKey = formatDateKey(today);
    
    // Group progress by date and check daily completion
    const dailyCompletions = new Map<string, boolean>();
    const dailyTopicCounts = new Map<string, { total: number, completed: number }>();
    
    // Get all unique dates from progress
    const progressDates = Array.from(new Set(userProgress.map(p => 
      formatDateKey(new Date(p.completed_at || p.created_at))
    ))).sort();
    
    // For each date, check if all topics were completed
    for (const dateKey of progressDates) {
      const dateProgress = userProgress.filter(p => {
        const progressDate = formatDateKey(new Date(p.completed_at || p.created_at));
        return progressDate === dateKey && p.is_completed;
      });
      
      // For now, consider a day complete if they completed at least 3 topics
      // In a real implementation, you'd check against the actual topics available for that day
      const completedTopicsForDay = dateProgress.length;
      const isCompleted = completedTopicsForDay >= 3; // Minimum completion threshold
      
      dailyCompletions.set(dateKey, isCompleted);
      dailyTopicCounts.set(dateKey, { 
        total: completedTopicsForDay >= 3 ? completedTopicsForDay : 3, // Estimate total
        completed: completedTopicsForDay 
      });
    }

    // Calculate current streak (consecutive days ending today or yesterday)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastCompletedDate: string | undefined;
    let totalChallengesCompleted = 0;
    
    // Check if today is completed
    const todayCompleted = dailyCompletions.get(todayKey) || false;
    if (todayCompleted) {
      lastCompletedDate = todayKey;
    }
    
    // Calculate streaks by going backwards from today
    let checkDate = new Date(today);
    let foundIncompleteDay = false;
    let streakStarted = false;
    
    // Check the last 30 days for current streak calculation
    for (let i = 0; i < 30; i++) {
      const checkDateKey = formatDateKey(checkDate);
      const dayCompleted = dailyCompletions.get(checkDateKey) || false;
      
      if (dayCompleted) {
        if (!foundIncompleteDay) {
          currentStreak++;
          streakStarted = true;
        }
        tempStreak++;
        totalChallengesCompleted++;
        
        if (!lastCompletedDate) {
          lastCompletedDate = checkDateKey;
        }
      } else {
        // If we haven't started counting streak yet, and this is today or yesterday, break
        if (!streakStarted && (i === 0 || i === 1)) {
          foundIncompleteDay = true;
        }
        
        // Update longest streak if current temp streak is longer
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 0;
        
        // Stop counting current streak once we hit an incomplete day
        if (streakStarted) {
          foundIncompleteDay = true;
        }
      }
      
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Final check for longest streak
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    // Check if streak is broken (no completion today and yesterday)
    const yesterdayKey = formatDateKey(addDays(today, -1));
    const yesterdayCompleted = dailyCompletions.get(yesterdayKey) || false;
    const isStreakBroken = !todayCompleted && !yesterdayCompleted && currentStreak === 0;

    return {
      currentStreak,
      longestStreak,
      totalChallengesCompleted,
      lastCompletedDate,
      isStreakBroken,
    };
  }
}

// =============================================================================
// ENHANCED DAILY PROGRESS CARD WITH PROPER CHALLENGE TRACKING
// =============================================================================

// Enhanced daily progress card with proper daily challenge logic
const DailyProgressCard: React.FC<{
  onStart: () => void;
  selectedDate: Date;
  dailyChallenge: DailyChallenge;
  streakStats: DailyChallengeStats;
  onShare?: () => void;
}> = React.memo(({ onStart, selectedDate, dailyChallenge, streakStats, onShare }) => {
  const { theme } = useTheme();
  const isSelectedDateToday = isToday(selectedDate);

  // Only show for today - remove daily archive
  if (!isSelectedDateToday) {
    return null;
  }

  const progressPercentage = dailyChallenge.totalTopics > 0 
    ? Math.round((dailyChallenge.completedTopics / dailyChallenge.totalTopics) * 100)
    : 0;

  return (
    <Card style={styles.dailyCard} variant="outlined">
      <TouchableOpacity onPress={onStart} style={styles.dailyCardContent}>
        <View style={styles.dailyCardInfo}>
          <Text style={[styles.dailyCardTitle, { color: theme.foreground }]}>
            Daily Challenge ({dailyChallenge.completedTopics} of {dailyChallenge.totalTopics})
          </Text>
          
          <View style={styles.progressContainer}>
            {/* Progress Dots */}
            <View style={styles.progressDotsContainer}>
              {Array.from({ length: dailyChallenge.totalTopics }, (_, index) => {
                // Calculate larger dot size to accommodate checkmarks
                const maxDots = 15; // Reduced max to keep dots large enough for checkmarks
                const dotSize = dailyChallenge.totalTopics > maxDots 
                  ? Math.max(16, 20 - Math.floor((dailyChallenge.totalTopics - maxDots) / 2)) 
                  : dailyChallenge.totalTopics > 10 
                    ? 18 
                    : 20;
                
                const isCompleted = index < dailyChallenge.completedTopics;
                
                return (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      {
                        width: dotSize,
                        height: dotSize,
                        borderRadius: dotSize / 2,
                        backgroundColor: isCompleted 
                          ? (dailyChallenge.isCompleted ? '#10B981' : theme.primary)
                          : 'transparent',
                        borderColor: isCompleted 
                          ? (dailyChallenge.isCompleted ? '#10B981' : theme.primary)
                          : theme.border,
                        borderWidth: isCompleted ? 0 : 1.5,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }
                    ]}
                  >
                    {isCompleted && (
                      <Ionicons 
                        name="checkmark" 
                        size={Math.max(8, dotSize * 0.5)} 
                        color="#FFFFFF" 
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {streakStats.currentStreak > 0 && (
          <View style={styles.streakContainer}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={[styles.streakText, { color: theme.foreground }]}>
              {streakStats.currentStreak}
            </Text>
            <Text style={[styles.streakLabel, { color: theme.foregroundSecondary }]}>
              day{streakStats.currentStreak === 1 ? '' : 's'}
            </Text>
            {onShare && streakStats.currentStreak >= 3 && (
              <TouchableOpacity
                onPress={onShare}
                style={[styles.shareStreakButton, { borderColor: theme.primary }]}
                activeOpacity={0.7}
              >
                <Ionicons name="share-outline" size={16} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );
});

// =============================================================================
// =============================================================================

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user, profile, loading: authContextLoading } = useAuth();
  const router = useRouter();
  const { uiStrings } = useUIStrings();

  // Early return if uiStrings is not ready to prevent crashes
  if (!uiStrings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Translation system state
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [targetLanguageName, setTargetLanguageName] = useState('');
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);
  
  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [categories, setCategories] = useState<StandardCategory[]>([]);
  const [topics, setTopics] = useState<EnhancedTopic[]>([]);
  const [featuredTopics, setFeaturedTopics] = useState<EnhancedTopic[]>([]); // Separate featured topics
  const [filteredTopics, setFilteredTopics] = useState<EnhancedTopic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation states for smooth day navigation
  const [dateTransitioning, setDateTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('right');
  const [showSmoothTransition, setShowSmoothTransition] = useState(false);
  const [transitionContent, setTransitionContent] = useState<string>('');
  
  // Loading timeout state
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Catch-up content state
  const [incompleteAssessments, setIncompleteAssessments] = useState<AssessmentProgress[]>([]);
  const [hasCatchUpContent, setHasCatchUpContent] = useState(false);
  

  
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge>({
    date: formatDateKey(new Date()),
    totalTopics: 0,
    completedTopics: 0,
    isCompleted: false,
  });
  const [streakStats, setStreakStats] = useState<DailyChallengeStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalChallengesCompleted: 0,
    isStreakBroken: false,
  });

  // Guest user progress tracking
  const [guestToken, setGuestToken] = useState<string | null>(null);

  // Performance monitoring
  const screenTimer = useRef(enhancedPerformanceMonitor.createTimer('HomeScreen_render'));
  
  // Animation refs for smooth microanimations
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateX = useRef(new Animated.Value(0)).current;
  const topicsListOpacity = useRef(new Animated.Value(1)).current;
  const topicsListTranslateY = useRef(new Animated.Value(0)).current;
  const navigationProgress = useRef(new Animated.Value(0)).current;
  
  // Smooth transition overlay animations
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const transitionScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Global listener for auth state changes to catch session invalidation
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only log significant auth events, not every state change
        if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
          console.log(`[HOME] Auth event: ${event}`);
        }
        
        // If the session is invalid or the user is signed out, force a refresh.
        if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
          if (user) {
            // This will trigger the `useAuth` hook to update and re-run dependent effects.
            router.replace('/'); 
          }
        } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
            loadData(true); // Force a refresh of data with the new token
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    loadData();
    initializeGuestTracking();
  }, [user?.id]);

  // Initialize guest tracking for non-authenticated users
  const initializeGuestTracking = async () => {
    if (!user?.id) {
      try {
        const token = await GuestTokenService.getOrCreateGuestToken();
        setGuestToken(token);
        console.log('🎫 Guest tracking initialized:', token.substring(0, 15) + '...');
      } catch (error) {
        console.error('❌ Failed to initialize guest tracking:', error);
      }
    } else {
      // Clear guest token when user is authenticated
      setGuestToken(null);
    }
  };

  const loadData = async (forceRefresh = false) => {
    const timer = enhancedPerformanceMonitor.createTimer('HomeScreen_loadData');
    
    try {
      setLoading(true);
      setError(null);

      const [categoriesResponse, dayTopicsResult, progressResponse] = await Promise.all([
        fetchCategories({ useCache: !forceRefresh }),
        dayTopicCache.getTopicsForDate(selectedDate, forceRefresh), // Date-specific topics with featured separation
        user?.id ? fetchUserProgress(user.id, { useCache: !forceRefresh }) : 
                   Promise.resolve({ data: [], error: null } as StandardResponse<any[]>)
      ]);

      if (categoriesResponse.error) throw new Error(categoriesResponse.error.message);

      const { topics: dayTopics, featuredTopics: featured } = dayTopicsResult;
      
      // Debug logging to confirm proper separation
      console.log('📊 Topic Separation Summary:');
      console.log(`- Regular topics for date: ${dayTopics.length}`);
      console.log(`- Featured/Breaking topics for date: ${featured.length}`);
      console.log(`- Selected date: ${formatDateKey(selectedDate)}`);
      
      // Set topics organized by date
      setCategories(categoriesResponse.data || []);
      setTopics(dayTopics); // Date-specific regular topics
      setFeaturedTopics(featured); // Date-specific featured/breaking topics
      setFilteredTopics(dayTopics);
      setUserProgress(progressResponse.data || []);

      await calculateDailyStats(progressResponse.data || [], selectedDate, dayTopics);

      // Load catch-up content for logged-in users
      if (user?.id) {
        await loadCatchUpContent();
      }

      timer.end({ 
        categoriesCount: (categoriesResponse.data || []).length,
        topicsCount: dayTopics.length,
        featuredTopicsCount: featured.length,
        userProgressCount: (progressResponse.data || []).length,
        selectedDate: formatDateKey(selectedDate)
      });

      // Start intelligent prefetching after initial load for smoother navigation
      setTimeout(() => {
        console.log('🚀 Starting intelligent prefetching for smooth swipe navigation...');
        dayTopicCache.prefetchAdjacentDates(selectedDate);
      }, 1000); // Delay to let initial rendering complete

    } catch (error) {
      console.error('Error loading home screen data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      timer.end({ error: true });
    } finally {
      setLoading(false);
    }
  };



  const refreshData = async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    try {
      await loadData(true); // Force refresh
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================================================
  // SOPHISTICATED MICROANIMATIONS FOR SMOOTH DAY NAVIGATION
  // ============================================================================

  const createSmoothTransition = (
    direction: 'left' | 'right',
    onComplete?: () => void
  ) => {
    const slideDistance = SCREEN_WIDTH * 0.3; // Subtle slide effect
    const slideDirection = direction === 'left' ? -slideDistance : slideDistance;
    
    // Phase 1: Slide out current content
    Animated.parallel([
      Animated.timing(contentOpacity, createAnimationTiming({
        toValue: 0.3,
        duration: 200,
        easing: Easing.out(Easing.cubic),
      })),
      Animated.timing(contentTranslateX, createAnimationTiming({
        toValue: slideDirection * 0.5, // Subtle movement
        duration: 200,
        easing: Easing.out(Easing.cubic),
      })),
      Animated.timing(topicsListOpacity, createAnimationTiming({
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.quad),
      })),
      Animated.timing(topicsListTranslateY, createAnimationTiming({
        toValue: 20,
        duration: 150,
        easing: Easing.out(Easing.quad),
      })),
    ]).start(() => {
      // Phase 2: Load new content and slide in
      if (onComplete) onComplete();
      
      // Reset positions for slide in
      contentTranslateX.setValue(-slideDirection * 0.5);
      topicsListTranslateY.setValue(-15);
      
      // Phase 3: Slide in new content with spring animation
      Animated.parallel([
        Animated.spring(contentOpacity, createSpringAnimation({
          toValue: 1,
          tension: 100,
          friction: 8,
        })),
        Animated.spring(contentTranslateX, createSpringAnimation({
          toValue: 0,
          tension: 100,
          friction: 8,
        })),
        Animated.spring(topicsListOpacity, createSpringAnimation({
          toValue: 1,
          tension: 120,
          friction: 9,
        })),
        Animated.spring(topicsListTranslateY, createSpringAnimation({
          toValue: 0,
          tension: 120,
          friction: 9,
        })),
      ]).start();
    });
  };

  const createLoadingPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(navigationProgress, createAnimationTiming({
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
        })),
        Animated.timing(navigationProgress, createAnimationTiming({
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
        })),
      ])
    ).start();
  };

  // Smooth transition overlay functions
  const showSmoothLoadingOverlay = (targetDateText: string) => {
    setTransitionContent(targetDateText);
    setShowSmoothTransition(true);
    
    // Reset animation values
    transitionOpacity.setValue(0);
    transitionScale.setValue(0.95);
    
    // Animate in
    Animated.parallel([
      Animated.timing(transitionOpacity, createAnimationTiming({
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
      })),
      Animated.spring(transitionScale, createSpringAnimation({
        toValue: 1,
        tension: 100,
        friction: 8,
      })),
    ]).start();

    // Start loading pulse animation for progress bar
    createLoadingPulse();
  };

  const hideSmoothLoadingOverlay = () => {
    Animated.parallel([
      Animated.timing(transitionOpacity, createAnimationTiming({
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
      })),
      Animated.timing(transitionScale, createAnimationTiming({
        toValue: 0.95,
        duration: 200,
        easing: Easing.in(Easing.cubic),
      })),
    ]).start(() => {
      setShowSmoothTransition(false);
      setTransitionContent('');
    });
  };

  const calculateDailyStats = async (progress: any[], selectedDate: Date, topics: EnhancedTopic[]) => {
    if (!user?.id) return;
    
    const tracker = new DailyChallengeTracker(user.id);
    
    // Calculate daily challenge for selected date (only regular topics)
    const challenge = await tracker.getDailyChallengeForDate(selectedDate, topics, progress);
    setDailyChallenge(challenge);
    
    // Calculate streak stats (only for today)
    if (isToday(selectedDate)) {
      const stats = await tracker.calculateStreakStats(progress);
      setStreakStats(stats);
    }
  };

  // Helper functions for loading timeout management
  const startLoadingTimeout = useCallback(() => {
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    setIsLoadingTopics(true);
    setLoadingTimedOut(false);
    
    // Set 5-second timeout
    loadingTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Loading timeout reached - showing empty state');
      setIsLoadingTopics(false);
      setLoadingTimedOut(true);
    }, 5000);
  }, []);

  const clearLoadingTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    setIsLoadingTopics(false);
    setLoadingTimedOut(false);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Load catch-up content (incomplete assessments, saved items)
  const loadCatchUpContent = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 Loading catch-up content...');
      
      // Load incomplete assessments
      const assessments = await EnhancedAssessmentProgressStorage.getIncompleteAssessments(user.id);
      console.log(`📊 Found ${assessments.length} incomplete assessments`);
      
      setIncompleteAssessments(assessments);
      setHasCatchUpContent(assessments.length > 0);
      
    } catch (error) {
      console.error('❌ Error loading catch-up content:', error);
      setIncompleteAssessments([]);
      setHasCatchUpContent(false);
    }
  }, [user?.id]);

  // Load catch-up content when user changes
  useEffect(() => {
    loadCatchUpContent();
  }, [loadCatchUpContent]);

  // ContinueCards Component - Always shows helpful continue options
  const CatchUpContent: React.FC<{ date: Date }> = React.memo(({ date }) => {
    const { theme } = useTheme();
    const [dateNews, setDateNews] = useState<DateSpecificNewsItem[]>([]);
    const [loadingNews, setLoadingNews] = useState(false);

    // Fetch date-specific news when component mounts or date changes
    useEffect(() => {
      const fetchDateNews = async () => {
        setLoadingNews(true);
        try {
          const news = await DateSpecificNewsService.fetchAndSaveNewsForDate(date);
          setDateNews(news);
        } catch (error) {
          console.error('Error fetching date news:', error);
          setDateNews([]);
        } finally {
          setLoadingNews(false);
        }
      };

      fetchDateNews();
    }, [date]);

    const handleContinueAssessment = (assessment: AssessmentProgress) => {
      router.push(`/assessment-session/${assessment.sessionId}?type=${assessment.assessmentType}` as any);
    };

    const handleDeleteAssessment = (sessionId: string) => {
      // Remove from local state immediately for responsive UI
      setIncompleteAssessments(prev => 
        prev.filter(a => a.sessionId !== sessionId)
      );
      console.log(`🗑️ Removed assessment from home screen: ${sessionId}`);
    };

    const handleExploreQuizzes = () => {
      router.push('/(tabs)/quiz' as any);
    };

    const handleStartCivicsTest = () => {
      router.push('/civics-test' as any);
    };

    const handleViewSaved = () => {
      router.push('/(tabs)/saved' as any);
    };

    const handleNewsArticleClick = (article: any) => {
      // Transform news article into topic for content creation
      const topic = `Current events about: ${article.title}`;
      router.push({
        pathname: '/premium/create-content',
        params: { 
          topic: topic,
          source: 'news-ticker',
          date: formatDateKey(date)
        }
      } as any);
    };

    const continueCards = [
      {
        id: 'explore-quizzes',
        emoji: '🎯',
        title: uiStrings.home.exploreQuizTopics,
        description: uiStrings.home.exploreQuizTopicsDesc,
        onPress: handleExploreQuizzes,
      },
      {
        id: 'civics-test',
        emoji: '📝',
        title: uiStrings.home.takeCivicsAssessment,
        description: uiStrings.home.takeCivicsAssessmentDesc,
        onPress: handleStartCivicsTest,
      },
      {
        id: 'saved-content',
        emoji: '📚',
        title: uiStrings.home.reviewSavedContent,
        description: uiStrings.home.reviewSavedContentDesc,
        onPress: handleViewSaved,
      },
    ];

    return (
      <Animated.View 
        style={[
          styles.catchUpSection,
          {
            opacity: topicsListOpacity,
            transform: [{ translateY: topicsListTranslateY }],
          }
        ]}
      >
        <View style={styles.catchUpHeader}>
          <Text style={[styles.catchUpTitle, { color: theme.foreground }]}>
            {isToday(date) 
              ? uiStrings.home.nothingNewToday
              : uiStrings.home.keepGoing
            }
          </Text>
          {!isToday(date) && (
            <Text style={[styles.catchUpSubtitle, { color: theme.foregroundSecondary }]}>
              {uiStrings.home.navigateToOtherDates}
            </Text>
          )}
        </View>

        {/* Date-Specific News Inspiration */}
        {(dateNews.length > 0 || loadingNews) && (
          <View style={[styles.catchUpCategory, styles.catchUpCategoryFullWidth]}>
            <View style={styles.catchUpCategoryHeader}>
              <Text style={[styles.catchUpCategoryTitle, { color: theme.foreground }]}>
                📰 {isToday(date) ? "Today's" : formatDateForHeader(date)} Current Events
              </Text>
              <Text style={[styles.newsInspirationSubtitle, { color: theme.foregroundSecondary }]}>
                Tap any story to create a quiz about that topic
              </Text>
            </View>
            
            {loadingNews ? (
              <View style={styles.newsLoadingContainer}>
                <LoadingSpinner size="small" />
                <Text style={[styles.newsLoadingText, { color: theme.foregroundSecondary }]}>
                  Finding current events for {formatDateForHeader(date)}...
                </Text>
              </View>
            ) : (
              <NewsTicker 
                news={dateNews.map((item, index) => ({
                  id: `news-${index}-${item.title.slice(0, 10)}`,
                  title: item.title,
                  description: item.description,
                  url: item.url,
                  domain: item.domain,
                  publishedAt: item.published_time, // Map to expected field name
                  published_time: item.published_time,
                  og_title: item.og_title || null,
                  og_description: item.og_description || null,
                  og_image: item.og_image || null,
                  credibility_score: item.credibility_score,
                  author: item.author || null,
                  source: { id: item.domain, name: item.domain }, // Add required source field with proper structure
                  is_active: true
                }))}
                onArticleClick={handleNewsArticleClick}
                compact={true}
                context="home"
                date={formatDateKey(date)}
              />
            )}
          </View>
        )}

        {/* User's Incomplete Assessments (if any) */}
        {user && incompleteAssessments.length > 0 && (
          <View style={[styles.catchUpCategory, styles.catchUpCategoryFullWidth]}>
            <View style={styles.catchUpCategoryHeader}>
              <Text style={[styles.catchUpCategoryTitle, { color: theme.foreground }]}>
                Continue where you left off
              </Text>
            </View>
            
            {incompleteAssessments.slice(0, 2).map((assessment) => (
              <IncompleteAssessmentCard
                key={assessment.sessionId}
                assessment={assessment}
                compact={true}
                simultaneousHandlers={[pagerRef]}
                onResume={() => handleContinueAssessment(assessment)}
                onDelete={() => handleDeleteAssessment(assessment.sessionId)}
              />
            ))}
          </View>
        )}

        {/* General Continue Cards */}
        <View style={[styles.catchUpCategory, styles.catchUpCategoryFullWidth]}>
          <View style={styles.catchUpCategoryHeader}>
            <Text style={[styles.catchUpCategoryTitle, { color: theme.foreground }]}>
              {user && incompleteAssessments.length > 0 ? 'Or explore more' : 'Continue learning'}
            </Text>
          </View>
          
          {continueCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              onPress={card.onPress}
              style={[styles.catchUpCard, styles.catchUpCardFullWidth, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.8}
            >
              <View style={styles.catchUpCardHeader}>
                <View style={[styles.catchUpCardIcon, { backgroundColor: theme.primary + '15' }]}>
                  <Text style={styles.catchUpCardEmoji}>{card.emoji}</Text>
                </View>
                <View style={styles.catchUpCardContent}>
                  <Text style={[styles.catchUpCardTitle, { color: theme.foreground }]} numberOfLines={1}>
                    {card.title}
                  </Text>
                  <Text style={[styles.catchUpCardDescription, { color: theme.foregroundSecondary }]} numberOfLines={2}>
                    {card.description}
                  </Text>
                </View>
                <View style={styles.catchUpCardProgress}>
                  <Ionicons name="chevron-forward" size={16} color={theme.foregroundSecondary} />
                </View>
              </View>
            </TouchableOpacity>
                     ))}
         </View>

        {/* Premium Content Creation Button */}
        <View style={styles.premiumSection}>
          <TouchableOpacity
            style={[styles.premiumButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              router.push('/premium/create-content' as any);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.premiumButtonContent}>
              <View style={styles.premiumButtonLeft}>
                <Text style={styles.premiumButtonEmoji}>✨</Text>
                <View style={styles.premiumButtonText}>
                  <Text style={styles.premiumButtonTitle}>Create Custom Content</Text>
                  <Text style={styles.premiumButtonSubtitle}>Design your own topics & questions</Text>
                </View>
              </View>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PRO</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  });

  // Optimized date change handler - instantly responsive UI updates
  const handleDateChangeInstant = useCallback(async (newDate: Date, fromSwipe: boolean = false) => {
    try {
      const currentDateKey = formatDateKey(selectedDate);
      const newDateKey = formatDateKey(newDate);
      
      if (currentDateKey === newDateKey) {
        console.log('📅 Same date selected, skipping:', newDateKey);
        return;
      }

      console.log('📅 Date navigation:', {
        from: currentDateKey,
        to: newDateKey,
        source: fromSwipe ? 'swipe' : 'header',
        timestamp: new Date().toISOString()
      });

      // 1. IMMEDIATE UI UPDATES (no delays)
      // For swipe navigation, date is already set in onPageSelected for instant header update
      if (!fromSwipe) {
        setSelectedDate(newDate);
        console.log('📅 Date state updated in handleDateChangeInstant (header navigation)');
      } else {
        console.log('📅 Skipping date state update for swipe navigation (already set)');
      }
      setIsSwipeNavigation(fromSwipe);
      
      // Clear any previous timeout states
      clearLoadingTimeout();
      
      // Check if data is cached
      const isCached = dayTopicCache.isCacheValid(newDateKey);
      
      if (!isCached) {
        // Show smooth loading overlay instead of empty state
        const targetDateText = newDate.toLocaleDateString('en-US', { 
          weekday: 'short',
          month: 'short', 
          day: 'numeric'
        });
        console.log('📭 No cache for', newDateKey, '- showing smooth transition');
        showSmoothLoadingOverlay(targetDateText);
        
        // Start loading timeout 
        startLoadingTimeout();
        setError(null); // Clear any previous errors
      } else {
        console.log('📦 Cache hit for', newDateKey, '- loading from cache');
      }
      
      // 2. BACKGROUND DATA LOADING (non-blocking)
      const loadDataInBackground = async () => {
        try {
          console.log(`🔄 Background loading for ${newDateKey}...`);
          
          // Get topics for the new date with timeout handling
          const loadingPromise = dayTopicCache.getTopicsForDate(newDate, false);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Loading timeout')), 8000)
          );
          
          const { topics: dayTopics, featuredTopics: featured } = await Promise.race([
            loadingPromise,
            timeoutPromise
          ]) as { topics: EnhancedTopic[], featuredTopics: EnhancedTopic[] };
          
          console.log(`📊 Successfully loaded for ${newDateKey}:`, {
            regular: dayTopics.length,
            featured: featured.length,
            total: dayTopics.length + featured.length
          });
          
          // Clear timeout and update state with loaded data
          clearLoadingTimeout();
          setTopics(dayTopics);
          setFeaturedTopics(featured);
          setFilteredTopics(dayTopics);
          
          // Hide smooth transition overlay
          if (showSmoothTransition) {
            hideSmoothLoadingOverlay();
          }
          
          // Clear any previous errors
          setError(null);
          
          // Update daily stats (only for logged-in users)
          if (user?.id) {
            await calculateDailyStats(userProgress, newDate, dayTopics);
          }
          
          // Log cache performance for debugging
          if (__DEV__) {
            const cacheStats = dayTopicCache.getCacheStats();
            console.log(`📊 Cache Stats:`, cacheStats);
          }
          
          // Trigger intelligent prefetching for smoother navigation
          dayTopicCache.prefetchAdjacentDates(newDate);
          
        } catch (error) {
          console.error('❌ Background loading failed for', newDateKey, ':', error);
          clearLoadingTimeout();
          
          // Hide smooth transition overlay on error
          if (showSmoothTransition) {
            hideSmoothLoadingOverlay();
          }
          
          const errorMessage = error instanceof Error && error.message === 'Loading timeout' 
            ? 'Content is taking longer to load than expected'
            : 'Failed to load content for selected date';
            
          setError(errorMessage);
          
          // Set empty arrays on error to prevent stale data
          setTopics([]);
          setFeaturedTopics([]);
          setFilteredTopics([]);
        }
      };

      // Start background loading immediately
      loadDataInBackground();

      // 3. PAGER VIEW SYNC (if needed)
      if (!fromSwipe && pagerRef.current) {
        setTimeout(() => {
          pagerRef.current?.setPageWithoutAnimation(1);
          setCurrentPageIndex(1);
        }, 50);
      }
      
      // Reset navigation flags
      setTimeout(() => setIsSwipeNavigation(false), 100);

    } catch (error) {
      console.error('Error in instant date change:', error);
      clearLoadingTimeout();
      setError('Failed to load content for selected date');
    }
  }, [selectedDate, userProgress, calculateDailyStats, clearLoadingTimeout, startLoadingTimeout]);

  const handleDateChangeOptimized = async (newDate: Date) => {
    try {
      // Prevent selection of future dates - content might not be available yet
      const today = new Date();
      const isNewDateInFuture = newDate > today;
      
      if (isNewDateInFuture) {
        console.log('🔒 Future date selection blocked - content not available yet');
        return; // Don't allow future date selection
      }

      // Check if we're trying to navigate to the same date
      const currentDateKey = formatDateKey(selectedDate);
      const newDateKey = formatDateKey(newDate);
      
      if (currentDateKey === newDateKey) {
        console.log('📅 Same date selected, skipping navigation:', newDateKey);
        return; // Don't reload the same date
      }

      console.log('📅 Navigating from', currentDateKey, 'to', newDateKey);

      // Determine animation direction based on date comparison
      const direction = newDateKey > currentDateKey ? 'right' : 'left';
      
      setTransitionDirection(direction);
      setDateTransitioning(true);

      // Start loading animation if not cached
      if (!dayTopicCache.isCacheValid(formatDateKey(newDate))) {
        setLoading(true);
        createLoadingPulse();
      }

      // Update date state immediately (outside animation callback)
      setSelectedDate(newDate);

      // Create smooth transition animation with data loading
      createSmoothTransition(direction, async () => {
        try {
          const { topics: dayTopics, featuredTopics: featured } = await dayTopicCache.getTopicsForDate(newDate);
          
          console.log(`📊 Loaded for ${newDateKey}: ${dayTopics.length} regular topics, ${featured.length} featured topics`);
          
          // Update both regular and featured topics for the new date
          setTopics(dayTopics);
          setFeaturedTopics(featured);
          setFilteredTopics(dayTopics);
          await calculateDailyStats(userProgress, newDate, dayTopics);

          // Trigger prefetching for adjacent dates for smoother navigation
          dayTopicCache.prefetchAdjacentDates(newDate);
          
          setDateTransitioning(false);
          setLoading(false);
          
        } catch (error) {
          console.error('Error during animated date change:', error);
          setError('Failed to load content for selected date');
          setDateTransitioning(false);
          setLoading(false);
        }
      });

    } catch (error) {
      console.error('Error changing date:', error);
      setError('Failed to load content for selected date');
      setDateTransitioning(false);
      setLoading(false);
    }
  };

  const handleDateChange = useCallback(async (newDate: Date) => {
    await handleDateChangeOptimized(newDate);
  }, [userProgress]);

  // Enhanced date change handler that syncs with PagerView
  const handleDateChangeWithSync = useCallback(async (newDate: Date, fromSwipe: boolean = false) => {
    // Ensure no swipe navigation conflicts for header navigation
    if (!fromSwipe) {
      navigationInProgress.current = true;
      setIsSwipeNavigation(false);
    }
    
    try {
      // Use the same instant method for consistent behavior
      await handleDateChangeInstant(newDate, fromSwipe);
    } finally {
      if (!fromSwipe) {
        // Reset navigation state after header navigation
        setTimeout(() => {
          navigationInProgress.current = false;
        }, 100);
      }
    }
  }, [handleDateChangeInstant]);

  // PagerView for smooth date navigation
  const pagerRef = useRef<PagerViewRef>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(1); // Start at center page
  const [isSwipeNavigation, setIsSwipeNavigation] = useState(false); // Track if navigation came from swipe
  
  // Add refs to prevent multiple rapid calls
  const navigationInProgress = useRef(false);
  const lastSwipeTime = useRef(0);
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Generate 3-page sliding window: [previous, current, next]
  const getDatesArray = useCallback(() => {
    return [
      addDays(selectedDate, -1), // Page 0: Previous
      selectedDate,              // Page 1: Current (center)
      addDays(selectedDate, 1)   // Page 2: Next
    ];
  }, [selectedDate]);

  const dates = getDatesArray();

  // Simplified and more reliable page selection handler
  const onPageSelected = useCallback((e: any) => {
    const position = e.nativeEvent.position;
    const now = Date.now();
    
    console.log('📅 PagerView page selected:', position, 'current index:', currentPageIndex);
    
    // Debounce rapid swipe events (ignore events within 200ms)
    if (now - lastSwipeTime.current < 200) {
      console.log('📅 Debouncing rapid swipe event');
      return;
    }
    
    // Prevent overlapping navigation
    if (navigationInProgress.current) {
      console.log('📅 Navigation already in progress, ignoring');
      return;
    }
    
    // Only handle meaningful page changes (not center page)
    if (position === 1) {
      console.log('📅 Already on center page, no action needed');
      setCurrentPageIndex(1);
      return;
    }
    
    navigationInProgress.current = true;
    lastSwipeTime.current = now;
    setIsSwipeNavigation(true);
    
    let targetDate: Date;
    
    if (position === 0) {
      // Swiped to previous date
      targetDate = addDays(selectedDate, -1);
      console.log('📅 Swiping to previous date:', formatDateKey(targetDate));
      setCurrentPageIndex(0);
    } else if (position === 2) {
      // Swiped to next date  
      targetDate = addDays(selectedDate, 1);
      console.log('📅 Swiping to next date:', formatDateKey(targetDate));
      setCurrentPageIndex(2);
    } else {
      // Invalid position, reset state and return
      navigationInProgress.current = false;
      setIsSwipeNavigation(false);
      return;
    }
    
    // IMMEDIATELY update the selectedDate state for instant header update
    setSelectedDate(targetDate);
    console.log('📅 Header date updated immediately to:', formatDateKey(targetDate));
    
    // Execute the date change with unified logic
    handleDateChangeInstant(targetDate, true).finally(() => {
      // Reset to center page after a short delay
      setTimeout(() => {
        if (pagerRef.current && !navigationInProgress.current) {
          console.log('📅 Resetting to center page after swipe navigation');
          pagerRef.current.setPageWithoutAnimation(1);
          setCurrentPageIndex(1);
          setIsSwipeNavigation(false);
        }
        navigationInProgress.current = false;
      }, 150);
    });
  }, [selectedDate, currentPageIndex, handleDateChangeInstant]);

  // Unified navigation sync - ensure PagerView stays centered after any navigation
  useEffect(() => {
    // Reset PagerView to center page after any date change
    if (pagerRef.current && currentPageIndex !== 1 && !navigationInProgress.current) {
      console.log('📅 Syncing navigation - resetting to center page');
      pagerRef.current.setPageWithoutAnimation(1);
      setCurrentPageIndex(1);
    }
  }, [selectedDate, currentPageIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resetTimeout.current) {
        clearTimeout(resetTimeout.current);
        resetTimeout.current = null;
      }
      navigationInProgress.current = false;
      setIsSwipeNavigation(false);
    };
  }, []);

  // Simplified debug logging
  useEffect(() => {
    console.log('📅 Navigation State:', {
      selectedDate: formatDateKey(selectedDate),
      currentPageIndex,
      isSwipeNavigation,
      navigationInProgress: navigationInProgress.current,
    });
  }, [selectedDate, currentPageIndex, isSwipeNavigation]);

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
      
    if (!categoryId) {
      setFilteredTopics(topics);
    } else {
      const filtered = topics.filter(topic => 
        topic.category?.id === categoryId || 
        (Array.isArray(topic.categories) && topic.categories.includes(categoryId))
      );
      setFilteredTopics(filtered);
    }
  };

  const handleTopicPress = (topic: EnhancedTopic) => {
    const topicId = topic.topic_id || topic.id;
    // Direct to game room experience with quick settings
    router.push(`/game-room/${topicId}` as any);
  };

  const handleTopicReadMore = (topic: EnhancedTopic) => {
    const topicId = topic.topic_id || topic.id;
    // Direct to topic info screen for learning without playing
    router.push(`/topic/${topicId}` as any);
  };

  const handleShareTopic = async (topic: EnhancedTopic) => {
    try {
      const topicUrl = `https://civicsense.com/topic/${topic.topic_id || topic.id}`;
      const shareMessage = `Check out "${topic.title || topic.topic_title}" on CivicSense! 🏛️\n\n${topic.description}\n\nLearn more about this topic:\n${topicUrl}\n\nDiscover how power actually works in America and start your civic learning journey.\n\n#CivicSense #Democracy #PowerAwareness`;
      
      await Share.share({
        message: shareMessage,
        title: `CivicSense - ${topic.title || topic.topic_title}`,
        url: topicUrl,
      });
    } catch (error) {
      console.error('Error sharing topic:', error);
      Alert.alert('Error', 'Failed to share topic. Please try again.');
    }
  };

  const handleDailyChallenge = () => {
    // Navigate to the comprehensive daily challenges calendar screen
    router.push('/daily-challenges' as any);
  };



  // Loading state
  if (loading && !error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" variant="pulse" />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Loading your civic journey...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main app UI with clean design matching settings
  return (
    <DataErrorBoundary context="Home Screen">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Clean AppHeader with date navigation */}
        <AppHeader 
          title={user ? `Welcome back, ${profile?.full_name?.split(' ')[0] || 'Citizen'}` : 'CivicSense'}
          subtitle={isLoadingTopics ? 'Loading content...' : selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
          showAvatar={true}
          showOnHome={true}
          showDateNavigation={true}
          selectedDate={selectedDate}
          onDateChange={(date) => handleDateChangeWithSync(date, false)} // Mark as header navigation
          onTodayPress={() => {
            const today = new Date();
            if (!isToday(selectedDate)) {
              console.log('📅 Jumping to today via header tap');
              handleDateChangeWithSync(today, false);
            }
          }}
          maxPastDays={30} // Align with cache system
          maxFutureDays={0} // Disable future navigation since content likely doesn't exist
        />

        {/* Smooth Date Transition Overlay */}
        {showSmoothTransition && (
          <Animated.View 
            style={[
              styles.smoothTransitionOverlay,
              {
                opacity: transitionOpacity,
              }
            ]}
            pointerEvents="none"
          >
            <Animated.View 
              style={[
                styles.smoothTransitionContent,
                {
                  backgroundColor: theme.background,
                  transform: [{ scale: transitionScale }],
                }
              ]}
            >
              <View style={styles.smoothTransitionIcon}>
                <Text style={styles.smoothTransitionEmoji}>📅</Text>
              </View>
              <Text style={[styles.smoothTransitionText, { color: theme.foreground }]}>
                Loading {transitionContent}
              </Text>
              <View style={[styles.smoothTransitionProgress, { backgroundColor: theme.border }]}>
                <Animated.View 
                  style={[
                    styles.smoothTransitionProgressFill,
                    { 
                      backgroundColor: theme.primary,
                      transform: [{
                        scaleX: navigationProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1]
                        })
                      }]
                    }
                  ]} 
                />
              </View>
            </Animated.View>
          </Animated.View>
        )}

        {/* Legacy Navigation Loading Overlay */}
        {dateTransitioning && (
          <View style={styles.navigationOverlay}>
            <Animated.View 
              style={[
                styles.navigationProgress,
                {
                  opacity: navigationProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1]
                  }),
                  transform: [{
                    scale: navigationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.1]
                    })
                  }]
                }
              ]}
            >
              <Text style={styles.navigationProgressText}>
                📅 {transitionDirection === 'right' ? '→' : '←'}
              </Text>
            </Animated.View>
          </View>
        )}

        <CrossPlatformPagerView
          ref={pagerRef}
          style={{ 
            flex: 1, 
            width: '100%', 
            height: '100%',
            backgroundColor: 'transparent'
          }}
          initialPage={1}
          onPageSelected={onPageSelected}
          overdrag={false}
          orientation="horizontal"
          offscreenPageLimit={1}
          onPageScrollStateChanged={(e: { nativeEvent: { pageScrollState: string } }) => {
            const state = e.nativeEvent.pageScrollState;
            console.log('📅 PagerView scroll state:', state);
            
            // Simplified idle state handling
            if (state === 'idle' && !navigationInProgress.current) {
              // Reset to center page after navigation completes
              if (currentPageIndex !== 1) {
                console.log('📅 Auto-correcting to center page on idle');
                setTimeout(() => {
                  if (pagerRef.current && !navigationInProgress.current) {
                    pagerRef.current.setPageWithoutAnimation(1);
                    setCurrentPageIndex(1);
                    setIsSwipeNavigation(false);
                  }
                }, 100);
              }
            }
          }}
                >
          {dates.map((date, index) => {
            const isCurrentlyViewed = index === currentPageIndex;
            const dateKey = formatDateKey(date);
            
            return (
              <View key={dateKey} style={{ flex: 1, width: '100%' }}>
                <AsyncErrorBoundary
                  loading={loading && isCurrentlyViewed}
                  error={isCurrentlyViewed ? error : null}
                  onRetry={loadData}
                  loadingMessage="Loading civic content..."
                  context="Home Data"
                >
                  <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentInsetAdjustmentBehavior="automatic"
                    scrollEventThrottle={16}
                    contentContainerStyle={{ 
                      flexGrow: 1,
                      justifyContent: 'center',
                      paddingTop: spacing.sm, // Minimal top padding
                      paddingBottom: 100, // Account for tab bar + breathing room
                    }}
                    // Improved gesture handling for better swipe detection
                    directionalLockEnabled={true}
                    alwaysBounceVertical={false}
                    // Optimize for horizontal gesture conflicts
                    pagingEnabled={false}
                            refreshControl={
          isCurrentlyViewed ? (
            <HomeRefreshControl 
              onCustomRefresh={refreshData}
              onRefreshComplete={(success: boolean, errors?: any) => {
                if (!success && errors) {
                  console.warn('🔄 Home refresh completed with errors:', errors);
                } else {
                  console.log('🔄 Home refresh completed successfully');
                }
              }}
            />
          ) : undefined
        }
                  >
                    {/* Always show real content for the currently viewed page */}
                    <>
                      {/* Daily Progress Card removed - focusing on content discovery */}

                      {/* Topics for the date being viewed */}
                      <UnifiedTopicsCarousel
                        featuredTopics={featuredTopics}
                        regularTopics={topics}
                        onTopicPress={handleTopicPress}
                        onTopicReadMore={handleTopicReadMore}
                        userProgress={userProgress}
                      />

                      {/* Show continue cards if no topics available */}
                      {(featuredTopics.length === 0 && topics.length === 0) && (
                        <View style={styles.section}>
                          <CatchUpContent date={date} />
                        </View>
                      )}

                      {/* Guest Progress Widget - Show for non-authenticated users with progress */}
                      {!user && guestToken && (
                        <View style={styles.section}>
                          <GuestProgressWidget
                            guestToken={guestToken}
                            onSignupPress={() => router.push('/auth/signup?preserveProgress=true')}
                            compact={false}
                          />
                        </View>
                      )}
                    </>

                    <View style={styles.bottomSpacer} />
                  </ScrollView>
                </AsyncErrorBoundary>
              </View>
            );
          })}
        </CrossPlatformPagerView>


      </SafeAreaView>

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={languageSelectorVisible}
        currentLanguage={currentLanguage}
        onClose={() => setLanguageSelectorVisible(false)}
        onLanguageSelect={(languageCode: string) => {
          setTargetLanguage(languageCode);
          setTargetLanguageName(languageCode.toUpperCase());
          setLanguageSelectorVisible(false);
          setIsTranslating(true);
        }}
      />

      {/* Translation Scanner Overlay */}
      <TranslationScannerOverlay
        isVisible={isTranslating}
        targetLanguage={targetLanguage}
        targetLanguageName={targetLanguageName}
        onComplete={() => {
          setIsTranslating(false);
          // The UI strings are already updated through the hook
        }}
      />
    </DataErrorBoundary>
  );
}

// Clean, minimal styles matching settings page aesthetic
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
  },

  // Featured Topics Carousel
  featuredSection: {
    marginTop: spacing.md, // Add top margin for breathing room
    marginBottom: spacing.xl,
  },

  // NEW: Enhanced Featured Section Styles
  featuredMainHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  featuredMainTitle: {
    ...typography.titleLarge,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: typography.titleLarge.fontSize * 1.1,
  },
  featuredMainSubtitle: {
    ...typography.title3,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.8,
  },

  // Featured card container
  featuredCardContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  // Main featured card
  featuredMainCard: {
    borderRadius: 24, // Increased from 16 to 24 for more rounded corners
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 320, // Minimum height for consistent sizing
    marginVertical: spacing.lg, // Add vertical margin for spacing
    paddingVertical: spacing.md, // Add internal vertical padding
  },
  featuredEmptyCard: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  featuredEmptyState: {
    alignItems: 'center',
    gap: spacing.md,
  },
  featuredEmptyTitle: {
    ...typography.title3,
    fontWeight: '600',
  },
  featuredEmptyDescription: {
    ...typography.body,
    textAlign: 'center',
  },

  // Featured card content layout
  featuredTopicImageContainer: {
    alignItems: 'center',
    marginBottom: spacing.md, // Same as regular topics
  },
  featuredTopicIcon: {
    width: 80, // Same as regular topics
    height: 80, // Same as regular topics
    borderRadius: 40, // Updated to match new size
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTopicIconText: {
    fontSize: responsiveFontSizes.emojiLarge, // Same as regular topics
    lineHeight: responsiveFontSizes.emojiLarge * 1.2, // Proportional line height
  },
  featuredContentArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  completedBadge: {
    marginLeft: 'auto',
  },

  // Typography and content - same size as regular topics
  featuredMainHeadline: {
    ...typography.title2, // Same as regular topics
    fontWeight: '600', // Same weight as regular topics
    lineHeight: typography.title2.fontSize * 1.2,
    marginBottom: spacing.sm, // Same spacing as regular topics
    textAlign: 'center',
  },
  featuredTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    marginBottom: spacing.md, // Same as regular topics
    marginTop: spacing.sm, // Consistent spacing
  },
  featuredTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  featuredTagText: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  featuredDescription: {
    ...typography.body,
    lineHeight: typography.body.fontSize * 1.4, // Same as regular topics
    marginBottom: spacing.md, // Same as regular topics
    textAlign: 'center',
  },

  // Action buttons
  featuredActionButtonsContainer: {
    gap: spacing.sm,
    marginTop: 'auto',
  },
  featuredActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  featuredActionButtonPrimary: {
    // Primary button styles (filled)
  },
  featuredActionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  featuredActionButtonText: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },
  featuredActionButtonSecondaryText: {
    ...typography.callout,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },

  // Pagination
  featuredPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  paginationTextContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationText: {
    ...typography.caption1,
    fontFamily: fontFamily.mono,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  paginationMore: {
    ...typography.caption1,
    fontFamily: fontFamily.mono,
    marginLeft: spacing.sm,
    letterSpacing: 0.2,
  },

  // Regular topic card variants (same height as featured for consistency)
  regularTopicCard: {
    borderRadius: 24, // Increased from 16 to 24 for more rounded corners
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 320, // Same minimum height as featured cards for consistency
    width: SCREEN_WIDTH * 0.88,
    marginVertical: spacing.lg, // Add vertical margin for spacing
    paddingVertical: spacing.md, // Add internal vertical padding
  },
  regularTopicImageContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  regularTopicIcon: {
    width: 80, // Increased from 50 to 80
    height: 80, // Increased from 50 to 80
    borderRadius: 40, // Updated to match new size
    alignItems: 'center',
    justifyContent: 'center',
  },
  regularTopicIconText: {
    fontSize: responsiveFontSizes.emojiLarge, // Use responsive sizing with max limit
    lineHeight: responsiveFontSizes.emojiLarge * 1.2, // Proportional line height
  },
  regularTopicHeadline: {
    ...typography.title2,
    fontWeight: '400', // Lighter for regular topics
    lineHeight: typography.title2.fontSize * 1.2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  regularTopicDescription: {
    ...typography.body,
    lineHeight: typography.body.fontSize * 1.4,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  // Unified carousel styles
  unifiedCarouselContainer: {
    marginBottom: spacing.lg, // Reduced from spacing.xl
    justifyContent: 'center', // Center the carousel content
  },
  unifiedTopicCardWrapper: {
    width: SCREEN_WIDTH * 0.88,
    marginHorizontal: 0,
  },
  unifiedPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },


  // Legacy featured section
  legacyFeaturedSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  legacyFeaturedCard: {
    width: FEATURED_CARD_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 140,
  },

  featuredHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  featuredTitle: {
    ...typography.title2,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  featuredSubtitle: {
    ...typography.footnote,
  },
  featuredScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },

  // Featured card content and header styles
  featuredCardContent: {
    flex: 1,
    padding: spacing.lg,
  },
  featuredCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featuredBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  featuredBadgeText: {
    ...typography.caption,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  featuredBadgeInline: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  featuredBadgeInlineText: {
    fontFamily: fontFamily.monoBold,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featuredCardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginBottom: spacing.sm,
  },
  featuredCardEmoji: {
    fontSize: responsiveFontSizes.emojiMedium, // Use responsive sizing with max limit
    lineHeight: responsiveFontSizes.emojiMedium * 1.15, // Proportional line height
    marginRight: spacing.md,
    textAlign: 'center',
    width: responsiveFontSizes.emojiMedium,
    includeFontPadding: false,
  },
  featuredCardText: {
    flex: 1,
  },
  featuredCardTitle: {
    ...typography.callout,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  featuredCardDescription: {
    ...typography.footnote,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: spacing.xs,
    opacity: 0.8,
  },
  featuredCardTime: {
    ...typography.footnote,
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.7,
  },
  featuredCardArrow: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
  },

  // Sections
  section: {
    marginBottom: spacing.lg, // Reduced from spacing.xl for better vertical balance
    paddingHorizontal: spacing.lg,
    width: '100%', // Ensure full width
    alignSelf: 'stretch', // Prevent centering
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title2,
    fontWeight: '600',
  },
  seeAllLink: {
    ...typography.callout,
    fontWeight: '500',
  },

  // Ultra-minimal Topic Cards - Like catch-up cards
  minimalTopicCard: {
    borderRadius: 20, // Increased from 12 to 20 for more rounded corners
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 80,
  },
  minimalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  minimalCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  minimalCardEmoji: {
    fontSize: responsiveFontSizes.emojiSmall, // Use responsive sizing with max limit
    lineHeight: responsiveFontSizes.emojiSmall * 1.3, // Proportional line height
    marginRight: spacing.md,
    textAlign: 'center',
    width: responsiveFontSizes.emojiSmall,
    includeFontPadding: false, // Prevent extra padding on Android
  },
  minimalCardText: {
    flex: 1,
  },
  minimalCardTitle: {
    ...typography.callout,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 2,
    // Allow title to wrap to multiple lines
  },
  minimalCardTime: {
    ...typography.footnote,
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.7,
  },
  minimalCardEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  minimalCardCheck: {
    marginRight: spacing.xs,
  },



  // Keep old styles for fallback
  topicCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  topicContent: {
    flex: 1,
  },
  topicActions: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: spacing.sm,
    paddingTop: spacing.xs,
  },
  topicBookmark: {
    marginBottom: spacing.xs,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  topicEmojiContainer: {
    marginRight: spacing.sm,
  },
  topicEmoji: {
    fontSize: responsiveFontSizes.emojiSmall, // Use responsive sizing with max limit
    lineHeight: responsiveFontSizes.emojiSmall * 1.35, // Proportional line height
    textAlign: 'center',
    width: responsiveFontSizes.emojiSmall + 4, // Slightly wider than font size
  },
  topicTextContainer: {
    flex: 1,
  },
  topicTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  topicTitle: {
    ...typography.callout,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  topicDescription: {
    ...typography.body,
    lineHeight: typography.body.fontSize * 1.4,
    marginTop: spacing.xs,
  },
  topicMeta: {
    marginTop: spacing.sm,
  },
  topicMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
  },
  categoryBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  metaText: {
    ...typography.footnote,
    fontFamily: fontFamily.mono,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  newBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  newBadgeText: {
    ...typography.caption,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  completedIcon: {
    marginRight: spacing.xs,
  },
  chevron: {
    marginLeft: spacing.xs,
  },

  // Category Pills
  categoryScrollContent: {
    paddingRight: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  categoryEmoji: {
    fontSize: responsiveFontSizes.textBase, // Use responsive text sizing for smaller emojis
    lineHeight: responsiveFontSizes.textBase * 1.5, // Proportional line height
    marginRight: spacing.xs,
    includeFontPadding: false, // Prevent extra padding on Android
  },
  categoryPillText: {
    ...typography.footnote,
    fontFamily: fontFamily.mono,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Daily Progress Card - Clean design
  dailyCard: {
    borderRadius: 20, // Increased from 12 to 20 for more rounded corners
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 100,
  },
  dailyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyCardInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  dailyCardTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: 2,
  },
  dailyCardDescription: {
    ...typography.footnote,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm, // Increased padding for larger dots
    minHeight: 24, // Ensure consistent height for larger dots
  },
  progressDot: {
    // Dynamic sizing handled in component
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    ...typography.caption1,
    fontFamily: fontFamily.mono,
    letterSpacing: 0.2,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: spacing.md,
  },
  streakEmoji: {
    fontSize: responsiveFontSizes.textMedium, // Use responsive sizing for smaller emojis
    lineHeight: responsiveFontSizes.textMedium * 1.4, // Proportional line height
    includeFontPadding: false, // Prevent extra padding on Android
  },
  streakText: {
    ...typography.callout,
    fontWeight: '600',
  },
  streakLabel: {
    ...typography.footnote,
    fontWeight: '500',
  },
  shareStreakButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },

  // Topics List
  topicsList: {
    marginTop: spacing.xs,
    width: '100%', // Ensure full width
    alignSelf: 'stretch', // Prevent centering
  },


  civicsTestButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    minWidth: 200,
  },
  civicsTestButtonText: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },

  bottomSpacer: {
    height: spacing.lg, // Reduced from spacing.xl * 2 for better centering
  },



  // Smooth transition overlay styles
  smoothTransitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  smoothTransitionContent: {
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 200,
    maxWidth: 280,
    ...shadows.lg,
  },
  smoothTransitionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  smoothTransitionEmoji: {
    fontSize: responsiveFontSizes.emojiMedium, // Use responsive sizing
    lineHeight: responsiveFontSizes.emojiMedium * 1.15, // Proportional line height
  },
  smoothTransitionText: {
    ...typography.callout,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  smoothTransitionProgress: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  smoothTransitionProgressFill: {
    height: '100%',
    borderRadius: 2,
    transformOrigin: 'left',
  },

  // Navigation loading overlay styles
  navigationOverlay: {
    position: 'absolute',
    top: 140, // Below header
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  navigationProgress: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.full,
    padding: spacing.lg,
    ...shadows.lg,
  },
  navigationProgressText: {
    fontSize: 32,
    textAlign: 'center',
  },
  assessmentsScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  assessmentCardContainer: {
    width: FEATURED_CARD_WIDTH,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  
  // Skeleton styles for loading states
  skeletonLine: {
    borderRadius: borderRadius.xs,
  },

  // Catch-up content styles
  catchUpSection: {
    paddingVertical: spacing.md, // Reduced from lg to tighten vertical spacing
    paddingHorizontal: 0, // No horizontal padding since section wrapper handles it
    width: '100%',
    alignSelf: 'stretch',
  },
  catchUpHeader: {
    marginBottom: spacing.md, // Reduced from lg to tighten spacing
    alignItems: 'center',
    paddingHorizontal: 0, // No extra padding since section already has it
  },
  catchUpTitle: {
    ...typography.title3,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm, // Reduced from md to tighten spacing
  },
  catchUpSubtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    opacity: 0.8,
  },
  catchUpCategory: {
    marginBottom: spacing.md, // Reduced from lg to tighten spacing between categories
  },
  catchUpCategoryTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.sm, // Reduced from md to tighten spacing
  },
  // Add missing style properties
  catchUpCategoryFullWidth: {
    marginHorizontal: 0, // Full width within the padded section
  },
  catchUpCategoryHeader: {
    marginBottom: spacing.md,
  },
  catchUpCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.sm, // Reduced from md to tighten card spacing
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, // Reduced from lg to make cards more compact
    minHeight: 80, // Reduced from 100 to make cards more compact
    marginHorizontal: 0, // No extra horizontal margin
  },
  catchUpCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0, // Remove extra padding since card already has it
    paddingVertical: 0,
  },
  // Add missing style property
  catchUpCardFullWidth: {
    marginHorizontal: 0,
  },
  catchUpCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  catchUpCardEmoji: {
    fontSize: responsiveFontSizes.emojiSmall, // Use responsive sizing
    lineHeight: responsiveFontSizes.emojiSmall * 1.4, // Proportional line height
    includeFontPadding: false,
  },
  catchUpCardContent: {
    flex: 1,
  },
  catchUpCardTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: 2,
  },
  catchUpCardDescription: {
    ...typography.footnote,
  },
  catchUpCardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  catchUpCardPercentage: {
    ...typography.callout,
    fontWeight: '600',
  },

  // Premium section styles
  premiumSection: {
    marginTop: spacing.lg,
  },
  premiumButton: {
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginHorizontal: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  premiumButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumButtonEmoji: {
    fontSize: responsiveFontSizes.emojiSmall, // Use responsive sizing
    lineHeight: responsiveFontSizes.emojiSmall * 1.3, // Proportional line height
    marginRight: spacing.md,
    includeFontPadding: false,
  },
  premiumButtonText: {
    flex: 1,
  },
  premiumButtonTitle: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  premiumButtonSubtitle: {
    ...typography.footnote,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  premiumBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  premiumBadgeText: {
    ...typography.caption1,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },



  // News inspiration styles for empty state
  newsInspirationSubtitle: {
    ...typography.footnote,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  newsLoadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  newsLoadingText: {
    ...typography.footnote,
    textAlign: 'center',
  },
}); 