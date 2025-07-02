-- =============================================================================
-- SAMPLE SCENARIO DATA FOR TESTING AND DEMONSTRATION
-- =============================================================================
-- This migration creates a complete sample scenario to demonstrate the system

BEGIN;

-- =============================================================================
-- SAMPLE SCENARIO: City Budget Crisis
-- =============================================================================

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
  'City Budget Crisis',
  'city-budget-crisis',
  'Your city faces a major budget shortfall. As the newly elected mayor, you must navigate competing interests, make tough decisions, and balance the needs of different communities while maintaining essential services.',
  'local_government',
  3,
  25,
  ARRAY[
    'Understand municipal budget processes',
    'Learn about stakeholder management in government',
    'Practice making difficult trade-off decisions',
    'Explore the impact of local government decisions on communities'
  ],
  ARRAY[
    'municipal budgets',
    'public services',
    'stakeholder engagement',
    'political compromise',
    'community impact'
  ],
  true,
  false
);

-- =============================================================================
-- SCENARIO SITUATIONS
-- =============================================================================

-- Situation 1: Budget Crisis Announcement
INSERT INTO scenario_situations (
  id,
  scenario_id,
  situation_order,
  situation_title,
  situation_description,
  context_information,
  time_pressure_seconds,
  required_resources,
  learning_notes,
  is_branching_point
) VALUES (
  '550e8400-e29b-41d4-a716-446655440101',
  '550e8400-e29b-41d4-a716-446655440001',
  1,
  'The Budget Crisis Emerges',
  'You''ve just received the preliminary budget report for next year. The city faces a $15 million shortfall due to declining tax revenues and increased infrastructure costs. Your budget director is waiting for your initial response, and word is already leaking to the press.',
  '{"deficit_amount": 15000000, "press_awareness": "low", "public_mood": "unaware", "council_support": "neutral"}',
  300,
  '{"political_capital": 0, "public_trust": 0, "media_relations": 0}',
  'This situation introduces the central conflict and sets up the resource management system.',
  true
);

-- Situation 2: Community Meeting
INSERT INTO scenario_situations (
  id,
  scenario_id,
  situation_order,
  situation_title,
  situation_description,
  context_information,
  time_pressure_seconds,
  required_resources,
  learning_notes,
  is_branching_point
) VALUES (
  '550e8400-e29b-41d4-a716-446655440102',
  '550e8400-e29b-41d4-a716-446655440001',
  2,
  'Public Town Hall Meeting',
  'You''ve called a town hall meeting to discuss the budget crisis with citizens. The auditorium is packed with residents, business owners, union representatives, and activists. Everyone wants to know how this will affect them, and tensions are running high.',
  '{"attendance": 500, "media_present": true, "union_reps": 3, "business_leaders": 8, "community_activists": 12}',
  600,
  '{"political_capital": -5, "public_trust": -10, "media_relations": 0}',
  'This situation tests communication skills and stakeholder management.',
  true
);

-- Situation 3: Council Vote
INSERT INTO scenario_situations (
  id,
  scenario_id,
  situation_order,
  situation_title,
  situation_description,
  context_information,
  time_pressure_seconds,
  required_resources,
  learning_notes,
  is_branching_point
) VALUES (
  '550e8400-e29b-41d4-a716-446655440103',
  '550e8400-e29b-41d4-a716-446655440001',
  3,
  'City Council Vote',
  'The city council is about to vote on your proposed budget cuts. You need at least 4 out of 7 council members to support your plan. Based on your previous decisions, some council members are more supportive than others.',
  '{"council_size": 7, "votes_needed": 4, "opposition_strength": "moderate"}',
  480,
  '{"political_capital": -15, "public_trust": -5, "media_relations": 5}',
  'This situation demonstrates how previous decisions affect political outcomes.',
  false
);

-- =============================================================================
-- SCENARIO CHARACTERS
-- =============================================================================

-- Character 1: Pragmatic Mayor
INSERT INTO scenario_characters (
  id,
  character_name,
  character_title,
  character_description,
  character_type,
  starting_resources,
  character_constraints,
  victory_conditions,
  inspired_by_figure_id,
  represents_stakeholder_group,
  usable_in_scenario_types
) VALUES (
  '550e8400-e29b-41d4-a716-446655440201',
  'Mayor Sarah Chen',
  'Pragmatic Reformer',
  'A former city council member with a background in public administration. Known for data-driven decisions and building coalitions across party lines.',
  'elected_official',
  '{"political_capital": 50, "public_trust": 60, "media_relations": 40, "budget_knowledge": 70}',
  ARRAY['Must maintain public services', 'Cannot raise taxes above 3%', 'Must consult with unions'],
  ARRAY['Balance the budget', 'Maintain public approval above 50%', 'Keep essential services running'],
  null,
  'moderate_democrats',
  ARRAY['local_government', 'budget_allocation', 'crisis_response']
);

-- Character 2: Progressive Activist
INSERT INTO scenario_characters (
  id,
  character_name,
  character_title,
  character_description,
  character_type,
  starting_resources,
  character_constraints,
  victory_conditions,
  inspired_by_figure_id,
  represents_stakeholder_group,
  usable_in_scenario_types
) VALUES (
  '550e8400-e29b-41d4-a716-446655440202',
  'Mayor Alex Rivera',
  'Progressive Champion',
  'A community organizer turned politician who ran on a platform of social justice and equitable resource distribution.',
  'elected_official',
  '{"political_capital": 40, "public_trust": 70, "media_relations": 50, "community_support": 80}',
  ARRAY['Cannot cut social services', 'Must prioritize low-income communities', 'Cannot compromise on environmental issues'],
  ARRAY['Protect vulnerable populations', 'Maintain progressive coalition', 'Find equitable solutions'],
  null,
  'progressive_democrats',
  ARRAY['local_government', 'budget_allocation', 'citizen_advocacy']
);

-- Character 3: Business-Friendly Mayor
INSERT INTO scenario_characters (
  id,
  character_name,
  character_title,
  character_description,
  character_type,
  starting_resources,
  character_constraints,
  victory_conditions,
  inspired_by_figure_id,
  represents_stakeholder_group,
  usable_in_scenario_types
) VALUES (
  '550e8400-e29b-41d4-a716-446655440203',
  'Mayor Michael Thompson',
  'Business Leader',
  'A successful entrepreneur who believes in running government like a business, focusing on efficiency and economic growth.',
  'elected_official',
  '{"political_capital": 60, "public_trust": 45, "media_relations": 55, "business_connections": 85}',
  ARRAY['Must maintain business confidence', 'Cannot increase business taxes', 'Must show fiscal responsibility'],
  ARRAY['Achieve budget balance', 'Maintain economic growth', 'Streamline government operations'],
  null,
  'business_community',
  ARRAY['local_government', 'budget_allocation', 'government_simulation']
);

-- =============================================================================
-- SCENARIO DECISIONS
-- =============================================================================

-- Decisions for Situation 1: Budget Crisis Announcement
INSERT INTO scenario_decisions (
  id,
  situation_id,
  decision_text,
  decision_description,
  resource_costs,
  immediate_effects,
  long_term_consequences,
  leads_to_situation_id,
  teaches_concepts,
  difficulty_modifier,
  hint_text,
  is_optimal
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440301',
  '550e8400-e29b-41d4-a716-446655440101',
  'Call for immediate transparency and public input',
  'Announce the crisis publicly and commit to involving citizens in finding solutions.',
  '{"political_capital": 10}',
  '{"public_trust": 15, "media_relations": 10}',
  '{"citizen_engagement": "high", "political_pressure": "increased"}',
  '550e8400-e29b-41d4-a716-446655440102',
  ARRAY['transparency in government', 'citizen participation', 'crisis communication'],
  0,
  'Transparency builds trust but can create pressure for difficult decisions.',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440302',
  '550e8400-e29b-41d4-a716-446655440101',
  'Work quietly with department heads first',
  'Keep the crisis internal while you develop a detailed plan with city staff.',
  '{"public_trust": 5}',
  '{"political_capital": 5, "budget_knowledge": 10}',
  '{"staff_loyalty": "high", "public_surprise": "eventual"}',
  '550e8400-e29b-41d4-a716-446655440102',
  ARRAY['administrative process', 'internal stakeholder management'],
  1,
  'Working internally first can lead to better plans but may damage trust if discovered.',
  false
),
(
  '550e8400-e29b-41d4-a716-446655440303',
  '550e8400-e29b-41d4-a716-446655440101',
  'Blame the previous administration',
  'Publicly attribute the crisis to poor financial management by your predecessor.',
  '{"media_relations": 5}',
  '{"political_capital": -5, "public_trust": -10}',
  '{"political_enemies": "increased", "credibility": "damaged"}',
  '550e8400-e29b-41d4-a716-446655440102',
  ARRAY['political accountability', 'consequences of blame'],
  -1,
  'Blame might provide short-term relief but damages long-term credibility.',
  false
);

-- Decisions for Situation 2: Community Meeting
INSERT INTO scenario_decisions (
  id,
  situation_id,
  decision_text,
  decision_description,
  resource_costs,
  immediate_effects,
  long_term_consequences,
  leads_to_situation_id,
  teaches_concepts,
  difficulty_modifier,
  hint_text,
  is_optimal
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440304',
  '550e8400-e29b-41d4-a716-446655440102',
  'Present specific budget options for community vote',
  'Offer three concrete budget scenarios and ask residents to vote on their preference.',
  '{"political_capital": 15}',
  '{"public_trust": 20, "community_support": 15}',
  '{"democratic_legitimacy": "high", "implementation_support": "strong"}',
  '550e8400-e29b-41d4-a716-446655440103',
  ARRAY['participatory democracy', 'shared decision-making', 'community ownership'],
  1,
  'Giving people real choices increases buy-in but requires following through on their decision.',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440305',
  '550e8400-e29b-41d4-a716-446655440102',
  'Focus on shared sacrifice message',
  'Emphasize that everyone must contribute to solving this crisis together.',
  '{"public_trust": 5}',
  '{"political_capital": 10, "media_relations": 5}',
  '{"unity_message": "moderate", "specific_plans": "vague"}',
  '550e8400-e29b-41d4-a716-446655440103',
  ARRAY['crisis leadership', 'unity building', 'shared responsibility'],
  0,
  'Unity messages can be inspiring but people want to know specific impacts on them.',
  false
),
(
  '550e8400-e29b-41d4-a716-446655440306',
  '550e8400-e29b-41d4-a716-446655440102',
  'Promise to find alternative revenue sources',
  'Commit to exploring new revenue options before making any cuts to services.',
  '{"political_capital": 20}',
  '{"public_trust": 10, "media_relations": -5}',
  '{"expectations": "very_high", "revenue_pressure": "extreme"}',
  '550e8400-e29b-41d4-a716-446655440103',
  ARRAY['revenue generation', 'managing expectations', 'political promises'],
  -1,
  'Promising new revenue sounds good but may be unrealistic and create higher expectations.',
  false
);

-- Decisions for Situation 3: Council Vote
INSERT INTO scenario_decisions (
  id,
  situation_id,
  decision_text,
  decision_description,
  resource_costs,
  immediate_effects,
  long_term_consequences,
  leads_to_situation_id,
  teaches_concepts,
  difficulty_modifier,
  hint_text,
  is_optimal
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440307',
  '550e8400-e29b-41d4-a716-446655440103',
  'Make last-minute compromises to secure votes',
  'Offer concessions to wavering council members to ensure your budget passes.',
  '{"political_capital": 25}',
  '{"council_support": 20}',
  '{"budget_integrity": "compromised", "council_relationships": "strengthened"}',
  null,
  ARRAY['political negotiation', 'compromise in governance', 'vote counting'],
  0,
  'Compromises can secure votes but may weaken your original plan.',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440308',
  '550e8400-e29b-41d4-a716-446655440103',
  'Stand firm on your principles',
  'Refuse to compromise and argue passionately for your original budget proposal.',
  '{"public_trust": 5}',
  '{"political_capital": -10, "media_relations": 10}',
  '{"principle_reputation": "strong", "council_relations": "strained"}',
  null,
  ARRAY['principled leadership', 'political courage', 'consequences of inflexibility'],
  1,
  'Standing firm shows integrity but may result in defeat and continued crisis.',
  false
),
(
  '550e8400-e29b-41d4-a716-446655440309',
  '550e8400-e29b-41d4-a716-446655440103',
  'Propose a phased implementation plan',
  'Suggest implementing the budget cuts gradually over 18 months instead of immediately.',
  '{"political_capital": 15}',
  '{"council_support": 15, "public_trust": 10}',
  '{"implementation_timeline": "extended", "financial_risk": "increased"}',
  null,
  ARRAY['implementation planning', 'political timing', 'gradual change management'],
  0,
  'Phased approaches can build consensus but may not solve the immediate crisis.',
  true
);

-- =============================================================================
-- SCENARIO OUTCOMES
-- =============================================================================

INSERT INTO scenario_outcomes (
  id,
  scenario_id,
  outcome_title,
  outcome_description,
  required_conditions,
  success_metrics,
  learning_summary,
  unlock_conditions
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440401',
  '550e8400-e29b-41d4-a716-446655440001',
  'Democratic Success',
  'You successfully balanced the budget while maintaining public trust and democratic participation. Your transparent approach and willingness to involve citizens in difficult decisions has strengthened democracy in your city.',
  '{"public_trust": ">60", "budget_balanced": true, "democratic_process": "strong"}',
  '{"citizen_satisfaction": 85, "budget_health": 90, "democratic_participation": 95}',
  'Effective democratic leadership requires transparency, citizen engagement, and the courage to make difficult decisions collaboratively.',
  '{"transparency_decisions": ">=2", "citizen_participation": true}'
),
(
  '550e8400-e29b-41d4-a716-446655440402',
  '550e8400-e29b-41d4-a716-446655440001',
  'Pragmatic Compromise',
  'You managed to address the budget crisis through careful negotiation and strategic compromises. While not everyone is happy, the city remains functional and most essential services are preserved.',
  '{"budget_balanced": true, "political_capital": ">20", "council_support": ">50"}',
  '{"citizen_satisfaction": 65, "budget_health": 75, "political_stability": 80}',
  'Sometimes effective governance requires finding the middle ground between competing interests.',
  '{"compromise_decisions": ">=2", "council_relations": "positive"}'
),
(
  '550e8400-e29b-41d4-a716-446655440403',
  '550e8400-e29b-41d4-a716-446655440001',
  'Crisis Continues',
  'Despite your efforts, the budget crisis remains unresolved. The city faces continued financial uncertainty, and public confidence in government has been shaken.',
  '{"budget_balanced": false, "public_trust": "<40"}',
  '{"citizen_satisfaction": 35, "budget_health": 45, "political_stability": 30}',
  'Leadership during crisis requires building consensus and making difficult but necessary decisions.',
  '{"failed_votes": ">=1", "public_trust": "low"}'
);

COMMIT; 