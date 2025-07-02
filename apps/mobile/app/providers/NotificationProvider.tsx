import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationPermissions {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
}

interface NotificationContextType {
  permissions: NotificationPermissions;
  isEnabled: boolean;
  requestPermissions: () => Promise<boolean>;
  scheduleLocalNotification: (title: string, body: string, delay?: number) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  getNotificationSettings: () => Promise<any>;
  updateNotificationSettings: (settings: any) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [permissions, setPermissions] = useState<NotificationPermissions>({
    status: 'undetermined',
    canAskAgain: true,
  });

  const requestPermissions = async (): Promise<boolean> => {
    try {
      // For now, we'll simulate permission request
      // In a real app, you'd use expo-notifications
      const granted = true; // Simulate granted permission
      
      const newPermissions: NotificationPermissions = {
        status: granted ? 'granted' : 'denied',
        canAskAgain: !granted,
      };
      
      setPermissions(newPermissions);
      await AsyncStorage.setItem('notificationPermissions', JSON.stringify(newPermissions));
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  const scheduleLocalNotification = async (
    title: string, 
    body: string, 
    delay: number = 0
  ): Promise<void> => {
    try {
      if (permissions.status !== 'granted') {
        console.log('Notifications not permitted');
        return;
      }

      // In a real app, you'd use expo-notifications to schedule
      console.log(`Scheduled notification: ${title} - ${body} (delay: ${delay}ms)`);
      
      // Store for mock purposes
      const notifications = await AsyncStorage.getItem('scheduledNotifications') || '[]';
      const parsed = JSON.parse(notifications);
      parsed.push({
        id: Date.now().toString(),
        title,
        body,
        scheduledFor: Date.now() + delay,
      });
      
      await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(parsed));
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const clearAllNotifications = async (): Promise<void> => {
    try {
      // In a real app, you'd use expo-notifications to cancel all
      await AsyncStorage.removeItem('scheduledNotifications');
      console.log('Cleared all notifications');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getNotificationSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      return settings ? JSON.parse(settings) : {
        dailyReminders: true,
        quizCompletions: true,
        multiplayerInvites: true,
        achievements: true,
        newsUpdates: false,
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {};
    }
  };

  const updateNotificationSettings = async (settings: any): Promise<void> => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
      console.log('Updated notification settings:', settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeNotifications = async () => {
      try {
        // Load cached permissions
        const cachedPermissions = await AsyncStorage.getItem('notificationPermissions');
        if (cachedPermissions && mounted) {
          setPermissions(JSON.parse(cachedPermissions));
        }

        // Check current permissions (in a real app, you'd check actual permissions)
        // For now, we'll just use the cached value or default
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  const value = {
    permissions,
    isEnabled: permissions.status === 'granted',
    requestPermissions,
    scheduleLocalNotification,
    clearAllNotifications,
    getNotificationSettings,
    updateNotificationSettings,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Add default export
export default NotificationProvider; 