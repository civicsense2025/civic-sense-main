-- =============================================================================
-- FIX INSERT POLICIES FOR CORE USER FUNCTIONALITY
-- Based on actual schema diagnosis
-- =============================================================================

BEGIN;

-- =============================================================================
-- ADD SPECIFIC INSERT POLICIES WHERE MISSING
-- The existing "ALL" policies should cover this, but let's add explicit INSERT policies
-- =============================================================================

-- Progress Sessions - Add explicit INSERT policy
CREATE POLICY "users_guests_insert_progress_sessions" ON progress_sessions 
FOR INSERT WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND guest_token IS NOT NULL) OR
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);

-- User Quiz Attempts - Add explicit INSERT policy  
CREATE POLICY "users_guests_insert_quiz_attempts" ON user_quiz_attempts 
FOR INSERT WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);

-- User Progress - Add explicit INSERT policy
CREATE POLICY "users_guests_insert_progress" ON user_progress 
FOR INSERT WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);

-- User Assessment Attempts - Add explicit INSERT policy
CREATE POLICY "users_guests_insert_assessment_attempts" ON user_assessment_attempts 
FOR INSERT WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  auth.role() = 'service_role' OR
  is_admin_user(auth.uid())
);

-- =============================================================================
-- CHECK AND ADD POLICIES FOR OTHER TABLES THAT MIGHT EXIST
-- =============================================================================

-- Only create policies if tables exist
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check for progress_question_responses
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'progress_question_responses'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Check if it has guest_token column
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'progress_question_responses' 
            AND column_name = 'guest_token'
        ) THEN
            EXECUTE 'CREATE POLICY "users_guests_insert_progress_responses" ON progress_question_responses 
            FOR INSERT WITH CHECK (
              EXISTS (
                SELECT 1 FROM progress_sessions 
                WHERE progress_sessions.id = progress_question_responses.progress_session_id 
                AND (
                  (auth.uid() IS NOT NULL AND progress_sessions.user_id = auth.uid()) OR
                  (auth.uid() IS NULL AND progress_sessions.guest_token IS NOT NULL)
                )
              ) OR
              auth.role() = ''service_role'' OR
              is_admin_user(auth.uid())
            )';
        ELSE
            -- No guest support, just user-owned
            EXECUTE 'CREATE POLICY "users_insert_progress_responses" ON progress_question_responses 
            FOR INSERT WITH CHECK (
              EXISTS (
                SELECT 1 FROM progress_sessions 
                WHERE progress_sessions.id = progress_question_responses.progress_session_id 
                AND progress_sessions.user_id = auth.uid()
              ) OR
              auth.role() = ''service_role'' OR
              is_admin_user(auth.uid())
            )';
        END IF;
    END IF;

    -- Check for user_events table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_events'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Check if there's already an INSERT policy
        IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'user_events' 
            AND cmd = 'INSERT'
        ) THEN
            EXECUTE 'CREATE POLICY "users_insert_own_events" ON user_events 
            FOR INSERT WITH CHECK (auth.uid() = user_id)';
        END IF;
    END IF;

    -- Check for other common tables and add INSERT policies if missing
    DECLARE
        target_table TEXT;
        common_tables TEXT[] := ARRAY[
            'user_onboarding_state',
            'user_category_preferences', 
            'user_skill_preferences',
            'user_platform_preferences',
            'user_quiz_analytics',
            'user_learning_insights',
            'assessment_analytics',
            'user_feedback'
        ];
    BEGIN
        FOREACH target_table IN ARRAY common_tables
        LOOP
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = target_table
            ) INTO table_exists;
            
            IF table_exists THEN
                -- Check if there's already an INSERT policy
                IF NOT EXISTS (
                    SELECT FROM pg_policies 
                    WHERE schemaname = 'public' 
                    AND tablename = target_table 
                    AND cmd = 'INSERT'
                ) THEN
                    -- Check if table has user_id column
                    IF EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_schema = 'public' 
                        AND table_name = target_table 
                        AND column_name = 'user_id'
                    ) THEN
                        EXECUTE format('CREATE POLICY "users_insert_own_%I" ON %I 
                        FOR INSERT WITH CHECK (auth.uid() = user_id)', target_table, target_table);
                    END IF;
                END IF;
            END IF;
        END LOOP;
    END;
END $$;

COMMIT; 