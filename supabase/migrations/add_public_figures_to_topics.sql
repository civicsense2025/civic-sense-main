-- Add public figures connection to question topics
-- Migration: Connect public_figures to question_topics via JSONB

BEGIN;

-- Add JSONB field for storing related public figure IDs
ALTER TABLE public.question_topics 
ADD COLUMN IF NOT EXISTS related_figures JSONB DEFAULT '[]'::jsonb;

-- Add constraint to ensure it's an array
ALTER TABLE public.question_topics 
ADD CONSTRAINT IF NOT EXISTS check_related_figures_is_array 
CHECK (jsonb_typeof(related_figures) = 'array');

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_question_topics_related_figures 
ON public.question_topics USING GIN (related_figures);

-- Add some useful functions for working with figure relationships
CREATE OR REPLACE FUNCTION public.add_figure_to_topic(
  p_topic_id TEXT,
  p_figure_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.question_topics 
  SET related_figures = CASE 
    WHEN related_figures ? p_figure_id THEN related_figures
    ELSE related_figures || jsonb_build_array(p_figure_id)
  END
  WHERE topic_id = p_topic_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.remove_figure_from_topic(
  p_topic_id TEXT,
  p_figure_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.question_topics 
  SET related_figures = related_figures - p_figure_id
  WHERE topic_id = p_topic_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment
COMMENT ON COLUMN public.question_topics.related_figures IS 
'JSONB array of public_figures.id values related to this topic';

COMMIT; 