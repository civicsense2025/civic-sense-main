-- Fix pod_memberships RLS policies - clean slate approach
-- Migration: 043_fix_pod_memberships_policies_clean.sql

BEGIN;

-- Drop ALL existing policies on pod_memberships to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Get all policies on pod_memberships table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'pod_memberships'
    LOOP
        -- Drop each policy
        EXECUTE format('DROP POLICY IF EXISTS %I ON pod_memberships', policy_record.policyname);
    END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE pod_memberships ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- 1. Users can view their own memberships
CREATE POLICY "Users can view own memberships" ON pod_memberships
FOR SELECT
USING (user_id = auth.uid());

-- 2. Users can view memberships of pods they belong to (for seeing pod member lists)
CREATE POLICY "Users can view pod member lists" ON pod_memberships
FOR SELECT
USING (
    pod_id IN (
        SELECT pod_id 
        FROM pod_memberships pm2 
        WHERE pm2.user_id = auth.uid() 
        AND pm2.membership_status = 'active'
    )
);

-- 3. Pod admins can manage memberships (insert, update, delete)
CREATE POLICY "Pod admins can manage memberships" ON pod_memberships
FOR ALL
USING (
    pod_id IN (
        SELECT pm_admin.pod_id 
        FROM pod_memberships pm_admin 
        WHERE pm_admin.user_id = auth.uid() 
        AND pm_admin.membership_status = 'active'
        AND pm_admin.role IN ('admin', 'parent', 'organizer', 'teacher')
    )
);

-- 4. Allow users to insert their own membership when joining via invite
CREATE POLICY "Users can join pods via invite" ON pod_memberships
FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND membership_status = 'pending'
);

-- 5. Service role (for server-side operations) has full access
CREATE POLICY "Service role full access" ON pod_memberships
FOR ALL
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

-- 6. Allow authenticated users to insert their own memberships when creating pods
CREATE POLICY "Pod creators can add themselves" ON pod_memberships
FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND role IN ('admin', 'teacher', 'parent', 'organizer')
);

COMMIT; 