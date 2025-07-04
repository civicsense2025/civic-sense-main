import { ExpoConfig } from '@expo/config-types';
import { ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'CivicSense',
  slug: 'civicsense',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'civicsense',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  // Enable new architecture at the root level
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.civicsense.app',
    buildNumber: '1',
    requireFullScreen: false,
    userInterfaceStyle: 'automatic',
    infoPlist: {
      NSCameraUsageDescription: 'CivicSense needs camera access for profile photos',
      NSMicrophoneUsageDescription: 'CivicSense needs microphone access for voice features',
      NSCalendarsUsageDescription: 'CivicSense needs calendar access to sync your study schedule and quiz reminders with Google Calendar',
      NSRemindersUsageDescription: 'CivicSense needs reminders access to create study reminders and quiz notifications',
      UIBackgroundModes: ['remote-notification', 'background-fetch'],
      CFBundleAllowMixedLocalizations: true,
      ITSAppUsesNonExemptEncryption: false,
    },
    associatedDomains: ['applinks:civicsense.com'],
  },
  android: {
    package: 'com.civicsense.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#3B82F6',
      monochromeImage: './assets/adaptive-icon-monochrome.png',
    },
    userInterfaceStyle: 'automatic',
    permissions: [
      'CAMERA',
      'RECORD_AUDIO',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      'VIBRATE',
      'USE_FINGERPRINT',
      'USE_BIOMETRIC',
      'READ_CALENDAR',
      'WRITE_CALENDAR',
      'RECEIVE_BOOT_COMPLETED',
      'WAKE_LOCK',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_DATA_SYNC',
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'civicsense.com',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '15.1'
        },
        android: {
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          minSdkVersion: 24,
        }
      }
    ],
    [
      'react-native-edge-to-edge',
      {
        android: {
          parentTheme: "Material3.Dynamic",
          enforceNavigationBarContrast: false
        }
      }
    ],
    [
      'onesignal-expo-plugin',
      {
        mode: 'development',
        devTeam: process.env.APPLE_DEVELOPER_TEAM_ID,
        iPhoneDeploymentTarget: '15.1'
      }
    ],
  ],
  extra: {
    eas: {
      projectId: "866a036f-3dab-44e3-9bbd-e4e72f8cab0a"
    },
  },
  // Experiments disabled to align with React 18 / Expo SDK 53
  // experiments: {},
}); 