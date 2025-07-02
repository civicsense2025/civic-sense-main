-- Events System Schema for CivicSense
-- Manages historical events, AI research, and content connections

-- ============================================================================
-- HISTORICAL EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS historical_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic event information
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'political', 'sociopolitical', 'cultural', 'economic', 
    'military', 'legislative', 'judicial', 'constitutional'
  )),
  
  -- Significance and impact
  significance_level INTEGER CHECK (significance_level BETWEEN 1 AND 10) DEFAULT 5,
  impact_summary TEXT,
  long_term_consequences TEXT,
  
  -- People and entities involved
  key_figures TEXT[] DEFAULT '{}',
  related_organizations TEXT[] DEFAULT '{}',
  geographic_scope VARCHAR(100), -- 'local', 'state', 'national', 'international'
  
  -- Educational context
  related_topics TEXT[] DEFAULT '{}',
  civic_education_relevance JSONB DEFAULT '{}', -- voting_rights, government_structure, etc.
  quiz_potential JSONB DEFAULT '{}', -- difficulty_levels, question_types, key_concepts
  
  -- Sources and verification
  sources JSONB DEFAULT '[]', -- Array of source objects with title, url, type, reliability_score
  fact_check_status VARCHAR(50) DEFAULT 'pending' CHECK (fact_check_status IN (
    'pending', 'verified', 'disputed', 'debunked'
  )),
  reliability_score INTEGER CHECK (reliability_score BETWEEN 1 AND 10) DEFAULT 5,
  
  -- Content organization
  tags TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  
  -- Status and visibility
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  content_warnings TEXT[], -- sensitive content flags
  
  -- AI and research metadata
  ai_generated BOOLEAN DEFAULT FALSE,
  research_quality_score INTEGER CHECK (research_quality_score BETWEEN 1 AND 10),
  last_fact_checked TIMESTAMP WITH TIME ZONE,
  
  -- Standard timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- AI RESEARCH RESULTS
-- ============================================================================

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

-- ============================================================================
-- CONTENT LINKING SYSTEM
-- ============================================================================

-- Links between historical events and question topics
CREATE TABLE IF NOT EXISTS topic_event_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  topic_id VARCHAR(100) NOT NULL, -- References question_topics.topic_id
  event_id UUID NOT NULL REFERENCES historical_events(id) ON DELETE CASCADE,
  
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
  
  UNIQUE(topic_id, event_id, connection_type)
);

-- Links between historical events and individual questions
CREATE TABLE IF NOT EXISTS question_event_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  question_id UUID NOT NULL, -- References questions.id
  event_id UUID NOT NULL REFERENCES historical_events(id) ON DELETE CASCADE,
  
  -- Connection context
  usage_type VARCHAR(50) NOT NULL CHECK (usage_type IN (
    'question_context', 'answer_explanation', 'hint', 
    'source_reference', 'related_reading'
  )),
  display_text TEXT, -- How this connection should be presented
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(question_id, event_id, usage_type)
);

-- Event timeline connections (events that are related chronologically)
CREATE TABLE IF NOT EXISTS event_timeline_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  from_event_id UUID NOT NULL REFERENCES historical_events(id) ON DELETE CASCADE,
  to_event_id UUID NOT NULL REFERENCES historical_events(id) ON DELETE CASCADE,
  
  relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN (
    'led_to', 'caused_by', 'concurrent_with', 'reaction_to', 
    'precedent_for', 'continuation_of'
  )),
  
  time_gap_days INTEGER, -- Number of days between events
  explanation TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(from_event_id, to_event_id, relationship_type),
  CHECK (from_event_id != to_event_id)
);

-- ============================================================================
-- EVENT RESEARCH SUGGESTIONS
-- ============================================================================

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
  resulting_event_id UUID REFERENCES historical_events(id),
  
  -- Admin actions
  admin_notes TEXT,
  rejected_reason TEXT,
  
  -- Timestamps
  suggested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- BULK OPERATIONS TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN (
    'import', 'export', 'batch_research', 'mass_update', 'cleanup'
  )),
  
  -- Operation details
  parameters JSONB DEFAULT '{}',
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  
  -- Status and results
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'cancelled'
  )),
  error_log TEXT[],
  success_log TEXT[],
  
  -- File references (for import/export)
  input_file_url TEXT,
  output_file_url TEXT,
  
  -- Timestamps and attribution
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  initiated_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Historical events indexes
CREATE INDEX IF NOT EXISTS idx_historical_events_date ON historical_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_historical_events_type ON historical_events(event_type);
CREATE INDEX IF NOT EXISTS idx_historical_events_significance ON historical_events(significance_level DESC);
CREATE INDEX IF NOT EXISTS idx_historical_events_featured ON historical_events(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_historical_events_tags ON historical_events USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_historical_events_topics ON historical_events USING GIN(related_topics);
CREATE INDEX IF NOT EXISTS idx_historical_events_search ON historical_events USING GIN(to_tsvector('english', title || ' ' || description));

-- AI research results indexes
CREATE INDEX IF NOT EXISTS idx_ai_research_timestamp ON ai_research_results(research_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_research_status ON ai_research_results(status);
CREATE INDEX IF NOT EXISTS idx_ai_research_researcher ON ai_research_results(researcher_id);

-- Content linking indexes
CREATE INDEX IF NOT EXISTS idx_topic_event_connections_topic ON topic_event_connections(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_event_connections_event ON topic_event_connections(event_id);
CREATE INDEX IF NOT EXISTS idx_question_event_connections_question ON question_event_connections(question_id);
CREATE INDEX IF NOT EXISTS idx_question_event_connections_event ON question_event_connections(event_id);

-- Timeline connections indexes
CREATE INDEX IF NOT EXISTS idx_timeline_from_event ON event_timeline_connections(from_event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_to_event ON event_timeline_connections(to_event_id);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_historical_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER historical_events_updated_at
  BEFORE UPDATE ON historical_events
  FOR EACH ROW
  EXECUTE FUNCTION update_historical_events_updated_at();

-- ============================================================================
-- FUNCTIONS FOR DATA OPERATIONS
-- ============================================================================

-- Function to get events related to a topic
CREATE OR REPLACE FUNCTION get_topic_related_events(p_topic_id TEXT)
RETURNS TABLE (
  event_id UUID,
  title TEXT,
  event_date DATE,
  connection_type TEXT,
  connection_strength INTEGER,
  context_notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    he.id,
    he.title,
    he.event_date,
    tec.connection_type,
    tec.connection_strength,
    tec.context_notes
  FROM historical_events he
  JOIN topic_event_connections tec ON he.id = tec.event_id
  WHERE tec.topic_id = p_topic_id
    AND he.is_published = TRUE
  ORDER BY tec.display_priority DESC, he.significance_level DESC, he.event_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get events for a time period
CREATE OR REPLACE FUNCTION get_events_in_period(
  p_start_date DATE,
  p_end_date DATE,
  p_min_significance INTEGER DEFAULT 1
)
RETURNS TABLE (
  event_id UUID,
  title TEXT,
  event_date DATE,
  event_type TEXT,
  significance_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    he.id,
    he.title,
    he.event_date,
    he.event_type,
    he.significance_level
  FROM historical_events he
  WHERE he.event_date BETWEEN p_start_date AND p_end_date
    AND he.significance_level >= p_min_significance
    AND he.is_published = TRUE
  ORDER BY he.event_date DESC, he.significance_level DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to search events by text
CREATE OR REPLACE FUNCTION search_events(p_query TEXT, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  event_id UUID,
  title TEXT,
  description TEXT,
  event_date DATE,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    he.id,
    he.title,
    he.description,
    he.event_date,
    ts_rank(to_tsvector('english', he.title || ' ' || he.description), plainto_tsquery('english', p_query)) as relevance
  FROM historical_events he
  WHERE to_tsvector('english', he.title || ' ' || he.description) @@ plainto_tsquery('english', p_query)
    AND he.is_published = TRUE
  ORDER BY relevance DESC, he.significance_level DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert some sample historical events
INSERT INTO historical_events (
  title, description, event_date, event_type, significance_level,
  key_figures, related_topics, impact_summary, sources, tags,
  civic_education_relevance, quiz_potential, is_featured
) VALUES 
(
  'Brown v. Board of Education Decision',
  'Supreme Court declares state laws establishing separate public schools for black and white students unconstitutional, overturning Plessy v. Ferguson',
  '1954-05-17',
  'judicial',
  10,
  ARRAY['Earl Warren', 'Thurgood Marshall', 'Linda Brown'],
  ARRAY['Civil Rights', 'Education', 'Supreme Court', 'Equal Protection'],
  'Landmark decision that began the legal dismantling of racial segregation in America and strengthened federal enforcement of civil rights',
  '[{"title": "National Archives", "url": "https://www.archives.gov/milestone-documents/brown-v-board-of-education", "type": "primary", "reliability_score": 10}]',
  ARRAY['civil rights', 'education', 'supreme court', 'desegregation', 'equal protection'],
  '{"voting_rights": false, "government_structure": true, "civil_liberties": true, "checks_and_balances": true, "democratic_processes": true, "citizen_engagement": true}',
  '{"difficulty_levels": [2, 3, 4], "question_types": ["multiple_choice", "true_false", "short_answer"], "key_concepts": ["Equal protection clause", "Judicial review", "Federal vs state power", "Civil rights enforcement"]}',
  true
),
(
  'Watergate Scandal Begins',
  'Break-in at Democratic National Committee headquarters leads to investigation that ultimately forces President Nixon to resign',
  '1972-06-17',
  'political',
  9,
  ARRAY['Richard Nixon', 'Bob Woodward', 'Carl Bernstein', 'John Dean'],
  ARRAY['Executive Power', 'Presidential Impeachment', 'Investigative Journalism', 'Constitutional Crisis'],
  'Demonstrated that no one, including the President, is above the law and strengthened Congressional oversight powers',
  '[{"title": "Washington Post Archives", "url": "https://www.washingtonpost.com/politics/watergate/", "type": "primary", "reliability_score": 9}]',
  ARRAY['watergate', 'nixon', 'impeachment', 'scandal', 'executive power'],
  '{"voting_rights": false, "government_structure": true, "civil_liberties": true, "checks_and_balances": true, "democratic_processes": true, "citizen_engagement": true}',
  '{"difficulty_levels": [2, 3, 4], "question_types": ["multiple_choice", "short_answer"], "key_concepts": ["Executive privilege", "Impeachment process", "Separation of powers", "Freedom of the press"]}',
  true
),
(
  'Civil Rights Act of 1964 Signed',
  'President Johnson signs comprehensive civil rights legislation outlawing discrimination based on race, color, religion, sex, or national origin',
  '1964-07-02',
  'legislative',
  10,
  ARRAY['Lyndon B. Johnson', 'Martin Luther King Jr.', 'Hubert Humphrey'],
  ARRAY['Civil Rights Movement', 'Federal Legislation', 'Equal Protection'],
  'Most comprehensive civil rights legislation since Reconstruction, fundamentally transforming American society and law',
  '[{"title": "LBJ Presidential Library", "url": "https://www.lbjlibrary.org/civil-rights-act-1964", "type": "secondary", "reliability_score": 9}]',
  ARRAY['civil rights', 'discrimination', 'federal law', 'equal protection'],
  '{"voting_rights": true, "government_structure": true, "civil_liberties": true, "checks_and_balances": true, "democratic_processes": true, "citizen_engagement": true}',
  '{"difficulty_levels": [1, 2, 3], "question_types": ["multiple_choice", "true_false"], "key_concepts": ["Equal protection under law", "Federal enforcement powers", "Legislative process"]}',
  true
);

-- Insert sample research suggestions
INSERT INTO event_research_suggestions (
  suggested_title, research_query, potential_date, significance_estimate,
  ai_context, confidence_score
) VALUES 
(
  'Pentagon Papers Publication',
  'Pentagon Papers leak and Supreme Court case New York Times v. United States',
  '1971-06-13',
  8,
  'Major press freedom case involving classified documents about Vietnam War, important for understanding First Amendment protections',
  0.92
),
(
  'Miranda v. Arizona Decision',
  'Supreme Court decision establishing Miranda rights for criminal suspects',
  '1966-06-13',
  8,
  'Landmark criminal justice decision that established procedural safeguards for suspects, important for understanding due process',
  0.95
);

-- Grant necessary permissions (adjust as needed for your RLS setup)
-- ALTER TABLE historical_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_research_results ENABLE ROW LEVEL SECURITY; 