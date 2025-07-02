import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { spacing, borderRadius, fontFamily, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import useUIStrings from '../../lib/hooks/useUIStrings';
import { Collection, getDifficultyInfo, formatMobileEstimatedTime } from '../../types/collections';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList } from 'react-native';

const { width } = Dimensions.get('window');

interface CollectionListItem {
  id: string;
  title: string;
  description: string;
  slug: string;
  emoji: string;
  estimated_minutes: number;
  difficulty_level: string;
  categories: string[];
  tags: string[];
  step_count: number;
  created_at: string;
  status: string;
  visibility: string;
}

export default function CollectionsIndexScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { uiStrings } = useUIStrings();

  const [collections, setCollections] = useState<CollectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [featuredCollections, setFeaturedCollections] = useState<CollectionListItem[]>([]);

  const categories = [
    { id: 'all', name: 'All Courses', emoji: '📚' },
    { id: 'congress', name: 'Congress', emoji: '🏛️' },
    { id: 'elections', name: 'Elections', emoji: '🗳️' },
    { id: 'constitution', name: 'Constitution', emoji: '📜' },
    { id: 'local-government', name: 'Local Gov', emoji: '🏙️' },
    { id: 'policy', name: 'Policy', emoji: '📋' },
    { id: 'activism', name: 'Activism', emoji: '✊' }
  ];

  const difficulties = [
    { id: 'all', name: 'All Levels' },
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' }
  ];

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      
      // Try to load from API first
      console.log('🔄 Loading collections from API...');
      const response = await fetch('http://localhost:3000/api/collections');
      
      let collectionsData: CollectionListItem[] = [];
      
      if (response.ok) {
        const data = await response.json();
        collectionsData = data.collections || [];
        console.log('✅ Successfully loaded collections from API:', collectionsData.length);
      } else {
        console.warn('⚠️ API request failed, using mock data');
        collectionsData = getMockCollections();
      }
      
      setCollections(collectionsData);
      setFeaturedCollections(collectionsData.slice(0, 5));
    } catch (error) {
      console.error('❌ Error loading collections:', error);
      console.log('📦 Falling back to mock data');
      setCollections(getMockCollections());
      setFeaturedCollections(getMockCollections().slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  const getMockCollections = (): CollectionListItem[] => {
    return [
      {
        id: '1',
        title: 'Congress Decoded',
        description: 'Discover how America\'s $6.8 trillion federal budget really gets decided and who holds the real power in Washington.',
        slug: 'congress-decoded-2024',
        emoji: '🏛️',
        estimated_minutes: 45,
        difficulty_level: 'intermediate',
        categories: ['congress', 'policy'],
        tags: ['budget', 'legislation', 'committees'],
        step_count: 5,
        created_at: '2024-01-15T00:00:00Z',
        status: 'published',
        visibility: 'public'
      },
      {
        id: '2',
        title: 'Local Power Structures',
        description: 'Your city council controls more of your daily life than you think. Learn how to navigate and influence local politics.',
        slug: 'local-power-structures',
        emoji: '🏙️',
        estimated_minutes: 30,
        difficulty_level: 'beginner',
        categories: ['local-government'],
        tags: ['city-council', 'zoning', 'permits'],
        step_count: 4,
        created_at: '2024-01-20T00:00:00Z',
        status: 'published',
        visibility: 'public'
      },
      {
        id: '3',
        title: 'Election Mechanics Exposed',
        description: 'Beyond voting: How gerrymandering, voter registration, and electoral systems actually determine election outcomes.',
        slug: 'election-mechanics-exposed',
        emoji: '🗳️',
        estimated_minutes: 60,
        difficulty_level: 'advanced',
        categories: ['elections'],
        tags: ['gerrymandering', 'voter-registration', 'electoral-college'],
        step_count: 7,
        created_at: '2024-01-25T00:00:00Z',
        status: 'published',
        visibility: 'public'
      },
      {
        id: '4',
        title: 'Constitutional Loopholes',
        description: 'The Constitution has backdoors that let politicians bypass checks and balances. Here\'s how they work.',
        slug: 'constitutional-loopholes',
        emoji: '📜',
        estimated_minutes: 50,
        difficulty_level: 'advanced',
        categories: ['constitution'],
        tags: ['executive-power', 'emergency-powers', 'precedent'],
        step_count: 6,
        created_at: '2024-02-01T00:00:00Z',
        status: 'published',
        visibility: 'public'
      },
      {
        id: '5',
        title: 'Grassroots Organizing Tactics',
        description: 'How to build real political power from the ground up. Learn the strategies that actually work.',
        slug: 'grassroots-organizing-tactics',
        emoji: '✊',
        estimated_minutes: 40,
        difficulty_level: 'intermediate',
        categories: ['activism'],
        tags: ['organizing', 'campaigns', 'coalition-building'],
        step_count: 5,
        created_at: '2024-02-05T00:00:00Z',
        status: 'published',
        visibility: 'public'
      },
      // Real database collections
      {
        id: '372866d6-fee8-4a03-8d66-f8fc19c5cd90',
        title: 'Three Branches of Government: Powers and Responsibilities',
        description: 'Understand how executive, legislative, and judicial powers really work - and how they\'ve shifted over time.',
        slug: 'three-branches-fundamentals',
        emoji: '⚖️',
        estimated_minutes: 45,
        difficulty_level: 'intermediate',
        categories: ['constitution', 'government'],
        tags: ['executive', 'legislative', 'judicial', 'separation-of-powers'],
        step_count: 6,
        created_at: '2024-01-15T00:00:00Z',
        status: 'published',
        visibility: 'public'
      },
      {
        id: '57ddffe5-0496-4a18-9d46-2380292736a5',
        title: 'Congress Decoded: How Laws Actually Get Made',
        description: 'Discover how America\'s $6.8 trillion federal budget really gets decided and who holds the real power in Washington.',
        slug: 'congress-decoded',
        emoji: '🏛️',
        estimated_minutes: 240,
        difficulty_level: 'intermediate',
        categories: ['congress', 'policy'],
        tags: ['budget', 'legislation', 'committees', 'lobbying'],
        step_count: 8,
        created_at: '2024-01-15T00:00:00Z',
        status: 'published',
        visibility: 'public'
      },
      {
        id: 'federal-budget-decoded-id',
        title: 'Federal Budget Decoded: Where Your Tax Money Really Goes',
        description: 'Follow the money: How $6.8 trillion gets allocated and who really decides where it goes.',
        slug: 'federal-budget-decoded',
        emoji: '💰',
        estimated_minutes: 40,
        difficulty_level: 'intermediate',
        categories: ['budget', 'economics'],
        tags: ['federal-spending', 'taxes', 'appropriations', 'debt'],
        step_count: 5,
        created_at: '2024-02-10T00:00:00Z',
        status: 'published',
        visibility: 'public'
      },
      {
        id: 'voter-rights-realities-id',
        title: 'Voter Rights: The Realities of American Elections',
        description: 'Beyond voting: How gerrymandering, voter registration, and electoral systems actually determine election outcomes.',
        slug: 'voter-rights-realities',
        emoji: '🗳️',
        estimated_minutes: 60,
        difficulty_level: 'advanced',
        categories: ['elections', 'voting-rights'],
        tags: ['gerrymandering', 'voter-registration', 'electoral-college', 'redistricting'],
        step_count: 7,
        created_at: '2024-01-25T00:00:00Z',
        status: 'published',
        visibility: 'public'
      },
      {
        id: 'political-parties-power-id',
        title: 'Political Parties: How They Really Control Government',
        description: 'Political parties have power the Constitution never intended. Learn how they shape every aspect of government.',
        slug: 'political-parties-power',
        emoji: '🎭',
        estimated_minutes: 35,
        difficulty_level: 'intermediate',
        categories: ['parties', 'politics'],
        tags: ['parties', 'primaries', 'fundraising', 'leadership'],
        step_count: 4,
        created_at: '2024-02-15T00:00:00Z',
        status: 'published',
        visibility: 'public'
      }
    ];
  };

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         collection.description.toLowerCase().includes(searchText.toLowerCase()) ||
                         collection.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || collection.categories.includes(selectedCategory);
    const matchesDifficulty = selectedDifficulty === 'all' || collection.difficulty_level === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty && collection.status === 'published';
  });

  const handleCollectionPress = (collection: CollectionListItem) => {
    router.push(`/collections/${collection.slug}`);
  };

  const renderCollectionCard = useCallback(({ item }: { item: CollectionListItem }) => (
    <TouchableOpacity
      style={styles.collectionCard}
      onPress={() => handleCollectionPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={3}>
          {item.description}
        </Text>
        
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="library-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.metaText}>{item.step_count} steps</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.metaText}>{formatMobileEstimatedTime(item.estimated_minutes)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ), [handleCollectionPress]);

  const keyExtractor = useCallback((item: CollectionListItem) => item.id, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Loading collections...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            
            <Text style={styles.headerTitle}>Collections</Text>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/search')}
            >
              <Ionicons name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroEmoji}>📚</Text>
            <Text style={styles.heroTitle}>Civic Collections</Text>
            <Text style={styles.heroDescription}>
              Curated learning paths that reveal how power actually works in America
            </Text>
          </View>
          
          {/* Featured Collections */}
          {featuredCollections.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Featured</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredScroll}
              >
                {featuredCollections.map((collection) => (
                  <TouchableOpacity
                    key={collection.id}
                    style={styles.featuredCard}
                    onPress={() => handleCollectionPress(collection)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.featuredEmoji}>{collection.emoji}</Text>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                      {collection.title}
                    </Text>
                    <Text style={styles.featuredMeta}>
                      {collection.step_count} steps
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* All Collections */}
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>All Collections</Text>
            <FlatList
              data={filteredCollections}
              renderItem={renderCollectionCard}
              keyExtractor={keyExtractor}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
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
  headerTitle: {
    ...typography.title2,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  heroEmoji: {
    fontSize: 48,
    lineHeight: 56,
    marginBottom: spacing.md,
  },
  heroTitle: {
    ...typography.title1,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: fontFamily.mono,
  },
  heroDescription: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: fontFamily.mono,
    maxWidth: 300,
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.title3,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    fontFamily: fontFamily.mono,
  },

  // Featured Collections
  featuredScroll: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  featuredCard: {
    width: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featuredEmoji: {
    fontSize: 32,
    lineHeight: 40,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  featuredTitle: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontFamily: fontFamily.mono,
    minHeight: 44,
  },
  featuredMeta: {
    ...typography.footnote,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontFamily: fontFamily.mono,
  },

  // Collections List
  listSection: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  collectionCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    margin: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 160,
  },
  cardContent: {
    padding: spacing.md,
    flex: 1,
  },
  cardEmoji: {
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontFamily: fontFamily.mono,
    minHeight: 40,
  },
  cardDescription: {
    ...typography.footnote,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
    fontFamily: fontFamily.mono,
    flex: 1,
  },
  cardMeta: {
    gap: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: fontFamily.mono,
  },
}); 