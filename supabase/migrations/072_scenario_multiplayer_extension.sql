-- =============================================================================
-- SCENARIO MULTIPLAYER EXTENSION - PHASE 3
-- =============================================================================
-- This migration extends existing multiplayer infrastructure to support
-- scenario gameplay with minimal changes to existing tables.

BEGIN;

-- =============================================================================
-- STEP 1: EXTEND EXISTING MULTIPLAYER TABLES
-- =============================================================================

-- Extend existing multiplayer_rooms table for scenario support
DO $$
BEGIN
    -- Add scenario support columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'multiplayer_rooms' 
        AND column_name = 'game_type' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE multiplayer_rooms 
        ADD COLUMN game_type VARCHAR(50) DEFAULT 'quiz';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'multiplayer_rooms' 
        AND column_name = 'scenario_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE multiplayer_rooms 
        ADD COLUMN scenario_id UUID REFERENCES scenarios(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'multiplayer_rooms' 
        AND column_name = 'scenario_settings' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE multiplayer_rooms 
        ADD COLUMN scenario_settings JSONB DEFAULT '{}';
    END IF;
    
    RAISE NOTICE 'Extended multiplayer_rooms table for scenario support';
END $$;

-- Extend existing multiplayer_room_players for character selection
DO $$
BEGIN
    -- Add character selection columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'multiplayer_room_players' 
        AND column_name = 'selected_character_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE multiplayer_room_players
        ADD COLUMN selected_character_id UUID REFERENCES scenario_characters(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'multiplayer_room_players' 
        AND column_name = 'character_resources' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE multiplayer_room_players
        ADD COLUMN character_resources JSONB DEFAULT '{}';
    END IF;
    
    RAISE NOTICE 'Extended multiplayer_room_players table for character support';
END $$;

-- =============================================================================
-- STEP 2: CREATE INDEXES FOR NEW COLUMNS
-- =============================================================================

-- Add indexes for scenario-related queries
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_game_type 
    ON multiplayer_rooms(game_type, room_status);

CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_scenario 
    ON multiplayer_rooms(scenario_id) 
    WHERE scenario_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_multiplayer_room_players_character 
    ON multiplayer_room_players(selected_character_id) 
    WHERE selected_character_id IS NOT NULL;

-- =============================================================================
-- STEP 3: CREATE SCENARIO-SPECIFIC MULTIPLAYER FUNCTIONS
-- =============================================================================

-- Function to create a scenario multiplayer room
CREATE OR REPLACE FUNCTION create_scenario_room(
    p_scenario_id UUID,
    p_host_user_id UUID,
    p_room_name TEXT DEFAULT NULL,
    p_max_players INTEGER DEFAULT 4,
    p_scenario_settings JSONB DEFAULT '{}'
) RETURNS TABLE (
    room_id UUID,
    room_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_room_id UUID;
    v_room_code TEXT;
    v_scenario_title TEXT;
BEGIN
    -- Get scenario title for default room name
    SELECT scenario_title INTO v_scenario_title
    FROM scenarios
    WHERE id = p_scenario_id AND is_active = true;
    
    IF v_scenario_title IS NULL THEN
        RAISE EXCEPTION 'Scenario not found or inactive';
    END IF;
    
    -- Generate unique room code
    v_room_code := generate_room_code();
    
    -- Create the room
    INSERT INTO multiplayer_rooms (
        room_code,
        host_user_id,
        room_name,
        max_players,
        game_type,
        scenario_id,
        scenario_settings,
        room_status
    ) VALUES (
        v_room_code,
        p_host_user_id,
        COALESCE(p_room_name, v_scenario_title || ' Scenario'),
        p_max_players,
        'scenario',
        p_scenario_id,
        p_scenario_settings,
        'waiting'
    ) RETURNING id INTO v_room_id;
    
    -- Add host as first player
    INSERT INTO multiplayer_room_players (
        room_id,
        user_id,
        player_name,
        is_host,
        is_ready,
        join_order
    ) VALUES (
        v_room_id,
        p_host_user_id,
        (SELECT COALESCE(display_name, email) FROM auth.users WHERE id = p_host_user_id),
        true,
        true,
        1
    );
    
    -- Return room info
    RETURN QUERY SELECT v_room_id, v_room_code;
END;
$$;

-- Function to join scenario room with character selection
CREATE OR REPLACE FUNCTION join_scenario_room(
    p_room_code TEXT,
    p_user_id UUID,
    p_player_name TEXT,
    p_character_id UUID DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    room_id UUID,
    player_id UUID,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_room_id UUID;
    v_player_id UUID;
    v_current_players INTEGER;
    v_max_players INTEGER;
    v_room_status TEXT;
    v_scenario_id UUID;
BEGIN
    -- Get room info
    SELECT id, current_players, max_players, room_status, scenario_id
    INTO v_room_id, v_current_players, v_max_players, v_room_status, v_scenario_id
    FROM multiplayer_rooms
    WHERE room_code = p_room_code;
    
    -- Validate room exists
    IF v_room_id IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 'Room not found';
        RETURN;
    END IF;
    
    -- Validate room status
    IF v_room_status != 'waiting' THEN
        RETURN QUERY SELECT false, v_room_id, NULL::UUID, 'Room is not accepting new players';
        RETURN;
    END IF;
    
    -- Validate room capacity
    IF v_current_players >= v_max_players THEN
        RETURN QUERY SELECT false, v_room_id, NULL::UUID, 'Room is full';
        RETURN;
    END IF;
    
    -- Validate character if provided
    IF p_character_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM scenario_characters sc
            JOIN scenarios s ON s.id = v_scenario_id
            WHERE sc.id = p_character_id
            AND (
                sc.usable_in_scenario_types IS NULL OR
                s.scenario_type = ANY(sc.usable_in_scenario_types)
            )
        ) THEN
            RETURN QUERY SELECT false, v_room_id, NULL::UUID, 'Invalid character for this scenario';
            RETURN;
        END IF;
        
        -- Check if character is already taken
        IF EXISTS (
            SELECT 1 FROM multiplayer_room_players
            WHERE room_id = v_room_id AND selected_character_id = p_character_id
        ) THEN
            RETURN QUERY SELECT false, v_room_id, NULL::UUID, 'Character already selected by another player';
            RETURN;
        END IF;
    END IF;
    
    -- Add player to room
    INSERT INTO multiplayer_room_players (
        room_id,
        user_id,
        player_name,
        selected_character_id,
        is_host,
        is_ready,
        join_order
    ) VALUES (
        v_room_id,
        p_user_id,
        p_player_name,
        p_character_id,
        false,
        false,
        v_current_players + 1
    ) RETURNING id INTO v_player_id;
    
    -- Update room player count
    UPDATE multiplayer_rooms
    SET current_players = current_players + 1
    WHERE id = v_room_id;
    
    RETURN QUERY SELECT true, v_room_id, v_player_id, 'Successfully joined room';
END;
$$;

-- Function to update player character selection
CREATE OR REPLACE FUNCTION update_player_character(
    p_room_id UUID,
    p_player_id UUID,
    p_character_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_scenario_id UUID;
BEGIN
    -- Get scenario ID
    SELECT scenario_id INTO v_scenario_id
    FROM multiplayer_rooms
    WHERE id = p_room_id;
    
    -- Validate character for scenario
    IF NOT EXISTS (
        SELECT 1 FROM scenario_characters sc
        JOIN scenarios s ON s.id = v_scenario_id
        WHERE sc.id = p_character_id
        AND (
            sc.usable_in_scenario_types IS NULL OR
            s.scenario_type = ANY(sc.usable_in_scenario_types)
        )
    ) THEN
        RETURN false;
    END IF;
    
    -- Check if character is available
    IF EXISTS (
        SELECT 1 FROM multiplayer_room_players
        WHERE room_id = p_room_id 
        AND selected_character_id = p_character_id 
        AND id != p_player_id
    ) THEN
        RETURN false;
    END IF;
    
    -- Update player character
    UPDATE multiplayer_room_players
    SET selected_character_id = p_character_id,
        character_resources = (
            SELECT starting_resources
            FROM scenario_characters
            WHERE id = p_character_id
        )
    WHERE id = p_player_id AND room_id = p_room_id;
    
    RETURN true;
END;
$$;

-- =============================================================================
-- STEP 4: CREATE SCENARIO ROOM MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to get available characters for a scenario
CREATE OR REPLACE FUNCTION get_scenario_characters(p_scenario_id UUID)
RETURNS TABLE (
    character_id UUID,
    character_name VARCHAR(100),
    character_title VARCHAR(150),
    character_type VARCHAR(50),
    starting_resources JSONB,
    is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_scenario_type VARCHAR(50);
BEGIN
    -- Get scenario type
    SELECT scenario_type INTO v_scenario_type
    FROM scenarios
    WHERE id = p_scenario_id;
    
    RETURN QUERY
    SELECT 
        sc.id,
        sc.character_name,
        sc.character_title,
        sc.character_type,
        sc.starting_resources,
        true as is_available
    FROM scenario_characters sc
    WHERE sc.usable_in_scenario_types IS NULL
       OR v_scenario_type = ANY(sc.usable_in_scenario_types)
    ORDER BY sc.character_name;
END;
$$;

-- Function to get scenario room status
CREATE OR REPLACE FUNCTION get_scenario_room_status(p_room_id UUID)
RETURNS TABLE (
    room_info JSONB,
    players JSONB,
    scenario_info JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Room info
        jsonb_build_object(
            'id', mr.id,
            'room_code', mr.room_code,
            'room_name', mr.room_name,
            'room_status', mr.room_status,
            'current_players', mr.current_players,
            'max_players', mr.max_players,
            'scenario_settings', mr.scenario_settings
        ),
        -- Players
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', mrp.id,
                    'player_name', mrp.player_name,
                    'player_emoji', mrp.player_emoji,
                    'is_host', mrp.is_host,
                    'is_ready', mrp.is_ready,
                    'selected_character', jsonb_build_object(
                        'id', sc.id,
                        'name', sc.character_name,
                        'title', sc.character_title,
                        'type', sc.character_type
                    ),
                    'character_resources', mrp.character_resources
                )
            )
            FROM multiplayer_room_players mrp
            LEFT JOIN scenario_characters sc ON sc.id = mrp.selected_character_id
            WHERE mrp.room_id = mr.id
        ),
        -- Scenario info
        jsonb_build_object(
            'id', s.id,
            'title', s.scenario_title,
            'description', s.description,
            'type', s.scenario_type,
            'difficulty_level', s.difficulty_level,
            'estimated_duration_minutes', s.estimated_duration_minutes,
            'learning_objectives', s.learning_objectives
        )
    FROM multiplayer_rooms mr
    JOIN scenarios s ON s.id = mr.scenario_id
    WHERE mr.id = p_room_id;
END;
$$;

-- =============================================================================
-- STEP 5: LOG COMPLETION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== SCENARIO MULTIPLAYER EXTENSION COMPLETED ===';
    RAISE NOTICE 'Extended existing multiplayer tables:';
    RAISE NOTICE '  - multiplayer_rooms (added game_type, scenario_id, scenario_settings)';
    RAISE NOTICE '  - multiplayer_room_players (added selected_character_id, character_resources)';
    RAISE NOTICE 'Created scenario multiplayer functions:';
    RAISE NOTICE '  - create_scenario_room()';
    RAISE NOTICE '  - join_scenario_room()';
    RAISE NOTICE '  - update_player_character()';
    RAISE NOTICE '  - get_scenario_characters()';
    RAISE NOTICE '  - get_scenario_room_status()';
    RAISE NOTICE 'Scenario multiplayer infrastructure ready!';
    RAISE NOTICE '===============================================';
END $$;

COMMIT; 