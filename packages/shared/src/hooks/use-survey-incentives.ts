// ============================================================================
// SURVEY INCENTIVES HOOK
// ============================================================================
// Hook to fetch and manage survey incentives

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SurveyIncentive } from '../types/incentives'

// ============================================================================
// SURVEY INCENTIVES HOOK
// ============================================================================

interface UseSurveyIncentivesOptions {
  surveyId?: string
  includeInactive?: boolean
}

interface UseSurveyIncentivesReturn {
  incentives: SurveyIncentive[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  getIncentiveForSurvey: (surveyId: string) => SurveyIncentive | null
}

export function useSurveyIncentives({
  surveyId,
  includeInactive = false
}: UseSurveyIncentivesOptions = {}): UseSurveyIncentivesReturn {
  const [incentives, setIncentives] = useState<SurveyIncentive[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIncentives = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (surveyId) {
        params.append('survey_id', surveyId)
      }
      if (includeInactive) {
        params.append('include_inactive', 'true')
      }

      const response = await fetch(`/api/surveys/incentives?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch incentives: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setIncentives(data.data || [])
      } else {
        throw new Error(data.error || 'Failed to fetch incentives')
      }
    } catch (err) {
      console.error('Error fetching survey incentives:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIncentives([])
    } finally {
      setLoading(false)
    }
  }, [surveyId, includeInactive])

  // Fetch incentives on mount and when dependencies change
  useEffect(() => {
    fetchIncentives()
  }, [fetchIncentives])

  // Helper function to get incentive for a specific survey
  const getIncentiveForSurvey = useCallback((targetSurveyId: string): SurveyIncentive | null => {
    return incentives.find(incentive => incentive.survey_id === targetSurveyId) || null
  }, [incentives])

  return {
    incentives,
    loading,
    error,
    refetch: fetchIncentives,
    getIncentiveForSurvey
  }
}

// ============================================================================
// SINGLE SURVEY INCENTIVE HOOK
// ============================================================================

interface UseSurveyIncentiveReturn {
  incentive: SurveyIncentive | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSurveyIncentive(surveyId: string): UseSurveyIncentiveReturn {
  const { incentives, loading, error, refetch } = useSurveyIncentives({ 
    surveyId,
    includeInactive: false 
  })

  const incentive = incentives.length > 0 ? incentives[0] : null

  return {
    incentive,
    loading,
    error,
    refetch
  }
} 