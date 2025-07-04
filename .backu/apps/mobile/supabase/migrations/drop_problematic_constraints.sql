-- =============================================================================
-- DROP PROBLEMATIC DATABASE CONSTRAINTS
-- Fix for constraint violations in progress_sessions and bookmarks tables
-- =============================================================================

BEGIN;

-- =============================================================================
-- FIX PROGRESS_SESSIONS TABLE CONSTRAINTS
-- =============================================================================

-- Make session_type nullable to fix "null value in column "session_type"" error
ALTER TABLE progress_sessions 
ALTER COLUMN session_type DROP NOT NULL;

-- Drop existing session_type check constraint if it exists
ALTER TABLE progress_sessions DROP CONSTRAINT IF EXISTS progress_sessions_session_type_check;

-- Add more flexible session_type check constraint that allows common values
ALTER TABLE progress_sessions 
ADD CONSTRAINT progress_sessions_session_type_check 
CHECK (session_type IN (
  'regular_quiz', 'reinforcement', 'review', 'challenge', 
  'assessment', 'civics_test', 'quiz', 'practice', 
  'lightning', 'multiplayer', 'timed', 'adaptive'
) OR session_type IS NULL);

-- =============================================================================
-- FIX BOOKMARKS TABLE CONSTRAINTS  
-- =============================================================================

-- Drop existing content_type check constraint if it exists
ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_content_type_check;

-- Add more flexible content_type check constraint that allows common values
ALTER TABLE bookmarks 
ADD CONSTRAINT bookmarks_content_type_check 
CHECK (content_type IN (
  'topic', 'topics', 'article', 'articles', 'quiz', 'quizzes', 
  'event', 'events', 'question', 'questions', 'assessment', 
  'civics_test', 'other', 'content', 'page', 'resource'
));

-- =============================================================================
-- ADDITIONAL CONSTRAINT FIXES
-- =============================================================================

-- Make topic_id nullable in progress_sessions for assessments/civics tests
-- (This may already be done, but ensuring it's applied)
ALTER TABLE progress_sessions 
ALTER COLUMN topic_id DROP NOT NULL;

-- Ensure user_id can be null for guest sessions
ALTER TABLE progress_sessions 
ALTER COLUMN user_id DROP NOT NULL;

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_sessions_session_type ON progress_sessions(session_type) WHERE session_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookmarks_content_type ON bookmarks(content_type);
CREATE INDEX IF NOT EXISTS idx_progress_sessions_guest_token ON progress_sessions(guest_token) WHERE guest_token IS NOT NULL;

COMMIT; 