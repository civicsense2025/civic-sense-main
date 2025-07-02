-- Fix ALL circular policy references between learning_pods and pod_memberships
-- This migration completely removes circular dependencies and rebuilds policies safely

BEGIN;

-- Step 1: Disable RLS on both tables to avoid conflicts
ALTER TABLE public.learning_pods DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_memberships DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on both tables
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    -- Drop all policies on learning_pods
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'learning_pods' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.learning_pods', pol.policyname);
    END LOOP;
    
    -- Drop all policies on pod_memberships
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'pod_memberships' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.pod_memberships', pol.policyname);
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE public.learning_pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_memberships ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, non-circular policies for learning_pods
-- These policies do NOT reference pod_memberships to avoid circular dependencies

-- Pod creators can manage their pods
CREATE POLICY "learning_pods_creators_manage" ON public.learning_pods
    FOR ALL USING (created_by = auth.uid());

-- Step 5: Create simple, non-circular policies for pod_memberships  
-- These policies do NOT reference learning_pods to avoid circular dependencies

-- Users can view their own memberships
CREATE POLICY "pod_memberships_own_view" ON public.pod_memberships
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own memberships (for joining pods)
CREATE POLICY "pod_memberships_own_insert" ON public.pod_memberships
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own memberships (for leaving pods, etc.)
CREATE POLICY "pod_memberships_own_update" ON public.pod_memberships
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own memberships (for leaving pods)
CREATE POLICY "pod_memberships_own_delete" ON public.pod_memberships
    FOR DELETE USING (user_id = auth.uid());

-- Step 6: Add a separate view-only policy for learning_pods based on memberships
-- This uses a simple EXISTS without JOIN to avoid recursion
CREATE POLICY "learning_pods_members_view" ON public.learning_pods
    FOR SELECT USING (
        created_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.pod_memberships pm 
            WHERE pm.pod_id = learning_pods.id 
            AND pm.user_id = auth.uid() 
            AND pm.membership_status = 'active'
        )
    );

COMMIT; 