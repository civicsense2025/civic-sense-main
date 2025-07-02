-- Fix infinite recursion in user_roles RLS policies
-- Step 1: Temporarily disable RLS
ALTER TABLE "public"."user_roles" DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies and functions
DROP POLICY IF EXISTS "user_roles_policy" ON "public"."user_roles";
DROP POLICY IF EXISTS "user_roles_self_read" ON "public"."user_roles";
DROP POLICY IF EXISTS "user_roles_admin_all" ON "public"."user_roles";
DROP POLICY IF EXISTS "user_roles_admin_manage" ON "public"."user_roles";

-- Step 3: Create helper function to check roles without recursion
CREATE OR REPLACE FUNCTION check_user_role(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND user_roles.role = $2
  );
$$;

-- Step 4: Create new non-recursive policies using the helper function

-- Allow users to read their own roles
CREATE POLICY "user_roles_self_read" ON "public"."user_roles"
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow super_admins to do everything
CREATE POLICY "user_roles_super_admin_all" ON "public"."user_roles"
    FOR ALL
    USING (check_user_role(auth.uid(), 'super_admin'));

-- Allow admins to manage non-super-admin roles
CREATE POLICY "user_roles_admin_manage" ON "public"."user_roles"
    FOR ALL
    USING (
        check_user_role(auth.uid(), 'admin') 
        AND role != 'super_admin'
    );

-- Step 5: Re-enable RLS
ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_role TO service_role; 