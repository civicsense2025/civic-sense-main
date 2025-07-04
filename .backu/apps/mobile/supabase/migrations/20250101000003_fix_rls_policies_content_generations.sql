-- Fix RLS policies for custom_content_generations table
-- This ensures users can insert their own content properly

BEGIN;

-- ============================================================================
-- 1. CHECK AND CREATE TABLE IF NOT EXISTS
-- ============================================================================

-- Ensure the table exists with proper structure
CREATE TABLE IF NOT EXISTS public.custom_content_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    description TEXT,
    content JSONB,
    questions JSONB,
    generation_settings JSONB DEFAULT '{}',
    status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'draft', 'generated', 'completed', 'published', 'archived', 'deleted')),
    is_preview BOOLEAN DEFAULT false,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. ENABLE RLS
-- ============================================================================

ALTER TABLE public.custom_content_generations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. DROP EXISTING POLICIES (clean slate)
-- ============================================================================

DROP POLICY IF EXISTS "content_generation_owner_all" ON public.custom_content_generations;
DROP POLICY IF EXISTS "content_generation_public_read" ON public.custom_content_generations;
DROP POLICY IF EXISTS "content_generation_insert_own" ON public.custom_content_generations;
DROP POLICY IF EXISTS "content_generation_update_own" ON public.custom_content_generations;
DROP POLICY IF EXISTS "content_generation_delete_own" ON public.custom_content_generations;

-- ============================================================================
-- 4. CREATE COMPREHENSIVE RLS POLICIES
-- ============================================================================

-- Policy 1: Users can INSERT their own content
CREATE POLICY "content_generation_insert_own" 
ON public.custom_content_generations 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Users can SELECT their own content
CREATE POLICY "content_generation_select_own" 
ON public.custom_content_generations 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy 3: Users can UPDATE their own content
CREATE POLICY "content_generation_update_own" 
ON public.custom_content_generations 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can DELETE their own content
CREATE POLICY "content_generation_delete_own" 
ON public.custom_content_generations 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy 5: Public read for published content (for sharing)
CREATE POLICY "content_generation_public_published" 
ON public.custom_content_generations 
FOR SELECT 
TO public 
USING (status = 'published' AND is_preview = false);

-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_content_generations_user_id 
ON public.custom_content_generations(user_id);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_content_generations_status 
ON public.custom_content_generations(status);

-- Index for published content discovery
CREATE INDEX IF NOT EXISTS idx_content_generations_published 
ON public.custom_content_generations(status, is_preview, created_at) 
WHERE status = 'published' AND is_preview = false;

-- ============================================================================
-- 6. CREATE UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_content_generations_updated_at ON public.custom_content_generations;
CREATE TRIGGER update_content_generations_updated_at
    BEFORE UPDATE ON public.custom_content_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on the table to authenticated users
GRANT ALL ON public.custom_content_generations TO authenticated;
GRANT SELECT ON public.custom_content_generations TO anon;

-- ============================================================================
-- 8. VERIFY POLICIES (for debugging)
-- ============================================================================

-- This will help debug RLS issues
DO $$ 
BEGIN 
    RAISE NOTICE 'RLS Policies for custom_content_generations updated successfully';
    RAISE NOTICE 'Policies created:';
    RAISE NOTICE '  - content_generation_insert_own: Users can insert their own content';
    RAISE NOTICE '  - content_generation_select_own: Users can select their own content';
    RAISE NOTICE '  - content_generation_update_own: Users can update their own content';
    RAISE NOTICE '  - content_generation_delete_own: Users can delete their own content';
    RAISE NOTICE '  - content_generation_public_published: Public can read published content';
END $$;

COMMIT; 