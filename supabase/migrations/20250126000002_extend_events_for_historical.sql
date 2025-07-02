-- =============================================================================
-- Extend Events Table for Historical/Political Events
-- =============================================================================
-- 
-- This migration extends the existing 'events' table to support historical
-- and political events that can be referenced in civic education content.
-- We build upon the existing schema rather than creating duplicate tables.
--
-- Created: 2025-01-26
-- =============================================================================

BEGIN;

-- =============================================================================
-- EXTEND EVENTS TABLE WITH HISTORICAL FIELDS
-- =============================================================================

-- Add historical event fields to existing events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) CHECK (event_type IN (
  'political', 'sociopolitical', 'cultural', 'economic', 
  'military', 'legislative', 'judicial', 'constitutional', 'news', 'current'
)) DEFAULT 'current';

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS significance_level INTEGER 
CHECK (significance_level BETWEEN 1 AND 10) DEFAULT 5;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS key_figures TEXT[] DEFAULT '{}';

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS related_organizations TEXT[] DEFAULT '{}';

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS geographic_scope VARCHAR(100) DEFAULT 'national';

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS impact_summary TEXT;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS long_term_consequences TEXT;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS quiz_potential JSONB DEFAULT '{}';

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS fact_check_status VARCHAR(50) 
DEFAULT 'pending' CHECK (fact_check_status IN (
  'pending', 'verified', 'disputed', 'debunked'
));

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS reliability_score INTEGER 
CHECK (reliability_score BETWEEN 1 AND 10) DEFAULT 5;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS content_warnings TEXT[] DEFAULT '{}';

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS research_quality_score INTEGER 
CHECK (research_quality_score BETWEEN 1 AND 10);

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS last_fact_checked TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- CONTENT LINKING TABLES
-- =============================================================================

-- Links between events and question topics
CREATE TABLE IF NOT EXISTS topic_event_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  topic_id VARCHAR(100) NOT NULL, -- References question_topics.topic_id
  event_topic_id VARCHAR(255) NOT NULL, -- References events.topic_id
  
  -- Connection details
  connection_type VARCHAR(50) NOT NULL CHECK (connection_type IN (
    'background', 'example', 'precedent', 'comparison', 
    'consequence', 'cause', 'related'
  )),
  connection_strength INTEGER CHECK (connection_strength BETWEEN 1 AND 5) DEFAULT 3,
  context_notes TEXT,
  
  -- Usage tracking
  used_in_questions BOOLEAN DEFAULT FALSE,
  used_in_explanations BOOLEAN DEFAULT FALSE,
  display_priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(topic_id, event_topic_id, connection_type)
);

-- Links between events and individual questions
CREATE TABLE IF NOT EXISTS question_event_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  question_id UUID NOT NULL, -- References questions.id
  event_topic_id VARCHAR(255) NOT NULL, -- References events.topic_id
  
  -- Connection context
  usage_type VARCHAR(50) NOT NULL CHECK (usage_type IN (
    'question_context', 'answer_explanation', 'hint', 
    'source_reference', 'related_reading'
  )),
  display_text TEXT, -- How this connection should be presented
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(question_id, event_topic_id, usage_type)
);

-- Event timeline connections (chronological relationships)
CREATE TABLE IF NOT EXISTS event_timeline_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  from_event_topic_id VARCHAR(255) NOT NULL, -- References events.topic_id
  to_event_topic_id VARCHAR(255) NOT NULL, -- References events.topic_id
  
  relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN (
    'led_to', 'caused_by', 'concurrent_with', 'reaction_to', 
    'precedent_for', 'continuation_of'
  )),
  
  time_gap_days INTEGER, -- Number of days between events
  explanation TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(from_event_topic_id, to_event_topic_id, relationship_type),
  CHECK (from_event_topic_id != to_event_topic_id)
);

-- =============================================================================
-- AI RESEARCH RESULTS TABLE
-- =============================================================================

-- Track AI research for historical events
CREATE TABLE IF NOT EXISTS ai_research_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Research request details
  query TEXT NOT NULL,
  context TEXT,
  research_type VARCHAR(50) DEFAULT 'historical_events',
  
  -- Request parameters
  timeframe JSONB, -- {start_date, end_date}
  focus_areas TEXT[] DEFAULT '{}',
  significance_threshold INTEGER DEFAULT 5,
  
  -- AI processing details
  ai_model VARCHAR(100), -- 'gpt-4', 'claude-3-sonnet', etc.
  processing_time_ms INTEGER,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),
  
  -- Results
  events_found INTEGER DEFAULT 0,
  results JSONB DEFAULT '[]', -- Array of researched event objects
  
  -- Quality and verification
  research_quality VARCHAR(50) DEFAULT 'pending' CHECK (research_quality IN (
    'pending', 'good', 'excellent', 'needs_review', 'poor'
  )),
  human_reviewed BOOLEAN DEFAULT FALSE,
  reviewer_notes TEXT,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'processing' CHECK (status IN (
    'queued', 'processing', 'completed', 'failed', 'cancelled'
  )),
  error_message TEXT,
  
  -- Timestamps and attribution
  research_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  researcher_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- RESEARCH SUGGESTIONS TABLE
-- =============================================================================

-- Track suggestions for events to research
CREATE TABLE IF NOT EXISTS event_research_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Suggestion details
  suggested_title VARCHAR(500) NOT NULL,
  research_query TEXT NOT NULL,
  potential_date DATE,
  significance_estimate INTEGER CHECK (significance_estimate BETWEEN 1 AND 10),
  
  -- AI context
  ai_context TEXT,
  suggested_by_ai BOOLEAN DEFAULT TRUE,
  confidence_score DECIMAL(3, 2) CHECK (confidence_score BETWEEN 0 AND 1),
  
  -- Processing status
  research_status VARCHAR(50) DEFAULT 'suggested' CHECK (research_status IN (
    'suggested', 'approved', 'researching', 'completed', 'rejected', 'duplicate'
  )),
  research_result_id UUID REFERENCES ai_research_results(id),
  resulting_event_topic_id VARCHAR(255), -- References events.topic_id when completed
  
  -- Admin actions
  admin_notes TEXT,
  rejected_reason TEXT,
  
  -- Timestamps
  suggested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Enhanced indexes for events table
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_significance ON events(significance_level DESC);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_events_key_figures ON events USING GIN(key_figures);
CREATE INDEX IF NOT EXISTS idx_events_date_significance ON events(date DESC, significance_level DESC);

-- Content linking indexes
CREATE INDEX IF NOT EXISTS idx_topic_event_connections_topic ON topic_event_connections(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_event_connections_event ON topic_event_connections(event_topic_id);
CREATE INDEX IF NOT EXISTS idx_question_event_connections_question ON question_event_connections(question_id);
CREATE INDEX IF NOT EXISTS idx_question_event_connections_event ON question_event_connections(event_topic_id);

-- Timeline connections indexes
CREATE INDEX IF NOT EXISTS idx_timeline_from_event ON event_timeline_connections(from_event_topic_id);
CREATE INDEX IF NOT EXISTS idx_timeline_to_event ON event_timeline_connections(to_event_topic_id);

-- AI research indexes
CREATE INDEX IF NOT EXISTS idx_ai_research_timestamp ON ai_research_results(research_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_research_status ON ai_research_results(status);
CREATE INDEX IF NOT EXISTS idx_ai_research_researcher ON ai_research_results(researcher_id);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get events related to a topic
CREATE OR REPLACE FUNCTION get_topic_related_events(p_topic_id TEXT)
RETURNS TABLE (
  event_topic_id VARCHAR(255),
  title TEXT,
  event_date DATE,
  connection_type TEXT,
  connection_strength INTEGER,
  context_notes TEXT,
  significance_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.topic_id,
    e.topic_title,
    e.date::DATE,
    tec.connection_type,
    tec.connection_strength,
    tec.context_notes,
    e.significance_level
  FROM events e
  JOIN topic_event_connections tec ON e.topic_id = tec.event_topic_id
  WHERE tec.topic_id = p_topic_id
    AND e.is_active = TRUE
  ORDER BY tec.display_priority DESC, e.significance_level DESC, e.date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to search historical events
CREATE OR REPLACE FUNCTION search_historical_events(
  p_query TEXT, 
  p_event_type TEXT DEFAULT NULL,
  p_min_significance INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  event_topic_id VARCHAR(255),
  title TEXT,
  description TEXT,
  event_date DATE,
  event_type VARCHAR(50),
  significance_level INTEGER,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.topic_id,
    e.topic_title,
    e.description,
    e.date::DATE,
    e.event_type,
    e.significance_level,
    ts_rank(
      to_tsvector('english', e.topic_title || ' ' || COALESCE(e.description, '') || ' ' || array_to_string(e.key_figures, ' ')), 
      plainto_tsquery('english', p_query)
    ) as relevance
  FROM events e
  WHERE to_tsvector('english', e.topic_title || ' ' || COALESCE(e.description, '') || ' ' || array_to_string(e.key_figures, ' ')) 
        @@ plainto_tsquery('english', p_query)
    AND e.is_active = TRUE
    AND (p_event_type IS NULL OR e.event_type = p_event_type)
    AND e.significance_level >= p_min_significance
  ORDER BY relevance DESC, e.significance_level DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get timeline connections for an event
CREATE OR REPLACE FUNCTION get_event_timeline(p_event_topic_id VARCHAR(255))
RETURNS TABLE (
  connected_event_topic_id VARCHAR(255),
  connected_event_title TEXT,
  connected_event_date DATE,
  relationship_type VARCHAR(50),
  time_gap_days INTEGER,
  explanation TEXT,
  direction TEXT -- 'before', 'after', 'concurrent'
) AS $$
BEGIN
  RETURN QUERY
  -- Events that happened before this one
  SELECT 
    etc.from_event_topic_id,
    e.topic_title,
    e.date::DATE,
    etc.relationship_type,
    etc.time_gap_days,
    etc.explanation,
    'before'::TEXT
  FROM event_timeline_connections etc
  JOIN events e ON e.topic_id = etc.from_event_topic_id
  WHERE etc.to_event_topic_id = p_event_topic_id
    AND e.is_active = TRUE
  
  UNION ALL
  
  -- Events that happened after this one
  SELECT 
    etc.to_event_topic_id,
    e.topic_title,
    e.date::DATE,
    etc.relationship_type,
    etc.time_gap_days,
    etc.explanation,
    'after'::TEXT
  FROM event_timeline_connections etc
  JOIN events e ON e.topic_id = etc.to_event_topic_id
  WHERE etc.from_event_topic_id = p_event_topic_id
    AND e.is_active = TRUE
  
  ORDER BY time_gap_days ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SAMPLE HISTORICAL EVENTS
-- =============================================================================

-- Insert some sample historical events to demonstrate the system
INSERT INTO events (
  topic_id, topic_title, description, date, why_this_matters,
  event_type, significance_level, key_figures, geographic_scope,
  impact_summary, tags, categories, quiz_potential, civic_relevance_score,
  source_type, sources, is_featured, ai_generated
) VALUES 
(
  'brown-v-board-1954',
  'Brown v. Board of Education Decision',
  'Supreme Court declares state laws establishing separate public schools for black and white students unconstitutional, overturning Plessy v. Ferguson',
  '1954-05-17',
  'This landmark decision began the legal dismantling of racial segregation in America and strengthened federal enforcement of civil rights, fundamentally changing the relationship between federal and state power in protecting individual rights.',
  'judicial',
  10,
  ARRAY['Earl Warren', 'Thurgood Marshall', 'Linda Brown'],
  'national',
  'Overturned the "separate but equal" doctrine, initiated nationwide school desegregation, and established precedent for federal intervention in civil rights',
  ARRAY['civil rights', 'education', 'supreme court', 'desegregation', 'equal protection'],
  ARRAY['Civil Rights', 'Education', 'Supreme Court'],
  '{"difficulty_levels": [2, 3, 4], "question_types": ["multiple_choice", "true_false", "short_answer"], "key_concepts": ["Equal protection clause", "Judicial review", "Federal vs state power"]}',
  95,
  'historical_curated',
  '{"primary_sources": [{"title": "Supreme Court Decision", "url": "https://www.supremecourt.gov/", "reliability": 10}]}',
  true,
  false
),
(
  'civil-rights-act-1964',
  'Civil Rights Act of 1964 Signed',
  'President Johnson signs comprehensive civil rights legislation outlawing discrimination based on race, color, religion, sex, or national origin',
  '1964-07-02',
  'The most comprehensive civil rights legislation since Reconstruction, fundamentally transforming American society by providing federal enforcement mechanisms against discrimination and expanding the scope of federal power to protect individual rights.',
  'legislative',
  10,
  ARRAY['Lyndon B. Johnson', 'Martin Luther King Jr.', 'Hubert Humphrey'],
  'national',
  'Outlawed segregation in public places, prohibited employment discrimination, and strengthened federal enforcement of voting rights',
  ARRAY['civil rights', 'discrimination', 'federal law', 'equal protection'],
  ARRAY['Civil Rights', 'Federal Legislation'],
  '{"difficulty_levels": [1, 2, 3], "question_types": ["multiple_choice", "true_false"], "key_concepts": ["Equal protection under law", "Federal enforcement powers", "Legislative process"]}',
  95,
  'historical_curated',
  '{"primary_sources": [{"title": "LBJ Presidential Library", "url": "https://www.lbjlibrary.org/", "reliability": 9}]}',
  true,
  false
);

-- Create timeline connection between these events
INSERT INTO event_timeline_connections (
  from_event_topic_id, to_event_topic_id, relationship_type, 
  time_gap_days, explanation
) VALUES (
  'brown-v-board-1954', 'civil-rights-act-1964', 'led_to',
  3702, -- ~10 years
  'The Brown decision provided legal precedent and momentum for comprehensive civil rights legislation'
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE topic_event_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_event_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_timeline_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_research_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_research_suggestions ENABLE ROW LEVEL SECURITY;

-- Basic policies for admin access (adjust based on your existing RLS structure)
CREATE POLICY "Admin access to event connections" ON topic_event_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin access to question event connections" ON question_event_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin access to timeline connections" ON event_timeline_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin access to AI research" ON ai_research_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin access to research suggestions" ON event_research_suggestions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

COMMIT; 