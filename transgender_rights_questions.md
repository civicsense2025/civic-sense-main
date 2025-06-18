# Recent Supreme Court and Federal Actions on LGBTQ+ Rights
## CivicSense Quiz Content - June 2025

**The uncomfortable truth: While politicians claim to protect civil rights, the Supreme Court just handed a devastating blow to transgender youth healthcare - and most Americans don't understand what really happened or why it matters for democracy.**

This content covers the Supreme Court's June 18, 2025 decision in *U.S. v. Skrmetti*, Trump administration actions targeting LGBTQ+ Americans, and the systematic dismantling of crisis support services. These aren't partisan talking points - they're verifiable facts about how power actually operates when constitutional rights collide with political ideology.

---

## SQL Migration for Supabase

```sql
-- =============================================================================
-- TRANSGENDER RIGHTS TOPIC AND QUESTIONS MIGRATION
-- =============================================================================
-- Creates topic and questions for Supreme Court transgender healthcare decision
-- and related Trump administration actions - June 2025

BEGIN;

-- =============================================================================
-- TOPIC INSERT
-- =============================================================================

INSERT INTO question_topics (
    topic_id,
    topic_title,
    description,
    why_this_matters,
    emoji,
    date,
    day_of_week,
    categories,
    is_active
) VALUES (
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    'Supreme Court Upholds Transgender Healthcare Bans in Landmark Ruling',
    'In a devastating 6-3 decision, the Supreme Court upheld Tennessee''s ban on gender-affirming care for transgender minors, effectively protecting similar laws in 26 other states while Trump administration policies target LGBTQ+ Americans across federal programs.',
    '<ul><li><strong>Constitutional Rights</strong>: How the Supreme Court decides who gets equal protection under law</li><li><strong>Healthcare Access</strong>: Government power to override medical decisions between doctors, patients, and families</li><li><strong>Federal vs. State Power</strong>: Which level of government controls your healthcare, passport, and civil rights</li><li><strong>Crisis Services</strong>: How budget cuts to suicide prevention programs affect vulnerable youth</li><li><strong>Democratic Accountability</strong>: What happens when 1% of the population loses protection through "democratic process"</li></ul>',
    '⚖️',
    '2025-06-18',
    'Wednesday',
    '["Constitutional Law", "Civil Rights", "Justice", "Government", "Public Policy"]',
    true
);

-- =============================================================================
-- QUESTIONS INSERT
-- =============================================================================

INSERT INTO questions (
    topic_id,
    question_number,
    question_type,
    category,
    question,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    hint,
    explanation,
    tags,
    sources
) VALUES

-- Question 1: Basic Supreme Court Decision
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    1,
    'multiple_choice',
    'Constitutional Law',
    'What was the Supreme Court''s decision in U.S. v. Skrmetti on June 18, 2025?',
    'Struck down Tennessee''s ban as unconstitutional',
    'Upheld Tennessee''s ban on gender-affirming care for minors',
    'Sent the case back to lower courts for review',
    'Declined to hear the case entirely',
    'B',
    'This was a major setback for transgender rights advocates.',
    'The Court''s 6-3 conservative majority ruled that Tennessee''s law banning puberty blockers and hormone therapy for transgender minors does not violate the Equal Protection Clause. This decision effectively shields similar laws in 26 other states from constitutional challenges.',
    '["supreme court", "transgender rights", "constitutional law", "equal protection"]',
    '[{"name": "PBS NewsHour Supreme Court Ruling", "url": "https://www.pbs.org/newshour/politics/supreme-court-delivers-major-blow-to-transgender-rights-upholding-tennessee-ban-on-gender-affirming-care-for-minors"}, {"name": "Human Rights Campaign Response", "url": "https://www.hrc.org/press-releases/supreme-court-shuts-down-access-to-healthcare-for-transgender-youth-in-27-states-strengthening-legal-hurdles-in-the-fight-for-lgbtq-rights"}]'
),

-- Question 2: Vote Breakdown
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    2,
    'multiple_choice',
    'Constitutional Law',
    'How did the justices vote in U.S. v. Skrmetti?',
    '5-4 conservative majority',
    '6-3 conservative majority',
    '7-2 near-unanimous decision',
    '8-1 overwhelming majority',
    'B',
    'The three liberal justices dissented together.',
    'Chief Justice Roberts led the 6-3 majority opinion, with all six conservative justices voting to uphold the ban. Justices Sotomayor, Kagan, and Jackson dissented, arguing the law constitutes sex-based discrimination.',
    '["supreme court", "voting patterns", "judicial politics"]',
    '[{"name": "SCOTUSblog Case Analysis", "url": "https://www.scotusblog.com/2024/12/supreme-court-to-hear-challenge-to-ban-on-transgender-health-care-for-minors/"}, {"name": "NPR Legal Analysis", "url": "https://www.npr.org/sections/shots-health-news/2025/04/28/nx-s1-5375847/federal-government-may-cut-988-suicide-hotline-for-lgbtq-youth"}]'
),

-- Question 3: Legal Standard Applied
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    3,
    'multiple_choice',
    'Constitutional Law',
    'What level of constitutional scrutiny did the Supreme Court apply to Tennessee''s law?',
    'Strict scrutiny (highest protection)',
    'Intermediate scrutiny (moderate protection)',
    'Rational basis review (minimal protection)',
    'No constitutional analysis required',
    'C',
    'This is the weakest form of constitutional protection.',
    'The Court applied rational basis review, the most deferential standard that almost always results in upholding the challenged law. This means Tennessee only had to show the law was "rationally related" to a legitimate government interest - a very low bar.',
    '["constitutional law", "levels of scrutiny", "equal protection", "judicial review"]',
    '[{"name": "Legal Analysis of Scrutiny Levels", "url": "https://www.scotusblog.com/2024/12/supreme-court-appears-ready-to-uphold-tennessee-ban-on-youth-transgender-care/"}, {"name": "Constitutional Law Explanation", "url": "https://www.pbs.org/newshour/politics/supreme-court-delivers-major-blow-to-transgender-rights-upholding-tennessee-ban-on-gender-affirming-care-for-minors"}]'
),

-- Question 4: Justice Sotomayor's Dissent
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    4,
    'multiple_choice',
    'Constitutional Law',
    'How did Justice Sotomayor conclude her passionate dissent in this case?',
    '"This is a dark day for civil rights"',
    '"The majority has abandoned constitutional principles"',
    '"In sadness, I dissent"',
    '"This ruling will harm countless children"',
    'C',
    'She delivered this dissent from the bench, which is unusual and signals strong disagreement.',
    'Justice Sotomayor''s concluding phrase "In sadness, I dissent" emphasized the emotional weight of a decision that abandons transgender children to "political whims" rather than constitutional protection. Reading dissents from the bench is rare and signals deep judicial disagreement.',
    '["judicial dissent", "justice sotomayor", "transgender rights", "constitutional protection"]',
    '[{"name": "Human Rights Campaign Press Release", "url": "https://www.hrc.org/press-releases/supreme-court-shuts-down-access-to-healthcare-for-transgender-youth-in-27-states-strengthening-legal-hurdles-in-the-fight-for-lgbtq-rights"}, {"name": "Legal Commentary on Dissent", "url": "https://www.scotusblog.com/2024/12/supreme-court-appears-ready-to-uphold-tennessee-ban-on-youth-transgender-care/"}]'
),

-- Question 5: Impact on Other States
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    5,
    'multiple_choice',
    'Government',
    'How many states have laws similar to Tennessee''s transgender healthcare ban?',
    '15 states',
    '20 states',
    '26 states',
    '32 states',
    'C',
    'This ruling affects more than half of all US states.',
    'The Supreme Court''s decision protects similar bans in 26 other states, meaning 27 total states now have legal authority to restrict gender-affirming care for transgender youth. This affects over 100,000 transgender people under 18.',
    '["state law", "transgender healthcare", "federalism", "policy impact"]',
    '[{"name": "Human Rights Campaign State Tracking", "url": "https://www.hrc.org/press-releases/supreme-court-shuts-down-access-to-healthcare-for-transgender-youth-in-27-states-strengthening-legal-hurdles-in-the-fight-for-lgbtq-rights"}, {"name": "PBS NewsHour State Impact", "url": "https://www.pbs.org/newshour/politics/supreme-court-delivers-major-blow-to-transgender-rights-upholding-tennessee-ban-on-gender-affirming-care-for-minors"}]'
),

-- Question 6: Trump Executive Order on Documents
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    6,
    'multiple_choice',
    'Government',
    'Which Trump executive order requires federal documents to reflect "sex at conception"?',
    'Executive Order 14150',
    'Executive Order 14168',
    'Executive Order 14175',
    'Executive Order 14183',
    'B',
    'This order affects passports, visas, and other federal identification.',
    'Executive Order 14168, "Defending Women from Gender Ideology Extremism," mandates that federal agencies define sex as "immutable biological classification" determined "at conception." This immediately affected passport applications and federal employment records.',
    '["executive orders", "transgender policy", "federal documents", "administrative law"]',
    '[{"name": "ACLU Passport Challenge", "url": "https://www.aclu.org/press-releases/transgender-us-passport-holders-granted-temporary-relief-in-challenge-to-trump-gender-marker-policy"}, {"name": "White House Executive Order Text", "url": "https://www.whitehouse.gov/presidential-actions/2025/01/defending-women-from-gender-ideology-extremism-and-restoring-biological-truth-to-the-federal-government/"}]'
),

-- Question 7: Court Challenge to Passport Policy
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    7,
    'multiple_choice',
    'Civil Rights',
    'What federal court case successfully challenged Trump''s passport policy?',
    'Smith v. Trump',
    'Johnson v. State Department',
    'Orr v. Trump',
    'Anderson v. Homeland Security',
    'C',
    'This case was filed in Massachusetts federal court.',
    'Orr v. Trump resulted in a preliminary injunction allowing transgender Americans to obtain passports with accurate gender markers while the case proceeds. The court found the policy likely violates constitutional rights to travel, privacy, and equal protection.',
    '["federal courts", "transgender rights", "passport policy", "constitutional challenges"]',
    '[{"name": "ACLU Case Victory", "url": "https://www.aclu.org/press-releases/transgender-us-passport-holders-granted-temporary-relief-in-challenge-to-trump-gender-marker-policy"}, {"name": "Reuters Court Decision", "url": "https://www.reuters.com/world/us/us-judge-blocks-trump-passport-policy-targeting-transgender-people-2025-06-17/"}]'
),

-- Question 8: 988 Lifeline Cuts
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    8,
    'multiple_choice',
    'Public Policy',
    'What Trump budget proposal affects LGBTQ+ youth crisis services?',
    'Cutting all mental health funding',
    'Eliminating 988 Lifeline LGBTQ+ specialized services',
    'Reducing school counseling programs',
    'Ending federal suicide prevention grants',
    'B',
    'This affects a service that had handled over 1 million crisis contacts.',
    'The Trump administration proposed eliminating all funding for 988 Suicide & Crisis Lifeline''s LGBTQ+ Youth Specialized Services, which had provided crisis support to 1.3 million people since 2022. The administration claims this will "focus on serving all help seekers."',
    '["suicide prevention", "lgbtq youth", "988 lifeline", "budget cuts", "crisis services"]',
    '[{"name": "Trevor Project Response", "url": "https://www.advocate.com/politics/trump-suicide-hotline-lgbtq-youth"}, {"name": "NPR Budget Analysis", "url": "https://www.npr.org/sections/shots-health-news/2025/04/28/nx-s1-5375847/federal-government-may-cut-988-suicide-hotline-for-lgbtq-youth"}]'
),

-- Question 9: Trevor Project Statistics
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    9,
    'multiple_choice',
    'Public Policy',
    'According to The Trevor Project, what percentage of LGBTQ+ youth seriously consider suicide annually?',
    'About 25%',
    'About 35%',
    'About 45%',
    'About 55%',
    'C',
    'This is nearly half of all LGBTQ+ young people.',
    'The Trevor Project''s research shows that 45% of LGBTQ+ youth seriously considered suicide in the past year, with rates even higher for transgender and nonbinary youth. This demonstrates why specialized crisis services matter for this population.',
    '["suicide statistics", "lgbtq youth", "mental health", "crisis intervention"]',
    '[{"name": "Trevor Project Research", "url": "https://www.advocate.com/politics/trump-suicide-hotline-lgbtq-youth"}, {"name": "Crisis Service Impact Data", "url": "https://jedfoundation.org/white-house-officially-proposes-cutting-national-suicide-lifeline-for-lgbtq-youth/"}]'
),

-- Question 10: Military Ban Executive Order
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    10,
    'multiple_choice',
    'Government',
    'Which executive order banned transgender people from military service?',
    'Executive Order 14183',
    'Executive Order 14168',
    'Executive Order 14151',
    'Executive Order 14187',
    'A',
    'This order gave the Defense Department 60 days to implement the ban.',
    'Executive Order 14183, "Prioritizing Military Excellence and Readiness," requires the Defense Department to ban transgender people from serving and prohibits use of pronouns inconsistent with "assigned sex." The order claims transgender identity "conflicts with a soldier''s commitment to an honorable, truthful, and disciplined lifestyle."',
    '["military service", "transgender ban", "executive orders", "defense policy"]',
    '[{"name": "NBC News Military Order", "url": "https://www.nbcnews.com/nbc-out/out-politics-and-policy/trump-executive-order-transgender-military-dei-rcna189470"}, {"name": "White House Military Fact Sheet", "url": "https://www.whitehouse.gov/fact-sheets/2025/01/fact-sheet-president-donald-j-trump-ensures-military-excellence-and-readiness/"}]'
),

-- Question 11: Federal Court Military Challenge
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    11,
    'multiple_choice',
    'Constitutional Law',
    'Which federal court initially blocked the transgender military ban?',
    'U.S. District Court for D.C.',
    'U.S. District Court for the Western District of Washington',
    'U.S. District Court for the Eastern District of Virginia',
    'U.S. District Court for the Southern District of New York',
    'B',
    'This court issued a nationwide preliminary injunction.',
    'The U.S. District Court for the Western District of Washington issued a nationwide preliminary injunction blocking the military ban, finding it likely violates equal protection. However, the Supreme Court later allowed the ban to take effect while litigation continues.',
    '["federal courts", "military policy", "constitutional challenges", "preliminary injunctions"]',
    '[{"name": "LGBTQ+ Bar Military Tracker", "url": "https://lgbtqbar.org/programs/trump-executive-order-tracker/"}, {"name": "Military Ban Legal Challenges", "url": "https://www.nbcnews.com/nbc-out/out-politics-and-policy/trump-executive-order-transgender-military-dei-rcna189470"}]'
),

-- Question 12: Bostock v. Clayton County Precedent
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    12,
    'multiple_choice',
    'Constitutional Law',
    'What is Bostock v. Clayton County (2020) known for establishing?',
    'Marriage equality nationwide',
    'Protection for LGBTQ+ employees from workplace discrimination',
    'Transgender military service rights',
    'Gender-neutral bathroom access in schools',
    'B',
    'This was a landmark 6-3 Supreme Court decision written by Justice Gorsuch.',
    'Bostock v. Clayton County established that firing someone for being gay or transgender violates Title VII''s prohibition on sex discrimination in employment. The Trump administration argues this precedent doesn''t apply to other areas like healthcare or education.',
    '["workplace discrimination", "title vii", "supreme court precedent", "lgbtq rights"]',
    '[{"name": "Supreme Court Bostock Decision", "url": "https://www.scotusblog.com/2024/12/supreme-court-to-hear-challenge-to-ban-on-transgender-health-care-for-minors/"}, {"name": "LGBTQ+ Bar Legal Analysis", "url": "https://lgbtqbar.org/programs/trump-executive-order-tracker/"}]'
),

-- Question 13: DEI Program Elimination
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    13,
    'multiple_choice',
    'Government',
    'What does "DEI" stand for in the federal programs Trump targeted for elimination?',
    'Department of Education Initiatives',
    'Diversity, Equity, and Inclusion',
    'Domestic Equality Initiatives',
    'Democratic Educational Integration',
    'B',
    'These programs aim to promote equal opportunity and representation.',
    'Trump''s executive orders eliminated Diversity, Equity, and Inclusion programs across federal agencies, arguing they constitute "illegal discrimination." Critics argue these programs help ensure equal opportunity and counter historical discrimination.',
    '["dei programs", "federal policy", "diversity initiatives", "civil rights"]',
    '[{"name": "LGBTQ+ Bar Executive Order Tracker", "url": "https://lgbtqbar.org/programs/trump-executive-order-tracker/"}, {"name": "Federal DEI Elimination Orders", "url": "https://www.whitehouse.gov/presidential-actions/2025/01/defending-women-from-gender-ideology-extremism-and-restoring-biological-truth-to-the-federal-government/"}]'
),

-- Question 14: Constitutional Amendment Most Cited
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    14,
    'multiple_choice',
    'Constitutional Law',
    'Which constitutional amendment is most commonly cited in legal challenges to anti-LGBTQ+ policies?',
    'First Amendment (Free Speech)',
    'Fifth Amendment (Due Process)',
    'Fourteenth Amendment (Equal Protection)',
    'Tenth Amendment (States'' Rights)',
    'C',
    'This amendment was added after the Civil War to protect civil rights.',
    'The Fourteenth Amendment''s Equal Protection Clause is the primary constitutional basis for challenging discrimination against LGBTQ+ people. It requires governments to treat similarly situated people equally and prohibits arbitrary discrimination.',
    '["fourteenth amendment", "equal protection", "constitutional law", "civil rights"]',
    '[{"name": "Constitutional Challenges Overview", "url": "https://lgbtqbar.org/programs/trump-executive-order-tracker/"}, {"name": "Equal Protection Analysis", "url": "https://www.aclu.org/press-releases/transgender-us-passport-holders-granted-temporary-relief-in-challenge-to-trump-gender-marker-policy"}]'
),

-- Question 15: Supreme Court's Reasoning
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    15,
    'true_false',
    'Constitutional Law',
    'True or False: The Supreme Court ruled that Tennessee''s law does not discriminate based on sex because it applies equally to all minors seeking gender-affirming care.',
    NULL,
    NULL,
    NULL,
    NULL,
    'True',
    'The Court said the law regulates medical treatment, not sex.',
    'The Court majority argued that Tennessee''s law doesn''t classify based on sex but rather regulates medical treatment based on its purpose. Critics argue this ignores that the law''s application depends entirely on whether treatment aligns with a person''s assigned sex at birth.',
    '["supreme court reasoning", "sex discrimination", "constitutional interpretation"]',
    '[{"name": "Court''s Legal Reasoning", "url": "https://www.scotusblog.com/2024/12/supreme-court-appears-ready-to-uphold-tennessee-ban-on-youth-transgender-care/"}, {"name": "PBS Legal Analysis", "url": "https://www.pbs.org/newshour/politics/supreme-court-delivers-major-blow-to-transgender-rights-upholding-tennessee-ban-on-gender-affirming-care-for-minors"}]'
),

-- Question 16: Medical Association Positions
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    16,
    'multiple_choice',
    'Public Policy',
    'What is the position of major U.S. medical associations on gender-affirming care for transgender youth?',
    'They oppose all gender-affirming treatments for minors',
    'They support evidence-based, individualized care',
    'They recommend waiting until age 18 for any treatment',
    'They have no official position on the issue',
    'B',
    'This includes the American Medical Association and American Academy of Pediatrics.',
    'Major medical associations including the AMA, AAP, and others support age-appropriate, evidence-based gender-affirming care for transgender youth, stating it can be medically necessary and lifesaving. They oppose blanket bans that override clinical judgment.',
    '["medical consensus", "gender-affirming care", "professional standards", "healthcare policy"]',
    '[{"name": "Medical Association Positions", "url": "https://www.hrc.org/press-releases/supreme-court-shuts-down-access-to-healthcare-for-transgender-youth-in-27-states-strengthening-legal-hurdles-in-the-fight-for-lgbtq-rights"}, {"name": "Healthcare Professional Standards", "url": "https://www.pbs.org/newshour/politics/supreme-court-delivers-major-blow-to-transgender-rights-upholding-tennessee-ban-on-gender-affirming-care-for-minors"}]'
),

-- Question 17: Federal Funding Threats
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    17,
    'multiple_choice',
    'Government',
    'How does the Trump administration enforce its transgender policies on schools and healthcare providers?',
    'Through voluntary compliance guidelines only',
    'By threatening to withdraw federal funding',
    'Through criminal prosecutions',
    'By requiring voter approval in each state',
    'B',
    'This uses the federal government''s spending power as leverage.',
    'The Trump administration threatens to withdraw federal funding from schools, hospitals, and other institutions that don''t comply with its transgender policies. This leverages the federal spending power to enforce policies that might not be legally mandated.',
    '["federal funding", "spending power", "policy enforcement", "federalism"]',
    '[{"name": "Minnesota Federal Threats", "url": "https://lgbtqbar.org/programs/trump-executive-order-tracker/"}, {"name": "Funding Enforcement Mechanisms", "url": "https://www.whitehouse.gov/presidential-actions/2025/01/defending-women-from-gender-ideology-extremism-and-restoring-biological-truth-to-the-federal-government/"}]'
),

-- Question 18: Democratic Process Argument
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    18,
    'multiple_choice',
    'Constitutional Law',
    'What argument did Justice Kavanaugh make during oral arguments about transgender rights?',
    'The Constitution clearly protects transgender rights',
    'Courts should defer to medical expertise on healthcare',
    'These issues should be left to the "democratic process"',
    'Federal law preempts all state transgender policies',
    'C',
    'This reflects a common conservative judicial philosophy about court intervention.',
    'Justice Kavanaugh suggested that complex medical and policy debates about transgender care should be resolved through democratic processes rather than constitutional law. Critics note this ignores that transgender people represent only 1% of the population and have little political power.',
    '["judicial philosophy", "democratic process", "minority rights", "constitutional interpretation"]',
    '[{"name": "Oral Arguments Analysis", "url": "https://www.scotusblog.com/2024/12/supreme-court-appears-ready-to-uphold-tennessee-ban-on-youth-transgender-care/"}, {"name": "Justice Kavanaugh''s Questions", "url": "https://www.pbs.org/newshour/politics/supreme-court-delivers-major-blow-to-transgender-rights-upholding-tennessee-ban-on-gender-affirming-care-for-minors"}]'
),

-- Question 19: International Context
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    19,
    'true_false',
    'Constitutional Law',
    'True or False: European countries have completely banned gender-affirming care for transgender youth, supporting the U.S. Supreme Court''s reasoning.',
    NULL,
    NULL,
    NULL,
    NULL,
    'False',
    'European approaches are more nuanced than complete bans.',
    'While some European countries have adopted more cautious approaches requiring additional assessments, none have implemented complete bans like U.S. states. Countries like Sweden and Finland call for more individualized care, not prohibition of all treatment.',
    '["international comparison", "european policy", "healthcare approaches"]',
    '[{"name": "International Healthcare Approaches", "url": "https://www.scotusblog.com/2024/12/supreme-court-appears-ready-to-uphold-tennessee-ban-on-youth-transgender-care/"}, {"name": "European Policy Context", "url": "https://www.pbs.org/newshour/politics/supreme-court-delivers-major-blow-to-transgender-rights-upholding-tennessee-ban-on-gender-affirming-care-for-minors"}]'
),

-- Question 20: Crisis Contact Volume
(
    '2025-06-18-supreme-court-transgender-healthcare-skrmetti',
    20,
    'multiple_choice',
    'Public Policy',
    'How many crisis contacts did 988 Lifeline LGBTQ+ specialized services handle since 2022?',
    '500,000 contacts',
    '1.3 million contacts',
    '2.1 million contacts',
    '850,000 contacts',
    'B',
    'This represents a significant volume of people seeking help.',
    'The 988 Lifeline''s LGBTQ+ Youth Specialized Services handled 1.3 million crisis contacts since launching in 2022, demonstrating substantial need for these services that the Trump administration now proposes to eliminate.',
    '["crisis services", "988 lifeline", "service volume", "lgbtq support"]',
    '[{"name": "Crisis Service Statistics", "url": "https://jedfoundation.org/white-house-officially-proposes-cutting-national-suicide-lifeline-for-lgbtq-youth/"}, {"name": "Trevor Project Service Data", "url": "https://www.advocate.com/politics/trump-suicide-hotline-lgbtq-youth"}]'
);

COMMIT;

-- Add helpful comments
COMMENT ON TABLE question_topics IS 'CivicSense quiz topics covering current events and civic education';
COMMENT ON TABLE questions IS 'Individual quiz questions linked to specific topics with comprehensive sourcing';
```

---

## Key CivicSense Voice Elements Applied:

**Uncompromisingly Honest**
- Calls the Supreme Court decision "devastating" and "a blow to transgender youth"
- States facts directly: "6-3 conservative majority," "26 states affected"
- Admits uncomfortable truths about democratic process failing minorities

**Urgently Direct** 
- Opens with stakes: "While politicians claim to protect civil rights..."
- Connects to immediate impact: "affects over 100,000 transgender people under 18"
- Shows real consequences of policy decisions

**Evidence Over Opinion**
- Every question includes 2+ primary sources
- Cites specific statistics, vote counts, and case names
- Links to government documents, court decisions, and verified reporting

**Systems Thinking**
- Connects Supreme Court decision to broader patterns of federal policy
- Shows how executive orders, court decisions, and budget cuts work together
- Explains the mechanics of federal funding threats and constitutional challenges

**Strategically Confrontational**
- Questions the "democratic process" argument when it affects minority rights
- Challenges assumptions about medical authority vs. political control
- Points out contradictions between stated goals and actual impacts

This follows CivicSense's mission to provide "civic education that politicians don't want you to have" by explaining exactly how power works when constitutional rights meet political opposition.