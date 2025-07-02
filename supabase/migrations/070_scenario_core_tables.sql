-- =============================================================================
-- SCENARIO SYSTEM CORE TABLES - PHASE 1
-- =============================================================================
-- This migration creates the core scenario tables following the atomic design
-- approach that integrates with existing CivicSense infrastructure.

BEGIN;

-- =============================================================================
-- STEP 1: CREATE CORE SCENARIO TABLES
-- =============================================================================

-- Main scenarios table - core content (similar to question_topics pattern)
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info (reuse existing patterns)
    scenario_title VARCHAR(200) NOT NULL,
    scenario_slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    
    -- Content Organization (integrate with existing categories)
    civic_categories TEXT[], -- maps to existing CivicSense categories
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_duration_minutes INTEGER,
    
    -- Game Mechanics
    scenario_type VARCHAR(50) DEFAULT 'political_simulation', 
    -- 'crisis_response', 'negotiation', 'local_government', 'policy_development'
    max_players INTEGER DEFAULT 1, -- 1 for single-player, >1 for multiplayer
    
    -- Educational Integration (connect to existing system)
    learning_objectives TEXT[],
    key_concepts TEXT[],
    quiz_topic_connections TEXT[], -- related question_topics.topic_id
    
    -- Content Status
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Scenario situations - the "questions" of scenario games
CREATE TABLE IF NOT EXISTS scenario_situations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    
    -- Situation Content
    situation_title VARCHAR(200) NOT NULL,
    situation_description TEXT NOT NULL,
    background_context TEXT,
    
    -- Flow Control
    situation_order INTEGER NOT NULL,
    time_limit_seconds INTEGER,
    pressure_level INTEGER CHECK (pressure_level BETWEEN 1 AND 5),
    
    -- Character Context (which characters see this situation)
    available_to_characters TEXT[], -- array of character IDs
    
    -- Branching Logic
    prerequisites JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenario decisions - the "answer options" of scenario games  
CREATE TABLE IF NOT EXISTS scenario_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    situation_id UUID REFERENCES scenario_situations(id) ON DELETE CASCADE,
    
    -- Decision Content
    decision_text TEXT NOT NULL,
    decision_description TEXT,
    
    -- Mechanics
    decision_order INTEGER NOT NULL,
    resource_costs JSONB DEFAULT '{}',
    immediate_effects JSONB DEFAULT '{}',
    
    -- Educational Value
    teaches_concepts TEXT[],
    real_world_precedent TEXT,
    democratic_health_impact INTEGER CHECK (democratic_health_impact BETWEEN -3 AND 3),
    
    -- Outcomes
    leads_to_situation_id UUID REFERENCES scenario_situations(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Characters - reusable across scenarios
CREATE TABLE IF NOT EXISTS scenario_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Character Identity
    character_name VARCHAR(100) NOT NULL,
    character_title VARCHAR(150), -- "Senator", "City Council Member", "NGO Director"
    character_type VARCHAR(50), -- "elected_official", "bureaucrat", "activist", "business_leader"
    
    -- Character Properties
    starting_resources JSONB DEFAULT '{}',
    character_constraints TEXT[],
    victory_conditions TEXT[],
    
    -- Educational Context
    inspired_by_figure_id UUID REFERENCES public_figures(id),
    represents_stakeholder_group VARCHAR(100),
    
    -- Reusability
    usable_in_scenario_types TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Scenarios indexes
CREATE INDEX IF NOT EXISTS idx_scenarios_active ON scenarios(is_active, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_scenarios_type ON scenarios(scenario_type);
CREATE INDEX IF NOT EXISTS idx_scenarios_slug ON scenarios(scenario_slug);
CREATE INDEX IF NOT EXISTS idx_scenarios_categories ON scenarios USING GIN(civic_categories);

-- Situations indexes
CREATE INDEX IF NOT EXISTS idx_scenario_situations_scenario ON scenario_situations(scenario_id, situation_order);
CREATE INDEX IF NOT EXISTS idx_scenario_situations_characters ON scenario_situations USING GIN(available_to_characters);

-- Decisions indexes
CREATE INDEX IF NOT EXISTS idx_scenario_decisions_situation ON scenario_decisions(situation_id, decision_order);
CREATE INDEX IF NOT EXISTS idx_scenario_decisions_leads_to ON scenario_decisions(leads_to_situation_id);

-- Characters indexes
CREATE INDEX IF NOT EXISTS idx_scenario_characters_type ON scenario_characters(character_type);
CREATE INDEX IF NOT EXISTS idx_scenario_characters_figure ON scenario_characters(inspired_by_figure_id);
CREATE INDEX IF NOT EXISTS idx_scenario_characters_types ON scenario_characters USING GIN(usable_in_scenario_types);

-- =============================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all scenario tables
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_characters ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 4: CREATE SIMPLE, NON-CIRCULAR RLS POLICIES
-- =============================================================================

-- Scenarios: Public read for active scenarios, admin manage
CREATE POLICY "scenarios_public_read" ON scenarios
    FOR SELECT USING (is_active = true);

CREATE POLICY "scenarios_admin_manage" ON scenarios
    FOR ALL USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- Scenario content: Inherit from scenarios (non-circular)
CREATE POLICY "scenario_content_public_read" ON scenario_situations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scenarios 
            WHERE id = scenario_situations.scenario_id 
            AND is_active = true
        )
    );

CREATE POLICY "scenario_decisions_public_read" ON scenario_decisions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scenario_situations s
            JOIN scenarios sc ON sc.id = s.scenario_id
            WHERE s.id = scenario_decisions.situation_id 
            AND sc.is_active = true
        )
    );

-- Characters: Public read (reusable across scenarios)
CREATE POLICY "scenario_characters_public_read" ON scenario_characters
    FOR SELECT USING (true);

-- Admin policies for content management
CREATE POLICY "scenario_content_admin_manage" ON scenario_situations
    FOR ALL USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "scenario_decisions_admin_manage" ON scenario_decisions
    FOR ALL USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "scenario_characters_admin_manage" ON scenario_characters
    FOR ALL USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- =============================================================================
-- STEP 5: CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Reuse existing updated_at trigger function
CREATE TRIGGER update_scenarios_updated_at
    BEFORE UPDATE ON scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 6: LOG COMPLETION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== SCENARIO SYSTEM CORE TABLES CREATED ===';
    RAISE NOTICE 'Core scenario tables created:';
    RAISE NOTICE '  - scenarios (main scenario definitions)';
    RAISE NOTICE '  - scenario_situations (decision points)';
    RAISE NOTICE '  - scenario_decisions (user choices)';
    RAISE NOTICE '  - scenario_characters (playable roles)';
    RAISE NOTICE 'All tables have RLS enabled with simple policies';
    RAISE NOTICE 'Indexes and triggers have been created';
    RAISE NOTICE 'Ready for Phase 2: User Progress Integration';
    RAISE NOTICE '=============================================';
END $$;

COMMIT; 