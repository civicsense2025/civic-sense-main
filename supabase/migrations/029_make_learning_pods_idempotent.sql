-- ============================================
-- Make Learning Pods Migration Idempotent
-- ============================================
-- This migration ensures all learning pods functions and grants are idempotent

-- Ensure all functions are created with CREATE OR REPLACE (already done in migrations)
-- Ensure all grants are idempotent by using IF NOT EXISTS patterns

-- Check and grant permissions idempotently
DO $$ 
BEGIN
    -- Grant permissions for learning pods functions if not already granted
    PERFORM 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'is_content_appropriate_for_user' 
    AND grantee = 'authenticated' 
    AND privilege_type = 'EXECUTE';
    
    IF NOT FOUND THEN
        GRANT EXECUTE ON FUNCTION is_content_appropriate_for_user TO authenticated;
        RAISE NOTICE 'Granted execute permission on is_content_appropriate_for_user to authenticated';
    END IF;
    
    PERFORM 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'get_user_pod_memberships' 
    AND grantee = 'authenticated' 
    AND privilege_type = 'EXECUTE';
    
    IF NOT FOUND THEN
        GRANT EXECUTE ON FUNCTION get_user_pod_memberships TO authenticated;
        RAISE NOTICE 'Granted execute permission on get_user_pod_memberships to authenticated';
    END IF;
    
    PERFORM 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'create_learning_pod' 
    AND grantee = 'authenticated' 
    AND privilege_type = 'EXECUTE';
    
    IF NOT FOUND THEN
        GRANT EXECUTE ON FUNCTION create_learning_pod TO authenticated;
        RAISE NOTICE 'Granted execute permission on create_learning_pod to authenticated';
    END IF;
    
    -- Check for pod discovery and analytics functions
    PERFORM 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'get_pod_analytics' 
    AND grantee = 'authenticated' 
    AND privilege_type = 'EXECUTE';
    
    IF NOT FOUND THEN
        GRANT EXECUTE ON FUNCTION get_pod_analytics TO authenticated;
        RAISE NOTICE 'Granted execute permission on get_pod_analytics to authenticated';
    END IF;
    
    PERFORM 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'can_join_pod_via_invite' 
    AND grantee = 'authenticated' 
    AND privilege_type = 'EXECUTE';
    
    IF NOT FOUND THEN
        GRANT EXECUTE ON FUNCTION can_join_pod_via_invite TO authenticated;
        RAISE NOTICE 'Granted execute permission on can_join_pod_via_invite to authenticated';
    END IF;
    
    PERFORM 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'join_pod_via_invite' 
    AND grantee = 'authenticated' 
    AND privilege_type = 'EXECUTE';
    
    IF NOT FOUND THEN
        GRANT EXECUTE ON FUNCTION join_pod_via_invite TO authenticated;
        RAISE NOTICE 'Granted execute permission on join_pod_via_invite to authenticated';
    END IF;
    
    RAISE NOTICE 'Learning pods system permissions verified and updated as needed';
END $$;

-- Note: The main learning pods migrations (021, 022, 023) should ideally use:
-- CREATE TABLE IF NOT EXISTS for all tables
-- CREATE OR REPLACE FUNCTION for all functions (already done)
-- Idempotent INSERT statements with ON CONFLICT DO NOTHING (already done in 023)
-- 
-- The fix migration (028) handles RLS policies with proper idempotent checks
-- This migration (029) ensures function permissions are idempotent 