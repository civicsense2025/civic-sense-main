-- ============================================================================
-- Google Calendar Sync Migration
-- Adds tables for tracking calendar sync operations and user settings
-- ============================================================================

BEGIN;

-- Calendar sync logs table
-- Tracks all sync operations for debugging and analytics
CREATE TABLE IF NOT EXISTS public.calendar_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_id TEXT NOT NULL,
  synced_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  sync_options JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_user_id 
ON public.calendar_sync_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_synced_at 
ON public.calendar_sync_logs(synced_at DESC);

-- Add calendar sync settings to user_settings table
-- (Create table if it doesn't exist, add columns if they don't exist)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id)
);

-- Add calendar sync specific columns to user_settings
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' 
    AND column_name = 'calendar_sync_enabled'
  ) THEN
    ALTER TABLE public.user_settings 
    ADD COLUMN calendar_sync_enabled BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' 
    AND column_name = 'calendar_sync_options'
  ) THEN
    ALTER TABLE public.user_settings 
    ADD COLUMN calendar_sync_options JSONB DEFAULT '{
      "includeBreakingNews": true,
      "includeFeaturedTopics": true,
      "includeAllTopics": false
    }'::jsonb;
  END IF;
END $$;

-- Add index for user_settings if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id 
ON public.user_settings(user_id);

-- Enable RLS on new tables
ALTER TABLE public.calendar_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar_sync_logs
DROP POLICY IF EXISTS "Users can view their own sync logs" ON public.calendar_sync_logs;
CREATE POLICY "Users can view their own sync logs" 
ON public.calendar_sync_logs FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sync logs" ON public.calendar_sync_logs;
CREATE POLICY "Users can insert their own sync logs" 
ON public.calendar_sync_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_settings (if not already exist)
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings" 
ON public.user_settings FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings" 
ON public.user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings" 
ON public.user_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Updated at trigger for calendar_sync_logs
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calendar_sync_logs_updated_at ON public.calendar_sync_logs;
CREATE TRIGGER trigger_calendar_sync_logs_updated_at
    BEFORE UPDATE ON public.calendar_sync_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.calendar_sync_logs IS 'Tracks all Google Calendar sync operations for debugging and analytics';
COMMENT ON TABLE public.user_settings IS 'User preferences and settings including calendar sync options';

COMMENT ON COLUMN public.calendar_sync_logs.calendar_id IS 'Google Calendar ID where topics were synced';
COMMENT ON COLUMN public.calendar_sync_logs.synced_count IS 'Number of topics successfully synced';
COMMENT ON COLUMN public.calendar_sync_logs.skipped_count IS 'Number of topics skipped (duplicates, errors)';
COMMENT ON COLUMN public.calendar_sync_logs.errors IS 'Array of error messages from failed sync operations';
COMMENT ON COLUMN public.calendar_sync_logs.sync_options IS 'Sync configuration used (breaking news, featured, all topics)';

COMMENT ON COLUMN public.user_settings.calendar_sync_enabled IS 'Whether user has enabled automatic calendar sync';
COMMENT ON COLUMN public.user_settings.calendar_sync_options IS 'User preferences for calendar sync (which topics to include)';

COMMIT; 