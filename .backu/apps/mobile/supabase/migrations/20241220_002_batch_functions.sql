BEGIN;

-- ============================================================================
-- BATCH STATISTICS FUNCTIONS
-- ============================================================================

-- Get category statistics in a single query
CREATE OR REPLACE FUNCTION get_category_stats_batch(category_ids UUID[])
RETURNS TABLE(
  category_id UUID,
  topic_count INTEGER,
  question_count INTEGER,
  active_topics INTEGER,
  avg_difficulty NUMERIC
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH category_topics AS (
    SELECT 
      cat_id,
      COUNT(qt.topic_id)::INTEGER as topics,
      COUNT(CASE WHEN qt.is_active THEN 1 END)::INTEGER as active_topics
    FROM unnest(category_ids) AS cat_id
    LEFT JOIN question_topics qt ON qt.categories @> jsonb_build_array(cat_id::text)
    GROUP BY cat_id
  ),
  category_questions AS (
    SELECT 
      cat_id,
      COUNT(q.id)::INTEGER as questions,
      AVG(q.difficulty_level) as avg_diff
    FROM unnest(category_ids) AS cat_id
    LEFT JOIN question_topics qt ON qt.categories @> jsonb_build_array(cat_id::text) AND qt.is_active = true
    LEFT JOIN questions q ON q.topic_id = qt.topic_id AND q.is_active = true
    GROUP BY cat_id
  )
  SELECT 
    ct.cat_id::UUID,
    COALESCE(ct.topics, 0)::INTEGER,
    COALESCE(cq.questions, 0)::INTEGER,
    COALESCE(ct.active_topics, 0)::INTEGER,
    COALESCE(cq.avg_diff, 1.0)::NUMERIC
  FROM category_topics ct
  LEFT JOIN category_questions cq ON ct.cat_id = cq.cat_id;
END;
$$ LANGUAGE plpgsql;

-- Get topics with stats for pagination
CREATE OR REPLACE FUNCTION get_topics_with_stats_batch(
  p_category_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  topic_id UUID,
  topic_title TEXT,
  description TEXT,
  categories JSONB,
  question_count INTEGER,
  difficulty_avg NUMERIC,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  primary_category_name TEXT,
  primary_category_emoji TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH topic_questions AS (
    SELECT 
      qt.topic_id,
      qt.topic_title,
      qt.description,
      qt.categories,
      qt.is_active,
      qt.created_at,
      COUNT(q.id)::INTEGER as question_count,
      AVG(q.difficulty_level) as difficulty_avg
    FROM question_topics qt
    LEFT JOIN questions q ON q.topic_id = qt.topic_id AND q.is_active = true
    WHERE 
      qt.is_active = true
      AND (p_category_id IS NULL OR qt.categories @> jsonb_build_array(p_category_id::text))
    GROUP BY qt.topic_id, qt.topic_title, qt.description, qt.categories, qt.is_active, qt.created_at
    ORDER BY qt.topic_title
    LIMIT p_limit
    OFFSET p_offset
  ),
  topic_categories AS (
    SELECT 
      tq.topic_id,
      c.name as category_name,
      c.emoji as category_emoji,
      ROW_NUMBER() OVER (PARTITION BY tq.topic_id ORDER BY c.display_order) as rn
    FROM topic_questions tq
    CROSS JOIN jsonb_array_elements_text(tq.categories) AS cat_id
    JOIN categories c ON c.id::text = cat_id AND c.is_active = true
  )
  SELECT 
    tq.topic_id,
    tq.topic_title,
    tq.description,
    tq.categories,
    tq.question_count,
    COALESCE(tq.difficulty_avg, 1.0) as difficulty_avg,
    tq.is_active,
    tq.created_at,
    tc.category_name as primary_category_name,
    tc.category_emoji as primary_category_emoji
  FROM topic_questions tq
  LEFT JOIN topic_categories tc ON tc.topic_id = tq.topic_id AND tc.rn = 1;
END;
$$ LANGUAGE plpgsql;

-- Get user progress summary
CREATE OR REPLACE FUNCTION get_user_progress_summary(p_user_id UUID)
RETURNS TABLE(
  total_quizzes INTEGER,
  avg_score NUMERIC,
  total_time_minutes INTEGER,
  current_streak INTEGER,
  max_streak INTEGER,
  favorite_categories JSONB,
  recent_activity JSONB,
  performance_trend JSONB
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(*)::INTEGER as total_quizzes,
      AVG(CASE 
        WHEN total_questions > 0 THEN (correct_answers::NUMERIC / total_questions * 100) 
        ELSE 0 
      END) as avg_score,
      (SUM(time_spent_seconds) / 60)::INTEGER as total_time_minutes,
      COALESCE(MAX(streak_count), 0)::INTEGER as current_streak,
      COALESCE(MAX(streak_count), 0)::INTEGER as max_streak
    FROM user_quiz_attempts
    WHERE user_id = p_user_id
  ),
  favorite_cats AS (
    SELECT jsonb_agg(DISTINCT topic_id ORDER BY COUNT(*) DESC) as categories
    FROM user_quiz_attempts
    WHERE user_id = p_user_id AND topic_id IS NOT NULL
    GROUP BY topic_id
    LIMIT 5
  ),
  recent_acts AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', started_at::date,
        'game_mode', game_mode,
        'score', CASE 
          WHEN total_questions > 0 THEN (correct_answers::NUMERIC / total_questions * 100) 
          ELSE 0 
        END,
        'time_seconds', time_spent_seconds
      ) ORDER BY started_at DESC
    ) as activities
    FROM user_quiz_attempts
    WHERE user_id = p_user_id 
      AND started_at >= NOW() - INTERVAL '30 days'
    LIMIT 20
  ),
  performance_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'week', date_trunc('week', started_at),
        'avg_score', AVG(CASE 
          WHEN total_questions > 0 THEN (correct_answers::NUMERIC / total_questions * 100) 
          ELSE 0 
        END),
        'quiz_count', COUNT(*)
      ) ORDER BY date_trunc('week', started_at) DESC
    ) as trend
    FROM user_quiz_attempts
    WHERE user_id = p_user_id 
      AND started_at >= NOW() - INTERVAL '12 weeks'
    GROUP BY date_trunc('week', started_at)
    LIMIT 12
  )
  SELECT 
    us.total_quizzes,
    us.avg_score,
    us.total_time_minutes,
    us.current_streak,
    us.max_streak,
    COALESCE(fc.categories, '[]'::jsonb) as favorite_categories,
    COALESCE(ra.activities, '[]'::jsonb) as recent_activity,
    COALESCE(pd.trend, '[]'::jsonb) as performance_trend
  FROM user_stats us
  CROSS JOIN favorite_cats fc
  CROSS JOIN recent_acts ra
  CROSS JOIN performance_data pd;
END;
$$ LANGUAGE plpgsql;

-- Get questions batch for topics (optimized for quiz generation)
CREATE OR REPLACE FUNCTION get_questions_batch(
  p_topic_ids UUID[],
  p_limit_per_topic INTEGER DEFAULT 10,
  p_randomize BOOLEAN DEFAULT false
)
RETURNS TABLE(
  topic_id UUID,
  question_id UUID,
  question TEXT,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  difficulty_level INTEGER,
  sources JSONB
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_randomize THEN
    RETURN QUERY
    SELECT 
      q.topic_id,
      q.id as question_id,
      q.question,
      jsonb_build_array(q.option_a, q.option_b, q.option_c, q.option_d) as options,
      q.correct_answer,
      q.explanation,
      q.difficulty_level,
      COALESCE(q.sources, '{}'::jsonb) as sources
    FROM (
      SELECT 
        q.*,
        ROW_NUMBER() OVER (PARTITION BY q.topic_id ORDER BY RANDOM()) as rn
      FROM questions q
      WHERE q.topic_id = ANY(p_topic_ids)
        AND q.is_active = true
    ) q
    WHERE q.rn <= p_limit_per_topic
    ORDER BY q.topic_id, RANDOM();
  ELSE
    RETURN QUERY
    SELECT 
      q.topic_id,
      q.id as question_id,
      q.question,
      jsonb_build_array(q.option_a, q.option_b, q.option_c, q.option_d) as options,
      q.correct_answer,
      q.explanation,
      q.difficulty_level,
      COALESCE(q.sources, '{}'::jsonb) as sources
    FROM (
      SELECT 
        q.*,
        ROW_NUMBER() OVER (PARTITION BY q.topic_id ORDER BY q.difficulty_level, q.id) as rn
      FROM questions q
      WHERE q.topic_id = ANY(p_topic_ids)
        AND q.is_active = true
    ) q
    WHERE q.rn <= p_limit_per_topic
    ORDER BY q.topic_id, q.difficulty_level, q.id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_category_stats_batch(UUID[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_topics_with_stats_batch(UUID, INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_progress_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_questions_batch(UUID[], INTEGER, BOOLEAN) TO authenticated, anon;

COMMIT; 