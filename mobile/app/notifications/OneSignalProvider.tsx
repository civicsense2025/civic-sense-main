import React, { createContext, useContext, useEffect, useState } from 'react';
import { OneSignal, OSNotification } from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';

interface OneSignalContextType {
  isInitialized: boolean;
  playerId: string | null;
  permissionGranted: boolean;
  requestPermission: () => Promise<void>;
  setUserTags: (tags: Record<string, any>) => Promise<void>;
  trackCivicEvent: (eventType: string, data?: any) => Promise<void>;
}

const OneSignalContext = createContext<OneSignalContextType | null>(null);

export const useOneSignal = () => {
  const context = useContext(OneSignalContext);
  if (!context) {
    throw new Error('useOneSignal must be used within OneSignalProvider');
  }
  return context;
};

interface OneSignalProviderProps {
  children: React.ReactNode;
}

export function OneSignalProvider({ children }: OneSignalProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    initializeOneSignal();
  }, []);

  useEffect(() => {
    if (user && playerId) {
      updateUserSubscription();
      syncCivicTags();
    }
  }, [user, playerId]);

  const initializeOneSignal = async () => {
    try {
      // Initialize OneSignal
      OneSignal.initialize(process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || '');

      // Request permission
      const hasPermission = await OneSignal.Notifications.hasPermission();
      setPermissionGranted(hasPermission);

      // Get player ID
      const currentPlayerId = await OneSignal.User.getOnesignalId();
      if (currentPlayerId) {
        setPlayerId(currentPlayerId);
        await AsyncStorage.setItem('onesignal_player_id', currentPlayerId);
      }

      // Set up notification event handlers
      OneSignal.Notifications.addEventListener('click', handleNotificationClick);
      OneSignal.Notifications.addEventListener('foregroundWillDisplay', handleNotificationReceived);

      // Set up subscription change listener
      OneSignal.User.addEventListener('change', handleUserChange);

      setIsInitialized(true);
    } catch (error) {
      console.error('OneSignal initialization failed:', error);
    }
  };

  const requestPermission = async () => {
    try {
      const granted = await OneSignal.Notifications.requestPermission(true);
      setPermissionGranted(granted);
      
      if (granted) {
        // Get new player ID after permission granted
        const newPlayerId = await OneSignal.User.getOnesignalId();
        if (newPlayerId) {
          setPlayerId(newPlayerId);
          await AsyncStorage.setItem('onesignal_player_id', newPlayerId);
        }
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  const updateUserSubscription = async () => {
    if (!user || !playerId) return;

    try {
      // Set external user ID in OneSignal
      OneSignal.login(user.id);

      // Get OneSignal provider ID from generic notification system
      const { data: oneSignalProvider } = await supabase
        .from('notification_providers')
        .select('id')
        .eq('provider_name', 'OneSignal')
        .single();

      if (oneSignalProvider) {
        // Update subscription in generic notification system
        const { error } = await supabase
          .from('user_notification_subscriptions')
          .upsert({
            user_id: user.id,
            provider_id: oneSignalProvider.id,
            external_user_id: playerId, // OneSignal player ID
            subscription_data: {
              platform: 'mobile',
              push_enabled: permissionGranted,
              email: user.email,
              session_count: 1,
              notification_preferences: {
                quiz_reminders: true,
                voting_alerts: true,
                news_updates: true,
                civic_actions: true,
                breaking_news: true,
              },
            },
            is_subscribed: true,
            civic_tags: [],
            last_activity_at: new Date().toISOString(),
          });
        
        if (error) {
          console.error('Error updating subscription:', error);
        }
      }
    } catch (error) {
      console.error('Error updating user subscription:', error);
    }
  };

  const syncCivicTags = async () => {
    if (!user) return;

    try {
      // Get user's civic tags from generic notification subscription
      const { data: subscription } = await supabase
        .from('user_notification_subscriptions')
        .select('civic_tags, subscription_data')
        .eq('user_id', user.id)
        .eq('provider_id', (await supabase
          .from('notification_providers')
          .select('id')
          .eq('provider_name', 'OneSignal')
          .single()).data?.id)
        .single();

      if (subscription) {
        // Convert civic tags to OneSignal format
        const civicTags = subscription.civic_tags || [];
        const subscriptionData = subscription.subscription_data || {};
        
        const tags = {
          civic_engagement_level: civicTags.find((tag: any) => tag.key === 'civic_engagement_level')?.value || 'beginner',
          location_state: civicTags.find((tag: any) => tag.key === 'location_state')?.value || '',
          quiz_completion_rate: civicTags.find((tag: any) => tag.key === 'quiz_completion_rate')?.value || '0',
          voting_status: civicTags.find((tag: any) => tag.key === 'voting_status')?.value || 'unknown',
        };

        // Set tags in OneSignal
        OneSignal.User.addTags(tags);
      }
    } catch (error) {
      console.error('Error syncing civic tags:', error);
    }
  };

  const setUserTags = async (tags: Record<string, any>) => {
    try {
      // Set tags in OneSignal
      OneSignal.User.addTags(tags);

      // Update in generic notification system
      if (user) {
        const { data: oneSignalProvider } = await supabase
          .from('notification_providers')
          .select('id')
          .eq('provider_name', 'OneSignal')
          .single();

        if (oneSignalProvider) {
          // Convert tags to civic_tags format
          const civicTags = Object.entries(tags).map(([key, value]) => ({
            key,
            value: value.toString(),
            updated_at: new Date().toISOString()
          }));

          // Update the civic_tags in the subscription
          const { error } = await supabase
            .from('user_notification_subscriptions')
            .update({ 
              civic_tags: civicTags,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('provider_id', oneSignalProvider.id);

          if (error) {
            console.error('Error updating civic tags:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error setting user tags:', error);
    }
  };

  const trackCivicEvent = async (eventType: string, data?: any) => {
    if (!user) return;

    try {
      // Track in generic civic engagement system
      await supabase
        .from('civic_engagement_events')
        .insert({
          user_id: user.id,
          event_type: eventType,
          event_data: data || {},
          engagement_score: data?.impact_score || 1,
        });

      // Also track as a custom event in OneSignal
      OneSignal.Session.addOutcome(eventType, data?.value || 1);
    } catch (error) {
      console.error('Error tracking civic event:', error);
    }
  };

  const handleNotificationClick = async (event: any) => {
    try {
      const notification = event.notification;
      const notificationData = notification.additionalData;

      // Track notification click in generic system
      await trackCivicEvent('notification_clicked', {
        notification_id: notification.notificationId,
        campaign_type: notificationData?.campaign_type,
        content_type: notificationData?.content_type,
        content_id: notificationData?.content_id,
      });

      // Also track as notification event
      if (notificationData?.campaign_id) {
        await supabase
          .from('notification_events')
          .insert({
            campaign_id: notificationData.campaign_id,
            provider_id: (await supabase
              .from('notification_providers')
              .select('id')
              .eq('provider_name', 'OneSignal')
              .single()).data?.id,
            user_id: user?.id,
            external_notification_id: notification.notificationId,
            event_type: 'clicked',
            event_data: notificationData,
          });
      }

      // Handle deep linking
      if (notificationData?.deep_link) {
        // Use your navigation system here
        // navigation.navigate(notificationData.deep_link);
      }

      // Handle civic actions
      if (notificationData?.civic_action_steps) {
        // Show civic actions modal or navigate to action screen
        console.log('Civic actions available:', notificationData.civic_action_steps);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleNotificationReceived = async (event: any) => {
    try {
      const notification = event.notification;
      const notificationData = notification.additionalData;

      // Track notification received
      await trackCivicEvent('notification_received', {
        notification_id: notification.notificationId,
        campaign_type: notificationData?.campaign_type,
      });

      // Track as notification event
      if (notificationData?.campaign_id) {
        await supabase
          .from('notification_events')
          .insert({
            campaign_id: notificationData.campaign_id,
            provider_id: (await supabase
              .from('notification_providers')
              .select('id')
              .eq('provider_name', 'OneSignal')
              .single()).data?.id,
            user_id: user?.id,
            external_notification_id: notification.notificationId,
            event_type: 'delivered',
            event_data: notificationData,
          });
      }

      // Custom display logic for civic notifications
      if (notificationData?.civic_urgency_level >= 4) {
        // High urgency - show immediately
        event.preventDefault = false;
      } else {
        // Normal priority - use default display
        event.preventDefault = false;
      }
    } catch (error) {
      console.error('Error handling notification received:', error);
    }
  };

  const handleUserChange = async (event: any) => {
    try {
      const newPlayerId = event.current.onesignalId;
      if (newPlayerId && newPlayerId !== playerId) {
        setPlayerId(newPlayerId);
        await AsyncStorage.setItem('onesignal_player_id', newPlayerId);
        
        if (user) {
          await updateUserSubscription();
        }
      }
    } catch (error) {
      console.error('Error handling user change:', error);
    }
  };

  const contextValue: OneSignalContextType = {
    isInitialized,
    playerId,
    permissionGranted,
    requestPermission,
    setUserTags,
    trackCivicEvent,
  };

  return (
    <OneSignalContext.Provider value={contextValue}>
      {children}
    </OneSignalContext.Provider>
  );
}

// Helper hook for quiz-related notifications
export const useCivicNotifications = () => {
  const { trackCivicEvent, setUserTags } = useOneSignal();

  const trackQuizCompletion = async (quizId: string, score: number, topic: string) => {
    await trackCivicEvent('quiz_completed', {
      content_type: 'quiz',
      content_id: quizId,
      score,
      topic,
      impact_score: Math.min(Math.floor(score / 10), 10), // Convert score to 1-10 scale
    });

    // Update civic engagement level based on performance
    if (score >= 80) {
      await setUserTags({ civic_engagement_level: 'advanced' });
    } else if (score >= 60) {
      await setUserTags({ civic_engagement_level: 'intermediate' });
    }
  };

  const trackVotingAction = async (action: string, location?: string) => {
    await trackCivicEvent('voting_action', {
      action,
      location,
      impact_score: 10, // Voting actions have high civic impact
    });

    // Update voting status
    if (action === 'registered') {
      await setUserTags({ voting_status: 'registered' });
    }
  };

  const trackNewsEngagement = async (articleId: string, engagementType: string) => {
    await trackCivicEvent('news_engagement', {
      content_type: 'news',
      content_id: articleId,
      engagement_type: engagementType,
      impact_score: engagementType === 'shared' ? 5 : 2,
    });
  };

  return {
    trackQuizCompletion,
    trackVotingAction,
    trackNewsEngagement,
  };
}; 