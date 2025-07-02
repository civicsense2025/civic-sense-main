-- Migration to add UI string translations table
-- This stores translated versions of all UI strings for different languages

BEGIN;

-- Create UI string translations table
CREATE TABLE IF NOT EXISTS ui_string_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL,
  translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one record per language
  UNIQUE(language_code)
);

COMMENT ON TABLE ui_string_translations IS 'Stores translated UI strings for different languages';
COMMENT ON COLUMN ui_string_translations.language_code IS 'ISO language code (e.g., es, fr, de)';
COMMENT ON COLUMN ui_string_translations.translations IS 'JSONB object containing all translated strings for this language';

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_ui_string_translations_language ON ui_string_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_ui_string_translations_updated ON ui_string_translations(last_updated);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_ui_string_translations_content ON ui_string_translations USING gin(translations);

-- Function to get a translated UI string
CREATE OR REPLACE FUNCTION get_ui_string(
  language_code_param TEXT,
  string_path TEXT,
  fallback_language TEXT DEFAULT 'en'
)
RETURNS TEXT AS $$
DECLARE
  translation_result TEXT;
  fallback_result TEXT;
BEGIN
  -- Return path if English (no translation needed)
  IF language_code_param = 'en' THEN
    RETURN string_path;
  END IF;
  
  -- Try to get translation for requested language
  SELECT translations #>> string_path_to_array(string_path)
  INTO translation_result
  FROM ui_string_translations
  WHERE language_code = language_code_param;
  
  -- If found, return it
  IF translation_result IS NOT NULL THEN
    RETURN translation_result;
  END IF;
  
  -- If not found and fallback language is different, try fallback
  IF fallback_language != language_code_param THEN
    SELECT translations #>> string_path_to_array(string_path)
    INTO fallback_result
    FROM ui_string_translations
    WHERE language_code = fallback_language;
    
    IF fallback_result IS NOT NULL THEN
      RETURN fallback_result;
    END IF;
  END IF;
  
  -- Return original path if no translation found
  RETURN string_path;
END;
$$ LANGUAGE plpgsql;

-- Helper function to convert dot-notation path to array
CREATE OR REPLACE FUNCTION string_path_to_array(path TEXT)
RETURNS TEXT[] AS $$
BEGIN
  RETURN string_to_array(path, '.');
END;
$$ LANGUAGE plpgsql;

-- Function to validate UI string translations structure
CREATE OR REPLACE FUNCTION validate_ui_translations(translations JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  key TEXT;
  value JSONB;
BEGIN
  -- Check if translations is an object
  IF jsonb_typeof(translations) != 'object' THEN
    RETURN FALSE;
  END IF;
  
  -- Check each translation entry
  FOR key, value IN SELECT * FROM jsonb_each(translations)
  LOOP
    -- Each value should be an object with 'text' field
    IF jsonb_typeof(value) != 'object' OR NOT (value ? 'text') THEN
      RETURN FALSE;
    END IF;
    
    -- 'text' should be a string
    IF jsonb_typeof(value->'text') != 'string' THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate translations structure
ALTER TABLE ui_string_translations
ADD CONSTRAINT check_valid_ui_translations
CHECK (validate_ui_translations(translations));

-- Function to get translation statistics
CREATE OR REPLACE FUNCTION get_ui_translation_stats()
RETURNS TABLE (
  language_code TEXT,
  total_strings INTEGER,
  translated_strings INTEGER,
  completion_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.language_code,
    550 as total_strings, -- Approximate count of strings in ui-strings.ts
    (
      SELECT COUNT(*)
      FROM jsonb_object_keys(t.translations)
    )::INTEGER as translated_strings,
    ROUND(
      (
        SELECT COUNT(*)::NUMERIC
        FROM jsonb_object_keys(t.translations)
      ) / 550.0 * 100, 
      1
    ) as completion_percentage
  FROM ui_string_translations t
  ORDER BY completion_percentage DESC;
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE ui_string_translations ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (UI strings should be public)
CREATE POLICY "Allow read access to UI translations"
ON ui_string_translations
FOR SELECT
USING (true);

-- Allow insert/update only to authenticated users (for admin translation management)
CREATE POLICY "Allow translation management to authenticated users"
ON ui_string_translations
FOR ALL
USING (auth.role() = 'authenticated');

-- Insert sample translations for Spanish to demonstrate the structure
INSERT INTO ui_string_translations (language_code, translations) VALUES (
  'es',
  '{
    "brand.name": {
      "text": "CivicSense",
      "lastUpdated": "2024-01-15T10:00:00Z",
      "autoTranslated": false
    },
    "brand.tagline": {
      "text": "La educación cívica que los políticos no quieren que tengas",
      "lastUpdated": "2024-01-15T10:00:00Z",
      "autoTranslated": true
    },
    "actions.continue": {
      "text": "Continuar",
      "lastUpdated": "2024-01-15T10:00:00Z",
      "autoTranslated": true
    },
    "actions.save": {
      "text": "Guardar",
      "lastUpdated": "2024-01-15T10:00:00Z",
      "autoTranslated": true
    },
    "navigation.home": {
      "text": "Inicio",
      "lastUpdated": "2024-01-15T10:00:00Z",
      "autoTranslated": true
    },
    "navigation.dashboard": {
      "text": "Panel",
      "lastUpdated": "2024-01-15T10:00:00Z",
      "autoTranslated": true
    },
    "auth.signIn.title": {
      "text": "Iniciar Sesión",
      "lastUpdated": "2024-01-15T10:00:00Z",
      "autoTranslated": true
    },
    "quiz.startQuiz": {
      "text": "Comenzar Cuestionario",
      "lastUpdated": "2024-01-15T10:00:00Z",
      "autoTranslated": true
    }
  }'::jsonb
) ON CONFLICT (language_code) DO NOTHING;

COMMIT; 