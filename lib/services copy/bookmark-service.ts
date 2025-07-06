import { supabase } from '../supabase';
import type { Database } from '../database.types';

// ============================================================================
// TYPES
// ============================================================================

type BookmarkRow = Database['public']['Tables']['bookmarks']['Row'];
type BookmarkInsert = Database['public']['Tables']['bookmarks']['Insert'];
type BookmarkUpdate = Database['public']['Tables']['bookmarks']['Update'];

type BookmarkSnippetRow = Database['public']['Tables']['bookmark_snippets']['Row'];
type BookmarkSnippetInsert = Database['public']['Tables']['bookmark_snippets']['Insert'];

type BookmarkCollectionRow = Database['public']['Tables']['bookmark_collections']['Row'];
type BookmarkCollectionInsert = Database['public']['Tables']['bookmark_collections']['Insert'];

type BookmarkTagRow = Database['public']['Tables']['bookmark_tags']['Row'];

export interface CreateBookmarkData {
  contentId: string;
  contentType: 'topic' | 'topics' | 'article' | 'articles' | 'quiz' | 'quizzes' | 'event' | 'events' | 'question' | 'questions' | 'other';
  title: string;
  description?: string | null;
  contentUrl?: string | null;
  thumbnailUrl?: string | null;
  tags?: string[] | null;
  collectionId?: string | null;
  isFavorite?: boolean;
  userNotes?: string | null;
  sourceDomain?: string | null;
}

export interface CreateSnippetData {
  snippetText: string;
  sourceId: string;
  sourceType: string;
  sourceTitle: string;
  sourceUrl?: string;
  selectionStart?: number;
  selectionEnd?: number;
  paragraphIndex?: number;
  fullContext?: string;
  highlightColor?: string;
  userNotes?: string;
  tags?: string[];
  bookmarkId?: string;
  collectionId?: string;
}

export interface CreateCollectionData {
  name: string;
  description?: string;
  emoji?: string;
  color?: string;
  isPublic?: boolean;
  parentCollectionId?: string;
}

export interface BookmarkWithSnippets extends BookmarkRow {
  snippets?: BookmarkSnippetRow[];
  collection?: BookmarkCollectionRow;
}

export interface SnippetWithBookmark extends BookmarkSnippetRow {
  bookmark?: BookmarkRow;
  collection?: BookmarkCollectionRow;
}

// ============================================================================
// BOOKMARK SERVICE
// ============================================================================

export class BookmarkService {
  // ========================================================================
  // BOOKMARKS
  // ========================================================================

  static async createBookmark(userId: string, data: CreateBookmarkData): Promise<{ bookmark: BookmarkRow | null; error: Error | null }> {
    try {
      // Check if bookmark already exists for this content
      const { data: existing } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('content_id', data.contentId)
        .eq('content_type', data.contentType)
        .single();

      if (existing) {
        return { 
          bookmark: null, 
          error: new Error('Content already bookmarked') 
        };
      }

      const bookmarkData: BookmarkInsert = {
        user_id: userId,
        content_id: data.contentId,
        content_type: data.contentType,
        title: data.title,
        description: data.description || null,
        content_url: data.contentUrl || null,
        thumbnail_url: data.thumbnailUrl || null,
        tags: data.tags || null,
        collection_id: data.collectionId || null,
        is_favorite: data.isFavorite || false,
        user_notes: data.userNotes || null,
        source_domain: data.sourceDomain || null,
        access_count: 0,
      };

      const { data: bookmark, error } = await supabase
        .from('bookmarks')
        .insert(bookmarkData)
        .select()
        .single();

      if (error) throw error;

      // Update tag usage counts
      if (data.tags && data.tags.length > 0) {
        await this.updateTagUsageCounts(userId, data.tags, 1);
      }

      return { bookmark, error: null };
    } catch (error) {
      console.error('Error creating bookmark:', error);
      return { bookmark: null, error: error as Error };
    }
  }

  static async getBookmarks(userId: string, options?: {
    contentType?: string;
    collectionId?: string;
    isFavorite?: boolean;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{ bookmarks: BookmarkWithSnippets[]; error: Error | null }> {
    try {
      let query = supabase
        .from('bookmarks')
        .select(`
          *,
          snippets:bookmark_snippets(*),
          collection:bookmark_collections(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.contentType) {
        query = query.eq('content_type', options.contentType);
      }

      if (options?.collectionId) {
        query = query.eq('collection_id', options.collectionId);
      }

      if (options?.isFavorite !== undefined) {
        query = query.eq('is_favorite', options.isFavorite);
      }

      if (options?.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data: bookmarks, error } = await query;

      if (error) throw error;

      return { bookmarks: bookmarks || [], error: null };
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      return { bookmarks: [], error: error as Error };
    }
  }

  static async updateBookmark(userId: string, bookmarkId: string, updates: BookmarkUpdate): Promise<{ bookmark: BookmarkRow | null; error: Error | null }> {
    try {
      const { data: bookmark, error } = await supabase
        .from('bookmarks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookmarkId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { bookmark, error: null };
    } catch (error) {
      console.error('Error updating bookmark:', error);
      return { bookmark: null, error: error as Error };
    }
  }

  static async deleteBookmark(userId: string, bookmarkId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Get bookmark to decrement tag usage
      const { data: bookmark } = await supabase
        .from('bookmarks')
        .select('tags')
        .eq('id', bookmarkId)
        .eq('user_id', userId)
        .single();

      // Delete bookmark (cascades to snippets)
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update tag usage counts
      if (bookmark?.tags && bookmark.tags.length > 0) {
        await this.updateTagUsageCounts(userId, bookmark.tags, -1);
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      return { success: false, error: error as Error };
    }
  }

  static async updateBookmarkAccess(userId: string, bookmarkId: string): Promise<void> {
    try {
      await supabase
        .rpc('increment_bookmark_access', {
          bookmark_id: bookmarkId,
          user_id: userId
        });
    } catch (error) {
      console.error('Error updating bookmark access:', error);
    }
  }

  // ========================================================================
  // SNIPPETS
  // ========================================================================

  static async createSnippet(userId: string, data: CreateSnippetData): Promise<{ snippet: BookmarkSnippetRow | null; error: Error | null }> {
    try {
      const snippetData: BookmarkSnippetInsert = {
        user_id: userId,
        snippet_text: data.snippetText,
        source_id: data.sourceId || null,
        source_type: data.sourceType || null,
        source_title: data.sourceTitle || null,
        source_url: data.sourceUrl || null,
        selection_start: data.selectionStart || null,
        selection_end: data.selectionEnd || null,
        paragraph_index: data.paragraphIndex || null,
        full_context: data.fullContext || null,
        highlight_color: data.highlightColor || '#FEF08A', // Default yellow highlight
        user_notes: data.userNotes || null,
        tags: data.tags || null,
        bookmark_id: data.bookmarkId || null,
        collection_id: data.collectionId || null,
      };

      const { data: snippet, error } = await supabase
        .from('bookmark_snippets')
        .insert(snippetData)
        .select()
        .single();

      if (error) throw error;

      // Update tag usage counts
      if (data.tags && data.tags.length > 0) {
        await this.updateTagUsageCounts(userId, data.tags, 1);
      }

      return { snippet, error: null };
    } catch (error) {
      console.error('Error creating snippet:', error);
      return { snippet: null, error: error as Error };
    }
  }

  static async getSnippets(userId: string, options?: {
    sourceId?: string;
    sourceType?: string;
    bookmarkId?: string;
    collectionId?: string;
    tags?: string[];
    limit?: number;
  }): Promise<{ snippets: SnippetWithBookmark[]; error: Error | null }> {
    try {
      let query = supabase
        .from('bookmark_snippets')
        .select(`
          *,
          bookmark:bookmarks(*),
          collection:bookmark_collections(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.sourceId) {
        query = query.eq('source_id', options.sourceId);
      }

      if (options?.sourceType) {
        query = query.eq('source_type', options.sourceType);
      }

      if (options?.bookmarkId) {
        query = query.eq('bookmark_id', options.bookmarkId);
      }

      if (options?.collectionId) {
        query = query.eq('collection_id', options.collectionId);
      }

      if (options?.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: snippets, error } = await query;

      if (error) throw error;

      return { snippets: snippets || [], error: null };
    } catch (error) {
      console.error('Error fetching snippets:', error);
      return { snippets: [], error: error as Error };
    }
  }

  static async updateSnippet(userId: string, snippetId: string, updates: Partial<BookmarkSnippetInsert>): Promise<{ snippet: BookmarkSnippetRow | null; error: Error | null }> {
    try {
      const { data: snippet, error } = await supabase
        .from('bookmark_snippets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', snippetId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { snippet, error: null };
    } catch (error) {
      console.error('Error updating snippet:', error);
      return { snippet: null, error: error as Error };
    }
  }

  static async deleteSnippet(userId: string, snippetId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Get snippet to decrement tag usage
      const { data: snippet } = await supabase
        .from('bookmark_snippets')
        .select('tags')
        .eq('id', snippetId)
        .eq('user_id', userId)
        .single();

      const { error } = await supabase
        .from('bookmark_snippets')
        .delete()
        .eq('id', snippetId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update tag usage counts
      if (snippet?.tags && snippet.tags.length > 0) {
        await this.updateTagUsageCounts(userId, snippet.tags, -1);
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting snippet:', error);
      return { success: false, error: error as Error };
    }
  }

  // ========================================================================
  // COLLECTIONS
  // ========================================================================

  static async createCollection(userId: string, data: CreateCollectionData): Promise<{ collection: BookmarkCollectionRow | null; error: Error | null }> {
    try {
      const collectionData: BookmarkCollectionInsert = {
        user_id: userId,
        name: data.name,
        description: data.description || null,
        emoji: data.emoji || null,
        color: data.color || null,
        is_public: data.isPublic || false,
        parent_collection_id: data.parentCollectionId || null,
      };

      const { data: collection, error } = await supabase
        .from('bookmark_collections')
        .insert(collectionData)
        .select()
        .single();

      if (error) throw error;

      return { collection, error: null };
    } catch (error) {
      console.error('Error creating collection:', error);
      return { collection: null, error: error as Error };
    }
  }

  static async getCollections(userId: string): Promise<{ collections: BookmarkCollectionRow[]; error: Error | null }> {
    try {
      const { data: collections, error } = await supabase
        .from('bookmark_collections')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

      if (error) throw error;

      return { collections: collections || [], error: null };
    } catch (error) {
      console.error('Error fetching collections:', error);
      return { collections: [], error: error as Error };
    }
  }

  static async updateCollection(userId: string, collectionId: string, updates: Partial<BookmarkCollectionInsert>): Promise<{ collection: BookmarkCollectionRow | null; error: Error | null }> {
    try {
      const { data: collection, error } = await supabase
        .from('bookmark_collections')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collectionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { collection, error: null };
    } catch (error) {
      console.error('Error updating collection:', error);
      return { collection: null, error: error as Error };
    }
  }

  static async deleteCollection(userId: string, collectionId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Move bookmarks and snippets to default collection (null)
      await Promise.all([
        supabase
          .from('bookmarks')
          .update({ collection_id: null })
          .eq('collection_id', collectionId)
          .eq('user_id', userId),
        supabase
          .from('bookmark_snippets')
          .update({ collection_id: null })
          .eq('collection_id', collectionId)
          .eq('user_id', userId),
      ]);

      const { error } = await supabase
        .from('bookmark_collections')
        .delete()
        .eq('id', collectionId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting collection:', error);
      return { success: false, error: error as Error };
    }
  }

  // ========================================================================
  // TAGS
  // ========================================================================

  static async getUserTags(userId: string): Promise<{ tags: BookmarkTagRow[]; error: Error | null }> {
    try {
      const { data: tags, error } = await supabase
        .from('bookmark_tags')
        .select('*')
        .eq('user_id', userId)
        .order('usage_count', { ascending: false, nullsFirst: false })
        .order('tag_name', { ascending: true });

      if (error) throw error;

      return { tags: tags || [], error: null };
    } catch (error) {
      console.error('Error fetching tags:', error);
      return { tags: [], error: error as Error };
    }
  }

  static async createTag(userId: string, tagName: string, color?: string): Promise<{ tag: BookmarkTagRow | null; error: Error | null }> {
    try {
      const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const { data: tag, error } = await supabase
        .from('bookmark_tags')
        .insert({
          user_id: userId,
          tag_name: tagName,
          tag_slug: tagSlug,
          color,
          usage_count: 1,
        })
        .select()
        .single();

      if (error) throw error;

      return { tag, error: null };
    } catch (error) {
      console.error('Error creating tag:', error);
      return { tag: null, error: error as Error };
    }
  }

  private static async updateTagUsageCounts(userId: string, tags: string[], increment: number): Promise<void> {
    try {
      for (const tagName of tags) {
        const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        // Try to update existing tag
        const { data: updated } = await supabase
          .rpc('update_tag_usage', {
            p_user_id: userId,
            p_tag_slug: tagSlug,
            p_increment: increment
          });

        // If tag doesn't exist and increment is positive, create it
        if (!updated && increment > 0) {
          await this.createTag(userId, tagName);
        }
      }
    } catch (error) {
      console.error('Error updating tag usage counts:', error);
    }
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  static async getBookmarkStats(userId: string): Promise<{
    totalBookmarks: number;
    totalSnippets: number;
    totalCollections: number;
    favoriteCount: number;
    recentActivity: number;
    error: Error | null;
  }> {
    try {
      const [bookmarkCount, snippetCount, collectionCount, favoriteCount, recentActivity] = await Promise.all([
        supabase
          .from('bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('bookmark_snippets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('bookmark_collections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_favorite', true),
        supabase
          .from('bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      return {
        totalBookmarks: bookmarkCount.count || 0,
        totalSnippets: snippetCount.count || 0,
        totalCollections: collectionCount.count || 0,
        favoriteCount: favoriteCount.count || 0,
        recentActivity: recentActivity.count || 0,
        error: null,
      };
    } catch (error) {
      console.error('Error fetching bookmark stats:', error);
      return {
        totalBookmarks: 0,
        totalSnippets: 0,
        totalCollections: 0,
        favoriteCount: 0,
        recentActivity: 0,
        error: error as Error,
      };
    }
  }

  static async searchBookmarks(userId: string, query: string, options?: {
    contentType?: string;
    tags?: string[];
    limit?: number;
  }): Promise<{ bookmarks: BookmarkWithSnippets[]; snippets: SnippetWithBookmark[]; error: Error | null }> {
    try {
      const searchQuery = query.toLowerCase();

      // Search bookmarks
      let bookmarkQuery = supabase
        .from('bookmarks')
        .select(`
          *,
          snippets:bookmark_snippets(*),
          collection:bookmark_collections(*)
        `)
        .eq('user_id', userId)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,user_notes.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false });

      // Search snippets
      let snippetQuery = supabase
        .from('bookmark_snippets')
        .select(`
          *,
          bookmark:bookmarks(*),
          collection:bookmark_collections(*)
        `)
        .eq('user_id', userId)
        .or(`snippet_text.ilike.%${searchQuery}%,user_notes.ilike.%${searchQuery}%,ai_summary.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (options?.contentType) {
        bookmarkQuery = bookmarkQuery.eq('content_type', options.contentType);
      }

      if (options?.tags && options.tags.length > 0) {
        bookmarkQuery = bookmarkQuery.overlaps('tags', options.tags);
        snippetQuery = snippetQuery.overlaps('tags', options.tags);
      }

      if (options?.limit) {
        bookmarkQuery = bookmarkQuery.limit(options.limit);
        snippetQuery = snippetQuery.limit(options.limit);
      }

      const [bookmarkResult, snippetResult] = await Promise.all([
        bookmarkQuery,
        snippetQuery,
      ]);

      if (bookmarkResult.error) throw bookmarkResult.error;
      if (snippetResult.error) throw snippetResult.error;

      return {
        bookmarks: bookmarkResult.data || [],
        snippets: snippetResult.data || [],
        error: null,
      };
    } catch (error) {
      console.error('Error searching bookmarks:', error);
      return {
        bookmarks: [],
        snippets: [],
        error: error as Error,
      };
    }
  }

  // ========================================================================
  // CONVENIENCE METHODS FOR DIFFERENT CONTENT TYPES
  // ========================================================================

  static async bookmarkTopic(userId: string, topicId: string, topicTitle: string, description?: string): Promise<{ bookmark: BookmarkRow | null; error: Error | null }> {
    return this.createBookmark(userId, {
      contentId: topicId,
      contentType: 'topic',
      title: topicTitle,
      description,
      contentUrl: `/topics/${topicId}`,
      sourceDomain: 'civicsense.com',
    });
  }

  static async bookmarkArticle(userId: string, articleId: string, title: string, description?: string, thumbnailUrl?: string): Promise<{ bookmark: BookmarkRow | null; error: Error | null }> {
    return this.createBookmark(userId, {
      contentId: articleId,
      contentType: 'article',
      title,
      description,
      thumbnailUrl,
      contentUrl: `/articles/${articleId}`,
      sourceDomain: 'civicsense.com',
    });
  }

  static async bookmarkQuiz(userId: string, quizId: string, quizTitle: string): Promise<{ bookmark: BookmarkRow | null; error: Error | null }> {
    return this.createBookmark(userId, {
      contentId: quizId,
      contentType: 'quiz',
      title: quizTitle,
      contentUrl: `/quiz/${quizId}`,
      sourceDomain: 'civicsense.com',
    });
  }

  static async saveWhyThisMattersSnippet(userId: string, text: string, sourceId: string, sourceTitle: string, userNotes?: string): Promise<{ snippet: BookmarkSnippetRow | null; error: Error | null }> {
    return this.createSnippet(userId, {
      snippetText: text,
      sourceId,
      sourceType: 'why_this_matters',
      sourceTitle,
      sourceUrl: `/topics/${sourceId}`,
      highlightColor: '#FEF08A', // Yellow highlight for "Why This Matters"
      userNotes,
      tags: ['why-this-matters'],
    });
  }
} 