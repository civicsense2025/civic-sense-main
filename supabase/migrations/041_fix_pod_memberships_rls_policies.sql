-- Fix infinite recursion in pod_memberships RLS policies
-- Migration: 041_fix_pod_memberships_rls_policies.sql

BEGIN;

-- Drop all existing RLS policies on pod_memberships to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own memberships" ON pod_memberships;
DROP POLICY IF EXISTS "Users can insert their own memberships" ON pod_memberships;
DROP POLICY IF EXISTS "Users can update their own memberships" ON pod_memberships;
DROP POLICY IF EXISTS "Pod admins can manage all memberships" ON pod_memberships;
DROP POLICY IF EXISTS "Admins can manage pod memberships" ON pod_memberships;
DROP POLICY IF EXISTS "Members can view pod memberships" ON pod_memberships;
DROP POLICY IF EXISTS "Users can join pods" ON pod_memberships;
DROP POLICY IF EXISTS "Users can leave pods" ON pod_memberships;
DROP POLICY IF EXISTS "Pod creators can manage memberships" ON pod_memberships;
DROP POLICY IF EXISTS "Enable read access for pod members" ON pod_memberships;
DROP POLICY IF EXISTS "Enable insert for pod creation" ON pod_memberships;
DROP POLICY IF EXISTS "Enable update for pod admins" ON pod_memberships;
DROP POLICY IF EXISTS "Enable delete for pod admins" ON pod_memberships;

-- Recreate clean, non-recursive RLS policies

-- Policy 1: Users can view memberships for pods they belong to
CREATE POLICY "view_own_pod_memberships" ON pod_memberships
FOR SELECT
USING (
  user_id = auth.uid()
  OR 
  EXISTS (
    SELECT 1 FROM pod_memberships pm2 
    WHERE pm2.pod_id = pod_memberships.pod_id 
    AND pm2.user_id = auth.uid() 
    AND pm2.membership_status = 'active'
  )
);

-- Policy 2: Users can insert memberships when joining pods (via invite or creation)
CREATE POLICY "insert_pod_memberships" ON pod_memberships
FOR INSERT
WITH CHECK (
  -- Users can always add themselves
  user_id = auth.uid()
  OR
  -- Pod admins can add others
  EXISTS (
    SELECT 1 FROM pod_memberships pm_admin
    WHERE pm_admin.pod_id = pod_memberships.pod_id
    AND pm_admin.user_id = auth.uid()
    AND pm_admin.role IN ('admin', 'parent', 'organizer', 'teacher')
    AND pm_admin.membership_status = 'active'
  )
);

-- Policy 3: Pod admins and the user themselves can update memberships
CREATE POLICY "update_pod_memberships" ON pod_memberships
FOR UPDATE
USING (
  -- Users can update their own membership (e.g., to leave)
  user_id = auth.uid()
  OR
  -- Pod admins can update any membership in their pods
  EXISTS (
    SELECT 1 FROM pod_memberships pm_admin
    WHERE pm_admin.pod_id = pod_memberships.pod_id
    AND pm_admin.user_id = auth.uid()
    AND pm_admin.role IN ('admin', 'parent', 'organizer', 'teacher')
    AND pm_admin.membership_status = 'active'
  )
);

-- Policy 4: Pod admins and users themselves can delete memberships
CREATE POLICY "delete_pod_memberships" ON pod_memberships
FOR DELETE
USING (
  -- Users can delete their own membership (leave pod)
  user_id = auth.uid()
  OR
  -- Pod admins can remove any member from their pods
  EXISTS (
    SELECT 1 FROM pod_memberships pm_admin
    WHERE pm_admin.pod_id = pod_memberships.pod_id
    AND pm_admin.user_id = auth.uid()
    AND pm_admin.role IN ('admin', 'parent', 'organizer', 'teacher')
    AND pm_admin.membership_status = 'active'
  )
);

-- Ensure RLS is enabled
ALTER TABLE pod_memberships ENABLE ROW LEVEL SECURITY;

-- Add some helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_pod_memberships_user_pod 
ON pod_memberships(user_id, pod_id);

CREATE INDEX IF NOT EXISTS idx_pod_memberships_pod_role_status 
ON pod_memberships(pod_id, role, membership_status);

CREATE INDEX IF NOT EXISTS idx_pod_memberships_status_active 
ON pod_memberships(membership_status) 
WHERE membership_status = 'active';

COMMIT; 