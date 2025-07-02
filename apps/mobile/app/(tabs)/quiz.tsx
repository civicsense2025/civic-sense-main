import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  FlatList,
  Pressable,
  useColorScheme,
  TextInput,
  RefreshControl,
  Modal,
  Platform,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { 
  fetchCategories, 
  fetchTopics, 
  fetchUserProgress,
  type StandardCategory,
  type StandardTopic,
  type StandardResponse 
} from '../../lib/standardized-data-service';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { AppHeader } from '../../components/ui/AppHeader';
import { spacing, borderRadius, typography, fontFamily } from '../../lib/theme';
import { AsyncErrorBoundary } from '../../components/error-boundaries';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { userProgressService, type UserStats } from '../../lib/user-progress-service';
import { QuizRefreshControl } from '../../components/ui/EnhancedRefreshControl';
import { ErrorScreen } from '../../components/ui/ErrorScreen';
import { DailyCardStack } from '../../components/ui/DailyCardStack';
import { QuizSettingsPanel } from '../../components/quiz/QuizSettingsPanel';
import { FetchTopicByIdDebug } from '../../components/debug/FetchTopicByIdDebug';
import {
  Collection, 
  UserCollectionProgress, 
  MobileLessonCard,
  formatMobileEstimatedTime,
  getDifficultyInfo,
  getMobileProgressColor,
  DIFFICULTY_LEVELS 
} from '../../types/collections';
import { 
  CollectionsApiService, 
  createMockMobileLessons 
} from '../../lib/api/collections-service';
import {
  StandardCollection,
  fetchCollections,
  fetchFeaturedCollections
} from '../../lib/services/collections-service';

const { width: screenWidth } = Dimensions.get('window');

// ============================================================================
// INTERFACES
// ============================================================================

interface QuizTopic extends StandardTopic {
  emoji?: string;
  estimatedTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface QuizProgress {
  topicId: string;
  bestScore?: number;
  lastAttempt?: string;
  isCompleted: boolean;
  attemptsCount: number;
}

// ============================================================================
// LESSON COMPONENTS
// ============================================================================

const LessonCard: React.FC<{
  lesson: MobileLessonCard;
  onPress: () => void;
}> = ({ lesson, onPress }) => {
  const { theme } = useTheme();
  const { collection, progress, isNew, isFeatured } = lesson;
  
  const difficultyInfo = getDifficultyInfo(collection.difficulty_level);
  const progressPercentage = progress?.progress_percentage || 0;
  const progressColor = getMobileProgressColor(progressPercentage);
  
  return (
    <TouchableOpacity
      style={[styles.lessonCard, { 
        backgroundColor: theme.card, 
        borderColor: theme.border,
        shadowColor: theme.shadow,
        ...(isFeatured && { borderColor: theme.primary, borderWidth: 2 })
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header with badges */}
      <View style={styles.lessonCardHeader}>
        <View style={styles.lessonBadges}>
          {isNew && (
            <View style={[styles.badge, styles.newBadge]}>
              <Text style={styles.badgeText}>New</Text>
            </View>
          )}
                     {isFeatured && (
             <View style={[styles.badge, styles.lessonFeaturedBadge]}>
               <Ionicons name="star" size={12} color="#FFFFFF" />
               <Text style={styles.badgeText}>Featured</Text>
             </View>
           )}
        </View>
        
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyInfo.color.split(' ')[0] + '-50' }]}>
          <Text style={styles.difficultyText}>{difficultyInfo.icon}</Text>
          <Text style={[styles.difficultyLabel, { color: difficultyInfo.color.split(' ')[1] }]}>
            {difficultyInfo.label}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.lessonCardContent}>
        <Text style={styles.lessonEmoji}>{collection.emoji}</Text>
        <Text 
          style={[styles.lessonTitle, { color: theme.foreground }]}
          numberOfLines={2}
        >
          {collection.title}
        </Text>
        <Text 
          style={[styles.lessonDescription, { color: theme.foregroundSecondary }]}
          numberOfLines={3}
        >
          {collection.description}
        </Text>
      </View>

      {/* Progress Bar */}
      {progressPercentage > 0 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercentage}%`, 
                  backgroundColor: progressColor 
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: theme.foregroundSecondary }]}>
            {Math.round(progressPercentage)}% complete
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.lessonCardFooter}>
        <View style={styles.footerLeft}>
          <Ionicons name="time-outline" size={14} color={theme.foregroundSecondary} />
          <Text style={[styles.footerText, { color: theme.foregroundSecondary }]}>
            {lesson.estimatedReadTime}
          </Text>
        </View>
        
        <View style={styles.footerRight}>
          <Ionicons name="people-outline" size={14} color={theme.foregroundSecondary} />
          <Text style={[styles.footerText, { color: theme.foregroundSecondary }]}>
            {lesson.completionRate}% completion
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const FeaturedLessonCard: React.FC<{
  lesson: MobileLessonCard;
  onPress: () => void;
}> = ({ lesson, onPress }) => {
  const { theme } = useTheme();
  const { collection, progress } = lesson;
  
  return (
    <TouchableOpacity
      style={[styles.featuredLessonCard, { 
        backgroundColor: theme.card, 
        borderColor: theme.primary,
        shadowColor: theme.shadow
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[theme.primary + '10', theme.primary + '05']}
        style={styles.featuredGradient}
      >
        <View style={styles.featuredContent}>
          <View style={styles.featuredHeader}>
            <Text style={styles.featuredEmoji}>{collection.emoji}</Text>
            <View style={[styles.featuredBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="star" size={12} color="#FFFFFF" />
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          </View>
          
          <Text style={[styles.featuredTitle, { color: theme.foreground }]} numberOfLines={2}>
            {collection.title}
          </Text>
          
          <Text style={[styles.featuredDescription, { color: theme.foregroundSecondary }]} numberOfLines={2}>
            {collection.description}
          </Text>
          
          <View style={styles.featuredFooter}>
            <Text style={[styles.featuredTime, { color: theme.foregroundSecondary }]}>
              {lesson.estimatedReadTime} • {getDifficultyInfo(collection.difficulty_level).label}
            </Text>
            
            {progress && progress.progress_percentage > 0 ? (
              <View style={styles.continueButton}>
                <Text style={[styles.continueButtonText, { color: theme.primary }]}>
                  Continue
                </Text>
                <Ionicons name="arrow-forward" size={16} color={theme.primary} />
              </View>
            ) : (
              <View style={[styles.startButton, { backgroundColor: theme.primary }]}>
                <Text style={styles.startButtonText}>Start</Text>
                <Ionicons name="play" size={16} color="#FFFFFF" />
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// ============================================================================
// IMPROVED COMPONENTS
// ============================================================================

// Enhanced Category Card Component
const CategoryCard: React.FC<{
  category: StandardCategory;
  onPress: (category: StandardCategory) => void;
}> = ({ category, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.categoryCard, { 
        backgroundColor: theme.card, 
        borderColor: theme.border,
        shadowColor: theme.shadow 
      }]}
      onPress={() => onPress(category)}
      activeOpacity={0.8}
    >
      <View style={styles.categoryCardContent}>
        <Text style={styles.categoryEmoji}>{category.emoji || '📚'}</Text>
        <Text 
          style={[styles.categoryName, { color: theme.foreground }]}
          numberOfLines={2}
        >
          {category.name}
        </Text>
        <Text 
          style={[styles.categoryDescription, { color: theme.foregroundSecondary }]}
          numberOfLines={3}
        >
          {category.description || 'Explore civic concepts'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Practice Mode Card Component  
const PracticeModeCard: React.FC<{
  title: string;
  description: string;
  emoji: string;
  onPress: () => void;
}> = ({ title, description, emoji, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.practiceModeCard, { 
        backgroundColor: theme.card, 
        borderColor: theme.border 
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.practiceModeEmoji}>{emoji}</Text>
      <Text style={[styles.practiceModeTitle, { color: theme.foreground }]}>
        {title}
      </Text>
      <Text style={[styles.practiceModeDescription, { color: theme.foregroundSecondary }]}>
        {description}
      </Text>
    </TouchableOpacity>
  );
};

// Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  emoji: string;
}> = ({ title, value, subtitle, emoji }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={styles.statsEmoji}>{emoji}</Text>
      <Text style={[styles.statsValue, { color: theme.foreground }]}>{value}</Text>
      <Text style={[styles.statsTitle, { color: theme.foregroundSecondary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.statsSubtitle, { color: theme.foregroundTertiary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

// ============================================================================
// COMPONENTS
// ============================================================================

const QuizCategoryCard: React.FC<{
  collection: StandardCollection;
  onPress: () => void;
  showFeaturedBadge?: boolean;
}> = ({ collection, onPress, showFeaturedBadge = true }) => {
  const { theme } = useTheme();
  const progressPercentage = collection.progress?.progress_percentage || 0;
  
  return (
    <TouchableOpacity
      style={[styles.categoryCard, { 
        backgroundColor: theme.card, 
        borderColor: theme.border,
        shadowColor: theme.shadow
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <ImageBackground
        source={{ uri: `https://picsum.photos/300/150?random=${collection.id}` }}
        style={styles.categoryImage}
        imageStyle={{ borderRadius: borderRadius.lg }}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
          style={styles.categoryGradient}
        >
          <View style={styles.categoryContent}>
            <Text style={styles.categoryEmoji}>{collection.emoji}</Text>
            <Text style={[styles.categoryTitle, { color: '#FFFFFF' }]} numberOfLines={2}>
              {collection.title}
            </Text>
            <Text style={[styles.categoryDescription, { color: '#E0E0E0' }]} numberOfLines={2}>
              {collection.description}
            </Text>
            
            {/* Progress indicator */}
            {progressPercentage > 0 && (
              <View style={styles.progressIndicator}>
                <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${progressPercentage}%`, 
                        backgroundColor: '#FFFFFF' 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: '#FFFFFF' }]}>
                  {Math.round(progressPercentage)}% complete
                </Text>
              </View>
            )}
            
            <View style={styles.categoryFooter}>
              <View style={styles.categoryMeta}>
                <Ionicons name="time-outline" size={14} color="#E0E0E0" />
                <Text style={[styles.metaText, { color: '#E0E0E0' }]}>
                  {collection.estimated_read_time}
                </Text>
              </View>
              
              <View style={styles.difficultyIndicator}>
                {Array.from({ length: collection.difficulty_level }, (_, i) => (
                  <View key={i} style={[styles.difficultyDot, { backgroundColor: '#FFFFFF' }]} />
                ))}
                {Array.from({ length: 5 - collection.difficulty_level }, (_, i) => (
                  <View key={i} style={[styles.difficultyDot, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                ))}
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
      
      {collection.is_featured && showFeaturedBadge && (
        <View style={[styles.featuredBadge, { backgroundColor: theme.primary }]}>
          <Ionicons name="star" size={12} color="#FFFFFF" />
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};



// Topic Card Component for individual topics
const TopicCard: React.FC<{
  topic: StandardTopic;
  onPress: () => void;
}> = ({ topic, onPress }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[styles.topicCard, { 
        backgroundColor: theme.card, 
        borderColor: theme.border,
        shadowColor: theme.shadow
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topicContent}>
        <Text style={styles.topicEmoji}>{topic.emoji || '📚'}</Text>
        <Text 
          style={[styles.topicTitle, { color: theme.foreground }]}
          numberOfLines={2}
        >
          {topic.title}
        </Text>
        <Text 
          style={[styles.topicDescription, { color: theme.foregroundSecondary }]}
          numberOfLines={3}
        >
          {topic.description || 'Explore this civic topic'}
        </Text>
        
        <View style={styles.topicFooter}>
          <View style={styles.topicMeta}>
            <Ionicons name="help-circle-outline" size={14} color={theme.foregroundSecondary} />
            <Text style={[styles.topicMetaText, { color: theme.foregroundSecondary }]}>
              {topic.question_count || 0} questions
            </Text>
          </View>
          
          <Ionicons name="chevron-forward" size={16} color={theme.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function QuizScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collections, setCollections] = useState<StandardCollection[]>([]);
  const [featuredCollections, setFeaturedCollections] = useState<StandardCollection[]>([]);
  const [topics, setTopics] = useState<StandardTopic[]>([]);
  const [dataSource, setDataSource] = useState<'api' | 'mock'>('mock');
  const [lastError, setLastError] = useState<string | null>(null);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [user?.id]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setLastError(null);
      
      console.log('🧠 Loading quiz collections and topics data...');

      // Fetch collections and topics from the standardized service
      const [collectionsResponse, featuredResponse, topicsResponse] = await Promise.all([
        fetchCollections({ status: 'published', limit: 50 }, { useCache: true }),
        fetchFeaturedCollections({ useCache: true }),
        fetchTopics(undefined, { useCache: true })
      ]);

      // Handle main collections response
      if (collectionsResponse.data && !collectionsResponse.error) {
        setCollections(collectionsResponse.data);
        setDataSource('api');
        console.log(`✅ Loaded ${collectionsResponse.data.length} quiz collections from API`);
        console.log(`📚 Real collections: ${collectionsResponse.data.map(c => c.title).join(', ')}`);
      } else if (collectionsResponse.error?.code === 'API_UNAVAILABLE' && collectionsResponse.data) {
        setCollections(collectionsResponse.data);
        setDataSource('mock');
        setLastError('Using offline quiz data - network unavailable');
        console.log(`📚 Using ${collectionsResponse.data.length} mock quiz collections`);
      } else {
        throw new Error(collectionsResponse.error?.message || 'Failed to load collections');
      }

      // Handle featured collections response
      if (featuredResponse.data && !featuredResponse.error) {
        setFeaturedCollections(featuredResponse.data);
        console.log(`✅ Loaded ${featuredResponse.data.length} featured quiz collections`);
      } else if (featuredResponse.error?.code === 'API_UNAVAILABLE' && featuredResponse.data) {
        setFeaturedCollections(featuredResponse.data);
        console.log(`📚 Using ${featuredResponse.data.length} mock featured collections`);
      }

      // Handle topics response  
      if (topicsResponse.data && !topicsResponse.error) {
        setTopics(topicsResponse.data);
        console.log(`✅ Loaded ${topicsResponse.data.length} topics from API`);
      } else if (topicsResponse.error?.code === 'API_UNAVAILABLE' && topicsResponse.data) {
        setTopics(topicsResponse.data);
        console.log(`📚 Using ${topicsResponse.data.length} mock topics`);
      }

    } catch (error) {
      console.error('❌ Error loading quiz collections and topics:', error);
      setLastError(error instanceof Error ? error.message : 'Unknown error');
      
      // Try to load mock data as fallback
      const mockResponse = await fetchCollections({ status: 'published' }, { useCache: false });
      if (mockResponse.data) {
        setCollections(mockResponse.data);
        setDataSource('mock');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleQuizPress = (collection: StandardCollection) => {
    console.log('🧠 Quiz collection selected:', collection.title);
    console.log('🧠 Using slug:', collection.slug);
    router.push(`/collections/${collection.slug}` as any);
  };

  const handleTopicPress = (topic: StandardTopic) => {
    console.log('📚 Topic selected:', topic.title);
    console.log('📚 Using topic ID:', topic.id);
    // Navigate to topic info screen to learn more before starting quiz
    router.push(`/topic/${topic.id}` as any);
  };





  const renderFeaturedCollections = () => {
    if (featuredCollections.length === 0) return null;

    return (
      <FlatList
        data={featuredCollections}
        renderItem={({ item }) => (
          <QuizCategoryCard
            collection={item}
            onPress={() => handleQuizPress(item)}
            showFeaturedBadge={false}
          />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        ItemSeparatorComponent={() => <View style={styles.carouselSeparator} />}
      />
    );
  };

  const renderAllCollections = () => {
    const regularCollections = collections.filter(c => !c.is_featured);
    
    if (regularCollections.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateTitle, { color: theme.foreground }]}>
            No quiz collections available
          </Text>
          <Text style={[styles.emptyStateText, { color: theme.foregroundSecondary }]}>
            {dataSource === 'mock' 
              ? 'Check your internet connection and try again'
              : 'New quiz collections will appear here when available'
            }
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.collectionsGrid}>
        {regularCollections.map((collection) => (
          <QuizCategoryCard
            key={collection.id}
            collection={collection}
            onPress={() => handleQuizPress(collection)}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Loading quiz collections...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: 'Learn',
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
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/search')}
              style={{ padding: spacing.xs, marginRight: 16 }}
              accessibilityRole="button"
              accessibilityLabel="Search topics"
            >
              <Ionicons name="search-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      {/* Data Source Indicator */}
      {lastError && (
        <View style={[styles.statusBar, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="warning-outline" size={16} color="#92400E" />
          <Text style={[styles.statusText, { color: '#92400E' }]}>
            {lastError}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >




        {/* Featured Collections -> Featured Lessons */}
        {featuredCollections.length > 0 && (
          <View style={[styles.section, styles.firstSection]}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
              Featured Lessons
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.foregroundSecondary }]}>
              Curated lesson collections for current topics
            </Text>
            {renderFeaturedCollections()}
          </View>
        )}

        {/* All Collections - only show if not empty */}
        {collections.filter(c => !c.is_featured).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
                  All Collections
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.foregroundSecondary }]}>
                  Comprehensive civic knowledge testing
                </Text>
              </View>
              <Text style={[styles.collectionCount, { color: theme.foregroundSecondary }]}>
                {collections.filter(c => !c.is_featured).length} collections
              </Text>
            </View>
            {renderAllCollections()}
          </View>
        )}

        {/* Topics Section - moved below with filter icons */}
        {topics.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
                  Topics
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.foregroundSecondary }]}>
                  Explore individual civic topics with targeted questions
                </Text>
              </View>
              <View style={styles.topicFilters}>
                <TouchableOpacity style={[styles.filterButton, { borderColor: theme.border }]}>
                  <Ionicons name="filter-outline" size={16} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, { borderColor: theme.border }]}>
                  <Ionicons name="search-outline" size={16} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <FlatList
              data={topics.slice(0, 10)} // Show first 10 topics
              renderItem={({ item }) => (
                <TopicCard
                  topic={item}
                  onPress={() => handleTopicPress(item)}
                />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              ItemSeparatorComponent={() => <View style={styles.carouselSeparator} />}
            />
          </View>
        )}

        {/* Data Source Info */}
        <View style={[styles.dataSourceInfo, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.dataSourceRow}>
            <Ionicons 
              name={dataSource === 'api' ? 'cloud-outline' : 'archive-outline'} 
              size={16} 
              color={theme.foregroundSecondary} 
            />
            <Text style={[styles.dataSourceText, { color: theme.foregroundSecondary }]}>
              Quiz data source: {dataSource === 'api' ? 'Live API' : 'Offline cache'}
            </Text>
          </View>
          <Text style={[styles.dataSourceDetails, { color: theme.foregroundTertiary }]}>
            {dataSource === 'api' 
              ? 'Showing real-time quiz collections from server'
              : 'Using cached quiz data - some content may be outdated'
            }
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(146, 64, 14, 0.2)',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    letterSpacing: 0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingTop: 0, // No top padding needed
    paddingBottom: spacing.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl * 1.5,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: fontFamily.mono,
    letterSpacing: 0.2,
  },

  header: {
    paddingVertical: spacing.xl * 1.5,
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '400',
    fontFamily: fontFamily.mono,
    lineHeight: 40,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fontFamily.mono,
    opacity: 0.8,
  },

  section: {
    marginBottom: spacing.xl,
  },
  firstSection: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    lineHeight: 32,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fontFamily.mono,
    opacity: 0.7,
    marginBottom: spacing.sm,
  },
  collectionCount: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fontFamily.mono,
    opacity: 0.6,
    letterSpacing: 0.3,
  },



  // Category Card Styles
  categoryCard: {
    width: 320,
    height: 220,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.2,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 10,
      },
    }),
  },
  categoryImage: {
    flex: 1,
  },
  categoryGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  categoryContent: {
    padding: spacing.xl,
  },
  categoryEmoji: {
    fontSize: 36,
    marginBottom: spacing.md,
    textAlign: 'left',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    lineHeight: 28,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
    fontFamily: fontFamily.mono,
    opacity: 0.9,
  },
  progressIndicator: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    letterSpacing: 0.3,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fontFamily.mono,
    letterSpacing: 0.2,
  },
  difficultyIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  featuredText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fontFamily.mono,
    letterSpacing: 0.5,
  },

  // Collections Grid
  collectionsGrid: {
    gap: spacing.lg,
  },

  // Carousel styles
  carouselContent: {
    paddingLeft: spacing.sm,
    paddingRight: spacing.xl,
  },
  carouselSeparator: {
    width: spacing.lg,
  },

  // Empty state
  emptyState: {
    padding: spacing.xl * 1.5,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    marginBottom: spacing.md,
    letterSpacing: -0.2,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: fontFamily.mono,
    opacity: 0.7,
  },

  // Data source info
  dataSourceInfo: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  dataSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dataSourceText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    letterSpacing: 0.2,
  },
  dataSourceDetails: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fontFamily.mono,
    opacity: 0.7,
  },

  // Lesson Card Styles (Missing)
  lessonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.lg,
    marginBottom: spacing.md,
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
  lessonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  lessonBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  newBadge: {
    backgroundColor: '#EF4444',
  },
  lessonFeaturedBadge: {
    backgroundColor: '#3B82F6',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  difficultyText: {
    fontSize: 12,
  },
  difficultyLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  lessonCardContent: {
    marginBottom: spacing.md,
  },
  lessonEmoji: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xs,
    lineHeight: 22,
    textAlign: 'left',
  },
  lessonDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  lessonCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  // Featured Lesson Card Styles (Missing)
  featuredLessonCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  featuredGradient: {
    padding: spacing.lg,
  },
  featuredContent: {
    gap: spacing.md,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredEmoji: {
    fontSize: 32,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  featuredDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Category Card Styles (Missing)
  categoryCardContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  // Practice Mode Card Styles (Missing)
  practiceModeCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 120,
  },
  practiceModeEmoji: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  practiceModeTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  practiceModeDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Stats Card Styles (Missing)
  statsCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 100,
  },
  statsEmoji: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  statsSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Spacing
  bottomSpacer: {
    height: spacing.xl * 2,
  },

  // Topic Card Styles
  topicCard: {
    width: 280,
    height: 180,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.2,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 10,
      },
    }),
  },
  topicContent: {
    padding: spacing.xl,
    flex: 1,
    justifyContent: 'space-between',
  },
  topicEmoji: {
    fontSize: 36,
    marginBottom: spacing.md,
    textAlign: 'left',
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    lineHeight: 26,
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  topicDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
    fontFamily: fontFamily.mono,
    opacity: 0.8,
    flex: 1,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topicMetaText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fontFamily.mono,
    letterSpacing: 0.2,
  },

  // Topic Filters
  topicFilters: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  filterButton: {
    padding: spacing.md,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
}); 