import { 
  Collection, 
  UserCollectionProgress 
} from '../../types/collections';
import { buildApiUrl } from '../../config/api-config';

export interface CollectionDetailResponse {
  collection: Collection;
  progress?: UserCollectionProgress;
  items?: any[]; // Collection items if included
}

export interface ApiError {
  message: string;
  status?: number;
}

// Extended collection type that includes items from API
interface CollectionWithItems extends Collection {
  collection_items?: any[];
}

// Mock collections for fallback - using actual slugs from your app
const mockCollectionsMap: Record<string, Collection> = {
  'media-literacy-politics': {
    id: 'media-literacy-politics-id',
    title: 'Media Literacy in Politics: Spot the Spin',
    description: 'Learn to identify bias, verify sources, and navigate political information in the digital age.',
    emoji: '📺',
    slug: 'media-literacy-politics',
    difficulty_level: 3,
    estimated_minutes: 35,
    content_items_count: 4,
    prerequisites: [],
    learning_objectives: [
      'Identify different types of media bias',
      'Learn fact-checking techniques and tools',
      'Understand how algorithms shape political views',
      'Develop critical media consumption skills'
    ],
    action_items: [
      'Fact-check a political claim using multiple sources',
      'Analyze your social media political bubble',
      'Compare coverage of the same story across outlets',
      'Practice identifying bias in news articles'
    ],
    current_events_relevance: 5,
    political_balance_score: 4,
    source_diversity_score: 5,
    tags: ['media-literacy', 'bias', 'fact-checking', 'misinformation'],
    categories: ['Media Literacy', 'Critical Thinking', 'Information Literacy'],
    status: 'published',
    is_featured: false,
    visibility: 'public',
    view_count: 6780,
    completion_count: 1890,
    avg_rating: 4.5,
    total_ratings: 324,
    created_by: 'system',
    created_at: '2024-02-25T00:00:00Z',
    updated_at: '2024-02-25T00:00:00Z',
    published_at: '2024-02-25T00:00:00Z'
  },
  'constitution-fundamentals': {
    id: '963c070a-c421-497d-9886-1297578e8ae3',
    title: 'The Constitution: America\'s Rulebook',
    description: 'Understand the Constitution\'s structure, key principles, and amendments that shape American government and protect your rights.',
    emoji: '📜',
    slug: 'constitution-fundamentals',
    difficulty_level: 1,
    estimated_minutes: 15,
    content_items_count: 1,
    prerequisites: [],
    learning_objectives: [
      'Understand the Constitution\'s structure and key principles',
      'Identify how constitutional amendments expanded rights',
      'Recognize constitutional protections in daily life',
      'Connect constitutional principles to current debates'
    ],
    action_items: [
      'Read the Bill of Rights and identify protections that affect you',
      'Find a current constitutional debate in the news',
      'Look up how your state ratified key amendments',
      'Identify constitutional issues in your community'
    ],
    current_events_relevance: 4,
    political_balance_score: 5,
    source_diversity_score: 5,
    tags: ['civics-fundamentals', 'constitution', 'bill-of-rights', 'amendments'],
    categories: ['Constitutional Law', 'Civil Rights', 'Historical Precedent'],
    status: 'published',
    is_featured: false,
    visibility: 'public',
    view_count: 12100,
    completion_count: 2890,
    avg_rating: 4.8,
    total_ratings: 623,
    created_by: 'system',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
    published_at: '2024-01-10T00:00:00Z'
  },
  'congress-decoded': {
    id: '57ddffe5-0496-4a18-9d46-2380292736a5',
    title: 'Congress Decoded: How Laws Actually Get Made',
    description: 'Discover the hidden reality behind America\'s $6.8 trillion budget and 14% approval rating',
    emoji: '🏛️',
    slug: 'congress-decoded',
    difficulty_level: 3,
    estimated_minutes: 240,
    content_items_count: 4,
    prerequisites: [],
    learning_objectives: [
      'Analyze verified congressional dysfunction using current legislative data',
      'Investigate lobbying influence with $4.1 billion annual spending figures',
      'Understand why 90% of bills die in committee using procedural analysis'
    ],
    action_items: [
      'Use Congress.gov to track specific bills that affect your community',
      'Research your representatives\' committee assignments and donor connections',
      'Contact congressional offices about pending legislation'
    ],
    current_events_relevance: 5,
    political_balance_score: 4,
    source_diversity_score: 4,
    tags: ['congress', 'legislation', 'lobbying', 'committees'],
    categories: ['Government', 'Legislative Process', 'Public Policy'],
    status: 'published',
    is_featured: true,
    featured_order: 1,
    visibility: 'public',
    view_count: 15420,
    completion_count: 3840,
    avg_rating: 4.7,
    total_ratings: 892,
    created_by: 'system',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    published_at: '2024-01-15T00:00:00Z'
  }
};

export class CollectionDetailApiService {
  /**
   * Fetch a single collection by slug from the database
   */
  static async getCollectionBySlug(slug: string): Promise<{
    data: CollectionDetailResponse | null;
    error: ApiError | null;
  }> {
    try {
      console.log('🔄 Fetching collection details for:', slug);
      
      // Try to fetch from API first using proper URL building
      const url = buildApiUrl(`/api/collections/${slug}`);
      console.log('🌐 API Request:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          console.log('✅ Successfully fetched collection from database');
          
          // Ensure all required fields are present with defaults
          const collection = this.normalizeCollectionData(data);
          
          return {
            data: {
              collection,
              progress: data.progress,
              items: data.collection_items
            },
            error: null
          };
        }
      }
      
      console.warn('⚠️ API fetch failed, using mock data for:', slug);
      
    } catch (error) {
      console.warn('⚠️ API error, falling back to mock data:', error);
    }

    // Fallback to mock data for specific slugs
    const mockCollection = mockCollectionsMap[slug];
    if (mockCollection) {
      console.log('✅ Using mock data for collection:', slug);
      return {
        data: {
          collection: mockCollection,
          progress: this.generateMockProgress(mockCollection.id),
          items: []
        },
        error: null
      };
    }

    // Collection not found
    console.error('❌ Collection not found:', slug);
    return {
      data: null,
      error: {
        message: `Collection '${slug}' not found`,
        status: 404
      }
    };
  }

  /**
   * Normalize collection data to ensure all required fields are present
   */
  private static normalizeCollectionData(collection: any): Collection {
    return {
      id: collection.id,
      title: collection.title,
      description: collection.description,
      emoji: collection.emoji || '📚',
      slug: collection.slug,
      cover_image_url: collection.cover_image_url,
      
      // Learning metadata with defaults
      difficulty_level: collection.difficulty_level || 1,
      estimated_minutes: collection.estimated_minutes || 30,
      prerequisites: collection.prerequisites || [],
      learning_objectives: collection.learning_objectives || [],
      
      // CivicSense specific with defaults
      action_items: collection.action_items || [],
      current_events_relevance: collection.current_events_relevance || 3,
      political_balance_score: collection.political_balance_score || 3,
      source_diversity_score: collection.source_diversity_score || 3,
      
      // Discovery & organization
      tags: collection.tags || [],
      categories: collection.categories || [],
      
      // Status & visibility
      status: collection.status || 'published',
      is_featured: collection.is_featured || false,
      featured_order: collection.featured_order,
      visibility: collection.visibility || 'public',
      
      // Analytics with defaults
      view_count: collection.view_count || 0,
      completion_count: collection.completion_count || 0,
      avg_rating: collection.avg_rating || 0,
      total_ratings: collection.total_ratings || 0,
      
      // Metadata
      created_by: collection.created_by || 'system',
      created_at: collection.created_at || new Date().toISOString(),
      updated_at: collection.updated_at || new Date().toISOString(),
      published_at: collection.published_at,
      
      // Relationships - using correct field name
      progress: collection.progress,
      items_count: collection.items_count || collection.collection_items?.length || 0,
      content_items_count: collection.content_items_count || collection.collection_items?.length || 0,
      
      // Mobile-specific fields
      mobile_thumbnail_url: collection.mobile_thumbnail_url || collection.cover_image_url,
      mobile_hero_image_url: collection.mobile_hero_image_url || collection.cover_image_url,
      mobile_preview_text: collection.mobile_preview_text || collection.description,
    };
  }

  /**
   * Generate mock progress for demonstration/testing
   */
  static generateMockProgress(collectionId: string, userId?: string): UserCollectionProgress {
    const progressPercentage = Math.floor(Math.random() * 100);
    
    return {
      id: `progress-${collectionId}`,
      user_id: userId || 'mock-user',
      collection_id: collectionId,
      completed_items: [],
      current_item_id: undefined,
      progress_percentage: progressPercentage,
      total_time_spent_minutes: Math.floor(Math.random() * 200),
      started_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      completed_at: progressPercentage === 100 ? new Date().toISOString() : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Update collection progress
   */
  static async updateProgress(
    slug: string,
    progressData: Partial<UserCollectionProgress>
  ): Promise<{
    data: UserCollectionProgress | null;
    error: ApiError | null;
  }> {
    try {
      const url = buildApiUrl(`/api/collections/${slug}/progress`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          data: null,
          error: {
            message: errorData.message || `Failed to update progress: ${response.statusText}`,
            status: response.status
          }
        };
      }

      const data = await response.json();
      return { data, error: null };

    } catch (error) {
      console.error('Error updating progress:', error);
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update progress',
          status: 0
        }
      };
    }
  }

  /**
   * Fetch collection items with their content
   */
  static async getCollectionItems(
    collectionId: string
  ): Promise<{
    data: any[] | null;
    error: ApiError | null;
  }> {
    try {
      const url = buildApiUrl(`/api/collections/${collectionId}/items`);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        return {
          data: null,
          error: {
            message: `Failed to fetch items: ${response.statusText}`,
            status: response.status
          }
        };
      }

      const data = await response.json();
      return { data, error: null };

    } catch (error) {
      console.error('Error fetching collection items:', error);
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch items',
          status: 0
        }
      };
    }
  }
} 