import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';


import { spacing, borderRadius, typography, fontFamily } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { ApiConfig, buildApiUrl } from '../../config/api-config';
import { LinearGradient } from 'expo-linear-gradient';
import { BookmarkService } from '../../lib/services/bookmark-service';
import { CrossPlatformPagerView, type PagerViewRef } from '../../components/ui/CrossPlatformPagerView';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LessonStep {
  id: string;
  collection_item_id: string;
  step_number: number;
  step_type: string;
  title: string;
  content: string;
  estimated_seconds?: number;
  estimated_duration_minutes?: number;
  auto_advance_seconds?: number;
  requires_interaction: boolean;
  can_skip: boolean;
  interaction_config?: any; // JSONB field for interactive components
  skip_conditions?: any;
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  alt_text?: string;
  transcript?: string;
  key_concepts?: string[];
  sources?: any[];
  next_step_id?: string;
  media_url?: string;
  media_type?: string;
  completion_criteria?: any;
  prerequisites?: string[];
  translations?: any;
  created_at?: string;
  updated_at?: string;
}

interface CollectionItem {
  id: string;
  collection_id: string;
  content_type: string;
  content_id: string;
  sort_order: number;
  title?: string;
  description?: string;
  difficulty_level?: string | number;
  estimated_duration?: number;
  learning_objectives?: string[];
  lesson_steps?: LessonStep[];
}

interface Collection {
  id: string;
  title: string;
  description: string;
  emoji: string;
  slug: string;
  difficulty_level: number;
  estimated_minutes: number;
  learning_objectives: string[];
  action_items: string[];
  categories: string[];
  tags: string[];
  current_events_relevance: number;
  is_featured: boolean;
  status: string;
  view_count: number;
  completion_count: number;
  avg_rating: number;
  total_ratings: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  // Computed fields
  collection_items?: CollectionItem[];
  items_count?: number;
  total_steps?: number;
  progress?: any;
}

// Generic API fetch wrapper with proper error handling for mobile
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const url = buildApiUrl(endpoint);
    if (ApiConfig.enableLogging) {
      console.log('🌐 API Request:', url);
    }
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Check if response is HTML (404 page) instead of JSON
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('❌ API returned non-JSON response:', contentType);
      return {
        data: null,
        error: 'API endpoint not available'
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return {
        data: null,
        error: `API error: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    console.log('✅ API Success:', endpoint);
    return { data, error: null };

  } catch (error) {
    console.error('❌ Network Error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

// Get difficulty badge styling
const getDifficultyInfo = (level: number) => {
  switch (level) {
    case 1:
      return { 
        label: 'Beginner', 
        color: '#10B981', 
        bgColor: '#ECFDF5', 
        icon: '🌱',
        description: 'Perfect for newcomers'
      };
    case 2:
      return { 
        label: 'Easy', 
        color: '#3B82F6', 
        bgColor: '#EFF6FF', 
        icon: '📘',
        description: 'Some background helpful'
      };
    case 3:
      return { 
        label: 'Moderate', 
        color: '#F59E0B', 
        bgColor: '#FFFBEB', 
        icon: '⚖️',
        description: 'Civic knowledge needed'
      };
    case 4:
      return { 
        label: 'Advanced', 
        color: '#EF4444', 
        bgColor: '#FEF2F2', 
        icon: '🎓',
        description: 'Deep understanding required'
      };
    case 5:
      return { 
        label: 'Expert', 
        color: '#8B5CF6', 
        bgColor: '#F3E8FF', 
        icon: '🔬',
        description: 'Graduate-level analysis'
      };
    default:
      return { 
        label: 'Unknown', 
        color: '#6B7280', 
        bgColor: '#F9FAFB', 
        icon: '❓',
        description: 'Level not specified'
      };
  }
};

// Format estimated time
const formatEstimatedTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

// Removed unused badge components to simplify design

export default function CollectionDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Card navigation state
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const pagerRef = useRef<PagerViewRef>(null);

  // Define cards structure
  const getCards = () => {
    if (!collection) return [];
    
    const cards = [
      { id: 'intro', type: 'intro', title: 'Overview' },
      { id: 'objectives', type: 'objectives', title: 'Learning Goals' },
      { id: 'content', type: 'content', title: 'Collection Contents' },
      { id: 'action', type: 'action', title: 'Take Action' },
    ];

    // Filter out empty sections
    return cards.filter(card => {
      switch (card.type) {
        case 'objectives':
          return collection.learning_objectives && collection.learning_objectives.length > 0;
        case 'content':
          return collection.collection_items && collection.collection_items.length > 0;
        case 'action':
          return collection.action_items && collection.action_items.length > 0;
        default:
          return true;
      }
    });
  };

  const cards = getCards();

  const handlePageSelected = (e: any) => {
    setCurrentPageIndex(e.nativeEvent.position);
  };

  useEffect(() => {
    console.log('📁 CollectionDetailScreen mounted with slug:', slug);
    if (slug) {
      loadCollection();
    }
  }, [slug]);

  // Check bookmark status when collection is loaded and user is available
  useEffect(() => {
    if (collection && user?.id) {
      checkBookmarkStatus();
    }
  }, [collection, user?.id]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading collection with slug:', slug);
      
      // First try to load from API
      const result = await apiRequest<Collection>(`/api/collections/${slug}`);
      
      if (result.data && !result.error) {
        // Fetch lesson steps for each collection item
        const collectionWithSteps = await loadLessonSteps(result.data);
        console.log('✅ Collection loaded with lesson steps:', collectionWithSteps);
        setCollection(collectionWithSteps);
      } else {
        console.error('❌ Failed to load collection:', result.error);
        // Fallback to mock data for development
        const mockCollection = getMockCollectionData();
        if (mockCollection) {
          console.log('📝 Using mock collection data');
          setCollection(mockCollection);
        } else {
          setError(result.error || 'Failed to load collection');
        }
      }
    } catch (error) {
      console.error('❌ Error loading collection:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadLessonSteps = async (collection: Collection): Promise<Collection> => {
    try {
      if (!collection.collection_items || collection.collection_items.length === 0) {
        return collection;
      }

      // Check if lesson steps are already included in the collection response
      const itemsNeedingSteps = collection.collection_items.filter(item => 
        !item.lesson_steps || item.lesson_steps.length === 0
      );

      if (itemsNeedingSteps.length === 0) {
        console.log('✅ All collection items already have lesson steps loaded');
        // Sort existing lesson steps by step_number
        const sortedItems = collection.collection_items.map(item => ({
          ...item,
          lesson_steps: item.lesson_steps ? 
            [...item.lesson_steps].sort((a, b) => a.step_number - b.step_number) : 
            []
        }));
        
        return {
          ...collection,
          collection_items: sortedItems
        };
      }

      console.log(`🔄 Fetching lesson steps for ${itemsNeedingSteps.length} items without steps`);

      // Only load lesson steps for items that don't have them
      const updatedItems = await Promise.all(
        collection.collection_items.map(async (item) => {
          // If item already has lesson steps, return it as-is (sorted)
          if (item.lesson_steps && item.lesson_steps.length > 0) {
            return {
              ...item,
              lesson_steps: [...item.lesson_steps].sort((a, b) => a.step_number - b.step_number)
            };
          }

          // Only make API call if lesson steps are missing
          try {
            const stepsResult = await apiRequest<LessonStep[]>(`/api/collection-items/${item.id}/lesson-steps`);
            if (stepsResult.data && !stepsResult.error) {
              console.log(`✅ Loaded ${stepsResult.data.length} lesson steps for item ${item.id}`);
              return {
                ...item,
                lesson_steps: stepsResult.data.sort((a, b) => a.step_number - b.step_number)
              };
            } else {
              console.warn(`⚠️ No lesson steps found for item ${item.id}: ${stepsResult.error}`);
            }
          } catch (error) {
            console.error(`❌ Failed to load lesson steps for item ${item.id}:`, error);
          }
          
          // Return item without lesson steps if API call fails
          return item;
        })
      );

      return {
        ...collection,
        collection_items: updatedItems
      };
    } catch (error) {
      console.error('❌ Error loading lesson steps:', error);
      return collection;
    }
  };

  const getMockCollectionData = (): Collection | null => {
    if (!slug) return null;
    
    // Mock data based on the SQL file structure
    return {
      id: '15034388-ed85-4757-ba40-35d4f80edbc7',
      title: 'AI-Powered Political Targeting',
      description: 'Learn how political campaigns use AI and big data to micro-target voters with unprecedented precision.',
      emoji: '🎯',
      slug: slug,
      difficulty_level: 3,
      estimated_minutes: 45,
      learning_objectives: [
        'Understand how AI analyzes voter data for political targeting',
        'Learn about the $16 billion digital political advertising industry',
        'Discover how to investigate your own targeting profile',
        'Explore regulatory responses and self-defense strategies'
      ],
      action_items: [
        'Check your Facebook and Google political ad targeting settings',
        'Use transparency tools to see how you\'re being targeted',
        'Support algorithmic transparency legislation',
        'Diversify your information sources to escape filter bubbles'
      ],
      categories: ['AI & Technology', 'Elections', 'Digital Privacy'],
      tags: ['micro-targeting', 'voter-data', 'political-advertising', 'ai-bias'],
      current_events_relevance: 95,
      is_featured: true,
      status: 'published',
      view_count: 1250,
      completion_count: 890,
      avg_rating: 4.7,
      total_ratings: 156,
      created_at: '2025-06-30T10:31:32.185975+00:00',
      updated_at: '2025-06-30T11:10:24.700992+00:00',
      published_at: '2025-06-30T10:31:32.185975+00:00',
      collection_items: [
        {
          id: 'item-1',
          collection_id: '15034388-ed85-4757-ba40-35d4f80edbc7',
          content_type: 'lesson',
          content_id: 'lesson-1',
          sort_order: 1,
          title: '$16 Billion in Precision Politics: AI Knows How You Vote',
          description: 'Introduction to AI-powered political targeting and its massive scale',
          difficulty_level: 'medium',
          estimated_duration: 40,
          lesson_steps: [
            {
              id: 'f67d75b0-ec3f-4818-bf3d-f4dbbf8ecfee',
              collection_item_id: '15034388-ed85-4757-ba40-35d4f80edbc7',
              step_number: 1,
              step_type: 'intro',
              title: '$16 Billion in Precision Politics: AI Knows How You Vote',
              content: 'Political campaigns collect 5,000+ data points about you—from shopping habits to Netflix preferences—to predict your vote with 89% accuracy. In 2024, campaigns spent $16 billion on digital advertising powered by AI micro-targeting that makes traditional polling look primitive.',
              estimated_seconds: 40,
              requires_interaction: false,
              can_skip: true,
              interaction_config: {
                type: "intro_card",
                emoji: "🎯",
                accuracy: "89% accuracy in vote prediction",
                subtitle: "AI-Powered Political Targeting",
                source_note: "FEC filings, political consulting firm data",
                shocking_fact: "$16 billion spent on digital political advertising",
                data_collection: "5,000+ data points collected per voter",
                background_color: "#7C3AED"
              },
              key_concepts: ["micro-targeting", "data-collection", "political-advertising", "voter-prediction"],
              sources: [{
                url: "https://www.fec.gov/data/",
                date: "2024",
                title: "FEC Campaign Finance Data",
                author: "Federal Election Commission",
                summary: "Official campaign spending data including digital advertising expenditures",
                publication: "FEC.gov",
                verified_working: true,
                credibility_score: 100
              }]
            }
          ]
        }
      ],
      items_count: 1,
      total_steps: 1
    };
  };

  // Removed refresh functionality for cleaner design

  const handleStartLearning = () => {
    if (!collection) return;
    
    // Navigate to learn page for this collection
    router.push(`/collections/${slug}/learn`);
  };

  const handleItemPress = (item: CollectionItem) => {
    // Navigate to learn page for this collection
    router.push(`/collections/${slug}/learn`);
  };

  const handleShare = async () => {
    if (!collection) return;

    try {
      const collectionUrl = `https://civicsense.com/collections/${collection.slug}`;
      const shareMessage = `Check out "${collection.title}" on CivicSense! ${collection.emoji}\n\n${collection.description}\n\nExplore this collection:\n${collectionUrl}\n\nDiscover how power actually works in America and start your civic learning journey.\n\n#CivicSense #Democracy #PowerAwareness`;
      
      await Share.share({
        message: shareMessage,
        title: `CivicSense - ${collection.title}`,
        url: collectionUrl,
      });
    } catch (error) {
      console.error('Error sharing collection:', error);
      Alert.alert('Error', 'Failed to share collection. Please try again.');
    }
  };

  const checkBookmarkStatus = async () => {
    if (!user?.id || !collection?.id) return;

    try {
      const { bookmarks } = await BookmarkService.getBookmarks(user.id, {
        contentType: 'other',
        limit: 100,
      });

      const existingBookmark = bookmarks.find(
        (bookmark: any) => bookmark.content_id === collection.id
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

    if (!collection || bookmarkLoading) return;

    setBookmarkLoading(true);

    try {
      if (isBookmarked) {
        // Find and remove the bookmark
        const { bookmarks } = await BookmarkService.getBookmarks(user.id, { 
          contentType: 'other',
          limit: 100 
        });
        const existingBookmark = bookmarks.find((bookmark: any) => bookmark.content_id === collection.id);

        if (existingBookmark) {
          const { error } = await BookmarkService.deleteBookmark(user.id, (existingBookmark as any).id);
          if (error) throw error;
          
          setIsBookmarked(false);
          Alert.alert('🗑️ Bookmark Removed', 'Collection removed from your saved items.');
        }
      } else {
        // Add bookmark
        const { bookmark, error } = await BookmarkService.createBookmark(user.id, {
          contentId: collection.id,
          contentType: 'other',
          title: collection.title,
          description: collection.description || null,
          contentUrl: `/collections/${collection.slug}`,
          sourceDomain: 'civicsense.com',
        });

        if (error && error.message !== 'Content already bookmarked') {
          throw error;
        }

        setIsBookmarked(true);
        Alert.alert('⭐ Bookmarked!', 'Collection saved to your bookmarks.');
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Loading collection...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!collection) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.foreground }]}>
            Collection not found
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const difficultyInfo = getDifficultyInfo(collection.difficulty_level);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={['#2563EB', '#1D4ED8', '#1E40AF']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Clean Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setIsBookmarked(!isBookmarked)}
              >
                <Ionicons 
                  name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Collection Info */}
          <View style={styles.collectionSection}>
            <Text style={styles.collectionEmoji}>{collection.emoji}</Text>
            <Text style={styles.collectionTitle}>{collection.title}</Text>
            <Text style={styles.collectionDescription}>
              {collection.description}
            </Text>
            
            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{collection.items_count || 0}</Text>
                <Text style={styles.statLabel}>lessons</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatEstimatedTime(collection.estimated_minutes)}
                </Text>
                <Text style={styles.statLabel}>to complete</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {getDifficultyInfo(collection.difficulty_level).label}
                </Text>
                <Text style={styles.statLabel}>difficulty</Text>
              </View>
            </View>
          </View>
          
          {/* Main Content - Swipeable Cards */}
          <CrossPlatformPagerView
            ref={pagerRef}
            style={styles.pagerView}
            initialPage={0}
            onPageSelected={(e) => setCurrentPageIndex(e.nativeEvent.position)}
            orientation="horizontal"
            offscreenPageLimit={1}
          >
            {/* Overview Card */}
            <View key="overview" style={styles.pageWrapper}>
              <ScrollView style={styles.pageContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.pageContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Overview</Text>
                    <Text style={styles.cardSubtitle}>What you'll learn</Text>
                  </View>
                  
                  <View style={styles.contentCard}>
                    <View style={styles.objectivesList}>
                      {collection.learning_objectives.map((objective, index) => (
                        <View key={index} style={styles.objectiveItem}>
                          <View style={styles.objectiveBullet} />
                          <Text style={styles.objectiveText}>{objective}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Content Card */}
            <View key="content" style={styles.pageWrapper}>
              <ScrollView style={styles.pageContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.pageContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Lessons</Text>
                    <Text style={styles.cardSubtitle}>
                      {collection.items_count || 0} interactive lessons
                    </Text>
                  </View>
                  
                  <View style={styles.contentCard}>
                    {collection.collection_items?.map((item, index) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.lessonItem}
                        onPress={() => handleItemPress(item)}
                      >
                        <View style={styles.lessonNumber}>
                          <Text style={styles.lessonNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.lessonContent}>
                          <Text style={styles.lessonTitle}>{item.title}</Text>
                          <Text style={styles.lessonDescription}>
                            {item.description}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Action Card */}
            <View key="action" style={styles.pageWrapper}>
              <ScrollView style={styles.pageContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.pageContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Take Action</Text>
                    <Text style={styles.cardSubtitle}>Apply what you learn</Text>
                  </View>
                  
                  <View style={styles.contentCard}>
                    <View style={styles.actionsList}>
                      {collection.action_items.map((action, index) => (
                        <View key={index} style={styles.actionItem}>
                          <View style={styles.actionBullet} />
                          <Text style={styles.actionText}>{action}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </CrossPlatformPagerView>

          {/* Bottom Action */}
          <View style={styles.bottomSection}>
            {/* Page Indicators */}
            <View style={styles.pageIndicators}>
              {['Overview', 'Lessons', 'Action'].map((label, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.pageIndicator,
                    currentPageIndex === index && styles.pageIndicatorActive
                  ]}
                  onPress={() => {
                    pagerRef.current?.setPageWithoutAnimation(index);
                    setCurrentPageIndex(index);
                  }}
                >
                  <Text style={[
                    styles.pageIndicatorText,
                    ...(currentPageIndex === index ? [styles.pageIndicatorTextActive] : [])
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Start Button */}
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartLearning}
            >
              <Ionicons name="play" size={18} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Learning</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    color: '#FFFFFF',
    ...typography.body,
    fontFamily: fontFamily.mono,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    ...typography.title2,
    fontFamily: fontFamily.mono,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  backButtonText: {
    color: '#FFFFFF',
    ...typography.callout,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  headerButton: {
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.full,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  // Collection Info
  collectionSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  collectionEmoji: {
    fontSize: 48,
    lineHeight: 56,
    marginBottom: spacing.lg,
  },
  collectionTitle: {
    ...typography.title1,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: fontFamily.mono,
  },
  collectionDescription: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    fontFamily: fontFamily.mono,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...typography.title3,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: spacing.xs,
    fontFamily: fontFamily.mono,
  },
  statLabel: {
    ...typography.caption1,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: fontFamily.mono,
  },

  // Pager
  pagerView: {
    flex: 1,
  },
  pageWrapper: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  pageContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xl * 2,
  },

  // Card Styles
  cardHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  cardTitle: {
    ...typography.title2,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: spacing.sm,
    fontFamily: fontFamily.mono,
  },
  cardSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: fontFamily.mono,
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Objectives
  objectivesList: {
    gap: spacing.md,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  objectiveBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  objectiveText: {
    ...typography.body,
    color: '#FFFFFF',
    lineHeight: 22,
    flex: 1,
    fontFamily: fontFamily.mono,
  },

  // Lessons
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  lessonNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumberText: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: spacing.xs,
    fontFamily: fontFamily.mono,
  },
  lessonDescription: {
    ...typography.footnote,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: fontFamily.mono,
  },

  // Actions
  actionsList: {
    gap: spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  actionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginTop: 8,
  },
  actionText: {
    ...typography.body,
    color: '#FFFFFF',
    lineHeight: 22,
    flex: 1,
    fontFamily: fontFamily.mono,
  },

  // Bottom Section
  bottomSection: {
    padding: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  pageIndicator: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pageIndicatorActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  pageIndicatorText: {
    ...typography.caption1,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: fontFamily.mono,
  },
  pageIndicatorTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#2E4057',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    ...typography.callout,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },
}); 