// CivicSense Color Palette - Civic Sunrise
// Based on brand guidelines: 60-30-10 rule (60% neutral, 30% secondary, 10% primary/accent)

export const colors = {
  // Primary Colors - Use sparingly for key actions
  primary: {
    50: '#FEF7E8',
    100: '#FDECC4',
    200: '#FBD785',
    300: '#F9C146',
    400: '#E0A63E', // Main brand gold
    500: '#C7941F',
    600: '#A67B19',
    700: '#8B6514',
    800: '#70510F',
    900: '#593F0C',
  },
  
  // Secondary Colors - Authority and structure
  secondary: {
    50: '#F1F4F7',
    100: '#DCE4EB',
    200: '#B9C9D7',
    300: '#97AEC3',
    400: '#74938F',
    500: '#2E4057', // Authority blue
    600: '#263649',
    700: '#1E2B3B',
    800: '#16202D',
    900: '#0E1520',
  },
  
  // Accent Colors - Civic engagement
  accent: {
    50: '#F0F6FB',
    100: '#DBE9F5',
    200: '#B8D3EB',
    300: '#95BDE1',
    400: '#72A7D7',
    500: '#6096BA', // Civic blue
    600: '#4F7A96',
    700: '#3E5E72',
    800: '#2D424E',
    900: '#1C262A',
  },
  
  // Neutral Foundation - Truth and clarity
  background: '#FDFCF9', // Truth white
  surface: '#FFF5D9',    // Warm surface
  
  // Text Colors
  text: {
    primary: '#1B1B1B',    // High contrast
    secondary: '#4A4A4A',  // Secondary text
    muted: '#6B7280',      // Muted text
    inverse: '#FFFFFF',    // Inverse text
  },
  
  // Semantic Colors - Democratic actions
  semantic: {
    success: '#059669',    // Democratic success
    warning: '#D97706',    // Caution amber
    error: '#DC2626',      // Action red
    info: '#3B82F6',       // Information blue
  },
  
  // Border Colors
  border: {
    default: '#E5E7EB',
    muted: '#F3F4F6',
    strong: '#D1D5DB',
  },
  
  // Civic-specific semantic colors
  civic: {
    democracy: '#059669',      // Democratic participation
    power: '#7C3AED',          // Power structures
    action: '#DC2626',         // Call to action
    truth: '#F59E0B',          // Uncomfortable truths
    evidence: '#3B82F6',       // Evidence-based
  },
} as const;

// Color utility types
export type ColorToken = keyof typeof colors;
export type PrimaryColor = keyof typeof colors.primary;
export type SecondaryColor = keyof typeof colors.secondary;
export type AccentColor = keyof typeof colors.accent;
export type SemanticColor = keyof typeof colors.semantic;
export type CivicColor = keyof typeof colors.civic; 