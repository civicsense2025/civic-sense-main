-- =============================================================================
-- ADD MISSING SCENARIO TABLES AND EXPONENTIALLY EXPAND DECISIONS
-- =============================================================================
-- This migration fixes missing scenario_outcomes and scenario_resources tables
-- and adds exponentially more decisions to every scenario to create complex,
-- multi-branching narratives

BEGIN;

-- =============================================================================
-- STEP 1: CREATE MISSING SCENARIO_OUTCOMES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS scenario_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    
    outcome_title VARCHAR(200) NOT NULL,
    outcome_description TEXT NOT NULL,
    
    -- Outcome Classification
    outcome_type VARCHAR(50) NOT NULL, -- 'success', 'failure', 'mixed', 'realistic_compromise'
    democratic_health_impact INTEGER CHECK (democratic_health_impact BETWEEN -5 AND 5),
    stakeholder_satisfaction JSONB DEFAULT '{}', -- how different groups feel about outcome
    
    -- Real-World Connections
    historical_examples TEXT[], -- actual events this outcome resembles
    probability_assessment VARCHAR(50), -- 'highly_likely', 'possible', 'unlikely'
    expert_commentary TEXT, -- what political scientists would say
    
    -- Educational Reflection
    key_lessons TEXT[],
    discussion_questions TEXT[],
    suggested_actions TEXT[], -- what users could do in real life
    
    -- Follow-up Content
    related_quiz_topics TEXT[], -- connects to existing CivicSense quizzes
    recommended_reading JSONB DEFAULT '{}', -- authoritative sources for deeper learning
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: CREATE MISSING SCENARIO_RESOURCES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS scenario_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    resource_name VARCHAR(50) UNIQUE NOT NULL, -- 'political_capital', 'media_attention'
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Resource Properties
    resource_type VARCHAR(30) NOT NULL, -- 'finite', 'renewable', 'influence'
    default_starting_amount INTEGER DEFAULT 100,
    maximum_amount INTEGER DEFAULT 200,
    
    -- UI Display
    icon_name VARCHAR(50), -- for frontend display
    color_scheme VARCHAR(20), -- visual theming
    
    -- Educational Context
    real_world_explanation TEXT, -- what this represents in actual politics
    examples_in_politics TEXT[], -- concrete examples of this resource
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STEP 3: CREATE INDEXES FOR NEW TABLES
-- =============================================================================

-- Scenario outcomes indexes
CREATE INDEX IF NOT EXISTS idx_scenario_outcomes_scenario ON scenario_outcomes(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_outcomes_type ON scenario_outcomes(outcome_type);
CREATE INDEX IF NOT EXISTS idx_scenario_outcomes_impact ON scenario_outcomes(democratic_health_impact);

-- Scenario resources indexes
CREATE INDEX IF NOT EXISTS idx_scenario_resources_name ON scenario_resources(resource_name);
CREATE INDEX IF NOT EXISTS idx_scenario_resources_type ON scenario_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_scenario_resources_active ON scenario_resources(is_active);

-- =============================================================================
-- STEP 4: ENABLE RLS ON NEW TABLES
-- =============================================================================

ALTER TABLE scenario_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scenario_outcomes
CREATE POLICY "scenario_outcomes_public_read" ON scenario_outcomes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scenarios 
            WHERE id = scenario_outcomes.scenario_id 
            AND is_active = true
        )
    );

CREATE POLICY "scenario_outcomes_admin_manage" ON scenario_outcomes
    FOR ALL USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- RLS Policies for scenario_resources
CREATE POLICY "scenario_resources_public_read" ON scenario_resources
    FOR SELECT USING (is_active = true);

CREATE POLICY "scenario_resources_admin_manage" ON scenario_resources
    FOR ALL USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- =============================================================================
-- STEP 5: INSERT CORE SCENARIO RESOURCES
-- =============================================================================

INSERT INTO scenario_resources (
    resource_name,
    display_name,
    description,
    resource_type,
    default_starting_amount,
    maximum_amount,
    icon_name,
    color_scheme,
    real_world_explanation,
    examples_in_politics
) VALUES 
(
    'political_capital',
    'Political Capital',
    'Your influence and ability to get things done in the political system',
    'finite',
    100,
    200,
    'crown',
    'blue',
    'Political capital represents the trust, influence, and relationships politicians build over time. It can be spent to achieve goals but must be carefully managed.',
    ARRAY['Using favors to pass legislation', 'Calling in debts for votes', 'Leveraging relationships for appointments']
),
(
    'media_attention',
    'Media Attention',
    'How much the press and public are focused on you and your actions',
    'renewable',
    50,
    150,
    'megaphone',
    'orange',
    'Media attention can be both an asset and a liability. High attention means more influence but also more scrutiny.',
    ARRAY['Press conferences', 'Social media presence', 'Cable news appearances', 'Viral moments']
),
(
    'public_support',
    'Public Support',
    'How much the general public trusts and approves of your actions',
    'renewable',
    75,
    150,
    'heart',
    'green',
    'Public support is crucial for electoral success and policy implementation. It can be built through effective communication and good governance.',
    ARRAY['Approval ratings', 'Town hall responses', 'Election results', 'Petition signatures']
),
(
    'time_remaining',
    'Time Remaining',
    'How much time you have left to accomplish your goals',
    'finite',
    10,
    10,
    'clock',
    'red',
    'In politics, timing is everything. Legislative sessions, election cycles, and crisis responses all operate under time constraints.',
    ARRAY['Legislative deadlines', 'Election countdowns', 'Crisis response windows', 'Budget cycles']
),
(
    'coalition_strength',
    'Coalition Strength',
    'The solidarity and effectiveness of your political alliances',
    'renewable',
    60,
    120,
    'users',
    'purple',
    'Building and maintaining coalitions is essential for achieving policy goals in democratic systems.',
    ARRAY['Party unity', 'Interest group alliances', 'Bipartisan partnerships', 'Grassroots networks']
),
(
    'expertise_credibility',
    'Expertise & Credibility',
    'Your reputation for knowledge and competence on issues',
    'renewable',
    80,
    140,
    'graduation-cap',
    'indigo',
    'Expertise and credibility allow politicians to be trusted voices on complex issues and to lead policy discussions.',
    ARRAY['Committee leadership', 'Policy specialization', 'Professional background', 'Track record']
)
ON CONFLICT (resource_name) DO NOTHING;

-- =============================================================================
-- STEP 6: EXPONENTIALLY EXPAND DECISIONS FOR ALL SCENARIOS
-- =============================================================================

-- First, let's add many more situations to existing scenarios
DO $$
DECLARE
    scenario_record RECORD;
    situation_record RECORD;
    new_situation_id UUID;
    decision_count INTEGER;
    i INTEGER;
    j INTEGER;
BEGIN
    -- Loop through all existing scenarios
    FOR scenario_record IN 
        SELECT id, scenario_title, scenario_type 
        FROM scenarios 
        WHERE is_active = true
    LOOP
        RAISE NOTICE 'Expanding scenario: %', scenario_record.scenario_title;
        
        -- Add 5-8 more complex situations to each scenario
        FOR i IN 1..7 LOOP
            new_situation_id := gen_random_uuid();
            
            INSERT INTO scenario_situations (
                id,
                scenario_id,
                situation_title,
                situation_description,
                background_context,
                situation_order,
                time_limit_seconds,
                pressure_level,
                available_to_characters,
                prerequisites
            ) VALUES (
                new_situation_id,
                scenario_record.id,
                CASE 
                    WHEN i = 1 THEN 'Unexpected Opposition Emerges'
                    WHEN i = 2 THEN 'Media Investigation Begins'
                    WHEN i = 3 THEN 'Stakeholder Pressure Mounts'
                    WHEN i = 4 THEN 'Coalition Partners Waver'
                    WHEN i = 5 THEN 'Crisis Escalates Rapidly'
                    WHEN i = 6 THEN 'Public Opinion Shifts'
                    WHEN i = 7 THEN 'Final Decision Point'
                END,
                CASE 
                    WHEN i = 1 THEN 'A powerful interest group has mobilized against your proposal, launching a sophisticated campaign to undermine your efforts. Their arguments are resonating with key stakeholders, and some of your allies are beginning to question their support.'
                    WHEN i = 2 THEN 'Investigative journalists have begun looking into the background of this issue, including potential conflicts of interest and past decisions. Their reporting could either validate your approach or expose problematic aspects you hadn''t considered.'
                    WHEN i = 3 THEN 'Multiple stakeholder groups are now actively lobbying for different outcomes. Each group has legitimate concerns and significant influence. Balancing their competing demands while maintaining your core objectives becomes increasingly challenging.'
                    WHEN i = 4 THEN 'Key members of your coalition are expressing doubts about the current strategy. Some want to compromise further, others want to take a harder line. The unity that brought you this far is fracturing under pressure.'
                    WHEN i = 5 THEN 'The situation has taken an unexpected turn that demands immediate action. External events have changed the political landscape, and your original plan may no longer be viable. Quick decisions are needed.'
                    WHEN i = 6 THEN 'New polling data and focus group results show that public opinion is shifting. What seemed like a clear mandate is now uncertain. Citizens are responding to the debate in ways that could affect electoral prospects.'
                    WHEN i = 7 THEN 'All the maneuvering, negotiation, and positioning has led to this moment. The final decision must be made, and it will have lasting consequences for all involved parties and the democratic process itself.'
                END,
                CASE 
                    WHEN i <= 3 THEN 'This development reflects the complex reality of democratic governance, where multiple legitimate interests compete for influence and attention.'
                    WHEN i <= 5 THEN 'The intensity of democratic debate often reveals underlying tensions and values conflicts that weren''t apparent at the outset.'
                    ELSE 'Democratic decision-making requires weighing competing values, interests, and long-term consequences under conditions of uncertainty.'
                END,
                (SELECT MAX(situation_order) FROM scenario_situations WHERE scenario_id = scenario_record.id) + i,
                CASE WHEN i >= 5 THEN 300 ELSE NULL END, -- Time pressure for final situations
                CASE 
                    WHEN i <= 2 THEN 2
                    WHEN i <= 4 THEN 3
                    WHEN i <= 6 THEN 4
                    ELSE 5
                END,
                ARRAY['all'], -- Available to all characters
                CASE 
                    WHEN i = 1 THEN '{}'::JSONB
                    ELSE format('{"previous_situations": ["%s"]}', 
                        (SELECT id FROM scenario_situations 
                         WHERE scenario_id = scenario_record.id 
                         ORDER BY situation_order DESC 
                         LIMIT 1)
                    )::JSONB
                END
            );
            
            -- Add 4-8 decisions for each new situation
            decision_count := 4 + (i % 5); -- Varies between 4-8 decisions
            
            FOR j IN 1..decision_count LOOP
                INSERT INTO scenario_decisions (
                    situation_id,
                    decision_text,
                    decision_description,
                    decision_order,
                    resource_costs,
                    immediate_effects,
                    teaches_concepts,
                    real_world_precedent,
                    democratic_health_impact,
                    leads_to_situation_id
                ) VALUES (
                    new_situation_id,
                    CASE 
                        WHEN j = 1 THEN 'Engage directly with opposition'
                        WHEN j = 2 THEN 'Build broader coalition'
                        WHEN j = 3 THEN 'Seek compromise solution'
                        WHEN j = 4 THEN 'Double down on original plan'
                        WHEN j = 5 THEN 'Bring in external mediator'
                        WHEN j = 6 THEN 'Appeal directly to public'
                        WHEN j = 7 THEN 'Delay decision for more information'
                        WHEN j = 8 THEN 'Pivot to alternative approach'
                    END,
                    CASE 
                        WHEN j = 1 THEN 'Meet face-to-face with opposition leaders to understand their concerns and find potential areas of agreement.'
                        WHEN j = 2 THEN 'Expand your coalition by reaching out to previously neutral parties who might be persuaded to join your cause.'
                        WHEN j = 3 THEN 'Propose a modified version of your plan that addresses some opposition concerns while maintaining core objectives.'
                        WHEN j = 4 THEN 'Maintain your current course despite opposition, believing that your approach is fundamentally correct.'
                        WHEN j = 5 THEN 'Invite a respected neutral party to help facilitate discussions between competing factions.'
                        WHEN j = 6 THEN 'Go over the heads of political elites and make your case directly to citizens through media and public forums.'
                        WHEN j = 7 THEN 'Postpone major decisions while gathering additional information and allowing tensions to cool.'
                        WHEN j = 8 THEN 'Acknowledge that circumstances have changed and develop a new strategy that better fits current realities.'
                    END,
                    j,
                    CASE 
                        WHEN j = 1 THEN '{"political_capital": 15, "time_remaining": 1}'
                        WHEN j = 2 THEN '{"political_capital": 20, "media_attention": 10}'
                        WHEN j = 3 THEN '{"political_capital": 10, "coalition_strength": 5}'
                        WHEN j = 4 THEN '{"public_support": 15, "coalition_strength": 10}'
                        WHEN j = 5 THEN '{"political_capital": 25, "time_remaining": 2}'
                        WHEN j = 6 THEN '{"media_attention": 20, "political_capital": 10}'
                        WHEN j = 7 THEN '{"time_remaining": 3, "coalition_strength": 5}'
                        WHEN j = 8 THEN '{"political_capital": 30, "expertise_credibility": 10}'
                    END::JSONB,
                    CASE 
                        WHEN j = 1 THEN '{"coalition_strength": 15, "expertise_credibility": 5}'
                        WHEN j = 2 THEN '{"coalition_strength": 25, "public_support": 10}'
                        WHEN j = 3 THEN '{"public_support": 10, "coalition_strength": 10}'
                        WHEN j = 4 THEN '{"media_attention": 15, "expertise_credibility": 10}'
                        WHEN j = 5 THEN '{"coalition_strength": 20, "public_support": 5}'
                        WHEN j = 6 THEN '{"public_support": 20, "media_attention": 25}'
                        WHEN j = 7 THEN '{"expertise_credibility": 15, "coalition_strength": 5}'
                        WHEN j = 8 THEN '{"expertise_credibility": 20, "coalition_strength": -5}'
                    END::JSONB,
                    CASE 
                        WHEN j = 1 THEN ARRAY['negotiation', 'conflict_resolution']
                        WHEN j = 2 THEN ARRAY['coalition_building', 'political_strategy']
                        WHEN j = 3 THEN ARRAY['compromise', 'democratic_process']
                        WHEN j = 4 THEN ARRAY['leadership', 'conviction_politics']
                        WHEN j = 5 THEN ARRAY['mediation', 'institutional_process']
                        WHEN j = 6 THEN ARRAY['public_communication', 'democratic_participation']
                        WHEN j = 7 THEN ARRAY['deliberation', 'information_gathering']
                        WHEN j = 8 THEN ARRAY['adaptability', 'strategic_thinking']
                    END,
                    CASE 
                        WHEN j = 1 THEN 'Direct negotiation between opposing political leaders, as seen in bipartisan budget deals'
                        WHEN j = 2 THEN 'Coalition expansion strategies used in major legislative campaigns like healthcare reform'
                        WHEN j = 3 THEN 'Compromise solutions like those reached in government shutdown negotiations'
                        WHEN j = 4 THEN 'Maintaining position despite opposition, as seen in civil rights legislation'
                        WHEN j = 5 THEN 'Third-party mediation used in international diplomacy and labor disputes'
                        WHEN j = 6 THEN 'Public appeals over legislative heads, like FDR''s fireside chats'
                        WHEN j = 7 THEN 'Strategic delays seen in Supreme Court nomination processes'
                        WHEN j = 8 THEN 'Policy pivots following changed circumstances or new information'
                    END,
                    CASE 
                        WHEN j IN (1, 3, 5) THEN 1  -- Positive for democratic norms
                        WHEN j IN (2, 6) THEN 0     -- Neutral
                        WHEN j IN (4, 7) THEN -1    -- Slightly negative
                        WHEN j = 8 THEN 2           -- Very positive for adaptability
                    END,
                    CASE 
                        WHEN i < 7 THEN (
                            SELECT id FROM scenario_situations 
                            WHERE scenario_id = scenario_record.id 
                            AND situation_order > (SELECT MAX(situation_order) FROM scenario_situations WHERE scenario_id = scenario_record.id AND id = new_situation_id)
                            ORDER BY situation_order ASC 
                            LIMIT 1
                        )
                        ELSE NULL -- Final decisions don't lead to more situations
                    END
                );
            END LOOP;
            
        END LOOP;
        
        -- Add multiple outcomes for each scenario
        FOR i IN 1..5 LOOP
            INSERT INTO scenario_outcomes (
                scenario_id,
                outcome_title,
                outcome_description,
                outcome_type,
                democratic_health_impact,
                stakeholder_satisfaction,
                historical_examples,
                probability_assessment,
                expert_commentary,
                key_lessons,
                discussion_questions,
                suggested_actions,
                related_quiz_topics,
                recommended_reading
            ) VALUES (
                scenario_record.id,
                CASE 
                    WHEN i = 1 THEN 'Successful Compromise Achieved'
                    WHEN i = 2 THEN 'Partial Success with Trade-offs'
                    WHEN i = 3 THEN 'Gridlock and Delayed Resolution'
                    WHEN i = 4 THEN 'Unexpected Coalition Victory'
                    WHEN i = 5 THEN 'Crisis Deepens, New Approach Needed'
                END,
                CASE 
                    WHEN i = 1 THEN 'Through skillful negotiation and strategic compromise, a solution was reached that addresses the core concerns of most stakeholders while maintaining the integrity of democratic processes.'
                    WHEN i = 2 THEN 'Some progress was made, but significant trade-offs were required. While not everyone is satisfied, the outcome demonstrates the messy reality of democratic governance.'
                    WHEN i = 3 THEN 'Despite extensive efforts, fundamental disagreements prevented resolution. The issue remains unresolved, highlighting the challenges of governing in a polarized environment.'
                    WHEN i = 4 THEN 'An unexpected alliance formed around a creative solution that no one initially anticipated. This outcome shows how democratic processes can generate innovative approaches.'
                    WHEN i = 5 THEN 'The situation has become more complex, requiring new strategies and possibly different leadership. This outcome illustrates how political crises can evolve beyond original parameters.'
                END,
                CASE 
                    WHEN i = 1 THEN 'success'
                    WHEN i = 2 THEN 'mixed'
                    WHEN i = 3 THEN 'failure'
                    WHEN i = 4 THEN 'success'
                    WHEN i = 5 THEN 'failure'
                END,
                CASE 
                    WHEN i = 1 THEN 3
                    WHEN i = 2 THEN 1
                    WHEN i = 3 THEN -2
                    WHEN i = 4 THEN 4
                    WHEN i = 5 THEN -3
                END,
                CASE 
                    WHEN i = 1 THEN '{"citizens": 4, "interest_groups": 3, "political_parties": 4, "media": 3}'
                    WHEN i = 2 THEN '{"citizens": 3, "interest_groups": 2, "political_parties": 3, "media": 3}'
                    WHEN i = 3 THEN '{"citizens": 2, "interest_groups": 2, "political_parties": 1, "media": 2}'
                    WHEN i = 4 THEN '{"citizens": 4, "interest_groups": 4, "political_parties": 3, "media": 4}'
                    WHEN i = 5 THEN '{"citizens": 1, "interest_groups": 1, "political_parties": 1, "media": 2}'
                END::JSONB,
                CASE 
                    WHEN i = 1 THEN ARRAY['Bipartisan Infrastructure Investment Act', 'Criminal Justice Reform compromises', 'Budget deal negotiations']
                    WHEN i = 2 THEN ARRAY['Affordable Care Act passage', 'Tax reform with mixed outcomes', 'Immigration policy adjustments']
                    WHEN i = 3 THEN ARRAY['Government shutdowns', 'Debt ceiling standoffs', 'Climate change legislation stalemates']
                    WHEN i = 4 THEN ARRAY['Unexpected bipartisan coalitions', 'Cross-party issue alliances', 'Grassroots-driven policy changes']
                    WHEN i = 5 THEN ARRAY['Policy crises requiring new approaches', 'Leadership changes mid-crisis', 'Escalating political conflicts']
                END,
                CASE 
                    WHEN i = 1 THEN 'highly_likely'
                    WHEN i = 2 THEN 'possible'
                    WHEN i = 3 THEN 'possible'
                    WHEN i = 4 THEN 'unlikely'
                    WHEN i = 5 THEN 'possible'
                END,
                CASE 
                    WHEN i = 1 THEN 'Political scientists note that successful compromises often require skilled leadership, timing, and mutual recognition of shared interests.'
                    WHEN i = 2 THEN 'Experts observe that partial solutions are common in democratic systems, reflecting the difficulty of satisfying diverse constituencies.'
                    WHEN i = 3 THEN 'Scholars point out that gridlock can be a feature of democratic systems designed to prevent hasty decisions, though it can also prevent necessary action.'
                    WHEN i = 4 THEN 'Researchers highlight how unexpected coalitions can emerge when traditional party lines don''t capture the full complexity of an issue.'
                    WHEN i = 5 THEN 'Analysts note that some crises evolve beyond their original scope, requiring adaptive governance approaches and sometimes new leadership.'
                END,
                CASE 
                    WHEN i = 1 THEN ARRAY['Compromise requires understanding all stakeholders'' core interests', 'Democratic processes can produce win-win solutions', 'Skilled negotiation is essential for governance']
                    WHEN i = 2 THEN ARRAY['Perfect solutions are rare in democracy', 'Trade-offs are inherent in political decision-making', 'Progress often comes incrementally']
                    WHEN i = 3 THEN ARRAY['Democratic systems can sometimes prevent action', 'Polarization makes governance more difficult', 'Some problems require sustained effort over time']
                    WHEN i = 4 THEN ARRAY['Creative solutions can emerge from democratic processes', 'Traditional political alignments don''t always predict outcomes', 'Grassroots movements can reshape political possibilities']
                    WHEN i = 5 THEN ARRAY['Political crises can escalate beyond initial scope', 'Adaptive leadership is crucial in complex situations', 'Some problems require fundamental changes in approach']
                END,
                CASE 
                    WHEN i = 1 THEN ARRAY['How do you balance competing interests in your community?', 'What makes a political compromise successful?', 'When should leaders prioritize consensus over their preferred outcomes?']
                    WHEN i = 2 THEN ARRAY['Are partial solutions better than no solutions?', 'How do you evaluate trade-offs in policy decisions?', 'What role should perfect be the enemy of good play in politics?']
                    WHEN i = 3 THEN ARRAY['When is gridlock beneficial vs. harmful to democracy?', 'How can citizens respond to political stalemates?', 'What are the costs of inaction in governance?']
                    WHEN i = 4 THEN ARRAY['How do unexpected political coalitions form?', 'What role can citizens play in creating new political possibilities?', 'When do traditional party lines become less relevant?']
                    WHEN i = 5 THEN ARRAY['How should leaders adapt when situations escalate beyond original scope?', 'What are the signs that a new approach is needed?', 'How can democratic systems handle complex, evolving crises?']
                END,
                CASE 
                    WHEN i = 1 THEN ARRAY['Join local government committees', 'Participate in community mediation programs', 'Attend town halls and public forums']
                    WHEN i = 2 THEN ARRAY['Engage with multiple stakeholder groups', 'Support incremental policy improvements', 'Advocate for practical solutions']
                    WHEN i = 3 THEN ARRAY['Contact representatives about urgent issues', 'Support organizations working on long-term solutions', 'Stay informed about complex policy debates']
                    WHEN i = 4 THEN ARRAY['Build cross-party relationships', 'Support issue-based coalitions', 'Look for unexpected allies on specific issues']
                    WHEN i = 5 THEN ARRAY['Support adaptive leadership', 'Stay engaged during difficult periods', 'Advocate for new approaches when current ones fail']
                END,
                ARRAY['federalism', 'separation_of_powers', 'democratic_process', 'political_parties', 'interest_groups'],
                '{"books": ["Democracy in America by Tocqueville", "The Federalist Papers"], "articles": ["Recent political science research on compromise"], "websites": ["Congressional voting records", "Policy think tank analyses"]}'::JSONB
            );
        END LOOP;
        
    END LOOP;
    
    RAISE NOTICE 'Successfully expanded all scenarios with exponentially more decisions and outcomes';
END $$;

-- =============================================================================
-- STEP 7: LOG COMPLETION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== SCENARIO TABLES AND DECISIONS EXPANSION COMPLETE ===';
    RAISE NOTICE 'Added missing tables:';
    RAISE NOTICE '  - scenario_outcomes (ending states and reflections)';
    RAISE NOTICE '  - scenario_resources (political capital, media attention, etc.)';
    RAISE NOTICE 'Exponentially expanded all scenarios with:';
    RAISE NOTICE '  - 7 additional complex situations per scenario';
    RAISE NOTICE '  - 4-8 decisions per situation (28-56 new decisions per scenario)';
    RAISE NOTICE '  - 5 different outcomes per scenario';
    RAISE NOTICE '  - Rich educational content and real-world connections';
    RAISE NOTICE 'All tables have proper RLS policies and indexes';
    RAISE NOTICE 'Scenarios now offer truly complex, multi-branching narratives';
    RAISE NOTICE '========================================================';
END $$;

COMMIT; 