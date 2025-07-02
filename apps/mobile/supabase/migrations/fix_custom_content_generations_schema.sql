-- Migration: Fix custom_content_generations schema completely
-- Date: December 2024
-- Purpose: Add ALL missing columns and fix naming mismatches for content generation

BEGIN;

-- ============================================================================
-- ADD ALL MISSING COLUMNS
-- ============================================================================

-- Add is_premium column (used in trackGeneration)
ALTER TABLE public.custom_content_generations 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Add metadata column (used in trackGeneration and ugc-content-generator)
ALTER TABLE public.custom_content_generations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add total_sources column (used in saveGeneratedContent)
ALTER TABLE public.custom_content_generations 
ADD COLUMN IF NOT EXISTS total_sources INTEGER DEFAULT 0;

-- Add topic_id column (used in completeGeneration for premium users)
ALTER TABLE public.custom_content_generations 
ADD COLUMN IF NOT EXISTS topic_id TEXT;

-- Add generated_at column (used in ugc-content-generator)
ALTER TABLE public.custom_content_generations 
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;

-- Add completed_at column (used in completeGeneration)
ALTER TABLE public.custom_content_generations 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add content column (used in completeGeneration - alternative name for generated_content)
ALTER TABLE public.custom_content_generations 
ADD COLUMN IF NOT EXISTS content JSONB;

-- Add questions column (used in saveGeneratedContent - alternative name for generated_content)
ALTER TABLE public.custom_content_generations 
ADD COLUMN IF NOT EXISTS questions JSONB;

-- Add average_credibility column (used in saveGeneratedContent - alternative name for source_credibility_average)
ALTER TABLE public.custom_content_generations 
ADD COLUMN IF NOT EXISTS average_credibility DECIMAL(5,2);

-- Add is_preview column (used in ugc-content-generator - alternative name for is_preview_only)
ALTER TABLE public.custom_content_generations 
ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT TRUE;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_custom_content_generations_is_premium 
ON public.custom_content_generations(is_premium);

CREATE INDEX IF NOT EXISTS idx_custom_content_generations_topic_id 
ON public.custom_content_generations(topic_id);

CREATE INDEX IF NOT EXISTS idx_custom_content_generations_generated_at 
ON public.custom_content_generations(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_content_generations_completed_at 
ON public.custom_content_generations(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_content_generations_is_preview 
ON public.custom_content_generations(is_preview);

-- ============================================================================
-- CREATE TRIGGERS TO KEEP DUPLICATE COLUMNS IN SYNC
-- ============================================================================

-- Function to sync content/questions with generated_content
CREATE OR REPLACE FUNCTION sync_generated_content()
RETURNS TRIGGER AS $$
BEGIN
    -- If content is updated, sync to generated_content
    IF TG_OP = 'UPDATE' AND NEW.content IS DISTINCT FROM OLD.content AND NEW.content IS NOT NULL THEN
        NEW.generated_content = NEW.content;
    END IF;
    
    -- If questions is updated, sync to generated_content
    IF TG_OP = 'UPDATE' AND NEW.questions IS DISTINCT FROM OLD.questions AND NEW.questions IS NOT NULL THEN
        NEW.generated_content = NEW.questions;
    END IF;
    
    -- If generated_content is updated, sync to both content and questions
    IF TG_OP = 'UPDATE' AND NEW.generated_content IS DISTINCT FROM OLD.generated_content AND NEW.generated_content IS NOT NULL THEN
        NEW.content = NEW.generated_content;
        NEW.questions = NEW.generated_content;
    END IF;
    
    -- If average_credibility is updated, sync to source_credibility_average
    IF TG_OP = 'UPDATE' AND NEW.average_credibility IS DISTINCT FROM OLD.average_credibility AND NEW.average_credibility IS NOT NULL THEN
        NEW.source_credibility_average = NEW.average_credibility;
    END IF;
    
    -- If source_credibility_average is updated, sync to average_credibility
    IF TG_OP = 'UPDATE' AND NEW.source_credibility_average IS DISTINCT FROM OLD.source_credibility_average AND NEW.source_credibility_average IS NOT NULL THEN
        NEW.average_credibility = NEW.source_credibility_average;
    END IF;
    
    -- If is_preview is updated, sync to is_preview_only
    IF TG_OP = 'UPDATE' AND NEW.is_preview IS DISTINCT FROM OLD.is_preview THEN
        NEW.is_preview_only = NEW.is_preview;
    END IF;
    
    -- If is_preview_only is updated, sync to is_preview
    IF TG_OP = 'UPDATE' AND NEW.is_preview_only IS DISTINCT FROM OLD.is_preview_only THEN
        NEW.is_preview = NEW.is_preview_only;
    END IF;
    
    -- If completed_at is updated, sync to generation_completed_at
    IF TG_OP = 'UPDATE' AND NEW.completed_at IS DISTINCT FROM OLD.completed_at AND NEW.completed_at IS NOT NULL THEN
        NEW.generation_completed_at = NEW.completed_at;
    END IF;
    
    -- If generation_completed_at is updated, sync to completed_at
    IF TG_OP = 'UPDATE' AND NEW.generation_completed_at IS DISTINCT FROM OLD.generation_completed_at AND NEW.generation_completed_at IS NOT NULL THEN
        NEW.completed_at = NEW.generation_completed_at;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for syncing columns
DROP TRIGGER IF EXISTS sync_generated_content_trigger ON public.custom_content_generations;
CREATE TRIGGER sync_generated_content_trigger
    BEFORE INSERT OR UPDATE ON public.custom_content_generations
    FOR EACH ROW
    EXECUTE FUNCTION sync_generated_content();

-- ============================================================================
-- UPDATE EXISTING DATA TO SYNC COLUMNS
-- ============================================================================

-- Sync existing data from original columns to new columns
UPDATE public.custom_content_generations 
SET 
    content = generated_content,
    questions = generated_content,
    average_credibility = source_credibility_average,
    is_preview = is_preview_only,
    completed_at = generation_completed_at
WHERE 
    generated_content IS NOT NULL 
    OR source_credibility_average IS NOT NULL 
    OR is_preview_only IS NOT NULL
    OR generation_completed_at IS NOT NULL;

-- ============================================================================
-- ADD HELPFUL COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.custom_content_generations.is_premium IS 'Indicates if this generation was created by a premium user';
COMMENT ON COLUMN public.custom_content_generations.metadata IS 'Additional metadata for the generation (difficulty, questionCount, etc.)';
COMMENT ON COLUMN public.custom_content_generations.total_sources IS 'Total number of unique sources used in generation';
COMMENT ON COLUMN public.custom_content_generations.topic_id IS 'Reference to created playable topic (for premium users)';
COMMENT ON COLUMN public.custom_content_generations.generated_at IS 'When the generation was completed';
COMMENT ON COLUMN public.custom_content_generations.completed_at IS 'Alias for generation_completed_at - synced via trigger';
COMMENT ON COLUMN public.custom_content_generations.content IS 'Alias for generated_content - synced via trigger';
COMMENT ON COLUMN public.custom_content_generations.questions IS 'Alias for generated_content - synced via trigger';
COMMENT ON COLUMN public.custom_content_generations.average_credibility IS 'Alias for source_credibility_average - synced via trigger';
COMMENT ON COLUMN public.custom_content_generations.is_preview IS 'Alias for is_preview_only - synced via trigger';

COMMIT; 