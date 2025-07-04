-- ============================================================================
-- Comprehensive Custom Content Analytics & Author Attribution System
-- Combines analytics infrastructure with author attribution
-- Fixes PostgreSQL compatibility issues
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENHANCED CUSTOM CONTENT COLLECTIONS
-- ============================================================================

-- Check if table exists, if not create it, if it exists add missing columns
DO $$ 
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'custom_content_collections') THEN
    CREATE TABLE public.custom_content_collections (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      
      -- Basic Info
      title TEXT NOT NULL,
      description TEXT,
      slug TEXT UNIQUE,
      emoji TEXT DEFAULT '📚',
      cover_image_url TEXT,
      
      -- Ownership & Creation
      owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Author attribution
      created_by_ai BOOLEAN DEFAULT FALSE,
      ai_generation_id UUID REFERENCES public.custom_content_generations(id),
      creation_method TEXT CHECK (creation_method IN ('manual', 'ai_generated', 'ai_assisted', 'imported', 'cloned')),
      
      -- Privacy & Access Control
      visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public', 'organization')),
      is_collaborative BOOLEAN DEFAULT FALSE,
      allow_remixing BOOLEAN DEFAULT FALSE,
      requires_premium BOOLEAN DEFAULT FALSE,
      password_hash TEXT,
      
      -- Content Settings
      question_count INTEGER DEFAULT 0,
      estimated_duration_minutes INTEGER,
      difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'mixed', 'adaptive')),
      language TEXT DEFAULT 'en',
      
      -- Categorization
      category TEXT,
      tags TEXT[] DEFAULT '{}',
      topic_areas TEXT[] DEFAULT '{}',
      
      -- Status
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
      published_at TIMESTAMPTZ,
      last_played_at TIMESTAMPTZ,
      
      -- Analytics Summary (Denormalized for performance)
      total_plays INTEGER DEFAULT 0,
      unique_players INTEGER DEFAULT 0,
      total_completions INTEGER DEFAULT 0,
      average_score DECIMAL(5,2),
      average_completion_time_seconds INTEGER,
      engagement_score DECIMAL(5,2),
      
      -- Metadata
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      
      -- Constraints
      CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$' OR slug IS NULL)
    );
  END IF;

  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'custom_content_collections' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.custom_content_collections 
    ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    
    -- Set created_by to match owner_id for existing records
    UPDATE public.custom_content_collections 
    SET created_by = owner_id 
    WHERE created_by IS NULL;
  END IF;

  -- Add other missing columns from analytics system
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'custom_content_collections' 
    AND column_name = 'created_by_ai'
  ) THEN
    ALTER TABLE public.custom_content_collections 
    ADD COLUMN created_by_ai BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'custom_content_collections' 
    AND column_name = 'creation_method'
  ) THEN
    ALTER TABLE public.custom_content_collections 
    ADD COLUMN creation_method TEXT CHECK (creation_method IN ('manual', 'ai_generated', 'ai_assisted', 'imported', 'cloned'));
  END IF;

END $$;

-- ============================================================================
-- 2. CUSTOM CONTENT GENERATIONS (Enhanced)
-- ============================================================================

-- Add created_by to generations table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'custom_content_generations' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.custom_content_generations 
    ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    
    -- Set created_by to match user_id for existing records
    UPDATE public.custom_content_generations 
    SET created_by = user_id 
    WHERE created_by IS NULL;
  END IF;
END $$;

-- ============================================================================
-- 3. COLLECTION ITEMS (Questions in collections)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.custom_collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.custom_content_collections(id) ON DELETE CASCADE,
  
  -- Question Reference
  question_id UUID REFERENCES public.questions(id),
  custom_question_data JSONB,
  
  -- Order and Organization
  position INTEGER NOT NULL,
  section_name TEXT,
  
  -- Item-specific settings
  is_required BOOLEAN DEFAULT TRUE,
  points_value INTEGER DEFAULT 1,
  time_limit_seconds INTEGER,
  
  -- Analytics Summary
  times_answered INTEGER DEFAULT 0,
  correct_rate DECIMAL(5,2),
  average_time_seconds INTEGER,
  skip_rate DECIMAL(5,2),
  
  -- Metadata
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  added_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  -- Constraints
  UNIQUE(collection_id, position),
  CHECK (question_id IS NOT NULL OR custom_question_data IS NOT NULL)
);

-- ============================================================================
-- 4. COLLECTION COLLABORATORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collection_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.custom_content_collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Permissions
  role TEXT NOT NULL CHECK (role IN ('viewer', 'contributor', 'editor', 'admin')),
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_invite BOOLEAN DEFAULT FALSE,
  can_publish BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'removed')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  
  -- Activity
  last_viewed_at TIMESTAMPTZ,
  contributions_count INTEGER DEFAULT 0,
  
  UNIQUE(collection_id, user_id)
);

-- ============================================================================
-- 5. COLLECTION PLAY SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collection_play_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.custom_content_collections(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Session Info
  session_token TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Progress
  current_item_position INTEGER,
  items_completed INTEGER DEFAULT 0,
  items_skipped INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  total_possible_score INTEGER,
  
  -- Engagement Metrics
  total_time_seconds INTEGER DEFAULT 0,
  active_time_seconds INTEGER DEFAULT 0,
  pause_count INTEGER DEFAULT 0,
  hint_usage_count INTEGER DEFAULT 0,
  
  -- Context
  play_mode TEXT CHECK (play_mode IN ('normal', 'practice', 'speed_run', 'multiplayer')),
  device_type TEXT,
  app_version TEXT,
  referrer_source TEXT,
  
  -- Completion
  is_completed BOOLEAN DEFAULT FALSE,
  completion_rate DECIMAL(5,2),
  final_score_percentage DECIMAL(5,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- 6. ANALYTICS EVENTS (Fixed generated column issue)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collection_analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.custom_content_collections(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.collection_play_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event Details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'view', 'play_start', 'play_pause', 'play_resume', 'play_complete',
    'item_start', 'item_complete', 'item_skip', 'item_answer',
    'share', 'remix', 'rate', 'comment', 'report', 'visibility_change',
    'collaborator_invited', 'share_created'
  )),
  event_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Context
  item_id UUID REFERENCES public.custom_collection_items(id),
  item_position INTEGER,
  
  -- Event-specific data
  event_data JSONB DEFAULT '{}',
  
  -- Performance
  client_timestamp TIMESTAMPTZ,
  processing_time_ms INTEGER
);

-- ============================================================================
-- 7. COLLECTION ENGAGEMENT (Social features)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collection_engagement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.custom_content_collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Engagement Types
  has_liked BOOLEAN DEFAULT FALSE,
  has_saved BOOLEAN DEFAULT FALSE,
  has_shared BOOLEAN DEFAULT FALSE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  -- Timestamps
  liked_at TIMESTAMPTZ,
  saved_at TIMESTAMPTZ,
  shared_at TIMESTAMPTZ,
  rated_at TIMESTAMPTZ,
  last_played_at TIMESTAMPTZ,
  
  -- Play Stats
  play_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  best_score INTEGER,
  total_time_spent_seconds INTEGER DEFAULT 0,
  
  -- Comments/Notes
  private_notes TEXT,
  public_comment TEXT,
  comment_visibility TEXT DEFAULT 'public' CHECK (comment_visibility IN ('public', 'friends', 'private')),
  
  UNIQUE(collection_id, user_id)
);

-- ============================================================================
-- 8. COLLECTION SHARING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collection_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.custom_content_collections(id) ON DELETE CASCADE,
  
  -- Share Details
  share_code TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  share_type TEXT NOT NULL CHECK (share_type IN ('link', 'email', 'social', 'embed', 'qr_code')),
  
  -- Access Control
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  password_required BOOLEAN DEFAULT FALSE,
  require_login BOOLEAN DEFAULT FALSE,
  
  -- Permissions
  allow_remix BOOLEAN DEFAULT FALSE,
  allow_download BOOLEAN DEFAULT FALSE,
  
  -- Usage Tracking
  use_count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  revoked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- 9. DAILY ANALYTICS (Pre-computed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collection_analytics_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.custom_content_collections(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Play Metrics
  total_plays INTEGER DEFAULT 0,
  unique_players INTEGER DEFAULT 0,
  completed_plays INTEGER DEFAULT 0,
  average_completion_rate DECIMAL(5,2),
  
  -- Engagement Metrics
  total_time_played_minutes INTEGER DEFAULT 0,
  average_session_duration_minutes DECIMAL(5,2),
  bounce_rate DECIMAL(5,2),
  
  -- Performance Metrics
  average_score DECIMAL(5,2),
  perfect_scores INTEGER DEFAULT 0,
  
  -- Social Metrics
  total_shares INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  
  -- Calculated Scores
  engagement_score DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  
  UNIQUE(collection_id, date)
);

-- ============================================================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_owner ON public.custom_content_collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_by ON public.custom_content_collections(created_by);
CREATE INDEX IF NOT EXISTS idx_collections_visibility ON public.custom_content_collections(visibility) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.custom_content_collections(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collections_tags ON public.custom_content_collections USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_collections_engagement ON public.custom_content_collections(engagement_score DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_collections_public_by_author ON public.custom_content_collections(created_by, visibility, status) WHERE visibility = 'public' AND status = 'published';

-- Generations indexes
CREATE INDEX IF NOT EXISTS idx_custom_content_generations_created_by ON public.custom_content_generations(created_by, created_at DESC);

-- Collection items indexes
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.custom_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_position ON public.custom_collection_items(collection_id, position);

-- Collaborators indexes
CREATE INDEX IF NOT EXISTS idx_collaborators_collection ON public.collection_collaborators(collection_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON public.collection_collaborators(user_id) WHERE status = 'active';

-- Play sessions indexes
CREATE INDEX IF NOT EXISTS idx_play_sessions_collection ON public.collection_play_sessions(collection_id);
CREATE INDEX IF NOT EXISTS idx_play_sessions_user ON public.collection_play_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_play_sessions_completed ON public.collection_play_sessions(collection_id, completed_at) WHERE is_completed = TRUE;

-- Analytics events indexes (simplified without function-based indexes)
CREATE INDEX IF NOT EXISTS idx_analytics_events_collection_timestamp ON public.collection_analytics_events(collection_id, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp ON public.collection_analytics_events(event_type, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp ON public.collection_analytics_events(user_id, event_timestamp) WHERE user_id IS NOT NULL;

-- Engagement indexes
CREATE INDEX IF NOT EXISTS idx_engagement_collection ON public.collection_engagement(collection_id);
CREATE INDEX IF NOT EXISTS idx_engagement_user ON public.collection_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_saved ON public.collection_engagement(user_id, saved_at) WHERE has_saved = TRUE;

-- Shares indexes
CREATE INDEX IF NOT EXISTS idx_shares_collection ON public.collection_shares(collection_id);
CREATE INDEX IF NOT EXISTS idx_shares_code ON public.collection_shares(share_code) WHERE revoked_at IS NULL;

-- Daily analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_daily_collection_date ON public.collection_analytics_daily(collection_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON public.collection_analytics_daily(date DESC);

-- ============================================================================
-- 11. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update collection analytics
CREATE OR REPLACE FUNCTION update_collection_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update collection totals when a play session completes
  IF NEW.is_completed = TRUE AND (OLD.is_completed IS NULL OR OLD.is_completed = FALSE) THEN
    UPDATE public.custom_content_collections
    SET 
      total_plays = total_plays + 1,
      total_completions = total_completions + 1,
      last_played_at = NEW.completed_at,
      average_score = (
        SELECT AVG(final_score_percentage) 
        FROM public.collection_play_sessions 
        WHERE collection_id = NEW.collection_id AND is_completed = TRUE
      ),
      average_completion_time_seconds = (
        SELECT AVG(total_time_seconds) 
        FROM public.collection_play_sessions 
        WHERE collection_id = NEW.collection_id AND is_completed = TRUE
      ),
      updated_at = NOW()
    WHERE id = NEW.collection_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_collection_analytics ON public.collection_play_sessions;
CREATE TRIGGER trigger_update_collection_analytics
AFTER UPDATE ON public.collection_play_sessions
FOR EACH ROW
EXECUTE FUNCTION update_collection_analytics();

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_play_count INTEGER,
  p_completion_rate DECIMAL,
  p_average_score DECIMAL,
  p_share_count INTEGER,
  p_like_count INTEGER
) RETURNS DECIMAL AS $$
DECLARE
  engagement_score DECIMAL;
BEGIN
  -- Weighted formula for engagement
  engagement_score := (
    (COALESCE(p_play_count, 0) * 0.3) +
    (COALESCE(p_completion_rate, 0) * 100 * 0.3) +
    (COALESCE(p_average_score, 0) * 0.2) +
    (COALESCE(p_share_count, 0) * 5 * 0.1) +
    (COALESCE(p_like_count, 0) * 2 * 0.1)
  );
  
  -- Normalize to 0-100 scale
  RETURN LEAST(100, engagement_score);
END;
$$ LANGUAGE plpgsql;

-- Function to generate shareable slug
CREATE OR REPLACE FUNCTION generate_collection_slug(p_title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from title
  base_slug := LOWER(REGEXP_REPLACE(p_title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := TRIM(BOTH '-' FROM base_slug);
  base_slug := SUBSTRING(base_slug FROM 1 FOR 50); -- Limit length
  
  -- Ensure uniqueness
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.custom_content_collections WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.custom_content_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_play_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Collections: Users can manage their own, view based on visibility and authorship
DROP POLICY IF EXISTS "collection_owner_all" ON public.custom_content_collections;
CREATE POLICY "collection_owner_all" ON public.custom_content_collections
  FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "collection_public_view" ON public.custom_content_collections;
CREATE POLICY "collection_public_view" ON public.custom_content_collections
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() = created_by OR
    visibility = 'public' AND status = 'published' OR
    (visibility = 'unlisted' AND auth.uid() IS NOT NULL) OR
    EXISTS (
      SELECT 1 FROM public.collection_collaborators
      WHERE collection_id = custom_content_collections.id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Collection Items: Inherit from collection permissions
DROP POLICY IF EXISTS "items_collection_access" ON public.custom_collection_items;
CREATE POLICY "items_collection_access" ON public.custom_collection_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.custom_content_collections c
      WHERE c.id = collection_id
      AND (
        c.owner_id = auth.uid() OR 
        c.created_by = auth.uid() OR
        c.visibility = 'public' AND c.status = 'published' OR
        (c.visibility = 'unlisted' AND auth.uid() IS NOT NULL)
      )
    )
  );

-- Collaborators: Users can manage collaborators on their collections
DROP POLICY IF EXISTS "collaborators_collection_owner" ON public.collection_collaborators;
CREATE POLICY "collaborators_collection_owner" ON public.collection_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.custom_content_collections
      WHERE id = collection_id AND (owner_id = auth.uid() OR created_by = auth.uid())
    ) OR user_id = auth.uid()
  );

-- Play Sessions: Users can manage their own
DROP POLICY IF EXISTS "sessions_own_data" ON public.collection_play_sessions;
CREATE POLICY "sessions_own_data" ON public.collection_play_sessions
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Analytics Events: Write-only for users, read for collection owners
DROP POLICY IF EXISTS "events_insert" ON public.collection_analytics_events;
CREATE POLICY "events_insert" ON public.collection_analytics_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "events_read_owner" ON public.collection_analytics_events;
CREATE POLICY "events_read_owner" ON public.collection_analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.custom_content_collections
      WHERE id = collection_id AND (owner_id = auth.uid() OR created_by = auth.uid())
    )
  );

-- Engagement: Users manage their own
DROP POLICY IF EXISTS "engagement_own_data" ON public.collection_engagement;
CREATE POLICY "engagement_own_data" ON public.collection_engagement
  FOR ALL USING (auth.uid() = user_id);

-- Shares: Collection owners can manage
DROP POLICY IF EXISTS "shares_collection_owner" ON public.collection_shares;
CREATE POLICY "shares_collection_owner" ON public.collection_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.custom_content_collections
      WHERE id = collection_id AND (owner_id = auth.uid() OR created_by = auth.uid())
    )
  );

-- Daily Analytics: Collection owners can read
DROP POLICY IF EXISTS "analytics_daily_owner" ON public.collection_analytics_daily;
CREATE POLICY "analytics_daily_owner" ON public.collection_analytics_daily
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.custom_content_collections
      WHERE id = collection_id AND (owner_id = auth.uid() OR created_by = auth.uid())
    )
  );

-- ============================================================================
-- 13. PUBLIC CONTENT DISCOVERY VIEW
-- ============================================================================

-- Create a view for discovering public content with author information
CREATE OR REPLACE VIEW public_collections_with_authors AS
SELECT 
  cc.*,
  p.display_name as author_display_name,
  p.username as author_username,
  p.avatar_url as author_avatar_url,
  p.bio as author_bio,
  -- Calculate engagement metrics
  COALESCE(avg_rating.rating, 0) as avg_rating,
  COALESCE(rating_count.count, 0) as rating_count,
  COALESCE(play_count.count, 0) as play_count
FROM public.custom_content_collections cc
LEFT JOIN profiles p ON p.id = cc.created_by
LEFT JOIN (
  SELECT 
    collection_id, 
    AVG(rating::numeric) as rating 
  FROM public.collection_engagement 
  WHERE rating IS NOT NULL 
  GROUP BY collection_id
) avg_rating ON avg_rating.collection_id = cc.id
LEFT JOIN (
  SELECT 
    collection_id, 
    COUNT(*) as count 
  FROM public.collection_engagement 
  WHERE rating IS NOT NULL 
  GROUP BY collection_id
) rating_count ON rating_count.collection_id = cc.id
LEFT JOIN (
  SELECT 
    collection_id, 
    COUNT(*) as count 
  FROM public.collection_play_sessions 
  GROUP BY collection_id
) play_count ON play_count.collection_id = cc.id
WHERE cc.visibility = 'public' 
  AND cc.status = 'published'
ORDER BY cc.published_at DESC;

-- Grant select access to the view for authenticated users
GRANT SELECT ON public_collections_with_authors TO authenticated;

-- Helper view for collection discovery
CREATE OR REPLACE VIEW public.discoverable_collections AS
SELECT 
  c.*,
  COUNT(DISTINCT ps.user_id) as recent_players,
  COUNT(DISTINCT e.user_id) FILTER (WHERE e.has_liked = true) as total_likes,
  AVG(e.rating) as average_rating
FROM public.custom_content_collections c
LEFT JOIN public.collection_play_sessions ps ON c.id = ps.collection_id 
  AND ps.started_at > NOW() - INTERVAL '7 days'
LEFT JOIN public.collection_engagement e ON c.id = e.collection_id
WHERE c.visibility = 'public' AND c.status = 'published'
GROUP BY c.id;

-- Grant select access
GRANT SELECT ON discoverable_collections TO authenticated;

-- ============================================================================
-- 14. COMMENTS AND METADATA
-- ============================================================================

-- Add comments to important columns
COMMENT ON COLUMN public.custom_content_collections.created_by IS 'Original creator of the content - used for author attribution in public quizzes';
COMMENT ON COLUMN public.custom_content_generations.created_by IS 'Original creator of the generated content - tracks authorship across transfers';
COMMENT ON TABLE public.custom_content_collections IS 'Main table for custom quiz collections with analytics and collaboration features';
COMMENT ON TABLE public.collection_analytics_events IS 'Granular analytics events for collections with timestamp-based partitioning';

-- ============================================================================
-- 15. MIGRATION HELPERS
-- ============================================================================

-- Link existing AI-generated content to collections if not already linked
INSERT INTO public.custom_content_collections (
  title,
  description,
  owner_id,
  created_by,
  created_by_ai,
  ai_generation_id,
  creation_method,
  question_count,
  status,
  created_at
)
SELECT 
  topic as title,
  description,
  user_id as owner_id,
  COALESCE(created_by, user_id) as created_by,
  true as created_by_ai,
  id as ai_generation_id,
  'ai_generated' as creation_method,
  COALESCE(jsonb_array_length(content->'questions'), 0) as question_count,
  CASE 
    WHEN status = 'published' THEN 'published'::text
    ELSE 'draft'::text
  END as status,
  created_at
FROM public.custom_content_generations
WHERE NOT EXISTS (
  SELECT 1 FROM public.custom_content_collections 
  WHERE ai_generation_id = custom_content_generations.id
)
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (Save separately as rollback.sql)
-- ============================================================================
/*
BEGIN;
DROP VIEW IF EXISTS public.discoverable_collections;
DROP VIEW IF EXISTS public_collections_with_authors;
DROP TRIGGER IF EXISTS trigger_update_collection_analytics ON public.collection_play_sessions;
DROP FUNCTION IF EXISTS update_collection_analytics();
DROP FUNCTION IF EXISTS calculate_engagement_score(INTEGER, DECIMAL, DECIMAL, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS generate_collection_slug(TEXT);
DROP TABLE IF EXISTS public.collection_analytics_daily CASCADE;
DROP TABLE IF EXISTS public.collection_shares CASCADE;
DROP TABLE IF EXISTS public.collection_engagement CASCADE;
DROP TABLE IF EXISTS public.collection_analytics_events CASCADE;
DROP TABLE IF EXISTS public.collection_play_sessions CASCADE;
DROP TABLE IF EXISTS public.collection_collaborators CASCADE;
DROP TABLE IF EXISTS public.custom_collection_items CASCADE;
-- Don't drop custom_content_collections as it might have existing data
-- Instead, remove added columns:
-- ALTER TABLE public.custom_content_collections DROP COLUMN IF EXISTS created_by CASCADE;
-- ALTER TABLE public.custom_content_generations DROP COLUMN IF EXISTS created_by CASCADE;
COMMIT;
*/ 