-- Fix Skills Table Migration
-- This migration ensures the skills table uses category_id instead of category_name
-- and updates any existing skills to use the correct category_id

BEGIN;

-- Check if the skills table has category_name column
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'skills' 
    AND column_name = 'category_name'
  ) THEN
    -- Create a temporary table to store skill category mappings
    CREATE TEMP TABLE skill_category_mapping AS
    SELECT 
      s.id as skill_id, 
      c.id as category_id
    FROM skills s
    LEFT JOIN categories c ON LOWER(s.category_name) = LOWER(c.name);
    
    -- Add category_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'skills' 
      AND column_name = 'category_id'
    ) THEN
      ALTER TABLE skills ADD COLUMN category_id UUID REFERENCES categories(id);
    END IF;
    
    -- Update skills with correct category_id
    UPDATE skills s
    SET category_id = scm.category_id
    FROM skill_category_mapping scm
    WHERE s.id = scm.skill_id
    AND s.category_id IS NULL;
    
    -- Create categories for any missing ones
    INSERT INTO categories (name, emoji)
    SELECT DISTINCT s.category_name, '📚' 
    FROM skills s
    LEFT JOIN categories c ON LOWER(s.category_name) = LOWER(c.name)
    WHERE c.id IS NULL
    AND s.category_name IS NOT NULL;
    
    -- Update skills with newly created categories
    UPDATE skills s
    SET category_id = c.id
    FROM categories c
    WHERE LOWER(s.category_name) = LOWER(c.name)
    AND s.category_id IS NULL;
    
    -- Make category_id NOT NULL if all skills have been updated
    IF NOT EXISTS (SELECT 1 FROM skills WHERE category_id IS NULL) THEN
      ALTER TABLE skills ALTER COLUMN category_id SET NOT NULL;
      
      -- Drop category_name column if all skills have category_id
      ALTER TABLE skills DROP COLUMN category_name;
    END IF;
  END IF;
END $$;

-- Make sure the question_skills table exists
CREATE TABLE IF NOT EXISTS question_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    skill_weight REAL DEFAULT 1.0,
    is_primary_skill BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(question_id, skill_id)
);

-- Migrate data from skill_question_mappings if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'skill_question_mappings'
  ) THEN
    -- Copy data from skill_question_mappings to question_skills
    INSERT INTO question_skills (question_id, skill_id, skill_weight, is_primary_skill)
    SELECT 
      sqm.question_id::UUID, 
      sqm.skill_id, 
      COALESCE(sqm.relevance_score::REAL / 10, 1.0) as skill_weight,
      false as is_primary_skill
    FROM skill_question_mappings sqm
    ON CONFLICT (question_id, skill_id) DO NOTHING;
    
    -- Drop the old table if migration successful
    DROP TABLE IF EXISTS skill_question_mappings;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_skills_question_id ON question_skills(question_id);
CREATE INDEX IF NOT EXISTS idx_question_skills_skill_id ON question_skills(skill_id);

COMMIT; 