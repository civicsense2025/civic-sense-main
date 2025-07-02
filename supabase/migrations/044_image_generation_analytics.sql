-- Image Generation Analytics and Performance Monitoring
-- Migration: 044_image_generation_analytics.sql

BEGIN;

-- Create table for tracking image generation analytics
CREATE TABLE IF NOT EXISTS image_generation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template TEXT NOT NULL CHECK (template IN ('quiz-thumbnail', 'instagram-story', 'instagram-post', 'twitter-card', 'facebook-post', 'linkedin-post', 'error')),
  content_type TEXT NOT NULL CHECK (content_type IN ('quiz', 'result', 'topic', 'achievement', 'error')),
  variant TEXT NOT NULL DEFAULT 'default' CHECK (variant IN ('bold', 'subtle', 'urgent', 'default')),
  theme TEXT NOT NULL DEFAULT 'default' CHECK (theme IN ('educator', 'family', 'activist', 'default')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  generation_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance monitoring queries
CREATE INDEX IF NOT EXISTS idx_image_analytics_created_at 
ON image_generation_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_image_analytics_template_success 
ON image_generation_analytics(template, success);

CREATE INDEX IF NOT EXISTS idx_image_analytics_user_created 
ON image_generation_analytics(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_image_analytics_performance 
ON image_generation_analytics(generation_time_ms, success, created_at);

-- Create table for A/B testing tracking
CREATE TABLE IF NOT EXISTS image_ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  variant TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  image_id UUID REFERENCES image_generation_analytics(id) ON DELETE CASCADE,
  engagement_type TEXT CHECK (engagement_type IN ('view', 'click', 'share', 'download')),
  engagement_value NUMERIC DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_variant 
ON image_ab_test_results(test_name, variant, created_at);

-- RLS Policies for image analytics
ALTER TABLE image_generation_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous image generation tracking
CREATE POLICY "Allow anonymous image generation tracking" 
ON image_generation_analytics FOR INSERT 
WITH CHECK (true);

-- Users can view their own analytics
CREATE POLICY "Users can view their own image analytics" 
ON image_generation_analytics FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all analytics
CREATE POLICY "Admins can view all image analytics" 
ON image_generation_analytics FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- RLS Policies for A/B testing
ALTER TABLE image_ab_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow A/B test result tracking" 
ON image_ab_test_results FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own A/B test results" 
ON image_ab_test_results FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create function for performance monitoring alerts
CREATE OR REPLACE FUNCTION check_image_generation_performance()
RETURNS VOID AS $$
DECLARE
  avg_generation_time NUMERIC;
  error_rate NUMERIC;
  total_generations INTEGER;
BEGIN
  -- Get performance metrics from last hour
  SELECT 
    AVG(generation_time_ms),
    (COUNT(*) FILTER (WHERE success = false)::NUMERIC / COUNT(*)) * 100,
    COUNT(*)
  INTO avg_generation_time, error_rate, total_generations
  FROM image_generation_analytics
  WHERE created_at >= NOW() - INTERVAL '1 hour';
  
  -- Alert if performance is degraded
  IF avg_generation_time > 5000 OR error_rate > 10 THEN
    INSERT INTO system_alerts (
      alert_type,
      severity,
      message,
      metadata
    ) VALUES (
      'image_generation_performance',
      CASE 
        WHEN avg_generation_time > 10000 OR error_rate > 25 THEN 'critical'
        ELSE 'warning'
      END,
      format('Image generation performance alert: avg_time=%sms, error_rate=%s%%, total=%s', 
             avg_generation_time, error_rate, total_generations),
      jsonb_build_object(
        'avg_generation_time_ms', avg_generation_time,
        'error_rate_percent', error_rate,
        'total_generations', total_generations,
        'check_time', NOW()
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for A/B test analysis
CREATE OR REPLACE FUNCTION analyze_image_ab_test(test_name_param TEXT)
RETURNS TABLE(
  variant TEXT,
  total_views INTEGER,
  total_engagements INTEGER,
  engagement_rate NUMERIC,
  avg_generation_time NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    abr.variant,
    COUNT(DISTINCT abr.session_id)::INTEGER as total_views,
    COUNT(abr.id)::INTEGER as total_engagements,
    (COUNT(abr.id)::NUMERIC / NULLIF(COUNT(DISTINCT abr.session_id), 0)) * 100 as engagement_rate,
    AVG(iga.generation_time_ms) as avg_generation_time
  FROM image_ab_test_results abr
  LEFT JOIN image_generation_analytics iga ON iga.id = abr.image_id
  WHERE abr.test_name = test_name_param
  AND abr.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY abr.variant
  ORDER BY engagement_rate DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create system alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_system_alerts_severity_created 
ON system_alerts(severity, created_at DESC) WHERE resolved = false;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON image_generation_analytics TO anon, authenticated;
GRANT INSERT ON image_ab_test_results TO anon, authenticated;
GRANT SELECT ON image_generation_analytics TO authenticated;
GRANT SELECT ON image_ab_test_results TO authenticated;

COMMIT; 