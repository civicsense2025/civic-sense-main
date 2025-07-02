-- Fix RLS Policies for multiplayer_room_players
-- This migration fixes the RLS policies to allow proper guest access and prevent circular dependencies

BEGIN;

-- =============================================================================
-- DROP ALL EXISTING POLICIES ON MULTIPLAYER_ROOM_PLAYERS
-- =============================================================================

-- Drop all existing policies to start fresh and avoid circular dependencies
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'multiplayer_room_players' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.multiplayer_room_players', pol.policyname);
    END LOOP;
END $$;

-- =============================================================================
-- ENSURE RLS IS ENABLED
-- =============================================================================

ALTER TABLE public.multiplayer_room_players ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CREATE SIMPLE, NON-CIRCULAR RLS POLICIES
-- =============================================================================

-- Policy 1: Users can view their own player records (by user_id)
CREATE POLICY "users_can_view_own_player_records" ON public.multiplayer_room_players
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own player records (by user_id)
CREATE POLICY "users_can_insert_own_player_records" ON public.multiplayer_room_players
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own player records (by user_id)
CREATE POLICY "users_can_update_own_player_records" ON public.multiplayer_room_players
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policy 4: Users can delete their own player records (by user_id)
CREATE POLICY "users_can_delete_own_player_records" ON public.multiplayer_room_players
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Policy 5: Allow guest access for records with guest_token (no user_id required)
-- This is crucial for guest players who don't have auth.uid()
CREATE POLICY "guest_players_full_access" ON public.multiplayer_room_players
    FOR ALL 
    USING (
        user_id IS NULL AND 
        guest_token IS NOT NULL AND 
        guest_token != ''
    )
    WITH CHECK (
        user_id IS NULL AND 
        guest_token IS NOT NULL AND 
        guest_token != ''
    );

-- Policy 6: Allow service role full access (for server-side operations)
CREATE POLICY "service_role_full_access" ON public.multiplayer_room_players
    FOR ALL 
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- =============================================================================
-- GRANT NECESSARY PERMISSIONS
-- =============================================================================

-- Ensure anon role can access the table (for guest users)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_room_players TO anon;

-- Ensure authenticated role can access the table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_room_players TO authenticated;

-- =============================================================================
-- TEST THE POLICIES (OPTIONAL - FOR VERIFICATION)
-- =============================================================================

-- Create a test function to verify policies work
CREATE OR REPLACE FUNCTION test_multiplayer_room_players_rls()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_result TEXT := 'RLS Policies Test Results:' || chr(10);
BEGIN
    -- Test 1: Check if policies exist
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'multiplayer_room_players' 
        AND schemaname = 'public'
    ) THEN
        test_result := test_result || '✓ RLS policies exist' || chr(10);
    ELSE
        test_result := test_result || '✗ No RLS policies found' || chr(10);
    END IF;
    
    -- Test 2: Check if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'multiplayer_room_players' 
        AND schemaname = 'public' 
        AND rowsecurity = true
    ) THEN
        test_result := test_result || '✓ RLS is enabled' || chr(10);
    ELSE
        test_result := test_result || '✗ RLS is not enabled' || chr(10);
    END IF;
    
    -- Test 3: Count policies
    test_result := test_result || '📊 Total policies: ' || (
        SELECT COUNT(*) FROM pg_policies 
        WHERE tablename = 'multiplayer_room_players' 
        AND schemaname = 'public'
    )::TEXT || chr(10);
    
    RETURN test_result;
END;
$$;

-- Run the test (optional)
-- SELECT test_multiplayer_room_players_rls();

COMMIT; 