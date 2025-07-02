-- Fix RLS policy for ai_source_analysis table to allow mobile app caching
-- This allows the anon key (used by mobile app) to insert/update analysis cache

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "ai_source_analysis_select_policy" ON public.ai_source_analysis;
DROP POLICY IF EXISTS "ai_source_analysis_insert_policy" ON public.ai_source_analysis;
DROP POLICY IF EXISTS "ai_source_analysis_update_policy" ON public.ai_source_analysis;

-- Create permissive policies for the analysis cache table
-- Allow anyone to read from the cache (for performance)
CREATE POLICY "ai_source_analysis_select_policy" ON public.ai_source_analysis
  FOR SELECT USING (true);

-- Allow anyone to insert into the cache (needed for mobile app)
CREATE POLICY "ai_source_analysis_insert_policy" ON public.ai_source_analysis
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update the cache (for upsert operations)
CREATE POLICY "ai_source_analysis_update_policy" ON public.ai_source_analysis
  FOR UPDATE USING (true);

-- Ensure RLS is enabled on the table
ALTER TABLE public.ai_source_analysis ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to anon role
GRANT SELECT, INSERT, UPDATE ON public.ai_source_analysis TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Also ensure the function exists and has proper permissions
CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_analyses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_source_analysis 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant execute permission on the cleanup function
GRANT EXECUTE ON FUNCTION public.cleanup_expired_ai_analyses() TO anon;

-- Create an index on expires_at for better cleanup performance
CREATE INDEX IF NOT EXISTS idx_ai_source_analysis_expires_at 
ON public.ai_source_analysis(expires_at);

-- Create an index on url_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_source_analysis_url_hash 
ON public.ai_source_analysis(url_hash); 