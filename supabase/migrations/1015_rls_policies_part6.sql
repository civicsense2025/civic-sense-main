-- Comprehensive RLS Policies for CivicSense - Part 6: Feedback, Analytics, and Admin Tables
-- Addresses security warnings while maintaining proper guest access
-- Created: 2024

BEGIN;

-- =============================================================================
-- FEEDBACK AND ANALYTICS (Mixed permissions)
-- =============================================================================

-- Question Feedback - Users can submit feedback, admins can view all
ALTER TABLE question_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit question feedback"
ON question_feedback FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own feedback"
ON question_feedback FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all feedback"
ON question_feedback FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Assessment Analytics - Users can create analytics, admins can view all
ALTER TABLE assessment_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own assessment analytics"
ON assessment_analytics FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own assessment analytics"
ON assessment_analytics FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all assessment analytics"
ON assessment_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- ADMIN-ONLY TABLES
-- =============================================================================

-- User Roles - Admin only
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage user roles"
ON user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- Questions Test - Admin only
ALTER TABLE questions_test ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage test questions"
ON questions_test FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Fact Check Logs - Admin only
ALTER TABLE fact_check_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage fact check logs"
ON fact_check_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- System Alerts - Admin only
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage system alerts"
ON system_alerts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Question Analytics - Admin only (aggregate data)
ALTER TABLE question_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view question analytics"
ON question_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

COMMIT; 