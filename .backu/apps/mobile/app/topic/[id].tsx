import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Share, 
  Alert, 
  ScrollView,
  Linking,
  Modal,
  Animated,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { ChallengePrompt } from '../../components/molecules/ChallengePrompt';
import { BookmarkService } from '../../lib/services/bookmark-service';
import { Card } from '../../components/ui/Card';
import { spacing, fontFamily, borderRadius } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { StandardizedDataService } from '../../lib/standardized-data-service';

const standardDataService = new StandardizedDataService();
import { supabase } from '../../lib/supabase';
import { Image } from 'expo-image';
import SourceAnalysisService, { type SourceAnalysisResult } from '../../lib/services/source-analysis-service';
import { PageTranslationControls } from '../../components/audio/PageTranslationControls';
import { deepLTranslationService } from '../../lib/translation/deepl-service';
import { UserContentService, type UserContentAnnotation } from '../../lib/services/user-content-service';
import { TranslationScannerOverlay } from '../../components/ui/TranslationScannerOverlay';

import { LinearGradient } from 'expo-linear-gradient';
import useUIStrings, { getLanguageDisplayName } from '../../lib/hooks/useUIStrings';

interface TopicData {
  id: string;
  title: string;
  description: string;
  emoji?: string | undefined;
  why_this_matters?: string | undefined;
  categories?: string[] | undefined;
  sources?: Array<{
    title: string;
    url: string;
    type: string;
    credibility_score?: number;
    published_date?: string;
    author?: string;
  }> | undefined;
  question_count?: number | undefined;
  difficulty_level?: string | undefined;
  created_at?: string | undefined;
  translations?: any; // Store raw translations from database
}

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  examples?: string[];
  related_terms?: string[];
}

interface OpenGraphData {
  image?: string;
  title?: string;
  description?: string;
}

const ogDataCache = new Map<string, OpenGraphData>();

const fetchOpenGraphData = async (url: string): Promise<OpenGraphData> => {
  // Check cache first
  if (ogDataCache.has(url)) {
    return ogDataCache.get(url)!;
  }

  try {
    console.log(`🔍 Fetching OG data for: ${url}`);
    
    // Call your Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('og-data', {
      body: { url },
    });

    if (error) {
      console.warn('Edge Function error:', error);
      throw error;
    }

    if (data && data.success) {
      const ogData: OpenGraphData = {
        title: data.title,
        description: data.description,
        image: data.image,
      };
      
      // Cache the result
      ogDataCache.set(url, ogData);
      console.log(`✅ OG data fetched for: ${url}`, ogData);
      return ogData;
    } else {
      throw new Error('No OG data returned from Edge Function');
    }
    
  } catch (error) {
    console.warn('OG data fetch failed, using fallback:', error);
    
    // Extract domain for fallback data
    const domain = new URL(url).hostname.toLowerCase();
    const fallbackImage = getDomainFallbackImage(domain);
    
    // Use enhanced domain-based defaults as fallback
    const ogData: OpenGraphData = {
      title: getEnhancedTitle(url, domain),
      description: getEnhancedDescription(url, domain),
      ...(fallbackImage && { image: fallbackImage }),
    };
    
    // Cache the fallback result
    ogDataCache.set(url, ogData);
    console.log(`⚠️ Using fallback OG data for: ${url}`, ogData);
    return ogData;
  }
};

// Helper function to get enhanced titles based on URL patterns
const getEnhancedTitle = (url: string, domain: string): string => {
  try {
    // Extract meaningful parts from URL path
    const pathname = new URL(url).pathname;
    const segments = pathname.split('/').filter(segment => segment.length > 0);
    
    // Domain-specific title patterns
    if (domain.includes('supreme-court') || domain.includes('supremecourt')) {
      return 'Supreme Court Decision';
    } else if (domain.includes('congress.gov')) {
      return 'Congressional Information';
    } else if (domain.includes('nbcnews.com') && segments.includes('politics')) {
      return 'NBC News: Political Coverage';
    } else if (domain.includes('reuters.com') && segments.includes('legal')) {
      return 'Reuters: Legal Analysis';
    } else if (domain.includes('washingtonpost.com') && segments.includes('politics')) {
      return 'Washington Post: Political News';
    }
    
    // Generic domain-based titles
    const domainTitles: Record<string, string> = {
      'nytimes.com': 'The New York Times',
      'washingtonpost.com': 'The Washington Post',
      'reuters.com': 'Reuters News',
      'cnn.com': 'CNN Breaking News',
      'nbcnews.com': 'NBC News',
      'abcnews.go.com': 'ABC News',
      'congress.gov': 'U.S. Congress',
      'supremecourt.gov': 'Supreme Court',
      'whitehouse.gov': 'White House',
    };
    
    return domainTitles[domain] || `Article from ${domain}`;
  } catch {
    return 'News Article';
  }
};

// Helper function to get enhanced descriptions based on URL patterns  
const getEnhancedDescription = (url: string, domain: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split('/').filter(segment => segment.length > 0);
    
    // URL pattern-based descriptions
    if (segments.includes('supreme-court') || domain.includes('supremecourt')) {
      return 'Latest Supreme Court ruling and legal analysis';
    } else if (segments.includes('obamacare') || segments.includes('aca')) {
      return 'Coverage of Affordable Care Act developments';
    } else if (segments.includes('politics')) {
      return 'Political news and analysis';
    } else if (segments.includes('healthcare')) {
      return 'Healthcare policy and news coverage';
    } else if (segments.includes('congress')) {
      return 'Congressional news and legislative updates';
    }
    
    // Domain-specific descriptions
    const domainDescriptions: Record<string, string> = {
      'nytimes.com': 'In-depth journalism and analysis',
      'washingtonpost.com': 'Breaking news and political coverage',
      'reuters.com': 'Global news and business information',
      'cnn.com': 'Breaking news and live coverage',
      'nbcnews.com': 'National and international news',
      'congress.gov': 'Official congressional information and documents',
      'supremecourt.gov': 'Official Supreme Court opinions and orders',
    };
    
    return domainDescriptions[domain] || 'Click to read the full article';
  } catch {
    return 'Read the full article for more information';
  }
};

// Helper function to get fallback images for known domains
const getDomainFallbackImage = (domain: string): string | undefined => {
  const domainImages: Record<string, string> = {
    'nytimes.com': 'https://static01.nyt.com/images/misc/NYT_logo_rss_250x40.png',
    'washingtonpost.com': 'https://www.washingtonpost.com/wp-stat/graphics/ai2html/logos/twp-social-share.png',
    'reuters.com': 'https://www.reuters.com/pf/resources/images/reuters/reuters-default.png',
    'cnn.com': 'https://cdn.cnn.com/cnn/.e/img/3.0/global/misc/cnn-logo.png',
    'bbc.com': 'https://ichef.bbci.co.uk/news/1024/branded_news/6D4F/production/_63721682_bbc_news_logo.png',
    'nbcnews.com': 'https://nodeassets.nbcnews.com/images/nbc-social-default.png',
    'abcnews.go.com': 'https://a.abcnews.com/assets/beta/assets/abcnews_images/abc_news_default_image.png',
    'congress.gov': 'https://www.congress.gov/themes/basic/images/uscongress-logo.png',
    'supremecourt.gov': 'https://www.supremecourt.gov/favicon.ico',
    'whitehouse.gov': 'https://www.whitehouse.gov/wp-content/uploads/2021/01/wh_social-share.jpg',
  };
  
  // Check for exact domain match
  if (domainImages[domain]) {
    return domainImages[domain];
  }
  
  // Check for subdomain matches
  for (const [key, image] of Object.entries(domainImages)) {
    if (domain.includes(key)) {
      return image;
    }
  }
  
  return undefined;
};

const parseHTML = (html: string): string => {
  return html
    // Handle line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Handle paragraphs
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    // Handle lists
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    // Handle headings
    .replace(/<h[1-6][^>]*>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    // Preserve strong/bold tags for later processing
    .replace(/<strong>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<b>/gi, '**')
    .replace(/<\/b>/gi, '**')
    // Remove remaining HTML tags but keep content
    .replace(/<[^>]*>/g, '')
    // Clean up whitespace
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up multiple newlines
    .replace(/\n\n\n+/g, '\n\n')
    .replace(/^\n+|\n+$/g, '')
    .trim();
};

// Component to render formatted text with bold support
const FormattedText: React.FC<{ text: string; style: any }> = ({ text, style }) => {
  const { theme } = useTheme();
  
  // Handle both markdown (**bold**) and HTML (<strong>, <b>) formatting
  const parts = text.split(/(\*\*[^*]+\*\*|<strong>.*?<\/strong>|<b>.*?<\/b>|<em>.*?<\/em>|<i>.*?<\/i>)/g);
  
  return (
    <Text style={[style, { color: theme.foreground }]}>
      {parts.map((part, index) => {
        // Handle markdown bold
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <Text key={index} style={{ 
              fontWeight: '600', 
              fontFamily: 'HelveticaNeue-Bold',
              color: theme.foreground 
            }}>
              {boldText}
            </Text>
          );
        }
        // Handle HTML bold
        if ((part.startsWith('<strong>') && part.endsWith('</strong>')) || 
            (part.startsWith('<b>') && part.endsWith('</b>'))) {
          const boldText = part.replace(/<\/?(?:strong|b)>/g, '');
          return (
            <Text key={index} style={{ 
              fontWeight: '600', 
              fontFamily: 'HelveticaNeue-Bold',
              color: theme.foreground 
            }}>
              {boldText}
            </Text>
          );
        }
        // Handle HTML italic
        if ((part.startsWith('<em>') && part.endsWith('</em>')) || 
            (part.startsWith('<i>') && part.endsWith('</i>'))) {
          const italicText = part.replace(/<\/?(?:em|i)>/g, '');
          return (
            <Text key={index} style={{ 
              fontStyle: 'italic',
              color: theme.foreground 
            }}>
              {italicText}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
};

// Card-specific formatted text with line breaks after strong text
const CardFormattedText: React.FC<{ text: string; style: any }> = ({ text, style }) => {
  const { theme } = useTheme();
  
  // Remove semicolons and clean up the text
  const cleanedText = text.replace(/;\s*/g, ' ').trim();
  
  // Split by strong tags to add line breaks
  const parts = cleanedText.split(/(<strong>.*?<\/strong>|<b>.*?<\/b>|\*\*[^*]+\*\*)/g);
  
  return (
    <Text style={[style, { color: theme.foreground }]}>
      {parts.map((part, index) => {
        // Handle HTML bold with line break after
        if ((part.startsWith('<strong>') && part.endsWith('</strong>')) || 
            (part.startsWith('<b>') && part.endsWith('</b>'))) {
          const boldText = part.replace(/<\/?(?:strong|b)>/g, '');
          return (
            <Text key={index}>
              <Text style={{ 
                fontWeight: '600', 
                fontFamily: 'HelveticaNeue-Bold',
                color: theme.primary 
              }}>
                {boldText}
              </Text>
              {/* Add line break after strong text */}
              {index < parts.length - 1 && parts[index + 1]?.trim() && '\n\n'}
            </Text>
          );
        }
        // Handle markdown bold with line break after
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <Text key={index}>
              <Text style={{ 
                fontWeight: '600', 
                fontFamily: 'HelveticaNeue-Bold',
                color: theme.primary 
              }}>
                {boldText}
              </Text>
              {/* Add line break after strong text */}
              {index < parts.length - 1 && parts[index + 1]?.trim() && '\n\n'}
            </Text>
          );
        }
        // Regular text - trim leading whitespace if it follows a strong tag
        const trimmedPart = index > 0 && (
          parts[index - 1]?.startsWith('<strong>') || 
          parts[index - 1]?.startsWith('<b>') ||
          parts[index - 1]?.startsWith('**')
        ) ? part.trimStart() : part;
        
        return trimmedPart;
      })}
    </Text>
  );
};

// Helper function to get numbered emoji
const getNumberedEmoji = (index: number): string => {
  const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  return emojiNumbers[index] || `${index + 1}️⃣`;
};

// Source metadata interface
interface SourceMetadata {
  url: string;
  title: string;
  organization?: string;
  author?: string;
  publishedDate?: string;
  type: 'article' | 'report' | 'study' | 'government' | 'news' | 'academic';
  credibilityScore?: number;
  domain?: string;
}

// Compact Source Carousel Component with prioritized caching and loading states
const CompactSourceCarousel: React.FC<{
  sources: any[];
  onSourcePress: (url: string) => void;
}> = ({ sources, onSourcePress }) => {
  const { theme } = useTheme();
  const [sourceAnalysisMap, setSourceAnalysisMap] = useState<Map<string, SourceAnalysisResult>>(new Map());
  const [ogDataMap, setOgDataMap] = useState<Map<string, OpenGraphData>>(new Map());
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  // NEVER re-analyze cached sources - only check cache
  useEffect(() => {
    const fetchSourceData = async () => {
      if (sources.length === 0) {
        setIsInitialLoading(false);
        return;
      }
      
      setIsInitialLoading(true);
      const sourceAnalysisService = SourceAnalysisService.getInstance();
      const newSourceAnalysisMap = new Map<string, SourceAnalysisResult>();
      const newOgDataMap = new Map<string, OpenGraphData>();
      const newLoadingStates = new Map<string, boolean>();
      
      // Initialize loading states
      sources.forEach(source => {
        newLoadingStates.set(source.url, true);
      });
      setLoadingStates(newLoadingStates);

      try {
        // Check for existing cached analysis only - no new analysis
        const analysisPromises = sources.map(async (source) => {
          try {
            // Try to get existing analysis without triggering new analysis
            // We'll call analyzeSource but handle if it fails gracefully
            try {
              const existingAnalysis = await sourceAnalysisService.analyzeSource(source.url);
              
              if (existingAnalysis) {
                newSourceAnalysisMap.set(source.url, existingAnalysis);
                newLoadingStates.set(source.url, false);
                return { url: source.url, hasAnalysis: true };
              }
            } catch (analysisError) {
              // If analysis fails, just continue without it
              console.warn(`Analysis failed for ${source.url}, continuing without analysis:`, analysisError);
            }

            // No cached analysis available - that's fine, don't analyze
            newLoadingStates.set(source.url, false);
            return { url: source.url, hasAnalysis: false };
          } catch (error) {
            console.warn(`Cache check failed for ${source.url}:`, error);
            newLoadingStates.set(source.url, false);
            return { url: source.url, hasAnalysis: false };
          }
        });

        // Wait for all cache checks
        const analysisResults = await Promise.all(analysisPromises);
        
        // Update state with cached analysis results only
        setSourceAnalysisMap(newSourceAnalysisMap);
        setLoadingStates(new Map(newLoadingStates));

        // Get OG data for ALL sources (for background images)
        console.log(`📰 Fetching OG data for ${sources.length} sources for background images`);
        
        const ogPromises = sources.map(async (source) => {
          try {
            const ogData = await fetchOpenGraphData(source.url);
            newOgDataMap.set(source.url, ogData);
            console.log(`✅ OG data fetched for ${source.url}:`, { hasImage: !!ogData.image, image: ogData.image });
          } catch (error) {
            console.warn(`OG data failed for ${source.url}:`, error);
            newOgDataMap.set(source.url, {});
          }
        });

        await Promise.all(ogPromises);
        setOgDataMap(newOgDataMap);

        // Animate fade-in once data is ready
        setIsInitialLoading(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        console.log(`✅ Source data loaded: ${newSourceAnalysisMap.size} cached analyses, ${newOgDataMap.size} OG fallbacks`);
        
      } catch (error) {
        console.error('Error loading source data:', error);
        setIsInitialLoading(false);
      }
    };

    fetchSourceData();
  }, [sources, fadeAnim]);

  if (sources.length === 0) {
    return (
      <View style={styles.noSourcesContainer}>
        <Text style={styles.noSourcesIcon}>📚</Text>
        <Text style={[styles.noSourcesTitle, { color: theme.foreground }]}>
          No sources available yet
        </Text>
        <Text style={[styles.noSourcesDescription, { color: theme.foregroundSecondary }]}>
          Sources and references will be added as content is developed
        </Text>
      </View>
    );
  }

  // Parse and normalize source metadata
  const parseSourceMetadata = (source: any): SourceMetadata => {
    let parsedSource: SourceMetadata = {
      url: source.url || '',
      title: source.title || 'Untitled Source',
      type: source.type || 'article',
    };

    // Extract domain from URL
    try {
      const urlObj = new URL(source.url);
      parsedSource.domain = urlObj.hostname.replace('www.', '');
      
      // Determine organization from domain
      const domainToOrg: Record<string, string> = {
        'congress.gov': 'U.S. Congress',
        'senate.gov': 'U.S. Senate',
        'house.gov': 'U.S. House',
        'whitehouse.gov': 'White House',
        'cbo.gov': 'Congressional Budget Office',
        'gao.gov': 'Government Accountability Office',
        'supremecourt.gov': 'Supreme Court',
        'census.gov': 'U.S. Census Bureau',
        'nih.gov': 'National Institutes of Health',
        'cdc.gov': 'Centers for Disease Control',
        'npr.org': 'NPR',
        'reuters.com': 'Reuters',
        'ap.org': 'Associated Press',
        'nytimes.com': 'The New York Times',
        'washingtonpost.com': 'The Washington Post',
        'wsj.com': 'The Wall Street Journal',
        'politico.com': 'Politico',
        'brookings.edu': 'Brookings Institution',
        'heritage.org': 'Heritage Foundation',
        'cfr.org': 'Council on Foreign Relations',
        'pewresearch.org': 'Pew Research Center',
      };
      
      parsedSource.organization = domainToOrg[parsedSource.domain] || 
                                 source.organization || 
                                 parsedSource.domain?.split('.')[0]?.toUpperCase();
    } catch (error) {
      parsedSource.domain = 'unknown';
      parsedSource.organization = source.organization || 'Unknown Source';
    }

    // Parse other metadata
    parsedSource.author = source.author;
    parsedSource.publishedDate = source.published_date || source.publishedDate;
    parsedSource.credibilityScore = source.credibility_score || source.credibilityScore;

    return parsedSource;
  };

  const getSourceTypeIcon = (type: string): string => {
    const typeIcons: Record<string, string> = {
      'government': '🏛️',
      'academic': '🎓',
      'news': '📰',
      'report': '📊',
      'study': '🔬',
      'article': '📄',
    };
    return typeIcons[type] || '📄';
  };

  const getCredibilityColor = (score?: number): string => {
    if (!score) return '#6B7280';
    if (score >= 0.8) return '#10B981';
    if (score >= 0.6) return '#F59E0B';
    return '#EF4444';
  };

  // Show loading state while initial data is being fetched
  if (isInitialLoading) {
    return (
      <View style={styles.sourceLoadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={[styles.sourceLoadingText, { color: theme.foregroundSecondary }]}>
          Loading source analysis...
        </Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sourceCarouselContainer}
        snapToInterval={280 + spacing.md} // Larger card width
        decelerationRate="fast"
      >
        {sources.map((source, index) => {
          const sourceAnalysis = sourceAnalysisMap.get(source.url);
          const ogData = ogDataMap.get(source.url) || {};
          const isLoading = loadingStates.get(source.url) || false;
          const metadata = parseSourceMetadata(source);
          
          // Prioritize actual source thumbnails, then OG images, then domain fallbacks
          const backgroundImage = source.thumbnail || 
                                 source.image_url || 
                                 ogData.image || 
                                 getDomainFallbackImage(metadata.domain || '');
          
          const hasBackgroundImage = !!backgroundImage;
          console.log(`🖼️ Source ${source.title || source.name}: hasImage=${hasBackgroundImage}, image=${backgroundImage}`);
        
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.largeSourceCard,
              { 
                backgroundColor: hasBackgroundImage ? 'transparent' : theme.card,
                borderWidth: hasBackgroundImage ? 0 : 1,
                borderColor: hasBackgroundImage ? 'transparent' : theme.border,
              }
            ]}
            onPress={() => onSourcePress(source.url)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`View source: ${source.title || source.name}`}
          >
            {isLoading && (
              <View style={styles.sourceCardLoadingOverlay}>
                <LoadingSpinner size="small" />
              </View>
            )}
            
            {/* Background Image or Solid Background */}
            {hasBackgroundImage ? (
              <ImageBackground
                source={{ uri: backgroundImage }}
                style={styles.largeSourceCardBackground}
                imageStyle={styles.largeSourceCardBackgroundImage}
                onError={(error) => {
                  console.warn(`Image failed to load for ${source.url}:`, error);
                }}
              >
                <View style={styles.largeSourceCardOverlay}>
                  {/* Top section with credibility and analysis status */}
                  <View style={styles.largeSourceCardTop}>
                    <View style={styles.largeSourceCardTopLeft}>
                      {sourceAnalysis && (
                        <View style={[styles.largeSourceCardCredibilityBadge, {
                          backgroundColor: sourceAnalysis.overallCredibility >= 0.8 ? '#10B981' : 
                                          sourceAnalysis.overallCredibility >= 0.6 ? '#F59E0B' : '#EF4444'
                        }]}>
                          <Text style={styles.largeSourceCardCredibilityText}>
                            {Math.round(sourceAnalysis.overallCredibility * 100)}%
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.largeSourceCardTopRight}>
                      {sourceAnalysis && (
                        <View style={styles.largeSourceCardAnalyzedBadge}>
                          <Text style={styles.largeSourceCardAnalyzedText}>🤖 ANALYZED</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Content area */}
                  <View style={styles.largeSourceCardContent}>
                    <Text style={styles.largeSourceCardOrganization} numberOfLines={1}>
                      {metadata.organization}
                    </Text>
                    <Text style={styles.largeSourceCardTitle} numberOfLines={2}>
                      {source.title || source.name || 'Untitled Source'}
                    </Text>
                    {sourceAnalysis && (
                      <Text style={styles.largeSourceCardBias} numberOfLines={1}>
                        {sourceAnalysis.overallBias === 'center' ? '🔵 Center' :
                         sourceAnalysis.overallBias === 'left' ? '🔴 Left' :
                         sourceAnalysis.overallBias === 'lean_left' ? '🟠 Lean Left' :
                         sourceAnalysis.overallBias === 'right' ? '🔴 Right' :
                         sourceAnalysis.overallBias === 'lean_right' ? '🟠 Lean Right' :
                         sourceAnalysis.overallBias === 'mixed' ? '🟡 Mixed' : '⚪ Unknown'}
                      </Text>
                    )}
                  </View>

                  {/* Bottom action */}
                  <View style={styles.largeSourceCardBottom}>
                    <Text style={styles.largeSourceCardAction}>
                      {sourceAnalysis ? 'Tap for full analysis' : 'Tap to read article'}
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            ) : (
              /* No Background Image - Clean Card Layout */
              <View style={[styles.largeSourceCardBackground, { padding: spacing.md }]}>
                {/* Top section with credibility and analysis status */}
                <View style={styles.largeSourceCardTop}>
                  <View style={styles.largeSourceCardTopLeft}>
                    {sourceAnalysis && (
                      <View style={[styles.largeSourceCardCredibilityBadge, {
                        backgroundColor: sourceAnalysis.overallCredibility >= 0.8 ? '#10B981' : 
                                        sourceAnalysis.overallCredibility >= 0.6 ? '#F59E0B' : '#EF4444'
                      }]}>
                        <Text style={styles.largeSourceCardCredibilityText}>
                          {Math.round(sourceAnalysis.overallCredibility * 100)}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.largeSourceCardTopRight}>
                    {sourceAnalysis && (
                      <View style={[styles.largeSourceCardAnalyzedBadge, { backgroundColor: theme.primary + '20' }]}>
                        <Text style={[styles.largeSourceCardAnalyzedText, { color: theme.primary }]}>🤖 ANALYZED</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Content area */}
                <View style={styles.largeSourceCardContent}>
                  <Text style={[styles.largeSourceCardOrganization, { color: theme.primary }]} numberOfLines={1}>
                    {metadata.organization}
                  </Text>
                  <Text style={[styles.largeSourceCardTitle, { color: theme.foreground }]} numberOfLines={2}>
                    {source.title || source.name || 'Untitled Source'}
                  </Text>
                  {sourceAnalysis && (
                    <Text style={[styles.largeSourceCardBias, { color: theme.foregroundSecondary }]} numberOfLines={1}>
                      {sourceAnalysis.overallBias === 'center' ? '🔵 Center' :
                       sourceAnalysis.overallBias === 'left' ? '🔴 Left' :
                       sourceAnalysis.overallBias === 'lean_left' ? '🟠 Lean Left' :
                       sourceAnalysis.overallBias === 'right' ? '🔴 Right' :
                       sourceAnalysis.overallBias === 'lean_right' ? '🟠 Lean Right' :
                       sourceAnalysis.overallBias === 'mixed' ? '🟡 Mixed' : '⚪ Unknown'}
                    </Text>
                  )}
                </View>

                {/* Bottom action */}
                <View style={styles.largeSourceCardBottom}>
                  <Text style={[styles.largeSourceCardAction, { color: theme.foregroundSecondary }]}>
                    {sourceAnalysis ? 'Tap for full analysis' : 'Tap to read article'}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
      </ScrollView>
    </Animated.View>
  );
};

const formatPublishDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  } catch (error) {
    return 'recently';
  }
};

const formatReviewDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks}w ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  } catch (error) {
    return 'Recently';
  }
};

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.categoryBadge, { 
      backgroundColor: `${theme.primary}08`, 
      borderColor: `${theme.primary}20` 
    }]}>
      <Text style={[styles.categoryBadgeText, { color: theme.foreground }]}>
        {category}
      </Text>
    </View>
  );
};

// ============================================================================
// RATINGS & REVIEWS COMPONENTS
// ============================================================================

interface RatingOption {
  value: number;
  emoji: string;
  label: string;
  color: string;
}

const RATING_OPTIONS: RatingOption[] = [
  { value: 1, emoji: '😞', label: 'Poor', color: '#EF4444' },
  { value: 2, emoji: '😐', label: 'Fair', color: '#F97316' },
  { value: 3, emoji: '🙂', label: 'Good', color: '#EAB308' },
  { value: 4, emoji: '😊', label: 'Very Good', color: '#22C55E' },
  { value: 5, emoji: '🤩', label: 'Excellent', color: '#10B981' },
];

const TopicRatingSection: React.FC<{
  topicId: string;
  topicTitle: string;
}> = ({ topicId, topicTitle }) => {
  // Hooks with error handling and fallbacks
  const themeResult = useTheme();
  const authResult = useAuth();
  const uiStringsResult = useUIStrings();
  
  // Safely extract values with fallbacks
  const theme = themeResult?.theme || {
    background: '#FFFFFF',
    foreground: '#000000',
    primary: '#007AFF',
    border: '#E5E7EB',
    card: '#F9FAFB',
    foregroundSecondary: '#6B7280',
    foregroundTertiary: '#9CA3AF'
  };
  
  const user = authResult?.user;
  
  const uiStrings = uiStringsResult?.uiStrings || {
    topic: {
      editRating: 'Edit Rating',
      howHelpfulWasThis: 'How helpful was this?',
      ratingBreakdown: 'Rating Breakdown',
      noRatingsYet: 'No ratings yet',
      recentReviews: 'Recent Reviews',
      viewAllReviews: 'View All',
      noReviewsYet: 'No reviews yet',
      noReviewsDescription: 'Be the first to share your thoughts about this topic.',
      writeFirstReview: 'Write the first review',
      communityReviews: 'Community Reviews',
      shareYourThoughts: 'Share your thoughts and help other learners',
      completeQuizToReview: 'Complete the Quiz to Review',
      takeQuizToShare: 'Take the quiz to share your experience and help other learners!',
      wasThisHelpful: 'Was this helpful?',
      writeAReview: 'Write a Review',
      rateAndReview: 'Rate & Review',
      selectRating: 'Select Rating',
      submitReview: 'Submit Review',
      shareYourThoughtsDesc: 'Help other learners by describing what worked well or could be improved',
    }
  };
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userReview, setUserReview] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  // Completion tracking
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);
  const [completionData, setCompletionData] = useState<any>(null);
  const [checkingCompletion, setCheckingCompletion] = useState(true);
  
  // Will be replaced with real data from comprehensive review system
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);

  useEffect(() => {
    loadReviewData();
  }, [topicId, user?.id]);



  const loadReviewData = async () => {
    if (!topicId) {
      setLoading(false);
      return;
    }

    try {
      // Check completion status first
      if (user?.id) {
        const { data: completion, error: completionError } = await supabase
          .from('content_completions')
          .select('*')
          .eq('user_id', user.id)
          .eq('content_type', 'topic')
          .eq('content_id', topicId)
          .maybeSingle();

        if (!completionError || completionError.code === 'PGRST116') {
          setHasCompleted(!!completion);
          setCompletionData(completion);
        }
      }
      setCheckingCompletion(false);

      // Load review summary for aggregated data
      const { data: summary } = await supabase
        .from('review_summaries')
        .select('average_rating, total_reviews, rating_distribution')
        .eq('content_type', 'topic')
        .eq('content_id', topicId)
        .maybeSingle();

      if (summary) {
        setAverageRating(summary.average_rating || 0);
        setTotalRatings(summary.total_reviews || 0);
      } else {
        // No summary exists yet, set defaults
        setAverageRating(0);
        setTotalRatings(0);
      }

      // Load all public reviews for this topic with reviewer profiles
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('content_reviews')
        .select(`
          id,
          rating,
          review_text,
          helpful_count,
          not_helpful_count,
          created_at,
          updated_at,
          user_id,
          reviewer_profiles!content_reviews_reviewer_profile_fkey (
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .eq('content_type', 'topic')
        .eq('content_id', topicId)
        .eq('is_public', true)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (reviewsError) {
        console.error('Error loading reviews:', reviewsError);
        // Fallback query without foreign key join if migration not applied yet
        const { data: fallbackReviews } = await supabase
          .from('content_reviews')
          .select(`
            id,
            rating,
            review_text,
            helpful_count,
            not_helpful_count,
            created_at,
            updated_at,
            user_id
          `)
          .eq('content_type', 'topic')
          .eq('content_id', topicId)
          .eq('is_public', true)
          .eq('is_flagged', false)
          .order('created_at', { ascending: false })
          .limit(50);
        
        // Filter out user's own review and set others
        const otherReviews = fallbackReviews?.filter(review => 
          review.user_id !== user?.id && review.rating
        ) || [];
        setReviews(otherReviews);
      } else {
        // Filter out user's own review and set others
        const otherReviews = reviewsData?.filter(review => 
          review.user_id !== user?.id && (review.reviewer_profiles || review.rating)
        ) || [];
        setReviews(otherReviews);
      }

      // Load user's review if logged in
      if (user?.id) {
        const { data: userReviewData } = await supabase
          .from('content_reviews')
          .select('rating, review_text, created_at')
          .eq('user_id', user.id)
          .eq('content_type', 'topic')
          .eq('content_id', topicId)
          .maybeSingle();

        if (userReviewData) {
          setUserRating(userReviewData.rating);
          setUserReview(userReviewData.review_text || '');
        } else {
          setUserRating(null);
          setUserReview('');
        }
      }

    } catch (error) {
      console.error('Error loading review data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpfulnessVote = async (reviewId: string, isHelpful: boolean) => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to vote on review helpfulness.');
      return;
    }

    try {
      // Insert or update helpfulness vote
      const { data: existingVote, error: checkError } = await supabase
        .from('review_helpfulness_votes')
        .select('id, is_helpful')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingVote) {
        if (existingVote.is_helpful === isHelpful) {
          // Same vote - remove it (toggle off)
          const { error } = await supabase
            .from('review_helpfulness_votes')
            .delete()
            .eq('id', existingVote.id);

          if (error) throw error;
        } else {
          // Different vote - update it
          const { error } = await supabase
            .from('review_helpfulness_votes')
            .update({ is_helpful: isHelpful })
            .eq('id', existingVote.id);

          if (error) throw error;
        }
      } else {
        // New vote - insert it
        const { error } = await supabase
          .from('review_helpfulness_votes')
          .insert({
            review_id: reviewId,
            user_id: user.id,
            is_helpful: isHelpful,
          });

        if (error) throw error;
      }

      // Reload review data to update counts
      await loadReviewData();

    } catch (error) {
      console.error('Error submitting helpfulness vote:', error);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    }
  };

  const submitRating = async (rating: number, reviewText: string) => {
    if (!user?.id || !topicId) return;

    setSubmitting(true);
    try {
      // Note: Database trigger will validate completion, but we can add client-side messaging

      // Insert or update review in content_reviews table
      const { data: existingReview, error: checkError } = await supabase
        .from('content_reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_type', 'topic')
        .eq('content_id', topicId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let reviewData;
      if (existingReview) {
        // Update existing review
        const { data, error } = await supabase
          .from('content_reviews')
          .update({
            rating,
            review_text: reviewText || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingReview.id)
          .select()
          .single();

        if (error) throw error;
        reviewData = data;
      } else {
        // Insert new review (database trigger will validate completion)
        const { data, error } = await supabase
          .from('content_reviews')
          .insert({
            user_id: user.id,
            content_type: 'topic',
            content_id: topicId,
            content_title: topicTitle,
            rating,
            review_text: reviewText || null,
            is_verified_reviewer: false,
            is_public: true,
          })
          .select()
          .single();

        if (error) {
          if (error.message.includes('Cannot review content without completing it first')) {
            Alert.alert(
              '🎯 Complete the Quiz First!', 
              'You need to complete the quiz for this topic before you can review it. Take the quiz to share your experience with other learners!',
              [{ text: 'OK' }]
            );
            return;
          }
          throw error;
        }
        reviewData = data;
      }

      // Update local state
      setUserRating(rating);
      setUserReview(reviewText);
      setShowReviewModal(false);
      
      // Reload review data to update aggregated counts
      await loadReviewData();
      
      Alert.alert(
        '✅ Review Submitted!', 
        'Thank you for sharing your feedback. Your review helps other learners understand what to expect from this topic.'
      );

    } catch (error) {
      console.error('Error submitting review:', error);
      
      if (error instanceof Error && error.message.includes('Cannot review content without completing it first')) {
        Alert.alert(
          '🎯 Complete the Quiz First!', 
          'You need to complete the quiz for this topic before you can review it. Take the quiz to share your experience with other learners!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error', 
          'Failed to submit your review. Please check your connection and try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={size} color="#F59E0B" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={size} color="#F59E0B" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={size} color={theme.border} />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <Card style={styles.ratingContainer} variant="outlined">
        <View style={styles.ratingLoadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Loading ratings...
          </Text>
        </View>
      </Card>
    );
  }

  // Compact layout when no reviews
  if (totalRatings === 0) {
    return (
      <Card style={styles.ratingContainer} variant="outlined">
        <View style={styles.compactRatingHeader}>
          <Text style={styles.ratingHeaderEmoji}>💬</Text>
          <Text style={[styles.ratingHeaderTitle, { color: theme.foreground }]}>
            {uiStrings.topic.communityReviews}
          </Text>
          <Text style={[styles.ratingHeaderSubtitle, { color: theme.foregroundSecondary }]}>
            {uiStrings.topic.shareYourThoughts}
          </Text>

          {checkingCompletion ? (
            <View style={styles.compactCheckingState}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.compactCheckingText, { color: theme.foregroundSecondary }]}>
                Checking your progress...
              </Text>
            </View>
          ) : hasCompleted ? (
            <TouchableOpacity
              style={[styles.writeFirstReviewButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowReviewModal(true)}
            >
              <Text style={styles.writeFirstReviewText}>Write the first review</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.completionRequiredCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={styles.completionRequiredIcon}>🎯</Text>
              <Text style={[styles.completionRequiredTitle, { color: theme.foreground }]}>
                {uiStrings.topic.completeQuizToReview}
              </Text>
              <Text style={[styles.completionRequiredDesc, { color: theme.foregroundSecondary }]}>
                {uiStrings.topic.takeQuizToShare}
              </Text>
            </View>
          )}
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.ratingContainer} variant="outlined">
      <LinearGradient colors={[theme.primary + '08', 'transparent']} style={styles.ratingHeaderGradient}>
        <View style={styles.ratingHeader}>
          {/* Header */}
          <Text style={styles.ratingHeaderEmoji}>💬</Text>
          <Text style={[styles.ratingHeaderTitle, { color: theme.foreground }]}>
            {uiStrings.topic.communityReviews}
          </Text>
          <Text style={[styles.ratingHeaderSubtitle, { color: theme.foregroundSecondary }]}>
            <View style={styles.ratingStarsContainer}>
              {renderStars(averageRating, 16)}
            </View>
            <Text> {averageRating.toFixed(1)} • {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}</Text>
          </Text>

          {/* Recent Reviews */}
          <View style={styles.reviewsList}>
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
                {reviews.length > 0 ? uiStrings.topic.recentReviews : 'Reviews'}
              </Text>
              {reviews.length > 2 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setShowAllReviews(true)}
                >
                  <Text style={[styles.viewAllText, { color: theme.primary }]}>
                    {uiStrings.topic.viewAllReviews}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {reviews.length === 0 ? (
              <View style={styles.emptyReviewsState}>
                <Text style={styles.emptyReviewsIcon}>✍️</Text>
                <Text style={[styles.emptyReviewsTitle, { color: theme.foreground }]}>
                  {uiStrings.topic.noReviewsYet}
                </Text>
                <Text style={[styles.emptyReviewsDescription, { color: theme.foregroundSecondary }]}>
                  {checkingCompletion 
                    ? 'Checking your progress...'
                    : hasCompleted 
                      ? uiStrings.topic.noReviewsDescription
                      : 'Be the first to share your thoughts on this topic!'
                  }
                </Text>
                {checkingCompletion ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : hasCompleted ? (
                  <TouchableOpacity
                    style={[styles.writeFirstReviewButton, { backgroundColor: theme.primary }]}
                    onPress={() => setShowReviewModal(true)}
                  >
                    <Text style={styles.writeFirstReviewText}>{uiStrings.topic.writeFirstReview}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {/* User's Review First (if exists) */}
                {userRating && userReview && (
                  <View style={[styles.reviewCard, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '20' }]}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAuthor}>
                        <View style={[styles.authorAvatar, { backgroundColor: theme.primary }]}>
                          <Text style={[styles.authorInitial, { color: '#FFFFFF' }]}>
                            You
                          </Text>
                        </View>
                        <View style={styles.authorInfo}>
                          <Text style={[styles.authorName, { color: theme.foreground }]}>
                            Your Review
                          </Text>
                          <Text style={[styles.reviewDate, { color: theme.foregroundSecondary }]}>
                            Recently
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.userReviewActions}>
                        <View style={[styles.reviewRatingBadge, { backgroundColor: RATING_OPTIONS[userRating - 1]?.color + '20' || theme.muted }]}>
                          <Text style={styles.reviewRatingEmoji}>{RATING_OPTIONS[userRating - 1]?.emoji || '⭐'}</Text>
                          <Text style={[styles.reviewRatingText, { color: RATING_OPTIONS[userRating - 1]?.color || theme.foreground }]}>
                            {RATING_OPTIONS[userRating - 1]?.label || 'Rating'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.editRatingButton, { backgroundColor: theme.primary + '20' }]}
                          onPress={() => setShowReviewModal(true)}
                        >
                          <Ionicons name="create-outline" size={16} color={theme.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <Text style={[styles.reviewText, { color: theme.foreground }]}>
                      {userReview}
                    </Text>
                  </View>
                )}

                {/* Other Reviews */}
                {reviews.slice(0, showAllReviews ? reviews.length : 2).map((review: any) => {
                  // Handle both new structure (with reviewer_profiles) and fallback
                  const reviewerProfile = review.reviewer_profiles?.[0] || review.reviewer_profiles;
                  const displayName = reviewerProfile?.display_name || 'Anonymous';
                  const isVerified = reviewerProfile?.is_verified || false;
                  
                  return (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewAuthor}>
                          <View style={[styles.authorAvatar, { backgroundColor: theme.primary + '20' }]}>
                            <Text style={[styles.authorInitial, { color: theme.primary }]}>
                              {displayName.charAt(0)}
                            </Text>
                          </View>
                          <View style={styles.authorInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                              <Text style={[styles.authorName, { color: theme.foreground }]}>
                                {displayName}
                              </Text>
                              {isVerified && (
                                <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
                              )}
                            </View>
                            <Text style={[styles.reviewDate, { color: theme.foregroundSecondary }]}>
                              {formatReviewDate(review.created_at)}
                            </Text>
                          </View>
                        </View>
                      
                        <View style={[styles.reviewRatingBadge, { backgroundColor: RATING_OPTIONS[review.rating - 1]?.color + '20' || theme.muted }]}>
                          <Text style={styles.reviewRatingEmoji}>{RATING_OPTIONS[review.rating - 1]?.emoji || '⭐'}</Text>
                          <Text style={[styles.reviewRatingText, { color: RATING_OPTIONS[review.rating - 1]?.color || theme.foreground }]}>
                            {RATING_OPTIONS[review.rating - 1]?.label || 'Rating'}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={[styles.reviewText, { color: theme.foreground }]}>
                        {review.review_text}
                      </Text>

                      {/* Helpfulness Votes */}
                      {user && (
                        <View style={styles.reviewActions}>
                          <Text style={[styles.helpfulnessText, { color: theme.foregroundSecondary }]}>
                            {(uiStrings as any).topic?.wasThisHelpful || 'Was this helpful?'}
                          </Text>
                          <View style={styles.helpfulnessButtons}>
                            <TouchableOpacity 
                              style={styles.helpfulnessButton}
                              onPress={() => handleHelpfulnessVote(review.id, true)}
                            >
                              <Ionicons name="thumbs-up-outline" size={16} color={theme.foregroundSecondary} />
                              <Text style={[styles.helpfulnessCount, { color: theme.foregroundSecondary }]}>
                                {review.helpful_count || 0}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.helpfulnessButton}
                              onPress={() => handleHelpfulnessVote(review.id, false)}
                            >
                              <Ionicons name="thumbs-down-outline" size={16} color={theme.foregroundSecondary} />
                              <Text style={[styles.helpfulnessCount, { color: theme.foregroundSecondary }]}>
                                {review.not_helpful_count || 0}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}

                {!showAllReviews && reviews.length > 2 && (
                  <TouchableOpacity
                    style={[styles.showMoreButton, { backgroundColor: theme.muted }]}
                    onPress={() => setShowAllReviews(true)}
                  >
                    <Text style={[styles.showMoreText, { color: theme.foreground }]}>
                      Show {reviews.length - 2} more reviews
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Write Review Button (if user hasn't reviewed) */}
                {!userRating && (
                  <TouchableOpacity
                    style={[styles.writeReviewButton, { backgroundColor: theme.primary }]}
                    onPress={() => setShowReviewModal(true)}
                  >
                    <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.writeReviewButtonText}>
                      {(uiStrings as any).topic?.writeAReview || 'Write a Review'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity
              onPress={() => setShowReviewModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.foreground }]}>
              {(uiStrings as any).topic?.rateAndReview || 'Rate & Review'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (!userRating) {
                  Alert.alert('Rating Required', 'Please select a rating before submitting your review.');
                  return;
                }
                submitRating(userRating, userReview);
              }}
              disabled={submitting}
              style={[
                styles.modalSaveButton,
                { backgroundColor: userRating && !submitting ? theme.primary : theme.muted },
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSaveText}>
                  {userRating ? ((uiStrings as any).topic?.submitReview || 'Submit Review') : ((uiStrings as any).topic?.selectRating || 'Select Rating')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalSubtitle, { color: theme.foregroundSecondary }]}>
              Rate "{topicTitle}" and share your experience
            </Text>
            
            <Text style={[styles.modalSectionTitle, { color: theme.foreground }]}>
              How helpful was this topic? *
            </Text>

            <View style={styles.modalStarRating}>
              {RATING_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalRatingOption,
                    {
                      backgroundColor: userRating === option.value ? option.color + '20' : theme.card,
                      borderColor: userRating === option.value ? option.color : theme.border,
                    },
                  ]}
                  onPress={() => setUserRating(option.value)}
                >
                  <Text style={styles.modalRatingEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.modalRatingLabel,
                    { color: userRating === option.value ? option.color : theme.foreground }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.reviewLabel, { color: theme.foreground }]}>
              Share your thoughts
            </Text>
            <Text style={[styles.reviewHelpText, { color: theme.foregroundSecondary }]}>
              {(uiStrings as any).topic?.shareYourThoughtsDesc || 'Help other learners by describing what worked well or could be improved'}
            </Text>
            <TextInput
              style={[
                styles.reviewTextInput,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.foreground,
                },
              ]}
              placeholder="What did you think of this topic? Was it clear? Engaging? How could it be improved?"
              placeholderTextColor={theme.foregroundSecondary}
              value={userReview}
              onChangeText={setUserReview}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </ScrollView>
        </View>
      </Modal>
    </Card>
  );
};

export default function TopicInfoScreen() {
  // Hooks with error handling and fallbacks
  const themeResult = useTheme();
  const authResult = useAuth();
  const uiStringsResult = useUIStrings();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // Safely extract values with fallbacks
  const theme = themeResult?.theme || {
    background: '#FFFFFF',
    foreground: '#000000',
    primary: '#007AFF',
    border: '#E5E7EB',
    card: '#F9FAFB',
    foregroundSecondary: '#6B7280',
    foregroundTertiary: '#9CA3AF'
  };
  
  const user = authResult?.user;
  
  const uiStrings = uiStringsResult?.uiStrings || {
    topic: {
      // Topic stats
      questions: 'Questions',
      questionsLabel: 'Questions',
      estMin: 'Est. Min',
      estimatedMinutesLabel: 'Est. Min',
      level: 'Level',
      levelLabel: 'Level',
      medium: 'Medium',
      
      // Main content
      whyThisMatters: 'Why This Matters',
      thinkYouGotIt: 'Think You Got It?',
      testYourUnderstanding: 'Test your understanding with our interactive quiz',
      startQuiz: 'Start Quiz',
      sourcesAndReferences: 'Sources & References',
      understandingSourceAnalysis: 'Understanding Source Analysis',
      biasRatingsMeaning: 'What do bias ratings mean?',
      credibilityPercentageMeaning: 'What does the credibility percentage mean?',
      howRatingsDetermined: 'How are these ratings determined?',
      areRatingsPermanent: 'Are these ratings permanent?',
      sourceAnalysisImportance: 'Why is source analysis important?',
      
      // Reviews section
      editRating: 'Edit Rating',
      howHelpfulWasThis: 'How helpful was this?',
      ratingBreakdown: 'Rating Breakdown',
      noRatingsYet: 'No ratings yet',
      recentReviews: 'Recent Reviews',
      viewAllReviews: 'View All',
      noReviewsYet: 'No reviews yet',
      noReviewsDescription: 'Be the first to share your thoughts about this topic.',
      writeFirstReview: 'Write the first review',
      communityReviews: 'Community Reviews',
      shareYourThoughts: 'Share your thoughts and help other learners',
      completeQuizToReview: 'Complete the Quiz to Review',
      takeQuizToShare: 'Take the quiz to share your experience and help other learners!',
      wasThisHelpful: 'Was this helpful?',
      writeAReview: 'Write a Review',
      rateAndReview: 'Rate & Review',
      selectRating: 'Select Rating',
      submitReview: 'Submit Review',
      shareYourThoughtsDesc: 'Help other learners by describing what worked well or could be improved',
      
      // Menu actions
      translateThisPage: 'Translate This Page',
      bookmark: 'Bookmark This',
      removeBookmark: 'Remove Bookmark',
      share: 'Share',
    },
    translation: {
      checkingTranslations: 'Checking translations...',
      selectLanguage: 'Select Language',
      original: 'Original',
      translated: 'AI Translation',
      translating: 'Translating...',
      translationComplete: 'Translation preferences are saved automatically',
      languagePreferenceSaved: 'Language preference saved automatically',
    }
  };
  
  const setUILanguage = uiStringsResult?.setUILanguage || (() => {});
  const [loading, setLoading] = useState(true);
  const [topicData, setTopicData] = useState<TopicData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Glossary drawer state
  const [selectedGlossaryTerm, setSelectedGlossaryTerm] = useState<GlossaryTerm | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerAnimation] = useState(new Animated.Value(0));
  
  // Source analysis drawer state
  const [sourceDrawerVisible, setSourceDrawerVisible] = useState(false);
  const [selectedSourceAnalysis, setSelectedSourceAnalysis] = useState<SourceAnalysisResult | null>(null);
  const [selectedSourceOG, setSelectedSourceOG] = useState<OpenGraphData | null>(null);
  const [selectedSourceURL, setSelectedSourceURL] = useState<string | null>(null);
  const [sourceDrawerLoading, setSourceDrawerLoading] = useState(false);
  const sourceDrawerAnimation = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  
  // FAQ expanded state
  const [faqExpanded, setFaqExpanded] = useState(false);

  // Translation controls state
  const [translationControlsVisible, setTranslationControlsVisible] = useState(false);
  
  // Header menu state
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  
  // Language selection and translation state
  const [languageSelectionVisible, setLanguageSelectionVisible] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<Record<string, string>>({});
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState('');
  const [showScannerOverlay, setShowScannerOverlay] = useState(false);
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<{code: string, name: string} | null>(null);
  
  // Available languages for translation
  const availableLanguages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  ];
  
  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Auto-translation loading animation (kept for loading states)
  const translationIconRotation = useRef(new Animated.Value(0)).current;



  const loadTopicData = useCallback(async () => {
    if (!id) {
      setError('Topic ID not provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch topic data with translations directly from database
      let topicWithTranslations: any;
      
      const { data: topicFromDB, error: topicError } = await supabase
        .from('question_topics')
        .select('*')
        .eq('topic_id', id)
        .single();

      if (topicError || !topicFromDB) {
        // Fallback to standard service
        const topicResponse = await standardDataService.fetchTopicById(id);
        if (topicResponse.error) {
          throw new Error(topicResponse.error.message);
        }
        topicWithTranslations = topicResponse.data;
      } else {
        topicWithTranslations = topicFromDB;
      }

      // Fetch questions in parallel
      const questionsResponse = await standardDataService.fetchQuestions(id, { limit: 100, useCache: true });
      
      if (topicWithTranslations) {
        // Aggregate sources from all questions
        let allSources: any[] = [];
        if (questionsResponse.data && questionsResponse.data.length > 0) {
          questionsResponse.data.forEach((question, index) => {
            if (question.sources) {
              try {
                // Handle different source formats (array, string, or already parsed)
                let questionSources: any[] = [];
                
                if (Array.isArray(question.sources)) {
                  questionSources = question.sources;
                } else if (typeof question.sources === 'string') {
                  // Parse JSON string if needed
                  questionSources = JSON.parse(question.sources);
                } else if (question.sources && typeof question.sources === 'object') {
                  // Single source object
                  questionSources = [question.sources];
                }

                // Ensure each source has the expected structure
                const validSources = questionSources.filter(source => 
                  source && source.url && (source.name || source.title)
                ).map(source => ({
                  ...source,
                  title: source.title || source.name, // Normalize title field
                  name: source.name || source.title,   // Keep both for compatibility
                }));

                allSources.push(...validSources);
                
                console.log(`📝 Question ${index + 1} has ${validSources.length} valid sources`);
              } catch (error) {
                console.warn(`⚠️ Failed to parse sources for question ${index + 1}:`, error);
              }
            }
          });
        }

        // Remove duplicate sources based on URL
        const uniqueSources = allSources.filter((source, index, self) => 
          index === self.findIndex(s => s.url === source.url)
        );

        const topic: TopicData = {
          id: topicWithTranslations.id || topicWithTranslations.topic_id || '',
          title: topicWithTranslations.title || topicWithTranslations.topic_title || '',
          description: topicWithTranslations.description || '',
          emoji: topicWithTranslations.emoji,
          why_this_matters: topicWithTranslations.why_this_matters,
          categories: topicWithTranslations.categories || [],
          sources: uniqueSources, // Use aggregated sources from questions
          question_count: questionsResponse.data?.length || topicWithTranslations.question_count,
          difficulty_level: topicWithTranslations.difficulty_level,
          created_at: topicWithTranslations.created_at,
          // Store raw translations data for later use
          translations: topicWithTranslations.translations || {},
        };

        // Add debugging for sources and translations
        console.log('📊 Topic data loaded:', {
          title: topic.title,
          questionsCount: questionsResponse.data?.length || 0,
          sourcesCount: topic.sources?.length || 0,
          sources: topic.sources,
          hasWhyThisMatters: !!topic.why_this_matters,
          categories: topic.categories,
          hasTranslations: !!topicWithTranslations.translations,
          availableLanguages: topicWithTranslations.translations ? Object.keys(topicWithTranslations.translations.title || {}) : []
        });

        setTopicData(topic);

        // Check if we have saved language preference and load translations
        try {
          const savedLanguage = await AsyncStorage.getItem('preferred_language');
          if (savedLanguage && savedLanguage !== 'en' && topicWithTranslations.translations) {
            console.log(`🌍 Checking for existing ${savedLanguage} translations...`);
            
            // Check if translations exist for this language
            const hasTitle = topicWithTranslations.translations.title?.[savedLanguage];
            const hasDescription = topicWithTranslations.translations.description?.[savedLanguage];
            const hasWhyThisMatters = topicWithTranslations.translations.why_this_matters?.[savedLanguage];
            const hasCategories = topicWithTranslations.translations.categories?.[savedLanguage];
            
            if (hasTitle || hasDescription || hasWhyThisMatters || hasCategories) {
              console.log(`✅ Found existing ${savedLanguage} translations, loading them`);
              
              const existingTranslations: Record<string, any> = {};
              if (hasTitle) existingTranslations.title = hasTitle;
              if (hasDescription) existingTranslations.description = hasDescription;
              if (hasWhyThisMatters) existingTranslations.whyThisMatters = hasWhyThisMatters;
              if (hasCategories) existingTranslations.categories = hasCategories;
              
              setTranslatedContent(existingTranslations);
              setCurrentLanguage(savedLanguage);
            }
          }
        } catch (error) {
          console.error('Error loading language preference:', error);
        }
      } else {
        throw new Error('Topic not found');
      }
    } catch (error) {
      console.error('Error loading topic:', error);
      setError(error instanceof Error ? error.message : 'Failed to load topic');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTopicData();
  }, [loadTopicData]);

  const handleShare = async () => {
    if (!topicData) return;

    try {
      const topicUrl = `https://civicsense.com/topic/${topicData.id}`;
      const shareMessage = `Check out "${topicData.title}" on CivicSense! 🏛️\n\n${topicData.description}\n\nLearn more about this topic:\n${topicUrl}\n\nDiscover how power actually works in America and start your civic learning journey.\n\n#CivicSense #Democracy #PowerAwareness`;
      
      await Share.share({
        message: shareMessage,
        title: `CivicSense - ${topicData.title}`,
        url: topicUrl,
      });
    } catch (error) {
      console.error('Error sharing topic:', error);
      Alert.alert('Error', 'Failed to share topic. Please try again.');
    }
  };

  // Check bookmark status when component mounts
  useEffect(() => {
    checkBookmarkStatus();
  }, [id, user?.id]);

  const checkBookmarkStatus = async () => {
    if (!user?.id || !id) return;

    try {
      const { bookmarks } = await BookmarkService.getBookmarks(user.id, {
        contentType: 'topic',
        limit: 100,
      });

      const existingBookmark = bookmarks.find(
        (bookmark: any) => bookmark.content_id === id
      );

      setIsBookmarked(!!existingBookmark);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to bookmark content.', [
        { text: 'OK' }
      ]);
      return;
    }

    if (!id || !topicData || bookmarkLoading) return;

    setBookmarkLoading(true);

    try {
      if (isBookmarked) {
        // Use the specific bookmarkTopic method that handles the logic
        const { bookmarks } = await BookmarkService.getBookmarks(user.id, { 
          contentType: 'topic',
          limit: 100 
        });
        const existingBookmark = bookmarks.find((bookmark: any) => bookmark.content_id === id);

        if (existingBookmark) {
          const { error } = await BookmarkService.deleteBookmark(user.id, (existingBookmark as any).id);
          if (error) throw error;
          
          setIsBookmarked(false);
          setHeaderMenuVisible(false);
          Alert.alert('🗑️ Bookmark Removed', 'Topic removed from your saved items.');
        }
      } else {
        // Use the specific bookmarkTopic method
        const { bookmark, error } = await BookmarkService.bookmarkTopic(
          user.id, 
          id, 
          topicData.title, 
          topicData.description
        );

        if (error && error.message !== 'Content already bookmarked') {
          throw error;
        }

        setIsBookmarked(true);
        setHeaderMenuVisible(false);
        Alert.alert('⭐ Bookmarked!', 'Topic saved to your bookmarks.');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      const errorMessage = error instanceof Error && error.message === 'Content already bookmarked'
        ? 'This content is already in your bookmarks!'
        : 'Failed to update bookmark. Please try again.';
      
      Alert.alert('Error', errorMessage);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleStartQuiz = () => {
    router.push(`/game-room/${id}` as any);
  };



  const handleSourcePress = async (url: string) => {
    setSourceDrawerLoading(true);
    setSourceDrawerVisible(true);
    setSelectedSourceURL(url); // Store the original URL for the external button
    
    try {
      // Get source analysis and OG data
      const sourceAnalysisService = SourceAnalysisService.getInstance();
      const [analysis, ogData] = await Promise.all([
        sourceAnalysisService.analyzeSource(url),
        fetchOpenGraphData(url).catch(() => ({})) // Use fallback on OG error
      ]);
      
      setSelectedSourceAnalysis(analysis);
      setSelectedSourceOG(ogData);
      
      // Animate drawer up
      Animated.spring(sourceDrawerAnimation, {
        toValue: 0,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
      
    } catch (error) {
      console.error('Error loading source details:', error);
      Alert.alert('Error', 'Could not load source analysis. Please try again.');
      setSourceDrawerVisible(false);
    } finally {
      setSourceDrawerLoading(false);
    }
  };



  // Save language preference
  const saveLanguagePreference = async (languageCode: string) => {
    try {
      await AsyncStorage.setItem('preferred_language', languageCode);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Enhanced translation with smooth animations
  const [translationScale] = useState(new Animated.Value(1));
  const [translationOpacity] = useState(new Animated.Value(1));

  // Save translations to database with proper merging including categories
  const saveTranslationsToDatabase = async (translations: Record<string, any>, targetLanguage: string) => {
    try {
      console.log(`💾 Saving translations to database for language: ${targetLanguage}`);
      console.log('🔍 Translations to save:', {
        hasTitle: !!translations.title,
        hasDescription: !!translations.description,
        hasWhyThisMatters: !!translations.whyThisMatters,
        hasCategories: !!translations.categories,
        categoriesLength: translations.categories?.length,
        categoriesPreview: translations.categories?.slice(0, 2)
      });
      
      // Save topic translations with proper merging
      if (translations.title || translations.description || translations.whyThisMatters || translations.categories) {
        // First, get existing translations from database
        const { data: existingTopic, error: fetchError } = await supabase
          .from('question_topics')
          .select('translations')
          .eq('topic_id', id)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching existing translations:', fetchError);
          return;
        }

        // Get existing translations or initialize empty object
        const existingTranslations = existingTopic?.translations || {};
        console.log('📚 Existing translations structure:', {
          hasTitle: !!existingTranslations.title,
          hasDescription: !!existingTranslations.description,
          hasWhyThisMatters: !!existingTranslations.why_this_matters,
          hasCategories: !!existingTranslations.categories,
          existingLanguages: {
            title: Object.keys(existingTranslations.title || {}),
            description: Object.keys(existingTranslations.description || {}),
            why_this_matters: Object.keys(existingTranslations.why_this_matters || {}),
            categories: Object.keys(existingTranslations.categories || {})
          }
        });
        
        // Build the updated translations object with proper JSONB structure
        const updatedTranslations = {
          ...existingTranslations,
          // Title translations - ensure we preserve all existing languages
          ...(translations.title && {
            title: {
              ...(existingTranslations.title || {}),
              [targetLanguage]: translations.title
            }
          }),
          // Description translations - ensure we preserve all existing languages
          ...(translations.description && {
            description: {
              ...(existingTranslations.description || {}),
              [targetLanguage]: translations.description
            }
          }),
          // Why this matters translations - ensure we preserve all existing languages
          ...(translations.whyThisMatters && {
            why_this_matters: {
              ...(existingTranslations.why_this_matters || {}),
              [targetLanguage]: translations.whyThisMatters
            }
          }),
          // Categories translations - ensure we preserve all existing languages
          ...(translations.categories && Array.isArray(translations.categories) && {
            categories: {
              ...(existingTranslations.categories || {}),
              [targetLanguage]: translations.categories
            }
          })
        };

        console.log('📝 Updated translations structure:', {
          titleLanguages: Object.keys(updatedTranslations.title || {}),
          descriptionLanguages: Object.keys(updatedTranslations.description || {}),
          whyThisMattersLanguages: Object.keys(updatedTranslations.why_this_matters || {}),
          categoriesLanguages: Object.keys(updatedTranslations.categories || {}),
          newCategoriesForLanguage: updatedTranslations.categories?.[targetLanguage],
          fullStructure: JSON.stringify(updatedTranslations, null, 2)
        });

        const { error: topicError } = await supabase
          .from('question_topics')
          .update({
            translations: updatedTranslations
          })
          .eq('topic_id', id);

        if (topicError) {
          console.error('❌ Error saving topic translations:', topicError);
          throw topicError;
        } else {
          console.log('✅ Topic translations saved to database successfully');
          console.log('🔍 Saved translations verification:', {
            titleSaved: !!updatedTranslations.title?.[targetLanguage],
            descriptionSaved: !!updatedTranslations.description?.[targetLanguage],
            whyThisMattersaved: !!updatedTranslations.why_this_matters?.[targetLanguage],
            categoriesSaved: !!updatedTranslations.categories?.[targetLanguage],
            categoriesCount: updatedTranslations.categories?.[targetLanguage]?.length || 0
          });
          
          // Update local state to reflect saved translations
          const newTranslatedContent: Record<string, any> = {};
          if (updatedTranslations.title?.[targetLanguage]) {
            newTranslatedContent.title = updatedTranslations.title[targetLanguage];
          }
          if (updatedTranslations.description?.[targetLanguage]) {
            newTranslatedContent.description = updatedTranslations.description[targetLanguage];
          }
          if (updatedTranslations.why_this_matters?.[targetLanguage]) {
            newTranslatedContent.whyThisMatters = updatedTranslations.why_this_matters[targetLanguage];
          }
          if (updatedTranslations.categories?.[targetLanguage]) {
            newTranslatedContent.categories = updatedTranslations.categories[targetLanguage];
            console.log('✅ Categories updated in local state:', newTranslatedContent.categories);
          }
          setTranslatedContent(newTranslatedContent);
          
          // Also update the topicData translations for future reference
          setTopicData(prev => prev ? {
            ...prev,
            translations: updatedTranslations
          } : prev);
        }
      }

          // Get and translate all questions for this topic
    setTranslationProgress(uiStrings.translation.checkingTranslations);
    const { data: questions } = await supabase
      .from('questions')
      .select('id, text, correct_answer, explanation, translations')
      .eq('topic_id', id);

    if (questions && questions.length > 0) {
      console.log(`🌍 Checking translations for ${questions.length} questions...`);
      
      let questionsNeedingTranslation = 0;
      
      // First pass: check which questions need translation
      for (const question of questions) {
        const existingQuestionTranslations = question.translations || {};
        const hasText = existingQuestionTranslations.text?.[targetLanguage];
        const hasAnswer = existingQuestionTranslations.correct_answer?.[targetLanguage];
        const hasExplanation = !question.explanation || existingQuestionTranslations.explanation?.[targetLanguage];
        
        if (!hasText || !hasAnswer || !hasExplanation) {
          questionsNeedingTranslation++;
        }
      }
      
      if (questionsNeedingTranslation === 0) {
        console.log(`✅ All questions already have translations for ${targetLanguage}`);
        setTranslationProgress('All questions already translated');
        return;
      }
      
      console.log(`🌍 Translating ${questionsNeedingTranslation} questions that need translation...`);
      
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        // Get existing question translations
        const existingQuestionTranslations = question.translations || {};
        
        // Check what's missing
        const hasText = existingQuestionTranslations.text?.[targetLanguage];
        const hasAnswer = existingQuestionTranslations.correct_answer?.[targetLanguage];
        const hasExplanation = !question.explanation || existingQuestionTranslations.explanation?.[targetLanguage];
        
        // Skip if all translations exist
        if (hasText && hasAnswer && hasExplanation) {
          console.log(`✅ Question ${i + 1} already fully translated, skipping`);
          continue;
        }
        
        setTranslationProgress(`Translating question ${i + 1}/${questions.length}...`);
        
        try {
          const questionTranslations = { ...existingQuestionTranslations };
          let translationNeeded = false;

          // Translate question text if missing
          if (question.text && !hasText) {
            const translatedText = await deepLTranslationService.translateText(
              question.text,
              targetLanguage,
              { preserveCivicTerms: true }
            );
            questionTranslations.text = {
              ...existingQuestionTranslations.text,
              [targetLanguage]: translatedText
            };
            translationNeeded = true;
            console.log(`🌍 Translated question text for question ${i + 1}`);
          }

          // Translate correct answer if missing
          if (question.correct_answer && !hasAnswer) {
            const translatedAnswer = await deepLTranslationService.translateText(
              question.correct_answer,
              targetLanguage,
              { preserveCivicTerms: true }
            );
            questionTranslations.correct_answer = {
              ...existingQuestionTranslations.correct_answer,
              [targetLanguage]: translatedAnswer
            };
            translationNeeded = true;
            console.log(`🌍 Translated answer for question ${i + 1}`);
          }

          // Translate explanation if exists and missing
          if (question.explanation && !hasExplanation) {
            const translatedExplanation = await deepLTranslationService.translateText(
              question.explanation,
              targetLanguage,
              { preserveCivicTerms: true }
            );
            questionTranslations.explanation = {
              ...existingQuestionTranslations.explanation,
              [targetLanguage]: translatedExplanation
            };
            translationNeeded = true;
            console.log(`🌍 Translated explanation for question ${i + 1}`);
          }

          // Only save if we actually translated something
          if (translationNeeded) {
            const { error: questionError } = await supabase
              .from('questions')
              .update({
                translations: questionTranslations
              })
              .eq('id', question.id);

            if (questionError) {
              console.error(`❌ Error saving translations for question ${question.id}:`, questionError);
            } else {
              console.log(`✅ Question ${i + 1} translations saved`);
            }
          }

        } catch (error) {
          console.error(`❌ Error translating question ${i + 1}:`, error);
        }
      }

      console.log(`💾 All question translations completed for ${targetLanguage}`);
    }

    } catch (error) {
      console.error('❌ Error saving translations to database:', error);
    }
  };

  // Enhanced translate content function with categories and source metadata
  const translateContent = async (targetLanguage: string) => {
    if (!topicData || targetLanguage === 'en') {
      console.log('🌍🔥 Resetting to English');
      setTranslatedContent({});
      setCurrentLanguage('en');
      return;
    }

    console.log(`🌍🔥 Starting translation to ${targetLanguage}`);

    try {
      // Check if translations already exist in the topicData (loaded from database)
      if (topicData.translations) {
        const dbTranslations = topicData.translations;
        console.log('📚 Found existing translations in topic data:', dbTranslations);

        // Check if we have translations for this language
        const hasTitle = dbTranslations.title?.[targetLanguage];
        const hasDescription = dbTranslations.description?.[targetLanguage];
        const hasWhyThisMatters = dbTranslations.why_this_matters?.[targetLanguage];
        const hasCategories = dbTranslations.categories?.[targetLanguage];

        if (hasTitle || hasDescription || hasWhyThisMatters || hasCategories) {
          console.log(`✅ Using existing ${targetLanguage} translations from database`);
          
          const translations: Record<string, any> = {};
          if (hasTitle) translations.title = dbTranslations.title[targetLanguage];
          if (hasDescription) translations.description = dbTranslations.description[targetLanguage];
          if (hasWhyThisMatters) translations.whyThisMatters = dbTranslations.why_this_matters[targetLanguage];
          if (hasCategories) translations.categories = dbTranslations.categories[targetLanguage];
          
          setTranslatedContent(translations);
          
          // Still save to database to trigger question translations if needed
          await saveTranslationsToDatabase(translations, targetLanguage);
          return;
        }
      }

      // If no existing translations, proceed with new translation
      console.log(`🌍 No existing ${targetLanguage} translations found, creating new ones...`);

      // Initialize the translation service
      await deepLTranslationService.initialize();
      
      const translations: Record<string, any> = {};
      let successfulTranslations = 0;

      // Prepare content to translate including categories
      const contentToTranslate = [
        { key: 'title', text: topicData.title },
        { key: 'description', text: topicData.description },
        ...(topicData.why_this_matters ? [{ key: 'whyThisMatters', text: topicData.why_this_matters }] : [])
      ];

      // Translate categories if they exist
      if (topicData.categories && topicData.categories.length > 0) {
        try {
          console.log(`🌍🔥 Translating ${topicData.categories.length} categories to ${targetLanguage}`);
          const translatedCategories = await Promise.all(
            topicData.categories.map(async (category) => {
              if (typeof category === 'string') {
                return await deepLTranslationService.translateText(
                  category,
                  targetLanguage,
                  { preserveCivicTerms: true }
                );
              }
              return category;
            })
          );
          translations.categories = translatedCategories;
          console.log(`✅ Successfully translated categories:`, translatedCategories);
        } catch (error) {
          console.error(`❌ Error translating categories:`, error);
          translations.categories = topicData.categories; // Fallback to original
        }
      }

      console.log(`🌍🔥 Translating ${contentToTranslate.length} text sections to ${targetLanguage}`);
      
      for (const { key, text } of contentToTranslate) {
        try {
          console.log(`🌍🔥 Translating ${key}: ${text.substring(0, 50)}...`);
          
          const translatedText = await deepLTranslationService.translateText(
            text, 
            targetLanguage, 
            { preserveCivicTerms: true }
          );
          
          console.log(`🌍🔥 Translation result for ${key}: ${translatedText.substring(0, 50)}...`);
          
          if (translatedText && translatedText.trim().length > 0) {
            translations[key] = translatedText;
            successfulTranslations++;
            console.log(`✅ Successfully translated ${key}`);
          } else {
            console.warn(`⚠️ Empty translation for ${key}`);
            translations[key] = text; // Keep original
          }
        } catch (error) {
          console.error(`❌ Error translating ${key}:`, error);
          translations[key] = text; // Fallback to original
        }
      }

      console.log(`🌍🔥 Translation summary:`, {
        total: contentToTranslate.length,
        successful: successfulTranslations,
        translatedKeys: Object.keys(translations),
        sampleTranslation: translations.title?.substring(0, 50) + '...',
        categoriesTranslated: !!translations.categories
      });

      // Set the translated content
      setTranslatedContent(translations);
      
      // Save translations to database
      await saveTranslationsToDatabase(translations, targetLanguage);
      
      console.log(`🌍🔥 Translation complete and saved to database`);
      
    } catch (error) {
      console.error('🌍🔥 Translation error:', error);
      
      // Don't reset to English, just show error
      Alert.alert(
        'Translation Error', 
        `Unable to translate content to ${availableLanguages.find(l => l.code === targetLanguage)?.name || targetLanguage}. Please check your internet connection and try again.`
      );
      
      throw error; // Re-throw so calling function can handle
    }
  };

  // Handle language selection
  const handleLanguageSelect = async (languageCode: string) => {
    console.log(`🌍🔥 Language selected: ${languageCode}`);
    console.log(`🌍🔥 Current state:`, {
      currentLanguage,
      hasTopicData: !!topicData,
      translatedContentKeys: Object.keys(translatedContent),
      isTranslating
    });
    
    setLanguageSelectionVisible(false);
    setHeaderMenuVisible(false);
    
    // Update both UI language AND content language for complete translation
    await setUILanguage(languageCode);
    
    if (languageCode === 'en') {
      console.log('🌍🔥 Resetting to English');
      // Reset to original content
      setTranslatedContent({});
      setCurrentLanguage('en');
      await saveLanguagePreference('en');
    } else if (languageCode === currentLanguage) {
      console.log('🌍🔥 Language already selected, skipping');
      return;
    } else {
      console.log(`🌍🔥 Attempting to translate content to ${languageCode}`);
      
      // Always attempt content translation - with scanner overlay
      const selectedLang = availableLanguages.find(lang => lang.code === languageCode);
      if (selectedLang && topicData) {
        try {
          console.log(`🌍🔥 Starting translation to ${selectedLang.name}`);
          
          // Start the scanner overlay experience
          setSelectedTargetLanguage({ code: languageCode, name: selectedLang.name });
          setShowScannerOverlay(true);
          
          // Perform the actual translation while scanner is showing
          setIsTranslating(true);
          await translateContent(languageCode);
          
          console.log(`🌍🔥 Translation completed, updating language to ${languageCode}`);
          setCurrentLanguage(languageCode);
          await saveLanguagePreference(languageCode);
          
        } catch (error) {
          console.error('🌍🔥 Translation failed:', error);
          setShowScannerOverlay(false);
          Alert.alert(
            'Translation Error', 
            `Failed to translate content to ${selectedLang.name}. Please check your internet connection and try again.`,
            [
              { 
                text: 'OK', 
                onPress: () => {
                  // Reset to previous language on error
                  console.log('🌍🔥 Resetting language due to error');
                }
              }
            ]
          );
        } finally {
          setIsTranslating(false);
          setTranslationProgress('');
        }
      } else {
        console.error('🌍🔥 No language found or topic data missing');
      }
    }
  };



  // Handle translate this page
  const handleTranslateThisPage = () => {
    setHeaderMenuVisible(false);
    setLanguageSelectionVisible(true);
  };

  // Get display content (translated or original) including categories
  const getDisplayContent = () => {
    console.log('🌍🔥 getDisplayContent called:', {
      currentLanguage,
      hasTranslatedContent: Object.keys(translatedContent).length > 0,
      translatedContentKeys: Object.keys(translatedContent),
      hasTopicData: !!topicData,
      titleSample: translatedContent.title ? translatedContent.title.substring(0, 50) + '...' : 'none',
      hasCategories: !!translatedContent.categories
    });

    if (currentLanguage === 'en' || Object.keys(translatedContent).length === 0) {
      console.log('🌍🔥 Returning original content (English or no translations)');
      return {
        title: topicData?.title || '',
        description: topicData?.description || '',
        whyThisMatters: topicData?.why_this_matters || '',
        categories: topicData?.categories || []
      };
    }
    
    console.log('🌍🔥 Returning translated content');
    const result = {
      title: translatedContent.title || topicData?.title || '',
      description: translatedContent.description || topicData?.description || '',
      whyThisMatters: translatedContent.whyThisMatters || topicData?.why_this_matters || '',
      categories: translatedContent.categories || topicData?.categories || []
    };
    
    console.log('🌍🔥 Display content result:', {
      titleLength: result.title.length,
      descriptionLength: result.description.length,
      whyThisMattersLength: result.whyThisMatters.length,
      titlePreview: result.title.substring(0, 50) + '...',
      categoriesCount: result.categories.length
    });
    
    return result;
  };

  const displayContent = getDisplayContent();

  // Debug function to test translation
  const testTranslation = async () => {
    console.log('🧪 Testing translation service...');
    try {
      const testText = "This is a test of the translation system with democracy and government";
      const result = await deepLTranslationService.translateText(testText, 'es');
      console.log('🧪 Test translation result:', result);
      Alert.alert('Translation Test', `Original: "${testText}"\n\nTranslated: "${result}"`);
    } catch (error) {
      console.error('🧪 Translation test failed:', error);
      Alert.alert('Translation Test Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Add debug logging when language changes
  React.useEffect(() => {
    console.log('🌍🔥 Language state changed:', {
      currentLanguage,
      hasTranslatedContent: Object.keys(translatedContent).length > 0,
      translatedKeys: Object.keys(translatedContent),
      contentValues: {
        title: translatedContent.title ? translatedContent.title.substring(0, 30) + '...' : 'none',
        description: translatedContent.description ? translatedContent.description.substring(0, 30) + '...' : 'none',
        whyThisMatters: translatedContent.whyThisMatters ? translatedContent.whyThisMatters.substring(0, 30) + '...' : 'none'
      }
    });
  }, [currentLanguage, translatedContent]);

  // Handle scanner overlay completion
  const handleScannerComplete = () => {
    setShowScannerOverlay(false);
    setSelectedTargetLanguage(null);
    
    // Show a subtle success animation or feedback
    if (currentLanguage !== 'en') {
      const currentLangInfo = getCurrentLanguageInfo();
      if (currentLangInfo) {
        // Small haptic feedback for success
        console.log(`🌍✨ Translation to ${currentLangInfo.name} completed successfully!`);
      }
    }
  };

  // Get current language info
  const getCurrentLanguageInfo = () => {
    if (currentLanguage === 'en') return null;
    return availableLanguages.find(lang => lang.code === currentLanguage);
  };

  // Check if translations are available for a language
  const hasTranslationsForLanguage = (languageCode: string) => {
    if (!topicData?.translations) return false;
    const translations = topicData.translations;
    
    // Check if we have actual content (not empty strings) for this language
    const hasTitle = translations.title?.[languageCode] && translations.title[languageCode].trim().length > 0;
    const hasDescription = translations.description?.[languageCode] && translations.description[languageCode].trim().length > 0;
    const hasWhyThisMatters = translations.why_this_matters?.[languageCode] && translations.why_this_matters[languageCode].trim().length > 0;
    const hasCategories = translations.categories?.[languageCode] && Array.isArray(translations.categories[languageCode]) && translations.categories[languageCode].length > 0;
    
    // Return true only if we have substantial content translated
    return hasTitle || hasDescription || hasWhyThisMatters || hasCategories;
  };

  if (!id) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Topic', headerShown: true }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.foreground }]}>Topic not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
              <Stack.Screen 
          options={{
            title: loading ? 'Learn' : (displayContent.title && displayContent.title.length > 20 ? displayContent.title.substring(0, 20) + '...' : displayContent.title || 'Learn'),
            headerShown: true,
            headerStyle: { 
              backgroundColor: theme.background,
            },
            headerTintColor: theme.foreground,
            headerTitleStyle: { 
              color: theme.foreground,
              fontFamily: 'SpaceMono-Regular',
              fontWeight: '400',
            },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingLeft: 8, paddingRight: 16 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={{ fontSize: 24, color: theme.primary, fontWeight: '600' }}>‹</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View>
              <TouchableOpacity
                onPress={() => setHeaderMenuVisible(true)}
                style={styles.shareButton}
                accessibilityRole="button"
                accessibilityLabel="Open menu"
              >
                <Ionicons name="ellipsis-vertical" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Loading topic details...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.foreground }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={loadTopicData}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : topicData ? (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Topic Header */}
          <Animated.View style={{
            transform: [{ scale: translationScale }],
            opacity: translationOpacity,
          }}>
            {topicData.emoji && (
              <Text style={styles.topicEmoji}>{topicData.emoji}</Text>
            )}
            
            {/* Language indicator when translated */}
            {getCurrentLanguageInfo() && (
              <View style={[styles.languageIndicator, { backgroundColor: theme.primary }]}>
                <Text style={styles.languageIndicatorText}>
                  {getCurrentLanguageInfo()?.flag} {getCurrentLanguageInfo()?.code.toUpperCase()}
                </Text>
              </View>
            )}
            
            <Text style={[styles.topicTitle, { color: theme.foreground }]}>
              {displayContent.title}
            </Text>
            
            {/* Publication Date */}
            {topicData.created_at && (
              <Text style={[styles.topicDate, { color: theme.foregroundSecondary }]}>
                Published {formatPublishDate(topicData.created_at)}
              </Text>
            )}
            
            <Text style={[styles.topicDescription, { color: theme.foregroundSecondary }]}>
              {displayContent.description}
            </Text>
            
            {/* Categories */}
            {displayContent.categories && Array.isArray(displayContent.categories) && displayContent.categories.length > 0 && (
              <View style={styles.categoriesContainer}>
                {(displayContent.categories as any[]).slice(0, 3).map((category: any, index: number) => {
                  const categoryText = typeof category === 'string' ? category : 
                                     typeof category === 'object' && category !== null ? 
                                     ((category as any).name || String(category)) : 
                                     String(category);
                  
                  return (
                    <CategoryBadge key={index} category={categoryText} />
                  );
                })}
              </View>
            )}

            {/* Topic Stats - Updated with proper UI strings */}
            <View style={styles.topicStats}>
              <View style={styles.topicStatItem}>
                <Text style={[styles.statIcon, { color: theme.foregroundSecondary }]}>📝</Text>
                <Text style={[styles.topicStatValue, { color: theme.primary }]}>
                  {topicData.question_count || 10}
                </Text>
                <Text style={[styles.topicStatLabel, { color: theme.foregroundSecondary }]}>
                  {uiStrings.topic.questionsLabel}
                </Text>
              </View>
              
              <View style={styles.topicStatItem}>
                <Text style={[styles.statIcon, { color: theme.foregroundSecondary }]}>⏱️</Text>
                <Text style={[styles.topicStatValue, { color: theme.primary }]}>
                  {Math.ceil(((topicData.question_count || 10) * 30) / 60)}
                </Text>
                <Text style={[styles.topicStatLabel, { color: theme.foregroundSecondary }]}>
                  {uiStrings.topic.estimatedMinutesLabel}
                </Text>
              </View>
              
              <View style={styles.topicStatItem}>
                <Text style={[styles.statIcon, { color: theme.foregroundSecondary }]}>🎯</Text>
                <Text style={[styles.topicStatValue, { color: theme.primary }]}>
                  {topicData.difficulty_level || uiStrings.topic.medium}
                </Text>
                <Text style={[styles.topicStatLabel, { color: theme.foregroundSecondary }]}>
                  {uiStrings.topic.levelLabel}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Why This Matters Section - Carousel */}
          {topicData.why_this_matters && (
            <Animated.View style={[
              styles.section,
              {
                transform: [{ scale: translationScale }],
                opacity: translationOpacity,
              }
            ]}>
              <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
                {uiStrings.topic.whyThisMatters}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.whyMattersCarouselContainer}
                snapToInterval={300 + spacing.md}
                decelerationRate="fast"
                pagingEnabled={false}
              >
                {parseHTML(displayContent.whyThisMatters)
                  .split(/[•·\n\n]/) // Split on bullet points or double newlines
                  .map(text => text.trim())
                  .filter(text => text.length > 10) // Filter out very short items
                  .map((blurb, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.whyMattersCarouselCard, 
                        { 
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                          width: 300, // Slightly wider for better content fit
                          minHeight: 280, // Consistent minimum height
                          maxHeight: 400, // Maximum height to maintain consistency
                        }
                      ]}
                    >
                      <View style={styles.whyMattersCardHeader}>
                        <View style={[
                          styles.whyMattersCardNumber, 
                          { 
                            backgroundColor: theme.primary,
                            borderColor: theme.primary + '20'
                          }
                        ]}>
                          <Text style={[
                            styles.whyMattersCardNumberText,
                            { color: '#FFFFFF' }
                          ]}>
                            {index + 1}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.whyMattersCardContent}>
                        <CardFormattedText 
                          text={blurb}
                          style={[styles.whyMattersCardText, { color: theme.foreground }]}
                        />
                      </View>
                    </View>
                  ))
                }
              </ScrollView>
              
              {/* Carousel indicator dots */}
              <View style={styles.whyMattersCarouselIndicators}>
                {parseHTML(displayContent.whyThisMatters)
                  .split(/[•·\n\n]/)
                  .map(text => text.trim())
                  .filter(text => text.length > 10)
                  .map((_, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.whyMattersCarouselDot, 
                        { backgroundColor: theme.primary + '40' }
                      ]} 
                    />
                  ))
                }
              </View>
            </Animated.View>
          )}

          {/* Start Quiz Section */}
          <ChallengePrompt
            title={uiStrings.topic.thinkYouGotIt}
            description={uiStrings.topic.testYourUnderstanding}
            primaryButtonText={uiStrings.topic.startQuiz}
            primaryButtonIcon="arrow-forward"
            onPrimaryPress={handleStartQuiz}
            variant="topic"
          />

          {/* Sources Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
              {uiStrings.topic.sourcesAndReferences}
            </Text>
            {topicData.sources && topicData.sources.length > 0 ? (
              <CompactSourceCarousel 
                sources={topicData.sources}
                onSourcePress={handleSourcePress}
              />
            ) : (
              <View style={[styles.noSourcesContainer, { 
                backgroundColor: theme.background, 
                borderColor: theme.border,
                opacity: 0.8
              }]}>
                <Text style={[styles.noSourcesIcon, { color: theme.foregroundSecondary }]}>📚</Text>
                <Text style={[styles.noSourcesTitle, { color: theme.foreground }]}>
                  No sources available yet
                </Text>
                <Text style={[styles.noSourcesDescription, { color: theme.foregroundSecondary }]}>
                  Sources and references will be added as content is reviewed and verified.
                </Text>
                <Text style={[styles.debugInfo, { color: theme.foregroundSecondary }]}>
                  Debug: Sources count = {topicData.sources?.length || 0}
                </Text>
              </View>
            )}

            {/* Source Analysis FAQ */}
            <TouchableOpacity 
              style={[styles.faqSection, { 
                backgroundColor: theme.background, 
                borderColor: theme.border 
              }]}
              onPress={() => setFaqExpanded(!faqExpanded)}
              activeOpacity={0.8}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqTitle, { color: theme.foreground }]}>
                  ❓ {uiStrings.topic.understandingSourceAnalysis}
                </Text>
                <Text style={[styles.faqToggle, { color: theme.primary }]}>
                  {faqExpanded ? '−' : '+'}
                </Text>
              </View>
              
              {faqExpanded && (
                <View style={styles.faqContent}>
                  <View style={styles.faqItem}>
                    <Text style={[styles.faqQuestion, { color: theme.foreground }]}>
                      {uiStrings.topic.biasRatingsMeaning}
                    </Text>
                    <Text style={[styles.faqAnswer, { color: theme.foregroundSecondary }]}>
                      <Text style={{ fontWeight: '600', color: '#DC2626' }}>🔴 Left/Right:</Text> Strong ideological lean{'\n'}
                      <Text style={{ fontWeight: '600', color: '#F97316' }}>🟠 Lean Left/Right:</Text> Moderate bias toward one side{'\n'}
                      <Text style={{ fontWeight: '600', color: '#2563EB' }}>🔵 Center:</Text> Balanced reporting with minimal bias{'\n'}
                      <Text style={{ fontWeight: '600', color: '#EAB308' }}>🟡 Mixed:</Text> Varies by topic or author
                    </Text>
                  </View>

                  <View style={styles.faqItem}>
                    <Text style={[styles.faqQuestion, { color: theme.foreground }]}>
                      {uiStrings.topic.credibilityPercentageMeaning}
                    </Text>
                    <Text style={[styles.faqAnswer, { color: theme.foregroundSecondary }]}>
                      The percentage reflects overall source reliability based on factual accuracy, transparency, and editorial standards. Higher percentages indicate more trustworthy sources.
                    </Text>
                  </View>

                  <View style={styles.faqItem}>
                    <Text style={[styles.faqQuestion, { color: theme.foreground }]}>
                      {uiStrings.topic.howRatingsDetermined}
                    </Text>
                    <Text style={[styles.faqAnswer, { color: theme.foregroundSecondary }]}>
                      Our AI analyzes sources using real-time web search to check current bias assessments from AllSides, Media Bias/Fact Check, and Ad Fontes. We also maintain a curated database of known source ratings for consistent analysis.
                    </Text>
                  </View>

                  <View style={styles.faqItem}>
                    <Text style={[styles.faqQuestion, { color: theme.foreground }]}>
                      {uiStrings.topic.areRatingsPermanent}
                    </Text>
                    <Text style={[styles.faqAnswer, { color: theme.foregroundSecondary }]}>
                      <Text style={{ fontWeight: '600', color: theme.primary }}>No - our database uses living rating scores.</Text> As news sources publish content, their bias and credibility ratings may change based on their recent reporting. However, all sources must still meet our threshold for factual accuracy before being included in CivicSense content.
                    </Text>
                  </View>

                  <View style={styles.faqItem}>
                    <Text style={[styles.faqQuestion, { color: theme.foreground }]}>
                      {uiStrings.topic.sourceAnalysisImportance}
                    </Text>
                    <Text style={[styles.faqAnswer, { color: theme.foregroundSecondary }]}>
                      Understanding source bias and credibility helps you become a more critical consumer of information. No source is perfectly neutral—knowing their perspective helps you seek diverse viewpoints and make informed decisions.
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Ratings & Reviews Section */}
          {topicData && (
            <TopicRatingSection 
              topicId={id || ''}
              topicTitle={topicData.title}
            />
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      ) : null}
      
      {/* Header Menu Modal */}
      <Modal
        visible={headerMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHeaderMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.headerMenuBackdrop}
          activeOpacity={1}
          onPress={() => setHeaderMenuVisible(false)}
        >
          <View style={styles.headerMenuContainer}>
            <View style={[styles.headerMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.headerMenuItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  setHeaderMenuVisible(false);
                  setLanguageSelectionVisible(true);
                }}
              >
                <Ionicons name="language" size={20} color={theme.primary} />
                                 <Text style={[styles.headerMenuText, { color: theme.foreground }]}>
                   {uiStrings.topic.translateThisPage}
                 </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.headerMenuItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  setHeaderMenuVisible(false);
                  handleBookmarkToggle();
                }}
                disabled={bookmarkLoading}
              >
                <Ionicons 
                  name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                  size={20} 
                  color={theme.primary} 
                />
                                 <Text style={[styles.headerMenuText, { color: theme.foreground }]}>
                   {isBookmarked ? uiStrings.topic.removeBookmark : uiStrings.topic.bookmark}
                 </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.headerMenuItem, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setHeaderMenuVisible(false);
                  handleShare();
                }}
              >
                <Ionicons name="share-outline" size={20} color={theme.primary} />
                                 <Text style={[styles.headerMenuText, { color: theme.foreground }]}>
                   {uiStrings.topic.share}
                 </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={languageSelectionVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLanguageSelectionVisible(false)}
      >
        <SafeAreaView style={[styles.languageModalContainer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.languageModalHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.languageModalHeaderSpacer} />
            <Text style={[styles.languageModalTitle, { color: theme.foreground }]}>
              {uiStrings.translation.selectLanguage}
            </Text>
            <TouchableOpacity
              style={styles.languageModalCloseButton}
              onPress={() => setLanguageSelectionVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.foreground} />
            </TouchableOpacity>
          </View>

          {/* Translation Status */}
          {isTranslating && (
            <View style={[styles.translationStatus, { backgroundColor: theme.card }]}>
              <View style={styles.translationStatusContent}>
                <ActivityIndicator size="small" color={theme.primary} />
                <View style={styles.translationStatusTextContainer}>
                  <Text style={[styles.translationStatusText, { color: theme.foreground }]}>
                    {translationProgress || uiStrings.translation.translating}
                  </Text>
                  <View style={styles.translationProgressBar}>
                    <View style={[styles.translationProgressFill, { backgroundColor: theme.primary }]} />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Language List */}
          <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
            {/* English (Original) */}
            <TouchableOpacity
              style={[
                styles.languageOption,
                currentLanguage === 'en' && styles.languageOptionSelected,
                { borderBottomColor: theme.border }
              ]}
              onPress={() => handleLanguageSelect('en')}
              disabled={isTranslating}
            >
              <View style={styles.languageOptionContent}>
                <Text style={styles.languageFlag}>🇺🇸</Text>
                <View style={styles.languageInfo}>
                  <Text style={[styles.languageName, { color: theme.foreground }]}>
                    English
                  </Text>
                  <Text style={[styles.languageSubtext, { color: theme.foregroundSecondary }]}>
                    {uiStrings.translation.original}
                  </Text>
                </View>
              </View>
              {currentLanguage === 'en' && (
                <Ionicons name="checkmark" size={20} color={theme.primary} />
              )}
            </TouchableOpacity>

            {/* Available Languages */}
            {availableLanguages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  currentLanguage === language.code && styles.languageOptionSelected,
                  { borderBottomColor: theme.border }
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                disabled={isTranslating}
              >
                <View style={styles.languageOptionContent}>
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <View style={styles.languageInfo}>
                    <Text style={[styles.languageName, { color: theme.foreground }]}>
                      {language.name}
                    </Text>
                                         <Text style={[styles.languageSubtext, { color: theme.foregroundSecondary }]}>
                       {uiStrings.translation.translated}
                     </Text>
                  </View>
                </View>
                {currentLanguage === language.code && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.languageModalFooter, { borderTopColor: theme.border }]}>
                       <Text style={[styles.languageModalFooterText, { color: theme.foregroundSecondary }]}>
             {uiStrings.translation.translationComplete}
           </Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Floating Translation Widget */}
      {currentLanguage !== 'en' && (
        <TouchableOpacity
          style={[styles.floatingTranslationWidget, { backgroundColor: theme.primary }]}
          onPress={() => setLanguageSelectionVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingTranslationFlag}>
            {availableLanguages.find(lang => lang.code === currentLanguage)?.flag || '🌍'}
          </Text>
          <Text style={styles.floatingTranslationCode}>
            {currentLanguage.toUpperCase()}
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Source Analysis Drawer */}
      <Modal
        visible={sourceDrawerVisible}
        transparent
        animationType="none"
        onRequestClose={() => {
          Animated.timing(sourceDrawerAnimation, {
            toValue: Dimensions.get('window').height,
            duration: 300,
            useNativeDriver: false,
          }).start(() => setSourceDrawerVisible(false));
        }}
      >
        <View style={styles.drawerBackdrop}>
          <TouchableOpacity 
            style={styles.drawerBackdropTouch}
            activeOpacity={1}
            onPress={() => {
              Animated.timing(sourceDrawerAnimation, {
                toValue: Dimensions.get('window').height,
                duration: 300,
                useNativeDriver: false,
              }).start(() => setSourceDrawerVisible(false));
            }}
          />
          
          <Animated.View 
            style={[
              styles.sourceDrawer,
              { 
                backgroundColor: theme.background,
                transform: [{ translateY: sourceDrawerAnimation }],
              }
            ]}
          >
            {/* Drawer Handle */}
            <View style={[styles.drawerHandle, { backgroundColor: theme.border }]} />
            
            {/* Drawer Content */}
            <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
              {sourceDrawerLoading ? (
                <View style={styles.drawerLoading}>
                  <LoadingSpinner size="large" />
                  <Text style={[styles.drawerLoadingText, { color: theme.foregroundSecondary }]}>
                    Loading analysis...
                  </Text>
                </View>
              ) : selectedSourceAnalysis && selectedSourceOG ? (
                <>
                  {/* Header */}
                  <View style={styles.drawerHeader}>
                    <View style={styles.drawerSourceInfo}>
                      <Text style={[styles.drawerSourceTitle, { color: theme.foreground }]} numberOfLines={2}>
                        {selectedSourceOG.title || 'Source Analysis'}
                      </Text>
                      <Text style={[styles.drawerSourceDomain, { color: theme.foregroundSecondary }]}>
                        {selectedSourceAnalysis.domain}
                      </Text>
                    </View>
                                         <View style={[styles.drawerCredibilityBadge, { 
                       backgroundColor: selectedSourceAnalysis.overallCredibility >= 0.8 ? '#10B981' : 
                                       selectedSourceAnalysis.overallCredibility >= 0.6 ? '#F59E0B' : '#EF4444'
                     }]}>
                      <Text style={styles.drawerCredibilityText}>
                        {Math.round(selectedSourceAnalysis.overallCredibility * 100)}%
                      </Text>
                    </View>
                  </View>

                  {/* Key Metrics */}
                  <View style={[styles.drawerSection, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.drawerSectionTitle, { color: theme.foreground }]}>
                      📊 Analysis Overview
                    </Text>
                    <View style={styles.drawerMetrics}>
                      <View style={styles.drawerMetricItem}>
                        <Text style={[styles.drawerMetricLabel, { color: theme.foregroundSecondary }]}>
                          Political Bias
                        </Text>
                        <Text style={[styles.drawerMetricValue, { color: theme.foreground }]}>
                          {selectedSourceAnalysis.overallBias === 'center' ? '🔵 Center' :
                           selectedSourceAnalysis.overallBias === 'left' ? '🔴 Left' :
                           selectedSourceAnalysis.overallBias === 'lean_left' ? '🟠 Lean Left' :
                           selectedSourceAnalysis.overallBias === 'right' ? '🔴 Right' :
                           selectedSourceAnalysis.overallBias === 'lean_right' ? '🟠 Lean Right' :
                           selectedSourceAnalysis.overallBias === 'mixed' ? '🟡 Mixed' : '⚪ Unknown'}
                        </Text>
                      </View>
                      
                      {selectedSourceAnalysis.factualRating && (
                        <View style={styles.drawerMetricItem}>
                          <Text style={[styles.drawerMetricLabel, { color: theme.foregroundSecondary }]}>
                            Factual Rating
                          </Text>
                          <Text style={[styles.drawerMetricValue, { color: theme.foreground }]}>
                            {selectedSourceAnalysis.factualRating.charAt(0).toUpperCase() + selectedSourceAnalysis.factualRating.slice(1)}
                          </Text>
                        </View>
                      )}
                      
                      {selectedSourceAnalysis.transparencyScore && (
                        <View style={styles.drawerMetricItem}>
                          <Text style={[styles.drawerMetricLabel, { color: theme.foregroundSecondary }]}>
                            Transparency
                          </Text>
                          <Text style={[styles.drawerMetricValue, { color: theme.foreground }]}>
                            {Math.round(selectedSourceAnalysis.transparencyScore * 100)}%
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Analysis Summary */}
                  {selectedSourceAnalysis.analysisSummary && (
                    <View style={[styles.drawerSection, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.drawerSectionTitle, { color: theme.foreground }]}>
                        🔍 Analysis Summary
                      </Text>
                      <Text style={[styles.drawerText, { color: theme.foregroundSecondary }]}>
                        {selectedSourceAnalysis.analysisSummary}
                      </Text>
                    </View>
                  )}

                  {/* Why This Matters Validation */}
                  {topicData?.why_this_matters && (
                    <View style={[styles.drawerSection, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.drawerSectionTitle, { color: theme.foreground }]}>
                        🎯 Topic Relevance Check
                      </Text>
                      <Text style={[styles.drawerText, { color: theme.foregroundSecondary }]}>
                        {selectedSourceAnalysis && selectedSourceAnalysis.overallCredibility >= 0.7
                          ? "✅ This high-credibility source supports the topic's core claims about why this matters for civic education."
                          : selectedSourceAnalysis && selectedSourceAnalysis.overallCredibility >= 0.5
                          ? "⚠️ This source provides moderate support for the topic's claims. Cross-reference with other sources."
                          : selectedSourceAnalysis
                          ? "❌ This source has low credibility. The topic's claims should be verified with more reliable sources."
                          : "📝 Source analysis needed to validate the topic's 'Why This Matters' claims."
                        }
                      </Text>
                      
                      {selectedSourceAnalysis && (
                        <View style={[styles.validationDetails, { backgroundColor: theme.background, marginTop: spacing.md, padding: spacing.md, borderRadius: 8 }]}>
                          <Text style={[styles.validationTitle, { color: theme.foreground, fontWeight: '600', marginBottom: spacing.xs }]}>
                            Validation Details:
                          </Text>
                          <Text style={[styles.validationText, { color: theme.foregroundSecondary, fontSize: 13, lineHeight: 18 }]}>
                            • Credibility: {Math.round(selectedSourceAnalysis.overallCredibility * 100)}% ({selectedSourceAnalysis.credibilityCategory?.replace('_', ' ') || 'unrated'})
                            {'\n'}• Bias: {selectedSourceAnalysis.overallBias?.replace('_', ' ') || 'unknown'}
                            {'\n'}• Factual Rating: {selectedSourceAnalysis.factualRating?.replace('_', ' ') || 'unrated'}
                            {selectedSourceAnalysis.transparencyScore && `\n• Transparency: ${Math.round(selectedSourceAnalysis.transparencyScore * 100)}%`}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Strengths */}
                  {selectedSourceAnalysis.strengths && selectedSourceAnalysis.strengths.length > 0 && (
                    <View style={[styles.drawerSection, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.drawerSectionTitle, { color: theme.foreground }]}>
                        ✅ Strengths
                      </Text>
                      {selectedSourceAnalysis.strengths.map((strength, index) => (
                        <View key={index} style={styles.drawerListItem}>
                          <Text style={[styles.drawerListBullet, { color: '#10B981' }]}>•</Text>
                          <Text style={[styles.drawerListText, { color: theme.foregroundSecondary }]}>
                            {strength}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Weaknesses */}
                  {selectedSourceAnalysis.weaknesses && selectedSourceAnalysis.weaknesses.length > 0 && (
                    <View style={[styles.drawerSection, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.drawerSectionTitle, { color: theme.foreground }]}>
                        ⚠️ Areas for Improvement
                      </Text>
                      {selectedSourceAnalysis.weaknesses.map((weakness, index) => (
                        <View key={index} style={styles.drawerListItem}>
                          <Text style={[styles.drawerListBullet, { color: '#F59E0B' }]}>•</Text>
                          <Text style={[styles.drawerListText, { color: theme.foregroundSecondary }]}>
                            {weakness}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Red Flags */}
                  {selectedSourceAnalysis.redFlags && selectedSourceAnalysis.redFlags.length > 0 && (
                    <View style={[styles.drawerSection, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.drawerSectionTitle, { color: theme.foreground }]}>
                        🚩 Red Flags
                      </Text>
                      {selectedSourceAnalysis.redFlags.map((flag, index) => (
                        <View key={index} style={styles.drawerListItem}>
                          <Text style={[styles.drawerListBullet, { color: '#EF4444' }]}>•</Text>
                          <Text style={[styles.drawerListText, { color: theme.foregroundSecondary }]}>
                            {flag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Recommendations */}
                  {selectedSourceAnalysis.recommendations && selectedSourceAnalysis.recommendations.length > 0 && (
                    <View style={styles.drawerSection}>
                      <Text style={[styles.drawerSectionTitle, { color: theme.foreground }]}>
                        💡 Recommendations
                      </Text>
                      {selectedSourceAnalysis.recommendations.map((rec, index) => (
                        <View key={index} style={styles.drawerListItem}>
                          <Text style={[styles.drawerListBullet, { color: theme.primary }]}>•</Text>
                          <Text style={[styles.drawerListText, { color: theme.foregroundSecondary }]}>
                            {rec}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* External Link */}
                  <View style={styles.drawerActions}>
                    <TouchableOpacity
                      style={[styles.drawerButton, { backgroundColor: theme.primary }]}
                      onPress={() => {
                        if (selectedSourceURL) {
                          Linking.openURL(selectedSourceURL);
                        }
                      }}
                    >
                      <Text style={styles.drawerButtonText}>Read Full Article</Text>
                      <Ionicons name="open-outline" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Floating Translation Button */}
      {topicData && !translationControlsVisible && !isTranslating && (
        <TouchableOpacity
          style={[styles.translationButton, { backgroundColor: theme.primary }]}
          onPress={() => setTranslationControlsVisible(true)}
          accessibilityLabel="Open translation controls"
        >
          <Ionicons name="language" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Translation Controls - Available on all topic pages */}
      {topicData && (
        <PageTranslationControls
          isVisible={translationControlsVisible}
          onClose={() => setTranslationControlsVisible(false)}
          currentLanguage={currentLanguage} // Pass the current page language to keep in sync
          contentSections={[
            {
              id: 'title',
              label: 'Topic Title',
              content: displayContent.title, // Use translated content if available
              emoji: topicData.emoji || '📚',
            },
            {
              id: 'description',
              label: 'Description',
              content: displayContent.description, // Use translated content if available
              emoji: '📖',
            },
            ...(displayContent.whyThisMatters ? [{
              id: 'why_matters',
              label: 'Why This Matters',
              content: displayContent.whyThisMatters, // Use translated content if available
              emoji: '💡',
            }] : []),
          ]}
          onTranslationStart={(language) => {
            console.log(`🌍 Topic translation started in ${language}`);
            // Also trigger page content translation when audio translation starts
            if (language !== currentLanguage) {
              handleLanguageSelect(language);
            }
          }}
          onTranslationComplete={(language) => {
            console.log(`✅ Topic translation completed in ${language}`);
            // Ensure page content is also translated to match audio language
            if (language !== currentLanguage) {
              handleLanguageSelect(language);
            }
          }}
          onAudioStart={(sectionId, language) => {
            console.log(`🎧 Audio started for section ${sectionId} in ${language}`);
            // Sync page content language with audio language
            if (language !== currentLanguage) {
              handleLanguageSelect(language);
            }
          }}
        />
      )}

      {/* Header Menu Modal - Updated to use BookmarkButton */}
      <Modal
        visible={headerMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHeaderMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.headerMenuBackdrop}
          activeOpacity={1}
          onPress={() => setHeaderMenuVisible(false)}
        >
          <View style={styles.headerMenuContainer}>
            <View style={[styles.headerMenu, { backgroundColor: theme.background }]}>
              <TouchableOpacity
                style={[styles.headerMenuItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  if (currentLanguage !== 'en') {
                    handleLanguageSelect('en');
                  } else {
                    handleTranslateThisPage();
                  }
                }}
              >
                <Ionicons name="language" size={20} color={theme.primary} />
                <Text style={[styles.headerMenuText, { color: theme.foreground }]}>
                  {currentLanguage !== 'en' ? 'Show Original' : ((uiStrings as any).topic?.translateThisPage || 'Translate This Page')}
                </Text>
              </TouchableOpacity>
              
              {/* Bookmark Menu Item - Consolidated to single icon */}
              <TouchableOpacity
                style={[styles.headerMenuItem, { borderBottomColor: theme.border }]}
                onPress={handleBookmarkToggle}
              >
                <Ionicons 
                  name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                  size={20} 
                  color={theme.primary} 
                />
                <Text style={[styles.headerMenuText, { color: theme.foreground }]}>
                  {isBookmarked ? ((uiStrings as any).topic?.removeBookmark || 'Remove Bookmark') : ((uiStrings as any).topic?.bookmark || 'Bookmark This')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerMenuItem}
                onPress={() => {
                  setHeaderMenuVisible(false);
                  handleShare();
                }}
              >
                <Ionicons name="share-outline" size={20} color={theme.primary} />
                <Text style={[styles.headerMenuText, { color: theme.foreground }]}>
                  {(uiStrings as any).topic?.share || 'Share'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={languageSelectionVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLanguageSelectionVisible(false)}
      >
        <SafeAreaView style={[styles.languageModalContainer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.languageModalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity
              onPress={() => setLanguageSelectionVisible(false)}
              style={styles.languageModalCloseButton}
            >
              <Ionicons name="chevron-down" size={24} color={theme.foreground} />
            </TouchableOpacity>
                          <Text style={[styles.languageModalTitle, { color: theme.foreground }]}>
                {uiStrings.translation.selectLanguage}
              </Text>
            <View style={styles.languageModalHeaderSpacer} />
          </View>

                {/* Enhanced Translation Status */}
      {isTranslating && (
        <Animated.View style={[
          styles.translationStatus, 
          { 
            backgroundColor: theme.background,
            borderColor: theme.primary + '30',
            borderWidth: 1,
          }
        ]}>
          <View style={styles.translationStatusContent}>
            <Animated.View style={{
              transform: [{
                rotate: translationIconRotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }]
            }}>
              <Ionicons name="language" size={20} color={theme.primary} />
            </Animated.View>
            <View style={styles.translationStatusTextContainer}>
              <Text style={[styles.translationStatusText, { color: theme.foreground }]}>
                {translationProgress}
              </Text>
              <View style={styles.translationProgressBar}>
                <Animated.View 
                  style={[
                    styles.translationProgressFill,
                    { 
                      backgroundColor: theme.primary,
                      width: translationProgress.includes('Saving') ? '90%' : 
                             translationProgress.includes('question') ? '70%' :
                             translationProgress.includes('Translating') ? '50%' : '20%'
                    }
                  ]}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      )}

          {/* Language List */}
          <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
            {/* English (Original) */}
            <TouchableOpacity
              style={[
                styles.languageOption,
                currentLanguage === 'en' && styles.languageOptionSelected,
                { borderBottomColor: theme.border }
              ]}
              onPress={() => handleLanguageSelect('en')}
              disabled={isTranslating}
            >
              <View style={styles.languageOptionContent}>
                <Text style={styles.languageFlag}>🇺🇸</Text>
                <View style={styles.languageInfo}>
                  <Text style={[styles.languageName, { color: theme.foreground }]}>
                    English
                  </Text>
                  <Text style={[styles.languageSubtext, { color: theme.foregroundSecondary }]}>
                    {uiStrings.translation.original}
                  </Text>
                </View>
              </View>
              {currentLanguage === 'en' && (
                <Ionicons name="checkmark" size={20} color={theme.primary} />
              )}
            </TouchableOpacity>

            {/* Available Languages Section */}
            <View style={[styles.languageSectionHeader, { backgroundColor: theme.card }]}>
              <Text style={[styles.languageSectionTitle, { color: theme.foreground }]}>
                Available Languages
              </Text>
            </View>

            {/* All Available Languages */}
            {availableLanguages.map((language) => {
              const hasExistingTranslations = hasTranslationsForLanguage(language.code);
              
              return (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    currentLanguage === language.code && styles.languageOptionSelected,
                    { borderBottomColor: theme.border }
                  ]}
                  onPress={() => handleLanguageSelect(language.code)}
                  disabled={isTranslating}
                >
                  <View style={styles.languageOptionContent}>
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <View style={styles.languageInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Text style={[styles.languageName, { color: theme.foreground }]}>
                          {language.name}
                        </Text>
                        {hasExistingTranslations && (
                          <View style={[styles.translationBadge, { backgroundColor: theme.primary }]}>
                            <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '600' }}>
                              ✓
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.languageSubtext, { color: theme.foregroundSecondary }]}>
                        {hasExistingTranslations ? 'Available' : 'AI Translation'}
                      </Text>
                    </View>
                  </View>
                  {currentLanguage === language.code && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.languageModalFooter, { borderTopColor: theme.border }]}>
            <Text style={[styles.languageModalFooterText, { color: theme.foregroundSecondary }]}>
              {uiStrings.translation.languagePreferenceSaved}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>



      {/* Floating Translation Widget */}
      {currentLanguage !== 'en' && (
        <TouchableOpacity
          style={[styles.floatingTranslationWidget, { backgroundColor: theme.primary }]}
          onPress={handleTranslateThisPage}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingTranslationFlag}>
            {getCurrentLanguageInfo()?.flag || '🌐'}
          </Text>
          <Text style={styles.floatingTranslationCode}>
            {getCurrentLanguageInfo()?.code.toUpperCase() || 'XX'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Translation Scanner Overlay */}
      {selectedTargetLanguage && (
        <TranslationScannerOverlay
          isVisible={showScannerOverlay}
          targetLanguage={selectedTargetLanguage.code}
          targetLanguageName={selectedTargetLanguage.name}
          onComplete={handleScannerComplete}
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: 'HelveticaNeue',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  errorText: {
    fontFamily: 'HelveticaNeue',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  retryButtonText: {
    fontFamily: 'SpaceMono-Bold',
    color: '#FFFFFF',
    fontWeight: '600',
  },
  shareButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  
  // Topic Header
  topicHeader: {
    marginBottom: spacing.xl,
  },
  topicEmoji: {
    fontSize: 64,
    lineHeight: 64,
    marginBottom: spacing.lg,
    textAlign: 'left',
  },
  
  // Compact Reviews Styles
  compactRatingHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  compactCheckingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  compactCheckingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  languageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
    gap: 4,
  },
  languageIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'SpaceMono-Bold',
    letterSpacing: 0.5,
  },
  topicTitle: {
    fontFamily: 'HelveticaNeue',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 34,
    marginBottom: spacing.sm,
    textAlign: 'left',
  },
  topicDate: {
    fontFamily: 'HelveticaNeue',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: spacing.md,
    textAlign: 'left',
    opacity: 0.8,
  },
  topicDescription: {
    fontFamily: 'HelveticaNeue',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg,
    textAlign: 'left',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  topicStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
  },
  topicStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 20,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  topicStatValue: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  topicStatLabel: {
    fontFamily: 'HelveticaNeue',
    fontSize: 12,
    fontWeight: '400',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 12,
    fontWeight: '400',
    marginTop: spacing.xs,
  },
  statValue: {
    fontFamily: 'HelveticaNeue-Bold',
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'HelveticaNeue',
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 36,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  
  // Why This Matters - Carousel
  matterCarouselContainer: {
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xl,
  },
  matterCarouselCard: {
    marginRight: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    minHeight: 180,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  matterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  matterCardNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matterCardNumberText: {
    color: '#FFFFFF',
    fontFamily: 'SpaceMono-Bold',
    fontSize: 14,
    fontWeight: '700',
  },
  matterCardEmoji: {
    fontSize: 24,
  },
  matterCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  matterCardText: {
    fontFamily: 'HelveticaNeue',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'left',
  },
  matterCarouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Legacy styles (keeping for backward compatibility)
  matterBlurbs: {
    gap: spacing.md,
  },
  matterBlurb: {
    backgroundColor: '#F8FAFC',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  matterText: {
    fontFamily: 'HelveticaNeue',
    fontSize: 14,
    lineHeight: 22,
  },
  
  // Sources
  sourcesGrid: {
    gap: spacing.md,
  },
  sourceCard: {
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sourceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sourceTypeIcon: {
    fontSize: 16,
  },
  sourceType: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  credibilityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  credibilityScore: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 11,
    fontWeight: '600',
  },
  sourceTitle: {
    fontFamily: 'HelveticaNeue',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  sourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceAuthor: {
    fontFamily: 'HelveticaNeue',
    fontSize: 13,
    flex: 1,
  },
  sourceDate: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Quiz Section
  quizSection: {
    marginTop: spacing.lg,
    padding: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  quizContent: {
    alignItems: 'flex-start',
  },
  quizTitle: {
    fontFamily: 'HelveticaNeue-Bold',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  quizDescription: {
    fontFamily: 'HelveticaNeue',
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  startQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
  },
  startQuizButtonText: {
    fontFamily: 'SpaceMono-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Quiz Section (renamed to avoid conflicts)
  topicQuizSection: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  topicQuizContent: {
    alignItems: 'center',
    width: '100%',
  },
  topicQuizTitle: {
    fontFamily: 'HelveticaNeue',
    fontSize: 22,
    fontWeight: '300',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  topicQuizDescription: {
    fontFamily: 'HelveticaNeue',
    fontSize: 16,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  topicStartQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
    minWidth: 200,
  },
  topicStartQuizButtonText: {
    fontFamily: 'SpaceMono-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomSpacer: {
    height: spacing.xl,
  },

  // Source Carousel Styles
  sourceCarouselContainer: {
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xl,
  },
  sourceCarouselCard: {
    width: 240,
    marginRight: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 160,
  },
  sourceCardBackground: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sourceCardBackgroundImage: {
    flex: 1,
  },
  sourceCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sourceCardContent: {
    flex: 1,
    padding: spacing.md,
  },
  sourceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sourceCardHeaderLeft: {
    flex: 1,
  },
  sourceCardOrganization: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sourceCardDomain: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 10,
    marginTop: 2,
  },
  sourceCardBias: {
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    fontWeight: '400',
    marginTop: 2,
  },
  sourceCardCredibilityBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  sourceCardCredibilityText: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 10,
    fontWeight: '700',
  },
  sourceCardTitle: {
    fontFamily: 'HelveticaNeue',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: spacing.sm,
    minHeight: 54, // 3 lines worth
  },
  sourceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceCardMetadata: {
    marginBottom: spacing.sm,
    minHeight: 32, // Reserve space for metadata
  },
  sourceCardAuthor: {
    fontFamily: 'HelveticaNeue',
    fontSize: 11,
    marginBottom: 2,
  },
  sourceCardDate: {
    fontFamily: 'HelveticaNeue',
    fontSize: 11,
  },
  sourceCardExternalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: spacing.xs,
  },
  sourceCardExternalText: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 10,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  
  // No Sources State
  noSourcesContainer: {
    padding: spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.md,
  },
  noSourcesIcon: {
    fontSize: 32,
    lineHeight: 32,
  },
  noSourcesTitle: {
    fontFamily: 'HelveticaNeue-Bold',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  noSourcesDescription: {
    fontFamily: 'HelveticaNeue',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  debugInfo: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Background Image Styles (unique names)
  sourceCardBgContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sourceCardBgImage: {
    borderRadius: 12,
    opacity: 0.8,
  },
  sourceCardBgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
  },
  
  // FAQ Section Styles
  faqSection: {
    marginTop: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  faqTitle: {
    fontFamily: 'HelveticaNeue-Bold',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  faqToggle: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 18,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  faqContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  faqItem: {
    marginBottom: spacing.lg,
  },
  faqQuestion: {
    fontFamily: 'HelveticaNeue-Bold',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  faqAnswer: {
    fontFamily: 'HelveticaNeue',
    fontSize: 13,
    lineHeight: 20,
  },
  
  // Source Loading States
  sourceLoadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    gap: spacing.md,
  },
  sourceLoadingText: {
    fontFamily: 'HelveticaNeue',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Enhanced Source Card Styles
  sourceCardOrgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  aiAnalyzedBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: spacing.xs,
  },
  aiAnalyzedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sourceAnalysisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  factualRating: {
    fontSize: 10,
    fontWeight: '500',
  },
  sourceAnalysisSummary: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  sourceInsights: {
    marginTop: spacing.xs,
    gap: 2,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  insightIcon: {
    fontSize: 10,
    fontWeight: '600',
  },
  insightText: {
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
  confidenceIndicator: {
    fontSize: 9,
    fontWeight: '500',
  },
  
  // Clean Source Card Styles
  cleanSourceCard: {
    width: 180,
    height: 120,
    marginRight: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cleanSourceCardBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cleanSourceCardBackgroundImage: {
    borderRadius: 12,
  },
  cleanSourceCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  cleanSourceCardTopBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cleanSourceCardCredibility: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  cleanSourceCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cleanSourceCardOrganization: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  cleanSourceCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  cleanSourceCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cleanSourceCardBias: {
    fontSize: 16,
  },
  cleanSourceCardAction: {
    fontSize: 10,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  sourceCardLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderRadius: 12,
  },
  
  // Source Analysis Drawer Styles
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerBackdropTouch: {
    flex: 1,
  },
  sourceDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  drawerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  drawerLoadingText: {
    fontSize: 16,
    fontFamily: 'HelveticaNeue',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  drawerSourceInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  drawerSourceTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 4,
  },
  drawerSourceDomain: {
    fontSize: 14,
    fontWeight: '500',
  },
  drawerCredibilityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  drawerCredibilityText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  drawerSection: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  drawerSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  drawerText: {
    fontSize: 15,
    lineHeight: 22,
  },
  drawerMetrics: {
    gap: spacing.md,
  },
  drawerMetricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerMetricLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  drawerMetricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  drawerListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  drawerListBullet: {
    fontSize: 16,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  drawerListText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  drawerActions: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
  },
  drawerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
  },
  drawerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Large Source Card Styles
  largeSourceCard: {
    width: 280,
    height: 160,
    marginRight: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  largeSourceCardBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  largeSourceCardBackgroundImage: {
    borderRadius: 12,
  },
  largeSourceCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  largeSourceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  largeSourceCardTopLeft: {
    flex: 1,
  },
  largeSourceCardTopRight: {
    alignItems: 'flex-end',
  },
  largeSourceCardCredibilityBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  largeSourceCardCredibilityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  largeSourceCardAnalyzedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
  },
  largeSourceCardAnalyzedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  largeSourceCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  largeSourceCardOrganization: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 4,
    fontFamily: 'SpaceMono-Bold',
    letterSpacing: 0.5,
  },
  largeSourceCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 18,
    marginBottom: 4,
  },
  largeSourceCardBias: {
    fontSize: 11,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  largeSourceCardBottom: {
    alignItems: 'flex-start',
  },
  largeSourceCardAction: {
    fontSize: 10,
    color: '#D1D5DB',
    fontWeight: '500',
  },

  // Validation Styles
  validationDetails: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
  },
  validationTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  validationText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Translation Button
  translationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 1000,
  },



  // Header Menu Styles
  headerMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerMenuContainer: {
    position: 'absolute',
    top: 100, // Position below header
    right: 16,
    minWidth: 200,
  },
  headerMenu: {
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  headerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerMenuText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },

  // Language Selection Modal Styles
  languageModalContainer: {
    flex: 1,
  },
  languageModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  languageModalCloseButton: {
    padding: spacing.xs,
  },
  languageModalTitle: {
    fontFamily: 'HelveticaNeue-Bold',
    fontSize: 18,
    fontWeight: '600',
  },
  languageModalHeaderSpacer: {
    width: 40, // Same as close button to center title
  },
  translationStatus: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  translationStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  translationStatusTextContainer: {
    flex: 1,
  },
  translationStatusText: {
    fontFamily: 'HelveticaNeue',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  translationProgressBar: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  translationProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  languageList: {
    flex: 1,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  languageOptionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  languageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontFamily: 'HelveticaNeue-Bold',
    fontSize: 16,
    fontWeight: '600',
  },
  languageSubtext: {
    fontFamily: 'HelveticaNeue',
    fontSize: 13,
    marginTop: 2,
  },
  languageModalFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  languageModalFooterText: {
    fontFamily: 'HelveticaNeue',
    fontSize: 13,
    textAlign: 'center',
  },
  contributionIndicator: {
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },

  // Why This Matters Carousel Styles
  whyMattersCarouselContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  whyMattersCarouselCard: {
    width: 300,
    marginRight: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    justifyContent: 'space-between', // Ensure even spacing
  },
  whyMattersCardHeader: {
    marginBottom: spacing.md,
    flexShrink: 0, // Don't shrink the header
  },
  whyMattersCardNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  whyMattersCardNumberText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'SpaceMono-Bold',
  },
  whyMattersCardContent: {
    flex: 1,
    justifyContent: 'flex-start', // Align content to top for consistency
    paddingBottom: spacing.sm, // Add bottom padding
  },
  whyMattersCardText: {
    fontSize: 14,
    lineHeight: 22, // Increased line height for better readability
    fontWeight: '400',
    fontFamily: 'HelveticaNeue',
  },
  whyMattersCarouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  whyMattersCarouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Floating Translation Widget
  floatingTranslationWidget: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 1000,
  },
  floatingTranslationFlag: {
    fontSize: 16,
    lineHeight: 18,
  },
  floatingTranslationCode: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'SpaceMono-Bold',
    marginTop: -2,
  },

  // Language Section Styles
  languageSectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  languageSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
     languageSectionSubtitle: {
     fontSize: 14,
     fontWeight: '500',
   },
  contributionLanguageOption: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  generalContributionOption: {
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  generalContributionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
     generalContributionIcon: {
     width: 40,
     height: 40,
     borderRadius: 20,
     justifyContent: 'center',
     alignItems: 'center',
   },
  generalContributionText: {
    flex: 1,
  },
     generalContributionTitle: {
     fontSize: 16,
     fontWeight: '600',
   },
   generalContributionSubtitle: {
     fontSize: 14,
     fontWeight: '500',
   },
  translationBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },

  // Rating Section Styles
  ratingContainer: {
    gap: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  ratingLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },

  // Header
  ratingHeaderCard: {
    overflow: 'hidden',
  },
  ratingHeaderGradient: {
    padding: spacing.lg,
  },
  ratingHeader: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingHeaderEmoji: {
    fontSize: 32,
    lineHeight: 32,
  },
  ratingHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  ratingHeaderSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  overallRatingDisplay: {
    alignItems: 'center',
  },

  // Rating Display
  ratingStarsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: spacing.xs,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  ratingCount: {
    fontSize: 14,
  },

  // User Rating
  userRatingCard: {
    padding: spacing.lg,
  },
  ratingSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  userRatingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRatingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  editRatingButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  editRatingButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingInput: {
    alignItems: 'center',
    gap: spacing.md,
  },
  ratingPrompt: {
    fontSize: 16,
    textAlign: 'center',
  },
  starRating: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },

  // Rating Breakdown
  breakdownCard: {
    padding: spacing.lg,
  },
  ratingBreakdown: {
    gap: spacing.sm,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakdownStars: {
    fontSize: 12,
    width: 40,
  },
  breakdownBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownCount: {
    fontSize: 12,
    width: 30,
    textAlign: 'right',
  },

  // Reviews
  reviewsCard: {
    padding: spacing.lg,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  viewAllButton: {
    padding: spacing.xs,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewsList: {
    gap: spacing.md,
  },
  reviewCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    fontSize: 16,
    fontWeight: '700',
  },
  authorInfo: {
    gap: 2,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  reviewRatingEmoji: {
    fontSize: 16,
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  showMoreButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSaveButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  modalStarRating: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  modalRatingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    gap: spacing.md,
  },
  modalRatingEmoji: {
    fontSize: 24,
  },
  modalRatingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  reviewHelpText: {
    fontSize: 14,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  reviewTextInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 100,
    fontSize: 16,
  },

  // Header menu updates
  bookmarkButtonContainer: {
    marginLeft: 'auto',
  },

  // Empty States
  emptyRatingBreakdown: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyRatingText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyReviewsState: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyReviewsIcon: {
    fontSize: 48,
    lineHeight: 48,
    marginBottom: spacing.sm,
  },
  emptyReviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyReviewsDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  writeFirstReviewButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  writeFirstReviewText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // User Review Actions
  userReviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  // Review Actions (Helpfulness)
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  helpfulnessText: {
    fontSize: 12,
    fontWeight: '500',
  },
  helpfulnessButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  helpfulnessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  helpfulnessCount: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Write Review Button
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  writeReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Completion Required Card
  completionRequiredCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  completionRequiredIcon: {
    fontSize: 32,
    lineHeight: 32,
    marginBottom: spacing.xs,
  },
  completionRequiredTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  completionRequiredDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});