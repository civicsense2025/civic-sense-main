-- ============================================================================
-- FIX INFINITE RECURSION IN USER_ROLES RLS POLICIES
-- ============================================================================
-- This migration fixes the infinite recursion issue by implementing
-- recursion-proof RLS policies for the user_roles table.

BEGIN;

-- Step 1: Drop ALL existing problematic policies
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
DROP POLICY IF EXISTS "user_roles_super_admin_update" ON user_roles;

-- Step 2: Ensure RLS is enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create Security Definer function for checking user roles
-- This function bypasses RLS because it runs with elevated privileges
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Direct query with bypassed RLS (SECURITY DEFINER)
    SELECT role INTO user_role
    FROM user_roles
    WHERE user_id = check_user_id
    LIMIT 1;
    
    -- Return true if admin or super_admin
    RETURN user_role IN ('admin', 'super_admin');
END;
$$;

-- Step 4: Create Security Definer function for checking super admin
CREATE OR REPLACE FUNCTION public.is_super_admin_user(check_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Direct query with bypassed RLS (SECURITY DEFINER)
    SELECT role INTO user_role
    FROM user_roles
    WHERE user_id = check_user_id
    LIMIT 1;
    
    -- Return true only if super_admin
    RETURN user_role = 'super_admin';
END;
$$;

-- Step 5: Create simple, non-recursive RLS policies

-- Policy 1: Users can always view their own role (no cross-reference)
CREATE POLICY "user_roles_self_view" ON user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Only authenticated users can view roles (basic protection)
CREATE POLICY "user_roles_authenticated_view" ON user_roles
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy 3: Admins can manage user roles (uses SECURITY DEFINER function)
CREATE POLICY "user_roles_admin_manage" ON user_roles
    FOR ALL
    USING (
        auth.uid() IS NOT NULL 
        AND public.is_admin_user(auth.uid())
        AND role != 'super_admin'  -- Admins cannot manage super_admin roles
    );

-- Policy 4: Super admins can manage all roles (uses SECURITY DEFINER function)
CREATE POLICY "user_roles_super_admin_all" ON user_roles
    FOR ALL
    USING (
        auth.uid() IS NOT NULL 
        AND public.is_super_admin_user(auth.uid())
    );

-- Step 6: Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin_user(UUID) TO authenticated;

-- Step 7: Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Step 8: Insert default admin user if not exists (for development)
-- This helps prevent lockout during development
INSERT INTO user_roles (user_id, role, created_at, updated_at)
SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID,
    'super_admin',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE role = 'super_admin'
)
ON CONFLICT (user_id, role) DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Test the new functions work without recursion
-- SELECT public.is_admin_user(auth.uid());
-- SELECT public.is_super_admin_user(auth.uid());

-- Check that policies are correctly applied
-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'user_roles' 
-- AND schemaname = 'public'; 