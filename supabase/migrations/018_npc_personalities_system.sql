-- =============================================================================
-- NPC PERSONALITIES SYSTEM MIGRATION
-- =============================================================================
-- Creates comprehensive NPC system with user-like tracking and adaptive AI

BEGIN;

-- =============================================================================
-- NPC PERSONALITIES TABLE
-- =============================================================================

-- Main NPC personalities table (similar to users but for AI)
CREATE TABLE IF NOT EXISTS npc_personalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'civic_scholar', 'news_junkie'
  display_name VARCHAR(100) NOT NULL,
  emoji VARCHAR(10) NOT NULL DEFAULT '🤖',
  description TEXT,
  personality_type VARCHAR(50) NOT NULL, -- 'scholar', 'activist', 'newcomer', 'expert', etc.
  base_skill_level VARCHAR(20) NOT NULL DEFAULT 'intermediate' CHECK (base_skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  
  -- Core AI Behavior Parameters
  base_accuracy_min INTEGER NOT NULL DEFAULT 50 CHECK (base_accuracy_min >= 0 AND base_accuracy_min <= 100),
  base_accuracy_max INTEGER NOT NULL DEFAULT 80 CHECK (base_accuracy_max >= 0 AND base_accuracy_max <= 100),
  response_time_min INTEGER NOT NULL DEFAULT 5, -- seconds
  response_time_max INTEGER NOT NULL DEFAULT 15, -- seconds
  confidence_level DECIMAL(3,2) NOT NULL DEFAULT 0.7 CHECK (confidence_level >= 0 AND confidence_level <= 1),
  consistency_factor DECIMAL(3,2) NOT NULL DEFAULT 0.8 CHECK (consistency_factor >= 0 AND consistency_factor <= 1),
  
  -- Learning & Adaptation
  learning_enabled BOOLEAN NOT NULL DEFAULT true,
  adaptation_rate DECIMAL(3,2) NOT NULL DEFAULT 0.1 CHECK (adaptation_rate >= 0 AND adaptation_rate <= 1),
  max_skill_drift INTEGER NOT NULL DEFAULT 15, -- How much accuracy can change from base
  
  -- Personality Traits
  chattiness_level INTEGER NOT NULL DEFAULT 3 CHECK (chattiness_level >= 1 AND chattiness_level <= 5),
  encouragement_style VARCHAR(20) NOT NULL DEFAULT 'supportive' CHECK (encouragement_style IN ('supportive', 'competitive', 'analytical', 'casual', 'formal')),
  humor_level INTEGER NOT NULL DEFAULT 2 CHECK (humor_level >= 1 AND humor_level <= 5),
  
  -- Status & Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_accuracy_range CHECK (base_accuracy_min <= base_accuracy_max),
  CONSTRAINT check_response_time_range CHECK (response_time_min <= response_time_max)
);

-- =============================================================================
-- NPC SKILL SPECIALIZATIONS
-- =============================================================================

-- NPC category specializations (what they're good/bad at)
CREATE TABLE IF NOT EXISTS npc_category_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id UUID NOT NULL REFERENCES npc_personalities(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  specialization_type VARCHAR(20) NOT NULL CHECK (specialization_type IN ('strength', 'weakness', 'neutral')),
  modifier_percentage INTEGER NOT NULL DEFAULT 0, -- +/- percentage to base accuracy
  confidence_modifier DECIMAL(3,2) NOT NULL DEFAULT 0, -- +/- to confidence in this category
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(npc_id, category),
  CONSTRAINT check_modifier_range CHECK (modifier_percentage >= -50 AND modifier_percentage <= 50)
);

-- =============================================================================
-- NPC PERFORMANCE TRACKING (User-like analytics)
-- =============================================================================

-- Track NPC performance like real users for comparative analytics
CREATE TABLE IF NOT EXISTS npc_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id UUID NOT NULL REFERENCES npc_personalities(id) ON DELETE CASCADE,
  topic_id VARCHAR(255) NOT NULL,
  multiplayer_room_id UUID REFERENCES multiplayer_rooms(id) ON DELETE SET NULL,
  
  -- Performance Metrics (like user_quiz_attempts)
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_questions > 0 THEN (correct_answers::DECIMAL / total_questions) * 100 
      ELSE 0 
    END
  ) STORED,
  
  -- AI-Specific Metrics
  difficulty_adjustment DECIMAL(3,2) NOT NULL DEFAULT 0, -- How much AI adjusted during quiz
  confidence_average DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  learning_points_gained INTEGER NOT NULL DEFAULT 0,
  
  -- Context
  human_opponents_count INTEGER NOT NULL DEFAULT 0,
  average_human_score DECIMAL(5,2),
  placement_rank INTEGER, -- 1st, 2nd, 3rd, etc.
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN NOT NULL DEFAULT false
);

-- =============================================================================
-- NPC QUESTION RESPONSES (Detailed tracking)
-- =============================================================================

-- Track individual question responses for learning
CREATE TABLE IF NOT EXISTS npc_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id UUID NOT NULL REFERENCES npc_personalities(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES npc_quiz_attempts(id) ON DELETE CASCADE,
  question_id VARCHAR(255) NOT NULL,
  question_category VARCHAR(100),
  question_difficulty INTEGER,
  
  -- Response Details
  selected_answer TEXT,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  confidence_level DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  response_time_seconds INTEGER NOT NULL,
  
  -- AI Decision Making
  base_accuracy_used DECIMAL(3,2) NOT NULL,
  category_modifier_applied INTEGER NOT NULL DEFAULT 0,
  difficulty_modifier_applied INTEGER NOT NULL DEFAULT 0,
  random_variance_applied DECIMAL(3,2) NOT NULL DEFAULT 0,
  
  -- Learning Context
  human_responses_seen INTEGER NOT NULL DEFAULT 0, -- How many humans answered before AI
  learning_weight DECIMAL(3,2) NOT NULL DEFAULT 1.0, -- How much this response affects learning
  
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- NPC LEARNING PROGRESSION
-- =============================================================================

-- Track how NPCs improve over time (like user skill progression)
CREATE TABLE IF NOT EXISTS npc_learning_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id UUID NOT NULL REFERENCES npc_personalities(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  
  -- Skill Metrics
  current_accuracy DECIMAL(5,2) NOT NULL DEFAULT 50,
  questions_seen INTEGER NOT NULL DEFAULT 0,
  correct_responses INTEGER NOT NULL DEFAULT 0,
  total_response_time INTEGER NOT NULL DEFAULT 0, -- cumulative seconds
  
  -- Learning Analytics
  learning_velocity DECIMAL(5,2) NOT NULL DEFAULT 0, -- How fast they're improving
  plateau_indicator DECIMAL(3,2) NOT NULL DEFAULT 0, -- Whether they've stopped improving
  confidence_trend DECIMAL(3,2) NOT NULL DEFAULT 0, -- Getting more/less confident
  
  -- Comparative Performance
  vs_humans_win_rate DECIMAL(5,2) NOT NULL DEFAULT 50, -- Win rate against human players
  avg_human_accuracy DECIMAL(5,2), -- Average human performance in this category
  percentile_rank INTEGER, -- Where NPC ranks vs humans (1-100)
  
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(npc_id, category)
);

-- =============================================================================
-- NPC CHAT MESSAGES & PERSONALITY
-- =============================================================================

-- Dynamic chat messages based on context and personality
CREATE TABLE IF NOT EXISTS npc_chat_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id UUID NOT NULL REFERENCES npc_personalities(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL, -- 'on_join', 'on_correct', 'on_incorrect', 'on_win', 'on_lose', etc.
  context_filter JSONB, -- Conditions for when to use this message
  
  message_template TEXT NOT NULL,
  variables JSONB, -- Variables that can be substituted in template
  
  -- Usage Analytics
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Personality Matching
  mood_tags TEXT[], -- ['encouraging', 'competitive', 'analytical', etc.]
  skill_level_tags TEXT[], -- ['beginner_friendly', 'expert_level', etc.]
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- COMPARATIVE ANALYTICS VIEWS
-- =============================================================================

-- View for comparing NPC vs Human performance
CREATE OR REPLACE VIEW npc_vs_human_analytics AS
SELECT 
  np.npc_code,
  np.display_name,
  np.personality_type,
  np.base_skill_level,
  
  -- NPC Performance
  COUNT(nqa.id) as total_quizzes,
  AVG(nqa.accuracy_percentage) as avg_accuracy,
  AVG(nqa.time_spent_seconds / nqa.total_questions) as avg_time_per_question,
  AVG(nqa.placement_rank) as avg_placement,
  
  -- vs Human Comparison
  AVG(nqa.average_human_score) as avg_human_opponent_score,
  AVG(CASE WHEN nqa.score > nqa.average_human_score THEN 1 ELSE 0 END) as human_win_rate,
  
  -- Learning Indicators
  (AVG(nqa.accuracy_percentage) - np.base_accuracy_min) as accuracy_improvement,
  STDDEV(nqa.accuracy_percentage) as consistency_score,
  
  -- Recent Performance (last 30 days)
  AVG(CASE WHEN nqa.completed_at > NOW() - INTERVAL '30 days' 
           THEN nqa.accuracy_percentage END) as recent_accuracy,
  COUNT(CASE WHEN nqa.completed_at > NOW() - INTERVAL '30 days' 
             THEN 1 END) as recent_quiz_count

FROM npc_personalities np
LEFT JOIN npc_quiz_attempts nqa ON np.id = nqa.npc_id AND nqa.is_completed = true
GROUP BY np.id, np.npc_code, np.display_name, np.personality_type, np.base_skill_level;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_npc_personalities_active ON npc_personalities(is_active, personality_type);
CREATE INDEX IF NOT EXISTS idx_npc_personalities_skill ON npc_personalities(base_skill_level);
CREATE INDEX IF NOT EXISTS idx_npc_specializations_category ON npc_category_specializations(category, specialization_type);
CREATE INDEX IF NOT EXISTS idx_npc_quiz_attempts_npc ON npc_quiz_attempts(npc_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_npc_quiz_attempts_topic ON npc_quiz_attempts(topic_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_npc_quiz_attempts_room ON npc_quiz_attempts(multiplayer_room_id);
CREATE INDEX IF NOT EXISTS idx_npc_question_responses_npc ON npc_question_responses(npc_id, answered_at);
CREATE INDEX IF NOT EXISTS idx_npc_question_responses_category ON npc_question_responses(question_category, is_correct);
CREATE INDEX IF NOT EXISTS idx_npc_learning_progression_category ON npc_learning_progression(category, last_updated);
CREATE INDEX IF NOT EXISTS idx_npc_chat_templates_trigger ON npc_chat_templates(trigger_type, is_active);

-- =============================================================================
-- FUNCTIONS FOR NPC MANAGEMENT
-- =============================================================================

-- Function to get NPC performance in a category
CREATE OR REPLACE FUNCTION get_npc_category_performance(
  p_npc_id UUID,
  p_category VARCHAR(100)
)
RETURNS TABLE(
  current_accuracy DECIMAL(5,2),
  questions_answered INTEGER,
  vs_human_winrate DECIMAL(5,2),
  improvement_trend DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nlp.current_accuracy,
    nlp.questions_seen,
    nlp.vs_humans_win_rate,
    nlp.learning_velocity
  FROM npc_learning_progression nlp
  WHERE nlp.npc_id = p_npc_id 
    AND nlp.category = p_category;
END;
$$ LANGUAGE plpgsql;

-- Function to update NPC learning after quiz
CREATE OR REPLACE FUNCTION update_npc_learning(
  p_npc_id UUID,
  p_category VARCHAR(100),
  p_accuracy DECIMAL(5,2),
  p_response_time INTEGER,
  p_vs_human_performance DECIMAL(5,2) DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  current_data RECORD;
  new_accuracy DECIMAL(5,2);
  learning_rate DECIMAL(3,2);
BEGIN
  -- Get current learning data
  SELECT * INTO current_data
  FROM npc_learning_progression
  WHERE npc_id = p_npc_id AND category = p_category;
  
  -- Get NPC's learning rate
  SELECT adaptation_rate INTO learning_rate
  FROM npc_personalities
  WHERE id = p_npc_id;
  
  IF current_data IS NULL THEN
    -- First time seeing this category
    INSERT INTO npc_learning_progression (
      npc_id, category, current_accuracy, questions_seen, 
      correct_responses, total_response_time, vs_humans_win_rate
    ) VALUES (
      p_npc_id, p_category, p_accuracy, 1,
      CASE WHEN p_accuracy > 0 THEN 1 ELSE 0 END,
      p_response_time,
      COALESCE(p_vs_human_performance, 50)
    );
  ELSE
    -- Update existing progression with learning
    new_accuracy := current_data.current_accuracy + 
                   (learning_rate * (p_accuracy - current_data.current_accuracy));
    
    UPDATE npc_learning_progression SET
      current_accuracy = new_accuracy,
      questions_seen = questions_seen + 1,
      correct_responses = correct_responses + CASE WHEN p_accuracy > 0 THEN 1 ELSE 0 END,
      total_response_time = total_response_time + p_response_time,
      vs_humans_win_rate = CASE 
        WHEN p_vs_human_performance IS NOT NULL 
        THEN (vs_humans_win_rate * 0.9) + (p_vs_human_performance * 0.1)
        ELSE vs_humans_win_rate
      END,
      learning_velocity = (new_accuracy - current_data.current_accuracy),
      last_updated = NOW()
    WHERE npc_id = p_npc_id AND category = p_category;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SEED DATA - STARTER NPC PERSONALITIES
-- =============================================================================

-- Insert the basic NPC personalities with diverse emojis
INSERT INTO npc_personalities (
  npc_code, display_name, emoji, description, personality_type, base_skill_level,
  base_accuracy_min, base_accuracy_max, response_time_min, response_time_max,
  confidence_level, consistency_factor, chattiness_level, encouragement_style, humor_level
) VALUES 
-- Beginner Level
(
  'curious_newcomer', 'Riley the Curious Newcomer', '🧑🏾‍🎓',
  'New to politics but eager to learn and asks great questions. Makes relatable mistakes but shows genuine enthusiasm for civic engagement.',
  'newcomer', 'beginner', 35, 60, 10, 20, 0.4, 0.6, 4, 'supportive', 3
),
(
  'young_voter', 'Alex the Young Voter', '👨🏻‍💼',
  'First-time voter trying to understand the system. Knows social media politics but struggles with institutional details.',
  'newcomer', 'beginner', 40, 65, 8, 18, 0.5, 0.7, 5, 'casual', 4
),

-- Intermediate Level  
(
  'news_junkie', 'Sam the News Junkie', '👩🏻‍💻',
  'Follows politics religiously and knows all the latest developments but sometimes mixes up historical details.',
  'enthusiast', 'intermediate', 60, 80, 5, 12, 0.9, 0.7, 3, 'competitive', 2
),
(
  'local_activist', 'Jordan the Local Activist', '👩🏿‍🏫',
  'Passionate about community issues and local politics. Strong on grassroots organizing but still learning federal systems.',
  'activist', 'intermediate', 55, 75, 6, 14, 0.7, 0.8, 4, 'supportive', 3
),
(
  'retired_teacher', 'Ms. Chen the Civics Teacher', '👩🏻‍🏫',
  'Retired high school civics teacher with solid foundational knowledge. Great at explaining concepts but sometimes outdated on current events.',
  'educator', 'intermediate', 65, 85, 7, 13, 0.8, 0.9, 3, 'analytical', 2
),

-- Advanced Level
(
  'civic_scholar', 'Dr. Martinez the Civic Scholar', '👨🏽‍🎓',
  'Political science PhD who knows theory inside and out but sometimes overthinks simple questions.',
  'scholar', 'advanced', 75, 90, 8, 15, 0.8, 0.9, 2, 'analytical', 1
),
(
  'policy_analyst', 'Taylor the Policy Analyst', '🧑🏼‍💼',
  'Works in think tank, great at policy details and data analysis. Struggles with pop culture aspects of politics.',
  'analyst', 'advanced', 70, 88, 6, 11, 0.85, 0.85, 2, 'analytical', 1
),
(
  'campaign_veteran', 'Morgan the Campaign Veteran', '👩🏽‍💼',
  'Worked on multiple campaigns, knows the practical side of politics. Great at strategy, weaker on legal technicalities.',
  'practitioner', 'advanced', 72, 87, 5, 10, 0.9, 0.8, 3, 'competitive', 3
),

-- Expert Level
(
  'judge_thompson', 'Judge Thompson', '👨🏿‍⚖️',
  'Retired federal judge with deep constitutional knowledge. Incredibly accurate but sometimes slow and overly formal.',
  'expert', 'expert', 85, 95, 10, 18, 0.95, 0.95, 1, 'formal', 1
),
(
  'prof_historian', 'Prof. Williams the Historian', '👩🏼‍🏫',
  'Political history professor who sees patterns across centuries. Excellent historical context but can be pedantic.',
  'historian', 'expert', 80, 93, 12, 20, 0.9, 0.9, 2, 'formal', 2
);

-- =============================================================================
-- SEED NPC SPECIALIZATIONS
-- =============================================================================

-- Riley the Curious Newcomer - Strengths and weaknesses
INSERT INTO npc_category_specializations (npc_id, category, specialization_type, modifier_percentage, confidence_modifier)
SELECT id, 'basic_civics', 'strength', 10, 0.1 FROM npc_personalities WHERE npc_code = 'curious_newcomer'
UNION ALL
SELECT id, 'government_structure', 'weakness', -15, -0.2 FROM npc_personalities WHERE npc_code = 'curious_newcomer'
UNION ALL  
SELECT id, 'current_events', 'weakness', -20, -0.3 FROM npc_personalities WHERE npc_code = 'curious_newcomer'
UNION ALL
SELECT id, 'policy_analysis', 'weakness', -25, -0.3 FROM npc_personalities WHERE npc_code = 'curious_newcomer';

-- Sam the News Junkie - Current events expert, weak on structure
INSERT INTO npc_category_specializations (npc_id, category, specialization_type, modifier_percentage, confidence_modifier)
SELECT id, 'current_events', 'strength', 20, 0.3 FROM npc_personalities WHERE npc_code = 'news_junkie'
UNION ALL
SELECT id, 'elections', 'strength', 15, 0.2 FROM npc_personalities WHERE npc_code = 'news_junkie'
UNION ALL
SELECT id, 'media_literacy', 'strength', 10, 0.1 FROM npc_personalities WHERE npc_code = 'news_junkie'
UNION ALL
SELECT id, 'government_structure', 'weakness', -15, -0.2 FROM npc_personalities WHERE npc_code = 'news_junkie'
UNION ALL
SELECT id, 'historical_context', 'weakness', -20, -0.2 FROM npc_personalities WHERE npc_code = 'news_junkie';

-- Dr. Martinez the Civic Scholar - Theory expert
INSERT INTO npc_category_specializations (npc_id, category, specialization_type, modifier_percentage, confidence_modifier)
SELECT id, 'government_structure', 'strength', 25, 0.3 FROM npc_personalities WHERE npc_code = 'civic_scholar'
UNION ALL
SELECT id, 'constitutional_law', 'strength', 20, 0.3 FROM npc_personalities WHERE npc_code = 'civic_scholar'
UNION ALL
SELECT id, 'policy_analysis', 'strength', 15, 0.2 FROM npc_personalities WHERE npc_code = 'civic_scholar'
UNION ALL
SELECT id, 'current_events', 'weakness', -10, -0.1 FROM npc_personalities WHERE npc_code = 'civic_scholar'
UNION ALL
SELECT id, 'local_politics', 'weakness', -15, -0.2 FROM npc_personalities WHERE npc_code = 'civic_scholar';

-- Judge Thompson - Constitutional expert
INSERT INTO npc_category_specializations (npc_id, category, specialization_type, modifier_percentage, confidence_modifier)
SELECT id, 'constitutional_law', 'strength', 30, 0.4 FROM npc_personalities WHERE npc_code = 'judge_thompson'
UNION ALL
SELECT id, 'legal_concepts', 'strength', 25, 0.3 FROM npc_personalities WHERE npc_code = 'judge_thompson'
UNION ALL
SELECT id, 'government_structure', 'strength', 20, 0.3 FROM npc_personalities WHERE npc_code = 'judge_thompson'
UNION ALL
SELECT id, 'pop_culture_politics', 'weakness', -30, -0.4 FROM npc_personalities WHERE npc_code = 'judge_thompson'
UNION ALL
SELECT id, 'social_media_trends', 'weakness', -35, -0.5 FROM npc_personalities WHERE npc_code = 'judge_thompson';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE npc_personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_category_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_learning_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_chat_templates ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active NPC personalities
CREATE POLICY "Public can view active NPCs"
  ON npc_personalities FOR SELECT
  USING (is_active = true);

-- Allow public read access to NPC specializations
CREATE POLICY "Public can view NPC specializations"
  ON npc_category_specializations FOR SELECT
  USING (true);

-- Allow authenticated users to view NPC performance data
CREATE POLICY "Users can view NPC performance"
  ON npc_quiz_attempts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view NPC responses"
  ON npc_question_responses FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view NPC learning progression"
  ON npc_learning_progression FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow public read access to chat templates
CREATE POLICY "Public can view NPC chat templates"
  ON npc_chat_templates FOR SELECT
  USING (is_active = true);

-- =============================================================================
-- REALTIME PUBLICATION
-- =============================================================================

-- Enable realtime for NPC performance tracking
ALTER PUBLICATION supabase_realtime ADD TABLE npc_quiz_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE npc_question_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE npc_learning_progression;

COMMIT;

-- Add helpful comments
COMMENT ON TABLE npc_personalities IS 'AI personalities with human-like learning and performance tracking';
COMMENT ON TABLE npc_category_specializations IS 'Subject matter expertise and weaknesses for each NPC';
COMMENT ON TABLE npc_quiz_attempts IS 'NPC quiz performance tracking (mirrors user_quiz_attempts)';
COMMENT ON TABLE npc_question_responses IS 'Detailed NPC question responses for learning algorithms';
COMMENT ON TABLE npc_learning_progression IS 'How NPCs improve over time in different categories';
COMMENT ON TABLE npc_chat_templates IS 'Dynamic chat messages based on context and personality';
COMMENT ON VIEW npc_vs_human_analytics IS 'Comparative analytics showing NPC vs human performance'; 