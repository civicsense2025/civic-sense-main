import { OneSignal } from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@/lib/supabase/client';

export interface CivicNotificationData {
  type: 'quiz_reminder' | 'voting_alert' | 'news_update' | 'civic_action' | 'educational_content' | 'breaking_news';
  title: string;
  message: string;
  action_url?: string;
  deep_link?: string;
  civic_action_steps?: string[];
  urgency_level?: 1 | 2 | 3 | 4 | 5;
  related_topic_id?: string;
  quiz_id?: string;
  event_id?: string;
  source_url?: string;
  expiry_date?: string;
}

export interface CivicUserTags {
  civic_engagement_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  topics_of_interest: string[];
  preferred_notification_time: 'morning' | 'afternoon' | 'evening';
  location_state?: string;
  location_district?: string;
  quiz_completion_rate?: number;
  last_quiz_date?: string;
  voting_status?: 'registered' | 'unregistered' | 'unknown';
  age_group?: '18-25' | '26-35' | '36-50' | '51-65' | '65+';
  political_engagement?: 'low' | 'medium' | 'high';
}

class MobileOneSignalService {
  private supabase = createClient();
  private isInitialized = false;
  private userId: string | null = null;

  /**
   * Initialize OneSignal for mobile app
   */
  async initialize(appId: string): Promise<void> {
    try {
      console.log('🔔 Initializing OneSignal for mobile...');
      
      // Initialize OneSignal
      OneSignal.initialize(appId);
      
      // Request permission for notifications
      const permission = await OneSignal.Notifications.requestPermission(true);
      console.log('📱 Notification permission:', permission);
      
      // Set up notification event handlers
      this.setupNotificationHandlers();
      
      // Set up user state handlers
      this.setupUserStateHandlers();
      
      this.isInitialized = true;
      console.log('✅ OneSignal mobile service initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize OneSignal:', error);
      throw error;
    }
  }

  /**
   * Set up notification event handlers with civic education context
   */
  private setupNotificationHandlers(): void {
    // Handle notification received while app is in foreground
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      console.log('📨 Notification received in foreground:', event.notification);
      
      const notificationData = event.notification.additionalData as CivicNotificationData;
      
      // Show custom in-app notification for civic content
      if (notificationData?.type) {
        this.handleCivicNotificationReceived(event.notification, notificationData);
      }
      
      // Complete with the notification (shows system notification)
      event.getNotification().display();
    });

    // Handle notification clicked/opened
    OneSignal.Notifications.addEventListener('click', (event) => {
      console.log('👆 Notification clicked:', event.notification);
      
      const notificationData = event.notification.additionalData as CivicNotificationData;
      
      if (notificationData) {
        this.handleCivicNotificationClicked(event.notification, notificationData);
      }
    });
  }

  /**
   * Set up user state change handlers
   */
  private setupUserStateHandlers(): void {
    // Handle push subscription changes
    OneSignal.User.addEventListener('pushSubscriptionChange', (event) => {
      console.log('📱 Push subscription changed:', event);
      
      if (event.current.token) {
        this.updateUserSubscriptionStatus(true, event.current.token);
      } else {
        this.updateUserSubscriptionStatus(false);
      }
    });

    // Handle user ID changes
    OneSignal.User.addEventListener('onesignalIdChange', (event) => {
      console.log('🆔 OneSignal ID changed:', event);
      
      if (event.current.onesignalId) {
        this.updateUserOneSignalId(event.current.onesignalId);
      }
    });
  }

  /**
   * Handle civic notification received in foreground
   */
  private async handleCivicNotificationReceived(
    notification: any, 
    civicData: CivicNotificationData
  ): Promise<void> {
    try {
      // Log notification received for analytics
      await this.logNotificationEvent('received', notification.notificationId, civicData);
      
      // Store notification for later reference if needed
      await this.storeNotificationHistory(notification, civicData);
      
      // Show custom civic notification UI if appropriate
      if (civicData.urgency_level && civicData.urgency_level >= 4) {
        this.showUrgentCivicAlert(notification, civicData);
      }
      
    } catch (error) {
      console.error('Error handling civic notification received:', error);
    }
  }

  /**
   * Handle civic notification clicked
   */
  private async handleCivicNotificationClicked(
    notification: any, 
    civicData: CivicNotificationData
  ): Promise<void> {
    try {
      // Log notification opened for analytics
      await this.logNotificationEvent('opened', notification.notificationId, civicData);
      
      // Navigate based on notification type
      await this.navigateBasedOnNotificationType(civicData);
      
      // Track civic engagement
      await this.trackCivicEngagement(civicData);
      
    } catch (error) {
      console.error('Error handling civic notification clicked:', error);
    }
  }

  /**
   * Set user ID and sync with CivicSense profile
   */
  async setUser(userId: string, userProfile?: any): Promise<void> {
    try {
      this.userId = userId;
      
      // Set external user ID in OneSignal
      OneSignal.login(userId);
      
      // Sync user profile data if provided
      if (userProfile) {
        await this.syncUserProfile(userProfile);
      }
      
      console.log('👤 OneSignal user set:', userId);
      
    } catch (error) {
      console.error('Error setting OneSignal user:', error);
    }
  }

  /**
   * Update civic user tags for targeted notifications
   */
  async updateCivicUserTags(tags: Partial<CivicUserTags>): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.warn('OneSignal not initialized, cannot update tags');
        return;
      }

      // Convert civic tags to OneSignal format
      const oneSignalTags: Record<string, string> = {};

      Object.entries(tags).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            oneSignalTags[key] = value.join(',');
          } else {
            oneSignalTags[key] = value.toString();
          }
        }
      });

      // Add CivicSense specific tags
      oneSignalTags['app_type'] = 'civicsense';
      oneSignalTags['platform'] = 'mobile';
      oneSignalTags['last_tag_update'] = new Date().toISOString();

      // Set tags in OneSignal
      OneSignal.User.addTags(oneSignalTags);
      
      // Store tags in Supabase for admin reference
      await this.storeUserTagsInDatabase(tags);
      
      console.log('🏷️ Updated civic user tags:', oneSignalTags);
      
    } catch (error) {
      console.error('Error updating civic user tags:', error);
    }
  }

  /**
   * Send a targeted civic notification (for testing/admin use)
   */
  async sendTestCivicNotification(
    title: string,
    message: string,
    civicData: Partial<CivicNotificationData>
  ): Promise<void> {
    try {
      // This would typically be called from the admin panel
      // Here we just log for testing purposes
      console.log('📤 Test civic notification:', { title, message, civicData });
      
      // In a real implementation, this would call the admin API
      // to send a notification through the backend
      
    } catch (error) {
      console.error('Error sending test civic notification:', error);
    }
  }

  /**
   * Track quiz completion for notification targeting
   */
  async trackQuizCompletion(quizId: string, score: number, topicId: string): Promise<void> {
    try {
      const completionRate = await this.calculateQuizCompletionRate();
      
      await this.updateCivicUserTags({
        quiz_completion_rate: completionRate,
        last_quiz_date: new Date().toISOString(),
        civic_engagement_level: this.calculateEngagementLevel(completionRate, score)
      });
      
      // Update interests based on quiz topic
      await this.updateTopicInterests(topicId);
      
    } catch (error) {
      console.error('Error tracking quiz completion:', error);
    }
  }

  /**
   * Track voting-related actions
   */
  async trackVotingAction(action: 'registered' | 'voted' | 'polling_location_searched'): Promise<void> {
    try {
      const tags: Partial<CivicUserTags> = {};
      
      if (action === 'registered') {
        tags.voting_status = 'registered';
        tags.political_engagement = 'high';
      }
      
      await this.updateCivicUserTags(tags);
      
      // Log the action for analytics
      await this.logCivicAction(action);
      
    } catch (error) {
      console.error('Error tracking voting action:', error);
    }
  }

  /**
   * Set user location for location-based notifications
   */
  async setUserLocation(state: string, district?: string): Promise<void> {
    try {
      await this.updateCivicUserTags({
        location_state: state,
        location_district: district
      });
      
      console.log('📍 Updated user location:', { state, district });
      
    } catch (error) {
      console.error('Error setting user location:', error);
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(limit: number = 50): Promise<any[]> {
    try {
      const history = await AsyncStorage.getItem('civic_notification_history');
      if (history) {
        const parsed = JSON.parse(history);
        return parsed.slice(0, limit);
      }
      return [];
      
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  /**
   * Clear notification history
   */
  async clearNotificationHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem('civic_notification_history');
      console.log('🗑️ Notification history cleared');
      
    } catch (error) {
      console.error('Error clearing notification history:', error);
    }
  }

  // Private helper methods

  private async calculateQuizCompletionRate(): Promise<number> {
    try {
      const { data: attempts } = await this.supabase
        .from('user_quiz_attempts')
        .select('score, completed')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!attempts || attempts.length === 0) return 0;

      const completedQuizzes = attempts.filter(a => a.completed).length;
      return Math.round((completedQuizzes / attempts.length) * 100);

    } catch (error) {
      console.error('Error calculating quiz completion rate:', error);
      return 0;
    }
  }

  private calculateEngagementLevel(completionRate: number, recentScore: number): CivicUserTags['civic_engagement_level'] {
    if (completionRate >= 80 && recentScore >= 90) return 'expert';
    if (completionRate >= 60 && recentScore >= 75) return 'advanced';
    if (completionRate >= 40 && recentScore >= 60) return 'intermediate';
    return 'beginner';
  }

  private async updateTopicInterests(topicId: string): Promise<void> {
    try {
      const storedInterests = await AsyncStorage.getItem('civic_topic_interests');
      let interests: string[] = storedInterests ? JSON.parse(storedInterests) : [];
      
      if (!interests.includes(topicId)) {
        interests.push(topicId);
        
        // Keep only the last 10 topics
        if (interests.length > 10) {
          interests = interests.slice(-10);
        }
        
        await AsyncStorage.setItem('civic_topic_interests', JSON.stringify(interests));
        
        await this.updateCivicUserTags({
          topics_of_interest: interests
        });
      }
      
    } catch (error) {
      console.error('Error updating topic interests:', error);
    }
  }

  private async syncUserProfile(userProfile: any): Promise<void> {
    try {
      const tags: Partial<CivicUserTags> = {};
      
      if (userProfile.age) {
        tags.age_group = this.getAgeGroup(userProfile.age);
      }
      
      if (userProfile.location) {
        tags.location_state = userProfile.location.state;
        tags.location_district = userProfile.location.district;
      }
      
      await this.updateCivicUserTags(tags);
      
    } catch (error) {
      console.error('Error syncing user profile:', error);
    }
  }

  private getAgeGroup(age: number): CivicUserTags['age_group'] {
    if (age >= 18 && age <= 25) return '18-25';
    if (age >= 26 && age <= 35) return '26-35';
    if (age >= 36 && age <= 50) return '36-50';
    if (age >= 51 && age <= 65) return '51-65';
    return '65+';
  }

  private async logNotificationEvent(
    event: 'received' | 'opened' | 'dismissed', 
    notificationId: string, 
    civicData: CivicNotificationData
  ): Promise<void> {
    try {
      await this.supabase
        .from('onesignal_notification_events')
        .insert({
          user_id: this.userId,
          notification_id: notificationId,
          event_type: event,
          notification_type: civicData.type,
          created_at: new Date().toISOString()
        });
        
    } catch (error) {
      console.error('Error logging notification event:', error);
    }
  }

  private async storeNotificationHistory(notification: any, civicData: CivicNotificationData): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      
      const newEntry = {
        id: notification.notificationId,
        title: notification.title,
        body: notification.body,
        civicData,
        receivedAt: new Date().toISOString()
      };
      
      history.unshift(newEntry);
      
      // Keep only the last 100 notifications
      const trimmedHistory = history.slice(0, 100);
      
      await AsyncStorage.setItem('civic_notification_history', JSON.stringify(trimmedHistory));
      
    } catch (error) {
      console.error('Error storing notification history:', error);
    }
  }

  private async storeUserTagsInDatabase(tags: Partial<CivicUserTags>): Promise<void> {
    try {
      if (!this.userId) return;
      
      await this.supabase
        .from('onesignal_user_tags')
        .upsert({
          user_id: this.userId,
          tags: tags,
          updated_at: new Date().toISOString()
        });
        
    } catch (error) {
      console.error('Error storing user tags in database:', error);
    }
  }

  private async navigateBasedOnNotificationType(civicData: CivicNotificationData): Promise<void> {
    // This would integrate with your navigation system
    console.log('🧭 Navigate based on type:', civicData.type);
    
    // Example navigation logic (you'd implement with your actual navigation)
    switch (civicData.type) {
      case 'quiz_reminder':
        if (civicData.quiz_id) {
          // Navigate to specific quiz
          console.log('Navigate to quiz:', civicData.quiz_id);
        }
        break;
      case 'voting_alert':
        // Navigate to voting information
        console.log('Navigate to voting info');
        break;
      case 'news_update':
        if (civicData.source_url) {
          // Open news article
          console.log('Open news:', civicData.source_url);
        }
        break;
      case 'civic_action':
        // Navigate to civic action page
        console.log('Navigate to civic action');
        break;
    }
  }

  private async trackCivicEngagement(civicData: CivicNotificationData): Promise<void> {
    try {
      await this.supabase
        .from('civic_engagement_events')
        .insert({
          user_id: this.userId,
          event_type: 'notification_opened',
          notification_type: civicData.type,
          related_content_id: civicData.related_topic_id || civicData.quiz_id,
          created_at: new Date().toISOString()
        });
        
    } catch (error) {
      console.error('Error tracking civic engagement:', error);
    }
  }

  private async logCivicAction(action: string): Promise<void> {
    try {
      await this.supabase
        .from('civic_engagement_events')
        .insert({
          user_id: this.userId,
          event_type: 'civic_action',
          action_details: { action },
          created_at: new Date().toISOString()
        });
        
    } catch (error) {
      console.error('Error logging civic action:', error);
    }
  }

  private showUrgentCivicAlert(notification: any, civicData: CivicNotificationData): void {
    // This would show a custom urgent alert UI
    console.log('🚨 Show urgent civic alert:', notification.title);
    
    // Example: You could use a custom modal or alert component
    // showUrgentAlertModal({
    //   title: notification.title,
    //   message: notification.body,
    //   actions: civicData.civic_action_steps || [],
    //   urgencyLevel: civicData.urgency_level
    // });
  }

  private async updateUserSubscriptionStatus(isSubscribed: boolean, token?: string): Promise<void> {
    try {
      if (!this.userId) return;
      
      await this.supabase
        .from('onesignal_user_subscriptions')
        .upsert({
          user_id: this.userId,
          is_subscribed: isSubscribed,
          push_token: token,
          platform: 'mobile',
          updated_at: new Date().toISOString()
        });
        
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  }

  private async updateUserOneSignalId(oneSignalId: string): Promise<void> {
    try {
      if (!this.userId) return;
      
      await this.supabase
        .from('onesignal_user_subscriptions')
        .update({
          onesignal_id: oneSignalId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId);
        
    } catch (error) {
      console.error('Error updating OneSignal ID:', error);
    }
  }
}

// Export singleton instance
export const mobileOneSignalService = new MobileOneSignalService();

// Export types for external use
export type { CivicNotificationData, CivicUserTags }; 