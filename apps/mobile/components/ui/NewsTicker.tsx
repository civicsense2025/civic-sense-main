import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../atoms/Text';
import { Card } from './Card';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';
import { Feather } from '@expo/vector-icons';
import { ensureSupabaseInitialized } from '../../lib/supabase';
import useLocalizedFormatting from '../../lib/hooks/useLocalizedFormatting';

const { width: screenWidth } = Dimensions.get('window');

interface NewsArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    id: string | null;
    name: string;
  };
  category?: string;
  relevanceScore?: number;
  tier?: number;
  credibilityScore?: number;
  database_id?: string | null;
}

interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
  status: string;
  source: string;
  fromCache: boolean;
  message: string;
}

interface NewsTickerProps {
  /** Pre-loaded news articles (for date-specific or custom contexts) */
  news?: NewsArticle[];
  /** Sources to filter by (when fetching from API) */
  sources?: string[];
  /** Categories to filter by (when fetching from API) */
  categories?: string[];
  /** Maximum number of articles to show */
  maxArticles?: number;
  /** Callback when article is clicked */
  onArticleClick?: (article: NewsArticle) => void;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Number of lines to show for titles */
  titleLineLimit?: number;
  /** Specific date to filter news (YYYY-MM-DD format) */
  date?: string;
  /** Context for different usage scenarios */
  context?: 'home' | 'daily' | 'general' | 'custom';
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Show images in articles */
  showImages?: boolean;
  /** Show source in articles */
  showSource?: boolean;
  /** Auto-scroll articles */
  autoScroll?: boolean;
  /** Scroll speed in pixels per second */
  scrollSpeed?: number;
}

// Helper function to diversify sources (avoid consecutive articles from same source)
function diversifySources(articles: NewsArticle[]): NewsArticle[] {
  if (articles.length <= 1) return articles;

  // Group articles by domain instead of source.name
  const sourceGroups = articles.reduce((groups, article) => {
    const domain = new URL(article.url).hostname.replace('www.', '');
    if (!groups[domain]) {
      groups[domain] = [];
    }
    groups[domain].push(article);
    return groups;
  }, {} as Record<string, NewsArticle[]>);

  const sourceNames = Object.keys(sourceGroups);
  const diversifiedArticles: NewsArticle[] = [];
  const sourceIndices = sourceNames.reduce((indices, name) => {
    indices[name] = 0;
    return indices;
  }, {} as Record<string, number>);

  // Round-robin through sources
  let totalProcessed = 0;
  while (totalProcessed < articles.length) {
    let addedInThisRound = 0;

    for (const sourceName of sourceNames) {
      const sourceArticles = sourceGroups[sourceName];
      if (!sourceArticles) continue;
      
      const currentIndex = sourceIndices[sourceName] || 0;
      if (currentIndex < sourceArticles.length) {
        const article = sourceArticles[currentIndex];
        if (article) {
          diversifiedArticles.push(article);
          sourceIndices[sourceName] = currentIndex + 1;
          totalProcessed++;
          addedInThisRound++;
        }
      }
    }

    if (addedInThisRound === 0) break;
  }

  return diversifiedArticles;
}

// Helper function to get relative time
function getRelativeTime(dateString: string | null, uiStrings: any): string | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}${uiStrings.time.minutesAgo}`;
    if (diffInHours < 24) return `${diffInHours}${uiStrings.time.hoursAgo}`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return uiStrings.time.yesterday;
    if (diffInDays < 7) return `${diffInDays}${uiStrings.time.daysAgo}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
}

// Helper function to get header title based on context
function getHeaderTitle(context: string, uiStrings: any, date?: string): string {
  switch (context) {
    case 'home':
      return date ? `${uiStrings.news.source} ${formatDateForDisplay(date, uiStrings)}` : uiStrings.news.today;
    case 'daily':
      return date ? `${uiStrings.news.dailyNews} - ${formatDateForDisplay(date, uiStrings)}` : uiStrings.news.dailyNews;
    case 'custom':
      return date ? `${uiStrings.news.source} ${formatDateForDisplay(date, uiStrings)}` : uiStrings.news.source;
    default:
      return uiStrings.news.latestNews;
  }
}

// Helper function to format date for display
function formatDateForDisplay(dateString: string, uiStrings: any): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return uiStrings.time.today;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return uiStrings.time.yesterday;
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

// Enhanced article validation with more robust source checking
function validateArticle(article: any): article is NewsArticle {
  if (!article || typeof article !== 'object') return false;
  
  const hasValidTitle = article.title && 
    typeof article.title === 'string' && 
    article.title.trim().length >= 10 &&
    !article.title.toLowerCase().includes('example') &&
    !article.title.toLowerCase().includes('mock') &&
    !article.title.toLowerCase().includes('placeholder') &&
    !article.title.toLowerCase().includes('no title available');
  
  const hasValidUrl = article.url && 
    typeof article.url === 'string' && 
    (article.url.startsWith('http://') || article.url.startsWith('https://'));
  
  // Strengthen source validation to prevent runtime errors
  const hasValidSource = article.source && 
    typeof article.source === 'object' &&
    article.source !== null &&
    article.source.name &&
    typeof article.source.name === 'string' &&
    article.source.name.trim().length > 0;
  
  return hasValidTitle && hasValidUrl && hasValidSource;
}

// Type predicate function to validate article structure
function isValidArticleForDeduplication(article: any): article is NewsArticle & { url: string; source: { name: string } } {
  return article && 
         typeof article === 'object' &&
         typeof article.url === 'string' &&
         article.url.length > 0 &&
         article.source &&
         typeof article.source === 'object' &&
         typeof article.source.name === 'string' &&
         article.source.name.length > 0;
}

// Helper function to deduplicate articles by URL with robust error handling
function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  const deduped: NewsArticle[] = [];
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    
    // Skip if article is invalid or missing
    if (!article || typeof article !== 'object') {
      console.warn('Skipping invalid article: not an object');
      continue;
    }
    
    // Extra defensive validation for required properties
    const url = article.url;
    const source = article.source;
    const sourceName = source?.name;
    
    if (!url || typeof url !== 'string' || url.length === 0) {
      console.warn('Skipping article with invalid URL:', article.title || 'Unknown');
      continue;
    }
    
    if (!source || typeof source !== 'object' || !sourceName || typeof sourceName !== 'string' || sourceName.length === 0) {
      console.warn('Skipping article with invalid source:', article.title || 'Unknown');
      continue;
    }
    
    try {
      // Now we're confident url is a valid string
      const normalizedUrl = url
        .replace(/^https?:\/\/(www\.)?/, '')
        .replace(/\/$/, '')
        .split('?')[0]
        .split('#')[0]
        .toLowerCase();
      
      if (!seen.has(normalizedUrl)) {
        seen.add(normalizedUrl);
        deduped.push(article);
      }
    } catch (error) {
      console.warn('Error processing URL for article:', article.title || 'Unknown', error);
      continue;
    }
  }
  
  console.log(`📰 Deduplication: ${articles.length} → ${deduped.length} articles`);
  return deduped;
}

// Helper function to calculate credibility score based on source
function calculateCredibilityScore(sourceName: string): number {
  const credibilityMap: Record<string, number> = {
    // Tier 1 Sources (Highest Credibility)
    'Reuters': 95, 'Associated Press': 95, 'AP News': 95, 'BBC': 90,
    'NPR': 88, 'PBS': 90, 'The Economist': 90, 'FiveThirtyEight': 88,
    'Open Secrets': 90, 'ProPublica': 92,
    
    // Major News Networks
    'Politico': 85, 'New York Times': 85, 'Washington Post': 88,
    'Wall Street Journal': 85, 'The Guardian': 82, 'Bloomberg': 88,
    'Time': 80, 'Los Angeles Times': 80, 'CNN': 75, 'Fox News': 70,
    'USA Today': 75, 'ABC News': 80, 'CBS News': 80, 'NBC News': 78,
    'Newsweek': 75, 'Al Jazeera': 78, 'The Independent': 75,
    
    // Government & Oversight
    'Government Executive': 85, 'Federal News Network': 82,
    'Roll Call': 88, 'The Hill': 85,
    
    // Policy Think Tanks
    'Cato Institute': 85, 'Brookings Institution': 88,
    'American Enterprise Institute': 82, 'Heritage Foundation': 82,
    'Center for Strategic and International Studies': 87,
    'Council on Foreign Relations': 89, 'Carnegie Endowment': 87,
    'RAND Corporation': 85, 'Center for American Progress': 80,
    
    // Specialized
    'Axios': 82, 'Military.com': 85, 'Defense News': 87,
    'Foreign Policy': 88,
  };
  
  // Find closest match
  for (const [source, score] of Object.entries(credibilityMap)) {
    if (sourceName.toLowerCase().includes(source.toLowerCase())) {
      return score;
    }
  }
  
  return 70; // Default for unknown sources
}

// Enhanced function to save articles to source_metadata table
async function saveArticlesToDatabase(articles: NewsArticle[]): Promise<{
  saved: number;
  skipped: number;
  errors: number;
  savedArticles: NewsArticle[];
}> {
  console.log(`💾 Starting to save ${articles.length} articles to source_metadata table...`);
  
  let saved = 0;
  let skipped = 0;
  let errors = 0;
  const savedArticles: NewsArticle[] = [];
  
  try {
    const supabase = await ensureSupabaseInitialized();
    
    // Process articles in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (article) => {
        try {
          // Skip if already has database_id
          if (article.database_id) {
            skipped++;
            savedArticles.push(article);
            return;
          }
          
          // Extract domain from URL
          const domain = new URL(article.url).hostname.replace('www.', '');
          
                     // Use the same RPC function as route.ts for consistency
           const { data: savedId, error } = await supabase.rpc('get_or_create_source_metadata', {
             p_url: article.url,
             p_title: article.title || '',
             p_description: article.description || '',
             p_domain: domain,
             p_author: null,
             p_published_time: article.publishedAt || new Date().toISOString(),
             p_modified_time: null
           });
          
                     if (error) {
             console.error(`❌ Error saving article "${article.title?.substring(0, 50) || 'Unknown'}...":`, error);
             errors++;
             // Still add to savedArticles without database_id
             savedArticles.push(article);
             return;
           }
          
          // Update the record with additional metadata
          if (savedId) {
            const credibilityScore = article.credibilityScore || calculateCredibilityScore(article.source.name);
            
            const { error: updateError } = await supabase
              .from('source_metadata')
              .update({
                og_title: article.title,
                og_description: article.description,
                og_image: article.urlToImage || null,
                og_site_name: article.source.name,
                og_type: 'article',
                content_type: 'article',
                language: 'en',
                credibility_score: credibilityScore,
                has_https: article.url.startsWith('https://'),
                has_valid_ssl: true,
                is_accessible: true,
                fetch_status: 'success',
                last_fetched_at: new Date().toISOString()
              })
              .eq('id', savedId);
            
                         if (updateError) {
               console.warn(`⚠️ Error updating metadata for "${article.title?.substring(0, 30) || 'Unknown'}...":`, updateError);
             }
             
             // Add the database_id to the article
             const updatedArticle = { ...article, database_id: savedId };
             savedArticles.push(updatedArticle);
             saved++;
             
             console.log(`✅ Saved: "${article.title?.substring(0, 40) || 'Unknown'}..." (ID: ${savedId})`);
          } else {
            // No ID returned but no error - might be duplicate
            savedArticles.push(article);
            skipped++;
          }
          
                 } catch (error) {
           console.error(`❌ Error processing article "${article.title?.substring(0, 50) || 'Unknown'}...":`, error);
           errors++;
           // Still add to savedArticles
           savedArticles.push(article);
         }
      }));
    }
    
    console.log(`💾 Database save complete: ${saved} saved, ${skipped} skipped, ${errors} errors`);
    
  } catch (error) {
    console.error('❌ Fatal error in saveArticlesToDatabase:', error);
    // Return original articles if saving fails completely
    return {
      saved: 0,
      skipped: articles.length,
      errors: 1,
      savedArticles: articles
    };
  }
  
  return {
    saved,
    skipped,
    errors,
    savedArticles
  };
}

export const NewsTicker: React.FC<NewsTickerProps> = ({
  news: preLoadedNews,
  sources = [],
  categories = [],
  maxArticles = 20,
  onArticleClick,
  compact = false,
  titleLineLimit = 2,
  date,
  context = 'general',
  refreshInterval = 30000, // 30 seconds
  showImages = true,
  showSource = true,
  autoScroll = true,
  scrollSpeed = 50, // pixels per second
}) => {
  const { theme } = useTheme();
  const { uiStrings, formatNewsDate } = useLocalizedFormatting();
  const [articles, setArticles] = useState<NewsArticle[]>(preLoadedNews || []);
  const [isLoading, setIsLoading] = useState(!preLoadedNews);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newsResponse, setNewsResponse] = useState<NewsResponse | null>(null);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  // New state for tracking database saves
  const [saveStats, setSaveStats] = useState<{
    saved: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const refreshAnimValue = useRef(new Animated.Value(0)).current;

  // Cache management
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes - shorter than API cache for fresher feeling

  // Handle screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  // Determine if we're on a small screen
  const isSmallScreen = screenData.width < 768;
  const cardWidth = isSmallScreen ? Math.min(280, screenData.width * 0.8) : 320;

  // Enhanced news loading using mobile-compatible RSS API
  const loadNews = useCallback(async (isManualRefresh: boolean = false) => {
    try {
      if (isManualRefresh) {
        console.log('🔄 NewsTicker: Manual refresh triggered');
        setIsRefreshing(true);
        setError(null);
      } else {
        console.log('🔄 NewsTicker: Initial load triggered');
        setIsLoading(true);
        setError(null);
      }
      
      // Check local cache validity (shorter than API cache for perceived freshness)
      const now = Date.now();
      if (!isManualRefresh && articles.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('📰 Using component-level cached news articles');
        return;
      }
      
      // Import mobile news API dynamically to avoid bundling issues
      const { getCachedMobileNews } = await import('../../lib/news-api-mobile');
      
      console.log(`📱 NewsTicker: Fetching from mobile RSS API (max: ${maxArticles})`);
      
      const data: NewsResponse = await getCachedMobileNews(maxArticles);
      console.log(`📱 NewsTicker: Mobile API Response - ${data.articles?.length || 0} articles, source: ${data.source}, cached: ${data.fromCache}`);
      
      if (data.status !== 'ok') {
        throw new Error(`Mobile API returned error status: ${data.status}`);
      }
      
      if (!data.articles || data.articles.length === 0) {
        throw new Error('No articles returned from mobile API');
      }

      // Validate and filter articles using enhanced validation
      const validArticles = data.articles.filter(validateArticle);
      
      if (validArticles.length === 0) {
        throw new Error('No valid articles found after filtering');
      }

      // Deduplicate articles by URL to prevent duplicates
      const dedupedArticles = deduplicateArticles(validArticles);

      // Sort articles by tier (from route.ts), then by credibility score, then by relevance
      const sortedArticles = dedupedArticles.sort((a, b) => {
        // Prioritize by tier (lower tier number = higher priority)
        if (a.tier && b.tier && a.tier !== b.tier) {
          return a.tier - b.tier;
        }
        
        // Then by credibility score (higher = better)
        if (a.credibilityScore && b.credibilityScore && a.credibilityScore !== b.credibilityScore) {
          return b.credibilityScore - a.credibilityScore;
        }
        
        // Then by relevance score
        if (a.relevanceScore && b.relevanceScore && a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        
        // Finally by publish date
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });

      // Save all deduplicated articles to database
      console.log(`💾 Saving ${sortedArticles.length} deduplicated articles to source_metadata table...`);
      const saveResult = await saveArticlesToDatabase(sortedArticles);
      setSaveStats(saveResult);

      // For manual refresh, diversify sources and optionally shuffle for variety
      const finalArticles = isManualRefresh 
        ? diversifySources(saveResult.savedArticles.sort(() => Math.random() - 0.5)).slice(0, maxArticles)
        : diversifySources(saveResult.savedArticles).slice(0, maxArticles);
      
      console.log(`📰 NewsTicker: Displaying ${finalArticles.length} articles after processing`);
      console.log(`   🎯 Tier 1 articles: ${finalArticles.filter(a => a.tier === 1).length}`);
      console.log(`   🎯 Tier 2 articles: ${finalArticles.filter(a => a.tier === 2).length}`);
      console.log(`   📊 Average credibility: ${Math.round(finalArticles.reduce((sum, a) => sum + (a.credibilityScore || 70), 0) / finalArticles.length)}`);
      console.log(`   💾 Database saves: ${saveResult.saved} saved, ${saveResult.skipped} skipped, ${saveResult.errors} errors`);
      
      setArticles(finalArticles);
      setNewsResponse(data);
      setError(null);
      
      if (isManualRefresh) {
        setLastRefreshTime(new Date());
      }
      
      setLastFetchTime(now);
      
    } catch (error) {
      console.error('❌ NewsTicker: News API failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load news';
      setError(errorMessage);
      
      // Don't clear existing articles on error unless this is the initial load
      if (articles.length === 0) {
        setArticles([]);
        setNewsResponse(null);
        setSaveStats(null);
      }
    } finally {
      if (isManualRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [maxArticles, sources, categories, articles.length, lastFetchTime]);

  // Manual refresh function with animation and feedback
  const handleRefresh = useCallback(async () => {
    if (isRefreshing || isLoading) return;
    
    const startTime = Date.now();
    
    // Start rotation animation
    Animated.timing(refreshAnimValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      // Reset animation value
      refreshAnimValue.setValue(0);
    });
    
    // Store current articles for comparison
    const previousArticleCount = articles.length;
    const previousArticleIds = new Set(articles.map(a => a.id));
    
    // Load fresh news
    await loadNews(true);
    
    // Brief delay to ensure smooth animation completion
    const minRefreshTime = 1000; // 1 second minimum
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < minRefreshTime) {
      await new Promise(resolve => setTimeout(resolve, minRefreshTime - elapsedTime));
    }
    
    // Provide user feedback
    console.log('🔄 NewsTicker refresh completed for user interaction');
  }, [isRefreshing, isLoading, loadNews, refreshAnimValue, articles]);

  useEffect(() => {
    // Only load news if we don't have pre-loaded news
    if (!preLoadedNews) {
      loadNews();
    }
  }, [loadNews, preLoadedNews]);

  const handleArticlePress = async (article: NewsArticle) => {
    if (onArticleClick) {
      onArticleClick(article);
    } else {
      try {
        await Linking.openURL(article.url);
      } catch (error) {
        console.error('Error opening URL:', error);
      }
    }
  };

  // Auto-scroll animation
  useEffect(() => {
    if (!autoScroll || articles.length === 0) return;

    const startAutoScroll = () => {
      const totalWidth = articles.length * 300; // Estimated card width
      const scrollDuration = (totalWidth / scrollSpeed) * 1000; // Convert to ms

      Animated.loop(
        Animated.sequence([
          Animated.timing(scrollX, {
            toValue: totalWidth,
            duration: scrollDuration,
            useNativeDriver: false,
          }),
          Animated.timing(scrollX, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    const timer = setTimeout(startAutoScroll, 1000); // Start after 1 second

    return () => {
      clearTimeout(timer);
    };
  }, [articles.length, autoScroll, scrollSpeed]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    loadNews();

    if (refreshInterval > 0) {
      const interval = setInterval(() => loadNews(), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadNews, refreshInterval]);

  // Stop auto-scroll on user interaction
  const handleScrollBeginDrag = useCallback(() => {
    // Implement stopping the auto-scroll animation
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingHorizontal: isSmallScreen ? spacing.sm : spacing.md }]}>
          <Text variant="callout" color="inherit" style={styles.headerText}>
            {getHeaderTitle(context, uiStrings, date)}
          </Text>
        </View>
        <View style={[
          styles.loadingContainer, 
          { 
            backgroundColor: theme.background,
            marginHorizontal: isSmallScreen ? spacing.sm : spacing.md,
          }
        ]}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text variant="footnote" color="secondary" style={{ marginTop: spacing.sm }}>
            {uiStrings.status.loading}
          </Text>
          <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
            {uiStrings.news.fetchingFrom}
          </Text>
        </View>
      </View>
    );
  }

  if (error && articles.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingHorizontal: isSmallScreen ? spacing.sm : spacing.md }]}>
          <Text variant="callout" color="inherit" style={styles.headerText}>
            {getHeaderTitle(context, uiStrings, date)}
          </Text>
        </View>
        <View style={[
          styles.errorContainer, 
          { 
            backgroundColor: theme.background,
            marginHorizontal: isSmallScreen ? spacing.sm : spacing.md,
          }
        ]}>
          <Feather name="alert-circle" size={20} color={theme.error} />
          <Text variant="footnote" color="secondary" style={{ marginLeft: spacing.sm }}>
            {error || uiStrings.errors.loadingFailed}
          </Text>
        </View>
      </View>
    );
  }

  // Get credibility badge color
  const getCredibilityColor = (score?: number) => {
    if (!score) return theme.foregroundSecondary;
    if (score >= 90) return theme.success;
    if (score >= 80) return theme.primary;
    if (score >= 70) return theme.warning;
    return theme.error;
  };

  // Get tier badge text
  const getTierText = (tier?: number) => {
    switch (tier) {
      case 1: return 'T1';
      case 2: return 'T2';
      case 3: return 'T3';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: isSmallScreen ? spacing.sm : spacing.md }]}>
        <View style={styles.headerLeft}>
          <Text variant="callout" color="inherit" style={styles.headerText}>
            {getHeaderTitle(context, uiStrings, date)}
          </Text>
          {!isSmallScreen && (
            <Text variant="caption" color="secondary" style={styles.headerSubtext}>
              {articles.length} {uiStrings.news.articles}
              {newsResponse?.source && ` • ${newsResponse.source}`}
              {saveStats && ` • ${saveStats.saved} ${uiStrings.news.savedToDb}`}
            </Text>
          )}
        </View>
        
        {!preLoadedNews && (
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: theme.background }]}
            onPress={handleRefresh}
            disabled={isRefreshing || isLoading}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel={uiStrings.actions.refresh}
            accessibilityHint="Double tap to load fresh news articles"
          >
          <Animated.View
            style={{
              transform: [{
                rotate: refreshAnimValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }}
          >
            <Feather 
              name="refresh-cw" 
              size={16} 
              color={isRefreshing ? theme.primary : theme.foregroundSecondary}
            />
          </Animated.View>
          {isRefreshing && (
            <Text style={[styles.refreshingText, { color: theme.primary }]}>
              {uiStrings.status.loading}
            </Text>
          )}
        </TouchableOpacity>
        )}
      </View>
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingLeft: isSmallScreen ? spacing.sm : spacing.md }
        ]}
        snapToInterval={cardWidth + spacing.md}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
      >
        {articles.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={[
              styles.newsCard,
              { width: cardWidth }
            ]}
            onPress={() => handleArticlePress(article)}
            activeOpacity={0.8}
          >
            <Card style={styles.cardInner} variant="outlined">
              <View style={styles.cardContent}>
                {/* Quality indicators for articles from route.ts API */}
                {(article.tier || article.credibilityScore) && !isSmallScreen && (
                  <View style={styles.qualityBadges}>
                    {article.tier && (
                      <View style={[styles.tierBadge, { 
                        backgroundColor: article.tier === 1 ? theme.success : 
                                       article.tier === 2 ? theme.primary : theme.warning
                      }]}>
                        <Text style={[styles.badgeText, { color: 'white' }]}>
                          {getTierText(article.tier)}
                        </Text>
                      </View>
                    )}
                    {article.credibilityScore && (
                      <View style={[styles.credibilityBadge, { 
                        backgroundColor: getCredibilityColor(article.credibilityScore) + '20',
                        borderColor: getCredibilityColor(article.credibilityScore)
                      }]}>
                        <Text style={[styles.badgeText, { 
                          color: getCredibilityColor(article.credibilityScore)
                        }]}>
                          {article.credibilityScore}
                        </Text>
                      </View>
                    )}
                    {/* Database save indicator */}
                    {article.database_id && (
                      <View style={[styles.dbBadge, { backgroundColor: theme.success + '20' }]}>
                        <Feather name="database" size={8} color={theme.success} />
                      </View>
                    )}
                  </View>
                )}
                
                <Text 
                  variant="callout" 
                  color="inherit" 
                  style={styles.newsTitle}
                  numberOfLines={isSmallScreen ? 3 : titleLineLimit}
                >
                  {article.title}
                </Text>
                
                <View style={styles.newsFooter}>
                  <View style={styles.domainContainer}>
                    <Feather name="globe" size={12} color={theme.secondary} />
                    <Text variant="caption" color="secondary" style={styles.newsDomain}>
                      {article.source.name}
                    </Text>
                  </View>
                  {!isSmallScreen && (
                    <Text variant="caption" color="secondary" style={styles.newsTime}>
                      {formatNewsDate(article.publishedAt)}
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Enhanced status indicator showing API and database information */}
      {!isSmallScreen && newsResponse && (
        <View style={styles.statusContainer}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { 
              backgroundColor: newsResponse.fromCache ? theme.primary : theme.success 
            }]} />
            <Text variant="caption" color="secondary" style={styles.statusText}>
              {newsResponse.fromCache ? 'Cached' : 'Live'} from {newsResponse.source}
              {lastRefreshTime && (
                <Text variant="caption" color="secondary">
                  {' • Refreshed at '}
                  {lastRefreshTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </Text>
              )}
            </Text>
          </View>
          {newsResponse.message && (
            <Text variant="caption" color="secondary" style={[styles.statusText, { marginTop: 2 }]}>
              {newsResponse.message}
            </Text>
          )}
          {/* Database save status */}
          {saveStats && (
            <View style={[styles.statusIndicator, { marginTop: spacing.xs }]}>
              <Feather name="database" size={10} color={theme.success} />
              <Text variant="caption" color="secondary" style={[styles.statusText, { marginLeft: spacing.xs }]}>
                Database: {saveStats.saved} saved, {saveStats.skipped} existing
                {saveStats.errors > 0 && `, ${saveStats.errors} errors`}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    fontFamily: fontFamily.display,
    fontWeight: '500',
  },
  headerSubtext: {
    fontFamily: fontFamily.mono,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  refreshingText: {
    fontSize: 12,
    fontFamily: fontFamily.mono,
    fontWeight: '500',
  },
  loadingContainer: {
    height: 100,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 100,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  scrollContainer: {
    paddingRight: spacing.lg,
  },
  newsCard: {
    marginRight: spacing.md,
  },
  cardInner: {
    height: 'auto',
    minHeight: 100,
    padding: 0,
  },
  cardContent: {
    padding: spacing.md,
    flex: 1,
    justifyContent: 'space-between',
  },
  qualityBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  credibilityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
  },
  dbBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fontFamily.mono,
    fontWeight: '600',
  },
  newsTitle: {
    fontFamily: fontFamily.text,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: spacing.sm,
    flex: 1,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  domainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  newsDomain: {
    fontFamily: fontFamily.mono,
    marginLeft: spacing.xs,
    fontSize: 11,
  },
  newsTime: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
  },
  statusContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  statusText: {
    fontFamily: fontFamily.mono,
  },
}); 