/**
 * Standardized Collections Service for CivicSense Mobile
 * 
 * Following the proven patterns from StandardizedDataService:
 * 1. Consistent response shapes and error handling
 * 2. Built-in caching with intelligent invalidation  
 * 3. Singleton pattern for state management
 * 4. Database constants usage
 * 5. Proper offline/mock data fallback
 */

import { buildApiUrl } from '../config/api-config';

// =============================================================================
// STANDARDIZED TYPE DEFINITIONS
// =============================================================================

export interface StandardResponse<T = any> {
  data: T | null;
  error: DataError | null;
  metadata?: {
    count?: number;
    cached?: boolean;
    timestamp?: number;
  };
}

export interface DataError {
  code: string;
  message: string;
  details?: any;
  retryable?: boolean;
}

export interface FetchOptions {
  useCache?: boolean;
  maxAge?: number; // Cache TTL in ms
  retries?: number;
  timeout?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  total?: number;
  page: number;
}

// Standardized collection shape
export interface StandardCollection {
  id: string;
  title: string;
  description: string;
  emoji: string;
  slug: string;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  estimated_minutes: number;
  is_featured: boolean;
  status: 'draft' | 'published' | 'archived';
  categories: string[];
  tags: string[];
  learning_objectives: string[];
  action_items: string[];
  view_count: number;
  completion_count: number;
  avg_rating: number;
  created_at: string;
  updated_at: string;
  // Computed fields
  items_count?: number;
  estimated_read_time?: string;
  completion_rate?: number;
  progress?: UserCollectionProgress;
}

export interface UserCollectionProgress {
  id: string;
  user_id: string;
  collection_id: string;
  progress_percentage: number;
  completed_items: string[];
  total_time_spent_minutes: number;
  started_at: string;
  last_accessed_at: string;
  completed_at?: string;
  is_completed: boolean;
}

// Minimal filter type for collections
interface CollectionFilters {
  status?: string;
  is_featured?: boolean;
  limit?: number;
}

// =============================================================================
// CACHE MANAGER
// =============================================================================

class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// =============================================================================
// MOCK DATA (FALLBACK ONLY)
// =============================================================================

const mockCollections: StandardCollection[] = [
  {
    id: '57ddffe5-0496-4a18-9d46-2380292736a5',
    title: 'Congress Decoded: How Laws Actually Get Made',
    description: 'Discover the hidden reality behind America\'s $6.8 trillion budget and 14% approval rating',
    emoji: '🏛️',
    slug: 'congress-decoded',
    difficulty_level: 3,
    estimated_minutes: 240,
    is_featured: true,
    status: 'published',
    categories: ['Government', 'Legislative Process'],
    tags: ['congress', 'legislation', 'lobbying'],
    learning_objectives: [
      'Analyze verified congressional dysfunction using current legislative data',
      'Investigate lobbying influence with $4.1 billion annual spending figures'
    ],
    action_items: [
      'Use Congress.gov to track specific bills that affect your community',
      'Research your representatives\' committee assignments and donor connections'
    ],
    view_count: 15420,
    completion_count: 3840,
    avg_rating: 4.7,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    items_count: 4,
    estimated_read_time: '4h read',
    completion_rate: 25
  },
  {
    id: '372866d6-fee8-4a03-8d66-f8fc19c5cd90',
    title: 'Three Branches of Government: Powers and Responsibilities',
    description: 'Learn the basic structure of American government and how the three branches are supposed to work together.',
    emoji: '⚖️',
    slug: 'three-branches-fundamentals',
    difficulty_level: 1,
    estimated_minutes: 12,
    is_featured: true,
    status: 'published',
    categories: ['Government', 'Constitutional Law'],
    tags: ['civics-fundamentals', 'branches', 'separation-of-powers'],
    learning_objectives: [
      'Identify the powers and responsibilities of each branch',
      'Understand how the branches check each other\'s power'
    ],
    action_items: [
      'Name your representatives in all three branches',
      'Find examples of checks and balances in recent news'
    ],
    view_count: 8920,
    completion_count: 2150,
    avg_rating: 4.5,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
    items_count: 1,
    estimated_read_time: '12m read',
    completion_rate: 24
  }
];

// =============================================================================
// STANDARDIZED COLLECTIONS SERVICE
// =============================================================================

export class StandardizedCollectionsService {
  private static instance: StandardizedCollectionsService;
  private cache = new CacheManager();

  static getInstance(): StandardizedCollectionsService {
    if (!StandardizedCollectionsService.instance) {
      StandardizedCollectionsService.instance = new StandardizedCollectionsService();
    }
    return StandardizedCollectionsService.instance;
  }

  // =============================================================================
  // COLLECTIONS OPERATIONS
  // =============================================================================

  async fetchCollections(
    filters: CollectionFilters = {},
    options: FetchOptions = {}
  ): Promise<StandardResponse<StandardCollection[]>> {
    const cacheKey = `collections_${JSON.stringify(filters)}`;
    
    try {
      // Check cache first
      if (options.useCache !== false) {
        const cached = this.cache.get<StandardCollection[]>(cacheKey);
        if (cached) {
          console.log('📚 Using cached collections data');
          return {
            data: cached,
            error: null,
            metadata: { cached: true, count: cached.length, timestamp: Date.now() }
          };
        }
      }

      console.log('🔄 Fetching collections from API...');

      // Build query params
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.is_featured) params.append('featured', 'true');
      if (filters.limit) params.append('limit', filters.limit.toString());

      const endpoint = `/api/collections${params.toString() ? `?${params.toString()}` : ''}`;
      const url = buildApiUrl(endpoint);

      // Make API request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 5000);

      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Validate response structure
        if (!data.collections || !Array.isArray(data.collections)) {
          throw new Error('Invalid API response structure');
        }

        const collections = data.collections.map((c: any) => this.standardizeCollection(c));
        
        // Cache successful response
        this.cache.set(cacheKey, collections, options.maxAge || 5 * 60 * 1000);

        console.log(`✅ Successfully fetched ${collections.length} collections from API`);
        
        return {
          data: collections,
          error: null,
          metadata: { count: collections.length, timestamp: Date.now() }
        };

      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ API fetch failed, using mock data:', errorMessage);
      
      // Provide specific debugging info for common issues
      if (errorMessage.includes('Network request failed') || errorMessage.includes('fetch')) {
        console.error('❌ Network Error - API server unreachable');
        console.warn('💡 Check if your web server is running');
        console.warn('💡 Verify your API URL in .env: EXPO_PUBLIC_API_URL');
        console.warn(`💡 Current API URL: ${buildApiUrl('/api/collections')}`);
      } else if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
        console.error('❌ Request Timeout - API server not responding');
        console.warn('💡 Your web server might be slow or overloaded');
        console.warn('💡 Try increasing timeout or check server performance');
      }
      
      // Apply filters to mock data
      let filteredMock = [...mockCollections];
      if (filters.status) {
        filteredMock = filteredMock.filter(c => c.status === filters.status);
      }
      if (filters.is_featured) {
        filteredMock = filteredMock.filter(c => c.is_featured);
      }
      if (filters.limit) {
        filteredMock = filteredMock.slice(0, filters.limit);
      }

      return {
        data: filteredMock,
        error: {
          code: 'API_UNAVAILABLE',
          message: 'Using offline data due to network issues',
          details: error,
          retryable: true
        },
        metadata: { count: filteredMock.length, cached: true, timestamp: Date.now() }
      };
    }
  }

  async fetchCollectionBySlug(
    slug: string,
    options: FetchOptions = {}
  ): Promise<StandardResponse<StandardCollection>> {
    const cacheKey = `collection_${slug}`;
    
    try {
      // Check cache first
      if (options.useCache !== false) {
        const cached = this.cache.get<StandardCollection>(cacheKey);
        if (cached) {
          console.log(`📚 Using cached collection data for ${slug}`);
          return {
            data: cached,
            error: null,
            metadata: { cached: true, timestamp: Date.now() }
          };
        }
      }

      console.log(`🔄 Fetching collection: ${slug} from API...`);

      const endpoint = `/api/collections/${slug}`;
      const url = buildApiUrl(endpoint);

      // Make API request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 5000);

      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.status === 404) {
          return {
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: `Collection with slug "${slug}" not found`,
              retryable: false
            }
          };
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const collection = await response.json();
        const standardizedCollection = this.standardizeCollection(collection);
        
        // Cache successful response
        this.cache.set(cacheKey, standardizedCollection, options.maxAge || 10 * 60 * 1000);

        console.log(`✅ Successfully fetched collection: ${slug}`);
        
        return {
          data: standardizedCollection,
          error: null,
          metadata: { timestamp: Date.now() }
        };

      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`⚠️ API fetch failed for ${slug}, checking mock data:`, errorMessage);
      
      // Provide specific debugging info for common issues
      if (errorMessage.includes('Network request failed') || errorMessage.includes('fetch')) {
        console.error(`❌ Network Error - Cannot reach API for collection: ${slug}`);
        console.warn('💡 Check if your web server is running');
        console.warn('💡 Verify your API URL in .env: EXPO_PUBLIC_API_URL');
        console.warn(`💡 Current API URL: ${buildApiUrl(`/api/collections/${slug}`)}`);
      } else if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
        console.error(`❌ Request Timeout - API not responding for collection: ${slug}`);
        console.warn('💡 Your web server might be slow or overloaded');
        console.warn('💡 Try increasing timeout or check server performance');
      }
      
      // Try to find in mock data
      const mockCollection = mockCollections.find(c => c.slug === slug);
      if (mockCollection) {
        return {
          data: mockCollection,
          error: {
            code: 'API_UNAVAILABLE',
            message: 'Using offline data due to network issues',
            details: error,
            retryable: true
          },
          metadata: { cached: true, timestamp: Date.now() }
        };
      }

      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: `Collection with slug "${slug}" not found`,
          details: error,
          retryable: true
        }
      };
    }
  }

  async fetchFeaturedCollections(
    options: FetchOptions = {}
  ): Promise<StandardResponse<StandardCollection[]>> {
    return this.fetchCollections({ is_featured: true, status: 'published', limit: 10 }, options);
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private standardizeCollection(rawCollection: any): StandardCollection {
    // Ensure all required fields exist with proper defaults
    return {
      id: rawCollection.id || '',
      title: rawCollection.title || 'Untitled Collection',
      description: rawCollection.description || '',
      emoji: rawCollection.emoji || '📚',
      slug: rawCollection.slug || '',
      difficulty_level: rawCollection.difficulty_level || 1,
      estimated_minutes: rawCollection.estimated_minutes || 30,
      is_featured: rawCollection.is_featured || false,
      status: rawCollection.status || 'published',
      categories: Array.isArray(rawCollection.categories) ? rawCollection.categories : [],
      tags: Array.isArray(rawCollection.tags) ? rawCollection.tags : [],
      learning_objectives: Array.isArray(rawCollection.learning_objectives) 
        ? rawCollection.learning_objectives 
        : [],
      action_items: Array.isArray(rawCollection.action_items) 
        ? rawCollection.action_items 
        : [],
      view_count: rawCollection.view_count || 0,
      completion_count: rawCollection.completion_count || 0,
      avg_rating: rawCollection.avg_rating || 0,
      created_at: rawCollection.created_at || new Date().toISOString(),
      updated_at: rawCollection.updated_at || new Date().toISOString(),
      // Computed fields
      items_count: rawCollection.items_count || rawCollection.collection_items?.length || 0,
      estimated_read_time: this.formatEstimatedTime(rawCollection.estimated_minutes || 30),
      completion_rate: rawCollection.view_count && rawCollection.completion_count
        ? Math.round((rawCollection.completion_count / rawCollection.view_count) * 100)
        : 0,
      progress: rawCollection.progress ? this.standardizeProgress(rawCollection.progress) : undefined
    };
  }

  private standardizeProgress(rawProgress: any): UserCollectionProgress {
    return {
      id: rawProgress.id || '',
      user_id: rawProgress.user_id || '',
      collection_id: rawProgress.collection_id || '',
      progress_percentage: rawProgress.progress_percentage || 0,
      completed_items: Array.isArray(rawProgress.completed_items) ? rawProgress.completed_items : [],
      total_time_spent_minutes: rawProgress.total_time_spent_minutes || 0,
      started_at: rawProgress.started_at || new Date().toISOString(),
      last_accessed_at: rawProgress.last_accessed_at || new Date().toISOString(),
      completed_at: rawProgress.completed_at,
      is_completed: rawProgress.is_completed || false
    };
  }

  private formatEstimatedTime(minutes: number): string {
    if (minutes < 5) return 'Quick read';
    if (minutes < 15) return `${minutes}m read`;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  }

  // =============================================================================
  // CACHE MANAGEMENT
  // =============================================================================

  invalidateCache(pattern?: string): void {
    if (pattern) {
      this.cache.invalidate(pattern);
    } else {
      this.cache.clear();
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

const standardizedCollectionsService = StandardizedCollectionsService.getInstance();

export const fetchCollections = (filters?: CollectionFilters, options?: FetchOptions) =>
  standardizedCollectionsService.fetchCollections(filters, options);

export const fetchCollectionBySlug = (slug: string, options?: FetchOptions) =>
  standardizedCollectionsService.fetchCollectionBySlug(slug, options);

export const fetchFeaturedCollections = (options?: FetchOptions) =>
  standardizedCollectionsService.fetchFeaturedCollections(options);

export default standardizedCollectionsService; 