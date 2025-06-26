-- =====================================================================================
-- Congressional Database Structure Verification Script
-- Run this after the fix_congressional_sync_issues.sql migration
-- =====================================================================================

-- Check if public_figures table exists and has all required columns
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    required_columns TEXT[] := ARRAY[
        'id', 'bioguide_id', 'first_name', 'last_name', 'full_name', 'slug',
        'congress_member_type', 'current_state', 'current_district', 
        'party_affiliation', 'congressional_tenure_start', 'is_active', 
        'is_politician', 'office', 'current_positions', 'created_at', 'updated_at'
    ];
    col TEXT;
    table_exists BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'public_figures'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'public_figures table does not exist!';
    END IF;
    
    RAISE NOTICE 'public_figures table exists ✓';
    
    -- Check each required column
    FOREACH col IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'public_figures' 
            AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Missing columns in public_figures: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'All required columns exist in public_figures ✓';
    END IF;
END $$;

-- Check congressional_terms table
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    required_columns TEXT[] := ARRAY[
        'id', 'member_id', 'bioguide_id', 'congress_number', 'chamber',
        'state_code', 'district', 'start_year', 'end_year', 'party_affiliation',
        'member_type', 'is_current', 'created_at', 'updated_at'
    ];
    col TEXT;
    table_exists BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'congressional_terms'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'congressional_terms table does not exist!';
    END IF;
    
    RAISE NOTICE 'congressional_terms table exists ✓';
    
    -- Check each required column
    FOREACH col IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'congressional_terms' 
            AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Missing columns in congressional_terms: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'All required columns exist in congressional_terms ✓';
    END IF;
END $$;

-- Check constraints
DO $$
BEGIN
    -- Check bioguide_id unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'public_figures' 
        AND constraint_name = 'public_figures_bioguide_id_key'
    ) THEN
        RAISE WARNING 'bioguide_id unique constraint missing on public_figures';
    ELSE
        RAISE NOTICE 'bioguide_id unique constraint exists ✓';
    END IF;
    
    -- Check congressional_terms unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'congressional_terms' 
        AND constraint_name = 'congressional_terms_bioguide_congress_chamber_key'
    ) THEN
        RAISE WARNING 'unique constraint missing on congressional_terms';
    ELSE
        RAISE NOTICE 'congressional_terms unique constraint exists ✓';
    END IF;
    
    -- Check foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'congressional_terms' 
        AND constraint_name = 'congressional_terms_member_id_fkey'
    ) THEN
        RAISE WARNING 'foreign key constraint missing on congressional_terms';
    ELSE
        RAISE NOTICE 'foreign key constraint exists ✓';
    END IF;
END $$;

-- Check indexes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'idx_public_figures_bioguide_id' 
        AND n.nspname = 'public'
    ) THEN
        RAISE WARNING 'bioguide_id index missing';
    ELSE
        RAISE NOTICE 'bioguide_id index exists ✓';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'idx_congressional_terms_bioguide' 
        AND n.nspname = 'public'
    ) THEN
        RAISE WARNING 'congressional_terms bioguide_id index missing';
    ELSE
        RAISE NOTICE 'congressional_terms bioguide_id index exists ✓';
    END IF;
END $$;

-- Check functions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE p.proname = 'upsert_congressional_member' 
        AND n.nspname = 'public'
    ) THEN
        RAISE WARNING 'upsert_congressional_member function missing';
    ELSE
        RAISE NOTICE 'upsert_congressional_member function exists ✓';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE p.proname = 'generate_slug' 
        AND n.nspname = 'public'
    ) THEN
        RAISE WARNING 'generate_slug function missing';
    ELSE
        RAISE NOTICE 'generate_slug function exists ✓';
    END IF;
END $$;

-- Check RLS policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'public_figures' 
        AND policyname = 'public_figures_service_all'
    ) THEN
        RAISE WARNING 'RLS policy missing on public_figures';
    ELSE
        RAISE NOTICE 'RLS policies exist on public_figures ✓';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'congressional_terms' 
        AND policyname = 'congressional_terms_service_all'
    ) THEN
        RAISE WARNING 'RLS policy missing on congressional_terms';
    ELSE
        RAISE NOTICE 'RLS policies exist on congressional_terms ✓';
    END IF;
END $$;

-- Summary check
DO $$
DECLARE
    public_figures_count INTEGER;
    congressional_terms_count INTEGER;
    figures_with_bioguide INTEGER;
BEGIN
    SELECT COUNT(*) INTO public_figures_count FROM public.public_figures;
    SELECT COUNT(*) INTO congressional_terms_count FROM public.congressional_terms;
    SELECT COUNT(*) INTO figures_with_bioguide FROM public.public_figures WHERE bioguide_id IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== DATABASE STRUCTURE VERIFICATION COMPLETE ===';
    RAISE NOTICE 'Current data counts:';
    RAISE NOTICE '  - Public figures: %', public_figures_count;
    RAISE NOTICE '  - Congressional terms: %', congressional_terms_count;
    RAISE NOTICE '  - Figures with bioguide_id: %', figures_with_bioguide;
    RAISE NOTICE '';
    RAISE NOTICE 'Database structure is ready for congressional sync! ✓';
END $$; 