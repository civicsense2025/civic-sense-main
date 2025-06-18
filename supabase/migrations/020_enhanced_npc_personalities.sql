-- =============================================================================
-- ENHANCED NPC PERSONALITIES MIGRATION
-- =============================================================================
-- Adds personalization columns and creates 20 diverse, lifelike NPCs

BEGIN;

-- =============================================================================
-- ENHANCE NPC PERSONALITIES TABLE
-- =============================================================================

-- Add new columns for better personalization
ALTER TABLE npc_personalities ADD COLUMN IF NOT EXISTS first_name VARCHAR(50);
ALTER TABLE npc_personalities ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);
ALTER TABLE npc_personalities ADD COLUMN IF NOT EXISTS byline VARCHAR(200);
ALTER TABLE npc_personalities ADD COLUMN IF NOT EXISTS background_story TEXT;
ALTER TABLE npc_personalities ADD COLUMN IF NOT EXISTS age_range VARCHAR(20);
ALTER TABLE npc_personalities ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE npc_personalities ADD COLUMN IF NOT EXISTS profession VARCHAR(100);
ALTER TABLE npc_personalities ADD COLUMN IF NOT EXISTS political_engagement_level VARCHAR(20) DEFAULT 'moderate';
ALTER TABLE npc_personalities ADD COLUMN IF NOT EXISTS communication_style VARCHAR(50) DEFAULT 'conversational';
ALTER TABLE npc_personalities ADD COLUMN IF NOT EXISTS preferred_topics TEXT[];
ALTER TABLE npc_personalities ADD COLUMN IF NOT EXISTS learning_motivation VARCHAR(200);

-- Update display_name to be computed from first_name and last_name
-- (We'll populate this in the seed data)

-- =============================================================================
-- CLEAR EXISTING NPC DATA
-- =============================================================================

-- Remove existing NPCs and their related data
DELETE FROM npc_category_specializations;
DELETE FROM npc_chat_templates;
DELETE FROM npc_personalities;

-- =============================================================================
-- SEED 20 DIVERSE NPC PERSONALITIES
-- =============================================================================

-- Insert diverse NPCs representing different backgrounds, ages, and civic engagement levels
INSERT INTO npc_personalities (
  npc_code, display_name, first_name, last_name, emoji, byline, description, 
  personality_type, base_skill_level, age_range, location, profession,
  base_accuracy_min, base_accuracy_max, response_time_min, response_time_max,
  confidence_level, consistency_factor, chattiness_level, encouragement_style, humor_level,
  political_engagement_level, communication_style, background_story, learning_motivation,
  preferred_topics
) VALUES 

-- BEGINNERS (New to Civic Engagement)
(
  'maya_college', 'Maya Chen', 'Maya', 'Chen', '👩🏻‍🎓',
  'College sophomore discovering her civic voice',
  'A 19-year-old college student taking her first political science class. Curious and eager to learn, but sometimes overwhelmed by complex political systems.',
  'newcomer', 'beginner', '18-25', 'Austin, TX', 'College Student',
  30, 55, 12, 25, 0.4, 0.6, 4, 'supportive', 4,
  'low', 'casual', 'Maya grew up in a family that rarely discussed politics. College opened her eyes to how government affects her daily life, from student loans to campus policies.',
  'Wants to be an informed voter and understand how to make a difference in her community',
  ARRAY['voting_basics', 'student_rights', 'local_politics']
),

(
  'david_newcomer', 'David Rodriguez', 'David', 'Rodriguez', '👨🏽‍💼',
  'New citizen eager to participate in democracy',
  'Recently became a U.S. citizen and is passionate about understanding his new civic responsibilities. Brings fresh perspective from his international background.',
  'newcomer', 'beginner', '26-35', 'Phoenix, AZ', 'Software Engineer',
  35, 60, 10, 20, 0.5, 0.7, 3, 'analytical', 2,
  'moderate', 'thoughtful', 'David immigrated from Mexico five years ago. His naturalization ceremony inspired him to deeply understand American civic institutions.',
  'Wants to be a responsible citizen and help other immigrants navigate civic participation',
  ARRAY['citizenship', 'immigration_policy', 'voting_rights']
),

(
  'sarah_parent', 'Sarah Williams', 'Sarah', 'Williams', '👩🏾‍💻',
  'Working mom getting involved for her kids',
  'A busy parent who started paying attention to politics when school board decisions affected her children. Learning to balance family life with civic engagement.',
  'parent_activist', 'beginner', '36-45', 'Raleigh, NC', 'Marketing Manager',
  40, 65, 8, 18, 0.6, 0.8, 3, 'supportive', 3,
  'moderate', 'practical', 'Sarah never cared much about politics until her kids\' school faced budget cuts. Now she realizes local politics affects families every day.',
  'Wants to create a better future for her children through informed civic participation',
  ARRAY['education_policy', 'local_government', 'family_issues']
),

(
  'tyler_gamer', 'Tyler Brooks', 'Tyler', 'Brooks', '👨🏻‍💻',
  'Gamer learning politics affects his world too',
  'A 22-year-old who spends most time gaming but recently discovered how tech policy and internet freedom connect to politics. Skeptical but curious.',
  'digital_native', 'beginner', '18-25', 'Seattle, WA', 'Twitch Streamer',
  25, 50, 15, 30, 0.3, 0.5, 5, 'casual', 5,
  'low', 'informal', 'Tyler mostly ignored politics until net neutrality debates affected his streaming. Now he\'s slowly learning how government impacts digital life.',
  'Wants to protect internet freedom and understand how politics affects gaming and tech',
  ARRAY['tech_policy', 'digital_rights', 'free_speech']
),

-- INTERMEDIATE (Moderately Engaged)
(
  'james_veteran', 'James Thompson', 'James', 'Thompson', '👨🏿‍✈️',
  'Military veteran committed to civic duty',
  'Army veteran who served two tours overseas. Has strong opinions about civic responsibility and gets frustrated when people don\'t vote.',
  'veteran', 'intermediate', '26-35', 'Colorado Springs, CO', 'VA Counselor',
  55, 75, 6, 12, 0.8, 0.9, 2, 'formal', 2,
  'high', 'straightforward', 'James enlisted at 18 and learned about duty and service in the military. He believes every citizen should be as committed to democracy as soldiers are.',
  'Wants to inspire others to take civic duty as seriously as military service',
  ARRAY['veterans_affairs', 'national_security', 'civic_duty']
),

(
  'lisa_teacher', 'Lisa Park', 'Lisa', 'Park', '👩🏻‍🏫',
  'High school teacher making civics relevant',
  'Social studies teacher who tries to make government interesting for teenagers. Knows theory well but stays current on real-world applications.',
  'educator', 'intermediate', '26-35', 'Madison, WI', 'High School Teacher',
  60, 80, 7, 14, 0.7, 0.85, 3, 'supportive', 3,
  'moderate', 'educational', 'Lisa became a teacher to help young people understand their power in democracy. She works hard to make civics relevant to teenagers\' lives.',
  'Wants to inspire the next generation of engaged citizens through education',
  ARRAY['civic_education', 'youth_engagement', 'constitutional_law']
),

(
  'marcus_union', 'Marcus Johnson', 'Marcus', 'Johnson', '👨🏿‍🔧',
  'Union organizer fighting for workers',
  'Labor union representative who understands how policy affects working families. Great at explaining economic impacts of political decisions.',
  'labor_organizer', 'intermediate', '36-45', 'Detroit, MI', 'Union Representative',
  50, 70, 8, 16, 0.75, 0.8, 4, 'competitive', 3,
  'high', 'persuasive', 'Marcus grew up in a union family and learned early that politics determines workers\' rights. He fights for policies that help working families.',
  'Wants to ensure working families have a voice in government decisions',
  ARRAY['labor_rights', 'economic_policy', 'workers_compensation']
),

(
  'anna_journalist', 'Anna Foster', 'Anna', 'Foster', '👩🏼‍💼',
  'Local reporter covering city hall',
  'Investigative journalist who covers local government. Excellent at finding connections between policy and real-world impacts, but sometimes cynical.',
  'journalist', 'intermediate', '26-35', 'Portland, OR', 'Journalist',
  65, 85, 5, 10, 0.85, 0.75, 2, 'analytical', 4,
  'high', 'investigative', 'Anna started covering city council meetings and discovered how much local politics affects daily life. She\'s passionate about government transparency.',
  'Wants to help citizens understand how government really works behind the scenes',
  ARRAY['government_transparency', 'local_politics', 'investigative_journalism']
),

(
  'carlos_activist', 'Carlos Mendez', 'Carlos', 'Mendez', '👨🏽‍🎨',
  'Community organizer for social justice',
  'Grassroots activist who organizes protests and voter registration drives. Passionate about social justice but sometimes impatient with slow political processes.',
  'community_organizer', 'intermediate', '26-35', 'Los Angeles, CA', 'Community Organizer',
  45, 70, 10, 18, 0.7, 0.6, 5, 'competitive', 2,
  'high', 'activist', 'Carlos started organizing in college after seeing how immigration raids affected his community. He believes in direct action and grassroots change.',
  'Wants to build power for marginalized communities through political engagement',
  ARRAY['social_justice', 'immigration_rights', 'community_organizing']
),

(
  'emma_nonprofit', 'Emma Davis', 'Emma', 'Davis', '👩🏻‍⚕️',
  'Nonprofit director advocating for healthcare',
  'Runs a community health nonprofit and advocates for healthcare policy. Understands how legislation affects vulnerable populations.',
  'nonprofit_leader', 'intermediate', '36-45', 'Atlanta, GA', 'Nonprofit Director',
  55, 75, 6, 14, 0.8, 0.85, 3, 'supportive', 2,
  'moderate', 'empathetic', 'Emma became a healthcare advocate after her sister couldn\'t afford insulin. She learned that policy changes can literally save lives.',
  'Wants to ensure healthcare policy serves the most vulnerable in our communities',
  ARRAY['healthcare_policy', 'social_services', 'nonprofit_advocacy']
),

-- ADVANCED (Highly Engaged)
(
  'robert_mayor', 'Robert Kim', 'Robert', 'Kim', '👨🏻‍💼',
  'Small-town mayor balancing local needs',
  'Mayor of a mid-sized city who deals with budget constraints, competing interests, and state/federal mandates. Practical understanding of governance.',
  'elected_official', 'advanced', '46-55', 'Burlington, VT', 'Mayor',
  70, 85, 5, 10, 0.9, 0.9, 2, 'formal', 2,
  'high', 'political', 'Robert ran for mayor to fix potholes and ended up learning about complex intergovernmental relationships. He balances idealism with pragmatism.',
  'Wants to show how effective local government can improve people\'s daily lives',
  ARRAY['local_government', 'municipal_finance', 'intergovernmental_relations']
),

(
  'diane_lobbyist', 'Diane Wilson', 'Diane', 'Wilson', '👩🏾‍💼',
  'Environmental lobbyist navigating Capitol Hill',
  'Professional lobbyist for environmental groups. Understands the legislative process inside and out, including the behind-the-scenes negotiations.',
  'lobbyist', 'advanced', '36-45', 'Washington, DC', 'Environmental Lobbyist',
  75, 90, 4, 8, 0.95, 0.85, 2, 'analytical', 1,
  'high', 'professional', 'Diane started as an environmental scientist but moved to lobbying to create policy change. She knows how bills really become laws.',
  'Wants to use insider knowledge to help others understand how to influence policy',
  ARRAY['legislative_process', 'environmental_policy', 'lobbying_ethics']
),

(
  'michael_lawyer', 'Michael Chang', 'Michael', 'Chang', '👨🏻‍⚖️',
  'Constitutional lawyer defending civil rights',
  'Civil rights attorney who argues cases before federal courts. Deep understanding of constitutional law and how legal precedents shape policy.',
  'civil_rights_lawyer', 'advanced', '36-45', 'San Francisco, CA', 'Civil Rights Attorney',
  80, 95, 6, 12, 0.9, 0.95, 1, 'formal', 1,
  'high', 'legal', 'Michael chose law to fight discrimination. He\'s argued before the Supreme Court and understands how legal strategy shapes civil rights.',
  'Wants to help people understand how constitutional rights protect everyone',
  ARRAY['constitutional_law', 'civil_rights', 'supreme_court_cases']
),

(
  'rachel_staffer', 'Rachel Adams', 'Rachel', 'Adams', '👩🏼‍💻',
  'Congressional staffer who writes the bills',
  'Senior legislative aide who drafts bills and briefs members of Congress. Understands the practical details of how policy gets made.',
  'congressional_staffer', 'advanced', '26-35', 'Washington, DC', 'Legislative Director',
  70, 88, 5, 11, 0.85, 0.9, 3, 'analytical', 2,
  'high', 'insider', 'Rachel started as an intern and worked her way up. She\'s written dozens of bills and knows the difference between good policy and good politics.',
  'Wants to demystify how Congress really works beyond what people see on TV',
  ARRAY['legislative_drafting', 'congressional_process', 'policy_analysis']
),

(
  'thomas_professor', 'Thomas Lee', 'Thomas', 'Lee', '👨🏻‍🎓',
  'Political science professor and researcher',
  'University professor who studies American political institutions. Combines academic research with real-world political experience.',
  'political_scientist', 'advanced', '46-55', 'Chapel Hill, NC', 'Political Science Professor',
  75, 92, 8, 15, 0.85, 0.95, 2, 'analytical', 1,
  'moderate', 'academic', 'Thomas spent years studying political behavior and institutions. He bridges the gap between academic research and practical politics.',
  'Wants to help people understand politics through evidence-based analysis',
  ARRAY['political_institutions', 'electoral_systems', 'political_behavior']
),

-- EXPERTS (Deep Specialists)
(
  'helen_judge', 'Helen Rodriguez', 'Helen', 'Rodriguez', '👩🏽‍⚖️',
  'Retired federal judge with constitutional expertise',
  'Former federal appellate judge with 25 years on the bench. Unparalleled understanding of constitutional interpretation and judicial processes.',
  'federal_judge', 'expert', '56-65', 'Denver, CO', 'Retired Federal Judge',
  85, 98, 8, 16, 0.95, 0.98, 1, 'formal', 1,
  'moderate', 'authoritative', 'Helen served on the federal bench for 25 years, writing opinions that shaped constitutional law. She believes in the rule of law above politics.',
  'Wants to help citizens understand how the judicial system protects constitutional rights',
  ARRAY['constitutional_interpretation', 'judicial_process', 'federal_courts']
),

(
  'william_diplomat', 'William Scott', 'William', 'Scott', '👨🏿‍💼',
  'Former ambassador specializing in foreign policy',
  'Career diplomat who served as ambassador to three countries. Expert in international relations and how foreign policy affects domestic politics.',
  'diplomat', 'expert', '56-65', 'Georgetown, DC', 'Retired Ambassador',
  80, 95, 6, 12, 0.9, 0.9, 2, 'formal', 2,
  'moderate', 'international', 'William spent 30 years in the Foreign Service, serving in Europe, Asia, and Africa. He understands how international events shape domestic policy.',
  'Wants to help Americans understand how foreign policy affects their daily lives',
  ARRAY['foreign_policy', 'international_relations', 'diplomatic_history']
),

(
  'maria_economist', 'Maria Gonzalez', 'Maria', 'Gonzalez', '👩🏽‍💼',
  'Former Fed economist tracking policy impacts',
  'Former Federal Reserve economist who specialized in fiscal policy. Understands the complex relationship between government spending and economic outcomes.',
  'economist', 'expert', '46-55', 'New York, NY', 'Economic Policy Consultant',
  82, 94, 7, 13, 0.9, 0.92, 2, 'analytical', 1,
  'moderate', 'technical', 'Maria worked at the Federal Reserve for 15 years, analyzing how government policies affect the economy. She translates complex economics into practical terms.',
  'Wants to help people understand how economic policy affects their financial wellbeing',
  ARRAY['fiscal_policy', 'monetary_policy', 'economic_analysis']
),

(
  'george_historian', 'George Washington III', 'George', 'Washington III', '👨🏿‍🎓',
  'Presidential historian and constitutional scholar',
  'Descendant of the first president and renowned historian specializing in the founding era. Brings unique perspective on constitutional origins.',
  'presidential_historian', 'expert', '56-65', 'Mount Vernon, VA', 'Presidential Historian',
  88, 97, 10, 18, 0.95, 0.95, 1, 'formal', 1,
  'moderate', 'scholarly', 'George grew up hearing family stories about the founding and became a historian to understand that legacy. He specializes in constitutional origins.',
  'Wants to help people understand how the founders\' vision applies to modern challenges',
  ARRAY['constitutional_history', 'founding_fathers', 'presidential_history']
),

(
  'betty_activist', 'Betty Johnson', 'Betty', 'Johnson', '👩🏿‍🦳',
  'Civil rights veteran with 60 years of experience',
  'Participated in the Freedom Rides and has been fighting for civil rights for six decades. Living history of American social movements.',
  'civil_rights_veteran', 'expert', '66+', 'Birmingham, AL', 'Retired Civil Rights Activist',
  75, 90, 12, 20, 0.9, 0.85, 3, 'supportive', 3,
  'high', 'storytelling', 'Betty was arrested during the Freedom Rides at age 19. She\'s spent 60 years fighting for justice and has seen how sustained activism creates change.',
  'Wants to inspire new generations to continue the fight for justice and equality',
  ARRAY['civil_rights_history', 'social_movements', 'voting_rights']
);

-- =============================================================================
-- NPC CATEGORY SPECIALIZATIONS
-- =============================================================================

-- Insert specializations for all NPCs using WITH clause for better readability
WITH npc_specializations AS (
  SELECT 
    np.id as npc_id,
    spec.category,
    spec.specialization_type,
    spec.modifier_percentage,
    spec.confidence_modifier
  FROM npc_personalities np
  JOIN (
    VALUES
    -- Maya Chen (College Student) - Specializations
    ('maya_college', 'student_rights', 'strength', 15, 0.2),
    ('maya_college', 'voting_basics', 'strength', 10, 0.1),
    ('maya_college', 'constitutional_law', 'weakness', -25, -0.3),
    ('maya_college', 'federal_structure', 'weakness', -20, -0.2),

-- David Rodriguez (New Citizen) - Specializations
    ('david_newcomer', 'citizenship', 'strength', 20, 0.3),
    ('david_newcomer', 'immigration_policy', 'strength', 15, 0.2),
    ('david_newcomer', 'historical_context', 'weakness', -15, -0.2),
    ('david_newcomer', 'local_politics', 'weakness', -10, -0.1),

    -- Sarah Williams (Parent) - Specializations
    ('sarah_parent', 'education_policy', 'strength', 20, 0.3),
    ('sarah_parent', 'local_government', 'strength', 15, 0.2),
    ('sarah_parent', 'foreign_policy', 'weakness', -25, -0.3),
    ('sarah_parent', 'constitutional_law', 'weakness', -20, -0.2),

    -- Tyler Brooks (Gamer) - Specializations
    ('tyler_gamer', 'tech_policy', 'strength', 25, 0.3),
    ('tyler_gamer', 'digital_rights', 'strength', 20, 0.2),
    ('tyler_gamer', 'government_structure', 'weakness', -30, -0.4),
    ('tyler_gamer', 'historical_context', 'weakness', -25, -0.3),

-- James Thompson (Veteran) - Specializations
    ('james_veteran', 'veterans_affairs', 'strength', 30, 0.4),
    ('james_veteran', 'national_security', 'strength', 25, 0.3),
    ('james_veteran', 'civic_duty', 'strength', 20, 0.2),
    ('james_veteran', 'social_issues', 'weakness', -10, -0.1),

    -- Lisa Park (Teacher) - Specializations
    ('lisa_teacher', 'civic_education', 'strength', 25, 0.3),
    ('lisa_teacher', 'constitutional_law', 'strength', 20, 0.2),
    ('lisa_teacher', 'youth_engagement', 'strength', 15, 0.2),
    ('lisa_teacher', 'lobbying', 'weakness', -20, -0.2),

    -- Marcus Johnson (Union Organizer) - Specializations
    ('marcus_union', 'labor_rights', 'strength', 30, 0.4),
    ('marcus_union', 'economic_policy', 'strength', 25, 0.3),
    ('marcus_union', 'workers_compensation', 'strength', 20, 0.2),
    ('marcus_union', 'foreign_policy', 'weakness', -20, -0.2),

    -- Anna Foster (Journalist) - Specializations
    ('anna_journalist', 'government_transparency', 'strength', 30, 0.4),
    ('anna_journalist', 'local_politics', 'strength', 25, 0.3),
    ('anna_journalist', 'investigative_journalism', 'strength', 20, 0.2),
    ('anna_journalist', 'partisan_politics', 'weakness', -15, -0.1),

    -- Carlos Mendez (Community Organizer) - Specializations
    ('carlos_activist', 'social_justice', 'strength', 30, 0.4),
    ('carlos_activist', 'community_organizing', 'strength', 25, 0.3),
    ('carlos_activist', 'immigration_rights', 'strength', 20, 0.2),
    ('carlos_activist', 'legislative_process', 'weakness', -20, -0.2),

    -- Emma Davis (Nonprofit Director) - Specializations
    ('emma_nonprofit', 'healthcare_policy', 'strength', 30, 0.4),
    ('emma_nonprofit', 'social_services', 'strength', 25, 0.3),
    ('emma_nonprofit', 'nonprofit_advocacy', 'strength', 20, 0.2),
    ('emma_nonprofit', 'campaign_finance', 'weakness', -15, -0.1),

-- Robert Kim (Mayor) - Specializations
    ('robert_mayor', 'local_government', 'strength', 35, 0.4),
    ('robert_mayor', 'municipal_finance', 'strength', 30, 0.3),
    ('robert_mayor', 'intergovernmental_relations', 'strength', 25, 0.3),
    ('robert_mayor', 'federal_politics', 'weakness', -10, -0.1),

    -- Diane Wilson (Environmental Lobbyist) - Specializations
    ('diane_lobbyist', 'legislative_process', 'strength', 35, 0.4),
    ('diane_lobbyist', 'environmental_policy', 'strength', 30, 0.4),
    ('diane_lobbyist', 'lobbying_ethics', 'strength', 25, 0.3),
    ('diane_lobbyist', 'grassroots_organizing', 'weakness', -15, -0.1),

    -- Michael Chang (Civil Rights Lawyer) - Specializations
    ('michael_lawyer', 'constitutional_law', 'strength', 40, 0.5),
    ('michael_lawyer', 'civil_rights', 'strength', 35, 0.4),
    ('michael_lawyer', 'supreme_court_cases', 'strength', 30, 0.4),
    ('michael_lawyer', 'local_politics', 'weakness', -20, -0.2),

    -- Rachel Adams (Congressional Staffer) - Specializations
    ('rachel_staffer', 'legislative_drafting', 'strength', 35, 0.4),
    ('rachel_staffer', 'congressional_process', 'strength', 30, 0.4),
    ('rachel_staffer', 'policy_analysis', 'strength', 25, 0.3),
    ('rachel_staffer', 'judicial_process', 'weakness', -15, -0.1),

    -- Thomas Lee (Political Science Professor) - Specializations
    ('thomas_professor', 'political_institutions', 'strength', 35, 0.4),
    ('thomas_professor', 'electoral_systems', 'strength', 30, 0.4),
    ('thomas_professor', 'political_behavior', 'strength', 25, 0.3),
    ('thomas_professor', 'practical_politics', 'weakness', -10, -0.1),

-- Helen Rodriguez (Retired Federal Judge) - Specializations
    ('helen_judge', 'constitutional_interpretation', 'strength', 45, 0.5),
    ('helen_judge', 'judicial_process', 'strength', 40, 0.5),
    ('helen_judge', 'federal_courts', 'strength', 35, 0.4),
    ('helen_judge', 'partisan_politics', 'weakness', -20, -0.2),

    -- William Scott (Former Ambassador) - Specializations
    ('william_diplomat', 'foreign_policy', 'strength', 45, 0.5),
    ('william_diplomat', 'international_relations', 'strength', 40, 0.5),
    ('william_diplomat', 'diplomatic_history', 'strength', 35, 0.4),
    ('william_diplomat', 'local_politics', 'weakness', -25, -0.2),

    -- Maria Gonzalez (Former Fed Economist) - Specializations
    ('maria_economist', 'fiscal_policy', 'strength', 45, 0.5),
    ('maria_economist', 'monetary_policy', 'strength', 40, 0.5),
    ('maria_economist', 'economic_analysis', 'strength', 35, 0.4),
    ('maria_economist', 'social_movements', 'weakness', -20, -0.2),

    -- George Washington III (Presidential Historian) - Specializations
    ('george_historian', 'constitutional_history', 'strength', 50, 0.5),
    ('george_historian', 'founding_fathers', 'strength', 45, 0.5),
    ('george_historian', 'presidential_history', 'strength', 40, 0.4),
    ('george_historian', 'current_events', 'weakness', -15, -0.1),

    -- Betty Johnson (Civil Rights Veteran) - Specializations
    ('betty_activist', 'civil_rights_history', 'strength', 45, 0.5),
    ('betty_activist', 'social_movements', 'strength', 40, 0.4),
    ('betty_activist', 'voting_rights', 'strength', 35, 0.4),
    ('betty_activist', 'tech_policy', 'weakness', -30, -0.3)
  ) AS spec(npc_code, category, specialization_type, modifier_percentage, confidence_modifier)
  ON np.npc_code = spec.npc_code
)
INSERT INTO npc_category_specializations (npc_id, category, specialization_type, modifier_percentage, confidence_modifier)
SELECT npc_id, category, specialization_type, modifier_percentage, confidence_modifier
FROM npc_specializations;

COMMIT;

-- Add helpful comments
COMMENT ON COLUMN npc_personalities.first_name IS 'NPC first name for natural conversation';
COMMENT ON COLUMN npc_personalities.last_name IS 'NPC last name for formal contexts';
COMMENT ON COLUMN npc_personalities.byline IS 'Short descriptive tagline for the NPC';
COMMENT ON COLUMN npc_personalities.background_story IS 'Detailed background explaining the NPC motivations and experience';
COMMENT ON COLUMN npc_personalities.age_range IS 'Age range for the NPC (e.g., 26-35, 46-55)';
COMMENT ON COLUMN npc_personalities.location IS 'Geographic location that shapes NPC perspective';
COMMENT ON COLUMN npc_personalities.profession IS 'Current or former profession that informs expertise';
COMMENT ON COLUMN npc_personalities.political_engagement_level IS 'How actively engaged in politics (low, moderate, high)';
COMMENT ON COLUMN npc_personalities.communication_style IS 'How the NPC prefers to communicate';
COMMENT ON COLUMN npc_personalities.preferred_topics IS 'Array of topics the NPC is most interested in discussing';
COMMENT ON COLUMN npc_personalities.learning_motivation IS 'What drives this NPC to learn and engage civically'; 