-- CivicSense Skill Relationships and Learning Objectives Seed
-- Philosophy: Build foundational skills first, "understand" skills are capstone achievements
-- Focus: Create logical learning progressions and concrete, measurable objectives

-- ====================
-- SKILL PREREQUISITES SEED
-- Building logical learning progressions
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
    -- Organizing for change requires multiple civic skills
    (dependent.skill_slug = 'organize-for-change' AND prereq.skill_slug = 'communicate-message') OR
    (dependent.skill_slug = 'organize-for-change' AND prereq.skill_slug = 'build-coalitions') OR
    (dependent.skill_slug = 'plan-campaigns' AND prereq.skill_slug = 'organize-for-change') OR
    
    -- Running for office requires comprehensive civic skills
    (dependent.skill_slug = 'run-for-office' AND prereq.skill_slug = 'plan-campaigns') OR
    (dependent.skill_slug = 'run-for-office' AND prereq.skill_slug = 'speak-at-public-meetings') OR
    (dependent.skill_slug = 'run-for-office' AND prereq.skill_slug = 'track-campaign-finance')
);

-- ====================
-- SKILL LEARNING OBJECTIVES SEED
-- Concrete, measurable objectives for skill mastery
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
    ('plan-campaigns', 'Evaluate campaign effectiveness and adjust strategies', 'evaluation', 'advanced', 4)
) AS objectives(skill_slug, objective_text, objective_type, mastery_level_required, display_order)
WHERE s.skill_slug = objectives.skill_slug;

-- Add completion timestamps
UPDATE skill_learning_objectives SET created_at = NOW(), updated_at = NOW();
UPDATE skill_prerequisites SET created_at = NOW(), updated_at = NOW(); 