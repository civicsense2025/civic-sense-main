BEGIN;

-- Create scheduled content jobs table
CREATE TABLE IF NOT EXISTS scheduled_content_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Job identification
  name TEXT NOT NULL,
  description TEXT,
  job_type TEXT NOT NULL DEFAULT 'content_generation' CHECK (job_type IN ('content_generation', 'quiz_generation', 'survey_optimization')),
  
  -- Scheduling information
  schedule_config JSONB NOT NULL,
  /* schedule_config structure:
  {
    "interval": "daily" | "every12hours" | "weekly" | "monthly",
    "timeOfDay": "HH:MM",
    "timezone": "America/New_York",
    "daysOfWeek": [0,1,2,3,4,5,6], // For weekly schedules
    "dayOfMonth": 1-31 // For monthly schedules
  }
  */
  
  -- Generation settings
  generation_settings JSONB NOT NULL,
  /* generation_settings structure:
  {
    "maxArticles": 10,
    "daysSinceCreated": 7,
    "questionsPerTopic": 6,
    "questionTypeDistribution": {
      "multipleChoice": 60,
      "trueFalse": 25,
      "shortAnswer": 15,
      "fillInBlank": 0,
      "matching": 0
    },
    "difficultyDistribution": {
      "easy": 30,
      "medium": 50,
      "hard": 20
    },
    "daysAhead": 1,
    "categories": [],
    "aiModel": "gpt-4-turbo",
    "temperature": 0.7,
    "autoApprove": false
  }
  */
  
  -- Status and execution tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ NOT NULL,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'pending', 'cancelled')),
  last_run_result JSONB,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  max_failures INTEGER NOT NULL DEFAULT 3,
  
  -- Performance metrics
  total_runs INTEGER NOT NULL DEFAULT 0,
  successful_runs INTEGER NOT NULL DEFAULT 0,
  avg_execution_time_ms INTEGER,
  total_content_generated INTEGER NOT NULL DEFAULT 0,
  
  -- Ownership and permissions
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create job execution logs table
CREATE TABLE IF NOT EXISTS job_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES scheduled_content_jobs(id) ON DELETE CASCADE,
  
  -- Execution details
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
  execution_time_ms INTEGER,
  
  -- Results
  content_generated INTEGER DEFAULT 0,
  topics_created INTEGER DEFAULT 0,
  questions_created INTEGER DEFAULT 0,
  
  -- Error handling
  error_message TEXT,
  error_details JSONB,
  stack_trace TEXT,
  
  -- Metadata
  execution_metadata JSONB,
  /* execution_metadata structure:
  {
    "triggeredBy": "scheduler" | "manual",
    "userId": "uuid",
    "settings": {...},
    "articles_processed": 10,
    "performance_metrics": {...}
  }
  */
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create content generation queue table for background processing
CREATE TABLE IF NOT EXISTS content_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Queue management
  priority INTEGER NOT NULL DEFAULT 50 CHECK (priority BETWEEN 1 AND 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  max_retries INTEGER NOT NULL DEFAULT 3,
  retry_count INTEGER NOT NULL DEFAULT 0,
  
  -- Job association
  scheduled_job_id UUID REFERENCES scheduled_content_jobs(id) ON DELETE SET NULL,
  execution_log_id UUID REFERENCES job_execution_logs(id) ON DELETE CASCADE,
  
  -- Generation parameters
  generation_type TEXT NOT NULL CHECK (generation_type IN ('news_analysis', 'quiz_from_article', 'survey_optimization', 'content_enhancement')),
  generation_params JSONB NOT NULL,
  
  -- Processing details
  assigned_worker TEXT, -- Worker instance handling this job
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_duration_ms INTEGER,
  
  -- Results
  result_data JSONB,
  error_message TEXT,
  
  -- Scheduling
  process_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create content preview cache table
CREATE TABLE IF NOT EXISTS content_preview_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cache key
  cache_key TEXT NOT NULL UNIQUE,
  cache_type TEXT NOT NULL CHECK (cache_type IN ('topic_preview', 'question_preview', 'full_content_preview')),
  
  -- Preview data
  preview_data JSONB NOT NULL,
  generation_settings JSONB NOT NULL,
  
  -- Cache management
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '6 hours'),
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Attribution
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_active ON scheduled_content_jobs(is_active, next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_user ON scheduled_content_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_next_run ON scheduled_content_jobs(next_run_at) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON job_execution_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_status ON job_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_job_logs_created_at ON job_execution_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_generation_queue_status ON content_generation_queue(status, priority DESC, process_after);
CREATE INDEX IF NOT EXISTS idx_generation_queue_scheduled_job ON content_generation_queue(scheduled_job_id);
CREATE INDEX IF NOT EXISTS idx_generation_queue_worker ON content_generation_queue(assigned_worker, status);

CREATE INDEX IF NOT EXISTS idx_preview_cache_key ON content_preview_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_preview_cache_expires ON content_preview_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_preview_cache_user ON content_preview_cache(created_by);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_scheduled_content_jobs_updated_at 
    BEFORE UPDATE ON scheduled_content_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_generation_queue_updated_at 
    BEFORE UPDATE ON content_generation_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate next run time
CREATE OR REPLACE FUNCTION calculate_next_run_time(
  schedule_config JSONB,
  from_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  interval_type TEXT;
  time_of_day TEXT;
  timezone_name TEXT;
  next_run TIMESTAMPTZ;
  base_time TIMESTAMPTZ;
BEGIN
  -- Extract schedule configuration
  interval_type := schedule_config->>'interval';
  time_of_day := schedule_config->>'timeOfDay';
  timezone_name := COALESCE(schedule_config->>'timezone', 'UTC');
  
  -- Convert to specified timezone
  base_time := from_time AT TIME ZONE timezone_name;
  
  -- Calculate next run based on interval
  CASE interval_type
    WHEN 'every12hours' THEN
      IF EXTRACT(HOUR FROM base_time) < 12 THEN
        next_run := date_trunc('day', base_time) + INTERVAL '12 hours';
      ELSE
        next_run := date_trunc('day', base_time) + INTERVAL '1 day';
      END IF;
      
    WHEN 'daily' THEN
      next_run := date_trunc('day', base_time) + INTERVAL '1 day' + (time_of_day || ':00')::TIME;
      IF next_run <= base_time THEN
        next_run := next_run + INTERVAL '1 day';
      END IF;
      
    WHEN 'weekly' THEN
      -- For weekly, find next occurrence of specified day
      next_run := date_trunc('week', base_time) + INTERVAL '7 days' + (time_of_day || ':00')::TIME;
      
    WHEN 'monthly' THEN
      -- For monthly, use day of month from config
      next_run := date_trunc('month', base_time) + INTERVAL '1 month' + 
                 ((COALESCE((schedule_config->>'dayOfMonth')::INTEGER, 1) - 1) || ' days')::INTERVAL +
                 (time_of_day || ':00')::TIME;
      
    ELSE
      -- Default to daily
      next_run := date_trunc('day', base_time) + INTERVAL '1 day' + (time_of_day || ':00')::TIME;
  END CASE;
  
  -- Convert back to UTC
  RETURN next_run AT TIME ZONE timezone_name;
END;
$$ LANGUAGE plpgsql;

-- Create function to get jobs ready for execution
CREATE OR REPLACE FUNCTION get_jobs_ready_for_execution()
RETURNS TABLE (
  id UUID,
  name TEXT,
  generation_settings JSONB,
  created_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.name,
    j.generation_settings,
    j.created_by
  FROM scheduled_content_jobs j
  WHERE j.is_active = true
    AND j.next_run_at <= NOW()
    AND j.consecutive_failures < j.max_failures
  ORDER BY j.next_run_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to update job after execution
CREATE OR REPLACE FUNCTION update_job_after_execution(
  job_id UUID,
  execution_success BOOLEAN,
  execution_result JSONB DEFAULT NULL,
  content_generated INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  job_record scheduled_content_jobs;
BEGIN
  -- Get current job record
  SELECT * INTO job_record FROM scheduled_content_jobs WHERE id = job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found: %', job_id;
  END IF;
  
  -- Update job record
  UPDATE scheduled_content_jobs
  SET 
    last_run_at = NOW(),
    next_run_at = calculate_next_run_time(schedule_config, NOW()),
    last_run_status = CASE WHEN execution_success THEN 'success' ELSE 'failed' END,
    last_run_result = execution_result,
    consecutive_failures = CASE WHEN execution_success THEN 0 ELSE consecutive_failures + 1 END,
    total_runs = total_runs + 1,
    successful_runs = CASE WHEN execution_success THEN successful_runs + 1 ELSE successful_runs END,
    total_content_generated = total_content_generated + content_generated,
    updated_at = NOW()
  WHERE id = job_id;
  
  -- Deactivate job if too many consecutive failures
  IF NOT execution_success AND (job_record.consecutive_failures + 1) >= job_record.max_failures THEN
    UPDATE scheduled_content_jobs
    SET is_active = false, updated_at = NOW()
    WHERE id = job_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE scheduled_content_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_preview_cache ENABLE ROW LEVEL SECURITY;

-- Users can only access their own scheduled jobs
CREATE POLICY "Users can manage their own scheduled jobs"
  ON scheduled_content_jobs
  FOR ALL
  USING (created_by = auth.uid());

-- Users can view execution logs for their jobs
CREATE POLICY "Users can view logs for their jobs"
  ON job_execution_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_content_jobs 
      WHERE id = job_execution_logs.job_id 
      AND created_by = auth.uid()
    )
  );

-- System can insert execution logs
CREATE POLICY "System can insert execution logs"
  ON job_execution_logs
  FOR INSERT
  WITH CHECK (true);

-- Users can view their queue items
CREATE POLICY "Users can view their queue items"
  ON content_generation_queue
  FOR SELECT
  USING (
    scheduled_job_id IN (
      SELECT id FROM scheduled_content_jobs WHERE created_by = auth.uid()
    )
  );

-- System can manage queue
CREATE POLICY "System can manage queue"
  ON content_generation_queue
  FOR ALL
  USING (true);

-- Users can manage their own preview cache
CREATE POLICY "Users can manage their preview cache"
  ON content_preview_cache
  FOR ALL
  USING (created_by = auth.uid());

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduled_content_jobs TO authenticated;
GRANT SELECT ON job_execution_logs TO authenticated;
GRANT SELECT ON content_generation_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON content_preview_cache TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION calculate_next_run_time(JSONB, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_jobs_ready_for_execution() TO authenticated;
GRANT EXECUTE ON FUNCTION update_job_after_execution(UUID, BOOLEAN, JSONB, INTEGER) TO authenticated;

-- Create cleanup function for old records
CREATE OR REPLACE FUNCTION cleanup_old_job_data()
RETURNS void AS $$
BEGIN
  -- Delete old execution logs (keep 30 days)
  DELETE FROM job_execution_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete completed/failed queue items (keep 7 days)
  DELETE FROM content_generation_queue 
  WHERE status IN ('completed', 'failed', 'cancelled')
  AND completed_at < NOW() - INTERVAL '7 days';
  
  -- Delete expired preview cache
  DELETE FROM content_preview_cache 
  WHERE expires_at < NOW();
  
  -- Reset inactive jobs that have been failing for too long
  UPDATE scheduled_content_jobs
  SET 
    consecutive_failures = 0,
    is_active = false,
    updated_at = NOW()
  WHERE consecutive_failures >= max_failures
  AND last_run_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create some sample scheduled jobs for testing (optional)
INSERT INTO scheduled_content_jobs (
  name,
  description,
  schedule_config,
  generation_settings,
  next_run_at,
  created_by
) VALUES (
  'Daily Morning Content Generation',
  'Generate daily civic education content from recent news articles every morning at 6 AM EST',
  '{"interval": "daily", "timeOfDay": "06:00", "timezone": "America/New_York"}',
  '{"maxArticles": 15, "daysSinceCreated": 2, "questionsPerTopic": 6, "questionTypeDistribution": {"multipleChoice": 60, "trueFalse": 25, "shortAnswer": 15, "fillInBlank": 0, "matching": 0}, "difficultyDistribution": {"easy": 30, "medium": 50, "hard": 20}, "daysAhead": 1, "categories": [], "aiModel": "gpt-4-turbo", "temperature": 0.7, "autoApprove": false}',
  calculate_next_run_time('{"interval": "daily", "timeOfDay": "06:00", "timezone": "America/New_York"}'),
  (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT DO NOTHING;

COMMIT; 