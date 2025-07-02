-- =============================================================================
-- SET ADMIN USER FOR TESTING
-- =============================================================================
-- This migration sets a specific user as admin for testing the admin panel

BEGIN;

-- Update a specific user to be admin (replace with actual user email/ID as needed)
-- For now, we'll create a function to set admin status by email

CREATE OR REPLACE FUNCTION set_user_admin_by_email(user_email TEXT, admin_status BOOLEAN DEFAULT TRUE)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
  rows_updated INTEGER;
BEGIN
  -- Find the user ID from auth.users
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found', user_email;
    RETURN FALSE;
  END IF;
  
  -- Update or insert the profile
  INSERT INTO profiles (id, is_admin, updated_at)
  VALUES (user_id, admin_status, NOW())
  ON CONFLICT (id) 
  DO UPDATE SET 
    is_admin = admin_status,
    updated_at = NOW();
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  
  IF rows_updated > 0 THEN
    RAISE NOTICE 'Successfully set admin status to % for user %', admin_status, user_email;
    RETURN TRUE;
  ELSE
    RAISE NOTICE 'Failed to update admin status for user %', user_email;
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for testing)
GRANT EXECUTE ON FUNCTION set_user_admin_by_email TO authenticated;

-- Example usage (uncomment and modify email as needed):
-- SELECT set_user_admin_by_email('your-email@example.com', TRUE);

COMMIT;

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION set_user_admin_by_email IS 'Sets admin status for a user by email address';

-- =============================================================================
-- USAGE INSTRUCTIONS
-- =============================================================================
-- 
-- To set a user as admin:
-- SELECT set_user_admin_by_email('user@example.com', TRUE);
-- 
-- To remove admin status:
-- SELECT set_user_admin_by_email('user@example.com', FALSE);
-- 
-- ============================================================================= 