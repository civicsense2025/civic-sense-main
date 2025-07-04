-- Fix RLS policies for custom_content_generations to allow AI generation
-- This migration creates permissive policies that avoid infinite recursion

BEGIN;

-- ============================================================================
-- 1. ENSURE RLS IS ENABLED
-- ============================================================================

ALTER TABLE public.custom_content_generations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ============================================================================

-- Policy 1: Allow authenticated users to insert their own content
-- CRITICAL: This uses auth.uid() directly, no table joins = no recursion
CREATE POLICY "allow_user_insert_own_content" ON public.custom_content_generations
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id::uuid
  );

-- Policy 2: Allow users to read their own content  
-- CRITICAL: This uses auth.uid() directly, no table joins = no recursion
CREATE POLICY "allow_user_read_own_content" ON public.custom_content_generations
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = user_id::uuid
  );

-- Policy 3: Allow users to update their own content
-- CRITICAL: This uses auth.uid() directly, no table joins = no recursion  
CREATE POLICY "allow_user_update_own_content" ON public.custom_content_generations
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id::uuid)
  WITH CHECK (auth.uid() = user_id::uuid);

-- Policy 4: Allow users to delete their own content
-- CRITICAL: This uses auth.uid() directly, no table joins = no recursion
CREATE POLICY "allow_user_delete_own_content" ON public.custom_content_generations
  FOR DELETE 
  TO authenticated
  USING (
    auth.uid() = user_id::uuid
  );

-- Policy 5: Allow public read for published content (optional)
-- This allows sharing without authentication
CREATE POLICY "allow_public_read_published" ON public.custom_content_generations
  FOR SELECT 
  TO public
  USING (
    status = 'published' AND is_published = true
  );

-- ============================================================================
-- 3. CREATE SERVICE ROLE POLICY FOR AI GENERATION
-- ============================================================================

-- Policy 6: Allow service role to insert content for any user
-- This is needed for AI tools that run with service role permissions
CREATE POLICY "allow_service_role_insert" ON public.custom_content_generations
  FOR INSERT 
  TO service_role
  WITH CHECK (true); -- Service role can insert for any user

-- Policy 7: Allow service role to read any content (for AI processing)
CREATE POLICY "allow_service_role_read" ON public.custom_content_generations
  FOR SELECT 
  TO service_role
  USING (true);

-- Policy 8: Allow service role to update any content (for AI processing)
CREATE POLICY "allow_service_role_update" ON public.custom_content_generations
  FOR UPDATE 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. VERIFY NO CIRCULAR REFERENCES
-- ============================================================================

-- These policies are safe because:
-- 1. They only reference auth.uid() and direct column values
-- 2. They don't query other tables that might reference this table back
-- 3. They use simple equality checks, not complex subqueries
-- 4. Service role policies bypass RLS complexity entirely

-- ============================================================================
-- 5. GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Ensure authenticated users can perform operations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_content_generations TO authenticated;

-- Ensure service role has full access
GRANT ALL ON public.custom_content_generations TO service_role;

-- Grant usage on the sequence if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'custom_content_generations_id_seq') THEN
    GRANT USAGE, SELECT ON SEQUENCE public.custom_content_generations_id_seq TO authenticated;
    GRANT USAGE, SELECT ON SEQUENCE public.custom_content_generations_id_seq TO service_role;
  END IF;
END $$;

COMMIT; 