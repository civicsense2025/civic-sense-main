import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { AppHeader } from '../../components/ui/AppHeader';
import { spacing, borderRadius, shadows, typography, fontFamily } from '../../lib/theme';
import { AsyncErrorBoundary } from '../../components/error-boundaries';
import { supabase } from '../../lib/supabase';
import { BookmarkService, type BookmarkWithSnippets, type SnippetWithBookmark } from '../../lib/services/bookmark-service';
import { CollectionItemsService, type CollectionItem, type CollectionItemInput } from '../../lib/services/collection-items-service';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ProgressAnalytics,
  EnhancedAssessmentProgressStorage,
  type AssessmentProgress 
} from '../../components/ui';
import { 
  fetchUserProgress,
  type StandardResponse,
} from '../../lib/standardized-data-service';
import { ProfileRefreshControl } from '../../components/ui/EnhancedRefreshControl';
import { useUIStrings } from '../../lib/hooks/useUIStrings';
import { LanguageSelector } from '../../components/settings/LanguageSelector';
import { TranslationScannerOverlay } from '../../components/ui/TranslationScannerOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

type SavedContentType = 'all' | 'lessons' | 'topics' | 'quizzes' | 'bookmarks';

interface SavedItem {
  id: string;
  type: SavedContentType;
  title: string;
  description?: string | undefined;
  imageUrl?: string | undefined;
  emoji?: string | undefined;
  savedAt: string;
  categoryOrSource?: string | undefined;
  originalPath: string;
  isBookmark?: boolean | undefined;
  isSnippet?: boolean | undefined;
  highlightColor?: string | undefined;
  userNotes?: string | undefined;
  tags?: string[] | undefined;
  collectionName?: string | undefined;
  collectionId?: string | null | undefined;
      metadata?: {
      score?: number | undefined;
      completedAt?: string | undefined;
      timeSpent?: number | undefined;
      difficulty?: string | undefined;
      xpEarned?: number | undefined;
      questions?: number | undefined;
      correctAnswers?: number | undefined;
      snippetText?: string | undefined;
      sourceType?: string | undefined;
      // Draft-specific metadata
      isDraft?: boolean | undefined;
      draftId?: string | undefined;
      questionCount?: number | undefined;
      isPreview?: boolean | undefined;
      // Custom Quiz metadata
      isCustomQuiz?: boolean | undefined;
      customQuizId?: string | undefined;
      status?: string | undefined;
    } | undefined;
}

interface FilterOption {
  label: string;
  value: SavedContentType | string;
  icon: string;
  count?: number | undefined;
  isCollection?: boolean | undefined;
  collectionId?: string | undefined;
  color?: string | undefined;
  emoji?: string | undefined;
}

interface StudyCollection {
  id: string;
  name: string;
  description?: string | undefined;
  emoji?: string | undefined;
  color?: string | undefined;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// COLLECTIONS SECTION COMPONENT
// ============================================================================

const CollectionsSection: React.FC<{
  collections: StudyCollection[];
  onCreateCollection: () => void;
  onCollectionPress: (collectionId: string) => void;
  uiStrings: any;
}> = ({ collections, onCreateCollection, onCollectionPress, uiStrings }) => {
  const { theme } = useTheme();

  // Separate lessons (official) from user collections
  // Note: In future, lessons would have a specific flag or come from a different table
  const lessons = collections.filter(c => c.isPublic); // Temporary logic - lessons would be marked differently
  const myCollections = collections.filter(c => !c.isPublic);

  const renderCollectionCard = (collection: StudyCollection, isLesson = false) => (
    <TouchableOpacity
      key={collection.id}
      onPress={() => onCollectionPress(collection.id)}
      style={[
        styles.collectionCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.collectionIcon,
          { backgroundColor: collection.color || theme.primary },
        ]}
      >
        <Text style={styles.collectionEmoji}>
          {collection.emoji || (isLesson ? '🎓' : '📚')}
        </Text>
      </View>
      
      <View style={styles.collectionContent}>
        <Text style={[styles.collectionName, { color: theme.foreground }]} numberOfLines={1}>
          {collection.name}
        </Text>
        {collection.description && (
          <Text style={[styles.collectionDescription, { color: theme.foregroundSecondary }]} numberOfLines={2}>
            {collection.description}
          </Text>
        )}
        <View style={styles.collectionFooter}>
          <Text style={[styles.collectionItemCount, { color: theme.foregroundSecondary }]}>
            {collection.itemCount} item{collection.itemCount !== 1 ? 's' : ''}
          </Text>
          {isLesson && (
            <View style={[styles.lessonBadge, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.lessonBadgeText, { color: theme.primary }]}>
                LESSON
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (lessons.length === 0 && myCollections.length === 0) {
    return (
      <View style={styles.collectionsSection}>
        <View style={styles.collectionsSectionHeader}>
          <Text style={[styles.collectionsSectionTitle, { color: theme.foreground }]}>
            {uiStrings.saved.collections}
          </Text>
          <TouchableOpacity
            onPress={onCreateCollection}
            style={[styles.createCollectionButton, { borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={theme.primary} />
            <Text style={[styles.createCollectionButtonText, { color: theme.primary }]}>
              {uiStrings.saved.createCollection}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.emptyCollectionsState}>
          <View style={[styles.emptyCollectionsIcon, { backgroundColor: theme.border }]}>
            <Text style={styles.emptyCollectionsEmoji}>📂</Text>
          </View>
          <Text style={[styles.emptyCollectionsTitle, { color: theme.foreground }]}>
            Organize Your Learning
          </Text>
          <Text style={[styles.emptyCollectionsDescription, { color: theme.foregroundSecondary }]}>
            Create collections to organize your saved content into themed folders for easier studying.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.collectionsSection}>
      {/* Lessons Section */}
      {lessons.length > 0 && (
        <View style={styles.collectionSubsection}>
          <Text style={[styles.collectionSubsectionTitle, { color: theme.foreground }]}>
            📖 Lessons
          </Text>
          <Text style={[styles.collectionSubsectionSubtitle, { color: theme.foregroundSecondary }]}>
            Multi-step courses from CivicSense
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.collectionsScrollContent}
            style={styles.collectionsScroll}
          >
            {lessons.map(collection => renderCollectionCard(collection, true))}
          </ScrollView>
        </View>
      )}

      {/* My Collections Section */}
      <View style={styles.collectionSubsection}>
        <View style={styles.collectionSubsectionHeader}>
          <View>
            <Text style={[styles.collectionSubsectionTitle, { color: theme.foreground }]}>
              📁 My Collections
            </Text>
            <Text style={[styles.collectionSubsectionSubtitle, { color: theme.foregroundSecondary }]}>
              Your organized content folders
            </Text>
          </View>
          <TouchableOpacity
            onPress={onCreateCollection}
            style={[styles.createCollectionButton, { borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={theme.primary} />
            <Text style={[styles.createCollectionButtonText, { color: theme.primary }]}>
              Create
            </Text>
          </TouchableOpacity>
        </View>

        {myCollections.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.collectionsScrollContent}
            style={styles.collectionsScroll}
          >
            {myCollections.map(collection => renderCollectionCard(collection, false))}
          </ScrollView>
        ) : (
          <View style={styles.emptyMyCollections}>
            <Text style={[styles.emptyMyCollectionsText, { color: theme.foregroundSecondary }]}>
              Create your first collection to organize your saved content
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Update the FilterChips component to only handle content types, not collections
const ContentTypeFilters: React.FC<{
  options: FilterOption[];
  activeFilter: SavedContentType | string;
  onFilterChange: (filter: SavedContentType | string) => void;
}> = ({ options, activeFilter, onFilterChange }) => {
  const { theme } = useTheme();

  // Filter out collections from the options - only show content type filters
  const contentTypeOptions = options.filter(option => !option.isCollection);

  return (
    <View style={styles.contentFiltersSection}>
      <Text style={[styles.contentFiltersSectionTitle, { color: theme.foreground }]}>
        🔍 Filter Content
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
        style={styles.filterContainer}
      >
        {contentTypeOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => onFilterChange(option.value)}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeFilter === option.value ? theme.primary : theme.card,
                borderColor: activeFilter === option.value ? theme.primary : theme.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.filterEmoji}>{option.icon}</Text>
            <Text
              style={[
                styles.filterLabel,
                {
                  color: activeFilter === option.value ? '#FFFFFF' : theme.foreground,
                },
              ]}
            >
              {option.label}
              {option.count !== undefined && option.count > 0 && ` (${option.count})`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// ============================================================================
// SPECIALIZED HEADER COMPONENT
// ============================================================================

const SavedHeader: React.FC<{
  itemCount: number;
  isSelectionMode: boolean;
  selectedCount: number;
  onStartSelection: () => void;
  onShowCollectionSelector: () => void;
  onCancelSelection: () => void;
}> = ({ 
  itemCount, 
  isSelectionMode, 
  selectedCount, 
  onStartSelection, 
  onShowCollectionSelector, 
  onCancelSelection 
}) => {
  const { theme } = useTheme();

  const getRightComponent = () => {
    if (itemCount > 0 && !isSelectionMode) {
      return (
        <TouchableOpacity
          onPress={onStartSelection}
          style={styles.headerButton}
        >
          <Ionicons name="checkmark-circle-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      );
    }

    if (isSelectionMode) {
      return (
        <View style={styles.selectionActions}>
          <TouchableOpacity
            onPress={onShowCollectionSelector}
            disabled={selectedCount === 0}
            style={[styles.selectionButton, { opacity: selectedCount === 0 ? 0.5 : 1 }]}
          >
            <Ionicons name="folder-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCancelSelection}
            style={styles.selectionButton}
          >
            <Text style={[styles.selectionCancelText, { color: theme.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return undefined;
  };

  const rightComponent = getRightComponent();

  return (
    <AppHeader
      title="Saved"
      subtitle={`${itemCount} saved item${itemCount === 1 ? '' : 's'}`}
      showOnHome={true}
      {...(rightComponent && { rightComponent })}
    />
  );
};

// ============================================================================
// COMPONENTS
// ============================================================================

const SavedItemCard: React.FC<{
  item: SavedItem;
  onPress: () => void;
  onRemove?: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}> = ({ item, onPress, onRemove, isSelectable, isSelected, onSelect }) => {
  const { theme } = useTheme();

  const timeSinceSaved = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getTypeLabel = () => {
    if (item.metadata?.isCustomQuiz) {
      return `Custom Quiz • ${item.metadata.status?.toUpperCase() || 'DRAFT'}`;
    }
    
    switch (item.type) {
      case 'lessons': return 'Lesson';
      case 'topics': return 'Topic';
      case 'quizzes': return 'Quiz Result';
      case 'bookmarks': return 'Bookmark';
      default: return 'Saved Item';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return theme.foregroundSecondary;
    if (score >= 90) return '#10B981';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const handleCardPress = () => {
    if (isSelectable && onSelect) {
      onSelect();
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      style={[
        styles.savedCard,
        {
          backgroundColor: theme.card,
          borderColor: isSelected ? theme.primary : theme.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.savedCardContent}>
        {/* Selection Indicator */}
        {isSelectable && (
          <View style={styles.selectionIndicator}>
            <View
              style={[
                styles.selectionCircle,
                {
                  backgroundColor: isSelected ? theme.primary : 'transparent',
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
          </View>
        )}

        {/* Visual Element */}
        <View style={styles.savedCardMedia}>
          {item.type === 'lessons' && item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.savedImage}
              contentFit="cover"
              transition={200}
            />
          ) : item.emoji ? (
            <View style={[
              styles.savedEmojiContainer, 
              { 
                backgroundColor: item.isSnippet && item.highlightColor 
                  ? item.highlightColor + '40'
                  : theme.primary + '20'
              }
            ]}>
              <Text style={styles.savedEmoji}>{item.emoji}</Text>
            </View>
          ) : (
            <View style={[styles.savedIconContainer, { backgroundColor: theme.border }]}>
              <Ionicons 
                name={
                  item.isSnippet ? 'text-outline' :
                  item.type === 'lessons' ? 'newspaper-outline' :
                  item.type === 'topics' ? 'library-outline' :
                  item.type === 'quizzes' ? 'trophy-outline' :
                  'bookmark-outline'
                } 
                size={20} 
                color={theme.foregroundSecondary} 
              />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.savedCardText}>
          <View style={styles.savedCardHeader}>
            <Text style={[styles.savedTypeLabel, { color: theme.primary }]}>
              {getTypeLabel()}
            </Text>
            {onRemove && !isSelectable && (
              <TouchableOpacity
                onPress={onRemove}
                style={styles.removeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={16} color={theme.foregroundSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.savedTitle, { color: theme.foreground }]} numberOfLines={2}>
            {item.title}
          </Text>

          {item.description && (
            <Text style={[styles.savedDescription, { color: theme.foregroundSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* Collection Badge */}
          {item.collectionName && (
            <View style={[styles.collectionBadge, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.collectionBadgeText, { color: theme.primary }]}>
                📚 {item.collectionName}
              </Text>
            </View>
          )}

          {/* Snippet-specific content */}
          {item.isSnippet && item.metadata?.snippetText && (
            <View style={[styles.snippetContainer, { borderLeftColor: item.highlightColor || '#FEF08A' }]}>
              <Text style={[styles.snippetText, { color: theme.foreground, fontStyle: 'italic' }]} numberOfLines={2}>
                "{item.metadata.snippetText}"
              </Text>
            </View>
          )}

          {/* User notes */}
          {item.userNotes && (
            <View style={styles.notesContainer}>
              <Text style={[styles.notesText, { color: theme.foregroundSecondary }]} numberOfLines={2}>
                💭 {item.userNotes}
              </Text>
            </View>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={[styles.tagChip, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.tagText, { color: theme.primary }]}>#{tag}</Text>
                </View>
              ))}
              {item.tags.length > 3 && (
                <Text style={[styles.moreTagsText, { color: theme.foregroundSecondary }]}>
                  +{item.tags.length - 3} more
                </Text>
              )}
            </View>
          )}

          {/* Quiz-specific metadata */}
          {item.type === 'quizzes' && item.metadata && !item.metadata.isCustomQuiz && (
            <View style={styles.quizMetadata}>
              {item.metadata.score !== undefined && (
                <View style={styles.scoreContainer}>
                  <Text style={[styles.scoreText, { color: getScoreColor(item.metadata.score) }]}>
                    {item.metadata.score}%
                  </Text>
                  <Text style={[styles.scoreLabel, { color: theme.foregroundSecondary }]}>
                    Score
                  </Text>
                </View>
              )}
              {item.metadata.xpEarned && (
                <View style={styles.xpContainer}>
                  <Text style={[styles.xpText, { color: '#3B82F6' }]}>
                    +{item.metadata.xpEarned} XP
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Custom Quiz metadata */}
          {item.metadata?.isCustomQuiz && (
            <View style={styles.quizMetadata}>
              <View style={styles.scoreContainer}>
                <Text style={[styles.scoreText, { color: theme.primary }]}>
                  {item.metadata.questionCount || 0}
                </Text>
                <Text style={[styles.scoreLabel, { color: theme.foregroundSecondary }]}>
                  Questions
                </Text>
              </View>
              <View style={[styles.xpContainer, { backgroundColor: item.metadata.status === 'published' ? '#10B981' + '20' : '#F59E0B' + '20' }]}>
                <Text style={[styles.xpText, { color: item.metadata.status === 'published' ? '#10B981' : '#F59E0B' }]}>
                  {item.metadata.status?.toUpperCase() || 'DRAFT'}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.savedFooter}>
            {item.categoryOrSource && (
              <Text style={[styles.savedCategory, { color: theme.foregroundSecondary }]}>
                {item.categoryOrSource}
              </Text>
            )}
            <Text style={[styles.savedTime, { color: theme.foregroundSecondary }]}>
              Saved {timeSinceSaved(item.savedAt)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const FilterChips: React.FC<{
  options: FilterOption[];
  activeFilter: SavedContentType | string;
  onFilterChange: (filter: SavedContentType | string) => void;
  onCreateCollection: () => void;
}> = ({ options, activeFilter, onFilterChange, onCreateCollection }) => {
  const { theme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScrollContent}
      style={styles.filterContainer}
    >
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onFilterChange(option.value)}
          style={[
            styles.filterChip,
            {
              backgroundColor: activeFilter === option.value ? theme.primary : theme.card,
              borderColor: activeFilter === option.value ? theme.primary : theme.border,
            },
          ]}
          activeOpacity={0.7}
        >
          {option.isCollection && option.emoji ? (
            <Text style={styles.filterEmoji}>{option.emoji}</Text>
          ) : (
            <Text style={styles.filterEmoji}>{option.icon}</Text>
          )}
          <Text
            style={[
              styles.filterLabel,
              {
                color: activeFilter === option.value ? '#FFFFFF' : theme.foreground,
              },
            ]}
          >
            {option.label}
            {option.count !== undefined && option.count > 0 && ` (${option.count})`}
          </Text>
        </TouchableOpacity>
      ))}
      
      {/* Create Collection Button */}
      <TouchableOpacity
        onPress={onCreateCollection}
        style={[
          styles.createCollectionChip,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={16} color={theme.primary} />
        <Text style={[styles.createCollectionText, { color: theme.primary }]}>
          New Collection
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const InProgressCarousel: React.FC<{
  incompleteAssessments: AssessmentProgress[];
}> = ({ incompleteAssessments }) => {
  const { theme } = useTheme();
  const router = useRouter();

  if (incompleteAssessments.length === 0) return null;

  const renderAssessmentCard = (assessment: AssessmentProgress, index: number) => (
    <View key={assessment.sessionId} style={[styles.assessmentCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.assessmentCardContent}>
        <View style={[styles.assessmentIcon, { backgroundColor: theme.primary + '20' }]}>
          <Text style={styles.assessmentEmoji}>🧠</Text>
        </View>
        <View style={styles.assessmentText}>
          <Text style={[styles.assessmentTitle, { color: theme.foreground }]}>
            Continue Your Civics Assessment
          </Text>
          <Text style={[styles.assessmentProgress, { color: theme.foregroundSecondary }]}>
            {(assessment as any).completedQuestions || 0} of {(assessment as any).totalQuestions || 20} questions completed
          </Text>
          <Text style={[styles.assessmentTime, { color: theme.foregroundTertiary }]}>
            Started {new Date((assessment as any).startedAt || Date.now()).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.continueAssessmentButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            router.push('/assessment' as any);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.continueAssessmentButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.carouselContainer}>
      {incompleteAssessments.length === 1 ? (
        // Single card - no carousel needed
        renderAssessmentCard(incompleteAssessments[0]!, 0)
      ) : (
        // Multiple cards - horizontal scroll
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          style={styles.carousel}
        >
          {incompleteAssessments.map((assessment, index) => renderAssessmentCard(assessment, index))}
        </ScrollView>
      )}
    </View>
  );
};

const EmptyState: React.FC<{
  filter: SavedContentType;
  onExplore?: () => void;
}> = ({ filter, onExplore }) => {
  const { theme } = useTheme();

  const getEmptyStateContent = () => {
    switch (filter) {
      case 'lessons':
        return {
          icon: '📚',
          title: 'No Saved Lessons',
          description: 'Save lessons to continue your learning journey.',
        };
      case 'topics':
        return {
          icon: '📚',
          title: 'No Saved Topics',
          description: 'Bookmark topics that interest you for future study.',
        };
      case 'quizzes':
        return {
          icon: '🏆',
          title: 'No Quiz Results',
          description: 'Complete quizzes to see your progress and achievements here.',
        };
      case 'bookmarks':
        return {
          icon: '🔖',
          title: 'No Bookmarks',
          description: 'Bookmark content to easily find it later.',
        };
      default:
        return {
          icon: '📋',
          title: 'No Saved Items',
          description: 'Your saved articles, topics, and quiz results will appear here.',
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.border }]}>
        <Text style={styles.emptyIconText}>{content.icon}</Text>
      </View>
      <Text style={[styles.emptyTitle, { color: theme.foreground }]}>
        {content.title}
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.foregroundSecondary }]}>
        {content.description}
      </Text>
      {onExplore && (
        <TouchableOpacity
          style={[styles.exploreButton, { backgroundColor: theme.primary }]}
          onPress={onExplore}
        >
          <Text style={styles.exploreButtonText}>Explore Content</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SavedScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { uiStrings } = useUIStrings();

  // Translation system state
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [targetLanguageName, setTargetLanguageName] = useState('');
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);
  
  // Redirect guest users to auth
  useEffect(() => {
    if (!user) {
      console.log('🔒 Guest user attempted to access saved content - redirecting to auth');
      router.replace('/auth/login');
      return;
    }
  }, [user, router]);
  
  // Don't render anything for guest users while redirecting
  if (!user) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingSpinner size="large" />
        <Text style={{ marginTop: spacing.md, color: theme.foregroundSecondary }}>
          {uiStrings.profile.redirectingToLogin}
        </Text>
      </SafeAreaView>
    );
  }
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [collections, setCollections] = useState<StudyCollection[]>([]);
  const [activeFilter, setActiveFilter] = useState<SavedContentType | string>('all');
  const [incompleteAssessments, setIncompleteAssessments] = useState<AssessmentProgress[]>([]);
  
  // Collection modals
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  
  // Selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Load functions as callbacks inside component
  const loadBookmarks = useCallback(async (): Promise<SavedItem[]> => {
    if (!user?.id) return [];

    try {
      // Load all bookmarks from the bookmarks table
      const { data: bookmarks, error } = await supabase
        .from('bookmarks')
        .select(`
          *,
          collection:bookmark_collections(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (bookmarks || []).map((bookmark): SavedItem => ({
        id: `bookmark-${bookmark.id}`,
        type: 'bookmarks',
        title: bookmark.title || 'Untitled Bookmark',
        description: bookmark.description || undefined,
        imageUrl: bookmark.image_url || undefined,
        emoji: bookmark.emoji || undefined,
        savedAt: bookmark.created_at,
        categoryOrSource: bookmark.source_type || undefined,
        originalPath: bookmark.url || '',
        isBookmark: true,
        userNotes: bookmark.notes || undefined,
        tags: bookmark.tags || undefined,
        collectionName: bookmark.collection?.name || undefined,
        collectionId: bookmark.collection_id || undefined,
      }));
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      return [];
    }
  }, [user?.id]);

  const loadSnippets = useCallback(async (): Promise<SavedItem[]> => {
    if (!user?.id) return [];

    try {
      const { data: snippets, error } = await supabase
        .from('bookmark_snippets')
        .select(`
          *,
          collection:bookmark_collections(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (snippets || []).map((snippet): SavedItem => ({
        id: `snippet-${snippet.id}`,
        type: 'bookmarks',
        title: snippet.title || 'Highlighted Text',
        description: snippet.context || undefined,
        savedAt: snippet.created_at,
        originalPath: snippet.source_url || '',
        isSnippet: true,
        highlightColor: snippet.highlight_color || undefined,
        userNotes: snippet.notes || undefined,
        collectionName: snippet.collection?.name || undefined,
        collectionId: snippet.collection_id || undefined,
        metadata: {
          snippetText: snippet.snippet_text || undefined,
          sourceType: snippet.source_type || undefined,
        },
      }));
    } catch (error) {
      console.error('Error loading snippets:', error);
      return [];
    }
  }, [user?.id]);

  const loadQuizResults = useCallback(async (): Promise<SavedItem[]> => {
    if (!user?.id) return [];

    try {
      const { data: results, error } = await supabase
        .from('user_quiz_attempts')
        .select(`
          *
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      return (results || []).map((result): SavedItem => ({
        id: `quiz-${result.id}`,
        type: 'quizzes',
        title: result.topic_title || 'Quiz Result',
        description: `Score: ${result.score}% - ${result.correct_answers}/${result.total_questions} correct`,
        emoji: '🏆',
        savedAt: result.completed_at,
        originalPath: `/topic/${result.topic_id}`,
        metadata: {
          score: result.score || undefined,
          completedAt: result.completed_at,
          timeSpent: result.time_spent || undefined,
          difficulty: result.difficulty || undefined,
          xpEarned: result.xp_earned || undefined,
          questions: result.total_questions || undefined,
          correctAnswers: result.correct_answers || undefined,
        },
      }));
    } catch (error) {
      console.error('Error loading quiz results:', error);
      return [];
    }
  }, [user?.id]);

  const loadCustomQuizzes = useCallback(async (): Promise<SavedItem[]> => {
    if (!user?.id) return [];

    try {
      const { data: customQuizzes, error } = await supabase
        .from('custom_content_generations')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['draft', 'published'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (customQuizzes || []).map((quiz): SavedItem => ({
        id: `custom-quiz-${quiz.id}`,
        type: 'topics',
        title: quiz.topic || 'Custom Quiz',
        description: quiz.description || 'Custom generated quiz content',
        emoji: '🎯',
        savedAt: quiz.created_at,
        originalPath: `/saved/custom-quiz/${quiz.id}`,
        metadata: {
          isCustomQuiz: true,
          customQuizId: quiz.id,
          questionCount: quiz.question_count || undefined,
          status: quiz.status || 'draft',
        },
      }));
    } catch (error) {
      console.error('Error loading custom quizzes:', error);
      return [];
    }
  }, [user?.id]);

  const loadIncompleteAssessments = useCallback(async (userId: string): Promise<AssessmentProgress[]> => {
    try {
      return await EnhancedAssessmentProgressStorage.getIncompleteAssessments(userId);
    } catch (error) {
      console.error('Error loading incomplete assessments:', error);
      return [];
    }
  }, []);

  // Load saved data
  useEffect(() => {
    loadSavedData();
  }, [user?.id]);

  const loadSavedData = async () => {
    if (!user?.id) {
      console.log('👤 No user - setting empty state');
      setLoading(false);
      setSavedItems([]);
      setCollections([]);
      setIncompleteAssessments([]);
      return;
    }

    try {
      setLoading(true);
      console.log('📂 Loading saved data for user:', user.id);

      // Load different types of saved content and analytics data in parallel with individual error handling
      const [bookmarksData, snippetsData, quizResultsData, customQuizzesData, collectionsData, incompleteAssessmentsData] = await Promise.allSettled([
        loadBookmarks(),
        loadSnippets(), 
        loadQuizResults(),
        loadCustomQuizzes(),
        loadCollections(),
        loadIncompleteAssessments(user.id),
      ]);

      // Extract successful results and handle individual failures
      const bookmarks = bookmarksData.status === 'fulfilled' ? bookmarksData.value : [];
      const snippets = snippetsData.status === 'fulfilled' ? snippetsData.value : [];
      const quizResults = quizResultsData.status === 'fulfilled' ? quizResultsData.value : [];
      const customQuizzes = customQuizzesData.status === 'fulfilled' ? customQuizzesData.value : [];
      const collectionsResult = collectionsData.status === 'fulfilled' ? collectionsData.value : [];
      const incompleteAssessmentsResult = incompleteAssessmentsData.status === 'fulfilled' ? incompleteAssessmentsData.value : [];

      // Log individual failures but don't fail completely
      if (bookmarksData.status === 'rejected') {
        console.error('❌ Bookmarks loading failed:', bookmarksData.reason);
      }
      if (snippetsData.status === 'rejected') {
        console.error('❌ Snippets loading failed:', snippetsData.reason);
      }
      if (quizResultsData.status === 'rejected') {
        console.error('❌ Quiz results loading failed:', quizResultsData.reason);
      }
      if (customQuizzesData.status === 'rejected') {
        console.error('❌ Custom quizzes loading failed:', customQuizzesData.reason);
      }
      if (collectionsData.status === 'rejected') {
        console.error('❌ Collections loading failed:', collectionsData.reason);
      }
      if (incompleteAssessmentsData.status === 'rejected') {
        console.error('❌ Incomplete assessments loading failed:', incompleteAssessmentsData.reason);
      }

      const allItems: SavedItem[] = [
        ...bookmarks,
        ...snippets,
        ...quizResults,
        ...customQuizzes,
      ];

      console.log(`📊 Loaded ${allItems.length} saved items total:`);
      console.log(`- Bookmarks: ${bookmarks.length}`);
      console.log(`- Snippets: ${snippets.length}`); 
      console.log(`- Quiz Results: ${quizResults.length}`);
      console.log(`- Custom Quizzes: ${customQuizzes.length}`);
      console.log(`- Collections: ${collectionsResult.length}`);
      console.log(`- Incomplete Assessments: ${incompleteAssessmentsResult.length}`);

      // Sort by saved date (most recent first)
      if (allItems.length > 0) {
        allItems.sort((a, b) => {
          const dateA = new Date(a.savedAt).getTime();
          const dateB = new Date(b.savedAt).getTime();
          return isNaN(dateB) ? -1 : isNaN(dateA) ? 1 : dateB - dateA;
        });
      }

      setSavedItems(allItems);
      setCollections(collectionsResult);
      setIncompleteAssessments(incompleteAssessmentsResult);
      
    } catch (error) {
      console.error('❌ Critical error loading saved data:', error);
      // Set empty array on critical error rather than leaving in loading state
      setSavedItems([]);
      setCollections([]);
      setIncompleteAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async (): Promise<StudyCollection[]> => {
    if (!user?.id) {
      console.log('👤 No user ID - skipping collections');
      return [];
    }

    try {
      console.log('📚 Loading collections for user:', user.id);
      
      const { collections, error } = await BookmarkService.getCollections(user.id);

      if (error) {
        console.error('❌ BookmarkService collections error:', error);
        return [];
      }

      if (!collections || collections.length === 0) {
        console.log('📊 No collections found');
        return [];
      }

      console.log(`📊 Found ${collections.length} collections`);

      // Get item counts for each collection using the new junction table
      const collectionsWithCounts = await Promise.all(
        collections.map(async (collection) => {
          const { count, error: countError } = await CollectionItemsService.getCollectionItemCount(
            collection.id,
            user.id
          );

          if (countError) {
            console.error(`❌ Error getting count for collection ${collection.id}:`, countError);
          }

          return {
            id: collection.id,
            name: collection.name,
            description: collection.description || undefined,
            emoji: collection.emoji || undefined,
            color: collection.color || undefined,
            isPublic: collection.is_public || false,
            itemCount: count || 0,
            createdAt: collection.created_at,
            updatedAt: collection.updated_at,
          };
        })
      );

      return collectionsWithCounts;
    } catch (error) {
      console.error('❌ Error loading collections:', error);
      return [];
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSavedData();
    setRefreshing(false);
  };

  const handleCreateCollection = (collection: StudyCollection) => {
    setCollections(prev => [collection, ...prev]);
  };

  const handleMoveToCollection = async (collectionId: string | null) => {
    if (!user?.id || selectedItems.length === 0) return;

    try {
      // Update items in database using the new collection items service
      const updates = selectedItems.map(async (itemId) => {
        const item = savedItems.find(i => i.id === itemId);
        if (!item) return;

        if (item.isBookmark) {
          // Handle bookmarks
          const bookmarkId = item.id.startsWith('bookmark-') ? item.id.substring(9) : item.id;
          
          if (collectionId) {
            // Add to collection using junction table
            const itemInput: CollectionItemInput = {
              contentType: 'bookmark',
              contentId: bookmarkId,
              title: item.title,
              description: item.description,
              imageUrl: item.imageUrl,
            };

            const { error } = await CollectionItemsService.addToCollection(
              collectionId,
              user.id,
              itemInput
            );

            if (error) {
              console.error('❌ Error adding bookmark to collection:', error);
              throw error;
            }
          }

          // Remove from old collection in the legacy column (if needed)
          await supabase
            .from('bookmarks')
            .update({ collection_id: null })
            .eq('id', bookmarkId)
            .eq('user_id', user.id);

        } else if (item.isSnippet) {
          // Handle snippets
          const snippetId = item.id.startsWith('snippet-') ? item.id.substring(8) : item.id;
          
          if (collectionId) {
            // Add to collection using junction table
            const itemInput: CollectionItemInput = {
              contentType: 'snippet',
              contentId: snippetId,
              title: item.title || 'Text Snippet',
              description: item.description,
              userNotes: item.userNotes,
            };

            const { error } = await CollectionItemsService.addToCollection(
              collectionId,
              user.id,
              itemInput
            );

            if (error) {
              console.error('❌ Error adding snippet to collection:', error);
              throw error;
            }
          }

          // Remove from old collection in the legacy column (if needed)
          await supabase
            .from('bookmark_snippets')
            .update({ collection_id: null })
            .eq('id', snippetId)
            .eq('user_id', user.id);
        }
      });

      await Promise.all(updates);

      // Update local state
      setSavedItems(prev => prev.map(item => {
        if (selectedItems.includes(item.id)) {
          const collection = collections.find(c => c.id === collectionId);
          return {
            ...item,
            collectionId,
            collectionName: collection?.name,
          };
        }
        return item;
      }));

      // Update collection counts
      await loadCollections().then(setCollections);

      // Exit selection mode
      setIsSelectionMode(false);
      setSelectedItems([]);

      Alert.alert(
        'Success',
        `Moved ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} to ${
          collectionId ? collections.find(c => c.id === collectionId)?.name : 'no collection'
        }.`
      );
    } catch (error) {
      console.error('Error moving items to collection:', error);
      Alert.alert('Error', 'Failed to move items. Please try again.');
    }
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this saved item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSavedItems(items => items.filter(item => item.id !== itemId));
          },
        },
      ]
    );
  };

    const handleItemPress = (item: SavedItem) => {
    if (isSelectionMode) {
      // Toggle selection
      setSelectedItems(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else {
      // Handle custom quiz navigation
      if (item.metadata?.isCustomQuiz && item.metadata?.customQuizId) {
        console.log('🎯 Navigating to custom quiz:', item.metadata.customQuizId);
        console.log('🎯 Full navigation path:', `/saved/custom-quiz/${item.metadata.customQuizId}`);
        router.push(`/saved/custom-quiz/${item.metadata.customQuizId}` as any);
      } else {
        // Navigate to the personal content view screen for note-taking
        router.push({
          pathname: '/saved/[itemId]',
          params: {
            itemId: item.id,
            itemType: item.type,
            itemTitle: item.title,
          },
        } as any);
      }
    }
  };

  const handleLongPress = (item: SavedItem) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedItems([item.id]);
    }
  };

  // Handle collection press to navigate to collection screen
  const handleCollectionPress = (collectionId: string) => {
    router.push(`/collections/${collectionId}` as any);
  };

  // Filter options with counts including collections
  const filterOptions: FilterOption[] = useMemo(() => {
    const counts = savedItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<SavedContentType, number>);

    const baseOptions: FilterOption[] = [
      { label: 'All', value: 'all', icon: '📋', count: savedItems.length },
      { label: 'Lessons', value: 'lessons', icon: '📚', count: counts.lessons || 0 },
      { label: 'Topics', value: 'topics', icon: '📖', count: counts.topics || 0 },
      { label: 'Quiz Results', value: 'quizzes', icon: '🏆', count: counts.quizzes || 0 },
      { label: 'Custom Quizzes', value: 'custom-quizzes', icon: '🎯', count: savedItems.filter(item => item.metadata?.isCustomQuiz).length },
      { label: 'Bookmarks', value: 'bookmarks', icon: '🔖', count: counts.bookmarks || 0 },
    ];

    // Add collections
    const collectionOptions: FilterOption[] = collections.map(collection => ({
      label: collection.name,
      value: `collection:${collection.id}`,
      icon: collection.emoji || '📚',
      emoji: collection.emoji,
      color: collection.color,
      count: collection.itemCount,
      isCollection: true,
      collectionId: collection.id,
    }));

    return [...baseOptions, ...collectionOptions];
  }, [savedItems, collections]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') {
      return savedItems;
    }
    
    if (activeFilter.startsWith('collection:')) {
      const collectionId = activeFilter.split(':')[1];
      return savedItems.filter(item => item.collectionId === collectionId);
    }
    
    if (activeFilter === 'custom-quizzes') {
      return savedItems.filter(item => item.metadata?.isCustomQuiz);
    }
    
    return savedItems.filter(item => item.type === activeFilter);
  }, [savedItems, activeFilter]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <AppHeader title="Saved" subtitle="Your bookmarks and progress" />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" variant="pulse" />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Loading your saved content...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: 'Saved',
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
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 16 }}>
              {isSelectionMode ? (
                <TouchableOpacity
                  onPress={() => {
                    setIsSelectionMode(false);
                    setSelectedItems([]);
                  }}
                  style={{ padding: spacing.xs }}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel selection"
                >
                  <Text style={{ color: theme.primary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              ) : (
                <>
                  {savedItems.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setShowCollectionSelector(true)}
                      style={{ padding: spacing.xs, marginRight: spacing.sm }}
                      accessibilityRole="button"
                      accessibilityLabel="Show collections"
                    >
                      <Ionicons name="folder-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                  )}
                  {savedItems.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setIsSelectionMode(true)}
                      style={{ padding: spacing.xs }}
                      accessibilityRole="button"
                      accessibilityLabel="Select items"
                    >
                      <Ionicons name="checkmark-circle-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          ),
        }}
      />

      <AsyncErrorBoundary
        loading={loading}
        error={null}
        onRetry={loadSavedData}
        context="Saved Data"
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <ProfileRefreshControl 
              onCustomRefresh={handleRefresh}
              onRefreshComplete={(success, errors) => {
                if (!success && errors) {
                  console.warn('⚠️ Saved content refresh had errors:', errors);
                }
              }}
            />
          }
        >
          {/* Selection Mode Banner */}
          {isSelectionMode && (
            <View style={[styles.selectionBanner, { backgroundColor: theme.primary + '10' }]}>
              <Text style={[styles.selectionBannerText, { color: theme.foreground }]}>
                {selectedItems.length === 0 
                  ? 'Select items to organize'
                  : `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} selected`
                }
              </Text>
            </View>
          )}

          {/* In Progress Assessments Carousel */}
          <InProgressCarousel
            incompleteAssessments={incompleteAssessments}
          />

          {/* Collections Section */}
          <CollectionsSection
            collections={collections}
            onCreateCollection={() => setShowCreateCollection(true)}
            onCollectionPress={handleCollectionPress}
            uiStrings={uiStrings}
          />

          {/* Filter Chips */}
          <ContentTypeFilters
            options={filterOptions}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {/* Content */}
          <View style={styles.content}>
            {filteredItems.length > 0 ? (
              <View style={styles.itemsList}>
                {filteredItems.map((item) => (
                  <SavedItemCard
                    key={item.id}
                    item={item}
                    onPress={() => handleItemPress(item)}
                    onRemove={() => handleRemoveItem(item.id)}
                    isSelectable={isSelectionMode}
                    isSelected={selectedItems.includes(item.id)}
                    onSelect={() => {
                      setSelectedItems(prev => 
                        prev.includes(item.id) 
                          ? prev.filter(id => id !== item.id)
                          : [...prev, item.id]
                      );
                    }}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                filter={activeFilter as SavedContentType}
                onExplore={() => router.push('/(tabs)/' as any)}
              />
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </AsyncErrorBoundary>

      {/* Modals - Placeholder components until collection modals are implemented */}
      {showCreateCollection && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: theme.background, padding: spacing.lg, borderRadius: borderRadius.lg, margin: spacing.lg }}>
            <Text style={{ ...typography.title3, color: theme.foreground, marginBottom: spacing.md }}>Create Collection</Text>
            <Text style={{ ...typography.body, color: theme.foregroundSecondary, marginBottom: spacing.lg }}>Collection creation coming soon!</Text>
            <TouchableOpacity 
              style={{ backgroundColor: theme.primary, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' }}
              onPress={() => setShowCreateCollection(false)}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showCollectionSelector && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: theme.background, padding: spacing.lg, borderRadius: borderRadius.lg, margin: spacing.lg }}>
            <Text style={{ ...typography.title3, color: theme.foreground, marginBottom: spacing.md }}>Move to Collection</Text>
            <Text style={{ ...typography.body, color: theme.foregroundSecondary, marginBottom: spacing.lg }}>Collection management coming soon!</Text>
            <TouchableOpacity 
              style={{ backgroundColor: theme.primary, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' }}
              onPress={() => setShowCollectionSelector(false)}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES - Updated to match [id].tsx, index.tsx, and AppHeader.tsx patterns
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: spacing.sm, // Minimal top padding
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
    fontFamily: fontFamily.text,
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
  },

  // Empty state with Space Mono typography
  emptyTitle: {
    ...typography.title2,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.body,
    fontFamily: fontFamily.text,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight * 1.4,
    marginBottom: spacing.xl,
  },

  bottomSpacer: {
    height: spacing.xl * 2,
  },

  // Saved Item Card styles with Space Mono typography
  savedCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  savedCardContent: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  selectionIndicator: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 10,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCardMedia: {
    marginRight: spacing.md,
  },
  savedImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  savedEmojiContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedEmoji: {
    fontSize: 24,
  },
  savedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCardText: {
    flex: 1,
  },
  savedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  savedTypeLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fontFamily.mono, // Space Mono for labels
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  removeButton: {
    padding: spacing.xs,
  },
  savedTitle: {
    ...typography.callout,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    marginBottom: spacing.xs,
    lineHeight: typography.callout.lineHeight * 1.2,
  },
  savedDescription: {
    ...typography.footnote,
    fontFamily: fontFamily.text,
    marginBottom: spacing.sm,
    lineHeight: typography.footnote.lineHeight * 1.3,
  },
  savedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedCategory: {
    ...typography.caption1,
    fontSize: 11,
    fontFamily: fontFamily.mono, // Space Mono for categories
  },
  savedTime: {
    ...typography.caption1,
    fontSize: 11,
    fontFamily: fontFamily.mono, // Space Mono for timestamps
  },

  // Collection Badge
  collectionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  collectionBadgeText: {
    ...typography.caption1,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fontFamily.mono, // Space Mono for collection labels
  },

  // Snippet Styles
  snippetContainer: {
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
    marginVertical: spacing.xs,
    backgroundColor: 'rgba(254, 240, 138, 0.1)',
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  snippetText: {
    ...typography.footnote,
    fontFamily: fontFamily.text,
    lineHeight: typography.footnote.lineHeight * 1.3,
  },

  // Notes Styles
  notesContainer: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: borderRadius.xs,
  },
  notesText: {
    ...typography.caption1,
    fontSize: 12,
    fontFamily: fontFamily.text,
    lineHeight: 16,
  },

  // Tags Styles
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  tagChip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  tagText: {
    ...typography.caption1,
    fontSize: 10,
    fontWeight: '500',
    fontFamily: fontFamily.mono, // Space Mono for tags
  },
  moreTagsText: {
    ...typography.caption1,
    fontSize: 10,
    fontStyle: 'italic',
    fontFamily: fontFamily.text,
  },

  // Quiz Metadata styles
  quizMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    ...typography.callout,
    fontWeight: '700',
    fontFamily: fontFamily.mono, // Space Mono for scores
  },
  scoreLabel: {
    ...typography.caption1,
    fontSize: 10,
    fontFamily: fontFamily.mono, // Space Mono for labels
  },
  xpContainer: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: '#3B82F6' + '20',
    borderRadius: borderRadius.xs,
  },
  xpText: {
    ...typography.caption1,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fontFamily.mono, // Space Mono for XP
  },

  // Progress section styles
  progressSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressHeaderContent: {
    flex: 1,
  },
  progressTitle: {
    ...typography.callout,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    marginBottom: spacing.xs,
  },
  progressSummary: {
    marginTop: spacing.xs,
  },
  progressSubtitle: {
    ...typography.footnote,
    fontFamily: fontFamily.text,
    lineHeight: 18,
  },
  expandButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  progressContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },

  // Continue Test Card styles
  continueTestCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  continueTestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  continueTestIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueTestEmoji: {
    fontSize: 24,
  },
  continueTestText: {
    flex: 1,
  },
  continueTestTitle: {
    ...typography.callout,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    marginBottom: spacing.xs,
  },
  continueTestDescription: {
    ...typography.footnote,
    fontFamily: fontFamily.text,
    lineHeight: 18,
  },
  continueButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    ...typography.footnote,
    fontWeight: '600',
    fontFamily: fontFamily.mono, // Space Mono for action text
    color: '#FFFFFF',
  },
  multipleAssessments: {
    ...typography.caption1,
    fontSize: 11,
    fontFamily: fontFamily.text,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },

  // Quick Stats Grid
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    ...typography.title3,
    fontWeight: '700',
    fontFamily: fontFamily.mono, // Space Mono for numbers
    marginBottom: spacing.xs,
  },
  quickStatLabel: {
    ...typography.caption1,
    fontSize: 10,
    fontFamily: fontFamily.text,
    textAlign: 'center',
  },

  // Analytics Container
  analyticsContainer: {
    marginTop: spacing.md,
  },

  // Carousel Styles
  carouselContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  carousel: {
    flexGrow: 0,
  },
  carouselContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  assessmentCard: {
    width: SCREEN_WIDTH - spacing.lg * 4,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginRight: spacing.md,
  },
  assessmentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  assessmentIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assessmentEmoji: {
    fontSize: 24,
  },
  assessmentText: {
    flex: 1,
  },
  assessmentTitle: {
    ...typography.callout,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    marginBottom: spacing.xs,
  },
  assessmentProgress: {
    ...typography.footnote,
    fontFamily: fontFamily.text,
    marginBottom: 2,
  },
  assessmentTime: {
    ...typography.caption1,
    fontSize: 11,
    fontFamily: fontFamily.mono, // Space Mono for timestamps
  },
  continueAssessmentButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueAssessmentButtonText: {
    ...typography.footnote,
    fontWeight: '600',
    fontFamily: fontFamily.mono, // Space Mono for action text
    color: '#FFFFFF',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyIconText: {
    fontSize: 32,
  },
  exploreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  exploreButtonText: {
    ...typography.footnote,
    fontWeight: '600',
    fontFamily: fontFamily.mono, // Space Mono for action text
    color: '#FFFFFF',
  },

  // Items List
  itemsList: {
    width: '100%',
  },

  // Header Styles with chevron navigation pattern
  headerButton: {
    padding: spacing.md,
    borderRadius: borderRadius.full,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  selectionButton: {
    padding: spacing.md,
    borderRadius: borderRadius.full,
  },
  selectionCancelText: {
    ...typography.footnote,
    fontWeight: '600',
    fontFamily: fontFamily.mono, // Space Mono for navigation text
  },

  // Modal styles with Space Mono typography
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...typography.title3,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.footnote,
    fontFamily: fontFamily.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalSaveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    ...typography.footnote,
    fontWeight: '600',
    fontFamily: fontFamily.mono, // Space Mono for action text
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.xl,
  },
  modalSectionTitle: {
    ...typography.callout,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    marginBottom: spacing.sm,
  },
  modalTextInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    fontFamily: fontFamily.text,
    height: 48,
  },
  modalTextArea: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    fontFamily: fontFamily.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Emoji Grid
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 24,
  },

  // Color Grid
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColorButton: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  // Privacy Toggle
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  privacyToggleContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  privacyToggleTitle: {
    ...typography.callout,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    marginBottom: 2,
  },
  privacyToggleDescription: {
    ...typography.footnote,
    fontFamily: fontFamily.text,
    lineHeight: 18,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  // Collection Options
  collectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  collectionOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  collectionOptionEmoji: {
    fontSize: 20,
  },
  collectionOptionText: {
    flex: 1,
  },
  collectionOptionTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: 2,
  },
  collectionOptionDescription: {
    ...typography.footnote,
    lineHeight: 18,
  },

  // Selection Styles
  selectionBanner: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  selectionBannerText: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Collections Section
  collectionsSection: {
    padding: spacing.lg,
  },
  collectionsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  collectionsSectionTitle: {
    ...typography.title3,
    fontWeight: '600',
  },
  createCollectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  createCollectionButtonText: {
    ...typography.footnote,
    fontWeight: '600',
    fontFamily: fontFamily.mono, // Space Mono for action text
  },
  collectionCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    width: 280, // Fixed width for horizontal scroll
  },
  collectionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  collectionEmoji: {
    fontSize: 24,
  },
  collectionContent: {
    flex: 1,
  },
  collectionName: {
    ...typography.callout,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    marginBottom: spacing.xs,
  },
  collectionDescription: {
    ...typography.footnote,
    fontFamily: fontFamily.text,
    marginBottom: spacing.sm,
    lineHeight: typography.footnote.lineHeight * 1.3,
  },
  collectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collectionItemCount: {
    ...typography.caption1,
    fontSize: 11,
    fontFamily: fontFamily.mono,
  },
  lessonBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  lessonBadgeText: {
    ...typography.caption1,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },
  emptyCollectionsState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyCollectionsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyCollectionsEmoji: {
    fontSize: 32,
  },
  emptyCollectionsTitle: {
    ...typography.title2,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyCollectionsDescription: {
    ...typography.body,
    fontFamily: fontFamily.text,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Collection Subsections
  collectionSubsection: {
    marginBottom: spacing.xl,
  },
  collectionSubsectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  collectionSubsectionTitle: {
    ...typography.title3,
    fontWeight: '600',
  },
  collectionSubsectionSubtitle: {
    ...typography.footnote,
    fontFamily: fontFamily.text,
    marginTop: spacing.xs,
  },

  // Collections Scroll
  collectionsScroll: {
    flexGrow: 0,
  },
  collectionsScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  // Empty My Collections
  emptyMyCollections: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyMyCollectionsText: {
    ...typography.body,
    fontFamily: fontFamily.text,
    textAlign: 'center',
  },

  // Content Filters Section
  contentFiltersSection: {
    padding: spacing.lg,
    paddingTop: 0, // No top padding since it follows collections
  },
  contentFiltersSectionTitle: {
    ...typography.title3,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  filterContainer: {
    paddingVertical: spacing.md,
  },
  filterScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  filterEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  filterLabel: {
    ...typography.footnote,
    fontWeight: '500',
  },

  // Create Collection Button
  createCollectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginLeft: spacing.sm,
  },
  createCollectionText: {
    ...typography.footnote,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
}); 