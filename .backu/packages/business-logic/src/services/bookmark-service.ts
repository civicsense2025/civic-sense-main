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
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        title: request.title,
        url: request.url,
        description: request.description,
        tags: request.tags || [],
        category: request.category,
        source_type: request.sourceType || 'article',
        is_favorite: false
      })
      .select()
      .single()

    if (error) throw error
    return data as Bookmark
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
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    if (filters?.tag) {
      query = query.contains('tags', [filters.tag])
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.sourceType) {
      query = query.eq('source_type', filters.sourceType)
    }
    if (filters?.favorite) {
      query = query.eq('is_favorite', true)
    }
    if (filters?.query) {
      query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
    }

    if (limit) {
      query = query.limit(limit)
    }
    if (page && limit) {
      query = query.range((page - 1) * limit, page * limit - 1)
    }

    const { data, error, count } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return { bookmarks: data as Bookmark[], total: count || 0 }
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
    // Update tag usage statistics
    const { error } = await supabase.rpc('update_tag_usage', {
      p_user_id: userId,
      p_tags: tags,
      p_increment: increment
    })

    if (error) throw error
  },

  async toggleBookmarkFavorite(bookmarkId: string, userId: string): Promise<Bookmark> {
    // First get the current state
    const { data: bookmark, error: getError } = await supabase
      .from('bookmarks')
      .select('is_favorite')
      .eq('id', bookmarkId)
      .eq('user_id', userId)
      .single()

    if (getError) throw getError

    // Toggle the favorite state
    const { data, error } = await supabase
      .from('bookmarks')
      .update({ is_favorite: !bookmark.is_favorite })
      .eq('id', bookmarkId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data as Bookmark
  },

  async getBookmarkStats(userId: string): Promise<BookmarkStats> {
    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error

    const stats = {
      total: bookmarks.length,
      byCategory: {} as Record<string, number>,
      bySourceType: {} as Record<string, number>,
      favorites: bookmarks.filter(b => b.is_favorite).length,
      recentlyAdded: bookmarks.filter(b => {
        const createdAt = new Date(b.created_at)
        const now = new Date()
        const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        return daysDiff <= 7
      }).length,
      topTags: [] as Array<{ tag: string; count: number }>
    }

    // Calculate category stats
    bookmarks.forEach(bookmark => {
      if (bookmark.category) {
        stats.byCategory[bookmark.category] = (stats.byCategory[bookmark.category] || 0) + 1
      }
      if (bookmark.source_type) {
        stats.bySourceType[bookmark.source_type] = (stats.bySourceType[bookmark.source_type] || 0) + 1
      }
    })

    // Calculate top tags
    const tagCounts = new Map<string, number>()
    bookmarks.forEach(bookmark => {
      bookmark.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    stats.topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return stats
  }
} 