-- Create an enum for topic status types
CREATE TYPE topic_status_type AS ENUM ('breaking', 'featured', 'trending', 'viral');

-- Create table to track topic status history
CREATE TABLE topic_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL REFERENCES question_topics(topic_id),
  status_type topic_status_type NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  reason TEXT, -- Why the topic was marked with this status
  added_by UUID REFERENCES auth.users(id), -- Who marked it
  engagement_metrics JSONB, -- Store metrics that led to this status
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_topic_status_history_topic_id ON topic_status_history(topic_id);
CREATE INDEX idx_topic_status_history_status_type ON topic_status_history(status_type);
CREATE INDEX idx_topic_status_history_started_at ON topic_status_history(started_at);
CREATE INDEX idx_topic_status_history_ended_at ON topic_status_history(ended_at);

-- Add RLS policies
ALTER TABLE topic_status_history ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow read access to everyone" 
  ON topic_status_history
  FOR SELECT 
  TO public 
  USING (true);

-- Allow insert/update only to authenticated users
CREATE POLICY "Allow insert for authenticated users" 
  ON topic_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" 
  ON topic_status_history
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update topic status
CREATE OR REPLACE FUNCTION update_topic_status(
  p_topic_id TEXT,
  p_status_type topic_status_type,
  p_reason TEXT DEFAULT NULL,
  p_engagement_metrics JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_previous_status RECORD;
  v_new_status_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if there's an active status of this type
  SELECT * INTO v_previous_status
  FROM topic_status_history
  WHERE topic_id = p_topic_id 
    AND status_type = p_status_type
    AND ended_at IS NULL;
    
  -- If exists, end it
  IF v_previous_status.id IS NOT NULL THEN
    UPDATE topic_status_history
    SET ended_at = NOW(),
        updated_at = NOW()
    WHERE id = v_previous_status.id;
  END IF;
  
  -- Insert new status
  INSERT INTO topic_status_history (
    topic_id,
    status_type,
    reason,
    added_by,
    engagement_metrics
  ) VALUES (
    p_topic_id,
    p_status_type,
    p_reason,
    v_user_id,
    p_engagement_metrics
  )
  RETURNING id INTO v_new_status_id;
  
  -- Update the flag in question_topics table
  UPDATE question_topics
  SET 
    is_breaking = CASE WHEN p_status_type = 'breaking' THEN true ELSE is_breaking END,
    is_featured = CASE WHEN p_status_type = 'featured' THEN true ELSE is_featured END,
    updated_at = NOW()
  WHERE topic_id = p_topic_id;
  
  -- Return the result
  RETURN jsonb_build_object(
    'status', 'success',
    'topic_id', p_topic_id,
    'status_type', p_status_type,
    'status_id', v_new_status_id
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_topic_status TO authenticated;

-- Create function to end topic status
CREATE OR REPLACE FUNCTION end_topic_status(
  p_topic_id TEXT,
  p_status_type topic_status_type
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status_id UUID;
BEGIN
  -- Find and end the active status
  UPDATE topic_status_history
  SET 
    ended_at = NOW(),
    updated_at = NOW()
  WHERE topic_id = p_topic_id 
    AND status_type = p_status_type
    AND ended_at IS NULL
  RETURNING id INTO v_status_id;
  
  -- Update the flag in question_topics table
  UPDATE question_topics
  SET 
    is_breaking = CASE WHEN p_status_type = 'breaking' THEN false ELSE is_breaking END,
    is_featured = CASE WHEN p_status_type = 'featured' THEN false ELSE is_featured END,
    updated_at = NOW()
  WHERE topic_id = p_topic_id;
  
  -- Return the result
  RETURN jsonb_build_object(
    'status', 'success',
    'topic_id', p_topic_id,
    'status_type', p_status_type,
    'status_id', v_status_id
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION end_topic_status TO authenticated; 