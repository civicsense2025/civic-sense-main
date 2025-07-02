-- =============================================================================
-- CLEANUP PARTIAL MEDIA BIAS MIGRATION
-- =============================================================================
-- This migration cleans up any partial application of the media bias engine
-- migration before re-running the corrected version
-- =============================================================================

BEGIN;

-- Drop all media bias tables if they exist (CASCADE will handle dependencies)
DROP TABLE IF EXISTS source_credibility_indicators CASCADE;
DROP TABLE IF EXISTS bias_detection_patterns CASCADE;
DROP TABLE IF EXISTS bias_learning_events CASCADE;
DROP TABLE IF EXISTS bias_feedback CASCADE;
DROP TABLE IF EXISTS article_bias_analysis CASCADE;
DROP TABLE IF EXISTS organization_bias_scores CASCADE;
DROP TABLE IF EXISTS bias_dimensions CASCADE;
DROP TABLE IF EXISTS media_organizations CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS get_or_create_media_organization CASCADE;
DROP FUNCTION IF EXISTS calculate_bias_consensus CASCADE;
DROP FUNCTION IF EXISTS update_organization_bias_from_articles CASCADE;

-- Drop any policies that might exist
DO $$ 
BEGIN
  -- Drop media organization policies
  DROP POLICY IF EXISTS "Public read access to media organizations" ON media_organizations;
  DROP POLICY IF EXISTS "Admins can manage media organizations" ON media_organizations;
  DROP POLICY IF EXISTS "Authenticated users can manage media organizations" ON media_organizations;
  DROP POLICY IF EXISTS "Users can view media organizations" ON media_organizations;
  DROP POLICY IF EXISTS "Authenticated users can suggest media organizations" ON media_organizations;
  
  -- Drop other table policies
  DROP POLICY IF EXISTS "Public read access to bias dimensions" ON bias_dimensions;
  DROP POLICY IF EXISTS "Public read access to organization bias scores" ON organization_bias_scores;
  DROP POLICY IF EXISTS "Public read access to article analysis" ON article_bias_analysis;
  DROP POLICY IF EXISTS "Public read access to verified feedback" ON bias_feedback;
  DROP POLICY IF EXISTS "Public read access to learning events" ON bias_learning_events;
  DROP POLICY IF EXISTS "Users can create feedback" ON bias_feedback;
  DROP POLICY IF EXISTS "Users can update own feedback" ON bias_feedback;
EXCEPTION
  WHEN undefined_table THEN
    -- Tables don't exist, that's fine
    NULL;
END $$;

COMMIT; 