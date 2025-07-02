-- Fix RLS policies for analytics tables to allow inserts
-- Migration: 041_fix_rls_policies_for_analytics.sql

BEGIN;

-- 1. Fix RLS policies for user_quiz_analytics to allow inserts
DROP POLICY IF EXISTS "Users can view own quiz analytics" ON user_quiz_analytics;

CREATE POLICY "Users can manage own quiz analytics" ON user_quiz_analytics
    FOR ALL USING (auth.uid() = user_id);

-- 2. Fix RLS policies for user_progress_history to allow inserts  
DROP POLICY IF EXISTS "Users can view own progress history" ON user_progress_history;

CREATE POLICY "Users can manage own progress history" ON user_progress_history
    FOR ALL USING (auth.uid() = user_id);

-- 3. Fix RLS policies for user_learning_insights to allow inserts
DROP POLICY IF EXISTS "Users can view own learning insights" ON user_learning_insights;

CREATE POLICY "Users can manage own learning insights" ON user_learning_insights
    FOR ALL USING (auth.uid() = user_id);

-- 4. Fix RLS policies for user_feature_usage to allow inserts
DROP POLICY IF EXISTS "Users can view own feature usage" ON user_feature_usage;

CREATE POLICY "Users can manage own feature usage" ON user_feature_usage
    FOR ALL USING (auth.uid() = user_id);

-- 5. Add service role bypass policies for backend operations
CREATE POLICY "Service role can manage all quiz analytics" ON user_quiz_analytics
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage all progress history" ON user_progress_history
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage all learning insights" ON user_learning_insights
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage all feature usage" ON user_feature_usage
    FOR ALL TO service_role USING (true);

-- 6. Ensure tables allow authenticated users to insert their own data
-- (This is handled by the "Users can manage own..." policies above)

COMMIT; 