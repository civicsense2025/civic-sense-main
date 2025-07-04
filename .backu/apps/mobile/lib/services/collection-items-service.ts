/**
 * Collection Items Service
 * Handles operations for the bookmark_collection_items junction table
 */

import { supabase } from '../supabase';

export interface CollectionItemInput {
  contentType: 'bookmark' | 'snippet' | 'quiz_result' | 'custom_quiz' | 'topic' | 'lesson' | 'article';
  contentId: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  emoji?: string;
  userNotes?: string;
  userTags?: string[];
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  userId: string;
  contentType: string;
  contentId: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  emoji?: string;
  userNotes?: string;
  userTags?: string[];
  sortOrder: number;
  addedAt: string;
  updatedAt: string;
}

export interface CollectionItemReorder {
  id: string;
  sortOrder: number;
}

export class CollectionItemsService {
  /**
   * Add content to a collection
   */
  static async addToCollection(
    collectionId: string,
    userId: string,
    item: CollectionItemInput
  ): Promise<{ success: boolean; item?: CollectionItem; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('add_content_to_collection', {
        p_collection_id: collectionId,
        p_user_id: userId,
        p_content_type: item.contentType,
        p_content_id: item.contentId,
        p_title: item.title || null,
        p_description: item.description || null,
        p_image_url: item.imageUrl || null,
        p_emoji: item.emoji || null,
        p_user_notes: item.userNotes || null,
        p_user_tags: item.userTags || null,
      });

      if (error) {
        console.error('Error adding content to collection:', error);
        return { success: false, error: error.message };
      }

      if (!data || !data.success) {
        return { success: false, error: data?.error || 'Failed to add content to collection' };
      }

      return {
        success: true,
        item: this.mapCollectionItem(data.item),
      };
    } catch (error) {
      console.error('Error in addToCollection:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Remove content from a collection
   */
  static async removeFromCollection(
    collectionId: string,
    userId: string,
    contentType: string,
    contentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('remove_content_from_collection', {
        p_collection_id: collectionId,
        p_user_id: userId,
        p_content_type: contentType,
        p_content_id: contentId,
      });

      if (error) {
        console.error('Error removing content from collection:', error);
        return { success: false, error: error.message };
      }

      if (!data || !data.success) {
        return { success: false, error: data?.error || 'Failed to remove content from collection' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in removeFromCollection:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get all contents of a collection
   */
  static async getCollectionContents(
    collectionId: string,
    userId: string
  ): Promise<{ contents: CollectionItem[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_collection_contents', {
        p_collection_id: collectionId,
        p_user_id: userId,
      });

      if (error) {
        console.error('Error getting collection contents:', error);
        return { contents: [], error: error.message };
      }

      const contents = (data || []).map(this.mapCollectionItem);
      return { contents };
    } catch (error) {
      console.error('Error in getCollectionContents:', error);
      return { 
        contents: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update the order of items in a collection
   */
  static async reorderItems(
    collectionId: string,
    userId: string,
    itemOrders: CollectionItemReorder[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const ordersJson = itemOrders.map(order => ({
        id: order.id,
        sort_order: order.sortOrder,
      }));

      const { data, error } = await supabase.rpc('reorder_collection_items', {
        p_collection_id: collectionId,
        p_user_id: userId,
        p_item_orders: ordersJson,
      });

      if (error) {
        console.error('Error reordering collection items:', error);
        return { success: false, error: error.message };
      }

      if (!data || !data.success) {
        return { success: false, error: data?.error || 'Failed to reorder items' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in reorderItems:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update user notes and tags for a collection item
   */
  static async updateItemNotes(
    collectionId: string,
    userId: string,
    contentType: string,
    contentId: string,
    userNotes?: string,
    userTags?: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('bookmark_collection_items')
        .update({
          user_notes: userNotes || null,
          user_tags: userTags || null,
          updated_at: new Date().toISOString(),
        })
        .eq('collection_id', collectionId)
        .eq('user_id', userId)
        .eq('content_type', contentType)
        .eq('content_id', contentId);

      if (error) {
        console.error('Error updating item notes:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateItemNotes:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check if content is in any collection for a user
   */
  static async getContentCollections(
    userId: string,
    contentType: string,
    contentId: string
  ): Promise<{ collections: Array<{ id: string; name: string }>; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('bookmark_collection_items')
        .select(`
          collection_id,
          bookmark_collections!inner(
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .eq('content_type', contentType)
        .eq('content_id', contentId);

      if (error) {
        console.error('Error getting content collections:', error);
        return { collections: [], error: error.message };
      }

      const collections = (data || []).map(item => ({
        id: item.collection_id,
        name: (item.bookmark_collections as any).name,
      }));

      return { collections };
    } catch (error) {
      console.error('Error in getContentCollections:', error);
      return { 
        collections: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get collection item count
   */
  static async getCollectionItemCount(
    collectionId: string,
    userId: string
  ): Promise<{ count: number; error?: string }> {
    try {
      const { count, error } = await supabase
        .from('bookmark_collection_items')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', collectionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting collection item count:', error);
        return { count: 0, error: error.message };
      }

      return { count: count || 0 };
    } catch (error) {
      console.error('Error in getCollectionItemCount:', error);
      return { 
        count: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Helper function to convert saved content to collection item format
   */
  static contentToCollectionItem(
    contentType: CollectionItemInput['contentType'],
    savedItem: any
  ): CollectionItemInput {
    return {
      contentType,
      contentId: savedItem.id || savedItem.content_id || '',
      title: savedItem.title || savedItem.topic_title || '',
      description: savedItem.description || '',
      imageUrl: savedItem.image_url || savedItem.imageUrl,
      emoji: savedItem.emoji,
      userNotes: savedItem.userNotes || savedItem.notes,
      userTags: savedItem.userTags || savedItem.tags,
    };
  }

  /**
   * Map database result to CollectionItem interface
   */
  private static mapCollectionItem(item: any): CollectionItem {
    return {
      id: item.id,
      collectionId: item.collection_id,
      userId: item.user_id,
      contentType: item.content_type,
      contentId: item.content_id,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url,
      emoji: item.emoji,
      userNotes: item.user_notes,
      userTags: item.user_tags,
      sortOrder: item.sort_order,
      addedAt: item.added_at,
      updatedAt: item.updated_at,
    };
  }
}

export default CollectionItemsService; 