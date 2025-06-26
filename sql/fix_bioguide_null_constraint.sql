-- =====================================================================================
-- Quick Fix for bioguide_id NOT NULL constraint issues
-- This script cleans up null bioguide_id values before creating indexes
-- =====================================================================================

BEGIN;

-- Fix any null bioguide_id values in congressional_terms
UPDATE public.congressional_terms 
SET bioguide_id = 'UNKNOWN-' || substring(id::text from 1 for 8)
WHERE bioguide_id IS NULL OR bioguide_id = '';

-- Fix any null bioguide_id values in public_figures
UPDATE public.public_figures 
SET bioguide_id = NULL
WHERE bioguide_id = '' OR bioguide_id = 'null';

-- Remove duplicate bioguide_id entries before creating unique constraints
WITH duplicate_bioguides AS (
    SELECT bioguide_id, MIN(id) as keep_id
    FROM public.public_figures 
    WHERE bioguide_id IS NOT NULL AND bioguide_id != ''
    GROUP BY bioguide_id
    HAVING COUNT(*) > 1
)
DELETE FROM public.public_figures 
WHERE bioguide_id IN (SELECT bioguide_id FROM duplicate_bioguides)
AND id NOT IN (SELECT keep_id FROM duplicate_bioguides);

-- Remove duplicate congressional_terms entries
WITH duplicates AS (
    SELECT bioguide_id, congress_number, chamber, MIN(id) as keep_id
    FROM public.congressional_terms
    WHERE bioguide_id IS NOT NULL AND bioguide_id != ''
    GROUP BY bioguide_id, congress_number, chamber
    HAVING COUNT(*) > 1
)
DELETE FROM public.congressional_terms 
WHERE (bioguide_id, congress_number, chamber) IN (
    SELECT bioguide_id, congress_number, chamber FROM duplicates
)
AND id NOT IN (SELECT keep_id FROM duplicates);

-- Now we can safely add the NOT NULL constraint if needed
DO $$
BEGIN
    -- Check if bioguide_id column exists and if it's nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'congressional_terms' 
        AND column_name = 'bioguide_id' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.congressional_terms ALTER COLUMN bioguide_id SET NOT NULL;
        RAISE NOTICE 'Set bioguide_id column to NOT NULL in congressional_terms';
    ELSE
        RAISE NOTICE 'bioguide_id column is already NOT NULL or does not exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not set NOT NULL constraint: %', SQLERRM;
END $$;

COMMIT;

SELECT 'Bioguide ID cleanup completed' as status; 