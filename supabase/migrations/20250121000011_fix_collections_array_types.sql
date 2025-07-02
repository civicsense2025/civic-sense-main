-- ============================================================================
-- CivicSense Collections Schema Patch - Fix Array Column Types
-- Converts JSONB columns to proper PostgreSQL text[] arrays
-- Handles existing views by temporarily dropping and recreating them
-- ============================================================================

BEGIN;

-- ============================================================================
-- SAVE VIEW DEFINITIONS BEFORE DROPPING
-- ============================================================================

-- Store view definitions so we can recreate them after column changes
DO $$
DECLARE
    course_structure_def text;
    published_collections_def text;
BEGIN
    -- Get course_structure view definition if it exists
    SELECT pg_get_viewdef('course_structure'::regclass, true) INTO course_structure_def;
    
    -- Store in a temporary table for later use
    CREATE TEMP TABLE IF NOT EXISTS temp_view_definitions (
        view_name text PRIMARY KEY,
        definition text
    );
    
    INSERT INTO temp_view_definitions (view_name, definition) 
    VALUES ('course_structure', course_structure_def)
    ON CONFLICT (view_name) DO UPDATE SET definition = EXCLUDED.definition;
    
    RAISE NOTICE 'Saved course_structure view definition';
    
EXCEPTION 
    WHEN undefined_table THEN
        RAISE NOTICE 'course_structure view does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not save course_structure view: %', SQLERRM;
END $$;

DO $$
DECLARE
    published_collections_def text;
BEGIN
    -- Get published_collections view definition if it exists
    SELECT pg_get_viewdef('published_collections'::regclass, true) INTO published_collections_def;
    
    -- Store in temporary table
    INSERT INTO temp_view_definitions (view_name, definition) 
    VALUES ('published_collections', published_collections_def)
    ON CONFLICT (view_name) DO UPDATE SET definition = EXCLUDED.definition;
    
    RAISE NOTICE 'Saved published_collections view definition';
    
EXCEPTION 
    WHEN undefined_table THEN
        RAISE NOTICE 'published_collections view does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not save published_collections view: %', SQLERRM;
END $$;

-- ============================================================================
-- DROP DEPENDENT VIEWS TEMPORARILY
-- ============================================================================

DROP VIEW IF EXISTS course_structure CASCADE;
DROP VIEW IF EXISTS published_collections CASCADE;

RAISE NOTICE 'Temporarily dropped dependent views';

-- ============================================================================
-- HELPER FUNCTION TO CONVERT JSONB ARRAY TO TEXT ARRAY
-- ============================================================================

-- Create a temporary function to convert JSONB arrays to TEXT arrays
CREATE OR REPLACE FUNCTION jsonb_array_to_text_array(jsonb_val jsonb)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT ARRAY(
        SELECT jsonb_array_elements_text(jsonb_val)
    );
$$;

-- ============================================================================
-- CONVERT JSONB COLUMNS TO TEXT[] ARRAYS
-- ============================================================================

-- Fix learning_objectives column type
DO $$
BEGIN
    -- Check if column exists and is JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'learning_objectives'
        AND data_type = 'jsonb'
    ) THEN
        -- Convert existing JSONB data to TEXT[] using our helper function
        ALTER TABLE public.collections 
        ALTER COLUMN learning_objectives 
        TYPE TEXT[] 
        USING CASE 
            WHEN learning_objectives IS NULL THEN NULL
            WHEN jsonb_typeof(learning_objectives) = 'array' THEN jsonb_array_to_text_array(learning_objectives)
            ELSE ARRAY[learning_objectives::text]
        END;
        
        RAISE NOTICE 'Converted learning_objectives from JSONB to TEXT[]';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'learning_objectives'
    ) THEN
        -- Create as text array if it doesn't exist
        ALTER TABLE public.collections ADD COLUMN learning_objectives TEXT[] DEFAULT NULL;
        RAISE NOTICE 'Added learning_objectives as TEXT[]';
    ELSE
        RAISE NOTICE 'learning_objectives already exists as TEXT[]';
    END IF;
END $$;

-- Fix action_items column type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'action_items'
        AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE public.collections 
        ALTER COLUMN action_items 
        TYPE TEXT[] 
        USING CASE 
            WHEN action_items IS NULL THEN NULL
            WHEN jsonb_typeof(action_items) = 'array' THEN jsonb_array_to_text_array(action_items)
            ELSE ARRAY[action_items::text]
        END;
        
        RAISE NOTICE 'Converted action_items from JSONB to TEXT[]';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'action_items'
    ) THEN
        ALTER TABLE public.collections ADD COLUMN action_items TEXT[] DEFAULT NULL;
        RAISE NOTICE 'Added action_items as TEXT[]';
    ELSE
        RAISE NOTICE 'action_items already exists as TEXT[]';
    END IF;
END $$;

-- Fix categories column type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'categories'
        AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE public.collections 
        ALTER COLUMN categories 
        TYPE TEXT[] 
        USING CASE 
            WHEN categories IS NULL THEN NULL
            WHEN jsonb_typeof(categories) = 'array' THEN jsonb_array_to_text_array(categories)
            ELSE ARRAY[categories::text]
        END;
        
        RAISE NOTICE 'Converted categories from JSONB to TEXT[]';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'categories'
    ) THEN
        ALTER TABLE public.collections ADD COLUMN categories TEXT[] DEFAULT NULL;
        RAISE NOTICE 'Added categories as TEXT[]';
    ELSE
        RAISE NOTICE 'categories already exists as TEXT[]';
    END IF;
END $$;

-- Fix tags column type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'tags'
        AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE public.collections 
        ALTER COLUMN tags 
        TYPE TEXT[] 
        USING CASE 
            WHEN tags IS NULL THEN NULL
            WHEN jsonb_typeof(tags) = 'array' THEN jsonb_array_to_text_array(tags)
            ELSE ARRAY[tags::text]
        END;
        
        RAISE NOTICE 'Converted tags from JSONB to TEXT[]';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.collections ADD COLUMN tags TEXT[] DEFAULT NULL;
        RAISE NOTICE 'Added tags as TEXT[]';
    ELSE
        RAISE NOTICE 'tags already exists as TEXT[]';
    END IF;
END $$;

-- ============================================================================
-- CLEAN UP HELPER FUNCTION
-- ============================================================================

-- Drop the temporary helper function
DROP FUNCTION IF EXISTS jsonb_array_to_text_array(jsonb);

-- ============================================================================
-- RECREATE VIEWS WITH NEW COLUMN TYPES
-- ============================================================================

DO $$
DECLARE
    view_def text;
BEGIN
    -- Recreate course_structure view if it existed
    SELECT definition INTO view_def 
    FROM temp_view_definitions 
    WHERE view_name = 'course_structure';
    
    IF view_def IS NOT NULL THEN
        EXECUTE 'CREATE VIEW course_structure AS ' || view_def;
        RAISE NOTICE 'Recreated course_structure view';
    ELSE
        RAISE NOTICE 'course_structure view was not found, skipping recreation';
    END IF;
    
EXCEPTION 
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to recreate course_structure view: %', SQLERRM;
        RAISE NOTICE 'You may need to manually recreate the course_structure view';
END $$;

DO $$
DECLARE
    view_def text;
BEGIN
    -- Recreate published_collections view if it existed
    SELECT definition INTO view_def 
    FROM temp_view_definitions 
    WHERE view_name = 'published_collections';
    
    IF view_def IS NOT NULL THEN
        EXECUTE 'CREATE VIEW published_collections AS ' || view_def;
        RAISE NOTICE 'Recreated published_collections view';
    ELSE
        RAISE NOTICE 'published_collections view was not found, skipping recreation';
    END IF;
    
EXCEPTION 
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to recreate published_collections view: %', SQLERRM;
        RAISE NOTICE 'You may need to manually recreate the published_collections view';
END $$;

-- ============================================================================
-- VERIFY COLUMN TYPES ARE CORRECT
-- ============================================================================

-- Check that all columns are now proper array types
DO $$
DECLARE
    col_info RECORD;
    error_count INTEGER := 0;
BEGIN
    -- Check learning_objectives
    SELECT data_type, udt_name INTO col_info
    FROM information_schema.columns 
    WHERE table_name = 'collections' AND column_name = 'learning_objectives';
    
    IF col_info.udt_name != '_text' THEN
        RAISE WARNING 'learning_objectives column is not text[] array type: % (udt: %)', col_info.data_type, col_info.udt_name;
        error_count := error_count + 1;
    END IF;
    
    -- Check action_items
    SELECT data_type, udt_name INTO col_info
    FROM information_schema.columns 
    WHERE table_name = 'collections' AND column_name = 'action_items';
    
    IF col_info.udt_name != '_text' THEN
        RAISE WARNING 'action_items column is not text[] array type: % (udt: %)', col_info.data_type, col_info.udt_name;
        error_count := error_count + 1;
    END IF;
    
    -- Check categories
    SELECT data_type, udt_name INTO col_info
    FROM information_schema.columns 
    WHERE table_name = 'collections' AND column_name = 'categories';
    
    IF col_info.udt_name != '_text' THEN
        RAISE WARNING 'categories column is not text[] array type: % (udt: %)', col_info.data_type, col_info.udt_name;
        error_count := error_count + 1;
    END IF;
    
    -- Check tags
    SELECT data_type, udt_name INTO col_info
    FROM information_schema.columns 
    WHERE table_name = 'collections' AND column_name = 'tags';
    
    IF col_info.udt_name != '_text' THEN
        RAISE WARNING 'tags column is not text[] array type: % (udt: %)', col_info.data_type, col_info.udt_name;
        error_count := error_count + 1;
    END IF;
    
    IF error_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All array columns verified as TEXT[] type';
    ELSE
        RAISE NOTICE 'PARTIAL SUCCESS: % columns still need conversion', error_count;
    END IF;
END $$;

-- ============================================================================
-- ADD INDEXES FOR ARRAY COLUMNS (OPTIONAL)
-- ============================================================================

-- Create GIN indexes for array columns to enable efficient array operations
CREATE INDEX IF NOT EXISTS idx_collections_learning_objectives_gin 
ON public.collections USING GIN (learning_objectives);

CREATE INDEX IF NOT EXISTS idx_collections_action_items_gin 
ON public.collections USING GIN (action_items);

CREATE INDEX IF NOT EXISTS idx_collections_categories_gin 
ON public.collections USING GIN (categories);

CREATE INDEX IF NOT EXISTS idx_collections_tags_gin 
ON public.collections USING GIN (tags);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify the schema changes
SELECT 
    column_name,
    data_type,
    udt_name as underlying_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'collections' 
AND column_name IN ('learning_objectives', 'action_items', 'categories', 'tags')
ORDER BY column_name;

-- Test that views still work (if they were recreated)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'course_structure') THEN
        RAISE NOTICE 'Testing course_structure view...';
        PERFORM COUNT(*) FROM course_structure LIMIT 1;
        RAISE NOTICE 'course_structure view works correctly';
    ELSE
        RAISE NOTICE 'course_structure view does not exist (may need manual recreation)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'published_collections') THEN
        RAISE NOTICE 'Testing published_collections view...';
        PERFORM COUNT(*) FROM published_collections LIMIT 1;
        RAISE NOTICE 'published_collections view works correctly';
    ELSE
        RAISE NOTICE 'published_collections view does not exist (may need manual recreation)';
    END IF;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE WARNING 'View testing failed: %', SQLERRM;
END $$; 