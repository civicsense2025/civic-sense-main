-- Corrected Skills Insertion
-- This snippet corrects the insertion of skills to use category_id instead of category_name.

INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill)
VALUES
    ('Understand Government Branches', 'understand-government-branches', (SELECT id FROM categories WHERE name = 'Government'), 'Learn how the executive, legislative, and judicial branches function and interact', 1, true),
    ('Read Government Budgets', 'read-budgets', (SELECT id FROM categories WHERE name = 'Government'), 'Understand where tax money goes and what governments prioritize', 2, true),
    ('Navigate Voting Procedures', 'voting-procedures', (SELECT id FROM categories WHERE name = 'Elections'), 'Understand registration requirements, voting methods, and deadlines', 1, true),
    ('Research Candidates', 'research-candidates', (SELECT id FROM categories WHERE name = 'Elections'), 'Look up candidates'' backgrounds, positions, and track records', 2, true),
    ('Check Sources', 'check-sources', (SELECT id FROM categories WHERE name = 'Media Literacy'), 'Verify whether news sources and websites are trustworthy', 1, true),
    ('Verify Claims', 'verify-claims', (SELECT id FROM categories WHERE name = 'Media Literacy'), 'Assess factual claims using multiple reliable sources', 2, true),
    ('Engage in Civil Discourse', 'civil-discourse', (SELECT id FROM categories WHERE name = 'Civic Engagement'), 'Discuss contentious issues respectfully while focusing on facts', 2, false),
    ('Understand Constitutional Rights', 'constitutional-rights', (SELECT id FROM categories WHERE name = 'Constitutional Rights'), 'Know your civil liberties and how they apply in different contexts', 2, true),
    ('Analyze Policy Impacts', 'policy-impact', (SELECT id FROM categories WHERE name = 'Law'), 'Identify how legislation affects different communities and issues', 3, true)
ON CONFLICT (skill_slug) DO NOTHING; 