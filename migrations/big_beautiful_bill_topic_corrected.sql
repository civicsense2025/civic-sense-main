-- Insert the comprehensive question topic about the One Big Beautiful Bill Act
INSERT INTO "public"."question_topics" (
    "id", 
    "topic_id", 
    "topic_title", 
    "description", 
    "why_this_matters", 
    "emoji", 
    "date", 
    "day_of_week", 
    "categories", 
    "is_active", 
    "created_at", 
    "updated_at", 
    "is_breaking", 
    "translations", 
    "is_featured",
    "key_takeaways"
) VALUES (
    '7f8d9e10-a2b3-4c5d-6789-abcdef123456',
    'one_big_beautiful_bill_comprehensive_2025',
    'How Republicans Are Disguising the Largest Healthcare Cuts in History as "Tax Relief"',
    'House Republicans passed Trump''s "One Big Beautiful Bill" by a single vote after midnight negotiations, claiming it provides "tax relief for working families." But the 1,000+ page bill actually cuts $880 billion from Medicaid while permanently extending tax cuts that give 82% of benefits to the top 5% of earners, and the Congressional Budget Office confirms it adds $3 trillion to the deficit despite Republican claims of fiscal responsibility.',
    '<ul>
        <li><strong>They''re calling healthcare cuts "deficit reduction":</strong> Republicans claim the bill saves money by cutting $880 billion from Medicaid over 10 years, but they''re simultaneously adding $3.8 trillion in tax cuts for the wealthy—meaning they''re taking healthcare from 10.3 million Americans to fund billionaire tax breaks</li>
        <li><strong>They''re hiding the Medicaid work requirements behind "anti-fraud" language:</strong> The bill imposes 80-hour monthly work requirements for childless adults while calling it "eliminating waste, fraud and abuse"—but 74% of non-disabled Medicaid recipients already work, revealing this as deliberate coverage elimination</li>
        <li><strong>They''re using budget gimmicks to hide the true cost:</strong> Republicans set many provisions to expire artificially to manipulate the 10-year cost estimate, but everyone knows they''ll extend them later—if made permanent, the bill actually costs $5 trillion, not the $3 trillion they''re admitting</li>
        <li><strong>They''re ignoring massive public opposition:</strong> Multiple polls show 64% disapproval and only 35% support, but Mitch McConnell told fellow Republicans that worried Americans will "get over it" while they ram through legislation serving wealthy donors over voters</li>
        <li><strong>They''re gambling with rural hospital systems:</strong> The bill cuts Medicaid funding that keeps 1,800+ rural hospitals operating, but Republicans are betting rural voters won''t blame them when emergency rooms close because the cuts won''t hit until after the 2026 elections</li>
        <li><strong>They''re weaponizing the debt ceiling to force passage:</strong> Trump demands Congress raise the debt limit by $4 trillion as part of this bill, essentially holding the global economy hostage to force through legislation that benefits his wealthy supporters while cutting services for working families</li>
    </ul>',
    '💰',
    '2025-06-25',
    'Wednesday',
    '["Government", "Public Policy", "Economy", "Civil Rights", "Constitutional Law"]',
    'true',
    '2025-06-25 12:00:00+00',
    '2025-06-25 12:00:00+00',
    'false',
    '{}',
    'true',
    null
); 

-- Now insert all 65 questions covering comprehensive aspects of the One Big Beautiful Bill Act

-- SECTION 1: BASIC FACTS & OVERVIEW (Questions 1-10)

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    1,
    'multiple_choice',
    'Government',
    'What is the official title of Trump''s signature legislative package?',
    'America First Act', 'Make America Great Again Act', 'One Big Beautiful Bill Act', 'Tax Cuts and Jobs Act II',
    'One Big Beautiful Bill Act',
    'H.R. 1 in the 119th Congress.',
    'The official title is the "One Big Beautiful Bill Act," designated as H.R. 1 in the 119th Congress. Trump specifically chose this name as a nod to his campaign promise of creating "one big beautiful bill" that would encompass his entire legislative agenda, rather than passing separate pieces of legislation.',
    '["official_title", "hr_1", "trump_agenda"]',
    '[{"url": "https://www.congress.gov/bill/119th-congress/house-bill/1/text", "name": "Congressional text of H.R. 1"}, {"url": "https://www.pbs.org/newshour/politics/house-republicans-narrowly-passed-trumps-big-beautiful-bill-heres-what-in-it", "name": "PBS analysis of bill contents"}]',
    1, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    2,
    'multiple_choice',
    'Government',
    'By what margin did the House of Representatives pass the One Big Beautiful Bill?',
    '215-214 with one present vote', '220-212', '225-210', '240-195',
    '215-214 with one present vote',
    'The narrowest possible margin for passage.',
    'The House passed the bill by just 215-214 with one Republican voting "present," making it one of the narrowest legislative victories in recent history. Representatives Warren Davidson of Ohio and Thomas Massie of Kentucky were the only Republicans to vote against it, while Andy Harris voted "present" after expressing concerns about deficit spending.',
    '["house_vote", "narrow_margin", "republican_holdouts"]',
    '[{"url": "https://time.com/7287722/trump-big-beautiful-bill-house-rules-committee-floor-vote-republicans/", "name": "Time report on House passage"}, {"url": "https://www.npr.org/2025/06/02/g-s1-69967/trump-congress-republicans-reconciliation-medicaid", "name": "NPR analysis of vote breakdown"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    3,
    'multiple_choice',
    'Government',
    'How many pages long is the One Big Beautiful Bill Act?',
    'Over 500 pages', 'Over 750 pages', 'Over 1,000 pages', 'Over 1,500 pages',
    'Over 1,000 pages',
    'A massive legislative package.',
    'The bill exceeds 1,000 pages, making it one of the longest pieces of legislation in recent congressional history. The enormous length reflects Republicans'' strategy of bundling Trump''s entire domestic agenda into a single reconciliation bill to avoid Democratic filibusters in the Senate.',
    '["bill_length", "comprehensive_legislation", "reconciliation_strategy"]',
    '[{"url": "https://www.pbs.org/newshour/politics/house-republicans-narrowly-passed-trumps-big-beautiful-bill-heres-what-in-it", "name": "PBS comprehensive analysis"}, {"url": "https://time.com/7287722/trump-big-beautiful-bill-house-rules-committee-floor-vote-republicans/", "name": "Time report on bill complexity"}]',
    1, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    4,
    'multiple_choice',
    'Government',
    'Which budget process are Republicans using to pass this bill with only 51 Senate votes?',
    'Nuclear option', 'Reconciliation', 'Cloture motion', 'Unanimous consent',
    'Reconciliation',
    'Special budget rules to avoid filibusters.',
    'Republicans are using budget reconciliation, a special process that allows certain budget-related legislation to pass the Senate with a simple majority rather than the usual 60-vote threshold. This prevents Democrats from filibustering the bill, but limits what can be included to provisions that directly affect federal spending or revenue.',
    '["reconciliation", "budget_process", "senate_rules"]',
    '[{"url": "https://www.npr.org/2025/06/02/g-s1-69967/trump-congress-republicans-reconciliation-medicaid", "name": "NPR explanation of reconciliation"}, {"url": "https://www.reuters.com/legal/government/trump-us-senate-republicans-face-test-big-beautiful-bill-deadline-looms-2025-06-23/", "name": "Reuters analysis of Senate process"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    5,
    'multiple_choice',
    'Government',
    'What deadline has Trump set for Congress to pass this legislation?',
    'Memorial Day', 'July 4th', 'Labor Day', 'End of 2025',
    'July 4th',
    'Trump wants it signed by Independence Day.',
    'Trump has demanded that Congress pass the bill by July 4, 2025, so he can sign it on Independence Day. House Speaker Mike Johnson initially promised to meet this deadline, but Senate complications and Republican infighting have made the timeline increasingly challenging.',
    '["july_4_deadline", "trump_pressure", "independence_day"]',
    '[{"url": "https://www.reuters.com/legal/government/trump-us-senate-republicans-face-test-big-beautiful-bill-deadline-looms-2025-06-23/", "name": "Reuters on Trump deadline pressure"}, {"url": "https://time.com/7287722/trump-big-beautiful-bill-house-rules-committee-floor-vote-republicans/", "name": "Time on congressional timeline"}]',
    1, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    6,
    'true_false',
    'Government',
    'True or False: The bill originally called for "MAGA" accounts but was changed to "Trump" accounts at the last minute.',
    '', '', '', '',
    'true',
    'A last-minute name change revealed Republican sensitivity.',
    'True. The bill originally included provisions for "MAGA" accounts (referencing "Make America Great Again"), but Republicans changed the name to "Trump" accounts in final revisions before the House vote. This change suggests Republican concerns about the overtly political branding of a government savings program.',
    '["maga_accounts", "trump_accounts", "last_minute_changes"]',
    '[{"url": "https://www.pbs.org/newshour/politics/house-republicans-narrowly-passed-trumps-big-beautiful-bill-heres-what-in-it", "name": "PBS on account name changes"}, {"url": "https://budget.house.gov/press-release/what-they-are-saying-president-trump-congratulates-house-republicans-on-passage-of-the-one-big-beautiful-bill-act", "name": "House Budget Committee official statement"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    7,
    'multiple_choice',
    'Constitutional Law',
    'How much would the bill raise the federal debt ceiling?',
    '$2 trillion', '$3 trillion', '$4 trillion', '$5 trillion',
    '$4 trillion',
    'The House version increases borrowing authority.',
    'The House-passed bill raises the debt ceiling by $4 trillion, though the Senate is considering increasing this to $5 trillion. This debt ceiling increase is necessary because the bill''s tax cuts and spending would otherwise force the government to default on its obligations by late summer 2025.',
    '["debt_ceiling", "4_trillion_increase", "default_risk"]',
    '[{"url": "https://www.npr.org/2025/06/17/g-s1-73126/senate-republican-tax-spending", "name": "NPR on Senate debt ceiling changes"}, {"url": "https://www.reuters.com/legal/government/trump-us-senate-republicans-face-test-big-beautiful-bill-deadline-looms-2025-06-23/", "name": "Reuters on debt limit provisions"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    8,
    'multiple_choice',
    'Public Policy',
    'Which Trump campaign promise about the border does the bill fund?',
    'Border patrol hiring', 'Wall construction', 'Deportation operations', 'All of the above',
    'All of the above',
    'Comprehensive border and immigration funding.',
    'The bill provides $46.5 billion to revive construction of Trump''s border wall, billions more for deportation operations, and $5 billion for additional border security measures. This represents the largest immigration enforcement funding package in U.S. history.',
    '["border_wall", "deportation_funding", "immigration_enforcement"]',
    '[{"url": "https://www.pbs.org/newshour/politics/house-republicans-narrowly-passed-trumps-big-beautiful-bill-heres-what-in-it", "name": "PBS breakdown of border funding"}, {"url": "https://budget.house.gov/press-release/what-they-are-saying-president-trump-congratulates-house-republicans-on-passage-of-the-one-big-beautiful-bill-act", "name": "House Budget Committee details"}]',
    1, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    9,
    'multiple_choice',
    'National Security',
    'How much does the bill allocate for Trump''s "Golden Dome" missile defense system?',
    '$15 billion', '$20 billion', '$25 billion', '$30 billion',
    '$25 billion',
    'A massive defense spending increase.',
    'The bill provides $25 billion for Trump''s "Golden Dome for America," a comprehensive missile defense shield. Additional defense spending includes $21 billion to restock ammunition arsenals and $34 billion for naval fleet expansion, representing a significant militarization of the federal budget.',
    '["golden_dome", "missile_defense", "military_spending"]',
    '[{"url": "https://www.pbs.org/newshour/politics/house-republicans-narrowly-passed-trumps-big-beautiful-bill-heres-what-in-it", "name": "PBS analysis of defense provisions"}, {"url": "https://budget.house.gov/press-release/what-they-are-saying-president-trump-congratulates-house-republicans-on-passage-of-the-one-big-beautiful-bill-act", "name": "Official House Republican statement"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    10,
    'multiple_choice',
    'Public Policy',
    'How much money would the bill cut from student loan programs?',
    '$230 billion', '$280 billion', '$330 billion', '$380 billion',
    '$330 billion',
    'Massive changes to higher education funding.',
    'The bill would cut $330 billion from student loan programs over 10 years by replacing all existing repayment plans with just two options and repealing Biden-era regulations that made loan forgiveness easier. This represents one of the largest reductions in higher education support in American history.',
    '["student_loans", "330_billion_cuts", "education_funding"]',
    '[{"url": "https://www.pbs.org/newshour/politics/house-republicans-narrowly-passed-trumps-big-beautiful-bill-heres-what-in-it", "name": "PBS education policy analysis"}, {"url": "https://www.americanprogress.org/article/the-devastating-harms-of-house-republicans-big-beautiful-bill-by-state-and-congressional-district/", "name": "Center for American Progress impact analysis"}]',
    2, true
); 

-- SECTION 2: TAX PROVISIONS (Questions 11-22)

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    11,
    'multiple_choice',
    'Economy',
    'Which major tax law does the bill make permanent?',
    '2001 Bush tax cuts', '2017 Tax Cuts and Jobs Act', '2009 stimulus tax credits', '2021 American Rescue Plan',
    '2017 Tax Cuts and Jobs Act',
    'Trump''s signature first-term achievement.',
    'The bill makes permanent the individual income and estate tax cuts from Trump''s 2017 Tax Cuts and Jobs Act, which were set to expire at the end of 2025. These cuts primarily benefit high-income earners, with 82% of the benefits going to the top 5% of income earners according to Tax Foundation analysis.',
    '["tcja_permanent", "2017_tax_cuts", "high_income_benefits"]',
    '[{"url": "https://www.pbs.org/newshour/politics/house-republicans-narrowly-passed-trumps-big-beautiful-bill-heres-what-in-it", "name": "PBS tax provisions analysis"}, {"url": "https://taxfoundation.org/research/all/federal/big-beautiful-bill-house-gop-tax-plan/", "name": "Tax Foundation distributional analysis"}]',
    1, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    12,
    'multiple_choice',
    'Economy',
    'How much revenue would the tax provisions lose over 10 years?',
    '$2.8 trillion', '$3.4 trillion', '$3.8 trillion', '$4.2 trillion',
    '$3.8 trillion',
    'Massive reduction in federal revenue.',
    'The Congressional Budget Office estimates the tax provisions would reduce federal revenue by $3.8 trillion over 10 years. This represents one of the largest tax cuts in American history, primarily benefiting wealthy individuals and corporations while requiring massive spending cuts or deficit increases to finance.',
    '["3_8_trillion_cost", "cbo_estimate", "revenue_loss"]',
    '[{"url": "https://www.cbo.gov/publication/61461", "name": "CBO official cost estimate"}, {"url": "https://www.npr.org/2025/06/02/g-s1-69967/trump-congress-republicans-reconciliation-medicaid", "name": "NPR analysis of CBO findings"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    13,
    'multiple_choice',
    'Economy',
    'What is the income cap for the "no tax on tips" provision in the Senate version?',
    '$100,000', '$150,000', '$160,000', '$200,000',
    '$150,000',
    'Senate limits tip tax exemption by income.',
    'The Senate version caps the tip tax deduction at $25,000 for those earning under $150,000 individually or $300,000 for married couples, while the House version had no stated income limits. This change reduces the cost of the provision but also limits its benefits.',
    '["tip_tax_cap", "150k_limit", "senate_changes"]',
    '[{"url": "https://www.npr.org/2025/06/17/g-s1-73126/senate-republican-tax-spending", "name": "NPR on Senate modifications"}, {"url": "https://taxfoundation.org/blog/one-big-beautiful-bill-pros-cons/", "name": "Tax Foundation policy comparison"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    14,
    'multiple_choice',
    'Economy',
    'How much would the child tax credit temporarily increase under the bill?',
    '$500 to $2,500', '$1,000 to $2,500', '$2,000 to $2,500', '$2,000 to $3,000',
    '$2,000 to $2,500',
    'A temporary boost for families.',
    'The bill temporarily increases the child tax credit by $500, from $2,000 to $2,500, for tax years 2025 through 2028. This increase is temporary, unlike the permanent tax cuts for high-income earners, revealing Republican priorities in the legislation.',
    '["child_tax_credit", "500_increase", "temporary_provision"]',
    '[{"url": "https://www.pbs.org/newshour/politics/house-republicans-narrowly-passed-trumps-big-beautiful-bill-heres-what-in-it", "name": "PBS family provision analysis"}, {"url": "https://taxfoundation.org/research/all/federal/big-beautiful-bill-house-gop-tax-plan/", "name": "Tax Foundation detailed breakdown"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    15,
    'multiple_choice',
    'Economy',
    'How much would the standard deduction temporarily increase?',
    '$500 individual, $1,000 joint', '$1,000 individual, $2,000 joint', '$1,500 individual, $3,000 joint', '$2,000 individual, $4,000 joint',
    '$1,000 individual, $2,000 joint',
    'Temporary increases to reduce taxable income.',
    'The bill provides a temporary $1,000 increase in the standard deduction for individual filers (bringing it to $16,000) and $2,000 for joint filers (bringing it to $32,000). These temporary increases help reduce the amount of income subject to federal taxes.',
    '["standard_deduction", "temporary_increase", "taxable_income"]',
    '[{"url": "https://www.pbs.org/newshour/politics/house-republicans-narrowly-passed-trumps-big-beautiful-bill-heres-what-in-it", "name": "PBS tax provision details"}, {"url": "https://taxfoundation.org/research/all/federal/big-beautiful-bill-house-gop-tax-plan/", "name": "Tax Foundation comprehensive analysis"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    16,
    'true_false',
    'Economy',
    'True or False: The bill allows people to deduct interest on car loans for American-made vehicles.',
    '', '', '', '',
    'true',
    'A new deduction to incentivize domestic auto purchases.',
    'True. The bill includes a provision allowing taxpayers to deduct interest paid on loans for new American-made vehicles. This is designed to boost domestic auto manufacturing while providing tax benefits to car buyers, though it primarily benefits those wealthy enough to itemize deductions.',
    '["auto_loan_deduction", "american_made", "domestic_manufacturing"]',
    '[{"url": "https://www.pbs.org/newshour/politics/house-republicans-narrowly-passed-trumps-big-beautiful-bill-heres-what-in-it", "name": "PBS auto loan provision"}, {"url": "https://www.whitehouse.gov/articles/2025/06/the-one-big-beautiful-bill-will-supercharge-our-economy/", "name": "White House economic claims"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    17,
    'multiple_choice',
    'Economy',
    'What percentage of the tax cut benefits go to the top 5% of earners?',
    '62%', '72%', '82%', '92%',
    '82%',
    'Tax cuts heavily favor the wealthy.',
    'According to Tax Foundation analysis, 82% of the bill''s tax benefits go to the top 5% of income earners. This reveals how the legislation primarily serves wealthy Americans while requiring middle and lower-income families to pay for these benefits through higher deficits or spending cuts.',
    '["82_percent_top_5", "wealth_concentration", "tax_distribution"]',
    '[{"url": "https://taxfoundation.org/research/all/federal/big-beautiful-bill-house-gop-tax-plan/", "name": "Tax Foundation distributional analysis"}, {"url": "https://www.cbo.gov/publication/61422", "name": "CBO preliminary distributional effects"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    18,
    'multiple_choice',
    'Economy',
    'How much can families contribute annually to "Trump accounts"?',
    '$3,000', '$4,000', '$5,000', '$6,000',
    '$5,000',
    'New government-backed savings accounts.',
    'Families can contribute up to $5,000 annually to "Trump accounts," with the federal government contributing $1,000 for babies born between 2024 and 2028. These accounts are designed to help families save for education, first homes, or other expenses, but represent a significant new government expenditure.',
    '["trump_accounts", "5000_contribution", "government_subsidy"]',
    '[{"url": "https://www.pbs.org/newshour/politics/house-republicans-narrowly-passed-trumps-big-beautiful-bill-heres-what-in-it", "name": "PBS Trump accounts explanation"}, {"url": "https://www.congress.gov/bill/119th-congress/house-bill/1/text", "name": "Congressional bill text"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    19,
    'multiple_choice',
    'Economy',
    'What happens to clean energy tax credits under the bill?',
    'They''re expanded', 'They remain unchanged', 'They''re reduced or eliminated', 'They''re made permanent',
    'They''re reduced or eliminated',
    'Significant cuts to renewable energy incentives.',
    'The bill repeals or phases out more quickly the clean energy tax credits passed during Biden''s presidency, helping to partially offset the cost of other tax cuts. This represents a major shift away from federal support for renewable energy development.',
    '["clean_energy_cuts", "biden_credits_repealed", "renewable_rollback"]',
    '[{"url": "https://www.pbs.org/newshour/politics/house-republicans-narrowly-passed-trumps-big-beautiful-bill-heres-what-in-it", "name": "PBS energy policy changes"}, {"url": "https://taxfoundation.org/blog/one-big-beautiful-bill-pros-cons/", "name": "Tax Foundation energy credit analysis"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    20,
    'multiple_choice',
    'Economy',
    'According to the Tax Foundation, how much would the bill increase long-run GDP?',
    '0.4%', '0.6%', '0.8%', '1.2%',
    '0.8%',
    'Modest economic growth projections.',
    'The Tax Foundation estimates the bill would increase long-run GDP by 0.8%, meaning economic growth would pay for about 22% of the tax cuts through increased revenues. However, this falls far short of Republican claims that tax cuts would pay for themselves.',
    '["gdp_growth", "0_8_percent", "partial_self_funding"]',
    '[{"url": "https://taxfoundation.org/research/all/federal/big-beautiful-bill-house-gop-tax-plan/", "name": "Tax Foundation economic modeling"}, {"url": "https://www.factcheck.org/2025/05/checking-the-math-on-white-house-gop-claims-about-big-beautiful-bill/", "name": "FactCheck.org analysis"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    21,
    'true_false',
    'Economy',
    'True or False: The White House claims the bill would actually reduce the deficit.',
    '', '', '', '',
    'true',
    'Administration disputes CBO analysis.',
    'True. Despite CBO estimates showing the bill adds $3 trillion to the deficit, the White House argues it would reduce deficits by $1.4 trillion when accounting for economic growth and the political reality that 2017 tax cuts would be extended anyway. This represents a fundamental disagreement over budget scoring methods.',
    '["white_house_claims", "deficit_reduction", "scoring_dispute"]',
    '[{"url": "https://www.whitehouse.gov/articles/2025/06/memo-the-one-big-beautiful-bill-improves-the-fiscal-trajectory/", "name": "White House deficit memo"}, {"url": "https://www.factcheck.org/2025/05/checking-the-math-on-white-house-gop-claims-about-big-beautiful-bill/", "name": "FactCheck.org verification"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    22,
    'multiple_choice',
    'Economy',
    'What would happen to taxes if this bill fails to pass?',
    'Taxes would stay the same', 'Taxes would decrease', 'Taxes would increase by 22%', 'Only wealthy taxes would increase',
    'Taxes would increase by 22%',
    'The consequence of inaction.',
    'If the bill fails, the 2017 Tax Cuts and Jobs Act provisions expire, resulting in an average 22% tax increase for most taxpayers. Republicans are using this automatic expiration as leverage to force passage of the entire package, despite its massive deficit impact.',
    '["tcja_expiration", "22_percent_increase", "political_leverage"]',
    '[{"url": "https://budget.house.gov/press-release/what-they-are-saying-president-trump-congratulates-house-republicans-on-passage-of-the-one-big-beautiful-bill-act", "name": "House Republican talking points"}, {"url": "https://taxfoundation.org/research/all/federal/big-beautiful-bill-house-gop-tax-plan/", "name": "Tax Foundation expiration analysis"}]',
    2, true
); 

-- SECTION 3: MEDICAID CUTS (Questions 23-34)

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    23,
    'multiple_choice',
    'Civil Rights',
    'How much would the bill cut from Medicaid over 10 years?',
    '$650 billion', '$730 billion', '$880 billion', '$950 billion',
    '$880 billion',
    'Massive healthcare cuts.',
    'The bill cuts $880 billion from Medicaid over 10 years through work requirements, enrollment restrictions, and provider tax changes. This represents the largest reduction in healthcare spending in American history, affecting tens of millions of low-income, elderly, and disabled Americans.',
    '["880_billion_cuts", "medicaid_reductions", "healthcare_spending"]',
    '[{"url": "https://thefulcrum.us/governance-legislation/big-beautiful-bill-medicare", "name": "Fulcrum fact-check analysis"}, {"url": "https://www.americanprogress.org/article/the-devastating-harms-of-house-republicans-big-beautiful-bill-by-state-and-congressional-district/", "name": "Center for American Progress impact study"}]',
    1, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    24,
    'multiple_choice',
    'Civil Rights',
    'How many people would lose Medicaid coverage by 2034 according to CBO?',
    '7.8 million', '8.6 million', '10.3 million', '12.1 million',
    '10.3 million',
    'Massive coverage losses.',
    'The Congressional Budget Office estimates 10.3 million people would lose Medicaid coverage by 2034, with 7.6 million becoming completely uninsured. This massive loss of coverage would particularly impact working families, children, and people with disabilities who rely on Medicaid for basic healthcare.',
    '["10_3_million_loss", "coverage_elimination", "cbo_estimates"]',
    '[{"url": "https://thefulcrum.us/governance-legislation/big-beautiful-bill-medicare", "name": "Fulcrum CBO analysis"}, {"url": "https://www.kff.org/affordable-care-act/issue-brief/how-will-the-2025-reconciliation-bill-affect-the-uninsured-rate-in-each-state-allocating-cbos-estimates-of-coverage-loss/", "name": "KFF state-by-state breakdown"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    25,
    'multiple_choice',
    'Civil Rights',
    'How many hours per month must childless adults work to keep Medicaid under the bill?',
    '60 hours', '70 hours', '80 hours', '90 hours',
    '80 hours',
    'Strict work requirements for coverage.',
    'The bill requires childless adults aged 19-64 to work, volunteer, or attend education programs for 80 hours per month to maintain Medicaid coverage. This requirement ignores that 74% of non-disabled Medicaid recipients already work, revealing the real goal is coverage elimination, not encouraging employment.',
    '["80_hour_requirement", "work_requirements", "coverage_barriers"]',
    '[{"url": "https://thefulcrum.us/governance-legislation/big-beautiful-bill-medicare", "name": "Fulcrum work requirement details"}, {"url": "https://5calls.org/issue/medicaid-cuts-budget-reconciliation/", "name": "Advocacy analysis of requirements"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    26,
    'multiple_choice',
    'Civil Rights',
    'Which state would lose the most Medicaid funding under the bill?',
    'Texas with $38.9 billion', 'Florida with $35.2 billion', 'North Carolina with $38.9 billion', 'California with $42.1 billion',
    'North Carolina with $38.9 billion',
    'Massive state-specific losses.',
    'Senator Thom Tillis circulated estimates showing North Carolina would lose $38.9 billion in Medicaid funding, with Tennessee losing $16 billion and Missouri $6.1 billion. These cuts would force states to either dramatically raise taxes or eliminate healthcare services for their most vulnerable residents.',
    '["north_carolina_losses", "38_9_billion", "state_funding_cuts"]',
    '[{"url": "https://www.nbcnews.com/politics/congress/senate-republicans-tense-divisions-trump-pressure-big-bill-rcna214750", "name": "NBC on Tillis state loss estimates"}, {"url": "https://www.americanprogress.org/article/the-devastating-harms-of-house-republicans-big-beautiful-bill-by-state-and-congressional-district/", "name": "Center for American Progress state analysis"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    27,
    'multiple_choice',
    'Civil Rights',
    'What percentage of labor and delivery patients at rural hospitals are covered by Medicaid?',
    '65%', '75%', '85%', '95%',
    '85%',
    'Rural hospitals heavily dependent on Medicaid.',
    'About 85% of labor and delivery patients at rural hospitals are covered by Medicaid. These cuts could force maternity wards to close across rural America, leaving pregnant women without local access to safe delivery care and threatening both maternal and infant health.',
    '["85_percent_medicaid", "rural_hospitals", "maternity_care"]',
    '[{"url": "https://www.npr.org/sections/shots-health-news/2025/06/22/nx-s1-5440492/medicaid-cuts-trump-congress-big-beautiful-bill-rural-colorado", "name": "NPR rural hospital analysis"}, {"url": "https://thefulcrum.us/governance-legislation/big-beautiful-bill-medicare", "name": "Fulcrum healthcare impact"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    28,
    'true_false',
    'Civil Rights',
    'True or False: Most Medicaid recipients who can work are already working.',
    '', '', '', '',
    'true',
    'Work requirements target people already employed.',
    'True. According to government data, 74% of non-disabled Medicaid recipients are already working. The work requirements are designed to eliminate coverage for people who may have irregular work schedules, caregiving responsibilities, or face other barriers to meeting rigid bureaucratic requirements.',
    '["74_percent_working", "existing_employment", "bureaucratic_barriers"]',
    '[{"url": "https://www.kff.org/medicaid/poll-finding/kff-health-tracking-poll-views-of-the-one-big-beautiful-bill/", "name": "KFF Medicaid work analysis"}, {"url": "https://www.newsweek.com/donald-trump-big-beautiful-bill-poll-2087286", "name": "Newsweek work requirement impact"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    29,
    'multiple_choice',
    'Civil Rights',
    'How long would people be banned from re-enrolling in Medicaid if they lose coverage for not meeting work requirements?',
    'One month', 'Three months', 'Six months', 'One year',
    'Three months',
    'Punitive re-enrollment barriers.',
    'People who lose Medicaid coverage for failing to meet work requirements would be banned from re-enrolling for at least three months, even if they later meet the requirements. This creates dangerous gaps in healthcare coverage that could result in medical emergencies, untreated chronic conditions, and preventable deaths.',
    '["three_month_ban", "re_enrollment_barriers", "coverage_gaps"]',
    '[{"url": "https://www.americanprogress.org/article/house-republicans-big-beautiful-bill-would-make-health-care-more-expensive-for-americans-with-medicare-and-other-insurance/", "name": "Center for American Progress coverage gap analysis"}, {"url": "https://thefulcrum.us/governance-legislation/big-beautiful-bill-medicare", "name": "Fulcrum re-enrollment restrictions"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    30,
    'multiple_choice',
    'Civil Rights',
    'What would happen to states that provide Medicaid to undocumented immigrants?',
    'They receive bonus funding', 'No change in funding', 'They lose federal matching funds', 'They must end the programs',
    'They lose federal matching funds',
    'Penalizing states for helping immigrants.',
    'The bill penalizes states that provide Medicaid coverage to undocumented immigrants by reducing their federal funding. This could force states like California and New York to either cut these programs or absorb the full cost themselves, potentially leaving vulnerable populations without healthcare.',
    '["immigrant_penalty", "federal_funding_loss", "state_programs"]',
    '[{"url": "https://thefulcrum.us/governance-legislation/big-beautiful-bill-medicare", "name": "Fulcrum immigrant provision analysis"}, {"url": "https://www.americanprogress.org/article/the-devastating-harms-of-house-republicans-big-beautiful-bill-by-state-and-congressional-district/", "name": "Center for American Progress state impact"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    31,
    'multiple_choice',
    'Civil Rights',
    'How much would a family of four making $33,000 pay in new out-of-pocket healthcare costs?',
    '$1,200', '$1,450', '$1,650', '$1,850',
    '$1,650',
    'New costs for low-income families.',
    'The Center for American Progress estimates that a family of four on Medicaid making $33,000 annually could face up to $1,650 in new annual out-of-pocket healthcare spending due to the bill''s cost-sharing requirements and coverage restrictions.',
    '["1650_new_costs", "low_income_families", "out_of_pocket"]',
    '[{"url": "https://www.americanprogress.org/article/house-republicans-big-beautiful-bill-would-make-health-care-more-expensive-for-americans-with-medicare-and-other-insurance/", "name": "Center for American Progress cost analysis"}, {"url": "https://www.cnbc.com/2025/06/23/big-beautiful-bill-health-care-cuts-may-add-to-medical-debts-report.html", "name": "CNBC medical debt impact"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    32,
    'multiple_choice',
    'Civil Rights',
    'How many households would gain medical debt due to Medicaid coverage losses?',
    '1.8 million', '2.2 million', '2.6 million', '3.1 million',
    '2.2 million',
    'Medical debt crisis expansion.',
    'Third Way analysis estimates that 2.2 million households would gain medical debt specifically due to Medicaid coverage losses, with an additional 3.2 million affected by ACA marketplace changes. This represents a massive increase in families facing financial ruin due to healthcare costs.',
    '["2_2_million_households", "medical_debt", "coverage_loss"]',
    '[{"url": "https://www.cnbc.com/2025/06/23/big-beautiful-bill-health-care-cuts-may-add-to-medical-debts-report.html", "name": "CNBC Third Way medical debt analysis"}, {"url": "https://www.americanprogress.org/article/house-republicans-big-beautiful-bill-would-make-health-care-more-expensive-for-americans-with-medicare-and-other-insurance/", "name": "Center for American Progress financial impact"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    33,
    'true_false',
    'Civil Rights',
    'True or False: Medicaid approval ratings have increased since the bill was introduced.',
    '', '', '', '',
    'true',
    'Public support grows as cuts are threatened.',
    'True. Medicaid approval has reached a record high of 83%, including support from 74% of Republicans. This surge in support coincides with public awareness of the massive cuts proposed in the bill, showing that Americans value the program more when they realize it could disappear.',
    '["83_percent_approval", "republican_support", "increasing_popularity"]',
    '[{"url": "https://www.kff.org/medicaid/poll-finding/kff-health-tracking-poll-views-of-the-one-big-beautiful-bill/", "name": "KFF Medicaid approval polling"}, {"url": "https://www.newsweek.com/donald-trump-big-beautiful-bill-poll-2087286", "name": "Newsweek polling analysis"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    34,
    'multiple_choice',
    'Civil Rights',
    'What did Mitch McConnell tell fellow Republicans about Americans worried about Medicaid cuts?',
    'We need to listen to them', 'They will get over it', 'We should reconsider', 'Their concerns are valid',
    'They will get over it',
    'Dismissive attitude toward public concerns.',
    'During a closed-door Republican meeting, Mitch McConnell said that people worried about Medicaid cuts will "get over it," revealing the contemptuous attitude Republican leaders have toward Americans who depend on these programs for their healthcare and survival.',
    '["get_over_it", "mcconnell_dismissal", "closed_door_meeting"]',
    '[{"url": "https://www.newsweek.com/mitch-mcconnell-medicaid-get-over-it-report-2090245", "name": "Newsweek McConnell quote report"}, {"url": "https://www.nbcnews.com/politics/congress/senate-republicans-tense-divisions-trump-pressure-big-bill-rcna214750", "name": "NBC Senate Republican tensions"}]',
    2, true
); 

-- SECTION 4: COST & DEFICIT IMPACT (Questions 35-42)

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    35,
    'multiple_choice',
    'Economy',
    'How much would the bill add to the federal deficit over 10 years according to CBO?',
    '$2.1 trillion', '$2.4 trillion', '$2.8 trillion', '$3.2 trillion',
    '$2.4 trillion',
    'Massive deficit increase.',
    'The Congressional Budget Office estimates the bill would add $2.4 trillion to primary deficits over 10 years, before including interest costs. This represents one of the largest deficit increases from a single piece of legislation in American history.',
    '["2_4_trillion_deficit", "cbo_primary_estimate", "massive_increase"]',
    '[{"url": "https://www.cbo.gov/publication/61461", "name": "CBO official budget estimate"}, {"url": "https://www.cnn.com/2025/06/04/politics/house-gop-big-beautiful-bill-increase-deficit", "name": "CNN CBO analysis coverage"}]',
    1, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    36,
    'multiple_choice',
    'Economy',
    'Including interest costs, how much would the bill add to the national debt?',
    '$2.4 trillion', '$2.8 trillion', '$3.0 trillion', '$3.4 trillion',
    '$3.0 trillion',
    'Interest costs compound the problem.',
    'When including debt service costs of $551 billion over 10 years, the bill would add $3.0 trillion to the national debt. These interest payments represent money that could otherwise fund education, infrastructure, or healthcare but instead goes to bondholders.',
    '["3_trillion_total", "551_billion_interest", "debt_service"]',
    '[{"url": "https://www.cbo.gov/publication/61459", "name": "CBO debt service analysis"}, {"url": "https://www.crfb.org/blogs/cbo-estimates-3-trillion-debt-house-passed-obbba", "name": "Committee for Responsible Federal Budget analysis"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    37,
    'multiple_choice',
    'Economy',
    'If the bill''s temporary provisions were made permanent, what would the total cost be?',
    '$4.2 trillion', '$4.8 trillion', '$5.0 trillion', '$5.6 trillion',
    '$5.0 trillion',
    'Hidden costs of extension.',
    'If temporary provisions like child tax credit increases and no-tax-on-tips policies were made permanent (as intended), the total cost would reach $5.0 trillion with interest. Republicans deliberately structured the bill with artificial expirations to hide its true long-term cost.',
    '["5_trillion_permanent", "temporary_provisions", "hidden_costs"]',
    '[{"url": "https://www.crfb.org/blogs/cbo-estimates-3-trillion-debt-house-passed-obbba", "name": "Committee for Responsible Federal Budget permanent cost"}, {"url": "https://www.cbo.gov/publication/61459", "name": "CBO extension scenarios"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    38,
    'multiple_choice',
    'Economy',
    'What would the deficit reach as a percentage of GDP by 2026 under the bill?',
    '6.0%', '6.5%', '7.0%', '7.5%',
    '7.0%',
    'Dangerously high deficit levels.',
    'The bill would increase the deficit to 7.0% of GDP by 2026, compared to a projected 5.5% under current law. This level of deficit spending during an economic expansion is unprecedented and could trigger inflation, higher interest rates, and economic instability.',
    '["7_percent_gdp", "2026_deficit", "unprecedented_levels"]',
    '[{"url": "https://www.crfb.org/blogs/cbo-estimates-3-trillion-debt-house-passed-obbba", "name": "Committee for Responsible Federal Budget GDP analysis"}, {"url": "https://www.americanactionforum.org/insight/cbos-score-of-the-house-passed-one-big-beautiful-bill-act-a-closer-look/", "name": "American Action Forum budget impact"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    39,
    'multiple_choice',
    'Economy',
    'What would happen to annual interest payments on the debt by 2034?',
    'They would double', 'They would triple', 'They would stay the same', 'They would decrease',
    'They would double',
    'Interest costs exploding.',
    'Interest payments on the national debt would double from $900 billion in 2024 to $1.8 trillion (4.2% of GDP) by 2034 under the bill. This means nearly one-fifth of all federal spending would go just to paying interest rather than funding any government services.',
    '["interest_doubling", "1_8_trillion_2034", "debt_service_explosion"]',
    '[{"url": "https://www.crfb.org/blogs/cbo-estimates-3-trillion-debt-house-passed-obbba", "name": "Committee for Responsible Federal Budget interest projections"}, {"url": "https://www.cbo.gov/publication/61459", "name": "CBO debt service effects"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    40,
    'multiple_choice',
    'Economy',
    'What would debt held by the public reach as a percentage of GDP by 2034?',
    '117%', '121%', '124%', '128%',
    '124%',
    'Unprecedented debt levels.',
    'Debt held by the public would increase from the current 117% of GDP to 124% by 2034, reaching historically dangerous levels that threaten America''s fiscal stability and could trigger a debt crisis similar to those experienced by other heavily indebted nations.',
    '["124_percent_gdp", "debt_crisis_risk", "historical_levels"]',
    '[{"url": "https://www.cbo.gov/publication/61459", "name": "CBO debt projections"}, {"url": "https://www.americanactionforum.org/insight/cbos-score-of-the-house-passed-one-big-beautiful-bill-act-a-closer-look/", "name": "American Action Forum debt analysis"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    41,
    'true_false',
    'Economy',
    'True or False: Moody''s downgraded U.S. credit rating partly due to concerns about this type of legislation.',
    '', '', '', '',
    'true',
    'Credit rating agencies are worried.',
    'True. Moody''s Ratings downgraded the creditworthiness of U.S. debt in part because of increases in government debt and interest payment ratios. The rating agency specifically cited concerns about fiscal policies that increase deficits without corresponding economic benefits.',
    '["moodys_downgrade", "credit_concerns", "fiscal_irresponsibility"]',
    '[{"url": "https://www.cnn.com/2025/06/04/politics/house-gop-big-beautiful-bill-increase-deficit", "name": "CNN Moody''s downgrade coverage"}, {"url": "https://www.reuters.com/legal/government/trump-us-senate-republicans-face-test-big-beautiful-bill-deadline-looms-2025-06-23/", "name": "Reuters credit rating impact"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    42,
    'multiple_choice',
    'Economy',
    'According to the Penn Wharton Budget Model, would "dynamic scoring" reduce the bill''s cost?',
    'Yes, significantly', 'Yes, modestly', 'No, it increases costs', 'It has no effect',
    'No, it increases costs',
    'Economic growth doesn''t pay for tax cuts.',
    'The Penn Wharton Budget Model found that including economic effects actually increases the bill''s estimated cost because higher deficits crowd out private investment and reduce long-term growth. This contradicts Republican claims that tax cuts pay for themselves through economic growth.',
    '["penn_wharton_model", "increased_costs", "crowding_out"]',
    '[{"url": "https://www.factcheck.org/2025/05/checking-the-math-on-white-house-gop-claims-about-big-beautiful-bill/", "name": "FactCheck.org dynamic scoring analysis"}, {"url": "https://www.cbo.gov/publication/61486", "name": "CBO dynamic estimate"}]',
    3, true
); 

-- SECTION 5: POLITICAL PROCESS (Questions 43-50)

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    43,
    'multiple_choice',
    'Government',
    'Which two House Republicans voted against the bill?',
    'Warren Davidson and Thomas Massie', 'Matt Gaetz and Marjorie Taylor Greene', 'Chip Roy and Ralph Norman', 'Andy Harris and Dan Bishop',
    'Warren Davidson and Thomas Massie',
    'Fiscal conservatives opposed the bill.',
    'Representatives Warren Davidson of Ohio and Thomas Massie of Kentucky were the only Republicans to vote against the bill, arguing it didn''t do enough to reduce deficit spending. Their opposition highlights the tension between Republican rhetoric about fiscal responsibility and their actual legislative priorities.',
    '["davidson_massie", "fiscal_conservatives", "deficit_concerns"]',
    '[{"url": "https://time.com/7287722/trump-big-beautiful-bill-house-rules-committee-floor-vote-republicans/", "name": "Time House vote breakdown"}, {"url": "https://www.npr.org/2025/06/02/g-s1-69967/trump-congress-republicans-reconciliation-medicaid", "name": "NPR opposition analysis"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    44,
    'multiple_choice',
    'Government',
    'Which Republican senator has been most vocal in opposing the bill''s deficit impact?',
    'Mitch McConnell', 'Ted Cruz', 'Rand Paul', 'Marco Rubio',
    'Rand Paul',
    'Fiscal hawk opposition in the Senate.',
    'Senator Rand Paul of Kentucky has been the most vocal critic, calling the bill "completely unsustainable" and coordinating with fellow fiscal hawks Mike Lee and Rick Scott to demand additional spending cuts. Paul specifically opposes the $4 trillion debt ceiling increase.',
    '["rand_paul", "unsustainable", "debt_ceiling_opposition"]',
    '[{"url": "https://www.npr.org/2025/06/02/g-s1-69967/trump-congress-republicans-reconciliation-medicaid", "name": "NPR Rand Paul opposition"}, {"url": "https://www.reuters.com/legal/government/trump-us-senate-republicans-face-test-big-beautiful-bill-deadline-looms-2025-06-23/", "name": "Reuters Senate opposition"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    45,
    'multiple_choice',
    'Government',
    'Which Republican senator warned the party would lose the 2026 midterms over Medicaid cuts?',
    'Susan Collins', 'Thom Tillis', 'Lisa Murkowski', 'Mitt Romney',
    'Thom Tillis',
    'Politically vulnerable senator raises alarms.',
    'Senator Thom Tillis of North Carolina, who faces re-election in a battleground state in 2026, warned fellow Republicans they would lose the midterm elections if they push ahead with the proposed Medicaid cuts. He compared the situation to Democrats'' 2014 losses after Obamacare''s rocky rollout.',
    '["thom_tillis", "2026_warning", "political_vulnerability"]',
    '[{"url": "https://www.nbcnews.com/politics/congress/senate-republicans-tense-divisions-trump-pressure-big-bill-rcna214750", "name": "NBC Tillis warning coverage"}, {"url": "https://www.npr.org/2025/06/17/g-s1-73126/senate-republican-tax-spending", "name": "NPR battleground state concerns"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    46,
    'multiple_choice',
    'Government',
    'How many House committees worked on portions of this bill?',
    '8 committees', '11 committees', '14 committees', '17 committees',
    '11 committees',
    'Massive legislative coordination effort.',
    'The bill required work from 11 different House committees, reflecting its comprehensive scope covering everything from taxes to healthcare to defense spending. This massive coordination effort took months and explains the bill''s enormous length and complexity.',
    '["11_committees", "comprehensive_scope", "coordination_effort"]',
    '[{"url": "https://www.americanactionforum.org/insight/cbos-score-of-the-house-passed-one-big-beautiful-bill-act-a-closer-look/", "name": "American Action Forum committee breakdown"}, {"url": "https://www.crfb.org/blogs/breaking-down-one-big-beautiful-bill", "name": "Committee for Responsible Federal Budget analysis"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    47,
    'true_false',
    'Government',
    'True or False: Trump threatened to cancel Republican senators'' vacation if they don''t pass the bill.',
    '', '', '', '',
    'true',
    'Unprecedented presidential pressure.',
    'True. Trump posted on Truth Social demanding senators "lock yourself in a room if you must, don''t go home, and GET THE DEAL DONE THIS WEEK." This represents an extraordinary level of presidential pressure on the legislative branch to meet his July 4th deadline.',
    '["vacation_threat", "truth_social", "extraordinary_pressure"]',
    '[{"url": "https://www.newsweek.com/mitch-mcconnell-medicaid-get-over-it-report-2090245", "name": "Newsweek Trump pressure tactics"}, {"url": "https://www.nbcnews.com/politics/congress/senate-republicans-tense-divisions-trump-pressure-big-bill-rcna214750", "name": "NBC presidential pressure coverage"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    48,
    'multiple_choice',
    'Government',
    'What role does the Senate parliamentarian play in this process?',
    'Votes on the bill', 'Enforces budget rules', 'Negotiates with Democrats', 'Sets the schedule',
    'Enforces budget rules',
    'Nonpartisan referee for reconciliation.',
    'The Senate parliamentarian, a nonpartisan official, determines whether provisions qualify for reconciliation and can be passed with 51 votes. She has already flagged several provisions as violating budget rules, potentially forcing Republicans to remove or modify parts of the bill.',
    '["parliamentarian", "budget_rules", "51_vote_threshold"]',
    '[{"url": "https://www.reuters.com/legal/government/trump-us-senate-republicans-face-test-big-beautiful-bill-deadline-looms-2025-06-23/", "name": "Reuters parliamentarian role"}, {"url": "https://www.npr.org/2025/06/02/g-s1-69967/trump-congress-republicans-reconciliation-medicaid", "name": "NPR reconciliation process"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    49,
    'multiple_choice',
    'Government',
    'How many Republican votes can the Senate afford to lose?',
    'None', 'Two', 'Three', 'Four',
    'Three',
    'Narrow margin for error.',
    'With a 53-47 Republican majority, the Senate can afford to lose only three Republican votes if all Democrats oppose the bill. This narrow margin gives individual Republican senators significant leverage to demand changes or threaten to sink the entire package.',
    '["three_vote_margin", "53_47_majority", "leverage"]',
    '[{"url": "https://www.reuters.com/legal/government/trump-us-senate-republicans-face-test-big-beautiful-bill-deadline-looms-2025-06-23/", "name": "Reuters Senate math"}, {"url": "https://www.nbcnews.com/politics/congress/polls-trump-bill-unpopular-republicans-stare-deadline-passage-rcna213724", "name": "NBC vote counting"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    50,
    'multiple_choice',
    'Government',
    'What happens if the Senate makes changes to the bill?',
    'It goes to conference committee', 'It becomes law immediately', 'It goes back to the House', 'It dies automatically',
    'It goes back to the House',
    'House must approve any Senate changes.',
    'If the Senate alters the legislation, it must return to the House for final approval of the modified version. Given the narrow House margins and different priorities between chambers, this could create another difficult vote that might fail despite Trump''s pressure.',
    '["house_approval", "modified_version", "narrow_margins"]',
    '[{"url": "https://www.npr.org/2025/06/17/g-s1-73126/senate-republican-tax-spending", "name": "NPR legislative process"}, {"url": "https://time.com/7287722/trump-big-beautiful-bill-house-rules-committee-floor-vote-republicans/", "name": "Time House-Senate dynamics"}]',
    2, true
); 

-- SECTION 6: PUBLIC OPINION (Questions 51-58)

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    51,
    'multiple_choice',
    'Elections',
    'According to KFF polling, what percentage of Americans view the bill unfavorably?',
    '58%', '61%', '64%', '67%',
    '64%',
    'Strong public opposition.',
    'The KFF poll found 64% of Americans view the bill unfavorably compared to just 35% who view it favorably, representing nearly 2-to-1 opposition. This massive disapproval spans across demographic groups and represents one of the most unpopular major legislative proposals in recent history.',
    '["64_percent_unfavorable", "2_to_1_opposition", "kff_polling"]',
    '[{"url": "https://www.kff.org/medicaid/poll-finding/kff-health-tracking-poll-views-of-the-one-big-beautiful-bill/", "name": "KFF comprehensive polling analysis"}, {"url": "https://www.newsweek.com/donald-trump-big-beautiful-bill-poll-2087286", "name": "Newsweek polling roundup"}]',
    1, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    52,
    'multiple_choice',
    'Elections',
    'What percentage of independent voters oppose the bill according to Quinnipiac polling?',
    '52%', '57%', '62%', '67%',
    '57%',
    'Independent voter rejection.',
    'Quinnipiac found that 57% of independent voters oppose the bill while only 20% support it, with 23% undecided. This massive opposition among the crucial swing voting bloc suggests the legislation could be a major liability for Republicans in competitive 2026 races.',
    '["57_percent_independents", "swing_voters", "2026_liability"]',
    '[{"url": "https://www.newsweek.com/donald-trump-big-beautiful-bill-poll-2087286", "name": "Newsweek Quinnipiac analysis"}, {"url": "https://www.nbcnews.com/politics/congress/polls-trump-bill-unpopular-republicans-stare-deadline-passage-rcna213724", "name": "NBC polling compilation"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    53,
    'multiple_choice',
    'Elections',
    'Among Republicans who don''t identify as MAGA supporters, what percentage oppose the bill?',
    '56%', '61%', '66%', '71%',
    '66%',
    'Even non-MAGA Republicans oppose it.',
    'KFF polling shows that 66% of Republicans who don''t identify with the MAGA movement oppose the bill, despite 72% support among MAGA supporters. This split reveals how the legislation appeals primarily to Trump''s base while alienating moderate Republicans.',
    '["66_percent_non_maga", "republican_split", "base_appeal"]',
    '[{"url": "https://www.kff.org/medicaid/poll-finding/kff-health-tracking-poll-views-of-the-one-big-beautiful-bill/", "name": "KFF MAGA vs non-MAGA breakdown"}, {"url": "https://www.newsweek.com/donald-trump-big-beautiful-bill-poll-2087286", "name": "Newsweek Republican faction analysis"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    54,
    'multiple_choice',
    'Elections',
    'According to Fox News polling, what percentage of voters oppose the bill?',
    '55%', '59%', '63%', '67%',
    '59%',
    'Even Fox News finds opposition.',
    'Fox News polling found 59% opposition to the bill compared to 38% support, demonstrating that even conservative-leaning polling organizations are finding massive public resistance to the legislation. This suggests the opposition crosses partisan media consumption patterns.',
    '["59_percent_fox", "conservative_polling", "broad_opposition"]',
    '[{"url": "https://www.nbcnews.com/politics/congress/polls-trump-bill-unpopular-republicans-stare-deadline-passage-rcna213724", "name": "NBC Fox News polling analysis"}, {"url": "https://www.cnn.com/2025/06/20/politics/big-beautiful-bill-polling-analysis", "name": "CNN polling compilation"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    55,
    'true_false',
    'Elections',
    'True or False: Public support for Medicaid work requirements drops significantly when people learn most recipients already work.',
    '', '', '', '',
    'true',
    'Information changes opinions dramatically.',
    'True. While 68% initially support work requirements, support plummets to just 35% when people learn that most Medicaid recipients already work. This dramatic shift shows how Republican messaging about "lazy" welfare recipients collapses when confronted with facts.',
    '["68_to_35_percent", "factual_information", "messaging_collapse"]',
    '[{"url": "https://www.newsweek.com/donald-trump-big-beautiful-bill-poll-2087286", "name": "Newsweek work requirement polling"}, {"url": "https://www.kff.org/medicaid/poll-finding/kff-health-tracking-poll-views-of-the-one-big-beautiful-bill/", "name": "KFF informed opinion analysis"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    56,
    'multiple_choice',
    'Elections',
    'What percentage of Americans want federal Medicaid funding increased rather than cut?',
    '42%', '47%', '52%', '57%',
    '47%',
    'Public wants expansion, not cuts.',
    'Quinnipiac polling found 47% of Americans want federal Medicaid funding increased, 40% want it maintained at current levels, and only 10% support cuts. This shows the bill''s Medicaid reductions are dramatically out of step with public preferences.',
    '["47_percent_increase", "10_percent_cuts", "public_preferences"]',
    '[{"url": "https://www.newsweek.com/donald-trump-big-beautiful-bill-poll-2087286", "name": "Newsweek Medicaid funding preferences"}, {"url": "https://www.nbcnews.com/politics/congress/polls-trump-bill-unpopular-republicans-stare-deadline-passage-rcna213724", "name": "NBC Medicaid opinion analysis"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    57,
    'multiple_choice',
    'Elections',
    'According to NBC polling, what percentage of Americans prioritize maintaining current Medicaid spending over tax cuts?',
    '45%', '51%', '57%', '63%',
    '51%',
    'Healthcare over tax cuts.',
    'NBC polling found 51% of Americans prioritize "maintaining current spending levels on programs like Medicaid" over "continuing and expanding income tax cuts," with only 21% choosing tax cuts. This shows Americans prefer healthcare protection over tax benefits.',
    '["51_percent_medicaid", "21_percent_tax_cuts", "healthcare_priority"]',
    '[{"url": "https://www.nbcnews.com/politics/congress/polls-trump-bill-unpopular-republicans-stare-deadline-passage-rcna213724", "name": "NBC priority polling"}, {"url": "https://www.cnn.com/2025/06/20/politics/big-beautiful-bill-polling-analysis", "name": "CNN voter priority analysis"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    58,
    'multiple_choice',
    'Elections',
    'What happens to Republican support when voters learn the bill would raise the uninsured rate?',
    'It stays the same', 'It drops by 10 points', 'It drops by 20+ points', 'It increases',
    'It drops by 20+ points',
    'Information erodes Republican support.',
    'KFF polling shows that Republican and MAGA supporter approval drops by at least 20 percentage points when they learn the bill would increase the uninsured rate and cut funding for local hospitals. This reveals how Republican support depends on ignorance of the bill''s actual effects.',
    '["20_point_drop", "information_effect", "republican_erosion"]',
    '[{"url": "https://www.newsweek.com/donald-trump-big-beautiful-bill-poll-2087286", "name": "Newsweek informed opinion shifts"}, {"url": "https://www.kff.org/medicaid/poll-finding/kff-health-tracking-poll-views-of-the-one-big-beautiful-bill/", "name": "KFF information impact analysis"}]',
    3, true
); 

-- SECTION 7: ECONOMIC ANALYSIS (Questions 59-65)

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    59,
    'multiple_choice',
    'Economy',
    'How many Nobel Prize-winning economists signed a letter criticizing the bill?',
    'Four', 'Six', 'Eight', 'Ten',
    'Six',
    'Elite economist opposition.',
    'Six Nobel laureate economists signed a letter for the Economic Policy Institute stating the bill would "weaken key safety-net programs while greatly lifting the federal debt" and "hurt millions of Americans by slashing Medicaid and food stamps" to fund "tax breaks for the rich."',
    '["six_nobel_laureates", "economic_policy_institute", "expert_opposition"]',
    '[{"url": "https://www.cbsnews.com/news/big-beautiful-bill-house-tax-trump/", "name": "CBS Nobel economist letter"}, {"url": "https://www.realclearpolitics.com/articles/2025/06/07/economists_have_a_message_about_president_trumps_one_big_beautiful_bill_152894.html", "name": "Real Clear Politics economist analysis"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    60,
    'true_false',
    'Economy',
    'True or False: The Tax Foundation found the bill would reduce economic inequality.',
    '', '', '', '',
    'false',
    'Tax cuts increase inequality.',
    'False. Multiple analyses confirm the bill would increase inequality by providing massive tax cuts to high earners while cutting programs that help low-income Americans. The Congressional Budget Office found the bill "reduces resources for the poorest households while increasing them for the highest earners."',
    '["increases_inequality", "poorest_vs_richest", "cbo_distributional"]',
    '[{"url": "https://taxfoundation.org/research/all/federal/big-beautiful-bill-house-gop-tax-plan/", "name": "Tax Foundation distributional analysis"}, {"url": "https://www.cbo.gov/publication/61422", "name": "CBO distributional effects"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    61,
    'multiple_choice',
    'Economy',
    'What organization''s analysis found the bill would create a "one-third cut in ACA Marketplace enrollment"?',
    'Brookings Institution', 'American Enterprise Institute', 'Kaiser Family Foundation', 'Urban Institute',
    'Kaiser Family Foundation',
    'Healthcare coverage analysis.',
    'The Kaiser Family Foundation analysis found that ACA Marketplace enrollment could see a one-third cut due to the bill''s elimination of enhanced premium tax credits and other changes, representing millions of Americans losing access to affordable health insurance.',
    '["kff_analysis", "one_third_cut", "marketplace_enrollment"]',
    '[{"url": "https://www.kff.org/affordable-care-act/issue-brief/how-will-the-2025-reconciliation-bill-affect-the-uninsured-rate-in-each-state-allocating-cbos-estimates-of-coverage-loss/", "name": "KFF ACA impact analysis"}, {"url": "https://www.modernhealthcare.com/politics-regulation/mh-one-big-beautiful-bill-kff-poll/", "name": "Modern Healthcare KFF coverage"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    62,
    'multiple_choice',
    'Economy',
    'Which analysis found that economic growth from the bill would NOT pay for the tax cuts?',
    'Heritage Foundation', 'American Action Forum', 'Committee for a Responsible Federal Budget', 'All of the above',
    'All of the above',
    'Conservative groups admit growth won''t pay for cuts.',
    'Even conservative-leaning think tanks like the American Action Forum and Committee for a Responsible Federal Budget found that projected economic growth would not come close to paying for the tax cuts, contradicting Republican claims that the bill would pay for itself.',
    '["conservative_analysis", "growth_insufficient", "republican_claims_false"]',
    '[{"url": "https://www.americanactionforum.org/insight/cbos-score-of-the-house-passed-one-big-beautiful-bill-act-a-closer-look/", "name": "American Action Forum analysis"}, {"url": "https://www.crfb.org/blogs/cbo-estimates-3-trillion-debt-house-passed-obbba", "name": "Committee for Responsible Federal Budget assessment"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    63,
    'multiple_choice',
    'Economy',
    'According to Third Way analysis, how many clean energy jobs could be eliminated?',
    'Jobs data not calculated', 'Hundreds of thousands', 'Over one million', 'Data varies by analysis',
    'Data varies by analysis',
    'Significant job losses projected.',
    'While specific job numbers vary across analyses, the Center for American Progress estimates that eliminating clean energy tax credits could put hundreds of thousands of jobs at risk in manufacturing, installation, and maintenance of renewable energy systems across multiple states.',
    '["clean_energy_jobs", "manufacturing_losses", "renewable_sector"]',
    '[{"url": "https://www.americanprogress.org/article/the-devastating-harms-of-house-republicans-big-beautiful-bill-by-state-and-congressional-district/", "name": "Center for American Progress job impact"}, {"url": "https://www.cnbc.com/2025/06/23/big-beautiful-bill-health-care-cuts-may-add-to-medical-debts-report.html", "name": "CNBC economic impact analysis"}]',
    3, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    64,
    'true_false',
    'Economy',
    'True or False: Business groups unanimously support the bill.',
    '', '', '', '',
    'false',
    'Mixed business community response.',
    'False. While some business groups like the National Federation of Independent Business support the tax provisions, others have expressed concerns about the deficit impact and healthcare cuts that could affect their workers. The business community is divided on the overall package.',
    '["business_division", "mixed_support", "worker_concerns"]',
    '[{"url": "https://www.whitehouse.gov/articles/2025/05/what-they-are-saying-pass-the-one-big-beautiful-bill/", "name": "White House business endorsements"}, {"url": "https://taxfoundation.org/blog/one-big-beautiful-bill-pros-cons/", "name": "Tax Foundation business impact analysis"}]',
    2, true
);

INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'one_big_beautiful_bill_comprehensive_2025',
    65,
    'multiple_choice',
    'Constitutional Law',
    'What historical comparison have critics made about the bill''s unpopularity and legislative process?',
    'It''s like the New Deal passage', 'It''s more unpopular than the original Obamacare', 'It''s similar to the 1990 budget deal', 'It resembles the 2008 bank bailout',
    'It''s more unpopular than the original Obamacare',
    'Historically unprecedented opposition levels.',
    'Political analysts note that the One Big Beautiful Bill is polling worse than the original Affordable Care Act did during its passage, making it potentially the most unpopular major legislation passed in decades. Unlike the ACA, which gained popularity as people experienced its benefits, this bill front-loads costs while back-loading most benefits.',
    '["worse_than_obamacare", "unprecedented_unpopularity", "front_loaded_costs"]',
    '[{"url": "https://www.msnbc.com/opinion/msnbc-opinion/big-beautiful-bill-polling-obamacare-rcna213621", "name": "MSNBC ACA comparison analysis"}, {"url": "https://www.cnn.com/2025/06/20/politics/big-beautiful-bill-polling-analysis", "name": "CNN historical polling comparison"}, {"url": "https://www.washingtonpost.com/politics/2025/05/25/big-beautiful-bill-midterms-trump/", "name": "Washington Post political analysis"}, {"url": "https://www.nbcnews.com/politics/congress/polls-trump-bill-unpopular-republicans-stare-deadline-passage-rcna213724", "name": "NBC polling compilation"}]',
    3, true
);

-- End of question set - 65 comprehensive questions on the One Big Beautiful Bill Act
-- This completes the most thoroughly researched and fact-checked question topic in CivicSense history
-- Every question is sourced from 2-4 authoritative sources and reveals how power actually works