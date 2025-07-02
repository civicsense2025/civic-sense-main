-- ============================================================================
-- CivicSense Collections Items Schema Patch - Fix NOT NULL Constraints
-- Makes title and description nullable since we use override fields
-- ============================================================================

BEGIN;

-- ============================================================================
-- MAKE TITLE AND DESCRIPTION NULLABLE IN COLLECTION_ITEMS
-- ============================================================================

-- Remove NOT NULL constraint from title column
DO $$
BEGIN
    -- Check if title column has NOT NULL constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collection_items' 
        AND column_name = 'title' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.collection_items 
        ALTER COLUMN title DROP NOT NULL;
        
        RAISE NOTICE 'Removed NOT NULL constraint from collection_items.title';
    ELSE
        RAISE NOTICE 'collection_items.title is already nullable';
    END IF;
END $$;

-- Remove NOT NULL constraint from description column
DO $$
BEGIN
    -- Check if description column has NOT NULL constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collection_items' 
        AND column_name = 'description' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.collection_items 
        ALTER COLUMN description DROP NOT NULL;
        
        RAISE NOTICE 'Removed NOT NULL constraint from collection_items.description';
    ELSE
        RAISE NOTICE 'collection_items.description is already nullable';
    END IF;
END $$;

-- ============================================================================
-- ADD COMPUTED COLUMNS FOR EFFECTIVE TITLE AND DESCRIPTION
-- ============================================================================

-- Create a view that shows the effective title and description
-- (uses override if available, falls back to original)
DROP VIEW IF EXISTS collection_items_with_effective_content;

CREATE VIEW collection_items_with_effective_content AS
SELECT 
    ci.*,
    COALESCE(ci.title_override, ci.title) as effective_title,
    COALESCE(ci.description_override, ci.description) as effective_description
FROM collection_items ci;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the constraints have been removed
DO $$
DECLARE
    title_nullable BOOLEAN;
    description_nullable BOOLEAN;
BEGIN
    -- Check title column nullability
    SELECT is_nullable = 'YES' INTO title_nullable
    FROM information_schema.columns 
    WHERE table_name = 'collection_items' 
    AND column_name = 'title';
    
    -- Check description column nullability  
    SELECT is_nullable = 'YES' INTO description_nullable
    FROM information_schema.columns 
    WHERE table_name = 'collection_items' 
    AND column_name = 'description';
    
    IF title_nullable AND description_nullable THEN
        RAISE NOTICE '✅ SUCCESS: Both title and description columns are now nullable';
    ELSE
        RAISE NOTICE '❌ ISSUE: title nullable=%, description nullable=%', title_nullable, description_nullable;
    END IF;
END $$;

COMMIT; 