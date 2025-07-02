import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  SectionList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../lib/theme-context';
import { useAuth } from '../lib/auth-context';
import { useUIStrings } from '../hooks/useUIStrings';
import { Text } from '../components/atoms/Text';
import { LoadingSpinner } from '../components/molecules/LoadingSpinner';
import { spacing, borderRadius, fontFamily } from '../lib/theme';
import {
  fetchCollections,
  fetchFeaturedCollections,
  type StandardCollection,
} from '../lib/services/collections-service';
import {
  fetchTopics,
  type StandardTopic,
} from '../lib/standardized-data-service';
import { 
  createSearchAnalyticsService,
  type SearchHistoryItem,
  type ViewedItem,
  type SearchAnalytics,
  type ContentRecommendation
} from '../lib/services/search-analytics-service';

// Enhanced interfaces for user activity tracking
// (Using types from search-analytics-service)

type SearchResult = {
  type: 'collection' | 'topic';
  id: string;
  title: string;
  description: string;
  emoji?: string;
  slug?: string;
  question_count?: number;
  relevanceScore?: number;
  isRecentlyViewed?: boolean;
  lastViewed?: number;
};

// Storage keys (legacy - now handled by SearchAnalyticsService)
const SEARCH_HISTORY_KEY = 'civicsense_search_history';
const VIEWED_ITEMS_KEY = 'civicsense_viewed_items';
const SEARCH_ANALYTICS_KEY = 'civicsense_search_analytics';

export default function SearchScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { getString } = useUIStrings();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [collections, setCollections] = useState<StandardCollection[]>([]);
  const [topics, setTopics] = useState<StandardTopic[]>([]);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'collection' | 'topic'>('all');
  
  // Enhanced state for user activity
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [viewedItems, setViewedItems] = useState<ViewedItem[]>([]);
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics>({
    totalSearches: 0,
    topQueries: [],
    topCategories: [],
    avgSessionTime: 0,
    learningStreak: 0,
    searchSuccessRate: 0,
  });
  const [showingPersonalized, setShowingPersonalized] = useState(false);
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  
  // Initialize enhanced search service
  const searchService = useMemo(() => 
    createSearchAnalyticsService(user?.id, user ? undefined : 'guest_' + Date.now()),
    [user?.id]
  );

  // Load user activity data on mount
  useEffect(() => {
    loadUserActivityData();
  }, [user, searchService]);

  // Progressive loading when user starts searching
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        loadSearchData(searchQuery);
      }, 300); // Debounce for 300ms

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, searchService]);

  const loadUserActivityData = async () => {
    try {
      // Load data from enhanced search service
      const [history, viewed, analytics, recs] = await Promise.all([
        searchService.getSearchHistory(50),
        searchService.getViewedItems(100),
        searchService.getSearchAnalytics(),
        searchService.getPersonalizedRecommendations(10)
      ]);

      setSearchHistory(history);
      setViewedItems(viewed);
      if (analytics) {
        setSearchAnalytics(analytics);
      }
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading user activity data:', error);
    }
  };

  const saveSearchHistory = async (newHistory: SearchHistoryItem[]) => {
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      setSearchHistory(newHistory);
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const saveViewedItem = async (item: ViewedItem) => {
    try {
      const updatedViewed = [...viewedItems];
      const existingIndex = updatedViewed.findIndex(
        v => v.type === item.type && v.id === item.id
      );

      if (existingIndex >= 0) {
        // Update existing item
        updatedViewed[existingIndex] = {
          ...updatedViewed[existingIndex],
          lastViewed: item.lastViewed,
          viewCount: updatedViewed[existingIndex].viewCount + 1,
          timeSpent: item.timeSpent,
          completed: item.completed,
          score: item.score,
        };
      } else {
        // Add new item
        updatedViewed.unshift({ ...item, viewCount: 1 });
      }

      // Keep only last 100 viewed items
      const trimmed = updatedViewed.slice(0, 100);
      
      await AsyncStorage.setItem(VIEWED_ITEMS_KEY, JSON.stringify(trimmed));
      setViewedItems(trimmed);
    } catch (error) {
      console.error('Error saving viewed item:', error);
    }
  };

  const updateSearchAnalytics = async (query: string) => {
    try {
      const updated = {
        ...searchAnalytics,
        totalSearches: searchAnalytics.totalSearches + 1,
        topQueries: updateTopQueries(searchAnalytics.topQueries, query),
      };

      await AsyncStorage.setItem(SEARCH_ANALYTICS_KEY, JSON.stringify(updated));
      setSearchAnalytics(updated);
    } catch (error) {
      console.error('Error updating search analytics:', error);
    }
  };

  const updateTopQueries = (current: string[], newQuery: string): string[] => {
    const updated = [...current];
    const existing = updated.find(q => q.toLowerCase() === newQuery.toLowerCase());
    
    if (!existing && newQuery.trim().length > 1) {
      updated.unshift(newQuery.trim());
      return updated.slice(0, 10); // Keep top 10
    }
    
    return updated;
  };

  const loadSearchData = async (query: string) => {
    if (hasLoadedInitialData || query.trim().length < 2) return;
    
    try {
      setSearchLoading(true);
      
      console.log('🔍 Loading search data for:', query);
      
      // Load progressively with smaller batches
      const [collectionsResponse, topicsResponse] = await Promise.all([
        fetchCollections({ status: 'published', limit: 50 }, { useCache: true }),
        fetchTopics(undefined, { useCache: true })
      ]);

      if (collectionsResponse.data) {
        setCollections(collectionsResponse.data);
      }

      if (topicsResponse.data) {
        setTopics(topicsResponse.data);
      }
      
      // Track this search with results count
      const totalResults = (collectionsResponse.data?.length || 0) + (topicsResponse.data?.length || 0);
      await searchService.recordSearch(query, totalResults, 'general');
      
      setHasLoadedInitialData(true);
    } catch (error) {
      console.error('Error loading search data:', error);
      Alert.alert('Error', 'Failed to load search data. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const saveRecentSearch = async (query: string, resultSelected?: SearchHistoryItem['resultSelected']) => {
    if (query.trim() === '') return;
    
    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
      resultSelected,
    };
    
    const updatedHistory = [
      newItem,
      ...searchHistory.filter(item => item.query !== newItem.query)
    ].slice(0, 50); // Keep only last 50 searches
    
    await saveSearchHistory(updatedHistory);
  };

  // Enhanced search with personalization and relevance scoring
  const searchSections = useMemo(() => {
    if (searchQuery.trim() === '' || searchQuery.trim().length < 2) return [];

    const query = searchQuery.toLowerCase();
    const collectionResults: SearchResult[] = [];
    const topicResults: SearchResult[] = [];

    // Search collections with relevance scoring
    if (activeFilter === 'all' || activeFilter === 'collection') {
      collections.forEach(collection => {
        let relevanceScore = 0;
        const titleMatch = collection.title.toLowerCase().includes(query);
        const descMatch = collection.description.toLowerCase().includes(query);
        
        if (titleMatch) relevanceScore += 10;
        if (descMatch) relevanceScore += 5;
        
        // Boost score for recently viewed items
        const viewedItem = viewedItems.find(v => v.type === 'collection' && v.id === collection.id);
        if (viewedItem) {
          relevanceScore += 15;
          const daysSinceViewed = (Date.now() - viewedItem.lastViewed) / (1000 * 60 * 60 * 24);
          if (daysSinceViewed < 7) relevanceScore += 10; // Viewed in last week
          if (daysSinceViewed < 1) relevanceScore += 20; // Viewed today
        }
        
        // Boost for search history matches
        const searchedBefore = searchHistory.some(h => 
          h.resultSelected?.type === 'collection' && h.resultSelected.id === collection.id
        );
        if (searchedBefore) relevanceScore += 8;

        if (titleMatch || descMatch) {
          collectionResults.push({
            type: 'collection',
            id: collection.id,
            title: collection.title,
            description: collection.description,
            emoji: collection.emoji,
            slug: collection.slug,
            relevanceScore,
            isRecentlyViewed: !!viewedItem,
            lastViewed: viewedItem?.lastViewed,
          });
        }
      });
    }

    // Search topics with relevance scoring
    if (activeFilter === 'all' || activeFilter === 'topic') {
      topics.forEach(topic => {
        let relevanceScore = 0;
        const titleMatch = topic.title.toLowerCase().includes(query);
        const descMatch = topic.description?.toLowerCase().includes(query);
        
        if (titleMatch) relevanceScore += 10;
        if (descMatch) relevanceScore += 5;
        
        // Boost score for recently viewed items
        const viewedItem = viewedItems.find(v => v.type === 'topic' && v.id === topic.id);
        if (viewedItem) {
          relevanceScore += 15;
          const daysSinceViewed = (Date.now() - viewedItem.lastViewed) / (1000 * 60 * 60 * 24);
          if (daysSinceViewed < 7) relevanceScore += 10;
          if (daysSinceViewed < 1) relevanceScore += 20;
          
          // Boost completed items less (user might want new content)
          if (viewedItem.completed) relevanceScore -= 5;
        }

        if (titleMatch || descMatch) {
          topicResults.push({
            type: 'topic',
            id: topic.id,
            title: topic.title,
            description: topic.description || 'Explore this civic topic',
            emoji: topic.emoji,
            question_count: topic.question_count,
            relevanceScore,
            isRecentlyViewed: !!viewedItem,
            lastViewed: viewedItem?.lastViewed,
          });
        }
      });
    }

    // Sort by relevance score
    collectionResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    topicResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    const sections = [];

    if (collectionResults.length > 0) {
      sections.push({
        title: `Collections (${collectionResults.length})`,
        data: collectionResults.slice(0, 20),
        type: 'collection'
      });
    }

    if (topicResults.length > 0) {
      sections.push({
        title: `Topics (${topicResults.length})`,
        data: topicResults.slice(0, 30),
        type: 'topic'
      });
    }

    return sections;
  }, [searchQuery, collections, topics, activeFilter, viewedItems, searchHistory]);

  // Get personalized recommendations
  const personalizedRecommendations = useMemo(() => {
    if (viewedItems.length === 0) return [];

    // Analyze user's viewing patterns
    const categoryFrequency: Record<string, number> = {};
    const recentItems = viewedItems.filter(item => 
      Date.now() - item.lastViewed < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );

    // Get items user hasn't completed
    const incompleteItems = viewedItems.filter(item => !item.completed);
    
    // Get similar items based on user's interests
    const recommendations: SearchResult[] = [];
    
    // Add incomplete items first
    incompleteItems.slice(0, 3).forEach(item => {
      if (item.type === 'collection') {
        const collection = collections.find(c => c.id === item.id);
        if (collection) {
          recommendations.push({
            type: 'collection',
            id: collection.id,
            title: collection.title,
            description: collection.description,
            emoji: collection.emoji,
            slug: collection.slug,
            isRecentlyViewed: true,
            lastViewed: item.lastViewed,
          });
        }
      } else {
        const topic = topics.find(t => t.id === item.id);
        if (topic) {
          recommendations.push({
            type: 'topic',
            id: topic.id,
            title: topic.title,
            description: topic.description || 'Continue this civic topic',
            emoji: topic.emoji,
            question_count: topic.question_count,
            isRecentlyViewed: true,
            lastViewed: item.lastViewed,
          });
        }
      }
    });

    return recommendations;
  }, [viewedItems, collections, topics]);

  const handleResultPress = async (result: SearchResult) => {
    const startTime = Date.now();
    
    // Record search selection in enhanced service
    await searchService.recordSearchSelection(searchQuery, {
      type: result.type,
      id: result.id,
      title: result.title,
      position: 0, // TODO: Track actual position in results
    }, startTime);

    // Track content view
    await searchService.recordContentView({
      contentType: result.type,
      contentId: result.id,
      contentTitle: result.title,
      contentSlug: result.slug,
      referrerType: 'search',
      referrerId: searchQuery,
    });

    // Update local state for immediate UI feedback
    await saveViewedItem({
      type: result.type,
      id: result.id,
      title: result.title,
      slug: result.slug,
      lastViewed: Date.now(),
      viewCount: 1,
      referrerType: 'search',
      referrerId: searchQuery,
    });
    
    if (result.type === 'collection' && result.slug) {
      router.push(`/collections/${result.slug}` as any);
    } else if (result.type === 'topic') {
      router.push(`/topic/${result.id}` as any);
    }
  };

  const handleRecentSearchPress = (search: string) => {
    setSearchQuery(search);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const clearSearchHistory = async () => {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
      setSearchHistory([]);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[styles.resultItem, { 
        backgroundColor: theme.card, 
        borderColor: item.isRecentlyViewed ? theme.primary : theme.border,
        borderWidth: item.isRecentlyViewed ? 2 : 1.5,
      }]}
      onPress={() => handleResultPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultEmoji}>{item.emoji || '📚'}</Text>
          <View style={styles.resultInfo}>
            <View style={styles.resultTitleRow}>
                          <Text 
              style={[styles.resultTitle, { color: theme.foreground }]}
              numberOfLines={3}
            >
              {item.title}
            </Text>
              {item.isRecentlyViewed && (
                <View style={[styles.recentBadge, { backgroundColor: theme.primary }]}>
                  <Ionicons name="time" size={12} color="#FFFFFF" />
                  <Text style={styles.recentBadgeText}>{getString('search.recent')}</Text>
                </View>
              )}
            </View>
            <Text 
              style={[styles.resultDescription, { color: theme.foregroundSecondary }]}
              numberOfLines={3}
            >
              {item.description}
            </Text>
          </View>
        </View>
        
        <View style={styles.resultFooter}>
          <View style={[styles.resultType, { 
            backgroundColor: item.type === 'collection' ? theme.primary + '20' : theme.accent + '20' 
          }]}>
            <Text style={[styles.resultTypeText, { 
              color: item.type === 'collection' ? theme.primary : theme.accent 
            }]}>
              {item.type === 'collection' ? getString('search.collection', 'Collection') : getString('search.topic', 'Topic')}
            </Text>
          </View>
          
          {item.question_count && (
            <View style={styles.questionCount}>
              <Ionicons name="help-circle-outline" size={14} color={theme.foregroundSecondary} />
              <Text style={[styles.questionCountText, { color: theme.foregroundSecondary }]}>
                {getString('search.questionCount', '{count} questions', { count: item.question_count })}
              </Text>
            </View>
          )}
          
          {item.relevanceScore && item.relevanceScore > 15 && (
            <View style={[styles.relevanceBadge, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="star" size={12} color={theme.accent} />
              <Text style={[styles.relevanceText, { color: theme.accent }]}>
                {getString('search.recommended', 'Recommended')}
              </Text>
            </View>
          )}
          
          <Ionicons name="chevron-forward" size={16} color={theme.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearch = ({ item }: { item: SearchHistoryItem }) => (
    <TouchableOpacity
      style={[styles.recentItem, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => handleRecentSearchPress(item.query)}
      activeOpacity={0.8}
    >
      <Ionicons name="time-outline" size={16} color={theme.foregroundSecondary} />
      <View style={styles.recentSearchContent}>
        <Text style={[styles.recentText, { color: theme.foreground }]}>
          {item.query}
        </Text>
        {item.resultSelected && (
          <Text style={[styles.recentResultText, { color: theme.foregroundSecondary }]}>
            → {item.resultSelected.title}
          </Text>
        )}
      </View>
      <Text style={[styles.recentTime, { color: theme.foregroundSecondary }]}>
        {formatRelativeTime(item.timestamp)}
      </Text>
      <Ionicons name="enter-outline" size={14} color={theme.foregroundSecondary} />
    </TouchableOpacity>
  );

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: getString('search.title', 'Search'),
          headerShown: true,
          headerStyle: { 
            backgroundColor: theme.background,
          },
          headerTintColor: theme.foreground,
          headerTitleStyle: { 
            color: theme.foreground,
            fontFamily: 'SpaceMono-Regular',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: spacing.xs, marginLeft: spacing.sm }}
              accessibilityRole="button"
              accessibilityLabel={getString('common.goBack', 'Go back')}
            >
              <Ionicons name="arrow-back" size={24} color={theme.foreground} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            searchHistory.length > 0 && (
              <TouchableOpacity
                onPress={clearSearchHistory}
                style={{ padding: spacing.xs, marginRight: spacing.sm }}
                accessibilityRole="button"
                accessibilityLabel={getString('search.clearHistory', 'Clear search history')}
              >
                <Ionicons name="trash-outline" size={20} color={theme.foregroundSecondary} />
              </TouchableOpacity>
            )
          ),
        }}
      />

      {/* Search Input */}
      <View style={[styles.searchSection, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={20} color={theme.foregroundSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.foreground }]}
            placeholder={getString('search.placeholder', 'Search collections and topics...')}
            placeholderTextColor={theme.foregroundSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel={getString('common.clear', 'Clear search')}
            >
              <Ionicons name="close-circle" size={20} color={theme.foregroundSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Analytics */}
        {searchAnalytics.totalSearches > 0 && (
          <View style={[styles.analyticsBar, { backgroundColor: theme.card }]}>
            <Text style={[styles.analyticsText, { color: theme.foregroundSecondary }]}>
              {getString('search.analytics', '{count} searches • {viewed} items viewed', {
                count: searchAnalytics.totalSearches,
                viewed: viewedItems.length
              })}
            </Text>
            {searchAnalytics.learningStreak > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={12} color="#FF6B35" />
                <Text style={[styles.streakText, { color: '#FF6B35' }]}>
                  {getString('search.streak', '{count} day streak', { count: searchAnalytics.learningStreak })}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            {getString('search.loadingData', 'Loading search data...')}
          </Text>
        </View>
      ) : (
        <>
          {/* Search Results */}
          {searchQuery.trim() !== '' ? (
            <>
              {searchQuery.length >= 2 && searchLoading && !hasLoadedInitialData ? (
                <View style={styles.loadingContainer}>
                  <LoadingSpinner />
                  <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
                    {getString('search.searching', 'Searching collections and topics...')}
                  </Text>
                </View>
              ) : searchQuery.length < 2 ? (
                <View style={styles.noResults}>
                  <Text style={[styles.noResultsTitle, { color: theme.foreground }]}>
                    {getString('search.keepTyping', 'Keep typing...')}
                  </Text>
                  <Text style={[styles.noResultsText, { color: theme.foregroundSecondary }]}>
                    {getString('search.minCharacters', 'Enter at least 2 characters to start searching')}
                  </Text>
                </View>
              ) : searchSections.length > 0 ? (
                <>
                  {/* Filter Buttons */}
                  <View style={[styles.filterContainer, { backgroundColor: theme.background }]}>
                    <TouchableOpacity
                      style={[
                        styles.filterButton,
                        { 
                          backgroundColor: activeFilter === 'all' ? theme.primary : theme.card,
                          borderColor: theme.border
                        }
                      ]}
                      onPress={() => setActiveFilter('all')}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        { color: activeFilter === 'all' ? '#FFFFFF' : theme.foreground }
                      ]}>
                        {getString('search.filterAll', 'All')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterButton,
                        { 
                          backgroundColor: activeFilter === 'collection' ? theme.primary : theme.card,
                          borderColor: theme.border
                        }
                      ]}
                      onPress={() => setActiveFilter('collection')}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        { color: activeFilter === 'collection' ? '#FFFFFF' : theme.foreground }
                      ]}>
                        {getString('search.filterCollections', 'Collections')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterButton,
                        { 
                          backgroundColor: activeFilter === 'topic' ? theme.primary : theme.card,
                          borderColor: theme.border
                        }
                      ]}
                      onPress={() => setActiveFilter('topic')}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        { color: activeFilter === 'topic' ? '#FFFFFF' : theme.foreground }
                      ]}>
                        {getString('search.filterTopics', 'Topics')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Search Results in Sections */}
                  <SectionList
                    sections={searchSections}
                    renderItem={({ item }) => renderSearchResult({ item })}
                    renderSectionHeader={({ section }) => (
                      <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
                        <Text style={[styles.sectionHeaderText, { color: theme.foreground }]}>
                          {section.title}
                        </Text>
                      </View>
                    )}
                    keyExtractor={(item) => `${item.type}-${item.id}`}
                    style={styles.resultsList}
                    contentContainerStyle={styles.resultsContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
                    stickySectionHeadersEnabled={false}
                  />
                </>
              ) : (
                <View style={styles.noResults}>
                  <Text style={[styles.noResultsTitle, { color: theme.foreground }]}>
                    {getString('search.noResults', 'No results found')}
                  </Text>
                  <Text style={[styles.noResultsText, { color: theme.foregroundSecondary }]}>
                    {getString('search.noResultsHint', 'Try searching for different keywords like "Constitution", "Elections", or "Supreme Court"')}
                  </Text>
                </View>
              )}
            </>
          ) : (
            /* Enhanced Home Screen with Personalization */
            <ScrollView style={styles.homeContainer} showsVerticalScrollIndicator={false}>
                        {/* Personalized Recommendations */}
          {recommendations.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
                  {getString('search.continueLearning', 'Continue Learning')}
                </Text>
              </View>
              <Text style={[styles.sectionSubtitle, { color: theme.foregroundSecondary }]}>
                {getString('search.pickUpWhereLeft', 'Pick up where you left off')}
              </Text>
              
              {/* Horizontal Carousel for Recommendations */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendationsCarousel}
                style={styles.carouselContainer}
              >
                {recommendations.slice(0, 5).map((rec, index) => (
                  <View key={`rec-${rec.contentId}`} style={styles.recommendationCard}>
                    {renderSearchResult({ 
                      item: {
                        type: rec.contentType,
                        id: rec.contentId,
                        title: rec.contentTitle,
                        description: `${getString('search.recommended', 'Recommended')}: ${rec.recommendationType.replace('_', ' ')}`,
                        relevanceScore: rec.recommendationScore,
                        isRecentlyViewed: rec.isRecentlyViewed,
                        lastViewed: rec.lastViewed,
                      }
                    })}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

              {/* Recent Search History */}
              {searchHistory.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
                      {getString('search.recentSearches', 'Recent Searches')}
                    </Text>
                    <TouchableOpacity onPress={clearSearchHistory}>
                      <Text style={[styles.clearAllText, { color: theme.primary }]}>
                        {getString('search.clearAll', 'Clear All')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={searchHistory.slice(0, 10)}
                    renderItem={renderRecentSearch}
                    keyExtractor={(item, index) => `search-${index}`}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    scrollEnabled={false}
                  />
                </View>
              )}

              {/* Quick Search Suggestions */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
                  {getString('search.popularTopics', 'Popular Topics')}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.foregroundSecondary }]}>
                  {getString('search.tapToSearch', 'Tap to search quickly')}
                </Text>
                <View style={styles.quickSearchGrid}>
                  {['Constitution', 'Supreme Court', 'Elections', 'Congress', 'Biden', 'Trump', 'Democracy', 'Voting Rights'].map((term) => (
                    <TouchableOpacity
                      key={term}
                      style={[styles.quickSearchChip, { 
                        backgroundColor: theme.card, 
                        borderColor: theme.border 
                      }]}
                      onPress={() => setSearchQuery(term)}
                    >
                      <Text style={[styles.quickSearchText, { color: theme.foreground }]}>
                        {term}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Search Tips */}
              <View style={[styles.section, styles.tipsSection]}>
                <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
                  {getString('search.searchTips', 'Search Tips')}
                </Text>
                <View style={styles.tipsList}>
                  <View style={styles.tipItem}>
                    <Ionicons name="search" size={16} color={theme.primary} />
                    <Text style={[styles.tipText, { color: theme.foregroundSecondary }]}>
                      {getString('search.tip1', 'Try specific topics like "First Amendment" or "Electoral College"')}
                    </Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Ionicons name="star" size={16} color={theme.primary} />
                    <Text style={[styles.tipText, { color: theme.foregroundSecondary }]}>
                      {getString('search.tip2', 'Items you\'ve viewed recently appear first in results')}
                    </Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Ionicons name="time" size={16} color={theme.primary} />
                    <Text style={[styles.tipText, { color: theme.foregroundSecondary }]}>
                      {getString('search.tip3', 'Your search history helps us show better recommendations')}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.mono,
    marginLeft: spacing.md,
    paddingVertical: 0,
    lineHeight: 22,
  },
  clearButton: {
    padding: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: 16,
    fontFamily: fontFamily.mono,
    lineHeight: 22,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  resultItem: {
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    padding: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 140,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  resultContent: {
    gap: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  resultEmoji: {
    fontSize: 32,
    lineHeight: 36,
    marginTop: spacing.xs,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    lineHeight: 24,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  resultDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.mono,
    opacity: 0.8,
  },
  resultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: spacing.sm,
  },
  resultType: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  resultTypeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  questionCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    justifyContent: 'center',
  },
  questionCountText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fontFamily.mono,
    lineHeight: 18,
  },
  separator: {
    height: spacing.md,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl * 2,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    lineHeight: 28,
    marginBottom: spacing.md,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: fontFamily.mono,
    opacity: 0.7,
  },
  recentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    lineHeight: 28,
    marginBottom: spacing.lg,
    letterSpacing: -0.2,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    gap: spacing.md,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  recentSearchContent: {
    flex: 1,
  },
  recentText: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.mono,
    lineHeight: 22,
  },
  recentResultText: {
    fontSize: 14,
    fontFamily: fontFamily.mono,
    lineHeight: 20,
  },
  recentTime: {
    fontSize: 12,
    fontFamily: fontFamily.mono,
    lineHeight: 16,
  },
  recentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    color: '#FFFFFF',
    lineHeight: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  sectionSeparator: {
    height: spacing.lg,
  },
  homeContainer: {
    padding: spacing.lg,
  },
  section: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.mono,
    opacity: 0.8,
    marginBottom: spacing.md,
  },
  tipsSection: {
    paddingBottom: spacing.xl,
    borderBottomWidth: 0,
  },
  tipsList: {
    gap: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.mono,
    opacity: 0.8,
  },
  analyticsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.sm,
  },
  analyticsText: {
    fontSize: 14,
    fontFamily: fontFamily.mono,
    lineHeight: 18,
  },
  streakBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    lineHeight: 16,
  },
  quickSearchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickSearchChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quickSearchText: {
    fontSize: 14,
    fontFamily: fontFamily.mono,
    lineHeight: 18,
  },
  clearAllText: {
    fontSize: 14,
    fontFamily: fontFamily.mono,
    lineHeight: 18,
  },
  relevanceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  relevanceText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  
  // Carousel Styles
  carouselContainer: {
    marginTop: spacing.md,
    flexGrow: 0,
  },
  recommendationsCarousel: {
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  recommendationCard: {
    width: 320,
    marginRight: spacing.md,
  },
}); 