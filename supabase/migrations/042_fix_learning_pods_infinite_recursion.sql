-- Fix infinite recursion in learning_pods RLS policies
-- This migration removes circular policy references and simplifies access control

BEGIN;

-- Temporarily disable RLS to avoid conflicts during policy changes
ALTER TABLE public.learning_pods DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on learning_pods to start fresh
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'learning_pods' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.learning_pods', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.learning_pods ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for learning_pods

-- 1. Pod creators can manage their pods (no circular reference)
CREATE POLICY "Pod creators can manage pods" ON public.learning_pods
    FOR ALL USING (created_by = auth.uid());

-- 2. Allow viewing pods where user is a member (using a direct subquery, no circular reference)
CREATE POLICY "Users can view pods they are members of" ON public.learning_pods
    FOR SELECT USING (
        id IN (
            SELECT pod_id 
            FROM public.pod_memberships 
            WHERE user_id = auth.uid() 
            AND membership_status = 'active'
        )
    );

-- 3. Allow teachers/admins to update pods where they have admin role (using direct subquery)
CREATE POLICY "Pod admins can update pods" ON public.learning_pods
    FOR UPDATE USING (
        id IN (
            SELECT pod_id 
            FROM public.pod_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'teacher', 'organizer', 'parent')
            AND membership_status = 'active'
        )
    );

COMMIT; 