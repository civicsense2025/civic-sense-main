-- ============================================
-- CivicSense Question-Skill Mapping Script
-- ============================================
-- This script creates relationships between questions and skills
-- based on content analysis and category matching
-- Uses the actual database schema with UUIDs and skill_weight
-- ============================================

BEGIN;

-- Create the question_skills junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS question_skills (
    id SERIAL PRIMARY KEY,
    question_id UUID NOT NULL,
    skill_id UUID NOT NULL,
    skill_weight DECIMAL(3, 2) NOT NULL,
    is_primary_skill BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE(question_id, skill_id)
);

-- ============================================
-- CATEGORY-BASED SKILL MAPPINGS
-- ============================================

-- Government Category Questions -> Government Skills
INSERT INTO question_skills (question_id, skill_id, skill_weight, is_primary_skill)
SELECT DISTINCT 
    q.id as question_id,
    s.id as skill_id,
    CASE 
        WHEN q.category = 'Government' AND s.category_id = (SELECT id FROM categories WHERE name = 'Government') THEN 1.0
        WHEN q.category IN ('Public Policy', 'Policy Analysis') AND s.skill_slug IN ('legislative-process', 'executive-powers', 'federal-vs-state-power') THEN 0.8
        ELSE 0.6
    END as skill_weight,
    CASE 
        WHEN q.category = 'Government' AND s.skill_slug IN ('legislative-process', 'executive-powers', 'checks-and-balances') THEN true
        ELSE false
    END as is_primary_skill
FROM questions q
CROSS JOIN skills s
JOIN categories c ON s.category_id = c.id
WHERE q.category = 'Government' 
AND c.name = 'Government'
AND NOT EXISTS (SELECT 1 FROM question_skills qs WHERE qs.question_id = q.id AND qs.skill_id = s.id);

-- Constitutional Law Questions -> Constitutional Law Skills
INSERT INTO question_skills (question_id, skill_id, skill_weight, is_primary_skill)
SELECT DISTINCT 
    q.id as question_id,
    s.id as skill_id,
    CASE 
        WHEN q.tags::text ILIKE '%constitution%' AND s.skill_slug IN ('constitutional-interpretation', 'separation-of-powers') THEN 1.0
        WHEN q.tags::text ILIKE '%president%' AND s.skill_slug = 'separation-of-powers' THEN 0.9
        WHEN q.tags::text ILIKE '%congress%' AND s.skill_slug = 'separation-of-powers' THEN 0.9
        WHEN q.tags::text ILIKE '%judicial%' AND s.skill_slug = 'separation-of-powers' THEN 0.9
        WHEN q.tags::text ILIKE '%rights%' AND s.skill_slug = 'bill-of-rights' THEN 0.8
        ELSE 0.7
    END as skill_weight,
    CASE 
        WHEN q.category = 'Constitutional Law' AND s.skill_slug IN ('constitutional-interpretation', 'separation-of-powers', 'bill-of-rights') THEN true
        ELSE false
    END as is_primary_skill
FROM questions q
CROSS JOIN skills s
JOIN categories c ON s.category_id = c.id
WHERE q.category = 'Constitutional Law' 
AND c.name = 'Constitutional Law'
AND NOT EXISTS (SELECT 1 FROM question_skills qs WHERE qs.question_id = q.id AND qs.skill_id = s.id);

-- Elections Questions -> Elections Skills (if they exist)
INSERT INTO question_skills (question_id, skill_id, skill_weight, is_primary_skill)
SELECT DISTINCT 
    q.id as question_id,
    s.id as skill_id,
    CASE 
        WHEN q.question ILIKE '%candidate%' THEN 0.9
        WHEN q.question ILIKE '%vote%' OR q.question ILIKE '%voting%' THEN 1.0
        WHEN q.question ILIKE '%campaign%' THEN 0.8
        ELSE 0.6
    END as skill_weight,
    CASE 
        WHEN q.question ILIKE '%vote%' OR q.question ILIKE '%voting%' THEN true
        ELSE false
    END as is_primary_skill
FROM questions q
CROSS JOIN skills s
JOIN categories c ON s.category_id = c.id
WHERE q.category = 'Elections' 
AND c.name = 'Elections'
AND NOT EXISTS (SELECT 1 FROM question_skills qs WHERE qs.question_id = q.id AND qs.skill_id = s.id);

-- Civil Rights Questions -> Constitutional Law Skills (Bill of Rights, Equal Protection)
INSERT INTO question_skills (question_id, skill_id, skill_weight, is_primary_skill)
SELECT DISTINCT 
    q.id as question_id,
    s.id as skill_id,
    CASE 
        WHEN q.question ILIKE '%rights%' AND s.skill_slug = 'bill-of-rights' THEN 1.0
        WHEN q.question ILIKE '%discrimination%' AND s.skill_slug = 'equal-protection' THEN 1.0
        WHEN q.question ILIKE '%due process%' AND s.skill_slug = 'due-process' THEN 1.0
        WHEN q.question ILIKE '%first amendment%' AND s.skill_slug = 'first-amendment-rights' THEN 1.0
        ELSE 0.7
    END as skill_weight,
    CASE 
        WHEN s.skill_slug IN ('bill-of-rights', 'equal-protection', 'first-amendment-rights') THEN true
        ELSE false
    END as is_primary_skill
FROM questions q
CROSS JOIN skills s
JOIN categories c ON s.category_id = c.id
WHERE q.category = 'Civil Rights' 
AND c.name = 'Constitutional Law'
AND s.skill_slug IN ('bill-of-rights', 'equal-protection', 'due-process', 'first-amendment-rights')
AND NOT EXISTS (SELECT 1 FROM question_skills qs WHERE qs.question_id = q.id AND qs.skill_id = s.id);

-- ============================================
-- CROSS-CATEGORY SKILL MAPPINGS
-- ============================================

-- Judicial Review questions should map to Constitutional Law skills
INSERT INTO question_skills (question_id, skill_id, skill_weight, is_primary_skill)
SELECT DISTINCT 
    q.id as question_id,
    s.id as skill_id,
    CASE 
        WHEN q.question ILIKE '%court%' OR q.question ILIKE '%judge%' THEN 0.8
        WHEN q.question ILIKE '%supreme court%' AND s.skill_slug = 'constitutional-interpretation' THEN 1.0
        WHEN q.question ILIKE '%constitutional%' AND s.skill_slug = 'constitutional-interpretation' THEN 0.9
        ELSE 0.6
    END as skill_weight,
    CASE 
        WHEN q.question ILIKE '%supreme court%' AND s.skill_slug = 'constitutional-interpretation' THEN true
        ELSE false
    END as is_primary_skill
FROM questions q
CROSS JOIN skills s
JOIN categories c ON s.category_id = c.id
WHERE q.category = 'Judicial Review' 
AND c.name = 'Constitutional Law'
AND NOT EXISTS (SELECT 1 FROM question_skills qs WHERE qs.question_id = q.id AND qs.skill_id = s.id);

-- Public Policy questions should map to Government skills
INSERT INTO question_skills (question_id, skill_id, skill_weight, is_primary_skill)
SELECT DISTINCT 
    q.id as question_id,
    s.id as skill_id,
    CASE 
        WHEN q.question ILIKE '%policy%' AND s.skill_slug = 'legislative-process' THEN 0.9
        WHEN q.question ILIKE '%executive%' AND s.skill_slug = 'executive-powers' THEN 0.9
        WHEN q.question ILIKE '%federal%' AND q.question ILIKE '%state%' AND s.skill_slug = 'federal-vs-state-power' THEN 1.0
        ELSE 0.6
    END as skill_weight,
    CASE 
        WHEN s.skill_slug IN ('legislative-process', 'executive-powers', 'federal-vs-state-power') THEN true
        ELSE false
    END as is_primary_skill
FROM questions q
CROSS JOIN skills s
JOIN categories c ON s.category_id = c.id
WHERE q.category = 'Public Policy' 
AND c.name = 'Government'
AND NOT EXISTS (SELECT 1 FROM question_skills qs WHERE qs.question_id = q.id AND qs.skill_id = s.id);

-- ============================================
-- CONTENT-BASED SKILL MAPPINGS
-- ============================================

-- Questions about federal vs state issues -> Federal vs State Power skill
INSERT INTO question_skills (question_id, skill_id, skill_weight, is_primary_skill)
SELECT DISTINCT 
    q.id as question_id,
    s.id as skill_id,
    0.9 as skill_weight,
    true as is_primary_skill
FROM questions q
CROSS JOIN skills s
WHERE (q.question ILIKE '%federal%' AND q.question ILIKE '%state%')
AND s.skill_slug = 'federal-vs-state-power'
AND NOT EXISTS (SELECT 1 FROM question_skills qs WHERE qs.question_id = q.id AND qs.skill_id = s.id);

-- Questions about separation of powers concepts
INSERT INTO question_skills (question_id, skill_id, skill_weight, is_primary_skill)
SELECT DISTINCT 
    q.id as question_id,
    s.id as skill_id,
    CASE 
        WHEN q.question ILIKE '%separation of powers%' THEN 1.0
        WHEN q.question ILIKE '%checks and balances%' THEN 0.9
        WHEN q.question ILIKE '%executive%' AND q.question ILIKE '%legislative%' THEN 0.8
        WHEN q.question ILIKE '%president%' AND q.question ILIKE '%congress%' THEN 0.8
        ELSE 0.7
    END as skill_weight,
    CASE 
        WHEN q.question ILIKE '%separation of powers%' OR q.question ILIKE '%checks and balances%' THEN true
        ELSE false
    END as is_primary_skill
FROM questions q
CROSS JOIN skills s
WHERE (
    q.question ILIKE '%separation of powers%' OR 
    q.question ILIKE '%checks and balances%' OR
    (q.question ILIKE '%executive%' AND q.question ILIKE '%legislative%') OR
    (q.question ILIKE '%president%' AND q.question ILIKE '%congress%')
)
AND s.skill_slug IN ('separation-of-powers', 'checks-and-balances')
AND NOT EXISTS (SELECT 1 FROM question_skills qs WHERE qs.question_id = q.id AND qs.skill_id = s.id);

-- Questions about constitutional interpretation
INSERT INTO question_skills (question_id, skill_id, skill_weight, is_primary_skill)
SELECT DISTINCT 
    q.id as question_id,
    s.id as skill_id,
    CASE 
        WHEN q.explanation ILIKE '%constitution%' AND q.explanation ILIKE '%interpret%' THEN 1.0
        WHEN q.question ILIKE '%constitutional%' THEN 0.9
        WHEN q.explanation ILIKE '%amendment%' THEN 0.8
        ELSE 0.7
    END as skill_weight,
    CASE 
        WHEN q.explanation ILIKE '%constitution%' AND q.explanation ILIKE '%interpret%' THEN true
        ELSE false
    END as is_primary_skill
FROM questions q
CROSS JOIN skills s
WHERE (
    q.explanation ILIKE '%constitution%' OR 
    q.question ILIKE '%constitutional%' OR
    q.explanation ILIKE '%amendment%'
)
AND s.skill_slug = 'constitutional-interpretation'
AND NOT EXISTS (SELECT 1 FROM question_skills qs WHERE qs.question_id = q.id AND qs.skill_id = s.id);

-- ============================================
-- VERIFICATION AND CLEANUP
-- ============================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_skills_question_id ON question_skills(question_id);
CREATE INDEX IF NOT EXISTS idx_question_skills_skill_id ON question_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_question_skills_skill_weight ON question_skills(skill_weight);
CREATE INDEX IF NOT EXISTS idx_question_skills_is_primary_skill ON question_skills(is_primary_skill);

-- Summary query to show mapping results
SELECT 
    'Mapping Summary' as report_type,
    COUNT(DISTINCT question_id) as questions_mapped,
    COUNT(DISTINCT skill_id) as skills_used,
    COUNT(*) as total_mappings,
    ROUND(AVG(skill_weight)::NUMERIC, 2) as avg_skill_weight,
    COUNT(*) FILTER (WHERE is_primary_skill = true) as primary_skill_mappings
FROM question_skills;

-- Show top skill mappings by category
SELECT 
    c.name as category,
    s.skill_name,
    COUNT(*) as question_count,
    ROUND(AVG(qs.skill_weight)::NUMERIC, 2) as avg_weight,
    COUNT(*) FILTER (WHERE qs.is_primary_skill = true) as primary_mappings
FROM question_skills qs
JOIN skills s ON qs.skill_id = s.id
JOIN categories c ON s.category_id = c.id
GROUP BY c.name, s.skill_name
HAVING COUNT(*) >= 1
ORDER BY c.name, question_count DESC;

-- Show questions with the most skill mappings
SELECT 
    q.id,
    q.question_number,
    q.category,
    LEFT(q.question, 50) || '...' as question_preview,
    COUNT(qs.skill_id) as skill_count,
    COUNT(*) FILTER (WHERE qs.is_primary_skill = true) as primary_skills
FROM questions q
JOIN question_skills qs ON q.id = qs.question_id
GROUP BY q.id, q.question_number, q.category, q.question
ORDER BY skill_count DESC
LIMIT 10;

COMMIT; 