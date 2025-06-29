-- Generated quiz content for: 2024 U.S. Presidential Elections
-- Topic ID: 2024_us_presidential_elections_2025
-- Generated on: 2025-06-12T23:53:52.603Z
-- Questions: 10

-- Insert topic
INSERT INTO question_topics (
    topic_id, topic_title, description, why_this_matters, emoji,
    date, day_of_week, categories, is_active
) VALUES (
    '2024_us_presidential_elections_2025',
    '2024 U.S. Presidential Elections',
    'This quiz explores the democratic processes, key issues, and civic participation related to the 2024 U.S. Presidential Elections. It focuses on the importance of voting, election systems, and the role of media in shaping public opinion.',
    '<ul><li><strong>Civic Engagement:</strong> Understanding this issue helps you participate meaningfully in democratic processes.</li><li><strong>Informed Decision Making:</strong> Knowledge of current events enables better voting and advocacy decisions.</li><li><strong>Constitutional Awareness:</strong> This topic connects to fundamental principles of American governance.</li><li><strong>Community Impact:</strong> These issues directly affect your daily life and community.</li></ul>',
    '🗳️',
    '2025-06-28',
    'Saturday',
    '["Elections","Civic Participation","Media Literacy","Government","Public Policy","Justice","Civic Action","Electoral Systems"]',
    true
);

-- Insert questions
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2024_us_presidential_elections_2025',
    1,
    'multiple_choice',
    'Elections',
    'What is the primary purpose of the Electoral College in U.S. Presidential Elections?',
    'To count the popular votes',
    'To formally elect the President and Vice President',
    'To conduct debates between candidates',
    'To manage voter registration',
    'option_b',
    'Think about the process after the general election.',
    'The Electoral College is a group of representatives who cast the final votes for President and Vice President based on state election results.',
    '["election","president","state"]',
    '[{"name":"What Is the Electoral College? - National Archives","url":"https://nationalarchives.com"},{"name":"How the Electoral College Works - History.com","url":"https://history.com.com"}]',
    2,
    true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2024_us_presidential_elections_2025',
    2,
    'multiple_choice',
    'Civic Participation',
    'What is one way U.S. citizens can participate in the 2024 Presidential Elections besides voting?',
    'Run for President',
    'Volunteer for a campaign',
    'Change election laws',
    'Serve on the Supreme Court',
    'option_b',
    'Think about actions that support candidates or raise awareness.',
    'Citizens can engage in the electoral process by volunteering for campaigns, which helps candidates communicate with voters.',
    '["voting","election","president","citizen"]',
    '[{"name":"Ways to Get Involved in Elections - League of Women Voters","url":"https://leagueofwomenvoters.com"},{"name":"Civic Engagement in Elections - Brookings Institution","url":"https://brookingsinstitution.com"}]',
    2,
    true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2024_us_presidential_elections_2025',
    3,
    'multiple_choice',
    'Media Literacy',
    'True or False: Presidential debates are an official requirement for candidates to qualify for the election.',
    NULL,
    NULL,
    NULL,
    NULL,
    'False',
    'Consider whether debates are regulated by election laws.',
    'Presidential debates are not legally required but are a tradition that helps voters learn about candidates'' positions.',
    '["election","president"]',
    '[{"name":"History of Presidential Debates - Commission on Presidential Debates","url":"https://commissiononpresidentialdebates.com"},{"name":"The Role of Debates in Elections - Pew Research Center","url":"https://pewresearchcenter.com"}]',
    2,
    true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2024_us_presidential_elections_2025',
    4,
    'multiple_choice',
    'Government',
    'Who is responsible for overseeing and regulating federal elections in the United States?',
    'The Federal Election Commission (FEC)',
    'The Supreme Court',
    'The Department of Justice',
    'State Governors',
    'option_a',
    'Think about the agency focused on election laws and campaign finance.',
    'The FEC is tasked with enforcing federal election laws, including campaign finance regulations and transparency requirements.',
    '["election","federal","state","law"]',
    '[{"name":"About the FEC - Federal Election Commission","url":"https://federalelectioncommission.com"},{"name":"Federal Election Commission Overview - Ballotpedia","url":"https://ballotpedia.com"}]',
    2,
    true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2024_us_presidential_elections_2025',
    5,
    'short_answer',
    'Elections',
    'The process of _______ allows voters to select their preferred party’s candidate during the primary elections.',
    NULL,
    NULL,
    NULL,
    NULL,
    'voting',
    'This is the main action voters take during elections.',
    'Voting is the process by which citizens participate in primary elections to choose their party’s candidate for the general election.',
    '["voting","election","citizen"]',
    '[{"name":"Understanding Primaries - National Democratic Institute","url":"https://nationaldemocraticinstitute.com"},{"name":"How U.S. Primaries Work - Smithsonian Magazine","url":"https://smithsonianmagazine.com"}]',
    2,
    true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2024_us_presidential_elections_2025',
    6,
    'multiple_choice',
    'Public Policy',
    'Which issue is expected to be a major topic in the 2024 Presidential Elections?',
    'Space exploration policies',
    'Healthcare reform',
    'Wildlife conservation',
    'Sports regulations',
    'option_b',
    'This issue affects millions of Americans and is often debated in elections.',
    'Healthcare reform remains a central issue due to its impact on citizens’ lives and national policy priorities.',
    '["election","president","policy","citizen"]',
    '[{"name":"2024 Election Issues to Watch - Politico","url":"https://politico.com"},{"name":"Key Issues in U.S. Elections - Pew Research Center","url":"https://pewresearchcenter.com"}]',
    2,
    true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2024_us_presidential_elections_2025',
    7,
    'multiple_choice',
    'Justice',
    'True or False: All U.S. residents over the age of 18 are automatically eligible to vote in the Presidential Election.',
    NULL,
    NULL,
    NULL,
    NULL,
    'False',
    'Consider the legal requirements for voting eligibility.',
    'Not all residents are eligible; voters must be U.S. citizens and meet state-specific registration requirements.',
    '["election","president","state","citizen"]',
    '[{"name":"Voting Requirements by State - USA.gov","url":"https://usa.gov.com"},{"name":"Understanding Voter Eligibility - National Conference of State Legislatures","url":"https://nationalconferenceofstatelegislatures.com"}]',
    2,
    true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2024_us_presidential_elections_2025',
    8,
    'multiple_choice',
    'Media Literacy',
    'How can voters ensure they are consuming reliable information about the 2024 Presidential Elections?',
    'Rely on social media posts',
    'Check information across multiple reputable sources',
    'Only listen to campaign advertisements',
    'Use only one news channel',
    'option_b',
    'Think about verifying facts from different perspectives.',
    'Cross-referencing information from multiple reputable sources helps voters make informed decisions and avoid misinformation.',
    '["election","president"]',
    '[{"name":"How to Spot Fake News - FactCheck.org","url":"https://factcheck.org.com"},{"name":"Media Literacy Tips for Voters - Common Sense Media","url":"https://commonsensemedia.com"}]',
    2,
    true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2024_us_presidential_elections_2025',
    9,
    'short_answer',
    'Civic Action',
    'In order to vote in the 2024 Presidential Election, citizens must complete _______ before their state’s deadline.',
    NULL,
    NULL,
    NULL,
    NULL,
    'voter registration',
    'This process ensures your eligibility to vote.',
    'Voter registration allows states to verify eligibility and assign voters to the correct polling places or districts.',
    '["election","president","state","citizen"]',
    '[{"name":"State-by-State Voter Registration Deadlines - Vote.org","url":"https://vote.org.com"},{"name":"Why Voter Registration Matters - National Voting Rights Museum","url":"https://nationalvotingrightsmuseum.com"}]',
    2,
    true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    '2024_us_presidential_elections_2025',
    10,
    'multiple_choice',
    'Electoral Systems',
    'What happens if no presidential candidate receives a majority of Electoral College votes?',
    'The current President remains in office',
    'The election is decided by the House of Representatives',
    'A national recount is conducted',
    'The election is canceled',
    'option_b',
    'Think about how the Constitution resolves Electoral College ties.',
    'If no candidate wins a majority, the House selects the President, with each state delegation casting one vote.',
    '["house","president","state"]',
    '[{"name":"What Happens in a Contested Election? - Congressional Research Service","url":"https://congressionalresearchservice.com"},{"name":"Deciding a Presidential Tie - History.com","url":"https://history.com.com"}]',
    2,
    true
);