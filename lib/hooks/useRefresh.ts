/**
 * ============================================================================
 * USE REFRESH HOOK
 * ============================================================================
 * 
 * React hook for easy integration with RefreshService.
 * Provides pull-to-refresh functionality with proper state management.
 */

import { useState, useCallback, useEffect } from 'react';
import { refreshService, type RefreshOptions, type RefreshResult, type RefreshSection } from '../services/refresh-service';

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseRefreshOptions {
  /** Sections to refresh when this component triggers refresh */
  sections?: RefreshSection[];
  /** Auto-refresh on mount */
  autoRefreshOnMount?: boolean;
  /** Minimum delay before allowing another refresh (ms) */
  minRefreshDelay?: number;
  /** Show progress in console for debugging */
  debugProgress?: boolean;
}

export interface UseRefreshReturn {
  /** Current refreshing state */
  isRefreshing: boolean;
  /** Last refresh result */
  lastResult: RefreshResult | null;
  /** Trigger a refresh manually */
  refresh: (options?: RefreshOptions) => Promise<RefreshResult>;
  /** Quick refresh with default sections */
  quickRefresh: () => Promise<RefreshResult>;
  /** Check if refresh is available (not in cooldown) */
  canRefresh: boolean;
  /** Progress information */
  progress: {
    current: number;
    stage: string;
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useRefresh(options: UseRefreshOptions = {}): UseRefreshReturn {
  const {
    sections = ['categories', 'dailyContent'],
    autoRefreshOnMount = false,
    minRefreshDelay = 1000,
    debugProgress = false,
  } = options;

  // State management
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastResult, setLastResult] = useState<RefreshResult | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [progress, setProgress] = useState({ current: 0, stage: '' });

  // Check if refresh is available
  const canRefresh = !isRefreshing && (Date.now() - lastRefreshTime) > minRefreshDelay;

  // Progress callback for UI feedback
  const handleProgress = useCallback((current: number, stage: string) => {
    setProgress({ current, stage });
    
    if (debugProgress) {
      console.log(`🔄 Refresh Progress: ${Math.round(current * 100)}% - ${stage}`);
    }
  }, [debugProgress]);

  // Main refresh function
  const refresh = useCallback(async (refreshOptions: RefreshOptions = {}): Promise<RefreshResult> => {
    if (!canRefresh) {
      console.log('⏳ Refresh not available (cooldown or in progress)');
      return {
        success: false,
        refreshedSections: [],
        errors: { general: 'Refresh not available' },
        timestamp: Date.now(),
        duration: 0,
      };
    }

    setIsRefreshing(true);
    setProgress({ current: 0, stage: 'Starting refresh...' });

    try {
      const result = await refreshService.refreshApp({
        sections,
        onProgress: handleProgress,
        ...refreshOptions,
      });

      setLastResult(result);
      setLastRefreshTime(Date.now());

      if (result.success) {
        console.log('✅ Refresh completed successfully');
      } else {
        console.warn('⚠️ Refresh completed with errors:', result.errors);
      }

      return result;

    } catch (error) {
      const errorResult: RefreshResult = {
        success: false,
        refreshedSections: [],
        errors: { general: error instanceof Error ? error.message : 'Unknown refresh error' },
        timestamp: Date.now(),
        duration: 0,
      };

      setLastResult(errorResult);
      console.error('❌ Refresh failed:', error);
      
      return errorResult;

    } finally {
      setIsRefreshing(false);
      setProgress({ current: 0, stage: '' });
    }
  }, [canRefresh, sections, handleProgress]);

  // Quick refresh with optimized sections
  const quickRefresh = useCallback(async (): Promise<RefreshResult> => {
    return refresh({
      sections: sections.length > 0 ? sections : ['categories', 'dailyContent'],
      includeQueryCache: true,
      includeContentCache: sections.includes('categories') || sections.includes('topics'),
      includeUserData: sections.some(s => ['userProgress', 'bookmarks', 'stats'].includes(s)),
    });
  }, [refresh, sections]);

  // Auto-refresh on mount if requested
  useEffect(() => {
    if (autoRefreshOnMount) {
      console.log('🔄 Auto-refreshing on mount...');
      quickRefresh();
    }
  }, [autoRefreshOnMount, quickRefresh]);

  return {
    isRefreshing,
    lastResult,
    refresh,
    quickRefresh,
    canRefresh,
    progress,
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook specifically for home screen refresh
 */
export function useHomeRefresh() {
  return useRefresh({
    sections: ['categories', 'dailyContent', 'userProgress'],
    autoRefreshOnMount: false,
    minRefreshDelay: 2000, // Longer delay for home screen
  });
}

/**
 * Hook specifically for quiz screen refresh
 */
export function useQuizRefresh() {
  return useRefresh({
    sections: ['categories', 'topics', 'questions'],
    autoRefreshOnMount: false,
    minRefreshDelay: 1500,
  });
}

/**
 * Hook specifically for profile/saved screen refresh
 */
export function useProfileRefresh() {
  return useRefresh({
    sections: ['userProgress', 'bookmarks', 'stats', 'achievements'],
    autoRefreshOnMount: false,
    minRefreshDelay: 1000,
  });
}

/**
 * Hook for global app refresh (all sections)
 */
export function useGlobalRefresh() {
  return useRefresh({
    sections: ['categories', 'topics', 'questions', 'userProgress', 'bookmarks', 'stats', 'dailyContent'],
    autoRefreshOnMount: false,
    minRefreshDelay: 5000, // Longer delay for comprehensive refresh
    debugProgress: true,
  });
} 