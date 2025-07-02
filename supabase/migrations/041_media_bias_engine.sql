-- =============================================================================
-- MEDIA BIAS ENGINE MIGRATION
-- =============================================================================
-- This migration creates a comprehensive media bias tracking system that learns
-- and evolves over time through user feedback and article analysis
-- =============================================================================

BEGIN;

-- =============================================================================
-- 0. ENSURE REQUIRED FUNCTIONS EXIST
-- =============================================================================

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. MEDIA ORGANIZATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS media_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  domain VARCHAR(255) UNIQUE,
  alternate_domains TEXT[] DEFAULT '{}',
  organization_type VARCHAR(50) NOT NULL DEFAULT 'news_outlet', -- news_outlet, independent_journalist, think_tank, government, advocacy_group
  founding_year INTEGER,
  ownership_structure TEXT,
  parent_organization_id UUID, -- Will add foreign key constraint after table creation
  funding_sources JSONB DEFAULT '{}', -- [{source: string, amount_range: string, verified: boolean}]
  
  -- Bias indicators
  editorial_stance TEXT,
  stated_values TEXT[],
  transparency_score NUMERIC(5,2), -- 0-100 (fixed from 3,2)
  credibility_rating NUMERIC(5,2), -- 0-100 (added missing field)
  fact_checking_methodology TEXT,
  corrections_policy TEXT,
  
  -- Metadata
  logo_url TEXT,
  description TEXT,
  headquarters_location TEXT,
  website_url TEXT,
  social_media_links JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add self-referencing foreign key after table creation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'media_organizations_parent_organization_id_fkey'
  ) THEN
    ALTER TABLE media_organizations 
    ADD CONSTRAINT media_organizations_parent_organization_id_fkey 
    FOREIGN KEY (parent_organization_id) REFERENCES media_organizations(id);
  END IF;
END $$;

-- =============================================================================
-- 2. BIAS DIMENSIONS TABLE (Configurable bias types)
-- =============================================================================

CREATE TABLE IF NOT EXISTS bias_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_name VARCHAR(100) NOT NULL UNIQUE,
  dimension_slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  scale_type VARCHAR(50) NOT NULL DEFAULT 'spectrum', -- spectrum, categorical, binary
  scale_values JSONB NOT NULL, -- For spectrum: {min: -100, max: 100, labels: {...}}, For categorical: {values: [...]}
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default bias dimensions
INSERT INTO bias_dimensions (dimension_name, dimension_slug, description, scale_type, scale_values) VALUES
('Political Lean', 'political-lean', 'Left-Right political spectrum', 'spectrum', 
  '{"min": -100, "max": 100, "labels": {"far-left": -100, "left": -66, "center-left": -33, "center": 0, "center-right": 33, "right": 66, "far-right": 100}}'::jsonb),
('Factual Accuracy', 'factual-accuracy', 'Commitment to factual reporting', 'spectrum',
  '{"min": 0, "max": 100, "labels": {"very-low": 0, "low": 25, "mixed": 50, "high": 75, "very-high": 100}}'::jsonb),
('Sensationalism', 'sensationalism', 'Tendency to sensationalize stories', 'spectrum',
  '{"min": 0, "max": 100, "labels": {"minimal": 0, "low": 25, "moderate": 50, "high": 75, "extreme": 100}}'::jsonb),
('Corporate Influence', 'corporate-influence', 'Level of corporate/advertiser influence', 'spectrum',
  '{"min": 0, "max": 100, "labels": {"independent": 0, "low": 25, "moderate": 50, "high": 75, "captured": 100}}'::jsonb),
('Establishment Bias', 'establishment-bias', 'Tendency to favor institutional perspectives', 'spectrum',
  '{"min": -100, "max": 100, "labels": {"anti-establishment": -100, "skeptical": -50, "neutral": 0, "supportive": 50, "pro-establishment": 100}}'::jsonb);

-- =============================================================================
-- 3. ORGANIZATION BIAS SCORES (Current calculated bias)
-- =============================================================================

CREATE TABLE IF NOT EXISTS organization_bias_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES media_organizations(id) ON DELETE CASCADE,
  dimension_id UUID NOT NULL REFERENCES bias_dimensions(id) ON DELETE CASCADE,
  
  -- Scores
  current_score NUMERIC(5,2) NOT NULL,
  confidence_level NUMERIC(3,2) NOT NULL DEFAULT 0.5, -- 0-1
  sample_size INTEGER NOT NULL DEFAULT 0,
  
  -- Evolution tracking
  score_history JSONB DEFAULT '[]', -- [{date, score, confidence, sample_size}]
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculation_method TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, dimension_id)
);

-- =============================================================================
-- 4. ARTICLE BIAS ANALYSIS (Individual article assessments)
-- =============================================================================

CREATE TABLE IF NOT EXISTS article_bias_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_metadata_id UUID, -- Will add foreign key only if source_metadata exists
  organization_id UUID REFERENCES media_organizations(id),
  
  -- Article details
  article_url TEXT NOT NULL,
  article_title TEXT,
  article_author TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Analysis results
  dimension_scores JSONB NOT NULL DEFAULT '{}', -- {dimension_id: {score, confidence, indicators}}
  detected_techniques JSONB DEFAULT '[]', -- [{technique, severity, examples}]
  factual_claims JSONB DEFAULT '[]', -- [{claim, verified, source}]
  emotional_language_score NUMERIC(5,2), -- 0-100 (fixed from 3,2)
  overall_bias_score NUMERIC(5,2), -- Added missing field
  factual_accuracy_score NUMERIC(5,2), -- Added missing field
  source_diversity_score NUMERIC(5,2), -- Added missing field
  emotional_manipulation_score NUMERIC(5,2), -- Added missing field
  
  -- AI analysis
  ai_analysis_version VARCHAR(50),
  ai_reasoning TEXT,
  ai_confidence NUMERIC(3,2),
  confidence_level NUMERIC(3,2) DEFAULT 0.5, -- Added missing field
  
  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analysis_method VARCHAR(50) DEFAULT 'automated', -- automated, manual, hybrid
  analyzer_id UUID, -- Could be user_id for manual reviews
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key to source_metadata if the table exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'source_metadata'
  ) THEN
    ALTER TABLE article_bias_analysis 
    ADD CONSTRAINT article_bias_analysis_source_metadata_id_fkey 
    FOREIGN KEY (source_metadata_id) REFERENCES source_metadata(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================================================
-- 5. BIAS FEEDBACK (User feedback on bias assessments)
-- =============================================================================

CREATE TABLE IF NOT EXISTS bias_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  guest_token TEXT,
  
  -- What they're giving feedback on
  feedback_type VARCHAR(50) NOT NULL, -- article, organization, dimension_score
  article_analysis_id UUID REFERENCES article_bias_analysis(id),
  organization_id UUID REFERENCES media_organizations(id),
  
  -- Feedback content
  dimension_id UUID REFERENCES bias_dimensions(id),
  suggested_score NUMERIC(5,2),
  agrees_with_assessment BOOLEAN,
  feedback_text TEXT,
  evidence_urls TEXT[],
  
  -- User expertise (optional)
  user_expertise_level VARCHAR(50), -- novice, intermediate, expert, professional
  user_expertise_areas TEXT[],
  
  -- Moderation
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verification_notes TEXT,
  is_spam BOOLEAN DEFAULT false,
  
  -- Analytics
  helpfulness_score INTEGER DEFAULT 0, -- Upvotes from other users
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 6. BIAS LEARNING EVENTS (Track how the system learns)
-- =============================================================================

CREATE TABLE IF NOT EXISTS bias_learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL, -- feedback_incorporated, threshold_adjusted, dimension_recalibrated
  
  -- What changed
  organization_id UUID REFERENCES media_organizations(id),
  dimension_id UUID REFERENCES bias_dimensions(id),
  old_score NUMERIC(5,2),
  new_score NUMERIC(5,2),
  confidence_change NUMERIC(3,2),
  
  -- Why it changed
  trigger_type VARCHAR(50), -- user_feedback, article_analysis, manual_override, algorithm_update
  trigger_id UUID, -- Reference to feedback, article, etc.
  learning_algorithm_version VARCHAR(50),
  
  -- Learning metadata
  feedback_count INTEGER,
  article_count INTEGER,
  consensus_strength NUMERIC(3,2), -- How much agreement there was
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 7. BIAS DETECTION PATTERNS (Reusable patterns for bias detection)
-- =============================================================================

CREATE TABLE IF NOT EXISTS bias_detection_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name VARCHAR(255) NOT NULL,
  pattern_type VARCHAR(50) NOT NULL, -- language, framing, source_selection, image_selection
  dimension_id UUID REFERENCES bias_dimensions(id),
  
  -- Pattern definition
  pattern_regex TEXT,
  keywords TEXT[],
  phrase_patterns JSONB, -- Complex pattern matching rules
  severity_weight NUMERIC(3,2) DEFAULT 1.0,
  
  -- Effectiveness tracking
  times_detected INTEGER DEFAULT 0,
  false_positive_rate NUMERIC(3,2), -- This is OK as it's 0-1 range
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 8. SOURCE CREDIBILITY INDICATORS
-- =============================================================================

CREATE TABLE IF NOT EXISTS source_credibility_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES media_organizations(id) ON DELETE CASCADE,
  
  -- Credibility factors
  pulitzer_prizes INTEGER DEFAULT 0,
  major_corrections_count INTEGER DEFAULT 0,
  fabrication_scandals_count INTEGER DEFAULT 0,
  transparency_report_url TEXT,
  press_freedom_score NUMERIC(5,2), -- 0-100 (fixed from 3,2)
  
  -- Professional affiliations
  press_associations TEXT[],
  fact_checking_partnerships TEXT[],
  
  -- Track record
  verified_scoops_count INTEGER DEFAULT 0,
  major_misreporting_incidents JSONB DEFAULT '[]',
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_media_organizations_domain ON media_organizations(domain);
CREATE INDEX idx_organization_bias_scores_org ON organization_bias_scores(organization_id);
CREATE INDEX idx_organization_bias_scores_dimension ON organization_bias_scores(dimension_id);
CREATE INDEX idx_article_bias_analysis_source ON article_bias_analysis(source_metadata_id);
CREATE INDEX idx_article_bias_analysis_org ON article_bias_analysis(organization_id);
CREATE INDEX idx_article_bias_analysis_date ON article_bias_analysis(published_at);
CREATE INDEX idx_bias_feedback_user ON bias_feedback(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_bias_feedback_article ON bias_feedback(article_analysis_id) WHERE article_analysis_id IS NOT NULL;
CREATE INDEX idx_bias_feedback_verified ON bias_feedback(is_verified) WHERE is_verified = true;
CREATE INDEX idx_bias_learning_events_org ON bias_learning_events(organization_id);
CREATE INDEX idx_bias_learning_events_date ON bias_learning_events(created_at);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_media_organizations_updated_at
  BEFORE UPDATE ON media_organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_bias_scores_updated_at
  BEFORE UPDATE ON organization_bias_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bias_feedback_updated_at
  BEFORE UPDATE ON bias_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to get or create media organization from domain
CREATE OR REPLACE FUNCTION get_or_create_media_organization(
  p_domain TEXT,
  p_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_organization_id UUID;
  v_clean_domain TEXT;
BEGIN
  -- Clean domain (remove www., https://, etc.)
  v_clean_domain := LOWER(REGEXP_REPLACE(p_domain, '^(https?://)?(www\.)?', ''));
  
  -- Try to find existing organization
  SELECT id INTO v_organization_id
  FROM media_organizations
  WHERE domain = v_clean_domain
     OR v_clean_domain = ANY(alternate_domains);
  
  -- Create if not found
  IF v_organization_id IS NULL THEN
    INSERT INTO media_organizations (name, domain)
    VALUES (COALESCE(p_name, v_clean_domain), v_clean_domain)
    RETURNING id INTO v_organization_id;
  END IF;
  
  RETURN v_organization_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate bias consensus from feedback
CREATE OR REPLACE FUNCTION calculate_bias_consensus(
  p_organization_id UUID,
  p_dimension_id UUID,
  p_time_window INTERVAL DEFAULT '30 days'
)
RETURNS TABLE(
  consensus_score NUMERIC,
  confidence_level NUMERIC,
  sample_size INTEGER,
  agreement_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH feedback_stats AS (
    SELECT 
      AVG(suggested_score) AS avg_score,
      STDDEV(suggested_score) AS score_stddev,
      COUNT(*) AS total_feedback,
      COUNT(DISTINCT COALESCE(user_id::TEXT, guest_token)) AS unique_contributors
    FROM bias_feedback
    WHERE organization_id = p_organization_id
      AND dimension_id = p_dimension_id
      AND created_at >= NOW() - p_time_window
      AND NOT is_spam
      AND (is_verified OR helpfulness_score > 0)
  )
  SELECT 
    ROUND(avg_score::NUMERIC, 2) AS consensus_score,
    CASE 
      WHEN total_feedback < 5 THEN 0.1
      WHEN score_stddev > 30 THEN 0.3
      WHEN score_stddev > 20 THEN 0.5
      WHEN score_stddev > 10 THEN 0.7
      ELSE 0.9
    END AS confidence_level,
    total_feedback::INTEGER AS sample_size,
    CASE
      WHEN total_feedback = 0 THEN 0
      ELSE ROUND((1 - (score_stddev / 50))::NUMERIC, 2)
    END AS agreement_rate
  FROM feedback_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to update organization bias scores based on article analysis
CREATE OR REPLACE FUNCTION update_organization_bias_from_articles(
  p_organization_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_dimension RECORD;
  v_new_score NUMERIC;
  v_confidence NUMERIC;
  v_sample_size INTEGER;
BEGIN
  -- For each dimension
  FOR v_dimension IN SELECT id FROM bias_dimensions WHERE is_active LOOP
    -- Calculate weighted average from recent articles
    WITH article_scores AS (
      SELECT 
        (dimension_scores->v_dimension.id->>'score')::NUMERIC AS score,
        (dimension_scores->v_dimension.id->>'confidence')::NUMERIC AS confidence,
        analyzed_at
      FROM article_bias_analysis
      WHERE organization_id = p_organization_id
        AND dimension_scores ? v_dimension.id::TEXT
        AND analyzed_at >= NOW() - INTERVAL '90 days'
    ),
    weighted_calc AS (
      SELECT 
        SUM(score * confidence * (1 - EXTRACT(EPOCH FROM (NOW() - analyzed_at)) / (90*24*60*60))) / 
        SUM(confidence * (1 - EXTRACT(EPOCH FROM (NOW() - analyzed_at)) / (90*24*60*60))) AS weighted_avg,
        AVG(confidence) AS avg_confidence,
        COUNT(*) AS article_count
      FROM article_scores
      WHERE confidence > 0
    )
    SELECT 
      COALESCE(weighted_avg, 0),
      COALESCE(avg_confidence, 0.1),
      COALESCE(article_count, 0)
    INTO v_new_score, v_confidence, v_sample_size
    FROM weighted_calc;
    
    -- Update or insert the score
    INSERT INTO organization_bias_scores (
      organization_id, 
      dimension_id, 
      current_score, 
      confidence_level, 
      sample_size,
      calculation_method
    ) VALUES (
      p_organization_id,
      v_dimension.id,
      v_new_score,
      LEAST(v_confidence * (1 - EXP(-v_sample_size::NUMERIC / 10)), 0.95),
      v_sample_size,
      'article_weighted_average'
    )
    ON CONFLICT (organization_id, dimension_id) DO UPDATE
    SET 
      current_score = EXCLUDED.current_score,
      confidence_level = EXCLUDED.confidence_level,
      sample_size = EXCLUDED.sample_size,
      last_calculated_at = NOW(),
      score_history = 
        CASE 
          WHEN CARDINALITY(organization_bias_scores.score_history::JSONB[]) >= 100
          THEN organization_bias_scores.score_history::JSONB || 
               jsonb_build_object(
                 'date', NOW(),
                 'score', EXCLUDED.current_score,
                 'confidence', EXCLUDED.confidence_level,
                 'sample_size', EXCLUDED.sample_size
               ) - 0  -- Remove first element if array is too long
          ELSE organization_bias_scores.score_history::JSONB || 
               jsonb_build_object(
                 'date', NOW(),
                 'score', EXCLUDED.current_score,
                 'confidence', EXCLUDED.confidence_level,
                 'sample_size', EXCLUDED.sample_size
               )
        END;
    
    -- Record learning event if score changed significantly
    IF v_sample_size > 0 THEN
      INSERT INTO bias_learning_events (
        event_type,
        organization_id,
        dimension_id,
        old_score,
        new_score,
        confidence_change,
        trigger_type,
        learning_algorithm_version,
        article_count
      )
      SELECT 
        'dimension_recalibrated',
        p_organization_id,
        v_dimension.id,
        obs.current_score,
        v_new_score,
        v_confidence - obs.confidence_level,
        'article_analysis',
        'weighted_time_decay_v1',
        v_sample_size
      FROM organization_bias_scores obs
      WHERE obs.organization_id = p_organization_id
        AND obs.dimension_id = v_dimension.id
        AND ABS(obs.current_score - v_new_score) > 5;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE media_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bias_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_bias_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_bias_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE bias_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE bias_learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bias_detection_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_credibility_indicators ENABLE ROW LEVEL SECURITY;

-- Public read access to bias data
CREATE POLICY "Public read access to media organizations" ON media_organizations
  FOR SELECT USING (true);

CREATE POLICY "Public read access to bias dimensions" ON bias_dimensions
  FOR SELECT USING (true);

CREATE POLICY "Public read access to organization bias scores" ON organization_bias_scores
  FOR SELECT USING (true);

CREATE POLICY "Public read access to article analysis" ON article_bias_analysis
  FOR SELECT USING (true);

CREATE POLICY "Public read access to verified feedback" ON bias_feedback
  FOR SELECT USING (is_verified = true OR user_id = auth.uid());

CREATE POLICY "Public read access to learning events" ON bias_learning_events
  FOR SELECT USING (true);

-- User feedback policies
CREATE POLICY "Users can create feedback" ON bias_feedback
  FOR INSERT WITH CHECK (
    (user_id = auth.uid() OR (user_id IS NULL AND guest_token IS NOT NULL))
  );

CREATE POLICY "Users can update own feedback" ON bias_feedback
  FOR UPDATE USING (user_id = auth.uid());

-- Admin policies 
-- Only create admin policy if profiles table exists and has is_admin column
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_admin'
  ) THEN
    CREATE POLICY "Admins can manage media organizations" ON media_organizations
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND is_admin = true
        )
      );
  ELSE
    -- Create a basic policy that allows authenticated users to manage (can be updated later)
    CREATE POLICY "Authenticated users can manage media organizations" ON media_organizations
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- =============================================================================
-- SEED SOME INITIAL ORGANIZATIONS (Only if they don't exist)
-- =============================================================================

DO $$
BEGIN
  -- Only insert if the table is empty (first time setup)
  IF NOT EXISTS (SELECT 1 FROM media_organizations LIMIT 1) THEN
    INSERT INTO media_organizations (name, domain, organization_type, transparency_score) VALUES
    ('Reuters', 'reuters.com', 'news_outlet', 95),
    ('Associated Press', 'apnews.com', 'news_outlet', 95),
    ('NPR', 'npr.org', 'news_outlet', 90),
    ('Politico', 'politico.com', 'news_outlet', 85),
    ('The Hill', 'thehill.com', 'news_outlet', 80),
    ('CNN', 'cnn.com', 'news_outlet', 75),
    ('Fox News', 'foxnews.com', 'news_outlet', 70),
    ('MSNBC', 'msnbc.com', 'news_outlet', 70),
    ('The New York Times', 'nytimes.com', 'news_outlet', 85),
    ('The Washington Post', 'washingtonpost.com', 'news_outlet', 85),
    ('BBC News', 'bbc.com', 'news_outlet', 90),
    ('The Guardian', 'theguardian.com', 'news_outlet', 85),
    ('Rolling Stone', 'rollingstone.com', 'news_outlet', 75),
    ('Axios', 'axios.com', 'news_outlet', 80),
    ('NBC News', 'nbcnews.com', 'news_outlet', 80),
    ('USA Today', 'usatoday.com', 'news_outlet', 80)
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON bias_feedback TO anon;
GRANT INSERT ON bias_feedback TO authenticated;
GRANT UPDATE (helpfulness_score) ON bias_feedback TO authenticated;

GRANT EXECUTE ON FUNCTION get_or_create_media_organization TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_bias_consensus TO anon;
GRANT EXECUTE ON FUNCTION calculate_bias_consensus TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE media_organizations IS 'News organizations and independent journalists tracked for bias analysis';
COMMENT ON TABLE bias_dimensions IS 'Different types of bias that can be measured (political, factual accuracy, etc.)';
COMMENT ON TABLE organization_bias_scores IS 'Current calculated bias scores for organizations across different dimensions';
COMMENT ON TABLE article_bias_analysis IS 'Individual article bias assessments that feed into organization scores';
COMMENT ON TABLE bias_feedback IS 'User feedback on bias assessments to improve the system';
COMMENT ON TABLE bias_learning_events IS 'Track how the bias detection system learns and evolves over time';
COMMENT ON TABLE bias_detection_patterns IS 'Reusable patterns for detecting different types of bias in content';
COMMENT ON TABLE source_credibility_indicators IS 'Track record and credibility factors for media organizations';

COMMIT; 