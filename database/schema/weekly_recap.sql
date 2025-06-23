-- Weekly recap collections system
-- Automatically generates collections based on weekly engagement and current events

-- Track weekly content performance for recap generation
CREATE TABLE weekly_content_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  content_id UUID NOT NULL,
  
  -- Engagement metrics
  total_views INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2) DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  user_ratings_avg DECIMAL(3,2) DEFAULT 0,
  user_ratings_count INTEGER DEFAULT 0,
  
  -- Current events relevance
  news_mentions INTEGER DEFAULT 0,
  trending_score INTEGER DEFAULT 0, -- 1-100 based on various factors
  civic_importance_score INTEGER DEFAULT 0, -- 1-100 how important for civic education
  
  -- Social engagement
  shares_count INTEGER DEFAULT 0,
  discussions_started INTEGER DEFAULT 0,
  follow_up_actions INTEGER DEFAULT 0, -- Number of users who took civic action
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(week_start_date, content_type, content_id)
);

-- Weekly recap collection configurations
CREATE TABLE weekly_recap_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_name VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  
  -- Generation rules
  max_items_per_collection INTEGER DEFAULT 10,
  min_engagement_threshold INTEGER DEFAULT 5, -- Minimum views to be considered
  min_completion_rate DECIMAL(5,2) DEFAULT 20.00, -- Minimum completion rate
  
  -- Content mix rules
  topics_percentage INTEGER DEFAULT 40, -- 40% topics
  questions_percentage INTEGER DEFAULT 35, -- 35% questions  
  glossary_percentage INTEGER DEFAULT 25, -- 25% glossary terms
  
  -- Weighting factors for selection algorithm
  engagement_weight DECIMAL(3,2) DEFAULT 0.40,
  current_events_weight DECIMAL(3,2) DEFAULT 0.30,
  user_rating_weight DECIMAL(3,2) DEFAULT 0.20,
  civic_action_weight DECIMAL(3,2) DEFAULT 0.10,
  
  -- Collection metadata templates
  title_template VARCHAR(200) DEFAULT 'Week of {week_start} - {theme}',
  description_template TEXT DEFAULT 'This week''s most engaging civic education content, featuring {top_themes}',
  emoji_pool VARCHAR(100) DEFAULT '📅,📊,🗳️,📰,⚖️,🏛️,🌟',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated weekly recap collections tracking
CREATE TABLE weekly_recap_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  config_used UUID REFERENCES weekly_recap_configs(id),
  
  -- Generation metadata
  generation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_content_analyzed INTEGER DEFAULT 0,
  content_selected INTEGER DEFAULT 0,
  avg_engagement_score DECIMAL(5,2) DEFAULT 0,
  top_themes VARCHAR(500)[], -- Array of trending themes
  
  -- Performance tracking
  views_count INTEGER DEFAULT 0,
  completions_count INTEGER DEFAULT 0,
  user_feedback_avg DECIMAL(3,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(week_start_date, config_used)
);

-- Insert default configuration
INSERT INTO weekly_recap_configs (
  config_name, 
  title_template,
  description_template,
  emoji_pool
) VALUES (
  'default_weekly_recap',
  'Week of {week_start}: {theme}',
  'The week''s most impactful civic education content. Featuring {item_count} carefully selected topics, questions, and insights based on engagement and current events relevance.',
  '📅,📊,🗳️,📰,⚖️,🏛️,🌟,📈,🔥,✨'
);

-- Function to calculate content score for weekly recap selection
CREATE OR REPLACE FUNCTION calculate_weekly_content_score(
  engagement_score DECIMAL,
  current_events_score DECIMAL,
  user_rating_score DECIMAL,
  civic_action_score DECIMAL,
  config_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  config_weights RECORD;
  final_score DECIMAL;
BEGIN
  -- Get weighting configuration
  SELECT 
    engagement_weight,
    current_events_weight,
    user_rating_weight,
    civic_action_weight
  INTO config_weights
  FROM weekly_recap_configs
  WHERE id = config_id;
  
  -- Calculate weighted score
  final_score := (
    (engagement_score * config_weights.engagement_weight) +
    (current_events_score * config_weights.current_events_weight) +
    (user_rating_score * config_weights.user_rating_weight) +
    (civic_action_score * config_weights.civic_action_weight)
  );
  
  RETURN ROUND(final_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get top themes for a given week
CREATE OR REPLACE FUNCTION get_weekly_top_themes(
  week_start DATE,
  week_end DATE,
  max_themes INTEGER DEFAULT 3
) RETURNS VARCHAR(500)[] AS $$
DECLARE
  themes VARCHAR(500)[];
BEGIN
  -- This would analyze categories, tags, and content to identify trending themes
  -- For now, returning a sample implementation
  SELECT ARRAY(
    SELECT DISTINCT unnest(categories)
    FROM question_topics qt
    JOIN weekly_content_metrics wcm ON (wcm.content_type = 'topic' AND wcm.content_id = qt.id::uuid)
    WHERE wcm.week_start_date = week_start
      AND wcm.trending_score > 50
    ORDER BY COUNT(*) DESC
    LIMIT max_themes
  ) INTO themes;
  
  -- Fallback if no trending themes found
  IF array_length(themes, 1) IS NULL THEN
    themes := ARRAY['civic engagement', 'current events', 'democracy'];
  END IF;
  
  RETURN themes;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX idx_weekly_metrics_date_range ON weekly_content_metrics(week_start_date, week_end_date);
CREATE INDEX idx_weekly_metrics_trending ON weekly_content_metrics(trending_score DESC, civic_importance_score DESC);
CREATE INDEX idx_weekly_recap_collections_date ON weekly_recap_collections(week_start_date);

-- Function to update weekly metrics (called by triggers or scheduled jobs)
CREATE OR REPLACE FUNCTION update_weekly_content_metrics(target_week_start DATE DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  week_start_date DATE;
  week_end_date DATE;
  metrics_updated INTEGER := 0;
  content_record RECORD;
BEGIN
  -- Use provided date or default to current week
  IF target_week_start IS NULL THEN
    week_start_date := date_trunc('week', CURRENT_DATE);
  ELSE
    week_start_date := target_week_start;
  END IF;
  
  week_end_date := week_start_date + INTERVAL '6 days';
  
  -- Update metrics for topics
  FOR content_record IN 
    SELECT 
      qt.id,
      'topic' as content_type,
      -- These would come from actual analytics tables in production
      COALESCE(random() * 100, 0) as total_views,
      COALESCE(random() * 50, 0) as total_completions,
      COALESCE(random() * 5, 3) as user_ratings_avg,
      COALESCE(random() * 20, 5) as user_ratings_count,
      COALESCE(random() * 100, 30) as trending_score,
      COALESCE(random() * 100, 50) as civic_importance_score
    FROM question_topics qt
    WHERE qt.created_at >= week_start_date 
      AND qt.created_at <= week_end_date + INTERVAL '1 day'
      AND qt.is_active = true
  LOOP
    INSERT INTO weekly_content_metrics (
      week_start_date, week_end_date, content_type, content_id,
      total_views, total_completions, user_ratings_avg, user_ratings_count,
      trending_score, civic_importance_score
    ) VALUES (
      week_start_date, week_end_date, content_record.content_type, content_record.id,
      content_record.total_views, content_record.total_completions,
      content_record.user_ratings_avg, content_record.user_ratings_count,
      content_record.trending_score, content_record.civic_importance_score
    ) ON CONFLICT (week_start_date, content_type, content_id)
    DO UPDATE SET
      total_views = EXCLUDED.total_views,
      total_completions = EXCLUDED.total_completions,
      user_ratings_avg = EXCLUDED.user_ratings_avg,
      user_ratings_count = EXCLUDED.user_ratings_count,
      trending_score = EXCLUDED.trending_score,
      civic_importance_score = EXCLUDED.civic_importance_score;
    
    metrics_updated := metrics_updated + 1;
  END LOOP;
  
  RETURN metrics_updated;
END;
$$ LANGUAGE plpgsql; 