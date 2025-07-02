"use client"

import { supabase } from './supabase'
// TEMPORARILY DISABLED: Web dependency during monorepo migration
// import { useAuth } from '@/components/auth/auth-provider'

// Temporary stub during monorepo migration
const useAuth = () => ({ user: null })
import { useState, useEffect, useCallback, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  Bookmark,
  BookmarkCollection,
  BookmarkSnippet,
  BookmarkTag,
  CreateBookmarkRequest,
  BookmarkSearchFilters,
  BookmarkAnalyticsEvent,
  ContentType
} from './types/bookmarks'
import type { DbProfile } from './database.types'

// =============================================================================
// BOOKMARK DATABASE OPERATIONS
// =============================================================================

export const bookmarkOperations = {
  /**
   * Create a new bookmark
   */
  async createBookmark(request: CreateBookmarkRequest, userId: string): Promise<Bookmark> {
    // Create the bookmark
    const { data: bookmark, error: bookmarkError } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        content_type: request.content_type,
        content_id: request.content_id,
        content_url: request.content_url,
        title: request.title,
        description: request.description,
        thumbnail_url: request.thumbnail_url,
        source_domain: request.source_domain,
        collection_id: request.collection_id,
        tags: request.tags || [],
        user_notes: request.user_notes,
        is_favorite: false,
        access_count: 0
      })
      .select()
      .single()

    if (bookmarkError) throw bookmarkError

    // Track the creation event
    await bookmarkOperations.trackEvent({
      user_id: userId,
      bookmark_id: bookmark.id,
      event_type: 'view',
      event_data: { content_type: request.content_type, action: 'create' }
    })

    // Update tag usage
    if (request.tags && request.tags.length > 0) {
      await bookmarkOperations.updateTagUsage(userId, request.tags)
    }

    return bookmark as Bookmark
  },

  /**
   * Get user's bookmarks with optional filtering
   */
  async getUserBookmarks(
    userId: string,
    filters?: BookmarkSearchFilters,
    limit: number = 20,
    page: number = 1
  ): Promise<{ bookmarks: Bookmark[]; total: number }> {
    let query = supabase
      .from('bookmarks')
      .select('*, collection:bookmark_collections(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.collection_id) {
      query = query.eq('collection_id', filters.collection_id)
    }
    if (filters?.content_types && filters.content_types.length > 0) {
      query = query.in('content_type', filters.content_types)
    }
    if (filters?.is_favorite !== undefined) {
      query = query.eq('is_favorite', filters.is_favorite)
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags)
    }
    if (filters?.query) {
      query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return {
      bookmarks: data as Bookmark[],
      total: count || 0
    }
  },

  /**
   * Get a single bookmark by ID
   */
  async getBookmark(bookmarkId: string, userId: string): Promise<Bookmark | null> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*, collection:bookmark_collections(*), snippets:bookmark_snippets(*)')
      .eq('id', bookmarkId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    // Track view event and update access time
    await bookmarkOperations.updateBookmarkAccess(bookmarkId, userId)

    return data as Bookmark
  },

  /**
   * Update a bookmark
   */
  async updateBookmark(
    bookmarkId: string,
    updates: Partial<Bookmark>,
    userId: string
  ): Promise<Bookmark> {
    const { data, error } = await supabase
      .from('bookmarks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookmarkId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    // Track update event
    await bookmarkOperations.trackEvent({
      user_id: userId,
      bookmark_id: bookmarkId,
      event_type: 'view',
      event_data: { action: 'update', updated_fields: Object.keys(updates) }
    })

    return data as Bookmark
  },

  /**
   * Delete a bookmark
   */
  async deleteBookmark(bookmarkId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', bookmarkId)
      .eq('user_id', userId)

    if (error) throw error

    // Track deletion event
    await bookmarkOperations.trackEvent({
      user_id: userId,
      bookmark_id: bookmarkId,
      event_type: 'view',
      event_data: { action: 'delete' }
    })
  },

  /**
   * Toggle bookmark favorite status
   */
  async toggleFavorite(bookmarkId: string, userId: string): Promise<boolean> {
    // Get current status
    const { data: current, error: fetchError } = await supabase
      .from('bookmarks')
      .select('is_favorite')
      .eq('id', bookmarkId)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    const newStatus = !current.is_favorite

    // Update status
    const { error: updateError } = await supabase
      .from('bookmarks')
      .update({ is_favorite: newStatus })
      .eq('id', bookmarkId)
      .eq('user_id', userId)

    if (updateError) throw updateError

    return newStatus
  },

  /**
   * Create a bookmark collection (folder)
   */
  async createCollection(
    name: string,
    description: string | null,
    parentId: string | null,
    userId: string
  ): Promise<BookmarkCollection> {
    const { data, error } = await supabase
      .from('bookmark_collections')
      .insert({
        user_id: userId,
        name,
        description,
        parent_collection_id: parentId,
        color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
        icon: '📁'
      })
      .select()
      .single()

    if (error) throw error
    return data as BookmarkCollection
  },

  /**
   * Get user's bookmark collections
   */
  async getUserCollections(userId: string): Promise<BookmarkCollection[]> {
    const { data, error } = await supabase
      .from('bookmark_collections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Build hierarchy
    const collections = data as BookmarkCollection[]
    const collectionsMap = new Map(collections.map(c => [c.id, c]))
    const rootCollections: BookmarkCollection[] = []

    collections.forEach(collection => {
      if (collection.parent_collection_id) {
        const parent = collectionsMap.get(collection.parent_collection_id)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push(collection)
        }
      } else {
        rootCollections.push(collection)
      }
    })

    return rootCollections
  },

  /**
   * Update a collection
   */
  async updateCollection(
    collectionId: string,
    updates: Partial<BookmarkCollection>,
    userId: string
  ): Promise<BookmarkCollection> {
    // Convert smart_criteria to JSON if it exists
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    // Ensure smart_criteria is properly serialized as JSON
    if (updateData.smart_criteria) {
      updateData.smart_criteria = JSON.parse(JSON.stringify(updateData.smart_criteria))
    }

    const { data, error } = await supabase
      .from('bookmark_collections')
      .update(updateData)
      .eq('id', collectionId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data as BookmarkCollection
  },

  /**
   * Delete a collection
   */
  async deleteCollection(collectionId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('bookmark_collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', userId)

    if (error) throw error
  },

  /**
   * Create a bookmark snippet
   */
  async createSnippet(
    bookmarkId: string,
    snippet: {
      snippet_text: string
      user_notes?: string
      source_type?: 'highlight' | 'note' | 'quote' | 'annotation'
      selection_start?: number
      selection_end?: number
      highlight_color?: string
    },
    userId: string
  ): Promise<BookmarkSnippet> {
    const { data, error } = await supabase
      .from('bookmark_snippets')
      .insert({
        user_id: userId,
        bookmark_id: bookmarkId,
        snippet_text: snippet.snippet_text,
        user_notes: snippet.user_notes,
        source_type: snippet.source_type as any,
        selection_start: snippet.selection_start,
        selection_end: snippet.selection_end,
        highlight_color: snippet.highlight_color || '#ffff00',
        tags: []
      })
      .select()
      .single()

    if (error) throw error

    // Track snippet creation
    await bookmarkOperations.trackEvent({
      user_id: userId,
      bookmark_id: bookmarkId,
      snippet_id: data.id,
      event_type: 'highlighted',
      event_data: { source_type: snippet.source_type }
    })

    return data as BookmarkSnippet
  },

  /**
   * Get snippets for a bookmark
   */
  async getBookmarkSnippets(bookmarkId: string, userId: string): Promise<BookmarkSnippet[]> {
    const { data, error } = await supabase
      .from('bookmark_snippets')
      .select('*')
      .eq('bookmark_id', bookmarkId)
      .eq('user_id', userId)
      .order('position', { ascending: true })

    if (error) throw error
    return data as BookmarkSnippet[]
  },

  /**
   * Update a snippet
   */
  async updateSnippet(
    snippetId: string,
    updates: Partial<BookmarkSnippet>,
    userId: string
  ): Promise<BookmarkSnippet> {
    const { data, error } = await supabase
      .from('bookmark_snippets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', snippetId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data as BookmarkSnippet
  },

  /**
   * Delete a snippet
   */
  async deleteSnippet(snippetId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('bookmark_snippets')
      .delete()
      .eq('id', snippetId)
      .eq('user_id', userId)

    if (error) throw error
  },

  /**
   * Get user's tags
   */
  async getUserTags(userId: string): Promise<BookmarkTag[]> {
    const { data, error } = await supabase
      .from('bookmark_tags')
      .select('*')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false })

    if (error) throw error
    return data as BookmarkTag[]
  },

  /**
   * Update tag usage counts
   */
  async updateTagUsage(userId: string, tags: string[]): Promise<void> {
    // Since the RPC function doesn't exist, we'll implement tag usage tracking differently
    // For now, we'll skip this functionality or implement it with direct queries
    try {
      // This would need to be implemented with proper database functions
      console.log('Tag usage update requested for:', userId, tags)
    } catch (error) {
      console.error('Error updating tag usage:', error)
    }
  },

  /**
   * Search bookmarks
   */
  async searchBookmarks(
    userId: string,
    query: string,
    filters?: BookmarkSearchFilters
  ): Promise<{ bookmarks: Bookmark[]; snippets: BookmarkSnippet[] }> {
    // Implement search with direct queries since RPC function doesn't exist
    const bookmarksQuery = supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)

    if (filters?.content_types && filters.content_types.length > 0) {
      bookmarksQuery.in('content_type', filters.content_types)
    }

    const snippetsQuery = supabase
      .from('bookmark_snippets')
      .select('*')
      .eq('user_id', userId)
      .ilike('snippet_text', `%${query}%`)

    const [bookmarksResult, snippetsResult] = await Promise.all([
      bookmarksQuery,
      snippetsQuery
    ])

    return {
      bookmarks: bookmarksResult.data as Bookmark[] || [],
      snippets: snippetsResult.data as BookmarkSnippet[] || []
    }
  },

  /**
   * Check if content is bookmarked
   */
  async isBookmarked(
    contentType: string,
    contentId: string,
    userId: string
  ): Promise<boolean> {
    const { count, error } = await supabase
      .from('bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .eq('content_id', contentId)

    if (error) throw error
    return (count || 0) > 0
  },

  /**
   * Get bookmark by content
   */
  async getBookmarkByContent(
    contentType: string,
    contentId: string,
    userId: string
  ): Promise<Bookmark | null> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data as Bookmark
  },

  /**
   * Get bookmarks for a list of content IDs
   */
  async getBookmarksByContentIds(
    contentType: string,
    contentIds: string[],
    userId: string
  ): Promise<Bookmark[]> {
    if (!contentIds || contentIds.length === 0) {
      return []
    }
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .in('content_id', contentIds)

    if (error) {
      console.error('Error fetching bookmarks by content IDs:', error)
      return []
    }
    return (data as Bookmark[]) || []
  },

  /**
   * Update bookmark access time and count
   */
  async updateBookmarkAccess(bookmarkId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('update_bookmark_access', {
      p_bookmark_id: bookmarkId,
      p_user_id: userId
    })

    if (error) throw error
  },

  /**
   * Track bookmark analytics event
   */
  async trackEvent(event: Omit<BookmarkAnalyticsEvent, 'id' | 'created_at'> & { user_id: string }): Promise<void> {
    const { error } = await supabase
      .from('bookmark_analytics')
      .insert({
        user_id: event.user_id,
        bookmark_id: event.bookmark_id,
        snippet_id: event.snippet_id,
        event_type: event.event_type,
        event_data: event.event_data
      })

    if (error) console.error('Failed to track bookmark event:', error)
  },

  /**
   * Get bookmark statistics for user
   */
  async getUserBookmarkStats(userId: string): Promise<{
    total_bookmarks: number
    total_collections: number
    total_snippets: number
    favorite_count: number
    most_used_tags: string[]
    content_type_breakdown: Record<string, number>
  }> {
    // Get bookmark counts
    const [bookmarksResult, collectionsResult, snippetsResult, favoritesResult] = await Promise.all([
      supabase.from('bookmarks').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('bookmark_collections').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('bookmark_snippets').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('bookmarks').select('id', { count: 'exact' }).eq('user_id', userId).eq('is_favorite', true)
    ])

    // Get content type breakdown
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('content_type')
      .eq('user_id', userId)

    const contentTypeBreakdown: Record<string, number> = {}
    bookmarks?.forEach(b => {
      contentTypeBreakdown[b.content_type] = (contentTypeBreakdown[b.content_type] || 0) + 1
    })

    // Get most used tags
    const { data: tags } = await supabase
      .from('bookmark_tags')
      .select('tag_name')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false })
      .limit(10)

    return {
      total_bookmarks: bookmarksResult.count || 0,
      total_collections: collectionsResult.count || 0,
      total_snippets: snippetsResult.count || 0,
      favorite_count: favoritesResult.count || 0,
      most_used_tags: tags?.map(t => t.tag_name) || [],
      content_type_breakdown: contentTypeBreakdown
    }
  },

  /**
   * Export user's bookmarks
   */
  async exportBookmarks(
    userId: string,
    format: 'json' | 'html' = 'json'
  ): Promise<string | Blob> {
    // Get all user's bookmarks with collections and snippets
    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select('*, collection:bookmark_collections(*), snippets:bookmark_snippets(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    if (format === 'json') {
      return JSON.stringify(bookmarks, null, 2)
    } else {
      // Generate HTML export
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>CivicSense Bookmarks Export</title>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
    .bookmark { margin-bottom: 30px; padding: 20px; border: 1px solid #e1e4e8; border-radius: 6px; }
    .bookmark h2 { margin: 0 0 10px 0; font-size: 18px; }
    .bookmark .url { color: #0366d6; text-decoration: none; font-size: 14px; }
    .bookmark .description { color: #586069; margin: 10px 0; }
    .bookmark .metadata { font-size: 12px; color: #6a737d; }
    .snippet { background: #f6f8fa; padding: 10px; margin: 10px 0; border-left: 3px solid #0366d6; }
    .collection { color: #6f42c1; font-weight: bold; }
  </style>
</head>
<body>
  <h1>CivicSense Bookmarks</h1>
  <p>Exported on ${new Date().toLocaleDateString()}</p>
  ${bookmarks.map((b: any) => `
    <div class="bookmark">
      <h2>${b.title}</h2>
      <a href="${b.url}" class="url">${b.url}</a>
      ${b.description ? `<p class="description">${b.description}</p>` : ''}
      ${b.collection ? `<p class="collection">Collection: ${b.collection.name}</p>` : ''}
      <div class="metadata">
        <span>Type: ${b.content_type}</span> | 
        <span>Created: ${new Date(b.created_at).toLocaleDateString()}</span>
        ${b.tags.length > 0 ? ` | <span>Tags: ${b.tags.join(', ')}</span>` : ''}
      </div>
      ${b.snippets && b.snippets.length > 0 ? `
        <h3>Snippets:</h3>
        ${b.snippets.map((s: any) => `
          <div class="snippet">
            <p>${s.content}</p>
            ${s.note ? `<p><em>Note: ${s.note}</em></p>` : ''}
          </div>
        `).join('')}
      ` : ''}
    </div>
  `).join('')}
</body>
</html>
      `
      
      return new Blob([html], { type: 'text/html' })
    }
  }
}

// =============================================================================
// REACT HOOKS
// =============================================================================

/**
 * Hook for managing bookmarks with real-time updates
 */
export function useBookmarks(filters?: BookmarkSearchFilters) {
  const { user } = useAuth()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Load bookmarks
  const loadBookmarks = useCallback(async () => {
    if (!user?.id) {
      setBookmarks([])
      setTotal(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const result = await bookmarkOperations.getUserBookmarks(user.id, filters)
      setBookmarks(result.bookmarks)
      setTotal(result.total)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load bookmarks:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, filters])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return

    // Set up real-time subscription
    const channel = supabase
      .channel(`bookmarks:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookmarks(prev => [payload.new as Bookmark, ...prev])
            setTotal(prev => prev + 1)
          } else if (payload.eventType === 'UPDATE') {
            setBookmarks(prev =>
              prev.map(b => b.id === payload.new.id ? payload.new as Bookmark : b)
            )
          } else if (payload.eventType === 'DELETE') {
            setBookmarks(prev => prev.filter(b => b.id !== payload.old.id))
            setTotal(prev => prev - 1)
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [user?.id])

  // Load initial data
  useEffect(() => {
    loadBookmarks()
  }, [loadBookmarks])

  const createBookmark = useCallback(async (request: CreateBookmarkRequest) => {
    if (!user?.id) throw new Error('User not authenticated')
    
    const bookmark = await bookmarkOperations.createBookmark(request, user.id)
    return bookmark
  }, [user?.id])

  const updateBookmark = useCallback(async (bookmarkId: string, updates: Partial<Bookmark>) => {
    if (!user?.id) throw new Error('User not authenticated')
    
    const bookmark = await bookmarkOperations.updateBookmark(bookmarkId, updates, user.id)
    return bookmark
  }, [user?.id])

  const deleteBookmark = useCallback(async (bookmarkId: string) => {
    if (!user?.id) throw new Error('User not authenticated')
    
    await bookmarkOperations.deleteBookmark(bookmarkId, user.id)
  }, [user?.id])

  const toggleFavorite = useCallback(async (bookmarkId: string) => {
    if (!user?.id) throw new Error('User not authenticated')
    
    const isFavorite = await bookmarkOperations.toggleFavorite(bookmarkId, user.id)
    return isFavorite
  }, [user?.id])

  return {
    bookmarks,
    total,
    loading,
    error,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    toggleFavorite,
    refresh: loadBookmarks
  }
}

/**
 * Hook for managing bookmark collections
 */
export function useBookmarkCollections() {
  const { user } = useAuth()
  const [collections, setCollections] = useState<BookmarkCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadCollections = useCallback(async () => {
    if (!user?.id) {
      setCollections([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await bookmarkOperations.getUserCollections(user.id)
      setCollections(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load collections:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadCollections()
  }, [loadCollections])

  const createCollection = useCallback(async (
    name: string,
    description: string | null = null,
    parentId: string | null = null
  ) => {
    if (!user?.id) throw new Error('User not authenticated')
    
    const collection = await bookmarkOperations.createCollection(name, description, parentId, user.id)
    setCollections(prev => [...prev, collection])
    return collection
  }, [user?.id])

  const updateCollection = useCallback(async (
    collectionId: string,
    updates: Partial<BookmarkCollection>
  ) => {
    if (!user?.id) throw new Error('User not authenticated')
    
    const collection = await bookmarkOperations.updateCollection(collectionId, updates, user.id)
    setCollections(prev =>
      prev.map(c => c.id === collectionId ? { ...c, ...collection } : c)
    )
    return collection
  }, [user?.id])

  const deleteCollection = useCallback(async (collectionId: string) => {
    if (!user?.id) throw new Error('User not authenticated')
    
    await bookmarkOperations.deleteCollection(collectionId, user.id)
    setCollections(prev => prev.filter(c => c.id !== collectionId))
  }, [user?.id])

  return {
    collections,
    loading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    refresh: loadCollections
  }
}

/**
 * Hook to check if content is bookmarked
 */
export function useIsBookmarked(contentType: string, contentId: string) {
  const { user } = useAuth()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmark, setBookmark] = useState<Bookmark | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id || !contentType || !contentId) {
      setIsBookmarked(false)
      setBookmark(null)
      setLoading(false)
      return
    }

    const checkBookmark = async () => {
      try {
        setLoading(true)
        const bookmarkData = await bookmarkOperations.getBookmarkByContent(
          contentType,
          contentId,
          user.id
        )
        setIsBookmarked(!!bookmarkData)
        setBookmark(bookmarkData)
      } catch (error) {
        console.error('Failed to check bookmark status:', error)
        setIsBookmarked(false)
        setBookmark(null)
      } finally {
        setLoading(false)
      }
    }

    checkBookmark()
  }, [user?.id, contentType, contentId])

  const toggleBookmark = useCallback(async (additionalData?: Partial<CreateBookmarkRequest>) => {
    if (!user?.id) throw new Error('User not authenticated')

    if (isBookmarked && bookmark) {
      await bookmarkOperations.deleteBookmark(bookmark.id, user.id)
      setIsBookmarked(false)
      setBookmark(null)
    } else {
      const newBookmark = await bookmarkOperations.createBookmark({
        content_type: contentType as ContentType,
        content_id: contentId,
        title: additionalData?.title || 'Untitled',
        ...additionalData
      }, user.id)
      setIsBookmarked(true)
      setBookmark(newBookmark)
    }
  }, [user?.id, contentType, contentId, isBookmarked, bookmark])

  return {
    isBookmarked,
    bookmark,
    loading,
    toggleBookmark
  }
}

/**
 * Hook for managing bookmark snippets
 */
export function useBookmarkSnippets(bookmarkId: string) {
  const { user } = useAuth()
  const [snippets, setSnippets] = useState<BookmarkSnippet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadSnippets = useCallback(async () => {
    if (!user?.id || !bookmarkId) {
      setSnippets([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await bookmarkOperations.getBookmarkSnippets(bookmarkId, user.id)
      setSnippets(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load snippets:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, bookmarkId])

  useEffect(() => {
    loadSnippets()
  }, [loadSnippets])

  const createSnippet = useCallback(async (snippet: {
    snippet_text: string
    user_notes?: string
    source_type?: 'highlight' | 'note' | 'quote' | 'annotation'
    selection_start?: number
    selection_end?: number
    highlight_color?: string
  }) => {
    if (!user?.id) throw new Error('User not authenticated')
    
    const newSnippet = await bookmarkOperations.createSnippet(bookmarkId, snippet, user.id)
    setSnippets(prev => [...prev, newSnippet])
    return newSnippet
  }, [user?.id, bookmarkId])

  const updateSnippet = useCallback(async (
    snippetId: string,
    updates: Partial<BookmarkSnippet>
  ) => {
    if (!user?.id) throw new Error('User not authenticated')
    
    const snippet = await bookmarkOperations.updateSnippet(snippetId, updates, user.id)
    setSnippets(prev =>
      prev.map(s => s.id === snippetId ? snippet : s)
    )
    return snippet
  }, [user?.id])

  const deleteSnippet = useCallback(async (snippetId: string) => {
    if (!user?.id) throw new Error('User not authenticated')
    
    await bookmarkOperations.deleteSnippet(snippetId, user.id)
    setSnippets(prev => prev.filter(s => s.id !== snippetId))
  }, [user?.id])

  return {
    snippets,
    loading,
    error,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    refresh: loadSnippets
  }
}

/**
 * Hook for bookmark statistics
 */
export function useBookmarkStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setStats(null)
      setLoading(false)
      return
    }

    const loadStats = async () => {
      try {
        setLoading(true)
        const data = await bookmarkOperations.getUserBookmarkStats(user.id)
        setStats(data)
      } catch (error) {
        console.error('Failed to load bookmark stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [user?.id])

  return { stats, loading }
} 