-- Comprehensive constraint fixes for custom content system
-- This migration addresses:
-- 1. RLS policy violations
-- 2. Check constraint violations  
-- 3. Missing constraints and indexes

BEGIN;

-- ============================================================================
-- 1. FIX CUSTOM_CONTENT_GENERATIONS TABLE
-- ============================================================================

-- Ensure table exists with correct structure
CREATE TABLE IF NOT EXISTS public.custom_content_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    description TEXT,
    content JSONB,
    questions JSONB,
    generation_settings JSONB DEFAULT '{}',
    status TEXT DEFAULT 'generating',
    is_preview BOOLEAN DEFAULT false,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop and recreate status constraint with all valid values
ALTER TABLE public.custom_content_generations 
DROP CONSTRAINT IF EXISTS custom_content_generations_status_check;

ALTER TABLE public.custom_content_generations 
ADD CONSTRAINT custom_content_generations_status_check 
CHECK (status IN (
    'generating',   -- AI generation in progress
    'draft',        -- Generated but not published (includes preview content)
    'generated',    -- AI generation completed
    'completed',    -- Generation process finished
    'published',    -- Made available to play
    'archived',     -- Hidden but preserved
    'deleted'       -- Soft deleted
));

-- Enable RLS
ALTER TABLE public.custom_content_generations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "content_generation_insert_own" ON public.custom_content_generations;
DROP POLICY IF EXISTS "content_generation_select_own" ON public.custom_content_generations;
DROP POLICY IF EXISTS "content_generation_update_own" ON public.custom_content_generations;
DROP POLICY IF EXISTS "content_generation_delete_own" ON public.custom_content_generations;
DROP POLICY IF EXISTS "content_generation_public_published" ON public.custom_content_generations;

-- Create simple, non-circular RLS policies
CREATE POLICY "content_generations_insert_own" 
ON public.custom_content_generations 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "content_generations_select_own" 
ON public.custom_content_generations 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "content_generations_update_own" 
ON public.custom_content_generations 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "content_generations_delete_own" 
ON public.custom_content_generations 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Public read policy for published content
CREATE POLICY "content_generations_public_read" 
ON public.custom_content_generations 
FOR SELECT 
TO public 
USING (status = 'published');

-- ============================================================================
-- 2. FIX CUSTOM_CONTENT_COLLECTIONS TABLE
-- ============================================================================

-- Fix collections table constraints
ALTER TABLE public.custom_content_collections 
DROP CONSTRAINT IF EXISTS custom_content_collections_status_check;

ALTER TABLE public.custom_content_collections 
ADD CONSTRAINT custom_content_collections_status_check 
CHECK (status IN (
    'draft',        -- Work in progress
    'generating',   -- AI generation in progress
    'generated',    -- AI generation completed
    'completed',    -- Ready for review
    'published',    -- Available to public
    'archived',     -- Hidden but preserved
    'deleted'       -- Soft deleted
));

ALTER TABLE public.custom_content_collections 
DROP CONSTRAINT IF EXISTS custom_content_collections_visibility_check;

ALTER TABLE public.custom_content_collections 
ADD CONSTRAINT custom_content_collections_visibility_check 
CHECK (visibility IN ('private', 'public', 'unlisted'));

ALTER TABLE public.custom_content_collections 
DROP CONSTRAINT IF EXISTS custom_content_collections_creation_method_check;

ALTER TABLE public.custom_content_collections 
ADD CONSTRAINT custom_content_collections_creation_method_check 
CHECK (creation_method IN ('manual', 'ai_generated', 'imported', 'template'));

-- ============================================================================
-- 3. FIX COLLECTION_COLLABORATORS TABLE
-- ============================================================================

-- Fix collaborators table constraints
ALTER TABLE public.collection_collaborators 
DROP CONSTRAINT IF EXISTS collection_collaborators_role_check;

ALTER TABLE public.collection_collaborators 
ADD CONSTRAINT collection_collaborators_role_check 
CHECK (role IN ('viewer', 'contributor', 'editor', 'admin'));

ALTER TABLE public.collection_collaborators 
DROP CONSTRAINT IF EXISTS collection_collaborators_status_check;

ALTER TABLE public.collection_collaborators 
ADD CONSTRAINT collection_collaborators_status_check 
CHECK (status IN ('pending', 'accepted', 'declined', 'revoked'));

-- ============================================================================
-- 4. FIX COLLECTION_SHARES TABLE
-- ============================================================================

-- Fix shares table constraints
ALTER TABLE public.collection_shares 
DROP CONSTRAINT IF EXISTS collection_shares_share_type_check;

ALTER TABLE public.collection_shares 
ADD CONSTRAINT collection_shares_share_type_check 
CHECK (share_type IN ('link', 'email', 'social', 'embed'));

-- ============================================================================
-- 5. GRANT PROPER PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT ALL ON public.custom_content_generations TO authenticated;
GRANT ALL ON public.custom_content_collections TO authenticated;
GRANT ALL ON public.custom_collection_items TO authenticated;
GRANT ALL ON public.collection_collaborators TO authenticated;
GRANT ALL ON public.collection_shares TO authenticated;
GRANT ALL ON public.collection_engagement TO authenticated;
GRANT ALL ON public.collection_play_sessions TO authenticated;
GRANT ALL ON public.collection_analytics_events TO authenticated;

-- Grant select to anonymous for public content
GRANT SELECT ON public.custom_content_generations TO anon;
GRANT SELECT ON public.custom_content_collections TO anon;

-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_content_generations_user_status 
ON public.custom_content_generations(user_id, status);

CREATE INDEX IF NOT EXISTS idx_content_generations_created_at 
ON public.custom_content_generations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collections_owner_status 
ON public.custom_content_collections(owner_id, status);

CREATE INDEX IF NOT EXISTS idx_collections_visibility_status 
ON public.custom_content_collections(visibility, status) 
WHERE status = 'published';

-- ============================================================================
-- 7. UPDATE INVALID DATA
-- ============================================================================

-- Update any existing invalid status values
UPDATE public.custom_content_generations 
SET status = 'draft' 
WHERE status NOT IN ('generating', 'draft', 'generated', 'completed', 'published', 'archived', 'deleted');

UPDATE public.custom_content_collections 
SET status = 'draft' 
WHERE status NOT IN ('draft', 'generating', 'generated', 'completed', 'published', 'archived', 'deleted');

-- ============================================================================
-- 8. VERIFICATION AND LOGGING
-- ============================================================================

DO $$ 
BEGIN 
    RAISE NOTICE 'Comprehensive constraint fixes applied successfully:';
    RAISE NOTICE '  ✅ Fixed custom_content_generations status constraint';
    RAISE NOTICE '  ✅ Fixed custom_content_collections constraints';
    RAISE NOTICE '  ✅ Fixed collection_collaborators constraints';
    RAISE NOTICE '  ✅ Fixed collection_shares constraints';
    RAISE NOTICE '  ✅ Updated RLS policies to prevent circular references';
    RAISE NOTICE '  ✅ Updated invalid data to use valid constraint values';
    RAISE NOTICE '  ✅ Created performance indexes';
    RAISE NOTICE '  ✅ Granted proper permissions';
END $$;

COMMIT; 