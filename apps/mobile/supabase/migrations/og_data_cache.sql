-- Create OG Data Cache table for storing Open Graph metadata
CREATE TABLE IF NOT EXISTS public.og_data_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_hash TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  og_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Ensure we clean up expired entries
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_og_cache_url_hash ON public.og_data_cache(url_hash);
CREATE INDEX IF NOT EXISTS idx_og_cache_expires_at ON public.og_data_cache(expires_at);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_og_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.og_data_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (Row Level Security)
ALTER TABLE public.og_data_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to all authenticated and anonymous users (caching is public)
CREATE POLICY "Allow read access to og_data_cache" ON public.og_data_cache
  FOR SELECT USING (true);

-- Policy: Only service role can insert/update cache entries
-- (This will be used by the Edge Function with the service role key)
CREATE POLICY "Service role can manage og_data_cache" ON public.og_data_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT ON public.og_data_cache TO anon, authenticated;
GRANT ALL ON public.og_data_cache TO service_role;

-- Optional: Set up automatic cleanup of expired entries (runs daily)
-- This requires pg_cron extension to be enabled in your Supabase project
-- You can enable it in the Supabase dashboard under Database > Extensions
/*
SELECT cron.schedule(
  'cleanup-expired-og-cache',
  '0 2 * * *', -- Daily at 2 AM
  'SELECT cleanup_expired_og_cache();'
);
*/

-- Add comment for documentation
COMMENT ON TABLE public.og_data_cache IS 'Cache for Open Graph metadata to avoid repeated HTTP requests';
COMMENT ON COLUMN public.og_data_cache.url_hash IS 'Base64 encoded hash of the original URL for fast lookups';
COMMENT ON COLUMN public.og_data_cache.og_data IS 'JSON object containing title, description, image, etc.';
COMMENT ON COLUMN public.og_data_cache.expires_at IS 'When this cache entry expires and should be refreshed'; 