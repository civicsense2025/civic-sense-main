-- Fix infinite recursion in RLS policies - SIMPLIFIED VERSION
-- This migration drops all existing policies and recreates them with zero circular references

BEGIN;

-- Disable RLS temporarily to avoid conflicts during policy changes
ALTER TABLE learning_pods DISABLE ROW LEVEL SECURITY;
ALTER TABLE pod_memberships DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on both tables to start fresh
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
        EXECUTE format('DROP POLICY IF EXISTS %I ON learning_pods', pol.policyname);
    END LOOP;
    
    -- Drop all policies on pod_memberships  
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'pod_memberships' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON pod_memberships', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE learning_pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_memberships ENABLE ROW LEVEL SECURITY;

-- SIMPLE POLICIES FOR learning_pods (no circular references)
CREATE POLICY "Users can view their created pods" ON learning_pods
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create pods" ON learning_pods
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Pod creators can update their pods" ON learning_pods
  FOR UPDATE USING (created_by = auth.uid());

-- SIMPLE POLICIES FOR pod_memberships (no circular references)
-- Allow users to view their own memberships
CREATE POLICY "Users can view their own memberships" ON pod_memberships
  FOR SELECT USING (user_id = auth.uid());

-- Allow users to add themselves as members (for pod creation)
CREATE POLICY "Users can add themselves as members" ON pod_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow users to update their own membership status (for leaving pods, etc.)
CREATE POLICY "Users can update their own memberships" ON pod_memberships
  FOR UPDATE USING (user_id = auth.uid());

-- ADDITIONAL POLICIES FOR ADMINS (after pod creation)
-- These use EXISTS to avoid circular references
CREATE POLICY "Pod creators can view all pod memberships" ON pod_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_pods 
      WHERE learning_pods.id = pod_memberships.pod_id 
      AND learning_pods.created_by = auth.uid()
    )
  );

CREATE POLICY "Pod creators can manage memberships" ON pod_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM learning_pods 
      WHERE learning_pods.id = pod_memberships.pod_id 
      AND learning_pods.created_by = auth.uid()
    )
  );

COMMIT; 