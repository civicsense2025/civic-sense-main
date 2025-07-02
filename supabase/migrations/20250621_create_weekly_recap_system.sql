-- Create weekly recap system tables
BEGIN;

-- Weekly recap configurations table
CREATE TABLE IF NOT EXISTS public.weekly_recap_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_name TEXT NOT NULL UNIQUE,
  max_items_per_collection INTEGER DEFAULT 20,
  min_engagement_threshold INTEGER DEFAULT 10,
  min_completion_rate DECIMAL DEFAULT 0.5,
  topics_percentage INTEGER DEFAULT 40,
  questions_percentage INTEGER DEFAULT 30,
  glossary_percentage INTEGER DEFAULT 30,
  engagement_weight DECIMAL DEFAULT 0.3,
  current_events_weight DECIMAL DEFAULT 0.3,
  user_rating_weight DECIMAL DEFAULT 0.2,
  civic_action_weight DECIMAL DEFAULT 0.2,
  title_template TEXT DEFAULT 'Weekly Civic Recap: {date_range}',
  description_template TEXT DEFAULT 'Your curated selection of the most engaging civic content from {date_range}',
  emoji_pool TEXT DEFAULT '📊,📈,🗳️,🏛️,📰,🎯',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly content metrics table
CREATE TABLE IF NOT EXISTS public.weekly_content_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('topic', 'question', 'glossary')),
  metric_date DATE NOT NULL,
  total_views INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  completion_rate DECIMAL DEFAULT 0,
  user_ratings_avg DECIMAL DEFAULT 0,
  engagement_score DECIMAL DEFAULT 0,
  current_events_score DECIMAL DEFAULT 0,
  civic_action_score DECIMAL DEFAULT 0,
  overall_score DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_id, content_type, metric_date)
);

-- Weekly recap collections table
CREATE TABLE IF NOT EXISTS public.weekly_recap_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '📊',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  config_used TEXT NOT NULL,
  total_items INTEGER DEFAULT 0,
  topics_count INTEGER DEFAULT 0,
  questions_count INTEGER DEFAULT 0,
  glossary_count INTEGER DEFAULT 0,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO public.weekly_recap_configs (
  config_name,
  max_items_per_collection,
  min_engagement_threshold,
  min_completion_rate,
  topics_percentage,
  questions_percentage,
  glossary_percentage,
  engagement_weight,
  current_events_weight,
  user_rating_weight,
  civic_action_weight,
  title_template,
  description_template,
  emoji_pool
) VALUES (
  'default',
  20,
  10,
  0.5,
  40,
  30,
  30,
  0.3,
  0.3,
  0.2,
  0.2,
  'Weekly Civic Recap: {date_range}',
  'Your curated selection of the most engaging civic content from {date_range}',
  '📊,📈,🗳️,🏛️,📰,🎯'
) ON CONFLICT (config_name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_weekly_content_metrics_date ON public.weekly_content_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_weekly_content_metrics_content ON public.weekly_content_metrics(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_weekly_content_metrics_score ON public.weekly_content_metrics(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_recap_collections_date ON public.weekly_recap_collections(start_date, end_date);

-- Enable RLS
ALTER TABLE public.weekly_recap_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_recap_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_recap_configs
CREATE POLICY "Admin users can manage weekly recap configs" ON public.weekly_recap_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.email = 'admin@civicsense.one' OR
        auth.users.email LIKE '%@civicsense.org' OR
        auth.users.email = 'tanmho92@gmail.com'
      )
    )
  );

-- RLS Policies for weekly_content_metrics
CREATE POLICY "Admin users can manage weekly content metrics" ON public.weekly_content_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.email = 'admin@civicsense.one' OR
        auth.users.email LIKE '%@civicsense.org' OR
        auth.users.email = 'tanmho92@gmail.com'
      )
    )
  );

-- RLS Policies for weekly_recap_collections
CREATE POLICY "Admin users can manage weekly recap collections" ON public.weekly_recap_collections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.email = 'admin@civicsense.one' OR
        auth.users.email LIKE '%@civicsense.org' OR
        auth.users.email = 'tanmho92@gmail.com'
      )
    )
  );

-- Users can view published weekly recap collections
CREATE POLICY "Users can view weekly recap collections" ON public.weekly_recap_collections
  FOR SELECT USING (true);

COMMIT; 