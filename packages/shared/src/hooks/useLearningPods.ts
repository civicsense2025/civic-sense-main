import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { ContentFilteringService, type UserContentProfile } from '../lib/content-filtering'

interface LearningPod {
  id: string
  pod_name: string
  pod_type: 'family' | 'friends' | 'classroom' | 'study_group' | 'campaign' | 'organization' | 'book_club' | 'debate_team'
  family_name?: string
  join_code: string
  member_count: number
  user_role: 'admin' | 'parent' | 'child' | 'member'
  is_admin: boolean
  content_filter_level: 'none' | 'light' | 'moderate' | 'strict'
  created_at: string
}

interface PodMember {
  id: string
  user_id: string
  full_name?: string
  role: 'admin' | 'parent' | 'child' | 'member'
  birth_date?: string
  grade_level?: string
  membership_status: 'active' | 'pending' | 'suspended'
  joined_at: string
  parental_consent: boolean
}

export function useLearningPods() {
  const { user } = useAuth()
  const [pods, setPods] = useState<LearningPod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user's pods
  const loadPods = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/learning-pods')
      const data = await response.json()
      
      if (response.ok) {
        setPods(data.pods || [])
      } else {
        setError(data.error || 'Failed to load pods')
      }
    } catch (err) {
      setError('Network error loading pods')
      console.error('Error loading pods:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Create a new pod
  const createPod = async (podData: {
    podName: string
    podType: 'family' | 'friends' | 'classroom' | 'study_group' | 'campaign' | 'organization' | 'book_club' | 'debate_team'
    familyName?: string
    description?: string
    contentFilterLevel: 'none' | 'light' | 'moderate' | 'strict'
  }) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const response = await fetch('/api/learning-pods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(podData)
      })

      const data = await response.json()
      
      if (response.ok) {
        await loadPods() // Refresh the list
        return data
      } else {
        throw new Error(data.error || 'Failed to create pod')
      }
    } catch (err) {
      console.error('Error creating pod:', err)
      throw err
    }
  }

  // Join a pod using a join code
  const joinPod = async (joinCode: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const response = await fetch('/api/learning-pods/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode })
      })

      const data = await response.json()
      
      if (response.ok) {
        await loadPods() // Refresh the list
        return data
      } else {
        throw new Error(data.error || 'Failed to join pod')
      }
    } catch (err) {
      console.error('Error joining pod:', err)
      throw err
    }
  }

  // Leave a pod
  const leavePod = async (podId: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const response = await fetch(`/api/learning-pods/${podId}/leave`, {
        method: 'POST'
      })

      const data = await response.json()
      
      if (response.ok) {
        await loadPods() // Refresh the list
        return data
      } else {
        throw new Error(data.error || 'Failed to leave pod')
      }
    } catch (err) {
      console.error('Error leaving pod:', err)
      throw err
    }
  }

  // Load pods when user changes
  useEffect(() => {
    if (user) {
      loadPods()
    } else {
      setPods([])
    }
  }, [user])

  return {
    pods,
    isLoading,
    error,
    createPod,
    joinPod,
    leavePod,
    refreshPods: loadPods
  }
}

export function useParentalControls(childUserId?: string) {
  const { user } = useAuth()
  const [controls, setControls] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load parental controls for a child
  const loadControls = async (targetChildId?: string) => {
    const childId = targetChildId || childUserId
    if (!user || !childId) return

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/parental-controls/${childId}`)
      const data = await response.json()
      
      if (response.ok) {
        setControls(data.controls)
      } else {
        setError(data.error || 'Failed to load controls')
      }
    } catch (err) {
      setError('Network error loading controls')
      console.error('Error loading controls:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Update parental controls
  const updateControls = async (newControls: any, targetChildId?: string) => {
    const childId = targetChildId || childUserId
    if (!user || !childId) throw new Error('Missing required data')

    try {
      const response = await fetch(`/api/parental-controls/${childId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newControls)
      })

      const data = await response.json()
      
      if (response.ok) {
        setControls(data.controls)
        return data
      } else {
        throw new Error(data.error || 'Failed to update controls')
      }
    } catch (err) {
      console.error('Error updating controls:', err)
      throw err
    }
  }

  return {
    controls,
    isLoading,
    error,
    loadControls,
    updateControls
  }
}

export function useContentFiltering() {
  const { user } = useAuth()
  const { pods } = useLearningPods()

  // Get user's content profile for filtering
  const getUserContentProfile = (): UserContentProfile | null => {
    if (!user) return null

    // This would be enhanced with real data from the database
    return {
      userId: user.id,
      age: undefined, // Would come from user profile or pod membership
      gradeLevel: undefined, // Would come from user profile
      parentalControls: undefined, // Would come from parental controls API
      podMemberships: undefined // Would come from pod memberships
    }
  }

  // Filter topics based on user's profile
  const filterTopics = async (topics: any[]) => {
    const profile = getUserContentProfile()
    if (!profile) return topics

    return ContentFilteringService.filterTopicList(topics, profile)
  }

  // Check if specific content is appropriate
  const checkContent = async (content: any) => {
    const profile = getUserContentProfile()
    if (!profile) return { allowed: true }

    return ContentFilteringService.filterContent(content, profile)
  }

  // Get filter summary for current user
  const getFilterSummary = () => {
    const profile = getUserContentProfile()
    if (!profile) return null

    return ContentFilteringService.generateFilterSummary(profile)
  }

  return {
    filterTopics,
    checkContent,
    getFilterSummary,
    userProfile: getUserContentProfile()
  }
}

// Export types for use in components
export type { LearningPod, PodMember } 