-- Fix RLS policies for archive functionality
-- Migration: 042_fix_archive_rls_policies.sql
BEGIN;

-- Add archive fields to learning_pods (if they don't exist)
ALTER TABLE public.learning_pods 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id) NULL;

-- Create index for archived pods
CREATE INDEX IF NOT EXISTS idx_learning_pods_archived 
ON public.learning_pods(archived_at) 
WHERE archived_at IS NOT NULL;

-- Create index for non-archived pods (most common query)
CREATE INDEX IF NOT EXISTS idx_learning_pods_active 
ON public.learning_pods(created_at DESC) 
WHERE archived_at IS NULL;

-- Drop the conflicting policies that are causing infinite recursion
DROP POLICY IF EXISTS "Users can view active pods they are members of" ON public.learning_pods;
DROP POLICY IF EXISTS "Admins can view archived pods they administered" ON public.learning_pods;

-- Create new simplified policies that don't cause recursion
CREATE POLICY "Users can view pods they are members of" 
ON public.learning_pods FOR SELECT 
USING (
  -- Allow viewing non-archived pods if user is a member
  (archived_at IS NULL AND id IN (
    SELECT pod_id FROM public.pod_memberships 
    WHERE user_id = auth.uid() 
    AND membership_status = 'active'
  ))
  OR
  -- Allow viewing archived pods if user was an admin
  (archived_at IS NOT NULL AND id IN (
    SELECT pod_id FROM public.pod_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'parent', 'organizer', 'teacher')
  ))
);

-- Update activity types constraint (if table exists)
DO $$
BEGIN
  -- Check if pod_activities table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pod_activities') THEN
    -- Drop existing constraint if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_name = 'pod_activities_activity_type_check'
    ) THEN
      ALTER TABLE public.pod_activities 
      DROP CONSTRAINT pod_activities_activity_type_check;
    END IF;
    
    -- Add updated constraint
    ALTER TABLE public.pod_activities 
    ADD CONSTRAINT pod_activities_activity_type_check 
    CHECK (activity_type IN (
      'member_joined', 
      'member_left', 
      'quiz_completed', 
      'achievement_unlocked', 
      'milestone_reached',
      'settings_updated',
      'ownership_transferred',
      'pod_archived',
      'pod_restored'
    ));
  END IF;
  
  -- Check if learning_pod_activities table exists (alternative name)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_pod_activities') THEN
    -- Drop existing constraint if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_name = 'learning_pod_activities_activity_type_check'
    ) THEN
      ALTER TABLE public.learning_pod_activities 
      DROP CONSTRAINT learning_pod_activities_activity_type_check;
    END IF;
    
    -- Add updated constraint
    ALTER TABLE public.learning_pod_activities 
    ADD CONSTRAINT learning_pod_activities_activity_type_check 
    CHECK (activity_type IN (
      'member_joined', 
      'member_left', 
      'quiz_completed', 
      'achievement_unlocked', 
      'milestone_reached',
      'settings_updated',
      'ownership_transferred',
      'pod_archived',
      'pod_restored'
    ));
  END IF;
END $$;

COMMIT; 