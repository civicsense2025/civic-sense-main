import { envFeatureFlags, type AllFeatureFlags } from '../lib/env-feature-flags'
import type { User } from '../types'

// Static flags - no state management to prevent re-renders
const STATIC_FLAGS = envFeatureFlags.getAllFlags()

// Individual feature flag hook - STATIC
export function useFeatureFlag(flag: keyof AllFeatureFlags, user?: User | null | undefined): boolean {
  return STATIC_FLAGS[flag] || false
}

// Export stable references
export const stableFeatureFlagHooks = {
  useFeatureFlag
} as const 