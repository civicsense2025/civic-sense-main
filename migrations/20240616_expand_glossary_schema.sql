-- Migration: expand glossary schema and add relations

BEGIN;

-- 1. Create enum for part of speech if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'part_of_speech_enum') THEN
    CREATE TYPE part_of_speech_enum AS ENUM ('noun','verb','adjective','adverb','phrase');
  END IF;
END$$;

-- 2. Create categories table
CREATE TABLE IF NOT EXISTS glossary_categories (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text
);

-- 3. Alter glossary_terms table
ALTER TABLE glossary_terms
  ADD COLUMN IF NOT EXISTS slug text UNIQUE GENERATED ALWAYS AS (lower(regexp_replace(term,'[^a-zA-Z0-9]+','-','g'))) STORED,
  ADD COLUMN IF NOT EXISTS sources jsonb,
  ADD COLUMN IF NOT EXISTS category_id int REFERENCES glossary_categories(id),
  ADD COLUMN IF NOT EXISTS term_normalized text GENERATED ALWAYS AS (lower(term)) STORED;

-- change part_of_speech to enum
ALTER TABLE glossary_terms
  ALTER COLUMN part_of_speech TYPE part_of_speech_enum USING part_of_speech::part_of_speech_enum;

-- 4. Relations junction table
CREATE TABLE IF NOT EXISTS glossary_term_relations (
  from_id uuid REFERENCES glossary_terms(id) ON DELETE CASCADE,
  to_id   uuid REFERENCES glossary_terms(id) ON DELETE CASCADE,
  relation_type text CHECK (relation_type IN ('broader','narrower','related','antonym','see_also')),
  PRIMARY KEY (from_id, to_id, relation_type)
);

-- 5. Full-text search vector and indexes
ALTER TABLE glossary_terms
  ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(term,'') || ' ' || coalesce(array_to_string(synonyms,' '),'') || ' ' || coalesce(definition,''))
  ) STORED;

CREATE INDEX IF NOT EXISTS glossary_search_vector_idx ON glossary_terms USING GIN (search_vector);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS glossary_term_trgm_idx ON glossary_terms USING GIN (term gin_trgm_ops);

COMMIT; 