-- 20250621_fix_pod_activity_relationships.sql
-- Idempotent migration to fix missing relationships and provide aggregated pod activity view

BEGIN;

-- 1. Ensure foreign key from pod_activities.user_id -> profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'pod_activities'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
  ) THEN
    ALTER TABLE public.pod_activities
      ADD CONSTRAINT fk_pod_activities_profiles
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Provide aggregated pod activity view expected by API code
-- This view summarises quiz_completed activities to expose questions_answered, time_spent, accuracy per pod
DROP VIEW IF EXISTS public.pod_activity;

CREATE VIEW public.pod_activity AS
SELECT
  pa.pod_id,
  -- Sum of questions answered across quiz_completed activities (if stored)
  COALESCE(
    SUM((pa.activity_data->>'questions_answered')::INT),
    COUNT(*) FILTER (WHERE pa.activity_type = 'quiz_completed')
  ) AS questions_answered,
  -- Total time spent (seconds) if stored in activity_data.time_spent, else 0
  COALESCE(SUM((pa.activity_data->>'time_spent')::INT), 0) AS time_spent,
  -- Average accuracy (0-100) across quiz_completed activities if stored, else 0
  COALESCE(AVG((pa.activity_data->>'accuracy')::NUMERIC), 0) AS accuracy
FROM public.pod_activities pa
WHERE pa.activity_type = 'quiz_completed'
GROUP BY pa.pod_id;

-- Fix relationships for pod_activities table
ALTER TABLE IF EXISTS public.pod_activities
    DROP CONSTRAINT IF EXISTS pod_activities_pod_id_fkey,
    DROP CONSTRAINT IF EXISTS pod_activities_user_id_fkey;

-- Add foreign key constraints with proper ON DELETE behavior
ALTER TABLE public.pod_activities
    ADD CONSTRAINT pod_activities_pod_id_fkey 
    FOREIGN KEY (pod_id) 
    REFERENCES public.learning_pods(id) 
    ON DELETE CASCADE;

ALTER TABLE public.pod_activities
    ADD CONSTRAINT pod_activities_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_pod_activities_pod_id ON public.pod_activities(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_activities_user_id ON public.pod_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_pod_activities_created_at ON public.pod_activities(created_at DESC);

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can view activities for pods they are members of" ON public.pod_activities;
DROP POLICY IF EXISTS "Users can create activities for pods they are members of" ON public.pod_activities;

CREATE POLICY "Users can view activities for pods they are members of"
    ON public.pod_activities
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pod_memberships
            WHERE pod_memberships.pod_id = pod_activities.pod_id
            AND pod_memberships.user_id = auth.uid()
            AND pod_memberships.membership_status = 'active'
        )
    );

CREATE POLICY "Users can create activities for pods they are members of"
    ON public.pod_activities
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pod_memberships
            WHERE pod_memberships.pod_id = pod_activities.pod_id
            AND pod_memberships.user_id = auth.uid()
            AND pod_memberships.membership_status = 'active'
        )
    );

-- Ensure table has RLS enabled
ALTER TABLE public.pod_activities ENABLE ROW LEVEL SECURITY;

COMMIT; 