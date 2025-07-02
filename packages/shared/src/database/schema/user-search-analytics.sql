-- ============================================================================
-- USER SEARCH & ACTIVITY ANALYTICS SCHEMA
-- Comprehensive tracking for search behavior, content views, and learning patterns
-- ============================================================================

-- ============================================================================
-- USER SEARCH HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_token TEXT, -- For anonymous users
  session_id TEXT NOT NULL,
  
  -- Search details
  search_query TEXT NOT NULL,
  search_type VARCHAR(50) DEFAULT 'general' CHECK (search_type IN (
    'general', 'collection', 'topic', 'quick_search', 'voice_search'
  )),
  
  -- Search context
  search_filters JSONB DEFAULT '{}', -- Applied filters (difficulty, category, etc.)
  results_count INTEGER DEFAULT 0,
  results_preview JSONB DEFAULT '[]', -- First 5 results for analysis
  
  -- User interaction
  result_selected JSONB, -- {type: 'collection'|'topic', id: string, title: string, position: number}
  time_to_selection_ms INTEGER, -- How long before user selected a result
  search_abandoned BOOLEAN DEFAULT FALSE, -- User searched but didn't select anything
  
  -- Metadata
  device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
  platform VARCHAR(50), -- 'ios', 'android', 'web'
  app_version VARCHAR(20),
  
  -- Timestamps
  searched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (user_id IS NOT NULL OR guest_token IS NOT NULL)
);

-- ============================================================================
-- USER CONTENT VIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_content_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_token TEXT,
  session_id TEXT NOT NULL,
  
  -- Content details
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN (
    'collection', 'topic', 'question', 'public_figure', 'news_article', 'glossary_term'
  )),
  content_id TEXT NOT NULL,
  content_title TEXT NOT NULL,
  content_slug TEXT,
  
  -- Engagement metrics
  view_duration_seconds INTEGER DEFAULT 0,
  scroll_depth_percentage INTEGER DEFAULT 0 CHECK (scroll_depth_percentage BETWEEN 0 AND 100),
  interactions_count INTEGER DEFAULT 0, -- Clicks, taps, etc.
  
  -- Learning progress
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ, -- When user finished/completed the content
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  
  -- Performance tracking
  quiz_score INTEGER, -- If applicable
  time_to_first_interaction_ms INTEGER,
  return_visits INTEGER DEFAULT 1, -- How many times user has viewed this content
  
  -- Source tracking
  referrer_type VARCHAR(50), -- 'search', 'recommendation', 'direct', 'featured'
  referrer_id TEXT, -- ID of search query, recommendation engine, etc.
  
  -- Metadata
  device_type VARCHAR(50),
  platform VARCHAR(50),
  app_version VARCHAR(20),
  
  -- Timestamps
  first_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (user_id IS NOT NULL OR guest_token IS NOT NULL)
);

-- ============================================================================
-- USER LEARNING PATTERNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Learning preferences (derived from behavior)
  preferred_content_types TEXT[] DEFAULT '{}', -- ['collection', 'topic']
  preferred_difficulty_levels TEXT[] DEFAULT '{}', -- ['easy', 'medium', 'hard']
  preferred_categories TEXT[] DEFAULT '{}', -- Most viewed categories
  preferred_session_length_minutes INTEGER, -- Average session duration
  
  -- Engagement patterns
  peak_activity_hours INTEGER[], -- Hours of day when most active (0-23)
  peak_activity_days INTEGER[], -- Days of week when most active (0-6, 0=Sunday)
  learning_streak_days INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  
  -- Search behavior
  avg_searches_per_session DECIMAL(5,2) DEFAULT 0,
  top_search_terms TEXT[] DEFAULT '{}',
  search_success_rate DECIMAL(3,2) DEFAULT 0, -- Percentage of searches that led to content view
  
  -- Performance metrics
  avg_quiz_score DECIMAL(5,2),
  completion_rate DECIMAL(3,2) DEFAULT 0, -- Percentage of started content that was completed
  retention_score INTEGER DEFAULT 0 CHECK (retention_score BETWEEN 0 AND 100),
  
  -- Personalization data
  recommended_content_ids TEXT[] DEFAULT '{}', -- Content IDs to recommend
  avoided_content_types TEXT[] DEFAULT '{}', -- Content types user tends to skip
  
  -- Timestamps
  analysis_date DATE DEFAULT CURRENT_DATE,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One record per user per day
  UNIQUE(user_id, analysis_date)
);

-- ============================================================================
-- SEARCH ANALYTICS AGGREGATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Date and scope
  analytics_date DATE NOT NULL,
  user_segment VARCHAR(50) DEFAULT 'all', -- 'all', 'registered', 'guest', 'premium'
  
  -- Search volume metrics
  total_searches INTEGER DEFAULT 0,
  unique_searchers INTEGER DEFAULT 0,
  avg_searches_per_user DECIMAL(5,2) DEFAULT 0,
  
  -- Search success metrics
  searches_with_results INTEGER DEFAULT 0,
  searches_with_selection INTEGER DEFAULT 0,
  search_success_rate DECIMAL(3,2) DEFAULT 0,
  avg_time_to_selection_ms INTEGER,
  
  -- Popular content
  top_search_terms JSONB DEFAULT '[]', -- Array of {term, count}
  top_selected_content JSONB DEFAULT '[]', -- Array of {type, id, title, selections}
  
  -- Performance metrics
  avg_results_per_search DECIMAL(5,2) DEFAULT 0,
  zero_result_searches INTEGER DEFAULT 0,
  abandoned_searches INTEGER DEFAULT 0,
  
  -- Platform breakdown
  platform_breakdown JSONB DEFAULT '{}', -- {ios: count, android: count, web: count}
  device_breakdown JSONB DEFAULT '{}', -- {mobile: count, desktop: count, tablet: count}
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique per date and segment
  UNIQUE(analytics_date, user_segment)
);

-- ============================================================================
-- CONTENT RECOMMENDATION ENGINE DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Recommendation details
  content_type VARCHAR(50) NOT NULL,
  content_id TEXT NOT NULL,
  content_title TEXT NOT NULL,
  recommendation_score DECIMAL(5,2) NOT NULL CHECK (recommendation_score BETWEEN 0 AND 100),
  
  -- Recommendation reasoning
  recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN (
    'similar_content', 'popular_in_category', 'trending', 'incomplete_content',
    'skill_building', 'difficulty_progression', 'topic_exploration', 'peer_recommendation'
  )),
  reasoning_factors JSONB DEFAULT '{}', -- Why this was recommended
  
  -- User interaction
  shown_to_user BOOLEAN DEFAULT FALSE,
  clicked_by_user BOOLEAN DEFAULT FALSE,
  completed_by_user BOOLEAN DEFAULT FALSE,
  user_feedback INTEGER, -- 1-5 rating if user provides feedback
  
  -- Performance tracking
  shown_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  feedback_at TIMESTAMPTZ,
  
  -- Metadata
  recommendation_engine_version VARCHAR(20),
  
  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User search history indexes
CREATE INDEX IF NOT EXISTS idx_user_search_history_user_id ON user_search_history(user_id, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_search_history_guest_token ON user_search_history(guest_token, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_search_history_query ON user_search_history USING gin(to_tsvector('english', search_query));
CREATE INDEX IF NOT EXISTS idx_user_search_history_session ON user_search_history(session_id, searched_at DESC);

-- User content views indexes
CREATE INDEX IF NOT EXISTS idx_user_content_views_user_id ON user_content_views(user_id, last_viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_content_views_content ON user_content_views(content_type, content_id, last_viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_content_views_completed ON user_content_views(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_content_views_session ON user_content_views(session_id, started_at DESC);

-- User learning patterns indexes
CREATE INDEX IF NOT EXISTS idx_user_learning_patterns_user_id ON user_learning_patterns(user_id, analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_learning_patterns_streak ON user_learning_patterns(learning_streak_days DESC) WHERE learning_streak_days > 0;

-- Search analytics indexes
CREATE INDEX IF NOT EXISTS idx_search_analytics_daily_date ON search_analytics_daily(analytics_date DESC, user_segment);

-- Content recommendations indexes
CREATE INDEX IF NOT EXISTS idx_content_recommendations_user_score ON content_recommendations(user_id, recommendation_score DESC);
CREATE INDEX IF NOT EXISTS idx_content_recommendations_expires ON content_recommendations(expires_at);
CREATE INDEX IF NOT EXISTS idx_content_recommendations_type ON content_recommendations(recommendation_type, generated_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;

-- User search history policies
CREATE POLICY "Users can view their own search history" ON user_search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON user_search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert guest search history" ON user_search_history
  FOR INSERT WITH CHECK (user_id IS NULL AND guest_token IS NOT NULL);

-- User content views policies
CREATE POLICY "Users can view their own content views" ON user_content_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content views" ON user_content_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content views" ON user_content_views
  FOR UPDATE USING (auth.uid() = user_id);

-- User learning patterns policies
CREATE POLICY "Users can view their own learning patterns" ON user_learning_patterns
  FOR SELECT USING (auth.uid() = user_id);

-- Search analytics policies (admin only)
CREATE POLICY "Admins can view search analytics" ON search_analytics_daily
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Content recommendations policies
CREATE POLICY "Users can view their own recommendations" ON content_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their recommendation feedback" ON content_recommendations
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- AUTOMATED JOBS (TO BE SET UP)
-- ============================================================================

-- Daily analytics generation (run at 1 AM daily)
-- SELECT cron.schedule('generate-daily-search-analytics', '0 1 * * *', 'SELECT generate_daily_search_analytics();');

-- Weekly learning patterns update (run on Sundays at 2 AM)
-- SELECT cron.schedule('update-learning-patterns', '0 2 * * 0', 'SELECT update_user_learning_patterns();');

-- ============================================================================
-- INITIAL DATA & TESTING
-- ============================================================================

-- Insert some sample analytics data for testing
-- (This would be removed in production)
/*
INSERT INTO search_analytics_daily (
  analytics_date,
  user_segment,
  total_searches,
  unique_searchers,
  search_success_rate,
  top_search_terms
) VALUES (
  CURRENT_DATE - INTERVAL '1 day',
  'all',
  150,
  45,
  75.5,
  '[{"term": "constitution", "count": 25}, {"term": "supreme court", "count": 18}, {"term": "elections", "count": 15}]'::jsonb
);
*/

-- User Search Analytics Schema for CivicSense
-- This provides tracking for search behavior and content engagement

-- Search history table
CREATE TABLE IF NOT EXISTS user_search_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_token TEXT,
    search_query TEXT NOT NULL,
    search_type TEXT DEFAULT 'general',
    results_count INTEGER DEFAULT 0,
    selected_result JSONB,
    search_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_search_analytics_user_id 
ON user_search_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_user_search_analytics_timestamp 
ON user_search_analytics(search_timestamp DESC);

-- RLS policies
ALTER TABLE user_search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search analytics" 
ON user_search_analytics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search analytics" 
ON user_search_analytics FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Comments for documentation
COMMENT ON TABLE user_search_analytics IS 'Tracks user search behavior for personalization and analytics';
COMMENT ON COLUMN user_search_analytics.search_query IS 'The search query entered by the user';
COMMENT ON COLUMN user_search_analytics.search_type IS 'Type of search: general, collection, topic, etc.';
COMMENT ON COLUMN user_search_analytics.selected_result IS 'JSON data about which result was selected'; 