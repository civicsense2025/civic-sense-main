// CivicSense Custom Fonts Utility
// Provides easy access to Helvetica Neue and Space Mono fonts

import { Platform } from 'react-native';

// Font family constants that match the loaded fonts
export const FONTS = {
  // Helvetica Neue variants
  helveticaNeue: {
    regular: 'HelveticaNeue',
    bold: 'HelveticaNeue-Bold',
    medium: 'HelveticaNeue-Medium',
    italic: 'HelveticaNeue-Italic',
  },
  
  // Space Mono variants (for headers per user preference)
  spaceMono: {
    regular: 'SpaceMono-Regular',
    bold: 'SpaceMono-Bold',
    italic: 'SpaceMono-Italic',
    boldItalic: 'SpaceMono-BoldItalic',
  },
} as const;

// Font aliases for easier usage
export const fontAliases = {
  // Header fonts (Space Mono per user preference)
  header: FONTS.spaceMono.bold,
  headerRegular: FONTS.spaceMono.regular,
  
  // Body text fonts (Helvetica Neue)
  body: FONTS.helveticaNeue.regular,
  bodyBold: FONTS.helveticaNeue.bold,
  bodyMedium: FONTS.helveticaNeue.medium,
  bodyItalic: FONTS.helveticaNeue.italic,
  
  // Monospace fonts
  mono: FONTS.spaceMono.regular,
  monoBold: FONTS.spaceMono.bold,
  monoItalic: FONTS.spaceMono.italic,
  monoBoldItalic: FONTS.spaceMono.boldItalic,
} as const;

// Font weight mappings for different font families
export const fontWeights = {
  helveticaNeue: {
    regular: 'HelveticaNeue',
    medium: 'HelveticaNeue-Medium',
    bold: 'HelveticaNeue-Bold',
  },
  spaceMono: {
    regular: 'SpaceMono-Regular',
    bold: 'SpaceMono-Bold',
  },
} as const;

// Utility function to get font with fallback
export const getFontFamily = (
  fontName: keyof typeof fontAliases,
  fallback?: string
): string => {
  const font = fontAliases[fontName];
  return fallback ? `${font}, ${fallback}` : font;
};

// Utility function to get platform-specific font
export const getPlatformFont = (
  font: string,
  fallbacks?: { ios?: string; android?: string; default?: string }
): string => {
  return Platform.select({
    ios: font,
    android: font,
    default: font,
  }) || fallbacks?.default || font;
};

// Font style presets for common use cases
export const fontStyles = {
  // CivicSense App Header (Space Mono per user preference)
  appHeader: {
    fontFamily: FONTS.spaceMono.bold,
    fontSize: 20,
    fontWeight: 'bold' as const,
  },
  
  // Page titles
  pageTitle: {
    fontFamily: FONTS.spaceMono.bold,
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  
  // Section headers
  sectionHeader: {
    fontFamily: FONTS.spaceMono.regular,
    fontSize: 18,
    fontWeight: 'normal' as const,
  },
  
  // Body text
  bodyText: {
    fontFamily: FONTS.helveticaNeue.regular,
    fontSize: 16,
    fontWeight: 'normal' as const,
  },
  
  // Body text bold
  bodyTextBold: {
    fontFamily: FONTS.helveticaNeue.bold,
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  
  // Caption text
  caption: {
    fontFamily: FONTS.helveticaNeue.regular,
    fontSize: 12,
    fontWeight: 'normal' as const,
  },
  
  // Button text
  button: {
    fontFamily: FONTS.helveticaNeue.medium,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  
  // Code/monospace text
  code: {
    fontFamily: FONTS.spaceMono.regular,
    fontSize: 14,
    fontWeight: 'normal' as const,
  },
} as const;

// Type definitions
export type FontFamily = keyof typeof FONTS;
export type FontAlias = keyof typeof fontAliases;
export type FontStyle = keyof typeof fontStyles;

// Export all font names for easy access
export const allFontNames = [
  ...Object.values(FONTS.helveticaNeue),
  ...Object.values(FONTS.spaceMono),
] as const;

// Validation function to check if font is loaded
export const isFontLoaded = (fontName: string): boolean => {
  return allFontNames.includes(fontName as any);
};

// Default export for convenience
export default {
  FONTS,
  fontAliases,
  fontStyles,
  getFontFamily,
  getPlatformFont,
  isFontLoaded,
}; 