-- CivicSense Practical Skills System Seed Script
-- Focus: Simple, everyday skills that build civic confidence
-- Philosophy: "I can actually do this stuff"

-- ====================
-- GOVERNMENT CATEGORY SKILLS
-- ====================
WITH government_category AS (SELECT id FROM categories WHERE name = 'Government' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Read Government Budgets', 'read-budgets', (SELECT id FROM government_category), 'Understand where tax money goes and what governments prioritize. Useful for any budget - school, work, or personal.', 2, true, 1),
    ('Find Public Information', 'find-public-info', (SELECT id FROM government_category), 'Use government websites and databases to find information you need. Great skill for research projects and fact-checking.', 1, true, 2),
    ('Contact Your Representatives', 'contact-representatives', (SELECT id FROM government_category), 'Know who represents you and how to reach them. Apply this networking skill anywhere you need to influence decisions.', 1, true, 3),
    ('Attend Public Meetings', 'attend-meetings', (SELECT id FROM government_category), 'Show up to city council, school board, and community meetings. Learn how decisions get made in any organization.', 2, false, 4),
    ('Understand Government Structure', 'government-structure', (SELECT id FROM government_category), 'Know which level of government handles what issues. Helps you solve problems and know who to contact.', 2, true, 5),
    ('Track Government Spending', 'track-spending', (SELECT id FROM government_category), 'Follow how your tax dollars are used. Apply this accountability thinking to any organization you''re part of.', 2, false, 6),
    ('Navigate Government Websites', 'navigate-government-websites', (SELECT id FROM government_category), 'Find information and services on federal, state, and local government sites. Digital literacy for accessing resources.', 1, false, 7),
    ('Understand Government Transparency', 'understand-government-transparency', (SELECT id FROM government_category), 'Know what information government must make public and how to access it. Transparency skills for any organization.', 2, false, 8),
    ('Track Government Performance', 'track-government-performance', (SELECT id FROM government_category), 'Monitor whether government programs actually work. Performance evaluation skill for any service provider.', 3, false, 9),
    ('Understand Government Ethics', 'understand-government-ethics', (SELECT id FROM government_category), 'Know rules about conflicts of interest and corruption. Ethics awareness for any professional environment.', 2, false, 10),
    ('Use Government Services', 'use-government-services', (SELECT id FROM government_category), 'Access benefits, licenses, permits, and services you''re entitled to. Service navigation for adult life.', 2, false, 11),
    ('Understand Emergency Government Powers', 'understand-emergency-powers', (SELECT id FROM government_category), 'Know what governments can do during emergencies and when those powers should end. Crisis management understanding.', 3, false, 12),
    ('Monitor Government Contracts', 'monitor-government-contracts', (SELECT id FROM government_category), 'Track how government spends money on contractors and vendors. Procurement oversight for taxpayer accountability.', 3, false, 13),
    ('Understand Government Employment', 'understand-government-employment', (SELECT id FROM government_category), 'Know how government hiring works and what protections public employees have. Career knowledge for public service.', 2, false, 14),
    ('Participate in Government Surveys', 'participate-government-surveys', (SELECT id FROM government_category), 'Respond to census and other official data collection efforts. Civic duty for accurate representation and data.', 1, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM government_category) IS NOT NULL;

-- ====================
-- ELECTIONS CATEGORY SKILLS  
-- ====================
WITH elections_category AS (SELECT id FROM categories WHERE name = 'Elections' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Research Candidates', 'research-candidates', (SELECT id FROM elections_category), 'Look up candidates'' backgrounds, positions, and track records. Use these research skills to evaluate any leader or expert.', 2, true, 1),
    ('Understand Your Ballot', 'understand-ballot', (SELECT id FROM elections_category), 'Figure out what you''re actually voting on, from president to local measures. Great skill for understanding any complex decision.', 1, true, 2),
    ('Register and Vote', 'register-vote', (SELECT id FROM elections_category), 'Navigate the voting process from registration to casting your ballot. Learn to follow procedures in any formal process.', 1, true, 3),
    ('Spot Campaign Tricks', 'spot-campaign-tricks', (SELECT id FROM elections_category), 'Recognize when politicians are trying to manipulate you. Protect yourself from manipulation in advertising and sales too.', 2, true, 4),
    ('Help Others Vote', 'help-others-vote', (SELECT id FROM elections_category), 'Help friends and family understand elections and voting. Practice explaining complex topics clearly.', 2, false, 5),
    ('Follow Election Results', 'follow-election-results', (SELECT id FROM elections_category), 'Understand how elections work and how to verify results. Apply critical thinking to any reported outcomes.', 2, false, 6),
    ('Understand Election Laws', 'understand-election-laws', (SELECT id FROM elections_category), 'Know the rules about voting, campaigning, and election procedures. Legal literacy for democratic participation.', 2, false, 7),
    ('Volunteer at Polling Places', 'volunteer-polling-places', (SELECT id FROM elections_category), 'Help run elections as a poll worker or election observer. Service skill for supporting democracy.', 2, false, 8),
    ('Understand Absentee and Early Voting', 'understand-absentee-early-voting', (SELECT id FROM elections_category), 'Know all the ways you can legally cast your ballot. Process knowledge for maximizing participation.', 1, false, 9),
    ('Research Local Elections', 'research-local-elections', (SELECT id FROM elections_category), 'Find information about school board, city council, and county races. Local engagement for maximum impact.', 2, false, 10),
    ('Understand Campaign Finance Rules', 'understand-campaign-finance-rules', (SELECT id FROM elections_category), 'Know the laws about political donations and spending. Financial transparency for democratic accountability.', 3, false, 11),
    ('Track Election Administration', 'track-election-administration', (SELECT id FROM elections_category), 'Monitor how elections are run and identify problems. Quality assurance thinking for any important process.', 3, false, 12),
    ('Organize Voter Registration', 'organize-voter-registration', (SELECT id FROM elections_category), 'Plan drives to register new voters in your community. Organizing skill for expanding participation.', 3, false, 13),
    ('Understand Redistricting Impact', 'understand-redistricting-impact', (SELECT id FROM elections_category), 'Know how district boundaries affect election outcomes. Geographic analysis for understanding representation.', 3, false, 14),
    ('Combat Election Misinformation', 'combat-election-misinformation', (SELECT id FROM elections_category), 'Recognize and counter false information about voting and elections. Information warfare defense for democracy.', 2, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM elections_category) IS NOT NULL;

-- ====================
-- ECONOMY CATEGORY SKILLS
-- ====================
WITH economy_category AS (SELECT id FROM categories WHERE name = 'Economy' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Read Economic News', 'read-economic-news', (SELECT id FROM economy_category), 'Understand what economic reports actually mean for your life. Helps you make better decisions about jobs, spending, and savings.', 2, true, 1),
    ('Figure Out Tax Impact', 'figure-tax-impact', (SELECT id FROM economy_category), 'Calculate how tax changes affect your family''s budget. Useful for understanding any policy that costs or saves you money.', 2, true, 2),
    ('Spot Economic BS', 'spot-economic-bs', (SELECT id FROM economy_category), 'Recognize when politicians or media misuse economic statistics. Protect yourself from misleading financial information anywhere.', 3, true, 3),
    ('Track Government Spending', 'track-government-spending', (SELECT id FROM economy_category), 'See where tax money actually goes and whether programs work. Apply this accountability thinking to any organization.', 2, false, 4),
    ('Understand Inflation', 'understand-inflation', (SELECT id FROM economy_category), 'Know why prices go up and down and how it affects your purchasing power. Helps with personal budgeting and financial planning.', 2, false, 5),
    ('Read Jobs Reports', 'read-jobs-reports', (SELECT id FROM economy_category), 'Understand employment data and what it means for job opportunities. Useful for career planning and understanding economic trends.', 2, false, 6),
    ('Understand Federal Reserve', 'understand-federal-reserve', (SELECT id FROM economy_category), 'Know how central banking affects interest rates and your finances. Financial literacy for personal money management.', 3, false, 7),
    ('Track Economic Indicators', 'track-economic-indicators', (SELECT id FROM economy_category), 'Follow GDP, unemployment, and other key economic measures. Data analysis for understanding economic health.', 3, false, 8),
    ('Understand Government Debt', 'understand-government-debt', (SELECT id FROM economy_category), 'Know how national and local debt affects your future. Financial responsibility thinking for personal and public finances.', 3, false, 9),
    ('Research Economic Impact', 'research-economic-impact', (SELECT id FROM economy_category), 'Study how policies affect different communities economically. Impact analysis for understanding policy consequences.', 3, false, 10),
    ('Understand Economic Cycles', 'understand-economic-cycles', (SELECT id FROM economy_category), 'Know how recessions and recoveries work. Economic planning for personal financial security.', 3, false, 11),
    ('Track Minimum Wage Debates', 'track-minimum-wage-debates', (SELECT id FROM economy_category), 'Follow discussions about wage policy and worker rights. Labor economics for understanding workplace issues.', 2, false, 12),
    ('Understand Healthcare Economics', 'understand-healthcare-economics', (SELECT id FROM economy_category), 'Know how healthcare costs affect budgets and policy. Cost analysis for major life expenses.', 3, false, 13),
    ('Research Economic Inequality', 'research-economic-inequality', (SELECT id FROM economy_category), 'Study income and wealth gaps and their causes. Social analysis for understanding systemic issues.', 3, false, 14),
    ('Understand Global Economics', 'understand-global-economics', (SELECT id FROM economy_category), 'Know how international trade and finance affect local economies. Global perspective for local decision-making.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM economy_category) IS NOT NULL;

-- ====================
-- CIVIL RIGHTS CATEGORY SKILLS
-- ====================
WITH civil_rights_category AS (SELECT id FROM categories WHERE name = 'Civil Rights' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Know Your Rights', 'know-your-rights', (SELECT id FROM civil_rights_category), 'Understand your basic rights in different situations. Helps you stand up for yourself at school, work, and in the community.', 1, true, 1),
    ('Document Problems', 'document-problems', (SELECT id FROM civil_rights_category), 'Record incidents properly to build a case for change. Useful skill for addressing any unfair treatment.', 2, true, 2),
    ('File Complaints', 'file-complaints', (SELECT id FROM civil_rights_category), 'Know how to report discrimination and get help through official channels. Apply this to any unfair situation.', 2, true, 3),
    ('Research Laws', 'research-laws', (SELECT id FROM civil_rights_category), 'Look up laws and regulations that protect you. Great research skill for understanding rules in any situation.', 2, false, 4),
    ('Recognize Discrimination', 'recognize-discrimination', (SELECT id FROM civil_rights_category), 'Spot unfair treatment based on race, gender, religion, or other factors. Helps create fair environments everywhere.', 2, false, 5),
    ('Help Others with Rights', 'help-others-rights', (SELECT id FROM civil_rights_category), 'Teach others about their rights and how to protect themselves. Practice being an advocate and educator.', 3, false, 6),
    ('Understand Workplace Rights', 'understand-workplace-rights', (SELECT id FROM civil_rights_category), 'Know your rights at work including fair treatment and safe conditions. Professional self-protection skills.', 2, false, 7),
    ('Navigate Disability Rights', 'navigate-disability-rights', (SELECT id FROM civil_rights_category), 'Understand accommodations and protections for people with disabilities. Accessibility advocacy and support skills.', 2, false, 8),
    ('Understand Housing Rights', 'understand-housing-rights', (SELECT id FROM civil_rights_category), 'Know your rights as a renter or homeowner. Consumer protection for major life decisions.', 2, false, 9),
    ('Track Police Accountability', 'track-police-accountability', (SELECT id FROM civil_rights_category), 'Monitor police conduct and support reform efforts. Accountability skills for public safety.', 3, false, 10),
    ('Understand Student Rights', 'understand-student-rights', (SELECT id FROM civil_rights_category), 'Know your rights in school including free speech and due process. Educational advocacy for fair treatment.', 2, false, 11),
    ('Support Voting Rights', 'support-voting-rights', (SELECT id FROM civil_rights_category), 'Help protect and expand access to voting for all eligible citizens. Democratic participation and advocacy.', 2, false, 12),
    ('Combat Hate and Bias', 'combat-hate-bias', (SELECT id FROM civil_rights_category), 'Recognize and respond to hate crimes and bias incidents. Community safety and social justice skills.', 2, false, 13),
    ('Understand LGBTQ+ Rights', 'understand-lgbtq-rights', (SELECT id FROM civil_rights_category), 'Know legal protections and ongoing struggles for LGBTQ+ equality. Inclusion and ally skills.', 2, false, 14),
    ('Monitor Civil Rights Enforcement', 'monitor-civil-rights-enforcement', (SELECT id FROM civil_rights_category), 'Track whether civil rights laws are actually enforced. Government accountability for equal protection.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM civil_rights_category) IS NOT NULL;

-- ====================
-- MEDIA LITERACY CATEGORY SKILLS
-- ====================
WITH media_literacy_category AS (SELECT id FROM categories WHERE name = 'Media Literacy' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Check If Sources Are Real', 'check-sources', (SELECT id FROM media_literacy_category), 'Verify whether news sources and websites are trustworthy. Essential skill for school research and avoiding fake news.', 1, true, 1),
    ('Fact-Check Claims', 'fact-check-claims', (SELECT id FROM media_literacy_category), 'Use reliable methods to verify if something is true. Protect yourself from misinformation in all areas of life.', 2, true, 2),
    ('Spot Bias and Manipulation', 'spot-bias', (SELECT id FROM media_literacy_category), 'Recognize when media, ads, or people are trying to influence you unfairly. Stay in control of your own opinions.', 2, true, 3),
    ('Read Charts and Stats', 'read-charts-stats', (SELECT id FROM media_literacy_category), 'Understand graphs, statistics, and data presentations. Useful for school projects and making informed decisions.', 2, true, 4),
    ('Find Original Sources', 'find-original-sources', (SELECT id FROM media_literacy_category), 'Track down where information actually comes from. Great research skill for any project or important decision.', 2, false, 5),
    ('Evaluate Online Information', 'evaluate-online-info', (SELECT id FROM media_literacy_category), 'Judge whether websites, social media posts, and online claims are reliable. Stay safe and informed online.', 2, false, 6),
    ('Understand Media Business Models', 'understand-media-business-models', (SELECT id FROM media_literacy_category), 'Know how news outlets make money and how that affects content. Critical thinking about information incentives.', 3, false, 7),
    ('Recognize Clickbait', 'recognize-clickbait', (SELECT id FROM media_literacy_category), 'Spot headlines designed to manipulate you into clicking. Consumer protection for attention economy.', 2, false, 8),
    ('Understand Algorithms', 'understand-algorithms', (SELECT id FROM media_literacy_category), 'Know how social media and search engines decide what you see. Digital literacy for information consumption.', 2, false, 9),
    ('Practice Lateral Reading', 'practice-lateral-reading', (SELECT id FROM media_literacy_category), 'Verify information by checking multiple sources simultaneously. Research technique for accuracy.', 2, false, 10),
    ('Identify Deepfakes', 'identify-deepfakes', (SELECT id FROM media_literacy_category), 'Recognize artificially generated images, videos, and audio. Digital forensics for authentic information.', 3, false, 11),
    ('Understand Media Ownership', 'understand-media-ownership', (SELECT id FROM media_literacy_category), 'Know who owns major news outlets and how that affects coverage. Structural analysis for information bias.', 3, false, 12),
    ('Create Media Responsibly', 'create-media-responsibly', (SELECT id FROM media_literacy_category), 'Share information online ethically and accurately. Digital citizenship for responsible communication.', 2, false, 13),
    ('Understand Information Warfare', 'understand-information-warfare', (SELECT id FROM media_literacy_category), 'Recognize when foreign governments or bad actors try to manipulate public opinion. Security awareness for democracy.', 3, false, 14),
    ('Teach Media Literacy', 'teach-media-literacy', (SELECT id FROM media_literacy_category), 'Help others develop critical thinking about media and information. Educational leadership for community resilience.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM media_literacy_category) IS NOT NULL;

-- ====================
-- CONSTITUTIONAL LAW CATEGORY SKILLS
-- ====================
WITH constitutional_law_category AS (SELECT id FROM categories WHERE name = 'Constitutional Law' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Use Your Constitutional Rights', 'use-constitutional-rights', (SELECT id FROM constitutional_law_category), 'Know when and how to invoke your constitutional protections. Helps you stand up for yourself in any formal situation.', 2, true, 1),
    ('Recognize Government Overreach', 'recognize-overreach', (SELECT id FROM constitutional_law_category), 'Spot when authorities exceed their legal powers. Apply this to any situation where someone abuses their authority.', 3, true, 2),
    ('Understand Checks and Balances', 'understand-checks-balances', (SELECT id FROM constitutional_law_category), 'See how different parts of government limit each other''s power. Useful for understanding any organization''s structure.', 2, true, 3),
    ('Know Due Process', 'know-due-process', (SELECT id FROM constitutional_law_category), 'Understand your right to fair procedures in legal situations. Apply this fairness thinking to school and work disputes.', 2, false, 4),
    ('Understand Federal vs State Power', 'federal-vs-state', (SELECT id FROM constitutional_law_category), 'Know which level of government handles different issues. Helps you contact the right people to solve problems.', 2, false, 5),
    ('Read Legal Documents', 'read-legal-documents', (SELECT id FROM constitutional_law_category), 'Understand basic legal language in contracts, policies, and official documents. Useful skill for navigating adult life.', 3, false, 6),
    ('Understand First Amendment', 'understand-first-amendment', (SELECT id FROM constitutional_law_category), 'Know your rights to free speech, religion, press, and assembly. Free expression skills for democratic participation.', 2, false, 7),
    ('Understand Fourth Amendment', 'understand-fourth-amendment', (SELECT id FROM constitutional_law_category), 'Know your rights against unreasonable searches and seizures. Privacy protection for personal security.', 2, false, 8),
    ('Understand Equal Protection', 'understand-equal-protection', (SELECT id FROM constitutional_law_category), 'Know how the 14th Amendment protects against discrimination. Anti-discrimination awareness for fair treatment.', 2, false, 9),
    ('Understand Supreme Court Impact', 'understand-supreme-court-impact', (SELECT id FROM constitutional_law_category), 'Know how Supreme Court decisions affect your daily life. Legal awareness for understanding rights changes.', 3, false, 10),
    ('Understand Executive Power', 'understand-executive-power', (SELECT id FROM constitutional_law_category), 'Know what presidents and governors can and cannot do. Authority limits for accountability.', 3, false, 11),
    ('Understand Legislative Limits', 'understand-legislative-limits', (SELECT id FROM constitutional_law_category), 'Know constitutional restrictions on what laws can be passed. Legislative oversight for rights protection.', 3, false, 12),
    ('Understand State vs Federal Rights', 'understand-state-vs-federal-rights', (SELECT id FROM constitutional_law_category), 'Know which rights come from federal vs state constitutions. Rights navigation for multi-level governance.', 3, false, 13),
    ('Understand Amendment Process', 'understand-amendment-process', (SELECT id FROM constitutional_law_category), 'Know how the Constitution can be changed. Civic engagement for constitutional reform.', 3, false, 14),
    ('Apply Constitutional Principles', 'apply-constitutional-principles', (SELECT id FROM constitutional_law_category), 'Use constitutional thinking in everyday situations involving fairness and procedure. Principled decision-making for any situation.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM constitutional_law_category) IS NOT NULL;

-- ====================
-- PUBLIC POLICY CATEGORY SKILLS
-- ====================
WITH public_policy_category AS (SELECT id FROM categories WHERE name = 'Public Policy' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Analyze Policy Changes', 'analyze-policy-changes', (SELECT id FROM public_policy_category), 'Figure out how new policies will actually affect you and your community. Great skill for evaluating any proposed change.', 2, true, 1),
    ('Write Public Comments', 'write-public-comments', (SELECT id FROM public_policy_category), 'Submit effective feedback on government proposals. Practice persuasive writing and participating in decision-making.', 2, true, 2),
    ('Track Policy Results', 'track-policy-results', (SELECT id FROM public_policy_category), 'Follow up on whether policies actually work as promised. Apply this accountability thinking anywhere decisions are made.', 2, false, 3),
    ('Understand Cost vs Benefit', 'cost-vs-benefit', (SELECT id FROM public_policy_category), 'Weigh the pros and cons of policy decisions. Useful framework for making any important life choice.', 2, true, 4),
    ('Find Who Benefits', 'find-who-benefits', (SELECT id FROM public_policy_category), 'Figure out who wins and loses from policy changes. Helps you understand the real motivations behind any decision.', 3, false, 5),
    ('Read Policy Proposals', 'read-policy-proposals', (SELECT id FROM public_policy_category), 'Understand what policies actually say beyond the headlines. Great skill for reading any important document thoroughly.', 3, false, 6),
    ('Understand Policy Process', 'understand-policy-process', (SELECT id FROM public_policy_category), 'Know how policies are developed, approved, and implemented. Process knowledge for organizational change.', 2, false, 7),
    ('Evaluate Policy Research', 'evaluate-policy-research', (SELECT id FROM public_policy_category), 'Judge whether studies support policy recommendations. Critical thinking for evidence-based decisions.', 3, false, 8),
    ('Compare Policy Models', 'compare-policy-models', (SELECT id FROM public_policy_category), 'Study how different places have addressed similar problems. Benchmarking skill for problem-solving.', 3, false, 9),
    ('Understand Policy Funding', 'understand-policy-funding', (SELECT id FROM public_policy_category), 'Know how policies are paid for and budget implications. Financial planning for any major initiative.', 3, false, 10),
    ('Monitor Policy Implementation', 'monitor-policy-implementation', (SELECT id FROM public_policy_category), 'Track whether policies work as intended in practice. Quality assurance for any planned change.', 3, false, 11),
    ('Participate in Policy Making', 'participate-policy-making', (SELECT id FROM public_policy_category), 'Engage in task forces, commissions, and policy development processes. Leadership for institutional change.', 3, false, 12),
    ('Understand Regulatory Process', 'understand-regulatory-process', (SELECT id FROM public_policy_category), 'Know how government creates and changes regulations. Rule-making knowledge for business and advocacy.', 3, false, 13),
    ('Evaluate Policy Pilots', 'evaluate-policy-pilots', (SELECT id FROM public_policy_category), 'Assess small-scale tests of new policies before full implementation. Pilot program thinking for risk management.', 3, false, 14),
    ('Build Policy Coalitions', 'build-policy-coalitions', (SELECT id FROM public_policy_category), 'Unite different groups to support policy changes. Coalition building for any advocacy effort.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM public_policy_category) IS NOT NULL;

-- ====================
-- CIVIC ACTION CATEGORY SKILLS
-- ====================
WITH civic_action_category AS (SELECT id FROM categories WHERE name = 'Civic Action' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Organize People for Change', 'organize-for-change', (SELECT id FROM civic_action_category), 'Bring people together to solve community problems. Leadership skill useful for any group project or cause.', 3, true, 1),
    ('Communicate Your Message', 'communicate-message', (SELECT id FROM civic_action_category), 'Explain your ideas clearly to different audiences. Essential skill for school presentations, job interviews, and persuasion.', 2, true, 2),
    ('Build Coalitions', 'build-coalitions', (SELECT id FROM civic_action_category), 'Unite different groups around shared goals. Teamwork skill that works in any collaborative environment.', 3, false, 3),
    ('Plan Campaigns', 'plan-campaigns', (SELECT id FROM civic_action_category), 'Organize efforts to create change step by step. Project management skill useful for any goal you want to achieve.', 3, true, 4),
    ('Lead Community Efforts', 'lead-community-efforts', (SELECT id FROM civic_action_category), 'Take charge of local initiatives and volunteer efforts. Develop leadership skills you can use anywhere.', 3, false, 5),
    ('Resolve Conflicts', 'resolve-conflicts', (SELECT id FROM civic_action_category), 'Help people with different viewpoints find common ground. Valuable skill for family, school, and work situations.', 3, false, 6),
    ('Use Social Media for Change', 'use-social-media-change', (SELECT id FROM civic_action_category), 'Leverage social platforms responsibly to raise awareness and organize action. Digital organizing for any cause.', 2, false, 7),
    ('Write Op-Eds and Articles', 'write-op-eds-articles', (SELECT id FROM civic_action_category), 'Publish your views in newspapers and online publications. Public writing for thought leadership.', 3, false, 8),
    ('Lobby Elected Officials', 'lobby-elected-officials', (SELECT id FROM civic_action_category), 'Meet with representatives to advocate for specific policies. Professional advocacy for any important issue.', 3, false, 9),
    ('Organize Fundraising', 'organize-fundraising', (SELECT id FROM civic_action_category), 'Raise money to support causes and candidates you believe in. Resource mobilization for any goal.', 3, false, 10),
    ('Train Other Activists', 'train-other-activists', (SELECT id FROM civic_action_category), 'Teach others organizing and advocacy skills. Leadership development for movement building.', 3, false, 11),
    ('Plan Direct Action', 'plan-direct-action', (SELECT id FROM civic_action_category), 'Organize protests, demonstrations, and civil disobedience safely and effectively. Strategic action for social change.', 4, false, 12),
    ('Use Data for Advocacy', 'use-data-advocacy', (SELECT id FROM civic_action_category), 'Research and present compelling evidence to support your cause. Data storytelling for persuasion.', 3, false, 13),
    ('Build Media Relations', 'build-media-relations', (SELECT id FROM civic_action_category), 'Work with journalists to get coverage for your issues. Public relations for any organization or cause.', 3, false, 14),
    ('Create Lasting Change', 'create-lasting-change', (SELECT id FROM civic_action_category), 'Design campaigns that create sustainable improvements rather than temporary fixes. Systems change thinking for long-term impact.', 4, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM civic_action_category) IS NOT NULL;

-- ====================
-- AI GOVERNANCE CATEGORY SKILLS
-- ====================
WITH ai_governance_category AS (SELECT id FROM categories WHERE name = 'AI Governance' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Understand AI in Daily Life', 'understand-ai-daily-life', (SELECT id FROM ai_governance_category), 'Recognize when AI affects your decisions and choices. Helps you stay in control of technology instead of being controlled by it.', 1, true, 1),
    ('Protect Your Data from AI', 'protect-data-from-ai', (SELECT id FROM ai_governance_category), 'Control what information AI systems collect about you. Essential privacy skill for the digital age.', 2, true, 2),
    ('Spot AI Bias and Unfairness', 'spot-ai-bias', (SELECT id FROM ai_governance_category), 'Recognize when AI systems treat people unfairly. Critical thinking skill for any automated decision-making.', 2, true, 3),
    ('Understand AI in Government', 'understand-ai-government', (SELECT id FROM ai_governance_category), 'Know how government uses AI for services and enforcement. Helps you understand how you''re being governed.', 2, false, 4),
    ('Advocate for AI Accountability', 'advocate-ai-accountability', (SELECT id FROM ai_governance_category), 'Push for transparency and oversight of AI systems. Advocacy skill for any technology issue.', 3, false, 5),
    ('Understand AI and Jobs', 'understand-ai-jobs', (SELECT id FROM ai_governance_category), 'Know how AI affects employment and what skills remain valuable. Career planning for technological change.', 2, false, 6),
    ('Navigate AI in Education', 'navigate-ai-education', (SELECT id FROM ai_governance_category), 'Understand AI tools in schools and learning. Educational technology literacy for students and parents.', 2, false, 7),
    ('Understand AI and Healthcare', 'understand-ai-healthcare', (SELECT id FROM ai_governance_category), 'Know how AI affects medical decisions and patient care. Healthcare advocacy for AI-assisted medicine.', 2, false, 8),
    ('Evaluate AI Research Claims', 'evaluate-ai-research-claims', (SELECT id FROM ai_governance_category), 'Judge whether AI research supports policy recommendations. Scientific literacy for technology policy.', 3, false, 9),
    ('Understand AI and Democracy', 'understand-ai-democracy', (SELECT id FROM ai_governance_category), 'Know how AI affects elections, free speech, and democratic participation. Democratic engagement in the digital age.', 3, false, 10),
    ('Advocate for AI Ethics', 'advocate-ai-ethics', (SELECT id FROM ai_governance_category), 'Push for ethical development and use of AI systems. Moral leadership for technological progress.', 3, false, 11),
    ('Understand AI Regulation', 'understand-ai-regulation', (SELECT id FROM ai_governance_category), 'Know current and proposed laws governing AI systems. Legal literacy for emerging technology.', 3, false, 12),
    ('Participate in AI Policy', 'participate-ai-policy', (SELECT id FROM ai_governance_category), 'Engage in public discussions about AI governance and regulation. Civic participation for technology policy.', 3, false, 13),
    ('Understand AI and Privacy Rights', 'understand-ai-privacy-rights', (SELECT id FROM ai_governance_category), 'Know your rights regarding AI data collection and processing. Privacy advocacy for algorithmic systems.', 2, false, 14),
    ('Build AI Literacy in Community', 'build-ai-literacy-community', (SELECT id FROM ai_governance_category), 'Help others understand AI impacts and governance issues. Educational leadership for digital citizenship.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM ai_governance_category) IS NOT NULL;

-- ====================
-- IMMIGRATION CATEGORY SKILLS
-- ====================
WITH immigration_category AS (SELECT id FROM categories WHERE name = 'Immigration' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Understand Immigration Basics', 'understand-immigration-basics', (SELECT id FROM immigration_category), 'Know the difference between various immigration statuses and processes. Helps you understand diverse communities and legal pathways.', 1, true, 1),
    ('Help Immigrants Navigate Services', 'help-immigrants-navigate-services', (SELECT id FROM immigration_category), 'Assist newcomers in accessing government services and community resources. Service navigation skills for helping others.', 2, true, 2),
    ('Understand Immigration Rights', 'understand-immigration-rights', (SELECT id FROM immigration_category), 'Know what rights immigrants have regardless of status. Human rights awareness for community support.', 2, true, 3),
    ('Combat Immigration Misinformation', 'combat-immigration-misinformation', (SELECT id FROM immigration_category), 'Recognize and counter false claims about immigration. Fact-checking skills for community education.', 2, false, 4),
    ('Understand Immigration Economics', 'understand-immigration-economics', (SELECT id FROM immigration_category), 'Know how immigration affects local economies and job markets. Economic analysis for policy discussions.', 3, false, 5),
    ('Support Immigrant Integration', 'support-immigrant-integration', (SELECT id FROM immigration_category), 'Help newcomers connect with community resources and opportunities. Community building for inclusive neighborhoods.', 2, false, 6),
    ('Understand Refugee and Asylum Process', 'understand-refugee-asylum-process', (SELECT id FROM immigration_category), 'Know how refugee resettlement and asylum systems work. Humanitarian awareness for crisis response.', 2, false, 7),
    ('Navigate Immigration Enforcement', 'navigate-immigration-enforcement', (SELECT id FROM immigration_category), 'Understand immigration enforcement policies and community rights. Legal awareness for community protection.', 3, false, 8),
    ('Advocate for Immigration Reform', 'advocate-immigration-reform', (SELECT id FROM immigration_category), 'Engage in policy discussions about immigration system improvements. Policy advocacy for systemic change.', 3, false, 9),
    ('Understand Border Policy', 'understand-border-policy', (SELECT id FROM immigration_category), 'Know how border security and immigration control policies work. Security policy for informed citizenship.', 3, false, 10),
    ('Support DACA and Dreamers', 'support-daca-dreamers', (SELECT id FROM immigration_category), 'Understand policies affecting young immigrants brought as children. Youth advocacy for educational opportunity.', 2, false, 11),
    ('Understand Family Immigration', 'understand-family-immigration', (SELECT id FROM immigration_category), 'Know how family reunification and sponsorship processes work. Family support for immigration navigation.', 2, false, 12),
    ('Understand Work-Based Immigration', 'understand-work-based-immigration', (SELECT id FROM immigration_category), 'Know how employment-based immigration and work visas function. Career development for global workforce.', 2, false, 13),
    ('Monitor Immigration Policy Changes', 'monitor-immigration-policy-changes', (SELECT id FROM immigration_category), 'Track changes in immigration laws and enforcement priorities. Policy monitoring for community preparedness.', 3, false, 14),
    ('Build Immigrant-Inclusive Communities', 'build-immigrant-inclusive-communities', (SELECT id FROM immigration_category), 'Create welcoming environments for newcomers in schools, workplaces, and neighborhoods. Community leadership for diversity and inclusion.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM immigration_category) IS NOT NULL;

-- ====================
-- JUSTICE CATEGORY SKILLS
-- ====================
WITH justice_category AS (SELECT id FROM categories WHERE name = 'Justice' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Navigate Legal Systems', 'navigate-legal-systems', (SELECT id FROM justice_category), 'Understand how courts and legal processes work. Helps you protect yourself and get help when you need it.', 2, true, 1),
    ('Evaluate Evidence', 'evaluate-evidence', (SELECT id FROM justice_category), 'Judge whether evidence and testimony are reliable. Critical thinking skill useful for school, work, and personal decisions.', 2, true, 2),
    ('Know When to Get Legal Help', 'know-legal-help', (SELECT id FROM justice_category), 'Recognize situations where you need a lawyer or legal advice. Protects you from making costly mistakes.', 2, true, 3),
    ('Understand Court Procedures', 'understand-court-procedures', (SELECT id FROM justice_category), 'Know what happens in different types of legal proceedings. Helps you feel confident if you ever need to go to court.', 2, false, 4),
    ('Research Legal Options', 'research-legal-options', (SELECT id FROM justice_category), 'Find out what legal remedies are available for different problems. Research skill that helps you solve any complex issue.', 3, false, 5),
    ('Support Fair Justice', 'support-fair-justice', (SELECT id FROM justice_category), 'Understand what makes justice systems fair and effective. Helps you advocate for fairness in any organization.', 3, false, 6),
    ('Understand Criminal vs Civil Law', 'understand-criminal-vs-civil', (SELECT id FROM justice_category), 'Know the difference between criminal and civil legal processes. Legal literacy for understanding case types.', 2, false, 7),
    ('Understand Bail and Pretrial', 'understand-bail-pretrial', (SELECT id FROM justice_category), 'Know how the bail system works and its effects on communities. Justice system knowledge for reform advocacy.', 3, false, 8),
    ('Understand Public Defenders', 'understand-public-defenders', (SELECT id FROM justice_category), 'Know your right to legal representation and how the public defender system works. Legal rights protection.', 2, false, 9),
    ('Monitor Police Practices', 'monitor-police-practices', (SELECT id FROM justice_category), 'Track police conduct and accountability in your community. Public safety oversight for community protection.', 3, false, 10),
    ('Understand Sentencing', 'understand-sentencing', (SELECT id FROM justice_category), 'Know how criminal sentences are determined and their impacts. Justice policy understanding for reform advocacy.', 3, false, 11),
    ('Support Crime Victims', 'support-crime-victims', (SELECT id FROM justice_category), 'Know resources available for crime victims and how to help them access services. Victim advocacy and support skills.', 2, false, 12),
    ('Understand Juvenile Justice', 'understand-juvenile-justice', (SELECT id FROM justice_category), 'Know how the justice system treats young people differently. Youth advocacy and protection skills.', 2, false, 13),
    ('Advocate for Justice Reform', 'advocate-justice-reform', (SELECT id FROM justice_category), 'Work to improve fairness and effectiveness in the justice system. Reform advocacy for systemic change.', 3, false, 14),
    ('Understand Restorative Justice', 'understand-restorative-justice', (SELECT id FROM justice_category), 'Know alternatives to punishment that focus on healing and community. Conflict resolution for repairing harm.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM justice_category) IS NOT NULL;

-- ====================
-- NATIONAL SECURITY CATEGORY SKILLS
-- ====================
WITH national_security_category AS (SELECT id FROM categories WHERE name = 'National Security' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Assess Risks', 'assess-risks', (SELECT id FROM national_security_category), 'Evaluate threats and plan for safety. Useful skill for personal safety, travel, and emergency planning.', 2, true, 1),
    ('Protect Your Information', 'protect-information', (SELECT id FROM national_security_category), 'Keep your personal data and communications secure. Essential skill for online safety and privacy.', 2, true, 2),
    ('Prepare for Emergencies', 'prepare-emergencies', (SELECT id FROM national_security_category), 'Plan ahead for natural disasters and other emergencies. Practical skill that could save your life.', 2, true, 3),
    ('Balance Security and Freedom', 'balance-security-freedom', (SELECT id FROM national_security_category), 'Understand trade-offs between safety measures and personal rights. Critical thinking skill for evaluating any policy.', 3, false, 4),
    ('Spot Security Threats', 'spot-security-threats', (SELECT id FROM national_security_category), 'Recognize different types of security risks and scams. Helps you stay safe online and in person.', 2, false, 5),
    ('Understand Intelligence', 'understand-intelligence', (SELECT id FROM national_security_category), 'Know how security agencies gather and use information. Helps you understand current events and privacy issues.', 3, false, 6),
    ('Understand Cybersecurity', 'understand-cybersecurity', (SELECT id FROM national_security_category), 'Protect yourself and others from online threats and scams. Digital security for personal and professional safety.', 2, false, 7),
    ('Understand Terrorism Prevention', 'understand-terrorism-prevention', (SELECT id FROM national_security_category), 'Know how communities can prevent and respond to terrorist threats. Community safety and resilience skills.', 3, false, 8),
    ('Understand Military Role', 'understand-military-role', (SELECT id FROM national_security_category), 'Know what the military can and cannot do domestically. Civil-military relations for democratic oversight.', 3, false, 9),
    ('Monitor Security Spending', 'monitor-security-spending', (SELECT id FROM national_security_category), 'Track how much government spends on defense and security. Budget oversight for taxpayer accountability.', 3, false, 10),
    ('Understand Border Security', 'understand-border-security', (SELECT id FROM national_security_category), 'Know how border protection works and affects communities. Security policy understanding for informed citizenship.', 3, false, 11),
    ('Understand Surveillance Laws', 'understand-surveillance-laws', (SELECT id FROM national_security_category), 'Know what surveillance government can legally conduct. Privacy rights for digital age citizenship.', 3, false, 12),
    ('Prepare for Natural Disasters', 'prepare-natural-disasters', (SELECT id FROM national_security_category), 'Plan for hurricanes, earthquakes, and other natural emergencies. Personal preparedness for community resilience.', 2, false, 13),
    ('Understand International Threats', 'understand-international-threats', (SELECT id FROM national_security_category), 'Know about global security challenges that affect domestic policy. Geopolitical awareness for informed voting.', 3, false, 14),
    ('Support Veterans', 'support-veterans', (SELECT id FROM national_security_category), 'Understand issues facing military veterans and how to help them access services. Community service for national service members.', 2, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM national_security_category) IS NOT NULL;

-- ====================
-- ENVIRONMENT CATEGORY SKILLS
-- ====================
WITH environment_category AS (SELECT id FROM categories WHERE name = 'Environment' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Research Environmental Issues', 'research-environmental-issues', (SELECT id FROM environment_category), 'Find reliable information about environmental problems and solutions. Great research skill for school projects and life decisions.', 2, true, 1),
    ('Calculate Environmental Impact', 'calculate-environmental-impact', (SELECT id FROM environment_category), 'Figure out the environmental cost of different choices. Useful for making better personal and family decisions.', 2, true, 2),
    ('Find Green Alternatives', 'find-green-alternatives', (SELECT id FROM environment_category), 'Research eco-friendly options for products, services, and lifestyles. Money-saving skill that helps the planet too.', 1, true, 3),
    ('Read Environmental Reports', 'read-environmental-reports', (SELECT id FROM environment_category), 'Understand government and scientific reports about environmental issues. Critical thinking skill for evaluating claims.', 3, false, 4),
    ('Track Local Environmental Issues', 'track-local-environmental-issues', (SELECT id FROM environment_category), 'Monitor environmental problems in your community. Helps you stay informed and get involved in solutions.', 2, false, 5),
    ('Understand Climate Data', 'understand-climate-data', (SELECT id FROM environment_category), 'Read charts and graphs about climate change and weather patterns. Data literacy skill useful everywhere.', 2, true, 6),
    ('Advocate for Environmental Policy', 'advocate-environmental-policy', (SELECT id FROM environment_category), 'Contact officials about environmental issues and support green policies. Practice persuasive communication.', 2, false, 7),
    ('Plan Sustainable Projects', 'plan-sustainable-projects', (SELECT id FROM environment_category), 'Design projects that help the environment while meeting other goals. Project management skill with purpose.', 3, false, 8),
    ('Evaluate Green Claims', 'evaluate-green-claims', (SELECT id FROM environment_category), 'Spot greenwashing and verify environmental claims by companies. Consumer protection skill that saves money.', 2, false, 9),
    ('Participate in Environmental Monitoring', 'participate-environmental-monitoring', (SELECT id FROM environment_category), 'Help track pollution, wildlife, or environmental changes in your area. Citizen science and data collection skills.', 2, false, 10),
    ('Calculate Carbon Footprint', 'calculate-carbon-footprint', (SELECT id FROM environment_category), 'Measure the environmental impact of your lifestyle choices. Math and analysis skills applied to real life.', 2, false, 11),
    ('Navigate Environmental Regulations', 'navigate-environmental-regulations', (SELECT id FROM environment_category), 'Understand environmental laws and how they affect you. Useful for homeowners, renters, and future business owners.', 3, false, 12),
    ('Organize Environmental Events', 'organize-environmental-events', (SELECT id FROM environment_category), 'Plan cleanups, awareness events, and green initiatives. Event planning and leadership skills with impact.', 3, false, 13),
    ('Use Environmental Apps and Tools', 'use-environmental-apps-tools', (SELECT id FROM environment_category), 'Use technology to track environmental impact and find sustainable options. Digital literacy for environmental action.', 1, false, 14),
    ('Communicate Environmental Science', 'communicate-environmental-science', (SELECT id FROM environment_category), 'Explain environmental issues clearly to different audiences. Science communication skill useful in many fields.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM environment_category) IS NOT NULL;

-- ====================
-- FOREIGN POLICY CATEGORY SKILLS
-- ====================
WITH foreign_policy_category AS (SELECT id FROM categories WHERE name = 'Foreign Policy' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Follow International News', 'follow-international-news', (SELECT id FROM foreign_policy_category), 'Stay informed about global events and how they affect your life. News literacy skill for understanding the world.', 2, true, 1),
    ('Understand Trade Impacts', 'understand-trade-impacts', (SELECT id FROM foreign_policy_category), 'See how international trade affects prices, jobs, and products you buy. Economics skill for smart consumer choices.', 2, true, 2),
    ('Research Other Countries', 'research-other-countries', (SELECT id FROM foreign_policy_category), 'Learn about other nations'' governments, cultures, and policies. Research skill useful for travel and business.', 2, true, 3),
    ('Spot International Misinformation', 'spot-international-misinformation', (SELECT id FROM foreign_policy_category), 'Recognize propaganda and false information about world events. Critical thinking skill for digital literacy.', 3, true, 4),
    ('Understand Immigration Policies', 'understand-immigration-policies', (SELECT id FROM foreign_policy_category), 'Know how immigration laws work and affect communities. Useful for understanding current events and helping others.', 2, false, 5),
    ('Follow Diplomatic Relations', 'follow-diplomatic-relations', (SELECT id FROM foreign_policy_category), 'Understand how countries interact and resolve conflicts. Conflict resolution skills applicable to any relationship.', 3, false, 6),
    ('Analyze International Agreements', 'analyze-international-agreements', (SELECT id FROM foreign_policy_category), 'Read and understand treaties, trade deals, and international commitments. Document analysis skill for any agreement.', 3, false, 7),
    ('Connect Global and Local Issues', 'connect-global-local-issues', (SELECT id FROM foreign_policy_category), 'See how international events affect your community. Systems thinking skill useful for problem-solving.', 3, false, 8),
    ('Use International Databases', 'use-international-databases', (SELECT id FROM foreign_policy_category), 'Find information from international organizations and foreign governments. Research skill for academic and professional work.', 2, false, 9),
    ('Understand Security Issues', 'understand-security-issues', (SELECT id FROM foreign_policy_category), 'Know how international conflicts and terrorism affect domestic policy. Risk assessment skill for personal safety.', 3, false, 10),
    ('Track Foreign Aid', 'track-foreign-aid', (SELECT id FROM foreign_policy_category), 'Follow how aid money is spent and whether it works. Accountability thinking applicable to any spending.', 3, false, 11),
    ('Evaluate Cultural Exchange', 'evaluate-cultural-exchange', (SELECT id FROM foreign_policy_category), 'Understand programs that bring people from different countries together. Cross-cultural communication skills.', 2, false, 12),
    ('Monitor Trade Wars', 'monitor-trade-wars', (SELECT id FROM foreign_policy_category), 'Understand how trade disputes affect prices and availability of goods. Economic analysis skill for financial planning.', 3, false, 13),
    ('Understand International Law', 'understand-international-law', (SELECT id FROM foreign_policy_category), 'Know how international rules work and when they matter. Legal thinking skill useful for any complex system.', 4, false, 14),
    ('Communicate Across Cultures', 'communicate-across-cultures', (SELECT id FROM foreign_policy_category), 'Work effectively with people from different countries and backgrounds. Essential skill for modern workplaces.', 2, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM foreign_policy_category) IS NOT NULL;

-- ====================
-- LOCAL ISSUES CATEGORY SKILLS
-- ====================
WITH local_issues_category AS (SELECT id FROM categories WHERE name = 'Local Issues' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Attend Local Government Meetings', 'attend-local-meetings', (SELECT id FROM local_issues_category), 'Show up to city council, school board, and planning meetings. Learn how decisions get made and practice civic participation.', 1, true, 1),
    ('Speak at Public Meetings', 'speak-at-public-meetings', (SELECT id FROM local_issues_category), 'Address local officials during public comment periods. Public speaking skill that builds confidence for any presentation.', 2, true, 2),
    ('Research Local Candidates', 'research-local-candidates', (SELECT id FROM local_issues_category), 'Find information about people running for local office. Research and evaluation skills for any leadership position.', 2, true, 3),
    ('Track Local Budget', 'track-local-budget', (SELECT id FROM local_issues_category), 'Follow how your city or county spends tax money. Budget analysis skill useful for personal and organizational finances.', 2, true, 4),
    ('Use Local Government Websites', 'use-local-government-websites', (SELECT id FROM local_issues_category), 'Navigate city and county websites to find information and services. Digital literacy for accessing resources.', 1, true, 5),
    ('Report Local Problems', 'report-local-problems', (SELECT id FROM local_issues_category), 'Use proper channels to report potholes, broken streetlights, and other issues. Problem-solving through appropriate systems.', 1, false, 6),
    ('Join Neighborhood Groups', 'join-neighborhood-groups', (SELECT id FROM local_issues_category), 'Participate in community organizations and neighborhood associations. Teamwork and networking skills.', 2, false, 7),
    ('Organize Petition Drives', 'organize-petition-drives', (SELECT id FROM local_issues_category), 'Collect signatures to put issues on ballots or get official attention. Project management and persuasion skills.', 3, false, 8),
    ('Navigate Local Permits', 'navigate-local-permits', (SELECT id FROM local_issues_category), 'Understand how to get permits for projects, events, and businesses. Bureaucracy navigation useful for adult life.', 2, false, 9),
    ('Monitor Local Development', 'monitor-local-development', (SELECT id FROM local_issues_category), 'Track construction projects, zoning changes, and development proposals. Research skill for protecting community interests.', 2, false, 10),
    ('Use Public Records', 'use-public-records', (SELECT id FROM local_issues_category), 'Access local government documents, meeting minutes, and public information. Research skill for transparency and accountability.', 2, false, 11),
    ('Plan Community Events', 'plan-community-events', (SELECT id FROM local_issues_category), 'Organize festivals, cleanups, and other community gatherings. Event planning and leadership skills.', 3, false, 12),
    ('Work with Local Media', 'work-with-local-media', (SELECT id FROM local_issues_category), 'Contact local news outlets to cover community issues. Media relations skill useful for any cause or business.', 2, false, 13),
    ('Understand Local Elections', 'understand-local-elections', (SELECT id FROM local_issues_category), 'Know when local elections happen and what positions are up for vote. Civic engagement skill for maximum impact.', 2, false, 14),
    ('Build Community Coalitions', 'build-community-coalitions', (SELECT id FROM local_issues_category), 'Unite different neighborhood groups around shared goals. Collaboration skill useful for any group project.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM local_issues_category) IS NOT NULL;

-- Continue with all remaining categories to reach 15+ skills each...

-- ====================
-- HISTORICAL PRECEDENT CATEGORY SKILLS
-- ====================
WITH historical_precedent_category AS (SELECT id FROM categories WHERE name = 'Historical Precedent' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Connect Past and Present', 'connect-past-present', (SELECT id FROM historical_precedent_category), 'See how historical events relate to current issues. Pattern recognition skill useful for predicting outcomes.', 2, true, 1),
    ('Research Historical Examples', 'research-historical-examples', (SELECT id FROM historical_precedent_category), 'Find past examples that help understand current problems. Research skill for making better decisions.', 2, true, 2),
    ('Learn from Past Mistakes', 'learn-from-past-mistakes', (SELECT id FROM historical_precedent_category), 'Study what went wrong before to avoid repeating errors. Critical thinking skill for personal and professional success.', 2, true, 3),
    ('Use Primary Sources', 'use-primary-sources', (SELECT id FROM historical_precedent_category), 'Read original documents and firsthand accounts from the past. Source analysis skill for getting accurate information.', 3, false, 4),
    ('Compare Different Time Periods', 'compare-time-periods', (SELECT id FROM historical_precedent_category), 'Analyze similarities and differences across historical eras. Comparison skill useful for evaluating options.', 3, false, 5),
    ('Understand Constitutional History', 'understand-constitutional-history', (SELECT id FROM historical_precedent_category), 'Know how the Constitution has been interpreted over time. Legal reasoning skill for understanding current rights.', 3, true, 6),
    ('Track Policy Outcomes', 'track-policy-outcomes', (SELECT id FROM historical_precedent_category), 'Follow what happened after past policy changes. Evaluation skill for judging current proposals.', 3, false, 7),
    ('Spot Historical Patterns', 'spot-historical-patterns', (SELECT id FROM historical_precedent_category), 'Recognize recurring themes and cycles in history. Pattern recognition for predicting trends in any field.', 3, false, 8),
    ('Evaluate Historical Claims', 'evaluate-historical-claims', (SELECT id FROM historical_precedent_category), 'Check whether statements about the past are accurate. Fact-checking skill for any information you encounter.', 2, false, 9),
    ('Use Historical Analogies', 'use-historical-analogies', (SELECT id FROM historical_precedent_category), 'Compare current situations to similar past events. Communication skill for explaining complex ideas.', 3, false, 10),
    ('Understand Cause and Effect', 'understand-cause-effect', (SELECT id FROM historical_precedent_category), 'See how past actions led to later consequences. Systems thinking skill for understanding any complex situation.', 2, false, 11),
    ('Research Family and Community History', 'research-family-community-history', (SELECT id FROM historical_precedent_category), 'Discover the history of your family and local area. Research skill that connects you to your community.', 2, false, 12),
    ('Understand Rights Evolution', 'understand-rights-evolution', (SELECT id FROM historical_precedent_category), 'See how civil rights have expanded over time. Historical perspective for current rights issues.', 3, false, 13),
    ('Analyze Historical Documents', 'analyze-historical-documents', (SELECT id FROM historical_precedent_category), 'Read and interpret old laws, speeches, and records. Document analysis skill for any formal text.', 3, false, 14),
    ('Learn from Other Countries', 'learn-from-other-countries', (SELECT id FROM historical_precedent_category), 'Study how other nations have handled similar challenges. Comparative analysis skill for global perspective.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM historical_precedent_category) IS NOT NULL;

-- ====================
-- ELECTORAL SYSTEMS CATEGORY SKILLS
-- ====================
WITH electoral_systems_category AS (SELECT id FROM categories WHERE name = 'Electoral Systems' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Understand Different Voting Methods', 'understand-voting-methods', (SELECT id FROM electoral_systems_category), 'Know how different voting systems work (ranked choice, plurality, etc.). Decision-making skill for group choices.', 2, true, 1),
    ('Calculate Election Outcomes', 'calculate-election-outcomes', (SELECT id FROM electoral_systems_category), 'Figure out how different voting systems produce different results. Math skill for understanding fairness.', 3, true, 2),
    ('Analyze Gerrymandering', 'analyze-gerrymandering', (SELECT id FROM electoral_systems_category), 'Recognize when district maps are drawn unfairly. Map reading and fairness analysis skills.', 3, true, 3),
    ('Track Campaign Finance', 'track-campaign-finance', (SELECT id FROM electoral_systems_category), 'Follow where political candidates get their money. Financial analysis skill for understanding influences.', 2, true, 4),
    ('Understand Voter Registration', 'understand-voter-registration', (SELECT id FROM electoral_systems_category), 'Know how to register to vote and help others do the same. Administrative skill for navigating bureaucracy.', 1, true, 5),
    ('Monitor Election Security', 'monitor-election-security', (SELECT id FROM electoral_systems_category), 'Understand how elections are protected from fraud and interference. Security thinking for any important process.', 3, false, 6),
    ('Compare International Elections', 'compare-international-elections', (SELECT id FROM electoral_systems_category), 'See how other countries run their elections differently. Comparative analysis for understanding options.', 3, false, 7),
    ('Understand Electoral College', 'understand-electoral-college', (SELECT id FROM electoral_systems_category), 'Know how the Electoral College works and affects presidential elections. Systems thinking for complex processes.', 2, false, 8),
    ('Track Polling Data', 'track-polling-data', (SELECT id FROM electoral_systems_category), 'Read and evaluate political polls and their accuracy. Statistics skill for understanding survey data.', 3, false, 9),
    ('Understand Primary Elections', 'understand-primary-elections', (SELECT id FROM electoral_systems_category), 'Know how parties choose their candidates before general elections. Process understanding for sequential decision-making.', 2, false, 10),
    ('Analyze Turnout Patterns', 'analyze-turnout-patterns', (SELECT id FROM electoral_systems_category), 'See which groups vote more or less and why. Data analysis skill for understanding participation.', 3, false, 11),
    ('Understand Ballot Access', 'understand-ballot-access', (SELECT id FROM electoral_systems_category), 'Know what it takes for candidates to get on the ballot. Process understanding for overcoming barriers.', 2, false, 12),
    ('Monitor Vote Counting', 'monitor-vote-counting', (SELECT id FROM electoral_systems_category), 'Understand how votes are counted and verified. Quality control thinking for any important process.', 2, false, 13),
    ('Evaluate Election Reforms', 'evaluate-election-reforms', (SELECT id FROM electoral_systems_category), 'Analyze proposals to change voting systems. Policy evaluation skill for any proposed change.', 3, false, 14),
    ('Understand Redistricting', 'understand-redistricting', (SELECT id FROM electoral_systems_category), 'Know how electoral districts are drawn and redrawn. Geographic and political analysis skills.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM electoral_systems_category) IS NOT NULL;

-- ====================
-- LEGISLATIVE PROCESS CATEGORY SKILLS
-- ====================
WITH legislative_process_category AS (SELECT id FROM categories WHERE name = 'Legislative Process' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Track How Bills Become Laws', 'track-bills-become-laws', (SELECT id FROM legislative_process_category), 'Follow legislation from introduction to passage. Process understanding for any multi-step approval system.', 2, true, 1),
    ('Read Proposed Legislation', 'read-proposed-legislation', (SELECT id FROM legislative_process_category), 'Understand what bills actually say beyond news headlines. Document analysis skill for any legal text.', 3, true, 2),
    ('Contact Legislators', 'contact-legislators', (SELECT id FROM legislative_process_category), 'Communicate effectively with your representatives about bills. Professional communication skill for influencing decisions.', 2, true, 3),
    ('Track Committee Actions', 'track-committee-actions', (SELECT id FROM legislative_process_category), 'Follow what happens to bills in legislative committees. Process monitoring for any organizational decision-making.', 2, false, 4),
    ('Understand Legislative Calendars', 'understand-legislative-calendars', (SELECT id FROM legislative_process_category), 'Know when legislatures meet and vote on bills. Time management skill for planning advocacy efforts.', 2, false, 5),
    ('Analyze Voting Records', 'analyze-voting-records', (SELECT id FROM legislative_process_category), 'Research how your representatives vote on different issues. Performance evaluation skill for any leader.', 2, true, 6),
    ('Write to Legislators', 'write-to-legislators', (SELECT id FROM legislative_process_category), 'Compose effective letters and emails to elected officials. Professional writing skill for formal communication.', 2, false, 7),
    ('Attend Legislative Hearings', 'attend-legislative-hearings', (SELECT id FROM legislative_process_category), 'Observe committee hearings and public testimony. Active learning skill for understanding complex issues.', 2, false, 8),
    ('Understand Budget Process', 'understand-budget-process', (SELECT id FROM legislative_process_category), 'Know how government budgets are created and approved. Financial planning skill for any organization.', 3, false, 9),
    ('Track Bill Amendments', 'track-bill-amendments', (SELECT id FROM legislative_process_category), 'Follow how bills change as they move through the process. Change management skill for any evolving project.', 3, false, 10),
    ('Understand Legislative Rules', 'understand-legislative-rules', (SELECT id FROM legislative_process_category), 'Know the procedures that govern how legislatures operate. Procedural knowledge for any formal organization.', 3, false, 11),
    ('Organize Legislative Advocacy', 'organize-legislative-advocacy', (SELECT id FROM legislative_process_category), 'Coordinate group efforts to influence legislation. Campaign planning skill for any advocacy effort.', 3, false, 12),
    ('Monitor Implementation', 'monitor-implementation', (SELECT id FROM legislative_process_category), 'Track whether agencies actually carry out laws as intended. Accountability skill for any project follow-through.', 3, false, 13),
    ('Use Legislative Databases', 'use-legislative-databases', (SELECT id FROM legislative_process_category), 'Navigate government websites to find bills and voting records. Research skill for accessing public information.', 2, false, 14),
    ('Understand Override Process', 'understand-override-process', (SELECT id FROM legislative_process_category), 'Know how legislatures can override executive vetoes. Power dynamics understanding for any organizational conflict.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM legislative_process_category) IS NOT NULL;

-- ====================
-- JUDICIAL REVIEW CATEGORY SKILLS
-- ====================
WITH judicial_review_category AS (SELECT id FROM categories WHERE name = 'Judicial Review' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Understand How Courts Work', 'understand-how-courts-work', (SELECT id FROM judicial_review_category), 'Know the basics of how different courts operate. Useful for any legal situation you might face.', 2, true, 1),
    ('Read Court Decisions', 'read-court-decisions', (SELECT id FROM judicial_review_category), 'Understand what court rulings actually say and mean. Document analysis skill for any complex decision.', 3, true, 2),
    ('Understand Your Legal Rights', 'understand-legal-rights', (SELECT id FROM judicial_review_category), 'Know what legal protections you have in different situations. Self-protection skill for navigating adult life.', 2, true, 3),
    ('Follow Supreme Court Cases', 'follow-supreme-court-cases', (SELECT id FROM judicial_review_category), 'Track major cases that affect constitutional rights. News literacy for understanding legal developments.', 2, true, 4),
    ('Research Legal Precedents', 'research-legal-precedents', (SELECT id FROM judicial_review_category), 'Find past court decisions that relate to current issues. Research skill for understanding patterns and outcomes.', 3, false, 5),
    ('Understand Appeals Process', 'understand-appeals-process', (SELECT id FROM judicial_review_category), 'Know how legal decisions can be challenged at higher court levels. Problem-solving through proper channels.', 3, false, 6),
    ('Distinguish Federal and State Courts', 'distinguish-federal-state-courts', (SELECT id FROM judicial_review_category), 'Know which courts handle different types of cases. System navigation for any legal issue.', 2, false, 7),
    ('Understand Judicial Nominations', 'understand-judicial-nominations', (SELECT id FROM judicial_review_category), 'Know how judges are selected and why it matters. Evaluation skill for understanding institutional power.', 3, false, 8),
    ('Monitor Court Decisions', 'monitor-court-decisions', (SELECT id FROM judicial_review_category), 'Track how court rulings affect laws and policies. Impact analysis for understanding systemic change.', 3, false, 9),
    ('Understand Constitutional Review', 'understand-constitutional-review', (SELECT id FROM judicial_review_category), 'Know how courts decide if laws violate the Constitution. Legal reasoning skill for understanding rights.', 3, false, 10),
    ('Recognize Bias in Courts', 'recognize-bias-in-courts', (SELECT id FROM judicial_review_category), 'Spot when judicial decisions seem influenced by politics. Critical thinking for evaluating any authority.', 3, false, 11),
    ('Use Legal Databases', 'use-legal-databases', (SELECT id FROM judicial_review_category), 'Find court decisions and legal information online. Research skill for accessing authoritative sources.', 2, false, 12),
    ('Understand Jury Duty', 'understand-jury-duty', (SELECT id FROM judicial_review_category), 'Know your role and responsibilities as a juror. Civic duty and decision-making skill for community service.', 2, false, 13),
    ('Track Judicial Ethics', 'track-judicial-ethics', (SELECT id FROM judicial_review_category), 'Monitor whether judges follow ethical rules and recuse appropriately. Accountability thinking for any leadership role.', 3, false, 14),
    ('Understand Court Procedures', 'understand-court-procedures', (SELECT id FROM judicial_review_category), 'Know what happens in different types of court proceedings. Process understanding for any formal procedure.', 2, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM judicial_review_category) IS NOT NULL;

-- ====================
-- POLICY ANALYSIS CATEGORY SKILLS
-- ====================
WITH policy_analysis_category AS (SELECT id FROM categories WHERE name = 'Policy Analysis' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Break Down Complex Policies', 'break-down-complex-policies', (SELECT id FROM policy_analysis_category), 'Simplify complicated policies to understand what they really do. Analysis skill for any complex system or plan.', 3, true, 1),
    ('Identify Policy Winners and Losers', 'identify-policy-winners-losers', (SELECT id FROM policy_analysis_category), 'Figure out who benefits and who gets hurt by policy changes. Stakeholder analysis for any major decision.', 3, true, 2),
    ('Compare Policy Options', 'compare-policy-options', (SELECT id FROM policy_analysis_category), 'Evaluate different approaches to solving the same problem. Decision-making skill for choosing between alternatives.', 3, true, 3),
    ('Predict Policy Outcomes', 'predict-policy-outcomes', (SELECT id FROM policy_analysis_category), 'Estimate what will happen if policies are implemented. Forecasting skill for planning any major change.', 4, false, 4),
    ('Calculate Policy Costs', 'calculate-policy-costs', (SELECT id FROM policy_analysis_category), 'Figure out how much policies will cost taxpayers. Financial analysis skill for budgeting and planning.', 3, true, 5),
    ('Track Implementation Problems', 'track-implementation-problems', (SELECT id FROM policy_analysis_category), 'Monitor what goes wrong when policies are put into practice. Quality control thinking for any project.', 3, false, 6),
    ('Evaluate Policy Evidence', 'evaluate-policy-evidence', (SELECT id FROM policy_analysis_category), 'Judge whether research supports policy claims. Critical thinking for evaluating any evidence-based argument.', 3, false, 7),
    ('Understand Unintended Consequences', 'understand-unintended-consequences', (SELECT id FROM policy_analysis_category), 'Spot unexpected results that policies might cause. Risk assessment skill for any major decision.', 3, false, 8),
    ('Map Policy Stakeholders', 'map-policy-stakeholders', (SELECT id FROM policy_analysis_category), 'Identify all groups affected by policy changes. Stakeholder analysis for any organizational change.', 3, false, 9),
    ('Research Policy Alternatives', 'research-policy-alternatives', (SELECT id FROM policy_analysis_category), 'Find different ways other places have solved similar problems. Benchmarking skill for improvement efforts.', 3, false, 10),
    ('Analyze Policy Timing', 'analyze-policy-timing', (SELECT id FROM policy_analysis_category), 'Understand why policies are proposed when they are. Strategic thinking for understanding political motivation.', 3, false, 11),
    ('Evaluate Policy Effectiveness', 'evaluate-policy-effectiveness', (SELECT id FROM policy_analysis_category), 'Measure whether policies actually solve the problems they target. Performance evaluation for any intervention.', 4, false, 12),
    ('Understand Policy Trade-offs', 'understand-policy-trade-offs', (SELECT id FROM policy_analysis_category), 'Recognize that every policy choice involves giving something up. Decision-making skill for balancing competing priorities.', 3, false, 13),
    ('Communicate Policy Analysis', 'communicate-policy-analysis', (SELECT id FROM policy_analysis_category), 'Explain policy analysis clearly to different audiences. Communication skill for presenting complex information.', 3, false, 14),
    ('Use Policy Analysis Tools', 'use-policy-analysis-tools', (SELECT id FROM policy_analysis_category), 'Apply systematic frameworks to evaluate any policy proposal. Analytical thinking for structured decision-making.', 4, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM policy_analysis_category) IS NOT NULL;

-- ====================
-- CIVIC PARTICIPATION CATEGORY SKILLS
-- ====================
WITH civic_participation_category AS (SELECT id FROM categories WHERE name = 'Civic Participation' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Vote in All Elections', 'vote-all-elections', (SELECT id FROM civic_participation_category), 'Show up for federal, state, and local elections. Participation skill for having your voice heard.', 1, true, 1),
    ('Volunteer for Campaigns', 'volunteer-campaigns', (SELECT id FROM civic_participation_category), 'Help candidates and causes you support. Teamwork and advocacy skills for any cause you care about.', 2, true, 2),
    ('Join Community Organizations', 'join-community-organizations', (SELECT id FROM civic_participation_category), 'Participate in groups working on issues you care about. Networking and collaboration skills.', 2, true, 3),
    ('Attend Town Halls', 'attend-town-halls', (SELECT id FROM civic_participation_category), 'Show up to meetings where officials answer questions from the public. Public engagement skill for accountability.', 2, true, 4),
    ('Write Letters to Editors', 'write-letters-editors', (SELECT id FROM civic_participation_category), 'Submit your opinions to newspapers and websites. Public writing skill for sharing your ideas.', 2, false, 5),
    ('Start Petitions', 'start-petitions', (SELECT id FROM civic_participation_category), 'Organize signature drives to get issues on agendas. Initiative-taking skill for creating change.', 2, false, 6),
    ('Attend Protests and Rallies', 'attend-protests-rallies', (SELECT id FROM civic_participation_category), 'Participate safely in public demonstrations. Collective action skill for expressing shared values.', 2, false, 7),
    ('Serve on Juries', 'serve-on-juries', (SELECT id FROM civic_participation_category), 'Fulfill your civic duty and help ensure fair trials. Decision-making skill for evaluating evidence.', 2, false, 8),
    ('Run for Office', 'run-for-office', (SELECT id FROM civic_participation_category), 'Consider seeking elected positions to create change. Leadership skill for taking responsibility.', 4, false, 9),
    ('Volunteer for Nonprofits', 'volunteer-nonprofits', (SELECT id FROM civic_participation_category), 'Give time to organizations solving community problems. Service skill for making a difference.', 1, false, 10),
    ('Participate in Candidate Forums', 'participate-candidate-forums', (SELECT id FROM civic_participation_category), 'Attend events where candidates answer questions. Evaluation skill for judging leaders.', 2, false, 11),
    ('Join Boards and Commissions', 'join-boards-commissions', (SELECT id FROM civic_participation_category), 'Serve on official bodies that advise government. Leadership skill for institutional involvement.', 3, false, 12),
    ('Organize Community Events', 'organize-community-events', (SELECT id FROM civic_participation_category), 'Plan gatherings that bring neighbors together. Event planning and leadership skills.', 3, false, 13),
    ('Register Others to Vote', 'register-others-vote', (SELECT id FROM civic_participation_category), 'Help friends and neighbors get registered to vote. Service skill for expanding participation.', 2, false, 14),
    ('Monitor Government Meetings', 'monitor-government-meetings', (SELECT id FROM civic_participation_category), 'Watch local government in action and report to others. Accountability skill for transparency.', 2, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM civic_participation_category) IS NOT NULL;

-- ====================
-- IMMIGRATION CATEGORY SKILLS
-- ====================
WITH immigration_category AS (SELECT id FROM categories WHERE name = 'Immigration' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Understand Immigration Basics', 'understand-immigration-basics', (SELECT id FROM immigration_category), 'Know the different ways people can legally come to the U.S. Useful for helping others and understanding news.', 2, true, 1),
    ('Navigate Immigration Services', 'navigate-immigration-services', (SELECT id FROM immigration_category), 'Help people access immigration help and services. Service navigation skill for any complex bureaucracy.', 2, true, 2),
    ('Understand Immigration Impact', 'understand-immigration-impact', (SELECT id FROM immigration_category), 'Know how immigration affects communities and the economy. Economic analysis for understanding policy debates.', 3, true, 3),
    ('Spot Immigration Misinformation', 'spot-immigration-misinformation', (SELECT id FROM immigration_category), 'Recognize false claims about immigration and immigrants. Critical thinking for evaluating emotionally charged topics.', 2, true, 4),
    ('Research Immigration Law', 'research-immigration-law', (SELECT id FROM immigration_category), 'Find accurate information about immigration rules and processes. Legal research skill for complex regulations.', 3, false, 5),
    ('Help Immigrants Access Services', 'help-immigrants-access-services', (SELECT id FROM immigration_category), 'Connect immigrants with legal help, education, and community resources. Service coordination skill.', 2, false, 6),
    ('Understand Refugee Process', 'understand-refugee-process', (SELECT id FROM immigration_category), 'Know how refugee resettlement works and how to help. Humanitarian assistance and cultural competency skills.', 3, false, 7),
    ('Track Immigration Policy Changes', 'track-immigration-policy-changes', (SELECT id FROM immigration_category), 'Follow how immigration laws and enforcement change over time. Policy monitoring for regulatory compliance.', 3, false, 8),
    ('Understand Citizenship Process', 'understand-citizenship-process', (SELECT id FROM immigration_category), 'Know what it takes to become a U.S. citizen. Process understanding for helping others achieve goals.', 2, false, 9),
    ('Support Immigrant Communities', 'support-immigrant-communities', (SELECT id FROM immigration_category), 'Volunteer with organizations helping new Americans integrate. Cross-cultural communication and service skills.', 2, false, 10),
    ('Understand DACA and Immigration Relief', 'understand-daca-immigration-relief', (SELECT id FROM immigration_category), 'Know about protections for people brought to the U.S. as children. Legal knowledge for advocacy and support.', 3, false, 11),
    ('Navigate English Learning Resources', 'navigate-english-learning-resources', (SELECT id FROM immigration_category), 'Find and recommend English classes and learning tools. Educational resource navigation.', 2, false, 12),
    ('Understand Immigration Courts', 'understand-immigration-courts', (SELECT id FROM immigration_category), 'Know how immigration legal proceedings work. Legal system understanding for advocacy and support.', 3, false, 13),
    ('Connect Immigrants to Legal Help', 'connect-immigrants-legal-help', (SELECT id FROM immigration_category), 'Find trustworthy immigration lawyers and legal aid. Resource networking for vulnerable populations.', 2, false, 14),
    ('Understand Border and Enforcement', 'understand-border-enforcement', (SELECT id FROM immigration_category), 'Know how immigration enforcement works and affects communities. Security and civil rights balance understanding.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM immigration_category) IS NOT NULL;

-- ====================
-- AI GOVERNANCE CATEGORY SKILLS
-- ====================
WITH ai_governance_category AS (SELECT id FROM categories WHERE name = 'AI Governance' LIMIT 1)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Understand AI Impact on Jobs', 'understand-ai-impact-jobs', (SELECT id FROM ai_governance_category), 'Know how AI might affect different careers and plan accordingly. Career planning skill for changing economy.', 2, true, 1),
    ('Spot AI-Generated Content', 'spot-ai-generated-content', (SELECT id FROM ai_governance_category), 'Recognize when text, images, or videos are created by AI. Media literacy for digital authenticity.', 2, true, 2),
    ('Understand AI Privacy Issues', 'understand-ai-privacy-issues', (SELECT id FROM ai_governance_category), 'Know how AI systems collect and use your personal data. Privacy protection skill for digital safety.', 2, true, 3),
    ('Evaluate AI Fairness', 'evaluate-ai-fairness', (SELECT id FROM ai_governance_category), 'Recognize when AI systems treat different groups unfairly. Bias detection skill for algorithmic accountability.', 3, true, 4),
    ('Use AI Tools Responsibly', 'use-ai-tools-responsibly', (SELECT id FROM ai_governance_category), 'Apply AI tools like ChatGPT appropriately for school and work. Digital citizenship for emerging technology.', 2, true, 5),
    ('Understand AI Regulation Debates', 'understand-ai-regulation-debates', (SELECT id FROM ai_governance_category), 'Follow policy discussions about how to govern AI development. Technology policy literacy for informed citizenship.', 3, false, 6),
    ('Protect Against AI Manipulation', 'protect-against-ai-manipulation', (SELECT id FROM ai_governance_category), 'Avoid being manipulated by AI-powered advertising and recommendations. Consumer protection in digital economy.', 2, false, 7),
    ('Understand AI in Government', 'understand-ai-in-government', (SELECT id FROM ai_governance_category), 'Know how government agencies use AI and its implications. Algorithmic accountability for public services.', 3, false, 8),
    ('Evaluate AI Research Claims', 'evaluate-ai-research-claims', (SELECT id FROM ai_governance_category), 'Judge whether claims about AI capabilities are accurate. Scientific literacy for technology assessment.', 3, false, 9),
    ('Understand AI and Democracy', 'understand-ai-democracy', (SELECT id FROM ai_governance_category), 'Know how AI affects elections, free speech, and democratic participation. Civic engagement in digital age.', 3, false, 10),
    ('Track AI Development', 'track-ai-development', (SELECT id FROM ai_governance_category), 'Follow major advances in AI and their potential impacts. Technology trend analysis for future planning.', 3, false, 11),
    ('Understand AI Ethics', 'understand-ai-ethics', (SELECT id FROM ai_governance_category), 'Know the ethical questions raised by AI development and use. Moral reasoning for technology decisions.', 3, false, 12),
    ('Participate in AI Policy', 'participate-in-ai-policy', (SELECT id FROM ai_governance_category), 'Engage in public discussions about AI regulation and governance. Technology advocacy for democratic input.', 3, false, 13),
    ('Understand AI International Relations', 'understand-ai-international-relations', (SELECT id FROM ai_governance_category), 'Know how AI affects competition between countries. Geopolitical analysis for technology policy.', 4, false, 14),
    ('Use AI for Civic Engagement', 'use-ai-for-civic-engagement', (SELECT id FROM ai_governance_category), 'Apply AI tools to research issues and participate more effectively in democracy. Digital tools for civic participation.', 3, false, 15)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM ai_governance_category) IS NOT NULL;

-- ====================
-- Add sample skill prerequisites (simple progressions)
-- ====================
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    s1.id as skill_id,
    s2.id as prerequisite_skill_id,
    'beginner' as required_mastery_level,
    false as is_strict_requirement
FROM skills s1, skills s2 
WHERE s1.skill_slug = 'write-public-comments' AND s2.skill_slug = 'analyze-policy-changes'

UNION ALL

SELECT s1.id, s2.id, 'beginner', false
FROM skills s1, skills s2 
WHERE s1.skill_slug = 'organize-for-change' AND s2.skill_slug = 'communicate-message'

UNION ALL

SELECT s1.id, s2.id, 'beginner', false
FROM skills s1, skills s2 
WHERE s1.skill_slug = 'spot-bias' AND s2.skill_slug = 'check-sources';

-- ====================
-- Add sample learning objectives
-- ====================
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT id, 'Find and verify basic information about government spending and budgets', 'knowledge', 'beginner', 1
FROM skills WHERE skill_slug = 'read-budgets'

UNION ALL

SELECT id, 'Identify trustworthy vs untrustworthy news sources', 'application', 'beginner', 1
FROM skills WHERE skill_slug = 'check-sources'

UNION ALL

SELECT id, 'Look up your representatives and contact them about an issue', 'application', 'intermediate', 1
FROM skills WHERE skill_slug = 'contact-representatives';

-- Add updated_at trigger for new tables if not already exists
-- (Assumes the update_updated_at_column function exists from the main migration)