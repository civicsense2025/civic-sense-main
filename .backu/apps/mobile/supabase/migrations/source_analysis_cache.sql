-- Create Source Analysis Cache table for storing bias and credibility analysis
CREATE TABLE IF NOT EXISTS public.source_analysis_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_hash TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  domain TEXT NOT NULL,
  
  -- Analysis results
  credibility_score DECIMAL(3,2) NOT NULL CHECK (credibility_score >= 0 AND credibility_score <= 1),
  bias_rating TEXT NOT NULL CHECK (bias_rating IN ('left', 'lean_left', 'center', 'lean_right', 'right', 'mixed')),
  factual_rating TEXT NOT NULL CHECK (factual_rating IN ('very_high', 'high', 'mostly_factual', 'mixed', 'low', 'very_low')),
  
  -- Detailed analysis data
  analysis_data JSONB NOT NULL DEFAULT '{}',
  ai_insights JSONB,
  
  -- Source metadata
  source_metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  analyzed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Ensure we clean up expired entries
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_source_analysis_url_hash ON public.source_analysis_cache(url_hash);
CREATE INDEX IF NOT EXISTS idx_source_analysis_domain ON public.source_analysis_cache(domain);
CREATE INDEX IF NOT EXISTS idx_source_analysis_expires_at ON public.source_analysis_cache(expires_at);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_source_analysis()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.source_analysis_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (Row Level Security)
ALTER TABLE public.source_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to all authenticated and anonymous users
CREATE POLICY "Allow read access to source_analysis_cache" ON public.source_analysis_cache
  FOR SELECT USING (true);

-- Policy: Only service role can insert/update cache entries
CREATE POLICY "Service role can manage source_analysis_cache" ON public.source_analysis_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT ON public.source_analysis_cache TO anon, authenticated;
GRANT ALL ON public.source_analysis_cache TO service_role;

-- Add comment for documentation
COMMENT ON TABLE public.source_analysis_cache IS 'Cache for source bias and credibility analysis to avoid repeated analysis';
COMMENT ON COLUMN public.source_analysis_cache.url_hash IS 'Base64 encoded hash of the original URL for fast lookups';
COMMENT ON COLUMN public.source_analysis_cache.credibility_score IS 'Score from 0-1 where 1 is most credible';
COMMENT ON COLUMN public.source_analysis_cache.bias_rating IS 'Political bias rating from left to right';
COMMENT ON COLUMN public.source_analysis_cache.analysis_data IS 'Detailed analysis metrics and scores';
COMMENT ON COLUMN public.source_analysis_cache.ai_insights IS 'AI-generated insights about the source';

-- Enhanced Source Analysis Migration
-- Creates AI-powered source analysis cache system that integrates with existing infrastructure

-- Create the main AI source analysis cache table
CREATE TABLE IF NOT EXISTS ai_source_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_hash TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  domain TEXT NOT NULL,
  
  -- Core AI Analysis Results
  overall_credibility DECIMAL(3,2) NOT NULL CHECK (overall_credibility >= 0 AND overall_credibility <= 1),
  overall_bias TEXT NOT NULL CHECK (overall_bias IN ('left', 'lean_left', 'center', 'lean_right', 'right', 'mixed')),
  factual_rating TEXT NOT NULL CHECK (factual_rating IN ('very_high', 'high', 'mostly_factual', 'mixed', 'low', 'very_low')),
  
  -- Detailed Analysis
  analysis_summary TEXT NOT NULL,
  strengths TEXT[] DEFAULT ARRAY[]::TEXT[],
  weaknesses TEXT[] DEFAULT ARRAY[]::TEXT[],
  red_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
  recommendations TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Performance Metrics
  transparency_score DECIMAL(3,2) CHECK (transparency_score >= 0 AND transparency_score <= 1),
  analysis_confidence DECIMAL(3,2) NOT NULL CHECK (analysis_confidence >= 0 AND analysis_confidence <= 1),
  
  -- AI Analysis Metadata
  ai_model_version TEXT DEFAULT 'gpt-4-turbo-preview',
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_source_analysis_url_hash ON ai_source_analysis(url_hash);
CREATE INDEX IF NOT EXISTS idx_ai_source_analysis_domain ON ai_source_analysis(domain);
CREATE INDEX IF NOT EXISTS idx_ai_source_analysis_expires_at ON ai_source_analysis(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_source_analysis_analyzed_at ON ai_source_analysis(analyzed_at);

-- Add RLS policies
ALTER TABLE ai_source_analysis ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read analysis results (for guest users)
CREATE POLICY "ai_source_analysis_read_policy" ON ai_source_analysis
  FOR SELECT USING (true);

-- Policy: Only service role can insert/update analysis results
CREATE POLICY "ai_source_analysis_write_policy" ON ai_source_analysis
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to cleanup expired analyses
CREATE OR REPLACE FUNCTION cleanup_expired_ai_analyses()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_source_analysis 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get or create source analysis
CREATE OR REPLACE FUNCTION get_or_create_source_analysis(
  p_url TEXT,
  p_domain TEXT DEFAULT NULL,
  p_credibility DECIMAL DEFAULT 0.5,
  p_bias TEXT DEFAULT 'center',
  p_factual_rating TEXT DEFAULT 'mixed'
)
RETURNS UUID AS $$
DECLARE
  v_url_hash TEXT;
  v_domain TEXT;
  v_analysis_id UUID;
BEGIN
  -- Generate URL hash
  v_url_hash := encode(digest(lower(trim(p_url)), 'sha256'), 'base64');
  
  -- Extract domain if not provided
  v_domain := COALESCE(p_domain, 
    regexp_replace(
      regexp_replace(p_url, '^https?://(?:www\.)?', ''), 
      '/.*$', ''
    )
  );
  
  -- Try to find existing analysis that hasn't expired
  SELECT id INTO v_analysis_id
  FROM ai_source_analysis
  WHERE url_hash = v_url_hash 
    AND expires_at > now()
  LIMIT 1;
  
  -- If not found, create new analysis
  IF v_analysis_id IS NULL THEN
    INSERT INTO ai_source_analysis (
      url_hash,
      original_url,
      domain,
      overall_credibility,
      overall_bias,
      factual_rating,
      analysis_summary,
      analysis_confidence,
      expires_at
    ) VALUES (
      v_url_hash,
      p_url,
      v_domain,
      p_credibility,
      p_bias,
      p_factual_rating,
      'Analysis pending or using fallback credibility assessment.',
      0.5,
      now() + interval '7 days'
    )
    RETURNING id INTO v_analysis_id;
  END IF;
  
  RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create comprehensive view for source analysis with fallbacks
CREATE OR REPLACE VIEW enhanced_source_analysis AS
SELECT 
  sa.id,
  sa.url_hash,
  sa.original_url as url,
  sa.domain,
  sa.overall_credibility,
  sa.overall_bias,
  sa.factual_rating,
  sa.analysis_summary,
  sa.strengths,
  sa.weaknesses,
  sa.red_flags,
  sa.recommendations,
  sa.transparency_score,
  sa.analysis_confidence,
  sa.ai_model_version,
  sa.analyzed_at,
  sa.expires_at,
  -- Helper flags
  (sa.expires_at > now()) as is_fresh,
  (sa.analyzed_at > now() - interval '1 day') as is_recent,
  (sa.analysis_confidence > 0.7) as is_high_confidence,
  -- Categorization helpers
  CASE 
    WHEN sa.overall_credibility >= 0.8 THEN 'high'
    WHEN sa.overall_credibility >= 0.6 THEN 'medium' 
    ELSE 'low'
  END as credibility_category,
  CASE
    WHEN sa.overall_bias IN ('left', 'right') THEN 'partisan'
    WHEN sa.overall_bias IN ('lean_left', 'lean_right') THEN 'leaning'
    ELSE 'balanced'
  END as bias_category
FROM ai_source_analysis sa;

-- Create function to get source analysis stats
CREATE OR REPLACE FUNCTION get_source_analysis_stats()
RETURNS JSON AS $$
DECLARE
  total_analyses INTEGER;
  fresh_analyses INTEGER;
  expired_analyses INTEGER;
  avg_credibility DECIMAL;
  result JSON;
BEGIN
  SELECT 
    COUNT(*)::INTEGER,
    SUM(CASE WHEN expires_at > now() THEN 1 ELSE 0 END)::INTEGER,
    SUM(CASE WHEN expires_at <= now() THEN 1 ELSE 0 END)::INTEGER,
    AVG(overall_credibility)::DECIMAL
  INTO total_analyses, fresh_analyses, expired_analyses, avg_credibility
  FROM ai_source_analysis;
  
  result := json_build_object(
    'total_analyses', COALESCE(total_analyses, 0),
    'fresh_analyses', COALESCE(fresh_analyses, 0),
    'expired_analyses', COALESCE(expired_analyses, 0),
    'average_credibility', COALESCE(avg_credibility, 0.0),
    'cache_hit_rate', CASE 
      WHEN total_analyses > 0 THEN ROUND((fresh_analyses::DECIMAL / total_analyses) * 100, 2)
      ELSE 0.0 
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON enhanced_source_analysis TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_ai_analyses() TO service_role;
GRANT EXECUTE ON FUNCTION get_or_create_source_analysis(TEXT, TEXT, DECIMAL, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_source_analysis_stats() TO anon, authenticated, service_role;

-- Create helpful comments
COMMENT ON TABLE ai_source_analysis IS 'AI-powered source credibility and bias analysis cache with 7-day expiration';
COMMENT ON COLUMN ai_source_analysis.url_hash IS 'SHA256 hash of normalized URL for fast lookups and duplicate prevention';
COMMENT ON COLUMN ai_source_analysis.overall_credibility IS 'AI-assessed credibility score from 0.0 (unreliable) to 1.0 (highly reliable)';
COMMENT ON COLUMN ai_source_analysis.overall_bias IS 'AI-detected political bias classification';
COMMENT ON COLUMN ai_source_analysis.analysis_confidence IS 'AI confidence in analysis results from 0.0 to 1.0';

-- Insert some sample data for testing
INSERT INTO ai_source_analysis (
  url_hash,
  original_url,
  domain,
  overall_credibility,
  overall_bias,
  factual_rating,
  analysis_summary,
  strengths,
  weaknesses,
  transparency_score,
  analysis_confidence,
  expires_at
) VALUES 
(
  encode(digest('https://reuters.com', 'sha256'), 'base64'),
  'https://reuters.com',
  'reuters.com',
  0.92,
  'center',
  'very_high',
  'Reuters is a highly credible international news organization with strong editorial standards and fact-checking processes.',
  ARRAY['Professional journalism standards', 'Global news network', 'Strong fact-checking']::TEXT[],
  ARRAY[]::TEXT[],
  0.90,
  0.95,
  now() + interval '7 days'
),
(
  encode(digest('https://congress.gov', 'sha256'), 'base64'),
  'https://congress.gov',
  'congress.gov',
  0.98,
  'center',
  'very_high',
  'Official U.S. Congress website providing authoritative information on legislative processes and documents.',
  ARRAY['Official government source', 'Primary legislative documents', 'Authoritative information']::TEXT[],
  ARRAY[]::TEXT[],
  0.95,
  0.98,
  now() + interval '7 days'
)
ON CONFLICT (url_hash) DO NOTHING;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Enhanced source analysis system migration completed successfully';
  RAISE NOTICE 'Created table: ai_source_analysis with % sample records', (SELECT COUNT(*) FROM ai_source_analysis);
  RAISE NOTICE 'Available functions: cleanup_expired_ai_analyses(), get_or_create_source_analysis(), get_source_analysis_stats()';
  RAISE NOTICE 'Available view: enhanced_source_analysis';
END $$; 