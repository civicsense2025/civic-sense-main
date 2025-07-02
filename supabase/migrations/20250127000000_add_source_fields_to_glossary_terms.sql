-- Migration: Add source tracking fields to glossary_terms table
-- This enables the AI glossary generator to link terms with verified sources

BEGIN;

-- Add source tracking columns to glossary_terms table
ALTER TABLE public.glossary_terms 
ADD COLUMN IF NOT EXISTS primary_source_id UUID REFERENCES public.source_metadata(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS supporting_source_ids UUID[] DEFAULT '{}';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_glossary_terms_primary_source 
ON public.glossary_terms(primary_source_id);

CREATE INDEX IF NOT EXISTS idx_glossary_terms_supporting_sources 
ON public.glossary_terms USING GIN(supporting_source_ids);

-- Add comments for documentation
COMMENT ON COLUMN public.glossary_terms.primary_source_id IS 'Primary source that supports this glossary term definition';
COMMENT ON COLUMN public.glossary_terms.supporting_source_ids IS 'Array of supporting source UUIDs that provide additional evidence for this term';

-- Update RLS policies to include source access
-- Users can view terms and their sources
DROP POLICY IF EXISTS "glossary_terms_select_policy" ON public.glossary_terms;
CREATE POLICY "glossary_terms_select_policy" ON public.glossary_terms
FOR SELECT USING (
  is_active = true AND 
  (
    auth.uid() IS NOT NULL OR  -- Authenticated users can view all active terms
    is_verified = true         -- Unauthenticated users can only view verified terms
  )
);

-- Add helper function to get term with sources
CREATE OR REPLACE FUNCTION public.get_glossary_term_with_sources(term_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'term', gt.*,
    'primary_source', ps.*,
    'supporting_sources', COALESCE(
      (
        SELECT json_agg(ss.*)
        FROM public.source_metadata ss
        WHERE ss.id = ANY(gt.supporting_source_ids)
      ), 
      '[]'::json
    )
  )
  INTO result
  FROM public.glossary_terms gt
  LEFT JOIN public.source_metadata ps ON ps.id = gt.primary_source_id
  WHERE gt.id = term_id;
  
  RETURN result;
END;
$$;

-- Add helper function to find terms by source credibility
CREATE OR REPLACE FUNCTION public.get_terms_by_source_credibility(min_credibility INTEGER DEFAULT 70)
RETURNS TABLE(
  term_id UUID,
  term_text TEXT,
  definition TEXT,
  source_count BIGINT,
  avg_credibility NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gt.id as term_id,
    gt.term as term_text,
    gt.definition,
    (
      CASE WHEN gt.primary_source_id IS NOT NULL THEN 1 ELSE 0 END +
      COALESCE(array_length(gt.supporting_source_ids, 1), 0)
    )::BIGINT as source_count,
    COALESCE(
      (
        SELECT AVG(sm.credibility_score)
        FROM public.source_metadata sm
        WHERE sm.id = gt.primary_source_id
           OR sm.id = ANY(gt.supporting_source_ids)
      ),
      0
    ) as avg_credibility
  FROM public.glossary_terms gt
  WHERE gt.is_active = true
    AND COALESCE(
      (
        SELECT AVG(sm.credibility_score)
        FROM public.source_metadata sm
        WHERE sm.id = gt.primary_source_id
           OR sm.id = ANY(gt.supporting_source_ids)
      ),
      0
    ) >= min_credibility
  ORDER BY avg_credibility DESC, source_count DESC;
END;
$$;

-- Add helper function to link a source to an existing term
CREATE OR REPLACE FUNCTION public.add_source_to_glossary_term(
  term_id UUID,
  source_id UUID,
  is_primary BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  term_exists BOOLEAN;
  source_exists BOOLEAN;
BEGIN
  -- Check if term exists
  SELECT EXISTS(SELECT 1 FROM public.glossary_terms WHERE id = term_id) INTO term_exists;
  IF NOT term_exists THEN
    RAISE EXCEPTION 'Glossary term not found: %', term_id;
  END IF;
  
  -- Check if source exists
  SELECT EXISTS(SELECT 1 FROM public.source_metadata WHERE id = source_id) INTO source_exists;
  IF NOT source_exists THEN
    RAISE EXCEPTION 'Source not found: %', source_id;
  END IF;
  
  -- Add as primary source
  IF is_primary THEN
    UPDATE public.glossary_terms 
    SET primary_source_id = source_id
    WHERE id = term_id;
    
    -- Remove from supporting sources if it was there
    UPDATE public.glossary_terms 
    SET supporting_source_ids = array_remove(supporting_source_ids, source_id)
    WHERE id = term_id;
  ELSE
    -- Add to supporting sources if not already there and not the primary source
    UPDATE public.glossary_terms 
    SET supporting_source_ids = array_append(supporting_source_ids, source_id)
    WHERE id = term_id
      AND primary_source_id != source_id
      AND NOT (source_id = ANY(supporting_source_ids));
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_glossary_term_with_sources(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_terms_by_source_credibility(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.add_source_to_glossary_term(UUID, UUID, BOOLEAN) TO authenticated;

COMMIT; 