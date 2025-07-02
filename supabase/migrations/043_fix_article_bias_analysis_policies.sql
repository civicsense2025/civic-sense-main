-- =============================================================================
-- FIX ARTICLE BIAS ANALYSIS RLS POLICIES
-- =============================================================================
-- The article_bias_analysis table needs INSERT policies to allow the news ticker
-- to save bias analysis results
-- =============================================================================

BEGIN;

-- Add INSERT policy for all users (temporary - should be restricted later)
-- This allows the news ticker to analyze articles without authentication issues
CREATE POLICY "Allow article analysis creation" ON article_bias_analysis
  FOR INSERT WITH CHECK (true);

-- Set analyzer_id to auth.uid() if authenticated
CREATE OR REPLACE FUNCTION set_article_analysis_analyzer()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.analyzer_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set analyzer_id
CREATE TRIGGER set_article_analysis_analyzer_trigger
  BEFORE INSERT ON article_bias_analysis
  FOR EACH ROW
  EXECUTE FUNCTION set_article_analysis_analyzer();

-- Also ensure bias_feedback can be inserted by anonymous users properly
DROP POLICY IF EXISTS "Users can create feedback" ON bias_feedback;
CREATE POLICY "Users can create feedback" ON bias_feedback
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) 
    OR 
    (auth.uid() IS NULL AND guest_token IS NOT NULL)
  );

-- Grant necessary permissions to anon role for article analysis
GRANT INSERT ON article_bias_analysis TO anon;
GRANT INSERT ON article_bias_analysis TO authenticated;

-- Allow updating of article_bias_analysis by the same user who created it
CREATE POLICY "Users can update their own article analysis" ON article_bias_analysis
  FOR UPDATE USING (
    analyzer_id = auth.uid()
  );

COMMIT; 