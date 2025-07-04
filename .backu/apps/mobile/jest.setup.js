/**
 * Jest Setup for CivicSense Mobile Testing
 * 
 * Mocks React Native and Expo modules that are not available in the test environment
 */

import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-auth-session
jest.mock('expo-auth-session', () => ({
  AuthRequest: jest.fn(),
  ResponseType: {
    Code: 'code',
  },
  makeRedirectUri: jest.fn(() => 'com.civicsense.app://oauth/google'),
}));

// Mock expo-auth-session/providers/google
jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(() => [
    { promptAsync: jest.fn() },
    null,
    jest.fn(),
  ]),
  GoogleAuthRequest: jest.fn(),
  ResponseType: {
    Code: 'code',
  },
  makeRedirectUri: jest.fn(() => 'com.civicsense.app://oauth/google'),
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Stack: () => null,
  Tabs: () => null,
}));

// Mock react-native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return Object.setPrototypeOf(
    {
      ...RN,
      Platform: {
        ...RN.Platform,
        OS: 'ios',
        select: (platforms) => platforms.ios || platforms.default,
      },
      Alert: {
        alert: jest.fn(),
      },
      Dimensions: {
        get: jest.fn(() => ({ width: 375, height: 812 })),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      PanResponder: {
        create: jest.fn(() => ({
          panHandlers: {},
        })),
      },
      Animated: {
        ...RN.Animated,
        timing: jest.fn(() => ({
          start: jest.fn(),
        })),
        spring: jest.fn(() => ({
          start: jest.fn(),
        })),
        sequence: jest.fn(() => ({
          start: jest.fn(),
        })),
        Value: jest.fn(() => ({
          setValue: jest.fn(),
          interpolate: jest.fn(),
        })),
        ValueXY: jest.fn(() => ({
          setValue: jest.fn(),
          x: { interpolate: jest.fn() },
          y: { interpolate: jest.fn() },
        })),
      },
    },
    RN
  );
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock @expo/vector-icons (this is actually used)
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));

// Note: Supabase mock removed since it's not used in calendar service tests

// Global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  })
);

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock timers
jest.useFakeTimers(); 