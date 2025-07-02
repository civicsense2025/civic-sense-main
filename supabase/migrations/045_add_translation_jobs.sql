-- Migration to add translation jobs tracking table
-- This table tracks the progress of bulk translation operations

BEGIN;

-- Create translation jobs table
CREATE TABLE IF NOT EXISTS translation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  target_language TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  queue_for_review BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Error handling
  error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  estimated_completion TIMESTAMPTZ,
  character_count INTEGER,
  
  -- Constraints
  UNIQUE(content_type, content_id, target_language)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_translation_jobs_status ON translation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_content ON translation_jobs(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_language ON translation_jobs(target_language);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_created ON translation_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_priority ON translation_jobs(priority, status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_translation_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_translation_jobs_updated_at
  BEFORE UPDATE ON translation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_translation_jobs_updated_at();

-- Add comments
COMMENT ON TABLE translation_jobs IS 'Tracks bulk translation job progress and status';
COMMENT ON COLUMN translation_jobs.content_type IS 'Type of content being translated (questions, topics, etc.)';
COMMENT ON COLUMN translation_jobs.content_id IS 'ID of the specific content item being translated';
COMMENT ON COLUMN translation_jobs.target_language IS 'Target language code for translation';
COMMENT ON COLUMN translation_jobs.status IS 'Current job status';
COMMENT ON COLUMN translation_jobs.progress IS 'Percentage completion (0-100)';
COMMENT ON COLUMN translation_jobs.queue_for_review IS 'Whether translation should be queued for human review';

-- Function to get translation statistics for the admin dashboard
CREATE OR REPLACE FUNCTION get_content_translation_stats(content_type_param TEXT)
RETURNS TABLE (
  content_type TEXT,
  total_items INTEGER,
  translated_items JSONB,
  pending_items JSONB,
  in_progress_items JSONB,
  error_items JSONB
) AS $$
DECLARE
  lang_code TEXT;
  lang_stats JSONB := '{}';
  pending_stats JSONB := '{}';
  progress_stats JSONB := '{}';
  error_stats JSONB := '{}';
  total_count INTEGER := 0;
BEGIN
  -- Get total count of items for this content type
  EXECUTE format('SELECT COUNT(*) FROM %I', content_type_param) INTO total_count;
  
  -- Get translation statistics for each language
  FOR lang_code IN 
    SELECT DISTINCT target_language 
    FROM translation_jobs 
    WHERE content_type = content_type_param
  LOOP
    -- Count completed translations
    lang_stats := lang_stats || jsonb_build_object(
      lang_code, 
      (SELECT COUNT(*) FROM translation_jobs 
       WHERE content_type = content_type_param 
       AND target_language = lang_code 
       AND status = 'completed')
    );
    
    -- Count pending translations
    pending_stats := pending_stats || jsonb_build_object(
      lang_code,
      (SELECT COUNT(*) FROM translation_jobs 
       WHERE content_type = content_type_param 
       AND target_language = lang_code 
       AND status = 'pending')
    );
    
    -- Count in-progress translations
    progress_stats := progress_stats || jsonb_build_object(
      lang_code,
      (SELECT COUNT(*) FROM translation_jobs 
       WHERE content_type = content_type_param 
       AND target_language = lang_code 
       AND status = 'in_progress')
    );
    
    -- Count failed translations
    error_stats := error_stats || jsonb_build_object(
      lang_code,
      (SELECT COUNT(*) FROM translation_jobs 
       WHERE content_type = content_type_param 
       AND target_language = lang_code 
       AND status = 'failed')
    );
  END LOOP;
  
  RETURN QUERY SELECT 
    content_type_param,
    total_count,
    lang_stats,
    pending_stats,
    progress_stats,
    error_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to get translatable content summary
CREATE OR REPLACE FUNCTION get_translatable_content_summary(
  search_term TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  language_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  type TEXT,
  word_count INTEGER,
  languages TEXT[],
  last_updated TIMESTAMPTZ,
  priority TEXT,
  status TEXT
) AS $$
BEGIN
  -- This is a simplified implementation
  -- In practice, you'd want to union data from different content tables
  -- and calculate actual word counts and translation status
  
  RETURN QUERY
  SELECT 
    q.id::TEXT,
    COALESCE(LEFT(q.question, 50) || '...', 'Untitled')::TEXT as title,
    'question'::TEXT as type,
    COALESCE(array_length(string_to_array(q.question, ' '), 1), 0)::INTEGER as word_count,
    CASE 
      WHEN q.translations IS NOT NULL THEN 
        ARRAY(SELECT jsonb_object_keys(q.translations->'question'))
      ELSE ARRAY['en']::TEXT[]
    END as languages,
    q.updated_at as last_updated,
    'medium'::TEXT as priority,
    CASE 
      WHEN q.translations IS NOT NULL AND jsonb_object_keys(q.translations->'question') @> ARRAY['es', 'fr'] 
      THEN 'translated'
      ELSE 'untranslated'
    END::TEXT as status
  FROM questions q
  WHERE 
    (search_term IS NULL OR q.question ILIKE '%' || search_term || '%')
    AND (status_filter IS NULL OR status_filter = 'all')
    AND (language_filter IS NULL OR language_filter = 'all')
  ORDER BY q.updated_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old completed jobs
CREATE OR REPLACE FUNCTION cleanup_old_translation_jobs(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM translation_jobs 
  WHERE status IN ('completed', 'failed', 'cancelled')
  AND completed_at < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE translation_jobs ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to translation jobs"
ON translation_jobs
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow insert/update/delete only to admin users
-- (You'll need to customize this based on your user role system)
CREATE POLICY "Allow translation job management to admins"
ON translation_jobs
FOR ALL
USING (
  auth.role() = 'authenticated' 
  -- Add your admin role check here
  -- AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create a view for job statistics
CREATE OR REPLACE VIEW translation_job_stats AS
SELECT 
  content_type,
  target_language,
  status,
  COUNT(*) as job_count,
  AVG(progress) as avg_progress,
  MIN(created_at) as oldest_job,
  MAX(updated_at) as latest_update
FROM translation_jobs
GROUP BY content_type, target_language, status;

COMMENT ON VIEW translation_job_stats IS 'Aggregated statistics for translation jobs by content type, language, and status';

-- Insert some sample data for testing (optional)
-- This can be removed in production
INSERT INTO translation_jobs (content_type, content_id, target_language, status, progress) VALUES
  ('questions', 'sample-1', 'es', 'completed', 100),
  ('questions', 'sample-2', 'es', 'pending', 0),
  ('questions', 'sample-1', 'fr', 'in_progress', 50),
  ('question_topics', 'topic-1', 'es', 'completed', 100)
ON CONFLICT (content_type, content_id, target_language) DO NOTHING;

COMMIT; 