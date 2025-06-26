-- Admin Panel Activity Tracking Schema
-- Tracks all admin actions, performance metrics, and system health

-- Create admin_panel schema
CREATE SCHEMA IF NOT EXISTS admin_panel;

-- Admin activity log for audit trail
CREATE TABLE IF NOT EXISTS admin_panel.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type VARCHAR(100) NOT NULL, -- e.g., 'content_created', 'user_updated', 'ai_generation'
  action_category VARCHAR(50) NOT NULL, -- e.g., 'content', 'users', 'system', 'ai'
  resource_type VARCHAR(50), -- e.g., 'question_topic', 'user', 'glossary_term'
  resource_id TEXT, -- ID of the affected resource
  action_details JSONB NOT NULL DEFAULT '{}', -- Detailed action data
  status VARCHAR(20) NOT NULL DEFAULT 'success', -- success, failure, partial
  error_message TEXT,
  error_details JSONB,
  ip_address INET,
  user_agent TEXT,
  duration_ms INTEGER, -- How long the action took
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for activity logs
CREATE INDEX idx_activity_logs_user_id ON admin_panel.activity_logs(admin_user_id);
CREATE INDEX idx_activity_logs_action_type ON admin_panel.activity_logs(action_type);
CREATE INDEX idx_activity_logs_status ON admin_panel.activity_logs(status);
CREATE INDEX idx_activity_logs_created_at ON admin_panel.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_resource ON admin_panel.activity_logs(resource_type, resource_id);

-- Performance metrics for admin operations
CREATE TABLE IF NOT EXISTS admin_panel.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(100) NOT NULL, -- e.g., 'page_load', 'api_call', 'db_query'
  metric_name VARCHAR(200) NOT NULL, -- Specific metric identifier
  value NUMERIC NOT NULL,
  unit VARCHAR(20) NOT NULL, -- e.g., 'ms', 'count', 'bytes'
  metadata JSONB DEFAULT '{}',
  admin_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance metrics
CREATE INDEX idx_performance_metrics_type ON admin_panel.performance_metrics(metric_type, created_at DESC);
CREATE INDEX idx_performance_metrics_name ON admin_panel.performance_metrics(metric_name, created_at DESC);

-- Admin panel preferences and state
CREATE TABLE IF NOT EXISTS admin_panel.user_preferences (
  admin_user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  preferences JSONB NOT NULL DEFAULT '{}', -- UI preferences, saved filters, etc.
  last_viewed_items JSONB DEFAULT '[]', -- Recently accessed items
  dashboard_layout JSONB DEFAULT '{}', -- Custom dashboard configuration
  notification_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bulk operation tracking
CREATE TABLE IF NOT EXISTS admin_panel.bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  operation_type VARCHAR(100) NOT NULL,
  total_items INTEGER NOT NULL,
  processed_items INTEGER DEFAULT 0,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  error_summary JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for bulk operations
CREATE INDEX idx_bulk_operations_user_id ON admin_panel.bulk_operations(admin_user_id);
CREATE INDEX idx_bulk_operations_status ON admin_panel.bulk_operations(status);

-- Admin alerts and notifications
CREATE TABLE IF NOT EXISTS admin_panel.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL, -- error, warning, info, success
  alert_category VARCHAR(50) NOT NULL, -- system, content, user, ai
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  severity INTEGER NOT NULL DEFAULT 1, -- 1-5, 5 being most severe
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for system alerts
CREATE INDEX idx_system_alerts_unresolved ON admin_panel.system_alerts(is_resolved, severity DESC, created_at DESC);

-- RLS Policies
ALTER TABLE admin_panel.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_panel.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_panel.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_panel.bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_panel.system_alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can access admin panel data
CREATE POLICY "Admins can view all activity logs"
  ON admin_panel.activity_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage performance metrics"
  ON admin_panel.performance_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage their preferences"
  ON admin_panel.user_preferences FOR ALL
  TO authenticated
  USING (admin_user_id = auth.uid())
  WITH CHECK (admin_user_id = auth.uid());

CREATE POLICY "Admins can view all bulk operations"
  ON admin_panel.bulk_operations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage system alerts"
  ON admin_panel.system_alerts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Helper function to log admin activity
CREATE OR REPLACE FUNCTION admin_panel.log_activity(
  p_action_type VARCHAR,
  p_action_category VARCHAR,
  p_resource_type VARCHAR DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_action_details JSONB DEFAULT '{}',
  p_status VARCHAR DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO admin_panel.activity_logs (
    admin_user_id,
    action_type,
    action_category,
    resource_type,
    resource_id,
    action_details,
    status,
    error_message,
    duration_ms
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_action_category,
    p_resource_type,
    p_resource_id,
    p_action_details,
    p_status,
    p_error_message,
    p_duration_ms
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

-- Trigger to update preferences timestamp
CREATE OR REPLACE FUNCTION admin_panel.update_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_preferences_timestamp
  BEFORE UPDATE ON admin_panel.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION admin_panel.update_preferences_timestamp();

-- =============================================================================
-- AI COMMAND CENTER HELPER FUNCTIONS
-- =============================================================================

-- Function to find duplicate public figures for the AI Command Center
CREATE OR REPLACE FUNCTION find_duplicate_public_figures()
RETURNS TABLE (
  original_id UUID,
  duplicate_id UUID,
  bioguide_id TEXT,
  full_name TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH duplicates AS (
    SELECT 
      pf.bioguide_id,
      pf.full_name,
      COUNT(*) as count,
      MIN(pf.id) as original_id,
      ARRAY_AGG(pf.id ORDER BY pf.created_at DESC) as all_ids
    FROM public_figures pf
    WHERE pf.bioguide_id IS NOT NULL
    GROUP BY pf.bioguide_id, pf.full_name
    HAVING COUNT(*) > 1
  )
  SELECT 
    d.original_id,
    UNNEST(d.all_ids[2:]) as duplicate_id,
    d.bioguide_id,
    d.full_name
  FROM duplicates d;
END;
$$; 