-- Add is_admin column to profiles table for admin access control

BEGIN;

-- Add is_admin column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
    
    -- Add index for efficient admin lookups
    CREATE INDEX idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
    
    -- Add comment
    COMMENT ON COLUMN profiles.is_admin IS 'Whether the user has admin privileges';
  END IF;
END $$;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- Update RLS policies for media organizations to use the function
DROP POLICY IF EXISTS "Admins can manage media organizations" ON media_organizations;

CREATE POLICY "Admins can manage media organizations" ON media_organizations
  FOR ALL USING (is_admin(auth.uid()));

-- Also create view/insert policies for non-admins
CREATE POLICY "Users can view media organizations" ON media_organizations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can suggest media organizations" ON media_organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

COMMIT; 