-- ============================================
-- CivicSense Enhanced Quiz Content
-- ============================================
-- Topic: January 6th Presidential Pardons and Constitutional Powers
-- Topic ID: january_6th_presidential_pardons_and_con_2025
-- Generated: 2025-06-13T00:41:55.403Z
-- Questions: 20
-- Categories: Constitutional Law, Government, Historical Precedent, Justice, Civic Participation, Electoral Systems, Public Policy, Media Literacy, Legislative Process, Policy Analysis, National Security, Civic Action
-- ============================================

-- Insert quiz topic
INSERT INTO question_topics (
    topic_id, topic_title, description, why_this_matters,
    emoji, date, day_of_week, categories, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    'January 6th Presidential Pardons and Constitutional Powers',
    'These unprecedented pardons raise fundamental questions about presidential power, accountability, and the balance between mercy and justice in American democracy. Citizens must understand how constitutional powers can be exercised and their implications for democratic institutions.',
    '<ul><li><strong>Civic Engagement:</strong> Understanding this current event helps you participate meaningfully in democratic processes and stay informed about key government decisions.</li><li><strong>Informed Citizenship:</strong> Knowledge of this issue enables better voting decisions and more effective advocacy on topics that affect your community.</li><li><strong>Constitutional Awareness:</strong> This topic connects to fundamental principles of American governance and helps you understand how our democratic system works in practice.</li><li><strong>Community Impact:</strong> These developments directly affect your daily life, from local services to federal policies that shape your economic and social environment.</li></ul>',
    '📜',
    '2025-07-05',
    'Friday',
    '["Constitutional Law","Government","Historical Precedent","Justice","Civic Participation","Electoral Systems","Public Policy","Media Literacy","Legislative Process","Policy Analysis","National Security","Civic Action"]',
    true
);

-- Insert quiz questions
-- Question 1: multiple_choice (Constitutional Law)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    1,
    'multiple_choice',
    'Constitutional Law',
    'Approximately how many January 6th defendants did President Trump pardon in January 2025?',
    '500 individuals',
    '1,000 individuals',
    '1,500 individuals',
    '2,000 individuals',
    'option_c',
    'This number represents one of the largest single-day pardon actions in U.S. history.',
    'President Trump pardoned approximately 1,500 individuals connected to January 6th cases, demonstrating the broad scope of presidential clemency power. This massive use of pardons shows how constitutional powers can dramatically affect justice outcomes and citizen trust in institutions.',
    '["constitution","president","law","citizen","presidential powers"]',
    '[{"name":"The January 6 pardons: Who has Trump ordered to be released? - Al Jazeera","url":"https://www.aljazeera.com/news/2025/1/23/the-january-6-pardons-who-has-trump-ordered-to-be-released"},{"name":"Trump issues sweeping pardons and commutations for Jan. 6 rioters - ABC News","url":"https://abcnews.go.com/Politics/trump-teases-pardoning-jan-6-rioters-day-1/story?id=117880690"}]',
    1,
    true
);

-- Question 2: multiple_choice (Government)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    2,
    'multiple_choice',
    'Government',
    'Which constitutional article grants the president the power to issue pardons?',
    'Article I, Section 8',
    'Article II, Section 2',
    'Article III, Section 1',
    'Article IV, Section 4',
    'option_b',
    'This power is found in the article that outlines executive branch responsibilities.',
    'Article II, Section 2 of the Constitution grants presidents the power to ''grant Reprieves and Pardons for Offenses against the United States.'' Understanding this constitutional foundation helps citizens evaluate when and how this power should be used responsibly.',
    '["constitution","president","state","government","citizen"]',
    '[{"name":"U.S. Constitution - Article II - Congress.gov","url":"https://constitution.congress.gov/constitution/article-2/"},{"name":"Presidential Pardons Under Article II - FindLaw","url":"https://constitution.findlaw.com/article2/presidential-pardons-under-article-ii.html"}]',
    1,
    true
);

-- Question 3: multiple_choice (Historical Precedent)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    3,
    'multiple_choice',
    'Historical Precedent',
    'What date did the January 6, 2021 Capitol attack occur?',
    'January 5, 2021',
    'January 6, 2021',
    'January 7, 2021',
    'January 8, 2021',
    'option_b',
    'This date coincided with Congress''s certification of the 2020 electoral votes.',
    'January 6, 2021 marked a critical moment when the Capitol was breached during the electoral vote certification process. Citizens must remember this date as a test of democratic resilience and the importance of peaceful transitions of power.',
    '["citizen"]',
    '[{"name":"Pardon of January 6 United States Capitol attack defendants - Wikipedia","url":"https://en.wikipedia.org/wiki/Pardon_of_January_6_United_States_Capitol_attack_defendants"},{"name":"Trump issues sweeping pardons and commutations for Jan. 6 rioters - ABC News","url":"https://abcnews.go.com/Politics/trump-teases-pardoning-jan-6-rioters-day-1/story?id=117880690"}]',
    1,
    true
);

-- Question 4: multiple_choice (Justice)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    4,
    'multiple_choice',
    'Justice',
    'Approximately how many people were charged in connection with January 6th before the pardons?',
    '500 people',
    '800 people',
    '1,000 people',
    '1,600 people',
    'option_d',
    'This represents one of the largest criminal investigations in U.S. history.',
    'Over 1,600 people faced federal charges related to January 6th, making it the largest criminal investigation in DOJ history. This scale shows how individual actions during democratic crises can have widespread legal consequences for citizens and communities.',
    '["federal","citizen"]',
    '[{"name":"Trump issues sweeping pardons and commutations for Jan. 6 rioters - ABC News","url":"https://abcnews.go.com/Politics/trump-teases-pardoning-jan-6-rioters-day-1/story?id=117880690"},{"name":"Pardon of January 6 United States Capitol attack defendants - Wikipedia","url":"https://en.wikipedia.org/wiki/Pardon_of_January_6_United_States_Capitol_attack_defendants"}]',
    1,
    true
);

-- Question 5: multiple_choice (Government)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    5,
    'multiple_choice',
    'Government',
    'What is the primary constitutional limit on presidential pardon power?',
    'Pardons must be approved by Congress',
    'Pardons only apply to federal crimes, not state crimes',
    'Pardons require Supreme Court review',
    'Pardons cannot exceed 100 people per year',
    'option_b',
    'Think about the federal system and different levels of government jurisdiction.',
    'Presidential pardons only cover federal offenses, not state crimes, reflecting our federal system where states maintain their own judicial authority. This limitation ensures that presidential power doesn''t override state sovereignty, protecting the balance that keeps democracy stable.',
    '["constitution","democracy","president","federal","state","government","judicial","primary"]',
    '[{"name":"Overview of Pardon Power - Constitution Annotated - Congress.gov","url":"https://constitution.congress.gov/browse/essay/artII-S2-C1-3-1/ALDE_00013316/"},{"name":"The presidential pardon power, explained - Protect Democracy","url":"https://protectdemocracy.org/work/the-presidential-pardon-power-explained/"}]',
    2,
    true
);

-- Question 6: multiple_choice (Civic Participation)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    6,
    'multiple_choice',
    'Civic Participation',
    'How can citizens respond when they disagree with presidential pardon decisions?',
    'File lawsuits to overturn the pardons',
    'Contact representatives and vote in future elections',
    'Petition the Supreme Court directly',
    'Organize recalls of federal officials',
    'option_b',
    'Think about the democratic tools available to citizens for expressing disagreement with government actions.',
    'While pardons cannot be legally overturned, citizens can voice concerns through representatives and use their votes to support candidates who share their values about accountability. This demonstrates how democratic participation extends beyond elections to ongoing civic engagement.',
    '["election","president","civic","citizen"]',
    '[{"name":"The History of the Pardon Power - White House Historical Association","url":"https://www.whitehousehistory.org/the-history-of-the-pardon-power"},{"name":"Overview of Pardon Power - Cornell Law School","url":"https://www.law.cornell.edu/constitution-conan/article-2/section-2/clause-1/overview-of-pardon-power"}]',
    2,
    true
);

-- Question 7: multiple_choice (Constitutional Law)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    7,
    'multiple_choice',
    'Constitutional Law',
    'What happens to a person''s criminal record after receiving a presidential pardon?',
    'The record is completely erased',
    'The conviction is forgiven but the record remains',
    'The record is sealed from public view',
    'The case is retried automatically',
    'option_b',
    'Pardons provide forgiveness, but they don''t erase history.',
    'Presidential pardons forgive the crime and restore certain rights, but don''t erase the historical record of conviction. This distinction helps citizens understand that pardons provide mercy while maintaining transparency about past actions and their consequences.',
    '["constitution","president","law","citizen","rights"]',
    '[{"name":"Federal pardons in the United States - Wikipedia","url":"https://en.wikipedia.org/wiki/Federal_pardons_in_the_United_States"},{"name":"The presidential pardon power, explained - Protect Democracy","url":"https://protectdemocracy.org/work/the-presidential-pardon-power-explained/"}]',
    2,
    true
);

-- Question 8: multiple_choice (Electoral Systems)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    8,
    'multiple_choice',
    'Electoral Systems',
    'What was Congress doing on January 6, 2021 when the Capitol was breached?',
    'Voting on the federal budget',
    'Certifying the 2020 presidential election results',
    'Debating healthcare legislation',
    'Confirming Supreme Court nominees',
    'option_b',
    'This was a constitutional process that happens every four years after presidential elections.',
    'Congress was performing its constitutional duty to count and certify electoral votes, a crucial step in peaceful power transitions. Understanding this process helps citizens appreciate how democratic institutions work and why protecting them matters for everyone''s voting rights.',
    '["constitution","voting","congress","citizen","rights","legislative process"]',
    '[{"name":"Trump issues sweeping pardons and commutations for Jan. 6 rioters - ABC News","url":"https://abcnews.go.com/Politics/trump-teases-pardoning-jan-6-rioters-day-1/story?id=117880690"},{"name":"Pardon of January 6 United States Capitol attack defendants - Wikipedia","url":"https://en.wikipedia.org/wiki/Pardon_of_January_6_United_States_Capitol_attack_defendants"}]',
    2,
    true
);

-- Question 9: multiple_choice (Public Policy)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    9,
    'multiple_choice',
    'Public Policy',
    'What argument do pardon supporters typically make about the January 6th cases?',
    'The prosecutions were politically motivated',
    'The defendants were all violent criminals',
    'The cases should have been handled by state courts',
    'The pardons were unconstitutional',
    'option_a',
    'Supporters often question whether justice was applied fairly and consistently.',
    'Pardon supporters argue that prosecutions were politically driven rather than based on equal justice principles. Understanding different perspectives on controversial issues helps citizens evaluate complex political situations and form their own informed opinions about government actions.',
    '["policy","government","citizen"]',
    '[{"name":"Granting Pardons And Commutation Of Sentences - The White House","url":"https://www.whitehouse.gov/presidential-actions/2025/01/granting-pardons-and-commutation-of-sentences-for-certain-offenses-relating-to-the-events-at-or-near-the-united-states-capitol-on-january-6-2021/"},{"name":"Pardon of January 6 United States Capitol attack defendants - Wikipedia","url":"https://en.wikipedia.org/wiki/Pardon_of_January_6_United_States_Capitol_attack_defendants"}]',
    2,
    true
);

-- Question 10: multiple_choice (Justice)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    10,
    'multiple_choice',
    'Justice',
    'What argument do pardon critics typically make about these clemency decisions?',
    'The pardons were too limited in scope',
    'The pardons undermine rule of law and accountability',
    'The pardons should have included more people',
    'The pardons were issued too late',
    'option_b',
    'Critics worry about the message sent regarding consequences for actions against democratic institutions.',
    'Critics argue that pardoning January 6th defendants sends a dangerous message that attacking democratic institutions has no consequences. This perspective emphasizes how government actions can either strengthen or weaken public trust in democratic norms and legal accountability.',
    '["government"]',
    '[{"name":"Some Jan. 6 judges refusing to extend pardons to other crimes - Washington Post","url":"https://www.washingtonpost.com/national-security/2025/05/27/jan6-pardons-judges/"},{"name":"Pardon of January 6 United States Capitol attack defendants - Wikipedia","url":"https://en.wikipedia.org/wiki/Pardon_of_January_6_United_States_Capitol_attack_defendants"}]',
    2,
    true
);

-- Question 11: multiple_choice (Media Literacy)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    11,
    'multiple_choice',
    'Media Literacy',
    'When evaluating news coverage of controversial pardons, what should citizens prioritize?',
    'Sources that confirm their existing beliefs',
    'Multiple perspectives from credible sources',
    'Social media posts from political figures',
    'Opinion columns over news reporting',
    'option_b',
    'Good civic engagement requires considering different viewpoints from reliable sources.',
    'Citizens should seek multiple credible perspectives to understand complex issues like controversial pardons. This approach helps people make informed decisions rather than relying on echo chambers, which is essential for healthy democratic participation and civic engagement.',
    '["civic","citizen"]',
    '[{"name":"The January 6 pardons: Who has Trump ordered to be released? - Al Jazeera","url":"https://www.aljazeera.com/news/2025/1/23/the-january-6-pardons-who-has-trump-ordered-to-be-released"},{"name":"Criminal records of Jan. 6 rioters pardoned by Trump - NPR","url":"https://www.npr.org/2025/01/30/nx-s1-5276336/donald-trump-jan-6-rape-assault-pardons-rioters"}]',
    2,
    true
);

-- Question 12: multiple_choice (Legislative Process)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    12,
    'multiple_choice',
    'Legislative Process',
    'What congressional action could potentially limit future presidential pardon power?',
    'Passing a simple resolution',
    'Proposing a constitutional amendment',
    'Issuing a congressional subpoena',
    'Holding oversight hearings only',
    'option_b',
    'Since pardon power is in the Constitution, changing it requires the highest level of legal action.',
    'Only a constitutional amendment could limit presidential pardon power since it''s established in the Constitution itself. This shows citizens how fundamental changes to government structure require broad consensus through the amendment process, protecting democratic stability while allowing for evolution.',
    '["constitution","congress","president","amendment","government","citizen","legislative","legislative process"]',
    '[{"name":"Overview of Pardon Power - Constitution Annotated - Congress.gov","url":"https://constitution.congress.gov/browse/essay/artII-S2-C1-3-1/ALDE_00013316/"},{"name":"The History of the Pardon Power - White House Historical Association","url":"https://www.whitehousehistory.org/the-history-of-the-pardon-power"}]',
    2,
    true
);

-- Question 13: multiple_choice (Policy Analysis)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    13,
    'multiple_choice',
    'Policy Analysis',
    'How do the January 6th pardons compare to historical uses of presidential clemency during political crises?',
    'They are completely unprecedented in American history',
    'They follow similar patterns to post-Civil War pardons',
    'They are smaller in scope than most political pardons',
    'They only affect minor, non-violent offenses',
    'option_b',
    'Consider other times when presidents used pardons to address national divisions after political conflicts.',
    'Like post-Civil War pardons for Confederates, these pardons aim to heal national divisions after political conflict, though critics argue the situations differ significantly. Understanding historical patterns helps citizens evaluate whether current actions serve legitimate purposes or set dangerous precedents.',
    '["president","policy","citizen"]',
    '[{"name":"The History of the Pardon Power - White House Historical Association","url":"https://www.whitehousehistory.org/the-history-of-the-pardon-power"},{"name":"Federal pardons in the United States - Wikipedia","url":"https://en.wikipedia.org/wiki/Federal_pardons_in_the_United_States"}]',
    3,
    true
);

-- Question 14: multiple_choice (National Security)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    14,
    'multiple_choice',
    'National Security',
    'What potential long-term impact might these pardons have on future political protests?',
    'They will definitely prevent all future political violence',
    'They might encourage similar actions by reducing perceived consequences',
    'They will have no effect on future political behavior',
    'They only affect past cases, not future actions',
    'option_b',
    'Think about how pardons might influence people''s calculations about the risks of certain actions.',
    'Some experts worry that pardoning January 6th defendants might signal that political violence has reduced consequences, potentially encouraging similar future actions. Citizens must consider how government decisions create incentives that could either strengthen or weaken democratic norms and peaceful political participation.',
    '["government","citizen"]',
    '[{"name":"Pardon of January 6 United States Capitol attack defendants - Wikipedia","url":"https://en.wikipedia.org/wiki/Pardon_of_January_6_United_States_Capitol_attack_defendants"},{"name":"Criminal records of Jan. 6 rioters pardoned by Trump - NPR","url":"https://www.npr.org/2025/01/30/nx-s1-5276336/donald-trump-jan-6-rape-assault-pardons-rioters"}]',
    3,
    true
);

-- Question 15: true_false (Constitutional Law)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    15,
    'true_false',
    'Constitutional Law',
    'Presidential pardons can be overturned by Congress or the Supreme Court if they disagree with the decision.',
    NULL,
    NULL,
    NULL,
    NULL,
    'false',
    'Consider the separation of powers and which branch has final authority over pardons.',
    'Presidential pardon power is absolute and cannot be overturned by other branches, reflecting the separation of powers principle. This unreviewable authority means citizens must carefully consider candidates'' judgment and values when voting, since pardon decisions have permanent consequences for justice and accountability.',
    '["constitution","voting","congress","president","supreme court","law","citizen","separation of powers"]',
    '[{"name":"Overview of Pardon Power - Cornell Law School","url":"https://www.law.cornell.edu/constitution-conan/article-2/section-2/clause-1/overview-of-pardon-power"},{"name":"The presidential pardon power, explained - Protect Democracy","url":"https://protectdemocracy.org/work/the-presidential-pardon-power-explained/"}]',
    3,
    true
);

-- Question 16: true_false (Civic Action)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    16,
    'true_false',
    'Civic Action',
    'Citizens have no recourse when they strongly disagree with presidential pardon decisions.',
    NULL,
    NULL,
    NULL,
    NULL,
    'false',
    'Think about the various ways citizens can express disagreement and influence future decisions in a democracy.',
    'While pardons cannot be overturned, citizens can contact representatives, vote in elections, support candidates who share their values, and engage in peaceful advocacy. These democratic tools ensure that even when specific decisions cannot be changed, citizen voices can influence future leadership and policies.',
    '["election","president","civic","citizen"]',
    '[{"name":"The History of the Pardon Power - White House Historical Association","url":"https://www.whitehousehistory.org/the-history-of-the-pardon-power"},{"name":"Overview of Pardon Power - Constitution Annotated - Congress.gov","url":"https://constitution.congress.gov/browse/essay/artII-S2-C1-3-1/ALDE_00013316/"}]',
    3,
    true
);

-- Question 17: true_false (Historical Precedent)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    17,
    'true_false',
    'Historical Precedent',
    'The January 6th pardons represent the largest single-day clemency action in modern U.S. history.',
    NULL,
    NULL,
    NULL,
    NULL,
    'true',
    'Consider the scale of approximately 1,500 pardons issued on a single day.',
    'With roughly 1,500 pardons issued in one day, this action surpasses previous large-scale clemency efforts in modern times. This unprecedented scale demonstrates how constitutional powers can be exercised in ways that dramatically impact the justice system and public trust in democratic institutions.',
    '["constitution"]',
    '[{"name":"The January 6 pardons: Who has Trump ordered to be released? - Al Jazeera","url":"https://www.aljazeera.com/news/2025/1/23/the-january-6-pardons-who-has-trump-ordered-to-be-released"},{"name":"Trump issues sweeping pardons and commutations for Jan. 6 rioters - ABC News","url":"https://abcnews.go.com/Politics/trump-teases-pardoning-jan-6-rioters-day-1/story?id=117880690"}]',
    3,
    true
);

-- Question 18: true_false (Public Policy)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    18,
    'true_false',
    'Public Policy',
    'The controversy over January 6th pardons demonstrates that some constitutional powers may need clearer limits or oversight mechanisms.',
    NULL,
    NULL,
    NULL,
    NULL,
    'true',
    'Consider whether the current system provides adequate checks on presidential clemency power.',
    'The controversy highlights ongoing debates about whether unlimited pardon power serves democracy well, with some proposing reforms like waiting periods or congressional review for mass pardons. Citizens must evaluate whether current constitutional structures adequately protect democratic values while preserving necessary executive flexibility.',
    '["constitution","democracy","congress","policy","citizen","executive","legislative process"]',
    '[{"name":"The presidential pardon power, explained - Protect Democracy","url":"https://protectdemocracy.org/work/the-presidential-pardon-power-explained/"},{"name":"Overview of Pardon Power - Constitution Annotated - Congress.gov","url":"https://constitution.congress.gov/browse/essay/artII-S2-C1-3-1/ALDE_00013316/"}]',
    4,
    true
);

-- Question 19: short_answer (Civic Participation)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    19,
    'short_answer',
    'Civic Participation',
    'Explain two specific ways citizens can constructively engage with controversial government decisions like the January 6th pardons, and why these actions matter for democracy.',
    NULL,
    NULL,
    NULL,
    NULL,
    'Citizens can: 1) Contact elected representatives to express views and advocate for policy positions, ensuring lawmakers understand constituent concerns; 2) Vote in elections for candidates whose values align with their views on accountability and justice. These actions matter because they maintain democratic accountability even when specific decisions cannot be reversed, and they help shape future leadership and policies that reflect citizen values.',
    'Think about both immediate actions (like contacting officials) and long-term democratic processes (like voting).',
    'Democratic participation extends beyond elections to include ongoing civic engagement through representative contact, advocacy, and informed voting. These actions ensure that citizen voices influence government decisions and help maintain the responsiveness that makes democracy work effectively for everyone.',
    '["democracy","voting","election","government","civic","citizen"]',
    '[{"name":"The History of the Pardon Power - White House Historical Association","url":"https://www.whitehousehistory.org/the-history-of-the-pardon-power"},{"name":"Overview of Pardon Power - Constitution Annotated - Congress.gov","url":"https://constitution.congress.gov/browse/essay/artII-S2-C1-3-1/ALDE_00013316/"}]',
    3,
    true
);

-- Question 20: short_answer (Constitutional Law)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'january_6th_presidential_pardons_and_con_2025',
    20,
    'short_answer',
    'Constitutional Law',
    'Analyze whether the current constitutional framework for presidential pardons adequately balances executive mercy with democratic accountability, considering the January 6th pardons as a case study.',
    NULL,
    NULL,
    NULL,
    NULL,
    'The current framework provides necessary executive flexibility for mercy and national healing but may lack sufficient accountability mechanisms for controversial mass pardons. The January 6th case demonstrates both the power''s potential benefits (ending divisive prosecutions) and risks (undermining rule of law). Potential reforms might include waiting periods, congressional review for mass pardons, or transparency requirements, though any changes must preserve the pardon power''s essential function while ensuring it serves democratic rather than purely political purposes.',
    'Consider both the benefits of unreviewable pardon power and the democratic concerns it raises.',
    'This analysis requires citizens to weigh competing democratic values: executive flexibility versus accountability, mercy versus justice, and healing versus consequences. Understanding these tensions helps citizens evaluate whether current institutions adequately serve democratic purposes and what reforms might strengthen both effective governance and democratic accountability.',
    '["constitution","president","law","citizen","executive"]',
    '[{"name":"The presidential pardon power, explained - Protect Democracy","url":"https://protectdemocracy.org/work/the-presidential-pardon-power-explained/"},{"name":"Overview of Pardon Power - Cornell Law School","url":"https://www.law.cornell.edu/constitution-conan/article-2/section-2/clause-1/overview-of-pardon-power"}]',
    4,
    true
);

-- End of CivicSense quiz content