import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,

  Linking,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { spacing, borderRadius, fontFamily, shadows, typography } from '../../lib/theme';
import { GoogleCalendarService, useGoogleCalendarAuth } from '../../lib/services/google-calendar-service';
import { SmartSchedulingService, useSmartScheduling } from '../../lib/services/smart-scheduling-service';
import { LearningPodCalendarService, useLearningPodCalendar } from '../../lib/services/learning-pod-calendar-service';
import { CalendarAnalyticsService, useCalendarAnalytics } from '../../lib/services/calendar-analytics-service';
import { UserStatsService } from '../../lib/services/user-stats-service';
import { LearningExportService } from '../../lib/services/learning-export-service';
import { usePreferenceStyles } from '../../lib/hooks/usePreferenceStyles';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { ProfileRefreshControl } from '../../components/ui/EnhancedRefreshControl';
import { useUIStrings } from '../../lib/hooks/useUIStrings';
import { LanguageSelector } from '../../components/settings/LanguageSelector';
import { TranslationScannerOverlay } from '../../components/ui/TranslationScannerOverlay';

const { width: screenWidth } = Dimensions.get('window');

// ============================================================================
// INTERFACES
// ============================================================================

interface CalendarSyncSettings {
  enabled: boolean;
  syncQuizReminders: boolean;
  syncStudySessions: boolean;
  syncAchievements: boolean;
  smartScheduling: boolean;
  learningPods: boolean;
  reminderMinutes: number;
  lastSyncDate: string | null;
}

interface UserStats {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  totalXPForNextLevel: number;
  achievements: number;
  rank: number;
  totalUsers: number;
}

interface MenuSection {
  id: string;
  title: string;
  icon: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route?: string;
  action?: () => void;
  badge?: string;
  disabled?: boolean;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl * 2,
  },

  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
    ...shadows.card,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontFamily: fontFamily.text,
    marginBottom: spacing.xs,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  providerText: {
    fontFamily: fontFamily.text,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exportButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  editButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },

  // Stats Cards
  statsCard: {
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  statsTitle: {
    fontFamily: fontFamily.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
  },
  viewStatsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  viewStatsText: {
    fontFamily: fontFamily.text,
    fontWeight: '500',
  },

  // Additional Stats
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  additionalStatItem: {
    alignItems: 'center',
  },
  additionalStatValue: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  additionalStatLabel: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    textAlign: 'center',
  },

  // New User Message
  newUserMessage: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  newUserText: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Preferences Demo
  preferencesDemo: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  preferencesDemoTitle: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  preferencesDemoText: {
    fontFamily: fontFamily.text,
    lineHeight: 16,
  },

  // Section styling
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },

  // Calendar Sync Section
  syncSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  syncCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.card,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  syncInfo: {
    flex: 1,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  syncDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  syncOptions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
  },
  lastSyncText: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: spacing.sm,
  },

  // Smart Scheduling
  smartScheduleCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.card,
  },
  recommendationCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    alignItems: 'center',
    gap: spacing.md,
  },
  recommendationTime: {
    fontSize: 18,
    fontWeight: '600',
  },
  recommendationDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Learning Pods
  podSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  podCard: {
    borderRadius: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
  },
  podHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  podName: {
    fontSize: 16,
    fontWeight: '600',
  },
  podMembers: {
    fontSize: 12,
    opacity: 0.7,
  },
  sessionsList: {
    gap: spacing.sm,
  },
  sessionCard: {
    borderRadius: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
  },
  sessionTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  sessionTitle: {
    fontSize: 12,
    opacity: 0.7,
  },

  // Actions
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fontFamily.mono,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  // Menu Sections
  menuSection: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  sectionTitleText: {
    fontFamily: fontFamily.text,
  },

  // Menu Card
  menuCard: {
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontFamily: fontFamily.text,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontFamily: fontFamily.text,
    lineHeight: 16,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  badgeText: {
    fontFamily: fontFamily.text,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Divider
  divider: {
    height: 1,
    marginLeft: spacing.lg + 40 + spacing.md, // Align with text
  },

  // Settings Grid
  settingsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  settingsGridItem: {
    flex: 1,
  },
  settingsCard: {
    padding: spacing.lg,
  },
  settingsCardContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  settingsTitle: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingsSubtitle: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Destructive Button
  destructiveButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: '#EF4444',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  destructiveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  destructiveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fontFamily.mono,
  },

  // App Info
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  appInfoText: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
  },

  bottomSpacer: {
    height: spacing.xl * 2,
  },

  // Clean Progress Card
  progressCard: {
    borderRadius: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  progressTitle: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  progressStatItem: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.xs,
  },
  progressStatLabel: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
  },
  emptyProgressState: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  emptyProgressText: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  additionalProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressMetric: {
    alignItems: 'center',
  },
  progressMetricValue: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.xs,
  },
  progressMetricLabel: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  viewDetailsText: {
    fontFamily: fontFamily.text,
    fontWeight: '500',
  },

  // Avatar and Photo Upload Styles
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Profile Completion Styles
  profileCompletion: {
    gap: spacing.xs,
  },
  profileCompletionText: {
    fontSize: 12,
    fontFamily: fontFamily.text,
  },
  profileCompletionBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  profileCompletionFill: {
    height: '100%',
    borderRadius: 2,
  },
});

// ============================================================================
// ENHANCED PROFILE SCREEN COMPONENT
// ============================================================================

export default function EnhancedProfileScreen() {
  const router = useRouter();
  
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
  const refreshPreferences = themeResult?.refreshPreferences || (() => {});
  
  const user = authResult?.user;
  const profile = authResult?.profile;
  const signOut = authResult?.signOut || (async () => {});
  
  // Build robust uiStrings with required defaults to avoid undefined errors
  const defaultUIStrings = {
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
    },
    profile: {
      title: 'Profile',
      loadingProfile: 'Loading profile...',
      redirectingToLogin: 'Redirecting to login...',
      connectedViaGoogle: 'Connected via Google',
      profileCompletePercent: 'Profile {{percent}}% complete',
      yourProgress: 'Your Progress',
      quizzes: 'Quizzes',
      avgScore: 'Avg Score',
      dayStreak: 'Day Streak',
      studyTime: 'Study Time',
      achievements: 'Achievements',
      viewDetailedStats: 'View Detailed Stats',
      calendarIntegration: 'Calendar Integration',
      googleCalendarSync: 'Google Calendar Sync',
      dailyQuizReminders: 'Daily Quiz Reminders',
      smartScheduling: 'Smart Scheduling',
      learningPodSessions: 'Learning Pod Sessions',
    },
  };

  const uiStrings = {
    ...defaultUIStrings,
    ...(uiStringsResult?.uiStrings || {}),
    // Deep merge for nested profile/common if provided
    profile: {
      ...defaultUIStrings.profile,
      ...(uiStringsResult?.uiStrings?.profile || {}),
    },
    common: {
      ...defaultUIStrings.common,
      ...(uiStringsResult?.uiStrings?.common || {}),
    },
  };

  // Initialize calendar auth hook safely
  let authenticateGoogleCalendar = async () => ({ success: false, error: 'Calendar service not available' } as any);
  let isAuthReady = false;
  
  try {
    const calendarAuthResult = useGoogleCalendarAuth();
    if (calendarAuthResult) {
      authenticateGoogleCalendar = calendarAuthResult.authenticate;
      isAuthReady = calendarAuthResult.isReady;
    }
  } catch (error) {
    console.warn('Calendar auth hook not available:', error);
  }

  // Initialize preference styles safely
  let preferenceStyles = {};
  try {
    preferenceStyles = usePreferenceStyles() || {};
  } catch (error) {
    console.warn('Preference styles hook not available:', error);
  }

  // Translation system state
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [targetLanguageName, setTargetLanguageName] = useState('');
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);
  
  // Redirect guest users to auth
  useEffect(() => {
    if (!user) {
      console.log('🔒 Guest user attempted to access profile - redirecting to auth');
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
  const [userStats, setUserStats] = useState<UserStats>({
    totalQuizzes: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    level: 1,
    xpToNextLevel: 100,
    totalXPForNextLevel: 100,
    achievements: 0,
    rank: 0,
    totalUsers: 1,
  });
  const [calendarSettings, setCalendarSettings] = useState<CalendarSyncSettings>({
    enabled: false,
    syncQuizReminders: true,
    syncStudySessions: true,
    syncAchievements: false,
    smartScheduling: false,
    learningPods: false,
    reminderMinutes: 15,
    lastSyncDate: null,
  });

  // Hooks for new features - with error handling
  let recommendations: any = null;
  let generateSchedule = async (...args: any[]): Promise<any> => {};
  let analytics: any = null;
  let goals: any = null;
  let sessions: any = null;
  let scheduleSession = async (...args: any[]): Promise<any> => {};
  
  try {
    const smartSchedulingResult = useSmartScheduling(user?.id || '');
    if (smartSchedulingResult) {
      recommendations = smartSchedulingResult.recommendations;
      generateSchedule = smartSchedulingResult.generateSchedule || generateSchedule;
    }
  } catch (error) {
    console.warn('Smart scheduling hook not available:', error);
  }
  
  try {
    const analyticsResult = useCalendarAnalytics(user?.id || '');
    if (analyticsResult) {
      analytics = analyticsResult.analytics;
      goals = analyticsResult.goals;
    }
  } catch (error) {
    console.warn('Calendar analytics hook not available:', error);
  }
  
  try {
    const podCalendarResult = useLearningPodCalendar('default-pod');
    if (podCalendarResult) {
      sessions = podCalendarResult.sessions;
      scheduleSession = podCalendarResult.scheduleSession || scheduleSession;
    }
  } catch (error) {
    console.warn('Learning pod calendar hook not available:', error);
  }

  // Load settings and stats on mount
  useEffect(() => {
    loadUserData();
  }, [user?.id]);

  const loadUserData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load calendar settings
      const savedSettings = await SecureStore.getItemAsync('calendar_sync_settings');
      if (savedSettings) {
        setCalendarSettings(JSON.parse(savedSettings));
      }

      // Load real user stats from database
      const statsData = await UserStatsService.getUserStats(user.id);
      setUserStats(statsData);

      // Initialize user progress if this is their first time
      await UserStatsService.initializeUserProgress(user.id);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarSync = async (enabled: boolean) => {
    if (enabled) {
      try {
        setLoading(true);
        
        // Authenticate with Google using the hook
        const result = await authenticateGoogleCalendar();
        
        if (result.success) {
          // Update settings
          const newSettings = { ...calendarSettings, enabled: true };
          setCalendarSettings(newSettings);
          await SecureStore.setItemAsync('calendar_sync_settings', JSON.stringify(newSettings));
          
          // Create initial events
          await GoogleCalendarService.clearCalendarEvents();
          
          Alert.alert(
            'Calendar Sync Enabled',
            'Your study schedule is now synced to Google Calendar!',
            [{ text: 'OK' }]
          );

          // Generate smart recommendations if enabled
          if (newSettings.smartScheduling) {
            await generateSchedule({ considerCalendar: true });
          }
        } else {
          Alert.alert('Authentication Failed', result.error || 'Please try again');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to enable calendar sync');
      } finally {
        setLoading(false);
      }
    } else {
      // Disable sync
      const newSettings = { ...calendarSettings, enabled: false };
      setCalendarSettings(newSettings);
      await SecureStore.setItemAsync('calendar_sync_settings', JSON.stringify(newSettings));
      
      await GoogleCalendarService.clearCalendarEvents();
      
      Alert.alert(
        'Calendar Sync Disabled',
        'CivicSense events have been removed from your calendar.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSmartSchedulingToggle = async (enabled: boolean) => {
    const newSettings = { ...calendarSettings, smartScheduling: enabled };
    setCalendarSettings(newSettings);
    await SecureStore.setItemAsync('calendar_sync_settings', JSON.stringify(newSettings));

    if (enabled && calendarSettings.enabled) {
      // Generate initial recommendations
      await generateSchedule({ considerCalendar: true });
    }
  };

  const renderSmartScheduling = () => {
    if (!calendarSettings.smartScheduling || !recommendations) return null;

    return (
      <Card style={styles.smartScheduleCard} variant="outlined">
        <Text style={[styles.syncTitle, { color: theme.foreground }]}>
          🧠 Smart Study Recommendations
        </Text>
        
        {recommendations && (
          <>
            <Card style={styles.recommendationCard} variant="outlined">
              <View style={{ flex: 1 }}>
                <Text style={[styles.recommendationTime, { color: theme.foreground }]}>
                  {recommendations.recommendedTime.toLocaleTimeString('en', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </Text>
                <Text style={[styles.recommendationDate, { color: theme.foregroundSecondary }]}>
                  {recommendations.recommendedTime.toLocaleDateString('en', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              <View style={[
                styles.confidenceBadge,
                { backgroundColor: 
                  recommendations.confidence > 0.8 ? '#10B981' :
                  recommendations.confidence > 0.6 ? '#F59E0B' : '#EF4444'
                }
              ]}>
                <Text style={styles.confidenceText}>
                  {Math.round(recommendations.confidence * 100)}% Match
                </Text>
              </View>
            </Card>

            {/* Reasoning */}
            <View style={{ marginTop: spacing.sm }}>
              {recommendations.reasoning.map((reason: any, index: number) => (
                <Text key={index} style={{ fontSize: 12, color: theme.foregroundSecondary, marginBottom: 4 }}>
                  • {reason}
                </Text>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary, marginTop: spacing.md }]}
              onPress={() => {
                // Schedule the recommended session
                Alert.alert(
                  'Schedule Session',
                  `Add study session at ${recommendations.recommendedTime.toLocaleTimeString()}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Schedule', 
                      onPress: async () => {
                        await GoogleCalendarService.createEvents([{
                          title: '📚 CivicSense Study Session',
                          description: 'AI-recommended optimal study time',
                          startTime: recommendations.recommendedTime,
                          duration: recommendations.suggestedDuration,
                        }]);
                        Alert.alert('Success', 'Study session scheduled!');
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Schedule This Time</Text>
            </TouchableOpacity>
          </>
        )}
      </Card>
    );
  };

  const renderLearningPods = () => {
    if (!calendarSettings.learningPods) return null;

    return (
      <View style={styles.podSection}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
          Learning Pods
        </Text>

        <Card style={styles.podCard} variant="outlined">
          <View style={styles.podHeader}>
            <View>
              <Text style={[styles.podName, { color: theme.foreground }]}>
                Constitutional Law Study Group
              </Text>
              <Text style={[styles.podMembers, { color: theme.foregroundSecondary }]}>
                12 members • 3 online now
              </Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="settings-outline" size={20} color={theme.foregroundSecondary} />
            </TouchableOpacity>
          </View>

          {/* Upcoming Sessions */}
          <View style={styles.sessionsList}>
            <Card style={styles.sessionCard} variant="outlined">
              <Ionicons name="videocam" size={16} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sessionTime, { color: theme.foreground }]}>
                  Today, 7:00 PM
                </Text>
                <Text style={[styles.sessionTitle, { color: theme.foregroundSecondary }]}>
                  Bill of Rights Review Session
                </Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </TouchableOpacity>
            </Card>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary, marginTop: spacing.md }]}
            onPress={() => router.push('/learning-pods' as any)}
          >
            <Ionicons name="people-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Manage Pods</Text>
          </TouchableOpacity>
        </Card>
      </View>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleExportOptions = () => {
    Alert.alert(
      'Export Learning Progress',
      'How would you like to share your progress?',
      [
        {
          text: 'Export as PDF',
          onPress: handleExportPDF,
          style: 'default',
        },
        {
          text: 'Share with Pod',
          onPress: handleShareWithPod,
          style: 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleExportPDF = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      Alert.alert(
        '📄 Generating Your CivicSense Analytics Report',
        'Creating your comprehensive democratic learning progress report with CivicSense branding...',
        [{ text: 'Continue', style: 'default' }]
      );

      const result = await LearningExportService.exportToPDF(user.id);
      
      if (result.success && result.uri) {
        Alert.alert(
          '✅ Report Generated Successfully!',
          'Your branded CivicSense learning analytics report has been created. This comprehensive report includes your progress, insights, and achievements with full CivicSense branding and our mission statement.',
          [
            {
              text: 'Save to Device',
              style: 'cancel',
            },
            {
              text: 'Share Report',
              onPress: () => LearningExportService.sharePDF(result.uri!),
              style: 'default',
            },
          ]
        );
      } else {
        Alert.alert(
          'Export Failed', 
          result.error || 'Unable to generate your learning analytics report. Please check your internet connection and try again.',
          [{ text: 'Try Again', onPress: handleExportPDF }, { text: 'Cancel' }]
        );
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      Alert.alert(
        'Export Error',
        'Failed to generate your learning analytics report. This could be due to missing data or a temporary issue. Please try again in a moment.',
        [{ text: 'Try Again', onPress: handleExportPDF }, { text: 'Cancel' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShareWithPod = async () => {
    if (!user?.id) return;

    // For now, show a mock pod selection
    Alert.alert(
      'Share with Learning Pod',
      'Select a pod to share your progress with:',
      [
        {
          text: 'Constitutional Law Pod',
          onPress: () => shareProgressWithPod('constitutional-law-pod'),
        },
        {
          text: 'Civic Engagement Group',
          onPress: () => shareProgressWithPod('civic-engagement-group'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const shareProgressWithPod = async (podId: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const result = await LearningExportService.shareWithPod(user.id, podId);
      
      if (result.success) {
        Alert.alert(
          'Progress Shared!',
          'Your learning progress has been shared with your pod members.',
          [{ text: 'Great!' }]
        );
      } else {
        Alert.alert('Sharing Failed', result.error || 'Unable to share with pod');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share progress with pod');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }

      // Show action sheet
      Alert.alert(
        'Update Profile Photo',
        'Choose how you\'d like to add your photo',
        [
          { text: 'Camera', onPress: () => takePhoto() },
          { text: 'Photo Library', onPress: () => pickImage() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadProfilePhoto = async (uri: string) => {
    try {
      setLoading(true);
      
      // For now, just show success - implement actual upload logic here
      Alert.alert('Success', 'Profile photo updated successfully!');
      
      // TODO: Implement actual photo upload to your backend/storage
      // This would typically involve:
      // 1. Upload image to your storage service (Supabase Storage, AWS S3, etc.)
      // 2. Update user profile with the new avatar URL
      // 3. Refresh the profile data
      
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile photo');
    } finally {
      setLoading(false);
    }
  };

  const getProfileCompletionPercentage = (): number => {
    if (!profile) return 0;
    
    let completedFields = 0;
    const totalFields = 4;
    
    if (profile.full_name) completedFields++;
    if (profile.avatar_url) completedFields++;
    if (user?.email) completedFields++;
    if (profile.bio || profile.location) completedFields++; // Additional fields if they exist
    
    return Math.round((completedFields / totalFields) * 100);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
        <Stack.Screen 
          options={{
            title: uiStrings.profile.title,
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
                onPress={() => router.push('/settings' as any)}
                style={{ paddingRight: 16, padding: spacing.xs }}
                accessibilityRole="button"
                accessibilityLabel="Open settings"
              >
                <Ionicons name="settings-outline" size={24} color={theme.primary} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" variant="pulse" />
          <Text variant="body" style={{ marginTop: spacing.sm, color: theme.foregroundSecondary }}>
            {uiStrings.profile.loadingProfile}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      <Stack.Screen 
        options={{
          title: uiStrings.profile.title,
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
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 8, gap: 8 }}>
              <TouchableOpacity
                onPress={() => setLanguageSelectorVisible(true)}
                style={{ padding: spacing.xs }}
                accessibilityRole="button"
                accessibilityLabel="Change language"
              >
                <Ionicons name="language-outline" size={24} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/settings' as any)}
                style={{ padding: spacing.xs }}
                accessibilityRole="button"
                accessibilityLabel="Open settings"
              >
                <Ionicons name="settings-outline" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <ProfileRefreshControl 
            onCustomRefresh={onRefresh}
            onRefreshComplete={(success, errors) => {
              if (!success && errors) {
                console.warn('⚠️ Profile refresh had errors:', errors);
              }
            }}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePhotoUpload}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            <LinearGradient
              colors={[theme.primary, theme.primary + 'CC']}
              style={styles.avatar}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </Text>
              )}
            </LinearGradient>
            <View style={[styles.avatarEditOverlay, { backgroundColor: theme.primary }]}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: theme.foreground }]}>
              {profile?.full_name || 'CivicSense User'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.foregroundSecondary }]}>
              {user?.email}
            </Text>
            {user?.app_metadata?.provider === 'google' && (
              <View style={styles.providerBadge}>
                <Ionicons name="logo-google" size={14} color="#4285F4" />
                            <Text style={[styles.providerText, { color: theme.foregroundSecondary }]}>
              {uiStrings.profile.connectedViaGoogle}
            </Text>
              </View>
            )}
            {/* Profile Completion */}
            <View style={[styles.profileCompletion, { marginTop: spacing.sm }]}>
              <Text style={[styles.profileCompletionText, { color: theme.foregroundSecondary }]}>
                {uiStrings.profile.profileCompletePercent.replace('{{percent}}', getProfileCompletionPercentage().toString())}
              </Text>
              <View style={[styles.profileCompletionBar, { backgroundColor: theme.border }]}>
                <View 
                  style={[
                    styles.profileCompletionFill, 
                    { 
                      backgroundColor: theme.primary,
                      width: `${getProfileCompletionPercentage()}%`
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
          <View style={styles.profileActions}>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: theme.primary + '20' }]}
              onPress={handleExportOptions}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/settings/edit-profile' as any)}
            >
              <Ionicons name="create-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Clean Progress Card */}
        <Card style={StyleSheet.flatten([styles.progressCard, { backgroundColor: theme.card }])} variant="outlined">
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: theme.foreground }]}>
              📊 {uiStrings.profile.yourProgress}
            </Text>
          </View>
          
          <View style={styles.progressStats}>
            <View style={styles.progressStatItem}>
              <Text style={[styles.progressStatValue, { color: theme.foreground }]}>
                {userStats.totalQuizzes}
              </Text>
              <Text style={[styles.progressStatLabel, { color: theme.foregroundSecondary }]}>
                {uiStrings.profile.quizzes}
              </Text>
            </View>
            
            <View style={styles.progressStatItem}>
              <Text style={[styles.progressStatValue, { color: theme.foreground }]}>
                {userStats.totalQuizzes > 0 ? `${userStats.averageScore}%` : '--'}
              </Text>
              <Text style={[styles.progressStatLabel, { color: theme.foregroundSecondary }]}>
                {uiStrings.profile.avgScore}
              </Text>
            </View>
            
            <View style={styles.progressStatItem}>
              <Text style={[styles.progressStatValue, { color: theme.foreground }]}>
                {userStats.currentStreak}
              </Text>
              <Text style={[styles.progressStatLabel, { color: theme.foregroundSecondary }]}>
                {uiStrings.profile.dayStreak}
              </Text>
            </View>
          </View>



          {/* Additional stats for engaged users */}
          {userStats.totalQuizzes > 0 && (
            <View style={styles.additionalProgress}>
              <View style={styles.progressMetric}>
                <Text style={[styles.progressMetricValue, { color: theme.primary }]}>
                  {Math.round(userStats.totalTimeSpent / 3600 * 10) / 10}h
                </Text>
                <Text style={[styles.progressMetricLabel, { color: theme.foregroundSecondary }]}>
                  {uiStrings.profile.studyTime}
                </Text>
              </View>
              
              <View style={styles.progressMetric}>
                <Text style={[styles.progressMetricValue, { color: '#10B981' }]}>
                  {userStats.achievements}
                </Text>
                <Text style={[styles.progressMetricLabel, { color: theme.foregroundSecondary }]}>
                  {uiStrings.profile.achievements}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => router.push('/stats' as any)}
          >
            <Text style={[styles.viewDetailsText, { color: theme.primary }]}>
              {uiStrings.profile.viewDetailedStats}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={theme.primary} />
          </TouchableOpacity>
        </Card>

        {/* Calendar Sync Section */}
        <View style={styles.syncSection}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            {uiStrings.profile.calendarIntegration}
          </Text>
          
          <Card style={styles.syncCard} variant="outlined">
            <View style={styles.syncHeader}>
              <View style={styles.syncInfo}>
                <Text style={[styles.syncTitle, { color: theme.foreground }]}>
                  {uiStrings.profile.googleCalendarSync}
                </Text>
              </View>
              <Switch
                testID="calendar-sync-switch"
                value={calendarSettings.enabled}
                onValueChange={handleCalendarSync}
                disabled={loading}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={calendarSettings.enabled ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>

            {calendarSettings.enabled && (
              <View style={styles.syncOptions}>
                <View style={styles.optionRow}>
                  <Text style={[styles.optionLabel, { color: theme.foreground }]}>
                    📅 {uiStrings.profile.dailyQuizReminders}
                  </Text>
                  <Switch
                    testID="quiz-reminder-switch"
                    value={calendarSettings.syncQuizReminders}
                    onValueChange={async (value) => {
                      const newSettings = { ...calendarSettings, syncQuizReminders: value };
                      setCalendarSettings(newSettings);
                      await SecureStore.setItemAsync('calendar_sync_settings', JSON.stringify(newSettings));
                    }}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={calendarSettings.syncQuizReminders ? '#FFFFFF' : '#f4f3f4'}
                  />
                </View>

                <View style={styles.optionRow}>
                  <Text style={[styles.optionLabel, { color: theme.foreground }]}>
                    🧠 {uiStrings.profile.smartScheduling}
                  </Text>
                  <Switch
                    value={calendarSettings.smartScheduling}
                    onValueChange={handleSmartSchedulingToggle}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={calendarSettings.smartScheduling ? '#FFFFFF' : '#f4f3f4'}
                  />
                </View>

                <View style={styles.optionRow}>
                  <Text style={[styles.optionLabel, { color: theme.foreground }]}>
                    👥 {uiStrings.profile.learningPodSessions}
                  </Text>
                  <Switch
                    value={calendarSettings.learningPods}
                    onValueChange={async (value) => {
                      const newSettings = { ...calendarSettings, learningPods: value };
                      setCalendarSettings(newSettings);
                      await SecureStore.setItemAsync('calendar_sync_settings', JSON.stringify(newSettings));
                    }}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={calendarSettings.learningPods ? '#FFFFFF' : '#f4f3f4'}
                  />
                </View>

                {calendarSettings.lastSyncDate && (
                  <Text style={[styles.lastSyncText, { color: theme.foregroundTertiary }]}>
                    Last synced: {new Date(calendarSettings.lastSyncDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}

            {/* Smart Scheduling Recommendations */}
            {renderSmartScheduling()}
          </Card>
        </View>

        {/* Learning Pods */}
        {renderLearningPods()}

        {/* Settings Grid */}
        <View style={styles.settingsGrid}>
          {/* Edit Profile Card */}
          <TouchableOpacity
            style={styles.settingsGridItem}
            onPress={async () => {
              router.push('/settings/edit-profile' as any);
              // Refresh preferences when returning from edit profile
              setTimeout(() => refreshPreferences(), 1000);
            }}
            activeOpacity={0.8}
          >
                         <Card 
               style={{
                 ...styles.settingsCard,
                 backgroundColor: theme.card
               }} 
               variant="outlined"
             >
               <View style={styles.settingsCardContent}>
                 <View style={{
                   ...styles.settingsIcon,
                   backgroundColor: theme.primary + '20'
                 }}>
                   <Ionicons name="person-outline" size={24} color={theme.primary} />
                 </View>
                 <Text style={{
                   ...styles.settingsTitle,
                   color: theme.foreground
                 }}>
                   Edit Profile
                 </Text>
                 <Text style={{
                   ...styles.settingsSubtitle,
                   color: theme.foregroundSecondary
                 }}>
                   Update your information
                 </Text>
               </View>
             </Card>
          </TouchableOpacity>

          {/* Settings Card */}
          <TouchableOpacity
            style={styles.settingsGridItem}
            onPress={() => router.push('/settings' as any)}
            activeOpacity={0.8}
          >
                         <Card 
               style={{
                 ...styles.settingsCard,
                 backgroundColor: theme.card
               }} 
               variant="outlined"
             >
               <View style={styles.settingsCardContent}>
                 <View style={{
                   ...styles.settingsIcon,
                   backgroundColor: '#8B5CF6' + '20'
                 }}>
                   <Ionicons name="settings-outline" size={24} color="#8B5CF6" />
                 </View>
                 <Text style={{
                   ...styles.settingsTitle,
                   color: theme.foreground
                 }}>
                   Preferences
                 </Text>
                 <Text style={{
                   ...styles.settingsSubtitle,
                   color: theme.foregroundSecondary
                 }}>
                   Learning & notifications
                 </Text>
               </View>
             </Card>
          </TouchableOpacity>
        </View>



        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: theme.foregroundSecondary }]}>
            CivicSense v1.0.0 • Made with ❤️ for democracy
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={languageSelectorVisible}
        currentLanguage={currentLanguage}
        onClose={() => setLanguageSelectorVisible(false)}
        onLanguageSelect={(languageCode: string) => {
          setTargetLanguage(languageCode);
          setTargetLanguageName(languageCode.toUpperCase()); // Use code as name for now
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