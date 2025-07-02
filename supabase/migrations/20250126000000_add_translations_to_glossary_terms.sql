-- Migration: Add translations column to glossary_terms table
-- Date: 2025-01-26
-- Description: Adds JSONB column for storing multilingual translations via DeepL API

BEGIN;

-- Add translations column to glossary_terms table
ALTER TABLE public.glossary_terms 
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the translations structure
COMMENT ON COLUMN public.glossary_terms.translations IS 
'Multilingual translations in JSONB format: {"es": {"term": "...", "definition": "...", "examples": [...], "synonyms": [...], "provider": "deepl"}, "fr": {...}}';

-- Create index for translations column for better query performance
CREATE INDEX IF NOT EXISTS idx_glossary_terms_translations 
ON public.glossary_terms USING GIN (translations);

-- Create index for checking if translations exist
CREATE INDEX IF NOT EXISTS idx_glossary_terms_has_translations 
ON public.glossary_terms ((translations != '{}'::jsonb)) 
WHERE translations != '{}'::jsonb;

-- Create function to get available translation languages for a term
CREATE OR REPLACE FUNCTION public.get_term_translation_languages(term_id UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN (
    SELECT ARRAY(
      SELECT jsonb_object_keys(translations)
      FROM public.glossary_terms 
      WHERE id = term_id 
      AND translations != '{}'::jsonb
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get a specific translation
CREATE OR REPLACE FUNCTION public.get_term_translation(
  term_id UUID, 
  language_code TEXT
)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT translations->(language_code)
    FROM public.glossary_terms 
    WHERE id = term_id 
    AND translations ? language_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the functions
GRANT EXECUTE ON FUNCTION public.get_term_translation_languages(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_term_translation(UUID, TEXT) TO authenticated;

-- Update RLS policies to include translations column in existing SELECT policies
-- (Translations should follow the same access patterns as the terms themselves)

COMMIT; 