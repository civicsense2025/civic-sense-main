/**
 * Content Service for CivicSense Mobile App
 * 
 * Comprehensive integration with all content-rich database tables:
 * - Categories & Question Topics (game decks)
 * - Questions & Assessment Questions
 * - Public Figures & Organizations
 * - Skills & Learning Objectives
 * - Events & News
 * - Glossary Terms & Source Links
 * - User Progress & Analytics
 */

import { supabase } from './supabase';
import { DB_TABLES, DB_COLUMNS, DB_FUNCTIONS } from './database-constants';
import { getCategoryIdByNameOrAlias, validateCategoryId } from './database';
import type { 
  DbCategories,
  DbQuestionTopics,
  DbQuestions,
  DbAssessmentQuestions,
  DbPublicFigures,
  DbOrganizations,
  DbSkills,
  DbEvents,
  DbGlossaryTerms,
  DbLearningObjectives,
  DbSourceMetadata,
  DbNewsCache,
  DbQuestionSourceLinks,
  DbFigurePolicyPositions,
  DbKeyPolicyPositions,
  DbMediaOrganizations
} from './database-constants';

// =============================================================================
// 🏛️ CIVIC CONTENT TYPES
// =============================================================================

export interface CivicCategory extends DbCategories {
  topicCount: number;
  questionCount: number;
  figureCount: number;
  completionRate: number;
}

export interface EnrichedQuestionTopic extends DbQuestionTopics {
  questionCount: number;
  relatedFigures: DbPublicFigures[];
  relatedOrganizations: DbOrganizations[];
  sourceLinks: DbQuestionSourceLinks[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface CivicQuestion extends DbQuestions {
  relatedFigures: DbPublicFigures[];
  sourceLinks: DbQuestionSourceLinks[];
  glossaryTerms: DbGlossaryTerms[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface PublicFigureProfile extends DbPublicFigures {
  policyPositions: DbFigurePolicyPositions[];
  relatedOrganizations: DbOrganizations[];
  recentEvents: DbEvents[];
  quizTopics: string[];
}

export interface CivicEvent extends DbEvents {
  relatedFigures: DbPublicFigures[];
  relatedOrganizations: DbOrganizations[];
  sourceLinks: DbSourceMetadata[];
}

export interface NewsArticle extends DbNewsCache {
  relatedFigures: DbPublicFigures[];
  relatedTopics: DbQuestionTopics[];
  credibilityScore: number;
}

// =============================================================================
// 📚 CORE CONTENT FUNCTIONS
// =============================================================================

/**
 * Middleware to ensure category ID is valid
 * If a name is provided, attempts to look it up
 */
export const resolveCategoryId = async (categoryIdOrName?: string): Promise<string | null> => {
  if (!categoryIdOrName) return null;

  // If it's already a valid ID (UUID or legacy cat-N) return as-is
  if (validateCategoryId(categoryIdOrName)) {
    return categoryIdOrName;
  }

  // Try to look up by name/alias
  const categoryId = await getCategoryIdByNameOrAlias(categoryIdOrName);
  if (!categoryId) {
    console.warn(`Could not resolve category ID for: ${categoryIdOrName}`);
  }
  return categoryId;
};

/**
 * Get enriched categories with comprehensive stats
 */
export const getEnrichedCategories = async (userId?: string, categoryFilter?: string): Promise<CivicCategory[]> => {
  try {
    // First get basic categories
    let query = supabase
      .from(DB_TABLES.CATEGORIES)
      .select('*')
      .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, true)
      .order(DB_COLUMNS.CATEGORIES.DISPLAY_ORDER);

    // Apply category filter if provided
    if (categoryFilter) {
      const categoryId = await resolveCategoryId(categoryFilter);
      if (categoryId) {
        query = query.eq(DB_COLUMNS.CATEGORIES.ID, categoryId);
      }
    }

    const { data: categories, error } = await query;
    if (error) throw error;

    // Enrich with additional data using separate queries
    const enrichedCategories = await Promise.all(
      (categories || []).map(async (category) => {
        // Get topic count for this category using JSONB contains
        const { data: topicCount } = await supabase
          .from(DB_TABLES.QUESTION_TOPICS)
          .select('id', { count: 'exact' })
          .contains(DB_COLUMNS.QUESTION_TOPICS.CATEGORIES, JSON.stringify([category.id]))
          .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true);

        // Get question count for this category
        const { data: questionCount } = await supabase
          .from(DB_TABLES.QUESTIONS)
          .select('id', { count: 'exact' })
          .eq('category', category.id) // Assuming questions has category field
          .eq('is_active', true);

        // Get figure count for this category (assuming JSONB array)
        const { data: figureCount } = await supabase
          .from(DB_TABLES.PUBLIC_FIGURES)
          .select('id', { count: 'exact' })
          .contains('categories', JSON.stringify([category.id]))
          .eq('is_active', true);

        // Get user completion rate if userId provided
        let completionRate = 0;
        if (userId) {
          const { data: progress } = await supabase
            .from(DB_TABLES.USER_PROGRESS)
            .select('*')
            .eq('user_id', userId)
            .eq('category_id', category.id);
          
          completionRate = progress?.[0]?.completion_percentage || 0;
        }

        return {
          ...category,
          topicCount: topicCount?.length || 0,
          questionCount: questionCount?.length || 0,
          figureCount: figureCount?.length || 0,
          completionRate,
        };
      })
    );

    console.log(`📚 Found ${enrichedCategories.length} enriched categories`);
    return enrichedCategories;
  } catch (error) {
    console.error('Error fetching enriched categories:', error);
    return [];
  }
};

/**
 * Get enriched question topics with related content
 * TODO: After schema migration, replace current implementation with this optimized version
 */
/**
 * Get enriched question topics with related content
 * Automatically detects and uses optimized schema when available
 */
export const getEnrichedQuestionTopics = async (categoryId?: string): Promise<EnrichedQuestionTopic[]> => {
  try {
    // Check if new schema is available
    const useOptimized = await hasNewSchema();
    
    if (useOptimized) {
      console.log('🚀 Using optimized schema with foreign keys');
      return await getEnrichedQuestionTopicsOptimized(categoryId);
    } else {
      console.log('⚠️ Using legacy schema with JSONB categories');
      return await getEnrichedQuestionTopicsLegacy(categoryId);
    }
  } catch (error) {
    console.error('Error in getEnrichedQuestionTopics:', error);
    // Fallback to legacy if optimized fails
    try {
      return await getEnrichedQuestionTopicsLegacy(categoryId);
    } catch (fallbackError) {
      console.error('Legacy fallback also failed:', fallbackError);
      throw fallbackError;
    }
  }
};

/**
 * FUTURE: Optimized version with proper foreign key relationships
 * This version assumes the new schema with category_id foreign key
 */
export const getEnrichedQuestionTopicsNew = async (categoryId?: string): Promise<EnrichedQuestionTopic[]> => {
  try {
    let query = supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select(`
        *,
        category:${DB_TABLES.CATEGORIES}(*)
      `)
      .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
      .order(DB_COLUMNS.QUESTION_TOPICS.TOPIC_TITLE);

    // With the new schema, we can use proper foreign key joins
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: topics, error } = await query;
    if (error) throw error;

    // Much simpler enrichment with proper joins
    const enrichedTopics = await Promise.all(
      (topics || []).map(async (topic) => {
        // Get question count for this topic using separate query
        let questionCount = 0;
        try {
          const { count } = await supabase
            .from(DB_TABLES.QUESTIONS)
            .select('id', { count: 'exact', head: true })
            .eq('topic_id', topic.id)
            .eq('is_active', true);
          questionCount = count || 0;
        } catch (countError) {
          // Fallback to questions_test table if main table fails
          try {
            const { count } = await supabase
              .from('questions_test')
              .select('id', { count: 'exact', head: true })
              .eq('topic_id', topic.id)
              .eq('is_active', true);
            questionCount = count || 0;
          } catch (fallbackError) {
            console.warn(`Failed to get question count for topic ${topic.id}:`, fallbackError);
            questionCount = 0;
          }
        }

        // Get related figures using existing junction table
        const { data: figures } = await supabase
          .from(DB_TABLES.FIGURE_QUIZ_TOPICS)
          .select(`
            public_figures:${DB_TABLES.PUBLIC_FIGURES}(*)
          `)
          .eq('topic_id', topic.id);

        // Get related organizations
        const { data: orgs } = await supabase
          .from(DB_TABLES.ORGANIZATIONS)
          .select('*')
          .contains('related_topics', JSON.stringify([topic.id]));

        const difficulty = (topic.difficulty_level || 1) <= 3 ? 'beginner' : 
                          (topic.difficulty_level || 1) <= 6 ? 'intermediate' : 'advanced';

        return {
          ...topic,
          questionCount,
          relatedFigures: figures?.map(f => f.public_figures).filter(Boolean) || [],
          relatedOrganizations: orgs || [],
          sourceLinks: [],
          difficulty,
        };
      })
    );

    console.log(`📚 Found ${enrichedTopics.length} enriched question topics (new schema)`);
    return enrichedTopics;
  } catch (error) {
    console.error('Error fetching enriched question topics (new schema):', error);
    return [];
  }
};

/**
 * Alternative version using junction table for many-to-many
 */
export const getEnrichedQuestionTopicsWithJunction = async (categoryId?: string): Promise<EnrichedQuestionTopic[]> => {
  try {
    let query = supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select(`
        *,
        category_topics!inner(
          category:${DB_TABLES.CATEGORIES}(*)
        )
      `)
      .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
      .order(DB_COLUMNS.QUESTION_TOPICS.TOPIC_TITLE);

    if (categoryId) {
      query = query.eq('category_topics.category_id', categoryId);
    }

    const { data: topics, error } = await query;
    if (error) throw error;

    const enrichedTopics = await Promise.all(
      (topics || []).map(async (topic) => {
        // Get question count for this topic using separate query
        let questionCount = 0;
        try {
          const { count } = await supabase
            .from(DB_TABLES.QUESTIONS)
            .select('id', { count: 'exact', head: true })
            .eq('topic_id', topic.id)
            .eq('is_active', true);
          questionCount = count || 0;
        } catch (countError) {
          // Fallback to questions_test table if main table fails
          try {
            const { count } = await supabase
              .from('questions_test')
              .select('id', { count: 'exact', head: true })
              .eq('topic_id', topic.id)
              .eq('is_active', true);
            questionCount = count || 0;
          } catch (fallbackError) {
            console.warn(`Failed to get question count for topic ${topic.id}:`, fallbackError);
            questionCount = 0;
          }
        }

        const difficulty = (topic.difficulty_level || 1) <= 3 ? 'beginner' : 
                          (topic.difficulty_level || 1) <= 6 ? 'intermediate' : 'advanced';

        return {
          ...topic,
          questionCount,
          relatedFigures: [], // Would need separate query
          relatedOrganizations: [], // Would need separate query
          sourceLinks: [],
          difficulty,
        };
      })
    );

    console.log(`📚 Found ${enrichedTopics.length} enriched question topics (junction table)`);
    return enrichedTopics;
  } catch (error) {
    console.error('Error fetching enriched question topics (junction table):', error);
    return [];
  }
};

/**
 * Get civic questions with comprehensive context
 */
export const getCivicQuestions = async (
  topicId: string,
  limit: number = 20,
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
): Promise<CivicQuestion[]> => {
  try {
    let query = supabase
      .from(DB_TABLES.QUESTIONS)
      .select(`
        *,
        source_links:${DB_TABLES.QUESTION_SOURCE_LINKS}(*),
        skills:${DB_TABLES.QUESTION_SKILLS}(
          skill:${DB_TABLES.SKILLS}(*)
        )
      `)
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .limit(limit);

    // Filter by difficulty if specified
    if (difficulty) {
      const difficultyRange = {
        beginner: [1, 3],
        intermediate: [4, 6],
        advanced: [7, 10]
      };
      const [min, max] = difficultyRange[difficulty];
      query = query.gte('difficulty_level', min).lte('difficulty_level', max);
    }

    const { data: questions, error } = await query;
    if (error) throw error;

    // Enrich with related figures and glossary terms
    const enrichedQuestions = await Promise.all(
      (questions || []).map(async (question) => {
        // Get related figures (if question mentions them)
        const { data: figures } = await supabase
          .from(DB_TABLES.PUBLIC_FIGURES)
          .select('*')
          .or(`name.ilike.%${question.question}%,description.ilike.%${question.question}%`);

        // Get relevant glossary terms
        const { data: glossaryTerms } = await supabase
          .from(DB_TABLES.GLOSSARY_TERMS)
          .select('*')
          .or(`term.ilike.%${question.question}%,definition.ilike.%${question.question}%`);

        const difficulty = question.difficulty_level <= 3 ? 'beginner' : 
                          question.difficulty_level <= 6 ? 'intermediate' : 'advanced';

        return {
          ...question,
          relatedFigures: figures?.slice(0, 3) || [],
          sourceLinks: question.source_links || [],
          glossaryTerms: glossaryTerms?.slice(0, 5) || [],
          difficulty,
        };
      })
    );

    return enrichedQuestions;
  } catch (error) {
    console.error('Error fetching civic questions:', error);
    return [];
  }
};

/**
 * Get public figure profiles with comprehensive data
 */
export const getPublicFigureProfiles = async (
  categoryId?: string,
  limit: number = 20
): Promise<PublicFigureProfile[]> => {
  try {
    let query = supabase
      .from(DB_TABLES.PUBLIC_FIGURES)
      .select('*')
      .eq('is_active', true)
      .order('name')
      .limit(limit);

    if (categoryId) {
      query = query.contains('categories', JSON.stringify([categoryId]));
    }

    const { data: figures, error } = await query;
    if (error) throw error;

    // Enrich with related data using separate queries
    const enrichedFigures = await Promise.all(
      (figures || []).map(async (figure) => {
        // Get policy positions
        const { data: policyPositions } = await supabase
          .from(DB_TABLES.FIGURE_POLICY_POSITIONS)
          .select('*')
          .eq('figure_id', figure.id);

        // Get related organizations
        const { data: figureOrgs } = await supabase
          .from(DB_TABLES.FIGURE_ORGANIZATIONS)
          .select(`
            organization:${DB_TABLES.ORGANIZATIONS}(*)
          `)
          .eq('figure_id', figure.id);

        // Get recent events
        const { data: figureEvents } = await supabase
          .from(DB_TABLES.FIGURE_EVENTS)
          .select(`
            event:${DB_TABLES.EVENTS}(*)
          `)
          .eq('figure_id', figure.id)
          .limit(5);

        // Get quiz topics
        const { data: quizTopicRels } = await supabase
          .from(DB_TABLES.FIGURE_QUIZ_TOPICS)
          .select(`
            topic:${DB_TABLES.QUESTION_TOPICS}(${DB_COLUMNS.QUESTION_TOPICS.TOPIC_TITLE})
          `)
          .eq('figure_id', figure.id);

        return {
          ...figure,
          policyPositions: policyPositions || [],
          relatedOrganizations: figureOrgs?.map((o: any) => o.organization).filter(Boolean) || [],
          recentEvents: figureEvents?.map((e: any) => e.event).filter(Boolean) || [],
          quizTopics: quizTopicRels?.map((t: any) => t.topic?.[DB_COLUMNS.QUESTION_TOPICS.TOPIC_TITLE]).filter(Boolean) || [],
        };
      })
    );

    console.log(`👤 Found ${enrichedFigures.length} public figure profiles`);
    return enrichedFigures;
  } catch (error) {
    console.error('Error fetching public figure profiles:', error);
    return [];
  }
};

/**
 * Get current civic events with context
 */
export const getCurrentCivicEvents = async (
  categoryId?: string,
  limit: number = 20
): Promise<CivicEvent[]> => {
  try {
    let query = supabase
      .from(DB_TABLES.EVENTS)
      .select(`
        *,
        figure_events:${DB_TABLES.FIGURE_EVENTS}(
          figure:${DB_TABLES.PUBLIC_FIGURES}(*)
        ),
        source_metadata:${DB_TABLES.SOURCE_METADATA}(*)
      `)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date')
      .limit(limit);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: events, error } = await query;
    if (error) throw error;

    return (events || []).map(event => ({
      ...event,
      relatedFigures: event.figure_events?.map((fe: any) => fe.figure).filter(Boolean) || [],
      relatedOrganizations: [], // TODO: Add organization relationships
      sourceLinks: event.source_metadata || [],
    }));
  } catch (error) {
    console.error('Error fetching current civic events:', error);
    return [];
  }
};

/**
 * Get curated news articles with civic context
 */
export const getCivicNews = async (
  categoryId?: string,
  limit: number = 10
): Promise<NewsArticle[]> => {
  try {
    let query = supabase
      .from(DB_TABLES.NEWS_CACHE)
      .select('*')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    // NOTE: Temporarily removed category_id filter due to potential schema mismatch
    // TODO: Verify if news_cache table has category_id column
    // if (categoryId) {
    //   query = query.eq('category_id', categoryId);
    // }

    const { data: news, error } = await query;
    if (error) {
      console.error('Error fetching civic news:', error);
      console.error('Database error details:', {
        message: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code
      });
      throw error;
    }

    // Enrich with related content
    const enrichedNews = await Promise.all(
      (news || []).map(async (article) => {
        // Find related figures mentioned in the article
        const { data: figures } = await supabase
          .from(DB_TABLES.PUBLIC_FIGURES)
          .select('*')
          .or(`name.ilike.%${article.title}%,name.ilike.%${article.summary}%`);

        // Find related topics
        const { data: topics } = await supabase
          .from(DB_TABLES.QUESTION_TOPICS)
          .select('*, title:topic_title')
          .or(`topic_title.ilike.%${article.title}%,description.ilike.%${article.summary}%`);

        return {
          ...article,
          relatedFigures: figures?.slice(0, 3) || [],
          relatedTopics: topics?.slice(0, 3) || [],
          credibilityScore: article.credibility_score || 0,
        };
      })
    );

    console.log(`📰 Found ${enrichedNews.length} civic news articles${categoryId ? ` (category filter ignored due to potential schema mismatch)` : ''}`);
    return enrichedNews;
  } catch (error) {
    console.error('Error fetching civic news:', error);
    return [];
  }
};

/**
 * Get civic skills and learning objectives
 */
export const getCivicSkills = async (categoryId?: string): Promise<DbSkills[]> => {
  try {
    // Get skills first
    let query = supabase
      .from(DB_TABLES.SKILLS)
      .select('*')
      .eq(DB_COLUMNS.SKILLS.IS_ACTIVE, true)
      .order(DB_COLUMNS.SKILLS.SKILL_NAME);

    // Note: Skills table likely doesn't have direct category relationship
    // Categories are probably linked through other tables
    // TODO: Implement proper category filtering when relationship is clarified

    const { data: skills, error } = await query;
    if (error) {
      console.error('Error fetching civic skills:', error);
      console.error('Database error details:', {
        message: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code
      });
      throw error;
    }

    // Get learning objectives separately
    const learningObjectives = await Promise.all(
      (skills || []).map(async (skill) => {
        // First get the skill_learning_objectives
        const { data: skillObjectives } = await supabase
          .from(DB_TABLES.SKILL_LEARNING_OBJECTIVES)
          .select('id')
          .eq('skill_id', skill.id);

        if (!skillObjectives?.length) return { skillId: skill.id, objectives: [] };

        // Then get the actual learning objectives
        const objectiveIds = skillObjectives.map(so => so.id);
        const { data: objectives } = await supabase
          .from(DB_TABLES.LEARNING_OBJECTIVES)
          .select('*')
          .in('id', objectiveIds);

        return { skillId: skill.id, objectives: objectives || [] };
      })
    );

    // Get prerequisites separately
    const prerequisites = await Promise.all(
      (skills || []).map(async (skill) => {
        const { data: prereqs } = await supabase
          .from(DB_TABLES.SKILL_PREREQUISITES)
          .select('prerequisite_skill_id')
          .eq('skill_id', skill.id);

        if (!prereqs?.length) return { skillId: skill.id, prerequisites: [] };

        const prereqIds = prereqs.map(p => p.prerequisite_skill_id);
        const { data: prereqSkills } = await supabase
          .from(DB_TABLES.SKILLS)
          .select('*')
          .in('id', prereqIds);

        return { skillId: skill.id, prerequisites: prereqSkills || [] };
      })
    );

    // Combine all the data
    const enrichedSkills = (skills || []).map(skill => {
      const skillObjectives = learningObjectives.find(lo => lo.skillId === skill.id)?.objectives || [];
      const skillPrereqs = prerequisites.find(p => p.skillId === skill.id)?.prerequisites || [];
      
      return {
        ...skill,
        // Keep the original structure but add the enriched data
        learning_objectives: skillObjectives,
        prerequisites: skillPrereqs,
      };
    });

    console.log(`🎯 Found ${enrichedSkills.length} civic skills`);
    return enrichedSkills;
  } catch (error) {
    console.error('Error fetching civic skills:', error);
    return [];
  }
};

/**
 * Get related categories and question topics for a specific skill
 */
export const getSkillRelatedContent = async (skillId: string): Promise<{
  categories: DbCategories[];
  questionTopics: DbQuestionTopics[];
}> => {
  try {
    // Get questions associated with this skill through the question_skills junction table
    const { data: questionSkills, error: questionSkillsError } = await supabase
      .from(DB_TABLES.QUESTION_SKILLS)
      .select('question_id')
      .eq('skill_id', skillId);

    if (questionSkillsError) {
      console.error('Error fetching question skills:', questionSkillsError);
      return { categories: [], questionTopics: [] };
    }

    if (!questionSkills || questionSkills.length === 0) {
      return { categories: [], questionTopics: [] };
    }

    const questionIds = questionSkills.map(qs => qs.question_id);

    // Get questions with their topic information
    const { data: questions, error: questionsError } = await supabase
      .from(DB_TABLES.QUESTIONS)
      .select('topic_id')
      .in('id', questionIds)
      .eq('is_active', true);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return { categories: [], questionTopics: [] };
    }

    // Get unique topic IDs
    const topicIds = [...new Set(questions?.map(q => q.topic_id).filter(Boolean) || [])];

    if (topicIds.length === 0) {
      return { categories: [], questionTopics: [] };
    }

    // Get question topics
    const { data: questionTopics, error: topicsError } = await supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select('*')
      .in('id', topicIds)
      .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true);

    if (topicsError) {
      console.error('Error fetching question topics:', topicsError);
      return { categories: [], questionTopics: [] };
    }

    // Extract unique category IDs from question topics
    // Since categories is a JSONB array, we need to parse it
    const categoryIds = new Set<string>();
    questionTopics?.forEach(topic => {
      if (topic.categories && Array.isArray(topic.categories)) {
        topic.categories.forEach((categoryId: any) => {
          if (typeof categoryId === 'string') {
            categoryIds.add(categoryId);
          }
        });
      }
    });

    // Get categories
    let categories: DbCategories[] = [];
    if (categoryIds.size > 0) {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from(DB_TABLES.CATEGORIES)
        .select('*')
        .in('id', Array.from(categoryIds))
        .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, true);

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      } else {
        categories = categoriesData || [];
      }
    }

    console.log(`🔗 Found ${categories.length} categories and ${questionTopics?.length || 0} topics for skill ${skillId}`);
    
    return {
      categories,
      questionTopics: questionTopics || []
    };

  } catch (error) {
    console.error('Error fetching skill related content:', error);
    return { categories: [], questionTopics: [] };
  }
};

/**
 * Get glossary terms for civic education
 */
export const getGlossaryTerms = async (searchTerm?: string): Promise<DbGlossaryTerms[]> => {
  try {
    let query = supabase
      .from(DB_TABLES.GLOSSARY_TERMS)
      .select('*')
      .eq('is_active', true)
      .order('term');

    if (searchTerm) {
      query = query.or(`term.ilike.%${searchTerm}%,definition.ilike.%${searchTerm}%`);
    }

    const { data: terms, error } = await query;
    if (error) throw error;

    return terms || [];
  } catch (error) {
    console.error('Error fetching glossary terms:', error);
    return [];
  }
};

/**
 * Search across all civic content
 */
export const searchCivicContent = async (
  searchTerm: string,
  contentTypes: string[] = ['categories', 'topics', 'figures', 'events', 'news']
) => {
  try {
    const results: any = {};

    // Search categories
    if (contentTypes.includes('categories')) {
      const { data: categories } = await supabase
        .from(DB_TABLES.CATEGORIES)
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .limit(5);
      results.categories = categories || [];
    }

    // Search topics
    if (contentTypes.includes('topics')) {
      const { data: topics } = await supabase
        .from(DB_TABLES.QUESTION_TOPICS)
        .select('*')
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .limit(10);
      results.topics = topics || [];
    }

    // Search public figures
    if (contentTypes.includes('figures')) {
      const { data: figures } = await supabase
        .from(DB_TABLES.PUBLIC_FIGURES)
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .limit(10);
      results.figures = figures || [];
    }

    // Search events
    if (contentTypes.includes('events')) {
      const { data: events } = await supabase
        .from(DB_TABLES.EVENTS)
        .select('*')
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(10);
      results.events = events || [];
    }

    // Search news
    if (contentTypes.includes('news')) {
      const { data: news } = await supabase
        .from(DB_TABLES.NEWS_CACHE)
        .select('*')
        .or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .limit(10);
      results.news = news || [];
    }

    return results;
  } catch (error) {
    console.error('Error searching civic content:', error);
    return {};
  }
};

/**
 * Get personalized content recommendations
 */
export const getPersonalizedContent = async (userId: string) => {
  try {
    // Get user's progress and preferences
    const { data: userProgress } = await supabase
      .from(DB_TABLES.USER_PROGRESS)
      .select('*')
      .eq('user_id', userId);

    const { data: userPreferences } = await supabase
      .from(DB_TABLES.USER_CATEGORY_PREFERENCES)
      .select('*')
      .eq('user_id', userId);

    // Get recommended skills
    const { data: recommendedSkills } = await supabase
      .rpc(DB_FUNCTIONS.GET_RECOMMENDED_SKILLS_FOR_USER, {
        user_id: userId
      });

    // Get skills needing review
    const { data: reviewSkills } = await supabase
      .rpc(DB_FUNCTIONS.GET_SKILLS_NEEDING_REVIEW, {
        user_id: userId
      });

    return {
      userProgress: userProgress || [],
      userPreferences: userPreferences || [],
      recommendedSkills: recommendedSkills || [],
      reviewSkills: reviewSkills || [],
    };
  } catch (error) {
    console.error('Error fetching personalized content:', error);
    return {};
  }
};

// =============================================================================
// 📊 CONTENT ANALYTICS
// =============================================================================

/**
 * Get content engagement analytics
 */
export const getContentAnalytics = async (contentType: string, contentId: string) => {
  try {
    const { data: analytics } = await supabase
      .from(DB_TABLES.QUESTION_ANALYTICS)
      .select('*')
      .eq('content_type', contentType)
      .eq('content_id', contentId);

    return analytics || [];
  } catch (error) {
    console.error('Error fetching content analytics:', error);
    return [];
  }
};

/**
 * Get social proof statistics for content
 */
export const getSocialProofStats = async (questionId: string) => {
  try {
    const { data: stats } = await supabase
      .rpc(DB_FUNCTIONS.GET_QUESTION_SOCIAL_PROOF_STATS, {
        question_id: questionId
      });

    return stats || null;
  } catch (error) {
    console.error('Error fetching social proof stats:', error);
    return null;
  }
};

// =============================================================================
// 🔄 MIGRATION HELPERS
// =============================================================================

/**
 * Check if the new schema (junction table) is available
 */
const hasNewSchema = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('question_topic_categories')
      .select('id')
      .limit(1);
    
    // If we can select from junction table without error, new schema exists
    return !error;
  } catch (error) {
    return false;
  }
};

/**
 * Optimized version using junction table for many-to-many relationships
 */
const getEnrichedQuestionTopicsOptimized = async (categoryId?: string): Promise<EnrichedQuestionTopic[]> => {
  try {
    let query = supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select(`
        *,
        question_topic_categories!inner(
          category:${DB_TABLES.CATEGORIES}(*),
          is_primary
        )
      `)
      .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
      .order(DB_COLUMNS.QUESTION_TOPICS.TOPIC_TITLE);

    // Filter by category using junction table
    if (categoryId) {
      query = query.eq('question_topic_categories.category_id', categoryId);
    }

    const { data: topics, error } = await query;
    if (error) throw error;

    // Much simpler enrichment with proper joins
    const enrichedTopics = await Promise.all(
      (topics || []).map(async (topic) => {
        // Get question count for this topic using separate query
        let questionCount = 0;
        try {
          const { count } = await supabase
            .from(DB_TABLES.QUESTIONS)
            .select('id', { count: 'exact', head: true })
            .eq('topic_id', topic.id)
            .eq('is_active', true);
          questionCount = count || 0;
        } catch (countError) {
          // Fallback to questions_test table if main table fails
          try {
            const { count } = await supabase
              .from('questions_test')
              .select('id', { count: 'exact', head: true })
              .eq('topic_id', topic.id)
              .eq('is_active', true);
            questionCount = count || 0;
          } catch (fallbackError) {
            console.warn(`Failed to get question count for topic ${topic.id}:`, fallbackError);
            questionCount = 0;
          }
        }

        // Get related figures using existing junction table
        const { data: figures } = await supabase
          .from(DB_TABLES.FIGURE_QUIZ_TOPICS)
          .select(`
            public_figures:${DB_TABLES.PUBLIC_FIGURES}(*)
          `)
          .eq('topic_id', topic.id);

        // Get related organizations
        const { data: orgs } = await supabase
          .from(DB_TABLES.ORGANIZATIONS)
          .select('*')
          .contains('related_topics', JSON.stringify([topic.id]));

        const difficulty = (topic.difficulty_level || 1) <= 3 ? 'beginner' : 
                          (topic.difficulty_level || 1) <= 6 ? 'intermediate' : 'advanced';

        // Extract categories from junction table data
        const categories = topic.question_topic_categories?.map((qtc: any) => qtc.category) || [];
        const primaryCategory = topic.question_topic_categories?.find((qtc: any) => qtc.is_primary)?.category;

        return {
          ...topic,
          questionCount,
          relatedFigures: figures?.map(f => f.public_figures).filter(Boolean) || [],
          relatedOrganizations: orgs || [],
          sourceLinks: [],
          difficulty,
          // Additional data from junction table
          categories,
          primaryCategory,
        };
      })
    );

    console.log(`📚 Found ${enrichedTopics.length} enriched question topics (junction table)`);
    return enrichedTopics;
  } catch (error) {
    console.error('Error fetching enriched question topics (junction table):', error);
    throw error;
  }
};

/**
 * Legacy version using JSONB categories
 */
const getEnrichedQuestionTopicsLegacy = async (categoryId?: string): Promise<EnrichedQuestionTopic[]> => {
  try {
    let query = supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select('*')
      .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
      .order(DB_COLUMNS.QUESTION_TOPICS.TOPIC_TITLE);

    // Use JSONB contains for filtering
    if (categoryId) {
      query = query.contains(DB_COLUMNS.QUESTION_TOPICS.CATEGORIES, JSON.stringify([categoryId]));
    }

    const { data: topics, error } = await query;
    if (error) throw error;

    // Enrich with separate queries
    const enrichedTopics = await Promise.all(
      (topics || []).map(async (topic) => {
        // Get question count for this topic
        const { data: questionCount } = await supabase
          .from(DB_TABLES.QUESTIONS)
          .select('id', { count: 'exact' })
          .eq('topic_id', topic.id)
          .eq('is_active', true);

        // Get related figures
        const { data: figures } = await supabase
          .from(DB_TABLES.FIGURE_QUIZ_TOPICS)
          .select(`
            public_figures:${DB_TABLES.PUBLIC_FIGURES}(*)
          `)
          .eq('topic_id', topic.id);

        // Get related organizations
        const { data: orgs } = await supabase
          .from(DB_TABLES.ORGANIZATIONS)
          .select('*')
          .contains('related_topics', JSON.stringify([topic.id]));

        const difficulty = (topic.difficulty_level || 1) <= 3 ? 'beginner' : 
                          (topic.difficulty_level || 1) <= 6 ? 'intermediate' : 'advanced';

        return {
          ...topic,
          questionCount: questionCount?.length || 0,
          relatedFigures: figures?.map(f => f.public_figures).filter(Boolean) || [],
          relatedOrganizations: orgs || [],
          sourceLinks: [],
          difficulty,
        };
      })
    );

    console.log(`📚 Found ${enrichedTopics.length} enriched question topics (legacy)`);
    return enrichedTopics;
  } catch (error) {
    console.error('Error fetching enriched question topics (legacy):', error);
    throw error;
  }
};

// =============================================================================
// 🔄 JUNCTION TABLE SYNC UTILITIES
// =============================================================================

/**
 * Sync categories from JSONB to junction table
 * Safe to run multiple times - will not create duplicates
 */
export const syncCategoriesToJunctionTable = async (): Promise<{
  processed: number;
  synced: number;
  errors: string[];
}> => {
  const results = {
    processed: 0,
    synced: 0,
    errors: [] as string[]
  };

  try {
    // Get all topics with JSONB categories
    const { data: topics, error: topicsError } = await supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select('id, categories')
      .not('categories', 'is', null);

    if (topicsError) {
      results.errors.push(`Failed to fetch topics: ${topicsError.message}`);
      return results;
    }

    console.log(`🔄 Processing ${topics?.length || 0} topics for junction table sync...`);

    for (const topic of topics || []) {
      results.processed++;
      
      try {
        // Parse JSONB categories
        const categories = Array.isArray(topic.categories) ? topic.categories : [];
        
        if (categories.length === 0) continue;

        // Prepare junction table records
        const junctionRecords = categories.map((categoryId, index) => ({
          topic_id: topic.id,
          category_id: categoryId,
          is_primary: index === 0, // First category is primary
        }));

        // Use upsert to avoid duplicates
        const { error: insertError } = await supabase
          .from('question_topic_categories')
          .upsert(junctionRecords, {
            onConflict: 'topic_id,category_id',
            ignoreDuplicates: true
          });

        if (insertError) {
          results.errors.push(`Topic ${topic.id}: ${insertError.message}`);
        } else {
          results.synced++;
          console.log(`✅ Synced ${categories.length} categories for topic ${topic.id}`);
        }
      } catch (error) {
        results.errors.push(`Topic ${topic.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`🎉 Sync complete: ${results.synced}/${results.processed} topics synced`);
    if (results.errors.length > 0) {
      console.warn(`⚠️ ${results.errors.length} errors occurred:`, results.errors);
    }

  } catch (error) {
    results.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return results;
};

/**
 * Sync categories for a specific topic (useful when creating/updating content)
 */
export const syncTopicCategories = async (topicId: string): Promise<boolean> => {
  try {
    // Get the specific topic
    const { data: topic, error } = await supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select('id, categories')
      .eq('id', topicId)
      .single();

    if (error || !topic) {
      console.error(`Failed to fetch topic ${topicId}:`, error);
      return false;
    }

    // Parse categories
    const categories = Array.isArray(topic.categories) ? topic.categories : [];
    
    if (categories.length === 0) {
      console.log(`No categories to sync for topic ${topicId}`);
      return true;
    }

    // First, remove existing junction records for this topic
    await supabase
      .from('question_topic_categories')
      .delete()
      .eq('topic_id', topicId);

    // Insert new records
    const junctionRecords = categories.map((categoryId, index) => ({
      topic_id: topicId,
      category_id: categoryId,
      is_primary: index === 0,
    }));

    const { error: insertError } = await supabase
      .from('question_topic_categories')
      .insert(junctionRecords);

    if (insertError) {
      console.error(`Failed to sync categories for topic ${topicId}:`, insertError);
      return false;
    }

    console.log(`✅ Synced ${categories.length} categories for topic ${topicId}`);
    return true;
  } catch (error) {
    console.error(`Error syncing topic ${topicId}:`, error);
    return false;
  }
};

export default {
  getEnrichedCategories,
  getEnrichedQuestionTopics,
  getCivicQuestions,
  getPublicFigureProfiles,
  getCurrentCivicEvents,
  getCivicNews,
  getCivicSkills,
  getGlossaryTerms,
  searchCivicContent,
  getPersonalizedContent,
  getContentAnalytics,
  getSocialProofStats,
  syncCategoriesToJunctionTable,
  syncTopicCategories,
  getSkillRelatedContent,
}; 