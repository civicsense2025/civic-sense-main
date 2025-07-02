-- ============================================================================
-- CIVIC PATTERN RECOGNITION SYSTEM MIGRATION
-- ============================================================================
-- Extends CivicSense with advanced pattern recognition for cumulative learning
-- Enables "Remember When..." contextual callbacks and civic pattern tracking

BEGIN;

-- ============================================================================
-- 1. CIVIC PATTERNS TABLE
-- ============================================================================
-- Core patterns that repeat across different civic events/topics
CREATE TABLE IF NOT EXISTS civic_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_name VARCHAR(200) NOT NULL UNIQUE, -- e.g., "Regulatory Capture", "Constitutional Crisis"
    pattern_slug VARCHAR(100) NOT NULL UNIQUE, -- URL-friendly version
    pattern_description TEXT NOT NULL,
    pattern_type VARCHAR(50) NOT NULL, -- 'power_dynamic', 'institutional', 'information_warfare', etc.
    
    -- Learning progression
    key_indicators TEXT[] NOT NULL DEFAULT '{}', -- What to look for
    recognition_stages JSONB DEFAULT '[]', -- Progressive learning stages
    
    -- Historical context
    historical_examples JSONB DEFAULT '[]', -- Past instances with dates and details
    current_relevance TEXT, -- Why this matters now
    
    -- Educational metadata
    difficulty_level INTEGER DEFAULT 2 CHECK (difficulty_level BETWEEN 1 AND 5),
    prerequisite_patterns UUID[] DEFAULT '{}', -- Other patterns to learn first
    
    -- Status and timestamps
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_civic_patterns_type ON civic_patterns(pattern_type);
CREATE INDEX idx_civic_patterns_difficulty ON civic_patterns(difficulty_level);
CREATE INDEX idx_civic_patterns_active ON civic_patterns(is_active) WHERE is_active = true;

-- ============================================================================
-- 2. TOPIC-PATTERN CONNECTIONS
-- ============================================================================
-- Links existing question_topics to civic patterns
CREATE TABLE IF NOT EXISTS topic_pattern_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id VARCHAR(100) NOT NULL REFERENCES question_topics(topic_id) ON DELETE CASCADE,
    pattern_id UUID NOT NULL REFERENCES civic_patterns(id) ON DELETE CASCADE,
    
    -- Connection metadata
    connection_strength INTEGER DEFAULT 3 CHECK (connection_strength BETWEEN 1 AND 5),
    connection_type VARCHAR(50) DEFAULT 'demonstrates', -- 'demonstrates', 'introduces', 'reinforces', 'contrasts'
    connection_notes TEXT, -- How this topic demonstrates the pattern
    
    -- Learning context
    is_primary_example BOOLEAN DEFAULT false, -- Is this the best example of this pattern?
    introduces_pattern BOOLEAN DEFAULT false, -- Does this topic first introduce the pattern?
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique connections
    UNIQUE(topic_id, pattern_id)
);

-- Create indexes for efficient lookups
CREATE INDEX idx_topic_pattern_topic ON topic_pattern_connections(topic_id);
CREATE INDEX idx_topic_pattern_pattern ON topic_pattern_connections(pattern_id);
CREATE INDEX idx_topic_pattern_strength ON topic_pattern_connections(connection_strength);
CREATE INDEX idx_topic_pattern_primary ON topic_pattern_connections(is_primary_example) WHERE is_primary_example = true;

-- ============================================================================
-- 3. TOPIC RELATIONSHIPS
-- ============================================================================
-- Cross-references between related topics for building learning sequences
CREATE TABLE IF NOT EXISTS topic_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_topic_id VARCHAR(100) NOT NULL REFERENCES question_topics(topic_id) ON DELETE CASCADE,
    related_topic_id VARCHAR(100) NOT NULL REFERENCES question_topics(topic_id) ON DELETE CASCADE,
    
    -- Relationship metadata
    relationship_type VARCHAR(50) NOT NULL, -- 'sequel', 'parallel', 'contrast', 'foundation', 'consequence'
    relationship_description TEXT,
    relationship_strength INTEGER DEFAULT 3 CHECK (relationship_strength BETWEEN 1 AND 5),
    
    -- Temporal ordering
    temporal_order INTEGER, -- For sequenced events (1, 2, 3...)
    time_gap_days INTEGER, -- Days between related events
    
    -- Learning sequence
    learning_order INTEGER, -- Recommended order for learning
    is_prerequisite BOOLEAN DEFAULT false, -- Must learn this before the other
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent self-references and duplicates
    CHECK (primary_topic_id != related_topic_id),
    UNIQUE(primary_topic_id, related_topic_id, relationship_type)
);

-- Create indexes for relationship queries
CREATE INDEX idx_topic_rel_primary ON topic_relationships(primary_topic_id);
CREATE INDEX idx_topic_rel_related ON topic_relationships(related_topic_id);
CREATE INDEX idx_topic_rel_type ON topic_relationships(relationship_type);
CREATE INDEX idx_topic_rel_sequence ON topic_relationships(learning_order) WHERE learning_order IS NOT NULL;
CREATE INDEX idx_topic_rel_prereq ON topic_relationships(is_prerequisite) WHERE is_prerequisite = true;

-- ============================================================================
-- 4. USER PATTERN RECOGNITION TRACKING
-- ============================================================================
-- Track individual user progress on pattern recognition
CREATE TABLE IF NOT EXISTS user_pattern_recognition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Can be null for guest users
    guest_token VARCHAR(100), -- For guest tracking
    pattern_id UUID NOT NULL REFERENCES civic_patterns(id) ON DELETE CASCADE,
    
    -- Recognition progress
    recognition_level INTEGER DEFAULT 1 CHECK (recognition_level BETWEEN 1 AND 5),
    -- 1: Unaware, 2: Introduced, 3: Recognizes with help, 4: Recognizes independently, 5: Can teach others
    
    -- Learning history
    first_encountered DATE DEFAULT CURRENT_DATE,
    last_reinforced DATE DEFAULT CURRENT_DATE,
    examples_seen INTEGER DEFAULT 0,
    examples_recognized INTEGER DEFAULT 0,
    
    -- Assessment status
    can_identify_independently BOOLEAN DEFAULT false,
    last_independent_identification DATE,
    mastery_demonstrated BOOLEAN DEFAULT false,
    mastery_date DATE,
    
    -- Metadata
    learning_path JSONB DEFAULT '[]', -- Track how they learned this pattern
    notes TEXT, -- Optional user or system notes
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per user per pattern
    UNIQUE(user_id, pattern_id),
    UNIQUE(guest_token, pattern_id),
    CHECK ((user_id IS NOT NULL AND guest_token IS NULL) OR (user_id IS NULL AND guest_token IS NOT NULL))
);

-- Create indexes for user tracking
CREATE INDEX idx_user_pattern_user ON user_pattern_recognition(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_user_pattern_guest ON user_pattern_recognition(guest_token) WHERE guest_token IS NOT NULL;
CREATE INDEX idx_user_pattern_pattern ON user_pattern_recognition(pattern_id);
CREATE INDEX idx_user_pattern_level ON user_pattern_recognition(recognition_level);
CREATE INDEX idx_user_pattern_mastery ON user_pattern_recognition(mastery_demonstrated) WHERE mastery_demonstrated = true;

-- ============================================================================
-- 5. EXTEND EXISTING TABLES
-- ============================================================================

-- Add pattern recognition fields to question_topics
ALTER TABLE question_topics 
ADD COLUMN IF NOT EXISTS prerequisite_topics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS builds_on_patterns UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS introduces_patterns UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS learning_sequence_order INTEGER,
ADD COLUMN IF NOT EXISTS pattern_recognition_difficulty INTEGER DEFAULT 2 CHECK (pattern_recognition_difficulty BETWEEN 1 AND 5);

-- Add pattern recognition fields to questions
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS reinforces_pattern UUID REFERENCES civic_patterns(id),
ADD COLUMN IF NOT EXISTS callbacks_to_topics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pattern_recognition_level INTEGER DEFAULT 2 CHECK (pattern_recognition_level BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS requires_pattern_knowledge UUID[] DEFAULT '{}';

-- ============================================================================
-- 6. PATTERN RECOGNITION INSIGHTS TABLE
-- ============================================================================
-- Track user insights and "aha" moments for analytics
CREATE TABLE IF NOT EXISTS pattern_recognition_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    guest_token VARCHAR(100),
    
    -- Insight context
    pattern_id UUID NOT NULL REFERENCES civic_patterns(id) ON DELETE CASCADE,
    trigger_topic_id VARCHAR(100) REFERENCES question_topics(topic_id),
    trigger_question_id UUID,
    
    -- Insight details
    insight_type VARCHAR(50) NOT NULL, -- 'connection_made', 'pattern_recognized', 'independent_identification'
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    time_to_recognition_seconds INTEGER,
    
    -- Context
    session_id VARCHAR(100), -- Link to quiz session
    previous_examples_seen INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK ((user_id IS NOT NULL AND guest_token IS NULL) OR (user_id IS NULL AND guest_token IS NOT NULL))
);

-- Create indexes for insights tracking
CREATE INDEX idx_pattern_insights_user ON pattern_recognition_insights(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_pattern_insights_guest ON pattern_recognition_insights(guest_token) WHERE guest_token IS NOT NULL;
CREATE INDEX idx_pattern_insights_pattern ON pattern_recognition_insights(pattern_id);
CREATE INDEX idx_pattern_insights_type ON pattern_recognition_insights(insight_type);
CREATE INDEX idx_pattern_insights_created ON pattern_recognition_insights(created_at);

-- ============================================================================
-- 7. FUNCTIONS FOR PATTERN RECOGNITION
-- ============================================================================

-- Function to update user pattern recognition when they encounter a pattern
CREATE OR REPLACE FUNCTION update_user_pattern_recognition(
    p_user_id UUID DEFAULT NULL,
    p_guest_token VARCHAR(100) DEFAULT NULL,
    p_pattern_id UUID,
    p_recognition_type VARCHAR(50) DEFAULT 'exposed', -- 'exposed', 'helped', 'independent'
    p_topic_id VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE(
    recognition_level INTEGER,
    examples_seen INTEGER,
    level_changed BOOLEAN
) AS $$
DECLARE
    v_current_record user_pattern_recognition%ROWTYPE;
    v_new_level INTEGER;
    v_level_changed BOOLEAN := false;
BEGIN
    -- Get or create user pattern recognition record
    SELECT * INTO v_current_record
    FROM user_pattern_recognition upr
    WHERE (p_user_id IS NOT NULL AND upr.user_id = p_user_id)
       OR (p_guest_token IS NOT NULL AND upr.guest_token = p_guest_token)
    AND upr.pattern_id = p_pattern_id;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO user_pattern_recognition (
            user_id, guest_token, pattern_id, recognition_level, 
            first_encountered, examples_seen, examples_recognized
        ) VALUES (
            p_user_id, p_guest_token, p_pattern_id, 1, 
            CURRENT_DATE, 1, CASE WHEN p_recognition_type = 'independent' THEN 1 ELSE 0 END
        )
        RETURNING * INTO v_current_record;
        
        v_new_level := 1;
    ELSE
        -- Update existing record
        v_new_level := v_current_record.recognition_level;
        
        -- Increment examples seen
        UPDATE user_pattern_recognition 
        SET 
            examples_seen = examples_seen + 1,
            examples_recognized = examples_recognized + CASE WHEN p_recognition_type = 'independent' THEN 1 ELSE 0 END,
            last_reinforced = CURRENT_DATE,
            updated_at = NOW()
        WHERE id = v_current_record.id;
        
        -- Level up logic
        IF p_recognition_type = 'independent' AND v_current_record.recognition_level < 4 THEN
            v_new_level := LEAST(v_current_record.recognition_level + 1, 4);
            v_level_changed := true;
            
            UPDATE user_pattern_recognition 
            SET 
                recognition_level = v_new_level,
                can_identify_independently = CASE WHEN v_new_level >= 4 THEN true ELSE can_identify_independently END,
                last_independent_identification = CASE WHEN v_new_level >= 4 THEN CURRENT_DATE ELSE last_independent_identification END
            WHERE id = v_current_record.id;
        END IF;
    END IF;
    
    -- Return current status
    RETURN QUERY SELECT v_new_level, v_current_record.examples_seen + 1, v_level_changed;
END;
$$ LANGUAGE plpgsql;

-- Function to get related topics for pattern recognition
CREATE OR REPLACE FUNCTION get_pattern_related_topics(
    p_topic_id VARCHAR(100),
    p_user_id UUID DEFAULT NULL,
    p_guest_token VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE(
    related_topic_id VARCHAR(100),
    topic_title TEXT,
    relationship_type VARCHAR(50),
    pattern_name VARCHAR(200),
    user_has_seen BOOLEAN,
    connection_notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_completed_topics AS (
        -- Get topics user has completed (from quiz attempts or progress)
        SELECT DISTINCT ps.topic_id
        FROM progress_sessions ps
        WHERE (p_user_id IS NOT NULL AND ps.user_id = p_user_id)
           OR (p_guest_token IS NOT NULL AND ps.guest_token = p_guest_token)
    )
    SELECT DISTINCT
        tr.related_topic_id,
        qt.topic_title,
        tr.relationship_type,
        cp.pattern_name,
        CASE WHEN uct.topic_id IS NOT NULL THEN true ELSE false END as user_has_seen,
        tpc.connection_notes
    FROM topic_relationships tr
    JOIN question_topics qt ON qt.topic_id = tr.related_topic_id
    LEFT JOIN topic_pattern_connections tpc ON tpc.topic_id = tr.related_topic_id
    LEFT JOIN civic_patterns cp ON cp.id = tpc.pattern_id
    LEFT JOIN user_completed_topics uct ON uct.topic_id = tr.related_topic_id
    WHERE tr.primary_topic_id = p_topic_id
    AND tr.is_active = true
    ORDER BY tr.relationship_strength DESC, tr.learning_order ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample civic patterns
INSERT INTO civic_patterns (pattern_name, pattern_slug, pattern_description, pattern_type, key_indicators, difficulty_level) VALUES
(
    'Regulatory Capture',
    'regulatory-capture',
    'When industries gain control over the agencies meant to regulate them, leading to policies that benefit industry over public interest.',
    'power_dynamic',
    ARRAY['Industry insiders appointed to regulatory positions', 'Revolving door between industry and government', 'Policies that benefit industry over consumers', 'Weakened enforcement of regulations'],
    2
),
(
    'Information Warfare',
    'information-warfare',
    'Systematic efforts to manipulate public opinion through disinformation, propaganda, and media manipulation.',
    'information_warfare',
    ARRAY['Coordinated disinformation campaigns', 'Social media manipulation', 'State-sponsored propaganda', 'Undermining trust in institutions'],
    3
),
(
    'Constitutional Crisis',
    'constitutional-crisis',
    'Situations where constitutional norms, laws, or institutions are severely tested or potentially broken.',
    'institutional',
    ARRAY['Unprecedented actions by officials', 'Conflicts between branches of government', 'Challenges to rule of law', 'Emergency powers invoked'],
    4
)
ON CONFLICT (pattern_name) DO NOTHING;

-- Create update trigger for civic_patterns
CREATE OR REPLACE FUNCTION update_civic_patterns_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER civic_patterns_update_timestamp
    BEFORE UPDATE ON civic_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_civic_patterns_timestamp();

COMMIT; 