-- Assessment Framework Schema

-- Indicators table
CREATE TABLE indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4')),
  description TEXT NOT NULL,
  evidence_threshold TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('NOT_YET', 'PARTIAL', 'TRIGGERED')),
  current_status TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indicator sources table
CREATE TABLE indicator_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID REFERENCES indicators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('news', 'academic', 'government', 'legal', 'other')),
  publication_date TIMESTAMP WITH TIME ZONE NOT NULL,
  relevance_score INTEGER CHECK (relevance_score BETWEEN 0 AND 100),
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Topic-Indicator mappings table
CREATE TABLE topic_indicator_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  relevance_score INTEGER CHECK (relevance_score BETWEEN 0 AND 100),
  evidence_strength TEXT CHECK (evidence_strength IN ('strong', 'moderate', 'weak')),
  notes TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(topic_id, indicator_id)
);

-- Assessment frameworks table
CREATE TABLE assessment_frameworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  version TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{
    "totalIndicators": 0,
    "triggeredCount": 0,
    "partialCount": 0,
    "notYetCount": 0,
    "overallThreatLevel": 0
  }'::jsonb
);

-- Indicator updates history
CREATE TABLE indicator_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  old_status TEXT NOT NULL CHECK (old_status IN ('NOT_YET', 'PARTIAL', 'TRIGGERED')),
  new_status TEXT NOT NULL CHECK (new_status IN ('NOT_YET', 'PARTIAL', 'TRIGGERED')),
  reason TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_indicators_status ON indicators(status);
CREATE INDEX idx_indicator_sources_indicator_id ON indicator_sources(indicator_id);
CREATE INDEX idx_topic_indicator_mappings_topic_id ON topic_indicator_mappings(topic_id);
CREATE INDEX idx_topic_indicator_mappings_indicator_id ON topic_indicator_mappings(indicator_id);
CREATE INDEX idx_indicator_updates_indicator_id ON indicator_updates(indicator_id);

-- Functions for maintaining metadata
CREATE OR REPLACE FUNCTION update_framework_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE assessment_frameworks
  SET metadata = jsonb_set(
    metadata,
    '{totalIndicators}',
    (SELECT COUNT(*)::text::jsonb FROM indicators)
  );
  
  UPDATE assessment_frameworks
  SET metadata = jsonb_set(
    metadata,
    '{triggeredCount}',
    (SELECT COUNT(*)::text::jsonb FROM indicators WHERE status = 'TRIGGERED')
  );
  
  UPDATE assessment_frameworks
  SET metadata = jsonb_set(
    metadata,
    '{partialCount}',
    (SELECT COUNT(*)::text::jsonb FROM indicators WHERE status = 'PARTIAL')
  );
  
  UPDATE assessment_frameworks
  SET metadata = jsonb_set(
    metadata,
    '{notYetCount}',
    (SELECT COUNT(*)::text::jsonb FROM indicators WHERE status = 'NOT_YET')
  );
  
  -- Calculate overall threat level (example formula)
  UPDATE assessment_frameworks
  SET metadata = jsonb_set(
    metadata,
    '{overallThreatLevel}',
    (
      SELECT (
        (COUNT(*) FILTER (WHERE status = 'TRIGGERED') * 100 +
         COUNT(*) FILTER (WHERE status = 'PARTIAL') * 50) / 
        COUNT(*)::float
      )::text::jsonb
      FROM indicators
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for maintaining metadata
CREATE TRIGGER trigger_update_framework_metadata
AFTER INSERT OR UPDATE OR DELETE ON indicators
FOR EACH STATEMENT
EXECUTE FUNCTION update_framework_metadata(); 