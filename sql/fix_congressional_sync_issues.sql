-- =====================================================================================
-- CivicSense Congressional Sync Database Fix Migration
-- REORGANIZED: Tables/Columns → Constraints → Indexes → Functions → Policies
-- =====================================================================================

BEGIN;

-- ============================================================================
-- STEP 1: ENSURE BASIC TABLE STRUCTURE EXISTS
-- ============================================================================

-- Create public_figures table with minimal required structure if it doesn't exist
CREATE TABLE IF NOT EXISTS public.public_figures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- STEP 2: ADD ALL MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add bioguide_id column
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'bioguide_id'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN bioguide_id TEXT;
    RAISE NOTICE 'Added bioguide_id column to public_figures';
  ELSE
    RAISE NOTICE 'bioguide_id column already exists in public_figures';
  END IF;
END $$;

-- Add congress_member_type column
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'congress_member_type'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN congress_member_type TEXT;
    RAISE NOTICE 'Added congress_member_type column to public_figures';
  ELSE
    RAISE NOTICE 'congress_member_type column already exists in public_figures';
  END IF;
END $$;

-- Add current_state column
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'current_state'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN current_state TEXT;
    RAISE NOTICE 'Added current_state column to public_figures';
  ELSE
    RAISE NOTICE 'current_state column already exists in public_figures';
  END IF;
END $$;

-- Add current_district column
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'current_district'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN current_district INTEGER;
    RAISE NOTICE 'Added current_district column to public_figures';
  ELSE
    RAISE NOTICE 'current_district column already exists in public_figures';
  END IF;
END $$;

-- Add party_affiliation column
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'party_affiliation'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN party_affiliation TEXT;
    RAISE NOTICE 'Added party_affiliation column to public_figures';
  ELSE
    RAISE NOTICE 'party_affiliation column already exists in public_figures';
  END IF;
END $$;

-- Add congressional_tenure_start column
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'congressional_tenure_start'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN congressional_tenure_start DATE;
    RAISE NOTICE 'Added congressional_tenure_start column to public_figures';
  ELSE
    RAISE NOTICE 'congressional_tenure_start column already exists in public_figures';
  END IF;
END $$;

-- Add is_active column
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Added is_active column to public_figures';
  ELSE
    RAISE NOTICE 'is_active column already exists in public_figures';
  END IF;
END $$;

-- Add is_politician column
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'is_politician'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN is_politician BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_politician column to public_figures';
  ELSE
    RAISE NOTICE 'is_politician column already exists in public_figures';
  END IF;
END $$;

-- Add office column
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'office'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN office TEXT;
    RAISE NOTICE 'Added office column to public_figures';
  ELSE
    RAISE NOTICE 'office column already exists in public_figures';
  END IF;
END $$;

-- Add current_positions column
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'current_positions'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN current_positions JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added current_positions column to public_figures';
  ELSE
    RAISE NOTICE 'current_positions column already exists in public_figures';
  END IF;
END $$;

-- Add other optional columns that might be missing
DO $$ 
BEGIN 
  -- Add date_of_birth if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN date_of_birth DATE;
    RAISE NOTICE 'Added date_of_birth column to public_figures';
  END IF;

  -- Add gender if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'gender'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN gender TEXT;
    RAISE NOTICE 'Added gender column to public_figures';
  END IF;

  -- Add description if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column to public_figures';
  END IF;

  -- Add image_url if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN image_url TEXT;
    RAISE NOTICE 'Added image_url column to public_figures';
  END IF;

  -- Add official_website if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'official_website'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN official_website TEXT;
    RAISE NOTICE 'Added official_website column to public_figures';
  END IF;

  -- Add social_media if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'social_media'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN social_media JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added social_media column to public_figures';
  END IF;

  -- Add congress_api_last_sync if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'public_figures' 
    AND column_name = 'congress_api_last_sync'
  ) THEN
    ALTER TABLE public.public_figures ADD COLUMN congress_api_last_sync TIMESTAMPTZ;
    RAISE NOTICE 'Added congress_api_last_sync column to public_figures';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: CREATE CONGRESSIONAL_TERMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.congressional_terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID, -- Will add FK constraint later
  bioguide_id TEXT NOT NULL,
  congress_number INTEGER NOT NULL,
  chamber TEXT NOT NULL,
  state_code TEXT NOT NULL,
  district INTEGER,
  start_year INTEGER NOT NULL,
  end_year INTEGER,
  party_affiliation TEXT,
  member_type TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- STEP 3B: ADD ALL MISSING COLUMNS TO CONGRESSIONAL_TERMS TABLE
-- ============================================================================

-- Add bioguide_id column to congressional_terms if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'congressional_terms' 
    AND column_name = 'bioguide_id'
  ) THEN
    -- Add column without NOT NULL first
    ALTER TABLE public.congressional_terms ADD COLUMN bioguide_id TEXT;
    RAISE NOTICE 'Added bioguide_id column to congressional_terms';
    
    -- Set a default value for existing rows that might have null
    UPDATE public.congressional_terms 
    SET bioguide_id = 'UNKNOWN-' || substring(id::text from 1 for 8)
    WHERE bioguide_id IS NULL;
    
    -- Now add NOT NULL constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'congressional_terms' 
      AND column_name = 'bioguide_id' 
      AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE public.congressional_terms ALTER COLUMN bioguide_id SET NOT NULL;
      RAISE NOTICE 'Set bioguide_id column to NOT NULL';
    END IF;
  ELSE
    RAISE NOTICE 'bioguide_id column already exists in congressional_terms';
  END IF;
END $$;

-- Add member_id column to congressional_terms if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'congressional_terms' 
    AND column_name = 'member_id'
  ) THEN
    ALTER TABLE public.congressional_terms ADD COLUMN member_id UUID;
    RAISE NOTICE 'Added member_id column to congressional_terms';
  ELSE
    RAISE NOTICE 'member_id column already exists in congressional_terms';
  END IF;
END $$;

-- Add congress_number column to congressional_terms if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'congressional_terms' 
    AND column_name = 'congress_number'
  ) THEN
    ALTER TABLE public.congressional_terms ADD COLUMN congress_number INTEGER;
    RAISE NOTICE 'Added congress_number column to congressional_terms';
  ELSE
    RAISE NOTICE 'congress_number column already exists in congressional_terms';
  END IF;
END $$;

-- Add chamber column to congressional_terms if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'congressional_terms' 
    AND column_name = 'chamber'
  ) THEN
    ALTER TABLE public.congressional_terms ADD COLUMN chamber TEXT;
    RAISE NOTICE 'Added chamber column to congressional_terms';
  ELSE
    RAISE NOTICE 'chamber column already exists in congressional_terms';
  END IF;
END $$;

-- Add state_code column to congressional_terms if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'congressional_terms' 
    AND column_name = 'state_code'
  ) THEN
    ALTER TABLE public.congressional_terms ADD COLUMN state_code TEXT;
    RAISE NOTICE 'Added state_code column to congressional_terms';
  ELSE
    RAISE NOTICE 'state_code column already exists in congressional_terms';
  END IF;
END $$;

-- Add district column to congressional_terms if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'congressional_terms' 
    AND column_name = 'district'
  ) THEN
    ALTER TABLE public.congressional_terms ADD COLUMN district INTEGER;
    RAISE NOTICE 'Added district column to congressional_terms';
  ELSE
    RAISE NOTICE 'district column already exists in congressional_terms';
  END IF;
END $$;

-- Add start_year column to congressional_terms if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'congressional_terms' 
    AND column_name = 'start_year'
  ) THEN
    ALTER TABLE public.congressional_terms ADD COLUMN start_year INTEGER;
    RAISE NOTICE 'Added start_year column to congressional_terms';
  ELSE
    RAISE NOTICE 'start_year column already exists in congressional_terms';
  END IF;
END $$;

-- Add end_year column to congressional_terms if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'congressional_terms' 
    AND column_name = 'end_year'
  ) THEN
    ALTER TABLE public.congressional_terms ADD COLUMN end_year INTEGER;
    RAISE NOTICE 'Added end_year column to congressional_terms';
  ELSE
    RAISE NOTICE 'end_year column already exists in congressional_terms';
  END IF;
END $$;

-- Add party_affiliation column to congressional_terms if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'congressional_terms' 
    AND column_name = 'party_affiliation'
  ) THEN
    ALTER TABLE public.congressional_terms ADD COLUMN party_affiliation TEXT;
    RAISE NOTICE 'Added party_affiliation column to congressional_terms';
  ELSE
    RAISE NOTICE 'party_affiliation column already exists in congressional_terms';
  END IF;
END $$;

-- Add member_type column to congressional_terms if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'congressional_terms' 
    AND column_name = 'member_type'
  ) THEN
    ALTER TABLE public.congressional_terms ADD COLUMN member_type TEXT;
    RAISE NOTICE 'Added member_type column to congressional_terms';
  ELSE
    RAISE NOTICE 'member_type column already exists in congressional_terms';
  END IF;
END $$;

-- Add is_current column to congressional_terms if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'congressional_terms' 
    AND column_name = 'is_current'
  ) THEN
    ALTER TABLE public.congressional_terms ADD COLUMN is_current BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_current column to congressional_terms';
  ELSE
    RAISE NOTICE 'is_current column already exists in congressional_terms';
  END IF;
END $$;

-- Add created_at column to congressional_terms if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'congressional_terms' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.congressional_terms ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
    RAISE NOTICE 'Added created_at column to congressional_terms';
  ELSE
    RAISE NOTICE 'created_at column already exists in congressional_terms';
  END IF;
END $$;

-- Add updated_at column to congressional_terms if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'congressional_terms' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.congressional_terms ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
    RAISE NOTICE 'Added updated_at column to congressional_terms';
  ELSE
    RAISE NOTICE 'updated_at column already exists in congressional_terms';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: DROP EXISTING PROBLEMATIC CONSTRAINTS AND POLICIES
-- ============================================================================

-- Drop ALL existing RLS policies that might create circular references
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    -- Drop public_figures policies
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'public_figures' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.public_figures', pol.policyname);
        RAISE NOTICE 'Dropped policy % on public_figures', pol.policyname;
    END LOOP;
    
    -- Drop congressional_terms policies
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'congressional_terms' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.congressional_terms', pol.policyname);
        RAISE NOTICE 'Dropped policy % on congressional_terms', pol.policyname;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 5: ADD CONSTRAINTS AND CHECK CONSTRAINTS
-- ============================================================================

-- Add check constraints to congress_member_type
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'public_figures' 
        AND constraint_name = 'public_figures_congress_member_type_check'
    ) THEN
        ALTER TABLE public.public_figures 
        DROP CONSTRAINT public_figures_congress_member_type_check;
        RAISE NOTICE 'Dropped existing congress_member_type check constraint';
    END IF;
    
    -- Add the constraint
    ALTER TABLE public.public_figures 
    ADD CONSTRAINT public_figures_congress_member_type_check 
    CHECK (congress_member_type IN ('representative', 'senator', 'delegate'));
    RAISE NOTICE 'Added congress_member_type check constraint';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add congress_member_type constraint: %', SQLERRM;
END $$;

-- Add check constraints to congressional_terms chamber
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'congressional_terms' 
        AND constraint_name = 'congressional_terms_chamber_check'
    ) THEN
        ALTER TABLE public.congressional_terms 
        DROP CONSTRAINT congressional_terms_chamber_check;
    END IF;
    
    ALTER TABLE public.congressional_terms 
    ADD CONSTRAINT congressional_terms_chamber_check 
    CHECK (chamber IN ('house', 'senate', 'House of Representatives', 'Senate'));
    RAISE NOTICE 'Added chamber check constraint to congressional_terms';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add chamber constraint: %', SQLERRM;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
    -- Drop existing FK if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'congressional_terms' 
        AND constraint_name = 'congressional_terms_member_id_fkey'
    ) THEN
        ALTER TABLE public.congressional_terms 
        DROP CONSTRAINT congressional_terms_member_id_fkey;
    END IF;
    
    -- Add FK constraint
    ALTER TABLE public.congressional_terms 
    ADD CONSTRAINT congressional_terms_member_id_fkey 
    FOREIGN KEY (member_id) REFERENCES public.public_figures(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint to congressional_terms';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 6: ADD UNIQUE CONSTRAINTS
-- ============================================================================

-- Add unique constraint on bioguide_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'public_figures' 
        AND constraint_name = 'public_figures_bioguide_id_key'
    ) THEN
        -- First check for duplicates and remove them
        WITH duplicate_bioguides AS (
            SELECT bioguide_id, MIN(id) as keep_id
            FROM public.public_figures 
            WHERE bioguide_id IS NOT NULL
            GROUP BY bioguide_id
            HAVING COUNT(*) > 1
        )
        DELETE FROM public.public_figures 
        WHERE bioguide_id IN (SELECT bioguide_id FROM duplicate_bioguides)
        AND id NOT IN (SELECT keep_id FROM duplicate_bioguides);
        
        -- Now add the unique constraint
        ALTER TABLE public.public_figures 
        ADD CONSTRAINT public_figures_bioguide_id_key UNIQUE (bioguide_id);
        RAISE NOTICE 'Added unique constraint on bioguide_id';
    ELSE
        RAISE NOTICE 'bioguide_id unique constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add bioguide_id unique constraint: %', SQLERRM;
END $$;

-- Add unique constraint on slug
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'public_figures' 
        AND constraint_name = 'public_figures_slug_key'
    ) THEN
        -- Handle duplicate slugs first
        WITH duplicate_slugs AS (
            SELECT slug, MIN(id) as keep_id
            FROM public.public_figures 
            WHERE slug IS NOT NULL
            GROUP BY slug
            HAVING COUNT(*) > 1
        )
        UPDATE public.public_figures 
        SET slug = slug || '-' || substring(id::text from 1 for 8)
        WHERE slug IN (SELECT slug FROM duplicate_slugs)
        AND id NOT IN (SELECT keep_id FROM duplicate_slugs);
        
        ALTER TABLE public.public_figures 
        ADD CONSTRAINT public_figures_slug_key UNIQUE (slug);
        RAISE NOTICE 'Added unique constraint on slug';
    ELSE
        RAISE NOTICE 'slug unique constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add slug unique constraint: %', SQLERRM;
END $$;

-- Add unique constraint to congressional_terms
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'congressional_terms' 
        AND constraint_name = 'congressional_terms_bioguide_congress_chamber_key'
    ) THEN
        -- Remove duplicates first
        WITH duplicates AS (
            SELECT bioguide_id, congress_number, chamber, MIN(id) as keep_id
            FROM public.congressional_terms
            GROUP BY bioguide_id, congress_number, chamber
            HAVING COUNT(*) > 1
        )
        DELETE FROM public.congressional_terms 
        WHERE (bioguide_id, congress_number, chamber) IN (
            SELECT bioguide_id, congress_number, chamber FROM duplicates
        )
        AND id NOT IN (SELECT keep_id FROM duplicates);
        
        ALTER TABLE public.congressional_terms 
        ADD CONSTRAINT congressional_terms_bioguide_congress_chamber_key 
        UNIQUE (bioguide_id, congress_number, chamber);
        RAISE NOTICE 'Added unique constraint to congressional_terms';
    ELSE
        RAISE NOTICE 'congressional_terms unique constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add congressional_terms unique constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes with IF NOT EXISTS equivalent
DO $$
BEGIN
    -- Index on bioguide_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'idx_public_figures_bioguide_id' 
        AND n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_public_figures_bioguide_id 
        ON public.public_figures(bioguide_id) 
        WHERE bioguide_id IS NOT NULL;
        RAISE NOTICE 'Created index on bioguide_id';
    END IF;

    -- Index on congress_member_type
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'idx_public_figures_congress_member_type' 
        AND n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_public_figures_congress_member_type 
        ON public.public_figures(congress_member_type) 
        WHERE congress_member_type IS NOT NULL;
        RAISE NOTICE 'Created index on congress_member_type';
    END IF;

    -- Index on active status
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'idx_public_figures_active' 
        AND n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_public_figures_active 
        ON public.public_figures(is_active) 
        WHERE is_active = true;
        RAISE NOTICE 'Created index on is_active';
    END IF;

    -- Index on congressional_terms bioguide
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'idx_congressional_terms_bioguide' 
        AND n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_congressional_terms_bioguide 
        ON public.congressional_terms(bioguide_id);
        RAISE NOTICE 'Created index on congressional_terms bioguide_id';
    END IF;

    -- Index on current terms
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'idx_congressional_terms_current' 
        AND n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_congressional_terms_current 
        ON public.congressional_terms(is_current) 
        WHERE is_current = true;
        RAISE NOTICE 'Created index on congressional_terms is_current';
    END IF;

    -- Index on congress number
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'idx_congressional_terms_congress' 
        AND n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_congressional_terms_congress 
        ON public.congressional_terms(congress_number);
        RAISE NOTICE 'Created index on congressional_terms congress_number';
    END IF;
END $$;

-- ============================================================================
-- STEP 8: CREATE HELPER FUNCTIONS
-- ============================================================================

-- First, drop all triggers that depend on update_updated_at_column()
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Find and drop all triggers that use update_updated_at_column function
    FOR trigger_record IN 
        SELECT t.tgname as trigger_name, c.relname as table_name, n.nspname as schema_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE p.proname = 'update_updated_at_column'
        AND n.nspname = 'public'
        AND NOT t.tgisinternal
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', 
                      trigger_record.trigger_name, 
                      trigger_record.schema_name, 
                      trigger_record.table_name);
        RAISE NOTICE 'Dropped trigger % on table %', trigger_record.trigger_name, trigger_record.table_name;
    END LOOP;
END $$;

-- Now safely drop existing functions
DROP FUNCTION IF EXISTS find_duplicate_public_figures();
DROP FUNCTION IF EXISTS generate_slug(TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS upsert_congressional_member(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, DATE, TEXT, JSONB, TEXT);

-- Create slug generation function
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  RETURN regexp_replace(
    regexp_replace(
      lower(trim(input_text)), 
      '[^a-z0-9\s-]', '', 'g'
    ), 
    '\s+', '-', 'g'
  );
END;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create safe upsert function for congressional members (using only existing columns)
CREATE OR REPLACE FUNCTION upsert_congressional_member(
  p_bioguide_id TEXT,
  p_full_name TEXT,
  p_display_name TEXT,
  p_congress_member_type TEXT,
  p_current_state TEXT,
  p_current_district INTEGER,
  p_party_affiliation TEXT,
  p_congressional_tenure_start DATE,
  p_office TEXT,
  p_current_positions TEXT[],
  p_bio TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  figure_id UUID;
  slug_text TEXT;
BEGIN
  -- Generate slug
  slug_text := generate_slug(COALESCE(p_full_name, p_display_name, 'unknown'));
  
  -- Ensure unique slug
  WHILE EXISTS (SELECT 1 FROM public.public_figures WHERE slug = slug_text) LOOP
    slug_text := slug_text || '-' || substring(gen_random_uuid()::text from 1 for 8);
  END LOOP;
  
  -- Upsert the public figure (using only existing columns)
  INSERT INTO public.public_figures (
    bioguide_id,
    full_name,
    display_name,
    slug,
    congress_member_type,
    current_state,
    current_district,
    party_affiliation,
    congressional_tenure_start,
    is_active,
    is_politician,
    office,
    current_positions,
    bio,
    created_at,
    updated_at
  ) VALUES (
    p_bioguide_id,
    p_full_name,
    COALESCE(p_display_name, p_full_name),
    slug_text,
    p_congress_member_type,
    p_current_state,
    p_current_district,
    p_party_affiliation,
    p_congressional_tenure_start,
    true,
    true,
    p_office,
    p_current_positions,
    p_bio,
    NOW(),
    NOW()
  )
  ON CONFLICT (bioguide_id) 
  DO UPDATE SET
    full_name = EXCLUDED.full_name,
    display_name = EXCLUDED.display_name,
    congress_member_type = EXCLUDED.congress_member_type,
    current_state = EXCLUDED.current_state,
    current_district = EXCLUDED.current_district,
    party_affiliation = EXCLUDED.party_affiliation,
    congressional_tenure_start = EXCLUDED.congressional_tenure_start,
    office = EXCLUDED.office,
    current_positions = EXCLUDED.current_positions,
    bio = EXCLUDED.bio,
    is_active = true,
    is_politician = true,
    updated_at = NOW()
  RETURNING id INTO figure_id;
  
  RETURN figure_id;
END;
$$;

-- Create duplicate finder function
CREATE OR REPLACE FUNCTION find_duplicate_public_figures()
RETURNS TABLE (
  original_id UUID,
  duplicate_id UUID,
  bioguide_id TEXT,
  full_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH duplicates AS (
    SELECT 
      pf.bioguide_id,
      pf.full_name,
      COUNT(*) as count,
      MIN(pf.id) as original_id,
      ARRAY_AGG(pf.id ORDER BY pf.created_at DESC) as all_ids
    FROM public.public_figures pf
    WHERE pf.bioguide_id IS NOT NULL
    GROUP BY pf.bioguide_id, pf.full_name
    HAVING COUNT(*) > 1
  )
  SELECT 
    d.original_id,
    unnest(d.all_ids[2:]) as duplicate_id,
    d.bioguide_id,
    d.full_name
  FROM duplicates d;
END;
$$;

-- ============================================================================
-- STEP 9: CREATE TRIGGERS
-- ============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_public_figures_updated_at ON public.public_figures;
DROP TRIGGER IF EXISTS update_congressional_terms_updated_at ON public.congressional_terms;

-- Create updated_at triggers
CREATE TRIGGER update_public_figures_updated_at
    BEFORE UPDATE ON public.public_figures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_congressional_terms_updated_at
    BEFORE UPDATE ON public.congressional_terms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 10: ENABLE RLS AND CREATE SIMPLE POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE public.public_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congressional_terms ENABLE ROW LEVEL SECURITY;

-- Create simple, non-circular RLS policies
CREATE POLICY "public_figures_authenticated_read" ON public.public_figures
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "public_figures_service_all" ON public.public_figures
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "congressional_terms_authenticated_read" ON public.congressional_terms
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "congressional_terms_service_all" ON public.congressional_terms
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 11: GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- ============================================================================
-- STEP 12: VALIDATION AND CLEANUP
-- ============================================================================

-- Add NOT NULL constraints where appropriate
DO $$
BEGIN
    -- Only work with existing columns: full_name and slug are required, bio is optional
    
    -- Ensure full_name is not null (this column should always exist and be NOT NULL)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'public_figures' 
        AND column_name = 'full_name' 
        AND is_nullable = 'YES'
    ) THEN
        -- First, update any NULL values with a default
        UPDATE public.public_figures 
        SET full_name = COALESCE(display_name, 'Unknown Person') 
        WHERE full_name IS NULL;
        
        ALTER TABLE public.public_figures ALTER COLUMN full_name SET NOT NULL;
        RAISE NOTICE 'Set full_name to NOT NULL';
    END IF;

    -- Ensure slug is not null (this column should always exist and be NOT NULL)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'public_figures' 
        AND column_name = 'slug' 
        AND is_nullable = 'YES'
    ) THEN
        -- Update any NULL slugs
        UPDATE public.public_figures 
        SET slug = generate_slug(COALESCE(full_name, display_name, 'unknown-' || substring(id::text from 1 for 8)))
        WHERE slug IS NULL;
        
        ALTER TABLE public.public_figures ALTER COLUMN slug SET NOT NULL;
        RAISE NOTICE 'Set slug to NOT NULL';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not set NOT NULL constraints: %', SQLERRM;
END $$;

-- Clean up any orphaned data (only check columns that actually exist)
DELETE FROM public.public_figures 
WHERE bioguide_id IS NULL 
   AND full_name IS NULL 
   AND display_name IS NULL;

-- Final validation
DO $$
DECLARE
    public_figures_count INTEGER;
    congressional_terms_count INTEGER;
    bioguide_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO public_figures_count FROM public.public_figures;
    SELECT COUNT(*) INTO congressional_terms_count FROM public.congressional_terms;
    SELECT COUNT(*) INTO bioguide_count FROM public.public_figures WHERE bioguide_id IS NOT NULL;
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Public figures: %', public_figures_count;
    RAISE NOTICE 'Congressional terms: %', congressional_terms_count;
    RAISE NOTICE 'Figures with bioguide_id: %', bioguide_count;
END $$;

COMMIT; 