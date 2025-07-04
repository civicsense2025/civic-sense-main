import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { usePremium } from '../../lib/hooks/usePremium';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { spacing, borderRadius, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

interface DiscoverableCollection {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  created_by: string;
  author_display_name?: string;
  author_username?: string;
  author_avatar_url?: string;
  author_bio?: string;
  question_count: number;
  avg_rating: number;
  rating_count: number;
  play_count: number;
  created_at: string;
  published_at: string;
  visibility: 'private' | 'public' | 'unlisted';
  status: string;
}

type SortOption = 'recent' | 'popular' | 'top_rated' | 'most_played';
type FilterOption = 'all' | 'beginner' | 'intermediate' | 'advanced';

export default function DiscoverContentScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  
  // State
  const [collections, setCollections] = useState<DiscoverableCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const ITEMS_PER_PAGE = 10;
  const currentPage = useRef(0);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      
      // Query public collections with author information
      let query = supabase
        .from('custom_content_collections')
        .select(`
          *,
          created_by_profile:profiles!created_by(display_name, username, avatar_url, bio),
          engagement_stats:collection_engagement(rating, has_liked),
          play_stats:collection_play_sessions(id, is_completed)
        `)
        .eq('visibility', 'public')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(20);
      
      const { data: rawCollections, error } = await query;
      
      if (error) {
        console.error('Error loading collections:', error);
        throw error;
      }
      
      // Transform data to match expected interface
      const transformedCollections = (rawCollections || []).map((collection: any) => ({
        ...collection,
        author_display_name: collection.created_by_profile?.display_name,
        author_username: collection.created_by_profile?.username,
        author_avatar_url: collection.created_by_profile?.avatar_url,
        author_bio: collection.created_by_profile?.bio,
        avg_rating: collection.engagement_stats?.length > 0 ? 
          collection.engagement_stats.reduce((sum: number, e: any) => sum + (e.rating || 0), 0) / 
          collection.engagement_stats.filter((e: any) => e.rating).length : 0,
        rating_count: collection.engagement_stats?.filter((e: any) => e.rating).length || 0,
        play_count: collection.play_stats?.length || 0,
      }));
      
      setCollections(transformedCollections);
    } catch (error) {
      console.error('Error loading collections:', error);
      Alert.alert('Error', 'Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayCollection = (collection: DiscoverableCollection) => {
    if (!isPremium && collection.owner_id !== user?.id) {
      Alert.alert(
        'Premium Required',
        'Upgrade to CivicSense Pro to play community-created content.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/premium/upgrade' as any) },
        ]
      );
      return;
    }

    // Navigate to play screen
    router.push({
      pathname: '/quiz/custom/[collectionId]',
      params: { collectionId: collection.id }
    } as any);
  };

  const renderCollectionCard = (collection: DiscoverableCollection) => (
    <Card key={collection.id} style={styles.collectionCard} variant="outlined">
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={[styles.cardTitle, { color: theme.foreground }]} numberOfLines={2}>
            {collection.title}
          </Text>
          <Text style={[styles.cardAuthor, { color: theme.foregroundSecondary }]}>
            by {collection.author_display_name || collection.author_username || 'Anonymous'}
          </Text>
        </View>
        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={[styles.statText, { color: theme.foregroundSecondary }]}>
              {collection.avg_rating.toFixed(1)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="play" size={12} color={theme.primary} />
            <Text style={[styles.statText, { color: theme.foregroundSecondary }]}>
              {collection.play_count}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.cardDescription, { color: theme.foregroundSecondary }]} numberOfLines={3}>
        {collection.description}
      </Text>

      <View style={styles.cardMeta}>
        <View style={styles.cardMetaLeft}>
          <View style={[styles.questionCountBadge, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.questionCountText, { color: theme.primary }]}>
              {collection.question_count} questions
            </Text>
          </View>
          <View style={[styles.tagBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.tagText, { color: theme.foregroundSecondary }]}>
              {collection.visibility}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: theme.primary }]}
          onPress={() => handlePlayCollection(collection)}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={16} color="#FFFFFF" />
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Discover Content', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Loading community content...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Discover Content',
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
        }}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadCollections} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[theme.primary + '10', theme.background]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🌟</Text>
            <Text style={[styles.headerTitle, { color: theme.foreground }]}>
              Community Quizzes
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.foregroundSecondary }]}>
              Discover AI-generated civic education content created by our community
            </Text>
          </View>
        </LinearGradient>

        {/* Collections */}
        <View style={styles.collectionsContainer}>
          {collections.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>🔍</Text>
              <Text style={[styles.emptyStateTitle, { color: theme.foreground }]}>
                No content found
              </Text>
              <Text style={[styles.emptyStateText, { color: theme.foregroundSecondary }]}>
                Check back soon for community-created content
              </Text>
            </View>
          ) : (
            collections.map(renderCollectionCard)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
  },

  // Header
  headerGradient: {
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.title2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Collections
  collectionsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  collectionCard: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  cardTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  cardAuthor: {
    ...typography.caption1,
  },
  cardStats: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...typography.caption1,
    fontWeight: '600',
  },
  cardDescription: {
    ...typography.footnote,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  questionCountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionCountText: {
    ...typography.caption1,
    fontWeight: '600',
    fontSize: 10,
  },
  tagBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    ...typography.caption,
    fontSize: 9,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    gap: spacing.xs,
  },
  playButtonText: {
    ...typography.caption1,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    ...typography.title3,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    textAlign: 'center',
  },
}); 