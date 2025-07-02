-- =============================================================================
-- ADD AI EXTRACTION TRACKING FIELDS
-- =============================================================================
-- This migration adds fields to track content extracted from AI analysis

BEGIN;

-- Add source tracking fields to question_topics
ALTER TABLE question_topics 
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_analysis_id TEXT,
ADD COLUMN IF NOT EXISTS ai_extraction_metadata JSONB;

-- Add source tracking fields to public_figures  
ALTER TABLE public_figures
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_analysis_id TEXT,
ADD COLUMN IF NOT EXISTS ai_extraction_metadata JSONB;

-- Add source tracking fields to events
ALTER TABLE events
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual', 
ADD COLUMN IF NOT EXISTS source_analysis_id TEXT,
ADD COLUMN IF NOT EXISTS ai_extraction_metadata JSONB;

-- Create indexes for better performance on AI-extracted content queries
CREATE INDEX IF NOT EXISTS idx_question_topics_source_type ON question_topics(source_type);
CREATE INDEX IF NOT EXISTS idx_question_topics_source_analysis_id ON question_topics(source_analysis_id);

CREATE INDEX IF NOT EXISTS idx_public_figures_source_type ON public_figures(source_type);
CREATE INDEX IF NOT EXISTS idx_public_figures_source_analysis_id ON public_figures(source_analysis_id);

CREATE INDEX IF NOT EXISTS idx_events_source_type ON events(source_type);
CREATE INDEX IF NOT EXISTS idx_events_source_analysis_id ON events(source_analysis_id);

-- Add comments for documentation
COMMENT ON COLUMN question_topics.source_type IS 'How this topic was created: manual, ai_extracted, imported';
COMMENT ON COLUMN question_topics.source_analysis_id IS 'ID of the article bias analysis that extracted this topic';
COMMENT ON COLUMN question_topics.ai_extraction_metadata IS 'Additional metadata from AI extraction process';

COMMENT ON COLUMN public_figures.source_type IS 'How this figure was created: manual, ai_extracted, imported';  
COMMENT ON COLUMN public_figures.source_analysis_id IS 'ID of the article bias analysis that extracted this figure';
COMMENT ON COLUMN public_figures.ai_extraction_metadata IS 'Additional metadata from AI extraction process';

COMMENT ON COLUMN events.source_type IS 'How this event was created: manual, ai_extracted, imported';
COMMENT ON COLUMN events.source_analysis_id IS 'ID of the article bias analysis that extracted this event';
COMMENT ON COLUMN events.ai_extraction_metadata IS 'Additional metadata from AI extraction process';

COMMIT;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- 
-- This migration adds tracking fields for AI-extracted civic education content:
-- 
-- 1. ✅ Added source_type field to track extraction method
-- 2. ✅ Added source_analysis_id to link back to article analysis
-- 3. ✅ Added ai_extraction_metadata for additional context
-- 4. ✅ Created indexes for performance
-- 5. ✅ Added documentation comments
-- 
-- Now we can track which content was extracted from news articles vs manually created
-- 
-- ============================================================================= 