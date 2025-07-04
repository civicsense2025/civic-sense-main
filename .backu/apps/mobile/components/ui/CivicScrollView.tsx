/**
 * ============================================================================
 * CIVIC SCROLL VIEW
 * ============================================================================
 * 
 * Enhanced ScrollView wrapper that includes civic refresh indicators and
 * smooth pull-to-refresh experience with visual feedback.
 */

import React, { ReactNode } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  View,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { spacing } from '../../lib/theme';
import { 
  EnhancedRefreshControl,
  type EnhancedRefreshControlProps,
  HomeRefreshControl,
  QuizRefreshControl,
  ProfileRefreshControl,
} from './EnhancedRefreshControl';
import { type RefreshSection } from '../../lib/services/refresh-service';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface CivicScrollViewProps extends Omit<ScrollViewProps, 'refreshControl'> {
  /** Children content */
  children: ReactNode;
  /** Type of screen for optimized refresh behavior */
  screenType?: 'home' | 'quiz' | 'profile' | 'custom';
  /** Custom refresh options */
  refreshOptions?: EnhancedRefreshControlProps;
  /** Show detailed progress in refresh indicator */
  showProgress?: boolean;
  /** Callback when refresh completes */
  onRefreshComplete?: (success: boolean, errors?: Record<string, string>) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CivicScrollView({
  children,
  screenType = 'custom',
  refreshOptions,
  showProgress = false,
  onRefreshComplete,
  style,
  contentContainerStyle,
  ...scrollViewProps
}: CivicScrollViewProps) {
  const { theme } = useTheme();

  // Get the appropriate refresh control based on screen type
  const getRefreshControl = () => {
    const commonProps = {
      ...refreshOptions,
      ...(onRefreshComplete && { onRefreshComplete }),
    };

    switch (screenType) {
      case 'home':
        return <HomeRefreshControl {...commonProps} />;
      case 'quiz':
        return <QuizRefreshControl {...commonProps} />;
      case 'profile':
        return <ProfileRefreshControl {...commonProps} />;
      default:
        return <EnhancedRefreshControl {...commonProps} />;
    }
  };



  return (
    <ScrollView
      style={[styles.scrollView, style]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      refreshControl={getRefreshControl()}
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  );
}

// ============================================================================
// SPECIALIZED SCROLL VIEWS
// ============================================================================

/**
 * Home screen scroll view with civic branding
 */
export function HomeCivicScrollView(props: Omit<CivicScrollViewProps, 'screenType'>) {
  return (
    <CivicScrollView
      screenType="home"
      showProgress={true}
      {...props}
    />
  );
}

/**
 * Quiz screen scroll view
 */
export function QuizCivicScrollView(props: Omit<CivicScrollViewProps, 'screenType'>) {
  return (
    <CivicScrollView
      screenType="quiz"
      {...props}
    />
  );
}

/**
 * Profile screen scroll view
 */
export function ProfileCivicScrollView(props: Omit<CivicScrollViewProps, 'screenType'>) {
  return (
    <CivicScrollView
      screenType="profile"
      {...props}
    />
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getRefreshSections(screenType: string): RefreshSection[] {
  switch (screenType) {
    case 'home':
      return ['categories', 'dailyContent', 'userProgress'] as RefreshSection[];
    case 'quiz':
      return ['categories', 'topics', 'questions'] as RefreshSection[];
    case 'profile':
      return ['userProgress', 'bookmarks', 'stats', 'achievements'] as RefreshSection[];
    default:
      return ['categories', 'dailyContent'] as RefreshSection[];
  }
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
}); 