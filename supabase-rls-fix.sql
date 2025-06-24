-- ============================================================================
-- SUPABASE RLS POLICIES: INFINITE RECURSION FIX
-- ============================================================================
-- This file contains recursion-proof RLS policies for user_roles table
-- and provides multiple strategies to avoid infinite recursion.

-- Strategy 1: Security Definer Function (Recommended)
-- ============================================================================

-- Drop existing problematic policies first
DROP POLICY IF EXISTS "user_roles_admin_delete" ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_insert" ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_manage" ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_select" ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_update" ON user_roles;
DROP POLICY IF EXISTS "user_roles_self_read" ON user_roles;
DROP POLICY IF EXISTS "user_roles_super_admin_all" ON user_roles;
DROP POLICY IF EXISTS "user_roles_super_admin_delete" ON user_roles;
DROP POLICY IF EXISTS "user_roles_super_admin_insert" ON user_roles;
DROP POLICY IF EXISTS "user_roles_super_admin_select" ON user_roles;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS check_user_role_safe(uuid, text);
DROP FUNCTION IF EXISTS get_user_role_safe(uuid);

-- Create a security definer function that bypasses RLS
CREATE OR REPLACE FUNCTION get_user_role_safe(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM user_roles WHERE user_id = user_uuid LIMIT 1),
    'user'
  );
$$;

-- Create a safe role checking function
CREATE OR REPLACE FUNCTION check_user_role_safe(user_uuid uuid, required_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN required_role = 'super_admin' THEN
      EXISTS (SELECT 1 FROM user_roles WHERE user_id = user_uuid AND role = 'super_admin')
    WHEN required_role = 'admin' THEN
      EXISTS (SELECT 1 FROM user_roles WHERE user_id = user_uuid AND role IN ('admin', 'super_admin'))
    WHEN required_role = 'user' THEN
      TRUE -- All authenticated users are at least 'user' level
    ELSE
      FALSE
  END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_role_safe(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_role_safe(uuid, text) TO authenticated;

-- ============================================================================
-- NEW RECURSION-PROOF RLS POLICIES
-- ============================================================================

-- Policy 1: Users can always read their own role
CREATE POLICY "user_roles_self_select" ON user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Super admins can do everything (using function that bypasses RLS)
CREATE POLICY "user_roles_super_admin_full_access" ON user_roles
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND get_user_role_safe(auth.uid()) = 'super_admin'
);

-- Policy 3: Admins can read all roles
CREATE POLICY "user_roles_admin_select_all" ON user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND get_user_role_safe(auth.uid()) IN ('admin', 'super_admin')
);

-- Policy 4: Admins can manage non-admin roles
CREATE POLICY "user_roles_admin_manage_users" ON user_roles
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND get_user_role_safe(auth.uid()) IN ('admin', 'super_admin')
  AND role NOT IN ('admin', 'super_admin')
);

-- Policy 5: Prevent privilege escalation - users cannot grant admin roles
CREATE POLICY "user_roles_prevent_escalation" ON user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN role IN ('admin', 'super_admin') THEN
      get_user_role_safe(auth.uid()) = 'super_admin'
    ELSE
      TRUE
  END
);

-- ============================================================================
-- ALTERNATIVE STRATEGY: JWT CLAIMS APPROACH
-- ============================================================================

-- If you prefer using JWT claims instead of database queries:
/*
-- Function to get role from JWT claims
CREATE OR REPLACE FUNCTION get_user_role_from_jwt()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'user_role',
    'user'
  );
$$;

-- Then policies would use:
-- get_user_role_from_jwt() = 'admin'
-- Instead of querying user_roles table
*/

-- ============================================================================
-- STRATEGY 3: SEPARATE AUTHORIZATION TABLE
-- ============================================================================

-- Create a separate table for fast role lookups (optional)
/*
CREATE TABLE IF NOT EXISTS user_auth_cache (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on auth cache
ALTER TABLE user_auth_cache ENABLE ROW LEVEL SECURITY;

-- Simple policies for auth cache (no recursion risk)
CREATE POLICY "auth_cache_self_read" ON user_auth_cache
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Trigger to sync user_roles with auth_cache
CREATE OR REPLACE FUNCTION sync_user_auth_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO user_auth_cache (user_id, role, updated_at)
    VALUES (NEW.user_id, NEW.role, now())
    ON CONFLICT (user_id)
    DO UPDATE SET
      role = NEW.role,
      updated_at = now();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM user_auth_cache WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER sync_user_auth_cache_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION sync_user_auth_cache();
*/

-- ============================================================================
-- UTILITY FUNCTIONS FOR ADMIN CHECKS
-- ============================================================================

-- Check if current user is admin (safe function)
CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_user_role_safe(auth.uid()) IN ('admin', 'super_admin');
$$;

-- Check if current user is super admin
CREATE OR REPLACE FUNCTION current_user_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_user_role_safe(auth.uid()) = 'super_admin';
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION current_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_is_super_admin() TO authenticated;

-- ============================================================================
-- POLICIES FOR OTHER ADMIN TABLES (Examples)
-- ============================================================================

-- Example: Events table policies using safe functions
/*
CREATE POLICY "events_admin_full_access" ON events
FOR ALL
TO authenticated
USING (current_user_is_admin());

CREATE POLICY "events_public_read" ON events
FOR SELECT
TO authenticated
USING (is_active = true);
*/

-- ============================================================================
-- TESTING QUERIES
-- ============================================================================

-- Test the functions (run these after creating the policies)
/*
-- Test role checking
SELECT get_user_role_safe(auth.uid());
SELECT check_user_role_safe(auth.uid(), 'admin');
SELECT current_user_is_admin();
SELECT current_user_is_super_admin();

-- Test policy access
SELECT * FROM user_roles; -- Should work based on your role
*/

-- ============================================================================
-- EMERGENCY DISABLE (if needed)
-- ============================================================================

-- If you need to emergency disable RLS to fix issues:
/*
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
-- Fix issues, then re-enable:
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
*/ 