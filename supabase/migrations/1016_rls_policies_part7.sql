-- Comprehensive RLS Policies for CivicSense - Part 7: Source Management and Integrations
-- Addresses security warnings while maintaining proper guest access
-- Created: 2024

BEGIN;

-- =============================================================================
-- SOURCE MANAGEMENT (Admin-managed, public read)
-- =============================================================================

-- Question Source Links - Admin managed, public read
ALTER TABLE question_source_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Question source links are publicly readable"
ON question_source_links FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert question source links"
ON question_source_links FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update question source links"
ON question_source_links FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete question source links"
ON question_source_links FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Source Fetch Queue - Admin only
ALTER TABLE source_fetch_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage source fetch queue"
ON source_fetch_queue FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Source Metadata - Admin managed, public read for active sources
ALTER TABLE source_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active source metadata is publicly readable"
ON source_metadata FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can insert source metadata"
ON source_metadata FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update source metadata"
ON source_metadata FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete source metadata"
ON source_metadata FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- INTEGRATION TABLES (User-specific or admin-managed)
-- =============================================================================

-- Clever User Mapping - Users can view their own mapping, admins can manage all
ALTER TABLE clever_user_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clever mapping"
ON clever_user_mapping FOR SELECT
USING (auth.uid()::text = civicsense_user_id);

CREATE POLICY "Admins can manage all clever mappings"
ON clever_user_mapping FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

-- Log completion of RLS policy setup
DO $$
BEGIN
  RAISE NOTICE 'RLS policies successfully applied to all tables. Security implementation complete.';
END
$$;

COMMIT; 