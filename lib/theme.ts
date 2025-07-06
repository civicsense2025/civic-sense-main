// CivicSense Mobile Design System
// Modern, minimal, clean aesthetic matching globals.css
// Based on atomic design principles and WCAG 2.2 AA compliance

import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Base units that scale with screen size but cap at reasonable maximums
const BASE_SPACING = Math.min(SCREEN_WIDTH * 0.04, 16); // Cap at 16px for large screens
const BASE_FONT_SIZE = Math.min(SCREEN_WIDTH * 0.04, 16);

// Maximum content width for larger screens
export const maxContentWidth = 1200;

// Responsive scaling factor based on screen width
const getResponsiveScale = () => {
  const baseWidth = 375; // Base width (iPhone SE)
  const scale = Math.min(SCREEN_WIDTH / baseWidth, 1.5); // Cap at 1.5x
  return scale;
};

// Responsive typography scale
const scale = getResponsiveScale();

// =============================================================================
// CIVICSENSE MOBILE THEME SYSTEM
// Apple-inspired design with responsive breakpoints
// =============================================================================

// Get initial screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// =============================================================================
// RESPONSIVE BREAKPOINTS (following W3Schools standards)
// =============================================================================

export const breakpoints = {
  // Mobile devices (phones, 600px and down)
  mobile: 600,
  
  // Small devices (portrait tablets and large phones, 600px and up)
  small: 600,
  
  // Medium devices (landscape tablets, 768px and up)
  medium: 768,
  
  // Large devices (laptops/desktops, 992px and up)
  large: 992,
  
  // Extra large devices (large laptops and desktops, 1200px and up)
  extraLarge: 1200,
} as const;

// Device type detection
export const getDeviceType = (width: number = screenWidth) => {
  if (width <= breakpoints.mobile) return 'mobile';
  if (width <= breakpoints.medium) return 'small';
  if (width <= breakpoints.large) return 'medium';
  if (width <= breakpoints.extraLarge) return 'large';
  return 'extraLarge';
};

// Media query utilities
export const mediaQueries = {
  mobile: `(max-width: ${breakpoints.mobile}px)`,
  small: `(min-width: ${breakpoints.small + 1}px)`,
  medium: `(min-width: ${breakpoints.medium + 1}px)`,
  large: `(min-width: ${breakpoints.large + 1}px)`,
  extraLarge: `(min-width: ${breakpoints.extraLarge + 1}px)`,
  
  // Orientation queries
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  
  // Combined queries
  mobilePortrait: `(max-width: ${breakpoints.mobile}px) and (orientation: portrait)`,
  mobileLandscape: `(max-width: ${breakpoints.mobile}px) and (orientation: landscape)`,
  tabletPortrait: `(min-width: ${breakpoints.small + 1}px) and (max-width: ${breakpoints.medium}px) and (orientation: portrait)`,
  tabletLandscape: `(min-width: ${breakpoints.small + 1}px) and (max-width: ${breakpoints.medium}px) and (orientation: landscape)`,
} as const;

// Responsive utility functions
export const responsive = {
  // Get value based on screen size
  getValue: <T>(values: {
    mobile?: T;
    small?: T;
    medium?: T;
    large?: T;
    extraLarge?: T;
    default: T;
  }, currentWidth: number = screenWidth): T => {
    const deviceType = getDeviceType(currentWidth);
    return values[deviceType] ?? values.default;
  },
  
  // Check if current screen matches breakpoint
  isDevice: (device: keyof typeof breakpoints, currentWidth: number = screenWidth): boolean => {
    switch (device) {
      case 'mobile':
        return currentWidth <= breakpoints.mobile;
      case 'small':
        return currentWidth > breakpoints.mobile && currentWidth <= breakpoints.medium;
      case 'medium':
        return currentWidth > breakpoints.medium && currentWidth <= breakpoints.large;
      case 'large':
        return currentWidth > breakpoints.large && currentWidth <= breakpoints.extraLarge;
      case 'extraLarge':
        return currentWidth > breakpoints.extraLarge;
      default:
        return false;
    }
  },
  
  // Get responsive spacing
  getSpacing: (values: {
    mobile?: number;
    small?: number;
    medium?: number;
    large?: number;
    extraLarge?: number;
    default: number;
  }, currentWidth: number = screenWidth): number => {
    return responsive.getValue(values, currentWidth);
  },
  
  // Get responsive font size
  getFontSize: (values: {
    mobile?: number;
    small?: number;
    medium?: number;
    large?: number;
    extraLarge?: number;
    default: number;
  }, currentWidth: number = screenWidth): number => {
    return responsive.getValue(values, currentWidth);
  },
} as const;

// =============================================================================
// FONT SYSTEM
// =============================================================================

// CivicSense font system with custom Helvetica Neue and Space Mono fonts
export const fontFamily = {
  // Primary system font - Helvetica Neue
  system: 'HelveticaNeue',
  systemBold: 'HelveticaNeue-Bold',
  systemMedium: 'HelveticaNeue-Medium',
  systemItalic: 'HelveticaNeue-Italic',
  
  // Display fonts (for headers and titles - using Helvetica Neue)
  display: 'HelveticaNeue',
  displayBold: 'HelveticaNeue-Bold',
  displayMedium: 'HelveticaNeue-Medium',
  
  // Monospace fonts (for dates, buttons, navigation - Space Mono)
  mono: 'SpaceMono-Regular',
  monoBold: 'SpaceMono-Bold',
  monoItalic: 'SpaceMono-Italic',
  monoBoldItalic: 'SpaceMono-BoldItalic',
  
  // Text fonts (for body text - using Helvetica Neue)
  text: 'HelveticaNeue',
  textBold: 'HelveticaNeue-Bold',
  textMedium: 'HelveticaNeue-Medium',
  textItalic: 'HelveticaNeue-Italic',
  
  // Legacy fallbacks for compatibility
  fallback: Platform.select({
    ios: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Arial, sans-serif',
    android: 'Roboto, Arial, sans-serif',
    default: 'Arial, sans-serif',
  }),
} as const;

// Font feature settings for better typography
export const fontFeatures = {
  rlig: 1, // Required ligatures
  calt: 1, // Contextual alternates
} as const;

// =============================================================================
// RESPONSIVE TYPOGRAPHY SYSTEM
// =============================================================================

export const typography = {
  // Display typography (responsive)
  titleLarge: {
    fontSize: responsive.getFontSize({
      mobile: 48,
      small: 56,
      medium: 60,
      default: 60,
    }),
    fontWeight: '400' as const,
    lineHeight: responsive.getFontSize({
      mobile: 56,
      small: 64,
      medium: 70,
      default: 70,
    }),
    letterSpacing: -0.02,
    fontFamily: fontFamily.display,
  },
  
  title: {
    fontSize: responsive.getFontSize({
      mobile: 28,
      small: 32,
      medium: 36,
      default: 36,
    }),
    fontWeight: '400' as const,
    lineHeight: responsive.getFontSize({
      mobile: 36,
      small: 40,
      medium: 45,
      default: 45,
    }),
    letterSpacing: -0.01,
    fontFamily: fontFamily.display,
  },
  
  title1: {
    fontSize: responsive.getFontSize({
      mobile: 24,
      small: 26,
      medium: 28,
      default: 28,
    }),
    fontWeight: '400' as const,
    lineHeight: responsive.getFontSize({
      mobile: 30,
      small: 33,
      medium: 36,
      default: 36,
    }),
    letterSpacing: -0.01,
    fontFamily: fontFamily.display,
  },
  
  title2: {
    fontSize: responsive.getFontSize({
      mobile: 20,
      small: 21,
      medium: 22,
      default: 22,
    }),
    fontWeight: '400' as const,
    lineHeight: responsive.getFontSize({
      mobile: 24,
      small: 26,
      medium: 28,
      default: 28,
    }),
    letterSpacing: -0.015,
    fontFamily: fontFamily.display,
  },
  
  title3: {
    fontSize: responsive.getFontSize({
      mobile: 18,
      small: 19,
      medium: 20,
      default: 20,
    }),
    fontWeight: '400' as const,
    lineHeight: responsive.getFontSize({
      mobile: 22,
      small: 24,
      medium: 25,
      default: 25,
    }),
    letterSpacing: -0.015,
    fontFamily: fontFamily.display,
  },
  
  headline: {
    fontSize: responsive.getFontSize({
      mobile: 20,
      small: 22,
      medium: 24,
      default: 24,
    }),
    fontWeight: '400' as const,
    lineHeight: responsive.getFontSize({
      mobile: 26,
      small: 28,
      medium: 31,
      default: 31,
    }),
    letterSpacing: -0.015,
    fontFamily: fontFamily.display,
  },
  
  subheadline: {
    fontSize: responsive.getFontSize({
      mobile: 16,
      small: 17,
      medium: 18,
      default: 18,
    }),
    fontWeight: '400' as const,
    lineHeight: responsive.getFontSize({
      mobile: 22,
      small: 24,
      medium: 25,
      default: 25,
    }),
    letterSpacing: -0.01,
    fontFamily: fontFamily.text,
  },
  
  body: {
    fontSize: responsive.getFontSize({
      mobile: 14,
      small: 15,
      medium: 16,
      default: 16,
    }),
    fontWeight: '400' as const,
    lineHeight: responsive.getFontSize({
      mobile: 20,
      small: 23,
      medium: 26,
      default: 26,
    }),
    letterSpacing: -0.005,
    fontFamily: fontFamily.text,
  },
  
  callout: {
    fontSize: responsive.getFontSize({
      mobile: 14,
      small: 15,
      medium: 16,
      default: 16,
    }),
    fontWeight: '400' as const,
    lineHeight: responsive.getFontSize({
      mobile: 18,
      small: 20,
      medium: 21,
      default: 21,
    }),
    letterSpacing: -0.01,
    fontFamily: fontFamily.text,
  },
  
  caption: {
    fontSize: responsive.getFontSize({
      mobile: 12,
      small: 13,
      medium: 14,
      default: 14,
    }),
    fontWeight: '400' as const,
    lineHeight: responsive.getFontSize({
      mobile: 16,
      small: 19,
      medium: 21,
      default: 21,
    }),
    letterSpacing: 0,
    fontFamily: fontFamily.text,
  },
  
  caption1: {
    fontSize: responsive.getFontSize({
      mobile: 10,
      small: 11,
      medium: 12,
      default: 12,
    }),
    fontWeight: '400' as const,
    lineHeight: responsive.getFontSize({
      mobile: 14,
      small: 15,
      medium: 16,
      default: 16,
    }),
    letterSpacing: 0,
    fontFamily: fontFamily.text,
  },
  
  footnote: {
    fontSize: responsive.getFontSize({
      mobile: 10,
      small: 11,
      medium: 12,
      default: 12,
    }),
    fontWeight: '400' as const,
    lineHeight: responsive.getFontSize({
      mobile: 14,
      small: 16,
      medium: 17,
      default: 17,
    }),
    letterSpacing: 0,
    fontFamily: fontFamily.text,
  },
} as const;

// =============================================================================
// COLOR SYSTEM (WCAG 2.2 AA Compliant)
// =============================================================================

export const colorTokens = {
  // Light mode colors - subtle greys and blues with black/white
  light: {
    background: '#FFFFFF',           // Pure white background
    foreground: '#1A1A1A',           // Rich black text
    foregroundSecondary: '#6B7280',  // Subtle grey secondary text
    foregroundTertiary: '#9CA3AF',   // Lighter grey tertiary text
    foregroundMuted: '#F9FAFB',      // Very light grey muted background
    
    card: '#FFFFFF',                 // Pure white cards
    cardForeground: '#1A1A1A',       // Rich black card text
    
    // Primary - Clean blue (not navy)
    primary: '#3B82F6',              // Clean blue
    primaryForeground: '#FFFFFF',    // White text on blue
    primaryLight: '#EBF4FF',         // Very light blue tint
    primaryDark: '#1E40AF',          // Darker blue for hover states
    
    // Secondary - Subtle grey
    secondary: '#F3F4F6',            // Light grey background
    secondaryForeground: '#1A1A1A',  // Black text on grey
    
    // Muted - Light grey backgrounds
    muted: '#F9FAFB',                // Very light grey
    mutedForeground: '#6B7280',      // Grey text on light backgrounds
    
    // Accent - Bright blue for highlights
    accent: '#2563EB',               // Bright blue accent
    accentForeground: '#FFFFFF',     // White text on accent
    accentLight: '#DBEAFE',          // Light blue background
    accentDark: '#1D4ED8',           // Darker blue
    
    // Status colors - no yellows
    destructive: '#EF4444',          // Red for errors
    destructiveForeground: '#FFFFFF', // White text on red
    
    success: '#10B981',              // Green for success
    successForeground: '#FFFFFF',    // White text on green
    successLight: '#D1FAE5',         // Light green background
    
    // Warning uses blue instead of yellow
    warning: '#3B82F6',              // Blue for warnings
    warningForeground: '#FFFFFF',    // White text on blue
    warningLight: '#EBF4FF',         // Light blue background
    
    // Interactive elements - subtle greys
    border: '#E5E7EB',               // Light grey borders
    input: '#F9FAFB',                // Light grey input backgrounds
    ring: '#3B82F6',                 // Blue focus rings
    
    // Surface variations
    surface: '#FAFBFC',              // Slightly off-white surface
    surfaceSecondary: '#F3F4F6',     // Light grey secondary surface
    
    // Multiplayer theme
    multiplayerBg: '#FAFBFC',
    multiplayerCard: '#FFFFFF',
    multiplayerCardHover: '#F9FAFB',
    multiplayerBorder: '#E5E7EB',
    multiplayerText: '#1A1A1A',
    multiplayerTextMuted: '#6B7280',
    multiplayerAccent: '#3B82F6',
    multiplayerAccentLight: '#EBF4FF',
    multiplayerSuccess: '#10B981',
    multiplayerSuccessLight: '#D1FAE5',
    multiplayerWarning: '#3B82F6',
    multiplayerWarningLight: '#EBF4FF',
  },
  
  // Dark mode colors - black/dark grey/white with blue accents
  dark: {
    background: '#0A0A0A',           // Deep black background
    foreground: '#FFFFFF',           // Pure white text
    foregroundSecondary: '#A1A1AA',  // Light grey secondary text
    foregroundTertiary: '#71717A',   // Medium grey tertiary text
    foregroundMuted: '#18181B',      // Dark grey muted background
    
    card: '#111111',                 // Very dark grey cards
    cardForeground: '#FFFFFF',       // White text on dark cards
    
    // Primary - Bright blue (not navy)
    primary: '#60A5FA',              // Bright blue for dark mode
    primaryForeground: '#0A0A0A',    // Black text on bright blue
    primaryLight: '#1E3A8A',         // Darker blue background
    primaryDark: '#93C5FD',          // Lighter blue for hover
    
    // Secondary - Dark grey
    secondary: '#1F1F23',            // Dark grey background
    secondaryForeground: '#FFFFFF',  // White text on dark grey
    
    // Muted - Dark backgrounds
    muted: '#18181B',                // Dark grey muted
    mutedForeground: '#A1A1AA',      // Light grey text on dark
    
    // Accent - Bright blue for highlights
    accent: '#60A5FA',               // Bright blue accent
    accentForeground: '#0A0A0A',     // Black text on bright blue
    accentLight: '#1E3A8A',          // Dark blue background
    accentDark: '#93C5FD',           // Light blue
    
    // Status colors
    destructive: '#EF4444',          // Red for errors
    destructiveForeground: '#FFFFFF', // White text on red
    
    success: '#10B981',              // Green for success
    successForeground: '#FFFFFF',    // White text on green
    successLight: '#064E3B',         // Dark green background
    
    // Warning uses blue instead of yellow
    warning: '#60A5FA',              // Bright blue for warnings
    warningForeground: '#0A0A0A',    // Black text on bright blue
    warningLight: '#1E3A8A',         // Dark blue background
    
    // Interactive elements
    border: '#27272A',               // Dark grey borders
    input: '#18181B',                // Dark grey input backgrounds
    ring: '#60A5FA',                 // Bright blue focus rings
    
    // Surface variations
    surface: '#111111',              // Very dark grey surface
    surfaceSecondary: '#1F1F23',     // Slightly lighter dark grey
    
    // Multiplayer theme
    multiplayerBg: '#0A0A0A',
    multiplayerCard: '#111111',
    multiplayerCardHover: '#1F1F23',
    multiplayerBorder: '#27272A',
    multiplayerText: '#FFFFFF',
    multiplayerTextMuted: '#A1A1AA',
    multiplayerAccent: '#60A5FA',
    multiplayerAccentLight: '#1E3A8A',
    multiplayerSuccess: '#10B981',
    multiplayerSuccessLight: '#064E3B',
    multiplayerWarning: '#60A5FA',
    multiplayerWarningLight: '#1E3A8A',
  },
} as const;

// =============================================================================
// SPACING SYSTEM (matching globals.css --space-* variables)
// =============================================================================

export const spacing = {
  1: 4 * scale,    // --space-1: 0.25rem
  2: 8 * scale,    // --space-2: 0.5rem
  3: 12 * scale,   // --space-3: 0.75rem
  4: 16 * scale,   // --space-4: 1rem
  5: 20 * scale,   // --space-5: 1.25rem
  6: 24 * scale,   // --space-6: 1.5rem
  8: 32 * scale,   // --space-8: 2rem
  10: 40 * scale,  // --space-10: 2.5rem
  12: 48 * scale,  // --space-12: 3rem
  16: 64 * scale,  // --space-16: 4rem
  20: 80 * scale,  // --space-20: 5rem
  24: 96 * scale,  // --space-24: 6rem
  
  // Responsive semantic spacing aliases
  xs: responsive.getSpacing({
    mobile: 4,
    small: 6,
    medium: 8,
    default: 8,
  }),
  
  sm: responsive.getSpacing({
    mobile: 8,
    small: 10,
    medium: 12,
    default: 12,
  }),
  
  md: responsive.getSpacing({
    mobile: 12,
    small: 16,
    medium: 20,
    default: 20,
  }),
  
  lg: responsive.getSpacing({
    mobile: 16,
    small: 24,
    medium: 32,
    default: 32,
  }),
  
  xl: responsive.getSpacing({
    mobile: 24,
    small: 32,
    medium: 48,
    default: 48,
  }),
  
  '2xl': responsive.getSpacing({
    mobile: 32,
    small: 48,
    medium: 64,
    default: 64,
  }),
  
  '3xl': responsive.getSpacing({
    mobile: 48,
    small: 64,
    medium: 80,
    default: 80,
  }),
  
  '4xl': responsive.getSpacing({
    mobile: 64,
    small: 80,
    medium: 96,
    default: 96,
  }),
  
  '5xl': responsive.getSpacing({
    mobile: 80,
    small: 96,
    medium: 128,
    default: 128,
  }),
  
  '6xl': responsive.getSpacing({
    mobile: 96,
    small: 128,
    medium: 160,
    default: 160,
  }),
  
  // Device-specific spacing patterns
  section: responsive.getSpacing({
    mobile: 16,
    small: 24,
    medium: 32,
    default: 32,
  }),
  
  card: responsive.getSpacing({
    mobile: 12,
    small: 16,
    medium: 20,
    default: 20,
  }),
  
  cardGap: responsive.getSpacing({
    mobile: 8,
    small: 12,
    medium: 16,
    default: 16,
  }),
  
  carousel: responsive.getSpacing({
    mobile: 12,
    small: 16,
    medium: 24,
    default: 24,
  }),
  
  safe: responsive.getSpacing({
    mobile: 8,
    small: 12,
    medium: 16,
    default: 16,
  }),
} as const;

// =============================================================================
// BORDER RADIUS SYSTEM (matching globals.css --radius)
// =============================================================================

export const borderRadius = {
  none: 0,
  xs: 6 * scale,    // Increased minimum for modern Apple look
  sm: Math.min(BASE_SPACING * 0.5 * scale, 8 * scale),
  md: Math.min(BASE_SPACING * 0.75 * scale, 12 * scale),
  lg: Math.min(BASE_SPACING * scale, 16 * scale),
  xl: Math.min(BASE_SPACING * 1.5 * scale, 24 * scale),
  '2xl': 28 * scale, // Hero cards
  '3xl': 36 * scale, // Massive elements
  full: 9999,
  
  // Apple-specific radius patterns (more generous)
  button: Math.min(BASE_SPACING * 0.75 * scale, 12 * scale),
  card: 16 * scale,       // Card radius
  modal: 20 * scale,      // Modal corners
  sheet: 24 * scale,      // Bottom sheet
} as const;

// =============================================================================
// SHADOW SYSTEM (modern minimal shadows)
// =============================================================================

const createShadow = (
  offsetWidth: number,
  offsetHeight: number,
  opacity: number,
  radius: number,
  elevation: number,
  color: string = '#000000'
) => {
  if (Platform.OS === 'web') {
    // Use web-compatible boxShadow to avoid deprecation warnings
    const rgba = `rgba(0, 0, 0, ${opacity})`;
    return {
      boxShadow: `${offsetWidth}px ${offsetHeight}px ${radius}px ${rgba}`,
    };
  }
  
  return {
    shadowOffset: { width: offsetWidth, height: offsetHeight },
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowColor: color,
    elevation,
  };
};

export const shadows = {
  // Minimal modern shadows
  none: Platform.OS === 'web' ? { boxShadow: 'none' } : createShadow(0, 0, 0, 0, 0),
  sm: createShadow(0, 1, 0.05, 2, 1),
  md: createShadow(0, 4, 0.1, 6, 3),
  lg: createShadow(0, 8, 0.1, 16, 8),
  xl: createShadow(0, 12, 0.15, 24, 12),
  
  // Component-specific shadows (matching globals.css)
  card: createShadow(0, 8, 0.1, 32, 8),
  button: createShadow(0, 4, 0.3, 12, 4),
} as const;

// =============================================================================
// ANIMATION SYSTEM (modern minimal timing)
// =============================================================================

export const animations = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 800,
  },
  easing: {
    // Modern easing curves
    easeOut: [0.4, 0.0, 0.2, 1],
    easeIn: [0.4, 0.0, 1, 1],
    easeInOut: [0.4, 0.0, 0.2, 1],
    spring: [0.175, 0.885, 0.32, 1.275],
  },
  // Reduced motion support
  respectsReducedMotion: true,
} as const;

// =============================================================================
// ANIMATION UTILITIES (web-compatible)
// =============================================================================

/**
 * Get the appropriate useNativeDriver setting for the current platform
 * Web doesn't support native driver, so we use false to avoid warnings
 */
export const getAnimationConfig = () => ({
  useNativeDriver: Platform.OS !== 'web',
});

/**
 * Create animation timing config with proper native driver setting
 */
export const createAnimationTiming = (config: {
  toValue: number;
  duration: number;
  delay?: number;
  easing?: any;
}) => ({
  ...config,
  useNativeDriver: Platform.OS !== 'web',
});

/**
 * Create spring animation config with proper native driver setting
 */
export const createSpringAnimation = (config: {
  toValue: number;
  tension?: number;
  friction?: number;
  delay?: number;
}) => ({
  ...config,
  useNativeDriver: Platform.OS !== 'web',
});

// =============================================================================
// THEME OBJECTS
// =============================================================================

// Light Theme
export const lightTheme = {
  ...colorTokens.light,
  
  // Additional semantic colors
  online: '#10B981',
  offline: '#6B7280',
  busy: '#3B82F6',                   // Blue instead of yellow
  away: '#EF4444',
  
  // Legacy color mappings for compatibility
  error: '#EF4444',                  // Maps to destructive
  inputBorder: '#E5E7EB',            // Maps to border
  
  // Glass effects (minimal)
  glass: 'rgba(255, 255, 255, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Shadow color
  shadow: '#000000',
  
  // Multiplayer theme object
  multiplayer: {
    background: '#FAFBFC',
    text: '#1A1A1A',
    textMuted: '#6B7280',
    accent: '#3B82F6',
    success: '#10B981',
    warning: '#3B82F6',                // Blue instead of yellow
    danger: '#EF4444',
    cardBg: '#FFFFFF',
    border: '#E5E7EB',
  },
} as const;

// Dark Theme
export const darkTheme = {
  ...colorTokens.dark,
  
  // Additional semantic colors
  online: '#10B981',
  offline: '#71717A',
  busy: '#60A5FA',                   // Blue instead of yellow
  away: '#EF4444',
  
  // Legacy color mappings for compatibility
  error: '#EF4444',                  // Maps to destructive
  inputBorder: '#27272A',            // Maps to border
  
  // Glass effects (minimal)
  glass: 'rgba(255, 255, 255, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Shadow color
  shadow: '#000000',
  
  // Multiplayer theme object
  multiplayer: {
    background: '#0A0A0A',
    text: '#FFFFFF',
    textMuted: '#A1A1AA',
    accent: '#60A5FA',
    success: '#10B981',
    warning: '#60A5FA',                // Blue instead of yellow
    danger: '#EF4444',
    cardBg: '#111111',
    border: '#27272A',
  },
} as const;

// =============================================================================
// DEVICE-SPECIFIC COMPONENT STYLES
// =============================================================================

export const deviceStyles = {
  // Card styles for different devices
  card: {
    mobile: {
      padding: spacing.sm,
      borderRadius: borderRadius.card,
      marginHorizontal: spacing.xs,
    },
    tablet: {
      padding: spacing.md,
      borderRadius: borderRadius.card,
      marginHorizontal: spacing.sm,
    },
    desktop: {
      padding: spacing.lg,
      borderRadius: borderRadius.card,
      marginHorizontal: spacing.md,
    },
  },
  
  // Button styles for different devices
  button: {
    mobile: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.button,
      minHeight: 44, // iOS minimum touch target
    },
    tablet: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.button,
      minHeight: 48,
    },
    desktop: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.button,
      minHeight: 44,
    },
  },
  
  // Container styles for different devices
  container: {
    mobile: {
      paddingHorizontal: spacing.sm,
      maxWidth: '100%',
    },
    tablet: {
      paddingHorizontal: spacing.md,
      maxWidth: breakpoints.medium,
    },
    desktop: {
      paddingHorizontal: spacing.lg,
      maxWidth: breakpoints.large,
    },
  },
} as const;

// =============================================================================
// COMPONENT STYLE PRESETS (atomic design)
// =============================================================================

export const componentStyles = {
  // Atoms
  text: {
    base: {
      ...typography.body,
    },
    heading: {
      ...typography.headline,
    },
  },
  
  // Molecules
  card: {
    borderRadius: borderRadius.lg,
    ...shadows.card,
    backgroundColor: 'transparent', // Will be set by theme
  },
  
  button: {
    primary: {
      borderRadius: borderRadius.lg,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[6],
      ...shadows.button,
    },
    secondary: {
      borderRadius: borderRadius.lg,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[6],
      borderWidth: 1,
    },
  },
  
  input: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    minHeight: 44, // Accessibility minimum
    ...typography.body,
  },
  
  modal: {
    borderRadius: borderRadius['2xl'],
    ...shadows.xl,
  },
} as const;

// =============================================================================
// ACCESSIBILITY CONSTANTS
// =============================================================================

export const accessibility = {
  minTouchTarget: 44, // Minimum touch target size
  focusRingWidth: 2,
  focusRingOffset: 2,
  contrastRatio: {
    aa: 4.5,      // WCAG AA standard
    aaa: 7,       // WCAG AAA standard
  },
} as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type Theme = typeof lightTheme;
export type ThemeColors = keyof Theme;
export type SpacingKey = keyof typeof spacing;
export type TypographyKey = keyof typeof typography;
export type ShadowKey = keyof typeof shadows;
export type DeviceType = 'mobile' | 'small' | 'medium' | 'large' | 'extraLarge';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const getSpacing = (key: SpacingKey): number => spacing[key];
export const getTypography = (key: TypographyKey) => typography[key];
export const getShadow = (key: ShadowKey) => shadows[key];

// Color manipulation utilities
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const darken = (color: string, amount: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * amount);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
};

export const lighten = (color: string, amount: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * amount);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R > 255 ? 255 : R) * 0x10000 +
    (G > 255 ? 255 : G) * 0x100 + (B > 255 ? 255 : B)).toString(16).slice(1);
};

// Multiplayer-specific colors
export const multiplayerBg = '#FAFBFC';        // Light grey background
export const multiplayerCardBg = '#FFFFFF';    // Pure white for cards
export const multiplayerBorder = '#E5E7EB';    // Light grey borders
export const multiplayerText = '#1A1A1A';      // Rich black text
export const multiplayerTextMuted = '#6B7280'; // Grey muted text
export const multiplayerAccent = '#3B82F6';    // Clean blue accent
export const multiplayerSuccess = '#10B981';   // Green success
export const multiplayerWarning = '#3B82F6';   // Blue warning (no yellow)
export const multiplayerDanger = '#EF4444';    // Red danger
export const multiplayerInfo = '#3B82F6';      // Blue info
export const multiplayerLight = '#F9FAFB';     // Very light grey
export const multiplayerDark = '#1A1A1A';      // Rich black
export const multiplayerPrimary = '#3B82F6';   // Clean blue primary
export const multiplayerSecondary = '#6B7280'; // Grey secondary
export const multiplayerGradientStart = '#3B82F6'; // Blue gradient start
export const multiplayerGradientEnd = '#2563EB';   // Darker blue gradient end
export const multiplayerShadow = 'rgba(0, 0, 0, 0.1)';
export const multiplayerOverlay = 'rgba(0, 0, 0, 0.5)';
export const multiplayerHighlight = '#EBF4FF'; // Light blue highlight
export const multiplayerWarningLight = '#EBF4FF'; // Light blue (no yellow)

// Multiplayer theme object
export const multiplayer = {
  background: '#FAFBFC',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  accent: '#3B82F6',
  success: '#10B981',
  warning: '#3B82F6',                // Blue instead of yellow
  danger: '#EF4444',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
};

// Export responsive hook for React components
export { responsive as useResponsive };

// Convenience function for responsive font sizes in components that need custom sizing
export const getResponsiveFontSize = (values: {
  mobile?: number;
  small?: number;
  medium?: number;
  large?: number;
  extraLarge?: number;
  default: number;
}, currentWidth?: number): number => {
  return responsive.getFontSize(values, currentWidth);
};

// Pre-defined responsive font sizes for common use cases
export const responsiveFontSizes = {
  // Emoji and icon sizes
  emojiSmall: getResponsiveFontSize({ mobile: 24, small: 28, medium: 32, default: 24 }),
  emojiMedium: getResponsiveFontSize({ mobile: 32, small: 40, medium: 48, default: 32 }),
  emojiLarge: getResponsiveFontSize({ mobile: 48, small: 56, medium: 64, default: 48 }),
  emojiExtraLarge: getResponsiveFontSize({ mobile: 64, small: 72, medium: 80, default: 64 }),
  
  // Common text sizes
  textTiny: getResponsiveFontSize({ mobile: 10, small: 11, medium: 12, default: 10 }),
  textSmall: getResponsiveFontSize({ mobile: 12, small: 13, medium: 14, default: 12 }),
  textBase: getResponsiveFontSize({ mobile: 14, small: 15, medium: 16, default: 14 }),
  textMedium: getResponsiveFontSize({ mobile: 16, small: 17, medium: 18, default: 16 }),
  textLarge: getResponsiveFontSize({ mobile: 18, small: 20, medium: 22, default: 18 }),
  textXLarge: getResponsiveFontSize({ mobile: 20, small: 22, medium: 24, default: 20 }),
  
  // Display sizes
  displaySmall: getResponsiveFontSize({ mobile: 24, small: 28, medium: 32, default: 24 }),
  displayMedium: getResponsiveFontSize({ mobile: 32, small: 36, medium: 40, default: 32 }),
  displayLarge: getResponsiveFontSize({ mobile: 40, small: 48, medium: 56, default: 40 }),
  displayExtraLarge: getResponsiveFontSize({ mobile: 48, small: 56, medium: 64, default: 48 }),
} as const; 