import { config } from '@gluestack-ui/config';

// CivicSense brand colors
const civicColors = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  destructive: '#EF4444', // Error Red
  success: '#10B981',    // Success Green
  warning: '#F59E0B',    // Warning Orange
  info: '#3B82F6',       // Info Blue
  
  // Neutral colors
  background: '#FFFFFF',
  foreground: '#111827',
  card: '#FFFFFF',
  cardForeground: '#111827',
  popover: '#FFFFFF',
  popoverForeground: '#111827',
  
  // Muted colors
  muted: '#F3F4F6',
  mutedForeground: '#6B7280',
  
  // Border colors
  border: '#E5E7EB',
  input: '#E5E7EB',
  ring: '#3B82F6',
  
  // Dark mode colors
  dark: {
    background: '#111827',
    foreground: '#F9FAFB',
    card: '#1F2937',
    cardForeground: '#F9FAFB',
    popover: '#1F2937',
    popoverForeground: '#F9FAFB',
    muted: '#374151',
    mutedForeground: '#9CA3AF',
    border: '#374151',
    input: '#374151',
  }
};

// CivicSense color tokens for Gluestack UI
export const civicTokens = {
  colors: {
    primary: civicColors.primary,
    secondary: civicColors.secondary,
    accent: civicColors.accent,
    destructive: civicColors.destructive,
    success: civicColors.success,
    warning: civicColors.warning,
    info: civicColors.info,
  },
  fonts: {
    // iOS system fonts
    body: 'SF Pro Text, system-ui, sans-serif',
    heading: 'SF Pro Display, system-ui, sans-serif',
    mono: 'SF Mono, Menlo, Monaco, monospace',
  },
  fontSizes: {
    // Following iOS Human Interface Guidelines
    caption2: 11,
    caption1: 12,
    footnote: 13,
    subhead: 15,
    callout: 16,
    body: 17,
    headline: 17,
    title3: 20,
    title2: 22,
    title1: 28,
    largeTitle: 34,
  },
};

// Export the default config with CivicSense customizations
export const civicConfig = config;
export default civicConfig; 