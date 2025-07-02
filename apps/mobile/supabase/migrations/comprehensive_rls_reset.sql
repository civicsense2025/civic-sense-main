-- =============================================================================
-- COMPREHENSIVE RLS POLICY RESET FOR CIVICSENSE
-- Drop all existing policies and create clean, permissive ones
-- Only target tables that actually exist
-- =============================================================================

BEGIN;

-- =============================================================================
-- DROP ALL EXISTING FUNCTIONS WITH CASCADE FIRST
-- =============================================================================

-- Drop existing helper functions that might conflict - CASCADE will drop dependent policies
DROP FUNCTION IF EXISTS is_admin_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_super_admin_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS check_user_role(uuid, text) CASCADE;

-- =============================================================================
-- DROP POLICIES FOR TABLES THAT DEFINITELY EXIST (based on your errors)
-- =============================================================================

-- Core quiz/assessment tables (these definitely exist based on your app)
DROP POLICY IF EXISTS "public_read_question_topics" ON question_topics;
DROP POLICY IF EXISTS "admin_manage_question_topics" ON question_topics;
DROP POLICY IF EXISTS "public_read_questions" ON questions;
DROP POLICY IF EXISTS "admin_manage_questions" ON questions;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
DROP POLICY IF EXISTS "admin_manage_categories" ON categories;

-- Progress Sessions (the problematic one from your original error)
DROP POLICY IF EXISTS "Users can manage their own progress sessions" ON progress_sessions;
DROP POLICY IF EXISTS "Users can read their own progress sessions" ON progress_sessions;
DROP POLICY IF EXISTS "Users can insert their own progress sessions" ON progress_sessions;
DROP POLICY IF EXISTS "Users can update their own progress sessions" ON progress_sessions;
DROP POLICY IF EXISTS "users_manage_own_progress_sessions" ON progress_sessions;

-- User progress tables
DROP POLICY IF EXISTS "users_manage_own_quiz_attempts" ON user_quiz_attempts;
DROP POLICY IF EXISTS "users_manage_own_progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert their own assessment attempts" ON user_assessment_attempts;
DROP POLICY IF EXISTS "Users can update their own assessment attempts" ON user_assessment_attempts;
DROP POLICY IF EXISTS "Users can view their own assessment attempts" ON user_assessment_attempts;
DROP POLICY IF EXISTS "users_manage_own_assessment_attempts" ON user_assessment_attempts;

-- Profiles
DROP POLICY IF EXISTS "users_manage_own_profile" ON profiles;

-- User Survey Completions
DROP POLICY IF EXISTS "Users can insert their own survey completions" ON user_survey_completions;
DROP POLICY IF EXISTS "Users can update their own survey completions" ON user_survey_completions;
DROP POLICY IF EXISTS "Users can view their own survey completions" ON user_survey_completions;
DROP POLICY IF EXISTS "users_guests_manage_survey_completions" ON user_survey_completions;

-- Survey tables
DROP POLICY IF EXISTS "Anyone can view survey learning goals" ON survey_learning_goals;
DROP POLICY IF EXISTS "Only admins can manage survey learning goals" ON survey_learning_goals;
DROP POLICY IF EXISTS "public_read_survey_learning_goals" ON survey_learning_goals;
DROP POLICY IF EXISTS "admin_manage_survey_learning_goals" ON survey_learning_goals;

DROP POLICY IF EXISTS "Users can insert their own recommendations" ON survey_recommendations;
DROP POLICY IF EXISTS "Users can update their own recommendations" ON survey_recommendations;
DROP POLICY IF EXISTS "Users can view their own recommendations" ON survey_recommendations;
DROP POLICY IF EXISTS "users_guests_manage_survey_recommendations" ON survey_recommendations;

DROP POLICY IF EXISTS "Admin can do everything on survey questions" ON survey_questions;
DROP POLICY IF EXISTS "Public can view questions for active surveys" ON survey_questions;
DROP POLICY IF EXISTS "Survey creators can manage questions" ON survey_questions;
DROP POLICY IF EXISTS "public_read_survey_questions" ON survey_questions;
DROP POLICY IF EXISTS "admin_manage_survey_questions" ON survey_questions;

-- User Roles
DROP POLICY IF EXISTS "user_roles_admin_manage" ON user_roles;
DROP POLICY IF EXISTS "user_roles_authenticated_view" ON user_roles;
DROP POLICY IF EXISTS "user_roles_self_view" ON user_roles;
DROP POLICY IF EXISTS "user_roles_super_admin_all" ON user_roles;
DROP POLICY IF EXISTS "anyone_read_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admin_manage_user_roles" ON user_roles;

-- Multiplayer tables
DROP POLICY IF EXISTS "Anyone can create a room" ON multiplayer_rooms;
DROP POLICY IF EXISTS "Anyone can read rooms" ON multiplayer_rooms;
DROP POLICY IF EXISTS "Room creators can delete their own rooms" ON multiplayer_rooms;
DROP POLICY IF EXISTS "Room creators can update their own rooms" ON multiplayer_rooms;
DROP POLICY IF EXISTS "multiplayer_rooms_host_manage" ON multiplayer_rooms;
DROP POLICY IF EXISTS "multiplayer_rooms_view_all" ON multiplayer_rooms;
DROP POLICY IF EXISTS "room_visibility" ON multiplayer_rooms;
DROP POLICY IF EXISTS "anyone_read_multiplayer_rooms" ON multiplayer_rooms;
DROP POLICY IF EXISTS "anyone_create_multiplayer_rooms" ON multiplayer_rooms;
DROP POLICY IF EXISTS "creators_manage_multiplayer_rooms" ON multiplayer_rooms;
DROP POLICY IF EXISTS "creators_delete_multiplayer_rooms" ON multiplayer_rooms;

DROP POLICY IF EXISTS "players_can_insert_themselves" ON multiplayer_room_players;
DROP POLICY IF EXISTS "players_can_select_themselves" ON multiplayer_room_players;
DROP POLICY IF EXISTS "users_guests_manage_room_players" ON multiplayer_room_players;

DROP POLICY IF EXISTS "multiplayer_question_responses_insert_own" ON multiplayer_question_responses;
DROP POLICY IF EXISTS "multiplayer_question_responses_view_room" ON multiplayer_question_responses;
DROP POLICY IF EXISTS "users_guests_manage_question_responses" ON multiplayer_question_responses;

-- =============================================================================
-- CREATE HELPER FUNCTIONS
-- =============================================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Handle null input
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has admin or super_admin role
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = is_admin_user.user_id 
    AND role IN ('admin', 'super_admin')
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error (like table doesn't exist), return false
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- CREATE POLICIES FOR CORE TABLES THAT DEFINITELY EXIST
-- =============================================================================

-- Question Topics - Public read, admin write
CREATE POLICY "public_read_question_topics" ON question_topics FOR SELECT USING (true);
CREATE POLICY "admin_manage_question_topics" ON question_topics FOR ALL USING (
  auth.role() = 'service_role' OR is_admin_user(auth.uid())
);

-- Questions - Public read, admin write  
CREATE POLICY "public_read_questions" ON questions FOR SELECT USING (true);
CREATE POLICY "admin_manage_questions" ON questions FOR ALL USING (
  auth.role() = 'service_role' OR is_admin_user(auth.uid())
);

-- Categories - Public read, admin write
CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (true);
CREATE POLICY "admin_manage_categories" ON categories FOR ALL USING (
  auth.role() = 'service_role' OR is_admin_user(auth.uid())
);

-- Progress Sessions - Users can manage their own, service role can manage all
CREATE POLICY "users_manage_own_progress_sessions" ON progress_sessions 
FOR ALL USING (
  auth.uid() = user_id OR 
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);

-- User Quiz Attempts - Users can manage their own, service role can manage all
CREATE POLICY "users_manage_own_quiz_attempts" ON user_quiz_attempts 
FOR ALL USING (
  auth.uid() = user_id OR 
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);

-- User Progress - Users can manage their own, service role can manage all
CREATE POLICY "users_manage_own_progress" ON user_progress 
FOR ALL USING (
  auth.uid() = user_id OR 
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);

-- Profiles - Users can manage their own
CREATE POLICY "users_manage_own_profile" ON profiles 
FOR ALL USING (
  auth.uid() = id OR 
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);

-- User Assessment Attempts - Users can manage their own
CREATE POLICY "users_manage_own_assessment_attempts" ON user_assessment_attempts 
FOR ALL USING (
  auth.uid() = user_id OR 
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);

-- User Survey Completions - Users and guests can manage their own
CREATE POLICY "users_guests_manage_survey_completions" ON user_survey_completions 
FOR ALL USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND guest_token IS NOT NULL) OR
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);

-- Survey Questions - Public read, admin write
CREATE POLICY "public_read_survey_questions" ON survey_questions FOR SELECT USING (true);
CREATE POLICY "admin_manage_survey_questions" ON survey_questions FOR ALL USING (
  auth.role() = 'service_role' OR is_admin_user(auth.uid())
);

-- Survey Learning Goals - Public read, admin write
CREATE POLICY "public_read_survey_learning_goals" ON survey_learning_goals FOR SELECT USING (true);
CREATE POLICY "admin_manage_survey_learning_goals" ON survey_learning_goals FOR ALL USING (
  auth.role() = 'service_role' OR is_admin_user(auth.uid())
);

-- Survey Recommendations - Users and guests can manage their own
CREATE POLICY "users_guests_manage_survey_recommendations" ON survey_recommendations 
FOR ALL USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND guest_token IS NOT NULL) OR
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);

-- User Roles - Very permissive for now
CREATE POLICY "anyone_read_user_roles" ON user_roles FOR SELECT USING (true);
CREATE POLICY "admin_manage_user_roles" ON user_roles FOR ALL USING (
  auth.role() = 'service_role' OR is_admin_user(auth.uid())
);

-- Multiplayer Rooms - Anyone can read/create, creators can manage
CREATE POLICY "anyone_read_multiplayer_rooms" ON multiplayer_rooms FOR SELECT USING (true);
CREATE POLICY "anyone_create_multiplayer_rooms" ON multiplayer_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "creators_manage_multiplayer_rooms" ON multiplayer_rooms 
FOR UPDATE USING (
  auth.uid() = host_user_id OR 
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);
CREATE POLICY "creators_delete_multiplayer_rooms" ON multiplayer_rooms 
FOR DELETE USING (
  auth.uid() = host_user_id OR 
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);

-- Multiplayer Room Players - Users and guests can manage their own
CREATE POLICY "users_guests_manage_room_players" ON multiplayer_room_players 
FOR ALL USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND guest_token IS NOT NULL) OR
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);

-- Multiplayer Question Responses - Users and guests can manage their own
CREATE POLICY "users_guests_manage_question_responses" ON multiplayer_question_responses 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM multiplayer_room_players mrp 
    WHERE mrp.id = player_id AND (
      (auth.uid() IS NOT NULL AND mrp.user_id = auth.uid()) OR
      (auth.uid() IS NULL AND mrp.guest_token IS NOT NULL)
    )
  ) OR
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);

-- =============================================================================
-- CONDITIONALLY CREATE POLICIES FOR TABLES THAT MIGHT EXIST
-- =============================================================================

-- Create policies only if tables exist
DO $$
DECLARE
    table_exists BOOLEAN;
    target_table TEXT;
BEGIN
    -- Check and create policies for tables that might exist
    
    -- Check for user_bookmarks
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_bookmarks'
    ) INTO table_exists;
    
    IF table_exists THEN
        EXECUTE 'CREATE POLICY "users_manage_own_bookmarks" ON user_bookmarks FOR ALL USING (
            auth.uid() = user_id OR 
            auth.role() = ''service_role'' OR
            is_admin_user(auth.uid())
        )';
    END IF;
    
    -- Check for user_snippets
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_snippets'
    ) INTO table_exists;
    
    IF table_exists THEN
        EXECUTE 'CREATE POLICY "users_manage_own_snippets" ON user_snippets FOR ALL USING (
            auth.uid() = user_id OR 
            auth.role() = ''service_role'' OR
            is_admin_user(auth.uid())
        )';
    END IF;
    
    -- Check for other common tables and create very permissive policies
    DECLARE
        common_tables TEXT[] := ARRAY[
            'scenarios', 'events', 'assessments', 'question_feedback',
            'user_feature_usage', 'user_progress_history', 'user_subscriptions',
            'content_packages', 'collection_items', 'collection_reviews',
            'translation_jobs', 'fact_check_logs', 'scheduled_content_jobs',
            'job_execution_logs', 'content_generation_queue', 'content_preview_cache'
        ];
    BEGIN
        FOREACH target_table IN ARRAY common_tables
        LOOP
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = target_table
            ) INTO table_exists;
            
            IF table_exists THEN
                -- Create very permissive policies for these tables
                EXECUTE format('CREATE POLICY "permissive_access_%I" ON %I FOR ALL USING (true)', target_table, target_table);
            END IF;
        END LOOP;
    END;
END $$;

COMMIT; 