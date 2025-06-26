-- =====================================================================================
-- Test Script for Congressional Database Fixes
-- Run this AFTER applying the fix_congressional_sync_issues.sql migration
-- =====================================================================================

BEGIN;

-- Test 1: Verify all required columns exist
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    required_cols TEXT[] := ARRAY[
        'id', 'bioguide_id', 'full_name', 'slug', 'congress_member_type',
        'current_state', 'current_district', 'party_affiliation',
        'congressional_tenure_start', 'is_active', 'is_politician', 
        'office', 'current_positions', 'bio', 'created_at', 'updated_at'
    ];
    col TEXT;
BEGIN
    RAISE NOTICE '=== Test 1: Checking table structure ===';
    
    FOREACH col IN ARRAY required_cols LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'public_figures' 
            AND column_name = col
        ) THEN
            missing_columns := missing_columns || col;
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE 'FAIL: Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'PASS: All required columns exist';
    END IF;
END $$;

-- Test 2: Verify functions exist
DO $$
BEGIN
    RAISE NOTICE '=== Test 2: Checking functions ===';
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE NOTICE 'PASS: update_updated_at_column function exists';
    ELSE
        RAISE NOTICE 'FAIL: update_updated_at_column function missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_slug') THEN
        RAISE NOTICE 'PASS: generate_slug function exists';
    ELSE
        RAISE NOTICE 'FAIL: generate_slug function missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'upsert_congressional_member') THEN
        RAISE NOTICE 'PASS: upsert_congressional_member function exists';
    ELSE
        RAISE NOTICE 'FAIL: upsert_congressional_member function missing';
    END IF;
END $$;

-- Test 3: Verify triggers exist
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    RAISE NOTICE '=== Test 3: Checking triggers ===';
    
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE p.proname = 'update_updated_at_column'
    AND c.relname IN ('public_figures', 'congressional_terms')
    AND NOT t.tgisinternal;
    
    IF trigger_count >= 2 THEN
        RAISE NOTICE 'PASS: update_updated_at triggers exist (% found)', trigger_count;
    ELSE
        RAISE NOTICE 'FAIL: Expected at least 2 update_updated_at triggers, found %', trigger_count;
    END IF;
END $$;

-- Test 4: Test insert with correct columns
DO $$
DECLARE
    test_id UUID;
BEGIN
    RAISE NOTICE '=== Test 4: Testing insert operations ===';
    
    -- Test insert with correct columns only
    INSERT INTO public.public_figures (
        bioguide_id,
        full_name,
        display_name,
        slug,
        bio,
        congress_member_type,
        current_state,
        current_district,
        party_affiliation,
        congressional_tenure_start,
        office,
        current_positions,
        is_active,
        is_politician,
        category
    ) VALUES (
        'TEST001',
        'Test Congressional Member',
        'Test Member',
        'test-congressional-member-' || extract(epoch from now())::text,
        'Test biography for congressional member',
        'representative',
        'TX',
        1,
        'Test Party',
        '2023-01-03',
        'Test Office Building',
        ARRAY['Test Committee 1', 'Test Committee 2']::TEXT[],
        true,
        true,
        'politician'
    ) RETURNING id INTO test_id;
    
    IF test_id IS NOT NULL THEN
        RAISE NOTICE 'PASS: Insert successful with ID %', test_id;
        
        -- Clean up test data
        DELETE FROM public.public_figures WHERE id = test_id;
        RAISE NOTICE 'PASS: Test data cleaned up';
    ELSE
        RAISE NOTICE 'FAIL: Insert returned NULL';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FAIL: Insert failed with error: %', SQLERRM;
END $$;

-- Test 5: Test congressional_terms table
DO $$
DECLARE
    test_id UUID;
BEGIN
    RAISE NOTICE '=== Test 5: Testing congressional_terms table ===';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'congressional_terms') THEN
        RAISE NOTICE 'PASS: congressional_terms table exists';
        
        -- Test if bioguide_id column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'congressional_terms' 
            AND column_name = 'bioguide_id'
        ) THEN
            RAISE NOTICE 'PASS: bioguide_id column exists in congressional_terms';
        ELSE
            RAISE NOTICE 'FAIL: bioguide_id column missing from congressional_terms';
        END IF;
    ELSE
        RAISE NOTICE 'FAIL: congressional_terms table does not exist';
    END IF;
END $$;

-- Test 6: Test slug generation function
DO $$
DECLARE
    test_slug TEXT;
BEGIN
    RAISE NOTICE '=== Test 6: Testing slug generation ===';
    
    SELECT generate_slug('Test Congressional Member') INTO test_slug;
    
    IF test_slug = 'test-congressional-member' THEN
        RAISE NOTICE 'PASS: Slug generation works correctly: %', test_slug;
    ELSE
        RAISE NOTICE 'FAIL: Unexpected slug result: %', test_slug;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FAIL: Slug generation failed: %', SQLERRM;
END $$;

-- Test 7: Check for RLS policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '=== Test 7: Checking RLS policies ===';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename IN ('public_figures', 'congressional_terms')
    AND schemaname = 'public';
    
    IF policy_count > 0 THEN
        RAISE NOTICE 'PASS: Found % RLS policies', policy_count;
    ELSE
        RAISE NOTICE 'WARN: No RLS policies found (may be intentional)';
    END IF;
END $$;

ROLLBACK; -- Don't commit test data

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '=== Test Summary ===';
    RAISE NOTICE 'All tests completed. Check output above for any FAIL messages.';
    RAISE NOTICE 'If all tests show PASS, the congressional database fix is working correctly.';
END $$; 