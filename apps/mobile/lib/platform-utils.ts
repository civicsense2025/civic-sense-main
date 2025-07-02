import { Platform } from 'react-native'

// Define feature availability based on platform
const FEATURES = {
  audio: Platform.OS !== 'web', // TrackPlayer only on native
  push: Platform.OS !== 'web',  // Push notifications
  haptics: Platform.OS !== 'web', // Haptic feedback
  nativeNavigation: Platform.OS !== 'web',
  biometrics: Platform.OS !== 'web',
  fileSystem: true, // Available on all platforms but different APIs
} as const

type FeatureKey = keyof typeof FEATURES

const IS_WEB = Platform.OS === 'web'
const IS_NATIVE = Platform.OS !== 'web'
const IS_IOS = Platform.OS === 'ios'
const IS_ANDROID = Platform.OS === 'android'

export const PlatformUtils = {
  // Platform detection
  isWeb: IS_WEB,
  isNative: IS_NATIVE,
  isIOS: IS_IOS,
  isAndroid: IS_ANDROID,
  
  // Feature availability
  features: FEATURES,
  
  // Conditional execution helpers
  runOnNative: <T>(fn: () => T, fallback?: T): T | undefined => {
    return IS_NATIVE ? fn() : fallback
  },
  
  runOnWeb: <T>(fn: () => T, fallback?: T): T | undefined => {
    return IS_WEB ? fn() : fallback
  },
  
  // Safe feature access
  withFeatureCheck: <T>(
    feature: FeatureKey,
    fn: () => T,
    fallback?: T
  ): T | undefined => {
    return FEATURES[feature] ? fn() : fallback
  }
} as const

// Export individual utilities for convenience
export const { isWeb, isNative, isIOS, isAndroid, features } = PlatformUtils 