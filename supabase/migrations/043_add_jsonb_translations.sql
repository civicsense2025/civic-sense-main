-- Migration to add JSONB translation support to key tables
-- This migration adds a 'translations' JSONB column to tables that need multilingual support

BEGIN;

-- Add translations column to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN questions.translations IS 'JSONB field containing translations for question fields in multiple languages';

-- Create index for translations
CREATE INDEX IF NOT EXISTS idx_questions_translations ON questions USING gin(translations);

-- Add translations column to assessment_questions table  
ALTER TABLE assessment_questions
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN assessment_questions.translations IS 'JSONB field containing translations for assessment question fields';

CREATE INDEX IF NOT EXISTS idx_assessment_questions_translations ON assessment_questions USING gin(translations);

-- Add translations column to question_topics table
ALTER TABLE question_topics
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN question_topics.translations IS 'JSONB field containing translations for topic title and description';

CREATE INDEX IF NOT EXISTS idx_question_topics_translations ON question_topics USING gin(translations);

-- Add translations column to survey_questions table
ALTER TABLE survey_questions
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN survey_questions.translations IS 'JSONB field containing translations for survey questions and options';

CREATE INDEX IF NOT EXISTS idx_survey_questions_translations ON survey_questions USING gin(translations);

-- Add translations column to surveys table
ALTER TABLE surveys
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN surveys.translations IS 'JSONB field containing translations for survey title and description';

CREATE INDEX IF NOT EXISTS idx_surveys_translations ON surveys USING gin(translations);

-- Add translations column to categories table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories') THEN
        ALTER TABLE categories
        ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
        
        COMMENT ON COLUMN categories.translations IS 'JSONB field containing translations for category names and descriptions';
        
        CREATE INDEX IF NOT EXISTS idx_categories_translations ON categories USING gin(translations);
    END IF;
END $$;

-- Add translations column to glossary table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'glossary') THEN
        ALTER TABLE glossary
        ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
        
        COMMENT ON COLUMN glossary.translations IS 'JSONB field containing translations for glossary terms and definitions';
        
        CREATE INDEX IF NOT EXISTS idx_glossary_translations ON glossary USING gin(translations);
    END IF;
END $$;

-- Create a function to validate translation structure
CREATE OR REPLACE FUNCTION validate_translation_structure(translations JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    field_key TEXT;
    lang_key TEXT;
    translation_obj JSONB;
BEGIN
    -- Check if translations is an object
    IF jsonb_typeof(translations) != 'object' THEN
        RETURN FALSE;
    END IF;
    
    -- Iterate through fields
    FOR field_key IN SELECT jsonb_object_keys(translations)
    LOOP
        translation_obj := translations->field_key;
        
        -- Each field should contain an object with language codes
        IF jsonb_typeof(translation_obj) != 'object' THEN
            CONTINUE; -- Skip if not an object (might be legacy format)
        END IF;
        
        -- Check each language translation
        FOR lang_key IN SELECT jsonb_object_keys(translation_obj)
        LOOP
            -- Each language should have at least a 'text' field
            IF NOT (translation_obj->lang_key ? 'text') THEN
                RETURN FALSE;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get translated text for a specific field and language
CREATE OR REPLACE FUNCTION get_translation(
    translations JSONB,
    field_name TEXT,
    language_code TEXT,
    fallback_language TEXT DEFAULT 'en'
)
RETURNS TEXT AS $$
DECLARE
    field_translations JSONB;
    translated_text TEXT;
BEGIN
    -- Return NULL if no translations
    IF translations IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get translations for the specific field
    field_translations := translations->field_name;
    
    -- Return NULL if field has no translations
    IF field_translations IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Try to get translation for requested language
    translated_text := field_translations->language_code->>'text';
    
    -- If not found, try fallback language
    IF translated_text IS NULL AND language_code != fallback_language THEN
        translated_text := field_translations->fallback_language->>'text';
    END IF;
    
    RETURN translated_text;
END;
$$ LANGUAGE plpgsql;

-- Create a function to set a translation for a field
CREATE OR REPLACE FUNCTION set_translation(
    translations JSONB,
    field_name TEXT,
    language_code TEXT,
    translation_text TEXT,
    auto_translated BOOLEAN DEFAULT FALSE,
    reviewed_by TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    new_translation JSONB;
    updated_translations JSONB;
BEGIN
    -- Initialize translations if NULL
    IF translations IS NULL THEN
        translations := '{}'::jsonb;
    END IF;
    
    -- Create the new translation object
    new_translation := jsonb_build_object(
        'text', translation_text,
        'lastUpdated', NOW()::TEXT,
        'autoTranslated', auto_translated
    );
    
    -- Add reviewer info if provided
    IF reviewed_by IS NOT NULL THEN
        new_translation := new_translation || jsonb_build_object(
            'reviewedBy', reviewed_by,
            'reviewedAt', NOW()::TEXT
        );
    END IF;
    
    -- Update the translations object
    updated_translations := jsonb_set(
        translations,
        ARRAY[field_name, language_code],
        new_translation,
        true -- create missing keys
    );
    
    RETURN updated_translations;
END;
$$ LANGUAGE plpgsql;

-- Example of how translations are structured:
-- {
--   "question": {
--     "es": {
--       "text": "¿Cuál es la capital de Francia?",
--       "lastUpdated": "2024-01-15T10:30:00Z",
--       "autoTranslated": true
--     },
--     "fr": {
--       "text": "Quelle est la capitale de la France?",
--       "lastUpdated": "2024-01-15T10:30:00Z",
--       "autoTranslated": true,
--       "reviewedBy": "admin@example.com",
--       "reviewedAt": "2024-01-16T14:00:00Z"
--     }
--   },
--   "explanation": {
--     "es": {
--       "text": "París es la capital de Francia...",
--       "lastUpdated": "2024-01-15T10:30:00Z",
--       "autoTranslated": true
--     }
--   }
-- }

COMMIT; 