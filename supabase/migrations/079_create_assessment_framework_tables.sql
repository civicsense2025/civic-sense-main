-- =========================================================
-- GOVERNMENT ASSESSMENT FRAMEWORK - SUPABASE SCHEMA
-- Flexible system for measuring democratic health, authoritarianism, 
-- corruption, and other government/power structure indicators
-- =========================================================

BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- CORE FRAMEWORK TABLES
-- =========================================================

-- Define different types of assessment frameworks
CREATE TABLE IF NOT EXISTS assessment_frameworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_name VARCHAR(100) NOT NULL UNIQUE,
    framework_slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    framework_type VARCHAR(50) NOT NULL, -- 'democracy_health', 'authoritarianism', 'corruption', etc.
    scoring_system JSONB NOT NULL, -- {"type": "binary", "scale": "0-20"} or {"type": "scale", "min": 0, "max": 100}
    methodology_url VARCHAR(500),
    academic_sources JSONB, -- Array of academic sources
    created_by VARCHAR(100),
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Geographic/political entities being assessed
CREATE TABLE IF NOT EXISTS assessed_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_name VARCHAR(100) NOT NULL,
    entity_slug VARCHAR(50) NOT NULL UNIQUE,
    entity_type VARCHAR(50) NOT NULL, -- 'country', 'state', 'region', 'organization'
    iso_code VARCHAR(10), -- For countries/states
    parent_entity_id UUID REFERENCES assessed_entities(id),
    metadata JSONB, -- Population, capital, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories for grouping indicators
CREATE TABLE IF NOT EXISTS indicator_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_id UUID NOT NULL REFERENCES assessment_frameworks(id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL,
    category_slug VARCHAR(50) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 1,
    severity_level INTEGER, -- 1-4 for levels like "Early Warning", "Crisis", etc.
    color_code VARCHAR(7), -- Hex color for UI
    icon VARCHAR(50), -- Icon identifier
    threshold_description TEXT, -- What this level means
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_category_per_framework UNIQUE(framework_id, category_slug)
);

-- Individual indicators within frameworks
CREATE TABLE IF NOT EXISTS indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_id UUID NOT NULL REFERENCES assessment_frameworks(id) ON DELETE CASCADE,
    category_id UUID REFERENCES indicator_categories(id) ON DELETE SET NULL,
    indicator_name VARCHAR(200) NOT NULL,
    indicator_slug VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    evidence_threshold TEXT, -- What constitutes triggering this indicator
    measurement_type VARCHAR(50) NOT NULL, -- 'binary', 'scale', 'percentage', 'count'
    measurement_config JSONB, -- {"min": 0, "max": 10, "step": 0.1} or {"options": ["triggered", "partial", "not_triggered"]}
    weight DECIMAL(5,3) DEFAULT 1.0, -- Relative importance in overall score
    display_order INTEGER DEFAULT 1,
    historical_context TEXT, -- Examples from other countries/times
    civic_education_angle TEXT, -- How this connects to civic learning
    status VARCHAR(20) DEFAULT 'NOT_YET', -- Current status
    current_status TEXT, -- Detailed current status explanation
    last_updated TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_indicator_per_framework UNIQUE(framework_id, indicator_slug)
);

-- =========================================================
-- ASSESSMENT DATA TABLES
-- =========================================================

-- Specific assessment instances (snapshots in time)
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_id UUID NOT NULL REFERENCES assessment_frameworks(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES assessed_entities(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    assessment_period VARCHAR(50), -- 'Q1-2025', 'monthly', 'annual', etc.
    overall_score DECIMAL(8,3), -- Calculated score based on indicators
    overall_status VARCHAR(50), -- 'healthy', 'warning', 'crisis', 'authoritarian', etc.
    methodology_notes TEXT,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    assessor_name VARCHAR(100),
    review_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'reviewed', 'published'
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_assessment_per_period UNIQUE(framework_id, entity_id, assessment_date)
);

-- Individual indicator assessments within an overall assessment
CREATE TABLE IF NOT EXISTS indicator_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    measured_value JSONB NOT NULL, -- Flexible storage: true/false, 0.8, "triggered", etc.
    status VARCHAR(50), -- 'triggered', 'partial', 'not_triggered', 'improving', 'worsening'
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    change_from_previous JSONB, -- Comparison to last assessment
    analyst_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_indicator_per_assessment UNIQUE(assessment_id, indicator_id)
);

-- Evidence supporting indicator assessments
CREATE TABLE IF NOT EXISTS assessment_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator_assessment_id UUID NOT NULL REFERENCES indicator_assessments(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL, -- 'news_article', 'government_document', 'academic_study', 'legal_case'
    source_title VARCHAR(300) NOT NULL,
    source_url VARCHAR(1000),
    source_date DATE,
    source_organization VARCHAR(200),
    credibility_score INTEGER CHECK (credibility_score BETWEEN 1 AND 5),
    excerpt TEXT,
    relevance_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Connect indicators to CivicSense content
CREATE TABLE IF NOT EXISTS indicator_content_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- 'question_topic', 'quiz_question', 'article', 'video'
    content_id VARCHAR(100) NOT NULL, -- Links to existing content tables
    relationship_type VARCHAR(50), -- 'example', 'explanation', 'case_study', 'historical_parallel'
    relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_content_link UNIQUE(indicator_id, content_type, content_id)
);

-- Track civic actions related to indicators
CREATE TABLE IF NOT EXISTS indicator_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'contact_representative', 'attend_meeting', 'vote', 'protest', 'legal_challenge'
    action_title VARCHAR(200) NOT NULL,
    action_description TEXT,
    target_audience VARCHAR(100), -- 'general_public', 'voters', 'activists', 'legal_experts'
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    time_commitment VARCHAR(50), -- '5 minutes', '1 hour', 'ongoing'
    effectiveness_notes TEXT,
    resources_needed TEXT,
    success_examples TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================================
-- INDEXES FOR PERFORMANCE
-- =========================================================

-- Framework and entity lookups
CREATE INDEX IF NOT EXISTS idx_frameworks_active ON assessment_frameworks(is_active, framework_type);
CREATE INDEX IF NOT EXISTS idx_entities_active ON assessed_entities(is_active, entity_type);

-- Assessment queries
CREATE INDEX IF NOT EXISTS idx_assessments_framework_entity ON assessments(framework_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON assessments(assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(review_status, overall_status);

-- Indicator lookups
CREATE INDEX IF NOT EXISTS idx_indicators_framework ON indicators(framework_id, is_active);
CREATE INDEX IF NOT EXISTS idx_indicators_category ON indicators(category_id, display_order);

-- Assessment data
CREATE INDEX IF NOT EXISTS idx_indicator_assessments_assessment ON indicator_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_indicator_assessments_indicator ON indicator_assessments(indicator_id);
CREATE INDEX IF NOT EXISTS idx_assessment_evidence_indicator ON assessment_evidence(indicator_assessment_id);

-- Content integration
CREATE INDEX IF NOT EXISTS idx_content_links_indicator ON indicator_content_links(indicator_id, content_type);
CREATE INDEX IF NOT EXISTS idx_actions_indicator ON indicator_actions(indicator_id, is_active);

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- Enable RLS
ALTER TABLE assessment_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessed_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_content_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_actions ENABLE ROW LEVEL SECURITY;

-- Public read access to published content
CREATE POLICY "assessment_frameworks_public_read" ON assessment_frameworks
    FOR SELECT USING (is_active = true);

CREATE POLICY "assessed_entities_public_read" ON assessed_entities
    FOR SELECT USING (is_active = true);

CREATE POLICY "indicator_categories_public_read" ON indicator_categories
    FOR SELECT USING (true);

CREATE POLICY "indicators_public_read" ON indicators
    FOR SELECT USING (is_active = true);

CREATE POLICY "assessments_public_read" ON assessments
    FOR SELECT USING (review_status = 'published');

CREATE POLICY "indicator_assessments_public_read" ON indicator_assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assessments a 
            WHERE a.id = assessment_id 
            AND a.review_status = 'published'
        )
    );

CREATE POLICY "assessment_evidence_public_read" ON assessment_evidence
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM indicator_assessments ia
            JOIN assessments a ON a.id = ia.assessment_id
            WHERE ia.id = indicator_assessment_id 
            AND a.review_status = 'published'
        )
    );

CREATE POLICY "indicator_content_links_public_read" ON indicator_content_links
    FOR SELECT USING (true);

CREATE POLICY "indicator_actions_public_read" ON indicator_actions
    FOR SELECT USING (is_active = true);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assessment_frameworks_updated_at') THEN
        CREATE TRIGGER update_assessment_frameworks_updated_at 
            BEFORE UPDATE ON assessment_frameworks 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assessed_entities_updated_at') THEN
        CREATE TRIGGER update_assessed_entities_updated_at 
            BEFORE UPDATE ON assessed_entities 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_indicators_updated_at') THEN
        CREATE TRIGGER update_indicators_updated_at 
            BEFORE UPDATE ON indicators 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assessments_updated_at') THEN
        CREATE TRIGGER update_assessments_updated_at 
            BEFORE UPDATE ON assessments 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_indicator_assessments_updated_at') THEN
        CREATE TRIGGER update_indicator_assessments_updated_at 
            BEFORE UPDATE ON indicator_assessments 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

COMMIT; 