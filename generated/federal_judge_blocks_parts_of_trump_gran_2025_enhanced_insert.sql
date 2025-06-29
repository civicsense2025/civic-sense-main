-- ============================================
-- CivicSense Enhanced Quiz Content
-- ============================================
-- Topic: Federal Judge Blocks Parts of Trump Grant Funding Freeze
-- Topic ID: federal_judge_blocks_parts_of_trump_gran_2025
-- Generated: 2025-06-13T06:38:44.799Z
-- Questions: 20
-- Categories: Government, Constitutional Law, Judicial Review, Public Policy, Federalism, Historical Precedent, Policy Analysis, Civic Action, Civic Participation, Civic Engagement, Democratic Accountability
-- ============================================

-- Insert quiz topic
INSERT INTO question_topics (
    topic_id, topic_title, description, why_this_matters,
    emoji, date, day_of_week, categories, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    'Federal Judge Blocks Parts of Trump Grant Funding Freeze',
    'This case demonstrates the constitutional principle of separation of powers and the judicial branch''s role in checking executive overreach. It shows how federal courts can protect congressional spending authority and highlights the importance of the Impoundment Control Act in preventing presidents from unilaterally withholding appropriated funds.',
    '<ul><li><strong>Civic Engagement:</strong> Understanding this current event helps you participate meaningfully in democratic processes and stay informed about key government decisions.</li><li><strong>Informed Citizenship:</strong> Knowledge of this issue enables better voting decisions and more effective advocacy on topics that affect your community.</li><li><strong>Constitutional Awareness:</strong> This topic connects to fundamental principles of American governance and helps you understand how our democratic system works in practice.</li><li><strong>Community Impact:</strong> These developments directly affect your daily life, from local services to federal policies that shape your economic and social environment.</li></ul>',
    '🏛️',
    '2025-07-06',
    'Sunday',
    '["Government","Constitutional Law","Judicial Review","Public Policy","Federalism","Historical Precedent","Policy Analysis","Civic Action","Civic Participation","Civic Engagement","Democratic Accountability"]',
    true
);

-- Insert quiz questions
-- Question 1: multiple_choice (Government)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    1,
    'multiple_choice',
    'Government',
    'Which federal judge first issued a temporary restraining order blocking the Trump administration''s funding freeze?',
    'Judge John McConnell in Rhode Island',
    'Judge Loren AliKhan in Washington D.C.',
    'Judge Angel Kelley in Massachusetts',
    'Judge Jack McConnell in Connecticut',
    'option_b',
    'Think about which court location was mentioned first in the timeline of legal challenges.',
    'When you vote for federal judges through Senate confirmation, you''re choosing people who can stand up to presidential overreach. Judge AliKhan''s quick action shows how an independent judiciary protects your rights when other branches of government overstep their authority.',
    '["senate","president","federal","government"]',
    '[{"name":"Federal judge halts Trump freeze on federal grants and loans for a week - PBS News","url":"https://www.pbs.org/newshour/politics/federal-judge-halts-trump-freeze-on-federal-grants-and-loans-for-a-week"},{"name":"Judge blocks Trump federal funding freeze on all public loans, grants and more aid - CBS News","url":"https://www.cbsnews.com/news/trump-freeze-federal-loans-grants-white-house-memo/"}]',
    1,
    true
);

-- Question 2: multiple_choice (Government)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    2,
    'multiple_choice',
    'Government',
    'How many states joined the lawsuit against the Trump administration''s funding freeze?',
    '18 states plus Washington D.C.',
    '20 states plus Washington D.C.',
    '22 states plus Washington D.C.',
    '24 states plus Washington D.C.',
    'option_c',
    'Look for the specific number mentioned repeatedly in news reports about the multistate coalition.',
    'This massive coalition shows how state attorneys general can work together to challenge federal overreach. When you vote for your state''s attorney general, you''re choosing someone who might need to defend your state''s interests against the federal government.',
    '["federal","state","law","government"]',
    '[{"name":"US judge temporarily blocks Trump from freezing federal funding - Reuters (Alternative)","url":"https://reuters.com"},{"name":"Full List of States Suing Donald Trump Over Federal Funding Freeze - Newsweek","url":"https://www.newsweek.com/full-list-states-suing-donald-trump-federal-funding-freeze-2022653"}]',
    1,
    true
);

-- Question 3: multiple_choice (Constitutional Law)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    3,
    'multiple_choice',
    'Constitutional Law',
    'What is the name of the 1974 law that restricts presidents from withholding congressionally appropriated funds?',
    'Congressional Budget Control Act',
    'Federal Spending Oversight Act',
    'Impoundment Control Act',
    'Executive Budget Limitation Act',
    'option_c',
    'Think about the specific term used to describe when a president refuses to spend money Congress has allocated.',
    'This law exists because President Nixon tried to ignore Congress''s spending decisions in the 1970s. Understanding this helps you recognize when politicians are following proper procedures versus trying to grab power they don''t legally have.',
    '["constitution","congress","president","law"]',
    '[{"name":"Why this Nixon-inspired law says Trump can''t freeze federal funding - Axios","url":"https://www.axios.com/2025/01/29/trump-federal-funding-freeze-nixon-law"},{"name":"What you need to know about impoundment, and how Trump vows to use it - PBS News","url":"https://www.pbs.org/newshour/politics/what-you-need-to-know-about-impoundment-and-how-trump-vows-to-use-it"}]',
    1,
    true
);

-- Question 4: multiple_choice (Government)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    4,
    'multiple_choice',
    'Government',
    'Which federal agency issued the original memo ordering the funding freeze?',
    'Department of Treasury',
    'Office of Management and Budget (OMB)',
    'Department of Health and Human Services',
    'General Services Administration',
    'option_b',
    'Consider which agency typically handles federal budget decisions and spending oversight.',
    'The OMB controls how federal money flows to states and organizations. When you understand which agencies have this power, you can better track how your tax dollars are being managed and hold officials accountable for their decisions.',
    '["federal","state","government"]',
    '[{"name":"Second judge temporarily blocks federal funding freeze efforts by Trump administration - PBS News","url":"https://www.pbs.org/newshour/politics/second-judge-temporarily-blocks-federal-funding-freeze-efforts-by-trump-administration"},{"name":"Federal judge temporarily blocks Trump administration freeze on federal grants and loans - AP News (Alternative)","url":"https://apnews.com"}]',
    1,
    true
);

-- Question 5: multiple_choice (Constitutional Law)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    5,
    'multiple_choice',
    'Constitutional Law',
    'According to the Impoundment Control Act, what must a president do before withholding congressionally appropriated funds?',
    'Get approval from the Supreme Court',
    'Submit a request to Congress and wait 45 days for a response',
    'Declare a national emergency',
    'Obtain permission from state governors',
    'option_b',
    'Remember that Congress controls spending, so they need to be involved in any changes to their budget decisions.',
    'This process ensures Congress keeps control over spending decisions they''ve already made. When you vote for representatives and senators, you''re choosing people who will have the final say on whether presidential spending changes are approved.',
    '["constitution","congress","president","law"]',
    '[{"name":"Why this Nixon-inspired law says Trump can''t freeze federal funding - Axios","url":"https://www.axios.com/2025/01/29/trump-federal-funding-freeze-nixon-law"},{"name":"How a 1974 law prohibits presidents from blocking congressional spending - The Pennsylvania Independent","url":"https://pennsylvaniaindependent.com/politics/congress-spending-donald-trump-presidents-richard-nixon-impoundment-control-act-1974"}]',
    2,
    true
);

-- Question 6: multiple_choice (Government)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    6,
    'multiple_choice',
    'Government',
    'What was the estimated total value of federal funding that could have been affected by the Trump administration''s freeze?',
    '$1 trillion',
    '$2 trillion',
    '$3 trillion',
    '$5 trillion',
    'option_c',
    'Look for the specific dollar amount mentioned in the White House memo about federal assistance programs.',
    'This massive amount shows how much your daily life depends on federal programs, from school funding to disaster relief. Understanding these numbers helps you make informed decisions about candidates who promise to cut government spending.',
    '["federal","government","presidential powers"]',
    '[{"name":"Judge blocks Trump federal funding freeze on all public loans, grants and more aid - CBS News","url":"https://www.cbsnews.com/news/trump-freeze-federal-loans-grants-white-house-memo/"},{"name":"Democratic states plan to sue over Trump''s federal grant funding freeze - CBS News","url":"https://www.cbsnews.com/news/trump-funding-freeze-lawsuit-democratic-attorneys-general/"}]',
    2,
    true
);

-- Question 7: multiple_choice (Judicial Review)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    7,
    'multiple_choice',
    'Judicial Review',
    'What legal principle did Judge McConnell cite when blocking the funding freeze?',
    'The executive branch cannot act without congressional approval',
    'The funding freeze fundamentally undermines the distinct constitutional roles of each branch of government',
    'States have sovereign immunity from federal budget decisions',
    'The president lacks emergency powers during peacetime',
    'option_b',
    'Think about the core constitutional principle that keeps different branches of government in their proper roles.',
    'This ruling protects the balance of power that prevents any one branch from becoming too powerful. When you vote, you''re participating in a system designed to prevent government overreach through these constitutional checks and balances.',
    '["constitution","government","judicial","checks and balances"]',
    '[{"name":"A second federal judge has ruled to block the Trump administration''s spending freeze - NPR (Alternative)","url":"https://npr.org"},{"name":"Second federal judge extends block preventing the Trump administration from freezing funding - AP News (Alternative)","url":"https://apnews.com"}]',
    2,
    true
);

-- Question 8: multiple_choice (Public Policy)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    8,
    'multiple_choice',
    'Public Policy',
    'Which types of programs were specifically targeted in the Trump administration''s funding review?',
    'Military and defense programs',
    'Social Security and Medicare',
    'DEI, climate change, and transgender programs',
    'Infrastructure and transportation projects',
    'option_c',
    'Consider what the administration called ''woke'' policies that they wanted to eliminate.',
    'This targeting shows how presidential priorities can affect specific communities and programs. Your vote determines who gets to make these decisions about which programs deserve funding and which don''t.',
    '["president","policy","presidential powers"]',
    '[{"name":"Judge blocks Trump federal funding freeze on all public loans, grants and more aid - CBS News","url":"https://www.cbsnews.com/news/trump-freeze-federal-loans-grants-white-house-memo/"},{"name":"Democratic states plan to sue over Trump''s federal grant funding freeze - CBS News","url":"https://www.cbsnews.com/news/trump-funding-freeze-lawsuit-democratic-attorneys-general/"}]',
    2,
    true
);

-- Question 9: multiple_choice (Government)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    9,
    'multiple_choice',
    'Government',
    'What happened to the original OMB memo after legal challenges were filed?',
    'It was modified to exclude certain programs',
    'It was completely rescinded by the White House',
    'It was upheld by federal courts',
    'It was transferred to a different agency',
    'option_b',
    'Think about how the administration responded when faced with immediate legal pressure.',
    'This shows how legal challenges can force government officials to back down from questionable actions. Your right to challenge government decisions through the courts is a crucial check on executive power.',
    '["government","executive"]',
    '[{"name":"Second judge temporarily blocks federal funding freeze efforts by Trump administration - PBS News","url":"https://www.pbs.org/newshour/politics/second-judge-temporarily-blocks-federal-funding-freeze-efforts-by-trump-administration"},{"name":"Another Judge Halts Trump''s Federal Funding Freeze - Democracy Docket","url":"https://www.democracydocket.com/news-alerts/nonprofits-sue-trump-administration-over-federal-grants-freeze/"}]',
    2,
    true
);

-- Question 10: multiple_choice (Federalism)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    10,
    'multiple_choice',
    'Federalism',
    'Which essential services were mentioned as being jeopardized by the funding freeze?',
    'National defense and border security',
    'Healthcare, education, disaster relief, and law enforcement',
    'Space exploration and scientific research',
    'International trade and diplomacy',
    'option_b',
    'Consider the basic services that states provide to their residents using federal funding.',
    'These are services you interact with daily, from your local schools to emergency response. Understanding how federal funding supports state services helps you see why voting in both federal and state elections matters for your community.',
    '["voting","election","federal","state"]',
    '[{"name":"Attorney General Neronha co-leads 22 states and the District of Columbia in suing to stop Trump Administration - RI Attorney General","url":"https://riag.ri.gov/press-releases/attorney-general-neronha-co-leads-22-states-and-district-columbia-suing-stop-trump"},{"name":"Associated Press News","url":"https://apnews.com"}]',
    2,
    true
);

-- Question 11: multiple_choice (Constitutional Law)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    11,
    'multiple_choice',
    'Constitutional Law',
    'How does this case demonstrate the constitutional principle of separation of powers?',
    'The executive branch successfully overruled congressional spending decisions',
    'The judicial branch intervened to prevent executive overreach into legislative authority',
    'Congress immediately passed new laws to stop the president',
    'State governments took over federal responsibilities',
    'option_b',
    'Think about which branch of government stepped in to protect another branch''s constitutional powers.',
    'This case perfectly shows how the founders designed our system to prevent any one branch from grabbing too much power. When you vote for judges and the officials who appoint them, you''re maintaining this crucial balance that protects your rights.',
    '["constitution","law","rights","separation of powers"]',
    '[{"name":"A second federal judge has ruled to block the Trump administration''s spending freeze - NPR (Alternative)","url":"https://npr.org"},{"name":"Many Trump Administration Fiscal and Regulatory Actions Are Unlawful - Center on Budget and Policy Priorities","url":"https://www.cbpp.org/research/federal-budget/many-trump-administration-fiscal-and-regulatory-actions-are-unlawful"}]',
    3,
    true
);

-- Question 12: multiple_choice (Historical Precedent)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    12,
    'multiple_choice',
    'Historical Precedent',
    'What historical precedent led to the creation of the Impoundment Control Act?',
    'President Roosevelt''s New Deal programs',
    'President Nixon''s refusal to spend congressionally appropriated funds',
    'President Johnson''s Great Society initiatives',
    'President Reagan''s budget cuts',
    'option_b',
    'Think about which president''s actions in the 1970s prompted Congress to pass this law.',
    'Nixon tried to ignore Congress''s spending decisions, so lawmakers created rules to prevent future presidents from doing the same. This shows how past abuses of power lead to new protections for your democratic rights.',
    '["congress","president","law","rights"]',
    '[{"name":"Why this Nixon-inspired law says Trump can''t freeze federal funding - Axios","url":"https://www.axios.com/2025/01/29/trump-federal-funding-freeze-nixon-law"},{"name":"Many Trump Administration Fiscal and Regulatory Actions Are Unlawful - Center on Budget and Policy Priorities","url":"https://www.cbpp.org/research/federal-budget/many-trump-administration-fiscal-and-regulatory-actions-are-unlawful"}]',
    3,
    true
);

-- Question 13: multiple_choice (Policy Analysis)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    13,
    'multiple_choice',
    'Policy Analysis',
    'What does the Trump administration''s argument that the Impoundment Control Act is unconstitutional reveal about their view of presidential power?',
    'They believe presidents should have unlimited spending authority',
    'They think presidents should be able to ignore laws passed by Congress when they disagree with them',
    'They want to return to pre-1974 interpretations of executive budget authority',
    'They believe the Supreme Court should control federal spending',
    'option_c',
    'Consider what the administration means when they claim historical precedent for presidential impoundment power.',
    'This argument suggests they want to go back to a time when presidents had more power to ignore Congress''s spending decisions. Understanding these power struggles helps you evaluate whether candidates support strong democratic institutions or expanded executive authority.',
    '["constitution","congress","president","policy"]',
    '[{"name":"Why this Nixon-inspired law says Trump can''t freeze federal funding - Axios","url":"https://www.axios.com/2025/01/29/trump-federal-funding-freeze-nixon-law"},{"name":"Trump''s effort to withhold federal funding triggers constitutional showdown - NBC News","url":"https://www.nbcnews.com/politics/white-house/trumps-effort-withhold-federal-funding-will-trigger-imminent-legal-act-rcna189583"}]',
    3,
    true
);

-- Question 14: multiple_choice (Civic Action)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    14,
    'multiple_choice',
    'Civic Action',
    'How did the multistate lawsuit demonstrate the principle of federalism in action?',
    'States deferred to federal authority without question',
    'States used their legal standing to challenge federal overreach and protect their residents',
    'States ignored federal law and acted independently',
    'States asked the federal government for permission to sue',
    'option_b',
    'Think about how states can act as a check on federal power when they believe their interests are threatened.',
    'This shows how federalism allows states to push back against federal actions that harm their residents. Your state attorney general serves as a crucial defender of your interests against federal overreach, which is why these elections matter.',
    '["election","federal","state","law"]',
    '[{"name":"Full List of States Suing Donald Trump Over Federal Funding Freeze - Newsweek","url":"https://www.newsweek.com/full-list-states-suing-donald-trump-federal-funding-freeze-2022653"},{"name":"Attorney General James and Multistate Coalition Secure Court Order Blocking Trump Administration from Freezing Federal Funds - NY Attorney General","url":"https://ag.ny.gov/press-release/2025/attorney-general-james-and-multistate-coalition-secure-court-order-blocking"}]',
    3,
    true
);

-- Question 15: true_false (Government)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    15,
    'true_false',
    'Government',
    'True or False: The Trump administration followed proper legal procedures under the Impoundment Control Act before freezing federal funding.',
    NULL,
    NULL,
    NULL,
    NULL,
    'false',
    'Consider whether the administration sent the required notification to Congress before withholding funds.',
    'The administration skipped the required steps of notifying Congress and waiting for approval. This case shows why following proper procedures matters - it prevents government officials from making sudden decisions that could harm millions of people.',
    '["congress","federal","government","presidential powers"]',
    '[{"name":"What you need to know about impoundment, and how Trump vows to use it - PBS News","url":"https://www.pbs.org/newshour/politics/what-you-need-to-know-about-impoundment-and-how-trump-vows-to-use-it"},{"name":"Many Trump Administration Fiscal and Regulatory Actions Are Unlawful - Center on Budget and Policy Priorities","url":"https://www.cbpp.org/research/federal-budget/many-trump-administration-fiscal-and-regulatory-actions-are-unlawful"}]',
    2,
    true
);

-- Question 16: true_false (Constitutional Law)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    16,
    'true_false',
    'Constitutional Law',
    'True or False: The Constitution gives Congress the exclusive power to control federal spending, known as ''the power of the purse.''',
    NULL,
    NULL,
    NULL,
    NULL,
    'true',
    'Think about which branch of government the Constitution assigns the responsibility for taxing and spending.',
    'This fundamental principle means your elected representatives in Congress, not the president, have the final say on how your tax dollars are spent. This is why congressional elections are so important for controlling government spending priorities.',
    '["constitution","election","congress","president"]',
    '[{"name":"Trump''s effort to withhold federal funding triggers constitutional showdown - NBC News","url":"https://www.nbcnews.com/politics/white-house/trumps-effort-withhold-federal-funding-will-trigger-imminent-legal-act-rcna189583"},{"name":"How a 1974 law prohibits presidents from blocking congressional spending - The Pennsylvania Independent","url":"https://pennsylvaniaindependent.com/politics/congress-spending-donald-trump-presidents-richard-nixon-impoundment-control-act-1974"}]',
    1,
    true
);

-- Question 17: true_false (Judicial Review)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    17,
    'true_false',
    'Judicial Review',
    'True or False: Federal judges can only block government actions if they violate the Constitution, not if they violate federal laws.',
    NULL,
    NULL,
    NULL,
    NULL,
    'false',
    'Consider whether courts can enforce both constitutional principles and federal statutes like the Impoundment Control Act.',
    'Federal courts protect both constitutional rights and ensure government officials follow federal laws. This dual role means judges can stop illegal government actions even when they don''t rise to constitutional violations, providing broader protection for citizens.',
    '["constitution","federal","law","government"]',
    '[{"name":"US judge temporarily blocks Trump from freezing federal funding - Reuters (Alternative)","url":"https://reuters.com"},{"name":"Second judge blocks Trump''s federal aid funding freeze - NBC News","url":"https://www.nbcnews.com/politics/white-house/second-judge-blocks-trump-federal-aid-funding-freeze-rcna190249"}]',
    3,
    true
);

-- Question 18: true_false (Civic Participation)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    18,
    'true_false',
    'Civic Participation',
    'True or False: This case demonstrates that individual citizens have no way to challenge presidential actions that affect federal funding.',
    NULL,
    NULL,
    NULL,
    NULL,
    'false',
    'Think about the different groups that filed lawsuits and how they represent citizen interests.',
    'Citizens can challenge government actions through multiple channels - state attorneys general represent your interests, nonprofit organizations can sue on behalf of affected communities, and you can contact representatives to demand action. This case shows democracy working to protect citizen interests.',
    '["democracy","president","federal","state"]',
    '[{"name":"Another Judge Halts Trump''s Federal Funding Freeze - Democracy Docket","url":"https://www.democracydocket.com/news-alerts/nonprofits-sue-trump-administration-over-federal-grants-freeze/"},{"name":"Attorney General James and Multistate Coalition Secure Court Order Blocking Trump Administration from Freezing Federal Funds - NY Attorney General","url":"https://ag.ny.gov/press-release/2025/attorney-general-james-and-multistate-coalition-secure-court-order-blocking"}]',
    4,
    true
);

-- Question 19: short_answer (Civic Engagement)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    19,
    'short_answer',
    'Civic Engagement',
    'Explain how this case demonstrates the importance of voting in both federal and state elections for protecting citizen interests.',
    NULL,
    NULL,
    NULL,
    NULL,
    'This case shows that voting matters at multiple levels: federal elections determine who appoints judges that can check presidential power, congressional elections choose representatives who control spending decisions, and state elections select attorneys general who can challenge federal overreach. The 22 state attorneys general who sued were elected officials representing their citizens'' interests against federal actions that could harm local services. Citizens who vote in all elections help ensure they have advocates at every level of government.',
    'Think about the different elected officials involved in this case and how they got their positions.',
    'Your vote creates a network of protection across different levels of government. When you participate in all elections, you''re building a system where someone is always looking out for your interests, whether it''s your state attorney general challenging federal overreach or your representatives controlling spending.',
    '["voting","election","federal","state"]',
    '[{"name":"Full List of States Suing Donald Trump Over Federal Funding Freeze - Newsweek","url":"https://www.newsweek.com/full-list-states-suing-donald-trump-federal-funding-freeze-2022653"},{"name":"Associated Press News","url":"https://apnews.com"}]',
    4,
    true
);

-- Question 20: short_answer (Democratic Accountability)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'federal_judge_blocks_parts_of_trump_gran_2025',
    20,
    'short_answer',
    'Democratic Accountability',
    'Analyze what this case reveals about the balance between presidential power and congressional authority, and why this balance matters for ordinary citizens.',
    NULL,
    NULL,
    NULL,
    NULL,
    'This case reveals that the Constitution creates a careful balance where Congress controls spending decisions and the president executes them, but cannot unilaterally change them. The Impoundment Control Act reinforces this balance by requiring presidential requests to Congress before withholding funds. This matters for citizens because it prevents any one person from suddenly cutting programs people depend on - from school funding to disaster relief. The judicial intervention shows how courts protect this balance, ensuring that major spending decisions go through the democratic process where citizens can influence their representatives rather than being made by executive decree.',
    'Consider why the founders separated these powers and what happens when that separation breaks down.',
    'This balance protects you from having essential services suddenly cut by presidential whim. It ensures that major changes to government programs go through a democratic process where you can influence the outcome through your representatives, rather than being decided by one person in the White House.',
    '["congress","house","president","government"]',
    '[{"name":"A second federal judge has ruled to block the Trump administration''s spending freeze - NPR (Alternative)","url":"https://npr.org"},{"name":"Trump''s effort to withhold federal funding triggers constitutional showdown - NBC News","url":"https://www.nbcnews.com/politics/white-house/trumps-effort-withhold-federal-funding-will-trigger-imminent-legal-act-rcna189583"}]',
    4,
    true
);

-- End of CivicSense quiz content