-- ============================================================================
-- User Integrations Table Migration
-- Stores OAuth tokens and integration data for external services like Google
-- ============================================================================

BEGIN;

-- User integrations table for OAuth tokens and external service connections
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'microsoft', etc.
  
  -- OAuth tokens
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  
  -- Scopes and permissions
  scopes TEXT[] DEFAULT '{}',
  
  -- Provider-specific user info
  provider_user_id TEXT,
  provider_email TEXT,
  provider_name TEXT,
  
  -- Integration status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one integration per user per provider
  UNIQUE(user_id, provider)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id 
ON public.user_integrations(user_id);

CREATE INDEX IF NOT EXISTS idx_user_integrations_provider 
ON public.user_integrations(provider);

CREATE INDEX IF NOT EXISTS idx_user_integrations_active 
ON public.user_integrations(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.user_integrations;
CREATE POLICY "Users can view their own integrations" 
ON public.user_integrations FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own integrations" ON public.user_integrations;
CREATE POLICY "Users can insert their own integrations" 
ON public.user_integrations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own integrations" ON public.user_integrations;
CREATE POLICY "Users can update their own integrations" 
ON public.user_integrations FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.user_integrations;
CREATE POLICY "Users can delete their own integrations" 
ON public.user_integrations FOR DELETE 
USING (auth.uid() = user_id);

-- Updated at trigger
DROP TRIGGER IF EXISTS trigger_user_integrations_updated_at ON public.user_integrations;
CREATE TRIGGER trigger_user_integrations_updated_at
    BEFORE UPDATE ON public.user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.user_integrations IS 'OAuth tokens and integration data for external services';
COMMENT ON COLUMN public.user_integrations.provider IS 'External service provider (google, microsoft, etc.)';
COMMENT ON COLUMN public.user_integrations.access_token IS 'OAuth access token for API calls';
COMMENT ON COLUMN public.user_integrations.refresh_token IS 'OAuth refresh token for renewing access';
COMMENT ON COLUMN public.user_integrations.scopes IS 'Array of granted OAuth scopes/permissions';
COMMENT ON COLUMN public.user_integrations.provider_user_id IS 'User ID from the external provider';
COMMENT ON COLUMN public.user_integrations.is_active IS 'Whether this integration is currently active';

COMMIT; 