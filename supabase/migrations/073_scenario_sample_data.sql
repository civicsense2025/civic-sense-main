-- =============================================================================
-- COMPREHENSIVE SCENARIO SAMPLE DATA MIGRATION
-- =============================================================================
-- This migration creates detailed, multi-step scenario data with complex
-- decision trees and realistic political simulations

BEGIN;

-- =============================================================================
-- STEP 1: INSERT SAMPLE SCENARIOS
-- =============================================================================

-- Scenario 1: City Budget Crisis
INSERT INTO scenarios (
    id,
    scenario_title,
    scenario_slug,
    description,
    scenario_type,
    difficulty_level,
    estimated_duration_minutes,
    learning_objectives,
    key_concepts,
    is_active,
    is_premium
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'City Budget Crisis: Tough Choices Ahead',
    'city-budget-crisis',
    'The city of Riverside faces a $2.3 million budget shortfall. As different civic leaders, navigate competing demands from unions, taxpayers, businesses, and community groups to balance the budget while maintaining essential services.',
    'local_government',
    3,
    25,
    ARRAY[
        'Understand municipal finance and budget constraints',
        'Experience trade-offs in public service provision',
        'Learn about stakeholder negotiation in local government',
        'Practice democratic decision-making under pressure'
    ],
    ARRAY[
        'municipal_finance',
        'public_services',
        'democratic_participation',
        'interest_group_politics',
        'fiscal_responsibility'
    ],
    true,
    false
);

-- Scenario 2: Immigration Policy Standoff
INSERT INTO scenarios (
    id,
    scenario_title,
    scenario_slug,
    description,
    scenario_type,
    difficulty_level,
    estimated_duration_minutes,
    learning_objectives,
    key_concepts,
    is_active,
    is_premium
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'Border Crisis: Federal vs State Authority',
    'border-crisis-negotiation',
    'A humanitarian crisis at the border has sparked national debate. Navigate the complex web of federal authority, state rights, media pressure, and humanitarian concerns as different political actors seeking solutions.',
    'crisis_response',
    5,
    45,
    ARRAY[
        'Understand division of federal vs state authority',
        'Experience how media coverage influences political decisions',
        'Learn about humanitarian law and international obligations',
        'Practice coalition building across party lines'
    ],
    ARRAY[
        'federalism',
        'separation_of_powers',
        'media_influence',
        'humanitarian_law',
        'political_bargaining',
        'constitutional_law'
    ],
    true,
    true
);

-- Scenario 3: Supreme Court Confirmation Battle
INSERT INTO scenarios (
    id,
    scenario_title,
    scenario_slug,
    description,
    scenario_type,
    difficulty_level,
    estimated_duration_minutes,
    learning_objectives,
    key_concepts,
    is_active,
    is_premium
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'Supreme Court Confirmation: Shaping the Future',
    'supreme-court-confirmation',
    'A Supreme Court vacancy opens during an election year. Navigate Senate procedures, interest group pressure, and constitutional principles as different actors in the confirmation process.',
    'negotiation',
    4,
    35,
    ARRAY[
        'Understand the judicial nomination process',
        'Experience how Senate rules affect outcomes',
        'Learn about judicial philosophy and constitutional interpretation',
        'Practice strategic political decision-making'
    ],
    ARRAY[
        'judicial_branch',
        'senate_procedures',
        'constitutional_interpretation',
        'separation_of_powers',
        'political_strategy',
        'checks_and_balances'
    ],
    true,
    false
);

-- =============================================================================
-- STEP 2: INSERT CHARACTERS FOR EACH SCENARIO
-- =============================================================================

-- Characters for City Budget Crisis
INSERT INTO scenario_characters (
    id,
    character_name,
    character_title,
    character_type,
    starting_resources,
    character_constraints,
    victory_conditions,
    represents_stakeholder_group,
    usable_in_scenario_types
) VALUES 
(
    '660e8400-e29b-41d4-a716-446655440001',
    'Mayor Sarah Chen',
    'Mayor of Riverside',
    'elected_official',
    '{"political_capital": 80, "public_support": 70, "time_remaining": 5}',
    ARRAY['Must maintain coalition support', 'Limited by city charter', 'Facing re-election pressure'],
    ARRAY['Balance budget without major service cuts', 'Maintain public support above 60%', 'Avoid tax increases'],
    'municipal_leadership',
    ARRAY['local_government', 'crisis_response']
),
(
    '660e8400-e29b-41d4-a716-446655440002',
    'Council Member Rodriguez',
    'City Council Member (District 3)',
    'elected_official',
    '{"political_capital": 60, "union_support": 90, "time_remaining": 5}',
    ARRAY['Strong union ties', 'Represents working-class district', 'Limited budget expertise'],
    ARRAY['Protect city worker jobs', 'Maintain essential services', 'Represent constituent interests'],
    'organized_labor',
    ARRAY['local_government', 'negotiation']
),
(
    '660e8400-e29b-41d4-a716-446655440003',
    'Business Leader Martinez',
    'Chamber of Commerce President',
    'business_leader',
    '{"economic_influence": 85, "media_access": 75, "time_remaining": 5}',
    ARRAY['Represents business interests', 'Limited formal authority', 'Must balance member demands'],
    ARRAY['Keep taxes low', 'Maintain business-friendly environment', 'Ensure economic development'],
    'business_community',
    ARRAY['local_government', 'economic_policy']
),
(
    '660e8400-e29b-41d4-a716-446655440004',
    'Community Activist Johnson',
    'Riverside Community Coalition Director',
    'activist',
    '{"grassroots_support": 95, "media_attention": 60, "time_remaining": 5}',
    ARRAY['Limited formal power', 'Depends on volunteer support', 'Multiple competing priorities'],
    ARRAY['Protect social services', 'Ensure equitable budget cuts', 'Maintain community programs'],
    'community_groups',
    ARRAY['local_government', 'social_justice']
);

-- Characters for Border Crisis
INSERT INTO scenario_characters (
    id,
    character_name,
    character_title,
    character_type,
    starting_resources,
    character_constraints,
    victory_conditions,
    represents_stakeholder_group,
    usable_in_scenario_types
) VALUES 
(
    '660e8400-e29b-41d4-a716-446655440005',
    'Governor Williams',
    'Governor of Texas',
    'elected_official',
    '{"state_authority": 90, "federal_cooperation": 30, "media_attention": 85}',
    ARRAY['Limited federal immigration authority', 'Pressure from state legislature', 'Constitutional constraints'],
    ARRAY['Resolve crisis while maintaining state authority', 'Protect state interests', 'Maintain political support'],
    'state_government',
    ARRAY['crisis_response', 'federalism_conflicts']
),
(
    '660e8400-e29b-41d4-a716-446655440006',
    'Director Rodriguez',
    'Federal Immigration Director',
    'bureaucrat',
    '{"federal_authority": 95, "congressional_support": 40, "agency_coordination": 60}',
    ARRAY['Congressional oversight', 'Legal challenges', 'Limited resources'],
    ARRAY['Address humanitarian needs', 'Follow federal law', 'Coordinate effective response'],
    'federal_executive',
    ARRAY['crisis_response', 'federal_policy']
),
(
    '660e8400-e29b-41d4-a716-446655440007',
    'Senator Vasquez',
    'Senate Majority Whip',
    'elected_official',
    '{"political_capital": 75, "senate_relationships": 85, "media_access": 70}',
    ARRAY['Filibuster rules', 'Party divisions', 'Election pressures'],
    ARRAY['Pass meaningful legislation', 'Build bipartisan coalition', 'Address root causes'],
    'congressional_leadership',
    ARRAY['negotiation', 'legislative_process']
);

-- Characters for Supreme Court Confirmation
INSERT INTO scenario_characters (
    id,
    character_name,
    character_title,
    character_type,
    starting_resources,
    character_constraints,
    victory_conditions,
    represents_stakeholder_group,
    usable_in_scenario_types
) VALUES 
(
    '660e8400-e29b-41d4-a716-446655440008',
    'Senator Thompson',
    'Senate Majority Leader',
    'elected_official',
    '{"procedural_control": 95, "party_unity": 70, "media_platform": 80}',
    ARRAY['Senate rules', 'Moderate members', 'Public opinion'],
    ARRAY['Confirm nominee', 'Maintain party unity', 'Follow constitutional process'],
    'senate_leadership',
    ARRAY['negotiation', 'judicial_process']
),
(
    '660e8400-e29b-41d4-a716-446655440009',
    'Senator Davis',
    'Swing Vote Senator',
    'elected_official',
    '{"decisive_vote": 100, "media_attention": 90, "bipartisan_credibility": 85}',
    ARRAY['State pressures', 'Party expectations', 'Judicial qualifications'],
    ARRAY['Make principled decision', 'Serve constitutional interests', 'Represent constituents'],
    'moderate_republicans',
    ARRAY['negotiation', 'judicial_process']
),
(
    '660e8400-e29b-41d4-a716-446655440010',
    'Director Kim',
    'Constitutional Rights Organization',
    'activist',
    '{"membership_mobilization": 80, "research_capacity": 85, "coalition_partners": 70}',
    ARRAY['Limited access', 'Funding pressures', 'Member expectations'],
    ARRAY['Influence confirmation outcome', 'Protect constitutional rights', 'Mobilize public opinion'],
    'civil_rights_groups',
    ARRAY['judicial_process', 'advocacy']
);

-- =============================================================================
-- STEP 3: CREATE SITUATIONS FOR CITY BUDGET CRISIS
-- =============================================================================

-- City Budget Crisis Situations
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
) VALUES 
(
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Budget Crisis Revealed',
    'The city finance director has just announced a $2.3 million shortfall in next year''s budget. The news is about to break publicly, and you have 48 hours before the city council meeting where solutions must be presented.',
    'Riverside has been struggling with declining tax revenue due to business closures and increased costs for infrastructure maintenance. Federal COVID relief funds are expiring, creating a perfect storm.',
    1,
    300,
    4,
    ARRAY['660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004'],
    '{}'
),
(
    '770e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Stakeholder Pressure Mounts',
    'Word has leaked about the budget crisis. Your phone is ringing non-stop with calls from union leaders, business owners, and community groups. Each group is demanding their priorities be protected. A town hall meeting has been scheduled for tomorrow night.',
    'The local newspaper ran a front-page story this morning. Social media is buzzing with concerns about potential service cuts and tax increases. The pressure is mounting for quick action.',
    2,
    240,
    5,
    ARRAY['660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004'],
    '{}'
),
(
    '770e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'The Town Hall Showdown',
    'The town hall is packed with angry citizens. Union members are chanting "No cuts to workers!" while business leaders demand "No new taxes!" Community activists are calling for equity in any cuts. You must present your approach to solving the crisis.',
    'Over 300 people have packed into the civic center. Local TV news is covering the meeting live. Your decisions here will significantly impact public opinion and your ability to build consensus.',
    3,
    180,
    5,
    ARRAY['660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004'],
    '{}'
),
(
    '770e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440001',
    'Coalition Building',
    'After the heated town hall, you need to build a coalition to support your budget solution. Different stakeholders are willing to compromise, but only if their core interests are protected. Time is running out before the council vote.',
    'You have 24 hours before the city council votes on the budget. You need at least 4 of 7 council members to support your plan. Each council member represents different constituencies with competing interests.',
    4,
    300,
    4,
    ARRAY['660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004'],
    '{}'
),
(
    '770e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440001',
    'The Final Vote',
    'It''s the night of the city council vote. The chamber is packed with supporters and opponents of various budget proposals. The council members are ready to vote, but last-minute lobbying could still sway undecided members.',
    'Three different budget proposals are on the table. The outcome will determine not only the city''s financial future but also the political future of everyone involved. Every vote counts.',
    5,
    120,
    5,
    ARRAY['660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004'],
    '{}'
);

-- =============================================================================
-- STEP 4: CREATE DECISIONS FOR CITY BUDGET CRISIS
-- =============================================================================

-- Decisions for Situation 1: Budget Crisis Revealed
INSERT INTO scenario_decisions (
    id,
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
) VALUES 
(
    '880e8400-e29b-41d4-a716-446655440001',
    '770e8400-e29b-41d4-a716-446655440001',
    'Call Emergency Meeting with All Stakeholders',
    'Immediately convene a meeting with union leaders, business representatives, and community groups to discuss the crisis openly and seek collaborative solutions.',
    1,
    '{"political_capital": -10, "time_remaining": -1}',
    '{"transparency": 20, "stakeholder_trust": 15, "media_attention": 10}',
    ARRAY['democratic_participation', 'transparency'],
    'Many cities have used stakeholder engagement to address budget crises',
    2,
    '770e8400-e29b-41d4-a716-446655440002'
),
(
    '880e8400-e29b-41d4-a716-446655440002',
    '770e8400-e29b-41d4-a716-446655440001',
    'Develop Internal Solutions First',
    'Work with city staff to develop detailed budget proposals before involving external stakeholders, maintaining control over the narrative and solutions.',
    2,
    '{"time_remaining": -1}',
    '{"control": 15, "staff_trust": 10, "stakeholder_trust": -5}',
    ARRAY['executive_leadership', 'strategic_planning'],
    'Top-down budget planning is common in municipal government',
    0,
    '770e8400-e29b-41d4-a716-446655440002'
),
(
    '880e8400-e29b-41d4-a716-446655440003',
    '770e8400-e29b-41d4-a716-446655440001',
    'Seek State Emergency Assistance',
    'Contact state officials to explore emergency funding options or special legislation to address the budget crisis.',
    3,
    '{"political_capital": -15, "time_remaining": -2}',
    '{"state_attention": 20, "local_autonomy": -10, "federal_options": 5}',
    ARRAY['intergovernmental_relations', 'fiscal_federalism'],
    'Cities often seek state help during financial crises',
    -1,
    '770e8400-e29b-41d4-a716-446655440002'
);

-- More decisions for subsequent situations...
INSERT INTO scenario_decisions (
    id,
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
) VALUES 
(
    '880e8400-e29b-41d4-a716-446655440004',
    '770e8400-e29b-41d4-a716-446655440002',
    'Propose Balanced Cuts and Revenue',
    'Present a plan that includes modest service cuts, small tax increases, and efficiency improvements to share the burden across all groups.',
    1,
    '{"political_capital": -20}',
    '{"public_support": -5, "stakeholder_balance": 15}',
    ARRAY['fiscal_responsibility', 'political_compromise'],
    'Balanced approaches are common in municipal budget crises',
    1,
    '770e8400-e29b-41d4-a716-446655440003'
),
(
    '880e8400-e29b-41d4-a716-446655440005',
    '770e8400-e29b-41d4-a716-446655440002',
    'Focus on Efficiency and Reform',
    'Emphasize government efficiency, technology improvements, and administrative reforms to reduce costs without cutting services or raising taxes.',
    2,
    '{"political_capital": -5, "time_remaining": -1}',
    '{"business_support": 15, "union_concern": -10, "innovation_points": 20}',
    ARRAY['government_efficiency', 'public_management'],
    'Government reform initiatives are popular with business communities',
    2,
    '770e8400-e29b-41d4-a716-446655440003'
);

-- =============================================================================
-- STEP 5: CREATE OUTCOMES FOR SCENARIOS
-- =============================================================================

INSERT INTO scenario_outcomes (
    id,
    scenario_id,
    outcome_title,
    outcome_description,
    outcome_type,
    democratic_health_impact,
    stakeholder_satisfaction,
    historical_examples,
    key_lessons,
    discussion_questions
) VALUES 
(
    '990e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Collaborative Success',
    'Through inclusive stakeholder engagement and transparent decision-making, the city developed a balanced budget solution that maintained essential services while sharing sacrifices equitably. The process strengthened democratic participation and community trust.',
    'success',
    3,
    '{"unions": 4, "businesses": 4, "community_groups": 5, "general_public": 4}',
    ARRAY['Portland''s participatory budgeting success', 'Austin''s stakeholder engagement model'],
    ARRAY[
        'Inclusive decision-making leads to more sustainable solutions',
        'Transparency builds trust even during difficult times',
        'Shared sacrifice can strengthen community bonds'
    ],
    ARRAY[
        'How might different levels of citizen engagement affect budget outcomes?',
        'What role should business interests play in municipal decision-making?',
        'When is it appropriate for local governments to raise taxes vs. cut services?'
    ]
),
(
    '990e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Political Standoff',
    'Unable to build sufficient consensus, the city council deadlocked on budget solutions. The crisis deepened as essential services faced cuts and political relationships deteriorated. External intervention became necessary.',
    'failure',
    -2,
    '{"unions": 2, "businesses": 2, "community_groups": 2, "general_public": 1}',
    ARRAY['Detroit''s financial crisis', 'Stockton''s bankruptcy'],
    ARRAY[
        'Political deadlock can worsen fiscal crises',
        'Lack of stakeholder engagement undermines democratic governance',
        'External intervention may be needed when local democracy fails'
    ],
    ARRAY[
        'What are the consequences when democratic institutions fail to function?',
        'How can communities prevent political deadlock during crises?',
        'What role should state government play in local fiscal crises?'
    ]
);

-- Add Border Crisis situations (abbreviated)
INSERT INTO scenario_situations (
    id,
    scenario_id,
    situation_title,
    situation_description,
    background_context,
    situation_order,
    time_limit_seconds,
    pressure_level,
    available_to_characters
) VALUES 
(
    '770e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440002',
    'Crisis at the Border',
    'Reports are flooding in about overcrowded detention facilities and families separated at the border. National media is covering the story extensively, and pressure is mounting for immediate federal action.',
    'A surge in asylum seekers has overwhelmed border processing facilities. State and federal agencies are pointing fingers at each other while humanitarian conditions deteriorate.',
    1,
    300,
    5,
    ARRAY['660e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440007']
);

-- =============================================================================
-- STEP 6: CREATE SCENARIO RESOURCES
-- =============================================================================

INSERT INTO scenario_resources (
    id,
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
    'aa0e8400-e29b-41d4-a716-446655440001',
    'political_capital',
    'Political Capital',
    'Your ability to influence others and get things done in the political arena',
    'finite',
    75,
    100,
    'crown',
    'blue',
    'Political capital represents trust, relationships, and influence that politicians build and spend',
    ARRAY['Using favors to pass legislation', 'Spending goodwill on controversial decisions', 'Building coalitions through relationships']
),
(
    'aa0e8400-e29b-41d4-a716-446655440002',
    'public_support',
    'Public Support',
    'How much the general public trusts and approves of your actions',
    'renewable',
    70,
    100,
    'heart',
    'red',
    'Public approval ratings that can rise and fall based on decisions and events',
    ARRAY['Presidential approval ratings', 'Mayor popularity polls', 'City council election results']
),
(
    'aa0e8400-e29b-41d4-a716-446655440003',
    'media_attention',
    'Media Attention',
    'The level of media focus on your actions, which can be positive or negative',
    'influence',
    50,
    100,
    'megaphone',
    'purple',
    'Media coverage that can amplify your message or create scrutiny',
    ARRAY['Press conferences', 'News interviews', 'Social media presence']
),
(
    'aa0e8400-e29b-41d4-a716-446655440004',
    'time_remaining',
    'Time Pressure',
    'How much time you have left to make decisions before deadlines',
    'finite',
    5,
    10,
    'clock',
    'orange',
    'The pressure of political deadlines and the need to act quickly',
    ARRAY['Legislative session deadlines', 'Election timelines', 'Crisis response windows']
);

-- =============================================================================
-- STEP 7: LOG COMPLETION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== SCENARIO SAMPLE DATA CREATED ===';
    RAISE NOTICE 'Created 3 comprehensive scenarios:';
    RAISE NOTICE '  1. City Budget Crisis (local government)';
    RAISE NOTICE '  2. Border Crisis (federal/state conflict)';
    RAISE NOTICE '  3. Supreme Court Confirmation (judicial process)';
    RAISE NOTICE 'Each scenario includes:';
    RAISE NOTICE '  - Multiple characters with different perspectives';
    RAISE NOTICE '  - Multi-step decision trees';
    RAISE NOTICE '  - Various outcomes based on choices';
    RAISE NOTICE '  - Educational objectives and real-world connections';
    RAISE NOTICE '========================================';
END $$;

COMMIT; 