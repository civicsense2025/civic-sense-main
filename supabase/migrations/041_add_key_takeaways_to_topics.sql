-- Migration: Add key_takeaways JSONB column to question_topics
-- This stores the most important facts and insights from each topic

BEGIN;

-- Add key_takeaways column to question_topics
ALTER TABLE public.question_topics 
ADD COLUMN IF NOT EXISTS key_takeaways JSONB;

-- Add comment explaining the structure
COMMENT ON COLUMN public.question_topics.key_takeaways IS 
'Key takeaways in JSON format with structure: {
  "core_facts": ["fact1", "fact2", ...],
  "uncomfortable_truths": ["truth1", "truth2", ...],
  "power_dynamics": ["dynamic1", "dynamic2", ...], 
  "specific_actors": ["actor1", "actor2", ...],
  "actionable_insights": ["insight1", "insight2", ...],
  "precedent_implications": ["implication1", "implication2", ...]
}';

-- Create index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_question_topics_key_takeaways_gin 
ON public.question_topics USING gin (key_takeaways);

-- Create index for checking which topics have key_takeaways
CREATE INDEX IF NOT EXISTS idx_question_topics_has_key_takeaways 
ON public.question_topics ((key_takeaways IS NOT NULL));

COMMIT; 