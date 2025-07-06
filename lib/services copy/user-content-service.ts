/**
 * ============================================================================
 * USER CONTENT SERVICE
 * ============================================================================
 * 
 * Service for managing personal content annotations, connections, and collections.
 * Enables users to make content "feel like theirs" through notes, ratings, and links.
 */

import { supabase } from '../supabase';
import type { Database } from '../database.types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserContentAnnotation {
  id: string;
  user_id: string;
  content_type: 'bookmark' | 'topic' | 'article' | 'quiz_result';
  content_id: string;
  content_title: string;
  
  // User annotations
  personal_notes?: string;
  key_insights?: string[];
  personal_rating?: number; // 1-5
  
  // Learning context
  why_saved?: string;
  how_it_applies?: string;
  follow_up_questions?: string[];
  
  // Personal organization
  personal_tags?: string[];
  reading_progress?: number; // 0-1
  last_accessed_at: string;
  times_accessed: number;
  
  created_at: string;
  updated_at: string;
}

export interface UserContentConnection {
  id: string;
  user_id: string;
  from_content_type: string;
  from_content_id: string;
  to_content_type: string;
  to_content_id: string;
  connection_type: 'related' | 'builds_on' | 'contradicts' | 'example_of' | 'prerequisite' | 'follow_up';
  connection_note?: string;
  strength: number; // 1-5
  created_at: string;
  updated_at: string;
}

export interface UserContentCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color_theme: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow' | 'gray';
  emoji?: string;
  is_favorite: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ConnectedContent {
  connection_id: string;
  connected_content_type: string;
  connected_content_id: string;
  connection_type: string;
  connection_note?: string;
  strength: number;
  created_at: string;
}

// ============================================================================
// USER CONTENT SERVICE CLASS
// ============================================================================

export class UserContentService {
  
  // ============================================================================
  // ANNOTATIONS MANAGEMENT
  // ============================================================================
  
  /**
   * Get user's annotation for specific content
   */
  static async getAnnotation(
    userId: string,
    contentType: string,
    contentId: string
  ): Promise<{ annotation: UserContentAnnotation | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_content_annotations')
        .select('*')
        .eq('user_id', userId)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { annotation: null, error: error.message };
      }

      return { annotation: data || null, error: null };
    } catch (error) {
      return { annotation: null, error: 'Failed to fetch annotation' };
    }
  }

  /**
   * Create or update user's annotation for content
   */
  static async saveAnnotation(
    annotation: Partial<UserContentAnnotation> & {
      user_id: string;
      content_type: string;
      content_id: string;
      content_title: string;
    }
  ): Promise<{ annotation: UserContentAnnotation | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_content_annotations')
        .upsert({
          ...annotation,
          updated_at: new Date().toISOString(),
          times_accessed: annotation.times_accessed ? annotation.times_accessed + 1 : 1,
          last_accessed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,content_type,content_id'
        })
        .select()
        .single();

      if (error) {
        return { annotation: null, error: error.message };
      }

      return { annotation: data, error: null };
    } catch (error) {
      return { annotation: null, error: 'Failed to save annotation' };
    }
  }

  /**
   * Update reading progress for content
   */
  static async updateProgress(
    userId: string,
    contentType: string,
    contentId: string,
    progress: number
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('user_content_annotations')
        .upsert({
          user_id: userId,
          content_type: contentType,
          content_id: contentId,
          reading_progress: Math.max(0, Math.min(1, progress)),
          last_accessed_at: new Date().toISOString(),
          times_accessed: 1, // Will be incremented by the upsert logic
        }, {
          onConflict: 'user_id,content_type,content_id'
        });

      if (error) {
        console.error('Error updating progress:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating progress:', error);
      return { success: false, error: 'Failed to update progress' };
    }
  }

  /**
   * Get all annotations for a user with optional filtering
   */
  static async getUserAnnotations(
    userId: string,
    options: {
      contentType?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'updated_at' | 'created_at' | 'times_accessed' | 'personal_rating';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ annotations: UserContentAnnotation[]; error: string | null }> {
    try {
      let query = supabase
        .from('user_content_annotations')
        .select('*')
        .eq('user_id', userId);

      if (options.contentType) {
        query = query.eq('content_type', options.contentType);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const sortBy = options.sortBy || 'updated_at';
      const sortOrder = options.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user annotations:', error);
        return { annotations: [], error: error.message };
      }

      return { annotations: data || [], error: null };
    } catch (error) {
      console.error('Error fetching user annotations:', error);
      return { annotations: [], error: 'Failed to fetch annotations' };
    }
  }

  // ============================================================================
  // CONNECTIONS MANAGEMENT
  // ============================================================================

  /**
   * Create connection between two pieces of content
   */
  static async createConnection(
    userId: string,
    fromContentType: string,
    fromContentId: string,
    toContentType: string,
    toContentId: string,
    connectionType: string,
    connectionNote?: string,
    strength: number = 3
  ): Promise<{ connection: UserContentConnection | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_content_connections')
        .insert({
          user_id: userId,
          from_content_type: fromContentType,
          from_content_id: fromContentId,
          to_content_type: toContentType,
          to_content_id: toContentId,
          connection_type: connectionType,
          connection_note: connectionNote,
          strength: Math.max(1, Math.min(5, strength)),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating connection:', error);
        return { connection: null, error: error.message };
      }

      return { connection: data, error: null };
    } catch (error) {
      console.error('Error creating connection:', error);
      return { connection: null, error: 'Failed to create connection' };
    }
  }

  /**
   * Get connected content for a specific item
   */
  static async getConnectedContent(
    userId: string,
    contentType: string,
    contentId: string
  ): Promise<{ connections: ConnectedContent[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_connected_content', {
          p_user_id: userId,
          p_content_type: contentType,
          p_content_id: contentId,
        });

      if (error) {
        console.error('Error fetching connected content:', error);
        return { connections: [], error: error.message };
      }

      return { connections: data || [], error: null };
    } catch (error) {
      console.error('Error fetching connected content:', error);
      return { connections: [], error: 'Failed to fetch connected content' };
    }
  }

  /**
   * Remove connection between content
   */
  static async removeConnection(
    connectionId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('user_content_connections')
        .delete()
        .eq('id', connectionId);

      if (error) {
        console.error('Error removing connection:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error removing connection:', error);
      return { success: false, error: 'Failed to remove connection' };
    }
  }

  // ============================================================================
  // COLLECTIONS MANAGEMENT
  // ============================================================================

  /**
   * Get user's collections
   */
  static async getUserCollections(
    userId: string
  ): Promise<{ collections: UserContentCollection[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_content_collections')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching collections:', error);
        return { collections: [], error: error.message };
      }

      return { collections: data || [], error: null };
    } catch (error) {
      console.error('Error fetching collections:', error);
      return { collections: [], error: 'Failed to fetch collections' };
    }
  }

  /**
   * Create new collection
   */
  static async createCollection(
    collection: Omit<UserContentCollection, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ collection: UserContentCollection | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_content_collections')
        .insert(collection)
        .select()
        .single();

      if (error) {
        console.error('Error creating collection:', error);
        return { collection: null, error: error.message };
      }

      return { collection: data, error: null };
    } catch (error) {
      console.error('Error creating collection:', error);
      return { collection: null, error: 'Failed to create collection' };
    }
  }

  /**
   * Add content to collection
   */
  static async addToCollection(
    userId: string,
    collectionId: string,
    contentType: string,
    contentId: string,
    addedNote?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('user_content_collection_items')
        .insert({
          collection_id: collectionId,
          user_id: userId,
          content_type: contentType,
          content_id: contentId,
          added_note: addedNote,
        });

      if (error) {
        console.error('Error adding to collection:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error adding to collection:', error);
      return { success: false, error: 'Failed to add to collection' };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Search user's content by personal tags or notes
   */
  static async searchUserContent(
    userId: string,
    searchTerm: string
  ): Promise<{ annotations: UserContentAnnotation[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_content_annotations')
        .select('*')
        .eq('user_id', userId)
        .or(`personal_notes.ilike.%${searchTerm}%,personal_tags.cs.{${searchTerm}},content_title.ilike.%${searchTerm}%`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error searching user content:', error);
        return { annotations: [], error: error.message };
      }

      return { annotations: data || [], error: null };
    } catch (error) {
      console.error('Error searching user content:', error);
      return { annotations: [], error: 'Failed to search content' };
    }
  }

  /**
   * Get content insights for user (analytics)
   */
  static async getContentInsights(
    userId: string
  ): Promise<{
    insights: {
      totalAnnotated: number;
      averageRating: number;
      topTags: Array<{ tag: string; count: number }>;
      readingProgress: number;
      totalConnections: number;
    };
    error: string | null;
  }> {
    try {
      // Get basic stats
      const { data: annotations, error: annotationsError } = await supabase
        .from('user_content_annotations')
        .select('personal_rating, personal_tags, reading_progress')
        .eq('user_id', userId);

      if (annotationsError) {
        return {
          insights: {
            totalAnnotated: 0,
            averageRating: 0,
            topTags: [],
            readingProgress: 0,
            totalConnections: 0,
          },
          error: annotationsError.message,
        };
      }

      // Get connections count
      const { count: connectionsCount } = await supabase
        .from('user_content_connections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Process annotations for insights
      const totalAnnotated = annotations?.length || 0;
      const ratingsSum = annotations?.reduce((sum, a) => sum + (a.personal_rating || 0), 0) || 0;
      const ratingsCount = annotations?.filter(a => a.personal_rating).length || 0;
      const averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

      // Calculate average reading progress
      const progressSum = annotations?.reduce((sum, a) => sum + (a.reading_progress || 0), 0) || 0;
      const averageProgress = totalAnnotated > 0 ? progressSum / totalAnnotated : 0;

      // Process tags
      const tagCounts: Record<string, number> = {};
      annotations?.forEach(a => {
        a.personal_tags?.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const topTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      return {
        insights: {
          totalAnnotated,
          averageRating: Math.round(averageRating * 10) / 10,
          topTags,
          readingProgress: Math.round(averageProgress * 100) / 100,
          totalConnections: connectionsCount || 0,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error getting content insights:', error);
      return {
        insights: {
          totalAnnotated: 0,
          averageRating: 0,
          topTags: [],
          readingProgress: 0,
          totalConnections: 0,
        },
        error: 'Failed to get insights',
      };
    }
  }
} 