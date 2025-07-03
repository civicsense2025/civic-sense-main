import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationPermissions {
  status: Notifications.PermissionStatus;
  canAskAgain: boolean;
  granted: boolean;
}

interface NotificationSettings {
  civicUpdates: boolean;
  quizReminders: boolean;
  multiplayerInvites: boolean;
  achievements: boolean;
}

export class NotificationsService {
  private static instance: NotificationsService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NotificationsService {
    if (!NotificationsService.instance) {
      NotificationsService.instance = new NotificationsService();
    }
    return NotificationsService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure notifications
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Load saved settings
      await this.loadSettings();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      throw error;
    }
  }

  async requestPermissions(): Promise<NotificationPermissions> {
    if (!Device.isDevice) {
      return {
        status: Notifications.PermissionStatus.UNDETERMINED,
        canAskAgain: false,
        granted: false,
      };
    }

    let finalStatus = await Notifications.getPermissionsAsync();

    // Only ask if permissions haven't been determined
    if (finalStatus.status === Notifications.PermissionStatus.UNDETERMINED) {
      finalStatus = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
    }

    return {
      status: finalStatus.status,
      canAskAgain: finalStatus.canAskAgain,
      granted: finalStatus.granted,
    };
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      const permissions = await this.requestPermissions();
      
      if (!permissions.granted) {
        return null;
      }

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID,
      });

      // Platform-specific setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  async getSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem('notification_settings');
      if (settings) {
        return JSON.parse(settings);
      }
    } catch (error) {
      console.warn('Failed to load notification settings:', error);
    }

    // Default settings
    return {
      civicUpdates: true,
      quizReminders: true,
      multiplayerInvites: true,
      achievements: true,
    };
  }

  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  private async loadSettings(): Promise<void> {
    const settings = await this.getSettings();
    
    // Apply settings to notification channels (Android)
    if (Platform.OS === 'android') {
      await this.updateAndroidChannels(settings);
    }
  }

  private async updateAndroidChannels(settings: NotificationSettings): Promise<void> {
    if (Platform.OS !== 'android') return;

    const channels = [
      {
        id: 'civic_updates',
        name: 'Civic Updates',
        importance: settings.civicUpdates ? 
          Notifications.AndroidImportance.HIGH : 
          Notifications.AndroidImportance.MIN,
      },
      {
        id: 'quiz_reminders',
        name: 'Quiz Reminders',
        importance: settings.quizReminders ? 
          Notifications.AndroidImportance.DEFAULT : 
          Notifications.AndroidImportance.MIN,
      },
      {
        id: 'multiplayer',
        name: 'Multiplayer Invites',
        importance: settings.multiplayerInvites ? 
          Notifications.AndroidImportance.HIGH : 
          Notifications.AndroidImportance.MIN,
      },
      {
        id: 'achievements',
        name: 'Achievements',
        importance: settings.achievements ? 
          Notifications.AndroidImportance.DEFAULT : 
          Notifications.AndroidImportance.MIN,
      },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: channel.importance,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }
}

// Export singleton instance
export const notificationsService = NotificationsService.getInstance(); 