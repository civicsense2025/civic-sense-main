-- =============================================================================
-- CivicSense Glossary System - Complete Schema with Relationships & Games
-- =============================================================================
-- This script creates a comprehensive glossary system that supports:
-- - Content references and backlinks
-- - Term relationships and cross-references  
-- - Integration with existing categories table
-- - Educational games (matching, crosswords, etc.)
-- - Usage tracking and analytics
-- =============================================================================

BEGIN;

-- =============================================================================
-- MAIN GLOSSARY TERMS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.glossary_terms (
  -- Primary key and identity
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Core glossary fields
  term TEXT NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  part_of_speech TEXT,
  
  -- Structured data
  examples JSONB DEFAULT '[]'::jsonb,
  synonyms TEXT[] DEFAULT '{}',
  
  -- Flexible metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  educational_context JSONB DEFAULT '{}'::jsonb,
  
  -- Source tracking (links to source_metadata table)
  primary_source_id UUID REFERENCES public.source_metadata(id) ON DELETE SET NULL,
  supporting_source_ids UUID[] DEFAULT '{}', -- Array of UUIDs referencing source_metadata
  source_info JSONB DEFAULT '{}'::jsonb, -- Additional source context: {"verification_date": "...", "fact_check_notes": "...", "reliability_score": 85}
  
  -- Multilingual translations
  translations JSONB DEFAULT '{}'::jsonb, -- {"es": {"term": "...", "definition": "...", "examples": [...], "synonyms": [...], "provider": "deepl"}}
  
  -- Game mechanics
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5) DEFAULT 3,
  game_data JSONB DEFAULT '{}'::jsonb, -- crossword clues, matching pairs, etc.
  
  -- Quality tracking
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  is_verified BOOLEAN DEFAULT FALSE,
  ai_generated BOOLEAN DEFAULT FALSE,
  
  -- Content management
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- TERM-CATEGORY RELATIONSHIPS (Uses existing categories table)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.glossary_term_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term_id UUID NOT NULL REFERENCES public.glossary_terms(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  
  -- Relationship metadata
  is_primary BOOLEAN DEFAULT FALSE,
  relevance_score INTEGER CHECK (relevance_score >= 1 AND relevance_score <= 10) DEFAULT 5,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(term_id, category_id)
);

-- =============================================================================
-- TERM RELATIONSHIPS (Related terms, see-also, etc.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.glossary_term_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_term_id UUID NOT NULL REFERENCES public.glossary_terms(id) ON DELETE CASCADE,
  target_term_id UUID NOT NULL REFERENCES public.glossary_terms(id) ON DELETE CASCADE,
  
  -- Relationship types
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'synonym', 'antonym', 'related', 'broader', 'narrower', 'see_also', 'part_of', 'example_of'
  )),
  
  -- Relationship strength and metadata
  strength INTEGER CHECK (strength >= 1 AND strength <= 10) DEFAULT 5,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Management
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent self-references and duplicates
  CHECK (source_term_id != target_term_id),
  UNIQUE(source_term_id, target_term_id, relationship_type)
);

-- =============================================================================
-- CONTENT REFERENCES (Links to/from other content)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.glossary_content_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term_id UUID NOT NULL REFERENCES public.glossary_terms(id) ON DELETE CASCADE,
  
  -- Content reference details
  content_type TEXT NOT NULL CHECK (content_type IN (
    'question', 'quiz', 'topic', 'article', 'scenario', 'public_figure', 'event', 'survey'
  )),
  content_id TEXT NOT NULL, -- Could be UUID or other identifier
  content_table TEXT, -- Source table name
  
  -- Reference metadata
  reference_type TEXT CHECK (reference_type IN (
    'definition', 'example', 'context', 'explanation', 'quiz_answer', 'background'
  )) DEFAULT 'definition',
  
  -- Context about the reference
  context_snippet TEXT,
  relevance_score INTEGER CHECK (relevance_score >= 1 AND relevance_score <= 10) DEFAULT 5,
  
  -- Auto-generated or manual
  auto_generated BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(term_id, content_type, content_id, reference_type)
);

-- =============================================================================
-- EDUCATIONAL GAMES DATA
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.glossary_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Game details
  game_type TEXT NOT NULL CHECK (game_type IN (
    'matching', 'crossword', 'word_search', 'fill_blank', 'multiple_choice', 'flashcards'
  )),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Game configuration
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5) DEFAULT 3,
  time_limit_seconds INTEGER,
  max_attempts INTEGER,
  
  -- Term selection criteria (uses existing categories)
  category_filters JSONB DEFAULT '[]'::jsonb, -- Array of category IDs from categories table
  term_filters JSONB DEFAULT '{}'::jsonb, -- Difficulty, quality score, etc.
  min_terms INTEGER DEFAULT 5,
  max_terms INTEGER DEFAULT 20,
  
  -- Game data and rules
  game_config JSONB DEFAULT '{}'::jsonb,
  
  -- Management
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID, -- Could reference users table
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- GAME SESSIONS (User gameplay tracking)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.glossary_game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.glossary_games(id) ON DELETE CASCADE,
  
  -- Player identification
  user_id UUID, -- Reference to auth.users if authenticated
  guest_token TEXT, -- For anonymous users
  session_token TEXT NOT NULL,
  
  -- Game state
  status TEXT CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
  score INTEGER DEFAULT 0,
  max_score INTEGER,
  
  -- Terms used in this session
  terms_used JSONB DEFAULT '[]'::jsonb, -- Array of term IDs
  
  -- Performance tracking
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- Session data
  game_data JSONB DEFAULT '{}'::jsonb, -- Game-specific state
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Ensure one user or guest token
  CHECK ((user_id IS NOT NULL AND guest_token IS NULL) OR (user_id IS NULL AND guest_token IS NOT NULL))
);

-- =============================================================================
-- USAGE ANALYTICS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.glossary_usage_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term_id UUID NOT NULL REFERENCES public.glossary_terms(id) ON DELETE CASCADE,
  
  -- Usage context
  usage_type TEXT NOT NULL CHECK (usage_type IN (
    'viewed', 'searched', 'game_used', 'referenced', 'shared'
  )),
  context_type TEXT, -- 'quiz', 'game', 'search', etc.
  context_id TEXT, -- ID of the context (quiz_id, game_id, etc.)
  
  -- User identification
  user_id UUID,
  guest_token TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Analytics data
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Glossary terms indexes
CREATE INDEX IF NOT EXISTS idx_glossary_terms_term ON public.glossary_terms(term);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_difficulty ON public.glossary_terms(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_quality ON public.glossary_terms(quality_score);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_active ON public.glossary_terms(is_active);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_search ON public.glossary_terms 
USING gin(to_tsvector('english', term || ' ' || definition));
CREATE INDEX IF NOT EXISTS idx_glossary_terms_metadata ON public.glossary_terms USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_translations ON public.glossary_terms USING gin(translations);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_primary_source ON public.glossary_terms(primary_source_id);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_supporting_sources ON public.glossary_terms USING gin(supporting_source_ids);

-- Term-category relationships (uses existing categories table)
CREATE INDEX IF NOT EXISTS idx_term_categories_term ON public.glossary_term_categories(term_id);
CREATE INDEX IF NOT EXISTS idx_term_categories_category ON public.glossary_term_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_term_categories_primary ON public.glossary_term_categories(is_primary);

-- Term relationships
CREATE INDEX IF NOT EXISTS idx_term_relationships_source ON public.glossary_term_relationships(source_term_id);
CREATE INDEX IF NOT EXISTS idx_term_relationships_target ON public.glossary_term_relationships(target_term_id);
CREATE INDEX IF NOT EXISTS idx_term_relationships_type ON public.glossary_term_relationships(relationship_type);

-- Content references
CREATE INDEX IF NOT EXISTS idx_content_references_term ON public.glossary_content_references(term_id);
CREATE INDEX IF NOT EXISTS idx_content_references_content ON public.glossary_content_references(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_references_type ON public.glossary_content_references(reference_type);

-- Games and sessions
CREATE INDEX IF NOT EXISTS idx_glossary_games_type ON public.glossary_games(game_type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game ON public.glossary_game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON public.glossary_game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_guest ON public.glossary_game_sessions(guest_token);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.glossary_game_sessions(status);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_usage_analytics_term ON public.glossary_usage_analytics(term_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_type ON public.glossary_usage_analytics(usage_type);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_date ON public.glossary_usage_analytics(created_at);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_glossary_terms_updated_at ON public.glossary_terms;
CREATE TRIGGER update_glossary_terms_updated_at
    BEFORE UPDATE ON public.glossary_terms
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_glossary_games_updated_at ON public.glossary_games;
CREATE TRIGGER update_glossary_games_updated_at
    BEFORE UPDATE ON public.glossary_games
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- SAMPLE DATA (Uses existing categories)
-- =============================================================================

-- Insert sample terms
INSERT INTO public.glossary_terms (
  term, definition, part_of_speech, examples, synonyms, 
  difficulty_level, quality_score, is_verified, game_data
) VALUES 
(
  'Gerrymandering',
  'The practice of drawing electoral district boundaries to favor one political party or group.',
  'noun',
  '["Maryland''s 3rd congressional district", "Texas redistricting in 2003"]'::jsonb,
  ARRAY['redistricting', 'electoral manipulation'],
  3, 85, TRUE,
  '{"crossword_clue": "Manipulating district boundaries for political advantage", "matching_pair": "Electoral manipulation"}'::jsonb
),
(
  'Filibuster',
  'A legislative procedure allowing a minority to delay or prevent a vote on a bill by extending debate.',
  'noun',
  '["Senate filibuster of voting rights bill", "Talking filibuster by Senator Strom Thurmond"]'::jsonb,
  ARRAY['procedural delay', 'parliamentary tactic'],
  3, 80, TRUE,
  '{"crossword_clue": "Senate procedure to delay votes", "matching_pair": "Parliamentary delay tactic"}'::jsonb
),
(
  'Lobbying',
  'The practice of attempting to influence government decisions through direct contact with legislators or officials.',
  'noun',
  '["Corporate lobbying for tax breaks", "Environmental groups lobbying for climate action"]'::jsonb,
  ARRAY['advocacy', 'influence peddling'],
  2, 90, TRUE,
  '{"crossword_clue": "Influencing lawmakers directly", "matching_pair": "Political influence activity"}'::jsonb
)
ON CONFLICT (term) DO NOTHING;

-- Link terms to existing categories
WITH term_ids AS (
  SELECT id, term FROM public.glossary_terms WHERE term IN ('Gerrymandering', 'Filibuster', 'Lobbying')
),
category_ids AS (
  SELECT id, name FROM public.categories WHERE name IN ('Elections', 'Government', 'Legislative Process')
)
INSERT INTO public.glossary_term_categories (term_id, category_id, is_primary)
SELECT 
  t.id, 
  c.id,
  CASE 
    WHEN t.term = 'Gerrymandering' AND c.name = 'Elections' THEN TRUE
    WHEN t.term = 'Filibuster' AND c.name = 'Legislative Process' THEN TRUE  
    WHEN t.term = 'Lobbying' AND c.name = 'Government' THEN TRUE
    ELSE FALSE
  END
FROM term_ids t 
CROSS JOIN category_ids c
WHERE (t.term = 'Gerrymandering' AND c.name IN ('Elections', 'Electoral Systems'))
   OR (t.term = 'Filibuster' AND c.name IN ('Legislative Process', 'Government'))
   OR (t.term = 'Lobbying' AND c.name IN ('Government', 'Policy Analysis'))
ON CONFLICT (term_id, category_id) DO NOTHING;

-- Create sample relationships
WITH term_ids AS (
  SELECT id, term FROM public.glossary_terms WHERE term IN ('Gerrymandering', 'Filibuster', 'Lobbying')
)
INSERT INTO public.glossary_term_relationships (source_term_id, target_term_id, relationship_type, strength)
SELECT 
  t1.id, t2.id, 'related', 7
FROM term_ids t1, term_ids t2
WHERE t1.term = 'Gerrymandering' AND t2.term = 'Lobbying'
ON CONFLICT (source_term_id, target_term_id, relationship_type) DO NOTHING;

-- Create sample games using existing categories
WITH category_ids AS (
  SELECT id, name FROM public.categories WHERE name IN ('Elections', 'Government') LIMIT 2
)
INSERT INTO public.glossary_games (game_type, title, description, difficulty_level, category_filters, game_config) 
SELECT 
  'matching',
  'Government Terms Matching',
  'Match civic terms with their definitions',
  2,
  jsonb_build_array(category_ids.id),
  '{"pairs_count": 10, "time_limit": 300, "allow_hints": true}'::jsonb
FROM category_ids
WHERE category_ids.name = 'Government'
UNION ALL
SELECT 
  'crossword',
  'Elections Crossword',
  'Fill in the crossword with election and voting terms',
  3,
  jsonb_build_array(category_ids.id),
  '{"grid_size": "15x15", "time_limit": 600, "difficulty": "intermediate"}'::jsonb
FROM category_ids  
WHERE category_ids.name = 'Elections'
ON CONFLICT DO NOTHING;

COMMIT;

-- =============================================================================
-- UTILITY QUERIES & FUNCTIONS
-- =============================================================================

-- Function to get terms by category (uses existing categories table)
CREATE OR REPLACE FUNCTION get_terms_by_category(category_name_param TEXT)
RETURNS TABLE(
  term_id UUID,
  term TEXT,
  definition TEXT,
  difficulty_level INTEGER,
  is_primary BOOLEAN,
  category_name TEXT,
  category_emoji TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gt.id,
    gt.term,
    gt.definition,
    gt.difficulty_level,
    gtc.is_primary,
    c.name,
    c.emoji
  FROM public.glossary_terms gt
  JOIN public.glossary_term_categories gtc ON gt.id = gtc.term_id
  JOIN public.categories c ON gtc.category_id = c.id
  WHERE c.name = category_name_param
    AND gt.is_active = TRUE
    AND c.is_active = TRUE
  ORDER BY gtc.is_primary DESC, gt.term;
END;
$$ LANGUAGE plpgsql;

-- Function to get all terms with their categories
CREATE OR REPLACE FUNCTION get_terms_with_categories()
RETURNS TABLE(
  term_id UUID,
  term TEXT,
  definition TEXT,
  difficulty_level INTEGER,
  categories JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gt.id,
    gt.term,
    gt.definition,
    gt.difficulty_level,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'emoji', c.emoji,
          'is_primary', gtc.is_primary
        ) ORDER BY gtc.is_primary DESC, c.name
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::jsonb
    ) AS categories
  FROM public.glossary_terms gt
  LEFT JOIN public.glossary_term_categories gtc ON gt.id = gtc.term_id
  LEFT JOIN public.categories c ON gtc.category_id = c.id AND c.is_active = TRUE
  WHERE gt.is_active = TRUE
  GROUP BY gt.id, gt.term, gt.definition, gt.difficulty_level
  ORDER BY gt.term;
END;
$$ LANGUAGE plpgsql; 