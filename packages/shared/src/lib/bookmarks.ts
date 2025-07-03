// Temporary stub for bookmarkOperations during monorepo migration
// TODO: Re-enable full functionality when dependencies are resolved

import { supabase } from './supabase'
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
import type { Database } from './database.types'
import type { DbBookmarkAnalyticsInsert } from './database-constants'

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
        content_id: request.content_id || null,
        content_url: request.content_url || null,
        title: request.title,
        description: request.description || null,
        thumbnail_url: request.thumbnail_url || null,
        source_domain: request.source_domain || null,
        collection_id: request.collection_id || null,
        tags: request.tags || [],
        user_notes: request.user_notes || null,
        is_favorite: false,
        access_count: 0
      } as Database['public']['Tables']['bookmarks']['Insert'])
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
  async updateBookmark(bookmarkId: string, updates: Partial<Bookmark>, userId: string): Promise<Bookmark> {
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
   * Create a snippet for a bookmark
   */
  async createSnippet(bookmarkId: string, snippet: Partial<BookmarkSnippet>, userId: string): Promise<BookmarkSnippet> {
    const { data, error } = await supabase
      .from('bookmark_snippets')
      .insert({
        bookmark_id: bookmarkId,
        user_id: userId,
        snippet_text: snippet.snippet_text || '',
        full_context: snippet.full_context || null,
        source_url: snippet.source_url || null,
        source_title: snippet.source_title || null,
        source_type: snippet.source_type || null,
        source_id: snippet.source_id || null,
        selection_start: snippet.selection_start || null,
        selection_end: snippet.selection_end || null,
        paragraph_index: snippet.paragraph_index || null,
        highlight_color: snippet.highlight_color || '#FBBF24',
        user_notes: snippet.user_notes || null,
        tags: snippet.tags || [],
        ai_summary: snippet.ai_summary || null,
        ai_tags: snippet.ai_tags || null
      } as Database['public']['Tables']['bookmark_snippets']['Insert'])
      .select()
      .single()

    if (error) throw error

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
      .order('created_at', { ascending: true })

    if (error) throw error

    return data as BookmarkSnippet[]
  },

  /**
   * Get bookmark by content reference
   */
  async getBookmarkByContent(contentType: string, contentId: string, userId: string): Promise<Bookmark | null> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data as Bookmark
  },

  /**
   * Track bookmark analytics event
   */
  async trackEvent(event: DbBookmarkAnalyticsInsert): Promise<void> {
    const { error } = await supabase
      .from('bookmark_analytics')
      .insert(event)

    if (error) {
      console.error('Failed to track bookmark event:', error)
    }
  },

  /**
   * Update bookmark access time and count
   */
  async updateBookmarkAccess(bookmarkId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('update_bookmark_access', {
      p_bookmark_id: bookmarkId,
      p_user_id: userId
    })

    if (error) {
      console.error('Failed to update bookmark access:', error)
    }

    // Track view event
    await bookmarkOperations.trackEvent({
      user_id: userId,
      bookmark_id: bookmarkId,
      event_type: 'view',
      event_data: { action: 'access' }
    })
  },

  /**
   * Update tag usage counts
   */
  async updateTagUsage(userId: string, tags: string[], increment: number = 1): Promise<void> {
    // Since the RPC function doesn't exist, implement directly
    const { error } = await supabase
      .from('bookmark_tags')
      .upsert(
        tags.map(tag => ({
          user_id: userId,
          tag_name: tag,
          tag_slug: tag.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          usage_count: increment
        })),
        {
          onConflict: 'user_id,tag_slug',
          ignoreDuplicates: false
        }
      )

    if (error) {
      console.error('Failed to update tag usage:', error)
    }
  }
} 