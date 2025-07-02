-- =============================================================================
-- FIX MULTIPLAYER ROOMS SCHEMA
-- =============================================================================
-- This migration fixes the multiplayer_rooms table to match the expected interface
-- and adds missing columns that the frontend code is trying to access.

BEGIN;

-- =============================================================================
-- STEP 1: ADD MISSING COLUMNS
-- =============================================================================

-- Add alias column for status (frontend expects 'status' but table has 'room_status')
ALTER TABLE public.multiplayer_rooms 
ADD COLUMN IF NOT EXISTS status TEXT GENERATED ALWAYS AS (room_status) STORED;

-- Add host_display_name column to store the host's display name
ALTER TABLE public.multiplayer_rooms 
ADD COLUMN IF NOT EXISTS host_display_name TEXT;

-- =============================================================================
-- STEP 2: CREATE TRIGGER TO UPDATE HOST DISPLAY NAME
-- =============================================================================

-- Function to update host_display_name when a room is created or updated
CREATE OR REPLACE FUNCTION update_multiplayer_room_host_display_name()
RETURNS TRIGGER AS $$
DECLARE
    host_name TEXT;
BEGIN
    -- Only update if host_user_id is set and host_display_name is null
    IF NEW.host_user_id IS NOT NULL AND NEW.host_display_name IS NULL THEN
        -- Try to get the host's display name from profiles table
        SELECT COALESCE(
            full_name,
            display_name,
            email,
            'Unknown Host'
        ) INTO host_name
        FROM auth.users 
        WHERE id = NEW.host_user_id
        LIMIT 1;
        
        -- If no name found in auth.users, try the user_metadata
        IF host_name IS NULL OR host_name = '' THEN
            SELECT COALESCE(
                raw_user_meta_data->>'full_name',
                raw_user_meta_data->>'name',
                split_part(email, '@', 1),
                'Unknown Host'
            ) INTO host_name
            FROM auth.users 
            WHERE id = NEW.host_user_id
            LIMIT 1;
        END IF;
        
        -- Set the host display name
        NEW.host_display_name := COALESCE(host_name, 'Unknown Host');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set host_display_name
DROP TRIGGER IF EXISTS set_multiplayer_room_host_display_name ON public.multiplayer_rooms;
CREATE TRIGGER set_multiplayer_room_host_display_name
    BEFORE INSERT OR UPDATE ON public.multiplayer_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_multiplayer_room_host_display_name();

-- =============================================================================
-- STEP 3: UPDATE EXISTING ROWS
-- =============================================================================

-- Update existing rows to populate host_display_name
UPDATE public.multiplayer_rooms 
SET host_display_name = COALESCE(
    (SELECT COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name',
        split_part(email, '@', 1),
        'Unknown Host'
    ) FROM auth.users WHERE id = multiplayer_rooms.host_user_id),
    'Unknown Host'
)
WHERE host_user_id IS NOT NULL AND host_display_name IS NULL;

-- =============================================================================
-- STEP 4: CREATE VIEW FOR EASIER QUERYING
-- =============================================================================

-- Create a view that provides all the expected fields for the frontend
CREATE OR REPLACE VIEW public.multiplayer_rooms_view AS
SELECT 
    id,
    room_code,
    room_name,
    room_status as status,
    current_players,
    max_players,
    topic_id,
    host_user_id,
    host_display_name,
    game_mode,
    settings,
    expires_at,
    started_at,
    completed_at,
    created_at,
    updated_at
FROM public.multiplayer_rooms;

-- Grant access to the view
GRANT SELECT ON public.multiplayer_rooms_view TO anon, authenticated, service_role;

-- =============================================================================
-- STEP 5: CREATE FUNCTION FOR GETTING ACTIVE ROOMS
-- =============================================================================

-- Function to get active multiplayer rooms with proper filtering
CREATE OR REPLACE FUNCTION get_active_multiplayer_rooms(room_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    room_code TEXT,
    room_name TEXT,
    status TEXT,
    current_players INTEGER,
    max_players INTEGER,
    topic_id TEXT,
    host_user_id UUID,
    host_display_name TEXT,
    game_mode TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.room_code,
        r.room_name,
        r.room_status as status,
        r.current_players,
        r.max_players,
        r.topic_id,
        r.host_user_id,
        r.host_display_name,
        r.game_mode,
        r.created_at
    FROM public.multiplayer_rooms r
    WHERE r.room_status = 'waiting'
      AND (r.expires_at IS NULL OR r.expires_at > NOW())
      AND r.current_players < r.max_players
    ORDER BY r.created_at DESC
    LIMIT room_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_active_multiplayer_rooms(INTEGER) TO anon, authenticated, service_role;

-- =============================================================================
-- STEP 5B: CREATE MULTIPLAYER ROOM MANAGEMENT FUNCTIONS
-- =============================================================================

-- Drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT, UUID, TEXT, TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS join_multiplayer_room(TEXT, TEXT, UUID, TEXT, TEXT);

-- Function to create a multiplayer room
CREATE OR REPLACE FUNCTION create_multiplayer_room(
    p_topic_id TEXT,
    p_host_user_id UUID DEFAULT NULL,
    p_host_guest_token TEXT DEFAULT NULL,
    p_room_name TEXT DEFAULT NULL,
    p_max_players INTEGER DEFAULT 4,
    p_game_mode TEXT DEFAULT 'standard'
)
RETURNS TABLE (
    id UUID,
    room_code TEXT,
    room_name TEXT,
    topic_id TEXT,
    host_user_id UUID,
    host_display_name TEXT,
    max_players INTEGER,
    current_players INTEGER,
    room_status TEXT,
    game_mode TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    new_room_code TEXT;
    new_room_id UUID;
    host_name TEXT := 'Unknown Host';
BEGIN
    -- Generate unique room code
    SELECT generate_room_code() INTO new_room_code;
    
    -- Get host display name if user_id provided
    IF p_host_user_id IS NOT NULL THEN
        SELECT COALESCE(
            raw_user_meta_data->>'full_name',
            raw_user_meta_data->>'name',
            split_part(email, '@', 1),
            'Unknown Host'
        ) INTO host_name
        FROM auth.users 
        WHERE id = p_host_user_id
        LIMIT 1;
    END IF;
    
    -- Insert the new room
    INSERT INTO public.multiplayer_rooms (
        room_code,
        topic_id,
        host_user_id,
        room_name,
        host_display_name,
        max_players,
        current_players,
        room_status,
        game_mode,
        expires_at
    ) VALUES (
        new_room_code,
        p_topic_id,
        p_host_user_id,
        COALESCE(p_room_name, 'Quiz Room'),
        host_name,
        p_max_players,
        0,
        'waiting',
        p_game_mode,
        NOW() + INTERVAL '2 hours' -- Room expires in 2 hours
    ) RETURNING multiplayer_rooms.id INTO new_room_id;
    
    -- Return the created room data
    RETURN QUERY
    SELECT 
        r.id,
        r.room_code,
        r.room_name,
        r.topic_id,
        r.host_user_id,
        r.host_display_name,
        r.max_players,
        r.current_players,
        r.room_status,
        r.game_mode,
        r.created_at
    FROM public.multiplayer_rooms r
    WHERE r.id = new_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join a multiplayer room
CREATE OR REPLACE FUNCTION join_multiplayer_room(
    p_room_code TEXT,
    p_player_name TEXT,
    p_user_id UUID DEFAULT NULL,
    p_guest_token TEXT DEFAULT NULL,
    p_player_emoji TEXT DEFAULT '😊'
)
RETURNS TABLE (
    success BOOLEAN,
    error TEXT,
    room_id UUID,
    player_id UUID,
    room_data JSONB
) AS $$
DECLARE
    target_room_id UUID;
    room_current_players INTEGER;
    room_max_players INTEGER;
    room_status TEXT;
    new_player_id UUID;
    join_order_number INTEGER;
BEGIN
    -- Find the room and check if it's joinable
    SELECT 
        r.id, 
        r.current_players, 
        r.max_players, 
        r.room_status
    INTO 
        target_room_id, 
        room_current_players, 
        room_max_players, 
        room_status
    FROM public.multiplayer_rooms r
    WHERE r.room_code = UPPER(p_room_code)
    AND (r.expires_at IS NULL OR r.expires_at > NOW());
    
    -- Check if room exists
    IF target_room_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Room not found or expired'::TEXT, NULL::UUID, NULL::UUID, NULL::JSONB;
        RETURN;
    END IF;
    
    -- Check if room is waiting for players
    IF room_status != 'waiting' THEN
        RETURN QUERY SELECT FALSE, 'Room is not accepting new players'::TEXT, target_room_id, NULL::UUID, NULL::JSONB;
        RETURN;
    END IF;
    
    -- Check if room is full
    IF room_current_players >= room_max_players THEN
        RETURN QUERY SELECT FALSE, 'Room is full'::TEXT, target_room_id, NULL::UUID, NULL::JSONB;
        RETURN;
    END IF;
    
    -- Check if user is already in the room
    IF p_user_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.multiplayer_room_players 
            WHERE room_id = target_room_id AND user_id = p_user_id
        ) THEN
            RETURN QUERY SELECT FALSE, 'You are already in this room'::TEXT, target_room_id, NULL::UUID, NULL::JSONB;
            RETURN;
        END IF;
    END IF;
    
    -- Get the next join order
    SELECT COALESCE(MAX(join_order), 0) + 1 INTO join_order_number
    FROM public.multiplayer_room_players
    WHERE room_id = target_room_id;
    
    -- Add the player to the room
    INSERT INTO public.multiplayer_room_players (
        room_id,
        user_id,
        guest_token,
        player_name,
        player_emoji,
        is_host,
        is_ready,
        is_connected,
        join_order
    ) VALUES (
        target_room_id,
        p_user_id,
        p_guest_token,
        p_player_name,
        p_player_emoji,
        FALSE, -- Only the creator is host
        FALSE,
        TRUE,
        join_order_number
    ) RETURNING id INTO new_player_id;
    
    -- Update room player count
    UPDATE public.multiplayer_rooms 
    SET 
        current_players = current_players + 1,
        updated_at = NOW()
    WHERE id = target_room_id;
    
    -- Return success with room data
    RETURN QUERY 
    SELECT 
        TRUE as success,
        NULL::TEXT as error,
        target_room_id as room_id,
        new_player_id as player_id,
        jsonb_build_object(
            'room_code', p_room_code,
            'room_id', target_room_id,
            'player_id', new_player_id,
            'players', room_current_players + 1
        ) as room_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_multiplayer_room(TEXT, UUID, TEXT, TEXT, INTEGER, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION join_multiplayer_room(TEXT, TEXT, UUID, TEXT, TEXT) TO anon, authenticated, service_role;

-- =============================================================================
-- STEP 6: UPDATE INDEXES
-- =============================================================================

-- Add index on the new status column for faster filtering
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_status_computed 
ON public.multiplayer_rooms(room_status) 
WHERE room_status = 'waiting';

-- Add composite index for active room queries
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_active_query 
ON public.multiplayer_rooms(room_status, current_players, max_players, created_at) 
WHERE room_status = 'waiting';

-- =============================================================================
-- STEP 7: LOG COMPLETION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== MULTIPLAYER ROOMS SCHEMA FIX COMPLETED ===';
    RAISE NOTICE 'Added missing columns:';
    RAISE NOTICE '  - status (computed from room_status)';
    RAISE NOTICE '  - host_display_name (populated from auth.users)';
    RAISE NOTICE 'Created view: multiplayer_rooms_view';
    RAISE NOTICE 'Created function: get_active_multiplayer_rooms()';
    RAISE NOTICE 'Updated existing rows with host display names';
    RAISE NOTICE 'Added performance indexes';
    RAISE NOTICE '==============================================';
END $$;

COMMIT; 