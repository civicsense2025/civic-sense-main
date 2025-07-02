-- ============================================================================
-- Calendar Sync Logs Patch Migration
-- Adds the missing calendar_sync_logs table for Google Calendar integration
-- ============================================================================

BEGIN;

-- Create calendar sync logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.calendar_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_id TEXT NOT NULL,
  synced_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  sync_options JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_user_id 
ON public.calendar_sync_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_synced_at 
ON public.calendar_sync_logs(synced_at DESC);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_user_synced 
ON public.calendar_sync_logs(user_id, synced_at DESC);

-- Enable RLS
ALTER TABLE public.calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only see their own sync logs
CREATE POLICY "Users can view their own calendar sync logs" 
ON public.calendar_sync_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar sync logs" 
ON public.calendar_sync_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- No update or delete policies - logs are immutable for audit purposes

-- Add helpful comments
COMMENT ON TABLE public.calendar_sync_logs IS 'Logs of Google Calendar sync operations for audit and debugging';
COMMENT ON COLUMN public.calendar_sync_logs.user_id IS 'User who performed the sync';
COMMENT ON COLUMN public.calendar_sync_logs.calendar_id IS 'Google Calendar ID that was synced to';
COMMENT ON COLUMN public.calendar_sync_logs.synced_count IS 'Number of topics successfully synced';
COMMENT ON COLUMN public.calendar_sync_logs.skipped_count IS 'Number of topics skipped (already exist, etc.)';
COMMENT ON COLUMN public.calendar_sync_logs.errors IS 'Array of error messages encountered during sync';
COMMENT ON COLUMN public.calendar_sync_logs.sync_options IS 'Options used for this sync operation';

COMMIT; 