import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserContentService, type UserContentAnnotation } from '../../lib/services/user-content-service';
import { ProfileRefreshControl } from '../../components/ui/EnhancedRefreshControl';
import { SimpleTopicInfoScreen } from '../../components/ui/SimpleTopicInfoScreen';
import { supabase } from '../../lib/supabase';

// ============================================================================
// INTERFACES
// ============================================================================

interface SavedItemDetails {
  id: string;
  type: 'bookmark' | 'topic' | 'article' | 'quiz_result';
  title: string;
  description?: string;
  imageUrl?: string;
  emoji?: string;
  savedAt: string;
  categoryOrSource?: string;
  originalPath: string;
  metadata?: any;
}

// ============================================================================
// CONTENT TYPE VALIDATION
// ============================================================================

/**
 * Validates and normalizes content type to match database constraint
 * Database only allows: 'bookmark', 'topic', 'article', 'quiz_result'
 */
const validateContentType = (itemType: string | undefined): 'bookmark' | 'topic' | 'article' | 'quiz_result' => {
  if (!itemType) return 'bookmark'; // Default fallback
  
  const normalizedType = itemType.toLowerCase().trim();
  
  // Direct matches
  if (['bookmark', 'topic', 'article', 'quiz_result'].includes(normalizedType)) {
    return normalizedType as 'bookmark' | 'topic' | 'article' | 'quiz_result';
  }
  
  // Handle common variations and mappings
  switch (normalizedType) {
    case 'topics':
    case 'quiz_topic':
    case 'topic_id':
      return 'topic';
    case 'bookmarks':
    case 'saved_item':
    case 'saved_content':
      return 'bookmark';
    case 'articles':
    case 'content':
    case 'post':
      return 'article';
    case 'quiz':
    case 'quiz_results':
    case 'assessment':
    case 'test_result':
      return 'quiz_result';
    default:
      console.warn(`⚠️ Unknown content type: "${itemType}", defaulting to 'bookmark'`);
      return 'bookmark'; // Safe fallback
  }
};

// ============================================================================
// PRE-DEFINED OPTIONS (AIRBNB-STYLE)
// ============================================================================

const RATING_OPTIONS = [
  { value: 5, emoji: '🤩', label: 'Amazing', description: 'Exceeded expectations' },
  { value: 4, emoji: '😍', label: 'Great', description: 'Really valuable' },
  { value: 3, emoji: '🙂', label: 'Good', description: 'Worth my time' },
  { value: 2, emoji: '😐', label: 'Okay', description: 'Somewhat helpful' },
  { value: 1, emoji: '😞', label: 'Poor', description: 'Not very useful' },
];

const WHY_SAVED_OPTIONS = [
  { id: 'work', emoji: '💼', label: 'For work', description: 'Professional development' },
  { id: 'education', emoji: '🎓', label: 'Learning', description: 'Personal education' },
  { id: 'voting', emoji: '🗳️', label: 'Voting decisions', description: 'Help me vote wisely' },
  { id: 'discussion', emoji: '💬', label: 'Discussions', description: 'Share with others' },
  { id: 'curious', emoji: '🤔', label: 'Curious', description: 'Interesting perspective' },
  { id: 'follow_up', emoji: '📖', label: 'Read later', description: 'Want to dive deeper' },
];

const HOW_APPLIES_OPTIONS = [
  { id: 'daily_life', emoji: '🏠', label: 'Daily life', description: 'Affects my everyday decisions' },
  { id: 'career', emoji: '🚀', label: 'Career', description: 'Relevant to my profession' },
  { id: 'community', emoji: '🏘️', label: 'Community', description: 'Local issues I care about' },
  { id: 'family', emoji: '👨‍👩‍👧‍👦', label: 'Family', description: 'Impacts my family' },
  { id: 'future', emoji: '🔮', label: 'Future plans', description: 'Long-term goals' },
  { id: 'current_events', emoji: '📰', label: 'Current events', description: 'Understanding the news' },
];

const INSIGHT_CATEGORIES = [
  { id: 'key_fact', emoji: '💡', label: 'Key fact', description: 'Important information' },
  { id: 'surprising', emoji: '😲', label: 'Surprising', description: 'Unexpected insight' },
  { id: 'controversial', emoji: '⚡', label: 'Controversial', description: 'Debatable point' },
  { id: 'actionable', emoji: '🎯', label: 'Actionable', description: 'Something I can do' },
  { id: 'historical', emoji: '📚', label: 'Historical', description: 'Important context' },
  { id: 'personal', emoji: '🤲', label: 'Personal', description: 'Resonates with me' },
];

const POPULAR_TAGS = [
  '📌 Important',
  '🔥 Must-read',
  '📚 Educational',
  '💡 Eye-opening',
  '🎯 Actionable',
  '🤔 Thought-provoking',
  '📈 Trending',
  '⚖️ Legal',
  '🏛️ Policy',
  '🗳️ Elections',
  '📊 Data-driven',
  '🏃‍♂️ Quick read',
];

// ============================================================================
// COMPONENTS
// ============================================================================

interface OptionSelectorProps {
  title: string;
  options: Array<{ id: string; emoji: string; label: string; description: string }>;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  multiSelect?: boolean;
}

const OptionSelector: React.FC<OptionSelectorProps> = ({
  title,
  options,
  selectedIds,
  onSelectionChange,
  multiSelect = false,
}) => {
  const { theme } = useTheme();

  const handleSelect = (id: string) => {
    if (multiSelect) {
      const newSelection = selectedIds.includes(id)
        ? selectedIds.filter(sid => sid !== id)
        : [...selectedIds, id];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(selectedIds.includes(id) ? [] : [id]);
    }
  };

  return (
    <View style={styles.optionSelector}>
      <Text variant="callout" color="inherit" style={styles.optionTitle}>
        {title}
      </Text>
      <View style={styles.optionsGrid}>
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                {
                  backgroundColor: isSelected ? `${theme.primary}15` : theme.card,
                  borderColor: isSelected ? theme.primary : theme.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => handleSelect(option.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text 
                variant="footnote" 
                color="inherit" 
                style={[
                  styles.optionLabel,
                  { color: isSelected ? theme.primary : theme.foreground }
                ]}
              >
                {option.label}
              </Text>
              <Text 
                variant="caption1" 
                color="secondary" 
                style={styles.optionDescription}
              >
                {option.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

interface RatingStarsProps {
  rating: number | null;
  onRatingChange: (rating: number | null) => void;
}

const RatingStars: React.FC<RatingStarsProps> = ({ rating, onRatingChange }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.ratingSelector}>
      <Text variant="callout" color="inherit" style={styles.ratingTitle}>
        ⭐ How would you rate this content?
      </Text>
      <View style={styles.ratingOptions}>
        {RATING_OPTIONS.map((option) => {
          const isSelected = rating === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.ratingOption,
                {
                  backgroundColor: isSelected ? `${theme.primary}15` : theme.card,
                  borderColor: isSelected ? theme.primary : theme.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => onRatingChange(isSelected ? null : option.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.ratingEmoji}>{option.emoji}</Text>
              <Text 
                variant="footnote" 
                color="inherit" 
                style={[
                  styles.ratingLabel,
                  { color: isSelected ? theme.primary : theme.foreground }
                ]}
              >
                {option.label}
              </Text>
              <Text 
                variant="caption1" 
                color="secondary" 
                style={styles.ratingDescription}
              >
                {option.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({ selectedTags, onTagsChange }) => {
  const { theme } = useTheme();
  const [customTag, setCustomTag] = useState('');

  const handleTagSelect = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(newTags);
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      onTagsChange([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  return (
    <View style={styles.tagSelector}>
      <Text variant="callout" color="inherit" style={styles.tagTitle}>
        🏷️ Add tags (tap to select)
      </Text>
      
      {/* Popular tags */}
      <View style={styles.tagsContainer}>
        {POPULAR_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagChip,
                {
                  backgroundColor: isSelected ? theme.primary : theme.card,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => handleTagSelect(tag)}
              activeOpacity={0.7}
            >
              <Text 
                variant="caption1" 
                style={[
                  styles.tagText,
                  { color: isSelected ? '#FFFFFF' : theme.foreground }
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom tag input */}
      <View style={styles.customTagInput}>
        <TextInput
          style={[
            styles.tagInput,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              color: theme.foreground,
            },
          ]}
          value={customTag}
          onChangeText={setCustomTag}
          placeholder="Add custom tag..."
          placeholderTextColor={theme.foregroundSecondary}
          onSubmitEditing={handleAddCustomTag}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[
            styles.addTagButton,
            { backgroundColor: customTag.trim() ? theme.primary : theme.border },
          ]}
          onPress={handleAddCustomTag}
          disabled={!customTag.trim()}
        >
          <Ionicons 
            name="add" 
            size={20} 
            color={customTag.trim() ? '#FFFFFF' : theme.foregroundSecondary} 
          />
        </TouchableOpacity>
      </View>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <View style={styles.selectedTagsContainer}>
          <Text variant="footnote" color="secondary" style={styles.selectedTagsLabel}>
            Selected tags:
          </Text>
          <View style={styles.selectedTags}>
            {selectedTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.selectedTag, { backgroundColor: theme.primary }]}
                onPress={() => handleTagSelect(tag)}
              >
                <Text variant="caption1" style={styles.selectedTagText}>
                  {tag}
                </Text>
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

interface CollapsibleSectionProps {
  title: string;
  emoji: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  emoji,
  children,
  defaultExpanded = false,
}) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const animatedHeight = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const toggleExpanded = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(animatedHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  return (
    <Card style={styles.collapsibleCard} variant="outlined">
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.collapsibleHeaderContent}>
          <Text style={styles.collapsibleEmoji}>{emoji}</Text>
          <Text variant="callout" color="inherit" style={styles.collapsibleTitle}>
            {title}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={theme.foregroundSecondary}
        />
      </TouchableOpacity>
      
      <Animated.View
        style={[
          styles.collapsibleContent,
          {
            opacity: animatedHeight,
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1000], // Adjust based on content
            }),
          },
        ]}
      >
        {children}
      </Animated.View>
    </Card>
  );
};

const CustomCollectionAnalytics: React.FC<{ collectionId: string }> = ({ collectionId }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [collectionId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load collection details and analytics
      const { data: collectionData, error: collectionError } = await supabase
        .from('custom_content_collections')
        .select(`
          *,
          collection_engagement(rating, has_liked, has_saved),
          collection_shares(id),
          collection_play_sessions(id, is_completed)
        `)
        .eq('id', collectionId)
        .single();

      if (collectionData) {
        // Calculate analytics from related data
        const ratings = collectionData.collection_engagement?.map((e: any) => e.rating).filter(Boolean) || [];
        const avgRating = ratings.length > 0 ? 
          ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length : 0;
        
        const totalPlays = collectionData.collection_play_sessions?.length || 0;
        const totalShares = collectionData.collection_shares?.length || 0;
        
        setAnalytics({
          totalPlays,
          totalShares,
          avgRating: avgRating.toFixed(1),
          recentData: [],
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    router.push({
      pathname: '/premium/share-collection',
      params: { collectionId }
    } as any);
  };

  if (loading) {
    return (
      <View style={styles.analyticsLoading}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={[styles.analyticsLoadingText, { color: theme.foregroundSecondary }]}>
          Loading analytics...
        </Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.analyticsEmpty}>
        <Text style={[styles.analyticsEmptyText, { color: theme.foregroundSecondary }]}>
          No analytics data available yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.analyticsContainer}>
      {/* Stats Row */}
      <View style={styles.analyticsStats}>
        <View style={styles.analyticsStat}>
          <Text style={[styles.analyticsStatValue, { color: theme.primary }]}>
            {analytics.totalPlays}
          </Text>
          <Text style={[styles.analyticsStatLabel, { color: theme.foregroundSecondary }]}>
            Total Plays
          </Text>
        </View>
        <View style={styles.analyticsStat}>
          <Text style={[styles.analyticsStatValue, { color: '#F59E0B' }]}>
            {analytics.avgRating}
          </Text>
          <Text style={[styles.analyticsStatLabel, { color: theme.foregroundSecondary }]}>
            Avg Rating
          </Text>
        </View>
        <View style={styles.analyticsStat}>
          <Text style={[styles.analyticsStatValue, { color: '#10B981' }]}>
            {analytics.totalShares}
          </Text>
          <Text style={[styles.analyticsStatLabel, { color: theme.foregroundSecondary }]}>
            Shares
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.analyticsActions}>
        <TouchableOpacity
          style={[styles.analyticsAction, { backgroundColor: theme.primary }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Ionicons name="share" size={16} color="#FFFFFF" />
          <Text style={styles.analyticsActionText}>Share & Collaborate</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.analyticsAction, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
          onPress={() => router.push({
            pathname: '/premium/discover-content'
          } as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="compass" size={16} color={theme.primary} />
          <Text style={[styles.analyticsActionText, { color: theme.primary }]}>Discover Others</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SavedContentViewScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { itemId, itemType, itemTitle } = useLocalSearchParams<{
    itemId: string;
    itemType: string;
    itemTitle: string;
  }>();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [annotation, setAnnotation] = useState<UserContentAnnotation | null>(null);
  const [itemDetails, setItemDetails] = useState<SavedItemDetails | null>(null);

  // Airbnb-style form state
  const [personalRating, setPersonalRating] = useState<number | null>(null);
  const [whySavedIds, setWhySavedIds] = useState<string[]>([]);
  const [howAppliesIds, setHowAppliesIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [personalNotes, setPersonalNotes] = useState('');

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  // Load data on mount
  useEffect(() => {
    if (user?.id && itemId && itemType) {
      loadAnnotation();
    }
  }, [user?.id, itemId, itemType]);

  const loadAnnotation = async () => {
    if (!user?.id || !itemId || !itemType) return;

    try {
      setLoading(true);

      // Load existing annotation
      const { annotation: existingAnnotation, error } = await UserContentService.getAnnotation(
        user.id,
        itemType,
        itemId
      );

      if (error) {
        console.error('Error loading annotation:', error);
        // Don't show alert for missing table, just continue
        if (!error.includes('does not exist')) {
          Alert.alert('Info', 'Unable to load existing notes. You can still save new ones.');
        }
      }

      if (existingAnnotation) {
        setAnnotation(existingAnnotation);
        setPersonalRating(existingAnnotation.personal_rating || null);
        setSelectedTags(existingAnnotation.personal_tags || []);
        setPersonalNotes(existingAnnotation.personal_notes || '');
        
        // Parse structured data back to UI selections
        if (existingAnnotation.why_saved) {
          const matchedIds = WHY_SAVED_OPTIONS
            .filter(option => existingAnnotation.why_saved?.includes(option.label))
            .map(option => option.id);
          setWhySavedIds(matchedIds);
        }
        
        if (existingAnnotation.how_it_applies) {
          const matchedIds = HOW_APPLIES_OPTIONS
            .filter(option => existingAnnotation.how_it_applies?.includes(option.label))
            .map(option => option.id);
          setHowAppliesIds(matchedIds);
        }
      }

      // Set item details from params
      setItemDetails({
        id: itemId,
        type: validateContentType(itemType),
        title: itemTitle || 'Saved Content',
        savedAt: new Date().toISOString(),
        originalPath: `/content/${itemId}`,
      });

    } catch (error) {
      console.error('Error loading annotation:', error);
      // Don't block the UI, just log the error
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !itemId || !itemType || !itemTitle) {
      Alert.alert('Error', 'Missing required information to save notes.');
      return;
    }

    try {
      setSaving(true);

      // Validate content type to ensure it matches database constraint
      const validatedContentType = validateContentType(itemType);

      // Convert UI selections back to text for database
      const whySavedText = whySavedIds
        .map(id => WHY_SAVED_OPTIONS.find(opt => opt.id === id)?.label)
        .filter(Boolean)
        .join(', ');
      
      const howAppliesText = howAppliesIds
        .map(id => HOW_APPLIES_OPTIONS.find(opt => opt.id === id)?.label)
        .filter(Boolean)
        .join(', ');

      // Prepare annotation data with proper undefined handling
      const annotationData = {
        user_id: user.id,
        content_type: validatedContentType as string,
        content_id: itemId,
        content_title: itemTitle,
        personal_notes: personalNotes.trim() || undefined,
        why_saved: whySavedText || undefined,
        how_it_applies: howAppliesText || undefined,
        personal_rating: personalRating || undefined,
        personal_tags: selectedTags.length > 0 ? selectedTags : undefined,
      };

      const { annotation: savedAnnotation, error } = await UserContentService.saveAnnotation(annotationData as any);

      if (error) {
        // Check if it's a missing table error
        if (error.includes('does not exist')) {
          Alert.alert(
            'Database Setup Required',
            'The annotations table needs to be created. Please run:\n\nnpx supabase db push\n\nThen try saving again.',
            [{ text: 'OK' }]
          );
        } else {
          throw new Error(error);
        }
      } else {
        setAnnotation(savedAnnotation);
        Alert.alert('Success', 'Your notes have been saved!');
      }

    } catch (error) {
      console.error('Error saving annotation:', error);
      Alert.alert('Error', 'Failed to save your notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnnotation();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Loading your notes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.foreground} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.foreground }]} numberOfLines={1}>
            {itemDetails?.title}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.foregroundSecondary }]}>
            Your Personal Notes
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[
            styles.saveButton,
            { backgroundColor: theme.primary },
            saving && styles.saveButtonDisabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <ProfileRefreshControl
              onCustomRefresh={handleRefresh}
              onRefreshComplete={(success) => {
                if (!success) {
                  console.warn('⚠️ Content refresh failed');
                }
              }}
            />
          }
        >
          {/* Content Info (Collapsible) */}
          {itemDetails?.type === 'topic' && itemId && !itemId.startsWith('collection-') && !itemId.startsWith('draft-') && (
            <CollapsibleSection
              title="About This Topic"
              emoji="📖"
              defaultExpanded={false}
            >
              <SimpleTopicInfoScreen 
                topicId={itemId}
                showStartButton={false}
              />
            </CollapsibleSection>
          )}

          {/* Custom Collection Analytics & Sharing */}
          {(itemType === 'custom_collection' || itemId.startsWith('collection-') || itemId.startsWith('draft-')) && (
            <CollapsibleSection
              title="Collection Analytics & Sharing"
              emoji="📊"
              defaultExpanded={true}
            >
              <CustomCollectionAnalytics collectionId={itemId.replace('collection-', '').replace('draft-', '')} />
            </CollapsibleSection>
          )}

                     {/* Rating Section */}
           <Card style={StyleSheet.flatten([styles.sectionCard, { backgroundColor: theme.card }])}>
             <RatingStars
               rating={personalRating}
               onRatingChange={setPersonalRating}
             />
           </Card>

           {/* Why Saved Section */}
           <Card style={StyleSheet.flatten([styles.sectionCard, { backgroundColor: theme.card }])}>
             <OptionSelector
               title="🤔 Why did you save this?"
               options={WHY_SAVED_OPTIONS}
               selectedIds={whySavedIds}
               onSelectionChange={setWhySavedIds}
               multiSelect={true}
             />
           </Card>

           {/* How It Applies Section */}
           <Card style={StyleSheet.flatten([styles.sectionCard, { backgroundColor: theme.card }])}>
             <OptionSelector
               title="🎯 How does this apply to your life?"
               options={HOW_APPLIES_OPTIONS}
               selectedIds={howAppliesIds}
               onSelectionChange={setHowAppliesIds}
               multiSelect={true}
             />
           </Card>

           {/* Tags Section */}
           <Card style={StyleSheet.flatten([styles.sectionCard, { backgroundColor: theme.card }])}>
             <TagSelector
               selectedTags={selectedTags}
               onTagsChange={setSelectedTags}
             />
           </Card>

           {/* Personal Notes Section */}
           <Card style={StyleSheet.flatten([styles.sectionCard, { backgroundColor: theme.card }])}>
             <View style={styles.sectionHeader}>
               <Ionicons name="document-text-outline" size={20} color={theme.primary} />
               <Text style={StyleSheet.flatten([styles.sectionTitle, { color: theme.foreground }])}>
                 📝 Additional Notes (Optional)
               </Text>
             </View>

            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.foreground,
                },
              ]}
              value={personalNotes}
              onChangeText={setPersonalNotes}
              placeholder="Add any additional thoughts or insights..."
              placeholderTextColor={theme.foregroundSecondary}
              multiline
              textAlignVertical="top"
            />
          </Card>

          {/* Save indicator */}
          {annotation && (
            <View style={styles.saveIndicator}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={[styles.saveIndicatorText, { color: theme.foregroundSecondary }]}>
                Last saved {new Date(annotation.updated_at).toLocaleDateString()}
              </Text>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    ...shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerSubtitle: {
    ...typography.caption1,
    fontSize: 12,
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.footnote,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Content
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // Cards
  sectionCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },

  // Collapsible Section
  collapsibleCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  collapsibleHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collapsibleEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  collapsibleTitle: {
    ...typography.callout,
    fontWeight: '600',
  },
  collapsibleContent: {
    overflow: 'hidden',
  },

  // Rating Selector
  ratingSelector: {
    marginBottom: spacing.md,
  },
  ratingTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  ratingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ratingOption: {
    flex: 1,
    minWidth: '30%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  ratingEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  ratingLabel: {
    ...typography.footnote,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  ratingDescription: {
    ...typography.caption1,
    textAlign: 'center',
  },

  // Option Selector
  optionSelector: {
    marginBottom: spacing.md,
  },
  optionTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  optionLabel: {
    ...typography.footnote,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  optionDescription: {
    ...typography.caption1,
    textAlign: 'center',
  },

  // Tag Selector
  tagSelector: {
    marginBottom: spacing.md,
  },
  tagTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tagChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  tagText: {
    ...typography.caption1,
    fontWeight: '500',
  },
  customTagInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTagsContainer: {
    marginTop: spacing.sm,
  },
  selectedTagsLabel: {
    ...typography.footnote,
    marginBottom: spacing.xs,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  selectedTagText: {
    ...typography.caption1,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Notes Input
  notesInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Save indicator
  saveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  saveIndicatorText: {
    ...typography.caption1,
    fontSize: 12,
  },

  bottomSpacer: {
    height: spacing.xl * 2,
  },

  // Analytics
  analyticsContainer: {
    gap: spacing.md,
  },
  analyticsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  analyticsLoadingText: {
    ...typography.footnote,
  },
  analyticsEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  analyticsEmptyText: {
    ...typography.footnote,
    textAlign: 'center',
  },
  analyticsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
  },
  analyticsStat: {
    alignItems: 'center',
  },
  analyticsStatValue: {
    ...typography.title3,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  analyticsStatLabel: {
    ...typography.caption1,
    fontSize: 11,
  },
  analyticsActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  analyticsAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  analyticsActionText: {
    ...typography.footnote,
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 