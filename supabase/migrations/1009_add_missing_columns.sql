-- Add Missing Columns for RLS Policies
-- This migration adds columns that RLS policies expect but don't exist in some tables
-- Created: 2024

BEGIN;

-- =============================================================================
-- ADD MISSING is_active COLUMNS
-- =============================================================================

-- Events table - add is_active column for content management
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Organizations table - add is_active column if missing
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Public figures table - add is_active column if missing
ALTER TABLE public_figures 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Media organizations table - add is_active column if missing
ALTER TABLE media_organizations 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Source metadata table - add is_active column if missing
ALTER TABLE source_metadata 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Glossary terms table - add is_active column if missing
ALTER TABLE glossary_terms 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Category synonyms table - add is_active column if missing
ALTER TABLE category_synonyms 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Question source links table - add is_active column if missing
ALTER TABLE question_source_links 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Bias detection patterns table - add is_active column if missing (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bias_detection_patterns' AND table_schema = 'public') THEN
        ALTER TABLE bias_detection_patterns ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Bias dimensions table - add is_active column if missing (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bias_dimensions' AND table_schema = 'public') THEN
        ALTER TABLE bias_dimensions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- =============================================================================
-- ADD MISSING created_at/updated_at COLUMNS
-- =============================================================================

-- Events table - add audit columns
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create updated_at trigger for events if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for events table
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ENSURE PROPER id COLUMNS (without adding duplicate primary keys)
-- =============================================================================

-- Check if events table has id column, if not add it (but don't make it primary key if one exists)
DO $$
BEGIN
    -- Only add id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'id'
        AND table_schema = 'public'
    ) THEN
        -- Check if table already has a primary key
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'events' 
            AND constraint_type = 'PRIMARY KEY'
            AND table_schema = 'public'
        ) THEN
            -- No primary key exists, add id as primary key
            ALTER TABLE events ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
        ELSE
            -- Primary key exists, just add id column
            ALTER TABLE events ADD COLUMN id UUID DEFAULT gen_random_uuid() UNIQUE;
        END IF;
    END IF;
END $$;

-- =============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for is_active columns (for RLS policies)
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_public_figures_is_active ON public_figures(is_active);
CREATE INDEX IF NOT EXISTS idx_media_organizations_is_active ON media_organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_source_metadata_is_active ON source_metadata(is_active);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_is_active ON glossary_terms(is_active);
CREATE INDEX IF NOT EXISTS idx_category_synonyms_is_active ON category_synonyms(is_active);
CREATE INDEX IF NOT EXISTS idx_question_source_links_is_active ON question_source_links(is_active);

-- Conditional indexes for tables that might not exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bias_detection_patterns' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_bias_detection_patterns_is_active ON bias_detection_patterns(is_active);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bias_dimensions' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_bias_dimensions_is_active ON bias_dimensions(is_active);
    END IF;
END $$;

-- Index for created_at columns (for sorting)
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

COMMIT; 