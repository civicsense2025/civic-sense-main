-- ============================================
-- CivicSense Enhanced Quiz Content
-- ============================================
-- Topic: Biden Administration Supreme Court Reform Proposals
-- Topic ID: biden_administration_supreme_court_refor_2025
-- Generated: 2025-06-13T06:57:37.515Z
-- Questions: 20
-- Categories: Government, Constitutional Law, Judicial Review, Ethics, Legislative Process, Public Policy, National Security, Civic Participation, Historical Precedent, Electoral Systems, Media Literacy, Civic Action, Democratic Participation, Policy Analysis, Justice, Civic Engagement
-- ============================================

-- Insert quiz topic
INSERT INTO question_topics (
    topic_id, topic_title, description, why_this_matters,
    emoji, date, day_of_week, categories, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    'Biden Administration Supreme Court Reform Proposals',
    'These proposals respond to declining public confidence in the Supreme Court following ethics scandals and controversial decisions. Understanding these reforms helps citizens evaluate how democratic institutions can be strengthened and what role they play in holding government accountable.',
    '<ul><li><strong>Civic Engagement:</strong> Understanding this current event helps you participate meaningfully in democratic processes and stay informed about key government decisions.</li><li><strong>Informed Citizenship:</strong> Knowledge of this issue enables better voting decisions and more effective advocacy on topics that affect your community.</li><li><strong>Constitutional Awareness:</strong> This topic connects to fundamental principles of American governance and helps you understand how our democratic system works in practice.</li><li><strong>Community Impact:</strong> These developments directly affect your daily life, from local services to federal policies that shape your economic and social environment.</li></ul>',
    '🏛️',
    '2025-06-25',
    'Wednesday',
    '["Government","Constitutional Law","Judicial Review","Ethics","Legislative Process","Public Policy","National Security","Civic Participation","Historical Precedent","Electoral Systems","Media Literacy","Civic Action","Democratic Participation","Policy Analysis","Justice","Civic Engagement"]',
    true
);

-- Insert quiz questions
-- Question 1: multiple_choice (Government)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    1,
    'multiple_choice',
    'Government',
    'On what date did President Biden announce his three-part Supreme Court reform plan?',
    'June 29, 2024',
    'July 29, 2024',
    'August 15, 2024',
    'July 1, 2024',
    'option_b',
    'Think about when Biden made this announcement at an event commemorating the Civil Rights Act.',
    'This timing matters because it came right after the Supreme Court''s controversial immunity ruling. When you vote, you''re choosing leaders who will respond to judicial decisions that affect your rights and freedoms.',
    '["president","supreme court","government","rights"]',
    '[{"name":"Biden proposes Supreme Court reforms - SCOTUSblog","url":"https://www.scotusblog.com/2024/07/biden-proposes-supreme-court-reforms/"},{"name":"FACT SHEET: President Biden Announces Bold Plan to Reform the Supreme Court - White House","url":"https://bidenwhitehouse.archives.gov/briefing-room/statements-releases/2024/07/29/fact-sheet-president-biden-announces-bold-plan-to-reform-the-supreme-court-and-ensure-no-president-is-above-the-law/"}]',
    1,
    true
);

-- Question 2: multiple_choice (Constitutional Law)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    2,
    'multiple_choice',
    'Constitutional Law',
    'What would Biden''s proposed constitutional amendment be called?',
    'The Presidential Accountability Amendment',
    'The No One Is Above the Law Amendment',
    'The Executive Immunity Amendment',
    'The Democratic Justice Amendment',
    'option_b',
    'Look for the amendment name that directly challenges the idea of presidential immunity.',
    'This name reflects a core democratic principle that affects every citizen. When presidents claim immunity from prosecution, it changes the balance of power that protects your rights and freedoms from government overreach.',
    '["constitution","president","amendment","law"]',
    '[{"name":"FACT SHEET: President Biden Announces Bold Plan to Reform the Supreme Court - White House","url":"https://bidenwhitehouse.archives.gov/briefing-room/statements-releases/2024/07/29/fact-sheet-president-biden-announces-bold-plan-to-reform-the-supreme-court-and-ensure-no-president-is-above-the-law/"},{"name":"Biden is backing major Supreme Court reforms - CBS News","url":"https://www.cbsnews.com/news/biden-supreme-court-reform/"}]',
    2,
    true
);

-- Question 3: multiple_choice (Judicial Review)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    3,
    'multiple_choice',
    'Judicial Review',
    'Under Biden''s term limits proposal, how often would each president appoint a new Supreme Court justice?',
    'Every year',
    'Every two years',
    'Every four years',
    'Every six years',
    'option_b',
    'Consider how this schedule would make Court appointments more predictable and regular.',
    'This system would prevent any single president from dramatically reshaping the Court for decades. Your vote for president becomes more meaningful when you know they''ll have predictable opportunities to influence the Court that decides your constitutional rights.',
    '["constitution","president","supreme court","rights"]',
    '[{"name":"How would Biden''s proposed Supreme Court reforms work? - PBS News","url":"https://www.pbs.org/newshour/politics/how-would-bidens-proposed-supreme-court-reforms-work"},{"name":"Biden is backing major Supreme Court reforms - CBS News","url":"https://www.cbsnews.com/news/biden-supreme-court-reform/"}]',
    2,
    true
);

-- Question 4: multiple_choice (Ethics)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    4,
    'multiple_choice',
    'Ethics',
    'Which Supreme Court justices have faced the most scrutiny for ethics violations that prompted Biden''s reform proposals?',
    'John Roberts and Brett Kavanaugh',
    'Clarence Thomas and Samuel Alito',
    'Neil Gorsuch and Amy Coney Barrett',
    'Elena Kagan and Sonia Sotomayor',
    'option_b',
    'Think about which justices have been in the news for undisclosed gifts and luxury travel from wealthy donors.',
    'These ethics scandals show why citizens need enforceable rules for judges. When justices accept expensive gifts from people with business before the Court, it undermines your confidence that cases are decided fairly rather than influenced by wealthy donors.',
    '["supreme court","citizen","presidential powers","judicial review"]',
    '[{"name":"Clarence Thomas, Samuel Alito and the crisis of confidence in the Supreme Court - NPR (Alternative)","url":"https://npr.org"},{"name":"Friends of the Court — ProPublica","url":"https://www.propublica.org/series/supreme-court-scotus"}]',
    3,
    true
);

-- Question 5: multiple_choice (Legislative Process)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    5,
    'multiple_choice',
    'Legislative Process',
    'What percentage of both houses of Congress would need to approve Biden''s constitutional amendment?',
    'Simple majority (51%)',
    'Three-fifths (60%)',
    'Two-thirds (67%)',
    'Three-quarters (75%)',
    'option_c',
    'Remember that constitutional amendments require a supermajority in Congress, not just a simple majority.',
    'This high bar means constitutional changes need broad consensus, not just partisan support. Understanding these requirements helps you evaluate whether proposed reforms are realistic and why your representatives'' positions on constitutional issues matter so much.',
    '["constitution","congress","house","amendment"]',
    '[{"name":"How would Biden''s proposed Supreme Court reforms work? - PBS News","url":"https://www.pbs.org/newshour/politics/how-would-bidens-proposed-supreme-court-reforms-work"},{"name":"Biden set to announce support for major Supreme Court reforms - Washington Post (Alternative)","url":"https://washingtonpost.com"}]',
    2,
    true
);

-- Question 6: multiple_choice (Public Policy)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    6,
    'multiple_choice',
    'Public Policy',
    'According to a Marquette Law School poll mentioned in news coverage, what percentage of Americans disapproved of the Supreme Court''s job performance in May 2024?',
    '45%',
    '52%',
    '61%',
    '73%',
    'option_c',
    'Look for the poll number that shows a clear majority of Americans have lost confidence in the Court.',
    'This dramatic shift in public opinion affects how the Court functions in our democracy. When most citizens lose trust in the Supreme Court, it weakens the Court''s ability to make decisions that people will respect and follow.',
    '["democracy","supreme court","law","policy"]',
    '[{"name":"Biden calls for major Supreme Court reforms - CNN Politics (Alternative)","url":"https://cnn.com"},{"name":"Supreme Court of the United States","url":"https://www.supremecourt.gov"}]',
    3,
    true
);

-- Question 7: multiple_choice (National Security)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    7,
    'multiple_choice',
    'National Security',
    'The Supreme Court''s decision in Trump v. United States that prompted Biden''s immunity amendment dealt with which specific issue?',
    'Executive privilege over classified documents',
    'Presidential immunity from criminal prosecution for official acts',
    'Congressional subpoena power over former presidents',
    'State versus federal jurisdiction in election cases',
    'option_b',
    'Think about the Court ruling that said presidents have broad protection from criminal charges for actions taken while in office.',
    'This ruling fundamentally changed the balance of power between branches of government. It affects your ability as a citizen to hold presidents accountable through the criminal justice system when they potentially abuse their office.',
    '["president","supreme court","state","amendment"]',
    '[{"name":"Supreme Court Grants Trump Broad Immunity for Official Acts - ACLU","url":"https://www.aclu.org/press-releases/supreme-court-grants-trump-broad-immunity-for-official-acts-placing-presidents-above-the-law"},{"name":"Trump v. United States - Wikipedia","url":"https://en.wikipedia.org/wiki/Trump_v._United_States"}]',
    2,
    true
);

-- Question 8: multiple_choice (Civic Participation)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    8,
    'multiple_choice',
    'Civic Participation',
    'Which political figure quickly endorsed Biden''s Supreme Court reform proposals after they were announced?',
    'House Speaker Mike Johnson',
    'Senate Majority Leader Chuck Schumer',
    'Vice President Kamala Harris',
    'Former President Barack Obama',
    'option_c',
    'Consider which Democratic leader was running for president at the time and would benefit from supporting these reforms.',
    'Harris''s quick endorsement shows how Supreme Court reform became a campaign issue. Your vote for president includes choosing someone who will either support or oppose efforts to change how the Court operates and maintains ethical standards.',
    '["president","supreme court","civic","presidential powers"]',
    '[{"name":"Biden calls for major Supreme Court reforms - CNN Politics (Alternative)","url":"https://cnn.com"},{"name":"How would Biden''s proposed Supreme Court reforms work? - PBS News","url":"https://www.pbs.org/newshour/politics/how-would-bidens-proposed-supreme-court-reforms-work"}]',
    3,
    true
);

-- Question 9: multiple_choice (Historical Precedent)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    9,
    'multiple_choice',
    'Historical Precedent',
    'According to Biden''s proposal, the United States is the only major constitutional democracy that gives what to its high court justices?',
    'Absolute immunity from ethics rules',
    'Lifetime seats',
    'Power to overturn constitutional amendments',
    'Authority to impeach presidents',
    'option_b',
    'Think about what makes the U.S. Supreme Court different from high courts in other democratic countries.',
    'This comparison helps you understand that lifetime tenure isn''t required for judicial independence. Other democracies have term limits for their highest judges while still protecting judicial decision-making from political pressure.',
    '["constitution","democracy","state","judicial"]',
    '[{"name":"FACT SHEET: President Biden Announces Bold Plan to Reform the Supreme Court - White House","url":"https://bidenwhitehouse.archives.gov/briefing-room/statements-releases/2024/07/29/fact-sheet-president-biden-announces-bold-plan-to-reform-the-supreme-court-and-ensure-no-president-is-above-the-law/"},{"name":"Supreme Court of the United States","url":"https://www.supremecourt.gov"}]',
    1,
    true
);

-- Question 10: multiple_choice (Electoral Systems)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    10,
    'multiple_choice',
    'Electoral Systems',
    'House Speaker Mike Johnson''s response to Biden''s proposals was to call them what?',
    'A necessary reform for democracy',
    'A dangerous gambit that would be dead on arrival',
    'A bipartisan opportunity for compromise',
    'A reasonable response to ethics concerns',
    'option_b',
    'Consider how the Republican House Speaker would likely respond to Democratic proposals to change the Supreme Court.',
    'This partisan divide shows why your vote for Congress matters as much as your vote for president. The party that controls the House and Senate determines whether reform proposals even get a hearing, let alone a vote.',
    '["congress","senate","house","president"]',
    '[{"name":"How would Biden''s proposed Supreme Court reforms work? - PBS News","url":"https://www.pbs.org/newshour/politics/how-would-bidens-proposed-supreme-court-reforms-work"},{"name":"Supreme Court of the United States","url":"https://www.supremecourt.gov"}]',
    4,
    true
);

-- Question 11: true_false (Ethics)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    11,
    'true_false',
    'Ethics',
    'True or False: The Supreme Court had a formal code of ethics before the recent scandals involving Justices Thomas and Alito.',
    NULL,
    NULL,
    NULL,
    NULL,
    'false',
    'Think about when the Supreme Court first adopted its own ethics code in response to criticism.',
    'The Court only adopted its first formal ethics code in November 2023 after public pressure. This shows how citizen attention and media coverage can force government institutions to adopt better standards, even when they resist change.',
    '["supreme court","government","citizen","judicial review"]',
    '[{"name":"How would Biden''s proposed Supreme Court reforms work? - PBS News","url":"https://www.pbs.org/newshour/politics/how-would-bidens-proposed-supreme-court-reforms-work"},{"name":"Clarence Thomas, Samuel Alito Ethics Violations Found in New Senate Probe - Newsweek","url":"https://www.newsweek.com/clarence-thomas-samuel-alito-ethics-violations-found-new-senate-probe-2004585"}]',
    2,
    true
);

-- Question 12: true_false (Constitutional Law)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    12,
    'true_false',
    'Constitutional Law',
    'True or False: Biden''s term limits proposal would require a constitutional amendment to implement.',
    NULL,
    NULL,
    NULL,
    NULL,
    'true',
    'Consider whether the Constitution''s guarantee of lifetime tenure for federal judges can be changed by regular legislation.',
    'The Constitution gives federal judges lifetime tenure, so changing this requires amending the Constitution itself. This high bar for change means you need to elect representatives who strongly support reform and are willing to take on this difficult process.',
    '["constitution","federal","amendment","law"]',
    '[{"name":"How would Biden''s proposed Supreme Court reforms work? - PBS News","url":"https://www.pbs.org/newshour/politics/how-would-bidens-proposed-supreme-court-reforms-work"},{"name":"Biden''s Supreme Court plan is a ''sensible and common sense'' reform - University at Buffalo","url":"https://www.buffalo.edu/news/tipsheets/2024/biden-supreme-court-manoj-mate-expert-constitutional-law.html"}]',
    3,
    true
);

-- Question 13: true_false (Media Literacy)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    13,
    'true_false',
    'Media Literacy',
    'True or False: ProPublica''s investigative reporting on Supreme Court ethics violations helped spark calls for reform.',
    NULL,
    NULL,
    NULL,
    NULL,
    'true',
    'Think about which news organization broke the major stories about undisclosed gifts to Supreme Court justices.',
    'Investigative journalism plays a crucial role in exposing government misconduct that leads to reform. Supporting quality journalism and staying informed helps you hold public officials accountable and push for necessary changes.',
    '["supreme court","government","judicial review"]',
    '[{"name":"Friends of the Court — ProPublica","url":"https://www.propublica.org/series/supreme-court-scotus"},{"name":"ProPublica investigation unveils ethics scandals at the Supreme Court","url":"https://journalistsresource.org/media/thomas-alito-propublica-how-they-did-it/"}]',
    1,
    true
);

-- Question 14: short_answer (Civic Action)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    14,
    'short_answer',
    'Civic Action',
    'Explain why Biden''s Supreme Court reform proposals are unlikely to pass Congress in the near term, and what this tells us about the role of elections in institutional reform.',
    NULL,
    NULL,
    NULL,
    NULL,
    'The proposals face Republican opposition in the House, require supermajority votes for constitutional amendments, and need broad bipartisan support that currently doesn''t exist. This shows that major institutional reforms require sustained electoral victories to change the composition of Congress and build the necessary political coalition.',
    'Consider the current partisan makeup of Congress and the high voting thresholds required for constitutional changes.',
    'This reality check helps you understand that democratic change often takes time and multiple election cycles. Your individual vote becomes part of a larger movement that can eventually create the political conditions necessary for major reforms.',
    '["election","congress","supreme court","civic"]',
    '[{"name":"Biden set to announce support for major Supreme Court reforms - Washington Post (Alternative)","url":"https://washingtonpost.com"},{"name":"How would Biden''s proposed Supreme Court reforms work? - PBS News","url":"https://www.pbs.org/newshour/politics/how-would-bidens-proposed-supreme-court-reforms-work"}]',
    3,
    true
);

-- Question 15: short_answer (Democratic Participation)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    15,
    'short_answer',
    'Democratic Participation',
    'Analyze how declining public confidence in the Supreme Court (from 66% approval in 2020 to 61% disapproval in 2024) affects the Court''s democratic legitimacy and the broader health of American democracy.',
    NULL,
    NULL,
    NULL,
    NULL,
    'When most citizens lose trust in the Supreme Court, it undermines the Court''s ability to make decisions that people will respect and follow voluntarily. This erosion of legitimacy weakens the rule of law and can lead to increased political polarization, as people view Court decisions as partisan rather than based on legal principles. It threatens democratic stability when a co-equal branch of government loses public confidence.',
    'Think about why public trust matters for institutions that don''t face elections but still need citizen compliance with their decisions.',
    'Understanding institutional legitimacy helps you see why ethics and transparency matter beyond just preventing corruption. When you lose faith in democratic institutions, it becomes harder for the system to function effectively and maintain social cohesion.',
    '["democracy","supreme court","judicial review"]',
    '[{"name":"Biden calls for major Supreme Court reforms - CNN Politics (Alternative)","url":"https://cnn.com"},{"name":"The Supreme Court''s Presidential Immunity Ruling Undermines Democracy - Brennan Center","url":"https://www.brennancenter.org/our-work/analysis-opinion/supreme-courts-presidential-immunity-ruling-undermines-democracy"}]',
    4,
    true
);

-- Question 16: matching (Policy Analysis)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    16,
    'matching',
    'Policy Analysis',
    'Match each of Biden''s three Supreme Court reform proposals with its primary purpose:',
    NULL,
    NULL,
    NULL,
    NULL,
    'All pairs matched correctly',
    'Think about what specific problem each reform proposal is designed to solve.',
    'Each reform targets a different aspect of Supreme Court accountability. Understanding these connections helps you evaluate whether proposed solutions actually address the problems they claim to fix, which is essential for informed voting.',
    '["voting","supreme court","policy","primary"]',
    '[{"name":"FACT SHEET: President Biden Announces Bold Plan to Reform the Supreme Court - White House","url":"https://bidenwhitehouse.archives.gov/briefing-room/statements-releases/2024/07/29/fact-sheet-president-biden-announces-bold-plan-to-reform-the-supreme-court-and-ensure-no-president-is-above-the-law/"},{"name":"Biden is backing major Supreme Court reforms - CBS News","url":"https://www.cbsnews.com/news/biden-supreme-court-reform/"}]',
    2,
    true
);

-- Question 17: matching (Justice)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    17,
    'matching',
    'Justice',
    'Match each Supreme Court justice with the specific ethics controversy they faced:',
    NULL,
    NULL,
    NULL,
    NULL,
    'All pairs matched correctly',
    'Connect each person with their specific scandal that made headlines and prompted ethics concerns.',
    'These specific examples show how personal relationships and financial benefits can create conflicts of interest. Citizens need to understand these details to evaluate whether current ethics rules are sufficient or need strengthening.',
    '["supreme court","citizen","judicial review"]',
    '[{"name":"Friends of the Court — ProPublica","url":"https://www.propublica.org/series/supreme-court-scotus"},{"name":"Full List of Supreme Court Scandals - Newsweek","url":"https://www.newsweek.com/list-supreme-court-scandals-alito-flags-1904119"}]',
    3,
    true
);

-- Question 18: fill_in_blank (Government)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    18,
    'fill_in_blank',
    'Government',
    'President Biden announced his Supreme Court reform proposals at an event commemorating the [BLANK] anniversary of the [BLANK] at the [BLANK] Presidential Library in Austin, Texas.',
    NULL,
    NULL,
    NULL,
    NULL,
    '60th; Civil Rights Act; LBJ',
    'Think about the milestone anniversary of landmark civil rights legislation and which president''s library hosted the event.',
    'This symbolic location connected Supreme Court reform to the broader struggle for civil rights and equal justice. The choice of venue shows how current political leaders try to link their proposals to historic moments that expanded democratic participation.',
    '["president","supreme court","government","rights"]',
    '[{"name":"Biden Calls for Supreme Court Reforms–But Are There Better Options? - Boston University","url":"https://www.bu.edu/articles/2024/biden-calls-for-supreme-court-reforms"},{"name":"How would Biden''s proposed Supreme Court reforms work? - PBS News","url":"https://www.pbs.org/newshour/politics/how-would-bidens-proposed-supreme-court-reforms-work"}]',
    1,
    true
);

-- Question 19: fill_in_blank (Legislative Process)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    19,
    'fill_in_blank',
    'Legislative Process',
    'To ratify a constitutional amendment, [BLANK] of both houses of Congress must approve it, followed by ratification from [BLANK] of state legislatures. No new constitutional amendments have passed in more than [BLANK] years.',
    NULL,
    NULL,
    NULL,
    NULL,
    'two-thirds; three-quarters; 30',
    'Remember the supermajority requirements for constitutional changes and how long it''s been since the last successful amendment.',
    'These high barriers show why constitutional change is so difficult and rare. Understanding this process helps you appreciate why some reforms require sustained political movements across multiple election cycles to succeed.',
    '["constitution","election","congress","house"]',
    '[{"name":"How would Biden''s proposed Supreme Court reforms work? - PBS News","url":"https://www.pbs.org/newshour/politics/how-would-bidens-proposed-supreme-court-reforms-work"},{"name":"Biden''s Supreme Court plan is a ''sensible and common sense'' reform - University at Buffalo","url":"https://www.buffalo.edu/news/tipsheets/2024/biden-supreme-court-manoj-mate-expert-constitutional-law.html"}]',
    2,
    true
);

-- Question 20: ordering (Civic Engagement)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'biden_administration_supreme_court_refor_2025',
    20,
    'ordering',
    'Civic Engagement',
    'Put these events in chronological order, from earliest to most recent:',
    NULL,
    NULL,
    NULL,
    NULL,
    '1,2,3,4,5',
    'Start with the Court decision that prompted Biden''s response, then follow the sequence of reform efforts and investigations.',
    'This timeline shows how democratic accountability works through multiple channels - court decisions prompt political responses, investigative journalism exposes problems, and legislative oversight provides additional pressure. Your engagement as a citizen supports this entire accountability ecosystem.',
    '["civic","citizen","legislative"]',
    '[{"name":"Trump v. United States - Wikipedia","url":"https://en.wikipedia.org/wiki/Trump_v._United_States"},{"name":"Biden proposes Supreme Court reforms - SCOTUSblog","url":"https://www.scotusblog.com/2024/07/biden-proposes-supreme-court-reforms/"},{"name":"Clarence Thomas, Samuel Alito Ethics Violations Found in New Senate Probe - Newsweek","url":"https://www.newsweek.com/clarence-thomas-samuel-alito-ethics-violations-found-new-senate-probe-2004585"}]',
    3,
    true
);

-- End of CivicSense quiz content