-- Foreign Key Indexes Migration - Part 5
-- NPC, Pathway, Pod, and Skill related indexes
-- Generated: 2024-12-19

BEGIN;

-- NPC Chat Templates
CREATE INDEX IF NOT EXISTS idx_npc_chat_templates_npc_id 
ON public.npc_chat_templates(npc_id);

-- NPC Question Responses
CREATE INDEX IF NOT EXISTS idx_npc_question_responses_attempt_id 
ON public.npc_question_responses(attempt_id);

-- Pathway Skills
CREATE INDEX IF NOT EXISTS idx_pathway_skills_pathway_id 
ON public.pathway_skills(pathway_id);

CREATE INDEX IF NOT EXISTS idx_pathway_skills_skill_id 
ON public.pathway_skills(skill_id);

-- Pod Join Requests
CREATE INDEX IF NOT EXISTS idx_pod_join_requests_invite_link_id 
ON public.pod_join_requests(invite_link_id);

CREATE INDEX IF NOT EXISTS idx_pod_join_requests_reviewed_by 
ON public.pod_join_requests(reviewed_by);

-- Pod Member Analytics
CREATE INDEX IF NOT EXISTS idx_pod_member_analytics_user_id 
ON public.pod_member_analytics(user_id);

-- Pod Memberships
CREATE INDEX IF NOT EXISTS idx_pod_memberships_invited_by 
ON public.pod_memberships(invited_by);

-- Pod Partnerships
CREATE INDEX IF NOT EXISTS idx_pod_partnerships_initiated_by 
ON public.pod_partnerships(initiated_by);

CREATE INDEX IF NOT EXISTS idx_pod_partnerships_pod_2_id 
ON public.pod_partnerships(pod_2_id);

-- Pod Ratings
CREATE INDEX IF NOT EXISTS idx_pod_ratings_user_id 
ON public.pod_ratings(user_id);

COMMIT; 