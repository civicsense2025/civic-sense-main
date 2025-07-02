-- Create user_events table
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  url TEXT NOT NULL,
  event_title TEXT,
  event_description TEXT,
  event_date DATE NOT NULL,
  source_type TEXT,
  source_metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_event_date ON user_events(event_date);
CREATE INDEX idx_user_events_status ON user_events(status);

-- Add RLS policies
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view their own events"
  ON user_events FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert their own events"
  ON user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their pending events
CREATE POLICY "Users can update their pending events"
  ON user_events FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_user_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_events_updated_at
  BEFORE UPDATE ON user_events
  FOR EACH ROW
  EXECUTE FUNCTION update_user_events_updated_at(); 