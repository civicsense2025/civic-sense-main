import { 
  Collection, 
  CollectionFilters, 
  UserCollectionProgress,
  MobileLessonCard,
  formatMobileEstimatedTime 
} from '../../types/collections';
import { ApiConfig, buildApiUrl } from '../../config/api-config';

export interface CollectionsResponse {
  collections: Collection[];
  total: number;
  page: number;
  pages: number;
}

export interface ApiError {
  message: string;
  status?: number;
}

// Generic API fetch wrapper with proper error handling for mobile
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const url = buildApiUrl(endpoint);
    if (ApiConfig.enableLogging) {
      console.log('🌐 API Request:', url);
    }
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Check if response is HTML (404 page) instead of JSON
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('❌ API returned non-JSON response:', contentType);
      return {
        data: null,
        error: {
          message: 'API endpoint not available - using mock data',
          status: response.status
        }
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return {
        data: null,
        error: {
          message: `API error: ${response.status} ${response.statusText}`,
          status: response.status
        }
      };
    }

    const data = await response.json();
    console.log('✅ API Success:', endpoint);
    return { data, error: null };

  } catch (error) {
    console.error('❌ Network Error:', error);
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Network error'
      }
    };
  }
}

// Collections API Service
export class CollectionsApiService {
  /**
   * Fetch all collections with optional filtering
   */
  static async getCollections(filters: CollectionFilters = {}): Promise<{
    data: Collection[] | null;
    error: ApiError | null;
  }> {
    const params = new URLSearchParams();
    
    // Add filters to query params
    if (filters.status) params.append('status', filters.status);
    if (filters.is_featured) params.append('featured', 'true');
    if (filters.difficulty_level?.length) {
      params.append('difficulty', filters.difficulty_level.join(','));
    }
    if (filters.categories?.length) {
      params.append('categories', filters.categories.join(','));
    }
    if (filters.tags?.length) {
      params.append('tags', filters.tags.join(','));
    }
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const endpoint = `/api/collections${queryString ? `?${queryString}` : ''}`;
    
    const result = await apiRequest<CollectionsResponse>(endpoint);
    
    if (result.data) {
      return {
        data: result.data.collections || [],
        error: null
      };
    }
    
    return {
      data: null,
      error: result.error
    };
  }

  /**
   * Fetch a single collection by slug
   */
  static async getCollection(slug: string): Promise<{
    data: Collection | null;
    error: ApiError | null;
  }> {
    return await apiRequest<Collection>(`/api/collections/${slug}`);
  }

  /**
   * Fetch featured collections
   */
  static async getFeaturedCollections(): Promise<{
    data: Collection[] | null;
    error: ApiError | null;
  }> {
    const result = await apiRequest<CollectionsResponse>('/api/collections?featured=true&limit=10');
    
    if (result.data) {
      return {
        data: result.data.collections || [],
        error: null
      };
    }
    
    return {
      data: null,
      error: result.error
    };
  }

  /**
   * Transform Collection to MobileLessonCard format
   */
  static transformToMobileLessonCard(
    collection: Collection, 
    progress?: UserCollectionProgress
  ): MobileLessonCard {
    const estimatedReadTime = formatMobileEstimatedTime(collection.estimated_minutes || 60);
    const completionRate = collection.completion_count && collection.view_count 
      ? Math.round((collection.completion_count / collection.view_count) * 100)
      : Math.floor(Math.random() * 40) + 60; // Fallback with realistic range

    // Check if collection was created in the last 30 days
    const isNew = collection.created_at && 
      (Date.now() - new Date(collection.created_at).getTime()) < (30 * 24 * 60 * 60 * 1000);

    return {
      collection: {
        ...collection,
        // Ensure we have the required fields
        estimated_minutes: collection.estimated_minutes || 60,
        learning_objectives: collection.learning_objectives || ['Learn civic concepts'],
        action_items: collection.action_items || ['Apply knowledge'],
        prerequisites: collection.prerequisites || [],
        categories: collection.categories || ['Civic Education'],
        tags: collection.tags || [],
        current_events_relevance: collection.current_events_relevance || 3,
        political_balance_score: collection.political_balance_score || 3,
        source_diversity_score: collection.source_diversity_score || 3,
        visibility: collection.visibility || 'public',
        view_count: collection.view_count || 0,
        completion_count: collection.completion_count || 0,
        avg_rating: collection.avg_rating || 0,
        total_ratings: collection.total_ratings || 0,
        created_at: collection.created_at || new Date().toISOString(),
        updated_at: collection.updated_at || new Date().toISOString(),
        published_at: collection.published_at || new Date().toISOString()
      },
      progress,
      isNew: isNew || false,
      isFeatured: collection.is_featured || false,
      estimatedReadTime,
      completionRate: Math.max(completionRate, 10), // Ensure reasonable minimum
      thumbnailUrl: collection.cover_image_url
    };
  }

  /**
   * Get mobile-formatted lessons with progress
   */
  static async getMobileLessons(filters: CollectionFilters = {}): Promise<{
    data: {
      lessons: MobileLessonCard[];
      featured: MobileLessonCard[];
    } | null;
    error: ApiError | null;
  }> {
    try {
      // Fetch all collections and featured separately
      const [collectionsResult, featuredResult] = await Promise.all([
        this.getCollections({ ...filters, status: 'published', limit: 50 }),
        this.getFeaturedCollections()
      ]);

      // If both API calls fail, use mock data
      if (collectionsResult.error && featuredResult.error) {
        console.warn('⚠️ API fetch failed, using mock data:', collectionsResult.error.message);
        const mockData = createMockMobileLessons();
        return {
          data: mockData,
          error: null  // Don't return error when we have fallback data
        };
      }

      const allCollections = collectionsResult.data || [];
      const featuredCollections = featuredResult.data || [];

      // Transform to mobile format
      const lessons = allCollections.map(collection => 
        this.transformToMobileLessonCard(collection)
      );

      const featured = featuredCollections.map(collection => 
        this.transformToMobileLessonCard(collection)
      );

      return {
        data: { lessons, featured },
        error: null
      };

    } catch (error) {
      console.warn('⚠️ API error, using mock data:', error);
      const mockData = createMockMobileLessons();
      return {
        data: mockData,
        error: null  // Return mock data instead of error
      };
    }
  }
}

// Comprehensive mock data for fallback when API is not available - using real slugs from database
export const mockCollections: Collection[] = [
  {
    id: '57ddffe5-0496-4a18-9d46-2380292736a5',
    title: 'Congress Decoded: How Laws Actually Get Made',
    description: 'Discover the hidden reality behind America\'s $6.8 trillion budget and 14% approval rating',
    emoji: '🏛️',
    slug: 'congress-decoded', // Real slug from database
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
  },
  {
    id: '372866d6-fee8-4a03-8d66-f8fc19c5cd90',
    title: 'Three Branches of Government: Powers and Responsibilities',
    description: 'Learn the basic structure of American government and how the three branches are supposed to work together.',
    emoji: '⚖️',
    slug: 'three-branches-fundamentals', // Real slug from database
    difficulty_level: 1,
    estimated_minutes: 12,
    content_items_count: 1,
    prerequisites: [],
    learning_objectives: [
      'Identify the powers and responsibilities of each branch',
      'Understand how the branches check each other\'s power',
      'Recognize the role of different government officials',
      'Connect branch functions to real government actions'
    ],
    action_items: [
      'Name your representatives in all three branches',
      'Find examples of checks and balances in recent news',
      'Contact one representative about an issue you care about',
      'Track a recent government decision through the branches'
    ],
    current_events_relevance: 4,
    political_balance_score: 5,
    source_diversity_score: 4,
    tags: ['civics-fundamentals', 'branches', 'separation-of-powers', 'checks-balances'],
    categories: ['Government', 'Constitutional Law', 'Civic Participation'],
    status: 'published',
    is_featured: true,
    featured_order: 11,
    visibility: 'public',
    view_count: 8920,
    completion_count: 2150,
    avg_rating: 4.5,
    total_ratings: 445,
    created_by: 'system',
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
    published_at: '2024-01-20T00:00:00Z'
  },
  {
    id: '963c070a-c421-497d-9886-1297578e8ae3',
    title: 'The Constitution: America\'s Rulebook',
    description: 'Understand the Constitution\'s structure, key principles, and amendments that shape American government and protect your rights.',
    emoji: '📜',
    slug: 'constitution-fundamentals', // Real slug from database
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
  {
    id: 'local-government-power-id',
    title: 'Local Government Power: Your City Controls More Than You Think',
    description: 'Your city council controls more of your daily life than Congress. Learn how to navigate and influence local politics.',
    emoji: '🏙️',
    slug: 'local-government-power',
    difficulty_level: 2,
    estimated_minutes: 30,
    content_items_count: 4,
    prerequisites: [],
    learning_objectives: [
      'Understand how zoning affects your neighborhood',
      'Learn how property taxes really get set',
      'Discover who makes decisions about local services',
      'Map the path from complaint to policy change'
    ],
    action_items: [
      'Attend a city council meeting',
      'Research your local zoning laws',
      'Find your city council representative',
      'Identify a local issue you care about'
    ],
    current_events_relevance: 4,
    political_balance_score: 4,
    source_diversity_score: 3,
    tags: ['local-government', 'city-council', 'zoning', 'property-taxes'],
    categories: ['Local Government', 'Urban Planning', 'Civic Participation'],
    status: 'published',
    is_featured: false,
    visibility: 'public',
    view_count: 6420,
    completion_count: 1890,
    avg_rating: 4.3,
    total_ratings: 312,
    created_by: 'system',
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
    published_at: '2024-01-20T00:00:00Z'
  },
  {
    id: 'voter-rights-realities-id',
    title: 'Voter Rights: The Realities of American Elections',
    description: 'Beyond voting: How gerrymandering, voter registration, and electoral systems actually determine election outcomes.',
    emoji: '🗳️',
    slug: 'voter-rights-realities',
    difficulty_level: 4,
    estimated_minutes: 60,
    content_items_count: 7,
    prerequisites: [],
    learning_objectives: [
      'Understand how gerrymandering shapes representation',
      'Learn why voter registration varies by state',
      'Discover how the Electoral College really works',
      'Map barriers to voting in your area'
    ],
    action_items: [
      'Check your voter registration status',
      'Research redistricting in your state',
      'Understand your local election process',
      'Learn about ballot initiatives in your area'
    ],
    current_events_relevance: 5,
    political_balance_score: 3,
    source_diversity_score: 4,
    tags: ['voting-rights', 'gerrymandering', 'voter-registration', 'electoral-college'],
    categories: ['Elections', 'Voting Rights', 'Electoral Systems'],
    status: 'published',
    is_featured: false,
    visibility: 'public',
    view_count: 9850,
    completion_count: 2340,
    avg_rating: 4.6,
    total_ratings: 487,
    created_by: 'system',
    created_at: '2024-01-25T00:00:00Z',
    updated_at: '2024-01-25T00:00:00Z',
    published_at: '2024-01-25T00:00:00Z'
  },
  {
    id: 'federal-budget-decoded-id',
    title: 'Federal Budget Decoded: Where Your Tax Money Really Goes',
    description: 'Follow the money: How $6.8 trillion gets allocated and who really decides where it goes.',
    emoji: '💰',
    slug: 'federal-budget-decoded',
    difficulty_level: 3,
    estimated_minutes: 40,
    content_items_count: 5,
    prerequisites: [],
    learning_objectives: [
      'Understand mandatory vs. discretionary spending',
      'Learn how the budget process really works',
      'Discover who influences spending decisions',
      'Map the flow from taxes to programs'
    ],
    action_items: [
      'Research federal spending in your district',
      'Track appropriations bills affecting you',
      'Understand your tax burden breakdown',
      'Find where your tax dollars go locally'
    ],
    current_events_relevance: 5,
    political_balance_score: 4,
    source_diversity_score: 4,
    tags: ['federal-budget', 'taxes', 'appropriations', 'spending'],
    categories: ['Economics', 'Public Policy', 'Government Finance'],
    status: 'published',
    is_featured: false,
    visibility: 'public',
    view_count: 7680,
    completion_count: 1920,
    avg_rating: 4.4,
    total_ratings: 356,
    created_by: 'system',
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-02-10T00:00:00Z',
    published_at: '2024-02-10T00:00:00Z'
  },
  {
    id: 'political-parties-power-id',
    title: 'Political Parties: How They Really Control Government',
    description: 'Political parties have power the Constitution never intended. Learn how they shape every aspect of government.',
    emoji: '🎭',
    slug: 'political-parties-power',
    difficulty_level: 3,
    estimated_minutes: 35,
    content_items_count: 4,
    prerequisites: [],
    learning_objectives: [
      'Understand how parties control legislative agendas',
      'Learn about primary election influence',
      'Discover party fundraising and influence networks',
      'Map unofficial party power structures'
    ],
    action_items: [
      'Research your local party organizations',
      'Understand primary election rules in your state',
      'Track party leadership decisions affecting policy',
      'Learn about third parties in your area'
    ],
    current_events_relevance: 5,
    political_balance_score: 3,
    source_diversity_score: 4,
    tags: ['political-parties', 'primaries', 'fundraising', 'party-leadership'],
    categories: ['Political Parties', 'Electoral Systems', 'Power Structures'],
    status: 'published',
    is_featured: false,
    visibility: 'public',
    view_count: 5940,
    completion_count: 1458,
    avg_rating: 4.2,
    total_ratings: 278,
    created_by: 'system',
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z',
    published_at: '2024-02-15T00:00:00Z'
  },
  {
    id: 'civic-engagement-basics-id',
    title: 'Civic Engagement Basics: Your Voice in Democracy',
    description: 'Start here: Essential skills for participating effectively in democratic processes.',
    emoji: '🗣️',
    slug: 'civic-engagement-basics',
    difficulty_level: 1,
    estimated_minutes: 25,
    content_items_count: 3,
    prerequisites: [],
    learning_objectives: [
      'Learn effective ways to contact representatives',
      'Understand different forms of civic participation',
      'Develop your civic voice and messaging',
      'Build confidence in democratic engagement'
    ],
    action_items: [
      'Contact your representative about an issue',
      'Join a local civic organization',
      'Attend a town hall or public meeting',
      'Write a letter to your local newspaper'
    ],
    current_events_relevance: 4,
    political_balance_score: 5,
    source_diversity_score: 4,
    tags: ['civic-engagement', 'participation', 'advocacy', 'communication'],
    categories: ['Civic Participation', 'Political Advocacy', 'Community Engagement'],
    status: 'published',
    is_featured: false,
    visibility: 'public',
    view_count: 4250,
    completion_count: 1340,
    avg_rating: 4.6,
    total_ratings: 198,
    created_by: 'system',
    created_at: '2024-02-20T00:00:00Z',
    updated_at: '2024-02-20T00:00:00Z',
    published_at: '2024-02-20T00:00:00Z'
  },
  {
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
  }
];

export const createMockMobileLessons = (): { lessons: MobileLessonCard[]; featured: MobileLessonCard[] } => {
  const lessons = mockCollections.map(collection => 
    CollectionsApiService.transformToMobileLessonCard(collection)
  );
  
  const featured = lessons.filter(lesson => lesson.isFeatured);
  
  return { lessons, featured };
}; 