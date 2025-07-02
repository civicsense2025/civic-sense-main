-- Foreign Key Indexes Migration - Part 1
-- Assessment, Badge, and Bias related indexes
-- Generated: 2024-12-19

BEGIN;

-- Assessment Questions
CREATE INDEX IF NOT EXISTS idx_assessment_questions_skill_id 
ON public.assessment_questions(skill_id);

-- Badge Requirements
CREATE INDEX IF NOT EXISTS idx_badge_requirements_badge_id 
ON public.badge_requirements(badge_id);

-- Bias Detection Patterns
CREATE INDEX IF NOT EXISTS idx_bias_detection_patterns_dimension_id 
ON public.bias_detection_patterns(dimension_id);

-- Bias Feedback
CREATE INDEX IF NOT EXISTS idx_bias_feedback_dimension_id 
ON public.bias_feedback(dimension_id);

CREATE INDEX IF NOT EXISTS idx_bias_feedback_organization_id 
ON public.bias_feedback(organization_id);

CREATE INDEX IF NOT EXISTS idx_bias_feedback_verified_by 
ON public.bias_feedback(verified_by);

-- Bias Learning Events
CREATE INDEX IF NOT EXISTS idx_bias_learning_events_dimension_id 
ON public.bias_learning_events(dimension_id);

COMMIT; 