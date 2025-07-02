-- RLS Policy Optimization Migration
-- Fixes auth.uid() re-evaluation performance issues
-- Generated: 2024-12-19

BEGIN;

-- ==============================================================================
-- OPTIMIZE RLS POLICIES - Replace auth.uid() with (select auth.uid())
-- ==============================================================================
-- This prevents re-evaluation of auth.uid() for each row, significantly improving performance

-- User Email Preferences (table exists with correct user_id column)
DROP POLICY IF EXISTS "Users can view their own email preferences" ON public.user_email_preferences;
CREATE POLICY "Users can view their own email preferences" 
ON public.user_email_preferences FOR SELECT 
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own email preferences" ON public.user_email_preferences;
CREATE POLICY "Users can insert their own email preferences" 
ON public.user_email_preferences FOR INSERT 
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own email preferences" ON public.user_email_preferences;
CREATE POLICY "Users can update their own email preferences" 
ON public.user_email_preferences FOR UPDATE 
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own email preferences" ON public.user_email_preferences;
CREATE POLICY "Users can delete their own email preferences" 
ON public.user_email_preferences FOR DELETE 
USING (user_id = (select auth.uid()));

-- User Subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription" 
ON public.user_subscriptions FOR SELECT 
USING (user_id = (select auth.uid()));

-- Parental Controls
DROP POLICY IF EXISTS "Users can view their parental controls" ON public.parental_controls;
CREATE POLICY "Users can view their parental controls" 
ON public.parental_controls FOR SELECT 
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Parents can manage their children's controls" ON public.parental_controls;
CREATE POLICY "Parents can manage their children's controls" 
ON public.parental_controls FOR ALL 
USING (parent_user_id = (select auth.uid()));

-- User Boost Inventory
DROP POLICY IF EXISTS "Users can view their own boost inventory" ON public.user_boost_inventory;
CREATE POLICY "Users can view their own boost inventory" 
ON public.user_boost_inventory FOR SELECT 
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own boost inventory" ON public.user_boost_inventory;
CREATE POLICY "Users can insert their own boost inventory" 
ON public.user_boost_inventory FOR INSERT 
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own boost inventory" ON public.user_boost_inventory;
CREATE POLICY "Users can update their own boost inventory" 
ON public.user_boost_inventory FOR UPDATE 
USING (user_id = (select auth.uid()));

-- User Active Boosts
DROP POLICY IF EXISTS "Users can view their own active boosts" ON public.user_active_boosts;
CREATE POLICY "Users can view their own active boosts" 
ON public.user_active_boosts FOR SELECT 
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own active boosts" ON public.user_active_boosts;
CREATE POLICY "Users can insert their own active boosts" 
ON public.user_active_boosts FOR INSERT 
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own active boosts" ON public.user_active_boosts;
CREATE POLICY "Users can update their own active boosts" 
ON public.user_active_boosts FOR UPDATE 
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own active boosts" ON public.user_active_boosts;
CREATE POLICY "Users can delete their own active boosts" 
ON public.user_active_boosts FOR DELETE 
USING (user_id = (select auth.uid()));

-- User Onboarding State
DROP POLICY IF EXISTS "Users can manage their own onboarding state" ON public.user_onboarding_state;
CREATE POLICY "Users can manage their own onboarding state" 
ON public.user_onboarding_state FOR ALL 
USING (user_id = (select auth.uid()));

-- User Category Preferences
DROP POLICY IF EXISTS "Users can manage their own category preferences" ON public.user_category_preferences;
CREATE POLICY "Users can manage their own category preferences" 
ON public.user_category_preferences FOR ALL 
USING (user_id = (select auth.uid()));

-- User Skill Preferences
DROP POLICY IF EXISTS "Users can manage their own skill preferences" ON public.user_skill_preferences;
CREATE POLICY "Users can manage their own skill preferences" 
ON public.user_skill_preferences FOR ALL 
USING (user_id = (select auth.uid()));

-- User Platform Preferences
DROP POLICY IF EXISTS "Users can manage their own platform preferences" ON public.user_platform_preferences;
CREATE POLICY "Users can manage their own platform preferences" 
ON public.user_platform_preferences FOR ALL 
USING (user_id = (select auth.uid()));

-- User Feedback
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.user_feedback;
CREATE POLICY "Users can insert their own feedback" 
ON public.user_feedback FOR INSERT 
WITH CHECK (user_id = (select auth.uid()));

-- User Skill Progress
DROP POLICY IF EXISTS "Users can view their own skill progress" ON public.user_skill_progress;
CREATE POLICY "Users can view their own skill progress" 
ON public.user_skill_progress FOR SELECT 
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own skill progress" ON public.user_skill_progress;
CREATE POLICY "Users can update their own skill progress" 
ON public.user_skill_progress FOR UPDATE 
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own skill progress" ON public.user_skill_progress;
CREATE POLICY "Users can insert their own skill progress" 
ON public.user_skill_progress FOR INSERT 
WITH CHECK (user_id = (select auth.uid()));

-- Spaced Repetition Schedule
DROP POLICY IF EXISTS "Users can view their own spaced repetition schedules" ON public.spaced_repetition_schedule;
CREATE POLICY "Users can view their own spaced repetition schedules" 
ON public.spaced_repetition_schedule FOR SELECT 
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own spaced repetition schedules" ON public.spaced_repetition_schedule;
CREATE POLICY "Users can update their own spaced repetition schedules" 
ON public.spaced_repetition_schedule FOR UPDATE 
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own spaced repetition schedules" ON public.spaced_repetition_schedule;
CREATE POLICY "Users can insert their own spaced repetition schedules" 
ON public.spaced_repetition_schedule FOR INSERT 
WITH CHECK (user_id = (select auth.uid()));

-- Progress Sessions
DROP POLICY IF EXISTS "Users can view their own progress sessions" ON public.progress_sessions;
CREATE POLICY "Users can view their own progress sessions" 
ON public.progress_sessions FOR SELECT 
USING (user_id = (select auth.uid()) OR guest_token IS NOT NULL);

-- Progress Question Responses
DROP POLICY IF EXISTS "Users can view their own progress responses" ON public.progress_question_responses;
CREATE POLICY "Users can view their own progress responses" 
ON public.progress_question_responses FOR SELECT 
USING (session_id IN (
  SELECT session_id FROM public.progress_sessions 
  WHERE user_id = (select auth.uid()) OR guest_token IS NOT NULL
));

-- Survey Responses
DROP POLICY IF EXISTS "Users can view and update their own responses" ON public.survey_responses;
CREATE POLICY "Users can view and update their own responses" 
ON public.survey_responses FOR ALL 
USING (user_id = (select auth.uid()) OR guest_token IS NOT NULL);

-- Multiplayer Rooms
DROP POLICY IF EXISTS "rooms_insert_simple" ON public.multiplayer_rooms;
CREATE POLICY "rooms_insert_simple" 
ON public.multiplayer_rooms FOR INSERT 
WITH CHECK (host_user_id = (select auth.uid()) OR host_guest_token IS NOT NULL);

DROP POLICY IF EXISTS "rooms_update_simple" ON public.multiplayer_rooms;
CREATE POLICY "rooms_update_simple" 
ON public.multiplayer_rooms FOR UPDATE 
USING (host_user_id = (select auth.uid()) OR host_guest_token IS NOT NULL);

COMMIT;

-- Add comments explaining the optimization
COMMENT ON POLICY "Users can view their own email preferences" ON public.user_email_preferences 
IS 'Optimized RLS policy using (select auth.uid()) to prevent re-evaluation per row';

COMMENT ON POLICY "Users can view own subscription" ON public.user_subscriptions 
IS 'Optimized RLS policy using (select auth.uid()) to prevent re-evaluation per row';

COMMENT ON POLICY "Users can view their own skill progress" ON public.user_skill_progress 
IS 'Optimized RLS policy using (select auth.uid()) to prevent re-evaluation per row'; 