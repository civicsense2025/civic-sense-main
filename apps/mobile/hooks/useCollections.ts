import { useState, useEffect, useCallback } from 'react'
import { Collection, CollectionFilters, UserCollectionProgress } from '@/types/collections'
import { LessonStep, LessonStepsResponse, UpdateLessonStepProgressRequest } from '@/types/lesson-steps'
import CollectionsApiService from '@/lib/services/collections-api'

interface UseCollectionsState {
  collections: Collection[]
  loading: boolean
  error: string | null
  total: number
  page: number
  pages: number
}

interface UseCollectionState {
  collection: Collection | null
  loading: boolean
  error: string | null
}

interface UseCollectionStepsState {
  steps: LessonStep[]
  loading: boolean
  error: string | null
  total_steps: number
}

interface UseCollectionProgressState {
  progress: UserCollectionProgress | null
  loading: boolean
  error: string | null
  updating: boolean
}

export function useCollections(filters?: CollectionFilters) {
  const [state, setState] = useState<UseCollectionsState>({
    collections: [],
    loading: true,
    error: null,
    total: 0,
    page: 1,
    pages: 1
  })

  const loadCollections = useCallback(async (newFilters?: CollectionFilters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const result = await CollectionsApiService.getCollections(newFilters || filters)
      
      setState({
        collections: result.collections,
        loading: false,
        error: null,
        total: result.total,
        page: result.page,
        pages: result.pages
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load collections'
      }))
    }
  }, [filters])

  const refetch = useCallback(() => {
    return loadCollections()
  }, [loadCollections])

  const searchCollections = useCallback(async (query: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const collections = await CollectionsApiService.searchCollections(query)
      
      setState(prev => ({
        ...prev,
        collections,
        loading: false,
        error: null
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Search failed'
      }))
    }
  }, [])

  useEffect(() => {
    loadCollections()
  }, [loadCollections])

  return {
    ...state,
    refetch,
    searchCollections,
    loadMore: (newFilters: CollectionFilters) => loadCollections(newFilters)
  }
}

export function useCollection(slug: string) {
  const [state, setState] = useState<UseCollectionState>({
    collection: null,
    loading: true,
    error: null
  })

  const loadCollection = useCallback(async () => {
    if (!slug) return

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const collection = await CollectionsApiService.getCollection(slug)
      
      setState({
        collection,
        loading: false,
        error: null
      })
    } catch (error) {
      setState({
        collection: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load collection'
      })
    }
  }, [slug])

  const refetch = useCallback(() => {
    return loadCollection()
  }, [loadCollection])

  useEffect(() => {
    loadCollection()
  }, [loadCollection])

  return {
    ...state,
    refetch
  }
}

export function useCollectionSteps(slug: string) {
  const [state, setState] = useState<UseCollectionStepsState>({
    steps: [],
    loading: true,
    error: null,
    total_steps: 0
  })

  const loadSteps = useCallback(async () => {
    if (!slug) return

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const result = await CollectionsApiService.getCollectionSteps(slug)
      
      setState({
        steps: result.steps,
        loading: false,
        error: null,
        total_steps: result.total_steps
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load lesson steps'
      }))
    }
  }, [slug])

  const refetch = useCallback(() => {
    return loadSteps()
  }, [loadSteps])

  useEffect(() => {
    loadSteps()
  }, [loadSteps])

  return {
    ...state,
    refetch
  }
}

export function useCollectionProgress(slug: string) {
  const [state, setState] = useState<UseCollectionProgressState>({
    progress: null,
    loading: true,
    error: null,
    updating: false
  })

  const loadProgress = useCallback(async () => {
    if (!slug) return

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const progress = await CollectionsApiService.getCollectionProgress(slug)
      
      setState(prev => ({
        ...prev,
        progress,
        loading: false,
        error: null
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load progress'
      }))
    }
  }, [slug])

  const updateProgress = useCallback(async (progressData: {
    item_id?: string
    action: 'complete' | 'start' | 'view'
    time_spent?: number
    score?: number
    metadata?: any
  }) => {
    try {
      setState(prev => ({ ...prev, updating: true, error: null }))
      
      const updatedProgress = await CollectionsApiService.updateCollectionProgress(slug, progressData)
      
      setState(prev => ({
        ...prev,
        progress: updatedProgress,
        updating: false,
        error: null
      }))

      return updatedProgress
    } catch (error) {
      setState(prev => ({
        ...prev,
        updating: false,
        error: error instanceof Error ? error.message : 'Failed to update progress'
      }))
      throw error
    }
  }, [slug])

  const updateStepProgress = useCallback(async (progressData: UpdateLessonStepProgressRequest) => {
    try {
      setState(prev => ({ ...prev, updating: true, error: null }))
      
      const result = await CollectionsApiService.updateStepProgress(slug, progressData)
      
      setState(prev => ({
        ...prev,
        progress: result.collection_progress,
        updating: false,
        error: null
      }))

      return result
    } catch (error) {
      setState(prev => ({
        ...prev,
        updating: false,
        error: error instanceof Error ? error.message : 'Failed to update step progress'
      }))
      throw error
    }
  }, [slug])

  const refetch = useCallback(() => {
    return loadProgress()
  }, [loadProgress])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  return {
    ...state,
    refetch,
    updateProgress,
    updateStepProgress
  }
}

export function useFeaturedCollections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFeatured = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const featuredCollections = await CollectionsApiService.getFeaturedCollections()
      
      setCollections(featuredCollections)
      setLoading(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load featured collections')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeatured()
  }, [loadFeatured])

  return {
    collections,
    loading,
    error,
    refetch: loadFeatured
  }
} 