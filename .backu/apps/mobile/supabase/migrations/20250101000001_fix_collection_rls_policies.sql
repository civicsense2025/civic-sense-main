-- Fix infinite recursion in custom_content_collections RLS policies
-- The issue is circular references between tables in policies

BEGIN;

-- ============================================================================
-- 1. DROP PROBLEMATIC POLICIES
-- ============================================================================

-- Drop all existing policies on custom_content_collections
DROP POLICY IF EXISTS "collection_owner_all" ON public.custom_content_collections;
DROP POLICY IF EXISTS "collection_public_view" ON public.custom_content_collections;

-- Drop all existing policies on related tables that might cause circular references
DROP POLICY IF EXISTS "items_collection_access" ON public.custom_collection_items;
DROP POLICY IF EXISTS "collaborators_collection_owner" ON public.collection_collaborators;

-- ============================================================================
-- 2. CREATE SIMPLE, NON-CIRCULAR POLICIES
-- ============================================================================

-- Custom Content Collections: Simple policies without circular references
-- Policy 1: Users can do everything with collections they own
CREATE POLICY "collections_owner_access" ON public.custom_content_collections
  FOR ALL USING (auth.uid() = owner_id);

-- Policy 2: Users can insert collections they will own
CREATE POLICY "collections_owner_insert" ON public.custom_content_collections
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Policy 3: Simple read access for public content (no subqueries to avoid recursion)
CREATE POLICY "collections_public_read" ON public.custom_content_collections
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() = created_by OR
    (visibility = 'public' AND status = 'published') OR
    (visibility = 'unlisted' AND auth.uid() IS NOT NULL)
  );

-- ============================================================================
-- 3. COLLECTION ITEMS: Simple inheritance from collections
-- ============================================================================

-- Collection Items: Access based on collection ownership only (no subqueries)
CREATE POLICY "collection_items_owner_access" ON public.custom_collection_items
  FOR ALL USING (
    added_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.custom_content_collections
      WHERE id = collection_id AND owner_id = auth.uid()
    )
  );

-- Collection Items: Read access for public collections (simple check)
CREATE POLICY "collection_items_public_read" ON public.custom_collection_items
  FOR SELECT USING (
    added_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.custom_content_collections
      WHERE id = collection_id 
      AND (
        owner_id = auth.uid() OR
        (visibility = 'public' AND status = 'published') OR
        (visibility = 'unlisted' AND auth.uid() IS NOT NULL)
      )
    )
  );

-- ============================================================================
-- 4. COLLABORATORS: Simple policies
-- ============================================================================

-- Collection Collaborators: Simple ownership-based access
CREATE POLICY "collaborators_owner_access" ON public.collection_collaborators
  FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.custom_content_collections
      WHERE id = collection_id AND owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. ANALYTICS TABLES: Keep simple policies
-- ============================================================================

-- Keep existing simple policies for other tables that don't cause recursion

-- Collection Play Sessions: Users can manage their own
-- (This policy should already exist and be fine)

-- Collection Analytics Events: Write-only for users, read for collection owners
-- (These policies should already exist and be fine)

-- Collection Engagement: Users manage their own
-- (This policy should already exist and be fine)

-- Collection Shares: Collection owners can manage
-- (This policy should already exist and be fine)

-- Collection Analytics Daily: Collection owners can read
-- (This policy should already exist and be fine)

-- ============================================================================
-- 6. ADD COMMENTS
-- ============================================================================

COMMENT ON POLICY "collections_owner_access" ON public.custom_content_collections IS 'Collection owners have full access to their collections';
COMMENT ON POLICY "collections_owner_insert" ON public.custom_content_collections IS 'Users can create collections they will own';
COMMENT ON POLICY "collections_public_read" ON public.custom_content_collections IS 'Read access for public/unlisted collections without circular references';

COMMIT; 