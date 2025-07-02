-- Create news cache table for efficient caching across server restarts
-- This prevents hitting RSS feeds repeatedly when multiple users access the site

BEGIN;

-- Create news_cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS news_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL,
  articles_data JSONB NOT NULL,
  source_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique cache keys (replace old entries)
  UNIQUE(cache_key)
);

-- Create index for efficient cache lookups
CREATE INDEX IF NOT EXISTS idx_news_cache_key_created 
ON news_cache(cache_key, created_at DESC);

-- Create index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_news_cache_created_at 
ON news_cache(created_at);

-- Add RLS policies
ALTER TABLE news_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage cache
CREATE POLICY IF NOT EXISTS "Service role can manage news cache" 
ON news_cache FOR ALL 
USING (auth.role() = 'service_role');

-- Allow authenticated users to read cache (optional, for transparency)
CREATE POLICY IF NOT EXISTS "Authenticated users can read news cache" 
ON news_cache FOR SELECT 
USING (auth.role() = 'authenticated');

COMMIT; 