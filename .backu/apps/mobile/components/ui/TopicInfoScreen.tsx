/**
 * Mobile TopicInfoScreen Component
 * 
 * Provides comprehensive topic information including:
 * - "Why This Matters" content with structured blurbs
 * - Sources & Citations aggregated from all questions
 * - Mobile-optimized tabbed interface
 * - iOS design patterns and accessibility
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Linking,
  Modal,
  Switch,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../atoms/Text';
import { Card } from './Card';
import { AnimatedCard } from './AnimatedCard';
import { LoadingSpinner } from '../molecules/LoadingSpinner';
import { Button } from '../Button';
import { 
  spacing, 
  borderRadius, 
  fontFamily, 
  typography, 
  shadows,
  responsive,
  getDeviceType,
  maxContentWidth,
} from '../../lib/theme';
import { 
  StandardizedDataService,
  fetchQuestions, 
  type StandardTopic, 
  type StandardQuestion 
} from '../../lib/standardized-data-service';
import { parseWhyThisMatters, parseSourceContent, extractDescription } from '../../lib/html-utils';
import { ErrorScreen, NetworkErrorScreen } from './ErrorScreen';
import { iOSColors } from '../../lib/theme/ios-colors';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ParsedBlurb {
  title: string;
  content: string;
  emoji: string;
}

interface SourceMetadata {
  name: string;
  url: string;
  questions: number[];
  title?: string;
  description?: string;
  domain?: string;
  displayDescription?: string;
}

interface TopicInfoScreenProps {
  topicId?: string;
  onStartQuiz?: () => void;
  showStartButton?: boolean;
}

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const deviceType = getDeviceType(screenWidth);

const getResponsiveValue = <T,>(values: {
  mobile?: T;
  small?: T;
  medium?: T;
  large?: T;
  default: T;
}): T => responsive.getValue(values, screenWidth);

const getPlatformSpacing = (baseSpacing: number): number => {
  const platformMultiplier = Platform.OS === 'ios' ? 1 : 0.9;
  return Math.round(baseSpacing * platformMultiplier);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TopicInfoScreen: React.FC<TopicInfoScreenProps> = ({
  topicId: propTopicId,
  onStartQuiz,
  showStartButton = true,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  
  // Use prop topicId or route parameter
  const topicId = propTopicId || params.id;

  // Helper function to safely get questions from source
  const getSourceQuestions = (src: any): number[] => {
    if (!src || !src.questions || !Array.isArray(src.questions)) {
      return [];
    }
    return src.questions;
  };

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [topic, setTopic] = useState<StandardTopic | null>(null);
  const [questions, setQuestions] = useState<StandardQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'why-matters' | 'sources' | 'overview'>('why-matters');
  const [quizSettings, setQuizSettings] = useState({
    timeLimit: 30,
    showExplanations: true,
    difficulty: 'normal' as 'easy' | 'normal' | 'hard',
    questionCount: 15,
  });
  const [settingsVisible, setSettingsVisible] = useState(false);

  // ============================================================================
  // RESPONSIVE STYLES
  // ============================================================================

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      maxWidth: maxContentWidth,
      alignSelf: 'center',
      width: '100%',
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: getPlatformSpacing(spacing.xl),
      paddingHorizontal: getPlatformSpacing(spacing.lg),
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: getPlatformSpacing(spacing.lg),
      paddingVertical: getPlatformSpacing(spacing.md),
      marginTop: getPlatformSpacing(spacing.sm),
    },
    backButtonText: {
      fontSize: getResponsiveValue({
        mobile: typography.callout.fontSize,
        small: typography.body.fontSize,
        default: typography.body.fontSize,
      }),
      color: theme.primary,
      fontFamily: fontFamily.text,
      fontWeight: '600',
    },
    header: {
      paddingHorizontal: getPlatformSpacing(spacing.lg),
      paddingTop: getPlatformSpacing(spacing.lg),
      paddingBottom: getPlatformSpacing(spacing.xl),
    },
    topicEmoji: {
      fontSize: getResponsiveValue({
        mobile: 48,
        small: 56,
        medium: 64,
        default: 56,
      }),
      marginBottom: getPlatformSpacing(spacing.md),
    },
    topicTitle: {
      fontSize: getResponsiveValue({
        mobile: typography.title2.fontSize,
        small: typography.title1.fontSize,
        medium: typography.titleLarge.fontSize,
        default: typography.title1.fontSize,
      }),
      fontWeight: '300',
      color: theme.foreground,
      fontFamily: fontFamily.display,
      lineHeight: getResponsiveValue({
        mobile: typography.title2.lineHeight,
        small: typography.title1.lineHeight,
        medium: typography.titleLarge.lineHeight,
        default: typography.title1.lineHeight,
      }),
      marginBottom: getPlatformSpacing(spacing.sm),
    },
    topicDescription: {
      fontSize: getResponsiveValue({
        mobile: typography.body.fontSize,
        small: typography.body.fontSize,
        medium: typography.headline.fontSize,
        default: typography.body.fontSize,
      }),
      color: theme.foregroundSecondary,
      fontFamily: fontFamily.text,
      lineHeight: getResponsiveValue({
        mobile: typography.body.lineHeight,
        small: typography.body.lineHeight,
        medium: typography.headline.lineHeight,
        default: typography.body.lineHeight,
      }),
      marginBottom: getPlatformSpacing(spacing.lg),
    },
    topicMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getPlatformSpacing(spacing.md),
      marginBottom: getPlatformSpacing(spacing.lg),
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getPlatformSpacing(spacing.xs),
      backgroundColor: theme.muted,
      paddingHorizontal: getPlatformSpacing(spacing.sm),
      paddingVertical: getPlatformSpacing(spacing.xs),
      borderRadius: getResponsiveValue({
        mobile: borderRadius.sm,
        small: borderRadius.md,
        default: borderRadius.md,
      }),
    },
    metaText: {
      fontSize: getResponsiveValue({
        mobile: typography.caption1.fontSize,
        small: typography.footnote.fontSize,
        default: typography.footnote.fontSize,
      }),
      color: theme.foregroundSecondary,
      fontFamily: fontFamily.text,
      fontWeight: '500',
    },
    startQuizContainer: {
      paddingHorizontal: getPlatformSpacing(spacing.lg),
      marginBottom: getPlatformSpacing(spacing.xl),
    },
    startQuizButton: {
      backgroundColor: theme.primary,
      borderRadius: getResponsiveValue({
        mobile: borderRadius.md,
        small: borderRadius.lg,
        default: borderRadius.lg,
      }),
      paddingVertical: getResponsiveValue({
        mobile: spacing.md,
        small: spacing.lg,
        default: spacing.lg,
      }),
      paddingHorizontal: getPlatformSpacing(spacing.xl),
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.button,
      minHeight: 44, // iOS minimum touch target
    },
    startQuizText: {
      fontSize: getResponsiveValue({
        mobile: typography.headline.fontSize,
        small: typography.title3.fontSize,
        default: typography.title3.fontSize,
      }),
      color: theme.foreground,
      fontFamily: fontFamily.display,
      fontWeight: '600',
    },
    tabsContainer: {
      paddingHorizontal: getPlatformSpacing(spacing.lg),
      marginBottom: getPlatformSpacing(spacing.lg),
    },
    tabsHeader: {
      flexDirection: 'row',
      backgroundColor: theme.muted,
      borderRadius: getResponsiveValue({
        mobile: borderRadius.md,
        small: borderRadius.lg,
        default: borderRadius.lg,
      }),
      padding: getPlatformSpacing(spacing.xs),
      marginBottom: getPlatformSpacing(spacing.lg),
      alignSelf: 'flex-start',
    },
    tab: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getResponsiveValue({
        mobile: spacing.sm,
        small: spacing.md,
        default: spacing.md,
      }),
      paddingHorizontal: getPlatformSpacing(spacing.lg),
      borderRadius: getResponsiveValue({
        mobile: borderRadius.sm,
        small: borderRadius.md,
        default: borderRadius.md,
      }),
      minHeight: 44,
      minWidth: 80,
    },
    tabActive: {
      backgroundColor: theme.background,
      ...shadows.card,
    },
    tabText: {
      fontSize: getResponsiveValue({
        mobile: typography.footnote.fontSize,
        small: typography.callout.fontSize,
        default: typography.callout.fontSize,
      }),
      color: theme.foregroundSecondary,
      fontFamily: fontFamily.text,
      fontWeight: '500',
      textAlign: 'center',
    },
    tabTextActive: {
      color: theme.foreground,
      fontWeight: '600',
    },
    sourceCount: {
      backgroundColor: theme.primary,
      borderRadius: borderRadius.full,
      paddingHorizontal: getPlatformSpacing(spacing.xs),
      paddingVertical: 2,
      marginLeft: getPlatformSpacing(spacing.xs),
      minWidth: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sourceCountText: {
      fontSize: getResponsiveValue({
        mobile: typography.caption.fontSize,
        small: typography.caption.fontSize,
        default: typography.caption.fontSize,
      }),
      color: theme.foreground,
      fontFamily: fontFamily.text,
      fontWeight: '600',
    },
    contentContainer: {
      paddingHorizontal: getPlatformSpacing(spacing.lg),
    },
    blurbCard: {
      backgroundColor: theme.card,
      borderRadius: getResponsiveValue({
        mobile: borderRadius.md,
        small: borderRadius.lg,
        default: borderRadius.lg,
      }),
      padding: getResponsiveValue({
        mobile: spacing.md,
        small: spacing.lg,
        default: spacing.lg,
      }),
      marginBottom: getPlatformSpacing(spacing.md),
      borderWidth: Platform.OS === 'ios' ? 1 : 1.5,
      borderColor: theme.border,
      ...shadows.card,
    },
    blurbHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: getPlatformSpacing(spacing.sm),
    },
    blurbEmoji: {
      fontSize: getResponsiveValue({
        mobile: 20,
        small: 24,
        default: 24,
      }),
      marginRight: getPlatformSpacing(spacing.sm),
      marginTop: 2,
    },
    blurbTitle: {
      fontSize: getResponsiveValue({
        mobile: typography.callout.fontSize,
        small: typography.headline.fontSize,
        medium: typography.title3.fontSize,
        default: typography.headline.fontSize,
      }),
      fontWeight: '500',
      color: theme.foreground,
      fontFamily: fontFamily.display,
      flex: 1,
      lineHeight: getResponsiveValue({
        mobile: typography.callout.lineHeight,
        small: typography.headline.lineHeight,
        medium: typography.title3.lineHeight,
        default: typography.headline.lineHeight,
      }),
    },
    blurbContent: {
      fontSize: getResponsiveValue({
        mobile: typography.body.fontSize,
        small: typography.body.fontSize,
        medium: typography.headline.fontSize,
        default: typography.body.fontSize,
      }),
      color: theme.foregroundSecondary,
      fontFamily: fontFamily.text,
      lineHeight: getResponsiveValue({
        mobile: typography.body.lineHeight,
        small: typography.body.lineHeight,
        medium: typography.headline.lineHeight,
        default: typography.body.lineHeight,
      }),
      marginLeft: getResponsiveValue({
        mobile: 32,
        small: 36,
        default: 36,
      }),
    },
    sourcesContainer: {
      paddingHorizontal: getPlatformSpacing(spacing.lg),
    },
    sourcesHeader: {
      marginBottom: getPlatformSpacing(spacing.lg),
    },
    sourcesDescription: {
      fontSize: getResponsiveValue({
        mobile: typography.body.fontSize,
        small: typography.body.fontSize,
        default: typography.body.fontSize,
      }),
      color: theme.foregroundSecondary,
      fontFamily: fontFamily.text,
      lineHeight: typography.body.lineHeight,
    },
    sourceCard: {
      backgroundColor: theme.card,
      borderRadius: getResponsiveValue({
        mobile: borderRadius.md,
        small: borderRadius.lg,
        default: borderRadius.lg,
      }),
      padding: getResponsiveValue({
        mobile: spacing.md,
        small: spacing.lg,
        default: spacing.lg,
      }),
      marginBottom: getPlatformSpacing(spacing.md),
      borderWidth: Platform.OS === 'ios' ? 1 : 1.5,
      borderColor: theme.border,
      ...shadows.card,
    },
    sourceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: getPlatformSpacing(spacing.sm),
    },
    sourceIcon: {
      fontSize: getResponsiveValue({
        mobile: 16,
        small: 18,
        default: 18,
      }),
      marginRight: getPlatformSpacing(spacing.sm),
      color: theme.primary,
    },
    sourceName: {
      fontSize: getResponsiveValue({
        mobile: typography.callout.fontSize,
        small: typography.headline.fontSize,
        default: typography.headline.fontSize,
      }),
      fontWeight: '600',
      color: theme.foreground,
      fontFamily: fontFamily.display,
      flex: 1,
    },
    sourceUrl: {
      fontSize: getResponsiveValue({
        mobile: typography.footnote.fontSize,
        small: typography.callout.fontSize,
        default: typography.callout.fontSize,
      }),
      color: theme.primary,
      fontFamily: fontFamily.text,
      marginBottom: getPlatformSpacing(spacing.sm),
    },
    sourceQuestions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sourceQuestionsText: {
      fontSize: getResponsiveValue({
        mobile: typography.caption1.fontSize,
        small: typography.footnote.fontSize,
        default: typography.footnote.fontSize,
      }),
      color: theme.foregroundTertiary,
      fontFamily: fontFamily.text,
    },
    sourceQuestionsCount: {
      backgroundColor: theme.muted,
      borderRadius: borderRadius.full,
      paddingHorizontal: getPlatformSpacing(spacing.sm),
      paddingVertical: getPlatformSpacing(spacing.xs),
    },
    sourceQuestionsCountText: {
      fontSize: getResponsiveValue({
        mobile: typography.caption1.fontSize,
        small: typography.footnote.fontSize,
        default: typography.footnote.fontSize,
      }),
      color: theme.foreground,
      fontFamily: fontFamily.text,
      fontWeight: '600',
    },
    noSourcesCard: {
      backgroundColor: theme.muted,
      borderRadius: getResponsiveValue({
        mobile: borderRadius.md,
        small: borderRadius.lg,
        default: borderRadius.lg,
      }),
      padding: getResponsiveValue({
        mobile: spacing.lg,
        small: spacing.xl,
        default: spacing.xl,
      }),
      alignItems: 'center',
      borderWidth: Platform.OS === 'ios' ? 1 : 1.5,
      borderColor: theme.border,
    },
    noSourcesIcon: {
      fontSize: getResponsiveValue({
        mobile: 32,
        small: 40,
        default: 40,
      }),
      marginBottom: getPlatformSpacing(spacing.md),
    },
    noSourcesTitle: {
      fontSize: getResponsiveValue({
        mobile: typography.headline.fontSize,
        small: typography.title3.fontSize,
        default: typography.title3.fontSize,
      }),
      fontWeight: '600',
      color: theme.foreground,
      fontFamily: fontFamily.display,
      marginBottom: getPlatformSpacing(spacing.sm),
      textAlign: 'center',
    },
    noSourcesDescription: {
      fontSize: getResponsiveValue({
        mobile: typography.body.fontSize,
        small: typography.body.fontSize,
        default: typography.body.fontSize,
      }),
      color: theme.foregroundSecondary,
      fontFamily: fontFamily.text,
      textAlign: 'center',
      lineHeight: typography.body.lineHeight,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: getPlatformSpacing(spacing.lg),
    },
    errorText: {
      fontSize: getResponsiveValue({
        mobile: typography.body.fontSize,
        small: typography.headline.fontSize,
        default: typography.headline.fontSize,
      }),
      color: theme.destructive,
      fontFamily: fontFamily.text,
      textAlign: 'center',
      marginBottom: getPlatformSpacing(spacing.md),
    },
    retryButton: {
      backgroundColor: theme.primary,
      borderRadius: getResponsiveValue({
        mobile: borderRadius.md,
        small: borderRadius.lg,
        default: borderRadius.lg,
      }),
      paddingVertical: getResponsiveValue({
        mobile: spacing.sm,
        small: spacing.md,
        default: spacing.md,
      }),
      paddingHorizontal: getResponsiveValue({
        mobile: spacing.md,
        small: spacing.lg,
        default: spacing.lg,
      }),
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    retryButtonText: {
      color: theme.foreground,
      fontWeight: '600',
      fontSize: getResponsiveValue({
        mobile: typography.callout.fontSize,
        small: typography.body.fontSize,
        default: typography.body.fontSize,
      }),
      fontFamily: fontFamily.text,
    },
    bottomSpacer: {
      height: getPlatformSpacing(spacing.xl),
    },
    sourceText: {
      fontSize: getResponsiveValue({
        mobile: typography.caption.fontSize,
        small: typography.caption.fontSize,
        medium: typography.footnote.fontSize,
        default: typography.caption.fontSize,
      }),
      color: theme.foregroundSecondary,
      fontFamily: fontFamily.text,
      lineHeight: getResponsiveValue({
        mobile: typography.caption.lineHeight,
        small: typography.caption.lineHeight,
        medium: typography.footnote.lineHeight,
        default: typography.caption.lineHeight,
      }),
    },
    settingsContainer: {
      paddingHorizontal: getPlatformSpacing(spacing.lg),
      marginBottom: getPlatformSpacing(spacing.lg),
    },
    settingsCard: {
      backgroundColor: theme.card,
      borderRadius: getResponsiveValue({
        mobile: borderRadius.md,
        small: borderRadius.lg,
        default: borderRadius.lg,
      }),
      padding: getResponsiveValue({
        mobile: spacing.md,
        small: spacing.lg,
        default: spacing.lg,
      }),
      borderWidth: Platform.OS === 'ios' ? 1 : 1.5,
      borderColor: theme.border,
      ...shadows.card,
    },
    settingsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: getPlatformSpacing(spacing.md),
    },
    settingsTitle: {
      fontSize: getResponsiveValue({
        mobile: typography.callout.fontSize,
        small: typography.headline.fontSize,
        default: typography.headline.fontSize,
      }),
      fontWeight: '600',
      color: theme.foreground,
      fontFamily: fontFamily.display,
    },
    customizeLink: {
      paddingHorizontal: getPlatformSpacing(spacing.sm),
      paddingVertical: getPlatformSpacing(spacing.xs),
      borderRadius: borderRadius.sm,
      backgroundColor: theme.muted,
    },
    customizeLinkText: {
      fontSize: getResponsiveValue({
        mobile: typography.footnote.fontSize,
        small: typography.callout.fontSize,
        default: typography.callout.fontSize,
      }),
      color: theme.primary,
      fontFamily: fontFamily.text,
      fontWeight: '600',
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: getPlatformSpacing(spacing.sm),
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    settingItemLast: {
      borderBottomWidth: 0,
    },
    settingInfo: {
      flex: 1,
    },
    settingLabel: {
      fontSize: getResponsiveValue({
        mobile: typography.callout.fontSize,
        small: typography.body.fontSize,
        default: typography.body.fontSize,
      }),
      fontWeight: '600',
      color: theme.foreground,
      fontFamily: fontFamily.text,
    },
    settingDescription: {
      fontSize: getResponsiveValue({
        mobile: typography.footnote.fontSize,
        small: typography.footnote.fontSize,
        default: typography.footnote.fontSize,
      }),
      color: theme.foregroundSecondary,
      fontFamily: fontFamily.text,
      marginTop: 2,
    },
    settingValue: {
      fontSize: getResponsiveValue({
        mobile: typography.callout.fontSize,
        small: typography.body.fontSize,
        default: typography.body.fontSize,
      }),
      fontWeight: '600',
      color: theme.primary,
      fontFamily: fontFamily.text,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: getPlatformSpacing(spacing.lg),
    },
    modalContent: {
      backgroundColor: theme.background,
      borderRadius: getResponsiveValue({
        mobile: borderRadius.lg,
        small: borderRadius.xl,
        default: borderRadius.xl,
      }),
      padding: getResponsiveValue({
        mobile: spacing.lg,
        small: spacing.xl,
        default: spacing.xl,
      }),
      width: '100%',
      maxWidth: 400,
      ...shadows.card,
    },
    modalTitle: {
      fontSize: getResponsiveValue({
        mobile: typography.title3.fontSize,
        small: typography.title2.fontSize,
        default: typography.title2.fontSize,
      }),
      fontWeight: '600',
      color: theme.foreground,
      fontFamily: fontFamily.display,
      marginBottom: getPlatformSpacing(spacing.lg),
      textAlign: 'center',
    },
    modalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: getPlatformSpacing(spacing.md),
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalRowLast: {
      borderBottomWidth: 0,
    },
    modalLabel: {
      fontSize: getResponsiveValue({
        mobile: typography.callout.fontSize,
        small: typography.body.fontSize,
        default: typography.body.fontSize,
      }),
      fontWeight: '600',
      color: theme.foreground,
      fontFamily: fontFamily.text,
      flex: 1,
    },
    modalValue: {
      fontSize: getResponsiveValue({
        mobile: typography.callout.fontSize,
        small: typography.body.fontSize,
        default: typography.body.fontSize,
      }),
      fontWeight: '600',
      color: theme.primary,
      fontFamily: fontFamily.text,
      marginHorizontal: getPlatformSpacing(spacing.md),
      minWidth: 40,
      textAlign: 'center',
    },
    modalButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getPlatformSpacing(spacing.sm),
    },
    modalButton: {
      backgroundColor: theme.muted,
      borderRadius: borderRadius.sm,
      paddingHorizontal: getPlatformSpacing(spacing.md),
      paddingVertical: getPlatformSpacing(spacing.sm),
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalButtonActive: {
      backgroundColor: theme.primary,
    },
    modalButtonText: {
      fontSize: getResponsiveValue({
        mobile: typography.footnote.fontSize,
        small: typography.callout.fontSize,
        default: typography.callout.fontSize,
      }),
      fontWeight: '600',
      color: theme.foreground,
      fontFamily: fontFamily.text,
    },
    modalButtonTextActive: {
      color: theme.foreground,
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: getPlatformSpacing(spacing.xl),
      gap: getPlatformSpacing(spacing.md),
    },
    modalActionButton: {
      flex: 1,
      borderRadius: getResponsiveValue({
        mobile: borderRadius.md,
        small: borderRadius.lg,
        default: borderRadius.lg,
      }),
      paddingVertical: getResponsiveValue({
        mobile: spacing.md,
        small: spacing.lg,
        default: spacing.lg,
      }),
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    modalActionText: {
      fontSize: getResponsiveValue({
        mobile: typography.callout.fontSize,
        small: typography.body.fontSize,
        default: typography.body.fontSize,
      }),
      fontWeight: '600',
      color: theme.foreground,
      fontFamily: fontFamily.text,
    },
  });

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    if (topicId) {
      loadTopicData();
    }
  }, [topicId]);

  const loadTopicData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`📖 TopicInfoScreen: Loading data for topic ${topicId}`);

      // Load topic information
      const dataService = new StandardizedDataService();
      const topicResponse = await dataService.fetchTopicById(topicId, { useCache: true });
      
      if (topicResponse.error) {
        throw new Error(topicResponse.error.message);
      }

      if (!topicResponse.data) {
        throw new Error('Topic not found');
      }

      setTopic(topicResponse.data);

      // Load questions for sources aggregation
      setQuestionsLoading(true);
      const questionsResponse = await fetchQuestions(topicId, { 
        limit: 50, // Get more questions to aggregate all sources
        useCache: true 
      });

      if (questionsResponse.error) {
        console.warn('Failed to load questions for sources:', questionsResponse.error.message);
        setQuestions([]);
      } else {
        setQuestions(questionsResponse.data || []);
      }

      setQuestionsLoading(false);

    } catch (error) {
      console.error('Error loading topic data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load topic data');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // CONTENT PARSING
  // ============================================================================

  // Parse "why this matters" content using HTML utility
  const blurbs = useMemo(() => {
    if (!topic?.why_this_matters) return [];
    return parseWhyThisMatters(topic.why_this_matters);
  }, [topic?.why_this_matters]);

  // Aggregate sources from all questions with enhanced JSONB handling
  const sources = useMemo(() => {
    if (questions.length === 0) return [];

    const sourceMap = new Map<string, SourceMetadata>();

    console.log(`🔍 TopicInfoScreen: Processing ${questions.length} questions for sources`);

    questions.forEach((question, questionIndex) => {
      const questionNumber = question.question_number || (questionIndex + 1);
      
      console.log(`📋 Processing question ${questionNumber}:`, {
        id: question.id,
        hasSource: !!question.sources,
        sourceType: typeof question.sources,
        sourceLength: Array.isArray(question.sources) ? question.sources.length : 'N/A'
      });

      // Handle different source formats
      if (question.sources) {
        let sourcesToProcess: any[] = [];

        // Handle JSONB array format
        if (Array.isArray(question.sources)) {
          sourcesToProcess = question.sources;
        }
        // Handle JSONB object format (single source)
        else if (typeof question.sources === 'object' && question.sources !== null) {
          sourcesToProcess = [question.sources];
        }
        // Handle string format (JSON strings, comma-separated URLs, or single URL)
        else if (typeof question.sources === 'string') {
          const sourceString = question.sources.trim();
          
          // Try to parse as JSON first - this handles the stored JSON strings
          try {
            const parsed = JSON.parse(sourceString);
            if (Array.isArray(parsed)) {
              sourcesToProcess = parsed;
            } else if (typeof parsed === 'object' && parsed !== null) {
              sourcesToProcess = [parsed];
            }
          } catch {
            // Not valid JSON, check if it looks like a JSON object that got truncated or malformed
            if (sourceString.startsWith('{') && sourceString.includes('"url"')) {
              // This looks like a JSON object, try to extract URL and name
              const urlMatch = sourceString.match(/"url":\s*"([^"]+)"/);
              const nameMatch = sourceString.match(/"name":\s*"([^"]+)"/);
              const titleMatch = sourceString.match(/"title":\s*"([^"]+)"/);
              const ogTitleMatch = sourceString.match(/"og_title":\s*"([^"]+)"/);
              const descMatch = sourceString.match(/"description":\s*"([^"]+)"/);
              const ogDescMatch = sourceString.match(/"og_description":\s*"([^"]+)"/);
              
              if (urlMatch) {
                sourcesToProcess = [{
                  url: urlMatch[1],
                  name: ogTitleMatch ? ogTitleMatch[1] : (titleMatch ? titleMatch[1] : (nameMatch ? nameMatch[1] : urlMatch[1])),
                  og_title: ogTitleMatch ? ogTitleMatch[1] : undefined,
                  title: titleMatch ? titleMatch[1] : undefined,
                  og_description: ogDescMatch ? ogDescMatch[1] : undefined,
                  description: descMatch ? descMatch[1] : undefined
                }];
              }
            }
            // Fall back to treating as comma-separated URLs or single URL
            else if (sourceString.includes(',')) {
              sourcesToProcess = sourceString.split(',').map(url => ({
                url: url.trim(),
                name: url.trim()
              }));
            } else if (sourceString.startsWith('http')) {
              sourcesToProcess = [{
                url: sourceString,
                name: sourceString
              }];
            }
          }
        }

        console.log(`📚 Question ${questionNumber} has ${sourcesToProcess.length} sources to process`);

        sourcesToProcess.forEach((source: any, sourceIndex) => {
          let name = '';
          let url = '';
          let domain = '';

          console.log(`📖 Processing source ${sourceIndex + 1} for question ${questionNumber}:`, source);

          // Handle object source format (standard JSONB)
          if (source && typeof source === 'object' && source !== null) {
            const sourceObj = source as Record<string, any>;
            
            // Support multiple field name variations, prioritizing OpenGraph data
            name = sourceObj.og_title ||          // OpenGraph title (preferred)
                   sourceObj.title || 
                   sourceObj.name || 
                   sourceObj.source_name || 
                   sourceObj.sourceName || 
                   sourceObj.organization || 
                   sourceObj.author || 
                   '';
            
            url = sourceObj.url || 
                  sourceObj.link || 
                  sourceObj.href || 
                  sourceObj.source_url || 
                  sourceObj.sourceUrl || 
                  '';
            
            domain = sourceObj.domain || 
                     sourceObj.site || 
                     sourceObj.website || 
                     '';
          }
          // Handle string source (URL only)
          else if (typeof source === 'string' && source.trim() !== '') {
            const trimmedSource = source.trim();
            if (trimmedSource.startsWith('http')) {
              url = trimmedSource;
              name = trimmedSource;
            }
          }

          // Extract domain from URL if not provided
          if (url && !domain) {
            try {
              const urlObj = new URL(url);
              domain = urlObj.hostname.replace(/^www\./, '');
              
              // If no name provided, use a cleaned up domain
              if (!name || name === url) {
                const domainParts = domain.split('.');
                if (domainParts.length >= 2) {
                  const domainName = domainParts[domainParts.length - 2];
                  if (domainName) {
                    name = domainName.charAt(0).toUpperCase() + domainName.slice(1);
                  } else {
                    name = domain;
                  }
                } else {
                  name = domain;
                }
              }
            } catch (error) {
              console.warn(`Failed to parse URL: ${url}`, error);
            }
          }

          // Only add sources with valid URLs
          if (url && url.trim() !== '') {
            const cleanUrl = url.trim();
            const displayName = (name && name.trim() !== '') ? name.trim() : cleanUrl;

            console.log(`✅ Adding source: ${displayName} (${cleanUrl}) for question ${questionNumber}`);

            if (!sourceMap.has(cleanUrl)) {
              // Extract OpenGraph description for display
              let ogDescription = '';
              if (source && typeof source === 'object' && source !== null) {
                const sourceObj = source as Record<string, any>;
                ogDescription = sourceObj.og_description || sourceObj.description || sourceObj.summary || '';
              }
              
              const sourceData: any = {
                name: displayName,
                url: cleanUrl,
                questions: [questionNumber],
              };
              
              if (source && typeof source === 'object' && source !== null) {
                const sourceObj = source as any;
                if (sourceObj.title) sourceData.title = sourceObj.title;
                if (sourceObj.description) sourceData.description = sourceObj.description;
              }
              
              if (ogDescription) sourceData.displayDescription = ogDescription;
              if (domain) sourceData.domain = domain;
              
              sourceMap.set(cleanUrl, sourceData);
            } else {
              const existing = sourceMap.get(cleanUrl)!;
              if (!existing.questions.includes(questionNumber)) {
                existing.questions.push(questionNumber);
                console.log(`🔄 Updated existing source ${displayName} with question ${questionNumber}`);
              }
            }
          } else {
            console.warn(`⚠️ Skipping source with no URL for question ${questionNumber}:`, source);
          }
        });
      } else {
        console.log(`📭 Question ${questionNumber} has no sources`);
      }
    });

    // Convert to array and sort by usage frequency, then alphabetically
    const sourcesArray = Array.from(sourceMap.values()).sort((a, b) => {
      // Sort by number of questions (most used first)
      if (b.questions.length !== a.questions.length) {
        return b.questions.length - a.questions.length;
      }
      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

    console.log(`✅ TopicInfoScreen: Processed ${sourcesArray.length} unique sources from ${questions.length} questions`);
    console.log('📊 Source summary:', sourcesArray.map(s => ({
      name: s.name,
      url: s.url,
      questions: s.questions.length
    })));

    return sourcesArray;
  }, [questions]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartQuiz = () => {
    if (onStartQuiz) {
      onStartQuiz();
    } else if (topicId) {
      // Navigate directly to quiz session with settings
      const queryParams = new URLSearchParams({
        mode: 'practice',
        timeLimit: quizSettings.timeLimit.toString(),
        showExplanations: quizSettings.showExplanations.toString(),
        questionCount: quizSettings.questionCount.toString(),
        difficulty: quizSettings.difficulty,
      });
      
      router.push(`/quiz-session/${topicId}?${queryParams.toString()}` as any);
    }
  };

  const handleCustomizeSettings = () => {
    setSettingsVisible(true);
  };

  const handleSaveSettings = (newSettings: typeof quizSettings) => {
    setQuizSettings(newSettings);
    setSettingsVisible(false);
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/quiz');
    }
  };

  const handleSourcePress = async (source: SourceMetadata) => {
    try {
      const supported = await Linking.canOpenURL(source.url);
      if (supported) {
        await Linking.openURL(source.url);
      }
    } catch (error) {
      console.warn('Failed to open source URL:', error);
    }
  };

  // Helper function to extract clean display names from potentially messy source data
  const getCleanSourceName = (source: SourceMetadata | null | undefined): string => {
    if (!source?.name) return 'Unknown Source';
    
    // If the name looks like JSON data, try to extract meaningful information
    if (source.name.startsWith('{"') || source.name.startsWith('{\'')) {
      try {
        // Try to parse if it's a JSON string
        const parsed = JSON.parse(source.name);
        return parsed?.og_title || parsed?.title || parsed?.name || 'Article';
      } catch {
        // If parsing fails, try regex extraction
        const titleMatch = source.name.match(/"(?:og_)?title":\s*"([^"]+)"/);
        const nameMatch = source.name.match(/"name":\s*"([^"]+)"/);
        if (titleMatch?.[1]) return titleMatch[1];
        if (nameMatch?.[1]) return nameMatch[1];
        
        // Extract domain from URL as fallback
        const urlMatch = source.name.match(/"url":\s*"([^"]+)"/);
        if (urlMatch?.[1]) {
          try {
            const domain = new URL(urlMatch[1]).hostname.replace(/^www\./, '');
            return domain.charAt(0).toUpperCase() + domain.slice(1);
          } catch {
            return 'Article';
          }
        }
      }
    }
    
    return source.name;
  };

  // Helper function to extract clean descriptions from source data
  const getCleanSourceDescription = (source: SourceMetadata | null | undefined): string => {
    if (!source) return '';
    
    // First try the displayDescription
    if (source.displayDescription) return source.displayDescription;
    
    // If the name contains JSON, try to extract description
    if (source.name && (source.name.startsWith('{"') || source.name.startsWith('{\''))) {
      try {
        const parsed = JSON.parse(source.name);
        return parsed?.og_description || parsed?.description || '';
      } catch {
        // Extract description from JSON string using regex
        if (source.name) {
          const descMatch = source.name.match(/"(?:og_)?description":\s*"([^"]+)"/);
          if (descMatch?.[1]) return descMatch[1];
        }
      }
    }
    
    return source.description || '';
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderTabHeader = () => (
    <View style={styles.tabsContainer}>
      <View style={styles.tabsHeader}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'why-matters' && styles.tabActive]}
          onPress={() => setActiveTab('why-matters')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            ...(activeTab === 'why-matters' ? [styles.tabTextActive] : [])
          ]}>
            💡 Why This Matters
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sources' && styles.tabActive]}
          onPress={() => setActiveTab('sources')}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[
              styles.tabText,
              ...(activeTab === 'sources' ? [styles.tabTextActive] : [])
            ]}>
              📚 Sources
            </Text>
            {sources.length > 0 && (
              <View style={styles.sourceCount}>
                <Text style={styles.sourceCountText}>
                  {sources.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            ...(activeTab === 'overview' ? [styles.tabTextActive] : [])
          ]}>
            📖 Overview
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWhyMattersContent = () => {
    if (blurbs.length === 0) {
      return (
        <View style={styles.contentContainer}>
          <Card style={styles.blurbCard} variant="outlined">
            <Text style={styles.blurbContent}>
              {topic?.why_this_matters || 'This topic provides important civic knowledge for democratic participation.'}
            </Text>
          </Card>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {blurbs.map((blurb, index) => (
          <AnimatedCard
            key={index}
            style={styles.blurbCard}
            variant="outlined"
            delay={index * 100}
          >
            <View style={styles.blurbHeader}>
              <Text style={styles.blurbEmoji}>{blurb.emoji}</Text>
              <Text style={styles.blurbTitle}>{blurb.title}</Text>
            </View>
            <Text style={styles.blurbContent}>{blurb.content}</Text>
          </AnimatedCard>
        ))}
      </View>
    );
  };

  const renderSourcesContent = () => {
    if (questionsLoading) {
      return (
        <View style={styles.sourcesContainer}>
          <View style={[styles.loadingContainer, { minHeight: 200 }]}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text variant="body" style={{ marginTop: spacing.sm, color: theme.foregroundSecondary }}>
              Loading sources...
            </Text>
          </View>
        </View>
      );
    }

    if (sources.length === 0) {
      return (
        <View style={styles.sourcesContainer}>
          <Card style={styles.noSourcesCard} variant="outlined">
            <Text style={styles.noSourcesIcon}>📚</Text>
            <Text style={styles.noSourcesTitle}>
              Sources Being Processed
            </Text>
            <Text style={styles.noSourcesDescription}>
              Source information for this topic is currently being processed. Check back soon for comprehensive citations and references.
            </Text>
          </Card>
        </View>
      );
    }

    return (
      <View style={styles.sourcesContainer}>
        <View style={styles.sourcesHeader}>
          <Text style={styles.sourcesDescription}>
            This quiz draws information from {sources.length} credible source{sources.length !== 1 ? 's' : ''}.
          </Text>
        </View>
        
        {sources.map((source, index) => {
          if (!source) return null;
          
          // Safely extract question data before rendering to avoid TypeScript errors
          const questions = source?.questions || [];
          const hasMultipleQuestions = questions.length > 1;
          const questionText = questions.length > 0 
            ? questions.slice().sort((a, b) => a - b).join(', ')
            : '';
          
          return (
            <AnimatedCard
              key={index}
              style={styles.sourceCard}
              variant="outlined"
              onPress={() => source ? handleSourcePress(source) : null}
              delay={index * 50}
            >
              <View style={styles.sourceHeader}>
                <Text style={styles.sourceIcon}>🔗</Text>
                <Text style={styles.sourceName} numberOfLines={2}>
                  {getCleanSourceName(source)}
                </Text>
              </View>
              
              {/* Display article description if available */}
              {getCleanSourceDescription(source) && (
                <Text style={styles.sourceText} numberOfLines={3}>
                  {getCleanSourceDescription(source)}
                </Text>
              )}
              
              <TouchableOpacity onPress={() => source ? handleSourcePress(source) : null}>
                <Text style={styles.sourceUrl} numberOfLines={1}>
                  {source?.domain || source?.url || '#'}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.sourceQuestions}>
                <Text style={styles.sourceQuestionsText}>
                  {questions.length > 0 ? (
                    `Used in question${hasMultipleQuestions ? 's' : ''}: ${questionText}`
                  ) : (
                    'No question information available'
                  )}
                </Text>
                {hasMultipleQuestions && (
                  <View style={styles.sourceQuestionsCount}>
                    <Text style={styles.sourceQuestionsCountText}>
                      {questions.length} questions
                    </Text>
                  </View>
                )}
              </View>
            </AnimatedCard>
          );
        })}
      </View>
    );
  };

  const renderOverviewContent = () => {
    return (
      <View style={styles.contentContainer}>
        <Card style={styles.blurbCard} variant="outlined">
          <View style={styles.blurbHeader}>
            <Text style={styles.blurbEmoji}>📖</Text>
            <Text style={styles.blurbTitle}>Topic Overview</Text>
          </View>
          <Text style={styles.blurbContent}>
            {extractDescription(topic?.description) || 'This quiz covers important civic knowledge to help you better understand democratic processes and your role as a citizen.'}
          </Text>
        </Card>

        <Card style={styles.blurbCard} variant="outlined">
          <View style={styles.blurbHeader}>
            <Text style={styles.blurbEmoji}>🎯</Text>
            <Text style={styles.blurbTitle}>Learning Objectives</Text>
          </View>
          <Text style={styles.blurbContent}>
            Understanding this topic will help you make more informed decisions as an active citizen and participant in democratic processes.
          </Text>
        </Card>

        {topic?.question_count && (
          <Card style={styles.blurbCard} variant="outlined">
            <View style={styles.blurbHeader}>
              <Text style={styles.blurbEmoji}>❓</Text>
              <Text style={styles.blurbTitle}>What You'll Learn</Text>
            </View>
            <Text style={styles.blurbContent}>
              This quiz contains {topic.question_count} questions designed to test and expand your knowledge on this important civic topic.
            </Text>
          </Card>
        )}
      </View>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text variant="body" style={{ marginTop: spacing.sm, color: theme.foregroundSecondary }}>
            Loading topic information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !topic) {
    // Determine error type based on the error message
    const isNetworkError = error?.includes('network') || error?.includes('connection') || error?.includes('timeout');
    const isNotFoundError = error?.includes('not found') || error?.includes('NOT_FOUND');
    
    if (isNetworkError) {
      return (
        <NetworkErrorScreen
          title="Can't Load Topic"
          message="We're having trouble loading this topic. Check your connection and try again."
          onRetry={loadTopicData}
          debugInfo={__DEV__ ? { error, topicId } : undefined}
        />
      );
    }
    
    if (isNotFoundError) {
      return (
        <ErrorScreen
          errorType="notFound"
          title="Topic Not Available"
          message="This topic isn't available right now. It might have been removed or moved."
          showRetry={false}
          debugInfo={__DEV__ ? { error, topicId } : undefined}
        />
      );
    }
    
    // Generic database error
    return (
      <ErrorScreen
        errorType="database"
        title="Can't Load Topic"
        message="We're having trouble loading this topic. Our team has been notified."
        onRetry={loadTopicData}
        debugInfo={__DEV__ ? { error, topicId } : undefined}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Topic Header */}
        <View style={styles.header}>
          <Text style={styles.topicEmoji}>
            {topic.emoji || '📖'}
          </Text>
          <Text style={styles.topicTitle}>
            {topic.title}
          </Text>
          {topic.description && (
            <Text style={styles.topicDescription}>
              {topic.description}
            </Text>
          )}
          
          <View style={styles.topicMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaText}>📚</Text>
              <Text style={styles.metaText}>
                {topic.category?.name || 'General'}
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Text style={styles.metaText}>❓</Text>
              <Text style={styles.metaText}>
                {topic.question_count || 0} questions
              </Text>
            </View>
          </View>
        </View>

        {/* Quiz Settings */}
        <View style={styles.settingsContainer}>
          <Card style={styles.settingsCard} variant="outlined">
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>⚙️ Quiz Settings</Text>
              <TouchableOpacity
                style={styles.customizeLink}
                onPress={handleCustomizeSettings}
                activeOpacity={0.7}
              >
                <Text style={styles.customizeLinkText}>Customize</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Questions</Text>
                <Text style={styles.settingDescription}>Number of questions in quiz</Text>
              </View>
              <Text style={styles.settingValue}>{quizSettings.questionCount}</Text>
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Time Limit</Text>
                <Text style={styles.settingDescription}>Seconds per question</Text>
              </View>
              <Text style={styles.settingValue}>{quizSettings.timeLimit}s</Text>
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Explanations</Text>
                <Text style={styles.settingDescription}>Show answer explanations</Text>
              </View>
              <Text style={styles.settingValue}>
                {quizSettings.showExplanations ? 'Yes' : 'No'}
              </Text>
            </View>
            
            <View style={[styles.settingItem, styles.settingItemLast]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Difficulty</Text>
                <Text style={styles.settingDescription}>Question complexity level</Text>
              </View>
              <Text style={styles.settingValue}>
                {quizSettings.difficulty.charAt(0).toUpperCase() + quizSettings.difficulty.slice(1)}
              </Text>
            </View>
          </Card>
        </View>

        {/* Start Quiz Button */}
        {showStartButton && (
          <View style={styles.startQuizContainer}>
            <TouchableOpacity
              style={styles.startQuizButton}
              onPress={handleStartQuiz}
              activeOpacity={0.8}
            >
              <Text style={styles.startQuizText}>
                Start Quiz
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tabbed Content */}
        {renderTabHeader()}
        
        {activeTab === 'why-matters' && renderWhyMattersContent()}
        {activeTab === 'sources' && renderSourcesContent()}
        {activeTab === 'overview' && renderOverviewContent()}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Customize Quiz Settings</Text>
            
            {/* Question Count */}
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Questions</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setQuizSettings(prev => ({ 
                    ...prev, 
                    questionCount: Math.max(5, prev.questionCount - 5) 
                  }))}
                >
                  <Text style={styles.modalButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.modalValue}>{quizSettings.questionCount}</Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setQuizSettings(prev => ({ 
                    ...prev, 
                    questionCount: Math.min(50, prev.questionCount + 5) 
                  }))}
                >
                  <Text style={styles.modalButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Time Limit */}
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Time Limit (s)</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setQuizSettings(prev => ({ 
                    ...prev, 
                    timeLimit: Math.max(10, prev.timeLimit - 5) 
                  }))}
                >
                  <Text style={styles.modalButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.modalValue}>{quizSettings.timeLimit}</Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setQuizSettings(prev => ({ 
                    ...prev, 
                    timeLimit: Math.min(120, prev.timeLimit + 5) 
                  }))}
                >
                  <Text style={styles.modalButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Show Explanations */}
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Show Explanations</Text>
              <Switch
                value={quizSettings.showExplanations}
                onValueChange={(value) => setQuizSettings(prev => ({ 
                  ...prev, 
                  showExplanations: value 
                }))}
                trackColor={{ false: theme.muted, true: theme.primary }}
                thumbColor={theme.background}
              />
            </View>

            {/* Difficulty */}
            <View style={[styles.modalRow, styles.modalRowLast]}>
              <Text style={styles.modalLabel}>Difficulty</Text>
              <View style={styles.modalButtons}>
                {(['easy', 'normal', 'hard'] as const).map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.modalButton,
                      quizSettings.difficulty === level && styles.modalButtonActive
                    ]}
                    onPress={() => setQuizSettings(prev => ({ 
                      ...prev, 
                      difficulty: level 
                    }))}
                  >
                    <Text style={[
                      styles.modalButtonText,
                      ...(quizSettings.difficulty === level ? [styles.modalButtonTextActive] : [])
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: theme.muted }]}
                onPress={() => setSettingsVisible(false)}
              >
                <Text style={[styles.modalActionText, { color: theme.foreground }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: theme.primary }]}
                onPress={() => setSettingsVisible(false)}
              >
                <Text style={styles.modalActionText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TopicInfoScreen; 