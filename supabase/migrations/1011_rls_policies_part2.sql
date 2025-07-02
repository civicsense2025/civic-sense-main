-- Comprehensive RLS Policies for CivicSense - Part 2: Skills and Assessment Content
-- Addresses security warnings while maintaining proper guest access
-- Created: 2024

BEGIN;

-- =============================================================================
-- SKILLS AND QUESTION MAPPING (Public read access)
-- =============================================================================

-- Question Skills - Public read access for skill mapping
ALTER TABLE question_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Question skills are publicly readable"
ON question_skills FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage question skills"
ON question_skills FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update question skills"
ON question_skills FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete question skills"
ON question_skills FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- ASSESSMENT AND LEARNING CONTENT (Public read access)
-- =============================================================================

-- Assessment Questions - Public read access
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assessment questions are publicly readable"
ON assessment_questions FOR SELECT
USING (is_active = true);

-- Assessment Scoring - Public read access
ALTER TABLE assessment_scoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assessment scoring is publicly readable"
ON assessment_scoring FOR SELECT
USING (true);

-- Skills system - Public read access
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skills are publicly readable"
ON skills FOR SELECT
USING (is_active = true);

ALTER TABLE skill_learning_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skill learning objectives are publicly readable"
ON skill_learning_objectives FOR SELECT
USING (true);

ALTER TABLE skill_prerequisites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skill prerequisites are publicly readable"
ON skill_prerequisites FOR SELECT
USING (true);

ALTER TABLE skill_assessment_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skill assessment criteria are publicly readable"
ON skill_assessment_criteria FOR SELECT
USING (true);

ALTER TABLE skill_progression_pathways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skill progression pathways are publicly readable"
ON skill_progression_pathways FOR SELECT
USING (is_active = true);

ALTER TABLE pathway_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pathway skills are publicly readable"
ON pathway_skills FOR SELECT
USING (true);

ALTER TABLE skill_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skill badges are publicly readable"
ON skill_badges FOR SELECT
USING (is_active = true);

ALTER TABLE badge_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badge requirements are publicly readable"
ON badge_requirements FOR SELECT
USING (true);

COMMIT; 