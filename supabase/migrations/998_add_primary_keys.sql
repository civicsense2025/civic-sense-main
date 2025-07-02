-- Add Primary Keys Migration
-- Addresses tables without primary keys found in Supabase database linter report
-- Generated: 2024-12-19

BEGIN;

-- ==============================================================================
-- ADD PRIMARY KEYS TO TABLES WITHOUT THEM
-- ==============================================================================

-- Add primary key to assessment_analytics if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'assessment_analytics' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        -- Add an ID column as primary key
        ALTER TABLE public.assessment_analytics 
        ADD COLUMN IF NOT EXISTS id BIGSERIAL PRIMARY KEY;
        
        -- Add comment
        COMMENT ON COLUMN public.assessment_analytics.id IS 'Primary key added for performance optimization';
    END IF;
END $$;

-- Add primary key to question_analytics if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'question_analytics' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        -- Add an ID column as primary key
        ALTER TABLE public.question_analytics 
        ADD COLUMN IF NOT EXISTS id BIGSERIAL PRIMARY KEY;
        
        -- Add comment
        COMMENT ON COLUMN public.question_analytics.id IS 'Primary key added for performance optimization';
    END IF;
END $$;

-- Update table comments
COMMENT ON TABLE public.assessment_analytics IS 'Analytics data for assessments - optimized with primary key';
COMMENT ON TABLE public.question_analytics IS 'Analytics data for questions - optimized with primary key';

COMMIT; 