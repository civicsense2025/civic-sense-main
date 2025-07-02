import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme-context';
import { useAuth } from '../lib/auth-context';
import { Text } from '../components/atoms/Text';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/molecules/LoadingSpinner';
import { spacing, borderRadius, typography, responsiveFontSizes } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { 
  fetchUserProgress,
  type StandardResponse,
} from '../lib/standardized-data-service';
import { supabase } from '../lib/supabase';
import { DailyChallengeTracker, TopicWithProgress } from '../lib/daily-challenge-tracker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// INTERFACES AND TYPES
// =============================================================================

interface DailyChallenge {
  date: string; // YYYY-MM-DD format
  totalTopics: number;
  completedTopics: number;
  isCompleted: boolean;
  completedAt?: string | undefined;
}

interface DailyChallengeStats {
  currentStreak: number;
  longestStreak: number;
  totalChallengesCompleted: number;
  lastCompletedDate?: string | undefined;
  isStreakBroken: boolean;
}

interface CalendarDay {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isCompleted: boolean;
  completedTopics: number;
  totalTopics: number;
  isInStreak: boolean;
  isDisabled: boolean;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const formatDateKey = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return formatDateKey(new Date());
  }
  try {
    return date.toISOString().split('T')[0] || '';
  } catch (error) {
    console.warn('Invalid date in formatDateKey:', date);
    return formatDateKey(new Date());
  }
};

const addDays = (date: Date, days: number): Date => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    date = new Date();
  }
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return formatDateKey(date) === formatDateKey(today);
};

const getMonthName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const getWeekdayNames = (): string[] => {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
};

// Helper: extract category names directly from JSONB categories column
const resolveCategoryNames = async (rawCategories: any = []): Promise<string[]> => {
  if (!rawCategories || rawCategories.length === 0) return [];

  // If rawCategories is already an array of objects with name property
  if (Array.isArray(rawCategories)) {
    return rawCategories.map(cat => {
      if (typeof cat === 'object' && cat?.name) {
        return cat.name;
      }
      if (typeof cat === 'string') {
        return cat;
      }
      return 'General';
    }).filter(Boolean);
  }

  // If it's a single object
  if (typeof rawCategories === 'object' && rawCategories?.name) {
    return [rawCategories.name];
  }

  // If it's a string, just return it
  if (typeof rawCategories === 'string') {
    return [rawCategories];
  }

  return [];
};

// =============================================================================
// DAILY CHALLENGE TRACKER INTEGRATION
// =============================================================================

// Initialize the daily challenge service
const dailyChallengeService = DailyChallengeTracker.getInstance();

// =============================================================================
// CALENDAR COMPONENTS
// =============================================================================

const CalendarDayCell: React.FC<{
  day: CalendarDay;
  onPress: (date: Date) => void;
}> = ({ day, onPress }) => {
  const { theme } = useTheme();

  const getCellStyle = () => {
    let backgroundColor: string = theme.background;
    let borderColor: string = 'transparent';
    
    if (day.isDisabled) {
      backgroundColor = theme.background;
      borderColor = 'transparent';
    } else if (day.isToday) {
      backgroundColor = theme.primary;
    } else if (day.isCompleted) {
      backgroundColor = '#10B981';
    } else if (day.isInStreak && day.completedTopics > 0) {
      backgroundColor = '#F59E0B';
    } else if (day.completedTopics > 0) {
      backgroundColor = '#E5E7EB';
    }
    
    if (day.isToday && !day.isDisabled) {
      borderColor = theme.primary;
    }
    
    return {
      backgroundColor,
      borderColor,
      opacity: day.isDisabled ? 0.2 : (day.isCurrentMonth ? 1 : 0.3),
    };
  };

  const getTextColor = (): string => {
    if (day.isDisabled) {
      return theme.foregroundSecondary;
    }
    if (day.isToday || day.isCompleted) {
      return '#FFFFFF';
    }
    return day.isCurrentMonth ? theme.foreground : theme.foregroundSecondary;
  };

  const getProgressDots = () => {
    if (day.totalTopics === 0) return null;
    
    const dots = [];
    for (let i = 0; i < 4; i++) { // Max 4 dots for daily challenge
      dots.push(
        <View
          key={i}
          style={[
            styles.progressDot,
            {
              backgroundColor: i < day.completedTopics 
                ? (day.isToday || day.isCompleted ? '#FFFFFF' : '#10B981')
                : 'rgba(255, 255, 255, 0.3)',
            },
          ]}
        />
      );
    }
    return dots;
  };

  return (
    <TouchableOpacity
      style={[styles.calendarCell, getCellStyle()]}
      onPress={() => !day.isDisabled && onPress(day.date)}
      activeOpacity={day.isDisabled ? 1 : 0.8}
      disabled={day.isDisabled}
    >
      <Text
        variant="footnote"
        style={[styles.dayNumber, { color: getTextColor() }]}
      >
        {day.date.getDate()}
      </Text>
      
      {day.totalTopics > 0 && (
        <View style={styles.progressDotsContainer}>
          {getProgressDots()}
        </View>
      )}
      
      {day.isCompleted && (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const DailyChallengeCalendar: React.FC<{
  currentDate: Date;
  onDateChange: (date: Date) => void;
  challenges: Map<string, DailyChallenge>;
  streakDates: Set<string>;
  userJoinDate?: Date | undefined;
}> = ({ currentDate, onDateChange, challenges, streakDates, userJoinDate }) => {
  const { theme } = useTheme();

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of the month and its day of week
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();
    
    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    const days: CalendarDay[] = [];
    
    // Add previous month's trailing days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      const dateKey = formatDateKey(date);
      const challenge = challenges.get(dateKey);
      const isDisabled = userJoinDate ? date < userJoinDate : false;
      
      days.push({
        date,
        dateKey,
        isCurrentMonth: false,
        isToday: isToday(date),
        isCompleted: challenge?.isCompleted || false,
        completedTopics: challenge?.completedTopics || 0,
        totalTopics: challenge?.totalTopics || 0,
        isInStreak: streakDates.has(dateKey),
        isDisabled,
      });
    }
    
    // Add current month's days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);
      const challenge = challenges.get(dateKey);
      const isDisabled = userJoinDate ? date < userJoinDate : false;
      
      days.push({
        date,
        dateKey,
        isCurrentMonth: true,
        isToday: isToday(date),
        isCompleted: challenge?.isCompleted || false,
        completedTopics: challenge?.completedTopics || 0,
        totalTopics: challenge?.totalTopics || 4, // Default daily challenge size
        isInStreak: streakDates.has(dateKey),
        isDisabled,
      });
    }
    
    // Add next month's leading days to fill the grid
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      const dateKey = formatDateKey(date);
      const challenge = challenges.get(dateKey);
      const isDisabled = userJoinDate ? date < userJoinDate : false;
      
      days.push({
        date,
        dateKey,
        isCurrentMonth: false,
        isToday: isToday(date),
        isCompleted: challenge?.isCompleted || false,
        completedTopics: challenge?.completedTopics || 0,
        totalTopics: challenge?.totalTopics || 0,
        isInStreak: streakDates.has(dateKey),
        isDisabled,
      });
    }
    
    return days;
  }, [currentDate, challenges, streakDates, userJoinDate]);

  const weekdayNames = getWeekdayNames();

  return (
    <View style={styles.calendar}>
      {/* Weekday headers */}
      <View style={styles.weekdayHeader}>
        {weekdayNames.map((weekday) => (
          <View key={weekday} style={styles.weekdayCell}>
            <Text variant="caption1" color="secondary" style={styles.weekdayText}>
              {weekday}
            </Text>
          </View>
        ))}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => (
          <CalendarDayCell
            key={`${day.dateKey}-${index}`}
            day={day}
            onPress={onDateChange}
          />
        ))}
      </View>
    </View>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DailyChallengesScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<Map<string, DailyChallenge>>(new Map());
  const [streakStats, setStreakStats] = useState<DailyChallengeStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalChallengesCompleted: 0,
    isStreakBroken: false,
  });
  const [streakDates, setStreakDates] = useState<Set<string>>(new Set());
  const [userJoinDate, setUserJoinDate] = useState<Date | undefined>();
  const [inProgressQuizzes, setInProgressQuizzes] = useState<any[]>([]);
  const [selectedDayModal, setSelectedDayModal] = useState<{
    visible: boolean;
    challenge: DailyChallenge | null;
    date: Date | null;
    topics: any[];
    loadingTopics: boolean;
  }>({
    visible: false,
    challenge: null,
    date: null,
    topics: [],
    loadingTopics: false,
  });
  const [selectedDayCarousel, setSelectedDayCarousel] = useState<{
    visible: boolean;
    date: Date | null;
    topics: any[];
    loadingTopics: boolean;
  }>({
    visible: false,
    date: null,
    topics: [],
    loadingTopics: false,
  });

  // Load data
  useEffect(() => {
    if (user?.id) {
      loadDailyChallengeData();
    }
  }, [user?.id, currentDate]);

  const loadDailyChallengeData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Load user join date (when they created their account)
      const userJoinDateResponse = await dailyChallengeService.getUserJoinDate();
      if (userJoinDateResponse) {
        setUserJoinDate(userJoinDateResponse);
      }
      
      // Get user stats (includes streak information)
      const { data: statsData, error: statsError } = await dailyChallengeService.getUserStats(user.id);
      if (statsError) {
        console.error('Error loading user stats:', statsError);
      } else if (statsData) {
        const stats: DailyChallengeStats = {
          currentStreak: statsData.current_streak,
          longestStreak: statsData.longest_streak,
          totalChallengesCompleted: statsData.total_completed,
          isStreakBroken: false, // This can be calculated if needed
        };
        setStreakStats(stats);
        
        // Generate streak dates
        const streakDateSet = new Set<string>();
        if (stats.currentStreak > 0) {
          const today = new Date();
          for (let i = 0; i < stats.currentStreak; i++) {
            const streakDate = addDays(today, -i);
            streakDateSet.add(formatDateKey(streakDate));
          }
        }
        setStreakDates(streakDateSet);
      }
      
      // Load challenges for current month (fallback to mock data for now)
      const challenges = new Map<string, DailyChallenge>();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Generate mock challenges for each day in the month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateKey = formatDateKey(date);
        
        // Mock challenge data - in production this would come from database
        challenges.set(dateKey, {
          date: dateKey,
          totalTopics: 4,
          completedTopics: Math.random() > 0.5 ? Math.floor(Math.random() * 5) : 0,
          isCompleted: Math.random() > 0.7,
          completedAt: Math.random() > 0.7 ? new Date().toISOString() : undefined,
        });
      }
      setChallenges(challenges);
      
      // Load in-progress quizzes data
      await loadInProgressQuizzes();
      
    } catch (error) {
      console.error('Error loading daily challenge data:', error);
      Alert.alert('Error', 'Failed to load daily challenge data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadInProgressQuizzes = async () => {
    if (!user?.id) return;
    
    try {
      // Use the service to get incomplete quizzes for today
      const { data: incompleteTopics, error } = await dailyChallengeService.getIncompleteQuizzesForToday(user.id);
      
      if (error) {
        console.error('Error fetching incomplete quizzes:', error);
        setInProgressQuizzes([]);
        return;
      }

      // Transform the data to match the expected format for the UI
      const formattedTopics = incompleteTopics.map(topic => ({
        topic: {
          id: topic.topic_id,
          topic_id: topic.topic_id,
          title: topic.topic_title,
          topic_title: topic.topic_title,
          emoji: topic.emoji || '📖',
          categoryNames: topic.categoryNames || [],
        },
        progress: {
          bestScore: topic.progress_percentage || 0,
          isCompleted: topic.is_completed || false,
          attemptsCount: 1,
        },
      }));

      setInProgressQuizzes(formattedTopics);
    } catch (error) {
      console.error('Error in loadInProgressQuizzes:', error);
      // Fallback to empty array on error
      setInProgressQuizzes([]);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDateSelect = async (date: Date) => {
    const dateKey = formatDateKey(date);
    const challenge = challenges.get(dateKey);
    
    if (challenge) {
      // First, fetch topics to determine how many there are
      const topicsForDate = await fetchTopicsForDatePreview(dateKey);
      
      // If there are many topics (more than 5), use carousel; otherwise use modal
      if (topicsForDate.length > 5) {
        // Process topics to extract category names for carousel
        const processedTopics = await Promise.all(topicsForDate.map(async (topic) => {
          const categoryNames = await resolveCategoryNames(topic.categories || []);
          return {
            ...topic,
            categoryNames
          };
        }));

        setSelectedDayCarousel({
          visible: true,
          date,
          topics: processedTopics,
          loadingTopics: false,
        });
      } else {
        setSelectedDayModal({
          visible: true,
          challenge,
          date,
          topics: topicsForDate,
          loadingTopics: false,
        });
      }
    }
  };

  const fetchTopicsForDate = async (dateKey: string) => {
    try {
      // Query question_topics that have a matching date column
      const { data: topics, error } = await supabase
        .from('question_topics')
        .select('*')
        .eq('date', dateKey)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching topics for date:', error);
        setSelectedDayModal(prev => ({
          ...prev,
          loadingTopics: false,
          topics: [],
        }));
        return;
      }

      // Process topics to extract category names from JSONB
      const processedTopics = await Promise.all((topics || []).map(async (topic) => {
        const categoryNames = await resolveCategoryNames(topic.categories || []);
        return {
          ...topic,
          categoryNames
        };
      }));

      setSelectedDayModal(prev => ({
        ...prev,
        loadingTopics: false,
        topics: processedTopics,
      }));
    } catch (error) {
      console.error('Error fetching topics for date:', error);
      setSelectedDayModal(prev => ({
        ...prev,
        loadingTopics: false,
        topics: [],
      }));
    }
  };

  const fetchTopicsForDatePreview = async (dateKey: string): Promise<any[]> => {
    try {
      if (!user?.id) return [];
      
      const date = new Date(dateKey);
      // Use the service to get topics for the date with progress
      const { data: topics, error } = await dailyChallengeService.getTopicsForDateWithProgress(user.id, date);

      if (error) {
        console.error('Error fetching topics for date preview:', error);
        return [];
      }

      return topics;
    } catch (error) {
      console.error('Error fetching topics for date preview:', error);
      return [];
    }
  };

  const handleStartDailyChallenge = (date: Date) => {
    const today = new Date();
    if (formatDateKey(date) === formatDateKey(today)) {
      // Navigate to today's topics
      router.push('/(tabs)/' as any);
    } else {
      Alert.alert(
        'Past Challenge',
        'You can only complete today\'s daily challenge. Check out the quiz section for more content!',
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Browse Quizzes', onPress: () => router.push('/(tabs)/quiz' as any) },
        ]
      );
    }
    setSelectedDayModal({ visible: false, challenge: null, date: null, topics: [], loadingTopics: false });
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '💪';
    if (streak >= 7) return '⭐';
    if (streak >= 3) return '🎯';
    return '📚';
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return 'Legendary streak!';
    if (streak >= 14) return 'On fire!';
    if (streak >= 7) return 'Great momentum!';
    if (streak >= 3) return 'Building habits!';
    if (streak >= 1) return 'Getting started!';
    return 'Start your streak today!';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" variant="pulse" />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Loading your daily challenges...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: 'Daily Challenges',
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
          headerTitleStyle: { 
            color: theme.foreground,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingLeft: 8, paddingRight: 16 }}
            >
              <Text style={{ fontSize: 18, color: theme.primary, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Header */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statColumn}>
              <Text style={styles.statEmoji}>{getStreakEmoji(streakStats.currentStreak)}</Text>
              <Text variant="title3" color="primary" style={styles.statNumber}>
                {streakStats.currentStreak}
              </Text>
              <Text variant="caption1" color="secondary">Day Streak</Text>
            </View>
            
            <View style={styles.statColumn}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text variant="title3" color="primary" style={styles.statNumber}>
                {streakStats.longestStreak}
              </Text>
              <Text variant="caption1" color="secondary">Longest Streak</Text>
            </View>
            
            <View style={styles.statColumn}>
              <Text style={styles.statEmoji}>📊</Text>
              <Text variant="title3" color="primary" style={styles.statNumber}>
                {streakStats.totalChallengesCompleted}
              </Text>
              <Text variant="caption1" color="secondary">Total Completed</Text>
            </View>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarSection}>
          <Card style={StyleSheet.flatten([styles.calendarCard, { backgroundColor: theme.card }])} variant="outlined">
            {/* Month Navigation */}
            <View style={styles.monthHeader}>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={() => handleMonthChange('prev')}
              >
                <Ionicons name="chevron-back" size={20} color={theme.primary} />
              </TouchableOpacity>
              
              <Text variant="title3" color="inherit" style={styles.monthTitle}>
                {getMonthName(currentDate)}
              </Text>
              
              <TouchableOpacity
                style={styles.monthButton}
                onPress={() => handleMonthChange('next')}
              >
                <Ionicons name="chevron-forward" size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {/* Calendar */}
            <DailyChallengeCalendar
              currentDate={currentDate}
              onDateChange={handleDateSelect}
              challenges={challenges}
              streakDates={streakDates}
              userJoinDate={userJoinDate}
            />

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text variant="caption1" color="secondary">Completed</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text variant="caption1" color="secondary">In Progress</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                <Text variant="caption1" color="secondary">Today</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Continue Where You Left Off - using quiz.tsx style */}
        {inProgressQuizzes.length > 0 && (
          <View style={styles.continueSection}>
            <Text variant="title3" color="inherit" style={styles.continueSectionTitle}>
              📖 Continue Where You Left Off
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.continueQuizzesScroll}
            >
              {inProgressQuizzes.map(({ topic, progress }: any) => (
                <TouchableOpacity
                  key={topic.id || topic.topic_id}
                  style={[
                    styles.continueQuizCard, 
                    { 
                      backgroundColor: theme.card, 
                      borderColor: theme.border,
                      borderStyle: 'dashed', // Dashed border for in-progress
                    }
                  ]}
                  onPress={() => router.push(`/game-room/${topic.topic_id || topic.id}` as any)}
                >
                  <Text style={styles.continueQuizEmoji}>{topic.emoji || '📚'}</Text>
                  <Text style={[styles.continueQuizTitle, { color: theme.foreground }]} numberOfLines={2}>
                    {topic.title || topic.topic_title}
                  </Text>
                  <View style={[styles.continueQuizProgress, { backgroundColor: theme.border + '30' }]}>
                    <View
                      style={[
                        styles.continueQuizProgressFill,
                        { 
                          width: `${progress.bestScore || 0}%`,
                          backgroundColor: theme.primary,
                        }
                      ]} 
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Call to Action */}
        {!isToday(currentDate) && (
          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/(tabs)/' as any)}
            >
              <Text variant="callout" style={styles.ctaButtonText}>
                Start Today's Challenge
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Day Detail Modal */}
      <Modal
        visible={selectedDayModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDayModal({ visible: false, challenge: null, date: null, topics: [], loadingTopics: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {selectedDayModal.challenge && selectedDayModal.date && (
              <>
                <View style={styles.modalHeader}>
                  <Text variant="title3" color="inherit" style={styles.modalTitle}>
                    {selectedDayModal.date.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setSelectedDayModal({ visible: false, challenge: null, date: null, topics: [], loadingTopics: false })}
                  >
                    <Ionicons name="close" size={24} color={theme.foregroundSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalStats}>
                  <View style={styles.modalStat}>
                    <Text variant="title2" color="primary">
                      {selectedDayModal.challenge.completedTopics}
                    </Text>
                    <Text variant="footnote" color="secondary">Completed</Text>
                  </View>
                  <View style={styles.modalStat}>
                    <Text variant="title2" color="inherit">
                      {selectedDayModal.challenge.totalTopics}
                    </Text>
                    <Text variant="footnote" color="secondary">Total</Text>
                  </View>
                  <View style={styles.modalStat}>
                    <Text variant="title2" color="inherit">
                      {Math.round((selectedDayModal.challenge.completedTopics / selectedDayModal.challenge.totalTopics) * 100)}%
                    </Text>
                    <Text variant="footnote" color="secondary">Progress</Text>
                  </View>
                </View>

                {/* Topics List */}
                <View style={styles.topicsSection}>
                  <Text variant="callout" color="inherit" style={styles.topicsSectionTitle}>
                    📚 Topics for this day
                  </Text>
                  
                  {selectedDayModal.loadingTopics ? (
                    <View style={styles.topicsLoading}>
                      <LoadingSpinner size="small" />
                      <Text variant="footnote" color="secondary">Loading topics...</Text>
                    </View>
                  ) : selectedDayModal.topics.length > 0 ? (
                    <View style={styles.topicsList}>
                      {selectedDayModal.topics.map((topic, index) => (
                        <TouchableOpacity
                          key={topic.topic_id}
                          style={[styles.topicItem, { backgroundColor: theme.background, borderColor: theme.border }]}
                          onPress={() => {
                            setSelectedDayModal({ visible: false, challenge: null, date: null, topics: [], loadingTopics: false });
                            router.push(`/quiz/${topic.topic_id}` as any);
                          }}
                        >
                          <Text style={styles.topicEmoji}>{topic.emoji || '📖'}</Text>
                          <View style={styles.topicInfo}>
                            <Text variant="footnote" color="inherit" style={styles.topicTitle} numberOfLines={2}>
                              {topic.topic_title}
                            </Text>
                            
                            {/* Category Badges for Modal */}
                            {topic.categoryNames && topic.categoryNames.length > 0 && (
                              <View style={styles.modalCategoryBadges}>
                                {topic.categoryNames.slice(0, 3).map((categoryName: string, catIndex: number) => (
                                  <View 
                                    key={catIndex}
                                    style={[styles.modalCategoryBadge, { borderColor: theme.primary }]}
                                  >
                                    <Text style={[styles.modalCategoryText, { color: theme.primary }]}>
                                      {categoryName}
                                    </Text>
                                  </View>
                                ))}
                                {topic.categoryNames.length > 3 && (
                                  <View style={[styles.modalCategoryBadge, { borderColor: theme.foregroundSecondary }]}>
                                    <Text style={[styles.modalCategoryText, { color: theme.foregroundSecondary }]}>
                                      +{topic.categoryNames.length - 3}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            )}
                            
                            {topic.description && (
                              <Text variant="caption1" color="secondary" numberOfLines={1}>
                                {topic.description}
                              </Text>
                            )}
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={theme.foregroundSecondary} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text variant="footnote" color="secondary" style={styles.noTopicsText}>
                      No topics available for this date
                    </Text>
                  )}
                </View>

                {selectedDayModal.challenge.isCompleted ? (
                  <View style={styles.completedMessage}>
                    <Text style={styles.completedEmoji}>🎉</Text>
                    <Text variant="callout" color="inherit" style={styles.completedText}>
                      Challenge Completed!
                    </Text>
                    {selectedDayModal.challenge.completedAt && (
                      <Text variant="footnote" color="secondary">
                        Finished at {new Date(selectedDayModal.challenge.completedAt).toLocaleTimeString()}
                      </Text>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: theme.primary }]}
                    onPress={() => handleStartDailyChallenge(selectedDayModal.date!)}
                  >
                    <Text variant="callout" style={styles.modalButtonText}>
                      {isToday(selectedDayModal.date) ? 'Continue Challenge' : 'View Challenge'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Day Topics Carousel */}
      <Modal
        visible={selectedDayCarousel.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDayCarousel({ visible: false, date: null, topics: [], loadingTopics: false })}
      >
        <View style={styles.carouselOverlay}>
          <View style={[styles.carouselContainer, { backgroundColor: theme.background }]}>
            {/* Carousel Header */}
            <View style={styles.carouselHeader}>
              <Text variant="title3" color="inherit" style={styles.carouselTitle}>
                {selectedDayCarousel.date?.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric'
                })}
              </Text>
              <TouchableOpacity
                style={styles.carouselCloseButton}
                onPress={() => setSelectedDayCarousel({ visible: false, date: null, topics: [], loadingTopics: false })}
              >
                <Ionicons name="close" size={24} color={theme.foregroundSecondary} />
              </TouchableOpacity>
            </View>

            {/* Topics Carousel */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselScroll}
              style={styles.carouselScrollView}
            >
              {selectedDayCarousel.topics.map((topic, index) => (
                <TouchableOpacity
                  key={topic.topic_id}
                  style={[styles.carouselTopicCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => {
                    setSelectedDayCarousel({ visible: false, date: null, topics: [], loadingTopics: false });
                    router.push(`/quiz/${topic.topic_id}` as any);
                  }}
                >
                  <Text style={styles.carouselTopicEmoji}>{topic.emoji || '📖'}</Text>
                  
                  {/* Category Badges */}
                  {topic.categoryNames && topic.categoryNames.length > 0 && (
                    <View style={styles.carouselCategoryBadges}>
                      {topic.categoryNames.slice(0, 2).map((categoryName: string, catIndex: number) => (
                        <View 
                          key={catIndex}
                          style={[styles.carouselCategoryBadge, { borderColor: theme.primary }]}
                        >
                          <Text style={[styles.carouselCategoryText, { color: theme.primary }]}>
                            {categoryName}
                          </Text>
                        </View>
                      ))}
                      {topic.categoryNames.length > 2 && (
                        <View style={[styles.carouselCategoryBadge, { borderColor: theme.foregroundSecondary }]}>
                          <Text style={[styles.carouselCategoryText, { color: theme.foregroundSecondary }]}>
                            +{topic.categoryNames.length - 2}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  <Text variant="callout" color="inherit" style={styles.carouselTopicTitle} numberOfLines={3}>
                    {topic.topic_title}
                  </Text>
                  {topic.description && (
                    <Text variant="caption1" color="secondary" style={styles.carouselTopicDescription} numberOfLines={2}>
                      {topic.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Carousel Footer */}
            <View style={styles.carouselFooter}>
              <Text variant="footnote" color="secondary" style={styles.carouselFooterText}>
                Swipe to explore {selectedDayCarousel.topics.length} topics from this day
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

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
  scrollView: {
    flex: 1,
  },

  // Stats Section
  statsSection: {
    padding: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
    lineHeight: 28,
    includeFontPadding: false,
  },
  statNumber: {
    fontWeight: '700',
    marginBottom: spacing.xs,
  },

  // Calendar Section
  calendarSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  calendarCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  monthButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  monthTitle: {
    fontWeight: '600',
  },

  // Calendar
  calendar: {
    marginBottom: spacing.md,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  weekdayText: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100/7}%`,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    marginBottom: 1,
    position: 'relative',
  },
  dayNumber: {
    fontWeight: '600',
    fontSize: typography.footnote.fontSize,
    lineHeight: typography.footnote.lineHeight,
  },
  progressDotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 2,
    gap: 1,
  },
  progressDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  completedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // CTA Section
  ctaSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  ctaButton: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontWeight: '600',
    flex: 1,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  modalStat: {
    alignItems: 'center',
  },
  completedMessage: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  completedEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  completedText: {
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  modalButton: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Topics Section
  topicsSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  topicsSectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  topicsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  topicsList: {
    gap: spacing.sm,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  topicEmoji: {
    fontSize: 20,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  noTopicsText: {
    textAlign: 'center',
    paddingVertical: spacing.lg,
    fontStyle: 'italic',
  },

  // Continue Section - using quiz.tsx style
  continueSection: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  continueSectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  continueQuizzesScroll: {
    gap: spacing.lg,
  },
  continueQuizCard: {
    width: 180,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  continueQuizEmoji: {
    fontSize: 28,
    lineHeight: 32,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  continueQuizTitle: {
    ...typography.footnote,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
    height: 40,
  },
  continueQuizProgress: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: spacing.xs,
  },
  continueQuizProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Carousel Modal
  carouselOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  carouselContainer: {
    height: '60%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
  },
  carouselHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  carouselTitle: {
    fontWeight: '600',
    flex: 1,
  },
  carouselCloseButton: {
    padding: spacing.xs,
  },
  carouselScrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  carouselScroll: {
    gap: spacing.lg,
    paddingRight: spacing.lg,
  },
  carouselTopicCard: {
    width: 200,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  carouselTopicEmoji: {
    fontSize: 32,
    lineHeight: 36,
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  carouselTopicTitle: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  carouselTopicDescription: {
    textAlign: 'center',
    lineHeight: 16,
  },
  carouselFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  carouselFooterText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Category Badges for Carousel
  carouselCategoryBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    justifyContent: 'center',
  },
  carouselCategoryBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  carouselCategoryText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Category Badges for Modal
  modalCategoryBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  modalCategoryBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  modalCategoryText: {
    fontSize: 9,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
}); 