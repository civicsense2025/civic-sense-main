-- Check Multiplayer Database State
-- Run this script to diagnose multiplayer issues

-- 1. Check if create_multiplayer_room function exists and its signature
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as returns,
    p.pronargs as arg_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'create_multiplayer_room';

-- 2. Check if there are multiple versions of the function
SELECT 
    COUNT(*) as function_versions,
    STRING_AGG(pg_get_function_arguments(p.oid), E'\n') as all_signatures
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'create_multiplayer_room'
GROUP BY p.proname;

-- 3. Check NPC personalities table
SELECT 
    COUNT(*) as total_npcs,
    COUNT(CASE WHEN is_active THEN 1 END) as active_npcs
FROM npc_personalities;

-- 4. List all active NPCs
SELECT 
    id,
    npc_code,
    display_name,
    emoji,
    base_skill_level,
    is_active
FROM npc_personalities
WHERE is_active = true
ORDER BY npc_code;

-- 5. Check for any recent multiplayer rooms
SELECT 
    id,
    room_code,
    room_status,
    host_user_id,
    created_at,
    expires_at
FROM multiplayer_rooms
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check for rooms without hosts (the original issue)
SELECT 
    r.id,
    r.room_code,
    r.host_user_id,
    COUNT(p.id) as player_count,
    COUNT(CASE WHEN p.is_host THEN 1 END) as host_count
FROM multiplayer_rooms r
LEFT JOIN multiplayer_room_players p ON r.id = p.room_id
WHERE r.room_status IN ('waiting', 'starting', 'in_progress')
GROUP BY r.id, r.room_code, r.host_user_id
HAVING COUNT(CASE WHEN p.is_host THEN 1 END) = 0;

-- 7. Test creating a room with the function
DO $$
DECLARE
    result RECORD;
BEGIN
    -- Try to create a test room
    SELECT * INTO result FROM create_multiplayer_room(
        p_topic_id := 'test-topic-123',
        p_host_user_id := NULL,
        p_host_guest_token := 'test-guest-token',
        p_room_name := 'Test Room',
        p_max_players := 4,
        p_game_mode := 'classic'
    );
    
    RAISE NOTICE 'Room created successfully: room_code=%, room_id=%', 
        result.room_code, result.id;
        
    -- Clean up the test room
    DELETE FROM multiplayer_room_players WHERE room_id = result.id;
    DELETE FROM multiplayer_rooms WHERE id = result.id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating room: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- 8. Check RLS policies on multiplayer tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual::text as policy_condition
FROM pg_policies
WHERE tablename IN ('multiplayer_rooms', 'multiplayer_room_players', 'npc_personalities')
ORDER BY tablename, policyname;

-- 9. Check if the function source code has ambiguous references
SELECT 
    p.proname,
    pg_get_functiondef(p.oid) as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'create_multiplayer_room'
LIMIT 1;

-- Summary
SELECT 
    'Database Check Complete' as status,
    NOW() as checked_at; 