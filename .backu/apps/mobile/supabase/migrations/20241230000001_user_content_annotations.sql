-- ============================================================================
-- USER CONTENT ANNOTATIONS SYSTEM
-- ============================================================================
-- Personal note-taking and content linking for saved items
-- Allows users to make content "feel like theirs" without full UGC

BEGIN;

-- User Content Annotations - Personal notes on saved content
CREATE TABLE IF NOT EXISTS public.user_content_annotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content reference (links to saved bookmarks/content)
  content_type TEXT NOT NULL CHECK (content_type IN ('bookmark', 'topic', 'article', 'quiz_result')),
  content_id TEXT NOT NULL, -- ID of the saved content item
  content_title TEXT NOT NULL, -- Cached title for easy reference
  
  -- User annotations
  personal_notes TEXT, -- User's personal notes/thoughts
  key_insights TEXT[], -- Array of key insights user extracted
  personal_rating INTEGER CHECK (personal_rating >= 1 AND personal_rating <= 5), -- 1-5 star rating
  
  -- Learning context
  why_saved TEXT, -- Why user saved this content
  how_it_applies TEXT, -- How it applies to their life/interests
  follow_up_questions TEXT[], -- Questions they want to explore further
  
  -- Personal tags (separate from system tags)
  personal_tags TEXT[] DEFAULT '{}',
  
  -- Progress tracking
  reading_progress DECIMAL DEFAULT 0 CHECK (reading_progress >= 0 AND reading_progress <= 1), -- 0 to 1
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  times_accessed INTEGER DEFAULT 1,
  
  -- Standard fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one annotation per user per content item
  UNIQUE(user_id, content_type, content_id)
);

-- User Content Connections - Link related content together
CREATE TABLE IF NOT EXISTS public.user_content_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source content
  from_content_type TEXT NOT NULL,
  from_content_id TEXT NOT NULL,
  
  -- Target content
  to_content_type TEXT NOT NULL,
  to_content_id TEXT NOT NULL,
  
  -- Connection metadata
  connection_type TEXT NOT NULL DEFAULT 'related' CHECK (
    connection_type IN ('related', 'builds_on', 'contradicts', 'example_of', 'prerequisite', 'follow_up')
  ),
  connection_note TEXT, -- Why user thinks these are connected
  strength INTEGER DEFAULT 3 CHECK (strength >= 1 AND strength <= 5), -- 1-5 connection strength
  
  -- Standard fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicate connections
  UNIQUE(user_id, from_content_type, from_content_id, to_content_type, to_content_id),
  
  -- Prevent self-connections
  CHECK (NOT (from_content_type = to_content_type AND from_content_id = to_content_id))
);

-- User Content Collections - Organize content into personal collections
CREATE TABLE IF NOT EXISTS public.user_content_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Collection metadata
  name TEXT NOT NULL,
  description TEXT,
  color_theme TEXT DEFAULT 'blue' CHECK (
    color_theme IN ('blue', 'green', 'orange', 'purple', 'red', 'yellow', 'gray')
  ),
  emoji TEXT, -- Optional emoji for collection
  
  -- Organization
  is_favorite BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  
  -- Standard fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- User can't have duplicate collection names
  UNIQUE(user_id, name)
);

-- User Content Collection Items - Items within collections
CREATE TABLE IF NOT EXISTS public.user_content_collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.user_content_collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content reference
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  
  -- Organization within collection
  sort_order INTEGER DEFAULT 0,
  added_note TEXT, -- Why user added this to collection
  
  -- Standard fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicate items in same collection
  UNIQUE(collection_id, content_type, content_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User content annotations indexes
CREATE INDEX IF NOT EXISTS idx_user_content_annotations_user_id 
ON public.user_content_annotations(user_id);

CREATE INDEX IF NOT EXISTS idx_user_content_annotations_content 
ON public.user_content_annotations(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_user_content_annotations_updated 
ON public.user_content_annotations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_content_annotations_tags 
ON public.user_content_annotations USING GIN(personal_tags);

-- User content connections indexes
CREATE INDEX IF NOT EXISTS idx_user_content_connections_user_id 
ON public.user_content_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_user_content_connections_from 
ON public.user_content_connections(from_content_type, from_content_id);

CREATE INDEX IF NOT EXISTS idx_user_content_connections_to 
ON public.user_content_connections(to_content_type, to_content_id);

-- User content collections indexes
CREATE INDEX IF NOT EXISTS idx_user_content_collections_user_id 
ON public.user_content_collections(user_id);

CREATE INDEX IF NOT EXISTS idx_user_content_collection_items_collection 
ON public.user_content_collection_items(collection_id);

CREATE INDEX IF NOT EXISTS idx_user_content_collection_items_user 
ON public.user_content_collection_items(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_content_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content_collection_items ENABLE ROW LEVEL SECURITY;

-- User content annotations policies
CREATE POLICY "Users can access their own annotations"
ON public.user_content_annotations FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User content connections policies  
CREATE POLICY "Users can access their own connections"
ON public.user_content_connections FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User content collections policies
CREATE POLICY "Users can access their own collections"
ON public.user_content_collections FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User content collection items policies
CREATE POLICY "Users can access their own collection items"
ON public.user_content_collection_items FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's annotation for specific content
CREATE OR REPLACE FUNCTION get_user_content_annotation(
  p_user_id UUID,
  p_content_type TEXT,
  p_content_id TEXT
)
RETURNS TABLE (
  annotation_id UUID,
  personal_notes TEXT,
  key_insights TEXT[],
  personal_rating INTEGER,
  why_saved TEXT,
  how_it_applies TEXT,
  follow_up_questions TEXT[],
  personal_tags TEXT[],
  reading_progress DECIMAL,
  last_accessed_at TIMESTAMPTZ,
  times_accessed INTEGER
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id,
    personal_notes,
    key_insights,
    personal_rating,
    why_saved,
    how_it_applies,
    follow_up_questions,
    personal_tags,
    reading_progress,
    last_accessed_at,
    times_accessed
  FROM public.user_content_annotations
  WHERE user_id = p_user_id 
    AND content_type = p_content_type 
    AND content_id = p_content_id;
$$;

-- Function to get connected content for a user
CREATE OR REPLACE FUNCTION get_user_connected_content(
  p_user_id UUID,
  p_content_type TEXT,
  p_content_id TEXT
)
RETURNS TABLE (
  connection_id UUID,
  connected_content_type TEXT,
  connected_content_id TEXT,
  connection_type TEXT,
  connection_note TEXT,
  strength INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- Get both outgoing and incoming connections
  SELECT 
    id,
    to_content_type,
    to_content_id,
    connection_type,
    connection_note,
    strength,
    created_at
  FROM public.user_content_connections
  WHERE user_id = p_user_id 
    AND from_content_type = p_content_type 
    AND from_content_id = p_content_id
  
  UNION ALL
  
  SELECT 
    id,
    from_content_type,
    from_content_id,
    connection_type,
    connection_note,
    strength,
    created_at
  FROM public.user_content_connections
  WHERE user_id = p_user_id 
    AND to_content_type = p_content_type 
    AND to_content_id = p_content_id
  
  ORDER BY created_at DESC;
$$;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_user_content_annotations_updated_at
  BEFORE UPDATE ON public.user_content_annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_content_connections_updated_at
  BEFORE UPDATE ON public.user_content_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_content_collections_updated_at
  BEFORE UPDATE ON public.user_content_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ============================================================================
-- SAMPLE DATA (for development)
-- ============================================================================

-- Note: This would be populated by the application when users interact with content
-- Example:
-- INSERT INTO public.user_content_annotations (
--   user_id, content_type, content_id, content_title,
--   personal_notes, why_saved, personal_tags
-- ) VALUES (
--   auth.uid(), 'topic', 'constitutional-rights', 'Constitutional Rights',
--   'Key concepts about First Amendment protections...',
--   'Need to understand free speech limits for my journalism work',
--   ARRAY['journalism', 'free-speech', 'important']
-- ); 