-- =============================================================================
-- DIAGNOSE ACTUAL SCHEMA BEFORE CREATING POLICIES
-- Check what tables and columns actually exist
-- =============================================================================

BEGIN;

-- Create a temporary function to help us understand the schema
CREATE OR REPLACE FUNCTION get_table_info()
RETURNS TABLE(
    table_name text,
    column_name text,
    data_type text,
    is_nullable text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::text
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public'
    AND t.table_name IN (
        'progress_sessions',
        'user_quiz_attempts', 
        'user_progress',
        'user_assessment_attempts',
        'progress_question_responses',
        'bookmarks',
        'bookmark_collections',
        'bookmark_snippets',
        'bookmark_tags',
        'user_events',
        'calendar_sync_logs',
        'user_onboarding_state',
        'user_category_preferences',
        'user_skill_preferences',
        'user_platform_preferences',
        'user_email_preferences'
    )
    ORDER BY t.table_name, c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Show the actual schema for key tables
SELECT * FROM get_table_info();

-- Check what guest-related columns actually exist across all tables
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
    column_name ILIKE '%guest%' OR
    column_name ILIKE '%token%' OR
    column_name ILIKE '%session%'
)
ORDER BY table_name, column_name;

-- Check existing policies on key tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN (
    'progress_sessions',
    'user_quiz_attempts',
    'user_progress', 
    'user_assessment_attempts',
    'bookmarks'
)
ORDER BY tablename, policyname;

-- Clean up
DROP FUNCTION get_table_info();

ROLLBACK; -- Don't actually change anything, just diagnose 