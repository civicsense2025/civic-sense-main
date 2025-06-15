-- CivicSense COMPREHENSIVE Skill Relationships and Learning Objectives Seed
-- Philosophy: Build foundational skills first, "understand" skills are capstone achievements
-- Focus: Create logical learning progressions and concrete, measurable objectives for ALL 315+ skills
-- Coverage: All 21 categories with complete prerequisite chains and learning objectives

-- ====================
-- COMPREHENSIVE SKILL PREREQUISITES SEED
-- Building complete learning progressions for all skills
-- ====================

-- FOUNDATION: Information Literacy Prerequisites (these enable everything else)
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    dependent.id as skill_id,
    prereq.id as prerequisite_skill_id,
    'beginner' as required_mastery_level,
    true as is_strict_requirement
FROM skills dependent, skills prereq 
WHERE (
    -- Reading charts/stats is needed for economic analysis
    (dependent.skill_slug = 'read-economic-news' AND prereq.skill_slug = 'read-charts-stats') OR
    (dependent.skill_slug = 'track-government-spending' AND prereq.skill_slug = 'read-charts-stats') OR
    (dependent.skill_slug = 'track-policy-results' AND prereq.skill_slug = 'read-charts-stats') OR
    
    -- Source verification is foundational for all research
    (dependent.skill_slug = 'research-candidates' AND prereq.skill_slug = 'check-sources') OR
    (dependent.skill_slug = 'research-laws' AND prereq.skill_slug = 'check-sources') OR
    (dependent.skill_slug = 'research-environmental-issues' AND prereq.skill_slug = 'check-sources') OR
    (dependent.skill_slug = 'research-other-countries' AND prereq.skill_slug = 'check-sources') OR
    (dependent.skill_slug = 'research-local-candidates' AND prereq.skill_slug = 'check-sources') OR
    
    -- Fact-checking builds on source verification
    (dependent.skill_slug = 'spot-bias' AND prereq.skill_slug = 'fact-check-claims') OR
    (dependent.skill_slug = 'spot-campaign-tricks' AND prereq.skill_slug = 'fact-check-claims') OR
    (dependent.skill_slug = 'spot-economic-bs' AND prereq.skill_slug = 'fact-check-claims') OR
    (dependent.skill_slug = 'combat-immigration-misinformation' AND prereq.skill_slug = 'fact-check-claims') OR
    (dependent.skill_slug = 'combat-election-misinformation' AND prereq.skill_slug = 'fact-check-claims') OR
    
    -- Finding public info is needed for government research
    (dependent.skill_slug = 'read-budgets' AND prereq.skill_slug = 'find-public-info') OR
    (dependent.skill_slug = 'track-spending' AND prereq.skill_slug = 'find-public-info') OR
    (dependent.skill_slug = 'track-local-budget' AND prereq.skill_slug = 'find-public-info') OR
    (dependent.skill_slug = 'use-public-records' AND prereq.skill_slug = 'find-public-info')
);

-- INTERMEDIATE: Building on foundational skills
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    dependent.id as skill_id,
    prereq.id as prerequisite_skill_id,
    'beginner' as required_mastery_level,
    false as is_strict_requirement
FROM skills dependent, skills prereq 
WHERE (
    -- Budget reading enables spending analysis
    (dependent.skill_slug = 'track-spending' AND prereq.skill_slug = 'read-budgets') OR
    (dependent.skill_slug = 'track-government-spending' AND prereq.skill_slug = 'read-budgets') OR
    (dependent.skill_slug = 'track-local-budget' AND prereq.skill_slug = 'read-budgets') OR
    (dependent.skill_slug = 'understand-policy-funding' AND prereq.skill_slug = 'read-budgets') OR
    
    -- Contact skills enable civic participation
    (dependent.skill_slug = 'write-public-comments' AND prereq.skill_slug = 'contact-representatives') OR
    (dependent.skill_slug = 'lobby-elected-officials' AND prereq.skill_slug = 'contact-representatives') OR
    (dependent.skill_slug = 'write-to-legislators' AND prereq.skill_slug = 'contact-representatives') OR
    
    -- Research enables understanding ballot
    (dependent.skill_slug = 'understand-ballot' AND prereq.skill_slug = 'research-candidates') OR
    (dependent.skill_slug = 'understand-local-elections' AND prereq.skill_slug = 'research-local-candidates') OR
    
    -- Legal research enables rights knowledge
    (dependent.skill_slug = 'know-your-rights' AND prereq.skill_slug = 'research-laws') OR
    (dependent.skill_slug = 'understand-workplace-rights' AND prereq.skill_slug = 'research-laws') OR
    (dependent.skill_slug = 'understand-housing-rights' AND prereq.skill_slug = 'research-laws') OR
    
    -- Documentation enables complaint filing
    (dependent.skill_slug = 'file-complaints' AND prereq.skill_slug = 'document-problems') OR
    
    -- Meeting attendance enables speaking at meetings
    (dependent.skill_slug = 'speak-at-public-meetings' AND prereq.skill_slug = 'attend-local-meetings') OR
    (dependent.skill_slug = 'speak-at-public-meetings' AND prereq.skill_slug = 'attend-meetings')
);

-- ADVANCED: "Understand" skills as capstone achievements
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    dependent.id as skill_id,
    prereq.id as prerequisite_skill_id,
    'intermediate' as required_mastery_level,
    false as is_strict_requirement
FROM skills dependent, skills prereq 
WHERE (
    -- Understanding government structure requires multiple government skills
    (dependent.skill_slug = 'understand-government-structure' AND prereq.skill_slug = 'contact-representatives') OR
    (dependent.skill_slug = 'understand-government-structure' AND prereq.skill_slug = 'find-public-info') OR
    (dependent.skill_slug = 'understand-government-structure' AND prereq.skill_slug = 'attend-meetings') OR
    
    -- Understanding election systems requires election experience
    (dependent.skill_slug = 'understand-voting-methods' AND prereq.skill_slug = 'register-vote') OR
    (dependent.skill_slug = 'understand-voting-methods' AND prereq.skill_slug = 'understand-ballot') OR
    (dependent.skill_slug = 'understand-electoral-college' AND prereq.skill_slug = 'understand-voting-methods') OR
    (dependent.skill_slug = 'understand-primary-elections' AND prereq.skill_slug = 'research-candidates') OR
    
    -- Understanding economics requires multiple economic skills
    (dependent.skill_slug = 'understand-inflation' AND prereq.skill_slug = 'read-economic-news') OR
    (dependent.skill_slug = 'understand-federal-reserve' AND prereq.skill_slug = 'understand-inflation') OR
    (dependent.skill_slug = 'understand-economic-cycles' AND prereq.skill_slug = 'track-economic-indicators') OR
    
    -- Understanding constitutional law requires legal foundation
    (dependent.skill_slug = 'understand-checks-balances' AND prereq.skill_slug = 'use-constitutional-rights') OR
    (dependent.skill_slug = 'understand-federal-vs-state' AND prereq.skill_slug = 'understand-checks-balances') OR
    (dependent.skill_slug = 'understand-first-amendment' AND prereq.skill_slug = 'use-constitutional-rights') OR
    (dependent.skill_slug = 'understand-fourth-amendment' AND prereq.skill_slug = 'use-constitutional-rights') OR
    (dependent.skill_slug = 'understand-equal-protection' AND prereq.skill_slug = 'recognize-discrimination') OR
    
    -- Understanding policy requires analysis skills
    (dependent.skill_slug = 'understand-policy-process' AND prereq.skill_slug = 'analyze-policy-changes') OR
    (dependent.skill_slug = 'understand-regulatory-process' AND prereq.skill_slug = 'understand-policy-process') OR
    
    -- Understanding courts requires legal literacy
    (dependent.skill_slug = 'understand-how-courts-work' AND prereq.skill_slug = 'understand-legal-rights') OR
    (dependent.skill_slug = 'understand-appeals-process' AND prereq.skill_slug = 'understand-how-courts-work') OR
    (dependent.skill_slug = 'understand-constitutional-review' AND prereq.skill_slug = 'read-court-decisions') OR
    
    -- Understanding AI governance requires tech literacy
    (dependent.skill_slug = 'understand-ai-government' AND prereq.skill_slug = 'understand-ai-daily-life') OR
    (dependent.skill_slug = 'understand-ai-democracy' AND prereq.skill_slug = 'spot-ai-generated-content') OR
    (dependent.skill_slug = 'understand-ai-regulation-debates' AND prereq.skill_slug = 'evaluate-ai-research-claims')
);

-- COMPLEX PROGRESSIONS: Multi-skill prerequisites for advanced understanding
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    dependent.id as skill_id,
    prereq.id as prerequisite_skill_id,
    'intermediate' as required_mastery_level,
    true as is_strict_requirement
FROM skills dependent, skills prereq 
WHERE (
    -- CIVIC ACTION: Organizing for change requires multiple civic skills
    (dependent.skill_slug = 'organize-for-change' AND prereq.skill_slug = 'communicate-message') OR
    (dependent.skill_slug = 'organize-for-change' AND prereq.skill_slug = 'build-coalitions') OR
    (dependent.skill_slug = 'plan-campaigns' AND prereq.skill_slug = 'organize-for-change') OR
    (dependent.skill_slug = 'run-for-office' AND prereq.skill_slug = 'plan-campaigns') OR
    (dependent.skill_slug = 'run-for-office' AND prereq.skill_slug = 'speak-at-public-meetings') OR
    (dependent.skill_slug = 'run-for-office' AND prereq.skill_slug = 'track-campaign-finance') OR
    
    -- POLICY ANALYSIS: Advanced analysis requires foundational skills
    (dependent.skill_slug = 'break-down-complex-policies' AND prereq.skill_slug = 'analyze-policy-changes') OR
    (dependent.skill_slug = 'identify-policy-winners-losers' AND prereq.skill_slug = 'break-down-complex-policies') OR
    (dependent.skill_slug = 'predict-policy-outcomes' AND prereq.skill_slug = 'compare-policy-options') OR
    (dependent.skill_slug = 'evaluate-policy-effectiveness' AND prereq.skill_slug = 'track-implementation-problems') OR
    
    -- JUDICIAL REVIEW: Court understanding requires legal foundation
    (dependent.skill_slug = 'read-court-decisions' AND prereq.skill_slug = 'understand-how-courts-work') OR
    (dependent.skill_slug = 'follow-supreme-court-cases' AND prereq.skill_slug = 'read-court-decisions') OR
    (dependent.skill_slug = 'understand-constitutional-review' AND prereq.skill_slug = 'follow-supreme-court-cases') OR
    
    -- IMMIGRATION: Complex immigration skills require basic understanding
    (dependent.skill_slug = 'navigate-immigration-services' AND prereq.skill_slug = 'understand-immigration-basics') OR
    (dependent.skill_slug = 'understand-immigration-impact' AND prereq.skill_slug = 'understand-immigration-basics') OR
    (dependent.skill_slug = 'advocate-immigration-reform' AND prereq.skill_slug = 'understand-immigration-impact') OR
    
    -- NATIONAL SECURITY: Advanced security understanding requires basics
    (dependent.skill_slug = 'balance-security-freedom' AND prereq.skill_slug = 'assess-risks') OR
    (dependent.skill_slug = 'understand-surveillance-laws' AND prereq.skill_slug = 'protect-information') OR
    (dependent.skill_slug = 'understand-international-threats' AND prereq.skill_slug = 'understand-intelligence')
);

-- ====================
-- ADDITIONAL COMPREHENSIVE PREREQUISITES
-- Covering all remaining categories and skills
-- ====================

-- ENVIRONMENT: Environmental skills build on research foundation
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    dependent.id as skill_id,
    prereq.id as prerequisite_skill_id,
    'beginner' as required_mastery_level,
    false as is_strict_requirement
FROM skills dependent, skills prereq 
WHERE (
    (dependent.skill_slug = 'calculate-environmental-impact' AND prereq.skill_slug = 'research-environmental-issues') OR
    (dependent.skill_slug = 'find-green-alternatives' AND prereq.skill_slug = 'research-environmental-issues') OR
    (dependent.skill_slug = 'understand-climate-data' AND prereq.skill_slug = 'read-charts-stats') OR
    (dependent.skill_slug = 'evaluate-green-claims' AND prereq.skill_slug = 'fact-check-claims') OR
    (dependent.skill_slug = 'calculate-carbon-footprint' AND prereq.skill_slug = 'calculate-environmental-impact') OR
    (dependent.skill_slug = 'plan-sustainable-projects' AND prereq.skill_slug = 'find-green-alternatives') OR
    (dependent.skill_slug = 'advocate-environmental-policy' AND prereq.skill_slug = 'understand-climate-data') OR
    (dependent.skill_slug = 'communicate-environmental-science' AND prereq.skill_slug = 'use-environmental-apps-tools')
);

-- FOREIGN POLICY: International understanding requires research skills
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    dependent.id as skill_id,
    prereq.id as prerequisite_skill_id,
    'beginner' as required_mastery_level,
    false as is_strict_requirement
FROM skills dependent, skills prereq 
WHERE (
    (dependent.skill_slug = 'understand-trade-impacts' AND prereq.skill_slug = 'follow-international-news') OR
    (dependent.skill_slug = 'research-other-countries' AND prereq.skill_slug = 'follow-international-news') OR
    (dependent.skill_slug = 'spot-international-misinformation' AND prereq.skill_slug = 'fact-check-claims') OR
    (dependent.skill_slug = 'analyze-international-agreements' AND prereq.skill_slug = 'research-other-countries') OR
    (dependent.skill_slug = 'connect-global-local-issues' AND prereq.skill_slug = 'understand-trade-impacts') OR
    (dependent.skill_slug = 'understand-international-law' AND prereq.skill_slug = 'analyze-international-agreements') OR
    (dependent.skill_slug = 'communicate-across-cultures' AND prereq.skill_slug = 'research-other-countries')
);

-- LOCAL ISSUES: Local engagement builds on basic civic skills
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    dependent.id as skill_id,
    prereq.id as prerequisite_skill_id,
    'beginner' as required_mastery_level,
    false as is_strict_requirement
FROM skills dependent, skills prereq 
WHERE (
    (dependent.skill_slug = 'speak-at-public-meetings' AND prereq.skill_slug = 'attend-local-meetings') OR
    (dependent.skill_slug = 'track-local-budget' AND prereq.skill_slug = 'read-budgets') OR
    (dependent.skill_slug = 'research-local-candidates' AND prereq.skill_slug = 'research-candidates') OR
    (dependent.skill_slug = 'organize-petition-drives' AND prereq.skill_slug = 'communicate-message') OR
    (dependent.skill_slug = 'plan-community-events' AND prereq.skill_slug = 'join-neighborhood-groups') OR
    (dependent.skill_slug = 'build-community-coalitions' AND prereq.skill_slug = 'build-coalitions') OR
    (dependent.skill_slug = 'work-with-local-media' AND prereq.skill_slug = 'communicate-message')
);

-- HISTORICAL PRECEDENT: Historical understanding requires research foundation
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    dependent.id as skill_id,
    prereq.id as prerequisite_skill_id,
    'beginner' as required_mastery_level,
    false as is_strict_requirement
FROM skills dependent, skills prereq 
WHERE (
    (dependent.skill_slug = 'research-historical-examples' AND prereq.skill_slug = 'check-sources') OR
    (dependent.skill_slug = 'use-primary-sources' AND prereq.skill_slug = 'research-historical-examples') OR
    (dependent.skill_slug = 'understand-constitutional-history' AND prereq.skill_slug = 'use-constitutional-rights') OR
    (dependent.skill_slug = 'track-policy-outcomes' AND prereq.skill_slug = 'analyze-policy-changes') OR
    (dependent.skill_slug = 'evaluate-historical-claims' AND prereq.skill_slug = 'fact-check-claims') OR
    (dependent.skill_slug = 'analyze-historical-documents' AND prereq.skill_slug = 'use-primary-sources') OR
    (dependent.skill_slug = 'learn-from-other-countries' AND prereq.skill_slug = 'research-other-countries')
);

-- ELECTORAL SYSTEMS: Complex electoral understanding requires basic election skills
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    dependent.id as skill_id,
    prereq.id as prerequisite_skill_id,
    'intermediate' as required_mastery_level,
    false as is_strict_requirement
FROM skills dependent, skills prereq 
WHERE (
    (dependent.skill_slug = 'calculate-election-outcomes' AND prereq.skill_slug = 'understand-voting-methods') OR
    (dependent.skill_slug = 'analyze-gerrymandering' AND prereq.skill_slug = 'understand-voting-methods') OR
    (dependent.skill_slug = 'track-campaign-finance' AND prereq.skill_slug = 'research-candidates') OR
    (dependent.skill_slug = 'track-polling-data' AND prereq.skill_slug = 'read-charts-stats') OR
    (dependent.skill_slug = 'understand-redistricting' AND prereq.skill_slug = 'analyze-gerrymandering') OR
    (dependent.skill_slug = 'evaluate-election-reforms' AND prereq.skill_slug = 'compare-international-elections')
);

-- LEGISLATIVE PROCESS: Legislative understanding requires government foundation
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    dependent.id as skill_id,
    prereq.id as prerequisite_skill_id,
    'beginner' as required_mastery_level,
    false as is_strict_requirement
FROM skills dependent, skills prereq 
WHERE (
    (dependent.skill_slug = 'read-proposed-legislation' AND prereq.skill_slug = 'track-bills-become-laws') OR
    (dependent.skill_slug = 'contact-legislators' AND prereq.skill_slug = 'contact-representatives') OR
    (dependent.skill_slug = 'track-committee-actions' AND prereq.skill_slug = 'track-bills-become-laws') OR
    (dependent.skill_slug = 'analyze-voting-records' AND prereq.skill_slug = 'read-proposed-legislation') OR
    (dependent.skill_slug = 'write-to-legislators' AND prereq.skill_slug = 'contact-legislators') OR
    (dependent.skill_slug = 'organize-legislative-advocacy' AND prereq.skill_slug = 'organize-for-change') OR
    (dependent.skill_slug = 'understand-budget-process' AND prereq.skill_slug = 'read-budgets')
);

-- ====================
-- COMPREHENSIVE SKILL LEARNING OBJECTIVES SEED
-- Concrete, measurable objectives for skill mastery - ALL SKILLS
-- ====================

-- FOUNDATIONAL SKILLS: Basic information literacy
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('find-public-info', 'Navigate government websites to locate basic public records', 'application', 'beginner', 1),
    ('find-public-info', 'Use search functions on official government sites effectively', 'application', 'beginner', 2),
    ('find-public-info', 'Identify which level of government (federal/state/local) handles specific issues', 'knowledge', 'intermediate', 3),
    ('find-public-info', 'Locate and download public documents like meeting minutes and budgets', 'application', 'intermediate', 4),
    
    ('check-sources', 'Identify basic credibility markers of news sources (author, date, publisher)', 'knowledge', 'beginner', 1),
    ('check-sources', 'Distinguish between news, opinion, and analysis content', 'analysis', 'beginner', 2),
    ('check-sources', 'Use fact-checking websites to verify claims', 'application', 'intermediate', 3),
    ('check-sources', 'Cross-reference information across multiple reliable sources', 'synthesis', 'intermediate', 4),
    
    ('fact-check-claims', 'Use lateral reading to verify information', 'application', 'beginner', 1),
    ('fact-check-claims', 'Find original sources for reported claims', 'application', 'intermediate', 2),
    ('fact-check-claims', 'Recognize when claims lack sufficient evidence', 'evaluation', 'intermediate', 3),
    ('fact-check-claims', 'Identify logical fallacies in arguments', 'analysis', 'advanced', 4),
    
    ('read-charts-stats', 'Read basic charts, graphs, and statistical presentations', 'knowledge', 'beginner', 1),
    ('read-charts-stats', 'Identify misleading statistical presentations', 'analysis', 'intermediate', 2),
    ('read-charts-stats', 'Calculate percentages, averages, and basic statistical measures', 'application', 'intermediate', 3),
    ('read-charts-stats', 'Evaluate the quality and reliability of data sources', 'evaluation', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- GOVERNMENT SKILLS: Building civic knowledge
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('read-budgets', 'Locate your local government budget online', 'application', 'beginner', 1),
    ('read-budgets', 'Identify major spending categories in a budget', 'knowledge', 'beginner', 2),
    ('read-budgets', 'Calculate what percentage goes to different services', 'application', 'intermediate', 3),
    ('read-budgets', 'Compare budget allocations across different years', 'analysis', 'intermediate', 4),
    ('read-budgets', 'Evaluate whether budget priorities align with community needs', 'evaluation', 'advanced', 5),
    
    ('contact-representatives', 'Find contact information for your federal, state, and local representatives', 'knowledge', 'beginner', 1),
    ('contact-representatives', 'Write a clear, respectful email to an elected official', 'application', 'beginner', 2),
    ('contact-representatives', 'Make an effective phone call to a representative office', 'application', 'intermediate', 3),
    ('contact-representatives', 'Schedule and prepare for in-person meetings with officials', 'synthesis', 'advanced', 4),
    
    ('attend-meetings', 'Find schedules for local government meetings', 'knowledge', 'beginner', 1),
    ('attend-meetings', 'Follow meeting agendas and understand procedures', 'comprehension', 'beginner', 2),
    ('attend-meetings', 'Take effective notes during meetings', 'application', 'intermediate', 3),
    ('attend-meetings', 'Ask informed questions during public comment periods', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- ELECTION SKILLS: Democratic participation
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('register-vote', 'Complete voter registration in your state', 'application', 'beginner', 1),
    ('register-vote', 'Find your polling location and hours', 'knowledge', 'beginner', 2),
    ('register-vote', 'Understand your state voting options (early, absentee, etc.)', 'comprehension', 'intermediate', 3),
    ('register-vote', 'Help others navigate the registration and voting process', 'synthesis', 'advanced', 4),
    
    ('research-candidates', 'Find official candidate websites and platforms', 'application', 'beginner', 1),
    ('research-candidates', 'Locate candidates voting records and endorsements', 'application', 'intermediate', 2),
    ('research-candidates', 'Evaluate candidate qualifications and experience', 'evaluation', 'intermediate', 3),
    ('research-candidates', 'Compare candidate positions on issues important to you', 'analysis', 'advanced', 4),
    
    ('understand-ballot', 'Obtain and review a sample ballot before election day', 'application', 'beginner', 1),
    ('understand-ballot', 'Research all races and ballot measures, not just major ones', 'synthesis', 'intermediate', 2),
    ('understand-ballot', 'Understand the impact of local races on daily life', 'evaluation', 'intermediate', 3),
    ('understand-ballot', 'Make informed choices across all ballot items', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- LEGAL AND RIGHTS SKILLS: Self-protection and advocacy
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('know-your-rights', 'List your basic constitutional rights', 'knowledge', 'beginner', 1),
    ('know-your-rights', 'Know when and how to invoke your rights', 'application', 'intermediate', 2),
    ('know-your-rights', 'Recognize when your rights may be violated', 'analysis', 'intermediate', 3),
    ('know-your-rights', 'Find appropriate legal help when rights are violated', 'synthesis', 'advanced', 4),
    
    ('document-problems', 'Take clear photos and notes of incidents', 'application', 'beginner', 1),
    ('document-problems', 'Record dates, times, and witness information', 'application', 'beginner', 2),
    ('document-problems', 'Organize documentation for formal complaints', 'synthesis', 'intermediate', 3),
    ('document-problems', 'Present documentation effectively to authorities', 'evaluation', 'advanced', 4),
    
    ('file-complaints', 'Identify the appropriate agency for different types of complaints', 'knowledge', 'beginner', 1),
    ('file-complaints', 'Complete official complaint forms accurately', 'application', 'intermediate', 2),
    ('file-complaints', 'Follow up on complaints appropriately', 'application', 'intermediate', 3),
    ('file-complaints', 'Escalate complaints when initial responses are inadequate', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- CAPSTONE "UNDERSTAND" SKILLS: Synthesis and mastery
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('understand-government-structure', 'Explain how federal, state, and local governments interact', 'comprehension', 'intermediate', 1),
    ('understand-government-structure', 'Predict which level of government can address specific problems', 'application', 'intermediate', 2),
    ('understand-government-structure', 'Analyze how government structure affects policy outcomes', 'analysis', 'advanced', 3),
    ('understand-government-structure', 'Evaluate proposals for governmental reform', 'evaluation', 'advanced', 4),
    
    ('understand-checks-balances', 'Describe how different branches of government limit each other', 'comprehension', 'intermediate', 1),
    ('understand-checks-balances', 'Identify when checks and balances are working or failing', 'analysis', 'intermediate', 2),
    ('understand-checks-balances', 'Evaluate the effectiveness of oversight mechanisms', 'evaluation', 'advanced', 3),
    ('understand-checks-balances', 'Apply checks and balances thinking to other organizations', 'synthesis', 'advanced', 4),
    
    ('understand-ai-democracy', 'Identify ways AI currently affects democratic processes', 'knowledge', 'intermediate', 1),
    ('understand-ai-democracy', 'Analyze potential benefits and risks of AI in elections', 'analysis', 'advanced', 2),
    ('understand-ai-democracy', 'Evaluate proposals for AI governance in democratic contexts', 'evaluation', 'advanced', 3),
    ('understand-ai-democracy', 'Advocate for responsible AI use in democratic institutions', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- ADVANCED CIVIC ACTION: Leadership and organizing
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('organize-for-change', 'Identify stakeholders and potential allies for a cause', 'analysis', 'intermediate', 1),
    ('organize-for-change', 'Develop clear goals and strategies for change efforts', 'synthesis', 'intermediate', 2),
    ('organize-for-change', 'Coordinate volunteer efforts and delegate responsibilities', 'application', 'advanced', 3),
    ('organize-for-change', 'Adapt strategies based on changing circumstances', 'evaluation', 'advanced', 4),
    
    ('communicate-message', 'Craft clear, compelling messages for different audiences', 'synthesis', 'intermediate', 1),
    ('communicate-message', 'Use various communication channels effectively', 'application', 'intermediate', 2),
    ('communicate-message', 'Respond effectively to questions and opposition', 'synthesis', 'advanced', 3),
    ('communicate-message', 'Maintain message consistency across team members', 'evaluation', 'advanced', 4),
    
    ('plan-campaigns', 'Set realistic, measurable campaign goals', 'synthesis', 'intermediate', 1),
    ('plan-campaigns', 'Develop timelines and resource allocation plans', 'synthesis', 'intermediate', 2),
    ('plan-campaigns', 'Create contingency plans for different scenarios', 'synthesis', 'advanced', 3),
    ('plan-campaigns', 'Evaluate campaign effectiveness and adjust strategies', 'evaluation', 'advanced', 4),
    
    ('build-coalitions', 'Map different stakeholder interests and concerns', 'analysis', 'intermediate', 1),
    ('build-coalitions', 'Find common ground between diverse groups', 'synthesis', 'intermediate', 2),
    ('build-coalitions', 'Negotiate agreements that work for all parties', 'synthesis', 'advanced', 3),
    ('build-coalitions', 'Maintain coalition unity through challenges', 'evaluation', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- ECONOMY SKILLS: Understanding economic systems and policy
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('read-economic-news', 'Identify key economic indicators in news reports', 'knowledge', 'beginner', 1),
    ('read-economic-news', 'Distinguish between leading and lagging economic indicators', 'comprehension', 'intermediate', 2),
    ('read-economic-news', 'Analyze how economic trends affect different communities', 'analysis', 'intermediate', 3),
    ('read-economic-news', 'Predict personal financial impacts from economic news', 'application', 'advanced', 4),
    
    ('figure-tax-impact', 'Calculate how tax changes affect your household budget', 'application', 'beginner', 1),
    ('figure-tax-impact', 'Compare tax burden across different income levels', 'analysis', 'intermediate', 2),
    ('figure-tax-impact', 'Evaluate tax policy proposals for fairness and effectiveness', 'evaluation', 'intermediate', 3),
    ('figure-tax-impact', 'Model long-term tax impact scenarios', 'synthesis', 'advanced', 4),
    
    ('spot-economic-bs', 'Identify misleading economic statistics in political rhetoric', 'analysis', 'beginner', 1),
    ('spot-economic-bs', 'Recognize cherry-picked data and false correlations', 'evaluation', 'intermediate', 2),
    ('spot-economic-bs', 'Fact-check economic claims using reliable sources', 'application', 'intermediate', 3),
    ('spot-economic-bs', 'Educate others about economic misinformation', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- MEDIA LITERACY: Critical information evaluation
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('spot-bias', 'Identify obvious bias in news headlines and framing', 'analysis', 'beginner', 1),
    ('spot-bias', 'Recognize subtle bias in word choice and story selection', 'analysis', 'intermediate', 2),
    ('spot-bias', 'Compare coverage of same event across different outlets', 'synthesis', 'intermediate', 3),
    ('spot-bias', 'Teach others to recognize media bias and manipulation', 'evaluation', 'advanced', 4),
    
    ('find-original-sources', 'Trace news stories back to their primary sources', 'application', 'beginner', 1),
    ('find-original-sources', 'Access and read original documents and studies', 'application', 'intermediate', 2),
    ('find-original-sources', 'Evaluate whether reporting accurately reflects sources', 'evaluation', 'intermediate', 3),
    ('find-original-sources', 'Cite primary sources in your own communication', 'synthesis', 'advanced', 4),
    
    ('evaluate-online-info', 'Use domain authority and credibility markers', 'application', 'beginner', 1),
    ('evaluate-online-info', 'Cross-reference claims across multiple sources', 'synthesis', 'intermediate', 2),
    ('evaluate-online-info', 'Identify sock puppet accounts and astroturfing', 'analysis', 'intermediate', 3),
    ('evaluate-online-info', 'Help others evaluate online information quality', 'evaluation', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- ENVIRONMENT SKILLS: Environmental analysis and action
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('research-environmental-issues', 'Find reliable scientific sources on environmental topics', 'application', 'beginner', 1),
    ('research-environmental-issues', 'Distinguish between peer-reviewed and non-peer-reviewed sources', 'analysis', 'intermediate', 2),
    ('research-environmental-issues', 'Synthesize complex environmental research for general audiences', 'synthesis', 'intermediate', 3),
    ('research-environmental-issues', 'Identify gaps in environmental research and data', 'evaluation', 'advanced', 4),
    
    ('calculate-environmental-impact', 'Measure your personal carbon footprint accurately', 'application', 'beginner', 1),
    ('calculate-environmental-impact', 'Compare environmental impact of different lifestyle choices', 'analysis', 'intermediate', 2),
    ('calculate-environmental-impact', 'Model environmental impact of proposed policies', 'synthesis', 'advanced', 3),
    ('calculate-environmental-impact', 'Evaluate cost-effectiveness of environmental interventions', 'evaluation', 'advanced', 4),
    
    ('understand-climate-data', 'Read and interpret climate graphs and datasets', 'comprehension', 'beginner', 1),
    ('understand-climate-data', 'Distinguish between weather and climate trends', 'analysis', 'intermediate', 2),
    ('understand-climate-data', 'Evaluate reliability of different climate data sources', 'evaluation', 'intermediate', 3),
    ('understand-climate-data', 'Use climate data to inform policy recommendations', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- AI GOVERNANCE: Understanding AI impact on society
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('understand-ai-daily-life', 'Identify AI systems you interact with daily', 'knowledge', 'beginner', 1),
    ('understand-ai-daily-life', 'Understand how recommendation algorithms affect your choices', 'comprehension', 'intermediate', 2),
    ('understand-ai-daily-life', 'Analyze the benefits and risks of AI in personal life', 'analysis', 'intermediate', 3),
    ('understand-ai-daily-life', 'Make informed decisions about AI service usage', 'evaluation', 'advanced', 4),
    
    ('protect-data-from-ai', 'Review and adjust privacy settings on AI-powered platforms', 'application', 'beginner', 1),
    ('protect-data-from-ai', 'Understand what data AI systems collect about you', 'comprehension', 'intermediate', 2),
    ('protect-data-from-ai', 'Use tools to limit AI data collection', 'application', 'intermediate', 3),
    ('protect-data-from-ai', 'Advocate for stronger AI privacy protections', 'synthesis', 'advanced', 4),
    
    ('spot-ai-bias', 'Recognize when AI systems produce unfair outcomes', 'analysis', 'beginner', 1),
    ('spot-ai-bias', 'Understand different types of algorithmic bias', 'comprehension', 'intermediate', 2),
    ('spot-ai-bias', 'Document and report AI bias incidents', 'application', 'intermediate', 3),
    ('spot-ai-bias', 'Advocate for algorithmic accountability measures', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- IMMIGRATION SKILLS: Understanding immigration systems and supporting newcomers
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('understand-immigration-basics', 'Distinguish between different visa types and immigration statuses', 'knowledge', 'beginner', 1),
    ('understand-immigration-basics', 'Understand pathways to permanent residence and citizenship', 'comprehension', 'intermediate', 2),
    ('understand-immigration-basics', 'Explain immigration rights regardless of status', 'comprehension', 'intermediate', 3),
    ('understand-immigration-basics', 'Help others navigate immigration misinformation', 'synthesis', 'advanced', 4),
    
    ('help-immigrants-navigate-services', 'Connect immigrants with legal aid and community resources', 'application', 'beginner', 1),
    ('help-immigrants-navigate-services', 'Assist with basic government service applications', 'application', 'intermediate', 2),
    ('help-immigrants-navigate-services', 'Provide culturally competent support and advocacy', 'synthesis', 'intermediate', 3),
    ('help-immigrants-navigate-services', 'Train others to support immigrant communities', 'evaluation', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- JUSTICE SKILLS: Understanding legal systems and ensuring fairness
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('navigate-legal-systems', 'Understand the difference between criminal and civil courts', 'knowledge', 'beginner', 1),
    ('navigate-legal-systems', 'Know when and how to seek legal representation', 'application', 'intermediate', 2),
    ('navigate-legal-systems', 'Understand your rights during legal proceedings', 'comprehension', 'intermediate', 3),
    ('navigate-legal-systems', 'Help others access legal resources and support', 'synthesis', 'advanced', 4),
    
    ('evaluate-evidence', 'Distinguish between direct and circumstantial evidence', 'analysis', 'beginner', 1),
    ('evaluate-evidence', 'Assess credibility of witnesses and testimony', 'evaluation', 'intermediate', 2),
    ('evaluate-evidence', 'Understand burden of proof in different legal contexts', 'comprehension', 'intermediate', 3),
    ('evaluate-evidence', 'Apply evidence evaluation skills to daily decision-making', 'synthesis', 'advanced', 4),
    
    ('know-legal-help', 'Identify when legal issues require professional help', 'analysis', 'beginner', 1),
    ('know-legal-help', 'Find qualified legal assistance in your area', 'application', 'intermediate', 2),
    ('know-legal-help', 'Understand different types of legal services and costs', 'comprehension', 'intermediate', 3),
    ('know-legal-help', 'Advocate for expanded access to legal aid', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- NATIONAL SECURITY: Balancing safety and freedom
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('assess-risks', 'Evaluate probability and impact of different threats', 'analysis', 'beginner', 1),
    ('assess-risks', 'Distinguish between reasonable and excessive security measures', 'evaluation', 'intermediate', 2),
    ('assess-risks', 'Use risk assessment frameworks for personal decisions', 'application', 'intermediate', 3),
    ('assess-risks', 'Help communities develop emergency preparedness plans', 'synthesis', 'advanced', 4),
    
    ('protect-information', 'Use strong passwords and two-factor authentication', 'application', 'beginner', 1),
    ('protect-information', 'Understand what information you share and with whom', 'comprehension', 'intermediate', 2),
    ('protect-information', 'Recognize and avoid social engineering attacks', 'analysis', 'intermediate', 3),
    ('protect-information', 'Educate others about digital security best practices', 'synthesis', 'advanced', 4),
    
    ('prepare-emergencies', 'Create basic emergency supply kits for your household', 'application', 'beginner', 1),
    ('prepare-emergencies', 'Develop communication plans for various emergency scenarios', 'synthesis', 'intermediate', 2),
    ('prepare-emergencies', 'Know your community emergency resources and procedures', 'knowledge', 'intermediate', 3),
    ('prepare-emergencies', 'Organize neighborhood emergency preparedness efforts', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- FOREIGN POLICY: Understanding global interconnections
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('follow-international-news', 'Identify reliable international news sources', 'knowledge', 'beginner', 1),
    ('follow-international-news', 'Understand how global events affect local communities', 'comprehension', 'intermediate', 2),
    ('follow-international-news', 'Analyze bias in international news coverage', 'analysis', 'intermediate', 3),
    ('follow-international-news', 'Synthesize international perspectives on global issues', 'synthesis', 'advanced', 4),
    
    ('understand-trade-impacts', 'Track how trade policies affect prices of goods you buy', 'application', 'beginner', 1),
    ('understand-trade-impacts', 'Analyze winners and losers from trade agreements', 'analysis', 'intermediate', 2),
    ('understand-trade-impacts', 'Evaluate economic arguments for and against trade deals', 'evaluation', 'intermediate', 3),
    ('understand-trade-impacts', 'Advocate for trade policies that benefit your community', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- POLICY ANALYSIS: Advanced analytical thinking
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('break-down-complex-policies', 'Identify the main components and mechanisms of complex policies', 'analysis', 'intermediate', 1),
    ('break-down-complex-policies', 'Simplify policy language for general audiences', 'synthesis', 'intermediate', 2),
    ('break-down-complex-policies', 'Trace implementation steps from policy to practice', 'comprehension', 'advanced', 3),
    ('break-down-complex-policies', 'Predict potential implementation challenges', 'evaluation', 'advanced', 4),
    
    ('identify-policy-winners-losers', 'Map stakeholders affected by policy changes', 'analysis', 'intermediate', 1),
    ('identify-policy-winners-losers', 'Quantify costs and benefits for different groups', 'application', 'intermediate', 2),
    ('identify-policy-winners-losers', 'Understand why certain groups support or oppose policies', 'comprehension', 'advanced', 3),
    ('identify-policy-winners-losers', 'Design policies that minimize harmful distributional effects', 'synthesis', 'advanced', 4),
    
    ('compare-policy-options', 'Establish clear criteria for comparing policy alternatives', 'synthesis', 'intermediate', 1),
    ('compare-policy-options', 'Research how similar policies have worked elsewhere', 'application', 'intermediate', 2),
    ('compare-policy-options', 'Weight trade-offs between competing policy goals', 'evaluation', 'advanced', 3),
    ('compare-policy-options', 'Make evidence-based policy recommendations', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- CIVIC PARTICIPATION: Active democratic engagement
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('vote-all-elections', 'Research and vote in federal, state, and local elections', 'application', 'beginner', 1),
    ('vote-all-elections', 'Understand the impact of different election types on your daily life', 'comprehension', 'intermediate', 2),
    ('vote-all-elections', 'Help others understand voting procedures and ballot content', 'synthesis', 'intermediate', 3),
    ('vote-all-elections', 'Advocate for voting access and election integrity', 'synthesis', 'advanced', 4),
    
    ('volunteer-campaigns', 'Contribute time and skills to political campaigns you support', 'application', 'beginner', 1),
    ('volunteer-campaigns', 'Understand how political campaigns are organized and funded', 'comprehension', 'intermediate', 2),
    ('volunteer-campaigns', 'Develop political organizing and outreach skills', 'synthesis', 'intermediate', 3),
    ('volunteer-campaigns', 'Lead volunteer teams and coordinate campaign activities', 'synthesis', 'advanced', 4),
    
    ('join-community-organizations', 'Identify and connect with groups working on issues you care about', 'application', 'beginner', 1),
    ('join-community-organizations', 'Contribute meaningfully to organizational goals and activities', 'synthesis', 'intermediate', 2),
    ('join-community-organizations', 'Take on leadership roles in community organizations', 'synthesis', 'advanced', 3),
    ('join-community-organizations', 'Build bridges between different community groups', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- LOCAL ISSUES: Community engagement and problem-solving
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('attend-local-meetings', 'Find and attend city council, school board, and planning meetings', 'application', 'beginner', 1),
    ('attend-local-meetings', 'Follow meeting agendas and understand local government procedures', 'comprehension', 'beginner', 2),
    ('attend-local-meetings', 'Take effective notes and track follow-up on local issues', 'application', 'intermediate', 3),
    ('attend-local-meetings', 'Encourage others to participate in local government', 'synthesis', 'advanced', 4),
    
    ('speak-at-public-meetings', 'Prepare and deliver effective public comments', 'application', 'intermediate', 1),
    ('speak-at-public-meetings', 'Advocate persuasively for your position on local issues', 'synthesis', 'intermediate', 2),
    ('speak-at-public-meetings', 'Respond professionally to questions and opposition', 'synthesis', 'advanced', 3),
    ('speak-at-public-meetings', 'Coach others on effective public speaking', 'evaluation', 'advanced', 4),
    
    ('organize-petition-drives', 'Design petition campaigns that build community support', 'synthesis', 'intermediate', 1),
    ('organize-petition-drives', 'Collect signatures effectively and legally', 'application', 'intermediate', 2),
    ('organize-petition-drives', 'Use petition drives to educate and mobilize communities', 'synthesis', 'advanced', 3),
    ('organize-petition-drives', 'Turn petition campaigns into lasting policy change', 'evaluation', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- HISTORICAL PRECEDENT: Learning from the past to inform the present
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('connect-past-present', 'Identify historical parallels to current political situations', 'analysis', 'beginner', 1),
    ('connect-past-present', 'Use historical examples to predict potential outcomes', 'application', 'intermediate', 2),
    ('connect-past-present', 'Evaluate the relevance of historical precedents to modern issues', 'evaluation', 'intermediate', 3),
    ('connect-past-present', 'Teach others to think historically about current events', 'synthesis', 'advanced', 4),
    
    ('research-historical-examples', 'Find reliable historical sources and primary documents', 'application', 'beginner', 1),
    ('research-historical-examples', 'Distinguish between primary and secondary historical sources', 'analysis', 'intermediate', 2),
    ('research-historical-examples', 'Synthesize multiple historical perspectives on events', 'synthesis', 'intermediate', 3),
    ('research-historical-examples', 'Apply historical research methods to current policy questions', 'synthesis', 'advanced', 4),
    
    ('learn-from-past-mistakes', 'Identify policy failures and their causes in historical context', 'analysis', 'beginner', 1),
    ('learn-from-past-mistakes', 'Analyze why certain approaches succeeded or failed historically', 'evaluation', 'intermediate', 2),
    ('learn-from-past-mistakes', 'Apply lessons from historical failures to current policy debates', 'synthesis', 'intermediate', 3),
    ('learn-from-past-mistakes', 'Help policymakers avoid repeating historical errors', 'evaluation', 'advanced', 4),
    
    ('use-primary-sources', 'Access and read historical documents, speeches, and records', 'application', 'beginner', 1),
    ('use-primary-sources', 'Interpret historical documents within their proper context', 'comprehension', 'intermediate', 2),
    ('use-primary-sources', 'Evaluate the reliability and bias of primary sources', 'evaluation', 'intermediate', 3),
    ('use-primary-sources', 'Use primary sources to support arguments about current issues', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- ELECTORAL SYSTEMS: Understanding how democratic systems work
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('understand-voting-methods', 'Compare different voting systems (plurality, ranked choice, etc.)', 'analysis', 'beginner', 1),
    ('understand-voting-methods', 'Predict how different voting systems affect election outcomes', 'application', 'intermediate', 2),
    ('understand-voting-methods', 'Evaluate pros and cons of different electoral systems', 'evaluation', 'intermediate', 3),
    ('understand-voting-methods', 'Advocate for electoral reforms in your community', 'synthesis', 'advanced', 4),
    
    ('calculate-election-outcomes', 'Calculate vote percentages and margins of victory', 'application', 'beginner', 1),
    ('calculate-election-outcomes', 'Model how different voting systems would change results', 'synthesis', 'intermediate', 2),
    ('calculate-election-outcomes', 'Analyze the mathematical properties of voting systems', 'analysis', 'advanced', 3),
    ('calculate-election-outcomes', 'Design fairer election systems using mathematical principles', 'synthesis', 'advanced', 4),
    
    ('analyze-gerrymandering', 'Identify obviously gerrymandered district maps', 'analysis', 'beginner', 1),
    ('analyze-gerrymandering', 'Use geometric and statistical tests for gerrymandering', 'application', 'intermediate', 2),
    ('analyze-gerrymandering', 'Evaluate different approaches to redistricting reform', 'evaluation', 'intermediate', 3),
    ('analyze-gerrymandering', 'Advocate for fair redistricting processes', 'synthesis', 'advanced', 4),
    
    ('track-campaign-finance', 'Find and read campaign finance reports', 'application', 'beginner', 1),
    ('track-campaign-finance', 'Analyze patterns in political donations and spending', 'analysis', 'intermediate', 2),
    ('track-campaign-finance', 'Evaluate the impact of money on election outcomes', 'evaluation', 'intermediate', 3),
    ('track-campaign-finance', 'Advocate for campaign finance reform measures', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- LEGISLATIVE PROCESS: Understanding how laws are made
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('track-bills-become-laws', 'Follow a bill through the entire legislative process', 'application', 'beginner', 1),
    ('track-bills-become-laws', 'Predict likelihood of bill passage based on political factors', 'evaluation', 'intermediate', 2),
    ('track-bills-become-laws', 'Identify key decision points where citizen input matters most', 'analysis', 'intermediate', 3),
    ('track-bills-become-laws', 'Organize strategic advocacy campaigns around legislative timing', 'synthesis', 'advanced', 4),
    
    ('read-proposed-legislation', 'Parse the structure and language of legislative bills', 'comprehension', 'beginner', 1),
    ('read-proposed-legislation', 'Identify the real-world impacts of proposed legislation', 'analysis', 'intermediate', 2),
    ('read-proposed-legislation', 'Distinguish between substantive and procedural changes', 'analysis', 'intermediate', 3),
    ('read-proposed-legislation', 'Draft effective amendments or alternative proposals', 'synthesis', 'advanced', 4),
    
    ('contact-legislators', 'Find and use appropriate contact methods for your representatives', 'application', 'beginner', 1),
    ('contact-legislators', 'Write effective letters and emails to legislators about specific bills', 'synthesis', 'intermediate', 2),
    ('contact-legislators', 'Schedule and conduct productive meetings with legislative staff', 'application', 'advanced', 3),
    ('contact-legislators', 'Build ongoing relationships with legislators and their staff', 'synthesis', 'advanced', 4),
    
    ('analyze-voting-records', 'Research how your representatives have voted on key issues', 'application', 'beginner', 1),
    ('analyze-voting-records', 'Identify patterns and inconsistencies in voting behavior', 'analysis', 'intermediate', 2),
    ('analyze-voting-records', 'Evaluate whether representatives vote consistently with stated positions', 'evaluation', 'intermediate', 3),
    ('analyze-voting-records', 'Use voting records to hold representatives accountable', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- JUDICIAL REVIEW: Understanding courts and constitutional interpretation
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('understand-how-courts-work', 'Distinguish between different types of courts and their jurisdictions', 'knowledge', 'beginner', 1),
    ('understand-how-courts-work', 'Understand the appeals process and how cases move through courts', 'comprehension', 'intermediate', 2),
    ('understand-how-courts-work', 'Analyze factors that influence judicial decision-making', 'analysis', 'intermediate', 3),
    ('understand-how-courts-work', 'Navigate court procedures when involved in legal proceedings', 'application', 'advanced', 4),
    
    ('read-court-decisions', 'Find and access court opinions and legal databases', 'application', 'beginner', 1),
    ('read-court-decisions', 'Identify the key legal principles and holdings in court cases', 'analysis', 'intermediate', 2),
    ('read-court-decisions', 'Distinguish between binding and persuasive legal precedent', 'comprehension', 'intermediate', 3),
    ('read-court-decisions', 'Use legal reasoning to predict outcomes in similar cases', 'synthesis', 'advanced', 4),
    
    ('follow-supreme-court-cases', 'Track major Supreme Court cases and their potential impact', 'application', 'beginner', 1),
    ('follow-supreme-court-cases', 'Understand how Supreme Court decisions affect your rights', 'comprehension', 'intermediate', 2),
    ('follow-supreme-court-cases', 'Analyze the political and social implications of major rulings', 'analysis', 'advanced', 3),
    ('follow-supreme-court-cases', 'Advocate for judicial reforms or constitutional amendments', 'synthesis', 'advanced', 4),
    
    ('understand-constitutional-review', 'Understand how courts interpret constitutional text and principles', 'comprehension', 'intermediate', 1),
    ('understand-constitutional-review', 'Analyze different approaches to constitutional interpretation', 'analysis', 'intermediate', 2),
    ('understand-constitutional-review', 'Evaluate the legitimacy and limits of judicial review', 'evaluation', 'advanced', 3),
    ('understand-constitutional-review', 'Apply constitutional principles to evaluate new laws and policies', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- CONSTITUTIONAL LAW: Deep understanding of constitutional principles (comprehensive)
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('use-constitutional-rights', 'Know when and how to invoke specific constitutional protections', 'application', 'beginner', 1),
    ('use-constitutional-rights', 'Understand the scope and limitations of different constitutional rights', 'comprehension', 'intermediate', 2),
    ('use-constitutional-rights', 'Apply constitutional principles to everyday situations', 'application', 'intermediate', 3),
    ('use-constitutional-rights', 'Help others understand and exercise their constitutional rights', 'synthesis', 'advanced', 4),
    
    ('recognize-overreach', 'Identify when government actions exceed constitutional authority', 'analysis', 'beginner', 1),
    ('recognize-overreach', 'Understand the proper channels for challenging government overreach', 'comprehension', 'intermediate', 2),
    ('recognize-overreach', 'Evaluate the constitutionality of proposed laws and policies', 'evaluation', 'advanced', 3),
    ('recognize-overreach', 'Organize constitutional challenges to problematic government actions', 'synthesis', 'advanced', 4),
    
    ('understand-first-amendment', 'Apply free speech principles to complex modern situations', 'application', 'intermediate', 1),
    ('understand-first-amendment', 'Understand the balance between free speech and other rights', 'comprehension', 'intermediate', 2),
    ('understand-first-amendment', 'Evaluate restrictions on speech for constitutionality', 'evaluation', 'advanced', 3),
    ('understand-first-amendment', 'Defend free speech rights in your community', 'synthesis', 'advanced', 4),
    
    ('understand-fourth-amendment', 'Know your rights during police encounters and searches', 'knowledge', 'beginner', 1),
    ('understand-fourth-amendment', 'Understand when searches require warrants and when they do not', 'comprehension', 'intermediate', 2),
    ('understand-fourth-amendment', 'Evaluate government surveillance programs for constitutionality', 'evaluation', 'advanced', 3),
    ('understand-fourth-amendment', 'Advocate for stronger privacy protections in the digital age', 'synthesis', 'advanced', 4),
    
    ('understand-equal-protection', 'Recognize when laws treat different groups unfairly', 'analysis', 'beginner', 1),
    ('understand-equal-protection', 'Understand different levels of constitutional scrutiny', 'comprehension', 'intermediate', 2),
    ('understand-equal-protection', 'Apply equal protection analysis to current discrimination issues', 'application', 'advanced', 3),
    ('understand-equal-protection', 'Build legal strategies for equal protection challenges', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- Add completion timestamps
UPDATE skill_learning_objectives SET created_at = NOW();
UPDATE skill_prerequisites SET created_at = NOW();

-- ====================
-- ADDITIONAL SKILL CATEGORIES AND RELATIONSHIPS
-- Expanding coverage to include digital literacy, healthcare literacy, and financial literacy
-- ====================

-- DIGITAL LITERACY: Modern civic participation requires digital skills
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    dependent.id as skill_id,
    prereq.id as prerequisite_skill_id,
    'beginner' as required_mastery_level,
    false as is_strict_requirement
FROM skills dependent, skills prereq 
WHERE (
    -- Digital literacy enables online civic participation
    (dependent.skill_slug = 'evaluate-online-info' AND prereq.skill_slug = 'check-sources') OR
    (dependent.skill_slug = 'spot-ai-generated-content' AND prereq.skill_slug = 'evaluate-online-info') OR
    (dependent.skill_slug = 'use-government-digital-services' AND prereq.skill_slug = 'find-public-info') OR
    (dependent.skill_slug = 'protect-online-privacy' AND prereq.skill_slug = 'protect-information') OR
    (dependent.skill_slug = 'participate-virtual-meetings' AND prereq.skill_slug = 'attend-meetings') OR
    
    -- Digital skills for civic tech
    (dependent.skill_slug = 'use-civic-tech-apps' AND prereq.skill_slug = 'evaluate-online-info') OR
    (dependent.skill_slug = 'analyze-open-data' AND prereq.skill_slug = 'read-charts-stats') OR
    (dependent.skill_slug = 'contribute-crowdsourced-civic-projects' AND prereq.skill_slug = 'use-civic-tech-apps') OR
    
    -- Digital communication for advocacy
    (dependent.skill_slug = 'create-digital-advocacy-campaigns' AND prereq.skill_slug = 'communicate-message') OR
    (dependent.skill_slug = 'engage-social-media-advocacy' AND prereq.skill_slug = 'create-digital-advocacy-campaigns') OR
    (dependent.skill_slug = 'build-online-communities' AND prereq.skill_slug = 'engage-social-media-advocacy')
);

-- HEALTHCARE LITERACY: Understanding healthcare systems and policies
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    dependent.id as skill_id,
    prereq.id as prerequisite_skill_id,
    'beginner' as required_mastery_level,
    false as is_strict_requirement
FROM skills dependent, skills prereq 
WHERE (
    -- Healthcare system navigation
    (dependent.skill_slug = 'understand-health-insurance' AND prereq.skill_slug = 'read-charts-stats') OR
    (dependent.skill_slug = 'navigate-healthcare-system' AND prereq.skill_slug = 'understand-health-insurance') OR
    (dependent.skill_slug = 'evaluate-healthcare-options' AND prereq.skill_slug = 'navigate-healthcare-system') OR
    
    -- Healthcare policy understanding
    (dependent.skill_slug = 'understand-healthcare-policy' AND prereq.skill_slug = 'break-down-complex-policies') OR
    (dependent.skill_slug = 'analyze-healthcare-legislation' AND prereq.skill_slug = 'understand-healthcare-policy') OR
    (dependent.skill_slug = 'advocate-healthcare-access' AND prereq.skill_slug = 'analyze-healthcare-legislation') OR
    
    -- Public health literacy
    (dependent.skill_slug = 'evaluate-public-health-information' AND prereq.skill_slug = 'fact-check-claims') OR
    (dependent.skill_slug = 'understand-public-health-data' AND prereq.skill_slug = 'read-charts-stats') OR
    (dependent.skill_slug = 'promote-community-health' AND prereq.skill_slug = 'understand-public-health-data')
);

-- FINANCIAL LITERACY: Personal and public finance understanding
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    dependent.id as skill_id,
    prereq.id as prerequisite_skill_id,
    'beginner' as required_mastery_level,
    false as is_strict_requirement
FROM skills dependent, skills prereq 
WHERE (
    -- Personal finance basics
    (dependent.skill_slug = 'create-personal-budget' AND prereq.skill_slug = 'read-charts-stats') OR
    (dependent.skill_slug = 'understand-credit-debt' AND prereq.skill_slug = 'create-personal-budget') OR
    (dependent.skill_slug = 'plan-long-term-finances' AND prereq.skill_slug = 'understand-credit-debt') OR
    
    -- Public finance understanding
    (dependent.skill_slug = 'understand-public-debt' AND prereq.skill_slug = 'read-budgets') OR
    (dependent.skill_slug = 'analyze-government-spending' AND prereq.skill_slug = 'understand-public-debt') OR
    (dependent.skill_slug = 'evaluate-fiscal-policy' AND prereq.skill_slug = 'analyze-government-spending') OR
    
    -- Financial systems literacy
    (dependent.skill_slug = 'understand-banking-system' AND prereq.skill_slug = 'understand-federal-reserve') OR
    (dependent.skill_slug = 'evaluate-financial-regulations' AND prereq.skill_slug = 'understand-banking-system') OR
    (dependent.skill_slug = 'spot-financial-misinformation' AND prereq.skill_slug = 'spot-economic-bs')
);

-- ====================
-- ADDITIONAL LEARNING OBJECTIVES
-- Concrete, measurable objectives for new skill categories
-- ====================

-- DIGITAL LITERACY: Skills for modern civic engagement
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('evaluate-online-info', 'Verify the authenticity of websites and digital sources', 'application', 'beginner', 1),
    ('evaluate-online-info', 'Identify manipulated images and videos', 'analysis', 'intermediate', 2),
    ('evaluate-online-info', 'Recognize coordinated inauthentic behavior online', 'analysis', 'advanced', 3),
    ('evaluate-online-info', 'Teach digital literacy skills to others', 'synthesis', 'advanced', 4),
    
    ('spot-ai-generated-content', 'Identify common markers of AI-generated text', 'knowledge', 'beginner', 1),
    ('spot-ai-generated-content', 'Distinguish between human and AI-created images', 'analysis', 'intermediate', 2),
    ('spot-ai-generated-content', 'Use tools to detect AI-generated content', 'application', 'intermediate', 3),
    ('spot-ai-generated-content', 'Evaluate the implications of AI content in civic discourse', 'evaluation', 'advanced', 4),
    
    ('use-government-digital-services', 'Navigate government websites to access services', 'application', 'beginner', 1),
    ('use-government-digital-services', 'Complete online government forms accurately', 'application', 'beginner', 2),
    ('use-government-digital-services', 'Troubleshoot common issues with digital government services', 'application', 'intermediate', 3),
    ('use-government-digital-services', 'Help others access digital government services', 'synthesis', 'advanced', 4),
    
    ('protect-online-privacy', 'Configure basic privacy settings on digital platforms', 'application', 'beginner', 1),
    ('protect-online-privacy', 'Understand data collection practices and their implications', 'comprehension', 'intermediate', 2),
    ('protect-online-privacy', 'Use privacy-enhancing tools effectively', 'application', 'intermediate', 3),
    ('protect-online-privacy', 'Advocate for stronger digital privacy protections', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- HEALTHCARE LITERACY: Understanding healthcare systems and policies
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('understand-health-insurance', 'Define common health insurance terminology', 'knowledge', 'beginner', 1),
    ('understand-health-insurance', 'Compare different health insurance plans', 'analysis', 'intermediate', 2),
    ('understand-health-insurance', 'Calculate out-of-pocket costs for medical procedures', 'application', 'intermediate', 3),
    ('understand-health-insurance', 'Navigate insurance appeals processes', 'application', 'advanced', 4),
    
    ('navigate-healthcare-system', 'Find appropriate healthcare providers in-network', 'application', 'beginner', 1),
    ('navigate-healthcare-system', 'Prepare effectively for medical appointments', 'application', 'beginner', 2),
    ('navigate-healthcare-system', 'Coordinate care across multiple providers', 'synthesis', 'intermediate', 3),
    ('navigate-healthcare-system', 'Access patient advocacy resources when needed', 'application', 'advanced', 4),
    
    ('understand-healthcare-policy', 'Identify key components of major healthcare legislation', 'knowledge', 'beginner', 1),
    ('understand-healthcare-policy', 'Analyze how healthcare policies affect different populations', 'analysis', 'intermediate', 2),
    ('understand-healthcare-policy', 'Compare healthcare systems across different countries', 'analysis', 'intermediate', 3),
    ('understand-healthcare-policy', 'Evaluate proposed healthcare reforms', 'evaluation', 'advanced', 4),
    
    ('evaluate-public-health-information', 'Distinguish between credible and non-credible health sources', 'analysis', 'beginner', 1),
    ('evaluate-public-health-information', 'Interpret public health statistics and recommendations', 'comprehension', 'intermediate', 2),
    ('evaluate-public-health-information', 'Assess the quality of medical research studies', 'evaluation', 'advanced', 3),
    ('evaluate-public-health-information', 'Communicate complex health information to diverse audiences', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- FINANCIAL LITERACY: Personal and public finance understanding
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('create-personal-budget', 'Track income and expenses accurately', 'application', 'beginner', 1),
    ('create-personal-budget', 'Develop a balanced budget that includes savings', 'synthesis', 'beginner', 2),
    ('create-personal-budget', 'Adjust budgets to accommodate changing financial circumstances', 'application', 'intermediate', 3),
    ('create-personal-budget', 'Use budgeting tools and software effectively', 'application', 'intermediate', 4),
    
    ('understand-credit-debt', 'Explain how credit scores work and what affects them', 'comprehension', 'beginner', 1),
    ('understand-credit-debt', 'Compare different types of loans and their terms', 'analysis', 'intermediate', 2),
    ('understand-credit-debt', 'Develop strategies to manage and reduce debt', 'synthesis', 'intermediate', 3),
    ('understand-credit-debt', 'Evaluate the true cost of different financing options', 'evaluation', 'advanced', 4),
    
    ('understand-public-debt', 'Distinguish between government deficit and debt', 'knowledge', 'beginner', 1),
    ('understand-public-debt', 'Analyze how public debt affects economic policy', 'analysis', 'intermediate', 2),
    ('understand-public-debt', 'Compare debt-to-GDP ratios across countries and time periods', 'analysis', 'intermediate', 3),
    ('understand-public-debt', 'Evaluate arguments about sustainable debt levels', 'evaluation', 'advanced', 4),
    
    ('analyze-government-spending', 'Identify major categories in government budgets', 'knowledge', 'beginner', 1),
    ('analyze-government-spending', 'Track changes in spending priorities over time', 'analysis', 'intermediate', 2),
    ('analyze-government-spending', 'Calculate per capita spending for government programs', 'application', 'intermediate', 3),
    ('analyze-government-spending', 'Evaluate the effectiveness and efficiency of public spending', 'evaluation', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- EMERGING TECHNOLOGY AWARENESS: Understanding technology impacts on society
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('understand-emerging-technologies', 'Identify key emerging technologies affecting society', 'knowledge', 'beginner', 1),
    ('understand-emerging-technologies', 'Explain basic principles of blockchain, AI, and biotechnology', 'comprehension', 'intermediate', 2),
    ('understand-emerging-technologies', 'Analyze potential societal impacts of emerging technologies', 'analysis', 'intermediate', 3),
    ('understand-emerging-technologies', 'Evaluate policy approaches to technology governance', 'evaluation', 'advanced', 4),
    
    ('evaluate-technology-ethics', 'Identify ethical issues in technology development and use', 'analysis', 'beginner', 1),
    ('evaluate-technology-ethics', 'Apply ethical frameworks to technology policy questions', 'application', 'intermediate', 2),
    ('evaluate-technology-ethics', 'Analyze trade-offs between innovation and precaution', 'analysis', 'intermediate', 3),
    ('evaluate-technology-ethics', 'Develop balanced approaches to technology governance', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- Update timestamps for new entries
UPDATE skill_learning_objectives SET created_at = NOW(), updated_at = NOW();
UPDATE skill_prerequisites SET created_at = NOW(), updated_at = NOW();

-- ====================
-- SKILL PROFICIENCY LEVELS AND ASSESSMENT CRITERIA
-- Framework for measuring skill mastery
-- ====================

-- Create table for assessment criteria if it doesn't exist
CREATE TABLE IF NOT EXISTS skill_assessment_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID REFERENCES skills(id),
    proficiency_level VARCHAR(20) NOT NULL,
    assessment_method VARCHAR(50) NOT NULL,
    passing_criteria TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add assessment criteria for foundational skills
INSERT INTO skill_assessment_criteria (skill_id, proficiency_level, assessment_method, passing_criteria)
SELECT 
    s.id,
    'beginner',
    'multiple_choice_quiz',
    'Score at least 70% on a 10-question quiz about basic information literacy concepts'
FROM skills s
WHERE s.skill_slug = 'check-sources';

INSERT INTO skill_assessment_criteria (skill_id, proficiency_level, assessment_method, passing_criteria)
SELECT 
    s.id,
    'intermediate',
    'source_evaluation_exercise',
    'Correctly evaluate the credibility of 8 out of 10 sample sources'
FROM skills s
WHERE s.skill_slug = 'check-sources';

INSERT INTO skill_assessment_criteria (skill_id, proficiency_level, assessment_method, passing_criteria)
SELECT 
    s.id,
    'advanced',
    'research_project',
    'Complete a research project using at least 5 credible sources with proper citation and evaluation'
FROM skills s
WHERE s.skill_slug = 'check-sources';

-- Set timestamps for assessment criteria
UPDATE skill_assessment_criteria SET created_at = NOW(), updated_at = NOW();

-- ====================
-- CROSS-CUTTING COMPETENCIES AND GLOBAL CITIZENSHIP
-- Skills that transcend specific civic domains and apply internationally
-- ====================

-- CROSS-CUTTING COMPETENCIES: Skills that apply across multiple civic domains
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, required_mastery_level, is_strict_requirement)
SELECT 
    dependent.id as skill_id,
    prereq.id as prerequisite_skill_id,
    'intermediate' as required_mastery_level,
    false as is_strict_requirement
FROM skills dependent, skills prereq 
WHERE (
    -- Critical thinking as a foundation for civic engagement
    (dependent.skill_slug = 'analyze-complex-problems' AND prereq.skill_slug = 'fact-check-claims') OR
    (dependent.skill_slug = 'evaluate-competing-arguments' AND prereq.skill_slug = 'analyze-complex-problems') OR
    (dependent.skill_slug = 'identify-logical-fallacies' AND prereq.skill_slug = 'evaluate-competing-arguments') OR
    
    -- Systems thinking for understanding interconnections
    (dependent.skill_slug = 'understand-systems-thinking' AND prereq.skill_slug = 'analyze-complex-problems') OR
    (dependent.skill_slug = 'map-system-relationships' AND prereq.skill_slug = 'understand-systems-thinking') OR
    (dependent.skill_slug = 'identify-leverage-points' AND prereq.skill_slug = 'map-system-relationships') OR
    
    -- Civic dialogue and deliberation
    (dependent.skill_slug = 'practice-civil-discourse' AND prereq.skill_slug = 'communicate-message') OR
    (dependent.skill_slug = 'facilitate-group-discussions' AND prereq.skill_slug = 'practice-civil-discourse') OR
    (dependent.skill_slug = 'bridge-political-divides' AND prereq.skill_slug = 'facilitate-group-discussions')
);

-- GLOBAL CITIZENSHIP: Understanding global issues and taking action
INSERT INTO skill_learning_objectives (skill_id, objective_text, objective_type, mastery_level_required, display_order)
SELECT s.id, objectives.objective_text, objectives.objective_type, objectives.mastery_level_required, objectives.display_order
FROM skills s, (VALUES
    ('understand-global-challenges', 'Identify major global challenges facing humanity', 'knowledge', 'beginner', 1),
    ('understand-global-challenges', 'Explain how global issues are interconnected', 'comprehension', 'intermediate', 2),
    ('understand-global-challenges', 'Analyze how global issues affect local communities', 'analysis', 'intermediate', 3),
    ('understand-global-challenges', 'Evaluate different approaches to addressing global challenges', 'evaluation', 'advanced', 4),
    
    ('participate-global-governance', 'Identify major international organizations and their functions', 'knowledge', 'beginner', 1),
    ('participate-global-governance', 'Understand how citizens can engage with global institutions', 'comprehension', 'intermediate', 2),
    ('participate-global-governance', 'Analyze the effectiveness of international agreements', 'analysis', 'intermediate', 3),
    ('participate-global-governance', 'Advocate for reforms to global governance structures', 'synthesis', 'advanced', 4),
    
    ('practice-sustainable-living', 'Calculate personal environmental footprint', 'application', 'beginner', 1),
    ('practice-sustainable-living', 'Implement sustainable practices in daily life', 'application', 'intermediate', 2),
    ('practice-sustainable-living', 'Evaluate the impact of lifestyle choices on sustainability', 'evaluation', 'intermediate', 3),
    ('practice-sustainable-living', 'Lead community sustainability initiatives', 'synthesis', 'advanced', 4),
    
    ('engage-intercultural-dialogue', 'Demonstrate respect for cultural differences', 'application', 'beginner', 1),
    ('engage-intercultural-dialogue', 'Compare perspectives across different cultural contexts', 'analysis', 'intermediate', 2),
    ('engage-intercultural-dialogue', 'Facilitate conversations across cultural divides', 'synthesis', 'intermediate', 3),
    ('engage-intercultural-dialogue', 'Build collaborative projects with diverse international partners', 'synthesis', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- SKILL PROGRESSION PATHWAYS: Defined learning journeys across skill categories
CREATE TABLE IF NOT EXISTS skill_progression_pathways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pathway_name VARCHAR(100) NOT NULL,
    pathway_description TEXT NOT NULL,
    difficulty_level VARCHAR(20) NOT NULL,
    estimated_hours INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pathway_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pathway_id UUID REFERENCES skill_progression_pathways(id),
    skill_id UUID REFERENCES skills(id),
    sequence_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example pathway: Informed Voter Pathway
INSERT INTO skill_progression_pathways (pathway_name, pathway_description, difficulty_level, estimated_hours)
VALUES (
    'Informed Voter',
    'Master the skills needed to make informed voting decisions in local, state, and federal elections',
    'beginner',
    10
);

-- Add skills to the Informed Voter pathway
WITH pathway AS (SELECT id FROM skill_progression_pathways WHERE pathway_name = 'Informed Voter')
INSERT INTO pathway_skills (pathway_id, skill_id, sequence_order, is_required)
SELECT 
    pathway.id,
    s.id,
    seq.order_num,
    TRUE
FROM 
    pathway,
    skills s,
    (VALUES 
        ('check-sources', 1),
        ('register-vote', 2),
        ('research-candidates', 3),
        ('understand-ballot', 4)
    ) AS seq(skill_slug, order_num)
WHERE s.skill_slug = seq.skill_slug;

-- Example pathway: Local Advocate Pathway
INSERT INTO skill_progression_pathways (pathway_name, pathway_description, difficulty_level, estimated_hours)
VALUES (
    'Local Advocate',
    'Develop skills to effectively advocate for change in your local community',
    'intermediate',
    20
);

-- Add skills to the Local Advocate pathway
WITH pathway AS (SELECT id FROM skill_progression_pathways WHERE pathway_name = 'Local Advocate')
INSERT INTO pathway_skills (pathway_id, skill_id, sequence_order, is_required)
SELECT 
    pathway.id,
    s.id,
    seq.order_num,
    seq.required
FROM 
    pathway,
    skills s,
    (VALUES 
        ('attend-local-meetings', 1, TRUE),
        ('speak-at-public-meetings', 2, TRUE),
        ('organize-petition-drives', 3, TRUE),
        ('build-community-coalitions', 4, TRUE)
    ) AS seq(skill_slug, order_num, required)
WHERE s.skill_slug = seq.skill_slug;

-- Set timestamps for new entries
UPDATE skill_progression_pathways SET created_at = NOW(), updated_at = NOW();
UPDATE pathway_skills SET created_at = NOW(), updated_at = NOW();

-- ====================
-- SKILL BADGES, ACHIEVEMENTS, AND MASTERY TRACKING
-- Gamification elements to encourage skill development
-- ====================

-- Create tables for skill badges if they don't exist
CREATE TABLE IF NOT EXISTS skill_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT NOT NULL,
    badge_icon VARCHAR(50) NOT NULL,
    badge_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badge_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_id UUID REFERENCES skill_badges(id),
    requirement_type VARCHAR(50) NOT NULL,
    requirement_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    badge_id UUID REFERENCES skill_badges(id),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed skill badges
INSERT INTO skill_badges (badge_name, badge_description, badge_icon, badge_level)
VALUES
    ('Information Detective', 'Mastered the art of finding and verifying information', '🔍', 'beginner'),
    ('Civic Navigator', 'Skilled at navigating government services and structures', '🧭', 'intermediate'),
    ('Digital Citizen', 'Proficient in using digital tools for civic engagement', '💻', 'intermediate'),
    ('Community Advocate', 'Developed skills to effectively advocate for community change', '📢', 'advanced'),
    ('Policy Analyst', 'Can analyze and evaluate complex policies and their impacts', '📊', 'advanced'),
    ('Global Thinker', 'Understands global issues and their interconnections', '🌐', 'advanced');

-- Add badge requirements
WITH badges AS (
    SELECT id, badge_name FROM skill_badges
)
INSERT INTO badge_requirements (badge_id, requirement_type, requirement_value)
VALUES
    ((SELECT id FROM badges WHERE badge_name = 'Information Detective'), 'skills_mastered', '{"skills": ["check-sources", "fact-check-claims", "find-public-info"], "minimum_level": "intermediate"}'),
    ((SELECT id FROM badges WHERE badge_name = 'Information Detective'), 'quiz_performance', '{"minimum_score": 80, "quiz_category": "information_literacy"}'),
    
    ((SELECT id FROM badges WHERE badge_name = 'Civic Navigator'), 'skills_mastered', '{"skills": ["understand-government-structure", "contact-representatives", "attend-meetings"], "minimum_level": "intermediate"}'),
    ((SELECT id FROM badges WHERE badge_name = 'Civic Navigator'), 'practical_application', '{"task": "attend_government_meeting", "verification": "submit_notes"}'),
    
    ((SELECT id FROM badges WHERE badge_name = 'Digital Citizen'), 'skills_mastered', '{"skills": ["evaluate-online-info", "protect-online-privacy", "spot-ai-generated-content"], "minimum_level": "intermediate"}'),
    ((SELECT id FROM badges WHERE badge_name = 'Digital Citizen'), 'quiz_performance', '{"minimum_score": 85, "quiz_category": "digital_literacy"}'),
    
    ((SELECT id FROM badges WHERE badge_name = 'Community Advocate'), 'skills_mastered', '{"skills": ["organize-for-change", "communicate-message", "build-coalitions"], "minimum_level": "intermediate"}'),
    ((SELECT id FROM badges WHERE badge_name = 'Community Advocate'), 'practical_application', '{"task": "community_project", "verification": "submit_documentation"}'),
    
    ((SELECT id FROM badges WHERE badge_name = 'Policy Analyst'), 'skills_mastered', '{"skills": ["break-down-complex-policies", "identify-policy-winners-losers", "compare-policy-options"], "minimum_level": "advanced"}'),
    ((SELECT id FROM badges WHERE badge_name = 'Policy Analyst'), 'project_completion', '{"project": "policy_analysis", "minimum_score": 80}'),
    
    ((SELECT id FROM badges WHERE badge_name = 'Global Thinker'), 'skills_mastered', '{"skills": ["understand-global-challenges", "follow-international-news", "participate-global-governance"], "minimum_level": "intermediate"}'),
    ((SELECT id FROM badges WHERE badge_name = 'Global Thinker'), 'quiz_performance', '{"minimum_score": 85, "quiz_category": "global_issues"}');

-- Create table for skill mastery tracking
CREATE TABLE IF NOT EXISTS skill_mastery_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    skill_id UUID REFERENCES skills(id),
    current_mastery_level VARCHAR(20) NOT NULL DEFAULT 'novice',
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_objectives JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for skill practice recommendations
CREATE TABLE IF NOT EXISTS skill_practice_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID REFERENCES skills(id),
    practice_type VARCHAR(50) NOT NULL,
    practice_description TEXT NOT NULL,
    difficulty_level VARCHAR(20) NOT NULL,
    estimated_minutes INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed practice recommendations for core skills
INSERT INTO skill_practice_recommendations (skill_id, practice_type, practice_description, difficulty_level, estimated_minutes)
SELECT 
    s.id,
    'interactive_exercise',
    'Evaluate the credibility of 5 different news sources using the SIFT method',
    'beginner',
    15
FROM skills s
WHERE s.skill_slug = 'check-sources';

INSERT INTO skill_practice_recommendations (skill_id, practice_type, practice_description, difficulty_level, estimated_minutes)
SELECT 
    s.id,
    'real_world_task',
    'Find and download your city''s most recent budget document',
    'beginner',
    10
FROM skills s
WHERE s.skill_slug = 'find-public-info';

INSERT INTO skill_practice_recommendations (skill_id, practice_type, practice_description, difficulty_level, estimated_minutes)
SELECT 
    s.id,
    'interactive_exercise',
    'Fact-check three claims from a recent political speech',
    'intermediate',
    20
FROM skills s
WHERE s.skill_slug = 'fact-check-claims';

INSERT INTO skill_practice_recommendations (skill_id, practice_type, practice_description, difficulty_level, estimated_minutes)
SELECT 
    s.id,
    'real_world_task',
    'Attend a local government meeting (in-person or virtual) and take notes on key issues discussed',
    'intermediate',
    60
FROM skills s
WHERE s.skill_slug = 'attend-local-meetings';

-- Set timestamps for badge-related tables
UPDATE skill_badges SET created_at = NOW(), updated_at = NOW();
UPDATE badge_requirements SET created_at = NOW(), updated_at = NOW();
UPDATE skill_practice_recommendations SET created_at = NOW(), updated_at = NOW();