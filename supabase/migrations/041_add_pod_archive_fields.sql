BEGIN;

-- Add archive fields to pods
ALTER TABLE public.learning_pods 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id) NULL;

-- Create index for archived pods
CREATE INDEX IF NOT EXISTS idx_pods_archived 
ON public.learning_pods(archived_at) 
WHERE archived_at IS NOT NULL;

-- Create index for non-archived pods (most common query)
CREATE INDEX IF NOT EXISTS idx_pods_active 
ON public.learning_pods(created_at DESC) 
WHERE archived_at IS NULL;

-- Update RLS policies to exclude archived pods by default
DROP POLICY IF EXISTS "Users can view pods they are members of" ON public.learning_pods;

CREATE POLICY "Users can view active pods they are members of" 
ON public.learning_pods FOR SELECT 
USING (
  archived_at IS NULL AND
  EXISTS (
    SELECT 1 FROM public.pod_memberships 
    WHERE pod_memberships.pod_id = learning_pods.id 
    AND pod_memberships.user_id = auth.uid()
  )
);

-- Separate policy for viewing archived pods (admins only)
CREATE POLICY "Admins can view archived pods they administered" 
ON public.learning_pods FOR SELECT 
USING (
  archived_at IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.pod_memberships 
    WHERE pod_memberships.pod_id = learning_pods.id 
    AND pod_memberships.user_id = auth.uid()
    AND pod_memberships.role IN ('admin', 'parent', 'organizer')
  )
);

-- Add activity type for archiving
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'pod_activities_activity_type_check'
  ) THEN
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
  ELSE
    -- Update existing constraint to include new types
    ALTER TABLE public.pod_activities 
    DROP CONSTRAINT pod_activities_activity_type_check;
    
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
END $$;

COMMIT;