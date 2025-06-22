"use client"

import { useEffect, useState } from 'react'
import { envFeatureFlags } from '@/lib/env-feature-flags'
import type { AllFeatureFlags } from '@/lib/env-feature-flags'

/**
 * React hook for accessing comprehensive feature flags
 */
export function useComprehensiveFeatureFlags() {
  const [flags, setFlags] = useState<AllFeatureFlags>(envFeatureFlags.getAllFlags())

  useEffect(() => {
    const handleFlagsChanged = () => {
      setFlags(envFeatureFlags.getAllFlags())
    }

    window.addEventListener('featureFlagsChanged', handleFlagsChanged)
    return () => window.removeEventListener('featureFlagsChanged', handleFlagsChanged)
  }, [])

  return flags
}

export default useComprehensiveFeatureFlags 