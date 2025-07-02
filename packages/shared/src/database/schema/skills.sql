-- Skills system for CivicSense learning
-- Skills are linked to content items and inherited by collections

-- Core skills taxonomy
CREATE TABLE skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_name VARCHAR(100) NOT NULL,
  skill_slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50), -- 'civic_knowledge', 'critical_thinking', 'action_skills', etc.
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  icon VARCHAR(50), -- Icon name for UI
  color VARCHAR(7), -- Hex color for skill badges
  prerequisite_skills UUID[] DEFAULT '{}', -- Array of skill IDs that should be learned first
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills attached to content items
CREATE TABLE IF NOT EXISTS content_item_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL, -- 'topic', 'glossary_term', 'scenario', etc.
  content_id UUID NOT NULL, -- ID of the actual content item
  proficiency_level INTEGER DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5), 
  is_primary BOOLEAN DEFAULT false, -- Is this a primary skill for this content?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(skill_id, content_type, content_id)
);

-- User skill progress tracking
CREATE TABLE user_skill_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 0 CHECK (current_level BETWEEN 0 AND 5),
  progress_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (progress_percentage BETWEEN 0 AND 100),
  items_completed INTEGER DEFAULT 0,
  total_items_available INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMP WITH TIME ZONE,
  mastery_achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, skill_id)
);

-- Skills earned through collection completion
CREATE TABLE IF NOT EXISTS collection_skill_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (progress_percentage BETWEEN 0 AND 100),
  items_completed INTEGER DEFAULT 0,
  total_items_in_collection INTEGER DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, collection_id, skill_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_item_skills_content ON content_item_skills(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_item_skills_skill ON content_item_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_collection_skill_progress_user_collection ON collection_skill_progress(user_id, collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_skill_progress_skill ON collection_skill_progress(skill_id);

-- Function to get all skills for a collection (inherited from items)
CREATE OR REPLACE FUNCTION get_collection_skills(collection_uuid UUID)
RETURNS TABLE (
  skill_id UUID,
  skill_name VARCHAR,
  skill_slug VARCHAR,
  description TEXT,
  category VARCHAR,
  difficulty_level INTEGER,
  total_items INTEGER,
  primary_items INTEGER,
  avg_proficiency DECIMAL,
  source_table TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH collection_content AS (
    -- Get all items in this collection
    SELECT 
      ci.item_type as content_type,
      ci.item_id as content_id
    FROM collection_items ci
    WHERE ci.collection_id = collection_uuid
  ),
  question_skills_mapped AS (
    -- Get skills from questions using existing question_skills table
    SELECT 
      s.id as skill_id,
      s.skill_name,
      s.skill_slug,
      s.description,
      s.category,
      s.difficulty_level,
      1 as item_count,
      CASE WHEN qs.is_primary_skill THEN 1 ELSE 0 END as is_primary,
      COALESCE(qs.skill_weight, 0.5)::DECIMAL as proficiency,
      'question_skills' as source_table
    FROM collection_content cc
    JOIN questions q ON cc.content_type = 'question' AND cc.content_id = q.id
    JOIN question_skills qs ON q.id = qs.question_id
    JOIN skills s ON qs.skill_id = s.id
  ),
  content_skills_mapped AS (
    -- Get skills from other content types using content_item_skills table
    SELECT 
      s.id as skill_id,
      s.skill_name,
      s.skill_slug,
      s.description,
      s.category,
      s.difficulty_level,
      1 as item_count,
      CASE WHEN cis.is_primary THEN 1 ELSE 0 END as is_primary,
      cis.proficiency_level::DECIMAL as proficiency,
      'content_item_skills' as source_table
    FROM collection_content cc
    JOIN content_item_skills cis ON 
      cc.content_type = cis.content_type AND 
      cc.content_id = cis.content_id
    JOIN skills s ON cis.skill_id = s.id
  ),
  all_skills AS (
    SELECT * FROM question_skills_mapped
    UNION ALL
    SELECT * FROM content_skills_mapped
  )
  SELECT 
    all_skills.skill_id,
    all_skills.skill_name,
    all_skills.skill_slug,
    all_skills.description,
    all_skills.category,
    all_skills.difficulty_level,
    SUM(all_skills.item_count)::INTEGER as total_items,
    SUM(all_skills.is_primary)::INTEGER as primary_items,
    AVG(all_skills.proficiency) as avg_proficiency,
    string_agg(DISTINCT all_skills.source_table, ',') as source_table
  FROM all_skills
  GROUP BY 
    all_skills.skill_id, 
    all_skills.skill_name, 
    all_skills.skill_slug, 
    all_skills.description, 
    all_skills.category, 
    all_skills.difficulty_level
  ORDER BY primary_items DESC, total_items DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to update user skill progress when they complete collection items
CREATE OR REPLACE FUNCTION update_skill_progress_on_collection_completion()
RETURNS TRIGGER AS $$
DECLARE
  skill_record RECORD;
  collection_uuid UUID;
BEGIN
  -- Get the collection ID from the progress record
  SELECT collection_id INTO collection_uuid 
  FROM user_collection_progress 
  WHERE id = NEW.id;
  
  -- If this is a completion (progress went from <100% to 100%)
  IF OLD.progress_percentage < 100 AND NEW.progress_percentage = 100 THEN
    -- Update skills progress for this collection completion
    FOR skill_record IN 
      SELECT * FROM get_collection_skills(collection_uuid)
    LOOP
      INSERT INTO collection_skill_progress (
        user_id, collection_id, skill_id, 
        progress_percentage, items_completed, total_items_in_collection,
        earned_at
      ) VALUES (
        NEW.user_id, collection_uuid, skill_record.skill_id,
        100.00, skill_record.total_items, skill_record.total_items,
        NOW()
      ) ON CONFLICT (user_id, collection_id, skill_id) 
      DO UPDATE SET 
        progress_percentage = 100.00,
        items_completed = skill_record.total_items,
        earned_at = NOW();
        
      -- Also update overall user skill progress
      INSERT INTO user_skill_progress (
        user_id, skill_id, current_level, progress_percentage,
        items_completed, last_practiced_at
      ) VALUES (
        NEW.user_id, skill_record.skill_id, 
        LEAST(5, GREATEST(1, skill_record.difficulty_level)),
        LEAST(100, COALESCE((SELECT progress_percentage FROM user_skill_progress WHERE user_id = NEW.user_id AND skill_id = skill_record.skill_id), 0) + (skill_record.avg_proficiency * 10)),
        COALESCE((SELECT items_completed FROM user_skill_progress WHERE user_id = NEW.user_id AND skill_id = skill_record.skill_id), 0) + skill_record.total_items,
        NOW()
      ) ON CONFLICT (user_id, skill_id)
      DO UPDATE SET
        progress_percentage = LEAST(100, user_skill_progress.progress_percentage + (skill_record.avg_proficiency * 10)),
        items_completed = user_skill_progress.items_completed + skill_record.total_items,
        last_practiced_at = NOW(),
        current_level = CASE 
          WHEN user_skill_progress.progress_percentage + (skill_record.avg_proficiency * 10) >= 100 THEN LEAST(5, user_skill_progress.current_level + 1)
          ELSE user_skill_progress.current_level
        END,
        mastery_achieved_at = CASE
          WHEN user_skill_progress.progress_percentage + (skill_record.avg_proficiency * 10) >= 100 AND user_skill_progress.mastery_achieved_at IS NULL THEN NOW()
          ELSE user_skill_progress.mastery_achieved_at
        END;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_skill_progress ON user_collection_progress;

-- Create the trigger
CREATE TRIGGER trigger_update_skill_progress
  AFTER UPDATE ON user_collection_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_skill_progress_on_collection_completion();

-- Sample skills for civic education
INSERT INTO skills (skill_name, skill_slug, description, category, difficulty_level, icon, color) VALUES
('Constitutional Knowledge', 'constitutional-knowledge', 'Understanding the US Constitution, Bill of Rights, and constitutional principles', 'civic_knowledge', 2, 'Scale', '#3B82F6'),
('Critical News Analysis', 'critical-news-analysis', 'Ability to analyze news sources for bias, credibility, and hidden agendas', 'critical_thinking', 3, 'SearchCheck', '#10B981'),
('Voting Rights Advocacy', 'voting-rights-advocacy', 'Knowledge and skills to protect and expand voting access', 'action_skills', 4, 'Vote', '#8B5CF6'),
('Local Government Navigation', 'local-government-navigation', 'Understanding how to effectively engage with local government', 'action_skills', 2, 'Building', '#F59E0B'),
('Power Structure Analysis', 'power-structure-analysis', 'Identifying who holds real power and how decisions are actually made', 'critical_thinking', 4, 'Network', '#EF4444'),
('Civic Communication', 'civic-communication', 'Effectively communicating with representatives and mobilizing others', 'action_skills', 3, 'MessageSquare', '#06B6D4'),
('Policy Impact Assessment', 'policy-impact-assessment', 'Understanding how policies affect real people and communities', 'critical_thinking', 3, 'TrendingUp', '#84CC16');

-- ============================================================================
-- HELPER FUNCTIONS FOR COLLECTIONS API
-- ============================================================================

-- Get skills summary for a collection (for API responses)
CREATE OR REPLACE FUNCTION get_collection_skills_summary(collection_uuid UUID)
RETURNS JSON AS $$
DECLARE
  skills_data JSON;
BEGIN
  SELECT json_build_object(
    'total_skills', COUNT(*),
    'primary_skills', COUNT(*) FILTER (WHERE primary_items > 0),
    'avg_difficulty', ROUND(AVG(difficulty_level), 1),
    'skills', json_agg(
      json_build_object(
        'skill_id', skill_id,
        'skill_name', skill_name,
        'skill_slug', skill_slug,
        'difficulty_level', difficulty_level,
        'total_items', total_items,
        'is_primary', primary_items > 0,
        'avg_proficiency', ROUND(avg_proficiency, 2)
      )
    )
  ) INTO skills_data
  FROM get_collection_skills(collection_uuid);
  
  RETURN COALESCE(skills_data, '{"total_skills": 0, "primary_skills": 0, "skills": []}'::JSON);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ADDITIONAL RPC FUNCTIONS FOR COLLECTIONS API FILTERING
-- ============================================================================

-- Get collections that contain specific skills
CREATE OR REPLACE FUNCTION get_collections_with_skills(skill_ids UUID[])
RETURNS TABLE (collection_id UUID) AS $$
BEGIN
  RETURN QUERY
  WITH collection_skills AS (
    SELECT DISTINCT 
      ci.collection_id,
      unnest(skill_ids) as required_skill_id
    FROM collection_items ci
    WHERE (
      -- From question_skills table
      (ci.item_type = 'question' AND EXISTS (
        SELECT 1 FROM question_skills qs 
        WHERE qs.question_id = ci.item_id 
        AND qs.skill_id = ANY(skill_ids)
      ))
      OR
      -- From content_item_skills table
      EXISTS (
        SELECT 1 FROM content_item_skills cis 
        WHERE cis.content_type = ci.item_type 
        AND cis.content_id = ci.item_id 
        AND cis.skill_id = ANY(skill_ids)
      )
    )
  )
  SELECT DISTINCT cs.collection_id
  FROM collection_skills cs
  GROUP BY cs.collection_id
  HAVING COUNT(DISTINCT cs.required_skill_id) = array_length(skill_ids, 1); -- Must have ALL requested skills
END;
$$ LANGUAGE plpgsql;

-- Get collections that contain skills in specific categories
CREATE OR REPLACE FUNCTION get_collections_with_skill_categories(categories TEXT[])
RETURNS TABLE (collection_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ci.collection_id
  FROM collection_items ci
  WHERE (
    -- From question_skills table
    (ci.item_type = 'question' AND EXISTS (
      SELECT 1 FROM question_skills qs 
      JOIN skills s ON qs.skill_id = s.id
      WHERE qs.question_id = ci.item_id 
      AND s.category = ANY(categories)
    ))
    OR
    -- From content_item_skills table
    EXISTS (
      SELECT 1 FROM content_item_skills cis 
      JOIN skills s ON cis.skill_id = s.id
      WHERE cis.content_type = ci.item_type 
      AND cis.content_id = ci.item_id 
      AND s.category = ANY(categories)
    )
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION HELPER: Link existing content to skills
-- ============================================================================
-- This helps populate content_item_skills for non-question content

-- Example: Link topics to skills based on categories
-- You can run this after the schema is created
/*
INSERT INTO content_item_skills (skill_id, content_type, content_id, proficiency_level, is_primary)
SELECT DISTINCT
  s.id as skill_id,
  'topic' as content_type,
  t.id as content_id,
  2 as proficiency_level, -- Default proficiency
  false as is_primary -- Default to non-primary
FROM question_topics t
CROSS JOIN skills s
WHERE t.categories::text ILIKE '%' || s.category || '%' -- Match category names
AND NOT EXISTS (
  SELECT 1 FROM content_item_skills cis 
  WHERE cis.skill_id = s.id 
  AND cis.content_type = 'topic' 
  AND cis.content_id = t.id
);
*/ 