-- Create junction table for many-to-many relationship between question_topics and categories
-- This replaces the inefficient JSONB categories column with proper foreign key relationships

BEGIN;

-- Create the junction table
CREATE TABLE IF NOT EXISTS public.question_topic_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.question_topics(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(topic_id, category_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_topic_categories_topic_id 
ON public.question_topic_categories(topic_id);

CREATE INDEX IF NOT EXISTS idx_question_topic_categories_category_id 
ON public.question_topic_categories(category_id);

CREATE INDEX IF NOT EXISTS idx_question_topic_categories_primary 
ON public.question_topic_categories(category_id) 
WHERE is_primary = true;

-- Enable RLS
ALTER TABLE public.question_topic_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "question_topic_categories_read" ON public.question_topic_categories
  FOR SELECT USING (true);

CREATE POLICY "question_topic_categories_insert" ON public.question_topic_categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "question_topic_categories_update" ON public.question_topic_categories
  FOR UPDATE USING (true);

CREATE POLICY "question_topic_categories_delete" ON public.question_topic_categories
  FOR DELETE USING (true);

COMMIT; 