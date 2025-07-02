-- Fix RLS policy for pod_settings to allow pod creators to insert during creation
-- This resolves the "new row violates row-level security policy" error

BEGIN;

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Pod settings editable by pod admins" ON public.pod_settings;

-- Create a new policy that allows both:
-- 1. Pod admins to manage settings (existing functionality)
-- 2. Pod creators to insert settings during pod creation
CREATE POLICY "Pod settings manageable by pod admins and creators" ON public.pod_settings
  FOR ALL USING (
    -- Allow if user is an admin member of the pod
    EXISTS (
      SELECT 1 FROM public.pod_memberships pm 
      WHERE pm.pod_id = pod_settings.pod_id 
      AND pm.user_id = auth.uid() 
      AND pm.role::text = ANY(ARRAY['admin', 'parent', 'organizer', 'teacher']) 
      AND pm.membership_status::text = 'active'
    )
    OR
    -- Allow if user is the creator of the pod (for initial settings creation)
    EXISTS (
      SELECT 1 FROM public.learning_pods lp 
      WHERE lp.id = pod_settings.pod_id 
      AND lp.created_by = auth.uid()
    )
  );

-- Also ensure INSERT operations are allowed for pod creators
-- This is needed because the trigger might run as INSERT specifically
CREATE POLICY "Pod settings insertable by pod creators" ON public.pod_settings
  FOR INSERT WITH CHECK (
    -- Allow insert if user is the creator of the pod
    EXISTS (
      SELECT 1 FROM public.learning_pods lp 
      WHERE lp.id = pod_settings.pod_id 
      AND lp.created_by = auth.uid()
    )
    OR
    -- Allow insert if user is already an admin member of the pod
    EXISTS (
      SELECT 1 FROM public.pod_memberships pm 
      WHERE pm.pod_id = pod_settings.pod_id 
      AND pm.user_id = auth.uid() 
      AND pm.role::text = ANY(ARRAY['admin', 'parent', 'organizer', 'teacher']) 
      AND pm.membership_status::text = 'active'
    )
  );

COMMIT; 