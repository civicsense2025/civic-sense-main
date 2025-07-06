import { useTheme } from '../theme-context';
import { typography } from '../theme';

/**
 * Hook that provides preference-aware styling for components
 * This demonstrates how user preferences actually alter the app's appearance
 */
export function usePreferenceStyles() {
  const { theme, userPreferences } = useTheme();

  // Font size scaling based on user preference
  const getFontSize = (baseSize: number): number => {
    if (!userPreferences) return baseSize;
    
    const fontSizeMultiplier = {
      small: 0.85,
      medium: 1.0,
      large: 1.15,
    }[userPreferences.fontSize];

    return Math.round(baseSize * fontSizeMultiplier);
  };

  // Get colors with high contrast adjustments
  const getColors = () => {
    if (!userPreferences?.highContrast) {
      return {
        text: theme.foreground,
        textSecondary: theme.foregroundSecondary,
        background: theme.background,
        border: theme.border,
      };
    }

    // High contrast mode colors
    return {
      text: '#000000',
      textSecondary: '#333333',
      background: '#FFFFFF',
      border: '#000000',
    };
  };

  // Get animation preferences
  const getAnimationDuration = (baseDuration: number): number => {
    if (!userPreferences) return baseDuration;
    return userPreferences.reducedMotion ? 0 : baseDuration;
  };

  // Typography styles with user preferences applied
  const getTypographyStyle = (baseStyle: any) => {
    const colors = getColors();
    return {
      ...baseStyle,
      fontSize: getFontSize(baseStyle.fontSize),
      color: colors.text,
    };
  };

  // Check if UI elements should be shown
  const shouldShowElement = (elementType: 'achievements' | 'streaks' | 'leaderboards'): boolean => {
    if (!userPreferences) return true;
    
    switch (elementType) {
      case 'achievements':
        return userPreferences.showAchievements;
      case 'streaks':
        return userPreferences.showStreaks;
      case 'leaderboards':
        return userPreferences.showLeaderboards;
      default:
        return true;
    }
  };

  // Get quiz preferences for quiz components
  const getQuizPreferences = () => {
    if (!userPreferences) {
      return {
        showExplanations: true,
        showDifficultyIndicators: true,
        showSources: true,
        questionCount: 10,
        learningPace: 'moderate' as const,
      };
    }

    return {
      showExplanations: userPreferences.showExplanations,
      showDifficultyIndicators: userPreferences.showDifficultyIndicators,
      showSources: userPreferences.showSources,
      questionCount: userPreferences.preferredQuizLength,
      learningPace: userPreferences.learningPace,
    };
  };

  return {
    // Font sizing
    getFontSize,
    
    // Colors with preference adjustments
    colors: getColors(),
    
    // Animation durations
    getAnimationDuration,
    
    // Typography with preferences
    getTypographyStyle,
    
    // UI element visibility
    shouldShowElement,
    
    // Quiz-specific preferences
    quizPreferences: getQuizPreferences(),
    
    // Direct access to preferences
    preferences: userPreferences,
    
    // Convenience flags
    isHighContrast: userPreferences?.highContrast ?? false,
    isReducedMotion: userPreferences?.reducedMotion ?? false,
    isCompetitiveMode: userPreferences?.competitiveMode ?? false,
    
    // Screen reader optimizations
    screenReaderMode: userPreferences?.screenReaderMode ?? false,
  };
} 