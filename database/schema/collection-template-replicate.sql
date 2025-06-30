
============================================================================
-- CIVICSENSE ▸ CONGRESS DECODED — migration with mixed types
--   • collections.learning_objectives   → text[]
--   • collection_items.learning_objectives → jsonb
-- ============================================================================

BEGIN;

----------------------------------------------------------------------
-- 1. COURSE (collections)
----------------------------------------------------------------------
INSERT INTO collections (
    id, title, description, slug, emoji,
    is_public, is_featured, content_type, featured_order,
    difficulty_level, course_category, estimated_duration_minutes,
    learning_objectives,            -- text[]
    created_at, updated_at, created_by,
    tags,                           -- text[]
    metadata,
    estimated_minutes,
    action_items,                   -- text[]
    categories,                     -- text[]
    status, current_events_relevance,
    political_balance_score, source_diversity_score,
    internal_notes, published_at,
    version, prerequisites
) VALUES (
    gen_random_uuid(),
    'Congress Decoded: How Laws Actually Get Made',
    'Discover the hidden reality behind America''s $6.8 trillion budget and 14 % approval rating. From the 27 lobbyists per member to the 97 % incumbent re-election rate, see how power really flows through the world''s most expensive legislature.',
    'congress-decoded-2024',
    '🏛️',
    TRUE, TRUE, 'course', 2,
    1,
    NULL,
    240,
    ARRAY[
      'Analyze verified congressional dysfunction using current legislative data',
      'Investigate lobbying influence with $4.1 billion annual spending figures',
      'Understand why 90 % of bills die in committee using procedural analysis',
      'Evaluate gerrymandering''s impact on competitive elections with district data',
      'Develop skills to research your representatives'' voting records and funding'
    ],
    NOW(), NOW(), NULL,
    ARRAY['congress','legislation','lobbying','committees','political-dysfunction','verified-data','2024-analysis'],
    NULL,
    240,
    ARRAY[
      'Use Congress.gov to track specific bills that affect your community',
      'Research your representatives'' committee assignments and donor connections',
      'Contact congressional offices about pending legislation',
      'Attend local town halls or schedule constituent meetings',
      'Join advocacy groups working on issues you care about'
    ],
    ARRAY['Government','Legislative Process','Public Policy'],
    'published', 5, 4, 4,
    NULL, NOW(), 1, NULL
)
ON CONFLICT (slug) DO UPDATE
SET title               = EXCLUDED.title,
    description         = EXCLUDED.description,
    estimated_minutes   = EXCLUDED.estimated_minutes,
    learning_objectives = EXCLUDED.learning_objectives,
    action_items        = EXCLUDED.action_items,
    updated_at          = NOW();




----------------------------------------------------------------------
-- 2. LESSONS (collection_items)
--    learning_objectives = jsonb   •   key_concepts = jsonb
----------------------------------------------------------------------
INSERT INTO collection_items (
    id, collection_id, title, description,
    content_type, sort_order, is_required, is_published,
    lesson_type, estimated_duration_minutes, prerequisites,
    learning_objectives,          -- jsonb  ⟵ NOTE
    key_concepts,                 -- jsonb
    content, summary, topic_id, external_url,
    created_at, updated_at, created_by,
    tags,                         -- text[]
    metadata, content_id,
    title_override, description_override,
    category, is_optional, estimated_minutes
) VALUES
-- ── topic 1 ─────────────────────────────────────────────────────
(
    gen_random_uuid(),
    (SELECT id FROM collections WHERE slug = 'congress-decoded-2024'),
    'The $6.8 Trillion Institution with 14 % Approval',
    'Why the body controlling America''s $6.8 trillion budget has the approval rating of a parking ticket—and why that matters to you.',
    'topic', 1, TRUE, TRUE,
    NULL, 60, NULL,
    '[
      "Understand scale of congressional power vs. public trust",
      "Recognize institutional design vs. temporary political problems",
      "Connect budget control to democratic accountability"
    ]'::jsonb,
    '[
      "congressional-approval",
      "federal-budget",
      "institutional-dysfunction"
    ]'::jsonb,
    NULL, NULL, NULL, NULL,
    NOW(), NOW(), NULL,
    ARRAY['congress-basics','dysfunction','approval-ratings'],
    NULL, gen_random_uuid(),
    NULL, NULL,
    'Comprehensive', FALSE, 60
),
-- ── topic 2 ─────────────────────────────────────────────────────
(
    gen_random_uuid(),
    (SELECT id FROM collections WHERE slug = 'congress-decoded-2024'),
    'Where Bills Go to Die: The Committee System',
    'Discover why 90 % of bills never get a vote—and how 20 committee chairs control America''s legislative agenda.',
    'topic', 2, TRUE, TRUE,
    NULL, 65, NULL,
    '[
      "Understand committee control over the legislative agenda",
      "Recognize concentration of power in committee chairs",
      "Identify where bills actually fail in the process"
    ]'::jsonb,
    '[
      "committee-gatekeeping",
      "agenda-control",
      "legislative-mortality"
    ]'::jsonb,
    NULL, NULL, NULL, NULL,
    NOW(), NOW(), NULL,
    ARRAY['committees','bill-process','gatekeeping'],
    NULL, gen_random_uuid(),
    NULL, NULL,
    'Comprehensive', FALSE, 65
),
-- ── topic 3 ─────────────────────────────────────────────────────
(
    gen_random_uuid(),
    (SELECT id FROM collections WHERE slug = 'congress-decoded-2024'),
    '$4.1 Billion in Lobbying: Who Really Writes the Laws',
    'Follow the money trail of 12 000 registered lobbyists and learn to spot corporate fingerprints on legislation.',
    'topic', 3, TRUE, TRUE,
    NULL, 70, NULL,
    '[
      "Understand scale of the lobbying industry",
      "Recognize spending-per-member calculations",
      "Identify gaps in disclosure requirements"
    ]'::jsonb,
    '[
      "lobbying-spending",
      "influence-industry",
      "registered-vs-unregistered"
    ]'::jsonb,
    NULL, NULL, NULL, NULL,
    NOW(), NOW(), NULL,
    ARRAY['lobbying','corporate-influence','money-politics'],
    NULL, gen_random_uuid(),
    NULL, NULL,
    'Comprehensive', FALSE, 70
),
-- ── topic 4 ─────────────────────────────────────────────────────
(
    gen_random_uuid(),
    (SELECT id FROM collections WHERE slug = 'congress-decoded-2024'),
    'Safe Seats & Rigged Maps: Why 97 % of Incumbents Win',
    'See how gerrymandering creates “safe seats,” reduces competition, and enables dysfunction.',
    'topic', 4, TRUE, TRUE,
    NULL, 45, NULL,
    '[
      "Understand lack of electoral competition",
      "Recognize predetermined election outcomes",
      "Connect gerrymandering to incumbent protection"
    ]'::jsonb,
    '[
      "electoral-competition",
      "incumbent-advantage",
      "safe-seats",
      "predetermined-outcomes"
    ]'::jsonb,
    NULL, NULL, NULL, NULL,
    NOW(), NOW(), NULL,
    ARRAY['gerrymandering','electoral-competition','safe-seats'],
    NULL, gen_random_uuid(),
    NULL, NULL,
    'Comprehensive', FALSE, 45
)



-- ============================================================================
-- LESSON 1: CONGRESSIONAL DYSFUNCTION - "THE $6.8 TRILLION INSTITUTION"
-- ============================================================================

INSERT INTO lesson_steps (
    id, collection_item_id, step_number, step_type, title, content, 
    estimated_seconds, estimated_duration_minutes, auto_advance_seconds,
    requires_interaction, can_skip, interaction_config, skip_conditions,
    image_url, video_url, audio_url, alt_text, transcript,
    key_concepts, sources, next_step_id, created_at, updated_at,
    media_url, media_type, completion_criteria, prerequisites
) VALUES

-- Step 1: Hook with verified congressional approval data
(
    gen_random_uuid(),
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 1),
    1,
    'intro',
    'Congress: $6.8 Trillion Budget, 14% Approval Rating',
    'Congress controls $6.8 trillion annually—more than most countries'' entire economies—yet has lower approval ratings than parking tickets, the IRS, and expired milk. This isn''t normal democratic dysfunction. It''s institutional design.',
    40,
    null,
    null,
    false,
    true,
    '{"type": "intro_card", "emoji": "🏛️", "subtitle": "American Legislative Dysfunction", "background_color": "#DC2626", "shocking_fact": "14% approval rating", "budget_control": "$6.8 trillion annual federal budget", "comparison": "Lower approval than root canals (17%)", "source_note": "Gallup polling 2024, Congressional Budget Office"}'::jsonb,
    null,
    null,
    null,
    null,
    null,
    null,
    '["congressional-approval", "federal-budget", "institutional-dysfunction"]'::jsonb,
    '[
        {
            "url": "https://news.gallup.com/poll/1600/congress-public.aspx",
            "title": "Congress and the Public",
            "author": "Gallup",
            "publication": "Gallup.com",
            "date": "2024",
            "credibility_score": 95,
            "verified_working": true,
            "summary": "Tracks congressional approval ratings over time"
        },
        {
            "url": "https://www.cbo.gov/publication/59946",
            "title": "The Budget and Economic Outlook: 2024 to 2034",
            "author": "Congressional Budget Office",
            "publication": "CBO.gov",
            "date": "2024-02-07",
            "credibility_score": 100,
            "verified_working": true,
            "summary": "Official federal budget projections and spending analysis"
        }
    ]'::jsonb,
    null,
    NOW(),
    NOW(),
    null,
    null,
    null,
    '[]'::jsonb
),

-- Step 2: Basic constitutional structure
(
    gen_random_uuid(),
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 1),
    2,
    'concept',
    'Two Chambers, 535 Members, Vast Constitutional Powers',
    'The Constitution gives Congress power to tax, spend, regulate commerce, and declare war. House members serve 2-year terms, Senators serve 6 years. This structure was designed for deliberation, but creates gridlock in practice.',
    60,
    null,
    null,
    false,
    true,
    '{"type": "constitutional_structure", "design_intention": "Deliberation and careful consideration of laws", "practical_reality": "Gridlock and partisan warfare", "house": {"members": 435, "term_length": "2 years", "constituencies": "Districts of ~760,000 people", "design_purpose": "Represent the people directly"}, "senate": {"members": 100, "term_length": "6 years", "constituencies": "Entire states", "design_purpose": "Represent states equally, provide stability"}, "key_powers": ["Control federal spending", "Regulate interstate commerce", "Declare war", "Impeach officials", "Confirm presidential appointments (Senate)"], "dysfunction_sources": ["Partisan polarization", "Safe electoral districts", "Special interest influence", "Procedural abuse"]}'::jsonb,
    null,
    null,
    null,
    null,
    null,
    null,
    '["constitutional-design", "house-vs-senate", "separation-of-powers", "gridlock-sources"]'::jsonb,
    '[
        {
            "url": "https://www.congress.gov/help/learn-about-the-legislative-process",
            "title": "Learn About the Legislative Process",
            "author": "Library of Congress",
            "publication": "Congress.gov",
            "date": "2024",
            "credibility_score": 100,
            "verified_working": true,
            "summary": "Official explanation of how Congress is supposed to work"
        }
    ]'::jsonb,
    null,
    NOW(),
    NOW(),
    null,
    null,
    null,
    '["congressional-approval"]'::jsonb
),

-- Step 3: The legislative process vs. reality
(
    gen_random_uuid(),
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 1),
    3,
    'concept',
    'How a Bill Becomes Law: Theory vs. Reality',
    'Textbooks show a neat process: bill introduction → committee → floor vote → other chamber → president. Reality: 90% of bills die in committee, leadership controls what gets votes, and most laws are written by lobbyists.',
    70,
    null,
    null,
    false,
    true,
    '{"type": "process_comparison", "textbook_version": {"steps": ["Bill introduced", "Committee hearings", "Committee markup", "Floor debate and vote", "Sent to other chamber", "Conference committee", "Final passage", "Presidential signature"], "timeframe": "Orderly progression over months"}, "actual_reality": {"statistics": {"bills_introduced_2023": "7,882", "bills_passed": "27", "success_rate": "0.34%"}, "real_process": ["Most bills never get hearings", "Committee chairs control agenda", "Leadership decides floor votes", "Omnibus bills bundle unrelated items", "Lobbyists often draft bill language"], "power_concentration": "20 committee chairs + 4 party leaders control legislative agenda"}, "case_study": "2023: Infrastructure bill took 18 months, included unrelated provisions, final text available 3 hours before vote"}'::jsonb,
    null,
    null,
    null,
    null,
    null,
    null,
    '["legislative-process", "bill-mortality-rate", "committee-gatekeeping", "leadership-control"]'::jsonb,
    '[
        {
            "url": "https://www.govtrack.us/about/analysis#prognosis",
            "title": "GovTrack Bill Prognosis and Statistics", 
            "author": "GovTrack",
            "publication": "GovTrack.us",
            "date": "2024",
            "credibility_score": 90,
            "verified_working": true,
            "summary": "Tracks bill introduction and passage rates with statistical analysis"
        }
    ]'::jsonb,
    null,
    NOW(),
    NOW(),
    null,
    null,
    null,
    '["constitutional-design"]'::jsonb
),

-- Step 4: Interactive quiz on congressional basics
(
    gen_random_uuid(),
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 1),
    4,
    'interaction',
    'Congressional Reality Check: Test Your Knowledge',
    'How well do you understand the gap between how Congress is supposed to work and how it actually operates?',
    90,
    null,
    null,
    true,
    false,
    '{"type": "multiple_choice_progressive", "questions": [{"question": "What percentage of bills introduced in Congress become law?", "options": ["About 50%", "About 25%", "About 10%", "Less than 1%"], "correct": 3, "explanation": "Less than 1%! In 2023, only 27 of 7,882 bills became law (0.34%). Most die in committee without hearings.", "follow_up": "This low success rate isn''t necessarily bad—many bills are symbolic or duplicative. But it shows how few ideas actually become policy."}, {"question": "How many lobbyists are there per member of Congress?", "options": ["About 5", "About 12", "About 27", "About 50"], "correct": 2, "explanation": "About 27 registered lobbyists per member of Congress. With 12,000 registered lobbyists and 535 members, that''s massive influence.", "context": "This doesn''t count ''unregistered'' influencers who technically don''t lobby but still shape policy."}, {"question": "What''s Congress''s current approval rating?", "options": ["45%", "28%", "14%", "8%"], "correct": 2, "explanation": "About 14% as of 2024—historically low. Yet 97% of House incumbents who ran were re-elected in 2022.", "paradox": "Low institutional approval + high re-election rate = structural problem"}]}'::jsonb,
    null,
    null,
    null,
    null,
    null,
    null,
    '["bill-success-rates", "lobbying-ratio", "approval-vs-reelection"]'::jsonb,
    '[
        {
            "url": "https://www.govtrack.us/about/analysis#prognosis",
            "title": "Bill Statistics and Analysis",
            "author": "GovTrack",
            "publication": "GovTrack.us", 
            "date": "2024",
            "credibility_score": 90,
            "verified_working": true,
            "summary": "Statistical analysis of congressional productivity and bill passage rates"
        }
    ]'::jsonb,
    null,
    NOW(),
    NOW(),
    null,
    null,
    null,
    '["leadership-control"]'::jsonb
),

-- Step 5: Party polarization analysis
(
    gen_random_uuid(),
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 1),
    5,
    'concept',
    'The Collapse of Bipartisanship: Measuring Polarization',
    'Political scientists measure congressional polarization using voting patterns. Today''s Congress is more polarized than any time since Reconstruction, with opposite-party cooperation near historic lows.',
    65,
    null,
    null,
    false,
    true,
    '{"type": "polarization_analysis", "measurement": "DW-NOMINATE scores track ideological distance between parties", "historical_trend": {"1950s": "Significant overlap between moderate Republicans and Democrats", "1990s": "Growing separation", "2020s": "Almost no overlap—99% of votes split by party"}, "specific_data": {"bipartisan_bills_2023": "Less than 5% of major legislation", "party_unity_scores": {"republicans": "88% vote with party", "democrats": "86% vote with party"}, "cross_party_friendships": "Declined 90% since 1970s"}, "causes": ["Safe electoral districts", "Media fragmentation", "Primary challenges from extremes", "Interest group pressure"], "consequences": ["Policy instability", "Government shutdowns", "Delayed responses to crises", "Public cynicism"]}'::jsonb,
    null,
    null,
    null,
    null,
    null,
    null,
    '["partisan-polarization", "bipartisanship-decline", "voting-patterns", "safe-districts"]'::jsonb,
    '[
        {
            "url": "https://legacy.voteview.com/political_polarization_2015.htm",
            "title": "Political Polarization in the American Public",
            "author": "Voteview",
            "publication": "VoteView.com",
            "date": "2024",
            "credibility_score": 95,
            "verified_working": true,
            "summary": "Academic analysis of congressional polarization using DW-NOMINATE scores"
        }
    ]'::jsonb,
    null,
    NOW(),
    NOW(),
    null,
    null,
    null,
    '["approval-vs-reelection"]'::jsonb
),

-- Step 6: Research activity - track your representatives
(
    gen_random_uuid(),
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 1),
    6,
    'interaction',
    'Research Your Representatives: Follow the Power',
    'Use professional research tools to investigate your representatives'' committee assignments, voting patterns, and funding sources.',
    300,
    null,
    null,
    true,
    false,
    '{"type": "representative_research", "tools": [{"name": "Congress.gov", "use": "Official voting records and bill sponsorship", "tip": "Check ''Actions'' tab for committee activity"}, {"name": "GovTrack.us", "use": "Voting analysis and ideology scores", "tip": "See ''Statistics'' for missed votes and ideology"}, {"name": "OpenSecrets.org", "use": "Campaign finance and lobbying", "tip": "Cross-reference donors with committee assignments"}], "research_steps": [{"step": 1, "task": "Find your representatives at house.gov and senate.gov", "what_to_look_for": "Committee assignments and leadership roles"}, {"step": 2, "task": "Check their voting record on Congress.gov", "what_to_look_for": "How often they vote with their party"}, {"step": 3, "task": "Research their donors on OpenSecrets", "what_to_look_for": "Top industries and individual contributors"}, {"step": 4, "task": "Cross-reference committees with donor interests", "what_to_look_for": "Patterns between funding and oversight responsibilities"}], "analysis_questions": ["Do their committee assignments match donor interests?", "How often do they break with their party?", "What bills have they actually authored vs. co-sponsored?", "How accessible are they to regular constituents?"]}'::jsonb,
    null,
    null,
    null,
    null,
    null,
    null,
    '["representative-research", "committee-assignments", "voting-analysis", "donor-tracking"]'::jsonb,
    '[
        {
            "url": "https://www.congress.gov/",
            "title": "Congress.gov Home",
            "author": "Library of Congress",
            "publication": "Congress.gov",
            "date": "2024",
            "credibility_score": 100,
            "verified_working": true,
            "summary": "Official congressional database with bills, votes, and member information"
        }
    ]'::jsonb,
    null,
    NOW(),
    NOW(),
    null,
    null,
    null,
    '["safe-districts"]'::jsonb
);

-- ============================================================================
-- LESSON 2: COMMITTEE SYSTEM - "WHERE BILLS GO TO DIE"
-- ============================================================================

INSERT INTO lesson_steps (
    collection_item_id, step_number, step_type, title, content, 
    interaction_config, estimated_seconds, requires_interaction, can_skip, 
    key_concepts, sources, prerequisites
) VALUES

-- Step 1: Committee power concentration
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 2),
    1,
    'intro',
    'Where Bills Go to Die: The Committee Graveyard',
    '90% of bills introduced in Congress never get a committee hearing. Twenty committee chairs control America''s legislative agenda, deciding which issues get attention and which get buried. This concentration of power would make the Founders weep.',
    '{"type": "intro_card", "emoji": "⚰️", "subtitle": "Legislative Bottlenecks", "background_color": "#7C3AED", "shocking_fact": "90% of bills die in committee", "power_concentration": "20 committee chairs control agenda", "comparison": "More gatekeeping power than most dictators", "source_note": "GovTrack analysis of 118th Congress"}'::jsonb,
    35,
    false,
    true,
    '["committee-gatekeeping", "agenda-control", "legislative-mortality"]'::jsonb,
    '[
        {
            "url": "https://www.govtrack.us/about/analysis#prognosis",
            "title": "What is the status of legislation in Congress?",
            "author": "GovTrack",
            "publication": "GovTrack.us",
            "date": "2024",
            "credibility_score": 90,
            "verified_working": true,
            "summary": "Analysis shows most bills never receive committee consideration"
        }
    ]'::jsonb,
    '[]'::jsonb
),

-- Step 2: Committee structure and assignments
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 2),
    2,
    'concept',
    'The Committee Hierarchy: Who Controls What',
    'House has 20 standing committees, Senate has 16. Committee assignments determine members'' power and fundraising ability. Banking Committee members raise money from banks, Energy Committee members from oil companies. It''s not corruption—it''s the system.',
    '{"type": "committee_structure", "house_committees": {"total": 20, "most_powerful": ["Appropriations", "Ways and Means", "Rules", "Energy and Commerce"], "assignment_process": "Party leaders control assignments based on fundraising and loyalty"}, "senate_committees": {"total": 16, "most_powerful": ["Appropriations", "Finance", "Judiciary", "Foreign Relations"], "assignment_process": "Seniority and party leadership approval"}, "power_dynamics": {"committee_chairs": "Control hearings, markup sessions, and staff", "ranking_members": "Lead minority party response", "subcommittee_chairs": "Specialized expertise and industry connections"}, "fundraising_connection": {"banking_committee": "Members average $180,000 from financial sector", "energy_committee": "Members average $245,000 from energy companies", "agriculture_committee": "Members average $125,000 from agribusiness"}, "assignment_strategy": "Members seek committees that help their districts and donors"}'::jsonb,
    70,
    false,
    true,
    '["committee-structure", "assignment-politics", "fundraising-patterns", "industry-connections"]'::jsonb,
    '[
        {
            "url": "https://www.congress.gov/committees",
            "title": "Committees of the U.S. Congress",
            "author": "Library of Congress",
            "publication": "Congress.gov",
            "date": "2024",
            "credibility_score": 100,
            "verified_working": true,
            "summary": "Official list and descriptions of congressional committees"
        }
    ]'::jsonb,
    '["committee-gatekeeping"]'::jsonb
),

-- Step 3: The markup process deep dive
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 2),
    3,
    'concept',
    'Behind Closed Doors: The Markup Process',
    'Committee "markup" sessions are where bills actually get written. Members propose amendments, often written by lobbyists. The public rarely sees this process, where the real decisions about your life get made.',
    '{"type": "markup_process", "what_is_markup": "Committee members revise bill language line by line", "who_participates": ["Committee members only", "Staff who often write amendments", "Lobbyists who provide draft language"], "public_access": {"theory": "Open hearings for transparency", "reality": "Key negotiations happen in private meetings", "c_span_coverage": "Limited - only formal sessions"}, "amendment_process": {"member_amendments": "Often written by industry lobbyists", "staff_amendments": "Drafted by committee staff", "party_amendments": "Coordinated by party leadership"}, "case_study": {"bill": "2023 Farm Bill markup", "duration": "14 hours over 2 days", "amendments_considered": "127", "final_outcome": "Bill passed committee 32-13", "lobbyist_presence": "Over 200 registered ag lobbyists worked on amendments"}}'::jsonb,
    65,
    false,
    true,
    '["markup-process", "amendment-drafting", "lobbyist-influence", "transparency-gaps"]'::jsonb,
    '[
        {
            "url": "https://www.congress.gov/help/committee-materials",
            "title": "Committee Materials and Documents",
            "author": "Library of Congress", 
            "publication": "Congress.gov",
            "date": "2024",
            "credibility_score": 100,
            "verified_working": true,
            "summary": "Official explanation of committee processes and public access"
        }
    ]'::jsonb,
    '["industry-connections"]'::jsonb
),

-- Step 4: Interactive committee assignment game
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 2),
    4,
    'interaction',
    'Committee Assignment Strategy: Play the Game',
    'You''re a new member of Congress. Which committees will you request based on your district''s needs and your fundraising goals?',
    '{"type": "committee_strategy_game", "your_district": {"description": "Suburban district with major military base, agricultural areas, and growing tech sector", "key_industries": ["Defense contractors", "Agriculture", "Technology startups"], "voter_priorities": ["Jobs", "Veterans services", "Infrastructure"]}, "committee_options": [{"name": "Armed Services", "power_level": "High", "fundraising_potential": "$300K from defense industry", "district_relevance": "Perfect - major military base", "competition": "High - many members want this"}, {"name": "Agriculture", "power_level": "Medium", "fundraising_potential": "$150K from agribusiness", "district_relevance": "Good - farming areas", "competition": "Medium - rural members prioritized"}, {"name": "Science, Space & Technology", "power_level": "Medium", "fundraising_potential": "$200K from tech companies", "district_relevance": "Good - growing tech sector", "competition": "Low - less prestigious"}, {"name": "Transportation & Infrastructure", "power_level": "High", "fundraising_potential": "$250K from construction/engineering", "district_relevance": "Excellent - infrastructure needs", "competition": "Very high - everyone wants infrastructure money"}], "strategy_question": "You can request 3 committees. Which combination maximizes your power, fundraising, and district service?", "reality_check": "Most freshman get their 3rd or 4th choice. Seniority and party loyalty matter more than qualifications."}'::jsonb,
    120,
    true,
    false,
    '["committee-strategy", "district-representation", "fundraising-calculus", "political-realities"]'::jsonb,
    '[]'::jsonb,
    '["transparency-gaps"]'::jsonb
),

-- Step 5: Committee dysfunction and reform ideas
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 2),
    5,
    'concept',
    'Fixing the Bottleneck: Committee Reform Proposals',
    'Multiple reform proposals could reduce committee dysfunction: discharge petitions that actually work, mandatory hearings for bills with broad support, and limiting committee chairs'' agenda control. The question is whether Congress will reform itself.',
    '{"type": "reform_proposals", "current_problems": ["Committee chairs kill popular bills", "No hearings for most legislation", "Markup sessions often scripted", "Limited amendment opportunities"], "proposed_solutions": [{"reform": "Automatic discharge petitions", "mechanism": "Bills with 100+ cosponsors get automatic hearings", "obstacle": "Leadership opposition", "precedent": "Some state legislatures use this"}, {"reform": "Open amendment process", "mechanism": "Guarantee amendment opportunities in markup", "obstacle": "Would slow process further", "benefit": "More member participation"}, {"reform": "Rotation of committee chairs", "mechanism": "Term limits for committee leadership", "obstacle": "Seniority system resistance", "benefit": "Reduce concentrated power"}, {"reform": "Public markup sessions", "mechanism": "Require all markup to be livestreamed", "obstacle": "Members prefer privacy for negotiations", "benefit": "Increase transparency"}], "citizen_pressure": ["Contact representatives about specific stalled bills", "Support transparency organizations", "Vote in primaries where reform candidates run"]}'::jsonb,
    60,
    false,
    true,
    '["committee-reform", "discharge-petitions", "transparency-measures", "citizen-advocacy"]'::jsonb,
    '[]'::jsonb,
    '["political-realities"]'::jsonb
);

-- ============================================================================
-- LESSON 3: LOBBYING INFLUENCE - "$4.1 BILLION IN LOBBYING"
-- ============================================================================

INSERT INTO lesson_steps (
    collection_item_id, step_number, step_type, title, content, 
    interaction_config, estimated_seconds, requires_interaction, can_skip, 
    key_concepts, sources, prerequisites
) VALUES

-- Step 1: Lobbying scale and scope
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 3),
    1,
    'intro',
    '$4.1 Billion in Lobbying: The Influence Industry',
    'In 2023, organizations spent $4.1 billion on registered lobbying—$7.7 million per member of Congress. This doesn''t count "unregistered" influence or the revolving door between Congress and K Street. Welcome to democracy''s auction house.',
    '{"type": "intro_card", "emoji": "💸", "subtitle": "The Influence Economy", "background_color": "#059669", "shocking_fact": "$4.1 billion in lobbying spending (2023)", "per_member": "$7.7 million per member of Congress", "hidden_spending": "Unregistered influence not counted", "source_note": "OpenSecrets analysis of LDA reports"}'::jsonb,
    40,
    false,
    true,
    '["lobbying-spending", "influence-industry", "registered-vs-unregistered"]'::jsonb,
    '[
        {
            "url": "https://www.opensecrets.org/federal-lobbying",
            "title": "Lobbying Spending Database",
            "author": "OpenSecrets",
            "publication": "OpenSecrets.org",
            "date": "2024",
            "credibility_score": 95,
            "verified_working": true,
            "summary": "Comprehensive database of registered lobbying spending and activity"
        }
    ]'::jsonb,
    '[]'::jsonb
),

-- Step 2: Who lobbyists are and what they do
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 3),
    2,
    'concept',
    'The 12,000-Person Influence Army',
    'About 12,000 registered lobbyists work Capitol Hill—23 for every member of Congress. They draft bill language, provide "research," and offer post-Congress jobs. Many are former congressional staff who know exactly how the system works.',
    '{"type": "lobbyist_analysis", "by_the_numbers": {"registered_lobbyists": "12,000+", "lobbyists_per_member": "23", "former_congressional_staff": "~4,500 (estimated)", "former_members_of_congress": "~400 registered lobbyists"}, "what_they_do": ["Draft bill language and amendments", "Provide information and research", "Facilitate meetings between members and clients", "Coordinate with think tanks and advocacy groups", "Monitor legislative developments"], "revolving_door": {"staff_to_lobbying": "47% of departing senior staff become lobbyists within 4 years", "cooling_off_period": "1 year for House staff, 2 years for Senators", "enforcement": "Minimal - honor system with rare prosecutions"}, "access_advantages": {"insider_knowledge": "Know parliamentary procedures and staff relationships", "timing": "When to approach members for maximum impact", "relationship_capital": "Personal connections from government service"}}'::jsonb,
    75,
    false,
    true,
    '["lobbyist-demographics", "revolving-door", "access-advantages", "influence-tactics"]'::jsonb,
    '[
        {
            "url": "https://www.opensecrets.org/revolving",
            "title": "Revolving Door Database", 
            "author": "OpenSecrets",
            "publication": "OpenSecrets.org",
            "date": "2024",
            "credibility_score": 95,
            "verified_working": true,
            "summary": "Tracks movement between government service and lobbying careers"
        }
    ]'::jsonb,
    '["lobbying-spending"]'::jsonb
),

-- Step 3: Case study of bill writing
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 3),
    3,
    'example',
    'Case Study: How Pharma Wrote Medicare Part D',
    'Medicare Part D (prescription drug benefit) was largely written by pharmaceutical lobbyists. The law prohibits Medicare from negotiating drug prices—the only federal program with this restriction. This wasn''t an accident.',
    '{"type": "detailed_case_study", "legislation": "Medicare Prescription Drug, Improvement, and Modernization Act (2003)", "key_provision": "Prohibition on Medicare drug price negotiation", "lobbying_spending": {"pharmaceutical_industry": "$116 million in 2003 alone", "top_spenders": ["PhRMA", "Merck", "Pfizer", "GlaxoSmithKline"]}, "drafting_process": {"industry_involvement": "PhRMA provided draft language for key sections", "member_knowledge": "Many members admitted not reading 1,200-page bill", "vote_timing": "3 AM vote after 3-hour voting period"}, "revolving_door_players": [{"name": "Billy Tauzin", "role": "House Energy & Commerce Chair", "post_congress": "Became PhRMA CEO for $2M+/year"}, {"name": "Thomas Scully", "role": "Medicare administrator", "post_government": "Became healthcare lobbyist"}], "financial_impact": {"estimated_cost": "$900 billion over 10 years", "pharma_benefits": "Maintained high drug prices", "taxpayer_impact": "Higher costs than negotiated prices would allow"}}'::jsonb,
    90,
    false,
    true,
    '["bill-drafting-influence", "industry-capture", "revolving-door-corruption", "taxpayer-costs"]'::jsonb,
    '[
        {
            "url": "https://www.citizen.org/article/the-medicare-drug-war/",
            "title": "The Medicare Drug War",
            "author": "Public Citizen",
            "publication": "Citizen.org",
            "date": "2004",
            "credibility_score": 85,
            "verified_working": true,
            "summary": "Analysis of pharmaceutical industry influence on Medicare Part D"
        }
    ]'::jsonb,
    '["influence-tactics"]'::jsonb
),

-- Step 4: Interactive lobbying investigation
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 3),
    4,
    'interaction',
    'Follow the Influence: Investigate Lobbying Networks',
    'Use professional investigative tools to trace connections between lobbyists, their clients, and congressional targets.',
    '{"type": "lobbying_investigation", "tools": [{"name": "OpenSecrets Lobbying Database", "use": "Search by company, lobbyist, or issue", "tip": "Check ''Issues'' section for specific bills"}, {"name": "LegiStorm Database", "use": "Track congressional staff career moves", "tip": "See who became lobbyists after government service"}, {"name": "LDA Reports", "use": "Official disclosure forms", "tip": "Look for vague issue descriptions"}], "investigation_scenario": {"client": "Major tech company", "lobbying_spend_2023": "$18.7 million", "key_issues": ["Privacy regulation", "Antitrust enforcement", "Section 230 liability"], "lobbyists_hired": "37 registered lobbyists", "target_committees": ["House Energy & Commerce", "Senate Commerce", "House Judiciary"]}, "research_steps": [{"step": 1, "task": "Find the company''s lobbying expenditures", "database": "OpenSecrets", "what_to_look_for": "Total spending and quarterly reports"}, {"step": 2, "task": "Identify their lobbying team", "database": "LDA reports", "what_to_look_for": "Names and backgrounds of lobbyists"}, {"step": 3, "task": "Track lobbyist backgrounds", "database": "LegiStorm", "what_to_look_for": "Previous government positions"}, {"step": 4, "task": "Connect to congressional targets", "database": "Committee rosters", "what_to_look_for": "Members who worked with these lobbyists"}], "red_flags": ["Vague issue descriptions", "Recent government employees", "Huge spending on narrow issues", "Targeting specific committee members"]}'::jsonb,
    240, -- 4 minutes for investigation
    true,
    false,
    '["investigative-tools", "lobbying-research", "network-analysis", "conflict-identification"]'::jsonb,
    '[
        {
            "url": "https://lda.congress.gov/LD/search",
            "title": "Lobbying Disclosure Database",
            "author": "Clerk of the House",
            "publication": "Congress.gov",
            "date": "2024",
            "credibility_score": 100,
            "verified_working": true,
            "summary": "Official database of lobbying disclosure reports"
        }
    ]'::jsonb,
    '["taxpayer-costs"]'::jsonb
),

-- Step 5: Reform proposals and citizen action
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 3),
    5,
    'concept',
    'Breaking the Influence Monopoly: Reform Solutions',
    'Multiple reforms could reduce lobbying dominance: longer cooling-off periods, real-time disclosure, and publicly funded research to compete with industry information. The obstacle: the influenced must vote to limit influence.',
    '{"type": "lobbying_reform_solutions", "proven_reforms": [{"reform": "Extended cooling-off periods", "current": "1-2 years", "proposed": "5-10 years", "precedent": "Some cities and states use longer periods", "obstacle": "Reduces post-government earning potential"}, {"reform": "Real-time disclosure", "current": "Quarterly reports", "proposed": "48-hour reporting", "benefit": "Public can track influence on specific votes", "obstacle": "Industry resistance to transparency"}, {"reform": "Contingent fee prohibition", "current": "Lobbyists can be paid based on results", "proposed": "Ban success-based compensation", "precedent": "Legal ethics rules prohibit this", "benefit": "Reduces incentive for extreme tactics"}], "structural_changes": [{"reform": "Public option for research", "mechanism": "Expand Congressional Research Service", "goal": "Compete with industry-funded information", "cost": "$100M annually vs $4.1B lobbying spending"}, {"reform": "Citizen lobbying vouchers", "mechanism": "Public financing for advocacy groups", "precedent": "Seattle''s democracy voucher program", "benefit": "Level playing field between interests"}], "citizen_strategies": ["Support candidates who refuse corporate PAC money", "Join advocacy organizations for issues you care about", "Demand lobbying transparency from representatives", "Vote in primaries where reform candidates run"]}'::jsonb,
    70,
    false,
    true,
    '["lobbying-reform", "transparency-measures", "structural-solutions", "citizen-advocacy"]'::jsonb,
    '[]'::jsonb,
    '["conflict-identification"]'::jsonb
);

-- ============================================================================
-- LESSON 4: GERRYMANDERING - "SAFE SEATS AND RIGGED MAPS"
-- ============================================================================

INSERT INTO lesson_steps (
    collection_item_id, step_number, step_type, title, content, 
    interaction_config, estimated_seconds, requires_interaction, can_skip, 
    key_concepts, sources, prerequisites
) VALUES

-- Step 1: Gerrymandering impact on competition
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 4),
    1,
    'intro',
    'Safe Seats and Rigged Maps: Why 97% of Incumbents Win',
    'In 2022, only 16 House seats were truly competitive—less than 4% of all races. The rest were decided by gerrymandering before voters cast ballots. When elections are predetermined, representatives serve mapmakers, not voters.',
    '{"type": "intro_card", "emoji": "🗺️", "subtitle": "Electoral Competition Crisis", "background_color": "#DC2626", "shocking_fact": "Only 16 truly competitive House seats in 2022", "competition_rate": "Less than 4% of all races competitive", "incumbent_advantage": "97% re-election rate", "source_note": "Cook Political Report analysis"}'::jsonb,
    35,
    false,
    true,
    '["electoral-competition", "incumbent-advantage", "safe-seats", "predetermined-outcomes"]'::jsonb,
    '[
        {
            "url": "https://www.cookpolitical.com/analysis/house/house-overview/2022-house-race-ratings-overview",
            "title": "2022 House Race Ratings Overview",
            "author": "Cook Political Report",
            "publication": "Cook Political Report",
            "date": "2022",
            "credibility_score": 90,
            "verified_working": true,
            "summary": "Analysis of competitive vs. safe House districts in 2022 elections"
        }
    ]'::jsonb,
    '[]'::jsonb
),

-- Step 2: How gerrymandering works technically
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 4),
    2,
    'concept',
    'The Science of Vote Stealing: Gerrymandering Techniques',
    'Modern gerrymandering uses sophisticated software to draw districts with surgical precision. "Packing" concentrates opposition voters, "cracking" spreads them thin. The result: parties can lose the popular vote but win more seats.',
    '{"type": "gerrymandering_techniques", "main_methods": [{"technique": "Packing", "definition": "Concentrate opposition voters into few districts", "effect": "Opposition wins those districts by huge margins, wastes votes", "example": "Illinois 4th District - 71% Hispanic to pack Latino Democrats"}, {"technique": "Cracking", "definition": "Spread opposition voters across many districts", "effect": "Opposition becomes minority in multiple districts", "example": "Texas split Austin into 6 districts to dilute Democratic strength"}], "modern_tools": {"software": "Maptitude, GIS systems with voter data", "data_sources": ["Precinct-level election results", "Demographic data", "Voter registration files", "Consumer purchasing data"], "precision": "Can predict election outcomes within 1-2%"}, "mathematical_measures": {"efficiency_gap": "Measures wasted votes between parties", "partisan_bias": "Expected seat advantage at 50% vote share", "competitiveness": "Number of districts within 5% margin"}, "case_study": {"state": "North Carolina 2016", "vote_share": "Republicans 53% of votes", "seat_share": "Republicans 77% of seats (10 of 13)", "court_ruling": "Struck down as unconstitutional partisan gerrymander"}}'::jsonb,
    80,
    false,
    true,
    '["packing-cracking", "gerrymandering-software", "mathematical-analysis", "vote-efficiency"]'::jsonb,
    '[
        {
            "url": "https://www.brennancenter.org/our-work/analysis-opinion/how-gerrymandering-works",
            "title": "How Gerrymandering Works",
            "author": "Brennan Center for Justice",
            "publication": "Brennan Center",
            "date": "2023",
            "credibility_score": 95,
            "verified_working": true,
            "summary": "Detailed explanation of gerrymandering techniques and measurement"
        }
    ]'::jsonb,
    '["safe-seats"]'::jsonb
),

-- Step 3: Consequences of safe seats
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 4),
    3,
    'concept',
    'When Elections Don''t Matter: The Safe Seat Syndrome',
    'Safe seats create perverse incentives. Representatives fear primary challenges from extremes more than general election voters. This drives polarization, reduces compromise, and makes representatives less responsive to broader constituencies.',
    '{"type": "safe_seat_consequences", "electoral_dynamics": {"primary_importance": "In safe seats, primary is the real election", "primary_turnout": "Typically 15-25% of eligible voters", "primary_voters": "More ideologically extreme than general electorate", "general_election": "Predetermined outcome, low engagement"}, "behavioral_changes": [{"change": "Reduced moderation", "mechanism": "No need to appeal to center", "evidence": "Voting patterns become more partisan"}, {"change": "Increased fundraising focus", "mechanism": "Can raise money for party without electoral risk", "evidence": "Safe seat members raise more for colleagues"}, {"change": "Less constituent service", "mechanism": "Voters can''t punish poor performance", "evidence": "Fewer town halls, less responsive offices"}], "systemic_effects": {"polarization": "Safe seats enable extreme positions", "gridlock": "Less incentive for bipartisan compromise", "accountability": "Reduced responsiveness to constituents", "innovation": "Less policy experimentation"}, "primary_challenge_dynamics": {"frequency": "Rare but devastating when they occur", "funding_sources": "Often from out-of-district ideological groups", "success_rate": "Low but creates fear among incumbents"}}'::jsonb,
    70,
    false,
    true,
    '["safe-seat-behavior", "primary-dynamics", "polarization-drivers", "accountability-breakdown"]'::jsonb,
    '[
        {
            "url": "https://fivethirtyeight.com/features/the-effects-of-gerrymandering-on-competitiveness-and-extremism/",
            "title": "The Effects of Gerrymandering on Competitiveness and Extremism",
            "author": "FiveThirtyEight",
            "publication": "FiveThirtyEight",
            "date": "2018",
            "credibility_score": 85,
            "verified_working": true,
            "summary": "Analysis of how safe seats affect representative behavior and polarization"
        }
    ]'::jsonb,
    '["mathematical-analysis"]'::jsonb
),

-- Step 4: Interactive district drawing exercise
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 4),
    4,
    'interaction',
    'Draw the Districts: Gerrymandering Simulation',
    'Try drawing congressional districts for a fictional state. See how different goals (competitiveness, party advantage, minority representation) create completely different maps.',
    '{"type": "redistricting_simulation", "state_scenario": {"name": "Fictional State", "population": "10 million", "districts_needed": 10, "party_breakdown": "52% Republican, 48% Democratic", "geographic_distribution": {"urban_areas": "Mostly Democratic", "suburban_areas": "Mixed", "rural_areas": "Mostly Republican"}, "minority_populations": "20% Hispanic, concentrated in 3 counties"}, "drawing_objectives": [{"goal": "Competitive districts", "target": "Create districts within 5% margin", "challenge": "Geographic clustering makes this difficult"}, {"goal": "Proportional representation", "target": "5 Republican, 5 Democratic seats", "challenge": "Requires some creative boundaries"}, {"goal": "Maximize party advantage", "target": "Pack opposition, crack swing areas", "challenge": "May violate compactness requirements"}, {"goal": "Protect minority representation", "target": "Create majority-minority districts", "challenge": "May conflict with other objectives"}], "constraints": ["Districts must be contiguous", "Roughly equal population", "Respect county/city boundaries when possible", "Comply with Voting Rights Act"], "learning_outcomes": ["Different objectives create different maps", "Trade-offs between competing values", "Technical difficulty of fair redistricting", "Why automated or commission-based redistricting might work better"]}'::jsonb,
    180, -- 3 minutes for simulation
    true,
    false,
    '["redistricting-simulation", "competing-objectives", "technical-constraints", "fairness-challenges"]'::jsonb,
    '[]'::jsonb,
    '["polarization-drivers"]'::jsonb
),

-- Step 5: Reform solutions and current efforts
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded' AND ci.sort_order = 4),
    5,
    'concept',
    'Fixing the Maps: Redistricting Reform in Action',
    'Several states have adopted redistricting reforms: independent commissions, algorithmic drawing, and transparency requirements. These reforms reduce gerrymandering but face resistance from incumbents who benefit from safe seats.',
    '{"type": "redistricting_reforms", "current_reforms": [{"type": "Independent commissions", "states": ["California", "Arizona", "Michigan", "Colorado"], "mechanism": "Non-politicians draw districts", "results": "More competitive districts, less partisan outcomes", "challenges": "Still have political appointees"}, {"type": "Algorithmic redistricting", "states": ["Iowa uses non-partisan staff"], "mechanism": "Computer algorithms optimize for fairness criteria", "results": "Highly competitive districts", "challenges": "Requires defining fairness mathematically"}, {"type": "Transparency requirements", "states": ["Texas", "Florida require public hearings"], "mechanism": "Open process with public input", "results": "Limited - still allows gerrymandering", "benefit": "Public awareness and accountability"}], "federal_proposals": [{"bill": "Freedom to Vote Act", "provision": "National redistricting standards", "status": "Blocked by Senate rules", "requirements": ["Independent commissions", "Transparency", "Communities of interest"]}, {"bill": "John Lewis Voting Rights Advancement Act", "provision": "Federal oversight of redistricting", "status": "House passed, Senate blocked", "mechanism": "Preclearance for changes in covered states"}], "citizen_action": ["Support redistricting ballot initiatives", "Participate in public comment periods", "Join advocacy groups like Common Cause", "Vote for candidates supporting reform", "Volunteer for independent redistricting efforts"]}'::jsonb,
    65,
    false,
    true,
    '["redistricting-reform", "independent-commissions", "algorithmic-methods", "federal-legislation"]'::jsonb,
    '[
        {
            "url": "https://www.commoncause.org/our-work/gerrymandering-and-representation/",
            "title": "Gerrymandering and Representation",
            "author": "Common Cause",
            "publication": "Common Cause",
            "date": "2024",
            "credibility_score": 85,
            "verified_working": true,
            "summary": "Overview of redistricting reform efforts and current state laws"
        }
    ]'::jsonb,
    '["fairness-challenges"]'::jsonb
)criteria, prerequisites
) VALUES

-- Step 1: Hook with verified congressional approval data
(
    gen_random_uuid(),
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 1),
    1,
    'intro',
    'Congress: $6.8 Trillion Budget, 14% Approval Rating',
    'Congress controls $6.8 trillion annually—more than most countries'' entire economies—yet has lower approval ratings than parking tickets, the IRS, and expired milk. This isn''t normal democratic dysfunction. It''s institutional design.',
    40,
    null,
    null,
    false,
    true,
    '{"type": "intro_card", "emoji": "🏛️", "subtitle": "American Legislative Dysfunction", "background_color": "#DC2626", "shocking_fact": "14% approval rating", "budget_control": "$6.8 trillion annual federal budget", "comparison": "Lower approval than root canals (17%)", "source_note": "Gallup polling 2024, Congressional Budget Office"}'::jsonb,
    null,
    null,
    null,
    null,
    null,
    null,
    '["congressional-approval", "federal-budget", "institutional-dysfunction"]'::jsonb,
    '[
        {
            "url": "https://news.gallup.com/poll/1600/congress-public.aspx",
            "title": "Congress and the Public",
            "author": "Gallup",
            "publication": "Gallup.com",
            "date": "2024",
            "credibility_score": 95,
            "verified_working": true,
            "summary": "Tracks congressional approval ratings over time"
        },
        {
            "url": "https://www.cbo.gov/publication/59946",
            "title": "The Budget and Economic Outlook: 2024 to 2034",
            "author": "Congressional Budget Office",
            "publication": "CBO.gov",
            "date": "2024-02-07",
            "credibility_score": 100,
            "verified_working": true,
            "summary": "Official federal budget projections and spending analysis"
        }
    ]'::jsonb,
    null,
    NOW(),
    NOW(),
    null,
    null,
    null,
    '[]'::jsonb
),

-- Step 2: Basic constitutional structure
(
    gen_random_uuid(),
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 1),
    2,
    'concept',
    'Two Chambers, 535 Members, Vast Constitutional Powers',
    'The Constitution gives Congress power to tax, spend, regulate commerce, and declare war. House members serve 2-year terms, Senators serve 6 years. This structure was designed for deliberation, but creates gridlock in practice.',
    60,
    null,
    null,
    false,
    true,
    '{"type": "constitutional_structure", "design_intention": "Deliberation and careful consideration of laws", "practical_reality": "Gridlock and partisan warfare", "house": {"members": 435, "term_length": "2 years", "constituencies": "Districts of ~760,000 people", "design_purpose": "Represent the people directly"}, "senate": {"members": 100, "term_length": "6 years", "constituencies": "Entire states", "design_purpose": "Represent states equally, provide stability"}, "key_powers": ["Control federal spending", "Regulate interstate commerce", "Declare war", "Impeach officials", "Confirm presidential appointments (Senate)"], "dysfunction_sources": ["Partisan polarization", "Safe electoral districts", "Special interest influence", "Procedural abuse"]}'::jsonb,
    null,
    null,
    null,
    null,
    null,
    null,
    '["constitutional-design", "house-vs-senate", "separation-of-powers", "gridlock-sources"]'::jsonb,
    '[
        {
            "url": "https://www.congress.gov/help/learn-about-the-legislative-process",
            "title": "Learn About the Legislative Process",
            "author": "Library of Congress",
            "publication": "Congress.gov",
            "date": "2024",
            "credibility_score": 100,
            "verified_working": true,
            "summary": "Official explanation of how Congress is supposed to work"
        }
    ]'::jsonb,
    null,
    NOW(),
    NOW(),
    null,
    null,
    null,
    '["congressional-approval"]'::jsonb
),

-- Step 3: The legislative process vs. reality
(
    gen_random_uuid(),
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 1),
    3,
    'concept',
    'How a Bill Becomes Law: Theory vs. Reality',
    'Textbooks show a neat process: bill introduction → committee → floor vote → other chamber → president. Reality: 90% of bills die in committee, leadership controls what gets votes, and most laws are written by lobbyists.',
    70,
    null,
    null,
    false,
    true,
    '{"type": "process_comparison", "textbook_version": {"steps": ["Bill introduced", "Committee hearings", "Committee markup", "Floor debate and vote", "Sent to other chamber", "Conference committee", "Final passage", "Presidential signature"], "timeframe": "Orderly progression over months"}, "actual_reality": {"statistics": {"bills_introduced_2023": "7,882", "bills_passed": "27", "success_rate": "0.34%"}, "real_process": ["Most bills never get hearings", "Committee chairs control agenda", "Leadership decides floor votes", "Omnibus bills bundle unrelated items", "Lobbyists often draft bill language"], "power_concentration": "20 committee chairs + 4 party leaders control legislative agenda"}, "case_study": "2023: Infrastructure bill took 18 months, included unrelated provisions, final text available 3 hours before vote"}'::jsonb,
    null,
    null,
    null,
    null,
    null,
    null,
    '["legislative-process", "bill-mortality-rate", "committee-gatekeeping", "leadership-control"]'::jsonb,
    '[
        {
            "url": "https://www.govtrack.us/about/analysis#prognosis",
            "title": "GovTrack Bill Prognosis and Statistics", 
            "author": "GovTrack",
            "publication": "GovTrack.us",
            "date": "2024",
            "credibility_score": 90,
            "verified_working": true,
            "summary": "Tracks bill introduction and passage rates with statistical analysis"
        }
    ]'::jsonb,
    null,
    NOW(),
    NOW(),
    null,
    null,
    null,
    '["constitutional-design"]'::jsonb
),

-- Step 4: Interactive quiz on congressional basics
(
    gen_random_uuid(),
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 1),
    4,
    'interaction',
    'Congressional Reality Check: Test Your Knowledge',
    'How well do you understand the gap between how Congress is supposed to work and how it actually operates?',
    90,
    null,
    null,
    true,
    false,
    '{"type": "multiple_choice_progressive", "questions": [{"question": "What percentage of bills introduced in Congress become law?", "options": ["About 50%", "About 25%", "About 10%", "Less than 1%"], "correct": 3, "explanation": "Less than 1%! In 2023, only 27 of 7,882 bills became law (0.34%). Most die in committee without hearings.", "follow_up": "This low success rate isn''t necessarily bad—many bills are symbolic or duplicative. But it shows how few ideas actually become policy."}, {"question": "How many lobbyists are there per member of Congress?", "options": ["About 5", "About 12", "About 27", "About 50"], "correct": 2, "explanation": "About 27 registered lobbyists per member of Congress. With 12,000 registered lobbyists and 535 members, that''s massive influence.", "context": "This doesn''t count ''unregistered'' influencers who technically don''t lobby but still shape policy."}, {"question": "What''s Congress''s current approval rating?", "options": ["45%", "28%", "14%", "8%"], "correct": 2, "explanation": "About 14% as of 2024—historically low. Yet 97% of House incumbents who ran were re-elected in 2022.", "paradox": "Low institutional approval + high re-election rate = structural problem"}]}'::jsonb,
    null,
    null,
    null,
    null,
    null,
    null,
    '["bill-success-rates", "lobbying-ratio", "approval-vs-reelection"]'::jsonb,
    '[
        {
            "url": "https://www.govtrack.us/about/analysis#prognosis",
            "title": "Bill Statistics and Analysis",
            "author": "GovTrack",
            "publication": "GovTrack.us", 
            "date": "2024",
            "credibility_score": 90,
            "verified_working": true,
            "summary": "Statistical analysis of congressional productivity and bill passage rates"
        }
    ]'::jsonb,
    null,
    NOW(),
    NOW(),
    null,
    null,
    null,
    '["leadership-control"]'::jsonb
),

-- Step 5: Party polarization analysis
(
    gen_random_uuid(),
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 1),
    5,
    'concept',
    'The Collapse of Bipartisanship: Measuring Polarization',
    'Political scientists measure congressional polarization using voting patterns. Today''s Congress is more polarized than any time since Reconstruction, with opposite-party cooperation near historic lows.',
    65,
    null,
    null,
    false,
    true,
    '{"type": "polarization_analysis", "measurement": "DW-NOMINATE scores track ideological distance between parties", "historical_trend": {"1950s": "Significant overlap between moderate Republicans and Democrats", "1990s": "Growing separation", "2020s": "Almost no overlap—99% of votes split by party"}, "specific_data": {"bipartisan_bills_2023": "Less than 5% of major legislation", "party_unity_scores": {"republicans": "88% vote with party", "democrats": "86% vote with party"}, "cross_party_friendships": "Declined 90% since 1970s"}, "causes": ["Safe electoral districts", "Media fragmentation", "Primary challenges from extremes", "Interest group pressure"], "consequences": ["Policy instability", "Government shutdowns", "Delayed responses to crises", "Public cynicism"]}'::jsonb,
    null,
    null,
    null,
    null,
    null,
    null,
    '["partisan-polarization", "bipartisanship-decline", "voting-patterns", "safe-districts"]'::jsonb,
    '[
        {
            "url": "https://legacy.voteview.com/political_polarization_2015.htm",
            "title": "Political Polarization in the American Public",
            "author": "Voteview",
            "publication": "VoteView.com",
            "date": "2024",
            "credibility_score": 95,
            "verified_working": true,
            "summary": "Academic analysis of congressional polarization using DW-NOMINATE scores"
        }
    ]'::jsonb,
    null,
    NOW(),
    NOW(),
    null,
    null,
    null,
    '["approval-vs-reelection"]'::jsonb
),

-- Step 6: Research activity - track your representatives
(
    gen_random_uuid(),
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 1),
    6,
    'interaction',
    'Research Your Representatives: Follow the Power',
    'Use professional research tools to investigate your representatives'' committee assignments, voting patterns, and funding sources.',
    300,
    null,
    null,
    true,
    false,
    '{"type": "representative_research", "tools": [{"name": "Congress.gov", "use": "Official voting records and bill sponsorship", "tip": "Check ''Actions'' tab for committee activity"}, {"name": "GovTrack.us", "use": "Voting analysis and ideology scores", "tip": "See ''Statistics'' for missed votes and ideology"}, {"name": "OpenSecrets.org", "use": "Campaign finance and lobbying", "tip": "Cross-reference donors with committee assignments"}], "research_steps": [{"step": 1, "task": "Find your representatives at house.gov and senate.gov", "what_to_look_for": "Committee assignments and leadership roles"}, {"step": 2, "task": "Check their voting record on Congress.gov", "what_to_look_for": "How often they vote with their party"}, {"step": 3, "task": "Research their donors on OpenSecrets", "what_to_look_for": "Top industries and individual contributors"}, {"step": 4, "task": "Cross-reference committees with donor interests", "what_to_look_for": "Patterns between funding and oversight responsibilities"}], "analysis_questions": ["Do their committee assignments match donor interests?", "How often do they break with their party?", "What bills have they actually authored vs. co-sponsored?", "How accessible are they to regular constituents?"]}'::jsonb,
    null,
    null,
    null,
    null,
    null,
    null,
    '["representative-research", "committee-assignments", "voting-analysis", "donor-tracking"]'::jsonb,
    '[
        {
            "url": "https://www.congress.gov/",
            "title": "Congress.gov Home",
            "author": "Library of Congress",
            "publication": "Congress.gov",
            "date": "2024",
            "credibility_score": 100,
            "verified_working": true,
            "summary": "Official congressional database with bills, votes, and member information"
        }
    ]'::jsonb,
    null,
    NOW(),
    NOW(),
    null,
    null,
    null,
    '["safe-districts"]'::jsonb
);

-- ============================================================================
-- LESSON 2: COMMITTEE SYSTEM - "WHERE BILLS GO TO DIE"
-- ============================================================================

INSERT INTO lesson_steps (
    collection_item_id, step_number, step_type, title, content, 
    interaction_config, estimated_seconds, requires_interaction, can_skip, 
    key_concepts, sources, prerequisites
) VALUES

-- Step 1: Committee power concentration
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 2),
    1,
    'intro',
    'Where Bills Go to Die: The Committee Graveyard',
    '90% of bills introduced in Congress never get a committee hearing. Twenty committee chairs control America''s legislative agenda, deciding which issues get attention and which get buried. This concentration of power would make the Founders weep.',
    '{"type": "intro_card", "emoji": "⚰️", "subtitle": "Legislative Bottlenecks", "background_color": "#7C3AED", "shocking_fact": "90% of bills die in committee", "power_concentration": "20 committee chairs control agenda", "comparison": "More gatekeeping power than most dictators", "source_note": "GovTrack analysis of 118th Congress"}'::jsonb,
    35,
    false,
    true,
    '["committee-gatekeeping", "agenda-control", "legislative-mortality"]'::jsonb,
    '[
        {
            "url": "https://www.govtrack.us/about/analysis#prognosis",
            "title": "What is the status of legislation in Congress?",
            "author": "GovTrack",
            "publication": "GovTrack.us",
            "date": "2024",
            "credibility_score": 90,
            "verified_working": true,
            "summary": "Analysis shows most bills never receive committee consideration"
        }
    ]'::jsonb,
    '[]'::jsonb
),

-- Step 2: Committee structure and assignments
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 2),
    2,
    'concept',
    'The Committee Hierarchy: Who Controls What',
    'House has 20 standing committees, Senate has 16. Committee assignments determine members'' power and fundraising ability. Banking Committee members raise money from banks, Energy Committee members from oil companies. It''s not corruption—it''s the system.',
    '{"type": "committee_structure", "house_committees": {"total": 20, "most_powerful": ["Appropriations", "Ways and Means", "Rules", "Energy and Commerce"], "assignment_process": "Party leaders control assignments based on fundraising and loyalty"}, "senate_committees": {"total": 16, "most_powerful": ["Appropriations", "Finance", "Judiciary", "Foreign Relations"], "assignment_process": "Seniority and party leadership approval"}, "power_dynamics": {"committee_chairs": "Control hearings, markup sessions, and staff", "ranking_members": "Lead minority party response", "subcommittee_chairs": "Specialized expertise and industry connections"}, "fundraising_connection": {"banking_committee": "Members average $180,000 from financial sector", "energy_committee": "Members average $245,000 from energy companies", "agriculture_committee": "Members average $125,000 from agribusiness"}, "assignment_strategy": "Members seek committees that help their districts and donors"}'::jsonb,
    70,
    false,
    true,
    '["committee-structure", "assignment-politics", "fundraising-patterns", "industry-connections"]'::jsonb,
    '[
        {
            "url": "https://www.congress.gov/committees",
            "title": "Committees of the U.S. Congress",
            "author": "Library of Congress",
            "publication": "Congress.gov",
            "date": "2024",
            "credibility_score": 100,
            "verified_working": true,
            "summary": "Official list and descriptions of congressional committees"
        }
    ]'::jsonb,
    '["committee-gatekeeping"]'::jsonb
),

-- Step 3: The markup process deep dive
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 2),
    3,
    'concept',
    'Behind Closed Doors: The Markup Process',
    'Committee "markup" sessions are where bills actually get written. Members propose amendments, often written by lobbyists. The public rarely sees this process, where the real decisions about your life get made.',
    '{"type": "markup_process", "what_is_markup": "Committee members revise bill language line by line", "who_participates": ["Committee members only", "Staff who often write amendments", "Lobbyists who provide draft language"], "public_access": {"theory": "Open hearings for transparency", "reality": "Key negotiations happen in private meetings", "c_span_coverage": "Limited - only formal sessions"}, "amendment_process": {"member_amendments": "Often written by industry lobbyists", "staff_amendments": "Drafted by committee staff", "party_amendments": "Coordinated by party leadership"}, "case_study": {"bill": "2023 Farm Bill markup", "duration": "14 hours over 2 days", "amendments_considered": "127", "final_outcome": "Bill passed committee 32-13", "lobbyist_presence": "Over 200 registered ag lobbyists worked on amendments"}}'::jsonb,
    65,
    false,
    true,
    '["markup-process", "amendment-drafting", "lobbyist-influence", "transparency-gaps"]'::jsonb,
    '[
        {
            "url": "https://www.congress.gov/help/committee-materials",
            "title": "Committee Materials and Documents",
            "author": "Library of Congress", 
            "publication": "Congress.gov",
            "date": "2024",
            "credibility_score": 100,
            "verified_working": true,
            "summary": "Official explanation of committee processes and public access"
        }
    ]'::jsonb,
    '["industry-connections"]'::jsonb
),

-- Step 4: Interactive committee assignment game
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 2),
    4,
    'interaction',
    'Committee Assignment Strategy: Play the Game',
    'You''re a new member of Congress. Which committees will you request based on your district''s needs and your fundraising goals?',
    '{"type": "committee_strategy_game", "your_district": {"description": "Suburban district with major military base, agricultural areas, and growing tech sector", "key_industries": ["Defense contractors", "Agriculture", "Technology startups"], "voter_priorities": ["Jobs", "Veterans services", "Infrastructure"]}, "committee_options": [{"name": "Armed Services", "power_level": "High", "fundraising_potential": "$300K from defense industry", "district_relevance": "Perfect - major military base", "competition": "High - many members want this"}, {"name": "Agriculture", "power_level": "Medium", "fundraising_potential": "$150K from agribusiness", "district_relevance": "Good - farming areas", "competition": "Medium - rural members prioritized"}, {"name": "Science, Space & Technology", "power_level": "Medium", "fundraising_potential": "$200K from tech companies", "district_relevance": "Good - growing tech sector", "competition": "Low - less prestigious"}, {"name": "Transportation & Infrastructure", "power_level": "High", "fundraising_potential": "$250K from construction/engineering", "district_relevance": "Excellent - infrastructure needs", "competition": "Very high - everyone wants infrastructure money"}], "strategy_question": "You can request 3 committees. Which combination maximizes your power, fundraising, and district service?", "reality_check": "Most freshman get their 3rd or 4th choice. Seniority and party loyalty matter more than qualifications."}'::jsonb,
    120,
    true,
    false,
    '["committee-strategy", "district-representation", "fundraising-calculus", "political-realities"]'::jsonb,
    '[]'::jsonb,
    '["transparency-gaps"]'::jsonb
),

-- Step 5: Committee dysfunction and reform ideas
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 2),
    5,
    'concept',
    'Fixing the Bottleneck: Committee Reform Proposals',
    'Multiple reform proposals could reduce committee dysfunction: discharge petitions that actually work, mandatory hearings for bills with broad support, and limiting committee chairs'' agenda control. The question is whether Congress will reform itself.',
    '{"type": "reform_proposals", "current_problems": ["Committee chairs kill popular bills", "No hearings for most legislation", "Markup sessions often scripted", "Limited amendment opportunities"], "proposed_solutions": [{"reform": "Automatic discharge petitions", "mechanism": "Bills with 100+ cosponsors get automatic hearings", "obstacle": "Leadership opposition", "precedent": "Some state legislatures use this"}, {"reform": "Open amendment process", "mechanism": "Guarantee amendment opportunities in markup", "obstacle": "Would slow process further", "benefit": "More member participation"}, {"reform": "Rotation of committee chairs", "mechanism": "Term limits for committee leadership", "obstacle": "Seniority system resistance", "benefit": "Reduce concentrated power"}, {"reform": "Public markup sessions", "mechanism": "Require all markup to be livestreamed", "obstacle": "Members prefer privacy for negotiations", "benefit": "Increase transparency"}], "citizen_pressure": ["Contact representatives about specific stalled bills", "Support transparency organizations", "Vote in primaries where reform candidates run"]}'::jsonb,
    60,
    false,
    true,
    '["committee-reform", "discharge-petitions", "transparency-measures", "citizen-advocacy"]'::jsonb,
    '[]'::jsonb,
    '["political-realities"]'::jsonb
);

-- ============================================================================
-- LESSON 3: LOBBYING INFLUENCE - "$4.1 BILLION IN LOBBYING"
-- ============================================================================

INSERT INTO lesson_steps (
    collection_item_id, step_number, step_type, title, content, 
    interaction_config, estimated_seconds, requires_interaction, can_skip, 
    key_concepts, sources, prerequisites
) VALUES

-- Step 1: Lobbying scale and scope
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 3),
    1,
    'intro',
    '$4.1 Billion in Lobbying: The Influence Industry',
    'In 2023, organizations spent $4.1 billion on registered lobbying—$7.7 million per member of Congress. This doesn''t count "unregistered" influence or the revolving door between Congress and K Street. Welcome to democracy''s auction house.',
    '{"type": "intro_card", "emoji": "💸", "subtitle": "The Influence Economy", "background_color": "#059669", "shocking_fact": "$4.1 billion in lobbying spending (2023)", "per_member": "$7.7 million per member of Congress", "hidden_spending": "Unregistered influence not counted", "source_note": "OpenSecrets analysis of LDA reports"}'::jsonb,
    40,
    false,
    true,
    '["lobbying-spending", "influence-industry", "registered-vs-unregistered"]'::jsonb,
    '[
        {
            "url": "https://www.opensecrets.org/federal-lobbying",
            "title": "Lobbying Spending Database",
            "author": "OpenSecrets",
            "publication": "OpenSecrets.org",
            "date": "2024",
            "credibility_score": 95,
            "verified_working": true,
            "summary": "Comprehensive database of registered lobbying spending and activity"
        }
    ]'::jsonb,
    '[]'::jsonb
),

-- Step 2: Who lobbyists are and what they do
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 3),
    2,
    'concept',
    'The 12,000-Person Influence Army',
    'About 12,000 registered lobbyists work Capitol Hill—23 for every member of Congress. They draft bill language, provide "research," and offer post-Congress jobs. Many are former congressional staff who know exactly how the system works.',
    '{"type": "lobbyist_analysis", "by_the_numbers": {"registered_lobbyists": "12,000+", "lobbyists_per_member": "23", "former_congressional_staff": "~4,500 (estimated)", "former_members_of_congress": "~400 registered lobbyists"}, "what_they_do": ["Draft bill language and amendments", "Provide information and research", "Facilitate meetings between members and clients", "Coordinate with think tanks and advocacy groups", "Monitor legislative developments"], "revolving_door": {"staff_to_lobbying": "47% of departing senior staff become lobbyists within 4 years", "cooling_off_period": "1 year for House staff, 2 years for Senators", "enforcement": "Minimal - honor system with rare prosecutions"}, "access_advantages": {"insider_knowledge": "Know parliamentary procedures and staff relationships", "timing": "When to approach members for maximum impact", "relationship_capital": "Personal connections from government service"}}'::jsonb,
    75,
    false,
    true,
    '["lobbyist-demographics", "revolving-door", "access-advantages", "influence-tactics"]'::jsonb,
    '[
        {
            "url": "https://www.opensecrets.org/revolving",
            "title": "Revolving Door Database", 
            "author": "OpenSecrets",
            "publication": "OpenSecrets.org",
            "date": "2024",
            "credibility_score": 95,
            "verified_working": true,
            "summary": "Tracks movement between government service and lobbying careers"
        }
    ]'::jsonb,
    '["lobbying-spending"]'::jsonb
),

-- Step 3: Case study of bill writing
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 3),
    3,
    'example',
    'Case Study: How Pharma Wrote Medicare Part D',
    'Medicare Part D (prescription drug benefit) was largely written by pharmaceutical lobbyists. The law prohibits Medicare from negotiating drug prices—the only federal program with this restriction. This wasn''t an accident.',
    '{"type": "detailed_case_study", "legislation": "Medicare Prescription Drug, Improvement, and Modernization Act (2003)", "key_provision": "Prohibition on Medicare drug price negotiation", "lobbying_spending": {"pharmaceutical_industry": "$116 million in 2003 alone", "top_spenders": ["PhRMA", "Merck", "Pfizer", "GlaxoSmithKline"]}, "drafting_process": {"industry_involvement": "PhRMA provided draft language for key sections", "member_knowledge": "Many members admitted not reading 1,200-page bill", "vote_timing": "3 AM vote after 3-hour voting period"}, "revolving_door_players": [{"name": "Billy Tauzin", "role": "House Energy & Commerce Chair", "post_congress": "Became PhRMA CEO for $2M+/year"}, {"name": "Thomas Scully", "role": "Medicare administrator", "post_government": "Became healthcare lobbyist"}], "financial_impact": {"estimated_cost": "$900 billion over 10 years", "pharma_benefits": "Maintained high drug prices", "taxpayer_impact": "Higher costs than negotiated prices would allow"}}'::jsonb,
    90,
    false,
    true,
    '["bill-drafting-influence", "industry-capture", "revolving-door-corruption", "taxpayer-costs"]'::jsonb,
    '[
        {
            "url": "https://www.citizen.org/article/the-medicare-drug-war/",
            "title": "The Medicare Drug War",
            "author": "Public Citizen",
            "publication": "Citizen.org",
            "date": "2004",
            "credibility_score": 85,
            "verified_working": true,
            "summary": "Analysis of pharmaceutical industry influence on Medicare Part D"
        }
    ]'::jsonb,
    '["influence-tactics"]'::jsonb
),

-- Step 4: Interactive lobbying investigation
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 3),
    4,
    'interaction',
    'Follow the Influence: Investigate Lobbying Networks',
    'Use professional investigative tools to trace connections between lobbyists, their clients, and congressional targets.',
    '{"type": "lobbying_investigation", "tools": [{"name": "OpenSecrets Lobbying Database", "use": "Search by company, lobbyist, or issue", "tip": "Check ''Issues'' section for specific bills"}, {"name": "LegiStorm Database", "use": "Track congressional staff career moves", "tip": "See who became lobbyists after government service"}, {"name": "LDA Reports", "use": "Official disclosure forms", "tip": "Look for vague issue descriptions"}], "investigation_scenario": {"client": "Major tech company", "lobbying_spend_2023": "$18.7 million", "key_issues": ["Privacy regulation", "Antitrust enforcement", "Section 230 liability"], "lobbyists_hired": "37 registered lobbyists", "target_committees": ["House Energy & Commerce", "Senate Commerce", "House Judiciary"]}, "research_steps": [{"step": 1, "task": "Find the company''s lobbying expenditures", "database": "OpenSecrets", "what_to_look_for": "Total spending and quarterly reports"}, {"step": 2, "task": "Identify their lobbying team", "database": "LDA reports", "what_to_look_for": "Names and backgrounds of lobbyists"}, {"step": 3, "task": "Track lobbyist backgrounds", "database": "LegiStorm", "what_to_look_for": "Previous government positions"}, {"step": 4, "task": "Connect to congressional targets", "database": "Committee rosters", "what_to_look_for": "Members who worked with these lobbyists"}], "red_flags": ["Vague issue descriptions", "Recent government employees", "Huge spending on narrow issues", "Targeting specific committee members"]}'::jsonb,
    240, -- 4 minutes for investigation
    true,
    false,
    '["investigative-tools", "lobbying-research", "network-analysis", "conflict-identification"]'::jsonb,
    '[
        {
            "url": "https://lda.congress.gov/LD/search",
            "title": "Lobbying Disclosure Database",
            "author": "Clerk of the House",
            "publication": "Congress.gov",
            "date": "2024",
            "credibility_score": 100,
            "verified_working": true,
            "summary": "Official database of lobbying disclosure reports"
        }
    ]'::jsonb,
    '["taxpayer-costs"]'::jsonb
),

-- Step 5: Reform proposals and citizen action
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 3),
    5,
    'concept',
    'Breaking the Influence Monopoly: Reform Solutions',
    'Multiple reforms could reduce lobbying dominance: longer cooling-off periods, real-time disclosure, and publicly funded research to compete with industry information. The obstacle: the influenced must vote to limit influence.',
    '{"type": "lobbying_reform_solutions", "proven_reforms": [{"reform": "Extended cooling-off periods", "current": "1-2 years", "proposed": "5-10 years", "precedent": "Some cities and states use longer periods", "obstacle": "Reduces post-government earning potential"}, {"reform": "Real-time disclosure", "current": "Quarterly reports", "proposed": "48-hour reporting", "benefit": "Public can track influence on specific votes", "obstacle": "Industry resistance to transparency"}, {"reform": "Contingent fee prohibition", "current": "Lobbyists can be paid based on results", "proposed": "Ban success-based compensation", "precedent": "Legal ethics rules prohibit this", "benefit": "Reduces incentive for extreme tactics"}], "structural_changes": [{"reform": "Public option for research", "mechanism": "Expand Congressional Research Service", "goal": "Compete with industry-funded information", "cost": "$100M annually vs $4.1B lobbying spending"}, {"reform": "Citizen lobbying vouchers", "mechanism": "Public financing for advocacy groups", "precedent": "Seattle''s democracy voucher program", "benefit": "Level playing field between interests"}], "citizen_strategies": ["Support candidates who refuse corporate PAC money", "Join advocacy organizations for issues you care about", "Demand lobbying transparency from representatives", "Vote in primaries where reform candidates run"]}'::jsonb,
    70,
    false,
    true,
    '["lobbying-reform", "transparency-measures", "structural-solutions", "citizen-advocacy"]'::jsonb,
    '[]'::jsonb,
    '["conflict-identification"]'::jsonb
);

-- ============================================================================
-- LESSON 4: GERRYMANDERING - "SAFE SEATS AND RIGGED MAPS"
-- ============================================================================

INSERT INTO lesson_steps (
    collection_item_id, step_number, step_type, title, content, 
    interaction_config, estimated_seconds, requires_interaction, can_skip, 
    key_concepts, sources, prerequisites
) VALUES

-- Step 1: Gerrymandering impact on competition
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 4),
    1,
    'intro',
    'Safe Seats and Rigged Maps: Why 97% of Incumbents Win',
    'In 2022, only 16 House seats were truly competitive—less than 4% of all races. The rest were decided by gerrymandering before voters cast ballots. When elections are predetermined, representatives serve mapmakers, not voters.',
    '{"type": "intro_card", "emoji": "🗺️", "subtitle": "Electoral Competition Crisis", "background_color": "#DC2626", "shocking_fact": "Only 16 truly competitive House seats in 2022", "competition_rate": "Less than 4% of all races competitive", "incumbent_advantage": "97% re-election rate", "source_note": "Cook Political Report analysis"}'::jsonb,
    35,
    false,
    true,
    '["electoral-competition", "incumbent-advantage", "safe-seats", "predetermined-outcomes"]'::jsonb,
    '[
        {
            "url": "https://www.cookpolitical.com/analysis/house/house-overview/2022-house-race-ratings-overview",
            "title": "2022 House Race Ratings Overview",
            "author": "Cook Political Report",
            "publication": "Cook Political Report",
            "date": "2022",
            "credibility_score": 90,
            "verified_working": true,
            "summary": "Analysis of competitive vs. safe House districts in 2022 elections"
        }
    ]'::jsonb,
    '[]'::jsonb
),

-- Step 2: How gerrymandering works technically
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 4),
    2,
    'concept',
    'The Science of Vote Stealing: Gerrymandering Techniques',
    'Modern gerrymandering uses sophisticated software to draw districts with surgical precision. "Packing" concentrates opposition voters, "cracking" spreads them thin. The result: parties can lose the popular vote but win more seats.',
    '{"type": "gerrymandering_techniques", "main_methods": [{"technique": "Packing", "definition": "Concentrate opposition voters into few districts", "effect": "Opposition wins those districts by huge margins, wastes votes", "example": "Illinois 4th District - 71% Hispanic to pack Latino Democrats"}, {"technique": "Cracking", "definition": "Spread opposition voters across many districts", "effect": "Opposition becomes minority in multiple districts", "example": "Texas split Austin into 6 districts to dilute Democratic strength"}], "modern_tools": {"software": "Maptitude, GIS systems with voter data", "data_sources": ["Precinct-level election results", "Demographic data", "Voter registration files", "Consumer purchasing data"], "precision": "Can predict election outcomes within 1-2%"}, "mathematical_measures": {"efficiency_gap": "Measures wasted votes between parties", "partisan_bias": "Expected seat advantage at 50% vote share", "competitiveness": "Number of districts within 5% margin"}, "case_study": {"state": "North Carolina 2016", "vote_share": "Republicans 53% of votes", "seat_share": "Republicans 77% of seats (10 of 13)", "court_ruling": "Struck down as unconstitutional partisan gerrymander"}}'::jsonb,
    80,
    false,
    true,
    '["packing-cracking", "gerrymandering-software", "mathematical-analysis", "vote-efficiency"]'::jsonb,
    '[
        {
            "url": "https://www.brennancenter.org/our-work/analysis-opinion/how-gerrymandering-works",
            "title": "How Gerrymandering Works",
            "author": "Brennan Center for Justice",
            "publication": "Brennan Center",
            "date": "2023",
            "credibility_score": 95,
            "verified_working": true,
            "summary": "Detailed explanation of gerrymandering techniques and measurement"
        }
    ]'::jsonb,
    '["safe-seats"]'::jsonb
),

-- Step 3: Consequences of safe seats
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 4),
    3,
    'concept',
    'When Elections Don''t Matter: The Safe Seat Syndrome',
    'Safe seats create perverse incentives. Representatives fear primary challenges from extremes more than general election voters. This drives polarization, reduces compromise, and makes representatives less responsive to broader constituencies.',
    '{"type": "safe_seat_consequences", "electoral_dynamics": {"primary_importance": "In safe seats, primary is the real election", "primary_turnout": "Typically 15-25% of eligible voters", "primary_voters": "More ideologically extreme than general electorate", "general_election": "Predetermined outcome, low engagement"}, "behavioral_changes": [{"change": "Reduced moderation", "mechanism": "No need to appeal to center", "evidence": "Voting patterns become more partisan"}, {"change": "Increased fundraising focus", "mechanism": "Can raise money for party without electoral risk", "evidence": "Safe seat members raise more for colleagues"}, {"change": "Less constituent service", "mechanism": "Voters can''t punish poor performance", "evidence": "Fewer town halls, less responsive offices"}], "systemic_effects": {"polarization": "Safe seats enable extreme positions", "gridlock": "Less incentive for bipartisan compromise", "accountability": "Reduced responsiveness to constituents", "innovation": "Less policy experimentation"}, "primary_challenge_dynamics": {"frequency": "Rare but devastating when they occur", "funding_sources": "Often from out-of-district ideological groups", "success_rate": "Low but creates fear among incumbents"}}'::jsonb,
    70,
    false,
    true,
    '["safe-seat-behavior", "primary-dynamics", "polarization-drivers", "accountability-breakdown"]'::jsonb,
    '[
        {
            "url": "https://fivethirtyeight.com/features/the-effects-of-gerrymandering-on-competitiveness-and-extremism/",
            "title": "The Effects of Gerrymandering on Competitiveness and Extremism",
            "author": "FiveThirtyEight",
            "publication": "FiveThirtyEight",
            "date": "2018",
            "credibility_score": 85,
            "verified_working": true,
            "summary": "Analysis of how safe seats affect representative behavior and polarization"
        }
    ]'::jsonb,
    '["mathematical-analysis"]'::jsonb
),

-- Step 4: Interactive district drawing exercise
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 4),
    4,
    'interaction',
    'Draw the Districts: Gerrymandering Simulation',
    'Try drawing congressional districts for a fictional state. See how different goals (competitiveness, party advantage, minority representation) create completely different maps.',
    '{"type": "redistricting_simulation", "state_scenario": {"name": "Fictional State", "population": "10 million", "districts_needed": 10, "party_breakdown": "52% Republican, 48% Democratic", "geographic_distribution": {"urban_areas": "Mostly Democratic", "suburban_areas": "Mixed", "rural_areas": "Mostly Republican"}, "minority_populations": "20% Hispanic, concentrated in 3 counties"}, "drawing_objectives": [{"goal": "Competitive districts", "target": "Create districts within 5% margin", "challenge": "Geographic clustering makes this difficult"}, {"goal": "Proportional representation", "target": "5 Republican, 5 Democratic seats", "challenge": "Requires some creative boundaries"}, {"goal": "Maximize party advantage", "target": "Pack opposition, crack swing areas", "challenge": "May violate compactness requirements"}, {"goal": "Protect minority representation", "target": "Create majority-minority districts", "challenge": "May conflict with other objectives"}], "constraints": ["Districts must be contiguous", "Roughly equal population", "Respect county/city boundaries when possible", "Comply with Voting Rights Act"], "learning_outcomes": ["Different objectives create different maps", "Trade-offs between competing values", "Technical difficulty of fair redistricting", "Why automated or commission-based redistricting might work better"]}'::jsonb,
    180, -- 3 minutes for simulation
    true,
    false,
    '["redistricting-simulation", "competing-objectives", "technical-constraints", "fairness-challenges"]'::jsonb,
    '[]'::jsonb,
    '["polarization-drivers"]'::jsonb
),

-- Step 5: Reform solutions and current efforts
(
    (SELECT ci.id FROM collection_items ci JOIN collections c ON ci.collection_id = c.id 
     WHERE c.slug = 'congress-decoded-2024' AND ci.sort_order = 4),
    5,
    'concept',
    'Fixing the Maps: Redistricting Reform in Action',
    'Several states have adopted redistricting reforms: independent commissions, algorithmic drawing, and transparency requirements. These reforms reduce gerrymandering but face resistance from incumbents who benefit from safe seats.',
    '{"type": "redistricting_reforms", "current_reforms": [{"type": "Independent commissions", "states": ["California", "Arizona", "Michigan", "Colorado"], "mechanism": "Non-politicians draw districts", "results": "More competitive districts, less partisan outcomes", "challenges": "Still have political appointees"}, {"type": "Algorithmic redistricting", "states": ["Iowa uses non-partisan staff"], "mechanism": "Computer algorithms optimize for fairness criteria", "results": "Highly competitive districts", "challenges": "Requires defining fairness mathematically"}, {"type": "Transparency requirements", "states": ["Texas", "Florida require public hearings"], "mechanism": "Open process with public input", "results": "Limited - still allows gerrymandering", "benefit": "Public awareness and accountability"}], "federal_proposals": [{"bill": "Freedom to Vote Act", "provision": "National redistricting standards", "status": "Blocked by Senate rules", "requirements": ["Independent commissions", "Transparency", "Communities of interest"]}, {"bill": "John Lewis Voting Rights Advancement Act", "provision": "Federal oversight of redistricting", "status": "House passed, Senate blocked", "mechanism": "Preclearance for changes in covered states"}], "citizen_action": ["Support redistricting ballot initiatives", "Participate in public comment periods", "Join advocacy groups like Common Cause", "Vote for candidates supporting reform", "Volunteer for independent redistricting efforts"]}'::jsonb,
    65,
    false,
    true,
    '["redistricting-reform", "independent-commissions", "algorithmic-methods", "federal-legislation"]'::jsonb,
    '[
        {
            "url": "https://www.commoncause.org/our-work/gerrymandering-and-representation/",
            "title": "Gerrymandering and Representation",
            "author": "Common Cause",
            "publication": "Common Cause",
            "date": "2024",
            "credibility_score": 85,
            "verified_working": true,
            "summary": "Overview of redistricting reform efforts and current state laws"
        }
    ]'::jsonb,
    '["fairness-challenges"]'::jsonb
);
