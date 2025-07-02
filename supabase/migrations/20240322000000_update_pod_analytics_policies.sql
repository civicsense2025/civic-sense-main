-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Pod members can view analytics" ON public.pod_analytics;
DROP POLICY IF EXISTS "Pod members can insert analytics" ON public.pod_analytics;
DROP POLICY IF EXISTS "Pod members can update analytics" ON public.pod_analytics;
DROP POLICY IF EXISTS "System can manage analytics" ON public.pod_analytics;

-- Enable RLS
ALTER TABLE public.pod_analytics ENABLE ROW LEVEL SECURITY;

-- Policy for viewing analytics
CREATE POLICY "Pod members can view analytics" 
ON public.pod_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pod_memberships
    WHERE pod_memberships.pod_id = pod_analytics.pod_id
    AND pod_memberships.user_id = auth.uid()
    AND pod_memberships.membership_status = 'active'
  )
);

-- Policy for inserting analytics
CREATE POLICY "Pod members can insert analytics"
ON public.pod_analytics
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pod_memberships
    WHERE pod_memberships.pod_id = pod_analytics.pod_id
    AND pod_memberships.user_id = auth.uid()
    AND pod_memberships.membership_status = 'active'
  )
);

-- Policy for updating analytics
CREATE POLICY "Pod members can update analytics"
ON public.pod_analytics
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pod_memberships
    WHERE pod_memberships.pod_id = pod_analytics.pod_id
    AND pod_memberships.user_id = auth.uid()
    AND pod_memberships.membership_status = 'active'
  )
);

-- Policy for system functions (using service_role)
CREATE POLICY "System can manage analytics"
ON public.pod_analytics
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create similar policies for pod_member_analytics table
DROP POLICY IF EXISTS "Members can view their analytics" ON public.pod_member_analytics;
DROP POLICY IF EXISTS "Members can insert their analytics" ON public.pod_member_analytics;
DROP POLICY IF EXISTS "Members can update their analytics" ON public.pod_member_analytics;
DROP POLICY IF EXISTS "System can manage member analytics" ON public.pod_member_analytics;

-- Enable RLS
ALTER TABLE public.pod_member_analytics ENABLE ROW LEVEL SECURITY;

-- Policy for viewing member analytics
CREATE POLICY "Members can view their analytics"
ON public.pod_member_analytics
FOR SELECT
USING (
  -- Users can view their own analytics
  user_id = auth.uid()
  OR
  -- Pod members with view_progress permission can view other members' analytics
  EXISTS (
    SELECT 1 FROM pod_memberships
    WHERE pod_memberships.pod_id = pod_member_analytics.pod_id
    AND pod_memberships.user_id = auth.uid()
    AND pod_memberships.membership_status = 'active'
    AND pod_memberships.can_view_progress = true
  )
);

-- Policy for inserting member analytics
CREATE POLICY "Members can insert their analytics"
ON public.pod_member_analytics
FOR INSERT
WITH CHECK (
  -- Users can only insert their own analytics
  user_id = auth.uid()
  AND
  -- Must be a member of the pod
  EXISTS (
    SELECT 1 FROM pod_memberships
    WHERE pod_memberships.pod_id = pod_member_analytics.pod_id
    AND pod_memberships.user_id = auth.uid()
    AND pod_memberships.membership_status = 'active'
  )
);

-- Policy for updating member analytics
CREATE POLICY "Members can update their analytics"
ON public.pod_member_analytics
FOR UPDATE
USING (
  -- Users can only update their own analytics
  user_id = auth.uid()
  AND
  -- Must be a member of the pod
  EXISTS (
    SELECT 1 FROM pod_memberships
    WHERE pod_memberships.pod_id = pod_member_analytics.pod_id
    AND pod_memberships.user_id = auth.uid()
    AND pod_memberships.membership_status = 'active'
  )
);

-- Policy for system functions (using service_role)
CREATE POLICY "System can manage member analytics"
ON public.pod_member_analytics
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes to improve policy performance
CREATE INDEX IF NOT EXISTS idx_pod_analytics_pod_id ON public.pod_analytics(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_member_analytics_pod_id ON public.pod_member_analytics(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_member_analytics_user_id ON public.pod_member_analytics(user_id); 