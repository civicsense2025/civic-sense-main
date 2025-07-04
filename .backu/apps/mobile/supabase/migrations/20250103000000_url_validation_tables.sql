-- ============================================================================
-- URL VALIDATION AND HEALTH TRACKING TABLES
-- ============================================================================

-- Table to cache URL validation results
CREATE TABLE IF NOT EXISTS public.url_validation_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT FALSE,
  http_status INTEGER,
  response_time INTEGER NOT NULL DEFAULT 0,
  last_checked TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,
  redirect_url TEXT,
  content_type TEXT,
  page_title TEXT,
  is_broken_link BOOLEAN NOT NULL DEFAULT TRUE,
  validation_score INTEGER NOT NULL DEFAULT 0 CHECK (validation_score >= 0 AND validation_score <= 100),
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table to track overall domain health and reliability
CREATE TABLE IF NOT EXISTS public.url_health_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  total_checks INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_success TIMESTAMPTZ,
  last_failure TIMESTAMPTZ,
  average_response_time INTEGER NOT NULL DEFAULT 0,
  reliability_score INTEGER NOT NULL DEFAULT 0 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
  blacklist_reason TEXT,
  blacklist_date TIMESTAMPTZ,
  last_status_code INTEGER,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- URL validation cache indexes
CREATE INDEX IF NOT EXISTS idx_url_validation_cache_url ON public.url_validation_cache(url);
CREATE INDEX IF NOT EXISTS idx_url_validation_cache_domain ON public.url_validation_cache(domain);
CREATE INDEX IF NOT EXISTS idx_url_validation_cache_last_checked ON public.url_validation_cache(last_checked DESC);
CREATE INDEX IF NOT EXISTS idx_url_validation_cache_is_valid ON public.url_validation_cache(is_valid);
CREATE INDEX IF NOT EXISTS idx_url_validation_cache_is_broken ON public.url_validation_cache(is_broken_link);

-- URL health status indexes
CREATE INDEX IF NOT EXISTS idx_url_health_status_domain ON public.url_health_status(domain);
CREATE INDEX IF NOT EXISTS idx_url_health_status_reliability ON public.url_health_status(reliability_score DESC);
CREATE INDEX IF NOT EXISTS idx_url_health_status_blacklisted ON public.url_health_status(is_blacklisted);
CREATE INDEX IF NOT EXISTS idx_url_health_status_last_checked ON public.url_health_status(updated_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.url_validation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_health_status ENABLE ROW LEVEL SECURITY;

-- Public read access for URL validation data
CREATE POLICY "url_validation_public_read" ON public.url_validation_cache
  FOR SELECT USING (true);

CREATE POLICY "url_health_public_read" ON public.url_health_status
  FOR SELECT USING (true);

-- Only authenticated users can insert/update URL validation data
CREATE POLICY "url_validation_authenticated_write" ON public.url_validation_cache
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "url_health_authenticated_write" ON public.url_health_status
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- AUTOMATIC CLEANUP FUNCTION
-- ============================================================================

-- Function to automatically clean up old URL validation entries
CREATE OR REPLACE FUNCTION cleanup_old_url_validations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete validation entries older than 30 days
  DELETE FROM public.url_validation_cache 
  WHERE created_at < (NOW() - INTERVAL '30 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DOMAIN RELIABILITY SCORING FUNCTION
-- ============================================================================

-- Function to calculate and update domain reliability scores
CREATE OR REPLACE FUNCTION update_domain_reliability_score(domain_name TEXT)
RETURNS VOID AS $$
DECLARE
  total_checks INTEGER;
  success_count INTEGER;
  failure_count INTEGER;
  avg_response_time INTEGER;
  reliability_score INTEGER;
BEGIN
  -- Calculate stats from validation cache
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_valid = true) as successes,
    COUNT(*) FILTER (WHERE is_valid = false) as failures,
    COALESCE(AVG(response_time), 0)::INTEGER as avg_time
  INTO total_checks, success_count, failure_count, avg_response_time
  FROM public.url_validation_cache 
  WHERE domain = domain_name
    AND last_checked > (NOW() - INTERVAL '7 days'); -- Only last 7 days
  
  -- Calculate reliability score (0-100)
  IF total_checks > 0 THEN
    reliability_score := (success_count * 100 / total_checks);
  ELSE
    reliability_score := 0;
  END IF;
  
  -- Update or insert domain health record
  INSERT INTO public.url_health_status (
    url, domain, total_checks, success_count, failure_count,
    average_response_time, reliability_score, updated_at
  ) VALUES (
    'https://' || domain_name, domain_name, total_checks, 
    success_count, failure_count, avg_response_time, 
    reliability_score, NOW()
  )
  ON CONFLICT (domain) DO UPDATE SET
    total_checks = EXCLUDED.total_checks,
    success_count = EXCLUDED.success_count,
    failure_count = EXCLUDED.failure_count,
    average_response_time = EXCLUDED.average_response_time,
    reliability_score = EXCLUDED.reliability_score,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEDULED CLEANUP JOB (if pg_cron is available)
-- ============================================================================

-- Note: This requires pg_cron extension to be enabled
-- Uncomment if pg_cron is available in your Supabase instance

-- SELECT cron.schedule(
--   'cleanup-url-validations',
--   '0 2 * * *', -- Run daily at 2 AM
--   'SELECT cleanup_old_url_validations();'
-- );

-- ============================================================================
-- USEFUL VIEWS FOR MONITORING
-- ============================================================================

-- View for monitoring domain reliability
CREATE OR REPLACE VIEW public.domain_reliability_report AS
SELECT 
  domain,
  reliability_score,
  total_checks,
  success_count,
  failure_count,
  average_response_time,
  is_blacklisted,
  last_success,
  last_failure,
  CASE 
    WHEN reliability_score >= 90 THEN 'Excellent'
    WHEN reliability_score >= 80 THEN 'Good'
    WHEN reliability_score >= 70 THEN 'Fair'
    WHEN reliability_score >= 60 THEN 'Poor'
    ELSE 'Very Poor'
  END as reliability_rating,
  updated_at
FROM public.url_health_status
ORDER BY reliability_score DESC, total_checks DESC;

-- View for recent URL validation failures
CREATE OR REPLACE VIEW public.recent_url_failures AS
SELECT 
  url,
  domain,
  http_status,
  error_message,
  last_checked,
  validation_score
FROM public.url_validation_cache
WHERE is_valid = false 
  AND last_checked > (NOW() - INTERVAL '24 hours')
ORDER BY last_checked DESC;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.url_validation_cache TO authenticated;
GRANT ALL ON public.url_health_status TO authenticated;
GRANT SELECT ON public.domain_reliability_report TO authenticated;
GRANT SELECT ON public.recent_url_failures TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION cleanup_old_url_validations() TO authenticated;
GRANT EXECUTE ON FUNCTION update_domain_reliability_score(TEXT) TO authenticated; 