-- Create question_topics table
CREATE TABLE IF NOT EXISTS question_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL UNIQUE,
  topic_title TEXT NOT NULL,
  description TEXT NOT NULL,
  why_this_matters TEXT NOT NULL,
  emoji TEXT NOT NULL,
  date DATE,
  day_of_week TEXT,
  categories JSONB DEFAULT '[]',
  translations JSONB,
  is_active BOOLEAN DEFAULT true,
  is_breaking BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  key_takeaways JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for key_takeaways
CREATE INDEX IF NOT EXISTS idx_question_topics_key_takeaways ON question_topics USING GIN (key_takeaways);

-- Add trigger to validate key_takeaways structure
CREATE OR REPLACE FUNCTION validate_key_takeaways()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if key_takeaways is not null and has required fields
  IF NEW.key_takeaways IS NOT NULL THEN
    IF NOT (
      NEW.key_takeaways ? 'core_facts' AND
      NEW.key_takeaways ? 'uncomfortable_truths' AND
      NEW.key_takeaways ? 'power_dynamics' AND
      NEW.key_takeaways ? 'specific_actors' AND
      NEW.key_takeaways ? 'actionable_insights' AND
      NEW.key_takeaways ? 'precedent_implications'
    ) THEN
      RAISE EXCEPTION 'key_takeaways must contain all required fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_key_takeaways_trigger
BEFORE INSERT OR UPDATE ON question_topics
FOR EACH ROW
EXECUTE FUNCTION validate_key_takeaways(); 