-- Fix status constraint for custom_content_collections to include all values used in code
-- Current constraint only allows: 'draft', 'published', 'archived', 'deleted'
-- But code uses: 'draft', 'generating', 'generated', 'completed', 'published', 'archived', 'deleted'

BEGIN;

-- Drop the existing constraint
ALTER TABLE public.custom_content_collections 
DROP CONSTRAINT IF EXISTS custom_content_collections_status_check;

-- Add the new constraint with all the status values we actually use
ALTER TABLE public.custom_content_collections 
ADD CONSTRAINT custom_content_collections_status_check 
CHECK (status IN (
  'draft',        -- Initial state, default
  'generating',   -- AI content generation in progress
  'generated',    -- AI generation completed, ready for review/publish
  'completed',    -- Same as generated (used interchangeably in code)
  'published',    -- Published and publicly available
  'archived',     -- Archived collections
  'deleted'       -- Soft deleted collections
));

-- Also check if we need to fix the custom_content_generations table
-- Based on code usage patterns
DO $$
BEGIN
  -- Check if the table exists and update its constraint too
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_content_generations') THEN
    -- Drop existing constraint if it exists
    ALTER TABLE public.custom_content_generations 
    DROP CONSTRAINT IF EXISTS custom_content_generations_status_check;
    
    -- Add new constraint for generations table
    ALTER TABLE public.custom_content_generations 
    ADD CONSTRAINT custom_content_generations_status_check 
    CHECK (status IN (
      'pending',      -- Initial state
      'generating',   -- In progress
      'completed',    -- Successfully generated
      'published',    -- Published to public
      'failed',       -- Generation failed
      'preview'       -- Preview mode for non-premium users
    ));
  END IF;
END $$;

-- Comment on the changes
COMMENT ON CONSTRAINT custom_content_collections_status_check ON public.custom_content_collections IS 
'Updated to include all status values used in application code: draft, generating, generated, completed, published, archived, deleted';

COMMIT; 