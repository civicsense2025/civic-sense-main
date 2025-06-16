-- Migration: create glossary_terms table for dictionary/glossary

CREATE TABLE IF NOT EXISTS glossary_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  definition text NOT NULL,
  part_of_speech text,
  category text,
  examples jsonb,
  synonyms text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(term)
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS glossary_terms_term_idx ON glossary_terms USING gin (to_tsvector('english', term));
CREATE INDEX IF NOT EXISTS glossary_terms_definition_idx ON glossary_terms USING gin (to_tsvector('english', definition));

-- Trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_glossary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS glossary_updated_at_trigger ON glossary_terms;
CREATE TRIGGER glossary_updated_at_trigger
BEFORE UPDATE ON glossary_terms
FOR EACH ROW EXECUTE FUNCTION update_glossary_updated_at();

-- Seed a few civics terms
INSERT INTO glossary_terms (term, definition, part_of_speech, category, examples, synonyms)
VALUES
  ('Civic', 'Relating to a citizen, city, or community affairs.', 'adjective', 'General', '["Civic responsibility", "Civic engagement"]', ARRAY['civil', 'municipal']),
  ('Amendment', 'A change or addition designed to improve a text, piece of legislation, or constitution.', 'noun', 'Government', '["First Amendment", "Amending a bill"]', ARRAY['change', 'modification']),
  ('Veto', 'A constitutional right to reject a decision or proposal made by a law-making body.', 'noun/verb', 'Government', '["Presidential veto", "Veto power"]', ARRAY['reject', 'override']); 