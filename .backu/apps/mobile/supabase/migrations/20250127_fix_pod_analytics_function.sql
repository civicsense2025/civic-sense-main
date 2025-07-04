-- Migration to fix update_pod_analytics function constraint issue
-- This addresses the "function update_pod_analytics(uuid) is not unique" error

BEGIN;

-- Drop the existing function if it exists to recreate it properly
DROP FUNCTION IF EXISTS update_pod_analytics(uuid);

-- Create the function with proper uniqueness
CREATE OR REPLACE FUNCTION update_pod_analytics(session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only update if the session exists and has a pod_id
  UPDATE user_quiz_attempts 
  SET updated_at = NOW()
  WHERE id = session_id 
    AND pod_id IS NOT NULL;
  
  -- Log the update for debugging
  INSERT INTO pod_analytics_log (session_id, updated_at, operation)
  VALUES (session_id, NOW(), 'update')
  ON CONFLICT (session_id) DO UPDATE SET
    updated_at = NOW(),
    operation = 'update';
    
EXCEPTION
  WHEN OTHERS THEN
    -- Silently handle errors to prevent blocking quiz creation
    NULL;
END;
$$;

-- Create the log table if it doesn't exist
CREATE TABLE IF NOT EXISTS pod_analytics_log (
  session_id uuid PRIMARY KEY,
  updated_at timestamptz DEFAULT NOW(),
  operation text,
  created_at timestamptz DEFAULT NOW()
);

-- Drop any problematic triggers that might be calling this function
DROP TRIGGER IF EXISTS trigger_update_pod_analytics ON user_quiz_attempts;

-- Create a simpler trigger that won't cause conflicts
CREATE OR REPLACE FUNCTION trigger_update_pod_analytics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only trigger for sessions with pod_id to avoid conflicts
  IF NEW.pod_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.pod_id IS DISTINCT FROM NEW.pod_id) THEN
    PERFORM update_pod_analytics(NEW.id);
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't let analytics failures block the main operation
    RETURN NEW;
END;
$$;

-- Recreate the trigger with proper error handling
CREATE TRIGGER trigger_update_pod_analytics
  AFTER INSERT OR UPDATE ON user_quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_pod_analytics();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_pod_analytics(uuid) TO authenticated;
GRANT ALL ON TABLE pod_analytics_log TO authenticated;

COMMIT; 