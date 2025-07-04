// Shared UI types between web and mobile
// Only include types that are truly platform-agnostic

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  border: string;
  muted: string;
  accent: string;
}

// Typography scale
export interface TypographyScale {
  title1: number;
  title2: number;
  title3: number;
  body: number;
  caption: number;
  footnote: number;
}

// Spacing scale
export interface SpacingScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

// Border radius
export interface BorderRadius {
  sm: number;
  md: number;
  lg: number;
  full: number;
}

// Shared component props
export interface BaseComponentProps {
  testID?: string;
  className?: string;
  style?: any; // Platform-specific style object
}

// Animation types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
} 