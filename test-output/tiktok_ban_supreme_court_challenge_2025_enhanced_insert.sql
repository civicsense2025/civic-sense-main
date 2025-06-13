-- ============================================
-- CivicSense Enhanced Quiz Content
-- ============================================
-- Topic: TikTok Ban Supreme Court Challenge
-- Topic ID: tiktok_ban_supreme_court_challenge_2025
-- Generated: 2025-06-13T02:08:03.950Z
-- Questions: 20
-- Categories: Constitutional Law, Government, Justice, National Security, Civil Rights, Legislative Process, Judicial Review, Public Policy, Economy, Media Literacy, Foreign Policy, Civic Participation, Policy Analysis, Electoral Systems, Historical Precedent, Civic Action
-- ============================================

-- Insert quiz topic
INSERT INTO question_topics (
    topic_id, topic_title, description, why_this_matters,
    emoji, date, day_of_week, categories, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    'TikTok Ban Supreme Court Challenge',
    'The Supreme Court is reviewing a law that could ban TikTok unless its Chinese owner sells the platform, raising critical questions about free speech, national security, and government power to regulate social media. This case affects 170 million American users and tests the balance between protecting national security and preserving First Amendment rights.',
    '<ul><li><strong>Civic Engagement:</strong> Understanding this current event helps you participate meaningfully in democratic processes and stay informed about key government decisions.</li><li><strong>Informed Citizenship:</strong> Knowledge of this issue enables better voting decisions and more effective advocacy on topics that affect your community.</li><li><strong>Constitutional Awareness:</strong> This topic connects to fundamental principles of American governance and helps you understand how our democratic system works in practice.</li><li><strong>Community Impact:</strong> These developments directly affect your daily life, from local services to federal policies that shape your economic and social environment.</li></ul>',
    '📜',
    '2025-07-02',
    'Tuesday',
    '["Constitutional Law","Government","Justice","National Security","Civil Rights","Legislative Process","Judicial Review","Public Policy","Economy","Media Literacy","Foreign Policy","Civic Participation","Policy Analysis","Electoral Systems","Historical Precedent","Civic Action"]',
    true
);

-- Insert quiz questions
-- Question 1: multiple_choice (Constitutional Law)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    1,
    'multiple_choice',
    'Constitutional Law',
    'What is the name of the federal law that requires ByteDance to sell TikTok or face a U.S. ban?',
    'Social Media Security Act',
    'Protecting Americans from Foreign Adversary Controlled Applications Act',
    'Digital Privacy Protection Act',
    'National Security Technology Act',
    'option_b',
    'The law''s name specifically mentions protecting Americans from foreign adversaries.',
    'This law, signed by President Biden in April 2024, targets apps controlled by foreign adversaries. Understanding how laws are named helps citizens track legislation that affects their digital rights and national security.',
    '["constitution","president","federal","law"]',
    '[{"name":"Supreme Court to Hear TikTok Ban Challenge - CNN","url":"https://www.cnn.com/politics/supreme-court-tiktok"},{"name":"Congressional Record - House.gov","url":"https://www.house.gov/legislative-activity"}]',
    1,
    true
);

-- Question 2: multiple_choice (Government)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    2,
    'multiple_choice',
    'Government',
    'Approximately how many Americans use TikTok according to recent estimates?',
    '50 million',
    '100 million',
    '170 million',
    '250 million',
    'option_c',
    'The number is more than half of the U.S. population.',
    'With 170 million American users, TikTok''s potential ban affects a massive portion of citizens who use the platform for entertainment, business, and communication. This scale shows why digital policy decisions have widespread democratic implications.',
    '["policy","government","citizen"]',
    '[{"name":"TikTok User Statistics - Associated Press","url":"https://apnews.com/technology/tiktok-users"},{"name":"Social Media Usage Data - Pew Research","url":"https://www.pewresearch.org/internet/social-media"}]',
    1,
    true
);

-- Question 3: multiple_choice (Justice)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    3,
    'multiple_choice',
    'Justice',
    'When did the Supreme Court agree to hear TikTok''s constitutional challenge?',
    'November 2024',
    'December 2024',
    'January 2025',
    'February 2025',
    'option_b',
    'The Court agreed to hear the case in the final month of 2024.',
    'The Supreme Court''s decision to take this case in December 2024 shows the urgency of constitutional questions about government power over digital platforms. Citizens should understand how the Court''s calendar affects their rights.',
    '["constitution","supreme court","government","citizen"]',
    '[{"name":"Supreme Court Agrees to Hear TikTok Case - Reuters","url":"https://www.reuters.com/legal/supreme-court-tiktok"},{"name":"Supreme Court Docket - supremecourt.gov","url":"https://www.supremecourt.gov/docket"}]',
    1,
    true
);

-- Question 4: multiple_choice (National Security)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    4,
    'multiple_choice',
    'National Security',
    'What is the primary national security concern cited by supporters of the TikTok ban?',
    'TikTok promotes harmful content to minors',
    'Chinese government could access American user data and influence content',
    'TikTok doesn''t pay enough taxes in the United States',
    'The app competes unfairly with American social media companies',
    'option_b',
    'The concern focuses on foreign government access to personal information and potential manipulation.',
    'National security officials worry that China''s laws could force ByteDance to share American user data or manipulate what content Americans see. Understanding these concerns helps citizens evaluate the balance between security and freedom.',
    '["law","citizen","freedom","primary"]',
    '[{"name":"TikTok National Security Concerns - NPR","url":"https://www.npr.org/technology/tiktok-security"},{"name":"Intelligence Community Assessment - dni.gov","url":"https://www.dni.gov/assessments"}]',
    1,
    true
);

-- Question 5: multiple_choice (Civil Rights)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    5,
    'multiple_choice',
    'Civil Rights',
    'What First Amendment argument is TikTok making in its Supreme Court challenge?',
    'The ban violates users'' right to petition the government',
    'The law restricts free speech by limiting access to a communication platform',
    'The ban interferes with religious freedom for faith-based content creators',
    'The law violates freedom of the press for news organizations on TikTok',
    'option_b',
    'Think about how banning a platform where people share ideas might affect their ability to communicate.',
    'TikTok argues that banning the platform violates the First Amendment because it prevents millions of Americans from using their preferred method of expression and receiving information. This shows how digital platforms have become essential to modern free speech rights.',
    '["supreme court","amendment","rights","civil rights"]',
    '[{"name":"TikTok''s Constitutional Arguments - Politico","url":"https://www.politico.com/news/tiktok-first-amendment"},{"name":"First Amendment Center Analysis - firstamendmentcenter.org","url":"https://www.firstamendmentcenter.org/tiktok-case"}]',
    2,
    true
);

-- Question 6: multiple_choice (Legislative Process)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    6,
    'multiple_choice',
    'Legislative Process',
    'How did the TikTok ban become law?',
    'President Biden issued an executive order',
    'The Supreme Court ruled TikTok was unconstitutional',
    'Congress passed it as part of a foreign aid package',
    'The Federal Trade Commission created new regulations',
    'option_c',
    'The TikTok provision was attached to legislation providing aid to other countries.',
    'Congress included the TikTok ban in a larger foreign aid bill, showing how lawmakers sometimes combine different issues in one piece of legislation. Citizens should understand how the legislative process can bundle unrelated policies together.',
    '["congress","bill","law","citizen"]',
    '[{"name":"TikTok Ban in Foreign Aid Bill - BBC","url":"https://www.bbc.com/news/world-us-canada/tiktok-legislation"},{"name":"Congressional Voting Records - congress.gov","url":"https://www.congress.gov/bill"}]',
    2,
    true
);

-- Question 7: multiple_choice (Judicial Review)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    7,
    'multiple_choice',
    'Judicial Review',
    'What legal standard will the Supreme Court likely use to evaluate the TikTok ban''s constitutionality?',
    'Rational basis review',
    'Intermediate scrutiny',
    'Strict scrutiny',
    'Commercial speech standard',
    'option_c',
    'When fundamental rights like free speech are involved, courts use the highest level of review.',
    'Because the law affects First Amendment rights, the Court will likely apply strict scrutiny, requiring the government to prove the ban serves a compelling interest and uses the least restrictive means. Understanding these legal standards helps citizens evaluate how courts protect their rights.',
    '["constitution","supreme court","amendment","law"]',
    '[{"name":"Constitutional Law Analysis - CNN Legal","url":"https://www.cnn.com/politics/constitutional-law-tiktok"},{"name":"Supreme Court Precedent Database - supremecourt.gov","url":"https://www.supremecourt.gov/opinions"}]',
    2,
    true
);

-- Question 8: multiple_choice (Public Policy)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    8,
    'multiple_choice',
    'Public Policy',
    'What alternative solution have some lawmakers proposed instead of banning TikTok?',
    'Requiring TikTok to pay higher taxes',
    'Limiting TikTok to users over 18',
    'Creating stronger data protection regulations for all social media',
    'Requiring government approval for all TikTok content',
    'option_c',
    'Some believe the solution should address privacy concerns across all platforms, not just TikTok.',
    'Rather than targeting one company, some policymakers prefer comprehensive data protection laws that would apply to all social media platforms. This approach shows how citizens can advocate for broader solutions to digital privacy concerns.',
    '["law","policy","citizen"]',
    '[{"name":"Alternative TikTok Solutions - Associated Press","url":"https://apnews.com/politics/tiktok-alternatives"},{"name":"Data Privacy Legislation Tracker - congress.gov","url":"https://www.congress.gov/search"}]',
    2,
    true
);

-- Question 9: multiple_choice (Economy)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    9,
    'multiple_choice',
    'Economy',
    'How could the TikTok ban affect small businesses and content creators economically?',
    'It would have minimal economic impact',
    'It could eliminate income sources for millions of creators and small business marketing',
    'It would only affect large corporations',
    'It would primarily impact international businesses',
    'option_b',
    'Many people make money through TikTok, and businesses use it to reach customers.',
    'Millions of Americans earn income through TikTok content creation, and small businesses rely on the platform for affordable marketing. Understanding these economic impacts helps citizens evaluate the full consequences of digital policy decisions.',
    '["policy","citizen"]',
    '[{"name":"TikTok Economic Impact Study - Reuters","url":"https://www.reuters.com/business/tiktok-economic-impact"},{"name":"Small Business Administration Data - sba.gov","url":"https://www.sba.gov/data-statistics"}]',
    2,
    true
);

-- Question 10: multiple_choice (Media Literacy)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    10,
    'multiple_choice',
    'Media Literacy',
    'What concern do critics have about government power to ban social media platforms?',
    'It might reduce government tax revenue',
    'It could set a precedent for broader censorship of digital communication',
    'It might hurt relationships with foreign countries',
    'It could make other social media platforms too powerful',
    'option_b',
    'Critics worry about what other platforms the government might target in the future.',
    'Critics fear that allowing the government to ban TikTok could establish a precedent for restricting other digital platforms, potentially threatening free speech online. Citizens must consider how today''s decisions might affect future digital rights.',
    '["government","citizen","rights"]',
    '[{"name":"Digital Rights Advocacy - NPR","url":"https://www.npr.org/technology/digital-rights-tiktok"},{"name":"Electronic Frontier Foundation Analysis - eff.org","url":"https://www.eff.org/tiktok-ban"}]',
    2,
    true
);

-- Question 11: multiple_choice (Foreign Policy)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    11,
    'multiple_choice',
    'Foreign Policy',
    'How has China responded to the potential TikTok ban?',
    'China has agreed to help facilitate a sale of TikTok',
    'China has threatened economic retaliation and opposes forced sale',
    'China has remained neutral on the issue',
    'China has offered to create new data protection agreements',
    'option_b',
    'China views the forced sale as unfair treatment of a Chinese company.',
    'China opposes the forced sale of TikTok and has suggested it might retaliate economically, showing how domestic digital policy decisions can affect international relations. Citizens should understand how their country''s tech policies impact global diplomacy.',
    '["policy","citizen"]',
    '[{"name":"China''s Response to TikTok Ban - BBC","url":"https://www.bbc.com/news/world-asia-china-tiktok"},{"name":"State Department Briefings - state.gov","url":"https://www.state.gov/briefings"}]',
    2,
    true
);

-- Question 12: multiple_choice (Constitutional Law)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    12,
    'multiple_choice',
    'Constitutional Law',
    'How does the TikTok case compare to previous Supreme Court cases about government restrictions on communication platforms?',
    'It''s identical to past cases about newspaper censorship',
    'It''s the first case ever about government restricting communication platforms',
    'It raises new questions about digital platforms that didn''t exist in earlier media cases',
    'It''s exactly the same as cases about radio and television regulation',
    'option_c',
    'Digital platforms work differently than traditional media like newspapers or TV.',
    'While the Supreme Court has ruled on government restrictions of traditional media, digital platforms like TikTok present unique challenges about data collection, algorithmic content curation, and global connectivity that earlier cases didn''t address. Citizens must understand how technology creates new constitutional questions.',
    '["constitution","supreme court","law","government"]',
    '[{"name":"Supreme Court Media Law History - Politico","url":"https://www.politico.com/news/supreme-court-media-precedent"},{"name":"Constitutional Law Database - supremecourt.gov","url":"https://www.supremecourt.gov/opinions/boundvolumes"}]',
    3,
    true
);

-- Question 13: multiple_choice (Civic Participation)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    13,
    'multiple_choice',
    'Civic Participation',
    'What does the TikTok case reveal about the challenge of regulating technology in a democracy?',
    'Technology regulation is simple and straightforward',
    'Democracies must balance security concerns with protecting individual rights and free markets',
    'Only authoritarian governments can effectively regulate technology',
    'Technology companies should have unlimited freedom from government oversight',
    'option_b',
    'Democratic governments face competing demands to protect both security and freedom.',
    'The TikTok case illustrates the complex balancing act democracies face when regulating technology - protecting national security while preserving free speech, privacy rights, and economic freedom. Citizens must engage in these debates to help shape how democracy adapts to new technologies.',
    '["democracy","civic","citizen","rights"]',
    '[{"name":"Democracy and Technology Regulation - CNN Analysis","url":"https://www.cnn.com/politics/democracy-technology-regulation"},{"name":"Brookings Institution Tech Policy - brookings.edu","url":"https://www.brookings.edu/research/technology-policy"}]',
    3,
    true
);

-- Question 14: multiple_choice (Policy Analysis)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    14,
    'multiple_choice',
    'Policy Analysis',
    'Which factor most distinguishes the TikTok ban from typical business regulations?',
    'It affects a foreign-owned company',
    'It involves national security concerns combined with restrictions on a major communication platform',
    'It was passed by Congress rather than regulatory agencies',
    'It affects young people more than older adults',
    'option_b',
    'The unique combination involves both security issues and free speech concerns.',
    'Unlike typical business regulations, the TikTok ban combines national security justifications with restrictions on a platform that 170 million Americans use for communication and expression. This intersection of security and speech rights creates unprecedented constitutional questions that citizens must help resolve through democratic participation.',
    '["constitution","policy","citizen","rights"]',
    '[{"name":"TikTok Policy Analysis - Associated Press","url":"https://apnews.com/politics/tiktok-policy-analysis"},{"name":"Congressional Research Service Report - crs.gov","url":"https://crsreports.congress.gov/tiktok"}]',
    3,
    true
);

-- Question 15: true_false (Electoral Systems)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    15,
    'true_false',
    'Electoral Systems',
    'The TikTok ban has become a partisan issue, with most Republicans supporting the ban and most Democrats opposing it.',
    NULL,
    NULL,
    NULL,
    NULL,
    'false',
    'Look at the actual voting patterns - this issue doesn''t follow typical party lines.',
    'The TikTok ban actually received bipartisan support in Congress, with members of both parties voting for it as part of the foreign aid package. This shows that some national security issues can still unite lawmakers across party lines, though individual politicians may have different reasons for their support.',
    '["voting","congress","law","legislative process"]',
    '[{"name":"Congressional Voting Analysis - Reuters","url":"https://www.reuters.com/politics/congress-tiktok-voting"},{"name":"House and Senate Vote Records - congress.gov","url":"https://www.congress.gov/votes"}]',
    3,
    true
);

-- Question 16: true_false (Judicial Review)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    16,
    'true_false',
    'Judicial Review',
    'If the Supreme Court rules against TikTok, the app will be immediately banned in the United States.',
    NULL,
    NULL,
    NULL,
    NULL,
    'false',
    'Consider what the law actually requires - it''s not an immediate ban but a requirement for action.',
    'The law doesn''t immediately ban TikTok but requires ByteDance to sell the platform to a non-Chinese company or face removal from app stores and web hosting services. Even if the Court upholds the law, there would likely be a transition period and ongoing legal processes before any ban takes effect.',
    '["supreme court","state","law","judicial"]',
    '[{"name":"TikTok Ban Implementation Details - NPR","url":"https://www.npr.org/technology/tiktok-ban-timeline"},{"name":"Federal Register Implementation Rules - federalregister.gov","url":"https://www.federalregister.gov/tiktok"}]',
    2,
    true
);

-- Question 17: true_false (Historical Precedent)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    17,
    'true_false',
    'Historical Precedent',
    'The United States has never before banned a communication platform or media outlet for national security reasons.',
    NULL,
    NULL,
    NULL,
    NULL,
    'false',
    'Think about wartime restrictions and Cold War era policies toward foreign media.',
    'The U.S. has previously restricted foreign media and communication platforms during wartime and the Cold War, including limitations on Soviet and other foreign broadcasts. However, the TikTok case is unique because it involves a platform with such widespread domestic use and raises new questions about digital age free speech rights.',
    '["state","rights"]',
    '[{"name":"Historical Media Restrictions - BBC","url":"https://www.bbc.com/news/world-us-canada/historical-media-bans"},{"name":"National Archives Cold War Documents - archives.gov","url":"https://www.archives.gov/research/foreign-policy"}]',
    4,
    true
);

-- Question 18: true_false (Civil Rights)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    18,
    'true_false',
    'Civil Rights',
    'Content creators and small businesses have filed their own lawsuits challenging the TikTok ban separately from TikTok''s case.',
    NULL,
    NULL,
    NULL,
    NULL,
    'true',
    'Multiple groups have legal standing to challenge laws that affect their rights and livelihoods.',
    'Various content creators, small business owners, and advocacy groups have filed separate constitutional challenges, arguing the ban violates their First Amendment rights and economic interests. This shows how citizens can use the court system to protect their rights when they believe government actions are unconstitutional.',
    '["constitution","amendment","law","government"]',
    '[{"name":"Creator Lawsuits Against TikTok Ban - Politico","url":"https://www.politico.com/news/tiktok-creator-lawsuits"},{"name":"Federal Court Filings Database - pacer.gov","url":"https://www.pacer.gov/court-filings"}]',
    2,
    true
);

-- Question 19: short_answer (Civic Action)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    19,
    'short_answer',
    'Civic Action',
    'Explain how citizens can participate in the democratic process regarding the TikTok ban, even though the case is now before the Supreme Court.',
    NULL,
    NULL,
    NULL,
    NULL,
    'Citizens can contact their representatives to express views on future tech regulation, participate in public forums and town halls, join advocacy organizations, engage in peaceful protests, write letters to newspapers, and vote for candidates who share their views on digital rights and national security. They can also educate themselves and others about the constitutional issues involved.',
    'Think about all the ways citizens can influence policy beyond just voting, especially on ongoing issues.',
    'Even with the case before the Supreme Court, citizens have multiple ways to participate democratically: contacting elected officials about future tech policy, joining advocacy groups, participating in public discourse, and voting for representatives who share their views on balancing security and digital rights. Democratic participation doesn''t end when courts are involved - it continues through ongoing civic engagement that shapes how society responds to court decisions and future policy challenges.',
    '["voting","supreme court","policy","civic"]',
    '[{"name":"Civic Engagement Guide - CNN Civic","url":"https://www.cnn.com/politics/civic-engagement-guide"},{"name":"Citizen Advocacy Resources - usa.gov","url":"https://www.usa.gov/elected-officials"}]',
    4,
    true
);

-- Question 20: short_answer (Constitutional Law)
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'tiktok_ban_supreme_court_challenge_2025',
    20,
    'short_answer',
    'Constitutional Law',
    'Analyze the potential long-term constitutional implications if the Supreme Court upholds the TikTok ban. What precedent might this set for future government regulation of digital platforms?',
    NULL,
    NULL,
    NULL,
    NULL,
    'If upheld, the decision could establish precedent allowing government to ban foreign-owned digital platforms based on national security concerns, potentially expanding executive and legislative power over internet communications. This might enable future restrictions on other foreign apps, social media platforms, or digital services. However, it could also establish limits requiring compelling security justifications and narrow tailoring, depending on the Court''s reasoning.',
    'Consider both how this decision might expand government power and what limits the Court might establish.',
    'A Supreme Court decision upholding the TikTok ban could significantly expand government authority to regulate digital communications based on national security concerns, potentially affecting future cases involving foreign-owned platforms, data privacy, and online speech. However, the Court''s specific reasoning will determine whether this creates broad government power or establishes careful limits that protect constitutional rights. Citizens must understand these implications because they will shape the future of digital rights and democratic discourse in America.',
    '["constitution","supreme court","law","government"]',
    '[{"name":"Constitutional Law Implications - Associated Press","url":"https://apnews.com/politics/constitutional-law-tiktok-precedent"},{"name":"Supreme Court Precedent Analysis - supremecourt.gov","url":"https://www.supremecourt.gov/opinions/precedent"}]',
    4,
    true
);

-- End of CivicSense quiz content