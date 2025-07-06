import { Database } from '../database-types';
import { supabase } from '../supabase';

// Type definitions based on actual database schema
export type Category = Database['public']['Tables']['categories']['Row'];
export type QuestionTopic = Database['public']['Tables']['question_topics']['Row'];
export type Question = Database['public']['Tables']['questions']['Row'];

// Extended types for mobile UI
export interface MobileCollection {
  id: string;
  title: string;
  description: string;
  emoji: string;
  slug: string;
  difficulty_level: number;
  estimated_minutes: number;
  items_count: number;
  is_featured: boolean;
  categories: string[];
  tags: string[];
}

export interface MobileTopic {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: string;
  difficulty_level: number;
  question_count: number;
  is_popular: boolean;
  date?: string;
  estimated_minutes?: number;
}

export interface MobileCategory {
  id: string;
  name: string;
  description: string;
  emoji: string;
  topic_count: number;
  collection_count: number;
  display_order: number;
}

export interface DailyQuestionTopic {
  id: string;
  title: string;
  description: string;
  emoji: string;
  date: string;
  difficulty_level: number;
  estimated_minutes: number;
  question_count: number;
  categories?: string[];
  is_completed?: boolean;
}

export interface ProgressSession {
  id: string;
  session_id: string;
  session_type: string;
  topic_id?: string | null;
  assessment_type?: string | null;
  current_question_index: number;
  questions: any[];
  answers: Record<string, any>;
  started_at: string;
  last_updated_at: string;
  metadata?: {
    totalQuestions?: number;
    questionsAnswered?: number;
    score?: number;
    completed?: boolean;
  };
  // Topic details for display
  topic_title?: string;
  difficulty_level?: string;
  estimated_duration_minutes?: number;
}

// Public Figures Types
export interface MobilePublicFigure {
  id: string;
  slug: string;
  full_name: string;
  display_name: string;
  bio?: string;
  description?: string;
  image_url?: string;
  official_photo_url?: string;
  party_affiliation?: string;
  region?: string;
  current_state?: string;
  current_district?: number;
  office?: string;
  congress_member_type?: string; // 'Representative' | 'Senator'
  is_politician?: boolean;
  bioguide_id?: string;
  congressional_tenure_start?: string;
  congressional_tenure_end?: string;
  current_positions?: string[];
  key_positions?: string[];
  notable_controversies?: string[];
  key_policies_supported?: string[];
  quotable_statements?: string[];
  policy_flip_flops?: Array<{
    policy: string;
    before: string;
    after: string;
    context?: string;
  }>;
  scandals_timeline?: Array<{
    date: string;
    event: string;
    description?: string;
    significance?: number;
  }>;
  financial_interests?: string[];
  committee_memberships?: string[];
  bills_sponsored?: string[];
  social_media_handles?: Array<{
    handle: string;
    platform: string;
    followers_estimate?: number;
  }>;
  media_appearances_count?: number;
  book_publications?: string[];
  major_speeches?: string[];
  influence_level?: number;
  civicsense_priority?: number;
  trump_relationship_type?: string;
  birth_year?: number;
  birth_state?: string;
  education_background?: string;
  net_worth_estimate?: number;
  official_website?: string;
  social_media?: any;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  contact_info?: {
    offices?: Array<{
      name?: string;
      address?: string;
      phone?: string;
      fax?: string;
    }>;
    emails?: string[];
    website?: string;
    social?: Record<string, string>;
  };
}

export interface MobileFigureEvent {
  id: string;
  figure_id: string;
  event_date: string;
  event_type: string;
  event_title: string;
  event_description: string;
  significance_level: number;
  policy_areas: string[];
  sources: any[];
  quiz_potential: number;
  media_coverage_scale: string;
  created_at: string;
}

export interface MobileFigureOrganization {
  id: string;
  figure_id: string;
  organization_id?: string;
  role_title: string;
  role_type: string;
  role_description?: string;
  start_date?: string;
  end_date?: string;
  influence_within_org?: number;
  public_visibility?: string;
  is_active?: boolean;
  sources?: any[];
}

export interface MobileFigureRelationship {
  id: string;
  figure_a_id: string;
  figure_b_id: string;
  relationship_type: string;
  relationship_strength: number;
  relationship_direction: string;
  description: string;
  relationship_start_date?: string;
  relationship_end_date?: string;
  is_public: boolean;
  policy_alignments: string[];
  is_active: boolean;
}

export type FigureFilter = 
  | 'all' 
  | 'congress' 
  | 'house' 
  | 'senate' 
  | 'democrats' 
  | 'republicans' 
  | 'independents'
  | 'controversial'
  | 'high_influence';

// Note: This import will be available after running the download script
// import { getCongressionalPhoto } from '../assets/congressional-photos';

// Default avatar placeholder - using app icon as fallback
const DEFAULT_AVATAR = require('../../assets/images/icon.png');

// Temporary function - will be replaced after running download script
function getCongressionalPhoto(bioguideId: string): any {
  // This is a placeholder that will be replaced by the auto-generated mapping
  return DEFAULT_AVATAR;
}

// Helper function to get congressional photo (local asset or fallback)
function getCongressionalPhotoUrl(bioguideId: string | null): any {
  if (!bioguideId) {
    return DEFAULT_AVATAR;
  }
  
  return getCongressionalPhoto(bioguideId);
}

// Updated helper function for image URLs
function getFullImageUrl(relativePath: string | null, figureId?: string): any {
  // For congressional photos, always use local assets
  if (figureId) {
    return getCongressionalPhotoUrl(figureId);
  }
  
  // Fallback for non-congressional figures
  if (!relativePath) {
    return DEFAULT_AVATAR;
  }
  
  // External URL fallback (for non-congressional figures)
  if (relativePath.startsWith('http')) {
    return relativePath;
  }
  return `https://civicsense.one${relativePath}`;
}

// Helper to parse JSON fields
function parseJsonField<T>(field: any): T {
  if (!field) return undefined as unknown as T;
  if (typeof field === 'string') {
    try { return JSON.parse(field); } catch { return undefined as unknown as T; }
  }
  return field;
}

/**
 * Mobile Data Service
 * Centralized service for fetching data with proper error handling and mock fallbacks
 */
class MobileDataService {
  /**
   * Fetch daily question topics for specific dates
   */
  async fetchDailyTopics(dates: string[]): Promise<DailyQuestionTopic[]> {
    try {
      console.log('🔄 Fetching daily topics for dates:', dates);
      
      const { data, error } = await supabase
        .from('question_topics')
        .select(`
          id,
          topic_title,
          description,
          emoji,
          date,
          difficulty_level,
          estimated_duration_minutes,
          categories
        `)
        .in('date', dates)
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (error) {
        console.error('❌ Error fetching daily topics:', error);
        return this.getMockDailyTopics(dates);
      }

      // Transform to mobile format
      const topics: DailyQuestionTopic[] = (data || []).map(topic => ({
        id: topic.id,
        title: topic.topic_title,
        description: topic.description,
        emoji: topic.emoji,
        date: topic.date || '',
        difficulty_level: this.parseDifficultyLevel(topic.difficulty_level),
        estimated_minutes: topic.estimated_duration_minutes || 15,
        question_count: 0, // We'll fetch this separately if needed
        categories: Array.isArray(topic.categories) ? topic.categories : [],
        is_completed: false
      }));

      console.log('✅ Successfully fetched daily topics:', topics.length);
      return topics;
    } catch (error) {
      console.error('❌ Network error fetching daily topics:', error);
      return this.getMockDailyTopics(dates);
    }
  }

  /**
   * Fetch categories for explore screen
   */
  async fetchCategories(): Promise<MobileCategory[]> {
    try {
      console.log('🔄 Fetching categories...');
      
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          description,
          emoji,
          display_order
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching categories:', error);
        return this.getMockCategories();
      }

      // Transform to mobile format
      const categories: MobileCategory[] = (data || []).map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || '',
        emoji: category.emoji,
        topic_count: 0, // We'll calculate this separately if needed
        collection_count: 0, // We'll calculate this separately if needed
        display_order: category.display_order || 0
      }));

      console.log('✅ Successfully fetched categories:', categories.length);
      return categories;
    } catch (error) {
      console.error('❌ Network error fetching categories:', error);
      return this.getMockCategories();
    }
  }

  /**
   * Fetch topics for explore screen
   */
  async fetchTopics(): Promise<MobileTopic[]> {
    try {
      console.log('🔄 Fetching topics...');
      
      const { data, error } = await supabase
        .from('question_topics')
        .select(`
          id,
          topic_title,
          description,
          emoji,
          categories,
          difficulty_level,
          estimated_duration_minutes,
          is_featured
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Error fetching topics:', error);
        return this.getMockTopics();
      }

      // Transform to mobile format
      const topics: MobileTopic[] = (data || []).map(topic => {
        const categories = Array.isArray(topic.categories) ? topic.categories : [];
        const primaryCategory = categories[0] || 'General';
        
        return {
          id: topic.id,
          title: topic.topic_title,
          description: topic.description,
          emoji: topic.emoji,
          category: primaryCategory,
          difficulty_level: this.parseDifficultyLevel(topic.difficulty_level),
          question_count: 0, // We'll fetch this separately if needed
          is_popular: topic.is_featured || false,
          estimated_minutes: topic.estimated_duration_minutes || 15
        };
      });

      console.log('✅ Successfully fetched topics:', topics.length);
      return topics;
    } catch (error) {
      console.error('❌ Network error fetching topics:', error);
      return this.getMockTopics();
    }
  }

  /**
   * Fetch collections for explore screen
   */
  async fetchCollections(): Promise<MobileCollection[]> {
    try {
      console.log('🔄 Fetching collections...');
      
      // Note: Based on the error, collections table might not exist or have different structure
      // For now, return mock data
      console.log('⚠️ Collections table not available, using mock data');
      return this.getMockCollections();
    } catch (error) {
      console.error('❌ Network error fetching collections:', error);
      return this.getMockCollections();
    }
  }

  /**
   * Parse difficulty level from string to number
   */
  private parseDifficultyLevel(level: string | null): number {
    if (!level) return 1;
    
    const levelMap: { [key: string]: number } = {
      'beginner': 1,
      'easy': 1,
      'intermediate': 2,
      'moderate': 2,
      'advanced': 3,
      'hard': 3,
      'expert': 4
    };
    
    return levelMap[level.toLowerCase()] || parseInt(level) || 1;
  }

  /**
   * Mock data for development/fallback
   */
  private getMockDailyTopics(dates: string[]): DailyQuestionTopic[] {
    const mockTopics = [
      {
        id: '1',
        title: 'Congressional Committee Power',
        description: 'How do congressional committees actually control legislation?',
        emoji: '🏛️',
        difficulty_level: 2,
        estimated_minutes: 15,
        question_count: 8,
        categories: ['Government', 'Congress'],
        is_completed: true,
      },
      {
        id: '2',
        title: 'Local Government Budgets',
        description: 'Where does your city spend your tax money?',
        emoji: '🏙️',
        difficulty_level: 1,
        estimated_minutes: 12,
        question_count: 6,
        categories: ['Local Government', 'Budget'],
        is_completed: false,
      },
      {
        id: '3',
        title: 'Voter Registration Systems',
        description: 'Why is voter registration so complicated in some states?',
        emoji: '🗳️',
        difficulty_level: 3,
        estimated_minutes: 18,
        question_count: 10,
        categories: ['Elections', 'Voting Rights'],
        is_completed: false,
      },
    ];

    return mockTopics.map((topic, index) => ({
      ...topic,
      date: dates[index] || dates[0] || new Date().toISOString().split('T')[0]!
    }));
  }

  private getMockCategories(): MobileCategory[] {
    return [
      {
        id: '1',
        name: 'Government',
        description: 'How government structures and processes actually work',
        emoji: '🏛️',
        topic_count: 25,
        collection_count: 8,
        display_order: 1
      },
      {
        id: '2',
        name: 'Elections',
        description: 'Electoral systems, voting rights, and campaign processes',
        emoji: '🗳️',
        topic_count: 18,
        collection_count: 6,
        display_order: 2
      },
      {
        id: '3',
        name: 'Economy',
        description: 'Economic policy, taxation, and financial systems',
        emoji: '💰',
        topic_count: 22,
        collection_count: 7,
        display_order: 3
      },
      {
        id: '4',
        name: 'Civil Rights',
        description: 'Individual rights and civil liberties',
        emoji: '✊',
        topic_count: 15,
        collection_count: 5,
        display_order: 4
      },
      {
        id: '5',
        name: 'Justice',
        description: 'Legal system, courts, and law enforcement',
        emoji: '⚖️',
        topic_count: 20,
        collection_count: 6,
        display_order: 5
      }
    ];
  }

  private getMockTopics(): MobileTopic[] {
    return [
      {
        id: '1',
        title: 'How Congress Really Works',
        description: 'The hidden power structures that control legislation',
        emoji: '🏛️',
        category: 'Government',
        difficulty_level: 2,
        question_count: 12,
        is_popular: true,
        estimated_minutes: 25
      },
      {
        id: '2',
        title: 'Gerrymandering Exposed',
        description: 'How politicians choose their voters',
        emoji: '🗺️',
        category: 'Elections',
        difficulty_level: 3,
        question_count: 8,
        is_popular: true,
        estimated_minutes: 20
      },
      {
        id: '3',
        title: 'Federal Budget Breakdown',
        description: 'Where your tax dollars actually go',
        emoji: '💵',
        category: 'Economy',
        difficulty_level: 2,
        question_count: 10,
        is_popular: false,
        estimated_minutes: 30
      },
      {
        id: '4',
        title: 'Supreme Court Politics',
        description: 'How lifetime appointments shape America',
        emoji: '⚖️',
        category: 'Justice',
        difficulty_level: 3,
        question_count: 15,
        is_popular: true,
        estimated_minutes: 35
      },
      {
        id: '5',
        title: 'Voting Rights History',
        description: 'The ongoing fight for democratic participation',
        emoji: '✊',
        category: 'Civil Rights',
        difficulty_level: 2,
        question_count: 11,
        is_popular: false,
        estimated_minutes: 28
      }
    ];
  }

  private getMockCollections(): MobileCollection[] {
    return [
      {
        id: '1',
        title: 'Congress Decoded',
        description: 'Discover how America\'s $6.8 trillion federal budget really gets decided and who holds the real power in Washington.',
        slug: 'congress-decoded-2024',
        emoji: '🏛️',
        difficulty_level: 2,
        estimated_minutes: 45,
        items_count: 5,
        is_featured: true,
        categories: ['Government', 'Policy'],
        tags: ['budget', 'legislation', 'committees']
      },
      {
        id: '2',
        title: 'Local Power Structures',
        description: 'Your city council controls more of your daily life than you think. Learn how to navigate and influence local politics.',
        slug: 'local-power-structures',
        emoji: '🏙️',
        difficulty_level: 1,
        estimated_minutes: 30,
        items_count: 4,
        is_featured: false,
        categories: ['Government'],
        tags: ['city-council', 'zoning', 'permits']
      },
      {
        id: '3',
        title: 'Election Mechanics Exposed',
        description: 'Beyond voting: How gerrymandering, voter registration, and electoral systems actually determine election outcomes.',
        slug: 'election-mechanics-exposed',
        emoji: '🗳️',
        difficulty_level: 3,
        estimated_minutes: 60,
        items_count: 7,
        is_featured: true,
        categories: ['Elections'],
        tags: ['gerrymandering', 'voter-registration', 'electoral-college']
      }
    ];
  }

  private getMockPublicFigures(filter: FigureFilter = 'all'): MobilePublicFigure[] {
    const allMockFigures: MobilePublicFigure[] = [
      {
        id: '1',
        slug: 'nancy-pelosi',
        full_name: 'Nancy Pelosi',
        display_name: 'Nancy Pelosi',
        bio: 'Former Speaker of the House, representing California\'s 5th congressional district',
        description: 'Veteran Democratic leader with significant influence in progressive politics',
        official_photo_url: getCongressionalPhotoUrl('P000197'),
        party_affiliation: 'Democratic',
        current_state: 'California',
        current_district: 5,
        office: 'Representative',
        congress_member_type: 'Representative',
        is_politician: true,
        bioguide_id: 'P000197',
        congressional_tenure_start: '1987-01-06',
        current_positions: ['House Representative'],
        key_positions: ['Former Speaker of the House'],
        influence_level: 5,
        civicsense_priority: 95,
        notable_controversies: ['Stock trading controversy', 'January 6th response'],
        birth_year: 1940,
        birth_state: 'Maryland',
        education_background: 'Trinity College',
        official_website: 'https://pelosi.house.gov/',
        is_active: true
      },
      {
        id: '2',
        slug: 'chuck-schumer',
        full_name: 'Charles Ellis Schumer',
        display_name: 'Chuck Schumer',
        bio: 'Senate Majority Leader, representing New York',
        description: 'Senior Democratic senator and current Senate Majority Leader',
        official_photo_url: getCongressionalPhotoUrl('S000148'),
        party_affiliation: 'Democratic',
        current_state: 'New York',
        office: 'Senator',
        congress_member_type: 'Senator',
        is_politician: true,
        bioguide_id: 'S000148',
        congressional_tenure_start: '1999-01-06',
        current_positions: ['Senate Majority Leader'],
        key_positions: ['Senate Majority Leader'],
        influence_level: 5,
        civicsense_priority: 94,
        notable_controversies: ['Supreme Court nomination battles'],
        birth_year: 1950,
        birth_state: 'New York',
        education_background: 'Harvard University, JD',
        official_website: 'https://schumer.senate.gov/',
        is_active: true
      },
      {
        id: '3',
        slug: 'mitch-mcconnell',
        full_name: 'Addison Mitchell McConnell Jr.',
        display_name: 'Mitch McConnell',
        bio: 'Senate Minority Leader, representing Kentucky',
        description: 'Long-serving Republican senator and former Senate Majority Leader',
        official_photo_url: getCongressionalPhotoUrl('M000355'),
        party_affiliation: 'Republican',
        current_state: 'Kentucky',
        office: 'Senator',
        congress_member_type: 'Senator',
        is_politician: true,
        bioguide_id: 'M000355',
        congressional_tenure_start: '1985-01-03',
        current_positions: ['Senate Minority Leader'],
        key_positions: ['Former Senate Majority Leader'],
        influence_level: 5,
        civicsense_priority: 93,
        notable_controversies: ['Supreme Court nomination blocking', 'January 6th response'],
        birth_year: 1942,
        birth_state: 'Alabama',
        education_background: 'University of Louisville Law School',
        official_website: 'https://mcconnell.senate.gov/',
        is_active: true
      },
      {
        id: '4',
        slug: 'kevin-mccarthy',
        full_name: 'Kevin Owen McCarthy',
        display_name: 'Kevin McCarthy',
        bio: 'Former Speaker of the House, representing California\'s 20th congressional district',
        description: 'Republican leader who served as Speaker before being ousted in 2023',
        official_photo_url: getCongressionalPhotoUrl('M001165'),
        party_affiliation: 'Republican',
        current_state: 'California',
        current_district: 20,
        office: 'Representative',
        congress_member_type: 'Representative',
        is_politician: true,
        bioguide_id: 'M001165',
        congressional_tenure_start: '2007-01-03',
        current_positions: ['House Representative'],
        key_positions: ['Former Speaker of the House'],
        influence_level: 4,
        civicsense_priority: 85,
        notable_controversies: ['Speaker removal', 'January 6th statements'],
        birth_year: 1965,
        birth_state: 'California',
        education_background: 'California State University, Bakersfield',
        official_website: 'https://mccarthy.house.gov/',
        is_active: true
      },
      {
        id: '5',
        slug: 'alexandria-ocasio-cortez',
        full_name: 'Alexandria Ocasio-Cortez',
        display_name: 'Alexandria Ocasio-Cortez',
        bio: 'Representative from New York\'s 14th congressional district',
        description: 'Progressive Democratic representative known for Green New Deal advocacy',
        official_photo_url: getCongressionalPhotoUrl('O000172'),
        party_affiliation: 'Democratic',
        current_state: 'New York',
        current_district: 14,
        office: 'Representative',
        congress_member_type: 'Representative',
        is_politician: true,
        bioguide_id: 'O000172',
        congressional_tenure_start: '2019-01-03',
        current_positions: ['House Representative'],
        key_positions: ['Progressive Caucus Member'],
        influence_level: 4,
        civicsense_priority: 88,
        notable_controversies: ['Green New Deal criticism', 'Tax the Rich dress'],
        birth_year: 1989,
        birth_state: 'New York',
        education_background: 'Boston University',
        official_website: 'https://ocasio-cortez.house.gov/',
        is_active: true
      },
      {
        id: '6',
        slug: 'ted-cruz',
        full_name: 'Rafael Edward Cruz',
        display_name: 'Ted Cruz',
        bio: 'Senator representing Texas',
        description: 'Conservative Republican senator known for constitutional advocacy',
        official_photo_url: getCongressionalPhotoUrl('C001098'),
        party_affiliation: 'Republican',
        current_state: 'Texas',
        office: 'Senator',
        congress_member_type: 'Senator',
        is_politician: true,
        bioguide_id: 'C001098',
        congressional_tenure_start: '2013-01-03',
        current_positions: ['Senate Judiciary Committee'],
        key_positions: ['Presidential Candidate 2016'],
        influence_level: 4,
        civicsense_priority: 82,
        notable_controversies: ['Cancun trip during Texas freeze', 'Election certification objections'],
        birth_year: 1970,
        birth_state: 'Alberta, Canada',
        education_background: 'Harvard Law School',
        official_website: 'https://cruz.senate.gov/',
        is_active: true
      },
      {
        id: '7',
        slug: 'bernie-sanders',
        full_name: 'Bernard Sanders',
        display_name: 'Bernie Sanders',
        bio: 'Independent Senator from Vermont',
        description: 'Progressive independent senator and former presidential candidate',
        official_photo_url: getCongressionalPhotoUrl('S000033'),
        party_affiliation: 'Independent',
        current_state: 'Vermont',
        office: 'Senator',
        congress_member_type: 'Senator',
        is_politician: true,
        bioguide_id: 'S000033',
        congressional_tenure_start: '2007-01-04',
        current_positions: ['Senate Budget Committee Chair'],
        key_positions: ['Presidential Candidate 2016, 2020'],
        influence_level: 4,
        civicsense_priority: 90,
        notable_controversies: ['Democratic Party tensions', 'Wealth inequality focus'],
        birth_year: 1941,
        birth_state: 'New York',
        education_background: 'University of Chicago',
        official_website: 'https://sanders.senate.gov/',
        is_active: true
      },
      {
        id: '8',
        slug: 'marjorie-taylor-greene',
        full_name: 'Marjorie Taylor Greene',
        display_name: 'Marjorie Taylor Greene',
        bio: 'Representative from Georgia\'s 14th congressional district',
        description: 'Conservative Republican representative known for controversial statements',
        official_photo_url: getCongressionalPhotoUrl('G000596'),
        party_affiliation: 'Republican',
        current_state: 'Georgia',
        current_district: 14,
        office: 'Representative',
        congress_member_type: 'Representative',
        is_politician: true,
        bioguide_id: 'G000596',
        congressional_tenure_start: '2021-01-03',
        current_positions: ['House Representative'],
        key_positions: ['Freedom Caucus Member'],
        influence_level: 3,
        civicsense_priority: 75,
        notable_controversies: ['QAnon associations', 'Committee removals', 'January 6th statements'],
        birth_year: 1974,
        birth_state: 'Georgia',
        education_background: 'University of Georgia',
        official_website: 'https://greene.house.gov/',
        is_active: true
      }
    ];

    // Apply filters
    let filteredFigures = allMockFigures;
    
    switch (filter) {
      case 'congress':
        filteredFigures = allMockFigures.filter(f => f.congress_member_type);
        break;
      case 'house':
        filteredFigures = allMockFigures.filter(f => f.congress_member_type === 'Representative');
        break;
      case 'senate':
        filteredFigures = allMockFigures.filter(f => f.congress_member_type === 'Senator');
        break;
      case 'democrats':
        filteredFigures = allMockFigures.filter(f => f.party_affiliation === 'Democratic');
        break;
      case 'republicans':
        filteredFigures = allMockFigures.filter(f => f.party_affiliation === 'Republican');
        break;
      case 'independents':
        filteredFigures = allMockFigures.filter(f => f.party_affiliation === 'Independent');
        break;
      case 'controversial':
        filteredFigures = allMockFigures.filter(f => f.notable_controversies && f.notable_controversies.length > 0);
        break;
      case 'high_influence':
        filteredFigures = allMockFigures.filter(f => f.influence_level && f.influence_level >= 4);
        break;
      case 'all':
      default:
        filteredFigures = allMockFigures;
        break;
    }

    console.log(`📊 Mock data: ${filteredFigures.length} figures for filter: ${filter}`);
    return filteredFigures;
  }

  static async getUserProgressSessions(userId?: string): Promise<ProgressSession[]> {
    try {
      if (!userId) {
        console.log('No user ID provided, returning mock progress sessions');
        return this.getMockProgressSessions();
      }

      // Get user's incomplete progress sessions
      const { data, error } = await supabase
        .from('progress_sessions')
        .select(`
          id,
          session_id,
          session_type,
          topic_id,
          assessment_type,
          current_question_index,
          questions,
          answers,
          started_at,
          last_updated_at,
          metadata
        `)
        .eq('user_id', userId)
        .or('metadata->completed.is.null,metadata->completed.eq.false')
        .order('last_updated_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching progress sessions:', error);
        return this.getMockProgressSessions();
      }

      if (!data || data.length === 0) {
        return this.getMockProgressSessions();
      }

      // Enrich with topic information where available
      const enrichedSessions = await Promise.all(
        data.map(async (session: any) => {
          let topicDetails = {};
          
          if (session.topic_id) {
            try {
              const { data: topic } = await supabase
                .from('question_topics')
                .select('topic_title, difficulty_level, estimated_duration_minutes')
                .eq('topic_id', session.topic_id)
                .single();
              
              if (topic) {
                topicDetails = {
                  topic_title: topic.topic_title,
                  difficulty_level: topic.difficulty_level,
                  estimated_duration_minutes: topic.estimated_duration_minutes,
                };
              }
            } catch (error) {
              console.warn('Could not fetch topic details for session:', session.session_id);
            }
          }

          return {
            ...session,
            ...topicDetails,
            metadata: {
              totalQuestions: Array.isArray(session.questions) ? session.questions.length : 0,
              questionsAnswered: session.answers ? Object.keys(session.answers).length : 0,
              completed: session.metadata?.completed || false,
              score: session.metadata?.score || 0,
              ...session.metadata,
            },
          } as ProgressSession;
        })
      );

      return enrichedSessions;

    } catch (error) {
      console.error('Error in getUserProgressSessions:', error);
      return this.getMockProgressSessions();
    }
  }

  private static getMockProgressSessions(): ProgressSession[] {
    return [
      {
        id: '1',
        session_id: 'mock-session-1',
        session_type: 'quiz',
        topic_id: 'constitutional-law',
        topic_title: 'Constitutional Law Basics',
        difficulty_level: 'intermediate',
        estimated_duration_minutes: 15,
        current_question_index: 3,
        questions: Array(10).fill({}),
        answers: { '0': 'A', '1': 'B', '2': 'C' },
        started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        last_updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        metadata: {
          totalQuestions: 10,
          questionsAnswered: 3,
          completed: false,
          score: 2,
        },
      },
      {
        id: '2',
        session_id: 'mock-session-2',
        session_type: 'assessment',
        assessment_type: 'civics_test',
        topic_title: 'Civics Practice Test',
        difficulty_level: 'advanced',
        estimated_duration_minutes: 45,
        current_question_index: 12,
        questions: Array(25).fill({}),
        answers: Object.fromEntries(Array(12).fill(0).map((_, i) => [i.toString(), 'A'])),
        started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        last_updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        metadata: {
          totalQuestions: 25,
          questionsAnswered: 12,
          completed: false,
          score: 8,
        },
      },
      {
        id: '3',
        session_id: 'mock-session-3',
        session_type: 'quiz',
        topic_id: 'voting-rights',
        topic_title: 'Voting Rights & Elections',
        difficulty_level: 'beginner',
        estimated_duration_minutes: 10,
        current_question_index: 1,
        questions: Array(5).fill({}),
        answers: { '0': 'B' },
        started_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        last_updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        metadata: {
          totalQuestions: 5,
          questionsAnswered: 1,
          completed: false,
          score: 1,
        },
      },
    ];
  }

  /**
   * Fetch public figures with filtering options
   * Now selects all columns to ensure all fields (including AI-enriched/contact_info) are available.
   */
  async fetchPublicFigures(
    filter: FigureFilter = 'all',
    limit: number = 50,
    searchQuery?: string
  ): Promise<MobilePublicFigure[]> {
    try {
      // Select all columns to ensure all fields are available
      let query = supabase
        .from('public_figures')
        .select('*')
        .eq('is_active', true)
        .order('civicsense_priority', { ascending: false })
        .order('influence_level', { ascending: false })
        .limit(limit);

      // Apply filters
      switch (filter) {
        case 'congress':
          query = query.not('congress_member_type', 'is', null);
          break;
        case 'house':
          query = query.eq('congress_member_type', 'Representative');
          break;
        case 'senate':
          query = query.eq('congress_member_type', 'Senator');
          break;
        case 'democrats':
          query = query.eq('party_affiliation', 'Democratic');
          break;
        case 'republicans':
          query = query.eq('party_affiliation', 'Republican');
          break;
        case 'independents':
          query = query.in('party_affiliation', ['Independent', 'Libertarian', 'Green']);
          break;
        case 'controversial':
          query = query.not('notable_controversies', 'is', null);
          break;
        case 'high_influence':
          query = query.gte('influence_level', 4);
          break;
      }

      // Apply search if provided
      if (searchQuery && searchQuery.trim().length > 0) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(`
          full_name.ilike.${searchTerm},
          display_name.ilike.${searchTerm},
          description.ilike.${searchTerm},
          current_state.ilike.${searchTerm},
          party_affiliation.ilike.${searchTerm}
        `);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching public figures:', error);
        return this.getMockPublicFigures(filter);
      }

      if (!data || data.length === 0) {
        console.log('⚠️ No public figures found in database, using mock data');
        return this.getMockPublicFigures(filter);
      }

      console.log(`👤 Fetched ${data?.length || 0} public figures with filter: ${filter}`);
      return (data || []).map(figure => ({
        ...figure,
        // Use local assets for images
        official_photo_url: getFullImageUrl(figure.official_photo_url, figure.bioguide_id),
      }));
    } catch (error) {
      console.error('Error in fetchPublicFigures:', error);
      return this.getMockPublicFigures(filter);
    }
  }

  /**
   * Fetch figure events
   */
  async fetchFigureEvents(figureId: string, limit: number = 10): Promise<MobileFigureEvent[]> {
    try {
      const { data, error } = await supabase
        .from('figure_events')
        .select('*')
        .eq('figure_id', figureId)
        .order('event_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching figure events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchFigureEvents:', error);
      return [];
    }
  }

  /**
   * Fetch figure organizations
   */
  async fetchFigureOrganizations(figureId: string): Promise<MobileFigureOrganization[]> {
    try {
      const { data, error } = await supabase
        .from('figure_organizations')
        .select('*')
        .eq('figure_id', figureId)
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching figure organizations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchFigureOrganizations:', error);
      return [];
    }
  }

  /**
   * Fetch figure relationships
   */
  async fetchFigureRelationships(figureId: string): Promise<MobileFigureRelationship[]> {
    try {
      const { data, error } = await supabase
        .from('figure_relationships')
        .select('*')
        .or(`figure_a_id.eq.${figureId},figure_b_id.eq.${figureId}`)
        .eq('is_active', true)
        .order('relationship_strength', { ascending: false });

      if (error) {
        console.error('Error fetching figure relationships:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchFigureRelationships:', error);
      return [];
    }
  }

  /**
   * Get figure by slug
   * Now selects all columns to ensure all fields (including AI-enriched/contact_info) are available.
   */
  async getFigureBySlug(slug: string): Promise<MobilePublicFigure | null> {
    try {
      const { data, error } = await supabase
        .from('public_figures')
        .select('*') // Select all columns
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching figure by slug:', error);
      return null;
    }
  }

  /**
   * Get Congress members stats for dashboard
   */
  async getCongressStats(): Promise<{
    totalHouse: number;
    totalSenate: number;
    democrats: number;
    republicans: number;
    independents: number;
  }> {
    try {
      const [houseResult, senateResult, democratsResult, republicansResult, independentsResult] = await Promise.all([
        supabase
          .from('public_figures')
          .select('id', { count: 'exact', head: true })
          .eq('congress_member_type', 'Representative')
          .eq('is_active', true),
        supabase
          .from('public_figures')
          .select('id', { count: 'exact', head: true })
          .eq('congress_member_type', 'Senator')
          .eq('is_active', true),
        supabase
          .from('public_figures')
          .select('id', { count: 'exact', head: true })
          .eq('party_affiliation', 'Democratic')
          .not('congress_member_type', 'is', null)
          .eq('is_active', true),
        supabase
          .from('public_figures')
          .select('id', { count: 'exact', head: true })
          .eq('party_affiliation', 'Republican')
          .not('congress_member_type', 'is', null)
          .eq('is_active', true),
        supabase
          .from('public_figures')
          .select('id', { count: 'exact', head: true })
          .in('party_affiliation', ['Independent', 'Libertarian', 'Green'])
          .not('congress_member_type', 'is', null)
          .eq('is_active', true)
      ]);

      return {
        totalHouse: houseResult.count || 0,
        totalSenate: senateResult.count || 0,
        democrats: democratsResult.count || 0,
        republicans: republicansResult.count || 0,
        independents: independentsResult.count || 0,
      };
    } catch (error) {
      console.error('Error fetching Congress stats:', error);
      return {
        totalHouse: 0,
        totalSenate: 0,
        democrats: 0,
        republicans: 0,
        independents: 0,
      };
    }
  }
}

// Export singleton instance
export const mobileDataService = new MobileDataService();

// Export utility functions
export const formatEstimatedTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

export const getDifficultyLabel = (level: number): string => {
  switch (level) {
    case 1: return 'Beginner';
    case 2: return 'Intermediate';
    case 3: return 'Advanced';
    case 4: return 'Expert';
    default: return 'Unknown';
  }
};

export const getDifficultyColor = (level: number): string => {
  switch (level) {
    case 1: return '#10B981'; // Green
    case 2: return '#3B82F6'; // Blue
    case 3: return '#F59E0B'; // Orange
    case 4: return '#EF4444'; // Red
    default: return '#6B7280'; // Gray
  }
}; 