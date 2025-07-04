/**
 * Simplified TopicInfoScreen Component
 * 
 * Displays topic information with "Why This Matters" content
 * with enhanced animations and source submission functionality.
 */

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../atoms/Text';
import { Card } from './Card';
import { LoadingSpinner } from '../molecules/LoadingSpinner';
import { BookmarkButton } from './BookmarkButton';
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
  type StandardQuestion,
} from '../../lib/standardized-data-service';
import { parseWhyThisMatters, parseSourceContent } from '../../lib/html-utils';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ParsedBlurb {
  title: string;
  content: string;
  emoji: string;
}

interface SimpleTopicInfoScreenProps {
  topicId?: string;
  onStartQuiz?: () => void;
  showStartButton?: boolean;
}

// Animated card component for scroll-triggered animations
const AnimatedWhyThisMattersCard: React.FC<{
  blurb: ParsedBlurb;
  index: number;
  onLayout: (index: number, yPosition: number) => void;
}> = ({ blurb, index, onLayout }) => {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const [isVisible, setIsVisible] = useState(false);

  const startAnimation = useCallback(() => {
    if (!isVisible) {
      setIsVisible(true);
      try {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            delay: index * 150,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 500,
            delay: index * 150,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (error) {
        console.warn(`Animation error for blurb ${index + 1}:`, error);
        // Fallback: make card visible without animation
        opacity.setValue(1);
        translateY.setValue(0);
      }
    }
  }, [isVisible, opacity, translateY, index]);

  const handleLayout = (event: any) => {
    const { y } = event.nativeEvent.layout;
    onLayout(index, y);
  };

  useEffect(() => {
    // Auto-start animation for all cards with staggered timing
    const timer = setTimeout(() => startAnimation(), 300 + (index * 150));
    return () => clearTimeout(timer);
  }, [index, startAnimation]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        backgroundColor: theme.card,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: Platform.OS === 'ios' ? 1 : 1.5,
        borderColor: theme.border,
        ...shadows.card,
      }}
      onLayout={handleLayout}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
      }}>
        <Text style={{
          fontSize: 24,
          marginRight: spacing.sm,
          marginTop: 2,
        }}>
          {blurb.emoji}
        </Text>
        <Text style={{
          fontSize: typography.headline.fontSize,
          fontWeight: '500',
          color: theme.foreground,
          fontFamily: fontFamily.display,
          flex: 1,
          lineHeight: typography.headline.lineHeight,
        }}>
          {blurb.title}
        </Text>
      </View>
      <Text style={{
        fontSize: typography.body.fontSize,
        color: theme.foregroundSecondary,
        fontFamily: fontFamily.text,
        lineHeight: typography.body.lineHeight,
        marginLeft: 36,
      }}>
        {blurb.content}
      </Text>
    </Animated.View>
  );
};

// Animated source card component - separate component to avoid hooks violations
const AnimatedSourceCard: React.FC<{
  metadata: {
    name: string;
    domain: string | null;
    url: string | null;
    cleanContent: string;
    count: number;
    originalSources: string[];
  };
  index: number;
  theme: any;
  spacing: any;
  borderRadius: any;
  shadows: any;
  typography: any;
  fontFamily: any;
}> = ({ metadata, index, theme, spacing, borderRadius, shadows, typography, fontFamily }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, index]);

  const getPlatformSpacing = (size: number) => Platform.OS === 'ios' ? size : size * 1.1;
  const getResponsiveValue = (config: { mobile: number; small?: number; medium?: number; default: number }) => {
    const screenWidth = Dimensions.get('window').width;
    const deviceType = getDeviceType(screenWidth);
    switch (deviceType) {
      case 'mobile': return config.mobile;
      case 'small': return config.small || config.mobile;
      case 'medium': return config.medium || config.default;
      default: return config.default;
    }
  };

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        backgroundColor: theme.card,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: Platform.OS === 'ios' ? 1 : 1.5,
        borderColor: theme.border,
        ...shadows.card,
      }}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: getPlatformSpacing(spacing.sm),
      }}>
        <Text style={{
          fontSize: getResponsiveValue({
            mobile: 20,
            small: 24,
            default: 24,
          }),
          marginRight: getPlatformSpacing(spacing.sm),
          marginTop: 2,
        }}>
          🔗
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={{
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
          }} numberOfLines={2}>
            {metadata.name}
          </Text>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginTop: getPlatformSpacing(spacing.xs) 
          }}>
            {metadata.domain && (
              <Text style={{
                fontSize: getResponsiveValue({
                  mobile: typography.caption1.fontSize,
                  small: typography.footnote.fontSize,
                  default: typography.footnote.fontSize,
                }),
                marginLeft: 0,
                color: theme.primary,
                fontFamily: fontFamily.text,
                flex: 1,
              }}>
                {metadata.domain}
              </Text>
            )}
            {metadata.count > 1 && (
              <View style={{
                backgroundColor: theme.accent,
                paddingHorizontal: spacing.xs,
                paddingVertical: 2,
                borderRadius: borderRadius.xs,
                marginLeft: spacing.sm,
              }}>
                <Text style={{
                  fontSize: typography.caption1.fontSize,
                  color: theme.accentForeground,
                  fontWeight: '600',
                }}>
                  {metadata.count} refs
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      {metadata.cleanContent && metadata.cleanContent !== metadata.name && (
        <Text style={{
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
        }} numberOfLines={3}>
          {metadata.cleanContent.substring(0, 200)}
          {metadata.cleanContent.length > 200 ? '...' : ''}
        </Text>
      )}
      {metadata.url && (
        <TouchableOpacity
          onPress={() => Linking.openURL(metadata.url!)}
          style={{
            marginTop: spacing.sm,
            paddingVertical: spacing.xs,
          }}
        >
          <Text style={{
            fontSize: typography.footnote.fontSize,
            color: theme.primary,
            fontFamily: fontFamily.text,
            textDecorationLine: 'underline',
          }}>
            View Source →
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// Helper functions for responsive design
const getPlatformSpacing = (size: number) => Platform.OS === 'ios' ? size : size * 1.1;
const getResponsiveValue = (config: { mobile: number; small?: number; medium?: number; default: number }) => {
  const screenWidth = Dimensions.get('window').width;
  const deviceType = getDeviceType(screenWidth);
  switch (deviceType) {
    case 'mobile': return config.mobile;
    case 'small': return config.small || config.mobile;
    case 'medium': return config.medium || config.default;
    default: return config.default;
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SimpleTopicInfoScreen: React.FC<SimpleTopicInfoScreenProps> = ({
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

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [topic, setTopic] = useState<StandardTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'why-matters' | 'sources'>('overview');
  const [sources, setSources] = useState<string[]>([]);
  const [submitSourceUrl, setSubmitSourceUrl] = useState('');
  const [submittingSource, setSubmittingSource] = useState(false);

  // Animation refs for scroll-triggered animations
  const scrollViewRef = useRef<ScrollView>(null);
  const cardPositions = useRef<Map<number, number>>(new Map());
  const visibleCards = useRef<Set<number>>(new Set());

  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const screenHeight = Dimensions.get('window').height;
    
    cardPositions.current.forEach((cardY, index) => {
      if (cardY < scrollY + screenHeight * 0.8 && !visibleCards.current.has(index)) {
        visibleCards.current.add(index);
        // Trigger animation for this card
      }
    });
  }, []);

  const handleCardLayout = useCallback((index: number, yPosition: number) => {
    cardPositions.current.set(index, yPosition);
  }, []);

  // ============================================================================
  // RESPONSIVE STYLES - Memoized to prevent recreation on every render
  // ============================================================================

  const styles = useMemo(() => StyleSheet.create({
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
    header: {
      paddingHorizontal: getPlatformSpacing(spacing.lg),
      paddingTop: getPlatformSpacing(spacing.lg),
      paddingBottom: getPlatformSpacing(spacing.xl),
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: getPlatformSpacing(spacing.md),
    },
    topicInfo: {
      flex: 1,
      marginRight: getPlatformSpacing(spacing.md),
    },
    bookmarkButton: {
      marginTop: getPlatformSpacing(spacing.xs),
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
        mobile: typography.title1.fontSize,
        small: typography.titleLarge.fontSize,
        medium: 36,
        default: typography.titleLarge.fontSize,
      }),
      fontWeight: '600',
      color: theme.foreground,
      fontFamily: fontFamily.display,
      lineHeight: getResponsiveValue({
        mobile: typography.title1.lineHeight,
        small: typography.titleLarge.lineHeight,
        medium: 44,
        default: typography.titleLarge.lineHeight,
      }),
      marginBottom: getPlatformSpacing(spacing.lg),
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
      borderRadius: borderRadius.full, // Pill-shaped
      paddingVertical: getPlatformSpacing(spacing.lg), // Increased padding
      paddingHorizontal: getPlatformSpacing(spacing.xl),
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56, // Larger touch target
      ...shadows.button,
    },
    startQuizText: {
      color: theme.foreground,
      fontSize: getResponsiveValue({
        mobile: typography.headline.fontSize,
        small: typography.title3.fontSize,
        default: typography.title3.fontSize,
      }),
      fontWeight: '600',
      fontFamily: fontFamily.text,
    },
    tabsContainer: {
      paddingHorizontal: getPlatformSpacing(spacing.lg),
      marginBottom: getPlatformSpacing(spacing.lg),
    },
    tabsHeader: {
      flexDirection: 'row',
      backgroundColor: theme.muted,
      borderRadius: borderRadius.lg,
      padding: getPlatformSpacing(spacing.xs),
      gap: getPlatformSpacing(spacing.xs),
      alignSelf: 'flex-start',
    },
    tab: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getPlatformSpacing(spacing.md),
      paddingHorizontal: getPlatformSpacing(spacing.lg),
      borderRadius: borderRadius.full,
      minHeight: 48,
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
    submitSourcesContainer: {
      paddingHorizontal: getPlatformSpacing(spacing.lg),
      paddingVertical: getPlatformSpacing(spacing.xl),
      marginTop: getPlatformSpacing(spacing.xl),
    },
    submitSourcesCard: {
      borderRadius: borderRadius.lg,
      borderWidth: 2,
      borderColor: theme.border,
      borderStyle: 'dashed',
      padding: getPlatformSpacing(spacing.xl),
      backgroundColor: theme.muted,
      alignItems: 'center',
    },
    submitSourcesTitle: {
      fontSize: typography.headline.fontSize,
      fontWeight: '600',
      color: theme.foreground,
      fontFamily: fontFamily.display,
      marginBottom: getPlatformSpacing(spacing.sm),
      textAlign: 'center',
    },
    submitSourcesDescription: {
      fontSize: typography.body.fontSize,
      color: theme.foregroundSecondary,
      fontFamily: fontFamily.text,
      textAlign: 'center',
      marginBottom: getPlatformSpacing(spacing.lg),
      lineHeight: typography.body.lineHeight,
    },
    sourceInput: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.full, // Pill-shaped
      paddingHorizontal: getPlatformSpacing(spacing.lg),
      paddingVertical: getPlatformSpacing(spacing.md),
      fontSize: typography.body.fontSize,
      color: theme.foreground,
      fontFamily: fontFamily.text,
      width: '100%',
      marginBottom: getPlatformSpacing(spacing.md),
    },
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: borderRadius.full, // Pill-shaped
      paddingVertical: getPlatformSpacing(spacing.md),
      paddingHorizontal: getPlatformSpacing(spacing.xl),
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      width: '100%',
    },
    submitButtonDisabled: {
      backgroundColor: theme.muted,
    },
    submitButtonText: {
      color: theme.foreground,
      fontSize: typography.callout.fontSize,
      fontWeight: '600',
      fontFamily: fontFamily.text,
    },
    submitButtonTextDisabled: {
      color: theme.foregroundTertiary,
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
      borderRadius: borderRadius.full, // Pill-shaped
      paddingVertical: getPlatformSpacing(spacing.md),
      paddingHorizontal: getPlatformSpacing(spacing.lg),
      minHeight: 48,
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
    noQuestionsText: {
      fontSize: getResponsiveValue({
        mobile: typography.footnote.fontSize,
        small: typography.body.fontSize,
        default: typography.body.fontSize,
      }),
      fontFamily: fontFamily.text,
      textAlign: 'center',
      marginTop: getPlatformSpacing(spacing.sm),
      paddingHorizontal: getPlatformSpacing(spacing.lg),
      lineHeight: getResponsiveValue({
        mobile: typography.footnote.lineHeight,
        small: typography.body.lineHeight,
        default: typography.body.lineHeight,
      }),
    },
    // Category badge styles (same as index.tsx)
    categoriesContainer: {
      marginBottom: getPlatformSpacing(spacing.sm),
    },
    categoriesWrapper: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: getPlatformSpacing(spacing.xs),
    },
    categoryBadge: {
      paddingHorizontal: getPlatformSpacing(spacing.sm),
      paddingVertical: getPlatformSpacing(spacing.xs),
      borderRadius: borderRadius.sm,
      borderWidth: 1,
    },
    categoryBadgeText: {
      fontFamily: fontFamily.mono,
      fontSize: 11,
      fontWeight: '400',
      letterSpacing: 0.2,
    },
    // Start quiz button disabled state
    startQuizButtonDisabled: {
      backgroundColor: theme.muted,
      opacity: 0.6,
    },
  }), [theme, spacing, borderRadius, typography, fontFamily, shadows]);

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

      console.log(`📖 SimpleTopicInfoScreen: Loading data for topic ${topicId}`);

      // Load topic information
      const dataService = new StandardizedDataService();
      const topicResponse = await dataService.fetchTopicById(topicId!, { useCache: true });
      
      if (topicResponse.error) {
        // Handle specific error types more gracefully
        if (topicResponse.error.code === 'NOT_FOUND') {
          throw new Error(`Topic not found. This topic may have been moved or removed.`);
        } else {
          throw new Error(topicResponse.error.message);
        }
      }

      if (!topicResponse.data) {
        throw new Error('Topic not found. This topic may have been moved or removed.');
      }

      setTopic(topicResponse.data);

      // Load questions for enhanced sources processing
      try {
        const questionsResponse = await fetchQuestions(topicId!, { 
          limit: 50, // Get more questions to aggregate all sources
          useCache: true 
        });
        
        if (!questionsResponse.error && questionsResponse.data) {
          console.log(`📚 Processing ${questionsResponse.data.length} questions for sources`);
          
          // Enhanced JSONB sources processing
          const processedSources: string[] = [];
          
          questionsResponse.data.forEach((question, questionIndex) => {
            const questionNumber = question.question_number || (questionIndex + 1);
            
            console.log(`📋 Processing question ${questionNumber} sources:`, {
              hasSource: !!question.sources,
              sourceType: typeof question.sources,
              sourceLength: Array.isArray(question.sources) ? question.sources.length : 'N/A'
            });

            if (question.sources) {
              let sourcesToProcess: any[] = [];

              // Handle different JSONB source formats
              if (Array.isArray(question.sources)) {
                sourcesToProcess = question.sources;
              } else if (typeof question.sources === 'object' && question.sources !== null) {
                sourcesToProcess = [question.sources];
              } else if (typeof question.sources === 'string') {
                const sourceString = question.sources.trim();
                
                // Try to parse as JSON first
                try {
                  const parsed = JSON.parse(sourceString);
                  if (Array.isArray(parsed)) {
                    sourcesToProcess = parsed;
                  } else if (typeof parsed === 'object') {
                    sourcesToProcess = [parsed];
                  }
                } catch {
                  // Not JSON, treat as comma-separated URLs or single URL
                  if (sourceString.includes(',')) {
                    sourcesToProcess = sourceString.split(',').map(url => url.trim()).filter(url => url);
                  } else if (sourceString.startsWith('http')) {
                    sourcesToProcess = [sourceString];
                  }
                }
              }

              console.log(`📖 Question ${questionNumber} has ${sourcesToProcess.length} sources to process`);

              sourcesToProcess.forEach((source: any) => {
                if (source && typeof source === 'object') {
                  // Handle object sources
                  const url = source.url || source.link || source.href || '';
                  const name = source.name || source.title || url;
                  if (url) {
                    processedSources.push(JSON.stringify(source));
                    console.log(`✅ Added object source: ${name} (${url})`);
                  }
                } else if (typeof source === 'string' && source.trim() !== '') {
                  // Handle string sources
                  processedSources.push(source.trim());
                  console.log(`✅ Added string source: ${source.trim().substring(0, 50)}...`);
                }
              });
            }
          });

          setSources(processedSources);
          console.log(`✅ Total sources processed: ${processedSources.length}`);
        }
      } catch (sourcesError) {
        console.warn('Failed to load sources:', sourcesError);
        setSources([]);
      }

    } catch (error) {
      console.error('Error loading topic data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load topic');
    } finally {
      setLoading(false);
    }
  };

  // Parse why this matters content into structured blurbs
  const blurbs = useMemo(() => {
    if (!topic?.why_this_matters) return [];
    
    try {
      return parseWhyThisMatters(topic.why_this_matters);
    } catch (error) {
      console.warn('Failed to parse why_this_matters:', error);
      return [];
    }
  }, [topic?.why_this_matters]);

  // Enhanced source metadata processing with aggregation
  const sourceMetadata = useMemo(() => {
    if (sources.length === 0) return { sourceMap: new Map(), uniqueCount: 0 };
    
    const sourceMap = new Map<string, {
      name: string;
      domain: string | null;
      url: string | null;
      cleanContent: string;
      count: number;
      originalSources: string[];
    }>();
    
    sources.forEach((source) => {
      // Skip undefined, null, or empty sources
      if (!source || typeof source !== 'string' || source.trim().length === 0) {
        return;
      }

      try {
        const parsed = parseSourceContent(source);
        const key = parsed.url || parsed.name;
        
        if (sourceMap.has(key)) {
          const existing = sourceMap.get(key)!;
          existing.count += 1;
          existing.originalSources.push(source);
        } else {
          sourceMap.set(key, {
            name: parsed.name,
            domain: parsed.domain,
            url: parsed.url,
            cleanContent: parsed.cleanContent,
            count: 1,
            originalSources: [source]
          });
        }
      } catch (error) {
        console.warn('Failed to parse source:', source, error);
        // Add as fallback only if source is a valid string
        if (source && typeof source === 'string') {
          const key = source.length > 50 ? source.substring(0, 50) : source;
          sourceMap.set(key, {
            name: 'Unknown Source',
            domain: null,
            url: null,
            cleanContent: source,
            count: 1,
            originalSources: [source]
          });
        }
      }
    });
    
    return { sourceMap, uniqueCount: sourceMap.size };
  }, [sources]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartQuiz = () => {
    if (onStartQuiz) {
      onStartQuiz();
    } else if (topicId) {
              router.push(`/quiz-session/${topicId}` as any);
    }
  };

  const handleSubmitSource = async () => {
    if (!submitSourceUrl.trim() || !user || !topicId) return;

    // Basic URL validation
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(submitSourceUrl.trim())) {
      Alert.alert('Invalid URL', 'Please enter a valid URL starting with http:// or https://');
      return;
    }

    setSubmittingSource(true);
    try {
      // Here you would typically send the source to your backend
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      Alert.alert(
        'Source Submitted! 🙏',
        'Thank you for contributing to our knowledge base. We\'ll review your source and add it if it meets our quality standards.',
        [{ text: 'Great!', onPress: () => setSubmitSourceUrl('') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit source. Please try again.');
    } finally {
      setSubmittingSource(false);
    }
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderTabHeader = () => (
    <View style={styles.tabsContainer}>
      <View style={styles.tabsHeader}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
          activeOpacity={0.7}
        >
                      <Text style={[
              styles.tabText,
              ...(activeTab === 'overview' ? [styles.tabTextActive] : [])
            ]}>
              {`📖 Overview`}
            </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'why-matters' && styles.tabActive]}
          onPress={() => setActiveTab('why-matters')}
          activeOpacity={0.7}
        >
                      <Text style={[
              styles.tabText,
              ...(activeTab === 'why-matters' ? [styles.tabTextActive] : [])
            ]}>
              {`💡 Why This Matters`}
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
              {`📄 Sources`}
            </Text>
            {sourceMetadata.uniqueCount > 0 && (
              <View style={{
                backgroundColor: theme.accent,
                paddingHorizontal: spacing.xs,
                paddingVertical: 2,
                borderRadius: borderRadius.xs,
                marginLeft: spacing.xs,
              }}>
                <Text style={{
                  fontSize: typography.caption1.fontSize * 0.9,
                  color: theme.accentForeground,
                  fontWeight: '600',
                }}>
                  {sourceMetadata.uniqueCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOverviewContent = () => (
    <View style={styles.contentContainer}>
      <Card style={styles.blurbCard} variant="outlined">
        <View style={styles.blurbHeader}>
          <Text style={styles.blurbEmoji}>📖</Text>
          <Text style={styles.blurbTitle}>Topic Overview</Text>
        </View>
        <Text style={styles.blurbContent}>
          {topic?.description || 'This topic covers important aspects of civic knowledge and democratic participation.'}
        </Text>
      </Card>
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
          <AnimatedWhyThisMattersCard
            key={`blurb-${index}-${blurb.title.substring(0, 20)}`} // More unique key
            blurb={blurb}
            index={index}
            onLayout={handleCardLayout}
          />
        ))}
        

      </View>
    );
  };

  const renderSourcesContent = () => {
    const { sourceMap, uniqueCount } = sourceMetadata;
    
    if (uniqueCount === 0) {
      return (
        <View style={styles.contentContainer}>
          <Card style={styles.blurbCard} variant="outlined">
            <View style={styles.blurbHeader}>
              <Text style={styles.blurbEmoji}>📄</Text>
              <Text style={styles.blurbTitle}>Sources & Citations</Text>
            </View>
            <Text style={styles.blurbContent}>
              Sources and citations for this topic's questions will appear here. Start the quiz to explore the referenced materials and learn more about the information sources.
            </Text>
          </Card>
        </View>
      );
    }

    const sortedSources = Array.from(sourceMap.entries()).sort(([, a], [, b]) => b.count - a.count);

    return (
      <View style={styles.contentContainer}>
        <Card style={styles.blurbCard} variant="outlined">
          <View style={styles.blurbHeader}>
            <Text style={styles.blurbEmoji}>📊</Text>
            <Text style={styles.blurbTitle}>Sources Overview</Text>
          </View>
          <Text style={styles.blurbContent}>
            {`This quiz references ${uniqueCount} unique source${uniqueCount !== 1 ? 's' : ''} across ${sources.length} question${sources.length !== 1 ? 's' : ''}.`}
          </Text>
        </Card>
        
        {sortedSources.map(([key, metadata], index) => (
          <AnimatedSourceCard
            key={`source-${index}-${key.substring(0, 20)}`}
            metadata={metadata}
            index={index}
            theme={theme}
            spacing={spacing}
            borderRadius={borderRadius}
            shadows={shadows}
            typography={typography}
            fontFamily={fontFamily}
          />
        ))}
        
        <Card style={styles.blurbCard} variant="outlined">
          <View style={styles.blurbHeader}>
            <Text style={styles.blurbEmoji}>ℹ️</Text>
            <Text style={styles.blurbTitle}>About These Sources</Text>
          </View>
          <Text style={styles.blurbContent}>
            These sources are carefully selected from authoritative government websites, educational institutions, and established civic organizations to ensure accuracy and reliability.
          </Text>
        </Card>
        
        {/* Suggest a Source Section */}
        <Card style={styles.blurbCard} variant="outlined">
          <View style={styles.blurbHeader}>
            <Text style={styles.blurbEmoji}>📤</Text>
            <Text style={styles.blurbTitle}>Suggest a Source</Text>
          </View>
          <Text style={styles.blurbContent}>
            Know of a reliable source that should be included for this topic? Share it with us to help improve our educational content.
          </Text>
          
          <View style={{ marginTop: spacing.md }}>
            <TextInput
              style={[styles.sourceInput, {
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.foreground,
                marginBottom: spacing.sm,
              }]}
              value={submitSourceUrl}
              onChangeText={setSubmitSourceUrl}
              placeholder="https://example.com/article"
              placeholderTextColor={theme.foregroundTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleSubmitSource}
            />
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: (!submitSourceUrl.trim() || submittingSource) 
                    ? theme.muted 
                    : theme.primary
                }
              ]}
              onPress={handleSubmitSource}
              disabled={!submitSourceUrl.trim() || submittingSource}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.submitButtonText,
                {
                  color: (!submitSourceUrl.trim() || submittingSource)
                    ? theme.foregroundTertiary
                    : theme.foreground
                }
              ]}>
                {submittingSource ? 'Submitting...' : 'Submit Source'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    );
  };

  const renderSubmitSourcesSection = () => (
    <View style={styles.submitSourcesContainer}>
      <View style={styles.submitSourcesCard}>
        <Text style={styles.submitSourcesTitle}>
          📤 Suggest a Source
        </Text>
        <Text style={styles.submitSourcesDescription}>
          Know of a reliable source that should be included for this topic? Share it with us to help improve our educational content.
        </Text>
        
        <TextInput
          style={styles.sourceInput}
          value={submitSourceUrl}
          onChangeText={setSubmitSourceUrl}
          placeholder="https://example.com/article"
          placeholderTextColor={theme.foregroundTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          onSubmitEditing={handleSubmitSource}
        />
        
        <TouchableOpacity
          style={[
            styles.submitButton,
            ...(!submitSourceUrl.trim() || submittingSource ? [styles.submitButtonDisabled] : [])
          ]}
          onPress={handleSubmitSource}
          disabled={!submitSourceUrl.trim() || submittingSource}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.submitButtonText,
            ...(!submitSourceUrl.trim() || submittingSource ? [styles.submitButtonTextDisabled] : [])
          ]}>
            {submittingSource ? 'Submitting...' : 'Submit Source'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Enhanced category processing to extract all categories from JSONB field
  const processedCategories = useMemo(() => {
    if (!topic?.categories) return [];
    
    try {
      // Handle different category data structures
      let categories = topic.categories;
      
      // If it's a string, try to parse as JSON
      if (typeof categories === 'string') {
        categories = JSON.parse(categories);
      }
      
      // Ensure it's an array
      if (!Array.isArray(categories)) {
        categories = [categories];
      }
      
      // Process each category to extract text
      return categories.map((category: any, index: number) => {
        if (typeof category === 'string') {
          return category;
        } else if (typeof category === 'object' && category !== null) {
          return category.name || category.title || category.category_name || String(category);
        }
        return String(category);
      }).filter(Boolean);
    } catch (error) {
      console.warn('Error processing categories:', error);
      return topic.category?.name ? [topic.category.name] : ['General'];
    }
  }, [topic?.categories, topic?.category]);

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
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || 'Topic not found'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTopicData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Topic Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.topicInfo}>
              <Text style={styles.topicEmoji}>
                {topic.emoji || '📖'}
              </Text>
              <Text style={styles.topicTitle}>
                {topic.title}
              </Text>
            </View>
            
            {/* Bookmark Button */}
            <BookmarkButton
              contentId={topicId!}
              contentType="topic"
              title={topic.title}
              description={topic.description || ''}
              size="large"
              style={styles.bookmarkButton}
              testID="topic-bookmark-button"
            />
          </View>
          
          {/* Categories and Meta Information */}
          <View style={styles.topicMeta}>
            {/* Category badges using the same styling as index.tsx */}
            {processedCategories.length > 0 && (
              <View style={styles.categoriesContainer}>
                <View style={styles.categoriesWrapper}>
                  {processedCategories.map((categoryText, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.categoryBadge, 
                        { 
                          backgroundColor: theme.primary + '10', 
                          borderColor: theme.primary + '20' 
                        }
                      ]}
                    >
                      <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>
                        {categoryText}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Question count */}
            <View style={styles.metaItem}>
              <Text style={styles.metaText}>❓</Text>
              <Text style={styles.metaText}>
                {`${topic.question_count || 0} questions`}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        {renderTabHeader()}

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewContent()}
        {activeTab === 'why-matters' && renderWhyMattersContent()}
        {activeTab === 'sources' && renderSourcesContent()}

        {/* Start Quiz Section - Moved to Bottom */}
        {showStartButton && (
          <View style={styles.startQuizContainer}>
            <TouchableOpacity
              style={[
                styles.startQuizButton,
                { backgroundColor: theme.primary },
                topic.question_count === 0 && styles.startQuizButtonDisabled
              ]}
              onPress={handleStartQuiz}
              activeOpacity={0.8}
              disabled={topic.question_count === 0}
            >
              <Text style={[styles.startQuizText, { color: theme.foreground || '#FFFFFF' }]}>
                {topic.question_count === 0 ? 'No Questions Available' : `Start Quiz (${topic.question_count || 0} questions)`}
              </Text>
            </TouchableOpacity>
            
            {topic.question_count === 0 && (
              <Text style={[styles.noQuestionsText, { color: theme.foregroundSecondary }]}>
                {`This topic is being prepared. Try the Civics Test or browse other topics.`}
              </Text>
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

export default SimpleTopicInfoScreen; 