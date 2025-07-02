import { supabase, type DbQuestion, type DbQuestionTopic, type DbCategory } from './supabase';
import { DB_TABLES, DB_COLUMNS } from './database-constants';
import { MOBILE_CONSTANTS, GAME_SETTINGS, SCORING, GAME_TABLE_GROUPS } from './mobile-constants';
import type { QuizGameMode, QuizGameMetadata } from './quiz-types';

/**
 * Database utility functions for CivicSense Mobile App
 * 
 * Game Structure:
 * - Categories = Deck categories (organizing game decks by subject)
 * - Question Topics = Game Decks (collections of questions)
 * - Questions = Question Cards (individual questions within decks)
 */

/**
 * Error class for invalid category IDs
 */
export class InvalidCategoryError extends Error {
  constructor(categoryId: string) {
    super(`Invalid category ID format: ${categoryId}. Expected UUID or legacy cat-N format.`);
    this.name = 'InvalidCategoryError';
  }
}

/**
 * Validate category ID format and throw if invalid
 */
export const validateCategoryIdOrThrow = (categoryId: string): void => {
  if (!validateCategoryId(categoryId)) {
    throw new InvalidCategoryError(categoryId);
  }
};

// =============================================================================
// 🎮 CORE GAME FUNCTIONS (Categories, Decks, Questions)
// =============================================================================

/**
 * Get all active deck categories
 */
export const getCategories = async (): Promise<DbCategory[]> => {
  try {
    const { data, error } = await supabase
      .from(DB_TABLES.CATEGORIES)
      .select('*')
      .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, true)
      .order(DB_COLUMNS.CATEGORIES.DISPLAY_ORDER);

    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCategories:', error);
    throw error; // Propagate error to caller
  }
};

// Helper – simple UUID v4 matcher (8-4-4-4-12 hex)
const isUUID = (value: string): boolean => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
};

/**
 * Validate category ID format.
 *
 * Historically category IDs followed a readable `cat-N` pattern. After the
 * schema migration they switched to UUIDs.  We now treat **either** format as
 * valid so callers can simply pass whatever comes from `DbCategories.id`.
 */
export const validateCategoryId = (categoryId: string): boolean => {
  return /^cat-\d+$/.test(categoryId) || isUUID(categoryId);
};

/**
 * Get all available game decks (question topics) with mobile-optimized queries
 */
export const getGameDecksByCategory = async (categoryId?: string): Promise<DbQuestionTopic[]> => {
  try {
    if (categoryId) {
      try {
        validateCategoryIdOrThrow(categoryId);
      } catch (error) {
        if (error instanceof InvalidCategoryError) {
          // Try to resolve by name
          const resolvedId = await getCategoryIdByNameOrAlias(categoryId);
          if (!resolvedId) {
            console.error(error.message);
            return [];
          }
          categoryId = resolvedId;
        } else {
          throw error;
        }
      }
    }

    console.log(`🎲 Fetching game decks${categoryId ? ` for category ${categoryId}` : ''}`);
    
    // First, try using the schema-safe approach without relationships
    let query = supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select(`
        *,
        topic_id,
        topic_title,
        description,
        categories,
        is_active,
        created_at,
        updated_at
      `)
      .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
      .order(DB_COLUMNS.QUESTION_TOPICS.TOPIC_TITLE);

    if (categoryId) {
      // Use contains operator with the JSONB array - pass the array as a string
      query = query.contains('categories', JSON.stringify([categoryId]));
    }

    const { data: topics, error: topicsError } = await query;

    if (topicsError) {
      console.error('Error fetching game decks:', topicsError);
      throw new Error(`Failed to fetch game decks: ${topicsError.message}`);
    }

    if (!topics || topics.length === 0) {
      console.log('📚 No topics found, returning empty array');
      return [];
    }

    // Get question counts separately to avoid relationship issues
    const topicsWithCounts = await Promise.all(
      topics.map(async (topic) => {
        try {
          // Get question count for this topic
          const { count, error: countError } = await supabase
            .from(DB_TABLES.QUESTIONS)
            .select('*', { count: 'exact', head: true })
            .eq(DB_COLUMNS.QUESTIONS.TOPIC_ID, topic.topic_id)
            .eq(DB_COLUMNS.QUESTIONS.IS_ACTIVE, true);

          if (countError) {
            console.warn(`Main questions table error for topic ${topic.topic_id}:`, countError);
            // Try questions_test table as fallback using both possible field names
            try {
              const { count: testCount } = await supabase
                .from(DB_TABLES.QUESTIONS_TEST)
                .select('*', { count: 'exact', head: true })
                .eq('topic_id', topic.topic_id) // Direct topic_id
                .eq('is_active', true);
              
              console.log(`📝 Topic ${topic.topic_title} has ${testCount || 0} questions (from test table)`);
              return {
                ...topic,
                title: topic.topic_title, // Ensure title field exists
                questions: [{ count: testCount || 0 }]
              };
            } catch (testError) {
              console.warn(`Test questions table also failed for topic ${topic.topic_id}:`, testError);
              return {
                ...topic,
                title: topic.topic_title,
                questions: [{ count: 0 }]
              };
            }
          }

          return {
            ...topic,
            title: topic.topic_title, // Map topic_title to title for consistency
            questions: [{ count: count || 0 }]
          };
        } catch (error) {
          console.warn(`Error processing topic ${topic.topic_id}:`, error);
          return {
            ...topic,
            title: topic.topic_title, // Map topic_title to title for consistency
            questions: [{ count: 0 }]
          };
        }
      })
    );

    // Get category info if we have topics
    if (topicsWithCounts.length > 0) {
      const allCategoryIds = new Set<string>();
      topicsWithCounts.forEach(topic => {
        if (topic.categories && Array.isArray(topic.categories)) {
          topic.categories.forEach((catId: string) => allCategoryIds.add(catId));
        }
      });

      if (allCategoryIds.size > 0) {
        const { data: categories, error: categoriesError } = await supabase
          .from(DB_TABLES.CATEGORIES)
          .select(`
            ${DB_COLUMNS.CATEGORIES.ID},
            ${DB_COLUMNS.CATEGORIES.NAME},
            ${DB_COLUMNS.CATEGORIES.EMOJI},
            ${DB_COLUMNS.CATEGORIES.DESCRIPTION}
          `)
          .in(DB_COLUMNS.CATEGORIES.ID, Array.from(allCategoryIds));

        if (categoriesError) {
          console.warn('Error fetching categories for topics:', categoriesError);
        } else {
          // Create a map of category data
          const categoryMap = (categories || []).reduce((acc, cat) => {
            acc[cat.id] = cat;
            return acc;
          }, {} as Record<string, any>);

          // Enrich topics with their primary category
          topicsWithCounts.forEach(topic => {
            if (topic.categories && Array.isArray(topic.categories) && topic.categories.length > 0) {
              topic.category = categoryMap[topic.categories[0]] || null;
            }
          });
        }
      }
    }

    console.log(`📚 Found ${topicsWithCounts?.length || 0} question topics${categoryId ? ` for category ${categoryId}` : ''}`);
    return topicsWithCounts || [];
  } catch (error) {
    console.error('Error in getGameDecksByCategory:', error);
    throw error;
  }
};

/**
 * Get all available game decks (question topics)
 * Uses multiple fallback strategies for maximum reliability
 */
export const getQuestionTopics = async (categoryId?: string): Promise<DbQuestionTopic[]> => {
  try {
    console.log(`📚 Loading topics${categoryId ? ` for category ${categoryId}` : ''}...`);

    // Strategy 1: Try junction table approach with question_topic_categories
    if (categoryId) {
      try {
        console.log('📚 Trying junction table approach (question_topic_categories)...');
        const { data: junctionTopics, error: junctionError } = await supabase
          .from(DB_TABLES.QUESTION_TOPICS)
          .select(`
            *,
            question_topic_categories!inner(
              category_id
            )
          `)
          .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
          .eq('question_topic_categories.category_id', categoryId)
          .order(DB_COLUMNS.QUESTION_TOPICS.TOPIC_TITLE);

        if (!junctionError && junctionTopics && junctionTopics.length > 0) {
          console.log(`📚 Found ${junctionTopics.length} topics using junction table (question_topic_categories)`);
          return junctionTopics.map(topic => ({
            ...topic,
            title: topic.topic_title,
            topic_title: topic.topic_title
          }));
        }
        console.log('📚 Junction table (question_topic_categories) returned no results, trying next approach...');
      } catch (junctionErr) {
        console.log('📚 Junction table (question_topic_categories) approach failed, trying next approach...');
      }

      // Strategy 2: Legacy JSONB approach
      try {
        console.log('📚 Trying JSONB categories approach...');
        const { data: jsonbTopics, error: jsonbError } = await supabase
          .from(DB_TABLES.QUESTION_TOPICS)
          .select('*')
          .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
          .not('date', 'is', null) // Only include topics with valid dates
          .contains('categories', JSON.stringify([categoryId]))
          .order(DB_COLUMNS.QUESTION_TOPICS.TOPIC_TITLE);

        if (!jsonbError && jsonbTopics && jsonbTopics.length > 0) {
          console.log(`📚 Found ${jsonbTopics.length} topics using JSONB categories approach`);
          return jsonbTopics.map(topic => ({
            ...topic,
            title: topic.topic_title,
            topic_title: topic.topic_title
          }));
        }
        console.log('📚 JSONB categories approach returned no results');
      } catch (jsonbErr) {
        console.log('📚 JSONB categories approach failed');
      }

             // Strategy 3: Final fallback - get all topics and filter by checking questions table
      try {
        console.log('📚 Trying final fallback - checking questions table for category relationship...');
        
        // First get the category to check for related topics through questions
        const { data: allTopics, error: allTopicsError } = await supabase
          .from(DB_TABLES.QUESTION_TOPICS)
          .select('*')
          .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
          .not('date', 'is', null) // Only include topics with valid dates
          .order(DB_COLUMNS.QUESTION_TOPICS.TOPIC_TITLE);

        if (!allTopicsError && allTopics && allTopics.length > 0) {
          // Check which topics have questions that might be related to this category
          const topicsWithQuestions = await Promise.all(
            allTopics.map(async (topic) => {
              try {
                                 const { count } = await supabase
                   .from(DB_TABLES.QUESTIONS)
                   .select('*', { count: 'exact', head: true })
                   .eq(DB_COLUMNS.QUESTIONS.TOPIC_ID, topic.topic_id)
                   .eq(DB_COLUMNS.QUESTIONS.IS_ACTIVE, true);
                 
                 return (count && count > 0) ? topic : null;
              } catch {
                return null;
              }
            })
          );

          const validTopics = topicsWithQuestions.filter(Boolean);
          if (validTopics.length > 0) {
            console.log(`📚 Found ${validTopics.length} topics with questions as final fallback`);
            return validTopics.map(topic => ({
              ...topic,
              title: topic.topic_title,
              topic_title: topic.topic_title
            }));
          }
        }
      } catch (fallbackErr) {
        console.log('📚 Final fallback approach also failed');
      }

      console.log(`📚 No topics found for category ${categoryId} using any approach`);
      return [];
    }

    // No category filter - get all topics
    const { data: topics, error } = await supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select('*')
      .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
      .not('date', 'is', null) // Only include topics with valid dates
      .order(DB_COLUMNS.QUESTION_TOPICS.TOPIC_TITLE);

    if (error) {
      console.error('Error fetching all question topics:', error);
      throw error;
    }

    console.log(`📚 Loaded ${topics?.length || 0} topics (no category filter)`);
    
    // Transform the data to match our type
    return (topics || []).map(topic => ({
      ...topic,
      title: topic.topic_title,
      topic_title: topic.topic_title
    }));
  } catch (error) {
    console.error('Error in getQuestionTopics:', error);
    throw error;
  }
};

/**
 * Get question cards from a specific deck with mobile-optimized batch size
 */
export const getQuestionsFromDeck = async (
  deckId: string, 
  limit: number = GAME_SETTINGS.DEFAULT_QUESTIONS_PER_DECK,
  randomize: boolean = false
): Promise<DbQuestion[]> => {
  try {
    if (!deckId) {
      throw new Error('Deck ID is required');
    }

    console.log(`🎲 Fetching questions for deck ${deckId} with limit ${limit}`);
    
    let query = supabase
      .from(DB_TABLES.QUESTIONS)
      .select(`
        *,
        source_links:${DB_TABLES.QUESTION_SOURCE_LINKS}(*)
      `)
      .eq(DB_COLUMNS.QUESTIONS.TOPIC_ID, deckId)
      .eq(DB_COLUMNS.QUESTIONS.IS_ACTIVE, true);

    if (randomize) {
      query = query.order('random()').limit(limit);
    } else {
      query = query.order(DB_COLUMNS.QUESTIONS.DIFFICULTY_LEVEL).order('id').limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching questions from deck:', error);
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn(`No questions found for deck ${deckId}`);
    }

    console.log(`📝 Found ${data?.length || 0} questions for deck ${deckId}`);
    return data || [];
  } catch (error) {
    console.error('Error in getQuestionsFromDeck:', error);
    throw error; // Propagate error to caller
  }
};

/**
 * Legacy function for backward compatibility
 */
export const getQuestionsForTopic = async (
  topicId: string, 
  limit: number = MOBILE_CONSTANTS.BATCH_SIZES.QUESTIONS
): Promise<DbQuestion[]> => {
  return getQuestionsFromDeck(topicId, limit);
};

/**
 * Get a random sample of questions from a deck (for quick games)
 */
export const getRandomQuestionsFromDeck = async (
  deckId: string,
  count: number = 10
): Promise<DbQuestion[]> => {
  return getQuestionsFromDeck(deckId, count, true);
};

// =============================================================================
// 👤 USER PROGRESS & GAME SESSIONS
// =============================================================================

/**
 * Get user's overall progress and achievements
 */
export const getUserProgress = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from(DB_TABLES.USER_PROGRESS)
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user progress:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserProgress:', error);
    return [];
  }
};

/**
 * Create a new single-player game session
 */
export const createGameSession = async (
  userId: string, 
  deckId: string, 
  gameMode: QuizGameMode = 'practice',
  metadata: QuizGameMetadata = {}
) => {
  try {
    const { data, error } = await supabase
      .from(DB_TABLES.USER_QUIZ_ATTEMPTS)
      .insert({
        user_id: userId,
        topic_id: deckId,
        total_questions: GAME_SETTINGS.DEFAULT_QUESTIONS_PER_DECK,
        started_at: new Date().toISOString(),
        game_mode: gameMode,
        game_metadata: metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating game session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createGameSession:', error);
    return null;
  }
};

/**
 * Legacy function for backward compatibility
 */
export const createQuizAttempt = async (userId: string, topicId: string) => {
  return createGameSession(userId, topicId);
};

/**
 * Get user's progress on a specific deck
 */
export const getUserDeckProgress = async (userId: string, deckId: string) => {
  try {
    const { data, error } = await supabase
      .from(DB_TABLES.USER_QUIZ_ATTEMPTS)
      .select('*')
      .eq('user_id', userId)
      .eq('topic_id', deckId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user deck progress:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserDeckProgress:', error);
    return [];
  }
};

// =============================================================================
// 🎯 MULTIPLAYER GAME FUNCTIONS
// =============================================================================

/**
 * Get active multiplayer rooms
 */
export const getActiveMultiplayerRooms = async (limit: number = 20) => {
  try {
    // First try using the new database function
    const { data: functionData, error: functionError } = await supabase
      .rpc('get_active_multiplayer_rooms', { room_limit: limit });

    if (!functionError && functionData) {
      console.log(`🎮 Retrieved ${functionData.length} active rooms using function`);
      return functionData;
    }

    // Fallback to direct table query with correct column names
    console.log('🎮 Function failed, trying direct query...');
    const { data, error } = await supabase
      .from(DB_TABLES.MULTIPLAYER_ROOMS)
      .select(`
        id,
        room_code,
        room_name,
        room_status,
        current_players,
        max_players,
        topic_id,
        host_user_id,
        host_display_name,
        game_mode,
        created_at,
        updated_at
      `)
      .eq('room_status', 'waiting')
      .filter('expires_at', 'is', null)
      .or('expires_at.gt.' + new Date().toISOString())
      .lt('current_players', 'max_players')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching active multiplayer rooms:', error);
      return [];
    }

    // Transform the data to match expected interface
    const transformedData = (data || []).map(room => ({
      ...room,
      status: room.room_status, // Map room_status to status for frontend compatibility
    }));

    console.log(`🎮 Retrieved ${transformedData.length} active rooms using direct query`);
    return transformedData;
  } catch (error) {
    console.error('Error in getActiveMultiplayerRooms:', error);
    return [];
  }
};

/**
 * Create a multiplayer room using the database function
 */
export const createMultiplayerRoom = async (
  roomName: string,
  topicId: string,
  hostDisplayName: string,
  hostUserId: string,
  maxPlayers: number = 4,
  playerEmoji: string = '🎯'
) => {
  try {
    console.log('🎮 Creating multiplayer room:', {
      roomName,
      topicId,
      hostDisplayName,
      hostUserId,
      maxPlayers
    });

    // Try the database function first
    const { data, error } = await supabase.rpc('create_multiplayer_room', {
      p_topic_id: topicId,
      p_host_user_id: hostUserId,
      p_host_guest_token: null,
      p_room_name: roomName,
      p_max_players: maxPlayers,
      p_game_mode: 'standard',
    });

    if (error) {
      console.error('Database function failed:', error);
      
      // Fallback to direct table operations with explicit table qualification
      console.log('🎮 Falling back to direct room creation...');
      return await createMultiplayerRoomDirect(
        roomName,
        topicId,
        hostDisplayName,
        hostUserId,
        maxPlayers,
        playerEmoji
      );
    }

    const roomData = data?.[0];
    if (!roomData) {
      console.log('🎮 No room data returned, falling back to direct creation...');
      return await createMultiplayerRoomDirect(
        roomName,
        topicId,
        hostDisplayName,
        hostUserId,
        maxPlayers,
        playerEmoji
      );
    }

    console.log('✅ Room created successfully:', roomData);
    return {
      success: true,
      error: null,
      data: roomData
    };
  } catch (error) {
    console.error('Error in createMultiplayerRoom:', error);
    
    // Final fallback to direct creation
    console.log('🎮 Exception occurred, falling back to direct creation...');
    return await createMultiplayerRoomDirect(
      roomName,
      topicId,
      hostDisplayName,
      hostUserId,
      maxPlayers,
      playerEmoji
    );
  }
};

/**
 * Fallback function to create multiplayer room directly via Supabase client
 * This avoids the ambiguous column reference issue in the PostgreSQL function
 */
const createMultiplayerRoomDirect = async (
  roomName: string,
  topicId: string,
  hostDisplayName: string,
  hostUserId: string,
  maxPlayers: number = 4,
  playerEmoji: string = '🎯'
) => {
  try {
    // Generate a unique room code
    const roomCode = generateRoomCode();
    
    // Insert room record with explicit column specification
    const { data: roomData, error: roomError } = await supabase
      .from(DB_TABLES.MULTIPLAYER_ROOMS)
      .insert({
        room_code: roomCode,
        room_name: roomName,
        topic_id: topicId,
        host_user_id: hostUserId,
        max_players: maxPlayers,
        current_players: 1,
        room_status: 'waiting',
        game_mode: 'standard',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        id,
        room_code,
        room_name,
        topic_id,
        host_user_id,
        max_players,
        current_players,
        room_status,
        game_mode,
        created_at
      `)
      .single();

    if (roomError) {
      console.error('Error creating room record:', roomError);
      return {
        success: false,
        error: `Failed to create room: ${roomError.message}`,
        data: null
      };
    }

    // Insert host as first player with explicit column specification
    const { error: playerError } = await supabase
      .from(DB_TABLES.MULTIPLAYER_ROOM_PLAYERS)
      .insert({
        room_id: roomData.id,
        user_id: hostUserId,
        player_name: hostDisplayName,
        player_emoji: playerEmoji,
        is_host: true,
        is_ready: false,
        is_connected: true,
        join_order: 1,
        score: 0,
        questions_answered: 0,
        questions_correct: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      });

    if (playerError) {
      console.error('Error adding host player:', playerError);
      
      // Clean up the room record if player insertion fails
      await supabase
        .from(DB_TABLES.MULTIPLAYER_ROOMS)
        .delete()
        .eq('id', roomData.id);
      
      return {
        success: false,
        error: `Failed to add host player: ${playerError.message}`,
        data: null
      };
    }

    console.log('✅ Room created successfully via direct method:', roomData);
    
    return {
      success: true,
      error: null,
      data: {
        id: roomData.id,
        room_code: roomData.room_code,
        topic_id: roomData.topic_id,
        room_name: roomData.room_name,
        max_players: roomData.max_players,
        current_players: roomData.current_players,
        game_mode: roomData.game_mode,
        room_status: roomData.room_status,
        host_user_id: roomData.host_user_id,
        created_at: roomData.created_at,
      }
    };
  } catch (error) {
    console.error('Error in createMultiplayerRoomDirect:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in direct room creation',
      data: null
    };
  }
};

/**
 * Generate a unique 6-character room code
 */
const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Join a multiplayer room using the database function
 */
export const joinMultiplayerRoom = async (
  roomCode: string,
  playerName: string,
  userId?: string,
  guestToken?: string,
  playerEmoji?: string
) => {
  try {
    console.log('🎮 Joining multiplayer room:', {
      roomCode,
      playerName,
      userId,
      playerEmoji
    });

    const { data, error } = await supabase.rpc('join_multiplayer_room', {
      p_room_code: roomCode.toUpperCase(),
      p_player_name: playerName,
      p_user_id: userId || null,
      p_guest_token: guestToken || null,
      p_player_emoji: playerEmoji || '😊',
    });

    if (error) {
      console.error('Error joining multiplayer room:', error);
      return {
        success: false,
        error: error.message || 'Failed to join room',
        data: null
      };
    }

    const result = data?.[0];
    if (!result) {
      return {
        success: false,
        error: 'No response from join function',
        data: null
      };
    }

    // The function returns success/error fields
    if (!result.success) {
      console.log('❌ Failed to join room:', result.error);
      return {
        success: false,
        error: result.error || 'Failed to join room',
        data: null
      };
    }

    console.log('✅ Successfully joined room:', result);
    return {
      success: true,
      error: null,
      data: result
    };
  } catch (error) {
    console.error('Error in joinMultiplayerRoom:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
};

/**
 * Get players in a multiplayer room
 */
export const getRoomPlayers = async (roomId: string) => {
  try {
    const { data, error } = await supabase
      .from(DB_TABLES.MULTIPLAYER_ROOM_PLAYERS)
      .select('*')
      .eq('room_id', roomId)
      .order('join_order');

    if (error) {
      console.error('Error fetching room players:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRoomPlayers:', error);
    return [];
  }
};

/**
 * Get recent chat messages for a room
 */
export const getRoomChatMessages = async (roomId: string, limit: number = 50) => {
  try {
    const { data, error } = await supabase
      .from(DB_TABLES.MULTIPLAYER_CHAT_MESSAGES)
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching room chat messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRoomChatMessages:', error);
    return [];
  }
};

// =============================================================================
// 📊 ANALYTICS & TRACKING
// =============================================================================

/**
 * Track game completion with enhanced analytics
 */
export const trackGameCompletion = async (
  userId: string,
  quizId: string | undefined,
  score: number,
  totalQuestions: number,
  mode: string,
  timeSpentMs?: number
) => {
  if (!quizId) {
    console.warn('Quiz ID is undefined, skipping game completion tracking');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('game_completions')
      .insert({
        user_id: userId,
        quiz_id: quizId,
        score,
        total_questions: totalQuestions,
        mode,
        time_spent_ms: timeSpentMs,
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error tracking game completion:', error);
    throw error;
  }
};

/**
 * Legacy function for backward compatibility
 */
export const trackQuizCompletion = async (
  userId: string,
  topicId: string,
  score: number,
  totalQuestions: number
) => {
  return trackGameCompletion(userId, topicId, score, totalQuestions, 'practice');
};

/**
 * Save a question response and update user progress
 */
export const saveQuestionResponse = async (
  sessionId: string,
  questionId: string,
  answer: string,
  isCorrect: boolean,
  xpEarned: number = 0
) => {
  try {
    // Save the response
    const { data: responseData, error: responseError } = await supabase
      .from(DB_TABLES.USER_QUESTION_RESPONSES)
      .insert({
        session_id: sessionId,
        question_id: questionId,
        answer,
        is_correct: isCorrect,
        xp_earned: xpEarned,
        answered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (responseError) {
      console.error('Error saving question response:', responseError);
      return null;
    }

    // Update user progress with XP using raw SQL increment
    const { data: progressData, error: progressError } = await supabase
      .from(DB_TABLES.USER_PROGRESS)
      .upsert({
        [DB_COLUMNS.USER_PROGRESS.TOTAL_QUESTIONS_ANSWERED]: `total_questions_answered + 1`,
        [DB_COLUMNS.USER_PROGRESS.TOTAL_CORRECT_ANSWERS]: isCorrect ? `total_correct_answers + 1` : `total_correct_answers`,
        [DB_COLUMNS.USER_PROGRESS.TOTAL_XP]: `total_xp + ${xpEarned}`,
        [DB_COLUMNS.USER_PROGRESS.UPDATED_AT]: new Date().toISOString(),
      })
      .select()
      .single();

    if (progressError) {
      console.error('Error updating user progress:', progressError);
      return responseData;
    }

    return {
      response: responseData,
      progress: progressData
    };
  } catch (error) {
    console.error('Error in saveQuestionResponse:', error);
    return null;
  }
};

// =============================================================================
// 👻 GUEST ACCESS FUNCTIONS
// =============================================================================

/**
 * Track guest usage with mobile-specific data
 */
export const trackGuestUsage = async (
  ipAddress: string,
  date?: string,
  tokens: string[] = [],
  deviceInfo?: any
) => {
  const trackingDate = date || new Date().toISOString().split('T')[0];
  
  try {
    const { data, error } = await supabase
      .from(DB_TABLES.GUEST_USAGE_TRACKING)
      .insert({
        ip: ipAddress,
        date: trackingDate,
        tokens: tokens,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        attempts: 1,
        metadata: {
          platform: 'mobile',
          device_info: deviceInfo,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking guest usage:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in trackGuestUsage:', error);
    return null;
  }
};

/**
 * Track civics test events with game context
 */
export const trackCivicsTestEvent = async (
  sessionId: string,
  eventType: string,
  userId?: string | null,
  guestToken?: string | null,
  score?: number | null,
  metadata?: any
) => {
  try {
    const { data, error } = await supabase
      .from(DB_TABLES.CIVICS_TEST_ANALYTICS)
      .insert({
        session_id: sessionId,
        event_type: eventType,
        user_id: userId || null,
        guest_token: guestToken || null,
        score: score || null,
        metadata: {
          ...metadata,
          platform: 'mobile',
        },
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking civics test event:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in trackCivicsTestEvent:', error);
    return null;
  }
};

// =============================================================================
// 📱 MOBILE-SPECIFIC UTILITY FUNCTIONS
// =============================================================================

/**
 * Get cached categories with mobile optimization
 */
export const getCachedCategories = async (): Promise<DbCategory[]> => {
  try {
    // Try to get from AsyncStorage cache first
    const { getCachedData, setCachedData } = await import('./cache-service');
    
    const cacheKey = 'categories_mobile';
    const cacheExpiration = 30 * 60 * 1000; // 30 minutes
    
    // Check cache first
    const cachedCategories = await getCachedData<DbCategory[]>(cacheKey, cacheExpiration);
    if (cachedCategories) {
      console.log('📚 Using cached categories from AsyncStorage');
      return cachedCategories;
    }
    
    // Cache miss - fetch from database
    console.log('📚 Cache miss - fetching categories from database');
    const categories = await getCategories();
    
    // Cache the results
    if (categories && categories.length > 0) {
      await setCachedData(cacheKey, categories);
      console.log(`📚 Cached ${categories.length} categories to AsyncStorage`);
    }
    
    return categories;
  } catch (error) {
    console.error('Error in getCachedCategories:', error);
    // Fallback to direct database call
    return getCategories();
  }
};

/**
 * Batch get questions from multiple decks (mobile optimization)
 */
export const batchGetQuestionsFromDecks = async (
  deckIds: string[], 
  questionsPerDeck: number = MOBILE_CONSTANTS.BATCH_SIZES.QUESTIONS
): Promise<{ [deckId: string]: DbQuestion[] }> => {
  const results: { [deckId: string]: DbQuestion[] } = {};
  
  // Process decks in batches to avoid overwhelming the database
  for (const deckId of deckIds) {
    try {
      results[deckId] = await getQuestionsFromDeck(deckId, questionsPerDeck);
    } catch (error) {
      console.error(`Error fetching questions for deck ${deckId}:`, error);
      results[deckId] = [];
    }
  }
  
  return results;
};

/**
 * Legacy function for backward compatibility
 */
export const batchGetQuestions = async (
  topicIds: string[], 
  questionsPerTopic: number = MOBILE_CONSTANTS.BATCH_SIZES.QUESTIONS
): Promise<{ [topicId: string]: DbQuestion[] }> => {
  return batchGetQuestionsFromDecks(topicIds, questionsPerTopic);
};

/**
 * Check if table is multiplayer-related (for sync prioritization)
 */
export const isMultiplayerTable = (tableName: string): boolean => {
  return GAME_TABLE_GROUPS.MULTIPLAYER.includes(tableName as any);
};

/**
 * Check if table is core game data (for offline caching)
 */
export const isCoreGameTable = (tableName: string): boolean => {
  return GAME_TABLE_GROUPS.CORE_GAME.includes(tableName as any);
};

// =============================================================================
// 🔧 UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate guest token for anonymous users
 */
export const generateGuestToken = (): string => {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate session ID for tracking
 */
export const generateSessionId = (gameMode: string = 'standard'): string => {
  return `mobile_${gameMode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate game score with bonuses
 */
export const calculateGameScore = (
  correctAnswers: number,
  totalQuestions: number,
  timeSpent: number,
  difficulty: string = 'medium',
  hasStreak: boolean = false
): number => {
  let baseScore = correctAnswers * SCORING.CORRECT_ANSWER_BASE;
  
  // Apply difficulty multiplier
  const difficultyMultiplier = SCORING.DIFFICULTY_MULTIPLIERS[difficulty as keyof typeof SCORING.DIFFICULTY_MULTIPLIERS] || 1.0;
  baseScore *= difficultyMultiplier;
  
  // Apply streak bonus
  if (hasStreak) {
    baseScore *= SCORING.STREAK_MULTIPLIER;
  }
  
  // Apply perfect score bonus
  if (correctAnswers === totalQuestions) {
    baseScore += SCORING.PERFECT_SCORE_BONUS;
  }
  
  return Math.round(baseScore);
};

/**
 * Get categories with their associated topics using junction table or JSONB array relationship
 * Enhanced version with junction table support and comprehensive debugging
 */
export const getCategoriesWithTopics = async (): Promise<(DbCategory & { topic_count: number; topics?: DbQuestionTopic[] })[]> => {
  try {
    console.log('📚 Loading categories with topics...');
    
    // First, try to use the junction table approach
    const hasJunctionTable = await checkJunctionTableExists();
    
    if (hasJunctionTable) {
      console.log('🚀 Using junction table for category-topic relationships');
      return await getCategoriesWithTopicsJunction();
    } else {
      console.log('⚠️ Junction table not available, using JSONB arrays');
      return await getCategoriesWithTopicsLegacy();
    }
  } catch (error) {
    console.error('Error in getCategoriesWithTopics:', error);
    
    // Fallback to basic categories only
    try {
      console.log('🔄 Trying fallback approach for categories...');
      const { data: categories } = await supabase
        .from(DB_TABLES.CATEGORIES)
        .select('*')
        .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, true)
        .order(DB_COLUMNS.CATEGORIES.DISPLAY_ORDER);

      return (categories || []).map(category => ({
        ...category,
        topic_count: 0,
        topics: []
      }));
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return [];
    }
  }
};

/**
 * Check if the junction table exists and is usable
 */
const checkJunctionTableExists = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('question_topic_categories')
      .select('topic_id')
      .limit(1);
    
    return !error && data !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Get categories with topics using junction table (optimal)
 */
const getCategoriesWithTopicsJunction = async (): Promise<(DbCategory & { topic_count: number; topics?: DbQuestionTopic[] })[]> => {
  // First get all categories
  const { data: categories, error: categoriesError } = await supabase
    .from(DB_TABLES.CATEGORIES)
    .select('*')
    .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, true)
    .order(DB_COLUMNS.CATEGORIES.DISPLAY_ORDER);

  if (categoriesError) {
    throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
  }

  console.log(`📚 Found ${categories?.length || 0} categories`);

  // Get topic counts per category using junction table
  const enrichedCategories = await Promise.all(
    (categories || []).map(async (category) => {
      try {
        // Get topics for this category via junction table
        const { data: topicRelations, error: relError } = await supabase
          .from('question_topic_categories')
          .select(`
            topic_id,
            is_primary,
            question_topics!inner(
              topic_id,
              topic_title,
              description,
              is_active,
              categories
            )
          `)
          .eq('category_id', category.id)
          .eq('question_topics.is_active', true);

        if (relError) {
          console.warn(`Error fetching topics for category ${category.name}:`, relError);
          return {
            ...category,
            topic_count: 0,
            topics: []
          };
        }

                 // Extract topics and add question counts
         const topics = await Promise.all(
           (topicRelations || []).map(async (rel) => {
             const topic = rel.question_topics as any;
             
             // Get question count for this topic
             const topicId = topic?.topic_id || rel.topic_id;
             const { count } = await supabase
               .from(DB_TABLES.QUESTIONS)
               .select('*', { count: 'exact', head: true })
               .eq(DB_COLUMNS.QUESTIONS.TOPIC_ID, topicId)
               .eq(DB_COLUMNS.QUESTIONS.IS_ACTIVE, true);

             return {
               ...topic,
               title: topic?.topic_title || topic?.title || 'Untitled Topic',
               questions: [{ count: count || 0 }],
               isPrimary: rel.is_primary
             };
           })
         );

        console.log(`📂 Category "${category.name}" has ${topics.length} topics (junction table)`);
        
        return {
          ...category,
          topic_count: topics.length,
          topics
        };
      } catch (error) {
        console.warn(`Error processing category ${category.name}:`, error);
        return {
          ...category,
          topic_count: 0,
          topics: []
        };
      }
    })
  );

  const totalTopicsAssigned = enrichedCategories.reduce((sum, cat) => sum + cat.topic_count, 0);
  console.log(`📚 Junction table result: ${enrichedCategories.length} categories with ${totalTopicsAssigned} total topic assignments`);
  
  return enrichedCategories;
};

/**
 * Get categories with topics using JSONB arrays (legacy fallback)
 */
const getCategoriesWithTopicsLegacy = async (): Promise<(DbCategory & { topic_count: number; topics?: DbQuestionTopic[] })[]> => {
  // First get all categories
  const { data: categories, error: categoriesError } = await supabase
    .from(DB_TABLES.CATEGORIES)
    .select('*')
    .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, true)
    .order(DB_COLUMNS.CATEGORIES.DISPLAY_ORDER);

  if (categoriesError) {
    throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
  }

  console.log(`📚 Found ${categories?.length || 0} categories`);

  // Get ALL topics (not filtered by category yet)
  const { data: allTopics, error: topicsError } = await supabase
    .from(DB_TABLES.QUESTION_TOPICS)
    .select('*')
    .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true);

  if (topicsError) {
    throw new Error(`Failed to fetch topics: ${topicsError.message}`);
  }

  console.log(`📚 Found ${allTopics?.length || 0} total topics`);

  // Debug: Check how many topics have categories assigned
  const topicsWithCategories = (allTopics || []).filter(topic => 
    topic.categories && Array.isArray(topic.categories) && topic.categories.length > 0
  );
  console.log(`📊 ${topicsWithCategories.length}/${allTopics?.length || 0} topics have categories assigned`);

  if (topicsWithCategories.length === 0) {
    console.warn('🚨 NO TOPICS HAVE CATEGORIES ASSIGNED - This is the root cause!');
    console.log('💡 Consider running the sync utility to fix category assignments');
  }

  // Get question counts separately for each topic (connecting topics to questions)
  const topicsWithCounts = await Promise.all(
    (allTopics || []).map(async (topic) => {
      try {
        // Get question count for this topic
        const { count, error: countError } = await supabase
          .from(DB_TABLES.QUESTIONS)
          .select('*', { count: 'exact', head: true })
          .eq(DB_COLUMNS.QUESTIONS.TOPIC_ID, topic.topic_id)
          .eq(DB_COLUMNS.QUESTIONS.IS_ACTIVE, true);

        if (countError) {
          console.warn(`Could not get question count for topic ${topic.topic_id}:`, countError.message);
          return {
            ...topic,
            title: topic.topic_title,
            questions: [{ count: 0 }]
          };
        }

        console.log(`📝 Topic "${topic.topic_title}" has ${count || 0} questions, categories: ${JSON.stringify(topic.categories)}`);
        return {
          ...topic,
          title: topic.topic_title,
          questions: [{ count: count || 0 }]
        };
      } catch (error) {
        console.warn(`Error getting count for topic ${topic.topic_id}:`, error);
        return {
          ...topic,
          title: topic.topic_title,
          questions: [{ count: 0 }]
        };
      }
    })
  );

  // Map topics to their categories using the JSONB array relationship
  const enrichedCategories = categories?.map(category => {
    const categoryTopics = topicsWithCounts.filter(topic => {
      // Check if this topic belongs to this category
      const belongsToCategory = topic.categories && 
        Array.isArray(topic.categories) && 
        topic.categories.includes(category.id);
      
      if (belongsToCategory) {
        console.log(`📂 Topic "${topic.topic_title}" belongs to category "${category.name}"`);
      }
      
      return belongsToCategory;
    });

    console.log(`📂 Category "${category.name}" has ${categoryTopics.length} topics (JSONB)`);
    
    return {
      ...category,
      topic_count: categoryTopics.length,
      topics: categoryTopics
    };
  }) || [];

  const totalTopicsAssigned = enrichedCategories.reduce((sum, cat) => sum + cat.topic_count, 0);
  console.log(`📚 JSONB result: ${enrichedCategories.length} categories with ${totalTopicsAssigned} total topic assignments`);
  
  // Debug: Show which categories have topics
  enrichedCategories.forEach(cat => {
    if (cat.topic_count > 0) {
      console.log(`✅ ${cat.name}: ${cat.topic_count} topics`);
    } else {
      console.log(`❌ ${cat.name}: 0 topics`);
    }
  });

  return enrichedCategories;
};

/**
 * Get latest news from source metadata for ticker
 */
export const getLatestNews = async (
  limit: number = 10,
  options?: {
    date?: string; // YYYY-MM-DD format for date-specific news
    includeGeneral?: boolean; // Include general (non-date-specific) news
  }
): Promise<any[]> => {
  try {
    let query = supabase
      .from(DB_TABLES.SOURCE_METADATA)
      .select(`
        id,
        title,
        url,
        domain,
        description,
        og_description,
        og_title,
        og_image,
        published_time,
        credibility_score,
        is_active,
        author,
        bias_rating,
        content_type,
        language,
        date_specific
      `)
      .eq('is_active', true)
      // Ensure required fields are present
      .not('domain', 'is', null)
      .not('url', 'is', null)
      // Title must be present in either title or og_title
      .or('title.not.is.null,og_title.not.is.null')
      // Description must be present in either description or og_description
      .or('description.not.is.null,og_description.not.is.null')
      // Filter out test domains
      .not('domain', 'ilike', '%example.com%')
      .not('domain', 'ilike', '%test.%');

    // Apply date filtering if specified
    if (options?.date) {
      if (options.includeGeneral) {
        // Include both date-specific news for the date AND general news
        query = query.or(`date_specific.eq.${options.date},date_specific.is.null`);
      } else {
        // Only date-specific news for the specified date
        query = query.eq('date_specific', options.date);
      }
    } else if (options?.includeGeneral === false) {
      // Only general news (no date-specific)
      query = query.is('date_specific', null);
    }
    // If no date specified and includeGeneral not false, include all news

    const { data, error } = await query
      .order('published_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching latest news:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getLatestNews:', error);
    return [];
  }
};

/**
 * Get news for a specific date
 */
export const getNewsForDate = async (
  date: string, // YYYY-MM-DD format
  limit: number = 10
): Promise<any[]> => {
  return getLatestNews(limit, { date, includeGeneral: true });
};

// =============================================================================
// 🔧 DEBUG & TESTING FUNCTIONS
// =============================================================================

/**
 * Discover the actual database schema by querying real data
 * This helps us understand what columns actually exist vs our assumptions
 */
export const discoverDatabaseSchema = async () => {
  console.log('🔍 Discovering actual database schema...');
  
  const results: any = {};
  
  try {
    // Discover categories table structure
    console.log('📋 Discovering categories table...');
    const { data: categories, error: categoriesError } = await supabase
      .from(DB_TABLES.CATEGORIES)
      .select('*')
      .limit(1);
    
    if (categoriesError) {
      console.error('❌ Categories table error:', categoriesError);
      results.categories = { error: categoriesError, columns: [] };
    } else {
      const columns = categories && categories.length > 0 ? Object.keys(categories[0]) : [];
      console.log('✅ Categories columns:', columns);
      results.categories = { columns, sampleData: categories?.[0] };
    }

    // Discover question_topics table structure
    console.log('📋 Discovering question_topics table...');
    const { data: topics, error: topicsError } = await supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select('*')
      .limit(1);
    
    if (topicsError) {
      console.error('❌ Question topics table error:', topicsError);
      results.question_topics = { error: topicsError, columns: [] };
    } else {
      const columns = topics && topics.length > 0 ? Object.keys(topics[0]) : [];
      console.log('✅ Question topics columns:', columns);
      results.question_topics = { columns, sampleData: topics?.[0] };
    }

    // Discover questions table structure
    console.log('📋 Discovering questions table...');
    const { data: questions, error: questionsError } = await supabase
      .from(DB_TABLES.QUESTIONS)
      .select('*')
      .limit(1);
    
    if (questionsError) {
      console.error('❌ Questions table error:', questionsError);
      results.questions = { error: questionsError, columns: [] };
    } else {
      const columns = questions && questions.length > 0 ? Object.keys(questions[0]) : [];
      console.log('✅ Questions columns:', columns);
      results.questions = { columns, sampleData: questions?.[0] };
    }

    // Discover multiplayer_rooms table structure
    console.log('📋 Discovering multiplayer_rooms table...');
    const { data: rooms, error: roomsError } = await supabase
      .from(DB_TABLES.MULTIPLAYER_ROOMS)
      .select('*')
      .limit(1);
    
    if (roomsError) {
      console.error('❌ Multiplayer rooms table error:', roomsError);
      results.multiplayer_rooms = { error: roomsError, columns: [] };
    } else {
      const columns = rooms && rooms.length > 0 ? Object.keys(rooms[0]) : [];
      console.log('✅ Multiplayer rooms columns:', columns);
      results.multiplayer_rooms = { columns, sampleData: rooms?.[0] };
    }

    // Discover skills table structure
    console.log('📋 Discovering skills table...');
    const { data: skills, error: skillsError } = await supabase
      .from(DB_TABLES.SKILLS)
      .select('*')
      .limit(1);
    
    if (skillsError) {
      console.error('❌ Skills table error:', skillsError);
      results.skills = { error: skillsError, columns: [] };
    } else {
      const columns = skills && skills.length > 0 ? Object.keys(skills[0]) : [];
      console.log('✅ Skills columns:', columns);
      results.skills = { columns, sampleData: skills?.[0] };
    }

    console.log('🎯 Schema discovery complete!');
    console.log('Full results:', JSON.stringify(results, null, 2));
    
    return results;
  } catch (error) {
    console.error('Error in schema discovery:', error);
    return results;
  }
};

/**
 * Debug function to test database connectivity and schema compatibility
 */
export const debugDatabaseConnectivity = async () => {
  console.log('🔍 Starting database connectivity test...');
  
  try {
    // First, discover the actual schema
    const schemaResults = await discoverDatabaseSchema();
    
    // Test basic table access with discovered columns
    console.log('Testing categories table...');
    const { data: categories, error: categoriesError } = await supabase
      .from(DB_TABLES.CATEGORIES)
      .select('*')
      .limit(1);
    
    if (categoriesError) {
      console.error('❌ Categories table error:', categoriesError);
    } else {
      console.log('✅ Categories table accessible:', categories?.length || 0, 'records');
    }

    // Test question_topics table
    console.log('Testing question_topics table...');
    const { data: topics, error: topicsError } = await supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select('*')
      .limit(1);
    
    if (topicsError) {
      console.error('❌ Question topics table error:', topicsError);
    } else {
      console.log('✅ Question topics table accessible:', topics?.length || 0, 'records');
      if (topics && topics.length > 0) {
        console.log('Sample topic structure:', Object.keys(topics[0]));
      }
    }

    // Test questions table
    console.log('Testing questions table...');
    const { data: questions, error: questionsError } = await supabase
      .from(DB_TABLES.QUESTIONS)
      .select('*')
      .limit(1);
    
    if (questionsError) {
      console.error('❌ Questions table error:', questionsError);
    } else {
      console.log('✅ Questions table accessible:', questions?.length || 0, 'records');
    }

    // Test skills table
    console.log('Testing skills table...');
    const { data: skills, error: skillsError } = await supabase
      .from(DB_TABLES.SKILLS)
      .select('*')
      .limit(1);
    
    if (skillsError) {
      console.error('❌ Skills table error:', skillsError);
    } else {
      console.log('✅ Skills table accessible:', skills?.length || 0, 'records');
    }

    // Test multiplayer rooms table
    console.log('Testing multiplayer_rooms table...');
    const { data: rooms, error: roomsError } = await supabase
      .from(DB_TABLES.MULTIPLAYER_ROOMS)
      .select('*')
      .limit(1);
    
    if (roomsError) {
      console.error('❌ Multiplayer rooms table error:', roomsError);
    } else {
      console.log('✅ Multiplayer rooms table accessible:', rooms?.length || 0, 'records');
    }

    console.log('🎯 Database connectivity test complete!');
    
    return {
      success: true,
      schemaResults,
      categoriesAccessible: !categoriesError,
      topicsAccessible: !topicsError,
      questionsAccessible: !questionsError,
      skillsAccessible: !skillsError,
      roomsAccessible: !roomsError,
    };
  } catch (error) {
    console.error('Error in debugDatabaseConnectivity:', error);
    return {
      success: false,
      error: error,
    };
  }
};

/**
 * Get schema-safe categories (discovers and uses actual column names)
 */
export const getSchemaSafeCategories = async (): Promise<any[]> => {
  try {
    // Try the basic query first
    const { data, error } = await supabase
      .from(DB_TABLES.CATEGORIES)
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .limit(10);

    if (error) {
      console.error('Error fetching schema-safe categories:', error);
      // Try without ordering if display_order doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from(DB_TABLES.CATEGORIES)
        .select('*')
        .eq('is_active', true)
        .limit(10);
      
      if (fallbackError) {
        console.error('Fallback categories query also failed:', fallbackError);
        return [];
      }
      return fallbackData || [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSchemaSafeCategories:', error);
    return [];
  }
};

/**
 * Get schema-safe question topics (discovers and uses actual column names)
 */
export const getSchemaSafeQuestionTopics = async (categoryId?: string): Promise<any[]> => {
  try {
    console.log(`🎲 Fetching schema-safe question topics${categoryId ? ` for category ${categoryId}` : ''}`);
    
    // Start with basic query
    let query = supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select('*')
      .eq('is_active', true)
      .limit(10);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching schema-safe question topics:', error);
      console.error('Database error details:', {
        message: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code
      });
      return [];
    }

    console.log(`📚 Found ${(data || []).length} schema-safe question topics`);
    return data || [];
  } catch (error) {
    console.error('Error in getSchemaSafeQuestionTopics:', error);
    return [];
  }
};

/**
 * Get schema-safe multiplayer rooms (discovers and uses actual column names)
 */
export const getSchemaSafeMultiplayerRooms = async (): Promise<any[]> => {
  try {
    console.log('🎮 Fetching schema-safe multiplayer rooms...');
    
    // Start with basic query
    const { data, error } = await supabase
      .from(DB_TABLES.MULTIPLAYER_ROOMS)
      .select('*')
      .limit(10);

    if (error) {
      console.error('Error fetching schema-safe multiplayer rooms:', error);
      console.error('Database error details:', {
        message: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code
      });
      return [];
    }

    console.log(`🎮 Found ${(data || []).length} schema-safe multiplayer rooms`);
    return data || [];
  } catch (error) {
    console.error('Error in getSchemaSafeMultiplayerRooms:', error);
    return [];
  }
};

/**
 * Save quiz session progress to database
 */
export const saveProgressSession = async (progress: {
  session_id: string;
  current_question_index: number;
  answers: Record<number, string>;
  score: number;
  completed: boolean;
  questions?: any[]; // Add questions field to prevent null constraint error
  topic_id?: string | null;
  session_type?: string;
  user_id?: string | null;
  guest_token?: string | null;
}) => {
  try {
    // Ensure we have either user_id or guest_token (required by database constraint)
    if (!progress.user_id && !progress.guest_token) {
      console.warn('Progress session requires either user_id or guest_token, generating guest token');
      progress.guest_token = generateGuestToken();
    }

    // First try to check if the session exists
    const { data: existingSession, error: checkError } = await supabase
      .from(DB_TABLES.PROGRESS_SESSIONS)
      .select('session_id')
      .eq('session_id', progress.session_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.warn('Error checking existing progress session:', checkError);
      // Continue with upsert anyway
    }

    // Use upsert to handle both insert and update cases
    const { data, error } = await supabase
      .from(DB_TABLES.PROGRESS_SESSIONS)
      .upsert({
        session_id: progress.session_id,
        current_question_index: progress.current_question_index,
        answers: progress.answers,
        questions: Array.isArray(progress.questions) ? progress.questions : [], // Ensure questions is never null
        topic_id: progress.topic_id || null,
        session_type: progress.session_type || 'quiz',
        user_id: progress.user_id || null,
        guest_token: progress.guest_token || null,
        last_updated_at: new Date().toISOString(),
        metadata: {
          score: progress.score,
          completed: progress.completed
        }
      }, {
        onConflict: 'session_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving progress session:', error);
      // Don't fail the quiz if progress saving fails
      console.warn('Progress session save failed, continuing without saving progress');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in saveProgressSession:', error);
    // Don't fail the quiz if progress saving fails
    console.warn('Progress session save failed, continuing without saving progress');
    return null;
  }
};

/**
 * Get category ID by name or alias
 * Returns the category ID if found, null otherwise
 */
export const getCategoryIdByNameOrAlias = async (nameOrAlias: string): Promise<string | null> => {
  try {
    // First try to find by exact name match
    const { data: categories } = await supabase
      .from(DB_TABLES.CATEGORIES)
      .select('id')
      .eq(DB_COLUMNS.CATEGORIES.NAME, nameOrAlias)
      .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, true)
      .limit(1);

    if (categories?.[0]?.id) {
      return categories[0].id;
    }

    // If not found by name, try aliases
    const { data: synonyms } = await supabase
      .from(DB_TABLES.CATEGORY_SYNONYMS)
      .select('category_id')
      .eq(DB_COLUMNS.CATEGORY_SYNONYMS.ALIAS, nameOrAlias)
      .eq(DB_COLUMNS.CATEGORY_SYNONYMS.IS_ACTIVE, true)
      .limit(1);

    if (synonyms?.[0]?.category_id) {
      return synonyms[0].category_id;
    }

    return null;
  } catch (error) {
    console.error('Error in getCategoryIdByNameOrAlias:', error);
    return null;
  }
};

/**
 * Debug function to check topic-question relationships
 * This helps us understand how topics connect to questions
 */
export const debugTopicQuestionRelationships = async () => {
  console.log('🐛 Debug function temporarily disabled to avoid 500 errors');
  console.log('🐛 The questions_test table is causing issues, so debugging is skipped');
  return;
};

/**
 * Get recent question topics ordered by creation date
 */
export const getRecentQuestionTopics = async (limit: number = 10): Promise<DbQuestionTopic[]> => {
  try {
    console.log(`📚 Fetching ${limit} most recent question topics...`);
    
    const { data: topics, error } = await supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select(`
        *,
        topic_id,
        topic_title,
        description,
        categories,
        is_active,
        created_at,
        updated_at
      `)
      .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
      .not('date', 'is', null) // Only include topics with valid dates
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent question topics:', error);
      throw new Error(`Failed to fetch recent question topics: ${error.message}`);
    }

    if (!topics || topics.length === 0) {
      console.log('📚 No recent topics found');
      return [];
    }

    // Get question counts and category info for each topic
    const topicsWithDetails = await Promise.all(
      topics.map(async (topic) => {
        try {
          // Get question count for this topic
          const { count, error: countError } = await supabase
            .from(DB_TABLES.QUESTIONS)
            .select('*', { count: 'exact', head: true })
            .eq(DB_COLUMNS.QUESTIONS.TOPIC_ID, topic.topic_id)
            .eq(DB_COLUMNS.QUESTIONS.IS_ACTIVE, true);

          let questionCount = count || 0;

          // Fallback to questions_test if main table fails
          if (countError) {
            try {
              const { count: testCount } = await supabase
                .from(DB_TABLES.QUESTIONS_TEST)
                .select('*', { count: 'exact', head: true })
                .eq('topic_id', topic.topic_id)
                .eq('is_active', true);
              questionCount = testCount || 0;
            } catch (testError) {
              console.warn(`Failed to get question count for topic ${topic.topic_id}:`, testError);
            }
          }

          // Get primary category info if available
          let primaryCategory = null;
          if (topic.categories && Array.isArray(topic.categories) && topic.categories.length > 0) {
            try {
              const { data: categoryData } = await supabase
                .from(DB_TABLES.CATEGORIES)
                .select(`
                  ${DB_COLUMNS.CATEGORIES.ID},
                  ${DB_COLUMNS.CATEGORIES.NAME},
                  ${DB_COLUMNS.CATEGORIES.EMOJI},
                  ${DB_COLUMNS.CATEGORIES.DESCRIPTION}
                `)
                .eq(DB_COLUMNS.CATEGORIES.ID, topic.categories[0])
                .single();
              
              if (categoryData) {
                primaryCategory = categoryData;
              }
            } catch (categoryError) {
              console.warn(`Failed to get category for topic ${topic.topic_id}:`, categoryError);
            }
          }

          return {
            ...topic,
            title: topic.topic_title, // Ensure title field exists
            question_count: questionCount,
            category: primaryCategory,
          };
        } catch (error) {
          console.warn(`Error processing topic ${topic.topic_id}:`, error);
          return {
            ...topic,
            title: topic.topic_title,
            question_count: 0,
            category: null,
          };
        }
      })
    );

    console.log(`📚 Found ${topicsWithDetails.length} recent question topics`);
    return topicsWithDetails;
  } catch (error) {
    console.error('Error in getRecentQuestionTopics:', error);
    throw error;
  }
};

/**
 * Comprehensive diagnostic utility for category-topic relationship issues
 * This function identifies problems and provides automated fixes
 */
export const diagnoseCategoryTopicIssues = async (): Promise<{
  summary: string;
  issues: string[];
  fixes: string[];
  canAutoFix: boolean;
  data: {
    totalCategories: number;
    totalTopics: number;
    topicsWithCategories: number;
    junctionTableExists: boolean;
    junctionTableRecords: number;
    categoriesWithTopics: number;
    orphanedTopics: any[];
    topicsWithoutQuestions: any[];
  };
}> => {
  const result = {
    summary: '',
    issues: [] as string[],
    fixes: [] as string[],
    canAutoFix: false,
    data: {
      totalCategories: 0,
      totalTopics: 0,
      topicsWithCategories: 0,
      junctionTableExists: false,
      junctionTableRecords: 0,
      categoriesWithTopics: 0,
      orphanedTopics: [] as any[],
      topicsWithoutQuestions: [] as any[]
    }
  };

  try {
    console.log('🔍 Starting comprehensive category-topic relationship diagnosis...');

    // 1. Check basic data counts
    const { data: categories } = await supabase
      .from(DB_TABLES.CATEGORIES)
      .select('id, name')
      .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, true);

    const { data: topics } = await supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select('topic_id, topic_title, categories')
      .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true);

    result.data.totalCategories = categories?.length || 0;
    result.data.totalTopics = topics?.length || 0;

    // 2. Check junction table
    const junctionExists = await checkJunctionTableExists();
    result.data.junctionTableExists = junctionExists;

    if (junctionExists) {
      const { count } = await supabase
        .from('question_topic_categories')
        .select('*', { count: 'exact', head: true });
      result.data.junctionTableRecords = count || 0;
    }

    // 3. Check JSONB category assignments
    const topicsWithCategories = (topics || []).filter(topic => 
      topic.categories && Array.isArray(topic.categories) && topic.categories.length > 0
    );
    result.data.topicsWithCategories = topicsWithCategories.length;

    // 4. Find orphaned topics (topics without categories)
    const orphanedTopics = (topics || []).filter(topic => 
      !topic.categories || !Array.isArray(topic.categories) || topic.categories.length === 0
    );
    result.data.orphanedTopics = orphanedTopics.slice(0, 10); // Show first 10

         // 5. Check which categories actually have topics
     const categoriesWithTopics = (categories || []).filter(category => {
       return category?.id && (topicsWithCategories || []).some(topic => 
         topic?.categories && Array.isArray(topic.categories) && topic.categories.includes(category.id)
       );
     });
    result.data.categoriesWithTopics = categoriesWithTopics.length;

    // 6. Check for topics without questions
    const topicsWithoutQuestions = [];
    for (const topic of (topics || []).slice(0, 20)) { // Check first 20 topics
      const { count } = await supabase
        .from(DB_TABLES.QUESTIONS)
        .select('*', { count: 'exact', head: true })
        .eq(DB_COLUMNS.QUESTIONS.TOPIC_ID, topic.topic_id)
        .eq(DB_COLUMNS.QUESTIONS.IS_ACTIVE, true);
      
      if ((count || 0) === 0) {
        topicsWithoutQuestions.push({
          topic_id: topic.topic_id,
          topic_title: topic.topic_title
        });
      }
    }
    result.data.topicsWithoutQuestions = topicsWithoutQuestions;

    // Analyze issues
    if (result.data.totalCategories === 0) {
      result.issues.push('❌ No categories found');
    }

    if (result.data.totalTopics === 0) {
      result.issues.push('❌ No topics found');
    }

    if (result.data.topicsWithCategories === 0 && result.data.totalTopics > 0) {
      result.issues.push('🚨 CRITICAL: No topics have categories assigned in JSONB arrays');
      result.fixes.push('Run category assignment sync to fix JSONB arrays');
      result.canAutoFix = true;
    }

    if (!result.data.junctionTableExists) {
      result.issues.push('⚠️ Junction table question_topic_categories does not exist');
      result.fixes.push('Create junction table or use migration scripts');
    } else if (result.data.junctionTableRecords === 0 && result.data.totalTopics > 0) {
      result.issues.push('⚠️ Junction table exists but has no records');
      result.fixes.push('Run junction table sync to populate relationships');
      result.canAutoFix = true;
    }

    if (result.data.categoriesWithTopics < result.data.totalCategories * 0.5) {
      result.issues.push(`⚠️ Only ${result.data.categoriesWithTopics}/${result.data.totalCategories} categories have topics`);
    }

    if (orphanedTopics.length > 0) {
      result.issues.push(`⚠️ ${orphanedTopics.length} topics have no category assignments`);
      result.fixes.push('Review and assign categories to orphaned topics');
    }

    if (topicsWithoutQuestions.length > 0) {
      result.issues.push(`⚠️ ${topicsWithoutQuestions.length} topics have no questions`);
    }

    // Generate summary
    if (result.issues.length === 0) {
      result.summary = '✅ No category-topic relationship issues detected';
    } else {
      result.summary = `🔧 Found ${result.issues.length} issues with category-topic relationships`;
    }

    console.log('📊 Diagnosis complete:', result.summary);
    return result;

  } catch (error) {
    result.issues.push(`Error during diagnosis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.summary = '❌ Diagnosis failed';
    return result;
  }
};

/**
 * Automated repair utility for category-topic relationship issues
 */
export const repairCategoryTopicRelationships = async (): Promise<{
  success: boolean;
  message: string;
  actions: string[];
  results: any;
}> => {
  const result = {
    success: false,
    message: '',
    actions: [] as string[],
    results: {} as any
  };

  try {
    console.log('🔧 Starting automated repair of category-topic relationships...');

    // First, run diagnosis
    const diagnosis = await diagnoseCategoryTopicIssues();
    
    if (!diagnosis.canAutoFix) {
      result.message = 'No auto-fixable issues detected';
      return result;
    }

    const actions = [];

    // Fix 1: Sync junction table if it exists but is empty
    if (diagnosis.data.junctionTableExists && diagnosis.data.junctionTableRecords === 0) {
      console.log('🔄 Syncing junction table...');
      actions.push('Syncing junction table from JSONB arrays');
      
      // Import the sync function
      const { syncCategoriesToJunctionTable } = await import('./content-service');
      const syncResult = await syncCategoriesToJunctionTable();
      result.results.junctionSync = syncResult;
      
      console.log(`✅ Junction table sync: ${syncResult.synced}/${syncResult.processed} topics`);
    }

    // Fix 2: If JSONB arrays are empty but we have categorizable content, try to infer categories
    if (diagnosis.data.topicsWithCategories === 0 && diagnosis.data.totalTopics > 0) {
      console.log('🔄 Attempting to infer and assign categories...');
      actions.push('Inferring categories from topic content');
      
      const inferResult = await inferAndAssignCategories();
      result.results.categoryInference = inferResult;
    }

    result.actions = actions;
    result.success = actions.length > 0;
    result.message = result.success 
      ? `Completed ${actions.length} repair actions`
      : 'No repairs needed';

    return result;

  } catch (error) {
    result.message = `Repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    return result;
  }
};

/**
 * Attempt to infer categories for topics based on content analysis
 */
const inferAndAssignCategories = async (): Promise<{
  assigned: number;
  errors: string[];
}> => {
  const result = { assigned: 0, errors: [] as string[] };

  try {
    // Get categories and topics
    const { data: categories } = await supabase
      .from(DB_TABLES.CATEGORIES)
      .select('id, name, description')
      .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, true);

    const { data: topics } = await supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select('topic_id, topic_title, description, categories')
      .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
      .is('categories', null);

    if (!categories || !topics) return result;

    // Simple keyword-based category inference
    const categoryKeywords: Record<string, string[]> = {
      'Elections & Voting': ['election', 'vote', 'voting', 'ballot', 'campaign', 'candidate'],
      'Constitution & Law': ['constitution', 'law', 'legal', 'court', 'supreme', 'amendment'],
      'Congress & Senate': ['congress', 'senate', 'house', 'representative', 'bill', 'legislation'],
      'Executive Branch': ['president', 'executive', 'administration', 'cabinet', 'white house'],
      'Judicial Branch': ['court', 'judge', 'judicial', 'supreme court', 'ruling'],
      'State & Local Government': ['state', 'local', 'governor', 'mayor', 'city', 'county'],
      'Political Parties': ['republican', 'democrat', 'party', 'political party', 'partisan'],
      'Civil Rights': ['civil rights', 'rights', 'discrimination', 'equality', 'freedom'],
      'Economics & Policy': ['economy', 'economic', 'policy', 'budget', 'spending', 'tax'],
      'Foreign Relations': ['foreign', 'international', 'trade', 'diplomacy', 'war', 'defense']
    };

    for (const topic of topics) {
      const text = `${topic.topic_title} ${topic.description || ''}`.toLowerCase();
      
      // Find matching categories
      const matchingCategories = categories.filter(category => {
        const keywords = categoryKeywords[category.name] || [];
        return keywords.some(keyword => text.includes(keyword.toLowerCase()));
      });

      if (matchingCategories.length > 0) {
        // Assign the first matching category
        const categoryIds = matchingCategories.slice(0, 2).map(c => c.id); // Max 2 categories
        
        const { error } = await supabase
          .from(DB_TABLES.QUESTION_TOPICS)
          .update({ categories: categoryIds })
          .eq('topic_id', topic.topic_id);

        if (error) {
          result.errors.push(`Failed to assign category to ${topic.topic_title}: ${error.message}`);
        } else {
          result.assigned++;
          console.log(`✅ Assigned ${matchingCategories[0]?.name || 'Unknown'} to "${topic.topic_title}"`);
        }
      }
    }

    return result;
  } catch (error) {
    result.errors.push(`Category inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

// =============================================================================
// 🎯 SKILL PROGRESS & MASTERY TRACKING
// =============================================================================

/**
 * Get comprehensive user skill progress data
 */
export const getUserSkillProgress = async (userId: string, skillId?: string) => {
  try {
    let query = supabase
      .from(DB_TABLES.USER_SKILL_PROGRESS)
      .select(`
        *,
        skills:${DB_TABLES.SKILLS}(
          id,
          skill_name,
          description,
          difficulty_level,
          emoji,
          category_id
        )
      `)
      .eq(DB_COLUMNS.USER_SKILL_PROGRESS.USER_ID, userId);

    if (skillId) {
      query = query.eq(DB_COLUMNS.USER_SKILL_PROGRESS.SKILL_ID, skillId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user skill progress:', error);
      return skillId ? null : [];
    }

    return skillId ? (data && data.length > 0 ? data[0] : null) : (data || []);
  } catch (error) {
    console.error('Error in getUserSkillProgress:', error);
    return skillId ? null : [];
  }
};

/**
 * Get user's skill mastery tracking data
 */
export const getUserSkillMastery = async (userId: string, skillId?: string) => {
  try {
    let query = supabase
      .from(DB_TABLES.SKILL_MASTERY_TRACKING)
      .select(`
        *,
        skills:${DB_TABLES.SKILLS}(
          id,
          skill_name,
          description,
          difficulty_level,
          emoji
        )
      `)
      .eq(DB_COLUMNS.SKILL_MASTERY_TRACKING.USER_ID, userId);

    if (skillId) {
      query = query.eq(DB_COLUMNS.SKILL_MASTERY_TRACKING.SKILL_ID, skillId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user skill mastery:', error);
      return skillId ? null : [];
    }

    return skillId ? (data && data.length > 0 ? data[0] : null) : (data || []);
  } catch (error) {
    console.error('Error in getUserSkillMastery:', error);
    return skillId ? null : [];
  }
};

/**
 * Get skill learning objectives
 */
export const getSkillLearningObjectives = async (skillId: string) => {
  try {
    const { data, error } = await supabase
      .from(DB_TABLES.SKILL_LEARNING_OBJECTIVES)
      .select('*')
      .eq(DB_COLUMNS.SKILL_LEARNING_OBJECTIVES.SKILL_ID, skillId)
      .eq(DB_COLUMNS.SKILL_LEARNING_OBJECTIVES.IS_ACTIVE, true)
      .order(DB_COLUMNS.SKILL_LEARNING_OBJECTIVES.DISPLAY_ORDER);

    if (error) {
      console.error('Error fetching skill learning objectives:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSkillLearningObjectives:', error);
    return [];
  }
};

/**
 * Get skill practice recommendations
 */
export const getSkillPracticeRecommendations = async (skillId: string, difficultyLevel?: string) => {
  try {
    let query = supabase
      .from(DB_TABLES.SKILL_PRACTICE_RECOMMENDATIONS)
      .select('*')
      .eq(DB_COLUMNS.SKILL_PRACTICE_RECOMMENDATIONS.SKILL_ID, skillId)
      .order(DB_COLUMNS.SKILL_PRACTICE_RECOMMENDATIONS.ESTIMATED_MINUTES);

    if (difficultyLevel) {
      query = query.eq(DB_COLUMNS.SKILL_PRACTICE_RECOMMENDATIONS.DIFFICULTY_LEVEL, difficultyLevel);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching skill practice recommendations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSkillPracticeRecommendations:', error);
    return [];
  }
};

/**
 * Get skill prerequisites
 */
export const getSkillPrerequisites = async (skillId: string) => {
  try {
    const { data, error } = await supabase
      .from(DB_TABLES.SKILL_PREREQUISITES)
      .select(`
        *,
        prerequisite_skill:${DB_TABLES.SKILLS}!skill_prerequisites_prerequisite_skill_id_fkey(
          id,
          skill_name,
          description,
          difficulty_level,
          emoji
        )
      `)
      .eq(DB_COLUMNS.SKILL_PREREQUISITES.SKILL_ID, skillId);

    if (error) {
      console.error('Error fetching skill prerequisites:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSkillPrerequisites:', error);
    return [];
  }
};

/**
 * Get skill progression pathways
 */
export const getSkillProgressionPathways = async (difficultyLevel?: string) => {
  try {
    let query = supabase
      .from(DB_TABLES.SKILL_PROGRESSION_PATHWAYS)
      .select('*')
      .order(DB_COLUMNS.SKILL_PROGRESSION_PATHWAYS.ESTIMATED_HOURS);

    if (difficultyLevel) {
      query = query.eq(DB_COLUMNS.SKILL_PROGRESSION_PATHWAYS.DIFFICULTY_LEVEL, difficultyLevel);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching skill progression pathways:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSkillProgressionPathways:', error);
    return [];
  }
};

/**
 * Get user skill preferences
 */
export const getUserSkillPreferences = async (userId: string, skillId?: string) => {
  try {
    let query = supabase
      .from(DB_TABLES.USER_SKILL_PREFERENCES)
      .select(`
        *,
        skills:${DB_TABLES.SKILLS}(
          id,
          skill_name,
          description,
          difficulty_level,
          emoji
        )
      `)
      .eq(DB_COLUMNS.USER_SKILL_PREFERENCES.USER_ID, userId);

    if (skillId) {
      query = query.eq(DB_COLUMNS.USER_SKILL_PREFERENCES.SKILL_ID, skillId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user skill preferences:', error);
      return skillId ? null : [];
    }

    return skillId ? (data && data.length > 0 ? data[0] : null) : (data || []);
  } catch (error) {
    console.error('Error in getUserSkillPreferences:', error);
    return skillId ? null : [];
  }
};

/**
 * Get comprehensive skill data for detailed view
 */
export const getSkillDetailData = async (skillId: string, userId?: string) => {
  try {
    // Get basic skill information
    const { data: skill, error: skillError } = await supabase
      .from(DB_TABLES.SKILLS)
      .select('*')
      .eq(DB_COLUMNS.SKILLS.ID, skillId)
      .eq(DB_COLUMNS.SKILLS.IS_ACTIVE, true)
      .single();

    if (skillError || !skill) {
      console.error('Error fetching skill:', skillError);
      return null;
    }

    // Get learning objectives
    const learningObjectives = await getSkillLearningObjectives(skillId);

    // Get practice recommendations
    const practiceRecommendations = await getSkillPracticeRecommendations(skillId);

    // Get prerequisites
    const prerequisites = await getSkillPrerequisites(skillId);

    // Get progression pathways for this difficulty level
    const progressionPathways = await getSkillProgressionPathways(
      skill.difficulty_level ? skill.difficulty_level.toString() : undefined
    );

    let userProgress = null;
    let userMastery = null;
    let userPreferences = null;

    // Get user-specific data if userId provided
    if (userId) {
      userProgress = await getUserSkillProgress(userId, skillId);
      userMastery = await getUserSkillMastery(userId, skillId);
      userPreferences = await getUserSkillPreferences(userId, skillId);
    }

    return {
      skill,
      learningObjectives,
      practiceRecommendations,
      prerequisites,
      progressionPathways,
      userProgress,
      userMastery,
      userPreferences,
    };
  } catch (error) {
    console.error('Error in getSkillDetailData:', error);
    return null;
  }
};

/**
 * Get questions related to a specific skill
 */
export const getSkillRelatedQuestions = async (skillId: string, limit: number = 10) => {
  try {
    // First, get questions directly linked to the skill
    const { data: skillQuestions, error: skillQuestionsError } = await supabase
      .from(DB_TABLES.QUESTION_SKILLS)
      .select(`
        question_id,
        weight,
        is_primary_skill,
        questions:${DB_TABLES.QUESTIONS}(
          id,
          question,
          correct_answer,
          wrong_answers,
          difficulty_level,
          topic_id,
          question_topics:${DB_TABLES.QUESTION_TOPICS}(
            topic_id,
            topic_title,
            description
          )
        )
      `)
      .eq('skill_id', skillId)
      .eq('questions.is_active', true)
      .order('weight', { ascending: false })
      .limit(limit);

    if (skillQuestionsError) {
      console.error('Error fetching skill questions:', skillQuestionsError);
      return [];
    }

    return skillQuestions || [];
  } catch (error) {
    console.error('Error in getSkillRelatedQuestions:', error);
    return [];
  }
};

/**
 * Update user skill progress
 */
export const updateUserSkillProgress = async (
  userId: string,
  skillId: string,
  progressData: {
    questionsAttempted?: number;
    questionsCorrect?: number;
    averageTimePerQuestion?: number;
    confidenceLevel?: number;
    consecutiveCorrect?: number;
    improvementRate?: number;
  }
) => {
  try {
    const { data, error } = await supabase
      .from(DB_TABLES.USER_SKILL_PROGRESS)
      .upsert({
        user_id: userId,
        skill_id: skillId,
        questions_attempted: progressData.questionsAttempted,
        questions_correct: progressData.questionsCorrect,
        average_time_per_question: progressData.averageTimePerQuestion,
        confidence_level: progressData.confidenceLevel,
        consecutive_correct: progressData.consecutiveCorrect,
        improvement_rate: progressData.improvementRate,
        last_practiced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user skill progress:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUserSkillProgress:', error);
    return null;
  }
}; 