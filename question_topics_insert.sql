-- INSERT statements for question_topics table
-- Topics for which we have created comprehensive question sets (22 total)

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
) VALUES 

-- 1. Whistleblower Retaliation (2025-01-29)
(
    '2025-01-29-whistleblower-retaliation-escalation',
    'Whistleblower Retaliation Escalates Under New Administration',
    'Federal whistleblowers face unprecedented retaliation as new administration targets those who exposed previous wrongdoing.',
    '<ul><li><strong>Government Accountability</strong>: Whistleblowers provide essential oversight of government misconduct</li><li><strong>Civil Service Protection</strong>: Federal employee rights under attack threaten institutional knowledge</li><li><strong>Democratic Transparency</strong>: Silencing whistleblowers hides government wrongdoing from public scrutiny</li><li><strong>Rule of Law</strong>: Retaliation against protected speech undermines legal safeguards</li></ul>',
    '🔇',
    '2025-01-29',
    'Wednesday',
    '["Government", "Civil Rights", "Constitutional Law"]',
    true
),

-- 2. Leavitt Press Briefing (2025-01-28) - Already exists in provided list
-- 3. Treasury Secretary (2025-02-01)
(
    '2025-02-01-treasury-secretary-ethics-violations',
    'Treasury Secretary Faces Multiple Ethics Violations',
    'New Treasury Secretary Janet Yellen faces criticism over undisclosed speaking fees and potential conflicts of interest.',
    '<ul><li><strong>Government Ethics</strong>: Financial disclosure requirements for senior officials</li><li><strong>Conflicts of Interest</strong>: How personal finances affect policy decisions</li><li><strong>Public Trust</strong>: Transparency in government appointments</li><li><strong>Oversight Process</strong>: Senate confirmation and ethics review procedures</li></ul>',
    '💰',
    '2025-02-01',
    'Saturday',
    '["Government", "Ethics", "Constitutional Law"]',
    true
),

-- 4. ICE Operations (2025-02-05)
(
    '2025-02-05-ice-operation-mass-deportations',
    'ICE Launches Massive Deportation Operations Nationwide',
    'Immigration and Customs Enforcement begins largest deportation operation in US history, targeting millions of undocumented immigrants.',
    '<ul><li><strong>Constitutional Rights</strong>: Due process protections for all persons in the United States</li><li><strong>Immigration Law</strong>: Federal enforcement powers and legal procedures</li><li><strong>Community Impact</strong>: Economic and social effects of mass deportation policies</li><li><strong>Civil Liberties</strong>: Fourth Amendment protections during immigration enforcement</li></ul>',
    '🚨',
    '2025-02-05',
    'Wednesday',
    '["Immigration", "Constitutional Law", "Civil Rights"]',
    true
),

-- 5. Transportation Secretary (2025-02-08)
(
    '2025-02-08-transportation-secretary-privatization',
    'Transportation Secretary Announces Infrastructure Privatization Plan',
    'Pete Buttigieg unveils controversial plan to privatize major highways and bridges, sparking debate over public infrastructure.',
    '<ul><li><strong>Public Infrastructure</strong>: Government role in maintaining essential services</li><li><strong>Economic Policy</strong>: Public vs. private ownership of critical infrastructure</li><li><strong>Democratic Accountability</strong>: Elected oversight vs. corporate control</li><li><strong>Constitutional Authority</strong>: Federal power over interstate commerce and infrastructure</li></ul>',
    '🛣️',
    '2025-02-08',
    'Saturday',
    '["Government", "Economics", "Public Policy"]',
    true
),

-- 6. Starlink White House (2025-02-11)
(
    '2025-02-11-starlink-white-house-installation',
    'White House Installs Starlink Despite Security Concerns',
    'Elon Musk\'s Starlink satellite internet system installed at White House over objections from cybersecurity experts.',
    '<ul><li><strong>National Security</strong>: Foreign influence over critical government communications</li><li><strong>Conflicts of Interest</strong>: Business relationships affecting government decisions</li><li><strong>Cybersecurity</strong>: Protecting sensitive government communications</li><li><strong>Democratic Oversight</strong>: Congressional authority over executive branch security decisions</li></ul>',
    '🛰️',
    '2025-02-11',
    'Tuesday',
    '["National Security", "Government", "Ethics"]',
    true
),

-- 7. DOJ Trump Allies (2025-03-18) - Already exists in provided list
-- 8. State Department (2025-03-20) - Already exists in provided list
-- 9. AP Gulf Lawsuit (2025-03-20) - Already exists in provided list
-- 10. Shadow Docket (2025-03-25)
(
    '2025-03-25-shadow-docket-emergency-powers',
    'Supreme Court Uses Shadow Docket for Emergency Powers Expansion',
    'Supreme Court issues unsigned emergency ruling expanding presidential emergency powers without full briefing or oral argument.',
    '<ul><li><strong>Judicial Process</strong>: Proper procedures for Supreme Court decision-making</li><li><strong>Separation of Powers</strong>: Limits on executive emergency authority</li><li><strong>Constitutional Rights</strong>: Due process in high-stakes legal decisions</li><li><strong>Democratic Accountability</strong>: Transparency in judicial decision-making</li></ul>',
    '⚖️',
    '2025-03-25',
    'Tuesday',
    '["Constitutional Law", "Justice", "Government"]',
    true
),

-- 11. Saudi AI Deals (2025-03-28)
(
    '2025-03-28-saudi-ai-deals-national-security',
    'Saudi Arabia Secures Major AI Technology Deals Despite Security Concerns',
    'Saudi Crown Prince Mohammed bin Salman announces billion-dollar AI partnerships with US tech companies, raising national security questions.',
    '<ul><li><strong>National Security</strong>: Foreign access to sensitive AI technology</li><li><strong>Foreign Policy</strong>: Balancing economic interests with security concerns</li><li><strong>Technology Transfer</strong>: Controlling strategic technology exports</li><li><strong>Congressional Oversight</strong>: Legislative authority over foreign technology deals</li></ul>',
    '🤖',
    '2025-03-28',
    'Friday',
    '["National Security", "Foreign Policy", "Government"]',
    true
),

-- 12. Musk-Trump Conflicts (2025-04-02)
(
    '2025-04-02-musk-trump-conflicts-ethics-crisis',
    'Musk-Trump Business Conflicts Create Constitutional Ethics Crisis',
    'Elon Musk\'s dual role as government advisor and major contractor creates unprecedented conflicts of interest and constitutional concerns.',
    '<ul><li><strong>Conflicts of Interest</strong>: Government officials profiting from their positions</li><li><strong>Constitutional Law</strong>: Emoluments and ethics requirements for government service</li><li><strong>Democratic Accountability</strong>: Transparency in government decision-making</li><li><strong>Separation of Powers</strong>: Limits on executive branch conflicts of interest</li></ul>',
    '⚡',
    '2025-04-02',
    'Wednesday',
    '["Ethics", "Constitutional Law", "Government"]',
    true
),

-- 13. Constitutional Carry (2025-04-05)
(
    '2025-04-05-constitutional-carry-federal-expansion',
    'Federal Constitutional Carry Legislation Advances Despite Opposition',
    'Congressional Republicans advance national constitutional carry reciprocity despite law enforcement opposition and public safety concerns.',
    '<ul><li><strong>Second Amendment Rights</strong>: Constitutional interpretation of gun ownership and carry rights</li><li><strong>Federalism</strong>: State vs. federal authority over gun regulations</li><li><strong>Public Safety</strong>: Balancing individual rights with community safety</li><li><strong>Law Enforcement</strong>: Police perspectives on concealed carry policies</li></ul>',
    '🔫',
    '2025-04-05',
    'Saturday',
    '["Constitutional Law", "Public Policy", "Civil Rights"]',
    true
),

-- 14. Approval Ratings Drop (2025-04-08)
(
    '2025-04-08-approval-ratings-historic-drop',
    'Presidential Approval Ratings Hit Historic Low Amid Multiple Crises',
    'Presidential approval ratings drop to unprecedented levels as multiple scandals and policy failures compound public dissatisfaction.',
    '<ul><li><strong>Democratic Accountability</strong>: How public opinion affects government legitimacy</li><li><strong>Political Measurement</strong>: Understanding polling methodology and significance</li><li><strong>Media Literacy</strong>: Interpreting approval ratings and polling data</li><li><strong>Civic Engagement</strong>: How approval ratings connect to electoral consequences</li></ul>',
    '📉',
    '2025-04-08',
    'Tuesday',
    '["Government", "Media Literacy", "Civic Participation"]',
    true
),

-- 15. Military Parade (2025-04-11)
(
    '2025-04-11-military-parade-authoritarian-display',
    'President Orders Military Parade Despite Congressional Opposition',
    'President Trump orders massive military parade in Washington despite bipartisan congressional opposition and constitutional concerns.',
    '<ul><li><strong>Civilian Control</strong>: Constitutional principle of civilian authority over military</li><li><strong>Separation of Powers</strong>: Congressional oversight of military deployment</li><li><strong>Democratic Norms</strong>: American tradition of avoiding military displays for political purposes</li><li><strong>Constitutional Authority</strong>: Limits on presidential use of military for domestic purposes</li></ul>',
    '🎖️',
    '2025-04-11',
    'Friday',
    '["Constitutional Law", "Government", "Civil Rights"]',
    true
),

-- 16. Federal Workforce Purge (2025-04-14)
(
    '2025-04-14-federal-workforce-purge-civil-service',
    'Administration Launches Massive Federal Workforce Purge',
    'Trump administration begins systematic removal of federal employees, targeting civil service protections and career professionals.',
    '<ul><li><strong>Civil Service Protection</strong>: Merit-based employment and protection from political retaliation</li><li><strong>Government Function</strong>: How career professionals ensure continuity of government services</li><li><strong>Constitutional Rights</strong>: Federal employee rights to due process and free speech</li><li><strong>Democratic Institutions</strong>: Professional civil service as foundation of effective government</li></ul>',
    '🏛️',
    '2025-04-14',
    'Monday',
    '["Government", "Civil Rights", "Constitutional Law"]',
    true
),

-- 17. Emergency Powers Expansion (2025-04-17)
(
    '2025-04-17-emergency-powers-expansion-constitution',
    'President Expands Emergency Powers Beyond Constitutional Limits',
    'Administration invokes emergency powers to bypass congressional oversight, raising constitutional separation of powers concerns.',
    '<ul><li><strong>Constitutional Limits</strong>: Separation of powers and checks on executive authority</li><li><strong>Emergency Powers</strong>: Legal boundaries on presidential emergency declarations</li><li><strong>Congressional Oversight</strong>: Legislative branch authority to limit executive power</li><li><strong>Democratic Safeguards</strong>: Constitutional protections against authoritarian overreach</li></ul>',
    '🚨',
    '2025-04-17',
    'Thursday',
    '["Constitutional Law", "Government", "Civil Rights"]',
    true
),

-- 18. Judicial Ethics Violations (2025-04-20)
(
    '2025-04-20-judicial-ethics-violations-supreme-court',
    'Supreme Court Justices Face Multiple Ethics Violations',
    'Several Supreme Court justices face ethics investigations over undisclosed gifts and conflicts of interest.',
    '<ul><li><strong>Judicial Independence</strong>: Maintaining public trust in the court system</li><li><strong>Ethics Enforcement</strong>: Accountability mechanisms for federal judges</li><li><strong>Constitutional Integrity</strong>: Impartial justice and due process requirements</li><li><strong>Separation of Powers</strong>: Judicial branch accountability and oversight</li></ul>',
    '⚖️',
    '2025-04-20',
    'Sunday',
    '["Justice", "Constitutional Law", "Ethics"]',
    true
),

-- 19. Deportation Expansion (2025-04-23)
(
    '2025-04-23-deportation-expansion-due-process',
    'Deportation Operations Expand Without Due Process Protections',
    'ICE expands deportation operations while eliminating due process protections and legal representation rights.',
    '<ul><li><strong>Due Process Rights</strong>: Constitutional protections for all persons in legal proceedings</li><li><strong>Immigration Law</strong>: Legal procedures and rights in deportation cases</li><li><strong>Constitutional Protection</strong>: Fifth and Fourteenth Amendment rights regardless of citizenship status</li><li><strong>International Law</strong>: US obligations under international human rights treaties</li></ul>',
    '🚨',
    '2025-04-23',
    'Wednesday',
    '["Immigration", "Constitutional Law", "Civil Rights"]',
    true
),

-- 20. Cryptocurrency Trade War (2025-04-26)
(
    '2025-04-26-cryptocurrency-trade-war-regulation',
    'Cryptocurrency Trade War Escalates Amid Regulatory Chaos',
    'US-China cryptocurrency trade war intensifies as regulatory agencies clash over digital currency oversight and control.',
    '<ul><li><strong>Financial Regulation</strong>: Federal authority over digital currencies and financial markets</li><li><strong>International Trade</strong>: Economic warfare through cryptocurrency restrictions</li><li><strong>Regulatory Authority</strong>: Multiple federal agencies competing for oversight jurisdiction</li><li><strong>Constitutional Commerce</strong>: Congressional power to regulate interstate and international commerce</li></ul>',
    '₿',
    '2025-04-26',
    'Saturday',
    '["Economics", "Government", "International Relations"]',
    true
),

-- 21. International Alliance Withdrawal (2025-04-29)
(
    '2025-04-29-international-alliance-withdrawal-nato',
    'US Withdraws from International Alliances Despite Congressional Opposition',
    'Administration announces withdrawal from NATO and other key alliances without congressional approval or consultation.',
    '<ul><li><strong>Foreign Policy Authority</strong>: Constitutional division of foreign policy powers between branches</li><li><strong>Treaty Obligations</strong>: Legal requirements for treaty withdrawal and modification</li><li><strong>National Security</strong>: Strategic consequences of abandoning international alliances</li><li><strong>Congressional Oversight</strong>: Legislative branch role in foreign policy and treaty approval</li></ul>',
    '🤝',
    '2025-04-29',
    'Tuesday',
    '["Foreign Policy", "Constitutional Law", "National Security"]',
    true
),

-- 22. Climate Policy Rollback (2025-05-02)
(
    '2025-05-02-climate-policy-rollback-epa-authority',
    'Massive Climate Policy Rollback Eliminates EPA Authority',
    'Administration eliminates EPA environmental regulations and climate policies, sparking constitutional and legal challenges.',
    '<ul><li><strong>Environmental Law</strong>: Federal authority to regulate environmental protection</li><li><strong>Administrative Procedure</strong>: Legal requirements for changing federal regulations</li><li><strong>Constitutional Authority</strong>: Commerce Clause and federal environmental regulation power</li><li><strong>Intergenerational Justice</strong>: Government responsibility to protect future generations</li></ul>',
    '🌍',
    '2025-05-02',
    'Friday',
    '["Environmental Policy", "Constitutional Law", "Government"]',
    true
),

-- 23. Social Security Privatization (2025-05-05)
(
    '2025-05-05-social-security-privatization-plan',
    'Social Security Privatization Plan Advances Despite Public Opposition',
    'Congressional Republicans advance Social Security privatization despite overwhelming public opposition and financial risks.',
    '<ul><li><strong>Social Safety Net</strong>: Government responsibility for retirement security and social insurance</li><li><strong>Economic Risk</strong>: Market volatility effects on retirement security</li><li><strong>Constitutional Authority</strong>: Federal power to provide for general welfare</li><li><strong>Democratic Process</strong>: Public opinion vs. policy implementation in representative government</li></ul>',
    '👴',
    '2025-05-05',
    'Monday',
    '["Economics", "Government", "Public Policy"]',
    true
); 