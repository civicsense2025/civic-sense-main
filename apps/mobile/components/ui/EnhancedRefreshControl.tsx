/**
 * ============================================================================
 * ENHANCED REFRESH CONTROL
 * ============================================================================
 * 
 * Wrapper around React Native's RefreshControl that integrates with our
 * comprehensive RefreshService. Provides consistent pull-to-refresh behavior
 * across all screens in the CivicSense app.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { RefreshControl, RefreshControlProps, Platform } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { useRefresh, type UseRefreshOptions } from '../../lib/hooks/useRefresh';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface EnhancedRefreshControlProps extends Omit<RefreshControlProps, 'refreshing' | 'onRefresh'> {
  /** Refresh configuration options */
  refreshOptions?: UseRefreshOptions;
  /** Custom refresh handler (overrides default behavior) */
  onCustomRefresh?: () => Promise<void>;
  /** Show progress feedback in console */
  showProgress?: boolean;
  /** Additional callback when refresh completes */
  onRefreshComplete?: (success: boolean, errors?: Record<string, string>) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EnhancedRefreshControl({
  refreshOptions,
  onCustomRefresh,
  showProgress = false,
  onRefreshComplete,
  ...refreshControlProps
}: EnhancedRefreshControlProps) {
  const { theme } = useTheme();
  const [refreshTitle, setRefreshTitle] = useState<string>('');
  
  // Initialize refresh hook with provided options
  const { isRefreshing, quickRefresh, progress } = useRefresh({
    debugProgress: showProgress,
    ...refreshOptions,
  });

  // Update refresh title based on progress stage (iOS only)
  useEffect(() => {
    if (Platform.OS === 'ios' && showProgress) {
      if (progress.stage) {
        // Shorter, more user-friendly messages
        const stageMessages: Record<string, string> = {
          'Starting refresh...': 'Updating...',
          'Clearing query cache...': 'Clearing cache...',
          'Refreshing content cache...': 'Loading content...',
          'Refreshing user progress...': 'Syncing progress...',
          'Refreshing bookmarks...': 'Syncing bookmarks...',
          'Refreshing user statistics...': 'Updating stats...',
          'Refreshing daily content...': 'Loading today\'s content...',
          'Finalizing...': 'Almost done...',
        };
        
        setRefreshTitle(stageMessages[progress.stage] || progress.stage);
      } else if (isRefreshing) {
        setRefreshTitle('Refreshing...');
      } else {
        setRefreshTitle('');
      }
    }
  }, [progress.stage, isRefreshing, showProgress]);

  // Handle refresh action
  const handleRefresh = useCallback(async () => {
    try {
      if (onCustomRefresh) {
        // Use custom refresh handler if provided
        await onCustomRefresh();
        onRefreshComplete?.(true);
      } else {
        // Use our integrated refresh system
        const result = await quickRefresh();
        
        // Notify parent component of completion
        onRefreshComplete?.(
          result.success, 
          Object.keys(result.errors).length > 0 ? result.errors : undefined
        );
        
        if (showProgress) {
          console.log('🔄 Refresh completed:', {
            success: result.success,
            sections: result.refreshedSections.length,
            duration: result.duration,
          });
        }
      }
    } catch (error) {
      console.error('❌ RefreshControl error:', error);
      onRefreshComplete?.(false, { general: 'Refresh failed' });
    }
  }, [onCustomRefresh, quickRefresh, onRefreshComplete, showProgress]);

  // Enhanced visual props for better feedback
  const enhancedProps = {
    // Standard props
    refreshing: isRefreshing,
    onRefresh: handleRefresh,
    tintColor: theme.primary || '#1E3A8A', // Fallback to blue if theme not loaded
    colors: [
      theme.primary || '#1E3A8A', 
      (theme.primary || '#1E3A8A') + 'CC', 
      (theme.primary || '#1E3A8A') + '88'
    ], // Multiple colors for Android with fallbacks
    progressBackgroundColor: theme.background || '#FFFFFF',
    
    // iOS-specific enhanced feedback
    ...(Platform.OS === 'ios' && {
      title: showProgress ? refreshTitle : 'Pull to refresh',
      titleColor: theme.foregroundSecondary || '#666666',
    }),
    
    // Android-specific enhancements
    ...(Platform.OS === 'android' && {
      progressViewOffset: 0, // Keep it inline
    }),
    
    // Apply any custom props
    ...refreshControlProps,
  };

  return <RefreshControl {...enhancedProps} />;
}

// ============================================================================
// SPECIALIZED REFRESH CONTROLS
// ============================================================================

/**
 * RefreshControl optimized for home screen
 */
export function HomeRefreshControl(props: Omit<EnhancedRefreshControlProps, 'refreshOptions'>) {
  return (
    <EnhancedRefreshControl
      refreshOptions={{
        sections: ['categories', 'dailyContent', 'userProgress'],
        minRefreshDelay: 2000,
      }}
      showProgress={true}
      {...props}
    />
  );
}

/**
 * RefreshControl optimized for quiz screen
 */
export function QuizRefreshControl(props: Omit<EnhancedRefreshControlProps, 'refreshOptions'>) {
  return (
    <EnhancedRefreshControl
      refreshOptions={{
        sections: ['categories', 'topics', 'questions'],
        minRefreshDelay: 1500,
      }}
      showProgress={true}
      {...props}
    />
  );
}

/**
 * RefreshControl optimized for profile/saved screen
 */
export function ProfileRefreshControl(props: Omit<EnhancedRefreshControlProps, 'refreshOptions'>) {
  return (
    <EnhancedRefreshControl
      refreshOptions={{
        sections: ['userProgress', 'bookmarks', 'stats', 'achievements'],
        minRefreshDelay: 1000,
      }}
      showProgress={true}
      {...props}
    />
  );
}

/**
 * Lightweight RefreshControl for quick content updates
 */
export function QuickRefreshControl(props: Omit<EnhancedRefreshControlProps, 'refreshOptions'>) {
  return (
    <EnhancedRefreshControl
      refreshOptions={{
        sections: ['dailyContent'],
        minRefreshDelay: 800,
      }}
      {...props}
    />
  );
}

/**
 * Comprehensive RefreshControl for global app refresh
 */
export function GlobalRefreshControl(props: Omit<EnhancedRefreshControlProps, 'refreshOptions'>) {
  return (
    <EnhancedRefreshControl
      refreshOptions={{
        sections: ['categories', 'topics', 'questions', 'userProgress', 'bookmarks', 'stats', 'dailyContent'],
        minRefreshDelay: 5000,
        debugProgress: true,
      }}
      showProgress
      {...props}
    />
  );
} 