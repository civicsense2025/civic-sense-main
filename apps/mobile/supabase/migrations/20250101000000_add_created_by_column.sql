-- Migration: Add created_by column for author attribution
-- This allows us to track quiz authors for public content and fetch their profiles

BEGIN;

-- Add created_by column to custom_content_collections table
-- This will reference the user who originally created the content (distinct from owner_id for shared content)
ALTER TABLE custom_content_collections 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Set created_by to match owner_id for existing records where it's not set
UPDATE custom_content_collections 
SET created_by = owner_id 
WHERE created_by IS NULL;

-- Add index for efficient querying by creator
CREATE INDEX IF NOT EXISTS idx_custom_content_collections_created_by 
ON custom_content_collections(created_by);

-- Add index for public content discovery by author
CREATE INDEX IF NOT EXISTS idx_custom_content_collections_public_by_author 
ON custom_content_collections(created_by, visibility, status) 
WHERE visibility = 'public' AND status = 'published';

-- Update RLS policies to include created_by in access control
-- Users can always view their own created content
DROP POLICY IF EXISTS "Users can view their own collections" ON custom_content_collections;
CREATE POLICY "Users can view their own collections" ON custom_content_collections
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() = created_by OR
    visibility = 'public' OR 
    (visibility = 'unlisted' AND auth.uid() IS NOT NULL)
  );

-- Users can edit content they own or created (if they still have edit permissions)
DROP POLICY IF EXISTS "Users can edit their own collections" ON custom_content_collections;
CREATE POLICY "Users can edit their own collections" ON custom_content_collections
  FOR UPDATE USING (
    auth.uid() = owner_id OR 
    (auth.uid() = created_by AND owner_id = created_by)
  );

-- Comment on the new column
COMMENT ON COLUMN custom_content_collections.created_by IS 'Original creator of the content - used for author attribution in public quizzes';

-- Create a view for discovering public content with author information
CREATE OR REPLACE VIEW public_collections_with_authors AS
SELECT 
  cc.*,
  p.display_name as author_display_name,
  p.username as author_username,
  p.avatar_url as author_avatar_url,
  p.bio as author_bio,
  -- Calculate engagement metrics
  COALESCE(avg_rating.rating, 0) as avg_rating,
  COALESCE(rating_count.count, 0) as rating_count,
  COALESCE(play_count.count, 0) as play_count
FROM custom_content_collections cc
LEFT JOIN profiles p ON p.id = cc.created_by
LEFT JOIN (
  SELECT 
    collection_id, 
    AVG(rating::numeric) as rating 
  FROM collection_engagement 
  WHERE rating IS NOT NULL 
  GROUP BY collection_id
) avg_rating ON avg_rating.collection_id = cc.id
LEFT JOIN (
  SELECT 
    collection_id, 
    COUNT(*) as count 
  FROM collection_engagement 
  WHERE rating IS NOT NULL 
  GROUP BY collection_id
) rating_count ON rating_count.collection_id = cc.id
LEFT JOIN (
  SELECT 
    collection_id, 
    COUNT(*) as count 
  FROM collection_play_sessions 
  GROUP BY collection_id
) play_count ON play_count.collection_id = cc.id
WHERE cc.visibility = 'public' 
  AND cc.status = 'published'
ORDER BY cc.published_at DESC;

-- Grant select access to the view for authenticated users
GRANT SELECT ON public_collections_with_authors TO authenticated;

-- Update the custom_content_generations table to also track created_by
ALTER TABLE custom_content_generations 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Set created_by to match user_id for existing records
UPDATE custom_content_generations 
SET created_by = user_id 
WHERE created_by IS NULL;

-- Add index for generation history by creator
CREATE INDEX IF NOT EXISTS idx_custom_content_generations_created_by 
ON custom_content_generations(created_by, created_at DESC);

COMMENT ON COLUMN custom_content_generations.created_by IS 'Original creator of the generated content - tracks authorship across transfers';

COMMIT; 