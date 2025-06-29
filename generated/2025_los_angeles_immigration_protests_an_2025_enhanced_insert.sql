-- ============================================
-- CivicSense Enhanced Quiz Content - EXPANDED
-- ============================================
-- Topic: 2025 Los Angeles Immigration Protests and Federal Troop Deployment
-- Topic ID: 2025_los_angeles_immigration_protests_expanded
-- Generated: 2025-06-12T18:30:00.000Z
-- Questions: 20
-- Categories: Government, Constitutional Law, Civic Action, Public Policy
-- All sources verified and working
-- ============================================

-- Insert quiz topic
INSERT INTO question_topics (
    topic_id, topic_title, description, why_this_matters,
    emoji, date, day_of_week, categories, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    '2025 Los Angeles Immigration Protests and Federal Troop Deployment',
    'This comprehensive quiz examines the June 2025 LA protests against ICE raids and the historic federal deployment of National Guard troops and Marines without state consent. It explores constitutional conflicts between federal authority and state sovereignty, the role of civic protest, and unprecedented military deployment on American streets.',
    '<ul><li><strong>Constitutional Knowledge:</strong> Understanding federal vs. state authority helps you recognize when government power may be overstepping constitutional bounds in your community.</li><li><strong>Civic Rights Awareness:</strong> Knowing your First Amendment protest rights and how military deployment affects civilian law enforcement protects your democratic participation.</li><li><strong>Historical Context:</strong> This rare federal military deployment without state consent hasn''t happened since 1965, making it crucial to understand the precedent being set.</li><li><strong>Democratic Participation:</strong> These events show how federal immigration policy, state resistance, and citizen protest intersect in ways that directly impact local communities nationwide.</li></ul>',
    '🏛️',
    '2025-06-10',
    'Tuesday',
    '["Government","Constitutional Law","Civic Action","Public Policy"]',
    true
);

-- Question 1: Multiple Choice (Government) - Troop Numbers
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    1,
    'multiple_choice',
    'Government',
    'How many active-duty Marines were deployed to Los Angeles in June 2025?',
    '400',
    '700',
    '1,000',
    '2,500',
    'option_b',
    'This specific number was widely reported as Marines were mobilized from Camp Pendleton.',
    'The deployment of 700 Marines from the 2nd Battalion, 7th Marines at Twentynine Palms demonstrated unprecedented federal military force on American streets without state consent since 1965.',
    '["federal_authority","military_deployment","executive_power"]',
    '[{"name":"ABC News - National Guard troops arrive in Los Angeles","url":"https://abcnews.go.com/US/protests-erupt-immigration-raids-los-angeles/story?id=122604723"},{"name":"California AG Press Release","url":"https://oag.ca.gov/news/press-releases/attorney-general-bonta-governor-newsom-challenge-trump-order-seeking-federalize"}]',
    1,
    true
);

-- Question 2: Multiple Choice (Constitutional Law) - State Rights Amendment
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    2,
    'multiple_choice',
    'Constitutional Law',
    'Which constitutional amendment did California cite in its lawsuit against federal troop deployment?',
    'First Amendment (free speech)',
    'Tenth Amendment (state powers)',
    'Fourteenth Amendment (equal protection)',
    'Fourth Amendment (unreasonable search)',
    'option_b',
    'This amendment reserves powers not delegated to the federal government to the states.',
    'The Tenth Amendment reserves powers to states that aren''t specifically given to the federal government, making California''s argument that Trump violated state sovereignty by deploying troops without consent.',
    '["tenth_amendment","federalism","state_sovereignty"]',
    '[{"name":"California Governor Lawsuit Filing","url":"https://www.gov.ca.gov/2025/06/09/governor-newsom-suing-president-trump-and-department-of-defense-for-illegal-takeover-of-calguard-unit/"},{"name":"CalMatters Federal Judge Ruling","url":"https://calmatters.org/justice/2025/06/los-angeles-marines-newsom-lawsuit/"}]',
    2,
    true
);

-- Question 3: True/False (Civic Action) - Freeway Shutdown
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    3,
    'true_false',
    'Civic Action',
    'Protesters successfully blocked major highways during the June 2025 demonstrations.',
    NULL,
    NULL,
    NULL,
    NULL,
    'true',
    'Multiple news sources reported highway blockages as part of the escalating protests.',
    'Highway blockages demonstrated the scale of civil disobedience, raising questions about balancing First Amendment protest rights with public safety and transportation access.',
    '["first_amendment","civil_disobedience","protest_rights"]',
    '[{"name":"ABC News LA Protests Timeline","url":"https://abcnews.go.com/US/timeline-ice-raids-sparked-la-protests-prompted-trump/story?id=122688437"}]',
    1,
    true
);

-- Question 4: Multiple Choice (Government) - Legal Authority
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    4,
    'multiple_choice',
    'Government',
    'Which federal law section did Trump invoke to deploy the National Guard?',
    'Section 12405',
    'Section 12406',
    'Section 12407',
    'Section 12408',
    'option_b',
    'This specific section of Title 10 allows federal activation of National Guard under certain conditions.',
    'Section 12406 of Title 10 allows the president to federalize National Guard troops during invasion, rebellion, or when unable to execute laws with regular forces - but requires orders through state governors.',
    '["title_10","legal_authority","federal_law"]',
    '[{"name":"California AG Legal Challenge","url":"https://oag.ca.gov/news/press-releases/attorney-general-bonta-governor-newsom-challenge-trump-order-seeking-federalize"}]',
    3,
    true
);

-- Question 5: Short Answer (Public Policy) - Community Trust Impact
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    5,
    'short_answer',
    'Public Policy',
    'Name the California Attorney General who filed the lawsuit against the Trump administration.',
    NULL,
    NULL,
    NULL,
    NULL,
    'Rob Bonta',
    'Look for the state official who leads California''s legal challenges.',
    'Attorney General Rob Bonta led California''s constitutional challenge, arguing that federal military deployment without state consent violated both statutory law and the Tenth Amendment.',
    '["state_government","legal_challenges","california_politics"]',
    '[{"name":"California AG Rob Bonta Press Release","url":"https://oag.ca.gov/news/press-releases/attorney-general-bonta-governor-newsom-challenge-trump-order-seeking-federalize"}]',
    2,
    true
);

-- Question 6: Multiple Choice (Constitutional Law) - Historical Precedent
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    6,
    'multiple_choice',
    'Constitutional Law',
    'When was the last time a president deployed a state''s National Guard without the governor''s consent?',
    '1962',
    '1965',
    '1968',
    '1992',
    'option_b',
    'This was during the civil rights era when federal troops protected protesters in the South.',
    'President Lyndon B. Johnson deployed Alabama National Guard troops in 1965 to protect civil rights protesters, making Trump''s 2025 deployment the first such action in nearly 60 years.',
    '["historical_precedent","civil_rights","federal_authority"]',
    '[{"name":"The Hill California Lawsuit Coverage","url":"https://thehill.com/regulation/court-battles/5341244-california-sues-trump-national-guard-deployment/"}]',
    3,
    true
);

-- Question 7: True/False (Government) - Local Police Notification
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    7,
    'true_false',
    'Government',
    'Los Angeles Mayor Karen Bass was notified in advance of the ICE raids that sparked the protests.',
    NULL,
    NULL,
    NULL,
    NULL,
    'false',
    'Check reports about coordination between federal and local authorities.',
    'Mayor Bass confirmed that neither she nor the LAPD were aware the ICE raids would happen, highlighting the lack of federal-local coordination that contributed to the chaotic response.',
    '["federal_local_coordination","law_enforcement","transparency"]',
    '[{"name":"ABC News National Guard Deployment","url":"https://abcnews.go.com/US/protests-erupt-immigration-raids-los-angeles/story?id=122604723"}]',
    2,
    true
);

-- Question 8: Multiple Choice (Civic Action) - Protest Duration
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    8,
    'multiple_choice',
    'Civic Action',
    'How many days did the Los Angeles immigration protests continue?',
    'Two days',
    'Three days',
    'Four days',
    'Five days',
    'option_c',
    'Count from Friday when ICE raids began through the major protest activities.',
    'The protests lasted four days from June 6-9, 2025, demonstrating sustained civic resistance to federal immigration enforcement and military deployment.',
    '["protest_duration","civic_engagement","sustained_action"]',
    '[{"name":"PBS News Hour LA Protests Coverage","url":"https://www.pbs.org/newshour/show/california-sues-trump-calling-national-guard-deployment-unconstitutional-and-immoral"}]',
    1,
    true
);

-- Question 9: Multiple Choice (Government) - ICE Leadership
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    9,
    'multiple_choice',
    'Government',
    'Who was the ICE Acting Director who criticized Mayor Bass during the protests?',
    'Tom Homan',
    'Todd Lyons',
    'Michael Banks',
    'Dan Bongino',
    'option_b',
    'This ICE official made public statements blaming local officials for the response.',
    'ICE Acting Director Todd Lyons publicly criticized Mayor Bass, claiming she "took the side of chaos and lawlessness," illustrating tensions between federal enforcement and local governance.',
    '["ice_leadership","federal_criticism","intergovernmental_conflict"]',
    '[{"name":"ABC News Federal vs Local Officials","url":"https://abcnews.go.com/US/protests-erupt-immigration-raids-los-angeles/story?id=122604723"}]',
    2,
    true
);

-- Question 10: Short Answer (Constitutional Law) - Judge's Ruling
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    10,
    'short_answer',
    'Constitutional Law',
    'Name the federal judge who blocked Trump''s National Guard deployment.',
    NULL,
    NULL,
    NULL,
    NULL,
    'Charles Breyer',
    'Look for the federal judge who issued the ruling against the military deployment.',
    'Judge Charles Breyer ruled that Trump''s deployment was illegal, stating it exceeded statutory authority and violated the Tenth Amendment, demonstrating judicial checks on executive power.',
    '["judicial_review","constitutional_law","checks_and_balances"]',
    '[{"name":"CalMatters Federal Judge Blocks Deployment","url":"https://calmatters.org/justice/2025/06/los-angeles-marines-newsom-lawsuit/"}]',
    3,
    true
);

-- Question 11: True/False (Public Policy) - House Speaker Support
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    11,
    'true_false',
    'Public Policy',
    'House Speaker Mike Johnson publicly supported Trump''s decision to deploy troops to Los Angeles.',
    NULL,
    NULL,
    NULL,
    NULL,
    'true',
    'Look for congressional leadership statements about the military deployment.',
    'House Speaker Johnson told ABC News he was "not concerned at all" and called it "real leadership," showing congressional Republican support for expanded executive military power.',
    '["congressional_support","executive_power","political_alignment"]',
    '[{"name":"ABC News House Speaker Johnson Statement","url":"https://abcnews.go.com/US/protests-erupt-immigration-raids-los-angeles/story?id=122604723"}]',
    2,
    true
);

-- Question 12: Multiple Choice (Civic Action) - Sanctuary City Status
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    12,
    'multiple_choice',
    'Civic Action',
    'When did Los Angeles officially become a sanctuary city?',
    'January 2025',
    'November 2024',
    'March 2024',
    'September 2023',
    'option_b',
    'This status was established recently and became relevant during the protests.',
    'LA became a sanctuary city in November 2024, limiting cooperation with federal immigration authorities and creating the policy conflict that intensified during the 2025 protests.',
    '["sanctuary_cities","local_policy","immigration_policy"]',
    '[{"name":"CNN LA Protests Coverage","url":"https://www.cnn.com/us/live-news/la-protests-ice-raids-trump-06-09-25"}]',
    2,
    true
);

-- Question 13: Multiple Choice (Government) - National Guard Unit
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    13,
    'multiple_choice',
    'Government',
    'Which California National Guard unit was deployed to Los Angeles?',
    '78th Infantry Brigade Combat Team',
    '79th Infantry Brigade Combat Team',
    '80th Infantry Brigade Combat Team',
    '81st Infantry Brigade Combat Team',
    'option_b',
    'This specific unit number was mentioned in official military communications.',
    'The 79th Infantry Brigade Combat Team deployment showed how federal authority can commandeer specific state military units without state consent, raising federalism concerns.',
    '["national_guard","military_units","state_federal_relations"]',
    '[{"name":"ABC News National Guard Unit Details","url":"https://abcnews.go.com/US/protests-erupt-immigration-raids-los-angeles/story?id=122604723"}]',
    3,
    true
);

-- Question 14: True/False (Constitutional Law) - Posse Comitatus Act
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    14,
    'true_false',
    'Constitutional Law',
    'The Posse Comitatus Act prevents military forces from performing domestic law enforcement duties unless the Insurrection Act is invoked.',
    NULL,
    NULL,
    NULL,
    NULL,
    'true',
    'This federal law restricts military involvement in civilian law enforcement.',
    'The Posse Comitatus Act creates a key constitutional barrier to military policing, which Trump navigated by not invoking the Insurrection Act while still deploying troops.',
    '["posse_comitatus","military_law","civil_military_relations"]',
    '[{"name":"Time Magazine Constitutional Analysis","url":"https://time.com/7292191/trump-newsom-national-guard-california-los-angeles-protests-legal-challenge/"}]',
    3,
    true
);

-- Question 15: Multiple Choice (Public Policy) - LAPD Response Time
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    15,
    'multiple_choice',
    'Public Policy',
    'According to LAPD, how long did it take them to respond to the federal building protests?',
    '25 minutes',
    '55 minutes',
    '85 minutes',
    '2+ hours',
    'option_b',
    'The LAPD disputed ICE claims about delayed response with this specific timeframe.',
    'LAPD''s 55-minute response time contradicted ICE claims of a 2+ hour delay, highlighting how federal-local tensions affect crisis response and public accountability.',
    '["law_enforcement_response","intergovernmental_coordination","public_safety"]',
    '[{"name":"ABC News LAPD Response Details","url":"https://abcnews.go.com/US/protests-erupt-immigration-raids-los-angeles/story?id=122604723"}]',
    2,
    true
);

-- Question 16: Short Answer (Civic Action) - Border Czar Threat
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    16,
    'short_answer',
    'Civic Action',
    'What did Border Czar Tom Homan threaten to do to Governor Newsom and Mayor Bass?',
    NULL,
    NULL,
    NULL,
    NULL,
    'Arrest them',
    'Homan made specific threats against state and local officials who opposed federal actions.',
    'Homan''s arrest threats against elected officials represented an unprecedented escalation in federal-state conflicts, raising questions about democratic governance and official immunity.',
    '["federal_threats","elected_officials","democratic_norms"]',
    '[{"name":"The Hill Newsom vs Homan","url":"https://thehill.com/regulation/court-battles/5339718-california-lawsuit-trump-national-guard/"}]',
    2,
    true
);

-- Question 17: Multiple Choice (Government) - Protest Growth Pattern
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    17,
    'multiple_choice',
    'Government',
    'According to California officials, how did protest numbers change after National Guard deployment?',
    'Decreased from 3,000 to 250',
    'Stayed the same at about 1,000',
    'Increased from 250 to 3,000+',
    'Fluctuated between 500-1,500',
    'option_c',
    'California argued that military deployment actually escalated the situation.',
    'The growth from 250 to 3,000+ protesters after National Guard arrival supported California''s argument that federal military deployment inflamed rather than calmed tensions.',
    '["protest_escalation","military_presence","crowd_dynamics"]',
    '[{"name":"California Governor Emergency Motion","url":"https://www.gov.ca.gov/2025/06/10/governor-newsom-files-emergency-motion-to-block-trumps-unlawful-militarization-of-los-angeles/"}]',
    2,
    true
);

-- Question 18: True/False (Constitutional Law) - 1992 Comparison
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    18,
    'true_false',
    'Constitutional Law',
    'Unlike in 1992 LA riots, California Governor Pete Wilson had requested federal assistance from President George H.W. Bush.',
    NULL,
    NULL,
    NULL,
    NULL,
    'true',
    'The key difference between 1992 and 2025 was state consent for federal intervention.',
    'The 1992 precedent shows that federal military intervention typically occurs with state consent, making Trump''s 2025 unilateral deployment constitutionally unprecedented.',
    '["historical_comparison","state_consent","constitutional_precedent"]',
    '[{"name":"Time Magazine Legal Analysis","url":"https://time.com/7292191/trump-newsom-national-guard-california-los-angeles-protests-legal-challenge/"}]',
    3,
    true
);

-- Question 19: Multiple Choice (Public Policy) - Affected Locations
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    19,
    'multiple_choice',
    'Public Policy',
    'Which Los Angeles area city experienced looting during the immigration protests?',
    'Compton',
    'Paramount',
    'Little Tokyo',
    'Westlake',
    'option_b',
    'This smaller city saw violence including looting at commercial locations.',
    'Looting in Paramount demonstrated how federal immigration enforcement can trigger broader civil unrest that affects multiple communities beyond the initial protest sites.',
    '["civil_unrest","community_impact","law_and_order"]',
    '[{"name":"ABC News Paramount Violence","url":"https://abcnews.go.com/US/protests-erupt-immigration-raids-los-angeles/story?id=122604723"}]',
    1,
    true
);

-- Question 20: Short Answer (Constitutional Law) - Emergency Court Motion
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2025_los_angeles_immigration_protests_expanded',
    20,
    'short_answer',
    'Constitutional Law',
    'What additional federal forces prompted California to file an emergency motion to expand their lawsuit?',
    NULL,
    NULL,
    NULL,
    NULL,
    'Marines',
    'California sought to block the deployment of additional military forces beyond the National Guard.',
    'The Marines deployment prompted California''s emergency motion because it represented an escalation from National Guard (state forces under federal control) to active-duty military, raising greater constitutional concerns.',
    '["military_escalation","emergency_legal_action","active_duty_deployment"]',
    '[{"name":"California Governor Emergency Motion Filing","url":"https://www.gov.ca.gov/2025/06/10/governor-newsom-files-emergency-motion-to-block-trumps-unlawful-militarization-of-los-angeles/"}]',
    3,
    true
);

-- End of CivicSense expanded quiz content