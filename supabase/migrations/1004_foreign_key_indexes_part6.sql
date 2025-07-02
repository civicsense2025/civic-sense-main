-- Foreign Key Indexes Migration - Part 6
-- Remaining Skill, User, and School schema indexes
-- Generated: 2024-12-19

BEGIN;

-- Scheduled Content Jobs
CREATE INDEX IF NOT EXISTS idx_scheduled_content_jobs_updated_by 
ON public.scheduled_content_jobs(updated_by);

-- Shared Collection Access
CREATE INDEX IF NOT EXISTS idx_shared_collection_access_collection_id 
ON public.shared_collection_access(collection_id);

CREATE INDEX IF NOT EXISTS idx_shared_collection_access_shared_by_user_id 
ON public.shared_collection_access(shared_by_user_id);

CREATE INDEX IF NOT EXISTS idx_shared_collection_access_shared_with_user_id 
ON public.shared_collection_access(shared_with_user_id);

-- Skill Assessment Criteria
CREATE INDEX IF NOT EXISTS idx_skill_assessment_criteria_skill_id 
ON public.skill_assessment_criteria(skill_id);

-- Skill Learning Objectives
CREATE INDEX IF NOT EXISTS idx_skill_learning_objectives_skill_id 
ON public.skill_learning_objectives(skill_id);

-- Skill Mastery Tracking
CREATE INDEX IF NOT EXISTS idx_skill_mastery_tracking_skill_id 
ON public.skill_mastery_tracking(skill_id);

-- Skill Practice Recommendations
CREATE INDEX IF NOT EXISTS idx_skill_practice_recommendations_skill_id 
ON public.skill_practice_recommendations(skill_id);

-- Skill Relationships
CREATE INDEX IF NOT EXISTS idx_skill_relationships_target_skill_id 
ON public.skill_relationships(target_skill_id);

-- Source Credibility Indicators
CREATE INDEX IF NOT EXISTS idx_source_credibility_indicators_organization_id 
ON public.source_credibility_indicators(organization_id);

-- Spaced Repetition Schedule
CREATE INDEX IF NOT EXISTS idx_spaced_repetition_schedule_skill_id 
ON public.spaced_repetition_schedule(skill_id);

COMMIT; 