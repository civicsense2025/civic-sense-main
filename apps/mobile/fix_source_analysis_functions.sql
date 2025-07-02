-- Fix missing source analysis helper functions
-- This creates the functions that were missing from the migration

-- Function to get source analysis by URL
CREATE OR REPLACE FUNCTION public.get_source_analysis_by_url(input_url TEXT)
RETURNS TABLE (
  url_hash TEXT,
  overall_credibility DECIMAL(3,2),
  overall_bias TEXT,
  factual_rating TEXT,
  analysis_summary TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  red_flags TEXT[],
  recommendations TEXT[],
  analysis_confidence DECIMAL(3,2),
  cached_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  computed_hash TEXT;
BEGIN
  -- Generate URL hash
  computed_hash := encode(digest(input_url, 'sha256'), 'base64');
  
  -- Return cached analysis if exists and not expired
  RETURN QUERY
  SELECT 
    asa.url_hash,
    asa.overall_credibility,
    asa.overall_bias,
    asa.factual_rating,
    asa.analysis_summary,
    asa.strengths,
    asa.weaknesses,
    asa.red_flags,
    asa.recommendations,
    asa.analysis_confidence,
    asa.created_at as cached_at
  FROM ai_source_analysis asa
  WHERE asa.url_hash = computed_hash 
    AND asa.expires_at > NOW()
  LIMIT 1;
END;
$$;

-- Function to cache source analysis results
CREATE OR REPLACE FUNCTION public.cache_source_analysis(
  input_url TEXT,
  input_domain TEXT,
  input_credibility DECIMAL(3,2),
  input_bias TEXT,
  input_factual_rating TEXT,
  input_summary TEXT,
  input_strengths TEXT[],
  input_weaknesses TEXT[],
  input_red_flags TEXT[],
  input_recommendations TEXT[],
  input_confidence DECIMAL(3,2),
  cache_duration_hours INTEGER DEFAULT 168
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  computed_hash TEXT;
  new_id UUID;
BEGIN
  -- Generate URL hash
  computed_hash := encode(digest(input_url, 'sha256'), 'base64');
  
  -- Insert or update the analysis
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
    red_flags,
    recommendations,
    analysis_confidence,
    expires_at
  ) VALUES (
    computed_hash,
    input_url,
    input_domain,
    input_credibility,
    input_bias,
    input_factual_rating,
    input_summary,
    input_strengths,
    input_weaknesses,
    input_red_flags,
    input_recommendations,
    input_confidence,
    NOW() + (cache_duration_hours || ' hours')::INTERVAL
  )
  ON CONFLICT (url_hash) 
  DO UPDATE SET
    overall_credibility = EXCLUDED.overall_credibility,
    overall_bias = EXCLUDED.overall_bias,
    factual_rating = EXCLUDED.factual_rating,
    analysis_summary = EXCLUDED.analysis_summary,
    strengths = EXCLUDED.strengths,
    weaknesses = EXCLUDED.weaknesses,
    red_flags = EXCLUDED.red_flags,
    recommendations = EXCLUDED.recommendations,
    analysis_confidence = EXCLUDED.analysis_confidence,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW()
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Function to get enhanced source analysis with metadata
CREATE OR REPLACE FUNCTION public.get_enhanced_source_analysis(input_url TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  computed_hash TEXT;
BEGIN
  computed_hash := encode(digest(input_url, 'sha256'), 'base64');
  
  SELECT json_build_object(
    'url', asa.original_url,
    'domain', asa.domain,
    'credibility', asa.overall_credibility,
    'bias', asa.overall_bias,
    'factualRating', asa.factual_rating,
    'summary', asa.analysis_summary,
    'strengths', asa.strengths,
    'weaknesses', asa.weaknesses,
    'redFlags', asa.red_flags,
    'recommendations', asa.recommendations,
    'confidence', asa.analysis_confidence,
    'cachedAt', asa.created_at,
    'expiresAt', asa.expires_at,
    'isFresh', (asa.expires_at > NOW())
  ) INTO result
  FROM ai_source_analysis asa
  WHERE asa.url_hash = computed_hash
  ORDER BY asa.created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(result, '{}'::JSON);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_source_analysis_by_url(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.cache_source_analysis(TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT[], TEXT[], DECIMAL, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_enhanced_source_analysis(TEXT) TO authenticated, anon;

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_ai_source_analysis_url_hash ON ai_source_analysis(url_hash);
CREATE INDEX IF NOT EXISTS idx_ai_source_analysis_domain ON ai_source_analysis(domain);
CREATE INDEX IF NOT EXISTS idx_ai_source_analysis_expires_at ON ai_source_analysis(expires_at);

COMMENT ON FUNCTION public.get_source_analysis_by_url(TEXT) IS 'Retrieves cached source analysis by URL, returns empty if expired or not found';
COMMENT ON FUNCTION public.cache_source_analysis IS 'Caches source analysis results with configurable expiration';
COMMENT ON FUNCTION public.get_enhanced_source_analysis(TEXT) IS 'Returns enhanced source analysis as JSON with metadata'; 