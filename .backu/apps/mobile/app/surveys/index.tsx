import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { useGuestAccess } from '../../lib/hooks/use-guest-access';
import { SurveyService } from '../../lib/services';
import { useTheme } from '../../lib/theme-context';
import { MaterialIcons } from '@expo/vector-icons';
import { QuickRefreshControl } from '../../components/ui/EnhancedRefreshControl';
import type { Survey } from '../../lib/types/survey';

export default function SurveysScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getOrCreateGuestToken } = useGuestAccess();
  const { theme } = useTheme();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unclaimedRewards, setUnclaimedRewards] = useState<any[]>([]);

  const guestToken = !user ? getOrCreateGuestToken() : undefined;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.foregroundSecondary
    },
    rewardsNotification: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF8E1',
      margin: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#FFE082'
    },
    rewardsTextContainer: {
      flex: 1,
      marginLeft: 12
    },
    rewardsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.foreground
    },
    rewardsSubtitle: {
      fontSize: 14,
      color: theme.foregroundSecondary,
      marginTop: 2
    },
    header: {
      padding: 16,
      paddingTop: 8
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.foreground
    },
    headerSubtitle: {
      fontSize: 16,
      color: theme.foregroundSecondary,
      marginTop: 4
    },
    surveysList: {
      padding: 16,
      paddingTop: 0
    },
    surveyCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border
    },
    surveyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8
    },
    surveyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.foreground,
      flex: 1
    },
    incentiveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF3E0',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 16,
      marginLeft: 8
    },
    incentiveText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#F57C00',
      marginLeft: 4
    },
    surveyDescription: {
      fontSize: 14,
      color: theme.foregroundSecondary,
      lineHeight: 20,
      marginBottom: 12
    },
    surveyMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
      marginTop: 4
    },
    metaText: {
      fontSize: 14,
      color: theme.foregroundSecondary,
      marginLeft: 4
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.foreground,
      marginTop: 16
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.foregroundSecondary,
      marginTop: 8
    }
  });

  useEffect(() => {
    loadSurveys();
    checkUnclaimedRewards();
  }, [user]);

  const loadSurveys = async () => {
    try {
      const activeSurveys = await SurveyService.getActiveSurveys(user?.id);
      setSurveys(activeSurveys);
    } catch (error) {
      console.error('Error loading surveys:', error);
      Alert.alert('Error', 'Failed to load surveys. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const checkUnclaimedRewards = async () => {
    try {
      const rewards = await SurveyService.getUnclaimedRewards(user?.id, guestToken);
      setUnclaimedRewards(rewards);
    } catch (error) {
      console.error('Error checking rewards:', error);
    }
  };

  const handleSurveyPress = (survey: Survey) => {
    router.push({
      pathname: '/surveys/[id]',
      params: { id: survey.id }
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([loadSurveys(), checkUnclaimedRewards()]);
  };

  const renderUnclaimedRewards = () => {
    if (unclaimedRewards.length === 0) return null;

    return (
      <TouchableOpacity
        style={styles.rewardsNotification}
        onPress={() => router.push('/surveys/rewards')}
      >
        <MaterialIcons name="card-giftcard" size={24} color={theme.primary} />
        <View style={styles.rewardsTextContainer}>
          <Text style={styles.rewardsTitle}>You have unclaimed rewards!</Text>
          <Text style={styles.rewardsSubtitle}>
            {unclaimedRewards.length} reward{unclaimedRewards.length !== 1 ? 's' : ''} waiting
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={theme.foregroundSecondary} />
      </TouchableOpacity>
    );
  };

  const renderSurveyCard = (survey: Survey) => {
    const hasIncentive = false; // Incentives need to be fetched separately
    const incentive = null;

    return (
      <TouchableOpacity
        key={survey.id}
        style={styles.surveyCard}
        onPress={() => handleSurveyPress(survey)}
        activeOpacity={0.7}
      >
        <View style={styles.surveyHeader}>
          <Text style={styles.surveyTitle}>{survey.title}</Text>
          {hasIncentive && (
            <View style={styles.incentiveBadge}>
              <MaterialIcons name="star" size={16} color="#FFA000" />
              <Text style={styles.incentiveText}>Reward</Text>
            </View>
          )}
        </View>

        <Text style={styles.surveyDescription} numberOfLines={2}>
          {survey.description}
        </Text>

        <View style={styles.surveyMeta}>
          <View style={styles.metaItem}>
            <MaterialIcons name="timer" size={16} color={theme.foregroundSecondary} />
            <Text style={styles.metaText}>
              ~{survey.estimated_time || 5} min
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <MaterialIcons name="quiz" size={16} color={theme.foregroundSecondary} />
            <Text style={styles.metaText}>
              {survey.questions?.length || 0} questions
            </Text>
          </View>

          {/* Incentives to be implemented when needed */}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading surveys...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <QuickRefreshControl
          onCustomRefresh={async () => {
            setIsRefreshing(true);
            await Promise.all([loadSurveys(), checkUnclaimedRewards()]);
            setIsRefreshing(false);
          }}
          onRefreshComplete={(success) => {
            if (success) {
              console.log('✅ Surveys refreshed successfully');
            }
          }}
        />
      }
    >
      {renderUnclaimedRewards()}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Surveys</Text>
        <Text style={styles.headerSubtitle}>
          Help us improve by sharing your feedback
        </Text>
      </View>

      {surveys.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="inbox" size={64} color={theme.border} />
          <Text style={styles.emptyTitle}>No surveys available</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for new surveys
          </Text>
        </View>
      ) : (
        <View style={styles.surveysList}>
          {surveys.map(renderSurveyCard)}
        </View>
      )}
    </ScrollView>
  );
}

 