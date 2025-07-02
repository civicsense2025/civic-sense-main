import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { GuestLimitService } from '../../lib/services/guest-limit-service';
import { OfflineSessionManager } from '../../lib/offline/offline-session-manager';
import { GUEST_LIMITS } from '../../lib/mobile-constants';
import { spacing, borderRadius, typography, responsiveFontSizes } from '../../lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface GuestProgressData {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in minutes
  categoriesExplored: string[];
  currentStreak: number;
  assessmentsStarted: number;
  civicsTestProgress: number;
  attemptsRemaining: number;
  daysUntilDataLoss: number;
  lastActivity: Date;
}

interface GuestProgressWidgetProps {
  guestToken?: string;
  onSignupPress?: () => void;
  compact?: boolean;
  style?: any;
}

// ============================================================================
// GUEST PROGRESS WIDGET COMPONENT
// ============================================================================

export function GuestProgressWidget({ 
  guestToken, 
  onSignupPress,
  compact = false,
  style 
}: GuestProgressWidgetProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [progressData, setProgressData] = useState<GuestProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Don't show for authenticated users
  if (user) {
    return null;
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadGuestProgress = useCallback(async () => {
    if (!guestToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get usage limits and session data
      const [usageLimits, allSessions] = await Promise.all([
        GuestLimitService.getUsageLimits(guestToken),
        loadAllGuestSessions(guestToken),
        loadGuestAnalytics(guestToken)
      ]);

      // Calculate comprehensive progress data
      const progressData: GuestProgressData = {
        totalQuizzes: allSessions.length,
        totalQuestions: allSessions.reduce((sum, session) => sum + (session.questions?.length || 0), 0),
        correctAnswers: calculateCorrectAnswers(allSessions),
        timeSpent: calculateTimeSpent(allSessions),
        categoriesExplored: extractUniqueCategories(allSessions),
        currentStreak: calculateLearningStreak(allSessions),
        assessmentsStarted: allSessions.filter(s => s.session_type === 'assessment').length,
        civicsTestProgress: calculateCivicsTestProgress(allSessions),
        attemptsRemaining: GUEST_LIMITS.DAILY_QUIZ_ATTEMPTS - usageLimits.dailyQuizAttempts,
        daysUntilDataLoss: GUEST_LIMITS.MAX_PROGRESS_STORAGE_DAYS - getDaysSinceFirstSession(allSessions),
        lastActivity: getLastActivity(allSessions),
      };

      // Only show if user has meaningful progress
      const hasSignificantProgress = 
        progressData.totalQuizzes > 0 || 
        progressData.assessmentsStarted > 0 ||
        progressData.totalQuestions > 3;

      if (hasSignificantProgress) {
        setProgressData(progressData);
        setIsVisible(true);
        animateIn();
      }

    } catch (error) {
      console.error('Error loading guest progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [guestToken]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const loadAllGuestSessions = async (token: string) => {
    try {
      const offlineManager = new OfflineSessionManager();
      const sessionsObject = await offlineManager.getAllProgressSessions();
      
      // Convert object to array of sessions, then filter for this guest token
      const sessionsArray = Object.values(sessionsObject || {});
      return sessionsArray.filter(session => session.guest_token === token);
    } catch (error) {
      console.error('Error loading guest sessions:', error);
      return [];
    }
  };

  const loadGuestAnalytics = async (token: string) => {
    try {
      // Load additional analytics from AsyncStorage
      const analyticsKey = `guest_analytics_${token}`;
      const stored = await AsyncStorage.getItem(analyticsKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading guest analytics:', error);
      return {};
    }
  };

  const calculateCorrectAnswers = (sessions: any[]) => {
    let correct = 0;
    sessions.forEach(session => {
      if (session.answers && session.questions) {
        Object.entries(session.answers).forEach(([questionIndex, answer]) => {
          const question = session.questions[parseInt(questionIndex)];
          if (question && question.correct_answer === answer) {
            correct++;
          }
        });
      }
    });
    return correct;
  };

  const calculateTimeSpent = (sessions: any[]) => {
    const totalMs = sessions.reduce((sum, session) => {
      if (session.started_at && session.last_updated_at) {
        const start = new Date(session.started_at).getTime();
        const end = new Date(session.last_updated_at).getTime();
        return sum + (end - start);
      }
      return sum;
    }, 0);
    return Math.round(totalMs / (1000 * 60)); // Convert to minutes
  };

  const extractUniqueCategories = (sessions: any[]) => {
    const categories = new Set<string>();
    sessions.forEach(session => {
      if (session.metadata?.category) {
        categories.add(session.metadata.category);
      }
      if (session.topic_id) {
        // Add topic-based category inference
        categories.add('Democratic Participation'); // Default category
      }
    });
    return Array.from(categories);
  };

  const calculateLearningStreak = (sessions: any[]) => {
    if (sessions.length === 0) return 0;
    
    // Calculate consecutive days with activity
    const activityDates = sessions
      .map(s => new Date(s.started_at).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    const today = new Date().toDateString();
    
    for (let i = 0; i < activityDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (activityDates[i] === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateCivicsTestProgress = (sessions: any[]) => {
    const civicsSession = sessions.find(s => s.session_type === 'civics_test');
    if (!civicsSession) return 0;
    
    const answered = Object.keys(civicsSession.answers || {}).length;
    const total = civicsSession.questions?.length || 1;
    return Math.round((answered / total) * 100);
  };

  const getDaysSinceFirstSession = (sessions: any[]) => {
    if (sessions.length === 0) return 0;
    
    const firstSession = sessions.reduce((earliest, session) => {
      const sessionDate = new Date(session.started_at);
      const earliestDate = new Date(earliest.started_at);
      return sessionDate < earliestDate ? session : earliest;
    });
    
    const daysDiff = Math.floor(
      (Date.now() - new Date(firstSession.started_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return Math.max(0, daysDiff);
  };

  const getLastActivity = (sessions: any[]) => {
    if (sessions.length === 0) return new Date();
    
    const latest = sessions.reduce((latest, session) => {
      const sessionDate = new Date(session.last_updated_at);
      const latestDate = new Date(latest.last_updated_at);
      return sessionDate > latestDate ? session : latest;
    });
    
    return new Date(latest.last_updated_at);
  };

  // ============================================================================
  // ANIMATIONS
  // ============================================================================

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();

    // Start pulsing animation for urgency
    startPulseAnimation();
  };

  const startPulseAnimation = () => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start(() => pulse());
    };
    pulse();
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSignupPress = () => {
    if (onSignupPress) {
      onSignupPress();
    } else {
      // Track conversion intent
      trackConversionIntent();
      
      // Navigate to signup with progress preservation context
      router.push('/auth/signup?preserveProgress=true');
    }
  };

  const handleDetailedView = () => {
    Alert.alert(
      'Your Civic Learning Journey',
      `You've answered ${progressData?.totalQuestions} questions across ${progressData?.categoriesExplored.length} topics, maintaining a ${progressData?.currentStreak}-day streak. Sign up to save this progress permanently!`,
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Sign Up Now', onPress: handleSignupPress }
      ]
    );
  };

  const trackConversionIntent = async () => {
    try {
      const analyticsData = {
        event: 'guest_conversion_intent',
        timestamp: new Date().toISOString(),
        progress_data: progressData,
        source: 'homescreen_widget'
      };
      
      await AsyncStorage.setItem(
        `conversion_intent_${guestToken}`, 
        JSON.stringify(analyticsData)
      );
    } catch (error) {
      console.error('Error tracking conversion intent:', error);
    }
  };

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  useEffect(() => {
    if (guestToken) {
      loadGuestProgress();
    }
  }, [guestToken, loadGuestProgress]);

  // ============================================================================
  // RENDER CONDITIONS
  // ============================================================================

  if (isLoading || !isVisible || !progressData) {
    return null;
  }

  // ============================================================================
  // RENDER VARIANTS
  // ============================================================================

  if (compact) {
    return (
      <Animated.View
        style={[
          styles.compactContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: pulseAnim }
            ]
          },
          style
        ]}
      >
        <LinearGradient
          colors={[theme.primary + '15', theme.primary + '05']}
          style={styles.compactGradient}
        >
          <View style={styles.compactContent}>
            <View style={styles.compactStats}>
              <Text style={[styles.compactNumber, { color: theme.primary }]}>
                {progressData.totalQuizzes}
              </Text>
              <Text style={[styles.compactLabel, { color: theme.foregroundSecondary }]}>
                quizzes completed
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.compactButton, { backgroundColor: theme.primary }]}
              onPress={handleSignupPress}
              activeOpacity={0.8}
            >
              <Text style={styles.compactButtonText}>Save Progress</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  // ============================================================================
  // FULL WIDGET RENDER
  // ============================================================================

  const accuracyPercentage = progressData.totalQuestions > 0 
    ? Math.round((progressData.correctAnswers / progressData.totalQuestions) * 100)
    : 0;

  const progressValue = Math.min(progressData.totalQuizzes / 5, 1); // Progress toward 5 quizzes

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: pulseAnim }
          ]
        },
        style
      ]}
    >
      <LinearGradient
        colors={[theme.primary + '10', theme.background]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerEmoji, { color: theme.primary }]}>
              📈
            </Text>
            <View>
              <Text style={[styles.headerTitle, { color: theme.foreground }]}>
                Your Civic Progress
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.foregroundSecondary }]}>
                {progressData.daysUntilDataLoss} days until data expires
              </Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={handleDetailedView}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Progress Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>
              {progressData.totalQuizzes}
            </Text>
            <Text style={[styles.statLabel, { color: theme.foregroundSecondary }]}>
              Quizzes
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>
              {accuracyPercentage}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.foregroundSecondary }]}>
              Accuracy
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>
              {progressData.currentStreak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.foregroundSecondary }]}>
              Day Streak
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>
              {progressData.categoriesExplored.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.foregroundSecondary }]}>
              Topics
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: theme.foreground }]}>
              Learning Progress
            </Text>
            <Text style={[styles.progressPercent, { color: theme.primary }]}>
              {Math.round(progressValue * 100)}%
            </Text>
          </View>
          
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary,
                  width: `${progressValue * 100}%`
                }
              ]}
            />
          </View>
        </View>

        {/* Urgency & CTA Section */}
        <View style={styles.ctaSection}>
          <View style={styles.urgencyBadge}>
            <Ionicons name="time" size={16} color="#F59E0B" />
            <Text style={[styles.urgencyText, { color: '#F59E0B' }]}>
              {progressData.attemptsRemaining} attempts remaining today
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.signupButton, { backgroundColor: theme.primary }]}
            onPress={handleSignupPress}
            activeOpacity={0.8}
          >
            <Text style={styles.signupButtonText}>
              Sign Up to Save Progress
            </Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </TouchableOpacity>
          
          <Text style={[styles.benefitsText, { color: theme.foregroundSecondary }]}>
            Unlock unlimited access, detailed analytics, and save your civic learning journey forever
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  
  gradient: {
    padding: spacing.lg,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  
  headerEmoji: {
    fontSize: responsiveFontSizes.emojiLarge,
    fontWeight: 'bold',
  },
  
  headerTitle: {
    ...typography.callout,
    fontWeight: '600',
  },
  
  headerSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statNumber: {
    ...typography.title2,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  
  statLabel: {
    ...typography.caption,
    textAlign: 'center',
  },
  
  progressSection: {
    marginBottom: spacing.lg,
  },
  
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  
  progressTitle: {
    ...typography.callout,
    fontWeight: '500',
  },
  
  progressPercent: {
    ...typography.callout,
    fontWeight: '600',
  },
  
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  ctaSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.full,
  },
  
  urgencyText: {
    ...typography.caption,
    fontWeight: '500',
  },
  
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    width: '100%',
  },
  
  signupButtonText: {
    ...typography.callout,
    fontWeight: '600',
    color: 'white',
  },
  
  benefitsText: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.sm,
  },
  
  // Compact styles
  compactContainer: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  
  compactGradient: {
    padding: spacing.md,
  },
  
  compactContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  compactStats: {
    alignItems: 'flex-start',
  },
  
  compactNumber: {
    ...typography.title3,
    fontWeight: 'bold',
  },
  
  compactLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  
  compactButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  
  compactButtonText: {
    ...typography.footnote,
    fontWeight: '600',
    color: 'white',
  },
});

export default GuestProgressWidget; 